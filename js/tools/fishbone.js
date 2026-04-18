const Fishbone = {
  KEY: "fishbone",
  CATS: [
    { k: "insan",    n: "👷 İnsan (Man)",    c: "var(--danger)" },
    { k: "makine",   n: "⚙️ Makine (Machine)", c: "var(--info)" },
    { k: "yontem",   n: "📋 Yöntem (Method)", c: "var(--amber)" },
    { k: "malzeme",  n: "📦 Malzeme (Material)", c: "var(--success)" },
    { k: "cevre",    n: "🌍 Çevre (Environment)", c: "var(--warn)" },
    { k: "olcum",    n: "📏 Ölçüm (Measurement)", c: "var(--navy)" }
  ],
  state: { editingId: null, current: null },

  blankData() {
    const d = { problem: "", area: "", causes: {} };
    this.CATS.forEach(c => d.causes[c.k] = []);
    return d;
  },

  render(root) {
    this.state.editingId = null;
    this.state.current = this.blankData();
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("🐟", "Balık Kılçığı (Ishikawa)", "6M yöntemi ile problem nedenlerini kategorize edin.")}

      <div class="card">
        <h3>🎯 Problem</h3>
        <div class="field"><label>Problem / Etki</label><input id="problem" placeholder="Ör: Ürünlerde yüzey çizik"></div>
        <div class="field"><label>Proses / Alan</label><input id="area" placeholder="Ör: Boya Hattı"></div>
      </div>

      <div class="card">
        <h3>📊 6M - Neden Kategorileri</h3>
        <div id="cats"></div>
      </div>

      <div class="card">
        <h3>🐟 Diyagram Önizleme</h3>
        <div id="diagram" class="fishbone"></div>
        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    this.renderCategories(root);
    this.renderDiagram(root);
    this.renderList(root);

    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); };
  },

  renderCategories(root) {
    const wrap = root.querySelector("#cats");
    wrap.innerHTML = this.CATS.map(c => `
      <div class="fb-cat" data-k="${c.k}">
        <h4>${c.n}</h4>
        <div class="causes"></div>
        <div style="display:flex;gap:6px;margin-top:6px">
          <input class="cause-input" placeholder="Bu kategoride bir neden...">
          <button class="btn btn-accent btn-sm add-cause">➕ Ekle</button>
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll(".fb-cat").forEach(catEl => {
      const k = catEl.dataset.k;
      const inp = catEl.querySelector(".cause-input");
      catEl.querySelector(".add-cause").onclick = () => {
        const v = inp.value.trim(); if (!v) return;
        this.state.current.causes[k].push(v);
        inp.value = "";
        this.renderCategories(root);
        this.renderDiagram(root);
      };
      const cw = catEl.querySelector(".causes");
      cw.innerHTML = this.state.current.causes[k].map((c, i) => `
        <div class="fb-cause">
          <span>• ${UI.escape(c)}</span>
          <button class="btn btn-danger btn-sm" data-i="${i}">❌</button>
        </div>
      `).join("");
      cw.querySelectorAll("button[data-i]").forEach(b => b.onclick = (e) => {
        const i = parseInt(e.target.dataset.i);
        this.state.current.causes[k].splice(i, 1);
        this.renderCategories(root);
        this.renderDiagram(root);
      });
    });
  },

  renderDiagram(root) {
    const d = root.querySelector("#diagram");
    const problem = root.querySelector("#problem").value || "Problem";
    d.innerHTML = `
      <div style="text-align:center; margin-bottom:8px;">
        <strong style="background:var(--danger);color:#fff;padding:6px 14px;border-radius:20px;display:inline-block">
          ${UI.escape(problem)}
        </strong>
      </div>
      ${this.CATS.map(c => `
        <div class="fb-cat">
          <h4>${c.n} <span style="opacity:.6;font-size:11px;font-weight:400">(${this.state.current.causes[c.k].length})</span></h4>
          ${this.state.current.causes[c.k].length ? this.state.current.causes[c.k].map(x => `
            <div class="fb-cause"><span>→ ${UI.escape(x)}</span></div>
          `).join("") : '<small style="color:var(--muted)">Henüz neden eklenmedi</small>'}
        </div>
      `).join("")}
    `;
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🐟", "Henüz diyagram yok."); return; }
    wrap.innerHTML = list.map(it => {
      const total = Object.values(it.causes || {}).reduce((s, a) => s + a.length, 0);
      return `
        <div class="list-item" data-id="${it.id}">
          <div class="li-main">
            <div class="li-title">${UI.escape(it.problem)}</div>
            <div class="li-sub">${UI.escape(it.area || "")} • ${total} neden • ${UI.fmtDate(it.updatedAt)}</div>
          </div>
          <div class="li-actions">
            <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
            <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
          </div>
        </div>`;
    }).join("");
    wrap.querySelectorAll("[data-action=del]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    wrap.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      this.state.editingId = id;
      this.state.current = JSON.parse(JSON.stringify(it));
      root.querySelector("#problem").value = it.problem || "";
      root.querySelector("#area").value = it.area || "";
      this.renderCategories(root);
      this.renderDiagram(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  clearForm(root) {
    this.state.editingId = null;
    this.state.current = this.blankData();
    root.querySelector("#problem").value = "";
    root.querySelector("#area").value = "";
    this.renderCategories(root);
    this.renderDiagram(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },

  save(root) {
    const problem = root.querySelector("#problem").value.trim();
    if (!problem) { UI.toast("Problem gerekli", "danger"); return; }
    const data = {
      problem,
      area: root.querySelector("#area").value.trim(),
      causes: this.state.current.causes
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
