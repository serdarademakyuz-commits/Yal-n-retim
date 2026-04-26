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
    /* OEE — World Class Manufacturing benchmark */
    "oee.target":       { value: 85, unit: "%",   label: "OEE Hedefi",            tool: "OEE", help: "Dünya klası %85 (Nakajima); kullanıcı kendi taahhüdünü girer." },
    "oee.acceptable":   { value: 60, unit: "%",   label: "OEE Kabul Eşiği",       tool: "OEE", help: "Bu eşiğin altı 'risk', altı sarı, üstü hedefe yakın." },
    /* 5S audit */
    "fives.target":     { value: 80, unit: "%",   label: "5S Denetim Hedefi",     tool: "5S",  help: "Toplam puan / 20 oranı. Yaygın hedef %80." },
    "fives.acceptable": { value: 60, unit: "%",   label: "5S Kabul Eşiği",        tool: "5S",  help: "Altı 'aksiyon gerekli', arası 'iyileştirilmeli'." },
    /* Cpk thresholds (AIAG defaults) */
    "spc.cpkMin":       { value: 1.33, unit: "",  label: "Cpk Minimum",           tool: "SPC", help: "AIAG seri üretim minimum (PPAP). Ototmotivde standart." },
    "spc.cpkExcellent": { value: 1.67, unit: "",  label: "Cpk Mükemmel",          tool: "SPC", help: "AIAG yeni proses standardı. Six Sigma için 2.00." },
    /* FMEA RPN risk classification */
    "fmea.rpnLow":      { value: 50,  unit: "",   label: "FMEA RPN Düşük Sınır",  tool: "FMEA", help: "Bu değerin altı düşük risk." },
    "fmea.rpnHigh":     { value: 100, unit: "",   label: "FMEA RPN Yüksek Sınır", tool: "FMEA", help: "Bu değerin üstü kritik risk." },
    /* Andon response time */
    "andon.responseMin":{ value: 15,  unit: "dk", label: "Andon Yanıt Hedefi",    tool: "Andon", help: "Andon çağrısı → çözüm hedef süresi (dk)." },
    /* Kaizen */
    "kaizen.yearlyTarget":{ value: 12, unit: "/yıl", label: "Yıllık Kaizen Hedefi",tool: "Kaizen", help: "Kişi/ekip başına yıllık iyileştirme sayısı (Toyota: 1/ay)." },
    /* Asakai meeting rules */
    "asakai.maxPeople": { value: 10,  unit: "kişi",label: "Asakai Maksimum Katılımcı", tool: "Asakai", help: "Toyota tavsiyesi en fazla 10 kişi (büyük gruplarda hat bazında bölün)." },
    "asakai.maxMin":    { value: 15,  unit: "dk", label: "Asakai Maksimum Süre",  tool: "Asakai", help: "Sabah toplantısı 5-15 dk arası tutulmalı." },
    /* Audit */
    "audit.target":     { value: 80,  unit: "%",  label: "Denetim Skor Hedefi",   tool: "Audit", help: "ISO/IATF iç tetkik için 80%+ önerilir." },
    "audit.acceptable": { value: 60,  unit: "%",  label: "Denetim Kabul Eşiği",   tool: "Audit", help: "Altı 'aksiyon planı zorunlu'." },
    /* Heijunka leveling (CV thresholds) */
    "heijunka.cvExcellent":{ value: 10, unit:"%", label: "Heijunka CV Mükemmel",  tool: "Heijunka", help: "Variation Coefficient bu altındaysa seviyelendirme mükemmel." },
    "heijunka.cvAcceptable":{ value: 25, unit:"%", label: "Heijunka CV Kabul",    tool: "Heijunka", help: "Bu üstü 'büyük dalgalanma'." },
    /* VSM PCE */
    "vsm.pceTarget":    { value: 25,  unit: "%",  label: "VSM Akış Verimliliği (PCE) Hedefi", tool: "VSM", help: "VA / Lead Time. %25 üstü iyi, çoğu işletmede %5 civarındadır." },
    /* SMED — Single-Minute Exchange of Die */
    "smed.targetMin":   { value: 10,  unit: "dk", label: "SMED Hedef Setup Süresi", tool: "SMED", help: "Shingo'nun klasik SMED hedefi: tek haneli dakika." },
    /* Yalın olgunluk gauge */
    "maturity.target":  { value: 75,  unit: "%",  label: "Yalın Olgunluk Hedefi", tool: "Genel", help: "Kullanılan araç oranı / toplam araç. %75 üstü olgun yalın kuruluş." },
    /* Quality */
    "quality.target":   { value: 99,  unit: "%",  label: "Kalite (FTQ) Hedefi",   tool: "Genel", help: "First Time Quality / kalite oranı hedefi." }
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

  return { get, set, all, reset, resetAll, DEFAULTS, KEY };
})();
