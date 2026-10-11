import { Group, Tween, Easing } from "@tweenjs/tween.js";

// One clock shared with the game: no extra animation loop or background timers.
export class FishingMotion {
  constructor(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
    this.group = new Group();
    this.channels = new Map();
    this.reset();
  }
  reset() {
    this.group.removeAll();
    this.channels.clear();
    this.time = 0;
    this.boss = null;
    this.state = {
      sea: 0,
      presence: 0,
      recoil: 0,
      friendly: 0,
      celebration: 0,
    };
  }
  transition(channel, values, duration = 700) {
    const previous = this.channels.get(channel);
    if (previous) {
      previous.stop();
      this.group.remove(previous);
      this.channels.delete(channel);
    }
    if (this.reducedMotion) {
      Object.assign(this.state, values);
      return;
    }
    const tween = new Tween(this.state, this.group)
      .to(values, duration)
      .easing(Easing.Cubic.Out)
      .start(this.time);
    tween.onComplete(() => {
      this.group.remove(tween);
      if (this.channels.get(channel) === tween) this.channels.delete(channel);
    });
    this.channels.set(channel, tween);
  }
  handle(event) {
    if (event.type === "boss-warning") {
      this.boss = event.boss;
      this.state.friendly = 0;
      this.state.celebration = 0;
      this.transition("sea", { sea: 1 }, 1700);
    }
    if (event.type === "boss-arrived") {
      this.boss = event.boss;
      this.state.presence = 0;
      this.transition("presence", { presence: 1 }, 650);
    }
    if (
      (event.type === "hooked" && event.fish.boss) ||
      event.type === "fight-stage"
    ) {
      this.state.recoil = 1;
      this.transition("recoil", { recoil: 0 }, 500);
    }
    if (event.type === "fight-won" && event.fish.boss)
      this.transition("friendly", { friendly: 1 }, 500);
    if (event.type === "sea-return") {
      this.transition("sea", { sea: 0 }, 1100);
      this.transition("presence", { presence: 0 }, 450);
      if (event.caught && !this.reducedMotion) {
        this.state.celebration = 1;
        this.transition("celebration", { celebration: 0 }, 1300);
      }
    }
    if (event.type === "end") this.reset();
  }
  update(dt, playing) {
    if (!playing || !Number.isFinite(dt) || dt <= 0) return;
    this.time += Math.min(dt, 0.05) * 1000;
    this.group.update(this.time);
  }
  setReducedMotion(value) {
    this.reducedMotion = !!value;
    if (value) {
      for (const tween of this.group.getAll()) tween.end();
      this.group.removeAll();
      this.channels.clear();
      this.state.recoil = 0;
      this.state.celebration = 0;
    }
  }
  pose(fish, fight) {
    const t = this.reducedMotion ? 0 : this.time / 1000;
    return {
      time: t,
      breathe: this.reducedMotion ? 1 : 1 + Math.sin(t * 2.1) * 0.012,
      sway: this.reducedMotion
        ? 0
        : Math.sin(t * 1.8) * 0.018 + this.state.recoil * 0.04,
      limb: this.reducedMotion ? 0 : Math.sin(t * 2.4) * 0.1,
      blink: this.reducedMotion
        ? 1
        : (t + (fish.index || 0) * 0.23) % 4.7 < 0.13
          ? 0.15
          : 1,
      anger: Math.max(0, Math.min(1, (fight?.stage || 0) / 2)),
      friendly: this.state.friendly,
      presence: Math.max(0, Math.min(1, this.state.presence)),
    };
  }
}
export function mixColor(from, to, amount) {
  const t = Math.max(0, Math.min(1, amount));
  const a = parseInt(from.slice(1), 16),
    b = parseInt(to.slice(1), 16);
  const mix = (shift) =>
    Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return `rgb(${mix(16)}, ${mix(8)}, ${mix(0)})`;
}
export function bossSea(boss, cute = false) {
  if (cute) return ["#83caba", "#4b9da9", "#496b91"];
  const palettes = {
    crocodile: ["#507f72", "#245c59", "#173843"],
    octopus: ["#9269a5", "#593e7d", "#282443"],
    crab: ["#b87567", "#795462", "#392c43"],
    turtle: ["#6c9587", "#37615d", "#203a45"],
    ray: ["#7797af", "#4a5d8e", "#242b50"],
    whale: ["#758eab", "#465585", "#252842"],
    shark: ["#678899", "#3b5268", "#1e2f42"],
    serpent: ["#ad727e", "#705273", "#352a48"],
    angler: ["#758b8b", "#435e69", "#263b4c"],
  };
  return palettes[boss?.kind] || palettes.whale;
}
