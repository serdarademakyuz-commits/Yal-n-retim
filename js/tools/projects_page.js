/* Project management page: create / rename / delete / switch */
const ProjectsPage = {
  render(root) {
    Projects.ensureDefault();
    const list = Projects.list();
    const active = Projects.getActive();

    root.innerHTML = `
      ${UI.hero("📁", "Proje Yönetimi", "Her müşteri/fabrika için ayrı bir çalışma alanı. Veriler izole şekilde saklanır.")}

      <div class="card">
        <h3>➕ Yeni Proje</h3>
        <div class="field"><label>Proje / Müşteri Adı</label>
          <input id="newProjectName" placeholder="Ör: ABC Otomotiv - Hat 2">
        </div>
        <button class="btn btn-success btn-block" id="addProjectBtn">➕ Proje Oluştur</button>
      </div>

      <div class="card">
        <h3>📋 Projeler (${list.length})</h3>
        <div id="projectList"></div>
      </div>

      <div class="card">
        <h3>ℹ️ Bilgi</h3>
        <div class="list-item"><div class="li-main">
          <div class="li-title">Aktif proje: ${UI.escape(Projects.getActiveProject().name)}</div>
          <div class="li-sub">Tüm kayıtlar (Pareto, OEE, 5S, vb.) aktif projeye özeldir.</div>
          <div class="li-sub">Proje silindiğinde o projeye ait tüm veriler silinir (geri alınamaz).</div>
        </div></div>
      </div>
    `;

    this.renderList(root);

    root.querySelector("#addProjectBtn").onclick = () => {
      const name = root.querySelector("#newProjectName").value.trim();
      if (!name) { UI.toast("Proje adı gerekli", "danger"); return; }
      const p = Projects.add(name);
      if (!p) { UI.toast("Proje oluşturulamadı", "danger"); return; }
      Projects.setActive(p.id);
      UI.toast("Proje oluşturuldu", "success");
      if (typeof App !== "undefined" && App.refreshProjectBar) App.refreshProjectBar();
      this.render(root);
    };
  },

  renderList(root) {
    const wrap = root.querySelector("#projectList");
    const list = Projects.list();
    const active = Projects.getActive();
    if (!list.length) { wrap.innerHTML = UI.emptyState("📁", "Henüz proje yok."); return; }
    wrap.innerHTML = list.map(p => `
      <div class="list-item" data-id="${p.id}">
        <div class="li-main">
          <div class="li-title">${p.id === active ? "✅ " : ""}${UI.escape(p.name)}</div>
          <div class="li-sub">ID: ${UI.escape(p.id)} • Oluşturulma: ${UI.fmtDate(p.createdAt)}</div>
        </div>
        <div class="li-actions">
          ${p.id === active ? "" : `<button class="btn btn-success btn-sm" data-a="activate">Aktif Et</button>`}
          <button class="btn btn-outline btn-sm" data-a="rename">✏️</button>
          ${list.length > 1 ? `<button class="btn btn-danger btn-sm" data-a="del">🗑️</button>` : ""}
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-a=activate]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      Projects.setActive(id);
      UI.toast("Proje aktif edildi", "success");
      if (typeof App !== "undefined" && App.refreshProjectBar) App.refreshProjectBar();
      this.render(root);
    });

    wrap.querySelectorAll("[data-a=rename]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      const cur = Projects.list().find(x => x.id === id);
      const name = window.prompt("Yeni proje adı", cur ? cur.name : "");
      if (name == null) return;
      if (Projects.rename(id, name)) {
        UI.toast("Yeniden adlandırıldı", "success");
        if (typeof App !== "undefined" && App.refreshProjectBar) App.refreshProjectBar();
        this.render(root);
      }
    });

    wrap.querySelectorAll("[data-a=del]").forEach(b => b.onclick = (e) => {
      const id = e.target.closest(".list-item").dataset.id;
      if (!UI.confirm("Bu projenin TÜM verisi silinecek. Emin misiniz?")) return;
      if (Projects.remove(id)) {
        UI.toast("Proje silindi", "danger");
        if (typeof App !== "undefined" && App.refreshProjectBar) App.refreshProjectBar();
        this.render(root);
      } else {
        UI.toast("Son proje silinemez", "danger");
      }
    });
  }
};
