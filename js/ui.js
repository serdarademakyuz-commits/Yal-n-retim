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
        <div class="photo-actions" style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn btn-primary photo-pick-file">📁 Dosya / Galeri</button>
          <button type="button" class="btn btn-accent photo-pick-cam">📷 Kamera</button>
        </div>
        <input type="file" accept="image/*" multiple class="photo-input" style="display:none">
        <input type="file" accept="image/*" capture="environment" class="photo-input-cam" style="display:none">
        <div class="photo-grid">
          ${list.map((src, i) => `
            <div class="photo-thumb">
              <img src="${src}" alt="Foto ${i + 1}">
              <button type="button" class="photo-del" data-i="${i}" data-no-print>✕</button>
            </div>
          `).join("")}
        </div>
      `;
      const fileInput = container.querySelector(".photo-input");
      const camInput = container.querySelector(".photo-input-cam");
      const handle = async (e) => {
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
        e.target.value = "";
        render();
      };
      fileInput.onchange = handle;
      camInput.onchange = handle;
      container.querySelector(".photo-pick-file").onclick = (e) => { e.stopPropagation(); fileInput.click(); };
      container.querySelector(".photo-pick-cam").onclick = (e) => { e.stopPropagation(); camInput.click(); };
      container.querySelectorAll(".photo-del").forEach(b => b.onclick = (e) => {
        e.stopPropagation();
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

  /* Per-tool mini dashboard injected above every tool page: total records,
     this month, last 7 days, active share + monthly trend bar chart. */
  function toolDashboard(root, routeKey, opts) {
    if (!root || !routeKey) return;
    if (root.querySelector(`.tool-mini-dash[data-tmd="${routeKey}"]`)) return;
    opts = opts || {};
    if (typeof Storage === "undefined") return;
    const records = Storage.getAll(routeKey) || [];
    const now = new Date();
    const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    let cntMonth = 0, cntWeek = 0, cntClosed = 0;
    const buckets = {};
    records.forEach(r => {
      const t = r.createdAt || r.updatedAt || "";
      if (t) {
        const d = new Date(t);
        const mk = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        if (mk === thisMonth) cntMonth++;
        if (t >= sevenDaysAgo) cntWeek++;
        buckets[mk] = (buckets[mk] || 0) + 1;
      }
      if (r.status === "done" || r.status === "resolved" || r.status === "closed") cntClosed++;
    });
    const series = Object.keys(buckets).sort().slice(-6).map(k => ({ label: k.slice(2), value: buckets[k] }));
    const max = Math.max(1, ...series.map(s => s.value));
    const w = 300, h = 70, pad = 20;
    const bw = (w - 2 * pad) / Math.max(series.length, 1);
    const bars = series.map((p, i) => {
      const bh = Math.round((p.value / max) * (h - 2 * pad));
      const x = pad + i * bw + 3;
      const y = h - pad - bh;
      return `<g>
        <rect x="${x}" y="${y}" width="${(bw - 6).toFixed(1)}" height="${bh}" fill="#0a2540" rx="2"/>
        <text x="${(x + (bw - 6) / 2).toFixed(1)}" y="${h - pad + 12}" font-size="8" text-anchor="middle" fill="#64748b">${p.label}</text>
        <text x="${(x + (bw - 6) / 2).toFixed(1)}" y="${Math.max(y - 2, 10)}" font-size="8" text-anchor="middle" fill="#475569">${p.value}</text>
      </g>`;
    }).join("");
    const card = document.createElement("div");
    card.className = "tool-mini-dash";
    card.setAttribute("data-tmd", routeKey);
    card.setAttribute("data-no-print", "");
    const closedPct = records.length > 0 ? Math.round((cntClosed / records.length) * 100) : 0;
    card.innerHTML = `
      <h4>
        <span>📊 ${opts.title || "Araç Paneli"}</span>
        <small style="color:var(--muted);font-weight:500;text-transform:none;letter-spacing:normal">Aktif proje · son 6 ay</small>
      </h4>
      <div class="tmd-stats">
        <div class="tmd-stat"><div class="v">${records.length}</div><div class="l">Toplam</div></div>
        <div class="tmd-stat"><div class="v">${cntMonth}</div><div class="l">Bu ay</div></div>
        <div class="tmd-stat"><div class="v">${cntWeek}</div><div class="l">7 gün</div></div>
        <div class="tmd-stat"><div class="v">${closedPct}%</div><div class="l">Kapanan</div></div>
      </div>
      ${series.length ? `<div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px">
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:80px">${bars}</svg>
      </div>` : `<div style="background:var(--surface);border:1px dashed var(--border);border-radius:6px;padding:10px;text-align:center;font-size:12px;color:var(--muted)">📭 Henüz kayıt yok — ilk kaydınızı ekleyin.</div>`}
    `;
    const hero = root.querySelector(".page-hero");
    if (hero && hero.parentNode === root && hero.nextSibling) {
      root.insertBefore(card, hero.nextSibling);
    } else if (hero && hero.parentNode === root) {
      root.appendChild(card);
    } else {
      root.insertBefore(card, root.firstChild);
    }
  }

  return { el, toast, confirm, hero, emptyState, fmtDate, escape, actionButtons,
           downloadText, toCSV, downloadCSV, photoField, renderPhotos,
           toolPhotos, toolDashboard, printPage };
})();
