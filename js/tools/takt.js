const Takt = {
  KEY: "takt",
  state: { editingId: null },
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("⏱️", "Takt Zamanı", "Müşteri talebine göre üretim ritmini hesaplayın. Takt = Net Süre / Talep")}

      <div class="card">
        <h3>📝 Veri Girişi</h3>
        <div class="field"><label>Ürün / Hat</label><input id="name" placeholder="Ör: Motor Montaj"></div>
        <div class="grid-2">
          <div class="field"><label>Vardiya Sayısı</label><input id="shifts" type="number" min="1" value="1"></div>
          <div class="field"><label>Vardiya Süresi (dk)</label><input id="shiftMin" type="number" min="0" value="480"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Mola / Kayıp (dk)</label><input id="breakMin" type="number" min="0" value="60"></div>
          <div class="field"><label>Planlı Duruş (dk)</label><input id="plannedDown" type="number" min="0" value="0"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Müşteri Talebi (adet)</label><input id="demand" type="number" min="1" value="100"></div>
          <div class="field"><label>Talep Dönemi</label>
            <select id="period"><option value="shift">Vardiya</option><option value="day">Gün</option><option value="week">Hafta</option></select>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="calcBtn">🧮 Hesapla</button>
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📊 Hesaplanan Sonuçlar</h3>
        <div id="result">
          <div class="empty"><div class="empty-icon">⏱️</div><div>Değerleri girin ve "Hesapla"ya basın.</div></div>
        </div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#calcBtn").onclick = () => this.calc(root);
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  calc(root) {
    const shifts = +root.querySelector("#shifts").value;
    const shiftMin = +root.querySelector("#shiftMin").value;
    const breakMin = +root.querySelector("#breakMin").value || 0;
    const planned = +root.querySelector("#plannedDown").value || 0;
    const demand = +root.querySelector("#demand").value;
    const period = root.querySelector("#period").value || "shift";
    const netMin = shifts * shiftMin - breakMin - planned;
    if (shifts <= 0 || shiftMin <= 0 || demand <= 0 || netMin <= 0) {
      UI.toast("Geçerli pozitif değerler girin", "danger"); return null;
    }
    /* Net time entered covers ${shifts} shifts (one production day). Scale demand
       to that same window so Takt = Available Time / Demand stays dimensionally correct. */
    const periodFactor = period === "shift" ? shifts : period === "week" ? (1/5) : 1;
    const demandAdj = demand * periodFactor;
    const taktSec = (netMin * 60) / demandAdj;
    const taktMin = taktSec / 60;
    const hourlyRate = 60 / taktMin;
    root.querySelector("#result").innerHTML = `
      <div class="kpi-grid">
        <div class="kpi amber">
          <div class="label">Takt Zamanı</div>
          <div class="value">${taktSec.toFixed(1)} sn</div>
          <div class="sub">${taktMin.toFixed(2)} dk / birim</div>
        </div>
        <div class="kpi success">
          <div class="label">Net Çalışma</div>
          <div class="value">${netMin} dk</div>
          <div class="sub">${(netMin / 60).toFixed(2)} saat</div>
        </div>
        <div class="kpi">
          <div class="label">Saatlik Üretim</div>
          <div class="value">${hourlyRate.toFixed(1)}</div>
          <div class="sub">adet / saat</div>
        </div>
        <div class="kpi danger">
          <div class="label">Talep</div>
          <div class="value">${demand}</div>
          <div class="sub">adet</div>
        </div>
      </div>
      <div class="list-item" style="margin-top:8px">
        <div class="li-main">
          <div class="li-title">📐 Formül</div>
          <div class="li-sub">Takt = Net Çalışma Süresi ÷ Müşteri Talebi</div>
          <div class="li-sub">= (${shifts} × ${shiftMin} - ${breakMin} - ${planned}) × 60 / ${demandAdj.toFixed(0)}</div>
          <div class="li-sub">= ${(netMin * 60).toFixed(0)} sn / ${demandAdj.toFixed(0)} = <strong>${taktSec.toFixed(1)} sn</strong></div>
          ${period !== "day" ? `<div class="li-sub" style="color:var(--muted)">Dönem ölçeklemesi: ${demand} ${period === "shift" ? "× " + shifts + " vardiya" : "÷ 5 iş günü"} = ${demandAdj.toFixed(0)} adet/gün</div>` : ""}
        </div>
      </div>
    `;
    return { shifts, shiftMin, breakMin, planned, demand, period, netMin, taktSec, taktMin, hourlyRate };
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("⏱️", "Henüz hesaplama yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.name)}</div>
          <div class="li-sub">Takt: ${it.taktSec?.toFixed(1)} sn • Talep: ${it.demand} • ${UI.fmtDate(it.updatedAt)}</div>
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
      root.querySelector("#name").value = it.name || "";
      ["shifts", "shiftMin", "breakMin", "plannedDown", "demand"].forEach(k => {
        const el = root.querySelector("#" + k);
        if (el && it[k] != null) el.value = it[k];
      });
      root.querySelector("#period").value = it.period || "shift";
      this.calc(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    root.querySelector("#name").value = "";
    root.querySelector("#shifts").value = 1;
    root.querySelector("#shiftMin").value = 480;
    root.querySelector("#breakMin").value = 60;
    root.querySelector("#plannedDown").value = 0;
    root.querySelector("#demand").value = 100;
    root.querySelector("#result").innerHTML = "";
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const name = root.querySelector("#name").value.trim();
    if (!name) { UI.toast("Ürün/hat adı gerekli", "danger"); return; }
    const r = this.calc(root); if (!r) return;
    const data = { name, ...r, period: root.querySelector("#period").value };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const takts = records.map(r => +r.taktSec || 0).filter(v => v > 0);
    if (!takts.length) return { insights: [Analyze.insight("info", "Takt verisi yok", "Hesaplama yapıp kaydedin.")], text: ["Takt verisi yok."] };
    const mean = takts.reduce((s, x) => s + x, 0) / takts.length;
    const min = Math.min(...takts);
    const max = Math.max(...takts);
    const latest = records[records.length - 1];
    insights.push(Analyze.insight("info", `Ortalama Takt: ${mean.toFixed(1)} sn`, `${records.length} kayıt • Min: ${min.toFixed(1)} sn • Max: ${max.toFixed(1)} sn`));
    text.push(`Ortalama takt: ${mean.toFixed(1)} sn (n=${records.length})`);
    if (latest && latest.taktSec) {
      const diff = latest.taktSec - mean;
      if (Math.abs(diff) > mean * 0.1) {
        insights.push(Analyze.insight(diff < 0 ? "success" : "warn", `Son kayıt ortalamadan ${diff > 0 ? "+" : ""}${diff.toFixed(1)} sn`, diff < 0 ? "Daha hızlı ritim; talep artışında hazırsınız." : "Daha yavaş ritim; müşteri talebini karşılamada risk."));
      }
    }
    if (records.length === 1) {
      insights.push(Analyze.insight("warn", "Darboğaz tespiti için tek kayıt yetersiz", "Birden fazla hat/ürün için kayıt ekleyin; en yavaş Takt darboğazı gösterir."));
      text.push("Tek kayıt - darboğaz analizi yok.");
    } else {
      const slowestIdx = takts.indexOf(max);
      const slowest = records[slowestIdx];
      insights.push(Analyze.insight("action", `Darboğaz: ${UI.escape(slowest.name || "?")}`, `Takt ${max.toFixed(1)} sn ile en yavaş. Bu hat/ürün akışı belirler; SMED / TPM odağı.`));
      text.push(`Darboğaz: ${slowest.name} (${max.toFixed(1)} sn)`);
    }
    const spread = max - min;
    if (spread > mean * 0.3 && records.length > 1) {
      insights.push(Analyze.insight("warn", `Takt yayılımı yüksek (${spread.toFixed(1)} sn)`, "Hatlar/ürünler arası dengesizlik var. Heijunka ile seviyelendirmeyi değerlendirin."));
    }
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("⏱️", "Takt hesaplayıp kaydedin, analiz otomatik oluşur."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "Takt Otomatik Analizi", "", a.insights.join(""));
  }
};
