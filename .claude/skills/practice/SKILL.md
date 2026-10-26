---
name: practice
description: A German practice session in the chat, built from the learner's own error log — fix their own sentences, one rule, transfer items, a short free text, a role-play — and log what it shows. Use when the learner has some time and asks what to do or wants to practise ("есть время позаниматься", "что посоветуешь", "давай поупражняемся").
argument-hint: "--profile NAME [minutes]"
allowed-tools: Bash Read Write Edit Grep
---

# practice

A session takes about 25 minutes and is built from the learner's own mistakes, not
from a textbook. Speak Russian, put the German in italics, and keep it short.

## Before the first task

1. Read `<data_dir>/fehler.md`, the profile's `[goal]`, the current block goals (the
   newest report in `<data_dir>/tests/` or the plan in `<data_dir>/plans/`) and the
   last weekly log.
2. Choose the material:
   - **open** patterns ranked by count;
   - **chronic** patterns ranked by their latest rate per 100 words;
   - the current block goals first.
3. **No C-test material, ever.** Do not use gap texts or the anchors, and no
   C-test-style drills before an external test (onSET). Practising the format would
   inflate that test and spoil its calibration.

If the learner gives less time, keep steps 1 and 5 and drop the rest.

## The session

1. **Their own sentences, 5 min.** Take 5–6 sentences from their texts and the error
   log examples, lightly simplified, mixing two patterns. Example mix: verb position
   in subordinate clauses and noun-group endings. Say how many errors there are in
   total, and ask for the sentences rewritten without looking anything up.
2. **Check it.** Give a score per pattern ("порядок слов 4 из 4, окончания 1 из 4").
   Write each fix as ~~wrong~~ → ***right*** with a one-line reason. Name any
   **hypercorrection** explicitly, for example verb-final applied to a main clause.
3. **One rule, at most five lines.** Include the trap for Russian speakers. Example:
   Russian «если бы» does not mark time, German Konjunktiv II does. A small table is
   fine. Give a usable tool rather than the grammar book. Example: with no article,
   put the article in mentally and take its last letter: *bei de**m** Wetter →
   schlecht**em***.
4. **Transfer, 6–8 new items** on the same rules. They can be new gap sentences,
   endings to fill in, or short translations from Russian whose context forces the
   choice.
5. **Short free text, 60–100 words**, on a topic from `[goal].domains` or a real
   upcoming situation, aimed at the block goal. Example: "what would you do
   differently" forces Konjunktiv II. Correct it the same way as in step 2.
6. **Role-play**, if time is left, typed in the chat: a phone call or an office visit
   from the domains. You play the other side. End with the learner repeating the date
   and time back ("Also Dienstag, 7:45 Uhr, richtig?").

## After the session

- **Log errors from typed free text only** (steps 5 and 6) into `fehler.md`, following
  its rules.
  - Steps 1 and 4 are exercises and never close or open a pattern.
  - Correct use in a free text counts towards closing a pattern: three different free
    texts in a row.
  - Dictated text is not logged (see `bewertung/SPRECHEN.md`).
- If the session showed a new trap, note it as a candidate in `fehler.md`, for example
  a hypercorrection or a form the learner avoids.
- Tell the learner in one line what was logged.
