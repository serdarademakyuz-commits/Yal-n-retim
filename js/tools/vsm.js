const VSM = {
  KEY: "vsm",
  state: { editingId: null, nodes: [] },
  render(root) {
    this.state.editingId = null;
    this.state.nodes = [];
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("🗺️", "Değer Akış Haritalama (VSM)", "Hammadde → Müşteri akışında değer katan ve katmayan süreleri görün.")}

      <div class="card">
        <h3>📝 Akış Bilgisi</h3>
        <div class="field"><label>Harita Başlığı</label><input id="title" placeholder="Ör: Ürün A Değer Akışı"></div>
        <div class="grid-2">
          <div class="field"><label>Müşteri Talebi (adet/gün)</label><input id="demand" type="number" value="1000"></div>
          <div class="field"><label>Çalışma Süresi (sn/gün)</label><input id="avail" type="number" value="28800"></div>
        </div>
      </div>

      <div class="card">
        <h3>➕ Düğüm Ekle</h3>
        <div class="field"><label>Tür</label>
          <select id="nodeType">
            <option value="process">🏭 Proses</option>
            <option value="inventory">📦 Stok</option>
            <option value="transport">🚚 Taşıma</option>
          </select>
        </div>
        <div class="field"><label>Ad</label><input id="nodeName" placeholder="Ör: CNC İşleme"></div>
        <div class="grid-2">
          <div class="field"><label>Çevrim Süresi (sn)</label><input id="ct" type="number" step="0.1" value="0"></div>
          <div class="field"><label>Bekleme (dk)</label><input id="lt" type="number" step="0.1" value="0"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Operatör Sayısı</label><input id="op" type="number" value="1"></div>
          <div class="field"><label>Değer Katan? </label>
            <select id="va"><option value="yes">Evet (VA)</option><option value="no">Hayır (NVA)</option></select>
          </div>
        </div>
        <button class="btn btn-accent btn-block" id="addNode">➕ Akışa Ekle</button>
      </div>

      <div class="card">
        <h3>🗺️ Akış Haritası</h3>
        <div id="chain"></div>
      </div>

      <div class="card">
        <h3>📊 Akış Metrikleri</h3>
        <div id="metrics"></div>
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
    root.querySelector("#addNode").onclick = () => {
      const n = {
        type: root.querySelector("#nodeType").value,
        name: root.querySelector("#nodeName").value.trim(),
        ct: +root.querySelector("#ct").value,
        lt: +root.querySelector("#lt").value,
        op: +root.querySelector("#op").value,
        va: root.querySelector("#va").value === "yes"
      };
      if (!n.name) { UI.toast("Ad gerekli", "danger"); return; }
      this.state.nodes.push(n);
      root.querySelector("#nodeName").value = "";
      root.querySelector("#ct").value = 0;
      root.querySelector("#lt").value = 0;
      this.renderChain(root);
      this.renderMetrics(root);
      this.renderAnalysis(root);
    };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderChain(root);
    this.renderMetrics(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  renderChain(root) {
    const w = root.querySelector("#chain");
    if (!this.state.nodes.length) { w.innerHTML = UI.emptyState("🗺️", "Düğüm ekleyerek akış oluşturun."); return; }
    w.innerHTML = `
      <div class="vsm-chain">
        ${this.state.nodes.map((n, i) => `
          ${i > 0 ? '<div class="vsm-arrow">➡️</div>' : ''}
          <div class="vsm-node ${n.type === 'inventory' ? 'inventory' : ''}" style="border-color:${n.va ? 'var(--success)' : 'var(--danger)'}">
            <strong>${n.type === 'process' ? '🏭' : n.type === 'inventory' ? '📦' : '🚚'} ${UI.escape(n.name)}</strong>
            ${n.ct ? `CT: ${n.ct} sn<br>` : ''}
            ${n.lt ? `LT: ${n.lt} dk<br>` : ''}
            ${n.op ? `OP: ${n.op}<br>` : ''}
            <span class="badge ${n.va ? 'success' : 'danger'}">${n.va ? 'VA' : 'NVA'}</span>
            <button class="btn btn-danger btn-sm" style="margin-top:4px" data-i="${i}">❌</button>
          </div>
        `).join("")}
      </div>
    `;
    w.querySelectorAll("button[data-i]").forEach(b => b.onclick = (e) => {
      this.state.nodes.splice(+e.target.dataset.i, 1);
      this.renderChain(root); this.renderMetrics(root); this.renderAnalysis(root);
    });
  },
  renderMetrics(root) {
    const m = root.querySelector("#metrics");
    const totalCT = this.state.nodes.reduce((s, n) => s + (n.ct || 0), 0);
    const totalLT = this.state.nodes.reduce((s, n) => s + (n.lt || 0) * 60, 0);
    const vaTime = this.state.nodes.filter(n => n.va).reduce((s, n) => s + (n.ct || 0), 0);
    const leadTime = totalCT + totalLT;
    const nvaTime = leadTime - vaTime;
    const pct = leadTime > 0 ? (vaTime / leadTime) * 100 : 0;
    const demand = +root.querySelector("#demand").value || 0;
    const avail = +root.querySelector("#avail").value || 0;
    const takt = demand > 0 ? avail / demand : 0;
    m.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi success"><div class="label">Toplam VA (Değer)</div><div class="value">${vaTime.toFixed(0)} sn</div></div>
        <div class="kpi danger"><div class="label">Toplam NVA (Kayıp)</div><div class="value">${nvaTime.toFixed(0)} sn</div></div>
        <div class="kpi amber"><div class="label">Toplam Akış Süresi (Lead Time)</div><div class="value">${leadTime.toFixed(0)} sn</div></div>
        <div class="kpi"><div class="label">VA Oranı</div><div class="value">${pct.toFixed(1)}%</div></div>
      </div>
      <div class="list-item" style="margin-top:8px"><div class="li-main">
        <div class="li-title">⏱️ Takt</div>
        <div class="li-sub">${takt.toFixed(1)} sn/birim • Hedef çevrim süresi (Net Süre / Talep)</div>
      </div></div>
      <div class="list-item"><div class="li-main">
        <div class="li-title">📐 Formüller</div>
        <div class="li-sub">Lead Time = Σ CT + Σ Bekleme • VA Oranı = VA / Lead Time</div>
      </div></div>
    `;
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🗺️", "Henüz harita yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)}</div>
          <div class="li-sub">${(it.nodes || []).length} düğüm • ${UI.fmtDate(it.updatedAt)}</div>
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
      this.state.nodes = [...(it.nodes || [])];
      root.querySelector("#title").value = it.title || "";
      root.querySelector("#demand").value = it.demand || 1000;
      root.querySelector("#avail").value = it.avail || 28800;
      this.renderChain(root); this.renderMetrics(root); this.renderAnalysis(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    this.state.nodes = [];
    root.querySelector("#title").value = "";
    this.renderChain(root); this.renderMetrics(root); this.renderAnalysis(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const data = {
      title,
      demand: +root.querySelector("#demand").value,
      avail: +root.querySelector("#avail").value,
      nodes: this.state.nodes
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const insights = [], text = [];
    // Use latest record if available, otherwise current state if present
    let nodes = [];
    if (records && records.length) {
      const latest = records[records.length - 1];
      nodes = latest.nodes || [];
    } else if (this.state && this.state.nodes && this.state.nodes.length) {
      nodes = this.state.nodes;
    } else {
      return { insights: [], text: ["Kayıt yok."] };
    }
    if (!nodes.length) {
      return { insights: [Analyze.insight("info", "Düğüm yok", "Akışa en az bir düğüm ekleyin.")], text: ["Düğüm yok."] };
    }
    const totalCT = nodes.reduce((s, n) => s + (+n.ct || 0), 0);
    const totalLTsec = nodes.reduce((s, n) => s + (+n.lt || 0) * 60, 0);
    const leadTime = totalCT + totalLTsec;
    const vaTime = nodes.filter(n => n.va).reduce((s, n) => s + (+n.ct || 0), 0);
    const nvaTime = leadTime - vaTime;
    const pct = leadTime > 0 ? (vaTime / leadTime) * 100 : 0;
    if (leadTime <= 0) {
      insights.push(Analyze.insight("warn", "Süre verisi yok", "Çevrim ve bekleme sürelerini girin."));
      return { insights, text: ["Süre verisi yok."] };
    }
    if (pct >= 25) insights.push(Analyze.insight("success", `VA oranı %${pct.toFixed(1)} — İyi seviye`, "25% üstü yalın akış için iyi bir göstergedir."));
    else if (pct >= 5) insights.push(Analyze.insight("warn", `VA oranı %${pct.toFixed(1)} — Tipik`, "Çoğu işletmede %5 civarındadır; hedef %25 üzeri."));
    else insights.push(Analyze.insight("danger", `VA oranı %${pct.toFixed(1)} — Düşük`, "Değer katmayan süre baskın; NVA düğümlerini azaltın."));
    text.push(`VA: %${pct.toFixed(1)} (${vaTime.toFixed(0)}/${leadTime.toFixed(0)} sn)`);

    // Dominant NVA source by type
    const byType = { process: 0, inventory: 0, transport: 0 };
    nodes.forEach(n => {
      const contrib = (+n.ct || 0) + (+n.lt || 0) * 60;
      const isNVA = !n.va;
      if (isNVA) byType[n.type || "process"] = (byType[n.type || "process"] || 0) + contrib;
    });
    const typeName = { process: "Proses", inventory: "Stok", transport: "Taşıma" };
    const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    if (sortedTypes[0] && sortedTypes[0][1] > 0) {
      const [tk, tv] = sortedTypes[0];
      insights.push(Analyze.insight("action", `Baskın NVA kaynağı: ${typeName[tk] || tk}`, `${tv.toFixed(0)} sn NVA bu kategoriden. Öncelikle bu alana muda analizi uygulayın.`));
      text.push(`Baskın NVA: ${typeName[tk] || tk} (${tv.toFixed(0)} sn)`);
    }
    const nvaCount = nodes.filter(n => !n.va).length;
    if (nvaCount > 0) {
      insights.push(Analyze.insight("info", `${nvaCount} NVA düğümü / ${nodes.length} toplam`, "NVA düğümleri değer katmıyor; ortadan kaldırma veya azaltma adayıdır."));
    }
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    const hasCurrent = this.state && this.state.nodes && this.state.nodes.length;
    if (!records.length && !hasCurrent) { wrap.innerHTML = Analyze.empty("🗺️", "Düğüm ekleyin veya kaydedin, analiz otomatik oluşur."); return; }
    const a = this.analyze(hasCurrent ? [{ nodes: this.state.nodes }] : records);
    wrap.innerHTML = Analyze.card("🔍", "VSM Otomatik Analizi", "", a.insights.join(""));
  }
};
