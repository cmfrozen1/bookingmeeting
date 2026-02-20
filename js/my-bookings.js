// ========== MY BOOKINGS PAGE SPECIFIC ==========

// DOM Cache เฉพาะหน้า
$.myBookingsList = document.getElementById('my-bookings-list');

// เรียกเมื่อ user พร้อม
window.onUserReady = function() {
    loadMyBookings();
};

// โหลดการจองของฉัน
async function loadMyBookings() {
    try {
        const result = await callGAS('user/bookings', {
            lineUserId: state.user?.lineUserId
        });

        if (result.success) {
            state.myBookings = result.data || [];
            renderMyBookings('all');
        }
    } catch (error) {
        console.error('Load my bookings error:', error);
    }
}

// แสดงการจองของฉัน
function renderMyBookings(filter = 'all') {
    let filtered = state.myBookings;
    
    if (filter !== 'all') {
        filtered = filtered.filter(b => b.status === filter);
    }

    const now = new Date();
    filtered = filtered.filter(b => {
        if (b.status === 'pending') return true;
        const endTime = new Date(b.endTime);
        return endTime >= now;
    });

    if (!filtered.length) {
        $.myBookingsList.innerHTML = `
            <div class="col-span-full text-center py-10 text-gray-400">
                <i class="fas fa-calendar-times text-3xl mb-3"></i>
                <p>ไม่พบการจอง</p>
                <button class="btn-primary text-sm mt-3" onclick="window.location.href='index.html?action=book'">
                    <i class="fas fa-plus mr-1"></i>จองห้องแรก
                </button>
            </div>
        `;
        return;
    }

    $.myBookingsList.innerHTML = filtered.map(b => {
        const statusClass = {
            'confirmed': 'badge-confirmed',
            'pending': 'badge-pending',
            'cancelled': 'badge-cancelled',
            'rejected': 'badge-rejected'
        }[b.status] || 'badge-pending';
        
        const statusText = {
            'confirmed': 'อนุมัติแล้ว',
            'pending': 'รออนุมัติ',
            'cancelled': 'ยกเลิก',
            'rejected': 'ปฏิเสธ'
        }[b.status] || b.status;
        
        return `
        <div class="booking-card" onclick="showBookingDetail('${b.bookingId}')">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold">${b.title}</h3>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <p class="text-sm text-[#06c755] mb-2">${b.roomName}</p>
            <p class="text-xs text-gray-400 mb-2">
                <i class="far fa-calendar mr-1"></i> ${formatDateShort(b.startTime)} - ${formatDateShort(b.endTime)}<br>
                <i class="far fa-clock mr-1"></i> ${formatTime(b.startTime)} - ${formatTime(b.endTime)}
            </p>
            <div class="flex justify-between items-center text-xs">
                <span class="text-gray-500"><i class="fas fa-users mr-1"></i> ${b.attendees || 0} คน</span>
                ${b.meetingLink ? '<span class="text-blue-500"><i class="fas fa-video mr-1"></i> มีลิงค์</span>' : ''}
                ${b.status === 'confirmed' ? `
                    <button class="text-red-500" onclick="cancelBooking('${b.bookingId}'); event.stopPropagation();">
                        <i class="fas fa-times mr-1"></i>ยกเลิก
                    </button>
                ` : ''}
            </div>
            <div class="mt-2 flex gap-2">
                <button class="text-xs text-[#06c755]" onclick="shareBooking('${b.bookingId}'); event.stopPropagation();">
                    <i class="fas fa-share-alt mr-1"></i>แชร์
                </button>
            </div>
        </div>
    `}).join('');
}

// แสดงรายละเอียดการจอง
window.showBookingDetail = async function(bookingId) {
    const modal = document.getElementById('booking-modal');
    const modalBody = document.getElementById('booking-modal-body');
    const modalFooter = document.getElementById('booking-modal-footer');
    
    modal.classList.add('active');
    modalBody.innerHTML = '<div class="flex justify-center py-10"><div class="loading-spinner w-10 h-10"></div></div>';
    
    const result = await callGAS('booking', { bookingId });
    
    if (result.success) {
        const b = result.data;
        state.currentBooking = b;
        
        const statusClass = {
            'confirmed': 'badge-confirmed',
            'pending': 'badge-pending',
            'cancelled': 'badge-cancelled',
            'rejected': 'badge-rejected'
        }[b.status] || 'badge-pending';
        
        const statusText = {
            'confirmed': 'อนุมัติแล้ว',
            'pending': 'รออนุมัติ',
            'cancelled': 'ยกเลิก',
            'rejected': 'ปฏิเสธ'
        }[b.status] || b.status;

        modalBody.innerHTML = `
            <div class="mb-4">
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-400 mb-1">หัวข้อ</p>
                <p class="text-lg font-semibold">${b.title}</p>
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-400 mb-1">ห้องประชุม</p>
                <p class="text-[#06c755]">${b.roomName}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <p class="text-sm text-gray-400 mb-1">วันที่เริ่ม</p>
                    <p>${formatDateShort(b.startTime)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-400 mb-1">วันที่สิ้นสุด</p>
                    <p>${formatDateShort(b.endTime)}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div>
                    <p class="text-sm text-gray-400 mb-1">เวลาเริ่ม</p>
                    <p>${formatTime(b.startTime)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-400 mb-1">เวลาสิ้นสุด</p>
                    <p>${formatTime(b.endTime)}</p>
                </div>
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-400 mb-1">จำนวนผู้เข้าร่วม</p>
                <p>${b.attendees || 0} คน</p>
            </div>
            
            ${b.meetingLink ? `
                <div class="mb-4">
                    <p class="text-sm text-gray-400 mb-1">ลิงค์ประชุม</p>
                    <a href="${b.meetingLink}" target="_blank" class="text-[#06c755] underline break-all">${b.meetingLink}</a>
                </div>
            ` : ''}
            
            ${b.description ? `
                <div class="mb-4">
                    <p class="text-sm text-gray-400 mb-1">รายละเอียด</p>
                    <p class="whitespace-pre-wrap">${b.description}</p>
                </div>
            ` : ''}
            
            <div class="text-xs text-gray-500 border-t border-[#2a2e36] pt-3">
                <p>จองโดย: ${b.userName}</p>
                <p class="mt-1">${formatDateTime(b.createdAt)}</p>
            </div>
        `;

        const now = new Date();
        const endTime = new Date(b.endTime);
        const canCancel = b.status === 'confirmed' && endTime > now && b.userId === state.user?.lineUserId;
        
        modalFooter.innerHTML = `
            ${canCancel ? `
                <button class="btn-danger flex-1" onclick="cancelBooking('${b.bookingId}')">
                    <i class="fas fa-times mr-2"></i>ยกเลิกการจอง
                </button>
            ` : ''}
            <button class="btn-outline flex-1" onclick="shareBooking('${b.bookingId}')">
                <i class="fas fa-share-alt mr-2"></i>แชร์
            </button>
            <button class="btn-outline flex-1" onclick="closeBookingDetailModal()">ปิด</button>
        `;
    }
};

window.closeBookingDetailModal = function() {
    document.getElementById('booking-modal').classList.remove('active');
    state.currentBooking = null;
};

// ยกเลิกการจอง
window.cancelBooking = async function(bookingId) {
    const result = await Swal.fire({
        title: 'ยกเลิกการจอง',
        text: 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'ใช่, ยกเลิก',
        cancelButtonText: 'ปิด'
    });

    if (result.isConfirmed) {
        const apiResult = await callGAS('booking/cancel', { 
            bookingId,
            lineUserId: state.user?.lineUserId
        });

        if (apiResult.success) {
            showToast('ยกเลิกการจองสำเร็จ');
            closeBookingDetailModal();
            await loadMyBookings();
        } else {
            showToast(apiResult.message || 'ยกเลิกไม่สำเร็จ', 'error');
        }
    }
};

// แชร์การจอง
window.shareBooking = async function(bookingId) {
    try {
        const result = await callGAS('booking', { bookingId });
        if (!result.success) {
            showToast('ไม่พบข้อมูลการจอง', 'error');
            return;
        }

        const booking = result.data;
        
        // สร้างข้อความสำหรับแชร์
        const statusText = {
            'confirmed': '✅ อนุมัติแล้ว',
            'pending': '⏳ รออนุมัติ',
            'cancelled': '❌ ยกเลิก',
            'rejected': '❌ ปฏิเสธ'
        }[booking.status] || booking.status;
        
        const message = `📅 การจอง: ${booking.title}
🏢 ห้อง: ${booking.roomName}
📆 วันที่: ${formatDateThai(booking.startTime)} - ${formatDateThai(booking.endTime)}
⏰ เวลา: ${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}
👥 ผู้เข้าร่วม: ${booking.attendees} คน
📌 สถานะ: ${statusText}
👤 ผู้จอง: ${booking.userName}`;

        // คัดลอกไปคลิปบอร์ด
        await navigator.clipboard.writeText(message);
        showToast('คัดลอกข้อมูลการจองแล้ว');
        
    } catch (error) {
        console.error('Share error:', error);
        showToast('ไม่สามารถแชร์ได้', 'error');
    }
};

// Event Listeners
document.querySelectorAll('[data-booking-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-booking-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMyBookings(btn.dataset.bookingFilter);
    });
});
