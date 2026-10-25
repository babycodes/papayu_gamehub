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
  locked,
}) {
  const label = `${placement ? "Tempat bom" : "Kotak"} ${index + 1}, ${bomb ? (placement ? "bom dipasang" : "kena bom") : shown ? "aman" : "tertutup"}`;
  return `<button class="bomb-tile ${bomb ? "has-bomb" : shown ? "safe-tile" : ""} ${lastHit ? "bomb-hit" : ""}" data-bomb="${key}" ${player !== undefined ? `data-bomb-player="${player}"` : ""} ${locked ? "disabled" : ""} ${placement ? `aria-pressed="${bomb}"` : ""} aria-label="${label}"><span>${bomb ? "💣" : shown ? "⭐" : placement ? "+" : "✦"}</span><small>${index + 1}</small></button>`;
}
function renderDuel(arcade) {
  const g = arcade.engine,
    playing = arcade.mode === "playing" && g.phase === "attack";
  $("arcadeStatus").textContent =
    g.winner !== null
      ? `${arcade.name(g.winner)} menang! Lawan terkena 3 bom.`
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
        : "Kotak aman +1 · 3 bom = kalah";
      return `<section class="bomb-player-panel ${active ? "bomb-panel-active" : ""}" data-player="${player}" aria-label="Area bermain ${esc(arcade.name(player))}">
      ${arcade.camp(player, active, `${g.scores[player]} poin · 💣 ${g.hits[player]}/3`)}
      <div class="bomb-target-label">Kotak lawan · ${esc(arcade.name(owner))}</div>
      <div class="bomb-duel-grid" role="group" aria-label="${esc(arcade.name(player))}: buka kotak ${esc(arcade.name(owner))}">${Array.from(
        { length: 16 },
        (_, index) => {
          const shown = g.revealed[owner].has(index);
          return tile({
            index,
            key: player * 16 + index,
            player,
            shown,
            bomb: shown && g.bombs[owner].has(index),
            lastHit:
              g.result === result && result?.hit && result.index === index,
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
    : `${arcade.name(g.turn)}: sembunyikan 3 bom`;
  const camp = (player) =>
    arcade.camp(
      player,
      playing && g.turn === player,
      `${g.scores[player]} poin · 💣 ${g.hits[player]}/3`,
    );
  $("arcadePlay").innerHTML =
    `${camp(1)}<div class="bomb-stage" data-phase="${g.phase}">${
      handover
        ? `<div class="bomb-handover"><span aria-hidden="true">🙈</span><h2>${esc(arcade.name(g.turn))}, giliranmu!</h2><p>Lawan jangan mengintip. Pilih 3 tempat bom rahasiamu.<br>Posisi bom tetap dirahasiakan.</p><button class="primary-button" data-action="bomb-ready" ${playing ? "" : "disabled"}>Saya ${esc(arcade.name(g.turn))}, siap!</button></div>`
        : `<div class="bomb-board-heading"><strong>🤫 Papan rahasiamu</strong><span>Pilih 3 kotak</span></div><div class="bomb-grid" role="group" aria-label="Tempatkan bom">${Array.from({ length: 16 }, (_, index) => tile({ index, bomb: g.bombs[g.turn].has(index), placement: true, locked: !playing })).join("")}</div><div class="bomb-placement-footer"><span>${g.bombs[g.turn].size}/3 bom · Ketuk lagi untuk membatalkan</span><button class="primary-button" data-action="bomb-confirm" ${!playing || g.bombs[g.turn].size !== 3 ? "disabled" : ""}>Sembunyikan bom & siap →</button></div>`
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
      if (!(g.bot && player === 1) && g.open(key % 16, player)) {
        arcade.botDelay = 0;
        arcade.onMove();
      }
    }
  } else return;
  arcade.renderBoard();
}
