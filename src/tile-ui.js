import { TILE_THEMES } from "./mahjong-engine.js";
let cancelDrag = null;
const $ = (id) => document.getElementById(id);
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

// Pointer gestures work with mouse, pen, and touch, including scrolling a small screen.
function movable(button, game, action) {
  let gesture = null;
  const cleanup = () => {
    if (!gesture) return;
    cancelAnimationFrame(gesture.frame);
    gesture.ghost?.remove();
    document
      .querySelectorAll(".tile-drop-hover")
      .forEach((el) => el.classList.remove("tile-drop-hover"));
    gesture = null;
    cancelDrag = null;
  };
  button.style.touchAction = "none";
  button.addEventListener("pointerdown", (event) => {
    if (
      button.disabled ||
      game.mode !== "playing" ||
      game.isBotTurn() ||
      event.button !== 0 ||
      gesture
    )
      return;
    cancelDrag?.();
    cancelDrag = cleanup;
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
    };
    button.setPointerCapture(event.pointerId);
  });
  const hit = () =>
    document
      .elementFromPoint(gesture.x, gesture.y)
      ?.closest("[data-tile-drop]");
  const frame = () => {
    if (!gesture?.ghost) return;
    const area = $("boardView").querySelector(".board-layout");
    const rect = area.getBoundingClientRect();
    const onExchange =
      hit()?.dataset.tileDrop === "handoff" && gesture.y > rect.top + 30;
    if (!onExchange && gesture.y < rect.top + 65) area.scrollTop -= 9;
    else if (gesture.y > rect.bottom - 65) area.scrollTop += 9;
    document
      .querySelectorAll(".tile-drop-hover")
      .forEach((el) => el.classList.remove("tile-drop-hover"));
    hit()?.classList.add("tile-drop-hover");
    gesture.frame = requestAnimationFrame(frame);
  };
  button.addEventListener("pointermove", (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    if (
      !gesture.ghost &&
      Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY) > 7
    ) {
      gesture.ghost = node("div", "tile-drag-ghost", button.textContent);
      gesture.ghost.setAttribute("aria-hidden", "true");
      $("gameScreen").append(gesture.ghost);
      gesture.frame = requestAnimationFrame(frame);
    }
    if (gesture.ghost) {
      event.preventDefault();
      gesture.ghost.style.left = `${gesture.x}px`;
      gesture.ghost.style.top = `${gesture.y}px`;
    }
  });
  button.addEventListener("pointerup", (event) => {
    if (!gesture || gesture.id !== event.pointerId) return;
    gesture.x = event.clientX;
    gesture.y = event.clientY;
    const dragging = Boolean(gesture.ghost);
    const target = dragging ? hit() : null;
    cleanup();
    if (dragging) {
      event.preventDefault();
      button.dataset.suppressClick = "true";
      if (target) drop(game, action, target);
    }
  });
  button.addEventListener("pointercancel", cleanup);
  button.addEventListener("lostpointercapture", cleanup);
  button.addEventListener("click", (event) => {
    if (button.dataset.suppressClick) {
      delete button.dataset.suppressClick;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}
function drop(game, action, target) {
  if (game.mode !== "playing" || game.isBotTurn()) return;
  const pending = game.tileGame.pending;
  if (!pending) return;
  if (action === "handoff" && target.dataset.tileDrop === "handoff")
    game.handoffTile();
  else if (action === "pickup" || action === "arrange") {
    const owner = Number(target.dataset.player);
    if (owner !== pending.owner) return;
    if (action === "pickup") {
      if (!game.tileGame.pickup(owner)) return;
    }
    game.selectedTile = true;
    if (target.dataset.tileDrop === "column")
      game.placeTile(owner, Number(target.dataset.column));
    else {
      game.render();
      game.focusTileAction();
    }
  }
}
export function renderTileDuel(game) {
  cancelDrag?.();
  const duel = game.tileGame;
  const pending = duel.pending;
  const grid = $("boardGrid");
  grid.classList.toggle("pending-tile", Boolean(pending));
  let message =
    "Buka bidak. Pilih kolom START untuk gambar baru; gambar yang sama wajib satu kolom.";
  if (pending)
    message =
      pending.stage === "handoff"
        ? `${game.tileName(pending.sender)}, seret bidak lawan ke papan serah-terima.`
        : pending.stage === "pickup"
          ? `${game.tileName(pending.owner)}, ambil bidak di papan serah-terima dan susun ke kolom pilihanmu.`
          : `${game.tileName(pending.owner)}, pilih kolom kosong untuk gambar baru, atau kolom dengan gambar yang sama.`;
  else if (duel.last)
    message = `Bidak sudah disusun oleh ${game.tileName(duel.last.owner)}. Lanjut membuka bidak.`;
  const announcement = node(
    "p",
    "tile-announcement",
    game.tileError || message,
  );
  announcement.setAttribute("role", "status");
  grid.append(announcement);
  const exchange = node("section", "tile-exchange");
  exchange.dataset.tileDrop = "handoff";
  exchange.setAttribute("aria-label", "Papan serah-terima");
  exchange.append(node("strong", "", "PAPAN SERAH-TERIMA"));
  if (pending?.stage === "pickup") {
    const button = node(
      "button",
      "pickup-tile tray-tile",
      TILE_THEMES[pending.theme].pictures[pending.picture],
    );
    button.disabled = game.mode !== "playing" || game.isBotTurn();
    button.setAttribute(
      "aria-label",
      `Ambil ${TILE_THEMES[pending.theme].labels[pending.picture]} untuk ${game.tileName(pending.owner)}`,
    );
    movable(button, game, "pickup");
    button.addEventListener("click", () => game.pickupTile());
    exchange.append(
      button,
      node(
        "span",
        "",
        `Untuk ${game.tileName(pending.owner)} · seret ke susunanmu`,
      ),
    );
  } else {
    const target = node(
      "button",
      "exchange-empty",
      pending?.stage === "handoff"
        ? "Letakkan bidak lawan di sini ↓"
        : "Papan kosong untuk menyerahkan bidak",
    );
    target.disabled =
      game.mode !== "playing" ||
      game.isBotTurn() ||
      pending?.stage !== "handoff";
    target.addEventListener("click", () => {
      if (game.selectedTile) game.handoffTile();
    });
    exchange.append(target);
  }
  grid.append(exchange);
  for (const player of [0, 1]) {
    const active = game.mode === "playing" && duel.actor() === player;
    const panel = node(
      "section",
      `tile-panel ${active ? "active-tile-panel" : ""}`,
    );
    panel.dataset.board = player;
    if (active) panel.setAttribute("aria-current", "true");
    const theme = TILE_THEMES[duel.themes[player]];
    const header = node("header");
    const status =
      game.mode === "ended"
        ? duel.winner === player
          ? "MENANG!"
          : "SELESAI"
        : game.mode === "paused"
          ? "DIJEDA"
          : active
            ? pending
              ? pending.stage === "handoff"
                ? "SERAHKAN"
                : pending.stage === "pickup"
                  ? "AMBIL BIDAK"
                  : "SUSUN BIDAK"
              : "▶ GILIRANMU"
            : "MENUNGGU";
    header.append(
      node("strong", "", `${game.tileName(player)} · ${theme.name}`),
      node("b", "", status),
    );
    const board = node("div", "tile-board");
    board.setAttribute("role", "group");
    board.setAttribute("aria-label", `Papan ${game.tileName(player)}`);
    duel.boards[player].forEach((tile, index) => {
      const button = node(
        "button",
        `duel-tile ${tile.revealed ? "revealed-tile" : ""}`,
        tile.revealed ? "✓" : "✦",
      );
      button.dataset.cell = `${player}-${index}`;
      button.disabled =
        game.mode !== "playing" ||
        game.isBotTurn() ||
        Boolean(pending) ||
        tile.revealed ||
        duel.availableBoard() !== player;
      button.setAttribute(
        "aria-label",
        `Bidak ${index + 1} papan ${game.tileName(player)}, ${tile.revealed ? "sudah diambil" : "tertutup"}`,
      );
      button.addEventListener("click", () => {
        if (!game.isBotTurn()) game.makeTileMove(player, index);
      });
      board.append(button);
    });
    const holding = node("div", "tile-tray");
    holding.dataset.tileDrop = "holding";
    holding.dataset.player = player;
    holding.append(node("strong", "", "BIDAK DI TANGAN"));
    const holds =
      pending &&
      ((pending.stage === "arrange" && pending.owner === player) ||
        (pending.stage === "handoff" && pending.sender === player));
    if (holds) {
      const action = pending.stage;
      const button = node(
        "button",
        `tray-tile ${game.selectedTile ? "selected-tray-tile" : ""}`,
        TILE_THEMES[pending.theme].pictures[pending.picture],
      );
      button.disabled = game.mode !== "playing" || game.isBotTurn();
      button.setAttribute(
        "aria-label",
        `Pilih ${TILE_THEMES[pending.theme].labels[pending.picture]} di tangan ${game.tileName(player)}`,
      );
      button.setAttribute("aria-pressed", String(game.selectedTile));
      movable(button, game, action);
      button.addEventListener("click", () => {
        if (game.mode !== "playing" || game.isBotTurn()) return;
        game.selectedTile = true;
        game.tileError = null;
        game.render();
      });
      holding.append(
        button,
        node(
          "span",
          "",
          action === "handoff"
            ? "Seret ke papan serah-terima ↑"
            : "Seret ke kolom pilihanmu ↓",
        ),
      );
    } else holding.append(node("span", "", "Belum ada bidak di tangan."));
    const collection = node("div", "tile-collection");
    collection.setAttribute("aria-label", `Susunan ${game.tileName(player)}`);
    collection.append(
      node(
        "span",
        "",
        `TERSUSUN ${duel.collections[player].reduce((sum, n) => sum + n, 0)}/16`,
      ),
    );
    const columns = node("div", "collection-columns");
    duel.columns[player].forEach((picture, column) => {
      const count = picture === null ? 0 : duel.collections[player][picture];
      const button = node(
        "button",
        `collection-column ${count === 4 ? "complete-group" : ""}`,
      );
      button.dataset.column = column;
      button.dataset.tileDrop = "column";
      button.dataset.player = player;
      if (picture !== null) button.dataset.picture = picture;
      button.disabled =
        game.mode !== "playing" ||
        game.isBotTurn() ||
        !pending ||
        pending.owner !== player ||
        pending.stage === "handoff";
      button.setAttribute(
        "aria-label",
        `Kolom ${column + 1} ${game.tileName(player)}, ${picture === null ? "kosong" : theme.labels[picture] + " " + count + " dari 4"}`,
      );
      button.append(
        node("span", "start-tile", "START"),
        node(
          "span",
          "column-title",
          picture === null
            ? "Pilih gambar"
            : `${theme.pictures[picture]} ${count}/4`,
        ),
      );
      for (let slot = 0; slot < 4; slot++)
        button.append(
          node(
            "span",
            `collection-slot ${slot < count ? "filled-slot" : ""}`,
            slot < count ? theme.pictures[picture] : "·",
          ),
        );
      button.addEventListener("click", () => {
        if (game.selectedTile) game.placeTile(player, column);
      });
      columns.append(button);
    });
    collection.append(columns);
    panel.append(header, board, holding, collection);
    grid.append(panel);
  }
}
