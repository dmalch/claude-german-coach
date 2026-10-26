/* Auto-scoring for the Einstufungstest: grammar diagnostic, reading and
 * listening items, self-assessment, and the provisional C-test level.
 * The level bands are provisional until the first onSET result calibrates them
 * (design §5). Browser global: Scoring. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Scoring = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function norm(s) {
    return String(s == null ? "" : s).trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  }

  function scoreItem(item, response) {
    if (item.type === "choice") {
      if (response == null || typeof item.answer !== "number") return false;
      return response === item.answer;
    }
    if (response == null || String(response).trim() === "") return false;
    return item.accept.some((a) => norm(a) === norm(response));
  }

  function scoreGrammar(items, responses) {
    const byZone = {};
    let correct = 0;
    for (const item of items) {
      const zone = (byZone[item.zone] = byZone[item.zone] || { correct: 0, max: 0 });
      zone.max += 1;
      if (scoreItem(item, responses[item.id])) {
        zone.correct += 1;
        correct += 1;
      }
    }
    return { correct, max: items.length, byZone };
  }

  function scoreChoiceSet(items, responses) {
    return {
      correct: items.filter((i) => scoreItem(i, responses[i.id])).length,
      max: items.length,
    };
  }

  function selfAssessment(statements, responses) {
    const out = {};
    for (const st of statements) {
      const g = (out[st.group] = out[st.group] || { sum: 0, answered: 0, total: 0 });
      g.total += 1;
      const v = responses[st.id];
      if (typeof v === "number") {
        g.sum += v;
        g.answered += 1;
      }
    }
    for (const g of Object.values(out)) {
      g.mean = g.answered ? g.sum / g.answered : null;
      delete g.sum;
    }
    return out;
  }

  const PASS = 0.6;
  const PLUS = 0.4;

  function bandRate(results, band) {
    const rows = results.filter((r) => r.band === band);
    if (!rows.length) throw new Error("no C-test result for band " + band);
    const strict = rows.reduce((a, r) => a + r.strict, 0);
    const max = rows.reduce((a, r) => a + r.max, 0);
    return strict / max;
  }

  function estimateCTestLevel(results) {
    const b1 = bandRate(results, "B1");
    const b2 = bandRate(results, "B2");
    const c1 = bandRate(results, "C1");
    if (b1 < PASS) return "<B1";
    if (b2 < PLUS) return "B1";
    if (b2 < PASS) return "B1+";
    if (c1 < PLUS) return "B2";
    if (c1 < PASS) return "B2+";
    return "C1";
  }

  return { scoreItem, scoreGrammar, scoreChoiceSet, selfAssessment, estimateCTestLevel };
});
