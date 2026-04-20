const Reports = {
  labels: {
    why5: "5 Neden Analizi", fishbone: "Balık Kılçığı", pareto: "Pareto",
    a3: "A3 Raporu", pdca: "PDCA", rca: "Kök Neden Analizi",
    fmea: "FMEA", spc: "SPC / Kontrol Grafiği",
    takt: "Takt Zamanı", oee: "OEE Hesaplama", smed: "SMED",
    vsm: "Değer Akış Haritası", fives: "5S Denetim", kanban: "Kanban Panosu",
    andon: "Andon Kayıtları", heijunka: "Heijunka Planı", kaizen: "Kaizen",
    muda: "Muda/Mura/Muri", pokayoke: "Poka-Yoke", jit: "JIT",
    jidoka: "Jidoka", sqdcp: "SQDCP", gemba: "Gemba", asakai: "Asakai",
    actions: "Aksiyonlar"
  },

  modules: {
    why5: "Why5", fishbone: "Fishbone", pareto: "Pareto",
    a3: "A3", pdca: "PDCA", rca: "RCA",
    fmea: "FMEA", spc: "SPC",
    takt: "Takt", oee: "OEE", smed: "SMED",
    vsm: "VSM", fives: "Fives", kanban: "Kanban",
    andon: "Andon", heijunka: "Heijunka", kaizen: "Kaizen",
    muda: "Muda", pokayoke: "PokaYoke", jit: "JIT",
    jidoka: "Jidoka", sqdcp: "SQDCP", gemba: "Gemba", asakai: "Asakai",
    actions: "Actions"
  },

  runAnalysis(key) {
    const modName = this.modules[key];
    const mod = (typeof window !== "undefined" ? window[modName] : null);
    if (!mod || typeof mod.analyze !== "function") return null;
    try {
      if (key === "pareto") {
        const list = Storage.getAll(key);
        if (!list.length) return null;
        const latest = list[list.length - 1];
        const items = latest.items || [];
        if (!items.length) return null;
        return mod.analyze(items);
      }
      const records = Storage.getAll(key);
      if (!records.length) return null;
      return mod.analyze(records);
    } catch (err) {
      return null;
    }
  },

  render(root) {
    const data = {};
    let total = 0;
    Object.keys(this.labels).forEach(k => {
      data[k] = Storage.getAll(k);
      total += data[k].length;
    });
    const toolsWithData = Object.keys(this.labels).filter(k => data[k].length > 0);

    root.innerHTML = `
      ${UI.hero("📄", "Raporlar", "Tüm kayıtları görüntüleyin, indirin veya yedekleyin.")}

      <div class="card">
        <h3>📊 Özet</h3>
        <div class="kpi-grid">
          <div class="kpi amber">
            <div class="label">Toplam Kayıt</div>
            <div class="value">${total}</div>
          </div>
          <div class="kpi success">
            <div class="label">Veri Olan Araç</div>
            <div class="value">${toolsWithData.length}/${Object.keys(this.labels).length}</div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="exportAll">💾 Tümünü İndir (JSON)</button>
          <button class="btn btn-accent" id="exportTxt">📄 Metin Rapor</button>
          <button class="btn btn-success" id="exportMd">📝 Analiz Raporu (MD)</button>
          <button class="btn btn-warn" id="printPdf">🖨️ Yazdır / PDF</button>
          <button class="btn btn-outline" id="importBtn">📥 İçe Aktar</button>
          <input type="file" id="importFile" accept=".json" hidden>
          <button class="btn btn-danger" id="clearAll">🗑️ Tümünü Sil</button>
        </div>
      </div>

      <div id="crossAnalysis"></div>

      <div class="card">
        <h3>🗂️ Araç Bazlı Kayıtlar</h3>
        ${Object.keys(this.labels).map(k => `
          <div class="list-item" data-route="${k}" style="cursor:pointer">
            <div class="li-main">
              <div class="li-title">${UI.escape(this.labels[k])}</div>
              <div class="li-sub">${data[k].length} kayıt</div>
            </div>
            <span class="badge ${data[k].length ? 'info' : ''}">${data[k].length}</span>
          </div>
        `).join("")}
      </div>
    `;

    root.querySelector("#exportAll").onclick = () => {
      const all = {};
      Object.keys(this.labels).forEach(k => all[k] = Storage.getAll(k));
      UI.downloadText(`yalin_uretim_yedek_${Date.now()}.json`, JSON.stringify(all, null, 2));
      UI.toast("Yedek indirildi", "success");
    };

    root.querySelector("#exportTxt").onclick = () => {
      let txt = "YALIN ÜRETİM - KAYIT RAPORU\n";
      txt += "Oluşturulma: " + new Date().toLocaleString("tr-TR") + "\n\n";
      Object.keys(this.labels).forEach(k => {
        const list = Storage.getAll(k);
        if (!list.length) return;
        txt += `=== ${this.labels[k]} (${list.length}) ===\n`;
        list.forEach((it, i) => {
          txt += `${i + 1}. ${JSON.stringify(it)}\n`;
        });
        txt += "\n";
      });
      UI.downloadText(`yalin_uretim_rapor_${Date.now()}.txt`, txt);
      UI.toast("Metin rapor indirildi", "success");
    };

    root.querySelector("#exportMd").onclick = () => this.exportMarkdown();

    root.querySelector("#printPdf").onclick = () => UI.printPage();

    root.querySelector("#importBtn").onclick = () => root.querySelector("#importFile").click();
    root.querySelector("#importFile").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const obj = JSON.parse(reader.result);
          Object.keys(obj).forEach(k => Storage.setAll(k, obj[k]));
          UI.toast("Veriler içe aktarıldı", "success");
          Router.go("reports");
        } catch (err) {
          UI.toast("Dosya okunamadı", "danger");
        }
      };
      reader.readAsText(f);
    };

    root.querySelector("#clearAll").onclick = () => {
      if (!UI.confirm("Tüm kayıtlar silinecek. Emin misiniz?")) return;
      Object.keys(this.labels).forEach(k => Storage.clear(k));
      UI.toast("Tüm kayıtlar silindi", "danger");
      Router.go("reports");
    };

    this.renderCrossAnalysis(root);
  },

  renderCrossAnalysis(root) {
    const wrap = root.querySelector("#crossAnalysis");
    if (!wrap) return;
    const sections = [];
    let activeCount = 0;
    let totalInsights = 0;
    Object.keys(this.labels).forEach(k => {
      const a = this.runAnalysis(k);
      if (!a || !a.insights || !a.insights.length) return;
      activeCount++;
      totalInsights += a.insights.length;
      sections.push(`
        <div style="margin-top:10px">
          <h4 style="margin:6px 0;color:var(--navy)">${UI.escape(this.labels[k])}</h4>
          ${a.insights.join("")}
        </div>
      `);
    });
    if (!activeCount) {
      wrap.innerHTML = Analyze.empty("🧭", "Araçlara veri ekledikçe otomatik çapraz analiz burada görünecek.");
      return;
    }
    wrap.innerHTML = Analyze.card(
      "🧭",
      "Tüm Araçlar — Otomatik Çapraz Analiz",
      `<small style="color:var(--muted)">${activeCount} araçtan ${totalInsights} içgörü</small>`,
      sections.join("")
    );
  },

  exportMarkdown() {
    let md = "# Yalın Üretim — Analiz Raporu\n";
    md += `_Oluşturulma: ${new Date().toLocaleString("tr-TR")}_\n\n`;
    let any = false;
    Object.keys(this.labels).forEach(k => {
      const a = this.runAnalysis(k);
      const list = Storage.getAll(k);
      if (!list.length) return;
      any = true;
      md += `## ${this.labels[k]} (${list.length})\n`;
      if (a && a.text && a.text.length) {
        a.text.forEach(t => { md += `- ${t}\n`; });
      } else {
        md += "- Analiz üretilmedi.\n";
      }
      md += "\n";
    });
    if (!any) { UI.toast("Kayıt yok", "danger"); return; }
    UI.downloadText(`yalin_uretim_analiz_${Date.now()}.md`, md);
    UI.toast("Analiz raporu indirildi", "success");
  }
};
