# Papayu GameHub

Gamehub untuk penjelajah kecil. Sebelas game, termasuk **Bom Bom**, **Memory Match**, **Petualangan Memancing — Teluk Ceria**, **Tic Tac Toe**, **Catur**, dan **Mahjong Anak**, dibuat dengan JavaScript dan Canvas agar bisa dimainkan lewat browser HP maupun desktop.

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

112 tes memeriksa pencarian/filter/pagination library, hasil Tic Tac Toe dan bot yang tidak kalah, langkah Catur legal, rokade/en passant/promosi, skakmat dan bot, siklus ronde memancing, ukuran ikan dan area sentuh, tantangan tarikan, jeda saat menarik, tiga tahap buaya, pemulihan laut, timer frenzy ikan/bintang yang terpisah dan reset ronde, pemilihan nama/kubu serta pergantian pemain pada rematch, dan distribusi ubin, perpindahan otomatis ke lawan, pengambilan bidak, pilihan urutan kolom, pengelompokan gambar yang sama, giliran beruntun, dadu pembuka/seri, serta kemenangan setelah penyusunan Mahjong Anak. Tes juga memeriksa pasangan Memory Match, kemenangan/bot Connect Four, fisika/gol Air Hockey, start palsu dan waktu reaksi, puzzle yang selalu bisa diselesaikan, serta combo, bonus waktu, dan pergantian ronde Tangkap Bintang. Tidak ada langkah build: server menyajikan modul JavaScript langsung.

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

Mainkan melawan bot atau dua pemain lokal. Nama dan kubu memakai formulir yang sama dengan game papan; masing-masing pemain memilih tema berbeda: **Shinchan**, **SpongeBob**, **Super Mario**, **Buah**, atau **Hewan**. Pilihan karakter menampilkan enam potret vektor berbeda per seri, dengan pratinjau sebelum bermain. Bot memilih ubin tertutup secara acak tanpa melihat isinya.

- Ada **48 bidak** dari dua tema yang dipilih: enam gambar per tema, masing-masing empat salinan. Bidak diacak ke **dua papan**, masing-masing **24 bidak campuran, 6 kolom × 4 baris**.
- Di awal setiap ronde, masing-masing pemain **melempar dadu**. Nilai tertinggi mulai duluan; jika seri, keduanya melempar ulang. Pemain membuka **satu ubin dari papan sendiri**. Jika bidak milik lawan, **giliran langsung pindah ke lawan** dan bidak otomatis tersedia di area tengah. Lawan bisa menyeretnya langsung ke susunan atau mengetuk untuk mengambilnya. Bidak sendiri langsung masuk tangan sendiri. Selesaikan penyusunan sebelum membuka bidak berikutnya. Jika mendapat bidak sendiri, pemain terus bermain. Setelah bidak lawan disusun, penerima melanjutkan membuka bidaknya.
- Jika papan sendiri habis, pemain membuka ubin dari papan lawan. Panel giliran ditandai border hijau dan label **GILIRANMU**.
- **Urutan:** untuk gambar yang belum ada, pilih kolom kosong mana saja. Setelah kolom mempunyai gambar, semua bidak dengan gambar yang sama wajib disusun menurun di kolom tersebut; gambar lain tidak boleh bercampur.
- **Kontrol:** seret bidak dengan mouse, pena, atau sentuhan ke tujuan. Di HP, kedua zona pemain dan tujuan penyusunan tetap terlihat tanpa scroll. Alternatif: ketuk bidak, lalu tujuannya; ketuk bidak di area tengah untuk mengambilnya. Salah kolom ditolak tanpa kehilangan bidak.
- Pemain pertama yang selesai **menyusun** enam kolom (masing-masing 4 bidak, total 24) menang. Bidak yang masih di tangan atau area tengah belum dihitung. Tempat bidak yang sudah diambil ditandai centang.
- **Main lagi** mengacak ulang semua ubin dengan nama, tema, kubu, dan mode yang sama; kedua pemain melempar dadu lagi untuk menentukan giliran awal.
- **Akhiri / mode**, menu jeda, dan peringatan keluar berlaku seperti pada Tic Tac Toe/Catur. Di HP, kedua zona pemain dan area bidak aktif selalu terlihat tanpa scroll. Pemain utama berada di bawah dan lawan/bot di atas; dalam landscape pemain utama berada di kanan. Zona aktif menampilkan papan saat membuka bidak, lalu kolom koleksi saat menyusun. Progres selalu terlihat di nama pemain; dadu hanya tampil di awal ronde. Dalam posisi landscape kedua zona tampil berdampingan.

Potret karakter merupakan ilustrasi SVG kecil yang dibundel di `src/tile-characters.js`, tanpa layanan gambar, CDN, atau dependency tambahan. Bidak di tangan, susunan koleksi, pratinjau, dan bayangan drag menggunakan gambar yang sama; label karakter tetap tersedia untuk pembaca layar. Rematch mempertahankan kedua tema dan mengosongkan kembali seluruh 24 slot koleksi.

## Cara bermain memancing

1. Dari **Gamehub**, pilih **Main memancing**, tentukan **Santai** atau **Tantangan**, lalu mulai ronde 90 detik. Santai memberi area tarikan lebih lebar dan waktu lebih longgar.
2. Tahan tombol besar, area laut, atau **Spasi** untuk menurunkan kail. Geser di laut atau tekan **← →** untuk mengarahkan. Lepaskan untuk menarik kail kosong.
3. Ikan kecil otomatis digulung. Ikan besar membuka tantangan singkat: **hiu** meminta geser mengikuti lingkaran hijau, **hiu paus** meminta tahan Gulung, dan **buntal** meminta menunggu hijau lalu tahan Gulung. Tidak perlu mengetuk cepat. Di HP, bisa menahan tombol dengan satu jari dan mengarahkan di laut dengan jari lain.
4. Ikan harus sampai di perahu agar poin dan stiker dihitung. Jika lepas, poin sebelumnya tetap aman. Saat waktu habis, tangkapan yang belum sampai tidak dihitung.

| Lapisan | Penghuni        | Poin dasar |
| ------- | --------------- | ---------- |
| 1       | Ikan kecil      | 10         |
| 2       | Ikan kuning     | 25         |
| 3       | Ikan buntal     | 60         |
| 4       | Hiu             | 100        |
| 5       | Hiu paus langka | 180        |

- **Combo:** tangkap lagi dalam 8 detik untuk meningkatkan pengali hingga ×4.
- **Laut Raksasa:** ikan membesar dan mendapat poin ×2 selama **5 detik**, mulai pada detik ke-25, lalu setiap interval 25 detik. Ikan kecil langsung digulung tanpa tantangan tahan tombol meskipun membesar. Ikan kembali ke ukuran biasa setelah 5 detik; timer ini tetap berjalan selama tantangan ikan besar.
- **Bintang besar:** mendapat jendela poin ×2 sendiri selama **15 detik**, terpisah dari ikan. Bintang tetap besar dan tersedia sampai dikail, termasuk setelah bonus ×2 selesai. Jika lepas, bintang kembali ke laut. Timer ronde dan timer bonus bintang berhenti sementara selama bintang tersangkut. Kedua timer bonus berhenti saat jeda atau kunjungan boss.
- **Boss tanpa batas skor:** boss pertama **Buaya ceria di 2.000 poin**, kedua **Gurita raksasa di 4.000**, lalu tiap 2.000 sampai 20.000. Mulai **22.000**, gelombang berikutnya setiap **5.000 poin** (27.000, 32.000, 37.000, 42.000, dan seterusnya). Boss terus muncul setelah 40.000, 100.000, bahkan jutaan poin. Lonjakan skor tetap diproses per ambang secara berurutan setelah gelombang aktif selesai.
- **Gelombang bersama:** 1 boss di bawah 20.000, **2 mulai 20.000**, **3 mulai 40.000**, maksimal 3 seterusnya. Dengan interval baru, gelombang pertama berisi 3 datang pada **42.000**. Pemain menangkap satu per satu; monster lain tetap berenang. Ikan biasa kembali hanya setelah seluruh gelombang selesai atau pergi. Peringatan **DANGER** menampilkan jumlah dan nama boss selama 2 detik; indikator kecil menunjukkan boss yang masih tersisa.
- **Variasi monster:** sepuluh pertemuan awal mempertahankan boss utama yang dikenal. Mulai 22.000, pengacakan menggabungkan 29 karakter dasar, tiga belas siluet, tujuh palet warna, pola kulit, dan ciri kepala/punggung yang sesuai anatomi. Jenis hewan dalam satu gelombang berbeda dan tidak mengambil jenis dari gelombang sebelumnya. Ini memberi variasi kombinasi, bukan jaminan gambar unik selamanya. Ukuran, kecepatan, dan tarikan meningkat setiap 20.000, mencapai batas ramah anak pada 100.000; kemunculan dan variasi tetap berlanjut. Ukuran di HP dibatasi agar seluruh monster tetap terlihat; portrait menggunakan posisi berselang, landscape berjajar agar gambar dapat lebih besar.
- **Semua hewan bergerak:** ilustrasi vektor bergradasi dengan bentuk membulat. Ikan mengayunkan ekor dan sirip, mata berkedip, buntal mengembang, bintang berkilau, jam bonus bergerak, tentakel melambai, capit/kaki bergerak, pari mengepak, dan naga meliuk. Awan, cahaya matahari, perahu, dan tangan nelayan juga bergerak lembut. Tween.js mengatur kedatangan boss, reaksi tarikan, perubahan warna laut, dan perayaan tangkapan. Semua mengikuti satu loop game dan berhenti saat jeda; transisi dibersihkan saat kembali ke Gamehub atau main ulang. Tanpa bar misi di atas laut.
- **Gaya boss:** pilih **Monster seram kartun** atau **Monster lucu** sebelum mulai. Pilihan visual tidak mengubah aturan, skor, atau area tangkap. Pengaturan perangkat **reduced motion** menonaktifkan gerakan dekoratif dan langsung menyelesaikan transisi warna/kemunculan, sementara kontrol permainan tetap berfungsi.
- **Rantai makanan boss:** kekuatan ⚡ menentukan siapa yang boleh memangsa. Aura samar menunjukkan radius lingkaran dalam satuan piksel (tetap bulat di potret/lanskap). Saat tubuh korban lebih lemah menyentuh aura, boss langsung dimakan: korban terpancing langsung lepas tanpa penalti atau poin otomatis. Boss terpancing tidak boleh menyerang. Jika tidak ada sentuhan, pemangsa bebas mulai **mengejar** korban lebih lemah setelah **8 detik** sejak kedatangan atau makanan terakhir. Ia bergerak menuju posisi korban (atau kail jika korban terpancing), tetap di dalam laut, dan baru makan setelah menyentuh aura. Tidak ada konsumsi dari jauh. Memancing pemangsa membatalkan pengejarannya. Animasi mulut/korban tersedot berlangsung 0,65 detik dan kunyah/mutasi 2 detik; timer animasi tidak menunda konsumsi atau sentuhan berikutnya. Tidak ada garis lingkaran putih. Pemangsa menerima hadiah korban, setengah kekuatannya (dibulatkan ke atas), warna campuran dan ciri keluarga yang dimakan. Faktor ukuran berlipat 2× tiap makan (maksimal 4× dalam gelombang 3 boss); ukuran visual dibatasi layar HP. Hitungan gagal pemangsa tetap berlaku. Jeda/keluar/replay membekukan atau membersihkan proses tanpa timer tambahan.
- **Tarikan boss mutasi:** maksimal dua tingkat (2×/4×). Tiap tingkat mempercepat arah, mempersempit toleransi arah 0,015 dan zona hijau 0,025, serta menambah usaha tarikan 22%. Sebagai imbangan, **setiap tahap mendapat tambahan 2 detik per tingkat**: Santai 12/10/12 (2×), 14/12/14 (4×); Tantangan 10/8/10 (2×), 12/10/12 (4×). Tahap kedua semua boss bergantian antara gulung dan **LEPAS SEBENTAR** saat meronta (0,65 detik boss awal, 0,8/0,95 detik boss mutasi dalam siklus 3,2 detik). Tahan ketika meronta meningkatkan ketegangan; lepas menurunkannya. Jika terlalu tegang, progres mundur 18%, bukan langsung gagal. Mekanisme tiga kegagalan dan penalti tetap berlaku hanya ketika timer tahap habis. Semua boss, termasuk yang belum mutasi, kini memiliki tahap gulung/lepas. Ikan biasa mempertahankan tarikan satu tahap.

- **Variasi dan suasana:** 29 boss dasar dari 13 keluarga bentuk, termasuk kuda laut, Godzilla laut, ubur-ubur kosmik dan hydra. Warna, pola, kekuatan, dan mutasi memberi kombinasi acak. Ikan biasa bergerak memberontak saat dikail tanpa menambah tombol. Langit dan laut memakai jam lokal perangkat: pagi 05–11, siang 11–16, sore 16–19, malam 19–05, dengan awan, sinar, bulan dan bintang. Efek Web Audio untuk lempar/gulung kail, tangkapan, tahap tarikan, kemunculan, makan dan mutasi; tombol musik mematikan efek. Tidak ada aset audio unduhan, akses lokasi, dependency baru, atau proses server tambahan.
- **Menangkap boss:** tiga tahap **ikuti arah zigzag → gulung/lepas saat meronta → tunggu hijau**. Gerakan kail naik-turun lebih cepat, tubuh boss menyentak ke samping, ekor dan tentakelnya meronta. Boss memerlukan usaha tarikan lebih besar daripada ikan biasa. Timer ronde berhenti selama gelombang boss, termasuk tarikan ke perahu. Hadiah awal 500–725 poin; variasi acak 775–1.075 poin per monster dan **+8 detik per tangkapan**, tanpa pengali combo/frenzy. Boss berenang naik-turun dan diagonal, lalu memberontak ketika dikail. Setiap tahap memiliki timer sendiri: **Santai 10 / 8 / 10 detik**, **Tantangan 8 / 6 / 8 detik**. Setiap kegagalan mengurangi waktu ronde **3 detik (Santai)** atau **5 detik (Tantangan)**. Dua kegagalan pertama melepaskan boss ke laut untuk dicoba lagi dari tahap pertama; kegagalan ketiga membuat boss itu kabur tanpa poin. Hitungan terpisah untuk masing-masing boss, sehingga teman-temannya tetap tersedia. Boss menunggu sampai tertangkap atau kabur setelah tiga kegagalan, tanpa batas mengail 30 detik. Jeda membekukan timer tahap dan animasi; penalti yang menghabiskan waktu langsung mengakhiri ronde. Permainan berikutnya mengembalikan urutan, skor, dan variasi ke awal.
- **Bonus waktu:** jam bercahaya di lapisan 3 memberi +12 detik saat sampai di perahu.
- **Buku stiker:** enam jenis tangkapan dan 19 stiker boss tambahan tersimpan di browser perangkat dan terlihat dalam panduan memancing di Gamehub. Stiker dari tangkapan yang sudah sampai tetap tersimpan meskipun ronde berikutnya ditinggalkan.
- **Level:** gelar Sahabat Laut pada 300 poin dan Kapten Teluk Ceria pada 900 poin.
- **Jeda:** tombol jeda atau Escape. Permainan juga berhenti otomatis saat tab tidak aktif. Pilih Lanjut untuk meneruskan.
- **Layar penuh:** game memenuhi viewport tanpa panel informasi atau scroll. Browser yang mendukung Fullscreen API juga masuk layar penuh; tombol di kanan atas dapat mengubahnya. Browser yang tidak mendukungnya (termasuk sebagian browser iPhone) tetap memakai seluruh area halaman yang tersedia.
- **Keluar:** tombol **Gamehub** membawa kembali ke lobi. Ronde aktif atau dijeda meminta konfirmasi; batal akan mengembalikan keadaan sebelumnya, termasuk jeda. Rekor tertinggi yang sudah dicapai tetap disimpan; progres ronde dihapus hanya setelah keluar dikonfirmasi. Tombol Back browser juga memakai peringatan ini; refresh/menutup tab memancing menyimpan progres otomatis; game lain tetap memakai peringatan bawaan browser bila didukung.
- **Rekor:** disimpan segera ketika skor bertambah, termasuk saat ronde belum selesai, dan tetap ada setelah Quit. Rekor terlihat di HUD memancing dan panduan Gamehub. Penyimpanan hanya di browser perangkat, tanpa akun atau pengiriman data. Suara dapat dimatikan.

## Struktur dan pengembangan berikutnya

- `src/fishing-art.js`: ilustrasi ikan biasa dan bonus.
- `src/boss-art.js`: sembilan siluet monster, rig animasi, ekspresi, dan kurva organik dengan Perfect Freehand.
- `src/fishing-motion.js`: clock animasi, tween transisi, pose semua hewan, dan palet laut; memakai Tween.js dengan clock yang dijeda bersama permainan.
- `src/fishing-bosses.js`: 20 karakter dasar, generator variasi, jumlah per gelombang, ambang skor tanpa batas, hadiah, dan durasi Laut Raksasa.
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
- `server.js`: server statis Node.js. Hanya aset aplikasi dan dua rute vendor ESM (`chess.js` dan Tween.js) yang boleh diakses; `node_modules` lain tetap ditolak.
- `test/engine.test.js` / `test/board-engine.test.js`: tes menggunakan runner bawaan Node.js.
- Dependency `chess.js` 1.4.0 (BSD-2-Clause) dikunci di package-lock.json untuk aturan Catur dan dihidangkan dari instalasi lokal, tanpa CDN.

Dependency animasi `@tweenjs/tween.js` **25.0.0** (MIT) dikunci di package-lock.json dan disajikan lokal dari `/vendor/tween.js`, tanpa CDN atau dependency tambahan. Modul ESM berukuran sekitar **43 KB** tanpa kompresi (sekitar 7 KB jika dikompresi gzip). Canvas 2D tetap dipakai; tidak ada loop animasi tambahan, WebGL, atau video/GIF yang harus diunduh.

Kesebelas game dapat dimainkan. Akun, ranking antar pemain, multiplayer online, dan versi Flutter/native APK belum dibuat.

## Privasi dan file rahasia

Aplikasi tidak membutuhkan `.env`, secret, akun, analytics, atau koneksi pihak ketiga. `.gitignore` mengecualikan file environment, kunci, credential, dependency, dan log. Server menolak dotfile dan file repository di luar daftar aset aplikasi. Jangan menaruh credential dalam kode JavaScript: semua kode client dapat dilihat pemain.

## Grafis ringan dan batas sumber daya

[Perfect Freehand 1.2.3](https://github.com/steveruizok/perfect-freehand) menghasilkan outline halus dengan ujung meruncing untuk tentakel, ekor pari, kaki kepiting, dan tubuh naga. Pilihan mengikuti [dokumentasi getStroke dan taper](https://github.com/steveruizok/perfect-freehand#options): array titik dengan sampel tetap, tekanan sintetis dinonaktifkan, smoothing dan taper yang terkontrol. Modul ESM terpasang **4.532 byte** (sekitar 2 KB jika gzip), berlisensi MIT, tanpa dependensi runtime. Server saat ini menyajikannya tanpa kompresi melalui satu rute vendor yang diizinkan. Tween.js tetap mengatur transisi dan animasi; tidak ada CDN, WebGL, atau aset monster tambahan yang diunduh tiap gelombang.

Server Node menyajikan aset statis, sedangkan aturan dan Canvas berjalan di browser pemain. Generator menyimpan hanya gelombang terakhir, maksimal tiga monster dan tiga jenis sebelumnya; ukuran gambar/tingkat kesulitan dibatasi pada tier 5. Keadaan dan tween tiap monster dibersihkan setelah tangkapan/gelombang/reset. Jumlah proses, array, dan animasi aktif tidak bertambah mengikuti skor. Ini menjaga arsitektur sesuai server 2 core/2 GB; kelancaran grafis tetap bergantung pada perangkat pemain.

Setelah memperbarui versi ini, jalankan `npm ci`, lalu restart `npm start` untuk mengaktifkan rute library baru pada port 4949.

Validasi pengembangan: 72 tes Node lulus, termasuk 1.000 variasi gelombang hingga jutaan poin dan 300 pergantian gelombang cepat tanpa penumpukan tween. Pengujian Chromium mencakup 20k/22k/42k/102k/502k, tangkapan lengkap tiga boss, jeda yang membekukan piksel Canvas, gaya lucu/seram, reduced motion, serta portrait 320×568/390×844 dan landscape 844×390. Sampel 133 frame dengan tiga monster berkurva (gurita, naga, kepiting) menghasilkan rata-rata callback render 0,85 ms dan p95 1,50 ms di mesin pengembangan; ini bukan pengukuran FPS atau jaminan performa HP fisik. Proses server Node terukur sekitar 48 MB RSS setelah pengujian aset.

## Pratinjau Gamehub

Banner memiliki slider manual untuk 11 game (panah, tombol pilihan, keyboard, dan swipe). Gambar di `assets/games/*.jpg` merupakan tangkapan layar permainan asli; total sekitar 412 KiB, tanpa CDN atau library baru. Kartu menampilkan nama, jumlah pemain, pilihan lawan, dan tombol Main. Pencarian, kategori, favorit, pagination, statistik lokal, dan panduan memancing tetap tersedia. Server mengizinkan hanya gambar JPEG pada direktori pratinjau tersebut; file konfigurasi dan secret tetap ditolak. Restart `npm start` pada port 4949 setelah memperbarui untuk mengaktifkan rute gambar.


## Bom Bom

Mode **lawan bot** atau **dua pemain satu perangkat**, dengan nama dan pilihan kubu. Masing-masing pemain mempunyai 24 kotak (6 × 4) dan wajib menyembunyikan tepat 5 bom dan 1 ranjau tambahan (kotak terpisah). Bom mengurangi satu hati; ranjau memberi waktu 5 detik untuk mulai menahan tombol selama 1,6 detik. Menjinakkan ranjau memberi +3 poin; dilepas sebelum penuh atau kehabisan waktu mengurangi satu hati. Giliran berpindah otomatis setelah tantangan selesai. Sentuh/tahan atau gunakan spasi/Enter pada tombol ranjau. Jeda membekukan waktu dan mengulang progres tahan agar tidak ada penekanan yang tersangkut. Bot mengikuti durasi penjinakan yang sama. Ketuk lagi untuk memindahkan pilihan sebelum menekan siap. Pada mode lokal, layar serah perangkat menutup papan hanya saat penempatan bom. Setelah kedua pemain siap, dua area permainan langsung tampil bersama. Posisi bom yang belum dibuka tetap tersembunyi.

Pemain bergantian membuka satu kotak lawan: kotak aman memberi **1 poin**, bom menambah hitungan terkena bom tanpa poin. Kotak bom berkedip singkat, lalu tetap merah; reduced motion memakai penanda statis. Setiap pemain memiliki **5 nyawa berbentuk hati**, ditampilkan di atas area bermain. Bom mengosongkan satu hati; pemain yang kehilangan kelimanya kalah, berapa pun skornya. Giliran langsung berpindah setelah satu ketukan, tanpa tombol Next atau konfirmasi lagi. Area lawan/bot di atas dan pemain utama di bawah saat portrait; kedua area berdampingan saat landscape atau di PC. Border hijau menandai area aktif. Area yang bukan gilirannya, kotak yang sudah dibuka, serta area bot tidak dapat ditekan; aturan mesin juga menolak langkah dari pemain yang tidak aktif. Poin, hitungan bom, dan hasil terakhir tetap terlihat pada masing-masing area. Setelah bom kelima, hasil akhir tampil otomatis sesudah animasi singkat; jeda membekukan transisi tersebut. Bot memilih acak hanya dari kotak yang belum dibuka, tanpa melihat posisi bom. Tidak ada timer. Main lagi mempertahankan mode, nama, dan kubu serta mengganti pemain pertama untuk mode lokal. Jeda menyembunyikan papan penempatan; keluar/ganti mode meminta konfirmasi seperti game arcade lain. Semua posisi hanya berada dalam memori ronde, tanpa penyimpanan di localStorage atau layanan tambahan.

Validasi Bom Bom: tes aturan penempatan, privasi fase serah, giliran dan skor, kalah pada bom kelima, replay, pilihan bot tanpa membaca bom, serta 100 simulasi pertandingan penuh. Pemeriksaan Chromium mencakup 320×568, 390×844, tablet 768×1024/1024×768, 844×390, desktop, dua papan dalam satu layar, perpindahan otomatis, penolakan klik di luar giliran, jeda sebelum hasil akhir, konfirmasi keluar/ganti mode, dan permainan lokal hingga selesai.

Jika aplikasi dijalankan lewat PM2, setelah `git pull` jalankan `pm2 restart <nama-app>` dan refresh browser untuk memuat versi terbaru.


## Simpan otomatis Petualangan Memancing

Ronde aktif atau dijeda disimpan ke `papayu-fishing-progress-v1` di localStorage setiap satu detik, setelah tangkapan/perubahan penting, saat jeda, ketika halaman tersembunyi, dan saat halaman ditutup. Tab/browser yang ditutup tanpa Quit dapat dipulihkan melalui **Lanjut memancing** di Gamehub atau dengan membuka game memancing. Pemulihan selalu dalam keadaan jeda: waktu tidak berkurang selama offline, dan pemain harus menekan Lanjut. Seluruh ikan, skor, combo, sisa waktu, frenzy/bintang, urutan gelombang, mutasi, predator/mangsa, boss yang sudah selesai, serta tahap dan timer tarikan dipertahankan. Tombol/pointer tidak dianggap sedang ditekan setelah pulih.

Hanya **Quit/Keluar ke Gamehub yang dikonfirmasi** atau ronde yang berakhir yang menghapus progres tersebut. Membatalkan keluar tetap menyimpan ronde; keluar dari game lain tidak menghapus simpanan memancing. Rekor lama `papayu-fishing-best` tetap digunakan dan diperbarui ketika skor naik. Nama versi, batas ukuran dan validasi simpanan mencegah data rusak menghalangi pemuatan Gamehub. Jika browser menolak penyimpanan, permainan tetap berjalan dan menampilkan pesan bahwa progres belum tersimpan.

Simpanan bersifat lokal pada browser, profil, perangkat, dan alamat situs yang sama; belum ada akun atau sinkronisasi ke perangkat lain. Menghapus data situs juga menghapus simpanan lokal. Pada penutupan paksa proses/perangkat, progres kembali ke checkpoint terakhir (biasanya paling lama satu detik); event penutupan normal menyimpan keadaan terbaru. Animasi kosmetik dimulai kembali, sementara keadaan permainan dipertahankan. Format mempertahankan referensi objek yang sama pada boss serta nilai waktu Infinity; JSON biasa tidak cukup untuk keduanya. Tidak ada database, permintaan jaringan, dependency baru, atau proses server tambahan.

Validasi: 111 tes Node, termasuk serialisasi ronde biasa, tarikan aktif, peringatan boss, gelombang, perburuan, mangsa yang dikail, mutasi, data rusak, pembersihan checkpoint dan kegagalan penyimpanan. Pengujian browser mencakup tangkapan sungguhan, tab tertutup lalu dibuka, reload saat melawan boss mutasi, pemulihan dalam jeda, Quit/batal keluar, rekor, serta pembersihan saat ronde selesai.


## Palet pastel cerah dan doff untuk seluruh Gamehub

Seluruh library dan **11 game** memakai palet doff yang lebih cerah: krem, denim muda, sage cerah, kuning lembut, peach, dan rose. Latar, papan, kartu, gambar karakter, dan Canvas lebih terang; tinta teks, garis, dan kontrol utama tetap pekat agar terbaca. Warna tiap game dan kartu tetap bervariasi; permukaan, tombol, dialog, pilihan karakter, statistik, papan dan kontrol memakai warna datar tanpa kilau/neon. Giliran aktif tetap memakai border hijau tua, nyawa memakai hati rose, serta peringatan memakai terracotta dengan teks/ikon yang jelas. Catur tetap membedakan bidak putih/hitam, pilihan langkah, langkah terakhir dan skak; Balap Reaksi tetap membedakan tunggu dan mulai lewat warna serta tulisan. Pengaturan reduced motion tetap berlaku.

Canvas Air Hockey dan Tangkap Bintang, langit/laut berdasarkan jam, ikan, monster, gambar Puzzle Geser, serta potret Mahjong ikut disesuaikan. Ilustrasi hewan memakai bidang warna datar dan outline; glow Canvas dihapus. Warna ikan/boss yang berasal dari data ronde lama dikonversi **hanya saat digambar** lewat `src/matte-palette.js`, dengan cache maksimal 384 warna. Data permainan, progres tersimpan dan aturan tidak berubah. Tidak ada filter saturasi seluruh halaman, dependency, aset animasi, timer, atau proses server baru. Semua pratinjau JPEG di `assets/games` diperbarui dari tampilan permainan yang sebenarnya.

Bom Bom tetap memiliki **24 kotak (6×4), 5 bom + 1 ranjau, dan 5 hati** per pemain, dua papan dalam satu frame, giliran otomatis, serta penolakan klik di luar giliran. Perubahan tema tidak mengubah mekanisme game.

Validasi pembaruan: 112 tes Node, termasuk batas lima bom, pemakaian sel ke-24, lima nyawa, kekalahan pada bom kelima, bot yang tidak membaca posisi bom, dan 100 pertandingan penuh. Pengujian Chromium meliputi HP 320×568/390×844, landscape 844×390, tablet 768×1024/1024×768, desktop, perpindahan otomatis, klik di luar giliran, pause, replay, konfirmasi keluar, tema Gamehub dan fungsi pencarian/filter/favorit/pagination.


Pemeriksaan tema doff: 112 tes Node tetap lulus. Chromium menguji peluncuran seluruh 11 game, gambar pratinjau, layout portrait/landscape/desktop, serta jeda, konfirmasi keluar dan lanjut. Pemulihan progres memancing dan pertandingan Bom Bom hingga lima nyawa habis juga diuji ulang. Warna adalah perubahan presentasi; tidak ada migrasi data atau penghapusan progres.

Pengujian tema juga memeriksa kontras sampel judul, deskripsi, tombol, metadata kartu dan nama/kubu pemain (minimal 4,5:1), status skak Catur, serta formulir Mahjong di landscape. Formulir pemilihan mode berada di atas area bidak agar tombol Mulai tetap dapat ditekan pada tablet/HP landscape.


Bom Bom: efek ledakan dan serpihan memakai CSS, tanpa dependency baru. Giliran aktif memakai permukaan hijau cerah, border hijau dan label tegas. Animasi mengikuti reduced motion. Pengujian mekanik: 116 tes Node; Chromium menguji tahan sentuhan/keyboard, lepas terlalu cepat, batas waktu, bonus sekali saja, jeda/lanjut, bot, lima hati habis, replay, privasi posisi dan layout 320–1440 piksel.


Bom Bom memakai ilustrasi vektor ranjau bundar dengan panel hitung mundur digital (05–00), termasuk status jinak. Semua kotak aman memberi +1 poin. Permainan otomatis **seri** jika kedua pemain sama-sama mempunyai satu hati dan hanya satu kotak tertutup yang berisi bom. Aturan berlaku untuk lawan lokal maupun bot, tanpa memilih pemenang berdasarkan urutan giliran atau bonus skor. Jika masih ada kotak aman atau ranjau yang dapat dijinakkan, permainan berlanjut seperti biasa. Dialog hasil menjelaskan penyebab seri; main lagi mempertahankan mode/nama/kubu dan mengganti pemain pertama untuk mode lokal.

Validasi akhir Bom Bom: 120 tes Node lulus. Kasus seri diuji dari kedua pemain awal, melawan bot, serta setelah penjinakan ranjau terakhir. Empat ledakan per pemain belum mengakhiri ronde selama masih ada kotak aman.
