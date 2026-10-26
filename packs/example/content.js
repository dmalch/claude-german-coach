/* Content of the Einstufungstest (design §5): self-assessment, C-test, grammar
 * diagnostic, reading, listening, writing and speaking tasks. All German text is
 * written for this test (the listening episodes are DW's, linked, never copied).
 * C-test texts mark proper names with ^ so the engine never gaps them.
 * Browser global: EinstufungContent. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EinstufungContent = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const RFN = ["richtig", "falsch", "steht nicht im Text"];
  const RFN_HOEREN = ["richtig", "falsch", "wird nicht gesagt"];

  const sections = [
    { id: "self", title: "Teil 0 · Selbsteinschätzung", minutes: 5, timer: "soft", sitting: 1 },
    { id: "A", title: "Teil A · C-Test", minutes: 30, timer: "hard", sitting: 1 }, // 6 × 5 min, per text
    { id: "B", title: "Teil B · Grammatik", minutes: 15, timer: "soft", sitting: 1 },
    { id: "C", title: "Teil C · Lesen", minutes: 15, timer: "soft", sitting: 1 },
    { id: "D", title: "Teil D · Hören", minutes: 25, timer: "soft", sitting: 2 },
    { id: "E", title: "Teil E · Schreiben", minutes: 50, timer: "soft", sitting: 2 }, // E1 20 + E2 30 (review: 10 words/min was too tight)
    { id: "F", title: "Teil F · Sprechen", minutes: 15, timer: "soft", sitting: 2 },
  ];

  // LanguageTool 2026-09-22: only GERMAN_WORD_REPEAT_BEGINNING_RULE on "Ich" — the
  // statements are separate items, not one text (false alarm). Re-run 2026-09-23 one
  // statement at a time, after the review fixes: no matches.
  const self = {
    scale: ["kaum", "mit Mühe", "ziemlich gut", "mühelos"],
    statements: [
      { id: "s-hoe-b1", group: "Hören", level: "B1", de: "Ich verstehe das Wichtigste, wenn jemand langsam und deutlich über Alltagsthemen spricht.", ru: "Понимаю главное, когда о повседневных вещах говорят медленно и чётко." },
      { id: "s-hoe-b2", group: "Hören", level: "B2", de: "Ich verstehe die meisten Radionachrichten, wenn Hochdeutsch gesprochen wird.", ru: "Понимаю большинство новостей по радио на литературном немецком." },
      { id: "s-hoe-c1", group: "Hören", level: "C1", de: "Ich kann längeren Gesprächen und Vorträgen folgen, auch wenn sie nicht klar aufgebaut sind.", ru: "Могу следить за длинными разговорами и докладами, даже если в них нет чёткой структуры." },
      { id: "s-les-b1", group: "Lesen", level: "B1", de: "Ich verstehe einfache Texte über Alltagsthemen, zum Beispiel Aushänge oder kurze Artikel.", ru: "Понимаю простые тексты на бытовые темы — объявления, короткие статьи." },
      { id: "s-les-b2", group: "Lesen", level: "B2", de: "Ich kann Zeitungsartikel zu aktuellen Themen lesen, ohne oft ins Wörterbuch zu schauen.", ru: "Читаю газетные статьи на актуальные темы и редко заглядываю в словарь." },
      { id: "s-les-c1", group: "Lesen", level: "C1", de: "Ich verstehe lange, anspruchsvolle Texte und erkenne auch Ironie und Anspielungen.", ru: "Понимаю длинные сложные тексты и замечаю иронию и намёки." },
      { id: "s-spr-b1", group: "Sprechen", level: "B1", de: "Ich kann von einem Erlebnis erzählen und kurz sagen, was ich davon halte.", ru: "Могу рассказать о том, что случилось, и коротко сказать, что я об этом думаю." },
      { id: "s-spr-b2", group: "Sprechen", level: "B2", de: "Ich kann mich spontan an einer Diskussion beteiligen und meine Meinung begründen.", ru: "Могу с ходу включиться в обсуждение и обосновать своё мнение." },
      { id: "s-spr-c1", group: "Sprechen", level: "C1", de: "Ich kann mich fließend ausdrücken, ohne lange nach Worten suchen zu müssen.", ru: "Говорю бегло, долго подбирать слова не приходится." },
      { id: "s-sch-b1", group: "Schreiben", level: "B1", de: "Ich kann eine einfache E-Mail schreiben, in der ich etwas erzähle oder um etwas bitte.", ru: "Могу написать простое письмо: что-то рассказать или о чём-то попросить." },
      { id: "s-sch-b2", group: "Schreiben", level: "B2", de: "Ich kann einen klaren Text schreiben, in dem ich Vor- und Nachteile abwäge.", ru: "Могу написать внятный текст, в котором взвешиваю плюсы и минусы." },
      { id: "s-sch-c1", group: "Schreiben", level: "C1", de: "Ich kann einen formellen Brief schreiben, der gut aufgebaut ist und den richtigen Ton trifft.", ru: "Могу написать официальное письмо с хорошей структурой и в нужном тоне." },
      { id: "s-spo-1", group: "Sport", level: "B2", de: "Ich verstehe im Kletterkurs oder im Training die Anweisungen und frage nach, wenn mir etwas unklar ist.", ru: "На курсе по скалолазанию или на тренировке понимаю указания и переспрашиваю, если что-то неясно." },
      { id: "s-spo-2", group: "Sport", level: "C1", de: "Ich kann auf einer Hütte mit anderen über Touren, Wetter und Ausrüstung fachsimpeln.", ru: "Могу на хижине со знанием дела поболтать с другими о маршрутах, погоде и снаряжении." },
      { id: "s-beh-1", group: "Behörde", level: "B2", de: "Ich kann am Telefon einen Termin verschieben und nachfragen, welche Unterlagen ich brauche.", ru: "Могу по телефону перенести приём и уточнить, какие нужны документы." },
      { id: "s-beh-2", group: "Behörde", level: "C1", de: "Ich verstehe Briefe von Ämtern und Versicherungen beim ersten Lesen und kann schriftlich widersprechen.", ru: "Понимаю письма из ведомств и страховых с первого раза и могу письменно их оспорить." },
      { id: "s-ges-1", group: "Gespräch", level: "B2", de: "Ich kann mich mit Nachbarn oder Kollegen über Alltägliches unterhalten, ohne dass das Gespräch stockt.", ru: "Могу болтать с соседями или коллегами о повседневном без неловких пауз." },
      { id: "s-ges-2", group: "Gespräch", level: "C1", de: "Ich kann in einer Runde mit Muttersprachlern mitreden, Witze verstehen und selbst etwas Lustiges sagen.", ru: "Могу участвовать в разговоре компании носителей языка, понимать шутки и шутить сам." },
      { id: "s-med-1", group: "Medien", level: "B2", de: "Ich kann einem Podcast über ein Thema, das mich interessiert, gut folgen.", ru: "Хорошо понимаю подкаст на интересную мне тему." },
      { id: "s-med-2", group: "Medien", level: "C1", de: "Ich verstehe Filme und Serien ohne Untertitel, auch wenn schnell und umgangssprachlich gesprochen wird.", ru: "Понимаю фильмы и сериалы без субтитров, даже если говорят быстро и на разговорном языке." },
    ],
  };

  // C-test: 20 gaps each (CTest.build). `alts` are further correct whole words
  // for a gap, keyed by gap index. Band control: B1 ≤ 12 words per sentence,
  // B2 ≤ 18 with subordinate clauses and Passiv, C1 long periods with Konjunktiv.
  // LanguageTool on the clean texts: no matches (A1–A3 and A6 on 2026-09-22/23; A4 and
  // A5, written for this public example pack, on 2026-10-26).
  const ctest = [
    {
      id: "A1", band: "B1", topic: "Alltag",
      text: "Am Samstag stehe ich früh auf, obwohl ich nicht arbeiten muss. Zuerst gehe ich auf den Markt und kaufe Obst und Gemüse. Dort treffe ich oft meine Nachbarin. Danach laufe ich eine Runde an der ^Isar. Letzte Woche hat es stark geregnet, aber ich bin trotzdem gelaufen. Am Abend kommen Freunde zu uns zum Essen. Wir kochen zusammen und reden oft bis Mitternacht. So ein Samstag ist für mich einfach der schönste Tag der Woche.",
      alts: { 2: ["Marktplatz"], 8: ["Dann"] },
    },
    {
      id: "A2", band: "B1", topic: "Behörde",
      text: "Nach einem Umzug hat man zwei Wochen Zeit für die Anmeldung. Dafür braucht man einen Termin im Bürgerbüro. Online gab es aber erst in drei Wochen einen freien Termin. Deshalb habe ich jeden Morgen auf der Webseite nachgesehen. Nach vier Tagen hatte ich endlich Glück. Zum Termin habe ich meinen Pass und eine Bestätigung vom Vermieter mitgebracht. Die Frau am Schalter war sehr freundlich. Schon nach zehn Minuten hatte ich meine Meldebescheinigung in der Hand.",
      alts: { 12: ["Website"] },
    },
    {
      id: "A3", band: "B2", topic: "Berge",
      // 17 entsc|hieden → "entschlossen wir uns" (sich entschließen) is equally right
      text: "Für Sonntag war stabiles Wetter angesagt, deshalb brachen wir schon um sechs Uhr auf. Der Aufstieg zur Hütte verlief problemlos, und dort wurden wir mit einem herrlichen Blick belohnt. Gegen Mittag bemerkten wir jedoch, dass im Westen dunkle Wolken aufzogen. Obwohl der Gipfel nur noch eine Stunde entfernt war, entschieden wir uns umzukehren. Kaum hatten wir mit dem Abstieg begonnen, hörten wir den ersten Donner. Völlig durchnässt, aber unverletzt erreichten wir am späten Nachmittag den Parkplatz.",
      alts: { 17: ["entschlossen"] },
    },
    {
      id: "A4", band: "B2", topic: "Wohnen",
      text: "Wenn im Frühjahr Post von der Hausverwaltung kommt, öffnen viele Mieter den Umschlag nur ungern. Darin steckt nämlich die Abrechnung der Nebenkosten, also aller Ausgaben, die zusätzlich zur Kaltmiete anfallen. Weil jeden Monat nur ein geschätzter Betrag überwiesen wird, kommt es am Ende häufig zu einer Nachzahlung. Unsere Nachbarin sollte kürzlich vierhundert Euro nachzahlen, obwohl sie im Winter kaum geheizt hatte. Sie ließ sich die Belege zeigen und stellte fest, dass ein falscher Zählerstand eingetragen worden war. Die Abrechnung wurde daraufhin korrigiert, und statt der Nachzahlung erhielt sie sogar eine Gutschrift.",
      alts: { 7: ["Wenn"] },
    },
    {
      id: "A5", band: "C1", topic: "Wissenschaft",
      text: "Wenn eine einzelne Studie zu einem überraschenden Ergebnis gelangt, vergehen oft nur wenige Tage, bis aus einer vorsichtig formulierten Vermutung in den Schlagzeilen eine vermeintlich gesicherte Erkenntnis geworden ist. Ein treffendes Beispiel liefert eine an einer einzigen Hochschule durchgeführte Untersuchung, der zufolge Studierende in begrünten Seminarräumen konzentrierter arbeiten als in Räumen ohne Pflanzen. Zahlreiche Medien meldeten daraufhin, ein grünes Klassenzimmer steigere die Lernleistung messbar, verschwiegen jedoch, dass die Stichprobe lediglich achtunddreißig Freiwillige umfasste. Zwei deutlich größer angelegte Wiederholungsstudien konnten später keinen nennenswerten Effekt nachweisen und fanden kaum Beachtung, wohingegen die ursprüngliche Meldung bis heute in Ratgebern kursiert. Hätten die Redaktionen die Grenzen der ersten Studie ernst genommen, wäre die Nachricht wohl eine Randnotiz geblieben, zumal das Forschungsteam selbst ausdrücklich vor einer Verallgemeinerung gewarnt hatte. Insofern offenbart der Fall weniger ein Versagen der Wissenschaft, die ihre Irrtümer gerade durch solche Wiederholungen korrigiert, als vielmehr eine Schwäche der Berichterstattung, die nur den Anfang der Geschichte erzählt.",
      alts: { 0: ["treffliches"], 1: ["lieferte"], 3: ["einzelnen"], 6: ["Studienteilnehmer", "Studienteilnehmende"], 10: ["Räumlichkeiten"], 11: ["Pflanzenschmuck"], 12: ["Medienhäuser", "Medienvertreter"], 13: ["darauf"], 14: ["grüneres"], 16: ["Lernleistungen"], 17: ["verschleierten"] },
    },
    {
      id: "A6", band: "C1", topic: "Medien",
      text: "Kaum ein Format hat unsere Mediengewohnheiten in so kurzer Zeit so gründlich verändert wie das Kurzvideo im Hochformat. Forschende vermuten inzwischen, dass der ständige Wechsel der Reize die Fähigkeit schwächt, sich länger auf eine Sache zu konzentrieren, wenngleich die Befundlage noch uneinheitlich ist. Wer abends nur kurz durch ein paar Clips wischen will, stellt oft eine Stunde später fest, dass er in dieser Zeit ebenso gut ein Kapitel hätte lesen können. Ähnliche Befürchtungen gab es freilich schon, als das Fernsehen aufkam, und die Menschheit hat es bekanntlich überstanden.",
      // Review 2026-09-23: the research sentence comes first, so the gaps hit ständige,
      // schwächt, wenngleich, Befundlage, uneinheitlich. 5 schw|ächt → Konjunktiv I
      // "schwäche" is correct in reported speech after "vermuten".
      alts: { 5: ["schwäche"] },
    },
  ];

  // Grammar diagnostic: 10 zones × 4. The learner types the form (fill); choice
  // only for word order and for the one "no article" item, which a typed answer
  // cannot express (an empty answer scores as wrong). Hints in parentheses give
  // the base form or a closed set of connectors, so that only one answer fits.
  // LanguageTool on every prompt with its first key filled in: no matches (2026-09-22,
  // re-run 2026-09-23 after the review fixes).
  const grammar = [
    // ART — article and gender, including an item where no article is right
    // Any dative neuter determiner shows the gender; the zone asks for dem.
    { id: "ART-1", zone: "ART", type: "fill", prompt: "Nach ___ Training gehe ich in die Sauna.", accept: ["dem", "einem", "jedem", "meinem", "deinem", "seinem", "ihrem", "unserem", "eurem", "diesem"] },
    // die Schweiz takes the article, Österreich none:
    // https://www.duden.de/rechtschreibung/Schweiz · https://www.duden.de/rechtschreibung/Oesterreich
    { id: "ART-2", zone: "ART", type: "choice", prompt: "Welcher Satz ist richtig?", options: ["Meine Kollegin kommt aus Schweiz, mein Nachbar aus Österreich.", "Meine Kollegin kommt aus der Schweiz, mein Nachbar aus dem Österreich.", "Meine Kollegin kommt aus der Schweiz, mein Nachbar aus Österreich."], answer: 2 },
    // das Knie: https://www.duden.de/rechtschreibung/Knie — weak "linke" leaves only the definite article
    { id: "ART-3", zone: "ART", type: "fill", prompt: "Beim Abstieg tut mir immer ___ linke Knie weh.", accept: ["das"] },
    // der Reisepass: https://www.duden.de/rechtschreibung/Reisepass
    { id: "ART-4", zone: "ART", type: "fill", prompt: "Für ___ neuen Reisepass braucht man ein biometrisches Foto.", accept: ["den", "einen", "seinen", "meinen", "deinen", "Ihren", "unseren", "euren", "diesen", "jeden"] },

    // PRAEP — government of verbs and adjectives, two-way prepositions
    { id: "PRAEP-1", zone: "PRAEP", type: "fill", prompt: "Ich warte seit einer Stunde ___ den Rückruf der Versicherung.", accept: ["auf"] },
    // zufrieden mit: https://www.duden.de/rechtschreibung/zufrieden
    { id: "PRAEP-2", zone: "PRAEP", type: "fill", prompt: "Bist du ___ deinem neuen Trainer zufrieden?", accept: ["mit"] },
    { id: "PRAEP-3", zone: "PRAEP", type: "fill", prompt: "Häng die nasse Jacke bitte an ___ Haken neben der Tür.", accept: ["den", "einen", "diesen"] },
    // sich kümmern um: https://www.duden.de/rechtschreibung/kuemmern
    { id: "PRAEP-4", zone: "PRAEP", type: "fill", prompt: "Ich kümmere mich morgen ___ die Steuererklärung.", accept: ["um"] },

    // ADJ — endings after der-words, ein-words and without article. Suffix items (ADJ,
    // NDEKL-1/2/4) also accept the whole word in case the learner types it out.
    { id: "ADJ-1", zone: "ADJ", type: "fill", prompt: "Mit meinem neu___ Seil fühle ich mich sicherer.", accept: ["en", "neuen"] },
    { id: "ADJ-2", zone: "ADJ", type: "fill", prompt: "Der letzt___ Abschnitt vor dem Gipfel war ziemlich ausgesetzt.", accept: ["e", "letzte"] },
    { id: "ADJ-3", zone: "ADJ", type: "fill", prompt: "Heute war ein anstrengend___ Tag, ich gehe früh ins Bett.", accept: ["er", "anstrengender"] },
    { id: "ADJ-4", zone: "ADJ", type: "fill", prompt: "Bei schlecht___ Wetter trainieren wir in der Halle.", accept: ["em", "schlechtem"] },

    // WO — verb-final subordinate clause, inversion, Satzklammer
    { id: "WO-1", zone: "WO", type: "choice", prompt: "Ich weiß nicht, …", options: ["ob der Kurs morgen stattfindet.", "ob findet der Kurs morgen statt.", "ob der Kurs findet morgen statt."], answer: 0 },
    { id: "WO-2", zone: "WO", type: "choice", prompt: "Der Bus hatte Verspätung. …", options: ["Deshalb ich bin zu spät zum Termin gekommen.", "Deshalb bin ich zu spät zum Termin gekommen.", "Deshalb bin ich gekommen zu spät zum Termin."], answer: 1 },
    { id: "WO-3", zone: "WO", type: "choice", prompt: "Ich muss …", options: ["anrufen morgen früh die Praxis.", "morgen früh anrufen die Praxis.", "morgen früh die Praxis anrufen."], answer: 2 },
    // Ersatzinfinitiv; in the subordinate clause the finite auxiliary precedes both
    // infinitives ("wie es wohl hat kommen müssen"):
    // https://grammis.ids-mannheim.de/systematische-grammatik/380
    { id: "WO-4", zone: "WO", type: "choice", prompt: "Er hat mir erzählt, …", options: ["dass er die Tour allein hat machen müssen.", "dass er die Tour allein machen gemusst hat.", "dass er die Tour allein hat gemusst machen."], answer: 0 },

    // AUX — haben or sein in the Perfekt (no sitzen/stehen/liegen: sein in the south).
    // The prompts don't name the tense, so the Plusquamperfekt forms are accepted: they
    // show the same haben/sein choice, which is what the zone diagnoses.
    // steigen: ist gestiegen — https://www.duden.de/rechtschreibung/steigen
    { id: "AUX-1", zone: "AUX", type: "fill", prompt: "Gestern ___ wir in drei Stunden auf den Wank gestiegen.", accept: ["sind", "waren"] },
    // werden: ist geworden — https://www.dwds.de/wb/werden
    { id: "AUX-2", zone: "AUX", type: "fill", prompt: "Mein Bruder ___ letztes Jahr Vater geworden.", accept: ["ist", "war"] },
    // bleiben: ist geblieben — https://www.duden.de/rechtschreibung/bleiben
    { id: "AUX-3", zone: "AUX", type: "fill", prompt: "Wegen des Regens ___ wir den ganzen Tag in der Hütte geblieben.", accept: ["sind", "waren"] },
    // fahren = "mit einem Fahrzeug befördern" takes haben ("er hat den Verletzten ins
    // Krankenhaus gefahren"): https://www.duden.de/rechtschreibung/fahren
    { id: "AUX-4", zone: "AUX", type: "fill", prompt: "Ich ___ meine Nachbarin gestern zum Arzt gefahren.", accept: ["habe", "hatte"] },

    // PASS — Vorgangs- vs Zustandspassiv, Passiv with a modal, Passiv Perfekt.
    // The brief's worked example "Die Hütte ___ im Winter nicht bewirtschaftet" also
    // takes "ist" (Duden: "eine nur im Sommer bewirtschaftete Hütte",
    // https://www.duden.de/rechtschreibung/bewirtschaften), so it is replaced by a
    // process that only werden can express.
    { id: "PASS-1", zone: "PASS", type: "fill", prompt: "Die Hütte ___ im Moment renoviert und bleibt deshalb bis Juli geschlossen.", accept: ["wird"] },
    // sein-Passiv names a lasting state: https://grammis.ids-mannheim.de/terminologie/355
    { id: "PASS-2", zone: "PASS", type: "fill", prompt: "Die Straße zur Hütte ___ seit Mai gesperrt, wir müssen also zu Fuß gehen.", accept: ["ist"] },
    { id: "PASS-3", zone: "PASS", type: "fill", prompt: "Der Antrag kann auch online gestellt ___.", accept: ["werden"] },
    // Passiv Perfekt uses worden: https://www.dwds.de/wb/werden ("ist geworden / worden")
    { id: "PASS-4", zone: "PASS", type: "fill", prompt: "Mein Fahrrad ist gestern gestohlen ___.", accept: ["worden"] },

    // KONJ2 — irreal condition, polite request, irreal past
    { id: "KONJ2-1", zone: "KONJ2", type: "fill", prompt: "Wenn ich mehr Zeit ___ (haben), würde ich öfter klettern gehen.", accept: ["hätte"] },
    { id: "KONJ2-2", zone: "KONJ2", type: "fill", prompt: "Wenn der Zug pünktlicher wäre, ___ (werden) ich jeden Tag mit der Bahn fahren.", accept: ["würde"] },
    // "ich habe gern" would mean "I like having": only hätte makes it a request
    { id: "KONJ2-3", zone: "KONJ2", type: "fill", prompt: "Guten Tag, ich ___ (haben) gern einen Termin am Vormittag.", accept: ["hätte"] },
    // losgehen: ist losgegangen — https://www.duden.de/rechtschreibung/losgehen
    { id: "KONJ2-4", zone: "KONJ2", type: "fill", prompt: "Wenn wir früher losgegangen ___, hätten wir den Gipfel noch erreicht.", accept: ["wären"] },

    // KONN — connectors; each item names three candidates, because an open slot
    // takes als/während/nachdem too. Verb position tells subordinator from adverb.
    // KONN-1 no longer has "trotzdem" in the main clause (obwohl … trotzdem is a
    // pleonasm, and it showed KONN-2's answer).
    { id: "KONN-1", zone: "KONN", type: "fill", prompt: "___ es regnete, sind wir losgegangen. (obwohl / deshalb / indem)", accept: ["Obwohl", "Obgleich", "Obschon", "Wenngleich", "Auch wenn"] },
    { id: "KONN-2", zone: "KONN", type: "fill", prompt: "Der Wetterbericht war schlecht. ___ sind wir losgegangen. (obwohl / trotzdem / während)", accept: ["Trotzdem", "Dennoch", "Gleichwohl", "Nichtsdestotrotz"] },
    // adversative während = wohingegen: https://www.duden.de/rechtschreibung/waehrend_als_unterdessen_wohingegen
    { id: "KONN-3", zone: "KONN", type: "fill", prompt: "Mein Bruder fährt am liebsten in die Berge, ___ ich lieber ans Meer fahre. (während / deshalb / indem)", accept: ["während", "wohingegen", "wogegen"] },
    { id: "KONN-4", zone: "KONN", type: "fill", prompt: "„Wie hältst du dein Deutsch fit?“ – „___ ich jeden Tag einen Podcast höre.“ (indem / trotzdem / deshalb)", accept: ["Indem"] },

    // REL — relative pronoun case, with preposition, wo(r)+
    // The brief's example ("…, ___ ich die Tour gemacht habe") also takes "bei dem"
    // (a tour/course "bei jemandem machen"); the verb now leaves only mit.
    { id: "REL-1", zone: "REL", type: "fill", prompt: "Das ist der Bergführer, ___ ich letzten Sommer auf den Watzmann gestiegen bin.", accept: ["mit dem", "mit welchem"] },
    { id: "REL-2", zone: "REL", type: "fill", prompt: "Die Frau, ___ ich am Telefon meine Nummer gegeben habe, hat nie zurückgerufen.", accept: ["der", "welcher"] },
    { id: "REL-3", zone: "REL", type: "fill", prompt: "Der Termin, ___ ich letzte Woche bekommen habe, passt mir leider nicht.", accept: ["den", "welchen"] },
    // A relative clause without antecedent always takes wo(r)+; "auf was" counts as
    // colloquial: https://www.duden.de/sprachwissen/sprachratgeber/wozu-zu-dem-woran-was-usw
    // "schon die ganze Woche … am Samstag" makes it anticipation, so auf, not über
    // (DWDS: "sich auf etw. freuen — zum Ausdruck von etwas Zukünftigem",
    // https://www.dwds.de/wb/freuen).
    { id: "REL-4", zone: "REL", type: "fill", prompt: "___ ich mich schon die ganze Woche freue, ist der Kaiserschmarrn auf der Hütte am Samstag.", accept: ["Worauf"] },

    // NDEKL — n-declension and Genitiv.
    // The brief's example used Nachbar, but Duden also lists "dem Nachbar" (rare
    // strong paradigm, https://www.duden.de/deklination/substantive/Nachbar), and an
    // empty answer cannot be accepted. Kollege is weak only:
    // https://www.duden.de/deklination/substantive/Kollege
    { id: "NDEKL-1", zone: "NDEKL", type: "fill", prompt: "Ich habe gestern lange mit meinem Kollege___ gesprochen.", accept: ["n", "Kollegen"] },
    // den Patienten: https://www.duden.de/deklination/substantive/Patient
    { id: "NDEKL-2", zone: "NDEKL", type: "fill", prompt: "Die Ärztin hat den Patient___ sofort ins Krankenhaus geschickt.", accept: ["en", "Patienten"] },
    // wegen + Genitiv: https://www.duden.de/rechtschreibung/wegen_infolge_bezueglich
    { id: "NDEKL-3", zone: "NDEKL", type: "fill", prompt: "Wegen ___ Gewitters mussten wir die Tour abbrechen.", accept: ["des", "eines", "dieses"] },
    // "In der Anschrift mit Akkusativ: Herrn …": https://www.duden.de/rechtschreibung/Herr
    { id: "NDEKL-4", zone: "NDEKL", type: "fill", prompt: "Ich habe einen Brief an Herr___ Wagner geschrieben.", accept: ["n", "Herrn"] },
  ];

  // Reading. L1 is from a fictional town ("Musterstadt"), not a real office.
  // LanguageTool 2026-09-22: L1 "Petrow" (fictional surname, false alarm); the
  // signature line "Im Auftrag" (DE_CASE) became "i. A." — Duden allows both,
  // https://www.duden.de/rechtschreibung/Auftrag. L2 and all items: no matches.
  // Re-run 2026-09-23 after the review fixes: again only "Petrow".
  const lesen = [
    {
      id: "L1", title: "Ein Brief vom Bürgerbüro", level: "B1/B2",
      text: "Stadtverwaltung Musterstadt · Bürgerbüro\nRathausplatz 1 · Musterstadt\n\nMusterstadt, 15. September 2026\nAktenzeichen: BP-2026-4471\n\nIhr Antrag vom 2. September 2026 auf einen Bewohnerparkausweis\n\nSehr geehrter Herr Petrow,\n\nvielen Dank für Ihren Antrag auf einen Bewohnerparkausweis für die Zone „Altstadt Nord“. Leider können wir Ihren Antrag noch nicht bearbeiten, weil folgende Unterlagen fehlen:\n\n– eine Kopie der Zulassungsbescheinigung Teil I (Fahrzeugschein),\n– falls das Fahrzeug nicht auf Sie zugelassen ist: eine schriftliche Bestätigung des Halters, dass Sie das Fahrzeug dauerhaft nutzen.\n\nBitte reichen Sie die Unterlagen bis spätestens 6. Oktober 2026 nach. Sie können sie über das Serviceportal der Stadt hochladen, per Post schicken oder ohne Termin im Bürgerbüro abgeben. Geben Sie dabei bitte immer das Aktenzeichen an.\n\nLiegen uns die Unterlagen bis zu diesem Datum nicht vor, müssen wir Ihren Antrag ablehnen. Sie können dann jederzeit einen neuen Antrag stellen. Die Gebühr von 30 Euro wird erst fällig, wenn der Ausweis ausgestellt wird.\n\nIhr bisheriger Ausweis gilt noch bis zum 31. Oktober 2026.\n\nMit freundlichen Grüßen\ni. A. Sabine Krüger",
      items: [
        { id: "L1-1", type: "choice", prompt: "Der Antrag von Herrn Petrow wurde abgelehnt.", options: RFN, answer: 1 },
        { id: "L1-2", type: "choice", prompt: "Welche Unterlage muss Herr Petrow auf jeden Fall einreichen?", options: ["eine schriftliche Bestätigung des Fahrzeughalters", "ein aktuelles Passfoto für den neuen Ausweis", "eine Kopie der Zulassungsbescheinigung Teil I"], answer: 2 },
        { id: "L1-3", type: "choice", prompt: "Man kann die Unterlagen persönlich abgeben, ohne vorher einen Termin zu buchen.", options: RFN, answer: 0 },
        { id: "L1-4", type: "choice", prompt: "Das Bürgerbüro hat auch am Samstag geöffnet.", options: RFN, answer: 2 },
        { id: "L1-5", type: "choice", prompt: "Was passiert, wenn die Unterlagen erst nach dem 6. Oktober ankommen?", options: ["Der Antrag wird abgelehnt, aber Herr Petrow kann einen neuen stellen.", "Herr Petrow zahlt eine Mahngebühr, dann wird der Antrag bearbeitet.", "Der alte Ausweis wird sofort ungültig, und der Antrag wird abgelehnt."], answer: 0 },
      ],
    },
    {
      id: "L2", title: "Gewitter in den Bergen", level: "B2/C1",
      text: "Wer im Sommer in den Alpen unterwegs ist, muss mit Gewittern rechnen. Am häufigsten sind Wärmegewitter: Nach einem schwülen, fast windstillen Vormittag wachsen die Quellwolken oft schon gegen Mittag in die Höhe, am Nachmittag entladen sie sich. Erfahrene Bergsteiger brechen deshalb früh auf und wollen den Gipfel spätestens am frühen Nachmittag hinter sich haben. Tückischer sind Gewitter, die mit einer Kaltfront kommen: Sie können zu jeder Tageszeit auftreten und ziehen oft schneller heran, als man absteigen kann. Ein Blick auf den Wetterbericht gehört daher zu jeder Tourenplanung.\n\nWie weit ein Gewitter entfernt ist, lässt sich leicht abschätzen: Man zählt die Sekunden zwischen Blitz und Donner und teilt sie durch drei – das Ergebnis ist die Entfernung in Kilometern. Liegen weniger als 30 Sekunden dazwischen, sollte man sofort Schutz suchen. Wirklich sicher ist man allerdings nur in Gebäuden mit Blitzschutz, etwa in einer Hütte, oder im Auto.\n\nWird man im Gelände überrascht, gilt: Grate, Gipfel und einzeln stehende Bäume sofort verlassen, Drahtseile an Klettersteigen nicht mehr anfassen. Auch unter Felsvorsprüngen oder am Eingang einer Höhle ist man nicht geschützt, denn der Strom kann dort überspringen. Am besten hockt man sich mit geschlossenen Füßen auf den Rucksack, möglichst in einer Mulde. Eine Gruppe verteilt sich mit einigen Metern Abstand, damit ein Einschlag nicht alle gleichzeitig trifft. Flach hinlegen sollte man sich dagegen nicht: Nach einem Einschlag breitet sich der Strom im Boden aus, und je weiter die Stellen auseinanderliegen, an denen man den Boden berührt, desto mehr Strom fließt durch den Körper. Weitergehen sollte man erst etwa eine halbe Stunde nach dem letzten Donner.",
      items: [
        { id: "L2-1", type: "choice", prompt: "Wer Wärmegewitter vermeiden will, sollte am frühen Nachmittag nicht mehr auf dem Gipfel sein.", options: RFN, answer: 0 },
        { id: "L2-2", type: "choice", prompt: "Gewitter, die mit einer Kaltfront kommen, gibt es nur am Nachmittag.", options: RFN, answer: 1 },
        { id: "L2-3", type: "choice", prompt: "Zwischen Blitz und Donner zählen Sie 12 Sekunden. Was bedeutet das?", options: ["Das Gewitter ist etwa 12 km entfernt – Sie können weitergehen.", "Das Gewitter ist etwa 36 km entfernt – es besteht keine Gefahr.", "Das Gewitter ist etwa 4 km entfernt – suchen Sie sofort Schutz."], answer: 2 },
        // Distractors are the misconceptions the text itself rejects, not the lone tree
        // every hiker already knows to avoid.
        { id: "L2-4", type: "choice", prompt: "Sie werden im Gelände von einem Gewitter überrascht. Was ist laut Text am besten?", options: ["sich flach in eine Mulde legen, um möglichst tief zu liegen", "sich mit geschlossenen Füßen auf den Rucksack hocken", "am Eingang einer Höhle oder unter einem Felsvorsprung warten"], answer: 1 },
        { id: "L2-5", type: "choice", prompt: "Die meisten Blitzunfälle in den Alpen passieren auf Klettersteigen.", options: RFN, answer: 2 },
      ],
    },
  ];

  // Listening: DW episodes, linked; questions written from the manuscripts, which
  // came from DW's own API (the page's GraphQL endpoint). Levels are DW's tags.
  // LanguageTool 2026-09-23: H1 no matches; H2 "Zessin", "MAB" are names from the
  // episode (false alarm).
  const hoeren = [
    {
      // Replaced 2026-09-23: the 22 Sep episode on the Landtag elections could be answered
      // from the news. Every item here needs the audio (1,5 °C threshold, data only since
      // the 1980s, 1000 years from Michigan, the KIT caveat, the bleaching years).
      id: "H1", title: "Top-Thema: „El Niño: Was Korallen übers Klima verraten können“", level: "B1",
      url: "https://learngerman.dw.com/de/el-ni%C3%B1o-was-korallen-%C3%BCbers-klima-verraten-k%C3%B6nnen/l-79310826",
      published: "2026-09-18", listenMinutes: 4,
      note: "Выпуск длится 3,5 минуты. Сначала прочитай вопросы, потом послушай два раза. Манускрипт и словарик на странице DW не открывай до конца теста.",
      items: [
        // H1-1 and H1-5: each feature appears in two options, so no option can be found
        // by combining the features the others share (re-review N1, 2026-09-23).
        { id: "H1-1", type: "choice", prompt: "Ab wann gilt ein El Niño als stark?", options: ["wenn das Meer vor Südamerika mehr als drei Grad wärmer ist als sonst", "wenn das Meer vor Südamerika mehr als 1,5 Grad wärmer ist als sonst", "wenn das Meer vor Australien mehr als drei Grad wärmer ist als sonst"], answer: 1 },
        { id: "H1-2", type: "choice", prompt: "Seit wann gibt es zuverlässige Daten zu den Temperaturen an der Meeresoberfläche?", options: ["erst seit den 1980er-Jahren", "schon seit etwa 1000 Jahren", "seit Beginn der Industrialisierung"], answer: 0 },
        { id: "H1-3", type: "choice", prompt: "Forschende aus Michigan haben mithilfe von Korallen die Meerestemperaturen der letzten 10.000 Jahre rekonstruiert.", options: RFN_HOEREN, answer: 1 },
        { id: "H1-4", type: "choice", prompt: "Laut Andreas Fink sind Korallendaten nicht überall gleich genau – es kommt auf die Bedingungen vor Ort an.", options: RFN_HOEREN, answer: 0 },
        { id: "H1-5", type: "choice", prompt: "In welchen Jahren gab es laut Beitrag schon eine weltweite Korallenbleiche?", options: ["2015/16 und 2019/20", "2019/20 und 2023/24", "2015/16 und 2023/24"], answer: 2 },
      ],
    },
    {
      id: "H2", title: "Alltagsdeutsch: „Wer übernimmt den Familienbetrieb?“", level: "C1",
      // First published 2016-01-19; DW re-ran it on 2026-09-22 (lastPublicationDate).
      url: "https://learngerman.dw.com/de/wer-%C3%BCbernimmt-den-familienbetrieb/l-18902578",
      published: "2016-01-19", listenMinutes: 8,
      note: "Выпуск длится 10:52, но вопросы только по первым 8 минутам — дальше можно не слушать. Сначала прочитай вопросы, потом послушай один раз. Манускрипт на странице DW не открывай до конца теста.",
      items: [
        { id: "H2-1", type: "choice", prompt: "Wie viele Familienbetriebe suchen laut dem Bonner Institut für Mittelstandsforschung jedes Jahr eine Nachfolge?", options: ["etwa 7.100", "etwa 71.000", "etwa 500.000"], answer: 1 },
        { id: "H2-2", type: "choice", prompt: "Wer war für Kerstin Zessin ein Vorbild?", options: ["die Chefin des Betriebs, in dem sie ihre Ausbildung machte", "ihr Vater, der den Familienbetrieb einst aufgebaut hatte", "eine Unternehmerin, die sie aus ihrer Nachbarschaft kannte"], answer: 0 },
        { id: "H2-3", type: "choice", prompt: "Die Firma MAB hat heute rund 500 Mitarbeiter.", options: RFN_HOEREN, answer: 2 },
        { id: "H2-4", type: "choice", prompt: "Laut Rosemarie Kay gibt es rein rechnerisch mehr Menschen, die eine Firma übernehmen wollen, als Firmen, die übergeben werden.", options: RFN_HOEREN, answer: 0 },
        // Distractors are things the episode never says (the self-confidence point is an
        // interview remark, not the study, so it is not used as a distractor).
        { id: "H2-5", type: "choice", prompt: "Was hat eine Studie aus dem Jahr 2013 gezeigt?", options: ["Söhne führen einen Familienbetrieb meist länger als Töchter.", "Von Frauen geführte Betriebe haben im Schnitt mehr Mitarbeiter.", "Als Nachfolger wählen Mütter eher Töchter, Väter eher Söhne."], answer: 2 },
      ],
    },
  ];

  // LanguageTool on the task cards (E1, E2, F1, F2 with all turns): no matches
  // (2026-09-22; re-run 2026-09-23 after the new E1 and the F2 fixes).
  const schreiben = [
    {
      // The reminder comes from a fitness club, not a Krankenkasse: employees rarely pay
      // health insurance themselves, while gyms collect by direct debit.
      id: "E1", title: "Brief an das Fitnessstudio", register: "formell",
      situation: "Ihr Fitnessstudio hat Ihnen eine Mahnung geschickt: Sie sollen den Mitgliedsbeitrag für August (39,90 €) und eine Mahngebühr von 5 € bezahlen. Der Beitrag wurde aber schon am 1. August per Lastschrift von Ihrem Konto abgebucht. Schreiben Sie an das Fitnessstudio.",
      points: ["Beschreiben Sie, was passiert ist.", "Nennen Sie Ihren Nachweis für die Zahlung.", "Schreiben Sie, was Sie vom Fitnessstudio erwarten.", "Nennen Sie eine Frist für die Antwort."],
      words: 120, minutes: 20,
    },
    {
      id: "E2", title: "Forumsbeitrag: Gebühren gegen volle Berge?", register: "halbformell (Forum)",
      situation: "Im Forum Ihrer Alpenvereinssektion wird diskutiert: An schönen Wochenenden sind Wanderparkplätze und Bergstraßen in den Alpen völlig überfüllt. Einige Mitglieder fordern hohe Parkgebühren oder eine Maut, damit weniger Autos kommen. Andere finden das unsozial. Schreiben Sie einen Beitrag mit Ihrer Meinung.",
      points: ["Ihre eigene Erfahrung mit vollen Parkplätzen oder Straßen", "Argumente für Gebühren", "Argumente gegen Gebühren", "Ihr eigener Vorschlag"],
      words: 180, minutes: 30,
    },
  ];

  const sprechen = [
    {
      id: "F1", kind: "monolog",
      prompt: "Erzählen Sie etwa drei Minuten lang von Ihrer letzten Bergtour.",
      points: ["Wo waren Sie und mit wem?", "Wie ist die Tour verlaufen?", "Was ist unterwegs passiert – Schönes oder Unerwartetes?", "Was würden Sie beim nächsten Mal anders machen, und warum?"],
      minutes: 3,
    },
    {
      id: "F2", kind: "dialog",
      situation: "Sie haben am Donnerstag um 8:30 Uhr einen Termin in Ihrer Hausarztpraxis: einen Check-up mit Blutabnahme und eine Impfung. An diesem Tag können Sie nicht kommen. Rufen Sie in der Praxis an und verschieben Sie den Termin.",
      turns: [
        { praxis: "Praxis Dr. Lehmann, Berger am Apparat, grüß Gott!", hint: "Поздоровайся, назови себя и скажи, что хочешь перенести приём, назначенный на четверг, 8:30." },
        { praxis: "Moment, ich schaue mal … Ja, hier habe ich Sie: Check-up mit Blutabnahme und die Impfung. Möchten Sie beides verschieben?", hint: "Скажи, что да, оба, и коротко объясни, почему в четверг не получается." },
        { praxis: "Nächste Woche hätte ich Dienstag um 7:45 Uhr oder Freitag um 8:15 Uhr. Was passt Ihnen besser?", hint: "Выбери время и объясни, почему тебе так удобнее." },
        { praxis: "Gut, dann trage ich Sie ein. Für die Blutabnahme kommen Sie bitte nüchtern, also morgens nichts essen. Haben Sie sonst noch Fragen?", hint: "Спроси, нужно ли взять прививочный паспорт и можно ли утром пить воду или кофе." },
        { praxis: "Den Impfpass bringen Sie bitte mit, ja. Wasser ist kein Problem, Kaffee lieber erst danach. Kann ich sonst noch etwas für Sie tun?", hint: "Повтори дату и время, чтобы проверить, что всё правильно, поблагодари и попрощайся." },
      ],
    },
  ];

  return { version: "example-2026-10", encodingProbe: "äöüß", sections, self, ctest, grammar, lesen, hoeren, schreiben, sprechen };
});
