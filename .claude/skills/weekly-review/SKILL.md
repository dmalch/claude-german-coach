---
name: weekly-review
description: Run a learner's weekly German review — was the live lesson held, which slots happened, test status, the week's writing checked, the error log and profile updated, the week logged, next week planned. Use for the scheduled Saturday review or when asked to review the week ("разбор недели", "как прошла неделя", "проверь неделю").
argument-hint: "--profile NAME"
allowed-tools: Bash Read Write Edit Grep Agent
---

# weekly-review

The review exists because a programme like this rarely dies from a bad method. It dies
from a break that is never restarted. So the coach opens the review, and the learner
does not have to remember it.

**Tone.** Russian, short and concrete, like a fitness coach:

- no guilt, no lectures;
- numbers over impressions;
- one question at a time when you need an answer.

**Read first:**

- the profile: `python3 <core>/learner_profile.py NAME --check`, then the file itself;
- `<data_dir>/fehler.md`;
- the current plan in `<data_dir>/plans/`, if any;
- the last two weekly logs in `<data_dir>/log/`.

The method behind every step is in `<core>/docs/method.md`.

**Never on your own.** Do not book, cancel or pay for anything. Do not send messages.
Do not create or move calendar events. Propose it and wait for a yes in this session.

## Steps

1. **Open with one question.**
   - If the profile has live lessons, ask "Урок в <weekday> был?".
   - Add a checklist built from `[slots]`, plus cards, for the learner to tick.
   - Wait for the answer.

2. **Tests in progress.** If a placement test or a Kontrolltest is open, run
   `placement-test status`. Report done / missing in one line. When everything is in,
   offer to grade it now.

3. **The week's writing.**
   - Each free text the learner wrote this week is graded by a fresh agent against
     `bewertung/RUBRIK.md`, as described in `placement-test grade`, step 3.
   - Teacher corrections pasted from a live lesson's chat count as evidence of spoken
     errors.
   - Corrections from dictation do not count.
   - Add errors to `fehler.md` following its rules. A pattern closes only after correct
     use in three different free texts in a row. Chronic patterns are counted per
     100 words.

4. **Live lessons**, if the profile has them.
   - Count lessons held against lessons booked, and the credits left unused.
   - **Before any break**, such as a trip, holidays or a race weekend, the first lesson
     after it is booked before the break starts.
   - A credit unused for two weeks is a reason to talk, not to save it up.
   - **Write the lesson brief in German** for the next lesson that still needs one:
     - the topic, taken from the current block or from a real call or letter coming up;
     - the learner's top three open error patterns from `fehler.md`, written as
       concrete examples;
     - "Bitte korrigieren Sie mich direkt und schreiben Sie die Korrekturen in den Chat."
   - Ask the learner to paste the last lesson's chat corrections.

5. **A near-zero week.**
   - Say it plainly in one line, and ask one question: what took the attention.
   - Set next week to `[goal].minimum_dose`.
   - If it is the second such week in a row, offer a choice: the minimum dose with a
     fixed restart day, or a conscious pause of the paid lessons. Never let credits
     pile up.

6. **Log the week** to `<data_dir>/log/YYYY/MM/DD-woche.yaml`, dated this review's day:

   ```yaml
   date: YYYY-MM-DD
   lesson_held: 1        # live lessons held this week
   wed: done             # one line per slot in [slots]: done | partly | missed | ~
   cards_days: 5         # 0–7
   minutes_estimate: 180
   tests: ~              # units submitted, if a test is open
   notes: >
     what happened, in two or three lines
   ```

   An unknown value is `~`. Update the profile and `fehler.md` if anything changed.
   Commit only files in the learner's folder, with explicit paths, following that
   repo's commit conventions.

7. **Next week, in at most five lines:**
   - which slot does what;
   - the next external date from `[external]`, such as an onSET or a trip.

## Personal extensions

A learner's private folder can have its own thin `weekly-review` skill. It adds steps
that belong to that person alone: their lesson provider's booking rules, mail or
calendar checks, trips. When one exists, run its extra steps where it says.
