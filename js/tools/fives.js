const Fives = {
  KEY: "fives",
  state: { editingId: null },
  CATS: [
    { k: "seiri",    n: "1S - Seiri (Ayıkla)",       d: "Gereksiz eşyaları ayıkla, sadece gerekli tut" },
    { k: "seiton",   n: "2S - Seiton (Düzenle)",     d: "Her şey için yer, her şey yerinde" },
    { k: "seiso",    n: "3S - Seiso (Temizle)",      d: "Alan ve ekipmanları temiz tut" },
    { k: "seiketsu", n: "4S - Seiketsu (Standartlaştır)", d: "Standartlar oluştur, görselleştir" },
    { k: "shitsuke", n: "5S - Shitsuke (Disiplin)",  d: "Disiplini koru, sürekli iyileştir" }
  ],
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("✅", "5S Denetimi", "İşyeri düzeni ve disiplini için 5 adımlı skorlu denetim.")}

      <div class="card">
        <h3>📝 Denetim Bilgisi</h3>
        <div class="field"><label>Alan / Bölüm</label><input id="area" placeholder="Ör: Hat-1 Montaj"></div>
        <div class="grid-2">
          <div class="field"><label>Denetleyen</label><input id="auditor" placeholder="Ad Soyad"></div>
          <div class="field"><label>Tarih</label><input id="date" type="date"></div>
        </div>
      </div>

      ${this.CATS.map(c => `
        <div class="card">
          <div class="fives-cat">
            <div class="fc-head">
              <span>${c.n}</span>
              <strong id="val-${c.k}">2</strong>
            </div>
            <small style="color:var(--muted)">${c.d} • 0=Yok, 1=Zayıf, 2=Orta, 3=İyi, 4=Mükemmel</small>
            <input type="range" min="0" max="4" value="2" id="r-${c.k}" style="margin-top:8px">
            <textarea id="n-${c.k}" placeholder="Bulgular, öneriler" style="margin-top:6px"></textarea>
          </div>
        </div>
      `).join("")}

      <div class="card">
        <h3>📊 Genel Skor</h3>
        <div id="score"></div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div class="card" style="margin-top:12px">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    this.CATS.forEach(c => {
      const r = root.querySelector("#r-" + c.k);
      const v = root.querySelector("#val-" + c.k);
      r.oninput = () => { v.textContent = r.value; this.renderScore(root); };
    });
    this.renderScore(root);
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  renderScore(root) {
    const scores = this.CATS.map(c => +root.querySelector("#r-" + c.k).value);
    const total = scores.reduce((s, x) => s + x, 0);
    const pct = (total / 20) * 100;
    const color = pct >= 80 ? "success" : pct >= 60 ? "amber" : "danger";
    root.querySelector("#score").innerHTML = `
      <div class="kpi-grid">
        <div class="kpi ${color}"><div class="label">Toplam</div><div class="value">${total}/20</div></div>
        <div class="kpi"><div class="label">Yüzde</div><div class="value">${pct.toFixed(0)}%</div></div>
      </div>
      <div class="list-item"><div class="li-main">
        <div class="li-title">${pct >= 80 ? '🏆 Mükemmel' : pct >= 60 ? '👍 İyi - Geliştirilebilir' : '⚠️ Aksiyon Gerekli'}</div>
      </div></div>
    `;
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("✅", "Henüz denetim yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.area)}</div>
          <div class="li-sub">${UI.escape(it.auditor || "")} • ${UI.escape(it.date || "")} • Skor: ${it.total}/50</div>
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
      root.querySelector("#area").value = it.area || "";
      root.querySelector("#auditor").value = it.auditor || "";
      root.querySelector("#date").value = it.date || "";
      this.CATS.forEach(c => {
        const s = (it.scores || {})[c.k] ?? 2;
        root.querySelector("#r-" + c.k).value = s;
        root.querySelector("#val-" + c.k).textContent = s;
        root.querySelector("#n-" + c.k).value = (it.notes || {})[c.k] || "";
      });
      this.renderScore(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    root.querySelector("#area").value = "";
    root.querySelector("#auditor").value = "";
    root.querySelector("#date").value = "";
    this.CATS.forEach(c => {
      root.querySelector("#r-" + c.k).value = 2;
      root.querySelector("#val-" + c.k).textContent = 2;
      root.querySelector("#n-" + c.k).value = "";
    });
    this.renderScore(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const area = root.querySelector("#area").value.trim();
    if (!area) { UI.toast("Alan gerekli", "danger"); return; }
    const scores = {}; const notes = {};
    this.CATS.forEach(c => {
      scores[c.k] = +root.querySelector("#r-" + c.k).value;
      notes[c.k] = root.querySelector("#n-" + c.k).value.trim();
    });
    const total = Object.values(scores).reduce((s, x) => s + x, 0);
    const data = {
      area, auditor: root.querySelector("#auditor").value.trim(),
      date: root.querySelector("#date").value,
      scores, notes, total
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const latest = records[records.length - 1];
    const scores = latest.scores || {};
    // Weakest S
    const entries = this.CATS.map(c => ({ k: c.k, n: c.n, v: +scores[c.k] || 0 }));
    entries.sort((a, b) => a.v - b.v);
    const weakest = entries[0];
    const total = entries.reduce((s, x) => s + x.v, 0);
    const pct = (total / 20) * 100;
    if (pct >= 80) insights.push(Analyze.insight("success", `5S skoru %${pct.toFixed(0)} — Mükemmel`, "Standartlar iyi kurulmuş; disiplini sürdürün."));
    else if (pct >= 60) insights.push(Analyze.insight("warn", `5S skoru %${pct.toFixed(0)} — İyi ama geliştirilebilir`, "Standartlaştırma ve disiplin üzerine yoğunlaşın."));
    else insights.push(Analyze.insight("danger", `5S skoru %${pct.toFixed(0)} — Aksiyon gerekli`, "60% altı ciddi eksiklik; temel 3S (Ayıkla-Düzenle-Temizle) öncelikli."));
    text.push(`5S skoru: %${pct.toFixed(0)} (${total}/20)`);
    if (weakest) {
      insights.push(Analyze.insight("action", `En zayıf adım: ${weakest.n}`, `Puan: ${weakest.v}/4. Bu adıma özel aksiyon planı oluşturun.`));
      text.push(`Zayıf adım: ${weakest.n} (${weakest.v}/4)`);
    }
    const zeros = entries.filter(e => e.v === 0);
    if (zeros.length) {
      insights.push(Analyze.insight("danger", `${zeros.length} adımda hiç uygulama yok`, zeros.map(z => z.n).join(", ")));
    }
    // Trend
    if (records.length > 1) {
      const prev = records[records.length - 2];
      const prevTotal = Object.values(prev.scores || {}).reduce((s, x) => s + (+x || 0), 0);
      const delta = total - prevTotal;
      if (delta !== 0) {
        insights.push(Analyze.insight(delta > 0 ? "success" : "danger", `Önceki denetime göre ${delta > 0 ? "+" : ""}${delta} puan`, delta > 0 ? "İyileşme gözlendi." : "Gerileme var; kök neden analizi yapın."));
      }
      // Trend across all records
      const avg = records.reduce((s, r) => s + (+r.total || 0), 0) / records.length;
      insights.push(Analyze.insight("info", `Ortalama skor: ${avg.toFixed(1)}/20`, `${records.length} denetim kaydından.`));
    }
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("✅", "5S denetimi kaydedin, analiz otomatik oluşur."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "5S Otomatik Analizi", "", a.insights.join(""));
  }
};
