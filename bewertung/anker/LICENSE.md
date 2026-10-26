# Lizenz der Ankertexte

Die Texte in diesem Verzeichnis (`b1-1.md`, `b1-2.md`, `b2-1.md`, `b2-2.md`, `c1-1.md`,
`c1-2.md`) stammen aus dem **MERLIN-Korpus** (<https://www.merlin-platform.eu/>), einem
mehrsprachigen Korpus von Deutsch-, Italienisch- und Tschechischlernertexten, deren
Deutschanteil von geschulten Gutachtern auf den CEFR eingestuft wurde. Lizenz der
MERLIN-Texte: **CC BY-SA 4.0**.

## Retrieval-Quelle

Nicht direkt aus MERLIN abgerufen: Das ANNIS-Websuchinterface
(<https://merlin-platform.eu/C_search.php>) ist JavaScript-only und über einfache HTTP-Anfragen
nicht auswertbar, und das Eurac-CLARIN-Repository für den Korpus-Download liegt hinter einer
Bot-Sperre. Stattdessen wurden die sechs Dateien einzeln über die per-Datei-Kopie der
deutschen MERLIN-Lernertexte im GitHub-Repository

    https://github.com/nishkalavallabhi/UniversalCEFRScoring/tree/master/Datasets/DE

abgerufen (Datensatz zu Vajjala & Rama, "Experiments with Universal CEFR Classification",
Proceedings of the 13th BEA Workshop, 2018). Jede Datei in diesem Verzeichnis nennt in ihrem
Front-Matter die MERLIN-ID (`merlin_id`) und die genaue Roh-URL (`source`), unter der der
Text abgerufen wurde.

## Nutzung hier

Die Texte dienen ausschließlich als Referenzanker für die Rubrik (`bewertung/RUBRIK.md`) —
Vergleichsmaterial, um die CEFR-Einstufung eines Lernertextes an bereits fremdbewerteten
Texten zu kalibrieren. Sie werden unverändert (Fehler eingeschlossen) zitiert.

## Lizenz, Zitation, Änderungen

- **Lizenz:** Creative Commons Namensnennung – Weitergabe unter gleichen Bedingungen 4.0
  International (CC BY-SA 4.0), <https://creativecommons.org/licenses/by-sa/4.0/>. Sie gilt
  für die sechs Ankertexte in diesem Verzeichnis; der Rest des Repositorys steht unter der
  MIT-Lizenz (siehe `NOTICE.md` im Wurzelverzeichnis).
- **Zitation des Korpus:** Boyd, A., Hana, J., Nicolas, L., Meurers, D., Wisniewski, K.,
  Abel, A., Schöne, K., Štindlová, B., Vettori, C. (2014): *The MERLIN corpus: Learner
  language and the CEFR.* In: Proceedings of the Ninth International Conference on Language
  Resources and Evaluation (LREC 2014), Reykjavík, S. 1281–1288.
- **Abrufquelle:** Vajjala, S., Rama, T. (2018): *Experiments with Universal CEFR
  Classification.* In: Proceedings of the Thirteenth Workshop on Innovative Use of NLP for
  Building Educational Applications (BEA), S. 147–153.
- **Änderungen:** Jeder Datei wurde ein YAML-Front-Matter (Niveau, MERLIN-ID, Aufgabe,
  Quelle, Lizenz) vorangestellt. Die Texte selbst sind unverändert, Fehler eingeschlossen.
