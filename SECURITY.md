# Security and privacy

## What leaves your machine

- **The placement test lives on claude.ai.** The page is a claude.ai artifact. Your answers
  are stored in that artifact's database, under your account, and are private unless you
  share the artifact. Claude reads them back with the ArtifactData tool.
- **The page loads its fonts from Google Fonts.** That is the only third-party request it
  makes.
- **LanguageTool runs locally.** `bewertung/lt.py` talks to the server at `LT_SERVER`,
  `http://localhost:8081` by default. Point it only at a server you run yourself, or your
  texts go to whoever runs it.

## What must never be committed here

Everything about a learner stays in their private folder:
- profile;
- error log and weekly logs;
- graded reports and exported answers;
- their content pack;
- their results file.

Only `profiles/example.toml` is tracked. Everything else in `profiles/` is gitignored, and
so is `build/`.

**A learner's content pack is secret, also from the learner.** The full text of a C-test is
its own answer key, and two of the texts repeat in every later Kontrolltest. If you fork
this repo for yourself, keep your pack outside the clone. Before you push, run the gate with
your pack:

```sh
GERMAN_COACH_SECRET_PACK=/path/to/your/content.js GERMAN_COACH_SECRET_IDS=A4,A5 \
python3 check_public.py --history
```

It also checks for absolute home paths, claude.ai artifact ids and email addresses. A
private deny-list (`GERMAN_COACH_DENYLIST`, one regex per line) can add names: teachers,
family, addresses. The gate prints only paths and counts, never what it matched. Install it
as a local `pre-commit` and `pre-push` hook.

## Reporting a problem

Open an issue without personal data, or contact the maintainer through GitHub.
