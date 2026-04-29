const CACHE_NAME = "toko-cache-v5";

const urlsToCache = [
    "/app-toko/",
    "/app-toko/index.html",
    "/app-toko/app.js",
    "/app-toko/manifest.json",
    "/app-toko/icons/icon-192.png",
    "/app-toko/icons/icon-512.png"
];

// Install → simpan cache
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch → ambil dari cache kalau offline
self.addEventListener("fetch", function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                return response || fetch(event.request);
            })
    );
});