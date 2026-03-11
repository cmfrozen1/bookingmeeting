// js/liff-init.js
async function initLIFF() {
    try {
        await liff.init({ liffId: CONFIG.LIFF_ID });
        
        if (!liff.isLoggedIn()) {
            liff.login({ scope: 'openid email profile' });
            return;
        }
        
        const profile = await liff.getProfile();
        const userData = {
            lineUserId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl || '',
        };
        
        // อัปเดต UI
        updateUserUI(userData);
        
        // โหลดข้อมูลตามหน้า
        loadPageData();
        
    } catch (error) {
        console.error('LIFF init error:', error);
    }
}

document.addEventListener('DOMContentLoaded', initLIFF);
