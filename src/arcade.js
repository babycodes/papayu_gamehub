import { BomBom } from "./bomb-engine.js";
import { renderBomb, bombAction } from "./bomb-ui.js";
import { GAMES } from "./catalog.js";
import { localPlayers, TEAM_NAMES } from "./players.js";
import { MemoryMatch, MEMORY_THEMES } from "./memory-engine.js";
import { ConnectFour, connectBot } from "./connect-engine.js";
import { AirHockey } from "./hockey-engine.js";
import { ReactionRace } from "./reaction-engine.js";
import { SlidingPuzzle, PUZZLE_ART } from "./puzzle-engine.js";
import { CatchStars } from "./stars-engine.js";
export const ARCADE_IDS = new Set([
  "bom-bom",
  "memory-match",
  "connect-four",
  "air-hockey",
  "reaction-race",
  "sliding-puzzle",
  "catch-stars",
]);
const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export class ArcadeGames {
  constructor({ onStart, onMove, onMode }) {
    Object.assign(this, {
      onStart,
      onMove,
      onMode,
      mode: "ready",
      saved: {},
      last: 0,
    });
    this.root = $("arcadeView");
    this.pointers = new Map();
    this.keys = new Set();
    this.root.addEventListener("keydown", (e) => {
      if (this.mode !== "playing") return;
      if (this.id === "reaction-race" && ["Space", "KeyW"].includes(e.code)) {
        e.preventDefault();
        if (!e.repeat) this.reactionPress(e.code === "Space" ? 0 : 1);
        return;
      }
      if (this.id === "sliding-puzzle" && e.code.startsWith("Arrow")) {
        e.preventDefault();
        const offset = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -this.engine.size,
          ArrowDown: this.engine.size,
        }[e.code];
        this.puzzleMove(this.engine.empty + offset);
        return;
      }
      if (!["air-hockey", "catch-stars"].includes(this.id)) return;
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
        ].includes(e.code)
      ) {
        e.preventDefault();
        this.keys.add(e.code);
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    this.root.addEventListener("click", (e) => this.action(e));
    this.root.addEventListener("input", (e) => {
      if (e.target.id === "arcadePairs")
        $("pairCount").textContent =
          `${e.target.value} pasangan · ${2 * e.target.value} kartu`;
      if (e.target.id === "arcadeOpponent")
        $("arcadeNames").hidden = e.target.value !== "local";
    });
    this.resizeObserver = new ResizeObserver(() => {
      if (this.mode === "playing" || this.mode === "ended") this.renderBoard();
    });
    this.resizeObserver.observe(this.root);
  }
  open(id) {
    this.close();
    this.id = id;
    this.settings = {
      opponent: ["memory-match", "sliding-puzzle", "catch-stars"].includes(id)
        ? "solo"
        : "bot",
      theme: id === "sliding-puzzle" ? "forest" : "animals",
      pairs: 10,
      nameOne: "",
      nameTwo: "",
      team: "blue",
      ...this.saved[id],
    };
    this.firstPlayer = 0;
    this.chooseMode();
  }
  close() {
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.mode = "ready";
    this.pointers?.clear();
    this.keys?.clear();
  }
  chooseMode() {
    cancelAnimationFrame(this.frame);
    this.mode = "ready";
    this.pointers.clear();
    this.keys.clear();
    this.renderShell();
    this.renderSetup();
  }
  title() {
    return GAMES.find((g) => g.id === this.id).title;
  }
  renderShell() {
    this.root.innerHTML = `<div class="arcade-hud"><div><span class="arcade-kicker">LET’S PLAY</span><strong id="arcadeStatus" role="status" aria-live="polite">Siap bermain?</strong></div><div class="arcade-hud-actions"><button data-action="mode" class="secondary-button">Akhiri / mode</button><button data-action="pause" class="secondary-button" ${this.mode !== "playing" ? "disabled" : ""}>Jeda</button></div></div><div class="arcade-body"><div id="arcadePlay" class="arcade-play"></div><div id="arcadeOverlay" class="arcade-overlay"></div></div>`;
  }
  instructions() {
    return {
      "bom-bom":
        "Sembunyikan 5 bom di papan 6 × 4 milikmu. Kamu punya 5 hati! Bergantian buka kotak lawan: aman +1 poin, kena bom kehilangan satu hati. Pilih 5 bom agar permainan adil.",
      "memory-match":
        "Temukan dua gambar yang sama. Pasangan cocok memberi poin dan giliran tambahan!",
      "connect-four":
        "Jatuhkan keping ke kolom pilihanmu. Susun empat keping mendatar, tegak, atau diagonal!",
      "air-hockey":
        "Geser pemukul, jaga gawangmu, dan cetak gol! Dua pemain bisa menggeser bersamaan. Pemain utama di bawah (kanan saat landscape).",
      "reaction-race":
        "Tunggu lampu hijau, lalu ketuk secepatnya! Ketuk terlalu awal kehilangan ronde. PC: spasi untuk kamu, W untuk lawan lokal.",
      "catch-stars":
        "Geser keranjang untuk menangkap bintang. Hindari bom, kejar combo dan frenzy! Mode adu skor: kalian bergantian memakai keranjang yang sama.",
      "sliding-puzzle":
        "Geser bidak di sebelah kotak kosong untuk menyusun gambar. Semua puzzle bisa diselesaikan. Ada petunjuk jika kamu butuh bantuan!",
    }[this.id];
  }
  setupFields() {
    if (this.id === "bom-bom") return "";
    const difficulty =
      '<label>Level bot<select id="arcadeDifficulty"><option value="normal">Pintar</option><option value="easy">Santai</option></select></label>';
    if (this.id === "memory-match")
      return `<label>Tema gambar<select id="arcadeTheme">${Object.entries(
        MEMORY_THEMES,
      )
        .map(([id, t]) => `<option value="${id}">${t.name}</option>`)
        .join("")}</select></label>`;
    if (this.id === "air-hockey")
      return (
        '<label>Target gol<select id="arcadeGoal"><option value="3">3 gol · cepat</option><option value="5">5 gol</option><option value="7">7 gol</option></select></label>' +
        difficulty
      );
    if (this.id === "reaction-race")
      return (
        '<label>Jumlah ronde<select id="arcadeRounds"><option value="3">3 ronde</option><option value="5">5 ronde</option><option value="7">7 ronde</option></select></label>' +
        difficulty
      );
    if (this.id === "catch-stars")
      return `<label>Waktu per pemain<select id="arcadeDuration"><option value="30">30 detik</option><option value="45">45 detik</option><option value="60">60 detik</option></select></label>`;
    if (this.id === "sliding-puzzle")
      return `<label>Ukuran papan<select id="arcadeSize"><option value="3">3 × 3 · pemula</option><option value="4">4 × 4 · tantangan</option></select></label><label>Gambar<select id="arcadeTheme">${Object.entries(
        PUZZLE_ART,
      )
        .map(([id, t]) => `<option value="${id}">${t.name}</option>`)
        .join(
          "",
        )}</select></label><label>Pengacakan<select id="arcadeDifficulty"><option value="normal">Seru</option><option value="easy">Mudah · lebih sedikit langkah</option></select></label>`;
    return difficulty;
  }
  renderSetup() {
    const s = this.settings,
      solo = ["memory-match", "sliding-puzzle", "catch-stars"].includes(
        this.id,
      );
    $("arcadeOverlay").hidden = false;
    $("arcadeOverlay").innerHTML =
      `<form class="arcade-card arcade-setup" id="arcadeForm"><span class="arcade-kicker">PILIH PETUALANGANMU</span><h2>${this.title()}</h2><p>${this.instructions()}</p><div class="arcade-options"><label>Mode bermain<select id="arcadeOpponent">${solo ? '<option value="solo">Solo · santai sendiri</option>' : '<option value="bot">Lawan bot</option>'}${this.id !== "sliding-puzzle" ? '<option value="local">2 pemain · satu HP</option>' : ""}</select></label>${this.setupFields()}</div>${this.id === "memory-match" ? `<div class="memory-preview" aria-hidden="true">🐼 🍓 🚀 🌈 🐬 🦋</div><label class="pairs-label">Banyak pasangan <strong id="pairCount">${s.pairs} pasangan · ${s.pairs * 2} kartu</strong><input id="arcadePairs" type="range" min="4" max="20" value="${s.pairs}"></label><div class="pair-presets">${[10, 15, 20].map((n) => `<button type="button" data-pairs="${n}">${n} pasangan</button>`).join("")}</div>` : ""}<fieldset id="arcadeNames" ${s.opponent !== "local" ? "hidden" : ""}><legend>Siapa yang bermain?</legend><label>Pemain utama (bawah)<input id="arcadeNameOne" maxlength="20" value="${esc(s.nameOne)}" placeholder="Nama kamu" autocomplete="off"></label><label>Lawan (atas)<input id="arcadeNameTwo" maxlength="20" value="${esc(s.nameTwo)}" placeholder="Nama teman" autocomplete="off"></label><label>Kubu pemain utama<select id="arcadeTeam"><option value="blue">Biru</option><option value="red">Merah</option></select></label></fieldset><p id="arcadeError" role="alert" hidden></p><button type="submit" class="primary-button">Mulai bermain →</button></form>`;
    $("arcadeOpponent").value = s.opponent;
    $("arcadeTeam").value = s.team;
    for (const [id, key, fallback] of [
      ["arcadeTheme", "theme", "animals"],
      ["arcadeDifficulty", "difficulty", "normal"],
      ["arcadeGoal", "goal", 5],
      ["arcadeRounds", "rounds", 5],
      ["arcadeSize", "size", 3],
      ["arcadeDuration", "duration", 45],
    ])
      if ($(id)) $(id).value = s[key] || fallback;
    $("arcadeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.startFromForm();
    });
  }
  startFromForm() {
    const settings = {
      opponent: $("arcadeOpponent").value,
      theme: $("arcadeTheme")?.value || "animals",
      pairs: Number($("arcadePairs")?.value || 10),
      difficulty: $("arcadeDifficulty")?.value || "normal",
      goal: Number($("arcadeGoal")?.value || 5),
      rounds: Number($("arcadeRounds")?.value || 5),
      size: Number($("arcadeSize")?.value || 3),
      duration: Number($("arcadeDuration")?.value || 45),
      nameOne: $("arcadeNameOne").value,
      nameTwo: $("arcadeNameTwo").value,
      team: $("arcadeTeam").value,
    };
    try {
      this.players =
        settings.opponent === "local"
          ? localPlayers(settings.nameOne, settings.nameTwo, settings.team)
          : [
              { name: "Kamu", team: "blue" },
              { name: "Bot", team: "red" },
            ];
    } catch (error) {
      $("arcadeError").textContent = error.message;
      $("arcadeError").hidden = false;
      return;
    }
    this.settings = settings;
    this.saved[this.id] = { ...settings };
    this.firstPlayer = 0;
    this.start();
  }
  start() {
    this.pointers.clear();
    this.keys.clear();
    this.starBursts = [];
    this.puzzleHint = null;
    this.botDelay = 0;
    this.engine =
      this.id === "bom-bom"
        ? new BomBom({
            bot: this.settings.opponent === "bot",
            firstPlayer: this.firstPlayer,
          })
        : this.id === "catch-stars"
          ? new CatchStars({
              duration: this.settings.duration,
              local: this.settings.opponent === "local",
              firstPlayer: this.firstPlayer,
            })
          : this.id === "sliding-puzzle"
            ? new SlidingPuzzle({
                size: this.settings.size,
                steps:
                  this.settings.difficulty === "easy"
                    ? 12
                    : this.settings.size === 4
                      ? 60
                      : 30,
              })
            : this.id === "reaction-race"
              ? new ReactionRace({
                  rounds: this.settings.rounds,
                  bot: this.settings.opponent === "bot",
                  easy: this.settings.difficulty === "easy",
                })
              : this.id === "air-hockey"
                ? new AirHockey({
                    goal: this.settings.goal,
                    bot: this.settings.opponent === "bot",
                    easy: this.settings.difficulty === "easy",
                  })
                : this.id === "connect-four"
                  ? new ConnectFour(this.firstPlayer)
                  : new MemoryMatch({
                      theme: this.settings.theme,
                      pairs: this.settings.pairs,
                      local: this.settings.opponent === "local",
                      firstPlayer: this.firstPlayer,
                    });
    this.mode = "playing";
    this.onStart(this.id);
    this.renderShell();
    $("arcadeOverlay").hidden = true;
    this.renderBoard();
    this.root
      .querySelector("#arcadeCanvas, #arcadePlay button:not(:disabled)")
      ?.focus({ preventScroll: true });
    this.loop();
  }
  loop() {
    cancelAnimationFrame(this.frame);
    if (this.id === "sliding-puzzle") return;
    this.last = performance.now();
    const tick = (now) => {
      if (this.mode !== "playing") return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (this.id === "bom-bom") {
        if (this.engine.tick(dt)) {
          this.finish(`${this.name(this.engine.winner)} menang!`);
        } else if (
          this.engine.bot &&
          this.engine.turn === 1 &&
          this.engine.phase === "attack"
        ) {
          this.botDelay += dt;
          if (this.botDelay >= 0.8) {
            this.botDelay = 0;
            if (this.engine.open(this.engine.botChoice())) {
              this.onMove();
              this.renderBoard();
            }
          }
        }
      } else if (this.id === "catch-stars") {
        this.starKeys(dt);
        this.engine.tick(dt);
        for (const e of this.engine.drainEvents()) {
          if (e.x !== undefined) this.starBursts.push({ ...e, life: 1 });
          this.onMove();
        }
        this.starBursts = this.starBursts
          .map((b) => ({ ...b, life: b.life - dt }))
          .filter((b) => b.life > 0);
        this.renderStars();
        if (this.engine.winner !== null)
          this.finish(
            this.settings.opponent === "local"
              ? this.engine.winner === "draw"
                ? "Seri! Sama banyak bintangnya."
                : `${this.name(this.engine.winner)} menang!`
              : "Panen bintang selesai!",
          );
        else if (
          this.engine.phase === "handover" &&
          $("arcadeOverlay").hidden
        ) {
          $("arcadeOverlay").hidden = false;
          $("arcadeOverlay").innerHTML =
            `<div class="arcade-card"><span class="arcade-kicker">GILIRAN BERIKUTNYA</span><h2>${esc(this.name(1 - this.engine.firstPlayer))}, siap?</h2><p>${esc(this.name(this.engine.turn))} mendapat ${this.engine.score} poin. Sekarang giliranmu bermain ${this.engine.duration} detik!</p><button data-action="next-round" class="primary-button">Mulai giliranmu →</button></div>`;
        }
      } else if (this.id === "reaction-race") {
        this.engine.tick(dt);
        this.renderReaction();
        if (this.engine.winner !== null)
          this.finish(
            this.engine.winner === "draw"
              ? "Seri! Sama cepatnya."
              : `${this.name(this.engine.winner)} menang!`,
          );
      } else if (this.id === "air-hockey") {
        this.hockeyKeys(dt);
        this.engine.tick(dt);
        this.renderHockey();
        if (this.engine.winner !== null)
          this.finish(`${this.name(this.engine.winner)} menang!`);
      } else if (this.id === "connect-four") {
        if (this.settings.opponent === "bot" && this.engine.turn === 1) {
          this.botDelay += dt;
          if (this.botDelay >= 0.45) {
            this.botDelay = 0;
            this.connectMove(
              connectBot(this.engine, this.settings.difficulty === "easy"),
            );
          }
        }
      } else if (this.engine.tick(dt)) this.renderBoard();
      if (this.mode === "playing") this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  name(player) {
    return this.players[player].name;
  }
  camp(player, active, detail) {
    const p = this.players[player];
    const simultaneous = ["air-hockey", "reaction-race"].includes(this.id);
    const label = !active
      ? "MENUNGGU"
      : simultaneous
        ? this.settings.opponent === "bot" && player === 1
          ? "▶ BOT AKTIF"
          : "▶ SIAP MAIN"
        : this.settings.opponent === "bot" && player === 1
          ? "▶ GILIRAN BOT"
          : "▶ GILIRANMU";
    return `<div class="arcade-camp ${active ? "active-camp" : ""}" data-player="${player}" data-team="${p.team}" ${active ? 'aria-current="true"' : ""}><strong>${esc(p.name)}<small>Kubu ${TEAM_NAMES[p.team]}</small></strong><span>${esc(detail)}</span><b>${label}</b></div>`;
  }
  preserveBoardFocus() {
    const play = $("arcadePlay"),
      focused = document.activeElement;
    const restore = play.contains(focused);
    const key = ["card", "puzzle", "column", "bomb", "action"].find(
      (k) => focused?.dataset?.[k] !== undefined,
    );
    const value = key ? focused.dataset[key] : null;
    return () => {
      if (!restore) return;
      const target = key
        ? [...play.querySelectorAll(`[data-${key}]`)].find(
            (el) => el.dataset[key] === value && !el.disabled,
          )
        : null;
      play.tabIndex = -1;
      (
        target ||
        play.querySelector("button:not(:disabled), canvas") ||
        play
      ).focus({ preventScroll: true });
    };
  }
  renderBoard() {
    if (!this.engine || !$("arcadePlay")) return;
    this.root.querySelector('[data-action="pause"]').disabled =
      this.mode !== "playing";
    if (this.id === "bom-bom") return renderBomb(this);
    if (this.id === "connect-four") return this.renderConnect();
    if (this.id === "air-hockey") return this.renderHockey();
    if (this.id === "reaction-race") return this.renderReaction();
    if (this.id === "sliding-puzzle") return this.renderPuzzle();
    if (this.id === "catch-stars") return this.renderStars();
    const restoreFocus = this.preserveBoardFocus();
    const g = this.engine;
    const local = this.settings.opponent === "local";
    $("arcadeStatus").textContent = g.mismatchRemaining
      ? "Belum cocok… ingat gambarnya!"
      : `${this.name(g.turn)}: cari dua gambar yang sama`;
    const cards = g.cards.length,
      small = cards <= 24 ? 4 : 5,
      wide = cards <= 12 ? 4 : cards <= 24 ? 6 : 8;
    $("arcadePlay").innerHTML =
      `${local ? this.camp(1, this.mode === "playing" && g.turn === 1, `${g.scores[1]} pasangan`) : `<div class="arcade-summary"><span>${MEMORY_THEMES[this.settings.theme].name}</span><strong>${g.scores[0]} / ${g.pairs} pasangan</strong></div>`}<div class="memory-grid" style="--small-cols:${small};--wide-cols:${wide};--small-rows:${Math.ceil(cards / small)};--wide-rows:${Math.ceil(cards / wide)}">${g.cards
        .map((c, i) => {
          const shown = c.matched || g.open.includes(i);
          return `<button class="memory-card ${shown ? "face-up" : ""} ${c.matched ? "matched" : ""}" data-card="${i}" ${this.mode !== "playing" || c.matched || g.open.includes(i) || g.open.length === 2 ? "disabled" : ""} aria-label="Kartu ${i + 1}, ${shown ? c.picture + (c.matched ? ", pasangan ditemukan" : "") : "tertutup"}"><span>${shown ? c.picture : "✦"}</span>${c.matched ? "<small>✓</small>" : ""}</button>`;
        })
        .join(
          "",
        )}</div>${local ? this.camp(0, this.mode === "playing" && g.turn === 0, `${g.scores[0]} pasangan`) : `<div class="arcade-summary"><span>${g.attempts} percobaan</span><span>Ketuk dua kartu · tanpa batas waktu</span></div>`}`;
    restoreFocus();
  }
  renderConnect() {
    const restoreFocus = this.preserveBoardFocus();
    const g = this.engine,
      playing = this.mode === "playing",
      bot = this.settings.opponent === "bot" && g.turn === 1;
    $("arcadeStatus").textContent = bot
      ? "Bot sedang memilih kolom…"
      : `${this.name(g.turn)}: jatuhkan satu keping`;
    const team = (p) => this.players[p].team;
    $("arcadePlay").innerHTML =
      `${this.camp(1, playing && g.turn === 1, "4 berurutan")}<div class="connect-stage"><div class="connect-controls">${Array.from({ length: 7 }, (_, c) => `<button data-column="${c}" ${!playing || bot || g.cells[c] !== null ? "disabled" : ""} aria-label="Jatuhkan keping ke kolom ${c + 1}">↓</button>`).join("")}</div><div class="connect-grid" role="img" aria-label="Papan Connect Four">${g.cells.map((v, i) => `<span class="connect-hole ${v === null ? "" : `occupied team-${team(v)}`} ${g.line.includes(i) ? "winning-chip" : ""}" ${g.last === i ? 'data-last="true"' : ""}></span>`).join("")}</div></div>${this.camp(0, playing && g.turn === 0, "4 berurutan")}`;
    restoreFocus();
  }
  connectMove(column) {
    if (!this.engine.play(column)) return;
    this.onMove();
    this.renderBoard();
    if (this.engine.winner !== null)
      this.finish(
        this.engine.winner === "draw"
          ? "Seri! Papan penuh."
          : `${this.name(this.engine.winner)} menang!`,
      );
  }
  html(id, value) {
    const element = $(id);
    if (element.innerHTML !== value) element.innerHTML = value;
  }
  canvasStage(label) {
    if ($("arcadeCanvas")) return $("arcadeCanvas");
    $("arcadePlay").innerHTML =
      '<div id="arcadeTop"></div><div class="arcade-canvas-stage"><canvas id="arcadeCanvas" tabindex="0"></canvas></div><div class="arcade-control-hint" id="arcadeHint"></div><div id="arcadeBottom"></div>';
    const canvas = $("arcadeCanvas");
    canvas.setAttribute("aria-label", label);
    const point = (e) => {
      const r = canvas.getBoundingClientRect();
      if (this.id === "catch-stars")
        return {
          x: (e.clientX - r.left) / r.width,
          y: (e.clientY - r.top) / r.height,
        };
      const t = this.canvasTransform;
      const x = e.clientX - r.left,
        y = e.clientY - r.top;
      return t.rotated
        ? { x: (y - t.y) / t.scale, y: 900 - (x - t.x) / t.scale }
        : { x: (x - t.x) / t.scale, y: (y - t.y) / t.scale };
    };
    canvas.addEventListener("pointerdown", (e) => {
      if (this.mode !== "playing") return;
      const p = point(e);
      if (this.id === "catch-stars") {
        if (this.pointers.size || this.engine.phase !== "playing") return;
        this.pointers.set(e.pointerId, this.engine.turn);
        canvas.setPointerCapture(e.pointerId);
        canvas.focus({ preventScroll: true });
        this.engine.move(this.engine.turn, p.x);
        return;
      }
      const player = p.y >= 450 ? 0 : 1;
      if (player === 1 && this.settings.opponent !== "local") return;
      if ([...this.pointers.values()].includes(player)) return;
      this.pointers.set(e.pointerId, player);
      canvas.setPointerCapture(e.pointerId);
      canvas.focus({ preventScroll: true });
      this.engine.move(player, p.x, p.y);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (this.mode !== "playing" || !this.pointers.has(e.pointerId)) return;
      const p = point(e);
      this.engine.move(this.pointers.get(e.pointerId), p.x, p.y);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      canvas.addEventListener(type, (e) => this.pointers.delete(e.pointerId));
    return canvas;
  }
  canvasContext(canvas) {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    if (
      canvas.width !== Math.round(r.width * dpr) ||
      canvas.height !== Math.round(r.height * dpr)
    ) {
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#292f3c";
    ctx.fillRect(0, 0, r.width, r.height);
    const rotated = r.width > r.height * 1.2,
      scale = Math.min(
        r.width / (rotated ? 900 : 600),
        r.height / (rotated ? 600 : 900),
      ),
      x = (r.width - (rotated ? 900 : 600) * scale) / 2,
      y = (r.height - (rotated ? 600 : 900) * scale) / 2;
    this.canvasTransform = { rotated, scale, x, y };
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (rotated) {
      ctx.translate(900, 0);
      ctx.rotate(Math.PI / 2);
    }
    return ctx;
  }
  hockeyKeys(dt) {
    for (const player of [0, 1]) {
      if (player === 1 && this.settings.opponent !== "local") continue;
      const p = this.engine.paddles[player],
        keys = this.keys;
      let dx = 0,
        dy = 0;
      const letters = player === 1 || this.settings.opponent === "bot";
      if (player === 0) {
        dx +=
          (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0);
        dy += (keys.has("ArrowDown") ? 1 : 0) - (keys.has("ArrowUp") ? 1 : 0);
      }
      if (letters) {
        dx += (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
        dy += (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
      }
      if (dx || dy)
        this.engine.move(player, p.x + dx * 420 * dt, p.y + dy * 420 * dt);
    }
  }
  renderHockey() {
    const g = this.engine,
      canvas = this.canvasStage(
        "Air Hockey. Geser pemukul di bagianmu. Keyboard: panah untuk pemain utama, WASD untuk lawan lokal.",
      ),
      ctx = this.canvasContext(canvas);
    this.html(
      "arcadeTop",
      this.camp(1, this.mode === "playing", `${g.scores[1]} gol`),
    );
    this.html(
      "arcadeBottom",
      this.camp(0, this.mode === "playing", `${g.scores[0]} gol`),
    );
    $("arcadeHint").textContent =
      "Geser pemukul · panah / WASD di PC · dua sentuhan untuk duel lokal";
    $("arcadeStatus").textContent =
      `Cetak ${g.goal} gol untuk menang${g.serveRemaining ? " · bersiap!" : ""}`;
    ctx.fillStyle = "#2f3a45";
    ctx.fillRect(0, 0, 600, 900);
    ctx.strokeStyle = "#6e8590";
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 590, 890);
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(0, 450);
    ctx.lineTo(600, 450);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(300, 450, 75, 0, Math.PI * 2);
    ctx.stroke();
    const colors = this.players.map((p) =>
      p.team === "blue" ? "#8ebfdb" : "#dd95a7",
    );
    ctx.fillStyle = colors[1];
    ctx.fillRect(200, 0, 200, 12);
    ctx.fillStyle = colors[0];
    ctx.fillRect(200, 888, 200, 12);
    for (const [i, p] of g.paddles.entries()) {
      ctx.shadowColor = colors[i];
      ctx.shadowBlur = 0;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#323f49";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.fillStyle = "#e2dabb";
    ctx.shadowColor = "#e2dabb";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(g.puck.x, g.puck.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (g.serveRemaining) {
      ctx.fillStyle = "#d9dccc";
      ctx.font = "bold 38px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SIAP?", 300, 405);
    }
  }
  renderReaction() {
    const g = this.engine;
    if (!$("reactionStage"))
      $("arcadePlay").innerHTML =
        '<div id="arcadeTop"></div><div id="reactionStage" class="reaction-stage"><button class="reaction-pad" data-reaction="1"></button><div class="reaction-signal"><div class="reaction-lights"><i></i><i></i><i></i></div><strong id="reactionSignal"></strong><span id="reactionDetail"></span></div><button class="reaction-pad" data-reaction="0"></button></div><div id="arcadeBottom"></div>';
    this.html(
      "arcadeTop",
      this.camp(1, this.mode === "playing", `${g.scores[1]} poin`),
    );
    this.html(
      "arcadeBottom",
      this.camp(0, this.mode === "playing", `${g.scores[0]} poin`),
    );
    $("reactionStage").dataset.phase = g.phase;
    $("arcadeStatus").textContent =
      `Ronde ${g.round} / ${g.rounds} · tunggu hijau, baru ketuk!`;
    $("reactionSignal").textContent =
      g.phase === "go"
        ? "SEKARANG!"
        : g.phase === "wait"
          ? "TUNGGU…"
          : g.result?.winner === "draw"
            ? "SAMA CEPAT!"
            : `${this.name(g.result?.winner ?? 0)} +1`;
    $("reactionDetail").textContent =
      g.result?.reason === "early"
        ? "Terlalu cepat! Tunggu lampu hijau."
        : g.phase === "result"
          ? g.responses
              .map(
                (r, i) =>
                  `${this.name(i)}: ${typeof r === "number" ? r + " ms" : "—"}`,
              )
              .join(" · ")
          : "";
    for (const player of [0, 1]) {
      const button = this.root.querySelector(`[data-reaction="${player}"]`);
      button.disabled =
        this.mode !== "playing" ||
        g.phase === "result" ||
        g.phase === "ended" ||
        g.responses[player] !== null ||
        (player === 1 && this.settings.opponent === "bot");
      button.dataset.team = this.players[player].team;
      button.textContent =
        player === 1 && this.settings.opponent === "bot"
          ? "BOT SIAP"
          : g.responses[player] !== null
            ? "SUDAH!"
            : `${this.name(player)} · ${g.phase === "go" ? "KETUK!" : "TUNGGU"}`;
    }
  }
  reactionPress(player) {
    if (this.settings.opponent === "bot" && player === 1) return;
    if (!this.engine.press(player)) return;
    this.onMove();
    this.renderReaction();
  }
  renderPuzzle() {
    const restoreFocus = this.preserveBoardFocus();
    const g = this.engine,
      art = PUZZLE_ART[this.settings.theme],
      legal = g.neighbors();
    $("arcadeStatus").textContent =
      `${g.moves} langkah · susun ${art.name.toLowerCase()}`;
    $("arcadePlay").innerHTML =
      `<div class="puzzle-tools"><button data-action="reference" class="secondary-button">Lihat gambar utuh</button><button data-action="hint" class="secondary-button">✦ Petunjuk</button></div><div class="puzzle-stage"><div class="puzzle-grid" style="--puzzle-size:${g.size}">${g.tiles.map((n, i) => `<button data-puzzle="${i}" class="puzzle-tile ${n === 0 ? "empty-tile" : ""} ${this.puzzleHint === i ? "hint-tile" : ""}" ${this.mode !== "playing" || !legal.includes(i) ? "disabled" : ""} aria-label="${n === 0 ? "Kotak kosong" : `Bidak ${n}${legal.includes(i) ? ", bisa digeser" : ""}`}" style="${n ? `background-image:url('${art.url}');background-size:${g.size * 100}% ${g.size * 100}%;background-position:${(((n - 1) % g.size) / (g.size - 1)) * 100}% ${(Math.floor((n - 1) / g.size) / (g.size - 1)) * 100}%` : ""}">${n ? `<span>${n}</span>` : "↔"}</button>`).join("")}</div></div><div class="arcade-summary"><span>Ketuk bidak di sebelah kotak kosong</span><span>${g.size} × ${g.size}</span></div>`;
    restoreFocus();
  }
  puzzleMove(index) {
    if (!this.engine.move(index)) return;
    this.puzzleHint = null;
    this.onMove();
    this.renderPuzzle();
    if (this.engine.winner !== null) this.finish("Gambarnya lengkap! Hebat!");
  }
  resultDetail() {
    if (this.id === "bom-bom")
      return `${this.engine.scores[0]} – ${this.engine.scores[1]} poin · Kena bom ${this.engine.hits[0]}/5 – ${this.engine.hits[1]}/5`;
    if (this.id === "catch-stars")
      return this.settings.opponent === "local"
        ? `${this.engine.scores[0]} – ${this.engine.scores[1]} poin`
        : `${this.engine.score} poin · ${this.engine.caught} bintang`;
    if (this.id === "memory-match")
      return `${this.engine.attempts} percobaan · ${this.engine.pairs} pasangan`;
    if (this.id === "air-hockey")
      return `${this.engine.scores[0]} – ${this.engine.scores[1]} · target ${this.engine.goal} gol`;
    if (this.id === "reaction-race")
      return `${this.engine.scores[0]} – ${this.engine.scores[1]} · ${this.engine.rounds} ronde`;
    if (this.id === "sliding-puzzle")
      return `${this.engine.moves} langkah · ${this.engine.size} × ${this.engine.size}`;
    return "Empat berurutan, strategi yang hebat!";
  }
  starKeys(dt) {
    const dx =
      (this.keys.has("ArrowRight") || this.keys.has("KeyD") ? 1 : 0) -
      (this.keys.has("ArrowLeft") || this.keys.has("KeyA") ? 1 : 0);
    if (dx)
      this.engine.move(this.engine.turn, this.engine.basket + dx * dt * 0.85);
  }
  renderStars() {
    const g = this.engine,
      canvas = this.canvasStage(
        "Tangkap Bintang. Geser di arena untuk memindahkan keranjang, atau gunakan panah kiri/kanan.",
      ),
      r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    if (
      canvas.width !== Math.round(r.width * dpr) ||
      canvas.height !== Math.round(r.height * dpr)
    ) {
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.html(
      "arcadeTop",
      this.settings.opponent === "local"
        ? this.camp(
            1,
            this.mode === "playing" && g.turn === 1,
            `${g.scores[1]} poin`,
          )
        : `<div class="arcade-summary"><strong>⭐ ${g.caught} bintang</strong><span>Combo ×${Math.min(5, 1 + Math.floor(Math.max(0, g.combo - 1) / 3))}</span></div>`,
    );
    this.html(
      "arcadeBottom",
      this.settings.opponent === "local"
        ? this.camp(
            0,
            this.mode === "playing" && g.turn === 0,
            `${g.scores[0]} poin`,
          )
        : `<div class="arcade-summary"><strong>${g.score} poin</strong><span>${g.frenzy ? "FRENZY · POIN ×2!" : "Kejar bintang emas!"}</span></div>`,
    );
    $("arcadeStatus").textContent =
      `${this.name(g.turn)} · ${Math.ceil(g.remaining)} detik${g.frenzy ? " · FRENZY ×2" : ""}`;
    $("arcadeHint").textContent =
      "Geser / panah kiri-kanan · ⭐ poin · 🌟 bonus · 💣 hindari · ⏳ +waktu";
    const gradient = ctx.createLinearGradient(0, 0, 0, r.height);
    gradient.addColorStop(0, g.frenzy ? "#493d4f" : "#303242");
    gradient.addColorStop(1, "#354553");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, r.width, r.height);
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = i % 3 ? "#777d8e" : "#c3c7b5";
      ctx.beginPath();
      ctx.arc(
        (((i * 97) % 101) / 101) * r.width,
        (((i * 43) % 89) / 100) * r.height,
        1.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.font = `${Math.min(34, Math.max(20, r.width * 0.07))}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const object of g.objects)
      ctx.fillText(
        { star: "⭐", gold: "🌟", bomb: "💣", time: "⏳" }[object.type],
        object.x * r.width,
        object.y * r.height,
      );
    const x = g.basket * r.width,
      y = r.height * 0.9,
      w = r.width * 0.18,
      h = Math.max(14, Math.min(32, r.height * 0.08));
    ctx.fillStyle =
      this.players[g.turn].team === "blue" ? "#9cc7d2" : "#daa7ac";
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h / 2);
    ctx.lineTo(x + w / 2, y - h / 2);
    ctx.lineTo(x + w * 0.38, y + h / 2);
    ctx.lineTo(x - w * 0.38, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#dfd7b5";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y - h / 2, w / 2, h / 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 18px Arial";
    for (const b of this.starBursts || []) {
      ctx.globalAlpha = b.life;
      ctx.fillStyle = b.type === "bomb" ? "#dea7ad" : "#d4dbb1";
      ctx.fillText(b.text, b.x * r.width, r.height * 0.8 - (1 - b.life) * 55);
    }
    ctx.globalAlpha = 1;
  }
  action(event) {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.pairs) {
      $("arcadePairs").value = button.dataset.pairs;
      $("pairCount").textContent =
        `${button.dataset.pairs} pasangan · ${2 * Number(button.dataset.pairs)} kartu`;
      return;
    }
    const action = button.dataset.action;
    if (action === "mode") return this.onMode();
    if (action === "pause") return this.pause();
    if (action === "resume") return this.resume();
    if (action === "replay") {
      this.firstPlayer =
        this.settings.opponent === "local" ? 1 - this.firstPlayer : 0;
      return this.start();
    }
    if (this.mode !== "playing") return;
    if (this.id === "bom-bom") return bombAction(this, button);
    if (action === "next-round") {
      if (this.engine.nextRound()) {
        this.starBursts = [];
        $("arcadeOverlay").hidden = true;
        this.renderStars();
        this.loop();
      }
      return;
    }
    if (button.dataset.puzzle !== undefined)
      return this.puzzleMove(Number(button.dataset.puzzle));
    if (action === "hint") {
      this.puzzleHint = this.engine.hint();
      return this.renderPuzzle();
    }
    if (action === "reference") {
      this.pause();
      $("arcadeOverlay").innerHTML =
        `<div class="arcade-card"><h2>Gambar tujuan</h2><img class="puzzle-reference" src="${PUZZLE_ART[this.settings.theme].url}" alt="${PUZZLE_ART[this.settings.theme].name}"><button data-action="resume" class="primary-button">Kembali bermain</button></div>`;
      return;
    }
    if (button.dataset.reaction !== undefined)
      return this.reactionPress(Number(button.dataset.reaction));
    if (button.dataset.column !== undefined) {
      if (this.settings.opponent === "bot" && this.engine.turn === 1) return;
      return this.connectMove(Number(button.dataset.column));
    }
    if (button.dataset.card !== undefined) {
      const result = this.engine.flip(Number(button.dataset.card));
      if (!result) return;
      this.onMove();
      this.renderBoard();
      if (this.engine.winner !== null)
        this.finish(
          this.settings.opponent === "local"
            ? this.engine.winner === "draw"
              ? "Seri! Kalian sama hebatnya."
              : `${this.name(this.engine.winner)} menang!`
            : "Semua pasangan ditemukan!",
        );
    }
  }
  pause() {
    if (this.mode !== "playing") return;
    this.mode = "paused";
    this.pointers.clear();
    this.keys.clear();
    cancelAnimationFrame(this.frame);
    this.renderBoard();
    $("arcadeOverlay").hidden = false;
    $("arcadeOverlay").innerHTML =
      `<div class="arcade-card"><span class="arcade-kicker">TARIK NAPAS DULU</span><h2>Permainan dijeda</h2><p>Progresmu tersimpan selama jeda.</p><button data-action="resume" class="primary-button">Lanjut bermain</button><button data-action="mode" class="secondary-button">Akhiri & ganti mode</button></div>`;
  }
  resume() {
    if (this.mode !== "paused") return;
    this.mode = "playing";
    $("arcadeOverlay").hidden = true;
    this.renderBoard();
    this.root
      .querySelector("canvas, #arcadePlay button:not(:disabled)")
      ?.focus({ preventScroll: true });
    this.loop();
  }
  finish(message) {
    this.mode = "ended";
    cancelAnimationFrame(this.frame);
    this.renderBoard();
    $("arcadeOverlay").hidden = false;
    $("arcadeOverlay").innerHTML =
      `<div class="arcade-card arcade-result"><span class="arcade-kicker">✦ HEBAT SEKALI ✦</span><h2>${esc(message)}</h2><p>${this.resultDetail()}</p><button data-action="replay" class="primary-button">Main lagi →</button><button data-action="mode" class="secondary-button">Pilih mode</button></div>`;
    $("arcadeOverlay").querySelector("button").focus({ preventScroll: true });
  }
}
