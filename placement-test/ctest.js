/* C-test engine for the Einstufungstest and the later Kontrolltests.
 * build() turns an authored text into text runs and gaps by the classic rule:
 * first and last sentence whole; from the second sentence on, the second half
 * of every second word is deleted (the larger half when the length is odd).
 * Loaded as a browser global (CTest) and by node tests (module.exports). */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CTest = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const LETTERS = "A-Za-zÄÖÜäöüß";
  const WORD = new RegExp("[" + LETTERS + "]+", "g");
  const PROTECTED = new RegExp("\\^([" + LETTERS + "]+)", "g");
  // Texts must not contain abbreviations ("z. B."): content tests enforce it.
  // Numbers with dots (e.g. 3.000) are safe; a sentence ends at .!?… followed by
  // an optional closing quote, then whitespace or end-of-text.
  const SENTENCE = /[\s\S]*?[.!?…]+["»«“”‘’]?(?:\s+|$)/g;

  function split(word) {
    const keep = Math.floor(word.length / 2);
    return { shown: word.slice(0, keep), answer: word.slice(keep) };
  }

  function unmark(text) {
    const protectedAt = new Set();
    let clean = "";
    let last = 0;
    for (const m of text.matchAll(PROTECTED)) {
      clean += text.slice(last, m.index);
      protectedAt.add(clean.length);
      clean += m[1];
      last = m.index + m[0].length;
    }
    return { clean: clean + text.slice(last), protectedAt };
  }

  function build(text, gapCount = 20) {
    const { clean, protectedAt } = unmark(text);
    const sentences = [...clean.matchAll(SENTENCE)];
    if (sentences.length < 3) {
      throw new Error("C-test text needs at least 3 sentences, has " + sentences.length);
    }
    const zoneStart = sentences[1].index;
    const zoneEnd = sentences[sentences.length - 1].index;
    const gaps = [];
    let eligible = 0;
    for (const m of clean.matchAll(WORD)) {
      if (m.index < zoneStart) continue;
      if (m.index >= zoneEnd || gaps.length === gapCount) break;
      if (m[0].length < 2 || protectedAt.has(m.index)) continue;
      eligible += 1;
      if (eligible % 2 === 0) {
        gaps.push({ index: gaps.length, start: m.index, word: m[0], ...split(m[0]) });
      }
    }
    if (gaps.length < gapCount) {
      throw new Error("C-test text yields " + gaps.length + " gaps, needs " + gapCount);
    }
    const parts = [];
    let pos = 0;
    for (const g of gaps) {
      parts.push({ type: "text", value: clean.slice(pos, g.start) });
      parts.push({ type: "gap", index: g.index, shown: g.shown, answer: g.answer });
      pos = g.start + g.word.length;
    }
    parts.push({ type: "text", value: clean.slice(pos) });
    return { clean, gaps, parts };
  }

  function fold(s) {
    return String(s).trim().toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  }

  function distance(a, b) {
    const row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const next = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = row[j];
        row[j] = next;
      }
    }
    return row[b.length];
  }

  function scoreGap(gap, response, alts) {
    const typed = String(response || "").trim();
    if (!typed) return { strict: false, tolerant: false };
    const accepted = [gap.word].concat(alts || []).map(fold);
    const asRest = fold(gap.shown + typed);
    const strict = accepted.includes(asRest) || accepted.includes(fold(typed));
    const tolerant = strict || accepted.some((w) => w.length >= 4 && distance(asRest, w) <= 1);
    return { strict, tolerant };
  }

  function scoreText(built, responses, alts) {
    let strict = 0;
    let tolerant = 0;
    built.gaps.forEach((g, i) => {
      const r = scoreGap(g, responses && responses[i], alts && alts[i]);
      strict += r.strict ? 1 : 0;
      tolerant += r.tolerant ? 1 : 0;
    });
    return { strict, tolerant, max: built.gaps.length };
  }

  return { split, build, fold, scoreGap, scoreText };
});
