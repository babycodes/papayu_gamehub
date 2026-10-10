export const LAYERS = [
  { name: 'Ikan kecil', points: 10, color: '#bce7c5', accent: '#76b5a0', size: 18 },
  { name: 'Ikan kuning', points: 25, color: '#ffe5a0', accent: '#dbad58', size: 23 },
  { name: 'Ikan karang', points: 40, color: '#f9b8a6', accent: '#d4887e', size: 27 },
  { name: 'Ikan besar', points: 75, color: '#a9d4e3', accent: '#6b9fb7', size: 34 },
  { name: 'Ikan bulan', points: 150, color: '#c8b8f1', accent: '#9284c0', size: 29 },
];
export class FishingGame {
  constructor(random = Math.random) { this.random = random; this.reset('ready'); }
  reset(mode = 'playing') {
    this.mode = mode; this.remaining = 90; this.elapsed = 0; this.score = 0; this.count = 0;
    this.combo = 1; this.lastCatchAt = -Infinity; this.bestCombo = 1; this.rareCount = 0;
    this.nextBonus = 17; this.frenzy = false; this.lastFrenzy = false; this.events = [];
    this.hook = { x: .47, targetX: .47, y: .305, state: 'idle', catch: null };
    this.fish = []; this.id = 0;
    for (let layer = 0; layer < 5; layer++) for (let i = 0; i < (layer < 2 ? 4 : layer < 4 ? 3 : 2); i++) this.spawn(layer, true);
  }
  spawn(layer, initial = false, bonus = false, special = false) {
    const direction = this.random() < .5 ? 1 : -1;
    const species = bonus ? { name: 'Bonus waktu', points: 0, color: '#f9e19c', accent: '#cba151', size: 20 } : special ? { ...LAYERS[4], name: 'Bintang laut ajaib', points: 200, color: '#ffe8a5', accent: '#d6b15d' } : LAYERS[layer];
    const fish = { ...species, id: ++this.id, layer, bonus, special, x: initial ? .08 + this.random() * .78 : direction > 0 ? -.08 : 1.08, y: .365 + layer * .128 + this.random() * .067, direction, speed: (.025 + this.random() * .025) * (layer === 4 ? .7 : 1), phase: this.random() * Math.PI * 2, expires: bonus ? this.elapsed + 13 : Infinity };
    this.fish.push(fish); return fish;
  }
  press(x) {
    if (this.mode !== 'playing') return;
    if (x !== undefined) this.aim(x);
    if (this.hook.state === 'idle') this.hook.state = 'dropping';
  }
  aim(x) { this.hook.targetX = Math.max(.06, Math.min(.84, x)); }
  release() { if (this.mode === 'playing' && this.hook.state === 'dropping') this.hook.state = 'reeling'; }
  pause() { if (this.mode === 'playing') { this.release(); this.mode = 'paused'; } }
  resume() { if (this.mode === 'paused') this.mode = 'playing'; }
  tick(dt) {
    if (this.mode !== 'playing') return;
    dt = Math.min(Math.max(dt, 0), .05);
    this.elapsed += dt; this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining <= 0) { this.mode = 'ended'; this.hook.state = 'idle'; this.hook.catch = null; this.events.push({ type: 'end' }); return; }
    const cycle = this.elapsed % 25;
    this.frenzy = this.elapsed >= 25 && cycle < 8;
    if (this.frenzy && !this.lastFrenzy) {
      this.events.push({ type: 'frenzy' }); this.spawn(4, true, false, true);
    }
    this.lastFrenzy = this.frenzy;
    if (this.elapsed >= this.nextBonus) { this.nextBonus += 22; this.spawn(2, true, true); this.events.push({ type: 'bonus-spawn' }); }
    if (this.elapsed - this.lastCatchAt > 8) this.combo = 1;
    for (const fish of [...this.fish]) {
      fish.x += fish.direction * fish.speed * dt * (this.frenzy ? 1.4 : 1);
      if (fish.x > 1.12 || fish.x < -.12 || this.elapsed > fish.expires) {
        this.fish.splice(this.fish.indexOf(fish), 1);
        if (!fish.bonus && !fish.special) this.spawn(fish.layer);
      }
    }
    const hook = this.hook;
    hook.x += (hook.targetX - hook.x) * Math.min(1, dt * 8);
    if (hook.state === 'dropping') {
      hook.y = Math.min(.973, hook.y + dt * .235);
      // Match visible fish and hook using normalized elliptical hit areas.
      const catchable = this.fish.find(f => Math.abs(f.x - hook.x) < (f.size / 950 + .015) && Math.abs(f.y - hook.y) < .026);
      if (catchable) {
        hook.catch = catchable; this.fish.splice(this.fish.indexOf(catchable), 1);
        hook.state = 'reeling'; this.events.push({ type: 'hooked', fish: catchable });
      } else if (hook.y >= .973) hook.state = 'reeling';
    } else if (hook.state === 'reeling') {
      hook.y = Math.max(.305, hook.y - dt * (hook.catch ? .35 : .52));
      if (hook.y <= .305) {
        const fish = hook.catch;
        if (fish) {
          if (fish.bonus) { this.remaining += 12; this.events.push({ type: 'bonus', seconds: 12 }); }
          else {
            this.combo = this.elapsed - this.lastCatchAt <= 8 ? Math.min(4, this.combo + 1) : 1;
            this.lastCatchAt = this.elapsed; this.bestCombo = Math.max(this.bestCombo, this.combo);
            const points = fish.points * this.combo * (this.frenzy ? 2 : 1);
            this.score += points; this.count++; if (fish.layer === 4) this.rareCount++;
            this.events.push({ type: 'catch', fish, points, combo: this.combo });
          }
          if (!fish.bonus && !fish.special) this.spawn(fish.layer);
        } else this.events.push({ type: 'miss' });
        hook.catch = null; hook.state = 'idle';
      }
    }
  }
  drainEvents() { const events = this.events; this.events = []; return events; }
}
