# 🏭 Yalın Üretim - Fabrika Mobil Uygulaması

Fabrikalar için kapsamlı, profesyonel ve offline çalışan bir **Yalın Üretim** uygulaması (PWA).

## ✨ Özellikler

- 📱 **Mobil Uyumlu**: Telefon ve tablet için optimize edilmiş endüstriyel tasarım
- 🔌 **Offline Çalışır**: Tüm veriler cihazda (`localStorage`) saklanır
- 📲 **Kurulabilir**: Telefon ana ekranına eklenebilir (PWA)
- 🇹🇷 **Tamamen Türkçe** arayüz

## 🧰 Araçlar (22 Adet)

### 🧠 Problem Çözme
- ❓ **5 Neden Analizi** – zincirleme neden-sonuç
- 🐟 **Balık Kılçığı (Ishikawa)** – 6M kategorili (İnsan/Makine/Yöntem/Malzeme/Çevre/Ölçüm)
- 📊 **Pareto Analizi** – 80/20 otomatik hesaplama + grafik
- 📋 **A3 Raporu** – 8 bölümlü profesyonel form
- 🔄 **PDCA** – renkli Plan-Do-Check-Act döngüsü
- 🔍 **Kök Neden Analizi (RCA)**

### 🏭 Yalın Üretim
- ⏱️ **Takt Zamanı** – formül + otomatik hesaplama
- 📊 **OEE / TPM** – Kullanılabilirlik × Performans × Kalite (dairesel gösterge)
- ⚡ **SMED** – iç/dış faaliyet analizi, kazanç hesaplama
- 🗺️ **VSM (Değer Akış Haritalama)** – düğüm ekleme, VA/NVA metrikleri
- ✅ **5S Denetimi** – 5 kategori, kaydırıcı puanlama
- 🃏 **Kanban Panosu** – 3 sütun, sürükle-bırak, öncelik
- 🚦 **Andon Sistemi** – 4 renkli (kırmızı blink animasyonu)
- 📦 **Heijunka** – haftalık üretim dengeleme
- 💡 **Kaizen** – before/after, tasarruf takibi
- 🗑️ **Muda/Mura/Muri** – üç sekmeli analiz
- 🛡️ **Poka-Yoke** – kayıt + seviye değerlendirmesi
- ⏳ **JIT** – ROP, güvenlik stoğu, EOQ
- 🤖 **Jidoka** – olay kaydı
- 🪪 **SQDCP Panosu**
- 👣 **Gemba Yürüyüşü**
- 🌅 **Asakai** – sabah toplantısı formu

## 🎛️ Her Araçta
✅ Ekle • 💾 Kaydet • ✏️ Düzenle • 🗑️ Sil • kalıcı depolama

## 🚀 Çalıştırma

```bash
# Basit bir HTTP sunucusu yeterli
python3 -m http.server 8000
# veya
npx serve
```

Tarayıcıda `http://localhost:8000` adresine gidin.

## 📱 Telefonda Kurulum

1. Telefon tarayıcısında (Chrome/Safari) uygulamayı açın
2. Menüden **"Ana Ekrana Ekle"** seçin
3. Artık uygulama gibi çalışır

## 📁 Yapı

```
/
├── index.html        → Ana giriş
├── manifest.json     → PWA manifesti
├── css/styles.css    → Endüstriyel tema
├── icons/            → SVG ikonlar
└── js/
    ├── app.js        → Router + bootstrap
    ├── storage.js    → localStorage katmanı
    ├── ui.js         → UI yardımcıları
    ├── dashboard.js  → Ana panel
    ├── reports.js    → Raporlar / yedekleme
    └── tools/        → 22 araç (her biri bağımsız modül)
```

## 💾 Veri Yönetimi

- **Dışa Aktar**: Raporlar sayfasından JSON olarak indir
- **İçe Aktar**: JSON yedeğini geri yükle
- **Metin Rapor**: Tüm kayıtlar .txt formatında
- **Tümünü Sil**: Fabrika ayarlarına döndür

Tasarım: 📐 Endüstriyel mavi-sarı tema • 📱 Mobil öncelikli • 🔌 Offline-first
