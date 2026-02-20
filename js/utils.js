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
