const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export class AirHockey {
  constructor({
    goal = 5,
    bot = true,
    easy = false,
    random = Math.random,
  } = {}) {
    if (![3, 5, 7].includes(goal))
      throw Error("Pilih target 3, 5, atau 7 gol.");
    Object.assign(this, {
      goal,
      bot,
      easy,
      random,
      scores: [0, 0],
      winner: null,
      serveRemaining: 1,
      paddles: [
        { x: 300, y: 760 },
        { x: 300, y: 140 },
      ],
      puck: { x: 300, y: 450, vx: 0, vy: 0 },
      server: 0,
    });
  }
  move(player, x, y) {
    if (
      this.winner !== null ||
      ![0, 1].includes(player) ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
      return false;
    this.paddles[player].x = clamp(x, 34, 566);
    this.paddles[player].y = clamp(
      y,
      player === 0 ? 484 : 34,
      player === 0 ? 866 : 416,
    );
    return true;
  }
  score(player) {
    if (this.winner !== null) return;
    this.scores[player]++;
    if (this.scores[player] >= this.goal) this.winner = player;
    this.puck = { x: 300, y: 450, vx: 0, vy: 0 };
    this.server = 1 - player;
    this.serveRemaining = 1;
  }
  tick(dt) {
    if (this.winner !== null || !(dt > 0)) return;
    const steps = Math.ceil(Math.min(dt, 0.1) / 0.008),
      step = Math.min(dt, 0.1) / steps;
    for (let i = 0; i < steps; i++) {
      if (this.serveRemaining > 0) {
        this.serveRemaining = Math.max(0, this.serveRemaining - step);
        if (!this.serveRemaining) {
          this.puck.vx = (this.random() - 0.5) * 180;
          this.puck.vy = this.server === 0 ? -400 : 400;
        }
        continue;
      }
      const p = this.puck;
      if (this.bot) {
        const bot = this.paddles[1],
          speed = (this.easy ? 220 : 370) * step;
        const targetY = p.y < 360 ? clamp(p.y - 35, 65, 290) : 140;
        bot.x += clamp(p.x - bot.x, -speed, speed);
        bot.y += clamp(targetY - bot.y, -speed, speed);
      }
      p.x += p.vx * step;
      p.y += p.vy * step;
      if (p.x < 16) {
        p.x = 16;
        p.vx = Math.abs(p.vx);
      }
      if (p.x > 584) {
        p.x = 584;
        p.vx = -Math.abs(p.vx);
      }
      if (p.y < 16) {
        if (p.x > 200 && p.x < 400) {
          this.score(0);
          continue;
        }
        p.y = 16;
        p.vy = Math.abs(p.vy);
      }
      if (p.y > 884) {
        if (p.x > 200 && p.x < 400) {
          this.score(1);
          continue;
        }
        p.y = 884;
        p.vy = -Math.abs(p.vy);
      }
      for (const paddle of this.paddles) {
        let dx = p.x - paddle.x,
          dy = p.y - paddle.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= 50) continue;
        if (!distance) {
          dx = 0;
          dy = paddle.y > 450 ? -1 : 1;
        }
        const norm = Math.hypot(dx, dy),
          nx = dx / norm,
          ny = dy / norm;
        p.x = paddle.x + nx * 51;
        p.y = paddle.y + ny * 51;
        const dot = p.vx * nx + p.vy * ny;
        if (dot < 0) {
          p.vx -= 2 * dot * nx;
          p.vy -= 2 * dot * ny;
        }
        p.vx += nx * 65;
        p.vy += ny * 65;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 850) {
          p.vx *= 850 / speed;
          p.vy *= 850 / speed;
        }
      }
    }
  }
}
