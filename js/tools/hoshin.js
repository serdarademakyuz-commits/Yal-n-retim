/* Hoshin Kanri X-Matrix — strategic goal deployment: 3-5y breakthroughs,
   annual objectives, improvement priorities, targets, resources.
   Relationships between quadrants are tracked in a linkage grid. */
const Hoshin = {
  KEY: "hoshin",
  state: { editingId: null, breakthroughs: [], annuals: [], priorities: [], targets: [], resources: [], links: {} },

  render(root) {
    this.state.editingId = null;
    this.state.breakthroughs = [];
    this.state.annuals = [];
    this.state.priorities = [];
    this.state.targets = [];
    this.state.resources = [];
    this.state.links = {};
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("🎯", "Hoshin Kanri X-Matrix", "Stratejik hedef dağıtımı: 3-5 yıllık atılımlar → yıllık hedefler → iyileştirme öncelikleri → metrikler → sorumluluk.")}

      <div class="card">
        <h3>📝 Plan Bilgisi</h3>
        <div class="field"><label>Başlık</label><input id="title" placeholder="Ör: 2026-2028 Fabrika Stratejisi"></div>
        <div class="grid-2">
          <div class="field"><label>Yıl</label><input id="year" type="number" value="${new Date().getFullYear()}"></div>
          <div class="field"><label>Süre (yıl)</label><input id="horizon" type="number" min="1" max="10" value="3"></div>
        </div>
      </div>

      <div class="card">
        <h3>🔭 Güney: Uzun Dönem Atılımlar (3-5 yıl)</h3>
        <div class="field"><input id="bt" placeholder="Ör: OEE %85'e çıkar"></div>
        <button class="btn btn-accent btn-block" id="addBt">➕ Ekle</button>
        <div id="btWrap" style="margin-top:8px"></div>
      </div>

      <div class="card">
        <h3>🌅 Batı: Yıllık Hedefler</h3>
        <div class="field"><input id="an" placeholder="Ör: 2026'da OEE'yi %65'ten %75'e"></div>
        <button class="btn btn-accent btn-block" id="addAn">➕ Ekle</button>
        <div id="anWrap" style="margin-top:8px"></div>
      </div>

      <div class="card">
        <h3>⚡ Kuzey: İyileştirme Öncelikleri (Taktik)</h3>
        <div class="field"><input id="pr" placeholder="Ör: SMED ile kalıp değişim süresini %50 azalt"></div>
        <button class="btn btn-accent btn-block" id="addPr">➕ Ekle</button>
        <div id="prWrap" style="margin-top:8px"></div>
      </div>

      <div class="card">
        <h3>📏 Doğu: İyileştirme Metrikleri / Hedef Değerler</h3>
        <div class="grid-2">
          <input id="tgName" placeholder="Metrik (ör: OEE)">
          <input id="tgVal" placeholder="Hedef (ör: %75)">
        </div>
        <button class="btn btn-accent btn-block" id="addTg" style="margin-top:8px">➕ Ekle</button>
        <div id="tgWrap" style="margin-top:8px"></div>
      </div>

      <div class="card">
        <h3>👥 Sorumlular / Kaynak Sahipleri</h3>
        <div class="grid-2">
          <input id="rcName" placeholder="Ad Soyad">
          <input id="rcRole" placeholder="Rol / Departman">
        </div>
        <button class="btn btn-accent btn-block" id="addRc" style="margin-top:8px">➕ Ekle</button>
        <div id="rcWrap" style="margin-top:8px"></div>
      </div>

      <div class="card">
        <h3>🧭 X-Matrix Görseli</h3>
        <div id="matrix"></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div class="card" style="margin-top:12px">
        <h3>📋 Kayıtlı Planlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    this.renderArrays(root);
    this.renderMatrix(root);
    this.renderList(root);

    const bind = (addId, inputId, field, builder) => {
      root.querySelector("#" + addId).onclick = () => {
        const val = builder(root);
        if (!val) return;
        this.state[field].push(val);
        if (Array.isArray(inputId)) inputId.forEach(id => root.querySelector("#" + id).value = "");
        else root.querySelector("#" + inputId).value = "";
        this.renderArrays(root); this.renderMatrix(root);
      };
    };

    bind("addBt", "bt", "breakthroughs", r => {
      const v = r.querySelector("#bt").value.trim(); if (!v) { UI.toast("Metin gerekli", "danger"); return null; }
      return { text: v };
    });
    bind("addAn", "an", "annuals", r => {
      const v = r.querySelector("#an").value.trim(); if (!v) { UI.toast("Metin gerekli", "danger"); return null; }
      return { text: v };
    });
    bind("addPr", "pr", "priorities", r => {
      const v = r.querySelector("#pr").value.trim(); if (!v) { UI.toast("Metin gerekli", "danger"); return null; }
      return { text: v };
    });
    bind("addTg", ["tgName","tgVal"], "targets", r => {
      const n = r.querySelector("#tgName").value.trim();
      const v = r.querySelector("#tgVal").value.trim();
      if (!n) { UI.toast("Metrik adı gerekli", "danger"); return null; }
      return { name: n, value: v };
    });
    bind("addRc", ["rcName","rcRole"], "resources", r => {
      const n = r.querySelector("#rcName").value.trim();
      const ro = r.querySelector("#rcRole").value.trim();
      if (!n) { UI.toast("İsim gerekli", "danger"); return null; }
      return { name: n, role: ro };
    });

    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); UI.toast("Form temizlendi"); };
  },

  renderArrays(root) {
    const show = (field, id, render) => {
      const w = root.querySelector("#" + id);
      const arr = this.state[field];
      if (!arr.length) { w.innerHTML = '<small style="color:var(--muted)">Boş</small>'; return; }
      w.innerHTML = arr.map((x, i) => `
        <div class="list-item">
          <div class="li-main"><div class="li-title">${UI.escape(render(x))}</div></div>
          <button class="btn btn-danger btn-sm" data-i="${i}">❌</button>
        </div>
      `).join("");
      w.querySelectorAll("button[data-i]").forEach(b => b.onclick = e => {
        arr.splice(+e.target.dataset.i, 1);
        this.renderArrays(root); this.renderMatrix(root);
      });
    };
    show("breakthroughs", "btWrap", x => x.text);
    show("annuals", "anWrap", x => x.text);
    show("priorities", "prWrap", x => x.text);
    show("targets", "tgWrap", x => x.name + ": " + x.value);
    show("resources", "rcWrap", x => x.name + (x.role ? " (" + x.role + ")" : ""));
  },

  renderMatrix(root) {
    const wrap = root.querySelector("#matrix");
    const bt = this.state.breakthroughs, an = this.state.annuals, pr = this.state.priorities,
          tg = this.state.targets, rc = this.state.resources;
    if (!bt.length && !an.length && !pr.length) {
      wrap.innerHTML = UI.emptyState("🧭", "Hedefleri ekleyin, X-Matrix burada oluşur.");
      return;
    }
    const row = (label, arr, renderer) => `
      <tr>
        <th style="background:#f1f5f9;text-align:left;padding:6px;font-size:11px;border:1px solid #cbd5e1;width:140px">${label}</th>
        <td style="padding:6px;border:1px solid #cbd5e1;font-size:12px">
          ${arr.length ? arr.map((x, i) => `<div>${i+1}. ${UI.escape(renderer(x))}</div>`).join("") : '<small style="color:#94a3b8">—</small>'}
        </td>
      </tr>
    `;
    wrap.innerHTML = `
      <div style="overflow-x:auto">
        <table style="border-collapse:collapse;width:100%;min-width:500px">
          ${row("🔭 Atılımlar (Güney)", bt, x => x.text)}
          ${row("⚡ Öncelikler (Kuzey)", pr, x => x.text)}
          ${row("🌅 Yıllık Hedefler (Batı)", an, x => x.text)}
          ${row("📏 Metrikler (Doğu)", tg, x => x.name + ": " + x.value)}
          ${row("👥 Sorumlular", rc, x => x.name + (x.role ? " – " + x.role : ""))}
        </table>
      </div>
    `;
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🎯", "Henüz plan yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title || "")} (${UI.escape(String(it.year || ""))})</div>
          <div class="li-sub">${(it.breakthroughs||[]).length} atılım • ${(it.annuals||[]).length} yıllık • ${(it.priorities||[]).length} öncelik • ${(it.targets||[]).length} metrik</div>
        </div>
        <div class="li-actions">
          <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
          <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
        </div>
      </div>
    `).join("");
    wrap.querySelectorAll("[data-action=del]").forEach(b => b.onclick = e => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    wrap.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = e => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      root.querySelector("#title").value = it.title || "";
      root.querySelector("#year").value = it.year || new Date().getFullYear();
      root.querySelector("#horizon").value = it.horizon || 3;
      ["breakthroughs","annuals","priorities","targets","resources"].forEach(k => { this.state[k] = [...(it[k] || [])]; });
      this.state.editingId = id;
      this.renderArrays(root); this.renderMatrix(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  clearForm(root) {
    ["title","year","horizon"].forEach(k => root.querySelector("#" + k).value = "");
    root.querySelector("#year").value = new Date().getFullYear();
    root.querySelector("#horizon").value = 3;
    ["breakthroughs","annuals","priorities","targets","resources"].forEach(k => this.state[k] = []);
    this.state.editingId = null;
    this.renderArrays(root); this.renderMatrix(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
  },

  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const data = {
      title,
      year: +root.querySelector("#year").value,
      horizon: +root.querySelector("#horizon").value,
      breakthroughs: [...this.state.breakthroughs],
      annuals: [...this.state.annuals],
      priorities: [...this.state.priorities],
      targets: [...this.state.targets],
      resources: [...this.state.resources]
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const insights = [], text = [];
    if (!records.length) return { insights: [Analyze.insight("info", "Hoshin planı yok", "Stratejik hedef dağıtımı için bir X-Matrix oluşturun.")], text: ["Kayıt yok."] };
    const latest = records[records.length - 1];
    const bt = (latest.breakthroughs || []).length;
    const an = (latest.annuals || []).length;
    const pr = (latest.priorities || []).length;
    const tg = (latest.targets || []).length;
    insights.push(Analyze.insight("info", `${bt} atılım • ${an} yıllık • ${pr} öncelik • ${tg} metrik`, ""));
    if (an > 0 && pr === 0) insights.push(Analyze.insight("warn", "Yıllık hedefler var ama iyileştirme önceliği yok", "Her yıllık hedefi 2-3 taktik aksiyona bölün."));
    if (pr > 0 && tg === 0) insights.push(Analyze.insight("warn", "Öncelikler var ama ölçüm yok", "Her öncelik için ölçülebilir metrik tanımlayın."));
    if (bt > 5) insights.push(Analyze.insight("warn", "Çok fazla atılım", "3-5 ile sınırlayın, odak kaybolmasın."));
    text.push(`bt=${bt} an=${an} pr=${pr} tg=${tg}`);
    return { insights, text };
  }
};
