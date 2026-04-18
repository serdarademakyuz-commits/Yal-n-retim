const Kanban = {
  KEY: "kanban",
  state: { editingId: null },
  COLS: [
    { k: "todo",  n: "📥 Yapılacak", c: "" },
    { k: "doing", n: "🔄 Devam Ediyor", c: "doing" },
    { k: "done",  n: "✅ Tamamlandı", c: "done" }
  ],
  render(root) {
    this.state.editingId = null;
    root.innerHTML = `
      ${UI.hero("🃏", "Kanban Panosu", "Çekme sistemi ile akışı görsel yönetin. WIP limitlerinize dikkat edin.")}

      <div class="card">
        <h3>➕ Kart Ekle</h3>
        <div class="field"><label>Başlık</label><input id="title" placeholder="Ör: Makine bakımı"></div>
        <div class="field"><label>Açıklama</label><textarea id="desc" placeholder="Detaylar"></textarea></div>
        <div class="grid-3">
          <div class="field"><label>Sorumlu</label><input id="owner"></div>
          <div class="field"><label>Öncelik</label>
            <select id="priority">
              <option value="low">🟢 Düşük</option>
              <option value="med" selected>🟡 Orta</option>
              <option value="high">🔴 Yüksek</option>
            </select>
          </div>
          <div class="field"><label>Sütun</label>
            <select id="col">
              ${this.COLS.map(c => `<option value="${c.k}">${c.n}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>🃏 Pano</h3>
        <div class="kanban-board" id="board"></div>
      </div>
    `;
    this.renderBoard(root);
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
  },
  renderBoard(root) {
    const board = root.querySelector("#board");
    const list = Storage.getAll(this.KEY);
    board.innerHTML = this.COLS.map(c => {
      const cards = list.filter(x => (x.col || "todo") === c.k);
      return `
        <div class="kanban-col ${c.c}" data-col="${c.k}">
          <h4>${c.n}<br><small>(${cards.length})</small></h4>
          ${cards.map(card => `
            <div class="kanban-card ${card.priority === 'high' ? 'high' : card.priority === 'med' ? 'med' : 'low'}" data-id="${card.id}">
              <div class="k-title">${UI.escape(card.title)}</div>
              <div class="k-meta">${UI.escape(card.owner || "")} ${card.priority === 'high' ? '🔴' : card.priority === 'med' ? '🟡' : '🟢'}</div>
              <div class="k-actions">
                ${c.k !== "todo" ? `<button class="btn btn-outline" data-move="prev">←</button>` : ''}
                ${c.k !== "done" ? `<button class="btn btn-primary" data-move="next">→</button>` : ''}
                <button class="btn btn-outline" data-action="edit">✏️</button>
                <button class="btn btn-danger" data-action="del">🗑️</button>
              </div>
            </div>
          `).join("") || '<small style="color:var(--muted);padding:8px;display:block;text-align:center">Boş</small>'}
        </div>
      `;
    }).join("");

    board.querySelectorAll(".kanban-card").forEach(card => {
      const id = card.dataset.id;
      card.querySelectorAll("[data-move]").forEach(b => b.onclick = (e) => {
        e.stopPropagation();
        const dir = e.target.dataset.move;
        const it = Storage.getOne(this.KEY, id);
        const idx = this.COLS.findIndex(c => c.k === (it.col || "todo"));
        const ni = dir === "next" ? Math.min(idx + 1, this.COLS.length - 1) : Math.max(idx - 1, 0);
        Storage.update(this.KEY, id, { col: this.COLS[ni].k });
        this.renderBoard(root);
      });
      card.querySelector("[data-action=del]").onclick = () => {
        if (UI.confirm("Kart silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.renderBoard(root); }
      };
      card.querySelector("[data-action=edit]").onclick = () => {
        const it = Storage.getOne(this.KEY, id);
        this.state.editingId = id;
        root.querySelector("#title").value = it.title || "";
        root.querySelector("#desc").value = it.desc || "";
        root.querySelector("#owner").value = it.owner || "";
        root.querySelector("#priority").value = it.priority || "med";
        root.querySelector("#col").value = it.col || "todo";
        root.querySelector("#saveBtn").textContent = "💾 Güncelle";
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    root.querySelector("#title").value = "";
    root.querySelector("#desc").value = "";
    root.querySelector("#owner").value = "";
    root.querySelector("#priority").value = "med";
    root.querySelector("#col").value = "todo";
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const data = {
      title,
      desc: root.querySelector("#desc").value,
      owner: root.querySelector("#owner").value,
      priority: root.querySelector("#priority").value,
      col: root.querySelector("#col").value
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kart kaydedildi", "success");
    this.clearForm(root);
    this.renderBoard(root);
  }
};
