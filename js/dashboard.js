/* Dashboard — KPI gauges, trends, and mini-charts for the consultant view.
   Pulls live data from all tools and renders SVG visualizations with no external libs. */
const Dashboard = {
  tiles: [
    { r: "why5",       i: "❓", n: "5 Neden" },
    { r: "fishbone",   i: "🐟", n: "Balık Kılçığı" },
    { r: "pareto",     i: "📊", n: "Pareto" },
    { r: "a3",         i: "📋", n: "A3 Rapor" },
    { r: "pdca",       i: "🔄", n: "PDCA" },
    { r: "rca",        i: "🔍", n: "Kök Neden" },
    { r: "fmea",       i: "⚠️", n: "FMEA" },
    { r: "spc",        i: "📉", n: "SPC" },
    { r: "dmaic",      i: "🎯", n: "DMAIC" },
    { r: "hypothesis", i: "🧪", n: "Hipotez Testi" },
    { r: "audit",      i: "📋", n: "Denetim Listeleri" },
    { r: "takt",       i: "⏱️", n: "Takt Zamanı" },
    { r: "oee",        i: "📈", n: "OEE / TPM" },
    { r: "smed",       i: "⚡", n: "SMED" },
    { r: "vsm",        i: "🗺️", n: "VSM" },
    { r: "fives",      i: "✅", n: "5S" },
    { r: "kanban",     i: "🃏", n: "Kanban" },
    { r: "andon",      i: "🚦", n: "Andon" },
    { r: "heijunka",   i: "📦", n: "Heijunka" },
    { r: "kaizen",     i: "💡", n: "Kaizen" },
    { r: "muda",       i: "🗑️", n: "Muda/Mura/Muri" },
    { r: "pokayoke",   i: "🛡️", n: "Poka-Yoke" },
    { r: "jit",        i: "⏳", n: "JIT" },
    { r: "jidoka",     i: "🤖", n: "Jidoka" },
    { r: "sqdcp",      i: "🪪", n: "SQDCP" },
    { r: "gemba",      i: "👣", n: "Gemba" },
    { r: "asakai",     i: "🌅", n: "Asakai" },
    { r: "hoshin",     i: "🧭", n: "Hoshin Kanri" },
    { r: "trends",     i: "📈", n: "Trendler" },
    { r: "consultant", i: "📑", n: "Danışmanlık Raporu" }
  ],

  render(root) {
    const kpis = this.collectKPIs();
    const projName = (typeof Projects !== "undefined" && Projects.getActiveProject) ? Projects.getActiveProject().name : "Genel";
    const nowStr = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
    const sqdcp = this.sqdcpStatus(kpis);
    const execSummary = this.generateExecSummary(kpis);
    const topRisks = this.topFmeaRisks(5);
    const topWins = this.topKaizens(5);
    const priorityActions = this.priorityActions(5);

    root.innerHTML = `
      <div class="exec-bar exec-print">
        <div class="exec-bar-left">
          <div class="exec-label">AKTİF PROJE</div>
          <div class="exec-project">${UI.escape(projName)}</div>
          <div class="exec-sub">${nowStr} · Yönetici Kokpiti</div>
        </div>
        <div class="exec-bar-right">
          <div class="exec-kpis">
            <span class="exec-kpi"><span class="dot" style="background:${this.kpiColor(kpis.oeePct, Targets.get("oee.target"))}"></span>OEE <strong>${kpis.oeePct.toFixed(0)}%</strong></span>
            <span class="exec-kpi"><span class="dot" style="background:${this.kpiColor(kpis.fivesPct, Targets.get("fives.target"))}"></span>5S <strong>${kpis.fivesPct}%</strong></span>
            <span class="exec-kpi"><span class="dot" style="background:${kpis.actionsOverdue===0?"var(--success)":"var(--danger)"}"></span>Gecikme <strong>${kpis.actionsOverdue}</strong></span>
            <span class="exec-kpi"><span class="dot" style="background:${kpis.andonActive===0?"var(--success)":"var(--danger)"}"></span>Andon <strong>${kpis.andonActive}</strong></span>
          </div>
          <button class="btn btn-outline btn-sm" id="printExec" data-no-print>🖨️ Executive Memo</button>
        </div>
      </div>

      <div class="card exec-memo exec-print" id="execMemo">
        <div class="exec-memo-head">
          <h3>📝 Yönetici Özeti</h3>
          <span class="exec-stamp">${nowStr}</span>
        </div>
        <p>${execSummary}</p>
      </div>

      <div class="card xboard-strip exec-print">
        <div class="xboard-head">
          <h3>🏭 SQDCP Stratejik Pusula</h3>
          <div class="xboard-legend">
            <span><span class="lg-dot" style="background:var(--success)"></span>Hedefte</span>
            <span><span class="lg-dot" style="background:var(--amber)"></span>İzleniyor</span>
            <span><span class="lg-dot" style="background:var(--danger)"></span>Risk</span>
          </div>
        </div>
        <div class="xboard-grid">
          ${sqdcp.map(p => {
            const arrow = p.trend === "up" ? "▲" : p.trend === "down" ? "▼" : "▬";
            const trendClass = p.state === "risk"
              ? (p.trend === "down" ? "good" : "bad")
              : p.trend === "up" ? "good" : p.trend === "down" ? "bad" : "flat";
            const targetLabel = p.target != null ? `Hedef: ${p.target}${p.unit || ""}` : "";
            const pctToTarget = p.target != null && p.target !== 0
              ? Math.min(100, Math.max(0, Math.round((p.value / p.target) * 100)))
              : null;
            return `
              <div class="xboard-cell xboard-${p.state}" data-route="sqdcp">
                <div class="sq-top">
                  <div class="sq-light xboard-light-${p.state}"></div>
                  <div class="sq-letter">${p.label.charAt(0)}</div>
                  <div class="sq-title">
                    <div class="sq-label">${p.icon} ${p.label}</div>
                    <div class="sq-sub">${p.note}</div>
                  </div>
                </div>
                <div class="sq-metric">
                  <span class="sq-val">${typeof p.value === "number" ? p.value.toLocaleString("tr-TR") : p.value}</span>
                  <span class="sq-unit">${p.unit || ""}</span>
                  <span class="sq-trend sq-trend-${trendClass}">${arrow}</span>
                </div>
                ${targetLabel ? `<div class="sq-target">
                  <small>${targetLabel}</small>
                  ${pctToTarget != null ? `<div class="sq-bar"><div class="sq-bar-fill xboard-fill-${p.state}" style="width:${pctToTarget}%"></div></div>` : ""}
                </div>` : ""}
                <div class="sq-detail">${p.detail}</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="dash-section">
        <div class="section-head">
          <h3>🎯 Anahtar Performans Göstergeleri</h3>
          <small>Son kayıt · Hedef karşılaştırması</small>
        </div>
        <div class="gauge-grid">
          <div class="gauge-cell" id="gauge-oee"></div>
          <div class="gauge-cell" id="gauge-fives"></div>
          <div class="gauge-cell" id="gauge-quality"></div>
          <div class="gauge-cell" id="gauge-maturity"></div>
        </div>
      </div>

      <div class="dash-section">
        <div class="section-head">
          <h3>📈 Finansal ve Operasyonel Sonuçlar</h3>
          <small>Kaizen tasarrufu · Aksiyon takibi</small>
        </div>
        <div class="grid-2">
          <div class="card">
            <h3>💰 Kaizen Tasarruf Trendi</h3>
            <div id="chart-kaizen"></div>
            <div class="kpi-grid" style="margin-top:10px">
              <div class="kpi success"><div class="label">Toplam Tasarruf</div><div class="value">${(kpis.kaizenTotal).toLocaleString("tr-TR")}₺</div><div class="sub">tüm projeler</div></div>
              <div class="kpi amber"><div class="label">Kaizen Sayısı</div><div class="value">${kpis.kaizenCount}</div><div class="sub">iyileştirme</div></div>
            </div>
          </div>
          <div class="card">
            <h3>🎯 Aksiyon Durumu</h3>
            <div id="chart-actions"></div>
            <div class="kpi-grid" style="margin-top:10px">
              <div class="kpi success"><div class="label">Tamamlanan</div><div class="value">${kpis.actionsDone}</div><div class="sub">kapatıldı</div></div>
              <div class="kpi danger"><div class="label">Geciken</div><div class="value">${kpis.actionsOverdue}</div><div class="sub">tarih aşımı</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="dash-section">
        <div class="section-head">
          <h3>🛡️ Risk ve Kalite Göstergeleri</h3>
          <small>FMEA · Andon · Kontrol</small>
        </div>
        <div class="grid-2">
          <div class="card">
            <h3>⚠️ FMEA Risk Dağılımı</h3>
            <div id="chart-fmea"></div>
          </div>
          <div class="card">
            <h3>🚦 Andon Durumu</h3>
            <div id="chart-andon"></div>
          </div>
        </div>
      </div>

      <div class="dash-section exec-print">
        <div class="section-head">
          <h3>🔥 Yönetici Odak Listesi</h3>
          <small>En kritik riskler · Kazanımlar · Öncelikli aksiyonlar</small>
        </div>
        <div class="grid-3-sm">
          <div class="card focus-card danger-accent">
            <h3>🚨 En Yüksek Riskler (FMEA)</h3>
            ${topRisks.length ? topRisks.map((r, i) => `
              <div class="focus-item">
                <span class="focus-rank">${i+1}</span>
                <div class="focus-main">
                  <div class="focus-title">${UI.escape(r.failureMode)}</div>
                  <div class="focus-sub">${UI.escape(r.process)} · S:${r.S} O:${r.O} D:${r.D}</div>
                </div>
                <span class="focus-metric danger">${r.rpn}</span>
              </div>
            `).join("") : `<div class="focus-empty">FMEA verisi yok</div>`}
          </div>
          <div class="card focus-card success-accent">
            <h3>💎 En Büyük Kaizen Kazanımları</h3>
            ${topWins.length ? topWins.map((k, i) => `
              <div class="focus-item">
                <span class="focus-rank">${i+1}</span>
                <div class="focus-main">
                  <div class="focus-title">${UI.escape(k.title || k.problem || "Kaizen")}</div>
                  <div class="focus-sub">${UI.escape(k.area || "")}</div>
                </div>
                <span class="focus-metric success">${(+k.costSave || 0).toLocaleString("tr-TR")}₺</span>
              </div>
            `).join("") : `<div class="focus-empty">Kaizen kaydı yok</div>`}
          </div>
          <div class="card focus-card warn-accent">
            <h3>⏰ Öncelikli Aksiyonlar</h3>
            ${priorityActions.length ? priorityActions.map((a, i) => `
              <div class="focus-item">
                <span class="focus-rank">${i+1}</span>
                <div class="focus-main">
                  <div class="focus-title">${UI.escape(a.title || a.what || "Aksiyon")}</div>
                  <div class="focus-sub">${UI.escape(a.owner || "")} · ${UI.escape(a.due || "")}</div>
                </div>
                <span class="focus-metric ${a.overdue ? 'danger' : 'warn'}">${a.overdue ? '⏱️ Gecikmiş' : 'Açık'}</span>
              </div>
            `).join("") : `<div class="focus-empty">Açık aksiyon yok</div>`}
          </div>
        </div>
      </div>

      <div class="dash-section">
        <div class="section-head">
          <h3>📊 Araç Kullanım Analitiği</h3>
          <small>Son 6 ay · En çok kullanılan 10 araç</small>
        </div>
        <div class="card">
          <div id="chart-usage"></div>
        </div>
      </div>

      <div class="dash-section">
        <div class="section-head">
          <h3>🧭 Araç Bazlı Performans Panelleri</h3>
          <small>Her aracın kayıt yoğunluğu ve durumu</small>
        </div>
        <div class="card" style="padding:10px">
          <div id="allToolDashboards" class="all-tool-dashboards"></div>
        </div>
      </div>

      <div class="card">
        <h3>⚡ Hızlı Erişim</h3>
        <div class="btn-row">
          <button class="btn btn-danger" data-route="andon">🚦 Acil Andon</button>
          <button class="btn btn-accent" data-route="kaizen">💡 Kaizen</button>
          <button class="btn btn-primary" data-route="gemba">👣 Gemba</button>
          <button class="btn btn-success" data-route="asakai">🌅 Asakai</button>
          <button class="btn btn-outline" data-route="consultant">📑 Danışmanlık Raporu</button>
        </div>
      </div>

      <div class="card">
        <h3>🧰 Tüm Araçlar (${this.tiles.length})</h3>
        <div class="tile-grid">
          ${this.tiles.map(t => `
            <button class="tile" data-route="${t.r}">
              <div class="t-ico">${t.i}</div>
              <div class="t-label">${t.n}</div>
              <div class="t-sub">${Storage.getAll(t.r).length} kayıt</div>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="card">
        <h3>📌 Son Etkinlikler</h3>
        <div id="recentFeed"></div>
      </div>
    `;

    this.drawGauge(root.querySelector("#gauge-oee"), kpis.oeePct, { label: "OEE", target: Targets.get("oee.target"), unit: "%", source: kpis.oeeSource });
    this.drawGauge(root.querySelector("#gauge-fives"), kpis.fivesPct, { label: "5S Skoru", target: Targets.get("fives.target"), unit: "%", source: kpis.fivesSource });
    this.drawGauge(root.querySelector("#gauge-quality"), kpis.qualityPct, { label: "Kalite", target: Targets.get("quality.target"), unit: "%", source: kpis.qualitySource });
    this.drawGauge(root.querySelector("#gauge-maturity"), kpis.maturity, { label: "Yalın Olgunluk", target: Targets.get("maturity.target"), unit: "%", source: `${kpis.toolsUsed}/${this.tiles.length} araç` });

    this.drawBarTrend(root.querySelector("#chart-kaizen"), kpis.kaizenMonthly, { color: "#06a77d", unit: "₺" });
    this.drawDonut(root.querySelector("#chart-actions"), [
      { label: "Tamamlanan", value: kpis.actionsDone, color: "#06a77d" },
      { label: "Açık", value: kpis.actionsOpen, color: "#f4a261" },
      { label: "Geciken", value: kpis.actionsOverdue, color: "#d62828" }
    ]);
    this.drawBars(root.querySelector("#chart-fmea"), [
      { label: "Düşük (≤50)", value: kpis.fmeaLow, color: "#06a77d" },
      { label: "Orta (51-100)", value: kpis.fmeaMed, color: "#f4a261" },
      { label: "Yüksek (>100)", value: kpis.fmeaHigh, color: "#d62828" }
    ]);
    this.drawDonut(root.querySelector("#chart-andon"), [
      { label: "Aktif", value: kpis.andonActive, color: "#d62828" },
      { label: "Çözülen", value: kpis.andonResolved, color: "#06a77d" }
    ]);

    const usageData = this.tiles
      .map(t => ({ label: t.n, value: Storage.getAll(t.r).length, color: "#0a2540" }))
      .filter(x => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    this.drawBars(root.querySelector("#chart-usage"), usageData, { showEmpty: true });

    this.renderAllToolDashboards(root);
    this.renderFeed(root);

    const printBtn = root.querySelector("#printExec");
    if (printBtn) printBtn.onclick = () => {
      document.body.classList.add("printing-exec");
      const cleanup = () => {
        document.body.classList.remove("printing-exec");
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);
      setTimeout(() => {
        UI.printPage();
        /* Safari falls back here if afterprint doesn't fire. */
        setTimeout(cleanup, 500);
      }, 50);
    };
  },

  kpiColor(value, target) {
    if (value >= target) return "var(--success)";
    if (value >= target * 0.7) return "var(--amber)";
    return "var(--danger)";
  },

  sqdcpStatus(kpis) {
    const andonRecs = Storage.getAll("andon");
    /* Red Andon in TPS = emergency stop / hat duruşu — used as the safety
       incident signal here. Earlier code filtered by `a.type` which is not
       a field on Andon records (records use `level`), so the "X gün kazasız"
       counter was always silently null. Use the actual schema. */
    const lastSafetyIncident = andonRecs
      .filter(a => a.level === "red")
      .map(a => new Date(a.createdAt || a.updatedAt || 0).getTime())
      .filter(t => isFinite(t) && t > 0)
      .sort((a, b) => b - a)[0];
    const daysSinceSafety = lastSafetyIncident ? Math.floor((Date.now() - lastSafetyIncident) / 86400000) : null;

    const fmeas = Storage.getAll("fmea");
    let maxRpn = 0;
    fmeas.forEach(f => (f.rows || []).forEach(r => {
      const rpn = (+r.S || 0) * (+r.O || 0) * (+r.D || 0);
      if (rpn > maxRpn) maxRpn = rpn;
    }));

    const kaizenTrend = this.monthlyBuckets(Storage.getAll("kaizen"), k => +k.costSave || 0);
    const oeeTrend = Storage.getAll("oee").slice(0, 12).reverse().map(r => ({ value: (r.oee || 0) * 100 }));
    const fivesTrend = Storage.getAll("fives").slice(0, 12).reverse().map(r => ({
      value: typeof r.total === "number" ? (r.total / 20) * 100 : (+r.score || 0)
    }));
    const andonTrend = this.monthlyBuckets(andonRecs, () => 1);
    const actionsClosedTrend = this.monthlyBuckets(
      (typeof Actions !== "undefined" && Actions.collectLinked)
        ? Actions.collectLinked().concat(Storage.getAll("actions")).filter(a => a.status === "done")
        : Storage.getAll("actions").filter(a => a.status === "done"),
      () => 1
    );

    const trendDir = (pts) => {
      if (!pts || pts.length < 2) return "flat";
      const first = pts.slice(0, Math.ceil(pts.length / 2)).reduce((s, p) => s + p.value, 0);
      const last = pts.slice(Math.floor(pts.length / 2)).reduce((s, p) => s + p.value, 0);
      if (last > first * 1.05) return "up";
      if (last < first * 0.95) return "down";
      return "flat";
    };

    const pillar = (key, icon, label, value, target, unit, note, trend, state, detail) => ({
      key, icon, label, value, target, unit, note, trend, state, detail
    });

    const safetyState = kpis.andonActive === 0 ? "ok" : kpis.andonActive <= 2 ? "warn" : "risk";
    const qualityState = kpis.fmeaHigh === 0 ? "ok" : kpis.fmeaHigh <= 3 ? "warn" : "risk";
    const deliveryState = kpis.actionsOverdue === 0 ? "ok" : kpis.actionsOverdue <= 2 ? "warn" : "risk";
    /* Half of yearly kaizen target = "ok" threshold; anything > 0 = "warn" */
    const kaizenYearlyTarget = Targets.get("kaizen.yearlyTarget");
    const costState = kpis.kaizenCount >= kaizenYearlyTarget / 2 ? "ok" : kpis.kaizenCount > 0 ? "warn" : "risk";
    const fivesTarget = Targets.get("fives.target"), fivesAccept = Targets.get("fives.acceptable");
    const peopleState = kpis.fivesPct >= fivesTarget ? "ok" : kpis.fivesPct >= fivesAccept ? "warn" : "risk";

    return [
      pillar("safety", "🦺", "Safety", kpis.andonActive, 0, "olay", "Güvenlik",
        trendDir(andonTrend.map(p => ({ value: -p.value }))),
        safetyState,
        daysSinceSafety != null
          ? (daysSinceSafety === 0 ? "Bugün kırmızı Andon" : `Son kırmızı Andon: ${daysSinceSafety} gün önce`)
          : "Kırmızı Andon kaydı yok"),
      pillar("quality", "🎯", "Quality", maxRpn || 0, 100, "RPN", "Kalite & Risk",
        trendDir(fmeas.length ? [{ value: maxRpn }] : []),
        qualityState,
        `${kpis.fmeaHigh} yüksek, ${kpis.fmeaMed} orta risk`),
      pillar("delivery", "🚚", "Delivery", kpis.actionsOverdue, 0, "gecikme", "Teslimat & Aksiyon",
        trendDir(actionsClosedTrend),
        deliveryState,
        `${kpis.actionsDone}/${kpis.actionsDone + kpis.actionsOpen + kpis.actionsOverdue} kapandı`),
      pillar("cost", "💰", "Cost", Math.round(kpis.kaizenTotal / 1000), null, "k₺/yıl", "Maliyet & Kazanım",
        trendDir(kaizenTrend),
        costState,
        `${kpis.kaizenCount} kaizen · yıllık hedef ${Targets.get("kaizen.yearlyTarget")}`),
      pillar("people", "👥", "People", kpis.fivesPct, Targets.get("fives.target"), "%", "İnsan & 5S",
        trendDir(fivesTrend),
        peopleState,
        `Yalın olgunluk ${kpis.maturity}%`)
    ];
  },

  generateExecSummary(kpis) {
    const parts = [];
    const oeeT = Targets.get("oee.target"), oeeA = Targets.get("oee.acceptable");
    const oeeTxt = kpis.oeePct >= oeeT ? `<strong style="color:var(--success)">hedefe ulaşıldı (${kpis.oeePct.toFixed(0)}% ≥ ${oeeT}%)</strong>`
                 : kpis.oeePct >= oeeA ? `<strong style="color:var(--amber)">kabul eşiğinde (${kpis.oeePct.toFixed(0)}%, hedef ${oeeT}%)</strong>`
                 : `<strong style="color:var(--danger)">hedefin altında (${kpis.oeePct.toFixed(0)}%, hedef ${oeeT}%)</strong>`;
    parts.push(`OEE ${oeeTxt}.`);

    if (kpis.kaizenCount > 0) {
      parts.push(`Aktif kaizen portföyünden yıllık <strong>${kpis.kaizenTotal.toLocaleString("tr-TR")}₺</strong> tasarruf sağlandı (${kpis.kaizenCount} iyileştirme).`);
    } else {
      parts.push(`Henüz kaizen kaydı yok — sürekli iyileştirme döngüsü başlatılmalı.`);
    }

    if (kpis.fmeaHigh > 0) {
      parts.push(`<strong style="color:var(--danger)">${kpis.fmeaHigh} yüksek riskli hata modu</strong> acil aksiyon bekliyor.`);
    } else if (kpis.fmeaMed > 0) {
      parts.push(`${kpis.fmeaMed} orta seviye risk izleniyor.`);
    }

    if (kpis.actionsOverdue > 0) {
      parts.push(`<strong style="color:var(--danger)">${kpis.actionsOverdue} aksiyon tarih aşımında</strong> — sorumluları gündeme al.`);
    } else if (kpis.actionsOpen > 0) {
      parts.push(`${kpis.actionsOpen} açık aksiyon plan dahilinde ilerliyor.`);
    }

    if (kpis.andonActive > 0) {
      parts.push(`<strong style="color:var(--danger)">${kpis.andonActive} aktif Andon sinyali</strong> — saha müdahalesi gerekli.`);
    }

    const maturity = kpis.maturity, mT = Targets.get("maturity.target");
    if (maturity >= mT) parts.push(`Yalın olgunluk <strong style="color:var(--success)">${maturity}% ≥ ${mT}%</strong> — araçların çoğu aktif.`);
    else if (maturity >= mT * 0.55) parts.push(`Yalın olgunluk <strong style="color:var(--amber)">${maturity}%</strong> (hedef ${mT}%) — araç kapsamı genişletilmeli.`);
    else parts.push(`Yalın olgunluk <strong style="color:var(--danger)">${maturity}%</strong> (hedef ${mT}%) — yalın dönüşüm başlangıç aşamasında.`);

    return parts.join(" ");
  },

  topFmeaRisks(n) {
    const out = [];
    Storage.getAll("fmea").forEach(f => {
      (f.rows || []).forEach(r => {
        const rpn = (+r.S || 0) * (+r.O || 0) * (+r.D || 0);
        if (rpn > 0) out.push({ failureMode: r.failureMode || "—", process: r.process || f.title || "—", S: +r.S || 0, O: +r.O || 0, D: +r.D || 0, rpn });
      });
    });
    return out.sort((a, b) => b.rpn - a.rpn).slice(0, n);
  },

  topKaizens(n) {
    return Storage.getAll("kaizen")
      .filter(k => +k.costSave > 0)
      .sort((a, b) => (+b.costSave || 0) - (+a.costSave || 0))
      .slice(0, n);
  },

  priorityActions(n) {
    const today = new Date().toISOString().slice(0, 10);
    const actions = (typeof Actions !== "undefined" && Actions.collectLinked)
      ? Actions.collectLinked().concat(Storage.getAll("actions"))
      : Storage.getAll("actions");
    return actions
      .filter(a => a.status !== "done")
      .map(a => ({ ...a, overdue: a.due && a.due < today }))
      .sort((a, b) => {
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
        return (a.due || "").localeCompare(b.due || "");
      })
      .slice(0, n);
  },

  renderAllToolDashboards(root) {
    const wrap = root.querySelector("#allToolDashboards");
    if (!wrap) return;
    const now = new Date();
    const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const cards = this.tiles.map(t => {
      const records = Storage.getAll(t.r) || [];
      let cntMonth = 0, cntWeek = 0, cntClosed = 0;
      const buckets = {};
      records.forEach(r => {
        const ts = r.createdAt || r.updatedAt || "";
        if (ts) {
          const d = new Date(ts);
          const mk = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
          if (mk === thisMonth) cntMonth++;
          if (ts >= sevenDaysAgo) cntWeek++;
          buckets[mk] = (buckets[mk] || 0) + 1;
        }
        if (r.status === "done" || r.status === "resolved" || r.status === "closed") cntClosed++;
      });
      const closedPct = records.length > 0 ? Math.round((cntClosed / records.length) * 100) : 0;
      const series = Object.keys(buckets).sort().slice(-6).map(k => ({ label: k.slice(2), value: buckets[k] }));
      const chart = this.miniBarSVG(series);
      const tone = records.length === 0 ? "empty" : cntWeek > 0 ? "active" : "idle";
      return `
        <div class="atd-card atd-${tone}" data-route="${t.r}">
          <div class="atd-head">
            <span class="atd-ico">${t.i}</span>
            <span class="atd-name">${t.n}</span>
            <span class="atd-total">${records.length}</span>
          </div>
          <div class="atd-stats">
            <div><small>Ay</small><strong>${cntMonth}</strong></div>
            <div><small>7g</small><strong>${cntWeek}</strong></div>
            <div><small>Kapan</small><strong>${closedPct}%</strong></div>
          </div>
          ${chart}
        </div>
      `;
    }).join("");
    wrap.innerHTML = cards;
  },

  miniBarSVG(series) {
    if (!series || !series.length) return `<div class="atd-empty">📭</div>`;
    const w = 120, h = 30, pad = 2;
    const max = Math.max(1, ...series.map(s => s.value));
    const bw = (w - 2 * pad) / series.length;
    const bars = series.map((p, i) => {
      const bh = Math.round((p.value / max) * (h - 2 * pad));
      const x = pad + i * bw + 1;
      const y = h - pad - bh;
      return `<rect x="${x}" y="${y}" width="${(bw - 2).toFixed(1)}" height="${bh}" fill="currentColor" opacity="0.75" rx="1"/>`;
    }).join("");
    return `<svg viewBox="0 0 ${w} ${h}" class="atd-chart" style="width:100%;height:30px;color:var(--navy)">${bars}</svg>`;
  },

  collectKPIs() {
    const oees = Storage.getAll("oee");
    const lastOee = oees[0];
    /* Defensive read: legacy/partial records may lack the `oee` field; treat as 0
       rather than letting `undefined * 100 = NaN` propagate to the exec memo and gauge. */
    const oeeRaw = lastOee && typeof lastOee.oee === "number" ? lastOee.oee : 0;
    const oeePct = +(oeeRaw * 100).toFixed(1);

    const fives = Storage.getAll("fives");
    const lastFives = fives[0];
    let fivesPct = 0;
    if (lastFives) {
      if (typeof lastFives.total === "number") fivesPct = Math.round((lastFives.total / 20) * 100);
      else if (typeof lastFives.score === "number") fivesPct = Math.round(lastFives.score);
    }

    const spc = Storage.getAll("spc");
    let qualityPct = 0;
    if (lastOee && typeof lastOee.quality === "number") qualityPct = +(lastOee.quality * 100).toFixed(1);
    else if (spc.length) qualityPct = 95;

    const toolsUsed = this.tiles.filter(t => Storage.getAll(t.r).length > 0).length;
    const maturity = Math.round((toolsUsed / this.tiles.length) * 100);

    const kaizens = Storage.getAll("kaizen");
    const kaizenTotal = kaizens.reduce((s, k) => s + (+k.costSave || 0), 0);
    const kaizenMonthly = this.monthlyBuckets(kaizens, k => +k.costSave || 0);

    const fmeas = Storage.getAll("fmea");
    let fmeaLow = 0, fmeaMed = 0, fmeaHigh = 0;
    fmeas.forEach(f => (f.rows || []).forEach(r => {
      const rpn = (+r.S || 0) * (+r.O || 0) * (+r.D || 0);
      if (rpn <= 50) fmeaLow++;
      else if (rpn <= 100) fmeaMed++;
      else fmeaHigh++;
    }));

    const andons = Storage.getAll("andon");
    const andonActive = andons.filter(a => a.status !== "resolved").length;
    const andonResolved = andons.filter(a => a.status === "resolved").length;

    const actions = (typeof Actions !== "undefined" && Actions.collectLinked)
      ? Actions.collectLinked().concat(Storage.getAll("actions"))
      : Storage.getAll("actions");
    const today = new Date().toISOString().slice(0, 10);
    let actionsDone = 0, actionsOpen = 0, actionsOverdue = 0;
    actions.forEach(a => {
      if (a.status === "done") actionsDone++;
      else if (a.due && a.due < today) actionsOverdue++;
      else actionsOpen++;
    });

    return {
      oeePct, oeeSource: lastOee ? UI.fmtDate(lastOee.updatedAt) : "—",
      fivesPct, fivesSource: lastFives ? UI.fmtDate(lastFives.updatedAt) : "—",
      qualityPct, qualitySource: lastOee ? "OEE kalite" : spc.length ? "SPC" : "—",
      maturity, toolsUsed,
      kaizenTotal, kaizenCount: kaizens.length, kaizenMonthly,
      fmeaLow, fmeaMed, fmeaHigh,
      andonActive, andonResolved,
      actionsDone, actionsOpen, actionsOverdue
    };
  },

  monthlyBuckets(records, valueFn) {
    const buckets = {};
    records.forEach(r => {
      const t = r.createdAt || r.updatedAt;
      if (!t) return;
      const d = new Date(t);
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      buckets[key] = (buckets[key] || 0) + valueFn(r);
    });
    return Object.keys(buckets).sort().slice(-6).map(k => ({ label: k.slice(2), value: buckets[k] }));
  },

  /* Semi-circular gauge 0-100 with target marker. */
  drawGauge(container, value, opts) {
    if (!container) return;
    opts = opts || {};
    const w = 200, h = 130, cx = w / 2, cy = h - 15, r = 80;
    const v = Math.max(0, Math.min(100, +value || 0));
    const angle = Math.PI * (1 - v / 100);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    const color = v >= (opts.target || 75) ? "#06a77d" : v >= (opts.target || 75) * 0.7 ? "#f4a261" : "#d62828";
    const targetAngle = Math.PI * (1 - (opts.target || 0) / 100);
    const tx1 = cx + (r - 8) * Math.cos(targetAngle), ty1 = cy - (r - 8) * Math.sin(targetAngle);
    const tx2 = cx + (r + 6) * Math.cos(targetAngle), ty2 = cy - (r + 6) * Math.sin(targetAngle);
    const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
    const filledArcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;max-height:150px">
        <path d="${arcPath}" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round"/>
        <path d="${filledArcPath}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>
        <line x1="${tx1.toFixed(1)}" y1="${ty1.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" stroke="#0a2540" stroke-width="2"/>
        <text x="${cx}" y="${cy - 30}" text-anchor="middle" font-size="26" font-weight="800" fill="${color}">${v.toFixed(0)}${opts.unit || "%"}</text>
        <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="11" fill="#64748b">Hedef ${opts.target || "—"}${opts.unit || "%"}</text>
      </svg>
      <div style="text-align:center;font-weight:700;margin-top:-8px">${opts.label || ""}</div>
      <div style="text-align:center;font-size:11px;color:var(--muted)">${opts.source || ""}</div>
    `;
  },

  drawBarTrend(container, pts, opts) {
    if (!container) return;
    opts = opts || {};
    if (!pts || !pts.length) { container.innerHTML = UI.emptyState("📊", "Veri yok."); return; }
    const w = 320, h = 140, pad = 30;
    const max = Math.max(...pts.map(p => p.value), 1);
    const bw = (w - 2 * pad) / pts.length;
    const bars = pts.map((p, i) => {
      const bh = ((p.value / max) * (h - 2 * pad));
      const x = pad + i * bw + 4;
      const y = h - pad - bh;
      return `<g>
        <rect x="${x}" y="${y}" width="${(bw - 8).toFixed(1)}" height="${bh.toFixed(1)}" fill="${opts.color}" rx="2"/>
        <text x="${(x + (bw - 8) / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" font-size="10" text-anchor="middle" fill="#475569">${p.value.toLocaleString("tr-TR")}</text>
        <text x="${(x + (bw - 8) / 2).toFixed(1)}" y="${h - pad + 14}" font-size="10" text-anchor="middle" fill="#64748b">${p.label}</text>
      </g>`;
    }).join("");
    container.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;max-height:180px">
      <line x1="${pad}" x2="${w - pad}" y1="${h - pad}" y2="${h - pad}" stroke="#cbd5e1"/>
      ${bars}
    </svg>`;
  },

  drawBars(container, items, opts) {
    if (!container) return;
    opts = opts || {};
    const total = items.reduce((s, x) => s + x.value, 0);
    if (total === 0) { container.innerHTML = UI.emptyState("📊", "Veri yok."); return; }
    const max = Math.max(...items.map(x => x.value), 1);
    container.innerHTML = items.map(x => {
      const w = Math.round((x.value / max) * 100);
      const pct = total > 0 ? Math.round((x.value / total) * 100) : 0;
      return `<div style="margin:6px 0">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span>${UI.escape(x.label)}</span>
          <strong>${x.value}${opts.showPct === false ? "" : ` <small style="color:var(--muted)">(${pct}%)</small>`}</strong>
        </div>
        <div style="background:#e2e8f0;border-radius:6px;height:12px;overflow:hidden">
          <div style="width:${w}%;height:100%;background:${x.color || "#0a2540"};border-radius:6px;transition:width .3s"></div>
        </div>
      </div>`;
    }).join("");
  },

  drawDonut(container, segments) {
    if (!container) return;
    const total = segments.reduce((s, x) => s + x.value, 0);
    if (total === 0) { container.innerHTML = UI.emptyState("🍩", "Veri yok."); return; }
    const cx = 80, cy = 80, r = 60, rin = 36;
    let acc = 0;
    const paths = segments.filter(s => s.value > 0).map(s => {
      const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += s.value;
      const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      const x3 = cx + rin * Math.cos(end), y3 = cy + rin * Math.sin(end);
      const x4 = cx + rin * Math.cos(start), y4 = cy + rin * Math.sin(start);
      return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${x3.toFixed(1)} ${y3.toFixed(1)} A ${rin} ${rin} 0 ${large} 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z" fill="${s.color}"/>`;
    }).join("");
    const legend = segments.map(s => {
      const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
      return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0;font-size:12px">
        <span style="width:12px;height:12px;background:${s.color};border-radius:3px;display:inline-block"></span>
        <span style="flex:1">${UI.escape(s.label)}</span>
        <strong>${s.value} (${pct}%)</strong>
      </div>`;
    }).join("");
    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <svg viewBox="0 0 160 160" style="width:140px;height:140px">${paths}
          <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="20" font-weight="800" fill="#0a2540">${total}</text>
          <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="10" fill="#64748b">toplam</text>
        </svg>
        <div style="flex:1;min-width:160px">${legend}</div>
      </div>
    `;
  },

  renderFeed(root) {
    const feed = root.querySelector("#recentFeed");
    if (!feed) return;
    const recent = [];
    this.tiles.forEach(t => {
      Storage.getAll(t.r).slice(0, 2).forEach(item => {
        recent.push({
          tool: t.n, icon: t.i, route: t.r,
          title: item.title || item.problem || item.name || item.event || item.issue || item.note || "Kayıt",
          at: item.updatedAt || item.createdAt
        });
      });
    });
    recent.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
    const top = recent.slice(0, 6);
    feed.innerHTML = top.length
      ? top.map(r => `
        <div class="list-item" data-route="${r.route}" style="cursor:pointer">
          <div class="li-main">
            <div class="li-title">${r.icon} ${UI.escape(r.title)}</div>
            <div class="li-sub">${r.tool} • ${UI.fmtDate(r.at)}</div>
          </div>
        </div>
      `).join("")
      : UI.emptyState("📭", "Henüz kayıt yok. Bir araçla başlayın.");
  }
};
