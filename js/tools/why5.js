const Why5 = {
  KEY: "why5",
  state: { editingId: null },

  render(root) {
    this.state.editingId = null;
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("❓", "5 Neden Analizi", "Problemi 5 kez 'Neden?' sorarak kök nedene ulaşın.")}

      <div class="card">
        <h3>📝 Yeni Analiz</h3>
        <div class="field">
          <label>Problem Tanımı</label>
          <textarea id="problem" placeholder="Ör: Üretim hattı 3 saat durdu."></textarea>
        </div>
        <div class="field">
          <label>Departman / Alan</label>
          <input id="area" placeholder="Ör: Montaj Hattı 2">
        </div>
        <div id="whys">
          ${[1,2,3,4,5].map(n => `
            <div class="field">
              <label>${n}. Neden?</label>
              <textarea class="why-input" data-n="${n}" placeholder="Neden ${n}. kez cevabı..."></textarea>
            </div>
          `).join("")}
        </div>
        <div class="field">
          <label>🎯 Kök Neden (Sonuç)</label>
          <textarea id="root" placeholder="5 neden sonrası çıkan kök neden"></textarea>
        </div>
        <div class="field">
          <label>💡 Karşı Önlem / Aksiyon</label>
          <textarea id="action" placeholder="Alınacak düzeltici aksiyon"></textarea>
        </div>
        <div class="btn-row">
          <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
          <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
        </div>
      </div>

      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlı Analizler (${list.length})</h3>
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
    if (!list.length) { wrap.innerHTML = UI.emptyState("❓", "Henüz analiz yok."); return; }
    wrap.innerHTML = list.map(it => `
      <div class="list-item" data-id="${it.id}">
        <div class="li-main">
          <div class="li-title">${UI.escape(it.problem || "Problem")}</div>
          <div class="li-sub">${UI.escape(it.area || "")} • ${UI.fmtDate(it.updatedAt)}</div>
          ${it.root ? `<div class="li-sub">🎯 ${UI.escape(it.root)}</div>` : ""}
          <div style="margin-top:6px">
            ${(it.whys || []).map((w, i) => w ? `<div class="why-step" data-n="${i+1}"><p>${UI.escape(w)}</p></div>` : "").join("")}
          </div>
        </div>
        <div class="li-actions">
          <button class="btn btn-primary btn-sm" data-action="toA3">📋 A3'e</button>
          <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
          <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-action=del]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Bu analiz silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    wrap.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      this.fillForm(root, it);
    });
    wrap.querySelectorAll("[data-action=toA3]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      this.transferToA3(it);
    });
  },

  /* Seeds a new A3 record with the 5 Why analysis pre-filled in the relevant sections. */
  transferToA3(it) {
    if (!it) { UI.toast("Kayıt bulunamadı", "danger"); return; }
    const whysText = (it.whys || []).filter(Boolean).map((w, i) => `${i+1}. ${w}`).join("\n");
    Storage.add("a3", {
      title: "A3 — " + (it.problem || "5 Neden Aktarımı"),
      owner: "", date: new Date().toISOString().slice(0, 10),
      background: it.area ? `Alan/Hat: ${it.area}` : "",
      current: it.problem || "",
      goal: "",
      analysis: whysText + (it.root ? `\n\n🎯 Kök Neden: ${it.root}` : ""),
      countermeasures: it.action || "",
      plan: "",
      followup: "",
      result: "",
      source: "why5",
      sourceId: it.id
    });
    UI.toast("A3 oluşturuldu", "success");
    Router.go("a3");
  },

  fillForm(root, it) {
    root.querySelector("#problem").value = it.problem || "";
    root.querySelector("#area").value = it.area || "";
    root.querySelector("#root").value = it.root || "";
    root.querySelector("#action").value = it.action || "";
    root.querySelectorAll(".why-input").forEach((inp, i) => inp.value = (it.whys || [])[i] || "");
    this.state.editingId = it.id;
    root.querySelector("#saveBtn").textContent = "💾 Güncelle";
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  clearForm(root) {
    root.querySelector("#problem").value = "";
    root.querySelector("#area").value = "";
    root.querySelector("#root").value = "";
    root.querySelector("#action").value = "";
    root.querySelectorAll(".why-input").forEach(inp => inp.value = "");
    this.state.editingId = null;
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
  },

  save(root) {
    const problem = root.querySelector("#problem").value.trim();
    if (!problem) { UI.toast("Problem tanımı gerekli", "danger"); return; }
    const whys = Array.from(root.querySelectorAll(".why-input")).map(i => i.value.trim());
    const data = {
      problem,
      area: root.querySelector("#area").value.trim(),
      whys,
      root: root.querySelector("#root").value.trim(),
      action: root.querySelector("#action").value.trim()
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
    if (!records.length) return { insights: [], text: ["Kayıt yok."] };
    const insights = [], text = [];
    const latest = records[records.length - 1];
    const filled = (latest.whys || []).filter(w => w && w.length > 3).length;
    const hasRoot = !!(latest.root && latest.root.length > 3);
    const hasAction = !!(latest.action && latest.action.length > 3);
    if (filled === 5) insights.push(Analyze.insight("success", "5 neden seviyesi tamamlandı", "Derin sorgulama yapılmış — kök nedene ulaşma olasılığı yüksek."));
    else insights.push(Analyze.insight("warn", `${filled}/5 neden dolu`, "En az 5 seviye inerek yüzeysel nedenlerden kaçının."));
    if (!hasRoot) insights.push(Analyze.insight("danger", "Kök neden yazılmamış", "Son 'neden'in çıkardığı kök nedeni açıkça belirtin."));
    if (!hasAction) insights.push(Analyze.insight("warn", "Karşı önlem tanımsız", "Kök nedeni ele alan somut aksiyon ekleyin, yoksa problem tekrar eder."));
    if (hasRoot && hasAction && filled === 5) insights.push(Analyze.insight("success", "Analiz eksiksiz", "PDCA ile aksiyonları uygulayıp izleyin."));
    insights.push(Analyze.insight("info", `${records.length} kayıtlı analiz`, "Tekrar eden kök nedenleri Pareto ile değerlendirin."));
    text.push(`${filled}/5 neden, kök: ${hasRoot ? "var" : "yok"}, aksiyon: ${hasAction ? "var" : "yok"}`);
    const ti = Targets.periodInsight(records, "month", "why5.monthlyTarget");
    if (ti) insights.push(ti);
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("❓", "Analiz kaydedin, otomatik yorum çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("🔍", "5 Neden Analizi Yorumu", "", a.insights.join(""));
  }
};
