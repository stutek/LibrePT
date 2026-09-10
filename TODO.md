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

Shipped 2026-08-02, manual-only as of §3.10 — [CHANGELOG](CHANGELOG.md) carries the decisions worth
not re-litigating (no visible Drive file ever; three-way merge, so no Lamport pair and no tombstones).
Setup steps live in [docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md), written against role
handles and naming no credential, so the procedure is reviewable in the open.

**Unblocked 2026-08-12** by a real OAuth client id in
[driveSyncConfig.js](src/data/driveSyncConfig.js). Two consequences worth knowing:

- **Only listed test users can grant access.** The OAuth app is in *Testing*: 100 explicitly-listed
  accounts, everyone else gets `403: access_denied`, and refresh tokens expire after 7 days. Demo
  users are unaffected (`?init=demo_data_load` never contacts Google). Publishing WITHOUT verification
  is the useful middle state — it drops the manual list and the 7-day expiry, keeping the 100-user cap
  and an "unverified app" warning.
- **The connected state is unreachable from any Playwright tier** — Google fingerprints and blocks
  automated browsers on `accounts.google.com`, which is what [tests/live/](tests/live/) exists for.
  `tests/medium/test_drive_sync_ui.py` pins configured-but-not-connected instead.

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

Three requirements from the original scope still bind any change: it must be clearable **without Google** (a downloaded backup resolves it exactly as a sync does, or a warning colour is a growth prompt and trainers can tell); it is **not the same number as §3.9's ↑**, which is Drive-relative while this is backup-relative; and it escalates by **colour, never animation** — a permanent pulse in a fixed header is ignored within a day and devalues the PREVIEW badge beside it.

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
(`PIPELINE_STAGES`). See `build/__init__.py` for the staged definition and
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

### 8.1 [x] Bind multiple clients to one shared set of exercises — shipped 2026-08-22
Two or more participants bound to the same exercises, merged into a single combined view — they train
the identical programme in lockstep, so the trainer logs it once instead of switching tabs.

- The **cards are shared**: navigating/logging advances the plan for the whole group.
- **Feedback stays per-person** — one client can find a shared set too hard while another finds it
  too easy.
- **The model, decided by building it**: bound participants SHARE one `clientState` object
  ([participantBinding.js](src/domain/participantBinding.js)). Every existing write — a set logged, a
  round completed, an exercise swapped in the editor — then lands for the whole group without a
  single write site learning that bindings exist; a mirror-on-write would have been a side effect at
  a dozen seams, each of which could be missed. Feedback needed no work at all: it lives on the
  SESSION keyed by client, never in the plan, so "too hard for one, too easy for another" was
  already true.
- **A bound group is one tab**, named with its members' initials — three tabs that always show the
  same plan invite three taps to check whether they still do. One control in the ⋯ menu binds and
  unbinds; unbinding hands each member a COPY of what they were training, because dropping the
  binding alone would leave them holding one object and the next set would still appear for both
  (found by a test, not by reasoning).
- **The bindings are stored beside the plans they join**, because the live session is cached as JSON
  and object identity does not survive it — a restored session would otherwise come back silently
  unbound, logging each set for one person.
- Still open: §1.2's multi-line titles, and per-person signals from INSIDE the bound tab (today the
  trainer unbinds, or switches to that person's tab, to log one).

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

### 8.8 [x] Copy the program to another participant — shipped 2026-08-22
**Raised 2026-08-09 (Simon); built once §8.1 made its open questions answerable.** *Copy this plan
to…* in the session ⋯ menu, listing the other participants by name.

**Every open question below, answered by building it:**

- **To whom** — a participant in the same clipboard, which was named here as the common case (a
  walk-in joining a session underway). Listed by NAME rather than performed by a single action,
  because "to whom" is the entire question and a control that guessed would answer it for them. The
  same client's next session and a routine template stay §17.4's business.
- **What** — the prescription only ([planCopy.js](src/domain/planCopy.js)): movements, targets, rests
  and circuits. Logged sets and completions stay with whoever did them, or a copy would write a
  stranger's numbers into this person's history.
- **Placement** — the ⋯ menu, beside *Everyone on this plan*, rather than the title bar: the bar was
  measured at 48px of icons against 169px of title on a 390px phone (§30.1's neighbourhood), and the
  unit being copied is the whole programme, not a card.
- **Against §8.1** — the two are deliberately adjacent and deliberately different, and the menu now
  states both in one place: a copy DIVERGES the moment either plan is edited, a binding never does.
  Each item gets a fresh id, circuits remapped together, so nothing is shared by accident.

The original notes, kept because they are what made the answers obvious:

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
**Raised 2026-07-26 (Simon); shipped 2026-08-18.** [crashReport.js](src/data/crashReport.js) builds
the payload, [appLifecycleController.js](src/controllers/appLifecycleController.js) installs the
`error`/`unhandledrejection` listeners as the FIRST boot step (a crash during boot is the one a
trainer can least describe), and the notification feed offers it. Five constraints that still bind:

- **Non-identifying by construction, not by redaction** — a fixed field list (message, stack, route,
  build, time) and anything else a caller passes is dropped, because a pass that strips known-bad keys
  fails the first time someone adds a field nobody remembered to strip. Names, notes and injuries are
  Art. 9 data (§17.3) and the issue is public.
- **Offer, never send.** A prefilled GitHub issue URL the trainer reviews and submits; no server, no
  telemetry, no `connect-src` change. Automatic reporting would be unannounced egress of a PT's data.
- **The feed, not a modal** — a handler rendering over a live session mid-set is worse than the bug it
  reports. An e2e case asserts no dialog opens and the app stays usable after an uncaught throw.
- **The handler cannot throw**, and a failure inside it is deliberately silent: there is nowhere left
  to report a failure to report.
- **A repeat collapses into a count**, so a render loop throwing every frame cannot evict the report
  that explains how it started. Kept distinct from the integrity error page (`sw/integrity.js`) — a
  corrupt download must never be reported as an app bug.

**The wiring bug the tests caught**, and the reason that e2e case exists: `appBoot.crashLog` was
imported but never re-exported, so the feed asked for the crash log, got `undefined`, and rendered
nothing — silently, because a missing optional dep looks exactly like "no crashes yet".

**Still open, and a maintainer decision: §23.5's feedback route for a PT without a GitHub account.**
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
Resolved in favour of the one-build model. Three deep-link invariants that follow and still apply:
**never version-qualify a shareable link**; a **removed or renamed route becomes a permanent alias**
retained forever, so a link to a retired behaviour resolves to the nearest surviving ancestor rather
than erroring; and **deep links carry the `lineageId`**, never a per-schema id (§18.2).

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

Asked for after CI failed on a test that had passed locally three times. Four divergence classes were
visible in one day's evidence; three were closed:

- **Wall-clock dependence.** Browser tests run on a frozen `Date.now` ([conftest.py](tests/conftest.py)),
  so the demo seed's relative times, day buckets and overdue labels are identical whatever hour the
  suite runs. Four tests had been deriving "today" from the HOST clock and comparing it against the
  app's — agreement by luck, and already a midnight race.
- **Suspend detection.** `_timed_task` compares monotonic against wall time and says so when a task
  spanned a gap it did not spend working ([build/__init__.py](build/__init__.py)). A time jump means
  the run was interrupted, not that the change regressed — it previously relied on somebody noticing
  timestamps by eye, which failed twice in one session.
- **One Python declaration.** CI ran 3.11 while this machine ran 3.14.4 with nothing saying so. The
  first fix bumped thirteen `python-version:` literals and added a checker that they agreed, which the
  maintainer rejected outright — *"12 pins for python? that is not single source of truth"*. There is
  one declaration now (`.python-version`), read by every job via `python-version-file:` and by pyenv,
  so drift is impossible rather than detected. [python_version.py](agent_tools/python_version.py)
  keeps what a file cannot: this machine on the declared minor, plus a guard against literals
  returning.
- **A shared wait for durable writes.** Two tests raced the write queue in one day (signup, then RSVP
  ingestion): both wrote, then did a full page load that re-read IndexedDB before the enqueued write
  had flushed. `wait_for_stored_record` in [conftest.py](tests/conftest.py) is the one wait now, taking
  a field/value dict rather than a JS predicate — the first draft used `new Function`, which the app's
  own CSP forbids.

**Left deliberately**, as theoretical rather than observed: an opt-in stress mode (higher worker count,
to surface write-queue races on purpose) and randomized test order with a printed seed.
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
is a timeout, not work**) are in the per-stage budget table.

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
The JS lives in ONE module, used by the e2e suite and
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
- [x] `tests/medium/_overflow.py` — 2026-08-21. `assert_component_fits(page, root)` after mount; the
      sweep gained a `root` selector that scopes which elements are asserted, not what they are
      measured against, so the boundary is still the real page's. Defaults to a 390px phone, because
      a medium test that set no viewport sweeps at a desktop default where nothing is tight enough to
      break, and a missing root fails rather than sweeping nothing. Its own tests plant an overflow
      and assert the failure names the element; wired into the clipboard title bar (§25.5's defect)
      and the signup review dialog.

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
   encoder, pinned and checksummed the way Node and Biome already are
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

---

## 28. Reported 2026-08-18 — bugs and changes, unverified

Captured verbatim from the maintainer and **deliberately not investigated**: recorded at the end of a
long session so a clean one can pick them up with fresh context. Each is as-reported, so the first job
on any of them is to reproduce it, not to trust this description. Section numbers below are for
reference only and imply no ordering.

### 28.1 [x] Comments and docstrings must name a constant, not repeat its value — 2026-08-18

See [CHANGELOG](CHANGELOG.md). Swept: `deploy/local_http_server.py`, `build/__init__.py`,
`src/modules/common/consentForm.js`, the three `agent_tools/` usage docstrings, and
the tests that had a deployment address written into them (those now use obviously foreign hosts,
which is also the better test — they pin how a link is BUILT, not where this app is deployed).
`dev_server_url()` was added alongside, so nothing has to write out the port and base path together.

**What remains, and it is §28.2's, not this one's**: `README.md`, `CONTRIBUTING.md` and
`docs/GOOGLE_CLOUD_SETUP.md` still spell out addresses, because every one of them is a string a human
copy-pastes into a shell, a browser or the Google console — `git clone {{ISSUE_TRACKER_URL}}` helps
nobody. Those files are not built, so they cannot be injected into; which contributor-facing docs get
built is exactly §28.2's open question. `constant_copies` reports them meanwhile, so they are a list
rather than a forgotten corner.

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

See [CHANGELOG](CHANGELOG.md). `python -m agent_tools.constant_copies`, a **diagnostic and not a
gate**, exactly as decided: it earns a Stage 1 task by catching something twice, not before. It is now
the first step of the fortnightly duplication sweep above.

One row was dropped during the build and the reason is worth keeping: `DEV_SERVER_BASE_PATH`'s value is
the repository's own name, so its literal matches every absolute path on the maintainer's disk and
every link into the GitHub repo. A constant whose value collides with unrelated text is not trackable
this way, and a check that cries wolf is one nobody runs.

### 28.4 [x] BUG — a collapsed deck card's first line is unreadable — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The "unless it is a past card" half of the report was the clue: the past
card is LAST in the deck, so nothing is stacked on it. Nothing about past cards was involved, and the
`2fe2464` pointer was right — that fix covered desktop only.

### 28.5 [x] BUG — backup warnings appear in DEMO mode — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Fixed together with §28.6: one predicate, `withoutSeedRecords`, applied
at both counters — the reports were two symptoms of the same wrong question.

### 28.6 [x] BUG — loading demo data increments the ahead counter — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The `seededDemo` stamp pointer in the original note was right, and the
committed seed id set covered the databases minted before it existed.

### 28.7 [x] BUG — the header menu does not work while the messages pane is expanded — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The menu worked; the expanded drawer covered the view it navigated to.
The `753985a` scroll-container suspicion in the original note was a red herring.

### 28.8 [x] BUG — the disabled-backup strikethrough is not visible enough — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). This reverses §3.11's deliberate "informational, never a warning"
treatment on the maintainer's ruling; the reasoning for the reversal is in the commit and the test.

### 28.9 [x] CHANGE — a DEMO tag replaces the PREVIEW tag in demo mode — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The open question — whether both matter at once — was answered by the
one slot: DEMO while the store holds nothing but the demo, PREVIEW from the trainer's first real
record, because that is when data loss stops being hypothetical.

### 28.10 [x] CHANGE — cancellations and bookings accumulate in one message card — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The group takes the place of the FIRST of its members rather than
floating to the top, so the demo-mode notice stays the collapsed summary.

### 28.11 [x] BUG — a cleared browser boots to a splash with no demo or animation offer — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The maintainer's diagnosis was right: the deep link, not the empty
store. Only the `?splash=off` half was overridden — the language half was tried and reverted, because
a share link naming a language must open in it ([test_share_deeplink.py](tests/e2e/test_share_deeplink.py)).

### 28.12 [x] CHANGE — the guided walkthrough wants a glow, instructions and a real hand — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). Two of the three were built: the glow, and a hand that is actually a
hand. The instructions overlay already existed and was left alone.

### 28.13 [x] BUG — a walkthrough reloaded by deep link points at the wrong element — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Target resolution now skips anything with a zero-sized box, so an
inactive view's copy of a selector can never win.

### 28.14 [x] CHANGE — the demo-mode message offers to start the walkthrough — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The "verify all needed data is there" half became
[walkthroughReadiness.js](src/domain/walkthroughReadiness.js), keyed on shape rather than seed ids.

### 28.15 [x] BUG — the walkthrough panel covers the control it points at — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Reported as steps 2 and 4, "sometimes", after scrolling — and both
halves of the "sometimes" were timing: the clearance check ran once per step, right after
`scrollIntoView` and therefore before the scroll settled, and the poll that keeps the spotlight on a
moving target never re-ran it.

---

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

### 30.1 [ ] BUG — loading demo data from the message button freezes the app for a while

Reported: tapping the empty feed's "load demo data" offer appears to hang the app briefly. The
handler seeds the whole dataset and then reloads
([app.js](src/app.js)'s `seedDemoData`), so the freeze is probably the synchronous seed of the full
demo database on the main thread, the write queue flushing behind it, or the reload landing while
those writes are still in flight. Measure before choosing: the fix is different for each — a yielded
seed, a progress state on the button, or reloading only once the queue has drained.

### 30.5 [x] BUG — Show me did nothing on a card, and a second caption sat on the panel — fixed 2026-08-22

**Reported 2026-08-22 (Simon)**, walking the story in the browser:

- *"Show me for three friends arrive does nothing."* It did something, and that was the problem: it
  spent three seconds walking a pointer to the **Continue button already under the reader's thumb**.
  From outside, a guide that pauses for three seconds and then closes a card is a guide that has
  stopped working.

  **Fix, in his words: "for steps that have no Show me, merge them with the next one".** A card is
  now attached to the step it introduces — read it, then do the thing it is about, and the first tap
  anywhere takes it away. One rule, [foldCards](src/modules/demo/storyTour.js), so the chapters stay
  readable as a sequence: the card is still written where it belongs in the story. A card with
  nowhere to ride — the last step, or the handover to the client's phone — stays a step and declares
  `showMe: false`, and the guide hides the button rather than offering a dead one. The story went
  from 35 steps to 31, all of them things a person does.

- *"Steps 3 and 4 have an overlapping black subtitle over the buttons."* The story's own caption bar,
  fixed to the bottom of the screen, over the guide's panel — which carries the same caption. The bar
  was written when the story played itself and nothing else showed captions; it has had no reason to
  exist since the story became guided. Gone, and the card now sits in the upper half so it cannot
  cover the panel either.

- **Found while fixing the first**: dismissing the card on the first tap ALSO fired for taps on the
  guide's own panel, so Show me made the card vanish before the pointer reached it.

- *"Step 2 of 31 … this step didn't complete."* The ☰ menu closes on any click outside it, and Show
  me is outside it — so the guide closed the menu holding the item its next step points at.

**Asked while fixing this (Simon): "do you have other TOOLS that should really be tests? fix
them."** One did, and it was the one written the same day: the icon RENDER check. It asserts
something that has to stay true — every icon draws, and draws the shape it drew before — so it is
[tests/e2e/test_icons_render.py](tests/e2e/test_icons_render.py) now, importing the rendering from
the tool rather than reimplementing it. What stayed a command is recording the baseline, which is a
deliberate act taken with a regenerated font. The same question was asked of the rest of the catalog:
the gates are already gates, and what is left (the font subsetter, the icon rasteriser, the demo
recorder, the layout probe, the credential minter) either PRODUCES a committed artifact or explores a
running page, and neither is a claim a build can hold.

A story walker was written and deleted in the same hour for the same reason: the e2e suite already
walks the story, so a second walker was a second thing to keep true. What it was really offering was
a readable failure, which is now what the suite gives — the step, its caption, what the guide said,
and what was on screen.

**Three surfaces, one rule, now declared once**: [isGuideSurface](src/modules/common/dom.js). Every
"tap outside closes me" rule in this app means *outside the thing you are working on*, and the guide
floats over the app: its panel and its story card are the trainer working the GUIDE. The plan editor,
the ☰ menu, the session menu and the card's own dismissal all ask the same question of the same
helper now. Pinned by [test_guide_is_not_the_app.py](tests/medium/test_guide_is_not_the_app.py),
which tests the TAP — the demo's own walk missed all three, because it taps Show me at moments where
the closure happens to do no harm.

### 30.4 [x] BUG — the guide asked for a screen the trainer was already past — fixed 2026-08-22

**Reported 2026-08-22 (Simon), with a screenshot**: "step 1 of 4 on the clipboard view" — the panel
said *open the group session* over an already-open clipboard. The app opens a live session on its own
(the demo seed has one in progress), so the first step was satisfied before anyone read it.

**The fix is to move past it, not to undo it.** The first attempt re-checked the PRECONDITION on
every poll tick and rebuilt the ground when it failed — which turned the guide against the trainer:
tapping the session card themselves opened the clipboard, and the guide navigated straight back out
of it. A test caught that within the minute. What is right is narrower: a step already satisfied when
the guide ARRIVES at it is one the trainer is past, so the guide advances to the one they are not.
Never on Back, where a step returned to stays done and stays put — otherwise Back does nothing at all
and gets tapped twice.

Two more from the same session, both real beyond the demo:

- **The highlight lagged the control.** "When Show me clicks a collapsed card, the card expands way
  faster than the surrounding border highlight" — a card expanding fires no scroll and no window
  resize, so the ring sat on the old geometry until the next poll tick, up to a quarter second. A
  `ResizeObserver` on the target sees it in the same frame.
- **Two looks for the same three buttons.** Too Easy / Too Hard / Notes were grey and 32px tall
  inside a circuit and coloured and 40px on a standalone card. §7.2 already said in words that the
  two must agree; the circuit rows now wear the deck's own classes, so the look comes from one place,
  and [test_signal_buttons_match.py](tests/medium/test_signal_buttons_match.py) says it in a way that
  fails.

### 30.3 [x] BUG — a cleared browser plays the demo to an empty room — fixed 2026-08-22

**Reported 2026-08-21 (Simon):** clear the browser data, open a demo deep link, and you get neither
the language choice nor the demo. Two independent causes, both invisible to the whole e2e suite
because the shared fixtures auto-accept the terms and auto-dismiss the splash — so the first test
written for this had to build its own browser context
([test_first_run_deeplink.py](tests/e2e/test_first_run_deeplink.py)).

- **Seeding the demo answered the language question.** `seedMockData()` set `lang = state.lang ||
  "en"`, so a store that had never chosen one came out of the seed looking as though it had, and the
  splash skipped the step. Seeding is about RECORDS; the preference is the person's to give. The
  line is gone.
- **The demo started as soon as the app was wired**, which on a first run is BEHIND the mandatory
  terms modal — measured: all sixteen steps played out and finished at ~44s while the agreement was
  still on screen. It now waits on the splash's own promise (which also covers the language step, so
  the demo narrates itself in the language just chosen) and on the agreement being closed. Started,
  never awaited: `init()` must finish wiring whatever the trainer is reading.

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

**Wanted 2026-08-19 (Simon):** a link support can send by SMS or email that opens a **consent dialog**
asking the trainer to confirm a data wipe. *"Link should not be advocated"*, it should offer a wipe
**per schema version (plus unversioned data)**, and it must carry the note that **exports and backups
are not removed from storage the app does not own.**

**Shipped as `/wipe`**, every one of those honoured. Asked on 2026-08-23 whether it existed yet: the
pure planner ([dataWipe.js](src/data/dataWipe.js)) had been built with the spec and nothing called
it, which is the shape of a feature that looks done in a diff and does nothing in an app.

- **The stores are read from the DATABASE, not from this build's schema list**
  ([listDatabaseStores](src/data/indexedDb.js)). A long-lived install accumulates stores from builds
  this one never made, and a wipe that cleared only the familiar ones would leave a trainer's data
  behind while telling them it was gone.
- **Stores are EMPTIED, not dropped.** Dropping one needs a version change, and a half-applied
  upgrade is a worse state than the one they called support about. An empty store reads as no data
  everywhere in this app.
- **It reloads afterwards.** Every module in the page is holding state from a database that no longer
  has it; asking a dozen of them to notice would be a dozen places to be wrong.
- **Linked from nowhere**, as asked. No menu item, no button — a permanent "erase everything" control
  on a phone used one-handed is a mis-tap waiting to happen, and anyone who has not been sent here by
  someone helping them has no reason to be here.

### 31.1 The one invariant

**The link carries no authority.** Opening it can only ever OPEN A DIALOG; there is no parameter that
performs the wipe, no `confirm=1`, no auto-run after a delay. A URL that destroys data on open would
be one forwarded message away from destroying a stranger's — and support links are, by their nature,
sent to people who are already confused and inclined to tap.

That makes the dialog the whole security boundary, so it: names the device it is about to erase,
lists what will go by schema, states what it CANNOT reach, and requires a deliberate confirmation
rather than a default-focused OK.

### 31.2 What it wipes, and what it cannot

Storage is `librept` in IndexedDB — one store per live schema (`schema4`, `schemaP`, and any older
store a long-lived device still carries) plus a `meta` store — and a set of `librept*` localStorage
keys. So the offer is per schema store, plus **unversioned**: `meta` and localStorage, which is where
the active session, read-notification ids, the terms acceptance and the Drive sync meta live.

**Not reachable, and the dialog must say so**: a downloaded backup file, a Drive sync file, an
encrypted export a client was sent, a consent letter already in someone's mailbox. The app can erase
what it holds; it cannot reach into storage it does not own, and a support wipe that implied
otherwise would be worse than none.

### 31.3 Not advocated

No menu entry, no notification card, no link from anywhere in the app. It exists at a URL support
sends deliberately. The support runbook can document it; the product must not offer it — a
"wipe everything" control one tap from the gym floor is a support ticket waiting to happen, which is
also why §9.3's demo cleanup is selective rather than a reset.

---

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

## 37. The browser tiers are CPU-SATURATED, and the pipeline was under-reporting it

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

## 38. [x] Reported 2026-08-25 — the demo's own entry points — fixed 2026-08-25

See [CHANGELOG](CHANGELOG.md).

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

### 38.22 [x] CHANGE — a client's file opens the app, instead of being saved and hunted for

**Asked 2026-08-30 (Simon):** *"a PWA import rabi shranjevanje datoteke iz message-a in nato
odpiranje? … a je branje datoteke preko menija sploh potrebno?"* and, for the demo, *"raje bi videl,
da simuliraš branje sporočila s priponko in odpiranje priponke odpre LibrePT"*, with *"zunanjo
aplikacijo simuliraj z zaslonsko sliko in kartico razlage"*.

**It did.** There was one way in: save the attachment out of the messaging app, open LibrePT, open
the ☰ menu, choose "Review a client's file", find the file in the picker. Five acts, two of them in
somebody else's app, for a file already on the phone.

**Two ways in now, and neither of them saves anything.**

- **`share_target`** — the trainer taps Share on the attachment and picks LibrePT. The OS POSTs the
  file to the app; the service worker answers that POST
  ([sw/sharedInbox.js](src/sw/sharedInbox.js)) because there is no server to, keeps the text, and
  redirects to the app with `?open=signup`.
- **`file_handlers`** — the trainer taps the `.json` itself and the OS launches LibrePT with it,
  which arrives through `launchQueue` rather than as a POST.

Both end in the same review dialog, so the trust boundary is untouched: a share target accepts a
file from any app on the phone, and a human still reads every field before a record is written
(§26.5). What is saved is the fetching, not the reading.

**The menu keeps its file picker, and that is the trade.** Both mechanisms are Chromium's and both
need the app installed; **iOS has neither**. So the picker stops being the main road and stays as the
one that works everywhere.

**Three things had to be got right, each found by building it:**

1. The inbox cache is not a version of the app shell, so `deleteObsoleteCaches` had to stop treating
   it as an obsolete one — a deploy while an unread submission sat there threw away a client's file.
2. A submission that opened during boot put a modal over the splash, and a modal makes the page under
   it inert — including the splash's own dismiss button. The trainer was left on a splash screen they
   could not get past. It now opens after the splash has gone.
3. The submission is read once and dropped: the marker survives a reload, so leaving it in the inbox
   re-opened the same dialog on every refresh.

**The type and the extension are the app's own, not JSON's.** The first version of this declared
`application/json` and `.json`, which would have offered LibrePT in the share sheet for every JSON
file on the phone and claimed the extension system-wide. Asked about directly: *"a nisva rekla, da
bova imela custom mime in custom končnico za uvoz v LibrePT?"* — and the pair was already decided and
already in the code (§1.7): `application/vnd.librept.signup+json` and `.json.librept-signup`, one
home in [data/signupFile.js](src/data/signupFile.js). The manifest now names that pair and nothing
wider, and a check compares the two files so they cannot drift.

**The suffix order was wrong for this, and changed with it.** The file was
`.librept-signup.json`; an operating system associates on the LAST suffix, so the distinctive part
sat where nothing reads it and the only way to be tapped open would have been to claim `.json` —
every JSON file on the phone. It is `.json.librept-signup` now (§1.7, amended 2026-08-30), which is
what makes registering as a handler possible at all. The `.json` stays as a hint to whoever looks at
the file.

**Still not testable here:** whether a given OS offers the app for that suffix is an association, not
a browser behaviour, and no test harness can answer it. **Re-check on a real Android phone before
this is called finished.** A share is unaffected either way — it carries the media type.

**The demo shows the new path.** Three steps — open the menu, choose the review, find the file — became
one: a screenshot of the trainer's messaging app with Ana's message and her attachment under it,
drawn rather than photographed (a picture goes stale the day either app changes and nobody notices).
The attachment is a real button, and tapping it calls the same entry point the share target does
rather than a path invented for the demo. The card quotes the message the app really sends
(`intake_share_text`), so it cannot drift the way the invitation text did (§38.19). The story is 47
steps now, down from 49.

`ScreenshotNarratorCard` is the fifth kind in the card hierarchy (§38.10) and the first to draw a
control of its own, which is what the `extras` hook is for. Its text colours are its own, like the
message card's: a tinted card puts muted text under the AA bar on the light palettes (§38.11), and
the contrast walk now covers it.

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

### 38.19 [x] BUG — the demo could not be finished in Slovenian

**Reported 2026-08-30 (Simon)**, from a Slovenian run, with the card pasted in: *"Korak 16 od 49 …
Tega koraka ni bilo mogoče zaključiti."* Followed by *"ana poškodbo piše v angleščini?"*

**The step asserted the app's English words.** `intake-send` expected
`containsText: "Shared"`; the Slovenian page says *"Deljeno. Trener te bo dodal iz te datoteke."*
The claim could never come true, so the story stopped dead at step 16 for every Slovenian viewer —
and passed every test we had, because the suite runs in English.

Four expectations read translated copy back to the app. All four now ask for a fact instead:

| step | was | is |
| :-- | :-- | :-- |
| `arrive-contact` | `containsText: "text message"` | `#intake-invite-send[data-channel='sms']` |
| `arrive-contact-email` | `containsText: "email"` | `#intake-invite-send[data-channel='email']` |
| `intake-send` | `containsText: "Shared"` | `#intake-status.is-done` |
| `swap-pick-movement` | `containsText: "Swapped"` | `.editor-added-badge[data-callout='swap']` |

Two of those hooks did not exist and were added, which is a small improvement in its own right: the
invite dialog now says which channel it chose (`data-channel`) and the editor says which kind of
callout a badge is (`data-callout`), rather than only rendering a sentence about it.

**And what the demo TYPES is content, so it is translated too.** Ana wrote up her shoulder in English
on a Slovenian phone. A step now says which words with `enterKey` and the expectation that reads them
back uses `hasValueKey` — the same key, so the two cannot drift into different languages — resolved
by `storyStepsFor` where the story becomes a runnable list. Names, addresses, phone numbers and times
stay literal: they are the same in every language. Measured after, in Slovenian: Ana writes *"rama,
pred dvema letoma"*, and step 16 completes.

**The check that keeps the fifth from being written**
([storyLanguage.test.mjs](tests/unit_js/modules/demo/storyLanguage.test.mjs)): a demo step may not
match on text the app says in English and never says in the other language. Verified by putting the
reported bug back and watching it fail — which is also how a hole in the first version was found: it
read the trainer's run, and step 16 is on the client's phone, so it walked straight past the one step
it was written for.

**A false alarm the check taught me something with:** matching the same key across locales flagged
`hasValue: "Ana"` — the client's own NAME, which the demo types — because "Ana" sits inside "Ana's
phone" and Slovenian declines it to "Anin telefon". The rule is therefore about the whole dictionary:
what makes the four real ones real is that the word is absent from the other language altogether.

**Still open, and much larger: §38.20.**

### 38.18 [x] BUG — Show me advanced the demo, or did not, depending on something invisible

**Reported 2026-08-30 (Simon):** *"show me behavior is inconsistent, should it advance always or
never?"* Measured before answering, on two kinds of step:

| the step's expectation when its card arrived | Show me | what happened |
| :-- | :-- | :-- |
| not yet true (the ordinary case) | performs it | **the card moved on** |
| already true — the screen the step before left behind | performs it | **the card sat still** |

So it was neither always nor never: it turned on whether the expectation happened to be true on
arrival, which nothing on screen shows. From the floor that reads as a button that sometimes works.

**Two rules, laid down three days apart, had come to contradict.** The guide's own source still
carried the first one verbatim:

> *"Show me demonstrates the step; it never moves the guide. Next is always the trainer's tap
> (reported 2026-08-23: 'sometimes show me advances demo step sometimes not')."*

…and §38.5 then made the card follow the app whenever a step completed in front of the viewer. Show
me completes a step in front of the viewer, so the second rule quietly overruled the first — except
where `enteredSatisfied` blocked it. The 2026-08-23 ruling was correct when NOTHING advanced by
itself; §38.5 made "never" the inconsistent choice, because doing the step yourself moved the card
and asking to be shown it did not.

**Ruled 2026-08-30: always.** One sentence, one function (`carryCardOn`): *a step completed while the
trainer is watching carries the card on, whether their own thumb did it or they asked to be shown.*

Two exceptions kept, each for its own reason and neither invisible:

- **the last step waits** — finishing is a decision, and a demo that closed itself on the final tap
  would take the thank-you card with it before anyone read it;
- **a step walked BACK to is re-explained, not advanced past** — carrying them on from there would
  skip the step they came back for.

The second needed a distinction the code did not have. A step whose expectation arrives true is
marked done by the very next poll, so by the time Show me is tapped, "already done" cannot tell a
step never seen from one walked back to. `enterStep` now records both facts separately: whether the
outcome held on arrival (`enteredSatisfied`, which the poll uses) and whether the trainer had already
been past it (`enteredDone`, which Show me uses).

Pinned by [test_walkthrough_show_me.py](tests/medium/test_walkthrough_show_me.py) over a three-step
tour built for exactly these cases: one that arrives untrue, one that arrives already true, and the
last one.

### 38.17 [x] BUG — the guide called the screen wrong while scrolling to it

Measured 2026-08-30 at story step 47 (the evening's session move), deep-linked on a 390×844 phone:

```
t+1.0s  busy rebuilding, every button greyed
t+4.1s  "This step needs a different screen — go back to the sessions board and start it again."
t+4.7s  the board scrolls, the control is ringed — the message gone
```

**The screen was right the whole time**, and the first diagnosis here was wrong: nothing was slow to
render and `READY_SETTLE_MS` was never the problem. The Tuesday & Thursday card was on the board from
the first paint, 650px above the fold. What was wrong is the question the guide asked about it.
`isCovered` clamped the control's centre into the viewport before asking `elementFromPoint` what was
drawn there — so a control above the fold answered with whatever sits at the top of the screen, the
app header. The guide then waited out its full 2500ms settle for a control nothing was going to
uncover, said the app was on the wrong screen, and only then ran the scroll that brings it into view.

**Out of view is not covered.** Two changes in
[walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js), and neither touches the settle:

1. `isCovered` asks about the control's real centre, and a centre outside the viewport is not
   covered. Bringing a control into view is the guide's own job — `enterStep` scrolls to it, and
   `moveTargetOutFromUnderPanel` scrolls it out from under the panel.
2. The stale-overlay sweep after a replay no longer asks `stepIsReady` first. It was leaning on the
   old reading: with the control honestly off screen, the sweep stopped running and left the ☰ menu
   the replayed theme step re-opens standing over the very card the ring was about to name.

The step now settles at **t+2.4s with no message at all**, 2.8s sooner than the complaint used to
arrive.

Pinned by [test_demo_story.py](tests/e2e/test_demo_story.py): the complaint line is watched with a
MutationObserver installed before the app boots — a message shown for half a second and withdrawn
again is exactly what a retrying assertion is built to miss — and the ☰ menu must be closed when the
control lands.

### 38.16 [x] CHANGE — the demo card is put away, not shut

**Reported 2026-08-30 (Simon):** *"demo cards exiting does not allow for return to demo, find a way
for the demo card to be collapsed only (just like message area is) that allows for the user to return
to demo"*, with the brainstorm *"do we get rid of the x button on the demo cards?"*

**Yes — and that is the fix.** The corner of the panel held a ✕ that called `stop()`: the most final
act available, wearing the glyph that everywhere else in this app means "close this box". A trainer
who taps it wants the card out of the way for a moment; what they got was the demo over, with no way
back — 49 steps in, that is the whole thing gone to one tap on a glyph that promised less.

- The corner now **parks** the guide, the way the message drawer parks itself: everything but the
  head goes, leaving a bar with the one line worth reading from across the room — which step, of how
  many, on whose phone. Tapping the bar anywhere brings the guide back.
- **It keeps running while parked.** A trainer who does the step by hand with the card out of the way
  comes back to a guide that moved on with them. That is what makes it a park rather than a pause,
  and why the bar keeps the step number.
- **Ending the demo is offered only from the parked bar** — one tap from a guide already out of the
  way, two from one you are reading, which is the right way round for the act with nothing after it.
  It is also the only place the ✕ appears now, on a bar that says DEMO, so it reads as "end the demo"
  rather than "close this card".

Pinned by [test_walkthrough_panel.py](tests/medium/test_walkthrough_panel.py): the bar keeps the step
number and drops the card, the instruction and the buttons; tapping it brings them back; the ✕ is
absent until parked and still ends the walkthrough; and the spotlight keeps following the control
while parked, which is the proof that the guide is still watching.

### 38.15 [x] BUG — a chapter's opening card left the panel nowhere to get out of the way

Found 2026-08-29 in the same hand-walk as §38.13, and confirmed by looking at the screen rather than
at a number: at **steps 23 and 30** — the openings of the programme and gym chapters — the guide's
panel sits **on top of the session card its own spotlight is ringing**. The ring is visible below the
panel's bottom edge with its top half covered.

Both are folded-card steps: the chapter's opening card rides on the first real step, so the panel is
carrying a paragraph AND an instruction. That makes it ~375px tall on an 844px screen, and
`keepPanelClearOf` has nowhere left to put it — moving to the top covers the top half of the board,
which is where the ringed card is. The pure card steps flagged by the same walk (11, 17, 18, 44, 49)
are **not** this: their target IS the card inside the panel, so an overlap is what they mean.

**Measured again on 2026-08-30, this time at both iPhone sizes**, after *"opravi še isti prehod dema
na iPhone resoluciji in popravi čudno postavljene kartice"*. The numbers are worse on the short
phone, and there was a third symptom nobody had reported:

| | iPhone 14 (390×844) | iPhone SE (375×667) |
| :-- | :-- | :-- |
| tallest panel | 47% of the screen | **63%** (story step 1) |
| covers the ringed control | steps 23, 30 | steps 12, 21 |
| **hangs off the screen** | — | step 9 |

**Fixed in two halves, because one alone cannot do it.**

1. **The panel is bounded** (45vh) and laid out as a column: the prose scrolls inside it, while the
   step number, the instruction and the buttons keep their own height and stay where a thumb expects
   them. The card's own `max-height: 32vh` is gone — it was a second number saying the same thing in
   different units, and on a short phone the two disagreed: the card obeyed its cap while the panel
   holding it came to 63% of the screen.
2. **When neither end of the screen clears the control, the control moves.** A cap cannot win the
   middle band: a control at half-height is under a panel docked low AND under the same panel docked
   high. The board scrolls and the panel's ends do not, so the guide scrolls the control out from
   under itself — ONCE per control, never on the poll (which asks four times a second and would be
   wrestling the thumb), and never while a demonstration is running, because the player scrolls the
   control into view itself and then reads its box to place the hand.

Pinned by [test_walkthrough_panel.py](tests/medium/test_walkthrough_panel.py) at both phone sizes,
with a card in the panel and the control in the middle band: the panel must not cover it, and must
not exceed 45% of the screen.

**After, walked again on both phones:** all 49 steps on each (from 23 before), tallest panel 45%,
nothing hanging off the screen. The walk still reports two chapter openings as covered — it samples
350ms after arriving, and what it catches is the repair in flight. Deep-linked to the same step and
measured at 0.4s, 1.2s, 2.5s and 4s, the overlap is **0 on both phones**; the panel had settled to
the far end of the screen from the control. A viewer sees the card land and the screen sort itself
out inside a second, which is the honest state of it: at rest it is clear, in transit it is not.

### 38.14 [x] CHANGE — the gate refuses to run with a filter reading its output

**Asked 2026-08-29 (Simon):** *"can we somehow prevent build checks to be run piped? to exit if pipe
is detected?"* — after four gate runs in one session went through `| tail`, which is what the rules
already forbid. A rule is the weakest way to hold anything (value 10), so it is now held by the gate.

**A TTY check cannot do it, and that is the design problem.** `sys.stdout.isatty()` is false for an
agent's shell whether or not anything was piped — a tool capturing output captures it the same way —
so a TTY test refuses the honest run and the careless one alike, and the only way past it would be a
flag, which is the same mistake with one more keystroke. **Measured**: a plain
`.venv/bin/python -m build lint` from this session's shell is not a TTY.

So the guard looks for what is actually wrong: a **truncating filter reading this process's output**,
found by walking `/proc` for siblings under the same shell — `cmd | tail` puts both under one parent.
`tail`, `head`, `grep`, `sed`, `awk`, `cut`, `wc`. Nothing else is refused: `| cat`, a pager and a
redirect to a file all keep every line. `CI` is exempt, which is an escape hatch for a machine.

**What piping costs, and why this is worth a guard:** the output IS the report. `| tail -20` keeps
the closing summary and throws away the stage lines above it — a check that was skipped, a warning
nobody failed on, a stage that suddenly takes four times as long as the header predicted. A green
summary read through a pipe is a green summary with the evidence removed.

### 38.13 [x] BUG — the evening chapter opened wherever the gym chapter had left the app

Found 2026-08-29 by walking the whole demo by hand at full motion, which is not what the e2e suite
does (it runs at reduced motion and asserts the story finishes). At **step 47 of 49** the guide greyed
out every button for about five seconds and then said *"This step needs a different screen — go back
to the sessions board and start it again"* — while the board was where it had just navigated.

**The cause is three lines away from the symptom.** A chapter's opening card declares the screen its
chapter happens on (`route: "/"`), and `foldCards` — which merges that card into the first real step,
so nobody has to tap Continue on a paragraph — copied `narrate` and **dropped everything else**. The
evening chapter therefore began wherever the gym chapter had left the app, which is deep inside the
plan editor, and by the third step the guide was trying to rebuild ground from an anchor two chapters
back. The other three chapters were fine only by luck: their first step happens to declare a route of
its own.

Fixed in the fold (the card's route rides along, unless the step names its own — the step is the more
specific of the two), and pinned by
[storyTour.test.mjs](tests/unit_js/modules/demo/storyTour.test.mjs) with the invariant behind it:
**every chapter played on the trainer's phone says which screen it starts on.** The client's chapter
is exempt and cannot be otherwise — it is a different page on a different device, reached by handing
the browser over rather than by routing.

### 38.12 [x] CHANGE — a reload no longer throws away a half-filled form

**Asked 2026-08-29 (Simon):** *"kadar se izpolnjujejo obrazci in se zgodi page reload poskrbi, da se
vsebina vnosnih polj ohrani"*. Measured on the client's intake page before writing anything: type a
name, an email and a phone number, reload, all three gone.

That form is the longest thing anyone is asked to fill in on their own phone, there is **no second
copy of it anywhere**, and a reload on a gym floor is not a rare accident — a locked phone, a browser
reclaiming memory, a mis-tap on the address bar.

**The conflict this had to resolve, and the ruling.** §26.1 promises the client's phone is written to
by nothing, and the page says so in as many words. Keeping a draft is a write. Ruled 2026-08-29
(Simon), presented with the trade: **sessionStorage, and the wording sharpened to match** — the draft
survives the reload and dies with the tab, so the promise's substance holds (close the page and it is
gone) while its old letter ("Nothing is saved on this phone") does not, and a promise that is nearly
true is worse than one that is exact. Both languages' copy, the module headers,
[uc8](use_cases/uc8_client_self_onboarding.md) and the catalog were changed in the same commit; the
e2e test that asserted the old promise now asserts the exact one, including that `sessionStorage`
holds the draft and nothing else.

**Consent is never restored.** A ticked consent box put back by a script is a person agreeing to
something without being asked, on a page they have just reloaded. `data-draft="never"` exists for
that field, on both the client's form and the trainer's.

**The trainer's client form too**, keyed by who is being edited: one form is "add a client" one
moment and "edit Jane" the next, and a draft that did not know the difference would spill half of
Jane's details into the next person's form. Cancel and ✕ mean "throw this away", so they do — only a
reload, the thing nobody chose, brings the form back.

### 38.11 [ ] GAP — muted text sits ON the AA bar on the light palettes

Found 2026-08-27 while measuring the demo's cards, and it is not about the demo. `--text-muted`
measures **4.76:1** on Daylight and **4.87:1** on Blossom (after §38.8 deepened Blossom's from
4.28:1) against those palettes' cards. The bar for body text is 4.5:1, so both pass — with so little
margin that **any** tinted surface puts the text under it. That is exactly what happened to the
demo's message card at 4.28:1, and it will happen again to the next component that tints a card:
warnings, selected rows, anything mixing an accent into `--card-bg`.

The dark palettes have room (Midnight 7.1:1, Nebula and Red similar), so this is a light-palette
question only.

**Not fixed here, because it is an app-wide colour decision, not a demo one.** Deepening
`--text-muted` on Daylight and Blossom changes every muted line in the app — timestamps, hints,
secondary labels, the lot. Worth doing deliberately, with the change visible on a few real screens
rather than as a side effect of a demo bug fix. The check that would catch the next instance is a
contrast sweep over the app's own components, which does not exist yet
([tests/medium/test_demo_narrator_card.py](tests/medium/test_demo_narrator_card.py) measures the
demo's cards only).

**Re-check condition:** whenever a component tints a card surface, or when the light palettes are
next revisited.

### 38.10 [x] CHANGE — one definition for every card the demo shows, and one word for a step

**Asked 2026-08-27 (Simon):** *"poenoti vse demo kartice, da bodo enotne, uporabi
polimorfizem/objektno orientirano abstrakcijo"*, and then *"poskrbi, da bo terminologija jasna:
nadomesti Beat z DemoNarratorCard ali ekvivalentom (sledi self-documenting code načelu)"* and
*"posodobi tudi prose da bo razumljiv, ne samo code"*.

**What they were.** A `kind` string interpolated into a class name
(`story-card--${step.narrate.kind}`), two stylesheet blocks that knew about two of those kinds, and
— for the guide's own "you have wandered off" state — no card at all, just the caption line
overwritten in place beside two buttons. Four things to read, three shapes, and a typo'd kind
produced a real box with no styling and no complaint.

**What they are.** `DemoNarratorCard` owns the shell, the three slots, the reading behaviour and the
one rule about the way out of the demo; a subclass declares only what makes its kind different:

- `ChapterNarratorCard` — the story's own narrating voice;
- `MessageNarratorCard` — words from another app, set as the `blockquote` they are (the italics said
  that to a reader and nothing at all to a screen reader);
- `PaperNarratorCard` — the paper track, whose texture is its declaration (§35.1);
- `OffTrackNarratorCard` — the guide's own card, which takes its words from the GUIDE because the
  step's instruction names a control that is not on screen, and refuses the way-out offer that only
  a closing card is entitled to make.

A kind with no class now draws nothing rather than an unstyled box, and
[demoNarratorCard.test.mjs](tests/unit_js/modules/demo/demoNarratorCard.test.mjs) walks the shipped
script demanding a class for every kind it names. That check lives in a test rather than in
`validateStory` because the import layering keeps a `modules/` registry out of `domain/`.

**The guide always has a card surface now**, whether or not a story is being told through it: the
long story mounts its own and hands it in (it narrates through the same one), and anything else — the
four-tap wedge — gets one from the overlay and has it torn down with the guide.

**Measured while unifying them**, by extending the contrast walk to every kind on every palette: the
message card's tint pushed muted text to 4.28:1 on Daylight and 4.37:1 on Blossom. A card that tints
itself owns its own text colours. The general fact behind it is recorded in §38.11.

**Terminology.** "Beat" was this codebase's private word for a step, used 345 times across code,
tests, docs, `TODO.md` and `CHANGELOG.md` while every identifier around it said `step`
(`tour.steps`, `stepIndex`, `currentWalkthroughStep`, "Step 4 of 49"). One thing, two words, and the
one a reader could not look up. Now: a **step** is a unit of the script, a **DemoNarratorCard** is
what narrates one, and the animation's own pauses are called waits — they were "beats" too, in a
different sense, which is exactly the confusion the word was causing. `replayBeats` → `replaySteps`,
`keepOwnBeat` → `keepOwnStep`, `_do_beat` → `_do_step`, `#story-card` → `#demo-narrator-card`.
Nine sites where "beats" is a verb were left alone by name rather than by guess.

### 38.9 [x] CHANGE — one story, one count, across both phones

**Asked 2026-08-27 (Simon):** *"zakaj je anin telefon demo števec 1/10, zakaj ne nadaljuje po demo
števcu z enakim slogom kot do sedaj"*. Walked and measured: the story went **step 10 of 41 → step 1
of 8 → step 19 of 41**, three numberings for one story, with nothing on screen saying why.

Nobody decided that. The counter counted the TOUR, and the story is played by two of them: the
client's chapter runs in its own boot on the intake page — no database, no seed, no terms modal,
because in the story it is a stranger's phone — so it has its own step list, and
`storyStepsFor` deliberately keeps those steps out of the trainer's run (the guide would otherwise
point at a form that is not on his screen). The script already held the opposite value one step
later: the hand back is written by step id rather than by chapter *"because the trainer's run is one
numbered sequence, and returning to 'chapter 3, step 1' would restart the count in the middle of a
story the viewer is four steps into"*. Going the other way had no such rule.

**A step's number is now its place in the STORY**, attached by `storyStepsFor` as `storyPosition`
and carried with the step — the one thing both boots can agree on while sharing no state, because it
is a property of the script and both of them have the script. Measured after: **10 of 49 → 11 of 49
→ 19 of 49**.

**Two numbers, deliberately** ([domain/walkthrough.js](src/domain/walkthrough.js)): what the viewer
READS is their place in the story; what the buttons OBEY is this run ending. Counting the story for
`isLastStep` would leave the client's page unable to finish, waiting for step 49 on a page that has
eight. The choice between them is a `TourNumbering` / `StoryNumbering` pair rather than a condition
at the point of use — a run whose steps know where they belong is counted by the story, everything
else counts itself, and the wedge tour is untouched.

A chapter link now opens at that chapter's place in the story (30 of 49), not at 1 of its own
length: someone handed one is joining a story part-way, and the count is what tells them so.

### 38.8 [x] BUG — the story card was painted with tokens this app has never had

**Reported 2026-08-27 (Simon):** *"2/8 kartica je slabo berljiva"* — the demo's card on the client's
phone. Measured before touching anything: **2.38:1** body text on the Midnight palette, against the
4.5:1 a paragraph needs. Title and caption were 17.29:1, which is why it read as one broken half.

[demoNarratorCard.css](src/modules/demo/demoNarratorCard.css) asked for `--text-primary`,
`--text-secondary`, `--bg-secondary` and `--bg-primary`. This app defines `--text-main`,
`--text-muted`, `--card-bg` and `--bg-color`. **An undefined custom property does not fail** — CSS
takes the fallback written beside it, and a fallback is a colour someone typed on the day they wrote
the line. So all five declarations froze at light-theme slate: right on Daylight by coincidence, and
dark-on-dark everywhere else — including the palette the story's own handover link **forces** on the
client's phone (`theme=midnight`), which is why this surfaced there and nowhere else.

**The check is the real fix** ([agent_tools/css_tokens.py](agent_tools/css_tokens.py), Stage 1): a
`var()` naming a property nobody writes fails the build. Its first run found **38 reads of 17
properties across 12 files** — the story card was one of them. The rest, all fixed here:

- `.notification-card` and the header's nav hover painted `var(--bg-surface)`, which is invalid at
  computed-value time and therefore **transparent** — feed cards had a border, a radius and no
  surface;
- seven `color: var(--text-color)` declarations that quietly did nothing (the property is inherited,
  so an invalid value inherits) — said out loud as `color: inherit`, since each sits on a fixed dark
  overlay where naming a theme token would be wrong on half the palettes;
- the backup warnings' frozen amber, now `--warning` mixed the way `index.css` already mixes
  `--danger`, which retired a `prefers-color-scheme` override that contradicted the trainer's own
  theme choice — and a byte-identical duplicate of the whole rule beside it;
- two dead middle links (`var(--card-bg, var(--bg-surface, #fff))`).

**The check's second half is palette parity**: the five themes are alternatives, not layers, so a
property only one of them defines is undefined for everyone on the other four. It holds today (33
properties × 5) and now cannot quietly stop holding.

**Found by the test that pins it**: `--text-muted` on Blossom was 4.28:1 — under AA for **every**
muted line in the app on that palette, not just this card. Deepened to `#96617f`, same hue.

Pinned by [test_demo_narrator_card.py](tests/medium/test_demo_narrator_card.py), which measures what an eye
gets — the card's four text elements against the surface actually behind them, on every palette the
app ships, read from the app rather than listed in the test.

### 38.7 [x] BUG — the tap's rings landed on the screen the tap had already opened

**Reported 2026-08-27 (Simon):** *"show me click ripple effect is sometimes too late as application
already loads new view when the effect fires. Try to animate the effect a bit before the actual
click."*

The click is what changes the screen, so the mark can only be spent BEFORE it. It was not: the
player waited 160ms — the time a finger takes to land — and then tapped, while the rings need most
of a second. The trailing two had not even been SENT when the view changed, so the whole set played
out over a screen it had never touched. What a viewer sees then is not a late effect; it is a tap on
the screen that just arrived.

**The pointer's mark and the real click are one gesture, so one module times both.** The ring's
duration moved out of the stylesheet into [demoPace.js](src/modules/demo/demoPace.js) — the module
that already owns every wait a step takes — and the wait before the tap IS that duration.
[demoHand.js](src/modules/demo/demoHand.js) stamps it onto the rings for the CSS to animate with,
and clears them on it. Three numbers that had to agree became one, which is the actual repair: the
old comment said "kept in sync by hand", and they were not.

By the time the app is told anything, a whole ring has expanded over the control being tapped and
the two behind it are past their peak. What crosses the view change is their tail — the echo of the
tap that left.

**Found while fixing it:** the delayed rings were painted at their full 26px until their turn came,
because the animation filled `forwards` only. Three rings appeared as one hard blob at the contact
point, snapped back to a third of their size, and only then rippled. Filling `both` starts each one
where its own animation starts. The per-ring fading was dead for the same reason and is now carried
inside the keyframes, so the group still reads as waves rather than as a target reticle.

Pinned at both tiers: [demoPace.test.mjs](tests/unit_js/modules/demo/demoPace.test.mjs) holds the
lead to the ring's own duration, and
[test_walkthrough_target.py](tests/medium/test_walkthrough_target.py) times the real player's
gesture on its own injected clock — the rings must be out and the first one finished before the
control is touched — and measures the rings at the instant of contact.

### 38.1 [x] BUG — "show me around" started the old four-tap tour, not the story

**Reported 2026-08-25 (Simon):** *"Message in notification area starts the old 1/4 demo not the new
1/31"*, and on the same walk *"same with guided walkthrough on the splash screen"*. Both offers built
their URL from one function, and that function still wrote `?demo=walkthrough` — the gym-floor wedge
that predates §35. Invisible in the code, because the story runs on the same guided panel: the only
symptom was the step counter saying 1 / 4. Fixed by making that builder write `?demo=story`, and by
pinning the VALUE in the tests, which had asserted only that some `?demo=` was set. The wedge keeps
its own link for the engine's tests; nothing in the app offers it.

### 38.6 [x] BUG — walking back left the card describing a screen the app was not showing

**Reported 2026-08-26 (Simon):** *"going back in demo from step 7 to step 4 does not clear/update the
intake address / number"*. Worse than stale: every one of those steps showed an EMPTY contact box,
under cards reading "type the number" and "type it over the number".

Being able to PERFORM a step is not the same as standing where it begins. The rebuild reopened the
invite dialog — which empties its field on every open, correctly, since it is the next person's
invitation — and then stopped, because the step's own control was now reachable and nothing looked
wrong. The two steps that fill that box were never replayed.

**A step's ground now includes what the step before it left on screen**, and the rebuild replays
until that holds rather than until the control is merely tappable.

**Two repairs, told apart, and that distinction is the whole cost of this fix.** Conflating them
froze the guide for tens of seconds at the programme chapter — resuming the trainer's run after the
client's phone made every step try to rebuild the arrive chapter, one unsatisfiable replay at a
time, with every button greyed out. So:

- a step that **cannot be performed** replays from its anchor and stops the moment its control is
  reachable, exactly as before;
- a step that **can** be performed but whose immediate history is wrong restores at most the last
  three taps, and never reports a problem — the trainer is looking at a card whose control is right
  there.

Only the step IMMEDIATELY before counts as ground. Most of what a story does is undone on purpose by
what comes later — the invite dialog is opened by one step and closed four steps on — so demanding
every earlier outcome would have the guide re-opening dialogs the story had deliberately shut.

### 38.5 [x] CHANGE — the card follows the app, and says so when the trainer goes exploring

**Decided 2026-08-26 (Simon)**, after reporting the same thing three ways in one session — a modal
closed by hand with the card still asking for it, and two "Show me does not fill the form" reports
where the filling was the NEXT step:

> *"make Show me fill in the fields and point to the action and execute it, when performs the
> expected action the card should advance, but if user explores on its own we should display a demo
> card with 2 buttons 'return to demo' and 'exit demo mode' (same as x on demo card)"*

**A step completed in front of the viewer carries the card on**, whoever completed it — the trainer's
own tap or Show me. This reverses the 2026-08-23 rule (only Next advances), which was itself a fix
for THREE rules: Show me advancing on some steps and not others. What makes one rule safe now is the
guard that did not exist then: **a step whose expectation was already true when its card appeared is
read, not performed**, and is never advanced past on its own. Narrated cards are exactly that — a
card is satisfied by being on screen — and so are steps the previous screen already answers, which
is what "skipped two steps in a blink" was. Never off the LAST step either: finishing is a decision,
and the thank-you card would have closed itself before anyone read it.

**Going exploring is not a fault, so it no longer looks like one.** When the step's control is not on
this screen at all — the trainer opened another view — the card says so and offers exactly two ways
on: *Back to the demo*, which is the same rebuild Back and Next already use, and *Stop the demo*,
which is the ✕. Deliberately weaker than the readiness test: a control merely scrolled out of view or
under a menu is still on the step's own screen, and the guide handles both by itself. It takes three
consecutive polls, because one reading is a view mid-render.

The e2e walkers gained ONE definition of "do the step on screen" (`_do_step`, `_card_moved_on`) —
they had four copies of Show-me-then-Next between them, and each copy was a place the rule could be
half-changed.

### 38.4 [x] CHANGE — the invitation text says who it is from and what happens to the data

**Wanted 2026-08-26 (Simon)**, from the message as it arrived on a phone: it should name the
trainer, say it is an invitation to fill the signup form, and carry the privacy statement.

The old opening — *"Fill in your details for our training"* — is exactly what a phishing text says,
and the trainer's name only appeared as a signature under the link. The name now leads, the app is
named with it, and the notice comes WITH the invitation rather than as small print on a form
somebody has already started filling in. It is [consentForm.js](src/modules/common/consentForm.js)'s
`clientPrivacyNoticeUrl` — the same shipped page the consent letter links to, in the language the
link opens in — so the two cannot drift.

An install that does not know the trainer's name sends an unsigned line rather than a message with a
gap in it. Around 300 characters with both links, so two or three SMS parts; the alternative is a
bare URL, which is the thing being fixed.

### 38.3 [x] BUG — the guide and the app's own modals — fixed 2026-08-26

**Reported 2026-08-25 (Simon)**, walking the story: *"step 3/41 does not ensure menu closed"*, then
*"send intake link does not count the steps right, back button keeps the app stuck in the modal, the
modal for intake sharing is hijacking the demo step card and the card is covering the controls"*.
Four symptoms, three causes, all of them at the seam where the guide meets a `<dialog>` or a
dropdown it opened itself.

- **A control behind an open modal counted as visible.** `showModal()` makes the rest of the page
  inert, but the buttons under it keep their boxes — so the step that closes the intake-invite
  dialog, which claimed only "the register button is visible", was satisfied the moment the dialog
  OPENED. The guide lit Next, the viewer walked on, and every step after it happened over a modal
  nobody had closed, with the whole app inert behind it: the miscounted steps and the Back that
  could not escape are both this. `probe` and `resolveTarget` now read reachable, not painted, and
  the step claims what it is about — the dialog gone.
- **The modal took the card over.** Every dialog here is a glass card, and `backdrop-filter` makes
  an element the containing block for `position: fixed` descendants — so the guide's full-screen
  frame collapsed onto the dialog the moment the panel was moved inside it (which is what keeps it
  tappable). The card drew INSIDE the modal, over the controls the step was asking for, and on the
  taller new-client form the scroll carried it off the top of the screen. The frame is measured back
  onto the viewport by hand, the dialog's own scroll included.
- **A rebuild could not undo, and a modal is the one state nothing else escapes.** Restoring a
  step's ground navigates and replays forward; neither reaches out of a modal, because everything
  outside it is inert. The rebuild now closes a modal the step does not live in, through the
  dialog's own ✕.
- **The ground a rebuild puts back has to be taken away again by the step that is already done.**
  The register opens from the ☰ menu and the tap that opens it closes the menu; walking back into
  that step re-opened the menu over the register, and the tap that would have closed it was skipped
  as redundant. Both the entry rebuild and Show me now re-fire a done step's action after a rebuild
  — after one, the app is by construction back BEFORE the step, so it is a replay rather than a
  double tap.

**The frame fix above was wrong, and the same evening said so twice more** — *"send intake link
modal has some really long scroll bars (should have none)"*, then *"send intake link modal does not
display demo card anymore, so I can't click show me or next or back"*. Stretching the guide's frame
back over the viewport from inside the dialog does not work in either direction: a dialog's UA
`overflow: auto` CLIPS what hangs off its top and left — which is where the card went — and what
hangs off its bottom becomes scrollable overflow, which is where the scrollbars came from. Living
outside the dialog is not available either: a popover in the top layer is still not clickable while
a modal is open (measured, not assumed).

So while the guide is inside a dialog, **the dialog is its screen**: the frame becomes the dialog's
own visible box, scroll offset included, and the card docks inside it — top or bottom by the same
rule that keeps it off the control everywhere else. The ring is placed in frame coordinates for the
same reason.

**And the lesson that cost the third report**: the geometry was verified by reading boxes, and a
clipped element still reports a perfectly good box. Where the question is "can a person see and tap
this", `elementFromPoint` at the control's own centre is the check; a rect is not.

A second Show me on the step that OPENS a modal also told the trainer it had failed — the step's own
success puts its control behind the dialog, and a precondition that reads "met" says nothing about
that. The rebuild is now forced whenever the step's own control cannot be reached.

**Back and forth, and the state nothing was checking** — *"back and forth for demo steps
surrounding sending intake link don't work"*, and, reproducing the menu report by hand, *"manually
open menu and click show me -> observe menu is not closed (no state enforcement)"*.

One cause. The guide asked only whether a step's declared `requires` held, and almost no step
declares any — `requires` was written for the states a selector cannot see. So nothing noticed that
a step's own CONTROL was gone or buried: walking Back out of the invite modal closes it, correctly,
and walking forward again then stepped through four steps whose controls were inside that closed
dialog, lighting Next on each because each was done on the first pass, over a screen where none of
it was happening. A dropped-down menu is the same defect a layer up — it covers, so the
demonstration is a hand tapping something the viewer cannot see.

**Being READY now means: preconditions hold, the control resolves, and nothing is drawn on top of
it** — asked with `elementFromPoint` at the control's own centre, since a rect cannot answer it. And
what the app has left lying on top is cleared before anything is replayed: a menu through the
control that opened it, a modal through its own ✕. Cheap repair first, replay only if that was not
the whole problem, because several steps exist to OPEN a menu and rebuilding through them re-opens
the very thing that was in the way.

**Three things this taught, all of them about instrumentation rather than the guide:**

- A geometry check passes on a clipped element, and a `requires` check passes on a buried one. Where
  the question is "can a person see and tap this", only a hit test answers it.
- **Waiting for a state to look right will take the first frame where it does.** Waiting for
  readiness before deciding whether to rebuild made the guide stop tearing the clipboard down on
  Back: an overlay mid-transition measures as gone for one frame. That decision is taken on one
  reading; only the complaint waits, and only when the rebuild actually moved the app.
- **The browser suites pin `Date.now()`**, so a `Date.now() + budget` deadline never arrives there.
  A settle loop written that way hung for ever, with every button on the panel greyed out. Count
  ticks.

**And the card is OUT of the modal** — *"step 4 of 41 card is still trapped in the modal view and
covers the interface, can you move the demo card outside of modal please?"*. What kept it in there
was the dialog's own UA `overflow: auto` clipping its children; lifting that lets the card draw at
the bottom of the SCREEN while staying a child of the dialog, which is the only thing that keeps it
tappable while the rest of the page is inert. Measured before it was built: it is then the topmost
element at its own centre and a real tap lands on it. Not for a dialog that needs its own scrolling
— the new-client form is taller than a phone, and a form that cannot scroll is worse to hand someone
than a card in the way — so that one keeps the card docked inside.

**A repeat Show me stopped blinking the dialog** — *"show me on step 3/41 seems to loop"*. The step
that opens the invite dialog puts its own control, the button on the page behind, out of reach by
succeeding. Asking to be shown it again therefore closed the dialog to get at that button, tapped
it, and opened the dialog afresh — the app blinking, and anything typed in the meantime gone, since
the dialog empties its field on every open. A step that is done and whose control its own success
removed has nothing left to demonstrate, so Show me does nothing there. Quietly: a complaint about a
step that worked is worse than silence.

Pinned by [tests/medium/test_walkthrough_modal.py](tests/medium/test_walkthrough_modal.py) (six
rules, one stub), the story's own back-and-forth walk across the invite dialog, and the menu-closed
assertion in its repeat-Show-me test.

### 38.2 [x] CHANGE — the demo-mode notice leads the whole feed

**Wanted 2026-08-25 (Simon):** *"DEMO mode message should be the 1st one on the message area, above
bookings and cancelations"*. It led the STORED messages already, but synthetic work items — pending
sessions, unscheduled plans — lead the feed by rule, and the demo seed generates those, so the card
was pushed below them. It is now the one exception to that rule, and the reason is not politeness:
every other item is a claim about the trainer's own gym, and reading one before knowing the data is
a fiction is reading it wrong. It is also the collapsed drawer's summary line and the only way back
to the guided demo and the cleanup screen.

---

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

Verified against [en.js](src/i18n/en.js) and the shipped script; every one of them is a sentence, not
a mechanism.

| Card | Key | What it says | Why it is false |
| :-- | :-- | :-- | :-- |
| 1 | `story_arrive_open_body` | *"without writing down a single detail for them yourself"* | Cards 8 and 9 have the trainer typing Nik's name, and card 9 says so: *"you typed four words in total"*. |
| 10 | `story_handover_body` | *"Nothing ahead is a mock-up."* | Cards 11, 17 and 19 are drawn message screenshots. They are honest mock-ups; the sentence is what makes them dishonest. |
| 17 | `story_arrived_body` | *"Nothing went through a server on the way"* | A text message crosses an operator's servers. The true claim is narrower and better: nothing went through **ours**, and nothing was uploaded. |
| 6 | `story_step_arrive_close_invite` | *"Two of the three are on their way."* | *"where are they going? drop the poetics!"* — nobody is going anywhere; two invitations have been written. |

Simon on card 1: *"this is a lie and not needed sentence"*. The fix for each is the same shape — say
what happened, drop the flourish.

**Fixed 2026-08-31**, eight strings across [en.js](src/i18n/en.js) and [sl.js](src/i18n/sl.js):

- Card 1 names the three routes into the register instead of promising one that the chapter itself
  breaks two cards later.
- Card 10 says what is actually true of the crossing: *"The page is the real one; only her messages
  are drawn."* That is the stronger claim as well as the honest one — the drawn messages are the
  point of §35.1's rule, and the old sentence was disowning them.
- Card 17 keeps the claim worth making and drops the one that is not ours to make: *"no server of
  ours ever saw it"*.
- Card 6 says where the three of them stand, which is also what sets up card 7: *"Ana has her link
  and Maja has hers; Nik is still standing here."*

**No check can hold this.** Whether a sentence is true of the app is not a property a test can read,
and the two suites that walk the story pass either way. What the gate does hold is that both
dictionaries stay in step, so a sentence cannot be corrected in one language only.

### 39.2 [x] BUG — crossing to Ana's phone lost the language

**Reported at card 20:** *"zagotovo je Ana imela nekaj slovenskih besedil, če ne kar celega UI slo, ta
import pa pravi 'en'"*.

**Found, not guessed:** [storyTour.js](src/modules/demo/storyTour.js) hands the browser over with a
fixed address — `intake?demo=story&chapter=intake&theme=midnight` — and there is no `lang` in it.
Ana's page is a separate boot with no database (§35.1), so it has nothing to read a language from and
comes up in the default. A Slovenian viewer watches Ana fill in an English form, and the consent her
file records is the language she never chose.

The way back, `clients?demo=story&step=review-message`, dropped it too; the trainer's own side
survived only because his choice is in storage.

**Fixed 2026-08-31 at the crossing itself, not in the script.** The guide's Next puts the current
language on any address a step hands the browser to, unless that step names one of its own
([walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js)). Written there because the story
already had two crossings and forgot it on both: a rule at the seam cannot be forgotten by the third
one. The trainer's side reads it from `state.lang` at the moment of the crossing rather than at boot,
since the ☰ menu can change it mid-story; the client's side passes on the language it was given.

Pinned by [test_demo_story.py](tests/e2e/test_demo_story.py): walked in Slovenian to the handover,
the button Ana is about to tap says *Deli s trenerjem*.

**Found while writing that test, and worth more than the bug:** both story walkers asked "did the
card move on?" by matching `step N of` — English, so in every other language the answer was always
"yes", the walk stopped tapping Next and stalled where it stood. Every walk in the suite is English,
so nothing had ever noticed.

**And the first fix for it was worse**, which is the part worth keeping. Comparing
`inner_text()` against `not_to_have_text` looks language-agnostic and is not: the panel uppercases
that line in CSS, `inner_text()` returns what CSS made of it, and the assertion compares
`textContent` — so "is it still this text?" answered *no* before anything had happened, for every
step in every language. The walk stopped tapping Next altogether and the demo stage ran **41 minutes
without failing** before it was killed. A comment two files away had already written this down.

Both walkers now read the value the assertion reads, through a named helper rather than by hand, and
the rule is in [tests/INDEX.md](tests/INDEX.md) where the next person meets it before writing the
test rather than after.

### 39.3 [x] BUG — the consent Ana ticked named Google Drive

**Reported at card 16:** *"privacy consent naj ne omeni google drive-a, naj bo generičen "PT's private
cloud storage""*.

Verified: [en.js:265](src/i18n/en.js) has the client agreeing to a backup *"in my trainer's personal
Google Drive"*, and [sl.js:256](src/i18n/sl.js) says the same. The long consent letter
([consent/en.js](src/i18n/consent/en.js)) already says *"my personal cloud storage"* and names no
vendor — so the two texts a client reads disagree, and the shorter one is the one they actually tick.

Naming the vendor in the tick is also a promise the app cannot keep across a deployment that syncs
somewhere else, and it dates the consent record to a product decision rather than to a practice.

**Fixed 2026-08-31.** The tick now says *"my trainer's own private cloud storage"* / *"njegovi osebni
shrambi v oblaku"*, which is what the letter says.

**Nothing is concealed by it**, and that is what made it safe: the privacy notice the tick links to
names Google Drive in full, in both languages, and a processor's identity is what that notice is for.

**`CONSENT_FORM_VERSION` is deliberately NOT bumped.** It stamps the letter's substance — purposes,
recipients, rights, retention — and the letter has not changed. This makes its summary agree with it
instead of contradicting it, adds no recipient and narrows no right, so a bump would ask every client
already on the record to consent again to the promise they already made.

**Now checked**, in [consentForm.test.mjs](tests/unit_js/modules/common/consentForm.test.mjs): no
consent text a client ticks or signs may name a storage vendor, in any language. It is the same drift
the letters were already pinned against — *"Google Drive/iCloud" vs "personal cloud storage" across
three copies* — caught one artifact further out.

**The gate found the rule this replaces**, which is why it is written down twice.
[test_intake_form.py](tests/medium/test_intake_form.py) required the tick to disclose *"Drive"* by
name, from the 2026-08-23 full-disclosure ruling. That test now asks for the KIND of recipient —
`cloud storage` — and says why: what must be disclosed here is that a backup copy may leave the
trainer's device, and WHO holds it is what the linked notice is for.

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

**Reported at cards 23–24:** *"the edit view is not clear which session and for whom that plan is, the
demo card text is useless"*, and *"demonstrate actually adding one circuit please, before just saying
done"*.

Two different faults, one screen.

**The app's — fixed 2026-08-31.** Measured before building, and the report was half right: *for whom*
was already there (*Editing Jane Doe*). *Which session* was not — `Group Strength & Conditioning`
appeared nowhere in the clipboard, in either mode, and the bar carried
`2026-09-01 11:30 playground outside` on one 22px line. Simon then found the rest of it at desktop
width — *"this one clips on desktop"* — where that line lost **90px** to an ellipsis. The repo's own
sweep passes that, correctly: an ellipsis is visible truncation, not the silent clipping
[overflow_scan](agent_tools/overflow_scan.py)'s invariant B hunts for.

**Two lines, and they cost nothing.** The bar is 76px tall because its buttons need a 44px touch row;
the title was using 25px of it. A 15px line over a 12px line comes to ~36px — still inside height
already spent. Measured at 390, 375 and the desktop column: same bar height, same actions width, no
overflow, sweep clean.

- **The clipboard** ([sessionTitleBar.js](src/modules/session/sessionTitleBar.js)): the session's name,
  then `day · time · gym`. `TODAY` replaces `2026-09-01`, which is what a person standing in the gym
  reads. The gym goes last because it is the least identifying thing on the bar and usually the same
  one every day — **the order is the design**: what gets cut is chosen, not left to chance.
- **The editor** ([activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js)): `✎ <session>`
  over `[day · time] <client>`. The ✎ shrinks from 22px to 12px and moves to the name it is about.
  **The word "Editing" is gone**, and that was decided by measurement rather than taste: rendered both
  ways, four things on one 12px line clip the client's name at 390 *and* 375, three clip nothing. The
  glyph says the mode and Done sits beside it.

**Then the buttons beside it gave the room back** (asked the same day: *"we probably should change
start session button from text to play glyph"*). Start and Done carry only their glyph now, with
their words in `aria-label` through `data-i18n-label`, and the touch target held at 44px by
`.btn-glyph` — a control a thumb cannot hit has not been made smaller, it has been made worse.

| | title block | session name clipped |
| :-- | --: | --: |
| clipboard 390, Start as words | 171px | 0 |
| clipboard 390, Start as glyph | **258px** | 0 |
| editor 375, Done as words | 191px | **27px** |
| editor 375, Done as glyph | **231px** | **0** |

So the editor's last truncation is gone at both phone sizes, and only a deliberately long name still
ellipsises — visible, with an affordance, which is the whole point of choosing the order.

**And the play glyph was never on screen at all.** `fa-circle-play` has been in that markup all
along. The button was wired through BOTH translation mechanisms at once: the selector table in
[domMappings.js](src/i18n/domMappings.js), which keeps an icon and appends the label after it, and a
`data-i18n` on the button itself, which calls `replaceChildren` and throws the icon away. They
disagreed on every boot and the second one won. Nothing noticed — the dictionaries were in parity,
the label was right in both languages, the button worked, and the glyph was simply absent.
[test_i18n_parity.py](tests/unit/test_i18n_parity.py) now refuses any element that carries
`data-i18n` while containing markup, which is the shape that loses it.

Pinned by [test_clipboard_title.py](tests/medium/test_clipboard_title.py) (the name leads, in the
larger type) and [test_session_deeplink.py](tests/e2e/test_session_deeplink.py) (the bar names the
session, and that name is not the part that gets cut).

**The story's — fixed 2026-08-31.** The chapter now builds something, which is what a chapter called
*The programme* is for.

- **It adds a circuit** (*"demonstrate actually adding one circuit please, before just saying done"*).
  A new step taps `+ Circuit` on the last insert bar, so the block lands at the end where a finisher
  belongs. Its expectation is a circuit with **no title yet**: the seeded plan's five circuits are all
  named, so an untitled one is proof this tap made it rather than a selector that was already true —
  measured before writing it, 5 circuits and 0 untitled before, 6 and 1 after. The story is 48 cards.
- **Both captions name their control**, the glyph and where it is, which neither did.
  `story_step_programme_editor` never said to tap anything at all; it now opens with *"Tap Edit plan —
  the ✎ row in the menu that just dropped down"*.
- **"Done — back to the room" is gone** (*"what room are we going back to?"*). It says what the tap
  does and why the screen changes: the plan is saved, and the session comes back with everybody in it,
  because the editor shows one person at a time and what follows is about all three.

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

**Reported at card 3:** *"would text button be better as invite customer instead send intake form?"*

`Send an intake link` named our mechanism; `Invite a client` names the trainer's intent. The register
already calls the other route `Add Client`, so the pair now reads as two ways to do one thing —
**Invite a client** / **Add Client**, *Povabi stranko* / *Dodaj stranko*.

**Fixed 2026-08-31**, and in three places rather than one, because a name is not only on the control:

- the button, and the dialog it opens — a dialog that opens under a different heading from the button
  that summoned it reads as having gone somewhere else;
- the story's own caption, which names the control the viewer has to find. It gained the glyph while
  it was being rewritten: *"the button with the share arrows just under the Clients heading"*.

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

**Reported 2026-08-31 (Simon)**, with the address he was standing on:
`/session/s04f2e3d/client/c1a9f0e2/circuit/z08a2b3c` — *"still no title visible"*.

Not §39.6. The bar was not merely missing the session's NAME; it was showing the word `Clipboard`,
the placeholder that ships in the static markup, on a screen that knew perfectly well it was holding
*Morning Conditioning, 09:00 - 10:00, city park*. Tapping a session in from the board wrote the bar
correctly; arriving at the same address from cold never did.

**Traced, not guessed.** A MutationObserver on the title showed it written exactly once — at
t+1357ms, when the overlay's markup renders — and never touched again. `renderSessionTitle` runs
before that markup exists, takes its `if (!el) return`, and nothing calls it a second time. Calling
it by hand on the stuck page produced the right line immediately.

**A deep link is the common case, not the exotic one**: a reload, a bookmark, a link sent to a
colleague and the app's own restored session all arrive that way.

**Fixed by deriving the title instead of stashing it.** Edit mode repurposes that bar, and it used to
keep the bar's HTML in a module variable and restore it verbatim on the way out — faithfully putting
back whatever was there, placeholder included, which is how one wrong render spread to every later
one. Leaving edit mode now re-derives from the session
([activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js)), and the module variable is
gone: a value that cannot be stale beats a rule about keeping it fresh.

Pinned by [test_session_deeplink.py](tests/e2e/test_session_deeplink.py) on both halves — a cold deep
link names the session, and so does the screen you get back after leaving the editor.

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

**Reported 2026-09-01 (Simon)**, from the editor route: *"there is a 65 / 60 min button like element
that I don't know what it does"*.

Two faults in one element, and he demonstrated the first by being unable to name it:

- **It was shaped like a control.** `border-radius: 999px`, a tint and padding, sitting in a toolbar
  immediately beside *Add from catalog*, which is a real button.
- **Its only explanation was a `title` attribute.** A phone has no hover, and this repository does not
  accept meaning that lives there — so on the device the app is built for, the element said `65 / 60
  min` and nothing else.

**And the state it exists to report was in the colour alone.**
[clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) already said it in a comment — *the
number a trainer scans for is not "45", it is "over"* — while encoding "over" as red text, which is
the half a colour-blind trainer cannot read and the half sunlight takes first.

**Fixed:** a clock glyph says the number is a duration, the word `over` / `čez` says the state, and
the pill is gone — plain text while the plan fits, with the tint kept only for the case that wants
attention. Pinned by [test_clipboard_editor.py](tests/medium/test_clipboard_editor.py), which had to
teach its mount about a booked slot: the meter is silent without one, because a planning programme
has no hour to fit into and inventing a constraint nobody set would be worse than saying nothing.

### 39.16 [x] CHANGE — the fit meter warns before the hour is gone, and costs a set by its reps

Two rulings from 2026-09-01, one screen apart, and they answer each other.

**"If the plan (not counting rests) exceeds 75% of time then it should mark warning and at 100%
should turn error."** There were two states, so a plan at 95% of its hour looked exactly like one at
30% — a trainer found out it was too long by going over. Three now, each saying its own WORD (`tight`
/ `na tesnem`, `over` / `čez`), because the state used to be in the colour alone: the half a
colour-blind trainer cannot read, and the half sunlight takes first.

**Judged on WORK, which is the part of the ruling worth keeping.** This module counts rest only where
a trainer wrote a rest ROW; the rest they take between sets without typing it in is invisible. So a
total that includes authored rests under-reads exactly the plans most likely to overrun, and the
quarter of the slot the threshold leaves free IS that unwritten rest. `planFitsSlot` now reports
`workSeconds` beside `netSeconds`, and the meter shows work — showing one number while colouring by
the other would leave an amber reading nobody could explain.

**"We should also find a way to account time for 20 bolgarian squats, or 5 pullups."** A flat 45s per
set said those cost the same. A set is now an overhead plus a cost per rep — 15s + 3s each:

| | before | now |
| :-- | --: | --: |
| 5 pull-ups | 45s | 30s |
| 10 bench press | 45s | 45s |
| 20 Bulgarian split squats | 45s | 75s |

Calibrated where it always was, so the common set did not move, and it still invents **no
per-movement table** — the thing this module refused for good reason. Reps are already in the plan.
A rep range costs its top; `Max`, a band label or an empty box fall back to the plain working set,
because costing them at nothing would make a plan of failure sets look free.

**Ruled 2026-09-01, and built:** *"keep the description 'X reps per arm', but when estimating
duration for a card or a cycle it should return calculated time back"*. The authored text is never
rewritten — the cost model reads it, and any per-side wording (`arm`, `leg`, `side`, `hand`, `foot`)
counts double. Side words are matched, never guessed: a movement that is unilateral without saying so
cannot be detected from a plan at all.

**And a set to failure costs the recovery it forces**, ruled the same day: *"max reps should probably
default to 3 or 5 min"*. Three, the conservative end — at five, four such sets eat a third of an hour
by themselves. `SECONDS_PER_MAX_SET` is the dial if it reads short on the floor. `Max`, `AMRAP` and
`F` are the tokens [repsAndLoad.js](src/domain/repsAndLoad.js) already recognises, so this needs no
new vocabulary.

**The arithmetic is a list of shapes now, not a chain of ifs** — asked for as *"in object oriented
manner"*. Each shape of work answers for its own cost (rest, timed, to failure, per side, counted,
uncounted) and the first whose test holds wins, so the order is the meaning and a new kind of work is
an entry rather than another branch to hold in your head.

Pinned by [planDuration.test.mjs](tests/unit_js/domain/planDuration.test.mjs) (nine new cases, from
the pull-up/squat asymmetry to rests being excluded from the judgement but kept in the total) and
[test_clipboard_editor.py](tests/medium/test_clipboard_editor.py) (the meter says `tight` before it
says `over`).

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

**Asked 2026-09-01 (Simon):** *"is there a way to support local development with code graphs, so that
tests unit, e-2-e and compliance get run on every edit premptivly to reduce wait times?"* — and the
first thing that question deserved was a look at where the time actually went.

**It went to one worker.** `demo_worker_count()` returned 1, derived on 2026-08-19 when the demo
suite was ~90s of call time against ~600s for the rest of e2e, with its own docstring asking to
*"re-derive this if either suite's call time moves substantially — the ratio, not the number, is what
matters"*. Both moved, in opposite directions: the demo suite grew with the story (48 cards, walked
twice over) while the rest of e2e got faster. Measured today: **demo 387s against e2e 192s** — the
ratio inverted, the stage's long pole running on a single worker while seven idled beside it.

The demo files alone finish in 163s at four workers. At three, inside the shared budget:

| | before | after |
| :-- | --: | --: |
| Demo & Walkthrough | 387s | **181s** |
| E2E Browser Tests | 192s | 162s |
| Stage 3 | 387s | **181s** |
| **whole gate** | **8m51s** | **4m44s** |

The two tasks now land within 20s of each other, which is the property the split exists for: the
stage costs as long as its slower half.

**[test_stage_tasks.py](tests/unit/test_stage_tasks.py) pinned the number, not the rule** — it
asserted `demo_worker_count() == 1`, so an honest re-derivation read as a regression. It now asserts
what must stay true: both tasks come out of ONE browser allowance, neither is starved, and the shares
add up. The number is free to follow the measurement, which is what its own docstring always asked.

**Re-check condition:** whenever either suite's wall time moves substantially — the same condition as
before, now with a test that does not fight it.

## 40. [x] Two workspaces — the trainer's own work, and a sandbox to learn in — shipped 2026-09-10

**Asked 2026-09-10 (Simon):** research whether demo data should be separated from the trainer's real
data, so that they can *"preklopi kadarkoli med svojim delovnim stanjem in stanjem za učenje in
experementiranje"* — switch at any time between their working state and a state for learning and
experimenting. Decided and **shipped the same day**; see [CHANGELOG](CHANGELOG.md). The subsections
below are kept as the record of what was decided and why — every one of them is now code.

Today the two are the same database, told apart by a `seededDemo` stamp on each record
([seedProvenance.js](src/data/seedProvenance.js)), and the only operation is one-way: the demo is
*removed* (§9.3, UC7). Three
things follow, and all three are what this section answers:

- **There is no way back.** A trainer who clears the demo cannot get it back without losing their own
  work, and one who has started working cannot put the demo aside.
- **Experimenting on real data has nowhere to happen.** Trying a plan change on a real client's
  programme means doing it to the client's programme.
- **The DEMO badge is a guess.** `isDemoOnlyStore(state)` holds only until the trainer's first real
  record, so the badge goes off while the demo is still all over the screen. With workspaces it is a
  fact, not a heuristic.

### 40.1 Two workspaces, and the line between shared and per-workspace

**Two, not many** (Simon): a working workspace and a sandbox. Any number would need naming, a list,
and a choice at boot; two keep the switch to one control.

One rule decides where every stored thing lives: **a fact about the person or the device is shared; a
fact about the data is per workspace.** That axis already exists in
[storageNamespace.js](src/data/storageNamespace.js) as `VERSION_SCOPED_KEYS` against
`ORIGIN_GLOBAL_KEYS` — it is renamed, not invented.

| Shared | Per workspace |
| :--- | :--- |
| The Drive OAuth grant, `librept_drive_connected`, the client id | `driveSync` meta — **the file id and the merge ancestor** |
| `librept_erasure_suppressions` — the erasure register | `backupHistory` meta |
| `trainerIdentity` — name, email, phone | `librept_active_session`, `librept_active_timers`, `librept_workout_setup_draft`, `librept_read_notifications` |
| Theme, accepted terms, chosen language | |

Two of those are not preferences:

**The `driveSync` ancestor MUST be per workspace.** A three-way merge is correct only if the ancestor
is exactly what Drive last saw ([syncMerge.js](src/data/syncMerge.js)). A sandbox that overwrote it
would silently corrupt the next merge of the trainer's real data. This is the only thing in the whole
design that can destroy work.

**The erasure register MUST be shared, as a union.** It is a grow-only set
([erasureSuppression.js](src/data/erasureSuppression.js)), so merging is a union — associative,
idempotent, no conflict. A promise made to a person must not be escapable by switching workspace, and
because every entry is a salted SHA-256 of an opaque record id, a shared list describes nobody.

### 40.2 A separate database, not a store-name prefix

**Ruled 2026-09-10 (Simon):** *"ločeni hrambi"* — separate storage.

**The prefix was considered and rejected** (Simon proposed it as the simpler build, with a guard in
the star write). Three facts decide against it:

1. **An IndexedDB object store can only be created inside `onupgradeneeded`.** A prefix doubles the
   stores at upgrade time and drags `databaseVersion()` ([indexedDb.js](src/data/indexedDb.js)) into a
   second axis, when it is deliberately derived from the highest numbered schema and nothing else. A
   second database changes none of that: `openDatabase({ schemas, name })` already takes `name` as an
   injected argument, because that is how tests have always run against a throwaway database.
2. **Resetting the sandbox is now a recurring operation (§40.4).** With its own database that is
   `deleteDatabase("librept_sandbox")` — one call that cannot reach the trainer's records. With a
   prefix it is deleting by name pattern *inside the database that holds them*.
3. **A guard in the star write is a rule; a separate database is the design.** The handle points at
   another database, so a sandbox write *cannot* touch real data — there is no check to forget and no
   exception to argue about for sync. Value 10.

Atomicity is not lost: a transaction cannot span databases, but the fan-out only ever writes within
one workspace. The prefix would win only for a cross-workspace transaction — "move this record into
my real data" — which is not wanted, and would be an export/import if it ever is.

### 40.3 Switching re-renders; it does not reload the page

**Ruled 2026-09-10 (Simon):** *"Si pa želim preklopa s ponovnim renderiranjem, ne pa reloadom
page-a"* — the switch re-renders, it does not reload. A reload costs the splash hold (`max(5s, boot)`),
the open view, the scroll position and any half-filled dialog, and it puts a service-worker fetch in
the path of a switch that may happen on the gym floor.

The app already replaces its whole database under a running UI — a backup restore
([backupRestore.js](src/modules/common/backupRestore.js)) and a Drive merge
([driveSyncService.js](src/data/driveSyncService.js)) both call `setState()` and re-render. So the
switch is four steps, three of which exist:

```js
async function switchWorkspace(name) {
  await flushWrites();         // writeQueue.js, already exported
  closeDb();                   // dbPromise = null
  setActiveWorkspace(name);    // one localStorage key
  setState(await loadState()); // the existing boot path
  renderEverything();          // §40.3a — does not exist yet
  navigateToPath("/");         // a route from the old workspace must not survive
}
```

**§40.3a `renderEverything()` is the only new piece, and it is a consolidation.** It exists three
times by halves today: the erasure path in [app.js](src/app.js) re-renders three things, the restore
and the Drive merge re-render others. One function used by all four callers removes that drift.

**Four boot-time captures have to become accessors.** `setupClientForms`, `setupRoutineForms`,
`setupExerciseForms` and `setupActiveSession` are each handed `state: getState()` once at boot, so
after any `setState()` they hold the previous object. Measured: **11 `state.` uses across the four
controllers**. This is a latent defect *today*, after every restore and every Drive merge — the switch
does not create it, it exposes it.

Measured cost of the whole switch:

| Work | Size |
| :--- | :--- |
| `workspace.js` — active workspace, database name, key suffix | ~40 lines, new |
| `stateStore`: workspace-scoped `getDb()` plus `switchWorkspace()` | ~30 lines |
| `renderEverything()` extracted, used at 4 call sites | ~30 lines, mostly moved |
| 4 controllers: `state` object → `getState` accessor | 11 references |
| Tinted header and the switch control (§40.5) | small |
| Sandbox lifecycle: seed, reset, staleness (§40.4) | ~80 lines |
| [dataWipe.js](src/data/dataWipe.js): enumerate both databases | small |
| Tests: unit_js for naming and staleness, e2e for isolation and switching | 2 files |

### 40.4 The sandbox holds today's seed, and says when it has gone stale

**Ruled (Simon):** the sandbox is filled exactly as the demo is filled today. No copy-of-real-data
variant for now.

Seeded sessions are generated relative to *now* ([sessions.js](src/data/sessions.js),
[sessionSeriesSeed.js](src/data/sessionSeriesSeed.js)), so a sandbox left for a month is an empty
board. **Ruled:** *"Najbolje, da zaznava zastarelost in predlagava data reset (z izgubo podatkov, če
se uporabnik strinja)"* — detect staleness and offer a reset, losing the sandbox's contents with the
trainer's agreement.

**Ruled 2026-09-10 (Simon):** *"zastarelost naredi v primeru več kot 12 ur — vprašaj ob vklopu demo
načina s cooldown timerjem 3 ure"* — stale after **12 hours**, asked when the sandbox is entered, and
a declined offer is not repeated for **3 hours**.

- The sandbox's `meta` store carries `seededAt`, and `staleOfferDeclinedAt` beside it.
- **Stale at 12 hours.** Not the week the seed spans: what the demo is *for* is a live and an upcoming
  session on today's board ([sessions.js](src/data/sessions.js)), and that is gone by the next
  morning, long before the week's edges are. A trainer who opens the sandbox in the morning and again
  the next day is asked, which is the intent.
- **The cooldown is 3 hours**, held in the sandbox's own `meta`. It survives declining, which is the
  case it exists for, and dies with the reset, which is the case where it means nothing.
- Offered **on entry**, not at boot — at boot it is a question about a workspace the trainer is not in.
- The reset is the first-entry path: delete the database, seed again.
- The dialog says what is lost — *what you did in the sandbox goes* — never "your data will be
  refreshed".

Both numbers are testable exactly, because the browser tiers run on a frozen wall clock
([tests/INDEX.md](tests/INDEX.md)): 11h59m does not ask, 12h01m does, and a decline followed by a
re-entry two hours later stays quiet.

### 40.5 What the trainer sees

**Agreed (Simon):** a tinted header, not only a badge. A badge read at arm's length, one-handed, mid
session, is not enough to stop someone logging a real set into the sandbox. The DEMO/PREVIEW badge
slot ([applicationHeader.js](src/modules/common/applicationHeader.js)) then states the workspace as a
fact and `isDemoOnlyStore()` stops being load-bearing.

**Ruled:** the sandbox survives a reload and a later visit. *"Da."* Otherwise it is a demo with a
timer, and nothing can be learned in it across two days.

### 40.6 Backup and Drive sync stay available inside the sandbox

**Ruled (Simon):** *"Backup in sync ni smiseln, je pa morda uporaben za e-2-e testing in za učenje. Se
mi zdi, da je tudi manj dela, če ohraniva polno funkcionalnost."* Keeping them is both the more useful
and the cheaper answer: **switching them off is a condition at every sync seam — a rule in ten places
— while isolating them is the per-workspace `driveSync` meta §40.1 already requires.**

The residual cost has to be stated rather than discovered: a sync from the sandbox creates a **second
file** in `appDataFolder` and spends the same OAuth grant. So the sandbox syncs to its own file name,
and the sync card in the sandbox says what it is syncing — otherwise a trainer reads "synced" and
believes their real work is safe.

A downloaded backup file is harmless, and "try a restore before doing it for real" is one of the
better things a sandbox offers.

### 40.7 The e2e suite must keep testing production, not the sandbox

**Simon's warning, and it lands:** *"Pozor e-2-e testi ne validirajo peskovnika temveč produkcijsko
kodo!"*

[conftest.py](tests/conftest.py) injects `?init=demo_data_load` for **every** test using the shared
`page` fixture. If demo data came to mean *the sandbox*, the whole e2e tier (231 tests) would quietly
start validating the sandbox instead of the app.

**The rule that prevents it, which is also less work: `?init=demo_data_load` keeps meaning "seed the
CURRENT workspace", which is the working one by default.** The sandbox is entered by a separate,
explicit act — a `?workspace=` parameter or the header control. The existing suite is then untouched,
and the sandbox gets its own e2e file covering exactly what is new: isolation, switching, staleness.

### 40.8 What this leaves of UC7

[uc7_demo_to_clean_database.md](use_cases/uc7_demo_to_clean_database.md) specifies removing demo
records from a mixed database. With two workspaces "clear the demo" is deleting a database, and the
fixpoint dependency planner is not needed for it — but it cannot simply retire:
[demoDataRemoval.js](src/data/demoDataRemoval.js) (172 lines) and
[seedProvenance.js](src/data/seedProvenance.js) (130 lines) are what a device whose database is
*already* mixed needs on the way onto this design. **UC7 becomes the one-time migration**, and the
document is rewritten as that rather than as a standing feature.

**Ruled 2026-09-10 (Simon):** a mixed install is **not split automatically**. Everything it holds
stays in the working workspace, and UC7's cleaner is offered once. Splitting by the stamp would tear a
demo client the trainer renamed and has been training for months away from the real records that
reference them — the exact case `planDemoRemoval`'s fixpoint exists to protect, and it cannot be
protected by a rule applied at boot without a trainer looking at it.

### 40.9 Both "show me around" offers now open the sandbox

**Ruled 2026-09-10 (Simon):** *"oba v demo način"* — the splash's demo-data offer and the guided
story/walkthrough both enter the sandbox rather than seeding the working one.

That is what makes the whole design honest: today the only way to see the product is to put sample
people into the database the trainer is about to work in.
[splashScreen.js](src/modules/splash/splashScreen.js)'s `guidedDemoUrl()` is the single builder behind
both offers, so both move together.

**The `?init=demo_data_load` parameter keeps its own meaning — seed the CURRENT workspace** (§40.7).
The two do not collide: the buttons change where they lead, the parameter does not change what it
does, and [conftest.py](tests/conftest.py)'s injection keeps every existing e2e test in the working
workspace against production paths. The demo and walkthrough tests move into the sandbox, which
is where they belong.

### 40.10 Demo data can never enter the working workspace

**Ruled 2026-09-10 (Simon):** *"restore demo podatkov ne sme biti mogoč v produkcijsko bazo"* — a
restore must not be able to put demo data into the trainer's own database. This overrides the earlier
working assumption that a restore simply lands wherever the trainer happens to be.

**One exact test, not two.** The backup file **declares the workspace it was written in**, and a file
declaring the sandbox is refused whole on the way into the working one. A restore that silently
landed nothing would be a failure reported as a success, so it is a refusal with a reason, not a
filter.

**Ruled 2026-09-10 (Simon):** *"produkcijski backup naj ne ločuje (starih) demo vnosov, install base
je premajhen, da bi to skrbela"* — a file written before this ships carries no declaration, and its
seeded records ride back in untouched. This drops the per-record filter that was proposed here.

It costs nothing real. Such a file came from a mixed database, so restoring it returns exactly the
database the trainer already had — no loss and no surprise — and the rule that matters holds anyway:
nothing can flow *out of the sandbox* into the working one, because the sandbox only
ever writes declared files. The heuristic half of [seedProvenance.js](src/data/seedProvenance.js) (the
committed seed id set) is therefore not needed on this path at all; it stays only for UC7's one-time
cleaner (§40.8).

Into the sandbox nothing is refused: it is the workspace where sample data belongs.

Drive sync needs no separate rule. The `driveSync` file id and ancestor are per workspace (§40.1), so
the working workspace never reads the sandbox's file — the isolation is the same one that keeps
the merge ancestor correct.

### 40.11 A running timer keeps running, and every timer knows which workspace it belongs to

The case: a trainer with a session running steps into the sandbox during a rest period — the only free
moment a session has, and exactly when a rest timer is counting down.

**Nothing is lost by leaving.** A rest timer computes its remaining time from an absolute `endTime`
([exerciseAndRestTimer.js](src/modules/clipboard/exerciseAndRestTimer.js)) and the live session is a
per-workspace key ([sessionCache.js](src/data/sessionCache.js)), so time spent away is accounted for
on return. What would be lost is the **beep**: the module holds its timers in memory, the switch has
to stop the sandbox from showing the working workspace's timers, and tearing the module down stops the
tick that beeps. Same class of defect as §40.3's four boot-time captures — module state silently bound
to one workspace.

**Ruled 2026-09-10 (Simon):** the switch does not stop the clocks. **Every timer carries a mark
saying which workspace it belongs to**, and the mark decides who hears it:

| Where the trainer is | A working-workspace timer expires | A sandbox timer expires |
| :--- | :--- | :--- |
| Working workspace | beeps | **expires silently** |
| Sandbox | **beeps, and says which one** | beeps |

The asymmetry is the point, and it is one sentence: **real work is never missed, and the demonstration
never intrudes on real work.**

**A working-workspace timer expiring while the trainer is in the sandbox names itself and offers two
ways on** — *return to the working workspace*, or *ignore and discard the expired timer*. Naming it
is possible today: a timer already carries `clientName`, `label` and `sessionId`, so the card can say
whose rest is over rather than that some timer somewhere finished.

Neither answer interrupts anything else: nothing is blocked, and a trainer who chooses to stay in the
sandbox stays there.

Implementation notes this leaves:

- The mark is **stamped when the timer is loaded, from the store it came out of** — it is not a second
  place where the truth lives.
- The in-memory map is keyed by `clientId` today, so it becomes keyed by workspace and client. Two
  workspaces cannot collide on an id, but a map that cannot express the pair would drop one of them.
- Ticking is global, the display is filtered by workspace, and §40.3's `switchWorkspace()` therefore
  must **not** tear the timer module down.

### 40.12 It is called the sandbox — in the code, in the docs, and on screen

**Ruled 2026-09-10 (Simon):** *"preklopiva na sandbox povsod"* — one word everywhere, against the
recommendation of a split (screen word "demo", code word `sandbox`) made in the same session. One
word means nothing has to be translated between what we say and what the trainer reads, and it names
the **place** rather than its current **contents** — which is what survives if the sandbox is ever
filled with something other than the demo seed.

`sandbox` is therefore the term in module names, the database name (`librept_sandbox`), storage keys,
i18n keys, this section and the rewritten UC7.

**On screen in Slovenian it is `peskovnik`** (Simon, 2026-09-10) — `sandbox` in `en`, `peskovnik` in
`sl`, one i18n key behind both.

### 40.13 What was assumed while building it

Decisions taken during implementation that no ruling covered. Each is cheap to reverse; each is
written here rather than only in a comment, because a decision nobody was asked about is the kind
that gets found by accident.

**Storage**

1. **The working workspace keeps every name it already has** — the `librept` database, unsuffixed
   keys. So the split arrived as a no-op for existing installs: nothing to migrate, and a sandbox
   nobody has opened does not exist as a database at all.
2. **`librept_workspace` — the pointer saying which workspace is open — belongs to neither of them.**
   It cannot live inside a workspace: it is what selects one. Absent means the working workspace, so
   an unreadable or unknown value fails towards the trainer's own data.
3. **A sandbox reset keeps what belongs to the person.** It deletes the sandbox database and the keys
   suffixed to it; the theme, the language, the accepted terms and the trainer's own name are
   untouched, because they were never the sandbox's.
4. **`resetLibrePTData` deletes both databases.** It sweeps every `librept*` key already, so leaving
   the sandbox database standing would leave a database nothing points at — after telling the trainer
   everything was removed.
4a. **The support wipe (§31) takes the sandbox with the device's own bookkeeping, not as a row of its
   own.** Both databases name their stores identically — `schema4` is in each — so two identical rows
   would ask somebody on a support call to tell them apart, and the sandbox holds sample data only,
   which is nothing worth keeping back. **Ruled 2026-09-10 (Simon):** *"data wipe naj ostane
   totalen"* — the offer of a separate, deselectable sandbox row was declined; a wipe removes
   everything this device holds.

**The language, which was a defect the tests found**

5. **`lang` moved to an origin-global key** (`librept_lang`), joining the theme and the accepted
   terms. It had lived only in each database's meta store — invisible while there was one database,
   and wrong the moment there were two: entering the sandbox produced a store with no language in it,
   and the splash asked a trainer who had answered that question already. The meta copy is still
   written and is still read when the shared key is absent, which carries an install that chose its
   language before this existed.
6. **A save carrying no language never clears that key.** A store that was never asked is not an
   answer being withdrawn — and the sandbox's very first save is exactly such a store.

**Behaviour**

7. ~~The switch resets the route to the dashboard.~~ **Overruled 2026-09-10 (Simon):** *"vrnitev,
   bi bila idelna, da se vrne na prejšnji view (primer clipboard, uporabnik in aktivna vaja)"* —
   coming back returns to the view that was left, the live session included
   ([lastRoute.js](src/data/lastRoute.js)). Stepping out to look something up and landing on the
   dashboard costs three taps to find the session, the client and the exercise again, on a gym floor
   with somebody waiting. A remembered path is used only if the router still recognises it: what it
   names may have been deleted in the meantime, or rebuilt under a sandbox reset. The live session is
   re-recovered for the workspace being entered, and the one held in memory is dropped first — its
   cache key is per workspace, so without that the sandbox would keep showing the trainer's real
   session on the clipboard bar.
8. **A restore lands in the workspace the trainer is in**, and only sandbox → working is refused.
9. **The staleness offer is a real dialog, not a `confirm()`**, and dismissing it counts as declining
   — a question closed is not a question answered yes, so the cooldown starts either way.
10. **A sandbox of unknown age is never stale**, and a clock that moved backwards never makes one
    stale. Both would offer to delete somebody's work on no evidence.
11. **The sandbox is seeded on first entry only** — when it holds nothing. It is never re-seeded
    behind the trainer; §40.4's offer is the only other way it gets filled.
12. **The timer rule, stated as one line in the code:** the trainer's own work beeps wherever they
    are; the sandbox beeps only in the sandbox. The card names the client and what was being timed,
    and "ignore" discards that timer rather than silencing all of them.
13. **The sandbox syncs to its own Drive file** (`librept_sandbox_sync.json`), and the sync card says
    so while the trainer is in there. The erasure register stays ONE file, shared, per §40.1.

**Two things the estimate in §40.3 got wrong**, both worth remembering:

- The four boot-time state captures were real and small, exactly as measured — but `appDeps` was a
  fifth, reaching ten more call sites, and it was fixed at the seam instead: `deps.state` is now a
  live getter, so nothing downstream changed.
- Nothing in the estimate predicted the language defect. It was not introduced by this work; it was
  **exposed** by it, which is the ordinary way a hidden coupling surfaces.

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

---

## 42. [Idea] Detect and report stale or dead links, across versions

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
