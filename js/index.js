// ========== INDEX PAGE SPECIFIC ==========

// DOM Cache เฉพาะหน้า
$.roomsList = document.getElementById('rooms-list');
$.searchInput = document.getElementById('search-input');
$.statRooms = document.getElementById('stat-rooms');
$.statToday = document.getElementById('stat-today');
$.statPending = document.getElementById('stat-pending');
$.calendarDays = document.getElementById('calendar-days');
$.currentMonth = document.getElementById('current-month');
$.selectedDateBookings = document.getElementById('selected-date-bookings');
$.selectedDateTitle = document.getElementById('selected-date-title');
$.selectedDateBookingsList = document.getElementById('selected-date-bookings-list');

// แสดง skeleton ขณะโหลด
function showSkeleton() {
    if ($.roomsList) {
        $.roomsList.innerHTML = `
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        `;
    }
    
    if ($.calendarDays) {
        $.calendarDays.innerHTML = Array(35).fill(0).map(() => 
            '<div class="calendar-day skeleton"></div>'
        ).join('');
    }
}

// เรียกเมื่อ user พร้อม
window.onUserReady = function() {
    showSkeleton();
    loadInitialData();
};

// โหลดข้อมูลเริ่มต้น
async function loadInitialData() {
    try {
        await Promise.all([
            loadRooms(),
            loadMonthBookings(state.currentMonth.getFullYear(), state.currentMonth.getMonth()),
            loadTodayStats()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// โหลดห้องประชุม
async function loadRooms() {
    try {
        const result = await callGAS('rooms');
        
        if (result.success) {
            state.rooms = result.data || [];
            renderRooms();
        }
    } catch (error) {
        console.error('Load rooms error:', error);
    }
}

// แสดงห้องประชุม
function renderRooms() {
    const search = $.searchInput?.value.toLowerCase() || '';
    const filtered = state.rooms.filter(r => 
        r.name?.toLowerCase().includes(search) || 
        r.location?.toLowerCase().includes(search)
    );

    if (!filtered.length) {
        $.roomsList.innerHTML = `
            <div class="col-span-full text-center py-10 text-gray-400">
                <i class="fas fa-door-open text-3xl mb-3"></i>
                <p>ไม่มีห้องประชุม</p>
            </div>
        `;
        return;
    }

    $.roomsList.innerHTML = filtered.map(r => {
        const imageHtml = r.imageUrl ? 
            `<img src="${r.imageUrl}" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-door-open text-4xl text-[#06c755]\\'></i>';">` : 
            `<i class="fas fa-door-open text-4xl text-[#06c755]"></i>`;
        
        return `
        <div class="room-card" onclick="showRoomDetail('${r.roomId}')">
            <div class="room-image">
                ${imageHtml}
            </div>
            <div class="room-content">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-base">${r.name}</h3>
                    <span class="capacity-badge"><i class="fas fa-users mr-1"></i>${r.capacity}</span>
                </div>
                <p class="text-sm text-gray-400 mb-2"><i class="fas fa-map-marker-alt mr-1"></i> ${r.location || 'ไม่มีข้อมูล'}</p>
                <p class="text-xs text-gray-500 line-clamp-2 mb-3">${r.description || ''}</p>
                <div class="flex justify-between items-center">
                    <span class="badge badge-available">ว่าง</span>
                    <button class="text-[#06c755] text-sm" onclick="showBookingModal('${r.roomId}'); event.stopPropagation();">
                        <i class="fas fa-calendar-plus mr-1"></i>จอง
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// โหลดสถิติวันนี้
async function loadTodayStats() {
    try {
        const result = await callGAS('admin/stats');
        if (result.success) {
            $.statRooms.textContent = result.data.rooms || 0;
            $.statToday.textContent = result.data.today || 0;
            $.statPending.textContent = result.data.pending || 0;
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// ========== CALENDAR FUNCTIONS ==========
async function loadMonthBookings(year, month) {
    try {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const startStr = formatDateForInput(startDate);
        const endStr = formatDateForInput(endDate);
        
        const result = await callGAS('bookings', {
            startDate: startStr,
            endDate: endStr,
            showPast: 'true'
        });
        
        if (result.success) {
            state.dateBookings = {};
            result.data.bookings.forEach(booking => {
                const date = new Date(booking.startTime).toISOString().split('T')[0];
                if (!state.dateBookings[date]) {
                    state.dateBookings[date] = [];
                }
                state.dateBookings[date].push(booking);
            });
            
            renderCalendar();
        }
    } catch (error) {
        console.error('Load month bookings error:', error);
        renderCalendar();
    }
}

function renderCalendar() {
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    $.currentMonth.textContent = formatMonthThai(state.currentMonth);
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    let html = '';
    
    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        const dateStr = formatDateForInput(date);
        const hasBooking = state.dateBookings[dateStr]?.length > 0;
        const bookingCount = state.dateBookings[dateStr]?.length || 0;
        const isToday = isSameDay(date, new Date());
        
        html += renderCalendarDay(day, true, hasBooking, isToday, dateStr, bookingCount);
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDateForInput(date);
        const bookings = state.dateBookings[dateStr] || [];
        const hasBooking = bookings.length > 0;
        const bookingCount = bookings.length;
        const isToday = isSameDay(date, new Date());
        const isSelected = isSameDay(date, state.selectedDate);
        
        html += renderCalendarDay(day, false, hasBooking, isToday, dateStr, bookingCount, isSelected);
    }
    
    // Next month days
    const totalCells = 42;
    const remainingCells = totalCells - (startDay + totalDays);
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        const dateStr = formatDateForInput(date);
        const hasBooking = state.dateBookings[dateStr]?.length > 0;
        const bookingCount = state.dateBookings[dateStr]?.length || 0;
        
        html += renderCalendarDay(day, true, hasBooking, false, dateStr, bookingCount);
    }
    
    $.calendarDays.innerHTML = html;
}

function renderCalendarDay(day, isOtherMonth, hasBooking, isToday, dateStr, bookingCount = 0, isSelected = false) {
    let classes = 'calendar-day';
    if (isOtherMonth) classes += ' other-month';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';
    if (hasBooking) {
        classes += ' has-booking';
        if (bookingCount > 1) {
            classes += ' multiple';
        }
    }
    
    return `
        <div class="${classes}" onclick="selectDate('${dateStr}')">
            ${day}
        </div>
    `;
}

window.selectDate = async function(dateStr) {
    state.selectedDate = new Date(dateStr);
    renderCalendar();
    
    const result = await callGAS('bookings', {
        date: dateStr,
        showPast: 'true'
    });
    
    if (result.success && result.data.bookings.length > 0) {
        const bookings = result.data.bookings;
        const dateObj = new Date(dateStr);
        const dateThai = dateObj.toLocaleDateString('th-TH', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        
        $.selectedDateTitle.textContent = `📅 การจองวันที่ ${dateThai}`;
        $.selectedDateBookingsList.innerHTML = bookings.map(b => {
            const statusClass = b.status === 'confirmed' ? '' : 'pending';
            return `
                <div class="date-booking-item ${statusClass}" onclick="showBookingDetail('${b.bookingId}')">
                    <div class="date-booking-time">
                        <i class="far fa-clock mr-1"></i> ${formatTime(b.startTime)} - ${formatTime(b.endTime)}
                    </div>
                    <div class="date-booking-title">${b.title}</div>
                    <div class="date-booking-room">${b.roomName} | โดย: ${b.userName}</div>
                </div>
            `;
        }).join('');
        
        $.selectedDateBookings.classList.remove('hidden');
    } else {
        $.selectedDateBookings.classList.add('hidden');
    }
};

window.changeMonth = function(delta) {
    const newMonth = new Date(state.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    state.currentMonth = newMonth;
    loadMonthBookings(newMonth.getFullYear(), newMonth.getMonth());
};

window.goToToday = function() {
    state.currentMonth = new Date();
    state.selectedDate = new Date();
    loadMonthBookings(state.currentMonth.getFullYear(), state.currentMonth.getMonth());
    selectDate(formatDateForInput(new Date()));
};

window.showAllRooms = function() {
    $.searchInput.value = '';
    renderRooms();
};

// ========== ROOM DETAIL ==========
window.showRoomDetail = async function(roomId) {
    const modal = document.getElementById('room-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const modalBookBtn = document.getElementById('modal-book-btn');
    const modalAdminControls = document.getElementById('modal-admin-controls');
    
    modal.classList.add('active');
    modalBody.innerHTML = '<div class="flex justify-center py-10"><div class="loading-spinner w-10 h-10"></div></div>';
    
    const result = await callGAS('room', { roomId });
    
    if (result.success) {
        const room = result.data;
        state.currentRoom = room;
        modalTitle.textContent = room.name;

        const facilities = room.facilities ? room.facilities.split(',').map(f => f.trim()) : [];

        const today = new Date();
        const dateStr = formatDateForInput(today);
        const bookingsResult = await callGAS('bookings', { 
            roomId, 
            date: dateStr,
            showPast: 'false'
        });
        
        const todayBookings = bookingsResult.success ? bookingsResult.data.bookings : [];

        const imageHtml = room.imageUrl ? 
            `<img src="${room.imageUrl}" class="w-full max-h-80 object-cover rounded-xl mb-4" loading="lazy" onerror="this.style.display='none';">` : 
            `<div class="w-full h-48 flex items-center justify-center bg-gradient-to-br from-[#2a2e36] to-[#1a1d24] rounded-xl mb-4">
                <i class="fas fa-door-open text-6xl text-[#06c755]"></i>
            </div>`;

        modalBody.innerHTML = `
            ${imageHtml}
            <div class="flex gap-2 mb-4 flex-wrap">
                <span class="capacity-badge"><i class="fas fa-users mr-1"></i> รองรับ ${room.capacity} คน</span>
                <span class="badge badge-available">พร้อมใช้งาน</span>
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-400 mb-1"><i class="fas fa-map-marker-alt mr-2"></i> สถานที่</p>
                <p class="mb-3">${room.location || 'ไม่มีข้อมูล'}</p>
            </div>
            
            <div class="mb-4">
                <p class="text-sm text-gray-400 mb-1"><i class="fas fa-info-circle mr-2"></i> รายละเอียด</p>
                <p class="whitespace-pre-wrap">${room.description || 'ไม่มีรายละเอียด'}</p>
            </div>
            
            ${facilities.length > 0 ? `
                <div class="mb-4">
                    <p class="text-sm text-gray-400 mb-2"><i class="fas fa-couch mr-2"></i> สิ่งอำนวยความสะดวก</p>
                    <div>
                        ${facilities.map(f => `<span class="facility-tag">${f}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${todayBookings.length > 0 ? `
                <div class="mt-4 pt-4 border-t border-[#2a2e36]">
                    <p class="text-sm text-gray-400 mb-2"><i class="fas fa-clock mr-2"></i> การจองวันนี้</p>
                    <div class="space-y-2">
                        ${todayBookings.map(b => {
                            const statusColor = {
                                'confirmed': 'text-green-500',
                                'pending': 'text-yellow-500',
                                'cancelled': 'text-gray-500',
                                'rejected': 'text-red-500'
                            }[b.status] || 'text-gray-500';
                            
                            return `
                                <div class="bg-[#111317] p-2 rounded-lg text-sm">
                                    <div class="flex justify-between">
                                        <span class="font-semibold">${formatTime(b.startTime)} - ${formatTime(b.endTime)}</span>
                                        <span class="${statusColor}">${b.status === 'confirmed' ? 'จองแล้ว' : b.status}</span>
                                    </div>
                                    <p class="text-xs text-gray-400">${b.title}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        modalBookBtn.onclick = () => showBookingModal(roomId);

        if (state.isAdmin) {
            modalAdminControls.classList.remove('hidden');
        } else {
            modalAdminControls.classList.add('hidden');
        }
    }
};

// ========== SEARCH ==========
let searchTimer;
$.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        renderRooms();
    }, 300);
});
