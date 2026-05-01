/* Targets — user-configurable lean manufacturing targets per project.
   Stores under Storage.setValue/getValue so each project keeps its own goals.
   Defaults match common industry benchmarks but are overridable from the
   "Hedefler" page — the user's targets are sacred, this module never decides
   them. */
const Targets = (function () {
  const KEY = "user_targets";

  /* Default values are starting points only — they reflect common AIAG / TPS
     benchmarks but the user is expected to set them per-project to match
     their own commitment. */
  const DEFAULTS = {
    /* === YALIN ARAÇLAR (19) === */
    /* Takt */
    "takt.targetSec":   { value: 60,  unit: "sn", label: "Takt Süresi Hedefi",     tool: "Takt", help: "Hat için hedef takt zamanı (saniye). Kuruluşunuza göre belirleyin." },
    /* OEE */
    "oee.target":       { value: 85,  unit: "%",  label: "OEE Hedefi",             tool: "OEE", help: "Dünya klası %85 (Nakajima); kuruluşunuzun taahhüdünü girin." },
    "oee.acceptable":   { value: 60,  unit: "%",  label: "OEE Kabul Eşiği",        tool: "OEE", help: "Bu eşiğin altı 'risk', üstü 'izleniyor'." },
    /* SMED */
    "smed.targetMin":   { value: 10,  unit: "dk", label: "SMED Hedef Setup Süresi",tool: "SMED", help: "Shingo SMED hedefi: tek haneli dakika." },
    /* VSM */
    "vsm.pceTarget":    { value: 25,  unit: "%",  label: "VSM Akış Verimliliği (PCE)",tool: "VSM", help: "VA / Lead Time. %25 üstü iyi seviye." },
    /* 5S */
    "fives.target":     { value: 80,  unit: "%",  label: "5S Denetim Hedefi",      tool: "5S",  help: "Toplam puan / 20. Yaygın hedef %80." },
    "fives.acceptable": { value: 60,  unit: "%",  label: "5S Kabul Eşiği",         tool: "5S",  help: "Altı 'aksiyon gerekli'." },
    /* Kanban */
    "kanban.wipDoing":  { value: 5,   unit: "kart",label: "Kanban WIP — 'Devam Ediyor'", tool: "Kanban", help: "Aktif çalışma için maksimum kart sayısı (Little Yasası)." },
    /* Andon */
    "andon.responseMin":{ value: 15,  unit: "dk", label: "Andon Yanıt Hedefi",     tool: "Andon", help: "Çağrı → çözüm hedef süresi." },
    /* Heijunka */
    "heijunka.cvExcellent":{ value: 10,unit:"%",  label: "Heijunka CV Mükemmel",   tool: "Heijunka", help: "CV bu altındaysa seviyelendirme mükemmel." },
    "heijunka.cvAcceptable":{ value: 25,unit:"%", label: "Heijunka CV Kabul",      tool: "Heijunka", help: "Bu üstü 'büyük dalgalanma'." },
    /* Kaizen */
    "kaizen.yearlyTarget":{ value: 12,unit: "adet/yıl",label: "Kaizen Yıllık Hedefi", tool: "Kaizen", help: "Kişi/ekip başına yıllık iyileştirme (Toyota: 1/ay)." },
    /* Muda */
    "muda.monthlyTarget":{ value: 5,  unit: "adet/ay",label: "Muda Aylık Tespit Hedefi",tool: "Muda", help: "Aylık tespit edilmesi beklenen israf sayısı." },
    /* Poka-Yoke */
    "pokayoke.yearlyTarget":{ value: 6, unit: "adet/yıl",label: "Poka-Yoke Yıllık Kurulum Hedefi", tool: "Poka-Yoke", help: "Yıllık devreye alınması hedeflenen hata önleme sayısı." },
    /* JIT */
    "jit.serviceLevel": { value: 95,  unit: "%",  label: "JIT Servis Seviyesi",    tool: "JIT", help: "Stoksuz kalmama oranı hedefi (yaygın %95-99)." },
    /* Jidoka */
    "jidoka.maxDowntime":{ value: 30, unit: "dk/olay",label: "Jidoka Olay Maks. Duruş", tool: "Jidoka", help: "Bir Jidoka olayında izin verilen azami duruş." },
    /* SQDCP */
    "sqdcp.greenRatio": { value: 80,  unit: "%",  label: "SQDCP Yeşil Oranı Hedefi",tool: "SQDCP", help: "Günlerin %X'inde tüm SQDCP ekseni yeşil olmalı." },
    /* Gemba */
    "gemba.monthlyWalks":{ value: 4,  unit: "adet/ay",label: "Aylık Gemba Yürüyüşü", tool: "Gemba", help: "Yöneticinin aylık saha yürüyüşü hedefi (Toyota: haftada 1)." },
    /* Asakai */
    "asakai.maxPeople": { value: 10,  unit: "kişi",label: "Asakai Maks. Katılımcı",tool: "Asakai", help: "Toyota tavsiyesi: en fazla 10 kişi." },
    "asakai.maxMin":    { value: 15,  unit: "dk", label: "Asakai Maks. Süre",      tool: "Asakai", help: "Sabah toplantısı 5-15 dk arası tutulmalı." },
    /* Hoshin */
    "hoshin.yearlyBreakthroughs":{ value: 5, unit:"adet/yıl",label: "Hoshin Yıllık Atılım Hedefi",tool: "Hoshin Kanri", help: "X-Matrix Güney bölümü: en fazla 5 atılım önerilir." },

    /* === PROBLEM ÇÖZME TEKNİKLERİ (11) === */
    /* 5 Neden */
    "why5.monthlyTarget":{ value: 4, unit: "adet/ay", label: "5 Neden Aylık Hedefi",  tool: "5 Neden", help: "Aylık tamamlanması hedeflenen 5 Neden analizi sayısı." },
    /* Fishbone */
    "fishbone.monthlyTarget":{ value: 2, unit:"adet/ay",label: "Balık Kılçığı Aylık Hedefi", tool: "Fishbone", help: "Aylık 6M analizi hedefi." },
    /* Pareto */
    "pareto.monthlyTarget":{ value: 2, unit: "adet/ay",label: "Pareto Aylık Hedefi", tool: "Pareto", help: "Aylık Pareto analizi hedefi." },
    /* A3 */
    "a3.yearlyTarget":  { value: 6,   unit: "adet/yıl",label: "A3 Rapor Yıllık Hedefi", tool: "A3", help: "Yıllık tamamlanması hedeflenen A3 raporu sayısı." },
    /* PDCA */
    "pdca.monthlyTarget":{ value: 2,  unit: "adet/ay",label: "PDCA Aylık Döngü Hedefi", tool: "PDCA", help: "Aylık tamamlanması hedeflenen PDCA döngü sayısı." },
    /* RCA */
    "rca.monthlyTarget":{ value: 2,   unit: "adet/ay",label: "RCA Aylık Hedefi",       tool: "RCA", help: "Aylık kök neden analizi hedefi." },
    /* FMEA */
    "fmea.rpnLow":      { value: 50,  unit: "",   label: "FMEA RPN Düşük Sınır",       tool: "FMEA", help: "Bu değerin altı düşük risk." },
    "fmea.rpnHigh":     { value: 100, unit: "",   label: "FMEA RPN Yüksek Sınır",      tool: "FMEA", help: "Bu değerin üstü kritik risk." },
    /* SPC */
    "spc.cpkMin":       { value: 1.33,unit: "",   label: "Cpk Minimum",                tool: "SPC", help: "AIAG seri üretim minimum (PPAP)." },
    "spc.cpkExcellent": { value: 1.67,unit: "",   label: "Cpk Mükemmel",               tool: "SPC", help: "AIAG yeni proses standardı." },
    /* DMAIC */
    "dmaic.yearlyTarget":{ value: 4,  unit: "adet/yıl",label: "DMAIC Yıllık Proje Hedefi",tool: "DMAIC", help: "Yıllık tamamlanması hedeflenen Six Sigma proje sayısı." },
    /* Hipotez */
    "hypothesis.monthlyTarget":{ value: 1, unit:"adet/ay",label: "Hipotez Testi Aylık Hedefi", tool: "Hipotez Testi", help: "SPC verisi üzerinde aylık yapılması beklenen istatistiksel test sayısı." },
    /* Audit */
    "audit.target":     { value: 80,  unit: "%",  label: "Denetim Skor Hedefi",        tool: "Denetim Listeleri", help: "ISO/IATF iç tetkik için 80%+ önerilir." },
    "audit.acceptable": { value: 60,  unit: "%",  label: "Denetim Kabul Eşiği",        tool: "Denetim Listeleri", help: "Altı 'aksiyon planı zorunlu'." },

    /* === GENEL === */
    "maturity.target":  { value: 75,  unit: "%",  label: "Yalın Olgunluk Hedefi",      tool: "Genel", help: "Kullanılan araç oranı / toplam araç." },
    "quality.target":   { value: 99,  unit: "%",  label: "Kalite (FTQ) Hedefi",        tool: "Genel", help: "First Time Quality oranı." }
  };

  function all() {
    const stored = Storage.getValue(KEY) || {};
    const out = {};
    Object.keys(DEFAULTS).forEach(k => {
      out[k] = { ...DEFAULTS[k], value: stored[k] != null ? stored[k] : DEFAULTS[k].value };
    });
    return out;
  }

  function get(key, fallback) {
    const stored = Storage.getValue(KEY) || {};
    if (stored[key] != null) return +stored[key];
    if (DEFAULTS[key] != null) return +DEFAULTS[key].value;
    return fallback;
  }

  function set(key, value) {
    const stored = Storage.getValue(KEY) || {};
    if (value === "" || value == null) delete stored[key];
    else stored[key] = +value;
    Storage.setValue(KEY, stored);
  }

  function reset(key) {
    const stored = Storage.getValue(KEY) || {};
    delete stored[key];
    Storage.setValue(KEY, stored);
  }

  function resetAll() { Storage.setValue(KEY, {}); }

  /* Helper: count records that match the given period (month/year). */
  function periodCount(records, period) {
    const now = new Date();
    if (period === "month") {
      const cur = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      return (records || []).filter(r => {
        const t = r.createdAt || r.updatedAt;
        return t && new Date(t).toISOString().slice(0, 7) === cur;
      }).length;
    }
    if (period === "year") {
      const cy = now.getFullYear();
      return (records || []).filter(r => {
        const t = r.createdAt || r.updatedAt;
        return t && new Date(t).getFullYear() === cy;
      }).length;
    }
    return (records || []).length;
  }

  /* Helper: produces an Analyze.insight HTML string comparing this period's
     record count against the user's target. Caller passes the explicit target
     key so the helper works with any naming convention (e.g.
     "gemba.monthlyWalks", "hoshin.yearlyBreakthroughs"). */
  function periodInsight(records, period, targetKey) {
    if (typeof Analyze === "undefined") return "";
    if (!targetKey || DEFAULTS[targetKey] == null) return "";
    const target = get(targetKey);
    if (target == null || !isFinite(target) || target <= 0) return "";
    const count = periodCount(records, period);
    const lbl = period === "year" ? "Bu yıl" : "Bu ay";
    if (count >= target) {
      return Analyze.insight("success", `${lbl} hedefi tutturuldu`, `${count} / ${target} — disiplini sürdürün.`);
    }
    if (count >= Math.ceil(target / 2)) {
      return Analyze.insight("warn", `${lbl} hedefin altında`, `${count} / ${target} — kalan dönemde tempo artırın.`);
    }
    return Analyze.insight("danger", `${lbl} hedefin çok altında`, `${count} / ${target} — uygulamayı yaygınlaştırın.`);
  }

  return { get, set, all, reset, resetAll, periodCount, periodInsight, DEFAULTS, KEY };
})();
