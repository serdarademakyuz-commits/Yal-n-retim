const Kanban = {
  KEY: "kanban",
  WIP_KEY: "kanban_wip",
  state: { editingId: null },
  COLS: [
    { k: "todo",  n: "📥 Yapılacak", c: "" },
    { k: "doing", n: "🔄 Devam Ediyor", c: "doing" },
    { k: "done",  n: "✅ Tamamlandı", c: "done" }
  ],
  getWIP() {
    try { return JSON.parse(localStorage.getItem(this.WIP_KEY)) || { todo: 0, doing: 3, done: 0 }; }
    catch { return { todo: 0, doing: 3, done: 0 }; }
  },
  setWIP(w) { localStorage.setItem(this.WIP_KEY, JSON.stringify(w)); },
  render(root) {
    this.state.editingId = null;
    const wip = this.getWIP();
    root.innerHTML = `
      ${UI.hero("🃏", "Kanban Panosu", "Çekme sistemi ile akışı görsel yönetin. WIP limitleri dengeli akışı sağlar.")}

      <div class="card">
        <h3>🧮 Kanban Kart Sayısı Hesaplama</h3>
        <small style="color:var(--muted);display:block;margin-bottom:8px">
          N = ⌈(D × L × (1 + S)) ÷ C⌉ — D: günlük talep, L: temin süresi (gün), S: emniyet faktörü, C: konteyner kapasitesi
        </small>
        <div class="grid-2">
          <div class="field"><label>Günlük Talep (D)</label><input id="kD" type="number" min="0" value="500"></div>
          <div class="field"><label>Temin Süresi - gün (L)</label><input id="kL" type="number" step="0.1" min="0" value="2"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Emniyet Faktörü (S)</label><input id="kS" type="number" step="0.01" min="0" max="1" value="0.2"></div>
          <div class="field"><label>Konteyner Kapasitesi (C)</label><input id="kC" type="number" min="1" value="50"></div>
        </div>
        <button class="btn btn-primary btn-block" id="calcKanban">🧮 Kart Sayısını Hesapla</button>
        <div id="kanbanResult" style="margin-top:10px"></div>
      </div>

      <div class="card">
        <h3>🚦 WIP Limitleri</h3>
        <small style="color:var(--muted);display:block;margin-bottom:8px">0 = limitsiz. "Devam Ediyor" kolonunu mutlaka sınırlayın (Little Yasası: WIP = Throughput × Lead Time).</small>
        <div class="grid-3">
          <div class="field"><label>📥 Yapılacak</label><input id="wipTodo" type="number" min="0" value="${wip.todo}"></div>
          <div class="field"><label>🔄 Devam</label><input id="wipDoing" type="number" min="0" value="${wip.doing}"></div>
          <div class="field"><label>✅ Tamam</label><input id="wipDone" type="number" min="0" value="${wip.done}"></div>
        </div>
        <button class="btn btn-outline btn-block" id="saveWip">💾 WIP Limitlerini Kaydet</button>
      </div>

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
    root.querySelector("#calcKanban").onclick = () => this.calcKanban(root);
    root.querySelector("#saveWip").onclick = () => {
      const w = {
        todo: +root.querySelector("#wipTodo").value || 0,
        doing: +root.querySelector("#wipDoing").value || 0,
        done: +root.querySelector("#wipDone").value || 0
      };
      this.setWIP(w);
      UI.toast("WIP limitleri kaydedildi", "success");
      this.renderBoard(root);
    };
  },
  calcKanban(root) {
    const D = +root.querySelector("#kD").value;
    const L = +root.querySelector("#kL").value;
    const S = +root.querySelector("#kS").value;
    const C = +root.querySelector("#kC").value;
    if (D <= 0 || L <= 0 || C <= 0 || S < 0) {
      UI.toast("Geçerli değerler girin (D, L, C > 0; S ≥ 0)", "danger"); return;
    }
    const rawN = (D * L * (1 + S)) / C;
    const N = Math.ceil(rawN);
    root.querySelector("#kanbanResult").innerHTML = `
      <div class="kpi-grid">
        <div class="kpi amber"><div class="label">Kart Sayısı (N)</div><div class="value">${N}</div><div class="sub">adet</div></div>
        <div class="kpi success"><div class="label">Toplam Kapasite</div><div class="value">${N * C}</div><div class="sub">parça</div></div>
        <div class="kpi"><div class="label">Emniyet Stoğu</div><div class="value">${(D * L * S).toFixed(0)}</div><div class="sub">parça</div></div>
        <div class="kpi danger"><div class="label">Normal İhtiyaç</div><div class="value">${(D * L).toFixed(0)}</div><div class="sub">parça</div></div>
      </div>
      <div class="list-item" style="margin-top:8px"><div class="li-main">
        <div class="li-title">📐 Formül</div>
        <div class="li-sub">N = ⌈(D × L × (1 + S)) ÷ C⌉</div>
        <div class="li-sub">= ⌈(${D} × ${L} × ${(1 + S).toFixed(2)}) ÷ ${C}⌉</div>
        <div class="li-sub">= ⌈${rawN.toFixed(2)}⌉ = <strong>${N} kart</strong></div>
      </div></div>
    `;
  },
  renderBoard(root) {
    const board = root.querySelector("#board");
    const list = Storage.getAll(this.KEY);
    const wip = this.getWIP();
    board.innerHTML = this.COLS.map(c => {
      const cards = list.filter(x => (x.col || "todo") === c.k);
      const limit = wip[c.k] || 0;
      const over = limit > 0 && cards.length > limit;
      const atLimit = limit > 0 && cards.length === limit;
      const wipLabel = limit > 0
        ? `<small style="color:${over ? 'var(--danger)' : atLimit ? 'var(--amber)' : 'var(--muted)'};font-weight:700">WIP: ${cards.length}/${limit}${over ? ' ⚠️ AŞILDI' : atLimit ? ' 🔒 DOLU' : ''}</small>`
        : `<small style="color:var(--muted)">(${cards.length})</small>`;
      return `
        <div class="kanban-col ${c.c}" data-col="${c.k}" style="${over ? 'border-color:var(--danger);border-width:2px' : ''}">
          <h4>${c.n}<br>${wipLabel}</h4>
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
        const targetCol = this.COLS[ni].k;
        const targetCount = Storage.getAll(this.KEY).filter(x => (x.col || "todo") === targetCol && x.id !== id).length;
        const limit = this.getWIP()[targetCol] || 0;
        if (limit > 0 && targetCount >= limit) {
          if (!UI.confirm(`⚠️ WIP limiti aşılacak (${targetCount + 1}/${limit}). Yine de taşınsın mı?`)) return;
        }
        Storage.update(this.KEY, id, { col: targetCol });
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
    const col = root.querySelector("#col").value;
    const wip = this.getWIP();
    const limit = wip[col] || 0;
    if (limit > 0 && !this.state.editingId) {
      const current = Storage.getAll(this.KEY).filter(x => (x.col || "todo") === col).length;
      if (current >= limit) {
        if (!UI.confirm(`⚠️ "${col}" kolonu WIP limitinde (${current}/${limit}). Yine de eklensin mi?`)) return;
      }
    }
    const data = {
      title,
      desc: root.querySelector("#desc").value,
      owner: root.querySelector("#owner").value,
      priority: root.querySelector("#priority").value,
      col
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kart kaydedildi", "success");
    this.clearForm(root);
    this.renderBoard(root);
  }
};
