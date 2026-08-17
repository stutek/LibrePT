---
type: use_case
title: UC8 - Client Self-Onboarding by File, with Consent Given on Their Own Phone
description: Specification for a prospective client introducing themselves on their own device and the trainer accepting that submission into their register, with no server between the two phones.
status: active
tags:
  - client-onboarding
  - gdpr-consent
  - file-transport
  - trust-boundary
---

# Use Case 8: Client Self-Onboarding by File

A prospective client scans a code on a gym wall or opens a link a trainer sent, fills in who they are
on **their own phone**, ticks consent there, and sends the result. The trainer reads it and accepts.
Nothing is typed twice, and nothing passes through a server — because there is no server.

Today the alternative is the trainer typing a client record at a desk from something the person said,
which is both the slowest part of taking someone on and the least accurate.

## The return path is the design problem, not the form

There is no backend, so "the record comes back" has to happen between two devices that share no
channel the app controls. Everything below follows from that.

**The submission travels as a FILE** (decided 2026-08-17). `navigator.share({ files })` puts it
straight into the client's own mail or messaging app with the attachment already on the message.
Three consequences, in order of how much they matter:

1. **Nothing sensitive sits in a URL.** A link-borne payload rests in a carrier's logs and in two
   phones' message histories. The client may offer goals and injuries — Art. 9 health data — so the
   transport has to be one that keeps them out of those places.
2. **The file is a retainable artifact.** It carries the wording version, the language, and the date
   ticked, which is far better Art. 7(1) evidence than a query parameter.
3. **There is no size budget**, so a signature or a photo becomes possible later without redesigning
   the format.

**`mailto:` cannot attach anything**, which is why it is not an alternative here — a link-based version
would have a stranger hand-attaching a download. **The download fallback is permanent, not
temporary**: `navigator.canShare({ files })` is false on every desktop browser and on iOS below 15, so
"save the file and attach it yourself" is a first-class button rather than an error path.

## What travels, and what deliberately does not

[clientSignup.js](../src/data/clientSignup.js) is the record; [signupFile.js](../src/data/signupFile.js)
is the artifact.

- **Identity and contact**: name, plus email and/or phone. A submission needs a name and at least one
  way to reach the person, because those are what a trainer needs in order to recognise who this is.
- **Goals and injuries, if the client chooses** (decided 2026-08-17). Optional at every level, and a
  blank field is **absent** from the record rather than stored as `""` — so a trainer can tell "chose
  not to say" from "not asked yet". Prose over 1000 characters is refused rather than truncated: a
  sentence that stops mid-clause reads as the client's own words, which is worse than a refusal when
  it describes an injury someone will program around.
- **The consent stamp**, in exactly the shape [clientConsent.js](../src/data/clientConsent.js) already
  defines, so a self-served consent and a trainer-captured one are the same record: `cloudSync`, the
  client's own calendar date, `formVersion` as it stood when they were shown it, and `formLang` for the
  language they actually read. All three or no consent at all — a consent missing its wording version
  cannot evidence anything, and storing it anyway would look like proof while being none.
- **Never**: a record id, `active`, `erasure`, or any trainer-only field. A submission that could name
  the record it lands on would let a stranger aim their file at an existing client.

## The intake page is stateless by design

`/intake` runs its **own boot step** ([appBoot.js](../src/appBoot.js)'s `bootIntake`), not the
trainer's boot with conditions threaded through it. The client's device gets no database, no demo seed,
no service worker, no first-run agreement, and no splash hold — and no write of any kind, `initTheme`
included, since that persists the resolved theme.

The reason it is a separate path rather than a flag: every step of the trainer's boot writes or asks
something, so a flag would work until the day one step was missed, and the failure would be a
stranger's phone holding a LibrePT database, or a terms modal in front of the intake form.

**The client picks the language**, because it decides which wording their consent is recorded against.
A trainer's link may name it (`?lang=sl`); otherwise their own device is a better guess than the app's
default, since they have never chosen one here.

## The review dialog is the trust boundary

There is no signature to verify and deliberately never will be — signing needs a key exchange, which
needs the server this project does not have. So anyone who photographs the wall QR can craft a file,
and what makes that acceptable is not cryptography: it is that a human being reads one record before it
enters their register ([signupReviewDialog.js](../src/modules/clients/signupReviewDialog.js)).

- **No auto-import**, ever, and no "trust files from this sender".
- **Consent is shown as evidence** — when, which wording, which language — rather than as a tick.
- **Dedupe is an OFFER, not a decision.** A match on email or phone is very likely the same person,
  and a second Jane Doe is a worse outcome than a question; but two people do share a phone number (a
  couple training together, a parent's number on a teenager's form), so the trainer can decline it.
  Matched on contact details and **never on name**, because merging two clients who share a name is a
  data-protection incident rather than a tidy-up.
- **An update adds; it does not overwrite silence.** A client who skips the goals box cannot wipe the
  goal their trainer wrote after the last session.
- **Declining discards the parsed submission**, rather than leaving it primed for a later stray tap.

## Known gaps

- **First load needs network.** The client's phone has never cached the app, and a basement gym is
  exactly where it cannot fetch it. Either a printed fallback, or intake happens at the desk.
- **The payload has no authenticity**, deliberately (see above). The review is the mitigation, and it
  is enough because the stakes are one reviewable record.
- **Real-world share behaviour is untested in the field.** Which apps the OS offers for this media type
  varies by device; measure with a real phone before promoting the flow.
- **No photo or avatar.** Initials are derived, the way the seed data does it.

## Spec ↔ test traceability

| Behaviour | Test |
| :--- | :--- |
| Consent survives with date, wording version and language | [clientSignup.test.mjs](../tests/unit_js/data/clientSignup.test.mjs) |
| A partial consent is refused rather than stored as proof | [clientSignup.test.mjs](../tests/unit_js/data/clientSignup.test.mjs) |
| Health detail is optional, and absent rather than blank | [clientSignup.test.mjs](../tests/unit_js/data/clientSignup.test.mjs) |
| Nothing a sender invents reaches the register | [clientSignup.test.mjs](../tests/unit_js/data/clientSignup.test.mjs) |
| Contact-only dedupe; two namesakes never merged | [clientSignup.test.mjs](../tests/unit_js/data/clientSignup.test.mjs) |
| Media type and extension are stable declarations | [signupFile.test.mjs](../tests/unit_js/data/signupFile.test.mjs) |
| The wrong attachment is refused, not half-read | [signupFile.test.mjs](../tests/unit_js/data/signupFile.test.mjs) |
| A filename cannot become a path or a spoofed extension | [signupFile.test.mjs](../tests/unit_js/data/signupFile.test.mjs) |
| A cancelled share is not reported as a failure | [signupDelivery.test.mjs](../tests/unit_js/modules/intake/signupDelivery.test.mjs) |
| A failed share is never reported as sent | [signupDelivery.test.mjs](../tests/unit_js/modules/intake/signupDelivery.test.mjs) |
| `/intake` is recognised at any base path; language resolution | [intakeRoute.test.mjs](../tests/unit_js/modules/intake/intakeRoute.test.mjs) |
| The form writes nothing to the client's device | [test_intake_form.py](../tests/medium/test_intake_form.py) |
| Consent refused separately from missing identity | [test_intake_form.py](../tests/medium/test_intake_form.py) |
| Share offered only where sharing a file works | [test_intake_form.py](../tests/medium/test_intake_form.py) |
| A visit to `/intake` never starts the trainer's app | [test_intake.py](../tests/e2e/test_intake.py) |
| Consent shown as evidence, before anything is saved | [test_signup_review_dialog.py](../tests/medium/test_signup_review_dialog.py) |
| Dedupe offered, and declinable | [test_signup_review_dialog.py](../tests/medium/test_signup_review_dialog.py) |
| An update never blanks what the client did not mention | [test_signup_review_dialog.py](../tests/medium/test_signup_review_dialog.py) |
| Declining writes nothing and keeps no copy | [test_signup_review_dialog.py](../tests/medium/test_signup_review_dialog.py) |
| A submission cannot name the record it lands on | [test_signup_review_dialog.py](../tests/medium/test_signup_review_dialog.py) |
| The whole loop, real file and real persistence | [test_signup_round_trip.py](../tests/e2e/test_signup_round_trip.py) |
