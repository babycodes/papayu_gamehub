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
function render() {
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
    card.innerHTML = `<div class="catalog-art"><span class="art-symbol" aria-hidden="true">${item.icon}</span><span class="art-tag">${item.tag}</span></div><div class="catalog-content"><div class="catalog-kicker"><span>${item.category}</span><span>${item.duration}</span></div><h3>${item.title}</h3><p>${item.description}</p><div class="mode-tags">${item.modes.map((mode) => `<span>${mode}</span>`).join("")}</div><div class="card-bottom"><button class="primary-button launch-game">${item.action} <span>→</span></button><span class="play-count">${plays[item.id]} sesi lokal</span></div></div>`;
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
  $("resultCount").textContent = `${result.total} game ditemukan`;
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
      '<div class="popular-empty"><span>✦</span><strong>Cerita pertamamu dimulai di sini.</strong><p>Mainkan game untuk melihat favoritmu di perangkat ini.</p></div>';
  popular.forEach((g, index) => {
    const row = document.createElement("button");
    row.className = "popular-row";
    row.innerHTML = `<span class="popular-number">0${index + 1}</span><span class="popular-icon">${g.icon}</span><span><strong>${g.title}</strong><small>${plays[g.id]} sesi dimainkan</small></span><b>→</b>`;
    row.addEventListener("click", () => launch(g.id));
    $("popularGames").append(row);
  });
}
export function initLibrary(onLaunch) {
  launch = onLaunch;
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
