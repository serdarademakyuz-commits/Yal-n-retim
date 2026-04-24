const CACHE = "yalin-v17";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./js/app.js",
  "./js/projects.js",
  "./js/storage.js",
  "./js/ui.js",
  "./js/analyze.js",
  "./js/dashboard.js",
  "./js/reports.js",
  "./js/categories.js",
  "./js/tools/actions.js",
  "./js/tools/fmea.js",
  "./js/tools/spc.js",
  "./js/tools/projects_page.js",
  "./js/tools/why5.js",
  "./js/tools/fishbone.js",
  "./js/tools/pareto.js",
  "./js/tools/a3.js",
  "./js/tools/pdca.js",
  "./js/tools/rca.js",
  "./js/tools/takt.js",
  "./js/tools/oee.js",
  "./js/tools/smed.js",
  "./js/tools/vsm.js",
  "./js/tools/fives.js",
  "./js/tools/kanban.js",
  "./js/tools/andon.js",
  "./js/tools/heijunka.js",
  "./js/tools/kaizen.js",
  "./js/tools/muda.js",
  "./js/tools/pokayoke.js",
  "./js/tools/jit.js",
  "./js/tools/jidoka.js",
  "./js/tools/sqdcp.js",
  "./js/tools/gemba.js",
  "./js/tools/asakai.js",
  "./js/tools/dmaic.js",
  "./js/tools/hoshin.js",
  "./js/tools/hypothesis.js",
  "./js/tools/audit.js",
  "./js/tools/trends.js",
  "./js/tools/consultant.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => { try { c.put(e.request, copy); } catch(err){} });
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
