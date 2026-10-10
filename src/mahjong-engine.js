export const TILE_THEMES = {
  fruit: {
    name: "Buah",
    pictures: ["🍎", "🍌", "🍇", "🍊"],
    labels: ["Apel", "Pisang", "Anggur", "Jeruk"],
  },
  animal: {
    name: "Hewan",
    pictures: ["🐱", "🐶", "🐰", "🐼"],
    labels: ["Kucing", "Anjing", "Kelinci", "Panda"],
  },
};

// Children's collection duel: two mixed boards, four copies of each picture.
export class TileDuel {
  constructor({
    firstTheme = "fruit",
    firstPlayer = 0,
    random = Math.random,
  } = {}) {
    if (!TILE_THEMES[firstTheme] || ![0, 1].includes(firstPlayer))
      throw new Error("Tema atau giliran awal tidak valid.");
    this.themes = [firstTheme, firstTheme === "fruit" ? "animal" : "fruit"];
    this.turn = firstPlayer;
    this.collections = [Array(4).fill(0), Array(4).fill(0)];
    this.columns = [Array(4).fill(null), Array(4).fill(null)];
    this.winner = null;
    this.last = null;
    this.pending = null;
    const tiles = Object.keys(TILE_THEMES).flatMap((theme) =>
      Array.from({ length: 16 }, (_, i) => ({
        theme,
        picture: Math.floor(i / 4),
        revealed: false,
      })),
    );
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    this.boards = [tiles.slice(0, 16), tiles.slice(16)];
    // Even an extreme shuffle must leave both themes on each board.
    if (
      this.boards[0].every((tile) => tile.theme === this.boards[0][0].theme)
    ) {
      [this.boards[0][15], this.boards[1][0]] = [
        this.boards[1][0],
        this.boards[0][15],
      ];
    }
  }
  availableBoard() {
    return this.boards[this.turn].some((tile) => !tile.revealed)
      ? this.turn
      : 1 - this.turn;
  }
  choices() {
    if (this.pending || this.winner !== null) return [];
    const board = this.availableBoard();
    return this.boards[board].flatMap((tile, index) =>
      tile.revealed ? [] : [{ board, index }],
    );
  }
  draw(board, index) {
    if (
      this.winner !== null ||
      this.pending ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= 16 ||
      board !== this.availableBoard()
    )
      return null;
    const tile = this.boards[board][index];
    if (tile.revealed) return null;
    const sender = this.turn;
    const owner = this.themes.indexOf(tile.theme);
    tile.revealed = true;
    this.last = {
      board,
      index,
      sender,
      owner,
      theme: tile.theme,
      picture: tile.picture,
    };
    this.pending = {
      ...this.last,
      stage: sender === owner ? "arrange" : "handoff",
    };
    return this.last;
  }
  actor() {
    return this.pending && this.pending.stage !== "handoff"
      ? this.pending.owner
      : this.turn;
  }
  handoff(player) {
    if (
      this.winner !== null ||
      this.pending?.stage !== "handoff" ||
      this.pending.sender !== player
    )
      return false;
    this.pending.stage = "pickup";
    return true;
  }
  pickup(player) {
    if (
      this.winner !== null ||
      this.pending?.stage !== "pickup" ||
      this.pending.owner !== player
    )
      return false;
    this.pending.stage = "arrange";
    return true;
  }
  columnFor(player, picture) {
    const existing = this.columns[player].indexOf(picture);
    return existing !== -1 ? existing : this.columns[player].indexOf(null);
  }
  place(player, column) {
    if (
      this.winner !== null ||
      this.pending?.stage !== "arrange" ||
      this.pending.owner !== player ||
      !Number.isInteger(column) ||
      column < 0 ||
      column > 3
    )
      return false;
    const picture = this.pending.picture;
    const existing = this.columns[player].indexOf(picture);
    if (
      (existing !== -1 && existing !== column) ||
      (this.columns[player][column] !== null &&
        this.columns[player][column] !== picture) ||
      this.collections[player][picture] >= 4
    )
      return false;
    const sender = this.pending.sender;
    this.columns[player][column] = picture;
    this.collections[player][picture]++;
    this.pending = null;
    if (this.collections[player].every((count) => count === 4))
      this.winner = player;
    else this.turn = 1 - sender;
    return true;
  }
}
