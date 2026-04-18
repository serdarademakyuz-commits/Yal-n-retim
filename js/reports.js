const Reports = {
  labels: {
    why5: "5 Neden Analizi", fishbone: "Balık Kılçığı", pareto: "Pareto",
    a3: "A3 Raporu", pdca: "PDCA", rca: "Kök Neden Analizi",
    takt: "Takt Zamanı", oee: "OEE Hesaplama", smed: "SMED",
    vsm: "Değer Akış Haritası", fives: "5S Denetim", kanban: "Kanban Panosu",
    andon: "Andon Kayıtları", heijunka: "Heijunka Planı", kaizen: "Kaizen",
    muda: "Muda/Mura/Muri", pokayoke: "Poka-Yoke", jit: "JIT",
    jidoka: "Jidoka", sqdcp: "SQDCP", gemba: "Gemba", asakai: "Asakai"
  },

  render(root) {
    const data = {};
    let total = 0;
    Object.keys(this.labels).forEach(k => {
      data[k] = Storage.getAll(k);
      total += data[k].length;
    });

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
            <div class="label">Araç Sayısı</div>
            <div class="value">${Object.keys(this.labels).length}</div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="exportAll">💾 Tümünü İndir (JSON)</button>
          <button class="btn btn-accent" id="exportTxt">📄 Metin Rapor</button>
          <button class="btn btn-outline" id="importBtn">📥 İçe Aktar</button>
          <input type="file" id="importFile" accept=".json" hidden>
          <button class="btn btn-danger" id="clearAll">🗑️ Tümünü Sil</button>
        </div>
      </div>

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
  }
};
