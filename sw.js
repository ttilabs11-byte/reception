// Offline cache for the Chrome (PWA) fallback. The Android app plays from files and never uses this.
// Install: cache the player and every slide the main playlist names. Fetch: network first, cache when offline,
// so copying new slides to the server shows up on the next load and the screen keeps playing if the network drops.
var CACHE = "tti-screen";   // v2, 2026-10-30: lobby slides + full logo (any byte change here re-caches every slide)
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return fetch("playlists/main.js", { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (js) {
      var files = (js.match(/slides\/[\w\/.-]+\.webp/g) || []).concat(["./", "index.html", "playlists/main.js",
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
