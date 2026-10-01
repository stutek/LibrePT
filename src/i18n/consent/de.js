// src/i18n/consent/de.js — the German GDPR (DSGVO) consent letter. Structure and rationale: see ./en.js.
//
// ⚠ MACHINE TRANSLATION OF A LEGAL TEXT, NOT YET REVIEWED BY A GERMAN SPEAKER. It must be reviewed
// by a German speaker — and, before real use with clients, by someone who knows German data-protection
// law — before German-speaking trainers are invited. Until then the English letter (./en.js) is what
// was intended, and any difference is a bug in this translation.
//
// Standard German (de). Addressed formally ("Sie"), as every published German template and form
// read for this letter does — ruled 2026-10-01: every text the CLIENT reads follows the official
// templates, while the trainer's own screens keep "du".
//
// TERMINOLOGY IS REGULATED VOCABULARY HERE, not a style choice. It follows the official German text
// of Regulation (EU) 2016/679 (Datenschutz-Grundverordnung, DSGVO); the mapping is tabulated in
// docs/templates/de/INDEX.md. Consent is **Einwilligung** (Art. 4 Nr. 11), never "Zustimmung"; to
// withdraw it is **widerrufen** (Art. 7 Abs. 3). The letter names no national act: a German-speaking
// client may be served under the German BDSG or the Austrian DSG, and consent under Art. 9 Abs. 2
// lit. a needs neither. The complaint line names both countries' authorities, because a client
// complains where they live (Art. 77).
//
// Pinned verbatim to docs/templates/de/Client_Consent_Form.md by
// tests/unit_js/modules/common/consentForm.test.mjs.
//
// deps: none — pure string building.

export const consentDe = {
  subject: "Personal Training — Einwilligung in die Verarbeitung personenbezogener Daten",

  body: ({ clientName, noticeUrl, version, signature }) => `Guten Tag ${clientName},

ich nutze LibrePT, eine App auf meinem eigenen Gerät, um Ihr Training zu planen, Ihre Fortschritte zu verfolgen und Sie sicher zu trainieren. Bevor ich Aufzeichnungen über Sie führe, brauche ich Ihre Einwilligung. Diese Nachricht sagt Ihnen, was ich aufzeichne, wer die Daten erhält und welche Rechte Sie haben. Verantwortlicher für Ihre personenbezogenen Daten im Sinne der Datenschutz-Grundverordnung (Verordnung (EU) 2016/679 — DSGVO) bin ich; mein Name und meine Kontaktdaten stehen unter dieser Nachricht.

Was ich aufzeichne:
1. Ihren Namen und die E-Mail-Adresse oder Telefonnummer, die Sie mir geben.
2. Ihr Training: Ziele, Trainingstermine, Übungen, Sätze, Wiederholungen, Lasten und wie jedes Training verlaufen ist.
3. Angaben zu Ihrer Gesundheit: Verletzungen, Schmerzen, Einschränkungen der Beweglichkeit und Ihr Körpergewicht, soweit ich sie brauche, um Sie sicher zu trainieren. Gesundheitsdaten gehören nach der DSGVO zu den besonderen Kategorien personenbezogener Daten; deshalb brauche ich dafür Ihre ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a DSGVO).

Wo die Daten gespeichert werden und wer sie erhält:
1. Die Aufzeichnungen werden auf meinem eigenen Gerät gespeichert. Die Entwickler von LibrePT erhalten nichts.
2. Wenn ich die Sicherung einschalte, wird eine Sicherungskopie in meinem eigenen Cloud-Speicher gespeichert. Mein Gerät verschlüsselt sie vorher mit meinem Passwort, deshalb kann der Speicheranbieter sie nicht lesen. Der Anbieter kann sie auch außerhalb der EU speichern; die Datenschutzhinweise nennen den Anbieter und die Grundlage dieser Übermittlung.
3. Wenn ich einen KI-Assistenten nutze, um Ihr Training zu planen, erhält er nur eine Kopie ohne Ihren Namen, Ihre Kontaktdaten, Ihre Ziele und Notizen: eine Nummer, die Trainingstermine und die Sätze, die Sie gemacht haben. Nur mein Gerät kann diese Nummer Ihnen zuordnen.
4. Ich verkaufe Ihre Daten nie und gebe sie nie an Werbetreibende weiter. Sonst erhält niemand Ihre Daten.

Wie lange ich sie speichere: solange Sie bei mir trainieren und höchstens zwei Jahre nach Ihrem letzten Training, damit Ihr Trainingsverlauf noch da ist, wenn Sie wiederkommen. Früher, wenn Sie es verlangen.

Ihre Rechte: Sie können jederzeit und kostenlos von mir Auskunft über Ihre Daten und eine Kopie verlangen, außerdem ihre Berichtigung, ihre Löschung oder die Einschränkung ihrer Verarbeitung. Ich antworte innerhalb eines Monats. Wenn Sie meinen, dass mit Ihren Daten falsch umgegangen wurde, können Sie sich bei der Datenschutz-Aufsichtsbehörde an Ihrem Wohnort beschweren (in Deutschland bei der Behörde Ihres Bundeslandes, in Österreich bei der Datenschutzbehörde, dsb.gv.at). Über Sie wird nichts automatisiert entschieden.

Sie müssen nicht einwilligen. Ohne Ihre Einwilligung kann ich in der App keine Aufzeichnungen über Sie führen, und ohne Angaben zu Ihrer Gesundheit kann ich Ihr Training nicht darauf abstimmen.

Die vollständigen Datenschutzhinweise finden Sie hier: ${noticeUrl}

Wenn Sie einwilligen, antworten Sie auf diese E-Mail mit „ICH WILLIGE EIN“ oder unterschreiben Sie das ausgedruckte Formular. Damit bestätigen Sie, dass Sie diese Nachricht gelesen haben und ausdrücklich in die Verarbeitung Ihrer personenbezogenen Daten einschließlich der Angaben zu Ihrer Gesundheit für Ihr Training einwilligen.

Sie können Ihre Einwilligung jederzeit ohne Angabe von Gründen widerrufen: Antworten Sie auf diese Nachricht mit „WIDERRUF“ oder teilen Sie es mir auf andere Weise mit. Der Widerruf ist so einfach wie die Einwilligung. Er beendet die weitere Verarbeitung; die bis dahin erfolgte Verarbeitung bleibt rechtmäßig.

Version des Einwilligungsformulars: ${version}

Mit freundlichen Grüßen
${signature || "Ihr Personal Trainer"}`,

  share: ({ clientName, noticeUrl, trainerName }) =>
    `Guten Tag ${clientName}.${trainerName ? ` Hier schreibt Ihnen ${trainerName}.` : ""} Für Aufzeichnungen über Ihr Training und Ihre Gesundheit brauche ich nach der DSGVO Ihre ausdrückliche Einwilligung. Bitte lesen Sie zuerst die Datenschutzhinweise: ${noticeUrl} Antworten Sie mit ICH WILLIGE EIN oder unterschreiben Sie im Studio. Mit WIDERRUF widerrufen Sie sie jederzeit.`,
};
