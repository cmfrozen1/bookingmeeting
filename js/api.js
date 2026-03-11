// js/api.js
const API = {
    async call(path, data = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const formData = new FormData();
            formData.append('path', path);
            
            const user = CacheManager.getUser();
            if (user?.lineUserId) formData.append('lineUserId', user.lineUserId);
            
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    formData.append(key, data[key]);
                }
            });

            const res = await fetch(CONFIG.GAS_URL, { 
                method: 'POST', 
                body: formData,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return await res.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'connection error' };
        }
    },
    
    async getRooms() {
        if (CacheManager.isValid('rooms')) {
            return { success: true, data: CacheManager.getRooms() };
        }
        const result = await this.call('rooms');
        if (result.success) {
            CacheManager.set('rooms_cache', result.data);
        }
        return result;
    },
    
    async getBookings(params) {
        return this.call('bookings', params);
    }
};
