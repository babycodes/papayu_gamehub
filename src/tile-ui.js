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
  const hit = () => {
    const element = document.elementFromPoint(gesture.x, gesture.y);
    return element?.closest("[data-tile-drop]");
  };
  const frame = () => {
    if (!gesture?.ghost) return;
    const area = $("boardView").querySelector(".board-layout");
    const rect = area.getBoundingClientRect();
    const onExchange =
      document
        .elementFromPoint(gesture.x, gesture.y)
        ?.closest(".tile-exchange") && gesture.y > rect.top + 30;
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
  if (action === "pickup" || action === "arrange") {
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
  grid.classList.toggle("tile-error", Boolean(game.tileError));
  grid.dataset.phase = duel.awaitingDice ? "dice" : pending?.stage || "draw";
  let message =
    "Buka bidak. Jika mendapat gambarmu sendiri, susun lalu lanjut bermain.";
  if (duel.awaitingDice)
    message = duel.diceHistory.length
      ? `Dadu seri ${duel.diceHistory.at(-1).join("–")}. Lempar ulang; ${game.tileName(duel.dicePlayer())} lebih dulu.`
      : `${game.tileName(duel.dicePlayer())}, lempar dadu untuk menentukan pemain pertama.`;
  else if (pending)
    message =
      pending.stage === "pickup"
        ? `${game.tileName(pending.owner)}, bidakmu otomatis tersedia. Ambil atau seret langsung ke kolom pilihanmu.`
        : `${game.tileName(pending.owner)}, pilih kolom kosong untuk gambar baru, atau kolom dengan gambar yang sama.`;
  else if (duel.last)
    message =
      duel.last.owner === duel.last.sender
        ? `${game.tileName(duel.last.owner)} mendapat bidak sendiri. Lanjut membuka bidak!`
        : `Bidak lawan sudah disusun. Sekarang giliran ${game.tileName(duel.turn)}.`;
  const announcement = node(
    "p",
    "tile-announcement",
    game.tileError || message,
  );
  announcement.setAttribute("role", "status");
  grid.append(announcement);
  const dice = node("section", "tile-dice");
  dice.setAttribute("aria-label", "Dadu pemain pertama");
  dice.append(node("strong", "", "DADU PEMBUKA"));
  for (const player of [0, 1]) {
    const row = node("div", "tile-dice-player");
    row.append(node("span", "", game.tileName(player)));
    const value = duel.dice[player];
    const face = node("b", "dice-face", value === null ? "?" : String(value));
    face.setAttribute(
      "aria-label",
      value === null ? "Belum melempar dadu" : `Dadu ${value}`,
    );
    row.append(face);
    if (duel.awaitingDice) {
      const button = node(
        "button",
        "secondary-button roll-tile-dice",
        "Lempar dadu",
      );
      button.dataset.player = player;
      button.disabled =
        game.mode !== "playing" ||
        game.isBotTurn() ||
        duel.dicePlayer() !== player;
      button.addEventListener("click", () => {
        if (!game.isBotTurn()) game.rollTileDice(player);
      });
      row.append(button);
    }
    dice.append(row);
  }
  if (!duel.awaitingDice && duel.diceHistory.length)
    dice.append(
      node(
        "span",
        "dice-result",
        `${game.tileName(duel.dice[0] > duel.dice[1] ? 0 : 1)} mulai duluan`,
      ),
    );
  dice.hidden = !duel.awaitingDice;
  grid.append(dice);
  const exchange = node("section", "tile-exchange");
  exchange.setAttribute("aria-label", "Bidak untuk disusun");
  exchange.append(
    node(
      "strong",
      "",
      pending?.stage === "arrange" ? "SUSUN BIDAK" : "BIDAK AKTIF",
    ),
  );
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
    const target = node("button", "exchange-empty", "Buka bidak di zona hijau");
    target.disabled = true;
    exchange.append(target);
  }
  grid.append(exchange);
  for (const player of [0, 1]) {
    const active =
      game.mode === "playing" && !duel.awaitingDice && duel.actor() === player;
    const panel = node(
      "section",
      `tile-panel ${active ? "active-tile-panel" : ""}`,
    );
    panel.dataset.board = player;
    panel.classList.toggle(
      "drawing-panel",
      !duel.awaitingDice &&
        !pending &&
        duel.winner === null &&
        duel.availableBoard() === player,
    );
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
              ? pending.stage === "pickup"
                ? "AMBIL BIDAK"
                : "SUSUN BIDAK"
              : "▶ GILIRANMU"
            : duel.awaitingDice
              ? "LEMPAR DADU"
              : "MENUNGGU";
    header.append(
      node("strong", "", `${game.tileName(player)} · ${theme.name}`),
      node(
        "span",
        "tile-progress",
        `${duel.collections[player].reduce((sum, n) => sum + n, 0)}/16`,
      ),
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
        duel.awaitingDice ||
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
    const holds = pending?.stage === "arrange" && pending.owner === player;
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
      holding.append(button, node("span", "", "Seret ke kolom pilihanmu"));
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
        pending.owner !== player;
      button.setAttribute(
        "aria-label",
        `Kolom ${column + 1} ${game.tileName(player)}, ${picture === null ? "kosong" : theme.labels[picture] + " " + count + " dari 4"}`,
      );
      button.append(
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
    if (holds) exchange.append(holding);
    panel.append(header, board, collection);
    grid.append(panel);
  }
}
