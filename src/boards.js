import { Chess, ticResult, ticBot, chessBot } from "./board-engine.js";
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
    $("boardReplay").addEventListener("click", () => this.setup());
    $("boardPause").addEventListener("click", () => this.pause());
    $("flipBoard").addEventListener("click", () => {
      this.flipped = !this.flipped;
      this.render();
    });
    $("opponent").addEventListener("change", () => {
      $("difficultyField").hidden = $("opponent").value !== "bot";
    });
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
      const buttons = [...$("boardGrid").children],
        i = buttons.indexOf(document.activeElement),
        step = this.id === "chess" ? 8 : 3;
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
    this.setup();
  }
  setup() {
    this.clearBot();
    this.mode = "ready";
    this.selected = null;
    this.cells = Array(9).fill(null);
    this.turn = "X";
    this.chess = new Chess();
    this.result = null;
    this.lastMove = null;
    $("boardView").dataset.game = this.id;
    $("boardResult").hidden = true;
    $("boardSetup").hidden = false;
    $("boardSettings").hidden = false;
    $("boardSetupTitle").textContent =
      this.id === "chess"
        ? "Siap mengatur strategi?"
        : "Silang atau lingkaran?";
    $("boardSetupText").textContent =
      this.id === "chess"
        ? "Pilih lawanmu. Kamu bermain dengan bidak putih saat melawan bot."
        : "Susun 3 simbol berbaris. Kamu bermain sebagai X saat melawan bot.";
    $("boardStart").textContent = "Mulai pertandingan";
    $("flipBoard").hidden = this.id !== "chess";
    $("boardPause").disabled = true;
    this.render();
  }
  start() {
    this.opponent = $("opponent").value;
    this.easy = $("botDifficulty").value === "easy";
    this.mode = "playing";
    $("boardSetup").hidden = true;
    $("boardPause").disabled = false;
    this.onStart(this.id);
    this.render();
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
      (this.id === "chess" ? this.chess.turn() === "b" : this.turn === "O")
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
      if (this.id === "chess") {
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
  makeTicMove(index) {
    if (this.mode !== "playing" || this.cells[index]) return;
    this.cells[index] = this.turn;
    this.result = ticResult(this.cells);
    this.onMove();
    if (this.result)
      this.finish(
        this.result.winner === "draw"
          ? "Seri! Sama-sama hebat."
          : `${this.result.winner === "O" && this.opponent === "bot" ? "Bot" : "Pemain " + this.result.winner} menang!`,
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
        `Skakmat! ${this.chess.turn() === "w" ? (this.opponent === "bot" ? "Bot" : "Hitam") : "Putih"} menang.`,
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
  finish(message) {
    this.clearBot();
    this.mode = "ended";
    $("boardPause").disabled = true;
    $("boardResult").hidden = false;
    $("boardResultText").textContent = message;
    this.render();
    $("boardReplay").focus({ preventScroll: true });
  }
  render() {
    const focusCell = document.activeElement?.dataset.cell;
    const chess = this.id === "chess";
    $("boardGrid").className = chess ? "chess-grid" : "tic-grid";
    $("boardGrid").replaceChildren();
    const turn = chess
      ? this.chess.turn() === "w"
        ? "Putih"
        : "Hitam"
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
              : `Giliran ${this.isBotTurn() ? "bot" : turn}${chess && this.chess.isCheck() ? " · SKAK!" : ""}`;
    $("boardMode").textContent =
      this.mode === "ready"
        ? "Bot atau 2 pemain lokal"
        : this.opponent === "bot"
          ? `Lawan bot · ${this.easy ? "Santai" : "Pintar"}`
          : "2 pemain · satu perangkat";
    $("boardInstructions").textContent = chess
      ? "Pilih bidak, lalu kotak tujuan. Titik menandai langkah legal."
      : "Ketuk kotak kosong. Susun 3 simbol mendatar, tegak, atau diagonal.";
    $("moveHistoryWrap").hidden = !chess;
    if (!chess) {
      this.cells.forEach((value, i) => {
        const button = document.createElement("button");
        button.className = `tic-cell ${value === "X" ? "cross" : value === "O" ? "circle" : ""}`;
        button.dataset.cell = i;
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
    if (focusCell !== undefined && this.mode !== "ended")
      $("boardGrid")
        .querySelector(`[data-cell="${focusCell}"]`)
        ?.focus({ preventScroll: true });
  }
}
