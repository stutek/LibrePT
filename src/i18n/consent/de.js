// src/i18n/consent/de.js — the German GDPR (DSGVO) consent letter. Structure and rationale: see ./en.js.
//
// ⚠ MACHINE TRANSLATION OF A LEGAL TEXT, NOT YET REVIEWED BY A GERMAN SPEAKER. It must be reviewed
// by a German speaker — and, before real use with clients, by someone who knows German data-protection
// law — before German-speaking trainers are invited. Until then the English letter (./en.js) is what
// was intended, and any difference is a bug in this translation.
//
// Standard German (de). Addressed informally ("du"), like the rest of the German UI and like sl.js.
// Formality is not what makes consent valid — being informed is, and the four numbered points carry
// that in the same order as every other locale.
//
// TERMINOLOGY IS REGULATED VOCABULARY HERE, not a style choice. It follows the official German text
// of Regulation (EU) 2016/679 (Datenschutz-Grundverordnung, DSGVO); the mapping is tabulated in
// docs/templates/de/INDEX.md. Consent is **Einwilligung** (Art. 4 Nr. 11), never "Zustimmung"; to
// withdraw it is **widerrufen** (Art. 7 Abs. 3). The letter names no national act: the English
// source names none, and a German client may be served under the German BDSG or the Austrian DSG.
//
// Pinned verbatim to docs/templates/de/Client_Consent_Form.md by
// tests/unit_js/modules/common/consentForm.test.mjs.
//
// deps: none — pure string building.

export const consentDe = {
  subject: "Personal Training — Einwilligung in die Verarbeitung personenbezogener Daten",

  body: ({ clientName, noticeUrl, version }) => `Hallo ${clientName},

um unsere Trainingspläne vorzubereiten, deine Kraftentwicklung zu verfolgen und sicher zu trainieren, nutze ich LibrePT. Darin zeichne ich die Ergebnisse unserer Trainings, die verwendeten Gewichte und relevante Notizen zu Beweglichkeit und Verletzungen auf.

Nach der Datenschutz-Grundverordnung (Verordnung (EU) 2016/679 — DSGVO) informiere ich dich vor deiner Einwilligung vollständig darüber, wie ich deine Trainingsdaten verarbeite:

1. Speicherung und Sicherheit: Deine Trainingsaufzeichnungen und Notizen werden auf meinem eigenen Gerät gespeichert und optional in meinem persönlichen Cloud-Speicher gesichert, ausschließlich für die Vorbereitung und Fortführung deines Trainings.
2. Kein Tracking, kein Verkauf, keine Weitergabe: Deine Daten werden nie verkauft, nie mit Werbetreibenden geteilt und nie an Dritte übermittelt.
3. Sicherer Einsatz künstlicher Intelligenz: Wenn ich KI-Werkzeuge nutze, um die Periodisierung zu planen oder das Trainingsvolumen auszuwerten, werden deine Aufzeichnungen vorher anonymisiert (alle Namen und alle Angaben, über die du erkennbar wärst, werden entfernt).
4. Deine Rechte: Du kannst jederzeit einen vollständigen Export deines Trainingsverlaufs verlangen, eine Berichtigung verlangen oder verlangen, dass deine personenbezogenen Aufzeichnungen endgültig gelöscht werden. Du kannst diese Einwilligung außerdem jederzeit und in jeder Form widerrufen — der Widerruf beendet jede weitere Verarbeitung und berührt nicht die Rechtmäßigkeit der Verarbeitung, die vor dem Widerruf erfolgt ist.

Die vollständigen Datenschutzhinweise findest du hier: ${noticeUrl}

Bitte antworte auf diese E-Mail mit "ICH WILLIGE EIN" (oder unterschreibe das ausgedruckte Formular), um zu bestätigen, dass du diese Informationen verstanden hast und in diese Verarbeitung deiner Daten für unser Personal Training einwilligst.

Um die Einwilligung später zu widerrufen, antworte auf diese Nachricht mit "WIDERRUF". Der Widerruf ist genauso einfach wie die Einwilligung — dieselbe Antwort, kein Formular und kein Konto — und du musst keinen Grund angeben.

Version des Einwilligungsformulars: ${version}

Viele Grüße
Dein Personal Trainer`,

  share: ({ clientName, noticeUrl }) =>
    `Hallo ${clientName}, bevor ich deine Trainingsdaten aufzeichne, brauche ich nach der DSGVO deine Einwilligung. Bitte lies die kurzen Datenschutzhinweise hier: ${noticeUrl} — antworte mit ICH WILLIGE EIN oder unterschreibe das ausgedruckte Formular im Studio. Mit der Antwort WIDERRUF kannst du sie jederzeit widerrufen.`,
};
