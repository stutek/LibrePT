---
type: guidelines
title: Trainer Privacy Guide — Running LibrePT as a GDPR Data Controller
description: The operational workflow for a personal trainer using LibrePT — obtaining consent, recording it in the app, archiving the signed form, handling withdrawal and data-subject requests.
status: active
tags:
  - gdpr
  - privacy
  - trainer
  - guidelines
  - okf
---

# Trainer Privacy Guide

**You are the data controller.** [PRIVACY.md §3](../PRIVACY.md) explains *why* — this document is
the *how*: the concrete workflow, in the order you will actually meet it, and what LibrePT does and
does not do for you at each step.

The one sentence to keep: **LibrePT records that consent exists; you hold the evidence that it
does.** The app stores a checkbox, a date, and a form version. It never stores a photo, a scan, or a
signature — so the signed sheet in your own files is the only proof, and it is yours to keep.

---

## 1. Before the first session — inform, then ask

Consent is only valid if the client was informed *first* (Art. 7(2), Art. 13). Two documents, in
this order:

1. **Send the [Client Privacy Notice](templates/Client_Privacy_Notice.md)** — fill in your name,
   contact details, and retention period once, and reuse it for every client.
2. **Send or print the [Client Consent Form](templates/Client_Consent_Form.md)** — the letter and the
   signature block.

From **Add/Edit Client → Data Protection (GDPR)**, the app does both deliveries for you:

| Button | What it does | Needs |
| :--- | :--- | :--- |
| **Email form** | Opens your mail app on a compose prefilled with the full consent letter, addressed to the client | An email address on the client record |
| **Send link by SMS** | Opens your messaging app on a one-line message linking to the privacy notice | A phone number on the client record |
| **Who keeps the form?** | The archiving reminder — the point of this whole page | — |

Both open your *own* mail/SMS app: nothing is sent through any server, and LibrePT never sees the
message. A button whose address is missing says so on its face ("No email on file") rather than
failing silently.

## 2. Recording the consent

Tick **Client signed the consent form** and set **Date signed** to the date on the paper — not
today, if the client signed at the desk last week. The date is the field a supervisory authority
asks about; the app's own write timestamp is not it, which is exactly why the field is editable.

The **consent form version** shown beside the date is stamped onto the record. See
[Client_Consent_Form.md](templates/Client_Consent_Form.md) for when the version moves and who has to
re-sign when it does.

## 3. Archiving — the part only you can do

File the signed sheet (or the client's "I CONSENT" reply email) and keep it for **as long as you
hold that client's records**. Under Art. 7(1) the burden of proof is on you: if you cannot produce
the signed form, you have no consent, whatever the app says.

Practical shapes that work: a physical folder at the gym; a scanned PDF in the same personal cloud
account you already sync to. Do **not** put scans back into LibrePT — a signature image is more
sensitive than everything else in the record combined, and the app deliberately has nowhere to put
it.

## 4. Withdrawal

Withdrawal must be as easy as consent was (Art. 7(3)), and a client may withdraw in any form — a
text message counts.

1. Untick the consent box on the client (this clears the date and version stamp).
2. Delete their records unless you have a separate, documented reason to keep them.
3. Note the withdrawal and its date on your archived copy of the signed form.

Withdrawal is not retroactive: sessions already logged were logged lawfully. It stops processing
from that point.

## 5. Data-subject requests

| Request | Article | What to do in LibrePT |
| :--- | :--- | :--- |
| "What do you hold on me?" / "Send me a copy" | 15, 20 | Export the client's history (JSON or Markdown) and send it |
| "That's wrong" | 16 | Edit the client record |
| "Delete me" | 17 | Delete the client profile — it goes from this device and from the next cloud backup |
| "Stop using my data" | 7(3), 18 | Untick consent, then §4 above |

Answer within one month. Keep a short note of what you sent and when.

## 6. Two mistakes that are easy to make

- **Pasting identifiable client data into an AI assistant.** Names plus health notes in a chat
  prompt is a transfer of Art. 9 data to a processor you have no agreement with. Use the app's
  **AI Safe Copy (Anonymized)** action on the client's profile instead — it strips identifying
  fields before copying ([PRIVACY.md §3.2](../PRIVACY.md)).
- **Treating the app as the backup.** The database in your browser is the only copy unless you have
  configured Drive sync or taken an export. Losing it loses your clients' data too, which is a
  security failing under Art. 32, not just an inconvenience.

## Related

- [PRIVACY.md](../PRIVACY.md) — what the LibrePT app itself does and does not do with data
- [Client Privacy Notice](templates/Client_Privacy_Notice.md) — the notice you hand to the client
- [Client Consent Form](templates/Client_Consent_Form.md) — the letter, the signature block, and versioning
- [DATA_MODEL.md](DATA_MODEL.md) — where consent is stored and what is kept
