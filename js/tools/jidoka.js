const Jidoka = {
  KEY: "jidoka",
  state: { editingId: null },
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("🤖", "Jidoka (Otonomasyon)", "Makineye akıl: Anomali algılandığında otomatik durdurma. Dur-Düzelt-Devam et!")}

      <div class="card">
        <h3>📝 Jidoka Olay Kaydı</h3>
        <div class="field"><label>Başlık / Özet</label><input id="title" placeholder="Ör: Boya tabancası tıkandı"></div>
        <div class="grid-2">
          <div class="field"><label>Makine / Hat</label><input id="machine"></div>
          <div class="field"><label>Tarih / Saat</label><input id="datetime" type="datetime-local"></div>
        </div>
        <div class="field"><label>Algılanan Anomali</label><textarea id="anomaly" placeholder="Sensörler / operatör ne algıladı?"></textarea></div>
        <div class="field"><label>Otomatik Aksiyon</label><textarea id="autoAction" placeholder="Sistem ne yaptı? (Dur, Andon çek, vb.)"></textarea></div>
        <div class="field"><label>Kök Neden</label><textarea id="cause"></textarea></div>
        <div class="field"><label>Düzeltme</label><textarea id="fix"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Duruş Süresi (dk)</label><input id="downtime" type="number" value="0"></div>
          <div class="field"><label>Etkilenen Adet</label><input id="affected" type="number" value="0"></div>
        </div>
        <div class="field"><label>Durum</label>
          <select id="status">
            <option value="open">Açık</option>
            <option value="investigating">İnceleniyor</option>
            <option value="resolved">Çözüldü</option>
          </select>
        </div>
        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📋 Olaylar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🤖", "Henüz olay yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)} <span class="badge ${it.status === 'resolved' ? 'success' : it.status === 'investigating' ? 'warn' : 'danger'}">${it.status}</span></div>
          <div class="li-sub">${UI.escape(it.machine || "")} • ⏱️ ${it.downtime || 0} dk • Etkilenen: ${it.affected || 0}</div>
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
      ["title", "machine", "datetime", "anomaly", "autoAction", "cause", "fix", "downtime", "affected", "status"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] || "";
      });
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    ["title", "machine", "datetime", "anomaly", "autoAction", "cause", "fix"].forEach(k => root.querySelector("#" + k).value = "");
    root.querySelector("#downtime").value = 0;
    root.querySelector("#affected").value = 0;
    root.querySelector("#status").value = "open";
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const d = { title };
    ["machine", "datetime", "anomaly", "autoAction", "cause", "fix", "downtime", "affected", "status"].forEach(k =>
      d[k] = root.querySelector("#" + k).value);
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, d);
    else Storage.add(this.KEY, d);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
