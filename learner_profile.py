#!/usr/bin/env python3
"""
Per-learner configuration, loaded from a TOML file.

Everything that differs between two learners lives in their profile: the goal and
weekly budget, where their data lives, which content pack their placement test
uses, which two C-test texts are their anchors, the levels measured so far. The
code never carries a learner's value as a default.

The profile normally sits in the learner's own private folder, next to their error
log and weekly logs, and is symlinked into this repo's gitignored `profiles/`.
Relative paths in it are resolved against the folder the profile really lives in
(after following the symlink), so a profile next to its data can say
`data_dir = "."`. A path starting with `@core/` points into this repo, which is how
a profile names the example pack wherever the profile itself lives.

Resolution order for `--profile NAME`:

    $GERMAN_COACH_PROFILES/NAME.toml   (if the variable is set)
    ./profiles/NAME.toml               (relative to the current directory)
    <this file's dir>/profiles/NAME.toml

An explicit `--profile-file PATH` skips the search. `$GERMAN_COACH_PROFILE` is the
default NAME.

As a shell helper:

    python3 learner_profile.py NAME --get placement_test.content   # absolute path
    python3 learner_profile.py NAME --check                         # validate only
"""

import argparse
import os
import re
import sys
import tomllib
from datetime import date
from pathlib import Path

LEVEL = re.compile(r"^(A1|A2|B1|B2|C1|C2)\+?$")
RANGE = re.compile(r"^(A1|A2|B1|B2|C1|C2)\+?[–-](A1|A2|B1|B2|C1|C2)\+?$")
ARTIFACT_URL = re.compile(r"^https://claude\.ai/(?:code/)?artifact/[A-Za-z0-9-]+$")

SKILLS = ("Lesen", "Hören", "Schreiben", "Sprechen", "Grammatik", "Wortschatz")
SKILL_FIELDS = ("level", "range", "source", "date")

TOP_KEYS = {"name", "data_dir"}
# Sections checked field by field: a typo there silently disables a setting.
STRICT_SECTIONS = {"goal", "placement_test", "ctest", "skills"}
# Free-form notes for the coach (Claude reads them, no tool does): only the shape
# is checked, so a learner can keep whatever is useful there.
NOTE_SECTIONS = {"slots", "start", "external", "live_lessons"}

GOAL_REQUIRED = ("target", "budget_min_per_week", "domains")
GOAL_KNOWN = {*GOAL_REQUIRED, "not_in_scope", "minimum_dose", "milestones"}
PLACEMENT_KNOWN = {"content", "results", "artifact_url"}
PLACEMENT_PATHS = ("content", "results")

CORE = Path(__file__).resolve().parent
CORE_PREFIX = "@core/"

# Fixed places inside data_dir. Not configurable on purpose: the skills, the
# weekly review and a human looking for a file all find the same thing.
DATA_FILES = {
    "fehler": "fehler.md",
    "log": "log",
    "tests": "tests",
    "plans": "plans",
    "published": "published/placement-test.json",
}


class ProfileError(Exception):
    """Raised for anything wrong with a profile file, with a path in the message."""


def candidates(name):
    """Every path `name` could resolve to, in the order they are tried."""
    here = Path(__file__).resolve().parent
    out = []
    env = os.environ.get("GERMAN_COACH_PROFILES")
    if env:
        out.append(Path(env).expanduser() / f"{name}.toml")
    out.append(Path.cwd() / "profiles" / f"{name}.toml")
    out.append(here / "profiles" / f"{name}.toml")
    seen, uniq = set(), []
    for p in out:
        if p not in seen:
            seen.add(p)
            uniq.append(p)
    return uniq


def find(name):
    tried = candidates(name)
    for path in tried:
        if path.is_file():
            return path
    raise ProfileError(
        f"no profile named {name!r}. Looked in:\n  "
        + "\n  ".join(str(p) for p in tried)
        + "\n\nCopy profiles/example.toml to your own private folder, edit it, and "
        "symlink it into profiles/ (see README)."
    )


def _require_table(src, key, value):
    if not isinstance(value, dict):
        raise ProfileError(f"{src}: [{key}] must be a table")


def _unknown(src, where, keys, known):
    extra = sorted(set(keys) - set(known))
    if extra:
        raise ProfileError(
            f"{src}: unknown field(s) in {where}: {', '.join(extra)}. "
            f"Known: {', '.join(sorted(known))}"
        )


def _check_goal(src, goal):
    _require_table(src, "goal", goal)
    _unknown(src, "[goal]", goal, GOAL_KNOWN)
    missing = [k for k in GOAL_REQUIRED if k not in goal]
    if missing:
        raise ProfileError(f"{src}: [goal] is missing {', '.join(missing)}")
    if not LEVEL.match(str(goal["target"])):
        raise ProfileError(f"{src}: [goal].target must be a CEFR level such as C1")
    budget = goal["budget_min_per_week"]
    if not isinstance(budget, int) or not 30 <= budget <= 1200:
        raise ProfileError(f"{src}: [goal].budget_min_per_week must be minutes, 30-1200")
    for key in ("domains", "not_in_scope"):
        value = goal.get(key, [])
        if not isinstance(value, list) or any(not isinstance(v, str) for v in value):
            raise ProfileError(f"{src}: [goal].{key} must be a list of strings")
    if "minimum_dose" in goal and not isinstance(goal["minimum_dose"], str):
        raise ProfileError(f"{src}: [goal].minimum_dose must be a string")
    if "milestones" in goal:
        _require_table(src, "goal.milestones", goal["milestones"])


def _check_placement(src, pt):
    _require_table(src, "placement_test", pt)
    _unknown(src, "[placement_test]", pt, PLACEMENT_KNOWN)
    if "content" not in pt:
        raise ProfileError(f"{src}: [placement_test].content (the content pack) is required")
    for key in ("content", "results"):
        if key in pt and not isinstance(pt[key], str):
            raise ProfileError(f"{src}: [placement_test].{key} must be a path string")
    url = pt.get("artifact_url", "")
    if url and not ARTIFACT_URL.match(url):
        raise ProfileError(f"{src}: [placement_test].artifact_url is not a claude.ai artifact link")


def _check_ctest(src, ct):
    _require_table(src, "ctest", ct)
    anchors = ct.get("anchors", [])
    if not isinstance(anchors, list) or any(not isinstance(a, str) for a in anchors):
        raise ProfileError(f"{src}: [ctest].anchors must be a list of C-test ids")


def _check_skills(src, skills):
    _require_table(src, "skills", skills)
    for name, entry in skills.items():
        if name not in SKILLS:
            raise ProfileError(
                f"{src}: unknown skill [skills.{name!r}]. Known: {', '.join(SKILLS)} "
                '(quote names with umlauts: [skills."Hören"])'
            )
        _require_table(src, f"skills.{name}", entry)
        _unknown(src, f"[skills.{name}]", entry, SKILL_FIELDS)
        missing = [k for k in SKILL_FIELDS if k not in entry]
        if missing:
            raise ProfileError(f"{src}: [skills.{name}] is missing {', '.join(missing)}")
        if not LEVEL.match(str(entry["level"])):
            raise ProfileError(f"{src}: [skills.{name}].level must be a CEFR level, e.g. B1+")
        if not RANGE.match(str(entry["range"])):
            raise ProfileError(f"{src}: [skills.{name}].range must look like B1–B2")
        when = entry["date"]
        if not isinstance(when, date):
            try:
                date.fromisoformat(str(when))
            except ValueError as exc:
                raise ProfileError(f"{src}: [skills.{name}].date must be YYYY-MM-DD") from exc


def load(name=None, path=None):
    """Read a profile and return it as a validated dict with absolute paths."""
    src = Path(path).expanduser() if path else find(name)
    try:
        with open(src, "rb") as fh:
            raw = tomllib.load(fh)
    except tomllib.TOMLDecodeError as exc:
        raise ProfileError(f"{src}: not valid TOML -- {exc}") from exc
    except OSError as exc:
        raise ProfileError(f"{src}: cannot be read -- {exc}") from exc

    _unknown(src, "the top level", raw, TOP_KEYS | STRICT_SECTIONS | NOTE_SECTIONS)
    if "data_dir" not in raw:
        raise ProfileError(f"{src}: data_dir is required (the folder with fehler.md and log/)")
    for key in ("goal", "placement_test"):
        if key not in raw:
            raise ProfileError(f"{src}: [{key}] is required")

    _check_goal(src, raw["goal"])
    _check_placement(src, raw["placement_test"])
    if "ctest" in raw:
        _check_ctest(src, raw["ctest"])
    if "skills" in raw:
        _check_skills(src, raw["skills"])
    for key in NOTE_SECTIONS & set(raw):
        _require_table(src, key, raw[key])

    # Paths are relative to where the profile really is, not to the symlink in
    # profiles/ and not to the current directory.
    base = src.resolve().parent
    prof = dict(raw)

    def resolve(value):
        if value.startswith(CORE_PREFIX):
            return str((CORE / value[len(CORE_PREFIX) :]).resolve())
        return str((base / Path(value).expanduser()).resolve())

    prof.setdefault("name", Path(src).stem)
    prof["profile_path"] = str(src.resolve())
    prof["data_dir"] = resolve(raw["data_dir"])
    pt = dict(raw["placement_test"])
    for key in PLACEMENT_PATHS:
        if key in pt:
            pt[key] = resolve(pt[key])
    prof["placement_test"] = pt
    prof["files"] = {k: str(Path(prof["data_dir"]) / v) for k, v in DATA_FILES.items()}
    return prof


def get(prof, dotted):
    """A value by dotted key, e.g. 'placement_test.content' or 'files.fehler'."""
    value = prof
    for part in dotted.split("."):
        if not isinstance(value, dict) or part not in value:
            raise ProfileError(f"{prof['profile_path']}: no field {dotted!r}")
        value = value[part]
    return value


def main(argv=None):
    ap = argparse.ArgumentParser(description="Validate a learner profile or print one field.")
    ap.add_argument("name", nargs="?", default=os.environ.get("GERMAN_COACH_PROFILE"))
    ap.add_argument("--profile-file", help="read this file instead of searching by name")
    group = ap.add_mutually_exclusive_group()
    group.add_argument("--get", metavar="KEY", help="print one field, e.g. placement_test.content")
    group.add_argument("--check", action="store_true", help="validate and print a summary")
    args = ap.parse_args(argv)
    if not args.name and not args.profile_file:
        ap.error("give a profile NAME, --profile-file or set GERMAN_COACH_PROFILE")
    try:
        prof = load(args.name, args.profile_file)
        if args.get:
            value = get(prof, args.get)
            print(value if not isinstance(value, (list, dict)) else repr(value))
        else:
            print(f"{prof['name']}: ok ({prof['profile_path']})")
            print(f"  data_dir: {prof['data_dir']}")
            print(f"  pack:     {prof['placement_test']['content']}")
    except ProfileError as exc:
        print(exc, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
