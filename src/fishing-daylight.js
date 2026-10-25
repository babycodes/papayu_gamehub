// Device-local time, without location access or server requests.
export function fishingDaylight(hour) {
  if (hour >= 5 && hour < 11)
    return {
      name: "Pagi",
      sky: ["#b5ccc6", "#e3d6bb"],
      sun: "#e1ca9f",
      sea: ["#98c0c1", "#578892", "#3c5463"],
      night: false,
    };
  if (hour >= 11 && hour < 16)
    return {
      name: "Siang",
      sky: ["#a9c8d3", "#d3dbca"],
      sun: "#e2d9b0",
      sea: ["#96bdbc", "#578892", "#3c5463"],
      night: false,
    };
  if (hour >= 16 && hour < 19)
    return {
      name: "Sore",
      sky: ["#aca4bc", "#d9b7a4"],
      sun: "#dfb593",
      sea: ["#a2aeb4", "#687790", "#435067"],
      night: false,
    };
  return {
    name: "Malam",
    sky: ["#2a3440", "#4e5969"],
    sun: "#d4d6df",
    sea: ["#547481", "#425665", "#303d4c"],
    night: true,
  };
}
