const picture = (content) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${content}</svg>`,
  );
export const PUZZLE_ART = {
  forest: {
    name: "Rubah di hutan",
    url: picture(
      '<rect width="400" height="400" fill="#aec7b3"/><circle cx="320" cy="70" r="44" fill="#dbd19f"/><path d="M0 210Q100 120 220 220T400 200V400H0" fill="#72a387"/><path d="M0 310Q100 220 220 300T400 280V400H0" fill="#488171"/><path d="M75 190L75 55L150 175M250 175L325 55L325 190" fill="#c58c6b" stroke="#b77658" stroke-width="8"/><ellipse cx="200" cy="244" rx="128" ry="112" fill="#cb946c"/><path d="M90 223Q120 200 200 284Q280 200 310 223Q293 330 200 344Q107 330 90 223" fill="#dbd0ba"/><circle cx="150" cy="232" r="12" fill="#36423f"/><circle cx="250" cy="232" r="12" fill="#36423f"/><path d="M180 278Q200 294 220 278Q200 256 180 278" fill="#36423f"/><circle cx="60" cy="360" r="13" fill="#dac99b"/><circle cx="345" cy="335" r="16" fill="#d8b9b6"/>',
    ),
  },
  ocean: {
    name: "Paus di laut",
    url: picture(
      '<rect width="400" height="400" fill="#acc9cd"/><path d="M0 100Q60 50 120 100T240 100T360 100L400 100V400H0" fill="#6ea4ac"/><path d="M0 295Q70 265 150 302T320 290L400 300V400H0" fill="#477e8f"/><ellipse cx="185" cy="216" rx="130" ry="87" fill="#485e80"/><path d="M290 210L352 145L350 220L390 175Q390 260 300 267" fill="#485e80"/><path d="M67 238Q184 320 295 243Q245 328 141 297" fill="#d0cabc"/><circle cx="130" cy="203" r="11" fill="#2c3845"/><path d="M133 244Q165 274 193 245" fill="none" stroke="#2c3845" stroke-width="7" stroke-linecap="round"/><path d="M170 112Q155 59 119 64M170 112Q171 45 218 64" fill="none" stroke="#d6d6ca" stroke-width="11" stroke-linecap="round"/><circle cx="40" cy="45" r="12" fill="#d6d6ca"/><circle cx="323" cy="350" r="18" fill="#d2ba89"/><circle cx="352" cy="310" r="9" fill="#d6d6ca"/>',
    ),
  },
  space: {
    name: "Petualangan angkasa",
    url: picture(
      '<rect width="400" height="400" fill="#393b52"/><circle cx="293" cy="105" r="67" fill="#cbae7f"/><ellipse cx="293" cy="105" rx="98" ry="21" fill="none" stroke="#b6868d" stroke-width="13" transform="rotate(-25 293 105)"/><circle cx="54" cy="64" r="5" fill="#dbd3b4"/><circle cx="365" cy="251" r="6" fill="#dbd3b4"/><circle cx="206" cy="348" r="5" fill="#dbd3b4"/><circle cx="63" cy="322" r="4" fill="#dbd3b4"/><path d="M99 305Q47 234 138 112Q235 194 203 277L168 319Z" fill="#c8d1c6"/><path d="M138 112L112 152L170 179L182 158" fill="#c78b8f"/><circle cx="138" cy="227" r="27" fill="#7cadb9" stroke="#455a6d" stroke-width="7"/><path d="M103 277L65 344L104 332L122 360L138 312M181 271L235 310L211 309L201 342L165 310" fill="#c78b8f"/><path d="M127 315L122 388L168 326" fill="#d6b17f"/>',
    ),
  },
};
export class SlidingPuzzle {
  constructor({ size = 3, steps = 30, random = Math.random } = {}) {
    if (![3, 4].includes(size)) throw Error("Pilih papan 3×3 atau 4×4.");
    this.size = size;
    this.tiles = Array.from(
      { length: size * size },
      (_, i) => (i + 1) % (size * size),
    );
    this.empty = size * size - 1;
    this.moves = 0;
    this.winner = null;
    this.route = [];
    let previous = -1;
    for (let i = 0; i < steps; i++) {
      const choices = this.neighbors().filter((n) => n !== previous);
      const index = choices[Math.floor(random() * choices.length)];
      previous = this.empty;
      this.swap(index);
      this.route.push(previous);
    }
    if (this.solved()) {
      const index = this.neighbors()[0],
        old = this.empty;
      this.swap(index);
      this.route.push(old);
    }
  }
  neighbors() {
    const row = Math.floor(this.empty / this.size),
      col = this.empty % this.size;
    return [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ]
      .filter(([r, c]) => r >= 0 && r < this.size && c >= 0 && c < this.size)
      .map(([r, c]) => r * this.size + c);
  }
  swap(index) {
    [this.tiles[index], this.tiles[this.empty]] = [
      this.tiles[this.empty],
      this.tiles[index],
    ];
    this.empty = index;
  }
  solved() {
    return this.tiles.every((n, i) => n === (i + 1) % (this.size * this.size));
  }
  move(index) {
    if (
      this.winner !== null ||
      !Number.isInteger(index) ||
      !this.neighbors().includes(index)
    )
      return false;
    const previous = this.empty;
    this.swap(index);
    if (this.route.at(-1) === index) this.route.pop();
    else this.route.push(previous);
    this.moves++;
    if (this.solved()) this.winner = 0;
    return true;
  }
  hint() {
    return this.winner === null ? this.route.at(-1) : null;
  }
}
