// Service Worker - دستیار و مدیریت عبادات
// هدف: کش کردن پوسته‌ی برنامه (شامل اسکریپت Tailwind از CDN) تا پس از اولین بازدید آنلاین،
// برنامه به‌طور کامل بدون اینترنت هم اجرا شود.

const CACHE_NAME = 'ebadat-app-cache-v5';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                APP_SHELL.map((url) =>
                    cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
                        // اگر یک منبع (مثلاً CDN) به دلیل نبود اینترنت قابل کش شدن نبود، نصب را متوقف نکن
                        console.warn('SW cache skip:', url, err);
                    })
                )
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// استراتژی: ابتدا شبکه (برای گرفتن آخرین نسخه)، در صورت شکست/آفلاین بودن، از کش سرو کن.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                const clone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return networkResponse;
            })
            .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
});
