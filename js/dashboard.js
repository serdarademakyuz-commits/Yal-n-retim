const Dashboard = {
  tiles: [
    { r: "why5",     i: "❓", n: "5 Neden" },
    { r: "fishbone", i: "🐟", n: "Balık Kılçığı" },
    { r: "pareto",   i: "📊", n: "Pareto" },
    { r: "a3",       i: "📋", n: "A3 Rapor" },
    { r: "pdca",     i: "🔄", n: "PDCA" },
    { r: "rca",      i: "🔍", n: "Kök Neden" },
    { r: "takt",     i: "⏱️", n: "Takt Zamanı" },
    { r: "oee",      i: "📈", n: "OEE / TPM" },
    { r: "smed",     i: "⚡", n: "SMED" },
    { r: "vsm",      i: "🗺️", n: "VSM" },
    { r: "fives",    i: "✅", n: "5S" },
    { r: "kanban",   i: "🃏", n: "Kanban" },
    { r: "andon",    i: "🚦", n: "Andon" },
    { r: "heijunka", i: "📦", n: "Heijunka" },
    { r: "kaizen",   i: "💡", n: "Kaizen" },
    { r: "muda",     i: "🗑️", n: "Muda/Mura/Muri" },
    { r: "pokayoke", i: "🛡️", n: "Poka-Yoke" },
    { r: "jit",      i: "⏳", n: "JIT" },
    { r: "jidoka",   i: "🤖", n: "Jidoka" },
    { r: "sqdcp",    i: "🪪", n: "SQDCP" },
    { r: "gemba",    i: "👣", n: "Gemba" },
    { r: "asakai",   i: "🌅", n: "Asakai" }
  ],

  render(root) {
    const total = Storage.totalCount();
    const andons = Storage.getAll("andon");
    const activeAndons = andons.filter(a => a.status !== "resolved").length;
    const kaizens = Storage.getAll("kaizen").length;
    const open5s = Storage.getAll("fives").length;
    const kanban = Storage.getAll("kanban");
    const wip = kanban.filter(c => c.col === "doing").length;

    root.innerHTML = `
      ${UI.hero("📈", "Fabrika Paneli", "Gerçek zamanlı yalın üretim KPI'ları ve tüm araçlara hızlı erişim.")}

      <div class="kpi-grid">
        <div class="kpi amber">
          <div class="label">Toplam Kayıt</div>
          <div class="value">${total}</div>
          <div class="sub">tüm araçlar</div>
        </div>
        <div class="kpi danger">
          <div class="label">Aktif Andon</div>
          <div class="value">${activeAndons}</div>
          <div class="sub">çözüm bekleniyor</div>
        </div>
        <div class="kpi success">
          <div class="label">Kaizen</div>
          <div class="value">${kaizens}</div>
          <div class="sub">iyileştirme</div>
        </div>
        <div class="kpi warn">
          <div class="label">Kanban WIP</div>
          <div class="value">${wip}</div>
          <div class="sub">devam eden iş</div>
        </div>
      </div>

      <div class="card">
        <h3>🧰 Araçlar</h3>
        <div class="tile-grid">
          ${this.tiles.map(t => `
            <button class="tile" data-route="${t.r}">
              <div class="t-ico">${t.i}</div>
              <div class="t-label">${t.n}</div>
              <div class="t-sub">${Storage.getAll(t.r).length} kayıt</div>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="card">
        <h3>⚡ Hızlı İşlem</h3>
        <div class="btn-row">
          <button class="btn btn-danger" data-route="andon">🚦 Acil Andon</button>
          <button class="btn btn-accent" data-route="kaizen">💡 Kaizen Ekle</button>
          <button class="btn btn-primary" data-route="gemba">👣 Gemba Yürüyüşü</button>
          <button class="btn btn-success" data-route="asakai">🌅 Sabah Toplantısı</button>
        </div>
      </div>

      <div class="card">
        <h3>📌 Son Etkinlikler</h3>
        <div id="recentFeed"></div>
      </div>
    `;

    // recent feed
    const feed = root.querySelector("#recentFeed");
    const recent = [];
    this.tiles.forEach(t => {
      Storage.getAll(t.r).slice(0, 2).forEach(item => {
        recent.push({
          tool: t.n,
          icon: t.i,
          route: t.r,
          title: item.title || item.problem || item.name || item.event || item.issue || item.note || "Kayıt",
          at: item.updatedAt || item.createdAt
        });
      });
    });
    recent.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
    const top = recent.slice(0, 6);
    feed.innerHTML = top.length
      ? top.map(r => `
        <div class="list-item" data-route="${r.route}" style="cursor:pointer">
          <div class="li-main">
            <div class="li-title">${r.icon} ${UI.escape(r.title)}</div>
            <div class="li-sub">${r.tool} • ${UI.fmtDate(r.at)}</div>
          </div>
        </div>
      `).join("")
      : UI.emptyState("📭", "Henüz kayıt yok. Bir araçla başlayın.");
  }
};
