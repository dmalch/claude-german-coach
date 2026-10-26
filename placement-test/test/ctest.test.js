const test = require("node:test");
const assert = require("node:assert/strict");
const CTest = require("../ctest.js");

const TEXT =
  "Am Samstag waren wir in den Bergen. Der Weg war steil und lang, aber die Aussicht oben war wunderbar. " +
  "Wir haben auf der Hütte eine Pause gemacht und Suppe gegessen. Am Abend waren alle müde und glücklich.";

test("split deletes the second half, the larger half when odd", () => {
  assert.deepEqual(CTest.split("Berg"), { shown: "Be", answer: "rg" });
  assert.deepEqual(CTest.split("Hütte"), { shown: "Hü", answer: "tte" });
  assert.deepEqual(CTest.split("an"), { shown: "a", answer: "n" });
});

test("build gaps every second word between the first and last sentence", () => {
  const built = CTest.build(TEXT, 11);
  assert.deepEqual(
    built.gaps.map((g) => g.word),
    ["Weg", "steil", "lang", "die", "oben", "wunderbar", "haben", "der", "eine", "gemacht", "Suppe"],
  );
});

test("build keeps the first and last sentence whole", () => {
  const { parts } = CTest.build(TEXT, 11);
  assert.equal(parts[0].value, "Am Samstag waren wir in den Bergen. Der ");
  assert.ok(parts.at(-1).value.endsWith("Am Abend waren alle müde und glücklich."));
});

test("build reassembles to the original text", () => {
  const { parts } = CTest.build(TEXT, 11);
  const joined = parts.map((p) => (p.type === "text" ? p.value : p.shown + p.answer)).join("");
  assert.equal(joined, TEXT);
});

test("build refuses a text that is too short", () => {
  assert.throws(() => CTest.build(TEXT, 20), /yields 11 gaps, needs 20/);
  assert.throws(() => CTest.build("Nur ein Satz. Und noch einer.", 1), /at least 3 sentences/);
});

test("words marked with ^ are never gapped and lose the marker", () => {
  const text = "Wir fahren morgen los. Unser Ziel ist die ^Zugspitze im Süden. Wir freuen uns sehr.";
  const built = CTest.build(text, 3);
  assert.deepEqual(built.gaps.map((g) => g.word), ["Ziel", "die", "Süden"]);
  assert.ok(built.clean.includes("die Zugspitze im"));
});

test("scoreGap: exact rest, umlaut transliteration, whole word typed", () => {
  const hut = { word: "Hütte", shown: "Hü", answer: "tte" };
  assert.deepEqual(CTest.scoreGap(hut, "tte"), { strict: true, tolerant: true });
  assert.deepEqual(CTest.scoreGap(hut, " TTE "), { strict: true, tolerant: true });
  assert.deepEqual(CTest.scoreGap(hut, "Hütte"), { strict: true, tolerant: true });
  const gru = { word: "grün", shown: "gr", answer: "ün" };
  assert.deepEqual(CTest.scoreGap(gru, "uen"), { strict: true, tolerant: true });
});

test("scoreGap: one typo is tolerant only, empty is wrong", () => {
  const soup = { word: "Suppe", shown: "Su", answer: "ppe" };
  assert.deepEqual(CTest.scoreGap(soup, "ppr"), { strict: false, tolerant: true });
  assert.deepEqual(CTest.scoreGap(soup, ""), { strict: false, tolerant: false });
  const der = { word: "der", shown: "d", answer: "er" };
  assert.deepEqual(CTest.scoreGap(der, "ie"), { strict: false, tolerant: false });
});

test("scoreGap accepts listed alternatives", () => {
  const gap = { word: "Wanderung", shown: "Wand", answer: "erung" };
  assert.equal(CTest.scoreGap(gap, "erer", ["Wanderer"]).strict, true);
});

test("scoreText sums strict and tolerant", () => {
  const built = CTest.build(TEXT, 11);
  const responses = built.gaps.map((g) => g.answer);
  responses[0] = "x";
  responses[10] = "ppr";
  assert.deepEqual(CTest.scoreText(built, responses), { strict: 9, tolerant: 10, max: 11 });
});

test("a dot inside a number does not end a sentence", () => {
  const text = "Das Auto kostete 3.000 Euro im Jahr. Wir waren glücklich. Er spielte Fußball. Wir gingen heute nach Hause.";
  const built = CTest.build(text, 3);
  // First part should include the entire first sentence with "3.000"
  assert.ok(built.parts[0].value.includes("3.000 Euro im Jahr."), "First sentence should contain 3.000");
  // No gap word should come from the first sentence
  const firstSentenceEnd = built.parts[0].value.length;
  for (const gap of built.gaps) {
    assert.ok(gap.start >= firstSentenceEnd, `Gap word "${gap.word}" should not be from first sentence`);
  }
});

test("ellipsis ends a sentence", () => {
  const text = "Wir warteten lange… Dann kam der Bus endlich an. Alle freuten sich sehr. Wir fuhren nach Hause.";
  const built = CTest.build(text, 3);
  // First eligible word in second sentence is "Dann" (1st, skip), "kam" (2nd, gap!)
  assert.equal(built.gaps[0].word, "kam", "First gap should be 'kam' (2nd eligible word after ellipsis)");
});

test("German closing quotes stay with their sentence", () => {
  const text = "Er sagte: „Wir gehen jetzt.” Dann gingen wir nach draußen. Alle waren glücklich. Es war schön.";
  const built = CTest.build(text, 2);
  // First sentence ends with the closing quote; it should be part of the protected first sentence
  assert.ok(built.parts[0].value.includes("”"), "First part should include German closing quote");
  assert.ok(built.parts[0].value.startsWith("Er sagte: „"), "First part should start with German opening quote");
  // The first gap should be "gingen" (2nd eligible word in sentence 2)
  assert.equal(built.gaps[0].word, "gingen", "First gap should be 'gingen' from second sentence");
  // Verify quote handling matters: second sentence should start with "Dann", not a stray quote
  const firstPart = built.parts[0].value;
  assert.ok(!firstPart.endsWith("” ”"), "Should not have lone quote starting sentence 2");
});
