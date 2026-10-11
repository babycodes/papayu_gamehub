// Painted vector animals. Uses the game's single animation clock; no textures,
// downloads, extra timers, or per-animal animation loops.
export function drawFishingAnimal(ctx, fish, size, pose, spooky = false) {
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
  const eye = (x, y, r, monster = false) => {
    const h = r * pose.blink;
    oval(x, y, r, h, monster ? "#ffdc77" : "#fffdf5");
    oval(x + r * 0.18, y, r * (monster ? 0.21 : 0.43), h * 0.7, "#233e52");
    if (pose.blink > 0.5)
      oval(x + r * 0.1, y - h * 0.25, r * 0.14, h * 0.15, "#ffffff");
    if (monster)
      stroke(
        [x - r, y - r * 0.85],
        [
          [
            x - r * 0.2,
            y - r * 0.9,
            x + r * 0.5,
            y - r * 0.5,
            x + r,
            y - r * 0.4,
          ],
        ],
        0.035,
        accent,
      );
  };
  let ex = 0.58,
    ey = -0.11,
    faceFront = false;
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
    if (kind === "octopus") {
      for (let i = 0; i < 8; i++) {
        const x = (i / 7 - 0.5) * 1.25,
          wiggle = Math.sin(pose.time * 2.5 + i * 0.75) * 0.17;
        const curves = [[x, 0.37, x + wiggle, 0.82, x + 0.24 + wiggle, 0.56]];
        stroke([x * 0.65, 0.05], curves, 0.13, accent);
        stroke([x * 0.65, 0.05], curves, 0.07, color);
        for (let j = 0; j < 3; j++)
          oval(x + (wiggle * j) / 3, 0.2 + j * 0.13, 0.025, 0.017, "#ffebdf9a");
      }
      oval(0, -0.12, 0.64, 0.55, paint());
      ex = 0.18;
      ey = -0.07;
      faceFront = true;
      oval(-0.2, -0.41, 0.18, 0.07, "#ffffff35");
    } else if (kind === "crab") {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++)
          stroke(
            [side * 0.38, i * 0.13],
            [
              [
                side * 0.63,
                0.08 + i * 0.1,
                side * 0.82,
                0.24 + i * 0.1 + pose.limb,
                side * 0.95,
                0.13 + i * 0.1,
              ],
            ],
            0.07,
            accent,
          );
        stroke(
          [side * 0.4, -0.08],
          [
            [
              side * 0.65,
              -0.3,
              side * 0.75,
              -0.25 + pose.limb,
              side * 0.8,
              -0.4 + pose.limb,
            ],
          ],
          0.09,
          accent,
        );
        oval(side * 0.85, -0.43 + pose.limb, 0.23, 0.22, paint());
        stroke(
          [side * 0.87, -0.64 + pose.limb],
          [[side * 0.91, -0.54, side * 0.86, -0.48, side * 0.8, -0.45]],
          0.03,
          accent,
        );
      }
      oval(0, 0, 0.65, 0.36, paint());
      ex = 0.2;
      ey = -0.18;
      faceFront = true;
    } else if (kind === "turtle") {
      for (const side of [-1, 1]) {
        fin(side * 0.5, 0.1, side * (0.6 + pose.limb), 0.9);
        oval(side * 0.4, -0.3, 0.27, 0.12, accent);
      }
      oval(0, 0, 0.72, 0.45, accent);
      oval(-0.06, -0.05, 0.59, 0.35, paint());
      for (let i = -1; i <= 1; i++)
        stroke(
          [i * 0.24, -0.3],
          [[i * 0.17, -0.15, i * 0.17, 0.15, i * 0.24, 0.27]],
          0.025,
          "#ffffff55",
        );
      stroke(
        [-0.56, -0.03],
        [[-0.2, -0.12, 0.2, -0.12, 0.5, -0.03]],
        0.025,
        "#ffffff55",
      );
      oval(0.76, -0.03, 0.28, 0.24, paint());
      ex = 0.81;
      ey = -0.08;
    } else if (kind === "ray") {
      stroke(
        [-0.35, 0.12],
        [[-0.55, 0.35, -0.84, 0.63 + pose.limb, -1.04, 0.57]],
        0.045,
        accent,
      );
      curve(
        [0.83, 0],
        [
          [0.38, -0.16, 0.13, -0.49, -0.6, -0.64 - pose.limb],
          [-0.83, -0.52, -0.55, -0.15, -0.54, 0],
          [-0.55, 0.15, -0.83, 0.52, -0.6, 0.64 + pose.limb],
          [0.13, 0.49, 0.38, 0.16, 0.83, 0],
        ],
        paint(),
      );
      oval(0.12, 0, 0.44, 0.19, "#ffffff25");
      ex = 0.48;
      ey = -0.055;
    } else if (kind === "serpent") {
      const curls = [
        [0, -0.35, -0.36, 0.42, -0.7, 0.2],
        [-1, 0, -0.68, -0.46, -0.96, -0.31 + pose.limb],
      ];
      stroke([0.6, -0.1], curls, 0.3, accent);
      stroke([0.6, -0.1], curls, 0.21, paint());
      oval(0.53, -0.08, 0.37, 0.25, paint());
      fin(0.2, 0.08, pose.limb, 0.7);
      ex = 0.65;
      ey = -0.14;
    } else if (kind === "angler") {
      tail();
      oval(0, 0, 0.73, 0.53, paint());
      stroke(
        [0.17, -0.38],
        [[0.14, -0.95, 0.57, -0.99, 0.71, -0.63 + pose.limb]],
        0.04,
        accent,
      );
      oval(0.71, -0.63 + pose.limb, 0.19, 0.19, "#ffe99d35");
      oval(0.71, -0.63 + pose.limb, 0.105, 0.105, "#fff2a7");
      fin(-0.2, 0.26, pose.limb, 0.9);
      ex = 0.44;
      ey = -0.11;
    } else if (kind === "puffer") {
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
    } else if (kind === "crocodile") {
      for (let i = 0; i < 6; i++)
        oval(-0.64 + i * 0.2, -0.25, 0.09, 0.1, accent);
      oval(-0.16, 0, 0.87, 0.32, paint());
      curve(
        [0.27, -0.14],
        [
          [0.66, -0.18, 1.09, -0.17, 1.12, -0.04],
          [1.23, 0.2, 0.58, 0.25, 0.29, 0.16],
        ],
        paint(),
      );
      oval(0.43, -0.21, 0.19, 0.18, paint());
      fin(-0.35, 0.2, pose.limb, 0.5);
      fin(0.3, 0.2, -pose.limb, 0.45);
      for (let i = 0; i < 3; i++)
        oval(-0.38 + i * 0.21, -0.09, 0.045, 0.025, "#ffffff40");
      oval(1.02, -0.025, 0.025, 0.025, accent);
      ex = 0.47;
      ey = -0.23;
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
    const monster = fish.boss && spooky && pose.friendly < 0.5;
    eye(ex, ey, fish.boss ? 0.1 : 0.11, monster);
    if (faceFront) eye(-ex, ey, 0.1, monster);
    if (monster && fish.index >= 9)
      eye(faceFront ? 0 : ex - 0.23, ey - 0.18, 0.07, true);
    const mx = faceFront ? 0 : ex + 0.13,
      my = faceFront ? 0.14 : ey + 0.22;
    if (monster) {
      oval(
        mx,
        my,
        faceFront ? 0.19 : 0.16,
        0.08 + pose.anger * 0.035,
        "#28334f",
      );
      for (const side of [-1, 1])
        curve(
          [mx + side * 0.09 - 0.025, my - 0.045],
          [
            [
              mx + side * 0.09 - 0.02,
              my + 0.04,
              mx + side * 0.09 + 0.02,
              my + 0.04,
              mx + side * 0.09 + 0.025,
              my - 0.045,
            ],
          ],
          "#fff3da",
        );
    } else {
      stroke(
        [mx - 0.08, my],
        [[mx - 0.03, my + 0.08, mx + 0.05, my + 0.08, mx + 0.1, my]],
        0.023,
        "#39536a",
      );
      oval(ex - 0.06, ey + 0.15, 0.08, 0.035, "#f3b6ad70");
    }
    if (fish.hybrid === "tentacles")
      for (let i = 0; i < 3; i++)
        stroke(
          [-0.35 + i * 0.3, 0.22],
          [
            [
              -0.65 + i * 0.35,
              0.4,
              -0.55 + i * 0.4,
              0.75,
              -0.25 + i * 0.4 + pose.limb,
              0.58,
            ],
          ],
          0.07,
          accent,
        );
    if (fish.hybrid === "horns")
      for (const side of [-1, 1])
        curve(
          [side * 0.1, -0.42],
          [
            [side * 0.3, -0.5, side * 0.4, -0.76, side * 0.35, -0.82],
            [side * 0.21, -0.71, side * 0.2, -0.5, side * 0.1, -0.42],
          ],
          paint("#fff3c4", accent),
        );
    if (fish.hybrid === "fins") {
      fin(-0.4, -0.1, 2.7 + pose.limb, 0.8);
      fin(0.1, 0.23, pose.limb, 0.8);
    }
    if (fish.hybrid === "stars")
      for (let i = 0; i < 3; i++)
        star(-0.45 + i * 0.23, -0.16 + Math.sin(i) * 0.12, 0.065, "#fff5bf");
  }
  ctx.restore();
}
