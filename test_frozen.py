"""The grading instruments are frozen: the known-answer gate was run against these
exact bytes. A change to any of them is a rubric change, which means re-running
bewertung/check_testset.py with a fresh grader and only then updating the hash
here, in the same commit, with the gate's numbers in the commit message."""

import hashlib
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent

FROZEN = {
    "bewertung/RUBRIK.md": "43571ae683fb44b70df506803f72f8ab24af6523b221488e5c57c384c0a712b6",
    "bewertung/SPRECHEN.md": "10f09aabc1b2208907dbfaa45c1c8d4894926de7a603451c064099ad00f1d02f",
    "bewertung/testset.json": "6dc5f5f9220e8935411bed487b3692849993c769dc504ce79cadf9e64265bdef",
    "bewertung/anker/b1-1.md": "2893fdd75453e64a40dd0d43754d8b4270cc132449f77ce0caabd1a5d031e756",
    "bewertung/anker/b1-2.md": "9f4d42eb3bf5ad4dcfea4777d1b117a968738580b99fdace4ab847ab2f4a689c",
    "bewertung/anker/b2-1.md": "7999eb044da6bb325440696e057841e779b8df344e332ab7f9863d83558f7285",
    "bewertung/anker/b2-2.md": "5e5f02949ee9a8958d718dae4416117504a313bedf81e8a2c587bb859adfed34",
    "bewertung/anker/c1-1.md": "ed2a4eb93458705195082cc535e7678b7373927ecec8d48ba96cd8b907ab4779",
    "bewertung/anker/c1-2.md": "a5a567e16243801bac8bccfb06b83b7f743ba6258248280d6056ad3144554ce9",
}


class FrozenTest(unittest.TestCase):
    def test_grading_instruments_are_unchanged(self):
        for rel, expected in FROZEN.items():
            with self.subTest(rel):
                actual = hashlib.sha256((HERE / rel).read_bytes()).hexdigest()
                self.assertEqual(actual, expected, f"{rel} changed: re-run the gate first")

    def test_every_anchor_text_is_listed(self):
        on_disk = {
            str(p.relative_to(HERE))
            for p in (HERE / "bewertung" / "anker").glob("*.md")
            if p.name != "LICENSE.md"
        }
        listed = {k for k in FROZEN if k.startswith("bewertung/anker/")}
        self.assertEqual(on_disk, listed)


if __name__ == "__main__":
    unittest.main()
