const Gemba = {
  KEY: "gemba",
  state: { editingId: null, observations: [], photos: [] },
  render(root) {
    this.state.editingId = null;
    this.state.observations = [];
    this.state.photos = [];
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("👣", "Gemba Yürüyüşü", "Gerçek yere git, gerçek şeyi gör, gerçek olgulardan öğren.")}

      <div class="card">
        <h3>📝 Yürüyüş Bilgisi</h3>
        <div class="grid-2">
          <div class="field"><label>Tarih</label><input id="date" type="date"></div>
          <div class="field"><label>Saat</label><input id="time" type="time"></div>
        </div>
        <div class="field"><label>Alan / Hat</label><input id="area" placeholder="Ör: Hat-2 Montaj"></div>
        <div class="field"><label>Yürüyüşü Yapan</label><input id="walker"></div>
        <div class="field"><label>Katılımcılar</label><input id="participants" placeholder="Virgülle ayırın"></div>
        <div class="field"><label>Odak Konusu</label>
          <select id="focus">
            <option>Güvenlik</option><option>Kalite</option><option>Teslimat</option>
            <option>Maliyet</option><option>5S</option><option>Moral</option>
          </select>
        </div>
      </div>

      <div class="card">
        <h3>➕ Gözlem Ekle</h3>
        <div class="field"><label>Gözlem</label><textarea id="obsText" placeholder="Ne gördün?"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Kategori</label>
            <select id="obsType">
              <option value="good">✅ İyi Uygulama</option>
              <option value="issue">⚠️ Problem</option>
              <option value="improve">💡 İyileştirme Fırsatı</option>
            </select>
          </div>
          <div class="field"><label>Öncelik</label>
            <select id="obsPri">
              <option value="low">Düşük</option>
              <option value="med">Orta</option>
              <option value="high">Yüksek</option>
            </select>
          </div>
        </div>
        <button class="btn btn-accent btn-block" id="addObs">➕ Gözlem Ekle</button>
        <div id="obsWrap" style="margin-top:10px"></div>
      </div>

      <div class="card">
        <h3>📸 Fotoğraflar</h3>
        <div id="photos"></div>
      </div>

      <div class="card">
        <h3>📝 Sonuç ve Aksiyon</h3>
        <textarea id="summary" placeholder="Genel özet, öğrenilenler, alınacak aksiyonlar"></textarea>
        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Yürüyüşler (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#addObs").onclick = () => {
      const text = root.querySelector("#obsText").value.trim();
      if (!text) { UI.toast("Gözlem girin", "danger"); return; }
      this.state.observations.push({
        text, type: root.querySelector("#obsType").value, priority: root.querySelector("#obsPri").value
      });
      root.querySelector("#obsText").value = "";
      this.renderObs(root);
    };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    UI.photoField(root.querySelector("#photos"),
      () => this.state.photos,
      (l) => { this.state.photos = l; },
      { label: "📸 Saha Fotoğrafları", capture: true });
    this.renderObs(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  renderObs(root) {
    const wrap = root.querySelector("#obsWrap");
    if (!this.state.observations.length) {
      wrap.innerHTML = '<small style="color:var(--muted)">Henüz gözlem yok.</small>';
      return;
    }
    wrap.innerHTML = this.state.observations.map((o, i) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${o.type === 'good' ? '✅' : o.type === 'issue' ? '⚠️' : '💡'} ${UI.escape(o.text)}</div>
          <div class="li-sub"><span class="badge ${o.priority === 'high' ? 'danger' : o.priority === 'med' ? 'warn' : 'info'}">${o.priority}</span></div>
        </div>
        <button class="btn btn-danger btn-sm" data-i="${i}">❌</button>
      </div>
    `).join("");
    wrap.querySelectorAll("button[data-i]").forEach(b => b.onclick = (e) => {
      this.state.observations.splice(+e.target.dataset.i, 1);
      this.renderObs(root);
    });
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("👣", "Henüz yürüyüş yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}" style="display:block">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.area || "")} - ${UI.escape(it.focus || "")}</div>
          <div class="li-sub">${UI.escape(it.date || "")} ${UI.escape(it.time || "")} • ${UI.escape(it.walker || "")}</div>
          <div class="li-sub">${(it.observations || []).length} gözlem${(it.photos || []).length ? " • 📸 " + it.photos.length + " foto" : ""}</div>
        </div>
        ${UI.renderPhotos(it.photos)}
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
      this.state.observations = [...(it.observations || [])];
      this.state.photos = [...(it.photos || [])];
      ["date", "time", "area", "walker", "participants", "focus", "summary"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] || "";
      });
      this.renderObs(root);
      UI.photoField(root.querySelector("#photos"),
        () => this.state.photos,
        (l) => { this.state.photos = l; },
        { label: "📸 Saha Fotoğrafları", capture: true });
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    this.state.observations = [];
    this.state.photos = [];
    ["date", "time", "area", "walker", "participants", "summary"].forEach(k => root.querySelector("#" + k).value = "");
    this.renderObs(root);
    UI.photoField(root.querySelector("#photos"),
      () => this.state.photos,
      (l) => { this.state.photos = l; },
      { label: "📸 Saha Fotoğrafları", capture: true });
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const area = root.querySelector("#area").value.trim();
    if (!area) { UI.toast("Alan gerekli", "danger"); return; }
    const data = {
      date: root.querySelector("#date").value,
      time: root.querySelector("#time").value,
      area,
      walker: root.querySelector("#walker").value,
      participants: root.querySelector("#participants").value,
      focus: root.querySelector("#focus").value,
      summary: root.querySelector("#summary").value,
      observations: this.state.observations,
      photos: this.state.photos
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    let good = 0, issue = 0, improve = 0, highPri = 0;
    records.forEach(r => {
      (r.observations || []).forEach(o => {
        if (o.type === "good") good++;
        else if (o.type === "issue") issue++;
        else if (o.type === "improve") improve++;
        if (o.priority === "high") highPri++;
      });
    });
    const total = good + issue + improve;
    insights.push(Analyze.insight("info", `${records.length} yürüyüş, ${total} gözlem`, `İyi: ${good}, Problem: ${issue}, Fırsat: ${improve}`));
    text.push(`walks=${records.length}, obs=${total} (good=${good}, issue=${issue}, improve=${improve})`);
    if (total > 0) {
      const issueRatio = ((issue + improve) / total) * 100;
      if (issueRatio > 70) insights.push(Analyze.insight("warn", `%${issueRatio.toFixed(0)} problem/fırsat ağırlıklı`, "İyi uygulamaları da not alın, motivasyon ve standartlaşma için kritik."));
      else if (good > issue + improve) insights.push(Analyze.insight("info", "İyi uygulama ağırlıklı", "Gözlem derinliğini artırın; problem ve fırsatlar gözden kaçabilir."));
    }
    if (highPri > 0) insights.push(Analyze.insight("action", `${highPri} yüksek öncelikli bulgu`, "Asakai'de paylaşıp 5 Neden/A3 başlatın."));
    const focusCount = {};
    records.forEach(r => { if (r.focus) focusCount[r.focus] = (focusCount[r.focus] || 0) + 1; });
    const topFocus = Object.entries(focusCount).sort((a, b) => b[1] - a[1])[0];
    if (topFocus) insights.push(Analyze.insight("info", `En çok odak: ${topFocus[0]} (${topFocus[1]})`, "Diğer SQDCP eksenlerine de Gemba yapın."));
    const withoutSummary = records.filter(r => !r.summary || r.summary.length < 5).length;
    if (withoutSummary > 0) insights.push(Analyze.insight("warn", `${withoutSummary} yürüyüşte özet yok`, "Her yürüyüş aksiyon ile kapanmalı."));
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("👣", "Yürüyüş kaydedin, analiz otomatik çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "Gemba Otomatik Analizi", "", a.insights.join(""));
  }
};
