import json
import shutil
import tempfile
import textwrap
import unittest
from pathlib import Path

import build_page
import learner_profile

HAS_NODE = shutil.which("node") is not None

PACK = 'module.exports = { version: "test-1", ctest: [{ id: "A1" }, { id: "A2" }] };\n'


class BuildTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        (self.dir / "content.js").write_text(PACK, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def profile(self, anchors="[]", results=None):
        extra = f'results = "{results}"\n' if results else ""
        text = textwrap.dedent(f"""
            data_dir = "."
            [goal]
            target = "B2"
            budget_min_per_week = 120
            domains = []
            [placement_test]
            content = "content.js"
            {extra}
            [ctest]
            anchors = {anchors}
        """)
        path = self.dir / "learner.toml"
        path.write_text(text, encoding="utf-8")
        return learner_profile.load(path=path)

    def test_copies_engine_and_pack_byte_for_byte(self):
        out = self.dir / "out"
        build_page.build(self.profile(), out)
        engine = build_page.ENGINE
        self.assertEqual((out / "index.html").read_bytes(), (engine / "index.html").read_bytes())
        self.assertEqual((out / "content.js").read_bytes(), PACK.encode())
        for name in build_page.page_scripts():
            self.assertTrue((out / name).is_file(), name)

    def test_without_results_the_stub_is_used(self):
        out = self.dir / "out"
        manifest = build_page.build(self.profile(), out)
        self.assertEqual(manifest["results"], "stub")
        self.assertEqual((out / "ergebnis.js").read_bytes(), build_page.STUB.read_bytes())

    def test_learner_results_are_copied(self):
        (self.dir / "ergebnis.js").write_text("window.EinstufungErgebnis = {};\n", encoding="utf-8")
        out = self.dir / "out"
        manifest = build_page.build(self.profile(results="ergebnis.js"), out)
        self.assertEqual(manifest["results"], "learner")
        self.assertIn(b"= {}", (out / "ergebnis.js").read_bytes())

    def test_digest_is_stable_and_tracks_content(self):
        prof = self.profile()
        first = build_page.build(prof, self.dir / "a")
        second = build_page.build(prof, self.dir / "b")
        self.assertEqual(first["digest"], second["digest"])
        self.assertEqual(first["pack_version"], "test-1")
        (self.dir / "content.js").write_text(PACK.replace("test-1", "test-2"), encoding="utf-8")
        third = build_page.build(prof, self.dir / "c")
        self.assertNotEqual(first["digest"], third["digest"])
        saved = json.loads((self.dir / "a" / "manifest.json").read_text())
        self.assertEqual(saved["digest"], first["digest"])

    def test_rebuild_replaces_its_own_folder(self):
        out = self.dir / "out"
        prof = self.profile()
        build_page.build(prof, out)
        (out / "leftover.js").write_text("x", encoding="utf-8")
        build_page.build(prof, out)
        self.assertFalse((out / "leftover.js").exists())

    def test_refuses_a_folder_it_did_not_create(self):
        out = self.dir / "precious"
        out.mkdir()
        (out / "notes.txt").write_text("keep me", encoding="utf-8")
        with self.assertRaises(build_page.BuildError):
            build_page.build(self.profile(), out)
        self.assertTrue((out / "notes.txt").exists())

    @unittest.skipUnless(HAS_NODE, "node is needed to read pack ids")
    def test_anchors_must_exist_in_the_pack(self):
        build_page.build(self.profile(anchors='["A2"]'), self.dir / "ok")
        with self.assertRaises(build_page.BuildError) as ctx:
            build_page.build(self.profile(anchors='["A9"]'), self.dir / "bad")
        self.assertIn("A9", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
