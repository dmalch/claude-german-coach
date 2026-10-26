# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A German coaching kit that Claude runs for one learner at a time, taking a learner
from about B1 to C1. It has five parts:

- a placement test, published as a claude.ai artifact page whose answers live in the artifact's database;
- a frozen grading kit for writing and speaking;
- an error-log method;
- a weekly review;
- chat practice sessions.

The page, the scoring and the grading tools live here. Each learner's profile, error
log, logs, reports and content pack live in their own private folder. That folder is
linked in through `profiles/`.

There is no package and nothing to install. The tools are stdlib Python 3.11+ and
dependency-free Node, run out of a clone.

## The rules that matter

1. **Configuration is data, not code.** Everything about one learner lives in their
   profile: goal, budget, data folder, content pack, anchors, measured levels. Never add
   a learner's value as a default, and never write a learner's calibration into
   `scoring.js`. The thresholds there are the provisional defaults for everyone. A
   learner's onSET calibration goes into `[ctest]` of their profile.

2. **A learner's anchor texts are secret, from them and from this repo.** Two C-test
   texts repeat in every Kontrolltest. The full text of a C-test is its answer key.
   - **Never Read, cat, grep or diff a learner's content pack.** Use `shasum` and `cmp`
     only. Tests and `rescore.js` run on it and report ids and numbers.
   - Show the learner the anchors' results by error type, never item by item.
   - Anything you read lands in the transcript, and claude-mem stores it.
   - `check_public.py` with the learner's pack is the gate, and the local pre-commit and
     pre-push hooks run it.

3. **The grading instruments are frozen.** `bewertung/RUBRIK.md`, `SPRECHEN.md`,
   `testset.json` and `anker/*.md` are checked byte for byte by `test_frozen.py`.
   Changing one is a rubric change:
   - re-run the known-answer gate (`bewertung/check_testset.py`) with a fresh grader agent first;
   - only then update the hash, with the gate's numbers in the commit message;
   - translating a rubric counts as a change.

4. **Never commit learner data.** `profiles/*` (except `example.toml`) and `build/` are
   gitignored. Fixtures are synthetic or come from the public example pack. Check that
   an example or test carries no real answers, dates, names or artifact ids.

5. **Grading is done by a fresh agent, never by the session that coached.** The grader
   gets the rubric, the anchors, the task and the text. It gets no chat history.

## Before changing the page or the scoring

A learner may already have sat a test with the current engine. Two checks:

- `rescore.js` against an exported sitting must still give `allMatch: true`. The page
  and `rescore.js` share `autoscore.js` so this cannot drift silently.
- `build_page.py` must still copy the engine and the pack byte for byte. A C-test's gaps
  are cut from the exact characters of its text.

Changing a published page means rebuilding it and republishing it to the learner's
`artifact_url`. The placement-test skill compares the build digest with the one recorded
at the last publish.

## Verification

```sh
python3 -m unittest discover -p 'test_*.py'
python3 -m unittest discover -s bewertung -p 'test_*.py'
node --test 'placement-test/test/*.test.js'
python3 check_public.py --history
./.venv/bin/ruff check . && ./.venv/bin/ruff format --check . && ./.venv/bin/pyright
```

All of these run in CI and are required to merge. CI's `check_public.py` sees only the
built-in patterns. The full gate, with a learner's secret pack and the private deny-list,
runs locally:

```sh
GERMAN_COACH_SECRET_PACK=/path/to/learner/content.js GERMAN_COACH_SECRET_IDS=A4,A5 \
GERMAN_COACH_DENYLIST=/path/to/deny-list python3 check_public.py --history
```

To run the content and rescore tests against a learner's own pack:

```sh
GERMAN_COACH_PACK=/path/to/learner/content.js node --test 'placement-test/test/*.test.js'
```

## Where knowledge goes

- A rule of the method (measurement, error log, blocks) goes to `docs/method.md`.
- How to build, publish, check or grade the test goes to `.claude/skills/placement-test/SKILL.md`.
- How a weekly review or a practice session runs goes to that skill's `SKILL.md`.
- The page's database contract and the pack format go to `placement-test/README.md`.
- Anything about one learner goes to their private folder, never here.
