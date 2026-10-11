// Device-local time, without location access or server requests.
export function fishingDaylight(hour) {
  if (hour >= 5 && hour < 11)
    return {
      name: "Pagi",
      sky: ["#b4ddd8", "#ffecc0"],
      sun: "#ffd991",
      sea: ["#83cbd0", "#4797aa", "#2b526e"],
      night: false,
    };
  if (hour >= 11 && hour < 16)
    return {
      name: "Siang",
      sky: ["#9fd7ed", "#e4f4da"],
      sun: "#fff0ac",
      sea: ["#80c7ca", "#4797aa", "#2b526e"],
      night: false,
    };
  if (hour >= 16 && hour < 19)
    return {
      name: "Sore",
      sky: ["#a99ccc", "#f4ba9d"],
      sun: "#ffb77f",
      sea: ["#97aebd", "#647eaa", "#364c74"],
      night: false,
    };
  return {
    name: "Malam",
    sky: ["#17283f", "#455875"],
    sun: "#e7ecff",
    sea: ["#477b95", "#335570", "#1d344f"],
    night: true,
  };
}
