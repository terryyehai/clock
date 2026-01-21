const CACHE_NAME = 'fliptime-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './index.css',
    './index.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js',
    'https://cdn.jsdelivr.net/npm/dayjs@1/plugin/utc.js',
    'https://cdn.jsdelivr.net/npm/dayjs@1/plugin/timezone.js',
    'https://cdn.jsdelivr.net/npm/lunar-javascript@1.6.12/lunar.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
