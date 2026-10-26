import unittest
import urllib.error

from lt import check, parse

CANNED = {
    "matches": [
        {
            "offset": 4,
            "length": 3,
            "message": "Möglicherweise fehlende grammatische Übereinstimmung.",
            "replacements": [
                {"value": "das"},
                {"value": "dem"},
                {"value": "des"},
                {"value": "die"},
            ],
            "rule": {"id": "DE_AGREEMENT", "category": {"id": "GRAMMAR"}},
        }
    ]
}


class ParseTest(unittest.TestCase):
    def test_maps_offset_to_span(self):
        out = parse(CANNED, "Auf den Wochenende")
        self.assertEqual(out[0]["span"], "den")
        self.assertEqual(out[0]["rule"], "DE_AGREEMENT")
        self.assertEqual(out[0]["category"], "GRAMMAR")

    def test_keeps_three_replacements(self):
        out = parse(CANNED, "Auf den Wochenende")
        self.assertEqual(out[0]["replacements"], ["das", "dem", "des"])

    def test_no_matches(self):
        self.assertEqual(parse({"matches": []}, "Alles gut."), [])


class ServerTest(unittest.TestCase):
    def test_live_server_flags_misspelling(self):
        try:
            out = check("Ich habe das Buch gelessen.")
        except urllib.error.URLError:
            self.skipTest("LanguageTool server not running on localhost:8081")
        self.assertTrue(any(m["span"] == "gelessen" for m in out), out)


if __name__ == "__main__":
    unittest.main()
