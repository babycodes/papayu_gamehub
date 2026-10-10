# Papayu GameHub

Gamehub untuk penjelajah kecil. Game pertama: **Petualangan Memancing — Teluk Ceria**, dibuat dengan JavaScript dan Canvas agar bisa dimainkan lewat browser HP maupun desktop.

## Menjalankan

Prasyarat: Node.js 20 atau lebih baru. Tidak memerlukan API key, database, atau layanan berbayar.

```sh
npm ci --ignore-scripts --no-audit --no-fund --cache /tmp/papayu-npm-cache
npm start
```

Server berjalan pada **port 4949**, bind ke `0.0.0.0`. Untuk mengganti port gunakan `PORT=... npm start`. Pada jaringan lokal, HP dapat membuka alamat IP komputer dengan port tersebut.

```sh
npm test
```

Enam tes memeriksa siklus ronde, tangkapan dan combo, bonus waktu, frenzy, jeda, serta reset permainan. Tidak ada langkah build: server menyajikan modul JavaScript langsung.

## Cara bermain

1. Dari **Gamehub**, pilih **Masuk ke teluk**, lalu tekan **Mulai memancing** untuk memulai ronde 90 detik.
2. Tahan tombol **Turunkan kail**, area laut, atau tombol **Spasi**.
3. Geser jari/mouse di laut atau tekan **← →** untuk mengarahkan kail. Kail otomatis menggulung saat menyentuh ikan; lepaskan untuk menggulung lebih awal.
4. Ikan harus sampai di perahu agar poin dihitung. Saat waktu habis, ronde selesai.

| Lapisan | Penghuni | Poin dasar |
| --- | --- | --- |
| 1 | Ikan kecil | 10 |
| 2 | Ikan kuning | 25 |
| 3 | Ikan karang | 40 |
| 4 | Ikan besar | 75 |
| 5 | Ikan bulan langka | 150 |

- **Combo:** tangkap lagi dalam 8 detik untuk meningkatkan pengali hingga ×4.
- **Frenzy:** setiap 25 detik, poin menjadi ×2 selama 8 detik. Ikan bintang ajaib bernilai dasar 200 muncul di lapisan 5.
- **Bonus waktu:** jam bercahaya di lapisan 3 memberi +12 detik saat sampai di perahu.
- **Level:** gelar Sahabat Laut pada 300 poin dan Kapten Teluk Ceria pada 900 poin.
- **Jeda:** tombol jeda atau Escape. Permainan juga berhenti otomatis saat tab tidak aktif. Pilih Lanjut untuk meneruskan.
- **Layar penuh:** game memenuhi viewport tanpa panel informasi atau scroll. Browser yang mendukung Fullscreen API juga masuk layar penuh; tombol di kanan atas dapat mengubahnya. Browser yang tidak mendukungnya (termasuk sebagian browser iPhone) tetap memakai seluruh area halaman yang tersedia.
- **Keluar:** tombol **Gamehub** membawa kembali ke lobi. Ronde aktif atau dijeda meminta konfirmasi; batal akan mengembalikan keadaan sebelumnya, termasuk jeda. Skor ronde yang ditinggalkan tidak disimpan sebagai rekor. Tombol Back browser juga memakai peringatan ini; refresh/menutup tab memakai peringatan bawaan browser bila didukung.
- **Rekor:** disimpan di browser perangkat, tanpa akun atau pengiriman data. Suara dapat dimatikan.

## Struktur dan pengembangan berikutnya

- `src/engine.js`: aturan permainan, waktu, skor, spawn ikan, dan pergerakan kail; terpisah dari tampilan agar mudah dijadikan referensi untuk port Flutter.
- `src/app.js`: gambar Canvas, input sentuh/keyboard, suara, pergantian halaman, dan menu keluar.
- `src/catalog.js`: daftar game, status ketersediaan, dan metadata mode. Untuk game berikutnya tambahkan metadata di sini dan handler peluncuran di `app.js`.
- `index.html` / `styles.css`: lobi Gamehub dan layout responsif.
- `server.js`: server statis tanpa dependency. Hanya aset aplikasi yang boleh diakses.
- `test/engine.test.js`: tes logika menggunakan runner bawaan Node.js.

Lobi saat ini berisi satu game yang dapat dimainkan, panduan, skor ikan, bonus, dan rekor. Tic Tac Toe dan Catur ditandai **segera hadir**; mode 2 pemain lokal dan lawan bot masih rencana untuk implementasi berikutnya. Versi Flutter/native APK adalah tahap berikutnya; belum dibuat.

## Privasi dan file rahasia

Aplikasi tidak membutuhkan `.env`, secret, akun, analytics, atau koneksi pihak ketiga. `.gitignore` mengecualikan file environment, kunci, credential, dependency, dan log. Server menolak dotfile dan file repository di luar daftar aset aplikasi. Jangan menaruh credential dalam kode JavaScript: semua kode client dapat dilihat pemain.
