const JIT = {
  KEY: "jit",
  state: { editingId: null },
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("⏳", "Just-In-Time (JIT)", "Yeniden sipariş noktası, güvenlik stoğu ve EOQ hesaplama.")}

      <div class="card">
        <h3>📝 Malzeme / Parça Bilgisi</h3>
        <div class="field"><label>Malzeme / Parça Adı</label><input id="name" placeholder="Ör: Vida M6x20"></div>
        <div class="field"><label>Tedarikçi</label><input id="supplier"></div>
        <div class="grid-2">
          <div class="field"><label>Günlük Tüketim</label><input id="daily" type="number" min="0" value="100"></div>
          <div class="field"><label>Temin Süresi (gün)</label><input id="leadTime" type="number" min="0" value="5"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Güvenlik Stoğu (gün)</label><input id="safety" type="number" min="0" value="2"></div>
          <div class="field"><label>Sipariş Maliyeti (TL)</label><input id="orderCost" type="number" min="0" value="50"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Birim Maliyet (TL)</label><input id="unitCost" type="number" step="0.01" value="1"></div>
          <div class="field"><label>Elde Bulundurma (%/yıl)</label><input id="holdingPct" type="number" step="0.1" value="20"></div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="calcBtn">🧮 Hesapla</button>
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📊 Sonuç</h3>
        <div id="result"><div class="empty"><div class="empty-icon">⏳</div><div>"Hesapla"ya basın.</div></div></div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#calcBtn").onclick = () => { this.calc(root); this.renderAnalysis(root); };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  calc(root) {
    const daily = +root.querySelector("#daily").value || 0;
    const leadTime = +root.querySelector("#leadTime").value || 0;
    const safetyDays = +root.querySelector("#safety").value || 0;
    const orderCost = +root.querySelector("#orderCost").value || 0;
    const unitCost = +root.querySelector("#unitCost").value || 0;
    const holdingPct = +root.querySelector("#holdingPct").value || 0;

    const annual = daily * 250;
    const holdingUnit = unitCost * (holdingPct / 100);
    const safetyStock = daily * safetyDays;
    const rop = daily * leadTime + safetyStock;
    const eoq = holdingUnit > 0 ? Math.sqrt((2 * annual * orderCost) / holdingUnit) : 0;
    const cycleDays = daily > 0 ? eoq / daily : 0;
    root.querySelector("#result").innerHTML = `
      <div class="kpi-grid">
        <div class="kpi danger"><div class="label">Yeniden Sipariş (ROP)</div><div class="value">${rop.toFixed(0)}</div></div>
        <div class="kpi amber"><div class="label">Güvenlik Stoğu</div><div class="value">${safetyStock.toFixed(0)}</div></div>
        <div class="kpi success"><div class="label">EOQ</div><div class="value">${eoq.toFixed(0)}</div></div>
        <div class="kpi"><div class="label">Çevrim</div><div class="value">${cycleDays.toFixed(1)} gün</div></div>
      </div>
      <div class="list-item" style="margin-top:8px">
        <div class="li-main">
          <div class="li-title">📐 Formüller</div>
          <div class="li-sub">ROP = Günlük × Lead Time + Güvenlik Stoğu = ${daily} × ${leadTime} + ${safetyStock}</div>
          <div class="li-sub">EOQ = √(2 × Yıllık × Sipariş Mal. / Tutma Mal.)</div>
          <div class="li-sub">Yıllık talep tahmini: ${annual.toFixed(0)} (250 iş günü)</div>
        </div>
      </div>
    `;
    return { daily, leadTime, safetyDays, orderCost, unitCost, holdingPct, rop, safetyStock, eoq, annual };
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("⏳", "Henüz JIT kaydı yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.name)}</div>
          <div class="li-sub">${UI.escape(it.supplier || "")} • ROP: ${it.rop?.toFixed(0)} • EOQ: ${it.eoq?.toFixed(0)}</div>
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
      root.querySelector("#supplier").value = it.supplier || "";
      ["daily", "leadTime", "safety", "orderCost", "unitCost", "holdingPct"].forEach(k => {
        const map = { safety: "safetyDays" };
        const val = it[map[k] || k]; if (val != null) root.querySelector("#" + k).value = val;
      });
      this.calc(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    ["name", "supplier"].forEach(k => root.querySelector("#" + k).value = "");
    root.querySelector("#daily").value = 100;
    root.querySelector("#leadTime").value = 5;
    root.querySelector("#safety").value = 2;
    root.querySelector("#orderCost").value = 50;
    root.querySelector("#unitCost").value = 1;
    root.querySelector("#holdingPct").value = 20;
    root.querySelector("#result").innerHTML = "";
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const name = root.querySelector("#name").value.trim();
    if (!name) { UI.toast("Malzeme adı gerekli", "danger"); return; }
    const r = this.calc(root);
    const data = { name, supplier: root.querySelector("#supplier").value, ...r };
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
    const daily = +latest.daily || 0;
    const rop = +latest.rop || 0;
    const eoq = +latest.eoq || 0;
    const safetyStock = +latest.safetyStock || 0;
    const leadTime = +latest.leadTime || 0;
    const coverage = daily > 0 ? rop / daily : 0;
    const eoqRatio = daily > 0 ? eoq / daily : 0;
    insights.push(Analyze.insight("info", `Stok kapsamı: ${coverage.toFixed(1)} gün`,
      `ROP ${rop.toFixed(0)} adet ${daily} adet/gün tüketimle ${coverage.toFixed(1)} güne yeter.`));
    text.push(`Kapsam: ${coverage.toFixed(1)} gün`);
    if (coverage < leadTime && leadTime > 0) {
      insights.push(Analyze.insight("danger", "Sipariş noktası temin süresini karşılamıyor", "ROP temin süresi boyunca yetmez; güvenlik stoğunu artırın."));
    }
    if (eoq > 0 && daily > 0) {
      insights.push(Analyze.insight("info", `EOQ / Günlük talep: ${eoqRatio.toFixed(1)}x`,
        `Bir siparişle ${eoqRatio.toFixed(1)} günlük tüketim karşılanır.`));
      text.push(`EOQ/Gün: ${eoqRatio.toFixed(1)}`);
      if (eoqRatio > 30) {
        insights.push(Analyze.insight("warn", "EOQ çok büyük", "30 günden fazla stok; sipariş maliyeti yüksek veya tutma maliyeti düşük. JIT ile daha sık sipariş değerlendirin."));
      } else if (eoqRatio < 1) {
        insights.push(Analyze.insight("warn", "EOQ çok küçük", "Günlük talepten az; çok sık sipariş gerekir. Sipariş maliyeti yüksek olabilir."));
      }
    }
    if (safetyStock === 0) {
      insights.push(Analyze.insight("warn", "Güvenlik stoğu yok", "Tedarikçi belirsizliğinde stok sıkıntısı riski; güvenlik stoğunu 0'dan yüksek tutun."));
    }
    // Reorder urgency heuristic based on coverage vs lead time
    if (leadTime > 0 && coverage > 0) {
      const urgencyRatio = coverage / leadTime;
      if (urgencyRatio < 1.2) insights.push(Analyze.insight("action", "Yeniden sipariş aciliyeti yüksek", "Mevcut kapsam temin süresine çok yakın; sipariş tetiklenmeli."));
      else if (urgencyRatio < 1.5) insights.push(Analyze.insight("warn", "Sipariş dikkat seviyesinde", "Takip edin; güvenlik stoğu marjı dar."));
      else insights.push(Analyze.insight("success", "Sipariş marjı rahat", "Kapsam temin süresinin üstünde; plan güvenli."));
    }
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("⏳", "JIT kaydı ekleyin, analiz otomatik oluşur."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "JIT Otomatik Analizi", "", a.insights.join(""));
  }
};
