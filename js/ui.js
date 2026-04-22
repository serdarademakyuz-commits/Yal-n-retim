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

  function csvEscape(v) {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[";\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  /* Converts an array of records into CSV (UTF-8 with BOM so Excel renders Turkish chars correctly). */
  function toCSV(rows, headers) {
    if (!rows || !rows.length) return "";
    const cols = (headers && headers.length) ? headers : Object.keys(rows[0]);
    const lines = [cols.join(";")];
    rows.forEach(r => lines.push(cols.map(c => csvEscape(r[c])).join(";")));
    return "\uFEFF" + lines.join("\r\n");
  }

  function downloadCSV(filename, rows, headers) {
    const csv = toCSV(rows, headers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const MAX_PHOTO_DIM = 1024;
  const MAX_PHOTO_QUALITY = 0.8;

  function photosToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, MAX_PHOTO_DIM / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          try { resolve(canvas.toDataURL("image/jpeg", MAX_PHOTO_QUALITY)); }
          catch (e) { resolve(reader.result); }
        };
        img.onerror = () => resolve(reader.result);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /*
   * Renders a photo-attachment field and wires change handlers.
   * `getList` / `setList` let the caller own the state (array of dataURLs).
   */
  function photoField(container, getList, setList, opts) {
    opts = opts || {};
    const label = opts.label == null ? "📸 Fotoğraflar" : opts.label;
    const render = () => {
      const list = getList() || [];
      container.innerHTML = `
        ${label ? `<label>${label}</label>` : ""}
        <input type="file" accept="image/*" multiple class="photo-input" ${opts.capture ? 'capture="environment"' : ""}>
        <div class="photo-grid">
          ${list.map((src, i) => `
            <div class="photo-thumb">
              <img src="${src}" alt="Foto ${i + 1}">
              <button type="button" class="photo-del" data-i="${i}" data-no-print>✕</button>
            </div>
          `).join("")}
        </div>
      `;
      container.querySelector(".photo-input").onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const current = getList() || [];
        for (const f of files) {
          try {
            const d = await photosToDataURL(f);
            current.push(d);
          } catch (err) { toast("Fotoğraf okunamadı", "danger"); }
        }
        setList(current);
        render();
      };
      container.querySelectorAll(".photo-del").forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        const cur = getList() || [];
        cur.splice(i, 1);
        setList(cur);
        render();
      });
    };
    render();
    return { refresh: render };
  }

  function renderPhotos(photos) {
    if (!photos || !photos.length) return "";
    return `<div class="photo-grid">${photos.map(src => `
      <div class="photo-thumb"><img src="${src}" alt="Foto"></div>
    `).join("")}</div>`;
  }

  /* Universal per-tool photo gallery. Router calls this after every tool render
     so each tool gets a "📸 Araç Fotoğrafları" card without touching 28 files.
     Photos are persisted per-project per-tool in Storage under `<route>_photos`. */
  function toolPhotos(root, routeKey, label) {
    if (!root || !routeKey) return;
    if (root.querySelector(`.tool-photos-card[data-tp-route="${routeKey}"]`)) return;
    const storageKey = routeKey + "_photos";
    const card = document.createElement("div");
    card.className = "card tool-photos-card";
    card.setAttribute("data-tp-route", routeKey);
    card.setAttribute("data-no-print", "");
    card.innerHTML = `
      <h3 style="display:flex;justify-content:space-between;align-items:center;cursor:pointer">
        <span>📸 ${label || "Araç Fotoğrafları"}</span>
        <span class="tp-toggle">▾</span>
      </h3>
      <div class="tp-body"></div>
    `;
    root.appendChild(card);
    const body = card.querySelector(".tp-body");
    const header = card.querySelector("h3");
    let open = true;
    const getList = () => (typeof Storage !== "undefined" ? (Storage.getValue(storageKey) || []) : []);
    const setList = (l) => { if (typeof Storage !== "undefined") Storage.setValue(storageKey, l); };
    header.onclick = () => {
      open = !open;
      body.style.display = open ? "" : "none";
      card.querySelector(".tp-toggle").textContent = open ? "▾" : "▸";
    };
    photoField(body, getList, setList, { label: "" });
  }

  function printPage() {
    if (typeof window !== "undefined" && window.print) window.print();
  }

  return { el, toast, confirm, hero, emptyState, fmtDate, escape, actionButtons,
           downloadText, toCSV, downloadCSV, photoField, renderPhotos, toolPhotos, printPage };
})();
