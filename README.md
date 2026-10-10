# Papayu GameHub

Gamehub untuk penjelajah kecil. Sepuluh game, termasuk **Memory Match**, **Petualangan Memancing — Teluk Ceria**, **Tic Tac Toe**, **Catur**, dan **Mahjong Anak**, dibuat dengan JavaScript dan Canvas agar bisa dimainkan lewat browser HP maupun desktop.

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

53 tes memeriksa pencarian/filter/pagination library, hasil Tic Tac Toe dan bot yang tidak kalah, langkah Catur legal, rokade/en passant/promosi, skakmat dan bot, siklus ronde memancing, ukuran ikan dan area sentuh, tantangan tarikan, jeda saat menarik, tiga tahap buaya, pemulihan laut, misi dan reset ronde, pemilihan nama/kubu serta pergantian pemain pada rematch, dan distribusi ubin, perpindahan otomatis ke lawan, pengambilan bidak, pilihan urutan kolom, pengelompokan gambar yang sama, giliran beruntun, dadu pembuka/seri, serta kemenangan setelah penyusunan Mahjong Anak. Tes juga memeriksa pasangan Memory Match, kemenangan/bot Connect Four, fisika/gol Air Hockey, start palsu dan waktu reaksi, puzzle yang selalu bisa diselesaikan, serta combo, bonus waktu, dan pergantian ronde Tangkap Bintang. Tidak ada langkah build: server menyajikan modul JavaScript langsung.

## Game library

Library memiliki search, filter Petualangan/Arcade/Strategi, favorit, urutan nama atau paling dimainkan lokal, dan pagination (pilih 2, 6, atau 12 game per halaman). Tombol `/` memfokuskan pencarian. Favorit dan jumlah sesi yang dimulai tersimpan di browser; daftar paling dimainkan memakai jumlah sesi nyata di perangkat ini. Tidak ada akun, leaderboard global, atau angka pemain buatan.

## Enam game baru

| Game                | Mode                       | Pilihan dan kontrol                                                                                                                                                                                                                                           |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Memory Match**    | Solo / 2 pemain            | Enam tema: hewan, buah, kendaraan, alam, laut, dan campuran. Pilih **4–20 pasangan (8–40 kartu)** lewat slider atau tombol 10/15/20. Ketuk dua kartu; pasangan cocok memberi poin dan giliran lanjut. Jika tidak cocok, giliran berpindah. Tanpa batas waktu. |
| **Connect Four**    | Bot / 2 pemain             | Jatuhkan keping ke salah satu dari tujuh kolom. Empat berurutan mendatar, tegak, atau diagonal menang. Bot Santai/Pintar.                                                                                                                                     |
| **Air Hockey**      | Bot / 2 pemain             | Geser pemukul di sisi masing-masing. Dua sentuhan sekaligus untuk duel lokal; keyboard panah untuk pemain utama dan WASD untuk lawan lokal. Pilih target 3/5/7 gol dan tingkat bot.                                                                           |
| **Balap Reaksi**    | Bot / 2 pemain             | Tunggu lampu hijau lalu ketuk tombol sendiri. Menekan terlalu cepat memberi poin ke lawan. Pilih 3/5/7 ronde. Keyboard Spasi untuk pemain utama, W untuk pemain kedua.                                                                                        |
| **Puzzle Geser**    | Solo                       | Papan 3×3 atau 4×4, gambar rubah/paus/angkasa, dan acakan mudah/normal. Ketuk bidak dekat kotak kosong atau gunakan panah. Tombol gambar utuh dan petunjuk membantu menyelesaikan puzzle. Semua acakan bisa diselesaikan.                                     |
| **Tangkap Bintang** | Solo / 2 pemain bergantian | Geser keranjang atau gunakan panah/A-D. Pilih 30/45/60 detik per pemain. Bintang emas, combo, frenzy, bonus waktu terbatas, dan bom membuat skor bervariasi. Kedua pemain mendapat durasi dasar yang sama.                                                    |

Semua game mendukung layar penuh, jeda, peringatan keluar, dan main ulang langsung dengan pengaturan yang sama. Duel lokal memakai nama/kubu serta border hijau aktif; pemain utama berada di bawah, lawan di atas. Main ulang duel bergantian menentukan pemain pembuka. Memory Match menyediakan 100 gambar unik dari lima tema dan satu tema campuran, memakai emoji lokal, tanpa unduhan atau layanan gambar eksternal; bentuk gambar mengikuti dukungan perangkat.

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
- Semua game memakai layar penuh dengan fallback ke viewport pada browser yang tidak mendukung Fullscreen API.

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

1. Dari **Gamehub**, pilih **Main memancing**, tentukan **Santai** atau **Tantangan**, lalu mulai ronde 90 detik. Santai memberi area tarikan lebih lebar dan waktu lebih longgar.
2. Tahan tombol besar, area laut, atau **Spasi** untuk menurunkan kail. Geser di laut atau tekan **← →** untuk mengarahkan. Lepaskan untuk menarik kail kosong.
3. Ikan kecil otomatis digulung. Ikan besar membuka tantangan singkat: **hiu** meminta geser mengikuti lingkaran hijau, **hiu paus** meminta tahan Gulung, dan **buntal** meminta menunggu hijau lalu tahan Gulung. Tidak perlu mengetuk cepat. Di HP, bisa menahan tombol dengan satu jari dan mengarahkan di laut dengan jari lain.
4. Ikan harus sampai di perahu agar poin, misi, dan stiker dihitung. Jika lepas, poin sebelumnya tetap aman. Saat waktu habis, tangkapan yang belum sampai tidak dihitung.

| Lapisan | Penghuni        | Poin dasar |
| ------- | --------------- | ---------- |
| 1       | Ikan kecil      | 10         |
| 2       | Ikan kuning     | 25         |
| 3       | Ikan buntal     | 60         |
| 4       | Hiu             | 100        |
| 5       | Hiu paus langka | 180        |

- **Combo:** tangkap lagi dalam 8 detik untuk meningkatkan pengali hingga ×4.
- **Laut Raksasa:** setiap 25 detik, semua ikan biasa membesar hingga ×1,6 dan poin menjadi ×2 selama 8 detik. Bintang ajaib bernilai dasar 200 muncul di lapisan 5. Ukuran gambar dan area tangkap mengikuti ukuran layar.
- **Buaya ceria:** mulai sekitar detik ke-48, setelah tangkapan sebelumnya selesai. Ikan menepi dan muncul bayangan selama 2 detik. Buaya besar kemudian bisa dikail; selesaikan **ikuti arah → tahan gulung → tunggu hijau**. Hadiah dasar 500 poin dan +8 detik saat sampai perahu. Ikan kembali setelah buaya tertangkap atau pergi. Buaya hanya datang sekali per ronde; selama kunjungan buaya, Laut Raksasa ditunda/dinonaktifkan.
- **Bonus waktu:** jam bercahaya di lapisan 3 memberi +12 detik saat sampai di perahu.
- **Misi:** tangkap 3 ikan besar, 1 buntal, dan 1 buaya. Setiap misi membuka stiker; kemajuan misi dimulai ulang setiap ronde.
- **Buku stiker:** enam jenis tangkapan dan tiga lencana misi tersimpan di browser perangkat dan terlihat dalam panduan memancing di Gamehub. Stiker dari tangkapan yang sudah sampai tetap tersimpan meskipun ronde berikutnya ditinggalkan.
- **Level:** gelar Sahabat Laut pada 300 poin dan Kapten Teluk Ceria pada 900 poin.
- **Jeda:** tombol jeda atau Escape. Permainan juga berhenti otomatis saat tab tidak aktif. Pilih Lanjut untuk meneruskan.
- **Layar penuh:** game memenuhi viewport tanpa panel informasi atau scroll. Browser yang mendukung Fullscreen API juga masuk layar penuh; tombol di kanan atas dapat mengubahnya. Browser yang tidak mendukungnya (termasuk sebagian browser iPhone) tetap memakai seluruh area halaman yang tersedia.
- **Keluar:** tombol **Gamehub** membawa kembali ke lobi. Ronde aktif atau dijeda meminta konfirmasi; batal akan mengembalikan keadaan sebelumnya, termasuk jeda. Skor ronde yang ditinggalkan tidak disimpan sebagai rekor. Tombol Back browser juga memakai peringatan ini; refresh/menutup tab memakai peringatan bawaan browser bila didukung.
- **Rekor:** disimpan di browser perangkat, tanpa akun atau pengiriman data. Suara dapat dimatikan.

## Struktur dan pengembangan berikutnya

- `src/engine.js`: aturan permainan, waktu, skor, spawn ikan, dan pergerakan kail; terpisah dari tampilan agar mudah dijadikan referensi untuk port Flutter.
- `src/app.js`: gambar Canvas, input sentuh/keyboard, suara, pergantian halaman, dan menu keluar.
- `src/library.js`: pencarian, filter, favorit, pagination, dan statistik lokal.
- `src/arcade.js`: tampilan, pilihan mode, input sentuh/keyboard, jeda, dan main ulang untuk enam game baru.
- `src/memory-engine.js`, `src/connect-engine.js`, `src/hockey-engine.js`, `src/reaction-engine.js`, `src/puzzle-engine.js`, `src/stars-engine.js`: aturan game baru yang terpisah dari UI.
- `src/boards.js`: UI papan, pilihan mode, promosi, dan lifecycle bot.
- `src/board-engine.js`: aturan Tic Tac Toe dan bot untuk Tic Tac Toe/Catur.
- `src/mahjong-engine.js`: pengacakan dua papan, perpindahan otomatis/pengambilan, pilihan urutan kolom, koleksi, dan kemenangan Mahjong Anak.
- `src/tile-ui.js`: dadu pembuka, area bidak aktif, susunan kolom, serta kontrol seret dengan mouse/pena/sentuhan.
- `src/catalog.js`: daftar game dan metadata mode. Untuk game berikutnya tambahkan metadata di sini dan handler peluncuran di `app.js`.
- `index.html` / `styles.css`: lobi Gamehub dan layout responsif.
- `server.js`: server statis Node.js. Hanya aset aplikasi dan file ESM `chess.js` yang boleh diakses; `node_modules` lain tetap ditolak.
- `test/engine.test.js` / `test/board-engine.test.js`: tes menggunakan runner bawaan Node.js.
- Dependency `chess.js` 1.4.0 (BSD-2-Clause) dikunci di package-lock.json untuk aturan Catur dan dihidangkan dari instalasi lokal, tanpa CDN.

Kesepuluh game dapat dimainkan. Akun, ranking antar pemain, multiplayer online, dan versi Flutter/native APK belum dibuat.

## Privasi dan file rahasia

Aplikasi tidak membutuhkan `.env`, secret, akun, analytics, atau koneksi pihak ketiga. `.gitignore` mengecualikan file environment, kunci, credential, dependency, dan log. Server menolak dotfile dan file repository di luar daftar aset aplikasi. Jangan menaruh credential dalam kode JavaScript: semua kode client dapat dilihat pemain.
