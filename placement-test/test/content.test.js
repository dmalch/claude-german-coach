const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const CTest = require("../ctest.js");

// The pack under test: the example by default, a learner's own pack with
// GERMAN_COACH_PACK=/path/to/content.js. A learner's pack holds secret anchor
// texts, so no assertion here may print a text: failures name ids, never content.
const PACK = process.env.GERMAN_COACH_PACK
  ? path.resolve(process.env.GERMAN_COACH_PACK)
  : path.join(__dirname, "..", "..", "packs", "example", "content.js");
const C = require(PACK);

const ZONES = ["ART", "PRAEP", "ADJ", "WO", "AUX", "PASS", "KONJ2", "KONN", "REL", "NDEKL"];
const ABBREV = /\b(z\.\s?B|usw|d\.\s?h|ca|bzw|u\.\s?a|evtl|ggf|Nr|Str)\./;

test("six C-test texts, two per band, each yields exactly 20 gaps", () => {
  assert.deepEqual(C.ctest.map((t) => t.band), ["B1", "B1", "B2", "B2", "C1", "C1"]);
  for (const t of C.ctest) {
    assert.ok(!ABBREV.test(t.text), t.id + " contains an abbreviation");
    assert.equal(CTest.build(t.text).gaps.length, 20, t.id);
  }
});

test("C-test alternatives point at existing gaps", () => {
  for (const t of C.ctest) {
    for (const k of Object.keys(t.alts || {})) assert.ok(Number(k) >= 0 && Number(k) < 20, t.id + " alt " + k);
  }
});

test("grammar: 40 items, 4 per zone, well-formed", () => {
  assert.equal(C.grammar.length, 40);
  for (const z of ZONES) assert.equal(C.grammar.filter((i) => i.zone === z).length, 4, z);
  for (const i of C.grammar) {
    if (i.type === "fill") {
      assert.equal(i.prompt.split("___").length, 2, i.id + " needs exactly one ___");
      assert.ok(i.accept.length > 0, i.id);
    } else {
      assert.equal(i.type, "choice", i.id);
      assert.ok(Number.isInteger(i.answer) && i.answer >= 0 && i.answer < i.options.length, i.id);
    }
  }
});

test("haben/sein items avoid sitzen, stehen, liegen (sein in southern German)", () => {
  for (const i of C.grammar.filter((x) => x.zone === "AUX")) {
    assert.doesNotMatch(i.prompt, /\b(ge)?(sessen|standen|legen|sitz|steh|lieg)/i, i.id);
  }
});

test("reading and listening: 2 texts × 5 items each, valid answers", () => {
  for (const set of [C.lesen, C.hoeren]) {
    assert.equal(set.length, 2);
    for (const t of set) {
      assert.equal(t.items.length, 5, t.id);
      for (const i of t.items) assert.ok(i.answer >= 0 && i.answer < i.options.length, i.id);
    }
  }
  for (const h of C.hoeren) assert.match(h.url, /^https:\/\//, h.id);
});

test("ids are unique across the whole test", () => {
  const ids = [
    ...C.self.statements.map((s) => s.id), ...C.ctest.map((t) => t.id), ...C.grammar.map((i) => i.id),
    ...C.lesen.flatMap((t) => [t.id, ...t.items.map((i) => i.id)]),
    ...C.hoeren.flatMap((t) => [t.id, ...t.items.map((i) => i.id)]),
    ...C.schreiben.map((e) => e.id), ...C.sprechen.map((f) => f.id),
  ];
  assert.equal(new Set(ids).size, ids.length);
});

test("self-assessment: every statement has German and Russian", () => {
  assert.ok(C.self.statements.length >= 16);
  for (const s of C.self.statements) assert.ok(s.de && s.ru && s.group, s.id);
});

test("writing and speaking tasks are complete", () => {
  assert.deepEqual(C.schreiben.map((e) => e.words), [120, 180]);
  assert.equal(C.sprechen.find((f) => f.kind === "dialog").turns.length >= 4, true);
});
