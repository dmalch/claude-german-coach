---
name: placement-test
description: Build, publish, check and grade a learner's German placement test (Einstufungstest) — the claude.ai artifact page, its answers database, the automatic scores and the graded report. Use when asked to publish or update the test page, see which parts a learner has done, rescore a sitting, or grade the writing and speaking ("проверь тест", "опубликуй тест", "что я уже сдал").
argument-hint: "--profile NAME [build|publish|status|rescore|grade]"
allowed-tools: Bash Read Write Edit Grep Agent
---

# placement-test

Every command runs from a clone of this repo, called `<core>` below. Put the learner's
profile name in place of `NAME`. Read the profile first:

```sh
python3 <core>/learner_profile.py NAME --check
```

From the profile you need:

- `placement_test.content`, the pack;
- `placement_test.results`, the graded results (if any);
- `placement_test.artifact_url`;
- `ctest.anchors`;
- `files.*`, the learner's data folder.

## Non-negotiables

- **Never Read, cat, grep or diff the learner's pack.** Its two anchor texts are the
  answer key of every later Kontrolltest. Use `shasum -a 256` and `cmp` only. The
  tests and `rescore.js` run on the pack and print ids and numbers.
- **Anchors are reported by error type only.** Never item by item, never the words.
  The other four C-test texts, grammar (B) and Lesen (C) may be shown item by item.
- **No breakdown before every sitting is in.** Until all units are submitted, show the
  learner nothing beyond "done / missing". Fresh error lists shape the writing and
  speaking that are still to come.
- **The graders are fresh agents.** They get the rubric, the anchors, the task and
  the text. They get no chat history and no opinion of yours.
- **The rubrics are frozen.** See `bewertung/NOTES.md`.

## build

```sh
cd "<the session's working directory>"
python3 <core>/build_page.py --profile NAME
```

The output goes to `./build/NAME/placement-test/`, relative to the current directory.
The artifact publisher only takes files from the session's working directory or
scratchpad, so build where you will publish from. `build/` must be gitignored there.

`manifest.json` in the output has a `digest`. Builds are deterministic.

## publish

1. Build. Read `digest` from `build/NAME/placement-test/manifest.json`.
2. Compare it with `<data_dir>/published/placement-test.json`. If they are equal,
   nothing changed. Stop.
3. If `artifact_url` is empty, this is a first publish. Load the `artifact-design`
   and `artifact-capabilities` skills first: the page needs the `db` capability.
   Publish `index.html` with every other script of the build as `files`, by their
   names: `ctest.js`, `scoring.js`, `autoscore.js`, `content.js`, `ergebnis.js`.
   Then write the new URL into the profile.
4. Otherwise publish to `artifact_url`:
   - read the artifact first (`Artifact` action `read`);
   - publish `index.html` plus the same `files` map;
   - omit `capabilities` so the page keeps `db`.
5. Write `<data_dir>/published/placement-test.json` with:
   - `digest`;
   - `published_at`;
   - `core_commit`;
   - `pack_version`;
   - `artifact_url`;
   - the artifact version from the publish result.

   Commit it in the learner's repo, following that repo's commit conventions.

Republishing does not touch the answers database. Check it with `status` afterwards.

## status

Read the `answers` collection of `artifact_url` with the ArtifactData tool:
`action: list`, `collection: answers`. There is one document per unit: `self`,
`A1`–`A6`, `B`, `C`, `D`, `E1`, `E2`, `F1`, `F2`. A unit is submitted when
`finishedAt` is set.

Report done / missing in one line. The database contract is in
`placement-test/README.md`.

## rescore

1. Export the sitting into the learner's folder. This export is the only copy outside
   the artifact, and the report is built from it:

   ```
   ArtifactData action=list collection=answers out_dir=<data_dir>/tests/<YYYY-MM>-einstufung.answers
   ```

2. Run the rescore twice and diff the two outputs. They must be identical, and
   `allMatch` must be true:

   ```sh
   node <core>/placement-test/rescore.js --content <pack> \
     --answers <data_dir>/tests/<YYYY-MM>-einstufung.answers/answers --anchors <A4,A5>
   ```

`allMatch: false` means the pack, the engine or the stored copy changed since the
sitting. Stop and find out which before grading. The output holds totals only, never
a text. `totals.ctest.provisionalLevel` uses the default thresholds until an external
test (onSET) calibrates them for this learner.

## grade

Only when every unit is submitted, and only after a clean rescore.

1. **LanguageTool.** Start `languagetool-server --port 8081` as a background task
   (`run_in_background`). Wait about 20 s. Stop it when grading is over.
2. **Check the grader before the first real text.** If the rubric has changed, run
   the known-answer gate (`bewertung/README.md`, "Run the test set"). If it fails, the
   rubric is not used on real texts.
3. **Writing, E1 and E2.** One fresh Agent per text. Take the task cards out of the pack
   with the node one-liner in `bewertung/README.md`, never by opening the pack.
   - Run `python3 <core>/bewertung/lt.py < text.txt` and pass its output to that agent.
   - The prompt is in `bewertung/README.md`.
   - Corrections marked as errors go to `<data_dir>/fehler.md`, following its rules.
4. **Speaking, F1 and F2.** One fresh Agent per text, against `bewertung/SPRECHEN.md`.
   - The text was dictated, so grammar is not graded.
   - Nothing from speech goes into `fehler.md`.
5. **Anchors.** If `ctest.anchors` is empty, pick the two anchor texts now: one B2 and
   one C1 text from the middle of the measured range. Write them into the profile.
   They are what every Kontrolltest repeats.
6. **Report.** Write `<data_dir>/tests/<YYYY-MM>-einstufung.ru.md` in Russian:
   - summary table per skill (level, range, source);
   - self-assessment against the measurement;
   - each part;
   - what went into the error log;
   - three goals for the first block;
   - what comes next.

   Anchors appear by error type only.
7. **Profile.** Update `[skills."…"]` (level, range, source, date) and `[ctest]`.
8. **Results page.** Write the learner's `ergebnis.js`. It is a
   `window.EinstufungErgebnis = {…}` object read by the results view in `index.html`.
   It must not contain the anchors' answers. Point `placement_test.results` at it,
   then run `publish`.

## Gotchas

- **Teil 0 is stored 0..3, not 1..4.**
- **A C-test response is an array indexed by gap.** `""` means untouched. A missing
  key anywhere means unanswered.
- **`contentVersion` is set when a unit starts.** A sitting answered on one pack
  version is never rescored against another.
- **Dictation on macOS:** if double-Fn does nothing, the learner can use the
  microphone icon in the field.
