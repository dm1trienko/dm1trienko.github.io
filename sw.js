/* dmitrienok.ru — Service Worker (PWA/offline)
   Strategy:
   - HTML navigations: network-first (fresh), fallback to cache
   - JSON/Markdown (content): network-first, fallback cache
   - Static assets (CSS/JS/images): cache-first
   - Cross-origin (CDN libs): stale-while-revalidate (opaque cached after first load)

   Note: Works best over HTTPS (GitHub Pages uses HTTPS by default).
*/

// Bump VERSION whenever you change assets/content so users get a fresh cache.
const VERSION = "2026-01-11-7";
const CACHE = `dmitrienok-cache-${VERSION}`;

const CORE = [
  "./",
  "index.html",
  "viewer.html",
  "post.html",
  "404.html",

  "assets/css/style.css",

  // Core JS
  "assets/js/main.js",
  "assets/js/cmdk.js",
  "assets/js/tabs.js",
  "assets/js/router.js",
  "assets/js/home.js",
  "assets/js/resources.js",
  "assets/js/explorer.js",
  "assets/js/schedules.js",
  "assets/js/polls.js",
  "assets/js/catalog.js",
  "assets/js/calculator.js",
  "assets/js/news-meta.js",
  "assets/js/news.js",
  "assets/js/community.js",
  "assets/js/info.js",
  "assets/js/contact.js",
  "assets/js/post.js",
  "assets/js/viewer.js",
  "assets/js/shortcuts.js",

  // Content indexes
  "content/site.json",
  "content/resources.json",
  "content/schedules.json",
  "content/polls.json",
  "content/calculators/index.json",
  "content/news.json",
  "content/community.json",
  "content/info.json",

  // Posts (template examples)
  "posts/welcome.md",
  "posts/howto.md",

  // Demo files
  "files/demo/grades.xlsx",
  "files/demo/sample.csv",
  "files/demo/schedule.csv",

  // Meta
  "manifest.webmanifest",
  "opensearch.xml",
  "feed.xml",
  "robots.txt",
  "sitemap.xml",

  // Images
  "assets/img/site_logo.png",
  "assets/img/founder.jpg",
  "assets/img/icon-16.png",
  "assets/img/icon-64.png",
  "assets/img/icon-192.png",
  "assets/img/icon-512.png",
  "assets/img/icon-192-maskable.png",
  "assets/img/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async (cache) => {
        // cache.addAll() fails the whole install if ONE file is missing.
        // We want best-effort pre-cache, because content can change between forks.
        const results = await Promise.allSettled(
          CORE.map((u) => cache.add(u))
        );
        // Keep a tiny log for debugging (not visible to users)
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed) console.warn("SW precache: failed", failed, "files");
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith("dmitrienok-cache-") && k !== CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  const cache = await caches.open(CACHE);
  // Cache only successful (or opaque) responses
  if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(CACHE);
    if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    // As a last resort for navigations, fall back to the cached shell.
    if (req.mode === "navigate") {
      return (await caches.match("index.html")) || (await caches.match("./"));
    }
    throw new Error("offline");
  }
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const cache = await caches.open(CACHE);

  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || (await caches.match("index.html"));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (!req || req.method !== "GET") return;

  const url = new URL(req.url);

  // HTML navigations: network-first
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Same-origin assets
  if (url.origin === self.location.origin) {
    const path = url.pathname || "";
    if (path.endsWith(".json") || path.endsWith(".md")) {
      event.respondWith(networkFirst(req));
      return;
    }
    // Cache-first for everything else: css/js/img/files
    event.respondWith(cacheFirst(req));
    return;
  }

  // Cross-origin (CDNs): SWR
  event.respondWith(staleWhileRevalidate(req));
});
