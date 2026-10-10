export const MEMORY_THEMES = {
  animals: {
    name: "Hewan",
    pictures: [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
      "🐔",
      "🐧",
      "🦉",
      "🦋",
      "🐢",
    ],
  },
  fruit: {
    name: "Buah & kebun",
    pictures: [
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥝",
      "🥥",
      "🍅",
      "🥕",
      "🌽",
      "🥑",
    ],
  },
  vehicles: {
    name: "Kendaraan",
    pictures: [
      "🚗",
      "🚕",
      "🚙",
      "🚌",
      "🚎",
      "🏎️",
      "🚓",
      "🚑",
      "🚒",
      "🚚",
      "🚜",
      "🚲",
      "🛵",
      "🏍️",
      "🚂",
      "🚁",
      "✈️",
      "🚀",
      "⛵",
      "🚢",
    ],
  },
  nature: {
    name: "Alam & angkasa",
    pictures: [
      "🌸",
      "🌻",
      "🌷",
      "🌹",
      "🌵",
      "🌴",
      "🌲",
      "🍄",
      "🍀",
      "🍁",
      "🌈",
      "☀️",
      "🌙",
      "⭐",
      "🪐",
      "☁️",
      "❄️",
      "⚡",
      "🔥",
      "🌋",
    ],
  },
  ocean: {
    name: "Dunia laut",
    pictures: [
      "🐟",
      "🐠",
      "🐡",
      "🦈",
      "🐬",
      "🐳",
      "🐋",
      "🐙",
      "🦑",
      "🦀",
      "🦞",
      "🦐",
      "🦭",
      "🐚",
      "🪸",
      "🪼",
      "🏝️",
      "⚓",
      "🛟",
      "🔱",
    ],
  },
};
MEMORY_THEMES.mixed = {
  name: "Campur semua!",
  pictures: [
    ...new Set(Object.values(MEMORY_THEMES).flatMap((t) => t.pictures)),
  ],
};
export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export class MemoryMatch {
  constructor({
    theme = "animals",
    pairs = 10,
    local = false,
    firstPlayer = 0,
    random = Math.random,
  } = {}) {
    if (
      !MEMORY_THEMES[theme] ||
      !Number.isInteger(pairs) ||
      pairs < 4 ||
      pairs > 20
    )
      throw Error("Pilih tema dan 4–20 pasangan.");
    this.pairs = pairs;
    this.local = local;
    this.turn = firstPlayer;
    this.scores = [0, 0];
    this.attempts = 0;
    this.open = [];
    this.mismatchRemaining = 0;
    this.winner = null;
    this.cards = shuffled(
      shuffled(MEMORY_THEMES[theme].pictures, random)
        .slice(0, pairs)
        .flatMap((picture) => [
          { picture, matched: false },
          { picture, matched: false },
        ]),
      random,
    );
  }
  flip(index) {
    if (
      this.winner !== null ||
      this.open.length === 2 ||
      !Number.isInteger(index) ||
      !this.cards[index] ||
      this.cards[index].matched ||
      this.open.includes(index)
    )
      return null;
    this.open.push(index);
    if (this.open.length === 1) return "first";
    this.attempts++;
    if (this.cards[this.open[0]].picture !== this.cards[index].picture) {
      this.mismatchRemaining = 0.85;
      return "miss";
    }
    this.open.forEach((i) => (this.cards[i].matched = true));
    this.scores[this.turn]++;
    this.open = [];
    if (this.scores[0] + this.scores[1] === this.pairs)
      this.winner = this.local
        ? this.scores[0] === this.scores[1]
          ? "draw"
          : this.scores[0] > this.scores[1]
            ? 0
            : 1
        : 0;
    return "match";
  }
  tick(dt) {
    if (!this.mismatchRemaining) return false;
    this.mismatchRemaining = Math.max(0, this.mismatchRemaining - dt);
    if (this.mismatchRemaining) return false;
    this.open = [];
    if (this.local) this.turn = 1 - this.turn;
    return true;
  }
}
