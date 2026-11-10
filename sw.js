// Offline cache for the Chrome (PWA) fallback. The Android app plays from files and never uses this.
// Install: cache the player and every slide its playlist names (main unless registered with ?list=). Fetch: network first, cache when offline,
// so copying new slides to the server shows up on the next load and the screen keeps playing if the network drops.
// Registered as sw.js?list=name for another edition (index.html), which then caches that playlist in its own cache.
var LIST = (self.location.search.match(/list=([\w-]+)/) || [0, "main"])[1];
var CACHE = "tti-screen" + (LIST == "main" ? "" : "-" + LIST);   // v2.8, 2026-11-10: real shoot photos on 12 own-premises slides, lobby campus remade; v2.7, 2026-11-06: Studio Photo images on 148 slides; v2.6, 2026-11-05: + Cosmetics, DPP & ESG, Microbiology, Citrus decks; v2.5, 2026-11-02: full-content edition (?list=full) (any byte change here re-caches every slide)
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return fetch("playlists/" + LIST + ".js", { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (js) {
      var files = (js.match(/slides\/[\w\/.-]+\.webp/g) || []).concat(["./", "index.html", "playlists/" + LIST + ".js",
        "manifest.webmanifest", "icon-192.png", "icon-512.png"]);
      return c.addAll(files.filter(function (f, i) { return files.indexOf(f) === i; }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request, { cache: "no-store" }).then(function (r) {
    if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
