/* Router and app bootstrap */
const Router = (function () {
  const routes = {
    dashboard: { title: "Fabrika Operasyon Paneli", render: (r) => Dashboard.render(r) },
    reports:   { title: "Raporlar",                 render: (r) => Reports.render(r) },
    why5:      { title: "5 Neden Analizi",          render: (r) => Why5.render(r) },
    fishbone:  { title: "Balık Kılçığı Diyagramı",  render: (r) => Fishbone.render(r) },
    pareto:    { title: "Pareto Analizi",           render: (r) => Pareto.render(r) },
    a3:        { title: "A3 Raporu",                render: (r) => A3.render(r) },
    pdca:      { title: "PDCA Döngüsü",             render: (r) => PDCA.render(r) },
    rca:       { title: "Kök Neden Analizi",        render: (r) => RCA.render(r) },
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
    asakai:    { title: "Asakai - Sabah Toplantısı",render: (r) => Asakai.render(r) }
  };

  function go(route) {
    if (!routes[route]) route = "dashboard";
    const root = document.getElementById("app");
    root.innerHTML = "";
    document.getElementById("pageTitle").textContent = routes[route].title;
    try {
      routes[route].render(root);
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

  function init() {
    document.getElementById("menuBtn").onclick = openNav;
    document.getElementById("closeNav").onclick = closeNav;
    document.getElementById("navBackdrop").onclick = closeNav;
    document.getElementById("homeBtn").onclick = () => go("dashboard");

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

  return { go, init };
})();

document.addEventListener("DOMContentLoaded", Router.init);
