const Fives = {
  KEY: "fives",
  state: { editingId: null },
  CATS: [
    { k: "seiri",    n: "1S - Seiri (Ayıkla)",       d: "Gereksiz eşyaları ayıkla, sadece gerekli tut" },
    { k: "seiton",   n: "2S - Seiton (Düzenle)",     d: "Her şey için yer, her şey yerinde" },
    { k: "seiso",    n: "3S - Seiso (Temizle)",      d: "Alan ve ekipmanları temiz tut" },
    { k: "seiketsu", n: "4S - Seiketsu (Standartlaştır)", d: "Standartlar oluştur, görselleştir" },
    { k: "shitsuke", n: "5S - Shitsuke (Disiplin)",  d: "Disiplini koru, sürekli iyileştir" }
  ],
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("✅", "5S Denetimi", "İşyeri düzeni ve disiplini için 5 adımlı skorlu denetim.")}

      <div class="card">
        <h3>📝 Denetim Bilgisi</h3>
        <div class="field"><label>Alan / Bölüm</label><input id="area" placeholder="Ör: Hat-1 Montaj"></div>
        <div class="grid-2">
          <div class="field"><label>Denetleyen</label><input id="auditor" placeholder="Ad Soyad"></div>
          <div class="field"><label>Tarih</label><input id="date" type="date"></div>
        </div>
      </div>

      ${this.CATS.map(c => `
        <div class="card">
          <div class="fives-cat">
            <div class="fc-head">
              <span>${c.n}</span>
              <strong id="val-${c.k}">5</strong>
            </div>
            <small style="color:var(--muted)">${c.d}</small>
            <input type="range" min="0" max="10" value="5" id="r-${c.k}" style="margin-top:8px">
            <textarea id="n-${c.k}" placeholder="Bulgular, öneriler" style="margin-top:6px"></textarea>
          </div>
        </div>
      `).join("")}

      <div class="card">
        <h3>📊 Genel Skor</h3>
        <div id="score"></div>
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
    this.CATS.forEach(c => {
      const r = root.querySelector("#r-" + c.k);
      const v = root.querySelector("#val-" + c.k);
      r.oninput = () => { v.textContent = r.value; this.renderScore(root); };
    });
    this.renderScore(root);
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
  },
  renderScore(root) {
    const scores = this.CATS.map(c => +root.querySelector("#r-" + c.k).value);
    const total = scores.reduce((s, x) => s + x, 0);
    const pct = (total / 50) * 100;
    const color = pct >= 80 ? "success" : pct >= 60 ? "amber" : "danger";
    root.querySelector("#score").innerHTML = `
      <div class="kpi-grid">
        <div class="kpi ${color}"><div class="label">Toplam</div><div class="value">${total}/50</div></div>
        <div class="kpi"><div class="label">Yüzde</div><div class="value">${pct.toFixed(0)}%</div></div>
      </div>
      <div class="list-item"><div class="li-main">
        <div class="li-title">${pct >= 80 ? '🏆 Mükemmel' : pct >= 60 ? '👍 İyi - Geliştirilebilir' : '⚠️ Aksiyon Gerekli'}</div>
      </div></div>
    `;
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("✅", "Henüz denetim yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.area)}</div>
          <div class="li-sub">${UI.escape(it.auditor || "")} • ${UI.escape(it.date || "")} • Skor: ${it.total}/50</div>
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
      root.querySelector("#area").value = it.area || "";
      root.querySelector("#auditor").value = it.auditor || "";
      root.querySelector("#date").value = it.date || "";
      this.CATS.forEach(c => {
        const s = (it.scores || {})[c.k] ?? 5;
        root.querySelector("#r-" + c.k).value = s;
        root.querySelector("#val-" + c.k).textContent = s;
        root.querySelector("#n-" + c.k).value = (it.notes || {})[c.k] || "";
      });
      this.renderScore(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    root.querySelector("#area").value = "";
    root.querySelector("#auditor").value = "";
    root.querySelector("#date").value = "";
    this.CATS.forEach(c => {
      root.querySelector("#r-" + c.k).value = 5;
      root.querySelector("#val-" + c.k).textContent = 5;
      root.querySelector("#n-" + c.k).value = "";
    });
    this.renderScore(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const area = root.querySelector("#area").value.trim();
    if (!area) { UI.toast("Alan gerekli", "danger"); return; }
    const scores = {}; const notes = {};
    this.CATS.forEach(c => {
      scores[c.k] = +root.querySelector("#r-" + c.k).value;
      notes[c.k] = root.querySelector("#n-" + c.k).value.trim();
    });
    const total = Object.values(scores).reduce((s, x) => s + x, 0);
    const data = {
      area, auditor: root.querySelector("#auditor").value.trim(),
      date: root.querySelector("#date").value,
      scores, notes, total
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
