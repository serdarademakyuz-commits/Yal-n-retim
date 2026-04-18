const Heijunka = {
  KEY: "heijunka",
  state: { editingId: null, products: [], days: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] },
  render(root) {
    this.state.editingId = null;
    this.state.products = [{ name: "Ürün A", qty: [0,0,0,0,0,0,0] }];
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("📦", "Heijunka - Üretim Dengeleme", "Haftalık talebi günlere dengeli dağıtarak dalgalanmayı azaltın.")}

      <div class="card">
        <h3>📝 Plan Bilgisi</h3>
        <div class="field"><label>Plan Adı</label><input id="title" placeholder="Ör: Hat 2 Hafta 16 Planı"></div>
        <div class="field"><label>Dönem</label><input id="period" placeholder="Ör: 18-24 Nisan 2026"></div>

        <div class="btn-row">
          <button class="btn btn-accent btn-sm" id="addProd">➕ Ürün Ekle</button>
          <button class="btn btn-primary btn-sm" id="balance">⚖️ Otomatik Dengele</button>
        </div>

        <div id="tableWrap" style="overflow-x:auto; margin-top:10px"></div>

        <div id="metrics" style="margin-top:10px"></div>
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
    root.querySelector("#addProd").onclick = () => {
      this.state.products.push({ name: "Ürün " + String.fromCharCode(65 + this.state.products.length), qty: [0,0,0,0,0,0,0] });
      this.renderTable(root);
    };
    root.querySelector("#balance").onclick = () => {
      this.state.products.forEach(p => {
        const total = p.qty.reduce((s, x) => s + (+x || 0), 0);
        const each = Math.floor(total / 7);
        const rem = total - each * 7;
        p.qty = p.qty.map((_, i) => each + (i < rem ? 1 : 0));
      });
      UI.toast("Üretim dengelendi", "success");
      this.renderTable(root);
    };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderTable(root);
    this.renderList(root);
  },
  renderTable(root) {
    const wrap = root.querySelector("#tableWrap");
    wrap.innerHTML = `
      <table class="heijunka-table">
        <thead>
          <tr>
            <th>Ürün</th>
            ${this.state.days.map(d => `<th>${d}</th>`).join("")}
            <th>Top</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${this.state.products.map((p, pi) => `
            <tr>
              <td><input value="${UI.escape(p.name)}" data-name="${pi}" style="width:80px;padding:4px"></td>
              ${p.qty.map((q, di) => `<td><input type="number" min="0" value="${q}" data-qty="${pi}-${di}" style="width:50px"></td>`).join("")}
              <td><strong>${p.qty.reduce((s, x) => s + (+x || 0), 0)}</strong></td>
              <td><button class="btn btn-danger btn-sm" data-del-prod="${pi}">❌</button></td>
            </tr>
          `).join("")}
          <tr style="background:var(--surface-2)">
            <td><strong>Günlük Toplam</strong></td>
            ${this.state.days.map((_, di) => `<td><strong>${this.state.products.reduce((s, p) => s + (+p.qty[di] || 0), 0)}</strong></td>`).join("")}
            <td><strong>${this.state.products.reduce((s, p) => s + p.qty.reduce((ss, x) => ss + (+x || 0), 0), 0)}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;
    wrap.querySelectorAll("[data-name]").forEach(i => i.oninput = (e) => {
      this.state.products[+e.target.dataset.name].name = e.target.value;
    });
    wrap.querySelectorAll("[data-qty]").forEach(i => i.oninput = (e) => {
      const [pi, di] = e.target.dataset.qty.split("-").map(Number);
      this.state.products[pi].qty[di] = +e.target.value || 0;
      this.renderTable(root);
      this.renderMetrics(root);
    });
    wrap.querySelectorAll("[data-del-prod]").forEach(b => b.onclick = (e) => {
      this.state.products.splice(+e.target.dataset.delProd, 1);
      this.renderTable(root); this.renderMetrics(root);
    });
    this.renderMetrics(root);
  },
  renderMetrics(root) {
    const m = root.querySelector("#metrics");
    const daily = this.state.days.map((_, di) => this.state.products.reduce((s, p) => s + (+p.qty[di] || 0), 0));
    const max = Math.max(...daily, 0);
    const min = Math.min(...daily, 0);
    const avg = daily.reduce((s, x) => s + x, 0) / 7;
    const variance = daily.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / 7;
    const std = Math.sqrt(variance);
    const leveling = avg > 0 ? ((1 - std / avg) * 100).toFixed(1) : 0;
    m.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi"><div class="label">Max/Min</div><div class="value">${max}/${min}</div></div>
        <div class="kpi amber"><div class="label">Ortalama</div><div class="value">${avg.toFixed(0)}</div></div>
        <div class="kpi success"><div class="label">Dengeleme</div><div class="value">${leveling}%</div></div>
      </div>
    `;
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("📦", "Henüz plan yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)}</div>
          <div class="li-sub">${UI.escape(it.period || "")} • ${(it.products || []).length} ürün</div>
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
      this.state.products = JSON.parse(JSON.stringify(it.products || []));
      root.querySelector("#title").value = it.title || "";
      root.querySelector("#period").value = it.period || "";
      this.renderTable(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    this.state.products = [{ name: "Ürün A", qty: [0,0,0,0,0,0,0] }];
    root.querySelector("#title").value = "";
    root.querySelector("#period").value = "";
    this.renderTable(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const data = { title, period: root.querySelector("#period").value, products: this.state.products };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
