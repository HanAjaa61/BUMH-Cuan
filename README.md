# 💰 BUMH CUAN — Game Web Vue 3 + Phaser 3

Game clicker edukatif berbasis bisnis. Klik untuk cuan, upgrade income, dan jawab soal bisnis menggunakan AI (Groq).

---

## 📁 Struktur Folder

```
bumh-cuan/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js
    ├── App.vue                        ← UI utama (HUD, soal, upgrade)
    ├── composables/
    │   └── useGameState.js            ← State management + logika game + Groq API
    └── scenes/
        └── GameScene.js               ← Phaser 3 scene (animasi, klik visual)
```

---

## 🚀 Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev

# 3. Build untuk produksi
npm run build
```

---

## 🔑 Setup Groq API Key

1. Daftar di https://console.groq.com
2. Buat API Key baru
3. Masukkan API Key di kolom input pada halaman Start game
4. API Key disimpan di state (tidak dikirim ke server selain Groq)

**Model yang digunakan:** `llama3-8b-8192` (gratis, cepat)

---

## 🎮 Cara Main

| Aksi | Keterangan |
|------|------------|
| **Klik tombol kuning** di game | +Rp 1.000 per klik (default) |
| **Beli Upgrade** | Tingkatkan income per klik |
| **Beli Soal** | Bayar uang untuk membuka soal |
| **Jawab Soal** | AI menilai jawaban kamu |
| **WIN** | Rp 100.000 + semua soal selesai |

---

## 🏆 Win Condition

- Uang ≥ Rp 100.000 **DAN**
- Semua 5 soal bisnis dijawab dengan benar

---

## ⚡ Upgrade Tiers

| Level | Nama | Income/Klik | Harga |
|-------|------|-------------|-------|
| 0 | Basic Hustle | Rp 1.000 | Gratis |
| 1 | Side Hustle | Rp 3.000 | Rp 8.000 |
| 2 | Reseller Pro | Rp 6.000 | Rp 20.000 |
| 3 | Dropship King | Rp 12.000 | Rp 45.000 |
| 4 | BUMH Investor | Rp 25.000 | Rp 90.000 |

---

## 📚 Soal Bisnis

| # | Topik | Harga |
|---|-------|-------|
| 1 | Modal Kerja (Working Capital) | Rp 5.000 |
| 2 | Break Even Point (BEP) | Rp 10.000 |
| 3 | Gross Profit vs Net Profit | Rp 20.000 |
| 4 | Diversifikasi Produk | Rp 35.000 |
| 5 | Analisis SWOT | Rp 50.000 |

---

## 🧠 Cara Kerja AI Grading

```
User jawab soal
    ↓
fetch ke Groq API (llama3-8b-8192)
    ↓
System prompt: "Nilai MAKNA, bukan kata per kata. Jawab BENAR atau SALAH saja."
    ↓
AI balas "BENAR" → soal selesai ✅
AI balas "SALAH" → soal dikunci ulang 🔒 (harus beli lagi)
```

---

## 🛠 Stack

- **Vue 3** (Composition API)
- **Phaser 3** (game engine untuk animasi)
- **Vite** (bundler)
- **Groq API** (LLM grading)
- Tanpa Vuex/Pinia — pakai `reactive()` singleton di composable
