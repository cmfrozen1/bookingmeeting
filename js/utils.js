// ========== UTILITY FUNCTIONS ==========

// แสดง Toast Notification
function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 16px;
        right: 16px;
        background: #1a1d24;
        border-left: 4px solid ${type === 'success' ? '#06c755' : type === 'warning' ? '#f59e0b' : '#ef4444'};
        border-radius: 12px;
        padding: 12px 16px;
        color: white;
        z-index: 2000;
        max-width: 400px;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ตั้งค่า Loading state ให้ปุ่ม
function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// จัดรูปแบบวันที่ (ไทย)
function formatDateThai(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        weekday: 'long'
    });
}

// จัดรูปแบบวันที่แบบสั้น
function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric'
    });
}

// จัดรูปแบบเวลา
function formatTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// จัดรูปแบบวันที่และเวลา
function formatDateTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// จัดรูปแบบวันที่สำหรับ input
function formatDateForInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// จัดรูปแบบเดือนภาษาไทย
function formatMonthThai(date) {
    return date.toLocaleDateString('th-TH', { 
        month: 'long', 
        year: 'numeric' 
    });
}

// ตรวจสอบว่าเป็นวันเดียวกันหรือไม่
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// แก้ไข URL ให้โหลดแบบไม่ต้องรีเฟรช
function navigateTo(page, params = {}) {
    const url = new URL(page, window.location.origin);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    // ใช้ History API เพื่อเปลี่ยน URL แบบไม่โหลดหน้า
    history.pushState({ page }, '', url);
    
    // โหลดเนื้อหาใหม่
    loadPageContent(page);
}

// โหลดเนื้อหาตาม URL (สำหรับ SPA-like behavior)
async function loadPageContent(page) {
    try {
        const response = await fetch(page);
        const html = await response.text();
        
        // แยกเฉพาะส่วน main content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const mainContent = doc.querySelector('main') || doc.body;
        
        document.querySelector('main')?.remove();
        document.body.insertAdjacentHTML('beforeend', mainContent.outerHTML);
        
        // โหลด script เฉพาะหน้า
        const scripts = doc.querySelectorAll('script[data-page]');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.src = script.src;
            newScript.dataset.page = script.dataset.page;
            document.body.appendChild(newScript);
        });
    } catch (error) {
        console.error('Error loading page:', error);
    }
}

// จัดการปุ่ม back/forward
window.addEventListener('popstate', (event) => {
    if (event.state?.page) {
        loadPageContent(event.state.page);
    } else {
        loadPageContent('index.html');
    }
});

// ========== MODAL FUNCTIONS ==========

// ปิด modal รายละเอียดห้อง
window.closeModal = function() {
    document.getElementById('room-modal')?.classList.remove('active');
    state.currentRoom = null;
};

// ปิด modal สร้าง/แก้ไขห้อง
window.closeRoomModal = function() {
    document.getElementById('room-create-modal')?.classList.remove('active');
};

// ปิด modal สร้าง/แก้ไขการจอง
window.closeBookingCreateModal = function() {
    document.getElementById('booking-create-modal')?.classList.remove('active');
};

// ปิด modal รายละเอียดการจอง
window.closeBookingDetailModal = function() {
    document.getElementById('booking-modal')?.classList.remove('active');
    state.currentBooking = null;
};

// ปิด modal โปรไฟล์
window.closeProfileModal = function() {
    document.getElementById('profile-modal')?.classList.remove('active');
};

// แสดง modal จองห้อง
window.showBookingModal = function(roomId = null) {
    const modal = document.getElementById('booking-create-modal');
    const title = document.getElementById('booking-modal-title');
    const bookingId = document.getElementById('edit-booking-id');
    const roomSelect = document.getElementById('booking-room');
    const titleInput = document.getElementById('booking-title');
    const description = document.getElementById('booking-description');
    const meetingLink = document.getElementById('booking-meeting-link');
    const attendees = document.getElementById('booking-attendees');
    const status = document.getElementById('availability-status');
    const saveBtn = document.getElementById('save-booking-btn');
    
    title.textContent = 'จองห้องประชุม';
    bookingId.value = '';
    titleInput.value = '';
    description.value = '';
    meetingLink.value = '';
    attendees.value = '4';
    status.classList.add('hidden');
    saveBtn.disabled = false;
    
    // เตรียม select ห้อง
    roomSelect.innerHTML = '<option value="">เลือกห้องประชุม</option>';
    state.rooms.forEach(r => {
        const option = document.createElement('option');
        option.value = r.roomId;
        option.textContent = `${r.name} (${r.capacity} ที่นั่ง)`;
        if (r.roomId === roomId) option.selected = true;
        roomSelect.appendChild(option);
    });
    
    // ตั้งค่าเริ่มต้นเวลา
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    
    const endTime = new Date(nextHour);
    endTime.setHours(nextHour.getHours() + 1, 0, 0, 0);
    
    document.getElementById('booking-date').value = formatDateForInput(nextHour);
    document.getElementById('booking-end-date').value = formatDateForInput(nextHour);
    document.getElementById('booking-start').value = nextHour.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('booking-end').value = endTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    modal.classList.add('active');
};

// แสดง modal โปรไฟล์
window.showProfileSettings = function() {
    document.getElementById('profile-phone').value = state.user?.phone || '';
    document.getElementById('profile-department').value = state.user?.department || '';
    document.getElementById('profile-modal').classList.add('active');
};

// บันทึกโปรไฟล์
window.saveProfile = async function(e) {
    e.preventDefault();
    
    const saveBtn = e.submitter;
    setButtonLoading(saveBtn, true);

    const data = {
        phone: document.getElementById('profile-phone').value,
        department: document.getElementById('profile-department').value,
        lineUserId: state.user?.lineUserId
    };

    const result = await callGAS('user/update', data);
    if (result.success) {
        showToast('บันทึกสำเร็จ');
        Object.assign(state.user, data);
        closeProfileModal();
    } else {
        showToast(result.message || 'บันทึกไม่สำเร็จ', 'error');
    }

    setButtonLoading(saveBtn, false);
};

// ตรวจสอบความพร้อมของห้อง
async function checkAvailability() {
    const roomId = document.getElementById('booking-room').value;
    const startDate = document.getElementById('booking-date').value;
    const endDate = document.getElementById('booking-end-date').value;
    const start = document.getElementById('booking-start').value;
    const end = document.getElementById('booking-end').value;
    const status = document.getElementById('availability-status');
    const saveBtn = document.getElementById('save-booking-btn');
    
    if (!roomId || !startDate || !endDate || !start || !end) return;
    
    const startDateTime = new Date(`${startDate}T${start}:00`);
    const endDateTime = new Date(`${endDate}T${end}:00`);
    
    if (startDateTime >= endDateTime) {
        status.innerHTML = '<span class="text-red-500">⚠️ เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม</span>';
        status.classList.remove('hidden');
        saveBtn.disabled = true;
        return;
    }
    
    const startHour = startDateTime.getHours();
    const endHour = endDateTime.getHours();
    if (startHour < 8 || endHour > 20 || (endHour === 20 && endDateTime.getMinutes() > 0)) {
        status.innerHTML = '<span class="text-red-500">⚠️ เวลาทำการ 08:00 - 20:00 น.</span>';
        status.classList.remove('hidden');
        saveBtn.disabled = true;
        return;
    }
    
    const durationHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
    if (durationHours > 24) {
        status.innerHTML = '<span class="text-red-500">⚠️ จองได้ครั้งละไม่เกิน 24 ชั่วโมง</span>';
        status.classList.remove('hidden');
        saveBtn.disabled = true;
        return;
    }
    
    const result = await callGAS('booking/check-availability', {
        roomId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
    });
    
    if (result.success) {
        if (result.data.available) {
            status.innerHTML = '<span class="text-green-500">✅ ห้องว่างในช่วงเวลาที่เลือก</span>';
            status.classList.remove('hidden');
            saveBtn.disabled = false;
        } else {
            let message = '❌ ห้องไม่ว่างในช่วงเวลาที่เลือก';
            if (result.data.conflictingBookings && result.data.conflictingBookings.length > 0) {
                const times = result.data.conflictingBookings.map(c => 
                    `${formatTime(c.startTime)}-${formatTime(c.endTime)}`
                ).join(', ');
                message = `❌ มีการจองแล้วในช่วงเวลา: ${times}`;
            }
            status.innerHTML = `<span class="text-red-500">${message}</span>`;
            status.classList.remove('hidden');
            saveBtn.disabled = true;
        }
    }
}

// บันทึกการจอง
window.saveBooking = async function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('save-booking-btn');
    if (btn.disabled) return;
    
    setButtonLoading(btn, true);

    try {
        const id = document.getElementById('edit-booking-id').value;
        const roomId = document.getElementById('booking-room').value;
        const startDate = document.getElementById('booking-date').value;
        const endDate = document.getElementById('booking-end-date').value;
        const start = document.getElementById('booking-start').value;
        const end = document.getElementById('booking-end').value;
        
        const startDateTime = new Date(`${startDate}T${start}:00`);
        const endDateTime = new Date(`${endDate}T${end}:00`);
        
        const data = {
            roomId,
            title: document.getElementById('booking-title').value,
            description: document.getElementById('booking-description').value,
            meetingLink: document.getElementById('booking-meeting-link').value,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            attendees: document.getElementById('booking-attendees').value,
            userName: state.user?.displayName,
            lineUserId: state.user?.lineUserId
        };

        if (id) data.bookingId = id;

        const result = await callGAS(id ? 'booking/update' : 'booking/create', data);

        if (result.success) {
            showToast(id ? 'แก้ไขการจองสำเร็จ' : 'จองห้องสำเร็จ');
            closeBookingCreateModal();
            
            // รีเฟรชข้อมูลตามหน้าที่อยู่
            if (window.location.pathname.includes('my-bookings')) {
                await loadMyBookings();
            } else {
                await loadRooms();
                if (typeof loadMonthBookings === 'function') {
                    await loadMonthBookings(state.currentMonth.getFullYear(), state.currentMonth.getMonth());
                }
            }
            
            // ถ้าเป็น admin และกำลังดู pending ให้รีเฟรช
            if (state.isManager && document.getElementById('admin-pending-tab')?.classList.contains('hidden') === false) {
                await loadPendingBookings();
            }
        } else {
            showToast(result.message || 'เกิดข้อผิดพลาด', 'error');
        }
    } catch (error) {
        console.error('Save booking error:', error);
        showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};

// เพิ่ม Event Listeners สำหรับตรวจสอบความพร้อม
document.addEventListener('DOMContentLoaded', () => {
    const bookingRoom = document.getElementById('booking-room');
    const bookingDate = document.getElementById('booking-date');
    const bookingEndDate = document.getElementById('booking-end-date');
    const bookingStart = document.getElementById('booking-start');
    const bookingEnd = document.getElementById('booking-end');
    
    if (bookingRoom) bookingRoom.addEventListener('change', checkAvailability);
    if (bookingDate) bookingDate.addEventListener('change', checkAvailability);
    if (bookingEndDate) bookingEndDate.addEventListener('change', checkAvailability);
    if (bookingStart) bookingStart.addEventListener('change', checkAvailability);
    if (bookingEnd) bookingEnd.addEventListener('change', checkAvailability);
    
    // เริ่มต้น Flatpickr
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#booking-date", {
            locale: "th",
            dateFormat: "Y-m-d",
            minDate: "today",
            onChange: checkAvailability
        });
        
        flatpickr("#booking-end-date", {
            locale: "th",
            dateFormat: "Y-m-d",
            minDate: "today",
            onChange: checkAvailability
        });
        
        flatpickr("#booking-start", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            minTime: "08:00",
            maxTime: "20:00",
            minuteIncrement: 15,
            onChange: checkAvailability
        });
        
        flatpickr("#booking-end", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            minTime: "08:00",
            maxTime: "20:00",
            minuteIncrement: 15,
            onChange: checkAvailability
        });
    }
});
