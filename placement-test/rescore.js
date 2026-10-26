#!/usr/bin/env node
/* Recompute the automatic scores of a sat placement test from its exported answers.
 *
 *   node placement-test/rescore.js --content PACK --answers DIR [--anchors A4,A5]
 *
 * DIR holds one JSON file per `answers` document (<unit>.json), as the ArtifactData
 * tool writes them with out_dir. Every unit is scored with the same code the page
 * ran at submit (autoscore.js) and compared with the `auto` stored in its document:
 * a mismatch means the pack, the engine or the stored copy changed since the
 * learner sat the test, and the report must not be written from it.
 *
 * The output is JSON with sorted keys, so two runs can be diffed. It never holds a
 * text or a per-gap answer: C-test scores are totals per text, and the texts given
 * with --anchors (the learner's secret anchors) are marked as such. */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const CTest = require("./ctest.js");
const Scoring = require("./scoring.js");
const AutoScore = require("./autoscore.js");

function parseArgs(argv) {
  const out = { anchors: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--content") out.content = argv[++i];
    else if (a === "--answers") out.answers = argv[++i];
    else if (a === "--anchors") out.anchors = String(argv[++i] || "").split(",").filter(Boolean);
    else throw new Error("unknown argument " + a);
  }
  if (!out.content || !out.answers) {
    throw new Error("usage: rescore.js --content PACK --answers DIR [--anchors A4,A5]");
  }
  return out;
}

// Stable JSON: keys sorted at every level, so identical scores give identical bytes.
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  }
  return v;
}

function same(a, b) {
  return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

function rescore(pack, docs, anchors) {
  const auto = AutoScore.create(pack, CTest, Scoring);
  const units = {};
  const missing = [];
  for (const u of AutoScore.units(pack)) {
    const doc = docs[u.id];
    if (!doc) {
      missing.push(u.id);
      continue;
    }
    const recomputed = auto.score(u.kind, u.id, doc);
    const entry = {
      kind: u.kind,
      recomputed,
      stored: doc.auto == null ? null : doc.auto,
      matches: doc.auto != null && same(recomputed, doc.auto),
      contentVersion: doc.contentVersion || null,
      submitted: Boolean(doc.finishedAt),
    };
    if (anchors.includes(u.id)) entry.anchor = true;
    units[u.id] = entry;
  }

  const totals = {};
  const ct = pack.ctest.filter((t) => units[t.id]).map((t) => units[t.id].recomputed);
  if (ct.length) {
    totals.ctest = {
      strict: ct.reduce((a, r) => a + r.strict, 0),
      tolerant: ct.reduce((a, r) => a + r.tolerant, 0),
      max: ct.reduce((a, r) => a + r.max, 0),
      byBand: {},
    };
    for (const r of ct) {
      const b = (totals.ctest.byBand[r.band] = totals.ctest.byBand[r.band] || { strict: 0, max: 0 });
      b.strict += r.strict;
      b.max += r.max;
    }
    if (ct.length === pack.ctest.length) {
      // Thresholds are provisional until an external test calibrates them.
      totals.ctest.provisionalLevel = Scoring.estimateCTestLevel(ct);
    }
  }
  for (const id of ["B", "C", "D"]) {
    if (units[id]) totals[id] = { correct: units[id].recomputed.correct, max: units[id].recomputed.max };
  }

  const versions = [...new Set(Object.values(units).map((u) => u.contentVersion).filter(Boolean))];
  return {
    packVersion: pack.version || null,
    answeredWithVersions: versions,
    units,
    totals,
    missing,
    allMatch: missing.length === 0 && Object.values(units).every((u) => u.matches),
  };
}

function loadDocs(dir) {
  const docs = {};
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".json")) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
    docs[doc.unit || name.slice(0, -5)] = doc;
  }
  return docs;
}

function main(argv) {
  const args = parseArgs(argv);
  const pack = require(path.resolve(args.content));
  const result = rescore(pack, loadDocs(path.resolve(args.answers)), args.anchors);
  process.stdout.write(JSON.stringify(sortKeys(result), null, 2) + "\n");
  return result.allMatch ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    process.stderr.write("rescore: " + e.message + "\n");
    process.exitCode = 2;
  }
}

module.exports = { rescore, sortKeys };
