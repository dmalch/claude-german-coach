# Method

This repository packages a German programme that Claude Code runs as a coach for a
Russian-speaking learner, from B1 to C1. This document explains what the programme does and
why. The operational steps live elsewhere:

- the skills `.claude/skills/placement-test`, `.claude/skills/weekly-review` and
  `.claude/skills/practice`;
- the grading procedure in [`bewertung/README.md`](../bewertung/README.md);
- the placement-test data contract and content pack format in
  [`placement-test/README.md`](../placement-test/README.md).

The research behind the design, with sources, is in
[`docs/ru/research.ru.md`](ru/research.ru.md) (Russian). An English summary closes this
document.

The goal is practical C1, not an exam certificate. The programme is designed for about three
hours of focused work a week. Course norms put B1 to C1 at roughly 300 hours (Goethe) to
600–750 hours (BAMF), which at three hours a week is two to five years. Any timeline is an
estimate and is revised only after an external measurement.

## Principles

1. **An external ruler measures the level, not the model's opinion.** LLMs place German texts
   on the right CEFR level in 33–59 % of cases and confuse B1 and B2 most, which is exactly
   the starting boundary. The level therefore comes from an automatically scored C-test
   calibrated against onSET. Writing and speaking get ranges, judged against rated reference
   texts.
2. **Grading writing is a procedure, not an impression.** The correction is split into
   minimal edits, each edit gets a category, and errors are kept apart from style. This makes
   explanations more accurate (94 % against 60 %) and stops overcorrection.
3. **Grammar rules come with a source** (grammis of the IDS, Duden, DWDS), never from the
   model's memory. LLMs get haben/sein, two-way prepositions and adjective endings wrong.
4. **A grade does not change because the learner argues.** A disputed point is re-checked in
   a clean context, with both versions side by side.
5. **Real material for listening and reading.** No synthesised voice. Texts written by Claude
   are allowed only for exercises and C-tests, and each one is checked for noun overload and
   calques from English.
6. **The main enemy is the "I get by" plateau.** Conversation without feedback created it.
   What works: explicit grammar, written correction with a short rule note, and tasks that
   stretch above the current level.
7. **An error is closed by evidence, not by an explanation:** correct use in free texts.
8. **Difficulty is set by the share of correct answers** (target 65–70 %), not by feel.
9. **Dictation is used only for fluency, vocabulary and register.** Speech recognition
   silently fixes up to a quarter of grammar errors, so accuracy is judged from writing.
10. **People matter for motivation, but a club does not raise the level.** Interest in a
    chatbot drops over weeks, interest in a live partner does not. No story we found showed a
    club taking anyone past B1. What did help was a German-only rule the learner set for one
    specific context (a neighbour, a landlord, one group) with English switched off there.
11. **Podcasts on easy and long runs.** Light aerobic exercise helps memory; intervals and
    threshold work hurt it.
12. **External pressure with a date is required.** Everyone who broke the plateau had a real
    stake: a job requirement, a contract at risk, a booked exam. Without one, people drift,
    even with a good teacher. Hence fixed slots in the calendar instead of "when there is
    time", and an external test booked in advance.
13. **Real tasks beat study tasks when they exist.** People who kept using an LLM for months
    used it on narrow real jobs: check a letter before sending it, rehearse a call before
    making it. A real occasion replaces the study task of the week.
14. **Every session has a goal.** Lessons without one drift into small talk and progress
    stalls, even with a teacher.
15. **Chronic errors are kept under control, not "closed".** Articles and verbs with
    prepositions survive even at C1. They get permanent cards, not a one-off drill.

## Where the state lives

A learner profile `profiles/<name>.toml` (symlinked from the learner's private folder) names
a `data_dir` and the paths the tools need. Inside `data_dir` the file names are fixed:

| Path | Holds |
|---|---|
| `<data_dir>/fehler.md` | the error log, started from [`templates/fehler.md`](../templates/fehler.md) |
| `<data_dir>/log/YYYY/MM/DD-woche.yaml` | one log per week, written by the weekly review |
| `<data_dir>/tests/` | graded reports of the placement test and every Kontrolltest |
| `<data_dir>/plans/` | block plans and their goals |
| `<data_dir>/published/placement-test.json` | the record of the learner's published placement-test page |

Levels are tracked in six skills: Lesen, Hören, Schreiben, Sprechen, Grammatik, Wortschatz.

The learner's content pack (C-test texts, items, tasks) is private, because a learner who has
seen the texts can no longer be tested with them. `packs/example/` exists so the page can be
tried out.

## Measurement rules

- **Levels come only from tests:** the C-test and graded writing and speaking. Not from
  conversation, not from the model's impression, not from self-assessment.
- **Every level is a range** per skill (`B1+–B2`), not a single letter.
- **The C-test thresholds are provisional** until they are calibrated against an external
  onSET result. The page labels the C-test level as provisional for this reason. A
  learner's calibration is written into `[ctest]` of their profile, never into
  `scoring.js`: the thresholds there are the defaults for every other learner.
- **onSET is the external ruler**, taken about every six months. The next onSET is booked
  right after the previous one; that booking is the external pressure of principle 12.
  Claude's own Kontrolltests do not count as progress without the external ruler.
- **No progress is announced without a measurement.**

onSET suits this role: 8 C-test texts of 20 gaps, 40 minutes, a result from A2 to C1, and
every text Rasch-calibrated on at least 200 learners. A private person cannot take it at
home; it is taken at a licensed test centre.

Provisional C-test level (`Scoring.estimateCTestLevel` in `placement-test/scoring.js`). It
uses the strict score of the two texts of each band. A band is passed at 60 %, a plus is
earned at 40 % of the next band. The rows are checked top to bottom:

| Condition | Level |
|---|---|
| B1 texts below 60 % | `<B1` |
| B2 texts below 40 % | `B1` |
| B2 texts below 60 % | `B1+` |
| C1 texts below 40 % | `B2` |
| C1 texts below 60 % | `B2+` |
| otherwise | `C1` |

## The placement test (Einstufungstest)

About two and a half hours in two sittings: Teil 0, A, B and C (about 65 minutes), then
Teil D, E and F (about 90 minutes). The page is a private claude.ai artifact; every answer
goes into the page's database. Each section has a timer, progress is saved, and the auto
scores are shown only at the end.

| Teil | Time | What it gives | Scored by |
|---|---|---|---|
| **0. Selbsteinschätzung**: CEFR "Ich kann…" statements by skill and by the learner's topics, on a four-point scale (kaum, mit Mühe, ziemlich gut, mühelos) | 5 min | blind spots: the gap between self-assessment and measurement | — |
| **A. C-Test**: 6 texts × 20 gaps, two each at B1, B2 and C1 | 30 min (5 per text, hard timer) | the general level | auto |
| **B. Grammatik**: 40 items, 10 zones × 4, mostly typing a form rather than choosing one | 15 min | a map of gaps, not a level | auto |
| **C. Lesen**: an official letter and a text on one of the learner's topics, with questions | 15 min | reading | auto |
| **D. Hören**: two real episodes by link (one at B1, one at C1), with questions; listened to at most twice, without transcript or subtitles | 25 min | listening | auto |
| **E. Schreiben**: a formal letter (about 120 words) and a forum post (about 180 words), with a timer and no dictionary | 50 min (20 + 30) | writing and an error map | grader agent |
| **F. Sprechen**: a three-minute monologue and a role-play phone call, both by dictation | 15 min | fluency, vocabulary, register | grader agent |

Writing gets 50 minutes because 300 words in 30 minutes would measure typing speed, not
writing. Goethe B2 gives 75 minutes for two texts.

Teil A has a hard timer: a text is submitted with whatever was typed when its five minutes
run out. All other parts have a soft timer: the clock turns yellow after the limit, and the
part can still be submitted later.

Grammar zones of Teil B, chosen from the typical trouble spots of Russian speakers:

| Code | Zone |
|---|---|
| `ART` | articles and gender, including superfluous articles |
| `PRAEP` | case after prepositions, verb government |
| `ADJ` | adjective endings |
| `WO` | word order and the verbal bracket (verb at the end of a subordinate clause) |
| `AUX` | haben or sein in the Perfekt |
| `PASS` | Passiv |
| `KONJ2` | Konjunktiv II |
| `KONN` | conjunctions and connectors |
| `REL` | relative clauses |
| `NDEKL` | n-declension and Genitiv |

No part of the test is reviewed with the learner before both sittings are done, so that the
writing and speaking of the second sitting are not shaped by fresh feedback.

The result is a graded report in `<data_dir>/tests/` with a range per skill, the gaps in
order of priority and two or three goals for the first block; a filled error log; and the
graded result shown on the same page (see "Results file" in
[`placement-test/README.md`](../placement-test/README.md)).

## C-test rules

- The first and the last sentence stay whole.
- From the second sentence on, the second half of every second word is deleted. With an odd
  length the larger half goes: *Hütte* becomes *Hü___*. One-letter words are not counted.
- 20 gaps per text. Gaps inside one text depend on each other, so the score is counted per
  text and then summed.
- Accepted answers: the original word and a per-gap list of alternatives. Comparison ignores
  case and accepts ae, oe, ue and ss for ä, ö, ü and ß. Typing the whole word also counts.
- A second, spelling-tolerant score (one typo allowed in words of four letters or more) is
  kept for diagnosis. The level uses the strict score.
- Sources: texts under a free licence (de.wikipedia, Wikibooks, Wikinews), or texts written by
  Claude and checked for noun overload and calques. Difficulty is set by word frequency
  (DeReWo) and sentence length. The exact mapping to levels comes after comparison with
  onSET.
- Names and other words that must stay whole are marked with `^` in the source text. Texts
  contain no abbreviations such as *z. B.*, because a period ends a sentence.

## Blocks, Kontrolltests and anchors

- The programme runs in **six-week blocks**. Each block has two or three grammar goals (the
  three most frequent open entries of the error log) and one topic from the learner's topic
  list, in rotation.
- **A Kontrolltest in week 6** consists of:
  - a C-test in which **two texts are the same every time** (the anchors) and the others are
    new texts built the same way;
  - a re-test of the block's goals;
  - one writing task and one speaking task;
  - **re-grading of one old piece of writing**, which catches drift in the grader.
- Anchor texts and new texts are reported separately. A new text is not reused within three
  months.
- **The learner never sees the item-level answers of the anchor texts, only error types.**
  Otherwise the anchor measures memory, not German. The results page shows anchor errors only
  as counts per error type.
- Anchors are picked from the middle of the scale (texts on which the entry score was neither
  near the floor nor near the ceiling) and on topics outside the block rotation.
  `node placement-test/rescore.js --content PACK --answers DIR --anchors A4,A5` names the
  anchor texts when scores are recomputed.
- Every Kontrolltest is a separate page, so the history is never changed after the fact.

## Grading writing and speaking

Writing is graded by **a separate agent in a clean context**, with no chat history, against a
frozen rubric, [`bewertung/RUBRIK.md`](../bewertung/RUBRIK.md):

1. A minimally corrected version of the text.
2. The difference split into minimal edits.
3. For every edit:
   - a category (the codes below);
   - `error` or `style`. Only errors count and enter the error log. When in doubt the grader
     marks `style`, because a false correction is worse than a missed one;
   - a one-sentence rule in Russian, with a link to Duden, grammis or DWDS when the rule is
     not trivial.
4. A cross-check with LanguageTool running locally, so texts never leave the machine.
   Disagreements are written down, not resolved silently.
5. The level as a range on four criteria (task, coherence, vocabulary, structures), compared
   with rated learner texts from the MERLIN corpus in `bewertung/anker/`.

Safeguards:

- **Disputes.** The same agent process, in a fresh context, sees the original edit and the
  learner's argument side by side. A single dispute does not change a grade.
- **The known-answer gate.** `bewertung/testset.json` holds 45 single sentences: 27 with known
  errors (28 errors in all) and 18 correct ones. The grader sees only the ids and texts.
  `bewertung/check_testset.py` requires recall ≥ 0.85, precision ≥ 0.90 and at most one false
  alarm on the correct sentences. The gate is run after every change to the rubric, and a
  rubric that fails it is not used on real texts.
- **Drift.** One old text is re-graded at every Kontrolltest.

Speaking is dictated, so it has its own rubric, [`bewertung/SPRECHEN.md`](../bewertung/SPRECHEN.md):
fluency and coherence, vocabulary, register, and interaction (dialog only). Grammatical
accuracy is not graded from dictation, and nothing from this grading enters the error log,
because the source of a deviation (the learner or the recogniser) is unknown. Corrections a
live teacher writes into a lesson chat are different: they are honest evidence of spoken
errors and do go into the error log.

## The error log

The log is `<data_dir>/fehler.md`, started from [`templates/fehler.md`](../templates/fehler.md).

- An entry is an **exact pattern, not a topic**. Example: "Dativ after *mit*: ~~mit den
  Seil~~ → mit dem Seil".
- **Only corrections marked as errors enter the log:** edits of kind `error` from graded
  writing, and a teacher's written corrections. Style alternatives and dictation do not.
- Fields: category, pattern, first and last occurrence, count, examples with the text they
  came from, and a status **open → practising → closed**.
- **A pattern closes after correct use in three different free texts in a row.** Explaining
  the rule or doing exercises does not close it.
- **Chronic patterns never close:** gender and articles, verbs and adjectives with
  prepositions (*sich freuen auf* + Akk), word order. They are kept under control instead.
  Every noun on a card carries its article, every such verb its preposition and case, and
  these cards never leave the rotation. In the log they have the status *chronic* and a
  metric of **frequency per 100 words**, which should fall.
- The three most frequent open entries become the grammar goals of the next block.
- Every error becomes a card: the corrected sentence with a gap.

Categories (the same codes as in the rubric):

| Code | Category |
|---|---|
| `WO` | word order |
| `KAS` | case |
| `GEN` | gender, article |
| `KONJ` | verb form |
| `AUX` | haben or sein |
| `PRAEP` | preposition |
| `ADJ` | adjective ending |
| `PL` | plural |
| `LEX` | word choice |
| `REG` | register |
| `ORTH` | spelling |

The grammar zones of Teil B and these categories are two separate code sets: the zones map
the gaps of the placement test, and the categories classify edits in free texts.

## Weekly rhythm

| Block | Minutes | How | Why |
|---|---|---|---|
| **Wortschatz** | 35 (7 × 5) | every day, attached to an existing habit ("after X I do Y"); cards from phrases and from the learner's own errors; FSRS intervals | vocabulary, connectors |
| **Schreiben** | 45 | once at the weekend: a task (a letter to an office, a trip report, an opinion on a forum), 150–250 words → Claude's review → **rewrite** in the middle of the week → second review. The best texts later feed speaking | accuracy |
| **Sprechen** | 60 + 20 | a weekly live lesson with a tutor, on a request Claude writes; a real upcoming call goes here. Plus 20 minutes of own practice: 4/3/2 by dictation and retelling the best corrected text | fluency, phone calls, spoken accuracy |
| **Grammatik** | 30 (2 × 15) | the two or three block goals from the error log; production exercises with automatic checking | fossilised errors |
| **Input intensiv** | 30 | one episode with a transcript (for example DW Top-Thema, later Alltagsdeutsch); useful phrases go into cards | listening, topic vocabulary |
| *outside the budget* | — | podcasts on easy or long runs **without written summaries** (they cost others about three hours an episode), at most three spoken sentences; a book or audiobook from Onleihe; series with German subtitles | extensive input |

**Three fixed slots.** Two short weekday slots of 30–35 minutes (speaking and grammar) and one
long weekend session (writing and input), plus five minutes of cards every day. The slots
sit in the calendar at fixed days and hours, attached to existing habits and away from hard
training days. Every session has one named goal.

**A real occasion beats a study task.** When the week holds a real letter (an office, a
landlord, an insurer, a doctor) or an upcoming phone call, it replaces the study task: the
letter goes through the same review before it is sent, and the call is rehearsed before it
is made.

**The weekly review** comes after the long weekend session, so the writing feedback is ready
before the mid-week rewrite. The learner asks for it, or a scheduled task starts it. Claude
reads the page databases, grades writing and speech, updates the error log, writes
`<data_dir>/log/YYYY/MM/DD-woche.yaml`, sets the tasks of the next week and commits. Its
first question is whether the live lesson took place.

**A minimum dose instead of zero.** When motivation drops, the system carries on: the minimum
is five minutes of cards a day plus the weekly lesson. Two nearly empty weeks in a row lead
to a deliberate pause (including pausing a lesson subscription), not to silent drift and
unused credits.

**Live lessons with a tutor.** The tutor covers what Claude cannot: pronunciation, spoken
accuracy, live interaction. Individual lessons, not group ones: a group lesson leaves 10–15
minutes of own speech.

- Claude writes the lesson request a week ahead, in the weekly review: the block topic, the
  three main errors from the error log, and the request *"Korrigieren Sie mich direkt und
  schreiben Sie die Korrekturen in den Chat."*
- **Book ahead.** On the day a lesson package is paid, all of its lessons are booked.
- **Before any break** (a trip, holidays, a race), **the first lesson after it is booked**, so
  the date of return exists before the break starts. Lesson series tend to end at a break and
  not restart.
- **The chat is copied before leaving the lesson**, since platforms may not keep it. The
  teacher's corrections go from the chat into the error log and into cards.
- A credit unused for two weeks is a signal to look at what went wrong, not something to
  save up.
- After four weeks, check whether teachers follow the request, how many corrections arrive in
  the chat, and whether the target errors become rarer. If teachers keep to their own
  textbook lesson instead, switch to a permanent tutor.

## What not to do

- Conversation without feedback as the main method: it created the plateau.
- Grammar rules from the model's memory without a source.
- A synthesised voice for listening.
- Grading grammatical accuracy from dictation.
- Podcasts during interval training.
- Repeating A2/B1 grammar without production.
- Exam preparation for the sake of the exam.
- Announcing progress without a measurement.
- Written summaries of podcasts: expensive, and they do not pay off.
- Sessions without a named goal: they drift into small talk.
- Counting on a club as a source of level.

## Pages and roadmap

Every page is a private claude.ai artifact with its own database. The learner works on the
page, answers go into the database, and Claude reads and writes it through ArtifactData. The
page code lives in this repository; the learner's content and results stay in their private
pack and `data_dir`.

| Page | Status | Content | How often |
|---|---|---|---|
| **Einstufungstest** | built, [`placement-test/`](../placement-test/) | Teil 0 and A–F; also the base of every Kontrolltest | once, then a Kontrolltest every six weeks |
| **Cockpit** | planned | the main page with three tabs. *Woche*: the week's tasks, writing and speech submissions, the review inline in the text, done marks. *Fortschritt*: the level per skill across all tests, checkpoints, the timeline estimate. *Fehler*: open patterns and their progress | 3–4 times a week |
| **Card trainer** (Wortschatz-Trainer) | planned | for the phone. A card is a phrase with a gap, and the answer is typed, not flipped. FSRS intervals. Claude makes the cards from errors and from listened material; cards that are always forgotten are shown and rewritten | 5 minutes a day |
| **Lehrbuch chapters** | planned | written only when the error log calls for them: the rule with a source, examples from the learner's topics, the trap for Russian speakers, exercises with automatic checking | when a topic becomes a block goal |

The card trainer is built for the phone. The test, the Cockpit and the Lehrbuch are built for
a laptop, since nobody writes 180 words on a phone.

## Research summary

The full research, in Russian and with all sources, is in
[`docs/ru/research.ru.md`](ru/research.ru.md).

- **LLMs misjudge levels.** On German learner texts an LLM picked the right CEFR level in
  33 % of cases without reference texts and 59 % with them; almost all misses were one level
  off, worst at B2 (<https://arxiv.org/abs/2512.06483>). With one real essay per level, GPT-4
  reached 0.81 agreement with experts (<https://aclanthology.org/2023.bea-1.49/>).
- **Minimal edits make explanations accurate.** Asking directly, 60.2 % of errors were
  explained; splitting the correction into minimal edits first and explaining each raised it
  to 93.9 % on German data (<https://aclanthology.org/2024.findings-naacl.49/>).
- **LLMs overcorrect.** On German texts GPT-4o-mini was right in 70 % of its flags but caught
  only 53 % of the errors (<https://arxiv.org/abs/2502.08507>,
  <https://arxiv.org/abs/2605.07635>).
- **LLMs are sycophantic.** A model changes its grade when the learner pushes back, but
  usually judges correctly when shown both versions side by side
  (<https://arxiv.org/abs/2509.16533>, <https://arxiv.org/abs/2605.14604>).
- **LLM grammar explanations go wrong** on haben/sein, two-way prepositions and adjective
  endings, sometimes contradicting their own examples
  (<https://deutschable.com/should-you-learn-german-with-chatgpt/>).
- **Generated texts drift in level.** German reading texts by ChatGPT were denser and more
  noun-heavy than TestDaF texts and contained calques from English
  (<https://www.cambridge.org/core/journals/annual-review-of-applied-linguistics/article/abs/how-good-are-llms-in-generating-input-texts-for-reading-tasks-in-german-as-a-foreign-language/7E4BDD5DA784AF506718D8D4821A5074>).
- **Dictation hides errors.** Whisper-large silently fixed an agreement error in 23.1 % of
  cases (<https://aclanthology.org/2024.acl-long.348/>).
- **Hours.** Mid-B1 to mid-C1 is about 300 hours by Goethe norms
  (<https://www.goethe.de/pro/relaunch/prf/en/Handbuch_Pruefungsziele_Testbeschreibung_C1.pdf>)
  and 600–750 hours by BAMF course norms
  (<https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/berufssprachkurse-kursarten-ueberblick-tabelle.pdf>).
  These are classroom norms, not measurements.
- **The plateau.** Getting by removes the pressure to fix fossilised errors; the way out is
  noticing, stretching and restructuring
  (<https://www.professorjackrichards.com/wp-content/uploads/moving-beyond-the-plateau.pdf>).
- **Methods with measured effects.** Explicit grammar beats implicit
  (<https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-9922.2010.00562.x>); written
  corrective feedback g = 0.54 (<https://onlinelibrary.wiley.com/doi/abs/10.1111/modl.12189>);
  direct correction with a short rule note beats correction alone
  (<https://eric.ed.gov/?id=EJ788008>); retrieval practice g = 0.50–0.61
  (<https://journals.sagepub.com/doi/abs/10.3102/0034654316689306>); spacing, with 3.3 days
  better than 7 for grammar (<https://onlinelibrary.wiley.com/doi/10.1111/lang.12236>);
  "after X I do Y" plans d = 0.65 (<https://kops.uni-konstanz.de/handle/123456789/10973>).
- **Exercise and memory.** Light aerobic exercise helps memory
  (<https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0177624>), intense
  exercise hurts it (<https://pubmed.ncbi.nlm.nih.gov/28985100/>).
- **The C-test is a sound general measure.** It is reliable and measures the same general
  ability that underlies all four parts of TestDaF
  (<https://journals.sagepub.com/doi/abs/10.1191/0265532206lt330oa>); gap difficulty is
  predictable from word frequency, the number of possible answers and gap dependence
  (<https://aclanthology.org/Q14-1040/>).
- **onSET.** 8 C-test texts of 20 gaps, 40 minutes, A2 to C1, each text Rasch-calibrated on at
  least 200 learners (<https://www.onset.de/home/forschung/>); private persons cannot take it
  from home (<https://www.onset.de/home/haeufige-fragen-onset-spracheinstufungstest/>).
- **Typical errors of Russian speakers:** gender and case, Russian aspect carried into German
  tenses, the passive, prepositions and government, word order and the bracket, missing and
  superfluous articles, impersonal *es*, *sein/haben/es gibt*
  (<https://ediss.sub.uni-hamburg.de/handle/ediss/2054>).
- **First-person stories.** Every breakthrough to C1 had external pressure with a date and
  repeated individual feedback on writing; nobody re-took a real test after months with an
  LLM tutor; and no reliable case showed a club raising anyone above B1
  (<https://www.bpb.de/themen/migration-integration/kurzdossiers/548695/sport-verbindet-integration-in-und-durch-sportvereine/>).
  Interest in a chatbot partner drops over time while interest in a human partner does not
  (<https://www.sciencedirect.com/science/article/abs/pii/S0747563217303667>).
