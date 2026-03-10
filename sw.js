// sw.js - Service Worker สำหรับ Offline Support
const CACHE_NAME = 'meeting-room-v1';
const STATIC_CACHE_NAME = 'meeting-room-static-v1';

// ไฟล์ที่ต้องการ Cache ไว้ใช้งานแบบ Offline
const urlsToCache = [
  '/',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://static.line-scdn.net/liff/edge/2.1/sdk.js',
  'https://cdn-icons-png.flaticon.com/512/1040/1040244.png'
];

// Install Event - Cache ไฟล์ static
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - ลบ Cache เก่า
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - ใช้ Cache First strategy
self.addEventListener('fetch', event => {
  // ข้าม request ที่ไม่ใช่ GET
  if (event.request.method !== 'GET') return;

  // API requests - Network First
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // เก็บ response ไว้ใน cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static files - Cache First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return from cache
        }
        
        // ถ้าไม่มีใน cache ให้ fetch จาก network
        return fetch(event.request).then(response => {
          // ตรวจสอบว่า response valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // เก็บไว้ใน cache
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });

          return response;
        });
      })
      .catch(() => {
        // Fallback สำหรับ failed requests
        if (event.request.url.includes('.css')) {
          return new Response('', { status: 200, statusText: 'OK' });
        }
      })
  );
});

// Background Sync สำหรับการจองเมื่อออฟไลน์
self.addEventListener('sync', event => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  try {
    const db = await openDB();
    const offlineBookings = await db.getAll('offlineBookings');
    
    for (const booking of offlineBookings) {
      try {
        const response = await fetch(booking.url, {
          method: 'POST',
          body: booking.data
        });
        
        if (response.ok) {
          await db.delete('offlineBookings', booking.id);
          
          // แจ้งเตือนผู้ใช้ว่าซิงค์สำเร็จ
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_COMPLETE',
                bookingId: booking.id
              });
            });
          });
        }
      } catch (error) {
        console.error('Sync failed for booking:', booking.id);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MeetingRoomDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineBookings')) {
        db.createObjectStore('offlineBookings', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}
