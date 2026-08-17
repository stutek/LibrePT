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

Open and in-progress backlog. Shipped items **graduate to [CHANGELOG.md](CHANGELOG.md)**; their
heading stays here as a one-line stub so `§N.M` cross-references keep resolving, and gaps in the
numbering mark items pruned entirely. **[Brainstorm]** marks a design question to settle before code;
**[~]** marks partial work.

Canonical context: [README.md](README.md) (architecture & features), [use_cases/](use_cases/)
(workflows), [CONTRIBUTING.md](CONTRIBUTING.md) (conventions). Durable engineering lessons live in
[AGENT_RULES.md](AGENT_RULES.md), not here — this file records *work*, not process.

## Where to start (ranked 2026-08-17)

The governing fact is [docs/PREVIEW.md](docs/PREVIEW.md): the app tells its own users it can wipe
their data. Nothing trainer-facing can be promoted until that is false, so the ranking is **data
safety → showability → everything else**.

**Every ranked item from 08-13 has shipped, which is why this is a re-rank rather than an edit**:
§23.5's recording+landing page (rank 1, shipped 08-16 as a *script* plus a recorder that cannot rot),
§18.7's `formatVersion` envelope (2, 08-15), §27.4's withdrawal route (3, 08-14, plus the §27.7 it
surfaced), §7.2's feedback button state (4, 08-15), and §9.5's guided walkthrough (5, today). **The
08-13 ranking also sat stale for four days** while four of those shipped — the same failure it was
written to correct, so: re-read this table against `src/` before trusting it, and close items in the
commit that ships them.

| Rank | Item | Why now |
| :--- | :--- | :--- |
| 1 | §26 / §1.7 client self-onboarding | **Decided 2026-08-17 (Simon): this is next.** The intake page a client fills on their own phone, with consent signed there. §27.1/§27.2 shipping discharged what parked it, and the whole GDPR surface it needs now exists |
| 2 | §23.5 remainder — a feedback route a non-developer will use | The last launch prerequisite with nothing technical in its way. GitHub issues is a wall to a PT; one address or form, linked in-app. Best done with §12.4 (global `error`/`unhandledrejection` capture), or the report still asks a trainer to retype a build stamp by hand |
| 3 | §18.7 remainder — forward-migration consent at import | Ordering, not urgency: a restore silently brings a file forward, and the trainer is not told it will no longer open in older builds. Small, and it must precede §18.8's encryption |
| 4 | §8.7 / §8.8 gym-floor remainders | With §7.2 done these are what is left of the four, and both are cheap next to anything else here |

**Waiting on a ruling, not on work** — §1.6's confirm link (a replayable capability token aimed at the
trainer's own store) and SMS as the response channel; §19.2's URL-privacy invariant, which unblocks
§19.3. Each is a question in its own section, deliberately not folded into the ranking above.

**Cheap wins, unranked** — each small enough to ride along with adjacent work: §12.5's reflog expiry
(one maintainer command), §19.3's exercise-library filter reset (a real bug needing no URL decision),
§12.6's glyph subsetting (prerequisite already built, and §7.2 wants the regular weight it would
restore), §18.11's retention basis (one paragraph, in the privacy policy — the only bullet left in
that section), §21's 60s → 30s navigation timeout (the cause it was raised for is fixed), and §25.6's
medium-tier overflow harness (the sweep already exists).

Deprioritised on purpose: §24.5/§24.7 remainders and §24.8's rename (optional by their own text),
§11/§5.1/§4.1 (large UI churn with no users yet to aim it), §17.2/§17.4 and §18.8–§18.12 (decided on
paper, correctly parked), §12.7 (measured, closed — do not reopen).

### Open work at a glance

One row per theme, so the shape of the backlog is readable without scrolling it. "Blocked on" names
the thing that must happen first, not merely what it touches.

| Theme | Open | Lead item | Blocked on |
| :--- | :--- | :--- | :--- |
| **Launch prerequisites** | §23.5 | A feedback route a non-developer will use | Maintainer actions; nothing technical |
| **Data safety remainder** | §18.7, §18.8, §18.9, §18.11, §18.12 | `formatVersion` envelope | Nothing — but only §18.7 is urgent |
| **Scheduling** | §1.2, §1.3, §1.4, §1.5 | Room occupancy via `freebusy.query` | §1.5's OAuth/verification path |
| **Gym-floor UX** | §7.2, §8.1, §8.7, §8.8 | Feedback buttons showing their own state | Nothing; §7.2 is the real defect of the four |
| **History & templates** | §17.1, §17.2, §17.4, §17.5 | Modality into the history snapshot | Decided on paper, parked deliberately |
| **UI redesign** | §4.1, §5.1, §5.2, §11.1, §11.2 | Tabbed client view | Deliberately waiting for real users to aim it |
| **Go-to-market** | §23.1–§23.6 | Decide what "winning" means | §23.1 gates every channel choice |
| **Refactor remainders** | §24.4d, §24.5, §24.7, §24.8 | One movement → plan item mapping | Optional by their own text |
| **Tests & docs** | §6.2, §12.3, §12.4, §12.5, §12.6, §25.6 | Medium-tier overflow harness | Nothing; all small |
| **Routing decisions** | §19.2, §19.3 | The URL-privacy invariant | One decision, then both unblock |
| **Data-subject rights** | §27.4 | One-tap withdrawal in the consent letter | Nothing; the other four shipped 2026-08-11 |
| **Client self-service** | §26, §1.7 | Intake page the client fills, consent signed on their own phone | Nothing — and it is next, decided 2026-08-17 |

---

## 1. Scheduling & Sessions

### 1.1 [x] PT-side client assignment to a session
Shipped 2026-08-04 — [CHANGELOG](CHANGELOG.md). Invites are `.ics` + `mailto:`, because there is no
backend to send mail from (§1.5).

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
  silently-expiring, nobody's-job artefact [AGENT_RULES §2.A.3](AGENT_RULES.md) rejects for gate
  suppressions. Instead `python -m agent_tools.google_credential` stamps a `minted` date and
  `python -m agent_tools.credential_expiry` runs **inside the canary**, failing it from **150 days**
  — a month inside Google's 180 — so a live canary turns red with runway, and a canary that stopped
  comes back red the moment it next runs. It is deliberately a hard failure rather than a warning
  ([AGENT_RULES §2.A.3](AGENT_RULES.md) forbids a gate that warns and returns success); a month of
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
  ([sessionChangeNotice.js](src/domain/sessionChangeNotice.js)): a rename or a plan edit asks nothing,
  because a prompt that fires on a typo is a prompt that gets dismissed on the change that mattered. Only
  clients who were **invited and are still participants** are offered — a hand-added attendee was never
  sent anything, and turning a time change into their first invitation is not what was asked. Saying no
  sends nothing: the trainer has decided to tell them another way.
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
Shipped 2026-08-02, manual-only as of §3.10 — [CHANGELOG](CHANGELOG.md) carries the decisions worth
not re-litigating (no visible Drive file ever; three-way merge, so no Lamport pair and no tombstones).

**Unblocked 2026-08-12**: a real GCP OAuth client id is installed in
[driveSyncConfig.js](src/data/driveSyncConfig.js), so the card now offers a live Connect instead of
reporting "not configured". Two consequences worth knowing:

- **Only listed test users can actually grant access.** The OAuth app is in *Testing*, capped at 100
  explicitly-listed accounts; anyone else gets `403: access_denied`. Demo users are unaffected —
  `?init=demo_data_load` is local seed data that never contacts Google, and the app is offline-first
  — but cloud sync is a you-and-known-pilots feature until the app is published. Publishing WITHOUT
  verification is the useful middle state: it drops the manual list while keeping a 100-user cap and
  an "unverified app" warning, and it ends the 7-day refresh-token expiry that Testing imposes.
- **The unconfigured card is now unreachable**, so `tests/medium/test_drive_sync_ui.py` pins the
  configured-but-not-connected state instead. The connected state cannot be reached by any Playwright
  tier — Google fingerprints and blocks automated browsers on `accounts.google.com` — which is what
  [tests/live/](tests/live/) exists for.

Setup steps and the console field-by-field walkthrough live in
[docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md). It is written against role handles
(`admin@`, `maintainer@`) and names no credential, so the procedure is reviewable in the open; only
the mapping from handle to real address is kept private.

**Not built**: incremental sync via the Drive Changes API. Every pass moves the whole file — correct,
not bandwidth-minimal.

### 3.5 [x] Paper consent — checkbox, signed date, form version, and delivery
**Decided 2026-07-22: KISS — consent lives on paper.** The client signs a form kept at the gym; that
physical file is the evidence. No photo capture, no image storage, no IMAP — considered and dropped,
and still dropped. **Shipped 2026-08-09**, per client and per language — see
[CHANGELOG](CHANGELOG.md) for the editable signed date, the versioned letter, the localised client
documents and why the archiving reminder is a dialog rather than a tooltip.

One amendment to the 07-22 decision worth recording: the `mailto:` delivery trigger was to be removed
once paper consent landed. **Reversed on request (Simon, 2026-08-09)** and given an SMS sibling — a
trainer who has to produce the letter themselves before the first session will not, and both buttons
open the device's OWN mail/messaging app, so neither is an "email flow" in the IMAP sense rejected
above.

**Still open**: `PRIVACY_FOR_TRAINERS.md` and `PRIVACY.md` remain English-only (they are read by the
trainer, not the client), and the Slovenian client documents are maintainer translations that have
**not** been reviewed by a data-protection lawyer — each says so at the top. That review is a launch
prerequisite for §23.6, not a code task.


### 3.7 [x] [Superseded by §18.6] Persistence engine — localStorage JSON, then IndexedDB
Engine decision and sizing live in §18.6. The Export/Import JSON backup remains the user-facing
escape hatch (§3.3, §18.7).

### 3.8 [x] Unbacked-data warning banner — same weight as the PREVIEW badge

**Shipped 2026-08-13.** [backupHealth.js](src/data/backupHealth.js) decides,
[backupHealthController.js](src/controllers/backupHealthController.js) keeps it current, and
`renderBackupBadge` shows it beside the PREVIEW tag. Three things worth not re-deriving:

- **A `{id, hash}` fingerprint, not a snapshot.** Counting "changes since the last backup" needs a
  reference point and records carry no `updatedAt`. Storing a full state copy (as the Drive ancestor
  does) works and was rejected: it roughly doubles what the database holds, and a feature that exists
  to warn about STORAGE EVICTION must not be a cause of it. `countChangedRecords` diffs two
  fingerprints unchanged, since it compares any two state-shaped objects.
- **Time alone never fires.** A database backed up a year ago and untouched since is still backed up;
  warning there teaches the trainer the badge means nothing. Never-backed-up is judged on count
  alone, because there is no timestamp to measure an interval from and inventing one would nag
  someone still evaluating the app with three test clients.
- **`onStateSaved` had to become additive first**, and that is the sharp lesson. It stored ONE
  listener in one slot, which was indistinguishable from correct while the ahead/behind badge was its
  only consumer. Registering this feature's listener silently *unsubscribed* the badge, which then
  showed whatever it had last rendered — nothing threw, and the only symptom was a number that had
  been right a moment earlier. Pinned now by `tests/unit_js/data/stateSavedListeners.test.mjs`.
  `onSyncCountsChanged` still has the single-slot shape and one consumer; it is the next one to trip.

<details><summary>Original scope</summary>
**Raised 2026-07-26 (Simon). Ranked #3 in Where to start** — now that §18.7 ships a real backup and
restore, the banner has a fix to name in the same breath, which was the missing half. The database
holds the **only** copy of a trainer's records
([DATA_MODEL §6](docs/DATA_MODEL.md)) and a browser can evict IndexedDB under storage pressure.
Nothing on screen says so.

- **Surface**: a persistent header banner styled and placed like `#preview-badge`, tappable through
  to a short explanation of the risk and the fix.
- **Condition**: no secured external copy — no cloud target configured, or the last successful
  export/sync is stale ("never" being the obvious first case). Distinct from the offline indicator
  and from §3.9's ahead/behind badge: those say "not pushed *yet*", this says "nothing anywhere but
  this browser profile".
- **The input now exists (2026-08-12)**: `recordBackupTaken()` / `readBackupHistory()` in
  [stateStore.js](src/data/stateStore.js), written by **both** a completed Drive sync and a
  downloaded JSON backup. Deliberately its own meta key rather than a field on `driveSync`, whose
  ancestor is merge-critical — a three-way merge is only correct if that snapshot is exactly what
  Drive last saw, so letting an export touch it would corrupt the next merge. Local-only and never
  synced: a file downloaded on the phone does nothing for the tablet.
- **Trigger shape decided**: a change COUNT or a time interval since the last backup, whichever
  fires first (constants, so they are tunable) — not a binary "never backed up". Catches both "lots
  of work" and "a little work, long ago".
- **The rule that keeps it a safety feature**: it must be clearable **without Google**. A downloaded
  backup resolves it exactly as a sync does. Otherwise a warning colour is a growth prompt, and
  trainers can tell the difference.
- **Not the same number as the ahead count.** §3.9's ↑ is Drive-relative ("not on Drive"), so a file
  backup does not reduce it and should not. This banner is backup-relative ("not anywhere durable").
  Keeping the two separate is what lets the count stay factual while the escalation stays honest.
- **Escalation, not animation**: no persistent pulsing. A permanent animation in a fixed header is
  ignored within a day, competes with the live session for peripheral attention, needs
  `prefers-reduced-motion` handling anyway, and devalues the PREVIEW badge beside it. Static colour;
  weight it with `storageDurability.js`'s `atRisk` / `not-persisted`, which is real evidence of
  eviction risk rather than a proxy for it.

</details>
- **Not permanently dismissible** while the condition holds. Session-scoped at most.
- **Wording is the whole feature** — honest without alarming a PT mid-session ("Only copy — no backup
  yet" beats "DATA LOSS RISK"), and it must name the fix in the same breath.
- [storageDurability.js](src/data/storageDurability.js) already measures eviction risk by
  consequence, so the banner can escalate when the browser has *refused* persistence rather than
  merely not been asked.

### 3.9 [x] [Decided] Every write increments the ahead counter on the Sync & Backup button
Shipped 2026-08-03, fixed at the seam (`onStateSaved`) rather than the ~21 call sites —
[CHANGELOG](CHANGELOG.md).

### 3.10 [x] [Decided] Drive syncing is manual-only; periodic/resume ticks refresh counters, not data
Shipped 2026-08-04 — [CHANGELOG](CHANGELOG.md).

---

## 4. UI / UX

### 3.11 [x] Sync surface — the icon vocabulary and tap-to-sync — SHIPPED 2026-08-12

Split out of 2026-08-12's sync work, which fixed the counter's honesty and its legibility but stopped
before the states around it. All five items built; what shipped, and what was decided along the way:

- **`↑!` past nine, for AHEAD only** — `↑↑` said "many" only to whoever wrote it. **Behind keeps
  `↓↓`**: *behind* means Drive holds changes not pulled yet, so nothing is at risk, while *ahead*
  means those edits exist only on this device. Same width, and the asymmetry is the point.
- **Warning over the cloud on a failed sync**, replacing the sync glyph — a genuine fault earns the
  treatment deliberately withheld from "merely not connected".
- **A muted slashed cloud when not connected** — informational, not an ✕ and not warning colour,
  because [PRIVACY.md](PRIVACY.md) tells trainers local-first is the point. The cloud desaturates
  along with its slash: a bright cloud under a grey slash still reads as connected.
- **Animated arrows while syncing** — Font Awesome's own `fa-spin`, whose stylesheet already cuts
  the animation under `prefers-reduced-motion`, so the guard cannot drift from what it guards.
- **Tap-to-sync when connected**, with the dialog left in the ☰ menu. The two listeners on
  `#backup-btn` became one: `driveSyncUi` answers first and `backupRestore` opens the dialog only
  for the taps it declines. Both exceptions survived — conflicts open the review modal, and a
  failure posts to the notification feed.

The four states live in [syncStatusGlyph.js](src/modules/common/syncStatusGlyph.js), DOM-free so
each is forced to carry a LABEL as well as a shape (the glyph is `aria-hidden`, so without words in
the button's `aria-label` the state would be unreachable on touch and silent to a screen reader).
The failure notification is **synthetic, never stored in `state.notifications`** — a stored one
would ride into the backup file and the Drive snapshot and count as a local change, so a failed
sync would increment the very ahead counter it failed to clear.

### 3.12 [x] Ship the remaining trainer-facing docs as pages, not GitHub links

**Shipped 2026-08-13** — six more pages (PREVIEW, bug reporting, and the consent form + privacy
notice in `en` and `sl`), the four in-app links repointed, and `privacy.html` finally linked from the
menu: it had been generated on 2026-08-12 and the link left on `github.com`, so the page shipped for
a day while nobody could reach it.

Two things worth keeping from the build:

- **Link rewriting is the real work, not the table row.** The docs link to each other as repository
  files do (`../PRIVACY.md`, `templates/en/Client_Consent_Form.md`), and rendered into a flat `src/`
  every one of those is a 404. `rewrite_link()` sends a shipped doc to its sibling page and anything
  else to an absolute GitHub URL. A runtime guard against "unrewritten" links was written first, and
  its own test proved it could never fire — the two destinations are exhaustive — so it was deleted
  and the property is pinned by a test instead.
- **The consent URLs had to stay absolute.** They are interpolated into the email a trainer sends a
  client, where a relative `./privacy-notice-en.html` is meaningless. `consentForm.js` derives them
  from `import.meta.url` rather than importing `routerController`'s `BASE_PATH`, since `controllers/`
  is a layer above `modules/common/`.

**Deliberately not done**: `README.md#about-demo-data` ([messages.js](src/data/messages.js)) still
points at GitHub. The README is developer-facing and stays there by this section's own rule — the
right fix is not a seventh page but moving that explanation in-app, which belongs with §9.3/§9.5's
demo-data and onboarding work rather than here.

<details><summary>Original scope</summary>

[render_docs.py](agent_tools/render_docs.py) shipped 2026-08-12 with PRIVACY.md as its only entry.
Four in-app links still point at `github.com`, each aimed at someone who will never have a GitHub
account, and each dead without signal — which is a defect in an offline-first app before Google's
verification requirements enter into it.

| Link | Where | Audience |
| :--- | :--- | :--- |
| `docs/PREVIEW.md` | header PREVIEW tag | the **data-loss notice** |
| `docs/BUG_REPORTING.md` | app menu | trainer |
| `docs/templates/**` (en + sl) | [consentForm.js](src/modules/common/consentForm.js) | **gym clients** — a legal form handed to a client |
| `README.md#about-demo-data` | [messages.js](src/data/messages.js) | trainer |

The templates are the worst of these: a trainer hands a client a consent form and the link opens a
blob view with a "Sign in" header. Adding a row to `DOCUMENTS` ships a page; the work is repointing
the links, cache-manifest entries for offline, and the per-language pages doubling the count.
Developer-facing docs (README, DATA_MODEL, ROUTING, SRC_MODULES, use_cases, INDEX files) stay on
GitHub — the test is whether a non-developer reaches it from the app, or a regulator needs it at a
stable URL on a domain we own.

</details>

### 4.1 [ ] Theme redesign
Light mode needs a nicer design (reference:
<https://claude.ai/code/artifact/f27dc4ca-e1b4-47dd-b3c6-34dee3d6110c>), dark improved in the same
pass. Constraint: both must keep working from the custom properties in `index.css` — no hard-coded
theme colours.

### 4.3 [x] Collapse the duplicated session header into one row, with a date picker — see CHANGELOG
Shipped 2026-07-27 with the continuous-timeline rewrite. The blocking premise (sessions carried no
real date) was resolved by schema 3's `startDate`.

---

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
Shipped 2026-08-08 — [CHANGELOG](CHANGELOG.md). The idle "Next: …" state was deliberately not
restored.

### 6.4 [x] CI runs medium and e2e in parallel; the local gate runs them staged — RESOLVED: keep parallel
Resolved 2026-08-08 (Simon): **CI mirrors the local gate**, four stages chained from one declaration
(`PIPELINE_STAGES`). See [AGENT_RULES §2.A.3](AGENT_RULES.md) for the standing rule and
[CHANGELOG](CHANGELOG.md) for the cost this was overruled on.

---

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

### 8.1 [ ] Bind multiple clients to one shared set of exercises
Two or more participants bound to the same exercises, merged into a single combined view — they train
the identical programme in lockstep, so the trainer logs it once instead of switching tabs.

- The **cards are shared**: navigating/logging advances the plan for the whole group.
- **Feedback stays per-person** — one client can find a shared set too hard while another finds it
  too easy.
- Decide the model: `clientRoutines[clientId]` owns its own `exercises` + `logs` today. Either a
  shared exercise reference with per-client log/feedback overlays, or a group pseudo-participant
  that fans feedback back out.
- Interacts with §1.2 and the participant tabs — a bound group should read as one tab, expandable.

### 8.3 [x] Inline Clipboard Editor — shipped, see CHANGELOG

### 8.6 [x] Rests are first-class, focusable plan items — shipped, see CHANGELOG

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

### 8.8 [ ] Copy-program icon on the clipboard view
**Raised 2026-08-09 (Simon).** A control on the live clipboard that copies the current program —
one tap to reuse today's plan rather than re-authoring it. Open questions before building:

- **Copy to what?** The three plausible targets are a different participant in the same clipboard
  (the common case when a walk-in joins a session already underway), the same client's next session,
  or a routine template. The third overlaps §17.4, which extracts a template from *history*; this one
  would act on the plan that is live right now.
- **Copy what, exactly?** Prescription structure only (exercise, sets, reps/targets, rest, circuit
  grouping) or logged magnitudes too. §17.4 already decided that a *template* strips person- and
  day-specific magnitudes; a participant-to-participant copy mid-session probably wants the same
  rule, since the point is a shared plan, not a shared performance.
- **Placement**: it belongs beside the existing edit affordance in the title bar, not on a card —
  the unit being copied is the whole program. Must satisfy the no-hover rule and carry a real touch
  target, not a 9px glyph.
- Interacts with §8.1 (binding several clients to one shared set) — if that ships, a copy and a bind
  are two different intentions and the UI must not blur them: a copy diverges afterwards, a bind
  does not.

---

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
The demo notice's primary action called `resetLibrePTData()`, which deletes the **whole database** —
fine while the only person pressing it had nothing else, destructive from the moment a trainer adds
real clients, which is exactly when the fake people become a stain worth removing. Now a
confirmation screen that removes demo records selectively. See [CHANGELOG](CHANGELOG.md) and
[UC7](use_cases/uc7_demo_to_clean_database.md). Two rules worth not re-deriving: **provenance is
never inferred from id shape**, and the seeded exercise **catalog is an asset, not a stain** — it is
kept, with the reason it survived shown on its own line rather than in a tooltip.

Also fixed the same week: the seed anchored "today" sessions with a `min(17, …)` hour clamp, so a
demo loaded after 17:00 opened on a wall of already-past sessions counting down in negative hours.
Slots now follow the real clock and may cross midnight, each session's `day` bucket is **derived**
from its timestamp rather than asserted alongside it, and an overdue card flips its label to
"Overdue" instead of printing a minus sign.

### 9.4 [x] Simulated finger / touch controller — 2026-08-16
Shipped as [demoHand.js](src/modules/demo/demoHand.js): an overlay pointer that travels to a target,
pulses as a tap, and lets the player dispatch the real interaction underneath it.

**It lives in `src/modules/demo/`, not the `src/demo/` this asked for.** Every other feature sits in
`modules/<feature>/` and `import_layers.py` derives a module's layer from that path, so a top-level
`src/demo/` would have been a directory outside the layering with no rule saying what it may import.
The folder was the incidental part of this item; the pointer was the point.

### 9.5 [x] Guided walkthrough engine (step overlay) — 2026-08-17
Shipped: [walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js) over
[domain/walkthrough.js](src/domain/walkthrough.js), reached by `?demo=walkthrough` and by the splash's
own button. **Back / "Show me" / Next**, one step at a time, over the real app.

- **It plays the SAME script as the automatic demo** ([gymFloorTour.js](src/modules/demo/gymFloorTour.js)),
  and shares its tap (`performStep`). Two scripts would have been two things that must stay true of
  the app, which is the failure mode §23.5 chose a script over a recording to avoid — and the demo's
  e2e replay already keeps this one honest.
- **The trainer doing the step themselves is what advances it** — beyond what this item asked for, and
  the reason the app stays fully tappable underneath with no scrim. Completion is the step's own
  expectation becoming true, watched on a poll, so it does not care who caused it. A walkthrough that
  only advanced on its own buttons would be teaching its own buttons.
- **"Show me" is the escape hatch, not the path**, and it withdraws once the step is done: an offer to
  do something already done is a control that does nothing.
- **Back re-explains; it does not undo.** An inverse for every step is an undo stack for a
  demonstration. A step returned to stays done, so re-reading what Too Easy meant cannot log a second
  signal.
- **The splash button is enabled and the "soon" pill is gone** — that control was the last place in
  the app announcing something unbuilt. It carries `?init=demo_data_load` with it, because the script
  drives the seeded group session and a walkthrough over an empty app would point at nothing.
- **Still open — the script is four steps, not six.** This item listed "complete a round" and "review
  an adjustment" too; the shipped script is §23.4's wedge (open the session, focus a circuit, signal
  Too Easy, switch participant). Adding either is a data change in `gymFloorTour.js` plus a caption —
  worth doing only if a viewer is demonstrably left wanting them, since every step is one more thing
  between a stranger and the point.

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

## 12. Documentation, Tests, OKF & Housekeeping

### 12.3 [~] Test completeness
Themes, the Sync & Backup modal and counters, the header menu, the first-run agreement, the
plan-adjustments deck and wizard, the Client Directory grid and search are all covered. **Still
open**: the demo walkthrough (§9.5) is unbuilt, so it has no tests. Confirm every extracted component
has at least one exercised path.

### 12.4 [ ] [Brainstorm] Capture exceptions and offer semi-automatic bug reporting
**Raised 2026-07-26 (Simon).** Nothing installs `window.onerror` or an `unhandledrejection` handler,
so a thrown error dies in a console the PT will never open while
[docs/BUG_REPORTING.md](docs/BUG_REPORTING.md) asks them to retype the build stamp by hand.

- **Capture**: global `error` + `unhandledrejection` listeners recording message, stack, route and
  build stamp. A small in-memory ring buffer, only the most recent persisted, so a crash log can
  never grow into the storage budget (§18.6).
- **Offer, never send.** No server, no telemetry: automatic reporting would be an unannounced egress
  of a PT's data. The flow opens a **prefilled GitHub issue URL** the PT reviews and submits.
- **Redaction is the hard part and it decides the design.** A stack is safe; the state around it is
  not — names, notes and injuries are PII (§17.3) and the issue is public. Prefer a payload
  non-identifying **by construction** (error, stack, route, version, opaque ids only) — and show it
  for review anyway.
- **Deep-link the failure**: routes are durable (UC5), so a report can carry the URL that failed —
  reproduction becomes "open this link".
- Keep distinct from the integrity error page (`sw/integrity.js`): a corrupt download must never be
  reported as an app bug.
- **Watch the failure mode**: a handler that itself throws, or that renders a modal over a live
  session mid-set, is worse than the original bug. Non-blocking, never steals focus, survives being
  called before boot completes.

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

**Still open — glyph subsetting**, and it is now safe to do: 2 woff2 files remain (252KB) using 48
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

**Subsetting cannot affect names in any language** — Font Awesome is Private Use Area only and
contains no letters. Non-Latin coverage is a `fonts.css` question (latin + latin-ext only, deliberate
since a CJK webfont is megabytes per trainer), and `getInitials()` derives real initials from
Han/Cyrillic/Greek/Arabic names.

### 12.7 [x] [CLOSED — measured, do not reopen] ~89 separate module requests on first load
The cheap half shipped (15 `<link rel="modulepreload">` hints on the boot-critical path); page
pooling was built, measured at ~4% of the gate and **reverted** 2026-08-08. Full measurements, and
how to read a subset benchmark, are in [CHANGELOG](CHANGELOG.md) — they are expensive to retake, so
read them before proposing this again (it was mis-recommended as "the next big win" twice).

Bundling remains the only untried half, and it trades away the buildless property — a deliberate
architectural choice, so the bar is high.

### 12.8 [x] `tests/e2e/` vs `tests/unit/` is a browser split, not a UI split — resolved by `tests/unit_js/`
Shipped 2026-08-04/05 — [CHANGELOG](CHANGELOG.md). See [tests/INDEX.md](tests/INDEX.md) for the four
tiers.

---

## 13. Exercise Library & Movement Taxonomy

**CLOSED — fully shipped.** See [CHANGELOG.md](CHANGELOG.md) and
[UC6](use_cases/uc6_exercise_taxonomy_and_picker.md).

### 13.1 [x] Repurposed `exercisesView` into a Professional Movement Taxonomy — see CHANGELOG

### 13.2 [x] Fast-selection flows over the taxonomy — see CHANGELOG
Restored as a stub because four `src/` modules still cite it. The three scenarios those comments
mean: **A** multi-add from the picker, staying open for rapid entry; **B** swap-by-volume-bucket in
the adjustment wizard; **C** strict taxonomy inheritance when authoring a new movement.

### 13.3 [x] Conditioning metrics (modality axis) — see CHANGELOG

---

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
**No back-compat kept** — decided pre-release with no real PT data to protect, so the v1→v2 migration
drops stray `bookings` rather than carrying it forward.

### 14.7 [x] Extract a shared `renderMarkupOnce()` helper — shipped 2026-08-01, see CHANGELOG

### 14.8 [x] Render-order dependencies between modules are unenforced — shipped 2026-08-01, see CHANGELOG

### 14.9 [x] `activeSessionController.js` mixed markup templates into a behavior file — shipped 2026-08-01

---

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
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). `CURRENT_SCHEMA_VERSION` stays a plain integer major:
a "patch" to a schema is either a migration step or nothing.

### 16.5 [x] Retire the multi-version hosting machinery from the code — done
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). **Kept**: the commit-SHA build stamp and the
build-info dialog — support surfaces, not switching machinery.

---

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
Decided 2026-07-22, built 2026-08-11 as `clientErasure.js`. See [CHANGELOG](CHANGELOG.md).

The one open question this section carried — **reversible vs irreversible**, and where a
re-identification key could live — is settled as **irreversible**, and the reasoning is worth not
re-deriving: a reversible scheme needs a mapping, and with no server the mapping would live in the
database it is protecting, making one file that un-erases everyone. Deriving the pseudonym from the
record's own opaque id instead means there is nothing extra stored to reverse, so the key-location
question stops existing rather than being answered.

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
**Built** — [recordSchemas.js](src/data/recordSchemas.js), [recordProjections.js](src/data/recordProjections.js)
and `starWrite()` in [stateStore.js](src/data/stateStore.js). Three constraints that still bind any
change here:

- **The fan-out set is global, never per-app-version.** If each version declared its own, two tabs on
  two versions would write different sets and buckets would silently diverge.
- **A cached build's fan-out set is fixed at cache time** — it can never learn a schema was retired.
  So the set is a constant compiled into the build, and retirement is a two-step: stop reading it,
  then stop provisioning it. A retired schema goes on receiving writes from stale builds, which is
  harmless (a store nobody reads).
- **Write set ⊇ read set.** A bucket must receive star writes the moment its migration *begins*, not
  when it completes — that is what makes §18.3's accelerator work.

### 18.2 [x] [Decided, CLOSED] Identity: lineage IDs, no ID-mapping table
`lineageId` **is** the record's own `id` — projections carry it unchanged, so today's UUIDv7 already
is the lineage id and no mapping table exists. **UUIDv7** (RFC 9562) gives 122 bits of collision
resistance *and* lexicographic time-ordering, doubling as the tiebreak within §18.5's topological
order. If short ids are ever wanted, base62-encode a v7 — never drop entropy.

### 18.3 [~] [Decided] Migration is pre-emptive, resumable, and runs through the normal write layer
**Shipped 2026-08-07** — [readSchema.js](src/data/readSchema.js), see [CHANGELOG](CHANGELOG.md).
Revisit near ~50k records, where the single transaction it relies on becomes a stall worth splitting
— at which point the design below applies again as written:

- **Pre-emptive**, so a switch is instant and there is no staleness window. Catch-up is a
  **re-derivation**, not a restore from a point in time — which is also why §18.7 rejects a snapshot
  tier.
- **Yields to user writes**: migration breaks on any interaction write and resumes when the burst
  ends. Gym-floor latency beats migration throughput.
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
**The problem is narrower than it looks.** A rollback loses nothing — the newest bucket keeps full
fidelity while the PT reads a degraded older one. The loss happens only when **the old UI writes**: a
v5 domain object with no v6 concept in it fans out and overwrites the full-fidelity record everywhere.

**Chosen: expand-first staged releases** — never let a supported schema be unable to carry a field.
Free in code, paid for in release discipline. (Rejected: a preservation envelope, an opaque field
older versions round-trip verbatim — if staging guarantees projections are not lossy, there is
nothing to reconstruct.)

- **The rule staging obligates**: *no feature ships until its storage has shipped in every currently
  supported schema* — the field lands N releases before the UI that uses it. **Enforced in CI**
  (`test_star_write_invariants.py`), because without a check the discipline survives until the first
  hurried release.
- **Projections must be pure and total** so buckets are always re-derivable — enforced by
  `test_projections_are_idempotent_and_invertible`.
- **Escape hatch**: a change that genuinely cannot be staged is the trigger to **EOL the incompatible
  schema**, not to ship a lossy projection.
- **Reading degraded is mild; WRITING degraded is the danger.** A wrongly displayed HIIT exercise is a
  display problem; a PT *logging into that wrong view* produces bad data that fans out everywhere. So
  the signal belongs at the point of writing, announced app-wide via §18.12's ribbon.

### 18.5 [x] [Decided] Ordering is topological, not chronological
Replay order means correct **foreign-key availability**, not timestamp order.
[recordReferences.js](src/data/recordReferences.js) declares the reference graph (structural
ownership only) and a DFS cycle check is asserted in CI. Today's graph is trivial; the point is
catching a future convenience back-reference before a trainer does — **§17.4 is the first realistic
cycle risk.** The wall clock is not an ordering key anywhere.

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
- **Forward-migration consent at import.** Today's prompt covers *what you lose from this device*;
  it does not yet say what the import does to the file's own portability: *"This backup is from
  schema 3. Importing brings it forward; it will no longer open in older builds."* Declining must
  leave the `.json` byte-identical — no half-import, no helpful in-place upgrade.

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
Resolved in favour of the one-build model. Three deep-link invariants that follow and still apply:
**never version-qualify a shareable link**; a **removed or renamed route becomes a permanent alias**
retained forever, so a link to a retired behaviour resolves to the nearest surviving ancestor rather
than erroring; and **deep links carry the `lineageId`**, never a per-schema id (§18.2).

### 18.11 [~] [Open] Legal gaps this design creates
- **Retention basis is undocumented.** No-deletes + anonymization-only + fan-out is technically fine,
  but GDPR Art. 5(1)(e) wants a *stated* retention period. "Retained indefinitely for aggregate
  analytics" is lawful only if written down; neither [PRIVACY.md](PRIVACY.md) nor §17.3 says it.
  **Cheapest item in this file — one paragraph.** The only bullet here still open.
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
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). The properties §18 relies on are *invariants across
releases*, which a per-commit gate can hold and review cannot: none can ever be tested against a real
PT's data, because that data is local-only by design.

### 18.14 [x] One numbering axis, and a disposable preview schema — shipped 2026-08-10
Record schemas and the migration chain used small integers for **different** things (`{2, 3}` vs
`1–4`+`P`), so "schema 3" meant two things in two files. Unified: `LIVE_SCHEMAS` is `{4, P}` and 4 is
the same 4 the migration chain ends at. See [CHANGELOG](CHANGELOG.md). Two rules this pins:

- **`schema4` is durable, `schemaP` is not.** P is the shape *this build* reads; its fields may change
  on any commit, so it is never a source of truth for anything outliving the build. It is rebuilt from
  schema 4 whenever the recorded build SHA does not match the running one — and an **absent** marker
  counts as not matching, so "we don't know which build wrote this" costs a projection pass rather
  than risking a read of fields that are not there.
- **Non-numeric schema keys must be threaded, never coerced.** `Number("P")` is `NaN`;
  `Object.keys(LIVE_SCHEMAS).map(Number)` once sent every star write to a `schemaNaN` store that does
  not exist, failing 139 of 141 e2e tests on a splash timeout. Use `liveSchemas()`.

---

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
      typed client name would land in history, screenshots and shared links. **Separately and needing
      no URL decision: the exercise library silently resets its chip and search box whenever
      `renderExercisesList()` is called with no arguments — a real bug, and a cheap fix.**
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
**Closed 2026-08-05** — [CHANGELOG](CHANGELOG.md); the seam is [DATA_MODEL §7](docs/DATA_MODEL.md).

**Two shapes that break naive consumers**, worth keeping in front of anyone writing a fixture: a
planning draft carries `isPlanning: true` and NO `startDate`/`endDate`, and a session opened from
history has `sourceSession: null` unless it was a plan. `buildSessionMeta`'s 2h `endDate` clamp is
load-bearing — `recoverActiveSession()` discards a cache more than 2h past its scheduled end.

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
**The cause was the Font Awesome CDN stylesheet (§12.6), vendored 2026-08-05.** The measurements, and
the list of things ruled out so they are not re-derived, are in [CHANGELOG](CHANGELOG.md); the
per-stage budget and the diagnostic that generalises (**a tight cluster of near-identical durations
is a timeout, not work**) are in [AGENT_RULES §2.A.3](AGENT_RULES.md).

**One loose end**: the navigation timeout was raised 30s → 60s while chasing this. With the cause
fixed, consider reverting it so any future stall fails fast and cheap.

## 22. [x] Two `src` defects found while testing — FIXED
Fixed 2026-08-05 — [CHANGELOG](CHANGELOG.md). **The general lesson**: a stub that hand-duplicates
production wiring will agree with itself and disagree with the app. Mount the real `bootXyz` step, or
the test proves only that the test is self-consistent.

---

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
  one-shot** and should be spent only once §23.5's recording exists. Durable placements beat any
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
See [CHANGELOG](CHANGELOG.md). `src/theme-boot.js` keeps its own small copy deliberately: it must stay
import-free to run before first paint.

### 24.2 [x] Stage 2 — two `formatDuration`, two `escapeHTML` — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md). The two durations were deliberately **not** merged; the duplicate
`escapeHTML` was, because `build/frontend_audit.py` recognises the *name*, so a local copy passes the
audit while being free to drift.

### 24.3 [x] Stage 3 — the board render leaves `controllers/` — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md), which also records why `correctness/noUndeclaredVariables` is on
despite not being in Biome's recommended set.

### 24.4 [x] Stage 4 — split the rest of `activeSessionController.js` — shipped 2026-08-07
`domain/sessionPlanFactory.js`, `domain/quickSignals.js`, `domain/sessionFocus.js` and
`domain/sessionHistoryRecord.js` — see [CHANGELOG](CHANGELOG.md) for the three defects it surfaced.
The rule that decided the split boundary: **the quick-signal DECISIONS are pure while the MUTATION is
not**, so the controller keeps thin wrappers rather than the whole thing moving.

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
See [CHANGELOG](CHANGELOG.md). `src/domain/` is ranked in `import_layers.py` between `data/` and
`modules/common/`.

**The line to hold when adding to either**: **`data/` is records at rest** (shape, identity, ordering,
persistence); **`domain/` is the training vocabulary** (what a modality is, how reps and load are
authored, what a session's clock means) — pure, no DOM, no storage. Three modules went to `data/` and
not `domain/` on that test, and the layering itself decided the last one: `position` is a stored
FIELD, `sessionCache.js` needs the logic keeping it well-formed, and a `data/` module may not import
upward.

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

**Shipped 2026-08-10** — [overflow_scan.py](agent_tools/overflow_scan.py) plus
[tests/e2e/test_layout_overflow.py](tests/e2e/test_layout_overflow.py); the rules the sweep learned,
and the real defect it found, are in [CHANGELOG](CHANGELOG.md). Every other test in this repo asserts
*semantics* (text, counts, ids); this one asserts *geometry*, which is the class of bug a trainer
hits on the gym floor and the pipeline never saw.

### 25.1 [x] Invariant A — nothing extends past its clipping boundary
Each visible element's `getBoundingClientRect()` against the client box of its nearest **clipping
ancestor** (`position: fixed` escapes that chain and is bounded by the viewport **horizontally
only** — a bottom sheet is not a bug). **The mechanic worth keeping**: `body { overflow-x: hidden }`
already masks this whole class, so `documentElement.scrollWidth` reads clean today and forever. The
check has to be geometric and per-element to see the true layout box.

### 25.2 [x] Invariant B — nothing overflows its own box
`scrollWidth > clientWidth + 1` and the height equivalent, exempted **per axis** by what the element
itself declares: `auto`/`scroll` is self-declaring intent, `visible` is skipped (a non-clipping
element reports its children's overflow as its own, so one defect would repeat up the whole chain —
Invariant A names the offending child once), and the ellipsis / line-clamp idioms state their intent.
Bare `overflow: hidden` with real overflow is the silent-clipping case, and the one worth finding.
**No test-side allowlist** — intentional clipping opts out in the markup as `data-clip="intentional"`,
reviewable in a diff and travelling with the component.

### 25.3 [x] Where it runs
With demo data seeded, one page context per device walks every route in
`src/controllers/routes/routeTable.js` — views, then each route-backed dialog while OPEN — via
router-driven `pushState`, so ~20 routes cost one cold boot (~12.5s of call time per walk). Devices
are **iPhone 14 (390×844)**, **Galaxy S23 Ultra (412×915)** and **desktop (1280×800)** (where
`body`'s 480px column, not the window, is the edge), plus **one Slovenian pass** at the narrowest
width, because overflow is a text-length bug. A fifth test needs no browser: it diffs the walk's
route list against `routeTable.js`, so a route added later fails until someone decides whether its
view can overflow.

### 25.4 [x] One sweep, two consumers
Per [AGENT_RULES.md](AGENT_RULES.md) §6 the JS lives in ONE module, used by the e2e suite and
runnable directly as a diagnostic (`--device`, `--viewport`, `--invariant`). Its own tool rather than
a flag on [layout_probe.py](agent_tools/layout_probe.py), which stays about *named selectors*.

### 25.5 [x] What it found
One real, phone-only defect — the edit-mode status chip pushed 169px outside the ellipsised session
title, entirely invisible, and the only thing on screen distinguishing editing a LIVE session from a
future one. **Reordering did not fix it, it only chose the casualty**; an ellipsis eats whole
ELEMENTS, so the fix was structural (flex row, `min-width: 0`, only the client name shrinks). Three
false positives came first, each buying a rule now written into the tool — see
[CHANGELOG](CHANGELOG.md).

### 25.6 Status
- [x] The tool, its unit tests, and the four-device e2e suite; full gate green 2026-08-10.
- [ ] `tests/medium/_overflow.py`, so an existing component test adds one line after mount and gets
      per-component attribution. Cheap, and the sweep already exists.

**Cost, measured**: ~50s of call time across the four walks, ~13s on stage 3's floor once fanned out.

---

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
**The transport is a shared FILE, not a link** (§1.7, ruled by Simon). Nothing below is being built:
there is no URL payload, so there is no codec, no fragment, and no compression. The reasoning is kept
because it is the argument for why a URL was never the right place for this data — which is the same
argument that makes the file transport correct.


Name / email / phone / goals / injury plus `gdprConsent` is ~400–600 bytes of JSON;
`CompressionStream('deflate-raw')` + base64url takes it to ~250–400 characters. The codec belongs in
`src/data/` with a round-trip unit test in [tests/unit_js/](tests/unit_js/) — pure logic, no DOM, no
persistence.

**In the fragment (`#`), never the query string.** A fragment is not sent to the host, so it never
reaches GitHub Pages logs or a `Referer`, and WhatsApp's link-preview crawler cannot fetch it. This
is §19.2's URL-privacy question in its sharpest form — the payload is names, phone numbers and
health data rather than an opaque id — and the fragment is what keeps it off every wire except the
two devices that already hold it.

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
   encoder, pinned and checksummed the way Node and Biome already are ([AGENT_RULES.md](AGENT_RULES.md) §5.2)
   — no npm, so nothing a JS-side dependency audit would need to cover.

### 26.4 The trainer's own QR needs no code at all
It encodes a **static** URL, so it is a pre-rendered SVG in `assets/` — printable, stickable on the
gym wall, one file per language variant. No runtime encoder on the trainer side in either phase.

### 26.5 [x] Import is a review, never an auto-save — 2026-08-17
Anyone who photographs the wall QR can craft a payload, so the review dialog is the trust boundary,
not a nicety. It also carries **dedupe**: match email/phone against existing clients and offer
"update existing" rather than minting a second Jane Doe — the same key
[UC4](use_cases/uc4_client_self_subscription.md) already uses to reconcile bookings, so the two
should agree on it. Sits naturally inside §5.2's "creation is a minimal modal, editing is inline"
decision.

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
Built as `clientErasure.js`; see [CHANGELOG](CHANGELOG.md) and §17.3. The framing this section
argued for survived into the implementation: **per-field redaction inside shared records**, not row
removal, because a completed group session with three participants is simultaneously two *other*
clients' training record. Art. 17 is not absolute either, so what a trainer gets is "redact identity,
keep the training record" rather than a delete button.

What the section did not anticipate, and is the part worth remembering: **two Jane Does is ordinary
in a gym**, and it is where a name-based sweep does real damage. Prose in records the client *owns*
is rewritten; text several clients share is left as typed and reported for a human pass.

### 27.2 [x] Access & portability (Art. 15, 20) — shipped 2026-08-11
Built as `clientDataExport.js` + `encryptedExport.js`; see [CHANGELOG](CHANGELOG.md). Whitelist-scoped
to one client, so this section's central hazard — the whole-database backup carries every *other*
client's Art. 9 health data, and sending it to answer an access request would itself be a breach — is
structurally hard to hit rather than filtered against. Both renderings landed: Markdown for Art. 12(1)
legibility, JSON for portability, from one projection.

### 27.3 [x] Erasure does not reach the copies — closed 2026-08-11 by the register
Settled as **prune on restore**, the option this section thought was the less obvious one. The
recursion it flagged is real and is what shaped the answer: the register stores a **salted hash per
entry** and nothing else, so what is retained after an erasure request is the minimum needed to
honour it. Applied at import, before restored data becomes live. See §18.11 and [CHANGELOG](CHANGELOG.md).

The half that is still true: a backup file sitting in Drive **still contains the name**. The register
neutralises it on the way back in, which is what protects the trainer's own database; it does nothing
about a copy someone else holds. That belongs in the retention paragraph §18.11 still owes.

### 27.4 [x] Withdrawal as easy as consent (Art. 7(3)) — 2026-08-14
The letter now carries the route, not just the right. Consent is given by replying **"I CONSENT"** /
**"PRIVOLIM"**; withdrawal is replying **"WITHDRAW"** / **"PREKLICUJEM"** to the same message. That
symmetry *is* the Art. 7(3) standard — withdrawal must be as easy as consent, and the same reply to
the same person is exactly as easy, not merely possible.

**No prefilled `mailto:` to the trainer, because the app stores no trainer contact** — and it does
not need to. The letter reaches the client *from* the trainer's own address (a `mailto:` opens the
trainer's mail client), so reply is already the one-tap route, and it survives the trainer changing
address. A stored contact would have been a second thing to keep correct for no gain.

Both channels carry it: a client sent the short SMS variant never receives the email letter, so a
route living only in the email is missing for exactly the clients reached by the shorter channel.

`CONSENT_FORM_VERSION` deliberately **not** bumped, on the 2026-08-10 precedent recorded in
[the template](docs/templates/en/Client_Consent_Form.md): purposes, recipients, retention and the
rights on offer are unchanged, and making an existing right easier to exercise does not make earlier
consent cover less. A bump would have asked every signed client to re-sign for nothing.

**Still open, and a different item: nothing RECORDS a withdrawal.** `gdprConsent` holds
`{cloudSync, consentDate, formLang, formVersion, timestamp}` and no withdrawal state, so a trainer
acting on the reply can only untick the box — which destroys the evidence that consent was ever
given. Art. 7(1) requires being able to demonstrate that it was. See §27.7.

### 27.7 [x] Record a withdrawal instead of erasing the consent — 2026-08-14
Surfaced building §27.4. Withdrawal arrives as a message; the trainer's only way to act on it today
is to untick the consent box, which leaves a record indistinguishable from a client who never
consented at all. Art. 7(1) requires demonstrating that consent *was* obtained, and §3.5's
`formVersion` stamp exists precisely to answer "who is still covered?" — a question that needs
"consented on X, withdrew on Y" rather than silence.

Shipped as [clientConsent.js](src/data/clientConsent.js), and it needed **no schema bump** —
`gdprConsent` is `type: "object"` in [recordSchemas.js](src/data/recordSchemas.js) with no inner
schema, so `withdrawnDate` is additive.

**Unticking the box now records the withdrawal rather than blanking the record.** That was the
actual defect: `readConsentFromSection` wrote `{cloudSync: false, consentDate: "", formVersion: "",
formLang: ""}`, so the only action available for honouring a withdrawal destroyed the proof that
consent had ever been given. `cloudSync` stays the "may I process?" flag every caller already reads,
so nothing had to learn a second rule; the signed date, wording version and language survive beside
the new `withdrawnDate`. Re-ticking drops the withdrawal date, because signing again is a new
consent and not an undo.

**The archiving dialog was telling trainers the wrong thing** and was corrected in the same change:
it said "if the client withdraws consent, delete their records here", which conflates Art. 7(3) with
Art. 17 and loses the withdrawal record along with everything else. Withdrawal halts processing;
erasure (§27.2) is a separate request the client makes, and they may well want their history kept.

Three states now render distinctly — never consented, consented, withdrawn — in the profile badge
and in the client's own Art. 15 export, since the subject reading it is the person most entitled to
see that their withdrawal was acted on.

### 27.5 [x] The doc describes what a trainer can actually do — 2026-08-11
Resolved by the other branch: [PRIVACY_FOR_TRAINERS.md §5](docs/PRIVACY_FOR_TRAINERS.md)'s rows name
**Export data (GDPR)** and **Erase client (GDPR)**, and both now exist. The rule stands for whatever
this doc promises next — a compliance document naming a button that does not exist is worse than one
saying "do this by hand", because the trainer discovers the gap while a statutory clock is running.

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
