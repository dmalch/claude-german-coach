#!/usr/bin/env python3
"""Score the grader against the known-answer test set.

    python3 bewertung/check_testset.py bewertung/testset.json grader-output.json

grader-output.json is what the grader agent returned for the test-set texts: a
list of {"id", "edits": [{"wrong", "right", "category", "kind"}]}. Only edits
with kind == "error" count; "style" edits are free. Exit status 1 when a gate
fails, so a rubric change that makes grading worse is caught before it grades
a real text.
"""

import json
import re
import sys

GATES = {"recall": 0.85, "precision": 0.90, "false_alarms_on_correct": 1}


def fold(s):
    return " ".join(s.casefold().split())


def contains(hay, needle):
    pattern = r"(?<!\w)" + re.escape(fold(needle)) + r"(?!\w)"
    return re.search(pattern, fold(hay)) is not None


def evaluate(testset, output):
    edits_by_id = {
        o["id"]: [e for e in o.get("edits", []) if e.get("kind") == "error"] for o in output
    }
    expected = matched = same_category = error_edits = used_edits = alarms_on_correct = 0
    misses, false_alarms = [], []
    for item in testset["items"]:
        edits = edits_by_id.get(item["id"], [])
        error_edits += len(edits)
        used = set()
        for exp in item["errors"]:
            expected += 1
            hit = next(
                (
                    i
                    for i, e in enumerate(edits)
                    if contains(e["wrong"], exp["wrong"]) and contains(e["right"], exp["right"])
                ),
                None,
            )
            if hit is None:
                misses.append({"id": item["id"], **exp})
                continue
            matched += 1
            used.add(hit)
            same_category += edits[hit].get("category") == exp["category"]
        for i, e in enumerate(edits):
            if i not in used:
                false_alarms.append({"id": item["id"], **e})
                if not item["errors"]:
                    alarms_on_correct += 1
        used_edits += len(used)
    return {
        "recall": matched / expected if expected else 1.0,
        "precision": used_edits / error_edits if error_edits else 1.0,
        "category_accuracy": same_category / matched if matched else 0.0,
        "false_alarms_on_correct": alarms_on_correct,
        "misses": misses,
        "false_alarms": false_alarms,
    }


def gate(r):
    return (
        r["recall"] >= GATES["recall"]
        and r["precision"] >= GATES["precision"]
        and r["false_alarms_on_correct"] <= GATES["false_alarms_on_correct"]
    )


def main(argv):
    with open(argv[1], encoding="utf-8") as fh:
        testset = json.load(fh)
    with open(argv[2], encoding="utf-8") as fh:
        output = json.load(fh)
    r = evaluate(testset, output)
    print(
        f"recall {r['recall']:.2f} (gate {GATES['recall']})  "
        f"precision {r['precision']:.2f} (gate {GATES['precision']})  "
        f"category accuracy {r['category_accuracy']:.2f}  "
        f"false alarms on correct sentences {r['false_alarms_on_correct']} "
        f"(gate ≤{GATES['false_alarms_on_correct']})"
    )
    for m in r["misses"]:
        print(f"  MISSED  {m['id']}: {m['wrong']} → {m['right']} [{m['category']}]")
    for f in r["false_alarms"]:
        print(f"  FALSE   {f['id']}: {f['wrong']} → {f['right']} [{f.get('category')}]")
    ok = gate(r)
    print("GATE PASS" if ok else "GATE FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
