const Andon = {
  KEY: "andon",
  state: { editingId: null },
  LEVELS: [
    { k: "red",    n: "🔴 Acil Durdurma", desc: "Üretim durdu, hat durması" },
    { k: "yellow", n: "🟡 Uyarı",         desc: "Dikkat, müdahale gerekli" },
    { k: "blue",   n: "🔵 Bilgi",         desc: "Malzeme, bilgi talebi" },
    { k: "green",  n: "🟢 Normal",        desc: "Her şey yolunda" }
  ],
  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);
    const active = list.filter(x => x.status !== "resolved");
    const counts = {};
    this.LEVELS.forEach(l => counts[l.k] = active.filter(x => x.level === l.k).length);

    root.innerHTML = `
      ${UI.hero("🚦", "Andon Sistemi", "Gerçek zamanlı durum sinyali. Anomalileri hemen bildirin.")}

      <div class="card">
        <h3>📊 Anlık Durum</h3>
        <div class="andon-grid">
          ${this.LEVELS.map(l => `
            <div class="andon-light ${l.k}" data-level="${l.k}">
              <div class="al-ico">${l.n.split(" ")[0]}</div>
              <div class="al-name">${l.n.substring(3)}</div>
              <div class="al-count">${counts[l.k]}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="card">
        <h3>📝 Yeni Olay</h3>
        <div class="field"><label>Seviye</label>
          <select id="level">
            ${this.LEVELS.map(l => `<option value="${l.k}">${l.n} - ${l.desc}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Hat / İstasyon</label><input id="station" placeholder="Ör: Hat-3 / İstasyon-5"></div>
        <div class="field"><label>Problem</label><textarea id="issue" placeholder="Olayı açıklayın"></textarea></div>
        <div class="grid-2">
          <div class="field"><label>Çağıran</label><input id="caller" placeholder="Operatör adı"></div>
          <div class="field"><label>Yanıt Bekleyen</label><input id="responder" placeholder="Takım lideri"></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-danger" id="saveBtn">🚨 Bildir</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div class="card">
        <h3>📋 Aktif Olaylar (${active.length})</h3>
        <div id="activeWrap"></div>
      </div>

      <div class="card">
        <h3>📜 Çözümlenenler (${list.length - active.length})</h3>
        <div id="resolvedWrap"></div>
      </div>

      <div id="analyzeWrap"></div>
    `;
    root.querySelectorAll(".andon-light").forEach(el => el.onclick = () => {
      root.querySelector("#level").value = el.dataset.level;
      window.scrollTo({ top: 200, behavior: "smooth" });
    });
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => this.clearForm(root);
    this.renderLists(root);
    this.renderAnalysis(root);
  },
  renderLists(root) {
    const list = Storage.getAll(this.KEY);
    const active = list.filter(x => x.status !== "resolved");
    const resolved = list.filter(x => x.status === "resolved");
    const aw = root.querySelector("#activeWrap");
    const rw = root.querySelector("#resolvedWrap");
    aw.innerHTML = active.length
      ? active.map(it => this.renderItem(it, true)).join("")
      : UI.emptyState("🟢", "Aktif olay yok.");
    rw.innerHTML = resolved.length
      ? resolved.slice(0, 30).map(it => this.renderItem(it, false)).join("")
      : UI.emptyState("📭", "Henüz çözümlenen olay yok.");
    this.bindEvents(root);
  },
  renderItem(it, active) {
    const lvl = this.LEVELS.find(l => l.k === it.level) || this.LEVELS[0];
    return `
      <div class="list-item" data-id="${it.id}" style="border-left:4px solid ${it.level === 'red' ? 'var(--danger)' : it.level === 'yellow' ? 'var(--amber)' : it.level === 'blue' ? 'var(--info)' : 'var(--success)'}">
        <div class="li-main">
          <div class="li-title">${lvl.n} - ${UI.escape(it.station)}</div>
          <div class="li-sub">${UI.escape(it.issue || "")}</div>
          <div class="li-sub">📞 ${UI.escape(it.caller || "")} → ${UI.escape(it.responder || "")} • ${UI.fmtDate(it.createdAt)}</div>
          ${it.status === "resolved" ? `<div class="li-sub">✅ Çözüm: ${UI.escape(it.resolution || "")} • ${UI.fmtDate(it.resolvedAt)}</div>` : ''}
        </div>
        <div class="li-actions">
          ${active ? `<button class="btn btn-success btn-sm" data-action="resolve">✅</button>` : ''}
          <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
          <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
        </div>
      </div>
    `;
  },
  bindEvents(root) {
    root.querySelectorAll("[data-action=del]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    root.querySelectorAll("[data-action=resolve]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const res = prompt("Çözüm notu:") || "Çözüldü";
      Storage.update(this.KEY, id, { status: "resolved", resolution: res, resolvedAt: new Date().toISOString() });
      UI.toast("Çözümlendi", "success");
      this.render(root);
    });
    root.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      this.state.editingId = id;
      ["level", "station", "issue", "caller", "responder"].forEach(k => root.querySelector("#" + k).value = it[k] || "");
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 200, behavior: "smooth" });
    });
  },
  clearForm(root) {
    this.state.editingId = null;
    ["station", "issue", "caller", "responder"].forEach(k => root.querySelector("#" + k).value = "");
    root.querySelector("#level").value = "red";
    root.querySelector("#saveBtn").textContent = "🚨 Bildir";
    UI.toast("Temizlendi");
  },
  save(root) {
    const station = root.querySelector("#station").value.trim();
    const issue = root.querySelector("#issue").value.trim();
    if (!station || !issue) { UI.toast("Hat ve problem gerekli", "danger"); return; }
    const data = {
      level: root.querySelector("#level").value,
      station, issue,
      caller: root.querySelector("#caller").value,
      responder: root.querySelector("#responder").value
    };
    if (this.state.editingId) {
      /* Preserve the existing status (and resolution metadata if resolved)
         so editing a closed Andon doesn't accidentally reopen it. */
      Storage.update(this.KEY, this.state.editingId, data);
      UI.toast("Andon güncellendi", "success");
    } else {
      data.status = "active";
      Storage.add(this.KEY, data);
      UI.toast("Andon bildirildi", "success");
    }
    this.render(root);
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const counts = { red: 0, yellow: 0, blue: 0, green: 0 };
    records.forEach(r => { counts[r.level] = (counts[r.level] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const levelName = { red: "🔴 Acil Durdurma", yellow: "🟡 Uyarı", blue: "🔵 Bilgi", green: "🟢 Normal" };
    if (sorted[0] && sorted[0][1] > 0) {
      insights.push(Analyze.insight("info", `En sık olay: ${levelName[sorted[0][0]] || sorted[0][0]}`,
        `${sorted[0][1]} kayıt. Dağılım: 🔴${counts.red} • 🟡${counts.yellow} • 🔵${counts.blue} • 🟢${counts.green}`));
      text.push(`En sık: ${sorted[0][0]} (${sorted[0][1]})`);
    }
    if (counts.red > 0) {
      insights.push(Analyze.insight("danger", `${counts.red} kırmızı olay kaydedildi`, "Acil durdurma olayları yüksek etkili; kök neden analizi (5 Neden) uygulayın."));
      text.push(`Kırmızı: ${counts.red}`);
    }
    // Resolve time analysis
    const resolved = records.filter(r => r.status === "resolved" && r.createdAt && r.resolvedAt);
    if (resolved.length) {
      const durMs = resolved.map(r => new Date(r.resolvedAt) - new Date(r.createdAt)).filter(x => x > 0);
      if (durMs.length) {
        const avgMin = (durMs.reduce((s, x) => s + x, 0) / durMs.length) / 60000;
        insights.push(Analyze.insight(avgMin < 15 ? "success" : avgMin < 60 ? "warn" : "danger",
          `Ortalama çözüm süresi: ${avgMin.toFixed(1)} dk`,
          `${resolved.length} çözülmüş olaydan. Hedef <15 dk ideal.`));
        text.push(`Ort. çözüm: ${avgMin.toFixed(1)} dk`);
      }
    }
    const active = records.filter(r => r.status !== "resolved");
    if (active.length) {
      insights.push(Analyze.insight("warn", `${active.length} aktif olay var`, "Önce en yüksek seviyedeki olayı çözümleyin."));
    } else {
      insights.push(Analyze.insight("success", "Aktif olay yok", "Tüm olaylar çözümlenmiş."));
    }
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("🚦", "Olay ekleyin, analiz otomatik oluşur."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "Andon Otomatik Analizi", "", a.insights.join(""));
  }
};
