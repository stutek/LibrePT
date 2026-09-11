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
| **Launch prerequisites** | — | Nothing left | §23.5 shipped 2026-08-22; what remains of a launch is §23.1's own decision |
| **Data safety remainder** | §18.8, §18.9, §18.12 | Encrypt the backups, not the live DB | Nothing; decided on paper and parked |
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
| **Program import** | §29 | Nothing — shape decided 2026-08-18, and the editor-as-review answers the fragility question | The parser and its frozen corpus; the intake flow, media-type rule and catalog crosswalk already exist |
| **Trainer feedback 2026-09-11** | §45.1–§45.13 | §45.1's untranslatable first screen, then §45.2's trainer identity | Nothing for the three defects; §45.4 waits on a reproduction, §45.8 on looking at both screens together |

---

## 1. Scheduling & Sessions

### 1.1 [x] PT-side client assignment to a session

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#11-x-pt-side-client-assignment-to-a-session); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 1.2 [ ] Simultaneous sessions merged into one clipboard: multi-line titles + per-participant tags
Overlapping same-day sessions **already merge** into one clipboard (`getOverlappingSessions` /
`launchClipboardDirectly`). What is missing is the visual separation of who belongs to which
programme. Relates to [uc1_gym_floor_clipboard.md](use_cases/uc1_gym_floor_clipboard.md).

- **The data gap**: `buildSessionMeta` already carries a deduplicated `titles`/`ids` list, but the
  merge loop builds a flat `clientId → routineId` map with no record of the source session. Needs a
  parallel `clientId → sourceSessionId` threaded into `clientRoutines`.
- **Decided — where the tag shows**: stacked title lines in the session title bar
  (`components/sessionTitleBar.js`), *not* the participant tabs (already tight on space). Each line
  gets a subtle colour dot repeated next to the matching participant tab, so the pairing is
  glanceable without reading. `renderSessionTitle()` shows only `titles[0]` today, so this is new UI.
- **Decided — de-duplication**: identical titles collapse to one line, not repeated ones.

### 1.3 [ ] Session list must model partial overlaps and other PTs' room usage
- **Partial overlaps** (10:00–11:00 vs 10:30–11:30) must both render, showing the overlap rather than
  stacking as if sequential. Render it the way calendar apps do: a vertical time grid, blocks whose
  top/height map to start/end, overlapping blocks side by side in columns.
- **Other PTs' bookings for the same room** render read-only and shaded — occupancy only, not
  launchable, no participant detail.
- Implies a **room/resource** dimension the data model lacks. Source decided in §1.5: a per-room
  Google resource calendar read via `freebusy.query`, not a backend of our own. **The read half is
  built** — [src/data/calendarFreeBusy.js](src/data/calendarFreeBusy.js) batches every room into one
  request and is exercised against the real endpoint by the canary. What remains here is the room
  dimension in the data model, and the renderer.
- **An unreadable room must never draw as free.** Google reports a calendar it could not read inside
  an HTTP 200, per-calendar, so the shape that ignores it turns "we don't know" into "available" —
  and on a gym floor that is a trainer booking a room someone else is already in. `queryFreeBusy`
  therefore returns `unreadable` alongside `busyByCalendar`, and the renderer owes that list a
  visibly distinct state (hatched, "can't see this room") rather than blank space.
- Must be legible inside the continuous timeline §4.3 shipped.

### 1.4 [ ] Calendar preferences — holidays and non-working days
Import a holiday calendar (public holidays, gym closures) and colour-code off days on the date-jump
picker and the timeline's day lines. Needs a per-region feed and a per-PT toggle — a gym's actual
closures do not match a public holiday list. Distinct from the existing temporal tinting
(`--temporal-past`/`--temporal-future`), which is about session recency, not whether the day is open.

### 1.5 [ ] [Brainstorm] Google Calendar integration — source of truth, occupancy, and data-processor exposure
**Raised 2026-08-01 (Simon).** Settles the "shared calendar or backend" question left open in §1.3.
Cross-referenced from [PRIVACY.md](PRIVACY.md).

- **Source of truth splits by data type.** Google Calendar is the sole authority for scheduling facts
  — event time, room, attendee RSVP — because that is where they originate. App-only data (clipboard
  state, logged sets, per-participant tags) is the one thing the local store is authoritative for.
- **Facility occupancy**: one Google resource calendar per room, read via `freebusy.query` for §1.3's
  shading — free/busy only, never the event body, so no PT's session detail leaks to another. Tag
  workout vs. maintenance via `extendedProperties.private` at creation (Calendar's native `eventType`
  does not cover it) so maintenance can render as a hard block.
- **The PT's own private calendar** is read only by that PT, only via their own `freebusy.query`, for
  a self-double-booking warning. Never surfaced to others, never mixed into the room calendar.
- **No backend of our own.** Cross-device sync goes through Drive `appDataFolder` on the same OAuth
  grant — **built, see §3.3**, which also supersedes this section's original merge sketch.
- **PII on Drive**: `appDataFolder` gives TLS, Google's at-rest AES-256, and app-scoped access
  isolation — but not zero-knowledge encryption. Since no server LibrePT operates touches the data,
  the maintainer stays outside the controller/processor chain; PT-to-Google is the PT's own
  arrangement. Optional hardening (client-side encrypt before upload) needs a recovery-code story
  first, because a lost key makes that copy unrecoverable — a direct tension with §3.8.
- **Firestore was rejected as the default**: it would make the maintainer a GDPR **processor** (DPA,
  subprocessor disclosure, residency choice, breach duties), none of which applies to Calendar+Drive.
  Reconsider only for true sub-second push or server-side compute. **Open**: is either ever needed,
  or is poll-on-resume enough?
- **GCP dependency, independent of the above**: Calendar access needs a developer-registered OAuth
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
- **Still open**: the external half. `busy` intervals are already a first-class input to the rules,
  but nothing supplies them yet; that needs `calendar.freebusy` added to the grant
  ([googleAuth.js](src/data/googleAuth.js) requests Drive's scope only today) and the trainer's own
  primary calendar read via `queryFreeBusy`. Room calendars are §1.3; this one is the PT's own, and
  §1.5 is explicit that it is never mixed into the room read.
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

### 6.3 [x] The bottom session bar renders nothing — decided: restore, active state only

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#63-x-the-bottom-session-bar-renders-nothing-decided-restore-active-state-only); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 6.4 [x] CI runs medium and e2e in parallel; the local gate runs them staged — RESOLVED: keep parallel

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#64-x-ci-runs-medium-and-e2e-in-parallel-the-local-gate-runs-them-staged-resolved-keep-parallel); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 7. Feedback Loop

### 7.1 [ ] [Brainstorm] One-click resolve for pending plan adjustments
Do we allow a 1-click resolve on pending plan-adjustment reminders? Tension: one-tap fits the
low-interaction principle, but plan adjustments are exactly the decisions that deserve deliberate
review at the desk ([uc2](use_cases/uc2_async_plan_adjustments.md)).

### 7.2 [~] Feedback button must show its own state — toggled, and "notes exist"
**Raised 2026-07-26 (Simon).** The three signal buttons on a deck card
([exerciseCard.js](src/modules/clipboard/exerciseCard.js)) and the `.circuit-sig` trio look identical
before and after use, so a PT who tapped *Too Hard* taps again and logs a second signal.

Three things the control must express, and they are not the same signal:

1. **Toggled on** — a filled/active **background**, not a colour tweak: it must read at arm's length
   on a bright gym floor.
2. **Icon changes with state** — outline for available, solid for set, so the meaning survives for a
   colour-blind PT and in sunlit greyscale. Colour alone is not a state indicator.
3. **Notes present** — a *separate* mark for "a written/voice note is attached here", independent of
   any signal. A card can have either, both or neither.

- **[x] Toggling off already cleared the stored feedback** — `removeQuickSignal` drops the ids from
  BOTH `activeSession.feedback` and `state.planUpdates`, and only ever touches *plain* taps, so
  something the trainer wrote is never deleted by a toggle aimed at a tag. Nothing to decide.
- **[x] The notes lookup** is `hasExerciseNote` in [quickSignals.js](src/domain/quickSignals.js),
  written as the exact inverse of `isPlainQuickSignal` rather than as its own condition, so "safe to
  un-tap" and "has a note worth marking" cannot disagree about the same entry.
- **[x] Standalone cards and circuit member rows agree** — same lookups, same glyph swap, same mark.

**[x] Shipped 2026-08-15**, with one item's requirement met differently than written:

- **Point 1 (filled background) was already there** for Too Easy / Too Hard.
- **Point 2 (icon changes with state) could NOT be done as specified.** "Outline for available,
  solid for set" needs Font Awesome's *regular* weight, and that face was deliberately deleted from
  [fontawesome.css](src/fonts/fontawesome.css) on 2026-08-06 to save 29KB — on the then-true grounds
  that nothing used it. An `fa-regular` class today still matches the stylesheet and silently
  renders **solid**, so the two states would look identical, and `icon_coverage.py` cannot catch it
  because it checks glyph renderability, not weight availability. The intent — a state cue that
  survives greyscale and colour-blindness — is met with a different SOLID glyph instead
  (`fa-circle-check` when set), which costs no payload and does not reverse a measured decision.
- **Point 3 (notes mark) is a corner dot, not a fill**, because unlike the toggles the feedback
  button is not a toggle: tapping it opens the modal whether or not a note exists. Reusing the
  pressed fill would collapse two independent states into one.

**Still open**: the mark is rendered but only lightly covered — a medium-tier test mounting the deck
with a noted exercise would pin it against the real markup rather than the lookup alone.

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

---

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

### 12.6 [~] Vendor Font Awesome locally — the last CDN dependency
**Vendored 2026-08-05** ([CHANGELOG](CHANGELOG.md)); it was the root cause of §21's `Page.goto`
stalls.

**[x] Glyph subsetting — done 2026-08-22.** 252KB of two whole faces became **7KB** of two subsets,
72 glyphs, on the first load that matters most. Three things worth not re-deriving:

- **Two subsets, not one merged font.** The first attempt merged both faces into one family and two
  brand icons silently became other glyphs: the faces share 96 codepoints (both map ASCII, and
  `fa-plus` genuinely lives at U+002B), so merging forces a winner per codepoint. Upstream's own
  separation is kept.
- **The check had to come first, and it caught exactly that.** `icon_coverage.py` compares NAMES;
  [glyph_render.py](agent_tools/glyph_render.py) compares rendered SHAPES against a recorded
  baseline — a 16×16 grid per icon, so a re-encode's antialiasing (3-17 cells) passes and a wrong
  glyph (114) does not.
- **The upstream faces moved to `assets/fontawesome-upstream/`**, out of the shipped app but in the
  repository, so regenerating after an icon is added needs nothing else. `fonttools` is installed
  for the run and removed again.

**The original note, kept for the reasoning:** 2 woff2 files remain (252KB) using 48
glyphs of ~1400 plus 2 brand glyphs; the codepoints do not collide, so merging would land ~381KB of
font+CSS at roughly 24KB. The prerequisite is built —
[agent_tools/icon_coverage.py](agent_tools/icon_coverage.py) gates every `fa-` class in `src/`
against what the stylesheet can render, with the four **runtime-built** names
(`fa-arrow-${dir}`, `fa-chevron-${…}`) declared explicitly because a static scan misses them and they
would subset to blank boxes with no error. Remaining work is a dev-time `fonttools` script (not a
build dependency — regeneration stays a deliberate committed act).

**Licensing, checked against the shipped text**: a subset is a "Modified Version" under SIL OFL 1.1,
which permits it but reserves the name — so the merged font's `font-family` must be renamed
(`"LibrePT Icons"`), and the copyright/licence must travel with it, which subsetting tools routinely
strip from the name table. The icons are separately CC BY 4.0, so attribution must also state that
the set was subset. **Today is compliant and relies on none of this**: both woff2 files are
byte-identical to upstream (SHA-256 verified), so no Modified Version exists yet.

**What is still missing is a check, not the script** (established 2026-08-22): `fonttools` installs
cleanly into the venv as a one-off (`pip install fonttools brotli`, then uninstall — it must not
become a build dependency), so writing the merge is the small half. The large half is that
[icon_coverage.py](agent_tools/icon_coverage.py) compares NAMES, and a subset's failure mode is a
correct name whose glyph is a blank box — which a name-level gate cannot see. Do the render check
first, the way §12.6's own note argues the coverage gate had to come before subsetting.

**Subsetting cannot affect names in any language** — Font Awesome is Private Use Area only and
contains no letters. Non-Latin coverage is a `fonts.css` question (latin + latin-ext only, deliberate
since a CJK webfont is megabytes per trainer), and `getInitials()` derives real initials from
Han/Cyrillic/Greek/Arabic names.

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

## 17. Structured session/program history (`sessionItemRecord`)

### 17.1 [~] Persist the whole structured program into history, via a generic typed item record
**Core mechanism shipped** ([sessionItemRecord.js](src/domain/sessionItemRecord.js)): the whole
program snapshots as a flat typed array (`exercise` | `rest`, `circuitId` grouping folded at render),
with rest- and completed-aware readers and a back-compat shape guard.

**Still open**: wiring the **modality** field into the history snapshot itself, routine-builder
(`plansView`) metric authoring to match the inline editor, and `hiit` (rounds), which has no logging
surface yet.

### 17.2 [ ] Edit rules for a completed, dated session — immutable except three narrow cases
A completed dated session is an **immutable execution record**; anything forward-looking is
copy-to-a-new-session from a template, never an edit of the past. The only permitted mutations:

1. **Field-level correction** of mis-logged data, ideally stamped with an `edited` marker.
2. **Append-only annotation/feedback** at review — an append to the separate feedback layer, so it
   never touches the execution record.
3. **Anonymization** (§17.3) — never deletion.

### 17.3 [x] Erasure = anonymization only (never delete) — shipped 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#173-x-erasure-anonymization-only-never-delete-shipped-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 17.4 [ ] Save a past session as a routine template (library fills itself from history)
With §17.1 preserving the full program, "Save as routine" on a history record extracts a reusable
template — **demoting the Routines view from an authoring surface to a library that fills itself from
real sessions**, removing the blank-page chore that blocks ramp-up.

- Extraction **strips person/day-specific magnitudes** (`weight`, watts, time, distance, calories),
  keeping the prescription structure: exercise, set count, reps/targets, rest, circuit grouping.
- Pairs with the inline clipboard editor (§8.3) and §5.1's Tab 3.
- **Watch item for §18.5**: a *hard* provenance reference back to the source history record would
  create the first cycle in the reference graph (`history → routine → history`), which the topological
  migration order forbids. Keep provenance soft/denormalised.

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

### 18.7 [~] [Decided] Backups: 1× not N×, readers forever, writers never
**Core shipped 2026-08-10** — [CHANGELOG](CHANGELOG.md). What landed, and what the decisions were:

- **Back up the newest STABLE bucket only — 1×, not 3×.** Export projects through `STABLE_SCHEMA`
  ([backupFile.js](src/data/backupFile.js)) using the same projection path the star-write fan-out
  uses, so a file cannot drift from what the store would write for that shape. Not the newest *live*
  shape — that is the disposable preview schema (§18.14), which is exactly what a backup must not be
  written at. One shape per file, because expand-first staging (§18.4) makes the newest a strict
  superset of every older one; a test asserts that superset rather than trusting the convention.
- **No snapshot tier** (Simon: endless point-in-time issues in the backup world).
- **Retain readers forever; retain writers never** — a restore runs `parse → migration chain →
  single write layer → fan out`, so an old file needs no old writer.
- **Frozen backup-fixture corpus in CI** — five committed fixtures (schema 0 through 4) in
  [tests/fixtures/backups/](tests/fixtures/backups/), asserted by
  [frozenBackupCorpus.test.mjs](tests/unit_js/data/frozenBackupCorpus.test.mjs) to still import to
  the expected domain object.
- **A restore REPLACES, and now says so** — it names what would be lost per collection ("8 clients,
  13 sessions") and only when something is at stake, because a warning shown every time is a warning
  nobody reads. Declining discards the parsed file rather than leaving it primed for a later click.
  Merging two databases was rejected: it needs a common ancestor, which Drive sync's three-way merge
  has and a file import does not.

**Still open**:

- **[x] ONE version number, on the envelope — 2026-08-15.** `formatVersion` is written outside any
  future compression or encryption, so it is the first thing readable, and it is the **same integer**
  as `schemaVersion`: a container change and a record change both bump it. Version 4 is schema 4 in a
  plain-JSON container; [BACKUP_FORMATS](src/data/backupFile.js) records how to open each version and
  is **append-only**, since files declaring a version are in the wild forever. An unknown version is
  refused before anything touches the database — a newer file may be compressed, so this reader would
  otherwise find no `clients` array and restore an empty database over the trainer's real one.

  **Two independent numbers were the original plan and were rejected** (Simon, 2026-08-15). Both
  arguments for splitting fail on this architecture:
  - *"A container-only change forces a record bump with no migration to run."* It does, and the cost
    is one no-op step in the chain. Cheap, and it keeps the chain's history complete.
  - *"An older build then refuses a file whose container it understands."* It should. The guarantee
    here is retain **readers** forever — new builds open old files — and that is untouched. Old builds
    opening NEW files was never promised, and refusing is already what the restore path does, since a
    newer file may hold records this build cannot faithfully represent.

  What sharing buys: there is no way to express, or accidentally ship, a file whose two numbers
  disagree. Files written before today carry no `formatVersion` and stay readable permanently via the
  payload's own `schemaVersion` — the frozen corpus is all of that shape.

  §18.8's encryption becomes **version 5**, a new row with `container: "aes-gcm"`, plus a no-op 4→5
  record step.
- **[x] Forward-migration consent at import — 2026-08-18.** The prompt covered *what you lose from this
  device*; it now also says what the import does to the FILE: the steps in the trainer's own words, then
  *"this brings the file's data forward, and it will no longer open in older builds of LibrePT"*.

  **The case it was missing was the empty device**, which skipped the prompt entirely — and that is
  exactly where the replace warning has nothing to say while the one-way door still applies. Consent is
  now asked when EITHER consequence is real, and the two lines show independently.

  Declining leaves the `.json` untouched (the app never writes to it) and the database unwritten — no
  half-import, asserted on a clean device. A file already at this build's shape still restores in one
  step: `bringsDataForward` is false when nothing was applied, so the ordinary case — yesterday's backup
  restored today — gained no toll. One existing test had to be **rewritten rather than kept**: it
  asserted that an empty device never asks, using an OLD file, which stopped being right the moment
  portability became something to lose.

### 18.8 [ ] [Open] Encryption, device theft, and storage durability
- **IndexedDB is not encrypted by the app**; at rest it relies on OS full-disk encryption. A stolen
  *locked phone with a passcode* is genuinely well protected (iOS Data Protection / Android FBE); a
  stolen laptop without FDE is not protected at all. Same-origin scripts, extensions with host
  permissions, and anyone holding the unlocked device read plaintext.
- **Desktop is its own threat model** (Simon, 2026-07-26) and the weak case on every axis: FDE is
  opt-in and often off, extensions are common, the device is shared far more often. It is also where
  the better tools live — the File System Access API can put backups in a real user-chosen file and
  keep a handle for repeat exports.
- **Recommended first step: encrypt the backups, not the live DB.** The backup is the artifact that
  travels (Drive, email, USB) and is where a leak actually happens; the live store already has OS
  encryption in the phone case; and a lost passphrase is *recoverable* because the live DB survives.
  Encrypting the live store risks permanently destroying a solo PT's business records — a bigger
  realistic risk than theft.
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

### 18.10 [x] [RESOLVED — one build] Deep links, and one build vs. many builds

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1810-x-resolved-one-build-deep-links-and-one-build-vs-many-builds); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.11 [~] [Open] Legal gaps this design creates
- **[x] Retention basis is documented — 2026-08-22.** [PRIVACY.md](PRIVACY.md) §3.3 now states it:
  nothing is deleted on a schedule, records stay until the trainer removes them, and the anonymised
  remains of an erased client are kept indefinitely because a training history with the person taken
  out of it is no longer personal data (Recital 26). The trainer's own retention period stays the
  trainer's obligation, and the paragraph says what to do when theirs is shorter.

  **Writing it found a worse bug than the missing paragraph**: the same section claimed deleting a
  client "instantly purges their records", which is not what this app does and has not been since
  §17.3 — the exact class of error §27 was filed about, a document that is wrong about the app rather
  than about the law. It now describes anonymisation, its irreversibility, and the two things it
  cannot reach.
- **[x] Re-identification via backups + the mapping table — closed 2026-08-11.** A pre-erasure backup
  names Jane; restoring it brought her back, and **§18.7's indefinite-restore requirement removes**
  the usual "backups rotate out" defence. The register ships with both properties this bullet
  demanded: applied **at import**, before the data becomes live, and keyed so a backup written under
  another schema still matches. See [CHANGELOG](CHANGELOG.md). §17.3's key-location tension is gone
  rather than resolved — a derived pseudonym stores no mapping to re-identify against.
- **[x] Minimize the suppression list itself — done.** Salted hashes of the id and nothing else, with
  a **fresh salt per entry** rather than one install-wide: the register is unioned across devices on
  import, which a shared salt cannot survive. The side effect is strictly better, since duplicates
  become unscannable.
- **Taxonomy licensing — checked 2026-07-26, currently clear.** wger's *application* is AGPLv3 but no
  wger code is linked; its *dataset* is CC-BY-SA 4.0 but
  [exerciseStandard.js](src/domain/exerciseStandard.js) vendors ~17 generic category and equipment
  words, far below any threshold. **The line not to cross**: bulk-importing wger's 1000+ entries would
  engage both ShareAlike (a licensing split inside an MIT repo, and a one-way door for that file) and
  the **EU *sui generis* database right** (Dir. 96/9/EC), which is separate from copyright and needs
  no originality. SNOMED CT, if ever considered, requires an affiliate licence.

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
- [ ] **One headline README feature is still not shippable.** Google Calendar is unbuilt (§1.5).
      Drive sync is now live (§3.3, client id installed 2026-08-12) but reaches only the ≤100
      explicitly-listed test users until the OAuth app is published, so the pitch can promise it only
      with that caveat — or wait for Production-unverified, which drops the list and keeps the cap.
- [x] **Onboarding for an empty app — 2026-08-17.** §9.5's guided walkthrough shipped, reached from the
      splash a first-run trainer is already looking at. The blank-client-list churn this named is now
      answered by a route that carries the sample gym with it.
- [ ] **No feedback route a non-developer will use.** GitHub issues is a wall to a PT; one email
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

**Revised 2026-09-11, and the reason is §26.3's own signature.** A static file is the same for
every install, so it cannot carry `#from=` — the name, number and address that let the client check
who sent them and save the contact. A wall QR therefore identifies nobody, which is the state the
page was deliberately moved out of on 2026-08-23. Wanted instead (asked 2026-09-11): the trainer's
phone **draws the QR on screen and shows it to the client**, as the alternative to typing a number or
an address into the invite dialog at all. That needs the vendored encoder of §26.3 step 3 on the
TRAINER's side, which Phase 2 was already going to pay for on the client's side; the printed leaflet
stays possible as the version that names nobody.

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
- [ ] **Phase 2** — the vendored QR encoder and client-side QR display, plus the static trainer-side
      QR asset. Additive: both phases land on the same review dialog. Worth deferring until the
      messaging handoff has actually been tried in a gym.
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
  and the "clear the demo data" offer appears twice;
- **four cards share a title with another card** ("On Ana's phone", "The programme", "In the gym"),
  so a viewer cannot tell whether the story moved;
- the **message card shows an invitation the app no longer sends** — the text replaced on 2026-08-26
  precisely because it read like a phishing message.

Separately, seven captions narrate instead of instructing ("Open the session menu.", "Joint pain, on
this movement."), against the rule that a step asking for an action names the control, its glyph and
where it is.

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

The worst remaining, by count: `exerciseFormsController.js` (46), `activeSessionOverlayView.js` (23),
`clientDataRights.js` (22), `applicationHeader.js` (20), `backupRestore.js` (19), `clientsView.js`
(18).

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

### 39.4 [ ] CHANGE — the invite dialog's two buttons

**Reported at card 5:** *"button name nowhere to send it yet is way too confusing - could it be just a
disabled "send invite"? make the default action button on right (unify), not left"*.

The dialog offers `intake_invite_send_disabled` — *"Nowhere to send it yet"* — on an anchor styled as
the primary action ([intakeInviteDialog.js](src/modules/clients/intakeInviteDialog.js)). It reads as
a label for a thing that has gone wrong rather than as a button waiting for input, and it is the
first control on the row while the secondary sits to its right.

Two changes, and the second is a rule rather than a one-off: the primary keeps its own name while
disabled, and the primary action goes on the RIGHT everywhere a dialog has two.

### 39.5 [ ] BUG — the register takes the same person twice

**Reported at card 8:** *"adding an customer is not idempotent operation, i have multiples in DB, so on
name clash alias should be mandatory, how is clipboard gona distinguish name clashes?"*

Walking the demo more than once leaves several Nik Zupans in the register, and the clipboard shows
people by name — so two people with one name are two rows a trainer cannot tell apart mid-session,
on the gym floor, one-handed. The demo is how it was noticed; the defect is the app's.

The ask is a **mandatory alias on a name clash**, decided when the second one is saved rather than
discovered later. Open question the fix has to answer: what the clipboard, the plan editor and the
history show once an alias exists.

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

### 39.17 [ ] CHANGE — deleting a session earns ceremony proportional to what it destroys

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

### 41.1 Two layouts, not one

**Ruled 2026-09-10 (Simon).** They share the rule for dividing the width and nothing else:

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

### 45.1 [ ] The first screen is English whatever language was chosen — BUG

**Reported:** first launch, choose Slovenian, and the invitation into the demo and the walkthrough is
still in English.

**Cause, located.** The onboarding block in [index.html](src/index.html) — *Explore with demo data*,
*Guided walkthrough*, *Start with an empty app* — is written as plain English text. It carries no
translation key, has no entry in [domMappings.js](src/i18n/domMappings.js), and no `splash_*` key
exists in either [sl.js](src/i18n/sl.js) or [en.js](src/i18n/en.js). The language buttons above it
work; nothing below them can be reached by a language choice at all.

The language prompt itself is correct as it stands and must not be touched: each language names
itself, in its own language, so the choice is legible to someone who cannot read the current one.

**Why it is a first-run defect specifically.** The block is shown only while the trainer has saved
nothing of their own, so the one screen that is guaranteed to be English is the very first one a new
trainer sees. It is also the screen that decides whether they go any further.

**Ruling (Simon, 2026-09-11):** *"popravi tako, da bo prav"* — fix it properly, without first
establishing which surface the trainer saw.

**The promotional page is a SEPARATE, still-open item.** [landing.html](src/landing.html) is
English-only by construction: it is a built document with no translation mechanism of any kind, and
its calls to action are the same demo and walkthrough links. Translating it means giving the built
docs a language axis, which is a larger change than this section. Not part of this fix; recorded here
so it is not lost.

### 45.2 [ ] The trainer cannot enter their own name, phone or email

**Reported:** there is nowhere to put the trainer's own details.

**Confirmed, and worse than a missing field.** The app already *uses* the trainer's name — the
invitation a client receives reads *"{trainer} invites you to fill in your details"*
([sl.js](src/i18n/sl.js), `intake_invite_body`) — while offering no place to enter it. Every record
in the app belongs to a client; the trainer is the one person the data model does not know.

**What it is for, so the scope stays honest:** the invitation and consent wording that names the
trainer, and the contact details a client needs in order to answer. Not an account, not a login,
not a profile that syncs anywhere.

**Ruling (Simon, 2026-09-11):** implement immediately, alongside §45.1 and §45.3.

**Also on the cold-start splash** (Simon, same day): the same form is offered beside the three
onboarding choices, not only in the ☰ menu. Built as ONE form — the fields, the labels and the single
validation rule live in
[trainerDetailsDialog.js](src/modules/common/trainerDetailsDialog.js) and are rendered into either
host under different id prefixes, because two copies of a form is two places for the rule to drift
and both can be in the document at once.

**It is an offer there, never a gate, and that is a product constraint rather than a preference.**
The app's first promise is that there is no account and no signup; a form on the first screen is
exactly what a stranger reads as one. So every field is optional, the three choices work with
nothing typed, saving does not choose for them or dismiss anything, and the form says in its own
words that it can be done later from the menu. The form sits BELOW the three choices for the same
reason — a form above the way in reads as the price of entry. If that ever tightens into a required
step, the promise on [landing.html](src/landing.html) stops being true and has to change with it.

### 45.3 [ ] The signup form asks for *"your name"* rather than first and last name

`intake_name` reads *"Tvoje ime"* / *"Your name"* ([sl.js](src/i18n/sl.js),
[en.js](src/i18n/en.js)). A trainer filing a client needs both names; *your name* invites one.

**Ruling (Simon, 2026-09-11):** fix the label in both languages.

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

### 45.7 [ ] Finish "seja" → "trening", and settle on ONE form of address

**Reported:** the rename from *seja* (session) to *trening* (training) is not consistent, worst of all
where a new session is planned.

**Confirmed.** The rename was started and left half-done — its reasoning is recorded in the
translation file itself ([sl.js](src/i18n/sl.js)): *seja* in Slovenian reads first as a meeting, while
*trening* is the word a trainer and a client actually use. Above that comment sit roughly twenty
strings still saying *seja*, including "Nastavitev seje vadbe" and "Ime seje" — the new-session
screen the trainer named.

**A second inconsistency, not reported but worse in use:** the Slovenian text switches between the
formal and the familiar form of address. "Nastavite podrobnosti seje" in one place, "želiš poslati" in
another. A reader notices a change of register faster than a change of noun.

**Ruling (Simon, 2026-09-11):** finish the rename, and use the **familiar form (tikanje)**
throughout — a trainer talks to a client, not an office to a citizen.

**This is a rule for new text as well, not a one-time sweep**, which is why it is written here rather
than only fixed: Slovenian user-visible text is familiar-form, and a training session is a *trening*.

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

### 45.12 [ ] Published slots a client picks from an INVITATION

**Wanted (Simon, 2026-09-11).** A training session with published times, where the client chooses one
themselves, having been invited.

**Adjacent to, but not the same as, what exists.**
[uc3_publish_slots.md](use_cases/uc3_publish_slots.md) and
[uc4_client_self_subscription.md](use_cases/uc4_client_self_subscription.md) both stand on Google
Calendar's appointment schedules — deliberately, to avoid hosting anything. This one starts from an
invitation the trainer sends and has to work for a trainer with no Google account, which is the
difference that makes it a separate use case rather than a variation.

Where it connects: [§26](TODO.md)'s self-onboarding already sends a client a link and gets a file
back, and the RSVP page ([rsvpView.js](src/modules/rsvp/rsvpView.js)) is already an answer coming
back from a client. The open question is whether choosing a slot is another answer of the same kind.

### 45.13 [ ] An appointment already agreed — just send the client an ICS

**Wanted (Simon, 2026-09-11).** The time is agreed, nothing needs deciding, and all the client needs
is a calendar entry.

**Most of this is built.** [calendarInvite.js](src/data/calendarInvite.js) writes the ICS, and
[sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js) already hands it to a client by
email or SMS. What is missing is that it is not written down as a use case, and that the route into
it goes through inviting somebody to a session — rather than "this is agreed, send the entry".

Cheapest of the three new scenarios, and the one a trainer would use every week.

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
