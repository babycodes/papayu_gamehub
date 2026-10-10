import test from "node:test";
import assert from "node:assert/strict";
import { localPlayers, playerForRole } from "../src/players.js";
test("players choose either camp, with names cleaned and opposite camps assigned", () => {
  const players = localPlayers("  Alya  ", "Bima", "blue");
  assert.deepEqual(players, [
    { name: "Alya", team: "blue" },
    { name: "Bima", team: "red" },
  ]);
  assert.equal(localPlayers("", "", "red")[0].name, "Pemain 1");
  assert.throws(() => localPlayers("A", "B", ""), /Pilih kubu/);
  assert.throws(
    () => localPlayers("Alya", " alya ", "red"),
    /nama yang berbeda/,
  );
});
test("rematch alternates who gets X or white while preserving names and camps", () => {
  const players = localPlayers("Alya", "Bima", "blue");
  assert.equal(playerForRole(players, 0, "X").name, "Alya");
  assert.equal(playerForRole(players, 1, "X").name, "Bima");
  assert.equal(playerForRole(players, 1, "w").team, "red");
  assert.equal(playerForRole(players, 1, "b").team, "blue");
  assert.equal(players[0].team, "blue");
});
