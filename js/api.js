// ========== LIFF AUTHENTICATION ==========

// ตัวแปรสำหรับ timeout
let liffTimeout = null;

async function initLIFF() {
    const loading = document.getElementById('initial-loading');
    
    try {
        // ตั้ง timeout 5 วินาที
        liffTimeout = setTimeout(() => {
            console.warn('LIFF initialization timeout - using fallback mode');
            handleLiffFallback();
        }, 5000);

        await liff.init({ liffId: CONFIG.LIFF_ID });
        
        // ยกเลิก timeout เพราะ LIFF โหลดสำเร็จ
        clearTimeout(liffTimeout);
        
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        await loadUserProfile();
        
    } catch (error) {
        console.error('LIFF init error:', error);
        clearTimeout(liffTimeout);
        handleLiffFallback();
    }
}

// โหลดโปรไฟล์ผู้ใช้
async function loadUserProfile() {
    try {
        const profile = await liff.getProfile();
        const idToken = liff.getDecodedIDToken();

        // ลองเรียก API
        const controller = new AbortController();
        const apiTimeout = setTimeout(() => controller.abort(), 8000);

        try {
            const result = await callGAS('user/profile', {
                lineUserId: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl || '',
                email: idToken?.email || ''
            });

            clearTimeout(apiTimeout);

            if (result.success) {
                window.state.user = result.data;
                window.state.isAdmin = window.state.user.role === 'admin';
                window.state.isManager = window.state.isAdmin || window.state.user.role === 'manager';

                // อัปเดต UI
                updateUserUI();
                
                // ซ่อน loading
                hideLoading();
                
                window.state.initialized = true;

                // เรียกฟังก์ชันเฉพาะหน้า (ถ้ามี)
                if (typeof window.onUserReady === 'function') {
                    window.onUserReady();
                }
            } else {
                throw new Error('API failed');
            }
        } catch (apiError) {
            clearTimeout(apiTimeout);
            console.warn('API error - using guest mode:', apiError);
            useGuestMode(profile);
        }
    } catch (error) {
        console.error('Profile load error:', error);
        handleLiffFallback();
    }
}

// โหมดรับเชิญ (เมื่อเชื่อมต่อ LINE ไม่ได้)
function useGuestMode(profile = null) {
    console.log('Using guest mode');
    
    // สร้างข้อมูลผู้ใช้แบบชั่วคราว
    window.state.user = {
        lineUserId: profile?.userId || 'guest_' + Date.now(),
        displayName: profile?.displayName || 'ผู้ใช้รับเชิญ',
        pictureUrl: profile?.pictureUrl || 'https://via.placeholder.com/60/2a2e36/06c755?text=👤',
        email: '',
        role: 'user',
        phone: '',
        department: ''
    };
    
    window.state.isAdmin = false;
    window.state.isManager = false;
    
    // อัปเดต UI
    updateUserUI();
    
    // ซ่อน loading
    hideLoading();
    
    // แสดงแจ้งเตือน
    showToast('กำลังใช้งานโหมดรับเชิญ (ไม่สามารถบันทึกข้อมูลได้)', 'warning');
    
    // โหลดข้อมูลตัวอย่าง
    loadDemoData();
    
    window.state.initialized = true;
    
    // เรียกฟังก์ชันเฉพาะหน้า (ถ้ามี)
    if (typeof window.onUserReady === 'function') {
        window.onUserReady();
    }
}

// จัดการเมื่อ LIFF ล้มเหลว
function handleLiffFallback() {
    console.log('LIFF failed - using demo mode');
    
    // สร้างข้อมูลผู้ใช้ตัวอย่าง
    window.state.user = {
        lineUserId: 'demo_user',
        displayName: 'ผู้ใช้ตัวอย่าง',
        pictureUrl: 'https://via.placeholder.com/60/2a2e36/06c755?text=👤',
        email: 'demo@example.com',
        role: 'user',
        phone: '0812345678',
        department: 'สาธิต'
    };
    
    window.state.isAdmin = false;
    window.state.isManager = false;
    
    // อัปเดต UI
    updateUserUI();
    
    // ซ่อน loading
    hideLoading();
    
    // แสดงแจ้งเตือน
    showToast('กำลังใช้งานโหมดสาธิต (ข้อมูลเป็นตัวอย่าง)', 'warning');
    
    // โหลดข้อมูลตัวอย่าง
    loadDemoData();
    
    window.state.initialized = true;
    
    // เรียกฟังก์ชันเฉพาะหน้า (ถ้ามี)
    if (typeof window.onUserReady === 'function') {
        window.onUserReady();
    }
}

// ซ่อน loading
function hideLoading() {
    const loading = document.getElementById('initial-loading');
    if (loading) {
        loading.classList.add('hide');
        setTimeout(() => {
            loading.style.display = 'none';
        }, 300);
    }
}

// โหลดข้อมูลตัวอย่าง
function loadDemoData() {
    // ข้อมูลห้องตัวอย่าง
    window.state.rooms = [
        {
            roomId: 'room1',
            name: 'ห้องประชุมสีเขียว',
            capacity: 10,
            location: 'ชั้น 2',
            description: 'ห้องประชุมขนาดเล็ก เหมาะสำหรับทีม 5-10 คน',
            facilities: 'โปรเจคเตอร์, จอ LCD, ไวท์บอร์ด',
            imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=500'
        },
        {
            roomId: 'room2',
            name: 'ห้องประชุมสีฟ้า',
            capacity: 20,
            location: 'ชั้น 3',
            description: 'ห้องประชุมขนาดกลาง พร้อมระบบประชุมทางไกล',
            facilities: 'โปรเจคเตอร์, กล้องประชุม, ไมโครโฟน, ไวท์บอร์ด',
            imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500'
        },
        {
            roomId: 'room3',
            name: 'ห้องประชุมใหญ่',
            capacity: 50,
            location: 'ชั้น 5',
            description: 'ห้องประชุมขนาดใหญ่ เหมาะสำหรับจัดสัมมนา',
            facilities: 'โปรเจคเตอร์, จอขนาดใหญ่, เครื่องเสียง, ไมโครโฟน',
            imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500'
        }
    ];
    
    // ข้อมูลการจองตัวอย่าง
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    window.state.myBookings = [
        {
            bookingId: 'booking1',
            title: 'ประชุมทีมพัฒนา',
            roomName: 'ห้องประชุมสีเขียว',
            startTime: new Date(today.setHours(10, 0)).toISOString(),
            endTime: new Date(today.setHours(12, 0)).toISOString(),
            status: 'confirmed',
            attendees: 6,
            userName: 'ผู้ใช้ตัวอย่าง'
        },
        {
            bookingId: 'booking2',
            title: 'ประชุมวางแผนไตรมาส',
            roomName: 'ห้องประชุมสีฟ้า',
            startTime: new Date(tomorrow.setHours(13, 0)).toISOString(),
            endTime: new Date(tomorrow.setHours(15, 0)).toISOString(),
            status: 'pending',
            attendees: 12,
            userName: 'ผู้ใช้ตัวอย่าง'
        }
    ];
    
    // อัปเดต UI ตามหน้า
    if (typeof renderRooms === 'function') renderRooms();
    if (typeof renderMyBookings === 'function') renderMyBookings('all');
    
    // อัปเดตสถิติ
    const statRooms = document.getElementById('stat-rooms');
    const statToday = document.getElementById('stat-today');
    const statPending = document.getElementById('stat-pending');
    
    if (statRooms) statRooms.textContent = '3';
    if (statToday) statToday.textContent = '1';
    if (statPending) statPending.textContent = '1';
    
    // อัปเดตปฏิทิน
    if (typeof renderCalendar === 'function') {
        window.state.dateBookings = {
            [formatDateForInput(today)]: [window.state.myBookings[0]]
        };
        renderCalendar();
    }
}

// อัปเดต UI ตามผู้ใช้ (เหมือนเดิม)
function updateUserUI() {
    // อัปเดตโปรไฟล์ใน navbar
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileRole = document.getElementById('profile-role');
    
    if (profileName) profileName.textContent = window.state.user?.displayName || 'ผู้ใช้';
    if (profileEmail) profileEmail.textContent = window.state.user?.email || '';
    if (profileAvatar) profileAvatar.src = window.state.user?.pictureUrl || 'https://via.placeholder.com/60/2a2e36/06c755?text=...';
    if (profileRole) {
        profileRole.textContent = {
            admin: '👑 ผู้ดูแลระบบ',
            manager: '👥 ผู้จัดการ',
            user: '👤 ผู้ใช้ทั่วไป'
        }[window.state.user?.role] || '👤 ผู้ใช้ทั่วไป';
    }

    // แสดง/ซ่อน elements สำหรับ admin
    document.querySelectorAll('.admin-only').forEach(el => {
        if (window.state.isAdmin) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });

    // แสดง/ซ่อน elements สำหรับ manager
    document.querySelectorAll('.manager-only').forEach(el => {
        if (window.state.isManager) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });

    // แสดงปุ่มจองด่วน (ยกเว้น admin)
    const floatingBtn = document.getElementById('floating-book-btn');
    if (floatingBtn) {
        if (!window.state.isAdmin) floatingBtn.classList.remove('hidden');
        else floatingBtn.classList.add('hidden');
    }

    const quickBookBtn = document.getElementById('quick-book-btn');
    if (quickBookBtn) {
        if (!window.state.isAdmin) quickBookBtn.classList.remove('hidden');
        else quickBookBtn.classList.add('hidden');
    }
}

// ออกจากระบบ
function logout() {
    if (liff.isLoggedIn()) {
        liff.logout();
    }
    window.location.reload();
}

// เริ่มต้นเมื่อโหลดหน้า
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLIFF);
} else {
    // ถ้า DOM โหลดแล้ว เริ่มได้เลย
    setTimeout(initLIFF, 100);
}
