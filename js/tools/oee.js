const OEE = {
  KEY: "oee",
  state: { editingId: null },
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    root.innerHTML = `
      ${UI.hero("📊", "OEE / TPM Hesaplayıcı", "Genel Ekipman Verimliliği = Kullanılabilirlik × Performans × Kalite")}

      <div class="card">
        <h3>📝 Veri Girişi</h3>
        <div class="field"><label>Ekipman / Hat</label><input id="machine" placeholder="Ör: CNC-12"></div>
        <div class="grid-2">
          <div class="field"><label>Planlı Üretim Süresi (dk)</label><input id="planned" type="number" min="0" value="480"></div>
          <div class="field"><label>Duruş Süresi (dk)</label><input id="downtime" type="number" min="0" value="60"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>İdeal Çevrim (sn/adet)</label><input id="ideal" type="number" step="0.1" min="0" value="30"></div>
          <div class="field"><label>Toplam Üretim (adet)</label><input id="total" type="number" min="0" value="600"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Kusurlu (adet)</label><input id="defect" type="number" min="0" value="20"></div>
          <div class="field"><label>Hedef OEE (%)</label><input id="target" type="number" min="0" max="100" value="85"></div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" id="calcBtn">🧮 Hesapla</button>
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📈 OEE Sonucu</h3>
        <div id="result"><div class="empty"><div class="empty-icon">📊</div><div>Hesaplamak için "Hesapla"ya basın.</div></div></div>
      </div>

      <div class="card">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;
    root.querySelector("#calcBtn").onclick = () => this.calc(root);
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderList(root);
  },
  calc(root) {
    const planned = +root.querySelector("#planned").value;
    const downtime = +root.querySelector("#downtime").value;
    const ideal = +root.querySelector("#ideal").value;
    const total = +root.querySelector("#total").value;
    const defect = +root.querySelector("#defect").value;
    const target = +root.querySelector("#target").value || 85;

    const runTime = planned - downtime;
    if (runTime <= 0) { UI.toast("Çalışma süresi 0 veya eksi olamaz", "danger"); return null; }
    const availability = runTime / planned;
    const performance = total > 0 ? Math.min((ideal * total) / (runTime * 60), 1) : 0;
    const good = total - defect;
    const quality = total > 0 ? good / total : 0;
    const oee = availability * performance * quality;
    const color = oee >= target / 100 ? "var(--success)" : oee >= 0.6 ? "var(--amber)" : "var(--danger)";
    const pct = (oee * 100).toFixed(1);
    const circ = 2 * Math.PI * 80;
    const dash = circ * oee;

    root.querySelector("#result").innerHTML = `
      <div class="gauge">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" stroke-width="16"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke="${color}" stroke-width="16"
                  stroke-dasharray="${dash} ${circ}" stroke-linecap="round"/>
        </svg>
        <div class="val"><strong>${pct}%</strong><span>OEE</span></div>
      </div>
      <div class="kpi-grid three" style="margin-top:10px">
        <div class="kpi"><div class="label">Kullanılabilirlik</div><div class="value">${(availability*100).toFixed(1)}%</div></div>
        <div class="kpi amber"><div class="label">Performans</div><div class="value">${(performance*100).toFixed(1)}%</div></div>
        <div class="kpi success"><div class="label">Kalite</div><div class="value">${(quality*100).toFixed(1)}%</div></div>
      </div>
      <div class="list-item" style="margin-top:8px">
        <div class="li-main">
          <div class="li-title">📐 Detay</div>
          <div class="li-sub">Çalışma: ${runTime} dk • İyi ürün: ${good} • Kusur: ${defect}</div>
          <div class="li-sub">Dünya klası: OEE ≥ 85% • Tipik: 40-60%</div>
          <div class="li-sub">🎯 Hedef: ${target}% → ${oee*100 >= target ? "✅ Başarıldı" : "❌ Hedefin altında"}</div>
        </div>
      </div>
    `;
    return { planned, downtime, ideal, total, defect, target, runTime, availability, performance, quality, oee };
  },
  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("📊", "Henüz OEE kaydı yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.machine)}</div>
          <div class="li-sub">OEE: <strong>${(it.oee*100).toFixed(1)}%</strong> • ${UI.fmtDate(it.updatedAt)}</div>
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
      root.querySelector("#machine").value = it.machine;
      ["planned", "downtime", "ideal", "total", "defect", "target"].forEach(k => {
        const el = root.querySelector("#" + k); if (el && it[k] != null) el.value = it[k];
      });
      this.calc(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    root.querySelector("#machine").value = "";
    root.querySelector("#planned").value = 480;
    root.querySelector("#downtime").value = 60;
    root.querySelector("#ideal").value = 30;
    root.querySelector("#total").value = 600;
    root.querySelector("#defect").value = 20;
    root.querySelector("#target").value = 85;
    root.querySelector("#result").innerHTML = "";
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
    UI.toast("Temizlendi");
  },
  save(root) {
    const machine = root.querySelector("#machine").value.trim();
    if (!machine) { UI.toast("Ekipman adı gerekli", "danger"); return; }
    const r = this.calc(root); if (!r) return;
    const data = { machine, ...r };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  }
};
