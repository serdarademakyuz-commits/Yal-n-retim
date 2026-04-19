const SQDCP = {
  KEY: "sqdcp",
  state: { editingId: null },
  CATS: [
    { k: "s", n: "S - Safety (Güvenlik)",  c: "s" },
    { k: "q", n: "Q - Quality (Kalite)",   c: "q" },
    { k: "d", n: "D - Delivery (Teslimat)", c: "d" },
    { k: "c", n: "C - Cost (Maliyet)",     c: "c" },
    { k: "p", n: "P - People (İnsan)",     c: "p" }
  ],
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("🪪", "SQDCP Panosu", "5 kritik alanda günlük performans takibi: Güvenlik, Kalite, Teslimat, Maliyet, İnsan.")}

      <div class="card">
        <h3>📅 Gün / Vardiya</h3>
        <div class="grid-2">
          <div class="field"><label>Tarih</label><input id="date" type="date"></div>
          <div class="field"><label>Vardiya</label>
            <select id="shift"><option>Vardiya 1</option><option>Vardiya 2</option><option>Vardiya 3</option></select>
          </div>
        </div>
        <div class="field"><label>Sorumlu</label><input id="owner"></div>

        <h4 style="margin:10px 0 6px; color:var(--navy)">Kategori Durumları</h4>
        <div class="sqdcp-grid">
          ${this.CATS.map(c => `
            <div class="sqdcp-cell ${c.c}" data-k="${c.k}">
              <span class="letter">${c.k.toUpperCase()}</span>
              <span class="name">${c.n.split(" ")[2] || ""}</span>
            </div>
          `).join("")}
        </div>

        ${this.CATS.map(c => `
          <div class="field" style="margin-top:10px">
            <label>${c.n}</label>
            <select id="st-${c.k}">
              <option value="green">🟢 Yeşil - Hedefe Ulaşıldı</option>
              <option value="yellow">🟡 Sarı - Riskli</option>
              <option value="red">🔴 Kırmızı - Hedefin Altında</option>
            </select>
            <textarea id="n-${c.k}" placeholder="Not / aksiyon" style="margin-top:6px"></textarea>
          </div>
        `).join("")}

        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🪪", "Henüz kayıt yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.date || "")} — ${UI.escape(it.shift || "")}</div>
          <div class="li-sub" style="font-size:16px">
            ${this.CATS.map(c => `<span style="margin-right:6px">${c.k.toUpperCase()}:${this.dot((it.statuses || {})[c.k])}</span>`).join("")}
          </div>
          <div class="li-sub">${UI.escape(it.owner || "")}</div>
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
      root.querySelector("#date").value = it.date || "";
      root.querySelector("#shift").value = it.shift || "Vardiya 1";
      root.querySelector("#owner").value = it.owner || "";
      this.CATS.forEach(c => {
        root.querySelector("#st-" + c.k).value = (it.statuses || {})[c.k] || "green";
        root.querySelector("#n-" + c.k).value = (it.notes || {})[c.k] || "";
      });
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  dot(s) { return s === "green" ? "🟢" : s === "yellow" ? "🟡" : s === "red" ? "🔴" : "⚪"; },
  clearForm(root) {
    this.state.editingId = null;
    root.querySelector("#date").value = "";
    root.querySelector("#shift").value = "Vardiya 1";
    root.querySelector("#owner").value = "";
    this.CATS.forEach(c => {
      root.querySelector("#st-" + c.k).value = "green";
      root.querySelector("#n-" + c.k).value = "";
    });
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const statuses = {}; const notes = {};
    this.CATS.forEach(c => {
      statuses[c.k] = root.querySelector("#st-" + c.k).value;
      notes[c.k] = root.querySelector("#n-" + c.k).value;
    });
    const data = {
      date: root.querySelector("#date").value,
      shift: root.querySelector("#shift").value,
      owner: root.querySelector("#owner").value,
      statuses, notes
    };
    if (!data.date) { UI.toast("Tarih gerekli", "danger"); return; }
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const stat = {};
    this.CATS.forEach(c => stat[c.k] = { green: 0, yellow: 0, red: 0 });
    records.forEach(r => {
      this.CATS.forEach(c => {
        const s = (r.statuses || {})[c.k];
        if (s && stat[c.k][s] !== undefined) stat[c.k][s]++;
      });
    });
    const worst = this.CATS.map(c => ({ k: c.k, n: c.n, red: stat[c.k].red, yellow: stat[c.k].yellow }))
      .sort((a, b) => (b.red * 2 + b.yellow) - (a.red * 2 + a.yellow))[0];
    if (worst && (worst.red > 0 || worst.yellow > 0)) {
      insights.push(Analyze.insight("action", `En zayıf eksen: ${worst.n}`, `${worst.red} kırmızı, ${worst.yellow} sarı. Önce bu alana aksiyon odaklanın.`));
      text.push(`En zayıf: ${worst.n} (R:${worst.red}, Y:${worst.yellow})`);
    }
    const latest = records[records.length - 1];
    const redToday = this.CATS.filter(c => ((latest.statuses || {})[c.k]) === "red").map(c => c.n);
    if (redToday.length) insights.push(Analyze.insight("danger", `Son kayıtta ${redToday.length} kırmızı alan`, redToday.join(", ") + ". Asakai toplantısında önceliklendirin."));
    else insights.push(Analyze.insight("success", "Son kayıtta kırmızı yok", "Stabil performans — standartlaştırın."));
    const safetyRed = stat.s.red;
    if (safetyRed > 0) insights.push(Analyze.insight("danger", `Güvenlikte ${safetyRed} kırmızı gün`, "Güvenlik pazarlıksızdır — Jidoka/Poka-Yoke aksiyonları acil."));
    insights.push(Analyze.insight("info", `${records.length} SQDCP günü`, "Günlük düzenli takip, Asakai disiplini ile etkili olur."));
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("🪪", "SQDCP kaydedin, analiz otomatik çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "SQDCP Otomatik Analizi", "", a.insights.join(""));
  }
};
