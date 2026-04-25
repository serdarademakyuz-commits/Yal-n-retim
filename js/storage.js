/* Persistent storage layer using localStorage (project-scoped) */
const Storage = (function () {
  const PREFIX = "yalin_";

  function projectScope() {
    if (typeof Projects !== "undefined" && Projects.getActive) {
      return Projects.getActive() + "__";
    }
    return "default__";
  }

  function key(k) { return PREFIX + projectScope() + k; }

  function getAll(k) {
    try {
      const raw = localStorage.getItem(key(k));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Storage read error:", e);
      return [];
    }
  }

  function setAll(k, list) {
    try {
      localStorage.setItem(key(k), JSON.stringify(list));
      return true;
    } catch (e) {
      const quota = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
      if (typeof UI !== "undefined" && UI.toast) {
        UI.toast(quota ? "Depolama alanı dolu — fotoğrafları azaltın veya proje yedekleyin" : "Kayıt hatası", "danger");
      } else {
        console.error("Storage write failed:", e);
      }
      return false;
    }
  }

  function add(k, item) {
    const list = getAll(k);
    item.id = item.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    list.unshift(item);
    setAll(k, list);
    return item;
  }

  function update(k, id, patch) {
    const list = getAll(k);
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
      setAll(k, list);
      return list[idx];
    }
    return null;
  }

  function remove(k, id) {
    const list = getAll(k).filter(x => x.id !== id);
    setAll(k, list);
  }

  function clear(k) {
    localStorage.removeItem(key(k));
  }

  function getOne(k, id) {
    return getAll(k).find(x => x.id === id);
  }

  function getValue(k, def = null) {
    try {
      const raw = localStorage.getItem(key(k));
      return raw ? JSON.parse(raw) : def;
    } catch (e) { return def; }
  }
  function setValue(k, v) {
    try {
      localStorage.setItem(key(k), JSON.stringify(v));
      return true;
    } catch (e) {
      const quota = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
      if (typeof UI !== "undefined" && UI.toast) {
        UI.toast(quota ? "Depolama dolu — eski fotoğrafları silin" : "Kayıt hatası", "danger");
      }
      return false;
    }
  }

  function totalCount() {
    const keys = [
      "why5", "fishbone", "pareto", "a3", "pdca", "rca",
      "fmea", "spc",
      "takt", "oee", "smed", "vsm", "fives", "kanban",
      "andon", "heijunka", "kaizen", "muda", "pokayoke",
      "jit", "jidoka", "sqdcp", "gemba", "asakai",
      "actions",
      "dmaic", "hoshin", "hypothesis", "audit", "consultant"
    ];
    return keys.reduce((sum, k) => sum + getAll(k).length, 0);
  }

  return { getAll, setAll, add, update, remove, clear, getOne, getValue, setValue, totalCount, key };
})();
