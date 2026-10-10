import { Chess, ticResult, ticBot, chessBot } from "./board-engine.js";
import { localPlayers, playerForRole, TEAM_NAMES } from "./players.js";
import { TileDuel } from "./mahjong-engine.js";
import { renderTileDuel } from "./tile-ui.js";
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
        ? "Mahjong Anak"
        : this.id === "chess"
          ? "Siap mengatur strategi?"
          : "Silang atau lingkaran?";
    $("boardSetupText").textContent =
      this.id === "mahjong"
        ? "Lempar dadu; nilai tertinggi mulai duluan. Terus buka bidak selama mendapat gambarmu sendiri. Bidak lawan otomatis tersedia untuk lawan; ia langsung mengambil dan menyusunnya. Gambar yang sama wajib satu kolom."
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
        requireRoll: true,
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
      this.tileGame = new TileDuel({
        firstTheme: this.tileTheme,
        requireRoll: true,
      });
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
    if (this.opponent === "local" && this.id !== "mahjong") {
      this.firstPlayer = 1 - this.firstPlayer;
      if (this.id === "chess") this.flipped = !this.flipped;
    }
    if (this.id === "mahjong")
      this.tileGame = new TileDuel({
        firstTheme: this.tileTheme,
        firstPlayer: this.firstPlayer,
        requireRoll: true,
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
        if (this.tileGame.awaitingDice) {
          this.rollTileDice(1);
          return;
        }
        const pending = this.tileGame.pending;
        if (pending) {
          if (pending.stage === "pickup") this.pickupTile(true);
          else
            this.placeTile(
              pending.owner,
              this.tileGame.columnFor(pending.owner, pending.picture),
              true,
            );
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
  rollTileDice(player) {
    if (this.mode !== "playing" || this.tileGame.roll(player) === null) return;
    if (!this.tileGame.awaitingDice) this.firstPlayer = this.tileGame.turn;
    this.onMove();
    this.render();
    this.queueBot();
    this.focusTileAction();
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
  pickupTile(automatic = false) {
    if (this.mode !== "playing" || (!automatic && this.isBotTurn())) return;
    if (!this.tileGame.pickup(this.tileGame.pending?.owner)) return;
    this.selectedTile = false;
    this.tileError = null;
    this.render();
    this.queueBot();
    this.focusTileAction();
  }
  placeTile(player, column, automatic = false) {
    if (
      this.mode !== "playing" ||
      (!automatic && (!this.selectedTile || this.isBotTurn()))
    )
      return;
    if (!this.tileGame.place(player, column)) {
      if (this.tileGame.pending?.owner === player) {
        this.tileError =
          "Gambar ini harus satu kolom dengan bidak yang sama. Untuk gambar baru, pilih kolom kosong.";
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
      panel?.querySelector(".tray-tile:not(:disabled)") ||
      $("boardGrid").querySelector(
        ".roll-tile-dice:not(:disabled), .tray-tile:not(:disabled), .duel-tile:not(:disabled)",
      );
    action?.focus({
      preventScroll:
        this.id === "mahjong" &&
        window.matchMedia("(max-width: 900px)").matches,
    });
    if (
      window.matchMedia("(max-width: 900px)").matches &&
      this.id === "mahjong"
    )
      return;
    const exchange = $("boardGrid").querySelector(".tile-exchange");
    if (action && exchange && !exchange.contains(action)) {
      const hidden =
        exchange.getBoundingClientRect().bottom +
        10 -
        action.getBoundingClientRect().top;
      if (hidden > 0)
        $("boardView").querySelector(".board-layout").scrollTop -= hidden;
    }
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
    renderTileDuel(this);
  }
  renderCamps(role) {
    const local =
      this.mode !== "ready" && this.opponent === "local" && this.players;
    const bot = this.mode !== "ready" && this.opponent === "bot";
    $("boardView").classList.toggle("local-match", Boolean(local));
    $("boardView").classList.toggle("bot-match", bot);
    $("topCamp").hidden = $("bottomCamp").hidden =
      !(local || bot) || this.id === "mahjong";
    if (!(local || bot)) {
      delete $("boardView").dataset.activeTeam;
      return;
    }
    const firstRole = this.id === "chess" ? "w" : "X",
      secondRole = this.id === "chess" ? "b" : "O";
    const campPlayer = (campRole) =>
      this.player(campRole) || {
        name: this.playerName(campRole),
        team: campRole === firstRole ? "blue" : "red",
      };
    const upperPlayer = this.id === "chess" && this.campFlipped ? 0 : 1;
    const upperRole = upperPlayer === this.firstPlayer ? firstRole : secondRole;
    const lowerRole = upperRole === firstRole ? secondRole : firstRole;
    $("boardView").dataset.topTeam = campPlayer(upperRole).team;
    $("boardView").dataset.bottomTeam = campPlayer(lowerRole).team;
    $("boardView").dataset.activeTeam = campPlayer(role).team;
    requestAnimationFrame(() => this.updateSplit());
    for (const [id, campRole] of [
      ["topCamp", upperRole],
      ["bottomCamp", lowerRole],
    ]) {
      const player = campPlayer(campRole),
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
              ? bot && campRole === secondRole
                ? "▶ GILIRAN BOT"
                : "▶ GILIRANMU"
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
      this.tileGame.awaitingDice
    )
      $("boardTurn").textContent =
        `${this.tileName(this.tileGame.dicePlayer())}: lempar dadu`;
    if (
      tiles &&
      this.mode === "playing" &&
      !this.thinking &&
      this.tileGame.pending
    ) {
      const pending = this.tileGame.pending;
      $("boardTurn").textContent =
        pending.stage === "pickup"
          ? `${this.tileName(pending.owner)}: ambil bidakmu dan susun`
          : `${this.tileName(pending.owner)}: susun bidak di kolom pilihanmu`;
    }
    this.renderCamps(role);
    $("boardMode").textContent =
      this.mode === "ready"
        ? "Bot atau 2 pemain lokal"
        : this.opponent === "bot"
          ? `Lawan bot · ${tiles ? "Ubin acak" : this.easy ? "Santai" : "Pintar"}`
          : "2 pemain · satu perangkat";
    $("boardInstructions").textContent = tiles
      ? "Dadu tertinggi mulai duluan. Bidak sendiri: susun dan terus bermain. Bidak lawan: otomatis pindah ke lawan untuk diambil dan disusun. Gambar sama wajib satu kolom. Bisa seret atau ketuk bidak lalu tujuan."
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
