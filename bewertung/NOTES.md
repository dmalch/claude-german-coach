# Notes on the frozen grading kit

`RUBRIK.md`, `SPRECHEN.md`, `testset.json` and `anker/` are frozen. They are byte-identical to
the versions the known-answer gate was run against, and `test_frozen.py` checks that they
stay so. Any change to them, however small, means running the gate again
(`check_testset.py`, see [`README.md`](README.md)) before the kit grades a real text.

The rubrics are in Russian because they were written for Russian-speaking learners: the
grader writes its rule notes in Russian, and the category descriptions are tuned to the errors
Russian speakers make. Translating them is a rubric change, so it needs a new gate run like
any other edit.

`anker/` holds six learner texts from the MERLIN corpus (two each at B1, B2 and C1) under
CC BY-SA 4.0; their origin is in [`anker/LICENSE.md`](anker/LICENSE.md). They are quoted
unchanged, errors included.

## References inside the frozen files

The frozen files were written in a private repository with a different layout and cannot be
edited to match this one. Read their references through this table. In general, a
`deutsch/...` prefix maps to the repository root.

| File | Line | Reference as written | Read as |
|---|---|---|---|
| `RUBRIK.md` | 4 | `bewertung/README.md` | unchanged: [`bewertung/README.md`](README.md) |
| `RUBRIK.md` | 28 | `python3 bewertung/lt.py` | unchanged, run from the repository root |
| `RUBRIK.md` | 32 | `bewertung/anker/` | unchanged |
| `SPRECHEN.md` | 5 | `deutsch/artifacts/einstufung/README.md` | [`placement-test/README.md`](../placement-test/README.md) |
| `SPRECHEN.md` | 9 | `bewertung/README.md`, шаг «Устная речь» | [`bewertung/README.md`](README.md), section "Grading speaking (F1, F2)" |
| `SPRECHEN.md` | 14 | design §2, принцип 9 | [`docs/method.md`](../docs/method.md), "Principles", item 9 |
| `SPRECHEN.md` | 24, 26 | `fehler.md` | `<data_dir>/fehler.md`, the learner's error log |
| `SPRECHEN.md` | 33 | `content.js` → `sprechen[]` | the learner's content pack, `placement_test.content` in their profile (example: `packs/example/content.js`) |
| `SPRECHEN.md` | 36 | `bewertung/anker/` | unchanged |
| `testset.json` | 3 | `bewertung/README.md` (in `note`) | unchanged |

Other wording in the frozen files that reflects where they came from:

- `RUBRIK.md` describes the learner as a Russian native speaker at about B1–B2. That is the
  target group of this repository.
- `SPRECHEN.md` describes F1 as a monologue about the last trip to the mountains and F2 as a
  phone call to a GP's practice (Hausarztpraxis), and lists F2 replies as `F2-1` … `F2-5`.
  Those are the tasks of the example pack. With another pack, read them as "the monologue
  task" and "the dialog task", with replies `F2-1` … `F2-n`.
- `SPRECHEN.md` names macOS dictation as the source of the text. Any dictation tool gives the
  same kind of text, and the same rule applies: no grammar grading from it.
