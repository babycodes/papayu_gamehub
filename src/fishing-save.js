import { FishingGame } from "./engine.js";
export const FISHING_SAVE_KEY = "papayu-fishing-progress-v1";
const BEST_KEY = "papayu-fishing-best";
const template = new FishingGame(() => 0.5);
const FIELDS = Object.keys(template).filter(
  (key) => !["random", "viewport", "events", "held", "mode"].includes(key),
);
const forbidden = (key) =>
  ["__proto__", "prototype", "constructor"].includes(key);
const finite = (n) => Number.isFinite(n);
const natural = (n) => Number.isSafeInteger(n) && n >= 0;

// References preserve shared fish objects during boss hunts, bites and mutations.
// JSON alone would duplicate those objects and replace Infinity with null.
function pack(root) {
  const nodes = [],
    seen = new Map();
  function encode(value) {
    if (typeof value === "number" && !finite(value)) {
      if (Number.isNaN(value)) throw Error("Invalid number");
      return { number: value > 0 ? "+inf" : "-inf" };
    }
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return { ref: seen.get(value) };
    if (nodes.length >= 2048) throw Error("Save too large");
    const ref = nodes.length;
    seen.set(value, ref);
    nodes.push(null);
    nodes[ref] =
      value instanceof Set
        ? { type: "set", values: [...value].map(encode) }
        : Array.isArray(value)
          ? { type: "array", values: value.map(encode) }
          : {
              type: "object",
              values: Object.fromEntries(
                Object.entries(value).map(([key, v]) => [key, encode(v)]),
              ),
            };
    return { ref };
  }
  const entry = encode(root);
  return { entry, nodes };
}
function unpack(graph) {
  if (!graph || !Array.isArray(graph.nodes) || graph.nodes.length > 2048)
    throw Error("Invalid graph");
  const objects = graph.nodes.map((node) => {
    if (
      node.type === "object" &&
      node.values &&
      !Array.isArray(node.values) &&
      Object.keys(node.values).length <= 96
    )
      return {};
    if (!Array.isArray(node.values) || node.values.length > 128)
      throw Error("Invalid node");
    if (node.type === "set") return new Set();
    if (node.type === "array") return [];
    throw Error("Invalid node");
  });
  function decode(value) {
    if (
      value === null ||
      typeof value === "boolean" ||
      (typeof value === "number" && finite(value))
    )
      return value;
    if (typeof value === "string" && value.length <= 256) return value;
    if (value && Object.keys(value).length === 1) {
      if (
        Number.isInteger(value.ref) &&
        value.ref >= 0 &&
        value.ref < objects.length
      )
        return objects[value.ref];
      if (value.number === "+inf") return Infinity;
      if (value.number === "-inf") return -Infinity;
    }
    throw Error("Invalid value");
  }
  graph.nodes.forEach((node, i) => {
    if (node.type === "object")
      for (const [key, value] of Object.entries(node.values)) {
        if (forbidden(key)) throw Error("Invalid key");
        objects[i][key] = decode(value);
      }
    else
      for (const value of node.values) {
        if (node.type === "set") objects[i].add(decode(value));
        else objects[i].push(decode(value));
      }
  });
  return decode(graph.entry);
}
function validState(s) {
  if (!s || FIELDS.some((key) => !Object.hasOwn(s, key))) return false;
  for (const key of FIELDS) {
    const expected = template[key],
      value = s[key];
    if (
      typeof expected === "number" &&
      (typeof value !== "number" ||
        Number.isNaN(value) ||
        (!finite(value) && !["lastCatchAt", "nextHuntAt"].includes(key)))
    )
      return false;
    if (typeof expected === "boolean" && typeof value !== "boolean")
      return false;
  }
  if (
    !["easy", "normal"].includes(s.difficulty) ||
    !["waiting", "warning", "active"].includes(s.bossState)
  )
    return false;
  if (
    ![
      s.score,
      s.count,
      s.combo,
      s.bestCombo,
      s.rareCount,
      s.bossIndex,
      s.bossRemaining,
      s.bossWaveCaught,
      s.bossCount,
      s.id,
    ].every(natural) ||
    s.combo < 1 ||
    s.bossRemaining > 3
  )
    return false;
  if (
    s.remaining <= 0 ||
    s.elapsed < 0 ||
    !natural(s.nextBossScore) ||
    s.nextBossScore <= 0
  )
    return false;
  const fish = (f) =>
    f &&
    typeof f.name === "string" &&
    typeof f.kind === "string" &&
    typeof f.color === "string" &&
    typeof f.accent === "string" &&
    natural(f.id) &&
    [f.x, f.y, f.size, f.layer, f.speed, f.phase, f.direction, f.points].every(
      finite,
    ) &&
    Number.isInteger(f.layer) &&
    f.layer >= 0 &&
    f.layer <= 4 &&
    f.points >= 0 &&
    f.size > 0 &&
    [1, -1].includes(f.direction) &&
    (finite(f.expires) || f.expires === Infinity);
  if (
    ![s.fish, s.hiddenFish].every(
      (list) => Array.isArray(list) && list.length <= 64 && list.every(fish),
    )
  )
    return false;
  if (
    !Array.isArray(s.bossWave) ||
    s.bossWave.length > 3 ||
    !s.bossWave.every(
      (b) =>
        b &&
        typeof b.encounterId === "string" &&
        typeof b.name === "string" &&
        typeof b.kind === "string" &&
        typeof b.color === "string" &&
        typeof b.accent === "string",
    )
  )
    return false;
  if (
    !(s.finishedBossIds instanceof Set) ||
    s.finishedBossIds.size > 3 ||
    ![...s.finishedBossIds].every((id) => typeof id === "string")
  )
    return false;
  if (
    !Array.isArray(s.previousBossKinds) ||
    s.previousBossKinds.length > 3 ||
    !s.previousBossKinds.every((k) => typeof k === "string")
  )
    return false;
  if (
    s.bossState !== "waiting" &&
    (!s.currentBoss || s.bossWave.length === 0 || s.bossRemaining === 0)
  )
    return false;
  if (s.currentBoss !== null && !s.bossWave.includes(s.currentBoss))
    return false;
  if (
    !s.hook ||
    !["idle", "dropping", "reeling", "fighting"].includes(s.hook.state) ||
    ![s.hook.x, s.hook.y, s.hook.targetX].every(finite) ||
    (s.hook.catch !== null && !fish(s.hook.catch))
  )
    return false;
  if (s.fight !== null) {
    const f = s.fight;
    if (
      s.hook.state !== "fighting" ||
      !s.hook.catch ||
      !["hold", "timing", "follow"].includes(f.type) ||
      !Number.isInteger(f.stage) ||
      f.stage < 0 ||
      f.stage > 2 ||
      ![
        f.remaining,
        f.progress,
        f.total,
        f.elapsed,
        f.anchorY,
        f.tension,
        f.aggression,
        f.target,
        f.meter,
      ].every(finite)
    )
      return false;
    if (
      !f.profile ||
      !Array.isArray(f.profile.stageSeconds) ||
      f.profile.stageSeconds.length !== 3 ||
      !f.profile.stageSeconds.every(finite) ||
      ![
        f.profile.level,
        f.profile.tolerance,
        f.profile.greenThreshold,
        f.profile.effort,
        f.profile.redSeconds,
      ].every(finite)
    )
      return false;
  } else if (s.hook.state === "fighting") return false;
  if (
    s.predation !== null &&
    (!s.predation ||
      !["hunt", "bite", "mutate"].includes(s.predation.phase) ||
      !finite(s.predation.clock) ||
      !fish(s.predation.predator) ||
      !fish(s.predation.prey))
  )
    return false;
  return true;
}
export function encodeFishingSave(game, settings = {}, now = Date.now()) {
  if (!["playing", "paused"].includes(game.mode) || game.remaining <= 0)
    return null;
  const state = Object.fromEntries(FIELDS.map((key) => [key, game[key]]));
  return JSON.stringify({
    version: 1,
    savedAt: now,
    state: pack(state),
    settings: {
      bossStyle: settings.bossStyle === "cute" ? "cute" : "spooky",
      sound: settings.sound !== false,
      roundBest: natural(settings.roundBest) ? settings.roundBest : 0,
    },
  });
}
export function decodeFishingSave(text) {
  try {
    if (typeof text !== "string" || text.length > 524288) return null;
    const save = JSON.parse(text);
    if (save.version !== 1 || !natural(save.savedAt)) return null;
    const state = unpack(save.state);
    if (!validState(state)) return null;
    const game = new FishingGame();
    for (const key of FIELDS) game[key] = state[key];
    game.mode = "playing";
    game.release(); // Never restore a finger/key as being held down.
    game.mode = "paused";
    game.events = [];
    return {
      game,
      savedAt: save.savedAt,
      settings: {
        bossStyle: save.settings?.bossStyle === "cute" ? "cute" : "spooky",
        sound: save.settings?.sound !== false,
        roundBest: natural(save.settings?.roundBest)
          ? save.settings.roundBest
          : 0,
      },
    };
  } catch {
    return null;
  }
}
export class FishingProgress {
  constructor(storage) {
    this.storage = storage;
  }
  load() {
    try {
      const raw = this.storage?.getItem(FISHING_SAVE_KEY);
      const save = decodeFishingSave(raw);
      if (raw && !save) this.clear();
      return save;
    } catch {
      return null;
    }
  }
  save(game, settings) {
    try {
      const data = encodeFishingSave(game, settings);
      if (!data || !this.storage) return false;
      this.storage.setItem(FISHING_SAVE_KEY, data);
      return true;
    } catch {
      return false;
    }
  }
  clear() {
    try {
      this.storage?.removeItem(FISHING_SAVE_KEY);
    } catch {}
  }
  best(score = 0) {
    let previous = 0;
    try {
      const value = Number(this.storage?.getItem(BEST_KEY));
      if (natural(value)) previous = value;
    } catch {}
    const best = Math.max(previous, natural(score) ? score : 0);
    if (best > previous)
      try {
        this.storage?.setItem(BEST_KEY, String(best));
      } catch {}
    return best;
  }
}
