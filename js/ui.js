/* Shared UI helpers */
const UI = (function () {
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function toast(msg, type = "") {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.className = "toast show " + type;
    clearTimeout(t._tm);
    t._tm = setTimeout(() => { t.className = "toast"; }, 2400);
  }

  function confirm(msg) {
    return window.confirm(msg);
  }

  function hero(icon, title, desc) {
    return `
      <div class="page-hero">
        <div class="ph-icon">${icon}</div>
        <div>
          <h2>${title}</h2>
          <p>${desc}</p>
        </div>
      </div>`;
  }

  function emptyState(icon, text) {
    return `<div class="empty"><div class="empty-icon">${icon}</div><div>${text}</div></div>`;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR") + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }

  function escape(str) {
    if (str == null) return "";
    return String(str).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function actionButtons(onEdit, onDelete) {
    // returns two buttons by class name; real binding happens at render time
    return `
      <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
      <button class="btn btn-danger btn-sm" data-action="delete">🗑️</button>
    `;
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  return { el, toast, confirm, hero, emptyState, fmtDate, escape, actionButtons, downloadText };
})();
