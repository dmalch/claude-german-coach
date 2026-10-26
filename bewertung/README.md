# Grading writing and speaking

Commands below run from the repository root; paths are given as `bewertung/...`. Why the
procedure looks like this is explained in [`docs/method.md`](../docs/method.md), section
"Grading writing and speaking".

Where things are:

- **Task cards**: in the learner's content pack (`placement_test.content` in their profile;
  the example is `packs/example/content.js`). Writing tasks are in `schreiben[]` (`E1`,
  `E2`), speaking tasks in `sprechen[]` (`F1`, `F2`). A learner's own pack also holds their
  secret anchor texts, so never open it: take the task cards out with node, which prints
  nothing else:

      node -e 'const p = require(process.argv[1]); console.log(JSON.stringify({schreiben: p.schreiben, sprechen: p.sprechen}, null, 2))' <pack>
- **Learner texts**: not in this repository, but in the database of the learner's published
  page. Contract and fields: [`placement-test/README.md`](../placement-test/README.md)
  (collection `answers`; `responses.text` for E1, E2 and F1; `responses["F2-1"]` … `["F2-n"]`
  for F2).
- **Rubrics and reference texts**: `bewertung/RUBRIK.md` (writing), `bewertung/SPRECHEN.md`
  (speaking), `bewertung/anker/` (MERLIN learner texts, CC BY-SA 4.0), and the known-answer
  set `bewertung/testset.json`. These four are frozen; see [`NOTES.md`](NOTES.md).
- **Results**: graded reports go to `<data_dir>/tests/`; errors from writing go to the error
  log `<data_dir>/fehler.md`.

## LanguageTool

LanguageTool runs locally, so learner texts never leave the machine. It is started on demand
and never kept running as a standing process:

1. `languagetool-server --port 8081`. In a Claude session, start it with `run_in_background`,
   not with `&`. It takes about 20 seconds to start.
2. After grading, stop the process. The server listens on 127.0.0.1 only. Do not leave it
   running between grading sessions.

`bewertung/lt.py` sends the text to `http://localhost:8081/v2/check`. Set `LT_SERVER` to use
another URL, for example a different port. Point it only at a server you run yourself.

## Grading writing (E1, E2)

1. Make sure LanguageTool is running (above).
2. `python3 bewertung/lt.py < text.txt > lt.json`
3. Run a separate agent in a clean context (Agent tool, general-purpose). The prompt:

   > Прочитай `bewertung/RUBRIK.md` и образцы в `bewertung/anker/`. Задание: <текст
   > задания>. Текст ученика: <текст>. Вывод LanguageTool: <lt.json>. Ответь JSON по рубрике

   Pass the agent no chat history.
4. Save the result in `<data_dir>/tests/` (or the Cockpit database, once that page exists).
   Edits of kind `error` go into `<data_dir>/fehler.md`; `style` edits do not.

A dispute with a grade: the same agent process, in a new context, with both versions side by
side («исходная правка» / «довод ученика»). The grade changes only by its verdict.

## Grading speaking (F1, F2)

This is dictation, not writing. Speech recognition silently fixes some grammar errors, so
grammatical accuracy is not graded from it (principle 9 in
[`docs/method.md`](../docs/method.md)). Speaking has its own rubric,
`bewertung/SPRECHEN.md`, not `RUBRIK.md`.

1. Run a separate agent in a clean context (Agent tool, general-purpose). The prompt:

   > Прочитай `bewertung/SPRECHEN.md`. Задание: <текст задания из `content.js` →
   > `sprechen[]`>. Текст ученика (надиктован): <текст>. Ответь JSON по рубрике

   Here `content.js` is the learner's content pack; take the task out with the node command
   above. LanguageTool is not needed for this step.
2. Save the result in `<data_dir>/tests/` (or the Cockpit database). Corrections from this
   grading do **not** go into `<data_dir>/fehler.md`: the source of a deviation (the learner
   or the dictation's correction) is unknown, see `SPRECHEN.md`.

## Running the known-answer test set (after any change to RUBRIK.md)

1. Give the grader agent only `id` and `text` of each item in `bewertung/testset.json`
   (never `errors`), in the mode «тестовый набор». Save its reply as `grader-testset.json`.
2. `python3 bewertung/check_testset.py bewertung/testset.json grader-testset.json`
3. `GATE FAIL` means the rubric is not used on real texts until it is fixed.

The gate requires recall ≥ 0.85, precision ≥ 0.90 and at most one false alarm on the correct
sentences. Only edits with `kind == "error"` count; `style` edits are free. The script also
prints category accuracy, which is not gated, and lists every miss (`MISSED`) and every
false alarm (`FALSE`). The exit status is 1 when the gate fails.

`SPRECHEN.md` is not checked with the test set: it produces no `edits`, so there are no
missed or false corrections for `check_testset.py` to catch.

Unit tests for the two scripts:

    python3 -m unittest discover -s bewertung

## Grader runs

Record every gate run here.

| Date | Rubric version | Recall | Precision | Category accuracy | False alarms on correct sentences | Result |
|---|---|---|---|---|---|---|
| 2026-09-22 | 1 | 1.00 | 1.00 | 0.96 | 0 | GATE PASS. The one category mismatch: e05 was graded as a single GEN edit (*eine gute Tipp → einen guten Tipp*), as the rubric asks; the key expected GEN + ADJ. |
