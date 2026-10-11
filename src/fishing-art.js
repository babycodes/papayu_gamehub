import { drawBossCharacter } from "./boss-art.js";
// Painted vector animals. Uses the game's single animation clock; no textures,
// downloads, extra timers, or per-animal animation loops.
export function drawFishingAnimal(ctx, fish, size, pose, spooky = false) {
  if (fish.boss) return drawBossCharacter(ctx, fish, size, pose, spooky);
  ctx.save();
  ctx.scale(size * pose.breathe, size * pose.breathe);
  ctx.rotate(pose.sway);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const color = fish.color || "#bce7c5",
    accent = fish.accent || "#76b5a0";
  const paint = (light = color, dark = accent) => {
    const g = ctx.createLinearGradient(-0.3, -0.6, 0.25, 0.65);
    g.addColorStop(0, light);
    g.addColorStop(1, dark);
    return g;
  };
  const oval = (x, y, rx, ry, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  const curve = (start, curves, fill) => {
    ctx.beginPath();
    ctx.moveTo(...start);
    for (const points of curves) ctx.bezierCurveTo(...points);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const stroke = (start, curves, width, fill) => {
    ctx.beginPath();
    ctx.moveTo(...start);
    for (const points of curves) ctx.bezierCurveTo(...points);
    ctx.strokeStyle = fill;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  const fin = (x, y, angle, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    curve(
      [0, 0],
      [
        [-0.2, 0.08, -0.58, 0.5, -0.16, 0.42],
        [0.13, 0.32, 0.23, 0.13, 0, 0],
      ],
      paint(),
    );
    stroke(
      [-0.08, 0.12],
      [[-0.13, 0.21, -0.17, 0.25, -0.24, 0.31]],
      0.018,
      "#ffffff45",
    );
    ctx.restore();
  };
  const tail = () => {
    ctx.save();
    ctx.translate(-0.74, 0);
    ctx.rotate(pose.tail);
    curve(
      [0, 0],
      [
        [-0.13, -0.04, -0.57, -0.57, -0.57, -0.3],
        [-0.5, -0.03, -0.5, 0.03, -0.57, 0.3],
        [-0.57, 0.57, -0.13, 0.04, 0, 0],
      ],
      paint(),
    );
    stroke(
      [-0.13, 0],
      [[-0.25, -0.03, -0.34, -0.13, -0.43, -0.19]],
      0.018,
      "#ffffff65",
    );
    ctx.restore();
  };
  const star = (x, y, r, fill) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        radius = r * (i % 2 ? 0.52 : 1);
      return [x + Math.cos(a) * radius, y + Math.sin(a) * radius];
    });
    ctx.beginPath();
    const middle = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    ctx.moveTo(...middle(pts[9], pts[0]));
    pts.forEach((p, i) =>
      ctx.quadraticCurveTo(...p, ...middle(p, pts[(i + 1) % 10])),
    );
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const eye = (x, y, r) => {
    const h = r * pose.blink;
    oval(x, y, r, h, "#fffdf5");
    oval(x + r * 0.18, y, r * 0.43, h * 0.7, "#233e52");
    if (pose.blink > 0.5)
      oval(x + r * 0.1, y - h * 0.25, r * 0.14, h * 0.15, "#ffffff");
  };
  let ex = 0.58,
    ey = -0.11;
  const kind = fish.kind;
  if (fish.bonus) {
    ctx.rotate(pose.limb);
    oval(0, 0, 0.65, 0.65, paint("#fff1a8", "#e0ae46"));
    oval(0, 0, 0.5, 0.5, "#fffdf0");
    for (let i = 0; i < 12; i++)
      oval(
        Math.sin((i * Math.PI) / 6) * 0.4,
        Math.cos((i * Math.PI) / 6) * 0.4,
        0.022,
        0.022,
        "#c7a562",
      );
    stroke([0, -0.27], [[0, -0.14, 0, -0.03, 0, 0]], 0.05, "#966e3b");
    ctx.save();
    ctx.rotate(pose.time * 0.8);
    stroke([0, 0], [[0.07, 0, 0.16, 0, 0.25, 0]], 0.04, "#966e3b");
    ctx.restore();
  } else if (fish.special) {
    ctx.rotate(pose.limb * 0.4);
    star(0, 0, 1.05, paint("#fff6af", "#e5ab40"));
    star(-0.08, -0.12, 0.65, "#fff8ca55");
    eye(-0.18, -0.05, 0.095);
    eye(0.18, -0.05, 0.095);
    stroke(
      [-0.1, 0.12],
      [[-0.02, 0.21, 0.05, 0.21, 0.12, 0.12]],
      0.035,
      "#9c7338",
    );
    for (let i = 0; i < 3; i++)
      star(
        Math.cos(pose.time + i * 2.1) * 1.02,
        Math.sin(pose.time + i * 2.1) * 0.8,
        0.055,
        "#fff8c7",
      );
  } else {
    if (["fish", "shark", "whale", "puffer", "crocodile"].includes(kind))
      tail();
    if (kind === "puffer") {
      for (let i = 0; i < 14; i++) {
        const a = (i * Math.PI) / 7;
        oval(Math.cos(a) * 0.79, Math.sin(a) * 0.69, 0.062, 0.067, accent);
      }
      oval(0, 0, 0.81, 0.72, paint());
      oval(0.09, 0.23, 0.58, 0.3, "#fff3ce9a");
      for (const [x, y] of [
        [-0.35, -0.28],
        [0, -0.42],
        [0.25, -0.33],
        [-0.48, 0.02],
        [0.08, -0.12],
      ])
        oval(x, y, 0.05, 0.04, accent);
      fin(-0.36, 0.14, pose.limb * 2, 0.55);
      ex = 0.44;
    } else {
      const whale = kind === "whale",
        shark = kind === "shark";
      ctx.save();
      ctx.rotate(pose.limb * 0.18);
      curve(
        [-0.32, -0.21],
        [
          [-0.12, -0.42, -0.08, -0.8, 0.03, -0.72],
          [0.06, -0.42, 0.3, -0.26, 0.32, -0.23],
        ],
        paint(),
      );
      ctx.restore();
      oval(0, 0, 1, whale ? 0.5 : shark ? 0.41 : 0.53, paint());
      oval(0.13, 0.17, 0.73, 0.2, "#fff7e577");
      fin(-0.19, 0.16, pose.limb, whale ? 1 : 0.75);
      if (whale)
        for (let row = 0; row < 3; row++)
          for (let i = 0; i < 6; i++)
            oval(i * 0.22 - 0.65, row * 0.14 - 0.3, 0.026, 0.023, "#f5fcffb0");
      if (shark)
        for (let i = 0; i < 3; i++)
          stroke(
            [0.13 + i * 0.09, -0.16],
            [
              [
                0.1 + i * 0.09,
                -0.05,
                0.1 + i * 0.09,
                0.06,
                0.14 + i * 0.09,
                0.1,
              ],
            ],
            0.025,
            accent,
          );
    }
    oval(-0.19, -0.19, 0.24, 0.055, "#ffffff22");
    eye(ex, ey, 0.11);
    const mx = ex + 0.13,
      my = ey + 0.22;

    stroke(
      [mx - 0.08, my],
      [[mx - 0.03, my + 0.08, mx + 0.05, my + 0.08, mx + 0.1, my]],
      0.023,
      "#39536a",
    );
    oval(ex - 0.06, ey + 0.15, 0.08, 0.035, "#f3b6ad70");
  }
  ctx.restore();
}
