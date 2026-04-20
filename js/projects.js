/* Multi-project (multi-client) workspace manager */
const Projects = (function () {
  const LIST_KEY = "yalin__projects";
  const ACTIVE_KEY = "yalin__active_project";
  const DEFAULT_ID = "default";
  const DEFAULT_NAME = "Varsayılan Proje";

  /* Tool keys that existed before multi-project support; used for one-time migration. */
  const LEGACY_KEYS = [
    "why5", "fishbone", "pareto", "a3", "pdca", "rca",
    "takt", "oee", "smed", "vsm", "fives", "kanban",
    "andon", "heijunka", "kaizen", "muda", "pokayoke",
    "jit", "jidoka", "sqdcp", "gemba", "asakai",
    "actions", "fmea", "spc"
  ];

  function list() {
    try { return JSON.parse(localStorage.getItem(LIST_KEY) || "[]"); }
    catch (e) { return []; }
  }

  function setList(l) { localStorage.setItem(LIST_KEY, JSON.stringify(l)); }

  function getActive() {
    return localStorage.getItem(ACTIVE_KEY) || DEFAULT_ID;
  }

  function setActive(id) {
    if (!list().find(p => p.id === id)) return false;
    localStorage.setItem(ACTIVE_KEY, id);
    return true;
  }

  function getActiveProject() {
    const id = getActive();
    return list().find(p => p.id === id) || { id: DEFAULT_ID, name: DEFAULT_NAME };
  }

  function ensureDefault() {
    const l = list();
    if (!l.length) {
      l.push({ id: DEFAULT_ID, name: DEFAULT_NAME, createdAt: new Date().toISOString() });
      setList(l);
    }
    if (!localStorage.getItem(ACTIVE_KEY)) {
      localStorage.setItem(ACTIVE_KEY, l[0].id);
    }
  }

  /* One-time migration: copy legacy unprefixed keys into default project. */
  function migrateLegacy() {
    const migratedFlag = "yalin__migrated_v1";
    if (localStorage.getItem(migratedFlag)) return;
    ensureDefault();
    LEGACY_KEYS.forEach(k => {
      const legacy = localStorage.getItem("yalin_" + k);
      const scoped = localStorage.getItem("yalin_" + DEFAULT_ID + "__" + k);
      if (legacy && !scoped) {
        localStorage.setItem("yalin_" + DEFAULT_ID + "__" + k, legacy);
      }
    });
    localStorage.setItem(migratedFlag, "1");
  }

  function add(name) {
    name = (name || "").trim();
    if (!name) return null;
    const l = list();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const p = { id, name, createdAt: new Date().toISOString() };
    l.push(p);
    setList(l);
    return p;
  }

  function rename(id, name) {
    name = (name || "").trim();
    if (!name) return false;
    const l = list();
    const p = l.find(x => x.id === id);
    if (!p) return false;
    p.name = name;
    setList(l);
    return true;
  }

  function remove(id) {
    const l = list();
    if (l.length <= 1) return false;
    const next = l.filter(x => x.id !== id);
    setList(next);
    LEGACY_KEYS.forEach(k => localStorage.removeItem("yalin_" + id + "__" + k));
    if (getActive() === id) setActive(next[0].id);
    return true;
  }

  return {
    DEFAULT_ID,
    list, setList, getActive, getActiveProject, setActive,
    ensureDefault, migrateLegacy, add, rename, remove
  };
})();
