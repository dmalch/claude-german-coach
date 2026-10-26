import io
import shutil
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

import check_public

HAS_NODE = shutil.which("node") is not None

# Synthetic secrets, assembled at run time so this file itself never matches.
SECRET = "Der Hausmeister erklärt geduldig, warum die Heizung im dritten Stock seit Montag nicht mehr funktioniert und wer jetzt zuständig ist."
OTHER = (
    "Ganz anderer Text über das Wetter am Meer, der mit nichts übereinstimmt und lang genug ist."
)
HOME = "/" + "Users" + "/alice/"
ARTIFACT = "claude.ai/" + "artifact/" + "Zx9Yw8Vu7Ts6"
AT = "@"


def git(root, *args):
    subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True)


class GateTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / "repo"
        self.root.mkdir()
        git(self.root, "init", "-q")
        git(self.root, "config", "user.email", "test" + AT + "example.invalid")
        git(self.root, "config", "user.name", "Test")
        pack = Path(self.tmp.name) / "content.js"
        pack.write_text(
            "module.exports = { ctest: ["
            f'{{ id: "A4", text: {SECRET!r} }}, {{ id: "A1", text: {OTHER!r} }}'
            "] };\n",
            encoding="utf-8",
        )
        self.pack = pack

    def tearDown(self):
        self.tmp.cleanup()

    def put(self, rel, text):
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def run_gate(self, *extra):
        buf = io.StringIO()
        with redirect_stdout(buf):
            code = check_public.main(["--root", str(self.root), *extra])
        return code, buf.getvalue()

    def test_clean_tree_passes(self):
        self.put("README.md", "Nothing personal in here.\n")
        code, out = self.run_gate()
        self.assertEqual(code, 0, out)
        self.assertIn("clean", out)

    def test_builtin_patterns(self):
        self.put("a.md", f"see {HOME}notes and https://{ARTIFACT}\n")
        self.put("b.md", "mail me: someone" + AT + "example.org\n")
        code, out = self.run_gate()
        self.assertEqual(code, 1)
        self.assertIn("a.md: home path", out)
        self.assertIn("a.md: artifact id", out)
        self.assertIn("b.md: email", out)
        self.assertNotIn("alice", out)  # findings never quote what matched

    def test_url_segments_are_not_home_paths(self):
        self.put(
            "doc.md", "see <https://www.onset.de/" + "home/forschung/> and https://x.org/Users/a/\n"
        )
        code, out = self.run_gate()
        self.assertEqual(code, 0, out)

    def test_github_noreply_is_allowed(self):
        self.put("ci.yml", "email: 49699333+dependabot[bot]@users.noreply.github.com\n")
        code, out = self.run_gate()
        self.assertEqual(code, 0, out)

    def test_deny_list(self):
        deny = Path(self.tmp.name) / "deny"
        deny.write_text("# comment\n\\bMusterfrau\\b\n", encoding="utf-8")
        self.put("doc.md", "Frau Musterfrau hat korrigiert.\n")
        code, out = self.run_gate("--deny-list", str(deny))
        self.assertEqual(code, 1)
        self.assertIn("deny-list line 1", out)
        self.assertNotIn("Musterfrau", out)

    def test_ignored_files_are_not_scanned(self):
        self.put(".gitignore", "build/\n")
        self.put("build/page.md", f"{HOME}\n")
        code, out = self.run_gate()
        self.assertEqual(code, 0, out)

    @unittest.skipUnless(HAS_NODE, "node reads the secret pack")
    def test_secret_run_of_eight_words_fails_even_with_changed_case_and_umlauts(self):
        words = SECRET.split()
        excerpt = " ".join(words[2:11]).upper().replace("Ä", "AE")
        self.put("fixture.js", f"// {excerpt}\n")
        code, out = self.run_gate("--secret-pack", str(self.pack), "--secret-ids", "A4")
        self.assertEqual(code, 1, out)
        self.assertIn("secret text", out)
        self.assertNotIn(words[3], out)

    @unittest.skipUnless(HAS_NODE, "node reads the secret pack")
    def test_short_overlap_is_only_a_note(self):
        self.put("doc.md", " ".join(SECRET.split()[:5]) + " und dann etwas anderes.\n")
        code, out = self.run_gate("--secret-pack", str(self.pack), "--secret-ids", "A4")
        self.assertEqual(code, 0, out)
        self.assertIn("note:", out)

    @unittest.skipUnless(HAS_NODE, "node reads the secret pack")
    def test_only_the_named_ids_are_secret(self):
        self.put("doc.md", OTHER + "\n")
        code, out = self.run_gate("--secret-pack", str(self.pack), "--secret-ids", "A4")
        self.assertEqual(code, 0, out)

    @unittest.skipUnless(HAS_NODE, "node reads the secret pack")
    def test_unknown_secret_id_is_an_input_error(self):
        code, _ = self.run_gate("--secret-pack", str(self.pack), "--secret-ids", "A9")
        self.assertEqual(code, 2)

    def test_history_finds_a_leak_that_was_deleted(self):
        self.put("old.md", f"{HOME}\n")
        git(self.root, "add", "-A")
        git(self.root, "commit", "-q", "-m", "oops")
        (self.root / "old.md").unlink()
        git(self.root, "add", "-A")
        git(self.root, "commit", "-q", "-m", "fix")
        code, _ = self.run_gate()
        self.assertEqual(code, 0)
        code, out = self.run_gate("--history")
        self.assertEqual(code, 1)
        self.assertIn("history", out)
        self.assertIn("(old.md)", out)

    def test_words_fold_umlauts_and_drop_protection_marks(self):
        self.assertEqual(check_public.words("^Prüfung, Straße!"), ["pruefung", "strasse"])


if __name__ == "__main__":
    unittest.main()
