---
type: template
title: Einwilligungsformular für Kunden (Informationsschreiben)
description: Einheitliches Einwilligungsformular nach der DSGVO für Personal Trainer, die Gesundheitsdaten von Kunden verarbeiten (besondere Kategorien personenbezogener Daten nach Art. 9 DSGVO).
status: active
consent_form_version: "2026-08-09"
tags:
  - gdpr
  - consent
  - privacy
  - template
  - german
  - okf
---

# Einwilligungsformular für Kunden

Der folgende Text ist genau der, den die App sendet. Die Schaltfläche **Per E-Mail senden**
(Kunde → *Datenschutz (DSGVO)*, wenn als Sprache des Formulars Deutsch gewählt ist) öffnet dein
E-Mail-Programm mit diesem Text, und die Schaltfläche **Link per SMS senden** schickt eine Zeile mit
einem Link auf die [Datenschutzhinweise](Client_Privacy_Notice.md).

Die Kopie in der App ist [src/i18n/consent/de.js](../../../src/i18n/consent/de.js); der Test
[consentForm.test.mjs](../../../tests/unit_js/modules/common/consentForm.test.mjs) verhindert, dass
dieses Dokument und der gesendete Text auseinanderlaufen.

> ⚠ **Maschinelle Übersetzung, noch nicht von einer deutschsprachigen Person geprüft.** Die
> Begriffe folgen dem amtlichen deutschen Text der Verordnung (EU) 2016/679 (Zuordnung und Quelle im
> [Verzeichnis der deutschen Vorlagen](INDEX.md)). Inhaltlich entspricht das Dokument dem englischen
> Original ([Client_Consent_Form.md](../en/Client_Consent_Form.md)); bei Abweichungen gilt das
> englische Original. Vor der Verwendung bei echten Kunden muss es von einer deutschsprachigen,
> im Datenschutzrecht kundigen Person geprüft werden.

## Das Schreiben

```markdown
Betreff: Personal Training — Einwilligung in die Verarbeitung personenbezogener Daten

Hallo [Name des Kunden],

um unsere Trainingspläne vorzubereiten, deine Kraftentwicklung zu verfolgen und sicher zu trainieren, nutze ich LibrePT. Darin zeichne ich die Ergebnisse unserer Trainings, die verwendeten Gewichte und relevante Notizen zu Beweglichkeit und Verletzungen auf.

Nach der Datenschutz-Grundverordnung (Verordnung (EU) 2016/679 — DSGVO) informiere ich dich vor deiner Einwilligung vollständig darüber, wie ich deine Trainingsdaten verarbeite:

1. Speicherung und Sicherheit: Deine Trainingsaufzeichnungen und Notizen werden auf meinem eigenen Gerät gespeichert und optional in meinem persönlichen Cloud-Speicher gesichert, ausschließlich für die Vorbereitung und Fortführung deines Trainings.
2. Kein Tracking, kein Verkauf, keine Weitergabe: Deine Daten werden nie verkauft, nie mit Werbetreibenden geteilt und nie an Dritte übermittelt.
3. Sicherer Einsatz künstlicher Intelligenz: Wenn ich KI-Werkzeuge nutze, um die Periodisierung zu planen oder das Trainingsvolumen auszuwerten, werden deine Aufzeichnungen vorher anonymisiert (alle Namen und alle Angaben, über die du erkennbar wärst, werden entfernt).
4. Deine Rechte: Du kannst jederzeit einen vollständigen Export deines Trainingsverlaufs verlangen, eine Berichtigung verlangen oder verlangen, dass deine personenbezogenen Aufzeichnungen endgültig gelöscht werden. Du kannst diese Einwilligung außerdem jederzeit und in jeder Form widerrufen — der Widerruf beendet jede weitere Verarbeitung und berührt nicht die Rechtmäßigkeit der Verarbeitung, die vor dem Widerruf erfolgt ist.

Die vollständigen Datenschutzhinweise findest du hier: {{PUBLIC_SITE_URL}}/privacy-notice-de.html

Bitte antworte auf diese E-Mail mit "ICH WILLIGE EIN" (oder unterschreibe das ausgedruckte Formular), um zu bestätigen, dass du diese Informationen verstanden hast und in diese Verarbeitung deiner Daten für unser Personal Training einwilligst.

Um die Einwilligung später zu widerrufen, antworte auf diese Nachricht mit "WIDERRUF". Der Widerruf ist genauso einfach wie die Einwilligung — dieselbe Antwort, kein Formular und kein Konto — und du musst keinen Grund angeben.

Version des Einwilligungsformulars: 2026-08-09

Viele Grüße
Dein Personal Trainer
```

## Ausgedrucktes Formular — Unterschriften

Füge diese Zeilen der ausgedruckten Fassung hinzu. **Das unterschriebene Blatt bewahrst du auf.**
LibrePT speichert nie ein Foto, einen Scan oder eine Unterschrift — nur, dass die Einwilligung
erteilt wurde, das Datum auf diesem Blatt und die oben genannte Version des Formulars.

```markdown
Unterschrift des Kunden: ___________________________   Datum: _______________

Unterschrift des Trainers: __________________________   Datum: _______________
```

## Versionen

Eine Einwilligung gilt *einem bestimmten Text*, deshalb speichert LibrePT neben dem Datum der
Unterschrift auch die Version, die der Kunde unterschrieben hat (`gdprConsent.formVersion`, siehe
[DATA_MODEL §1](../../DATA_MODEL.md)). Nur so lässt sich nach einer Änderung des Textes beantworten,
welche Kunden noch abgedeckt sind.

Die Regeln für eine neue Version sind in allen Sprachen gleich und stehen in der englischen Ausgabe —
[Versioning](../en/Client_Consent_Form.md). Kurz: eine neue Version bei einer **inhaltlichen**
Änderung (neuer Zweck, neuer Empfänger, andere Speicherdauer oder Rechte), nicht bei einem Tippfehler
oder einer korrigierten Übersetzung. Eine Version gilt für alle Sprachen zugleich und wird als
vollständiges ISO-Datum (`JJJJ-MM-TT`) geschrieben — der Tag, an dem der geltende Text festgelegt
wurde, nicht der Tag der letzten Bearbeitung der Datei.

## Verwandt

- [Datenschutzhinweise für Kunden](Client_Privacy_Notice.md) — die Hinweise, auf die das Schreiben verweist
- [English edition](../en/Client_Consent_Form.md) — das Original
- [Verzeichnis der Vorlagen](../INDEX.md) — alle Sprachen dieser Dokumente
- [Trainer Privacy Guide](../../PRIVACY_FOR_TRAINERS.md) — die Pflichten des Trainers als Verantwortlicher
