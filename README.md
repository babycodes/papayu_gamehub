# Papayu GameHub

Gamehub untuk penjelajah kecil. Empat game: **Petualangan Memancing — Teluk Ceria**, **Tic Tac Toe**, **Catur**, dan **Mahjong Anak**, dibuat dengan JavaScript dan Canvas agar bisa dimainkan lewat browser HP maupun desktop.

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

27 tes memeriksa pencarian/filter/pagination library, hasil Tic Tac Toe dan bot yang tidak kalah, langkah Catur legal, rokade/en passant/promosi, skakmat dan bot, siklus ronde memancing, pemilihan nama/kubu serta pergantian pemain pada rematch, dan distribusi ubin, perpindahan otomatis ke lawan, pengambilan bidak, pilihan urutan kolom, pengelompokan gambar yang sama, giliran beruntun, dadu pembuka/seri, serta kemenangan setelah penyusunan Mahjong Anak. Tidak ada langkah build: server menyajikan modul JavaScript langsung.

## Game library

Library memiliki search, filter Petualangan/Arcade/Strategi, favorit, urutan nama atau paling dimainkan lokal, dan pagination (pilih 2, 6, atau 12 game per halaman). Tombol `/` memfokuskan pencarian. Favorit dan jumlah sesi yang dimulai tersimpan di browser; daftar paling dimainkan memakai jumlah sesi nyata di perangkat ini. Tidak ada akun, leaderboard global, atau angka pemain buatan.

## Tic Tac Toe & Catur

Pilih game dari library, lalu pilih **Lawan bot** atau **2 pemain lokal** (bergantian pada perangkat yang sama, bukan multiplayer online). Level bot **Santai** memilih langkah legal secara acak. Level **Pintar** memakai minimax optimal untuk Tic Tac Toe dan pencarian dua langkah untuk Catur; bot Catur ditujukan untuk permainan kasual, bukan kekuatan mesin kompetitif. Saat melawan bot, manusia bermain sebagai X atau putih.

- **Dua pemain lokal:** isi nama (opsional, maksimal 20 karakter) dan pilih kubu merah/biru. Memilih kubu satu pemain otomatis memberi kubu berbeda untuk pemain lainnya. Nama yang sama ditolak agar giliran jelas. Nama/kubu, warna simbol Tic Tac Toe, dan panel giliran aktif ditampilkan di atas/bawah papan. Panel aktif memiliki border hijau kontras dan label **▶ GILIRANMU**; pemain lain bertanda **MENUNGGU**. Warna kubu terpisah dari warna bidak Catur.
- **Lawan bot:** panel Bot berada di atas papan dan Kamu di bawah, dengan border hijau pada pemain yang sedang mendapat giliran. Catur dimulai dengan bidak putih di sisi pemain.
- **Main lagi:** langsung memulai ronde baru dengan lawan dan tingkat bot yang sama. Nama/kubu tetap; dua pemain lokal bergantian mendapat X atau putih. Kubu tetap di sisi yang sama, dan orientasi Catur menyesuaikan saat giliran awal berganti.
- **Akhiri / mode:** ganti lawan bot/lokal atau nama/kubu langsung dari game. Pertandingan aktif/dijeda meminta konfirmasi **Akhiri & pilih mode** sebelum progres dihapus. Membatalkan mengembalikan keadaan sebelumnya; konfirmasi menghentikan bot dan membuka pilihan mode tanpa kembali ke Gamehub. Nama/kubu sebelumnya tetap tersedia di formulir. Setelah pertandingan selesai, pilihan mode terbuka langsung.
- **Tic Tac Toe:** ketuk kotak kosong untuk menaruh simbol. Tiga simbol berbaris menang; papan penuh tanpa pemenang berakhir seri.
- **Catur:** pilih bidak lalu kotak legal bertanda titik. Mendukung skak/skakmat, rokade, en passant, dan pilihan promosi menteri/benteng/gajah/kuda. Remis otomatis untuk stalemate, pengulangan posisi tiga kali, material tidak cukup, atau aturan 50 langkah. Riwayat langkah memakai notasi SAN; tombol Putar papan mengubah orientasi.
- Gunakan **Jeda** / Escape untuk berhenti sementara. Bot juga berhenti saat jeda, tab tidak aktif, atau menu keluar terbuka.
- Tombol Gamehub dan Back browser meminta konfirmasi untuk pertandingan yang belum selesai. Modal berada di dalam layar game, menjeda permainan dan menonaktifkan interaksi di belakangnya. Tombol lanjut/keluar mendukung sentuhan; Tab menjaga fokus di modal dan Escape membatalkan. **Akhiri & ganti mode** juga tersedia dari menu jeda. Main lagi tersedia setelah pertandingan berakhir.
- Keempat game memakai layar penuh dengan fallback ke viewport pada browser yang tidak mendukung Fullscreen API.

## Mahjong Anak

Mainkan melawan bot atau dua pemain lokal. Nama dan kubu memakai formulir yang sama dengan game papan; pemain 1 memilih tema buah atau hewan, pemain 2 mendapat tema lainnya. Bot memilih ubin tertutup secara acak tanpa melihat isinya.

- Ada **32 ubin**: empat jenis buah dan empat jenis hewan, masing-masing empat salinan. Ubin diacak ke **dua papan**, masing-masing 16 ubin campuran.
- Di awal setiap ronde, masing-masing pemain **melempar dadu**. Nilai tertinggi mulai duluan; jika seri, keduanya melempar ulang. Pemain membuka **satu ubin dari papan sendiri**. Jika bidak milik lawan, **giliran langsung pindah ke lawan** dan bidak otomatis tersedia di area tengah. Lawan bisa menyeretnya langsung ke susunan atau mengetuk untuk mengambilnya. Bidak sendiri langsung masuk tangan sendiri. Selesaikan penyusunan sebelum membuka bidak berikutnya. Jika mendapat bidak sendiri, pemain terus bermain. Setelah bidak lawan disusun, penerima melanjutkan membuka bidaknya.
- Jika papan sendiri habis, pemain membuka ubin dari papan lawan. Panel giliran ditandai border hijau dan label **GILIRANMU**.
- **Urutan:** untuk gambar yang belum ada, pilih kolom kosong mana saja. Setelah kolom mempunyai gambar, semua bidak dengan gambar yang sama wajib disusun menurun di kolom tersebut; gambar lain tidak boleh bercampur.
- **Kontrol:** seret bidak dengan mouse, pena, atau sentuhan ke tujuan. Di HP, kedua zona pemain dan tujuan penyusunan tetap terlihat tanpa scroll. Alternatif: ketuk bidak, lalu tujuannya; ketuk bidak di area tengah untuk mengambilnya. Salah kolom ditolak tanpa kehilangan bidak.
- Pemain pertama yang selesai **menyusun** empat kolom (masing-masing 4 ubin, total 16) menang. Bidak yang masih di tangan atau area tengah belum dihitung. Tempat bidak yang sudah diambil ditandai centang.
- **Main lagi** mengacak ulang semua ubin dengan nama, tema, kubu, dan mode yang sama; kedua pemain melempar dadu lagi untuk menentukan giliran awal.
- **Akhiri / mode**, menu jeda, dan peringatan keluar berlaku seperti pada Tic Tac Toe/Catur. Di HP, kedua zona pemain dan area bidak aktif selalu terlihat tanpa scroll. Pemain utama berada di bawah dan lawan/bot di atas; dalam landscape pemain utama berada di kanan. Zona aktif menampilkan papan saat membuka bidak, lalu kolom koleksi saat menyusun. Progres selalu terlihat di nama pemain; dadu hanya tampil di awal ronde. Dalam posisi landscape kedua zona tampil berdampingan.

## Cara bermain memancing

1. Dari **Gamehub**, pilih **Masuk ke teluk**, lalu tekan **Mulai memancing** untuk memulai ronde 90 detik.
2. Tahan tombol **Turunkan kail**, area laut, atau tombol **Spasi**.
3. Geser jari/mouse di laut atau tekan **← →** untuk mengarahkan kail. Kail otomatis menggulung saat menyentuh ikan; lepaskan untuk menggulung lebih awal.
4. Ikan harus sampai di perahu agar poin dihitung. Saat waktu habis, ronde selesai.

| Lapisan | Penghuni          | Poin dasar |
| ------- | ----------------- | ---------- |
| 1       | Ikan kecil        | 10         |
| 2       | Ikan kuning       | 25         |
| 3       | Ikan karang       | 40         |
| 4       | Ikan besar        | 75         |
| 5       | Ikan bulan langka | 150        |

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
- `src/library.js`: pencarian, filter, favorit, pagination, dan statistik lokal.
- `src/boards.js`: UI papan, pilihan mode, promosi, dan lifecycle bot.
- `src/board-engine.js`: aturan Tic Tac Toe dan bot untuk Tic Tac Toe/Catur.
- `src/mahjong-engine.js`: pengacakan dua papan, perpindahan otomatis/pengambilan, pilihan urutan kolom, koleksi, dan kemenangan Mahjong Anak.
- `src/tile-ui.js`: dadu pembuka, area bidak aktif, susunan kolom, serta kontrol seret dengan mouse/pena/sentuhan.
- `src/catalog.js`: daftar game dan metadata mode. Untuk game berikutnya tambahkan metadata di sini dan handler peluncuran di `app.js`.
- `index.html` / `styles.css`: lobi Gamehub dan layout responsif.
- `server.js`: server statis Node.js. Hanya aset aplikasi dan file ESM `chess.js` yang boleh diakses; `node_modules` lain tetap ditolak.
- `test/engine.test.js` / `test/board-engine.test.js`: tes menggunakan runner bawaan Node.js.
- Dependency `chess.js` 1.4.0 (BSD-2-Clause) dikunci di package-lock.json untuk aturan Catur dan dihidangkan dari instalasi lokal, tanpa CDN.

Keempat game dapat dimainkan. Akun, ranking antar pemain, multiplayer online, dan versi Flutter/native APK belum dibuat.

## Privasi dan file rahasia

Aplikasi tidak membutuhkan `.env`, secret, akun, analytics, atau koneksi pihak ketiga. `.gitignore` mengecualikan file environment, kunci, credential, dependency, dan log. Server menolak dotfile dan file repository di luar daftar aset aplikasi. Jangan menaruh credential dalam kode JavaScript: semua kode client dapat dilihat pemain.
