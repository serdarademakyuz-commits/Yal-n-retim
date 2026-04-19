const A3 = {
  KEY: "a3",
  FIELDS: [
    { k: "background",  n: "1️⃣ Arka Plan (Background)",         ph: "Konunun bağlamı, neden önemli" },
    { k: "current",     n: "2️⃣ Mevcut Durum (Current State)",   ph: "Mevcut durum, veriler, metrikler" },
    { k: "goal",        n: "3️⃣ Hedef (Goal / Target)",          ph: "Ulaşılmak istenen hedef, SMART" },
    { k: "analysis",    n: "4️⃣ Neden Analizi (Root Cause)",     ph: "5 Neden / Balık Kılçığı sonuçları" },
    { k: "countermeasures", n: "5️⃣ Karşı Önlemler (Countermeasures)", ph: "Uygulanacak çözümler" },
    { k: "plan",        n: "6️⃣ Uygulama Planı (Implementation)", ph: "Ne, kim, ne zaman" },
    { k: "followup",    n: "7️⃣ Takip (Follow-up)",              ph: "Kontrol noktaları, metrikler" },
    { k: "result",      n: "8️⃣ Sonuç ve Öğrenilenler (Results)", ph: "Gerçekleşen sonuç, dersler" }
  ],
  state: { editingId: null },

  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("📋", "A3 Raporu", "8 bölümlü profesyonel problem çözme raporu.")}

      <div class="card">
        <h3>📝 Rapor Üst Bilgisi</h3>
        <div class="field"><label>Başlık</label><input id="title" placeholder="A3 rapor başlığı"></div>
        <div class="grid-2">
          <div class="field"><label>Sorumlu</label><input id="owner" placeholder="Ad Soyad"></div>
          <div class="field"><label>Tarih</label><input id="date" type="date"></div>
        </div>
      </div>

      ${this.FIELDS.map(f => `
        <div class="card">
          <h3>${f.n}</h3>
          <textarea id="${f.k}" placeholder="${f.ph}" style="min-height:90px"></textarea>
        </div>
      `).join("")}

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        <button class="btn btn-accent" id="exportBtn">📤 Metin Olarak İndir</button>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card" style="margin-top:12px">
        <h3>📋 Kayıtlı Raporlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); };
    root.querySelector("#exportBtn").onclick = () => this.export(root);

    this.renderList(root);
    this.renderAnalysis(root);
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("📋", "Henüz A3 yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)}</div>
          <div class="li-sub">${UI.escape(it.owner || "")} • ${UI.escape(it.date || "")}</div>
        </div>
        <div class="li-actions">
          <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
          <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
        </div>
      </div>
    `).join("");
    wrap.querySelectorAll("[data-action=del]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    wrap.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      this.state.editingId = id;
      root.querySelector("#title").value = it.title || "";
      root.querySelector("#owner").value = it.owner || "";
      root.querySelector("#date").value = it.date || "";
      this.FIELDS.forEach(f => root.querySelector("#" + f.k).value = it[f.k] || "");
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  collect(root) {
    const d = {
      title: root.querySelector("#title").value.trim(),
      owner: root.querySelector("#owner").value.trim(),
      date: root.querySelector("#date").value
    };
    this.FIELDS.forEach(f => d[f.k] = root.querySelector("#" + f.k).value.trim());
    return d;
  },

  clearForm(root) {
    this.state.editingId = null;
    root.querySelector("#title").value = "";
    root.querySelector("#owner").value = "";
    root.querySelector("#date").value = "";
    this.FIELDS.forEach(f => root.querySelector("#" + f.k).value = "");
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },

  save(root) {
    const d = this.collect(root);
    if (!d.title) { UI.toast("Başlık gerekli", "danger"); return; }
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, d);
    else Storage.add(this.KEY, d);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  export(root) {
    const d = this.collect(root);
    let t = `A3 RAPORU\n========\nBaşlık: ${d.title}\nSorumlu: ${d.owner}\nTarih: ${d.date}\n\n`;
    this.FIELDS.forEach(f => {
      t += `${f.n}\n${"-".repeat(30)}\n${d[f.k] || "(boş)"}\n\n`;
    });
    UI.downloadText(`A3_${d.title || "rapor"}.txt`, t);
    UI.toast("Rapor indirildi", "success");
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const latest = records[records.length - 1];
    const filled = this.FIELDS.filter(f => latest[f.k] && latest[f.k].length > 3);
    const empty = this.FIELDS.filter(f => !latest[f.k] || latest[f.k].length <= 3);
    const pct = (filled.length / this.FIELDS.length) * 100;
    if (pct === 100) insights.push(Analyze.insight("success", "A3 eksiksiz", "8 bölüm tamamlanmış. Raporu paylaşıp standartlaştırın."));
    else if (pct >= 75) insights.push(Analyze.insight("warn", `Tamlık %${pct.toFixed(0)} — ${empty.length} bölüm boş`, `Eksik: ${empty.map(f => f.n).join(", ")}`));
    else insights.push(Analyze.insight("danger", `Tamlık %${pct.toFixed(0)} — zayıf`, "A3 disiplinli bir şekilde doldurulmalı. En kritik eksikler: Neden Analizi, Karşı Önlemler, Takip."));
    text.push(`A3 tamlık: %${pct.toFixed(0)}`);
    const critical = ["analysis", "countermeasures", "followup"];
    const missingCritical = critical.filter(k => !latest[k] || latest[k].length <= 3);
    if (missingCritical.length) {
      insights.push(Analyze.insight("warn", `Kritik bölüm(ler) eksik: ${missingCritical.length}`, "Bu bölümler olmadan PDCA kapanmaz."));
      text.push(`Kritik eksik: ${missingCritical.length}`);
    }
    insights.push(Analyze.insight("info", `Toplam ${records.length} A3 raporu`, "Tekrar eden problem ailelerini belirleyin."));
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("📋", "A3 kaydedin, analiz otomatik oluşur."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "A3 Otomatik Analizi", "", a.insights.join(""));
  }
};
