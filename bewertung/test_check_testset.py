import unittest

from check_testset import contains, evaluate, gate

TESTSET = {
    "items": [
        {
            "id": "e1",
            "text": "Ich freue mich auf den Wochenende.",
            "errors": [{"wrong": "den", "right": "das", "category": "GEN"}],
        },
        {
            "id": "e2",
            "text": "Er hat mir eine gute Tipp gegeben.",
            "errors": [
                {"wrong": "eine", "right": "einen", "category": "GEN"},
                {"wrong": "gute", "right": "guten", "category": "ADJ"},
            ],
        },
        {"id": "c1", "text": "Ich bin gestern 15 Kilometer gelaufen.", "errors": []},
    ]
}


def edit(wrong, right, category, kind="error"):
    return {"wrong": wrong, "right": right, "category": category, "kind": kind}


class ContainsTest(unittest.TestCase):
    def test_word_boundaries(self):
        self.assertTrue(contains("auf den Wochenende", "den"))
        self.assertFalse(contains("denken", "den"))

    def test_case_and_space_insensitive(self):
        self.assertTrue(contains("Den  Wochenende", "den wochenende"))


class EvaluateTest(unittest.TestCase):
    def test_perfect_output(self):
        out = [
            {"id": "e1", "edits": [edit("den", "das", "GEN")]},
            {"id": "e2", "edits": [edit("eine", "einen", "GEN"), edit("gute", "guten", "ADJ")]},
            {"id": "c1", "edits": []},
        ]
        r = evaluate(TESTSET, out)
        self.assertEqual((r["recall"], r["precision"], r["category_accuracy"]), (1.0, 1.0, 1.0))
        self.assertTrue(gate(r))

    def test_one_wide_edit_covers_two_expected_errors(self):
        out = [
            {"id": "e1", "edits": [edit("auf den Wochenende", "auf das Wochenende", "GEN")]},
            {"id": "e2", "edits": [edit("eine gute Tipp", "einen guten Tipp", "GEN")]},
            {"id": "c1", "edits": []},
        ]
        r = evaluate(TESTSET, out)
        self.assertEqual(r["recall"], 1.0)
        self.assertEqual(r["precision"], 1.0)
        self.assertAlmostEqual(r["category_accuracy"], 2 / 3)

    def test_false_alarm_on_correct_sentence(self):
        out = [
            {"id": "e1", "edits": [edit("den", "das", "GEN")]},
            {"id": "e2", "edits": [edit("eine gute Tipp", "einen guten Tipp", "GEN")]},
            {"id": "c1", "edits": [edit("bin", "habe", "AUX"), edit("gelaufen", "gerannt", "LEX")]},
        ]
        r = evaluate(TESTSET, out)
        self.assertEqual(r["false_alarms_on_correct"], 2)
        self.assertFalse(gate(r))

    def test_style_edits_are_ignored(self):
        out = [
            {"id": "e1", "edits": [edit("den", "das", "GEN")]},
            {"id": "e2", "edits": [edit("eine gute Tipp", "einen guten Tipp", "GEN")]},
            {
                "id": "c1",
                "edits": [edit("15 Kilometer", "fünfzehn Kilometer", "ORTH", kind="style")],
            },
        ]
        self.assertEqual(evaluate(TESTSET, out)["false_alarms_on_correct"], 0)

    def test_missing_item_counts_as_misses(self):
        r = evaluate(TESTSET, [{"id": "e1", "edits": [edit("den", "das", "GEN")]}])
        self.assertAlmostEqual(r["recall"], 1 / 3)
        self.assertEqual(len(r["misses"]), 2)


if __name__ == "__main__":
    unittest.main()
