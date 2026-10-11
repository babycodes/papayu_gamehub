export const GAMES = [
  {
    id: "memory-match",
    title: "Memory Match",
    description:
      "Pilih tema favorit, buka kartu, dan temukan 4–20 pasangan gambar!",
    icon: "🦋",
    category: "Arcade",
    modes: ["Solo", "2 pemain"],
    duration: "Santai tanpa waktu",
    tag: "MATCH & SMILE",
    action: "Main Memory Match",
  },
  {
    id: "fishing",
    title: "Petualangan Memancing",
    description:
      "Kejar bintang besar dan temui gelombang hingga 3 monster laut dengan variasi tanpa batas skor!",
    icon: "⚓",
    category: "Petualangan",
    modes: ["Solo"],
    duration: "90 detik",
    tag: "FRENZY TIME",
    action: "Main memancing",
  },
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe",
    description: "Silang atau lingkaran? Susun tiga dan rebut kemenangan.",
    icon: "×○",
    category: "Arcade",
    modes: ["2 pemain", "Lawan bot"],
    duration: "1–3 menit",
    tag: "QUICK MATCH",
    action: "Main Tic Tac Toe",
  },
  {
    id: "mahjong",
    title: "Mahjong Anak",
    description:
      "Mahjong anak: buka ubin campuran dan lengkapi koleksi buah atau hewan!",
    icon: "🍎",
    category: "Arcade",
    modes: ["2 pemain", "Lawan bot"],
    duration: "2–5 menit",
    tag: "TILE PARTY",
    action: "Main Mahjong Anak",
  },
  {
    id: "chess",
    title: "Catur",
    description: "Siapkan strategimu. Satu langkah bisa mengubah segalanya.",
    icon: "♜",
    category: "Strategi",
    modes: ["2 pemain", "Lawan bot"],
    duration: "Tanpa batas waktu",
    tag: "BRAIN POWER",
    action: "Main Catur",
  },
  {
    id: "connect-four",
    title: "Connect Four",
    description: "Jatuhkan keping warna-warni dan susun empat berurutan!",
    icon: "🔴",
    category: "Arcade",
    modes: ["2 pemain", "Lawan bot"],
    duration: "2–5 menit",
    tag: "DROP & CONNECT",
    action: "Main Connect Four",
  },
  {
    id: "air-hockey",
    title: "Air Hockey",
    description: "Geser pemukul, jaga gawang, dan tantang bot atau teman!",
    icon: "🏒",
    category: "Arcade",
    modes: ["2 pemain", "Lawan bot"],
    duration: "3–7 gol",
    tag: "NEON DUEL",
    action: "Main Air Hockey",
  },
  {
    id: "reaction-race",
    title: "Balap Reaksi",
    description:
      "Tunggu hijau, lalu ketuk! Siapa paling cepat tanpa mencuri start?",
    icon: "🚦",
    category: "Arcade",
    modes: ["2 pemain", "Lawan bot"],
    duration: "3–7 ronde",
    tag: "READY · SET · GO",
    action: "Main Balap Reaksi",
  },
  {
    id: "sliding-puzzle",
    title: "Puzzle Geser",
    description:
      "Susun gambar rubah, paus, atau angkasa. Ada petunjuk untuk membantumu!",
    icon: "🧩",
    category: "Strategi",
    modes: ["Solo"],
    duration: "Santai tanpa waktu",
    tag: "PIECE BY PIECE",
    action: "Main Puzzle Geser",
  },
  {
    id: "catch-stars",
    title: "Tangkap Bintang",
    description:
      "Geser keranjang, kumpulkan combo, dan rayakan frenzy di langit malam!",
    icon: "🌟",
    category: "Arcade",
    modes: ["Solo", "2 pemain"],
    duration: "30–60 detik / pemain",
    tag: "STAR FRENZY",
    action: "Main Tangkap Bintang",
  },
];
export function queryGames(
  games,
  {
    search = "",
    category = "Semua",
    sort = "default",
    favoritesOnly = false,
    favorites = [],
    plays = {},
    page = 1,
    pageSize = 6,
  } = {},
) {
  const query = search.trim().toLocaleLowerCase("id-ID");
  const results = games.filter(
    (g) =>
      (category === "Semua" || g.category === category) &&
      (!favoritesOnly || favorites.includes(g.id)) &&
      `${g.title} ${g.description} ${g.category} ${g.modes.join(" ")}`
        .toLocaleLowerCase("id-ID")
        .includes(query),
  );
  if (sort === "popular")
    results.sort((a, b) => (plays[b.id] || 0) - (plays[a.id] || 0));
  if (sort === "name")
    results.sort((a, b) => a.title.localeCompare(b.title, "id"));
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const current = Math.max(1, Math.min(pages, page));
  return {
    items: results.slice((current - 1) * pageSize, current * pageSize),
    total: results.length,
    pages,
    page: current,
  };
}
