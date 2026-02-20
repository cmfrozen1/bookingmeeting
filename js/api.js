// ========== API CALLS ==========
async function callGAS(path, data = {}) {
    // ถ้าไม่มี user หรือเป็น demo mode ให้ใช้ข้อมูลตัวอย่าง
    if (!window.state?.user?.lineUserId || window.state.user.lineUserId.startsWith('guest_') || window.state.user.lineUserId === 'demo_user') {
        console.log('Demo mode - returning mock data for:', path);
        return getMockData(path, data);
    }

    try {
        const formData = new FormData();
        formData.append('path', path);
        if (window.state.user?.lineUserId) formData.append('lineUserId', window.state.user.lineUserId);
        
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined && data[key] !== null) {
                formData.append(key, data[key]);
            }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // ลดเหลือ 10 วินาที

        const res = await fetch(CONFIG.GAS_URL, { 
            method: 'POST', 
            body: formData,
            signal: controller.signal,
            mode: 'cors' // เพิ่ม mode
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            return { success: false, message: 'Invalid response from server' };
        }
    } catch (error) {
        console.error('API Error:', error);
        
        // ถ้า error ให้ใช้ mock data
        console.log('API failed - using mock data for:', path);
        return getMockData(path, data);
    }
}

// ข้อมูลตัวอย่างสำหรับโหมดสาธิต
function getMockData(path, data) {
    switch(path) {
        case 'rooms':
            return {
                success: true,
                data: window.state?.rooms || [
                    {
                        roomId: 'room1',
                        name: 'ห้องประชุมสีเขียว',
                        capacity: 10,
                        location: 'ชั้น 2',
                        description: 'ห้องประชุมขนาดเล็ก',
                        facilities: 'โปรเจคเตอร์, จอ LCD',
                        imageUrl: ''
                    }
                ]
            };
            
        case 'user/bookings':
            return {
                success: true,
                data: window.state?.myBookings || []
            };
            
        case 'booking':
            if (data.bookingId && window.state?.myBookings) {
                const booking = window.state.myBookings.find(b => b.bookingId === data.bookingId);
                if (booking) {
                    return { success: true, data: booking };
                }
            }
            return { success: false, message: 'Booking not found' };
            
        case 'booking/check-availability':
            return {
                success: true,
                data: {
                    available: true,
                    conflictingBookings: []
                }
            };
            
        case 'admin/stats':
            return {
                success: true,
                data: {
                    users: 5,
                    rooms: 3,
                    bookings: 10,
                    today: 2,
                    pending: 1
                }
            };
            
        default:
            return { success: true, data: [] };
    }
}

// อัปโหลดรูปภาพ
async function uploadImageToDrive(file) {
    // ในโหมดสาธิต ให้ return URL จำลอง
    if (!window.state?.user?.lineUserId || window.state.user.lineUserId.startsWith('guest_')) {
        return 'https://via.placeholder.com/400/1a1d24/06c755?text=Room+Image';
    }
    
    try {
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        const result = await callGAS('uploadImage', {
            fileName: file.name,
            fileType: file.type,
            fileData: base64
        });

        if (result.success) {
            return result.data.fileUrl;
        }
        return null;
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}
