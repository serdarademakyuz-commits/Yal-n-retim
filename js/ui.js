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
    const label = opts.label || "📸 Fotoğraflar";
    const render = () => {
      const list = getList() || [];
      container.innerHTML = `
        <label>${label}</label>
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

  function printPage() {
    if (typeof window !== "undefined" && window.print) window.print();
  }

  return { el, toast, confirm, hero, emptyState, fmtDate, escape, actionButtons,
           downloadText, photoField, renderPhotos, printPage };
})();
