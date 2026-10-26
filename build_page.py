#!/usr/bin/env python3
"""
Assemble a learner's placement-test page: the engine from this repo plus the
learner's content pack and graded results, copied byte for byte.

    python3 build_page.py --profile NAME [--out DIR]

The output is what gets published as the claude.ai artifact: `index.html` plus the
script files it loads. Nothing is transformed. A C-test's gaps are cut from the
exact characters of its text, so a build that re-encoded or reformatted a pack
would move the gaps of a test the learner has already taken.

The default output folder is `build/<name>/placement-test/` under the CURRENT
directory, because the artifact publisher only accepts files from the session's
working directory: build from where you will publish.

`manifest.json` in the output records a sha256 per file and one digest for the
whole page. The placement-test skill compares that digest with the one it recorded
at the last publish (`<data_dir>/published/placement-test.json`); equal means there
is nothing to publish. The manifest has no timestamps, so the same inputs always
give the same digest.
"""

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import learner_profile

CORE = Path(__file__).resolve().parent
ENGINE = CORE / "placement-test"
STUB = ENGINE / "ergebnis.stub.js"
MARKER = ".german-coach-build"

# Scripts the page loads that come from the learner, not from the engine.
PACK_NAME = "content.js"
RESULTS_NAME = "ergebnis.js"

SCRIPT_SRC = re.compile(r'<script\s+src="([^"]+)"')
PACK_VERSION = re.compile(r'\bversion:\s*"([^"]+)"')


class BuildError(Exception):
    pass


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def page_scripts():
    """The script files index.html loads, in order. The page is the source of truth."""
    html = (ENGINE / "index.html").read_text(encoding="utf-8")
    scripts = SCRIPT_SRC.findall(html)
    for name in (PACK_NAME, RESULTS_NAME):
        if name not in scripts:
            raise BuildError(f"index.html no longer loads {name}; update build_page.py")
    return scripts


def pack_ctest_ids(pack):
    """C-test ids in a pack, read by node. Only ids: the texts never leave node."""
    script = (
        "const p = require(process.argv[1]);"
        "process.stdout.write(JSON.stringify((p.ctest || []).map((t) => t.id)));"
    )
    run = subprocess.run(
        ["node", "-e", script, str(pack)], capture_output=True, text=True, check=False
    )
    if run.returncode != 0:
        raise BuildError(f"node could not load the pack {pack} (exit {run.returncode})")
    return json.loads(run.stdout)


def core_commit():
    """(commit, dirty) of this repo, or ("none", True) outside git."""
    try:
        head = subprocess.run(
            ["git", "-C", str(CORE), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        dirty = subprocess.run(
            ["git", "-C", str(CORE), "status", "--porcelain", "--", "placement-test"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        return head, bool(dirty)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "none", True


def prepare(out):
    """Empty `out`, refusing to touch a folder this script did not create."""
    if out.exists():
        if any(out.iterdir()) and not (out / MARKER).exists():
            raise BuildError(f"{out} exists and is not a build folder; choose another --out")
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (out / MARKER).write_text("created by build_page.py; safe to delete\n", encoding="utf-8")


def build(prof, out):
    pt = prof["placement_test"]
    pack = Path(pt["content"])
    if not pack.is_file():
        raise BuildError(f"content pack not found: {pack}")
    results = Path(pt["results"]) if pt.get("results") else STUB
    if not results.is_file():
        raise BuildError(f"results file not found: {results}")

    anchors = prof.get("ctest", {}).get("anchors", [])
    if anchors:
        ids = pack_ctest_ids(pack)
        missing = [a for a in anchors if a not in ids]
        if missing:
            raise BuildError(f"anchors {', '.join(missing)} are not C-test ids in {pack}")

    sources = {"index.html": ENGINE / "index.html"}
    for name in page_scripts():
        if name == PACK_NAME:
            sources[name] = pack
        elif name == RESULTS_NAME:
            sources[name] = results
        else:
            sources[name] = ENGINE / name
    for name, src in sources.items():
        if not src.is_file():
            raise BuildError(f"{name}: source missing ({src})")

    prepare(out)
    files = {}
    for name, src in sources.items():
        shutil.copyfile(src, out / name)
        files[name] = sha256(out / name)

    digest = hashlib.sha256(
        "".join(f"{name} {files[name]}\n" for name in sorted(files)).encode()
    ).hexdigest()
    commit, dirty = core_commit()
    version = PACK_VERSION.search(pack.read_text(encoding="utf-8"))
    manifest = {
        "digest": digest,
        "files": files,
        "core_commit": commit,
        "core_dirty": dirty,
        "pack_version": version.group(1) if version else None,
        "results": "learner" if results != STUB else "stub",
    }
    (out / "manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    return manifest


def main(argv=None):
    ap = argparse.ArgumentParser(description="Assemble a learner's placement-test page.")
    ap.add_argument("--profile", help="profile name (see learner_profile.py)")
    ap.add_argument("--profile-file", help="profile path, instead of --profile")
    ap.add_argument("--out", help="output folder (default: ./build/<name>/placement-test)")
    args = ap.parse_args(argv)
    if not args.profile and not args.profile_file:
        ap.error("give --profile NAME or --profile-file PATH")
    try:
        prof = learner_profile.load(args.profile, args.profile_file)
        out = (
            Path(args.out).expanduser()
            if args.out
            else Path.cwd() / "build" / prof["name"] / "placement-test"
        )
        manifest = build(prof, out.resolve())
    except (learner_profile.ProfileError, BuildError) as exc:
        print(f"build_page: {exc}", file=sys.stderr)
        return 1
    print(f"built {out.resolve()}")
    print(f"digest {manifest['digest']}")
    print(f"pack {manifest['pack_version']}, results: {manifest['results']}")
    if manifest["core_dirty"]:
        print("note: the engine has uncommitted changes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
