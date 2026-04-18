/* Persistent storage layer using localStorage */
const Storage = (function () {
  const PREFIX = "yalin_";

  function key(k) { return PREFIX + k; }

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
    localStorage.setItem(key(k), JSON.stringify(list));
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
    localStorage.setItem(key(k), JSON.stringify(v));
  }

  function totalCount() {
    const keys = [
      "why5", "fishbone", "pareto", "a3", "pdca", "rca",
      "takt", "oee", "smed", "vsm", "fives", "kanban",
      "andon", "heijunka", "kaizen", "muda", "pokayoke",
      "jit", "jidoka", "sqdcp", "gemba", "asakai"
    ];
    return keys.reduce((sum, k) => sum + getAll(k).length, 0);
  }

  return { getAll, setAll, add, update, remove, clear, getOne, getValue, setValue, totalCount, key };
})();
