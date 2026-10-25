import { BOMB_CELLS, MAX_BOMBS } from "./bomb-engine.js";
const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function tile({
  index,
  key = index,
  player,
  bomb,
  shown,
  placement,
  lastHit,
  lastSafe,
  locked,
}) {
  const label = `${placement ? "Tempat bom" : "Kotak"} ${index + 1}, ${bomb ? (placement ? "bom dipasang" : "kena bom") : shown ? "aman" : "tertutup"}`;
  return `<button class="bomb-tile ${bomb ? "has-bomb" : shown ? "safe-tile" : ""} ${lastHit ? "bomb-hit" : lastSafe ? "bomb-safe-reveal" : ""}" data-bomb="${key}" ${player !== undefined ? `data-bomb-player="${player}"` : ""} ${locked ? "disabled" : ""} ${placement ? `aria-pressed="${bomb}"` : ""} aria-label="${label}"><span>${bomb ? "💣" : shown ? "⭐" : placement ? "+" : "?"}</span><small>${index + 1}</small></button>`;
}
function lifeBar(arcade, player) {
  const g = arcade.engine,
    lives = g.lives(player);
  const lostNow = g.result?.player === player && g.result.hit;
  return `<div class="bomb-life-row"><span class="bomb-lives" role="img" aria-label="${esc(arcade.name(player))}: ${lives} dari ${MAX_BOMBS} nyawa">${Array.from({ length: MAX_BOMBS }, (_, i) => `<span aria-hidden="true" class="bomb-heart ${i >= lives ? "empty-heart" : ""} ${lostNow && i === lives ? "heart-just-lost" : ""}">${i < lives ? "♥" : "♡"}</span>`).join("")}</span><span class="bomb-life-count">${lives}/${MAX_BOMBS}</span></div>`;
}
function renderDuel(arcade) {
  const g = arcade.engine,
    playing = arcade.mode === "playing" && g.phase === "attack";
  $("arcadeStatus").textContent =
    g.winner !== null
      ? `${arcade.name(g.winner)} menang! Lawan kehabisan nyawa.`
      : g.bot && g.turn === 1
        ? "Bot sedang memilih kotak…"
        : `${arcade.name(g.turn)}: buka satu kotak lawan`;
  $("arcadePlay").innerHTML = `<div class="bomb-duel">${[1, 0]
    .map((player) => {
      const owner = 1 - player;
      const active = playing && g.turn === player;
      const interactive = active && !(g.bot && player === 1);
      const result = g.results[player];
      const feedback = result
        ? `${result.hit ? "💥 Kena bom!" : "⭐ Aman! +1 poin"}`
        : "Kotak aman +1 · Jaga 5 hatimu!";
      return `<section class="bomb-player-panel ${active ? "bomb-panel-active" : ""} ${g.result === result && result?.hit ? "bomb-panel-hit" : ""}" data-player="${player}" aria-label="Area bermain ${esc(arcade.name(player))}">
      ${arcade.camp(player, active, `${g.scores[player]} poin`)}
      ${lifeBar(arcade, player)}
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
  if (["attack", "ending", "ended"].includes(g.phase)) {
    renderDuel(arcade);
    restore();
    return;
  }
  const handover = g.phase === "handover";
  $("arcadeStatus").textContent = handover
    ? `Serahkan perangkat ke ${arcade.name(g.turn)}`
    : `${arcade.name(g.turn)}: sembunyikan 5 bom`;
  const camp = (player) =>
    arcade.camp(
      player,
      playing && g.turn === player,
      `${g.scores[player]} poin`,
    ) + lifeBar(arcade, player);
  $("arcadePlay").innerHTML =
    `${camp(1)}<div class="bomb-stage" data-phase="${g.phase}">${
      handover
        ? `<div class="bomb-handover"><span aria-hidden="true">🙈</span><h2>${esc(arcade.name(g.turn))}, giliranmu!</h2><p>Lawan jangan mengintip. Pilih 5 tempat bom rahasiamu.<br>Posisi bom tetap dirahasiakan.</p><button class="primary-button" data-action="bomb-ready" ${playing ? "" : "disabled"}>Saya ${esc(arcade.name(g.turn))}, siap!</button></div>`
        : `<div class="bomb-board-heading"><strong>🤫 Papan rahasiamu</strong><span>Pilih 5 kotak</span></div><div class="bomb-grid" role="group" aria-label="Tempatkan bom">${Array.from({ length: BOMB_CELLS }, (_, index) => tile({ index, bomb: g.bombs[g.turn].has(index), placement: true, locked: !playing })).join("")}</div><div class="bomb-placement-footer"><span>${g.bombs[g.turn].size}/${MAX_BOMBS} bom · Ketuk lagi untuk membatalkan</span><button class="primary-button" data-action="bomb-confirm" ${!playing || g.bombs[g.turn].size !== MAX_BOMBS ? "disabled" : ""}>Sembunyikan bom & siap →</button></div>`
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
