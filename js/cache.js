// js/cache.js
const CacheManager = {
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    
    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    },
    
    isValid(key, maxAge = CONFIG.CACHE_TTL) {
        const timestamp = localStorage.getItem(`${key}_timestamp`);
        if (!timestamp) return false;
        return Date.now() - parseInt(timestamp) < maxAge;
    },
    
    getUser() {
        return this.get('user_cache');
    },
    
    getRooms() {
        return this.get('rooms_cache') || [];
    }
};
