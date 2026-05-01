const PokaYoke = {
  KEY: "pokayoke",
  state: { editingId: null },
  LEVELS: [
    { k: "warn",     n: "⚠️ Uyarı (Warning)",  desc: "Operatöre hata sinyali" },
    { k: "control",  n: "🛑 Kontrol (Control)", desc: "Hata oluşmasını engeller" },
    { k: "shutdown", n: "⛔ Durdurma (Shutdown)", desc: "Sistemi otomatik durdurur" }
  ],
  TYPES: ["Fiziksel", "Elektriksel", "Sensör", "Görsel", "Sesli", "Yazılım"],
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("🛡️", "Poka-Yoke (Hata Önleme)", "Hataları ortaya çıkmadan engelleyen akıllı çözümler.")}

      <div class="card">
        <h3>📝 Yeni Poka-Yoke</h3>
        <div class="field"><label>Başlık</label><input id="title" placeholder="Ör: Yanlış parça takma engeli"></div>
        <div class="field"><label>Proses / Makine</label><input id="process"></div>
        <div class="field"><label>Hata Tanımı (Önceki Durum)</label><textarea id="error" placeholder="Hangi hata yapılıyordu?"></textarea></div>
        <div class="field"><label>Uygulanan Çözüm</label><textarea id="solution" placeholder="Nasıl engellendi?"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Seviye</label>
            <select id="level">${this.LEVELS.map(l => `<option value="${l.k}">${l.n}</option>`).join("")}</select>
          </div>
          <div class="field"><label>Tür</label>
            <select id="type">${this.TYPES.map(t => `<option>${t}</option>`).join("")}</select>
          </div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Maliyet (TL)</label><input id="cost" type="number" value="0"></div>
          <div class="field"><label>Tasarruf (TL/ay)</label><input id="savings" type="number" value="0"></div>
        </div>
        <div class="field"><label>Sorumlu</label><input id="owner"></div>
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
    if (!list.length) { wrap.innerHTML = UI.emptyState("🛡️", "Henüz Poka-Yoke yok."); return; }
    wrap.innerHTML = list.map(it => {
      const lvl = this.LEVELS.find(l => l.k === it.level) || this.LEVELS[0];
      return `
        <div class="list-item" data-id="${it.id}">
          <div class="li-main">
            <div class="li-title">${UI.escape(it.title)}</div>
            <div class="li-sub">${UI.escape(it.process || "")} • ${lvl.n} • ${UI.escape(it.type || "")}</div>
            <div class="li-sub">💰 Tasarruf: ${it.savings || 0} TL/ay</div>
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
      ["title", "process", "error", "solution", "level", "type", "cost", "savings", "owner"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] || (el.type === "number" ? 0 : "");
      });
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    ["title", "process", "error", "solution", "owner"].forEach(k => root.querySelector("#" + k).value = "");
    root.querySelector("#cost").value = 0;
    root.querySelector("#savings").value = 0;
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const d = { title };
    ["process", "error", "solution", "level", "type", "cost", "savings", "owner"].forEach(k => d[k] = root.querySelector("#" + k).value);
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, d);
    else Storage.add(this.KEY, d);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const byLevel = { warn: 0, control: 0, shutdown: 0 };
    records.forEach(r => { if (byLevel[r.level] !== undefined) byLevel[r.level]++; });
    insights.push(Analyze.insight("info", `${records.length} Poka-Yoke`, `Uyarı: ${byLevel.warn}, Kontrol: ${byLevel.control}, Durdurma: ${byLevel.shutdown}`));
    text.push(`warn=${byLevel.warn}, control=${byLevel.control}, shutdown=${byLevel.shutdown}`);
    const strong = byLevel.control + byLevel.shutdown;
    const ratio = (strong / records.length) * 100;
    if (ratio < 50) insights.push(Analyze.insight("warn", `Sadece %${ratio.toFixed(0)} güçlü seviye (Kontrol+Durdurma)`, "Uyarı seviyesi insan hatasına açıktır — mümkünse Kontrol/Durdurma seviyesine yükseltin."));
    else insights.push(Analyze.insight("success", `%${ratio.toFixed(0)} güçlü seviye (Kontrol+Durdurma)`, "Hata önleme disiplini iyi. Yeni süreçlere yayın."));
    const totalSavings = records.reduce((s, r) => s + (+r.savings || 0), 0);
    const totalCost = records.reduce((s, r) => s + (+r.cost || 0), 0);
    if (totalSavings > 0) insights.push(Analyze.insight("success", `Toplam tasarruf: ${totalSavings.toLocaleString("tr-TR")}₺/ay`, totalCost > 0 ? `Yatırım geri dönüş: ~${(totalCost/totalSavings).toFixed(1)} ay.` : "ROI yüksek — yatırım maliyeti düşük."));
    const typeCount = {};
    records.forEach(r => { if (r.type) typeCount[r.type] = (typeCount[r.type] || 0) + 1; });
    const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
    if (topType) insights.push(Analyze.insight("info", `Baskın tür: ${topType[0]} (${topType[1]})`, "Çözüm çeşitliliği için diğer türleri de değerlendirin."));
    const ti = Targets.periodInsight(records, "year", "pokayoke.yearlyTarget");
    if (ti) insights.push(ti);
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("🛡️", "Poka-Yoke kaydedin, analiz otomatik çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "Poka-Yoke Otomatik Analizi", "", a.insights.join(""));
  }
};
