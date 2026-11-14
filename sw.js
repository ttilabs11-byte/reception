// Offline cache for the Chrome (PWA) fallback. The Android app plays from files and never uses this.
// Install: cache the player and every slide its playlist names (main unless registered with ?list=), fresh from the server.
// Fetch: slide pictures come from that cache first (they only change with a new sw.js, which re-caches them all), so a
// weak network can never stall the loop; the page and playlist go to the network first, but give up after 5 s and use the cache.
// Registered as sw.js?list=name for another edition (index.html), which then caches that playlist in its own cache.
var LIST = (self.location.search.match(/list=([\w-]+)/) || [0, "main"])[1];
var CACHE = "tti-screen" + (LIST == "main" ? "" : "-" + LIST);   // v3.5b, 2026-11-14: six-industries picture + per-slide gentle move (mv); picture moves about twice as big, 25 slides reworded so every headline says exactly what we test, 4 more pictures remade (six industries, safety boots, export to Europe, engine oil), duplicate wastewater slide dropped, 65 slides; v3.5, 2026-11-14: each picture pans, drifts or zooms (6 moves, words and logo still), 4 credentials slides (100+ countries, 12 accreditations, ZDHC wastewater, food authorities + WFP), 4 weak pictures remade, 66 slides; v3.4, 2026-11-12: the loop no longer freezes when a picture fails or hangs (skips it, 15 s limit, restarts after 90 s without a change), pictures play from the cache; v3.3, 2026-11-11: 33 slides now show real items (leather, denim, pills, rice, containers) from free Unsplash photos instead of staff at work; v3.2, 2026-11-11: every slide rewritten in plain words a walk-in visitor understands (no codes or jargon in headlines), 7 repeat slides dropped, 62 slides; v3.1, 2026-11-11: loop cut to the website's core sections (6 industries + testing, inspection, certification, sustainability), award, AI and e-mobility slides removed, unclear lines rewritten to stand alone; v3.0, 2026-11-10: 41 slides reworded (achievement, competence, why it matters), 10 hand-fault pictures replaced with no-people images, brand kept as "Tti Labs" in caps lines; v2.8.2, 2026-11-10: lobby s05 real no-people photo (men-only rule); v2.8.1, 2026-11-10: cosmetics s03 real photo (AI hand fault); v2.8, 2026-11-10: real shoot photos on 12 own-premises slides, lobby campus remade; v2.7, 2026-11-06: Studio Photo images on 148 slides; v2.6, 2026-11-05: + Cosmetics, DPP & ESG, Microbiology, Citrus decks; v2.5, 2026-11-02: full-content edition (?list=full) (any byte change here re-caches every slide)
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return fetch("playlists/" + LIST + ".js", { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (js) {
      var files = (js.match(/slides\/[\w\/.-]+\.webp/g) || []).concat(["./", "index.html", "playlists/" + LIST + ".js",
        "manifest.webmanifest", "icon-192.png", "icon-512.png"]);
      return c.addAll(files.filter(function (f, i) { return files.indexOf(f) === i; }).map(function (f) { return new Request(f, { cache: "reload" }); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
function net(req, ms) {                                 // the network, but never longer than ms
  return new Promise(function (ok, no) {
    var t = setTimeout(no, ms);
    fetch(req, { cache: "no-store" }).then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); no(e); });
  });
}
function keep(req, r) { if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); } return r; }
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (/\/slides\/.+\.webp$/.test(new URL(req.url).pathname))
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || net(req, 15000).then(function (r) { return keep(req, r); });
    }));
  else
    e.respondWith(net(req, 5000).then(function (r) { return keep(req, r); }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || net(req, 30000); });
    }));
});
