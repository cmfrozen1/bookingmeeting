// แสดง Toast Notification (ปรับปรุง)
function showToast(msg, type = 'success') {
    // ตรวจสอบว่ามี toast เก่าหรือไม่
    const oldToast = document.querySelector('.toast-message');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
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
        font-size: 14px;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 3000);
}

// ฟังก์ชันตรวจสอบเครือข่าย
function checkNetworkConnection() {
    return navigator.onLine;
}

// แสดง loading แบบย่อ
function showMiniLoading(container) {
    if (!container) return;
    const loading = document.createElement('div');
    loading.className = 'mini-loading';
    loading.innerHTML = '<div class="loading-spinner-small"></div>';
    loading.style.cssText = `
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: inherit;
    `;
    container.style.position = 'relative';
    container.appendChild(loading);
    return loading;
}

// ซ่อน loading แบบย่อ
function hideMiniLoading(loading) {
    if (loading && loading.parentNode) {
        loading.remove();
    }
}
