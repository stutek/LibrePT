---
type: roadmap
title: LibrePT Planned Work & Open Questions
description: Backlog of planned features, UX changes, and unresolved design questions for LibrePT, captured for later brainstorming and implementation.
status: active
tags:
  - roadmap
  - backlog
  - brainstorming
  - okf
---

# LibrePT — Planned Work & Open Questions

Open and in-progress backlog, and **only** that. **[Brainstorm]** marks a design question to settle
before code; **[~]** marks partial work; gaps in the numbering mark items pruned entirely.

**A closed section leaves this file the day it closes.** What shipped goes to
[CHANGELOG.md](CHANGELOG.md); the reasoning that produced it goes to
[TODO_ARCHIVE.md](TODO_ARCHIVE.md), verbatim and in full. Only the heading stays here, above one line
saying where the rest went, so a `§N.M` reference from code, a test or another document still lands.
A subsection still marked `[ ]` or `[~]` stays behind under that heading: open work is never filed
under done. [agent_tools/todo_hygiene.py](agent_tools/todo_hygiene.py) fails the build when a closed
section keeps its body — this file reached 5,406 lines, 2,542 of them closed, before anyone noticed,
and every agent that read it paid for those lines.

New sections go at the END of the file, in number order.

Canonical context: [README.md](README.md) (architecture & features), [use_cases/](use_cases/)
(workflows), [CONTRIBUTING.md](CONTRIBUTING.md) (conventions). Durable engineering lessons live
with the agent operating rules, not here — this file records *work*, not process.

## Resume point — state as at 2026-09-26 12:06

Read this and `.private/AGENT_SYNC/` before touching anything.

Written when Simon stopped every agent at 2026-09-26 12:06, and committed at 2026-09-27 03:01, when
he told them to carry on. The machine slept between the two, so **everything below describes the tree
as it was fifteen hours earlier** — re-read `git log` and `git status --short` rather than trusting
the commit list here. What is ruled, refuted and measured does not go stale; what is in the tree
does.

**The tree.** `librept-39` parked its unfinished §81.2 with `git stash push -u`, named
"claude-opus §81.2 WIP", so `main` is clean; §81.2 says what is missing. Shipped today: §79 German,
§79.3, §79.4, §81.1 (`f847eb4`), §82.1 (`964539d`), and the ISO date in `3461d92`.

**Two stale claim notes are still in `.private/AGENT_SYNC/`.** `gpt-6-trainer-review.md` belongs to a
Codex session that ran out of tokens and is not coming back. `claude-opus-card-copy.md` (2026-09-23)
waits on a note that no longer exists. Both lock nothing and nobody owns them. Simon decides whether
they go.

**§80, the trainer's first-use review, is ruled and needs no re-checking.** Codex tested the
published build `0625bd6`, fourteen commits behind, so every finding was re-verified in the code on
`main`. §80.1 is refuted — it is §66 working as ruled. §80.2's terms modal is fixed in §81.1. §80.4
was three defects: its date is closed, its language-change seam is in §81.1, its two unkeyed menu
rows in §81.2. **§80.3 is the one finding nobody has taken**: the exercise catalogue's 48 English
names carry no search synonyms, so "počep" matches nothing, and localised names are refused by
§46.4. It needs Simon's Slovenian and German search terms, which an agent must not invent by
translating. Codex's own scenario §80.1 is also unfinished: running a session, logging sets, fixing a
wrong entry and closing it were never tested, and the requested five hours were not spent.

**§83 waits on Simon's ruling** — §66's client-name check looks only forward, which breaks editing
old sessions and leaves the GDPR hole §66 exists to close.

**Two TODO entries Simon asked for on 2026-09-26 were never written.** They take the next free
numbers; §84 is taken by the legacy-session boot crash. Their content, measured rather than guessed,
so it is not lost:

1. **Better detection of a client's name in a field.** Run against the real `clientNamesIn` with
   clients "Ana Novak" and "Jože Kovačič", **nine of thirteen phrases pass through**: *Anin trening*,
   *trening za Novaka*, *pri Novaku*, *Vadba z Ano*, *Ano peljem ven*, *Anini zgibi*, *Kovačičev
   program*, *pri Jožetu*, *Novakova garaža*. Only *Ana 1:1*, *NOVAK doma* and *Telovadnica Novak*
   are blocked — and the last of those is a real gym name, so the rule is wrong in both directions.
   It matches the nominative only, which is the form a Slovenian trainer is least likely to type in a
   title. "Whole words only" was ruled on 2026-09-18 against an English-shaped assumption; the first
   market is inflected. Only two fields are checked at all, `setup-session-name` and
   `setup-location`, while [clientErasure.js](src/data/clientErasure.js) itself names three prose
   surfaces erasure cannot reach — session titles, draft titles and feedback notes — and the feedback
   note (`feedback_note_placeholder`) is unchecked.
2. **Offer the trainer a way out of the conflict: change the name, or change the field values.**
   Simon's words, 2026-09-26. Today the refusal is a dead end: retyping the field is the only exit,
   there is no way to change the client's name or alias from there, and no way to say the word is a
   coincidence.

**These two are ordered, and the order is the point.** A stricter matcher is safe only once the
conflict has an exit; while the refusal is a dead end, every improvement to detection costs more than
it buys.

## Where to start (ranked 2026-08-22)

The governing fact is [docs/PREVIEW.md](docs/PREVIEW.md): the app tells its own users it can wipe
their data. Nothing trainer-facing can be promoted until that is false, so the ranking is **data
safety → showability → everything else**.

**Every ranked item from 08-17 has shipped**: §26/§1.7's self-onboarding (rank 1, 08-17), §18.7's
import consent (3, 08-18), and §8.7/§8.8's neighbourhood (4) is now the only gym-floor work left.
What replaced them, on 08-21/08-22, was the long demo and everything it needed — which is why this
re-rank looks different: §35's story named four product gaps, and building the story built them
(§8.1's shared plan, §35.3a's recurrence model, §35.3b's fit meter, §35.3c/d's gym notes).

Re-read this table against `src/` before trusting it, and close items in the commit that ships them.

| Rank | Item | Why now |
| :--- | :--- | :--- |
| 1 | §29 program import | The shape is decided and every prerequisite exists — the parser and its frozen corpus are the whole of it |
| 2 | §8.7 / §8.8 gym-floor remainders | §8.7 is a question rather than work (does completing a round stop its timer); §8.8's copy-program icon is cheap, and its open questions are answerable now that §8.1 exists |
| 3 | §23.6 / §23.1 — what "winning" means, then a channel | Nothing technical is left in front of a launch: the feedback route and the icon subsetting both shipped 2026-08-22 |

**Asked 2026-08-22 (Simon), answered rather than decided**: should the email go and everything run
through GitHub issues, praise included? Recommendation is no, on two grounds — the tracker is
**public**, and a screenshot of this app shows real people, which makes "post it publicly" bad advice
in an app built around client confidentiality; and praise is precisely the feedback that does not
survive the friction of opening an account. If one channel is wanted anyway, the honest version is
email only, with the maintainer filing issues from it. The public-tracker warning shipped regardless,
since it holds as long as the GitHub route exists at all.

**Both 08-22 ranks shipped the day they were written**: §23.5's feedback route (an address that needs
no account, plus the bug half pointed at an issue with a screenshot) and §12.6's subsetting.

**Waiting on a ruling, not on work** — §1.6's confirm link (a replayable capability token aimed at the
trainer's own store) and SMS as the response channel; §19.2's URL-privacy invariant, which unblocks
§19.3. Each is a question in its own section, deliberately not folded into the ranking above.

**Cheap wins, unranked** — each small enough to ride along with adjacent work. What is LEFT of the
list: §12.5's reflog expiry (one maintainer command) and §12.6's glyph subsetting (prerequisite
already built, and §7.2 wants the regular weight it would restore). Done since it was written:
§19.3's exercise-library filter reset and §25.6's overflow harness (2026-08-21), §18.11's retention
paragraph and §21's 60s → 30s navigation timeout (2026-08-22).

Deprioritised on purpose: §24.5/§24.7 remainders and §24.8's rename (optional by their own text),
§11/§5.1/§4.1 (large UI churn with no users yet to aim it), §17.2/§17.4 and §18.8–§18.12 (decided on
paper, correctly parked), §12.7 (measured, closed — do not reopen).

### Open work at a glance

One row per theme, so the shape of the backlog is readable without scrolling it. "Blocked on" names
the thing that must happen first, not merely what it touches.

| Theme | Open | Lead item | Blocked on |
| :--- | :--- | :--- | :--- |
| **Launch prerequisites** | §16.6, §23.5 | §16.6: one origin or two (custom domain) before trainers hold data | Simon's ruling on §16.6; §23.5's two open items (demo deep-link, Calendar in README) do not block a push |
| **Data safety remainder** | §18.8, §18.9, §18.12 | Storage durability warning, and the desktop file handle | Nothing; the backup encryption shipped 2026-09-28 |
| **Scheduling** | §1.2, §1.3, §1.4, §1.5 | Room occupancy via `freebusy.query` | §1.5's OAuth/verification path |
| **Gym-floor UX** | §8.7, §8.8 | Copy-program icon on the clipboard | Nothing; §8.7 is a question, not work |
| **History & templates** | §17.1, §17.2, §17.4, §17.5 | Modality into the history snapshot | Decided on paper, parked deliberately |
| **UI redesign** | §4.1, §5.1, §5.2, §11.1, §11.2 | Tabbed client view | Deliberately waiting for real users to aim it |
| **Go-to-market** | §23.1–§23.6 | Decide what "winning" means | §23.1 gates every channel choice |
| **Refactor remainders** | §24.4d, §24.5, §24.7, §24.8 | One movement → plan item mapping | Optional by their own text |
| **Tests & docs** | §6.2, §12.3, §12.5, §12.6 | Vendor Font Awesome locally | Nothing; all small |
| **The long demo** | Nothing blocking | — | The trainer opening Ana's file shipped 2026-08-25: the demo engine attaches a real file to the real input, so no hook was added to the shipped app |
| **Routing decisions** | §19.2, §19.3 | The URL-privacy invariant | One decision, then both unblock |
| **Data-subject rights** | §27.4 | One-tap withdrawal in the consent letter | Nothing; the other four shipped 2026-08-11 |
| **Reported 2026-08-18** | §28.2 | Which contributor-facing docs get BUILT, so their addresses are injected rather than written out | Everything else in §28 shipped the same day |
| **Client self-service** | §26.7 phase 2 | The vendored QR encoder and the wall poster | Deferred on purpose until the messaging handover has been tried in a gym; the link route shipped 08-22 |
| **Welcome screen & menu** | §81.1–§81.6 | The mandatory welcome screen (§81.1) | Nothing for §81.1–§81.4; §81.5 and §81.6 on Simon's answer |
| **Program import** | §29 | Nothing — shape decided 2026-08-18, and the editor-as-review answers the fragility question | The parser and its frozen corpus; the intake flow, media-type rule and catalog crosswalk already exist |
| **Live clipboard taps — PRIORITY** | §48.2 | Tracking and notes after the session | §48.2's measuring exception waits on §45.11; §48.1 shipped 2026-09-13 |
| **Trainer feedback 2026-09-11** | §45.4–§45.13 | §45.4's failed share of a filled-in signup | Nothing for the three defects; §45.4 is ruled (2026-09-15) and waits to be built, §45.8 on looking at both screens together |

---

## 1. Scheduling & Sessions

### 1.1 [x] PT-side client assignment to a session

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#11-x-pt-side-client-assignment-to-a-session); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 1.2 [x] Simultaneous sessions merged into one clipboard: multi-line titles + per-participant tags — dots shipped 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#12-x-simultaneous-sessions-merged-into-one-clipboard-multi-line-titles--per-participant-tags--dots-shipped-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 1.3 [x] Session list must model partial overlaps — shipped 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#13-x-session-list-must-model-partial-overlaps--shipped-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 1.4 [ ] Calendar preferences — holidays and non-working days
Import a holiday calendar (public holidays, gym closures) and colour-code off days on the date-jump
picker and the timeline's day lines. Needs a per-region feed and a per-PT toggle — a gym's actual
closures do not match a public holiday list. Distinct from the existing temporal tinting
(`--temporal-past`/`--temporal-future`), which is about session recency, not whether the day is open.
**This one stays in the free app** despite the 2026-09-27 ruling above: a holiday list is a published
feed anyone may subscribe to, not a read of the trainer's own Google account.

### 1.5 [ ] [Brainstorm] The Google grant this app asks for, and the data-processor exposure it avoids
**Raised 2026-08-01 (Simon).** Settles the "shared calendar or backend" question left open in §1.3.
Cross-referenced from [PRIVACY.md](PRIVACY.md).

**Narrowed 2026-09-27: the Calendar half left this app.** Google Calendar as the authority for
scheduling facts, room occupancy read per room, and the trainer's own calendar read for a clash
warning are all paid capabilities now — the ruling is in the private `~/Projects/EnterprisePT`
project, `TODO.md` §19, and §68.3 below lists what leaves this repository. So this app's Google grant
is Drive and nothing else, which is what the rest of this section is about.

- **No backend of our own.** Cross-device sync goes through Drive `appDataFolder` on the same OAuth
  grant — **built, see §3.3**, which also supersedes this section's original merge sketch.
- **PII on Drive**: `appDataFolder` gives TLS, Google's at-rest AES-256, and app-scoped access
  isolation. Since no server LibrePT operates touches the data, the maintainer stays outside the
  controller/processor chain; PT-to-Google is the PT's own arrangement. **Zero-knowledge encryption
  shipped 2026-09-28** (§18.8): the snapshot is an AES-GCM envelope written on the device, and sync
  does not run until the trainer has set the backup password, so Drive never held a readable copy. The
  recovery story this was waiting on is the password itself — derived from words the trainer keeps on
  paper rather than a random key that lives on one phone — plus the sentence that says so when it is
  set.
- **Firestore was rejected as the default**: it would make the maintainer a GDPR **processor** (DPA,
  subprocessor disclosure, residency choice, breach duties), none of which applies to Drive
  `appDataFolder`. Reconsider only for true sub-second push or server-side compute. **Open**: is
  either ever needed, or is poll-on-resume enough?
- **GCP dependency, independent of the above**: Drive access needs a developer-registered OAuth
  client. Public distribution beyond ~100 test users requires Google's consent-screen **verification**
  (privacy policy, homepage, review lead time) — a real launch dependency to plan for.
  **`github.io` is a live risk here**: it sits on the Public Suffix List, so proving domain ownership
  for the OAuth review may not be possible, and the privacy policy needs hosting on the app's own
  domain regardless. A custom domain resolves both and is on the launch path anyway.

#### 1.5.1 [x] Live-Google testing with a bounded stored credential — 2026-08-16

**Built 2026-08-10**: [tests/live/](tests/live/), `.github/workflows/google-canary.yml`,
`build.run_live_google_tests`. The canary workflow is complete; it needs only its one-time consumer
credential before it can run live.

**Settled 2026-08-12, after two attempts at storing no secret at all — worth recording in full,
because both attempts were reasonable and both were wrong.** The goal was never "test Google", it
was **"test Google from a public repository without a credential to leak."** Workload Identity
Federation answered that exactly: GitHub's OIDC assertion exchanged for a short-lived token at run
time, nothing stored on either side. A vaulted consumer refresh token (Secret Manager, unlocked by
that same federation) was built alongside it, then removed as buying no coverage — the argument
being that the only thing a consumer identity exercises that a service account cannot is the consent
flow, which no CI can drive anyway since Google fingerprints and blocks automated browsers on
`accounts.google.com`.

**That last step is false, and the canary said so on its first dispatch:** `findSyncFile` (a list)
answered, `createSyncFile` (the multipart upload) returned **403**. Google removed service-account
Drive storage quota, and neither remedy they publish reaches this case — an `appDataFolder` cannot
live in a shared drive, and domain-wide delegation needs Workspace, not a consumer Gmail. Seeding
the folder by hand does not work either: `appDataFolder` is written only by the owning account
specifying `parents: ["appDataFolder"]`, so a manual upload is the identical refused request, and a
file shared into the account lands in "Shared with me" where `spaces=appDataFolder` will never see
it.

**A service account can therefore read the Drive API and can never write to it** — and because the
folder stays permanently empty, everything downstream of a file existing goes with it: download,
update, and the `modifiedTime` assertion `driveSyncService`'s conflict detection depends on. What
was left was one call on its empty-result path. Multipart upload, the one hand-rolled wire format in
`driveAppData.js` and the likeliest thing to break, would have been unwatched.

**So the design is now a plain stored credential, and the cost is stated rather than engineered
around**: a real account's refresh token in the `GOOGLE_LIVE_CREDENTIALS` Actions secret, written
into `.private/google-live.json` at run time so CI and a laptop run one code path. WIF, Secret
Manager and `agent_tools/wif_audit.py` are all deleted — a federation with no consumer is a standing
capability nobody would notice was still granted. Bounding what the credential can do is what
replaces bounding whether it exists: the grant is `drive.appdata` (one hidden folder, one probe
file) plus `calendar.freebusy` (busy intervals, never an event body), and there is no
`pull_request_target` trigger.

**Two consequences worth carrying forward.** The 7-day refresh-token expiry is a *Testing*-mode
property, not a verification one: the consent screen is now **In production** (unverified is fine,
the 100-user cap stays), so the credential remains valid until revoked, changed, or unused for six
months. A missing or expired credential makes the canary fail before checkout rather than report a
green run that watched nothing. The static "canary requests the app's scopes" check could not
survive the move — the grant lives on a consent screen now, not in the workflow YAML — so it became
[tests/live/tokenScopes.live.test.mjs](tests/live/tokenScopes.live.test.mjs), which asks `tokeninfo`
what the token was actually granted. Strictly better: it also catches an OVER-broad grant (a `drive`
scope left from debugging) that would keep every Drive test green while production's narrow
`drive.appdata` was broken.

- **Testing a PR branch by hand** uses the workflow's `access_token` dispatch input, which
  short-circuits `_credentials.mjs`. Deliberately an ACCESS token, not the refresh token: a
  dispatch input is echoed on the run's own page, so on a public repository treat it as published
  the moment it is submitted. An hour-long token that is revoked afterwards bounds that; a refresh
  token pasted there would be a standing grant on a real account.
- **Not a deploy gate, deliberately.** It sits outside `deploy.yml` rather than joining the chain, so
  Google's uptime can never block a release. `pipeline_gates.py`'s one-terminal-job rule holds
  trivially in a single-job workflow. What it cannot cover — the consent UI — is unautomatable
  anyway: Google fingerprints and blocks driven browsers on `accounts.google.com`.
- **[x] Done 2026-08-16.** The credential is minted on the dedicated throwaway account, stored as the
  `GOOGLE_LIVE_CREDENTIALS` secret, and the first live canary run passed — so Drive `appDataFolder`,
  the multipart upload, `freeBusy.query`, the granted scopes and the rotation deadline are all
  verified against the real Google, not against a stub. The rotation date is in the maintainer's
  calendar, which is the one part of this no code in the repo can guarantee (see the rotation bullet
  above: a guard inside the repo can only fire when someone touches the repo).

  How it was done: run `python -m agent_tools.google_credential`, which consents in a
  browser, exchanges the returned code and verifies the granted scopes in one step, then store its
  JSON as the `GOOGLE_LIVE_CREDENTIALS` GitHub Actions secret. It uses the supported Desktop loopback
  callback; Google's retired copy/paste OOB callback cannot work for an app that is In production.
  Run it as the **dedicated throwaway** created 2026-08-16 (`canary@` in the runbook). Google's
  per-phone-number signup limit blocked an earlier attempt, which is why this section briefly said to
  use the admin account instead; retrying worked. The throwaway is the better identity for the one
  place a long-lived refresh token is stored — the admin account owns both GCP projects, and while
  the grant could never administer them (an OAuth token carries only its scopes), an account holding
  nothing is a smaller thing to lose. Being an ordinary consumer account, it has the Drive storage
  quota a service account lacks, which is the whole reason a human account is needed here.
  The tool exists because the flow was three hand-run steps around a **single-use** authorization
  code, so any stumble after the code was written to disk meant starting the consent over.
- **The six-month expiry is a rotation deadline, not a diary entry — and this is the subtle part.**
  Google revokes a refresh token that has gone **six months unused**, and that clock is reset by
  every use, so the daily canary keeps the credential alive indefinitely and no renewal ever falls
  due while things work. The clock only starts advancing once the canary **stops**, and every way it
  stops is quiet: GitHub disables scheduled workflows after 60 days of repository inactivity, a
  workflow edit can break the `cron`, a repository can be archived. By the time anyone notices there
  is nothing to notice — the credential is simply dead, and the fix is the full consent flow again.
  So there is nothing observable to alert on, and a calendar reminder would be exactly the
  silently-expiring, nobody's-job artefact no gate may carry for
  suppressions. Instead `python -m agent_tools.google_credential` stamps a `minted` date and
  `python -m agent_tools.credential_expiry` runs **inside the canary**, failing it from **150 days**
  — a month inside Google's 180 — so a live canary turns red with runway, and a canary that stopped
  comes back red the moment it next runs. It is deliberately a hard failure rather than a warning
  (a gate that warns and returns success is a build failure); a month of
  daily red is the action item.
  It cannot live in `build check` Stage 1, because a contributor's clone holds no credential and a
  check that skips on a missing file gates nothing — so Stage 1 asserts the *workflow still runs it*
  instead, via [tests/unit/test_google_canary_workflow.py](tests/unit/test_google_canary_workflow.py).
- **Not built**: a live test importing a real `calendarFreeBusy.js`, because §1.3's occupancy module
  does not exist yet. `calendarFreeBusy.live.test.mjs` probes the endpoint directly meanwhile, which
  is what proves the minted token actually carries the calendar scope.

### 1.6 [~] Double-booking warning while the slot is being typed
**Raised 2026-08-16 (Simon)**, as the first of three calendar asks: warn the PT when they are busy or
their own sessions overlap; then read gym-location calendars; then send invites that a gym inbox or a
client can accept.

**Shipped**: the local half. [src/domain/scheduleConflicts.js](src/domain/scheduleConflicts.js)
classifies every collision the app can already see, and the setup form renders it live under the time
fields rather than at submit — a clash mentioned only on save is one the trainer has already
committed to, and on a phone the submit button is nowhere near the time inputs.

- **The distinction the whole feature rests on**: two of the trainer's sessions overlapping IN THE
  SAME PLACE is §1.2's merged clipboard, a supported flow, and warning about it would fire on the
  ordinary case. Being in two PLACES at once is impossible. So a clash needs both slots to name a
  location and the names to differ; a blank location is never read as "somewhere else".
- **A warning, never a block.** The trainer knows things the app does not — the other booking was
  cancelled, someone is covering — so a clash is a confirm, not a refusal.
- **The external half left this app on 2026-09-27**, with every other Google Calendar integration
  (§1.5, and §68.3 for what leaves the repository). It would have read the trainer's own Google
  calendar to warn that they are already committed elsewhere, and that now belongs to the paid tier
  (`~/Projects/EnterprisePT` `TODO.md` §19). The rules keep taking `busy` intervals as a first-class
  input, because they cost nothing and the paid overlay supplies them — but in this app nothing ever
  will, so the warning sees only what the app itself recorded.
**Shipped alongside it — the invite has a return address now.** An `.ics` carrying
`ATTENDEE;RSVP=TRUE` and no `ORGANIZER` is an invitation with nowhere to reply to (RFC 5546 requires
the property for a `METHOD:REQUEST`), so acceptances were not merely unread by the app — most
calendar clients never generated one. The invite dialog asks for the address once and remembers it
([trainerIdentity.js](src/data/trainerIdentity.js)). **This does not put RSVPs into the app**: the
reply is an email, arriving in the trainer's mailbox, which a backendless PWA cannot read. It means
the trainer finds out. Acceptance is a manual read for now, by decision (2026-08-17).

**Decided 2026-08-17 (Simon) — the channels are EMAIL and SMS.** Everything client-facing is
addressed to one of those two. The share sheet and clipboard entries stay in the registry as they
are: clipboard is what keeps the list from ever being empty, and neither is a channel the app
designs around.

**Shipped — the transport seam.** Decided 2026-08-17: what an event IS
([sessionEventPayload.js](src/data/sessionEventPayload.js)) is separated from how it TRAVELS
([eventTransports.js](src/modules/common/eventTransports.js)), so a channel can be chosen per
recipient and a new one is a new entry in one list rather than a new payload format. Four to start:
text message, mail compose, system share sheet, clipboard. The wire format is versioned and
short-keyed against a measured budget — a QR that scans phone-to-phone holds ~300 bytes and an SMS
segment is 160 characters, which is why a session summary travels and a program never will.

- **[~] The confirm link — decided and half-built, 2026-08-17.** No reply can reach the app on its own,
  so the client's answer travels as a message to the trainer whose body carries a LibrePT deep link the
  trainer taps once. **Built:** `replyToInvite` in [sessionEventPayload.js](src/data/sessionEventPayload.js),
  `organizerPhone` on the invite, and the client-facing reply page
  ([rsvpView.js](src/modules/rsvp/rsvpView.js), `bootRsvpReply`) offering both channels.

  **A PAGE, not two links in the invite body** — the original sketch here. An `sms:` URI inside an SMS
  body is not linkified by most messaging apps, so the SMS leg would have had no working confirm route
  at all; both invite channels carry a plain `https` link instead, and the reply URI is built at tap
  time. It needed **no new route**: an invite link is already the app root with `?evt=`, so the boot
  decision turns on what the payload IS — an invite means the client is answering, an RSVP means the
  trainer is collecting one. Inventing `/rsvp` would have stranded links already sent.

  **The PII question is answered by construction**: a reply carries `{sessionId, clientId, answer}` and
  nothing else — no name, no title (a title like "Post-surgery rehab" would disclose a medical fact
  about a named person to every system the message passes through), no location. Pinned by a test that
  greps the encoded payload for each of those.

  **Still open — the replay question.** The link is a capability anyone holding it can re-send, which is
  low stakes (it writes only to the trainer's own store, and an RSVP is not destructive) but is not
  *nothing*: a forwarded invite lets a third party answer for the client. Not yet decided.

  **[x] The invite leg — built 2026-08-17.** Every invite now carries the reply link, and a client with
  a phone number gets a **Text it** button beside the email one: a text cannot carry the `.ics`, so
  email keeps the calendar file and the text carries the link. `organizerPhone` comes from
  [trainerIdentity.js](src/data/trainerIdentity.js), which gained a third string for exactly this and
  prefills it the way the organizer email already does. Rows rebuild on organizer-field input, because
  an `<a href>` is resolved by the browser rather than by a handler that could read those fields later.

  **[x] Trainer-side ingestion — 2026-08-17, and the storage question was answered by ruling rather
  than by either option I offered.** Decided (Simon): *"invites should host the RSVP status, sessions
  should host attendees list (by reference only for easier anonymization)"* and *"not all attendees
  need an invitation, some will be added manually"*. So `invites` is its own collection
  ([inviteRecord.js](src/data/inviteRecord.js)): an RSVP is a fact about a message that was sent, not
  a property of a person or of a session, and `sessions.participants` stays authoritative — an
  attendee added by hand simply has no invitation. A tap on a reply link upserts the answer and
  **never touches `participants`**: a "no" is an answer, not a withdrawal.

  Also decided: **no "late" mark, record the response time** — `answeredAt` and `sentAt` are both UTC
  instants, so subtracting them is correct across timezones and the reader compares. The convention is
  written down now ([DATA_MODEL §1](docs/DATA_MODEL.md)): instants are UTC, calendar dates are local,
  and the consent date is the case that proves the distinction matters.

  **Declared in the PREVIEW schema, deliberately** (Simon: *"we can afford [the] shortcut of modifying
  schema 4 now, but not modifying it would actually test our rollout plans"*). It did test them, and
  they failed: nothing enforced staging at all. The fan-out wrote every record into every store and the
  backup file walked the projector table, so a preview-only collection would have landed in schema 4
  and in every backup, undeclared. Enforced now in both places, with the restore prompt naming what a
  file cannot carry — see §18.4 and DATA_MODEL §1. **The cost is accepted and visible: an RSVP does not
  survive a restore until schema 5 is minted from P.**
- **[x] A changed session offers to tell the clients — 2026-08-17.** Simon: *"when a session gets
  changed, PT should be asked if they want to resend invitations"*. Saving an edit that moved the slot or
  the room asks once, names what moved, and on yes reopens the ordinary invite dialog for the people who
  were already invited. **Which changes count is the design**
  ([sessionChangeNotice.js](src/domain/sessionChangeNotice.js)). **Refined the same day** to exactly four
  triggers: the slot, the room, the session's KIND — *"if PT would change from leg strength to cardio or
  similar"*, derived from the modalities its routine prescribes — and the invitee list. A rename, or a
  reshuffled plan of the same kind, asks nothing: a prompt that fires on a typo is a prompt that gets
  dismissed on the change that mattered. Only clients who were **invited and are still participants** are
  offered — a hand-added attendee was never sent anything, and turning a time change into their first
  invitation is not what was asked. **The trainer always decides** (*"it is up to PT to resend
  invitations"*): saying no sends nothing, and this surface only ever offers.
- **[x] Invitations expire — asked for and built 2026-08-17.** Simon: *"can invitations expire (PT sets
  the expiry padding — example 4 hours before session)"*. Yes: the trainer sets hours-before in the
  invite dialog (remembered like the organizer email), the cutoff is computed as an absolute instant and
  **travels in the payload**, and the reply page closes with "message your trainer directly" once it
  passes. Three properties worth keeping:
  - **Derived, never stored.** Nothing runs at the cutoff — a phone in a pocket writes nothing — so an
    `expired` status would only become true if the app happened to be open. `now > expiresAt` is right
    the first time anyone looks ([inviteExpiry.js](src/domain/inviteExpiry.js)).
  - **Advisory, and it says so.** Two devices, two clocks, no server to arbitrate. The page declines to
    SEND; nothing recalls a message in flight, and a late answer that arrives anyway is still recorded —
    which is exactly why there is no "late" flag, only a response time.
  - **0 means "no deadline" and is different from unset.** A trainer who turned expiry off must not have
    it reinstated by a default, so absence and zero are told apart in the setting
    ([trainerIdentity.js](src/data/trainerIdentity.js)).
- **[x] SMS as a second channel — decided 2026-08-17 (Simon: "let us have SMS too, for sure").** It is
  in on BOTH legs, including the reply, and the question it settles was specifically whether a channel
  with unreliable body prefill is worth shipping: it is, because clients answer texts. So email is
  never removed — `sms:` prefill is inconsistent across Android OEMs and a mangled body is a reply with
  no link in it, which email does not do — and neither is the only route. An SMS still cannot carry an
  attachment, so the `.ics` remains email-only; SMS carries the link. Consequence, now built: the invite
  has to carry `organizerPhone`, since the client's device knows nothing about the trainer beyond what
  the invite told it.
- **Found on the way, fixed**: opening a scheduled session for edit showed the next half hour instead
  of the session's own slot — the form read `timeLabel`/`date`, the live clipboard meta's field
  names, while a stored record carries `time`/`startDate`. Re-saving silently moved the session to
  whenever the trainer had opened it.

### 1.7 [ ] Client self-onboarding and GDPR consent from a QR on a leaflet
**Wanted 2026-08-17 (Simon).** A code on a gym wall or a printed leaflet that a prospective client
scans to introduce themselves and give consent, so a PT acquires a client without typing anything.
Rides the same seam §1.6 built: an event, encoded into a link, carried by email or SMS.

- **The QR is static and generic** — one code per trainer, not per client, so it carries only the
  trainer's return channel (~100 bytes, prints crisply at leaflet size). It therefore does **not**
  force the in-app QR-generation question: a code needed once, for printing, can be produced by any
  tool outside the app. An in-app generator is a separate convenience, and the only thing that would
  make a vendored QR library necessary.
- **The consent it produces must be the same record a PT-captured consent is** —
  `{cloudSync, consentDate, formVersion, formLang}` per [clientConsent.js](src/data/clientConsent.js).
  Art. 7(1) requires being able to DEMONSTRATE consent, so the wording version and the language it
  was given under have to travel with it; a self-served consent that loses those is not evidence of
  anything. The notice and form pages already exist in both languages
  ([privacy-notice-en.html](src/privacy-notice-en.html), and the `sl` pair).
- **Decided 2026-08-17 (Simon) — the client offers goals and injuries if they choose to.** So the form
  does collect Art. 9 health data, and the exposure story is the transport: those fields ride **only
  inside the shared file**, never in a URL, so they never sit in a carrier's logs or two phones'
  message histories. They are optional at every level, and a blank field is absent from the record
  rather than stored as an empty string — "chose not to say" and "not asked yet" are different things
  for a trainer reading the review. Pinned in [clientSignup.js](src/data/clientSignup.js).
- **Decided 2026-08-17 (Simon: "use shares")** — the submission travels as a FILE, not a payload in a
  link. This retires §26.2's fragment codec for phase 1: there is no URL payload to compress, so
  nothing needs `CompressionStream` and the §19.2 URL-privacy question does not arise here at all.
  Built: [signupFile.js](src/data/signupFile.js) (the artifact, both declarations) and
  [signupDelivery.js](src/modules/intake/signupDelivery.js) (share sheet, with the permanent download
  fallback — `canShare({files})` is false on every desktop and on iOS below 15).
- **The original recommendation, kept for the reasoning**: the submission travels as a FILE attached to an email,
  not as a payload in a link — `navigator.share({ files })` puts it in the client's mail app in one
  tap, and `mailto:` cannot attach anything, so a link-based version would have a stranger hand-
  attaching a download. Three things follow. Nothing sensitive crosses a carrier or sits in a URL, so
  the Art. 9 question above may simply stop applying. The file is a RETAINABLE artifact — notice
  version, language, timestamp, what was ticked — which is far better Art. 7(1) evidence than a query
  parameter. And there is no size budget, so a signature or photo becomes possible later. The
  trainer-side fallback already exists in [encryptedFileReader.js](src/modules/common/encryptedFileReader.js)
  ("pick the file someone sent you, opened on this device, no copy kept"), so this is buildable with
  no manifest work; `file_handlers`/`share_target` registration later upgrades it from *find the
  file* to *tap the attachment*. iOS Safari supports neither, so the fallback is permanent, not
  temporary.
- **Decided 2026-08-17 (Simon) — one media type per handling surface, not one generic type with a
  `kind` field inside.** `application/vnd.librept.signup+json` (RFC 6838 vendor tree, RFC 6839 `+json`
  suffix) plus a distinctive extension, because the mechanisms key off different things: an Android
  share intent routes on the MIME type, an OS file association routes on the extension, and email
  frequently relabels the type to `application/octet-stream` so only the extension survives that hop.
  Declaring both is not redundancy. **Marked for reconsideration** if the number of file kinds grows
  enough that per-kind declarations become the larger cost.
- **Amended 2026-08-30 (Simon) — the distinctive part goes LAST: `.json.librept-signup`.** It was
  `.librept-signup.json`, chosen when the trailing `.json` was what kept the file openable where no
  association existed. Registering the app as a file handler (§38.22) made that the wrong way round:
  **an operating system associates on the last suffix**, so a distinctive part in the middle
  registers nothing, and claiming `.json` instead would hand LibrePT every JSON file on the phone.
  *"daj na konec, json pred tem je namig uporabniku"* — the `.json` stays, now as a hint to the person
  looking at the file rather than as the association.
- **Open**: whether the landing page is a generated static page (the `privacy.html` pattern — own
  CSP, offline-cached) or a route inside the app; and what the PT sees on arrival, since accepting a
  stranger's submission into the client register should be a deliberate act rather than a silent
  write.
- **Started anyway, because it depends on none of the above (2026-08-17)**: the submission RECORD is
  built and tested ([clientSignup.js](src/data/clientSignup.js), §26.7 phase 0). Identity, contact and
  the consent stamp are the same under every option on the table; the file-vs-link question and the
  health-data question both decide *transport and form*, not the record. The record ships with health
  fields excluded, which is the option that stays reversible whichever way the ruling goes.

---

## 3. Data Sync

### 3.3 [x] Google Drive periodic sync

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#33-x-google-drive-periodic-sync); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.5 [x] Paper consent — checkbox, signed date, form version, and delivery

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#35-x-paper-consent-checkbox-signed-date-form-version-and-delivery); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.7 [x] [Superseded by §18.6] Persistence engine — localStorage JSON, then IndexedDB

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#37-x-superseded-by-186-persistence-engine-localstorage-json-then-indexeddb); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.8 [x] Unbacked-data warning banner — same weight as the PREVIEW badge

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#38-x-unbacked-data-warning-banner-same-weight-as-the-preview-badge); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.9 [x] [Decided] Every write increments the ahead counter on the Sync & Backup button

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#39-x-decided-every-write-increments-the-ahead-counter-on-the-sync-backup-button); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.10 [x] [Decided] Drive syncing is manual-only; periodic/resume ticks refresh counters, not data

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#310-x-decided-drive-syncing-is-manual-only-periodicresume-ticks-refresh-counters-not-data); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.13 [ ] A second sync store for Apple users, or a backend of our own — researched 2026-09-27

**Asked by Simon, 2026-09-27**: would a private sync layer on Google Cloud (for Android users) or
iCloud (for Apple users) be easier than using the services those accounts already provide?

**No, and the Google half of the question is already answered by working code.** Drive
`appDataFolder` (§3.3) IS a private sync layer inside the trainer's own Google account: one hidden
folder only this app can read, on a scope that reaches nothing else, with the merge, the conflict
detection and a live canary already built and green. There is no easier version of that, because
there is no remaining work in it.

**iCloud, read at Apple's own pages rather than assumed.** The only way a web app reaches a user's
iCloud data is CloudKit JS, and four facts from Apple decide it:

- *"You must have an existing CloudKit app and enable web services to use CloudKit JS"*, and
  *"You'll use Xcode to create your app's containers … Then create an iOS or Mac app that uses
  CloudKit to store your app's data"*
  ([CloudKit JS](https://developer.apple.com/documentation/cloudkitjs)). The web client is the
  companion to a native app, not a way in on its own — so the documented path starts with an iOS or
  Mac app, a Mac to build it on, and $99 a year for the Apple Developer Program
  ([Apple Developer Program](https://developer.apple.com/programs/)).
- The web session is short and fragile: *"the web authentication token expires 30 minutes after it
  is created. If the user selects 'Keep me signed in' … the duration of the token is 2 weeks"*, and
  *"Each token is intended for a single round trip to the server … the previous token is no longer
  valid"*
  ([CloudKit Web Services Reference](https://developer.apple.com/library/archive/documentation/DataManagement/Conceptual/CloudKitWebServicesReference/SettingUpWebServices.html)).
  Against that, the Google refresh token this app holds stays valid until it is revoked or goes six
  months unused (§1.5.1). A trainer being signed out every fortnight, on a gym floor, is the failure
  this app exists to avoid.
  **Corrected 2026-09-27 (Claude), read in `src/data/googleAuth.js`:** the app holds no refresh
  token. It uses Google's browser token flow and keeps an access token of about an hour in memory
  only; the six-month refresh token is the CI canary's (§1.5.1), not the app's. The comparison with
  CloudKit's two-week token still points the same way, because Google renews the app's token
  silently, but it is not the one written above.
- What iCloud genuinely gives is the storage bill: *"Any data stored in a user's private database
  counts against their personal iCloud quota"*
  ([TN2241](https://developer.apple.com/library/archive/technotes/tn2241/_index.html)) — the same
  arrangement `appDataFolder` already has with Google.
- An API token is issued per container from the CloudKit Console, with the allowed web domains named
  on it
  ([Obtaining an API token](https://developer.apple.com/documentation/CloudKit/obtaining-an-api-token-for-an-icloud-container)).
  That part is ordinary.

So iCloud costs a yearly fee, a Mac, a native app nobody asked for and a second sync implementation
to maintain, and it buys one thing: an Apple user not needing a Google account. They can already
sign in to Drive from Safari today.

**A backend of our own on Google Cloud is the expensive direction, not the easy one.** Google's own
terms are explicit: *"Google is a processor and Customer is a controller or processor, as
applicable, of Customer Personal Data"*
([Cloud Data Processing Addendum](https://cloud.google.com/terms/data-processing-addendum)). The
moment a server we run holds a trainer's clients, we are in that chain — a processing agreement per
trainer, a hosting location, deletion and export duties, a breach notification path. That is the
reason §1.5 rejected Firestore, and none of it applies while the data sits in the trainer's own
account.

**Open, and the only part worth spending on**: an Apple user has to have a Google account to sync at
all. The cheap answer is not a second cloud but the file the app already writes — export and import
through the share sheet, which needs no account anywhere. Whether that is enough for a trainer with
two devices is not known, and nobody has been asked.

## 4. UI / UX

### 3.11 [x] Sync surface — the icon vocabulary and tap-to-sync — SHIPPED 2026-08-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#311-x-sync-surface-the-icon-vocabulary-and-tap-to-sync-shipped-2026-08-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.12 [x] Ship the remaining trainer-facing docs as pages, not GitHub links

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#312-x-ship-the-remaining-trainer-facing-docs-as-pages-not-github-links); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 4.1 [ ] Theme redesign
Light mode needs a nicer design (reference:
<https://claude.ai/code/artifact/f27dc4ca-e1b4-47dd-b3c6-34dee3d6110c>), dark improved in the same
pass. Constraint: both must keep working from the custom properties in `index.css` — no hard-coded
theme colours.

### 4.3 [x] Collapse the duplicated session header into one row, with a date picker — see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#43-x-collapse-the-duplicated-session-header-into-one-row-with-a-date-picker-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 5. Client Detail

### 5.1 [ ] Tabbed client view
Clicking a client opens a tabbed view instead of today's flat `view-client-detail`. Keep the goals
and health/injury notes as they are.

| Tab | Content |
| :--- | :--- |
| **1 — Sessions** | The sessions this person attended. |
| **2 — Exercises** | Every exercise the person has done or will do, **chronologically ordered, with no grouping by session** — one continuous timeline across history and plan. |
| **3 — Next session prep** | Where the trainer creates cards for the next planned session, **or** for a placeholder session not yet on the calendar. |

- Tab 2 is a genuinely new projection: exercises exist only *inside* sessions/routines today.
- Tab 3 introduces a **session with no calendar entry**. Decide where it lives in the data model and
  what happens when it is later attached to a real booking. (§7.3(3)'s unscheduled state is the same
  question from the other end and is now partly built.)
- Closes the loop with [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md).

### 5.2 [ ] Client add/modify — fold editing into the detail view, keep creation a minimal modal
**Decided (2026-07-22): no standalone add/modify client view.** Unlike a session (setup vs. live
clipboard are genuinely different modes), a client has no "live" mode, so a separate edit view would
just duplicate the detail screen. **Create** = a lightweight modal with the minimum to bring the
client into existence, dropping straight into the detail view. **Edit** = inline inside §5.1's tabbed
view. Effectively a sub-decision of 5.1 and should ship with it.

---

## 6. Housekeeping

### 6.2 [~] Extract use cases and usage scenarios from the tests
The Playwright suites drive real end-to-end flows that are documented nowhere. Extract them into
[use_cases/](use_cases/) following OKF (frontmatter, `INDEX.md` row, graph links).

- **Partly done**: the session day deck, deep-linkable views and the not-found flow are written up as
  [UC5](use_cases/uc5_session_day_deck_and_deep_links.md), with a spec↔test traceability table.
- **Still open**: (a) the reverse gaps — UC1/UC2 behaviour (voice notes, the feedback→adjustment
  wizard, plan pivots) with partial or no coverage; (b) whether the newer app-surface flows (themes,
  header menu, first-run terms, sync/backup) each deserve a UC or belong in README feature docs.
- **Coverage measured 2026-09-28; gaps closed in `ddd9e95`, gate checks in `2d7ef08`.** Line coverage of
  `src/` over all test tiers, one run with a V8 coverage plugin kept outside the repository: 93.3% of
  27,510 code lines. The run cannot see the service worker (`src/sw/`, 0%) or `src/app.js` (served
  different from disk); seven e2e tests failed on the integrity overlay because another session wrote
  `src/` mid-run, so their share is missing. Tests added: UC2's Apply / Dismiss / close / Swap on
  the plan, a floor note reaching the review screen after a reload, the timer's ✕ and its single
  alert at zero, the app opening and keeping a note with the network off (no test did this before),
  and unit tests for `loadInputHTML`, `metricLabelKey` and their neighbours. `loadParts` had no
  caller and is gone. UC1–UC4 have traceability tables; the gate fails a use case without one
  (`agent_tools/use_case_tests.py`) and pure logic below 90% unit coverage
  (`agent_tools/unit_coverage.py`). Browser-tier coverage is not gated: it moves with timing.
- **[ ] The tier counts in `tests/INDEX.md` are stale**: e2e says 55 files and 253 tests, pytest
  collects 73 and 328; medium 60/349 against 64/442; unit 44/316 against 52/360. A number copied
  into prose is wrong the day after. Next step: drop the counts, or generate them.
- **[~] Adapting a plan: during the session, after it, and for the next one — ruled 2026-09-28
  (Simon).** *Pivot / Wipe Plan* and its placeholder cards were never asked for: nobody wipes a plan.
  What is wanted: when a plan has to change — something unexpected, or simply for better results —
  the trainer logs on the changed steps with as few taps as possible during the session, and
  afterwards edits notes and plans as a retrospective and adjusts future plans. Find the simplest way
  to support it. The pivot text leaves UC1 and README with that design. Proposal being discussed:
  a client always trains from their OWN copy of the plan, the routine is only where a copy starts.
- **[~] UC2 *Apply & Resolve* changes a routine every client shares — ruled 2026-09-28 (Simon): on a
  change to something shared, detect the client it is for and split off a copy for them.** Routines
  have no client; the dialog writes into the first routine holding the exercise
  (`resolveAdjustmentTargets` in `src/modules/plans/planAdjustments.js`). A scheduled session holds
  ONE `routineId` for all participants, and the only per-client owned plan is a planning draft in
  `history`, which a session does not read when it starts — so a split-off copy would not reach the
  gym floor until a session does. Same design round as the item above.
- UC1 step 2 and UC4 step 8 (Google Calendar guests): resolved by §68.3 — UC4 is gone, UC1 says
  participants are assigned or answer the session's invitation.
- The last save lost when the page closes at once: fixed — a closing page with a write unfinished
  keeps a copy in localStorage, and the next start takes it (`src/data/unsavedStateJournal.js`).

### 6.3 [x] The bottom session bar renders nothing — decided: restore, active state only

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#63-x-the-bottom-session-bar-renders-nothing-decided-restore-active-state-only); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 6.4 [x] CI runs medium and e2e in parallel; the local gate runs them staged — RESOLVED: keep parallel

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#64-x-ci-runs-medium-and-e2e-in-parallel-the-local-gate-runs-them-staged-resolved-keep-parallel); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 7. Feedback Loop

### 7.1 [ ] [Brainstorm] One-click resolve for pending plan adjustments
Do we allow a 1-click resolve on pending plan-adjustment reminders? Tension: one-tap fits the
low-interaction principle, but plan adjustments are exactly the decisions that deserve deliberate
review at the desk ([uc2](use_cases/uc2_async_plan_adjustments.md)).

### 7.2 [x] Feedback button must show its own state — toggled, and "notes exist" — note mark drawn and tested 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#72-x-feedback-button-must-show-its-own-state--toggled-and-notes-exist--note-mark-drawn-and-tested-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 7.3 [~] [Brainstorm] Session-level "Pending Review" flag, unscheduled sessions, and a shared scrollable-deck component
**Raised 2026-07-27 (Simon).** A bundle of separable proposals; the label rename shipped, and (8) —
the continuous time-ordered timeline that everything else waited on — shipped, see CHANGELOG.

**Settled, not re-litigated**: resolution is per feedback record (the `resolved` flag on a
`planUpdates` entry), so (1)'s roll-up is purely derived and never stores its own bit; and every card
is strictly time-ordered with **unscheduled the one exception**, clustered at the past/active →
future pivot rather than sorted by a date it lacks.

Still open, in the order they should be done:

1. **[ ] Unscheduled cards are directionally sticky.** They must **not** disappear when scrolling
   toward the future (an actionable "needs scheduling" reminder) but **may** scroll away toward the
   past. Plain `position: sticky` pins in both directions, so this needs scroll-direction-aware
   pinning — real interaction code, not styling.
2. **[ ] Client registry → all sessions as a scrollable deck.** "Potentially infinite" must mean
   windowed/virtualized rendering, not unbounded DOM. (No virtualization exists yet anywhere; an open
   call, worth revisiting only if session volumes justify it.)
3. **[ ] Filter chips** (past/active/future/for-review/unscheduled). Depends on the derived
   `needsReview` roll-up and on unscheduled authoring.
4. **[ ] Session-level review flag** — a **derived** `needsReview` roll-up for the
   dashboard/registry; opening the session still shows which items carry which tag.
5. **[~] Unscheduled sessions.** Largely built 2026-08-07 (deleting a session keeps each
   participant's plan as an unscheduled draft, reachable from the feed, addressed by id). **Still
   open**: authoring one directly rather than only rescuing one from a deletion.
6. **[ ] One shared scrollable-deck component.** Extract only the shared part — the virtualized
   scroll/snap container and card shell — and keep interaction logic in the clipboard consumer
   composing on top; clipboard cards carry drag-reorder and edit affordances, registry cards are
   browse-only.

---

## 8. Clipboard Interactions

### 8.1 [x] Bind multiple clients to one shared set of exercises — shipped 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#81-x-bind-multiple-clients-to-one-shared-set-of-exercises-shipped-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 8.3 [x] Inline Clipboard Editor — shipped, see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#83-x-inline-clipboard-editor-shipped-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 8.6 [x] Rests are first-class, focusable plan items — shipped, see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#86-x-rests-are-first-class-focusable-plan-items-shipped-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 8.7 [ ] [Discuss] Should completing a circuit ROUND stop its timer, like completing the block does?
**Raised 2026-08-06 (Simon).** `completeCircuitRound` is asymmetric and the asymmetry was never
decided — it fell out of where the code happened to put the call. On the **final** round the timer is
**frozen** (not cleared: the trainer dismisses it themselves); on any **earlier** round the timer is
left entirely alone. So the same control does or does not touch the timer depending on a number the
trainer is not looking at.

- **For leaving it running**: between rounds, a running rest countdown is exactly what the trainer is
  pacing off. Freezing at round 2 of 4 destroys the thing they started it for.
- **For stopping it**: the round is over — but `focusRef` only records `{type: "circuit", id}`, so
  the app cannot tell "resting between rounds" from "timing this round's work". **That may be the
  real gap**: the decision needs a distinction the data model does not make.
- **Check the gym floor first**: §8.6's first-class rests mean a between-rounds rest can now be a real
  plan item with its own timer, which may make the question moot for well-authored circuits.

No behaviour change until this is settled; the entry exists so the asymmetry is recorded rather than
re-discovered.

### 8.8 [x] Copy the program to another participant — shipped 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#88-x-copy-the-program-to-another-participant-shipped-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 9. Interactive Demo / Guided Onboarding

A first-run onboarding that walks a new user through the app with a simulated finger, instead of
seeding demo data silently. The app already boots empty with an opt-in demo deep-link (shipped). Each
phase below is committable on its own.

### 9.2 [~] Demo-data loader — PARTIAL
`?init=demo_data_load` (parsed in [shareLink.js](src/modules/common/shareLink.js)) seeds the full
fixture, but **only when the app is genuinely empty**, so it never clobbers real records. **Still
open**: narrow it to a focused subset (a few clients, one or two routines, today's sessions, the
in-progress session) and expose it as a callable `loadDemoData()` invoked by the in-app activation in
§9.5, not only by URL.

### 9.3 [x] Selective demo-data removal — shipped 2026-08-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#93-x-selective-demo-data-removal-shipped-2026-08-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 9.4 [x] Simulated finger / touch controller — 2026-08-16

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#94-x-simulated-finger-touch-controller-2026-08-16); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 9.5 [x] Guided walkthrough engine (step overlay) — 2026-08-17

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#95-x-guided-walkthrough-engine-step-overlay-2026-08-17); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 9.6 [ ] [TBD] Install as an offline Android / iOS app
Already a PWA (manifest + service-worker precache). Open: install-prompt/A2HS UX, fully-offline first
load, and whether the GitHub Pages origin is acceptable or a packaged wrapper (TWA / Capacitor / bare
PWA) is needed.

---

## 11. Navigation & Layout Redesign

### 11.1 [ ] Replace the footer nav with a message / status area
Evolve the session-bar contents into a general message area: current/upcoming session, spot
reservations, cancellations, and the "run the demo" invite. Navigation (Clients / Routines /
Exercises / History) needs a new home — proposal: a compact tab row in the omnipresent header. The
feed is priority-ordered: live session → next upcoming → notifications, each tappable to its session.

### 11.2 [ ] Active-session overlay → a normal `#view`
Fold `#active-session-overlay` into a normal `#view-session` inside `#main-content`. Now that the
header is omnipresent and sits above it, the fixed-overlay special-casing is redundant; this
simplifies the deck/tabs/title-bar wiring and unifies router handling.

### 11.3 [x] The ☰ menu is where everything without a home ended up — superseded by §81.2, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#113-x-the--menu-is-where-everything-without-a-home-ended-up--superseded-by-812-closed-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## Audit schedule — every two weeks

Decided 2026-08-18 (Simon: *"I assume it is just better we do an audit every 2 weeks"*). These are the
checks whose findings need **judgement rather than a pass/fail**, so they are deliberately NOT gates: a
build that fails on a judgement call teaches people to silence it, and a rule that fires on every commit
stops being read. Whoever is working runs them on the cadence and records what changed.

| Every two weeks | What to look for | Last done |
| :--- | :--- | :--- |
| **Duplication sweep** | Start with `python -m agent_tools.constant_copies` (§28.3), which answers the mechanical half: every DECLARED constant's literal appears only at its declaration. Then the half no tool can answer — values or blocks that have quietly acquired copies and are not declared anywhere yet, where the question is "should this be declared once?". A general copy-paste detector was considered and rejected: the standard one is an npm package, and this repo vendors Node with **no npm dependency at all** | 2026-08-18 |
| **ZAP suppression review** | Every `IGNORE` in `deploy/zap/zap-baseline.conf` still true, re-derived from the code rather than from its own comment | 2026-08-12 |
| **Timing budget re-measure** | The per-stage budget table against an **idle** machine. Re-measure when a stage moves without tests being added — growth is expected and gets a table update, a jump on a fixed test count is a defect | 2026-08-19 |
| **TODO ranking** | Verify "Where to start" against `src/` before trusting it. It has gone stale twice (08-11, 08-13), both times because shipped work was never closed | 2026-08-17 |

**A tool may graduate out of this table into `build/`** once it has proven value and demand
— write it for yourself, use it on real work, and wire it into
Stage 1 only when it has actually caught something more than once.

---

## 12. Documentation, Tests, OKF & Housekeeping

### 12.3 [~] Test completeness
Themes, the Sync & Backup modal and counters, the header menu, the first-run agreement, the
plan-adjustments deck and wizard, the Client Directory grid and search are all covered. **Still
open**: the demo walkthrough (§9.5) is unbuilt, so it has no tests. Confirm every extracted component
has at least one exercised path.

### 12.4 [x] Capture exceptions and offer semi-automatic bug reporting — 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#124-x-capture-exceptions-and-offer-semi-automatic-bug-reporting-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 12.5 [ ] Local git housekeeping (trademark refs)
The trademark was scrubbed and force-pushed; the remote is clean and no `refs/original/…` or backup
branch remains. The old blobs survive only in reflog entries. **Maintainer action** — it was blocked
from the agent because reflog expiry is irreversible:

```bash
git reflog expire --expire=now --all && git gc --prune=now
```

### 12.6 [x] Vendor Font Awesome locally — the last CDN dependency — done, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#126-x-vendor-font-awesome-locally--the-last-cdn-dependency--done-closed-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 12.7 [x] [CLOSED — measured, do not reopen] ~89 separate module requests on first load

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#127-x-closed-measured-do-not-reopen-89-separate-module-requests-on-first-load); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 12.8 [x] `tests/e2e/` vs `tests/unit/` is a browser split, not a UI split — resolved by `tests/unit_js/`

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#128-x-testse2e-vs-testsunit-is-a-browser-split-not-a-ui-split-resolved-by-testsunit_js); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 13. Exercise Library & Movement Taxonomy

**CLOSED — fully shipped.** See [CHANGELOG.md](CHANGELOG.md) and
[UC6](use_cases/uc6_exercise_taxonomy_and_picker.md).

### 13.1 [x] Repurposed `exercisesView` into a Professional Movement Taxonomy — see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#131-x-repurposed-exercisesview-into-a-professional-movement-taxonomy-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 13.2 [x] Fast-selection flows over the taxonomy — see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#132-x-fast-selection-flows-over-the-taxonomy-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 13.3 [x] Conditioning metrics (modality axis) — see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#133-x-conditioning-metrics-modality-axis-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 14. Refactoring: DRY & Complexity Reduction

> Superseded in scope by **§24**, which re-audited `src/` on 2026-08-07. Only §14.5's i18n half is
> still open; the rest shipped, see CHANGELOG.

### 14.5 [~] Split the monolithic shared files to avoid same-file co-edit conflicts
**`index.css` and `index.html` shipped 2026-07-27** — both are shells now, with every view, dialog,
header and the notification area rendering their own markup from the module that owns them, each with
a co-located `.css`. **Still open**: `src/i18n/en.js` and `sl.js` are flat single-object
dictionaries, so every string lands in the same file. Consider per-feature namespaced string modules
merged into the locale, keeping `test_i18n_parity` green.

### 14.6 [x] Rename the `booking` domain term to `session` — shipped 2026-07-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#146-x-rename-the-booking-domain-term-to-session-shipped-2026-07-27); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 14.7 [x] Extract a shared `renderMarkupOnce()` helper — shipped 2026-08-01, see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#147-x-extract-a-shared-rendermarkuponce-helper-shipped-2026-08-01-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 14.8 [x] Render-order dependencies between modules are unenforced — shipped 2026-08-01, see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#148-x-render-order-dependencies-between-modules-are-unenforced-shipped-2026-08-01-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 14.9 [x] `activeSessionController.js` mixed markup templates into a behavior file — shipped 2026-08-01

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#149-x-activesessioncontrollerjs-mixed-markup-templates-into-a-behavior-file-shipped-2026-08-01); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 16. Deploy safety & schema-keyed storage

> **Multi-version hosting is DROPPED, not deferred** (per §18's *no release tags* decision). One build
> carries every supported behaviour concurrently; storage keys on the **data schema** alone. Do not
> re-propose per-tag publishing, a `/preview/` channel, per-release storage buckets, or
> rollback-by-URL — all considered and dropped together.
>
> **What survives**: a deploy must never interrupt a trainer mid-session (now purely a service-worker
> concern); storage keyed on the schema major (§16.3); the build stamp is the commit SHA, not a tag;
> the PREVIEW badge, generalised into severity tiers by §18.12; migration must validate every step's
> output and refuse data from a newer build.
>
> **Two findings worth not re-learning**: an ordering authority must be a *total* order (same-second
> tags tied under a date sort once offered a PT a downgrade labelled "a new version is available"),
> and changing an already-published build's bytes forces a service-worker re-install on everyone
> sitting on it.

### 16.3 [x] [Resolved — superseded by §18.6] Key storage buckets on the DATA SCHEMA, not the release tag

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#163-x-resolved-superseded-by-186-key-storage-buckets-on-the-data-schema-not-the-release-tag); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 16.5 [x] Retire the multi-version hosting machinery from the code — done

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#165-x-retire-the-multi-version-hosting-machinery-from-the-code-done); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 16.6 [ ] One origin or two: the boundary around LibrePT's data is undecided

**Found 2026-09-28 while answering Simon's question about the backup key.** The app is deployed at
`https://stutek.github.io/LibrePT` ([publicUrls.js](src/data/publicUrls.js)). A browser separates
storage by ORIGIN — scheme, host, port — so the path `/LibrePT` separates nothing. Every other page
ever published on GitHub Pages under this account shares the origin, and therefore shares LibrePT's
IndexedDB, localStorage and cookies.

**Nothing is wrong today**: checked 2026-09-28, `~/Projects/EnterprisePT` is documents only — no HTML,
no code, no git remote, not published. This is about the day a second page goes up there.

**The exposure is the whole database, not the backup key.** A page on that origin can open the
`librept` database and read clients, health notes and session history directly; they are stored in the
clear, and encrypting them is refused for a stated reason (§18.8). It could also USE the backup key —
non-extractable stops it being copied out, not being used — and so open any backup file it obtains.
That is a smaller part of the same hole.

**What has to be true for harm**: a second page on the origin, running hostile code (a bug, an XSS, or
a third-party script it includes), AND the trainer opening it in the browser that holds LibrePT. Not
remote access to every install — but a trainer opening the maintainer's other pages is exactly what a
linked family of projects invites.

**Decide before launch, not after.** Moving origin empties the app for everyone who already has data:
IndexedDB does not travel, so every trainer would have to export on the old address and import on the
new one by hand. The same move also needs Google's allowed JavaScript origins updated
([GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md)) and `PUBLIC_SITE_URL` changed.

**Simon, 2026-09-28: sharing may be WANTED.** If EnterprisePT is to be an extension of LibrePT for
the same trainer, one origin is the simplest way to share — no export, no import, no sync protocol.
That is a legitimate design, and it reframes what is wrong here: not the sharing, but that the sharing
is **accidental**. Nothing states it, nothing checks it, and the next page published there inherits
total access in silence.

**"The domain is mine" is not the guarantee it sounds like.** An origin does not separate by who owns
it. It admits everything ever served from that host, including code not written yet and code written
by somebody else.

**And XSS is possible with one app anyway — true, with two differences.** With one app the exposed
surface is one codebase; with several on one origin an attacker needs a hole in ANY of them and the
access is identical, so a marketing page with a form is a softer way in than the app. More
importantly, XSS is a DEFECT and a co-hosted page is a PERMISSION: a page on the same origin needs no
bug at all to read the database. Defects can be removed; a permission granted to every future page
cannot be undone by care in one codebase.

**A CSP protects the page, not the origin's data.** LibrePT's is strict — `script-src 'self'
https://accounts.google.com`, no CDN, no analytics ([index.html](src/index.html)) — and it does
nothing for LibrePT's records if a neighbour on the same host ships a loose one. A commercial
EnterprisePT will want a payment widget, analytics or a support chat, and each vendor would then read
special-category health data without a single bug. **That is where the two goals collide.**

**The decision, either way, with its condition:**

- **One origin, on purpose.** Everything published there is one security body, held to LibrePT's rules,
  and **no third-party script, anywhere on it, ever.** Written into PRIVACY.md, because the claim that
  nobody but the trainer reaches the data changes shape.
- **Two origins, one domain.** `librept.<domain>` and `enterprise.<domain>` are separate origins while
  the domain stays Simon's; sharing becomes explicit (`postMessage`, or an export handed over) instead
  of ambient. GitHub Pages supports a custom domain per repository.

**No test can hold this.** LibrePT cannot see other pages on its own origin, so this is a rule rather
than a gate — which is exactly why it has to be written down rather than remembered.

**Blocks**: nothing in the code. It blocks the launch plan, because moving origin after trainers have
data means each of them exporting on the old address and importing on the new one by hand.

## 17. Structured session/program history (`sessionItemRecord`)

### 17.1 [~] Persist the whole structured program into history, via a generic typed item record
**Core mechanism shipped** ([sessionItemRecord.js](src/domain/sessionItemRecord.js)): the whole
program snapshots as a flat typed array (`exercise` | `rest`, `circuitId` grouping folded at render),
with rest- and completed-aware readers and a back-compat shape guard.

**Still open**: wiring the **modality** field into the history snapshot itself, routine-builder
(`plansView`) metric authoring to match the inline editor, and `hiit` (rounds), which has no logging
surface yet.

**Dokaz iz dneva trenerja 05 (§88):** krog ob reki s petimi postajami, 40 s dela in 20 s počitka,
štirje krogi, in intervali 6 × 400 m. Čas in razdaljo je trenerka vpisala v polje za ponovitve (»40s«,
»400m«), pregled pa je izpisal »S4 × R40s«, kar stranka ne razume. Merilo po vaji (čas, razdalja) pri
vaji z lastnim imenom ni ponujeno.

**State 2026-09-30 (Claude):** two of the three open items were already done: the history snapshot
carries `modality` and `metric` (`buildExerciseSnapshotItem` in
[sessionItemRecord.js](src/domain/sessionItemRecord.js)), and the routine builder authors each
exercise's own metric ([plansView.js](src/modules/plans/plansView.js)). The day-05 evidence is fixed at
the display (`3caf281`): a time or distance typed where the reps go reads "S4 × 40s", not
"S4 × R40s". **Open, a design question for Simon:** logging for `hiit` (rounds), and whether a movement
with its own name, typed inline, is offered a measure (time, distance) at all.

### 17.2 [ ] Edit rules for a completed, dated session — immutable except three narrow cases
A completed dated session is an **immutable execution record**; anything forward-looking is
copy-to-a-new-session from a template, never an edit of the past. The only permitted mutations:

1. **Field-level correction** of mis-logged data, ideally stamped with an `edited` marker.
2. **Append-only annotation/feedback** at review — an append to the separate feedback layer, so it
   never touches the execution record.
3. **Anonymization** (§17.3) — never deletion.

### 17.3 [x] Erasure = anonymization only (never delete) — shipped 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#173-x-erasure-anonymization-only-never-delete-shipped-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 17.4 [x] Save a past session as a routine template (library fills itself from history) — shipped 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#174-x-save-a-past-session-as-a-routine-template-library-fills-itself-from-history--shipped-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 17.5 [~] Explicit item ordering — `position` on every session item
**Shipped** in [sessionItemOrder.js](src/data/sessionItemOrder.js); rationale (why dense not gapped,
why not a linked list, rejected alternatives) lives in [DATA_MODEL](docs/DATA_MODEL.md). Writers
stamp `position` at the choke point they all funnel through.

**Still open**: nothing consumes `positionIssues()` at runtime (it is a query the tests call, not a
surfaced integrity warning); `activeExerciseIndex` still means an *array index*, which holds only
while the live array stays in position order; and step 4 — the store may stop guaranteeing list
order — gates on §18.6.

---

## 18. Data layer: simultaneous multi-schema writes ("star writes")

> **The architectural change**: the data layer writes every record to all supported schema versions at
> once, so moving between app versions loses nothing in either direction. The old migration was a
> **chain** (v1→v2→v3) whose lossiness compounds and whose each step is tested against the previous
> step's output rather than against reality. Star writes replace it with a **star** — one projection
> per schema, each computed directly from the live domain object, none feeding another. Error cannot
> compound, every projection is independently testable, and there are **no backward transforms**: a
> "downgrade" is just another projection already being written.
>
> **Decided: NO RELEASE TAGS.** One build carries old and new behaviour concurrently; behaviour
> switching is an in-app choice, not navigation. What is supported is a set of **schemas**, the only
> axis storage keys on (§16.3). The surviving justification for writing every live schema is the
> **previously-cached service-worker build** — a PT on yesterday's cached build *is* an older app
> version even with no tags — plus backup portability.
>
> **The build order (DB → write layer → CD tests) is complete.** What remains is narrower and called
> out per section: §17.1's lazy per-client load (§18.6), §18.3's idle deferral and failure reporting,
> §18.7's backups, §18.8's encryption/desktop threat model, §18.9's CAS, §18.11's legal gaps,
> §18.12's ribbon tiers.

### 18.1 [x] [Decided in principle] The star write model, and its relationship to §16.3

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#181-x-decided-in-principle-the-star-write-model-and-its-relationship-to-163); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.2 [x] [Decided, CLOSED] Identity: lineage IDs, no ID-mapping table

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#182-x-decided-closed-identity-lineage-ids-no-id-mapping-table); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.3 [~] [Decided] Migration is pre-emptive, resumable, and runs through the normal write layer
**Shipped 2026-08-07** — [readSchema.js](src/data/readSchema.js), see [CHANGELOG](CHANGELOG.md).
Revisit near ~50k records, where the single transaction it relies on becomes a stall worth splitting
— at which point the design below applies again as written:

- **Pre-emptive**, so a switch is instant and there is no staleness window. Catch-up is a
  **re-derivation**, not a restore from a point in time — which is also why §18.7 rejects a snapshot
  tier.
- **Yields to user writes**: migration breaks on any interaction write and resumes when the burst
  ends. Gym-floor latency steps migration throughput.
- **Ordinary use accelerates migration**: a star write to a not-yet-migrated record populates the new
  bucket and marks it migrated. Safe to interleave in both directions.
- **The invariant that makes the accelerator sound**: migration must be
  `read old record → build domain object → normal star write` — *literally* the write layer, not a
  second transform. Otherwise half a bucket comes from each code path and the drift is undetectable.
- **A partially-migrated bucket must not be readable.** A crash at 40% would otherwise reboot the PT
  into a UI showing 40% of their clients — indistinguishable from catastrophic loss, and the rational
  response (re-entering records) creates real corruption. **Completeness is a set difference over
  ids, not a count comparison**: `complete(target) ⇔ keys(source) \ keys(target) = ∅`. Two counts are
  independent aggregates that tie nothing element-to-element, so one absent source id plus one
  spurious target entry passes the check **over a hole**. **Containment, not equality** — ids the
  target has and the source lacks are legitimate. It is also cheap and it **names the missing ids**.

**Still open**: deferring the backfill to idle/charging so it does not cost battery mid-session; how a
failed background backfill reports itself without alarming a PT who never asked for it (block the
switch offer, do not raise an error); and any **UI** for the switch — `setReadSchema` /
`upgradableSchemas` exist but nothing offers them to a trainer, and `upgradableSchemas()` is empty
until a schema 4 is cut.

### 18.4 [x] [Decided — staging, not envelopes] The lossy-projection problem

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#184-x-decided-staging-not-envelopes-the-lossy-projection-problem); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.5 [x] [Decided] Ordering is topological, not chronological

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#185-x-decided-ordering-is-topological-not-chronological); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.6 [~] [Decided] Persistence engine → IndexedDB (supersedes the §3.7 deferral)
**Engine shipped 2026-08-02** — [CHANGELOG](CHANGELOG.md) carries the engine choice and the
single-database layout constraint that decided it.

**Still open — true lazy per-client loading is deliberately NOT done.** The read model stays
synchronous so ~115 existing `state.<collection>.push(...)` call sites need no change; converting them
to async per-client fetches is separate, larger work. The index it needs
(`CLIENT_COLLECTION_INDEX`) is already built.

**Sizing (measured 2026-07-26 against the real §17.1 record shape — ~6.0 KB per session):**

| | sessions/yr | 1 bucket | ×2 | ×3 |
| --- | --- | --- | --- | --- |
| Busy PT (7/day, 5.5 d/wk) | 1,809 | 10.5 MiB | 21 MiB | 31 MiB |
| **Very busy PT (10/day, 6 d/wk)** | 2,880 | 16.6 MiB | 33 MiB | **50 MiB** |
| Studio ceiling (14/day) | 4,200 | 24.3 MiB | 49 MiB | 73 MiB |
| Very busy PT, 5 yrs (no deletes) | 14,400 | 83 MiB | 166 MiB | **250 MiB** |

Quotas are orders of magnitude clear of that table, so sizing is not the constraint — eviction is:

- **Plan for eviction, not deprecation.** IndexedDB has no deprecation path. The realistic risks are
  Safari's 7-day cap on script-writable storage for non-engaged sites (home-screen install exempts
  you, which the app already promotes), quota-pressure eviction on Android, and private-browsing
  quotas. The recovery tier for all three is §18.7's backup file.

### 18.7 [x] [Decided] Backups: 1× not N×, readers forever, writers never — every part shipped, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#187-x-decided-backups-1-not-n-readers-forever-writers-never--every-part-shipped-closed-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.8 [ ] [Open] Encryption, device theft, and storage durability
- **IndexedDB is not encrypted by the app**; at rest it relies on OS full-disk encryption. A stolen
  *locked phone with a passcode* is genuinely well protected (iOS Data Protection / Android FBE); a
  stolen laptop without FDE is not protected at all. Same-origin scripts, extensions with host
  permissions, and anyone holding the unlocked device read plaintext.
- **Desktop is its own threat model** (Simon, 2026-07-26) and the weak case on every axis: FDE is
  opt-in and often off, extensions are common, the device is shared far more often. It is also where
  the better tools live — the File System Access API can put backups in a real user-chosen file and
  keep a handle for repeat exports.
- **[x] Encrypt the backups, not the live DB — shipped 2026-09-28** (Simon asked for it the same day;
  what shipped is in [CHANGELOG.md](CHANGELOG.md)). The backup is the artifact that travels (Drive,
  e-mail, USB) and is where a leak actually happens; the live store already has the phone's own
  encryption when it is locked; and a forgotten password is survivable because the live database is
  still there. Encrypting the live store risks permanently destroying a solo PT's business records —
  a bigger realistic risk than theft.

  **Three things were decided while building it, none of them in the plan above:**

  - **A recorded decision changed.** §18.7 said the encrypted container would be schema 6 plus a no-op
    5→6 record step. It is instead format version 6 whose row in `BACKUP_FORMATS` names schema 5,
    because the star-write fan-out writes every record to every live schema: a schema 6 identical to
    5 would have doubled every write on disk to record that the container had changed. One envelope
    integer still answers both questions, through the table. The side effect is an improvement —
    `schemaVersion` now sits under the ciphertext, where it cannot be altered.
  - **Drive sync refuses to run without a password**, rather than syncing in the clear and encrypting
    later. Drive keeps earlier versions of a file, so one plaintext upload leaves a readable copy that
    setting a password afterwards does not reach.
  - **The key is derived from a password, never random.** A random key kept only on the phone would
    make every Drive copy unreadable on the day the phone was lost, which is the day a backup exists
    for. The trainer keeps six readable words; the device keeps a non-extractable key derived from
    them and no copy of the words. §81.6's storage question is answered by the same choice and closed.

  **Still open from this bullet:** the WebAuthn `prf` unlock below and the desktop File System Access
  handle. The storage-durability warning exists (checked 2026-09-30):
  [storageDurability.js](src/data/storageDurability.js) asks for persistent storage and measures the
  quota, and [backupHealthController.js](src/controllers/backupHealthController.js) passes the result
  to the backup badge.
- **Biometrics: WebAuthn cannot decrypt.** It is authentication and returns a signature, never key
  material. The real primitive is the **WebAuthn PRF extension**, which derives a stable secret usable
  as an AES-GCM key (Chrome/Edge and Safari passkeys; good but not universal support). Portable
  fallback: passphrase → PBKDF2/Argon2 → AES-GCM.
- **Private browsing: detect the consequence, not the mode.** Mode detection is a heuristic arms race
  browsers actively break. Read `navigator.storage.estimate()`/`persisted()` and warn "storage on this
  device is not durable — export a backup before you finish" — more robust, and it also catches
  low-disk Android and non-installed Safari, which are likelier and equally destructive.

### 18.9 [ ] [Decided] Concurrency: transactions plus CAS, not app-level locks
IndexedDB transactions give atomicity and cross-tab serialization for the fan-out (given §18.6's
single-database layout), so **no app-level lock is needed for it**.

- **The residual is read-modify-write spanning a JS computation.** IDB transactions auto-close when
  the event loop yields — any `await` on a non-IDB promise silently kills the transaction — so
  `read → compute → write` is not atomic by default and two tabs can interleave.
- **Fix is compare-and-swap, not locking**: a version counter on the record, write conditional on it
  being unchanged, retry on mismatch. Lock-free, cross-tab, immune to the transaction-closing gotcha.
- Required properties, complete list: **resumable + acyclic + idempotent + CAS**.
- `navigator.locks` around the *migration pass* is worth ~3 lines so two tabs do not duplicate work —
  efficiency only, since idempotency already makes it safe.

**Presoja 2026-09-30 (Claude): ostanek, ki ga ta razdelek rešuje, ne more več nastati.** Primerjava
različic ob pisanju (CAS) je bila odgovor na dva zavihka, ki med branjem in pisanjem drug drugemu
podtakneta spremembo. §80.40 (`4b17230`) je to rešil drugače: piše le en zavihek naenkrat
([tabOwnership.js](src/data/tabOwnership.js)); zavihek, ki zagon opravi pozneje, prevzame pisanje,
vsi drugi nehajo shranjevati in to povedo. Z enim piscem ni prepletanja, ki bi ga CAS lovil. Zato
ga ne gradim; razdelek naj zapre Simon, ali pa ga ohrani za dan, ko bo pisalo več naprav hkrati
(sinhronizacija), kjer en zavihek ni več edini pisec.

### 18.10 [x] [RESOLVED — one build] Deep links, and one build vs. many builds

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1810-x-resolved-one-build-deep-links-and-one-build-vs-many-builds); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.11 [x] Legal gaps this design creates — every gap answered, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1811-x-legal-gaps-this-design-creates--every-gap-answered-closed-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.12 [ ] [Decided] Reuse the preview badge for unsupported-version warning
Generalise `#preview-badge` into a **build-status ribbon with severity tiers**: `PREVIEW` (amber,
informational) → `DEGRADED` → `BETA` (real data on unstable code) → `UNSUPPORTED` (red,
non-dismissable). `BETA` keeps its slot even with no beta channel: an in-app behaviour opt-in is the
same promise and needs the same signal.

- **`DEGRADED` is the downgrade tier** (§18.4): the app is older than the schema its data was authored
  in, so records display wrong and — the part that matters — **anything logged here may be recorded
  lossily**. Say that plainly rather than implying a read-only display quirk.
- **The ribbon must not be the only signal.** Persistent chrome goes invisible within days, which is
  what makes an always-on amber pill safe today and an unsupported-version warning useless tomorrow.
  Pair it with a non-dismissable notification-area message.
- **Never block mid-session.** The ribbon carries severity continuously, but any *blocking* prompt is
  gated on there being no active session — a red warning plus a modal is maximally alarming exactly
  when a PT has a client in front of them.
- Keep the existing `prefers-reduced-motion` handling; a red flashing element is an accessibility
  problem in a way an amber pulse is not.

### 18.13 [x] CD pipeline tests for the star-write layer — shipped

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1813-x-cd-pipeline-tests-for-the-star-write-layer-shipped); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.14 [x] One numbering axis, and a disposable preview schema — shipped 2026-08-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1814-x-one-numbering-axis-and-a-disposable-preview-schema-shipped-2026-08-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.15 [ ] A hard reload can outrun a queued write

Found 2026-08-18 while landing §18.7's import consent: `tests/e2e/test_signup_round_trip.py` failed under
a parallel run and passed alone, because it accepted a client and then navigated with a FULL page load —
which re-reads IndexedDB before the enqueued write ([writeQueue.js](src/data/writeQueue.js)) has flushed.

The test now waits for the stored row, which is the assertion it wanted anyway ("it survived", not "the
list re-rendered"). **The app-side question is left open deliberately**: the real window is milliseconds
and only on a hard reload or a tab close immediately after a write, so it has never been observed by a
trainer — but there is no flush-on-`pagehide` and nothing that would tell anyone if it bit. Worth deciding
whether the queue should drain on `visibilitychange`, or whether the risk is acceptable and should simply
be written down.

---

### 18.16 [x] Local runs stopped disagreeing with CI about what time it is — 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1816-x-local-runs-stopped-disagreeing-with-ci-about-what-time-it-is-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 19. Deep-linkable app state

**The rule agreed for scope: anything a page reload would change belongs in the URL.** Design,
invariants and the "how to add a route" checklist live in **[docs/ROUTING.md](docs/ROUTING.md)**; the
catalogue of the URLs themselves is [UC5 §4](use_cases/uc5_session_day_deck_and_deep_links.md).

### 19.2 Blocked on the URL-privacy question
Both would mint **new** URLs carrying a client id. `/clients/{id}` and
`/session/{id}/client/{cid}/…` already do, so this is a question of degree, not a new exposure — but
it is unresolved, so these are parked rather than shipped.

- [ ] **Client dialogs** — `/clients/new`, `/clients/{clientId}/edit`.
- [ ] **Workout-setup preselection** — `openEditSessionControlModal` takes four identifiers but the URL
      carries only the session id, so "Plan Program" from a client and "Start Group Session" from a
      routine lose their preselection *and* the planning-mode flag on reload. Would need
      `/session/plan/client/{clientId}` and `/session/new/routine/{routineId}`.

**The question to settle**: whether to commit to an ids-and-enums-only invariant enforced by a test
(no names, emails or free text in a path), and whether client-detail navigation should `replaceState`
so repeated browsing does not accumulate a who-was-viewed list in history. Client records are GDPR
Art. 9 health data ([PRIVACY.md](PRIVACY.md)); the mitigating facts are that ids are opaque and the
database is device-local, so a copied id dereferences to nothing elsewhere.

### 19.3 Undecided — decide per use case
- [ ] **Filter and search state.** Enumerated chips (muscle, equipment, category) are a closed,
      non-personal vocabulary and could be path segments; **free-text search must not be**, since a
      typed client name would land in history, screenshots and shared links. **[x] Separately, needing
      no URL decision: the exercise library showed the whole catalog under a chip that still said
      Chest whenever `renderExercisesList()` was called with no arguments — fixed 2026-08-21, see
      [CHANGELOG](CHANGELOG.md).**
- [ ] **Transient chrome** — the ☰ menu, the session ⋮ menu, the notification drawer, a drag in
      progress. A reload closes them, which is arguably correct; a URL that reopens a menu is noise in
      history and fights the outside-click handlers. Recorded so the decision is explicit.
- [ ] **`#dialog-add-session-exercise` is unreachable UI.** Its only button sits in a
      `display: none !important` container and the clipboard editor destructures `openAddExercise`
      without ever calling it. Not routed, because a route for unreachable UI is dead code. Decide
      whether to restore the affordance or delete the dialog, the button and the opener.
- [ ] **Session sub-state that already survives via the cache** — `expandedPastId`, `circuitRounds`.
      A reload keeps them; putting them in the URL would make them *shareable*, a different and weaker
      argument. Pinned by tests, not routed.

---

## 20. [x] Test tiers: the clipboard, and the `activeSession` contract — COMPLETE

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#20-x-test-tiers-the-clipboard-and-the-activesession-contract-complete); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 20b. Backlog sweep — 2026-08-06
Method note, kept so the next sweep starts from evidence: check a signal's **context, not its count**
(a `grep -c` over multiple files emits `file:count`, which mis-scored several items on the first
pass). Two recorded false positives: `expectedVersion` in
[schemaMigrations.js](src/data/schemaMigrations.js) is *schema* validation, not §18.9's
compare-and-swap; and the `walkthrough` hits are i18n strings for a notification button, not §9.5's
engine.

**The lesson this sweep exists to prevent recurred anyway**: on 2026-08-08 two more items (§6.3 and
§7.3) were found shipped but unticked. **Tick the entry in the commit that closes it.**

## 21. [x] `Page.goto` stalls against the local dev server — ROOT-CAUSED AND FIXED

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#21-x-pagegoto-stalls-against-the-local-dev-server-root-caused-and-fixed); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 22. [x] Two `src` defects found while testing — FIXED

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#22-x-two-src-defects-found-while-testing-fixed); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 23. [Brainstorm] Go-to-market — audiences, channels, and what blocks a launch

Captured 2026-08-06. Nothing here is decided; the point is that promotion is sequenced work with
prerequisites, not a post written on a whim. **The governing fact is
[docs/PREVIEW.md](docs/PREVIEW.md)**: the app tells its own users it can wipe their data. A successful
trainer-facing launch in that state is the worst available outcome — one first impression per person,
spent on a build that will lose their clients' records.

### 23.1 [ ] [Decide] What "winning" means, before any channel is chosen
Every downstream choice hangs on this and it is unresolved. The candidates pull in different
directions: **users** (a roster to learn from), **contributors** (a project surviving one maintainer),
**credibility** (a portfolio artefact), or **a future paid tier** (hosted sync, which reintroduces the
data-processor exposure §1.5 deliberately avoids). Pick one as primary — optimising for all four picks
none.

### 23.2 [ ] Two motions, sequenced — dev audience now, trainers only after PREVIEW comes off
- **Now**: developers expect pre-release software and are not harmed by it. r/selfhosted (angle: no
  backend, no account, data never leaves the browser), r/opensource, r/webdev, r/PWA. **Show HN is a
  one-shot** and should be spent only once §23.5's recording exists. Durable placements step any
  single post: a PR to **awesome-selfhosted**, an **AlternativeTo** listing against Trainerize /
  TrueCoach / My PT Hub / PT Distinction, and **F-Droid** if §9.6 ever lands. Product Hunt is largely
  vanity.
- **Also now, higher value**: recruit 5–15 trainers **as design partners, not users**, by hand. Ten
  trainers who reply are worth more than a thousand stars.
- **Later**: the real trainer-facing launch, only once the PREVIEW badge is gone and sync works.

### 23.3 [ ] Channel ranking for the trainer audience — Reddit is not the top of it
The PT subs skew toward *aspiring* and newly-certified trainers; the person who needs a gym-floor
clipboard has a full roster and is on their feet all day. r/personaltraining is worth entering
eventually, but **via months of helpful comments in the recurring "what software do you use" threads,
never a launch post** — those get removed. Higher-density channels, best first:

1. **Gyms and studios, in person.** One manager reaches 5–20 trainers at once — the best conversion
   per conversation available, and the shipped SL translation makes Slovenia the natural first market.
2. **Facebook groups** — national/local PT groups, online-coaching groups, certification alumni. Where
   working trainers actually ask the software question.
3. **Certification bodies and federations** — EREPS, NASM/ACE/ISSA alumni, Fitnes zveza Slovenije. One
   newsletter mention outreaches any forum post.
4. **PT education providers.** Students cannot afford subscription SaaS; a curriculum yields a cohort
   every year.
5. **Instagram / short-form video** — the profession's own platform. Not a link drop: 15 seconds of
   one-handed set logging, native to both the format and the audience.
6. **LinkedIn** — reaches the gym-owner tier, i.e. the buyers for (1).

### 23.4 [ ] Positioning — "open source" is the proof, not the pitch
Trainers do not buy licences. The claims that land, each already true: **free, no subscription** (the
entire competitive set is $20–100/month); **no signup, no account**; **works with no signal** (basement
gyms kill every cloud app); **client data never leaves your phone** (EU trainers legally hold health
data, so this is a compliance answer, not a mood). And **narrow the wedge**: do not pitch "replace your
PT software" — switching costs are brutal and they already have a system. Pitch the **clipboard**, the
one job they all hate, and expand from there.

### 23.5 [ ] Launch prerequisites — these block promotion more than channel choice does
- [~] **A scripted demo instead of a recording — built 2026-08-16.** `?init=demo_data_load&demo=gym_floor`
      plays a tour that drives the REAL controls with a visible pointer: open the group session,
      focus a circuit, signal Too Easy, switch participant. Four taps, no typing, no menus —
      §23.4's wedge, not a feature tour.

      **Why not the recording this asked for.** A video goes stale the first time a control moves
      and nothing tells you; the asset keeps playing, showing an app that no longer exists, to
      exactly the people being asked to trust it. The same script runs in
      [tests/e2e/test_demo_tour.py](tests/e2e/test_demo_tour.py), so a change that breaks the demo
      turns the build red instead of the marketing quietly wrong. It is also live, localised, and
      always current — a visitor can watch the real app rather than a picture of it.

      **Every step carries an expectation**, enforced by `validateTour`: a step that cannot fail is
      a recording again, and a tour of such steps would keep "succeeding" against a broken app.
      Writing it caught three real things on the first runs — the seeded session leads with a
      circuit, the first session card is a one-client session with no second participant to switch
      to, and switching participant correctly re-renders the deck.

      **[x] The video exists too**, and is not authored:
      [`demo_recording.py`](agent_tools/demo_recording.py) points a camera at the same script and
      writes a phone-sized `.webm`. Re-shooting after a UI change is running the command again, and
      it **refuses to write a file when the tour fails** — a recorder that saved one regardless
      would give back the stale, confident-looking asset a script was chosen to avoid, only now
      showing a broken app. Two defects on the first takes both had a clean exit code and are pinned
      in its comments: the first-run Terms modal covering the demo (the recorder skipped what
      conftest applies to every browser test), and grey letterboxing from filming a 1280x720 window
      around a 390x844 page. Check footage by eye, not by return value.
- [x] **A landing page — 2026-08-16.** [docs/LANDING.md](docs/LANDING.md) → `src/landing.html`
      through the same gated render as the privacy and consent pages, so it ships offline, lives on
      a domain we own, and cannot drift from its source. One screen: what it is, **two** demo links
      (watch it drive itself, or drive it yourself), why a trainer would care, and add-to-home-screen
      for both platforms. It leads with the preview warning rather than burying it —
      [PREVIEW.md](docs/PREVIEW.md) is the reason nothing here is promoted yet, so a landing page
      that hid it would be the dishonest version of the same problem.
- [ ] **Share only the demo deep-link, never the bare URL.** `?init=demo_data_load&lang=…&theme=…` is
      an unfair advantage no competitor can match — comment to working clipboard in three seconds, no
      email gate. It also papers over the missing onboarding below.
- [ ] **One headline README feature is still not shippable.** Google Calendar is no longer claimed:
      README says LibrePT does not connect to it and that calendar sync belongs to PRO (§68.3); its
      last trace, a `google-calendar-sync` tag in the README's frontmatter, was removed 2026-09-30.
      Drive sync is now live (§3.3, client id installed 2026-08-12) but reaches only the ≤100
      explicitly-listed test users until the OAuth app is published, so the pitch can promise it only
      with that caveat — or wait for Production-unverified, which drops the list and keeps the cap.
- [x] **Onboarding for an empty app — 2026-08-17.** §9.5's guided walkthrough shipped, reached from the
      splash a first-run trainer is already looking at. The blank-client-list churn this named is now
      answered by a route that carries the sample gym with it.
- [x] **No feedback route a non-developer will use.** Shipped 2026-08-22 (§23.5). GitHub issues is a wall to a PT; one email
      address or form, linked in-app. See [docs/BUG_REPORTING.md](docs/BUG_REPORTING.md).

### 23.6 [ ] Campaign plan — kept private, not in this repo
The concrete Slovenia-first campaign (target list, outreach scripts, timing, named institutions and
gyms) lives outside version control at `.private/go-to-market-campaign.md`. It names specific gyms and
contacts, quotes draft outreach copy, and is candid about the reputational risk of promoting a preview
build — none of which belongs in a public repository. What stays public is §23.1–§23.5. When acting on
the campaign, read the private file; when changing the *strategy*, update both so they do not drift.

**The one deadline worth recording**: §23.5's recording and landing page gate every outreach channel,
and the highest-leverage target (a sport-science faculty, whose academic year starts in autumn) is only
reachable in a late-August-to-mid-September window. Missing it slips that channel by a full semester.

---

## 24. Single-responsibility & module-boundary reorganisation

Audit dated **2026-08-07** over `src/` (25,508 lines, 100 modules). The tree is mostly healthy —
median module ~130 lines — so this was never a rewrite, just five oversized modules and four boundary
defects. **Stages 1, 2, 3, 6 and 8's header work are done; 4 is done bar a follow-up; 5 and 7 have
open halves that are deliberately low priority.**

`activeSessionController.js` 1,668 → 1,169 · `clipboardEditor.js` 896 → 808 · `notificationArea.js`
498 → 402. `src/domain/` is 12 modules / 1,500 lines with a `unit_js` suite each — 74 assertions that
previously needed a browser, or did not exist.

**The findings worth keeping even if you skip the rest:**

- **A gate blocking an import is sometimes evidence the *callee* is in the wrong layer.**
  `import_layers.py` correctly forbids `modules/common/` → `controllers/`, and the response at the
  time was to copy the whole theme system into the header rather than notice that a theme service is
  not a controller. **A gate cannot see a copy-paste.** When an import is refused, check the layering
  before duplicating.
- **Extract what becomes *testable* or *shared*, not what merely makes a file shorter.** Two stages
  were deliberately narrowed on exactly this test: the focus↔URL sync, the schedule-adjust apply and
  the session wiring all stayed in the controller, because each is orchestration whose every
  dependency is already there. Moving them would have been motion.
- **Three defects surfaced that the audit did not predict**, each invisible to review and none what
  the stage set out to change: a fabricated session end date that proposed a seven-hour-forty
  reschedule, a focus reference the timer spelled wrong for standalone rests, and a "mark all read"
  that rebuilt the notification id list by hand and so could not mark a kind it did not know about.
  That is the argument for extracting pure logic even from a file that "works fine".
- **A suite that passes all afternoon is not the same as a suite that passes.** The end-date bug was
  invisible because the demo seed clamps its hours to 03..17, so e2e only caught it after 18:00.
  Time-of-day-dependent coverage belongs in `unit_js/`, where the clock is an argument.

### 24.1 [x] Stage 1 — one theme system, not two — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#241-x-stage-1-one-theme-system-not-two-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.2 [x] Stage 2 — two `formatDuration`, two `escapeHTML` — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#242-x-stage-2-two-formatduration-two-escapehtml-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.3 [x] Stage 3 — the board render leaves `controllers/` — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#243-x-stage-3-the-board-render-leaves-controllers-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.4 [x] Stage 4 — split the rest of `activeSessionController.js` — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#244-x-stage-4-split-the-rest-of-activesessioncontrollerjs-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.4d [ ] Follow-up: one movement → plan item mapping
The projection "catalog movement → plan item fields" is written in **four** places. They agree on the
fields but not on `exerciseId`: only the inject/swap pair sets it, which is exactly why
`resolveCurrentMovementId` needs a name-based fallback for plans authored before slots carried one.
Consolidating into one `planItemFromCatalogEntry()` would let the routine path carry `exerciseId` too
and retire that fallback — but that changes what the catalog picker excludes for routine-authored
slots, so it is a **behaviour change** wanting its own commit rather than riding along with a move.

**Dve kopiji odpravljeni 2026-09-29 (`7abeb08`, §89):** demo tabla v `sessionsView.js` gradi načrt
z `buildClientStateFromRoutine` (njena kopija je izgubila polje `pattern`), prazna nova vaja pa
nastane le v `blankExercise` namesto na treh mestih. **Še odprto:** `exerciseId` na poti iz rutine,
sprememba vedenja, opisana zgoraj.

### 24.5 [~] Stage 5 — `clipboardEditor.js`'s 710-line function
`renderClipboardEditor()` holds a template layer, 11 wiring closures, a drag reorder engine and
circuit normalisation in one scope.

- **`domain/circuitGrouping.js` — shipped 2026-08-07**, see [CHANGELOG](CHANGELOG.md).
- [ ] **`clipboardEditorMarkup.js`** — pure `(item, ctx) → HTML` row/circuit/insert-bar builders.
- [ ] **`listReorder.js`** — a generic tap-nudge/drag reorder engine, not editor-specific.

### 24.6 [x] Stage 6 — `src/domain/`, a layer for what is neither storage nor UI — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#246-x-stage-6-srcdomain-a-layer-for-what-is-neither-storage-nor-ui-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.7 [~] Stage 7 — three more multi-responsibility modules
- [ ] **`applicationHeader.js` (512)** → header shell + menu (~250) once `renderSyncBadge` moves beside
      `driveSyncUi.js` and the about/terms dialogs move to `legalDialogs.js`.
- **`editSessionControl.js` — commit half shipped 2026-08-07** (`domain/sessionRecord.js`). Two rules
  now pinned that would otherwise cost a trainer data: the upsert **MERGES** (a stored session carries
  `completed`/`duration` this form never edits, so a wholesale replace would silently un-complete a
  session by editing its title), and invites go only to **newly** assigned participants.
  **Still open**: the draft-persistence and form-population halves.
- **`notificationArea.js` — derivation half shipped 2026-08-07** (`domain/notificationItems.js`).
  **Still open**: `notificationReadState.js` (the module reaches into `storageNamespace` directly from
  a UI module) and the gesture block.

### 24.8 [~] Stage 8 — names that match what the tree holds
- [ ] **The directory rename, still open and still optional.** Three session directories, none named
      for its lifecycle stage: `modules/session/` (setup/edit/dialogs), `modules/sessionList/`
      (dashboard), `modules/clipboard/` (the live run) — "clipboard" is domain slang the tree should
      not need a glossary for. Rename to `sessionPlanning/` / `sessionDashboard/` / `sessionLive/` as
      ONE mechanical commit. Two files are filed against their consumer and should move regardless:
      `session/sessionTitleBar.js` renders the live overlay's title, and `session/sessionBar.js` is
      consumed by `sessionList/sessionsView.js`.
- **Module headers — shipped 2026-08-07**, gated by
  [agent_tools/module_headers.py](agent_tools/module_headers.py); see [CHANGELOG](CHANGELOG.md).

**Not a problem, deliberately left alone**: `src/index.css` (773) is a genuine design system;
`src/data/exercises.js` and the i18n dictionaries are flat data. Size alone is not a defect.

---

## 25. [x] Layout overflow: assert geometry, not just semantics

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#25-x-layout-overflow-assert-geometry-not-just-semantics); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 26. [Brainstorm] Client self-onboarding — an intake page the client fills on their own phone

The trainer hands over a QR or a link; the client enters their own details and signs consent on
their own device; the record comes back for the trainer to review and save. Today every client
record is typed by the trainer, at the desk, from something the client said — which is both the
slowest part of taking on a client and the least accurate.

**There is no backend, so the return path is the design problem, not the form.** Everything below
follows from that one fact.

**History, because it is the whole of this section's status**: written 2026-08-11, pruned the same
evening, restored 2026-08-13. It was pruned on one objection — a self-onboarding page is a *new
intake surface*, and §27 had just found the app could neither erase a client nor export one client's
data, so it would have collected more personal data, from more people, faster, with no way to hand it
back. **That objection is discharged**: §27.1, §27.2, §27.3 and §27.5 all shipped on the evening of
08-11. Nothing now blocks this section — it is unranked because it is a feature competing on merit,
not because it is gated.

**Pairs with §27.4**, the one data-subject right still open. Both are about the client's own device
holding their own decision: §26.6 captures consent there, §27.4 withdraws it from there, and both
reuse [consentForm.js](src/modules/common/consentForm.js)'s delivery. §27.4 is far smaller and should
go first regardless.

### 26.1 One app, one route — not a second PWA
**Decided**: `#/intake` inside the same build. A second PWA means a second service worker, CSP,
deploy target and test tier for what is ~200 lines of form; the client simply never installs the one
that exists. The constraint this buys is worth stating: intake must render on a **stock, cold
browser** — no IndexedDB write, no demo seed, no service-worker dependency, no boot of the trainer's
app state. It is the only route in the app that is stateless by design, and a medium test should
pin that rather than trusting it.

### 26.2 [Superseded 2026-08-17] The payload, and why it lives in the fragment

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#262-superseded-2026-08-17-the-payload-and-why-it-lives-in-the-fragment); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 26.3 Return path — share first, mail/SMS second, QR third
1. **`navigator.share()`** — one tap surfaces every channel the phone has (WhatsApp, Viber, Signal,
   mail, AirDrop) with no trainer address baked in at authoring time.
2. **`mailto:` / `sms:`** — reuse the shape and the hard-won iOS `?&body=` quirk already encoded in
   [consentForm.js](src/modules/common/consentForm.js); the trainer's address rides in the outbound
   QR as `#/intake?to=…`. Email's real advantage is that it leaves the trainer a **durable copy in
   an inbox**, which is worth something as consent evidence. Some phones have no mail client
   configured, so it is never the only button.
3. **QR shown on the client's screen, decoded by the trainer's NATIVE camera app.** Both iOS and
   Android decode a QR from the stock camera and offer to open the URL, which launches LibrePT with
   the payload — so this needs an **encoder only, on the client side only**: no `getUserMedia`, no
   `BarcodeDetector` (absent on iOS Safari), no camera permission in our app. ~250–400 characters is
   QR byte-mode version ~10–13 of 40, which scans off a phone screen at arm's length. This is the
   only path that works with **no network and no messaging app** — the basement gym, or the client
   who would rather not hand their trainer a phone number. Cost is one vendored ~10–15KB pure-JS
   encoder, pinned and checksummed the way Node and Biome already are
   — no npm, so nothing a JS-side dependency audit would need to cover.

**[x] Step 2 built 2026-09-11 — the saved file is pre-addressed.** Saving the file used to end with
*share it with your trainer*, leaving a stranger to find an address this page already knew. Now, when
the link carried one, the page offers a `mailto:` with the address, a subject and a sentence already
in it ([intakeView.js](src/modules/intake/intakeView.js)); the client attaches the file they just
saved, because no `mailto:` can carry one. **Revealed after the save, never before** — an email sent
with nothing attached is worse than typing the address by hand — and never for the share route, which
has already delivered the file, nor as a text, which cannot hold one. The sketch above wanted a
separate `?to=`; the address that arrived in `#from=` does both jobs, so there is one value and not
two to keep in step. The MESSAGE holds no instruction to the client: that is on the page, where the
person who has to act on it is looking.

**[x] The trainer's own contact reaches the client — 2026-09-11.** Asked: *"the client does not even
know the trainer's number when the invitation arrives"*. True in more cases than the signature covers —
an invitation sent by email, a forwarded one, or a share sheet that keeps the link and drops the text.
So the intake page, which is the one surface every route lands on, now carries the contact itself: the
trainer's e-mail rides in the fragment beside the name and number
([intakeSender.js](src/domain/intakeSender.js)), both are shown as **tappable lines** rather than words
inside a sentence, and **Save this contact** builds an RFC 6350 vCard on the client's own device
([trainerVcard.js](src/data/trainerVcard.js)). Nothing is fetched and nothing is sent. A link written
before the address travelled still reads. Offered only when the link named the trainer: `FN` is
mandatory, and a card named by a phone number is an address-book entry nobody can find again.

### 26.4 The trainer's own QR has to be drawn, not printed
It was to encode a **static** URL — a pre-rendered SVG in `assets/`, printable, stickable on the gym
wall, one file per language variant, and no runtime encoder on the trainer's side in either phase.

**[x] Built 2026-09-11 as a code the trainer's phone DRAWS. Revised first, and the reason is
§26.3's own signature.** A static file is the same for
every install, so it cannot carry `#from=` — the name, number and address that let the client check
who sent them and save the contact. A wall QR therefore identifies nobody, which is the state the
page was deliberately moved out of on 2026-08-23. Wanted instead (asked 2026-09-11): the trainer's
phone **draws the QR on screen and shows it to the client**, as the alternative to typing a number or
an address into the invite dialog at all. That needs the vendored encoder of §26.3 step 3 on the
TRAINER's side, which Phase 2 was already going to pay for on the client's side; the printed leaflet
stays possible as the version that names nobody.

**What shipped.** The invite dialog draws the invitation as a code on the trainer's own screen,
under the two send buttons ([intakeInviteDialog.js](src/modules/clients/intakeInviteDialog.js)). It
carries the same `#from=` every other route carries, so the client sees who it is from and can save
the contact. The
encoder is vendored ([vendor/qrcode.js](src/vendor/qrcode.js), MIT, checksummed against upstream),
and the app builds only the geometry ([qrCode.js](src/modules/common/qrCode.js)) — a library that
returns markup would be markup built from a string, which this app does not do. Black on white
whatever the theme, because it is a picture for somebody else's camera. **Drawn the moment the dialog
opens** (asked 2026-09-11): it sat behind a *Show a code* button for one afternoon, guarding against a
code left up from the last invitation — a guard that protected nothing, since the code carries the
trainer and names no client, so it is the same code for everybody. Redrawn on each open, because the
name, number, address and language it carries are all settings.

### 26.5 [x] Import is a review, never an auto-save — 2026-08-17

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#265-x-import-is-a-review-never-an-auto-save-2026-08-17); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 26.6 Consent is the actual prize, and it does not overturn §3.5
Paper stays the evidence — the 2026-07-22 decision holds. But a client ticking the box on **their
own device** produces a materially better record than a trainer typing a date afterwards: the date
is genuinely theirs, the language is the one they read (`en`/`sl` already exist in
[src/i18n/consent/](src/i18n/consent/)), and `CONSENT_FORM_VERSION` is stamped at the moment they
were shown *that* version rather than whichever is current at save time.

**Open**: whether a checkbox on the client's own phone counts as retained evidence at all, or is
only a better-attested claim about the paper. `PRIVACY_FOR_TRAINERS.md` needs a paragraph either
way, and §3.5's still-open translation gap applies here twice over — this is the first surface a
client reads unaccompanied.

### 26.7 Phasing
- [~] **Phase 0 — what a submission IS, 2026-08-17.** [clientSignup.js](src/data/clientSignup.js):
      identity + contact + the consent stamp, built and parsed in one place, with the register match
      that stops a second Jane Doe being minted. Deliberately **transport-free** — it is the half of
      this section that both live designs share, so it could ship while §1.7's two open questions
      (below) are still open. Health fields are **excluded for now**, since shipping them and
      retracting them is not reversible while adding them later is.
- [~] **Phase 1 — both rulings landed 2026-08-17; the client's half is built.** Shared file (§1.7)
      rather than a link, so §26.2's codec is retired unbuilt; goals and injuries collected at the
      client's discretion. Done: the record, the file artifact, share/save delivery, and the `/intake`
      page itself — [intakeView.js](src/modules/intake/intakeView.js) behind its own boot step
      (`appBoot.bootIntake`), which is what makes §26.1's stateless promise structural rather than
      disciplinary. **Left: the trainer-side import-review dialog with dedupe** (§26.5). Still **no new
      dependency and no CSP change** — `connect-src` untouched, it is all local.

      **A separate boot, not a flag through the normal one.** Every step of the trainer's boot writes
      something or asks something — state load, seed, service worker, terms modal, splash hold, and
      `initTheme`, which persists the resolved theme. Threading "unless this is a client" through all
      of them would work until the day one was missed, and the failure would be a stranger's phone
      holding a LibrePT database or a terms modal in front of the form. Pinned at both tiers:
      [test_intake_form.py](tests/medium/test_intake_form.py) mounts the boot step and asserts nothing
      is written; [test_intake.py](tests/e2e/test_intake.py) navigates for real and asserts the boot
      DECISION, which the medium tier cannot see.

      **Found by writing the test first**: the send button set `hidden` and stayed on screen, because
      every `.btn` in this app sets `display: flex`, which beats the UA stylesheet's `[hidden]` rule —
      so a desktop visitor would have been offered a file share their browser cannot do. It uses the
      `.hidden` class now.

- [x] **Phase 1 COMPLETE — 2026-08-17.** The review dialog (§26.5) closed the loop, and
      [UC8](use_cases/uc8_client_self_onboarding.md) documents the whole flow with spec↔test
      traceability. End to end, proven in one e2e test: a stranger fills in `/intake`, shares the file,
      and the trainer accepts them into the register without typing anything.
- [~] **Phase 2 — the trainer's half built 2026-09-11.** The vendored encoder and the code on the
      TRAINER's screen shipped (§26.4); the static leaflet asset is dropped rather than deferred,
      since a printed file names nobody. **Left: the code on the CLIENT's screen** — the return path
      for a phone with no messaging app and no signal, which is §26.3 step 3 and lands on the same
      review dialog. Worth deferring until the messaging handoff has actually been tried in a gym.
- [x] **Tests — done 2026-08-17.** `tests/unit_js/` for the record, the file artifact and delivery
      (the "codec round-trip" became file round-trip, since the transport is a file);
      `tests/medium/` for the intake form mounted cold and for the review dialog; `tests/e2e/` for the
      full intake → file → review → saved-client loop, plus the boot decision. UC8 and its
      [INDEX](use_cases/INDEX.md) row shipped with it.

### 26.8 Known gaps
- **First load needs network.** The client's phone has never cached the app, and the basement gym is
  exactly where it will not be able to. The trainer's device is no help — it is the wrong device.
  Either a printed fallback, or accept that intake happens at the desk and not on the floor.
- **The payload has no authenticity, deliberately.** Signing would need a key exchange, which needs
  the server this project does not have. §26.5's review dialog is the mitigation, and it is enough
  because the stakes are one reviewable record.
- **Real-world URL length is untested.** Chat clients wrap, truncate and sometimes re-render long
  links; measure an actual payload through WhatsApp, Viber and SMS before committing to share-as-url
  over share-as-text.
- **No photo or avatar.** Out of scope — derive initials the way the seed data in
  [clients.js](src/data/clients.js) does.

---

## 27. Data-subject rights the app documents but cannot perform

[PRIVACY_FOR_TRAINERS.md §5](docs/PRIVACY_FOR_TRAINERS.md) tabulates four data-subject rights against
"what to do in LibrePT". Two of the four had no code behind them when this section was filed at 20:10
on 2026-08-11 — no way to delete a client, no way to export one client's data. The document was not
wrong about the law; it was wrong about the app, which is worse, because it is written for trainers
who will rely on it while answering a request under a one-month deadline.

**All of that shipped 44 minutes later, in the same evening** (see [CHANGELOG](CHANGELOG.md)) — and
then sat here marked open until 2026-08-13, still ranked second in *Where to start*, because nobody
came back to the file. Two sessions began by reading it and nearly rebuilt an export that already
existed. **Only §27.4 is still open.** The lesson is the one this repo already states for suppression
comments: a note about work is only as good as the pass that re-reads it, so a section that ships
gets closed *in the shipping change*, not later.

§26 is the reason this section exists: it was written first, and reading the trainer doc against
`src/` while sizing its consent step is what surfaced these gaps. It was then pruned *because* of
them, and restored on 08-13 once this section closed — the sequencing objection it carried is
discharged by §27.1 and §27.2 having shipped.

### 27.1 [x] Erasure (Art. 17) — shipped 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#271-x-erasure-art-17-shipped-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.2 [x] Access & portability (Art. 15, 20) — shipped 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#272-x-access-portability-art-15-20-shipped-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.3 [x] Erasure does not reach the copies — closed 2026-08-11 by the register

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#273-x-erasure-does-not-reach-the-copies-closed-2026-08-11-by-the-register); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.4 [x] Withdrawal as easy as consent (Art. 7(3)) — 2026-08-14

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#274-x-withdrawal-as-easy-as-consent-art-73-2026-08-14); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.7 [x] Record a withdrawal instead of erasing the consent — 2026-08-14

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#277-x-record-a-withdrawal-instead-of-erasing-the-consent-2026-08-14); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.5 [x] The doc describes what a trainer can actually do — 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#275-x-the-doc-describes-what-a-trainer-can-actually-do-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 27.6 What this architecture already gets for free
**Identity verification** (Art. 12(6)) is trivial here — the trainer knows the client by face, with
no account, no recovery flow and no impersonation vector, where a SaaS has to build for it. And with
data never leaving the device (the trainer's own Drive aside), there is no processor relationship to
paper.

The asymmetry is the point, and the 08-11 build proved the prediction: **this architecture makes
verification easy and erasure hard**, the exact inverse of a hosted product. Erasure took a
derived-pseudonym scheme, a same-name safeguard, a register applied at import and an itemised
receipt of what it cannot reach — where a hosted product would have written one `DELETE`. Weight
future compliance work the same way.

---

## 28. Reported 2026-08-18 — bugs and changes, unverified

Captured verbatim from the maintainer and **deliberately not investigated**: recorded at the end of a
long session so a clean one can pick them up with fresh context. Each is as-reported, so the first job
on any of them is to reproduce it, not to trust this description. Section numbers below are for
reference only and imply no ordering.

### 28.1 [x] Comments and docstrings must name a constant, not repeat its value — 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#281-x-comments-and-docstrings-must-name-a-constant-not-repeat-its-value-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.2 [~] Documentation is BUILT, with values injected

**Wanted 2026-08-18 (Simon).** Docs hardcoded the domain and other constants in prose. They should be
built the way `src/landing.html` already is ([render_docs.py](agent_tools/render_docs.py)) —
placeholders in the Markdown, values injected at build time from the same declarations the app reads —
and published to GitHub Pages.

**Shipped 2026-08-18**: the injection itself. `render_docs.py` resolves `{{PUBLIC_SITE_URL}}`,
`{{ISSUE_TRACKER_URL}}` and `{{DEV_SERVER_URL}}` before rendering, and all eight generated pages now
carry placeholders in their sources — the renders are byte-identical, which is what proves the
substitution is faithful. `REPO_BLOB_URL` is derived from the tracker's declaration rather than
written out. Of the two options in the original note, the injection **reads the JS declaration
directly**: a shared manifest needs a new file and a second thing to keep in step, and earns its place
only if a value ever has to reach somewhere that cannot parse `publicUrls.js` (a GitHub Action, say).

**Still open, and it is the maintainer's call**: which contributor-facing docs get built.
`README.md`, `CONTRIBUTING.md` and `docs/GOOGLE_CLOUD_SETUP.md` are read raw on GitHub, so a
placeholder in them renders as `{{PUBLIC_SITE_URL}}` to every reader — building them means generating
the repository's own front page from a source file, which changes how everyone edits it. Until that is
decided their addresses stay written out, and `constant_copies` lists them.

### 28.3 [x] A declared constant must appear in exactly one place — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#283-x-a-declared-constant-must-appear-in-exactly-one-place-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.4 [x] BUG — a collapsed deck card's first line is unreadable — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#284-x-bug-a-collapsed-deck-cards-first-line-is-unreadable-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.5 [x] BUG — backup warnings appear in DEMO mode — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#285-x-bug-backup-warnings-appear-in-demo-mode-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.6 [x] BUG — loading demo data increments the ahead counter — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#286-x-bug-loading-demo-data-increments-the-ahead-counter-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.7 [x] BUG — the header menu does not work while the messages pane is expanded — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#287-x-bug-the-header-menu-does-not-work-while-the-messages-pane-is-expanded-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.8 [x] BUG — the disabled-backup strikethrough is not visible enough — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#288-x-bug-the-disabled-backup-strikethrough-is-not-visible-enough-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.9 [x] CHANGE — a DEMO tag replaces the PREVIEW tag in demo mode — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#289-x-change-a-demo-tag-replaces-the-preview-tag-in-demo-mode-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.10 [x] CHANGE — cancellations and bookings accumulate in one message card — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2810-x-change-cancellations-and-bookings-accumulate-in-one-message-card-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.11 [x] BUG — a cleared browser boots to a splash with no demo or animation offer — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2811-x-bug-a-cleared-browser-boots-to-a-splash-with-no-demo-or-animation-offer-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.12 [x] CHANGE — the guided walkthrough wants a glow, instructions and a real hand — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2812-x-change-the-guided-walkthrough-wants-a-glow-instructions-and-a-real-hand-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.13 [x] BUG — a walkthrough reloaded by deep link points at the wrong element — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2813-x-bug-a-walkthrough-reloaded-by-deep-link-points-at-the-wrong-element-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.14 [x] CHANGE — the demo-mode message offers to start the walkthrough — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2814-x-change-the-demo-mode-message-offers-to-start-the-walkthrough-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.15 [x] BUG — the walkthrough panel covers the control it points at — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2815-x-bug-the-walkthrough-panel-covers-the-control-it-points-at-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 29. Easy program import — the trainer writes the plan in an external tool

**Wanted 2026-08-18 (Simon):** *"easy program import (use case using external tools to create the
program)"*, with the shape decided the same day (below). Not started; specced.

**The case.** A trainer plans in something other than LibrePT — an LLM, a spreadsheet, a PDF a
federation published, a plan a colleague sent — and today the only way in is retyping it into the
routine builder. That is the largest block of typing the app still asks for, and §23.4's positioning
argues the same way about authoring as about the gym floor: the app's advantage is not the desk.

### 29.1 Decided 2026-08-18 (Simon)

- **A movement the catalog does not have is ALLOWED**, not refused and not silently normalised. It
  carries **a small tag marking it as having no official taxonomy backing** — so a trainer can see at
  a glance which movements in a plan are standard and which came in with it.
  - Recommended glyph `fa-pencil` ("hand-written"), with the word **CUSTOM** beside it, since
    Meaning may never live only in an icon — this app is used on a phone, where a tooltip is unreachable. `fa-asterisk`,
    `fa-puzzle-piece`, `fa-user-pen`, `fa-wand-magic-sparkles` and `fa-tag` all ship too, if the
    reading should be "with a caveat" rather than "yours". Not a decision — the maintainer asked
    whether a glyph exists, and the answer is that several do.
  - This does NOT retire §13's taxonomy work: the tag is what keeps a custom movement visibly
    distinct instead of quietly becoming the fortieth spelling of "Bench Press".
- **The import surface carries four inputs, every one of them optional**:
  - a **client picker** — the client's permanent id, displayed as their name;
  - a **session picker**;
  - a **text area to paste into**;
  - a **read from file** button.
- **The result is the session EDIT view, prepopulated** — the same editor used during a session, not
  a bespoke review screen. That is the decision that makes the rest cheap (see §29.2).
- **A downloadable TEMPLATE of the format**, so a trainer has a working example to follow rather than
  a schema to interpret. Generated from `programImport.js` and parsed by a test: an example that
  stopped being readable would be the app handing out a demonstration of how to fail.
- **Every parsing failure is shown BEFORE the editor opens** — all of them, not the first. A trainer
  who lands in an editor and only then notices three blank rows has been handed a puzzle; one told
  "3 of 12 lines could not be read, here they are" can fix the paste, or go in knowing exactly what
  to repair. Each failure carries its position and its raw text, so the report points at a line.

### 29.2 Why the editor-as-review makes ingestion robust

The maintainer's open question: *"How do we make the data ingestion not fragile, that I don't know"*.
The answer starts with the decision already made — **the import lands in an editor, not in the
database** — which turns "parse correctly" into "parse usefully": a wrong guess is a field the
trainer retypes, not a corrupted record. On top of that, in order of what it buys:

1. **Ship the prompt; do not guess the format.** Most variance is at the source. A copyable prompt
   specifying the exact shape, including a `"format": "librept.program/1"` marker, means a paste
   either announces itself or is rejected with a useful message rather than half-understood. The
   marker is also how "not our JSON" is told apart from "our JSON, one field wrong". No API key, no
   integration, no egress — it works with whichever assistant the trainer already has.
2. **Liberal at the edges, strict at the centre.** Strip markdown fences, accept an object or a bare
   array, accept a NAMED alias per field (`reps`/`repetitions`, `weight`/`load`/`kg`,
   `sets`/`series`), coerce `"3x10"` and `"3 × 10"`. Every alias is an explicit table entry with a
   test — never a generic fuzzy matcher, which fails unpredictably and cannot be reasoned about
   (verbosity over a clever mechanism).
3. **Per-item parsing, never all-or-nothing.** Item 7 being unreadable must not lose items 1–6; an
   unparsed line survives into the editor carrying its raw text, so the trainer fixes one row rather
   than starting over. This is the whole difference between fragile and merely annoying.
4. **A frozen corpus — the real answer.** Exactly the pattern
   [frozenBackupCorpus.test.mjs](tests/unit_js/data/frozenBackupCorpus.test.mjs) already uses for
   backups: a fixture folder of REAL pasted outputs (Claude's, ChatGPT's, a spreadsheet paste, one
   with prose wrapped around the JSON) that must keep parsing. Every paste that fails in real use
   joins the corpus and never regresses. Nothing else keeps a parser honest over time.
5. **No second write path.** The editor's own save is the write, the same one a hand-built session
   uses, so there is no import-specific persistence to keep correct.

### 29.3 Built so far (2026-08-18)

The pure core, test-first, with nothing wired to a screen yet:

- [programImport.js](src/domain/programImport.js) — the parser, its refusals, `programTemplate()`,
  and the all-failures report.
- [catalogMatch.js](src/domain/catalogMatch.js) — catalog id or the CUSTOM mark.
- [tests/fixtures/programs/](tests/fixtures/programs/) + [the corpus test](tests/unit_js/domain/frozenProgramCorpus.test.mjs)
  — four real pasted shapes that must keep parsing, and the rule that every paste which fails in real
  use joins them.

### 29.5 Shipped 2026-08-23

The surface, and everything §29.1 decided about it: the four optional inputs, the failure report
before anything opens, the CUSTOM tag, the copyable prompt, i18n, and
[UC9](use_cases/uc9_program_import.md).

- **The template is shown in the box, not downloaded.** It is there to be READ and then replaced,
  and a file in a downloads folder is one more thing to find. (§29.1 said "downloadable"; this is the
  same intent with less to lose.)
- **A file and a paste are one path** from the moment the file is read: its text lands in the same
  box, so it can be corrected before anything opens.
- **The import opens a PLANNING session** when no session was named — a programme written at a desk
  has no slot, and planning mode is exactly the mode this app already has for a plan with no clock.
  Naming a session attaches it to that evening instead.
- **`startWorkoutSession` learned one option**, `plan`, applied at the single place a plan is built.
  An import that patched the session immediately after creating it would have been a second way to
  construct one.

**Still open**: the CUSTOM tag in the live DECK (it is in the editor, which is where an import is
reviewed), and a second frozen corpus entry whenever a real paste fails.

### 29.4 What is already in the repository, and should be copied rather than invented

- **[§26](TODO.md)'s intake** is the same shape — a document another party produced, reviewed before
  anything is written ([signupFile.js](src/data/signupFile.js) →
  [signupReviewDialog.js](src/modules/clients/signupReviewDialog.js)). The file half of §29.1's input
  list is that flow with a routine instead of a person.
- **[§1.7](TODO.md)'s media-type ruling**: one media type per handling surface, so a program is
  `application/vnd.librept.program+json` and the intake file stays its own.
- **[exerciseStandard.js](src/domain/exerciseStandard.js)** already maps a movement name onto the
  catalog by canonical name (the wger crosswalk, UC6 §6) — that is the matching half solved, and it
  is also what decides whether a movement earns the CUSTOM tag.
- **A use case is still owed**: this is a workflow, so it needs a file under
  [use_cases/](use_cases/INDEX.md) like every other one.

---

## 30. Reported 2026-08-18 (evening) — demo and feed polish

### 30.1 [x] BUG — loading demo data from the message button freezes the app for a while — closed 2026-09-11, not reproducible

Closed — the measurement is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#301-x-bug-loading-demo-data-from-the-message-button-freezes-the-app-for-a-while-closed-2026-09-11-not-reproducible).

### 30.5 [x] BUG — Show me did nothing on a card, and a second caption sat on the panel — fixed 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#305-x-bug-show-me-did-nothing-on-a-card-and-a-second-caption-sat-on-the-panel-fixed-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 30.4 [x] BUG — the guide asked for a screen the trainer was already past — fixed 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#304-x-bug-the-guide-asked-for-a-screen-the-trainer-was-already-past-fixed-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 30.3 [x] BUG — a cleared browser plays the demo to an empty room — fixed 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#303-x-bug-a-cleared-browser-plays-the-demo-to-an-empty-room-fixed-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 30.2 [ ] CHANGE — the demo should end with a thank you and two ways onward

Wanted 2026-08-18: when the walkthrough finishes it should say thank you and invite the trainer to
either play around or clear the demo data. Today it simply closes and leaves them inside the live
clipboard it just showed them — deliberate ([the walkthrough e2e](tests/e2e/test_walkthrough.py)
pins that they are not thrown back to a start screen), but it says nothing at all.

Both onward paths already exist and should be reused rather than rebuilt: the demo card in the
message feed offers the cleanup dialog, and "play around" is simply dismissing the panel. The open
question is WHERE it says this — a final walkthrough step with no control to tap, or a card in the
feed — and that decides whether the guide can be exited before reading it.

**Answered for the STORY, 2026-08-21, and only for it**: `?demo=story` ends on its own narration
card, which is a surface the walkthrough does not have. Thank you, then the two ways onward —
dismissing IS "play around" (the app is left where the story put it, never a start screen), and the
second button opens the same cleanup dialog the feed's demo notice does. The walkthrough's placement
is still open, and the story's answer does not settle it: a card that appears between steps is not
available to a guide whose steps are the trainer's own taps.

---

## 31. [x] A support data-wipe link — shipped 2026-08-23

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#31-x-a-support-data-wipe-link-shipped-2026-08-23); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 32. Application log storage — a seven-day sliding window

**Wanted 2026-08-19 (Simon), and deliberately deferred to its own session** ("let us make logs a
separate feature in new session"). Recorded here so the shape is not re-derived.

**The ask**: application logs kept in storage, in schema **P and 5**, as a sliding window of the last
seven days.

**Why it is its own session, and not a small job.** It names schema **5**, which does not exist —
provisioning a numbered schema is the star-write model's one genuinely expensive move
([docs/DATA_MODEL.md](docs/DATA_MODEL.md) §4, [§18.1](TODO.md)): a new store, a projection per live
schema, backup-file and integrity consequences, and the staging rule §18.4 exists to enforce. Log
records are also the first collection whose retention is TIME-based rather than trainer-driven, so
the sliding window is a new idea in the data layer rather than a new table in it.

**What to settle first, before any of that:**

- **What a log entry IS.** §12.4 already captures crashes into an in-memory ring buffer, offered as a
  prefilled issue and never stored. Are these the same records finally given a home, or a wider
  stream (navigation, sync attempts, writes)? The answer decides the volume and therefore the
  eviction cost.
- **PII, and it is the hard part.** §12.4's crash payload is non-identifying BY CONSTRUCTION — a
  fixed field list, with anything else a caller passes dropped, because a redaction pass that strips
  known-bad keys fails the first time someone adds a field nobody remembered to strip. A log stream
  that quietly records client names would put PII into the backup file, the Drive snapshot, and any
  support bundle. The same construction rule has to hold here from the first line.
- **Who reads them, and how they leave the device.** A log nobody can retrieve is storage cost with
  no benefit; a log that leaves automatically is an unannounced egress ([PRIVACY.md](PRIVACY.md)).
  §31's support surfaces are the obvious neighbour — the same person asking for a wipe is the person
  who would ask for logs.
- **When the window slides.** On write, at boot, or on a timer — and what stops a busy day evicting
  the very entries a support call is about.

---

## 33. Code and tests still cite `TODO.md` 495 times

**Decided 2026-08-19 (Simon):** *"the code and tests are allowed to reference only use cases"* —
code and tests work from behaviour and requirements, not from process documents. The operating-rules
half is done and now gated: no file outside the loaders and document maps mentions them.
The `TODO §N.M` half is 495 sites, and unlike those citations these carry real navigational value:
a `§` pointer is often the only route from a module to the reasoning that produced it.

**Open question before sweeping**: what replaces them. Three candidates, in preference order —
a link to the [use case](use_cases/INDEX.md) that specifies the behaviour (best, but not every
module has one); the reason restated in the comment itself (always possible, costs length); or
nothing (cheapest, loses the trail). Doing this as one 495-site mechanical strip would rewrite
half the repository's comments blind, so the plan is to convert them **as files are touched**,
starting with the modules whose §-refs point at sections that have already shipped.

---

## 34. Browser-suite cost: what an audit of test durations found

**Measured 2026-08-19** on a quiet 16-core box, `--durations=0` over both browser tiers. The headline
is that nothing is broken: the duration distribution is smooth (51 tests near 3s, 48 near 2s, 31 near
4s), so there is **no cluster of near-identical times** — the signature of a swallowed timeout, which
is what the 2026-08-07 investigation found. This is real work, and both tiers run near their parallel
floor: e2e at 81% efficiency (755s of call time, 94s floor at 8 workers, 116s actual), medium at 63%
(238s call, 30s floor, 48s actual).

So the only lever left is **total call time**, and it is concentrated in deliberate waiting:

| Where | Cost | What it is |
| :--- | :--- | :--- |
| `test_walkthrough.py` | 117s / 20 tests | the demo's own pacing:each step is 520ms scroll + 650ms hand travel + 160ms tap + 1350ms settle ≈ 2.7s, and a test that walks the script pays ~11s |
| `test_demo_tour.py` | 41s / 4 tests | same constants, whole script per test |
| `test_splash_screen.py` | 63s / 19 tests | the splash's deliberate minimum hold |
| `test_layout_overflow.py` | 45s / 4 tests | genuine geometry sweeps across four viewports and two languages |

**158s of 755s (21%) is the app deliberately waiting so a human viewer can follow a finger.** Those
constants exist for a viewer (raised 2026-08-18: "on web browser the button and clicks are about 50%
too fast"); the tests pay them 24 times per gate run to assert step logic that has nothing to do with
pacing.

**Done 2026-08-19** — the second option, plus the reason the first was wrong. The demo now runs at
`demoPace` zero under `prefers-reduced-motion`, which is a real user mode rather than a test switch,
and the suites moved into their own Stage 3 task beside the e2e one. `test_demo_tour.py` 41s -> 6s,
`test_walkthrough.py` 117s -> 22s, whole gate 3m13s -> 2m46s.

**Is more parallelism worth it for the demo task? No — measured after the change:**

| Configuration | Wall |
| :--- | :--- |
| Combined, one scheduler, 8 workers (208 tests) | 111s |
| Split as shipped: e2e at 7 ∥ demo at 1 | **104s** (e2e 104s, demo 76s) |
| Demo alone, 2 workers | 25s |
| Demo alone, 4 workers | 17s |

The stage costs `max(e2e, demo)` and e2e is the long pole, so the demo task already has ~28s of
slack; more workers there can only come out of e2e's seven and push the long pole further out. Note
also that its 76s inside the stage is CONTENTION, not cost — standalone it is a quarter of that — so
nobody should read that number as the demo suite being slow. And the split is 7s FASTER than one
scheduler over everything: two schedulers avoid the tail where one worker holds the last slow file
while the others idle.

The remaining lever for Stage 3 is e2e's own call time (437s of CPU over 182 tests), not
parallelism. Raising the total worker count above half the cores has been measured and rejected
twice — compositor starvation and the dev server's listen backlog, both surfacing as `Page.goto`
timeouts unrelated to any change.

**The three candidates as they were assessed, for the record:**

1. **A URL knob for the pace** (`?demo=walkthrough&pace=fast`). Cheapest to write, and wrong: it adds
   product surface whose only consumer is the test suite.
2. **Move the step-logic tests down a tier.** Most of `test_walkthrough.py` asserts panel behaviour —
   which control is offered, what Back rebuilds, what the caption says — and needs no router, no
   persistence and no real boot. Mounted in `tests/medium/` via a stub, each can inject its own
   `wait`, because `performStep` already takes one. Two e2e tests stay behind to prove the real thing
   end to end, and one asserts the PACING itself, which is currently asserted nowhere.
3. **Leave it.** 15s of wall time per run against a day's work is not obviously worth the churn.

---

## 35. The demo STORY — a chaptered scenario, not a longer tour

**Brainstormed 2026-08-19 (Simon).** §23.5's `gym_floor` tour is a four-tap wedge: a stranger sees a
working clipboard in three seconds. This is the other artifact — a narrative that follows three
friends from a leaflet to their second session, and shows the parts a wedge cannot: intake, consent,
a mid-session injury, the feedback loop closing, and a one-off reschedule. **Both must exist and stay
separate.** A stranger gets the wedge; someone who already leaned in gets the story.

### 35.1 Shape before content

- **Chapters, each independently playable and each ending somewhere useful.** ~23 events is 4–6
  minutes at the current pace, and nobody watches an unbroken five-minute demo of software they do
  not yet use. `?demo=story` plays the lot; `?demo=story&chapter=floor` plays one. A chapter is a
  tour in the existing sense, so the engine ([demoTourPlayer.js](src/modules/demo/demoTourPlayer.js),
  [domain/demoTour.js](src/domain/demoTour.js)) is unchanged and a chapter is DATA.
- **Every step still carries an expectation**, including the narrated ones — the rule `validateTour`
  enforces, and the reason a script was chosen over a recording. A paper-action card is not exempt:
  its expectation is that the card is on screen and dismissible. What is NOT allowed is a step that
  claims something about the app while asserting nothing about it.
- **The paper track is TEXT on a paper-textured card, never a picture of a form.** The card SAYS what
  happens on paper — the client signs the printed consent, the trainer dates and files it, the form
  version is recorded — over a paper texture that marks it as narration. Do not draw a form that
  looks like a screenshot: everything else in the demo is the live app, so a drawn surface among them
  reads as a real screen, and the first viewer who tries to find it in the app has been misled.
- **ONE persona on screen at a time, with a transition between them** (decided 2026-08-19, Simon:
  *"we don't really need split screen, transition is enough"*). Desktop gets the same treatment as
  mobile — no side-by-side pane, no second layout to keep working at every width, and the handover
  itself becomes the thing the viewer reads. Each persona's screen is labelled with whose phone it
  is, because the app looks the same on both sides of the handover.
- **The client's screens are the real ones.** Intake, consent and RSVP already exist as pages
  ([signupDelivery.js](src/modules/intake/signupDelivery.js), `consent-form-*.html`,
  [rsvpView.js](src/modules/rsvp/rsvpView.js)), so the client chapter drives those rather than a
  mock-up of them. A hand-built "client phone" would be a recording with extra steps, stale the day
  those pages change.

### 35.2 The events

**Chapter A — three friends arrive.**

1. The trainer's board, with the message feed and no pending work — the before state the story moves
   away from.
2. The trainer books the pair of weekly slots: muscle gain, 2× a week, fixed day and time, 60-minute
   slot, three participants. **Needs the recurrence model (35.3a).**
3. The trainer shares one self-onboarding link per friend, each carrying the calendar invite for the
   series.
4. **The demo hands over to the client** — a labelled transition from the trainer's app to a friend's
   phone, on every screen size.
5. On the phone: the introduction form — name, contact, goal, and injuries *offered, never demanded*
   (§1.7's ruling, [clientSignup.js](src/data/clientSignup.js)).
6. Consent, with the notice version and the language it was given under stamped into the record —
   Art. 7(1) is about being able to DEMONSTRATE it later.
7. The paper card, narrated: the same consent on a printed form, signed and dated, filed by the
   trainer, its form version recorded (§3.5). Same record, different pen.
8. The submission travels as a FILE; the trainer reviews it and decides
   ([signupReviewDialog.js](src/modules/clients/signupReviewDialog.js)) — the feature's trust
   boundary, and the step where the story says a stranger cannot write into the register.
9. The other two are compressed into one step, not replayed. A demo that shows the same form three
   times teaches that the app is slow.
10. Back on the phone: the invite is answered ([rsvpView.js](src/modules/rsvp/rsvpView.js)) and the
    trainer's board fills in.

**Chapter B — the first programme.**

11. The trainer builds the session as circuits, with rests as real items (§8.6), to **45 minutes net
    inside the 60-minute slot** — the net-vs-slot number is the whole point of this chapter and
    should be visible while it is being built. **Needs the net-time meter (35.3b).**
12. The same circuit is bound to all three participants at once. **Needs §8.1.**

**Chapter C — on the floor.**

13. The session opens: one clipboard, three participant tabs, the circuit running.
14. Mid-circuit a client mentions a recent minor injury; the trainer records it **without leaving the
    session and without stopping the clock**, TAGGED to that one participant. **Needs an in-session
    injury capture (35.3c).**
15. The trainer swaps that one movement **for that one participant**; the other two are untouched and
    the demo shows they are untouched.
16. On the deadlift the trainer sees bad posture and leaves a coaching note against that client's
    exercise — one-handed, mid-set. It is a note about a MOVEMENT, so it must resurface the next time
    that movement is programmed for that client, not only in a session log. **Needs 35.3d.**

    **What events 14 and 16 are in the story FOR** (refined 2026-08-19, Simon): not the capture
    itself, which is two taps and unremarkable to watch, but the **review pane** they feed and the
    **per-client tagging** that gets them there. The demo's claim is that a note taken one-handed
    mid-circuit lands against the right person and comes back at the right moment — so the capture
    steps are short, and the pane in event 20 is where the camera stays.
17. Circuits progress; Too Easy is signalled once, so the story keeps §23.4's wedge inside it.
18. The last circuit completes; the session is marked complete, net time against slot time shown.

**Chapter D — the evening after.**

19. The trainer switches to the dark theme, and the rest of the story runs in it — the only "look at
    our settings" step that earns its place, because it is what an evening at home actually looks
    like.
20. Planning the next session: the injury swap and the deadlift note are **already there**, waiting
    against the right client. This is the payoff for events 14–16 and the reason they are in the
    story at all.
21. A pre-agreed one-off move of the NEXT occurrence two hours later — **the series does not change**
    — which lands 30 minutes across a 1-to-1 cardio session. The occupancy grid shows the two side by
    side ([overlapLanes.js](src/domain/overlapLanes.js)); the overlap is accepted deliberately, on
    screen, rather than warned away. **Needs 35.3a and §1.3.**
22. The updated invite goes out to the three; the replies land on the board.
23. Thank you, and the two ways onward already decided in §30.2 — play around, or clear the demo
    data.

### 35.3 What the story needs that does not exist

The scenario is worth writing down now precisely because it names these; each is a product gap the
demo would otherwise paper over.

a. [~] **A recurrence model** — **the rule and the board shipped 2026-08-22**, on Simon's ruling to
   implement it. [sessionSeries.js](src/domain/sessionSeries.js) holds the rule; the evenings are
   DERIVED, and only an evening something happened to becomes a `sessions` row that speaks for it,
   addressed by the series and its ORIGINAL date. Fifty stored rows would have made every later edit
   a fifty-row migration and moving one evening indistinguishable from re-timing the lot.

   The collection is **preview-only** (§18.4's staging, the same exercise `invites` is), so a series
   does not survive a restore until schema 5 — the evenings a trainer has touched are ordinary
   sessions and do. The board draws eight weeks ahead and one back: an open-ended rule is infinite,
   and beyond a term it is a list of identical Tuesdays nobody scrolls to.

   **Authoring and the calendar file shipped the same day.** The session form has a "repeats every
   week" tick that reveals seven weekday toggles with the session's own day already chosen — a
   trainer who says "this repeats" means "this, again", and a rule with no day silently produces
   nothing. The calendar file carries `RRULE` while an evening is where the rule put it, and
   `RECURRENCE-ID` + `SEQUENCE` once it has moved, so a client's calendar holds ONE entry for
   "Tuesdays and Thursdays at six" and a change lands on the evening it belongs to.

   Moving one occurrence needs no separate UI: opening an evening from the board makes it a record,
   and the form then says, out loud, that what is changed there changes that evening only.

   **Deleting an evening of a series CANCELS it** rather than removing the row — the rule would
   otherwise produce that evening again on the next render, and a trainer would watch a session they
   just deleted come back.

   **Editing the series shipped too** (2026-08-22): editing one of its evenings offers *change every
   evening of this session*, which puts the edit on the RULE and drops the exception row, so the
   evening follows the rule again. What travels is what the rule DESCRIBES — title, slot, place, who
   is in it — never the date: "we are moving to Wednesdays" is a change to `weekdays`, a different
   sentence and a different control, and still unbuilt.

   **Open: an evening that went by and was never opened counts up forever.** A derived evening is
   not a record, so nothing can mark it finished, and the board therefore shows every past evening
   the trainer did not tap as a session still waiting to be run — red, "Overdue 64h", and growing.
   The demo no longer shows it (2026-09-11: [sessionSeriesSeed.js](src/data/sessionSeriesSeed.js)
   seeds the evenings already held as finished sessions), but a real trainer's board still will, and
   the board looks one week back. Two candidate answers, both unruled: stop the count at the end of
   the day the session was scheduled for, or let a past evening be dismissed the way a message is.
b. [x] **A net-vs-slot time meter** while a programme is being authored (event 11) — 2026-08-22.
   [planDuration.js](src/domain/planDuration.js) plus a pill in the plan editor's toolbar: minutes
   of work against minutes of slot, quiet while it fits and marked when it does not. An ESTIMATE,
   and it says so — a working set is ONE constant (45s), because per-movement durations would mean
   inventing a number for all 48 seeded movements and every custom one a trainer adds. Timed work
   counts its own seconds, rests count (they are what a slot is spent on), a circuit costs its
   rounds, and a session with no slot is never judged.
c. [x] **In-session injury capture** (event 14) — **2026-08-21**: the feedback modal gained one
   tick, *keep this on the client's record*, which appends the dated note to `client.notes` — the
   text every future plan is written against, durable in the stable schema, and already shown by the
   client focus panel. Off by default, because most signals are about today's load and a record that
   collects everything is one nobody reads. Deliberately does NOT set `hasInjury`: deciding which
   tags mean "injury" would be a guess made from a string, and that call is the trainer's.
d. [x] **A movement-scoped coaching note** (event 16) that resurfaces when that movement is next
   programmed for that client — **2026-08-21**. Built as ONE pane for both kinds of note, as this
   asked: the client focus panel, already open while a plan is being edited, gained a *From the
   floor* block listing that client's unanswered signals and notes,
   [gymNotes.js](src/domain/gymNotes.js) putting the ones about movements in THIS plan first and
   marking them. **No new record type was needed** — a note is already captured against
   (participant, movement) in `planUpdates`; what was missing was it coming back at the moment it
   can change something. Resolved notes stay gone; four rows, then a `+N`, because the panel shares
   a 390px screen with the plan itself.
e. **The persona transition** (event 4), per 35.1 — one screen at a time, so this is a labelled
   handover and a route into the client pages, not a second layout.
f. **Shared exercise binding across participants** (event 12) — §8.1.

**So the order to build it in is: chapter C first** (it needs c and d, and is the chapter closest to
what already runs), then D, then A. Chapter B is blocked on §8.1. Written this way each chapter ships
as a demo the moment its feature does, and no chapter waits on the recurrence model except the two
events that genuinely need it.

### 35.4 Build log

- [x] **The spine, and chapter C's existing steps — 2026-08-21.** `?demo=story` plays the lot,
      `?demo=story&chapter=floor` plays one; an unknown chapter plays the whole story rather than
      nothing, because these links are typed by hand and an empty step list looks like a failed boot.
      A chapter is a tour, so the engine is untouched apart from one awaited `beforeStep` hook — the
      narration card is the control its own step taps, which is how a narrated step carries a real
      expectation instead of a pause. New: [domain/demoStory.js](src/domain/demoStory.js) (chapter
      rules), [storyTour.js](src/modules/demo/storyTour.js) (the script, reusing the wedge's steps
      rather than restating its selectors), [demoNarratorCard.js](src/modules/demo/demoNarratorCard.js)
      (cards, persona pill, caption bar). Events 14, 15, 16 and 18 are NOT in it: 14 and 16 need
      35.3c/d, and a demo step that pretends is what a scripted demo exists to avoid.
- [x] **35.3c and 35.3d shipped — 2026-08-21**, before the demo steps that show them: the *keep on
      the client's record* tick and the *In the gym* block in the client focus panel. One pane
      for both kinds of note, as 35.3d required.
- [x] **Chapter C's capture and payoff — 2026-08-21.** The floor chapter is 14 steps: the wedge,
      back to the first friend (their signal still set), the injury captured mid-circuit and kept on
      the record, and the plan editor opened to find it already waiting — the expectation of that
      last step IS the pane, so the payoff is a claim the build checks. Event 16 is deliberately not
      a second step: it uses the same modal, and a demo that shows one form twice teaches that the
      app is slow (§35.2 event 9's rule). The story also ends properly now — see §30.2.
- [x] **Event 15 — 2026-08-21.** The swap happens inside one participant's plan, through the row's
      own catalog button, and the replacement is chosen BY NAME from what the picker actually offers
      (it opens filtered to that row's category, so a catalogue-wide pick would be a movement the UI
      never shows). The expectation is the editor's own **Swapped** badge: the movement's name lives
      in an input VALUE, which is not text content and cannot be probed — a lesson worth keeping for
      the next step that acts on a form.
- [ ] **Chapter C's last event** — 18 (complete, net vs slot), which needs 35.3b's meter.
- [x] **The story is GUIDED, and the demo can type — 2026-08-22 (Simon).** *"Autoplay reduces the
      effect, a person loses focus; Show me is the best middle ground."* So `?demo=story` mounts the
      walkthrough panel with the story script: the viewer performs each step, or asks to be shown it,
      and the narration cards ride along on an `onStep` hook. The wedge keeps its autoplay — three
      seconds is watchable, four minutes is not. A step can now `enter` text and `choose` from a
      list, firing the events a real keystroke and a real selection fire; expectations gained
      `hasValue`, because a field HOLDS what was typed and SAYS nothing. Event 19's theme switch is
      a `<select>` and is therefore scriptable now.
- [x] **The story TELLS a story — 2026-08-22 (Simon):** *"I want the demo to be storytelling, not
      just a demonstration of functionality."* Every caption names the people the seed puts on
      screen: Jane's round, John's rebuilt knee, Sarah's rehab plan in the same hour. The injury step
      moved to John precisely because his seeded record carries a 2024 knee reconstruction — the app
      telling the truth about the person on screen rather than a line written for the demo.
      Pinned by a test that reads the captions back and looks for the names.

      **Two defects the walk exposed, both real for a trainer and not only for the demo**: the guide
      was unreachable while any modal dialog was open (a modal makes the rest of the page inert, so
      Show me silently stopped working), and tapping the guide while editing a plan CLOSED the editor
      — the editor's tap-outside rule did not know the guide is part of what the trainer is doing.
- [x] **All five chapters play — 2026-08-22.** The story is
      **arrive → intake → programme → gym → evening**, 33 steps, guided end to end. B and D were
      unblocked by the features built for them the same day (§8.1's binding, §35.3b's meter, the
      recurrence model, and the player's ability to pick from a list); A was unblocked by giving the
      trainer something real to tap — [intakeInvite.js](src/modules/clients/intakeInvite.js), the
      link that lets someone fill in their own details.
- [x] **35.3e, the persona transition — 2026-08-22.** The story crosses to the client by NAVIGATING
      to `/intake`, and the guide picks up there in its own boot: the client's screens are the real
      ones, so a drawn "client phone" would have been a recording with extra steps. The chapter is
      marked as belonging to the client's surface, which is what keeps it out of the trainer's walk
      — folding it in would leave the guide pointing at a form that is not on screen.
- [x] **Event 21, the one-off move — 2026-08-22.** The evening chapter opens the repeating session's
      next evening and moves it two hours later; the expectation is what the FORM says while it is
      open — this evening only, the series untouched — because that is the claim the step exists to
      make. Naming the edit button needed one engine addition: `targetWithin` says "the edit button
      on the card called X", which is how a person says it and the only way to name an icon button
      among several without falling back on position — the thing that broke the first gym-floor tour.
- [ ] **The one step the story cannot show**: the trainer opening the file Ana sent. §26.5's review
      dialog needs a real file, and a demo-only hook into it would be the mock this whole approach
      exists to avoid. The intake chapter says what happens next in words instead.

---

## 36. [nice to have] Rename the `main` branch to `trunk`

**Wanted 2026-08-19 (Simon), explicitly a nice-to-have.** The repo is trunk-based by rule — no
feature branches, one releasable line — and the branch name is the last place that does not say so.
Cosmetic, so it waits for a quiet day rather than riding alongside feature work.

**Not destructive; history is untouched.** The cost is everything that NAMES the branch, and the
order is the whole risk:

1. `git branch -m main trunk`, push `trunk`, set its upstream.
2. **Switch the GitHub default branch to `trunk` BEFORE deleting `main`.** The default branch is what
   GitHub Pages deploys from; deleting `main` while it is still the default takes the live site down
   until someone notices.
3. Update `.github/workflows/deploy.yml`'s `branches: [main]` **in the same push**. This is the bad
   failure mode: miss it and the deploy simply stops firing — a green tree and no deploy, with
   nothing red to tell you.
4. Re-apply branch protection; rules do not follow a rename.
5. Sweep the prose mentions (`AGENT_RULES.md`, `CONTRIBUTING.md`, a few docs) BY HAND — `grep -w main`
   also matches `#main-content`.
6. Each existing clone: `git branch -m`, `git fetch`, `git branch -u origin/trunk`.

Everything above is reversible except the Pages outage step 2 exists to avoid.

---

## 37. The browser tiers are CPU-SATURATED, and the pipeline was under-reporting it

**Note 2026-09-10 (Simon): the recent runs were on PERFORMANCE mode, not balanced.** Any timing
compared against an older one is comparing power modes as well as code — including the demo/e2e
ratio the Stage 3 worker split is derived from (§39.18, `demo_worker_count`). Re-derive on the
same mode as the measurement being replaced, and say which mode it was.

**Measured 2026-08-19**, chasing "where does the medium tier lose its time?". The premise was wrong,
and so was the instrument.

**The per-task CPU figure misses most of the work.** It comes from `wait4` on the runner's own child,
and Playwright's Chromium processes are not reaped through that tree. For one medium file at four
workers: 19.6s reported, 51.4s of machine CPU actually burned. Across the whole tier the report said
5.0 cores while the machine was doing **14.4 of 16**. Every "efficiency" figure derived from the task
CPU was therefore an artifact — including the 62% that started this. Each stage now also prints what
the machine averaged, read from `/proc/stat`, which has no such blind spot.

**The worker count does nothing.** Wall time for `tests/medium` at 4, 6 and 8 workers: 47.3s, 45.7s,
48.0s — all within noise, machine pinned near 14 cores throughout. The box saturates well before the
worker count becomes the constraint, which is the same wall the 2026-08-08 measurement hit from the
other side (12 workers bought 5% over 8).

**So the only lever left is work per test, and it lands 1:1 in wall time** now that saturation is
established. Two candidates, both trades:

- **The page load is ~0.32s of every medium test** (route + goto + boot + splash removal, measured
  directly) — about 60s of the tier. **Rejected**, on three counts. No file shares a page today (an
  earlier note here claimed some did; it had counted `_mount()` helper DEFINITIONS, not navigations —
  16 tests still produce 16 loads). Sharing would leak state between tests in a file: not just DOM,
  but ES-module state that no DOM cleanup resets, in exactly the components that keep some. It would
  make tests order-dependent, so one early failure cascades into unrelated red. And it would not even
  pay: `--dist=load` spreads a file's tests across workers, so a module-scoped page is built once per
  WORKER unless files are pinned with `--dist=loadfile` — which was removed on 2026-08-07 because it
  made a stage as slow as its heaviest file (215s → 98s when dropped).
- **`tests/e2e/` holds 144 fixed sleeps totalling ~70s** (`wait_for_timeout`), against 26 totalling
  ~10s in `tests/medium/`. Each is a duration where an expectation would do — the walkthrough test
  fixed on 2026-08-19 went from 2.2s of sleeping to ~0.1s of waiting for the thing it actually
  needed. **This is the one to do**: it trades no isolation, and every fix makes its test MORE
  reliable rather than less, since a sleep tuned to one machine is a race on another.

**Not worth doing:** `--dist=worksteal` (46.9s vs 47.4s, noise), and raising workers (see above).

---

## 38. [x] Reported 2026-08-25 — the demo's own entry points — fixed 2026-08-25

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#38-x-reported-2026-08-25-the-demos-own-entry-points-fixed-2026-08-25); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 38.23 [ ] WATCH — the ZAP stage failed once with a container-side write error

2026-08-30, one run out of ten that day. The log:

```
Unable to copy yaml file to /zap/wrk/zap.yaml [Errno 30] Read-only file system: '/zap/wrk/zap.yaml'
Failed to access summary file /home/zap/zap_out.json
Using the Automation Framework
```

…then exit 3 after 11s, against a usual 17-35s. An immediate re-run with no change passed cleanly.

**Not called flaky, because there is a readable hypothesis.** `zaproxy/zap-stable` is pulled rather
than pinned, and its newer builds drive the scan through the Automation Framework, which wants to
write a generated `zap.yaml` into `/zap/wrk` — the directory this gate mounts **read-only** on
purpose. If that is it, the failure is the image changing under us and will recur, at which point the
fix is either a writable scratch mount or a pinned image tag rather than a retry.

The machine was also at a load of 13.7 when it failed, so a slow start under contention is the other
candidate, and the two are not distinguishable from one log.

**Re-check condition:** the next time this stage fails, compare the log against the block above. Two
matches make it the image, and the tag gets pinned.

### 38.21 [ ] OPEN — the demo's card copy, waiting on the maintainer

**Said 2026-08-30 (Simon):** *"besedila kartic so obupna, dajva jih skupaj editirati (angleška) in ti
potem narediš ustrezne prevode"*, then *"ohrani besedila za takrat ko bom imel čas"*.

The twelve cards, each with what it says today, what is wrong with it and a proposed rewrite, are in
[docs/DEMO_CARD_COPY.md](docs/DEMO_CARD_COPY.md). Nothing there is shipped. When the proposals are
edited, the English goes into `src/i18n/en.js` and the Slovenian is written to match.

Three defects in it are worth naming here, because they are facts rather than taste:

- the story's **last card is a copy-paste of the gym card** — `evening-close` reuses
  `story_gym_close_body`, so the demo ends by describing an hour that finished two chapters earlier,
  and the "clear the demo data" offer appears twice; **fixed 2026-09-25**;
- **four cards share a title with another card** ("On Ana's phone", "The programme", "In the gym"),
  so a viewer cannot tell whether the story moved; **fixed 2026-09-25**;
- the **message card shows an invitation the app no longer sends** — the text replaced on 2026-08-26
  precisely because it read like a phishing message.

Separately, seven captions narrate instead of instructing ("Open the session menu.", "Joint pain, on
this movement."), against the rule that a step asking for an action names the control, its glyph and
where it is.

**2026-09-25 — three rounds with a trainer persona (asked by Simon).** In each round a fresh
subagent plays a trainer who distrusts apps and writes programmes on paper; it reads every card in
order, then judges the rewrites. **Round 1 shipped:** every step that asks for an action names the
control; the seven narrating captions are rewritten; the last card has its own text; the closing
cards have their own titles; the word *naloga* is gone; the trainer-details cards no longer claim
that nothing is saved. **Round 2 shipped:** the circuit is *sklop* on every card, as on the + Sklop
button (*krog* is one round of it); a file cannot go back by SMS, so Ana's send names e-mail or
Viber; the plan's clock is explained as its two numbers; the welcome card is shorter; the closing
slogan "nič ni bilo zapisano dvakrat" is gone. **Round 3 shipped:** the handover button says
*Odpri Anin obrazec* instead of *Odpri Anin telefon*, which read as "become Ana" (against the
ruling that the trainer does not play a role); the consent step says why it exists (her health
data); John mentions his knee during a rest, not mid-set; the plan's clock reads "45 minutes of
exercises in a 60-minute session".

**After the rounds, the same day (asked: "fix all card issues"):** the message on Ana's phone is
now the invitation the app sends, built by `intakeInviteMessage` itself (A9); the welcome card is
the story's first chapter (A1); Ana's file has its own chapter, not offered as a start, so the
programme chapter now starts on its own card and IS offered (A2); the client list is *Imenik strank*
in the menu and on every card, as rule 4 of the review set (A10); the English cards say *Clients
Directory* as the screen does. Every step now fits a 390x844 phone without scrolling, in both
languages — `test_every_card_fits_a_phone_without_scrolling` walks the whole story to prove it,
and three chapter openings were cut to pass.

**[ ] Decision, not work — Simon:** two of the chapter names he gave on 2026-09-21 (§73.8) now
disagree with their cards. *Vnesi svoje podatke* orders the trainer to enter their details, while
the card says they need not enter anything now; *Pregled zaznamkov in priprava treningov* promises
a review of notes, while the chapter only switches the theme and moves Tuesday's session. The names
were kept; the agent's rename was reverted the same day.

**[ ] Decision, not work — Simon:** all three personas named the English note-type button
(🔥 Joint Pain / Discomfort, §38.20) as the step where they would stop, and the third also the
English names of Tuesday's clients: *"Jane, John in Sarah … zveni, kot da je nekdo prekopiral
ameriški demo"*. The names are kept on purpose ([demoText.js](src/data/demoText.js): "people's
names are names"); Ana, Maja and Nik are Slovenian already. Whether a Slovenian demo gets Slovenian
clients is the maintainer's call; it changes the seed and every test that names them.

**Re-check condition:** whenever the maintainer has time for the copy pass.

### 38.20 [~] IN PROGRESS — user-visible English that never reaches the translator

**Reported 2026-08-30 (Simon):** *"prevodi so nekonsistentni, na slovenski strani se včasih pojavlja
angleški tekst"* and *"gumb cancel se pojavi na slovenski izvedbi"*.

**Not a missing-translation problem.** The dictionaries are in perfect parity — 622 keys each,
nothing missing, and the only strings identical between them are ones that should be (`kg`, `min`,
`LibrePT`). The English comes from copy that never passes through the translator at all: it is
written into the markup.

Measured across `src/`: **332 user-visible literal strings in 38 files.** The worst:

| file | strings |
| :-- | --: |
| `controllers/exerciseFormsController.js` | 46 |
| `modules/clipboard/activeSessionOverlayView.js` | 27 |
| `modules/common/applicationHeader.js` | 24 |
| `modules/clients/clientDataRights.js` | 22 |
| `modules/session/editSessionView.js` | 22 |
| `modules/clients/clientsView.js` | 19 |
| `modules/common/backupRestore.js` | 19 |
| `controllers/clientFormsController.js` | 16 |

The reported "Cancel" is one of the sixteen in the client dialog, beside "Add New Client", "Full
Name *", "Save Client" and "Data Protection (GDPR)". Some of the 332 are false alarms the crude scan
picked up — a licence name, a taxonomy value, a placeholder that is an example rather than a label —
so the number to fix is smaller than 332 and larger than any one dialog.

**Not fixed in the same pass as §38.19, deliberately.** That one was a demo that could not be
finished; this is a sweep across a third of the module tree, every string of which is a small product
decision about wording, and doing it under the same commit would bury both. It also wants the same
treatment as §38.19 got: a check that fails the build on a user-visible literal, or the sweep is
undone by the next dialog somebody writes.

**Started 2026-08-30, and the first two findings were mechanism rather than copy:**

1. **27 elements carried `data-i18n="key"` and nothing read the attribute.** Every key existed and
   was translated in both languages; no code ever asked for them, so the whole session editor, the
   client register's invite button and the clipboard's plan menu shipped their English placeholder
   text in every language. `i18n/domMappings.js` now applies the attribute — and two siblings with
   it, `data-i18n-placeholder` and `data-i18n-label`, because a control says three different things
   to a person: its text, the words a field shows while empty, and what a screen reader is told about
   a button with only an icon on it.
2. **The dialog the report came from** is converted: eighteen strings, of which the dictionary
   already had fourteen — `add_new_client`, `btn_cancel`, `save_client`, the consent block — waiting
   for markup that never used them. Measured after, in Slovenian: *"Dodaj novo stranko"*,
   *"Ime in priimek *"*, *"Prekliči"*, *"Shrani stranko"*, *"npr. Ana Novak"*.

Five entries were deleted from the selector table in the same pass: an element named both there and
in its own markup is an element two files disagree about, and the table won — it said `client_name`
("Ime stranke") where the label reads "Full Name *".

**332 → 289**, and the rest is held by a ratchet
([agent_tools/ui_strings.py](agent_tools/ui_strings.py), Stage 1 + CI): the count may not rise, and
may not fall without the baseline following it. So the sweep can proceed a file at a time while no
new dialog is written in English.

**2026-09-24: the two data-subject-request dialogs** ([clientDataRights.js](src/modules/clients/clientDataRights.js)),
**269 → 249.** Every text in their markup has a key, and so do the three texts the code writes: the
export's counts, the Compose button and the same-name warning. A sentence with a bold part became two
whole sentences, each with its own key, because `data-i18n` replaces an element's whole content.
**[ ] Still English in that file:** the erasure receipt (its two lines are the 2 the check still
counts, plus the warnings built with counts beside them), the email text the Compose button writes to
the client, and the confirmation word `ERASE`, which a Slovenian trainer must type in English. The
email and the word are wording decisions, not only translations: the email goes to the client, and
the word is what stops an erasure by reflex.

**2026-09-24: the client directory and detail views** ([clientsView.js](src/modules/clients/clientsView.js)),
**249 → 232.** Every label and button in their markup has a key; the placeholder texts the code
always overwrote ("Jane Doe", "Goals details go here.") are gone. Twelve entries left the selector
table in [domMappings.js](src/i18n/domMappings.js): eight named what the markup now names, and four
named elements that no longer exist. The labels now show the words their keys held all along, so
the English reads "Training Goals", "Pre-existing Injuries & Notes" and "Logged Session History"
where it read "Current Goals", "Health & Injury Notes" and "Training History". The same day the
texts its code writes followed (**232 → 231**): the consent badges, the consent button, the erased
banner and the AI Safe Copy alert. The AI summary itself stays English on purpose: it is data pasted
into an AI tool, not text on screen.

**2026-09-24: the Sync & Backup dialog** ([backupRestore.js](src/modules/common/backupRestore.js)),
**231 → 212.** Its markup carries every key, and fifteen entries left the selector table. The Drive
card's description and two buttons are empty in the markup, because
[driveSyncUi.js](src/modules/common/driveSyncUi.js) writes them from the dictionary on every render.
**[ ] Still English there:** the restore warning lists what would be lost by collection name
("3 clients"), straight from the code.

**2026-09-24: the Custom Exercise dialog** ([exerciseFormsController.js](src/controllers/exerciseFormsController.js)),
**212 → 193.** Its labels, buttons, placeholders and the six options for how an exercise is logged
carry keys; seven entries left the selector table. **[ ] Decision, not work — Simon:** the muscle,
equipment and pattern options (Chest, Barbell, Hinge; 27 of the 46 this file had) are taxonomy
values, shown in English in every language here and on the library's filter chips alike. Translating
them means a label per value, while the stored value stays the English one the wger crosswalk (§13.1)
reads. Until that is decided they count as the irreducible set.

**2026-09-24: the clipboard's feedback dialog** ([feedbackModal.js](src/modules/common/feedbackModal.js)),
**193 → 182.** Its markup carries every key, and six entries left the selector tables. One of them
had set the note field's placeholder to the words of its own label, "Custom Details / Notes"; the
field now shows its example. **[ ] Decision, not work — Simon:** the five feedback choices ("Too Easy
- Increase Load" and the others) are stored in English and shown again on the review screen.
Translating only the choice would make the two screens disagree, so the choices and their display
elsewhere are one decision.

**2026-09-24: the Apply Program Adjustment dialog** ([planAdjustments.js](src/modules/plans/planAdjustments.js)),
**182 → 169.** It had no key at all; every label, option and button now has one. The mock voice
memo name ("voice_memo.wav (0:04)") stays: it stands in for a feature that does not record yet.

**2026-09-24: the encrypted-file reader** ([encryptedFileReader.js](src/modules/common/encryptedFileReader.js)),
**169 → 160.** The one screen a client uses, to open the export their trainer sent. Its markup and
its five status messages now come from the dictionary; the module receives `t` at boot. A failed
decryption now says so in the reader's language instead of showing the data layer's English error.

**2026-09-24: the Routine Template dialog and its rows** ([routineFormsController.js](src/controllers/routineFormsController.js),
[plansView.js](src/modules/plans/plansView.js)), **160 → 144.** The title was English on every open in
every language: the table translated it at boot, and both the create and the edit path then wrote
English over it. Both paths now write it from the dictionary, the markup carries its keys, and the
exercise rows, built by code after the translation pass, take their words from `t`. The name label's
key gained the required mark (*) it had lost.

**2026-09-24: the invite dialog** ([sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js)),
**144 → 142.** A defect rather than a count: `session_invite_expiry` and its hint were in both
dictionaries and nothing applied them, so the cutoff field's label was English in every language
and the hint that explains what 0 means was never shown. The dialog now writes both on open.

**2026-09-24: keys that nothing applies — a second kind of defect.** The invite dialog above was
one; the demo cleanup dialog ([demoCleanupDialog.js](src/modules/common/demoCleanupDialog.js),
**142 → 139**) was another: `demo_cleanup_title` and `demo_cleanup_remove` existed in both languages
and its title and Remove button stayed English. Both are now written on every open. A scan of `en.js`
for keys that no file under `src/` names in quotes found **60**. Most are built from parts in code
(`modality_*`, `rsvp_*`, `session_change_*`, `library_import_refused_*`) and are in use. Of the
thirteen read one by one, two were the same defect: the setup form's refusals of a session with
nobody in it, or with a participant and no programme, were English alerts beside
`err_select_client` and `err_assign_routine` ([editSessionControl.js](src/modules/session/editSessionControl.js)),
fixed the same day. The other eleven were leftovers that no code wrote in any language
(`offline_cached_badge`, `voice_transcribing`, `up_next_label`, `no_weight_records` and seven more),
and were removed from both dictionaries the same day. A check that fails the build on a key nothing
names would need a list of the prefixes built in code, and is not built.

**The ratchet cannot see sentences written by code**, only markup. A search for English literals in
`alert`, `confirm` and `textContent` found two more, fixed the same day: the question before taking
a participant off a session with recorded feedback, reworded plainly with its meaning kept, and the
"Nothing was changed." note after a declined restore. A wider search the same evening found the
exercise picker's count ("48 movements") and its empty message, English on all three screens that
mount it. Both now come from the dictionary through one helper, `pickerLabels(t)` in
[exercisePicker.js](src/modules/exercises/exercisePicker.js), which also replaced the four labels
each caller had copied. The count now reads "Movements: 48" / "Vaje: 48": Slovenian has four plural
forms, and a number after a label needs none. The same search found the session form's two
placeholders ([editSessionView.js](src/modules/session/editSessionView.js)) and the signup review
dialog's title ([signupReviewDialog.js](src/modules/clients/signupReviewDialog.js)) English; both
carry keys since the same evening (**138 → 133**). Then the screen-reader label on every view's
grabber, the bar at the top of a view: all eight carry a key (**133 → 128**). Then the header
([applicationHeader.js](src/modules/common/applicationHeader.js), **128 → 125**): the two close
buttons, the version button, and the Sync & Backup button, whose label code writes as "base — sync
state" with only the state half translated. **Left bilingual on purpose:** "Menu / Meni" and
"Switch Language / Zamenjaj jezik", so that someone who cannot read the current language still finds
the way to change it, the rule the language prompt follows. **[ ] Question for Simon:** "Theme /
Tema" sits beside them in the same menu, and it is not clear whether it was meant the same way.

**Measured the same day, and not converted:** `activeSessionOverlayView.js` (20),
`applicationHeader.js` (16) and `clientConsentSection.js` (10) are mostly false counts. Their visible texts are translated already, by
the selector table or by code that writes them from the dictionary; what the check counts is the
English placeholder text in the markup. What is really English there is screen-reader text: the
labels on the ☰ menu, the language and theme selects and the close buttons.

The worst remaining, by count: `exerciseFormsController.js` (27, the taxonomy values above),
`activeSessionOverlayView.js` (20), `applicationHeader.js` (16), `planAdjustments.js` (13).

**Re-check condition:** the ratchet becomes an ordinary gate when the count reaches the irreducible
set — a licence name, a taxonomy value that is the same word in every language — and this section
closes then. Before any release that offers Slovenian as a supported language rather than a preview.

### 38.11 [x] GAP — muted text sits ON the AA bar on the light palettes — fixed 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3811-x-gap-muted-text-sits-on-the-aa-bar-on-the-light-palettes-fixed-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 39. Reported 2026-08-31 — the story walked card by card

Twenty observations from one hand-walk of the story's 47 cards, in the maintainer's own words. His
card numbers are the guide's counter and match this file's step ids up to card 20; from the plan
editor on they run one lower than the shipped script, so **each item below names the step id**, which
is what the work touches.

Half of these are copy that is wrong on screen rather than a mechanism that is broken, and copy is
the cheapest thing here to fix and the most visible: a viewer who catches the demo in a lie stops
believing the rest of it. **Verified where an entry says so; the others are reported and not yet
reproduced.**

### 39.1 [x] BUG — the story told the viewer four things that were not true

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#391-x-bug-the-story-told-the-viewer-four-things-that-were-not-true); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.2 [x] BUG — crossing to Ana's phone lost the language

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#392-x-bug-crossing-to-anas-phone-lost-the-language); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.3 [x] BUG — the consent Ana ticked named Google Drive

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#393-x-bug-the-consent-ana-ticked-named-google-drive); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.4 [x] CHANGE — the invite dialog's two buttons — fixed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#394-x-change--the-invite-dialogs-two-buttons--fixed-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.5 [~] BUG — the register takes the same person twice

**Reported at card 8:** *"adding an customer is not idempotent operation, i have multiples in DB, so on
name clash alias should be mandatory, how is clipboard gona distinguish name clashes?"*

Walking the demo more than once leaves several Nik Zupans in the register, and the clipboard shows
people by name — so two people with one name are two rows a trainer cannot tell apart mid-session,
on the gym floor, one-handed. The demo is how it was noticed; the defect is the app's.

The ask is a **mandatory alias on a name clash**, decided when the second one is saved rather than
discovered later. Open question the fix has to answer: what the clipboard, the plan editor and the
history show once an alias exists.

**Dodaten preizkus objavljene različice `0625bd6`:** dve stranki »TEST Luka Kovač«,
vzdevka »jutranji« in »večerni«, dodani na »Par z vzdevkoma«. Izbirnik in zavihka
vadbe pokažejo vzdevka; v oknu »Pošlji vabila v koledar« pa sta dve enaki oznaki
»TEST Luka Kovač«. Trener ne vidi, kateremu pošilja vabilo. Predlog: tudi vrstici
vabil naj pokažeta vzdevek ali naslov prejemnika. Vabil v preizkusu nismo poslali.
Preizkušeno samo prek vmesnika, brez preverjanja kode.


**Dopolnitev iz »Opombe v paru«, objavljena `0625bd6`:** pri jutranjem Luki
odpreti Dumbbell Bicep Curl → Opombe, vpisati »SAMO JUTRANJI: simulirana opomba brez
shranitve«, zapreti z X, preklopiti na večernega in odpreti njegove Opombe.
Neshranjeno besedilo se pravilno počisti. Naslov obrazca pa pokaže samo »Povratne
informacije za TEST Luka Kovač pri Dumbbell Bicep Curl«, brez vzdevka. Trener pred
zapisom ne more iz samega obrazca potrditi prejemnika. Predlog: vzdevek vključiti
tudi v naslov opombe. Sl, 390 × 844; brez prestreženih napak brskalnika.

**Dopolnitev iz skupinske vadbe »Izmenični odmori«, objavljena `0625bd6`:** oba Luka
imata isto vajo Dumbbell Bicep Curl. Časomer premora prvega teče tudi po preklopu na
drugega, drugi časomer začne neodvisno. Obe plavajoči oznaki pa kažeta samo »TEST Luka
Kovač« in isto ime vaje, brez vzdevka. Trener ne more zanesljivo vedeti, kateri čas
pripada komu. Vzdevek naj bo tudi na časomeru in v izbirniku »Kopiraj ta načrt na …«,
kjer ga je prejšnji preizkus prav tako pogrešil.

**State 2026-09-30:** the alias now shows in all four places the walks found — the invite rows, the
feedback form's title, the rest and exercise timers and "Copy this plan to…" (`e46267f`). **Open,
waiting on Simon:** whether an alias becomes mandatory when a second client of the same name is
saved. §80.69 records the opposite pull: the alias field is always visible and a first visit does
not need it.

### 39.6 [x] BUG — the clipboard says which session, and the chapter builds a programme

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#396-x-bug-the-clipboard-says-which-session-and-the-chapter-builds-a-programme); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.7 [ ] CHANGE — the demo's cards are still not one shape

**Reported at card 9:** *"first time I see drop down icon in top right (all cards should be uniform!),
x buttom appears only once collapsing a card"*, with *"demo cards should have a bacground color that
makes them easy to distinguish from in app controls"*.

§38.16 put the ✕ on the parked bar deliberately — it is the only place it means "end the demo" — so
the second half of the report is a consequence of a decision, and what is left to answer is why the
panel's chrome reads as arriving at card 9 rather than at card 1. The background ask is separate and
straightforward: the guide's card should never be mistakable for one of the app's own.

### 39.8 [ ] GAP — what the story shows of the other phone

Four asks, one subject: the parts of the journey that happen outside this app are the parts a trainer
has never seen, and the story currently narrates them.

- **Card 10/11:** *"i want message recieved notification to be a mockup and a clearly marked fake
  screenshot of opening a text message or mail app"*, and *"missing a few steps of (clearly marked)
  mock sms notification and (clearly marked) mock click on message link"*.
- **Card 11:** *"make ana's phone bloosom themed"* — she is on `midnight` today, which is the theme
  the trainer might also be using.
- **Card 18:** *"jasno označeno ustvari mock share postopek, ki ga izvaja Ana (a smemo dati približek
  iPhonovega share postopka pri Ani?)"* — the share sheet is the one step the demo cannot drive.
- **Card 19:** *"naj pokaže 3rd party app za branje sporočil ali pa sms notification view screen, kjer
  PT klikne"*.

Every one of these has to obey §35.1's rule — a step that happens outside this app is drawn on
something nobody could mistake for one of its screens — and the iPhone question is a real one to
answer before drawing anything: an approximation of somebody's share sheet is their design, not ours.

### 39.9 [ ] BUG — Show me skips what it is there to show

- **Cards 6→7, walked backwards:** *"show me fills both number and mail, never animates the x click"*.
  Two steps of the arrive chapter are demonstrated as one, and the close step's own tap is never
  drawn.
- **Card 20:** *"show me ne pokaže klik animacije"*.

Both are the player, not the script: the hand is what makes a demonstration a demonstration.

- **[ ] A demonstration that fails part-way leaves what it opened open (found 2026-09-30).**
  `demonstrateBeats` stops at the first beat that does not come true, so a later beat that tidies up
  never runs: on the welcome card, the ☰ menu stays open. A trainer does not reach this on the
  welcome card (see §91.5 for how the tests did), but any failed demonstration does the same. One
  way: run a sequence's closing beat even after a failure.

**State 2026-09-30:** the reported part is fixed (`5c269da`). Walking Back rebuilt the ground under a
step by replaying the earlier steps without the hand, which is how two fields were filled as one and
the ✕ was closed undrawn; a control not drawn yet was taken as settled at 0,0; and a control that
moved while the hand travelled was tapped where the hand was not. Replays now carry the hand, a
zero box is not settled, and the hand goes back and presses again before a tap if the control
moved. `test_every_tap_show_me_performs_is_drawn_by_the_hand_first` walks the whole story forward and
every chapter back with Show me and fails on any undrawn tap (about ninety before the fix). What
stays open is the bullet above, whether a failed sequence should still run its closing beat.

### 39.10 [x] CHANGE — the intake-link button is named for the intent

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3910-x-change-the-intake-link-button-is-named-for-the-intent); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.11 Answered 2026-08-31 — not work

**"Other ways to send it — are those Chrome's built-in options, or do we have influence over that?"**
The button is ours, and so is its wording and the payload; what it opens is not. It calls
`navigator.share()`, which hands over to the phone's own share sheet — we choose the title, text and
link, and nothing about which apps appear or how the sheet looks. Where the browser has no
`navigator.share`, we write the link to the clipboard, and where that fails too we put the link on
screen in a read-only field ([intakeInviteDialog.js](src/modules/clients/intakeInviteDialog.js),
§26.3).

**"Where did you get the demo phone number? Can it be some operator SMS echo service?"**
`+386 41 234 567` is invented in the story script — a well-formed Slovenian mobile number with an
obviously fake tail. It reaches nothing, and nothing is sent: the step composes the message and the
story never taps send. I know of no Slovenian operator echo service and will not claim one exists.
If the point is a number that is provably nobody's, the clean answer is a range a regulator has
reserved for fiction — the UK and the US both publish one, and whether AKOS does is a question for
their numbering plan, not something to guess at.

### 39.12 [x] BUG — a deep-linked clipboard showed a placeholder instead of the session

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3912-x-bug-a-deep-linked-clipboard-showed-a-placeholder-instead-of-the-session); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.13 [ ] BUG — the ⋯ menu says "this session" and deletes several

**Raised 2026-08-31 (Simon)**, from the title work: *"the new title mechanics makes also sense from
'merged plans from overlapping sessions' too, just the ... menu does not make sense in that case (we
might need multiple edit menu entries?)"*

**Half of it was mine and is fixed.** The new title bar read `titles[0]`, so a clipboard covering two
overlapping slots was named after whichever sorted first. `buildSessionMeta` collapses overlapping
sessions, so `titles` and `ids` are arrays, and the collapsed clipboard bar has always joined them
with `" + "` ([sessionBar.js](src/modules/session/sessionBar.js)). Both title builders now do the
same, pinned by [test_clipboard_title.py](tests/medium/test_clipboard_title.py).

**The other half is real, and narrower than "multiple edit entries".** Read against the code:

- **Edit plan** and **Copy this plan to…** act on the ACTIVE CLIENT's plan, not on a session. They
  mean exactly one thing whether the clipboard is merged or not.
- **Everyone on this plan** is about the people in the room. Same.
- **Delete Session** is the one that lies. `deleteScheduledSession` removes every session matching
  `sessionBelongsToSlot`, which tests `sourceSession.ids.includes(session.id)` — so on a merged
  clipboard it takes **all** the slots off the board, while `confirm_delete_session` asks about
  *"this session"*, singular, and the trainer has no way to see how many they are agreeing to.

So the menu does not need splitting; the destructive item needs to name what it will actually do.
**Open question for the maintainer**: when a clipboard covers two slots, should Delete take both
(saying so, with the count and the names), or offer them separately?

### 39.14 [ ] QUESTION — two decisions still open on the clipboard's title bar

Both raised 2026-08-31 while §39.6 was being built, both rendered for a decision rather than argued.

1. **Where the ⋯ sits.** *"should we move the tree dots menu to the left of session name?"* Measured:
   the title block gets 240px whether ⋯ leads the action cluster or trails it, and 234px at the far
   left — so this is not about space. The far-left slot is the `.view-grabber`'s (close the session,
   go home), and the app's own convention puts menus on the right: the ☰ is top-right, and the story
   card teaches it as *"the top right corner"*.
2. **~~Whether the editor's second line matches the clipboard's.~~ Done 2026-09-01**, after it was
   reported twice: *"edit scrin title is not unified with clipboard title"*, then *"edit screen still
   has session name in the form of a tag (button?) instead of normal title like the clipboard"*.

   Measured first, and it corrected the report: the session's NAME was already identical in both —
   15px, weight 600, no background, no border. The tag was the second line, where the editor wore a
   10px uppercase pill with a border and a red tint for the day and time the clipboard sets as plain
   muted text. It now borrows the clipboard's own `.clipboard-title-when` class rather than declaring
   a twin, so the two cannot drift apart again, and the client's name joins that line.

   **The pill's colour said "running right now" and nothing else did** — but the word it wrapped
   already says it (`Today`, `Yesterday`), and colour is the half of that a colour-blind trainer
   cannot read. Dropping the pill loses no signal; it leaves it where it was always legible. 39 lines
   of now-dead pill CSS went with it.

### 39.15 [x] BUG — the plan-fit meter looked like a button and explained itself only on hover

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3915-x-bug-the-plan-fit-meter-looked-like-a-button-and-explained-itself-only-on-hover); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.16 [x] CHANGE — the fit meter warns before the hour is gone, and costs a set by its reps

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3916-x-change-the-fit-meter-warns-before-the-hour-is-gone-and-costs-a-set-by-its-reps); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.17 [~] CHANGE — deleting a session earns ceremony proportional to what it destroys

**Reported 2026-09-01 (Simon):** *"delete session is quite an intrusive operation, should have a
clear warning popup / when a session was already started it should be even clearer warning / also
delete operation should prevent misclicks or in the pocket deletes (maybe a slide button to confirm
deletion?)"*, and *"did I understand it right and we need to define behaviour on delete? it should
orphan all plans in that session when delete is clicked"*.

**He understood it right, and that half already ships.** `deleteScheduledSession`
([sessionLifecycle.js](src/controllers/sessionLifecycle.js)) snapshots every participant's programme
into `state.history` as an unscheduled planning record before taking the session off the board, and
`confirm_delete_session` already says so: *"each participant's plan is kept under Unscheduled
plans"*. An EMPTY plan is not rescued, deliberately — there is nothing in it to re-run.

**What is missing is everything around it:**

- **It is a native `confirm()`** — a system dialog one tap from destruction. It cannot name the
  session, cannot show what is in it, and cannot carry this repository's own destructive-button
  treatment ([test_destructive_button_affordance.py](tests/medium/test_destructive_button_affordance.py)).
- **A started session gets the identical warning as an untouched one.** There is no `started` branch,
  so deleting mid-workout shows the same sentence while "logged progress and feedback are discarded"
  now means sets actually performed in the gym.
- **It deletes more than it says** on a merged clipboard — §39.13.

**Design, with ceremony scaled to what is destroyed:**

| | What the dialog says | To confirm |
| :-- | :-- | :-- |
| Future, untouched | Names the session; the plans stay under Unscheduled | Destructive button, set apart |
| Merged | Names **every** session it removes, with the count | Same |
| Already started | Names what cannot come back — *"4 sets logged for Jane, 2 for John"* | **Slide to confirm** |

**Slide, ruled 2026-09-01:** *"I'd say slide is harder to have clicked in the pocket for delete
operation."* It costs a keyboard and screen-reader path, and this screen already uses drag for
reordering rows and the grabber for closing the session — so the slider is reserved for the one case
that earns a third drag idiom, and every other delete stays a button.

**State 2026-09-30:** the future and started rows of the table shipped (`5da23e1`). The question
names the session with its date and time; a started session lists the logged sets per participant
and is deleted only by sliding from the handle to the end (a tap on the track does nothing; End on
the keyboard confirms). **Open:** the merged row, which waits on §39.13's ruling of what a delete on
a merged clipboard takes.

### 39.18 [x] FIX — the gate's worker split had gone stale, and it cost half the run

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3918-x-fix-the-gates-worker-split-had-gone-stale-and-it-cost-half-the-run); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 40. [x] Two workspaces — the trainer's own work, and a sandbox to learn in — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#40-x-two-workspaces-the-trainers-own-work-and-a-sandbox-to-learn-in-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 41. [Brainstorm] A wide screen shows more than one thing at once

**Asked 2026-09-10 (Simon):** *"desktop/tablet version should utilize whole available space by
displaying multiple programs at once (just like split screen tabs), defaulting to last viewed
clients or at session start, just first 3 picked from client list"*.

The app is laid out for a phone held in one hand, and on a tablet or a desktop that layout is one
narrow column with empty space either side. A trainer running a group switches between participants
one at a time on a screen with room for several.

### 41.0 REDIRECTED 2026-09-11 — planning gets the columns, the clipboard does not

**Ruled (Simon):** *"večstolpični pogled raje uporabiva za načrtovanje treningov"*, and then
*"štartaj implementacijo seje priprave načrtov"*. This overrides §41.1's "the clipboard goes first".
Everything below stands as written; what changed is WHICH screen gets columns, and it changed for
reasons §41.4 had already written down against itself.

- **The width exists where the trainer sits.** §41.4's first objection is that the gym floor is the
  judge and a wide layout serves a desk. Planning IS the desk activity. The objection does not apply
  to it; it applied to the clipboard.
- **§41.4's safety argument disappears.** The clipboard is where data is WRITTEN live — sets, quick
  signals, timers — and one participant per screen with thumb-sized targets is what keeps a mis-tap
  from logging a set against the wrong person. Planning writes a plan. A wrong drop is visible and
  undone before anybody trains.
- **Comparison is the actual need in planning.** Building a group session for three people is where
  "the same for everyone, except Ana's knee" is decided, and that decision wants the three
  programmes side by side. During execution the trainer looks at ONE person, because they are
  standing in front of them.
- **Dragging between columns is what makes it worth building, and §41.4 named it as the likeliest
  bug.** In planning it is the feature; in execution it is a gesture with two meanings.
- **The schedule risk drops with it.** §41.2's hard part is that recovery after a reload reads the
  address bar. In a live session being wrong there loses a session; in planning it costs some
  retyping. **So the first slice does not touch the route grammar at all.**

**What the code already gives us, read 2026-09-11 before any of it was written:**

- `currentPlanMode()` ([activeSessionStore.js](src/controllers/activeSessionStore.js)) already
  returns `live` / `future` / `planning`, so "planning" needs no new concept — it has one.
- The editor is already a function of ONE participant:
  [activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js) calls
  `renderClipboardEditor(deckContainer, { activeClientState, clientName, … })`, and the plans live
  per client in `clientRoutines[clientId]`. Columns mean calling it N times into N containers, not
  taking it apart.

**Two obstacles, both small and both found by reading rather than by running into them:**

- [clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) writes one fixed
  `id="clipboard-editor-ex-names"` — the exercise-name datalist. N editors would mean N identical
  ids. One shared list above the columns.
- [editModeState.js](src/modules/clipboard/editModeState.js) holds ONE `editorRowId` for the whole
  module, meaning "which row is open". With columns that becomes an answer per column. The same
  shape of question as §41.2's routes, but it stays inside the module and never reaches session
  recovery.

**Still ruled, and unchanged:** the clipboard stays one participant at a time until somebody shows
that it is missing on the floor.

### 41.1 Two layouts, not one

**Ruled 2026-09-10 (Simon), and §41.0 has since redirected which screen this applies to first.** They share the rule for dividing the width and nothing else:

| | The clipboard (live session) | The home screen |
| :--- | :--- | :--- |
| What a column holds | one participant's programme | one view taken from the menu |
| How many | *"1/2/3/4/5/.. odvisno od prostora in števila udeležencev"* | as many as the same rule allows |
| Are the columns alike? | yes — the same view, once per participant | no — different views side by side |
| Per-column state | **each programme is independently in EDIT or EXECUTE mode** | each view is itself |

*"clipboard pokaže 1/2/3/4/5/.. programov hkrati odvisno od prostora in števila udeležencev, vsak
program je individualno lahko v edit ali execute načinu (popravi deep linke)"* — so the count is not
a fixed three: it is what the width allows, bounded by how many participants the session has.

**The clipboard goes first.** Its columns are alike and the rule for filling them is already ruled;
the home screen still has to choose what goes in them (§41.3).

### 41.2 The deep links are the hard part, and they are ruled to change

A route today names ONE session and ONE client, and three shapes carry the mode:

```
/session/:sessionId/client/:clientId                         execute
/session/:sessionId/client/:clientId/edit                    edit
/session/:sessionId/client/:clientId/edit/exercise/:slotId   edit, one row open
```

With several columns, each in its own mode, the address has to name a SET. Proposed — **the focused
column keeps the path, the rest ride in the query**:

```
/session/:sessionId/client/:clientId?with=c7:edit:slot3,c9
```

Why this shape rather than a new path grammar: **every link ever shared keeps working and keeps
meaning.** A link with no `with=` is exactly today's link — that client, alone or focused — so the
demo scripts, the walkthrough's steps and every message a trainer has already sent stay correct, and
the multi-column state is additive.

What this touches, and why it is the schedule risk rather than the layout:

- **Recovery after a reload reads the address bar** to know whether the trainer was in the editor and
  which row was open ([sessionLifecycle.js](src/controllers/sessionLifecycle.js)). Per-column mode
  makes that a set of answers, in the one path where being wrong loses a session.
- [sessionFocusUrl.js](src/controllers/sessionFocusUrl.js) syncs the focused card INTO the URL on
  every render. With several columns, "the focused card" needs a definition before that sync can be
  written.
- The demo story and the guided walkthrough assert on routes (§35, §38). They are the regression net
  for exactly this screen.

### 41.3 Which views the home screen shows — the choosing rule first

**Wanted 2026-09-10 (Simon):** *"domača stran pa pobere več vpogledov iz menuja in jih prikaže hkrati
(z enako logiko porazdelitve), pomagaj mi izbrati katere"*.

The menu offers: **Clients Directory**, **Pending Review** (plan adjustments), **Plans**,
**Exercises**, **History**. The dashboard already carries two more without being asked: the **session
deck** and the **message feed**.

**The rule to choose by: a column earns its place by being WORK THE TRAINER OWES, not a place to look
something up.** A lookup is one tap away and is remembered as a need at the moment it arises. Work
owed is what gets forgotten, and a column is worth its width only if it is looked at without being
sought.

Recommended, at desk width:

| Column | What it is | Why it earns the width |
| :--- | :--- | :--- |
| 1 · Sessions | today's deck | it is what the app is opened for; leftmost because it is what they came for |
| 2 · Pending Review + messages | plan adjustments awaiting a decision, and the feed | the only two surfaces that are work owed rather than reference; the feed already ranks unfinished work above FYI |
| 3 · Plans | the programme library | what a trainer prepares between sessions, and where an adjustment is acted on |

**Deliberately not columns:** Exercises and History are reference material, reached from a plan when
a question arises. The Clients Directory is a way to REACH a person — and everyone on today's board
is already in column 1.

**The one open swap:** column 3 is Plans or Clients depending on a habit only the maintainer can
report — after looking at today, what do you open next: the plan you are changing, or the person you
are changing it for?

### 41.4 Red team — the strongest case against the whole idea

Written against it on purpose. Nothing here is a refusal; it is what has to be answered before this
is worth building.

1. **The judge is the gym floor, and this is a desk feature.** Value 13 says a decision that only
   makes sense at a desk is wrong. A wide layout serves a trainer sitting down. Before any of it:
   how many of the trainers in the go-to-market plan own a tablet they would carry to a session?
   If the answer is "the maintainer's own", the audience is one.
2. **The clipboard is where data is WRITTEN, and its narrowness is a safety property.** Sets, quick
   signals, timers. One participant per screen with thumb-sized targets is what keeps a mis-tap from
   logging a set against the wrong person. Five columns makes those targets smaller and puts another
   client's row a thumb-width away — against the standing rule that touch targets get real padding.
3. **Two modes on screen at once is the likeliest source of a data-loss bug in the whole idea.** Edit
   mode is drag-to-reorder; execute is tap-to-log. Side by side, a drag that starts in one column and
   ends over another is a gesture with two meanings and no obvious right answer.
4. **The route space multiplies, in the one place that must not break.** §41.2 lists what reads a
   route; recovery after a reload is among them. The layout is a stylesheet problem; the addressing
   is not, and that is where the time will actually go.
5. **The test matrix multiplies with it.** The medium tier's stubs assume one column and the e2e
   suite asserts on "the in-focus card"; both land in the slowest stage of the gate.
6. **The home screen risks becoming a dashboard — a thing that is READ rather than used.** And since
   the phone still shows one column, every feature after this is designed twice.
7. **Sequencing.** [docs/PREVIEW.md](docs/PREVIEW.md) still tells trainers this build can lose their
   data, and the ranking at the top of this file puts data safety and showability above everything.
   A wide-screen layout moves neither.

**Answered 2026-09-10 (Simon), and it moves the ground under most of the above:**

> *"res je večina trenerjev ima telefon"* · *"več vrstični clipboard je feature predvsem za večerno
> urejanje načrtov za računalnikom, ne live delo"* · *"again smiselno samo za evening planiranje sej"*

**The multi-column clipboard is an EVENING PLANNING feature, at a computer — not a gym-floor one.**
That is a different product decision from the one argued against above, and it settles three of the
seven objections rather than answering them:

- **(1) audience** — conceded and reframed. Most trainers have a phone, and the phone keeps its one
  column. The wide layout serves the evening, on a machine that is already sitting on a desk, which
  is the one context where a desk-shaped answer is the right one.
- **(2) thumb-sized targets** — falls for the evening. Nobody is logging a set into five columns at
  arm's length; the evening has a mouse and a keyboard. **It does NOT fall for the live case below.**
- **(3) two gesture modes at once** — falls as a hazard in the evening, and comes back as an
  OPPORTUNITY (§41.6): with several plans open in edit at once, dragging an exercise from one
  client's plan into another's becomes possible, and no single-column layout can offer that at all.

**Corrected the same day, by the maintainer's own Tuesday:**

> *"primer uporabe clipboarda (1 ali 3 stolpce) je moj torkov trening: tri stranke vsak svoj program
> hkrati"*

**So the live case is real, and it is the maintainer's own weekly session:** three clients training
side by side on three different programmes. One column on a phone, three on a tablet — the count
follows the device, which is what "odvisno od prostora" already said. Objections (2) and (3) stand
for that case and are settled only for the evening one, so the layout has to serve both without
carrying the evening's gestures onto the floor.

**The rule that lets it: the per-column MODE is the safety boundary, and it was already ruled.**

| A column in EXECUTE | A column in EDIT |
| :--- | :--- |
| the gym floor: logging sets, signals, timers | planning: reordering, adding, removing |
| thumb-sized targets, no drag gestures at all | drag is the point |
| **never accepts a drop from another column** | may exchange exercises with another EDIT column |

Cross-column drag (§41.6's opportunity) is therefore allowed **only between two columns that are both
in edit**, and an executing column is inert to it. That is one rule, it needs no mode switch of its
own, and it means the Tuesday session on a tablet — three columns, all executing — has exactly the
gesture surface the single-column clipboard has today.

**What survives, unchanged:** (4) the routes, (5) the test matrix, (6) the two-experience problem —
sharper now, because the phone and the desk stop being the same layout by design rather than by
accident — and (7) sequencing.

**The question the evening framing raised — whether this belongs in the plan editor rather than the
live clipboard — is answered by the Tuesday case: the clipboard.** It is the screen a session is run
on, and running three programmes at once is the case. The evening then uses the same screen with its
columns in edit mode, which is what the per-column mode is for.

**Two cheaper things that take most of the value, worth measuring before the full build:**

- **A participant rail.** On a wide screen, a fixed strip of participant names down the side of the
  single clipboard column: switching becomes one tap instead of a swipe, targets stay thumb-sized,
  and **no route changes at all**. It answers the complaint the request came from — switching one at
  a time — at a small fraction of the cost, and it is not thrown away by a later multi-column build.
- **Two columns before five.** Pair training is the common case above one; two columns can be built
  with the focused-column route shape and no gesture ambiguity worth the name. Five is a different
  product decision, and it can be taken after two are in front of real trainers.

For the home screen, the equivalent cheap answer is **widen rather than split**: one column at a
comfortable measure, with the deck showing more days at once. It uses the space without inventing a
second layout to maintain.

### 41.5 Is the query-string shape a problem — "it is not REST"

**Asked 2026-09-10 (Simon):** *"dobra rešitev, ni pa REST, naju bo to ugriznilo kasneje?"*

**REST is not the standard this has to meet.** REST is an architectural style for a SERVER's HTTP
interface — resources, representations, verbs, statelessness between requests. There is no server
here: the address bar is read by a client-side router, and the only three properties that matter are
that an address identifies a state, survives being sent to somebody, and can be read back after a
reload.

Against the convention that does apply — path names the resource, query names a VIEW over it — the
shape is orthodox rather than irregular. `?tab=`, `?sort=`, `?w=1` are the same thing everywhere on
the web: the thing being looked at is in the path, how it is being looked at is in the query. A set
of open columns is a view over one session, not a resource of its own.

**What could bite, concretely, and what to do about each:**

| Risk | Answer |
| :--- | :--- |
| Two strings for one view (`with=c7,c9` vs `with=c9,c7`) — history entries and cache keys multiply | the writer CANONICALISES: sorted by column position, deduplicated, empty means absent |
| The URL churns on every render, because the focused card is synced INTO it ([sessionFocusUrl.js](src/controllers/sessionFocusUrl.js)) | canonical form again, plus write only on change — the churn is what canonicalisation exists to prevent |
| Route matching ignores the query, so `activeRouteName()` cannot see column state | already true of `?demo=`/`?step=`, and already handled: `replaceQueryParam` lives in the router because [test_url_writers.py](tests/unit/test_url_writers.py) forbids anyone else writing history |
| Long addresses with many columns and slot ids | local use, no server, no 2KB limit in play |
| "Deep-link one column alone" later | that is exactly today's path form, with no `with=` — the two compose rather than conflict |

**Ruled 2026-09-10 (Simon): the layout is REMEMBERED, not addressed.** *"zapis postavitve je dovolj
dobra rešitev, saj delimo vedno povezavo za neznan prikazovalnik"* — the focused column keeps the
path exactly as today, and the rest of the layout lives in `localStorage`.

The reason is stronger than the cost argument that suggested it: **a link is always sent to a screen
nobody can see.** A three-column layout carried in an address arrives on someone's phone, where three
columns do not exist — so the address would be describing a state the receiving device cannot enter.
A layout is a fact about THIS screen, and a screen is not something a URL can name.

What each side then carries:

| The address | The local record |
| :--- | :--- |
| which session, which client is focused, and — as today — whether that one opens in edit | which columns are open, each one's mode, and the row each has expanded |
| survives being sent to anybody | survives a reload on this device only |

**Precedence on arrival, and it is a rule this codebase already follows:** an address that ASKS for
something wins over what the device remembers — the same way `?lang=` overrides the stored language
and `?workspace=sandbox` overrides the stored workspace (§40.9). So a link naming `/edit` opens that
column in edit whatever the record says, and the record is then updated to match. With nothing asked
for, the record decides.

### 41.7 How a reload comes back with two plans in edit

**Asked 2026-09-10 (Simon):** *"kako pa reload page-a lahko ohrani 2 načrta v edit mode-u?"*

**Because edit mode holds almost nothing.** It is not a transaction (§41.6): every plan change is
written the moment it is made, so what has to survive a reload is a flag per column and, at most,
which row is expanded — not a document, not a pending save, not a diff.

Concretely, the record is per workspace and per session:

```
librept_clipboard_layout   →   { sessionId, columns: [ { clientId, mode, openRow }, … ] }
```

- **Per workspace** by the ordinary key suffix (§40.1), so a sandbox reset drops it with everything
  else that sandbox held.
- **Keyed by session**, so it is meaningless the moment that session is finished, and a record naming
  another session is ignored rather than repaired.
- **Read defensively**, the same rule the remembered route follows ([lastRoute.js](src/data/lastRoute.js)):
  a column naming a client who is no longer a participant is dropped on read, and an `openRow` naming
  a row that is gone is dropped by the validation the router already performs.

**What is deliberately NOT restored:** anything half-typed in an input. That is a different problem
with a different answer already shipped — [formDraft.js](src/modules/common/formDraft.js) keeps
half-filled forms in `sessionStorage`, per subject, and drops them on submit or cancel.

The order on the way back in is the order §40.3 already established for a workspace switch: the
address is set first, the live session is recovered from its cache — which is what supplies the
participants the columns are drawn for — and only then is the board drawn, from the record.

### 41.6 What happens when a second column is put into edit

**Asked 2026-09-10 (Simon):** *"a to pomeni, da edit novega stolpca zapiše prejšnji plan in prestopi
edit mode v novem, a to hkrati zamenja vrstni red stolpcev?"*

**There is nothing to write.** A plan edit is persisted the moment it is made — every splice funnels
through `saveActiveSessionToCache()` ([sessionPlanEditing.js](src/controllers/sessionPlanEditing.js))
and from there through the ordinary save path. **Edit mode is not a transaction**: it is a display
mode that shows drag handles and the add/remove controls. So "entering edit elsewhere" has no plan to
commit, and leaving edit has nothing to discard — which is also why there is no Cancel on it today.

That leaves two real questions, and they are independent of each other:

1. **Exclusive or concurrent edit.** Recommended: **concurrent** — the original ruling ("vsak program
   je individualno lahko v edit ali execute načinu") is also the one that unlocks the feature only a
   wide layout can have: **dragging an exercise from one client's plan into another's**. Exclusivity
   would rule that out to prevent a hazard (§41.4's third objection) that the evening reframing has
   already dissolved.
2. **Column order.** Recommended: **fixed**, and never reordered by interaction. Order follows the
   session's participant order. A column that moves under the hand is the classic way to make someone
   act on the wrong one, and here "the wrong one" is another client's programme. What DOES change on
   a narrower window is which columns are visible — that is scrolling or paging, and it must not be
   confused with reordering.

## 42. The clipboard, read at a glance — expand all, and cards worth expanding

**Reported 2026-09-10 (a trainer, via Simon):** the clipboard *"mora biti bolj pregleden"* — the deck
shows one card open and the rest as peeking rows, which is compact and does not answer *what is the
whole session*.

### 42.1 [x] Expand all — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#421-x-expand-all-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 42.2 [x] Measured: why expanding alone does not finish the job — closed 2026-09-10

Closed by §42.3, which re-measured the same stub after the change — the reasoning and the before
numbers are in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#422-x-measured-why-expanding-alone-does-not-finish-the-job-closed-2026-09-10).

### 42.3 [x] One card design, opened up — ruled and shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#423-x-one-card-design-opened-up-ruled-and-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md). The chrome question it left open is §42.13.

### 42.4 [x] Expand all is a SETTING — shipped 2026-09-10, halved by §42.14

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#424-x-expand-all-is-a-setting-shipped-2026-09-10-halved-by-4214). One of the two settings is left: the day's session cards.

### 42.5 One head row, however open the card is

**Reported 2026-09-10 (Simon):** *"kartice imajo zanimiv past tag v naslovni vrstici, expanded card
pa da past tag nad ime kartice, popravi, da ostane enak izgled expanded in collapsed"*.

The collapsed row put the tag at the end of the title row; the expanded card put it on a line of its
own above the name. One card read as two designs depending on how open it was — and on the past card,
where the tag says which session the history came from, the tag moved furthest.

Every card shape now draws the SAME head row in every state: number or icon, name, tag, and whatever
control belongs at the end. The focused card's name grows so it is still readable at arm's length
mid-set, but the row, the order and the tag's place do not move — that is what makes three states one
design.

It also takes the first of §42.3's savings: folding the top row into the name line is ~32px off every
expanded card, which is what "expand all" spends its screen on.

### 42.6 A collapsed circuit names its movements

**Asked 2026-09-10 (Simon):** *"a lahko skrčene kartice za circuit prikažejo tudi imena vaj, težo in
ponovitve (brez gumbov)?"* — shipped the same day, see [CHANGELOG](CHANGELOG.md).

"Tri-Set Metabolic Circuit" with a round badge said only that three unnamed things were coming, while
every other collapsed card already said what the trainer was looking at. It lists each movement with
its reps and load now, in the same rows the open card draws, minus the actions — the rule every card
that is not in focus follows (§42.1).

**Found by looking at the real app rather than the stub:** a rest INSIDE a circuit is a member like
any other and has no name or reps, so asking it for them printed a line reading `undefined` under
every circuit in the deck. The medium-tier fixture had no rest inside its circuit; the seeded demo
data did.

### 42.7 A theme's colours may only be written in that theme

**Reported 2026-09-10 (Simon), twice, one cause:**

> *"nebula tema vizualno premalo loči pretekle kartice od aktivne seje"* · *"midnight tema: past
> kartice so obdržale nebula barvo ob preklopu na midnight?"*

The deck's stylesheet painted past cards in `rgba(139, 92, 246, …)`. That is `#8b5cf6` written out,
which is **nebula's `--primary`**. So the colour followed the app into every theme — in midnight it
painted nebula's violet over an emerald palette — and in nebula itself it painted the accent, which
is why the session being RUN and a session from July wore the same colour. The badge in the corner
had been reading `--temporal-past` all along; the card under it disagreed.

Both halves are fixed: the card takes its tint from `--temporal-past` through `color-mix`, and
**nebula's own `--temporal-past` moves off its accent** to a cooled slate. Every other theme can say
"past" in purple because its primary is emerald, pink or red; nebula's is violet.

**A ratchet holds the line** ([test_theme_colours.py](tests/unit/test_theme_colours.py)): no
component stylesheet may spell out a value a theme defines. There are **21** such colours today,
across a dozen files, each a small judgement about which token it should have been — so the check
fails when the number goes UP, exactly like §38.20's UI-strings sweep, and `BASELINE` comes down as
the sweep proceeds.

**Open:** the sweep itself, and whether midnight's `--temporal-past` (`#c084fc`, purple) is what its
palette wants now that the card actually obeys it.

### 42.8 [x] No badge on the card in focus — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#428-x-no-badge-on-the-card-in-focus-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 42.9 [Open question] Does the active circuit card still need its timer?

**Asked 2026-09-10 (Simon), undecided:** *"genuine question undecided — should we remove the timer
from the active circuit card"*.

What is on the card today: a ⏱ in the head row that starts a rest timer, and — since §42.6 — a
`Rest · 60s` line for each rest the circuit actually contains.

**The case for removing it:** a circuit that names its own rests already says when the trainer stops
and for how long, and each of those break rows starts that rest itself on the open card. A second
control that starts an unnamed timer of its own is a second answer to one question, on the card with
the least room for it.

**The case for keeping it:** the plan's rest is what was written down; the rest a trainer actually
takes in a circuit is a decision made in the room. The ⏱ is the one that times what is happening
rather than what was planned.

**What would settle it, and it is cheap:** whether anybody uses it. Ask the trainer who reported the
clipboard's legibility whether they have ever started a circuit's timer from the head row rather than
from a break row.

### 42.10 [x] The sandbox says where its own exit is — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4210-x-the-sandbox-says-where-its-own-exit-is-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 42.11 [x] The expand-all menu item wears the app's own chevron — fixed 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4211-x-the-expand-all-menu-item-wears-the-apps-own-chevron-fixed-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 42.12 [x] In the sandbox the badge is a marker, not a link — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4212-x-in-the-sandbox-the-badge-is-a-marker-not-a-link--shipped-2026-09-10).

### 42.13 [x] Should an expanded card keep its border and shadow? — dissolved 2026-09-11

Closed without being answered: §42.14 removed the expanded tier the question was about. The reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4213-x-should-an-expanded-card-keep-its-border-and-shadow-dissolved-2026-09-11).

### 42.14 [x] The clipboard's expand-all is gone — removed 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4214-x-the-clipboards-expand-all-is-gone-removed-2026-09-11).

## 43. [Brainstorm] The client's own copy: their plan, their feedback

**Asked 2026-09-10 (Simon):** *"should we enable plan sharing and letting clients record too hard too
easy and notes themselves and share feedback with PT post excersize?"*

Today the trainer holds the clipboard and logs everything: the sets, the Too Easy / Too Hard signals,
the notes. The client's own device already appears in the product twice — the intake page they fill
in themselves (§26/§1.7) and the RSVP reply (§1.6) — so the route exists and the privacy posture is
written down. This asks for a third: the client sees their plan, and answers back on it.

**Two features, and they should not be decided together:**

1. **Plan sharing** — the client can SEE what they are meant to do, on their own phone, between
   sessions. Read-only, and mostly a publishing problem: what a plan looks like with no app around
   it, how the link is issued and revoked, and what it exposes if it is forwarded.
2. **Client-side feedback** — the client records too easy / too hard / a note against an exercise,
   and it reaches the trainer. That is a WRITE from a device the trainer does not control, and it
   lands in the trainer's training record.

Open before either, and the second is where the weight is:

- **Where does a client's answer live until the trainer accepts it?** The app has a shape for this
  already — an intake submission is reviewed before it becomes a client (§26.5) — and the same rule
  looks right here: nothing a client sends edits the training record until the trainer has read it.
- **Offline is the trainer's promise, not the client's.** The whole product works with no network; a
  client's phone in a basement gym does not sync. What happens to feedback typed with no signal?
- **What the link exposes.** A plan carries a person's name, their programme and their loads. A
  forwarded link must not be a data breach, which means the same question §31 asked of the support
  wipe: what authority does a link carry, and for how long?
- **Whose words are they?** A client's note is their own account of their own body. It is not the
  trainer's clinical note, and mixing the two into one field would make the record impossible to
  read later and awkward under Art. 15 (§27).
- **The gym floor is still the judge.** A trainer running three people cannot also be moderating an
  inbox. If accepting feedback is not one tap from where they already are, it will not happen.

**What it would be worth:** the two things a trainer currently reconstructs from memory — how the
work actually felt, and what the client did between sessions — arrive as data instead. That is the
same argument the asynchronous plan adjustments in
[uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md) already won.

### 43.1 Three features, not two — and the aim is the third

**Aimed 2026-09-10 (Simon):** *"ciljava na post workout feedback"*.

The two above split into three once you ask **when** the client is holding their phone, and the three
have different costs:

1. **Plan sharing** — she looks at her programme between sessions. A publishing problem.
2. **In-session self-report** — she presses Too Easy / Too Hard herself, on the floor, while the
   trainer is standing there.
3. **Post-workout feedback** — hours or days later, at home: how it felt, whether it hurt the next
   morning, whether she slept.

**The third is the target, and it is also the strongest of the three.** It carries what the trainer
cannot get on the floor at all. Soreness arrives 48 hours after the session that caused it; the
trainer is not there and the clipboard is closed. Today that information reaches them as a chat
message at 21:00, against no session and no exercise, and is gone by the time next week's plan is
written.

It is also the cheapest: **once per session, tiny, asynchronous, and it has a screen already** —
pending review, which [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md)
built for exactly this shape of arrival.

**Against the second.** In-session self-report is the one to be most careful with, because it looks
like a small addition to something that already exists and is not. Too Easy / Too Hard are already
on the cards ([exerciseCard.js](src/modules/clipboard/exerciseCard.js),
[circuitCard.js](src/modules/clipboard/circuitCard.js)) as the **trainer's** signals. A client
pressing the same button is **not the same measurement wearing a second author** — the trainer's is
an observation, hers is a perception, and *the gap between them is the useful part*: she says brutal,
the trainer saw easy, and that is the conversation. **They must never share a field.** Merged, the
plan adjustment is fed a contradiction and nobody can tell afterwards which of the two it obeyed.

### 43.2 The carrier is the problem, not the feature

**There is no server, and that is the whole product.** Every client-to-trainer message today is a
file the client sends through their own messaging app
([signupDelivery.js](src/modules/intake/signupDelivery.js)).

**That works at intake because intake happens once**, and the payoff is immediate and obvious: fill
this in and you get to train. Post-workout feedback is the opposite — a **repeated** act with a
diffuse payoff. A client will do it twice and then stop, and a feature that decays to nothing is
worse than none, because the trainer will have stopped asking in person.

So the design question is not what the client's screen looks like. It is **what carries a small
message from her phone to the trainer's, every week, for a year, with no server.** Every answer has
a cost that must be named before anything is built:

- **A file per session, sent by hand.** Works today, nothing to build, and it is the one that decays.
- **A page she keeps** that accumulates answers locally — then still has to hand them over, with the
  same problem one step later.
- **The trainer's Drive as a drop box.** Breaks the privacy posture: it is the trainer's own storage,
  and giving clients write access to it is not a small change to §3.9.
- **A server.** Answers it properly and ends the product this is.

### 43.3 The cheap shape: build the ask and the filing, not a client app

The version that fits the architecture instead of fighting it, and is a fraction of the work:

- **The app composes the question** — the same shape as the intake invitation
  ([intakeInvite.js](src/modules/clients/intakeInvite.js)), which already solves "a message from an
  unknown number that must not read like phishing": the trainer's name first, one tap to send.
- **The client answers in an ordinary chat**, which is where she already messages the trainer at
  21:00 anyway. Nothing to install, nothing to keep, nothing to update.
- **The app makes it one tap to file that reply** against the right session and the right client, and
  pending review is where it lands.

**A client-side app is a second product** — its own onboarding, its own updates, and support calls
from people who are not the trainer's customers and cannot be reached. The intake page is the
precedent for how far to go: a stateless page with no database, used once.

### 43.4 Two things to decide that are not technical

- **Duty to read.** If the app accepts a message saying someone is in pain, there is an expectation
  that it is read. The product's own disclaimer says this is not medical or coaching advice, and an
  unread pain report three days old is a professional problem rather than a bug. **Whether the app
  may accept health information it does not promise to surface is the first question**, ahead of any
  screen.
- **Health data on a second device.** A client typing about her knee creates health data outside the
  trainer's device and a channel carrying it. The consent form
  ([docs/templates/](docs/templates/INDEX.md)) covers what the **trainer** holds. It would have to
  cover this, in the same pass, or the feature ships ahead of the paperwork that legitimises it.

### 43.5 What it fixes in the demo

The evening chapter's card promises *"kaj se zgodi z zapiski, ki si jih delal med serijami"* — what
happens to the notes taken between sets — and then changes the colour theme. A client's reply landing
in pending review and turning into next week's plan **is** that payoff, and the chapter has been
missing it since it was written.

### 43.6 And if plan sharing is built anyway: date the copy

Not the aim, but worth recording so it is not re-derived. The moment the client holds a copy, the
trainer's clipboard is no longer the only one: a movement swapped on Tuesday leaves her copy saying
the old one, with nothing telling either of them. That is [§44](TODO.md) — silent rot — with a person
doing the wrong exercise at the end of it.

**A read-only snapshot, stamped with the day it was taken, that says plainly it is a copy.** Naming
the staleness defuses it. Pretending to sync without a server is what produces the injury.

## 44. [Idea] Detect and report stale or dead links, across versions

**Asked 2026-09-10 (Simon):** *"a way to detect and report stale or dead deep links passed around the
internet (across versions)"*, then, on reading a first draft that covered only the demo:
*"stale link detection ni samo za demo, temveč za vse"* — not only the demo, all of them.

*(First written the same day and lost: commit `283254e` rewrote the tail of this file and deleted the
section. Restored and broadened.)*

**Every link this app hands out is a promise made to a page that will keep changing.** They get pasted
into chats, forum posts, calendar invites and user documentation, and then they sit there for months.

**The general defect: every one of them degrades silently, deliberately.**
[shareLink.js](src/modules/common/shareLink.js) — the module that reads promo and deep-link
parameters off the address — documents the fallback for each: an unknown `theme` gives the default
theme, an unknown `lang` the saved one, an unknown `chapter` the whole story, an unknown `demo` or
`init` nothing at all, and an absent or unrecognised `workspace` **the trainer's own database rather
than the sandbox**. Routes do the same: `resumeWalkthroughAt` in
[domain/walkthrough.js](src/domain/walkthrough.js) starts the demo from the beginning when the step
id is gone.

Each of those fallbacks is right on its own. A mistyped link pasted into a chat should still show a
stranger something rather than an error page. Together they mean **no link can ever be observed to
have rotted** — it keeps working and shows the wrong thing.

**The links in question, and they are not all the demo's:**

- demo deep links naming a step or a chapter;
- promo links carrying `lang`, `theme`, `init`, `workspace`;
- app routes naming a session date or a client id — a link to a client since deleted;
- the **client intake link** in an invitation, and the privacy-notice URL sent beside it, both of
  which leave the app and land in somebody's messages;
- links inside this repository's own documentation.

**Two halves, and they are different problems.**

- **Links inside this repository** are ours to check.
  [agent_tools/doclinks.py](agent_tools/doclinks.py) — the tool that resolves every Markdown link,
  anchor and `§`-reference and fails the build on a dead one — could resolve the app's own link
  vocabulary too: a `step=` that names no step, a `theme=` that names no theme.
- **Links out in the world** cannot be checked from here. What is possible is for the **app** to
  notice it was handed a value it does not recognise, and report it rather than silently substituting
  a default. Where such a report goes, and whether a stranger's first screen is the right place to
  raise it, is the open question.

**"Across versions" is why this is not just a build check.** There are no release tags and no
multi-version hosting ([§16](TODO.md), [§18](TODO.md)) — one build is live at a time. A link made a
year ago is judged by today's code, with no older version to fall back to and no version axis to read
the link's age from.

**Decided already, so it is not re-derived:** **ids in links stay human-readable** — `swap-open-catalog`,
not a UUID. A UUID prevents an accidental rename and nothing else; a build check catches that too, and
the id is what a failing test, a debug message and a documentation URL all show a person. A UUID also
hides the one failure no check can catch — the id staying while the thing it names drifts.

**Deliberately not designed further** (Simon, same day: *"I am over engineering it"*). This is the
problem, written down.

---

## 45. Reported 2026-09-11 — the first trainer's feedback on using the app

A working personal trainer used the app and reported back. Simon relayed the list and ruled on every
item the same day; the rulings are marked below, and what is still a question is marked as one. This
is feedback on **the app in use**, not on the promotional pages (Simon, 2026-09-11) — so where a
report could mean either surface, the app is the one meant.

Ordered by cost, not by the order reported: the three defects first, then the new work, then the two
that are still questions.

### 45.1 [x] The first screen is English whatever language was chosen — fixed 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#451-x-the-first-screen-is-english-whatever-language-was-chosen--fixed-2026-09-11);
what shipped is in [CHANGELOG.md](CHANGELOG.md). The promotional page it left open is §45.15.

### 45.2 [x] The trainer can enter their own name, phone and email — shipped 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#452-x-the-trainer-can-enter-their-own-name-phone-and-email--shipped-2026-09-11);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 45.3 [x] The signup form asks for first and last name — fixed 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#453-x-the-signup-form-asks-for-first-and-last-name--fixed-2026-09-11);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 45.4 [ ] The share of a filled-in signup FAILED, and fell back to saving the file

**Reported:** sharing the completed signup back to the trainer did not work; the app offered to save
the file to the phone instead. The trainer read that as *"there is no email or SMS route"*.

**What the app is supposed to do.** The submission travels as a FILE, deliberately — UC8's whole
argument is that health detail must not sit in a URL, a message body or a carrier's logs
([uc8_client_self_onboarding.md](use_cases/uc8_client_self_onboarding.md)). `navigator.share({ files })`
hands that file to whatever the client already uses: their mail app, WhatsApp, Signal, Viber. So the
email route the trainer asked for exists, and the save-to-phone screen is the documented permanent
fallback for when the browser refuses the share
([signupDelivery.js](src/modules/intake/signupDelivery.js)), not an error path.

**SMS cannot be added, and this is not a preference.** Neither `sms:` nor `mailto:` can carry an
attachment on any platform — already established for the intake invitation
([intakeInvite.js](src/modules/clients/intakeInvite.js)). An SMS route would mean putting the
client's health answers into the body of a text message, where they persist in two message histories.
That is the exact thing UC8 was built to prevent.

**So the open question is why the share was refused**, on a device where it should have worked.
Candidates: a desktop browser (where `canShare({ files })` is false everywhere), iOS below 15, an
in-app browser inside a messaging app, or a file the browser judged unshareable. Until that is known,
no code change is justified — but the fallback screen's wording is a fair target either way, since
what the trainer read from it was "this route does not exist".

**REPRODUCED (Simon, 2026-09-11):** sending a filled-in form back to the trainer showed *"Deljenje ni
uspelo. Uporabi »Shrani datoteko za deljenje« in jo pripni sporočilu."* — `intake_send_failed`. So the
device is not one without a share sheet: `canShareSignupFile` returned TRUE (or the Share button
would have been hidden, [intakeView.js](src/modules/intake/intakeView.js)), and `navigator.share()`
then rejected with something other than `AbortError`. The browser said yes and then refused.

**The first suspect is the file's own extension.** The file is named `.json.librept-signup` with the
media type `application/vnd.librept.signup+json` ([signupFile.js](src/data/signupFile.js)) — both
deliberate, since the extension is the only thing that survives an email hop. But Chrome's Web Share
accepts only files whose extension is on its own allowlist, and a private extension is not on it.
Whether that is also what makes `canShare` disagree with `share` on this device is exactly what is
not yet known.

**What blocks the fix is that the app throws the answer away.** `shareSignupFile` captures
`error.message` as `reason` and the caller never looks at it
([signupDelivery.js](src/modules/intake/signupDelivery.js)): the client is told the share failed, and
nobody — client, trainer or maintainer — is told what the browser said. A failure that cannot be read
cannot be fixed from a report, and this one arrives from a stranger's phone, which is the least
reachable place in the whole product.

**The device: a Samsung Galaxy S23** (Simon, 2026-09-11). An Android phone with a share sheet, which
rules out the whole class of "this browser cannot share files at all" — and leaves the file itself,
or the browser's judgement of it, as what was refused.

**Asked the same day: can the extension be registered when the app is INSTALLED?** It already is, and
that is why it does not help. [manifest.json](src/manifest.json) declares both `file_handlers`
(Android opens a `.json.librept-signup` with LibrePT) and `share_target` (LibrePT offers itself when
someone shares one). Both are about RECEIVING. The failure is on the sending side, where the browser
consults its own list of file types a page is allowed to hand to the share sheet — a list no
manifest, installation or registration can add to. Nothing about install-time registration is
available to try here.

**Done 2026-09-11: the failure is now legible.** The refusal carries the browser's error NAME as well
as its message — a DOMException's name (`NotAllowedError`, `DataError`) is the half that says which
rule was hit, and its message is frequently empty — and the intake page prints it under the status
line, introduced as *"Your trainer may need this:"* so nobody reads a developer's error text as an
instruction to them. Untranslated on purpose: it is the browser's own words and this app must not
paraphrase them.

**Next: reproduce on the S23 and read what it says.** Only then a remedy. If the extension is the cause, that remedy is a conflict to resolve rather than a patch: the
private extension is what survives an email hop, and it may be the very thing the share sheet
refuses. One cheap experiment then becomes available — retry a refused share once with a plainly
named `.json` copy of the same bytes — but it trades away the association that makes the file open in
LibrePT on arrival, so it is a decision, not a fix, and it is not taken here.

**Found 2026-09-15 by reading the browsers' source (not yet tested on a phone).**

- **Chrome on Android refuses the file by its type, and `.json` would be refused too.**
  `ShareServiceImpl.java` (Chromium `main`) accepts a file only when BOTH its extension and its
  media type are on two fixed lists: pictures, sound, video, `pdf`, `txt`, `csv`, `html`, `css`.
  Neither `json` nor `application/json` is on them. The page receives `NotAllowedError: Permission
  denied`; the reason (*"Cannot share potentially dangerous … file"*) goes only to the phone's system
  log. The retry with a `.json` copy that `.private/INTAKE_DEFECT_PROPOSAL.md` proposes fails the same
  way, so that proposal is rejected.
- **`canShare` does not look at the file type**, only whether there is anything to share
  (`navigator_share.cc`). That is why the S23 showed the Share button and then refused.
- **A second share cannot start without a new tap.** `share()` uses up the tap that started it, in
  the Web Share specification and in both Chromium and WebKit. An automatic retry is refused before
  it reaches the file check.
- **No manifest entry, installation or registration can add a type to that list.** The lists are
  constants in the browser's code.
- **iPhone does not have this problem.** WebKit (`Navigator.cpp`, `WKShareSheet.mm`) checks no type;
  an unknown extension is passed on as generic data. Every browser on iPhone runs WebKit. Not checked:
  which apps offer themselves in the share menu for generic data.
- **Other routes that work on every phone:** none at a distance except saving the file. Web Bluetooth
  is absent from Safari and Firefox, and a page can only connect to a device, never be one, so two
  phones cannot connect (from memory, not re-read). A QR on the client's screen works only when both
  are in the same place — see §26.3 step 3.
- **What a QR would have to hold — MEASURED 2026-09-15** with the real `buildClientSignup` and the
  vendored encoder, as compact JSON, error correction M. A short signup (name, email, phone, one
  sentence each of goals and injury): 302 bytes, version 13 (69×69 squares). About 450 characters
  of each prose field: 957 bytes, version 25 (117×117). Both prose fields near their 1000-character
  limit: 1991 bytes, version 37 (165×165); with every field at its limit it does not fit at M at
  all. Deflate compression takes those to 235, 627 and 859 bytes. NOT measured: which version
  another phone still reads off a screen. §1.6 quotes ~300 bytes and does not say how it got that number.
- **[ ] Next, agreed 2026-09-15 (Simon): test whether a phone reads these codes.** Show the three
  codes above (versions 13, 25 and 37, built from real signups) on one phone's screen, and scan each
  with the stock camera of another phone, Android and iPhone. Record for each: read or not, and how
  long it took. Only then decide whether the QR route stays or goes. Blocks that decision.

**Ruled 2026-09-15 (Simon), NOT BUILT:** when a share fails, the page at once saves the file,
and shows how to send it by hand. Saving the trainer's contact is the first step, before the form.

- **Saving at once is allowed without a new tap.** Chromium's `download_request_limiter.cc` lets the
  first download after a tap through (`ALLOW_ONE_DOWNLOAD`). A second one without a tap asks the
  person *"download multiple files?"* — which is why the contact is a BUTTON, not a second automatic
  download.
- **The instructions** replace `intake_send_failed`: the share did not work, the phone saved the file
  `{file}` in Downloads, open a message to the trainer, add it as an attachment. The browser's own
  words stay on the line under it. The pre-addressed email (`offerToEmailTheTrainer`) is shown as after
  a manual save.
- **The contact button is the FIRST step, before the form** (Simon, 2026-09-15), not a button after
  the save. It already stands there: *Save this contact* (`intake-sender-save`, `trainerVcard.js`)
  in the box that names the trainer, above the first field, since 2026-09-11. So nothing is added
  after the save; the instructions only refer back to the contact saved at the start. Still open:
  the button is hidden when the link carried no trainer name (a nameless card is refused on purpose),
  and nothing on the page presents it as step one.
- **No link to the file, and no link to the Downloads folder.** *Save the file to share* stays on
  screen and saves it again, so a link would do the same thing twice. A web page cannot link to a
  folder on the phone. After a download, Chrome shows its own message with *Open*.
- **Ruled 2026-09-17 (Simon): the automatic save does NOT forget the unsent form.** A reload or
  another problem must not make the client type everything again. Open: *Save the file to share*
  still forgets it, and the same reason applies to that button.
- **Ruled 2026-09-17 (Simon): the failure message is a WARNING, not an error** — noticeable, so the
  client understands why they must follow the instructions. All five themes already define
  `--warning`; the status line needs an `is-warn` style beside `is-error` and `is-done`
  (`src/modules/intake/intake.css`).
- **[x] Built 2026-09-18.** `sendSignupFile` shares and, on a refusal that is not a cancel, saves the
  file ([signupDelivery.js](src/modules/intake/signupDelivery.js)); the status line names the saved
  file and says to attach it to a message (`intake_send_failed_saved`, replacing `intake_send_failed`),
  in the new warning tone; the form is kept. Tests: a refused share saves and a cancelled one does not
  ([signupDelivery.test.mjs](tests/unit_js/modules/intake/signupDelivery.test.mjs)), and the page's own
  two cases in [test_intake_form.py](tests/medium/test_intake_form.py).
- **Still open after that:** the check on the S23 itself — nothing here was tried on the phone that
  reported it; whether *Save the file to share* should also keep the form, since the reason that
  changed the refusal path applies to it too; presenting the contact card as step one, and what a
  link that carried no trainer name shows in its place.

**Stanje 2026-09-30:** dva ostanka iz zgornjih odločitev sta narejena. *Shrani datoteko za deljenje*
obrazca ne pozabi več, enako kot samodejno shranjevanje; stran je razdeljena v »1. korak: Shrani ta
kontakt« in »2. korak: Izpolni obrazec«, stran brez kartice kontakta pa številk ne kaže. **Odprto:**
preizkus na telefonu S23, preizkus kod QR na dveh telefonih, in kaj pokaže povezava brez imena
trenerja namesto kartice — vse tri čakajo na Simona.

### 45.5 [ ] Import covers a programme, but not the trainer's own exercise LIBRARY

**Reported:** trainers want to bring in their own exercises and their own blocks from text files and
spreadsheets.

**Corrected 2026-09-11 after reading the code: §29 is BUILT, not "on paper".** This section first
said most of it existed as a decision. It exists as software:
[domain/programImport.js](src/domain/programImport.js) parses, `programTemplate()` generates the
example a test parses back, [programImportDialog.js](src/modules/plans/programImportDialog.js) is the
surface, and *Import a programme* is in the ☰ menu. **§29's own heading still says "Not started;
specced" and the ranking table at the top of this file still ranks it first** — both stale, and
worth a pass of their own rather than an edit buried here.

**So the format is not the gap. The DESTINATION is.** `readProgram` already accepts a bare array of
items, so a trainer's list of movements parses today — and then lands in the session plan editor,
because that is the only place the import knows how to put anything. There is no "add these to my
exercise catalogue" path at all. What §45.5 needs is that second destination, not a second format.

**Open, and the reason this is not simply built:** an exercise in the catalogue carries an equipment
and a movement pattern ([§13](TODO.md)'s taxonomy), and an imported line will not. Either the import
creates them marked as having no taxonomy backing — the same CUSTOM treatment §29.1 already decided
for a movement inside a programme — or it asks, once, per movement. The first is consistent with what
shipped; the second is a wizard nobody wants for a list of forty.

**A backup is the wrong format for this, and was considered.** Simon raised it — no new format, use a
partial backup. Rejected, on three grounds:

- a backup is keyed to the storage schema ([§16](TODO.md), [§18](TODO.md)), so every schema change
  would silently break the instruction the trainer gives their AI;
- importing a partial backup is a MERGE — duplicate detection, id collisions, records that reference
  records that are not in the file — which is a harder problem than reading a list, and a data-safety
  problem rather than an import one;
- it is long, and a format an AI must reproduce exactly should be short enough to get right.

§29's template is short, is generated from the code, and is parsed by a test, so it cannot quietly
go stale. Extending it to cover a bare movement list is small; replacing it with a backup is not.

**Ruling (Simon, 2026-09-11):** *"todo je v redu"* — the TODO shape stands. Extend §29 rather than
design a second route.

**Picked up 2026-09-23 (Simon):** import the trainer's own library of exercises and circuits (*sklop*
is the UI's word for a circuit), let the filters limit the choice by source, and mark the exercises.
Three facts from the code decide the shape, and each blocks a part of it until ruled:

1. **The trainer's own workspace has no LibrePT catalog.** `emptyState()` starts with
   `exercises: []`, and `DEFAULT_EXERCISES` is written only by `seedMockData` — the sandbox and the
   test switch `?init=`. Outside the sandbox every exercise is already the trainer's, so a filter by
   source has one source to show. **Blocks: the source filter.** Recommended: show the catalog in the
   working database too, as read-only entries read from code and merged with the stored ones when
   read, so the source is known from where an entry comes from, with no stored field.
2. **A stored `source` field mints schema 5.** `SCHEMA_4.exercises` is frozen (§60), so a field that
   says "imported from this file" or "typed in the app" needs schema 5, a migration step and a
   fixture, and every backup written afterwards is refused by older builds. Two sources — LibrePT's
   catalog and the trainer's own — need no field: [seedProvenance.js](src/data/seedProvenance.js)
   already holds the catalog's id set. **Blocks: telling imported exercises from hand-typed ones.**
3. **A circuit has no record of its own.** It exists only as a `circuitId` on the items of a routine
   or a session. An imported circuit can be stored as a routine whose items share one `circuitId`,
   with no schema change, but nothing yet inserts a stored circuit into an existing plan, so until
   that action exists a circuit library is usable only as the template for a whole session.
   **Blocks: circuit import.**

The mark: §29.1 already chose `fa-pencil` with the word CUSTOM for a movement with no catalog behind
it. Recommended for the trainer's own exercises too — a glyph and a word, and a background colour at
most as an addition, because each theme restyles colour and a colour alone says nothing to a reader
who cannot tell two tints apart.

**Ruled the same day (Simon):** (1) yes — the catalog is shown in the working database; (2) sources
are any number, because trainers exchange catalogs, so the stored `source` field and schema 5 stand;
(3) yes, and an imported circuit is offered ONLY when building a plan — it is not a routine, which is
why it gets its own `circuits` collection rather than a routine with one circuit in it. **Schema 5
waits for the app-version and schema selection Simon has asked for separately** (ruled: do not build
the cutover here). Until then only what needs no schema is built: the catalog in the working
database, reading an import file without writing it, and the filter *LibrePT / Mine* with its mark.
**Blocked on schema 5:** writing an import, source names, circuits, and the export carrying both.

**[x] Built 2026-09-23:** the catalog in every workspace, read from code
([exerciseLibrary.js](src/data/exerciseLibrary.js)), and the Source filter *All / LibrePT / Mine*
with the pencil mark, in the library and in the picker — see [UC6](use_cases/uc6_exercise_taxonomy_and_picker.md).
**[x] Built 2026-09-23, the import itself:** the reader ([libraryImport.js](src/domain/libraryImport.js))
of the app's catalog export, `librept.library/1` and a bare list; the review before the write; a
source per import, with one filter chip and one mark (import glyph + name) per source; circuits
stored in `circuits`. See [UC6 §2.2](use_cases/uc6_exercise_taxonomy_and_picker.md).
**In progress 2026-09-24:** completing the remaining work in verified increments.
The JSON catalog export now carries circuits and per-record sources, and reimport preserves them.
The Import button is gated on `libraryImport` by §76's version registry.
The plan editor now offers a library circuit at each top-level insertion gap, keeping independent
slot ids, rounds and rest items. Multi-source imports show all newly added exercises.
**[ ] Next:** a frozen corpus of real library files, as §29 has.
No real trainer-supplied library files have been identified yet; that blocks claiming
the corpus represents real exchanges.

**Ruled 2026-09-23 (Simon):** an imported circuit with no name gets a placeholder, so
`circuits.name` is required in schema 5. The form chosen: the word for circuit and the names of its
first two exercises, in the app's language at the moment of import ("Sklop — Počep, Izpadni
korak"); the trainer can rename it. **Schema 5 shipped the same day** ([§76](TODO.md), 19ea11c) and
every install reads it, so the import now writes. The screens will be gated on the behaviour
`libraryImport` once §76's registry of app versions exists.

### 45.6 [ ] The session list needs filters: a date range, a client, a location

**Reported:** on the home screen, the calendar should act as a from–to filter; a filter by client is
wanted; Simon added a filter by location.

**None of the three exists today.**

**Not a modal (agreed, Simon 2026-09-11).** A modal costs two taps and hides what is switched on, so
a trainer sees a short list without seeing why it is short — and this screen is read one-handed, with
a client waiting. The shape instead: **a row of chips under the header that shows what is active**,
each removable with one tap. A modal becomes worth revisiting only if the chips stop fitting on a
phone-width row.

**Researched 2026-09-11, and it is a bigger change than "add three filters".** There is no calendar on
the board today. The control that looks like one is *Jump to date*
([sessionTimeline.js](src/modules/sessionList/sessionTimeline.js)): it opens the phone's native date
picker and **scrolls** the timeline to that day. The board itself is one continuous, time-ordered
list with sticky day headers, over a fixed window of days around today
([sessionsView.js](src/modules/sessionList/sessionsView.js)'s `visibleSessions`).

**The request changes the model, not just the control: from "take me to" to "show only".** Three
things are built on the first model and have to be answered before any of this is written:

- **Day swipes and the sticky headers.** A day is a POSITION in the list. Under a from–to filter,
  what does swiping past the end of the range do — nothing, or widen the range?
- **The Today button**, which today both jumps to today and shows which day is in view. What is it
  when today is outside the chosen range?
- **The `sessions.day` route.** The focused date is written into the URL, so a deep link names a day.
  A filtered board has a range as well as a position, and the link has to say which it carries — this
  is [§19](TODO.md)'s territory, not the board's alone.

**The chips live in the sticky title bar** (asked 2026-09-11, after seeing them). They shipped as a
row below it, which meant scrolling the board took the filters off the screen while the thing they
filter stayed on it — a filter nobody can see is the modal's defect arriving by another road. One
sticky header now carries two rows, the title with the day controls and the filters under them, and
the calendar opens inside it. The day headings' own sticky offset follows on its own: the timeline
measures that header with a ResizeObserver, so a second row costs no number kept in step by hand.

**Chips, not a modal, is still the answer for the client and location filters** — they are plain
"show only these" choices and a modal hides what is on. The date range is the one that is not simply
another chip, because the board's whole navigation is already made of dates.

#### The date range's click model — proposed 2026-09-11 (Simon), NOT decided

Proposed as booking.com's: first click selects a day; a second click on the same day clears it; a
second click on another day makes a range; then the third click moves the first date, the fourth
moves the second, and odd/even clicks continue that pattern. Separately proposed: a click on an
already-selected date removes it and the range collapses back to one day.

**Booking.com does not do the odd/even part.** Its rule is keyed to MEANING — first click is the
arrival, second the departure, third starts over — not to a count of clicks.

**And the count is the defect.** Under the parity rule, what the next tap does depends on how many
taps came before, a number that is nowhere on screen. Two identical taps on the same day give
different results, and a trainer who mis-taps cannot see why. Every rule here has to be readable from
what is VISIBLE.

**The collapse-to-one-day proposal is good and should be kept**, with one clarification: it can only
apply to the two ENDS. A day in the middle of a range looks selected too, and removing it would split
the range into two pieces, which a single from–to filter cannot express.

**Counter-proposal — five rules, every one read off the screen:**

1. nothing selected, tap A → filter is the day A;
2. one day A, tap A again → filter cleared;
3. one day A, tap another day B → the range between them, in either direction (a tap BEFORE A gives
   B–A, never an inverted range);
4. a range, tap one of its two ends → that end goes, the other stays as a single day;
5. a range, tap any other day → the NEARER end moves there: inside the range it narrows, outside it
   widens. An exact tie has to be settled by a fixed rule — the start, arbitrarily, and what matters
   is only that it never changes.

Rule 5 does the work parity was meant to do, without anything to remember: the edge nearest the
finger is the one that moves. Rule 4 guarantees a way back from a range to a single day, so no state
is a dead end.

**The conservative alternative to rule 5** is booking's own: a tap anywhere else starts over with one
day. Easier to explain, but every narrowing then costs two taps instead of one.

##### Checked against documented practice, 2026-09-11 — and BOTH of the above are inventions

Asked to test the design against the portals that built people's expectations. Every reference below
was opened and read, not taken from a search summary.

- **The third tap starts over.** eBay's design system states it plainly: the first tap sets the start,
  the second the end, *"a third tap resets the date range and sets the new starting date"*
  ([playbook.ebay.com](https://playbook.ebay.com/design-system/components/date-picker)). Syncfusion's
  widely used component documents the same rule with more detail: a click when both ends are set is a
  new start, **and a click on a date earlier than the current start is also a new start, never an
  inverted range** ([help.syncfusion.com](https://help.syncfusion.com/js/daterangepicker/behavior-settings)).
  Airbnb's `react-dates` behaves the same way for a selection that would be invalid — the clicked day
  becomes the start ([github.com/airbnb/react-dates#1978](https://github.com/airbnb/react-dates/issues/1978)).
- **Nothing uses alternation, and nothing uses "the nearer end".** Neither the parity model nor the
  five-rule counter-proposal appears in any design system or component library found. Both are
  patterns a trainer has met nowhere else.
- **Booking.com — the portal this started from — edits an existing range by naming the END FIRST**:
  *"by clicking the appropriate box for check-in/out the dates can be adjusted"*
  ([blog.mobiscroll.com](https://blog.mobiscroll.com/how-to-build-amazing-booking-apps-calendar-tips-and-considerations/)).
  So the visible marker both of us arrived at is real practice — with the difference that the USER
  arms it, rather than the app alternating it.
- **Ends styled apart from the days between them is the standard**, not a nicety: endpoints get a
  *"distinct style"* with rounded caps, the interior a *"continuous highlight colour lighter than the
  selection circles"* ([uxpatterns.dev](https://uxpatterns.dev/patterns/forms/date-range)). The same
  page recommends the header text change from "Select a start date" to "Now select an end date" —
  the marker, in words.
- **Do not move the calendar between the two taps.** NN/g: a shifted month *"may go unnoticed and
  cause users to slip by clicking where the intended date used to be"*
  ([nngroup.com](https://www.nngroup.com/articles/date-input/)).

**So the model to build, unless overruled:**

1. first tap = start, second = end; a tap before the start becomes the start, never an inverted range;
2. a third tap on any day starts over from that day — the one behaviour a trainer already knows;
3. a tap on the same single day clears the filter;
4. to move ONE end without starting over, tap the `od` or `do` chip to arm it, then tap a day. Armed
   is visible, and chosen rather than inferred;
   - **The chips are OUTSIDE the calendar grid** — in the filter row above it, beside the client and
     location chips — so arming can never collide with rule 2 or 3. Misread once as "tap the endpoint
     inside the grid to arm it", which is genuinely unworkable: a tap on a day already means
     something there, and the only way left to tell the two apart would be a drag, which is the wrong
     gesture on a phone. Booking.com places its check-in/check-out boxes outside the calendar for the
     same reason.
   - The same tap on a day therefore has two outcomes depending on whether a chip is armed. That is
     only allowed because armed is VISIBLE — the whole objection to the parity model was a mode
     nobody could see, and a mode this design cannot see either would be the same defect rebuilt;
5. ends drawn stronger than the days between them, and the calendar does not shift while choosing.

**What this costs, and it is the largest part of §45.6.** None of it is possible with the phone's own
date picker: every date control in this app is a native `<input type="date">`, which returns one date
and can neither show a range nor take two taps. This means a calendar of our own — a month grid,
swiping between months, thumb-sized targets, marked ends and marked days between them, in five themes
and two languages. A new component, not a setting on an existing one.

Also unresolved and cheap to get wrong: what the list shows when a filter matches nothing. An empty
board that does not say "because of a filter" is the same defect in a different costume.

### 45.7 [x] Finish "seja" → "trening", and settle on ONE form of address — finished 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#457-x-finish-seja--trening-and-settle-on-one-form-of-address--finished-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 45.8 [ ] The clipboard and the client's history are two views of one thing

**Reported:** the clipboard view and the history view within a client need to be unified.

**Researched 2026-09-11, and the duplication is real and nameable.** Two modules draw the same
records, twice, in two designs:

- **The clipboard** draws cards through a class hierarchy
  ([deckCard.js](src/modules/clipboard/deckCard.js) and its subclasses): an exercise, a circuit, a
  rest, and — already — a PAST session
  ([pastDeckCard.js](src/modules/clipboard/pastDeckCard.js)), which shows one compact line and opens
  into every set as it was logged.
- **The history** draws the same thing from scratch in
  [historyView.js](src/modules/history/historyView.js)'s `renderHistoryItems` — its own circuit
  grouping, its own rest row, its own skipped badge, its own sets text, its own CSS.

So the app already contains a card that shows a past session compactly and expands to the detail —
and the client's history does not use it. That is why the two screens do not feel like one product:
they are not one component with two states, they are two components with one meaning.

**Ruled (Simon, 2026-09-11):** in the CLIENT view, the history rendering goes and the clipboard's
cards take its place.

**One correction the ruling needs, found in the code.** The clipboard's past card is not a card for a
SESSION — it is a card for one exercise. `buildPastExerciseItems`
([exerciseDeckOfCards.js](src/modules/clipboard/exerciseDeckOfCards.js)) deliberately flattens a past
session to its movements ("lists movements only"), dropping rests and circuit scaffolding, because it
answers a different question: what this person lifted last time on THIS movement, read while standing
next to them. Swapping it in as-is would lose four things the client's history carries today — the
session duration, the circuit and rest structure, the skipped badge, and the per-exercise feedback
icons. The last of those are the trainer's own signals, and plausibly the reason they open history at
all.

**So the shape that does what was asked without the loss:** the client's history stays a list of
SESSIONS, and each session opens into the clipboard's own card classes (`ExerciseDeckCard`,
`CircuitDeckCard`, `RestDeckCard`) in an "as performed" state, instead of historyView.js's separate
rendering. Duration stays on the session card's header; the skipped badge and the signal icons live
on the exercise card, which already has a place for signals. The duplicate rendering goes, which is
the point, and nothing a trainer reads today disappears.

**Answered (Simon, 2026-09-11):** *"zgodovina pri stranki bi naj bila enaka kot v sejah, zaporedje
kartic, z barvno razliko med preteklimi in ostalimi"*, and *"uporabi isto komponento in enak
izgled"*. So: grouped by session, not a flat stream of movements — a SEQUENCE OF SESSION CARDS, the
board's own [sessionCard.js](src/modules/sessionList/sessionCard.js), with past sessions set apart by
colour.

**Corrected minutes later by Simon, and this is the ruling that stands:** *"ne razumem kaj je
različnega med zaporedjem vaj in zaporedjem sej — zgodovina pri stranki naj bo enaka kot na
clipboardu, torej vaje"*. So the cards are the CLIPBOARD's cards — exercises and circuits — not the
board's session cards. "Enaka kot v sejah" meant the clipboard, not the dashboard.

**The difference he asked about, since it decides the layout.** The clipboard shows the items of ONE
session, in the order they will be performed, for one client. A client's history runs across months:
the same movement appears twenty times and nothing says which one was Tuesday's. A flat run of
exercise cards loses the boundary between sessions — not a detail, because "what did we do last
time" is the question the screen exists to answer.

**What that resolves to, and it adds no new component:** a continuous sequence of the clipboard's own
item cards, **divided by sticky date headers** — the pattern the board already uses for sessions
([sessionsView.js](src/modules/sessionList/sessionsView.js) builds exactly that). The cards are the
clipboard's; a session is a HEADER, not a card. Past is set apart by colour, as ruled.

**Shared plans across several clients** (Simon, same message): the clipboard keeps its client
selection exactly as it is — tapping a name shows that person's own sequence of exercises, and only
the names in the selection row are joined. So "past / current / upcoming" is always asked about one
named person's sequence, never about a plan shared by three, which is what would otherwise make the
colouring ambiguous.

What still has to be placed, since the clipboard's item cards were never asked to show them: the
per-exercise feedback icons, the skipped badge and the session duration, all of which today's history
card carries. The duration belongs on the date header; the other two on the exercise card, which
already has a place for signals.

**Also still open:** whether the GLOBAL history is the same card as well, or only the same row.

Related and already decided on paper: [§17](TODO.md)'s structured session history, which is the
record both of them read.

### 45.9 [ ] Running a session: keep it interactive, drop the confirming

**Reported, first reading:** *"running the session must be less interactive, so the trainer can focus
on the client; feedback and adjustments get written after the session."*

**Argued against, and the position moved.** The app's whole claim is one-handed logging **during** a
session (UC1). Moving feedback to afterwards asks the trainer to hold sixty minutes and three clients
in their head — which is the failure of the paper clipboard the app exists to replace.

**What the trainer actually wants (clarified, Simon 2026-09-11):** the session screen **stays
interactive**. What is unwanted is **confirming rounds and exercises** — being made to tap "done" on
each circuit and each exercise to move the session forward. The cost is not interaction, it is
bookkeeping the trainer is made to perform for the app's benefit.

**So the work is to remove the confirmation taps, not the interaction.** What a tap should be for:
something the trainer learned (too easy, too hard, pain) or something they changed. What it should
not be for: telling the app what it can see for itself.

**Researched 2026-09-11: there is exactly ONE confirmation left, and it is the circuit's.** A plain
exercise has no "done" control at all — it is marked performed as a side effect of the trainer
reacting to it, and the rule is already written down where it happens
([sessionQuickSignals.js](src/controllers/sessionQuickSignals.js): *"Signalling on an exercise
implies it was performed — the trainer is reacting to the work, not planning it, so the sets stop
asking to be ticked off individually"*). The circuit card
([circuitCard.js](src/modules/clipboard/circuitCard.js)) is the one that still asks: a
**Complete round N / M** button, becoming **Finish circuit** on the last round.

**This also explains the second complaint, and the two are one problem.** A circuit shows a round
counter and a round button; a standalone exercise with four sets shows neither — because its sets are
never counted off. That is the "an exercise has no rounds button" the report names, and it is the
visible edge of the same inconsistency: **one item type is ticked off and the other is inferred.**

**What has to be answered before the button is removed:** what advances the round. The candidates,
none of them chosen here —

- the same rule as an exercise: a signal logged on any member advances the circuit's round;
- the last member's rest timer ending advances it;
- the counter stays, becomes a display rather than a control, and is tappable only to CORRECT it.

[§8.7](TODO.md) is next door and should be answered in the same pass: whether completing a round
stops its timer.

**And the layout half.** A circuit is a container drawing rows inside itself; an exercise is a card.
In one list they read as two kinds of thing. Whether they converge is a design decision that follows
the one above — if the round button goes, most of what makes them look different goes with it.

**Two more, from the same reading of the screen (Simon, 2026-09-11):**

- **A circuit and an exercise do not look like one another** in the list, and the layout is worse for
  it. The list of collapsed cards is now readable enough to be used without touching it — which is
  what makes the inconsistency visible.
- **An exercise has no rounds button, while a circuit does.** Reported as an observation, not yet as a
  defect: whether an exercise should have one is the question.

**Still standing from the original report, and a good change:** live editing belongs to a **single
card**, not to the whole programme at once.

### 45.10 [ ] The demo in chapters — and demo links become PATHS, not query parameters

**Reported:** the demo must be split into chapters.

**Already specified as [§35](TODO.md)**, brainstormed 2026-08-19: chapters, each independently
playable, each ending somewhere useful, a chapter being DATA rather than engine work.

**What changes is the chapter LIST** (Simon, 2026-09-11) — these four, aimed at what a trainer
evaluating the app needs to see:

1. signup;
2. planning a training session;
3. moving an appointment and telling the client;
4. a fast adjustment mid-session — **counted in taps and seconds**.

Before the chapters begin, show where the trainer enters their own name and contact details. The
demo only opens the form and names its fields; it does not enter or save invented personal data.

The planning chapter must also let the trainer peek at a past session while planning the next one.
That is the proof that the plan uses what happened before, rather than treating history as a separate
screen.

The fourth is the one that is different in kind: every other chapter *shows* something, and that one
**proves** something. A number a viewer can check is worth more than any sentence about ease of use.

**New, and not only about the demo: the demo's links should carry the chapter as a PATH segment,
not a query parameter** (Simon, 2026-09-11). §35 wrote them as `?demo=story&chapter=floor`.

**Researched the same day, and it is CHEAP — the opposite of what this section first said.** Clean
deep paths already work end to end: the service worker answers any navigation with the app shell
([runtimeFetch.js](src/sw/runtimeFetch.js)), the deploy publishes a SPA 404 fallback for the same
reason, and the router already resolves paths client-side and has a real not-found view
([docs/ROUTING.md](docs/ROUTING.md)). So this is declaring a route, not building a mechanism.

What remains is a naming decision rather than an engineering one: `/demo/story/floor` against
`/demo/story` with the chapter as a segment of its own, and what an unknown chapter in a path does —
which is [§44](TODO.md)'s question about links that cannot be observed to have rotted, arriving from
a different direction. Decide it before §35's chapters are built: every chapter link would otherwise
have to be rewritten afterwards, including any already sent to a trainer.

### 45.11 [ ] Assessment sessions — the trainer measures, and records as they go

**Wanted (Simon, 2026-09-11).** A session whose purpose is measurement rather than training: the
trainer tests a participant's capabilities and records the results interactively, as they happen.

Nothing like it exists — not in the code, not in the use cases. Open by its nature: whether this is a
session type, a programme of a special kind, or a record that hangs off a client independently of any
session; and what a measurement IS as data, given that [§17](TODO.md)'s history record was shaped
around sets, reps and load.

Worth noting as a reason it matters commercially: a re-test is the only thing in a trainer's work
that demonstrates progress in a number, which is what a client renews on.

### 45.12 [CLOSED 2026-09-27] Published slots a client picks from an INVITATION, moved to PRO

Closed — a client choosing from published times is a paid feature (`~/Projects/EnterprisePT`
`TODO.md` §11 and §19). The reasoning is in
[TODO_ARCHIVE.md](TODO_ARCHIVE.md#4512-closed-2026-09-27-published-slots-a-client-picks-from-an-invitation-moved-to-pro).

### 45.13 [ ] An appointment already agreed — just send the client an ICS

**Wanted (Simon, 2026-09-11).** The time is agreed, nothing needs deciding, and all the client needs
is a calendar entry.

**This is the whole of client-facing booking in the free app, as of 2026-09-27.** The trainer names
the time and sends the entry; a client never picks from a list of times here (§45.12).

**Most of this is built.** [calendarInvite.js](src/data/calendarInvite.js) writes the ICS, and
[sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js) already hands it to a client by
email or SMS. What is missing is that it is not written down as a use case, and that the route into
it goes through inviting somebody to a session — rather than "this is agreed, send the entry".

Cheapest of the three new scenarios, and the one a trainer would use every week.

### 45.16 [x] The session card, read off a screenshot — shipped 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4516-x-the-session-card-read-off-a-screenshot--shipped-2026-09-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 45.14 [ ] Found while running the gate: `_switch` waits for the wrong thing

**Two sandbox tests failed on 2026-09-11**, in a Stage 3 that took 308s where earlier runs that day
took 183–196s — the same suite, a busier machine.
`test_a_sandbox_older_than_twelve_hours_offers_a_fresh_one` was clicking the ☰ menu while
`#dialog-sandbox-stale` sat over it, and `test_coming_back_returns_to_the_view_you_left` read the URL
before it had been rewritten. Both pass when the file is run on its own. **This is not flakiness to
be re-run away; it is one located defect in a test helper.**

**The cause.** `_switch` ([test_sandbox.py](tests/e2e/test_sandbox.py)) waits for
`activeWorkspace() === expected`, then sleeps 200ms. That flag flips in the MIDDLE of
`switchToWorkspace` ([app.js](src/app.js)): `switchWorkspace()` sets it, and only afterwards come
`renderEverything()`, `rebindTimers()`, `returnToLastView()` — which is what rewrites the URL — and
finally `offerFreshSandboxIfStale()`, which is what opens that dialog. So the helper returns while
the switch is still running, and 200ms is the whole of what stands between it and the rest. On a
quiet box that is enough; under eight browser workers it is not.

**[x] Fixed the same day, in the test and with no timeout.** The helper now waits for
`body.in-sandbox` to match the workspace it asked for. That class is set by `renderWorkspaceChrome()`
inside `renderEverything()`, which runs AFTER the switch's awaits — and `renderEverything()` through
`returnToLastView()` is one synchronous block, so observing the class means the database is loaded
and the address bar has moved. The app needed no new signal; it was already saying this, and the test
was asking the wrong question.

**One place also had to stop lying to the page.** The staleness test aged the sandbox and then called
`switchWorkspace('working')` from inside `page.evaluate` — which moves the stored workspace without
repainting, leaving `body.in-sandbox` saying "sandbox" for a workspace the app had left. Any wait on
that class would then be satisfied by a stale fact. It now leaves and re-enters through the menu, the
way a trainer does.

**The lesson, which is why this is written down rather than just fixed:** a wait on a flag that is set
mid-operation is a sleep wearing a better name. `setActiveWorkspace()` is called before
`loadSavedState()` and before a first sandbox is seeded, so the flag was true for the whole expensive
part of the switch.

### 45.15 [ ] The promotional page is English only

Split out of §45.1 when that closed. [landing.html](src/landing.html) is English-only by
construction: it is a built document with no translation mechanism of any kind, and its calls to
action are the same demo and walkthrough links. Translating it means giving the built docs a language
axis, which is a larger change than §45.1 was.

---

## 46. Reported 2026-09-12 — the setup form, read off a screenshot

Simon sent one screenshot of the session setup form in Slovenian and asked what was wrong with it.
Six things were, and the picker under them turned out to be the bigger problem.

### 46.1 [x] The warning list called the whole day taken — fixed 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#461-x-the-warning-list-called-the-whole-day-taken-fixed-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.2 [x] Choosing two clients out of a hundred — redesigned 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#462-x-choosing-two-clients-out-of-a-hundred-redesigned-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.3 [x] Four smaller things in the same screenshot — fixed 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#463-x-four-smaller-things-in-the-same-screenshot-fixed-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.4 [x] The demo data speaks the trainer's language — shipped 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#464-x-the-demo-data-speaks-the-trainers-language--shipped-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.5 [x] The seed stamp says what it is — renamed 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#465-x-the-seed-stamp-says-what-it-is--renamed-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.6 [x] [Decided] The demo-removal code stays, as a safety valve — ruled 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#466-x-decided-the-demo-removal-code-stays-as-a-safety-valve-ruled-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 46.7 [x] The stamp says WHICH kind, and the app notices when test data escapes — shipped 2026-09-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#467-x-the-stamp-says-which-kind-and-the-app-notices-when-test-data-escapes-shipped-2026-09-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).


## 47. Reported 2026-09-12 — what the tests do not catch, and how the app should say so

Simon sent a screenshot of the sandbox: the session title on the card runs past the card's right
edge and under the ▶ and ⋮ buttons. His verdict was about more than the title — **catching defects
in the test phase is not enough.** A build that only reports what a test thought to look for is
blind to everything else, on every phone that is not this one.

### 47.1 [x] The session title runs off the card — fixed 2026-09-13

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#471-x-the-session-title-runs-off-the-card--fixed-2026-09-13); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 47.2 [ ] The app catches its own errors, writes a log, and can send a bug report

Asked 2026-09-12. Three pieces, in this order:

- **Catch.** One place that hears what the app does not survive: `window.onerror`, an unhandled
  promise rejection, a failed IndexedDB write, a render that throws. Today these reach the browser
  console and nowhere else, and nobody on a gym floor has a console open.
- **Write.** A log on the device, with the same rules as everything else here: it stays on the
  phone, it is capped so it cannot grow without limit, and it holds no client's name or any other
  personal detail — the point is what broke and where, not who it happened to.
- **Report.** A way to hand that log over: the trainer taps one control, sees what would be sent,
  and sends or cancels. It carries the commit SHA and the data-schema version, which is what makes a
  report answerable at all.

**Open questions, to settle before code:** where the report GOES (a GitHub issue, an e-mail, a file
the trainer sends themselves — the app is offline-first and has no server of its own); whether the
log survives a reset of the sandbox; and whether a crash is shown to the trainer as it happens or
only collected quietly.

### 47.3 [ ] Sessions are merged only while they overlap

Said 2026-09-13 (Simon), answering §47.1: he did not expect merged names in the list of sessions,
only on the clipboard, where the trainer follows the session as it runs — and there only for the
time the sessions overlap.

**What the app does today.** The cards in the session list show one name each. The merge happens
when a clipboard is opened from a card or a link (`launchClipboardDirectly` in
[sessionsView.js](src/modules/sessionList/sessionsView.js), via `getOverlappingSessions` and
`buildSessionMeta` in [utils.js](src/modules/common/utils.js)): every session whose slot overlaps
the tapped one at ANY point joins it, for the whole life of that clipboard. Its time label runs from
the earliest start to the latest end. So 10:00-12:00 and 11:00-13:00 make one clipboard from 10:00 to
13:00 named after both, although they share only one hour. The collapsed clipboard bar at the bottom
of the list screen also shows the joined names, which may be what read as "names in the list".

**Open, to settle before code:** what happens to the clipboard at 11:00 when the second session
starts, and at 12:00 when the first one ends; and whether a trainer opening the 10:00 session at 10:15
sees one name or both.

## 48. PRIORITY — fewer taps on the live clipboard

Set as a priority 2026-09-13 (Simon).

### 48.1 [x] The active card and the open card are two different things — shipped 2026-09-13

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#481-x-the-active-card-and-the-open-card-are-two-different-things--shipped-2026-09-13); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 48.2 [ ] Tracking and notes are done after the session, not during it

**Wanted.** During a training session the trainer does not record results or write notes. That
work is done afterwards, as a follow-up. This keeps the live clipboard to the taps the session
needs.

**The exception** is a session for measuring performance (§45.11): there the result IS the
session, so it is recorded as it happens.

**To settle before code:** what stays on the live card from today's controls — the quick signal
(`logQuickSignal`) and the feedback note (`openFeedbackModal`) are both on it now; where the
follow-up happens and what reminds the trainer that it is still open; and how a session is marked
as a measuring session, which §45.11 has not decided yet.

## 49. [x] A theme is a stylesheet, and the Red theme becomes Spreadsheet — shipped 2026-09-13

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#49-x-a-theme-is-a-stylesheet-and-the-red-theme-becomes-spreadsheet--shipped-2026-09-13); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 50. A reload keeps what the trainer typed

**Wanted 2026-09-13 (Simon)**, raised with §48.1: a reload has to bring the app back to the state it
was in before. That includes every form, not only the clipboard.

### 50.1 [~] Review every form for what a reload throws away

**Why it matters on the gym floor.** A phone reloads a page on its own: the browser drops a tab in
the background, the trainer switches apps, the service worker installs a new version. Anything typed
and not yet saved is then gone, with no warning.

**Started 2026-09-14 (Codex).** The first browser pass is recorded below. The earlier claim that
only intake and the clipboard remember input was wrong: the client form also uses
[formDraft.js](src/modules/common/formDraft.js), and session setup has a separate version-scoped,
workspace-scoped localStorage draft in [editSessionControl.js](src/modules/session/editSessionControl.js).
Counting files containing input markup is not counting forms: the results include comments, shared
field builders, search controls, and several modules that draw parts of the same form.

**Method.** Local Chromium, fresh temporary browser contexts with demo data; type/change fields,
reload the page, then reopen a dialog when necessary and compare its values. No invitations sent,
exports downloaded or records erased. Some dialogs were opened through their existing exported
opener, so these observations prove field restoration, not the entire navigation path. No runtime
code changed. Browser results below cover the named fields, not every possible branch of a form.

| Surface and owner | Observed after reload, 2026-09-14 |
| :--- | :--- |
| Client intake — [intakeView.js](src/modules/intake/intakeView.js) | Existing e2e reload test passed: name, phone and injury note survive; consent remains unticked. Uses sessionStorage, deliberately limited to the tab. |
| New client — [clientFormsController.js](src/controllers/clientFormsController.js) | Name, alias, email, phone, goals, notes, consent date and language survive after manually reopening Add client. Consent tick does not. The dialog itself does not reopen. |
| New exercise — [exerciseFormsController.js](src/controllers/exerciseFormsController.js) | Its route reopens the dialog, but name, muscle group, equipment, movement pattern, modality, metric and instructions all revert. |
| New routine — [routineFormsController.js](src/controllers/routineFormsController.js) | Its route reopens the dialog; name and description are lost. |
| Existing routine — [plansView.js](src/modules/plans/plansView.js) | Reopening restores the saved record, losing the edited name, description, and the selected exercise, sets, reps and rest in all six tested rows. Load variants and structural changes still need explicit browser coverage. |
| Session setup — [editSessionControl.js](src/modules/session/editSessionControl.js) | Name, location, date and both times survive. Repeat toggle, repeat-until date and participant search do not. Weekday buttons are also absent from the draft serializer; participant assignment and series-edit branches still need browser coverage. |
| Trainer details — [trainerDetailsDialog.js](src/modules/common/trainerDetailsDialog.js) | Dialog name, phone and email are lost; reopening reads the saved identity. The splash variant uses the same save/prefill functions but still needs its own reload pass. |
| Program import — [programImportDialog.js](src/modules/plans/programImportDialog.js) | Pasted text and both client/session choices are lost. File contents are copied into the same textarea; that path still needs its own reload pass. |
| Intake invitation — [intakeInviteDialog.js](src/modules/clients/intakeInviteDialog.js) | Recipient contact is lost. Opened via the real Invite client button, which also initialises its dependencies. |
| Session invitation — [sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js) | Unsaved organizer email, phone and reply cutoff revert to stored defaults. Typing alone does not persist these; the sending controls remember them. |
| Feedback / gym note — [feedbackModal.js](src/modules/common/feedbackModal.js) | Dialog does not reopen. Reopening loses the note and keep-on-record tick, and resets the selected pain tag to Too Easy. No feedback was submitted. |
| Client export — [clientDataRights.js](src/modules/clients/clientDataRights.js) | Edited disclosure notes revert to the client's stored notes. Losing a redaction can put another person's information back into an export; drafts must belong to the exact client. |
| Client erasure — [clientDataRights.js](src/modules/clients/clientDataRights.js) | In-progress request-date text resets to today; confirmation text resets to blank. The probe did not submit an erasure. |
| Encrypted-file reader — [encryptedFileReader.js](src/modules/common/encryptedFileReader.js) | Passphrase is lost. It is a text input, so excluding only `type=password` would accidentally persist it. |
| Plan adjustment — [planAdjustments.js](src/modules/plans/planAdjustments.js) | Selected action reverts to Modify. Metric fields and movement replacement still need separate browser passes; switching the action hid those fields in this pass. |
| Start-time correction — [sessionStartTimeDialog.js](src/modules/session/sessionStartTimeDialog.js) | Both edited times revert to the opener's proposed times. |
| Clipboard editor — [clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) | Both existing e2e deep-link tests passed, including an exercise name surviving reload. This does not yet prove every metric, empty input or structural edit. |

**Located defects in the shared mechanism, not just missing integrations:**

- **A rejected save deletes the client draft.** Reproduced with a whitespace-only client name
  and a non-empty note: Save leaves the dialog open because validation rejects the name, but reload
  loses the note. `keepFormDraft` clears on the submit event before the caller validates or saves.
  Clear only after successful persistence, never merely because submit fired.
- **Radio groups cannot round-trip.** A browser probe with three radios sharing `name=signal`
  selected the middle value; `readFormDraft` stored `{signal: false}`, and restore selected none.
  The helper uses the shared name as a key and overwrites each preceding radio. Feedback uses
  precisely this unnamed-id radio shape.
- **Identity and workspace are not optional.** Client keys are `client:<id>` or `client:new`, with
  no workspace component. Session setup has a workspace but only one draft key, with no session id.
  Cross-subject/workspace isolation needs tests before either mechanism is extended.
- **Dynamic rows need data, not DOM identifiers.** Routine rows and repeat weekdays have no
  `id`/`name`; the generic helper skips them. Save stable item identities, ordering and values,
  recreate the controls, then restore their values.
- **Restore emits input/change one field at a time.** Dependent controls can rebuild later fields
  or save an incomplete restored form. Restoration needs an explicit phase before autosave resumes.

**Remaining inventory, inspected in source but not yet fully exercised in the browser:**
new-client versus edit-client isolation,
the intake's other fields, signup-file review and backup-file review, session-list filters,
client/exercise/catalog searches, inline elapsed-duration editing on a past session card,
the inactive add-exercise dialog, and settings. Language/theme save immediately; the Drive interval
commits on change. File pickers cannot be repopulated as ordinary text fields. Search filters are
view state, while the plan editor already writes live records; neither should silently become a
second copy of business data in a generic form draft.

**The audit stays as the record of what a reload loses.** The draft store it proposed was built on
2026-09-15 and reverted the same day; see §50.2.

### 50.2 [ ] No separate draft storage for the trainer's forms

**Decided 2026-09-15 (Simon): the trainer's forms get no temporary storage.** Codex's draft store
(a workspace-scoped `localStorage` bucket, a form inventory and a recovery controller) was reverted
the same day. Reverting was cheaper than removing it: it had closed §50.1 on a draft lifetime nobody
had ruled on, copied a whole imported backup into `localStorage`, deleted a draft on ✕, Escape and
Android's Back gesture, and let one forgotten draft keep a stale session alive.

**Ruled 2026-09-17 (Simon): a record form writes into the database as it is typed**, and the ahead
count rises only once the trainer has finished the record. With it, ruled the same day:

- **Any way out finishes the record** — Save, ✕, Escape, Back, a route change.
- **Cancel undoes**: an edited record goes back to what the dialog found, an added record is removed.
- **A new record exists from the first typed character.** An empty required field is written as a
  placeholder ("New client", "New exercise", "New routine", 3 sets) — no alert, no refusal.

**Done for the client, exercise and routine dialogs, 2026-09-17** —
[liveRecordForm.js](src/modules/common/liveRecordForm.js), with the counts in
[openRecordEdits.js](src/data/openRecordEdits.js). The button is still called Save (Simon,
2026-09-17: a trainer understands it). The client form no longer
keeps its `sessionStorage` draft. Two things the change had to fix on the way: every save wrote all
records again, so the write queue now folds a waiting write into the next one; and unticking consent
must be judged against the record as the dialog opened it, or the second keystroke erases the
withdrawal the first one recorded.

**Known limits, open:**

- **A reload in the same instant as a keystroke loses that keystroke.** The database is written
  behind the typing; the old `sessionStorage` draft was written at once. Measured in the e2e test,
  which has to wait for the queue before reloading.
- **A half-typed exercise cannot be finished after a reload.** The exercise dialog only creates;
  there is no form to edit an exercise, so the record is kept but cannot be opened again.
- **A reload does not reopen the client dialog.** The record is kept; the trainer opens it again.

**Open, to settle before code:**

- **Session setup** — whether it writes as it is typed too. Its button also asks about removed
  participants and clashing sessions, creates a repeating series, offers invitations and starts
  the session; each needs a new place first. Asked 2026-09-17, not ruled. Its
  `librept_workout_setup_draft` in `localStorage`
  ([editSessionControl.js](src/modules/session/editSessionControl.js)) stays until then.
- **Dialogs that prepare an action keep nothing** (invitations, import, export, erasure, backup
  restore, start-time correction): losing a few typed characters to a reload costs seconds.
- **The client's own intake page** keeps its tab-only draft for now; Simon wants to think it through
  together. Its [formDraft.js](src/modules/common/formDraft.js) still deletes the draft on a
  rejected submit and cannot restore a radio group (§50.1).

### 50.3 [ ] An incomplete record needs attention rather than a refusal

**Raised 2026-09-15 (Simon).** He is not yet convinced that a client without a name or a session
without a location is a problem at all. If it is, it belongs on a list of things that need the
trainer's attention, perhaps marked by a badge — and perhaps one badge shared with sessions and
with feedback not yet dealt with.

**What exists already.** The notification feed computes work the trainer owes from state, fresh on
every render: unscheduled plans and unreviewed feedback
([notificationItems.js](src/domain/notificationItems.js)). An incomplete record would be one more
item of that kind. **Open:** whether it is a problem at all, which gaps count, and whether one badge
covers all of it.

**Proposed 2026-09-17 (Simon), not ruled: a badge on the record itself, for two reasons** — the
record is test data, or a required field is missing. Found against it (Claude):

- **Test data is already known per record** (the `testData` stamp and the seed id set,
  [seedProvenance.js](src/data/seedProvenance.js)); no list shows it today.
- **A missing required field can only be seen if the data keeps it empty.** A placeholder written
  into the record ("New client") hides the gap, and a stored "needs attention" flag would be a second
  copy of a fact the record already holds. This decides §50.2's open placeholder question in favour
  of drawing the placeholder instead of storing it.
- **The two reasons ask for different acts** — test data is to be removed, a gap is to be filled —
  so one badge would have to say which. Open: one badge with a reason, or two.
- **Which fields are required** is open per collection; only the name is certain today.

**Ruled 2026-09-17 (Simon): Save and ✕ check the record when the dialog is left.** Enough filled
in: the "unfinished" badge goes. A required field missing: it is saved anyway, with the
"incomplete" badge. Also ruled that day:

- **Escape, Back and a route change** check the record exactly as ✕ does.
- **"Unfinished" is stored on the record**, because the case it marks is a reload before Save or
  ✕, and **after a reload such a record counts** towards the ahead count and the backup warning.
- **Required fields are the ones the form marks required** (`required` in its markup).
- **A record carries several badges at once**: test data, incomplete, and anonymised (a client
  erased under a data subject request, §17.3) — one record can wear all three.

**Open, to discuss before code: stored placeholders and the incomplete badge.** Simon prefers the
placeholder stored in the record, so the rest of the app never meets an empty value. Then the
record alone cannot tell "New client" typed from "New client" filled in, so "incomplete" must be
written down when the dialog checks the record. Proposed (Claude): **a badge is stored only when
nothing else in the record says it.** Test data already has its `testData` stamp and an anonymised
client its `erasure.erasedAt`, so those two are read, not stored; "unfinished" and "incomplete" have
no other trace, so they are stored. Open with it: what other writers do (signup import, programme
import, Drive merge), and whether existing records get "incomplete" before they are next opened.

**What an incomplete record looks like since §50.2:** a required field left empty holds a
placeholder, so the record is named "New client", "New exercise" or "New routine" rather than
blank. Still possible: a client with no way to reach them, a session without a location, and a
routine with no exercises, which gives an empty plan if a session uses it. Several clients left as
"New client" share a name, so the alias hint treats them as namesakes.

## 51. [x] A tap the demo step did not ask for interrupts the guide — fixed 2026-09-13

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#51-x-a-tap-the-demo-step-did-not-ask-for-interrupts-the-guide--fixed-2026-09-13); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 52. [x] The Spreadsheet theme looks like a sheet, and a plan can be pulled aside — shipped 2026-09-14

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#52-x-the-spreadsheet-theme-looks-like-a-sheet-and-a-plan-can-be-pulled-aside--shipped-2026-09-14); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 53. [ ] Two medium tests fail when the machine is busy

Found 2026-09-14 by the gate run for §52.1's strip between blocks, a change that cannot reach
either test: both run in the default theme. A game was using 128 % CPU and 4.6 GB of memory, and
Stage 2 took 263 s instead of about 95 s. Both tests passed on their own a minute later, and a second
full run under the same load passed.

- `test_scrolling_to_either_end_reaches_the_first_and_the_last_card` in
  [test_clipboard_active_card.py](tests/medium/test_clipboard_active_card.py): after scrolling to the
  end, card 38 was active instead of the last one, 39.
- `test_the_panel_clears_the_control_even_while_a_card_is_open[iPhone SE]` in
  [test_walkthrough_panel.py](tests/medium/test_walkthrough_panel.py): the walkthrough panel covered
  the control it rings.

**A third, found and fixed 2026-09-24:** `test_a_reload_keeps_the_active_card_closed_when_it_was_closed`
in [test_session_deeplink.py](tests/e2e/test_session_deeplink.py) failed once in a full gate run and
passed three times alone. It read the deck a fixed 600 ms after a scroll and found the first card
still open. It now waits for the end state it is about (the address ends in `/closed` and no card is
open), and fails if that state does not arrive within 5 s. The two above may have the same cause.
**[ ] That fix did not hold (Claude, 2026-09-24 22:21).** The gate run of 22:15 failed on the same
test: after 5 s the address still named the open card, so the scroll never took effect at all. It was
not slow; it did not happen. The 19:40 conclusion, that 600 ms was too short, was wrong. Two causes
remain possible and the log cannot tell them apart: the wheel event arrives before the deck can
scroll, or outside it (the test measures the deck's box before the wheel); or the app's scroll
handler misses it. Next: run that one test with `--tracing=on` under load, and read where the wheel
event landed.

**Open:** what in each test depends on timing. Either the test reads the screen before the app has
finished settling, or the app itself lands in the wrong place when it is slow, which a busy phone in
a gym would see too.

The gate no longer runs on a saturated machine at all (§64, `build/quiet_machine.py`), so these two
stop appearing in gate runs. That is not this section: a phone in a gym is slow and cannot be asked
to wait, so the question below still stands on its own.

**Again 2026-09-30 01:41 (Claude), on a quiet machine.** The gate of 01:36 failed on
`test_a_reload_keeps_the_active_card_closed_when_it_was_closed` alone, while the change under test
touched neither the deck's scrolling nor its layout (a session form's draft, and the injury banner
of a bound group). Its timeline: `start` at top 214 with 788 px to scroll, a `wheel` at 30 ms, then
no `scroll` event at all for 5 s. The recorder listens for `wheel` on the WINDOW, so this does not
show the wheel landed on the deck. Alone it passed 3 of 3; alone under twelve busy-loop processes it
passed 10 of 10. CPU load alone does not reproduce it, so the cause is something only a full parallel
run has — other browser workers, or the stage's own order. Next step unchanged: record where the
wheel lands (listen on the deck's scroller, not the window) and trace one failing full run.

**Changed 2026-09-30 (Simon's ruling: an exploring browser and the pipeline run at the same time).**
The gate no longer waits for a quiet machine. It measures the load it did not cause once, before
the first stage, runs its browser tests on half of the FREE cores, and waits and refuses only above
half the machine, naming the busiest processes (`ed041fd`,
[quiet_machine.py](build/quiet_machine.py)). This reopens the ground this section stands on: fewer
workers beside load is not yet measured as a cure. First run: foreign load 2.92, six workers, green
in 8m48s. The re-check condition is in the module: a shared run that goes red while the same tree
is green started quiet means the cure fails at that load. Exploratory browsers also close themselves
after 15 minutes without a command (the exploratory-test skill's explore.py), so a forgotten one no
longer holds a core for hours; the Chrome on port 9223 forgotten at 09:16 came from a different CDP
tool outside this repository, which that change does not reach.

## 54. [x] The past cards on the clipboard write their date as "20. jul." — fixed 2026-09-20

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#54-x-the-past-cards-on-the-clipboard-write-their-date-as-20-jul--fixed-2026-09-20);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 68. [ ] The paid tiers: what stays out of this app, and the tag that invites the upgrade

Simon's tier idea, 2026-09-19, with the names and the price he set on 2026-09-24: **LibrePT**
(everything today, free), **ProPT** (invoices with a payment QR code and self-service booking, 10 € a
month or 60 € a year), **EnterprisePT** (a hosted service coordinating several trainers and gyms, plus
AI when the trainer supplies their own API key). The reasoning, the prices and the open questions live
in the separate private project `~/Projects/EnterprisePT` and in `.private/monetisation-tiers.md`;
what is recorded here is only what touches THIS repository.

**How ProPT would be built was worked out on 2026-09-24** in that project
(`PROPT_IMPLEMENTATION.md`), and two of its findings bind THIS repository:

- **Nothing of ProPT is built here, and nothing here changes shape for it.** ProPT is a file overlay
  over a pinned checkout of this app: it may add files and register itself into existing registries
  (`renderRegistry.js`, `eventTransports.js`), and it may not edit a file of this app. If it ever
  must, that is a request for a seam here, discussed here — never a patch carried privately.
- **The QR encoder needs no change.** `qrCodePath(text, encoder)` already takes the encoder as an
  argument, so the payment codes come from an encoder ProPT vendors itself.

The free app's own share of that work is §78 below: measurements and their progress over time, which
need no server and are worth having whether or not a paid tier is ever sold.

### 68.1 [ ] UPN generation stays OUT of LibrePT — ruled 2026-09-19 (Simon); the privacy half is open

A UPN payment order could be produced on the phone with the QR encoder this app already vendors. It
still stays out, for a reason that is not technical: **a paid capability shipped inside a free,
offline, open app cannot be enforced.** There are no accounts and no server to check a licence
against, and a licence key checked on the device is the shape people share.

**Open, and Simon named it as the thing to think about: privacy.** Moving the feature to a server
moves the DATA to a server. A UPN order carries who is paying, to whom, how much and for what, and an
invoice carries the client's name and address — so the tier that is easiest to enforce is also the one
that ends LibrePT's "nothing leaves this phone" promise. Whether there is a shape that enforces
payment without collecting the trainer's clients is the question EnterprisePT has to answer before any
of it is built.

### 68.2 [ ] A visual tag in the app that invites the upgrade

Wanted 2026-09-19 (Simon): LibrePT carries a tag inviting the upgrade to PRO, and PRO carries one
inviting ENTERPRISE.

**Red team, so it is decided rather than discovered later.** This app's rules say the trainer's
attention is the scarce resource and that the gym floor is the judge. An upgrade tag spends exactly
that attention, and it is the one element in the app whose purpose is ours rather than theirs. So it
has to be ruled, not styled:

- **Never during a session.** The live clipboard is a one-handed surface with a client waiting; an
  upsell there is the clearest way to make a trainer resent the app.
- **Where, then**: candidates are the ☰ menu, the support/about surface, and the empty states of the
  features PRO would extend. Each shows the tag to someone who is looking at the app rather than at a
  person.
- **Shown once, dismissible, and it stays dismissed.** A tag that returns is an advertisement.
- **It must say what PRO does**, not "upgrade". A reader who cannot tell what they would get has been
  asked to pay for a word.
- **Not hover-only, real padding, both languages** — the app's ordinary rules, which an upsell does
  not get to skip.
- **Open:** does a free-tier tag belong in an app whose licence and pitch are "free and complete"?
  The honest version names the paid tier without implying the free one is crippled.

### 68.3 [ ] Google Calendar leaves this repository — ruled 2026-09-27 (Simon)

**The ruling and all of its reasoning are in the private `~/Projects/EnterprisePT` project,
`TODO.md` §19.** In one line: every Google Calendar integration is a paid capability, and this app
keeps only the `.ics` invitation for one named session, because an `.ics` is a file the app writes
itself — no Google account, no scope, no network. What the trainer buys with PRO is not having to
type a session into the app and into Google Calendar both, plus a session that keeps itself in step
with the client.

**Nothing running changes.** No file in the app imports
[calendarFreeBusy.js](src/data/calendarFreeBusy.js), and
[googleAuth.js](src/data/googleAuth.js) asks Google for the Drive scope alone. So this is a removal,
not a rewrite, and the plan entries went with it already: §1.3 lost its room half, §1.5 lost the
Calendar half, §1.6 lost its external half, §45.12 closed.

**What still has to leave, and in this order:**

1. **The two sentences that are now untrue**, in [PRIVACY.md](PRIVACY.md) and
   [src/privacy.html](src/privacy.html): *scheduling data is planned to live in your own Google
   Calendar*. A trainer reads those. They are the only user-visible casualty of the ruling, and they
   go first.
2. **`src/data/calendarFreeBusy.js`**, its unit test, its line in
   [src/sw/cacheManifest.js](src/sw/cacheManifest.js) and its row in
   [docs/SRC_MODULES.md](docs/SRC_MODULES.md).
3. **The live calendar tests**: `tests/live/calendarFreeBusy.live.test.mjs`, and the calendar scope
   `tests/live/tokenScopes.live.test.mjs` and `tests/unit/test_google_credential.py` expect.
4. **`use_cases/uc3_publish_slots.md` and `uc4_client_self_subscription.md`**, their rows in
   [use_cases/INDEX.md](use_cases/INDEX.md) and [INDEX.md](INDEX.md), and every sentence pointing at
   them — [uc5](use_cases/uc5_session_day_deck_and_deep_links.md) names UC4 three times,
   [clientSignup.js](src/data/clientSignup.js) and
   [sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js) once each. A dead
   cross-reference fails the build, so this is one change, not four.
5. **Comments naming the calendar as a coming source**, in
   [scheduleConflicts.js](src/domain/scheduleConflicts.js),
   [overlapLanes.js](src/domain/overlapLanes.js),
   [erasureChecklist.js](src/data/erasureChecklist.js) and
   [docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md).

**Steps 1–5 done 2026-09-28**, with the stale root `use_case.md` index that still listed UC3/UC4.
The gym-calendar item of the erasure checklist is now manual for good (`reach: "never"`), and the
generic `busy` seam in `scheduleConflicts.js` stays for whatever supplies external busy times.
**Left for Simon, in the Google Cloud console** (the repository cannot do it): disable the Google
Calendar API in Part A's project, and remove `calendar.freebusy` from the consent screen's scopes
(docs/GOOGLE_CLOUD_SETUP.md A2 and the scope step now describe Drive only).

**Not part of this, deliberately**: the canary credential is granted `calendar.freebusy` beside
`drive.appdata` (§1.5.1). Narrowing it means running the consent flow again, so it waits for the
rotation that is due anyway.

## 78. [ ] Measurements, and a client's progress over time

**Raised 2026-09-24**, out of planning the paid tiers: Simon wants ability measurements and a picture
of a client's physical abilities over time, for coaches working with athletes. **This belongs in the
free app.** A test, a result and a chart need no server, no account and no sync — so building it here
costs nothing that a hosted tier would later have to undo, and it is the strongest thing on the whole
paid-tier list for a coach.

### 78.1 [ ] A measure is a definition plus a value, never a number on its own

"Squat 100" says nothing. It has to say one repetition maximum, in kilograms, tested a stated way. So
the record has two halves:

- **The definition**: a name, the protocol (how it is tested), the unit, and whether higher or lower
  is better. Definitions are shared between clients and reused, the way the exercise taxonomy of §13
  already works — a coach who renames a test must not silently split a client's history in two.
- **The value**: the number, its unit, the date, and who or what produced it.

### 78.2 [ ] An estimate and a measurement must never share a line

A field test that estimates a value is not the same fact as a measured one. The standard estimate of
maximal oxygen uptake is reported to overestimate the directly measured value by about 20 % in men
and 16 % in women ([validation study, NIH](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7356312/)).
A chart that draws both as one line therefore shows a client improving when the coach only changed
method.

**So the value carries how it was obtained, and a chart separates the two** — different series, or a
refusal to draw them together at all. This is a data-model decision, not a chart decision, which is
why it is written before anything is built.

### 78.3 [ ] What it must NOT do in the first version

- **No norms and no percentiles.** "You are in the 60th percentile for your age" is a claim about a
  population, from tables we would be copying without the right to and could not keep current.
- **No score out of ten, no composite fitness number.** It reads as authoritative and is arbitrary.
- **No health advice of any kind.** A measurement is a record; interpreting it is the coach's job and
  their professional responsibility.

### 78.4 [ ] This is health data, and it stays where the rest of it is

A record describing a person's body is health data. The app already keeps every client record on the
trainer's device and nowhere else, so this adds no new duty — provided it is stored the same way as
everything else and does not arrive with an export, a share link or a sync of its own.

### 78.5 [ ] Two things that cannot be retrofitted, so they are checked now

Raised while planning the hosted tier, and true regardless of whether it is ever built:

- **Every record needs an identifier that never changes and never collides between two devices.**
  Two devices inventing the same id is a merge nobody can repair afterwards.
- **Every record needs to say when it last changed, and on which device.** Without it, no later
  merge can decide which copy wins or show the trainer why.

**Open, and it is a reading job, not a design job**: does schema 5 already store both, for every
collection? Check before designing anything new on top. §77.1 — an imported exercise id could
overwrite a client, because every record of one schema shares a single key space — was found and
fixed on 2026-09-24, and it is the warning this section starts from: the identifier half is less
settled than it looks, so read what that fix changed before designing on top of it.

**Prebrano 2026-09-30 (Claude), za živo shemo 5 in PREVIEW.**

- **Identifikator: večinoma da.** Vsaka zbirka ima nespremenljiv `id`. Vse, kar ustvari aplikacija,
  dobi `newRecordId()` ([recordId.js](src/data/recordId.js)): UUIDv7 s 122 naključnimi biti iz
  `crypto.getRandomValues`, zato se dve napravi praktično ne moreta ujeti. Izjeme: (1) vzorčni in
  preizkusni zapisi imajo stalne id-je, enake na vsaki napravi — tako je narejeno namenoma; (2) uvoz
  knjižnice ohrani id vaje ali sklopa iz datoteke, če je na TEJ napravi prost (§77.1 je zaprl trk med
  zbirkami na eni napravi, ne med napravami), zato se lahko ujame z zapisom na drugi napravi; (3)
  starejše gradnje so delale 8-znakovne id-je iz `Math.random` (okoli 41 bitov), ki ostanejo veljavni.
- **Kdaj in na kateri napravi spremenjeno: ne, pri nobeni zbirki.** Ni polja `updatedAt` ne naprave;
  edino žig ob zapisu je `schemaVersion` celotne shrambe. Sinhronizacija z Drive je namenoma zgrajena
  brez njih (trismerno spajanje po id-ju, ki spor pokaže, ne izbere zmagovalca).
- **Kaj to pomeni:** druga polovica zahteva novo polje v vsaki zbirki, torej novo številko sheme
  (oštevilčene oblike so zamrznjene). To je odločitev za Simona, ne branje; točka (2) zgoraj je
  vredna enakega premisleka, če bo več naprav pisalo iste zapise.

## 67. [ ] Free text elsewhere is not checked for a client's name

Left open by §66 (2026-09-18): the refusal covers a session's name and location only. A routine's
name, a feedback note and a gym note are free text too, and a note about a session is where a trainer
has the most reason to write a person's name. Whether the same refusal belongs there is its own
decision — refusing a note may cost more than it protects, and a note is not a label the app reuses
on every screen the way a session's name is.

## 66. [x] A session may not be named after a client — shipped 2026-09-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#66-x-a-session-may-not-be-named-after-a-client--shipped-2026-09-18);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 65. [x] The erasure sweep does not reach repeating sessions — closed 2026-09-24

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#65-x-the-erasure-sweep-does-not-reach-repeating-sessions--closed-2026-09-24);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 64. [x] The gate fails on a different test each run, and each one passes on its own — fixed 2026-09-19

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#64-x-the-gate-fails-on-a-different-test-each-run-and-each-one-passes-on-its-own--fixed-2026-09-19);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 63. [ ] Migrations are tested from the oldest version, but not for ever and not on a device

Asked 2026-09-17 (Simon): is there a test that covers migrations from the oldest version onward, for
ever? Checked the same day (Claude):

**What exists.** [frozenBackupCorpus.test.mjs](tests/unit_js/data/frozenBackupCorpus.test.mjs)
migrates one frozen backup file per schema, 0 to 4, through `migrateState`, checks that the chain
has no gap, and that every fixture on disk is used.
[test_schema_migrations.py](tests/e2e/test_schema_migrations.py) and
[test_indexed_db_engine.py](tests/e2e/test_indexed_db_engine.py) boot the app on an old
`localStorage` database.

**What is missing:**

- **"For ever" is a comment, not a check.** A new schema must bring a fixture of the one it
  supersedes, but the list of fixtures is written by hand; nothing fails when schema 5 arrives
  without one. It should be derived from `MIGRATION_STEPS`: one fixture for every version a step
  starts from.
- **No device database at any version.** Every fixture is a backup file or a `localStorage` value.
  What a trainer's phone holds — IndexedDB stores per schema, the meta store, the read-schema choice
  — is never booted from a frozen copy, so store provisioning, backfill and the P rebuild are only
  ever tested from a fresh install.
- **No P-era install — first snapshot added 2026-09-17.**
  [p_era_install.json](tests/fixtures/devices/p_era_install.json), made from 0649a0f, holds the
  demo seed, a repeating-session rule, a cancelled evening and a sent invitation;
  [test_device_database_corpus.py](tests/e2e/test_device_database_corpus.py) boots it and checks all
  three survive. Checked that it catches the §61 danger: booted reading schema 4, the rule and the
  invitation are gone.
- **The migrated data is checked field by field, not used.** No test opens the app on a migrated
  database and walks a feature on it.
- **A phone never runs the migration chain after its first boot** (checked 2026-09-17, asked by
  Simon). `migrateState` runs in three places only: once, when an install first moves its old
  `localStorage` database into IndexedDB; on every boot of a browser without IndexedDB; and when a
  backup file is restored. A new build on an IndexedDB install runs none of it, however often builds
  are published. There a new schema reaches the data through the backfill, which projects every
  record into the new store (`backfillSchema` in [readSchema.js](src/data/readSchema.js), whose
  comment says a real schema change's transform will live there). So one schema change has two
  paths — the chain for files, the projection for phones — and nothing checks that they agree.
- **Drive sync migrates nothing and checks no version** ([driveSyncService.js](src/data/driveSyncService.js)).
  A snapshot written by another device on another build is merged as it is.

**Wanted 2026-09-17 (Simon): a unit test that migrating PREVIEW data fails on the VERSION CHECK** —
to the active schema and to the next one alike — and not merely because the next version turns out
not to exist. Measured the same day with `migrateState` in Node:

- **4.5** is refused, but only as "written by a newer version". The day schema 5 is active, 4.5
  ranks below it and is accepted; the 4 → 5 step starts below 4.5 and is skipped, so the data would
  be stamped 5 without that step having run.
- **"PREVIEW"** is **accepted** (`ok: true`): an unrecognised version counts as below the floor, so
  it walks the whole chain from 1, is stamped 4, and its stored language is cleared.

The test states the rule itself: a preview version is refused as a preview, whatever the active
schema is — so it must also hold against a made-up active schema 5 — and the refusal says why.

**Proposed (Claude), not ruled:** a frozen device database per version, derived from the chain as
above; each booted in the browser tests, walked through a client, a routine, a repeating session and
an invitation, under both passes of §62. Blocks: §61, which needs the "P" snapshot first.

**Stanje 2026-09-30:** prva alineja je narejena (`ea16316`): zahtevani zamrznjeni zapisi se izpeljejo
iz `MIGRATION_STEPS`, in preizkus poimenuje različico brez zapisa. Preverjeno s skrito datoteko za
shemo 3.

**Stanje 2026-09-30, drugič: Simonovo naročilo z dne 2026-09-17 je izpolnjeno** — besedilo zgoraj
opisuje stanje pred `a37e926` (»PREVIEW replaces P«). Izmerjeno danes z `migrateState` v Node pri
aktivni shemi 5: »PREVIEW«, 4.5 in 5.5 so zavrnjeni kot predogled z razlogom in brez izvedenega
koraka; 6 je zavrnjena kot »zapisano z novejšo različico«; 5 gre skozi brez koraka. Pravilo je v
`refusalFor` ([schemaMigrations.js](src/data/schemaMigrations.js)) in `isPreviewVersion`
([migrationSteps.js](src/data/migrationSteps.js)), preizkus v
[schemaMigrations.test.mjs](tests/unit_js/data/schemaMigrations.test.mjs) (»PREVIEW data is refused by
its version …«). Odprt ostaja le predlog o zamrznjeni bazi naprave za vsako različico, ki ni odločen.

## 62. [x] Feature code may write only what the live schema declares — shipped 2026-09-19

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#62-x-feature-code-may-write-only-what-the-live-schema-declares--shipped-2026-09-19);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 61. [ ] Every install reads the preview schema P — the live schema must not be P

**Ruled 2026-09-17 (Simon): the live schema must not be P; that would be data loss for trainers in
production.** Checked the same day (Claude), from the code:

- `DEFAULT_READ_SCHEMA` is `"P"` ([recordSchemas.js](src/data/recordSchemas.js), since 93e2b1d,
  2026-08-10) and `CURRENT_SCHEMA_VERSION` is `"P"` ([migrationSteps.js](src/data/migrationSteps.js)).
  An install reads P unless its trainer chose another schema ([readSchema.js](src/data/readSchema.js)),
  and its data is stamped P.
- On the first boot of every new build, `rebuildPreviewSchemaIfBuildChanged` copies every `schema4`
  record over the P store. Its comments say P is discarded; `backfillSchema` only puts and never
  clears, so what exists only in P stays.
- **What exists only in P** (measured in Node against `SCHEMA_4` and `SCHEMA_P`): the sessions'
  fields `startDate`, `seriesId`, `occurrenceDate` and `cancelled`, and two whole collections,
  `invites` and `sessionSeries` — invitations and the rules of repeating sessions. All are used by
  live features.
- **The four fields are safe today only by accident**: the star write copies every field into
  `schema4`, undeclared ones included (§58), so the copy over P brings them back. **The two
  collections are in the P store alone**: the star write writes a collection only where its schema
  declares it, and no backup carries them.

**Ruled 2026-09-17 (Simon): schema 4 is the live schema; P is discarded at every migration.** Also
ruled: swallow the inconsistency — nothing held in 4 may be lost or thrown away.

**What that settles, and what it does not (Claude):**

- **The four fields: settled.** They are already in `schema4` and in every recent backup; declaring
  them in `SCHEMA_4` makes the schema say what the data holds, as `alias` did (§60).
- **The two collections: not settled.** Pointing reads at 4 today would show no invitations and no
  repeating sessions — the rules sit only in the P store, which is then discarded. They must be
  declared in `SCHEMA_4` AND copied from the P store into `schema4` once, before reads move.
- **The stamp: not a problem on a phone — corrected the same day.** An IndexedDB install stores no
  schema version: once its data is imported, boot runs no migration and sets the version in memory
  (`loadSavedState` in [stateStore.js](src/data/stateStore.js)). Only the `localStorage` fallback and
  a backup's `runtimeSchema` carry "P". The earlier claim that installs are stamped "P" and would be
  refused was wrong.

**Ruled 2026-09-17 (Simon), from schema 5 on: the P database is thrown away whenever a test run
ends and whenever the app starts, and the app switches to the active database.** P is only ever a
temporary demo or test. Open with it (Claude): a demo that must survive a reload then cannot live in
P — the sandbox workspace (§40) is already a separate database for sample data, so whether a demo
needs P at all is the question; and nothing in the app offers a trainer the choice to read P today
(only a test sets `librept_read_schema`), which keeps that true only while nobody adds such a choice.

**Ruled 2026-09-17 (Simon), the order:**

1. Schema 4 takes the four session fields and the two collections, `invites` and `sessionSeries` —
   the inconsistency is accepted.
2. **A migration step P → 4** brings the records that exist only in the P store into `schema4`.
   On a phone this cannot be a step of `migrateState`, which does not run on an IndexedDB boot; it is
   a one-time store copy at boot, marked done in the meta store, like the backfill.
3. Then the preview schema is renamed **PREVIEW**.
4. **PREVIEW is never a step in the migration chain.** It is newer than 4 but a dead branch:
   4 → PREVIEW → 5 must not exist; the chain runs 4 → 5.

Tested from a frozen device database of a P-era install holding a repeating session, a cancelled
evening and an invitation (§63), made from today's code before any of this changes.

**Steps 1 and 2 done 2026-09-17** — schema 4 declares the fields and both collections, and
[previewTransfer.js](src/data/previewTransfer.js) moves what only the P store holds, once, at boot.
**Also ruled with them (Simon): P is not an alias of PREVIEW** — P is the legacy preview store data
is moved out of; PREVIEW is the future CI and preview schema; the two mean different things.
**Schema 4 made active 2026-09-17:** `DEFAULT_READ_SCHEMA` and `CURRENT_SCHEMA_VERSION` are 4; a stored
"P" ranks as 4. Replaced by the PREVIEW schema below on 2026-09-18.

**Ruled 2026-09-17 (Simon): PREVIEW uses the same solution as a released schema** — a store in the
main database, provisioned and written like schema 4 and 5 and 6 will be. Done 2026-09-18:

- **The database version stopped being a schema number** ([indexedDb.js](src/data/indexedDb.js)). It
  was the highest numbered live schema, which could not provision a store for a schema named PREVIEW
  and would have LOWERED the version the day a preview was retired; IndexedDB then refuses to open the
  database at all. The database now opens at whatever version it holds and is reopened one version
  higher only when a store is missing.
- **`SCHEMA_PREVIEW` replaces `SCHEMA_P`** in the live schemas, with one collection only it declares,
  `previewProbe`, so staging is exercised by the real schemas: a record of it reaches the PREVIEW store
  alone, a backup leaves it out, and a restore names it as lost. No screen writes one.
- **Preview data is refused by what it is**, before any rank comparison (`isPreviewVersion`), which is
  the test §63 asked for.
- The P store is no longer written. It stays on disk, and [previewTransfer.js](src/data/previewTransfer.js)
  still reads it once on an install that has one.

**Done 2026-09-18: the PREVIEW store is emptied when the build changes**, and refilled from schema 4
only where it is read — at activation (`setReadSchema`) or for an install already on it. Emptying at
every start was written first, on the earlier ruling, and Simon changed it the same day: a preview
session spans reloads, and CI's second pass reads the store on every navigation, so an empty store at
each start left it reading nothing. Filling it for an install that never asks would cost a projection
pass on every boot — 22ms for the demo set, about 400ms at 3,000 records.

**Still open:** the second browser-test pass that reads PREVIEW (§62), and discarding preview data at
the end of a test run.

## 60. [x] A numbered schema changed shape without a new number — ruled and enforced 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#60-x-a-numbered-schema-changed-shape-without-a-new-number--ruled-and-enforced-2026-09-21);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 59. [x] Erasing a client keeps their alias — fixed 2026-09-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#59-x-erasing-a-client-keeps-their-alias--fixed-2026-09-18);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 58. [ ] A record is written whole, so a field cannot be staged at all

**[x] First step shipped 2026-09-23 (§45.5 needed it):** a store no longer receives a field only a
newer live schema declares — schema 4's store never holds `exercises.source` — and a field the schema
being read cannot see is carried over from the row a store already holds, so a save made while
reading an older schema (the toggle §76 builds) cannot wipe it (`narrowToSchema`, `fieldsHiddenFrom`
in [recordSchemas.js](src/data/recordSchemas.js)). A field no live schema declares is still written
whole. **Still open:** renames and retypes — §71's per-schema projector.

**By design a backup is made at schema 4, the newest numbered one, never at P** (Simon,
2026-09-17), so a field that exists only in P is not in it. The preview database is used only for
testing and demonstrations, never live for a client. [backupFile.js](src/data/backupFile.js) leaves out only the
COLLECTIONS schema 4 does not declare; each record is copied whole through `projectCollection`,
which keeps every field.

**Measured 2026-09-17 (Claude)** with `buildBackupPayload` in Node: a session holding `seriesId`,
`occurrenceDate` and `cancelled` — fields schema 4 does not declare — came out in a file stamped
`schemaVersion: 4` with all three. The star write does the same to the `schema4` store, so
`rebuildPreviewSchemaIfBuildChanged` in [readSchema.js](src/data/readSchema.js) does not lose them
either, although its comment says it does.

**Re-measured 2026-09-21 (Claude): those three instances are gone, and the mechanism is not.** §61
declared all three fields in schema 4 on 09-17, and `SCHEMA_PREVIEW` today is `SCHEMA_4` plus one
collection (`previewProbe`) and a stricter `required` on `startDate` — it adds no field at all. So
the defect has zero instances and no test holds it at zero. The way it reached zero is exactly what
§60 was about: the fix for "a preview field leaks into the schema 4 file" was to widen schema 4.

The mechanism: `projectSession` is `{ ...session, collection }` — the whole domain object. Staging
is enforced per **collection** only (`schemaAcceptsCollection`); nothing anywhere compares a
record's fields against the shape it is being written at. `undeclaredFields` exists in
[recordSchemas.js](src/data/recordSchemas.js) and no live code calls it.

**What §60's ruling (2026-09-21) changes here.** Numbered shapes are frozen, so a new field can no
longer be absorbed into schema 4 — it is staged in `SCHEMA_PREVIEW` until it mints a number. That
makes field-level staging necessary rather than hypothetical, and the earlier warning above ("do not
fix this before §61 is settled") has expired with §61.

**The obstacle, found 2026-09-21 and not yet solved.** §62's guard
([conftest.py](tests/conftest.py), `UNDECLARED_STORED_FIELDS`) reads each store and fails the test
when a row carries a field that store's schema does not declare. A field staged in PREVIEW alone is
therefore written into the `schema4` store by the fan-out and **fails that guard immediately** — so
today field staging is not merely leaky, it is impossible.

Trimming a record to its target schema's declared fields fixes both, but it also blinds §62's
guard: after trimming, the store can never hold an undeclared field, so the check can never fire,
and a feature writing ahead of **every** schema would be silently dropped instead of reported.

**Proposed (Claude), not ruled** — three parts, and the middle one is the price:

1. `projectCollection` takes the target schema and trims the record to the fields it declares.
2. **Trim on write only, never on read.** `fieldIssues` and `groupRecordsByCollection` accept
   unknown fields and collections on purpose, so an older build survives a newer file; trimming
   there would destroy that.
3. §62's guard moves from the store to the write path: a field declared by **no** live schema is
   still an error and must still fail the build.

Blocks: nothing now — §50.3's record badges are unblocked by §60 and go into `SCHEMA_PREVIEW`. What
this blocks is the first field that actually stages there reaching a trainer's backup correctly.

### 58.1 [ ] Removing a field is not expressible, and trimming alone does not make it so

Asked 2026-09-21 (Simon): how does the star write handle schema 5 removing a field while schema 4,
still live, has to go on writing it? Read from the code the same day (Claude):

**It cannot be expressed today.** `starWrite` in [stateStore.js](src/data/stateStore.js) projects
once, OUTSIDE the loop over schemas — `const projected = projectCollection(collection, record)`,
then the same object is `put` into every target store. A schema decides only **whether** a record
reaches a store, by collection; never **what shape** it arrives in.

**The model forbids the case rather than answering it.** `docs/DATA_MODEL.md`'s star-write
invariants say schema changes are expand-first, so no projection is ever lossy, and
[starWriteInvariants.test.mjs](tests/unit_js/data/starWriteInvariants.test.mjs) asserts that no
field is dropped between live schemas. So a field is removable only once every schema declaring it
has been RETIRED — which is exactly the deliberate decision §60 introduced. §60's retirement clause
is therefore the mechanism for removal, and nothing else is.

**Trimming (above) does not by itself allow removal while both are live.** The star projects from
the live domain object, so a field the app has stopped maintaining cannot be invented for schema 4's
store. "Schema 5 removes the field" means *schema 5 stops storing it*, not *the app stops producing
it*: while schema 4 is live and declares it, the app must keep producing a field none of its own
code uses. That cost is why expand-first exists, and it should be stated before anyone plans a
removal.

**One direction is unguarded.** §62's store guard uses `undeclaredFields`, which finds EXTRA fields,
not missing required ones — so an app that stopped producing a field schema 4 requires would not be
caught there. It is caught one level up, by `every live writer shape validates against every live
schema` in the same test file, which checks the write path's literals against every live schema.
Worth knowing which check actually holds this, because the obvious one does not.

**Proposed with it (Simon), not ruled: write the preview schema as `PREVIEW` instead of `P`**, so the
stored value says what it is. Found against it (Claude): `P` is stored, not only named — in every
preview database's `schemaVersion`, in the `schemaP` store name, and in a backup's `runtimeSchema` —
and the demonstration installs hold it. The migration runner treats an
unrecognised version as below the floor and replays the chain from 1, which re-asks the language
question (step 3 → 4), so "PREVIEW" must be taught to rank exactly as "P". P also stops existing the
day schema 5 is minted.

## 57. [x] The demo story tests count steps — fixed 2026-09-24

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#57-x-the-demo-story-tests-count-steps--fixed-2026-09-24);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 56. [ ] A commit is not tied to the tree its gate proved

Found 2026-09-17 (Claude). Commit ccacbdc (Codex, 22:47:27 on 2026-09-15) broke two demo story
tests deterministically, yet the gate before it PASSED (22:40:56–22:46:52). So the committed tree
was not the tree the gate proved — an edit landed during the run or in the 35 seconds after it.
Fixed in 040bcb9. Which of the two happened cannot be told: `run-history.jsonl` does not record
which tree a run tested.

Both are already forbidden in writing — no edits while a run is in flight, a snapshot of the tree
before and after it, a full gate before every code commit — but nothing enforces any of it. **Proposed (Claude), not ruled:** the
gate writes a fingerprint of `src/` and `tests/` into `.build-reports/`, and a git pre-commit hook
refuses a commit whose tree does not match it. It would bind every agent, not only the ones that read
the rules. Blocks: nothing; it is what stops the next one.

## 55. [x] Found while shipping §52.2 — both fixed 2026-09-20

Closed — §55.1 (a reopened record is named, and offers no Start) and §55.2 (Blossom's future colour)
are in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#551-x-a-history-record-opened-from-the-clipboard-reads-untitled-session-and-offers-start--fixed-2026-09-20);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 69. [x] One board test fails for a whole hour every night — fixed 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#69-x-one-board-test-fails-for-a-whole-hour-every-night--fixed-2026-09-21);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 70. [x] Reading a narrower schema narrows the whole database on the next save — closed 2026-09-23

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#70-x-reading-a-narrower-schema-narrows-the-whole-database-on-the-next-save--closed-2026-09-23).
No install reads a narrower schema any more: every install reads the newest numbered one (§76).

## 71. [ ] Nothing detects when the code stops supporting a live schema with the right data

Asked 2026-09-21 (Simon): *"potrebujeva mehanizem, ki zazna neskladje — dokler je shema živa, jo mora
koda podpirati s pravimi podatki"*, with the example of a field renamed AND retyped between schema 4
and 5, which must be converted correctly and written into both. **Settled with it (Simon, same day):
that means two records, one per store** — one domain object, two projections — not one record
carrying both field names. The domain keeps one representation; the conversion lives in the
projector.

This is the mechanism §58's trimming is only the first step of. Four questions the code has to be
able to answer, and today it answers none:

**1. Who converts.** Nobody. `projectCollection` is `{ ...domainObject, collection }` and the
fan-out projects ONCE, outside the loop over schemas, so a schema decides whether a record reaches a
store, never what shape it arrives in. A conversion function per schema is the precondition for
everything below.

**2. Does it fit.** `every live writer shape validates against every live schema` in
[starWriteInvariants.test.mjs](tests/unit_js/data/starWriteInvariants.test.mjs) already walks every
live schema. Today it validates the same untransformed object against all of them, which passes only
because every shape is a superset. It is the first thing that fails the day a rename exists — so it
is the detector, and it needs the per-schema projector under it to mean anything.

**3. Is it still the same thing.** Question 2 catches a missing or wrongly-typed field. It does NOT
catch a wrongly CONVERTED one: an instant shifted by a day is a perfectly valid string. What catches
that is the round trip — project the domain object into schema N, read it back, and require the
original. `projections are idempotent and invertible` is where this goes, generalised. **Cost to
state plainly: this needs a READER per schema, not only a writer** — `toDomainObject` today merely
drops the `collection` key, so a rename means two functions per schema.

**4. Can the shape language even see it.** No, and here is the proof, measured 2026-09-21 (Claude)
rather than argued:

- `sessions.startDate` is an INSTANT — `start.toISOString()` in [sessions.js](src/data/sessions.js).
- `sessionSeries.startDate` is a LOCAL CALENDAR DAY — `calendarDate(...)` in
  [sessionSeriesSeed.js](src/data/sessionSeriesSeed.js), read back through `atMidnight` in
  [sessionSeries.js](src/domain/sessionSeries.js), which builds the date with the LOCAL constructor
  precisely so a series never drifts a day east or west of UTC.

**The same field name already means two different kinds in two collections**, and `SCHEMA_4`
declares both as `{ type: "string" }`. `fieldIssues` knows only JS types, so no check in this
repository can tell them apart, and a conversion that treated one as the other would pass everything.

`docs/DATA_MODEL.md` §1 already carries the vocabulary — *instant* is ISO-8601 UTC, *calendar date*
is a local `YYYY-MM-DD`, and the rule of thumb is that "at" is UTC and "on" is local. It also records
the bug that proves the distinction is not academic: `toISOString()` on the consent date filed a
trainer who ticked the box at 00:30 in Ljubljana as having signed *yesterday*. **Proposed (Claude),
not ruled:** a field descriptor carries that kind alongside its JS type, so question 2 can see a
retype at all.

### 71.2 [ ] The round trip is a TEST, not a runtime check — answered 2026-09-21, not ruled

Asked by Simon the same day: does question 3 above go into production or into the tests? Answered
(Claude): **into the tests**, on two grounds.

A check nothing can act on is not a check. If the round trip failed mid-save, the only runtime
responses are to refuse the trainer's save — worse than the defect, with a client standing there —
or to log and carry on, which is not a check. And the round trip is a property of the CODE, of the
projector/reader pair, not of any one record: proved once, it holds for every input.

**Where that answer is weak, and it has to be said:** for a TIME conversion, correctness is not
input-independent. So the corpus has to carry the value-dependent edges deliberately, or "proved"
means nothing — an instant either side of local midnight, a daylight-saving change, a browser east
and west of UTC, a missing field and an empty string. The first and third are exactly where
`sessions.startDate` (an instant) and `sessionSeries.startDate` (a local calendar day) would be
confused.

**One production check IS earned, and it is a different check.** It runs at the two moments when
data crosses a schema boundary and the app stops to speak to the trainer anyway: restoring a file,
which already asks before it replaces anything and names what would be lost, and switching to
another schema (§70).

What the trainer sees at that moment is one sentence, before anything changes, saying what the
schema they are moving to cannot hold and how many records that is — for example, that this schema
cannot hold repeating sessions, that they have three of them, and that they will not see them while
they are on it. Then they choose.

That happens a handful of times in the life of an install, not on every save, so it is allowed to be
slow. The round trip above is the opposite: it would run on every save, on a phone, mid-session, and
would have nothing it could do when it failed.

`backupHealth.js` is the precedent for what such a check may cost, not for what it does. To answer
"how many records changed since the last backup" it would have to keep a whole second copy of the
database to compare against. Instead it keeps one short number per record, computed from that
record's contents — a few dozen bytes each. Change the record and the number changes. On a phone the
answer has to be that cheap.

### 71.1 [ ] Schema 3 is the test subject, and stays test-only — ruled 2026-09-21, not yet built

Asked by Simon whether schema 3 could be made, and whether old backups exist. Both answered the same
day (Claude): schema 3 already exists as a step in the migration chain, and
`tests/fixtures/backups/` holds one frozen file per schema, 0 to 4.

**Schema 2 against schema 3 is the maintainer's own example, from this project's history.** The
schema 2 session carries `day: "today"` and `time: "09:00 - 10:00"` and no absolute time; the schema
3 session adds `startDate: "2026-08-10T05:00:00.000Z"`. A local bucket plus a text range became an
absolute instant. The rename half is in the history too: schema 4 still declares BOTH `titles` (an
array, from schema 1 rows) and `title` (a string) — a rename with a type change that never got a
migration step, which is exactly what §60 now forbids.

**Ruled 2026-09-21 (Simon): schema 3 is for TESTING ONLY.** It is declared as a shape the mechanism
above is proved against, and it is **not** registered in `LIVE_SCHEMAS` — no store, no place in the
fan-out, no cost carried for ever under §60's "every numbered schema stays live". Reviving it as a
live shape would also have needed §70 settled first, since schema 3 is narrower than schema 4.

Red team, recorded so it is not rediscovered: as a product capability a rollback to schema 3 was
never wanted anyway — schema 3 has no `alias`, no `invites` and no `sessionSeries`, so a trainer
arriving there would lose their repeating sessions and invitations.

## 72. [x] Should every evening of a repeating session be stored? — decided 2026-09-21: no

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#72-x-should-every-evening-of-a-repeating-session-be-stored--decided-2026-09-21-no).
The model stays: the rule is stored once, and an evening becomes a stored record only when the
trainer opens, moves, cancels, starts or edits the plan of it.

## 73. [~] The guided story is offered by chapter, and the language choice comes from the registry

Asked for 2026-09-21 (Simon): the sandbox's message card and the splash should carry the whole table
of contents of the guided walkthrough, with any chapter clickable; and the splash should be ready to
offer any official European language.

### 73.1 [x] A table of contents on both surfaces — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#731-x-a-table-of-contents-on-both-surfaces--shipped-2026-09-21);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 73.2 [x] Only a chapter that actually runs from cold is offered — measured 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#732-x-only-a-chapter-that-actually-runs-from-cold-is-offered--measured-2026-09-21).
The programme chapter is not an entry point; §73.3 is the open decision that would make it one.

### 73.3 [ ] Decide whether the sandbox seed should carry a submission already waiting

What would make §73.2's programme chapter an entry point: the sandbox's seed holding a signup from
Ana that has not been reviewed yet. That is a change to what EVERY trainer sees on first entering the
sandbox — a pending submission in the feed — and it would also change what the arrive chapter
demonstrates, since that chapter delivers the same submission again.

**Simon's call**, not a fix: it trades one line of the table of contents against the state the
sandbox opens in.

**2026-09-25: the programme chapter is an entry point without a seed change.** Ana's file moved into
a chapter of its own, `review`, which is the one left out of the index (§38.21). What remains of
this question is only whether that short chapter should be offered too.

### 73.4 [x] The language choice is built from the shipped dictionaries — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#734-x-the-language-choice-is-built-from-the-shipped-dictionaries--shipped-2026-09-21);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 73.6 [x] The index is open, and the "show me around" button is gone — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#736-x-the-index-is-open-and-the-show-me-around-button-is-gone--shipped-2026-09-21);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 73.8 [x] The chapters carry Simon's own names — shipped 2026-09-21

Closed — the names and their English are in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#738-x-the-chapters-carry-simons-own-names--shipped-2026-09-21).

### 73.9 [x] The splash's walkthrough button went the same way — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#739-x-the-splashs-walkthrough-button-went-the-same-way--shipped-2026-09-21).

### 73.10 [x] A chosen chapter counts inside itself — fixed 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#7310-x-a-chosen-chapter-counts-inside-itself--fixed-2026-09-21).
The whole story still counts across its own length, handover included; §38.9 keeps that half.

### 73.7 [ ] Two chapters the story does not have yet

Proposed by Simon 2026-09-21, alongside the names of the four that exist:

- **Ustvarjanje termina za trening** — between *Sprejem treh novih strank* and *Izvedba in
  prilagoditve treninga*. The story never shows a session being CREATED: every session it drives was
  already in the seeded sandbox, so the one act a trainer performs most often is the one the demo
  skips.
- **Varnostne kopije in uporaba več naprav** — between *Izvedba in prilagoditve treninga* and
  *Pregled zaznamkov in priprava treningov*. A chapter about the app rather than about a client, and
  the only one that would touch Google Drive.

Neither is a rename: each is a new chapter of the guided story — steps that drive the app's real
controls, narration in both languages, and a cold-start walk that passes (§73.2). The Drive one also
has to decide what it demonstrates on a machine with no Drive account connected, because a guide
that stops at a sign-in screen in front of a visitor is the failure §28.14 exists to prevent.

**Not started. Agree the shape of each before the copy is written.**

### 73.5 [ ] Which official European languages, and translated by whom

Open, and the reason §73.4 stopped at the structure. Each language is 6xx keys. Machine translation
is a guess, and this app's own rule is that a guess is not reported as a measurement — so the
decision needed is **which languages** and **who translates them**, before any file is added.

## 74. [x] The sessions board's header and its calendar — all four done, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#74-x-the-sessions-boards-header-and-its-calendar--all-four-done-closed-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 75. [ ] The displayed date format should be the trainer's choice

Simon, 2026-09-21: "date format mora biti izbiren zato, da si ga lahko vsakdo prilagodi", and
"date format v prikazu, zapis je vedno utc".

So: **display only**. What is stored does not move — dates and times are written in UTC and stay
that way, and nothing about a chosen display format may reach a record, a backup or a sync.

**This changes a standing product rule**, which is why it is written down rather than built: the app
currently decides the written form itself, ISO dates and 24-hour times everywhere, in every language,
precisely so that a Slovenian app on a US-set phone cannot show 09/12/2026 for the twelfth of
September or ask for a time in AM/PM. A trainer's own choice is a third thing, different from both
the app deciding and the phone deciding — it keeps the device out of it, which is the part that
matters, but the rule about the app's own decision has to be rewritten rather than quietly broken.

Open: which formats are offered, where the choice lives, and whether it covers times as well as
dates. Entry stays as it is — `timeField.js` and `dateField.js` on `steppedField.js`.

## 76. [~] The trainer chooses which supported version of the app to run — schema 5 shipped, the choice in progress

Asked 2026-09-23 (Simon): a setting that supports several versions of the app and of its schemas,
switches between them quickly, and lets the trainer turn on any supported version. Ruled with it the
same day (Simon):

1. The star write exists precisely so that several versions can be live and used in turn.
2. The trainer chooses how the app BEHAVES. The schema is a technical detail they never see.
3. Older supported versions get security and critical fixes.

**Read together with §18's standing decision, this is one build, not several.** Every supported
version is code inside the same build, so a fix lands once and every supported version has it. That
is how point 3 holds without release branches, per-version hosting or backports, all of which §16
dropped. Designed below (Claude, 2026-09-23). **Simon, the same day: fix the defects and implement
the switching** — which puts it into work; the three questions at the end of §76.6 are still his.

### 76.1 Three identities, kept apart

- **App version** — what the trainer chooses. A name and a date, for example *2026-10*, with one
  sentence on what it changes. New to this design.
- **Schema** — the shape of the stored data. Each app version names the schema its behaviour
  writes; several versions may name the same one. **Every install READS the newest numbered schema,
  whatever version runs** (§76.4).
- **Commit SHA** — which code is running, for support. Unchanged.

### 76.2 One registry of app versions

One file under `src/data/` lists every supported app version: its id, the schema it reads, its
status, the text key of its one-sentence description, and the behaviours it turns on. The status is
one of:

- `default` — what a new install runs. Exactly one version has it.
- `supported` — offered to the trainer, older or newer than the default. A newer one shows the
  `BETA` tier of §18.12's ribbon, which that section already reserves for "an in-app behaviour
  opt-in".
- `preview` — CI and demonstrations only, never offered (§61's ruling). It reads PREVIEW.

**`LIVE_SCHEMAS` is checked against the registry, not derived from it** (built 2026-09-23, Claude):
`appVersions.test.mjs` fails the build when a numbered live schema is named by no version, or a
version names a schema that is not live. Deriving it would have made recordSchemas.js import the
registry for one line; the check gives the same guarantee without that dependency.

**Feature code asks for a behaviour by name, never for a version number.** It asks, for example,
whether circuits are offered when a plan is built, and never whether the version is at least
2026-10. A comparison of versions spreads through every file that branches. A named behaviour lives
in one registry entry, and a check fails the build when a behaviour named in the code is declared by
no version, or is turned on in every supported version (its branch is then dead and must be removed).

### 76.3 What the trainer sees, and what happens when they switch

- In the ☰ menu ([applicationHeader.js](src/modules/common/applicationHeader.js)), beside *My
  details*: **App version**, which opens a list of the supported versions with the running one
  marked and each one's sentence.
- **Before the switch, one sentence says what the chosen version cannot show, and how many records
  that is** — for example, that it has no circuits, that the trainer has three, and that they are
  kept but not shown while that version runs. This is the production check §71.2 already earned.
  The sentence is shown only when the number is not zero.
- **The switch is refused while a session is running**, with the reason on the screen. This follows
  §18.12's rule that nothing blocks a trainer who has a client in front of them.
- The switch stores the chosen version and **reloads the page**, so every screen is built again
  under the new behaviour. It does not change which store is read. The build is already in the
  service worker's cache, so the reload also works offline.
- The choice belongs to the device, like the theme, and is kept in `localStorage`.

### 76.4 What the data layer guarantees — changed while implementing, 2026-09-23

**The design above had each version READ its own schema. Implementing it found why that loses data**
(Claude, read from the code): a backup is built from the data held in memory
(`buildBackupPayload(state)` in [backupFile.js](src/data/backupFile.js)), and memory holds only what
the read brought in. A trainer on a version that reads 4 would write a schema-5 backup without their
circuits; a restore replaces the whole database, so restoring it would delete them from store 5 too,
and `summarizeReplacement` would not name them, because it also counts memory. Drive sync is built
from memory as well.

**So every install reads the newest numbered schema, and the version decides behaviour only.** Memory
then always holds everything, and a save, a backup and a sync carry everything with no rule of their
own. §70's loss cannot arise on a trainer's phone, and §70 is closed. What keeps it true is one rule
with a check: **a field or collection leaves the newest schema only with the last version that uses
it** — `recordSchemas.test.mjs` fails the build otherwise. Schema 4 goes on being written for a phone
that still has the previous build cached, which reads store 4 alone (§18's reason for the star write).

**Found and fixed on the way (shipped 2026-09-23):** a newly live store was filled from the store being
READ. The first boot reading schema 5 would have found 5 empty, filled nothing, and opened the app
empty. It is now filled from the schema below it. A snapshot of a schema-4 phone, made from fc172f9's
code, proves it in `tests/e2e/test_device_database_corpus.py`; with the old rule that test finds no
records at all.

**§71 is still needed, for a RENAME only.** A schema that renames or retypes a field needs one
projector and one reader per schema, and the test of every pair of supported versions still belongs
with it: switch, edit, create, delete, switch back, and nothing the trainer did not delete is missing.

### 76.5 What each supported version costs

- **One browser-test pass per supported version**, the way §62 adds one for PREVIEW. The last full
  gate run took 341 seconds (`.build-reports/last-run.json`). How much of that the browser tests take
  was not measured, so the cost of a second pass is not stated here.
- **Every behaviour branch stays in the code** until the last version that needs it is retired.
- **One more star-write store** for each new schema, as `docs/DATA_MODEL.md` already counts it.

**Proposed: at most two numbered versions are supported at once**, plus PREVIEW — the default and
one other. Two versions give the trainer both a way back and a way forward, while each further
version adds a browser-test pass and one more branch in every feature that differs.

### 76.6 The first use: schema 5 for §45.5

§45.5, importing the trainer's own library, needs schema 5: `SCHEMA_4` plus an optional
`exercises.source` (a string) and a new collection `circuits` `{id, name, series?, exercises,
source?}`. `name` stays required (Simon, 2026-09-23): an imported circuit without a title is given
one by the import. Simon ruled the same day that the cutover waits for this design.

**[x] Schema 5 shipped 2026-09-23** — declared, frozen, read by every install and written into
backups; see [CHANGELOG.md](CHANGELOG.md).

**[x] The registry and the menu item shipped 2026-09-23** ([appVersions.js](src/data/appVersions.js),
[appVersionDialog.js](src/modules/common/appVersionDialog.js)). Two versions: *2026-09* names schema 4;
*2026-10* names 5 and turns on `libraryImport`, which shows the exercise library's Import button.
**Chosen (Claude), not ruled: 2026-10 is the default**, because the library import had already shipped
to every trainer that day; making 2026-09 the default would have taken it away. One field to change.

**[ ] Not built:** the sentence before a switch naming what the chosen version will not show and how
many records (§76.3's second point) — today 2026-09 only hides the Import button and hides no data;
the `BETA` ribbon of §18.12; a second browser-test pass per version (§76.5).

**Open for Simon:** whether the default stays 2026-10; the cap of two numbered versions; and the Drive
sync rule — which §76.4's read-the-newest rule has made unnecessary, since sync is built from memory
and memory holds everything.

## 77. [ ] Odprte ugotovitve pregleda Claudovega dela v tednu 2026-09-21–2026-09-24

**Pregled izveden (Codex, 2026-09-24).** Obseg je zgodovina od ponedeljka 2026-09-21 do
commita `06b292b`: 58 commitov in 138 spremenjenih datotek. Avtorstvo se ugotavlja iz
sporočil commitov; `389943e` je Codexov, `7316580` pa Codexovo delo, ki ga je prevzel in
commital Claude. Nedokončani popravki v delovnem drevesu niso del tega prereza.
Ob zaključku sta dodatno pregledana `fdc92b6` (oznake gumbov za bralnik zaslona) in
`69b7a69` (diagnostika testa zapiranja kartice); spodnjih sedmih napak ne spreminjata.
Pregled zajema shranjevanje, migracije, izbris strank, uvoz in izvoz knjižnice, izbiro
različice, prevode, predstavitev po poglavjih, koledar, pisave in pripadajoče teste.

Spodnje napake so ponovljene na izolirani kopiji `06b292b`, z začasnim profilom Chromiuma
in njegovo pravo bazo IndexedDB, brez dostopa do uporabniških podatkov. P1 pomeni možnost
izgube podatkov, P2 napačno delovanje, P3 manjšo napako prikaza ali filtriranja.
Vsaka točka ostaja odprta do popravka in regresijskega testa. Že evidentirane omejitve
prevodov (§38.20), nestabilen test zapiranja kartice (§53) in nedokončani deli izbire
različice (§76.6) se ne podvajajo.

**Preverjanja:** vseh 146 obstoječih testov v desetih pregledanih datotekah za
podatke, uvoz, načrte, predstavitev in začetni zaslon je uspešnih na izolirani kopiji.
Uspešen je tudi obstoječi preskus prikaza znakov brez sistemskih pisav iz
[test_text_glyphs_render.py](tests/e2e/test_text_glyphs_render.py), izveden v izoliranem
Chromiumu. Spodaj navedeni primeri razkrivajo manjkajočo pokritost, ne odpovedi teh testov.
Za ta dokumentacijski zapis se preverita `agent_tools.doclinks` in
`agent_tools.todo_hygiene`; celoten `build check` ni del tega pregleda. Claudov ločeni
uspešni zagon za njegova zadnja commita ne dokazuje, da so zgornje napake odpravljene.
Pregled ne spreminja programske kode.

### 77.1 [x] P1 — Uvoženi ID vaje lahko prepiše stranko — popravljeno 2026-09-24

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#771-x-p1--uvoženi-id-vaje-lahko-prepiše-stranko--popravljeno-2026-09-24);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 77.2 [ ] P1 — Vrnitev iz dejanske stare izdaje izgubi njene spremembe

**Izvor:** `19ea11c`, [readSchema.js](src/data/readSchema.js),
`ensureLiveSchemasBackfilled`; [stateStore.js](src/data/stateStore.js), `SCHEMAS` in
`starWrite`. Nova izdaja bere `schema5`, ki jo iz `schema4` napolni samo enkrat. Stara
izdaja `fc172f9` pozna samo 4 in PREVIEW ter zato ne posodobi `schema5`.

**Ponovitev:** z `06b292b` shrani stranko z imenom `Before downgrade`; z dejansko kodo
`fc172f9` na isti bazi spremeni ime v `Edited in old build` in počakaj na zapis. Po
ponovnem odprtju s kodo `06b292b` je ime spet `Before downgrade`. Sprememba je še v
starejši shrambi, nova je ne prebere; naslednje shranjevanje nove izdaje lahko prepiše
tudi starejšo shrambo. To ni menjava vedenja v meniju App version: tisti možnosti obe
uporabljata novo kodo in zato tega primera ne preverita.

**Odprava:** določiti in izvesti varen prehod med dejanskimi izdajami, vključno s staro
predpomnjeno aplikacijo; ne razglašati stare shrambe za združljivo samo zato, ker jo nova
koda še piše. Regresijski test mora naložiti obe izdaji in preveriti spremembo, dodajanje
in brisanje ob povratku. Obstoječi
[test_read_schema_toggle.py](tests/e2e/test_read_schema_toggle.py) uporablja samo novo
kodo. Blokira zagotovilo varnega povratka oziroma dela stare predpomnjene izdaje (§76.4).

### 77.3 [x] P2 — Uvoz sklopa tiho zavrže nenumerične cilje vaj — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#773-x-p2--uvoz-sklopa-tiho-zavrže-nenumerične-cilje-vaj--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 77.4 [x] P2 — Vir iz imena datoteke izgine ob potrditvi uvoza — popravljeno 2026-09-25

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#774-x-p2--vir-iz-imena-datoteke-izgine-ob-potrditvi-uvoza--popravljeno-2026-09-25);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 77.5 [x] P2 — Ponovni uvoz istega kataloga podvoji sklope — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#775-x-p2--ponovni-uvoz-istega-kataloga-podvoji-sklope--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 77.6 [x] P3 — Ime uvoznega vira se lahko zamenja z internim filtrom — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#776-x-p3--ime-uvoznega-vira-se-lahko-zamenja-z-internim-filtrom--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 77.7 [x] P2 — Danes ne prikaže današnjih vadb ob aktivnem datumskem filtru — popravljeno 2026-09-24

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#777-x-p2--danes-ne-prikaže-današnjih-vadb-ob-aktivnem-datumskem-filtru--popravljeno-2026-09-24);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 79. [~] German (de) — the second market, Germany and Austria

**Asked 2026-09-26.** German-speaking trainers are the plan's second market. The app now ships a
German dictionary ([src/i18n/de.js](src/i18n/de.js)), a German consent letter
([src/i18n/consent/de.js](src/i18n/consent/de.js)) and the German consent form and privacy notice
([docs/templates/de/](docs/templates/de/INDEX.md)). All of it is a **machine translation**. It uses
the familiar "du", as the Slovenian uses "ti", and the DSGVO's own words for consent (Einwilligung)
and withdrawal (Widerruf).

German is selectable from the language menu, the splash and the client's intake page as soon as
this is deployed. Nothing stops a trainer from sending the German consent letter before §79.1 is done.

### 79.1 [ ] A German speaker reviews the German text — *Blocks:* inviting German-speaking trainers

Read `de.js`, `consent/de.js`, both documents in `docs/templates/de/` and the German part of
[src/data/demoText.js](src/data/demoText.js). The terms least certain: *Klemmbrett* for the
clipboard, *Sandbox*, *Zirkel* for a circuit, *Kunde* (generic masculine) for a client, *Routine*,
*Wdh.* for reps, the reply words *ICH WILLIGE EIN* / *WIDERRUF*, and *Speicherdauer*. Before real
use with clients, the consent letter and the notice also need someone who knows German
data-protection law.

### 79.2 [ ] Which supervisory authority the German notice names — *Blocks:* §79.1's legal review

The English notice, and so the German one, names the Slovenian Information Commissioner and the
European Data Protection Board's list. A client in Germany or Austria would look for their own
authority (in Germany one per federal state; in Austria the Datenschutzbehörde). Naming them changes
the notice's substance in one language only, so it is a decision, not a translation fix.

### 79.3 [x] The evening theme card names an option the menu does not have — popravljeno 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#793-x-the-evening-theme-card-names-an-option-the-menu-does-not-have--popravljeno-2026-09-26);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 79.4 [x] The client documents declare `lang="en"` whatever their language — popravljeno 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#794-x-the-client-documents-declare-langen-whatever-their-language--popravljeno-2026-09-26);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 80. [ ] Preizkus prve uporabe v vlogi osebnega trenerja

**Naročilo:** do pet ur raziskovalnega preizkušanja v brskalniku, brez branja
uporabniške dokumentacije. Simulirati izmišljene stranke, podatke in treninge;
po vsakem scenariju tukaj shraniti korake, opaženi rezultat, težavo, vpliv na delo
trenerja in predlog izboljšave. Nove scenarije izbirati glede na opaženo v aplikaciji.

**Stanje:** preizkus poteka prek Chrome CDP v ločenem začasnem profilu brez obstoječih
podatkov. Po navodilu uporabnika preizkušamo objavljeni
[LibrePT](https://stutek.github.io/LibrePT/), različico `0625bd6`, ne lokalnega razvoja.
Začetna omejitev manjkajočega orodja Browser je odpravljena z uporabo Chrome CDP.
Pet ur preizkušanja še ni opravljenih; poraba zakupljenih žetonov računa ni dostopna.

**Vsaka ugotovitev je 2026-09-26 ponovno preverjena v kodi na `main`** (Claude, librept-72).
Objavljena različica `0625bd6` je 14 commitov za `main` in dva od teh sta i18n commita
(nemščina §79, `<html lang>` §79.4), zato poročilo o objavljeni aplikaciji samo po sebi ne
pove, kaj je še narobe. Verdikt stoji pod vsako točko. Trije potrjeni popravki sodijo v kodo,
ki jo §81 na novo zgradi, in so zato zapisani tam; en je bil popravljen tu; eden je zavrnjen.

### 80.1 [~] Prva stranka in prvi individualni trening — v teku

**Scenarij:** trener prvič odpre aplikacijo in brez navodil poskuša dodati izmišljeno
stranko »TEST Ana Novak«, njen cilj »redno trenirati dvakrat tedensko« ter pripraviti
45-minutni trening s tremi vajami. Nato želi trening začeti, zapisati dejanske serije,
ponovitve in obremenitve, popraviti napačen vnos ter trening zaključiti. Imena gumbov
in poti se določijo šele iz vidnega vmesnika. Uporabiti ločene testne podatke.

**Preverjeno doslej:** shranjen trener »TEST Trener« z naslovom
`trener@example.invalid`; prek menija in imenika dodana »TEST Ana Novak« z naslovom
`ana@example.invalid`, ciljem in opombo. Brez označene privolitve profil jasno pove
»Brez privolitve (samo lokalno)«. »Načrtuj program« ohrani izbrano stranko.
Termin »Uvodna vadba«, kraj »Telovadnica Center«, 10:00–10:45; iz kataloga dodan
»Dumbbell Goblet Squat« 3 × 10 × 8 kg, »Single-Arm Dumbbell Row« 3 × 10 × 6 kg
in »Plank« 3 × 30s. Pri vsaki vaji so shranjene opombe s simuliranimi dejanskimi
serijami; pri počepu tudi »Pretežko«. Po ponovnem odprtju je program še nenačrtovan.
Naslednji korak je ustvariti termin prek »Ustvari trening« in preveriti izvedbo v njem.

**Opažanje za nadaljnji preizkus:** ime »TEST Ana — prvi trening« in kraj
»TEST Telovadnica« sta zavrnjena zaradi besede »TEST« v imenu stranke. Po popravku
na zgornji nevtralni imeni shranjevanje uspe. Preveriti še običajno ime kraja, ki se
naključno ujema z imenom stranke; umetni testni prefiks sam ne dokazuje te napake.

**Verdikt 2026-09-26 (Claude): opažanje zavrnjeno — to ni napaka, ampak §66, ki deluje, kot je
bilo odločeno.** §66 (odločeno 2026-09-18) prepoveduje ime stranke v imenu ali kraju treninga,
ker se besedila po izbrisu stranke ne da več očistiti: takrat ime ni več znano (§65). Zavrnjeno
je ob shranjevanju in ne pobrisano pozneje, prav zato.
[clientNameWords.js](src/domain/clientNameWords.js) razbije ime vsake stranke na besede in
blokira vsako, dolgo `SHORTEST_BLOCKED_WORD` = 3 znake ali več. Stranka »TEST Ana Novak« torej
prepove besedo »TEST« v imenu termina in v kraju. Sporočilo napake besedo krepko citira nazaj,
da trener vidi, kateri del svojega naslova je sporen, in obroba pokaže, katero polje.

**Ostanek, ki je resničen in ni sprememba:** pravi priimek je lahko tudi ime telovadnice.
Stranka »Ana Novak« naredi besedo »Novak« neuporabno v kraju, torej trener ne more vpisati
»Telovadnica Novak«. To je cena, ki jo §66 zavestno plača, in sprememba tega je Simonova
odločitev, ne popravek. Zapisano tu, ker ga je Codexov preizkus pokazal, čeprav z umetnim
imenom.

**Scenarij sam ostaja nedokončan:** izvedba treninga, vpis serij in ponovitev, popravek
napačnega vnosa in zaključek niso bili preizkušeni.

### 80.2 [x] P2 — Pogoji uporabe prekrijejo izbiro jezika ob prvem obisku — popravljeno 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#802-x-p2--pogoji-uporabe-prekrijejo-izbiro-jezika-ob-prvem-obisku--popravljeno-2026-09-26).

### 80.3 [ ] P2 — Slovensko iskanje ne najde obstoječega počepa

**Scenarij in koraki:** trener v slovenskem vmesniku pripravi prvi načrt, izbere
»Dodaj iz kataloga« in v »Išči vaje« vpiše »počep«.

**Opaženo:** prikaz »Temu filtru ne ustreza nobena vaja.« Pri nespremenjenih filtrih
iskanje »goblet« najde »Dumbbell Goblet Squat« in omogoči dodajanje. Katalog vsebuje
48 vaj; tudi filtri mišic in opreme ostanejo »Chest«, »Legs«, »Dumbbell« in »All«.

**Težava in vpliv:** slovenski trener mora poznati angleško poimenovanje, sicer
lahko napačno sklepa, da običajne vaje ni. Blokira hitro sestavljanje prvega načrta.

**Predlog in preverjanje:** lokalizirana imena in iskalne sopomenke ob ohranjeni
identiteti vaje; »počep« mora najti ustrezne različice, angleško iskanje pa ostati
uporabno. Prevesti tudi filtre. Preverjeno na objavljeni različici `0625bd6`.

**Dopolnilo 2026-09-27 (Claude), izmerjeno v brskalniku:** polovica tega je že narejena, in prav
to pokaže, kje je šiv. V oknu »Dodaj vajo« so možnosti izbirnika »Način« slovenske (»Moč —
serije × ponovitve × breme«, ključ `modality_option_strength` v [sl.js](src/i18n/sl.js)),
sosednji trije izbirniki v istem oknu pa so angleški, ker so vrednosti vpisane naravnost v
oznake `<option>` v [exerciseFormsController.js](src/controllers/exerciseFormsController.js):
»Chest«, »Barbell«, »Horizontal Push«. Iz istega razloga se prva možnost filtra po mišicah na
zaslonu »Knjižnica vaj« glasi »Vse«, v oknu za izbiro vaje iz kataloga pa »All«. Vrednost naj
ostane ključ zapisa, napis pa naj gre skozi slovar — tako kot pri načinu.

**Verdikt 2026-09-26 (Claude): težava potrjena, prva polovica predloga zavrnjena.**
[exercises.js](src/data/exercises.js) ima 48 vaj s trdo vpisanimi angleškimi imeni in nobenih
sopomenk, zato »počep« ne more zadeti ničesar.

»Lokalizirana imena« pa nasprotujejo zapisani odločitvi §46.4: *»Not translated, deliberately:
exercise names (the movement catalog's own vocabulary, used in English on a Slovenian gym
floor)«*. Ostane torej **druga polovica predloga — iskalne sopomenke**: prikazano ime vaje
ostane angleško, iskanje »počep« pa najde `Dumbbell Goblet Squat`. Filtri (`Chest`, `Legs`,
`Dumbbell`, `All`) niso imena vaj in se prevedejo ločeno; v tabeli v
[domMappings.js](src/i18n/domMappings.js) je danes preslikan samo gumb `All`.

**Kaj to blokira:** sopomenke so vsebina, ne mehanizem. Za 48 vaj krat dva jezika je treba
zapisati slovenske in nemške iskalne izraze, ki jih trener res vtipka. Tega si agent ne sme
izmisliti s prevajanjem angleškega imena — pravila to izrecno prepovedujejo. **Čaka na Simonov
nabor izrazov**, ker je on trener in vir tega besedišča. Mehanizem in prevod filtrov sta lahko
zgrajena prej.

**Ločena, manjša napaka v isti točki:** ko iskalno besedilo ne zadene ničesar, prikaz reče
»Temu filtru ne ustreza nobena vaja.« Krivi filtre, čeprav so filtri v redu — in prav to je
trenerja pripeljalo do napačnega sklepa, da vaje ni. Prazno stanje mora povedati, da nič ne
ustreza *iskanemu besedilu*.

**Stanje 2026-09-29:** prazno stanje je popravljeno (`a53f9db`): izbirnik in knjižnica vaj povesta
»Nobena vaja ne ustreza iskanju »počep«. Imena vaj v katalogu so v angleščini.« Prevod filtrov čaka
na odločitev v §38.20, iskalne sopomenke pa na Simonov nabor izrazov.

### 80.4 [x] P3 — Po izbiri slovenščine del osnovnega vmesnika ostane angleški — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#804-x-p3--po-izbiri-slovenščine-del-osnovnega-vmesnika-ostane-angleški--popravljeno-2026-09-27).

### 80.5 [ ] P1 — Vnos datuma in ure iz profila ne ustvari pričakovanega termina

**Scenarij:** v profilu izbrati »Načrtuj program«. Obrazec »Načrtuj prihodnji program«
poziva »Nastavi termin in kraj«. Vnesti ime, lokacijo in 10:00–10:45, ohraniti privzeti
današnji datum, izbrati »Odpri v beležki«, dodati tri vaje in zaključiti urejanje.

**Opaženo:** med urejanjem glava kaže »Nenačrtovano«, nato beležka kaže 10:00–10:45.
Po zapiranju začetni seznam kaže »Ni načrtovanih treningov«, spodnja kartica pa ime,
uro in »Načrtovanje«. Po ponovnem nalaganju obvestilo pove, da program še ni dodeljen
treningu. Program in opombe ostanejo; izguba podatkov ni dokazana.

**Vpliv:** trener po vnosu termina pričakuje vpis v urnik, vendar termina tam ni.
Besedilo in polja ne pojasnijo dodatnega koraka dodelitve. Ovira dogovarjanje prvega
termina brez poznavanja aplikacije.

**Predlog:** jasno ločiti pripravo programa in rezervacijo termina. Po vnosu datuma,
ure in lokacije ponuditi shranitev v urnik ali vidno omogočiti manjkajočo dodelitev.
Preverjanje: pot iz profila se konča s kartico na izbranem dnevu ali z jasnim obvestilom,
da termin ni rezerviran. Opaženo na objavljeni različici `0625bd6`, razvoj ni pregledan.

**Dopolnitev 2026-09-30, `main` `12d0e66`, 390 × 844, sl:** še vedno tako, tudi z izbranim dnem.
V »Načrtuj prihodnji program« za SIM Vera Kos izbrati čip »pet. 2.« (polje pokaže 2026-10-02)
in 13:00, nato »Odpri v beležki«. Glava beležke: »Nenačrtovano · SIM Vera Kos« in gumb »Danes«.
Na seznamu treningov ni ničesar za 2026-10-02. Trener brez predznanja: »Izbrani datum 2. 10. je
izgubljen; čas ni moj. V seznamu terminov tega termina ni.«

### 80.6 [ ] P1 — Zgodovina zaključenih vadb kaže načrt in vse vaje kot preskočene

**Scenarij:** v programu iz profila pripraviti tri vaje, v beležki shraniti opombo o
dejanskih serijah za vsako vajo, pri počepu še »Pretežko«. Zapreti beležko, ponovno
naložiti stran in iz menija odpreti »Zgodovina«.

**Opaženo:** »Splošna zgodovina vadb« z opisom »Dnevnik vseh zaključenih vadb za vse
stranke.« vsebuje isti »Načrtovan program«. Vsaka vaja kaže »PreskočenoPRESKOČENO«,
tudi počep, ki je v beležki po povratnem signalu kazal »Completed«. Ime predloge ostane
»Poljuben / Prazen načrt« kljub trem dodanim vajam. Obvestila ohranijo štiri povratne
signale; torej ne gre za dokaz izgube vseh opomb. Prikaz je potrjen tudi ob nadaljevanju.

**Vpliv:** trener iz zgodovine ne more zanesljivo sklepati, kaj je bilo načrtovano,
izvedeno ali preskočeno. To ovira pregled napredka.

**Predlog:** ločiti načrte od izvedb, neizvedenega načrta ne označiti kot preskočeno
vadbo ter uskladiti stanja med beležko in zgodovino. Preveriti isto vajo kot samo
načrtovano, dejansko opravljeno in izrecno preskočeno. Opaženo na objavljeni različici
`0625bd6`; pot prek pravega termina še sledi, razvoj ni pregledan.

**Stanje 2026-09-27:** opisanega prikaza ni več mogoče doseči. »Splošna zgodovina vadb« je
odstranjena (§81.7), stran stranke pa osnutke načrtov izpusti (`!log.isPlanning` v
[clientsView.js](src/modules/clients/clientsView.js)). **Odprto:** pot prek pravega termina ni
bila preizkušena — ali zaključen trening z vajami, ki jih ni odkljukal, na strani stranke pokaže
vse kot preskočene.

**Odgovor 2026-09-30, `main` `12d0e66`, 390 × 844, sl:** da. Trening »Skupina torek« s tremi
vajami za SIM Vera Kos. Na prvi vaji nič, na drugi »Prelahko«, na tretji nič, nato »Zaključi
vadbo«. Stran stranke: »Dumbbell Goblet Squat PRESKOČENO«, »Dumbbell Bench Press: 10, 10, 10«,
»Barbell Row PRESKOČENO«. Odprta kartica vaje ponudi le »Časomer premora«, »Prelahko«,
»Pretežko« in »Opombe«. Dotik na »S3 × R10 × 12 kg« ne naredi ničesar. Premik na naslednjo
vajo prejšnje ne označi: ta spet piše »Prihodnje«. **Vaje, ki jo je stranka naredila po načrtu,
trener torej nima s čim zapisati kot opravljene; edini zapis je signal »Prelahko«.** Trener
brez predznanja je iskal »serija opravljena« in dejansko težo; po treh poskusih je zapisal:
»V telovadnici bi nazaj na zvezek.«

### 80.7 [x] P2 — Prvi prikaz novega termina pokaže 1970-01-01 — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#807-x-p2--prvi-prikaz-novega-termina-pokaže-1970-01-01--popravljeno-2026-09-27).

### 80.8 [x] P1 — Prosta opomba brez izbrane ocene postane priporočilo za večjo težo — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#808-x-p1--prosta-opomba-brez-izbrane-ocene-postane-priporočilo-za-večjo-težo--popravljeno-2026-09-27).

### 80.9 [ ] P2 — Pripravljenega programa ni mogoče izbrati pri ustvarjanju termina

**Scenarij:** za Ano obstaja »Uvodna vadba« s tremi vajami v »Nenačrtovani programi«.
Trener prek »Ustvari trening« ustvari današnjo »Individualna vadba« in doda isto Ano.

**Opaženo:** »Program za to stranko« ponudi le »Poljuben / Prazen načrt«. Novi termin
je prazen. Obvestilo odpre stari program; njegov »Kopiraj ta načrt na …« odgovori
»V tem treningu ni še nikogar drugega.« Gumb »Danes« vrne novi prazni termin.

**Vpliv in predlog:** pripravljeno delo ni dosegljivo tam, kjer trener izbira program
za termin. Ponuditi nenačrtovane programe izbrane stranke ob rutinah oziroma jasno
dejanje »Dodeli terminu« na programu. Preizkusiti dodelitev brez ponovnega sestavljanja
vaj. Druge morebitne poti še niso izključene; to je izmerjena ovira pri prvi uporabi.
Objavljena različica `0625bd6`, razvoj ni pregledan.

### 80.10 [x] P1 — Po zaključku aktivnega treninga se testni zavihek ne odziva — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8010-x-p1--po-zaključku-aktivnega-treninga-se-testni-zavihek-ne-odziva--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.11 [ ] P2 — Števec sinhronizacije v glavi je brez besed in samo v angleščini

**Scenarij in koraki:** trener prvič odpre objavljeno aplikacijo v slovenščini, ne poveže
nobene shrambe v oblaku in pogleda glavo zaslona.

**Opaženo:** desno od imena in oznake različice stojita puščica gor z »0« in puščica dol z
»?«. Nikjer ni besede, ki bi povedala, kaj šteje. Edina razlaga je bralniku zaslona
namenjen `aria-label`, ki se glasi »0 local changes to push, cloud status unknown« — v
angleščini, čeprav stran pravi `lang="sl"`.

**Težava in vpliv:** trener vidi vprašaj v glavi in ne ve, ali kaj ni v redu z njegovimi
podatki. Pomen je samo v nevidnem besedilu, kar projektno pravilo prepoveduje, in to
besedilo je v tujem jeziku. Znak »?« brez razlage vzbuja skrb pri uporabniku, ki oblaka
sploh ni priklopil.

**Natančneje, izmerjeno v brskalniku:** gumb sam (`#backup-btn`) ima slovenski opis
»Središče za sinhronizacijo in varnostne kopije — Sinhronizacija v oblak ni povezana«, znotraj
njega pa je števec (`span.sync-badge`) z angleškim opisom »4 local changes to push, cloud
status unknown«. Slovenščina in angleščina sta torej v istem gumbu, ena v drugi. Število
narašča ob delu — po prvem shranjenem treningu je bilo 4 — in trener nikjer ne izve, kaj šteje.
Nad devet se številka umakne klicaju: v glavi piše »↑!«, kar je videti kot opozorilo na napako,
pomeni pa samo, da je sprememb veliko.

**Predlog in preverjanje:** ko oblak ni nastavljen, števca ne kazati; ko je, mu dati vidno
besedo ali ga odpreti v okno s stanjem. `aria-label` sestaviti prek `t(...)` s ključi v
`en`, `sl` in `de`. Preverjeno na objavljeni različici `0625bd6`; koda na `main` je ista —
[applicationHeader.js](src/modules/common/applicationHeader.js), funkcija, ki sestavi
`sync-badge`, vpisuje oba angleška stavka dobesedno.

**Delno popravljeno 2026-09-27, commit `22b79bf`:** opis za bralnik zaslona je v izbranem jeziku,
s pravilnimi števili. **Odprto, čaka na Simona:** ali števca brez povezanega oblaka skriti. To bi
spremenilo odločitev z dne 2026-08-18, da števca ostaneta vidna in siva.

### 80.12 [x] P2 — Zamujen trening na plošči pokaže samo številko, besede »Zamuja« ni nikoli — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8012-x-p2--zamujen-trening-na-plošči-pokaže-samo-številko-besede-zamuja-ni-nikoli--popravljeno-2026-09-27).

### 80.13 [x] P2 — Opozorilo o poškodbi stranke je samo v opisu ob dotiku miške, in v angleščini — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8013-x-p2--opozorilo-o-poškodbi-stranke-je-samo-v-opisu-ob-dotiku-miške-in-v-angleščini--popravljeno-2026-09-27).

### 80.14 [x] P3 — V slovenskem vzorčnem treningu je stolpec z navodilom vaje angleški — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8014-x-p3--v-slovenskem-vzorčnem-treningu-je-stolpec-z-navodilom-vaje-angleški--popravljeno-2026-09-27).

### 80.15 [x] P3 — Oznaka v glavi piše »PREVIEW« in »DEMO«, čeprav prevod obstaja — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8015-x-p3--oznaka-v-glavi-piše-preview-in-demo-čeprav-prevod-obstaja--popravljeno-2026-09-27).

### 80.16 [x] P2 — Po izhodu iz peskovnika ostane vzorčni trening v vrstici nad dnom zaslona — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8016-x-p2--po-izhodu-iz-peskovnika-ostane-vzorčni-trening-v-vrstici-nad-dnom-zaslona--popravljeno-2026-09-27).

### 80.17 [x] P3 — Slovenska števila: »3 strank«, »3 stranka(-e/-k) ima« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8017-x-p3--slovenska-števila-3-strank-3-stranka-e-k-ima--popravljeno-2026-09-27).

### 80.18 [x] P2 — Prvi trening: iskanje udeleženca je slepa ulica, ko strank še ni — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8018-x-p2--prvi-trening-iskanje-udeleženca-je-slepa-ulica-ko-strank-še-ni--popravljeno-2026-09-27).

### 80.19 [x] P2 — Aplikacija sprašuje z okni brskalnika, ki jih ne oblikuje in ne prevaja — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8019-x-p2--aplikacija-sprašuje-z-okni-brskalnika-ki-jih-ne-oblikuje-in-ne-prevaja--popravljeno-2026-09-27).

### 80.20 [x] P3 — Prazen imenik strank govori o neuspelem iskanju in veli »Klikni« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8020-x-p3--prazen-imenik-strank-govori-o-neuspelem-iskanju-in-veli-klikni--popravljeno-2026-09-27).

### 80.21 [x] P2 — Ista stvar se na enem zaslonu imenuje vaja, program, rutina in načrt — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8021-x-p2--ista-stvar-se-na-enem-zaslonu-imenuje-vaja-program-rutina-in-načrt--popravljeno-2026-09-27).

### 80.22 [x] P3 — Gumb »Done« v oknu za vabila ostane angleški — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8022-x-p3--gumb-done-v-oknu-za-vabila-ostane-angleški--popravljeno-2026-09-27).

### 80.23 [x] P2 — Prazna podloga veli pritisniti ikono (✎), ki je na zaslonu ni — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8023-x-p2--prazna-podloga-veli-pritisniti-ikono--ki-je-na-zaslonu-ni--popravljeno-2026-09-27).

### 80.24 [x] P3 — Vabilo stranki govori o stranki kot o moškem, njena lastna stran pa kot o ženski — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8024-x-p3--vabilo-stranki-govori-o-stranki-kot-o-moškem-njena-lastna-stran-pa-kot-o-ženski--popravljeno-2026-09-27).

### 80.24.1 [x] P3 — Pet slovenskih besedil še piše končnico v oklepaju, »(-a)« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80241-x-p3--pet-slovenskih-besedil-še-piše-končnico-v-oklepaju--a--popravljeno-2026-09-27).

### 80.25 [ ] P3 — Na zaslonu za nov trening je 46 od 52 kontrol nižjih od 44 pik

**Scenarij in koraki:** trener na telefonu (390×844) odpre »Ustvari trening« in z eno roko
nastavlja datum in uro.

**Izmerjeno v brskalniku:** od 52 stvari, ki jih je na tem zaslonu mogoče pritisniti, jih je 46
nižjih od 44 pik, kar je najmanjša velikost, ki jo priporoča Apple (Android priporoča 48).
Puščici za dan in za pet minut sta visoki 26 pik in stojita druga nad drugo; oznake ur in
datumov (»danes«, »jutri«, »10:30«) so visoke 36 pik; potezni ročaj »Nazaj na začetek« je visok
5 pik; oznaka različice 21 pik.

**Težava in vpliv:** urnik se ureja s palcem, pogosto med hojo po telovadnici. Dve tarči po 26
pik, ena nad drugo, sta ravno tisti par, pri katerem palec zgreši in trener premakne datum v
napačno smer.

**Vzrok, potrjen v kodi na `main`:** velikosti so zapisane namerno v
[steppedField.css](src/modules/common/steppedField.css) — `min-height: 26px` za puščici in
`min-height: 36px` za oznake. To ni napaka v izrisu, ampak izbrana vrednost.

**Predlog in odločitev:** puščici dvigniti na 44 pik (stolpec 44 × 92 namesto 44 × 56) in
oznake na 44; če je prostor pretesen, raje pokazati manj oznak kot nižje. Ker gre za zavestno
izbrano vrednost, je sprememba Simonova odločitev, ne popravek. Preizkus naj na treh širinah
zahteva, da nobena kontrola na tem zaslonu ni nižja od 44 pik. Izmerjeno na objavljeni
različici `0625bd6`; pravila na `main` so ista.

**Dopolnitev 2026-09-29, izmerjeno na `main` z ukazom `measure`:** isto vprašanje drugje — čipi filtrov
v »Knjižnica vaj« 31 pik, čipi izbirnika vaj 26 pik, vrstice vaj v izbirniku 37 pik, »Prelahko« /
»Pretežko« / »Opombe« na kartici 40 pik, jezikovni gumbi na strani za stranko 40 pik. Popravljeno
med tem, ker ni šlo za izbrano vrednost: ✕ v oknih (§80.68), iskalno polje izbirnika, izbire v
obrazcu za opombe, polje za kontakt v »Povabi stranko«; okrogli gumbi in časomeri na podlogi imajo
tarčo 44 pik ob nespremenjeni velikosti (`b2aa98f`). Isti prijem (nevidna tarča okoli narisanega
gumba) bi rešil tudi puščici polj za datum in uro, brez spremembe videza.

### 80.26 [x] P2 — Trenerjev lastni signal se v pregledu pokaže kot »Too Easy - Increase Load« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8026-x-p2--trenerjev-lastni-signal-se-v-pregledu-pokaže-kot-too-easy---increase-load--popravljeno-2026-09-27).

### 80.27 [x] P2 — Svinčnik pri čakajočem signalu ne naredi nič, če vaja ni iz programa — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8027-x-p2--svinčnik-pri-čakajočem-signalu-ne-naredi-nič-če-vaja-ni-iz-programa--popravljeno-2026-09-27).

### 80.28 [x] P2 — Predlagana ciljna teža je 2,5 kg za vajo, ki jo je stranka delala s 40 kg — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8028-x-p2--predlagana-ciljna-teža-je-25-kg-za-vajo-ki-jo-je-stranka-delala-s-40-kg--popravljeno-2026-09-27).

### 80.29 [x] P3 — Predal obvestil še naprej trdi, da signal čaka, dokler strani ne osvežiš — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8029-x-p3--predal-obvestil-še-naprej-trdi-da-signal-čaka-dokler-strani-ne-osvežiš--popravljeno-2026-09-27).

### 80.30 [x] P2 — Nepovratni izbris stranke se potrdi z angleškim navodilom in angleško besedo — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8030-x-p2--nepovratni-izbris-stranke-se-potrdi-z-angleškim-navodilom-in-angleško-besedo--popravljeno-2026-09-27).

### 80.31 [x] P2 — Po izbrisu stranke profil še vedno kaže ime, telefon in cilje — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8031-x-p2--po-izbrisu-stranke-profil-še-vedno-kaže-ime-telefon-in-cilje--popravljeno-2026-09-27).

### 80.32 [x] P3 — Skupinski trening, začet iz rutine, nima svojega naslova; osvežitev ga izbriše — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8032-x-p3--skupinski-trening-začet-iz-rutine-nima-svojega-naslova-osvežitev-ga-izbriše--popravljeno-2026-09-27).

### 80.33 [x] P3 — Dva prevajalna ključa ne obstajata, zato se uporabniku pokaže ključ sam — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8033-x-p3--dva-prevajalna-ključa-ne-obstajata-zato-se-uporabniku-pokaže-ključ-sam--popravljeno-2026-09-27).

### 80.34 [x] P3 — »Glasovna opomba (zasebnost-prva)« je izmišljen izraz — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8034-x-p3--glasovna-opomba-zasebnost-prva-je-izmišljen-izraz--popravljeno-2026-09-27).

### 80.35 [x] P1 — Glasovna opomba si izmisli stavek o stranki in ga zapiše v njeno kartoteko — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8035-x-p1--glasovna-opomba-si-izmisli-stavek-o-stranki-in-ga-zapiše-v-njeno-kartoteko--popravljeno-2026-09-27).

### 80.36 [x] P2 — »Anonimna kopija za AI« s seboj odnese cilje in zdravstvene opombe — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8036-x-p2--anonimna-kopija-za-ai-s-seboj-odnese-cilje-in-zdravstvene-opombe--popravljeno-2026-09-27).

### 80.37 [x] P2 — Pred nepovratno zamenjavo podatkov piše, kaj bo izgubljeno, v angleščini — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8037-x-p2--pred-nepovratno-zamenjavo-podatkov-piše-kaj-bo-izgubljeno-v-angleščini--popravljeno-2026-09-27).

### 80.38 [x] P2 — Uvoz pravi »združilo ali prepisalo«, v resnici vedno zamenja — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8038-x-p2--uvoz-pravi-združilo-ali-prepisalo-v-resnici-vedno-zamenja--popravljeno-2026-09-27).

### 80.39 [ ] P3 — Obrazca za povratno informacijo in za napako mešata slovenščino in angleščino

**Scenarij in koraki:** trener v meniju ☰ izbere »Pošlji povratno informacijo« in nato »Napiši
e-pošto«, oziroma »Prijavi napako na GitHubu«.

**Opaženo:** obe pripravljeni besedili sta mešani. E-pošta se začne slovensko (»Kar sem hotel
povedati:«), podatki pod črto pa so angleški (»Build«, »Page«, »Language«, »Screen«). Prijava
napake ima slovenski začetek naslova (»Napaka: «) in slovensko vprašanje v skritem komentarju,
naslovi razdelkov pa so angleški: »**What happened**«, »**A screenshot**«, »**Details LibrePT
filled in**«, prav tako opozorilo, naj trener na sliki zakrije podatke strank.

**Težava in vpliv:** trener, ki angleško ne bere, v obrazcu ne ve, kam kaj spada — in prav to
opozorilo o zakrivanju podatkov strank je tisto, ki ga mora razumeti.

**Odločitev, ki jo to terja:** ali sta ti dve besedili namenjeni Simonu in mednarodnim
sodelavcem (potem naj bosta v celoti angleški, tudi vprašanje in opozorilo) ali trenerju (potem
naj bosta v njegovem jeziku, z angleškim povzetkom le v podatkih o gradnji). Mešanica ne služi
nobenemu.

**Preverjanje:** ko bo odločeno, naj preizkus zahteva, da je pripravljeno besedilo v enem jeziku.
Opaženo na objavljeni različici `0625bd6`.

### 80.40 [x] P1 — Dva odprta zavihka: tisti, ki shrani pozneje, izbriše delo drugega — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8040-x-p1--dva-odprta-zavihka-tisti-ki-shrani-pozneje-izbriše-delo-drugega--popravljeno-2026-09-27).

### 80.41 [ ] P2 — Trije izhodi iz obrazca za stranko, dva izida: »Prekliči« zavrže, ✕ in Esc obdržita

**Scenarij in koraki:** trener v imeniku pritisne »Dodaj stranko«, vpiše ime in si premisli.
Iz obrazca vodijo trije izhodi: gumb »Prekliči«, križec ✕ zgoraj desno in tipka Esc.

**Opaženo, vsako posebej preizkušeno:**
- »Prekliči« — stranke ni v imeniku. Zapis je zavržen.
- ✕ — stranka **ostane** v imeniku (»X gumb preizkus«).
- Esc — stranka **ostane** v imeniku (»Esc preizkus«).

Obrazec, ki se odpre in zapre brez vpisa, ne pusti ničesar; to je v redu.

**Težava in vpliv:** isti premislek da dva različna izida, odvisno od tega, kje trener
pritisne. V imeniku se nabirajo na pol vpisane stranke, ki jih ni želel — in to je imenik, ki
ga potem preiskuje med treningom.

**Kako je nastalo:** zapis stranke se piše ob vsaki tipki (»stranka obstaja od prve črke«,
[clientFormsController.js](src/controllers/clientFormsController.js)), zato je za zavrženje
potreben izrecen umik. Nanj je pripet samo gumb »Prekliči«.

**Enako velja za vaje in rutine:** »Esc vaja« in »Esc rutina« sta po tipki Esc ostali v
knjižnici oziroma na seznamu rutin, »Preklic rutina« pa je po gumbu »Prekliči« izginila. Torej
gre za vse tri obrazce, ki pišejo sproti, ne le za stranke.

**Predlog in preverjanje:** ✕ in Esc naj naredita isto kot »Prekliči«, ali pa naj obrazec
vpraša, kaj naj stori z vpisanim. Tiho ohranjanje je najslabša od treh možnosti, ker trener ne
izve, da je stranka nastala. Preizkus naj vse tri izhode preveri z vpisanim imenom in zahteva
isti izid. Opaženo na objavljeni različici `0625bd6`; koda na `main` je ista.

**Čaka na Simona — predlog nasprotuje njegovi odločitvi.** 2026-09-17 je odločil, da »Prekliči«
razveljavi, vsak drug izhod — Shrani, ✕, Esc, Nazaj, menjava pogleda — pa zapis dokonča (zapisano v
[liveRecordForm.js](src/modules/common/liveRecordForm.js)). Ta razdelek predlaga, naj ✕ in Esc
razveljavita. Odločitev: ali ✕ in Esc preideta k »Prekliči«, ali obrazec ob njiju vpraša, ali ostane,
kot je, in se samo pokaže, da je stranka nastala.

**Nov scenarij na objavljeni `8b2ce80`:** Nastavitve → Moji podatki, trener TEST
Tine Novak, shranjeni telefon »+386 00 000 000«. Telefon spremeniti v »+386 00 000 111«,
zapreti z Esc in ponovno odpreti Moje podatke. V polju je spet prvotna številka.
Ponovitev s »+386 00 000 222« in križcem »Zapri« da isti izid. »Prekliči« prav tako
vrne shranjeno številko. Brez opozorila in brez prestreženih napak, sl, 390 × 844.
Trener izgubi popravek ob prekinitvi, če računa na zgoraj zapisano vedenje drugih
obrazcev. Predlog: tudi trenerjeve podatke vključiti v preverjanje enotnega pomena
izhodov; po veljavnem pravilu naj samo »Prekliči« razveljavi. Kode nismo pregledovali.

### 80.42 [x] P2 — Izvoz podatkov, ki ga prebere stranka, je v celoti angleški — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8042-x-p2--izvoz-podatkov-ki-ga-prebere-stranka-je-v-celoti-angleški--popravljeno-2026-09-27).

### 80.43 [x] P2 — Če trener ni vpisal svojih podatkov, v dokumentu piše »[trainer name]« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8043-x-p2--če-trener-ni-vpisal-svojih-podatkov-v-dokumentu-piše-trainer-name--popravljeno-2026-09-27).

### 80.44 [x] P2 — Uvoz programa odgovori na napako v angleščini, z malo začetnico — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8044-x-p2--uvoz-programa-odgovori-na-napako-v-angleščini-z-malo-začetnico--popravljeno-2026-09-27).

### 80.45 [x] P3 — »Nikogar posebej« pri uvozu programa vseeno izbere prvo stranko — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8045-x-p3--nikogar-posebej-pri-uvozu-programa-vseeno-izbere-prvo-stranko--popravljeno-2026-09-27).

### 80.46 [x] P2 — Na podlogi skupinskega treninga sta dve stranki z istim imenom oba »Ana« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8046-x-p2--na-podlogi-skupinskega-treninga-sta-dve-stranki-z-istim-imenom-oba-ana--popravljeno-2026-09-27).

### 80.47 [x] P3 — »Vsi na ta načrt« preklaplja v obe smeri, napis pa se ne spremeni — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8047-x-p3--vsi-na-ta-načrt-preklaplja-v-obe-smeri-napis-pa-se-ne-spremeni--popravljeno-2026-09-27).

### 80.48 [x] P3 — Trening, ki se konča pred svojim začetkom, se shrani brez besede — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8048-x-p3--trening-ki-se-konča-pred-svojim-začetkom-se-shrani-brez-besede--popravljeno-2026-09-27).

### 80.49 [x] P3 — Pri brisanju enega večera ponavljajočega se treninga ni povedano, da gre za en večer — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8049-x-p3--pri-brisanju-enega-večera-ponavljajočega-se-treninga-ni-povedano-da-gre-za-en-večer--popravljeno-2026-09-27).

### 80.50 [x] P2 — Stran, na kateri stranka odgovori na vabilo, kaže »12:00 PM« in »Thursday, October 8« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8050-x-p2--stran-na-kateri-stranka-odgovori-na-vabilo-kaže-1200-pm-in-thursday-october-8--popravljeno-2026-09-27).

### 80.51 [x] P1 — Stranka izbere odgovor na vabilo, poslati pa ga nima s čim — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8051-x-p1--stranka-izbere-odgovor-na-vabilo-poslati-pa-ga-nima-s-čim--popravljeno-2026-09-27).

### 80.52 [ ] P1 — Spremembe načrta nezačetega treninga izginejo, ko trening odpreš znova s kartice

**Scenarij in koraki:** trener zvečer odpre jutrišnji trening s kartice na plošči, v meniju ⋮ izbere
»Uredi načrt«, doda ali preimenuje vajo in pritisne »Končano«. Z ročico v naslovni vrstici se vrne na
ploščo in isti trening spet odpre s kartice.

**Opaženo:** načrt je spet takšen, kot ga da rutina; sprememba je izginila brez besede, tudi po
osvežitvi strani. Našel podagent v dnevu trenerja 01 (§88); ponovljeno na `main` z začasnim preizkusom
v brskalniku: prva vaja »Probe Movement« je bila po ponovnem odprtju spet »Face Pulls«.

**Vzrok, potrjen v kodi na `main`:** tap na kartico ([sessionCard.js](src/modules/sessionList/sessionCard.js))
vedno pokliče `launchClipboardDirectly` ([sessionsView.js](src/modules/sessionList/sessionsView.js)),
ta pa `startWorkoutSession`, ki podlogo zgradi na novo iz rutine — tudi ko je isti trening že odprt
in spremenjen.

**Težava in vpliv:** načrt, ki ga trener pripravi zvečer, zjutraj ni več tam, in nič ne pove, da se je
kaj izgubilo. Izguba dela brez opozorila, zato P1.

**Predlog in preverjanje:** ko je trening s kartice že odprt, naj tap odpre tistega, ne novega. Preizkus
naj spremeni načrt nezačetega treninga, zapre podlogo, trening odpre s kartice in zahteva spremembo.

**Dodaten scenarij samo na objavljeni `0625bd6`:** ustvariti rutino »SIM Osnovna moč«
z Dumbbell Bicep Curl 3×10×4 kg, po njej načrtovati »Sled predloge« za jutri 20:00–20:45.
Nato v knjižnici spremeniti rutino na 6 kg. Spodnja vrstica odpre trening s 4 kg;
zaprtje in odprtje istega treninga s kartice pokaže 6 kg. Nobeno odprtje ne pojasni
spremembe. Trener tako dobi različno obremenitev glede na pot do istega treninga.
Predlog dopolnitve: jasno ločiti trenutno predlogo od že pripravljenega načrta;
oba načina odpiranja morata vrniti isti načrt. Brez zabeleženih napak brskalnika;
kode v tem nadaljevanju nismo pregledovali.

**Dopolnitev: sklop v jutrišnjem »Opombe v paru«, objavljena `0625bd6`.** Pri
jutranjem Luki odpreti »Uredi načrt«, dodati »Sklop«, naslov »SIM Ravnotežje in moč«,
dva kroga in vajo Wall Sit z vrednostjo 20. Pritisniti »Končano z urejanjem načrta«.
Beležka pokaže naslov sklopa, »KROG 1 / 2«, Wall Sit in »Zaključi krog 1 / 2«.
Že osvežitev te strani vrne samo prvotna Dumbbell Bicep Curl in Počitek 60s. Tudi
ponovno odprtje iste kartice in urejevalnika pokaže samo prvotno vajo, brez sklopa.
Termin je jutrišnji, zato to razširja preizkus tudi na obnovitev prihodnjega načrta
po osvežitvi. Trener izgubi pripravljeni sklop brez opozorila. Predlog: preveriti
obstoj celotnega sklopa in števila krogov po osvežitvi ter po vseh poteh ponovnega
odpiranja. Sl, 390 × 844; brez novih prestreženih napak. Kode nismo pregledovali.

**Dokaz 2026-09-30, `main` `12d0e66`, prazna aplikacija: zaključek izbriše ročno sestavljen načrt.**
Trening »Moč« za jutri, brez rutine, stranka Maja Kranjc. V »Uredi načrt« tri vaje iz kataloga s
12, 30 in 25 kg. »Začni trening« → »Ohrani urnik«. Po osvežitvi med tekom podloga še kaže vse tri.
Brez zapisane vaje (§80.6: ni je s čim zapisati) »Zaključi vadbo« → »Zaključi zdaj« → »Zaključi
zdaj« v oknu »Ni zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?«.
Nato: podloga »Vaj še ni.«, stran stranke »Ni še zabeleženih vadb.«, zato ni niti »Shrani kot
rutino«. V IndexedDB (`schema4`, `schema5`, `schemaPREVIEW`) ni nobene od treh vaj; trening in stranka
sta. Trener, ki prvič sestavi načrt in ga s stranko opravi po načrtu, nima po zaključku ničesar:
ne načrta, ne zgodovine, ne rutine za naslednji teden.

**Stanje 2026-09-29 — predlagani popravek ne zadošča, čaka na odločitev o zasnovi.** Preizkušeno na
`main`: tap na kartico, ki bi vrnil na že odprto podlogo namesto nove gradnje, ohrani spremembe
načrta, pokvari pa demo zgodbo (korak »Pritisni Johnovo ime«). Vzrok: odprta podloga ima udeležence
iz trenutka, ko je bila zgrajena. Udeleženec, dodan treningu pozneje, v njej manjka, nova gradnja iz
rutine pa ga vključi. Vrnitev bi torej zamenjala izgubo načrta za izgubo udeleženca. Načrt treninga,
ki se še ni začel, živi samo v eni podlogi (`librept_active_session`), zato ga izgubi tudi odprtje
katerega koli drugega treninga. Popravek, ki drži, shrani načrt vsakega udeleženca pri treningu
samem. To je sprememba sheme podatkov in odločitev za Simona: ali načrt prihodnjega treninga postane
del zapisa treninga. Do takrat §80.52 ostane odprta.

### 80.53 [x] P2 — Načrt treninga, vpisanega za nazaj, po osvežitvi izgine — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8053-x-p2--načrt-treninga-vpisanega-za-nazaj-po-osvežitvi-izgine--popravljeno-2026-09-29).

### 80.54 [ ] P3 — Filtri kataloga vaj so v slovenščini angleški: »Chest«, »Barbell«, »Bodyweight«

**Scenarij in koraki:** `?lang=sl` → trening → »Uredi načrt« → »Dodaj iz kataloga«.

**Opaženo:** vrstici filtrov imata slovenski oznaki, gumbi v njih pa so angleški: »All, Chest, Back,
Legs, Shoulders, Arms, Core, Recovery, Cardio« in »Barbell, Dumbbell, Cable, Machine, Band,
Bodyweight«. Našel podagent v dnevu trenerja 03 (§88).

**Vzrok, potrjen v kodi na `main`:** [exercisePicker.js](src/modules/exercises/exercisePicker.js) da
vrstici izvora prevedene besede (`sources.words`), vrsticama mišic in opreme pa ne, zato gumb izpiše
vrednost `MUSCLE_GROUPS` oziroma `EQUIPMENT` dobesedno. Enako angleške so možnosti skupine v obrazcu za
vajo ([exerciseFormsController.js](src/controllers/exerciseFormsController.js), `<option value="Chest">Chest</option>`).

**Težava in vpliv:** besedilo vmesnika, ne ime vaje (imena so namerno angleška). Trener v slovenščini
filtrira po tujih besedah. P3.

**Predlog in preverjanje:** obe vrstici dobita besede iz slovarja, kot jih ima vrstica izvora; vrednost
filtra ostane angleška. Preizkus naj v slovenščini zahteva, da noben gumb filtra ni angleški.

**Stanje 2026-09-29 — čaka na Simona.** Isto vprašanje je v §38.20 odprto kot odločitev zanj
(»Decision, not work — Simon«): ali mišične skupine, oprema in vzorci gibanja dobijo besedo v
vsakem jeziku, tako v obrazcu za vajo kot na čipih izbirnika. Popravek je pripravljen v glavi,
ne v drevesu: ključi `muscle_*` in `equipment_*` v treh slovarjih, vrednost filtra ostane angleška.

**Še dve angleški besedili na istih zaslonih, opaženi na objavljeni `8b2ce80` (2026-09-30):** kartica
rutine na zaslonu »Rutine« skrajša seznam vaj z »+2 more«, opisi vzorčnih rutin pa so angleški
(»Strength-focused upper body session prioritizing compound presses and rows.«). Prvo je besedilo
vmesnika in sodi v isti popravek; drugo je vzorčni podatek.

### 80.55 [x] P3 — Kartica treninga pravi samo »Nedoločen«, trener pa to bere kot stanje — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8055-x-p3--kartica-treninga-pravi-samo-nedoločen-trener-pa-to-bere-kot-stanje--popravljeno-2026-09-29).

### 80.52 [x] P2 — Gumb »Shrani« je ob odprtju obrazca pod robom zaslona — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8052-x-p2--gumb-shrani-je-ob-odprtju-obrazca-pod-robom-zaslona--popravljeno-2026-09-29).

### 80.56 [x] P2 — Iskanje strank ne najde vidnega vzdevka — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8056-x-p2--iskanje-strank-ne-najde-vidnega-vzdevka--popravljeno-2026-09-29).

### 80.57 [x] P1 — Decimalna vejica spremeni 2,5 kg v 25 kg brez opozorila — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8057-x-p1--decimalna-vejica-spremeni-25-kg-v-25-kg-brez-opozorila--popravljeno-2026-09-29).

### 80.58 [x] P2 — Prvi termin tedenske serije ima dve enaki kartici — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8058-x-p2--prvi-termin-tedenske-serije-ima-dve-enaki-kartici--popravljeno-2026-09-29).

### 80.59 [x] P2 — Neveljavni datum se brez pojasnila zamenja z drugim dnevom — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8059-x-p2--neveljavni-datum-se-brez-pojasnila-zamenja-z-drugim-dnevom--popravljeno-2026-09-29).

### 80.60 [x] P1 — Kartica »Sled predloge« odpre drug trening z drugima terminom in udeležbo — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8060-x-p1--kartica-sled-predloge-odpre-drug-trening-z-drugima-terminom-in-udeležbo--popravljeno-2026-09-29).

### 80.61 [x] P2 — Konec ponavljanja pred začetkom se shrani brez opozorila — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8061-x-p2--konec-ponavljanja-pred-začetkom-se-shrani-brez-opozorila--popravljeno-2026-09-29).

### 80.62 [ ] P2 — Izvoz kataloga izpusti shranjena navodila lastne vaje

**Scenarij in koraki:** trener v knjižnici ustvari lastno vajo `SIM Počep, "počasi"`,
Legs / Bodyweight / Squat, z dvema vrsticama navodil: »Spust 3 sekunde, nato premor.«
in »Izdih: »počasi«; ščž.«. V središču kopij prenese »Izvozi katalog CSV« in
»Izvozi katalog JSON«. Za primerjavo prenese še polno kopijo prek »Izvozi JSON«.

**Opaženo:** CSV pravilno ohrani šumnike, vejico in narekovaje v imenu; vrstica ni
razbita. Toda nima stolpca za navodila. Tudi zapis v kataloškem JSON nima navodil.
Polna varnostna kopija iste vaje jih vsebuje natančno, vključno s prelomom vrstice.
Pojasnilo kataloškega izvoza govori o preslikavi kategorij in opreme; izpusta navodil
ne navede. Primerjava je opravljena na datotekah, prenesenih skozi uporabniški vmesnik.

**Težava in vpliv:** trener pri prenosu lastnega kataloga izgubi namige za izvedbo,
čeprav jih je v aplikaciji vpisal in shranil. Polno kopijo ima, vendar namenski izvoz
za izmenjavo z drugimi orodji ne prenese tega dela njegovega dela.

**Predlog:** navodila vključiti v oba kataloška izvoza ali pred prenosom jasno navesti
omejitev. Preveriti večvrstično besedilo s šumniki, vejicami in narekovaji. Opaženo
na objavljeni `0625bd6`, sl, Chrome CDP, 390 × 844; brez branja kode. Med scenarijem
ni novih prestreženih napak brskalnika.

**Stanje 2026-09-29 — čaka na Simona.** Izpust je nameren: `toInterchangeExercise` v
[exerciseStandard.js](src/domain/exerciseStandard.js) navodila izpusti z utemeljitvijo, da jih
katalog opušča (»a certified PT does not need how-to text«, [exercises.js](src/data/exercises.js)).
Ta utemeljitev velja za vgrajeni katalog, ne za navodila, ki jih trener sam vpiše k svoji vaji in
jih aplikacija pokaže med vadbo. Odločitev: ali kataloški izvoz nosi navodila trenerjevih lastnih
vaj (in jih uvoz prebere), ali pojasnilo izvoza pove, da jih ne nosi.

### 80.63 [x] P2 — Časovna vaja v sklopu izgubi oznako trajanja — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8063-x-p2--časovna-vaja-v-sklopu-izgubi-oznako-trajanja--popravljeno-2026-09-29).

### 80.64 [x] P3 — Prazna plošča po filtrih reče »Počisti jih«, ne pove pa, kje — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8064-x-p3--prazna-plošča-po-filtrih-reče-počisti-jih-ne-pove-pa-kje--popravljeno-2026-09-29).

### 80.65 [x] P3 — Vzorčna obvestila v peskovniku omenjajo stranke in trening, ki jih ni — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8065-x-p3--vzorčna-obvestila-v-peskovniku-omenjajo-stranke-in-trening-ki-jih-ni--popravljeno-2026-09-29).

### 80.66 [x] P2 — Vrstica nad dnom pri prihodnjem treningu kaže stoječo številko za napačen dan — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8066-x-p2--vrstica-nad-dnom-pri-prihodnjem-treningu-kaže-stoječo-številko-za-napačen-dan--popravljeno-2026-09-29).

### 80.67 [x] P3 — Čip »Datumi« zapiše izbrano obdobje kot »5. okt. – 11. okt.«, ne v ISO — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8067-x-p3--čip-datumi-zapiše-izbrano-obdobje-kot-5-okt--11-okt-ne-v-iso--popravljeno-2026-09-29).

### 80.68 [x] P2 — Križec ✕, ki zapre okno, meri 12 × 16 pik — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8068-x-p2--križec--ki-zapre-okno-meri-12--16-pik--popravljeno-2026-09-29).

### 80.69 [ ] P1 — Ocena obrazca »Dodaj stranko«: poškodba, ki jo vpiše trener, ne sproži opozorila

Način 3 veščine. Naloga (zapisal jo je podagent, preden je obrazec videl): nova stranka, ki je danes
prvič prišla na trening. Pot: ☰ → »Imenik strank« → »Dodaj stranko«. Lokalni strežnik, `main` na
`e55bbd2`, sl, 390 × 844. Ocena: `.private/exploratory-test/forms/2026-09-29-01-evaluation.md`.

**Manjka.**
- **P1 — polje za poškodbo.** Vpisal sem »operacija kolena 2023, desno« v »Predhodne poškodbe in
  opombe«. Stranka je shranjena brez `hasInjury`, zato podloga med treningom ne pokaže opozorila,
  kartica treninga ne pokaže znaka in ime nima oznake. Zastavico nastavita le vzorčni podatki in
  obrazec, ki ga izpolni stranka sama; trenerjev obrazec je nima. Naloga pravi: »a missed knee note
  is the actual danger here«. Predlog: ločeno polje »Poškodbe in omejitve«, kot ga ima obrazec
  stranke, zastavica izpeljana iz njega; »Opombe« ostanejo zase, kar reši tudi §88.7.
- Zapis prvega, že opravljenega treninga (§88.4) in teža ob prvem obisku (§78, §86.4) — že zapisano.

**Odveč — čaka na Simona.** »Vzdevek« je vedno viden, čeprav ga oznaka omeji na dve stranki z
enakim imenom. Razdelek GDPR (»Jezik obrazca«, »Kdo hrani obrazec?«) na dan prvega obiska, ko ga
naloga ne želi (§27).

**Ne deluje.** ✕ meri 12 × 16 (§80.68). **P3:** po shranitvi prve stranke obvestilo še naprej
pravi »Tukaj še ni ničesar shranjenega«, do naslednjega nalaganja strani.

**Stanje 2026-09-29:** P1 je popravljen (`d273a74`): obrazec ima polje »Poškodbe in omejitve«, iz
njega se izpelje zastavica za opozorilo, »Opombe« so ločene. P3 o obvestilu je popravljen
(`7a1670d`), ✕ v §80.68. Odprto ostanejo točke, ki čakajo na Simona: »Vzdevek«, razdelek GDPR ob
prvem obisku in vrstni red e-pošta–telefon.

**Vrstni red — čaka na Simona.** E-pošta je pred telefonom; naloga ima telefon vedno, e-pošto
pozneje.

**V redu:** »Shrani« je ob odprtju na zaslonu; napačen telefon in e-pošta sta povedana pri polju
(obrazec trenerjevih podatkov); stranka se najde z iskanjem; opomba je v profilu vidna.

### 80.70 [ ] P2 — Ocena obrazca »Nov trening«: brez imena je trening »Nastavitev treninga«, gumbi pod robom

Način 3. Naloga (podagent): naslednji torek ob 18:00 za dve stalni stranki, Fitpark dvorana 2. Pot:
plošča → »Ustvari trening«. `main` na `e55bbd2`, sl, 390 × 844. Ocena:
`.private/exploratory-test/forms/2026-09-29-02-evaluation.md`.

**Ne deluje — popravljeno 2026-09-29.** Trening brez imena je dobil ime »Nastavitev treninga« (naslov
obrazca) na kartici, v vabilu in v seriji — `a8939c6`, zdaj »Trening«. »Shrani« in »Odpri v beležki«
sta bila ob odprtju 116 in 170 pik pod robom — `9dfa340`. Trening s »Prazen načrt, brez rutine« se je
odprl s prvo rutino v knjižnici — `0caf9b5`. Okno o začetku izven urnika je govorilo »začeto 10651 min
prezgodaj« — `c3da9c7`.

**Manjka — čaka na Simona.** Lokacija na kartici treninga; prihodnji treningi na strani stranke; cena
in plačilo (§86).

**Vrstni red — čaka na Simona.** Stranke so zadnje, naloga jih ima prve; »Ime treninga« je prvo, naloga
ga ne omenja.

### 80.71 [ ] P2 — Ocena obrazca »Dodaj vajo«: izbire, ki jih trener ni naredil, se shranijo

Način 3. Naloga (podagent): ozek potisk s prsi z drogom. Pot: ☰ → »Vaje in rutine« → »Dodaj vajo«.
`main` na `e55bbd2`, sl, 390 × 844.

**Tip — čaka na Simona.** Štirje obvezni izbirni seznami se odprejo z vrednostjo (Chest, Barbell,
Horizontal Push, Moč). Vaja, pri kateri trener vpiše le ime, se shrani s temi, ne da bi jih izbral;
od njih so odvisni filtri, izbirnik in enota bremena. Posledica pravila 2026-09-17 (obrazec nikoli ne
zavrne), zato ni popravljeno: odločitev je, ali se izbirni seznami odprejo prazni.

**Manjka — čaka na Simona.** »Kettlebell« med opremo; »Triceps« (samo »Arms«); sopomenke za iskanje
(§80.3); privzete serije in ponovitve.

**Ne deluje.** ✕ 12 × 16 — popravljeno v §80.68.

**Dokaz 2026-09-30, prvo odprtje, `main` `12d0e66`:** oba trenerja brez predznanja sta vpisala le ime
(»Bolgarski počep«, »Dvig na prste«) in dobila vajo »Chest«, »Barbell«, »Horizontal Push«. Prvi: »Brez
opozorila, da sem pustil privzeto.« Drugi: »Vzorca giba ne razumem«; trije od štirih seznamov so
angleški.

### 80.72 [x] P2 — Ocena obrazca »Ustvari rutino« — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8072-x-p2--ocena-obrazca-ustvari-rutino--popravljeno-2026-09-29).

### 80.73 [x] P1 — »Sinhroniziraj podatke« je zamenjal trenerjeve treninge z vzorčnimi — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8073-x-p1--sinhroniziraj-podatke-je-zamenjal-trenerjeve-treninge-z-vzorčnimi--popravljeno-2026-09-29).

### 80.74 [x] P2 — Vaja, ki je v rutini dvakrat, si deli zapis serij — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8074-x-p2--vaja-ki-je-v-rutini-dvakrat-si-deli-zapis-serij--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.75 [x] P3 — Vzorčni peskovnik obljublja trening, ki že poteka, a ga ni — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8075-x-p3--vzorčni-peskovnik-obljublja-trening-ki-že-poteka-a-ga-ni--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.76 [x] P1 — Tap na kartico treninga, ki že teče, ga zamenja z novim, nezačetim — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8076-x-p1--tap-na-kartico-treninga-ki-že-teče-ga-zamenja-z-novim-nezačetim--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.77 [x] P2 — Po polnoči obrazec »Nastavitev treninga« privzame včerajšnji datum — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8077-x-p2--po-polnoči-obrazec-nastavitev-treninga-privzame-včerajšnji-datum--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.78 [ ] P2 — Ročica, ki zapre podlogo treninga, je visoka 21 pik, tik pod njo pa je drug gumb

**Scenarij in koraki:** na plošči tapni kartico treninga (»Hitri HIIT za trup«, danes 02:00 - 03:00),
da se odpre podloga. Nato poskusi podlogo zapreti z edinim gumbom za to na zaslonu — vodoravno
ročico na vrhu, z oznako »Zapri trening in se vrni na začetek«.

**Opaženo:** ročica se odziva na dotik v pasu od 56. do 77. točke navpično in od 152. do 238.
vodoravno, torej 86 × 21 pik. Že eno piko nižje, od 78. točke naprej, se začne gumb »Nazaj na
današnji trening«, ki meri 98 × 44 pik. Merjeno z `elementFromPoint` po tri pike navpično in po pet
vodoravno.

**Težava in vpliv:** palec meri okoli 44 pik. Trener, ki hoče zapreti podlogo, s spodnjim delom
prsta zadene »Nazaj na današnji trening« in namesto zapiranja odpre drug trening. Ko je na podlogi
sredi vadbe, je to izguba mesta, kjer je bil. Gumb za nazaj na telefonu podlogo res zapre, a to na
zaslonu ni nikjer zapisano.

**Predlog:** dotikalna tarča ročice naj bo visoka vsaj 44 pik in med njo in gumbom »Nazaj na
današnji trening« naj bo prazen pas — opaženo na različici `8b2ce80`.

Enako meri ročica, ki odpre predal z obvestili na dnu zaslona (»Toggle notifications drawer«): 40 × 5
pik pri 787. piki navpično. Isti popravek velja za obe.

**Presoja 2026-09-30 (Claude): čaka na Simona.** Ročica je gumb `.view-grabber` z nevidno tarčo
`::before`, ki jo razširi na 23 pik. Nad njo je le 6 pik naslovne vrstice, nato glava aplikacije z
oznako na sredini; spodaj je vrstica z gumbi. Tarča 44 pik zato zahteva eno od dveh: naslovno
vrstico, višjo za okoli 20 pik na vsakem zaslonu z ročico (plošča, načrti, nastavitev treninga,
podloga), ali tarčo, ki prekrije sredino glave. Oboje je odločitev o prostoru na zaslonu, kot §80.25.

**Popravljeno 2026-09-30 za predal, ne za podlogo.** Vrstica predala je ves čas nosila `cursor:
pointer`, odzivala pa se je le ročica; zdaj predal odpre tudi dotik na prazni del te vrstice, ki je
visoka 56 do 64 pik. To je pomembno prav med tekočim treningom, ko je povzetek skrit in je bila ročica
edina tarča. Dotik šteje le, če je pristal na vrstici sami, zato vrstica tekočega treninga in gumbi v
njej obdržijo svoje dotike (`src/modules/common/notificationArea.js`, preizkušeno v
`tests/medium/test_notification_footer.py`). Pri podlogi ostane vprašanje odprto, kot je opisano
zgoraj.

### 80.79 [x] P2 — Kartica treninga brez udeležencev se na dotik ne odzove, noter vodi le svinčnik — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8079-x-p2--kartica-treninga-brez-udeležencev-se-na-dotik-ne-odzove-noter-vodi-le-svinčnik--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.80 [x] P1 — Vrstica »Zadnjič« na podlogi pokaže tudi serije, ki jih stranka ni naredila — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8080-x-p1--vrstica-zadnjič-na-podlogi-pokaže-tudi-serije-ki-jih-stranka-ni-naredila--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.81 [~] P1 — Ko trener na prost termin doda eno stranko, termin izgubi mesta in zamenja rutino

**Scenarij in koraki:** vzorčni podatki. Kartica »Prost termin (brez najave)«, danes 04:00 - 05:00,
pravi »0/3 mest zasedenih« in »Noge in trup B«. Tapni svinčnik na kartici, v polje za iskanje vpiši
»Sarah«, tapni zadetek »Sarah Jenkins«, tapni »Odpri v beležki«. Ne dotakni se ničesar drugega.

**Opaženo:** kartica zdaj pravi »1/1 mest zasedenih« in »Zgornji del A«. V zapisu treninga se je
`maxCapacity` spremenil s 3 na 1 in `routineId` z »Noge in trup B« na »Zgornji del A«. Obrazec
»Nastavitev treninga« nima nobenega polja za število mest, izbirnik rutine pri stranki pa se odpre na
prvi rutini s seznama (»Zgornji del A«), ne na tisti, ki jo termin že ima.

**Težava in vpliv:** dve stvari naenkrat. Termin, ki ga je trener odprl za tri stranke brez najave,
je po prvi stranki videti zaseden, drugih dveh ne more več vpisati, števila mest pa nikjer ne more
popraviti. In program se zamenja: trener, ki je pripravil noge in trup, po dodani stranki na podlogi
dobi zgornji del telesa.

**Predlog:** dodajanje stranke naj ne spremeni števila mest, izbirnik rutine pri stranki naj se odpre
na rutini, ki jo termin že ima, in obrazec naj imeti polje za število mest — opaženo na različici
`8b2ce80`.

**Stanje 2026-09-30:** prva dva dela sta popravljena (`cfd4e10`): urejanje termina števila mest ne
zmanjša več, stranka, dodana terminu z rutino, dobi rutino termina. **Odprto, čaka na Simona:** ali
obrazec »Nastavitev treninga« dobi polje za število mest. To je novo polje v obrazcu, o katerega
vsebini in vrstnem redu odloča Simon (§80.70).

Isto se zgodi pri skupinskem treningu, ki ni prost termin: kartica »Skupinska moč in kondicija« je
pred posegom pisala »2/7 mest zasedenih«, po odstranitvi ene stranke »1/1«, po dodani novi pa »2/2«.
Skupina sedmih mest tako postane polna pri dveh.

### 80.82 [x] P2 — Odprt in zaprt urejevalnik načrta pobriše oznako »Zaključeno« z opravljenega sklopa — popravljeno 2026-09-30 z 5ea4ada

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8082-x-p2--odprt-in-zaprt-urejevalnik-načrta-pobriše-oznako-zaključeno-z-opravljenega-sklopa--popravljeno-2026-09-30-z-5ea4ada);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.83 [x] P1 — Treninga, ki se konča po polnoči, ni mogoče niti vpisati niti urediti — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8083-x-p1--treninga-ki-se-konča-po-polnoči-ni-mogoče-niti-vpisati-niti-urediti--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.84 [x] P1 — Nedokončan nov trening se prilepi na urejanje drugega treninga in ga pri shranjevanju povozi — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8084-x-p1--nedokončan-nov-trening-se-prilepi-na-urejanje-drugega-treninga-in-ga-pri-shranjevanju-povozi--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.85 [x] P2 — V skupnem načrtu je opozorilo o poškodbi ene stranke prikazano brez imena — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8085-x-p2--v-skupnem-načrtu-je-opozorilo-o-poškodbi-ene-stranke-prikazano-brez-imena--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.86 [~] P2 — Značka v glavi piše »7?« in nikjer na zaslonu ni povedano, kaj šteje

**Scenarij in koraki:** delaj z aplikacijo (dodaj stranko, vpiši serijo, shrani opombo) in glej gumb
z oblakom v glavi, levo od menija ☰. Nato ga tapni.

**Opaženo:** gumb pokaže besedilo »7?« — številko in vprašaj — in številka z vsako spremembo zraste.
Kaj šteje, piše samo v pomožnem imenu gumba, ki ga trener ne vidi: »Središče za sinhronizacijo in
varnostne kopije — Sinhronizacija v oblak ni povezana«. Okno, ki se na dotik odpre (»Središče za
sinhronizacijo in varnostne kopije«), te številke ne omeni; v njem ni ne števila sprememb ne besede
»sprememb«.

**Težava in vpliv:** trener bere »7?« ob oblaku kot sedem stvari, ki niso shranjene, in ne more
nikjer preveriti, ali je to res. Aplikacija sicer vse hrani na napravi, torej ga številka po
nepotrebnem skrbi; če pa res kaže neposlane spremembe, tega ne izve.

**Predlog:** ob številki naj bo na zaslonu napisano, kaj šteje, in okno naj isto številko ponovi z
besedami — opaženo na različici `8b2ce80`.

**Stanje 2026-09-30:** okno »Središče za sinhronizacijo in varnostne kopije« zdaj z besedami pove, kaj
šteje številka: koliko sprememb na tej napravi še ni v Google Drive, in da je stanje v oblaku neznano,
dokler Drive ni povezan (`68b56da`). Številka šteje razliko do zadnje sinhronizacije z Drive, ne do
zadnje izvožene datoteke, zato besedilo ne govori o varnostni kopiji. **Odprto, čaka na Simona:** ali
značko brez povezanega oblaka skriti — isto vprašanje kot §80.11.

**Dokaz za odprto vprašanje, prvo odprtje 2026-09-30, `main` `12d0e66`:** oba trenerja brez
predznanja sta okno odprla in besedilo prebrala, pa sta vseeno ostala v skrbeh. Prvi: »"!" ne pove,
kaj je narobe … Za trenerja, ki ne razume Google Drive, je to alarm brez razlage«; skupaj z rumeno
oznako »PREDOGLED«: »pomeni, da ne smem zaupati podatkom«. Drugi, brez računa Google: »Stavek
"Vprašaj v glavi" ne razumem. "Izvozi JSON" — beseda JSON mi ne pove nič.« Nobeden ni izvedel, kam
gredo podatki, če se telefon pokvari.

### 80.87 [x] P2 — Napačna datoteka pri uvozu odgovori angleško: »Error: Invalid backup file format.« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8087-x-p2--napačna-datoteka-pri-uvozu-odgovori-angleško-error-invalid-backup-file-format--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.88 [~] P1 — V oknu, ki briše podatke, sta »Prekliči« in »Odstrani« visoka 21 pik in 4 pike narazen

**Scenarij in koraki:** svež zagon z vzorčnimi podatki. Odpri predal z obvestili na dnu in tapni
»Počisti podatke in zapusti predstavitveni način«. Odpre se okno »Počisti vzorčne podatke«, ki našteje
8 vzorčnih strank, 5 rutin, 5 zapisov treningov, 3 prilagoditve načrta, 20 terminov in 4 obvestila.

**Opaženo:** na dnu okna sta gumba »Prekliči« (46 × 19 pik, dotikalni pas od 42. do 90. pike
vodoravno) in »Odstrani« (54 × 19 pik, pas od 94. do 146. pike, navpično od 617. do 637., torej 21
pik). Med njima so štiri pike praznega prostora. Okno ne pove, da brisanja ni mogoče razveljaviti, in
pred brisanjem ne ponudi varnostne kopije.

**Težava in vpliv:** palec meri okoli 44 pik, torej pokrije oba gumba hkrati. Trener, ki hoče
preklicati, izbriše. Izbrisano je nepovratno — vrne ga le varnostna kopija, na katero okno ne opozori.

**Predlog:** oba gumba naj imata dotikalno tarčo vsaj 44 pik in med njima naj bo prazen pas; okno naj
pove, da brisanja ni mogoče razveljaviti, in naj prej ponudi »Izvozi JSON« — opaženo na različici
`8b2ce80`.

**Stanje 2026-09-30:** gumba sta zdaj gumba aplikacije, visoka 44 pik, z razmikom, »Odstrani« desno
(`367f4ef`). Vzrok: razreda `btn-secondary` in `btn-danger` nimata nobenega pravila v CSS. **Odprto:**
okno še ne pove, da izbrisa ni mogoče razveljaviti, in ne ponudi izvoza pred izbrisom; oboje je novo
besedilo v oknu in naj ga potrdi Simon.

### 80.89 [x] P2 — Po čiščenju vzorčnih podatkov vrstica na dnu še vodi v izbrisani vzorčni trening — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8089-x-p2--po-čiščenju-vzorčnih-podatkov-vrstica-na-dnu-še-vodi-v-izbrisani-vzorčni-trening--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.90 [~] P2 — Aplikacija po čiščenju še naprej terja odstranitev testnih zapisov, gumba za to pa ni več

**Scenarij in koraki:** svež zagon z vzorčnimi podatki. Ustvari en svoj trening z vzorčno stranko
(»Ponedeljkova moc«, 2026-10-05, 09:00 - 10:00, Jane Doe). Odpri predal na dnu → »Počisti podatke in
zapusti predstavitveni način« → »Odstrani«. Nato preberi predal in odpri »Imenik strank«.

**Opaženo:** troje.
1. Okno pred brisanjem našteje ohranjeno pod slovenskim naslovom »Ohranjeno, ker je tvoje delo odvisno
   od tega«, razlog pri vsaki vrstici pa je angleški: »Jane Doe — a record you created still depends
   on it«, »Zgornji del A — a record you created still depends on it«.
2. Po brisanju predal pravi: »51 zapisov, ki jih je ustvaril testni zagon, je shranjenih skupaj s
   tvojim delom, in sicer v: clients, exercises, routines, sessionSeries. Niso tvoji; ko jih
   odstraniš, vse, kar si ustvaril sam, ostane nedotaknjeno.« Vrstice »Počisti podatke in zapusti
   predstavitveni način« v predalu ni več, drugega gumba za to pa ni nikjer. Imena shramb so
   angleška.
3. Vzorčna stranka Jane Doe ostane v imeniku med trenerjevimi strankami, brez oznake, da je vzorčna,
   in oznaka »PREDOGLED« je še vedno v glavi.

**Težava in vpliv:** trener stori, kar mu aplikacija naroči, in po tem mu ta še naprej govori, da ima
51 tujih zapisov in naj jih odstrani, pri čemer tega ne more storiti. Izmišljena oseba ostane v
imeniku poleg resničnih strank, zato ne ve, ali je aplikacija pripravljena za resnično delo.

**Predlog:** besedilo po čiščenju naj pove, kaj je ostalo in zakaj (ker je od tega odvisen trenerjev
zapis), naj bo v slovenščini z imeni, ki jih trener pozna, in naj obdrži pot, po kateri ohranjeno
odstrani, ko zapisa ne potrebuje več — opaženo na različici `8b2ce80`.

**Stanje 2026-09-30:** opozorilo o testnih zapisih zdaj šteje le zapise, ki bi jih odstranitev
izbrisala (`367f4ef`). Zapisi, ki jih odstranitev namerno obdrži (katalog vaj in kar je trenerjevo
delo nanje vezano), ostanejo označeni za vedno, zato opozorilo prej ni moglo nikoli izginiti.
**Odprto:** razlogi, zakaj je zapis obdržan, in imena zbirk so v sporočilu še angleški (novi ključi v
slovarjih); ali stranka iz vzorca, ki ostane, dobi oznako »vzorec«, in ali oznaka PREDOGLED ostane v
glavi, je Simonova odločitev.

**Stanje 2026-09-30, drugič:** razlogi in imena zbirk so zdaj v jeziku trenerja (`03aeba4`). Odprto
ostane le, kar je zgoraj zapisano kot Simonova odločitev: oznaka »vzorec« na stranki, ki ostane, in
oznaka PREDOGLED v glavi.

### 80.91 [ ] P1 — Sprememba teže v načrtu prihodnjega treninga po osvežitvi izgine brez besede

**Scenarij in koraki:** odpri podlogo prihodnjega treninga (»Ponedeljkova moc«, 2026-10-05, 09:00 -
10:00, stranka Jane Doe, rutina »Zgornji del A«). Tapni ⋮ »Možnosti treninga« → »Uredi načrt«. Pri
vaji Barbell Bench Press popravi težo z 62.5 na 90 in tapni »Končano z urejanjem načrta«. Nato osveži
stran in trening odpri znova s kartice.

**Opaženo:** takoj po zaprtju urejevalnika podloga pravi »Barbell Bench Press · 5 · 90 kg«. Po
osvežitvi pravi »5 · 62.5 kg«. Nobenega opozorila ni bilo, ne pri zapiranju urejevalnika ne po
osvežitvi. V shrambi ni nikjer zapisa s to težo — ne med `sessions`, ne med `planUpdates`.

**Težava in vpliv:** trener za mizo pripravi obremenitve za naslednji teden. Ko naslednjič odpre
telefon, so nazaj stare številke, in tega ne izve: podloga po urejanju kaže novo težo, torej ni
razloga za dvom. Delo, ki ga je opravil, je izgubljeno tiho.

**Predlog:** »Končano z urejanjem načrta« naj spremembo zapiše, in dokler ni zapisana, naj podloga ne
kaže nove številke — opaženo na različici `8b2ce80`.

**Presoja 2026-09-30 (Claude):** isti vzrok kot §80.52. Načrt treninga, ki se še ni začel, živi samo
v predpomnilniku odprte podloge (`librept_active_session`), ne pri treningu; ob novi gradnji podloge
ali osvežitvi se vrne načrt iz rutine. Popravek, ki drži, shrani načrt pri treningu samem — to je
sprememba sheme, o kateri odloča Simon (§80.52). Do takrat ostane odprto.

### 80.92 [ ] P2 — »Uveljavi in razreši« spremeni skupno rutino, okno pa govori samo o eni stranki

**Scenarij in koraki:** stranka je na treningu pri vaji rekla, da je pretežko (na podlogi »Pretežko«
in »Dodaj opombo« → »Pretežko – zmanjšaj težo«). Odpri predal na dnu → »Treningi, ki čakajo na
pregled« → vrstica »SIM Ana — Moč pri Ani (1)« → zaslon »Čakajoče na pregled« → »Razreši«. V oknu
»Uveljavi spremembo programa« tapni »Uveljavi in razreši«.

**Opaženo:** okno pove »Stranka: SIM Ana«, »Povratna informacija: Pretežko – zmanjšaj težo«,
»Podrobnosti: SIM pretežko pri 4. seriji« in ponudi »Ciljna teža (kg)« z vpisano 75. Po dotiku se
spremeni **rutina** »SIM Rutina Ana«: teža pri vaji Barbell Back Squat se je v njenem zapisu
spremenila s 77.5 na 75. Rutina ni last te stranke — isto rutino ponudi izbirnik »Izberi rutino« pri
vsaki stranki in vsakem terminu. Okno rutine ne omeni z nobeno besedo.

**Težava in vpliv:** trener zniža breme eni stranki, ki ji je bilo pretežko, in s tem zniža breme
vsem drugim strankam na isti rutini in vsem svojim prihodnjim terminom s to rutino. Tega ne izve, ker
okno govori o eni stranki. Pri močnejši stranki to pomeni teden treninga s premajhno težo.

**Predlog:** okno naj napiše, kaj bo spremenilo (»rutina SIM Rutina Ana — velja za vse stranke na
njej«) in naj ponudi izbiro med spremembo rutine in spremembo načrta te stranke — opaženo na
različici `8b2ce80`.

**Presoja 2026-09-30 (Claude): čaka na Simona.** Prilagoditev iz povratne informacije danes
spremeni rutino, ki jo lahko uporablja več strank. Ali naj prilagoditev velja samo za to stranko
(njena kopija rutine ali prilagoditev pri stranki) ali za vse na rutini, je odločitev o modelu
podatkov, ne popravek. Najmanj, kar velja v obeh primerih: okno naj pove, da se spremeni rutina, in
koliko strank jo uporablja.

**Dokaz 2026-09-30, prvo odprtje, `main` `12d0e66` (poročilo trenerja-podagenta, vodilna seja ni
ponovila):** trener je stranki z bolečino v kolenu v »Razreši« zamenjal počep z »Leg Press« 14 kg.
Naslednja stranka z isto rutino, brez težav s kolenom, je dobila »Leg Press S3 × R10 × 14 kg«. To
je bila druga od treh stvari, ki so ga v prvi uri najbolj zmedle.

### 80.93 [ ] P2 — »Kopiraj ta načrt na …« ne kopira na drug dan, ampak na drugo stranko istega treninga

**Scenarij in koraki:** odpri podlogo treninga z eno stranko (»Ponedeljkova moc«, 2026-10-05, Jane
Doe). Tapni ⋮ »Možnosti treninga«. Meni ponudi »Uredi načrt«, »Vsi na ta načrt«, »Kopiraj ta načrt na
…« in »Izbriši trening«. Tapni »Kopiraj ta načrt na …«.

**Opaženo:** aplikacija odgovori »V tem treningu ni še nikogar drugega.« Ukaz torej kopira načrt na
druge stranke istega termina, ne na drug dan. Tri pike v napisu obljubljajo izbiro cilja, ta pa je
lahko samo oseba na istem treningu.

**Težava in vpliv:** trener, ki je za stranko sestavil načrt in ga hoče v tem tednu ponoviti še v
četrtek, po tem napisu poseže prav sem in dobi stavek o nikomer drugem. Načrt lahko ponovi le tako, da
pri novem terminu znova izbere rutino, s čimer izgubi vse, kar je v načrtu popravil za to stranko.

**Predlog:** napis naj povedati, kam kopira (»Kopiraj ta načrt drugi stranki na tem treningu«), in če
kopiranja na drug dan ni, naj tega ukaza ni videti pri treningu z eno stranko — opaženo na različici
`8b2ce80`.

**Presoja 2026-09-30 (Claude):** to ni napaka, ampak manjkajoča funkcija, ki je že zapisana kot
§88.5 (»Kopiraj trening na datum«). »Kopiraj ta načrt na …« je namenoma kopija k drugemu udeležencu
istega treninga. Napis gumba bi lahko to povedal jasneje; to sodi k §88.5.

**Prvo odprtje 2026-09-30, `main` `12d0e66`:** kopija k drugemu udeležencu uspe, vendar brez besede.
Trening »Par« za SIM Tim Test in SIM Eva Test: »Kopiraj ta načrt na …« → »SIM Eva Test«. Okno se
zapre, zavihek ostane pri Timu, obvestila ni. Trenerka brez predznanja je preverila ročno na drugem
zavihku: »Potrditev bi bila dobrodošla.«

### 80.94 [x] P2 — V kartoteki stranke je signal s treninga še vedno angleški: »Too Hard - Reduce Load« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8094-x-p2--v-kartoteki-stranke-je-signal-s-treninga-še-vedno-angleški-too-hard---reduce-load--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.95 [x] P1 — Dotik »Pretežko« zapiše vajo kot opravljeno z vsemi načrtovanimi serijami — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8095-x-p1--dotik-pretežko-zapiše-vajo-kot-opravljeno-z-vsemi-načrtovanimi-serijami--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.96 [x] P2 — Prva kartica vodenega ogleda veleva pritisniti »Naprej«, tega gumba pa ni — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8096-x-p2--prva-kartica-vodenega-ogleda-veleva-pritisniti-naprej-tega-gumba-pa-ni--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.97 [x] P3 — Peskovnik napoti trenerja na seznam poglavij, ki je 325 pik pod robom zaslona — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8097-x-p3--peskovnik-napoti-trenerja-na-seznam-poglavij-ki-je-325-pik-pod-robom-zaslona--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.98 [x] P2 — Korak ogleda imenuje polje »Ime stranke«, obrazec pa ima »Ime in priimek« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8098-x-p2--korak-ogleda-imenuje-polje-ime-stranke-obrazec-pa-ima-ime-in-priimek--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.99 [x] P2 — Kartica »Ta zaslon ni del demota« pokrije oba gumba zaslona, na katerem stoji — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8099-x-p2--kartica-ta-zaslon-ni-del-demota-pokrije-oba-gumba-zaslona-na-katerem-stoji--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.100 [x] P2 — Berljiv izvoz podatkov za stranko meša prihodnje termine z opravljenimi, je delno angleški, in pogreša obljubljeno spremembo načrta — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80100-x-p2--berljiv-izvoz-podatkov-za-stranko-meša-prihodnje-termine-z-opravljenimi-je-delno-angleški-in-pogreša-obljubljeno-spremembo-načrta--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.101 [x] P2 — Izbrisana stranka ima še vedno cel zaslon stranke in ponuja izvoz svojih podatkov — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80101-x-p2--izbrisana-stranka-ima-še-vedno-cel-zaslon-stranke-in-ponuja-izvoz-svojih-podatkov--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.102 [x] P2 — Preklic privolitve nima polja za datum in ne pove, kaj se z njim ustavi — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80102-x-p2--preklic-privolitve-nima-polja-za-datum-in-ne-pove-kaj-se-z-njim-ustavi--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.103 [x] P1 — Odprtje in zapiranje enega večera serije ustvari drugo, enako kartico istega večera — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80103-x-p1--odprtje-in-zapiranje-enega-večera-serije-ustvari-drugo-enako-kartico-istega-večera--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.104 [x] P2 — Izbrisana serija pusti za sabo programe brez datuma, ki jih ni mogoče razločiti — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80104-x-p2--izbrisana-serija-pusti-za-sabo-programe-brez-datuma-ki-jih-ni-mogoče-razločiti--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.105 [ ] P1 — Stranka brez imena se shrani kot »Nova stranka«, čeprav je ime obvezno

**Scenarij in koraki:** »Imenik strank« → »Dodaj stranko«. Polja »Ime in priimek *« se ne dotakni, v
»Cilji treninga« vpiši »SIM cilj: hujsanje« in tapni »Shrani«.

**Opaženo:** okno se zapre brez sporočila. V imeniku je nova stranka z imenom »Nova stranka« in
vpisanim ciljem. Sporočila o neizpolnjenem polju ni nobenega, ne pri polju ne v oknu, čeprav ima polje
zvezdico in atribut `required`.

**Težava in vpliv:** ime je edini podatek, po katerem trener stranko najde. Ko na hodniku vpiše cilj
in shrani, misli, da je stranko vpisal, v imeniku pa ima vrstico »Nova stranka«. Pri dveh takih ne ve,
katera je katera, in cilj je pripisan nikomur.

**Predlog:** »Shrani« naj brez imena zavrne, s sporočilom pri polju, kot to počne uvodni obrazec s
trenerjevimi podatki (»Izpolni to polje.«) — opaženo na različici `8b2ce80`.

Na istem zaslonu opaženo še: stranka, ki je bila preimenovana iz »Nova stranka« v »SIM Ana Testna«,
ima v imeniku še vedno začetnici »NS«, torej začetnici starega imena. (Preimenovanje je opravil prejšnji
zagon; sam sem videl izid v imeniku.)

**Stanje 2026-09-30 — čaka na Simona, ker predlog nasprotuje tvojemu pravilu.** Obrazci od 2026-09-17
pišejo v bazo med tipkanjem, in isti dan si odločil: »A new record exists from the first typed
character. An empty required field is written as a placeholder ("New client", "New exercise", "New
routine", 3 sets) — no alert, no refusal.« Zato okna ne popravljam: opažanje je posledica tega
pravila, ne napake v izvedbi. Odprto vprašanje zate je ožje: ali sme trener zapustiti obrazec z
neimenovano stranko **brez besede**. Tri poti, brez zavrnitve shranjevanja:
1. ime ostane obvezno le za prikaz — vrstica v imeniku brez imena je označena (»brez imena«), da jo
   trener najde in dopolni;
2. polje že ob odprtju kaže podomestek kot vrednost, tako da trener vidi, kaj bo shranjeno;
3. pravilo se zoži: podomestek velja za vse razen imena, ime pa zadrži zapiranje z besedilom pri
   polju, kot ga ima uvodni obrazec (»Izpolni to polje.«).
Začetnice, ki ostanejo »NS« po preimenovanju, so navadna napaka in ne čakajo na nič. **Popravljeno
2026-09-30:** začetnice zdaj sledijo imenu tudi pri preimenovanju, ne le pri dodajanju; posebej
nastavljen znak stranke se ne povozi (`src/controllers/clientFormsController.js`, preizkušeno v
`tests/medium/test_clients_directory.py`). Odprto ostaja samo Simonovo vprašanje zgoraj.

### 80.106 [x] P3 — Vprašanje pred zaključkom treninga šteje čas v minutah: »še približno 3812 minut« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80106-x-p3--vprašanje-pred-zaključkom-treninga-šteje-čas-v-minutah-še-približno-3812-minut--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.107 [x] P3 — Kartica zaključenega treninga takoj po zaključku še vedno piše »Aktiven trening« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80107-x-p3--kartica-zaključenega-treninga-takoj-po-zaključku-še-vedno-piše-aktiven-trening--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.108 [x] P3 — Na 320 × 680 je od gumba »Shrani in nadaljuj« na uvodnem zaslonu vidne štiri pike — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80108-x-p3--na-320-×-680-je-od-gumba-shrani-in-nadaljuj-na-uvodnem-zaslonu-vidne-štiri-pike--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.109 [x] P2 — Ocena trajanja istega intervala je odvisna od zapisa časa — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80109-x-p2--ocena-trajanja-istega-intervala-je-odvisna-od-zapisa-časa--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.110 [~] P2 — »Shrani kot rutino« pozabi težo, številke v poljih so odrezane, polja nimajo oznak

**Scenarij in koraki:** prazna aplikacija, trening »Skupina torek« za SIM Vera Kos. V »Uredi načrt«
iz kataloga dodati Dumbbell Goblet Squat (3 × 10, 12 kg), Dumbbell Bench Press in Barbell Row.
Začeti in zaključiti trening. ☰ → »Imenik strank« → SIM Vera Kos → pod »ZGODOVINA ZABELEŽENIH
VADB« pritisniti »Shrani kot rutino«.

**Opaženo:** okno »Uredi rutino« ima ime »Prazen načrt, brez rutine 2026-09-30«. Pri vseh treh
vajah je teža 0, tudi pri počepu, ki je bil načrtovan z 12 kg. Polja za serije, ponovitve, težo
in premor so široka 50 pik: namesto »10« se vidi »1«, namesto »60« »6« (posnetek zaslona).
Nad polji ni nobene oznake. Napis »Serije«, »pon.«, »kg« in »Premor« je le namig v praznem
polju, zato izpolnjeno polje ne pove, kaj pomeni.

**Težava in vpliv:** trener shrani program, ki ga je stranka pravkar delala, in dobi rutino brez
tež. Če tega ne opazi, naslednja stranka dobi počep z 0 kg. Ne vidi, katera številka je
ponovitev in katera premor, in ne vidi celih številk.

**Predlog:** rutina naj prevzame težo iz načrta. Ime naj bo ime treninga, ne »Prazen načrt, brez
rutine«. Polja naj pokažejo cele številke in stalno oznako. Opaženo na `main` `12d0e66`
(zamrznjena kopija na lokalnem strežniku), sl, 390 × 844; najprej opazil trener-podagent.

**Stanje 2026-09-30:** ime in postavitev sta popravljena (`b331017`): rutina iz treninga brez rutine
dobi naslov treninga, polja v obrazcu rutine imajo vidne oznake in niso več odrezana. **Odprto, čaka
na Simona:** teža. §17.4 določa, da rutina iz treninga dnevne teže izpusti (»strips person/day-specific
magnitudes (`weight` …)«); ugotovitev temu nasprotuje, zato je to odločitev, ne napaka.

### 80.111 [x] P2 — Nova stranka: gumba pravita »E-pošta ni vpisana« in »Telefon ni vpisan«, čeprav sta vpisana — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80111-x-p2--nova-stranka-gumba-pravita-e-pošta-ni-vpisana-in-telefon-ni-vpisan-čeprav-sta-vpisana--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.112 [x] P3 — Gumb »Ni se zgodila« v oknu, ki govori o »treningu« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80112-x-p3--gumb-ni-se-zgodila-v-oknu-ki-govori-o-treningu--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.113 [x] P1 — Uvoz programa izgubi serije, ponovitve in težo, tudi pri primeru, ki ga pokaže aplikacija — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80113-x-p1--uvoz-programa-izgubi-serije-ponovitve-in-težo-tudi-pri-primeru-ki-ga-pokaže-aplikacija--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.114 [~] P2 — Zaključen trening s tremi vajami piše »Program ni določen« in »Zaključeno 00:01«

**Scenarij in koraki:** trening »Skupina torek« za SIM Vera Kos brez rutine. V »Uredi načrt«
dodati tri vaje iz kataloga, začeti in zaključiti trening. Vrniti se na seznam treningov.

**Opaženo:** kartica: »1/1 mest zasedenih«, »Program ni določen«, »Zaključeno«, »00:01«. Trening
je imel tri vaje in stran stranke jih pokaže. Trener brez predznanja je pri skupini treh strank
zapisal: »oznaka ne pove, za koga« in »prikaz zgleda kot ura, ne kot trajanje«.

**Težava in vpliv:** oznaka trdi, da programa ni, čeprav je bil. Trener pomisli, da se načrt
ni shranil. »00:01« prebere kot uro zaključka (ob eni minuti čez polnoč), ne kot eno minuto.

**Predlog:** »Program ni določen« naj velja le za trening brez vaj. Trajanje naj se napiše kot
trajanje, na primer »trajal 1 min«. Opaženo na `main` `12d0e66`, sl, 390 × 844.

**Stanje 2026-09-30:** »Program ni določen« se pokaže le še pri treningu brez vsakega načrta
(`3210821`); zaključen trening se prepozna po zapisu v zgodovini istega dne. **Odprto, čaka na
Simona:** kako zapisati trajanje (»00:01« je oblika polja za urejanje). Tudi: nezačet trening z ročno
sestavljenim načrtom še kaže opozorilo, ker njegov načrt ni shranjen pri treningu (§80.52).

### 80.115 [x] P2 — Na slovenski podlogi vaja po »Prelahko« dobi oznako »Completed« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80115-x-p2--na-slovenski-podlogi-vaja-po-prelahko-dobi-oznako-completed--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.116 [x] P2 — Okno »Trening se je začel izven urnika« skrije »Končni čas« desno od roba — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80116-x-p2--okno-trening-se-je-začel-izven-urnika-skrije-končni-čas-desno-od-roba--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.117 [x] P3 — Trening čez teden dni »se začne čez 870h 01m« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80117-x-p3--trening-čez-teden-dni-se-začne-čez-870h-01m--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.118 [ ] P2 — Zaslon treninga ima dve imeni, »beležka« in »podloga«, in nobeno ni razloženo

**Scenarij in koraki:** prvi zagon. Prebrati prvi stavek aplikacije, nato ustvariti trening in
pritisniti »Odpri v beležki«.

**Opaženo:** prvi stavek pravi »Lahek in brezplačen pripomoček za tvojo podlogo, treninge in
programe vadbe.« Gumb, ki odpre zaslon treninga, pravi »Odpri v beležki«; ročica istega zaslona
»Odpri podlogo treninga«; obrazec »Poteka vzporedno — odpre se kot ena podloga«; vodeni ogled
»beležka med vadbo«. Slovenski slovar aplikacije ima »beležk« trikrat in »podlog« petkrat. Oba
trenerja brez predznanja sta se ustavila: »ne vem, kaj je podloga. Mislim, da podlaga za vadbo
(preproga?)«; »"Odpri v beležki" — beležka? Mislil sem, da je to zvezek«; »kaj je podloga?«.

**Težava in vpliv:** prvi stavek aplikacije trenerju ne pove, kaj aplikacija je. Ko prebere
»podloga« in »beležka«, ne ve, da gre za isti zaslon. Sledi navodilu, ki imenuje eno, na zaslonu
pa vidi drugo.

**Predlog:** en izraz za ta zaslon v vseh besedilih, in tak, ki ga trener pozna brez razlage
(na primer »trening« ali »vadba«: »Odpri trening«). Izbira besede je Simonova. Opaženo na `main`
`12d0e66`, sl, 390 × 844.

### 80.119 [x] P2 — Zgodovina stranke izpusti težo: »Dumbbell Goblet Squat: 10, 10, 10« pri 12 kg — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80119-x-p2--zgodovina-stranke-izpusti-težo-dumbbell-goblet-squat-10-10-10-pri-12-kg--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.120 [x] P2 — Pod poškodbo kolena stran stranke pravi »Brez zabeleženih zdravstvenih težav« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80120-x-p2--pod-poškodbo-kolena-stran-stranke-pravi-brez-zabeleženih-zdravstvenih-težav--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.121 [x] P2 — »Zamenjaj vajo« stranki z bolečim kolenom vnaprej izbere Barbell Back Squat — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80121-x-p2--zamenjaj-vajo-stranki-z-bolečim-kolenom-vnaprej-izbere-barbell-back-squat--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.122 [x] P3 — Koledar »Datumi« ne pokaže ne današnjega dne ne dni s treningi — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80122-x-p3--koledar-datumi-ne-pokaže-ne-današnjega-dne-ne-dni-s-treningi--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.123 [x] P2 — Podloga treninga čez dva ali več dni v glavi ne pove dneva, samo »Prihodnje« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80123-x-p2--podloga-treninga-čez-dva-ali-več-dni-v-glavi-ne-pove-dneva-samo-prihodnje--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.124 [x] P2 — Oznaka »PREDOGLED« vodi na »Stran ni najdena«, ko je aplikacija že naložena — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80124-x-p2--oznaka-predogled-vodi-na-stran-ni-najdena-ko-je-aplikacija-že-naložena--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.125 [x] P3 — Na slovenski strani so pomožna imena gumbov za bralnik zaslona angleška — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80125-x-p3--na-slovenski-strani-so-pomožna-imena-gumbov-za-bralnik-zaslona-angleška--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.126 [x] P3 — Pred izbiro jezika stran nima `<html lang>`, besedilo za oknom pa je angleško — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80126-x-p3--pred-izbiro-jezika-stran-nima-html-lang-besedilo-za-oknom-pa-je-angleško--popravljeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 80.127 [ ] P1 — Datum, vpisan po slovensko »6.10.2026«, se tiho shrani kot 6102-02-06

**Scenarij in koraki:** »Ustvari trening«, tapniti polje »DATUM« in vpisati »6.10.2026«, kot se datum
piše v Sloveniji. Zapustiti polje, dodati stranko Maja Kranjc, »Shrani«.

**Opaženo:** polje pokaže »6102-02-06«. Opozorila ni, polje ni označeno kot napačno. Po »Shrani« se
odpre okno z vabili, nato seznam na naslovu `/sessions/6102-02-06`: trening je shranjen v leto 6102.
Za primerjavo: »20261006« da pravilno 2026-10-06. Polje ima številsko tipkovnico
(`inputmode=numeric`); na mnogih telefonih ta nima vezaja, pika pa je na njej.

**Težava in vpliv:** trener vpiše termin za naslednji torek po navadi, ki jo ima, in trening izgine
s seznama tega tedna. Stranka pride, trener pa termina nima. Vabilo v koledar bi stranki poslalo
datum 6102.

**Predlog:** polje naj sprejme »6.10.2026« in »6. 10.« kot 2026-10-06, ali pa vnos zavrne in pove,
kako se piše. Nikoli naj ne shrani drugega datuma brez besede (isto načelo kot zaprta §80.59).
Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.128 [ ] P2 — Prazna slovenska aplikacija predlaga angleška imena treningov in krajev

**Scenarij in koraki:** svež brskalnik, `?lang=sl`, »Začni s prazno aplikacijo« (vzorčni podatki
nikoli naloženi). Trener vpiše treninga »Moč« in »Moč A« in kraj »Studio«. Nato »Ustvari trening« in
dotik polja »Izberi ali vpiši ime treninga ...«.

**Opaženo:** seznam predlogov imena: »Morning Strength«, »Hypertrophy Upper«, »Full Body
Conditioning«, »Cardio & Core«, »Athletic Performance«, »Mobility & Recovery«, »Lower Body Power«,
»Personal Training 1-on-1«, šele nato »Moč« in »Moč A«. Predlogi kraja: »Trib gym base«,
»playground outside«, »city park«, »Studio A«, »Main Gym Floor«, »Client Home Studio«, nato
»Studio«. Zaprta §46.4 je prevedla vzorčne podatke; tu vzorca ni, besede so vseeno tam.

**Težava in vpliv:** trener v slovenski aplikaciji dobi osem angleških imen pred svojim. Svoj
»Moč« najde na devetem mestu. Kraja »Trib gym base« in »city park« nista njegova in ga zmedeta,
ali je aplikacija pomešala njegove podatke s tujimi.

**Predlog:** v prazni aplikaciji naj predlogi vsebujejo le imena in kraje, ki jih je trener že
vpisal; ali pa naj bodo vzorčni predlogi v jeziku aplikacije in za trenerjevimi. Opaženo na `main`
`12d0e66`, 390 × 844.

### 80.129 [ ] P3 — Ob začetku treninga ni odprta prva vaja: ali nobena ali zadnja dodana

**Scenarij in koraki:** (a) trening z rutino »Moč A« (tri vaje), ki ga trener ne ureja: odpreti s
seznama, »Začni trening«. (b) trening brez rutine: v »Uredi načrt« dodati tri vaje, »Končano z
urejanjem načrta«, »Začni trening«; nato isti trening odpreti znova s seznama.

**Opaženo:** (a) vse tri vaje pišejo »Prihodnje«, nobena ni odprta, gumbov »Prelahko«, »Pretežko«
in »Opombe« ni. (b) odprta je zadnja dodana vaja (»5/6 Barbell Row«), prvi dve pišeta »Prihodnje«;
enako po ponovnem odprtju s seznama. Trenerka brez predznanja: »Pričakoval sem, da bo odprta prva
vaja … sem mislil, da sta ti dve že opravljeni.«

**Težava in vpliv:** vsak trening se začne z dotikom, ki ga trener mora najti; v primeru (b) trener
začne pri napačni vaji ali misli, da sta prvi dve že za njim.

**Predlog:** ob »Začni trening« naj bo odprta prva vaja, ki še ni opravljena. Opaženo na `main`
`12d0e66`, sl, 390 × 844.

### 80.130 [ ] P2 — Vsaka stranka, dodana na trening, samodejno dobi prvo rutino v knjižnici

**Scenarij in koraki:** v knjižnici je ena rutina, »Moč A« (Dumbbell Goblet Squat 12 kg, Dumbbell
Bench Press 30 kg, Barbell Row 25 kg). »Ustvari trening«, dodati obstoječo stranko Ana Zupan in novo
stranko »Nova Oseba« prek »Dodaj »Nova Oseba« kot novo stranko«. Rutine ne izbrati.

**Opaženo:** izbirnik rutine pri obeh kaže »Moč A«, ne »Izberi rutino« ali »Prazen načrt, brez
rutine«. Skupina treh novih strank (»Skupina«, jutri) je shranjena s »Moč A« na kartici, čeprav je
trener ni izbral. Pred prvo rutino je izbirnik kazal »Prazen načrt, brez rutine«.

**Težava in vpliv:** nova stranka, o kateri trener še ne ve ničesar, dobi program z utežmi, ki ga je
sestavil za nekoga drugega. Če tega ne opazi v vrstici pod imenom, je program na podlogi. Popravek
`0caf9b5` je ista stvar odpravil pri odpiranju (»a programme nobody chose«); obrazec jo zdaj naredi
pri vpisu.

**Predlog:** izbirnik naj ostane »Prazen načrt, brez rutine«, dokler trener ne izbere; ali naj
predlaga rutino, ki jo je ta stranka imela zadnjič. Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.131 [ ] P2 — Takoj po zaključku treninga predal pravi »Vse je pregledano«, signal se pokaže šele po osvežitvi

**Scenarij in koraki:** trening »Moč« (rutina »Moč A«) za Maja Kranjc. »Začni trening«, tapniti prvo
vajo, »Pretežko«, »Zaključi vadbo« → »Zaključi zdaj« → »Zaključi zdaj«. Pogledati predal z
obvestili. Nato osvežiti stran.

**Opaženo:** po zaključku predal: »Obvestila in pregled stanja«, »Vse je pregledano — trenutno tukaj
ni ničesar.« Po osvežitvi: »Treningi, ki čakajo na pregled«, »1 stranka ima nerešene povratne
signale iz treninga.«, »Maja Kranjc — Moč (1)«. Enako že prej s hitrim »Prelahko« pri SIM Nina
Koleno (treninga »Rehabilitacija«). Signal, dan z »Opombe« → »Zapiši opozorilo«, pa se pokaže takoj.

**Težava in vpliv:** trener po treningu pogleda, ali mora kaj popraviti v programu, in prebere, da
ne. Signal »Pretežko« ostane nerešen, naslednji trening ima enako težo.

**Predlog:** predal naj se po zaključku osveži, kot se je seznam treningov v zaprti §80.107.
Opaženo na `main` `12d0e66`, sl, 390 × 844.

### 80.132 [ ] P2 — Teža pri Lat Pulldown se shrani kot »Lvl 60«; polje enoto pove le angleško in le, ko je prazno

**Scenarij in koraki:** ☰ → »Vaje in rutine« → »Rutine« → »Ustvari rutino«, dodati Lat Pulldown,
v polje za breme vpisati 60 (trener misli kilograme), »Shrani«.

**Opaženo:** polje za breme ima namig »Level« (pri drugih vajah »kg« ali »+kg (BW)«); namig izgine,
ko je v polju številka, nad polji pa ni oznake (§80.110). Rutina v seznamu: »Lat Pulldown 3×10 · Lvl
60«. Trener dneva 07: »kartica pokaže "Lvl 60", ne 60 kg. Ni jasno, kaj pomeni in kako vnesti kg.«

**Težava in vpliv:** večina naprav za poteg ima ploščice v kilogramih, katalog pa to vajo vodi v
stopnjah. Trener ne ve, ali je vpisal 60 kg ali 60. stopnjo, in ne more vpisati kilogramov. »Lvl«
in »Level« sta angleška.

**Predlog:** enota v jeziku aplikacije, vidna tudi ob vpisani številki, in možnost kilogramov pri
vajah na napravi. Opaženo na `main` `e8e90d8`, sl, 390 × 844; najprej opazil trener dneva 07.

### 80.133 [ ] P2 — Ocena obrazca »Uveljavi spremembo programa«: ne pove vaje ne stare vrednosti, Esc zavrže

Način 3. Naloga (podagent, pred ogledom obrazca): stranki je bila vaja pretežka, po treningu ji
popravi program. Pot: »Treningi, ki čakajo na pregled« → vrstica stranke → »Razreši«. `main`
`e8e90d8`, sl, 390 × 844 in 320 × 680 (brez premikanja, gumbi na zaslonu, nobena tarča pod 44 pik).
Naloga podagenta: `.private/exploratory-test/forms/2026-09-30-06-task.md`. Stranka Ana Zupan, rutina
»Test pon«, dva signala »Pretežko« (Dumbbell Goblet Squat pri 0 kg, Lat Pulldown pri »Lvl 60«).

**Odveč.** Nič: okno ne sprašuje ničesar, kar bi naloga imela za odveč.

**Manjka.**
- **Katera vaja** (P2). Naloga: »Vaja, ki je bila pretežka — VEDNO«. Okno pove »Stranka«,
  »Povratna informacija«, »Podrobnosti«, vaje ne. Pri dveh signalih iste stranke sta okni enaki do
  številk; seznam za oknom vajo pove (»Vaja: Dumbbell Goblet Squat«).
- **Stara vrednost** (P3). Naloga: »Nova teža 10 kg (prej 12)«. Polja so predizpolnjena (dobro), »prej«
  pa ni napisano nikjer; po prvem popravku trener ne ve več, iz česa je izšel.
- **Za koga** (čaka na Simona, §80.92): naloga zahteva »samo ta stranka / vsi s tem programom«;
  okno spremeni skupno rutino (preverjeno: »Lat Pulldown 3×8 · Lvl 55.5« v knjižnici).
- **Od katere seje** (čaka na Simona): naloga »od naslednje seje (četrtek)«; polja ni.

**Ne deluje.**
- **Esc zavrže vpisano** (P2). Ponovitve spremenjene z 18 na 12, Esc, ponovno »Razreši«: spet 18.
  Pravilo 2026-09-17: zavrže le »Prekliči«, vsak drug izhod ohrani.
- **Enota ne ustreza vaji** (P2). Pri Lat Pulldown, ki ga katalog vodi v stopnjah (»Lvl 60«, §80.132),
  okno predlaga 57.5 pod oznako »Ciljna teža (kg)«.
- Vejica deluje: »55,5« je shranjeno kot 55.5. »Uveljavi in razreši« zapiše spremembo v rutino.

**Napačen tip ali vrstni red.**
- **Ponovitve so besedilno polje brez številske tipkovnice**, serije so številsko polje, teža ima
  decimalno tipkovnico (P3). Na telefonu se pri ponovitvah odpre cela tipkovnica.
- Vrstni red sledi nalogi (kaj se spremeni, nato teža, ponovitve, serije).

Trenerjeva preverba po koncu: »Odprem njeno današnjo sejo, ki je že bila: stara vrednost je ostala.«
Tega ni mogel preveriti, ker trening brez zapisane vaje ne pride v zgodovino (§80.6).

### 80.134 [ ] P1 — Ocena obrazca »Uredi načrt«: načrt za jutri po osvežitvi izgine, ogrevanje ne more biti časovno

Način 3. Naloga (podagent, pred ogledom obrazca): zvečer načrt jutrišnjega enournega treninga za
stranko z bolečo levo ramo: ogrevanje 8 min, štiri vaje s serijami, ponovitvami in težo, dve od
njih v paru za 3 kroge, počitki, plank 3 × 40 s. Naloga podagenta:
`.private/exploratory-test/forms/2026-09-30-07-task.md`. Pot: trening »Moč« jutri 17:00, stranka
Maja Novak brez rutine → podloga → ⋮ → »Uredi načrt«. `main` `e8e90d8`, sl, 390 × 844.

**Odveč.** Nič. Trening, stranka in ura so že znani; urejevalnik jih ne sprašuje znova.

**Manjka.**
- **Opomba pri vaji** (čaka na Simona). Naloga: »Potisk ima opombo o rami, vidno, ko ga odprem.«
  Vrstica ima le ime, serije, ponovitve, težo in sklop; opombo je mogoče napisati le v ime vaje.
- **Časovna vaja po meri** (P2). Ogrevanje »Vaja« brez kataloga ima le ponovitve: »8:00« je na
  podlogi »S1 × R8:00«, »480« pa »S1 × R480«; ocena trajanja ogrevanje šteje kot 1 minuto
  (»1 / 60 min«). Katalogove časovne vaje (Plank: »DRŽA«, »S3 × 0:40 × BW«) to znajo.

**Ne deluje.**
- **Načrt po osvežitvi izgine** (P1, §80.52). Šest vaj, sklop in počitki, »Končano z urejanjem
  načrta«; podloga pokaže ves načrt. Osvežitev in dotik iste kartice: »Ni vstavljenih vaj.« Naloga je
  prav to: »Ko aplikacijo zaprem in odprem brez omrežja, je vse še tam.«
- **Sklop ob dodajanju ustvari prazno vajo** (P3). Po »Sklop« je v njem vrstica brez imena; ostane,
  dokler je trener ne odstrani z »Odstrani«.
- Počitki: za sklopom sta na podlogi dva »Počitek 60s«, ki ju trener ni dodal; naloga zahteva 0 s
  med vajama v paru in 90 s po paru.

**Napačen tip ali vrstni red.**
- **Dve imeni za krog** (P3): urejevalnik »Runde« (pri polju za število krogov), podloga »KROG 1 / 3«.
- Nova kataloška vaja se ne odpre sama; odpre jo le »Razširi« (§94, točka 3).
- Dobro: fokus je v imenu nove vaje, ocena trajanja opozori »49 / 60 min · na tesnem«, plank je
  časovna vaja s poljem »DRŽA«, vrstni red na podlogi je enak vrstnemu redu v urejevalniku.

### 80.135 [ ] P2 — Trening, ki teče, se brez vprašanja prestavi na drug dan; tam ostane »Zaključeno«

**Scenarij in koraki:** trening »Jutranja« danes (2026-09-30) za Emily Stone, rutina »Tri vaje«.
»Začni trening«. Na seznamu svinčnik »Uredi« na kartici, čip »pet. 2.«, »Shrani«. Nato trening
zaključiti in odpreti seznam za 2026-10-02 ter stran stranke.

**Opaženo:** shranjevanje ne vpraša ničesar. Na petku 2026-10-02 stoji »Aktiven trening 01h 06m«,
spodnja vrstica šteje naprej (»1:06:51«), na sredi treninga ni več. Po zaključku ima petek »Zaključeno
00:01«, zgodovina stranke pa »2026-09-30«. Trenerka dneva 08 je trening prestavila, ker je mislila, da
prestavlja termin, ki se še ni zgodil: »Aplikacija ni vprašala, ali premik velja za začet trening.«

**Težava in vpliv:** petkov termin je zaseden s treningom, ki je bil v sredo; urnik za petek laže, v
sredo pa ni zapisa, da je trening bil. Če je trener hotel prestaviti naslednji termin, ta ostane
nedotaknjen.

**Predlog:** pri treningu, ki teče ali je končan, naj »Uredi« datum ne ponudi ali naj vpraša, ali gre
za drug termin. Opaženo na `main` `e8e90d8`, sl, 390 × 844; najprej opazila trenerka dneva 08.

### 80.136 [ ] P1? — Šifrirana varnostna kopija v brskalniku orodja ne pride do datoteke; preveriti na telefonu

**Scenarij in koraki:** ☰ → »Upravljanje podatkov« → »Izvozi JSON« → okno »Geslo za varnostne
kopije« → »Zapisal sem si ga, shrani« → »Izvozi JSON«.

**Opaženo:** na zaslonu »Izvoženo in šifrirano.« in gumb »Odpri šifrirano datoteko«. Brskalnik orodja
(Chromium brez zaslona) prenos začne in ga prekine: `Download.save_as: canceled`, datoteke ni. Enako
na `main` `e8e90d8` in na objavljeni `8b2ce80`, tudi ko stran naslova datoteke ne sprosti
(`URL.revokeObjectURL` onemogočen). Na objavljeni `0625bd6` (pred šifriranjem) je isti ukaz datoteko
prenesel. Trenerka dneva 08 zato ni mogla preskusiti prenosa na nov telefon. Ob tem sta v istem oknu
hkrati vidni »Varnostne kopije s te naprave še niso šifrirane.« in »Izvoženo in šifrirano.« (P3).

**Težava in vpliv:** če se to zgodi tudi na telefonu, trener misli, da ima kopijo, pa je nima; na dan,
ko telefon izgubi, izgubi vse stranke. Iz brskalnika orodja tega ni mogoče ločiti od njegove omejitve.

**Preverba za Simona (ročno, na telefonu, `LibrePT.test@gmail.com` ni potreben):** v Chromu na
Androidu in v Safariju na iPhonu izvoziti kopijo in pogledati, ali je v »Prenosi« datoteka. Če je,
se zapis zapre kot omejitev orodja in ostane le protislovje sporočil (P3).

### 80.137 [ ] P2 — Stranka z angleškim »Jezik obrazca« dobi slovensko vabilo in slovensko stran za odgovor

**Scenarij in koraki:** stranka Emily Stone, e-pošta vpisana, »Uredi profil« → privolitev →
»Jezik obrazca: English« → »Shrani«. Nato trening »Moč« za jutri z Emily, »Shrani«, v oknu »Pošlji
vabila v koledar« pogledati povezavo »Pošlji vabilo«.

**Opaženo:** »Pošlji obrazec za privolitev« pripravi angleško sporočilo (»Hi Emily Stone, To prepare
our workout schedules …«). »Pošlji vabilo« pa slovensko: zadeva »Trening: Moč«, besedilo
»Pozdravljen/a Emily Stone, Tvoj trening: Moč … Sporoči mi, ali lahko prideš:« in povezava z
`?lang=sl`. Zaprta §80.50 (`86aefd7`) je v povezavo dodala jezik, v katerem je vabilo napisano, to je
trenerjev. Trenerka dneva 08 (stranka govori le angleško): »Emily dobi vabilo v slovenščini.«

**Težava in vpliv:** stranka, ki slovensko ne bere, vabila ne razume, stran za odgovor pa je tudi
slovenska. Trener mora vsako vabilo prevesti na roke ali ga ne pošlje.

**Predlog:** vabilo in povezava naj uporabita jezik, ki ga ima stranka zapisan (»Jezik obrazca«),
kot ga že obrazec za privolitev. Opaženo na `main` `e8e90d8`, sl, 390 × 844.

### 80.138 [ ] P1 — Konec serije, vpisan pri današnjem večeru, podvoji današnji večer in serije ne konča

**Scenarij in koraki:** tedenska serija »Hipertrofija« ob sredah ob 07:00 od danes (2026-09-30) za
Petro Zupan. Večer 7. 10. odpreti s svinčnikom »Uredi« in »Shrani« (nič spremenjeno). Nato današnji
večer »Uredi«: obkljukati »Spremeni vse večere tega treninga«, nato »Ponovi vsak teden« (pri večeru
serije je prikazan neobkljukan), v »DO (NEOBVEZNO)« vpisati 20261006, »Shrani«.

**Opaženo:** na seznamu je današnji večer dvakrat, obe kartici »07:00 - 08:00 Hipertrofija … Zamuja«
(eden je shranjen zapis, drugi večer serije `…@2026-09-30`). Serija teče dalje: 7., 14., 21. 10. in
naprej. Po »Izbriši trening« pri eni od kartic (okno: »Izbriše se samo ta večer, ostali ostanejo«)
izgineta obe; današnjega treninga ni več. Trener dneva 09 je hotel ustaviti serijo za dva tedna
stranke na dopustu.

**Težava in vpliv:** trener misli, da je serijo končal, termini pa se še naprej pojavljajo; na
današnji dan ima dva enaka termina, in ko enega izbriše, izgubi oba. Stranka na dopustu ostane v
urniku.

**Predlog:** »Do« pri »Spremeni vse večere« naj serijo konča na tem dnevu in ne ustvari novega večera;
izbris enega večera naj pusti drugi. Pri večeru serije naj bo »Ponovi vsak teden« prikazan kot
obkljukan. Opaženo na `main` `e2daf5e`, sl, 390 × 844; najprej opazil trener dneva 09.

### 80.139 [ ] P3 — V »Ustvari rutino« gumb »Dodaj vajo« skrije izbirnik vaj, ki je že odprt

**Scenarij in koraki:** ☰ → »Vaje in rutine« → »Rutine« → »Ustvari rutino«. Pritisniti »Dodaj vajo«,
nato še enkrat.

**Opaženo:** ob odprtju okna je izbirnik vaj že odprt (»Išči vaje«, filtri, 48 vaj). Prvi dotik na
»Dodaj vajo« ga zapre, drugi odpre. Trener dneva 09: »tapni "Dodaj vajo" (izbirnik se ne odpre),
tapni še enkrat (odpre se)«.

**Težava in vpliv:** gumb, ki pravi »dodaj«, prvič skrije seznam, iz katerega se dodaja. Trener
misli, da gumb ne deluje.

**Predlog:** ko je izbirnik odprt, naj gumb pravi, kaj naredi (na primer »Skrij seznam vaj«), ali naj
izbirnik ostane odprt. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.140 [ ] P2 — Poglavje »Izvedba in prilagoditve treninga«: korak imenuje angleški gumb, opombe ob vaji ni

**Scenarij in koraki:** prvi zagon, pogoji, tema, osebni podatki, poglavje »Izvedba in prilagoditve
treninga« (15 korakov). Vsak korak opraviti sam, kot ga korak opiše; »Pokaži mi« le, kjer korak ni
enoznačen.

**Opaženo:**
- **Korak 7** (P2): »Pritisni 🔥 Joint Pain / Discomfort — bolečina v sklepu.« Gumb v oknu »Zabeleži
  povratne informacije« se glasi »🔥 Bolečina ali nelagodje v sklepu«. Pravilo izdelka: korak imenuje
  gumb z napisom, ki ga gumb kaže v tem jeziku. Odprta Simonova odločitev o angleških imenih v vodenem
  ogledu (»all three personas named the English note-type button …«) izhaja iz časa, ko je bil gumb še
  angleški; zdaj je slovenski, angleški je le še korak (ključ `story_step_capture_tag`). Enako v
  drugih jezikih: angleški korak »Tap 🔥 Joint Pain / Discomfort.«, gumb »Joint pain or discomfort«;
  nemški »Tippe auf 🔥 Joint Pain / Discomfort — Gelenkschmerzen.«, gumb »Gelenkschmerz oder
  Beschwerden«. Meritev: v vseh 53 korakih vsakega jezika je to edini napis gumba, ki ga slovar nima.
- **Korak 12** (P2): »Pritisni Uredi načrt. Odpre se Johnov načrt; opomba je v njem, ob vaji.« V
  urejevalniku opombe »levo koleno, tretja runda« ob vaji ni (vrstica nima polja za opombo, §80.134);
  besedilo je le v pogledu prejšnjega načrta nad robom zaslona.
- **Koraka 2 in 5** (P3): »Pritisni Janin sklop.« in »Pritisni njegov sklop, da se odpre.« Jane ima
  tri sklope, John pet; mišljen je prvi (»Dinamično ogrevanje«), kar pokaže šele »Pokaži mi«.
- Drži: po koraku 14 ima John Lat Pulldown, Jane pa še Face Pulls (»Vaja se zamenja samo pri Johnu«).

**Težava in vpliv:** vodeni ogled je za trenerja brez predznanja edini učitelj. Kjer korak imenuje
gumb, ki ga ni, ali obljubi, česar zaslon ne pokaže, trener ne ve, ali je zgrešil on ali aplikacija.

**Predlog:** korak 7 z napisom gumba; korak 12 naj pove, kje je opomba res vidna; koraka 2 in 5 naj
sklop imenujeta. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.141 [ ] P3 — Poglavje »Načrt za torek« obljublja oceno minut, ki je ni, in shrani prazen sklop

**Scenarij in koraki:** prvi zagon, poglavje »Načrt za torek« (8 korakov), vsak korak opravljen sam.

**Opaženo:**
- **Korak 3:** »Ob naslovu piše na primer 45 / 60 min: 45 minut vaj v 60-minutnem terminu.« Podloga
  združi »Skupinska moč in kondicija« in »Vrnitev po poškodbi« (»Danes · 17:00 - 19:00«); ocene
  minut ob naslovu ni (posnetek zaslona). Pri treningu z eno stranko je (»49 / 60 min«, §80.134).
- **Koraka 4 in 5:** »+ Sklop … doda prazen sklop, v katerega dodaš vaje«, takoj zatem »Pritisni ✓ …
  Načrt se shrani«. Vaj ne doda nihče; po ✓ praznega sklopa na podlogi ni. Trener se nauči dodati
  nekaj, kar izgine.
- **Korak 7:** »Jane, John in Sarah delajo isti sklop, zato imajo en načrt.« Sarah je na drugem
  treningu, »Vrnitev po poškodbi«, z načrtom »Trup in gibljivost po porodu«; po »Vsi na ta načrt« ima
  načrt skupine (zavihek »Skupaj JD · JS · SJ«).

**Težava in vpliv:** trener, ki se iz ogleda uči, išče oceno, ki je ni, in se nauči, da stranko po
porodu pridruži skupinskemu metaboličnemu krogu z enim dotikom.

**Predlog:** korak 3 naj pokaže oceno tudi pri združeni podlogi ali naj je ne omenja; v koraku 4 naj
trener v sklop doda vajo; korak 7 naj velja za stranke, ki res delajo isto, ali naj pove, da Sarah
zamenja načrt. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.142 [ ] P2 — Poglavje »Pregled zaznamkov in priprava treningov« trdi, da je torek ob 20:00, ura pa se ne shrani

**Scenarij in koraki:** prvi zagon, poglavje »Pregled zaznamkov in priprava treningov« (7 korakov),
vsak korak opravljen sam; pri koraku 5 še »Pokaži mi«.

**Opaženo:**
- **Korak 5:** »Torek se ta teden premakne za dve uri … Pritisni svinčnik na kartici Moč ob torkih in
  četrtkih.« Prva taka kartica je četrtek 2026-09-24, ki je že mimo; tudi »Pokaži mi« odpre
  `session/setup/ss092426` z datumom 2026-09-24.
- **Koraka 6 in 7:** »V polje za začetek vpiši 20:00.« in takoj »Konec ogleda … Torek je ta teden ob
  20:00.« »Shrani« korak ne zahteva. Po »Končaj« in ponovnem nalaganju kartica 2026-09-24 še vedno
  kaže »18:00 - 19:00«.
- **Korak 7**, ko je poglavje začeto samo: »Pri Jane je zapisano, da ji je šlo prelahko. Johnovo koleno
  je v njegovi kartoteki in v načrtu.« To se zgodi v poglavju »Izvedba in prilagoditve treninga«, ne
  v tem. (Da ime poglavja obljublja pregled zaznamkov, ki ga ni, je že odprto vprašanje za Simona pri
  vodenem ogledu.)

**Težava in vpliv:** trener se nauči, da je ura spremenjena, ko jo vpiše; v resnici ni. Termin, ki ga
misli premakniti, je napačen dan.

**Predlog:** korak 5 naj odpre torek in ga imenuje z datumom; med korakoma 6 in 7 naj bo »Shrani«;
povzetek naj opiše le, kar je poglavje naredilo. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.143 [ ] P2 — Poglavje »Vnesi svoje podatke« povabi k vpisu, vpis pa ogled ustavi; okno imenuje gumb, ki ga ni

**Scenarij in koraki:** prvi zagon, poglavje »Vnesi svoje podatke« (5 korakov). Pri koraku 4 (»Pritisni
Prekliči na dnu obrazca, ali Shrani, če si vpisal svoje podatke.«) v »Moji podatki« spremeniti
telefon v 041 222 333.

**Opaženo:**
- Po vpisu se ogled ustavi: »Ogled čaka. Zadnje dejanje ni bilo korak ogleda. Z »Nazaj v demo«
  nadaljuješ tam, kjer si bil, s »Končaj demo« ga končaš.« Gumba sta »Nazaj v demo« in **»Ustavi
  demo«**; »Končaj demo« ni nikjer. Isto okno ogled pokaže ob vsakem odstopu, torej v vseh poglavjih.
  V angleščini enako (besedilo »End the demo stops it«, gumb »Stop the demo«); v nemščini se ujemata
  (»Demo beenden«). Gumb je bil preimenovan, besedilo, ki ga navaja (`walkthrough_off_track`), ne.
- Korak 1: »Pritisni ☰ … zgoraj desno v temni vrstici.« Pri temi »Dan« je glava bela
  (`rgba(255, 255, 255, 0.96)`).
- Drži: »Shrani moje podatke« shrani telefon in ta ostane tudi po »Zapusti peskovnik«.

**Težava in vpliv:** korak, ki trenerja povabi, naj vpiše svoje podatke, ga ob vpisu ustavi in mu reče,
da tisto ni bil korak. Okno potem imenuje gumb z napisom, ki ga ne najde.

**Predlog:** vpis v polja obrazca v tem koraku naj ogleda ne ustavi; besedilo okna naj imenuje
»Ustavi demo«; korak 1 brez »temni«. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

## 81. [ ] The welcome screen asks for everything once, and the menu has five entries

**Asked 2026-09-26 (Simon):** the welcome screen makes the language, the theme, and the trainer's
first name, last name, phone and email mandatory. The ☰ menu keeps five entries: *Training
sessions* (the home page), *Client directory*, *Exercises and routines*, *Data management* and
*Settings*. *Leave the sandbox* is a top-level row only while the sandbox is open. This replaces
§11.3's plan to fold the menu from 21 rows to 14.

**Ruled the same day (Simon):**

- the details are mandatory on every path, the sandbox and the guided tour included, and they are
  written on the first launch, BEFORE the offer to enter the sandbox appears;
- *Pending review* leaves the menu and stays only as a status message in the notification area;
- the history of all clients leaves the menu; a client's history is shown only on that client's
  page;
- everything asked is built, one feature per commit, recorded here first.

**Not changed by "every path":** a client who opens an invitation link (`?evt=`) on their own phone
is not the trainer, and is never shown the trainer's form.

Order of work: §81.1, §81.2, §81.3, §81.4, then §81.5 and §81.6 once they are no longer blocked.

### 81.1 [x] Language, theme and the trainer's details are mandatory on the welcome screen — done 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#811-x-language-theme-and-the-trainers-details-are-mandatory-on-the-welcome-screen--done-2026-09-26); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 81.2 [x] The menu in five entries — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#812-x-the-menu-in-five-entries--done-2026-09-27); what shipped is in [CHANGELOG.md](CHANGELOG.md). The global History view's removal is §81.7.

### 81.3 [x] Pending review only in the notification area — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#813-x-pending-review-only-in-the-notification-area--done-2026-09-27).

### 81.7 [x] Remove the global History view — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#817-x-remove-the-global-history-view--done-2026-09-27); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 81.4 [x] Import and export of exercises, routines and circuits in one place — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#814-x-import-and-export-of-exercises-routines-and-circuits-in-one-place--done-2026-09-27); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 81.5 [~] Every service credential the app holds can be cleared or revoked — Drive done, iCloud waits

**Built 2026-09-27 (Claude), commit `af6cbaf`; `build check` green 09:29–09:37:** Settings → *Connected accounts* over `data/connectedAccounts.js`, with *Clear from this device* and *Revoke access* for Google Drive, and `revokeAccess` asking Google for a token first so a revoke after a reload reaches Google. **Open:** iCloud, one entry in that list once §3.13 decides to build it.

**Ruled 2026-09-27 (Simon):** *"Shramba vseh api ključev v aplikaciji mora omogočiti, da se
počistijo ali razveljavijo. GDrive in iCloud sta zaenkrat edina."*

**What the app holds, read in the code:** for Google Drive, a short-lived access token in memory only
(`data/googleAuth.js`, about an hour) and a `librept_drive_connected` flag in `localStorage`. No key
is typed by the trainer and none is stored long-term. For iCloud, nothing: there is no iCloud
integration, and §3.13 found that one needs a native Apple app, a Mac and the $99 Apple Developer
Program.

**Gap found while reading:** *Disconnect* (`revokeAccess`) calls Google's revoke only when a token is
in memory. After a reload there is none, so the grant stays at Google while the app says
disconnected. Google's `google.accounts.oauth2.revoke` needs *"a valid access token"* and *"revokes
all of the scopes that the user granted to the app"*
([reference](https://developers.google.com/identity/oauth2/web/reference/js-reference)).

**Build:**

- A Settings row that lists each connected service and what this device holds for it, with two acts:
  **clear from this device** (the flag and the token; other devices keep their access) and **revoke
  at the service** (the grant ends for every device). Named for the trainer, who never typed a key:
  *Connected accounts*, not *API keys*.
- Revoke gets a token first when none is in memory — it runs from a tap, so Google's consent window
  may open — and when that fails it says so and names Google's own page for removing an app's access
  (`myaccount.google.com/linkedapps`, *Remove access*, per
  [Google's help](https://support.google.com/accounts/answer/13533235)).
- One list of services, so iCloud is one entry more if it is ever built. **iCloud itself is not
  built here:** it waits on §3.13's decision.

### 81.6 [x] The backup password is stored, safely — done 2026-09-28

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#816-x-the-backup-password-is-stored-safely--done-2026-09-28); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 83. [ ] §66 gleda samo naprej: stranka, ki pride za besedilom

**Vprašal 2026-09-26 (Simon):** kaj pa, če stranka Novak pride naknadno, ko lokacija »Telovadnica
Novak« že obstaja? Preverjeno isti dan (Claude): **ni v redu niti logika niti GDPR.**

Pravilo §66 ima **eno samo klicno mesto** — `sessionTextNamesNobody` ob oddaji obrazca termina
([editSessionControl.js](src/modules/session/editSessionControl.js)). Nič v aplikaciji ga ne vpraša,
ko se doda ali preimenuje stranka. Obstoječa besedila se nikoli ne preverijo znova.

**Logična napaka: star termin se ne da več shraniti.** Preverba bere trenutno vrednost polja, ne
tega, kar je trener spremenil, in se izvede kot prva v `submit`, pred vsem drugim. Trener odpre
marčevski termin, da ga premakne za pol ure, pritisne *Shrani* in dobi »Kraj ne sme vsebovati imena
stranke, **Novak** pa je ime stranke« na polju, ki se ga ni dotaknil. Termina ne more premakniti,
dokler ne preimenuje kraja, ki s stranko Novak ni imel nikoli nič. Ponavljajoči se termini gredo
skozi isti obrazec, torej velja isto za vso serijo.

**Aplikacija ponuja, kar nato zavrne.** `populateLocationSuggestions` zbira predloge iz
`state.sessions`, zato »Telovadnica Novak« ostane v spustnem seznamu za vedno. Trener jo izbere iz
ponujenega seznama in shranjevanje jo zavrne.

**Tudi GDPR ni v redu, in to je resnejše.** §66 obstaja zato, da nobeno besedilo termina ne imenuje
stranke, ki jo je pozneje treba izbrisati. Ker preverba gleda samo naprej, je obhod običajen
delovni vrstni red: trener napiše »Novak« v ime termina za uvodno vadbo, **preden** je Novak v
imeniku, in ga doda za tem. Besedilo se nikoli več ne preveri in nobeno pometanje ga ne doseže. Ko
je Novak pozneje izbrisan, ta zapis ostane — natanko ostanek, ki naj bi ga §66 preprečil.

**Četrta stvar, ki jo je pokazalo isto vprašanje: pravilo ne pozna naključja.** Priimek je lahko
pravo ime telovadnice. Danes ni nobene poti, da bi trener povedal »to je fitnes, ne stranka«;
zavrnitev je absolutna. Aplikacija tega ne more vedeti sama — ve samo trener.

**Dodaten scenarij prek vmesnika, objavljena `8b2ce80`:** v imeniku je TEST Luka
Kovač z vzdevkom »jutranji · Studio A«. Trener ustvari »SIM Previdna vadba« samo za
drugo stranko, TEST Maja Omejitev, za jutri 10:00–10:45. Lokaciji »Studio test« in
»Studio« sta obe zavrnjeni: »Kraj ne sme vsebovati imena stranke, Studio pa je ime
stranke.« Po zamenjavi lokacije s »Telovadnica B« ista oddaja uspe. Tako že del
vzdevka osebe, ki pri vadbi ne sodeluje, prepreči uporabo običajnega naziva prostora.
Predlog: pri presoji naključnega ujemanja zajeti tudi vzdevke in generične besede
za kraj, ne le priimke; morebitna sprememba pravila ostaja predmet zgornje odločitve.
Sl, 390 × 844, brez novih prestreženih napak; brez pregleda kode.

**Dokaz 2026-09-30, `main` `12d0e66`:** priimek, ki je navadna beseda. Za stranko »SIM Nina Koleno«
je ime treninga »Preizkus koleno« zavrnjeno: »Ime termina ne sme vsebovati imena stranke, koleno pa
je ime stranke.« Pri rehabilitaciji kolena je beseda »koleno« v imenu treninga naravna; enako bi
veljalo za Kos, Zajc, Medved, Vrabec.

**Pokritost:** [clientNameWords.test.mjs](tests/unit_js/domain/clientNameWords.test.mjs) preizkuša
samo čisto funkcijo. Vrstni red »besedilo prej, stranka pozneje« ni pokrit z nobenim testom.

**Predlog, čaka na Simonovo odločitev, ker spreminja obliko §66:** dvoje, ki nista isto.

- **Obrazec zavrne le to, kar trener dodaja.** Primerjaj z shranjeno vrednostjo polja: če je beseda
  tam bila že prej, shranjevanje ne pade. To odpravi nezmožnost urejanja, GDPR luknje pa ne.
- **Dodana ali preimenovana stranka pregleda obstoječe termine** in trenerju pokaže, katera besedila
  jo zdaj imenujejo, da jih popravi ali potrdi kot naključje. To zapre GDPR luknjo in je hkrati
  edini kraj, kjer naključje sploh lahko potrdi. Kot opravilo v obvestilih, ne kot modal — odloča se
  lahko pozneje, ne sredi dodajanja stranke.

Predlogi kraja ne smejo ponujati vrednosti, ki jo bi shranjevanje zavrnilo.

## 82. [ ] Links run one way, out of TODO.md

**Ruled 2026-09-26 (Simon):** a TODO.md write is atomic and holds up nobody; TODO.md holds only soft
links to other files, which nothing checks; no other file may point at a section of TODO.md, because
its content is not stable. Naming the file as the home of open work
stays allowed.

**Measured 2026-09-26** with `git grep` over tracked files, counting `TODO §`, `TODO.md §` and
`TODO.md`: about 1,550 references in about 460 files.

| Directory                          | Files | References |
|------------------------------------|-------|------------|
| `src/`                             | 216   | 677        |
| `tests/`                           | 211   | 411        |
| `agent_tools/`                     | 16    | 68         |
| `docs/`                            | 6     | 171        |
| `use_cases/`                       | 4     | 14         |
| root `.md` files, CHANGELOG.md too | 7     | 205        |

### 82.1 [x] The link check stops scanning TODO.md and its archive — done 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#821-x-the-link-check-stops-scanning-todomd-and-its-archive--done-2026-09-26).

### 82.2 [x] Remove every reference into TODO.md, then make one fail the build — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#822-x-remove-every-reference-into-todomd-then-make-one-fail-the-build--done-2026-09-27).

### 82.3 [ ] Five pointers left in the dev server's own file — blocked on a restart

`deploy/local_http_server.py` keeps five pointers into TODO in its comments, and
`agent_tools/todo_refs.py` exempts it. The test suite refuses to run against a dev server whose copy
of that file differs from the working tree, and the server on :8081 has been running since
2026-09-23; restarting it is Simon's call. **Blocks:** removing the last exemption. When the server
is next restarted, remove the pointers and the exemption in one change.

## 84. [x] A session with no participants stops the boot — test data, not a defect — closed 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#84-x-a-session-with-no-participants-stops-the-boot--test-data-not-a-defect--closed-2026-09-27).

## 85. [x] BUG — the rendered landing page showed a developer comment as text — fixed 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#85-x-bug--the-rendered-landing-page-showed-a-developer-comment-as-text--fixed-2026-09-27).

## 86. [Brainstorm] Kaj trener potrebuje za posel in česa aplikacija ne dela

Nastalo 2026-09-27 iz istega dela kot §80: 84 ciklov raziskovalnega preizkušanja objavljene
aplikacije (`0625bd6`), plus branje seznama poti (`routeTable.js`) in podatkovnega modela. §80 gleda,
ali kar aplikacija dela, dela prav. Ta razdelek gleda drugo vprašanje: **kaj mora trener opraviti,
da posel teče, in česa aplikacija ne prevzame.**

**Kaj je izmerjeno in kaj ne.** Izmerjeno je, kaj aplikacija ima: v `src/` ni nobene kode za denar,
račune, cene ali plačila (iskano po `invoice`, `payment`, `price`, `€`, `plačil`), ni zapisa o
prisotnosti (`cancelled` obstaja samo kot »ta torek odpade«, ne kot »stranka ni prišla«) in ni
nobenega seštevanja čez zapise. **Ocene vrednosti niso izmerjene.** Sestavljene so iz mehanike
opravila (koliko minut vzame, kolikokrat na mesec) pod predpostavkami spodaj. Številke, ki jih Simon
pozna iz prakse — cena ure, delež neprihodov, koliko strank plača z zamudo — naj popravi; ocene so
napisane tako, da se popravijo z eno številko.

**Predpostavke za vse ocene:** slovenski samostojni trener, 20 rednih strank, približno 90 vadb na
mesec (4–5 na dan), večina ena na ena in dve manjši skupini, brez recepcije, cena ure 25 €.

### 86.1 Pridobivanje strank

| Opravilo                                   | Kaj aplikacija dela danes                                          | Kje je že prevzeto | Ocena vrednosti, če to prevzame program |
| :----------------------------------------- | :----------------------------------------------------------------- | :----------------- | :-------------------------------------- |
| Biti najden (splet, Instagram, Google)     | nič                                                                 | —                  | zunaj aplikacije; tu se ne splača      |
| Sprejem podatkov nove stranke              | **dela**: stran `/intake`, stranka izpolni na svojem telefonu       | §26, izdelano      | prihranjenih ~10 min na stranko         |
| Sled od prvega stika do prve vadbe         | nič — stranka je v imeniku ali je ni                                | nikjer             | ~1 h/mesec, večja pa je izgubljena stranka, ki se je pozabila |
| Brezplačna uvodna vadba in njen izid       | nič                                                                 | nikjer             | majhna; to je opomnik, ne program       |

### 86.2 Denar

| Opravilo                                        | Kaj aplikacija dela danes | Kje je že prevzeto        | Ocena vrednosti |
| :---------------------------------------------- | :------------------------ | :------------------------ | :-------------- |
| Cenik in paketi (npr. karta za 10 vadb)         | nič                       | nikjer                    | ~0,7 h/mesec vodenja evidence; večja je izguba: ena nezaračunana vadba na deset strank na mesec je 50 € |
| Stanje na paketu (koliko vadb je še ostalo)     | nič                       | nikjer                    | isto kot zgoraj; brez tega šteje stranka sama, trener pa ji verjame |
| Izdaja računa                                   | nič                       | **ProPT** (§68)           | ~1,7 h/mesec (20 računov po 5 min) |
| Davčno potrjevanje računov za gotovino          | nič                       | ni razčiščeno niti v §68  | zakonska obveznost, ne udobje; brez nje gotovina ni legalna |
| Opomniki za neplačano                           | nič                       | nikjer                    | ~0,5 h/mesec, denar pa pride prej |
| Pregled prihodka po mesecu, stranki in uri      | nič                       | nikjer                    | ~0,5 h/mesec ročnega seštevanja; brez tega trener ne ve, katera stranka se izplača |

Dan 07 (2026-09-30): paket stranke (6 od 10) in plačilo z gotovino je trener zapisal v »Opombe«;
ocena 0, 15 minut na dan zunaj aplikacije (trenerjeva ocena).

### 86.3 Termini

| Opravilo                                     | Kaj aplikacija dela danes                                             | Kje je že prevzeto | Ocena vrednosti |
| :------------------------------------------- | :-------------------------------------------------------------------- | :----------------- | :-------------- |
| Dogovor za termin                            | trener vpiše sam; vabilo vpraša samo »prideš / ne prideš«             | ProPT (samopostrežna rezervacija) | ~3 h/mesec (90 vadb × 2 min pisanja sporočil) |
| Opomnik dan prej                             | nič                                                                    | nikjer             | ~1,5 h/mesec; in en neprihod manj na mesec je 25 € |
| Odpoved in pravilo o pozni odpovedi          | odpoved večera obstaja, zapisa o tem, kdo je odpovedal in kdaj, ni     | nikjer             | brez zapisa je pravilo neizvedljivo; 1–2 pozni odpovedi na mesec sta 25–50 € |
| Čakalna vrsta za polno skupino               | zasedenost je vidna, vrste ni                                          | nikjer             | majhna pri 20 strankah, večja pri skupinah |
| Uskladitev z lastnim koledarjem              | izvoz vabila v koledar (datoteka), sinhronizacija urnika prek oblaka   | delno izdelano     | ~0,5 h/mesec |

**Dodaten scenarij iz objavljene `0625bd6`:** pri pretekli »Individualni vadbi« za
TEST Ano Novak trener izbere »Začni trening« in v oknu »Trening se je začel izven
urnika« pritisne »Ni se zgodila«. Termin izgine s plošče, program pa se pojavi med
nedodeljenimi programi z imenom »Individualna vadba · TEST Ana Novak«. Oznaka gumba
ne pojasni te posledice. To potrjuje razliko med odstranitvijo termina z ohranjenim
načrtom in evidenco odpovedi; slednje ta pot ne pokaže. Predlog za obstoječi gumb:
pojasniti odstranitev termina in ohranitev načrta. Preizkušeno samo v vmesniku,
390 × 844, sl, brez prestreženih napak in brez pregleda kode.

**Dopolnitev iz objavljene `8b2ce80` (2026-09-30), skupinski trening:** pri skupini treh strank je
»Ni se zgodila« edina bližnjica, in velja za cel trening. Za eno stranko, ki ni prišla, ponuja podloga
samo »Odstrani s tega treninga: <ime>« v obrazcu, brez vprašanja. S tem se sprosti mesto in o
odsotnosti ne ostane nič — trening drugih dveh pa mora normalno teči. Zapis prisotnosti po strankah je
torej pogoj tudi za skupine, ne le za individualne termine.

Dan 07 (2026-09-30): vikend tabor za 15 udeležencev v treh skupinah. Termin z več strankami je
mogoč; najvišjega števila mest, čakalne vrste, skupin znotraj termina in predplačila ni. Vpis treh
udeležencev je trajal 8 minut, trener ocenjuje 20 minut za vseh 15 na papirju.

### 86.4 Izvedba in stranka

| Opravilo                                  | Kaj aplikacija dela danes                                   | Kje je že prevzeto | Ocena vrednosti |
| :---------------------------------------- | :---------------------------------------------------------- | :----------------- | :-------------- |
| Načrt vadbe in beležka med vadbo          | **dela; to je jedro aplikacije**                             | izdelano           | to je razlog, da aplikacija obstaja |
| Zapis prisotnosti (prišla / ni prišla)    | nič — trening je zaključen ali ne                            | nikjer             | pogoj za vse zgoraj: obračun paketa, pozne odpovedi, opomnike |
| Meritve in napredek skozi čas             | teža stranke je polje; zgodovine meritev ni                  | §78, odprto        | ~1,1 h/mesec poročil, večja pa je zadržana stranka |
| Poročilo stranki o napredku               | nič                                                          | nikjer             | ista postavka kot meritve |

Dan 07 (2026-09-30): obseg stegna, telesna teža in čas na 400 m nimajo mesta; ocena 0, 5 minut na dan
zunaj aplikacije (trenerjeva ocena).
| Domača naloga med vadbama                 | nič                                                          | nikjer             | majhna, dokler ni meritev |

### 86.5 Zadrževanje strank in vodenje posla

| Opravilo                                        | Kaj aplikacija dela danes | Kje je že prevzeto | Ocena vrednosti |
| :---------------------------------------------- | :------------------------ | :----------------- | :-------------- |
| Opozorilo na stranko, ki je ni bilo tri tedne   | nič                       | nikjer             | ena vrnjena stranka na mesec je 100 € (štiri vadbe) |
| Zbiranje mnenj in priporočil                    | nič                       | nikjer             | posredna; vpliva na pridobivanje |
| Izkoriščenost (koliko ur od razpoložljivih)     | nič                       | nikjer             | ~0,5 h/mesec; odloča o ceni in urniku |
| Varnostna kopija in selitev na nov telefon      | **dela**: izvoz, uvoz, oblak | izdelano        | izdelano |
| Več trenerjev, več telovadnic                   | nič                       | **EnterprisePT**   | zunaj te aplikacije |
| Privolitve in pravice strank po GDPR            | **dela**: privolitev z datumom, izvoz, izbris | §27, izdelano | izdelano (napake v podrobnostih so v §80.30, §80.42, §80.43) |

### 86.6 Seštevek in kaj iz tega sledi

Pod predpostavkami zgoraj aplikacija danes pokriva **izvedbo vadbe in podatke o strankah**, ne pa
**denarja, prisotnosti in stika s stranko med vadbama**. Seštevek nepokritega je približno **8 do 10
ur pisarniškega dela na mesec** in **100 do 200 € na mesec, ki odtečejo** (nezaračunane vadbe, pozne
odpovedi, neprihodi, stranke, ki tiho odidejo). Za trenerja, ki dela 90 ur na mesec, je to desetina
delovnega časa in približno ena delovna ura tedensko, ki jo ne zaračuna nikomur.

**Tri stvari, ki niso prevzete nikjer in so največ vredne:**

1. **Zapis prisotnosti.** Sam po sebi je majhen (prišla / ni prišla / pozno odpovedala), brez njega pa
   ni ne obračuna paketa, ne pravila o pozni odpovedi, ne opozorila o stranki, ki je ni. Vse tri
   postavke zgoraj stojijo na njem. Aplikacija ima že vse, kar za to potrebuje: trening, udeležence in
   zaključek.
2. **Paket in stanje na njem.** Ne zahteva ne strežnika ne plačila v aplikaciji — samo števec ob
   stranki in odštevanje ob zaključeni vadbi. Zaračunavanje ostane v ProPT, evidenca pa ne rabi biti
   tam.
3. **Opomnik dan prej.** Brez strežnika ga ni mogoče poslati samodejno, mogoče pa je narediti
   »pripravljeno sporočilo za jutrišnje stranke« — en zaslon, ki trenerju pripravi besedila, in on
   jih pošlje. To je ista rešitev, ki jo aplikacija že uporablja za vabila.

**Kaj tu namenoma ne sodi.** Izdaja računov in samopostrežna rezervacija sta že prevzeti v ProPT
(§68), zato tu nista predlagani. Davčno potrjevanje računov ni prevzeto nikjer in ni tehnično
vprašanje — če ProPT izdaja račune za gotovino, brez tega ne sme.

**Odprto vprašanje za Simona:** ali sta prisotnost in paket še »brezplačna aplikacija« ali sta že
ProPT. Moja presoja: prisotnost sodi v brezplačno (brez nje je zapis o vadbi nepopoln), paket pa je
mejni primer, ker je prvi korak k denarju. Odločitev je tvoja; napisana naj bo v §68, ne tukaj.

**Dokazi iz izpeljanih dni (§88).** Dan 01 (trenerka v Mariboru, štiri lokacije, 14 strank):
paketi in odštevanje kartic 5 min na dan v Excelu, plačila 3 min, račun podjetju 10 min (§86.2);
odpoved in neprihod je mogoče le izbrisati, zato ju beleži drugje (§86.3, §86.4); opomniki in
sporočila 8 min na dan prek WhatsAppa (§86.3); meritve in napredek v zvezku (§86.4); domača naloga
brez potrditve (§86.4).
Dan 02 (trener pol v studiu, pol online, šest individualnih treningov): meritev ob prvem obisku
ni kam vpisati, 2 min na stranko v zvezek (§86.4); paket osmih treningov po prvem obisku vodi ločeno
(§86.2).
Dan 03 (trenerka ob drugi službi, najeta dvorana v Celju, devet strank): domača naloga gre v isto
polje kot zdravstvene opombe, zato se tedenska navodila mešajo s trajnimi (§86.4).
Dan 04 (trener, zaposlen v fitnes klubu, dva kolega, 11 strank): paket desetih treningov v paru vodi
v ločeni tabeli, 5–10 min na dan (§86.2).
Dan 05 (samostojna trenerka v Ljubljani, 11 strank): na kartici treninga je videla »• Nedoločen« in
iskala, kje ga spremeni v »prišla« ali »ni prišla«. Beseda pomeni, da trening nima izbrane rutine
(§80.55); prisotnosti ni kam zapisati (§86.4).
Dan 06 (samostojni trener v Ljubljani, tuji naročniki, pogodba s podjetjem): mesečni pavšal podjetju
obračuna v Excelu, 15 min na mesec (§86.2); čakalno vrsto vodi v opombi in naslednjega povabi sam
(§86.3); mesečni pregled meritev v ločeni preglednici, 8 min na stranko na mesec (§86.4).

## 87. [ ] Prihodnja shema ne nosi polja glasovne opombe

**Naročilo (Simon, 2026-09-27):** prihajajoča shema naj bo brez polj glasovne opombe.

**Popravek dejstva, preden se to izvede:** shema 5 ni prihajajoča, ampak **živa** —
[recordSchemas.js](src/data/recordSchemas.js) ima `STABLE_SCHEMA = 5` in `DEFAULT_READ_SCHEMA = 5`,
varnostne kopije se pišejo pri 5 in vsak nameščen telefon bere 5. Prihajajoča oblika je
`SCHEMA_PREVIEW`, ki je namenoma brez številke: nastane iz SCHEME_5 in doda, kar še čaka na
številko. Naročilo torej zadene `SCHEMA_PREVIEW` in vsako številko, ki iz nje nastane.

**Kje polje sploh je:** `hasVoiceNote` je eno samo polje, deklarirano v `SCHEMA_4.planUpdates`;
SCHEMA_5 in SCHEMA_PREVIEW ga podedujeta, ker sta zgrajeni z razširitvijo prejšnje. Drugih polj
glasovne opombe ni — posnetek se ni nikoli nikamor zapisal, ker snemanja ni bilo (§80.35).

**Kaj se naredi:** `SCHEMA_PREVIEW` naj `planUpdates` izpiše na novo, brez `hasVoiceNote`, namesto
da ga podeduje. Številki 4 in 5 ostaneta nedotaknjeni: §60 prepoveduje spreminjanje oblike
oštevilčene sheme brez nove številke, zapisi na telefonih pa polje nosijo.

**Posledica, ki jo je treba povedati naravnost.** Na namestitvi, ki bere PREVIEW (CI in predogledi),
star zapis s `hasVoiceNote: true` v tej shrambi izgubi zastavico. `isPlainQuickSignal`
([quickSignals.js](src/domain/quickSignals.js)) tak vnos od tam naprej šteje za gol dotik, ki ga
ponoven pritisk sme odstraniti. **To je prav in ni izguba podatkov:** zastavica je trdila, da vnos
nosi posnetek, posnetka pa ni bilo nikoli. Vnos, ki nima ne besedila ne posnetka, res ni nosil
ničesar, kar bi bilo vredno varovati. Varnostne kopije se pišejo pri 5, zato izvoz trenerja tega ne
občuti.

**Preverjanje:** preizkus sheme naj zahteva, da `SCHEMA_PREVIEW.planUpdates` nima `hasVoiceNote`,
in da ga `SCHEMA_4` in `SCHEMA_5` še imata. Merila `tests/fixtures/schemas/schema_4.json` in
`schema_5.json` ostaneta, kakršni sta.

**Izvedba:** `src/` in `tests/` v tem trenutku drži seja `claude-opus-exploratory-fixes`; sprememba
je predana njej, skupaj z zgornjim.

**Ustavljeno 2026-09-27, čaka na Simona — sprememba krši dve pravili, ki podreta gradnjo.**
Poskusno izvedena in umaknjena, nič ni v commitu:
- **»Shema se samo širi«** ([starWriteInvariants.test.mjs](tests/unit_js/data/starWriteInvariants.test.mjs),
  »schema evolution is additive never drops a field«): polje, ki ga deklarira SCHEMA_4, mora ostati v
  vsaki novejši živi obliki, PREVIEW vključno. Razlog, zapisan v preizkusu: starejša gradnja, ki je
  še na telefonu, polje še piše, in izginotje bi jo potiho zlomilo. Tu to drži dobesedno — gradnja
  pred `ff15fff` piše `hasVoiceNote` v vsako živo shrambo, PREVIEW vključno.
- **»PREVIEW je nadmnožica stabilne oblike«** ([backupFile.test.mjs](tests/unit_js/data/backupFile.test.mjs)):
  vsako polje sheme 5 mora biti v PREVIEW, da ponovna izgradnja PREVIEW iz 5 ne izgubi stabilnega polja.

**Odločitev, ki jo to zahteva:** ali se uvede postopek za **umik** polja (zadnja faza »expand /
contract«): kdaj je polje sme izginiti iz PREVIEW in iz naslednje številke — na primer šele, ko
nobena gradnja, ki ga piše, ni več v obtoku —, in katero od obeh pravil se za to omili. Do takrat
`hasVoiceNote` ostane v vseh oblikah; **nič ga ne piše več** (`ff15fff`) in nič ga ne izriše.

**Moja napaka, da se ne ponovi:** §87 sem napisal kot lokalen poseg v eno datoteko, ne da bi
pogledal, kaj shemo varuje. Pravili sta obe smiselni in obe podreta gradnjo; zahteva je zato
pravilo, ne urejanje. Preveril sem ju sam v obeh preizkusih, preden to zapišem.

**Predlog za odločitev (Claude), da ima Simon kaj potrditi ali zavrniti:** umik polja naj postane
zapisano dejanje, ne izjema v preizkusu. Konkretno: seznam umaknjenih polj ob shemah — ime
zbirke, ime polja, datum in razlog — in obe pravili ga upoštevata. Nenamerni izpust polja tako še
naprej podre gradnjo, načrten umik pa je mogoč in je viden v isti datoteki kot sheme. Polje se na
ta seznam sme uvrstiti šele, ko gradnja, ki ga je nehala pisati, teče v objavljeni različici dovolj
dolgo, da je predpomnjena starejša gradnja s telefonov izginila — pri aplikaciji, ki se namesti,
to ni dan ali dva. `hasVoiceNote` je prvi kandidat in dober preizkus tega postopka, ker ga danes
ne bere nič razen pravila o golem dotiku.

## 88. [~] Dan trenerja: vrzeli, ki jih pokaže izpeljan delovni dan

Odprto 2026-09-27. Način 2 raziskovalnega preizkusa (veščina `exploratory-test`): podagent brez
konteksta si kot osebni trener zamisli svoj delovni dan — treninge, stranke in vaje, pa tudi podporne
naloge, pakete, plačila, sporočila — in ga nato poskusi izpeljati z LibrePT na `main`. Dnevi in
poročila so v `.private/exploratory-test/days/`, seznam odigranih dni v
`.private/exploratory-test/scenarios.md`.

**Razmerje do §86:** §86 je namizna ocena iz kode in predpostavk. Tukaj je vsaka vrzel izpričana z
enim konkretnim dnem. Vrzel, ki jo §86 že ima, dobi tam vrstico dokaza, ne novega razdelka; tukaj je
samo, česar ni nikjer drugje, in presoja, ali se avtomatizacija izplača.

### 88.1 [x] Iskanje v katalogu brez zadetka se konča, uvoz večjega kataloga pa obstaja — narejeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#881-x-iskanje-v-katalogu-brez-zadetka-se-konča-uvoz-večjega-kataloga-pa-obstaja--narejeno-2026-09-30);
what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 88.2 [ ] Šest novih strank za skupinski trening je šest celih obrazcev

Dan 01: prva jutranja skupina, šest strank, ki jih aplikacija še ne pozna. Vsaka je odprla cel obrazec
za stranko; 9 minut namesto 4 v koledarju. Od §80.18 obrazec ponudi dodajanje s pravkar vpisanim imenom,
še vedno pa vsaka stranka odpre celoten obrazec. **Vrednost:** enkratna pri vsaki novi skupini, a prav
na prvi dan, ko se odloča, ali trener aplikacijo obdrži (ocena trenerke, ne meritev). **Cena:** majhna —
dodajanje samo z imenom, ostali podatki pozneje. Paziti na privolitev po GDPR, ki ob vpisu nastane.
**Presoja: čaka na Simona** — ali stranka sme nastati brez privolitve, je njegova odločitev (§27).

Prvo odprtje 2026-09-30: trener skupine 60+ (deset ljudi) je po treh vpisanih strankah ocenil »vsaj 4
dotiki na osebo« in dodal, da med vadbo nima gumba »vsi opravili vajo«.

### 88.3 [ ] Nadomestni trener dobi načrt po WhatsAppu

Dan 01: ko jo nadomesti kolegica, ji načrt pošlje kot sporočilo. **Vrednost:** redka (dopust,
bolezen). **Cena:** srednja, če naj ga kolegica odpre v svoji aplikaciji; majhna, če je dovolj besedilo
načrta za deljenje. Več trenerjev na enem računu je EnterprisePT. **Presoja (dan 01): ne izplača se** —
pogostost je nizka.

Dan 03 isto pokaže z druge strani: trenerka isti večer prevzame stranko bolnega kolega. Dogovor in
sporočilo po treningu gresta po SMS-u, pojasnilo o nadomeščanju pa v polje za zdravstvene opombe. Dva
od treh dni imata nadomeščanje, zato je pogostost višja, kot je predvidevala prva presoja. **Nova
presoja: izplača se majhen del** — besedilo načrta in zapisa treninga za deljenje (»Deli kot besedilo«),
brez drugega trenerja v aplikaciji; več trenerjev ostaja EnterprisePT. Dan 04, trener v klubu s kolegoma: nadomeščanje
prek sporočila ali tabele kluba, tretji dan od štirih.

Dan 09 (2026-09-30): fizioterapevtka stranke želi videti program, ki ga trener daje. Edini izvoz pri
stranki je šifriran izvoz po GDPR; ocena 0, 3 minute v aplikaciji in 4 zunaj nje (trenerjeva ocena).
Isti »Deli kot besedilo« bi pokril tudi to.

### 88.4 [ ] Trening, vpisan za nazaj, aplikacija imenuje »Zamuja«

Dan 02: trener je jutranje treninge vpisoval popoldne, ker jih je vodil brez telefona v roki.
Plošča jih je kazala kot »Zamuja 8 h«, načrt pa se je ob osvežitvi izgubil (to je napaka §80.53).
Poti »to se je zgodilo, zapiši« ni: trening je treba začeti in zaključiti, s časi, ki niso pravi.
**Vrednost:** vsak trener, ki kdaj vodi trening brez telefona, in to je pogosto (ocena trenerja).
**Cena:** majhna do srednja — pri minulem, nezačetem treningu ponuditi »Zabeleži kot opravljen« z
izbranim časom, namesto odštevanja zamude. **Presoja: izplača se**, najprej popravek §80.53.

### 88.5 [ ] Naslednji teden se sestavi trening za treningom

Dan 03: za prihodnji teden je trenerka vsak trening ustvarila posebej (ime, kraj, datum, čas, stranka,
vaje). Ni pogleda na teden in ne kopije treninga na drug datum; »Ponovi vsak teden« pomaga le, ko je
vsebina vsak teden enaka, »Kopiraj ta načrt na …« pa kopira načrt k drugemu udeležencu, ne na drug dan.
Ocena trenerke: 10–15 min na teden več kot na papirju. **Vrednost:** vsak teden, pri vsakem trenerju, čigar
programi napredujejo. **Cena:** majhna do srednja — »Kopiraj trening na datum«, z načrti udeležencev.
**Presoja: izplača se.**

### 88.6 [ ] Okno za vabila se odpre po vsakem shranjenem treningu

Dan 03: ob sestavljanju petih treningov zapored se je po vsakem odprlo okno »Pošlji vabila« in ga je
bilo treba zapreti, preden je lahko dodala vaje. **Vrednost:** majhna, a ob vsakem načrtovanju tedna.
**Cena:** majhna. **Presoja: čaka na Simona** — samodejno odpiranje je bila odločitev (vabilo takoj po
dodanem udeležencu); vprašanje je, ali ob načrtovanju vnaprej zadošča obvestilo »vabila niso poslana«.
Prvo odprtje 2026-09-30: oba trenerja brez predznanja sta okno zapisala kot zmedo (»Nisem prosil za
vabila; okno je skočilo vmes«), drugi tudi, ko stranka ni imela e-pošte in je bil »Pošlji vabilo«
zbledel.

### 88.7 [ ] Polje za poškodbe nosi vse, kar trener ve o stranki

Dan 03 je vanj pisal domačo nalogo, dan 04 »stranka pripelje hčerko, potrebuje varovan kotiček«.
Polje se imenuje »Predhodne poškodbe in opombe« in je edino prosto polje o stranki poleg ciljev. Trener
tedensko navodilo ali dogovor o otroku zapiše med zdravstvene podatke, in ob naslednjem branju ne loči
trajnega od začasnega. **Vrednost:** dva od štirih dni; zdravstveni podatki so tudi občutljivi po GDPR,
zato je mešanje z logistiko slabo še iz drugega razloga. **Cena:** majhna — ločeno polje »Druge
opombe« (ali »Dogovori«), prikazano v urejevalniku načrta tako kot poškodbe. **Presoja: izplača se.**

**Stanje 2026-09-29:** narejeno v `d273a74` kot del §80.69 — obrazec stranke ima ločeni polji
»Poškodbe in omejitve« in »Opombe«; urejevalnik načrta pokaže oboje, poškodbo prvo. Obstoječe
zapiske strank ostanejo v »Opombah«, zato jih trener, ki želi opozorilo, prenese v novo polje sam.

Dan 08 (2026-09-30): nova stranka mora pred vadbo prinesti zdravniško potrdilo. Trenerka ga je
lahko zapisala le v »Opombe«, brez datuma veljavnosti in brez opomnika, ko poteče; ocena 1.

### 88.8 [ ] Prehransko svetovanje nima mesta

Dan 05: trenerka nekaterim strankam svetuje tudi prehrano (teža, cilj kalorij, jedilnik za teden) in
to vodi v ločenem zvezku, po njeni oceni eno uro na teden za tri do štiri stranke. **Vrednost:** samo pri
trenerjih, ki prehrano svetujejo. **Cena:** velika, če naj aplikacija vodi jedilnike; prehransko
svetovanje je tudi ločena stroka z lastnimi pravili. **Presoja: ne izplača se.** Kar od tega zares
potrebuje prostor, pokrijeta ločeno polje za opombe (§88.7) in meritve skozi čas (§86.4, §78).

### 88.9 [ ] Stranka, ki je podjetje, in lokacija z njegovim imenom

Dan 06: trener ima pogodbo s podjetjem (osem zaposlenih, mesečni pavšal) in vadi pri njih. Podjetje je
vpisal kot stranko, lokacija pa je naravno kar ime podjetja — in aplikacija jo zavrne: »Kraj ne sme
vsebovati imena stranke, Northlight pa je ime stranke.« Pravilo je bilo narejeno za zasebnost
posameznikov (ime stranke ne sme v naslov ali kraj, ki ga vidijo drugi). **Vrednost:** vsak trener s
pogodbo za podjetje, vsak tak termin. **Cena:** majhna, a zahteva pojem »stranka je skupina ali
podjetje«, ki ga danes ni (ni števila ljudi, ni ločenega obračuna). **Presoja: čaka na Simona** — ali
podjetje sodi med stranke z izjemo pri pravilu o imenu, ali pa je to lokacija oziroma skupina.

### 88.10 [ ] Izposoja opreme strankam

Dan 06: trener strankam posoja opremo za domačo vadbo (15 € na mesec) in to vodi v opombah; ob treh
strankah se boji, da pozabi pobrati najemnino. **Vrednost:** redka dejavnost ob treningu. **Cena:**
srednja, in je denar, ki ga aplikacija sploh ne vodi (§86.2). **Presoja: ne izplača se.**

**Opomba k dnevu 06:** podagent je poročal, da se vrednosti druge vaje zapišejo na prvo. Ni potrjeno:
v vmesniku vpis v drugo vrstico spremeni samo drugo vrstico. Orodje za brskalnik piše z `fill` v prvi
zadetek razreda, polja vaj pa nimajo lastnega id-ja; orodje ima zdaj ukaz `type`, navodilo pa opozorilo.

### 88.11 Seštevek po šestih dneh (2026-09-27)

Šest dni, šest različnih trenerjev, 15:20–17:20. Aplikacija je vsak dan nosila vnos strank, termine in
sestavljanje načrta, pogosto hitreje od papirja; opozorilo o prekrivanju, drža pri izometričnih vajah,
ločena programa v paru in delo brez signala so bili pohvaljeni. **Kar je vsak dan ostalo zunaj:**
denar (paketi, plačila, računi) v petih dneh od šestih, meritve v štirih, nadomeščanje v treh,
prisotnost in odpovedi v dveh (§86 in §88.3).

**Izplača se, po vrstnem redu:**
1. Popravki napak, ki so jih dnevi našli: §80.52 in §80.53 (izgubljen načrt), nato §80.54, §80.55.
2. Paket in zapis prisotnosti (§86.6, točki 2 in 1) — paket ima največ dokazov, prisotnost je pogoj
   zanj; odločitev »brezplačno ali ProPT« čaka na Simona (§86.6).
3. Majhne stvari z veliko dokazi: prazno iskanje v katalogu naj vodi naprej (§88.1), ločeno polje za
   opombe (§88.7), kopija treninga na drug datum (§88.5), vpis za nazaj (§88.4), deljenje načrta kot
   besedilo (§88.3).

**Čaka na Simona:** §88.2 (stranka brez privolitve), §88.6 (okno za vabila), §88.9 (podjetje kot stranka).
**Ne izplača se:** §88.8 (prehrana), §88.10 (izposoja opreme).

**O postopku:** vsak dan je izpeljal tri do šest treningov v eni uri; dnevi, ki so poskusili zajeti
vse, niso prišli do konca. Dve poročili »napak« sta bili omejitvi orodja za brskalnik, ne aplikacije
(kliki po besedilu v zaprtih oknih, `fill` v prvi zadetek); oboje je v orodju popravljeno.

### 88.12 [ ] Trener zboli: vsak termin se prestavi posebej, obvestilo dobijo le povabljeni

Dan 07 (2026-09-30, `main` `e8e90d8`; samostojni trener v Kranju, 12 strank, ki jih vodi v Excelu):
zjutraj bolan, šest terminov današnjega in jutrišnjega dne prestavi drugam. Za vsak termin »Uredi«,
datum, čas, »Shrani«; opozorilo o prekrivanju in ponudba, da povabljenim pošlje nov čas, sta
pohvaljena. **14 minut v aplikaciji proti 10 na papirju, in še 10 minut ročnih sporočil**, ker
obvestilo dobijo le stranke, ki so vabilo že prejele (minute so trenerjeve ocene). Zapisa »odpadlo
zaradi bolezni« ni, trening pa na plošči kaže »Zamuja«.
**Vrednost:** nekajkrat na leto (predpostavka: 3–5 dni bolezni) po okoli 25 minut, torej ~2 h na
leto; večja je zaupanje strank, ki za odpoved izvedo pravočasno. **Cena:** srednja: izbira več
terminov, »prestavi za N dni« ali »odpovej ta dan«, eno besedilo za vse prizadete. Sporočilo brez
strežnika je lahko pripravljeno besedilo za SMS ali e-pošto. **Presoja: čaka na Simona**, ker je del
iste odločitve kot zapis odpovedi (§86.3, »Odpoved in pravilo o pozni odpovedi«): brez zapisa
odpovedi je prestavljanje le premik ure.

### 88.13 [ ] Selitev iz preglednice: stranke in programi se vpišejo na roke

Dan 07: sedem strank iz Excela je vpisal ročno, vsako v 1–2 minutah (ime, telefon, e-pošta, cilj,
poškodba); **14 minut v aplikaciji proti 10 v preglednici**. Programi: 10 minut, ker se ponovitve
niso vedno prijele (glej spodaj) in ker katalog nima vaj, kot so potisk nog na napravi, kettlebell
zamah in dvig medenice. Za 12 strank je selitev okoli 20 minut, enkrat. Uvoz programa obstaja, a
zahteva obliko JSON in izgubi številke (§80.113).
**Vrednost:** enkratna, a prav na dan, ko trener odloča, ali aplikacijo obdrži (kot §88.2). **Cena:**
majhna za stranke (CSV s stolpci ime, telefon, e-pošta, cilj, poškodba); srednja za programe.
**Presoja: čaka na Simona**: uvožena stranka nima privolitve, kar je isto vprašanje kot v §88.2.

Ob dnevu 07 prijavljeno in ne zapisano kot napaka: v »Ustvari rutino« vpis ponovitev v pravkar dodano
vajo ne ostane (8 postane 10). V brskalniku orodja se to zgodi le pri polju s seznamom predlogov
(`list="reps-presets"`); brez njega vnos deluje. **Preveriti na pravem telefonu**, ker gre lahko za
posebnost brskalnika brez zaslona.

### 88.14 [ ] Nov telefon: obnovitev iz kopije je šele za uvodom, ki sprašuje, kar je v kopiji

Dan 08 (2026-09-30, `main` `e8e90d8`; trenerka, ki ji je stari telefon razpadel): prvi zagon na
novem telefonu ponudi pogoje, izbiro teme, štiri obvezne osebne podatke, nato »Razišči z vzorčnimi
podatki«, vodeni ogled in »Začni s prazno aplikacijo«. Obnovitve iz kopije ni; ta je v ☰ →
»Upravljanje podatkov« → »Uvozi varnostno kopijo«, do katerega trenerka pride šele po uvodu. Kopije
sama ni mogla preskusiti (§80.136); napačno datoteko je aplikacija pravilno zavrnila: »Ta datoteka ni
varnostna kopija LibrePT. Na tej napravi se ni nič spremenilo.«
**Vrednost:** redka (predpostavka: enkrat na dve leti na trenerja), a prav takrat odloči, ali trener
aplikaciji še zaupa; uvod pri tem stane okoli minute in vodi v napačno smer (»Začni s prazno
aplikacijo«). **Cena:** majhna: na prvem zaslonu »Obnovi iz varnostne kopije« pred uvodom.
**Presoja: čaka na Simona**, ker spremeni uvod, o katerem je odločil v §81 (podatki obvezni na vsaki
poti); kopija te podatke že nosi.

### 88.15 [ ] Serija se ne da ustaviti za dopust stranke ne spremeniti od nekega dne naprej

Dan 09 (2026-09-30, `main` `e2daf5e`; samostojni trener v Novem mestu, 14 strank): stranka gre za dva
tedna na dopust, njeni sredini termini naj izpadejo in se nato nadaljujejo. Premora ali preskoka
večerov ni; poskus s koncem serije je naletel na §80.138. **6 minut v aplikaciji, 1 na papirju, ocena
0.** Isti dan: od novembra so vsi torki uro pozneje. Uspelo je le kot dva koraka na stranko (stara
serija do 27. 10., nova od 3. 11.): **8 minut proti 4**, ocena 1 (minute so trenerjeve ocene).
**Vrednost:** dopusti strank so pogosti (predpostavka: vsaka redna stranka dva- do trikrat na leto),
sprememba urnika telovadnice nekajkrat na leto; brez tega trener serijo ali briše ali pušča napačne
termine, ki jih vabila pošljejo naprej. **Cena:** srednja: »izpusti večere od–do« in »spremeni od tega
dne naprej« pri seriji. **Presoja: izplača se**, ko je §80.138 popravljena, ker gre za isti zapis serije;
obseg (kaj se zgodi z vabili, ki so že poslana) čaka na Simona.

## 89. [~] Pregled 2026-09-28: isti podatek na več mestih

Iskano po vrednotah »en vir resnice«, »preprostost« in »napake ne more narediti«. Dobesednih
kopij kode je malo: iskanje enakih blokov šestih vrstic v `src/` je našlo le spodnje. Dobiček je
v podatkih in seznamih, ki jih ljudje ročno prepisujejo na drugo mesto. Po dobičku padajoče.

### 89.1 [x] Seznam datotek za delo brez povezave je ročna kopija `integrity.json` — odločeno 2026-09-29: ostane

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#891-x-seznam-datotek-za-delo-brez-povezave-je-ročna-kopija-integrityjson--odločeno-2026-09-29-ostane); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 89.2 [ ] `docs/SRC_MODULES.md` (128 KB) prepisuje glave modulov
Opis vsake datoteke ponovi razlog iz njene glave, npr. `data/workspace.js` in
`data/sandboxStaleness.js` (dvanajst ur, tri ure). 232 od 236 JS datotek glavo ima. Pravilo zahteva,
da nov ali premaknjen modul popravi katalog v isti spremembi, zato ima vsak razlog dve mesti.
**Predlog:** katalog ustvari orodje iz prve vrstice glave in plasti iz `agent_tools/import_layers.py`;
ročno ostane le uvod. Nato se spremeni tudi pravilo o posodabljanju kataloga.
**Izmerjeno 2026-09-29, pred delom:** pri 48 od 286 vrstic kataloga je v glavi datoteke manj kot 30 %
besed iz vrstice; `data/stateStore.js` glave sploh nima. Te razlage bi ustvarjen katalog izgubil.
**Naslednji korak**, samostojen: razlage teh vrstic prenesti v glave, šele nato katalog ustvarjati.
**Stanje 2026-09-30:** prvi korak narejen (`a87e0e8`): 21 glav modulov nosi, kar je pisalo le v
katalogu; vrstic pod 30 % je bilo po istem merjenju 31, zdaj 11 (ustvarjene strani, vendorirana
datoteka, mape — nimajo glave). Ena vrstica kataloga je bila napačna in je popravljena. **Odprto:**
orodje, ki katalog ustvari, in sprememba pravila o ročnem posodabljanju kataloga; pravilo spremeni
Simon.

### 89.3 [x] Pet pravil o usklajevanju sej opisuje, kar `build check` že izsili — uveljavljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#893-x-pet-pravil-o-usklajevanju-sej-opisuje-kar-build-check-že-izsili--uveljavljeno-2026-09-29); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 89.4 [x] Tema je zapisana na šestih mestih, ena kopija je že zastarela — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#894-x-tema-je-zapisana-na-šestih-mestih-ena-kopija-je-že-zastarela--popravljeno-2026-09-29); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 89.5 [x] Seznam zbirk ročno, čeprav obstaja izpeljan — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#895-x-seznam-zbirk-ročno-čeprav-obstaja-izpeljan--popravljeno-2026-09-29); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 89.6 Kar se ne izplača
Nadaljnje delitve velikih datotek (§24.5, §24.7) le, če kaj postane preizkusljivo ali skupno — §24
je to že ugotovil. Razdelitev slovarjev po funkcijah (§14.5) ne odpravi nobene kopije.

## 90. [ ] Extending this app into ProPT: the scenarios, the approaches, and the seam

**Asked by Simon 2026-09-28**, in two parts: list the scenarios ProPT adds, and find the
architectural approaches for extending this app into it. The design belongs here rather than in
`~/Projects/EnterprisePT`, because that is what its `TODO.md` §16.3 concluded on 2026-09-25 — *"the
seam is designed there, not here"* — and it names itself as what blocks `PROPT_IMPLEMENTATION.md` §8
step 2, since an invoice needs somewhere to live before it needs anything else.

Read at the source before writing this: that project's `README.md`, `AGENT_RULES.md`,
`PROPT_IMPLEMENTATION.md` §2 and §9, and its `TODO.md` §15.1, §15.4 and §16. The scenarios below are
its list, not a new one; what is added here is what each one demands of THIS repository.

### 90.1 [ ] The contradiction that decides everything else

Two documents there disagree, and neither says so:

- `PROPT_IMPLEMENTATION.md` §2: the trainer who pays **"installs a different app from a different
  address"**.
- `TODO.md` §16.3 recommends the overlay because then **"the trainer has one app"**.

**A different address is a different origin, and a different origin has an empty IndexedDB.** The paid
build would start with no clients, no sessions and no history. Buying ProPT would mean carrying the
database across by hand, and since 2026-09-28 that also means typing the backup password (§18.8).
Nobody wrote that down, and it is the first thing a paying customer would meet.

**Why the addresses cannot simply be the same.** The lock is physical: a separate build, because a
licence check inside an MIT app can be deleted (§68.1). Physical enforcement needs the build not to be
publicly downloadable, which needs an access-controlled host, which is a different origin. **The
separation is forced by the lock, not chosen.** Anyone arguing for one origin has to propose a
different lock first.

**Recommended: separate origins, and the data crosses by a channel that already exists.**

- **Google Drive.** `appDataFolder` is scoped to the OAuth grant rather than to the origin
  ([driveAppData.js](src/data/driveAppData.js) says so), so a ProPT build shipping this app's own
  client id would see the same snapshot: install, connect Drive, type the backup password, sync.
  **Not verified at Google's documentation** — that is this repository's own comment, and it must be
  read at the source before anything depends on it.
- **The backup file**, for a trainer who never connected Drive: export on the old address, import on
  the new one, one password. Already built, and now the upgrade path as well.

This is the same question as §16.6. It is one decision, not two, and it decides both.

### 90.2 [ ] The scenarios ProPT adds, and what each one demands here

From `TODO.md` §15.1 there, in its order. The right-hand column is the new part: what each scenario
needs from THIS app, which is what makes the approaches in §90.3 comparable at all.

| Scenario | What it needs here |
| :--- | :--- |
| **The month-end invoice run** — every client, the sessions actually held, the price of each, one action that produces every invoice with its QR code | Reads sessions, which exist. Writes invoices — **storage this app does not have**. A screen and a menu entry. Its own QR encoder, already a parameter |
| **Session packages and the balance left** — bought ten, used seven, three left, and **the client must see it too** | Storage. Reads sessions. A document the phone shares — no server, no client account |
| **Who owes, and for how long** — invoices sent and unpaid, oldest first, a reminder carrying the same QR | Reads its own storage. A screen. The phone's own share, not a transport here |
| **A cancellation that costs, and one that does not** — the trainer's rule, applied when a session is cancelled | Reads sessions, which already carry when the cancellation happened. **Needs no hook** — see §90.5 |
| **A different price per client and per kind of session** | Storage, attached to a client |
| **The client's monthly summary** | Reads records that exist. No new storage |
| **The year in one file, for the accountant** | An export that carries its storage |
| **Self-service booking, and every Google Calendar integration** (§11 and §19 there) | The whole calendar integration moves OUT of this app (§68.3). The overlay needs network and screens, and it writes this app's own sessions |

**Three of them are the product**: the invoice run, packages, and who owes (§15.4 there). They are one
loop — the work is recorded, the invoice follows from it, the money is chased from the invoice — and
each replaces a notebook. **All three need exactly one thing this app cannot do: store a record whose
shape it does not declare.** Everything else on the list is screens and reading.

### 90.3 [ ] Four approaches, and what each costs

`TODO.md` §16.3 there compares three. A fourth is missing, and it is the one that changes the answer.

| Approach | How it composes | What it costs |
| :--- | :--- | :--- |
| **1. Fork** | Copy the repository, edit freely | A merge conflict on every release of this app, for ever. Rejected there, and still rejected |
| **2. A separate app reading an export** | Two apps, a monthly import | Fails the invoice run: a month-end screen that needs re-importing a diary is the work the trainer already does. Invoices land outside this app's backup and sync |
| **3. This app provides an empty function for ProPT to fill** | This app adds `registerExtensions()`, which does nothing here, and `appBoot.js` calls it at start-up. The paid build replaces that one file | One function in the free app whose only purpose is elsewhere. Against value 4 — the simplest thing that does the job, no layer without a concrete problem — but it is honest and testable, because the contract is named |
| **4. The paid build provides its own starting file** | `index.html` is the first file a browser loads, and it names the JavaScript file that starts the app. The paid build GENERATES its own `index.html` from this one, substituting that single line | **Recommended.** Nothing is added to this app for the paid product, and generating rather than copying means every later change here — a new tag, a tightened `Content-Security-Policy` — reaches the paid build on its next rebuild |

**Why 4 beats 3.** When the paid build replaces one of this app's files with its own copy, that copy
stops receiving later changes to it — silently, with no error and no merge conflict. So which files it
may replace is decided by how often each one changes, not by preference:

- `index.html` changes almost never, but when it does the change is often security-relevant (the
  `Content-Security-Policy` lives there). So the paid build **generates** its copy from this one,
  substituting the one line that names the starting script — a static copy would silently keep an old
  policy.
- `app.js` / `appBoot.js` change with every feature — **never replaced**; the paid build runs them.
- `routeTable.js` gains a line per screen and `applicationHeader.js` one per menu entry — **neither**:
  replacing either would fall behind within weeks, so this app gains a list they can register into.
- `cacheManifest.js`, the list of files kept for offline use, changes with every module — **generated
  rather than maintained by hand** (§90.4).
- `recordSchemas.js`, what the database stores, is this app's core — never touched; the one new
  collection is declared here (§90.6).

**And that registration list is not new machinery.** This app already registers its own shells through
`registerShellRender` in [renderRegistry.js](src/modules/common/renderRegistry.js), which exists
because hand-ordering render calls failed silently. Routes and menu entries getting the same treatment
is **this app's existing pattern used twice more**, by its own routes and its own menu — so it is not
code added for a paid tier, and **§68's first bullet stands unchanged.** That bullet already allows the
overlay to *"register itself into existing registries"*.

**A correction, 2026-09-28, and it is worth more than the paragraph it corrects.** An earlier version
of this section argued that approach 3 is blocked because §68 forbids *"no paid features, no dead code
for them"*, and that Simon would have to change that rule. **He never wrote that sentence.** It is
`PROPT_IMPLEMENTATION.md` §2 in the other project, written by an agent on 2026-09-24, and §68 here does
not contain it. So approach 3 is not blocked by any ruling, and the case for 4 has to stand on this
app's own values instead: value 4, the simplest thing that does the job with no layer added without a
concrete problem. It does stand — but it is a preference, not a prohibition, and Simon may pick 3.

**The same reading applies to §68 itself.** It introduces its two bullets as *"two of its findings bind
THIS repository"* — an agent declaring that a proposal in another project binds this one. Whether those
two bullets are Simon's decisions or an agent's summary is worth settling, because this section and
§90.7 both lean on them.

**Is copying the source smart? Asked by Simon 2026-09-28.** It is cheap HERE, for a reason that is a
property of this app rather than a general truth: **there is no bundler.** `python -m build` is
`copytree` of `src/`, a version stamp, one `<base href>` rewrite and the integrity catalog. So the paid
build is the same operation this app already performs, with one folder laid on top. If this app ever
gained a bundler, this answer would have to be asked again.

What makes a copy bad is not the copying, it is losing track of WHICH copy. So it is pinned to a
commit — `PROPT_IMPLEMENTATION.md` §9 already says "a pinned checkout", and a git submodule is simply
the mechanism that makes that pin real instead of remembered. **On each new pin the paid build runs its
own gate**, and the only things that can break are the files it replaced and any registration point
that changed shape; everything else it imports moves with this app.

**The real cost is operational, not technical, and a paid product has to state it**: a fix made here
reaches a paying trainer only when the paid build is rebuilt and redeployed. How fast that happens for
a security fix is a promise ProPT makes, and it belongs in that project rather than in this section.
**And the MIT notice travels with the copy** — the combined build ships this app's code.

**Two alternatives, rejected with the reason:**

- **Publish this app as an npm package.** There is no `package.json`, no `node_modules` and no bundler
  here on purpose, and adding a build system for the benefit of a paid product is what §68's first
  bullet is about — *"nothing here changes shape for it"*.
- **Load this app's modules at run time from the free site.** It breaks offline use, breaks the
  `script-src 'self'` policy in [index.html](src/index.html), breaks the integrity catalog, ties the
  paid product to the free site staying up, and tells the free site's host which trainers are paying.

**"Is this a plugin system with a custom loader?" Asked by Simon 2026-09-28: no, and it must not
become one.** There is no loader: the browser loads one `index.html`, and static `import` statements do
the rest, as they do today. Nothing is discovered and nothing is fetched at run time. What ProPT is, is
**one product built once from two source trees that have the same owner** — a build variant, or a
private fork regenerated on each new pin rather than maintained by hand.

The distinction is not vocabulary. A plugin system means a published interface that outside code
depends on, which brings versioning, deprecation and backwards compatibility — **a permanent cost
carried by the free app for one paid consumer.** As a build variant, this app owes ProPT nothing: it
changes whatever it likes, and ProPT's next build either works or ProPT fixes it. The cost falls on the
side that benefits. Run-time loading would also break offline use, the `script-src 'self'` policy and
the integrity catalog, which §90.3 already rejects for the same reason.

**A caveat written here on 2026-09-28 was wrong, and Simon corrected it the same day.** It said the two
registration lists become an API the day a third party builds on them. **They do not.** Somebody else's
dependence creates no duty on this side: the licence gives no warranty, this project publishes no
interface and has never promised backwards compatibility. A fork that leans on internal structure keeps
up by re-reading the code.

What a fork's dependence creates is pressure to keep something stable, and the answer to pressure is a
sentence, not a design constraint. [CONTRIBUTING.md](CONTRIBUTING.md) §4 now carries it: *"Nothing here
is a public API."* So the lists are judged only on whether this app needs them — a hand-maintained route
table and hand-written menu markup have exactly the defect `registerShellRender` was introduced to
remove — and ProPT gets no promise either. It re-pins and fixes itself, like any other fork.

### 90.4 [ ] The precache list becomes generated, and that pays for itself here

A ProPT file missing from [cacheManifest.js](src/sw/cacheManifest.js) is not precached, and the app
fails in the gym basement — the one place it exists for. The answer is not a seam but a **generator**,
the way `src/privacy.html`, the icon subset and the glyph baseline are already generated here: a tool
writes the list, the gate fails when it is stale, and the overlay runs the same tool over its own tree.

**It is worth having with or without a paid tier.** A hand-written list is a rule a person must
remember, and [tests/unit/test_project_layout.py](tests/unit/test_project_layout.py) exists because
remembering it failed. Generating it makes the mistake impossible instead of forbidden.

### 90.5 [ ] Money is computed at invoice time, so no event hook is needed

The cancellation rule looks like it needs a hook: *apply the rule when a session is cancelled*. **It
does not, and building it that way would be worse.**

A side effect at cancellation time writes down a decision that cannot afterwards be re-derived — change
the rule, or fix a wrong cancellation time, and last month's charge is a number nobody can explain.
Computing it **at invoice time**, from the session records this app already keeps, makes every charge
re-computable from the records and auditable against the rule that was in force. The screen that shows
*"cancelled at 07:10, less than 24 hours, this session is used up"* is then a read, not a write.

**So the overlay never reacts to anything in this app.** No event bus, no hooks, no listeners for a
paid tier. That is the single biggest reason this app stays clean under approach 4.

### 90.6 [ ] Storage: one collection this app carries and never reads

The invoice must ride in the backup, the Drive sync and the export, or the one record the law requires
to be kept is the least protected record on the phone. And this app must not interpret it.

**One collection, declared in a numbered schema**, with a fixed envelope and an opaque body:

| Field           | Meaning                                                                          |
| :-------------- | :------------------------------------------------------------------------------- |
| `id`            | UUIDv7, as every record here                                                      |
| `kind`          | namespaced, owned by the overlay — `propt.invoice`, `propt.package`               |
| `ownerClientId` | which client it concerns, or null, so erasure and the Art. 15 export can find it  |
| `sealedAt`      | once set, the write layer REFUSES any further change to that record               |
| `keptUntil`     | an ISO date before which erasure must not touch it                                |
| `payload`       | opaque JSON: stored, projected, backed up, synced and exported, never read        |

**Two properties this app does not have, and both are right on their own merits:**

1. **Sealed records.** ZDDV-1 article 86(3) requires that a stored invoice cannot be changed or
   deleted. The star-write layer has no notion of a record that refuses an update.
2. **Kept by law, and SAID so.** [clientErasure.js](src/data/clientErasure.js) irreversibly anonymises
   every identifying field of a client; run over an invoice it would destroy a record the law requires
   to be kept. GDPR article 17(3)(b) exempts exactly that. So erasure must skip records whose
   `keptUntil` has not passed **and report what it kept and why** — a person asking to be forgotten
   has to be told what remains. **That is a gap here today, with or without a paid tier.**

**A decision that keeps new personal data out of the free app.** A UPN order needs the payer's street
and city (`PROPT_IMPLEMENTATION.md` §3.1), and that project assumed this app's client record gains an
address. **It should not.** The address belongs in the overlay's own record, reached through
`ownerClientId`, so this app gains no category of personal data it has no use for, and neither its
consent wording nor [PRIVACY.md](PRIVACY.md) changes for a feature it does not have.

**The cost, named rather than discovered**: a collection the backup carries must be in a NUMBERED
schema, so this is a schema bump with a real record change behind it — unlike §18.8's container change,
which deliberately avoided one.

### 90.7 [ ] What is deliberately NOT built here

- **No licence check, no token, no server address.** The lock lives in the paid build alone (§68.1). A
  check here would be both removable and dishonest.
- **No transport seam.** Closed there 2026-09-25: an invoice leaves as a file the phone made.
- **No sync-target seam.** [syncMerge.js](src/data/syncMerge.js) is already pure and takes no view on
  where a snapshot came from; a hosted tier calls it with its own wire. This line exists so nobody
  adds one.
- **Nothing for the multi-trainer tier.** One trainer per install is a decision here
  ([trainerIdentity.js](src/modules/common/trainerIdentity.js): *"Not a profile, and deliberately not
  one"*). A client belonging to two trainers is a different data model, not an overlay on this one.

### 90.8 [ ] What Simon decides, and what is already answered

**Answered by this design, needing no ruling:** how the overlay loads (it owns the entry), how it
appears (the registry pattern this app already uses), how it stays offline (a generated list), and
whether §68 has to change (**no** under approach 4, which adds nothing here for a paid tier).

**His to decide:**

1. **Whether §68's two bullets are his decisions at all.** They are introduced there as findings of
   another project's proposal that *"bind THIS repository"* — written by an agent, not ruled by him.
   Until that is settled, this section treats them as the best available reasoning rather than as
   rules, and approach 3 stays open to him.
2. **The origin fork of §16.6**, which §90.1 answers but cannot close.
3. **Whether the collection is declared now or when the first invoice is built.** Declaring is cheap;
   the schema bump is the cost, and it buys nothing until something writes to it.
4. **Whether erasure's "kept by law" behaviour is built now on its own merits**, ahead of any paid
   tier. It is a correctness gap in this app today.

**Blocks**: `PROPT_IMPLEMENTATION.md` §8 step 2 there. **Blocked on**: nothing here — decisions 3 and 4
set the order, not the design.

## 91. [ ] The pipeline is slower than it needs to be — measured 2026-09-30

Last green CI run (36063598211): 20 min. Stage 3 alone is 12 min: e2e 675s, demo 472s. Local
`build check`: 9–10½ min, Stage 3 is 387–454s and the demo suite is the slowest task in it.

1. **[~] CI runs e2e and demo on ONE browser worker each — fixed in `64936fa`, not yet measured in
   CI.** `demo_worker_count` and `e2e_worker_count` in `build/__init__.py` split one budget (half
   the cores) between the two tasks, because locally they share one machine and one dev server. In
   CI each has its own 4-core runner, so the budget is 2 and the split gave 1 + 1. The regression
   suite (Stage 4) took e2e's share too. Now a task called with no argument takes the whole budget,
   and only Stage 3 of `build check` splits it. Expected: CI Stage 3 from ~12 to ~6 min. Next step:
   read the Stage 3 job times of the first CI run after the push, then close this item.
2. **[x] Locally the demo task finished 80–150s after e2e — fixed in `e2f0d21`.** Not the worker
   share: four demo workers of eight were tried and gave demo 400s, e2e 323s (the finding is in the
   comment at `DEMO_WORKER_SHARE`). `--durations` showed seven walks of the whole story in
   `tests/e2e/test_demo_story.py` taking 736s together, because the walk waited 8s on every card
   that has no Show me. Now 391s. In the gate the demo task took 331s (before: 370–400s).
3. **[ ] Low priority: every browser job installs Chromium with `--with-deps` again** (34–75s per
   job, four jobs in a row on the critical path). Caching `~/.cache/ms-playwright` saves the
   download, not the system packages, so the gain is unknown and likely under a minute. Measure one
   job with the cache before deciding.
4. **[ ] Low priority: the Stage 4 CI job spends ~48s on setup for ~15s of tests.** Merging it into
   another job would save that, but Stage 4 is its own stage by Simon's ruling (2026-09-19), so
   this changes only if that ruling does.
5. **[x] The story walk waited where nothing would happen — shipped 2026-09-30 (Simon: "implement
   the best solution").** `e164826`: the walk ends at once on step n of n instead of waiting 6s,
   and the chapter walk is one test per chapter (six of 9–11s instead of one of 99s). `fbddd8a`: the
   tests open the story in the sandbox, as every link the app offers does — they used
   `?init=demo_data_load`, which seeds the working data, and there Show me on the welcome card
   failed and hid its own message before the old 8s wait ended — and the walk waits for the guide's
   own signal after Show me instead of 8s. Walks of the whole story: 83–86s in the morning, 20–21s
   now. The demo task in the gate: 370–400s in the morning, 287s now, of which the longest single
   test is `test_every_tap_show_me_performs_is_drawn_by_the_hand_first` (150–185s, added the same
   day; librept-02 plans to split it per chapter).
7. **[ ] Gap: no test walks the story at full motion.** Every story walk runs with reduced motion,
   where `demoPace` makes every pause zero; `test_demo_pacing.py` times one step at full motion. A
   defect that only shows while the hand travels (the app re-rendering under it) is found by
   nobody. One full-motion walk costs ~2.5 min of worker time (~3s × 48 steps), which is why it is
   not in the gate. Decide whether it runs, and where (the gate, or a scheduled workflow like
   `google-canary.yml`).
6. **[x] The demo task was the longest in local Stage 3 — no longer, 2026-09-30.** After item 5's
   two parts, the gate had demo 248s and e2e 313s, so e2e now sets the stage's length.

## 92. [ ] The peek gesture becomes an L, the deck holds one session, and the demo shows a drag

Ruled by Simon 2026-09-30, after a red-team reading of the three proposals. All three are to be
built. What the gesture is today: `modules/clipboard/planPeek.js` pulls the live plan aside on a
sideways drag (the "blanket"), and a RELEASE past 70 % of the screen width
(`COMMIT_PCT`) opens the plan it uncovered. So reading the previous session properly and leaving
the current one are the same movement, and the widest look (`MAX_PULL_PCT`, 85 %) can only be taken
from inside the state where letting go navigates.

**Simon's three rulings, verbatim in substance:**

1. Sideways uncovers; only a second, upward stroke opens ("obrnjena črka L"). The same, mirrored,
   for the next session.
2. Focus means *the previous session replaces the current session's cards on the screen* — what
   releasing does today.
3. For the peek, the past session is aligned so that the exercise with the same name sits level
   with the exercise now in focus, when there is one. This is Simon's answer to the objection
   below, and a better one than the answer proposed: it needs no second rendering of last time's
   numbers.

**The objection it answers.** Taking the previous session out of the vertical deck costs the
trainer "what did they lift last time", which is the number read most often on the gym floor and is
one scroll away today. Aligning the peeked sheet puts it beside the current exercise instead, so
the vertical axis can be emptied without that loss.

**A defect the removal also fixes, read from the code and not measured:** the past cards carry no
`data-plan-index`, so when the trainer scrolls up into them `cardAt` in
`modules/clipboard/deckScrollFocus.js` matches no card and returns the first one. Looking back
therefore moves the active exercise to the first of the session.

**Correction to the proposal:** there is nothing "future" in the deck to remove. `isFutureSession`
(`modules/clipboard/exerciseDeckOfCards.js`) only marks the cards of the open session when that
session is a later day. Only the past block leaves.

### 92.1 [x] The L: sideways looks, up opens — shipped 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md). Commit `97e3226`; `build check` green 12:31 to
12:40.

### 92.2 [x] The deck holds one session, and the peek is aligned to the exercise in focus — shipped 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md). Commit `53a3fed`; `build check` green 16:13 to
16:22.

### 92.5 [ ] The walkthrough's forward switch does nothing — in the DEMO, not in the app

**Corrected 2026-09-30, the same day it was written.** This was first recorded as a product defect:
"stepping forward out of a session the peek opened does nothing". That claim was wrong and it was
told to Simon before it was checked against real input. librept-02 could not reproduce it and wrote
an e2e test that drives a real mouse: the forward gesture opens the next session, twice in a row,
from a session the gesture itself had opened. The app is fine.

**What was actually measured, and still stands.** Inside the guided demo (`?demo=tour`), the forward
L did nothing three times over, while on the SAME screen the mirrored backward L opened the session
before. The uncovered layer held a real next plan, so the gesture was armed. That asymmetry is real
and unexplained.

**Why the two disagree.** Every drag in the demo is a SYNTHETIC pointer sequence built in
JavaScript by `performDrag` in `modules/demo/demoTourPlayer.js` — not the browser's own input. A
synthetic pointer is not a real one: `setPointerCapture` refuses an id the browser never issued,
`elementFromPoint` returns nothing past the screen edge, and nothing coalesces the moves. One of
those differences is the cause, and it belongs to the demo's drag act rather than to the clipboard.

**One thing seen along the way that may be an app defect, and is NOT established.** The same
starting session gave two different previous neighbours: mine landed on the series row `ss081326`,
librept-02's on the history record `h010f2e3` (2026-07-20). If the peek's neighbours depend on how
the trainer arrived at a session, that is the clipboard's defect and a real one — the sideways deck
would mean different things on two routes to the same screen (librept-02's point, 2026-09-30). But
our runs differed in more than the route: the demo tour carries its own clock and its own navigation,
and the seeded sessions are generated relative to "now". Establish it before believing it — open one
session from the board and the same session by its `/session/:id/client/:id` address under one clock,
and compare what the past layer holds. Written down as a question because the last thing recorded
here as a defect was not one.

**Which is why the walkthrough ships the look and the switch back, but not the switch forward** —
Simon asked for all three. Next step, in `demoTourPlayer.js` and not in `planPeek.js`: find which of
those differences bites, by sending the same path through Playwright's real mouse in a test and then
through `performDrag`, and comparing what `planPeek.js` sees. The lesson is already paid for —
a measurement taken through the demo's own machinery measures the demo too, and saying "the app does
not do this" needs the app, not a script driving it.

### 92.6 [ ] Leaving a session by the peek throws away what was logged in it

**Found 2026-09-30, the same way.** The walkthrough logged Too Easy on the first participant, then
pulled aside to the previous session and came back with Today. The signal was gone — the control
no longer showed it set, so a trainer would tap it again and a second tap CLEARS it.

The guard that exists (`canOpen` in `controllers/planPeekController.js`) refuses to leave a session
that has been STARTED, to protect a running session's logs. A session that has not been started but
already carries feedback is not protected at all, although the trainer typed into it just as much.
On the gym floor the plan is open and being marked up long before anyone taps Start.

Two ways out, and the choice is Simon's: widen the guard to any session carrying logs or feedback,
or keep what was logged when the clipboard is replaced. The second is the better product and the
larger change.

For now the walkthrough works around it by placing the gesture BEFORE anything is logged, which is
also the better story — you check what they did last time, then you work — but it is a workaround
and this is why.

### 92.4 [ ] A bound group's last sessions are now shown nowhere — Simon's call

**Found by the gate on 2026-09-30, while §92.2 was being written**, and not foreseen when it was
planned. `tests/medium/test_participant_binding.py` asserted two promises in one test, and §92.2
takes one of them away.

Clients bound to ONE plan share one tab. Before, the deck listed every member's last session, each
under that client's name — a rule that came from a real defect: the clipboard showed only the tapped
client's, unnamed, so a trainer could read one person's history while coaching another. The injury
half of that rule still holds and is still tested. The last-session half is gone: the deck no longer
carries past sessions at all, and the sideways peek shows the previous session of the ACTIVE client
only, because that is what `clientSessionNeighbours.js` answers — one client's own history.

So for a bound group of three, the trainer can now reach one member's previous session and not the
other two's. Nothing on the screen says the other two exist.

**The question, which is Simon's and not an implementation detail:** when several clients share one
plan, should the peek show each member's previous session — one sheet per member, or the tapped
client's with the others named — or is one client's history the right answer and the group case
simply does not need it? The answer decides whether `clientSessionNeighbours.js` stays a
one-client function.

Until it is answered the gap stands, recorded here rather than in a test that cannot run. The test's
docstring says the same thing at the place a reader will meet it.

### 92.3 [x] The demo shows a press, a hold and a drag at once — shipped 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md). Commit `78c7bb6`; `build check` green 17:46 to
17:55.

## 93. [ ] The exploratory-test skill is Claude's alone, and the agent that needed it could not see it

Ruled by Simon 2026-09-30: **the skill must be shared by every agent.** It lives in
`.claude/skills/exploratory-test/`, and `.claude/` is in `.gitignore` — so Codex and Gemini cannot
see it, cannot run it, and cannot read what it already knows.

**What that cost, today, measured.** A headless Chromium ran from 09:16 to 12:47, holding about 95 %
of one core for three and a half hours, and blocked every `build check` on this machine until
`ed041fd` changed how the gate measures load. It was not this skill's browser: port 9223, profile
`/tmp/librept-trainer-cdp-profile`, launched by a Codex session started 2026-09-29 23:45 (its own
rollout log names both). Its parent was `systemd --user`, so nothing owned it and nothing would ever
have stopped it. The skill it could not see already solves exactly this: `explore.py` touches a
heartbeat on every command and a detached watchdog closes the browser after 15 minutes without one,
with a comment recording the same failure happening once before.

**Two separate defects, then.** The skill is in the wrong place, and a browser held by a living
session is recorded nowhere, so nobody arriving later can tell a browser that still has a keeper
from one that does not.

### 93.1 [x] Move the skill where every agent reads — done 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md).

### 93.2 [x] A live browser says who holds it, and until when — done 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md).

## 94. [ ] Manj korakov v trenerjevih opravilih — štetje 2026-09-30

**Naročil Simon 2026-09-30:** preštej dotike in črke pri trenerjevih opravilih, oceni čas in poišči,
kje se da korake skrajšati. Opravila so iz pričakovanj dveh trenerjev brez predznanja, ki sta pred
prvim odprtjem zapisala, kaj hočeta opraviti v prvi uri. Štel sem po najkrajši poti, ki jo trener
pozna po prvi uri, na `main` `12d0e66`, 390 × 844, sl, prazna aplikacija. Potek po korakih je v
`.private/exploratory-test/first-open/2026-09-30-stetje-korakov.md` (ni v gitu).

**Čas je ocena, ne meritev:** dotik 1,5 s, črka 0,4 s, vsako novo okno ali zaslon 2 s branja.

| opravilo                                        | dotiki | črke | okna | ocena |
| :---------------------------------------------- | -----: | ---: | ---: | ----: |
| T0 prvi zagon do prazne aplikacije              |     10 |   40 |    5 |  41 s |
| T1 nova stranka: ime, telefon, poškodba         |      7 |   51 |    3 |  37 s |
| T2 trening jutri 18:00–19:00 za stranko         |      9 |   16 |    2 |  24 s |
| T3 načrt: 3 vaje iz kataloga s težo             |     17 |   17 |    4 |  40 s |
| T4 izvedba in zaključek                         |      5 |    0 |    2 |  12 s |
| T5 isti načrt kot rutina (»Ustvari rutino«)     |     15 |   30 |    3 |  41 s |
| T6 skupina treh novih strank                    |     15 |   42 |    5 |  49 s |
| T7 »Pretežko« in razrešitev po treningu         |      6 |    0 |    3 |  15 s |
| T8 tedenska serija z rutino                     |     12 |   24 |    3 |  34 s |

**Kaj številke skrijejo.** T4 je kratek, ker ničesar ne zapiše: vaje, narejene po načrtu, ni s čim
označiti (§80.6), ročno sestavljen načrt pa po zaključku izgine (§80.52). Zato T5 ni »shrani«, ampak
ponoven vnos istih treh vaj: T3 in T5 skupaj stane 81 s za en program. T6 doda za vsako nadaljnjo
stranko 3 dotike, okoli 11 črk in eno okno (≈ 11 s); skupina desetih je okoli dve minuti. T7 velja le,
če trener stran osveži (§80.131).

**Priložnosti, od največjega prihranka.** Vsaka spremeni izdelek, zato **čakajo na Simona**.

1. **En dotik »opravljeno po načrtu« na kartici vaje**, ali ob zaključku »Vse je bilo po načrtu«.
   Ne skrajša T4, ampak ga naredi uporabnega: brez tega trening ne pusti zgodovine (§80.6).
2. **»Shrani kot rutino« v meniju ⋮ podloge**, iz načrta, ki je na zaslonu. T5 s 15 dotikov in 30
   črk na okoli 3 dotike in ime (≈ 10 s namesto 41 s), in nobenega ponovnega vnosa tež.
3. **Izbirnik kataloga ostane odprt za več vaj**, kot že v »Ustvari rutino«, in nova vaja se odpre
   sama. T3 s 17 na 11 dotikov (≈ −9 s); iskanje se po izbiri izprazni.
4. **Eno vprašanje ob zaključku namesto dveh** (»še 26h 49m« in »Ni zabeleženih zaključenih serij«):
   −1 dotik, −1 okno pri vsakem treningu, zaključenem pred koncem ure.
5. **Okno »Pošlji vabila v koledar« ne po vsakem »Shrani«** (§88.6): −1 dotik, −1 okno pri vsakem
   treningu (≈ 3,5 s, 15 % T2).
6. **Nova stranka samo z imenom, brez okna** (§88.2): pri skupini −1 dotik in −1 okno na osebo.
7. **Fokus v prvem polju, ko se obrazec odpre** (»Dodaj novo stranko« ima fokus na ✕): −1 dotik,
   tipkovnica se odpre sama.
8. **Ob »Začni trening« odprta prva vaja** (§80.129): −1 dotik na trening.
9. **Polja urejevalnika načrta ob dotiku označijo vsebino**, kot polje za uro: sprememba »10« v »8«
   brez dveh izbrisov.
10. **Datum:** sprejeti »6.10.2026« (§80.127) in pri »DO (NEOBVEZNO)« ponuditi konec glede na začetek
    (»+4 tedne«, »+8 tednov«) namesto »danes«, »jutri«, »pet. 2.«, ki za konec serije ne pomagajo.
11. **Prvi zagon:** tema bi lahko bila privzeta (Dan) in izbira v Nastavitvah: −2 dotika, −1 okno.
    Obvezni podatki so Simonov sklep v §81, zato jih ta točka ne spreminja.

Že dobro: dotik na uro označi vsebino in »1800«, »9.30«, »17.45« se preberejo pravilno; konec ure se
premakne sam; »Ponovi vsak teden« sam izbere dan; predlog pri »Pretežko« je izračunan iz načrta (12 →
9.5 kg); iskanje strank ponudi »Dodaj »ime« kot novo stranko« in ime prenese v obrazec.
