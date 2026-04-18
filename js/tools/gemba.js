const Gemba = {
  KEY: "gemba",
  state: { editingId: null, observations: [] },
  render(root) {
    this.state.editingId = null;
    this.state.observations = [];
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
        <h3>📝 Sonuç ve Aksiyon</h3>
        <textarea id="summary" placeholder="Genel özet, öğrenilenler, alınacak aksiyonlar"></textarea>
        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

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
    this.renderObs(root);
    this.renderList(root);
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
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.area || "")} - ${UI.escape(it.focus || "")}</div>
          <div class="li-sub">${UI.escape(it.date || "")} ${UI.escape(it.time || "")} • ${UI.escape(it.walker || "")}</div>
          <div class="li-sub">${(it.observations || []).length} gözlem</div>
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
      this.state.observations = [...(it.observations || [])];
      ["date", "time", "area", "walker", "participants", "focus", "summary"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] || "";
      });
      this.renderObs(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    this.state.observations = [];
    ["date", "time", "area", "walker", "participants", "summary"].forEach(k => root.querySelector("#" + k).value = "");
    this.renderObs(root);
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
      observations: this.state.observations
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
