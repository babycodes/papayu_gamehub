const $ = (id) => document.getElementById(id);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderBomb(arcade) {
  const g = arcade.engine,
    playing = arcade.mode === "playing";
  if (arcade.mode === "paused") {
    $("arcadePlay").innerHTML =
      '<div class="bomb-handover"><span aria-hidden="true">🙈</span><h2>Papan disembunyikan</h2></div>';
    return;
  }
  const restore = arcade.preserveBoardFocus();
  const placement = g.phase === "placement",
    handover = g.phase === "handover";
  const botTurn = g.bot && g.turn === 1;
  const owner = placement ? g.turn : 1 - g.turn;
  const result = g.result;
  const status =
    g.winner !== null
      ? `${arcade.name(g.winner)} menang! Lawan terkena 3 bom.`
      : handover
        ? `Serahkan perangkat ke ${arcade.name(g.turn)}`
        : placement
          ? `${arcade.name(g.turn)}: sembunyikan 3 bom`
          : result
            ? result.hit
              ? `${arcade.name(result.player)} kena bom!`
              : `${arcade.name(result.player)} mendapat 1 poin!`
            : botTurn
              ? "Bot sedang memilih kotak…"
              : `${arcade.name(g.turn)}: buka satu kotak lawan`;
  $("arcadeStatus").textContent = status;
  const camp = (p) =>
    arcade.camp(
      p,
      playing && g.turn === p,
      `${g.scores[p]} poin · 💣 ${g.hits[p]}/3`,
    );
  const footer = result
    ? `<div class="bomb-feedback ${result.hit ? "bomb-feedback-hit" : ""}" role="status"><strong>${g.winner !== null ? `🏆 ${esc(arcade.name(g.winner))} menang!` : result.hit ? "💥 Kena bom!" : "⭐ Aman! +1 poin"}</strong><span>${result.hit ? `${esc(arcade.name(result.player))} · kena ${g.hits[result.player]} dari 3 bom` : esc(arcade.name(result.player))}</span><button class="primary-button" data-action="bomb-next" ${playing ? "" : "disabled"}>${g.winner !== null ? "Lihat hasil" : "Giliran berikutnya"} →</button></div>`
    : placement
      ? `<div class="bomb-placement-footer"><span>${g.bombs[g.turn].size}/3 bom · Ketuk lagi untuk membatalkan</span><button class="primary-button" data-action="bomb-confirm" ${!playing || g.bombs[g.turn].size !== 3 ? "disabled" : ""}>Sembunyikan bom & siap →</button></div>`
      : `<div class="bomb-tip">Kotak aman +1 poin · Kena 3 bom = kalah</div>`;
  $("arcadePlay").innerHTML =
    `${camp(1)}<div class="bomb-stage" data-phase="${g.phase}">${
      handover
        ? `<div class="bomb-handover"><span aria-hidden="true">🙈</span><h2>${esc(arcade.name(g.turn))}, giliranmu!</h2><p>${g.pending === "placement" ? "Lawan jangan mengintip. Pilih 3 tempat bom rahasiamu." : "Buka kotak lawan. Hindari 3 bom tersembunyi!"}<br>Posisi bom tetap dirahasiakan.</p><button class="primary-button" data-action="bomb-ready" ${playing ? "" : "disabled"}>Saya ${esc(arcade.name(g.turn))}, siap!</button></div>`
        : `<div class="bomb-board-heading"><strong>${placement ? "🤫 Papan rahasiamu" : `Papan ${esc(arcade.name(owner))}`}</strong><span>${placement ? "Pilih 3 kotak" : "4 × 4"}</span></div><div class="bomb-grid" role="group" aria-label="${placement ? "Tempatkan bom" : "Buka kotak lawan"}">${Array.from(
            { length: 16 },
            (_, i) => {
              const shown = !placement && g.revealed[owner].has(i);
              const bomb = placement
                ? g.bombs[owner].has(i)
                : shown && g.bombs[owner].has(i);
              const lastHit = result?.hit && result.index === i;
              const locked =
                !playing ||
                (!placement && (g.phase !== "attack" || botTurn || shown));
              const label = `${placement ? "Tempat bom" : "Kotak"} ${i + 1}, ${bomb ? (placement ? "bom dipasang" : "kena bom") : shown ? "aman" : "tertutup"}`;
              return `<button class="bomb-tile ${bomb ? "has-bomb" : shown ? "safe-tile" : ""} ${lastHit ? "bomb-hit" : ""}" data-bomb="${i}" ${locked ? "disabled" : ""} ${placement ? `aria-pressed="${bomb}"` : ""} aria-label="${label}"><span>${bomb ? "💣" : shown ? "⭐" : placement ? "+" : "✦"}</span><small>${i + 1}</small></button>`;
            },
          ).join("")}</div>${footer}`
    }</div>${camp(0)}`;
  restore();
}
export function bombAction(arcade, button) {
  const g = arcade.engine,
    action = button.dataset.action;
  if (action === "bomb-ready") g.acknowledge();
  else if (action === "bomb-confirm") {
    if (g.confirm()) arcade.onMove();
  } else if (action === "bomb-next") {
    if (g.winner !== null)
      return arcade.finish(`${arcade.name(g.winner)} menang!`);
    g.next();
    arcade.botDelay = 0;
  } else if (button.dataset.bomb !== undefined) {
    const index = Number(button.dataset.bomb);
    if (g.phase === "placement") g.toggle(index);
    else if (!(g.bot && g.turn === 1) && g.open(index)) arcade.onMove();
  } else return;
  arcade.renderBoard();
}
