# claude-german-coach

A German coaching kit for [Claude Code](https://claude.com/claude-code), for
Russian-speaking learners going from about B1 to C1. Claude acts as teacher and coach.
- It places you with a measured test, not an impression.
- It grades your writing against a frozen rubric with fresh agents.
- It keeps an error log of your exact patterns.
- It opens a weekly review, so a break does not quietly end the programme.

```
placement test (claude.ai artifact) ─→ answers db ─→ rescore + graded report ─→ profile levels
                                                                    │
error log (fehler.md) ←── practice sessions, weekly writing, lesson corrections
                                                                    │
                                weekly review ─→ log + next week's plan
```

Everything about you lives in your own private folder: profile, error log, weekly logs,
reports and your own test pack. This repo holds the method, the page and the tools, and
is linked to your folder through one symlink.

## What you need

- **Claude Code** with a claude.ai account that can publish Artifacts. The placement test
  is an artifact page whose answers live in the artifact's own database, read back with
  the ArtifactData tool.
- **Python 3.11+**, standard library only, and **Node 18+**, no packages.
- Optional: [LanguageTool](https://languagetool.org/) as a local server for a second
  opinion when grading writing (`brew install languagetool`).

The page and the coaching are in Russian. The page loads its fonts from Google Fonts.

## Quick start

```sh
git clone https://github.com/dmalch/claude-german-coach.git
cd claude-german-coach

# 1. Your private folder and profile. The profile is the whole configuration.
mkdir -p ~/deutsch
cp profiles/example.toml ~/deutsch/profil.toml
ln -s ~/deutsch/profil.toml profiles/me.toml
python3 learner_profile.py me --check

# 2. Build your placement-test page (the example pack until you have your own).
python3 build_page.py --profile me
```

Then, in a Claude Code session in this folder, ask: *"опубликуй мой тест, профиль me"*.
The `placement-test` skill publishes the page and writes its link into your profile.
Sit the test in one or two sittings, then ask *"проверь тест"*.

[A step-by-step guide in Russian](docs/ru/QUICKSTART.ru.md) covers your own test pack
and the weekly rhythm.

## The profile is the whole configuration

`profiles/<name>.toml` is a symlink to `profil.toml` in your private folder. Only
`profiles/example.toml` is tracked. It holds:

- your goal, weekly budget and domains (sport, offices, media…), so tasks and topics
  come from your life;
- `data_dir`, your private folder. `fehler.md`, `log/`, `tests/`, `plans/` and
  `published/` live there under fixed names;
- your content pack and the artifact link;
- your two **anchor** C-test texts, which repeat in every later Kontrolltest;
- your measured levels, written only from graded tests.

`learner_profile.py` validates it and rejects unknown keys, because a typo in a config
file is otherwise silent. Relative paths are resolved against the folder the profile
really lives in.

## Your own test pack

`packs/example/content.js` is there so you can try the page. For real measurements you
need **your own private pack**: the C-test texts are their own answer key, and your two
anchors must stay unseen by you. Ask Claude to write a pack for your domains, following
[the pack format](placement-test/README.md#content-pack-format). Keep it in your private
folder and point `placement_test.content` at it. Never open it yourself.

## What is here

| Path | What |
|---|---|
| `placement-test/` | The page (`index.html`), the C-test engine, scoring and `autoscore.js`, `rescore.js`, tests. [Database contract and pack format](placement-test/README.md). |
| `packs/example/` | The example content pack. |
| `bewertung/` | The frozen grading kit: writing rubric `RUBRIK.md`, speaking rubric `SPRECHEN.md`, MERLIN reference texts, the grader's known-answer test set, the LanguageTool client. [Procedure](bewertung/README.md). |
| `learner_profile.py` | Loads and validates a profile, or prints one field. |
| `build_page.py` | Assembles your page byte for byte, with a digest. |
| `check_public.py` | Keeps secret texts and personal data out of the repo. |
| `.claude/skills/` | `placement-test`, `weekly-review`, `practice`. |
| `templates/fehler.md` | An empty error log with its rules. |
| `docs/method.md` | The method: measurement, error log, blocks, weekly rhythm, and the research behind it. |

## Development

```sh
python3 -m unittest discover -p 'test_*.py'
python3 -m unittest discover -s bewertung -p 'test_*.py'
node --test 'placement-test/test/*.test.js'
python3 check_public.py --history
python3 -m venv .venv && ./.venv/bin/pip install -r requirements-dev.txt
./.venv/bin/ruff check . && ./.venv/bin/ruff format --check . && ./.venv/bin/pyright
```

Read [CLAUDE.md](CLAUDE.md) before changing the page, the scoring or a rubric. A learner
may already have sat a test with the current engine, and the rubrics are frozen.

## Licence

MIT, except the MERLIN reference texts in `bewertung/anker/` (CC BY-SA 4.0). See
[NOTICE.md](NOTICE.md).
