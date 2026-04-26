/* Central Actions tracker — aggregates ad-hoc items plus actions extracted from other tools */
const Actions = {
  KEY: "actions",
  state: { editingId: null, filter: "all" },

  STATUS: {
    open: { label: "Açık", cls: "open" },
    progress: { label: "Devam", cls: "progress" },
    done: { label: "Tamamlandı", cls: "done" }
  },

  /* Pull action items referenced in other tools so the consultant has one punch list. */
  collectLinked() {
    const out = [];
    const push = (source, title, extra) => {
      if (!title) return;
      const t = String(title).trim();
      if (!t) return;
      out.push({ source, title: t, ...extra });
    };

    Storage.getAll("why5").forEach(it => push("5 Neden", it.action, {
      context: it.problem || "", owner: "", due: "", refId: it.id, refKey: "why5"
    }));
    /* PDCA: skip cycles already closed (status="done"); their act is complete. */
    Storage.getAll("pdca").forEach(it => {
      if (it.status === "done") return;
      push("PDCA", it.act, {
        context: it.plan || it.problem || "", owner: "", due: "", refId: it.id, refKey: "pdca"
      });
    });
    Storage.getAll("rca").forEach(it => {
      push("RCA (Düzeltici)", it.corrective, { context: it.event || it.problem || "", refId: it.id, refKey: "rca" });
      push("RCA (Önleyici)",  it.preventive, { context: it.event || it.problem || "", refId: it.id, refKey: "rca" });
    });
    Storage.getAll("a3").forEach(it => push("A3 Plan", it.plan, {
      context: it.title || "", refId: it.id, refKey: "a3"
    }));
    Storage.getAll("gemba").forEach(it => {
      if (it.summary) push("Gemba (Özet)", it.summary, { context: it.area || "", refId: it.id, refKey: "gemba" });
      (it.observations || []).forEach(o => {
        if (o.type === "issue" || o.type === "improve") {
          push("Gemba", o.text, { context: (it.area || "") + " • " + (o.priority || ""), refId: it.id, refKey: "gemba" });
        }
      });
    });
    /* Asakai agenda items use the field `text` (not `action`) and have an
       optional `done` flag — earlier code read non-existent fields, so Asakai
       actions never reached the linked tracker. */
    Storage.getAll("asakai").forEach(it => (it.agenda || []).forEach(a => {
      if (a.done) return;
      push("Asakai", a.text, {
        context: it.team || it.date || "", owner: a.owner || "", due: a.due || "",
        refId: it.id, refKey: "asakai"
      });
    }));
    /* Kaizen has no separate "action" field — the kaizen title IS the
       planned improvement (with before/after describing the transition).
       Earlier code read non-existent it.action/it.improvement and silently
       dropped every kaizen. Now use it.title and skip closed cycles. */
    Storage.getAll("kaizen").forEach(it => {
      if (it.status === "done") return;
      push("Kaizen", it.title, {
        context: it.area || it.before || "",
        refId: it.id, refKey: "kaizen"
      });
    });
    Storage.getAll("fmea").forEach(it => (it.rows || []).forEach(r => push("FMEA", r.action, {
      context: (r.failureMode || "") + " — " + (r.effect || ""), refId: it.id, refKey: "fmea"
    })));

    return out;
  },

  isOverdue(item) {
    if (!item.due || item.status === "done") return false;
    const d = new Date(item.due);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  },

  render(root) {
    this.state.editingId = null;
    const own = Storage.getAll(this.KEY);
    const linked = this.collectLinked();

    const all = own.concat([]);
    const countOpen = all.filter(a => a.status !== "done").length;
    const countDone = all.filter(a => a.status === "done").length;
    const countOverdue = all.filter(a => this.isOverdue(a)).length;

    root.innerHTML = `
      ${UI.hero("🎯", "Aksiyon Takip Merkezi", "Tüm araçlardan gelen aksiyonları tek panoda yönetin.")}

      <div class="card">
        <h3>📊 Durum</h3>
        <div class="kpi-grid">
          <div class="kpi"><div class="label">Kayıtlı Aksiyon</div><div class="value">${all.length}</div></div>
          <div class="kpi amber"><div class="label">Açık / Devam</div><div class="value">${countOpen}</div></div>
          <div class="kpi success"><div class="label">Tamamlanan</div><div class="value">${countDone}</div></div>
          <div class="kpi danger"><div class="label">Gecikmiş</div><div class="value">${countOverdue}</div></div>
        </div>
      </div>

      <div class="card">
        <h3>➕ Yeni Aksiyon</h3>
        <div class="field"><label>Aksiyon</label>
          <textarea id="actTitle" placeholder="Ne yapılacak?"></textarea>
        </div>
        <div class="field"><label>Bağlam / Kaynak Problem</label>
          <input id="actContext" placeholder="Ör: Hat 2 duruş — 5 Neden">
        </div>
        <div class="field"><label>Sorumlu</label>
          <input id="actOwner" placeholder="Ör: Ahmet Y.">
        </div>
        <div class="field"><label>Termin Tarihi</label>
          <input id="actDue" type="date">
        </div>
        <div class="field"><label>Durum</label>
          <select id="actStatus">
            <option value="open">Açık</option>
            <option value="progress">Devam Ediyor</option>
            <option value="done">Tamamlandı</option>
          </select>
        </div>
        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📋 Tüm Aksiyonlar</h3>
        <div class="btn-row" data-no-print>
          <button class="btn btn-outline btn-sm" data-f="all">Tümü</button>
          <button class="btn btn-outline btn-sm" data-f="open">Açık/Devam</button>
          <button class="btn btn-outline btn-sm" data-f="done">Tamamlanan</button>
          <button class="btn btn-outline btn-sm" data-f="overdue">Gecikmiş</button>
        </div>
        <div id="actList"></div>
      </div>

      <div class="card">
        <h3>🔗 Diğer Araçlardan Toplanan Aksiyonlar (${linked.length})</h3>
        <div id="linkedList"></div>
      </div>

      <div id="analyzeWrap"></div>
    `;

    this.renderList(root);
    this.renderLinked(root, linked);
    this.renderAnalysis(root);

    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); UI.toast("Form temizlendi"); };

    root.querySelectorAll("[data-f]").forEach(b => b.onclick = (e) => {
      this.state.filter = e.target.dataset.f;
      this.renderList(root);
    });
  },

  renderList(root) {
    const wrap = root.querySelector("#actList");
    const all = Storage.getAll(this.KEY);
    let list = all;
    if (this.state.filter === "open") list = all.filter(a => a.status !== "done");
    else if (this.state.filter === "done") list = all.filter(a => a.status === "done");
    else if (this.state.filter === "overdue") list = all.filter(a => this.isOverdue(a));

    if (!list.length) { wrap.innerHTML = UI.emptyState("🎯", "Bu filtreyle aksiyon yok."); return; }
    wrap.innerHTML = list.map(it => {
      const st = this.STATUS[it.status] || this.STATUS.open;
      const overdue = this.isOverdue(it);
      return `
        <div class="list-item ${overdue ? "action-overdue" : ""}" data-id="${it.id}">
          <div class="li-main">
            <div class="li-title">${UI.escape(it.title || "")}</div>
            <div class="li-sub">👤 ${UI.escape(it.owner || "—")} • 📅 ${UI.escape(it.due || "—")} ${overdue ? "⚠️ gecikmiş" : ""}</div>
            ${it.context ? `<div class="li-sub">🔗 ${UI.escape(it.context)}</div>` : ""}
            <span class="action-status ${st.cls}">${st.label}</span>
          </div>
          <div class="li-actions">
            <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
            <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
          </div>
        </div>
      `;
    }).join("");

    wrap.querySelectorAll("[data-action=del]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Bu aksiyon silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    wrap.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      this.fillForm(root, Storage.getOne(this.KEY, id));
    });
  },

  renderLinked(root, linked) {
    const wrap = root.querySelector("#linkedList");
    if (!linked.length) { wrap.innerHTML = UI.emptyState("🔗", "Diğer araçlarda tanımlı aksiyon yok."); return; }
    wrap.innerHTML = linked.map((l, i) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${UI.escape(l.title)}</div>
          <div class="li-sub">📌 ${UI.escape(l.source)}${l.context ? " • " + UI.escape(l.context) : ""}</div>
        </div>
        <div class="li-actions">
          <button class="btn btn-success btn-sm" data-idx="${i}">➕ Merkeze Ekle</button>
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-idx]").forEach(b => b.onclick = (e) => {
      const idx = +e.target.dataset.idx;
      const l = linked[idx];
      Storage.add(this.KEY, {
        title: l.title,
        context: (l.source ? l.source + ": " : "") + (l.context || ""),
        owner: "",
        due: "",
        status: "open",
        source: l.source,
        refId: l.refId,
        refKey: l.refKey
      });
      UI.toast("Merkeze eklendi", "success");
      this.render(root);
    });
  },

  fillForm(root, it) {
    if (!it) return;
    root.querySelector("#actTitle").value = it.title || "";
    root.querySelector("#actContext").value = it.context || "";
    root.querySelector("#actOwner").value = it.owner || "";
    root.querySelector("#actDue").value = it.due || "";
    root.querySelector("#actStatus").value = it.status || "open";
    this.state.editingId = it.id;
    root.querySelector("#saveBtn").textContent = "💾 Güncelle";
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  clearForm(root) {
    root.querySelector("#actTitle").value = "";
    root.querySelector("#actContext").value = "";
    root.querySelector("#actOwner").value = "";
    root.querySelector("#actDue").value = "";
    root.querySelector("#actStatus").value = "open";
    this.state.editingId = null;
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
  },

  save(root) {
    const title = root.querySelector("#actTitle").value.trim();
    if (!title) { UI.toast("Aksiyon metni gerekli", "danger"); return; }
    const data = {
      title,
      context: root.querySelector("#actContext").value.trim(),
      owner: root.querySelector("#actOwner").value.trim(),
      due: root.querySelector("#actDue").value,
      status: root.querySelector("#actStatus").value
    };
    if (this.state.editingId) {
      Storage.update(this.KEY, this.state.editingId, data);
      UI.toast("Güncellendi", "success");
    } else {
      Storage.add(this.KEY, data);
      UI.toast("Kaydedildi", "success");
    }
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const insights = [], text = [];
    if (!records.length) return { insights: [Analyze.insight("info", "Merkezi aksiyon kaydı yok", "Diğer araçlardan aksiyonları buraya ekleyin.")], text: ["Aksiyon yok."] };
    const open = records.filter(a => a.status !== "done").length;
    const done = records.filter(a => a.status === "done").length;
    const overdue = records.filter(a => this.isOverdue(a)).length;
    const doneRate = records.length ? Math.round((done / records.length) * 100) : 0;

    insights.push(Analyze.insight("info", `Tamamlanma oranı: %${doneRate}`, `${done}/${records.length} aksiyon tamamlandı.`));
    if (overdue > 0) insights.push(Analyze.insight("danger", `${overdue} aksiyon gecikmiş`, "Termini geçmiş açık aksiyonlar ivedi ele alınmalı."));
    if (open > 10) insights.push(Analyze.insight("warn", "Açık aksiyon yığılması", "10'dan fazla açık aksiyon — kaynakları gözden geçirin."));
    if (!records.some(a => a.owner)) insights.push(Analyze.insight("warn", "Sorumlu atanmamış", "Her aksiyon için sorumlu tanımlayın, yoksa hesap verebilirlik kaybolur."));
    if (doneRate >= 80) insights.push(Analyze.insight("success", "Disiplinli yürütme", "Yüksek tamamlanma oranı — PDCA döngüsü sağlıklı işliyor."));
    text.push(`Toplam ${records.length} / Açık ${open} / Tamamlanan ${done} / Gecikmiş ${overdue}`);
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const a = this.analyze();
    wrap.innerHTML = Analyze.card("🎯", "Aksiyon Merkezi Yorumu", "", a.insights.join(""));
  }
};
