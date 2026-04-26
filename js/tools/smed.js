const SMED = {
  KEY: "smed",
  state: { editingId: null, activities: [] },
  render(root) {
    this.state.editingId = null;
    this.state.activities = [];
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("⚡", "SMED - Tekli Dakikada Kalıp Değişimi", "İç ve dış faaliyetleri ayırıp 10 dakikanın altına indirin.")}

      <div class="card">
        <h3>📝 Değişim Bilgisi</h3>
        <div class="field"><label>Proses / Makine</label><input id="process" placeholder="Ör: Pres-5 Kalıp Değişimi"></div>
        <div class="grid-2">
          <div class="field"><label>Mevcut Süre (dk)</label><input id="before" type="number" min="0" value="45"></div>
          <div class="field"><label>Hedef Süre (dk)</label><input id="target" type="number" min="0" value="${typeof Targets !== 'undefined' ? Targets.get('smed.targetMin') : 10}"></div>
        </div>
      </div>

      <div class="card">
        <h3>🔧 Faaliyet Ekle</h3>
        <div class="field"><label>Faaliyet</label><input id="actName" placeholder="Ör: Civataları sök"></div>
        <div class="grid-2">
          <div class="field"><label>Süre (dk)</label><input id="actDur" type="number" step="0.1" min="0" value="0"></div>
          <div class="field"><label>Tür</label>
            <select id="actType">
              <option value="internal">🔴 İç (Makine durmalı)</option>
              <option value="external">🟢 Dış (Makine çalışırken)</option>
            </select>
          </div>
        </div>
        <button class="btn btn-accent btn-block" id="addAct">➕ Faaliyet Ekle</button>
        <div id="actsWrap" style="margin-top:10px"></div>
      </div>

      <div class="card">
        <h3>📊 Kazanç Analizi</h3>
        <div id="analysis"></div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div class="card" style="margin-top:12px">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#addAct").onclick = () => {
      const name = root.querySelector("#actName").value.trim();
      const dur = +root.querySelector("#actDur").value;
      const type = root.querySelector("#actType").value;
      if (!name || dur < 0) { UI.toast("Faaliyet ve süre girin", "danger"); return; }
      this.state.activities.push({ name, dur, type });
      root.querySelector("#actName").value = "";
      root.querySelector("#actDur").value = 0;
      this.renderActivities(root);
      this.renderGainAnalysis(root);
      this.renderAnalysis(root);
    };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    root.querySelector("#before").oninput = () => { this.renderGainAnalysis(root); this.renderAnalysis(root); };
    root.querySelector("#target").oninput = () => { this.renderGainAnalysis(root); this.renderAnalysis(root); };
    this.renderActivities(root);
    this.renderGainAnalysis(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  renderActivities(root) {
    const wrap = root.querySelector("#actsWrap");
    if (!this.state.activities.length) {
      wrap.innerHTML = '<small style="color:var(--muted)">Henüz faaliyet yok.</small>';
      return;
    }
    wrap.innerHTML = this.state.activities.map((a, i) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${UI.escape(a.name)}</div>
          <div class="li-sub">${a.dur} dk <span class="badge ${a.type === 'internal' ? 'danger' : 'success'}">${a.type === 'internal' ? 'İÇ' : 'DIŞ'}</span></div>
        </div>
        <div class="li-actions">
          <button class="btn btn-warn btn-sm" data-toggle="${i}">🔄</button>
          <button class="btn btn-danger btn-sm" data-del="${i}">❌</button>
        </div>
      </div>
    `).join("");
    wrap.querySelectorAll("[data-del]").forEach(b => b.onclick = (e) => {
      this.state.activities.splice(+e.target.dataset.del, 1);
      this.renderActivities(root); this.renderGainAnalysis(root); this.renderAnalysis(root);
    });
    wrap.querySelectorAll("[data-toggle]").forEach(b => b.onclick = (e) => {
      const i = +e.target.dataset.toggle;
      this.state.activities[i].type = this.state.activities[i].type === "internal" ? "external" : "internal";
      this.renderActivities(root); this.renderGainAnalysis(root); this.renderAnalysis(root);
    });
  },
  renderGainAnalysis(root) {
    const a = root.querySelector("#analysis");
    const internal = this.state.activities.filter(x => x.type === "internal").reduce((s, x) => s + x.dur, 0);
    const external = this.state.activities.filter(x => x.type === "external").reduce((s, x) => s + x.dur, 0);
    const totalWork = internal + external;
    const before = +root.querySelector("#before").value;
    const target = +root.querySelector("#target").value;
    const after = internal;
    const saving = before - after;
    const savPct = before > 0 ? (saving / before) * 100 : 0;
    a.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi danger"><div class="label">İç Faal. (Makine Durur)</div><div class="value">${internal.toFixed(1)} dk</div></div>
        <div class="kpi success"><div class="label">Dış Faal. (Paralel)</div><div class="value">${external.toFixed(1)} dk</div></div>
        <div class="kpi amber"><div class="label">Yeni Durma</div><div class="value">${after.toFixed(1)} dk</div></div>
        <div class="kpi"><div class="label">Kazanç</div><div class="value">${saving.toFixed(1)} dk</div><div class="sub">%${savPct.toFixed(1)}</div></div>
      </div>
      <div class="list-item" style="margin-top:8px"><div class="li-main">
        <div class="li-title">📐 SMED Prensibi</div>
        <div class="li-sub">Makine duruşu = sadece iç faaliyetler. Dış faaliyetler (${external.toFixed(1)} dk) makine çalışırken yapılır.</div>
        <div class="li-sub">Toplam iş yükü: ${totalWork.toFixed(1)} dk (iç + dış)</div>
      </div></div>
      ${after <= target ? '<div class="list-item" style="background:#dcfce7"><div class="li-main"><div class="li-title">✅ Hedefe ulaşıldı</div></div></div>'
                        : `<div class="list-item" style="background:#fef3c7"><div class="li-main"><div class="li-title">⚠️ Hedef: ${target} dk, ${(after - target).toFixed(1)} dk fazla</div></div></div>`}
    `;
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("⚡", "Henüz SMED analizi yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.process)}</div>
          <div class="li-sub">${it.before} dk → ${it.after?.toFixed(1)} dk • Kazanç: ${(it.before - (it.after || 0)).toFixed(1)} dk</div>
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
      this.state.activities = [...(it.activities || [])];
      root.querySelector("#process").value = it.process;
      root.querySelector("#before").value = it.before;
      root.querySelector("#target").value = it.target;
      this.renderActivities(root); this.renderGainAnalysis(root); this.renderAnalysis(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    this.state.activities = [];
    root.querySelector("#process").value = "";
    root.querySelector("#before").value = 45;
    root.querySelector("#target").value = 10;
    this.renderActivities(root); this.renderGainAnalysis(root); this.renderAnalysis(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const process = root.querySelector("#process").value.trim();
    if (!process) { UI.toast("Proses adı gerekli", "danger"); return; }
    const before = +root.querySelector("#before").value;
    const target = +root.querySelector("#target").value;
    const internal = this.state.activities.filter(x => x.type === "internal").reduce((s, x) => s + x.dur, 0);
    const data = { process, before, target, activities: this.state.activities, after: internal };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const liveActs = (this.state && this.state.activities) || [];
    if (!records.length && !liveActs.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const latest = records.length ? records[records.length - 1] : {};
    const acts = liveActs.length ? liveActs : (latest.activities || []);
    const after = acts.filter(x => x.type === "internal").reduce((s, x) => s + (+x.dur || 0), 0);
    const before = +latest.before || 0;
    const target = +latest.target || 0;
    const saving = before - after;
    const savPct = before > 0 ? (saving / before) * 100 : 0;
    const internal = acts.filter(x => x.type === "internal").reduce((s, x) => s + (+x.dur || 0), 0);
    const external = acts.filter(x => x.type === "external").reduce((s, x) => s + (+x.dur || 0), 0);
    const totalWork = internal + external;
    const intPct = totalWork > 0 ? (internal / totalWork) * 100 : 0;
    const extPct = totalWork > 0 ? (external / totalWork) * 100 : 0;
    insights.push(Analyze.insight(savPct >= 50 ? "success" : savPct >= 20 ? "warn" : "danger",
      `Dönüşüm kazancı: %${savPct.toFixed(1)}`,
      `${before.toFixed(1)} dk → ${after.toFixed(1)} dk (${saving.toFixed(1)} dk tasarruf).`));
    text.push(`Kazanç: %${savPct.toFixed(1)} (${saving.toFixed(1)} dk)`);
    if (totalWork > 0) {
      insights.push(Analyze.insight("info", `İç/Dış oranı: %${intPct.toFixed(0)} / %${extPct.toFixed(0)}`,
        `İç: ${internal.toFixed(1)} dk (makine durur) • Dış: ${external.toFixed(1)} dk (paralel).`));
      text.push(`İç/Dış: %${intPct.toFixed(0)}/${extPct.toFixed(0)}`);
    }
    if (intPct > 70 && totalWork > 0) {
      insights.push(Analyze.insight("action", "İç faaliyet oranı yüksek", "İç faaliyetleri dışa dönüştürün (hazırlık, taşıma makine çalışırken). Paralelleştirme ile makine duruşunu azaltın."));
      text.push("Öneri: İç faaliyetleri paralelleştir.");
    }
    if (target > 0) {
      if (after <= target) insights.push(Analyze.insight("success", `Hedefe ulaşıldı (${target} dk)`, "SMED hedefi tutturuldu."));
      else insights.push(Analyze.insight("warn", `Hedefin ${(after - target).toFixed(1)} dk üstünde`, `Hedef: ${target} dk, Mevcut: ${after.toFixed(1)} dk. Daha fazla dönüşüm gerekli.`));
    }
    if (records.length > 1) {
      const avg = records.reduce((s, r) => s + ((+r.before || 0) - (+r.after || 0)) / Math.max(1, +r.before || 1), 0) / records.length * 100;
      insights.push(Analyze.insight("info", `Ortalama kazanç: %${avg.toFixed(1)} (${records.length} kayıt)`, "Kayıtlar arası toplam dönüşüm performansı."));
    }
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    const hasLive = this.state && this.state.activities && this.state.activities.length > 0;
    if (!records.length && !hasLive) { wrap.innerHTML = Analyze.empty("⚡", "SMED analizi kaydedin, otomatik analiz oluşur."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "SMED Otomatik Analizi", "", a.insights.join(""));
  }
};
