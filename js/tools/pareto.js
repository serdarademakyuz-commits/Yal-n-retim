const Pareto = {
  KEY: "pareto",
  state: { editingId: null, items: [] },

  render(root) {
    this.state.editingId = null;
    this.state.items = [];
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("📊", "Pareto Analizi", "80/20 kuralı ile kritik problemleri belirleyin.")}

      <div class="card">
        <h3>📝 Yeni Analiz</h3>
        <div class="field"><label>Analiz Başlığı</label><input id="title" placeholder="Ör: Hat 2 hurda nedenleri"></div>
        <div class="field"><label>Dönem</label><input id="period" placeholder="Ör: Ocak 2026"></div>

        <h4 style="margin:10px 0 6px; color:var(--navy)">Veri Girişi (Kategori + Frekans)</h4>
        <div class="grid-2">
          <input id="newCat" placeholder="Kategori / Hata türü">
          <input id="newVal" type="number" min="0" placeholder="Frekans / Adet">
        </div>
        <button class="btn btn-accent btn-block" id="addItem" style="margin-top:8px">➕ Ekle</button>

        <div id="itemsWrap" style="margin-top:10px"></div>
      </div>

      <div class="card">
        <h3>📈 Pareto Grafiği</h3>
        <div id="chartWrap"></div>
        <div id="analysisWrap" style="margin-top:10px"></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div class="card" style="margin-top:12px">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    root.querySelector("#addItem").onclick = () => {
      const cat = root.querySelector("#newCat").value.trim();
      const val = parseFloat(root.querySelector("#newVal").value);
      if (!cat || !(val >= 0)) { UI.toast("Kategori ve sayı girin", "danger"); return; }
      this.state.items.push({ cat, val });
      root.querySelector("#newCat").value = "";
      root.querySelector("#newVal").value = "";
      this.renderItems(root);
      this.renderChart(root);
    };

    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); };

    this.renderItems(root);
    this.renderChart(root);
    this.renderList(root);
  },

  renderItems(root) {
    const wrap = root.querySelector("#itemsWrap");
    if (!this.state.items.length) { wrap.innerHTML = '<small style="color:var(--muted)">Henüz veri yok.</small>'; return; }
    wrap.innerHTML = this.state.items.map((it, i) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.cat)}</div>
          <div class="li-sub">${it.val}</div>
        </div>
        <button class="btn btn-danger btn-sm" data-i="${i}">❌</button>
      </div>
    `).join("");
    wrap.querySelectorAll("button[data-i]").forEach(b => b.onclick = (e) => {
      this.state.items.splice(parseInt(e.target.dataset.i), 1);
      this.renderItems(root);
      this.renderChart(root);
    });
  },

  renderChart(root) {
    const c = root.querySelector("#chartWrap");
    const a = root.querySelector("#analysisWrap");
    if (!this.state.items.length) {
      c.innerHTML = UI.emptyState("📊", "Veri girin, grafik otomatik oluşacak.");
      a.innerHTML = "";
      return;
    }
    const sorted = [...this.state.items].sort((x, y) => y.val - x.val);
    const rawTotal = sorted.reduce((s, x) => s + x.val, 0);
    if (rawTotal <= 0) {
      c.innerHTML = UI.emptyState("📊", "Sıfırdan büyük değer girin, grafik oluşsun.");
      a.innerHTML = "";
      return;
    }
    const total = rawTotal;
    const max = sorted[0].val || 1;
    let cum = 0;
    let vital = [];
    const withPct = sorted.map(x => {
      cum += x.val;
      const pct = (x.val / total) * 100;
      const cumPct = (cum / total) * 100;
      const isVital = cumPct <= 80 || vital.length === 0;
      if (isVital) vital.push(x);
      return { ...x, pct, cumPct, isVital };
    });

    c.innerHTML = `
      <div class="chart-bar">
        ${withPct.map(x => `
          <div class="bar-col">
            <div class="bar-val">${x.val}</div>
            <div class="bar ${x.isVital ? 'vital' : ''}" style="height:${(x.val / max) * 130}px" title="${x.cumPct.toFixed(1)}%"></div>
            <div class="bar-label">${UI.escape(x.cat)}</div>
          </div>
        `).join("")}
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:var(--muted)">
        <span>🔴 Hayati Az (≤80%)</span><span>🟡 Önemli Çok</span>
      </div>
    `;

    const vitalPct = ((vital.reduce((s, x) => s + x.val, 0) / total) * 100).toFixed(1);
    a.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi danger">
          <div class="label">Hayati Az</div>
          <div class="value">${vital.length}</div>
          <div class="sub">%${vitalPct} etki</div>
        </div>
        <div class="kpi amber">
          <div class="label">Toplam</div>
          <div class="value">${total}</div>
          <div class="sub">${withPct.length} kategori</div>
        </div>
      </div>
      <div class="list-item" style="margin-top:6px">
        <div class="li-main">
          <div class="li-title">🎯 Odaklanılacak (80/20)</div>
          <div class="li-sub">${vital.map(v => UI.escape(v.cat)).join(", ")}</div>
        </div>
      </div>
    `;
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("📊", "Henüz kayıt yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)}</div>
          <div class="li-sub">${UI.escape(it.period || "")} • ${it.items.length} kategori • ${UI.fmtDate(it.updatedAt)}</div>
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
      this.state.items = [...(it.items || [])];
      root.querySelector("#title").value = it.title;
      root.querySelector("#period").value = it.period || "";
      this.renderItems(root); this.renderChart(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  clearForm(root) {
    this.state.editingId = null;
    this.state.items = [];
    root.querySelector("#title").value = "";
    root.querySelector("#period").value = "";
    this.renderItems(root); this.renderChart(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },

  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    if (!this.state.items.length) { UI.toast("En az 1 veri girin", "danger"); return; }
    const data = {
      title,
      period: root.querySelector("#period").value.trim(),
      items: this.state.items
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
