/* SPC — Statistical Process Control. Xbar-R chart + Cp/Cpk process capability */
const SPC = {
  KEY: "spc",
  state: { editingId: null },

  /* Standard SPC factors for Xbar-R chart, indexed by subgroup size n */
  FACTORS: {
    2:  { A2: 1.880, D3: 0, D4: 3.267, d2: 1.128 },
    3:  { A2: 1.023, D3: 0, D4: 2.574, d2: 1.693 },
    4:  { A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 },
    5:  { A2: 0.577, D3: 0, D4: 2.114, d2: 2.326 },
    6:  { A2: 0.483, D3: 0, D4: 2.004, d2: 2.534 },
    7:  { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704 },
    8:  { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847 },
    9:  { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970 },
    10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078 }
  },

  parseSubgroups(text) {
    return text.split(/\n+/).map(line => {
      return line.split(/[,;\t\s]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
    }).filter(row => row.length);
  },

  compute(record) {
    const subs = record.subgroups || [];
    if (!subs.length) return null;
    const n = subs[0].length;
    if (n < 2 || n > 10 || !subs.every(s => s.length === n)) return { error: "Alt grup boyutu 2-10 aralığında ve eşit olmalı" };
    const f = this.FACTORS[n];
    const means = subs.map(s => s.reduce((a, b) => a + b, 0) / s.length);
    const ranges = subs.map(s => Math.max(...s) - Math.min(...s));
    const xbar = means.reduce((a, b) => a + b, 0) / means.length;
    const rbar = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    const UCLx = xbar + f.A2 * rbar;
    const LCLx = xbar - f.A2 * rbar;
    const UCLr = f.D4 * rbar;
    const LCLr = f.D3 * rbar;
    const sigma = rbar / f.d2;
    const USL = parseFloat(record.USL);
    const LSL = parseFloat(record.LSL);
    let Cp = null, Cpk = null, Cpu = null, Cpl = null;
    if (!isNaN(USL) && !isNaN(LSL) && sigma > 0) {
      Cp = (USL - LSL) / (6 * sigma);
      Cpu = (USL - xbar) / (3 * sigma);
      Cpl = (xbar - LSL) / (3 * sigma);
      Cpk = Math.min(Cpu, Cpl);
    }
    const outOfControl = means.some((m, i) => m > UCLx || m < LCLx) ||
                         ranges.some(r => r > UCLr || r < LCLr);
    return { n, means, ranges, xbar, rbar, UCLx, LCLx, UCLr, LCLr, sigma, Cp, Cpk, Cpu, Cpl, outOfControl };
  },

  svgChart(title, values, cl, ucl, lcl) {
    const w = 320, h = 140, pad = 24;
    const min = Math.min(lcl, ...values) - 0.5;
    const max = Math.max(ucl, ...values) + 0.5;
    const xs = values.map((_, i) => pad + (i * (w - 2 * pad)) / Math.max(1, values.length - 1));
    const y = v => h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
    const path = values.map((v, i) => (i ? "L" : "M") + xs[i] + "," + y(v)).join(" ");
    const pts = values.map((v, i) => `<circle cx="${xs[i]}" cy="${y(v)}" r="3" fill="${(v > ucl || v < lcl) ? "#dc2626" : "#0a2540"}"/>`).join("");
    const line = (yv, color, dash) => `<line x1="${pad}" x2="${w - pad}" y1="${y(yv)}" y2="${y(yv)}" stroke="${color}" stroke-width="1" ${dash ? `stroke-dasharray="4 3"` : ""}/>`;
    return `
      <div class="spc-chart">
        <strong>${UI.escape(title)}</strong>
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;max-height:180px;background:#fff;border:1px solid var(--border);border-radius:8px">
          ${line(ucl, "#dc2626", true)}
          ${line(cl,  "#0a2540", false)}
          ${line(lcl, "#dc2626", true)}
          <path d="${path}" fill="none" stroke="#0a2540" stroke-width="1.5"/>
          ${pts}
          <text x="${w - pad}" y="${y(ucl) - 2}" text-anchor="end" font-size="9" fill="#dc2626">UCL ${ucl.toFixed(2)}</text>
          <text x="${w - pad}" y="${y(cl) - 2}"  text-anchor="end" font-size="9" fill="#0a2540">CL ${cl.toFixed(2)}</text>
          <text x="${w - pad}" y="${y(lcl) - 2}" text-anchor="end" font-size="9" fill="#dc2626">LCL ${lcl.toFixed(2)}</text>
        </svg>
      </div>
    `;
  },

  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("📉", "SPC / Kontrol Grafiği", "Xbar-R çizelgesi ve proses yeteneği (Cp / Cpk).")}

      <div class="card">
        <h3>📝 Yeni Ölçüm Seti</h3>
        <div class="field"><label>Başlık</label>
          <input id="title" placeholder="Ör: CNC-2 Mil Çapı">
        </div>
        <div class="field"><label>Karakteristik</label>
          <input id="char" placeholder="Ör: Çap (mm)">
        </div>
        <div class="field"><label>Alt Spek (LSL)</label>
          <input id="LSL" type="number" step="0.001" placeholder="Boş bırakılabilir">
        </div>
        <div class="field"><label>Üst Spek (USL)</label>
          <input id="USL" type="number" step="0.001" placeholder="Boş bırakılabilir">
        </div>
        <div class="field"><label>Alt Gruplar (her satır bir alt grup, 2-10 ölçüm)</label>
          <textarea id="subs" rows="6" placeholder="10.01, 10.02, 10.00, 10.03, 9.99
10.02, 10.01, 10.03, 10.02, 10.01
..."></textarea>
          <small style="color:var(--muted)">Değerleri boşluk veya virgülle ayırın.</small>
        </div>
        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlar (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    this.renderList(root);
    this.renderAnalysis(root);

    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); UI.toast("Form temizlendi"); };
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("📉", "Henüz SPC kaydı yok."); return; }
    wrap.innerHTML = list.map(it => {
      const c = this.compute(it);
      const charts = (c && !c.error)
        ? this.svgChart("X̄ (Ortalama)", c.means, c.xbar, c.UCLx, c.LCLx) +
          this.svgChart("R (Değişim)", c.ranges, c.rbar, c.UCLr, c.LCLr)
        : `<small style="color:var(--danger)">${c ? UI.escape(c.error) : "Grafik üretilemedi"}</small>`;
      const cpk = c && c.Cpk != null ? `Cpk: ${c.Cpk.toFixed(2)}` : "";
      const cp = c && c.Cp != null ? `Cp: ${c.Cp.toFixed(2)}` : "";
      return `
        <div class="list-item" data-id="${it.id}" style="display:block">
          <div class="li-main">
            <div class="li-title">${UI.escape(it.title || "SPC")}</div>
            <div class="li-sub">${UI.escape(it.char || "")} • ${UI.fmtDate(it.updatedAt)}</div>
            <div class="li-sub">${(it.subgroups || []).length} alt grup • ${cp} ${cpk}</div>
          </div>
          ${charts}
          <div class="li-actions">
            <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
            <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
          </div>
        </div>
      `;
    }).join("");

    wrap.querySelectorAll("[data-action=del]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Kayıt silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    wrap.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      root.querySelector("#title").value = it.title || "";
      root.querySelector("#char").value = it.char || "";
      root.querySelector("#LSL").value = it.LSL != null ? it.LSL : "";
      root.querySelector("#USL").value = it.USL != null ? it.USL : "";
      root.querySelector("#subs").value = (it.subgroups || []).map(s => s.join(", ")).join("\n");
      this.state.editingId = it.id;
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  clearForm(root) {
    ["title", "char", "LSL", "USL", "subs"].forEach(id => root.querySelector("#" + id).value = "");
    this.state.editingId = null;
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
  },

  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const subs = this.parseSubgroups(root.querySelector("#subs").value);
    if (!subs.length) { UI.toast("En az bir alt grup girin", "danger"); return; }
    const n = subs[0].length;
    if (n < 2 || n > 10) { UI.toast("Alt grup 2-10 ölçüm içermeli", "danger"); return; }
    if (!subs.every(s => s.length === n)) { UI.toast("Alt gruplar aynı boyutta olmalı", "danger"); return; }
    const data = {
      title,
      char: root.querySelector("#char").value.trim(),
      LSL: root.querySelector("#LSL").value ? parseFloat(root.querySelector("#LSL").value) : null,
      USL: root.querySelector("#USL").value ? parseFloat(root.querySelector("#USL").value) : null,
      subgroups: subs
    };
    if (this.state.editingId) {
      Storage.update(this.KEY, this.state.editingId, data);
      UI.toast("Güncellendi", "success");
    } else {
      Storage.add(this.KEY, data);
      UI.toast("Kaydedildi", "success");
    }
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const insights = [], text = [];
    if (!records.length) return { insights: [Analyze.insight("info", "SPC kaydı yok", "Kritik karakteristikler için ölçümleri girin.")], text: ["Kayıt yok."] };
    const latest = records[records.length - 1];
    const c = this.compute(latest);
    if (!c) return { insights: [Analyze.insight("warn", "Analiz yapılamadı", "Verileri kontrol edin.")], text: ["Veri yok."] };
    if (c.error) return { insights: [Analyze.insight("danger", "Veri hatası", c.error)], text: [c.error] };
    insights.push(Analyze.insight("info", `X̄̄ = ${c.xbar.toFixed(3)}, R̄ = ${c.rbar.toFixed(3)}`, `σ̂ = ${c.sigma.toFixed(3)} (R̄/d₂)`));
    insights.push(Analyze.insight("info", `UCL/LCL (X̄): ${c.UCLx.toFixed(3)} / ${c.LCLx.toFixed(3)}`, `UCL/LCL (R): ${c.UCLr.toFixed(3)} / ${c.LCLr.toFixed(3)}`));
    if (c.outOfControl) insights.push(Analyze.insight("danger", "Proses kontrol dışı", "En az bir nokta kontrol limitlerini aştı — özel sebepleri araştırın."));
    else insights.push(Analyze.insight("success", "Proses kontrol altında", "Tüm noktalar kontrol limitleri içinde."));
    if (c.Cpk != null) {
      let cpkLevel = "danger", label = "Yetersiz yetenek";
      if (c.Cpk >= 1.67) { cpkLevel = "success"; label = "Mükemmel yetenek"; }
      else if (c.Cpk >= 1.33) { cpkLevel = "success"; label = "Yeterli yetenek"; }
      else if (c.Cpk >= 1.00) { cpkLevel = "warn"; label = "Sınırda yetenek"; }
      insights.push(Analyze.insight(cpkLevel, `${label} — Cpk = ${c.Cpk.toFixed(2)}`, `Cp = ${c.Cp.toFixed(2)}, Cpu = ${c.Cpu.toFixed(2)}, Cpl = ${c.Cpl.toFixed(2)}`));
      if (c.Cp && c.Cpk < c.Cp - 0.2) insights.push(Analyze.insight("warn", "Proses ortalaması merkezde değil", "Hedefin merkezine çekin (Cp > Cpk farkı belirgin)."));
    } else {
      insights.push(Analyze.insight("info", "Spek limitleri tanımsız", "Cp/Cpk hesabı için USL ve LSL girin."));
    }
    text.push(`X̄=${c.xbar.toFixed(3)}, R̄=${c.rbar.toFixed(3)}, Cpk=${c.Cpk != null ? c.Cpk.toFixed(2) : "-"}`);
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("📉", "Ölçüm girildiğinde otomatik yorum çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("📉", "SPC Yorumu", "", a.insights.join(""));
  }
};
