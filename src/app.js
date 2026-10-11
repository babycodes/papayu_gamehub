import { FishingMotion, mixColor, bossSea } from "./fishing-motion.js";
import { FISHING_BOSSES } from "./fishing-bosses.js";
import { FishingGame, fishSize } from "./engine.js";
import { GAMES } from "./catalog.js";
import { initLibrary, recordPlay } from "./library.js";
import { BoardGames } from "./boards.js";
import { ArcadeGames, ARCADE_IDS } from "./arcade.js";
const $ = (id) => document.getElementById(id);
const canvas = $("sea"),
  ctx = canvas.getContext("2d");
const game = new FishingGame();
let width = 800,
  height = 470,
  frameTime = 0,
  lastTime = 0,
  lastUI = 0,
  sound = true,
  audio,
  announcementUntil = 0,
  spaceHeld = false;
const fishingPointers = new Map();
let inGame = false,
  resumeAfterExit = false,
  pendingExitAction = "exit",
  exitReturnFocus = null,
  activeGame = "fishing";
const boards = new BoardGames({
  onStart: recordPlay,
  onMove: () => tone([523], 0.06),
});
const arcade = new ArcadeGames({
  onStart: recordPlay,
  onMove: () => tone([659], 0.06),
  onMode: () => requestDecision("mode"),
});
const session = () =>
  activeGame === "fishing"
    ? game
    : ARCADE_IDS.has(activeGame)
      ? arcade
      : boards;
const gameScreen = $("gameScreen"),
  exitDialog = $("exitDialog");
let best = 0;
try {
  best = Number(localStorage.getItem("papayu-fishing-best")) || 0;
} catch {}
$("bestScore").innerHTML = `${best} <small>poin</small>`;
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = motionPreference.matches;
const fishingMotion = new FishingMotion(reducedMotion);
motionPreference.addEventListener("change", (event) => {
  reducedMotion = event.matches;
  fishingMotion.setReducedMotion(reducedMotion);
});
let bossStyle = "spooky";
const particles = [];
const STICKERS = [
  ["fish", "🐠", "Ikan pertama"],
  ["puffer", "🐡", "Buntal lucu"],
  ["shark", "🦈", "Sahabat hiu"],
  ["whale", "🐋", "Hiu paus"],
  ["star", "🌟", "Bintang ajaib"],
  ["crocodile", "🐊", "Buaya ceria"],
  ["mission-big", "🏅", "Pemburu raksasa"],
  ["mission-puffer", "🎈", "Misi buntal"],
  ["mission-boss", "👑", "Kapten boss"],
  ...FISHING_BOSSES.slice(1).map((b) => [`boss-${b.id}`, b.icon, b.name]),
];
let collection = new Set();
try {
  const saved = JSON.parse(
    localStorage.getItem("papayu-fishing-collection") || "[]",
  );
  if (Array.isArray(saved))
    collection = new Set(
      saved.filter((id) => STICKERS.some((s) => s[0] === id)),
    );
} catch {}
function renderStickers() {
  $("fishingStickers").innerHTML = STICKERS.map(
    ([id, icon, name]) =>
      `<div class="fishing-sticker ${collection.has(id) ? "unlocked" : ""}" aria-label="${name}: ${collection.has(id) ? "terbuka" : "belum ditemukan"}"><span aria-hidden="true">${icon}</span><strong>${name}</strong><small>${collection.has(id) ? "✓ Terkumpul" : "Belum ditemukan"}</small></div>`,
  ).join("");
}
function unlockSticker(id) {
  if (!STICKERS.some((s) => s[0] === id) || collection.has(id)) return;
  collection.add(id);
  try {
    localStorage.setItem(
      "papayu-fishing-collection",
      JSON.stringify([...collection]),
    );
  } catch {}
  renderStickers();
}
renderStickers();
function updateFishingFight() {
  const f = game.fight,
    panel = $("fishingFight");
  panel.hidden = !f || game.mode !== "playing";
  if (!f) return;
  panel.classList.toggle("good-pull", f.good);
  $("fightIcon").textContent = game.hook.catch.boss
    ? game.hook.catch.icon || "🐊"
    : game.hook.catch.kind === "puffer"
      ? "🐡"
      : game.hook.catch.kind === "shark"
        ? "🦈"
        : "🐋";
  $("fightTitle").textContent =
    f.type === "follow"
      ? "Ikuti panah!"
      : f.type === "hold"
        ? "Tahan untuk gulung!"
        : f.good
          ? "Hijau! Gulung sekarang!"
          : "Tunggu hijau…";
  $("fightStage").textContent = game.hook.catch.boss
    ? `${f.stage + 1} / 3`
    : game.hook.catch.name;
  $("fightHint").textContent =
    f.type === "follow"
      ? "Geser di laut ke lingkaran hijau sambil menahan."
      : f.type === "hold"
        ? "Tahan tombol GULUNG sampai bar penuh."
        : "Saat hijau, tahan GULUNG. Tidak perlu ketuk cepat.";
  $("fightLane").hidden = f.type === "hold";
  $("fightTarget").style.left =
    `${f.type === "follow" ? (f.target - (game.difficulty === "easy" ? 0.17 : 0.11)) * 100 : game.difficulty === "easy" ? 42 : 62}%`;
  $("fightTarget").style.width =
    `${f.type === "follow" ? (game.difficulty === "easy" ? 34 : 22) : game.difficulty === "easy" ? 58 : 38}%`;
  $("fightMarker").style.left =
    `${(f.type === "follow" ? game.hook.x : f.meter) * 100}%`;
  const progress = Math.round(f.progress * 100);
  $("fightProgress").setAttribute("aria-valuenow", String(progress));
  $("fightProgress").firstElementChild.style.width = `${progress}%`;
}
function drawBossFish(fish, s) {
  const kind = fish.kind;
  const pose = fishingMotion.pose(
    fish,
    game.hook.catch === fish ? game.fight : null,
  );
  const t = pose.time,
    wave = pose.limb * s;
  ctx.save();
  ctx.rotate(pose.sway);
  ctx.scale(pose.breathe, pose.breathe);
  if (["crocodile", "shark", "whale"].includes(kind)) drawBigFish(fish, s);
  else {
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = s * 0.12;
    ctx.lineCap = "round";
    if (kind === "octopus") {
      for (let i = 0; i < 8; i++) {
        const x = (i / 7 - 0.5) * 1.5 * s;
        ctx.beginPath();
        ctx.moveTo((i / 7 - 0.5) * s, s * 0.08);
        ctx.bezierCurveTo(
          x,
          s * 0.42,
          x + s * 0.17 + Math.sin(t * 2.6 + i * 0.7) * s * 0.13,
          s * (0.7 + pose.anger * 0.07),
          x + s * 0.22 + Math.sin(t * 2.6 + i * 0.7) * s * 0.19,
          s * 0.48 + Math.cos(t * 2 + i) * s * 0.07,
        );
        ctx.stroke();
      }
      ellipse(0, -s * 0.14, s * 0.65, s * 0.48, fish.color);
    } else if (kind === "crab") {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(side * s * 0.35, s * (i * 0.15 - 0.05));
          ctx.lineTo(
            side * s * 0.85,
            s * (i * 0.17 - 0.15) + Math.sin(t * 3 + i + side) * s * 0.06,
          );
          ctx.stroke();
        }
        ellipse(
          side * s * 0.92,
          -s * 0.25 + wave,
          s * 0.24,
          s * 0.23,
          fish.accent,
        );
        ellipse(
          side * s * 0.97,
          -s * 0.31 + wave,
          s * 0.12,
          s * 0.09,
          fish.color,
        );
      }
      ellipse(0, 0, s * 0.7, s * 0.4, fish.color);
    } else if (kind === "turtle") {
      for (const x of [-0.5, 0.5])
        for (const y of [-0.36, 0.36])
          ellipse(
            x * s,
            y * s + Math.sin(t * 2 + x + y) * s * 0.035,
            s * 0.3,
            s * 0.14,
            fish.accent,
          );
      ellipse(s * 0.9, 0, s * 0.25, s * 0.24, fish.color);
      ellipse(0, 0, s * 0.8, s * 0.48, fish.accent);
      ellipse(0, 0, s * 0.62, s * 0.37, fish.color);
      path(
        [
          [-s * 0.3, 0],
          [0, -s * 0.24],
          [s * 0.3, 0],
          [0, s * 0.24],
        ],
        fish.accent,
      );
    } else if (kind === "ray") {
      path(
        [
          [-s * 1.1, s * 0.05 + wave],
          [-s * 0.3, -s * 0.45],
          [0, -s * 0.2],
          [s * 0.3, -s * 0.45],
          [s * 1.1, s * 0.05 - wave],
          [s * 0.3, s * 0.28],
          [0, s * 0.45],
          [-s * 0.3, s * 0.28],
        ],
        fish.color,
      );
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s * 0.1);
      ctx.quadraticCurveTo(-s, s * 0.5, -s * 1.2, s * 0.4);
      ctx.stroke();
    } else if (kind === "serpent") {
      ctx.strokeStyle = fish.color;
      ctx.lineWidth = s * 0.36;
      ctx.beginPath();
      ctx.moveTo(-s, 0.2 * s);
      ctx.bezierCurveTo(
        -s * 0.5,
        -s * 0.6 + wave,
        0,
        s * 0.55 - wave,
        s * 0.7,
        -s * 0.05,
      );
      ctx.stroke();
      ellipse(s * 0.65, -s * 0.06, s * 0.3, s * 0.3, fish.color);
      for (let i = 0; i < 4; i++)
        path(
          [
            [(-0.7 + i * 0.3) * s, -s * 0.08],
            [(-0.65 + i * 0.3) * s, -s * 0.42],
            [(-0.5 + i * 0.3) * s, -s * 0.05],
          ],
          fish.accent,
        );
    } else {
      ellipse(0, 0, s * 0.85, s * 0.53, fish.color);
      ctx.strokeStyle = fish.accent;
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(s * 0.1, -s * 0.4);
      ctx.quadraticCurveTo(s * 0.15, -s * 0.95, s * 0.6, -s * 0.65);
      ctx.stroke();
      ctx.shadowColor = "#e9ff91";
      ctx.shadowBlur = reducedMotion ? 0 : 8;
      ellipse(
        s * 0.6,
        -s * 0.65,
        s * (0.13 + pose.limb * 0.1),
        s * 0.13,
        "#fff0a2",
      );
      ctx.shadowBlur = 0;
    }
  }
  if (fish.hybrid === "tentacles") {
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = s * 0.07;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo((i * 0.25 - 0.4) * s, s * 0.2);
      ctx.quadraticCurveTo(
        (i * 0.25 - 0.65) * s,
        s * 0.7 + wave,
        (i * 0.25 - 0.15) * s + Math.sin(t * 2 + i) * s * 0.12,
        s * 0.55,
      );
      ctx.stroke();
    }
  }
  if (fish.hybrid === "horns")
    for (const side of [-1, 1])
      path(
        [
          [side * s * 0.12, -s * 0.3],
          [side * s * 0.32, -s * 0.8],
          [side * s * 0.45, -s * 0.3],
        ],
        "#f3d17e",
      );
  if (fish.hybrid === "fins")
    for (const side of [-1, 1])
      path(
        [
          [side * s * 0.35, s * 0.05],
          [side * s * 1.15, -s * 0.5],
          [side * s * 0.7, s * 0.35],
        ],
        fish.accent,
      );
  if (fish.hybrid === "stars") {
    ctx.fillStyle = "#fff6ba";
    ctx.font = `${s * 0.25}px sans-serif`;
    for (let i = 0; i < 3; i++)
      ctx.fillText("✦", (i * 0.3 - 0.5) * s, s * 0.02);
  }
  drawBossFace(fish, s, pose);
  ctx.restore();
}
function drawBossFace(fish, s, pose) {
  const spooky = bossStyle === "spooky" && pose.friendly < 0.5;
  const kind = fish.kind;
  const center =
    kind === "turtle"
      ? 0.86
      : kind === "serpent"
        ? 0.68
        : kind === "crocodile"
          ? 0.46
          : ["whale", "shark"].includes(kind)
            ? 0.52
            : 0.15;
  const ey = kind === "crocodile" ? -0.24 : kind === "crab" ? -0.34 : -0.15;
  const gaze =
    Math.max(-1, Math.min(1, (game.hook.targetX - fish.x) * 4)) *
    fish.direction;
  const eyes = [
    [center - 0.14, ey],
    [center + 0.14, ey],
  ];
  if (spooky && (pose.anger > 0.5 || fish.index >= 9))
    eyes.push([center, ey - 0.23]);
  for (const [ex, y] of eyes) {
    if (spooky) {
      ctx.shadowColor = "#ffbb69";
      ctx.shadowBlur = reducedMotion ? 0 : 8;
    }
    ellipse(
      ex * s,
      y * s,
      s * 0.115,
      s * 0.12 * pose.blink,
      spooky ? "#ffe396" : "#fffaf1",
    );
    ctx.shadowBlur = 0;
    ellipse(
      (ex + gaze * 0.035) * s,
      y * s,
      s * (spooky ? 0.022 : 0.045),
      s * 0.065 * pose.blink,
      spooky ? "#70334b" : "#294d59",
    );
    if (spooky) {
      ctx.strokeStyle = fish.accent;
      ctx.lineWidth = s * 0.035;
      ctx.beginPath();
      ctx.moveTo((ex - 0.13) * s, (y - 0.13) * s);
      ctx.lineTo((ex + 0.1) * s, (y - 0.08 + pose.anger * 0.025) * s);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = Math.max(1.5, s * 0.025);
  ctx.beginPath();
  ctx.arc(
    center * s,
    s * 0.08,
    s * 0.14,
    spooky ? 0.25 : 0.05,
    spooky ? 2.85 : 2.1,
  );
  ctx.stroke();
  if (spooky)
    for (const side of [-1, 1])
      path(
        [
          [(center + side * 0.07) * s, s * 0.16],
          [(center + side * 0.045) * s, s * 0.25],
          [(center + side * 0.015) * s, s * 0.17],
        ],
        "#fff2ce",
      );
  if (spooky) {
    for (let i = 0; i < 3; i++)
      path(
        [
          [(-0.7 + i * 0.23) * s, -s * 0.2],
          [(-0.59 + i * 0.23) * s, -s * (0.48 + pose.anger * 0.12)],
          [(-0.48 + i * 0.23) * s, -s * 0.19],
        ],
        fish.accent,
      );
  } else {
    ellipse((center - 0.2) * s, s * 0.03, s * 0.055, s * 0.035, "#f0a2a4");
  }
}
function drawBigFish(fish, s) {
  const puffer = fish.kind === "puffer",
    croc = fish.kind === "crocodile",
    whale = fish.kind === "whale";
  path(
    [
      [-s * 0.72, 0],
      [-s * 1.18, -s * 0.4],
      [-s * 1.18, s * 0.4],
    ],
    fish.accent,
  );
  if (puffer) {
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      path(
        [
          [Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.66],
          [Math.cos(a + 0.11) * s * 0.72, Math.sin(a + 0.11) * s * 0.66],
          [Math.cos(a + 0.05) * s * 0.92, Math.sin(a + 0.05) * s * 0.84],
        ],
        fish.accent,
      );
    }
    ellipse(0, 0, s * 0.8, s * 0.72, fish.color);
    ellipse(0, s * 0.22, s * 0.62, s * 0.32, "#fff0c6");
    for (const [x, y] of [
      [-0.35, -0.28],
      [0, -0.42],
      [0.25, -0.33],
      [-0.48, 0.02],
      [0.08, -0.12],
    ])
      ellipse(x * s, y * s, s * 0.06, s * 0.06, fish.accent);
  } else if (croc) {
    for (let i = 0; i < 6; i++)
      path(
        [
          [(i * 0.21 - 0.7) * s, -s * 0.18],
          [(i * 0.21 - 0.6) * s, -s * 0.4],
          [(i * 0.21 - 0.5) * s, -s * 0.18],
        ],
        fish.accent,
      );
    ellipse(-s * 0.14, 0, s * 0.94, s * 0.3, fish.color);
    rounded(s * 0.38, -s * 0.12, s * 0.74, s * 0.31, s * 0.12, fish.color);
    ellipse(s * 0.38, -s * 0.21, s * 0.16, s * 0.17, fish.color);
    ellipse(-s * 0.3, s * 0.25, s * 0.23, s * 0.09, fish.accent);
    ellipse(s * 0.34, s * 0.23, s * 0.18, s * 0.08, fish.accent);
    ellipse(s * 0.98, -s * 0.02, s * 0.03, s * 0.03, fish.accent);
    for (let i = 0; i < 4; i++)
      path(
        [
          [(0.6 + i * 0.12) * s, s * 0.18],
          [(0.64 + i * 0.12) * s, s * 0.11],
          [(0.69 + i * 0.12) * s, s * 0.18],
        ],
        "#fff5da",
      );
  } else {
    path(
      [
        [-s * 0.28, -s * 0.25],
        [-s * 0.06, -s * 0.85],
        [s * 0.28, -s * 0.3],
      ],
      fish.accent,
    );
    ellipse(0, 0, s, s * (whale ? 0.5 : 0.41), fish.color);
    ellipse(s * 0.1, s * 0.2, s * 0.74, s * 0.2, "#f2f5ec");
    path(
      [
        [-s * 0.3, s * 0.16],
        [-s * 0.02, s * 0.62],
        [s * 0.22, s * 0.18],
      ],
      fish.accent,
    );
    if (whale)
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 6; i++)
          ellipse(
            (i * 0.22 - 0.65) * s,
            (row * 0.16 - 0.3) * s,
            s * 0.027,
            s * 0.025,
            "#faf5df",
          );
    else {
      ctx.strokeStyle = fish.accent;
      ctx.lineWidth = s * 0.035;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo((0.12 + i * 0.09) * s, -s * 0.15);
        ctx.lineTo((0.08 + i * 0.09) * s, s * 0.1);
        ctx.stroke();
      }
    }
  }
  if (!fish.boss) {
    const ex = croc ? 0.4 : puffer ? 0.46 : 0.64,
      ey = croc ? -0.25 : -0.1;
    ellipse(ex * s, ey * s, s * 0.12, s * 0.13, "#fffaf1");
    ellipse((ex + 0.035) * s, ey * s, s * 0.055, s * 0.07, "#284b58");
    ctx.strokeStyle = "#355654";
    ctx.lineWidth = Math.max(1.5, s * 0.025);
    ctx.beginPath();
    ctx.arc(
      (croc ? 0.81 : puffer ? 0.57 : 0.79) * s,
      s * 0.08,
      s * 0.14,
      0.12,
      1.7,
    );
    ctx.stroke();
  }
  if (game.frenzy && !fish.boss) {
    ctx.fillStyle = "#fff3b0";
    ctx.font = `${s * 0.35}px sans-serif`;
    ctx.fillText("✦", -s * 0.45, -s * 0.25);
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  width = rect.width;
  height = rect.height;
  game.viewport = { width, height };
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);
function tone(notes = [523, 659, 784], duration = 0.09) {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    notes.forEach((frequency, i) => {
      const oscillator = audio.createOscillator(),
        gain = audio.createGain(),
        start = audio.currentTime + i * duration;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration * 1.8);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration * 2);
    });
  } catch {}
}
function announce(message, seconds = 2.3) {
  $("announcement").textContent = message;
  $("announcement").classList.add("visible");
  announcementUntil = performance.now() + seconds * 1000;
}
function updateUI() {
  $("score").innerHTML =
    `${game.score.toLocaleString("id-ID")} <span>poin</span>`;
  const seconds = Math.ceil(game.remaining);
  $("timer").textContent = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  $("timer").classList.toggle("timer-warning", seconds <= 15);
  $("combo").innerHTML =
    `×${game.combo} <span>${game.combo > 1 ? "mantap!" : "ayo mulai!"}</span>`;
  $("catchCount").textContent = `${game.count} IKAN`;
  $("frenzyBanner").hidden =
    !game.frenzy || game.mode !== "playing" || !!game.fight;
  $("fishingMissions").innerHTML =
    game.missions
      .map(
        (m) =>
          `<span class="${m.value >= m.goal ? "mission-done" : ""}">${m.value >= m.goal ? "✓" : "☆"} ${m.label} <b>${m.value}/${m.goal}</b></span>`,
      )
      .join("") +
    `<span class="fishing-boss-track">${game.hook.catch?.special ? "🌟 Bintang besar · waktu istirahat" : ["warning", "active"].includes(game.bossState) ? `${game.currentBoss.icon} Boss ${game.bossIndex}/20 · ${game.currentBoss.name} · waktu istirahat` : game.bossIndex < FISHING_BOSSES.length ? `${FISHING_BOSSES[game.bossIndex].icon} Boss berikutnya: ${FISHING_BOSSES[game.bossIndex].name} · ${game.nextBossScore.toLocaleString("id-ID")} poin` : "👑 Semua 20 boss sudah berkunjung!"}</span>`;
  $("timer").title =
    ["warning", "active"].includes(game.bossState) || game.hook.catch?.special
      ? "Waktu berhenti sementara. Selesaikan tangkapanmu!"
      : "Sisa waktu ronde";
  updateFishingFight();
  $("frenzyTime").textContent = `· ${Math.ceil(game.frenzyRemaining)}d`;
  const names = ["Penjelajah pemula", "Sahabat laut", "Kapten Teluk Ceria"];
  const level = game.score >= 900 ? 2 : game.score >= 300 ? 1 : 0;
  $("levelName").textContent = names[level];
  $("levelHint").textContent =
    level === 2
      ? "Hebat! Kamu kapten hari ini."
      : `Raih ${level ? 900 : 300} poin untuk naik level`;
  $("hookTitle").textContent = game.hook.catch
    ? `Dapat ${game.hook.catch.name.toLowerCase()}!`
    : game.hook.state === "dropping"
      ? "Kail sedang turun…"
      : game.hook.state === "reeling"
        ? "Menggulung kail…"
        : "Kail siap beraksi";
  $("hookHint").textContent =
    game.hook.state === "idle"
      ? "Tahan, arahkan, lalu lepaskan."
      : game.hook.catch
        ? "Sebentar lagi sampai perahu!"
        : game.hook.state === "dropping"
          ? "Geser untuk mendekati ikan."
          : "Coba kedalaman lain, yuk!";
  const fighting = game.hook.state === "fighting";
  $("fishButtonIcon").textContent = fighting
    ? "↻"
    : game.hook.state === "reeling"
      ? "↑"
      : "↓";
  $("fishButtonLabel").textContent = fighting
    ? game.fight.good || game.fight.type === "hold"
      ? "Tahan · GULUNG!"
      : game.fight.type === "follow"
        ? "Geser ke tanda hijau"
        : "Tunggu hijau…"
    : game.hook.state === "reeling"
      ? "Ikan naik!"
      : "Tahan untuk turun";
  $("fishButton").classList.toggle("holding", game.held);
  $("fishButton").classList.toggle("fight-ready", fighting && game.fight.good);
  if (fighting) {
    $("hookTitle").textContent = game.hook.catch.name;
    $("hookHint").textContent =
      game.fight.type === "follow"
        ? "Geser di laut ke tanda hijau."
        : "Ikuti petunjuk di laut.";
  }
}
function showOverlay(title, text, button, footnote) {
  $("overlayTitle").textContent = title;
  $("overlayText").textContent = text;
  $("playButton").innerHTML = `${button} <span>→</span>`;
  $("overlayFootnote").textContent = footnote;
  $("fishingOptions").hidden = game.mode === "paused";
  $("fishingVisualOptions").hidden = game.mode === "paused";
  $("gameOverlay").hidden = false;
}
function start() {
  if (!inGame || activeGame !== "fishing" || !exitDialog.hidden) return;
  if (game.mode === "paused") game.resume();
  else {
    fishingPointers.clear();
    spaceHeld = false;
    fishingMotion.reset();
    bossStyle = $("fishingBossStyle").value;
    game.reset("playing", $("fishingDifficulty").value);
    recordPlay("fishing");
    particles.length = 0;
    $("lastCatch").innerHTML =
      '<span class="catch-illustration">♧</span><div><strong>Siapa yang pertama?</strong><p>Ikan pertamamu menunggu!</p></div>';
  }
  $("gameOverlay").hidden = true;
  $("fishButton").disabled = false;
  $("pauseButton").disabled = false;
  updateUI();
  tone([392, 523, 659]);
  canvas.focus({ preventScroll: true });
}
function pause() {
  if (!inGame) return;
  if (activeGame !== "fishing") {
    session().pause();
    return;
  }
  if (game.mode !== "playing") return;
  game.pause();
  fishingPointers.clear();
  spaceHeld = false;
  $("fishButton").disabled = true;
  $("pauseButton").disabled = true;
  showOverlay(
    "Istirahat sebentar, yuk.",
    "Waktu berhenti. Ikan-ikan menunggumu kembali.",
    "Lanjut memancing",
    "Tarik napas, lalu lanjutkan petualangan.",
  );
  updateUI();
}
$("playButton").addEventListener("click", start);
$("pauseButton").addEventListener("click", pause);
$("soundButton").addEventListener("click", () => {
  sound = !sound;
  $("soundButton").textContent = sound ? "♫" : "♪̸";
  $("soundButton").setAttribute(
    "aria-label",
    sound ? "Matikan suara" : "Aktifkan suara",
  );
  $("soundButton").setAttribute("aria-pressed", String(!sound));
  if (sound) tone([523]);
});
initLibrary((id) => openGame(id));
function updateFullscreenButton() {
  $("fullscreenButton").setAttribute(
    "aria-label",
    document.fullscreenElement
      ? "Keluar dari layar penuh"
      : "Aktifkan layar penuh",
  );
}
async function enterFullscreen() {
  // iOS and some embedded browsers do not support this API; viewport layout still fills the screen.
  try {
    if (!document.fullscreenElement && gameScreen.requestFullscreen)
      await gameScreen.requestFullscreen();
  } catch {}
  updateFullscreenButton();
}
function openGame(id, pushHistory = true, fullscreen = true) {
  const item = GAMES.find((g) => g.id === id);
  if (!item) return;
  activeGame = id;
  gameScreen.dataset.game = id;
  inGame = true;
  $("hubScreen").hidden = true;
  $("hubHeader").hidden = true;
  gameScreen.hidden = false;
  $("fishingView").hidden = id !== "fishing";
  $("boardView").hidden = id === "fishing" || ARCADE_IDS.has(id);
  $("arcadeView").hidden = !ARCADE_IDS.has(id);
  $("soundButton").hidden = id !== "fishing";
  $("gameTitle").textContent =
    `${item.icon} ${id === "fishing" ? "Teluk Ceria" : item.title}`;
  gameScreen.setAttribute("aria-label", item.title);
  document.body.classList.add("in-game");
  document.title = `${item.title} • Papayu`;
  if (id === "fishing") {
    showOverlay(
      "Lautnya sudah siap. Kamu juga?",
      "Tahan untuk turun. Geser kail, lalu ikuti petunjuk untuk ikan besar!",
      "Mulai memancing",
      "90 detik, lima kedalaman, banyak kejutan.",
    );
    $("fishButton").disabled = true;
    $("pauseButton").disabled = true;
    resize();
    updateUI();
    $("playButton").focus({ preventScroll: true });
  } else if (ARCADE_IDS.has(id)) {
    arcade.open(id);
    $("arcadeForm")
      .querySelector("button[type=submit]")
      .focus({ preventScroll: true });
  } else {
    boards.open(id);
    $("boardStart").focus({ preventScroll: true });
  }
  if (pushHistory) history.pushState({ view: id }, "", "#" + id);
  if (fullscreen) enterFullscreen();
}
function leaveGame() {
  if (!exitDialog.hidden) closeExitDialog();
  inGame = false;
  fishingPointers.clear();
  spaceHeld = false;
  game.reset("ready");
  fishingMotion.reset();
  boards.close();
  arcade.close();
  particles.length = 0;
  gameScreen.hidden = true;
  $("hubScreen").hidden = false;
  $("hubHeader").hidden = false;
  document.body.classList.remove("in-game");
  document.title = "Papayu Gamehub";
  $("announcement").classList.remove("visible");
  announcementUntil = 0;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  (
    document.querySelector(`[data-game="${activeGame}"] .launch-game`) ||
    $("gameSearch")
  ).focus({ preventScroll: true });
  // Keep last completed/abandoned catch details in the hub until the next round starts.
}
function requestExit() {
  requestDecision("exit");
}
function requestDecision(action) {
  if (!inGame || !exitDialog.hidden) return;
  pendingExitAction = action;
  exitReturnFocus = document.activeElement;
  const changeMode = action === "mode";
  $("exitTitle").textContent = changeMode
    ? "Akhiri & pilih mode?"
    : "Kembali ke Gamehub?";
  $("exitDescription").textContent = changeMode
    ? "Pertandingan belum selesai. Mengganti mode akan mengakhiri pertandingan ini dan menghapus progresnya. Permainan dijeda selama kamu memilih."
    : "Permainan belum selesai. Jika keluar sekarang, progres pertandingan ini akan hilang. Permainan dijeda selama kamu memilih.";
  $("confirmExit").textContent = changeMode
    ? "Akhiri & pilih mode"
    : "Keluar ke Gamehub";
  if (session().mode === "playing" || session().mode === "paused") {
    resumeAfterExit = session().mode === "playing";
    pause();
    showExitDialog();
  } else confirmExit();
}
function cancelExit() {
  closeExitDialog();
  if (resumeAfterExit) {
    if (activeGame === "fishing") start();
    else session().resume();
  } else
    $(
      activeGame === "fishing"
        ? "playButton"
        : ARCADE_IDS.has(activeGame)
          ? "arcadeOverlay"
          : "boardStart",
    ).focus({
      preventScroll: true,
    });
  resumeAfterExit = false;
  if (exitReturnFocus?.isConnected && !exitReturnFocus.disabled)
    exitReturnFocus.focus({ preventScroll: true });
}
function confirmExit() {
  if (pendingExitAction === "mode") {
    closeExitDialog();
    resumeAfterExit = false;
    pendingExitAction = "exit";
    session().chooseMode();
    return;
  }
  leaveGame();
  if (GAMES.some((g) => g.id === history.state?.view)) history.back();
}
$("exitButton").addEventListener("click", requestExit);
$("boardChangeMode").addEventListener("click", () => requestDecision("mode"));
$("cancelExit").addEventListener("click", cancelExit);
$("confirmExit").addEventListener("click", confirmExit);
$("pausedChangeMode").addEventListener("click", () => requestDecision("mode"));
function showExitDialog() {
  // Keep the modal in the fullscreen subtree, with its own hit surface and focus trap.
  for (const child of gameScreen.children) {
    if (child !== exitDialog) child.inert = true;
  }
  exitDialog.hidden = false;
  $("cancelExit").focus({ preventScroll: true });
}
function closeExitDialog() {
  exitDialog.hidden = true;
  for (const child of gameScreen.children) child.inert = false;
}
exitDialog.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    cancelExit();
  } else if (event.code === "Tab") {
    event.preventDefault();
    const target =
      document.activeElement === $("cancelExit")
        ? $("confirmExit")
        : $("cancelExit");
    target.focus();
  }
});
$("fullscreenButton").addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else enterFullscreen();
});
document.addEventListener("fullscreenchange", () => {
  updateFullscreenButton();
  if (inGame && !document.fullscreenElement) pause();
});
window.addEventListener("popstate", () => {
  if (GAMES.some((g) => g.id === history.state?.view)) {
    if (!inGame) openGame(history.state.view, false, false);
    return;
  }
  if (!inGame) return;
  if (session().mode === "playing" || session().mode === "paused") {
    history.pushState({ view: activeGame }, "", "#" + activeGame);
    requestExit();
  } else leaveGame();
});
window.addEventListener("beforeunload", (event) => {
  if (inGame && ["playing", "paused"].includes(session().mode)) {
    event.preventDefault();
    event.returnValue = "";
  }
});
history.replaceState({ view: "hub" }, "", location.pathname + location.search);
function aim(event) {
  game.aim((event.clientX - canvas.getBoundingClientRect().left) / width);
}
function pointerDown(event) {
  if (
    activeGame !== "fishing" ||
    game.mode !== "playing" ||
    !exitDialog.hidden ||
    event.button !== 0
  )
    return;
  event.preventDefault();
  fishingPointers.set(event.pointerId, event.currentTarget);
  if (event.currentTarget === canvas) aim(event);
  event.currentTarget.setPointerCapture(event.pointerId);
  game.press();
}
for (const target of [canvas, $("fishButton")]) {
  target.addEventListener("pointerdown", pointerDown);
  target.addEventListener("pointermove", (event) => {
    if (
      game.mode === "playing" &&
      exitDialog.hidden &&
      fishingPointers.get(event.pointerId) === canvas
    )
      aim(event);
  });
  const releasePointer = (event) => {
    fishingPointers.delete(event.pointerId);
    if (!fishingPointers.size && !spaceHeld) game.release();
  };
  target.addEventListener("pointerup", releasePointer);
  target.addEventListener("pointercancel", releasePointer);
  target.addEventListener("lostpointercapture", releasePointer);
  target.addEventListener("contextmenu", (event) => event.preventDefault());
}
// Keyboard activation from assistive controls behaves like a short hold.
$("fishButton").addEventListener("keydown", (event) => {
  if (event.code === "Enter" && !event.repeat && game.mode === "playing") {
    event.preventDefault();
    spaceHeld = true;
    game.press();
  }
});
$("fishButton").addEventListener("keyup", (event) => {
  if (event.code === "Enter") {
    event.preventDefault();
    spaceHeld = false;
    if (!fishingPointers.size) game.release();
  }
});
window.addEventListener("keydown", (event) => {
  if (!inGame || !exitDialog.hidden) return;
  if (event.code === "Escape" && !$("promotionDialog").open) {
    event.preventDefault();
    pause();
    return;
  }
  if (activeGame !== "fishing" || game.mode !== "playing") return;
  if (["Space", "ArrowLeft", "ArrowRight", "Escape"].includes(event.code))
    event.preventDefault();
  if (event.code === "Space" && !event.repeat) {
    spaceHeld = true;
    game.press();
  }
  if (event.code === "ArrowLeft") game.aim(game.hook.targetX - 0.035);
  if (event.code === "ArrowRight") game.aim(game.hook.targetX + 0.035);
  if (event.code === "Escape") pause();
});
window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    if (game.mode === "playing") event.preventDefault();
    spaceHeld = false;
    if (!fishingPointers.size) game.release();
  }
});
window.addEventListener("blur", pause);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
function onEvent(event) {
  fishingMotion.handle(event);
  if (event.type === "catch") {
    announce(
      `+${event.points} poin · ${event.fish.name}${event.combo > 1 ? ` · Combo ×${event.combo}!` : ""}`,
    );
    $("lastCatch").innerHTML =
      `<span class="catch-illustration" style="color:${event.fish.accent}">➤</span><div><strong>${event.fish.name}</strong><p>+${event.points} poin · tangkapan ke-${game.count}</p></div>`;
    unlockSticker(
      event.fish.boss
        ? event.fish.bossId === "crocodile"
          ? "crocodile"
          : `boss-${event.fish.bossId}`
        : event.fish.kind,
    );
    tone(event.fish.layer === 4 ? [523, 659, 784, 1047] : [523, 659, 784]);
    for (let i = 0; i < 12; i++)
      particles.push({
        x: game.hook.x,
        y: 0.29,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -Math.random() * 0.2,
        life: 1,
        color: event.fish.color,
      });
  }
  if (event.type === "bonus") {
    announce("Hore! +12 detik petualangan");
    tone([659, 784, 1047]);
  }
  if (event.type === "hooked") {
    tone([330, 440], 0.06);
    if (navigator.vibrate) navigator.vibrate(30);
  }
  if (event.type === "miss") announce("Belum dapat? Coba lagi, yuk!", 1.5);
  if (event.type === "bonus-spawn")
    announce("Bonus waktu muncul di lapisan 3!", 2.5);
  if (event.type === "frenzy") {
    announce("Laut Raksasa! Semua ikan membesar · poin ×2", 3);
    tone([392, 523, 659, 784]);
  }
  if (event.type === "boss-warning")
    announce(`Ikan menepi… ${event.boss.name} datang! ${event.boss.icon}`, 2);
  if (event.type === "boss-arrived") {
    announce(`${event.boss.name} datang! Arahkan kail ${event.boss.icon}`, 4);
    tone([262, 330, 392]);
  }
  if (event.type === "boss-left")
    announce(`${event.boss.name} pamit. Sampai jumpa boss berikutnya!`, 3);
  if (event.type === "sea-return")
    announce(
      event.caught
        ? `${event.boss.name} tertangkap! +8 detik 🎉`
        : "Ikan-ikan kembali. Ayo memancing lagi!",
      3,
    );
  if (event.type === "escaped")
    announce(
      event.fish.special
        ? "🌟 Bintang masih di laut! Coba lagi, yuk."
        : "Ikan lepas, tidak apa-apa. Coba lagi!",
      2.5,
    );
  if (event.type === "fight-won") {
    announce("Hebat! Gulungan selesai, ikan naik!", 2);
    tone([659, 784]);
  }
  if (event.type === "mission") {
    unlockSticker(
      `mission-${game.missions.find((m) => m.label === event.mission).kind}`,
    );
    announce(`Misi selesai: ${event.mission}! Stiker baru ⭐`, 3);
  }
  if (event.type === "end") {
    const record = game.score > best;
    if (record) {
      best = game.score;
      try {
        localStorage.setItem("papayu-fishing-best", String(best));
      } catch {}
    }
    $("bestScore").innerHTML =
      `${best.toLocaleString("id-ID")} <small>poin</small>`;
    $("fishButton").disabled = true;
    $("pauseButton").disabled = true;
    showOverlay(
      record ? "Rekor baru! Hebat sekali." : "Petualangan yang seru!",
      `${game.score.toLocaleString("id-ID")} poin · ${game.count} tangkapan · ${game.missions.filter((m) => m.value >= m.goal).length}/3 misi · ${game.bossCount} boss`,
      "Main lagi",
      "Setiap petualangan adalah kesempatan baru.",
    );
    tone([784, 659, 523], 0.15);
  }
}
function ellipse(x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
function path(points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function rounded(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function drawFish(fish, x, y, caught = false) {
  let s = fishSize(fish, width, height, game.frenzy);
  if (fish.kind === "puffer")
    s *=
      fish === game.hook.catch && game.fight
        ? game.fight.good
          ? 1
          : 1.18
        : 1 + (Math.sin(game.elapsed * 2.2 + fish.phase) + 1) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  if (fish.boss) {
    const present = fishingMotion.pose(fish, null).presence;
    ctx.globalAlpha *= present;
    const entryScale = reducedMotion ? 1 : 0.9 + present * 0.1;
    ctx.scale(entryScale, entryScale);
  }
  ctx.scale(fish.direction, 1);
  if (caught) ctx.rotate(-0.35);
  if (fish.bonus) {
    ctx.shadowColor = "#ffe793";
    ctx.shadowBlur = 15;
    ellipse(0, 0, s * 0.65, s * 0.65, "#ffe9ae");
    ctx.shadowBlur = 0;
    ellipse(0, 0, s * 0.48, s * 0.48, "#fff6d7");
    ctx.strokeStyle = "#b69143";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.28);
    ctx.lineTo(0, 0);
    ctx.lineTo(s * 0.23, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (fish.boss) {
    drawBossFish(fish, s);
    ctx.restore();
    return;
  }
  if (["puffer", "shark", "whale", "crocodile"].includes(fish.kind)) {
    drawBigFish(fish, s);
    ctx.restore();
    return;
  }
  if (fish.layer === 4 || fish.special) {
    ctx.shadowColor = fish.color;
    ctx.shadowBlur = game.frenzy ? 18 : 7;
  }
  if (fish.special) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        radius = i % 2 ? s * 0.45 : s;
      points.push([Math.cos(a) * radius, Math.sin(a) * radius]);
    }
    path(points, fish.color);
    ctx.shadowBlur = 0;
    ellipse(-s * 0.17, -s * 0.05, 2, 2.5, "#685459");
    ellipse(s * 0.17, -s * 0.05, 2, 2.5, "#685459");
  } else {
    path(
      [
        [-s * 0.75, 0],
        [-s * 1.25, -s * 0.45],
        [-s * 1.25, s * 0.45],
      ],
      fish.accent,
    );
    path(
      [
        [-s * 0.3, -s * 0.2],
        [-s * 0.2, -s * 0.85],
        [s * 0.25, -s * 0.35],
      ],
      fish.accent,
    );
    ellipse(0, 0, s, s * 0.53, fish.color);
    ctx.shadowBlur = 0;
    ellipse(s * 0.1, s * 0.16, s * 0.65, s * 0.25, "#ffffff22");
    path(
      [
        [-s * 0.18, s * 0.05],
        [-s * 0.45, s * 0.35],
        [s * 0.04, s * 0.26],
      ],
      fish.accent,
    );
    ellipse(s * 0.56, -s * 0.09, s * 0.14, s * 0.16, "#fffaf1");
    ellipse(s * 0.6, -s * 0.08, s * 0.065, s * 0.09, "#355654");
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(s * 0.76, s * 0.15, s * 0.14, 0.1, 1.3);
    ctx.stroke();
    if (fish.layer === 2) {
      for (let i = -1; i <= 1; i++) {
        ctx.strokeStyle = fish.accent + "70";
        ctx.lineWidth = s * 0.08;
        ctx.beginPath();
        ctx.moveTo(i * s * 0.25 - 0.3 * s, -s * 0.31);
        ctx.lineTo(i * s * 0.25 - 0.4 * s, s * 0.23);
        ctx.stroke();
      }
    }
    if (fish.layer === 4) {
      ctx.fillStyle = "#fff9d1";
      ctx.font = `${s * 0.45}px sans-serif`;
      ctx.fillText("✦", -s * 0.35, s * 0.05);
    }
  }
  ctx.restore();
}
function drawBoat(t) {
  const bx = width * 0.47,
    by =
      height * 0.278 +
      Math.sin(t * 1.4) * (reducedMotion ? 0 : 2) +
      (game.fight && !reducedMotion ? Math.sin(t * 5) * 2 : 0);
  const bend = game.fight ? 14 : 0;
  const scale = Math.max(0.4, Math.min(1, width / 650, height / 450));
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(scale, scale);
  ellipse(-11, 17, 67, 5, "#326f7435");
  // Rod and line origin.
  ctx.strokeStyle = "#756b49";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, -47);
  ctx.quadraticCurveTo(36, -112 + bend, 79, -53 + bend);
  ctx.stroke();
  // Fisher's legs and shirt.
  ctx.strokeStyle = "#3e6262";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-22, -30);
  ctx.lineTo(-11, -7);
  ctx.lineTo(6, -7);
  ctx.stroke();
  rounded(-42, -66, 28, 38, 8, "#f2d7a5");
  ctx.strokeStyle = "#d9b688";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-20, -53);
  ctx.lineTo(-5, -43);
  ctx.lineTo(8, -57);
  ctx.stroke();
  ellipse(-27, -80, 13, 14, "#eabf99");
  path(
    [
      [-42, -82],
      [-34, -101],
      [-15, -101],
      [-7, -82],
    ],
    "#d8b975",
  );
  rounded(-49, -85, 46, 7, 3, "#ecd293");
  ellipse(-20, -78, 1.4, 1.8, "#516460");
  // Curved wooden hull.
  ctx.fillStyle = "#af7652";
  ctx.beginPath();
  ctx.moveTo(-78, -7);
  ctx.quadraticCurveTo(-54, 29, 29, 13);
  ctx.quadraticCurveTo(53, 8, 63, -14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d39c6b";
  ctx.beginPath();
  ctx.moveTo(-78, -7);
  ctx.quadraticCurveTo(-20, 3, 63, -14);
  ctx.lineTo(57, -6);
  ctx.quadraticCurveTo(-20, 12, -72, 0);
  ctx.fill();
  ctx.strokeStyle = "#925f493d";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-56, 6);
  ctx.quadraticCurveTo(0, 20, 43, 1);
  ctx.stroke();
  rounded(-61, -16, 24, 10, 3, "#c8b789");
  ctx.restore();
  return { x: bx + 79 * scale, y: by + (-53 + bend) * scale };
}
function draw(t, dt) {
  ctx.clearRect(0, 0, width, height);
  const waterline = height * 0.31;
  const sky = ctx.createLinearGradient(0, 0, 0, waterline);
  sky.addColorStop(
    0,
    mixColor(
      "#d5e9df",
      "#b6bbcf",
      fishingMotion.state.sea * (bossStyle === "cute" ? 0.2 : 0.6),
    ),
  );
  sky.addColorStop(1, "#e7edce");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, waterline);
  // Sun, soft clouds and distant islands.
  ellipse(width * 0.77, height * 0.14, 26, 26, "#f4e6b0");
  ellipse(width * 0.77, height * 0.14, 36, 36, "#f8eed536");
  for (const [x, y, s] of [
    [0.12, 0.13, 1],
    [0.63, 0.1, 0.7],
    [0.91, 0.23, 0.8],
  ]) {
    ellipse(width * x, height * y, 31 * s, 7 * s, "#f7f7e777");
    ellipse(width * x + 13, height * y - 6, 17 * s, 10 * s, "#f7f7e777");
  }
  path(
    [
      [0, waterline],
      [0, waterline - 9],
      [width * 0.07, waterline - 33],
      [width * 0.16, waterline - 13],
      [width * 0.23, waterline - 20],
      [width * 0.32, waterline],
    ],
    "#a9c5b273",
  );
  path(
    [
      [width * 0.72, waterline],
      [width * 0.86, waterline - 18],
      [width * 0.94, waterline - 29],
      [width, waterline - 20],
      [width, waterline],
    ],
    "#a9c5b273",
  );
  ctx.strokeStyle = "#809d8c";
  ctx.lineWidth = 1;
  for (const [x, y] of [
    [0.22, 0.1],
    [0.27, 0.16],
    [0.67, 0.19],
  ]) {
    ctx.beginPath();
    ctx.moveTo(width * x - 5, height * y + 2);
    ctx.quadraticCurveTo(width * x - 2, height * y - 3, width * x, height * y);
    ctx.quadraticCurveTo(
      width * x + 3,
      height * y - 3,
      width * x + 6,
      height * y + 1,
    );
    ctx.stroke();
  }
  const ocean = ctx.createLinearGradient(0, waterline, 0, height);
  const seaColors = bossSea(fishingMotion.boss, bossStyle === "cute");
  const blend = fishingMotion.state.sea;
  ocean.addColorStop(
    0,
    mixColor(game.frenzy ? "#97d4b7" : "#80c7ca", seaColors[0], blend),
  );
  ocean.addColorStop(0.48, mixColor("#4797aa", seaColors[1], blend));
  ocean.addColorStop(1, mixColor("#2b526e", seaColors[2], blend));
  ctx.fillStyle = ocean;
  ctx.fillRect(0, waterline, width, height);
  // Shafts of sunlight.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, waterline, width, height - waterline);
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const x = width * (0.04 + i * 0.24);
    path(
      [
        [x, waterline],
        [x + 26, waterline],
        [x + width * 0.2, height],
        [x + width * 0.09, height],
      ],
      "#d1f5e509",
    );
  }
  for (let layer = 1; layer < 5; layer++) {
    const y = height * (0.31 + layer * 0.128);
    ctx.strokeStyle = "#c8eee212";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (let i = 0; i < 22; i++) {
    const x = (i * 47.3 + 14) % width,
      y =
        waterline +
        ((((i * 83 + (reducedMotion ? 0 : -t * (6 + (i % 5)))) %
          (height - waterline)) +
          height -
          waterline) %
          (height - waterline));
    ctx.strokeStyle = "#b2dedb35";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.stroke();
  }
  // Seagrass and coral on the seabed.
  for (let i = 0; i < 14; i++) {
    const x = i < 7 ? i * 13 : width - (i - 7) * 13;
    ctx.strokeStyle = i % 2 ? "#4d888575" : "#62999060";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, height + 5);
    ctx.bezierCurveTo(
      x - 11,
      height - 25,
      x + 14 + Math.sin(t + i) * 3,
      height - 34,
      x + 3,
      height - 48 - (i % 4) * 9,
    );
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++)
    ellipse(
      width * (0.09 + i * 0.17),
      height + 4,
      25 + (i % 3) * 8,
      12 + (i % 2) * 3,
      "#285369",
    );
  if (game.bossState === "warning") {
    const cx = width * 0.5,
      cy = height * 0.64;
    ellipse(cx, cy, width * 0.24, height * 0.055, "#0b243b80");
    ctx.shadowColor = bossStyle === "cute" ? "#e7f6a2" : "#ffcf80";
    ctx.shadowBlur = reducedMotion ? 0 : 12;
    for (const side of [-1, 1])
      ellipse(
        cx + side * width * 0.055,
        cy - height * 0.015,
        width * 0.018,
        height * 0.012,
        "#ffe8a6",
      );
    ctx.shadowBlur = 0;
  }
  if (blend > 0.02) {
    ctx.globalAlpha = blend * 0.45;
    ctx.strokeStyle = bossStyle === "cute" ? "#cef6df" : "#e0a8ed";
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const bx = width * (0.12 + i * 0.12),
        by = height * (0.4 + ((i * 0.14 + t * 0.025) % 0.5));
      ctx.beginPath();
      ctx.arc(bx, by, 3 + (i % 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  for (const fish of game.fish) {
    const y =
      fish.y * height + Math.sin(t * 2 + fish.phase) * (reducedMotion ? 0 : 3);
    drawFish(fish, fish.x * width, y);
  }
  if (fishingMotion.state.celebration > 0 && fishingMotion.boss) {
    const life = fishingMotion.state.celebration;
    ctx.save();
    ctx.translate(width * 0.5, height * (0.42 - (1 - life) * 0.09));
    ctx.globalAlpha = life;
    ctx.scale(0.45, 0.45);
    drawBossFish(
      fishingMotion.boss,
      fishSize(fishingMotion.boss, width, height),
    );
    ctx.restore();
  }
  ctx.restore();
  // Surface ripples.
  ctx.strokeStyle = "#e2f1d877";
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const x = (i * width) / 9;
    ctx.beginPath();
    ctx.moveTo(x, waterline + Math.sin(t + i) * 2);
    ctx.quadraticCurveTo(
      x + 16,
      waterline + 5,
      x + 32,
      waterline + Math.cos(t + i) * 2,
    );
    ctx.stroke();
  }
  const rod = drawBoat(t);
  const hookX = game.hook.x * width,
    hookY = game.hook.y * height;
  if (game.fight?.type === "follow") {
    const target = game.fight.target * width;
    ctx.strokeStyle = "#d1ff8b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(target, hookY, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#204754";
    ctx.font = "bold 25px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(hookX < target ? "→" : "←", (target + hookX) / 2, hookY - 28);
    ctx.textAlign = "start";
  }
  ctx.strokeStyle = "#f9f8dbb0";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(rod.x, rod.y);
  ctx.quadraticCurveTo((rod.x + hookX) / 2, rod.y + 40, hookX, hookY);
  ctx.stroke();
  if (game.hook.catch)
    drawFish(
      game.hook.catch,
      hookX,
      hookY + 10,
      game.hook.state !== "fighting",
    );
  ctx.strokeStyle = "#fff3c7";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(hookX, hookY - 6);
  ctx.lineTo(hookX, hookY + 5);
  ctx.arc(hookX + 4, hookY + 5, 4, Math.PI, 0, true);
  ctx.lineTo(hookX + 8, hookY + 1);
  ctx.stroke();
  ellipse(hookX, height * 0.314, 3, 4, "#f1cc78");
  if (game.hook.state === "dropping") {
    ctx.strokeStyle = "#fff4cc30";
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(hookX, hookY + 15);
    ctx.lineTo(hookX, Math.min(height * 0.98, hookY + 50));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (game.mode === "playing") {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.25 * dt;
    }
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = p.life;
    ellipse(p.x * width, p.y * height, 3, 3, p.color);
    ctx.globalAlpha = 1;
  }
}
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0, 0.05);
  lastTime = now;
  if (
    inGame &&
    activeGame === "fishing" &&
    game.mode !== "paused" &&
    game.mode !== "ended"
  )
    frameTime += dt;
  if (inGame && activeGame === "fishing") game.tick(dt);
  game.drainEvents().forEach(onEvent);
  if (inGame && activeGame === "fishing" && now - lastUI >= 100) {
    updateUI();
    lastUI = now;
  }
  if (inGame && activeGame === "fishing") {
    fishingMotion.update(dt, game.mode === "playing");
    draw(frameTime, dt);
  }
  if (now > announcementUntil) $("announcement").classList.remove("visible");
  requestAnimationFrame(frame);
}
resize();
updateUI();
requestAnimationFrame(frame);
