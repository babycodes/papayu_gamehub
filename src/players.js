export const TEAM_NAMES = { red: "Merah", blue: "Biru" };
export function localPlayers(nameOne, nameTwo, teamOne) {
  if (!["red", "blue"].includes(teamOne))
    throw new Error("Pilih kubu merah atau biru terlebih dahulu.");
  const clean = (name, fallback) =>
    [...String(name || "").trim()].slice(0, 20).join("") || fallback;
  const names = [clean(nameOne, "Pemain 1"), clean(nameTwo, "Pemain 2")];
  if (names[0].toLocaleLowerCase("id") === names[1].toLocaleLowerCase("id"))
    throw new Error("Gunakan nama yang berbeda agar giliran mudah dikenali.");
  return [
    { name: names[0], team: teamOne },
    { name: names[1], team: teamOne === "red" ? "blue" : "red" },
  ];
}
export function playerForRole(players, firstPlayer, role) {
  return players[role === "X" || role === "w" ? firstPlayer : 1 - firstPlayer];
}
