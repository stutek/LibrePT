// src/i18n/consent/de.js — the German GDPR (DSGVO) consent letter. Structure and rationale: see ./en.js.
//
// ⚠ MACHINE TRANSLATION OF A LEGAL TEXT, NOT YET REVIEWED BY A GERMAN SPEAKER. It must be reviewed
// by a German speaker — and, before real use with clients, by someone who knows German data-protection
// law — before German-speaking trainers are invited. Until then the English letter (./en.js) is what
// was intended, and any difference is a bug in this translation.
//
// Standard German (de). Addressed informally ("du"), like the rest of the German UI and like sl.js.
// Every published German template and form read for this letter says "Sie"; formality is not what
// makes consent valid — being informed is — but a German reviewer may decide otherwise.
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

  body: ({ clientName, noticeUrl, version, signature }) => `Hallo ${clientName},

ich nutze LibrePT, eine App auf meinem eigenen Gerät, um dein Training zu planen, deine Fortschritte zu verfolgen und dich sicher zu trainieren. Bevor ich Aufzeichnungen über dich führe, brauche ich deine Einwilligung. Diese Nachricht sagt dir, was ich aufzeichne, wer die Daten erhält und welche Rechte du hast. Verantwortlicher für deine personenbezogenen Daten im Sinne der Datenschutz-Grundverordnung (Verordnung (EU) 2016/679 — DSGVO) bin ich; mein Name und meine Kontaktdaten stehen unter dieser Nachricht.

Was ich aufzeichne:
1. Deinen Namen und die E-Mail-Adresse oder Telefonnummer, die du mir gibst.
2. Dein Training: Ziele, Trainingstermine, Übungen, Sätze, Wiederholungen, Lasten und wie jedes Training verlaufen ist.
3. Angaben zu deiner Gesundheit: Verletzungen, Schmerzen, Einschränkungen der Beweglichkeit und dein Körpergewicht, soweit ich sie brauche, um dich sicher zu trainieren. Gesundheitsdaten gehören nach der DSGVO zu den besonderen Kategorien personenbezogener Daten; deshalb brauche ich dafür deine ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a DSGVO).

Wo die Daten gespeichert werden und wer sie erhält:
1. Die Aufzeichnungen werden auf meinem eigenen Gerät gespeichert. Die Entwickler von LibrePT erhalten nichts.
2. Wenn ich die Sicherung einschalte, wird eine Sicherungskopie in meinem eigenen Cloud-Speicher gespeichert. Mein Gerät verschlüsselt sie vorher mit meinem Passwort, deshalb kann der Speicheranbieter sie nicht lesen. Der Anbieter kann sie auch außerhalb der EU speichern; die Datenschutzhinweise nennen den Anbieter und die Grundlage dieser Übermittlung.
3. Wenn ich einen KI-Assistenten nutze, um dein Training zu planen, erhält er nur eine Kopie ohne deinen Namen, deine Kontaktdaten, deine Ziele und Notizen: eine Nummer, die Trainingstermine und die Sätze, die du gemacht hast. Nur mein Gerät kann diese Nummer dir zuordnen.
4. Ich verkaufe deine Daten nie und gebe sie nie an Werbetreibende weiter. Sonst erhält niemand deine Daten.

Wie lange ich sie speichere: solange wir zusammen trainieren und höchstens zwei Jahre nach deinem letzten Training, damit dein Trainingsverlauf noch da ist, wenn du wiederkommst. Früher, wenn du es verlangst.

Deine Rechte: Du kannst jederzeit und kostenlos von mir Auskunft über deine Daten und eine Kopie verlangen, außerdem ihre Berichtigung, ihre Löschung oder die Einschränkung ihrer Verarbeitung. Ich antworte innerhalb eines Monats. Wenn du meinst, dass mit deinen Daten falsch umgegangen wurde, kannst du dich bei der Datenschutz-Aufsichtsbehörde an deinem Wohnort beschweren (in Deutschland bei der Behörde deines Bundeslandes, in Österreich bei der Datenschutzbehörde, dsb.gv.at). Über dich wird nichts automatisiert entschieden.

Du musst nicht einwilligen. Ohne deine Einwilligung kann ich in der App keine Aufzeichnungen über dich führen, und ohne Angaben zu deiner Gesundheit kann ich dein Training nicht darauf abstimmen.

Die vollständigen Datenschutzhinweise findest du hier: ${noticeUrl}

Wenn du einwilligst, antworte auf diese E-Mail mit „ICH WILLIGE EIN“ oder unterschreibe das ausgedruckte Formular. Damit bestätigst du, dass du diese Nachricht gelesen hast und ausdrücklich in die Verarbeitung deiner personenbezogenen Daten einschließlich der Angaben zu deiner Gesundheit für dein Training einwilligst.

Du kannst deine Einwilligung jederzeit ohne Angabe von Gründen widerrufen: Antworte auf diese Nachricht mit „WIDERRUF“ oder teile es mir auf andere Weise mit. Der Widerruf ist so einfach wie die Einwilligung. Er beendet die weitere Verarbeitung; die bis dahin erfolgte Verarbeitung bleibt rechtmäßig.

Version des Einwilligungsformulars: ${version}

Viele Grüße
${signature || "Dein Personal Trainer"}`,

  share: ({ clientName, noticeUrl, trainerName }) =>
    `Hallo ${clientName}!${trainerName ? ` Hier schreibt dir ${trainerName}.` : ""} Für Aufzeichnungen über dein Training und deine Gesundheit brauche ich nach der DSGVO deine ausdrückliche Einwilligung. Lies bitte zuerst die Datenschutzhinweise: ${noticeUrl} Antworte mit ICH WILLIGE EIN oder unterschreibe das Formular im Studio. Mit WIDERRUF kannst du sie jederzeit widerrufen.`,
};
