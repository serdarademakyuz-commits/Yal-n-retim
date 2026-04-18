const PDCA = {
  KEY: "pdca",
  state: { editingId: null },
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("🔄", "PDCA Döngüsü", "Planla → Uygula → Kontrol Et → Aksiyon Al. Sürekli iyileştirme motoru.")}

      <div class="card">
        <h3>🎯 Konu</h3>
        <div class="field"><label>Başlık</label><input id="title" placeholder="İyileştirme konusu"></div>
        <div class="field"><label>Sorumlu</label><input id="owner" placeholder="Ad Soyad"></div>
      </div>

      <div class="pdca-circle">
        <div class="pdca-quad p"><div class="q-letter">P</div><div class="q-name">PLAN</div></div>
        <div class="pdca-quad d"><div class="q-letter">D</div><div class="q-name">DO</div></div>
        <div class="pdca-quad c"><div class="q-letter">C</div><div class="q-name">CHECK</div></div>
        <div class="pdca-quad a"><div class="q-letter">A</div><div class="q-name">ACT</div></div>
      </div>

      <div class="card"><h3>🟦 P — Planla</h3><textarea id="plan" placeholder="Hedef, kapsam, kaynaklar, metrikler"></textarea></div>
      <div class="card"><h3>🟩 D — Uygula</h3><textarea id="do" placeholder="Yapılan aksiyonlar, deneme"></textarea></div>
      <div class="card"><h3>🟨 C — Kontrol Et</h3><textarea id="check" placeholder="Sonuçlar, ölçümler, hedeften sapma"></textarea></div>
      <div class="card"><h3>🟥 A — Aksiyon Al</h3><textarea id="act" placeholder="Standartlaştırma veya yeni döngü"></textarea></div>

      <div class="field"><label>Döngü Durumu</label>
        <select id="status">
          <option value="plan">Planlama</option>
          <option value="do">Uygulama</option>
          <option value="check">Kontrol</option>
          <option value="act">Aksiyon</option>
          <option value="done">Tamamlandı</option>
        </select>
      </div>

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div class="card" style="margin-top:12px">
        <h3>📋 Kayıtlar (${list.length})</h3>
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
    if (!list.length) { wrap.innerHTML = UI.emptyState("🔄", "Henüz döngü yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)}</div>
          <div class="li-sub">${UI.escape(it.owner || "")} • <span class="badge info">${it.status || "plan"}</span> • ${UI.fmtDate(it.updatedAt)}</div>
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
      ["title", "owner", "plan", "do", "check", "act", "status"].forEach(k => root.querySelector("#" + k).value = it[k] || "");
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    ["title", "owner", "plan", "do", "check", "act"].forEach(k => root.querySelector("#" + k).value = "");
    root.querySelector("#status").value = "plan";
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const d = { title,
      owner: root.querySelector("#owner").value.trim(),
      plan: root.querySelector("#plan").value.trim(),
      do: root.querySelector("#do").value.trim(),
      check: root.querySelector("#check").value.trim(),
      act: root.querySelector("#act").value.trim(),
      status: root.querySelector("#status").value
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, d);
    else Storage.add(this.KEY, d);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
