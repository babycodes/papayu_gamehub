import { GAMES, queryGames } from "./catalog.js";
const $ = (id) => document.getElementById(id);
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
const storedPlays = read("papayu-plays", {}),
  storedFavorites = read("papayu-favorites", []);
export const plays = Object.fromEntries(
  GAMES.map((g) => [
    g.id,
    Number.isSafeInteger(storedPlays?.[g.id]) && storedPlays[g.id] >= 0
      ? storedPlays[g.id]
      : 0,
  ]),
);
const favorites = new Set(
  Array.isArray(storedFavorites)
    ? storedFavorites.filter((id) => GAMES.some((g) => g.id === id))
    : [],
);
let launch,
  state = {
    search: "",
    category: "Semua",
    sort: "default",
    favoritesOnly: false,
    page: 1,
    pageSize: 6,
  };
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
export function recordPlay(id) {
  plays[id] = (plays[id] || 0) + 1;
  save("papayu-plays", plays);
  render();
}
const preview = (game) => `/assets/games/${game.id}.jpg`;
function playerInfo(game) {
  return {
    count: game.modes.includes("2 pemain") ? "1–2 pemain" : "1 pemain",
    mode: game.modes.includes("Lawan bot")
      ? "Bot / teman"
      : game.modes.includes("2 pemain")
        ? "Solo / teman"
        : "Solo",
  };
}
const summaries = {
  "memory-match": "Buka kartu dan temukan pasangan gambarnya.",
  fishing: "Jelajahi laut, tangkap ikan, dan taklukkan monster!",
  "tic-tac-toe": "Susun tiga simbol berurutan untuk menang.",
  mahjong: "Temukan bidakmu dan lengkapi semua kelompok gambar.",
  chess: "Atur strategi dan lindungi rajamu.",
  "connect-four": "Hubungkan empat keping sebelum lawanmu.",
  "air-hockey": "Dorong puck dan cetak gol ke gawang lawan.",
  "reaction-race": "Tunggu aba-aba, lalu sentuh secepat mungkin!",
  "sliding-puzzle": "Geser ubin hingga semua tersusun rapi.",
  "catch-stars": "Tangkap bintang yang jatuh dan kumpulkan poin.",
};
function initFeatured() {
  let index = 0,
    gesture;
  function show(next) {
    index = (next + GAMES.length) % GAMES.length;
    const game = GAMES[index],
      info = playerInfo(game);
    $("featuredTitle").textContent = game.title;
    $("featuredCategory").textContent = game.category;
    $("featuredSummary").textContent = summaries[game.id];
    $("featuredMeta").textContent = `${info.count} · ${info.mode}`;
    $("featuredImage").src = preview(game);
    $("featuredImage").alt = `Tampilan permainan ${game.title}`;
    $("featuredCount").textContent =
      `${String(index + 1).padStart(2, "0")} / ${GAMES.length}`;
    [...$("featuredDots").children].forEach((dot, i) =>
      dot.setAttribute("aria-pressed", String(i === index)),
    );
  }
  GAMES.forEach((game, i) => {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", `Lihat ${game.title}`);
    dot.addEventListener("click", () => show(i));
    $("featuredDots").append(dot);
  });
  $("featuredPrev").addEventListener("click", () => show(index - 1));
  $("featuredNext").addEventListener("click", () => show(index + 1));
  $("featuredPlay").addEventListener("click", () => launch(GAMES[index].id));
  $("featuredGames").addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    show(index + (event.key === "ArrowRight" ? 1 : -1));
  });
  $("featuredSwipe").addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  $("featuredSwipe").addEventListener("pointerup", (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x,
      dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3)
      show(index + (dx < 0 ? 1 : -1));
  });
  $("featuredSwipe").addEventListener("pointercancel", () => {
    gesture = null;
  });
  show(0);
}
function render() {
  $("libraryGameCount").textContent = String(GAMES.length).padStart(2, "0");
  const result = queryGames(GAMES, {
    ...state,
    favorites: [...favorites],
    plays,
  });
  state.page = result.page;
  $("gameCatalog").replaceChildren();
  for (const item of result.items) {
    const card = document.createElement("article");
    card.className = "catalog-card";
    card.dataset.game = item.id;
    const info = playerInfo(item);
    card.innerHTML = `<div class="catalog-art"><img src="${preview(item)}" alt="Tampilan permainan ${item.title}" loading="lazy" decoding="async"><span class="catalog-category">${item.category}</span></div><div class="catalog-content"><h3>${item.title}</h3><div class="card-player-info"><strong>${info.count}</strong><span>${info.mode}</span></div><button class="primary-button launch-game" aria-label="${item.action}">Main <span aria-hidden="true">→</span></button></div>`;
    const favorite = document.createElement("button");
    favorite.className = "favorite-button";
    favorite.textContent = favorites.has(item.id) ? "♥" : "♡";
    favorite.setAttribute("aria-label", `Favorit ${item.title}`);
    favorite.setAttribute("aria-pressed", String(favorites.has(item.id)));
    favorite.addEventListener("click", () => {
      favorites.has(item.id)
        ? favorites.delete(item.id)
        : favorites.add(item.id);
      save("papayu-favorites", [...favorites]);
      render();
    });
    card.querySelector(".catalog-art").append(favorite);
    card
      .querySelector(".launch-game")
      .addEventListener("click", () => launch(item.id));
    $("gameCatalog").append(card);
  }
  $("resultCount").textContent = `${result.total} game`;
  $("emptyLibrary").hidden = result.total !== 0;
  $("pageInfo").textContent = `Halaman ${result.page} dari ${result.pages}`;
  $("prevPage").disabled = result.page === 1;
  $("nextPage").disabled = result.page === result.pages;
  $("pageNumbers").replaceChildren();
  for (let p = 1; p <= result.pages; p++) {
    const button = document.createElement("button");
    button.textContent = p;
    button.setAttribute("aria-label", `Halaman ${p}`);
    button.className = p === result.page ? "selected" : "";
    if (p === result.page) button.setAttribute("aria-current", "page");
    button.addEventListener("click", () => {
      state.page = p;
      render();
    });
    $("pageNumbers").append(button);
  }
  $("totalSessions").textContent = Object.values(plays).reduce(
    (a, b) => a + b,
    0,
  );
  const popular = GAMES.filter((g) => plays[g.id] > 0).sort(
    (a, b) => plays[b.id] - plays[a.id],
  );
  $("popularGames").replaceChildren();
  if (!popular.length)
    $("popularGames").innerHTML =
      '<div class="popular-empty"><span aria-hidden="true">✦</span><p>Mainkan game untuk mengisi daftar ini.</p></div>';
  popular.slice(0, 3).forEach((g, index) => {
    const row = document.createElement("button");
    row.className = "popular-row";
    row.innerHTML = `<span class="popular-number">0${index + 1}</span><span class="popular-icon">${g.icon}</span><span><strong>${g.title}</strong><small>${plays[g.id]} sesi dimainkan</small></span><b>→</b>`;
    row.addEventListener("click", () => launch(g.id));
    $("popularGames").append(row);
  });
}
export function initLibrary(onLaunch) {
  launch = onLaunch;
  initFeatured();
  for (const category of ["Semua", ...new Set(GAMES.map((g) => g.category))]) {
    const button = document.createElement("button");
    button.textContent = category;
    button.className = category === "Semua" ? "selected" : "";
    button.setAttribute("aria-pressed", String(category === "Semua"));
    button.addEventListener("click", () => {
      state.category = category;
      state.page = 1;
      for (const sibling of $("categoryFilters").children) {
        sibling.classList.toggle("selected", sibling === button);
        sibling.setAttribute("aria-pressed", String(sibling === button));
      }
      render();
    });
    $("categoryFilters").append(button);
  }
  $("gameSearch").addEventListener("input", (e) => {
    state.search = e.target.value;
    state.page = 1;
    render();
  });
  $("gameSort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.page = 1;
    render();
  });
  $("pageSize").addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value);
    state.page = 1;
    render();
  });
  $("favoritesFilter").addEventListener("click", () => {
    state.favoritesOnly = !state.favoritesOnly;
    state.page = 1;
    $("favoritesFilter").setAttribute(
      "aria-pressed",
      String(state.favoritesOnly),
    );
    render();
  });
  $("prevPage").addEventListener("click", () => {
    state.page--;
    render();
  });
  $("nextPage").addEventListener("click", () => {
    state.page++;
    render();
  });
  $("clearFilters").addEventListener("click", () => {
    state = {
      ...state,
      search: "",
      category: "Semua",
      favoritesOnly: false,
      page: 1,
    };
    $("gameSearch").value = "";
    $("favoritesFilter").setAttribute("aria-pressed", "false");
    [...$("categoryFilters").children].forEach((b) => {
      b.classList.toggle("selected", b.textContent === "Semua");
      b.setAttribute("aria-pressed", String(b.textContent === "Semua"));
    });
    render();
  });
  $("exploreButton").addEventListener("click", () => {
    $("librarySection").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    $("gameSearch").focus({ preventScroll: true });
  });
  window.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !document.body.classList.contains("in-game") &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      event.preventDefault();
      $("gameSearch").focus();
    }
  });
  render();
}
