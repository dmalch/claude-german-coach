const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const CTest = require("../ctest.js");
const Scoring = require("../scoring.js");
const AutoScore = require("../autoscore.js");
const { rescore } = require("../rescore.js");

// Same pack selection as content.test.js. Answers are synthesised here from the
// pack itself, so the tests hold for any well-formed pack and no learner's real
// answers are needed. Failures report ids and numbers, never a text.
const PACK = process.env.GERMAN_COACH_PACK
  ? path.resolve(process.env.GERMAN_COACH_PACK)
  : path.join(__dirname, "..", "..", "packs", "example", "content.js");
const K = require(PACK);

function perfectDocs() {
  const auto = AutoScore.create(K, CTest, Scoring);
  const docs = {};
  for (const u of AutoScore.units(K)) {
    let responses;
    if (u.kind === "ctest") responses = auto.built[u.id].gaps.map((g) => g.answer);
    else if (u.kind === "grammar") {
      responses = Object.fromEntries(K.grammar.map((i) => [i.id, i.type === "fill" ? i.accept[0] : i.answer]));
    } else if (u.kind === "lesen" || u.kind === "hoeren") {
      const set = u.kind === "lesen" ? K.lesen : K.hoeren;
      responses = Object.fromEntries(set.flatMap((t) => t.items.map((i) => [i.id, i.answer])));
    } else if (u.kind === "self") responses = Object.fromEntries(K.self.statements.map((s) => [s.id, 2]));
    else if (u.kind === "dialog") responses = { [auto.turnKey(0)]: "Guten Tag, hier spricht jemand." };
    else responses = { text: "Ein kurzer Text mit sieben Wörtern hier." };
    const doc = { unit: u.id, responses, finishedAt: "2026-01-01T10:00:00Z", contentVersion: K.version };
    doc.auto = auto.score(u.kind, u.id, doc);
    docs[u.id] = doc;
  }
  return docs;
}

test("a perfect sitting rescores to full marks and matches what was stored", () => {
  const r = rescore(K, perfectDocs(), []);
  assert.equal(r.allMatch, true);
  assert.deepEqual(r.missing, []);
  assert.equal(r.totals.ctest.strict, r.totals.ctest.max);
  assert.equal(r.totals.ctest.max, 20 * K.ctest.length);
  assert.equal(r.totals.ctest.provisionalLevel, "C1");
  assert.equal(r.totals.B.correct, K.grammar.length);
  assert.equal(r.totals.C.correct, r.totals.C.max);
  assert.equal(r.totals.D.correct, r.totals.D.max);
});

test("a changed stored score is reported as a mismatch", () => {
  const docs = perfectDocs();
  const id = K.ctest[0].id;
  docs[id].auto = Object.assign({}, docs[id].auto, { strict: docs[id].auto.strict - 1 });
  const r = rescore(K, docs, []);
  assert.equal(r.allMatch, false);
  assert.equal(r.units[id].matches, false);
});

test("a missing unit fails the whole rescore and gives no level", () => {
  const docs = perfectDocs();
  delete docs[K.ctest[5].id];
  const r = rescore(K, docs, []);
  assert.equal(r.allMatch, false);
  assert.deepEqual(r.missing, [K.ctest[5].id]);
  assert.equal(r.totals.ctest.provisionalLevel, undefined);
});

test("anchors are flagged, and no output carries a text or an answer", () => {
  const anchors = [K.ctest[3].id, K.ctest[4].id];
  const r = rescore(K, perfectDocs(), anchors);
  for (const id of anchors) assert.equal(r.units[id].anchor, true, id);
  const out = JSON.stringify(r);
  for (const t of K.ctest) {
    const built = CTest.build(t.text);
    // Long answer fragments are what would leak a text; short ones ("en") are noise.
    const leaked = built.gaps.filter((g) => g.answer.length >= 5 && out.includes('"' + g.answer + '"'));
    assert.equal(leaked.length, 0, t.id + " answers appear in the output");
    assert.ok(!out.includes(t.text.slice(0, 40)), t.id + " text appears in the output");
  }
});
