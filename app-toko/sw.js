const CACHE_NAME = "toko-cache-v10";

const urlsToCache = [
    "/app-toko/",
    "/app-toko/index.html",
    "/app-toko/login.html",
    "/app-toko/app.js",
    "/app-toko/manifest.json",
    "/app-toko/icons/icon-192.png",
    "/app-toko/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
    console.log("[SW] Installing...");

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log("[SW] Caching app shell...");
                for (const url of urlsToCache) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                            console.log(`[SW] Cached: ${url}`);
                        }
                    } catch (error) {
                        console.warn(`[SW] Failed to cache: ${url}`, error);
                    }
                }
            })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[SW] Activating...");
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log("[SW] Deleting old cache:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) return;
    if (event.request.method !== "GET") return;
    if (url.pathname.includes("/api-toko/") && url.pathname.includes(".php")) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;

                if (event.request.mode === "navigate") {
                    return new Response(`
                        <!DOCTYPE html>
                        <html>
                        <head><title>Offline</title>
                        <style>body{font-family:Arial;text-align:center;padding:50px;background:#f0fdf4;}h1{color:#0d9488;}</style>
                        </head>
                        <body>
                            <h1>📡 Tidak Ada Koneksi</h1>
                            <p>Silakan periksa koneksi internet Anda.</p>
                            <button onclick="location.reload()">Coba Lagi</button>
                        </body>
                        </html>
                    `, { status: 200, headers: { 'Content-Type': 'text/html' } });
                }

                return new Response("Offline", { status: 503 });
            })
    );
});