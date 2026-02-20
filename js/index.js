// ========== INDEX PAGE SPECIFIC ==========

// ตรวจสอบว่า state ถูกสร้างหรือยัง
if (!window.state) {
    window.state = {
        rooms: [],
        myBookings: [],
        currentMonth: new Date(),
        selectedDate: new Date(),
        dateBookings: {}
    };
}

// DOM Cache เฉพาะหน้า (เพิ่มตรวจสอบ null)
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

// ถ้าไม่มี element ให้สร้าง object ว่าง
if (!$.roomsList) {
    console.warn('Some DOM elements not found');
    $ = {};
}

// แสดง skeleton ทันทีที่โหลดหน้า
document.addEventListener('DOMContentLoaded', function() {
    showSkeleton();
});
