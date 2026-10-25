import { CHARACTER_THEMES } from "./tile-characters.js";
export const TILE_COLUMNS = 6,
  TILE_ROWS = 4;
export const TILES_PER_PLAYER = TILE_COLUMNS * TILE_ROWS;
export const TILE_THEMES = {
  fruit: {
    name: "Buah",
    pictures: ["🍎", "🍌", "🍇", "🍊", "🍓", "🍍"],
    labels: ["Apel", "Pisang", "Anggur", "Jeruk", "Stroberi", "Nanas"],
  },
  animal: {
    name: "Hewan",
    pictures: ["🐱", "🐶", "🐰", "🐼", "🐸", "🐵"],
    labels: ["Kucing", "Anjing", "Kelinci", "Panda", "Katak", "Monyet"],
  },
  ...CHARACTER_THEMES,
};

// Children's collection duel: two mixed boards, six pictures per theme, four copies of each picture.
export class TileDuel {
  constructor({
    firstTheme = "fruit",
    secondTheme = firstTheme === "fruit" ? "animal" : "fruit",
    firstPlayer = 0,
    random = Math.random,
    requireRoll = false,
  } = {}) {
    if (
      !Object.hasOwn(TILE_THEMES, firstTheme) ||
      !Object.hasOwn(TILE_THEMES, secondTheme) ||
      firstTheme === secondTheme ||
      ![0, 1].includes(firstPlayer)
    )
      throw new Error("Tema atau giliran awal tidak valid.");
    this.themes = [firstTheme, secondTheme];
    this.turn = firstPlayer;
    this.random = random;
    this.awaitingDice = requireRoll;
    this.dice = [null, null];
    this.diceHistory = [];
    this.collections = [
      Array(TILE_COLUMNS).fill(0),
      Array(TILE_COLUMNS).fill(0),
    ];
    this.columns = [
      Array(TILE_COLUMNS).fill(null),
      Array(TILE_COLUMNS).fill(null),
    ];
    this.winner = null;
    this.last = null;
    this.pending = null;
    const tiles = this.themes.flatMap((theme) =>
      Array.from({ length: TILES_PER_PLAYER }, (_, i) => ({
        theme,
        picture: Math.floor(i / 4),
        revealed: false,
      })),
    );
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    this.boards = [
      tiles.slice(0, TILES_PER_PLAYER),
      tiles.slice(TILES_PER_PLAYER),
    ];
    // Even an extreme shuffle must leave both themes on each board.
    if (
      this.boards[0].every((tile) => tile.theme === this.boards[0][0].theme)
    ) {
      [this.boards[0][TILES_PER_PLAYER - 1], this.boards[1][0]] = [
        this.boards[1][0],
        this.boards[0][TILES_PER_PLAYER - 1],
      ];
    }
  }
  availableBoard() {
    return this.boards[this.turn].some((tile) => !tile.revealed)
      ? this.turn
      : 1 - this.turn;
  }
  choices() {
    if (this.awaitingDice || this.pending || this.winner !== null) return [];
    const board = this.availableBoard();
    return this.boards[board].flatMap((tile, index) =>
      tile.revealed ? [] : [{ board, index }],
    );
  }
  draw(board, index) {
    if (
      this.winner !== null ||
      this.awaitingDice ||
      this.pending ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= TILES_PER_PLAYER ||
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
      stage: sender === owner ? "arrange" : "pickup",
    };
    this.turn = owner;
    return this.last;
  }
  actor() {
    if (this.awaitingDice) return this.dicePlayer();
    return this.pending ? this.pending.owner : this.turn;
  }
  dicePlayer() {
    return this.dice[0] === null ? 0 : 1;
  }
  roll(player) {
    if (!this.awaitingDice || player !== this.dicePlayer()) return null;
    const value = 1 + Math.floor(this.random() * 6);
    this.dice[player] = value;
    if (this.dice.every((die) => die !== null)) {
      this.diceHistory.push([...this.dice]);
      if (this.dice[0] === this.dice[1]) this.dice = [null, null];
      else {
        this.turn = this.dice[0] > this.dice[1] ? 0 : 1;
        this.awaitingDice = false;
      }
    }
    return value;
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
      column >= TILE_COLUMNS
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
    this.columns[player][column] = picture;
    this.collections[player][picture]++;
    this.pending = null;
    if (this.collections[player].every((count) => count === 4))
      this.winner = player;
    else this.turn = player;
    return true;
  }
}
