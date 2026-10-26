# Placement test page

`index.html` is the Einstufungstest page. It is published as a private claude.ai artifact
with a database (`db`). The learner takes the test on the page, and the page writes one
document per test unit into the collection `answers`. Claude reads them with ArtifactData.

This file is the reference for whoever reads those answers (the grader, the weekly review,
`rescore.js`), so they do not need to read the page code. The method behind the test is in
[`docs/method.md`](../docs/method.md).

## Files

| File | Role |
|---|---|
| `index.html` | the page: views, timers, storage |
| `ctest.js` | C-test engine (`CTest`): builds the gaps of a text and scores a text |
| `scoring.js` | grammar, reading, listening and self-assessment scoring, and the provisional C-test level (`Scoring`) |
| `autoscore.js` | the `auto` computation per unit, shared by the page and `rescore.js` |
| `rescore.js` | recomputes `auto` from exported `answers` documents |
| `ergebnis.stub.js` | the empty results file (see "Results file") |
| `test/` | node tests for the engine, the scoring and a content pack |

The page loads `ctest.js`, `scoring.js`, `autoscore.js`, `content.js` (the content pack) and `ergebnis.js` as
sibling files. `python3 build_page.py --profile NAME [--out DIR]` assembles them for one
learner: the engine, that learner's pack, and their results file or the stub, byte for byte.

Recompute auto scores from exported documents:

    node placement-test/rescore.js --content PACK --answers DIR [--anchors A4,A5]

## Reading the answers

    ArtifactData list collection=answers url=<page url>

The page URL is recorded in `<data_dir>/published/placement-test.json`.

## Documents

13 documents, document id = unit id:

- `self`: Teil 0, self-assessment
- `A1` … `A6`: Teil A, C-test (six texts)
- `B`: Teil B, grammar diagnostic
- `C`: Teil C, Lesen
- `D`: Teil D, Hören
- `E1`, `E2`: Teil E, Schreiben (formal letter, forum post)
- `F1`, `F2`: Teil F, Sprechen (monologue, phone dialog)

A document exists only once its unit has been started.

## Document fields

Every document is a flat object:

| Field | Type | Meaning |
|---|---|---|
| `unit` | string | unit id, the same as the document id |
| `startedAt` | string (ISO) | when "Начать" was pressed |
| `finishedAt` | `null` or string (ISO) | when the unit was submitted; `null` until then. For C-test texts it is capped at the deadline, `startedAt + limitSec` |
| `overtimeSec` | number | seconds beyond `limitSec`, computed at submit; 0 if submitted within the limit, and always 0 for C-test texts |
| `limitSec` | number | the unit's time budget on the page, in seconds (table below) |
| `responses` | object or array | the learner's answers; the shape depends on the unit (below) |
| `auto` | `null` or object | the automatic score, computed once at submit (below); `null` before submit, or if the computation failed |
| `contentVersion` | string | the pack's `version` at the moment the unit was **started**. Set at start only, never updated by later answers |
| `updatedAt` | string (ISO) | time of the last change to the document (start, answer, submit) in any view |
| `writerId` | string | id of the view (one page load in one tab) that made the last change |
| `writerSeq` | number | change counter within that `writerId`, growing with every write |

`writerId` and `writerSeq` resolve conflicts between tabs and devices (see "Several tabs and
devices"). Reading answers does not need them.

## `responses` by unit

For object-shaped responses, **a missing key means unanswered**: a key appears only once the
learner has answered that item.

- **`self`**: `{ [statementId]: 0..3 }`. The value is an **index** into `self.scale` of the
  pack (`["kaum", "mit Mühe", "ziemlich gut", "mühelos"]`), **not 1..4**. `0` is "kaum",
  `3` is "mühelos". `Scoring.selfAssessment` averages these indexes, so read its `mean` on
  the 0..3 scale too: a mean of 2.0 is "ziemlich gut", not "mit Mühe".
- **`A1` … `A6`** (C-test): an array of strings indexed by gap index
  (`CTest.build(text).gaps[i].index`, from 0), created with one `""` per gap at start:
  `["", "he", …]`. A value is what the learner typed **after** the printed half of the word;
  `""` means the gap was not touched. Pass it as is to `CTest.scoreText(built, responses,
  alts)`. Gap indexes depend on the text in the pack, so they mean nothing without the pack of
  the same version (see "Content version").
- **`B`** (grammar): `{ [itemId]: "text" | n }`. `fill` items store the typed string as is;
  `choice` items store the integer index of the chosen option (`item.answer` in the pack is
  an index too, compared with `===`).
- **`C`, `D`** (Lesen, Hören): `{ [itemId]: n }`, the 0-based index of the chosen option.
- **`E1`, `E2`, `F1`**: `{ text: "…" }`, the whole answer as one string.
- **`F2`** (dialog): `{ "F2-1": "…", …, "F2-n": "…" }`, one field per receptionist turn, in
  order (`"F2-" + (i + 1)` for turn `i` from 0; the example pack has five turns). The value is
  the dictated or typed reply to that turn.

## `auto`: computed once at submit, stored, not recomputed by the page

- `self` → `Scoring.selfAssessment(...)`: per group (`Hören`, `Lesen`, `Sprechen`, …)
  `{ answered, total, mean }`, with `mean` on the 0..3 scale (`null` if nothing was
  answered).
- `A1` … `A6` → `{ band, strict, tolerant, max }`: `band` from the pack (B1, B2 or C1 for this
  text); `strict`, `tolerant` and `max` from `CTest.scoreText`.
- `B` → `Scoring.scoreGrammar(...)`: `{ correct, max, byZone: { ZONE: { correct, max } } }`.
- `C`, `D` → `{ correct, max, byText: { <textId>: { correct, max }, … } }`.
- `E1`, `E2`, `F1` → `{ words }`, a plain word count. This is not a grade: writing and speech
  are graded separately, by an agent against the rubric (see
  [`bewertung/README.md`](../bewertung/README.md)).
- `F2` → `{ words }`, the sum over all turns.

`auto` is stored at submit so that grading does not depend on recomputation. The C-test can
still be rescored when needed, for example to apply a longer list of accepted alternatives,
with `rescore.js` and under the rule below.

## Content version

The pack's `version` is written into every unit document as `contentVersion` when the unit
starts. While a learner is taking the test, the pack must not change, so that the C-test gap
indexes stored in `responses` stay valid for the same texts.

Rule: **rescore a C-test only with the pack whose `version` equals the document's
`contentVersion`.** Keep old pack versions in the learner's private git history, so the pack
of any version can be recovered with `git show <commit>:<path>`.

Any change to a pack (a new alternative, a corrected text) must raise `version` to a new
value, and the page is then republished with engine and pack together. Old documents keep
their old `contentVersion` and are read with the old pack; new ones with the new pack. A date
alone is not enough as a version: a second change on the same day needs its own suffix
(`"YYYY-MM-DD.2"`). When the page finds documents with another `contentVersion`, it tells the
learner and carries on.

## `limitSec` by unit

| Unit | `limitSec` | Source |
|---|---|---|
| `self` | 300 (5 min) | `sections` → `self.minutes` |
| `A1` … `A6` | 300 (5 min) each | `sections` → `A.minutes` (30) divided by the number of texts |
| `B` | 900 (15 min) | `sections` → `B.minutes` |
| `C` | 900 (15 min) | `sections` → `C.minutes` |
| `D` | 1500 (25 min) | `sections` → `D.minutes` |
| `E1` | 1200 (20 min) | `schreiben[0].minutes` |
| `E2` | 1800 (30 min) | `schreiben[1].minutes` |
| `F1` | 360 (6 min) | the monologue's speaking time (`minutes` of the `monolog` task, 3) plus 3 minutes to read the card and start dictation; this split exists only in the page |
| `F2` | 540 (9 min) | the rest of the 15-minute Teil F budget (900 − 360) |

## Timers and overtime

Teil A has a **hard** timer: at `startedAt + limitSec` the text is submitted with what was
typed, also on load if it ran out while the page was closed. All other units are **soft**:
the clock turns yellow after the limit, but the unit can be submitted later.

A unit's clock runs from `startedAt` in **wall-clock time**, even while the page is closed.
A large `overtimeSec` on a soft unit therefore almost always means the learner paused inside
the part (closed the page and came back later), not that they answered slowly. Do not read
`overtimeSec` as speed without checking for a pause.

## Several tabs and devices

Several views (tabs, devices) may hold the same unit. The page never lets a second view reset
answers or restart the hard clock:

- Of two copies of a unit, the fresher wins: a submitted copy beats an unsubmitted one,
  otherwise the later `updatedAt` wins.
- Every write is mirrored to `localStorage` (key `einstufung:<unit>`) as
  `{ synced, mine, body }`. At load, an unsynced local copy is pushed to the database only if
  it is fresher than the database copy and differs from it. A synced local copy that the
  database no longer has was deleted there and is dropped.
- A start re-reads the database and the local copy first. If another view already started
  the unit, this view continues that attempt instead of starting a new one.
- Changes from elsewhere arrive through one database subscription and through the browser's
  `storage` event (other tabs of the same browser). A copy written by another view is adopted;
  if its unit is open in this view, the unit turns read-only here until reload. Neither path
  writes to the database.
- Every write carries the view's `writerId` and a growing `writerSeq`. Copies with the view's
  own `writerId` are its own echoes and are ignored; two copies from the same other view are
  ordered by `writerSeq`. No wall clock is involved in these decisions.
- At a C-test deadline a view submits only texts it started or answered itself, or whose
  newest copy at load was this browser's own. A text adopted from another view is submitted
  60 seconds after the deadline, from the database copy, with `finishedAt` set to the
  deadline. This gives the view that was writing it the chance to submit first.

## Without a database

If the database is not available, the page keeps answers only in this browser's
`localStorage`, and the header says "только в браузере". The results view then offers
"Скопировать ответы": a JSON object `{ contentVersion, answers }` with all unit documents, for
the learner to paste into the chat.

## Encoding guard

The page refuses to run if the page or its sibling files were decoded with the wrong
character set, because the C-test gaps would land in the wrong places. It checks the pack's
`encodingProbe`, a C-test build over a sentence with umlauts, and the umlaut transliteration
of fill scoring.

## Content pack format

A content pack is one file, `content.js`. It defines `window.EinstufungContent` in the
browser and exports the same object under node, with the same wrapper as `ctest.js`.
`packs/example/content.js` is the example; a learner's own pack is private. The node tests in
`test/content.test.js` check the rules marked *(tested)* below.

Top-level fields:

| Field | Content |
|---|---|
| `version` | string; becomes `contentVersion` of every unit started with this pack |
| `encodingProbe` | exactly the string `"äöüß"` |
| `sections` | the seven sections of the test |
| `self` | self-assessment scale and statements |
| `ctest` | the six C-test texts |
| `grammar` | the 40 grammar items |
| `lesen` | the two reading texts with items |
| `hoeren` | the two listening episodes with items |
| `schreiben` | the two writing tasks |
| `sprechen` | the monologue and the dialog task |

All ids must be unique across the whole pack: statements, texts, items and tasks *(tested)*.

**`sections`**: an array of `{ id, title, minutes, sitting, timer }` with ids `self`, `A`,
`B`, `C`, `D`, `E`, `F`. `sitting` is 1 or 2 and groups the sections into the two sittings.
`timer` is `"hard"` (Teil A) or `"soft"`. `minutes` sets the unit budgets as in the
`limitSec` table.

**`self`**: `{ scale, statements }`. `scale` holds the four labels. Each statement is
`{ id, group, de, ru }`: a German "Ich kann…" sentence, its Russian translation, and a group
heading (a skill or a topic). At least 16 statements, each with `de`, `ru` and `group`
*(tested)*.

**`ctest`**: six texts `{ id, band, topic, text, alts }` with ids `A1` … `A6`.

- Bands in order `B1, B1, B2, B2, C1, C1`: two texts per band *(tested)*.
- `text` has at least three sentences and must yield exactly 20 gaps under the C-test rule
  *(tested)*. Sentences end at `.`, `!`, `?` or `…`, with an optional closing quote, before a
  space or the end of the text.
- A `^` directly before a word protects it from becoming a gap (use it for names). The marker
  is removed from the displayed text. One-letter words and protected words are skipped when
  counting every second word.
- No abbreviations (`z. B.`, `usw.`, `d. h.`, `ca.`, `bzw.`, `u. a.`, `evtl.`, `ggf.`,
  `Nr.`, `Str.`), since a period would end a sentence *(tested)*. Numbers such as `3.000` are
  safe.
- `alts`: an object from gap index (0–19) to an array of further accepted words *(tested:
  keys point at existing gaps)*. The original word is always accepted.
- `topic` is shown on the page. Take the topics from the learner's `[goal].domains`; the
  tests do not prescribe any.

**`grammar`**: 40 items, four in each zone `ART`, `PRAEP`, `ADJ`, `WO`, `AUX`, `PASS`,
`KONJ2`, `KONN`, `REL`, `NDEKL` *(tested)*. The page shows them round-robin across zones, so
four items of one zone never stand in a row.

- `fill`: `{ id, zone, type: "fill", prompt, accept }`. `prompt` contains exactly one `___`
  *(tested)*. When `___` directly follows a letter, the field is an ending field. `accept` is
  a non-empty list *(tested)*; a typed answer matches ignoring case, outer and repeated
  spaces, a final `.`, `!` or `?`, and with ae/oe/ue/ss accepted for ä/ö/ü/ß.
- `choice`: `{ id, zone, type: "choice", prompt, options, answer }`, where `answer` is the
  integer index of the correct option *(tested)*.
- `AUX` items avoid *sitzen*, *stehen* and *liegen*, which take *sein* in southern German
  *(tested)*.

**`lesen`**: two texts `{ id, title, text, items }` with five items each *(tested)*. An item
is `{ id, prompt, options, answer }`, with `answer` a valid option index. A text that
contains "Sehr geehrte" is styled as a letter.

**`hoeren`**: two episodes `{ id, title, url, listenMinutes, note, items }` with five items
each *(tested)*. `url` is an `https://` link to the episode *(tested)*; the page labels the
episodes as Deutsche Welle and opens the link in a new tab. `note` is the Russian line on the
episode card (for example how many times to listen).

**`schreiben`**: two tasks `{ id, title, register, situation, points, words, minutes }` with
ids `E1` and `E2`. `words` is the target length, 120 and 180 *(tested)*. `points` is the list
of content points. `minutes` sets the unit budget.

**`sprechen`**: two tasks.

- Monologue: `{ id: "F1", kind: "monolog", prompt, points, minutes }`. `minutes` is the
  speaking time.
- Dialog: `{ id: "F2", kind: "dialog", situation, turns }`. Each turn is `{ praxis, hint }`:
  the line of the other side and an optional Russian hint the learner can open. At least four
  turns *(tested)*. The page labels this unit "Telefonat mit der Praxis".

## Results file

The page loads `ergebnis.js`, which sets `window.EinstufungErgebnis`. `ergebnis.stub.js` sets
it to `null`, and `build_page.py` uses the stub when the learner has no results file yet.

- While it is `null`, the results view shows only the automatic parts (C-test with the
  provisional level, grammar map, Lesen and Hören), and says that Claude will grade writing
  and speaking.
- When it is set, the results view shows the graded result, and a page that loads with all
  units submitted opens on the results view.

The object holds the graded result in the fields the results view reads: `checked` (the
grading date), `lead`, `thesis`, `scale` and `ladder` (the level ladder per skill, with
`from`/`to` ranges), `ctestLevel`, `goals`, `always`, `calls`, `self` (self-assessment against
measurement, `verdict` one of `low`, `match`, `high`), `selfNote`, `ctest` (`anchors`, `bands`,
`types`, `anchorNote`, `texts`), `grammar`, `lesen`, `hoeren`, `schreibenNote`, `schreiben`,
`sprechenNote`, `sprechen`, `fehler`, `next` and `cat` (category code to name). Strings may
use `~~struck~~`, `**correction**` and `*italic*`. In `schreiben[].edits` an edit is
`{ wrong, right, cat, error, rule, source }`, with `error` a boolean (the rubric's
`kind === "error"`).

**Anchor texts.** List them in `ctest.anchors`, and give them no item-level entries in
`ctest.texts`. Their errors appear only as counts in `ctest.types[].anchors`. The learner must
never see the item-level answers of an anchor text.
