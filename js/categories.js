/* Category landing pages: Araçlar (Lean) and Teknikler (Problem Solving) */
const Categories = {
  LEAN_TOOLS: [
    { r: "takt",     i: "⏱️", n: "Takt Zamanı",       d: "Müşteri talebi-üretim ritmi" },
    { r: "oee",      i: "📊", n: "OEE / TPM",          d: "Genel ekipman verimliliği" },
    { r: "smed",     i: "⚡", n: "SMED",               d: "Hızlı kalıp değişimi" },
    { r: "vsm",      i: "🗺️", n: "VSM",                d: "Değer akış haritalama" },
    { r: "fives",    i: "✅", n: "5S",                 d: "İşyeri düzeni denetimi" },
    { r: "kanban",   i: "🃏", n: "Kanban",             d: "Çekme sistemi panosu" },
    { r: "andon",    i: "🚦", n: "Andon",              d: "Anlık durum sinyali" },
    { r: "heijunka", i: "📦", n: "Heijunka",           d: "Üretim dengeleme" },
    { r: "kaizen",   i: "💡", n: "Kaizen",             d: "Sürekli iyileştirme" },
    { r: "muda",     i: "🗑️", n: "Muda/Mura/Muri",    d: "3 büyük israf analizi" },
    { r: "pokayoke", i: "🛡️", n: "Poka-Yoke",         d: "Hata önleme" },
    { r: "jit",      i: "⏳", n: "JIT",                d: "Tam zamanında üretim" },
    { r: "jidoka",   i: "🤖", n: "Jidoka",             d: "Otonomasyon" },
    { r: "sqdcp",    i: "🪪", n: "SQDCP",              d: "Performans panosu" },
    { r: "gemba",    i: "👣", n: "Gemba",              d: "Saha yürüyüşü" },
    { r: "asakai",   i: "🌅", n: "Asakai",             d: "Sabah toplantısı" }
  ],

  TECHNIQUES: [
    { r: "why5",     i: "❓", n: "5 Neden Analizi",     d: "Zincirleme neden-sonuç" },
    { r: "fishbone", i: "🐟", n: "Balık Kılçığı",       d: "6M Ishikawa diyagramı" },
    { r: "pareto",   i: "📊", n: "Pareto Analizi",      d: "80/20 kuralı" },
    { r: "a3",       i: "📋", n: "A3 Raporu",           d: "8 bölümlü problem çözüm" },
    { r: "pdca",     i: "🔄", n: "PDCA Döngüsü",        d: "Planla-Uygula-Kontrol-Aksiyon" },
    { r: "rca",      i: "🔍", n: "Kök Neden Analizi",   d: "Sistematik RCA" },
    { r: "fmea",     i: "⚠️", n: "FMEA",                d: "Hata türü ve etki analizi (RPN)" },
    { r: "spc",      i: "📉", n: "SPC / Kontrol Grafiği", d: "Xbar-R + Cp/Cpk proses yeteneği" }
  ],

  renderTools(root) {
    this._renderCategory(root, {
      icon: "🏭",
      title: "Yalın Üretim Araçları",
      desc: "Fabrikada verimlilik, kalite ve esneklik için uygulamalı yalın araçlar.",
      items: this.LEAN_TOOLS
    });
  },

  renderTechniques(root) {
    this._renderCategory(root, {
      icon: "🧠",
      title: "Problem Çözme Teknikleri",
      desc: "Kök neden bulma, analiz ve sistematik problem çözme araçları.",
      items: this.TECHNIQUES
    });
  },

  _renderCategory(root, cfg) {
    root.innerHTML = `
      ${UI.hero(cfg.icon, cfg.title, cfg.desc)}
      <div class="card">
        <h3>${cfg.icon} ${cfg.items.length} Araç</h3>
        <div class="tile-grid">
          ${cfg.items.map(t => {
            const count = Storage.getAll(t.r).length;
            return `
              <button class="tile" data-route="${t.r}">
                <div class="t-ico">${t.i}</div>
                <div class="t-label">${t.n}</div>
                <div class="t-sub">${t.d}</div>
                <div class="t-sub" style="color:var(--amber);font-weight:700">${count} kayıt</div>
              </button>`;
          }).join("")}
        </div>
      </div>
    `;
  }
};
