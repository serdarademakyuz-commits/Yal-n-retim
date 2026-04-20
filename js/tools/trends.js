/* Trend charts — OEE / Takt / 5S / Kaizen savings time series */
const Trends = {
  render(root) {
    const oee = this.series("oee", r => (+r.oee || 0) * 100);
    const fives = this.series("fives", r => {
      if (typeof r.total === "number") return r.total * 5;
      if (typeof r.score === "number") return r.score;
      return null;
    });
    const taktSeries = this.series("takt", r => +r.taktSec || null);
    const kaizenROI = this.cumulative("kaizen", r => +r.costSave || 0);

    root.innerHTML = `
      ${UI.hero("📈", "Trend Grafikleri", "Zaman içinde KPI'ların gelişimi — müşteriye ilerlemeyi göstermek için kritik.")}

      <div class="card">
        <h3>📊 OEE Trendi</h3>
        <div id="oeeChart"></div>
      </div>

      <div class="card">
        <h3>✅ 5S Skor Trendi</h3>
        <div id="fivesChart"></div>
      </div>

      <div class="card">
        <h3>⏱️ Takt Süresi Trendi</h3>
        <div id="taktChart"></div>
      </div>

      <div class="card">
        <h3>💰 Kümülatif Kaizen Tasarruf (TL/ay)</h3>
        <div id="kaizenChart"></div>
      </div>
    `;

    this.drawChart(root.querySelector("#oeeChart"), oee, { unit: "%", target: 85, color: "#0a2540" });
    this.drawChart(root.querySelector("#fivesChart"), fives, { unit: "%", target: 80, color: "#16a34a" });
    this.drawChart(root.querySelector("#taktChart"), taktSeries, { unit: "sn", color: "#f59e0b", lowerBetter: true });
    this.drawChart(root.querySelector("#kaizenChart"), kaizenROI, { unit: "₺/ay", color: "#16a34a" });
  },

  series(key, extract) {
    const list = Storage.getAll(key) || [];
    const pts = [];
    list.forEach(r => {
      const v = extract(r);
      if (v == null || isNaN(v)) return;
      const t = r.createdAt || r.updatedAt;
      pts.push({ t: t ? new Date(t).getTime() : 0, v: +v, label: t ? new Date(t).toLocaleDateString("tr-TR") : "" });
    });
    pts.sort((a, b) => a.t - b.t);
    return pts;
  },

  cumulative(key, extract) {
    const list = Storage.getAll(key) || [];
    const pts = [];
    let running = 0;
    list.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)).forEach(r => {
      const v = extract(r);
      if (v == null || isNaN(v)) return;
      running += +v;
      const t = r.createdAt || r.updatedAt;
      pts.push({ t: t ? new Date(t).getTime() : 0, v: running, label: t ? new Date(t).toLocaleDateString("tr-TR") : "" });
    });
    return pts;
  },

  drawChart(container, pts, opts) {
    opts = opts || {};
    if (!pts || !pts.length) {
      container.innerHTML = UI.emptyState("📊", "Bu araçta henüz veri yok.");
      return;
    }
    const w = 600, h = 200, pad = 36;
    const values = pts.map(p => p.v);
    let min = Math.min(...values), max = Math.max(...values);
    if (opts.target != null) { max = Math.max(max, opts.target); min = Math.min(min, 0); }
    if (min === max) { min = min - 1; max = max + 1; }
    const range = max - min;
    min -= range * 0.1; max += range * 0.1;
    const xs = pts.map((_, i) => pad + (i * (w - 2 * pad)) / Math.max(1, pts.length - 1));
    const y = v => h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
    const path = pts.map((p, i) => (i ? "L" : "M") + xs[i].toFixed(1) + "," + y(p.v).toFixed(1)).join(" ");
    const points = pts.map((p, i) => `<circle cx="${xs[i].toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3" fill="${opts.color}"><title>${p.label}: ${p.v.toFixed(2)} ${opts.unit || ""}</title></circle>`).join("");
    const targetLine = opts.target != null
      ? `<line x1="${pad}" x2="${w - pad}" y1="${y(opts.target)}" y2="${y(opts.target)}" stroke="#dc2626" stroke-width="1" stroke-dasharray="4 3"/>
         <text x="${w - pad}" y="${y(opts.target) - 3}" text-anchor="end" font-size="10" fill="#dc2626">Hedef ${opts.target}${opts.unit || ""}</text>` : "";
    const first = pts[0], last = pts[pts.length - 1];
    const delta = last.v - first.v;
    const deltaLabel = (opts.lowerBetter ? (delta < 0 ? "✅" : "⚠️") : (delta > 0 ? "✅" : "⚠️")) + " " +
                       (delta > 0 ? "+" : "") + delta.toFixed(2) + (opts.unit || "");

    container.innerHTML = `
      <div class="spc-chart">
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;max-height:240px;background:#fff;border:1px solid var(--border);border-radius:8px">
          ${targetLine}
          <path d="${path}" fill="none" stroke="${opts.color}" stroke-width="2"/>
          ${points}
          <text x="${pad}" y="${pad - 6}" font-size="10" fill="#64748b">${first.label}</text>
          <text x="${w - pad}" y="${pad - 6}" text-anchor="end" font-size="10" fill="#64748b">${last.label}</text>
          <text x="${pad}" y="${y(max)}" font-size="10" fill="#64748b">${max.toFixed(1)}</text>
          <text x="${pad}" y="${y(min) + 10}" font-size="10" fill="#64748b">${min.toFixed(1)}</text>
        </svg>
        <div style="margin-top:6px;display:flex;justify-content:space-between;font-size:12px">
          <span>İlk: ${first.v.toFixed(2)} ${opts.unit || ""}</span>
          <span>Son: ${last.v.toFixed(2)} ${opts.unit || ""}</span>
          <strong>${deltaLabel}</strong>
        </div>
      </div>
    `;
  }
};
