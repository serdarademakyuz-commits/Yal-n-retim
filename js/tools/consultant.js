/* Consultant Presentation Report — cover, executive summary, findings, action plan, signatures */
const Consultant = {
  KEY: "consultant",
  state: { editingId: null, findings: [], logo: "" },

  render(root) {
    this.state.editingId = null;
    this.state.findings = [];
    this.state.logo = Storage.getValue("consultant_logo") || "";
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("📑", "Danışmanlık Sunum Raporu", "Kapak + yönetici özeti + bulgular + aksiyon planı + imza şablonu.")}

      <div class="card">
        <h3>🏷️ Marka / Logo</h3>
        <small style="color:var(--muted)">Logo tüm raporlarda kullanılır. Bir kere yükleyin.</small>
        <div id="logoField"></div>
      </div>

      <div class="card">
        <h3>📝 Rapor Bilgileri</h3>
        <div class="field"><label>Rapor Başlığı</label>
          <input id="title" placeholder="Ör: Yalın Dönüşüm Değerlendirmesi — Hat 2">
        </div>
        <div class="grid-2">
          <div class="field"><label>Müşteri / Firma</label><input id="client"></div>
          <div class="field"><label>Proje Kodu</label><input id="projectCode"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Danışman</label><input id="consultant"></div>
          <div class="field"><label>Rapor Tarihi</label><input id="date" type="date"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Dönem Başı</label><input id="periodStart" type="date"></div>
          <div class="field"><label>Dönem Sonu</label><input id="periodEnd" type="date"></div>
        </div>
        <div class="field"><label>📊 Yönetici Özeti</label>
          <textarea id="execSummary" rows="5" placeholder="3-5 cümle: temel bulgular, kazanımlar, öneriler."></textarea>
        </div>
        <div class="field"><label>🎯 Kapsam</label>
          <textarea id="scope" rows="3" placeholder="Değerlendirilen hat/süreç/alanlar."></textarea>
        </div>
        <div class="field"><label>📏 Mevcut Durum (Baseline)</label>
          <textarea id="baseline" rows="3" placeholder="Ölçülen mevcut KPI'lar (OEE, defect rate, WIP vb.)"></textarea>
        </div>
        <div class="field"><label>🎯 Hedef Durum</label>
          <textarea id="target" rows="3" placeholder="Hedeflenen iyileşme."></textarea>
        </div>
      </div>

      <div class="card">
        <h3>🔎 Bulgular ve Öneriler</h3>
        <div class="grid-2">
          <input id="newFinding" placeholder="Bulgu / öneri">
          <select id="newFindingSev">
            <option value="high">🚨 Yüksek</option>
            <option value="med">⚠️ Orta</option>
            <option value="low">ℹ️ Düşük</option>
          </select>
        </div>
        <button class="btn btn-accent btn-block" id="addFinding" style="margin-top:8px">➕ Bulgu Ekle</button>
        <div id="findingsWrap" style="margin-top:10px"></div>
      </div>

      <div class="card">
        <h3>✍️ İmza Alanları</h3>
        <div class="grid-2">
          <div class="field"><label>Danışman Adı-Soyadı</label><input id="sigConsultant"></div>
          <div class="field"><label>Müşteri Temsilcisi</label><input id="sigClient"></div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-warn" id="previewBtn">🖨️ Önizle / PDF</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div id="previewWrap" data-no-print-outer></div>

      <div class="card">
        <h3>📋 Kayıtlı Raporlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    this.renderLogoField(root);
    this.renderFindings(root);
    this.renderList(root);

    root.querySelector("#addFinding").onclick = () => {
      const text = root.querySelector("#newFinding").value.trim();
      if (!text) { UI.toast("Bulgu girin", "danger"); return; }
      this.state.findings.push({ text, sev: root.querySelector("#newFindingSev").value });
      root.querySelector("#newFinding").value = "";
      this.renderFindings(root);
    };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#previewBtn").onclick = () => this.preview(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); UI.toast("Form temizlendi"); };
  },

  renderLogoField(root) {
    const wrap = root.querySelector("#logoField");
    wrap.innerHTML = `
      <input type="file" accept="image/*" id="logoInput">
      <div style="margin-top:6px">
        ${this.state.logo ? `<img src="${this.state.logo}" alt="logo" style="max-height:60px;background:#fff;padding:4px;border:1px solid var(--border);border-radius:6px">` : '<small style="color:var(--muted)">Logo yüklü değil.</small>'}
      </div>
      ${this.state.logo ? '<button class="btn btn-danger btn-sm" id="removeLogo" style="margin-top:6px">🗑️ Logoyu Kaldır</button>' : ''}
    `;
    root.querySelector("#logoInput").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        this.state.logo = reader.result;
        Storage.setValue("consultant_logo", reader.result);
        UI.toast("Logo kaydedildi", "success");
        this.renderLogoField(root);
      };
      reader.readAsDataURL(f);
    };
    const rm = root.querySelector("#removeLogo");
    if (rm) rm.onclick = () => {
      this.state.logo = "";
      Storage.setValue("consultant_logo", "");
      UI.toast("Logo kaldırıldı");
      this.renderLogoField(root);
    };
  },

  renderFindings(root) {
    const wrap = root.querySelector("#findingsWrap");
    if (!this.state.findings.length) { wrap.innerHTML = '<small style="color:var(--muted)">Henüz bulgu yok.</small>'; return; }
    const icon = s => s === "high" ? "🚨" : s === "med" ? "⚠️" : "ℹ️";
    wrap.innerHTML = this.state.findings.map((f, i) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${icon(f.sev)} ${UI.escape(f.text)}</div>
        </div>
        <button class="btn btn-danger btn-sm" data-i="${i}">❌</button>
      </div>
    `).join("");
    wrap.querySelectorAll("button[data-i]").forEach(b => b.onclick = e => {
      this.state.findings.splice(+e.target.dataset.i, 1);
      this.renderFindings(root);
    });
  },

  fields(root) {
    const g = id => root.querySelector("#" + id).value;
    return {
      title: g("title"), client: g("client"), projectCode: g("projectCode"),
      consultant: g("consultant"), date: g("date"),
      periodStart: g("periodStart"), periodEnd: g("periodEnd"),
      execSummary: g("execSummary"), scope: g("scope"),
      baseline: g("baseline"), target: g("target"),
      sigConsultant: g("sigConsultant"), sigClient: g("sigClient"),
      findings: [...this.state.findings]
    };
  },

  clearForm(root) {
    ["title","client","projectCode","consultant","date","periodStart","periodEnd",
     "execSummary","scope","baseline","target","sigConsultant","sigClient"].forEach(k => {
      root.querySelector("#" + k).value = "";
    });
    this.state.findings = [];
    this.state.editingId = null;
    this.renderFindings(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
  },

  save(root) {
    const data = this.fields(root);
    if (!data.title) { UI.toast("Başlık gerekli", "danger"); return; }
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("📑", "Henüz rapor yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)}</div>
          <div class="li-sub">${UI.escape(it.client || "")} • ${UI.escape(it.date || "")} • ${(it.findings || []).length} bulgu</div>
        </div>
        <div class="li-actions">
          <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
          <button class="btn btn-warn btn-sm" data-action="preview">🖨️</button>
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
      ["title","client","projectCode","consultant","date","periodStart","periodEnd",
       "execSummary","scope","baseline","target","sigConsultant","sigClient"].forEach(k => {
        root.querySelector("#" + k).value = it[k] || "";
      });
      this.state.findings = [...(it.findings || [])];
      this.state.editingId = id;
      this.renderFindings(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    wrap.querySelectorAll("[data-action=preview]").forEach(b => b.onclick = e => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      ["title","client","projectCode","consultant","date","periodStart","periodEnd",
       "execSummary","scope","baseline","target","sigConsultant","sigClient"].forEach(k => {
        root.querySelector("#" + k).value = it[k] || "";
      });
      this.state.findings = [...(it.findings || [])];
      this.renderFindings(root);
      this.preview(root);
    });
  },

  preview(root) {
    const d = this.fields(root);
    const projName = (typeof Projects !== "undefined" && Projects.getActiveProject) ? Projects.getActiveProject().name : "";
    const icon = s => s === "high" ? "🚨" : s === "med" ? "⚠️" : "ℹ️";
    const logo = this.state.logo || "";
    const wrap = root.querySelector("#previewWrap");
    wrap.innerHTML = `
      <div class="card consultant-report" id="consultantReport">
        <div class="cr-cover">
          ${logo ? `<img src="${logo}" alt="logo" class="cr-logo">` : ""}
          <h1>${UI.escape(d.title || "Danışmanlık Raporu")}</h1>
          <div class="cr-sub">${UI.escape(d.client || "")} ${d.projectCode ? "• " + UI.escape(d.projectCode) : ""}</div>
          <div class="cr-sub">${UI.escape(d.periodStart || "")} — ${UI.escape(d.periodEnd || "")}</div>
          <div class="cr-sub">${UI.escape(d.consultant || "")} • ${UI.escape(d.date || "")}</div>
          ${projName ? `<div class="cr-sub">📁 ${UI.escape(projName)}</div>` : ""}
        </div>

        ${d.execSummary ? `<section><h2>📊 Yönetici Özeti</h2><p>${UI.escape(d.execSummary)}</p></section>` : ""}
        ${d.scope ? `<section><h2>🎯 Kapsam</h2><p>${UI.escape(d.scope)}</p></section>` : ""}
        ${d.baseline ? `<section><h2>📏 Mevcut Durum</h2><p>${UI.escape(d.baseline)}</p></section>` : ""}
        ${d.target ? `<section><h2>🏁 Hedef Durum</h2><p>${UI.escape(d.target)}</p></section>` : ""}

        ${d.findings.length ? `
          <section>
            <h2>🔎 Bulgular ve Öneriler</h2>
            <ol>
              ${d.findings.map(f => `<li>${icon(f.sev)} ${UI.escape(f.text)}</li>`).join("")}
            </ol>
          </section>
        ` : ""}

        <section>
          <h2>✍️ Onay</h2>
          <div class="cr-signatures">
            <div>
              <div class="cr-sig-line"></div>
              <div>Danışman: ${UI.escape(d.sigConsultant || "")}</div>
              <div>Tarih: ${UI.escape(d.date || "")}</div>
            </div>
            <div>
              <div class="cr-sig-line"></div>
              <div>Müşteri Temsilcisi: ${UI.escape(d.sigClient || "")}</div>
              <div>Tarih: ____________</div>
            </div>
          </div>
        </section>
      </div>
      <div class="btn-row" data-no-print>
        <button class="btn btn-warn" id="doPrint">🖨️ Yazdır / PDF</button>
      </div>
    `;
    root.querySelector("#doPrint").onclick = () => UI.printPage();
    window.scrollTo({ top: wrap.offsetTop - 20, behavior: "smooth" });
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const insights = [], text = [];
    if (!records.length) return { insights: [Analyze.insight("info", "Rapor yok", "İlk danışmanlık raporunuzu oluşturun.")], text: ["Kayıt yok."] };
    insights.push(Analyze.insight("info", `${records.length} danışmanlık raporu`, "Her rapor için Asakai'de takip toplantısı planlayın."));
    const noSig = records.filter(r => !r.sigClient).length;
    if (noSig) insights.push(Analyze.insight("warn", `${noSig} raporda müşteri imzası alanı boş`, "Kapanış oturumunda imza alın."));
    text.push(`Toplam rapor: ${records.length}`);
    return { insights, text };
  }
};
