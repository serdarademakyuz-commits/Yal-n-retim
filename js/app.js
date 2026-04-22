/* Router and app bootstrap */
const Router = (function () {
  const routes = {
    dashboard:  { title: "Fabrika Operasyon Paneli",  render: (r) => Dashboard.render(r) },
    tools:      { title: "Yalın Üretim Araçları",     render: (r) => Categories.renderTools(r) },
    techniques: { title: "Problem Çözme Teknikleri",  render: (r) => Categories.renderTechniques(r) },
    reports:    { title: "Raporlar",                  render: (r) => Reports.render(r) },
    projects:  { title: "Proje Yönetimi",           render: (r) => ProjectsPage.render(r) },
    actions:   { title: "Aksiyon Takip Merkezi",    render: (r) => Actions.render(r) },
    why5:      { title: "5 Neden Analizi",          render: (r) => Why5.render(r) },
    fishbone:  { title: "Balık Kılçığı Diyagramı",  render: (r) => Fishbone.render(r) },
    pareto:    { title: "Pareto Analizi",           render: (r) => Pareto.render(r) },
    a3:        { title: "A3 Raporu",                render: (r) => A3.render(r) },
    pdca:      { title: "PDCA Döngüsü",             render: (r) => PDCA.render(r) },
    rca:       { title: "Kök Neden Analizi",        render: (r) => RCA.render(r) },
    fmea:      { title: "FMEA Risk Analizi",        render: (r) => FMEA.render(r) },
    spc:       { title: "SPC / Kontrol Grafiği",    render: (r) => SPC.render(r) },
    takt:      { title: "Takt Zamanı Hesaplama",    render: (r) => Takt.render(r) },
    oee:       { title: "OEE / TPM Hesaplama",      render: (r) => OEE.render(r) },
    smed:      { title: "SMED Analizi",             render: (r) => SMED.render(r) },
    vsm:       { title: "Değer Akış Haritası",      render: (r) => VSM.render(r) },
    fives:     { title: "5S Denetimi",              render: (r) => Fives.render(r) },
    kanban:    { title: "Kanban Panosu",            render: (r) => Kanban.render(r) },
    andon:     { title: "Andon Sistemi",            render: (r) => Andon.render(r) },
    heijunka:  { title: "Heijunka Üretim Dengeleme",render: (r) => Heijunka.render(r) },
    kaizen:    { title: "Kaizen - Sürekli İyileştirme", render: (r) => Kaizen.render(r) },
    muda:      { title: "Muda / Mura / Muri",       render: (r) => Muda.render(r) },
    pokayoke:  { title: "Poka-Yoke",                render: (r) => PokaYoke.render(r) },
    jit:       { title: "Just-In-Time",             render: (r) => JIT.render(r) },
    jidoka:    { title: "Jidoka - Otonomasyon",     render: (r) => Jidoka.render(r) },
    sqdcp:     { title: "SQDCP Performans Panosu",  render: (r) => SQDCP.render(r) },
    gemba:     { title: "Gemba Yürüyüşü",           render: (r) => Gemba.render(r) },
    asakai:    { title: "Asakai - Sabah Toplantısı",render: (r) => Asakai.render(r) },
    dmaic:     { title: "DMAIC Proje Kartı",        render: (r) => DMAIC.render(r) },
    hoshin:    { title: "Hoshin Kanri X-Matrix",    render: (r) => Hoshin.render(r) },
    hypothesis:{ title: "Hipotez Testi",            render: (r) => Hypothesis.render(r) },
    audit:     { title: "Denetim Listeleri",        render: (r) => Audit.render(r) },
    trends:    { title: "Trend Analizi",            render: (r) => Trends.render(r) },
    consultant:{ title: "Danışmanlık Raporu",       render: (r) => Consultant.render(r) }
  };

  /* Routes that are overview/list pages — no per-tool photo card. */
  const NO_PHOTOS = new Set(["dashboard","tools","techniques","reports","projects","trends"]);

  function go(route) {
    if (!routes[route]) route = "dashboard";
    const root = document.getElementById("app");
    root.innerHTML = "";
    document.getElementById("pageTitle").textContent = routes[route].title;
    try {
      routes[route].render(root);
      if (!NO_PHOTOS.has(route) && typeof UI !== "undefined" && UI.toolDashboard) {
        UI.toolDashboard(root, route, { title: routes[route].title });
      }
      if (!NO_PHOTOS.has(route) && typeof UI !== "undefined" && UI.toolPhotos) {
        UI.toolPhotos(root, route);
      }
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="card"><h3>Hata</h3><p>${UI.escape(e.message)}</p></div>`;
    }
    // highlight nav
    document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.route === route));
    document.querySelectorAll(".bn-item").forEach(n => n.classList.toggle("active", n.dataset.route === route));
    window.scrollTo(0, 0);
    closeNav();
    window.location.hash = route;
  }

  function closeNav() {
    document.getElementById("sideNav").classList.remove("open");
    document.getElementById("navBackdrop").classList.remove("open");
  }
  function openNav() {
    document.getElementById("sideNav").classList.add("open");
    document.getElementById("navBackdrop").classList.add("open");
  }

  function refreshProjectBar() {
    const sel = document.getElementById("projectSelect");
    if (!sel) return;
    const list = Projects.list();
    const active = Projects.getActive();
    sel.innerHTML = list.map(p => `<option value="${p.id}"${p.id === active ? " selected" : ""}>${p.name}</option>`).join("");
  }

  function init() {
    if (typeof Projects !== "undefined") {
      Projects.migrateLegacy();
      Projects.ensureDefault();
    }

    document.getElementById("menuBtn").onclick = openNav;
    document.getElementById("closeNav").onclick = closeNav;
    document.getElementById("navBackdrop").onclick = closeNav;
    document.getElementById("homeBtn").onclick = () => go("dashboard");

    const applyTheme = (t) => {
      document.documentElement.setAttribute("data-theme", t);
      const btn = document.getElementById("themeBtn");
      if (btn) btn.textContent = t === "dark" ? "☀️" : "🌙";
    };
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("yalin_theme")) || "light";
    applyTheme(saved);
    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) themeBtn.onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(cur);
      try { localStorage.setItem("yalin_theme", cur); } catch (e) {}
    };

    const sel = document.getElementById("projectSelect");
    if (sel) {
      refreshProjectBar();
      sel.onchange = (e) => {
        Projects.setActive(e.target.value);
        UI.toast("Proje değişti: " + Projects.getActiveProject().name, "success");
        go((window.location.hash || "#dashboard").slice(1));
      };
    }
    const manageBtn = document.getElementById("projectManage");
    if (manageBtn) manageBtn.onclick = () => go("projects");

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-route]");
      if (t) {
        e.preventDefault();
        go(t.dataset.route);
      }
    });

    const initial = (window.location.hash || "#dashboard").slice(1);
    go(initial);
  }

  return { go, init, refreshProjectBar };
})();

// Expose helper so pages can refresh the project bar
const App = { refreshProjectBar: () => Router.refreshProjectBar() };

document.addEventListener("DOMContentLoaded", Router.init);

// Service Worker registration with auto-update: new version takes over
// on the next page load without the user needing to clear cache manually.
if ("serviceWorker" in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      if (!reg) return;
      reg.update().catch(() => {});
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            nw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch(() => { /* offline desteği opsiyoneldir */ });
  });
}
