const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../scoring.js");

const fill = { id: "AUX-1", zone: "AUX", type: "fill", prompt: "Gestern ___ wir auf den Wank gestiegen.", accept: ["sind"] };
const conn = { id: "KONN-1", zone: "KONN", type: "fill", prompt: "___ es regnete, gingen wir los.", accept: ["Obwohl"] };
const konj = { id: "KONJ2-1", zone: "KONJ2", type: "fill", prompt: "Wenn ich Zeit ___, …", accept: ["hätte"] };
const choice = { id: "WO-1", zone: "WO", type: "choice", prompt: "Ich weiß nicht, …", options: ["a", "b", "c"], answer: 0 };

test("fill items ignore case, outer spaces, final period and umlaut transliteration", () => {
  assert.equal(S.scoreItem(fill, " sind "), true);
  assert.equal(S.scoreItem(conn, "obwohl"), true);
  assert.equal(S.scoreItem(konj, "haette."), true);
  assert.equal(S.scoreItem(fill, "haben"), false);
  assert.equal(S.scoreItem(fill, undefined), false);
});

test("choice items compare the option index", () => {
  assert.equal(S.scoreItem(choice, 0), true);
  assert.equal(S.scoreItem(choice, 2), false);
  assert.equal(S.scoreItem(choice, undefined), false);
});

test("choice items never score an unanswered or keyless item as correct", () => {
  assert.equal(S.scoreItem({ type: "choice", options: ["a", "b"] }, undefined), false);
  assert.equal(S.scoreItem({ ...choice }, null), false);
});

test("scoreGrammar totals by zone", () => {
  const r = S.scoreGrammar([fill, konj, choice], { "AUX-1": "sind", "KONJ2-1": "hatte", "WO-1": 0 });
  assert.equal(r.correct, 2);
  assert.equal(r.max, 3);
  assert.deepEqual(r.byZone.AUX, { correct: 1, max: 1 });
  assert.deepEqual(r.byZone.KONJ2, { correct: 0, max: 1 });
});

test("scoreChoiceSet counts correct options", () => {
  const items = [choice, { ...choice, id: "WO-2", answer: 1 }];
  assert.deepEqual(S.scoreChoiceSet(items, { "WO-1": 0, "WO-2": 2 }), { correct: 1, max: 2 });
});

test("selfAssessment averages answered statements per group", () => {
  const st = [
    { id: "a", group: "Hören" }, { id: "b", group: "Hören" }, { id: "c", group: "Behörde" },
  ];
  const r = S.selfAssessment(st, { a: 4, b: 2 });
  assert.deepEqual(r["Hören"], { mean: 3, answered: 2, total: 2 });
  assert.deepEqual(r["Behörde"], { mean: null, answered: 0, total: 1 });
});

const bands = (b1, b2, c1) => [
  { band: "B1", strict: b1, max: 40 }, { band: "B2", strict: b2, max: 40 }, { band: "C1", strict: c1, max: 40 },
];

test("estimateCTestLevel thresholds: 60% passes a band, 40% earns a plus", () => {
  assert.equal(S.estimateCTestLevel(bands(23, 30, 30)), "<B1");
  assert.equal(S.estimateCTestLevel(bands(24, 15, 0)), "B1");
  assert.equal(S.estimateCTestLevel(bands(24, 16, 0)), "B1+");
  assert.equal(S.estimateCTestLevel(bands(30, 24, 10)), "B2");
  assert.equal(S.estimateCTestLevel(bands(30, 24, 16)), "B2+");
  assert.equal(S.estimateCTestLevel(bands(38, 35, 24)), "C1");
});

test("estimateCTestLevel refuses a missing band", () => {
  assert.throws(() => S.estimateCTestLevel([{ band: "B1", strict: 30, max: 40 }]), /no C-test result for band B2/);
});
