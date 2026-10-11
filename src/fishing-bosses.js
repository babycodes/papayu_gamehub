export const BOSS_CAPTURE = {
  easy: { stageSeconds: [10, 8, 10], failurePenalty: 3 },
  normal: { stageSeconds: [8, 6, 8], failurePenalty: 5 },
  maxFailures: 3,
};
export const BOSS_STEP = 2000;
export const RANDOM_BOSS_SCORE = 22000;
export const LATE_BOSS_STEP = 5000;
export const FRENZY_DURATION = 5;
export const STAR_DURATION = 15;
export const BOSS_FEEDING = {
  graceSeconds: 8,
  cooldownSeconds: 8,
  biteSeconds: 0.65,
  mutationSeconds: 2,
};
// Two bounded mutation levels: harder controls, with extra time to learn them.
export function bossCaptureProfile(fish, difficulty = "easy") {
  const level = fish.boss
    ? Math.min(2, Math.max(0, Math.round(Math.log2(fish.growth || 1))))
    : 0;
  const easy = difficulty === "easy";
  return {
    level,
    rebellion: !!fish.boss,
    stageSeconds: BOSS_CAPTURE[difficulty].stageSeconds.map(
      (seconds) => seconds + level * 2,
    ),
    tolerance:
      (easy ? (fish.boss ? 0.155 : 0.17) : fish.boss ? 0.105 : 0.11) -
      level * 0.015,
    greenThreshold:
      (easy ? (fish.boss ? 0.46 : 0.42) : fish.boss ? 0.65 : 0.62) +
      level * 0.025,
    effort: (fish.boss ? 1.15 : 1) + level * 0.22,
    redSeconds: 0.65 + level * 0.15,
  };
}
const roster = [
  ["crocodile", "Buaya ceria", "🐊", "crocodile", "#a5d87d", "#568942"],
  ["octopus", "Gurita raksasa", "🐙", "octopus", "#edabbf", "#b85889"],
  ["turtle", "Kura-kura pulau", "🐢", "turtle", "#a9d9a2", "#518d6b"],
  ["ray", "Pari pelangi", "🌈", "ray", "#bfc3f5", "#8571be"],
  ["crab", "Kepiting permata", "🦀", "crab", "#f3b592", "#c57665"],
  ["whale", "Paus bintang", "🐋", "whale", "#adcbef", "#668dbb"],
  ["shark", "Hiu mahkota", "🦈", "shark", "#c2dfe5", "#6b96b1"],
  ["serpent", "Naga laut", "🐉", "serpent", "#b5e4ce", "#4c9d88"],
  ["angler", "Ikan lentera", "💡", "angler", "#dcc3ee", "#9c75b4"],
  ["kraken", "Kraken bulan", "🌙", "octopus", "#b9b8ee", "#7774bb"],
  [
    "crocokraken",
    "Buaya gurita",
    "🐊",
    "crocodile",
    "#c1dfb2",
    "#6b9c74",
    "tentacles",
  ],
  [
    "turtledragon",
    "Kura-kura naga",
    "🐢",
    "turtle",
    "#e6c69a",
    "#ae805b",
    "horns",
  ],
  ["raystar", "Pari bintang", "⭐", "ray", "#f3d68e", "#bf9a55", "stars"],
  ["crabwhale", "Kepiting paus", "🦀", "crab", "#b3d4ec", "#688fac", "fins"],
  ["whaledragon", "Paus naga", "🐋", "whale", "#b9dfca", "#679e86", "horns"],
  [
    "sharkkraken",
    "Hiu kraken",
    "🦈",
    "shark",
    "#e0b4d8",
    "#a86d9e",
    "tentacles",
  ],
  ["seahydra", "Naga pelangi", "🐉", "serpent", "#edb8c9", "#b774a0", "fins"],
  [
    "moonangler",
    "Lentera bulan",
    "🌙",
    "angler",
    "#a7dce5",
    "#5d9da9",
    "stars",
  ],
  [
    "royalkraken",
    "Gurita mahkota",
    "👑",
    "octopus",
    "#efce94",
    "#b28b4c",
    "horns",
  ],
  [
    "oceanheart",
    "Penjaga samudra",
    "💎",
    "whale",
    "#b7c5f5",
    "#7a84bf",
    "stars",
  ],
];
roster.push(
  ["seahorse", "Kuda laut kristal", "🦄", "seahorse", "#efb2dc", "#9264ab"],
  ["kaiju", "Godzilla laut", "🦖", "kaiju", "#a3d69c", "#416d73"],
  ["jellyfish", "Ubur-ubur kosmik", "🪼", "jellyfish", "#d5adf2", "#7966bc"],
  ["hydra", "Hydra tiga kepala", "🐉", "hydra", "#a1d8dd", "#4e798e"],
  ["lobster", "Lobster baja", "🦞", "crab", "#ecbb94", "#a76275", "horns"],
  [
    "horsekraken",
    "Kuda laut tentakel",
    "🦄",
    "seahorse",
    "#b3beee",
    "#7465aa",
    "tentacles",
  ],
  ["icekaiju", "Godzilla es", "🦖", "kaiju", "#a4deef", "#557aac", "stars"],
  [
    "jellydragon",
    "Ubur naga",
    "🪼",
    "jellyfish",
    "#eec6a7",
    "#a36898",
    "horns",
  ],
  ["hydramoon", "Hydra bulan", "🌙", "hydra", "#bfc8f2", "#6379aa", "stars"],
);
export const FISHING_BOSSES = roster.map(
  ([id, name, icon, kind, color, accent, hybrid], index) => ({
    id,
    name,
    icon,
    kind,
    color,
    accent,
    hybrid,
    index,
    threshold: (index + 1) * BOSS_STEP,
    points: 500 + index * 25,
    size: 150 + index * 2,
    boss: true,
    power: 10 + index * 2,
  }),
);

export function nextBossThreshold(threshold) {
  return threshold < RANDOM_BOSS_SCORE
    ? threshold + BOSS_STEP
    : threshold + LATE_BOSS_STEP;
}
export function bossWaveSize(threshold) {
  return threshold >= 40000 ? 3 : threshold >= 20000 ? 2 : 1;
}
const palettes = [
  ["#84ddd6", "#277c92", "Karang"],
  ["#b2a0ef", "#614296", "Senja"],
  ["#ef998c", "#a23b60", "Bara"],
  ["#91c5ef", "#355b98", "Badai"],
  ["#d7a7df", "#8e408b", "Nebula"],
  ["#b6d995", "#417568", "Lumut"],
  ["#eed09b", "#a77649", "Emas"],
];
// Only the previous wave's families are retained. Variants can continue
// indefinitely without accumulating a history of monsters or textures.
export function createBossWave(
  threshold,
  waveIndex,
  random,
  previousKinds = [],
) {
  const tier = Math.min(5, Math.floor(threshold / 20000));
  const count = bossWaveSize(threshold),
    used = new Set();
  return Array.from({ length: count }, (_, slot) => {
    const procedural = threshold >= RANDOM_BOSS_SCORE;
    const candidates = FISHING_BOSSES.filter(
      (b) => !used.has(b.kind) && !previousKinds.includes(b.kind),
    );
    const base =
      !procedural && slot === 0
        ? FISHING_BOSSES[Math.min(waveIndex, 9)]
        : candidates[
            Math.floor(
              Math.max(0, Math.min(0.999999, random())) * candidates.length,
            )
          ];
    used.add(base.kind);
    const variant = waveIndex * 3 + slot;
    const palette =
      palettes[
        (variant + Math.floor(random() * palettes.length)) % palettes.length
      ];
    return {
      ...base,
      name: procedural
        ? `${base.name.replace(/ ceria| raksasa| pulau| pelangi| permata| bintang| mahkota| laut| bulan/g, "")} ${palette[2]}`
        : base.name,
      color: procedural ? palette[0] : base.color,
      accent: procedural ? palette[1] : base.accent,
      threshold,
      tier,
      waveCount: count,
      slot,
      encounterId: `${waveIndex}:${slot}`,
      variant,
      pattern: variant % 4,
      crest: procedural ? 1 + (variant % 3) : base.hybrid ? 1 : 0,
      // Size and aggression grow to a child-friendly cap at 100k. Waves and
      // random appearances continue beyond that cap at every 5k threshold.
      size: 150 + tier * 12 + (procedural ? 8 : waveIndex * 2),
      points: procedural ? 700 + tier * 75 : base.points,
      fierce: procedural,
      power: base.power + tier * 8 + Math.floor(random() * 10),
      mutations: [],
      growth: 1,
    };
  });
}
