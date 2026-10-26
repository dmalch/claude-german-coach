#!/usr/bin/env python3
"""Second opinion on a German text from the local LanguageTool server.

    python3 bewertung/lt.py < text.txt     # JSON list of matches on stdout

Talks to a local server — the learner's texts never leave this machine.
Start it for a grading session (in a Claude session, as a background task, and
stop it afterwards):
    languagetool-server --port 8081
LT_SERVER overrides the address (default http://localhost:8081/v2/check).
LanguageTool offsets count UTF-16 units; for German text they equal Python
string indexes (no characters outside the BMP).
"""

import json
import os
import sys
import urllib.parse
import urllib.request

SERVER = os.environ.get("LT_SERVER", "http://localhost:8081/v2/check")


def check(text, server=SERVER, language="de-DE"):
    body = urllib.parse.urlencode({"text": text, "language": language}).encode()
    with urllib.request.urlopen(urllib.request.Request(server, data=body), timeout=60) as r:
        return parse(json.load(r), text)


def parse(response, text):
    out = []
    for m in response.get("matches", []):
        start, length = m["offset"], m["length"]
        rule = m.get("rule", {})
        out.append(
            {
                "span": text[start : start + length],
                "offset": start,
                "length": length,
                "message": m.get("message", ""),
                "replacements": [r["value"] for r in m.get("replacements", [])[:3]],
                "rule": rule.get("id", ""),
                "category": rule.get("category", {}).get("id", ""),
            }
        )
    return out


if __name__ == "__main__":
    json.dump(check(sys.stdin.read()), sys.stdout, ensure_ascii=False, indent=2)
    print()
