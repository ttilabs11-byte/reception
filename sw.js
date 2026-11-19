// Offline cache for the Chrome (PWA) fallback. The Android app plays from files and never uses this.
// One cache per version; a new sw.js must take over even on a weak network, so its install only waits for the small
// player files (and at most 60 s for the pictures); pictures it did not get are fetched and kept as the loop shows them.
// Activating a new version deletes this edition's older caches and reloads open screens, so a fix shows at once.
// Fetch: pictures from this version's cache first (a weak network can never stall the loop); the page and playlist from
// the network first, but after 5 s from this version's cache. Registered as sw.js?list=name for another edition.
var LIST = (self.location.search.match(/list=([\w-]+)/) || [0, "main"])[1];
var BASE = "tti-screen" + (LIST == "main" ? "" : "-" + LIST), CACHE = BASE + "@v3.9";   // v3.9, 2026-11-19: the 11 count slides say 540+ accredited methods and 370+ parameters (true either way against magazine 543/377+ and copy 544/378); v3.8, 2026-11-19: updates reach the screen (small install, old caches deleted, open screens reload, the page checks for updates every 10 min); v3.7, 2026-11-19: words back on screen (trimmed word/logo layers get new names, so an old cached full-size copy can never be placed as a trimmed one; old caches deleted); v3.6, 2026-11-19: memory fix for "This page uses too much memory" (trimmed word/logo layers, pictures freed, hourly fresh start that resumes); // v3.5d, 2026-11-17: credentials slide kick "Accredited since 2006"; v3.5c, 2026-11-14: picture moves ~50% faster (zoom 1.04-1.40, pans +-12%); v3.5b: six-industries picture + per-slide gentle move (mv); picture moves about twice as big, 25 slides reworded so every headline says exactly what we test, 4 more pictures remade (six industries, safety boots, export to Europe, engine oil), duplicate wastewater slide dropped, 65 slides; v3.5, 2026-11-14: each picture pans, drifts or zooms (6 moves, words and logo still), 4 credentials slides (100+ countries, 12 accreditations, ZDHC wastewater, food authorities + WFP), 4 weak pictures remade, 66 slides; v3.4, 2026-11-12: the loop no longer freezes when a picture fails or hangs (skips it, 15 s limit, restarts after 90 s without a change), pictures play from the cache; v3.3, 2026-11-11: 33 slides now show real items (leather, denim, pills, rice, containers) from free Unsplash photos instead of staff at work; v3.2, 2026-11-11: every slide rewritten in plain words a walk-in visitor understands (no codes or jargon in headlines), 7 repeat slides dropped, 62 slides; v3.1, 2026-11-11: loop cut to the website's core sections (6 industries + testing, inspection, certification, sustainability), award, AI and e-mobility slides removed, unclear lines rewritten to stand alone; v3.0, 2026-11-10: 41 slides reworded (achievement, competence, why it matters), 10 hand-fault pictures replaced with no-people images, brand kept as "Tti Labs" in caps lines; v2.8.2, 2026-11-10: lobby s05 real no-people photo (men-only rule); v2.8.1, 2026-11-10: cosmetics s03 real photo (AI hand fault); v2.8, 2026-11-10: real shoot photos on 12 own-premises slides, lobby campus remade; v2.7, 2026-11-06: Studio Photo images on 148 slides; v2.6, 2026-11-05: + Cosmetics, DPP & ESG, Microbiology, Citrus decks; v2.5, 2026-11-02: full-content edition (?list=full) (any byte change here re-caches every slide)
var SHELL = ["./", "index.html", "playlists/" + LIST + ".js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
function fresh(f) { return new Request(f, { cache: "reload" }); }
function within(ms, p) { return Promise.race([p, new Promise(function (ok) { setTimeout(ok, ms); })]); }
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(SHELL.map(fresh)).then(function () { return c.match("playlists/" + LIST + ".js"); }).then(function (r) { return r.text(); }).then(function (js) {
      var pics = (js.match(/slides\/[\w\/.-]+\.webp/g) || []).filter(function (f, i, a) { return a.indexOf(f) === i; });
      return within(60000, Promise.all(pics.map(function (f) { return c.add(fresh(f)).catch(function () {}); })));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    var old = ks.filter(function (k) { return k != CACHE && (k == BASE || k.indexOf(BASE + "@") == 0); });
    return Promise.all(old.map(function (k) { return caches.delete(k); })).then(function () { return self.clients.claim(); }).then(function () {
      if (!old.length) return;                          // first install: nothing to replace
      return self.clients.matchAll({ type: "window" }).then(function (cs) {
        cs.forEach(function (c) { if (c.navigate) c.navigate(c.url).catch(function () {}); });
      });
    });
  }));
});
function net(req, ms) {                                 // the network, but never longer than ms
  return new Promise(function (ok, no) {
    var t = setTimeout(no, ms);
    fetch(req, { cache: "no-store" }).then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); no(e); });
  });
}
function mine(req) { return caches.open(CACHE).then(function (c) { return c.match(req, { ignoreSearch: true }); }); }
function keep(req, r) { if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); } return r; }
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (/\/slides\/.+\.webp$/.test(new URL(req.url).pathname))
    e.respondWith(mine(req).then(function (hit) {
      return hit || net(req, 15000).then(function (r) { return keep(req, r); });
    }));
  else
    e.respondWith(net(req, 5000).then(function (r) { return keep(req, r); }).catch(function () {
      return mine(req).then(function (hit) { return hit || net(req, 30000); });
    }));
});
