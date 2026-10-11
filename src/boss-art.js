import { getStroke } from "perfect-freehand";

// A small vector rig for thirteen coherent silhouettes. Organic strokes are sampled
// with a fixed point budget, regardless of score or encounter count.
export function drawBossCharacter(ctx, fish, size, pose, spooky) {
  const color = fish.color,
    accent = fish.accent,
    tier = fish.tier || 0;
  const monster = spooky && pose.friendly < 0.5;
  const t = pose.time,
    wave = pose.limb;
  ctx.save();
  ctx.scale(size * pose.breathe, size * pose.breathe);
  ctx.rotate(pose.sway);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const gradient = (light = color, dark = accent) => {
    const g = ctx.createLinearGradient(-0.3, -0.7, 0.3, 0.65);
    g.addColorStop(0, light);
    g.addColorStop(1, dark);
    return g;
  };
  const oval = (x, y, rx, ry, fill) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const shape = (start, curves, fill, outline = true) => {
    ctx.beginPath();
    ctx.moveTo(...start);
    for (const curve of curves) ctx.bezierCurveTo(...curve);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 0.018;
      ctx.stroke();
    }
  };
  const line = (start, curves, width, fill) => {
    ctx.beginPath();
    ctx.moveTo(...start);
    for (const curve of curves) ctx.bezierCurveTo(...curve);
    ctx.strokeStyle = fill;
    ctx.lineWidth = width;
    ctx.stroke();
  };
  const sample = (start, curves) => {
    const points = [start];
    let a = start;
    for (const c of curves) {
      for (let i = 1; i <= 16; i++) {
        const u = i / 16,
          v = 1 - u;
        points.push([
          v * v * v * a[0] +
            3 * v * v * u * c[0] +
            3 * v * u * u * c[2] +
            u * u * u * c[4],
          v * v * v * a[1] +
            3 * v * v * u * c[1] +
            3 * v * u * u * c[3] +
            u * u * u * c[5],
        ]);
      }
      a = [c[4], c[5]];
    }
    return points;
  };
  const organic = (start, curves, width, fill, taper = 0.3) => {
    // Work at 100 units: the library's smoothing thresholds are in pixels.
    const points = sample(start, curves),
      outline = getStroke(
        points.map(([x, y]) => [x * 100, y * 100, 0.5]),
        {
          size: width * 100,
          thinning: 0,
          smoothing: 0.6,
          streamline: 0,
          simulatePressure: false,
          last: true,
          end: { taper: taper * 100 },
        },
      );
    ctx.beginPath();
    const last = outline.at(-1),
      first = outline[0];
    ctx.moveTo((last[0] + first[0]) / 200, (last[1] + first[1]) / 200);
    outline.forEach(([x, y], i) => {
      const next = outline[(i + 1) % outline.length];
      ctx.quadraticCurveTo(
        x / 100,
        y / 100,
        (x + next[0]) / 200,
        (y + next[1]) / 200,
      );
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    return points;
  };
  const flipper = (x, y, angle, s = 0.7) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(s, s);
    shape(
      [0, 0],
      [
        [-0.22, 0.03, -0.5, 0.43, -0.31, 0.43],
        [-0.06, 0.43, 0.13, 0.22, 0, 0],
      ],
      gradient(),
    );
    line(
      [-0.06, 0.07],
      [[-0.12, 0.15, -0.19, 0.26, -0.25, 0.31]],
      0.018,
      "#ffffff50",
    );
    ctx.restore();
  };
  const tail = () => {
    ctx.save();
    ctx.translate(-0.7, 0);
    ctx.rotate(pose.tail);
    if (fish.hybrid === "tentacles") {
      for (const side of [-1, 0, 1])
        organic(
          [0, side * 0.06],
          [[-0.16, side * 0.15, -0.52, side * 0.38 + wave, -0.55, side * 0.2]],
          0.09,
          gradient(),
          0.18,
        );
      ctx.restore();
      return;
    }
    shape(
      [0, 0],
      [
        [-0.23, -0.04, -0.5, -0.5, -0.55, -0.33],
        [-0.49, -0.1, -0.49, 0.1, -0.55, 0.33],
        [-0.5, 0.5, -0.23, 0.04, 0, 0],
      ],
      gradient(),
    );
    ctx.restore();
  };
  const horn = (x, y, side, height = 0.28) =>
    shape(
      [x, y],
      [
        [
          x + side * 0.16,
          y - 0.02,
          x + side * 0.22,
          y - height,
          x + side * 0.14,
          y - height,
        ],
        [x + side * 0.08, y - height * 0.55, x + side * 0.07, y - 0.05, x, y],
      ],
      gradient("#ffecc0", accent),
    );
  let ex = 0.57,
    ey = -0.12,
    mx = 0.7,
    my = 0.13,
    front = false;
  const kind = fish.kind;
  if (kind === "seahorse") {
    organic(
      [0.14, -0.25],
      [
        [-0.35, -0.1, -0.46, 0.5, -0.06, 0.62],
        [0.39, 0.8, 0.49, 0.35, 0.17, 0.35],
        [0.02, 0.35, 0.06, 0.53, 0.21, 0.5],
      ],
      0.32,
      gradient(),
      0.1,
    );
    flipper(-0.2, -0.05, -0.8 + wave, 0.7);
    shape(
      [-0.13, -0.3],
      [
        [-0.3, -0.76, 0.13, -0.84, 0.4, -0.57],
        [0.57, -0.59, 0.77, -0.43, 0.69, -0.34],
        [0.45, -0.27, 0.38, -0.27, 0.27, -0.16],
        [0.05, -0.08, -0.08, -0.17, -0.13, -0.3],
      ],
      gradient(),
    );
    for (let i = 0; i < 4; i++)
      horn(-0.16 + i * 0.045, -0.31 - i * 0.07, -1, 0.14);
    horn(0.09, -0.69, -1, 0.15);
    ex = 0.3;
    ey = -0.48;
    mx = 0.6;
    my = -0.35;
  } else if (kind === "kaiju") {
    organic(
      [-0.3, 0.1],
      [[-0.7, 0.14, -0.81, 0.48, -1.13, 0.32 + wave]],
      0.27,
      gradient(),
      0.42,
    );
    for (let i = 0; i < 5; i++)
      horn(-0.48 + i * 0.13, -0.09 - i * 0.07, -1, 0.19 + (i % 2) * 0.09);
    oval(-0.03, 0.1, 0.4, 0.5, gradient());
    oval(0.09, 0.18, 0.24, 0.34, "#e6f1b970");
    for (const side of [-1, 1]) {
      flipper(side * 0.29, 0.34, side * 0.65 + wave, 0.7);
      flipper(side * 0.26, -0.05, side * 0.95 - wave, 0.5);
    }
    shape(
      [-0.12, -0.22],
      [
        [-0.31, -0.57, -0.12, -0.78, 0.2, -0.68],
        [0.36, -0.68, 0.34, -0.4, 0.61, -0.37],
        [0.77, -0.28, 0.68, -0.12, 0.46, -0.13],
        [0.15, -0.03, -0.04, -0.11, -0.12, -0.22],
      ],
      gradient(),
    );
    ex = 0.24;
    ey = -0.46;
    mx = 0.5;
    my = -0.22;
  } else if (kind === "jellyfish") {
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * 0.17;
      organic(
        [x, 0.04],
        [[x + 0.12, 0.3, x - 0.13 + wave, 0.59, x + wave, 0.77]],
        0.065,
        gradient(),
        0.18,
      );
    }
    shape(
      [-0.68, 0.02],
      [
        [-0.64, -0.81, 0.63, -0.81, 0.68, 0.02],
        [0.43, 0.23, 0.25, -0.06, 0, 0.14],
        [-0.25, -0.06, -0.43, 0.23, -0.68, 0.02],
      ],
      gradient(),
    );
    oval(-0.23, -0.32, 0.18, 0.06, "#ffffff55");
    ex = 0.19;
    ey = -0.16;
    mx = 0;
    my = 0.04;
    front = true;
  } else if (kind === "hydra") {
    organic(
      [-0.59, 0.33],
      [[0.1, 0.53, 0.46, 0.3, 0.09, 0.02]],
      0.36,
      gradient(),
      0.3,
    );
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.4,
        y = -0.48 + (i % 2) * 0.12;
      organic(
        [0, 0.15],
        [[x - 0.2, -0.09, x - 0.18, y + 0.1, x, y]],
        0.17,
        gradient(),
        0.08,
      );
      oval(x + 0.07, y, 0.19, 0.14, gradient());
      horn(x, y - 0.1, -1, 0.17);
      if (i !== 2) {
        oval(x + 0.1, y - 0.03, 0.045, 0.045, "#ffe4a2");
        oval(x + 0.12, y - 0.03, 0.013, 0.033, "#18374a");
      }
    }
    flipper(-0.25, 0.24, -0.6 + wave, 0.6);
    ex = 0.57;
    ey = -0.51;
    mx = 0.57;
    my = -0.38;
  } else if (kind === "octopus") {
    for (let i = 0; i < 8; i++) {
      const x = (i / 7 - 0.5) * 1.2,
        swing = Math.sin(t * 2.2 + i * 0.75) * 0.12;
      const curves = [
        [x * 1.12, 0.33, x * 1.35 + swing, 0.8, x * 1.1 + swing, 0.6],
        [x * 1.04 + swing, 0.43, x * 0.8 + swing, 0.5, x * 0.78 + swing, 0.55],
      ];
      const points = organic([x * 0.6, 0.08], curves, 0.16, gradient(), 0.3);
      for (const j of [4, 7, 10]) {
        const p = points[j];
        oval(p[0] + 0.025, p[1], 0.018, 0.014, "#ffe9d594");
      }
    }
    shape(
      [-0.56, 0.08],
      [
        [-0.75, -0.4, -0.52, -0.8, 0, -0.76],
        [0.55, -0.8, 0.76, -0.4, 0.56, 0.08],
        [0.28, 0.29, -0.28, 0.29, -0.56, 0.08],
      ],
      gradient(),
    );
    oval(-0.19, -0.47, 0.19, 0.065, "#ffffff2f");
    if (fish.crest)
      line(
        [-0.32, -0.48],
        [[-0.08, -0.6, 0.18, -0.6, 0.35, -0.48]],
        0.04,
        "#fff4ba80",
      );
    if (fish.hybrid === "horns") {
      horn(-0.2, -0.63, -1, 0.18);
      horn(0.2, -0.63, 1, 0.18);
    }
    ex = 0.19;
    ey = -0.14;
    mx = 0;
    my = 0.1;
    front = true;
  } else if (kind === "crab") {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++)
        organic(
          [side * 0.44, i * 0.12 - 0.02],
          [
            [
              side * 0.68,
              0.01 + i * 0.13,
              side * 0.72,
              0.15 + i * 0.13 + wave,
              side * 0.94,
              0.11 + i * 0.14,
            ],
          ],
          0.07,
          accent,
          0.15,
        );
      line(
        [side * 0.42, -0.08],
        [
          [
            side * 0.67,
            -0.24,
            side * 0.67,
            -0.25 + wave,
            side * 0.77,
            -0.38 + wave,
          ],
        ],
        0.09,
        accent,
      );
      ctx.save();
      ctx.translate(side * 0.82, -0.4 + wave);
      ctx.scale(side, 1);
      shape(
        [-0.17, 0.14],
        [
          [-0.39, -0.14, -0.14, -0.5, 0.11, -0.33],
          [-0.01, -0.28, -0.08, -0.17, -0.02, -0.05],
          [0.04, -0.1, 0.07, -0.22, 0.2, -0.27],
          [0.4, -0.1, 0.29, 0.18, 0.06, 0.2],
        ],
        gradient(),
      );
      ctx.restore();
    }
    shape(
      [-0.63, 0.04],
      [
        [-0.68, -0.43, -0.3, -0.49, 0, -0.4],
        [0.32, -0.49, 0.7, -0.39, 0.63, 0.04],
        [0.55, 0.36, -0.55, 0.36, -0.63, 0.04],
      ],
      gradient(),
    );
    for (const side of [-1, 1])
      line(
        [side * 0.22, -0.15],
        [[side * 0.24, -0.25, side * 0.23, -0.31, side * 0.22, -0.34]],
        0.07,
        accent,
      );
    ex = 0.22;
    ey = -0.34;
    mx = 0;
    my = 0.04;
    front = true;
  } else if (kind === "turtle") {
    for (const side of [-1, 1]) {
      flipper(side * 0.48, 0.17, side * (0.8 + wave), 0.8);
      oval(side * 0.44, -0.26, 0.23, 0.12, gradient());
    }
    oval(0, 0, 0.7, 0.44, accent);
    oval(-0.03, -0.04, 0.61, 0.36, gradient());
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-0.03, -0.04, 0.56, 0.32, 0, 0, Math.PI * 2);
    ctx.clip();
    for (let row = -1; row <= 1; row++)
      for (let col = -2; col <= 2; col++) {
        const x = col * 0.25 + (row % 2 ? 0.125 : 0),
          y = row * 0.23;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = x + Math.cos(a) * 0.15,
            py = y + Math.sin(a) * 0.15;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = "#fff2b555";
        ctx.lineWidth = 0.018;
        ctx.stroke();
      }
    ctx.restore();
    oval(0.72, -0.02, 0.3, 0.24, gradient());
    ex = 0.78;
    ey = -0.06;
    mx = 0.85;
    my = 0.11;
    if (fish.crest) oval(-0.03, -0.09, 0.14, 0.11, gradient("#fff2c1", color));
  } else if (kind === "ray") {
    organic(
      [-0.44, 0.03],
      [[-0.66, 0.2, -0.84, 0.41 + wave, -1.12, 0.38]],
      0.07,
      accent,
      0.35,
    );
    shape(
      [0.83, 0],
      [
        [0.32, -0.2, 0.02, -0.43, -0.53, -0.7 - wave],
        [-0.81, -0.65, -0.57, -0.12, -0.52, 0],
        [-0.57, 0.12, -0.81, 0.65, -0.53, 0.7 + wave],
        [0.02, 0.43, 0.32, 0.2, 0.83, 0],
      ],
      gradient(),
    );
    line(
      [-0.47, -0.49],
      [[-0.2, -0.28, 0.12, -0.22, 0.46, -0.07]],
      0.025,
      "#fff4c150",
    );
    line(
      [-0.47, 0.49],
      [[-0.2, 0.28, 0.12, 0.22, 0.46, 0.07]],
      0.025,
      "#fff4c150",
    );
    oval(0.07, 0, 0.34, 0.14, "#ffffff18");
    ex = 0.48;
    ey = -0.07;
    mx = 0.58;
    my = 0.08;
  } else if (kind === "serpent") {
    const spine = organic(
      [0.52, -0.06],
      [
        [0.1, -0.42, -0.17, 0.34, -0.57, 0.24],
        [-0.96, 0.22, -0.69, -0.34, -0.96, -0.34 + wave],
      ],
      0.3,
      gradient(),
      0.5,
    );
    for (const i of [4, 8, 12, 16, 20])
      oval(spine[i][0], spine[i][1], 0.027, 0.018, "#fff2b57a");
    shape(
      [0.18, -0.08],
      [
        [0.32, -0.39, 0.69, -0.41, 0.88, -0.12],
        [0.9, 0.17, 0.42, 0.22, 0.18, -0.08],
      ],
      gradient(),
    );
    horn(0.43, -0.29, -1, 0.31);
    horn(0.63, -0.3, 1, 0.3);
    flipper(0.14, 0.02, -0.7 + wave, 0.6);
    ex = 0.64;
    ey = -0.13;
    mx = 0.73;
    my = 0.09;
  } else if (kind === "angler") {
    tail();
    flipper(-0.16, 0.29, wave, 0.8);
    shape(
      [-0.62, 0.02],
      [
        [-0.82, -0.37, -0.31, -0.71, 0.12, -0.57],
        [0.67, -0.52, 0.81, -0.14, 0.66, 0.15],
        [0.44, 0.54, -0.45, 0.58, -0.62, 0.02],
      ],
      gradient(),
    );
    line(
      [0.15, -0.48],
      [[0.16, -0.93, 0.5, -1.02, 0.7, -0.67 + wave]],
      0.038,
      accent,
    );
    oval(0.7, -0.67 + wave, 0.19, 0.19, "#ffe5a91f");
    oval(0.7, -0.67 + wave, 0.12, 0.12, gradient("#fff9d7", "#efc368"));
    oval(0.67, -0.7 + wave, 0.025, 0.025, "#ffffff");
    ex = 0.4;
    ey = -0.15;
    mx = 0.51;
    my = 0.16;
  } else if (kind === "crocodile") {
    tail();
    flipper(-0.39, 0.19, 0.3 + wave, 0.55);
    flipper(0.19, 0.18, -0.3 - wave, 0.5);
    for (let i = 0; i < 6; i++)
      horn(-0.65 + i * 0.18, -0.2, 1, 0.16 + (fish.crest || 0) * 0.025);
    shape(
      [-1, 0],
      [
        [-0.89, -0.29, -0.24, -0.39, 0.3, -0.21],
        [0.58, -0.21, 0.92, -0.17, 1.07, -0.09],
        [1.28, 0.05, 1.17, 0.19, 0.93, 0.19],
        [0.39, 0.36, -0.76, 0.35, -1, 0],
      ],
      gradient(),
    );
    oval(0.44, -0.18, 0.18, 0.17, gradient());
    oval(0.96, -0.02, 0.03, 0.02, accent);
    line([0.62, 0.13], [[0.76, 0.17, 0.98, 0.16, 1.1, 0.09]], 0.025, accent);
    ex = 0.46;
    ey = -0.2;
    mx = 0.81;
    my = 0.12;
  } else {
    tail();
    const whale = kind === "whale";
    shape(
      [-0.3, -0.21],
      [
        [-0.2, -0.33, -0.02, -0.76, 0.08, -0.68],
        [0.09, -0.43, 0.27, -0.24, 0.4, -0.21],
      ],
      gradient(),
    );
    shape(
      [-1, 0],
      [
        [-0.84, -0.36, -0.21, -0.55, 0.37, -0.4],
        [0.78, -0.34, 1.05, -0.12, 1.01, 0.11],
        [0.9, 0.45, 0.16, 0.5, -0.46, 0.3],
        [-0.78, 0.19, -0.9, 0.07, -1, 0],
      ],
      gradient(),
    );
    oval(0.12, 0.19, 0.73, whale ? 0.2 : 0.15, "#edf8ff5e");
    flipper(-0.19, 0.12, -0.22 + wave, whale ? 1 : 0.8);
    if (whale)
      for (let row = 0; row < 3; row++)
        for (let i = 0; i < 6; i++)
          oval(i * 0.22 - 0.66, row * 0.14 - 0.28, 0.025, 0.018, "#f8fff89c");
    else
      for (let i = 0; i < 3; i++)
        line(
          [0.1 + i * 0.09, -0.16],
          [
            [
              0.05 + i * 0.09,
              -0.09,
              0.05 + i * 0.09,
              0.07,
              0.12 + i * 0.09,
              0.12,
            ],
          ],
          0.025,
          accent,
        );
    ex = 0.62;
    ey = -0.12;
    mx = 0.78;
    my = 0.13;
    if (fish.crest)
      line(
        [-0.12, -0.38],
        [[0, -0.43, 0.14, -0.4, 0.27, -0.32]],
        0.035,
        "#ffeab688",
      );
  }
  // Inherited features make the consumed family readable on the survivor.
  for (const trait of fish.mutations || []) {
    if (trait === "seahorse") {
      organic(
        [-0.4, 0.19],
        [
          [-0.7, 0.32, -0.79, 0.61, -0.49, 0.65],
          [-0.17, 0.68, -0.11, 0.42, -0.37, 0.42],
        ],
        0.13,
        gradient(),
        0.15,
      );
    } else if (trait === "hydra") {
      for (const side of [-1, 1]) {
        organic(
          [side * 0.2, 0.05],
          [[side * 0.5, -0.07, side * 0.48, -0.3, side * 0.5, -0.34]],
          0.09,
          gradient(),
          0.08,
        );
        oval(side * 0.5, -0.35, 0.13, 0.1, gradient());
        oval(side * 0.5 + 0.03, -0.37, 0.025, 0.025, "#ffdc93");
      }
    } else if (["octopus", "jellyfish"].includes(trait)) {
      for (let i = 0; i < 3; i++)
        organic(
          [-0.32 + i * 0.23, 0.2],
          [
            [
              -0.5 + i * 0.23,
              0.43,
              0.02 + i * 0.1,
              0.6 + wave,
              -0.22 + i * 0.2,
              0.68,
            ],
          ],
          0.07,
          gradient(),
          0.2,
        );
    } else if (["ray", "shark", "whale"].includes(trait)) {
      flipper(-0.3, -0.05, -1.9 + wave, 0.9);
      flipper(-0.28, 0.18, 0.3 - wave, 0.8);
    } else if (trait === "turtle") {
      oval(-0.15, -0.1, 0.29, 0.2, accent);
      oval(-0.18, -0.13, 0.21, 0.13, "#ffe6a366");
    } else if (trait === "crab") {
      for (const side of [-1, 1]) {
        line(
          [side * 0.3, 0.14],
          [[side * 0.48, 0.19, side * 0.64, 0.27, side * 0.69, 0.12 + wave]],
          0.06,
          accent,
        );
        oval(side * 0.69, 0.1 + wave, 0.12, 0.08, gradient());
      }
    } else {
      for (let i = 0; i < 3; i++) horn(-0.37 + i * 0.18, -0.27, -1, 0.28);
    }
  }
  // Markings follow the silhouette, rather than adding unrelated extra limbs.
  if (fish.fierce && kind !== "turtle" && kind !== "serpent") {
    if (fish.pattern % 2 === 0)
      for (let i = 0; i < 4; i++)
        oval(
          -0.4 + i * 0.15,
          -0.22 + Math.sin(i) * 0.05,
          0.033,
          0.02,
          "#ffe9be85",
        );
    else
      for (let i = 0; i < 3; i++)
        line(
          [-0.42 + i * 0.16, -0.26],
          [
            [
              -0.48 + i * 0.16,
              -0.16,
              -0.38 + i * 0.16,
              -0.04,
              -0.44 + i * 0.16,
              0.04,
            ],
          ],
          0.025,
          "#fff6c455",
        );
  }
  const eye = (x, y, r) => {
    const h = r * pose.blink;
    oval(x, y, r * 1.18, h * 1.2, accent);
    oval(x, y, r, h, monster ? "#ffd47e" : "#fffdf1");
    const gaze = Math.sin(t * 0.5 + (fish.slot || 0)) * 0.012;
    oval(x + 0.014 + gaze, y, r * (monster ? 0.22 : 0.43), h * 0.74, "#172f48");
    if (pose.blink > 0.5)
      oval(x - 0.02, y - h * 0.25, 0.018, 0.018, "#ffffffd9");
    if (monster)
      line(
        [x - r * 0.95, y - r * 0.95],
        [[x - r * 0.3, y - r, x + r * 0.35, y - r * 0.45, x + r, y - r * 0.55]],
        0.03 + Math.min(5, tier) * 0.002,
        accent,
      );
  };
  eye(ex, ey, 0.1);
  if (front) eye(-ex, ey, 0.1);
  if (monster && fish.fierce && tier >= 3 && front) eye(0, ey - 0.19, 0.065);
  if ((pose.mouth || 0) > 0) {
    const open = pose.mouth;
    oval(mx, my, 0.13 + open * 0.27, 0.06 + open * 0.31, "#15283d");
    oval(
      mx,
      my + 0.08 + open * 0.11,
      0.08 + open * 0.14,
      0.035 + open * 0.055,
      "#ef93ac",
    );
    for (let i = -2; i <= 2; i++)
      shape(
        [mx + i * 0.085 - 0.026, my - 0.025 - open * 0.2],
        [
          [
            mx + i * 0.085 - 0.018,
            my + 0.07 - open * 0.16,
            mx + i * 0.085 + 0.018,
            my + 0.07 - open * 0.16,
            mx + i * 0.085 + 0.026,
            my - 0.025 - open * 0.2,
          ],
        ],
        "#fff4d8",
        false,
      );
  } else if (monster) {
    oval(mx, my, front ? 0.2 : 0.16, 0.075 + pose.anger * 0.02, "#182d43");
    for (const side of [-1, 1])
      shape(
        [mx + side * 0.095 - 0.022, my - 0.047],
        [
          [
            mx + side * 0.095 - 0.02,
            my + 0.035,
            mx + side * 0.095 + 0.02,
            my + 0.035,
            mx + side * 0.095 + 0.022,
            my - 0.047,
          ],
        ],
        "#fff3d7",
        false,
      );
  } else {
    line(
      [mx - 0.09, my],
      [[mx - 0.04, my + 0.075, mx + 0.06, my + 0.075, mx + 0.12, my]],
      0.025,
      "#39526a",
    );
    oval(ex - 0.035, ey + 0.14, 0.085, 0.035, "#fcb7be60");
  }
  ctx.restore();
}
