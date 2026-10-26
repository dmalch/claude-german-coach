import os
import tempfile
import textwrap
import unittest
from pathlib import Path

import learner_profile as lp

GOOD = """
data_dir = "."

[goal]
target = "C1"
budget_min_per_week = 180
domains = ["sport", "offices"]

[placement_test]
content = "pack/content.js"
artifact_url = "https://claude.ai/artifact/AbC123"

[ctest]
anchors = ["A4", "A5"]
einstufung = { date = "2026-01-10" }

[skills."Hören"]
level = "B2"
range = "B1+–B2"
source = "placement test"
date = 2026-01-10

[slots]
anything = "goes here"
"""


class ProfileTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, text, name="p.toml", where=None):
        path = (where or self.dir) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(textwrap.dedent(text), encoding="utf-8")
        return path

    def assertRejects(self, text, fragment):
        path = self.write(text)
        with self.assertRaises(lp.ProfileError) as ctx:
            lp.load(path=path)
        self.assertIn(fragment, str(ctx.exception))

    def test_good_profile_resolves_paths_against_its_own_folder(self):
        prof = lp.load(path=self.write(GOOD))
        self.assertEqual(prof["data_dir"], str(self.dir.resolve()))
        self.assertEqual(
            prof["placement_test"]["content"], str((self.dir / "pack/content.js").resolve())
        )
        self.assertEqual(prof["files"]["fehler"], str(self.dir.resolve() / "fehler.md"))
        self.assertEqual(prof["name"], "p")

    def test_paths_follow_a_symlink_to_the_real_folder(self):
        private = self.dir / "private"
        real = self.write(GOOD, "profil.toml", private)
        links = self.dir / "core" / "profiles"
        links.mkdir(parents=True)
        (links / "anna.toml").symlink_to(real)
        prof = lp.load(path=links / "anna.toml")
        self.assertEqual(prof["data_dir"], str(private.resolve()))
        self.assertEqual(prof["name"], "anna")

    def test_core_prefix_points_into_the_repo(self):
        text = GOOD.replace('"pack/content.js"', '"@core/packs/example/content.js"')
        prof = lp.load(path=self.write(text))
        expected = Path(lp.__file__).resolve().parent / "packs" / "example" / "content.js"
        self.assertEqual(prof["placement_test"]["content"], str(expected))

    def test_search_order_prefers_the_environment(self):
        env_dir = self.dir / "env"
        self.write(GOOD, "x.toml", env_dir)
        old = os.environ.get("GERMAN_COACH_PROFILES")
        os.environ["GERMAN_COACH_PROFILES"] = str(env_dir)
        try:
            self.assertEqual(lp.find("x"), env_dir / "x.toml")
        finally:
            if old is None:
                del os.environ["GERMAN_COACH_PROFILES"]
            else:
                os.environ["GERMAN_COACH_PROFILES"] = old

    def test_missing_profile_lists_where_it_looked(self):
        with self.assertRaises(lp.ProfileError) as ctx:
            lp.find("nobody-has-this-name")
        self.assertIn("Looked in", str(ctx.exception))

    def test_unknown_top_level_key_is_a_typo(self):
        self.assertRejects('datadir = "."\n' + GOOD, "datadir")

    def test_unknown_goal_field_is_a_typo(self):
        self.assertRejects(
            GOOD.replace("budget_min_per_week", "budget_per_week"), "budget_per_week"
        )

    def test_target_must_be_a_level(self):
        self.assertRejects(GOOD.replace('target = "C1"', 'target = "C1 soon"'), "CEFR level")

    def test_budget_is_bounded(self):
        self.assertRejects(GOOD.replace("= 180", "= 5"), "budget_min_per_week")

    def test_pack_is_required(self):
        self.assertRejects(GOOD.replace('content = "pack/content.js"\n', ""), "content")

    def test_artifact_url_must_be_an_artifact_link(self):
        self.assertRejects(
            GOOD.replace("https://claude.ai/artifact/AbC123", "https://example.com/x"),
            "artifact link",
        )

    def test_skill_names_catch_a_dropped_umlaut(self):
        self.assertRejects(GOOD.replace('[skills."Hören"]', "[skills.Horen]"), "unknown skill")

    def test_skill_range_format(self):
        self.assertRejects(GOOD.replace('range = "B1+–B2"', 'range = "about B2"'), "range")

    def test_invalid_toml_is_reported_with_the_path(self):
        self.assertRejects("[goal\n", "not valid TOML")

    def test_get_reads_dotted_keys(self):
        prof = lp.load(path=self.write(GOOD))
        self.assertEqual(lp.get(prof, "ctest.anchors"), ["A4", "A5"])
        with self.assertRaises(lp.ProfileError):
            lp.get(prof, "ctest.nothing")

    def test_example_profile_is_valid(self):
        prof = lp.load(path=Path(lp.__file__).resolve().parent / "profiles" / "example.toml")
        self.assertEqual(prof["goal"]["target"], "C1")


if __name__ == "__main__":
    unittest.main()
