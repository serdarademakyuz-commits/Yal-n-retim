const Asakai = {
  KEY: "asakai",
  state: { editingId: null, agenda: [] },
  render(root) {
    this.state.editingId = null;
    this.state.agenda = [];
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("🌅", "Asakai - Sabah Toplantısı", "Gün başında kısa, ayakta, odaklı toplantı: Dün, bugün, engeller.")}

      <div class="card">
        <h3>📅 Toplantı Bilgisi</h3>
        <div class="grid-2">
          <div class="field"><label>Tarih</label><input id="date" type="date"></div>
          <div class="field"><label>Saat</label><input id="time" type="time" value="08:00"></div>
        </div>
        <div class="field"><label>Ekip / Hat</label><input id="team" placeholder="Ör: Hat-3 Ekibi"></div>
        <div class="field"><label>Yöneten</label><input id="leader"></div>
        <div class="field"><label>Katılımcı Sayısı</label><input id="headcount" type="number" min="0" value="0"></div>
      </div>

      <div class="card">
        <h3>📊 Dünkü Performans</h3>
        <div class="grid-2">
          <div class="field"><label>Üretim (adet)</label><input id="yestOutput" type="number" value="0"></div>
          <div class="field"><label>Hedef (adet)</label><input id="yestTarget" type="number" value="0"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Hurda Oranı (%)</label><input id="scrap" type="number" step="0.1" value="0"></div>
          <div class="field"><label>Duruş (dk)</label><input id="downtime" type="number" value="0"></div>
        </div>
      </div>

      <div class="card">
        <h3>🎯 Bugünkü Plan</h3>
        <div class="field"><label>Öncelikler</label><textarea id="priorities"></textarea></div>
        <div class="field"><label>Hedef Üretim</label><input id="todayTarget" type="number" value="0"></div>
      </div>

      <div class="card">
        <h3>🚧 Engeller / SQDCP</h3>
        <div class="field"><label>Güvenlik</label><textarea id="safety" placeholder="Dikkat noktaları"></textarea></div>
        <div class="field"><label>Kalite</label><textarea id="quality"></textarea></div>
        <div class="field"><label>Engeller (Blocker)</label><textarea id="blockers"></textarea></div>
      </div>

      <div class="card">
        <h3>✅ Aksiyonlar</h3>
        <div class="field"><label>Aksiyon</label><input id="actText" placeholder="Yapılacak"></div>
        <div class="grid-2">
          <div class="field"><label>Sorumlu</label><input id="actOwner"></div>
          <div class="field"><label>Süre</label><input id="actDue" type="date"></div>
        </div>
        <button class="btn btn-accent btn-block" id="addAct">➕ Aksiyon Ekle</button>
        <div id="actsWrap" style="margin-top:10px"></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card" style="margin-top:12px">
        <h3>📋 Geçmiş Toplantılar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#addAct").onclick = () => {
      const text = root.querySelector("#actText").value.trim();
      if (!text) { UI.toast("Aksiyon girin", "danger"); return; }
      this.state.agenda.push({
        text, owner: root.querySelector("#actOwner").value, due: root.querySelector("#actDue").value, done: false
      });
      ["actText", "actOwner", "actDue"].forEach(k => root.querySelector("#" + k).value = "");
      this.renderActs(root);
    };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderActs(root);
    this.renderList(root);
    this.renderAnalysis(root);
  },
  renderActs(root) {
    const wrap = root.querySelector("#actsWrap");
    if (!this.state.agenda.length) { wrap.innerHTML = '<small style="color:var(--muted)">Henüz aksiyon yok.</small>'; return; }
    wrap.innerHTML = this.state.agenda.map((a, i) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${UI.escape(a.text)}</div>
          <div class="li-sub">${UI.escape(a.owner || "")} • ${UI.escape(a.due || "")}</div>
        </div>
        <button class="btn btn-danger btn-sm" data-i="${i}">❌</button>
      </div>
    `).join("");
    wrap.querySelectorAll("button[data-i]").forEach(b => b.onclick = (e) => {
      this.state.agenda.splice(+e.target.dataset.i, 1);
      this.renderActs(root);
    });
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🌅", "Henüz toplantı yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.team || "")} - ${UI.escape(it.date || "")}</div>
          <div class="li-sub">${UI.escape(it.leader || "")} • ${it.headcount || 0} kişi • ${(it.agenda || []).length} aksiyon</div>
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
      this.state.agenda = [...(it.agenda || [])];
      ["date", "time", "team", "leader", "headcount", "yestOutput", "yestTarget", "scrap",
       "downtime", "priorities", "todayTarget", "safety", "quality", "blockers"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] ?? "";
      });
      this.renderActs(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    this.state.agenda = [];
    ["date", "team", "leader", "priorities", "safety", "quality", "blockers"].forEach(k => root.querySelector("#" + k).value = "");
    root.querySelector("#time").value = "08:00";
    ["headcount", "yestOutput", "yestTarget", "scrap", "downtime", "todayTarget"].forEach(k => root.querySelector("#" + k).value = 0);
    this.renderActs(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const team = root.querySelector("#team").value.trim();
    if (!team) { UI.toast("Ekip adı gerekli", "danger"); return; }
    const data = { team, agenda: this.state.agenda };
    ["date", "time", "leader", "headcount", "yestOutput", "yestTarget", "scrap",
     "downtime", "priorities", "todayTarget", "safety", "quality", "blockers"].forEach(k =>
      data[k] = root.querySelector("#" + k).value);
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const withBlocker = records.filter(r => r.blockers && r.blockers.trim().length > 3).length;
    const blockerRatio = (withBlocker / records.length) * 100;
    const totalActions = records.reduce((s, r) => s + ((r.agenda || []).length), 0);
    const avgActions = totalActions / records.length;
    insights.push(Analyze.insight("info", `${records.length} Asakai, ${totalActions} aksiyon`, `Ortalama ${avgActions.toFixed(1)} aksiyon/toplantı. Engelli toplantı: ${withBlocker} (%${blockerRatio.toFixed(0)})`));
    text.push(`asakai=${records.length}, actions=${totalActions}, blockers=${withBlocker}`);
    if (avgActions < 1) insights.push(Analyze.insight("warn", "Aksiyon üretimi düşük", "Asakai'nin çıktısı aksiyondur — her toplantıdan en az 1 net aksiyon hedefleyin."));
    if (blockerRatio > 60) insights.push(Analyze.insight("danger", `%${blockerRatio.toFixed(0)} toplantıda engel var`, "Tekrar eden engeller yapısaldır — yöneticiye eskale edin ve RCA uygulayın."));
    const perfCount = records.filter(r => +r.yestTarget > 0 && +r.yestOutput >= 0).length;
    if (perfCount > 0) {
      const underTarget = records.filter(r => +r.yestTarget > 0 && +r.yestOutput < +r.yestTarget).length;
      const hitRatio = ((perfCount - underTarget) / perfCount) * 100;
      if (hitRatio < 70) insights.push(Analyze.insight("warn", `Hedef tutturma: %${hitRatio.toFixed(0)}`, "Kapasite/Takt/Heijunka planlarını gözden geçirin."));
      else insights.push(Analyze.insight("success", `Hedef tutturma: %${hitRatio.toFixed(0)}`, "İstikrarlı performans — standartlaştırın."));
    }
    const oversized = records.filter(r => r.headcount && +r.headcount > 10).length;
    if (oversized > 0) insights.push(Analyze.insight("info", `${oversized} toplantıda 10+ katılımcı`, "Asakai 5-15 dakika içinde, en fazla 10 kişi ile yapılmalıdır. Büyük gruplarda hat/vardiya bazında bölün."));
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("🌅", "Asakai kaydedin, analiz otomatik çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "Asakai Otomatik Analizi", "", a.insights.join(""));
  }
};
