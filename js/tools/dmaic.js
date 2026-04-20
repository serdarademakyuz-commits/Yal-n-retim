/* DMAIC / Six Sigma Project Charter — Define / Measure / Analyze / Improve / Control */
const DMAIC = {
  KEY: "dmaic",
  state: { editingId: null, members: [] },

  PHASES: [
    { k: "define",   n: "1️⃣ Define (Tanımla)",  ph: "Problem statement, müşteri sesi (VOC), SIPOC" },
    { k: "measure",  n: "2️⃣ Measure (Ölç)",     ph: "Baseline KPI'lar, ölçüm planı, MSA" },
    { k: "analyze",  n: "3️⃣ Analyze (Analiz)",  ph: "Kök neden, hipotez testi, Pareto/FMEA bağlantıları" },
    { k: "improve",  n: "4️⃣ Improve (İyileştir)", ph: "Uygulanan çözümler, pilot sonuçları" },
    { k: "control",  n: "5️⃣ Control (Kontrol)", ph: "SPC planı, standart iş, eğitim, sürdürülebilirlik" }
  ],

  render(root) {
    this.state.editingId = null;
    this.state.members = [];
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("🎯", "DMAIC Proje Kartı", "Six Sigma proje kimliği — sponsor, ekip, kapsam, hedef, DMAIC fazları.")}

      <div class="card">
        <h3>📝 Proje Kimliği</h3>
        <div class="field"><label>Proje Başlığı</label><input id="title"></div>
        <div class="grid-2">
          <div class="field"><label>Proje Kodu</label><input id="code"></div>
          <div class="field"><label>Alan / Süreç</label><input id="area"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Sponsor</label><input id="sponsor"></div>
          <div class="field"><label>Lider (Black/Green Belt)</label><input id="leader"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Başlangıç</label><input id="startDate" type="date"></div>
          <div class="field"><label>Bitiş (Hedef)</label><input id="endDate" type="date"></div>
        </div>
        <div class="field"><label>Problem Tanımı</label>
          <textarea id="problem" rows="3"></textarea>
        </div>
        <div class="field"><label>Kapsam (Scope)</label>
          <textarea id="scope" rows="2"></textarea>
        </div>
        <div class="field"><label>Hedef (SMART)</label>
          <textarea id="goal" rows="2"></textarea>
        </div>
        <div class="grid-2">
          <div class="field"><label>Baseline Metriği</label><input id="baselineMetric" placeholder="Ör: OEE %58"></div>
          <div class="field"><label>Hedef Metrik</label><input id="targetMetric" placeholder="Ör: OEE %75"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Beklenen Tasarruf (TL/yıl)</label><input id="savings" type="number" step="1" value="0"></div>
          <div class="field"><label>Durum</label>
            <select id="status">
              <option value="define">Define</option>
              <option value="measure">Measure</option>
              <option value="analyze">Analyze</option>
              <option value="improve">Improve</option>
              <option value="control">Control</option>
              <option value="closed">Kapandı</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>👥 Ekip Üyeleri</h3>
        <div class="grid-2">
          <input id="mName" placeholder="Ad Soyad">
          <input id="mRole" placeholder="Rol (ör: operatör, kalite)">
        </div>
        <button class="btn btn-accent btn-block" id="addMember" style="margin-top:8px">➕ Ekle</button>
        <div id="membersWrap" style="margin-top:10px"></div>
      </div>

      ${this.PHASES.map(p => `
        <div class="card">
          <h3>${p.n}</h3>
          <textarea id="${p.k}" placeholder="${p.ph}" style="min-height:90px"></textarea>
        </div>
      `).join("")}

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlı Projeler (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    this.renderMembers(root);
    this.renderList(root);
    this.renderAnalysis(root);

    root.querySelector("#addMember").onclick = () => {
      const n = root.querySelector("#mName").value.trim();
      const r = root.querySelector("#mRole").value.trim();
      if (!n) { UI.toast("Ad gerekli", "danger"); return; }
      this.state.members.push({ name: n, role: r });
      root.querySelector("#mName").value = "";
      root.querySelector("#mRole").value = "";
      this.renderMembers(root);
    };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); UI.toast("Form temizlendi"); };
  },

  renderMembers(root) {
    const wrap = root.querySelector("#membersWrap");
    if (!this.state.members.length) { wrap.innerHTML = '<small style="color:var(--muted)">Ekip üyesi yok.</small>'; return; }
    wrap.innerHTML = this.state.members.map((m, i) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${UI.escape(m.name)}</div>
          <div class="li-sub">${UI.escape(m.role || "—")}</div>
        </div>
        <button class="btn btn-danger btn-sm" data-i="${i}">❌</button>
      </div>
    `).join("");
    wrap.querySelectorAll("button[data-i]").forEach(b => b.onclick = e => {
      this.state.members.splice(+e.target.dataset.i, 1);
      this.renderMembers(root);
    });
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🎯", "Henüz proje yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title || "")}</div>
          <div class="li-sub">${UI.escape(it.code || "")} • ${UI.escape(it.area || "")} • ${UI.escape(it.status || "")}</div>
          <div class="li-sub">${UI.escape(it.baselineMetric || "")} → ${UI.escape(it.targetMetric || "")} • Tasarruf: ${(+it.savings || 0).toLocaleString("tr-TR")}₺/yıl</div>
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
      ["title","code","area","sponsor","leader","startDate","endDate","problem","scope","goal","baselineMetric","targetMetric","savings","status"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] != null ? it[k] : "";
      });
      this.PHASES.forEach(p => { const el = root.querySelector("#" + p.k); if (el) el.value = it[p.k] || ""; });
      this.state.members = [...(it.members || [])];
      this.state.editingId = id;
      this.renderMembers(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  clearForm(root) {
    ["title","code","area","sponsor","leader","startDate","endDate","problem","scope","goal","baselineMetric","targetMetric","savings"].forEach(k => root.querySelector("#" + k).value = "");
    this.PHASES.forEach(p => root.querySelector("#" + p.k).value = "");
    root.querySelector("#status").value = "define";
    this.state.members = [];
    this.state.editingId = null;
    this.renderMembers(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
  },

  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const d = { title, members: [...this.state.members] };
    ["code","area","sponsor","leader","startDate","endDate","problem","scope","goal","baselineMetric","targetMetric","savings","status"].forEach(k => {
      d[k] = root.querySelector("#" + k).value;
    });
    this.PHASES.forEach(p => { d[p.k] = root.querySelector("#" + p.k).value; });
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, d);
    else Storage.add(this.KEY, d);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const insights = [], text = [];
    if (!records.length) return { insights: [Analyze.insight("info", "Proje yok", "İlk DMAIC projenizi başlatın.")], text: ["Kayıt yok."] };
    const byStatus = {};
    records.forEach(r => { byStatus[r.status || "define"] = (byStatus[r.status || "define"] || 0) + 1; });
    const closed = byStatus.closed || 0;
    const totalSavings = records.filter(r => r.status === "closed").reduce((s, r) => s + (+r.savings || 0), 0);
    insights.push(Analyze.insight("info", `${records.length} proje • Kapanan: ${closed}`, `Planlanmış tasarruf: ${totalSavings.toLocaleString("tr-TR")}₺/yıl`));
    if (records.length > 3 && closed === 0) insights.push(Analyze.insight("warn", "Hiçbir proje kapanmamış", "Projeleri küçük ve ölçülebilir tutun, kapanış disiplini oluşturun."));
    const noTeam = records.filter(r => !r.members || !r.members.length).length;
    if (noTeam) insights.push(Analyze.insight("warn", `${noTeam} projede ekip tanımsız`, "DMAIC başarısı ekip katılımına bağlıdır."));
    text.push(`Projeler: ${records.length}, Kapanan: ${closed}, Tasarruf: ${totalSavings}`);
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("🎯", "Proje ekleyin, analiz otomatik çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🎯", "DMAIC Portföy Yorumu", "", a.insights.join(""));
  }
};
