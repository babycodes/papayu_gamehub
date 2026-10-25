// Device-local time, without location access or server requests.
export function fishingDaylight(hour) {
  if (hour >= 5 && hour < 11)
    return {
      name: "Pagi",
      sky: ["#a7c0ba", "#dbcdaf"],
      sun: "#d8bf8f",
      sea: ["#85b1b2", "#578892", "#3c5463"],
      night: false,
    };
  if (hour >= 11 && hour < 16)
    return {
      name: "Siang",
      sky: ["#99bbc7", "#cad3c0"],
      sun: "#dbd0a3",
      sea: ["#82aead", "#578892", "#3c5463"],
      night: false,
    };
  if (hour >= 16 && hour < 19)
    return {
      name: "Sore",
      sky: ["#9990ab", "#cea893"],
      sun: "#d4a580",
      sea: ["#8f9ca3", "#687790", "#435067"],
      night: false,
    };
  return {
    name: "Malam",
    sky: ["#2a3440", "#4e5969"],
    sun: "#cbcdd7",
    sea: ["#547481", "#425665", "#303d4c"],
    night: true,
  };
}
