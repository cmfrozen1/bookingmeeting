// ========== CONFIGURATION ==========
const CONFIG = {
    GAS_URL: 'https://script.google.com/macros/s/AKfycbwEkTSINEvnyBdapUWbJ8djVpdLt6rN7NlaXn5cKMow7RJtY3gI19-RSMyFHsWBxII-vA/exec',
    LIFF_ID: '2008904120-nqYHD5BT',
    PAGE_SIZE: 20,
    APP_VERSION: '1.0.0'
};

// ========== GLOBAL STATE ==========
window.state = {
    user: null,
    rooms: [],
    bookings: [],
    myBookings: [],
    pendingBookings: [],
    users: [],
    currentDate: new Date(),
    currentMonth: new Date(),
    selectedDate: new Date(),
    dateBookings: {},
    currentRoom: null,
    currentBooking: null,
    isAdmin: false,
    isManager: false,
    settings: { 
        appName: 'Meeting Room',
        requireApproval: 'true',
        reminderMinutes: '30'
    },
    initialized: false
};

// ========== DOM CACHE (จะถูกตั้งค่าในแต่ละหน้า) ==========
window.$ = {};
