const RCA = {
  KEY: "rca",
  state: { editingId: null },
  METHODS: ["5 Neden", "Balık Kılçığı", "FTA - Hata Ağacı", "Pareto", "İstatistiksel Analiz"],
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("🔍", "Kök Neden Analizi (RCA)", "Problemlerin kök nedenini sistematik olarak belirleyin.")}

      <div class="card">
        <h3>📝 Kök Neden Kaydı</h3>
        <div class="field"><label>Olay / Problem</label><textarea id="event" placeholder="Ne oldu?"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Tarih</label><input id="date" type="date"></div>
          <div class="field"><label>Alan</label><input id="area" placeholder="Proses / Hat"></div>
        </div>
        <div class="field"><label>Etki (Zaman/Maliyet/Kalite)</label><input id="impact" placeholder="Ör: 4 saat duruş, 15.000 TL"></div>
        <div class="field"><label>Belirleme Yöntemi</label>
          <select id="method">${this.METHODS.map(m => `<option>${m}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Semptomlar (Görünür Sorun)</label><textarea id="symptoms"></textarea></div>
        <div class="field"><label>Ara Nedenler</label><textarea id="intermediate"></textarea></div>
        <div class="field"><label>🎯 Kök Neden</label><textarea id="root" placeholder="Ana kök neden"></textarea></div>
        <div class="field"><label>💡 Düzeltici Aksiyon</label><textarea id="corrective"></textarea></div>
        <div class="field"><label>🛡️ Önleyici Aksiyon</label><textarea id="preventive"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Sorumlu</label><input id="owner"></div>
          <div class="field"><label>Son Tarih</label><input id="due" type="date"></div>
        </div>

        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🔍", "Henüz RCA yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.event)}</div>
          <div class="li-sub">${UI.escape(it.area || "")} • ${UI.escape(it.date || "")}</div>
          ${it.root ? `<div class="li-sub">🎯 ${UI.escape(it.root)}</div>` : ""}
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
      ["event", "date", "area", "impact", "method", "symptoms", "intermediate", "root", "corrective", "preventive", "owner", "due"].forEach(k =>
        root.querySelector("#" + k).value = it[k] || "");
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    ["event", "date", "area", "impact", "symptoms", "intermediate", "root", "corrective", "preventive", "owner", "due"].forEach(k =>
      root.querySelector("#" + k).value = "");
    root.querySelector("#method").value = this.METHODS[0];
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const event = root.querySelector("#event").value.trim();
    if (!event) { UI.toast("Olay tanımı gerekli", "danger"); return; }
    const d = { event };
    ["date", "area", "impact", "method", "symptoms", "intermediate", "root", "corrective", "preventive", "owner", "due"].forEach(k =>
      d[k] = root.querySelector("#" + k).value);
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, d);
    else Storage.add(this.KEY, d);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
