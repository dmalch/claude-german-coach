#!/usr/bin/env python3
"""
Keep secrets and personal data out of this public repository.

Two kinds of leak matter here, and neither fails loudly on its own:

1. **Secret test texts.** A learner's two C-test anchor texts repeat in every
   Kontrolltest, and the full text of a C-test *is* its answer key. If any part of
   them lands in this repo -- a copied pack, a test fixture, a doc example -- the
   learner can read the answers. So a learner's private pack can be passed in, and
   every tracked file (and, with --history, every blob ever committed) is checked
   for runs of its words.
2. **Personal data.** Absolute home paths, claude.ai artifact ids, email addresses,
   and whatever a private deny-list names (teachers, family, addresses).

The secret texts and the deny-list stay outside the repo and are never printed:
the output is paths, blob ids and counts only, so a failing check does not leak
what it found into a terminal, a CI log or a transcript.

    python3 check_public.py                                   # built-in patterns
    python3 check_public.py --secret-pack PATH --secret-ids A4,A5 \\
        --deny-list PATH --history                            # the full local gate

GERMAN_COACH_SECRET_PACK, GERMAN_COACH_SECRET_IDS and GERMAN_COACH_DENYLIST stand
in for the three options, so a git hook can run the full gate with no arguments.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

# A run of this many words from a secret text fails the check. Eight words of
# continuous text are not a coincidence; five can be ("in den letzten Jahren
# ist"), so shorter runs are reported as a count for a human to look at.
FAIL_WINDOW = 8
NOTE_WINDOW = 5

BUILTIN = {
    # A path that starts there, not a URL segment such as onset.de/home/forschung/.
    "home path": re.compile(r"(?<![\w.:/-])/(?:Users|home)/[A-Za-z0-9._-]+/"),
    "artifact id": re.compile(r"claude\.ai/(?:code/)?artifact/[A-Za-z0-9-]{8,}"),
    "email": re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}"),
}

# Addresses that are public by design: the bot that opens Dependabot PRs, and
# GitHub's own noreply domain. Everything else that looks like an email fails.
EMAIL_ALLOW = re.compile(r"@(?:users\.noreply\.github\.com|github\.com)$")

FOLD = str.maketrans({"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"})


class GateError(Exception):
    """A problem with the gate's own inputs (not a finding)."""


def words(text):
    """Lower-case word tokens with umlauts folded, so 'Prüfung' and 'pruefung' match."""
    text = unicodedata.normalize("NFC", text.replace("^", "")).lower().translate(FOLD)
    return re.findall(r"[a-z0-9]+", text)


def ngrams(tokens, n):
    return {tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)}


def secret_texts(pack, ids):
    """The C-test texts with the given ids, read from a pack by node, kept in memory."""
    script = (
        "const p = require(process.argv[1]);"
        "const ids = process.argv[2].split(',');"
        "const out = {};"
        "for (const t of p.ctest || []) if (ids.includes(t.id)) out[t.id] = t.text;"
        "process.stdout.write(JSON.stringify(out));"
    )
    try:
        run = subprocess.run(
            ["node", "-e", script, str(Path(pack).resolve()), ",".join(ids)],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as exc:
        raise GateError("node is needed to read a secret pack") from exc
    if run.returncode != 0:
        # stderr of a failed require could quote the pack; report only the fact.
        raise GateError(f"node could not load the secret pack (exit {run.returncode})")
    found = json.loads(run.stdout)
    missing = [i for i in ids if i not in found]
    if missing:
        raise GateError(f"secret pack has no C-test text with id {', '.join(missing)}")
    return list(found.values())


def deny_patterns(path):
    """One case-insensitive regex per non-empty, non-comment line of the deny-list."""
    out = []
    for n, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        try:
            out.append(re.compile(line, re.IGNORECASE))
        except re.error as exc:
            raise GateError(f"deny-list line {n} is not a valid regex: {exc}") from exc
    return out


def git_bytes(root, *args) -> bytes:
    return subprocess.run(["git", "-C", str(root), *args], capture_output=True, check=True).stdout


def git(root, *args) -> str:
    return git_bytes(root, *args).decode("utf-8")


def worktree_files(root):
    """Tracked files plus untracked files that are not ignored: what a commit could add."""
    listed = git(root, "ls-files", "-z", "--cached", "--others", "--exclude-standard")
    return [p for p in listed.split("\0") if p]


def history_blobs(root):
    """(blob id, a path it was seen at) for every blob reachable from any ref."""
    try:
        listed = git(root, "rev-list", "--objects", "--all")
    except subprocess.CalledProcessError:
        return []  # no commits yet
    pairs = []
    for line in listed.splitlines():
        oid, _, path = line.partition(" ")
        if path:
            pairs.append((oid, path))
    if not pairs:
        return []
    check = subprocess.run(
        ["git", "-C", str(root), "cat-file", "--batch-check=%(objectname) %(objecttype)"],
        input="\n".join(oid for oid, _ in pairs).encode(),
        capture_output=True,
        check=True,
    )
    blobs = {
        oid
        for oid, kind in (ln.split() for ln in check.stdout.decode().splitlines())
        if kind == "blob"
    }
    return [(oid, path) for oid, path in pairs if oid in blobs]


def read_blob(root, oid):
    return git_bytes(root, "cat-file", "blob", oid)


def findings_for(text, secrets_fail, secrets_note, deny):
    """Finding labels (never the matched text) for one decoded file."""
    out = []
    for label, rx in BUILTIN.items():
        hits = [m.group(0) for m in rx.finditer(text)]
        if label == "email":
            hits = [h for h in hits if not EMAIL_ALLOW.search(h)]
        if hits:
            out.append(f"{label} x{len(hits)}")
    for n, rx in enumerate(deny, 1):
        hits = len(rx.findall(text))
        if hits:
            out.append(f"deny-list line {n} x{hits}")
    if secrets_fail:
        toks = words(text)
        long_hits = len(ngrams(toks, FAIL_WINDOW) & secrets_fail)
        if long_hits:
            out.append(f"secret text: {long_hits} run(s) of {FAIL_WINDOW} words")
        short_hits = len(ngrams(toks, NOTE_WINDOW) & secrets_note)
        if short_hits and not long_hits:
            out.append(
                f"note: {short_hits} run(s) of {NOTE_WINDOW} words shared with a secret text"
            )
    return out


def decode(data):
    if b"\0" in data[:8192]:
        return None  # binary
    return data.decode("utf-8", errors="replace")


def scan(root, secrets, deny, history, extra_files=()):
    """Return (fail lines, note lines, files scanned, blobs scanned)."""
    secret_tokens = [words(t) for t in secrets]
    fail_set = set().union(*(ngrams(t, FAIL_WINDOW) for t in secret_tokens)) if secrets else set()
    note_set = set().union(*(ngrams(t, NOTE_WINDOW) for t in secret_tokens)) if secrets else set()

    fails, notes = [], []

    def record(where, labels):
        for label in labels:
            (notes if label.startswith("note:") else fails).append(f"{where}: {label}")

    files = list(worktree_files(root)) if (Path(root) / ".git").exists() else []
    files += [str(p) for p in extra_files]
    for rel in files:
        path = Path(root) / rel
        if not path.is_file():
            continue  # deleted in the work tree but still in the index
        text = decode(path.read_bytes())
        if text is not None:
            record(rel, findings_for(text, fail_set, note_set, deny))

    blobs = history_blobs(root) if history else []
    seen = set()
    for oid, path in blobs:
        if oid in seen:
            continue
        seen.add(oid)
        text = decode(read_blob(root, oid))
        if text is not None:
            record(f"history {oid[:12]} ({path})", findings_for(text, fail_set, note_set, deny))
    return fails, notes, len(files), len(seen)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Keep secrets and personal data out of this repo.")
    ap.add_argument("--root", default=".", help="repository to check (default: current dir)")
    ap.add_argument("--secret-pack", default=os.environ.get("GERMAN_COACH_SECRET_PACK"))
    ap.add_argument(
        "--secret-ids",
        default=os.environ.get("GERMAN_COACH_SECRET_IDS"),
        help="comma-separated C-test ids, e.g. A4,A5",
    )
    ap.add_argument("--deny-list", default=os.environ.get("GERMAN_COACH_DENYLIST"))
    ap.add_argument("--history", action="store_true", help="also scan every committed blob")
    ap.add_argument(
        "--files",
        nargs="*",
        default=[],
        help="extra files (relative to --root) to scan, e.g. outside git",
    )
    args = ap.parse_args(argv)

    try:
        secrets = []
        if args.secret_pack:
            if not args.secret_ids:
                raise GateError("--secret-pack needs --secret-ids")
            ids = [i.strip() for i in args.secret_ids.split(",") if i.strip()]
            secrets = secret_texts(args.secret_pack, ids)
        deny = deny_patterns(args.deny_list) if args.deny_list else []
        fails, notes, nfiles, nblobs = scan(args.root, secrets, deny, args.history, args.files)
    except GateError as exc:
        print(f"check_public: {exc}", file=sys.stderr)
        return 2

    scope = f"{nfiles} files" + (f", {nblobs} history blobs" if args.history else "")
    inputs = []
    if secrets:
        inputs.append(f"{len(secrets)} secret text(s)")
    if deny:
        inputs.append(f"{len(deny)} deny-list pattern(s)")
    inputs_txt = f" against {', '.join(inputs)} and built-in patterns" if inputs else ""
    for line in notes:
        print(line)
    if fails:
        for line in fails:
            print(f"FAIL {line}")
        print(f"check_public: {len(fails)} finding(s) in {scope}{inputs_txt}")
        return 1
    print(f"check_public: clean, {scope}{inputs_txt}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
