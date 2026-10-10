export const GAMES = [
  {
    id: "fishing",
    title: "Petualangan Memancing",
    description: "Lempar kail, kejar ikan langka, dan rayakan frenzy!",
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
