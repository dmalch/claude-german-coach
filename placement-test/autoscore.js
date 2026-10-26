/* Automatic scores of one unit, exactly as the page stores them in `auto` at submit.
 * One copy, shared by index.html and rescore.js: a rescore that recomputed the
 * scores with its own code could silently disagree with what the learner was shown.
 * Loaded as a browser global (AutoScore) and by node (module.exports). */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AutoScore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const countWords = (s) => String(s || "").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

  // The units of a pack in page order, with the kind that decides how each is scored.
  function units(K) {
    const monolog = K.sprechen.find((f) => f.kind === "monolog");
    const dialog = K.sprechen.find((f) => f.kind === "dialog");
    return [
      { id: "self", kind: "self" },
      ...K.ctest.map((t) => ({ id: t.id, kind: "ctest" })),
      { id: "B", kind: "grammar" },
      { id: "C", kind: "lesen" },
      { id: "D", kind: "hoeren" },
      ...K.schreiben.map((e) => ({ id: e.id, kind: "schreiben" })),
      { id: monolog.id, kind: "monolog" },
      { id: dialog.id, kind: "dialog" },
    ];
  }

  // K = content pack, CT = CTest, SC = Scoring.
  function create(K, CT, SC) {
    const CTEXT = Object.fromEntries(K.ctest.map((t) => [t.id, t]));
    const DIALOG = K.sprechen.find((f) => f.kind === "dialog");
    const turnKey = (i) => DIALOG.id + "-" + (i + 1);

    const built = {};
    const buildError = {};
    for (const t of K.ctest) {
      try { built[t.id] = CT.build(t.text); } catch (e) { buildError[t.id] = e.message; }
    }

    function choiceSets(texts, r) {
      const byText = {};
      let correct = 0;
      let max = 0;
      for (const t of texts) {
        const s = SC.scoreChoiceSet(t.items, r);
        byText[t.id] = s;
        correct += s.correct;
        max += s.max;
      }
      return { correct, max, byText };
    }

    function score(kind, id, doc) {
      const r = doc.responses || {};
      switch (kind) {
        case "self": return SC.selfAssessment(K.self.statements, r);
        case "ctest": return built[id] ? Object.assign({ band: CTEXT[id].band }, CT.scoreText(built[id], r, CTEXT[id].alts)) : null;
        case "grammar": return SC.scoreGrammar(K.grammar, r);
        case "lesen": return choiceSets(K.lesen, r);
        case "hoeren": return choiceSets(K.hoeren, r);
        case "dialog": return { words: DIALOG.turns.reduce((a, t, i) => a + countWords(r[turnKey(i)]), 0) };
        default: return { words: countWords(r.text) };
      }
    }

    return { score, built, buildError, turnKey };
  }

  return { countWords, units, create };
});
