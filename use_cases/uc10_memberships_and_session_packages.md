---
type: use_case
title: UC10 - Memberships and Bought Session Packages
description: What a trainer needs from a client's monthly or yearly membership and from a bought number of sessions, the scenarios behind each record field, and the rules the app uses to say which membership or package a session uses.
status: draft
tags:
  - memberships
  - session-packages
  - attendance
  - preview-schema
---

# Use Case 10: Memberships and Bought Session Packages

A client pays for a **membership** (by the month or by the year) or buys a **package** of sessions
("10 sessions, valid 2 months"). The trainer needs to know, for every client, what they have paid for
and how much of it is left, without counting in a notebook. Asked by Simon on 2026-10-12 for ProPT,
with every record kept in the PREVIEW schema.

**Where the records stand.** The two collections are declared in `SCHEMA_PREVIEW` only
([recordSchemas.js](../src/data/recordSchemas.js)), and the rules are in
[membershipsAndPackages.js](../src/domain/membershipsAndPackages.js). No screen writes them yet. A
PREVIEW collection never reaches a backup and is emptied when a preview install's build changes
([DATA_MODEL.md](../docs/DATA_MODEL.md)), so nothing a trainer enters would last. Moving them to a
numbered schema needs Simon's order.

**What is deliberately not here: money.** Price, payment, the payer and the invoice belong to the
invoice records ProPT keeps (TODO.md holds that design). A package records what was bought, not what
was paid for it.

## Where the scenarios come from

- **Twenty simulated trainer weeks** (the exploratory tests of 2026-10-10 and 2026-10-11, kept
  privately). In every one of them, the simulated trainer wrote "package 10, 5 left" into the client's
  Notes field and counted down by hand after each session. These are agents playing trainers, not
  real trainers: they show what the app lacks, not how common each case is.
- **Real price lists and terms** of Slovenian studios and personal trainers, and the help pages of
  studio software (Glofox, TeamUp, Eversports, Wodify, Arketa, Everfit, Hapana, Momence, Punchpass,
  bsport, Arbox). Each scenario below names its source. The full list of pages read is at the end.

## The scenarios

### S1. A package of sessions, valid for a time from the day it was bought

Ana buys 8 sessions. They are valid 2 months from the day of purchase. After each session she
attended, one is used; the trainer and Ana can see how many are left and until when.

Sources: Tvoj Gym, "Veljavnost 2 meseca od nakupa"; Razgibaj se, "2 meseca od dneva nakupa"; Vital
Gym, packs "veljata za obdobje 2 mesecev od dneva nakupa". VigorGround counts in days: "75 dni".

Fields: `sessions`, `boughtOn`, `validForCount` and `validForUnit` (day, week or month).

The last valid day is the day before the same date one validity later: bought 12 October, valid 2
months, the last day is 11 December. When the later month has no such date, its last day is the last
valid day: bought 31 January, valid one month, 28 February.

### S2. A package whose validity starts at the first session, or never ends

A group card is valid 90 days from the first visit used, not from the purchase. Another studio's
10-card has no time limit.

Sources: Peti element, "Veljavnost karte in paketov je 90 dni od prvega porabljenega obiska"; Dayuma
Pole, "4 Monate gültig ... ab der 1. Buchung"; Pilates Loft, "Die Zehnerkarte hat eine zeitlich
unbegrenzte Gültigkeit". TeamUp offers "Begins on date of purchase", "Begins on date of first
registration" or "Begins on a specific date".

Fields: `validFrom` ("purchase", "firstSession" or "date", with `startsOn` for "date"); no
`validForCount` and `validForUnit` means no end. A package counted from its first session is used
only after the packages already running, so it does not start early and leave sessions unused.

### S3. The trainer moves the end date of a package by hand

Ana was ill for three weeks; the trainer gives her three more weeks.

Source: Hapana, a package is "Extendable: You can push the expiry date forward as needed".

Field: `validUntil`. When set, it is the last valid day and is final: it wins over the validity, and a
pause does not move it. The trainer set it by hand, often because of that pause.

### S4. A monthly membership, counted from the first of the month or from the day it started

One studio's monthly card runs from the first to the last day of the calendar month. Another counts
each month from the day the membership started (12 February to 11 March, then from 12 March).

Sources: Vital Gym, "Mesečne karte veljajo od prvega do zadnjega dneva v mesecu"; Clever fit, the
contract renews "z začetkom vsakega koledarskega meseca"; Glofox has both, and calls the first kind
"Pro-Rata or Prorated Memberships"; Eversports "Starts with assignment".

Fields: `period` ("month" or "year"), `startsOn`, `periodsFrom` ("calendar" or "startDate").

### S5. A yearly membership, with a fixed end or without one

A membership for 12 months ends on its last day and does not renew. Another continues until the
client ends it.

Sources: F45, "Članstvo avtomatsko ne bo podaljšalo"; Clever fit renews by itself after its first
12 months.

Field: `endsOn`. Absent, the membership continues.

### S6. A membership that includes a number of sessions, or as many as the client wants

"Monthly membership – 8 visits" and "unlimited visits" are two prices on one list. Vital Gym also sells
cards by sessions per week: once, twice, unlimited.

Sources: VigorGround, "Mesečno članstvo – 8 obiskov" and "neomejeno obiskov"; Eversports, "Limit the
number of activity participations" per day, week or month.

Fields: `sessionsPerPeriod`, `sessionsPerWeek`. Both absent means unlimited.

### S7. Sessions not used in a month are lost, kept for the next month, or kept

Sources: Vital Gym, "Karte niso prenosljive v naslednji mesec" (lost); Wodify and Punchpass keep unused
sessions for later periods, with or without a limit.

Field: `carryOver` ("none", "nextPeriod" or "always"). Absent means "none".

### S8. A pause for a holiday or an injury

Tone is in hospital for four weeks; his membership is paused. Most studios move the end date by the
length of the pause. German consumer law does not allow that for a contract paused for a pregnancy.

Sources: Wodify, the "commitment term will be extended for the amount of the membership hold"; Arbox,
"it will be extended according to the number of days it was frozen"; VigorGround, a freeze for illness
or injury of more than 14 days; Verbraucherzentrale Hamburg, "Eine Laufzeitverlängerung um die
ausgesetzten Monate ist unzulässig".

Field: `pauses`, a list of `{ startsOn, endsOn, reason, extendsEnd }`. A session on a paused day is
not covered by that membership or package. Where two pauses overlap, each day moves the end once.

### S9. A package two people share

A pair trains together on one package of 8 sessions; a session they attend together uses one. A family
shares one balance, and each person's session uses one.

Sources: Tvoj Gym sells "Paket 8 treningov" for training in pairs; TeamUp "Shareable" packs for a
family. By default a card belongs to one person: F45, "Članarine in vstopnine ... niso prenosljive na
drugo osebo".

Fields: `sharedWith` (the other clients' ids), `onePerSession` (true for a pair package). When two
holders of a pair package come to the same session, the pair package covers both of them before any
membership either one has: they bought it to train together.

### S10. A package or membership for one kind of session only

A package of personal sessions does not pay for a group class, and the other way round.

Sources: VigorGround sells "Paket 10 treningov" (75 days) and "Paket Osebni 10 treningov" (personal,
6 months) side by side; TeamUp "Applicable To"; bsport restricts a pass "par Activité".

Field: `forSessions` ("any", "individual" or "group"). The app has no kind of session, so the kind is
read from the session: one participant is individual, more is group.

### S11. A late cancellation or a no-show uses up the session

Cancelled at least 24 hours before, the session is not used. Later, or not coming, uses it.

Sources: VigorGround, "Če stranka odpove trening vsaj 24 ur pred začetkom, se trening ne obračuna";
Everfit, "Late Cancel → voids (forfeits) the credit".

No new field: the attendance row already stores `consumesQuota`, and the trainer decides it. Marking
a client "not here today" stores `consumesQuota: false` until Simon decides the default.

### S12. A client has a membership and a package at once

Which one does a session use? The membership first, because its sessions are lost at the end of the
period. Then the package that ends soonest, then the oldest. A session nothing covers is shown as not
covered, so the trainer can charge it singly. Two sessions on one day are counted in the order they
started.

Sources: Arketa, "Arketa spends the pack that expires soonest, then the one with the fewest credits
left"; Everfit, "The credit expiring soonest is deducted first".

No field: computed when the balance is read, never written. Changing a package's dates then changes
the answer for every session, and every answer can be checked against the records.

## Spec ↔ test traceability

| Behaviour | Test |
| :--- | :--- |
| Both collections are in PREVIEW and in no numbered schema | [recordSchemas.test.mjs](../tests/unit_js/data/recordSchemas.test.mjs) |
| The records of the scenarios validate; words outside the lists are refused | [recordSchemas.test.mjs](../tests/unit_js/data/recordSchemas.test.mjs) |
| S1–S12, each by its number | [membershipsAndPackages.test.mjs](../tests/unit_js/domain/membershipsAndPackages.test.mjs) |
| The answer does not depend on the order the sessions arrive in | [membershipsAndPackages.test.mjs](../tests/unit_js/domain/membershipsAndPackages.test.mjs) |
| Uses are read from attendance, on the session's calendar day | [membershipsAndPackages.test.mjs](../tests/unit_js/domain/membershipsAndPackages.test.mjs) |
| Erasure keeps the counts and takes the name out of the note | [clientErasure.test.mjs](../tests/unit_js/data/clientErasure.test.mjs) |
| A record a form could write wrongly is named before the rules read it | [membershipsAndPackages.test.mjs](../tests/unit_js/domain/membershipsAndPackages.test.mjs) |
| The trainer sees what a client has and what is left | **Not built**: no screen until the collections get a schema number |
| The client sees their balance | **Not built**: no screen, and no way to share it yet |

## Not covered, on purpose or still open

- **Price, payment and debt**: the invoice records (see above).
- **A company paying for its employees**: no source found; it is a payer, so it belongs with payment.
- **A first card at a higher price** (Elithera's "1. Karte" and "Folgekarte"): a price.
- **A minimum commitment of several packages** (Primus, "3 paketi po ZAPOREDNIH 10 treningov") and
  **one excused miss per package** (Primus): terms of a contract, kept in the package's `note`.
- **The partial first month** of a calendar membership: the full allowance counts. Glofox prices it
  pro rata; that is a price.
- **Choosing by hand which package a session uses**: not stored. Asked for, it is one optional field
  on the attendance row.

## Pages read

https://www.tvojgym.com/cenik · https://razgibaj-se.eu/osebno-trenerstvo/cenik-osebnega-trenerstva/ ·
https://vitalgym.si/cenik/ · https://www.vigor.si/cenik · https://petielement.si/cenik/ ·
https://janokorn.si/cenik/ · https://www.primus-vadbe.si/programi/osebno-trenerstvo/ ·
https://www.clever-fit.com/si-sl/pogoji/ ·
https://cdn.f45training.com/f45training/uploads/2019/05/14012335/F45-Splosni-pogoji-clanstva-Jan25.pdf ·
https://www.eversports.ch/o/dayuma-pole-and-acrobatics/719962d9-193a-448b-9029-6e8cf642ce42 ·
https://www.eversports.de/o/pilates-loft-rosenheim/189586f7-de34-43f9-804b-3ededd3b6ff8 ·
https://www.elithera.de/wp-content/uploads/2025/10/Geraetetraining-Hausach-Preisliste-NeuuegLGuDb1760008500.pdf ·
https://www.vzhh.de/themen/einkauf-reise-freizeit/fitnessstudio/aerger-im-fitnessstudio ·
https://support.glofox.com/hc/en-us/articles/46429154568980 ·
https://support.glofox.com/hc/en-us/articles/46421991679508-What-is-the-difference-between-a-single-month-membership-with-10-credits-and-a-credit-pack-with-10-credits ·
https://intercom.help/goteamup/en/articles/9333600-add-a-pack-w-video ·
https://helpcenter.eversportsmanager.com/basic-information-1 ·
https://help.wodify.com/hc/en-us/articles/33053486593431 ·
https://help.wodify.com/hc/en-us/articles/208738268-Adjust-Cancel-or-Hold-an-Existing-Membership ·
https://support.punchpass.com/en/articles/16260418-how-membership-rollover-credits-work ·
https://help.arketa.com/pricing/types/class-package ·
https://help.everfit.io/en/articles/14698318-session-credits-manage-and-track-paid-client-sessions ·
https://support.hapana.com/kb/article/797-core-understand-the-difference-between-memberships-and-packages ·
https://help.arboxapp.com/en/articles/5320435-freeze-a-membership ·
https://intercom.help/bsport-helpcenter/fr/articles/14210031-comment-configurer-les-pass-dans-bsport-pour-les-cas-d-usage-frequents
