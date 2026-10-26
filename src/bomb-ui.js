import { BOMB_CELLS, MAX_BOMBS, MINE_HOLD_SECONDS } from "./bomb-engine.js";
const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// Original local vector art: a pressure mine with a digital timer, no image download.
function mineArt({ defused = false, exploded = false, clock = false } = {}) {
  return `<svg class="bomb-mine-art ${defused ? "mine-art-defused" : ""}" viewBox="0 0 100 90" aria-hidden="true" focusable="false"><path d="M39 19v-8h22v8" fill="none" stroke="#465963" stroke-width="7" stroke-linejoin="round"/><path d="M15 48H7v16h9m68-16h9v16h-9" fill="#85999b" stroke="#354950" stroke-width="3"/><ellipse cx="50" cy="60" rx="39" ry="25" fill="#536d73" stroke="#30474e" stroke-width="4"/><path d="M16 51q3-28 34-28t34 28" fill="#8a9f99" stroke="#30474e" stroke-width="4"/><path d="M21 43q29-14 58 0" fill="none" stroke="#e7bf68" stroke-width="9"/><circle cx="25" cy="64" r="3" fill="#c8d2be"/><circle cx="75" cy="64" r="3" fill="#c8d2be"/><rect x="28" y="46" width="44" height="26" rx="5" fill="#263d40" stroke="#c9bd8e" stroke-width="2"/><text ${clock ? "data-mine-clock" : ""} x="50" y="65" text-anchor="middle" fill="${defused ? "#bce79a" : "#ffbf82"}" font-family="monospace" font-size="21" font-weight="bold">${defused ? "✓" : exploded ? "00" : "05"}</text><circle class="mine-status-light" cx="50" cy="32" r="4" fill="${defused ? "#a5d47f" : "#a54d3d"}"/></svg>`;
}
function tile({
  index,
  key = index,
  player,
  bomb,
  mine = false,
  defused = false,
  shown,
  placement,
  lastHit,
  lastSafe,
  locked,
}) {
  const label = `${placement ? "Tempat bom" : "Kotak"} ${index + 1}, ${mine ? (placement ? "ranjau dipasang" : defused ? "ranjau dijinakkan" : "ranjau meledak") : bomb ? (placement ? "bom dipasang" : "kena bom") : shown ? "aman" : "tertutup"}`;
  return `<button class="bomb-tile ${mine ? "has-mine" : ""} ${bomb ? "has-bomb" : shown ? "safe-tile" : ""} ${lastHit ? "bomb-hit" : lastSafe ? "bomb-safe-reveal" : ""}" data-bomb="${key}" ${player !== undefined ? `data-bomb-player="${player}"` : ""} ${locked ? "disabled" : ""} ${placement ? `aria-pressed="${bomb || mine}"` : ""} aria-label="${label}"><span>${mine ? mineArt({ defused, exploded: shown && !placement && !defused }) : bomb ? "💣" : shown ? "⭐" : placement ? "+" : "?"}</span><small>${index + 1}</small></button>`;
}
function lifeBar(arcade, player) {
  const g = arcade.engine,
    lives = g.lives(player);
  const lostNow = g.result?.player === player && g.result.hit;
  return `<div class="bomb-life-row"><span class="bomb-lives" role="img" aria-label="${esc(arcade.name(player))}: ${lives} dari ${MAX_BOMBS} nyawa">${Array.from({ length: MAX_BOMBS }, (_, i) => `<span aria-hidden="true" class="bomb-heart ${i >= lives ? "empty-heart" : ""} ${lostNow && i === lives ? "heart-just-lost" : ""}">${i < lives ? "♥" : "♡"}</span>`).join("")}</span><span class="bomb-life-count">${lives}/${MAX_BOMBS}</span></div>`;
}
function renderDuel(arcade) {
  const g = arcade.engine,
    playing = arcade.mode === "playing" && ["attack", "mine"].includes(g.phase);
  $("arcadeStatus").textContent =
    g.winner === "draw"
      ? "Seri! Kalian sama-sama menyisakan satu bom dan satu hati."
      : g.winner !== null
        ? `${arcade.name(g.winner)} menang! Lawan kehabisan nyawa.`
        : g.phase === "mine"
          ? `${arcade.name(g.turn)}: tahan tombol untuk jinakkan ranjau!`
          : g.bot && g.turn === 1
            ? "Bot sedang memilih kotak…"
            : `${arcade.name(g.turn)}: buka satu kotak lawan`;
  $("arcadePlay").innerHTML = `<div class="bomb-duel">${[1, 0]
    .map((player) => {
      const owner = 1 - player;
      const active = playing && g.turn === player;
      const interactive =
        active && g.phase === "attack" && !(g.bot && player === 1);
      const result = g.results[player];
      const feedback = result
        ? `${result.defused ? "🛡️ Hebat! Ranjau jinak +3 poin" : result.hit ? (result.mine ? "💥 Ranjau meledak! −1 hati" : "💥 DUARR! −1 hati") : "⭐ Aman! +1 poin"}`
        : "Kotak aman +1 · Jaga 5 hatimu!";
      return `<section class="bomb-player-panel ${active ? "bomb-panel-active" : ""} ${g.result === result && result?.hit ? "bomb-panel-hit" : ""}" data-player="${player}" aria-label="Area bermain ${esc(arcade.name(player))}">
      ${arcade.camp(player, active, `${g.scores[player]} poin`)}
      ${lifeBar(arcade, player)}
      ${g.result === result && result?.hit ? `<div class="bomb-explosion" aria-hidden="true"><span>💥</span><b>DUARR!</b>${Array.from({ length: 8 }, (_, i) => `<i style="--ray:${i}"></i>`).join("")}</div>` : ""}
      ${g.phase === "mine" && g.turn === player ? `<div class="bomb-mine-challenge"><span aria-hidden="true">${mineArt({ clock: true })}</span><strong>${g.bot && player === 1 ? "Bot menjinakkan ranjau…" : "Ranjau! Tahan sampai penuh"}</strong><span class="mine-countdown"></span><button class="mine-hold-button" data-mine-hold ${g.bot && player === 1 ? "disabled" : ""}>✋ TAHAN DI SINI<div class="mine-meter" role="progressbar" aria-label="Penjinakan ranjau" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></button><small>Tahan 1,6 detik · Jangan lepas · Bonus +3</small></div>` : ""}
      <div class="bomb-target-label">Kotak lawan · ${esc(arcade.name(owner))}</div>
      <div class="bomb-duel-grid" role="group" aria-label="${esc(arcade.name(player))}: buka kotak ${esc(arcade.name(owner))}">${Array.from(
        { length: BOMB_CELLS },
        (_, index) => {
          const shown = g.revealed[owner].has(index);
          return tile({
            index,
            key: player * BOMB_CELLS + index,
            player,
            shown,
            bomb: shown && g.bombs[owner].has(index),
            mine:
              shown &&
              g.mines[owner] === index &&
              !(g.mine?.target === owner && g.mine.index === index),
            defused: g.defused[owner].has(index),
            lastHit:
              g.result === result && result?.hit && result.index === index,
            lastSafe:
              g.result === result &&
              result &&
              !result.hit &&
              result.index === index,
            locked: !interactive || shown,
          });
        },
      ).join("")}</div>
      <div class="bomb-panel-feedback ${result?.hit ? "bomb-feedback-hit" : ""}">${feedback}</div>
    </section>`;
    })
    .join("")}</div>`;
}
export function renderBomb(arcade) {
  const g = arcade.engine,
    playing = arcade.mode === "playing";
  if (arcade.mode === "paused") {
    $("arcadePlay").innerHTML =
      '<div class="bomb-handover"><span aria-hidden="true">🙈</span><h2>Papan disembunyikan</h2></div>';
    return;
  }
  const restore = arcade.preserveBoardFocus();
  if (["attack", "mine", "ending", "ended"].includes(g.phase)) {
    renderDuel(arcade);
    updateMineUI(arcade);
    restore();
    if (g.phase === "mine" && !(g.bot && g.turn === 1) && !g.mine.holding)
      arcade.root
        .querySelector("[data-mine-hold]")
        ?.focus({ preventScroll: true });
    return;
  }
  const handover = g.phase === "handover";
  $("arcadeStatus").textContent = handover
    ? `Serahkan perangkat ke ${arcade.name(g.turn)}`
    : `${arcade.name(g.turn)}: sembunyikan 5 bom + 1 ranjau`;
  const camp = (player) =>
    arcade.camp(
      player,
      playing && g.turn === player,
      `${g.scores[player]} poin`,
    ) + lifeBar(arcade, player);
  $("arcadePlay").innerHTML =
    `${camp(1)}<div class="bomb-stage" data-phase="${g.phase}">${
      handover
        ? `<div class="bomb-handover"><span aria-hidden="true">🙈</span><h2>${esc(arcade.name(g.turn))}, giliranmu!</h2><p>Lawan jangan mengintip. Pilih 5 bom, lalu 1 ranjau tambahan.<br>Posisi bom tetap dirahasiakan.</p><button class="primary-button" data-action="bomb-ready" ${playing ? "" : "disabled"}>Saya ${esc(arcade.name(g.turn))}, siap!</button></div>`
        : `<div class="bomb-board-heading"><strong>🤫 Papan rahasiamu</strong><span>${g.bombs[g.turn].size === MAX_BOMBS ? "⏱ Pilih 1 ranjau waktu" : "💣 Pilih 5 bom dahulu"}</span></div><div class="bomb-grid" role="group" aria-label="Tempatkan bom">${Array.from({ length: BOMB_CELLS }, (_, index) => tile({ index, bomb: g.bombs[g.turn].has(index), mine: g.mines[g.turn] === index, placement: true, locked: !playing })).join("")}</div><div class="bomb-placement-footer"><span>${g.bombs[g.turn].size}/${MAX_BOMBS} bom · ${g.mines[g.turn] === null ? "0" : "1"}/1 ranjau · Ketuk untuk ubah</span><button class="primary-button" data-action="bomb-confirm" ${!playing || g.bombs[g.turn].size !== MAX_BOMBS || g.mines[g.turn] === null ? "disabled" : ""}>Sembunyikan bom & siap →</button></div>`
    }</div>${camp(0)}`;
  restore();
}
export function bombAction(arcade, button) {
  const g = arcade.engine,
    action = button.dataset.action;
  if (action === "bomb-ready") g.acknowledge();
  else if (action === "bomb-confirm") {
    if (g.confirm()) arcade.onMove();
  } else if (button.dataset.bomb !== undefined) {
    const key = Number(button.dataset.bomb);
    if (g.phase === "placement") g.toggle(key);
    else {
      const player = Number(button.dataset.bombPlayer);
      if (!(g.bot && player === 1) && g.open(key % BOMB_CELLS, player)) {
        arcade.botDelay = 0;
        arcade.onMove();
      }
    }
  } else return;
  arcade.renderBoard();
}

export function updateMineUI(arcade) {
  const mine = arcade.engine.mine;
  if (!mine) return;
  const root = arcade.root;
  const meter = root.querySelector(".mine-meter");
  const value = Math.min(
    100,
    Math.round((mine.held / MINE_HOLD_SECONDS) * 100),
  );
  if (meter) {
    meter.setAttribute("aria-valuenow", value);
    meter.firstElementChild.style.width = `${value}%`;
  }
  const clock = root.querySelector("[data-mine-clock]");
  if (clock)
    clock.textContent = String(Math.ceil(mine.remaining)).padStart(2, "0");
  const countdown = root.querySelector(".mine-countdown");
  if (countdown) countdown.textContent = `${Math.ceil(mine.remaining)} detik`;
}
export function bindBombInteraction(arcade) {
  let input = null;
  const start = (e) => {
    const button = e.target.closest("[data-mine-hold]");
    if (
      !button ||
      arcade.id !== "bom-bom" ||
      arcade.mode !== "playing" ||
      button.disabled
    )
      return;
    if (
      e.type === "keydown" &&
      (!["Space", "Enter"].includes(e.code) || e.repeat)
    )
      return;
    if (e.type === "pointerdown" && e.button !== 0) return;
    e.preventDefault();
    if (arcade.engine.mine?.holding) return;
    if (arcade.engine.holdMine()) {
      input =
        e.pointerId !== undefined ? `pointer:${e.pointerId}` : `key:${e.code}`;
      if (e.pointerId !== undefined) button.setPointerCapture(e.pointerId);
      button.classList.add("is-holding");
    }
  };
  const end = (e) => {
    const source =
      e.pointerId !== undefined ? `pointer:${e.pointerId}` : `key:${e.code}`;
    if (input !== source) return;
    input = null;
    if (e.type === "keyup" && !["Space", "Enter"].includes(e.code)) return;
    if (
      arcade.id === "bom-bom" &&
      arcade.mode === "playing" &&
      !(arcade.engine.bot && arcade.engine.turn === 1) &&
      arcade.engine.releaseMine()
    ) {
      arcade.onMove();
      arcade.renderBoard();
    }
  };
  arcade.root.addEventListener("pointerdown", start);
  arcade.root.addEventListener("keydown", start);
  for (const type of ["pointerup", "pointercancel", "keyup"])
    window.addEventListener(type, end);
  arcade.root.addEventListener("lostpointercapture", end);
  arcade.root.addEventListener("contextmenu", (e) => {
    if (e.target.closest("[data-mine-hold]")) e.preventDefault();
  });
  window.addEventListener("blur", () => {
    if (arcade.id === "bom-bom" && arcade.mode === "playing") arcade.pause();
  });
}
