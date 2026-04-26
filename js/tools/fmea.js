/* FMEA — Failure Mode and Effects Analysis. RPN = Severity × Occurrence × Detection */
const FMEA = {
  KEY: "fmea",
  state: { editingId: null },

  rpnClass(rpn) {
    const low = Targets.get("fmea.rpnLow"), high = Targets.get("fmea.rpnHigh");
    if (rpn <= low) return "low";
    if (rpn <= high) return "med";
    return "high";
  },

  blankRow() {
    return { process: "", func: "", failureMode: "", effect: "", S: 1,
             cause: "", O: 1, controls: "", D: 1, action: "", newRPN: 0 };
  },

  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("⚠️", "FMEA Risk Analizi", "Hata Türü ve Etkileri Analizi — riskli adımları önceliklendirin.")}

      <div class="card">
        <h3>📝 Yeni / Düzenle FMEA</h3>
        <div class="field"><label>Başlık</label>
          <input id="title" placeholder="Ör: Hat 2 Montaj FMEA">
        </div>
        <div class="field"><label>Kapsam / Ürün</label>
          <input id="scope" placeholder="Ör: Ürün kodu, proses">
        </div>

        <h4 style="margin-top:10px">🔢 Satırlar</h4>
        <div id="rows"></div>
        <div class="btn-row">
          <button class="btn btn-outline btn-sm" id="addRow">➕ Satır Ekle</button>
        </div>

        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
        <small style="color:var(--muted)">RPN = S × O × D. ≤50 düşük, 51-100 orta, &gt;100 kritik risk.</small>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    this.rowsState = [this.blankRow()];
    this.renderRows(root);
    this.renderList(root);
    this.renderAnalysis(root);

    root.querySelector("#addRow").onclick = () => { this.rowsState.push(this.blankRow()); this.renderRows(root); };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); UI.toast("Form temizlendi"); };
  },

  renderRows(root) {
    const wrap = root.querySelector("#rows");
    wrap.innerHTML = this.rowsState.map((r, i) => {
      const rpn = (+r.S || 0) * (+r.O || 0) * (+r.D || 0);
      return `
        <div class="list-item" data-i="${i}" style="display:block">
          <div class="field"><label>Proses / Adım</label><input data-k="process" value="${UI.escape(r.process)}"></div>
          <div class="field"><label>Fonksiyon</label><input data-k="func" value="${UI.escape(r.func)}"></div>
          <div class="field"><label>Hata Türü</label><input data-k="failureMode" value="${UI.escape(r.failureMode)}"></div>
          <div class="field"><label>Etki</label><input data-k="effect" value="${UI.escape(r.effect)}"></div>
          <div class="field"><label>Şiddet (S) 1-10</label><input data-k="S" type="number" min="1" max="10" value="${+r.S || 1}"></div>
          <div class="field"><label>Olası Neden</label><input data-k="cause" value="${UI.escape(r.cause)}"></div>
          <div class="field"><label>Olasılık (O) 1-10</label><input data-k="O" type="number" min="1" max="10" value="${+r.O || 1}"></div>
          <div class="field"><label>Mevcut Kontroller</label><input data-k="controls" value="${UI.escape(r.controls)}"></div>
          <div class="field"><label>Tespit (D) 1-10</label><input data-k="D" type="number" min="1" max="10" value="${+r.D || 1}"></div>
          <div class="field"><label>RPN</label>
            <div><span class="fmea-rpn ${this.rpnClass(rpn)}">${rpn}</span></div>
          </div>
          <div class="field"><label>Aksiyon</label><input data-k="action" value="${UI.escape(r.action)}"></div>
          <div class="btn-row"><button class="btn btn-danger btn-sm" data-del>🗑️ Satırı Sil</button></div>
        </div>
      `;
    }).join("");

    wrap.querySelectorAll(".list-item").forEach(li => {
      const i = +li.dataset.i;
      li.querySelectorAll("[data-k]").forEach(inp => {
        inp.oninput = () => {
          const k = inp.dataset.k;
          this.rowsState[i][k] = (k === "S" || k === "O" || k === "D") ? +inp.value : inp.value;
          if (k === "S" || k === "O" || k === "D") this.renderRows(root);
        };
      });
      const delBtn = li.querySelector("[data-del]");
      if (delBtn) delBtn.onclick = () => {
        this.rowsState.splice(i, 1);
        if (!this.rowsState.length) this.rowsState.push(this.blankRow());
        this.renderRows(root);
      };
    });
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("⚠️", "Henüz FMEA kaydı yok."); return; }
    wrap.innerHTML = list.map(it => {
      const maxRpn = (it.rows || []).reduce((m, r) => Math.max(m, (+r.S || 0) * (+r.O || 0) * (+r.D || 0)), 0);
      return `
        <div class="list-item" data-id="${it.id}">
          <div class="li-main">
            <div class="li-title">${UI.escape(it.title || "FMEA")}</div>
            <div class="li-sub">${UI.escape(it.scope || "")} • ${UI.fmtDate(it.updatedAt)}</div>
            <div class="li-sub">${(it.rows || []).length} satır • En yüksek RPN: <span class="fmea-rpn ${this.rpnClass(maxRpn)}">${maxRpn}</span></div>
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
      if (UI.confirm("FMEA silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    wrap.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      root.querySelector("#title").value = it.title || "";
      root.querySelector("#scope").value = it.scope || "";
      this.rowsState = (it.rows && it.rows.length ? it.rows.map(r => ({ ...this.blankRow(), ...r })) : [this.blankRow()]);
      this.state.editingId = it.id;
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      this.renderRows(root);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  clearForm(root) {
    root.querySelector("#title").value = "";
    root.querySelector("#scope").value = "";
    this.rowsState = [this.blankRow()];
    this.state.editingId = null;
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    this.renderRows(root);
  },

  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const rows = this.rowsState.filter(r => r.failureMode || r.effect || r.process);
    if (!rows.length) { UI.toast("En az bir hata türü girin", "danger"); return; }
    const data = {
      title,
      scope: root.querySelector("#scope").value.trim(),
      rows
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
    if (!records.length) return { insights: [Analyze.insight("info", "FMEA kaydı yok", "Yüksek riskli süreçler için FMEA girin.")], text: ["Kayıt yok."] };
    const latest = records[records.length - 1];
    const rows = latest.rows || [];
    if (!rows.length) return { insights: [Analyze.insight("warn", "Satır yok", "Son FMEA'da hata türü tanımlı değil.")], text: ["Satır yok."] };
    const rpns = rows.map(r => (+r.S || 0) * (+r.O || 0) * (+r.D || 0));
    const maxR = Math.max(...rpns);
    const avgR = Math.round(rpns.reduce((a, b) => a + b, 0) / rpns.length);
    const lowT = Targets.get("fmea.rpnLow"), highT = Targets.get("fmea.rpnHigh");
    const crit = rpns.filter(r => r > highT).length;
    const med = rpns.filter(r => r > lowT && r <= highT).length;
    insights.push(Analyze.insight("info", `En yüksek RPN: ${maxR}`, `Ortalama ${avgR}. ${rows.length} satır.`));
    if (crit > 0) insights.push(Analyze.insight("danger", `${crit} kritik risk (RPN > ${highT})`, "Bu satırlar için önlemler öncelikli uygulanmalı."));
    else if (med > 0) insights.push(Analyze.insight("warn", `${med} orta risk (${lowT+1}-${highT})`, "Bu satırlarda D veya O'yu düşürecek önlemler planlayın."));
    else insights.push(Analyze.insight("success", "Kritik risk yok", "Tüm RPN değerleri düşük seviyede."));
    const noAction = rows.filter(r => !r.action || r.action.trim().length < 3).length;
    if (noAction) insights.push(Analyze.insight("warn", `${noAction} satırda aksiyon eksik`, "Her yüksek RPN için somut karşı önlem tanımlayın."));
    text.push(`Max RPN: ${maxR}, Ortalama: ${avgR}, Kritik satır: ${crit}`);
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("⚠️", "FMEA kaydedildiğinde otomatik yorum çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("⚠️", "FMEA Risk Yorumu", "", a.insights.join(""));
  }
};
