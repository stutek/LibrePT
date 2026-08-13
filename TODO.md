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

## Where to start (ranked 2026-08-11)

The governing fact is [docs/PREVIEW.md](docs/PREVIEW.md): the app tells its own users it can wipe
their data. Nothing trainer-facing can be promoted until that is false, so the ranking is **data
safety → showability → everything else**.

**What moved since the 08-09 ranking**: §18.7's core shipped (backups written at a stable numbered
schema, a frozen five-file restore corpus, a confirmation before a restore replaces real data), so
data safety drops out of the top slots and *showability* now leads. §3.5 consent, §25's geometry
gate and §1.5.1's Google canary all shipped in the same window. **§27 is new and enters at rank 3**:
reading the trainer-facing privacy doc against `src/` found two documented data-subject rights with
no code behind them at all.

| Rank | Item | Why now |
| :--- | :--- | :--- |
| 1 | §9.5's promise in the demo notification | A shipped button offers a walkthrough that does not exist — copy change or build it, not both |
| 2 | §27.5, then §27.2/§27.1 | The trainer doc promises an erasure and an export the app does not have; the doc half is a paragraph and a statutory clock runs on the other |
| 3 | §3.8 unbacked-data banner | The honesty surface for the eviction risk; §18.7 gave it a fix to name in the same breath, and 2026-08-12 built its input (`readBackupHistory`) |
| 3= | §3.12 remaining docs as pages | Four in-app links still open GitHub for people with no GitHub account, and none of them work offline — the machinery already exists, so each is one table row plus a repoint |
| 4 | §23.5 demo recording + landing page | Gates every outreach channel, and §23.6's autumn window is a real deadline |
| 5 | §18.7 remainder — `formatVersion` on the envelope | Must land *before* compression or encryption, or every existing file becomes unparseable |
| 6 | §9.5 guided walkthrough | Blank-app churn; big, so not before the above |

**Cheap wins, unranked** — each small enough to ride along with adjacent work: §12.5's reflog expiry
(one maintainer command), §19.3's exercise-library filter reset (a real bug needing no URL decision),
§12.6's glyph subsetting (prerequisite already built), §18.11's retention basis (one paragraph, in
the privacy policy), §21's 60s → 30s navigation timeout (the cause it was raised for is fixed), and
§25.6's medium-tier overflow harness (the sweep already exists).

Deprioritised on purpose: §24.5/§24.7 remainders and §24.8's rename (optional by their own text),
§11/§5.1/§4.1 (large UI churn with no users yet to aim it), §17.2–§17.4 and §18.8–§18.12 (decided on
paper, correctly parked), §12.7 (measured, closed — do not reopen).

### Open work at a glance

One row per theme, so the shape of the backlog is readable without scrolling it. "Blocked on" names
the thing that must happen first, not merely what it touches.

| Theme | Open | Lead item | Blocked on |
| :--- | :--- | :--- | :--- |
| **Launch prerequisites** | §3.3, §23.5, §9.5, §3.8 | Recording + landing page + a real OAuth id | Maintainer actions; nothing technical |
| **Data safety remainder** | §18.7, §18.8, §18.9, §18.11, §18.12 | `formatVersion` envelope | Nothing — but only §18.7 is urgent |
| **Scheduling** | §1.2, §1.3, §1.4, §1.5 | Room occupancy via `freebusy.query` | §1.5's OAuth/verification path |
| **Gym-floor UX** | §7.2, §8.1, §8.7, §8.8 | Feedback buttons showing their own state | Nothing; §7.2 is the real defect of the four |
| **History & templates** | §17.1, §17.2, §17.3, §17.4, §17.5 | Modality into the history snapshot | Decided on paper, parked deliberately |
| **UI redesign** | §4.1, §5.1, §5.2, §11.1, §11.2 | Tabbed client view | Deliberately waiting for real users to aim it |
| **Go-to-market** | §23.1–§23.6 | Decide what "winning" means | §23.1 gates every channel choice |
| **Refactor remainders** | §24.4d, §24.5, §24.7, §24.8 | One movement → plan item mapping | Optional by their own text |
| **Tests & docs** | §6.2, §12.3, §12.4, §12.5, §12.6, §25.6 | Medium-tier overflow harness | Nothing; all small |
| **Routing decisions** | §19.2, §19.3 | The URL-privacy invariant | One decision, then both unblock |
| **Data-subject rights** | §27.1–§27.5 | Correct the doc, then build per-client export | Nothing; §27.1 needs the redact-vs-cascade decision first |

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
  Google resource calendar read via `freebusy.query`, not a backend of our own.
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

#### 1.5.1 [~] Live-Google testing without a stored credential (Workload Identity Federation)

**Built 2026-08-10**: [tests/live/](tests/live/), `.github/workflows/google-canary.yml`,
`build.run_live_google_tests`. Still needs the one-time GCP setup below before it does anything.

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
property, not a verification one: setting the consent screen to **In production** (unverified is
fine, the 100-user cap stays) ends it. Until that happens the secret needs re-uploading weekly, and
a lapsed one makes the canary skip with a warning rather than fail. And the static "canary requests
the app's scopes" check could not survive the move — the grant lives on a consent screen now, not in
the workflow YAML — so it became
[tests/live/tokenScopes.live.test.mjs](tests/live/tokenScopes.live.test.mjs), which asks `tokeninfo`
what the token was actually granted. Strictly better: it also catches an OVER-broad grant (a `drive`
scope left from debugging) that would keep every Drive test green while production's narrow
`drive.appdata` was broken.

- **A service account remains a fine CALENDAR fixture.** `freeBusy` needs no storage, so that half
  would still run keylessly — and this section's room resource calendars are non-human calendars by
  definition, which a service-account calendar models exactly. It is not worth a second credential
  path to save one account's involvement in one test.
- **Testing a PR branch by hand** uses the workflow's `access_token` dispatch input, which
  short-circuits `_credentials.mjs`. Deliberately an ACCESS token, not the refresh token: a
  dispatch input is echoed on the run's own page, so on a public repository treat it as published
  the moment it is submitted. An hour-long token that is revoked afterwards bounds that; a refresh
  token pasted there would be a standing grant on a real account.
- **Not a deploy gate, deliberately.** It sits outside `deploy.yml` rather than joining the chain, so
  Google's uptime can never block a release. `pipeline_gates.py`'s one-terminal-job rule holds
  trivially in a single-job workflow. What it cannot cover — the consent UI — is unautomatable
  anyway: Google fingerprints and blocks driven browsers on `accounts.google.com`.
- **The one setting that must not be wrong**: the WIF provider's attribute condition must pin
  `assertion.repository == 'stutek/LibrePT'`. Without it, *any* repository on GitHub can mint tokens
  as this service account — the classic WIF misconfiguration, exploited in the wild.
- **Blast radius, designed down**: put the service account in a separate GCP project from the
  production OAuth client and give it **zero IAM roles** — it needs none to use its own Drive and
  Calendar, so a leaked token reaches only disposable test data.
- **Remaining maintainer action**: create the pool/provider/service account and store the consumer
  account's refresh token as a Secret Manager secret the service account can read, then set three
  repository *variables* (not secrets — none of the three strings is sensitive)
  `GOOGLE_WIF_PROVIDER`, `GOOGLE_TEST_SERVICE_ACCOUNT` and `GOOGLE_LIVE_SECRET`. Until the first
  exists the canary skips with a warning. Set the consent screen to **In production** while there,
  or the refresh token expires every 7 days.
- **Not built**: a live test importing a real `calendarFreeBusy.js`, because §1.3's occupancy module
  does not exist yet. `calendarFreeBusy.live.test.mjs` probes the endpoint directly meanwhile, which
  is what proves the minted token actually carries the calendar scope.

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

Setup steps and the console field-by-field walkthrough are kept out of this repo, in
`.private/google-cloud-setup.md` (they name accounts and project ids).

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

### 3.8 [ ] Unbacked-data warning banner — same weight as the PREVIEW badge
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

### 7.2 [ ] Feedback button must show its own state — toggled, and "notes exist"
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

- **Toggling off** must clear the stored feedback, not just the button class. Decide whether clearing
  deletes the record or supersedes it — the uc2 deck reads these.
- `getExerciseSignalColor` already resolves the signal; the notes indicator needs an equivalent
  "does this item have a note/voice payload" lookup.
- Applies to standalone cards **and** circuit member rows, and both must agree.

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

### 9.4 [ ] `src/demo/` — simulated finger / touch controller
A separate `src/demo/` folder for demo controls. First module: an on-screen pointer that moves to a
target element and taps it (animated move + ripple), then dispatches the real interaction.

### 9.5 [ ] Guided walkthrough engine (step overlay)
An overlay driving the demo one action at a time: it explains the next action, with **Back**,
**"Show me"** and **Next**. "Show me" triggers §9.4's finger and then becomes "Next"; Next advances
and waits for "Show me" again. Each step binds a real DOM target to a short explanation, covering the
core flows (open a session, switch client, log a signal, complete a round, review an adjustment).

- **⚠ A shipped button already promises this.** The demo notification in
  [messages.js](src/data/messages.js) offers "Explore Walkthrough" and merely navigates to
  `/clients`. Either the copy stops promising it or this gets built — a button that under-delivers is
  the worst of the three options. **Ranked #2 in Where to start.**

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

### 17.3 [ ] Erasure = anonymization only (never delete); design pseudonymization
**Decided (2026-07-22): no hard delete of history.** Erasure strips/replaces identity and retains the
execution records for aggregate analytics.

- Replace PII (name, email, contact) with an anonymous token; session/program/log data stays.
- **Pseudonymization, to design**: a stable pseudonymous id keeps a client's records linkable in
  aggregate (longitudinal volume/1RM curves survive) without being identifiable. Decide **reversible
  vs irreversible** — a true erasure request wants irreversible; "hide but recoverable" wants the
  opposite — and **where a re-identification key could live**, given there is no server, so a
  reversible scheme would keep the mapping in the same local store it is trying to protect. See
  §18.11 for the backup-plus-mapping re-identification gap this creates.
- §17.4's template extraction already strips person/day-specific magnitudes, so a routine derived from
  an anonymized session carries no identity anyway.

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

- **Two version numbers, not one.** `formatVersion` on the envelope (how to open the box: gzip,
  checksum, multi-part, encryption) and `schemaVersion` on the payload (how to read the records). One
  number cannot distinguish "old container, new payload" from the reverse — and the day compression or
  encryption is added, every existing file must still parse. **Land this before either** (§18.8's
  backup encryption is the likely trigger). Ranked #5 in Where to start.
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

### 18.11 [ ] [Open] Legal gaps this design creates
- **Retention basis is undocumented.** No-deletes + anonymization-only + fan-out is technically fine,
  but GDPR Art. 5(1)(e) wants a *stated* retention period. "Retained indefinitely for aggregate
  analytics" is lawful only if written down; neither [PRIVACY.md](PRIVACY.md) nor §17.3 says it.
  **Cheapest item in this file — one paragraph.**
- **Re-identification via backups + the mapping table.** A pre-erasure backup contains
  `abc123 → "Jane Doe"` and the mapping says `abc123 → xyz789`; together they re-identify an anonymized
  record. The usual defence is that backups rotate out — **§18.7's indefinite-restore requirement
  removes it.** A "record of forgotten ids" closes the gap, but needs two properties it does not have
  yet: applied **at import**, not just at erasure (or a restore resurrects the PII), and keyed on the
  stable **`lineageId`** (a per-schema key silently fails to match a backup from another schema).
  Feeds §17.3's unresolved key-location tension.
- **Minimize the suppression list itself** — a retained list of erased people's identifiers is lawful
  (you need it *to honour* the erasure) but should store a salted hash of the id and nothing else.
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
- [ ] **No screenshots or video exist anywhere in the repo.** Nobody adopts a UI tool they cannot see.
      A 20–30s recording of a real set logged one-handed — tap, `⬆ Load Up Next`, next participant — is
      the single highest-leverage asset and is an afternoon of work. **Blocks everything else here**,
      and is ranked #4 in Where to start.
- [ ] **No landing page.** [README.md](README.md) is developer-facing (correctly) and the app boots
      empty. A trainer needs one screen: what it is, the recording, "try it now", "add to home screen".
- [ ] **Share only the demo deep-link, never the bare URL.** `?init=demo_data_load&lang=…&theme=…` is
      an unfair advantage no competitor can match — comment to working clipboard in three seconds, no
      email gate. It also papers over the missing onboarding below.
- [ ] **One headline README feature is still not shippable.** Google Calendar is unbuilt (§1.5).
      Drive sync is now live (§3.3, client id installed 2026-08-12) but reaches only the ≤100
      explicitly-listed test users until the OAuth app is published, so the pitch can promise it only
      with that caveat — or wait for Production-unverified, which drops the list and keeps the cap.
- [ ] **No onboarding for an empty app** (§9.5 unbuilt). A trainer landing on a blank client list
      churns in ten seconds.
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

## 27. Data-subject rights the app documents but cannot perform

[PRIVACY_FOR_TRAINERS.md §5](docs/PRIVACY_FOR_TRAINERS.md) tabulates four data-subject rights against
"what to do in LibrePT". **Two of the four have no code behind them** (verified 2026-08-11): there is
no way to delete a client, and no way to export one client's data. The document is not wrong about
the law — it is wrong about the app, which is worse, because it is written for trainers who will rely
on it while answering a request under a one-month deadline.

Numbering note: section 26 (client self-onboarding via an intake deep-link) was pruned the same day
it was written — the idea is in the git history if it is ever wanted back.

### 27.1 [ ] Erasure (Art. 17) — there is no way to delete a client
The only deletion primitives in `src/` are [`removeDemoData()`](src/data/stateStore.js) and
[`deleteDatabase()`](src/data/indexedDb.js): remove the demo fixture, or destroy everything. No
single-record delete exists at any layer, and [recordDependencies.js](src/data/recordDependencies.js)
declares clients *leaves* — nothing in the codebase describes what removing one would have to take
with it.

**The reason this is not a one-line delete, and the decision to settle first**: a completed group
session with three participants is simultaneously two *other* clients' training record. Erasing one
participant must not delete the other two's history, so erasure here is **per-field redaction inside
shared records**, not row removal. It needs the inverse of `recordDependencies` — what points *at* a
client (sessions by `clientId`, group sessions by participant list, plans and routines, the
`weightHistory` and notes inside the record itself) — and a per-referrer decision between cascade and
redact-in-place. Art. 17 is also not absolute: a session already invoiced may be retained on another
basis, so the action a trainer needs is closer to **"redact identity, keep the training record"** than
to a delete button.

### 27.2 [ ] Access & portability (Art. 15, 20) — no per-client export
The whole-database backup is the only export, and it is exactly what must **never** be sent to a
client: it carries every other client's Art. 9 health data, so honouring an access request with it
would itself be a personal-data breach. The doc meanwhile instructs trainers to "export the client's
history (JSON or Markdown) and send it" as though the action existed.

Needed: a per-client projection over [backupFile.js](src/data/backupFile.js)'s format, plus a
**Markdown rendering** — Art. 12(1) asks for "concise, transparent, intelligible" form, and a raw
JSON dump handed to a lay person arguably is not. The Markdown view is the compliance-relevant half;
the JSON is the portability half. Both come from one projection.

### 27.3 [ ] Erasure does not reach the copies
Deleting the record leaves the Drive `appData` backups already written, any local export the trainer
took, and the frozen restore corpus. The doc's "it goes from this device and from the next cloud
backup" is true of the *next* backup and false of the ones already sitting in Drive — restore an
older one and the erased client is back. Two honest options, and the cheap one may be the right one:

- **Document it** — "erasure also requires deleting backups taken before today" — one paragraph, no
  code, correct.
- **Prune on restore** — a tombstone list the restore path filters against. Note the recursion: a
  tombstone must survive the erasure it records, and a tombstone keyed by client id is itself
  minimal personal data retained after an erasure request. Not obviously the better answer.

Interacts with §18.7's backup work; whichever way it goes, it should be decided before backups gain
compression or encryption.

### 27.4 [ ] Withdrawal as easy as consent (Art. 7(3)) — the cheap one
The consent letter the client receives should carry a one-tap withdrawal route back to the trainer: a
prefilled `mailto:`/`sms:` in the client's own language, reusing what
[consentForm.js](src/modules/common/consentForm.js) already builds for delivery. No server, so it
arrives as a message the trainer acts on — which is compliant, since withdrawal must be *easy*, not
automated. Smallest item in this section by a wide margin, and it makes §3.5's shipped consent flow
symmetrical.

### 27.5 [ ] Until 27.1 and 27.2 ship, the doc must describe what a trainer can actually do
A compliance document naming a button that does not exist is worse than one that says "do this by
hand", because the trainer discovers the gap while a statutory clock is running. Either the doc's §5
rows change to the manual procedure, or they ship. **This half is a paragraph and should not wait for
the other half.**

### 27.6 What this architecture already gets for free
Worth stating so effort goes to the two hard rights rather than the easy ones: **identity
verification** (Art. 12(6)) is trivial here — the trainer knows the client by face, with no account,
no recovery flow and no impersonation vector, where a SaaS has to build for it. And with data never
leaving the device (the trainer's own Drive aside), there is no processor relationship to paper.
The asymmetry is the point: **this architecture makes verification easy and erasure hard**, the exact
inverse of a hosted product, so the backlog should be weighted accordingly.
