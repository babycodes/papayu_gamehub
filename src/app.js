import { FishingGame } from './engine.js';
import { GAMES } from './catalog.js';
const $ = id => document.getElementById(id);
const canvas = $('sea'), ctx = canvas.getContext('2d');
const game = new FishingGame();
let width = 800, height = 470, frameTime = 0, lastTime = 0, lastUI = 0, sound = true, audio, pointerId = null, announcementUntil = 0;
let inGame = false, resumeAfterExit = false;
const gameScreen = $('gameScreen'), exitDialog = $('exitDialog');
let best = 0;
try { best = Number(localStorage.getItem('papayu-fishing-best')) || 0; } catch {}
$('bestScore').innerHTML = `${best} <small>poin</small>`;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const particles = [];
function resize() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  width = rect.width; height = rect.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resize).observe(canvas);
function tone(notes = [523, 659, 784], duration = .09) {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    notes.forEach((frequency, i) => {
      const oscillator = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + i * duration;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.045, start + .012); gain.gain.exponentialRampToValueAtTime(.001, start + duration * 1.8);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + duration * 2);
    });
  } catch {}
}
function announce(message, seconds = 2.3) {
  $('announcement').textContent = message; $('announcement').classList.add('visible'); announcementUntil = performance.now() + seconds * 1000;
}
function updateUI() {
  $('score').innerHTML = `${game.score.toLocaleString('id-ID')} <span>poin</span>`;
  const seconds = Math.ceil(game.remaining);
  $('timer').textContent = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  $('timer').classList.toggle('timer-warning', seconds <= 15);
  $('combo').innerHTML = `×${game.combo} <span>${game.combo > 1 ? 'mantap!' : 'ayo mulai!'}</span>`;
  $('catchCount').textContent = `${game.count} IKAN`;
  $('frenzyBanner').hidden = !game.frenzy || game.mode !== 'playing';
  $('frenzyTime').textContent = `· ${Math.ceil(8 - game.elapsed % 25)}d`;
  const names = ['Penjelajah pemula', 'Sahabat laut', 'Kapten Teluk Ceria'];
  const level = game.score >= 900 ? 2 : game.score >= 300 ? 1 : 0;
  $('levelName').textContent = names[level];
  $('levelHint').textContent = level === 2 ? 'Hebat! Kamu kapten hari ini.' : `Raih ${level ? 900 : 300} poin untuk naik level`;
  $('hookTitle').textContent = game.hook.catch ? `Dapat ${game.hook.catch.name.toLowerCase()}!` : game.hook.state === 'dropping' ? 'Kail sedang turun…' : game.hook.state === 'reeling' ? 'Menggulung kail…' : 'Kail siap beraksi';
  $('hookHint').textContent = game.hook.state === 'idle' ? 'Tahan, arahkan, lalu lepaskan.' : game.hook.catch ? 'Sebentar lagi sampai perahu!' : game.hook.state === 'dropping' ? 'Geser untuk mendekati ikan.' : 'Coba kedalaman lain, yuk!';
  $('fishButton').classList.toggle('holding', game.hook.state === 'dropping');
}
function showOverlay(title, text, button, footnote) {
  $('overlayTitle').textContent = title; $('overlayText').textContent = text;
  $('playButton').innerHTML = `${button} <span>→</span>`;
  $('overlayFootnote').textContent = footnote; $('gameOverlay').hidden = false;
}
function start() {
  if (!inGame || exitDialog.open) return;
  if (game.mode === 'paused') game.resume();
  else { game.reset(); particles.length = 0; $('lastCatch').innerHTML = '<span class="catch-illustration">♧</span><div><strong>Siapa yang pertama?</strong><p>Ikan pertamamu menunggu!</p></div>'; }
  $('gameOverlay').hidden = true; $('fishButton').disabled = false; $('pauseButton').disabled = false;
  updateUI(); tone([392, 523, 659]);
  canvas.focus({ preventScroll: true });

}
function pause() {
  if (game.mode !== 'playing') return;
  game.pause(); pointerId = null; $('fishButton').disabled = true; $('pauseButton').disabled = true;
  showOverlay('Istirahat sebentar, yuk.', 'Waktu berhenti. Ikan-ikan menunggumu kembali.', 'Lanjut memancing', 'Tarik napas, lalu lanjutkan petualangan.'); updateUI();
}
$('playButton').addEventListener('click', start);
$('pauseButton').addEventListener('click', pause);
$('soundButton').addEventListener('click', () => { sound = !sound; $('soundButton').textContent = sound ? '♫' : '♪̸'; $('soundButton').setAttribute('aria-label', sound ? 'Matikan suara' : 'Aktifkan suara'); $('soundButton').setAttribute('aria-pressed', String(!sound)); if (sound) tone([523]); });
// Hub catalog and game navigation are independent of the fishing engine.
const launchers = { fishing: openFishing };
for (const item of GAMES) {
  const card = document.createElement('article');
  card.className = 'catalog-card'; card.dataset.game = item.id;
  card.innerHTML = `<div class="catalog-art" aria-hidden="true"><span>${item.icon}</span></div><div class="catalog-content"><div class="catalog-kicker"><span>${item.category}</span><span class="${item.available ? 'available-tag' : ''}">${item.duration}</span></div><h3>${item.title}</h3><p>${item.description}</p><div class="mode-tags">${item.modes.map(mode => `<span>${mode}</span>`).join('')}</div></div>`;
  const button = document.createElement('button');
  button.className = item.available ? 'primary-button' : 'unavailable-button';
  button.disabled = !item.available;
  button.textContent = item.available ? `${item.action} →` : 'Segera hadir';
  if (item.available) button.addEventListener('click', () => launchers[item.id]());
  card.querySelector('.catalog-content').append(button); $('gameCatalog').append(card);
}
function updateFullscreenButton() {
  $('fullscreenButton').setAttribute('aria-label', document.fullscreenElement ? 'Keluar dari layar penuh' : 'Aktifkan layar penuh');
}
async function enterFullscreen() {
  // iOS and some embedded browsers do not support this API; viewport layout still fills the screen.
  try { if (!document.fullscreenElement && gameScreen.requestFullscreen) await gameScreen.requestFullscreen(); } catch {}
  updateFullscreenButton();
}
function openFishing(pushHistory = true, fullscreen = true) {
  inGame = true; $('hubScreen').hidden = true; $('hubHeader').hidden = true; gameScreen.hidden = false;
  document.body.classList.add('in-game'); document.title = 'Teluk Ceria • Papayu';
  showOverlay('Lautnya sudah siap. Kamu juga?', 'Tahan di laut untuk turun. Geser, lalu lepaskan!', 'Mulai memancing', '90 detik, lima kedalaman, banyak kejutan.');
  $('fishButton').disabled = true; $('pauseButton').disabled = true;
  resize(); updateUI(); $('playButton').focus({ preventScroll: true });
  if (pushHistory) history.pushState({ view: 'fishing' }, '', '#fishing');
  if (fullscreen) enterFullscreen();
}
function leaveGame() {
  if (exitDialog.open) exitDialog.close();
  inGame = false; pointerId = null; game.reset('ready'); particles.length = 0;
  gameScreen.hidden = true; $('hubScreen').hidden = false; $('hubHeader').hidden = false;
  document.body.classList.remove('in-game'); document.title = 'Papayu Gamehub';
  $('announcement').classList.remove('visible'); announcementUntil = 0;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  document.querySelector('[data-game="fishing"] button').focus({ preventScroll: true });
  // Keep last completed/abandoned catch details in the hub until the next round starts.
}
function requestExit() {
  if (!inGame || exitDialog.open) return;
  if (game.mode === 'playing' || game.mode === 'paused') {
    resumeAfterExit = game.mode === 'playing'; pause(); exitDialog.showModal();
  } else confirmExit();
}
function cancelExit() {
  exitDialog.close();
  if (resumeAfterExit) start();
  else $('playButton').focus({ preventScroll: true });
  resumeAfterExit = false;
}
function confirmExit() {
  leaveGame();
  if (history.state?.view === 'fishing') history.back();
}
$('exitButton').addEventListener('click', requestExit);
$('cancelExit').addEventListener('click', cancelExit);
$('confirmExit').addEventListener('click', confirmExit);
exitDialog.addEventListener('cancel', event => { event.preventDefault(); cancelExit(); });
$('fullscreenButton').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else enterFullscreen();
});
document.addEventListener('fullscreenchange', () => { updateFullscreenButton(); if (inGame && !document.fullscreenElement) pause(); });
window.addEventListener('popstate', () => {
  if (history.state?.view === 'fishing') { if (!inGame) openFishing(false, false); return; }
  if (!inGame) return;
  if (game.mode === 'playing' || game.mode === 'paused') {
    history.pushState({ view: 'fishing' }, '', '#fishing'); requestExit();
  } else leaveGame();
});
window.addEventListener('beforeunload', event => {
  if (inGame && ['playing', 'paused'].includes(game.mode)) { event.preventDefault(); event.returnValue = ''; }
});
history.replaceState({ view: 'hub' }, '', location.pathname + location.search);
function aim(event) { game.aim((event.clientX - canvas.getBoundingClientRect().left) / width); }
function pointerDown(event) {
  if (game.mode !== 'playing' || pointerId !== null || event.button !== 0) return;
  event.preventDefault(); pointerId = event.pointerId;
  if (event.currentTarget === canvas) aim(event);
  event.currentTarget.setPointerCapture(event.pointerId); game.press();
}
for (const target of [canvas, $('fishButton')]) {
  target.addEventListener('pointerdown', pointerDown);
  target.addEventListener('pointermove', event => { if (pointerId === event.pointerId && target === canvas) aim(event); });
  target.addEventListener('pointerup', event => { if (pointerId === event.pointerId) { pointerId = null; game.release(); } });
  target.addEventListener('pointercancel', () => { pointerId = null; game.release(); });
  target.addEventListener('lostpointercapture', () => { pointerId = null; game.release(); });
  target.addEventListener('contextmenu', event => event.preventDefault());
}
window.addEventListener('keydown', event => {
  if (!inGame || exitDialog.open || game.mode !== 'playing') return;
  if (['Space', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(event.code)) event.preventDefault();
  if (event.code === 'Space' && !event.repeat) game.press();
  if (event.code === 'ArrowLeft') game.aim(game.hook.targetX - .035);
  if (event.code === 'ArrowRight') game.aim(game.hook.targetX + .035);
  if (event.code === 'Escape') pause();
});
window.addEventListener('keyup', event => { if (event.code === 'Space') { if (game.mode === 'playing') event.preventDefault(); game.release(); } });
window.addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
function onEvent(event) {
  if (event.type === 'catch') {
    announce(`+${event.points} poin · ${event.fish.name}${event.combo > 1 ? ` · Combo ×${event.combo}!` : ''}`);
    $('lastCatch').innerHTML = `<span class="catch-illustration" style="color:${event.fish.accent}">➤</span><div><strong>${event.fish.name}</strong><p>+${event.points} poin · tangkapan ke-${game.count}</p></div>`;
    tone(event.fish.layer === 4 ? [523, 659, 784, 1047] : [523, 659, 784]);
    for (let i = 0; i < 12; i++) particles.push({ x: game.hook.x, y: .29, vx: (Math.random() - .5) * .15, vy: -Math.random() * .2, life: 1, color: event.fish.color });
  }
  if (event.type === 'bonus') { announce('Hore! +12 detik petualangan'); tone([659, 784, 1047]); }
  if (event.type === 'hooked') { tone([330, 440], .06); if (navigator.vibrate) navigator.vibrate(30); }
  if (event.type === 'miss') announce('Belum dapat? Coba lagi, yuk!', 1.5);
  if (event.type === 'bonus-spawn') announce('Bonus waktu muncul di lapisan 3!', 2.5);
  if (event.type === 'frenzy') { announce('Frenzy! Cari ikan bintang ajaib ✦', 3); tone([392, 523, 659, 784]); }
  if (event.type === 'end') {
    const record = game.score > best;
    if (record) { best = game.score; try { localStorage.setItem('papayu-fishing-best', String(best)); } catch {} }
    $('bestScore').innerHTML = `${best.toLocaleString('id-ID')} <small>poin</small>`;
    $('fishButton').disabled = true; $('pauseButton').disabled = true; pointerId = null;
    showOverlay(record ? 'Rekor baru! Hebat sekali.' : 'Petualangan yang seru!', `${game.score.toLocaleString('id-ID')} poin · ${game.count} ikan · ${game.rareCount} ikan langka · combo terbaik ×${game.bestCombo}`, 'Main lagi', 'Setiap petualangan adalah kesempatan baru.'); tone([784, 659, 523], .15);
  }
}
function ellipse(x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function path(points, color) { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); }
function rounded(x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function drawFish(fish, x, y, caught = false) {
  const scale = Math.max(.4, Math.min(1, width / 650, height / 470));
  const s = fish.size * scale;
  ctx.save(); ctx.translate(x, y); ctx.scale(fish.direction, 1);
  if (caught) ctx.rotate(-.35);
  if (fish.bonus) {
    ctx.shadowColor = '#ffe793'; ctx.shadowBlur = 15;
    ellipse(0, 0, s * .65, s * .65, '#ffe9ae'); ctx.shadowBlur = 0;
    ellipse(0, 0, s * .48, s * .48, '#fff6d7');
    ctx.strokeStyle = '#b69143'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -s * .28); ctx.lineTo(0, 0); ctx.lineTo(s * .23, 0); ctx.stroke();
    ctx.restore(); return;
  }
  if (fish.layer === 4 || fish.special) { ctx.shadowColor = fish.color; ctx.shadowBlur = game.frenzy ? 18 : 7; }
  if (fish.special) {
    const points = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? s * .45 : s; points.push([Math.cos(a) * radius, Math.sin(a) * radius]); }
    path(points, fish.color); ctx.shadowBlur = 0; ellipse(-s * .17, -s * .05, 2, 2.5, '#685459'); ellipse(s * .17, -s * .05, 2, 2.5, '#685459');
  } else {
    path([[-s * .75, 0], [-s * 1.25, -s * .45], [-s * 1.25, s * .45]], fish.accent);
    path([[-s * .3, -s * .2], [-s * .2, -s * .85], [s * .25, -s * .35]], fish.accent);
    ellipse(0, 0, s, s * .53, fish.color); ctx.shadowBlur = 0;
    ellipse(s * .1, s * .16, s * .65, s * .25, '#ffffff22');
    path([[-s * .18, s * .05], [-s * .45, s * .35], [s * .04, s * .26]], fish.accent);
    ellipse(s * .56, -s * .09, s * .14, s * .16, '#fffaf1'); ellipse(s * .60, -s * .08, s * .065, s * .09, '#355654');
    ctx.strokeStyle = fish.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s * .76, s * .15, s * .14, .1, 1.3); ctx.stroke();
    if (fish.layer === 2) { for (let i = -1; i <= 1; i++) { ctx.strokeStyle = fish.accent + '70'; ctx.lineWidth = s * .08; ctx.beginPath(); ctx.moveTo(i * s * .25 - .3 * s, -s * .31); ctx.lineTo(i * s * .25 - .4 * s, s * .23); ctx.stroke(); } }
    if (fish.layer === 4) { ctx.fillStyle = '#fff9d1'; ctx.font = `${s * .45}px sans-serif`; ctx.fillText('✦', -s * .35, s * .05); }
  }
  ctx.restore();
}
function drawBoat(t) {
  const bx = width * .47, by = height * .278 + Math.sin(t * 1.4) * (reducedMotion ? 0 : 2);
  const scale = Math.max(.4, Math.min(1, width / 650, height / 450));
  ctx.save(); ctx.translate(bx, by); ctx.scale(scale, scale);
  ellipse(-11, 17, 67, 5, '#326f7435');
  // Rod and line origin.
  ctx.strokeStyle = '#756b49'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -47); ctx.quadraticCurveTo(36, -112, 79, -53); ctx.stroke();
  // Fisher's legs and shirt.
  ctx.strokeStyle = '#3e6262'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-22, -30); ctx.lineTo(-11, -7); ctx.lineTo(6, -7); ctx.stroke();
  rounded(-42, -66, 28, 38, 8, '#f2d7a5');
  ctx.strokeStyle = '#d9b688'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-20, -53); ctx.lineTo(-5, -43); ctx.lineTo(8, -57); ctx.stroke();
  ellipse(-27, -80, 13, 14, '#eabf99');
  path([[-42, -82], [-34, -101], [-15, -101], [-7, -82]], '#d8b975');
  rounded(-49, -85, 46, 7, 3, '#ecd293');
  ellipse(-20, -78, 1.4, 1.8, '#516460');
  // Curved wooden hull.
  ctx.fillStyle = '#af7652'; ctx.beginPath(); ctx.moveTo(-78, -7); ctx.quadraticCurveTo(-54, 29, 29, 13); ctx.quadraticCurveTo(53, 8, 63, -14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d39c6b'; ctx.beginPath(); ctx.moveTo(-78, -7); ctx.quadraticCurveTo(-20, 3, 63, -14); ctx.lineTo(57, -6); ctx.quadraticCurveTo(-20, 12, -72, 0); ctx.fill();
  ctx.strokeStyle = '#925f493d'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-56, 6); ctx.quadraticCurveTo(0, 20, 43, 1); ctx.stroke();
  rounded(-61, -16, 24, 10, 3, '#c8b789');
  ctx.restore();
  return { x: bx + 79 * scale, y: by - 53 * scale };
}
function draw(t, dt) {
  ctx.clearRect(0, 0, width, height);
  const waterline = height * .31;
  const sky = ctx.createLinearGradient(0, 0, 0, waterline); sky.addColorStop(0, '#d5e9df'); sky.addColorStop(1, '#e7edce'); ctx.fillStyle = sky; ctx.fillRect(0, 0, width, waterline);
  // Sun, soft clouds and distant islands.
  ellipse(width * .77, height * .14, 26, 26, '#f4e6b0'); ellipse(width * .77, height * .14, 36, 36, '#f8eed536');
  for (const [x, y, s] of [[.12, .13, 1], [.63, .10, .7], [.91, .23, .8]]) { ellipse(width * x, height * y, 31 * s, 7 * s, '#f7f7e777'); ellipse(width * x + 13, height * y - 6, 17 * s, 10 * s, '#f7f7e777'); }
  path([[0, waterline], [0, waterline - 9], [width * .07, waterline - 33], [width * .16, waterline - 13], [width * .23, waterline - 20], [width * .32, waterline]], '#a9c5b273');
  path([[width * .72, waterline], [width * .86, waterline - 18], [width * .94, waterline - 29], [width, waterline - 20], [width, waterline]], '#a9c5b273');
  ctx.strokeStyle = '#809d8c'; ctx.lineWidth = 1;
  for (const [x, y] of [[.22, .10], [.27, .16], [.67, .19]]) { ctx.beginPath(); ctx.moveTo(width * x - 5, height * y + 2); ctx.quadraticCurveTo(width * x - 2, height * y - 3, width * x, height * y); ctx.quadraticCurveTo(width * x + 3, height * y - 3, width * x + 6, height * y + 1); ctx.stroke(); }
  const ocean = ctx.createLinearGradient(0, waterline, 0, height); ocean.addColorStop(0, '#80c7ca'); ocean.addColorStop(.22, '#61b4bc'); ocean.addColorStop(.48, '#4797aa'); ocean.addColorStop(.73, '#37758f'); ocean.addColorStop(1, '#2b526e'); ctx.fillStyle = ocean; ctx.fillRect(0, waterline, width, height);
  // Shafts of sunlight.
  ctx.save(); ctx.beginPath(); ctx.rect(0, waterline, width, height - waterline); ctx.clip();
  for (let i = 0; i < 5; i++) { const x = width * (.04 + i * .24); path([[x, waterline], [x + 26, waterline], [x + width * .2, height], [x + width * .09, height]], '#d1f5e509'); }
  for (let layer = 1; layer < 5; layer++) { const y = height * (.31 + layer * .128); ctx.strokeStyle = '#c8eee212'; ctx.lineWidth = 1; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); } ctx.setLineDash([]);
  for (let i = 0; i < 22; i++) { const x = ((i * 47.3 + 14) % width), y = waterline + ((i * 83 + (reducedMotion ? 0 : -t * (6 + i % 5))) % (height - waterline) + height - waterline) % (height - waterline); ctx.strokeStyle = '#b2dedb35'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3, 0, Math.PI * 2); ctx.stroke(); }
  // Seagrass and coral on the seabed.
  for (let i = 0; i < 14; i++) { const x = i < 7 ? i * 13 : width - (i - 7) * 13; ctx.strokeStyle = i % 2 ? '#4d888575' : '#62999060'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, height + 5); ctx.bezierCurveTo(x - 11, height - 25, x + 14 + Math.sin(t + i) * 3, height - 34, x + 3, height - 48 - i % 4 * 9); ctx.stroke(); }
  for (let i = 0; i < 6; i++) ellipse(width * (.09 + i * .17), height + 4, 25 + i % 3 * 8, 12 + i % 2 * 3, '#285369');
  for (const fish of game.fish) { const y = fish.y * height + Math.sin(t * 2 + fish.phase) * (reducedMotion ? 0 : 3); drawFish(fish, fish.x * width, y); }
  ctx.restore();
  // Surface ripples.
  ctx.strokeStyle = '#e2f1d877'; ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) { const x = i * width / 9; ctx.beginPath(); ctx.moveTo(x, waterline + Math.sin(t + i) * 2); ctx.quadraticCurveTo(x + 16, waterline + 5, x + 32, waterline + Math.cos(t + i) * 2); ctx.stroke(); }
  const rod = drawBoat(t);
  const hookX = game.hook.x * width, hookY = game.hook.y * height;
  ctx.strokeStyle = '#f9f8dbb0'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(rod.x, rod.y); ctx.quadraticCurveTo((rod.x + hookX) / 2, rod.y + 40, hookX, hookY); ctx.stroke();
  if (game.hook.catch) drawFish(game.hook.catch, hookX, hookY + 10, true);
  ctx.strokeStyle = '#fff3c7'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hookX, hookY - 6); ctx.lineTo(hookX, hookY + 5); ctx.arc(hookX + 4, hookY + 5, 4, Math.PI, 0, true); ctx.lineTo(hookX + 8, hookY + 1); ctx.stroke();
  ellipse(hookX, height * .314, 3, 4, '#f1cc78');
  if (game.hook.state === 'dropping') { ctx.strokeStyle = '#fff4cc30'; ctx.setLineDash([2, 5]); ctx.beginPath(); ctx.moveTo(hookX, hookY + 15); ctx.lineTo(hookX, Math.min(height * .98, hookY + 50)); ctx.stroke(); ctx.setLineDash([]); }
  for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; if (game.mode === 'playing') { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .25 * dt; } if (p.life <= 0) { particles.splice(i, 1); continue; } ctx.globalAlpha = p.life; ellipse(p.x * width, p.y * height, 3, 3, p.color); ctx.globalAlpha = 1; }
}
function frame(now) {
  const dt = Math.min((now - lastTime) / 1000 || 0, .05); lastTime = now;
  if (inGame && game.mode !== 'paused' && game.mode !== 'ended') frameTime += dt;
  if (inGame) game.tick(dt);
  game.drainEvents().forEach(onEvent);
  if (inGame && now - lastUI >= 100) { updateUI(); lastUI = now; }
  if (inGame) draw(frameTime, dt);
  if (now > announcementUntil) $('announcement').classList.remove('visible');
  requestAnimationFrame(frame);
}
resize(); updateUI(); requestAnimationFrame(frame);
