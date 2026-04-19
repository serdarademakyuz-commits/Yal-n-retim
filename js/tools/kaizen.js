const Kaizen = {
  KEY: "kaizen",
  state: { editingId: null },
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("💡", "Kaizen - Sürekli İyileştirme", "Küçük, sürekli iyileştirmelerle büyük kazançlar elde edin.")}

      <div class="card">
        <h3>📝 Yeni Kaizen</h3>
        <div class="field"><label>Başlık</label><input id="title" placeholder="İyileştirme adı"></div>
        <div class="grid-2">
          <div class="field"><label>Öneren</label><input id="author"></div>
          <div class="field"><label>Alan</label><input id="area"></div>
        </div>
        <div class="field"><label>🔴 Önceki Durum (Before)</label><textarea id="before" placeholder="Mevcut sorun/durum"></textarea></div>
        <div class="field"><label>🟢 Yeni Durum (After)</label><textarea id="after" placeholder="Yapılan iyileştirme"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Zaman Kazancı (dk/gün)</label><input id="timeSave" type="number" step="0.1" value="0"></div>
          <div class="field"><label>Maliyet Kazancı (TL/ay)</label><input id="costSave" type="number" step="1" value="0"></div>
        </div>
        <div class="field"><label>Kategori</label>
          <select id="category">
            <option>Güvenlik</option><option>Kalite</option><option>Maliyet</option>
            <option>Teslimat</option><option>Motivasyon</option><option>Çevre</option>
          </select>
        </div>
        <div class="field"><label>Durum</label>
          <select id="status">
            <option value="idea">Fikir</option>
            <option value="progress">Uygulamada</option>
            <option value="done">Tamamlandı</option>
          </select>
        </div>
        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📊 Özet</h3>
        <div id="summary"></div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Tüm Kaizenler (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderSummary(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  renderSummary(root) {
    const list = Storage.getAll(this.KEY);
    const done = list.filter(x => x.status === "done");
    const totalTime = done.reduce((s, x) => s + (+x.timeSave || 0), 0);
    const totalCost = done.reduce((s, x) => s + (+x.costSave || 0), 0);
    root.querySelector("#summary").innerHTML = `
      <div class="kpi-grid">
        <div class="kpi amber"><div class="label">Toplam</div><div class="value">${list.length}</div></div>
        <div class="kpi success"><div class="label">Tamamlanan</div><div class="value">${done.length}</div></div>
        <div class="kpi"><div class="label">Zaman</div><div class="value">${totalTime.toFixed(0)} dk/gün</div></div>
        <div class="kpi"><div class="label">Maliyet</div><div class="value">${totalCost.toLocaleString("tr-TR")}₺/ay</div></div>
      </div>
    `;
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("💡", "Henüz kaizen yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)} <span class="badge ${it.status === 'done' ? 'success' : it.status === 'progress' ? 'warn' : 'info'}">${it.status}</span></div>
          <div class="li-sub">${UI.escape(it.author || "")} • ${UI.escape(it.area || "")} • ${UI.escape(it.category || "")}</div>
          <div class="li-sub">🔴 ${UI.escape((it.before || "").slice(0, 60))}</div>
          <div class="li-sub">🟢 ${UI.escape((it.after || "").slice(0, 60))}</div>
          <div class="li-sub">💰 ${it.costSave || 0} TL • ⏱️ ${it.timeSave || 0} dk</div>
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
      ["title", "author", "area", "before", "after", "timeSave", "costSave", "category", "status"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] || "";
      });
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    ["title", "author", "area", "before", "after"].forEach(k => root.querySelector("#" + k).value = "");
    root.querySelector("#timeSave").value = 0;
    root.querySelector("#costSave").value = 0;
    root.querySelector("#category").value = "Güvenlik";
    root.querySelector("#status").value = "idea";
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const d = { title };
    ["author", "area", "before", "after", "timeSave", "costSave", "category", "status"].forEach(k => {
      d[k] = root.querySelector("#" + k).value;
    });
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, d);
    else Storage.add(this.KEY, d);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const byStatus = { idea: 0, progress: 0, done: 0 };
    records.forEach(r => { byStatus[r.status || "idea"]++; });
    const done = records.filter(r => r.status === "done");
    const totalTime = done.reduce((s, x) => s + (+x.timeSave || 0), 0);
    const totalCost = done.reduce((s, x) => s + (+x.costSave || 0), 0);
    const completionRate = (byStatus.done / records.length) * 100;
    insights.push(Analyze.insight("info", `${records.length} kaizen (Fikir:${byStatus.idea}, Uygulamada:${byStatus.progress}, Tamamlandı:${byStatus.done})`, `Tamamlanma oranı: %${completionRate.toFixed(0)}`));
    text.push(`Kaizen: ${records.length}, done=${byStatus.done}, rate=%${completionRate.toFixed(0)}`);
    if (completionRate < 30) insights.push(Analyze.insight("warn", "Düşük tamamlanma oranı", "Fikirler uygulamaya dönmüyor — sponsorluk ve küçük adımlara bölme gerekli."));
    else if (completionRate > 70) insights.push(Analyze.insight("success", "Yüksek tamamlanma oranı", "Kaizen kültürü oturmuş. Sonuçları standartlaştırın."));
    if (totalCost > 0 || totalTime > 0) insights.push(Analyze.insight("success", `Toplam kazanç: ${totalCost.toLocaleString("tr-TR")}₺/ay + ${totalTime.toFixed(0)} dk/gün`, "Gerçekleşen faydayı yönetimle paylaşın."));
    const catCount = {};
    records.forEach(r => { if (r.category) catCount[r.category] = (catCount[r.category] || 0) + 1; });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
    if (topCat) insights.push(Analyze.insight("info", `Baskın kategori: ${topCat[0]} (${topCat[1]})`, "Diğer kategorilerde de iyileştirme fırsatları arayın."));
    if (byStatus.idea > byStatus.progress + byStatus.done) insights.push(Analyze.insight("warn", `${byStatus.idea} fikir uygulamaya geçmedi`, "Haftalık 1 fikir → Uygulamaya hedefi koyun."));
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("💡", "Kaizen kaydedin, analiz otomatik çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "Kaizen Otomatik Analizi", "", a.insights.join(""));
  }
};
