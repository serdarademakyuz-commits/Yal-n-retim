/* Audit Checklists — pre-populated ISO 9001, IATF 16949, Safety templates with
   pass / fail / NC rating, evidence notes, photos, and scoring. */
const Audit = {
  KEY: "audit",
  state: { editingId: null, items: [] },

  TEMPLATES: {
    iso9001: {
      name: "ISO 9001:2015 Kalite Yönetim Sistemi",
      icon: "🏅",
      items: [
        { clause: "4.1", text: "Kuruluş ve bağlamı belirlenmiş mi?" },
        { clause: "4.2", text: "İlgili taraflar ve beklentileri dokümante edilmiş mi?" },
        { clause: "4.4", text: "Süreçler tanımlanmış, izleme kriterleri belirli mi?" },
        { clause: "5.1", text: "Üst yönetim liderliği ve taahhüdü gösteriyor mu?" },
        { clause: "5.2", text: "Kalite politikası yazılı ve duyurulmuş mu?" },
        { clause: "6.1", text: "Risk ve fırsatlar değerlendirilmiş mi?" },
        { clause: "6.2", text: "Ölçülebilir kalite hedefleri var mı?" },
        { clause: "7.1.5", text: "Ölçüm kaynakları (MSA) kalibre edilmiş mi?" },
        { clause: "7.2", text: "Personel yetkinliği (eğitim kayıtları) mevcut mu?" },
        { clause: "7.5", text: "Dokümante edilmiş bilgiler kontrol altında mı?" },
        { clause: "8.3", text: "Tasarım ve geliştirme süreci tanımlı mı?" },
        { clause: "8.4", text: "Dış tedarikçi değerlendirmesi yapılıyor mu?" },
        { clause: "8.5", text: "Üretim koşulları kontrollü, izlenebilir mi?" },
        { clause: "8.7", text: "Uygun olmayan ürün (NCR) süreci işletiliyor mu?" },
        { clause: "9.1", text: "Müşteri memnuniyeti ölçülüyor mu?" },
        { clause: "9.2", text: "İç tetkikler plana göre yürütülüyor mu?" },
        { clause: "9.3", text: "Yönetim gözden geçirme toplantıları yapılıyor mu?" },
        { clause: "10.2", text: "Uygunsuzluk ve düzeltici faaliyet kayıtları var mı?" },
        { clause: "10.3", text: "Sürekli iyileştirme kanıtları sunuluyor mu?" }
      ]
    },
    iatf16949: {
      name: "IATF 16949:2016 Otomotiv Kalitesi",
      icon: "🚗",
      items: [
        { clause: "4.3.2", text: "Müşteri spesifik gereksinimleri (CSR) belirlenmiş mi?" },
        { clause: "5.1.1.1", text: "Kurumsal sorumluluk politikası (rüşvetsizlik, etik) var mı?" },
        { clause: "6.1.2.1", text: "Risk analizi (PFMEA) güncel ve revize edilmiş mi?" },
        { clause: "6.1.2.3", text: "Acil durum planları (güç kesintisi, ekipman) hazırlanmış mı?" },
        { clause: "7.1.5.1", text: "MSA çalışmaları (Gauge R&R) dokümante edilmiş mi?" },
        { clause: "7.2.3", text: "İç tetkikçi yetkinliği belgelenmiş mi?" },
        { clause: "7.5.3.2.2", text: "Kayıtların saklanma süreleri ürün ömrü + hizmet süresini kapsıyor mu?" },
        { clause: "8.2.3.1.2", text: "Müşteri onaylı proses (PPAP/PSW) mevcut mu?" },
        { clause: "8.3.2.1", text: "Tasarım ve geliştirme planı çok disiplinli mi?" },
        { clause: "8.4.2.3", text: "Tedarikçi QMS geliştirme (VDA 6.3/IATF hedefi) izleniyor mu?" },
        { clause: "8.5.1.1", text: "Kontrol planları (prototip/ön seri/seri) hazır mı?" },
        { clause: "8.5.1.2", text: "Standardize iş talimatları iş istasyonunda mevcut mu?" },
        { clause: "8.5.1.3", text: "Proses doğrulama (setup/shift change) yapılıyor mu?" },
        { clause: "8.5.6.1", text: "Değişiklik yönetimi (ECN) süreci takip ediliyor mu?" },
        { clause: "9.1.1.1", text: "İstatistiksel proses kontrol (SPC) uygulanıyor mu?" },
        { clause: "9.1.1.3", text: "Cp/Cpk kriterleri belirlenmiş mi?" },
        { clause: "9.2.2.3", text: "Üretim süreci tetkiki yapılıyor mu?" },
        { clause: "9.2.2.4", text: "Ürün tetkiki yapılıyor mu?" },
        { clause: "10.2.3", text: "Problem çözme (8D) raporu kullanılıyor mu?" },
        { clause: "10.2.4", text: "Hata önleme (Poka-Yoke) uygulanıyor mu?" }
      ]
    },
    safety: {
      name: "İş Sağlığı ve Güvenliği Denetimi",
      icon: "🦺",
      items: [
        { clause: "KKD-1", text: "Kişisel koruyucu donanım (baret, gözlük, ayakkabı) kullanılıyor mu?" },
        { clause: "KKD-2", text: "KKD zimmet kayıtları güncel mi?" },
        { clause: "ACL-1", text: "Acil çıkışlar işaretli ve engelsiz mi?" },
        { clause: "ACL-2", text: "Yangın tüpleri periyodik kontrol edilmiş mi?" },
        { clause: "ACL-3", text: "İlk yardım dolabı mevcut ve eksiksiz mi?" },
        { clause: "EKP-1", text: "Makine koruyucuları (siperler) yerinde mi?" },
        { clause: "EKP-2", text: "LOTO (kilitleme/etiketleme) uygulanıyor mu?" },
        { clause: "EKP-3", text: "Periyodik bakım kayıtları tutuluyor mu?" },
        { clause: "KİM-1", text: "Kimyasal güvenlik bilgi formları (SDS) erişilebilir mi?" },
        { clause: "KİM-2", text: "Kimyasal depolama alanı uygun havalandırmalı mı?" },
        { clause: "ELK-1", text: "Elektrik panoları kilitli ve etiketli mi?" },
        { clause: "ELK-2", text: "Kabloların izolasyonu sağlam mı?" },
        { clause: "ERG-1", text: "Kaldırma/taşıma ergonomik kurallara uygun mu?" },
        { clause: "EĞT-1", text: "İSG eğitim kayıtları güncel mi?" },
        { clause: "RD-1", text: "Risk değerlendirmesi yapılmış ve güncel mi?" },
        { clause: "RD-2", text: "Yıllık çalışma planı (İSG) uygulanıyor mu?" },
        { clause: "İŞR-1", text: "İş kazası ve ramak kala raporları tutuluyor mu?" },
        { clause: "HİJ-1", text: "Çalışma alanı temiz, atıklar ayrıştırılıyor mu?" }
      ]
    }
  },

  render(root) {
    this.state.editingId = null;
    this.state.items = [];
    const list = Storage.getAll(this.KEY);

    root.innerHTML = `
      ${UI.hero("📋", "Denetim Listeleri", "ISO 9001, IATF 16949 ve İSG denetim şablonları — skor, kanıt, fotoğraf.")}

      <div class="card">
        <h3>🧩 Şablon Seç</h3>
        <div class="field"><label>Denetim Türü</label>
          <select id="template">
            <option value="">— Şablon —</option>
            ${Object.keys(this.TEMPLATES).map(k => `<option value="${k}">${this.TEMPLATES[k].icon} ${this.TEMPLATES[k].name}</option>`).join("")}
            <option value="custom">✏️ Boş / Özel</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" id="loadTpl">📥 Şablonu Yükle</button>
      </div>

      <div class="card">
        <h3>📝 Denetim Bilgileri</h3>
        <div class="field"><label>Başlık</label><input id="title" placeholder="Ör: Hat 2 — IATF İç Tetkik"></div>
        <div class="grid-2">
          <div class="field"><label>Denetçi</label><input id="auditor"></div>
          <div class="field"><label>Tarih</label><input id="date" type="date"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label>Alan / Süreç</label><input id="area"></div>
          <div class="field"><label>Standart</label><input id="standard" placeholder="ISO 9001, IATF 16949..."></div>
        </div>
      </div>

      <div class="card">
        <h3>✅ Kontrol Maddeleri</h3>
        <div class="grid-2">
          <input id="newClause" placeholder="Madde no">
          <input id="newText" placeholder="Kontrol sorusu">
        </div>
        <button class="btn btn-accent btn-block" id="addItem" style="margin-top:8px">➕ Madde Ekle</button>
        <div id="itemsWrap" style="margin-top:10px"></div>
      </div>

      <div class="btn-row">
        <button class="btn btn-success" id="saveBtn">💾 Kaydet</button>
        <button class="btn btn-outline" id="clearBtn">🗑️ Temizle</button>
      </div>

      <div id="scoreWrap"></div>
      <div id="analyzeWrap"></div>

      <div class="card">
        <h3>📋 Kayıtlı Denetimler (${list.length})</h3>
        <div id="listWrap"></div>
      </div>
    `;

    this.renderItems(root);
    this.renderList(root);
    this.renderScore(root);
    this.renderAnalysis(root);

    root.querySelector("#loadTpl").onclick = () => {
      const k = root.querySelector("#template").value;
      if (!k) { UI.toast("Şablon seçin", "danger"); return; }
      if (k === "custom") { this.state.items = []; }
      else {
        const tpl = this.TEMPLATES[k];
        this.state.items = tpl.items.map(i => ({ clause: i.clause, text: i.text, status: "", note: "", photos: [] }));
        root.querySelector("#standard").value = tpl.name;
      }
      this.renderItems(root);
      this.renderScore(root);
      UI.toast("Şablon yüklendi", "success");
    };
    root.querySelector("#addItem").onclick = () => {
      const c = root.querySelector("#newClause").value.trim();
      const t = root.querySelector("#newText").value.trim();
      if (!t) { UI.toast("Soru girin", "danger"); return; }
      this.state.items.push({ clause: c, text: t, status: "", note: "", photos: [] });
      root.querySelector("#newClause").value = "";
      root.querySelector("#newText").value = "";
      this.renderItems(root);
    };
    root.querySelector("#saveBtn").onclick = () => this.save(root);
    root.querySelector("#clearBtn").onclick = () => { this.clearForm(root); UI.toast("Form temizlendi"); };
  },

  renderItems(root) {
    const wrap = root.querySelector("#itemsWrap");
    if (!this.state.items.length) { wrap.innerHTML = '<small style="color:var(--muted)">Henüz madde yok. Şablon yükleyin veya manuel ekleyin.</small>'; return; }
    wrap.innerHTML = this.state.items.map((it, i) => `
      <div class="list-item" data-i="${i}" style="flex-direction:column;align-items:stretch">
        <div class="li-main" style="display:flex;gap:8px;align-items:flex-start">
          <div style="flex:1">
            <div class="li-title">${UI.escape(it.clause || "-")} • ${UI.escape(it.text)}</div>
          </div>
          <button class="btn btn-danger btn-sm" data-del="${i}">❌</button>
        </div>
        <div class="grid-2" style="margin-top:6px">
          <select data-status="${i}">
            <option value="">— Değerlendirme —</option>
            <option value="pass" ${it.status==="pass"?"selected":""}>✅ Uygun</option>
            <option value="fail" ${it.status==="fail"?"selected":""}>❌ Uygunsuz</option>
            <option value="nc" ${it.status==="nc"?"selected":""}>⚠️ Minör NC</option>
            <option value="major" ${it.status==="major"?"selected":""}>🚨 Majör NC</option>
            <option value="na" ${it.status==="na"?"selected":""}>➖ Uygulanmaz</option>
          </select>
          <input data-note="${i}" placeholder="Kanıt / not" value="${UI.escape(it.note || "")}">
        </div>
      </div>
    `).join("");
    wrap.querySelectorAll("[data-del]").forEach(b => b.onclick = e => {
      this.state.items.splice(+e.target.dataset.del, 1);
      this.renderItems(root);
      this.renderScore(root);
    });
    wrap.querySelectorAll("[data-status]").forEach(s => s.onchange = e => {
      this.state.items[+e.target.dataset.status].status = e.target.value;
      this.renderScore(root);
    });
    wrap.querySelectorAll("[data-note]").forEach(n => n.oninput = e => {
      this.state.items[+e.target.dataset.note].note = e.target.value;
    });
  },

  score(items) {
    items = items || this.state.items;
    let pass = 0, fail = 0, nc = 0, major = 0, na = 0, pending = 0;
    items.forEach(i => {
      if (i.status === "pass") pass++;
      else if (i.status === "fail") fail++;
      else if (i.status === "nc") nc++;
      else if (i.status === "major") major++;
      else if (i.status === "na") na++;
      else pending++;
    });
    const eval_ = items.length - na - pending;
    const pct = eval_ > 0 ? Math.round((pass / eval_) * 100) : 0;
    return { total: items.length, pass, fail, nc, major, na, pending, eval: eval_, pct };
  },

  renderScore(root) {
    const wrap = root.querySelector("#scoreWrap");
    if (!wrap) return;
    if (!this.state.items.length) { wrap.innerHTML = ""; return; }
    const s = this.score();
    wrap.innerHTML = `
      <div class="card">
        <h3>📊 Skor Tablosu</h3>
        <div class="kpi-grid">
          <div class="kpi success"><div class="label">Uygun</div><div class="value">${s.pass}</div></div>
          <div class="kpi amber"><div class="label">Minör NC</div><div class="value">${s.nc}</div></div>
          <div class="kpi danger"><div class="label">Uygunsuz + Majör</div><div class="value">${s.fail + s.major}</div></div>
          <div class="kpi"><div class="label">N/A</div><div class="value">${s.na}</div></div>
          <div class="kpi"><div class="label">Bekleyen</div><div class="value">${s.pending}</div></div>
          <div class="kpi ${s.pct>=Targets.get("audit.target")?"success":s.pct>=Targets.get("audit.acceptable")?"amber":"danger"}"><div class="label">Skor</div><div class="value">${s.pct}%</div></div>
        </div>
      </div>
    `;
  },

  clearForm(root) {
    ["title","auditor","date","area","standard"].forEach(k => root.querySelector("#" + k).value = "");
    this.state.items = [];
    this.state.editingId = null;
    this.renderItems(root);
    this.renderScore(root);
    root.querySelector("#saveBtn").textContent = "💾 Kaydet";
  },

  save(root) {
    const title = root.querySelector("#title").value.trim();
    if (!title) { UI.toast("Başlık gerekli", "danger"); return; }
    const s = this.score();
    const data = {
      title,
      auditor: root.querySelector("#auditor").value,
      date: root.querySelector("#date").value,
      area: root.querySelector("#area").value,
      standard: root.querySelector("#standard").value,
      items: [...this.state.items],
      score: s
    };
    if (this.state.editingId) Storage.update(this.KEY, this.state.editingId, data);
    else Storage.add(this.KEY, data);
    UI.toast("Kaydedildi", "success");
    this.render(root);
  },

  renderList(root) {
    const wrap = root.querySelector("#listWrap");
    const list = Storage.getAll(this.KEY);
    if (!list.length) { wrap.innerHTML = UI.emptyState("📋", "Henüz denetim yok."); return; }
    wrap.innerHTML = list.map(it => {
      const s = it.score || this.score(it.items || []);
      const tone = s.pct >= Targets.get("audit.target") ? "success" : s.pct >= Targets.get("audit.acceptable") ? "amber" : "danger";
      return `
        <div class="list-item" data-id="${it.id}">
          <div class="li-main">
            <div class="li-title">${UI.escape(it.title)}</div>
            <div class="li-sub">${UI.escape(it.standard || "")} • ${UI.escape(it.date || "")} • ${UI.escape(it.area || "")}</div>
            <div class="li-sub">✅ ${s.pass} • ⚠️ ${s.nc} • ❌ ${s.fail + s.major} • Skor <span class="badge ${tone}">${s.pct}%</span></div>
          </div>
          <div class="li-actions">
            <button class="btn btn-outline btn-sm" data-action="edit">✏️</button>
            <button class="btn btn-danger btn-sm" data-action="del">🗑️</button>
          </div>
        </div>`;
    }).join("");
    wrap.querySelectorAll("[data-action=del]").forEach(b => b.onclick = e => {
      const id = e.target.closest(".list-item").dataset.id;
      if (UI.confirm("Silinsin mi?")) { Storage.remove(this.KEY, id); UI.toast("Silindi", "danger"); this.render(root); }
    });
    wrap.querySelectorAll("[data-action=edit]").forEach(b => b.onclick = e => {
      const id = e.target.closest(".list-item").dataset.id;
      const it = Storage.getOne(this.KEY, id);
      ["title","auditor","date","area","standard"].forEach(k => {
        const el = root.querySelector("#" + k); if (el) el.value = it[k] || "";
      });
      this.state.items = (it.items || []).map(x => ({ ...x }));
      this.state.editingId = id;
      this.renderItems(root);
      this.renderScore(root);
      root.querySelector("#saveBtn").textContent = "💾 Güncelle";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },

  analyze(records) {
    records = records || Storage.getAll(this.KEY);
    const insights = [], text = [];
    if (!records.length) return { insights: [Analyze.insight("info", "Denetim yok", "İlk denetiminizi ISO 9001 veya IATF şablonuyla başlatın.")], text: ["Kayıt yok."] };
    const avg = Math.round(records.reduce((s, r) => s + ((r.score && r.score.pct) || 0), 0) / records.length);
    insights.push(Analyze.insight("info", `${records.length} denetim • Ortalama skor: ${avg}%`, "Skor 80%+ hedef olmalı."));
    const withMajor = records.filter(r => r.score && r.score.major > 0).length;
    if (withMajor) insights.push(Analyze.insight("danger", `${withMajor} denetimde majör NC var`, "Majör uygunsuzluklar için 8D veya A3 açın — DMAIC improve aşamasına bağlayın."));
    const low = records.filter(r => r.score && r.score.pct < 60).length;
    if (low) insights.push(Analyze.insight("warn", `${low} denetim skoru 60% altında`, "Kök neden ve kapanış planı hazırlayın."));
    text.push(`Denetim: ${records.length}, Ortalama: ${avg}%, Majör NC'li: ${withMajor}`);
    return { insights, text };
  },

  renderAnalysis(root) {
    const wrap = root.querySelector("#analyzeWrap");
    if (!wrap) return;
    const records = Storage.getAll(this.KEY);
    if (!records.length) { wrap.innerHTML = Analyze.empty("📋", "Denetim ekleyin, otomatik yorum çıkar."); return; }
    const a = this.analyze(records);
    wrap.innerHTML = Analyze.card("📋", "Denetim Portföy Yorumu", "", a.insights.join(""));
  }
};
