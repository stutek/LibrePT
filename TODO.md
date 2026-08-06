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

Open and in-progress backlog. Shipped items **graduate to [CHANGELOG.md](CHANGELOG.md)** and are pruned from here; item numbers are kept stable (gaps mark graduated items) so cross-references stay valid. Items marked **[Brainstorm]** are unresolved design questions to settle before any code is written; **[~]** marks partial work.

Canonical context: [README.md](README.md) (architecture & features), [use_cases/](use_cases/) (workflows), [CONTRIBUTING.md](CONTRIBUTING.md) (conventions).

---

## 1. Scheduling & Sessions

### 1.1 [x] PT-side client assignment to a session
The session card on the home dashboard must let the **PT assign clients to a session directly**, not only rely on client self-subscription via the Google-hosted booking page.

- **Assignment already existed**: the session card's Edit button (`.btn-edit-session`, [sessionCard.js](src/modules/sessionList/sessionCard.js)) opens the same "Start Workout Session" participant-assignment form ([editSessionControl.js](src/modules/session/editSessionControl.js)/[editSessionView.js](src/modules/session/editSessionView.js)) used to create a session — a PT has always been able to check/uncheck clients onto a session's `participants` array directly, independent of the Google-hosted self-subscription page. What this item actually added is the notification half.
- **Built — calendar invite, no email sent**: LibrePT has no backend/SMTP relay ([TODO §1.5](#15--brainstorm-google-calendar-integration--source-of-truth-occupancy-and-data-processor-exposure)'s "no backend of our own" stance), so "notified by a calendar invite email" is a downloadable `.ics` file ([calendarInvite.js](src/data/calendarInvite.js), RFC 5545) plus a prefilled `mailto:` compose — the same honest, no-network pattern as the existing consent-email button in [clientsView.js](src/modules/clients/clientsView.js). On saving a session with newly-assigned participants (diffed against the session's previous `participants`, so re-saving unchanged assignments never re-prompts), [sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js) opens listing each new participant with a "Send invite" action.
- **Open question resolved — no email on record**: assign silently, matching the existing `client.email || t("not_specified")` fallback pattern elsewhere — the invite row shows a disabled "Send invite" button with a tooltip explaining why, rather than blocking assignment or prompting for an address inline.

### 1.2 [ ] Simultaneous sessions merged into one clipboard: multi-line titles + per-participant tags
When several sessions run in **the same time slot with different programmes**, the clipboard must merge **all participants into a single view**, with enough visual separation to tell which participant belongs to which session/programme.

- Relates to the existing "Asynchronous Session Scenarios" capability in [uc1_gym_floor_clipboard.md](use_cases/uc1_gym_floor_clipboard.md).
- The distinguishing signal must survive the gym-floor constraints: glanceable, no reading required.
- **Confirmed not a bug**: this merge already happens today — `getOverlappingBookings`/`launchClipboardDirectly` (`src/helper/utils.js`, `src/views/sessionsView.js`) merge any bookings whose time ranges overlap on the same day into one `startWorkoutSession` call. What's missing is purely the "who's from which booking" visual separation this item has always been about.
- **The data gap**: `buildBookingMeta` already collects a deduplicated `titles` array (and `ids`) across merged bookings — that part is close to free. What's actually discarded is **per-participant origin**: `launchClipboardDirectly`'s merge loop builds a flat `clientId → routineId` map with no record of which source booking each client came from. Needs a parallel `clientId → sourceBookingId` (or `sourceBookingTitle`) map threaded through into the session/`clientRoutines` data so the UI can look it up per person.
- **Decided — where the tag shows**: not on the participant tabs themselves (`components/activeUsersList.js`) — those are already tight on space. Instead, **multiple stacked title lines in the session title bar** (`#session-title-text`, `components/sessionTitleBar.js`) — note `renderSessionTitle()` currently only ever shows `booking.titles[0]` for planning-mode bookings and a plain date/time/location line otherwise; a genuinely merged **live** session doesn't surface `titles` at all today, so this is new UI, not an extension of something existing. Each line should be tappable/associated with a subtle visual tag (e.g. a small color dot) that also appears next to whichever participant tab(s) belong to it, so the pairing is glanceable without reading.
- **Decided — de-duplication**: if two merged bookings share the exact same title (the "same programme split across multiple booking records" scenario this item originally described), they collapse into **one** line/tag, not repeated ones — only genuinely different titles get their own line.

### 1.3 [ ] Session list must model partial overlaps and other PTs' room usage
The session list can no longer assume one session per time slot. Model and display:

- **Partially overlapping sessions** (not just same-slot): sessions that share *part* of a time window — e.g. 10:00–11:00 and 10:30–11:30 — must both render, visibly showing the overlap rather than stacking as if sequential. The current relative-bucket model (`day: today/tomorrow/…`) and the same-day time-overlap merge in `launchClipboardDirectly` only handle full-slot collisions; partial overlaps need a real start/end time model.
  - **Render overlaps the way calendar apps do**: a vertical **time grid** with sessions as blocks whose **top/height map to start/end**, and overlapping blocks placed **side by side** (columns) within the shared span, each narrowed to fit. This replaces the single-column stacked card idea *for time-conflicted ranges* — a session's horizontal position/width encodes its overlap, its vertical position encodes when. Non-overlapping parts of the day can still collapse to save space, but any overlap expands into the aligned grid.
- **Shaded sessions from other PTs sharing the gym/room**: show *other trainers'* bookings for the **same gym/room** as read-only, visually **shaded/muted** context, so a PT sees when a room is already occupied and avoids double-booking equipment. These are not the PT's own sessions — not launchable, no participant detail, just occupancy.
- Implies a **room/resource** dimension on bookings (which room, which trainer) that the data model does not have yet, and a scheduling/availability source for other PTs' bookings. **Source decided in [1.5](#15--brainstorm-google-calendar-integration--source-of-truth-occupancy-and-data-processor-exposure): a per-room Google resource calendar, read via `freebusy.query`** — not a backend of our own.
- Feeds directly into the continuous session timeline ([4.3](#43-x-collapse-the-duplicated-session-header-into-one-row-with-a-date-picker-see-changelog) shipped that rewrite): overlaps and shaded external sessions must be legible within it.

### 1.4 [ ] Calendar preferences — holidays and non-working days
Every PT should be able to configure their own calendar view: import a holiday calendar (public holidays, gym closures) and color-code off days throughout the app.

- Holiday/non-working-day tags surface on the date-jump picker and on the session timeline's day lines (`sessionsView.js`/`sessionTimeline.js`), so a PT scanning the schedule immediately sees which days are closed rather than discovering it session-by-session.
- Needs an import source (a holiday calendar feed/file, per country/region) and a per-PT on/off toggle for which days count as non-working — a gym's actual closures don't always match a public holiday calendar.
- Related to but distinct from the existing per-theme temporal tinting (`--temporal-past`/`--temporal-future`, `src/modules/themes/*.css`) — that's about session recency, this is about the calendar day itself being open or closed.

### 1.5 [ ] [Brainstorm] Google Calendar integration — source of truth, occupancy, and data-processor exposure
**Raised 2026-08-01 (Simon).** Settles the "shared calendar or backend" open question left in [1.3](#13--session-list-must-model-partial-overlaps-and-other-pts-room-usage), and decides what, if anything, sits behind Google Calendar for sync. Cross-referenced from [PRIVACY.md](PRIVACY.md).

- **Source of truth split, by data type**: Google Calendar is the sole authority for scheduling facts — event time, room, and attendee RSVP (`attendee.responseStatus`) — because that is literally where those facts originate (client books via the Google-hosted Appointment Schedule page; RSVP is Google's own field). No local cache or relay may ever be treated as authoritative for "is this booked" or "did they accept" — only GCal's own response after a write is final. App-only data with no Calendar representation (clipboard state, per-participant tags, logged sets/reps) is the one thing the app's own store is genuinely authoritative for.
- **Facility occupancy**: model each gym/room as its own Google resource calendar. Read via `freebusy.query` for the "other PT, room's busy" shading in [1.3](#13--session-list-must-model-partial-overlaps-and-other-pts-room-usage) — free/busy only, never the event body, so no PT's session detail leaks to another PT. Filter workout vs. maintenance events via `extendedProperties.private` (e.g. `eventType: workout|maintenance`) tagged at creation, since Calendar's native `eventType` field doesn't cover this; maintenance can then render as a hard block instead of shaded "avoid if possible" context.
- **PT's own private calendar**: never read by anyone but that PT, and only via their own `freebusy.query` (self double-booking warning against personal commitments) — never surfaced to other PTs, never mixed into the room calendar.
- **Multi-instance sync via Drive `appDataFolder`, no backend of our own**: covers syncing a PT's own app-only data across their own devices, using the same OAuth grant already needed for Calendar. Combined with the room resource calendar for cross-PT occupancy, this covers every sync need raised **without LibrePT operating any backend** — **built, see [3.3](#33-x-google-drive-periodic-sync)** for the actual sync/merge design (it ended up differing from the sketch below in a few ways, noted there).
- **Merge strategy — original sketch, superseded by what §3.3 actually built.** The core call survived: NOT wall-clock last-write-wins ([DATA_MODEL.md](docs/DATA_MODEL.md#invariants-the-star-depends-on) already establishes the device clock isn't trustworthy for ordering), but a three-way merge per record id against a locally-tracked ancestor, not Drive's `headRevisionId`; same-record conflicts are still surfaced, never silently guessed (matching [17.3](#173--erasure--anonymization-only-never-delete-design-pseudonymization)'s "never silently destroy" stance); and deletions turned out **not** to need soft-delete tombstones after all — see §3.3's "Merge" note for why. This bullet is kept only as the paper trail for that last call.
- **PII security on Drive**: `appDataFolder` gives TLS-in-transit and Google's standard server-side AES-256 at-rest encryption, plus access isolation (only this app's OAuth token can read it, invisible in the Drive UI/picker to other apps) — but **not** zero-knowledge encryption; Google's infrastructure can technically access plaintext (abuse scanning, legal process), same as any Drive file. Given client records include injury/health notes (already flagged as sensitive in [17.3](#173--erasure--anonymization-only-never-delete-design-pseudonymization)), default posture is to accept Google's platform security (reasonable GDPR Art. 32 baseline, and — since no server LibrePT operates ever touches this data — Simon stays outside the controller/processor chain entirely, PT-to-Google is the PT's own arrangement). **Optional harden-further path**: client-side encrypt the JSON blob before upload (`Web Crypto API`) so Drive only ever stores ciphertext; real cost is key management — a lost key/device makes that Drive copy unrecoverable, a direct tension with [3.8](#38--unbacked-data-warning-banner--same-weight-as-the-preview-badge)'s "don't silently lose the only copy," so it needs its own recovery-code story before shipping. Not blocking — PRIVACY.md already recommends this as optional, matches the current stance.
- **Why Firestore was rejected as the default**: introducing a Firestore/Firebase backend would make Simon a GDPR **data processor** for PTs' client data (PT = controller, LibrePT = processor, Google Cloud = subprocessor) — a DPA with Google, subprocessor disclosure to PT customers, a data-residency choice, and breach-notification duties, none of which apply to the Calendar+Drive approach since client data never leaves each PT's own Google account or device. Only reconsider Firestore/a relay if a real requirement needs true sub-second live push between devices or server-side compute — **open question, unresolved**: is that actually needed, or is poll-on-resume acceptable?
- **GCP note, independent of the above**: any Calendar API access (with or without Firestore) requires a GCP project registered once by the developer for OAuth client credentials — not per PT, who only ever sees a normal "LibrePT wants to access your Google Calendar" consent screen. Public distribution (beyond ~100 test users) requires Google's OAuth consent-screen **verification** (privacy policy, homepage, review lead time) — a real launch dependency to plan for, separate from the architecture question.

---

## 3. Data Sync

### 3.3 [x] Google Drive periodic sync
Data should sync **periodically to Google Drive**.

- **Decided (2026-08-02), narrowed by [1.5](#15--brainstorm-google-calendar-integration--source-of-truth-occupancy-and-data-processor-exposure)**: `appDataFolder` (hidden per-app Drive space) is what got built — a sync target, not a general human-editable file.
- **Decided (2026-08-03): no visible, human-editable Drive file, ever.** The original ask's "remain editable directly in the Google Drive view" framing is closed against, not deferred. Two reasons, either alone sufficient: (1) `appDataFolder`'s invisibility is what lets [1.5](#15--brainstorm-google-calendar-integration--source-of-truth-occupancy-and-data-processor-exposure)'s PII-isolation point hold (`driveSyncConfig.js`'s scope comment: "never widen this to `drive.file` or `drive`") — a visible file needs exactly the broader scope every PT would have to re-consent to, for a convenience view, not a correctness need; (2) genuine hand-editing of a nested JSON snapshot (clients → routines → sets/reps) has no safe UI in Drive itself — Drive has no JSON editor, so it would mean either raw-text editing one typo from an unparseable sync, or a full Sheets API rebuild (a second, row-based merge model) for a want nobody has asked for. **The escape hatch that already covers the actual need**: a PT who wants to see or hand-edit their data outside the app uses the existing Export/Import JSON backup ([3.7](#37--x--superseded-by-186-persistence-engine--localstorage-json-then-indexeddb)) — a plain download/upload, no OAuth scope, no live sync coupling. Storing the sync file in Google's OKF format was the same question one layer down and is closed for the same reason: there is no human-editing use case left to serve it.
- **Built**: [driveSyncConfig.js](src/data/driveSyncConfig.js) (the one deployment constant — `GOOGLE_DRIVE_CLIENT_ID`, blank until the maintainer fills it in from their own GCP project; a blank id is a supported "not configured" state, not an error), [googleAuth.js](src/data/googleAuth.js) (Google Identity Services token client, lazy-loaded only on first "Connect Google Drive" tap — never on boot), [driveAppData.js](src/data/driveAppData.js) (the appDataFolder REST client — find/download/create/update one JSON file), [syncMerge.js](src/data/syncMerge.js) (the merge — see below), and [driveSyncService.js](src/data/driveSyncService.js) (the orchestrator). UI: a "Cloud Backup (Google Drive)" card in the Sync & Backup dialog ([driveSyncUi.js](src/modules/common/driveSyncUi.js)), reachable from the ☰ menu's "Connect cloud storage" (previously a "coming soon" placeholder). Sync runs on manual "Sync Now" or on tapping the header's cloud icon directly (`#backup-btn` — opens the dialog as before AND fires an immediate sync when already connected, `driveSyncUi.js`'s `setupHeaderCloudIconSync`) — **manual-only as of §3.10**. Poll-on-resume (`visibilitychange`) and the PT-configurable periodic timer (1–60 min, default 5, `driveSyncService.js`'s `getSyncIntervalMinutes`/`setSyncIntervalMinutes`/`startPeriodicSync` — a plain `localStorage` preference like the theme choice, not schema data, and started unconditionally at boot since it no-ops until connected) no longer run a sync pass at all; they only refresh the ahead/behind counters (§3.10).
- **Merge, decided differently than §1.5 first sketched**: a per-record-id three-way merge against the last-synced snapshot as the common ancestor (`mergeState`/`mergeCollection` in syncMerge.js) — never wall-clock last-write-wins, matching [DATA_MODEL.md](docs/DATA_MODEL.md)'s "the device clock is not trustworthy" invariant. **No Lamport `(deviceId, seq)` pair, despite §18.5 flagging one as eventually necessary**: this merge never tries to order two edits chronologically — it detects "changed on both sides since the shared ancestor" and reports a conflict instead of picking a time-based winner, so the clock substitute Lamport pairs exist for was never needed. **No persisted tombstones either** (§1.5 speculated they would be): the remote snapshot is always freshly downloaded (never reconstructed from a stale cache) and Drive's own file history is linear (only this merge ever writes it), so an id's absence from a fresh `remote` fetch already carries the deletion signal — see syncMerge.js's header comment for the full argument, including what would invalidate it (anything else ever writing the same Drive file).
- **Conflict handling, including review**: same-record conflicts are detected and never silently destroy data (an edit always wins over a deletion; a same-record double-edit takes the local side and carries the remote side alongside it), and are surfaced in `driveSyncStatus().lastSyncResult.conflicts`. A "Review conflicts (N)" button now appears on the Drive card whenever that list is non-empty, opening a dialog (`renderConflictsDialog`/`renderConflictsList` in driveSyncUi.js) that lists each conflict's two sides as plain-text JSON and lets the trainer pick which one survives — `resolveSyncConflict()` in driveSyncService.js replaces (or, for the deletion-vs-edit types, removes) that one record in local state; it doesn't re-run the merge, so the next sync pass just uploads the choice like any other local edit. Record contents are rendered via `textContent`/`<pre>`, never an HTML sink, so arbitrary client data (names, notes, injury text) never needs per-field escaping.
- **Not built**: incremental sync via the Drive Changes API (`changes.list`/`pageToken`) — every sync pass downloads and re-uploads the whole JSON file. Correct, not bandwidth-minimal; a real optimisation once this path has real usage to size against, not a correctness gap.
- **What syncs**: every collection a backup export already carries (clients, exercises, routines, sessions, history, planUpdates, notifications) — `schemaVersion`/`lang` stay per-device. §1.5's narrower "app-only data with no Calendar equivalent" framing is the long-run target once Calendar integration exists as the scheduling source of truth; until then there is no Calendar-sourced overlap to exclude.
- **CSP updated** (index.html `<meta>` + `deploy/local_http_server.py`'s header, kept in parity) to allow `script-src`/`connect-src` for `accounts.google.com`, `www.googleapis.com`, `oauth2.googleapis.com` — inert until a trainer taps "Connect Google Drive", since the GIS script and every Drive call are lazy-loaded off that click, never on boot.
- **Genuine external dependency, not a design gap**: `GOOGLE_DRIVE_CLIENT_ID` needs a real GCP OAuth client id, which only the deployment's maintainer can create (a Google Cloud Console action, TODO §1.5's "GCP note") — see driveSyncConfig.js's header for the exact steps. Live-OAuth behaviour (the actual consent popup, real Drive round-trips) is therefore untested in CI by design; the automated suite pins the merge logic, the Drive request shapes (against an injected `fetchImpl`, no network), and the honest "not configured" UI state.

### 3.5 [ ] Paper consent — record checkbox + date; provide a printable blank form
**Decided (2026-07-22): KISS — consent lives on paper, not in the app.** Blank consent forms are kept at the gym; the client signs one, the PT **files the paper**. That physical file is the system of record for evidence. **No photo capture, no image storage, no email flow, no IMAP** — all considered and dropped as needless complexity for a solo, offline-first PT.

- App's only job: the existing `gdprConsent.cloudSync` checkbox plus an editable **consent date** (defaults to today — the paper may have been signed earlier), recording that signed paper consent was obtained and filed. Replaces relying on the invisible `timestamp` alone.
- Optionally surface a **printable blank consent form** from the app — the full text already exists in `docs/templates/Client_Consent_Form.md` — so a PT can print copies to keep at the desk.
- **Supersedes the shipped `mailto:` consent trigger** (former 3.4); that email path can be removed once this lands.

### 3.7 [x] [Superseded by §18.6] Persistence engine — localStorage JSON, then IndexedDB
**Decided (2026-07-22): stay on `localStorage` JSON**, deferring a real DB until a concrete driver appeared (binary data, the 5MB cap, or indexed queries). **Superseded 2026-07-26**: §17.1 shipped and a very busy PT reaches ~16.6 MiB/yr in a single bucket — the cap this item named as its revisit trigger. The engine decision is now IndexedDB; full reasoning and sizing live in §18.6.

### 3.8 [ ] Unbacked-data warning banner — same weight as the PREVIEW badge
**Raised 2026-07-26 (Simon).** The database holds the **only** copy of a trainer's records ([DATA_MODEL §6](docs/DATA_MODEL.md)), and a browser can evict IndexedDB under storage pressure. A PT with months of history and no external copy is one wiped profile away from losing the business's records, and today nothing on screen says so.

- **Surface**: a persistent banner in the header strip, styled and placed like `#preview-badge` ([index.html](src/index.html)) — same visual weight, same "tap for the full explanation" affordance, linking to a short doc on what is at risk and how to fix it.
- **Condition**: shown while the data has **no secured external copy** — no cloud target configured, or the last successful export/sync is stale (threshold to decide; "never" is the obvious first case). It is *not* the offline indicator and not the ahead/behind badge (3.9) — those say "not pushed *yet*"; this says "nothing anywhere but this browser profile".
- **Dismissal**: must not be permanently dismissible while the condition holds — the risk does not go away because the banner was closed. Session-scoped dismissal at most; decide.
- **Wording is the whole feature.** It has to be honest without being alarmist to a PT mid-session ("Only copy — no backup yet" beats "DATA LOSS RISK"), and it must state the fix in the same breath (Sync & Backup, one tap away).
- **Interacts with**: [storageDurability.js](src/data/storageDurability.js) already measures eviction risk by consequence (quota, `persist()`), so the banner can escalate its wording when the browser has *refused* persistence rather than merely not been asked.
- **Depends on** a real cloud target existing (3.3); until then it can only track "last export downloaded", which the Backup dialog already knows.

### 3.9 [x] [Decided] Every write increments the ahead counter on the Sync & Backup button
**Raised 2026-07-26 (Simon). Fixed 2026-08-03**, once §3.3's Drive sync gave the badge a real ancestor to diff against. The `↑n ↓n` badge on `#backup-btn` reads like git's ahead/behind — "you have n local changes not yet pushed" — and is no longer mock state.

- **Fixed at the seam, not the call sites, as this item originally called for**: `saveToLocalStorage()` in [stateStore.js](src/data/stateStore.js) now takes no counting callback at all — `onStateSaved(listener)` registers ONE listener (`app.js`, at boot: `renderSyncBadge`), and every writer that reaches `saveToLocalStorage()` fires it, whether it came through `app.js`'s `saveState()` wrapper or one of the ~21 call sites that import `saveToLocalStorage` from `stateStore.js` directly and previously bypassed the old per-call-site `incrementLocalSyncFn` parameter entirely. `saveActiveSessionToCache()` (the live-session cache, ~16 call sites) is deliberately still not wired in — see below.
- **"One change" ended up not needing a definition**: no counting happens at all any more. `local` (ahead) is a **live diff** — [syncMerge.js](src/data/syncMerge.js)'s `countChangedRecords()`, the same primitive the merge itself uses — between the current domain state and the last Drive-sync ancestor ([driveSyncService.js](src/data/driveSyncService.js)'s `getAheadCount()`). A keystroke that doesn't change the resolved record isn't "ahead"; ten edits to the same field collapse to one changed record, matching git's per-commit granularity for free rather than needing a debounce policy.
- **Why the live-session cache still isn't wired in**: `saveActiveSessionToCache()` writes `librept_active_session`, not any of the collections `countChangedRecords` diffs — a PT mid-session sees "ahead" tick up once that session's results land in `history`/`sessions` via a real `saveToLocalStorage()`, not on every set logged. This is a narrower definition of "ahead" than the item originally intended (any unsaved change, including scratch state), but it is the one that matches what a Drive sync actually pushes — showing scratch-cache churn as "ahead" would make the badge lie about what a sync would even send.
- **`remote` (behind) needed a different answer, not a counter**: with every sync being a full download-merge-upload pass ([§3.3](#33-x-google-drive-periodic-sync)), there is no partial-pull state to count — behind is always 0 immediately after a successful sync. The badge's `?` (already built for `isCloudConfigured`/`isCloudReachable`) is what shows honestly whenever that number isn't trustworthy: no Drive target configured, never synced, or the last attempt failed. A live incremental behind-count would need the not-yet-built Changes API path this same section already defers. **Superseded 2026-08-04 by §3.10**: `behind` is now live too, via a read-only counter refresh, not the not-yet-built Changes API.

### 3.10 [x] [Decided] Drive syncing is manual-only; periodic/resume ticks refresh counters, not data
**Raised 2026-08-04 (Simon).** §3.3 shipped three *automatic* sync triggers alongside the manual ones — poll-on-resume and the PT-configurable periodic timer both ran a full `syncNow()` (download → merge → apply locally → upload) in the background. That's a real merge happening with no trainer looking at the screen, on a device that could be mid-session — not what "sync on my terms" should mean for data this important.

- **Decided**: every actual sync pass (merge/apply/upload) now runs only from an explicit tap — the Sync & Backup dialog's "Sync Now" button, first-connect, or the header cloud icon (`driveSyncUi.js`'s `setupHeaderCloudIconSync`). The periodic timer (`driveSyncService.js`'s `startPeriodicSync`/`periodicTick`) and the resume hook (`appLifecycleController.js`'s `setupDriveSyncOnResume`) no longer call `syncNow()` at all.
- **What they call instead**: a new read-only `refreshSyncCounts()` in `driveSyncService.js` — downloads the remote Drive file if one exists purely to diff it against the last-synced ancestor via the existing `countChangedRecords()` (the same primitive §3.9's `ahead` count already used), and updates `behind` from that diff. It never merges, applies, or uploads anything, so `behind` is now a live number rather than the constant-0 §3.9 left as a placeholder for a future Changes API path.
- **Badge stays live without a sync**: a counts-only refresh never touches local state, so it never fires `onStateSaved` (the seam §3.9 built for the `ahead` half). A second, parallel single-listener seam — `onSyncCountsChanged()` — covers the `behind` half; `app.js` registers `renderSyncBadge` on both at boot.
- **Net effect**: the header's `↑n ↓n` badge stays as close to real-time as before, but the only code path that ever writes to Drive or merges into local state is a trainer's own tap.

---

## 4. UI / UX

### 4.1 [ ] Theme redesign
- **Light mode** needs a nicer design, along the lines of: <https://claude.ai/code/artifact/f27dc4ca-e1b4-47dd-b3c6-34dee3d6110c>
- **Dark theme** should be improved in the same pass.
- Constraint: both themes must keep working from the CSS custom properties in `index.css` — no hard-coded theme colours.

### 4.3 [x] Collapse the duplicated session header into one row, with a date picker — see CHANGELOG
Shipped as part of the continuous-timeline rewrite (2026-07-27): the duplicated header row is gone, and the calendar icon opens a native typed-date picker (`sessionTimeline.js`'s `#sessions-date-picker`/`.showPicker()`) that jumps straight to the chosen date. The blocking premise this item once had — sessions carried no real date — is resolved: schema 3 gave sessions a real `startDate`.

---

## 5. Client Detail

### 5.1 [ ] Tabbed client view
Clicking an individual client opens a **tabbed** view (today it opens a single flat profile screen, `view-client-detail`):

NOTE: keep the goals and health & injury notes as is. (Done: removed "log workout session" button `btn-start-client-workout` from `view-client-detail`.)

| Tab | Content |
| :--- | :--- |
| **1 — Sessions** | The sessions this person attended. |
| **2 — Exercises** | A **chronologically ordered** list of every exercise the person **has done or will do**, with **no grouping or restriction by session** — one continuous timeline across their whole history and future plan. |
| **3 — Next session prep** | Where the trainer **creates new cards** for the next planned session, **or** for a generic **"placeholder session" that is not yet on the calendar**. |

- Tab 2 is a genuinely new projection of the data: exercises currently only exist *inside* sessions/routines, so this needs a flattened, date-ordered view spanning logged history **and** planned future work.
- Tab 3 introduces a **session that exists without a calendar entry**. Decide where such a placeholder session lives in the data model, and what happens when it is later attached to a real booking.
- Reuses the existing placeholder-card concept from [uc1_gym_floor_clipboard.md](use_cases/uc1_gym_floor_clipboard.md), but at the desk rather than on the gym floor — closes the loop with [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md).

### 5.2 [ ] Client add/modify — fold editing into the detail view, keep creation a minimal modal
**Decided (2026-07-22): no standalone add/modify client view.** Unlike a session (setup vs live clipboard are genuinely different modes), a client has no "live" mode — the detail screen is where you both view *and* edit, so a separate edit view would just duplicate it.

- **Create** = a lightweight modal with the minimum to bring the client into existence (name, maybe phone). Zero friction at signup / on the floor; creating drops the PT straight into the detail view for everything else.
- **Edit** = inline, inside the tabbed client-detail view ([5.1](#51--tabbed-client-view)) — no separate route. Effectively a sub-decision of 5.1 and should ship with it.

---

## 6. Housekeeping

### 6.2 [~] Extract use cases and usage scenarios from the tests
The Playwright suite already drives real end-to-end flows (gym-floor clipboard launch, voice notes, feedback → adjustment wizard, day-deck navigation, swipes). Those flows are **executable usage scenarios** that are currently documented nowhere.

- Extract the scenarios the tests actually exercise and **document them properly** in [use_cases/](use_cases/), following OKF (frontmatter + `INDEX.md` row + graph links).
- **Partly done**: the biggest gap the tests exercised but no UC specified — the **session day deck, deep-linkable views, and the not-found flow** — is now written up as **[UC5](use_cases/uc5_session_day_deck_and_deep_links.md)** (OKF frontmatter + both INDEX rows + graph links to UC1/UC2/UC4), including a **spec↔test traceability table** mapping each scenario to `test_sessions_dashboard.py` / `test_session_deeplink.py` / `test_error_view.py` / `test_clipboard.py`.
- **Still open**: (a) the reverse gaps — UC1/UC2 behaviour (voice notes, the feedback→adjustment wizard, plan pivots) that has partial or no test coverage; (b) whether the newer app-surface flows (themes, header menu, first-run terms, sync/backup) each deserve a UC or belong in README feature docs. The interesting reconciliation of *specified-but-untested* is not yet complete.

---

## 7. Feedback Loop

### 7.1 [ ] [Brainstorm] One-click resolve for pending plan adjustments
Pending plan adjustment reminders — **do we allow a 1-click resolve?**

- Tension to resolve: one-tap resolution fits the low-interaction principle, but plan adjustments are exactly the decisions that deserve deliberate review at the desk ([uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md)).

### 7.2 [ ] Feedback button must show its own state — toggled, and "notes exist"
**Raised 2026-07-26 (Simon).** On the deck card, the three signal buttons (`.deck-action-easy` / `.deck-action-hard` / `.deck-action-feedback` in [exerciseCard.js](src/modules/clipboard/exerciseCard.js), and the `.circuit-sig` trio on a circuit card) look identical before and after they are used. A PT who tapped *Too Hard* thirty seconds ago has no way to see it landed, so the natural response is to tap again — which logs a second signal.

Three distinct things the control must express, and they are **not** the same signal:

1. **Toggled on** — this signal is currently set for this exercise. Needs a filled/active **background**, not just a colour tweak on the icon: it must read at arm's length on a bright gym floor, and it is the state the PT is most likely to be checking mid-set.
2. **Icon changes with the state** — an outline icon for "available" vs a solid/filled one for "set", so the meaning survives for a colour-blind PT and in the greyscale of a sunlit screen. Colour alone is not a state indicator.
3. **Notes are present** — a *separate* mark for "there is a written/voice note attached here", independent of whether a quick signal is toggled. A note is content, a signal is a flag; a card can have either, both, or neither, and the trainer needs to know a note exists without opening the modal.

- **Toggling off**: if the button toggles, tapping an active signal must **clear** it, and that must round-trip to the stored feedback (not just the button's class). Decide whether clearing deletes the feedback record or supersedes it — the plan-adjustment deck (uc2) reads these, so a silently deleted signal changes what the PT sees at the desk.
- **Where the state comes from**: `getExerciseSignalColor` already resolves a per-exercise signal for the deck; the notes indicator needs an equivalent "does this item have feedback with a note/voice payload" lookup.
- **Applies to both card types** — standalone exercise cards and circuit member rows — and both must agree, since the same movement can be logged from either.

### 7.3 [~] [Brainstorm] Session-level "Pending Review" flag, unscheduled sessions, and a shared scrollable-deck component
**Raised 2026-07-27 (Simon).** Renamed the dashboard deck/menu label from "Pending Adjustments" to **"Pending Review"** (shipped: [en.js](src/i18n/en.js), [sl.js](src/i18n/sl.js), [index.html](src/index.html)) — label only, no model change yet. The rest of this is a bundle of related but separable proposals; each needs a call before it's built:

1. **Session-level review flag.** Proposal: *any session containing an item with feedback attached is flagged for review.* This is a coarser unit than today's model, where each feedback tag on [planUpdates.js](src/data/planUpdates.js) becomes its own card ([planAdjustments.js](src/modules/plans/planAdjustments.js)). Recommendation: keep per-item feedback as the underlying record (don't collapse the tag detail PTs currently see per exercise) and add a **derived** `needsReview` roll-up at the session level for the dashboard/registry surface — opening the session still shows which item(s) carry which tag.
2. **"PT decides when a review is addressed" — CLARIFIED**: per feedback record, not per session. Resolution stays exactly where it already lives — the `resolved` flag on an individual `planUpdates` entry, set via the existing adjustment wizard ([planAdjustments.js](src/modules/plans/planAdjustments.js)). The session-level flag from (1) is therefore purely derived (`needsReview = any unresolved feedback record among the session's items`) and never itself stores a resolved/addressed bit — one source of truth, no drift to reconcile.
3. **Edit-plan-from-review → schedule or leave unscheduled.** This assumes an "unscheduled session" exists at all — it currently doesn't. Sessions now carry a real `startDate` (schema 3, (8) below, shipped), so "unscheduled" is cleanly a session with no `startDate` rather than a fifth bucket value — but the state itself, the router, and backup/restore round-trip still need to accept and preserve it. Not yet built.
4. **Client-in-registry → all sessions as a scrollable, potentially-infinite deck.** Agreed as a good addition; "potentially infinite" should mean windowed/virtualized rendering (recycle off-screen cards), not literally unbounded DOM nodes — a client with years of history would otherwise degrade the exact gym-floor responsiveness this app is built to protect.
5. **One shared scrollable-deck component for session cards and clipboard exercise/superset/rest cards.** Partial pushback: the clipboard cards are mid-flight on their own inline-edit spec ([clipboard-inline-edit-feature](src/modules/clipboard/clipboardEditor.js), drag/tap reorder, swap/add/remove) while session-history cards in the registry are read-only browsing. Collapsing both into one component risks tangling drag-reorder + edit affordances into a view that should stay browse-only. Recommendation: extract the shared part — the virtualized scroll/snap container and card shell — as the common component, and keep reorder/edit interaction logic in the clipboard-specific consumer that composes on top of it.
6. **Ordering — CLARIFIED**: every session card is strictly time-ordered along the axis; **unscheduled is the one exception**, sitting as its own non-time-ordered cluster at the past/active → future pivot (after (1)'s past/active, before any future card) rather than being sorted by a date it doesn't have. Only meaningful once (3) exists.
7. **Filterable session cards (past/active/future/for-review/unscheduled).** Agreed, standard chip-filter row; depends on (1) and (3) existing first since two of the five filter values are new state.
8. **[x] SHIPPED — the dashboard day-deck became one continuous, time-ordered timeline.** Graduated to [CHANGELOG.md](CHANGELOG.md). The prev/next arrows and weekday/date title text this originally shipped with were themselves later removed in favor of the sticky per-day headers alone — see `sessionTimeline.js`/`sessionsView.css`. No virtualization/windowing was added (open call, not an oversight): worth revisiting only if session volumes ever justify it.
9. **CLARIFIED — unscheduled cards are directionally sticky.** They sit at the past/future pivot (per (6)) and must **not disappear when scrolling toward the future** (stay reachable as an actionable "needs scheduling" reminder no matter how far forward the PT browses) but **may scroll out of view when scrolling toward the past** (once you're reviewing history, they're no longer relevant). This is not plain CSS `position: sticky` — sticky pins in both scroll directions. It needs scroll-direction-aware pinning: hold the unscheduled block at the pivot edge while `scrollTop`/`scrollLeft` increases toward the future, release it to scroll normally with the rest of the list once direction reverses past the pivot. Flagging as its own sub-task under (8), since it's real interaction-code complexity, not styling.

**Sequencing implication**: (8) — the continuous-timeline rewrite — was the load-bearing prerequisite beneath everything else in this bundle, and is now shipped: (3)'s unscheduled state needs somewhere to live in the new axis, (4)'s registry deck should reuse the same timeline rendering rather than inventing a second one, and (6)/(9)/half of (7) are all behaviors *of* that axis. Next up per this ordering: (3) unscheduled sessions, then (9), (4), (7).

---

## 8. Clipboard Interactions

### 8.1 [ ] Bind multiple clients to one shared set of exercises
Allow **two or more participants to be bound to the same set of exercises**, merging their tabs into a **single combined view** in the clipboard (they train the identical programme in lockstep, so the trainer logs the shared plan once instead of switching tabs per person).

- The **exercise cards are shared** across the bound clients; navigating/logging the plan advances it for the whole group.
- **Feedback stays per-person**: `Too Easy` / `Too Hard` / voice notes must still record against the **individual** client, not the group — one client can find a shared set too hard while another finds it too easy.
- Decide the data model: a per-client `clientRoutines[clientId]` today owns its own `exercises` + `logs`. Binding needs either a shared exercise reference with per-client log/feedback overlays, or a "group" pseudo-participant that fans feedback back out to members.
- Interacts with the merged-session view ([1.2](#12--simultaneous-sessions-merged-into-one-clipboard-multi-line-titles--per-participant-tags)) and the horizontal participant tabs — a bound group should read as one tab, expandable to its members.

### 8.3 [x] Inline Clipboard Editor — SHIPPED (the saved patch is long gone)
An on-the-fly edit mode for the active session clipboard (`src/components/clipboardEditor.js`), saved as an unstaged patch (`patches/inline_clipboard_editor.patch`) so it can be cleanly reviewed/applied after core refactoring passes.
- When the trainer taps a card's edit (✎) affordance (`.deck-card-edit`), the deck flips into an inline editable list (`renderClipboardEditor`).
- Allows swapping exercises, retargeting sets/reps/weight, reordering rows via tap or drag (`.editor-reorder`), adding new exercises, and adjusting rest breaks directly inside the live session without leaving the gym floor.
- ~~To apply later: `git apply patches/inline_clipboard_editor.patch`.~~
**Closed by the 2026-08-06 sweep.** Everything above shipped and the entry simply was never ticked:
the editor lives at [clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) (not the
`src/components/` path this entry predates), and `patches/` does not exist — the patch was applied
or superseded, so the "apply later" instruction pointed at nothing. Covered by three medium suites:
[test_clipboard_editor.py](tests/medium/test_clipboard_editor.py) (drag reorder, circuit
well-formedness), [test_clipboard_catalog_picker.py](tests/medium/test_clipboard_catalog_picker.py)
(swapping a movement) and [test_clipboard_edit_mode.py](tests/medium/test_clipboard_edit_mode.py)
(the mode's chrome).

### 8.7 [ ] [Discuss] Should completing a circuit ROUND stop its timer, like completing the block does?
**Raised 2026-08-06 (Simon).** The behaviour is currently asymmetric, and the asymmetry was never
decided — it fell out of where the code happened to put the call.
[`completeCircuitRound`](src/controllers/activeSessionController.js) does two different things
depending on which round you are on:

- **Final round** — logs are marked complete, focus moves past the block, and
  `stopTimerIfMatches(clientId, { type: "circuit", id: circuitId })` **freezes** any timer bound to
  that circuit. Freeze, not clear: the trainer sees it held at its final value and dismisses it with
  ✕ themselves, so a number they might still want to read is never yanked away.
- **Any earlier round** — the round counter increments and **the timer is left entirely alone**.

So tapping the same control does or does not touch the timer depending on a number the trainer is
not looking at. The question is which behaviour is right for the earlier rounds.

- **Argument for leaving it running**: between rounds of a circuit, a running rest countdown is
  exactly what the trainer is pacing off. Freezing it at round 2 of 4 would destroy the thing they
  started it for, and they would have to restart it every round.
- **Argument for stopping it**: the round is over, so a timer started *against that round* is
  measuring nothing. Whether that is true depends on what the timer was started FOR — and
  `focusRef` only records `{type: "circuit", id}`, so the app currently cannot tell "resting between
  rounds" from "timing this round's work". That may be the real gap: the decision needs a
  distinction the data model does not yet make.
- **Worth checking against the gym floor before coding either**: what does the trainer physically do
  at the end of a round — start a rest, or keep the same clock running through the whole block?
  §8.6's rests-as-first-class-items means a between-rounds rest can now be a real plan item with its
  own timer, which may make the question moot for well-authored circuits and only relevant for
  ad-hoc ones.

No behaviour change until this is settled; the entry exists so the asymmetry is a recorded decision
rather than an accident nobody revisits.

### 8.6 [x] Rests are first-class, focusable plan items — see CHANGELOG
Polymorphic `DeckCard` hierarchy ([deckCard.js](src/modules/clipboard/deckCard.js) +
subclasses) — full build notes graduated to [CHANGELOG.md](CHANGELOG.md).

---

## 9. Interactive Demo / Guided Onboarding

The big new feature: a first-run onboarding that walks a new user through the app end-to-end with a simulated finger, instead of seeding demo data silently. The app already **boots empty** with an opt-in demo deep-link (shipped, see CHANGELOG); the phases below build the guided walkthrough on top. Each is committable on its own.

### 9.2 [~] Demo-data loader — PARTIAL
A demo loader exists: opening `?init=demo_data_load` (parsed in `src/helper/shareLink.js`, applied at boot) populates the demo dataset, but **only when the app is genuinely empty** — it's ignored if any data is already present, so it never clobbers real records. It currently loads the **full** `src/data/` fixture via `seedMockData()` + `seedDemoActiveSession()`.
- **Still TODO:** narrow it to a focused **subset** (a few clients, one or two routines, today's sessions, the in-progress session) for the guided walkthrough, and expose it as a callable `loadDemoData()` invoked by the in-app demo activation (9.5 walkthrough) rather than only via the URL param.

### 9.4 [ ] `src/demo/` — simulated finger / touch controller
Create a **separate `src/demo/` folder** for the demo controls. First module: a **touch indicator** that simulates a user's finger — an on-screen pointer that **moves to a target element and taps it**, visibly executing the action (animated move + tap ripple), then dispatches the real click/interaction on the target.

### 9.5 [ ] Guided walkthrough engine (step overlay)
An overlay component that drives the demo one action at a time:

- The overlay **explains the next action to be performed**, with buttons **Back**, **"Show me"**, and **Next**.
- **"Show me"** triggers the simulated finger (9.4) to move + tap and execute the action. Once the action has executed, **"Show me" hides and the button becomes "Next"**.
- Clicking **Next** advances: the overlay explains the upcoming action and **waits for the user to click "Show me"** again.
- **Back** steps to the previous action.
- Each step binds to a real DOM target + a short explanation; the sequence covers the core flows (open a session, switch client, log a signal, complete a round, review a pending adjustment, etc.).

### 9.6 [ ] [TBD] Install as an offline Android / iOS app
Figure out how to have the app installed as an Android/iOS application on the phone **without any mandatory dependency on internet connectivity**. It's already a PWA (manifest + service worker precache); open questions: install prompt/A2HS UX, fully-offline first load, and whether the GitHub Pages origin is acceptable or a packaged (TWA / Capacitor / bare PWA) wrapper is needed.

---

## 11. Navigation & Layout Redesign

### 11.1 [ ] Replace the footer nav with a message / status area
Replace the bottom navigation bar with the session-bar contents evolved into a **general message area**: current/upcoming session, client spot reservations in slots, customers cancelling their spot on a session, and the "run the demo" invite (9.x).

- Navigation (Clients / Routines / Exercises / History) needs a new home — proposal: a compact tab row **in the omnipresent header**.
- The message feed is priority-ordered: live session → next upcoming session → notifications (reservations / cancellations, tappable to the affected session).

### 11.2 [ ] Active-session overlay → a normal `#view`
Fold the full-screen active-session overlay (`#active-session-overlay`) into a normal `#view-session` inside `#main-content`, like the other views — now that the header is omnipresent and sits above it, the fixed-overlay special-casing is redundant. Consistent view/router handling; simplifies the deck/tabs/title-bar wiring.

---

## 12. Documentation, Tests, OKF & Housekeeping

### 12.3 [~] Test completeness
Broaden coverage: themes, the Sync & Backup modal + counters, the header menu + first-run agreement (10.x), and the not-found view are all covered now; the demo walkthrough (9.x) will need its own tests. Confirm every extracted component has at least one exercised path.

- **Done**: `tests/e2e/` suites for themes, the Sync & Backup badge + modal, the ☰ header menu, the first-run terms agreement, the plan-adjustments deck + Apply wizard, and the Client Directory grid + live search. The legacy `tests/test_browser.py` is gone: its three sessions-dashboard tests were stale duplicates of the maintained `tests/e2e/test_sessions_dashboard.py` versions (dropped) and its gym-floor smoke flow (voice-note capture included) moved to `tests/e2e/test_gym_floor_flow.py`.
- **Still open**: the demo walkthrough (9.x) isn't built yet, so it has no tests.

### 12.8 [x] [Observation] `tests/e2e/` vs `tests/unit/` is a browser split, not a UI split — DONE
**Raised 2026-08-02 (Simon), while reviewing the star-writes CD tests (§18.13).** A pure-logic test
that touches no DOM (`test_record_schemas.py`, `test_star_write_invariants.py`, `test_record_references.py`,
`test_schema_migrations.py`, `test_migration_edge_case_robustness.py`, `test_frozen_backup_corpus.py`
— all schema/projection/migration/reference-graph logic) still has to live in `tests/e2e/` and boot a
full Playwright page, because that is the **only JS runtime this project has**: no Node.js, no
`package.json`, buildless native ES modules served straight to a browser. `tests/unit/*.py` is pure
Python and never executes JS at all — it checks *static* properties of the source (regex / a
`tree-sitter` parse: complexity, i18n key parity, dom mappings), never runtime behaviour. So today's
`unit` vs `e2e` split is really "does this test need a browser to exist," not "does this test touch
the UI" — every one of those pure-logic data-layer tests pays a full page boot + navigation just to
call a plain function.

- **The fix would be adding Node.js + a JS test runner** (Vitest/Jest, native ESM support, no browser
  needed) as a new dev dependency, purely to run the pure-logic subset fast. Weigh against the
  project's deliberate dependency-light stance (same reasoning that rejected SQLite-wasm for the DB
  engine, §3.7/§18.6, and a fuzzing library for migration tests, §18.13) — this would be the first
  Node toolchain dependency in a project that has none today.
- **Not urgent**: the current e2e suite runs in a few minutes even with the pure-logic tests folded
  in (`python -m build check`'s Stage 2), and Playwright is already a required dependency regardless
  (real UI tests need it). Worth revisiting if the data-layer test count keeps growing and Stage 2
  duration becomes the bottleneck, not before.
- **If pursued**: the split should become "needs a browser" (`tests/e2e/`) vs "pure function, no
  DOM" (a new fast lane, not today's `tests/unit/` — that stays Python-only tooling checks), with the
  data-layer tests listed above as the first migration candidates.

**SHIPPED — `tests/unit_js/` is that fast lane** (21 files, 81 tests, plus a separately-gated
`tests/unit_js/security/`). All six named candidates moved: five left `tests/e2e/` entirely, and
`test_schema_migrations.py` split correctly rather than wholesale — its six pure-runner tests became
`tests/unit_js/data/schemaMigrations.test.mjs` while the one test that genuinely boots the app (a
stored legacy localStorage database migrated on real boot) stayed. The dependency worry above was
resolved rather than accepted: **no npm dependency at all** — `node:test`/`node:assert` are built
into the runtime, and Node itself is vendored the same pinned, checksum-verified way as Biome
(`build.ensure_node_binary`), so there is still no `package.json` and nothing for a JS-side
`pip-audit` equivalent to cover. See [tests/INDEX.md](tests/INDEX.md) for the resulting four tiers.

### 12.5 [ ] Local git housekeeping (trademark refs)
The trademark was scrubbed from history and force-pushed (remote is clean). Still pending **locally**: expire the reflog and `git gc --prune=now` the old pre-rewrite objects (`refs/original/…` and any leftover backup branch) so the old blobs are purged from the local clone.

- **Status**: no `refs/original/…` refs and no leftover backup branch remain (only `main` / `origin/main`); the old blobs survive only via reflog entries. The purge is a single command the maintainer should run manually — it was blocked when attempted from the agent because reflog expiry is irreversible:

  ```bash
  git reflog expire --expire=now --all && git gc --prune=now
  ```

---

### 12.6 [x] Vendor Font Awesome locally — the last CDN dependency
**Done 2026-08-05.** Every other external origin was already vendored (webfonts, 2026-07-25); Font
Awesome on cdnjs was the last, and it turned out to cost far more than the offline-first violation
this entry was filed for. It was **the root cause of TODO §21's `Page.goto` stalls**: `page.goto`
waits for `load`, `load` waits for every stylesheet, and that stylesheet was a live internet request
made by every test in every tier. Measured under 8 parallel fresh contexts: **1948ms median,
35233ms worst case**, with the goto maximum (35.61s) tracking the CDN maximum (35.23s) almost
exactly. Days of stall-chasing were looking at the local server, the listen backlog, CPU and the
service worker — none of which were ever involved, because the slow request never touched them.

- Vendored to `src/fonts/fontawesome.css` + two woff2 files (four initially; see the trim below),
  matching the existing `fonts.css`
  pattern: woff2 only (the `.ttf` fallbacks would have multiplied the bytes and the integrity
  catalog for no reachable browser), upstream license banner retained, regeneration documented in
  the file header.
- `style-src`/`font-src` dropped the cdnjs origin entirely, and `connect-src` lost it too — the
  allowance existed only so the SW could precache the CDN. Both `index.html` and the dev server's
  header were updated together; they must stay identical.
- The icons now precache as part of the atomic, **integrity-verified** shell. `EXTERNAL_ASSETS` and
  its best-effort `Promise.allSettled` path are deleted rather than left empty — an unused escape
  hatch is how a future CDN entry would slip past SHA-256 verification unnoticed.
- **ZAP suppression 90003 (SRI Missing) removed**, since its entire justification was this
  stylesheet. 90004 (COEP) keeps only the half of its rationale that still holds.
- **Dead faces trimmed 2026-08-06 — 29KB, no rendering change.** `fa-regular-400.woff2` and
  `fa-v4compatibility.woff2` were vendored for parity with the CDN and used **zero** times: nothing
  in `src/` carries a `far`/`fa-regular` class or a v4-era bare `fa fa-x` class, verified against
  class attributes in every `.js`/`.html`. Their four `@font-face` blocks went with them. The
  `Font Awesome 5 …`/`FontAwesome` alias faces are KEPT — they point at the solid and brands files
  already shipped, so they cost no payload, and an unused `@font-face` never triggers a fetch.
  Regenerating from upstream reintroduces both; the CSS header says so.
- **Still not glyph-subsetted, and that needs a gate first.** 2 woff2 files remain (252KB):
  `fa-solid-900` (147KB, **48 glyphs used of ~1400**) and `fa-brands-400` (105KB, **2 glyphs** —
  `fa-github`, `fa-google-drive`). Merging into ONE file is feasible — the two sets' codepoints were
  checked and **do not collide** — and would land ~381KB of font+CSS at roughly 24KB.
  **The prerequisite is now BUILT**: `agent_tools/icon_coverage.py` gates every `fa-` class in
  `src/` against what the stylesheet can render (Stage 1 + the `structure-checks` job), so a glyph
  that stops shipping fails the build by name instead of rendering as a gap. Its first run found two
  Font Awesome **Pro** classes live in the app — `fa-wifi-slash` on the header's offline indicator
  and `fa-sparkles` on the demo invitation — neither of which was ever in the Free set this project
  vendors, so both had been rendering as empty boxes. (No licensing exposure: only the class NAMES
  existed, never the Pro glyphs, so nothing proprietary was ever distributed.) Swapped for
  `fa-plug-circle-xmark` and `fa-wand-magic-sparkles`.
  **The remaining difficulty is that three icon names are built at runtime**:
  `fa-arrow-${dir}` ([applicationHeader.js](src/modules/common/applicationHeader.js)),
  and `fa-chevron-${…}` in [sessionCard.js](src/modules/sessionList/sessionCard.js) and
  [clipboardEditor.js](src/modules/clipboard/clipboardEditor.js). A static scan finds 46 of the 48
  glyphs and silently misses `arrow-up`/`arrow-down`/`chevron-up`/`chevron-down` — which subsets to
  blank boxes with no error and no failing test — which is why those four are declared explicitly in
  the gate's `RUNTIME_BUILT` set, checked exactly like a literal usage. With that in place the
  silent-breakage risk subsetting introduces is already closed, so the remaining work is the
  mechanical part: a dev-time `fonttools` script (NOT a build dependency — regeneration stays a
  deliberate committed act, like Node/Biome/ZAP rules) that emits the merged font plus a stylesheet
  containing only the shipped glyphs, under a non-reserved family name.
- **LICENSING: a subset is a "Modified Version" and must be RENAMED.** Checked against the shipped
  licence text, not from memory. SIL OFL 1.1 explicitly permits "use, study, copy, merge, embed,
  modify, redistribute", so subsetting and merging are allowed — but Font Awesome declares
  `"Font Awesome"` as a **Reserved Font Name**, and the OFL defines a Modified Version as any
  derivative made by "adding to, deleting, or substituting … any of the components". Deleting glyphs
  qualifies. Clause 3 therefore forbids the merged font from using that name "as presented to the
  users", so the `font-family` must become something neutral (`"LibrePT Icons"`) — no hardship,
  since merging two families into one needs a new name anyway. Clause 2 additionally requires the
  copyright notice and licence to travel with every copy (standalone file, human-readable header, or
  machine-readable metadata) — and subsetting tools routinely STRIP a font's internal name table, so
  that has to be handled deliberately rather than assumed. The icons are separately CC BY 4.0, which
  requires attribution AND indicating that changes were made, so the notice must say the set was
  subset.
  **Today's state is compliant and does not rely on any of this**: both `.woff2` files are
  byte-identical to upstream (verified by SHA-256), so no Modified Version exists yet; only the CSS
  was edited, and that is MIT-licensed code, with the upstream attribution banner retained.
- **Font subsetting cannot affect names in any language.** Font Awesome is an icon font: every glyph
  is in the Private Use Area (`U+F000`–`U+F8FF`) and it contains no letters at all. Non-Latin
  coverage is a question about `fonts.css` (latin + latin-ext only, so a CJK/Cyrillic name renders
  through the CSS fallback chain rather than in-brand — deliberate, since a CJK webfont is megabytes
  shipped to every trainer). `--font-sans` terminates in `sans-serif`, and `getInitials()` derives
  real initials from Han/Cyrillic/Greek/Arabic names rather than falling back to `PT` — now pinned
  in [utils.test.mjs](tests/unit_js/modules/common/utils.test.mjs).

### 12.7 [ ] [Observation, low priority] ~89 separate module requests on first load
The buildless native-ES-module design means a cold visit fetches ~89 files. In production this is
fine — GitHub Pages multiplexes over HTTP/2 and the service worker precaches everything after the
first visit, so it costs one visit, once. Recording it because it is the amplifier that turned a
40ms-per-request dev-server stall into a 3.8-second page load (fixed 2026-07-25, dev server only).

- **The cheap half is already done** (noted 2026-08-06): `index.html` carries 15
  `<link rel="modulepreload">` hints covering the boot-critical path, so the import waterfall is
  already flattened where it costs most. Only bundling remains, and that is the expensive half.
- Only worth acting on if first-load time on a poor mobile connection ever becomes a real complaint.
  **This entry was briefly mis-recommended as "the next big win" on 2026-08-05** — it is not; its own
  guidance above says so, and the vendoring of Font Awesome (§12.6) had already removed the actual
  cold-load bottleneck. Read the two bullets here before proposing it again.
- Any fix (bundling) trades away the buildless property, which is a deliberate architectural choice —
  so the bar for changing it is high.

### 12.4 [ ] [Brainstorm] Capture exceptions and offer semi-automatic bug reporting
**Raised 2026-07-26 (Simon).** Nothing in the app installs `window.onerror` or an `unhandledrejection` handler today — a thrown error dies in a console the PT will never open, and [docs/BUG_REPORTING.md](docs/BUG_REPORTING.md) asks them to retype the build stamp and steps by hand. On the gym floor that report never gets written.

- **Capture**: global `error` + `unhandledrejection` listeners, kept deliberately small — record message, stack, the route at the time, and the build stamp (commit SHA, already in the header per §16). A ring buffer of the last N entries in memory, and only the most recent persisted, so a crash log can never grow into the storage budget (§18.6).
- **Offer, never send.** LibrePT is offline-first with no server and no telemetry; automatic reporting would be an unannounced network egress of a PT's data. The flow is: a non-blocking "something went wrong — report it?" affordance, which opens a **prefilled GitHub issue URL** (title from the error, body from a template with stamp/route/stack) that the PT reviews and submits themselves. Zero traffic unless they tap.
- **The hard part is redaction, and it decides the design.** A stack trace is safe; the state around it is not — client names, notes and injuries are PII (§17.3), and a report is a public GitHub issue. Either the payload is strictly non-identifying by construction (error + stack + route + version, ids only as opaque record ids) or it must be shown verbatim for review before submission. Prefer the first, and show it anyway.
- **Deep-link the failure**: the app's routes are already durable (UC5), so a report can carry the URL that failed — reproduction becomes "open this link" instead of "list your steps".
- **Boundary with the existing integrity error page**: a failed precache verification already blocks with its own screen (§18.6/`sw/integrity.js`). This is for *runtime* faults inside a working build; keep the two paths distinct so a corrupt-download error is never reported as an app bug.
- **Watch the failure mode**: an error handler that itself throws, or that renders a modal over a live session mid-set, is worse than the original bug. It must be non-blocking, must never steal focus during logging, and must survive being called before the app has finished booting.

---

## 13. Exercise Library & Movement Taxonomy

**CLOSED — fully shipped.** See [CHANGELOG.md](CHANGELOG.md) and
[UC6](use_cases/uc6_exercise_taxonomy_and_picker.md) for what shipped.

### 13.1 [x] Repurposed `exercisesView` into a Professional Movement Taxonomy — see CHANGELOG

### 13.3 [x] Conditioning metrics (modality axis) — see CHANGELOG

---

## 14. Refactoring: DRY & Complexity Reduction

### 14.5 [~] Split the monolithic shared files to avoid same-file co-edit conflicts
**`src/index.css` and `src/index.html` SHIPPED 2026-07-27** — both are now shells: `index.html`
holds only `<head>`, the integrity overlay, and empty canvases; `index.css` holds only shared
design-system tokens/foundations. Every view, dialog, the header, and the notification area render
their own markup from the JS module that owns them, with a co-located `.css` file (see
[INDEX.md](INDEX.md) for the full module↔stylesheet map). Wired into `src/sw/cacheManifest.js`
ASSETS (bumped `CACHE_NAME`) same as any runtime module.

**Still open**: `src/i18n/en.js` & `src/i18n/sl.js` are flat single-object dictionaries; every
string lands in the same file. Consider per-feature namespaced string modules merged into the
locale (keeping `test_i18n_parity` green).

**Three findings from a DRY/SRP/modularity review of the §14.5 shell split (2026-07-27), not yet
fixed — tracked as §14.7-14.9 below.**

### 14.7 [x] Extract a shared `renderMarkupOnce()` helper — 22 duplicated render-guard blocks
**SHIPPED 2026-08-01.** One helper in [modules/common/dom.js](src/modules/common/dom.js) —
`renderMarkupOnce(containerId, existsCheckFn, html)` — replacing the copy-pasted
`const root = ...; if (!root || <exists-check>) return; root.insertAdjacentHTML(...)` pattern at
every call site across `routineFormsController.js`, `exerciseFormsController.js`,
`clientFormsController.js`, `activeSessionOverlayView.js` ×3, `applicationHeader.js` ×3,
`backupRestore.js`, `buildInfoDialog.js`, `feedbackModal.js`, `notificationArea.js`,
`routerController.js`, `editSessionView.js`, `historyView.js`, `exercisesView.js`, `plansView.js`,
`planAdjustments.js` ×2, `sessionsView.js`, and `clientsView.js` ×2. A future fix to the idempotency
guard now touches one function instead of 22 call sites. `versionMessages.js`'s
`insertAdjacentHTML("afterbegin", ...)` and `sessionCard.js`'s conditional status-bar append were
left alone — neither is the same existence-guard pattern. Verified against the full `build check`
gate (unit + e2e + ZAP), all green.

### 14.8 [x] Render-order dependencies between modules are unenforced — already caused 2 bugs
**SHIPPED 2026-08-01.** [modules/common/renderRegistry.js](src/modules/common/renderRegistry.js)
replaces the hand-ordered shell-render block in `app.js` with `registerShellRender(name, render,
dependsOn)` + `runShellRenders()`, which topologically sorts and throws on an unregistered or
cyclic dependency instead of silently no-op-ing. `renderHeaderShell()` stays separately hoisted
above `initAppLifecycle()` (a hard ordering requirement unrelated to the other shells, not folded
into the registry); the other nine — `clients-view`, `adjustments-view`,
`apply-adjustment-dialog` (declared depending on `adjustments-view`), `client-directory-view`,
`client-detail-view`, `routines-view`, `exercises-view`, `history-view`, `workout-setup-view`,
`error-view` — now register through it. The next module that needs another module's element
present first declares it and gets a real error on a bad order, instead of a silent no-op found
only by end-to-end testing.

### 14.9 [x] `activeSessionController.js` mixed markup templates into a behavior file
**SHIPPED 2026-08-01.** The shell split (§14.5) had added ownership of three unrelated UI
surfaces' markup — the full-screen active-session overlay shell, `dialog-add-session-exercise`,
and `dialog-catalog-picker` — into `activeSessionController.js`, on top of its existing
active-session state/behavior logic, growing an already-large controller further instead of
extracting a companion view file.

The three `renderXShell`/`renderXDialog` functions (unchanged content) now live in
[modules/clipboard/activeSessionOverlayView.js](src/modules/clipboard/activeSessionOverlayView.js);
`activeSessionController.js` imports and calls them from `setupActiveSession()` and owns behavior
only. Landed alongside the same-day complexity-gate work
([agent_tools/complexity.py](agent_tools/complexity.py)) that flagged this file's
`renderActiveGroupBoard` as the single largest function in the codebase.

### 14.6 [x] Rename the `booking` domain term to `session`
**Decided (2026-07-23), SHIPPED 2026-07-27.** From the PT's stance the entity is a **session**; "booking" was the customer-facing framing (a client *books* a slot; the PT *runs* a session). Code is now unified on `session`.

- **What moved:** `getOverlappingBookings`/`buildBookingMeta` aliases removed in favour of the already-canonical `getOverlappingSessions`/`buildSessionMeta`; `activeSession.booking` → `activeSession.sourceSession` (and every consumer: `activeSessionController.js`, `sessionBar.js`, `sessionTitleBar.js`, `sessionCard.js`, `exerciseDeck.js`, `sessionsView.js`'s demo seed); `editingBookingId`/`preselectedBookingId`/`targetBooking`/`existingBooking`/`bookingId`/`bookingMeta` → `editingSessionId`/`preselectedSessionId`/`targetSession`/`existingSession`/`sessionId`/`sessionMeta`; the `:bookingId` route param → `:sessionId`; the CSS class family `.booking-card`/`.booking-live`/`.booking-completed`/`.booking-status-stack`/`.booking-card-title`/`.booking-live-bar`/`.booking-live-timer`/`.booking-header`/`.btn-edit-booking`/… → `.session-*` equivalents, across CSS, JS, and every e2e test selector.
- **No back-compat kept — decided pre-release, no real PT data to protect.** The `bookings → sessions` migration step (`src/data/migrationSteps.js`, schema v1→v2) no longer carries old `bookings` data forward at all; it now only guarantees `sessions` exists as an array (general robustness, unrelated to the old field name) and drops any stray `bookings` key. A v1 database's old sessions are simply gone, not migrated. The scattered `state.sessions || state.bookings || []` runtime fallbacks were dead code regardless (the step ran on every boot) and are now just `state.sessions || []`; `stateStore.js`'s legacy `stateHasData` "bookings" key was removed too (equally dead, for the same reason).
- **Updated in step**: `test_schema_migrations.py` (the bookings-carry-over assertions now assert the collection is dropped instead), `test_backup_restore.py` (`LEGACY_BACKUP` fixture uses `sessions:` directly — it was testing collection-preservation on restore, not the rename), `test_share_deeplink.py` (raw fixture + `db.get("bookings")` fallbacks simplified to `sessions` only).
- **i18n copy/keys left alone** (`booking_spots`, `no_bookings_today`, `sync_session_desc`) — user-facing English copy, not internal vocabulary; unrelated to this rename either way.

---

## 16. Deploy safety & schema-keyed storage

> **Multi-version hosting is DROPPED, not deferred** (per §18's *no release tags* decision — see its
> banner for why). One build carries every supported behaviour concurrently; storage keys on the
> **data schema** alone, not a release tag. Do not re-propose per-tag publishing, a `/preview/`
> channel, per-release storage buckets, or rollback-by-URL — all considered and dropped together.
>
> **What survives:** a deploy must never interrupt a trainer mid-session (now purely a
> service-worker concern, [src/sw.js](src/sw.js)); storage keyed on the schema major
> ([16.3](#163-x-resolved-superseded-by-186-part-4-key-storage-buckets-on-the-data-schema-not-the-release-tag)); the
> build stamp is the commit SHA, not a tag; the PREVIEW badge (generalised into severity tiers by
> [§18.12](#1812--decided-reuse-the-preview-badge-for-unsupported-version-warning)); migration must
> validate every step's output and refuse data from a newer build.
>
> **Two findings worth not re-learning:** an ordering authority must be a *total* order (same-second
> tags tied under a date sort once offered a PT a downgrade labelled "a new version is available"),
> and anything that changes an already-published build's bytes forces a service-worker re-install on
> everyone sitting on it.

### 16.3 [x] [Resolved — superseded by §18.6 part 4] Key storage buckets on the DATA SCHEMA, not the release tag
**Resolved differently than originally planned.** This item assumed `localStorage` would stay a
live, multi-bucket store with one bucket per schema major (`librept_db@schema2`,
`librept_db@schema3`, ...), mirroring IndexedDB's layout. That premise stopped applying once
[§18.6 part 4](#186--decided-persistence-engine--indexeddb-supersedes-the-37-deferral) shipped: the
live star-write destination is IndexedDB, whose per-schema object stores (`storeNameForSchema()` in
[indexedDb.js](src/data/indexedDb.js)) already **are** the schema-major bucket-per-schema layout this
item wanted. `localStorage`'s `librept_db` key is no longer a live bucket at all — it is read exactly
once, as the legacy import source for a device's one-time move onto IndexedDB, and left untouched
afterwards. A single plain key needs no bucket-keying scheme, so there was nothing left to build:
[storageNamespace.js](src/data/storageNamespace.js) was simplified to drop the release-tag axis
(§16.5) and given no replacement axis, because none is needed.

The substance of "the schema major is the only thing storage keys on" is true today — just entirely
inside IndexedDB rather than split across two engines. `CURRENT_SCHEMA_VERSION`
([migrationSteps.js](src/data/migrationSteps.js)) stays a plain integer major, unchanged from the
original decision — a "patch" to a schema is either a migration step or nothing, and the store
already round-trips unknown fields by serialising the whole object, so a schema minor buys no
correctness and isn't introduced.

### 16.5 [x] Retire the multi-version hosting machinery from the code
**Done.** Deleted rather than adapted, since none of it had a subject any more:

- **Modules deleted**: `releaseIdentity.js` (tag → storage suffix / URL segment), `versionCatalog.js`
  (the `versions.json` reader and offer rules), `versionMessages.js` (upgrade / switch-back / EOL
  messages). [storageNamespace.js](src/data/storageNamespace.js) was simplified to drop the
  release-tag axis entirely (see [16.3](#163-x-resolved-superseded-by-186-part-4-key-storage-buckets-on-the-data-schema-not-the-release-tag)
  for why it got no replacement axis). The chain runner in
  [schemaMigrations.js](src/data/schemaMigrations.js) is **kept** — it is still live production code
  (the one-time upcast of a legacy `localStorage` blob at import), and stays until §18.1's fan-out
  fully lands.
- **Build/deploy deleted**: `build/releases.py` (per-tag site assembly, `versions.json`) and the
  release-publishing step in `.github/workflows/deploy.yml`'s `build` job — now a single `run_build()`
  call with an optional `base` for the Pages sub-path rewrite; `resolve_release_tag()` in
  `build/__init__.py`; the `release` field in [src/version.js](src/version.js)'s `BUILD_INFO`.
- **Tests**: `test_release_identity.py`, `test_version_catalog.py`, `test_version_messages.py`,
  `test_release_publishing.py`, `test_release_stamp_writers.py` deleted.
  `test_storage_namespace.py` survives, rewritten for the no-axis shape.
- **Kept**: the commit SHA build stamp and the build-info dialog
  ([buildInfoDialog.js](src/modules/common/buildInfoDialog.js)) — support surfaces, not switching
  machinery. The dialog's release row is gone; the pre-existing schema row is now the sole identity
  row alongside commit and build time.

---

## 17. Structured session/program history (`sessionItemRecord`)

> **⏳ Implementation scheduled for Claude on Fri 2026-07-24, 10:00** (when the subscription resets — this is a larger, cross-cutting change deliberately held for a complex-task budget, per the multi-model cost strategy). Design below is **decided**; it's a build task, not a brainstorm.

### 17.1 [~] Persist the whole structured program into history, via a generic typed item record
**Core mechanism SHIPPED** (graduated to [CHANGELOG.md](CHANGELOG.md)):
[sessionItemRecord.js](src/modules/common/sessionItemRecord.js) snapshots the whole program as a
flat typed array (`exercise` | `rest`, `circuitId` grouping folded at render), rest- and
completed-aware readers, back-compat shape guard. Covered by
`tests/e2e/test_session_item_record.py`.

**Still open**: wiring the exercise-**modality** field (`strength | cardio | stretch | hiit |
balance`, shipped separately — see CHANGELOG's §13.3 entry) into the `sessionItemRecord` history
snapshot itself, routine-**builder** (`plansView`) metric authoring to match the inline editor, and
`hiit` (rounds) which has no logging surface yet.

### 17.2 [ ] Edit rules for a completed, dated session — immutable except three narrow cases
A completed dated session is an **immutable execution record**. Anything forward-looking is **copy-to-a-new-session from a template**, never an edit of the past. The only permitted mutations:

1. **Field-level correction** of mis-logged data (typo'd weight, forgot to mark a set done) — ideally stamped with an `edited` marker for audit.
2. **Append-only annotation / feedback** added at the desk during review — this is an *append* to the separate feedback layer, so it doesn't touch the immutable execution record.
3. **Anonymization** (see 17.3) — **not deletion**.

### 17.3 [ ] Erasure = anonymization only (never delete); design pseudonymization
**Decided (2026-07-22): no hard delete of history.** A client's training history is valuable aggregate data; erasure **strips/replaces identity**, retaining the execution records for aggregate analytics.

- On an erasure request, replace client **PII** (name, email, contact) with an anonymous token; the session/program/log data stays.
- **Pseudonymization — to design**: keep a stable **pseudonymous id** so a client's records remain linkable *in aggregate* (longitudinal volume/1RM curves survive) without being identifiable. Decide:
  - **reversible vs irreversible** — a true erasure request likely wants irreversible (no re-identification key kept); a "hide but recoverable" case wants reversible.
  - **where any re-identification key could live** given the local-only design — there's no server to hold a separate key vault, so a reversible scheme would keep the mapping in the same local store it's trying to protect (a real tension to resolve).
- Template extraction (17.1) already strips person/day-specific magnitudes, so a routine derived from an anonymized session carries no identity anyway.

### 17.4 [ ] Save a past session as a routine template (library fills itself from history)
With 17.1 preserving the full program, "**Save as routine**" on a history record extracts a reusable template — **demoting the Routines view from an authoring surface to a library that fills itself from real sessions** (removes the blank-page authoring chore that blocks ramp-up).

- Extraction **strips all person/day-specific magnitudes** — `weight`, `watts`, time/`duration`, distance/calories — keeping the **prescription structure**: exercise, set count, `reps`/target-reps, `rest`, circuit grouping. (Rep counts are a reasonable reused default; loads are not.)
- Pairs with the inline clipboard editor ([8.3](#83-x-inline-clipboard-editor--shipped-the-saved-patch-is-long-gone)) and "next session prep" ([5.1](#51--tabbed-client-view) Tab 3).
- **Watch item for §18.5**: making template provenance a *hard* reference back to the source history record would create the first cycle in the reference graph (`history → routine → history`), which §18.5's topological migration order forbids. Keep provenance a soft/denormalised field.

### 17.5 [~] Explicit item ordering — `position` on every session item
**SHIPPED** in [sessionItemOrder.js](src/modules/common/sessionItemOrder.js) — steps 1–3 of the
design in [DATA_MODEL §"Ordering"](docs/DATA_MODEL.md) (full rationale: why dense not gapped, why
not a linked list, rejected alternatives — lives there, not here). Writers stamp `position` at the
choke point they all funnel through (`saveActiveSessionToCache`) plus `buildProgramSnapshot` for
the frozen record. Covered by `tests/e2e/test_session_item_order.py`.

**Still open**: nothing consumes `positionIssues()` at runtime yet (it's a query the tests call,
not a surfaced integrity warning); `activeExerciseIndex` still means an *array index*, which holds
only while the live array stays in position order; and step 4 — the store may stop guaranteeing
list order — gates on [§18.6 part 4](#18-data-layer-simultaneous-multi-schema-writes-star-writes),
not yet reached.

---

## 18. Data layer: simultaneous multi-schema writes ("star writes")

> **The architectural change**: the data layer writes every record to all supported data-schema
> versions at once, so moving between app versions loses nothing in either direction. Today's
> shipped migration is a **chain** (v1→v2→v3): lossiness compounds, and each step is tested against
> the previous step's output rather than against reality. Star writes replace it with a **star** —
> one projection per schema, each computed directly from the live domain object, none feeding
> another. Error cannot compound, every projection is independently testable, and there are **no
> backward transforms** to write: a "downgrade" is just another projection already being written.
>
> **Supersedes the "stay on localStorage" half of §3.7** (see 18.6) and **depends on §16.3** (see
> 18.1).
>
> **Decided: NO RELEASE TAGS. One build carries old and new behaviour concurrently.** Behaviour
> switching is an in-app choice, not navigation — no per-tag publishing, no rollback-by-URL. What is
> supported is a set of **schemas**, the only axis storage keys on ([16.3](#163-x-resolved-superseded-by-186-part-4-key-storage-buckets-on-the-data-schema-not-the-release-tag)).
> "No fixes ever land on a maintenance-mode version" is inverted, deliberately: old behaviours live
> inside the current build, so they get fixes automatically.
>
> **Open question to confirm before building the write layer**: with one build, what still justifies
> writing every live schema? The surviving case is the **previously-cached Service Worker build** — a
> PT on yesterday's cached build *is* an older app version even with no tags, and multi-schema writes
> keep their data readable. Backup portability is the second case.
>
> **Build order was DB first, then the star write layer, then the CD pipeline tests (18.13)** — the
> engine had to come first since the fan-out cannot be built on localStorage at all (exceeds the 5 MB
> cap; atomic fan-out needs IndexedDB transactions). **That build order is now complete**: the
> IndexedDB engine (§18.6 part 4), §16.3/§16.5's storage-layout prerequisites, the §18.1/18.4 fan-out
> itself, and §18.13's CD pipeline tests are all built — each has its own detail in its section below.
> What remains inside §18 is narrower, open sub-items called out in their own sections: §17.1's lazy
> per-client load (§18.6 part 4), §18.3's "defer migration to idle" and failure-reporting UX, §18.8's
> encryption/desktop threat model, §18.9's concurrency (CAS/transactions), §18.11's legal gaps, and
> §18.12's ribbon reuse for the unsupported-version warning — none of these were in the original
> build-order list, so none were blocking it.

### 18.1 [x] [Decided in principle] The star write model, and its relationship to §16.3
> **Built.** [recordSchemas.js](src/data/recordSchemas.js) declares `SCHEMA_2`/`SCHEMA_3`'s
> per-collection field shapes; [recordProjections.js](src/data/recordProjections.js) projects each
> live domain object into them; [stateStore.js](src/data/stateStore.js)'s `starWrite()` (TODO §18.6
> part 4) is the fan-out itself — one transaction, every live schema's IndexedDB store, with
> reconcile-deletes for records no longer present. Every real record this build writes (seed
> fixtures, the actual object literals `formsController.js`, `feedbackModal.js` and
> `finishWorkoutSession` build) is asserted to project cleanly against **every** live schema in
> `test_star_write_invariants.py` — the cross-schema table below is now exercised, not aspirational.

**A "bucket" is one physical store holding data shaped by exactly one schema** — `librept_db@schema6`.
Bucket↔schema is 1:1; a bucket is not a list of anything. Three distinct relations were being
conflated and are worth keeping apart:

| Relation | Cardinality | Owner |
| --- | --- | --- |
| bucket ↔ schema | 1 : 1 | storage layout (§16.3) |
| app version → schema it **reads** | N : 1 | the app build (`CURRENT_SCHEMA_VERSION`) |
| write layer → schemas it **writes** | 1 : N | **the new relation this section adds** |

- **§16.3 is the prerequisite, not an alternative.** "Write to all supported *schema* versions (not
  app versions)" is exactly §16.3's bucket-per-schema-major expressed as a write policy. §16.3 is the
  storage layout; star writes are the policy on top of it. Build §16.3 first.
- **The fan-out set is global, never per-app-version.** If each app version declared its own set, two
  tabs on two versions would write different sets and buckets would silently diverge — precisely what
  a single write layer exists to prevent.
- **A build can only write schemas it knows how to project**, so a *cached* build's fan-out set is
  fixed at the moment it was cached: it can never learn that a schema was retired. With no release
  manifest to consult (§16), the set is a **constant compiled into the build** — the list of
  projections it actually carries — and the newest build is the authority. A retired schema therefore
  goes on receiving writes from stale cached builds until they update, which is harmless (a store
  nobody reads) and is why retirement is a two-step: stop reading it, then stop provisioning it.
- **Write set ⊇ read set.** A bucket must start receiving star writes the moment its migration
  *begins*, not when it completes — that is what makes 18.3's accelerator work.

### 18.2 [x] [Decided, CLOSED] Identity: lineage IDs, no ID-mapping table
**`lineageId` is the record's own `id` — no separate mapping table.** `recordProjections.js`'s
projections carry `record.id` unchanged from the domain object: today's `id` (UUIDv7 via
[recordId.js](src/modules/common/recordId.js)) already **is** the lineage id. A genuine split/merge
migration, if one is ever needed, mints per-schema local ids only on the schema that requires them
— not needed yet. §18.3's completeness check (a set difference over ids) already provides what a
mapping table would have, at no extra cost.

**ID format: UUIDv7** (RFC 9562) — 122 bits of collision resistance *and* lexicographic
time-ordering, doubling as a tiebreak within §18.5's topological order. If "short" ids are wanted,
shorten by base62-encoding a v7 — never by dropping entropy.

### 18.3 [ ] [Decided] Migration is pre-emptive, resumable, and runs through the normal write layer
- **Pre-emptive**: migration into a newly-available schema starts *before* the PT opts into anything,
  so a switch is instant. **This closes the old staleness worry** — a speculative copy made ahead of
  time goes stale if the PT keeps working, which is why the retired design redid it at switch time.
  Under star writes there is no staleness window: once migration completes, ongoing writes fan out to
  that bucket too, so it stays continuously current. Catch-up is a **re-derivation**, not a restore
  from a point in time — nothing is frozen, so nothing can go stale (this is also why §18.7 rejects a
  snapshot tier).
- **Resumable**, because battery death, app kill, tab reclaim and reloads are ordinary on a phone.
  **The mapping table is the cursor** — "present in the mapping" *is* "migrated", so resumability
  falls out of the idempotency mechanism for free, with no separate progress state.
- **Yields to user writes**: migration breaks on any user interaction write and resumes when the
  burst is done. Gym-floor latency wins over migration throughput.
- **Ordinary use accelerates migration.** A star write to a not-yet-migrated record populates the new
  bucket and marks it migrated; migration then skips it. Interleaving is safe in both directions.
- **Invariant that makes the accelerator sound**: migration must be implemented as
  `read old record → build domain object → normal star write`, i.e. *literally* the write layer, not
  a second transform. Otherwise half a bucket comes from one code path and half from another, and the
  drift is undetectable.
- **A partially-migrated bucket must not be readable** — routing refuses any schema whose bucket is
  incomplete, and `evaluateVersionOffer` gains it as a precondition before offering the switch.
  Without it, a crash at 40% reboots the PT into a UI showing 40% of their clients —
  indistinguishable from catastrophic data loss, and the rational response (re-entering records)
  creates real corruption.
  - **Completeness is a query, not a stored flag** (decided 2026-07-26): derived state cannot drift
    from reality the way a flag written at the wrong moment can, and it needs no crash-safe flag
    update.
  - **The query is a set difference over ids, not a count comparison** (corrected 2026-07-26):
    `complete(target) ⇔ keys(source store) \ keys(target store) = ∅` — the target is complete when
    the source holds **no id the target is missing**.
    - **Why the original `count(source) === count(mapping)` was wrong**: two counts are independent
      aggregates over two stores and tie nothing element-to-element, so one absent source id plus one
      spurious target entry (retried projection under a fresh id, imported backup, fan-out that
      committed in one store only, a bug) passes the check **over a hole**. It was justified by "there
      are no deletes (§17.3)", which is exactly the consistency assumption the storage layer cannot
      enforce; a set difference needs no such premise.
    - **Containment, not equality**: ids the target has and the source lacks are legitimate (a record
      created after the target went live), so equality would fail on healthy data.
    - **Cheap, and it names the gap**: `getAllKeys()` returns B-tree keys with no payload
      deserialisation, already sorted, so it is a linear merge that short-circuits on the first
      unmatched source key — and it yields the **missing ids**, making repair a re-projection of
      exactly those records rather than a full re-migration. Supersedes the "index on the migration
      marker so `count()` hits the B-tree" requirement.
- **Still open**: defer pre-emptive migration to idle/charging (`requestIdleCallback`) so it does not
  cost battery mid-session; how a *failed* background migration reports itself without alarming a PT
  who never asked for it (block the switch offer, do not raise an error).

### 18.4 [x] [Decided — staging, not envelopes] The lossy-projection problem
> **Both halves of the guard exist.** The single-schema half (2026-07-27): `recordProjections.js`'s
> `projectionIssues()` plus `test_record_schemas.py` assert "every record this build actually writes
> conforms to the schema it targets" — proven against real seed data AND the literal object shapes
> live writers build. **The cross-schema half** (now that schema 3 is genuinely live, not just
> declared): `test_star_write_invariants.py` asserts every live writer's shape validates against
> *every* live schema, that schema evolution only ever adds fields
> (`test_schema_evolution_is_additive_never_drops_a_field`), that projections are idempotent and
> invertible, and — the specific loss scenario this section exists to prevent — that a schema-2-shaped
> session missing `startDate` is correctly caught against schema 3
> (`test_an_older_schemas_writer_missing_a_newer_required_field_is_caught`).

**The problem is narrower than it first appears.** A rollback loses nothing: the newest bucket keeps
full fidelity while the PT reads a degraded older one. The loss happens only when **the old UI
writes** — v5's UI builds a domain object with no v6 concept in it, and the star write then
overwrites the full-fidelity record in every newer bucket. Star writes are what *propagates* the loss.

Two mutually exclusive fixes; **only one is needed**:

- **Preservation envelope** (rejected): a reserved opaque field that older versions round-trip
  verbatim without interpreting — Elasticsearch's `_source` trick. Costs code, free at release time.
  Rejected because `_source` exists in ES precisely because its indexed form is lossy; if staging
  guarantees projections are *not* lossy, there is nothing to reconstruct.
- **Expand-first staged releases** (**chosen**): never let a supported schema be unable to carry a
  field. Free in code, paid for in release discipline.

**The rule staging obligates**: *no feature ships until its storage has shipped in every
currently-supported schema* — the field lands N releases before the UI that uses it. **Enforced in
CI** (`test_star_write_invariants.py`): every field the current domain model writes exists in every
live schema's projection. Without the check the discipline survives until the first hurried release.

- **Projections must be pure and total** so buckets are always fully re-derivable — enforced by
  `test_projections_are_idempotent_and_invertible`: `project(x)` is idempotent, and
  `unproject(project(x)) == x` for every live schema.
- **Escape hatch**: a change that genuinely cannot be staged is the trigger to **EOL the incompatible
  schema**, not to ship a lossy projection. This gives a crisp rule for when a forced upgrade is
  justified.
- **Keep the degradation marker anyway** (cheap): a record carrying data the running version cannot
  render should be visibly flagged (lock glyph / greyed row), so a degraded view is never silent.
- **Reading degraded is mild; WRITING degraded is the danger** (Simon, 2026-07-26). A v5 app showing a
  HIIT exercise wrong is a display problem; a PT *logging reps or feedback into that wrong view*
  produces bad data that then fans out to every bucket. So the signal belongs at the point of writing,
  not only at the point of viewing, and the app must announce **degraded (= downgraded) mode** at the
  whole-app level via the ribbon (see §18.12), not just per record.

### 18.5 [x] [Decided] Ordering is topological, not chronological
Migration replay order means **correct order of foreign-key availability**, not timestamp order.

- **The reference graph must be acyclic**, so all dependent data reconstructs as a DAG. **Enforced in
  CI**: [recordReferences.js](src/data/recordReferences.js) declares the graph (structural
  ownership references only — a "soft ref" label like `routineName` is deliberately excluded) and
  `findCycle()`/`isAcyclic()` run a DFS cycle check, asserted in `test_record_references.py` —
  including a proof the detector actually catches a real cycle, not just one that never triggers.
  Today's graph is trivial (`history.clientId`/`planUpdates.clientId` → `clients`) — the point is
  catching a *future* convenience back-reference before a trainer does.
- **§17.4 is the first realistic cycle risk** — see the watch item there.
- **The wall clock is not an ordering key anywhere.** Star writes are immune to clock skew because a
  single sequential writer resolves by execution order, not by comparing timestamps; timestamps are
  inert data. One rider: a backward clock jump still writes a wrong `loggedAt` (cosmetic, but it is
  what the PT reads). **§3.3 Google Drive sync turned out not to need a `(deviceId, seq)` Lamport
  pair after all** — the concern this bullet originally raised, that a second device writing
  concurrently would force some kind of clock substitute for ordering. `syncMerge.js`'s three-way
  merge against the last-synced ancestor sidesteps the question entirely: it never tries to order two
  edits, only to detect whether both sides changed the same record since the ancestor, which needs no
  clock or clock substitute — see §3.3's "Merge" note for the full reasoning.

### 18.6 [~] [Decided] Persistence engine → IndexedDB (supersedes the §3.7 deferral)
**ENGINE SHIPPED — reclassified from open by the 2026-08-06 sweep.**
[indexedDb.js](src/data/indexedDb.js) (one database, one store per schema, the three indexes),
[writeQueue.js](src/data/writeQueue.js) (write-behind, ordered) and
[storageDurability.js](src/data/storageDurability.js) (`persist()`) all exist and are wired into
[stateStore.js](src/data/stateStore.js)'s boot and save paths. What is still open is the part that
entry called "the real win": **true lazy per-client loading is deliberately NOT done**, and
stateStore's own header says why — the read model stays synchronous so ~115 existing
`state.<collection>.push(...)` call sites need no change, and converting them to async per-client
fetches is separate, larger work. The index it needs (`CLIENT_COLLECTION_INDEX`) is already built.

§3.7 deferred the DB "until the 5 MB cap looms". With §17.1 shipped it now looms on its own, and star
writes make it unavoidable. **Sizing (measured 2026-07-26, from the real §17.1 record shape — ~6.0 KB
per session, 9 exercises × 4 sets, rests, feedback, notes):**

| | sessions/yr | 1 bucket | ×2 | ×3 |
| --- | --- | --- | --- | --- |
| Busy PT (7/day, 5.5 d/wk) | 1,809 | 10.5 MiB | 21 MiB | 31 MiB |
| **Very busy PT (10/day, 6 d/wk)** | 2,880 | 16.6 MiB | 33 MiB | **50 MiB** |
| Studio ceiling (14/day) | 4,200 | 24.3 MiB | 49 MiB | 73 MiB |
| Very busy PT, 5 yrs (no deletes, ever) | 14,400 | 83 MiB | 166 MiB | **250 MiB** |

- **IndexedDB, +0 KB install cost** — it is the platform, present in every browser and mobile webview,
  works offline and in the service worker. Quotas are orders of magnitude clear of the table above
  (Chrome/Android ~60% of free disk, Firefox ~50%, Safari/iOS ~1 GB with a prompt to extend).
- **Not SQLite-wasm**: +700 KB–1.2 MB against a 1,040 KB `src/` (671 KB excluding fonts) roughly
  doubles the app, and the OPFS `SharedArrayBuffer` VFS wants COOP/COEP headers GitHub Pages cannot
  set (the `opfs-sahpool` VFS avoids that, so it is a constraint with a workaround, not a hard
  blocker). The "portability / configuration / permissions hell" concern is the correct argument
  **for** IndexedDB: zero config, zero permissions, zero binary, no VFS, no file paths.
- **Layout constraint**: one IDB database with **one object store per schema**, so a fan-out write is
  a single transaction. IndexedDB transactions cannot span *databases* — giving each schema its own
  database makes atomic fan-out impossible by construction, and it is expensive to retrofit.
- **`navigator.storage.persist()` is mandatory**, not optional — without it IndexedDB is evictable and
  this app holds the only copy of a PT's business records.
- Keep it behind the [stateStore.js](src/data/stateStore.js) seam (§3.7's "cheap prep"), plus §17.1's
  **lazy per-client load** — the real win, since today one screen deserializes every client's history.
- **Emergency plan: plan for eviction, not deprecation.** IndexedDB will not be dropped — it is the
  web's only structured storage and has no deprecation path. The realistic risks are **Safari's 7-day
  cap on script-writable storage** for non-engaged sites (home-screen install exempts you, which the
  app already promotes), quota-pressure eviction on Android, and private-browsing quotas. The recovery
  tier for all three is the backup file (18.7), so the insurance is an artifact already required.

### 18.7 [ ] [Decided] Backups: 1× not N×, readers forever, writers never
- **Back up the newest bucket only — 1×, not 3×.** With staging (18.4) the newest schema's bucket is
  lossless and canonical; every other bucket is a pure projection and derived data is not backed up.
  Restore = import to domain, then fan out to repopulate the rest. This also means a bad fan-out is
  *always* repairable by re-projection.
- **No snapshot tier** (Simon: endless point-in-time issues in the backup world). Consequence to bank:
  the backup file becomes the only recovery path from a write-layer bug, which raises the stakes on
  everything else in this item.
- **Retain readers forever; retain writers never.** A 2026 backup does not need 2026's *write* path —
  it needs a 2026 **reader** that upcasts to today's domain object, which then goes through the single
  current write layer. Readers are pure, small and free to keep indefinitely; writers carry logic and
  side effects. Import path: `parse → detect schemaVersion → upcast → single write layer → fan out`.
  This turns "restorable for a while" into "restorable indefinitely", which is stronger *and* cheaper
  than the original requirement.
- **Frozen backup-fixture corpus in CI** — one committed fixture per historical schema, with a test
  asserting each still imports to the expected domain object. Without it a long-restore guarantee is a
  hope; with it, it is enforced on every commit.
- **Two version numbers, not one.** `formatVersion` on the envelope (how to *open the box*: gzip,
  checksum header, multi-part manifest, encryption) and `schemaVersion` on the payload (how to read
  the records). One number cannot distinguish "old container, new payload" from the reverse, and the
  day compression or encryption is added every existing file must still parse.
- **Consent at import**, made precise — star writes soften this, since an import fans out to *all*
  live buckets: *"This backup is from schema 3. The oldest schema this deployment still writes is 5.
  Importing brings it forward to 5–7; it will no longer open in builds older than v1.4."* Declining
  must leave the `.json` byte-identical (no half-import, no helpful in-place upgrade).

### 18.8 [ ] [Open] Encryption, device theft, and storage durability
- **IndexedDB is not encrypted by the app.** At rest it relies on OS full-disk encryption: a stolen
  *locked phone with a passcode* is genuinely well protected (iOS Data Protection / Android FBE), a
  stolen laptop without FDE is not protected at all. Same-origin scripts, extensions with host
  permissions and anyone holding the unlocked device read it in plaintext.
- **Desktop must be addressed eventually** (Simon, 2026-07-26). It is the weak case on every axis in
  this section: FDE is opt-in and frequently off, browser extensions with host permissions are common,
  and the device is shared far more often than a phone. It is also where the *better* tools live —
  the File System Access API can put backups in a real user-chosen file (and keep a handle for
  repeat exports) instead of the download folder. Treat "desktop" as its own threat model and its own
  backup UX, not as a wide phone.
- **Recommended first step: encrypt the backups, not the live DB.** The backup is the artifact that
  travels (§3.3 Drive sync, email, USB) and is where a leak actually happens; the live store already
  has OS encryption in the phone case; and a lost passphrase is *recoverable* because the live DB
  survives. Encrypting the live store instead risks permanently destroying a solo PT's business
  records with no recovery path — a bigger realistic risk than theft.
- **Biometrics — the accurate answer: WebAuthn cannot decrypt.** It is authentication; it returns a
  signature, never key material. The real primitive is the **WebAuthn PRF extension**, which derives a
  stable secret usable as an AES-GCM key via WebCrypto (Chrome/Edge and Safari passkeys; support good
  but not universal). Portable fallback: PT passphrase → PBKDF2/Argon2 → AES-GCM.
- **Private browsing: detect the consequence, not the mode.** Mode detection is a heuristic arms race
  browsers actively break. Instead read `navigator.storage.estimate()` / `persisted()` and warn *"
  storage on this device is not durable — export a backup before you finish"*. More robust, and it
  also catches low-disk Android and non-installed Safari, which are likelier and equally destructive.

### 18.9 [ ] [Decided] Concurrency: transactions plus CAS, not app-level locks
IndexedDB transactions give atomicity and cross-tab serialization for the fan-out (given 18.6's
single-database layout), so **no app-level lock is needed for it**.

- **The residual is read-modify-write spanning a JS computation.** IDB transactions auto-close when
  the event loop yields — any `await` on a non-IDB promise silently kills the transaction — so
  `read → compute → write` is not atomic by default and two tabs can interleave.
- **Fix is compare-and-swap**, not locking: a version counter on the record, write conditional on it
  being unchanged, retry on mismatch. Lock-free, cross-tab, immune to the transaction-closing gotcha.
- Required properties, complete list: **resumable + acyclic + idempotent + CAS**.
- `navigator.locks` around the *migration pass* is worth ~3 lines so two tabs do not duplicate work —
  efficiency only, since idempotency already makes it safe.

### 18.10 [x] [RESOLVED — one build] Deep links, and one build vs. many builds
**Resolved in favor of the one-build model** — see the §18 decision banner. Three deep-link
invariants that follow and still apply:

1. **Never version-qualify a shareable link.** One canonical version-less URL space — moot for
   hosting now, but still the rule for any future per-PT behaviour-flag state.
2. **Route removed or renamed** — deprecated routes become permanent aliases to canonical ones,
   retained forever. A link to a retired *behaviour* resolves to the nearest surviving ancestor
   rather than erroring.
3. **Deep links carry the `lineageId`**, never a per-schema id (§18.2) — no lookup is ever needed.

### 18.11 [ ] [Open] Legal gaps this design creates
- **Re-identification via backups + the mapping table.** A pre-erasure backup contains
  `abc123 → "Jane Doe"`; the mapping says `abc123 → xyz789`; together they re-identify an anonymized
  record. Normally the defence is that backups rotate out — **18.7's indefinite-restore requirement
  removes that defence.** Simon's "record of forgotten IDs" closes it, but only with two properties it
  does not have yet: it must be **applied at import**, not just at erasure (or a restore resurrects
  the PII), and it must be **keyed on the stable `lineageId`** (a per-schema key silently fails to
  match a backup from another schema). Feeds directly into §17.3's unresolved
  "where could a re-identification key live" tension.
- **Minimize the suppression list itself** — a permanently retained list of identifiers belonging to
  erased people is lawful (you need it *to honour* the erasure) but should store a salted hash of the
  id and nothing else.
- **Retention basis is undocumented.** No-deletes + anonymization-only + 3× fan-out is technically
  fine, but GDPR Art. 5(1)(e) wants a *stated, justified* retention period. "Retained indefinitely for
  aggregate analytics" is a lawful answer only if written down; today neither [PRIVACY.md](PRIVACY.md)
  nor §17.3 states the basis. Cheapest item on this list.
- **Taxonomy licensing — checked 2026-07-26, currently clear.** wger's *application* is AGPLv3 but
  LibrePT links no wger code, so AGPL is not engaged; wger's *dataset* is CC-BY-SA 4.0 but
  [exerciseStandard.js](src/modules/common/exerciseStandard.js) vendors only ~17 generic category and
  equipment words, far below any threshold. **Fees are zero on every axis.** The line not to cross:
  bulk-importing wger's ~1000+ exercise entries would engage both CC-BY-SA ShareAlike (the derived
  dataset would have to ship CC-BY-SA with attribution, a licensing split inside an MIT repo, and a
  one-way door for that file) and the **EU *sui generis* database right** (Dir. 96/9/EC), which is
  separate from copyright, needs no originality, and is the governing regime here. If clinical
  vocabularies are ever considered: SNOMED CT requires an affiliate licence — country status must be
  checked, not assumed.

### 18.12 [ ] [Decided] Reuse the preview badge for unsupported-version warning
Generalise `#preview-badge` from an always-on `PREVIEW` pill into a **build-status ribbon with
severity tiers**: `PREVIEW` (amber, informational) → `DEGRADED` → `BETA` (stronger — real data on
unstable code) → `UNSUPPORTED` (red, non-dismissable). This absorbs the "distinct ribbon treatments
per tier" question left over from the dropped preview/beta channels (§16) into one piece of work.
The `BETA` tier keeps its slot even with no beta channel to host it: an in-app behaviour opt-in is
the same promise — real data, less-proven code — and it needs the same signal.

- **`DEGRADED` is the downgrade tier** (§18.4): the running app is older than the schema its data was
  authored in, so some records display wrong and — the part that matters — **anything logged here may
  be recorded lossily**. Wording must say that plainly rather than implying a read-only display quirk.

- **The ribbon must not be the only signal.** Persistent chrome goes invisible within days — which is
  what makes an always-on amber pill safe today and an unsupported-version warning useless tomorrow.
  Pair it with a non-dismissable message in the notification area ([notificationArea.js](src/modules/common/notificationArea.js)).
- **Never block mid-session.** The ribbon carries severity continuously, but any *blocking* consent
  prompt is gated on there being no active session — a red warning plus a modal is maximally alarming
  exactly when a PT has a client in front of them.
- Keep the existing `prefers-reduced-motion` handling; a red flashing element is an accessibility
  problem in a way an amber pulse is not.

### 18.13 [x] CD pipeline tests for the star-write layer
Requested by Simon (2026-07-26) as the step that follows the write layer. The properties §18 relies
on are all *invariants across releases*, which is precisely what a per-commit gate can hold and what
review cannot — none of them can ever be tested against a real PT's data, because that data is
local-only by design.

What the pipeline asserts, roughly in order of how expensive the failure is:

- **The staging guard (§18.4)** — every field the current domain model writes exists in every live
  schema's projection. `test_star_write_invariants.py`. This is the check that makes expand-first
  staging real rather than aspirational; without it the discipline survives until the first hurried
  release, and the failure is silent data loss on downgrade.
- **Projection round-trips (§18.4)** — `test_projections_are_idempotent_and_invertible`, over the
  real live-writer shapes rather than synthetic property-based data (no fuzzing library in this
  dependency-light stack — see "Migration fuzzing" below for the same trade-off): `project(x)` is
  idempotent, and `unproject(project(x)) === x` for every live schema.
- **The old-UI-writes case (§18.4)** — the specific scenario that loses data: a record using the
  *newest* fields, written through an *older* schema's UI path.
  `test_an_older_schemas_writer_missing_a_newer_required_field_is_caught` reconstructs exactly what
  schema 2's UI wrote (no `startDate`) and asserts schema 3's projection catches it.
- **The reference graph is acyclic (§18.5)** — `test_record_references.py`, via
  [recordReferences.js](src/data/recordReferences.js)'s `findCycle()`.
- **The frozen backup corpus (§18.7)** — `test_frozen_backup_corpus.py` plus
  `tests/fixtures/backups/*.json`: one committed fixture per historical schema, each asserted to
  still import to the expected domain object, with a structural check that no fixture is ever added
  without being wired into a test. This is what turns "restorable indefinitely" from a hope into
  something enforced on every commit.
- **Migration fuzzing** — `test_migration_edge_case_robustness.py`: a hand-authored, growing table of
  hostile synthetic inputs (not true property-based fuzzing — no fuzzing library in this
  dependency-light stack), asserting the runner never throws and never fabricates a state on refusal.
- **Ordering invariants (§17.5)** — already covered by `test_session_item_order.py` (positions dense
  `0..n-1`, circuit contiguity, asserted over real writer output including a finished session
  snapshot) — this is the place where "the order is authoritative and total" is enforced, replacing
  the retired manifest-ordering check that burned once already (same-second release tags tying under
  a date sort).

Fits the existing gate: `python -m build check` already runs staged parallel validation, and the
property/fuzz work belongs in Stage 1 (fast, no browser) rather than in the e2e stage.

---

## 19. Deep-linkable app state

**Started 2026-07-27 (Simon).** The rule agreed for scope: **anything a page reload would change
belongs in the URL.** The trigger was the plan editor's just-inserted row — highlighted, scrolled to
and focused, but invisible to a refresh because the call-out lived in a module variable. That was one
instance of a general gap.

Design, invariants and the "how to add a route" checklist: **[docs/ROUTING.md](docs/ROUTING.md)**.
The catalogue of what the URLs are: [UC5 §4](use_cases/uc5_session_day_deck_and_deep_links.md).

### 19.2 Blocked on the URL-privacy question

Both would mint **new** URLs carrying a client id where none exists today. `/clients/{id}` and
`/session/{id}/client/{cid}/…` already do, so this is a question of degree, not a new exposure — but
it is unresolved, so these are parked rather than shipped.

- [ ] **Client dialogs** — `/clients/new`, `/clients/{clientId}/edit`
      ([clientFormsController.js](src/controllers/clientFormsController.js) `setupClientForms`).
- [ ] **Workout-setup preselection** — `openEditSessionControlModal` takes four identifiers and the
      URL carries only `bookingId`, so "Plan Program" from a client
      ([clientsView.js](src/modules/clients/clientsView.js)) and "Start Group Session" from a routine
      ([plansView.js](src/modules/plans/plansView.js)) lose their preselection *and* the
      planning-mode flag on reload. Would need `/session/plan/client/{clientId}` and
      `/session/new/routine/{routineId}`.

**The question to settle**: whether to commit to an ids-and-enums-only invariant enforced by a test
(no names, emails or free text in a path — see [docs/ROUTING.md](docs/ROUTING.md) §5.5), and whether
client-detail navigation should `replaceState` so repeated browsing does not accumulate a
who-was-viewed list in history. Client records are GDPR Art. 9 health data
([PRIVACY.md](PRIVACY.md) §3.2); mitigating facts are that ids are opaque and the database is
device-local, so a copied id dereferences to nothing elsewhere.

### 19.3 Undecided — decide per use case

- [ ] **Filter and search state.** Postponed deliberately. Enumerated chips (muscle, equipment,
      category) are a closed, non-personal vocabulary and could be path segments; **free-text search
      must not be**, since a typed client name would land in history, screenshots and shared links.
      Separately and independently of routing: the exercise library silently resets its chip and
      search box whenever `renderExercisesList()` is called with no arguments
      ([app.js](src/app.js), e.g. after saving a new exercise) — a real bug that needs no URL.
- [ ] **Transient chrome** — the ☰ menu, the session ⋮ menu, the notification drawer, a drag in
      progress. A reload closes them, which is arguably correct; a URL that reopens a menu is noise
      in history and fights the outside-click handlers. Recorded so the decision is explicit.
- [ ] **`#dialog-add-session-exercise` is unreachable UI.** Its only button
      (`#btn-add-exercise-to-session`) sits in a `display: none !important` container
      ([index.html](src/index.html)) and the clipboard editor destructures `openAddExercise` without
      ever calling it. Not routed, because a route for an unreachable dialog is dead code. Decide
      whether to restore the affordance or delete the dialog, the button and the opener.
- [ ] **Session sub-state that already survives via the cache** — `expandedPastId`, `circuitRounds`.
      They persist through the session cache, so a reload keeps them; putting them in the URL would
      make them *shareable*, which is a different (weaker) argument. Pinned by tests, not routed.

---

## 20. [x] Test tiers: the clipboard, and the `activeSession` contract — COMPLETE

**Closed 2026-08-05.** All three items below are done: the contract is a fixture, 26 tests moved to
`tests/medium/`, and the seam is written up as [DATA_MODEL §7](docs/DATA_MODEL.md). Kept for the
reasoning, not as work.

The test-tier refactor (`tests/unit_js/`, `tests/medium/`, `tests/e2e/` — see
[tests/INDEX.md](tests/INDEX.md)) moved everything it could without redesign. What remained was not a
migration backlog; it was one structural gap and its consequences.

**The gap: `activeSession` had no written contract.** It is constructed in two places inside
[activeSessionController.js](src/controllers/activeSessionController.js) — `startWorkoutSession` and
the `openSessionFromHistory` path — and consumed across a dozen modules, but its shape is written
down nowhere. So the only reliable way to obtain a valid one was to drive the real flow, and that is
why **68 of the 138 remaining e2e tests are the clipboard**: half the e2e suite is one feature, held
there by a missing contract rather than by a genuine need to boot the whole app.

- [x] **Derive the contract and encode it as a fixture.** `active_session_fixture()` and
      `clipboard_stub()` in [tests/medium/_harness.py](tests/medium/_harness.py) mount the live
      clipboard with an injected session, through the controller's own public `setActiveSession()` —
      the production render path fed a known session, not a parallel one. Verified: the deck renders
      `1/1 · In Focus · Barbell Bench Press · 3 SETS · 5 REPS · 60 KG · Too Easy · Too Hard · Notes`.
      Two dep fakes must return real values, not `noop`: `sessionFocusPath` builds a focus URL and
      calls string methods on `urlFor`'s result, so `() => undefined` fails deep inside rendering
      with an error naming neither.
- [x] **Migrate the clipboard's RENDER and INTERACTION tests to `tests/medium/`.** 26 moved (e2e
      137 → 112 tests, 43 → 35 files; medium 42 → 68), in five files: edit-mode chrome, the inline
      editor, the catalog picker, the quick-signal toggle rules, and rest focus. Two things the
      first attempt got wrong and the next reader should not repeat: the stub had to boot through a
      new `bootActiveSession` step in [appBoot.js](src/appBoot.js) (the deck's own listeners live in
      `setupActiveSession`, which nothing but `app.js` called, so an injected session rendered but
      no button did anything); and the taxonomy picker is route-backed, so `navigateToPath` has to
      reproduce the router's route→dialog pairing or the 📖 button navigates into nothing.
      `test_quick_signal_toggle`'s "rather than a hand-built shortcut" was honoured, not overridden:
      the fixture IS the written-down contract, so it is no longer hand-built. The file kept only
      its two modal tests and is renamed `test_feedback_modal_exclusivity.py` after what it covers.
- [x] **Document the session ↔ clipboard seam in [docs/DATA_MODEL.md](docs/DATA_MODEL.md).** Written
      as §7 (appended, so nothing renumbered), covering both `activeSession` and the
      `sourceSession` seam `buildSessionMeta` produces, with the per-field consumption counts
      re-measured rather than copied. Two shapes are called out as the ones that break naive
      consumers: a planning draft carries `isPlanning: true` and NO `startDate`/`endDate`, and a
      session opened from history has `sourceSession: null` unless it was a plan. Also records why
      `buildSessionMeta`'s 2h `endDate` clamp is load-bearing — `recoverActiveSession()` discards a
      cache more than 2h past its scheduled end, so without it a same-day session whose window had
      closed would be thrown away the moment it was recovered.

## 20b. Backlog sweep — 2026-08-06

Four entries had shipped without being ticked (§12.6, §12.8, §22, §8.3) and one was misclassified
(§18.6), so the backlog could not be trusted for prioritising. Every open/partial item was checked
against the code rather than re-read, and the results are recorded here so the next sweep starts
from evidence instead of repeating it.

**Changed:**

| Item | Was | Now | Evidence |
| :--- | :--- | :--- | :--- |
| [§8.3](#83-x-inline-clipboard-editor--shipped-the-saved-patch-is-long-gone) | open | **done** | `clipboardEditor.js` ships; `patches/` does not exist; three medium suites cover it |
| [§18.6](#186--decided-persistence-engine--indexeddb-supersedes-the-37-deferral) | open | **partial** | engine + write queue + durability all wired; lazy per-client load deliberately deferred |
| [§12.7](#127--observation-low-priority-89-separate-module-requests-on-first-load) | open | open, **corrected** | 15 `modulepreload` hints already cover the boot path; the entry's own guidance is "do not act" |

**Two grep false positives**, recorded so the next sweep does not re-raise them: `expectedVersion`
in [schemaMigrations.js](src/data/schemaMigrations.js) is *schema* validation, not §18.9's
compare-and-swap; and the `walkthrough` hits are i18n strings for a notification button, not §9.5's
engine. Checking a signal's CONTEXT, not its count, is the whole method — the first pass of this
sweep also mis-scored several items because `grep -c` over multiple files emits `file:count`.

**Noticed while sweeping, not fixed:** the demo notification offers an "Explore Walkthrough" button
([messages.js](src/data/messages.js)) that merely navigates to `/clients` — it promises a guided
walkthrough (§9.5) that does not exist yet. Either the copy should stop promising it, or §9.5 should
be built; leaving a button that under-delivers is the worse of the three options.

## 21. `Page.goto` stalls against the local dev server

Five occurrences on 2026-08-05, each failing an unrelated e2e test with
`Page.goto: Timeout 60000ms exceeded` and costing a full re-run. Not a regression and not sleep —
the failing tests pass in isolation, the server is healthy before and after (1 thread, 4 fds, no
leaked sockets), and `journalctl | grep "PM: suspend entry"` showed no suspend in the windows. Now
the gate's dominant failure source.

- [x] **The service-worker hypothesis is DISPROVEN — measured 2026-08-05, do not retry it.** Both
      halves of its evidence failed. (a) `tests/medium/` no longer stalls zero times; it stalls
      routinely (five failures in one stage, all `Page.goto`), and its stubs register no worker at
      all — so the stall happens with no service worker in play. (b) Disabling registration made
      things **worse**, not better: real app, fresh contexts, 8 workers, SW on = 38.3s wall /
      median 2.84s; SW off (via an `add_init_script` stub of `navigator.serviceWorker.register`) =
      52.7s wall / median 4.81s. The worker's cache *helps* once installed.
      **Also do not implement it via `page.route`**: an autouse fixture serving an inert `sw.js`
      that way produced **59 failed / 53 passed in 702s** (baseline 113s green). Route interception
      routes every request through the Node driver for pattern matching, so the cost lands on all
      ~90 requests, not just the one intercepted.
- [x] **Four other suspects ruled out by measurement, so nobody re-derives them.**
      | Suspect | Measurement | Verdict |
      | :--- | :--- | :--- |
      | Dev server throughput | 8 procs × 126 assets = **2791 req/s**, 1008 requests in 0.4s | not the bottleneck |
      | TCP listen backlog | `Recv-Q` sampled every 5s for a whole stage: **0 throughout**, backlog 128 | never saturated |
      | Host CPU / contention | load peaked **2.4 of 16 cores**; 22GB RAM free, zero swap | not oversubscribed |
      | CPU clock (`power-saver`) | 887MHz vs 3074MHz loaded → **202.1s vs 159.5s** (21% for a 3.5x clock) | minor tax, not the cause |
      That last row matters on its own: the stage is **not CPU-bound**. It is dominated by waiting.
      A `power-saver` profile costs ~21% and is worth clearing, but it fixes nothing here.
- [ ] **What the evidence actually points at: the cold module graph, per fresh context.** Isolating
      the variables against the live server, 8 workers, no pytest involved:
      | Scenario | median | max |
      | :--- | :--- | :--- |
      | fresh context → trivial asset (`manifest.json`) | 0.11s | 0.22s |
      | **reused** context → real app | 0.31s | 16.19s |
      | **fresh** context → real app | 2.84–8.81s | 17.6–59.1s |
      Context creation is nearly free (row 1) and the server is fast, so the entire cost is the app's
      **cold load of ~89 ES modules** ([§12.7](#127--observation-low-priority-89-separate-module-requests-on-first-load))
      re-fetched and re-parsed for every function-scoped `page`. §12.7 is filed as a low-priority
      observation; this promotes it — it is the gate's dominant failure source. A `modulepreload`
      pass (flattening the import waterfall) or a dev-time bundle is the first thing to try.
- [ ] **Beware: run-to-run variance is ~3x and will fool a single measurement.** The same command,
      unchanged, gave **125.8s / 38.3s / 66.7s** wall across three consecutive runs (maxes 59.1s /
      17.6s / 22.0s). Any fix here needs several runs before/after to claim anything; one green run
      proves nothing, and one red run does not convict a change. Two conclusions in this session
      were drawn from single runs and both turned out wrong.
- [ ] **Note the interaction with the raised navigation timeout.** 30s → 60s
      ([tests/conftest.py](tests/conftest.py)) made each stall twice as expensive (a stalled e2e
      stage runs ~340s instead of ~115s). If the root cause is not fixed, consider reverting to 30s
      so stalls fail fast and cheap.

## 22. [x] Two `src` defects found while testing — FIXED

Both surfaced during the tier work and were deferred as app-code changes rather than test changes.
Both fixed 2026-08-05.

- [x] **`clientFormsController.js` re-rendered the client list WITHOUT `navigateToPath`.** Worse than
      recorded: the dependency was never threaded into `setupClientForms` at all, so BOTH its
      `renderClientsList` calls (the save path and the search path) dropped it, and every card in a
      re-rendered grid threw `navigateToPath is not a function` on tap. Threaded through from
      `app.js` and covered by a new medium test — verified failing without the fix, which mattered,
      because the old stub hand-duplicated the search listener and passed the dep on both paths. The
      stub now boots `appBoot.bootClientForms`, the real step, so it cannot diverge that way again.
- [x] **`#btn-sync-data`'s handler moved to the module that owns its markup.** Now
      `setupCalendarSync()` inside [backupRestore.js](src/modules/common/backupRestore.js), taking
      `renderSessions` as a dep so that module still knows nothing about the sessions feature beyond
      "re-render it". `setupCalendarSessions` is gone from
      [sessionsView.js](src/modules/sessionList/sessionsView.js) along with its two now-unused
      imports, and [test_offline_cached_signal.py](tests/medium/test_offline_cached_signal.py) no
      longer boots a sessions-module function to reach a backup-dialog button — it is plain
      `HEADER_STUB` again.

**The general lesson, worth keeping:** a stub that hand-duplicates production wiring will agree with
itself and disagree with the app. Both defects hid behind exactly that. Mount the real `bootXyz`
step, or the test proves only that the test is self-consistent.

---

## 23. [Brainstorm] Go-to-market — audiences, channels, and what blocks a launch

Captured 2026-08-06 from a GTM discussion. Nothing here is decided; the point is that promotion is
sequenced work with prerequisites, not a post that can be written on a whim. **The governing fact
is [docs/PREVIEW.md](docs/PREVIEW.md)**: the app currently tells its own users it can wipe their
data and is "not for running your real business on yet". A successful trainer-facing launch in that
state is the worst available outcome — one first impression per person, spent on a build that will
lose their clients' records.

### 23.1 [ ] [Decide] What "winning" means, before any channel is chosen
Every downstream choice hangs on this and it is unresolved. The candidates pull in different
directions: **users** (a trainer roster to learn from), **contributors** (a project that survives
one maintainer), **credibility** (a portfolio artefact), or **a future paid tier** (hosted sync,
which would reintroduce the data-processor exposure deliberately avoided in [§1.5](#15--brainstorm-google-calendar-integration--source-of-truth-occupancy-and-data-processor-exposure)).
Pick one as primary — optimising for all four picks none.

### 23.2 [ ] Two motions, sequenced — dev audience now, trainers only after PREVIEW comes off
- **Now (preview is acceptable here).** Developers expect pre-release software and are not harmed
  by it. r/selfhosted (angle: no backend, no account, data never leaves the browser), r/opensource,
  r/webdev Showoff Saturday, r/PWA. **Show HN** is a one-shot and should be spent only once a demo
  recording exists (§23.5). Durable, compounding placements beat any single post: a PR to
  **awesome-selfhosted**, an **AlternativeTo** listing against Trainerize / TrueCoach / My PT Hub /
  PT Distinction, and **F-Droid** if [§9.6](#96--tbd-install-as-an-offline-android--ios-app) ever
  lands. Product Hunt is largely vanity — low priority.
- **Also now, and higher value:** recruit 5–15 trainers **as design partners, not users**, by hand.
  Ten trainers who reply are worth more than a thousand stars.
- **Later (only once the PREVIEW badge is gone and sync works).** The real trainer-facing launch.

### 23.3 [ ] Channel ranking for the trainer audience — Reddit is not the top of it
Reddit's PT subs (r/personaltraining, r/personaltrainerbusiness, r/fitnesscoaching) skew toward
*aspiring* and newly-certified trainers; the person who needs a gym-floor clipboard has a full
roster and is on their feet all day, not browsing software forums. r/personaltraining is worth
entering eventually, but **via months of helpful comments in the recurring "what software do you
use" threads, never a launch post** — those get removed. Higher-density channels, best first:
1. **Gyms and studios, in person.** One manager adopting it reaches 5–20 trainers at once. Best
   conversion per conversation available, and the shipped SL translation makes Slovenia the
   natural first market.
2. **Facebook groups** — national/local PT groups, online-coaching groups, certification alumni.
   Where working trainers actually ask the software question.
3. **Certification bodies and federations** — EREPS, NASM/ACE/ISSA alumni channels, Fitnes zveza
   Slovenije. One newsletter mention outreaches any forum post.
4. **PT education providers.** Students cannot afford subscription SaaS; entering a curriculum
   yields a cohort every year.
5. **Instagram / short-form video** — the profession's own platform. Not a link drop: 15 seconds of
   one-handed set logging, which is native to both the format and the audience.
6. **LinkedIn** — reaches the gym-owner/manager tier, i.e. the buyers for (1).

### 23.4 [ ] Positioning — "open source" is the proof, not the pitch
Trainers do not buy licences, and the name reads as opaque to them. The claims that land, and each
is already true: **free, no subscription** (the entire competitive set is $20–100/month); **no
signup, no account — open a link and you are using it**; **works with no signal** (basement gyms
kill every cloud app); **client data never leaves your phone** (EU trainers legally hold health
data, so this is a compliance answer, not a mood). Also **narrow the wedge**: do not pitch
"replace your PT software" — switching costs are brutal and they already have a system. Pitch the
**clipboard**, the one job they all hate, and expand from there.

### 23.5 [ ] Launch prerequisites — these block promotion more than channel choice does
- [ ] **No screenshots or video exist anywhere in the repo.** Nobody adopts a UI tool they cannot
      see. A 20–30s recording of a real set being logged one-handed — tap, `⬆ Load Up Next`, next
      participant — is the single highest-leverage asset and is an afternoon of work. Blocks
      everything else here.
- [ ] **No landing page.** [README.md](README.md) is developer-facing (correctly) and the app boots
      empty. A trainer arriving from any of §23.3 needs one screen: what it is, the recording,
      "try it now", "add to home screen".
- [ ] **Share only the demo deep-link, never the bare URL.** `?init=demo_data_load&lang=…&theme=…`
      already exists and is an unfair advantage no competitor can match — comment to working
      clipboard in three seconds, no email gate. It also papers over the missing onboarding below.
- [ ] **Two headline README features are not shippable.** Google Calendar is unbuilt
      ([§1.5](#15--brainstorm-google-calendar-integration--source-of-truth-occupancy-and-data-processor-exposure))
      and the Drive OAuth client ID is still uncreated, so [§3.3](#33-x-google-drive-periodic-sync)
      sync works for nobody but the maintainer. Either ship them or trim the public pitch to what
      runs today — promoting either now is promising vapor.
- [ ] **No onboarding for an empty app** ([§9.5](#95--guided-walkthrough-engine-step-overlay) is
      unbuilt). A trainer landing on a blank client list churns in ten seconds.
- [ ] **No feedback route a non-developer will use.** GitHub issues is a wall to a PT; one email
      address or form, linked in-app. See [docs/BUG_REPORTING.md](docs/BUG_REPORTING.md).

### 23.6 [ ] Campaign: "Prvih deset" — 10 Slovenian trainers, 12 weeks
The concrete first campaign, chosen over an online launch because **the whole Slovenian market is
small enough to enumerate** — likely a few hundred to ~1,500 working trainers (verify). That removes
the need for a funnel, a budget, or a growth loop; it needs a list of names and a calendar, which no
international competitor can assemble. Two consequences shape everything below: the shipped SL
translation is a genuine moat (every competitor is English-only), and **a small market is one
reputation graph** — burning ten trainers with a preview build that eats their data does not cost
ten users, it closes the country. Hence this is explicitly **not a launch**.

**Framing:** design-partner recruitment. Not "adopt my software" but "help me build this, it is
unfinished, it is free and always will be." That converts *better* with no reputation behind it,
because it is a request a trainer can accept in thirty seconds.

**Success metric — one number:** 10 trainers who log a **real session** in a given week, sustained
8 weeks. Not installs, stars, or signups. Failing to reach 10 in an entire country is a product
signal, not a marketing one, and is worth learning cheaply.

- [ ] **Phase 0 — assets (2 weeks, before talking to anyone).** The §23.5 checklist, plus
      **printed QR cards** to the SL demo deep-link (~€30 for 250): a trainer mid-shift will not
      type a URL but will scan a card and look at it later, and unlike a conversation the card
      survives. Public pitch must not mention Calendar or Drive sync until they work.
- [ ] **Phase 1 — the gym walk (weeks 3–8, the core).** Target ~30 conversations → 10 committed
      trainers. Visit during **dead hours, 10:00–15:00** — PTs are unreachable 6–9 and 16–21.
      Ljubljana first (probably a third of the country's working PTs), then Maribor, Kranj, Celje,
      Koper. **Do not demo the app**: ask to shadow one session, say nothing, log it yourself in
      parallel, then hand over the phone with their own session already on screen. Close with
      *"can I text you on Sunday and ask what broke?"* — a yes is a design partner, a hedge is not,
      and is not chased.
- [ ] **Phase 2 — institutions (weeks 6–16, parallel).** Where a small market compounds, because
      the unit of persuasion becomes a gatekeeper rather than a trainer. **Fakulteta za šport (UL)**
      is the highest-leverage target in the country — it produces the kinesiologists who become
      Slovenia's PTs, and a lecturer mentioning a free tool reaches a full cohort every year.
      Kinesiology at UP Koper is the same play, smaller. Also: whoever actually issues the *licenca
      za osebnega trenerja* and runs the CPD courses (names to verify), and **gym owners**, pitched
      a different benefit than trainers — record consistency across staff turnover.
- [ ] **Phase 3 — only after the PREVIEW badge is gone.** SL Facebook groups, Instagram (the
      profession's own platform; the same clip weekly), then the channels in §23.2–§23.3. A public
      post is permanent and cannot be un-rung in a market this size.
- [ ] **Weekly measurement, four numbers:** conversations had, trainers who logged a session this
      week, sessions logged total, and the one that actually predicts retention — **how many would
      be annoyed if it vanished tomorrow.** If that is 2/10, distribution is not the problem.
- [ ] **Explicit non-goals:** no waitlist, no "launch", no ad spend, no r/personaltraining, no
      chasing anyone who hesitates, and **no feature built on one trainer's request** until three
      ask independently — one loud early user will otherwise redirect the roadmap onto their own
      quirks.
