/* Hypothesis Testing — t-test (one/two sample), one-way ANOVA, simple linear regression.
   Lightweight stats without external libs; critical values approximated for α=0.05. */
const Hypothesis = {
  KEY: "hypothesis",
  state: { editingId: null },

  TESTS: [
    { k: "t1", n: "Tek Örneklem t-testi", d: "Bir örneklemin ortalamasını hedef değerle karşılaştırır." },
    { k: "t2", n: "İki Örneklem t-testi", d: "İki bağımsız grubun ortalamalarını karşılaştırır." },
    { k: "anova", n: "Tek Yönlü ANOVA", d: "İkiden fazla grubun ortalamalarını karşılaştırır." },
    { k: "reg", n: "Basit Doğrusal Regresyon", d: "X ile Y arasındaki ilişkiyi modeller (y = a + b·x)." }
  ],

  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("🧪", "Hipotez Testi", "t-testi, ANOVA, regresyon — SPC ve Six Sigma analizlerinin devamı.")}

      <div class="card">
        <h3>🔬 Test Seç</h3>
        <div class="field"><label>Test Türü</label>
          <select id="testType">
            ${this.TESTS.map(t => `<option value="${t.k}">${t.n}</option>`).join("")}
          </select>
        </div>
        <small id="testHint" style="color:var(--muted)">${this.TESTS[0].d}</small>
        <div class="field" style="margin-top:10px"><label>Başlık</label><input id="title" placeholder="Ör: Hat A vs Hat B verimlilik"></div>
        <div class="field"><label>Değişken / Birim</label><input id="unit" placeholder="Ör: cycle time (sn)"></div>
      </div>

      <div id="inputWrap"></div>

      <div class="btn-row">
        <button class="btn btn-primary" id="runBtn">🧮 Testi Çalıştır</button>
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div id="resultWrap"></div>
      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlı Testler (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    this.renderInputs(root);
    this.renderList(root);
    this.renderAnalysis(root);

    root.querySelector("#testType").onchange = () => {
      const k = root.querySelector("#testType").value;
      root.querySelector("#testHint").textContent = (this.TESTS.find(t => t.k === k) || {}).d || "";
      this.renderInputs(root);
    };
    root.querySelector("#runBtn").onclick = () => this.run(root);
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.render(root); UI.toast("Form temizlendi"); };
  },

  renderInputs(root) {
    const wrap = root.querySelector("#inputWrap");
    const k = root.querySelector("#testType").value;
    if (k === "t1") {
      wrap.innerHTML = `
        <div class="card">
          <h3>📥 Veri — Tek Örneklem</h3>
          <div class="field"><label>Örneklem (virgülle)</label>
            <textarea id="s1" rows="3" placeholder="Ör: 12.3, 11.9, 12.1, 12.5, 12.0"></textarea>
          </div>
          <div class="field"><label>Hedef / Referans Ortalama (μ₀)</label>
            <input id="mu0" type="number" step="any" placeholder="Ör: 12">
          </div>
        </div>`;
    } else if (k === "t2") {
      wrap.innerHTML = `
        <div class="card">
          <h3>📥 Veri — İki Örneklem</h3>
          <div class="field"><label>Grup A</label>
            <textarea id="s1" rows="2" placeholder="Ör: 12.3, 11.9, 12.1"></textarea>
          </div>
          <div class="field"><label>Grup B</label>
            <textarea id="s2" rows="2" placeholder="Ör: 13.1, 13.0, 12.8"></textarea>
          </div>
        </div>`;
    } else if (k === "anova") {
      wrap.innerHTML = `
        <div class="card">
          <h3>📥 Veri — ANOVA (her satır = grup)</h3>
          <div class="field"><label>Her satır bir grup, virgülle ayır</label>
            <textarea id="groups" rows="5" placeholder="Hat A: 12.3, 11.9, 12.1\nHat B: 13.1, 13.0, 12.8\nHat C: 12.5, 12.4, 12.7"></textarea>
          </div>
          <small style="color:var(--muted)">Not: Grup adı için satır başında "Ad:" kullanın (opsiyonel).</small>
        </div>`;
    } else {
      wrap.innerHTML = `
        <div class="card">
          <h3>📥 Veri — Regresyon</h3>
          <div class="field"><label>X dizisi (bağımsız)</label>
            <textarea id="xs" rows="2" placeholder="1, 2, 3, 4, 5"></textarea>
          </div>
          <div class="field"><label>Y dizisi (bağımlı)</label>
            <textarea id="ys" rows="2" placeholder="2.1, 3.9, 6.0, 8.2, 10.0"></textarea>
          </div>
        </div>`;
    }
  },

  parseNums(str) {
    return (str || "").split(/[\s,;]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(x => !isNaN(x));
  },

  mean(a) { return a.reduce((s, x) => s + x, 0) / a.length; },
  variance(a, sample = true) {
    const m = this.mean(a);
    const s = a.reduce((s, x) => s + (x - m) * (x - m), 0);
    return s / (a.length - (sample ? 1 : 0));
  },

  /* Simple two-tailed t critical value approximation (α=0.05).
     Good enough for fabrika ortamı — large df → ~1.96, small df → wider. */
  tCrit05(df) {
    if (df < 1) return 12.706;
    const table = { 1:12.706, 2:4.303, 3:3.182, 4:2.776, 5:2.571, 6:2.447, 7:2.365, 8:2.306,
                    9:2.262, 10:2.228, 12:2.179, 15:2.131, 20:2.086, 25:2.060, 30:2.042,
                    40:2.021, 60:2.000, 120:1.980 };
    const keys = Object.keys(table).map(Number).sort((a,b)=>a-b);
    for (let i = 0; i < keys.length - 1; i++) {
      if (df >= keys[i] && df <= keys[i+1]) {
        const t = (df - keys[i]) / (keys[i+1] - keys[i]);
        return table[keys[i]] * (1-t) + table[keys[i+1]] * t;
      }
    }
    return df > 120 ? 1.96 : 12.706;
  },

  /* F critical value at α=0.05 for ANOVA (simplified table). */
  fCrit05(df1, df2) {
    const col = Math.min(Math.max(df1, 1), 10);
    const rowKey = df2 <= 5 ? 5 : df2 <= 10 ? 10 : df2 <= 20 ? 20 : df2 <= 30 ? 30 : df2 <= 60 ? 60 : 120;
    const tbl = {
      5:  [6.61, 5.79, 5.41, 5.19, 5.05, 4.95, 4.88, 4.82, 4.77, 4.74],
      10: [4.96, 4.10, 3.71, 3.48, 3.33, 3.22, 3.14, 3.07, 3.02, 2.98],
      20: [4.35, 3.49, 3.10, 2.87, 2.71, 2.60, 2.51, 2.45, 2.39, 2.35],
      30: [4.17, 3.32, 2.92, 2.69, 2.53, 2.42, 2.33, 2.27, 2.21, 2.16],
      60: [4.00, 3.15, 2.76, 2.53, 2.37, 2.25, 2.17, 2.10, 2.04, 1.99],
      120:[3.92, 3.07, 2.68, 2.45, 2.29, 2.17, 2.09, 2.02, 1.96, 1.91]
    };
    return tbl[rowKey][col-1];
  },

  tTest1(sample, mu0) {
    const n = sample.length;
    if (n < 2) return { error: "En az 2 veri gerekli" };
    const m = this.mean(sample);
    const s = Math.sqrt(this.variance(sample));
    const se = s / Math.sqrt(n);
    /* When variance is 0 the sample is constant. If mean equals μ₀ there is
       literally no difference (t=0, fail to reject). If mean differs the
       difference is deterministic (t→∞, reject). Avoid 0/0 → NaN in UI. */
    const t = se > 0 ? (m - mu0) / se : (m === mu0 ? 0 : (m > mu0 ? Infinity : -Infinity));
    const df = n - 1;
    const tc = this.tCrit05(df);
    const reject = isFinite(t) ? Math.abs(t) > tc : t !== 0;
    return {
      type: "t1", n, mean: m, sd: s, se, tStat: t, df, tCrit: tc, mu0,
      reject,
      verdict: reject ? "H₀ reddedildi — fark istatistiksel olarak anlamlı." : "H₀ reddedilemedi — fark anlamlı değil."
    };
  },

  tTest2(a, b) {
    if (a.length < 2 || b.length < 2) return { error: "Her iki grupta en az 2 veri gerekli" };
    const ma = this.mean(a), mb = this.mean(b);
    const va = this.variance(a), vb = this.variance(b);
    const na = a.length, nb = b.length;
    /* Welch's t-test — variances need not be equal. */
    const se = Math.sqrt(va/na + vb/nb);
    /* Same constant-sample guard as tTest1. */
    const t = se > 0 ? (ma - mb) / se : (ma === mb ? 0 : (ma > mb ? Infinity : -Infinity));
    const df = se > 0
      ? Math.pow(va/na + vb/nb, 2) / (Math.pow(va/na, 2)/(na-1) + Math.pow(vb/nb, 2)/(nb-1))
      : (na + nb - 2);
    const tc = this.tCrit05(Math.round(df));
    const reject = isFinite(t) ? Math.abs(t) > tc : t !== 0;
    return {
      type: "t2", na, nb, meanA: ma, meanB: mb, sdA: Math.sqrt(va), sdB: Math.sqrt(vb),
      diff: ma - mb, se, tStat: t, df, tCrit: tc,
      reject,
      verdict: reject ? "İki grup anlamlı farklı." : "İki grup arasında anlamlı fark yok."
    };
  },

  anova(groups) {
    groups = groups.filter(g => g.data.length > 0);
    if (groups.length < 2) return { error: "En az 2 grup gerekli" };
    const total = groups.reduce((s, g) => s + g.data.length, 0);
    if (total < groups.length + 1) return { error: "Yetersiz veri" };
    const allData = [].concat(...groups.map(g => g.data));
    const grandMean = this.mean(allData);
    let ssb = 0, ssw = 0;
    groups.forEach(g => {
      const gm = this.mean(g.data);
      ssb += g.data.length * (gm - grandMean) ** 2;
      g.data.forEach(x => ssw += (x - gm) ** 2);
    });
    const df1 = groups.length - 1;
    const df2 = total - groups.length;
    const msb = ssb / df1;
    const msw = ssw / df2;
    const F = msb / (msw || 1e-9);
    const fc = this.fCrit05(df1, df2);
    return {
      type: "anova", groups: groups.map(g => ({ name: g.name, n: g.data.length, mean: this.mean(g.data) })),
      ssb, ssw, df1, df2, msb, msw, F, fCrit: fc,
      reject: F > fc,
      verdict: F > fc ? "Gruplar arasında anlamlı fark var." : "Gruplar arasında anlamlı fark yok."
    };
  },

  regression(xs, ys) {
    if (xs.length !== ys.length) return { error: "X ve Y eşit uzunlukta olmalı" };
    if (xs.length < 3) return { error: "En az 3 veri çifti gerekli" };
    const n = xs.length;
    const mx = this.mean(xs), my = this.mean(ys);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      sxy += (xs[i] - mx) * (ys[i] - my);
      sxx += (xs[i] - mx) ** 2;
      syy += (ys[i] - my) ** 2;
    }
    /* OLS regression is undefined when X has no variance — refuse rather than
       returning silly Infinity slopes that look like real coefficients. */
    if (sxx === 0) return { error: "X değerlerinin tümü aynı — regresyon yapılamaz" };
    const b = sxy / sxx;
    const a = my - b * mx;
    const r = syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
    const r2 = r * r;
    const yhat = xs.map(x => a + b * x);
    const sse = ys.reduce((s, y, i) => s + (y - yhat[i]) ** 2, 0);
    const denom = (n - 2) > 0 ? (n - 2) : 1;
    const seB = Math.sqrt(sse / denom / sxx);
    const t = seB > 0 ? b / seB : (b === 0 ? 0 : (b > 0 ? Infinity : -Infinity));
    const df = n - 2;
    const tc = this.tCrit05(df);
    const reject = isFinite(t) ? Math.abs(t) > tc : t !== 0;
    return {
      type: "reg", n, a, b, r, r2, seB, tStat: t, df, tCrit: tc,
      reject,
      verdict: reject ? "Eğim anlamlı — X, Y'yi istatistiksel olarak etkiliyor." : "Eğim anlamlı değil — güçlü bir ilişki gösterilemedi.",
      equation: `y = ${a.toFixed(3)} + ${b.toFixed(3)} · x`
    };
  },

  run(root) {
    const k = root.querySelector("#testType").value;
    let res;
    if (k === "t1") {
      const s = this.parseNums(root.querySelector("#s1").value);
      const mu0 = parseFloat(root.querySelector("#mu0").value);
      if (isNaN(mu0)) { UI.toast("Hedef ortalama girin", "danger"); return; }
      res = this.tTest1(s, mu0);
    } else if (k === "t2") {
      const a = this.parseNums(root.querySelector("#s1").value);
      const b = this.parseNums(root.querySelector("#s2").value);
      res = this.tTest2(a, b);
    } else if (k === "anova") {
      const raw = root.querySelector("#groups").value.split(/\n/).map(l => l.trim()).filter(Boolean);
      const groups = raw.map((line, i) => {
        const colon = line.indexOf(":");
        const name = colon > -1 ? line.slice(0, colon).trim() : `Grup ${i+1}`;
        const data = this.parseNums(colon > -1 ? line.slice(colon+1) : line);
        return { name, data };
      });
      res = this.anova(groups);
    } else {
      const xs = this.parseNums(root.querySelector("#xs").value);
      const ys = this.parseNums(root.querySelector("#ys").value);
      res = this.regression(xs, ys);
    }
    this.renderResult(root, res, k);
    return res;
  },

  renderResult(root, res, testKind) {
    const wrap = root.querySelector("#resultWrap");
    if (!res) { wrap.innerHTML = ""; return; }
    if (res.error) { wrap.innerHTML = Analyze.card("🧪", "Sonuç", Analyze.insight("danger", "Hata", res.error), ""); return; }
    const num = (x, d=4) => x == null || !isFinite(x) ? "-" : (+x).toFixed(d);
    let body = "";
    if (res.type === "t1") {
      body = `
        <div class="kpi-grid">
          <div class="kpi"><div class="label">n</div><div class="value">${res.n}</div></div>
          <div class="kpi"><div class="label">Ortalama</div><div class="value">${num(res.mean,3)}</div></div>
          <div class="kpi"><div class="label">SD</div><div class="value">${num(res.sd,3)}</div></div>
          <div class="kpi amber"><div class="label">t</div><div class="value">${num(res.tStat,3)}</div></div>
          <div class="kpi"><div class="label">df</div><div class="value">${res.df}</div></div>
          <div class="kpi"><div class="label">t kritik (α=0.05)</div><div class="value">${num(res.tCrit,3)}</div></div>
        </div>`;
    } else if (res.type === "t2") {
      body = `
        <div class="kpi-grid">
          <div class="kpi"><div class="label">n A / n B</div><div class="value">${res.na} / ${res.nb}</div></div>
          <div class="kpi"><div class="label">Ort A</div><div class="value">${num(res.meanA,3)}</div></div>
          <div class="kpi"><div class="label">Ort B</div><div class="value">${num(res.meanB,3)}</div></div>
          <div class="kpi amber"><div class="label">Fark</div><div class="value">${num(res.diff,3)}</div></div>
          <div class="kpi"><div class="label">t (Welch)</div><div class="value">${num(res.tStat,3)}</div></div>
          <div class="kpi"><div class="label">df</div><div class="value">${num(res.df,1)}</div></div>
          <div class="kpi"><div class="label">t kritik</div><div class="value">${num(res.tCrit,3)}</div></div>
        </div>`;
    } else if (res.type === "anova") {
      body = `
        <div class="kpi-grid">
          <div class="kpi"><div class="label">Gruplar</div><div class="value">${res.groups.length}</div></div>
          <div class="kpi"><div class="label">SSB / SSW</div><div class="value">${num(res.ssb,2)} / ${num(res.ssw,2)}</div></div>
          <div class="kpi amber"><div class="label">F</div><div class="value">${num(res.F,3)}</div></div>
          <div class="kpi"><div class="label">df1 / df2</div><div class="value">${res.df1} / ${res.df2}</div></div>
          <div class="kpi"><div class="label">F kritik</div><div class="value">${num(res.fCrit,3)}</div></div>
        </div>
        <table style="width:100%;margin-top:10px;border-collapse:collapse">
          <thead><tr><th style="text-align:left;border-bottom:1px solid var(--border)">Grup</th><th style="border-bottom:1px solid var(--border)">n</th><th style="border-bottom:1px solid var(--border)">Ortalama</th></tr></thead>
          <tbody>${res.groups.map(g => `<tr><td>${UI.escape(g.name)}</td><td style="text-align:center">${g.n}</td><td style="text-align:center">${num(g.mean,3)}</td></tr>`).join("")}</tbody>
        </table>`;
    } else if (res.type === "reg") {
      body = `
        <div class="kpi-grid">
          <div class="kpi"><div class="label">n</div><div class="value">${res.n}</div></div>
          <div class="kpi"><div class="label">a (kesişim)</div><div class="value">${num(res.a,3)}</div></div>
          <div class="kpi amber"><div class="label">b (eğim)</div><div class="value">${num(res.b,3)}</div></div>
          <div class="kpi"><div class="label">r</div><div class="value">${num(res.r,3)}</div></div>
          <div class="kpi success"><div class="label">R²</div><div class="value">${num(res.r2,3)}</div></div>
          <div class="kpi"><div class="label">t (eğim)</div><div class="value">${num(res.tStat,3)}</div></div>
          <div class="kpi"><div class="label">t kritik</div><div class="value">${num(res.tCrit,3)}</div></div>
        </div>
        <div style="margin-top:8px;font-family:monospace;background:#f8fafc;padding:8px;border-radius:6px">${UI.escape(res.equation)}</div>`;
    }
    const verdict = Analyze.insight(res.reject ? "success" : "info", "Sonuç", res.verdict);
    wrap.innerHTML = Analyze.card("🧪", "Test Sonucu", body, verdict);
  },

  save(root) {
    const res = this.run(root);
    if (!res || res.error) { UI.toast("Önce geçerli bir test çalıştırın", "danger"); return; }
    const title = root.querySelector("#title").value.trim() || ("Test " + new Date().toLocaleDateString("tr-TR"));
    const unit = root.querySelector("#unit").value.trim();
    const k = root.querySelector("#testType").value;
    const rec = { title, unit, testType: k, result: res };
    if (k === "t1") { rec.sample = root.querySelector("#s1").value; rec.mu0 = root.querySelector("#mu0").value; }
    else if (k === "t2") { rec.sampleA = root.querySelector("#s1").value; rec.sampleB = root.querySelector("#s2").value; }
    else if (k === "anova") { rec.groups = root.querySelector("#groups").value; }
    else { rec.xs = root.querySelector("#xs").value; rec.ys = root.querySelector("#ys").value; }
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, rec);
    else Storage.add(this.KEY, rec);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("🧪", "Henüz test yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.title)}</div>
          <div class="li-sub">${UI.escape((this.TESTS.find(t=>t.k===it.testType)||{}).n || it.testType)} • ${UI.escape(it.unit || "")}</div>
          <div class="li-sub">${UI.escape((it.result && it.result.verdict) || "")}</div>
        </div>
        <div class="li-actions">
          <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
        </div>
      </div>
    `).join("");
    wrap.querySelectorAll("[data-action=del]").forEach(b => b.onclick = e => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const insights = [], text = [];
    if (!records.length) return { insights: [Analyze.insight("info", "Test yok", "SPC verilerinizle hipotez testleri yaparak kararlarınızı güçlendirin.")], text: ["Kayıt yok."] };
    const sig = records.filter(r => r.result && r.result.reject).length;
    insights.push(Analyze.insight("info", `${records.length} test • ${sig} anlamlı`, "Anlamlı bulgular için DMAIC Improve fazına veri sağlayın."));
    text.push(`Toplam test: ${records.length}, Anlamlı: ${sig}`);
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("🧪", "Test kaydedin, otomatik yorum çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🧪", "Hipotez Testleri Portföyü", "", a.insights.join(""));
  }
};
