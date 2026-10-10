import { Chess, ticResult, ticBot, chessBot } from "./board-engine.js";
import { localPlayers, playerForRole, TEAM_NAMES } from "./players.js";
import { TileDuel, TILE_THEMES } from "./mahjong-engine.js";
const $ = (id) => document.getElementById(id);
const PIECES = {
  w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
  b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
};
const NAMES = {
  p: "pion",
  n: "kuda",
  b: "gajah",
  r: "benteng",
  q: "menteri",
  k: "raja",
};
export class BoardGames {
  constructor({ onStart, onMove }) {
    this.onStart = onStart;
    this.onMove = onMove;
    this.mode = "ready";
    this.botTimer = null;
    $("boardStart").addEventListener("click", () =>
      this.mode === "paused" ? this.resume() : this.start(),
    );
    $("boardReplay").addEventListener("click", () => this.replay());
    $("boardPause").addEventListener("click", () => this.pause());
    $("flipBoard").addEventListener("click", () => {
      this.flipped = !this.flipped;
      this.campFlipped = !this.campFlipped;
      this.render();
    });
    $("opponent").addEventListener("change", () => {
      this.updateSettings();
    });
    for (const [own, other] of [
      ["playerOneTeam", "playerTwoTeam"],
      ["playerTwoTeam", "playerOneTeam"],
    ]) {
      $(own).addEventListener("change", () => {
        $(other).value =
          $(own).value === "red"
            ? "blue"
            : $(own).value === "blue"
              ? "red"
              : "";
        $("boardSetupError").hidden = true;
      });
    }
    new ResizeObserver(() => this.updateSplit()).observe($("boardGrid"));
    $("promotionDialog")
      .querySelectorAll("[data-piece]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          const move = this.promotion;
          $("promotionDialog").close();
          this.promotion = null;
          if (move && this.mode === "playing")
            this.makeChessMove({ ...move, promotion: button.dataset.piece });
        }),
      );
    $("promotionDialog").addEventListener("cancel", () => {
      this.promotion = null;
      this.selected = null;
      this.render();
    });
    $("boardGrid").addEventListener("keydown", (event) => {
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
          event.code,
        )
      )
        return;
      event.preventDefault();
      const buttons = [
          ...$("boardGrid").querySelectorAll("button:not(:disabled)"),
        ],
        i = buttons.indexOf(document.activeElement),
        step = this.id === "chess" ? 8 : this.id === "mahjong" ? 4 : 3;
      const offset = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -step,
        ArrowDown: step,
      }[event.code];
      buttons[Math.max(0, Math.min(buttons.length - 1, i + offset))]?.focus();
    });
  }
  open(id) {
    this.id = id;
    this.flipped = false;
    this.campFlipped = false;
    this.players = null;
    this.firstPlayer = 0;
    $("playerOneTeam").value = "";
    $("playerTwoTeam").value = "";
    this.setup();
  }
  setup() {
    this.resetPosition();
    this.mode = "ready";
    this.updateSettings();
    $("boardView").dataset.game = this.id;
    $("boardResult").hidden = true;
    $("boardSetup").hidden = false;
    $("boardSettings").hidden = false;
    $("pausedChangeMode").hidden = true;
    $("boardSetupTitle").textContent =
      this.id === "mahjong"
        ? "Buah atau hewan?"
        : this.id === "chess"
          ? "Siap mengatur strategi?"
          : "Silang atau lingkaran?";
    $("boardSetupText").textContent =
      this.id === "mahjong"
        ? "Buka satu ubin. Serahkan ubin lawan ke wadahnya, lalu pemiliknya menyusun ke kolom gambar yang sama. Lengkapi empat kolom, masing-masing empat ubin, untuk menang."
        : this.id === "chess"
          ? "Pilih lawanmu. Kamu bermain dengan bidak putih saat melawan bot."
          : "Susun 3 simbol berbaris. Kamu bermain sebagai X saat melawan bot.";
    $("boardStart").textContent = "Mulai pertandingan";
    $("flipBoard").hidden = this.id !== "chess";
    $("boardPause").disabled = true;
    this.render();
  }
  chooseMode() {
    this.players = null;
    this.firstPlayer = 0;
    this.flipped = false;
    this.campFlipped = false;
    this.setup();
    $("opponent").focus({ preventScroll: true });
  }
  updateSettings() {
    const local = $("opponent").value === "local";
    $("difficultyField").hidden = local || this.id === "mahjong";
    $("tileThemeField").hidden = this.id !== "mahjong";
    $("localSetupHint").textContent =
      this.id === "mahjong"
        ? "Nama boleh dikosongkan. Pilih kubu dan tema pemain 1; pemain 2 mendapat tema lainnya."
        : "Nama boleh dikosongkan. Pilih kubu; pemain 1 mulai sebagai X / putih.";
    $("localPlayers").hidden = !local;
    $("boardSetupError").hidden = true;
  }
  resetPosition() {
    this.clearBot();
    this.cancelPromotion();
    this.selected = null;
    this.cells = Array(9).fill(null);
    this.turn = "X";
    this.chess = new Chess();
    this.result = null;
    this.lastMove = null;
    this.winnerRole = null;
    this.selectedTile = false;
    this.tileError = null;
    if (this.id === "mahjong")
      this.tileGame = new TileDuel({
        firstTheme: this.tileTheme || $("tileTheme").value,
        firstPlayer: this.firstPlayer || 0,
      });
  }
  start() {
    if (this.mode !== "ready") return;
    this.opponent = $("opponent").value;
    this.easy = $("botDifficulty").value === "easy";
    if (this.opponent === "local") {
      try {
        this.players = localPlayers(
          $("playerOneName").value,
          $("playerTwoName").value,
          $("playerOneTeam").value,
        );
      } catch (error) {
        $("boardSetupError").textContent = error.message;
        $("boardSetupError").hidden = false;
        return;
      }
    } else this.players = null;
    this.firstPlayer = 0;
    if (this.id === "mahjong") {
      this.tileTheme = $("tileTheme").value;
      this.tileGame = new TileDuel({ firstTheme: this.tileTheme });
    }
    this.beginRound();
  }
  beginRound() {
    this.mode = "playing";
    $("boardSetup").hidden = true;
    $("boardResult").hidden = true;
    $("boardPause").disabled = false;
    this.onStart(this.id);
    this.render();
    $("boardView").querySelector(".board-layout").scrollTop = 0;
  }
  replay() {
    if (this.mode !== "ended") return;
    this.resetPosition();
    if (this.opponent === "local") {
      this.firstPlayer = 1 - this.firstPlayer;
      if (this.id === "chess") this.flipped = !this.flipped;
    }
    if (this.id === "mahjong")
      this.tileGame = new TileDuel({
        firstTheme: this.tileTheme,
        firstPlayer: this.firstPlayer,
      });
    this.beginRound();
    this.queueBot();
    $("boardGrid")
      .querySelector("button:not(:disabled)")
      ?.focus({ preventScroll: true });
  }
  player(role) {
    return this.players
      ? playerForRole(this.players, this.firstPlayer, role)
      : null;
  }
  playerName(role) {
    return (
      this.player(role)?.name ||
      ((role === "O" || role === "b") && this.opponent === "bot"
        ? "Bot"
        : this.opponent === "bot"
          ? "Kamu"
          : role)
    );
  }
  clearBot() {
    clearTimeout(this.botTimer);
    this.botTimer = null;
    this.thinking = false;
  }
  pause() {
    if (this.mode !== "playing") return;
    this.mode = "paused";
    this.clearBot();
    this.cancelPromotion();
    $("boardSetup").hidden = false;
    $("boardSettings").hidden = true;
    $("pausedChangeMode").hidden = false;
    $("boardSetupTitle").textContent = "Waktunya istirahat.";
    $("boardSetupText").textContent =
      "Papanmu aman. Lanjutkan saat kamu sudah siap.";
    $("boardStart").textContent = "Lanjut pertandingan";
    $("boardPause").disabled = true;
    this.render();
  }
  resume() {
    if (this.mode !== "paused") return;
    this.mode = "playing";
    $("boardSetup").hidden = true;
    $("pausedChangeMode").hidden = true;
    $("boardPause").disabled = false;
    this.render();
    this.queueBot();
  }
  close() {
    this.clearBot();
    this.cancelPromotion();
    this.mode = "ready";
  }
  cancelPromotion() {
    if ($("promotionDialog").open) $("promotionDialog").close();
    this.promotion = null;
  }
  isBotTurn() {
    return (
      this.opponent === "bot" &&
      (this.id === "mahjong"
        ? this.tileGame.actor() === 1
        : this.id === "chess"
          ? this.chess.turn() === "b"
          : this.turn === "O")
    );
  }
  queueBot() {
    if (this.mode !== "playing" || !this.isBotTurn() || this.botTimer) return;
    this.thinking = true;
    this.render();
    this.botTimer = setTimeout(() => {
      this.botTimer = null;
      this.thinking = false;
      if (this.mode !== "playing" || !this.isBotTurn()) return;
      if (this.id === "mahjong") {
        const pending = this.tileGame.pending;
        if (pending) {
          if (pending.stage === "handoff") this.handoffTile();
          else this.placeTile(pending.owner, pending.picture, true);
          return;
        }
        const choices = this.tileGame.choices();
        const choice = choices[Math.floor(Math.random() * choices.length)];
        if (choice) this.makeTileMove(choice.board, choice.index);
      } else if (this.id === "chess") {
        const move = chessBot(this.chess, this.easy);
        if (move) this.makeChessMove(move);
      } else {
        const index = ticBot(this.cells, "O", this.easy);
        if (index !== null) this.makeTicMove(index);
      }
    }, 450);
  }
  click(index) {
    if (this.mode !== "playing" || this.isBotTurn() || this.promotion) return;
    if (this.id !== "chess") {
      this.makeTicMove(index);
      return;
    }
    const square = index,
      piece = this.chess.get(square);
    if (this.selected) {
      const moves = this.chess
        .moves({ square: this.selected, verbose: true })
        .filter((move) => move.to === square);
      if (moves.length) {
        if (moves.some((move) => move.promotion)) {
          this.promotion = { from: this.selected, to: square };
          $("promotionDialog").showModal();
        } else this.makeChessMove({ from: this.selected, to: square });
        return;
      }
    }
    this.selected =
      piece?.color === this.chess.turn() && square !== this.selected
        ? square
        : null;
    this.render();
  }
  tileRole(player) {
    return player === this.firstPlayer ? "X" : "O";
  }
  tileName(player) {
    return this.players?.[player].name || (player === 0 ? "Kamu" : "Bot");
  }
  makeTileMove(board, index) {
    if (this.mode !== "playing") return;
    const move = this.tileGame.draw(board, index);
    if (!move) return;
    this.selectedTile = false;
    this.tileError = null;
    this.onMove();
    this.render();
    this.queueBot();
    this.focusTileAction();
  }
  handoffTile() {
    if (this.mode !== "playing" || !this.tileGame.handoff(this.tileGame.turn))
      return;
    this.selectedTile = false;
    this.tileError = null;
    this.onMove();
    this.render();
    this.queueBot();
    this.focusTileAction();
  }
  placeTile(player, picture, automatic = false) {
    if (
      this.mode !== "playing" ||
      (!automatic && (!this.selectedTile || this.isBotTurn()))
    )
      return;
    if (!this.tileGame.place(player, picture)) {
      if (this.tileGame.pending?.owner === player) {
        this.tileError =
          "Gambar belum cocok. Pilih kolom dengan gambar yang sama.";
        this.render();
      }
      return;
    }
    this.selectedTile = false;
    this.tileError = null;
    this.onMove();
    if (this.tileGame.winner !== null) {
      const winner = this.tileGame.winner;
      this.finish(
        `${this.tileName(winner)} menang! Koleksi lengkap: 16/16.`,
        this.tileRole(winner),
      );
    } else {
      this.render();
      this.queueBot();
      this.focusTileAction();
    }
  }
  focusTileAction() {
    if (this.mode !== "playing" || this.isBotTurn()) return;
    const actor = this.tileGame.actor();
    const panel = $("boardGrid").querySelector(
      `.tile-panel[data-board="${actor}"]`,
    );
    const action =
      panel?.querySelector(
        ".handoff-tile:not(:disabled), .tray-tile:not(:disabled)",
      ) || $("boardGrid").querySelector(".duel-tile:not(:disabled)");
    action?.focus();
  }
  makeTicMove(index) {
    if (this.mode !== "playing" || this.cells[index]) return;
    this.cells[index] = this.turn;
    this.result = ticResult(this.cells);
    this.onMove();
    if (this.result)
      this.finish(
        this.result.winner === "draw"
          ? "Seri! Sama-sama hebat."
          : `${this.playerName(this.result.winner)} menang!`,
        this.result.winner === "draw" ? null : this.result.winner,
      );
    else {
      this.turn = this.turn === "X" ? "O" : "X";
      this.render();
      this.queueBot();
    }
  }
  makeChessMove(move) {
    if (this.mode !== "playing") return;
    let applied;
    try {
      applied = this.chess.move(move);
    } catch {
      return;
    }
    if (!applied) return;
    this.lastMove = applied;
    this.selected = null;
    this.onMove();
    if (this.chess.isCheckmate())
      this.finish(
        `Skakmat! ${this.playerName(this.chess.turn() === "w" ? "b" : "w")} menang.`,
        this.chess.turn() === "w" ? "b" : "w",
      );
    else if (this.chess.isStalemate())
      this.finish("Remis — tidak ada langkah legal.");
    else if (this.chess.isThreefoldRepetition())
      this.finish("Remis — posisi berulang tiga kali.");
    else if (this.chess.isInsufficientMaterial())
      this.finish("Remis — bidak tidak cukup untuk skakmat.");
    else if (this.chess.isDrawByFiftyMoves())
      this.finish("Remis — aturan 50 langkah.");
    else {
      this.render();
      this.queueBot();
    }
  }
  finish(message, winnerRole = null) {
    this.winnerRole = winnerRole;
    this.clearBot();
    this.mode = "ended";
    $("boardPause").disabled = true;
    $("boardResult").hidden = false;
    $("boardResultText").textContent = message;
    this.render();
    $("boardReplay").focus({ preventScroll: true });
  }
  updateSplit() {
    if (!this.players || this.mode === "ready") return;
    const board = $("boardGrid").getBoundingClientRect(),
      view = $("boardView").getBoundingClientRect();
    $("boardView").style.setProperty(
      "--duel-split",
      `${board.top + board.height / 2 - view.top}px`,
    );
  }
  renderTiles() {
    const duel = this.tileGame;
    const announcement = document.createElement("p");
    announcement.className = "tile-announcement";
    announcement.setAttribute("role", "status");
    if (this.tileError) announcement.textContent = this.tileError;
    else if (duel.pending) {
      const { theme, picture, owner, stage } = duel.pending;
      announcement.textContent =
        stage === "handoff"
          ? `${TILE_THEMES[theme].pictures[picture]} Ubin milik ${this.tileName(owner)}. Serahkan ke wadahnya.`
          : `${this.tileName(owner)}, ketuk ubin di wadah, lalu kolom ${TILE_THEMES[theme].labels[picture]} untuk menyusunnya.`;
    } else if (duel.last) {
      const { theme, picture, owner } = duel.last;
      announcement.textContent = `${TILE_THEMES[theme].pictures[picture]} ${TILE_THEMES[theme].labels[picture]} sudah disusun oleh ${this.tileName(owner)}!`;
    } else
      announcement.textContent =
        "Buka ubin, serahkan, lalu susun ke kolom gambar yang sama.";
    $("boardGrid").append(announcement);
    for (const player of [0, 1]) {
      const panel = document.createElement("section");
      const active = this.mode === "playing" && duel.actor() === player;
      panel.className = `tile-panel ${active ? "active-tile-panel" : ""}`;
      panel.dataset.board = player;
      if (active) panel.setAttribute("aria-current", "true");
      const theme = TILE_THEMES[duel.themes[player]];
      const header = document.createElement("header");
      const name = document.createElement("strong");
      name.textContent = `${this.tileName(player)} · ${theme.name}`;
      const status = document.createElement("b");
      status.textContent =
        this.mode === "ended"
          ? duel.winner === player
            ? "MENANG!"
            : "SELESAI"
          : this.mode === "paused"
            ? "DIJEDA"
            : active
              ? duel.pending
                ? duel.pending.stage === "handoff"
                  ? "SERAHKAN UBIN"
                  : "SUSUN UBIN"
                : "▶ GILIRANMU"
              : "MENUNGGU";
      header.append(name, status);
      const grid = document.createElement("div");
      grid.className = "tile-board";
      grid.setAttribute("role", "group");
      grid.setAttribute("aria-label", `Papan ${this.tileName(player)}`);
      duel.boards[player].forEach((tile, index) => {
        const button = document.createElement("button");
        button.className = `duel-tile ${tile.revealed ? "revealed-tile" : ""}`;
        button.dataset.cell = `${player}-${index}`;
        button.textContent = tile.revealed
          ? TILE_THEMES[tile.theme].pictures[tile.picture]
          : "✦";
        const available =
          this.mode === "playing" &&
          !this.isBotTurn() &&
          !duel.pending &&
          !tile.revealed &&
          duel.availableBoard() === player;
        button.disabled = !available;
        button.setAttribute(
          "aria-label",
          tile.revealed
            ? `${TILE_THEMES[tile.theme].labels[tile.picture]}, ${duel.pending?.board === player && duel.pending.index === index ? "ditemukan, belum disusun" : "sudah disusun"}`
            : `Ubin ${index + 1} papan ${this.tileName(player)}, tertutup`,
        );
        button.addEventListener("click", () => {
          if (this.mode === "playing" && !this.isBotTurn())
            this.makeTileMove(player, index);
        });
        grid.append(button);
      });
      const tray = document.createElement("div");
      tray.className = "tile-tray";
      tray.setAttribute("aria-label", `Wadah ${this.tileName(player)}`);
      const trayTitle = document.createElement("strong");
      const pending = duel.pending;
      const receiving =
        pending?.owner === player && pending.stage === "arrange";
      const sending = pending?.sender === player && pending.stage === "handoff";
      trayTitle.textContent = sending
        ? "UBIN UNTUK DISERAHKAN"
        : "WADAH TERIMA";
      tray.append(trayTitle);
      if (receiving || sending) {
        const tile = document.createElement("button");
        tile.className = `tray-tile ${receiving && this.selectedTile ? "selected-tray-tile" : ""}`;
        tile.textContent = TILE_THEMES[pending.theme].pictures[pending.picture];
        tile.setAttribute(
          "aria-label",
          `Pilih ${TILE_THEMES[pending.theme].labels[pending.picture]} dari wadah ${this.tileName(player)}`,
        );
        tile.setAttribute(
          "aria-pressed",
          String(receiving && this.selectedTile),
        );
        tile.disabled = this.mode !== "playing" || this.isBotTurn() || sending;
        tile.draggable = !tile.disabled;
        tile.addEventListener("click", () => {
          if (this.mode !== "playing" || this.isBotTurn()) return;
          this.selectedTile = true;
          this.tileError = null;
          this.render();
          $("boardGrid")
            .querySelector(
              `.tile-panel[data-board="${player}"] .collection-column`,
            )
            ?.focus({ preventScroll: true });
        });
        tile.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData(
            "text/plain",
            `${player}:${pending.picture}`,
          );
          event.dataTransfer.effectAllowed = "move";
          this.selectedTile = true;
        });
        tray.append(tile);
        if (sending) {
          const send = document.createElement("button");
          send.className = "secondary-button handoff-tile";
          send.textContent = `Serahkan ke ${this.tileName(pending.owner)} →`;
          send.disabled = this.mode !== "playing" || this.isBotTurn();
          send.addEventListener("click", () => {
            if (!this.isBotTurn()) this.handoffTile();
          });
          tray.append(send);
        } else {
          const hint = document.createElement("span");
          hint.textContent = this.selectedTile
            ? "Pilih kolom gambar yang sama ↓"
            : "Ketuk ubin, lalu kolomnya ↓";
          tray.append(hint);
        }
      } else {
        const empty = document.createElement("span");
        empty.textContent = "Ubin yang diterima akan muncul di sini.";
        tray.append(empty);
      }
      const collection = document.createElement("div");
      collection.className = "tile-collection";
      collection.setAttribute("aria-label", `Susunan ${this.tileName(player)}`);
      const progress = document.createElement("span");
      const total = duel.collections[player].reduce((sum, n) => sum + n, 0);
      progress.textContent = `TERSUSUN ${total}/16`;
      const groups = document.createElement("div");
      groups.className = "collection-columns";
      duel.collections[player].forEach((count, picture) => {
        const group = document.createElement("button");
        group.className = `collection-column ${count === 4 ? "complete-group" : ""}`;
        group.dataset.picture = picture;
        group.disabled =
          this.mode !== "playing" || this.isBotTurn() || !receiving;
        group.setAttribute(
          "aria-disabled",
          String(group.disabled || !this.selectedTile),
        );
        group.setAttribute(
          "aria-label",
          `Susun ${theme.labels[picture]} di kolom ${this.tileName(player)}, ${count} dari 4`,
        );
        const title = document.createElement("span");
        title.className = "column-title";
        title.textContent = `${theme.pictures[picture]} ${count}/4`;
        group.append(title);
        for (let slot = 0; slot < 4; slot++) {
          const item = document.createElement("span");
          item.className = `collection-slot ${slot < count ? "filled-slot" : ""}`;
          item.textContent = slot < count ? theme.pictures[picture] : "·";
          group.append(item);
        }
        group.addEventListener("click", () => this.placeTile(player, picture));
        group.addEventListener("dragover", (event) => {
          if (this.mode === "playing" && receiving && !this.isBotTurn())
            event.preventDefault();
        });
        group.addEventListener("drop", (event) => {
          event.preventDefault();
          if (
            event.dataTransfer.getData("text/plain") !==
            `${player}:${duel.pending?.picture}`
          )
            return;
          this.placeTile(player, picture);
        });
        groups.append(group);
      });
      collection.append(progress, groups);
      const note = document.createElement("small");
      note.textContent =
        active && duel.pending
          ? duel.pending.stage === "handoff"
            ? "Serahkan ubin ini ke wadah pemiliknya."
            : "Susun ubin ke kolom gambar yang sama."
          : active && duel.availableBoard() !== player
            ? "Papanmu habis. Buka ubin dari papan lawan."
            : "Buka satu ubin saat giliranmu.";
      panel.append(header, grid, tray, collection, note);
      $("boardGrid").append(panel);
    }
  }
  renderCamps(role) {
    const local =
      this.mode !== "ready" && this.opponent === "local" && this.players;
    $("boardView").classList.toggle("local-match", Boolean(local));
    $("topCamp").hidden = $("bottomCamp").hidden =
      !local || this.id === "mahjong";
    if (!local) {
      delete $("boardView").dataset.activeTeam;
      return;
    }
    const firstRole = this.id === "chess" ? "w" : "X",
      secondRole = this.id === "chess" ? "b" : "O";
    const upperPlayer = this.id === "chess" && this.campFlipped ? 0 : 1;
    const upperRole = upperPlayer === this.firstPlayer ? firstRole : secondRole;
    const lowerRole = upperRole === firstRole ? secondRole : firstRole;
    $("boardView").dataset.topTeam = this.player(upperRole).team;
    $("boardView").dataset.bottomTeam = this.player(lowerRole).team;
    $("boardView").dataset.activeTeam = this.player(role).team;
    requestAnimationFrame(() => this.updateSplit());
    for (const [id, campRole] of [
      ["topCamp", upperRole],
      ["bottomCamp", lowerRole],
    ]) {
      const player = this.player(campRole),
        camp = $(id);
      camp.replaceChildren();
      camp.dataset.team = player.team;
      camp.classList.toggle(
        "active-camp",
        this.mode === "playing" && role === campRole,
      );
      if (this.mode === "playing" && role === campRole)
        camp.setAttribute("aria-current", "true");
      else camp.removeAttribute("aria-current");
      const name = document.createElement("strong");
      name.textContent = player.name;
      const label = document.createElement("span");
      label.textContent = `Kubu ${TEAM_NAMES[player.team]} · ${campRole === "w" ? "Putih" : campRole === "b" ? "Hitam" : campRole}`;
      const status = document.createElement("b");
      status.textContent =
        this.mode === "ended"
          ? this.winnerRole === campRole
            ? "MENANG!"
            : this.winnerRole
              ? "SELESAI"
              : "SERI"
          : this.mode === "paused"
            ? "DIJEDA"
            : role === campRole
              ? "▶ GILIRANMU"
              : "MENUNGGU";
      const identity = document.createElement("div");
      identity.append(name, label);
      camp.append(identity, status);
    }
  }
  render() {
    const focusCell = document.activeElement?.dataset.cell;
    const chess = this.id === "chess";
    const tiles = this.id === "mahjong";
    $("boardGrid").className = tiles
      ? "tile-duel"
      : chess
        ? "chess-grid"
        : "tic-grid";
    $("boardGrid").replaceChildren();
    const role = tiles
      ? this.tileRole(this.tileGame.actor())
      : chess
        ? this.chess.turn()
        : this.turn;
    const currentPlayer = this.player(role);
    const turn = chess
      ? this.chess.turn() === "w"
        ? "Putih"
        : "Hitam"
      : tiles
        ? this.tileName(this.tileGame.actor())
        : this.turn;
    $("boardTurn").textContent =
      this.mode === "ready"
        ? "Pilih mode permainan"
        : this.mode === "paused"
          ? "Pertandingan dijeda"
          : this.mode === "ended"
            ? "Pertandingan selesai"
            : this.thinking
              ? "Bot sedang berpikir…"
              : `Giliran ${currentPlayer ? currentPlayer.name + " · Kubu " + TEAM_NAMES[currentPlayer.team] : this.isBotTurn() ? "bot" : turn}${chess && this.chess.isCheck() ? " · SKAK!" : ""}`;
    if (
      tiles &&
      this.mode === "playing" &&
      !this.thinking &&
      this.tileGame.pending
    ) {
      const pending = this.tileGame.pending;
      $("boardTurn").textContent =
        pending.stage === "handoff"
          ? `${this.tileName(pending.sender)}: serahkan ubin ke ${this.tileName(pending.owner)}`
          : `${this.tileName(pending.owner)}: susun ubin di kolomnya`;
    }
    this.renderCamps(role);
    $("boardMode").textContent =
      this.mode === "ready"
        ? "Bot atau 2 pemain lokal"
        : this.opponent === "bot"
          ? `Lawan bot · ${tiles ? "Ubin acak" : this.easy ? "Santai" : "Pintar"}`
          : "2 pemain · satu perangkat";
    $("boardInstructions").textContent = tiles
      ? "Buka satu ubin dari papanmu. Serahkan ubin lawan ke wadahnya. Pemilik mengetuk ubin lalu kolom gambar yang sama, atau menyeretnya di PC. Susun empat kolom penuh untuk menang."
      : chess
        ? "Pilih bidak, lalu kotak tujuan. Titik menandai langkah legal."
        : "Ketuk kotak kosong. Susun 3 simbol mendatar, tegak, atau diagonal.";
    $("moveHistoryWrap").hidden = !chess;
    if (tiles) {
      this.renderTiles();
    } else if (!chess) {
      this.cells.forEach((value, i) => {
        const button = document.createElement("button");
        button.className = `tic-cell ${value === "X" ? "cross" : value === "O" ? "circle" : ""}`;
        button.dataset.cell = i;
        if (value && this.player(value))
          button.dataset.team = this.player(value).team;
        button.textContent = value || "";
        button.setAttribute(
          "aria-label",
          `Kotak ${i + 1}${value ? ": " + value : " kosong"}`,
        );
        button.classList.toggle(
          "winning",
          Boolean(this.result?.line.includes(i)),
        );
        button.setAttribute(
          "aria-disabled",
          String(this.mode !== "playing" || Boolean(value) || this.isBotTurn()),
        );
        button.addEventListener("click", () => this.click(i));
        $("boardGrid").append(button);
      });
    } else {
      const legal = this.selected
        ? this.chess
            .moves({ square: this.selected, verbose: true })
            .map((move) => move.to)
        : [];
      const ranks = this.flipped
          ? [1, 2, 3, 4, 5, 6, 7, 8]
          : [8, 7, 6, 5, 4, 3, 2, 1],
        files = this.flipped ? "hgfedcba" : "abcdefgh";
      for (const rank of ranks)
        for (const file of files) {
          const square = file + rank,
            piece = this.chess.get(square),
            button = document.createElement("button");
          button.dataset.cell = square;
          button.className = `chess-cell ${(file.charCodeAt(0) - 97 + rank) % 2 ? "dark" : "light"}`;
          if (piece) {
            const glyph = document.createElement("span");
            glyph.className = `piece ${piece.color === "w" ? "white-piece" : "black-piece"}`;
            glyph.textContent = PIECES[piece.color][piece.type];
            button.append(glyph);
          }
          if (file === files[0]) {
            const label = document.createElement("small");
            label.className = "rank-label";
            label.textContent = rank;
            button.append(label);
          }
          if (rank === ranks[7]) {
            const label = document.createElement("small");
            label.className = "file-label";
            label.textContent = file;
            button.append(label);
          }
          button.classList.toggle("selected-square", this.selected === square);
          button.classList.toggle("legal-square", legal.includes(square));
          button.classList.toggle(
            "last-square",
            this.lastMove?.from === square || this.lastMove?.to === square,
          );
          button.classList.toggle(
            "check-square",
            Boolean(
              piece?.type === "k" &&
              piece.color === this.chess.turn() &&
              this.chess.isCheck(),
            ),
          );
          button.setAttribute(
            "aria-label",
            `${square}${piece ? ": " + (piece.color === "w" ? "putih " : "hitam ") + NAMES[piece.type] : " kosong"}${legal.includes(square) ? ", langkah legal" : ""}`,
          );
          button.setAttribute(
            "aria-disabled",
            String(this.mode !== "playing" || this.isBotTurn()),
          );
          button.addEventListener("click", () => this.click(square));
          $("boardGrid").append(button);
        }
      const history = this.chess.history();
      $("moveHistory").textContent = history.length
        ? history
            .map(
              (move, i) =>
                `${i % 2 === 0 ? Math.floor(i / 2) + 1 + ". " : ""}${move}`,
            )
            .join("  ")
        : "Belum ada langkah. Putih mulai duluan.";
      $("moveHistory").scrollTop = $("moveHistory").scrollHeight;
    }
    if (focusCell !== undefined && this.mode !== "ended") {
      const previous = $("boardGrid").querySelector(
        `[data-cell="${focusCell}"]`,
      );
      const next =
        previous && !previous.disabled
          ? previous
          : tiles
            ? $("boardGrid").querySelector("button:not(:disabled)")
            : null;
      next?.focus({ preventScroll: true });
    }
  }
}
