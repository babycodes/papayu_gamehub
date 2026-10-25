// Render-only conversion: saved fish/boss colours and gameplay data stay intact.
// Cache is bounded even after many randomly coloured boss waves.
const cache = new Map();
export function matteColor(value) {
  if (typeof value !== "string" || !/^#[\da-f]{6}([\da-f]{2})?$/i.test(value))
    return value;
  if (cache.has(value)) return cache.get(value);
  const rgb = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
  const grey = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  const dust = [200, 199, 176];
  const result =
    "#" +
    rgb
      .map((c, i) =>
        Math.round(c * 0.76 + grey * 0.12 + dust[i] * 0.12)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("") +
    value.slice(7);
  if (cache.size >= 384) cache.clear();
  cache.set(value, result);
  return result;
}
