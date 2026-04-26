/* Hedefler — kullanıcının yalın üretim hedeflerini belirlediği sayfa.
   Aktif projeye scoped: her müşteri/proje kendi hedeflerini koyar. */
const TargetsPage = {
  render(root) {
    const all = Targets.all();
    const byTool = {};
    Object.entries(all).forEach(([k, v]) => {
      const t = v.tool || "Diğer";
      (byTool[t] = byTool[t] || []).push({ key: k, ...v });
    });

    const projName = (typeof Projects !== "undefined" && Projects.getActiveProject) ? Projects.getActiveProject().name : "Genel";

    root.innerHTML = `
      ${UI.hero("🎯", "Hedefler", "Yalın üretim hedeflerini sen belirlersin — uygulama bunları kullanır. Aktif proje: " + UI.escape(projName))}

      <div class="card">
        <h3>📋 Hakkında</h3>
        <p style="color:var(--muted);font-size:13px;line-height:1.5;margin:0">
          Aşağıdaki değerler kuruluşunuzun yalın üretim hedeflerini temsil eder.
          Tüm dashboard göstergeleri, gauge hedef çizgileri ve otomatik analiz
          değerlendirmeleri bu eşiklere göre hesaplanır. Varsayılan değerler
          başlangıç noktasıdır — kendi taahhüdünüzü yansıtmak için düzenleyin.
          Boş bırakırsanız varsayılana döner. Hedefler aktif projeye özeldir.
        </p>
      </div>

      ${Object.keys(byTool).sort().map(toolName => `
        <div class="card">
          <h3>🛠️ ${UI.escape(toolName)}</h3>
          ${byTool[toolName].map(t => `
            <div class="field">
              <label>${UI.escape(t.label)}${t.unit ? ` (${UI.escape(t.unit)})` : ""}</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="number" step="any" id="t-${UI.escape(t.key)}" value="${t.value}" style="flex:1">
                <button class="btn btn-outline btn-sm" data-reset="${UI.escape(t.key)}" title="Varsayılana döndür">↩</button>
              </div>
              ${t.help ? `<small style="color:var(--muted);display:block;margin-top:4px">${UI.escape(t.help)}</small>` : ""}
            </div>
          `).join("")}
        </div>
      `).join("")}

      <div class="card">
        <div class="btn-row">
          <button class="btn btn-success" id="saveAll">💾 Tüm Hedefleri Kaydet</button>
          <button class="btn btn-outline" id="resetAll">↩ Tümünü Varsayılana Döndür</button>
        </div>
      </div>
    `;

    root.querySelector("#saveAll").onclick = () => {
      Object.keys(all).forEach(k => {
        const el = root.querySelector("#t-" + k);
        if (el) Targets.set(k, el.value);
      });
      UI.toast("Hedefler kaydedildi", "success");
      this.render(root);
    };

    root.querySelector("#resetAll").onclick = () => {
      if (UI.confirm("Tüm hedefler varsayılana dönecek. Emin misiniz?")) {
        Targets.resetAll();
        UI.toast("Varsayılana döndürüldü", "success");
        this.render(root);
      }
    };

    root.querySelectorAll("[data-reset]").forEach(b => b.onclick = (e) => {
      const k = e.target.dataset.reset;
      Targets.reset(k);
      UI.toast("Varsayılana döndürüldü");
      this.render(root);
    });
  }
};
