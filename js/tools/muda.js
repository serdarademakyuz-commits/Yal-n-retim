const Muda = {
  KEY: "muda",
  state: { editingId: null, tab: "muda" },
  MUDA_TYPES: [
    "Aşırı Üretim", "Bekleme", "Taşıma", "Aşırı İşleme",
    "Stok", "Hareket", "Kusur", "Kullanılmayan Yetenek"
  ],
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    const mc = list.filter(x => x.type === "muda").length;
    const rc = list.filter(x => x.type === "mura").length;
    const ic = list.filter(x => x.type === "muri").length;
    root.innerHTML = `
      ${UI.hero("🗑️", "Muda / Mura / Muri", "Üç büyük israf: Değer katmayan, Dengesizlik ve Aşırı Yükleme.")}

      <div class="tabs">
        <button class="tab ${this.state.tab === 'muda' ? 'active' : ''}" data-tab="muda">🗑️ Muda (${mc})</button>
        <button class="tab ${this.state.tab === 'mura' ? 'active' : ''}" data-tab="mura">📈 Mura (${rc})</button>
        <button class="tab ${this.state.tab === 'muri' ? 'active' : ''}" data-tab="muri">⚠️ Muri (${ic})</button>
      </div>

      <div id="tabBody"></div>
    `;
    root.querySelectorAll(".tab").forEach(t => t.onclick = () => {
      this.state.tab = t.dataset.tab;
      this.render(root);
    });
    this.renderTab(root);
  },
  renderTab(root) {
    const body = root.querySelector("#tabBody");
    const t = this.state.tab;
    const list = Storage.getAll(this.KEY).filter(x => x.type === t);
    let formExtra = "";
    if (t === "muda") {
      formExtra = `
        <div class="field"><label>Muda Türü</label>
          <select id="subtype">${this.MUDA_TYPES.map(x => `<option>${x}</option>`).join("")}</select>
        </div>`;
    }
    body.innerHTML = `
      <div class="card">
        <h3>${t === 'muda' ? '🗑️ Muda (İsraf)' : t === 'mura' ? '📈 Mura (Dengesizlik)' : '⚠️ Muri (Aşırı Yük)'} Kaydı</h3>
        <div class="field"><label>Başlık</label><input id="title" placeholder="Gözlenen durum"></div>
        <div class="field"><label>Alan</label><input id="area" placeholder="Proses / Hat"></div>
        ${formExtra}
        <div class="field"><label>Açıklama / Bulgu</label><textarea id="desc"></textarea></div>
        <div class="field"><label>Etki (Maliyet / Zaman)</label><input id="impact"></div>
        <div class="field"><label>Önerilen Çözüm</label><textarea id="solution"></textarea></div>
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
    body.querySelector("#saveBtn").onclick = () => this.save(root);
    body.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY).filter(x => x.type === this.state.tab);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🗑️", "Henüz kayıt yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)}</div>
          <div class="li-sub">${UI.escape(it.area || "")} ${it.subtype ? ' • ' + UI.escape(it.subtype) : ''}</div>
          <div class="li-sub">${UI.escape((it.desc || "").slice(0, 80))}</div>
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
      ["title", "area", "desc", "impact", "solution"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] || "";
      });
      const sub = root.querySelector("#subtype"); if (sub && it.subtype) sub.value = it.subtype;
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    ["title", "area", "desc", "impact", "solution"].forEach(k => {
      const el = root.querySelector("#" + k); if (el) el.value = "";
    });
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const d = {
      type: this.state.tab, title,
      area: root.querySelector("#area").value,
      desc: root.querySelector("#desc").value,
      impact: root.querySelector("#impact").value,
      solution: root.querySelector("#solution").value
    };
    const sub = root.querySelector("#subtype");
    if (sub) d.subtype = sub.value;
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, d);
    else Storage.add(this.KEY, d);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
