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
(workflows), [CONTRIBUTING.md](CONTRIBUTING.md) (conventions).

## Where to start (ranked 2026-08-08)

The governing fact is [docs/PREVIEW.md](docs/PREVIEW.md): the app tells its own users it can wipe
their data. Nothing trainer-facing can be promoted until that is false, so the ranking is **data
safety → showability → everything else**. §24's module reorg is essentially done and its remaining
halves are the ones its own rule says to skip.

| Rank | Item | Why now |
| :--- | :--- | :--- |
| 1 | Create the Google OAuth client id (§3.3, maintainer action) | A fully built feature works for exactly one person; also makes a README headline true |
| 2 | §9.5's promise in the demo notification | A shipped button offers a walkthrough that does not exist |
| 3 | §18.7 backups — readers-forever + frozen corpus | The only recovery path there is, currently unenforced |
| 4 | §3.8 unbacked-data banner | The honesty surface for the risk §18.7 fixes; unblocked now that §3.3 exists |
| 5 | §23.5 demo recording | Gates every outreach channel, and the autumn window in §23.6 is real |
| 6 | §9.5 guided walkthrough | Blank-app churn; big, so not before the above |

Deprioritised on purpose: §24.5/§24.7 remainders and §24.8's rename (optional by their own text),
§11/§5.1/§4.1 (large UI churn with no users yet to aim it), §17.2–§17.4 and §18.8–§18.12 (decided on
paper, correctly parked).

---

## 1. Scheduling & Sessions

### 1.1 [x] PT-side client assignment to a session — shipped, see CHANGELOG
Assignment already existed via the session-card Edit form; what this added is the notification half —
a downloadable `.ics` ([calendarInvite.js](src/data/calendarInvite.js)) plus a prefilled `mailto:`,
offered by [sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js) for *newly* assigned
participants only. There is no backend to send mail from (§1.5). A participant with no email address
is assigned silently, with a disabled invite row explaining why.

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
  top/height map to start/end, overlapping blocks side by side in columns. Non-conflicted parts of
  the day may still collapse.
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

---

## 3. Data Sync

### 3.3 [x] Google Drive periodic sync
**Shipped**, manual-only as of §3.10. [driveSyncConfig.js](src/data/driveSyncConfig.js),
[googleAuth.js](src/data/googleAuth.js), [driveAppData.js](src/data/driveAppData.js),
[syncMerge.js](src/data/syncMerge.js), [driveSyncService.js](src/data/driveSyncService.js), UI in
[driveSyncUi.js](src/modules/common/driveSyncUi.js). Decisions worth not re-litigating:

- **No visible, human-editable Drive file, ever.** `appDataFolder`'s invisibility is what makes
  §1.5's PII isolation hold; a visible file needs the broader `drive.file`/`drive` scope every PT
  would re-consent to, for a convenience view with no safe editing UI. The escape hatch for anyone
  who wants their data outside the app is the existing Export/Import JSON backup (§3.7).
- **Merge is a per-record three-way merge against the last-synced ancestor**, never wall-clock
  last-write-wins. **No Lamport `(deviceId, seq)` pair** despite §18.5 flagging one as eventually
  necessary: this merge never orders two edits, it only detects "both sides changed since the
  ancestor" and reports a conflict. **No tombstones** either — the remote snapshot is always freshly
  downloaded and Drive's history is linear, so absence from a fresh fetch *is* the deletion signal.
  What would invalidate that: anything else ever writing the same file.
- **Conflicts are surfaced, never silently resolved** — a "Review conflicts (N)" dialog renders both
  sides via `textContent`/`<pre>` (never an HTML sink) and the trainer picks the survivor.
- **Not built**: incremental sync via the Drive Changes API. Every pass moves the whole file —
  correct, not bandwidth-minimal.
- **⚠ Blocked on a maintainer action**: `GOOGLE_DRIVE_CLIENT_ID` is blank until a real GCP OAuth
  client id is created (see the file header for the steps). A blank id is a supported "not configured"
  state, so the app is honest — but this feature works for nobody until it is filled in. **Ranked #1
  in Where to start.** Live-OAuth behaviour is therefore untested in CI by design; the suite pins the
  merge logic and request shapes against an injected `fetchImpl`.

### 3.5 [ ] Paper consent — record checkbox + date; provide a printable blank form
**Decided (2026-07-22): KISS — consent lives on paper.** The client signs a form kept at the gym and
the PT files the paper; that physical file is the evidence. No photo capture, no image storage, no
email flow, no IMAP — all considered and dropped.

- App's only job: the existing `gdprConsent.cloudSync` checkbox plus an **editable consent date**
  (defaults to today; the paper may have been signed earlier), replacing reliance on the invisible
  `timestamp`.
- Optionally surface a printable blank form from `docs/templates/Client_Consent_Form.md`.
- **Supersedes the shipped `mailto:` consent trigger** (former 3.4), which can be removed once this
  lands.

### 3.7 [x] [Superseded by §18.6] Persistence engine — localStorage JSON, then IndexedDB
Deferred a real DB in 2026-07-22 until the 5 MB cap loomed; §17.1 shipping made it loom. Engine
decision and sizing now live in §18.6.

### 3.8 [ ] Unbacked-data warning banner — same weight as the PREVIEW badge
**Raised 2026-07-26 (Simon).** The database holds the **only** copy of a trainer's records
([DATA_MODEL §6](docs/DATA_MODEL.md)) and a browser can evict IndexedDB under storage pressure.
Nothing on screen says so.

- **Surface**: a persistent header banner styled and placed like `#preview-badge`, tappable through
  to a short explanation of the risk and the fix.
- **Condition**: no secured external copy — no cloud target configured, or the last successful
  export/sync is stale ("never" being the obvious first case). Distinct from the offline indicator
  and from §3.9's ahead/behind badge: those say "not pushed *yet*", this says "nothing anywhere but
  this browser profile".
- **Not permanently dismissible** while the condition holds. Session-scoped at most.
- **Wording is the whole feature** — honest without alarming a PT mid-session ("Only copy — no backup
  yet" beats "DATA LOSS RISK"), and it must name the fix in the same breath.
- [storageDurability.js](src/data/storageDurability.js) already measures eviction risk by
  consequence, so the banner can escalate when the browser has *refused* persistence rather than
  merely not been asked.

### 3.9 [x] [Decided] Every write increments the ahead counter on the Sync & Backup button
**Fixed 2026-08-03 at the seam, not the call sites**: `onStateSaved(listener)` in
[stateStore.js](src/data/stateStore.js) fires for every writer that reaches `saveToLocalStorage()`,
including the ~21 that bypassed the old per-call-site callback. `ahead` is a live diff
(`countChangedRecords()`), not a counter — ten edits to one field collapse to one changed record, so
no debounce policy was needed. The live-session cache is deliberately excluded: it writes
`librept_active_session`, which a Drive sync does not send, so counting it would make the badge lie.

### 3.10 [x] [Decided] Drive syncing is manual-only; periodic/resume ticks refresh counters, not data
**Decided 2026-08-04.** Every merge/apply/upload now runs only from an explicit tap. The periodic
timer and the resume hook call a read-only `refreshSyncCounts()` instead, which downloads the remote
file purely to diff it — never merges, applies, or uploads. A second single-listener seam
(`onSyncCountsChanged()`) keeps the `behind` half of the badge live without touching local state.

---

## 4. UI / UX

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
**Closed 2026-08-07.** `#active-session-bar` was read by six modules and created by none — every
write null-guarded, so it failed silently and the docs described a surface no trainer could see. The
strip is back, and it names the **clipboard**, not "the active session": a clipboard can be several
overlapping booked slots merged into one, so the seed data now generates that case. The idle
"Next: …" state was deliberately **not** restored — planning information does not earn permanent
space on a phone, the dashboard already shows it, and it competed with the notification summary for
the same strip. The bar is a `<button>`, so the whole strip is the tap target.

### 6.4 [x] CI runs medium and e2e in parallel; the local gate runs them staged — RESOLVED: keep parallel
**Raised 2026-08-08 (Simon), from
[run 31224697989](https://github.com/stutek/LibrePT/actions/runs/31224697989).** The observation is
correct: locally `build check` stages the browser suites (2 → 3 → 4) so a broken component fails fast,
while in [deploy.yml](.github/workflows/deploy.yml) `medium-tests`, `e2e-tests`,
`static-security-audits` and `owasp-zap-scan` all declare the same Stage 1 `needs:` list and run
concurrently.

**Decided (Simon): CI mirrors the local gate — four stages, chained, with no half-stages.**
`deploy.yml` is now Stage 1 (nine concurrent fast jobs) → Stage 2 medium → Stage 3 e2e → Stage 4 ZAP
→ post-gate assemble → deploy, each stage starting only if the previous is clean.

**The half-stage is the part that needed fixing, not just the ordering.**
`static-security-audits` is a Stage 1 check locally, but in CI it had acquired a `needs:` on every
other Stage 1 job — so it ran after the fast checks and before Stage 2, delaying everything behind
it, and nothing in the file said so. Its stage existed only as an implication of its dependency
list, which is precisely how a job ends up between stages without anyone deciding it should.

So the stage is now **stated and checked, not implied**: every job's `name:` carries its stage
(`Stage 2 · Medium Component Tests`), and `pipeline_gates.py` asserts the label matches the checks
the job actually runs — a job running Stage N's checks must say Stage N, and a job running none
(assemble, deploy) must not claim a stage at all. A fractional stage is now unrepresentable rather
than merely absent: you cannot write `Stage 1.5`, and an unlabelled or mislabelled job fails Stage 1
by name.

**The cost, stated plainly, because it was argued against and overruled**: these jobs have no
resource contention in CI — each gets its own runner and its own dev server — so chaining buys none
of what it buys locally, and adds each stage's setup (checkout, pip install,
`playwright install chromium --with-deps`) in series to every green run. What it buys is that the
pipeline has **one** definition: a broken component stops the run, and nobody has to remember which
ordering guarantees hold in which place.

**The ordering is now shared code, not a convention.** `build/__init__.py`'s `PIPELINE_STAGES` table
is the single declaration: `build/__main__.py` executes it, and
[agent_tools/pipeline_gates.py](agent_tools/pipeline_gates.py) parses it and asserts `deploy.yml`
both **orders** its jobs to match (a Stage N job has every Stage N-1 job in its transitive `needs`
closure) and **labels** them to match. Adding a stage, quietly re-parallelising one, or letting a job
drift between two, now fails Stage 1 by name.

**A bug found while building that check, worth recording**: the first version let stage 1's
deliberately-empty row in `PIPELINE_STAGES` overwrite the set seeded from `run_stage_1_parallel`'s
own table, so stage 1 dropped out of the comparison entirely and the check passed **vacuously** for
the stage with fourteen members. It reported "3 stages ordered" where four exist, which is the only
reason it was caught. A detector is only worth what its negative test proves — pinned by
`test_a_later_stage_that_does_not_wait_for_an_earlier_one_is_reported`.

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
**Raised 2026-07-27 (Simon).** The label rename to "Pending Review" shipped. The rest is a bundle of
separable proposals:

1. **[ ] Session-level review flag.** Keep per-item feedback as the underlying record and add a
   **derived** `needsReview` roll-up for the dashboard/registry — opening the session still shows
   which items carry which tag.
2. **[x] CLARIFIED — resolution is per feedback record, not per session.** It stays on the `resolved`
   flag of a `planUpdates` entry, set via the existing wizard. (1) is therefore purely derived and
   never stores its own bit — one source of truth, no drift.
3. **[~] Unscheduled sessions.** Now largely built (2026-08-07): deleting a session keeps each
   participant's plan as an unscheduled draft, reachable from the feed, addressed by id so one client
   can hold several. **Still open**: authoring an unscheduled session directly (rather than only
   rescuing one from a deletion), and its place on the timeline axis per (6)/(9).
4. **[ ] Client registry → all sessions as a scrollable deck.** "Potentially infinite" must mean
   windowed/virtualized rendering, not unbounded DOM — years of history would otherwise degrade the
   exact responsiveness this app protects.
5. **[ ] One shared scrollable-deck component.** Partial pushback: clipboard cards carry drag-reorder
   and edit affordances, registry cards are browse-only. Extract only the shared part — the
   virtualized scroll/snap container and card shell — and keep interaction logic in the clipboard
   consumer composing on top.
6. **[x] CLARIFIED — ordering.** Every card is strictly time-ordered; **unscheduled is the one
   exception**, clustered at the past/active → future pivot rather than sorted by a date it lacks.
7. **[ ] Filter chips** (past/active/future/for-review/unscheduled). Depends on (1) and (3).
8. **[x] SHIPPED — the day-deck became one continuous, time-ordered timeline.** See CHANGELOG. Its
   prev/next arrows and date title were later removed in favour of sticky per-day headers alone. No
   virtualization was added — an open call, worth revisiting only if session volumes justify it.
9. **[ ] Unscheduled cards are directionally sticky.** They must **not** disappear when scrolling
   toward the future (an actionable "needs scheduling" reminder) but **may** scroll away toward the
   past. Plain `position: sticky` pins in both directions, so this needs scroll-direction-aware
   pinning — real interaction code, not styling.

**Sequencing**: (8) was the load-bearing prerequisite and is shipped; (3) is now mostly there. Next
per this ordering: (9), then (4), then (7).

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
[clipboardEditor.js](src/modules/clipboard/clipboardEditor.js); the `patches/` directory this entry
once pointed at no longer exists. Covered by three medium suites (drag reorder and circuit
well-formedness, the catalog picker, and the mode's chrome).

### 8.6 [x] Rests are first-class, focusable plan items — see CHANGELOG
Polymorphic `DeckCard` hierarchy ([deckCard.js](src/modules/clipboard/deckCard.js) + subclasses).

### 8.7 [ ] [Discuss] Should completing a circuit ROUND stop its timer, like completing the block does?
**Raised 2026-08-06 (Simon).** `completeCircuitRound` is asymmetric and the asymmetry was never
decided — it fell out of where the code happened to put the call. On the **final** round the timer is
**frozen** (not cleared: the trainer dismisses it themselves, so a number they might still want is
never yanked away); on any **earlier** round the timer is left entirely alone. So the same control
does or does not touch the timer depending on a number the trainer is not looking at.

- **For leaving it running**: between rounds, a running rest countdown is exactly what the trainer is
  pacing off. Freezing at round 2 of 4 destroys the thing they started it for.
- **For stopping it**: the round is over, so a timer started *against that round* measures nothing —
  but `focusRef` only records `{type: "circuit", id}`, so the app cannot tell "resting between rounds"
  from "timing this round's work". **That may be the real gap**: the decision needs a distinction the
  data model does not make.
- **Check the gym floor first**: §8.6's first-class rests mean a between-rounds rest can now be a real
  plan item with its own timer, which may make the question moot for well-authored circuits and leave
  it relevant only for ad-hoc ones.

No behaviour change until this is settled; the entry exists so the asymmetry is recorded rather than
re-discovered.

---

## 9. Interactive Demo / Guided Onboarding

A first-run onboarding that walks a new user through the app with a simulated finger, instead of
seeding demo data silently. The app already boots empty with an opt-in demo deep-link (shipped). Each
phase below is committable on its own.

### 9.2 [~] Demo-data loader — PARTIAL
`?init=demo_data_load` (parsed in `src/helper/shareLink.js`) seeds the full fixture, but **only when
the app is genuinely empty**, so it never clobbers real records. **Still open**: narrow it to a
focused subset (a few clients, one or two routines, today's sessions, the in-progress session) and
expose it as a callable `loadDemoData()` invoked by the in-app activation in §9.5, not only by URL.

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
  of a PT's data. The flow opens a **prefilled GitHub issue URL** the PT reviews and submits. Zero
  traffic unless they tap.
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

### 12.6 [x] Vendor Font Awesome locally — the last CDN dependency
**Done 2026-08-05**, and it was **the root cause of §21's `Page.goto` stalls**: `page.goto` waits for
`load`, `load` waits for every stylesheet, and that stylesheet was a live internet request made by
every test in every tier (1948ms median, 35233ms worst under 8 parallel contexts). Also removed ZAP
suppression 90003 (SRI Missing), whose entire justification was this stylesheet.

**Still open — glyph subsetting**, and it is now safe to do: 2 woff2 files remain (252KB) using 48
glyphs of ~1400 and 2 brand glyphs; the codepoints do not collide, so merging would land ~381KB of
font+CSS at roughly 24KB. The prerequisite is built —
[agent_tools/icon_coverage.py](agent_tools/icon_coverage.py) gates every `fa-` class in `src/`
against what the stylesheet can render, with the four **runtime-built** names
(`fa-arrow-${dir}`, `fa-chevron-${…}`) declared explicitly because a static scan misses them and they
would subset to blank boxes with no error. Its first run found two Font Awesome **Pro** classes live
in the app, rendering as empty boxes; both were swapped. Remaining work is a dev-time `fonttools`
script (not a build dependency — regeneration stays a deliberate committed act).

**Licensing, checked against the shipped text**: a subset is a "Modified Version" under SIL OFL 1.1,
which permits it but reserves the name — so the merged font's `font-family` must be renamed
(`"LibrePT Icons"`), and the copyright/licence must travel with it, which subsetting tools routinely
strip from the name table. The icons are separately CC BY 4.0, so attribution must also state that
the set was subset. **Today is compliant and relies on none of this**: both woff2 files are
byte-identical to upstream (SHA-256 verified), so no Modified Version exists yet.

**Subsetting cannot affect names in any language** — Font Awesome is Private Use Area only and
contains no letters. Non-Latin coverage is a `fonts.css` question (latin + latin-ext only, so CJK and
Cyrillic names render through the fallback chain — deliberate, since a CJK webfont is megabytes per
trainer), and `getInitials()` derives real initials from Han/Cyrillic/Greek/Arabic names.

### 12.7 [ ] [Observation, low priority] ~89 separate module requests on first load
A cold visit fetches ~89 files. In production this is fine: HTTP/2 multiplexing plus the service
worker's precache make it one visit, once.

- **The cheap half is done**: `index.html` carries 15 `<link rel="modulepreload">` hints covering the
  boot-critical path. Only bundling remains, and that is the expensive half.
- **Measured properly 2026-08-08, and it is NOT the gate's dominant cost.** Stage 3 is 131 tests and
  352s of call time, 2.69s average. A cold app boot in a fresh context, measured under the same 8-way
  parallelism the suite actually runs at, is **~0.94s** — roughly a third of an average test, with
  splash dismissal a few hundred ms on top. The rest is the tests doing their work.
  - **Correcting a misreading recorded earlier the same day**: boot was briefly written up as ~2.84s,
    i.e. essentially all of a test, by taking §21's number at face value. That number was measured
    under a heavier condition and does not describe this suite. **Always state the parallelism a
    browser timing was taken at** — the same navigation measures 0.30s serial, 0.94s at 8-way, and
    the difference is contention, not the browser.
- **Cheaper isolation is real but smaller than it looks.** Isolation today comes from a fresh context
  per test; the same isolation from a **reused context with storage cleared** measures **0.23s vs
  0.94s at 8-way parallelism — 4×**, because the fetch of ~89 modules is served warm. Serially the
  gap nearly vanishes (0.07s vs 0.30s), which is why it must be measured under load.

    | strategy | serial | 8-way parallel |
    | :--- | :--- | :--- |
    | fresh context (today) | 0.30s | 0.94s |
    | warm context, new page | 0.27s | — |
    | warm context, cleared storage | 0.07s | **0.23s** |

  - **SHIPPED for six files, and the stage-level gain is ~8%, not the 24% the subset showed.**
    Every row below is the SAME 131 tests, `-n 8`, quiet box, **balanced** profile, re-measured
    together after an earlier table mixed one row of unverified provenance with two known-balanced
    ones — the machine moved between power-saver and balanced during this work, and a row whose
    conditions you cannot name is not a baseline:

    | pooled files | full stage 3 (each run) | median |
    | :--- | :--- | :--- |
    | none | 50.84 / 49.05 / 50.24s | 50.2s |
    | four | 47.99 / 47.50 / 48.01s | 48.0s |
    | six | 45.22 / 46.18 / 46.91 / 44.53 / 46.07s | 46.1s |

    **The lesson is about how to read a subset benchmark.** Those four files run *alone* went
    34.8s → 25.5s, a genuine 24% — but alone they are 27 tests over 8 workers, so the pooled page
    is amortised over ~3.4 tests each. In the full suite xdist spreads all 134 tests across the
    same workers, the saving is ~0.35s per pooled test against a 352s call-time total, and the
    stage moves a second or two. Both numbers are true; only the second one is the gate.
  - **Extending it further has sharply diminishing returns.** Adding two files (14 tests) bought
    ~1.9s. The remaining ~67 eligible tests would plausibly buy a few seconds more, at the cost of
    a `page` override in every file. Not obviously worth it — revisit only if Stage 3 becomes the
    complaint again.
  - **Method note, because it cost two invalid comparisons.** `git stash push -- <paths>` on a
    CLEAN tree stashes nothing and still exits 0, so a "before" run measured this way silently
    re-measures "after". Disable the thing under test explicitly and assert it is disabled before
    trusting a baseline.
  - **Deep-link tests are the right pilot.** `test_share_deeplink` (13), `test_dialog_routing` (11),
    `test_record_dialog_routes` (7), `test_editor_row_deeplink` (5) and `test_session_dialog_routes`
    (4) are ~40 tests and ~100s of call time, and they are *by definition* "arrive at this URL cold"
    — they depend on no prior in-page state, so the only isolation surface they need is storage,
    which is enumerable (localStorage, sessionStorage, IndexedDB, CacheStorage, cookies, service
    workers). Contained blast radius, and the biggest single cluster of the win.
  - **The cost is the isolation model**, which is why this is a decision and not a spike: today a
    fresh context guarantees isolation *by construction*; clearing guarantees it *by maintenance*,
    and a store someone forgets leaks state silently and intermittently. If it is done, the clearing
    fixture needs its own test — write to every store, assert the next test sees none of it — or the
    guarantee is only a comment.
- **Read this before proposing it again.** It was mis-recommended as "the next big win" on 2026-08-05
  and again implicated in §21 — both wrong. §12.6's CDN stylesheet was the actual cold-load
  bottleneck, and it is gone.
- Bundling trades away the buildless property, a deliberate architectural choice, so the bar is high.

### 12.8 [x] `tests/e2e/` vs `tests/unit/` is a browser split, not a UI split — resolved by `tests/unit_js/`
Pure-logic tests used to boot a full Playwright page because a browser was the only JS runtime this
project had. `tests/unit_js/` is now the fast lane, and the dependency worry was **resolved rather
than accepted**: no npm dependency at all — `node:test`/`node:assert` are built into the runtime, and
Node is vendored the same pinned, checksum-verified way as Biome, so there is still no
`package.json`. See [tests/INDEX.md](tests/INDEX.md) for the four tiers.

---

## 13. Exercise Library & Movement Taxonomy

**CLOSED — fully shipped.** See [CHANGELOG.md](CHANGELOG.md) and
[UC6](use_cases/uc6_exercise_taxonomy_and_picker.md).

### 13.1 [x] Repurposed `exercisesView` into a Professional Movement Taxonomy — see CHANGELOG

### 13.3 [x] Conditioning metrics (modality axis) — see CHANGELOG

---

## 14. Refactoring: DRY & Complexity Reduction

> Superseded in scope by **§24**, which re-audited `src/` on 2026-08-07. The entries below are the
> earlier pass; only §14.5's i18n half is still open.

### 14.5 [~] Split the monolithic shared files to avoid same-file co-edit conflicts
**`index.css` and `index.html` shipped 2026-07-27** — both are shells now, with every view, dialog,
header and the notification area rendering their own markup from the module that owns them, each with
a co-located `.css`. **Still open**: `src/i18n/en.js` and `sl.js` are flat single-object
dictionaries, so every string lands in the same file. Consider per-feature namespaced string modules
merged into the locale, keeping `test_i18n_parity` green.

### 14.6 [x] Rename the `booking` domain term to `session` — shipped 2026-07-27
Code is unified on `session` (the PT runs a session; the client books a slot). **No back-compat kept**
— decided pre-release with no real PT data to protect, so the v1→v2 migration drops stray `bookings`
rather than carrying it forward. User-facing i18n copy was left alone.

### 14.7 [x] Extract a shared `renderMarkupOnce()` helper — shipped 2026-08-01
One helper in [modules/common/dom.js](src/modules/common/dom.js) replacing the copy-pasted
render-guard block at 22 call sites.

### 14.8 [x] Render-order dependencies between modules are unenforced — shipped 2026-08-01
[renderRegistry.js](src/modules/common/renderRegistry.js) topologically sorts shell renders and
throws on an unregistered or cyclic dependency, instead of silently no-op-ing. Had already caused two
bugs found only by end-to-end testing.

### 14.9 [x] `activeSessionController.js` mixed markup templates into a behavior file — shipped 2026-08-01
The three shell/dialog templates moved to
[activeSessionOverlayView.js](src/modules/clipboard/activeSessionOverlayView.js).

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
Resolved differently than planned. This assumed `localStorage` would stay a live multi-bucket store;
once §18.6 shipped, IndexedDB's per-schema object stores **are** that layout, and `librept_db` is read
exactly once as the legacy import source. A single plain key needs no bucket-keying scheme, so
[storageNamespace.js](src/data/storageNamespace.js) dropped the release-tag axis and got no
replacement. `CURRENT_SCHEMA_VERSION` stays a plain integer major — a "patch" to a schema is either a
migration step or nothing.

### 16.5 [x] Retire the multi-version hosting machinery from the code — done
Deleted rather than adapted, since none of it had a subject any more: `releaseIdentity.js`,
`versionCatalog.js`, `versionMessages.js`, `build/releases.py`, the release-publishing deploy step,
and five test files. **Kept**: the commit-SHA build stamp and the build-info dialog — support
surfaces, not switching machinery.

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
why not a linked list, rejected alternatives) lives in
[DATA_MODEL](docs/DATA_MODEL.md). Writers stamp `position` at the choke point they all funnel through.

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
> axis storage keys on (§16.3). "No fixes ever land on a maintenance-mode version" is inverted
> deliberately: old behaviours live inside the current build, so they get fixes automatically. The
> surviving justification for writing every live schema is the **previously-cached service-worker
> build** — a PT on yesterday's cached build *is* an older app version even with no tags — plus
> backup portability.
>
> **The build order (DB → write layer → CD tests) is complete.** What remains inside §18 is narrower
> and called out per section: §17.1's lazy per-client load (§18.6), §18.3's idle deferral and failure
> reporting, §18.7's backups, §18.8's encryption/desktop threat model, §18.9's CAS, §18.11's legal
> gaps, §18.12's ribbon tiers.

### 18.1 [x] [Decided in principle] The star write model, and its relationship to §16.3
**Built**: [recordSchemas.js](src/data/recordSchemas.js) declares each schema's per-collection field
shapes, [recordProjections.js](src/data/recordProjections.js) projects the live domain object into
them, and `starWrite()` in [stateStore.js](src/data/stateStore.js) is the fan-out — one transaction,
every live schema's store, with reconcile-deletes for records no longer present.

A **bucket** is one physical store holding data shaped by exactly one schema; bucket↔schema is 1:1.
Three relations were being conflated and are worth keeping apart:

| Relation | Cardinality | Owner |
| --- | --- | --- |
| bucket ↔ schema | 1 : 1 | storage layout (§16.3) |
| app version → schema it **reads** | N : 1 | the app build (`CURRENT_SCHEMA_VERSION`) |
| write layer → schemas it **writes** | 1 : N | the relation this section adds |

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
is the lineage id and no mapping table exists. §18.3's completeness check (a set difference over ids)
provides what a mapping table would have, free. **UUIDv7** (RFC 9562): 122 bits of collision
resistance *and* lexicographic time-ordering, doubling as the tiebreak within §18.5's topological
order. If short ids are ever wanted, base62-encode a v7 — never drop entropy.

### 18.3 [~] [Decided] Migration is pre-emptive, resumable, and runs through the normal write layer
**Shipped 2026-08-07** — [readSchema.js](src/data/readSchema.js). Pre-emptive backfill at boot; the
switch is a per-install **read re-point** and is **reversible**, because the schema being left goes on
being star-written. The backfill runs through the normal projection path, honouring the invariant
below.

**Two deliberate divergences, both because the backfill fits in ONE transaction:**

1. **Completeness is a stored marker, not a query.** The decision below rejected a flag because one
   written at the wrong moment can drift — true of a chunked migration, not this one: the marker
   commits inside the same transaction as the records, so there is no moment at which it can be wrong.
2. **Restartable, not resumable.** One transaction means an interruption commits nothing. Measured
   ~22ms for the 90-record demo set, ~400ms at ~3,000 records; revisit near ~50k, where a single
   transaction becomes a stall worth splitting — and both decisions below apply again as written.

The decided design, still authoritative if this is ever chunked:

- **Pre-emptive**, so a switch is instant, and there is no staleness window: once migration completes,
  ongoing writes fan out to that bucket too. Catch-up is a **re-derivation**, not a restore from a
  point in time — which is also why §18.7 rejects a snapshot tier.
- **Yields to user writes**: migration breaks on any interaction write and resumes when the burst
  ends. Gym-floor latency beats migration throughput.
- **Ordinary use accelerates migration**: a star write to a not-yet-migrated record populates the new
  bucket and marks it migrated. Safe to interleave in both directions.
- **The invariant that makes the accelerator sound**: migration must be
  `read old record → build domain object → normal star write` — *literally* the write layer, not a
  second transform. Otherwise half a bucket comes from each code path and the drift is undetectable.
- **A partially-migrated bucket must not be readable.** A crash at 40% would otherwise reboot the PT
  into a UI showing 40% of their clients — indistinguishable from catastrophic loss, and the rational
  response (re-entering records) creates real corruption.
  - **Completeness is a set difference over ids, not a count comparison**:
    `complete(target) ⇔ keys(source) \ keys(target) = ∅`. Two counts are independent aggregates that
    tie nothing element-to-element, so one absent source id plus one spurious target entry passes the
    check **over a hole**. **Containment, not equality** — ids the target has and the source lacks are
    legitimate. It is also cheap (`getAllKeys()` returns sorted B-tree keys with no deserialisation)
    and it **names the missing ids**, so repair is a re-projection of exactly those records.

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
older versions round-trip verbatim. `_source` exists in Elasticsearch precisely because its indexed
form is lossy; if staging guarantees projections are not lossy, there is nothing to reconstruct.)

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
  the signal belongs at the point of writing, announced app-wide via §18.12's ribbon, not only as a
  per-record marker (keep that too — it is cheap).

### 18.5 [x] [Decided] Ordering is topological, not chronological
Replay order means correct **foreign-key availability**, not timestamp order.

- **The reference graph must be acyclic.** [recordReferences.js](src/data/recordReferences.js)
  declares it (structural ownership only — a soft label like `routineName` is deliberately excluded)
  and a DFS cycle check is asserted in CI, including a proof the detector catches a real cycle rather
  than one that never triggers. Today's graph is trivial; the point is catching a future convenience
  back-reference before a trainer does. **§17.4 is the first realistic cycle risk.**
- **The wall clock is not an ordering key anywhere.** A single sequential writer resolves by execution
  order; timestamps are inert data. One rider: a backward clock jump still writes a wrong `loggedAt`
  — cosmetic, but it is what the PT reads. §3.3's Drive sync turned out **not** to need the
  `(deviceId, seq)` Lamport pair this section anticipated; see §3.3's merge note.

### 18.6 [~] [Decided] Persistence engine → IndexedDB (supersedes the §3.7 deferral)
**Engine shipped**: [indexedDb.js](src/data/indexedDb.js) (one database, one store per schema, three
indexes), [writeQueue.js](src/data/writeQueue.js) (write-behind, ordered) and
[storageDurability.js](src/data/storageDurability.js) (`persist()`), all wired into
[stateStore.js](src/data/stateStore.js).

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

- **IndexedDB, +0 KB install cost** — it is the platform, and quotas are orders of magnitude clear of
  the table above. **Not SQLite-wasm**: +700 KB–1.2 MB roughly doubles `src/`, and the OPFS
  `SharedArrayBuffer` VFS wants COOP/COEP headers GitHub Pages cannot set (`opfs-sahpool` avoids that,
  so it is a constraint with a workaround, not a blocker). The portability/permissions concern is the
  argument *for* IndexedDB: zero config, zero permissions, no binary, no VFS.
- **Layout constraint**: one database with one object store per schema, so a fan-out is a single
  transaction. IndexedDB transactions cannot span *databases*, so a database-per-schema layout makes
  atomic fan-out impossible by construction and is expensive to retrofit.
- **`navigator.storage.persist()` is mandatory**, not optional — without it IndexedDB is evictable and
  this app holds the only copy of a PT's business records.
- **Plan for eviction, not deprecation.** IndexedDB has no deprecation path. The realistic risks are
  Safari's 7-day cap on script-writable storage for non-engaged sites (home-screen install exempts
  you, which the app already promotes), quota-pressure eviction on Android, and private-browsing
  quotas. The recovery tier for all three is §18.7's backup file.

### 18.7 [ ] [Decided] Backups: 1× not N×, readers forever, writers never
**Ranked #3 in Where to start** — with no snapshot tier, this file is the only recovery path from a
write-layer bug, and the guarantee is currently a hope rather than a test.

- **Back up the newest bucket only — 1×, not 3×.** With §18.4's staging the newest schema is lossless
  and canonical; every other bucket is a pure projection, and derived data is not backed up. Restore =
  import to domain, then fan out. A bad fan-out is therefore *always* repairable by re-projection.
- **No snapshot tier** (Simon: endless point-in-time issues in the backup world).
- **Retain readers forever; retain writers never.** A 2026 backup does not need 2026's *write* path —
  it needs a 2026 **reader** that upcasts to today's domain object, which then goes through the single
  current write layer. Readers are pure, small and free to keep indefinitely; writers carry logic and
  side effects. Import path: `parse → detect schemaVersion → upcast → single write layer → fan out`.
  This makes "restorable indefinitely" both stronger *and* cheaper than "restorable for a while".
- **Frozen backup-fixture corpus in CI** — one committed fixture per historical schema, each asserted
  to still import to the expected domain object. Without it the long-restore guarantee is a hope.
- **Two version numbers, not one.** `formatVersion` on the envelope (how to open the box: gzip,
  checksum, multi-part, encryption) and `schemaVersion` on the payload (how to read the records). One
  number cannot distinguish "old container, new payload" from the reverse — and the day compression or
  encryption is added, every existing file must still parse. **Land this before either.**
- **Consent at import**, made precise, since an import fans out to all live buckets: *"This backup is
  from schema 3. The oldest schema this deployment still writes is 5. Importing brings it forward to
  5–7; it will no longer open in older builds."* Declining must leave the `.json` byte-identical — no
  half-import, no helpful in-place upgrade.

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
- **Re-identification via backups + the mapping table.** A pre-erasure backup contains
  `abc123 → "Jane Doe"` and the mapping says `abc123 → xyz789`; together they re-identify an anonymized
  record. The usual defence is that backups rotate out — **§18.7's indefinite-restore requirement
  removes it.** A "record of forgotten ids" closes the gap, but needs two properties it does not have
  yet: applied **at import**, not just at erasure (or a restore resurrects the PII), and keyed on the
  stable **`lineageId`** (a per-schema key silently fails to match a backup from another schema).
  Feeds §17.3's unresolved key-location tension.
- **Minimize the suppression list itself** — a retained list of erased people's identifiers is lawful
  (you need it *to honour* the erasure) but should store a salted hash of the id and nothing else.
- **Retention basis is undocumented.** No-deletes + anonymization-only + fan-out is technically fine,
  but GDPR Art. 5(1)(e) wants a *stated* retention period. "Retained indefinitely for aggregate
  analytics" is lawful only if written down; neither [PRIVACY.md](PRIVACY.md) nor §17.3 says it.
  Cheapest item on this list.
- **Taxonomy licensing — checked 2026-07-26, currently clear.** wger's *application* is AGPLv3 but no
  wger code is linked; its *dataset* is CC-BY-SA 4.0 but
  [exerciseStandard.js](src/domain/exerciseStandard.js) vendors ~17 generic category and equipment
  words, far below any threshold. Fees are zero on every axis. **The line not to cross**: bulk-importing
  wger's 1000+ entries would engage both ShareAlike (a licensing split inside an MIT repo, and a
  one-way door for that file) and the **EU *sui generis* database right** (Dir. 96/9/EC), which is
  separate from copyright and needs no originality. SNOMED CT, if ever considered, requires an
  affiliate licence — country status must be checked, not assumed.

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
The properties §18 relies on are all *invariants across releases*, which is what a per-commit gate can
hold and review cannot — none can ever be tested against a real PT's data, because that data is
local-only by design. Asserted, roughly in order of how expensive the failure is: the staging guard
(§18.4), projection round-trips, the old-UI-writes case, the acyclic reference graph (§18.5), the
frozen backup corpus (§18.7), migration edge-case robustness, and ordering invariants (§17.5). Two
places use a hand-authored hostile-input table rather than property-based fuzzing — a deliberate
trade-off in this dependency-light stack, recorded so it is not mistaken for an oversight.

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
      typed client name would land in history, screenshots and shared links. Separately and
      independently of routing: the exercise library silently resets its chip and search box whenever
      `renderExercisesList()` is called with no arguments — a real bug that needs no URL.
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
**Closed 2026-08-05.** The gap was that `activeSession` had no written contract: constructed in two
places, consumed across a dozen modules, written down nowhere — so the only reliable way to obtain a
valid one was to drive the real flow, which is why 68 of 138 e2e tests were the clipboard. The
contract is now `active_session_fixture()` in [tests/medium/_harness.py](tests/medium/_harness.py),
mounting the live clipboard through the controller's own `setActiveSession()`; 26 tests moved to
`tests/medium/`; and the seam is documented as [DATA_MODEL §7](docs/DATA_MODEL.md).

**Two shapes that break naive consumers**, worth keeping: a planning draft carries `isPlanning: true`
and NO `startDate`/`endDate`, and a session opened from history has `sourceSession: null` unless it
was a plan. `buildSessionMeta`'s 2h `endDate` clamp is load-bearing — `recoverActiveSession()`
discards a cache more than 2h past its scheduled end.

## 20b. Backlog sweep — 2026-08-06
Method note, kept so the next sweep starts from evidence: check a signal's **context, not its count**.
Two grep false positives, recorded so they are not re-raised: `expectedVersion` in
[schemaMigrations.js](src/data/schemaMigrations.js) is *schema* validation, not §18.9's
compare-and-swap; and the `walkthrough` hits are i18n strings for a notification button, not §9.5's
engine. A `grep -c` over multiple files emits `file:count`, which mis-scored several items on the
first pass.

**The lesson this sweep exists to prevent recurred anyway**: on 2026-08-08 two more items (§6.3 and
§7.3(3)) were found shipped but unticked. Tick the entry in the commit that closes it.

## 21. [x] `Page.goto` stalls against the local dev server — ROOT-CAUSED AND FIXED
**The cause was the Font Awesome CDN stylesheet (§12.6), vendored 2026-08-05.** `page.goto` waits for
`load`, `load` waits for every stylesheet, and that one was a live internet request made by every test
in every tier: 1948ms median and 35233ms worst case under 8 parallel fresh contexts, with the goto
maximum (35.61s) tracking the CDN maximum (35.23s) almost exactly. Days of chasing the local server,
the listen backlog, CPU and the service worker were looking at things that were never involved,
because the slow request never touched them.

Two later fixes (2026-08-07) took the gate from 5m06s to 1m18s, both harness waits rather than test
cost: `--dist=loadfile` pinned each file to one worker, so a stage could not finish faster than its
heaviest file; and the splash-dismiss pre-tap borrowed the full 20s dismiss budget, so 17 tests sat
in a swallowed timeout at a suspiciously identical ~21.2s.

**What to keep from all of it**, since the measurements were expensive:

- **A tight cluster of near-identical durations is a timeout, not work.** Read `--durations=0` before
  concluding a suite is inherently slow or that tests need moving down a tier.
- **Ruled out by measurement — do not re-derive**: the service worker (disabling registration made it
  *worse*: 38.3s → 52.7s wall; its cache helps once installed, and a `page.route` stub cost 59 failures
  in 702s because interception routes every request through the Node driver); dev-server throughput
  (2791 req/s); the TCP listen backlog (`Recv-Q` sampled at 0 throughout); host CPU (peak 2.4 of 16
  cores); and CPU governor (`power-saver` costs ~21%, worth clearing, but fixes nothing).
- **Run-to-run variance was ~3x and will fool a single measurement.** Two conclusions drawn from
  single runs during this investigation turned out wrong.
- The navigation timeout was raised 30s → 60s while chasing this. With the cause fixed, consider
  reverting it so any future stall fails fast and cheap.

## 22. [x] Two `src` defects found while testing — FIXED
`clientFormsController.js` re-rendered the client list without `navigateToPath` — never threaded in at
all, so every card in a re-rendered grid threw on tap. And `#btn-sync-data`'s handler moved to the
module that owns its markup.

**The general lesson**: a stub that hand-duplicates production wiring will agree with itself and
disagree with the app. Both defects hid behind exactly that. Mount the real `bootXyz` step, or the
test proves only that the test is self-consistent.

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
      and is ranked #5 in Where to start.
- [ ] **No landing page.** [README.md](README.md) is developer-facing (correctly) and the app boots
      empty. A trainer needs one screen: what it is, the recording, "try it now", "add to home screen".
- [ ] **Share only the demo deep-link, never the bare URL.** `?init=demo_data_load&lang=…&theme=…` is
      an unfair advantage no competitor can match — comment to working clipboard in three seconds, no
      email gate. It also papers over the missing onboarding below.
- [ ] **Two headline README features are not shippable.** Google Calendar is unbuilt (§1.5) and the
      Drive OAuth client id is uncreated, so §3.3 works for nobody but the maintainer. Either ship them
      or trim the public pitch to what runs today — promoting either now is promising vapor.
- [ ] **No onboarding for an empty app** (§9.5 unbuilt). A trainer landing on a blank client list
      churns in ten seconds.
- [ ] **No feedback route a non-developer will use.** GitHub issues is a wall to a PT; one email
      address or form, linked in-app. See [docs/BUG_REPORTING.md](docs/BUG_REPORTING.md).

### 23.6 [ ] Campaign plan — kept private, not in this repo
The concrete Slovenia-first campaign (target list, outreach scripts, timing, named institutions and
gyms) lives outside version control at `.private/go-to-market-campaign.md`. It names specific gyms and
contacts, quotes draft outreach copy, and is candid about the reputational risk of promoting a preview
build — none of which belongs in a public repository. What stays public is §23.1–§23.5, which is
useful to any contributor and names nobody. When acting on the campaign, read the private file; when
changing the *strategy*, update both so they do not drift.

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
  were deliberately narrowed on exactly this test (§24.4b/§24.4c): the focus↔URL sync, the
  schedule-adjust apply and the session wiring all stayed in the controller, because each is
  orchestration whose every dependency is already there. Moving them would have been motion.
- **Three defects surfaced that the audit did not predict**, each invisible to review and none what
  the stage set out to change: a fabricated session end date that proposed a seven-hour-forty
  reschedule, a focus reference the timer spelled wrong for standalone rests, and a "mark all read"
  that rebuilt the notification id list by hand and so could not mark a kind it did not know about.
  That is the argument for extracting pure logic even from a file that "works fine".
- **A suite that passes all afternoon is not the same as a suite that passes.** The end-date bug was
  invisible because the demo seed clamps its hours to 03..17, so e2e only caught it after 18:00.
  Time-of-day-dependent coverage belongs in `unit_js/`, where the clock is an argument.

### 24.1 [x] Stage 1 — one theme system, not two — shipped 2026-08-07
The header carried a verbatim copy of all five theme constants plus its own `resolveTheme`/
`applyTheme`, and they had diverged: the controller assigned `documentElement.className`, the copy
touched `body` only, so after any switcher change the root kept the boot theme's class. Now one
service at `modules/common/theme.js` updating both via `classList` (never `className` — the root and
body are shared surfaces). `src/theme-boot.js` keeps its own small copy deliberately: it must stay
import-free to run before first paint.

### 24.2 [x] Stage 2 — two `formatDuration`, two `escapeHTML` — shipped 2026-08-07
The two durations were **not** merged: the padding difference is deliberate (one drives a live
countdown that must not change width as it ticks), so one became `formatCompactDuration` and both name
the other in a comment. The duplicate `escapeHTML` was security-relevant —
`build/frontend_audit.py` recognises the *name*, so a local copy passes the audit while being free to
drift. `utils.escapeHTML` had **no test at all**, which is how the drift went unseen; pinning it also
fixed `escapeHTML(0)` returning `""`.

### 24.3 [x] Stage 3 — the board render leaves `controllers/` — shipped 2026-08-07
~250 lines of view rendering moved to `modules/clipboard/activeSessionBoard.js`, wired by injection
only. Also enabled `correctness/noUndeclaredVariables` in `biome.json` — not in Biome's recommended
set, but this is a buildless app with no compiler between source and browser, so an undeclared
identifier is always a bug and nothing else catches it before a browser does. It earned its place on
this very stage: a 32ms Stage 1 failure naming the line, instead of a 38s browser run.

### 24.4 [x] Stage 4 — split the rest of `activeSessionController.js` — shipped 2026-08-07
`domain/sessionPlanFactory.js`, `domain/quickSignals.js`, `domain/sessionFocus.js` and
`domain/sessionHistoryRecord.js`, with unit tests previously unreachable without a booted browser.
Three rules worth keeping:

- **The quick-signal DECISIONS are pure** (what counts as a disposable one-tap signal, which tags
  supersede each other, the severity order behind a card's colour) **while the MUTATION is not**, so
  the controller keeps thin wrappers rather than the whole thing moving.
- **`focusRefForItem`/`focusIndexFromRef` belong together because they are a ROUND TRIP.**
  Consolidating them fixed a defect by construction: the ref was built in three places and one
  disagreed, spelling a standalone rest as `{type: "exercise"}`, which the reader refuses to resolve —
  so tapping a rest's timer card landed on the session without focusing it.
- **The history record was built in two places** — once on completion, once on every cache sync while
  a planning draft is authored — agreeing only by hand, on a path that runs on every keystroke.

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

- **`domain/circuitGrouping.js` — shipped 2026-08-07** with 10 unit tests. A circuit is not a container
  in the data: its members are ordinary items in the same flat array sharing a `circuitId`, which
  keeps reorder/insert/delete as plain array operations but makes the grouping an invariant somebody
  MAINTAINS rather than one the structure enforces. Three rules now pinned — members contiguous, one
  shared title/round count per circuit (from its first EXERCISE, not a leading rest), and set counts
  plus the live round counter tracking the series. Every way of breaking them yields a plan that still
  looks plausible.
- [ ] **`clipboardEditorMarkup.js`** — pure `(item, ctx) → HTML` row/circuit/insert-bar builders.
- [ ] **`listReorder.js`** — a generic tap-nudge/drag reorder engine, not editor-specific.

### 24.6 [x] Stage 6 — `src/domain/`, a layer for what is neither storage nor UI — shipped 2026-08-07
A DOM-reference count split `modules/common/` cleanly: ten modules with **zero** DOM references, the
rest with 5–35 — so a directory documented as "shared UI helpers" was holding half the domain rules.
`src/domain/` is now ranked in `import_layers.py` between `data/` and `modules/common/`.

**The line to hold when adding to either**: **`data/` is records at rest** (shape, identity, ordering,
persistence); **`domain/` is the training vocabulary** (what a modality is, how reps and load are
authored, what a session's clock means) — pure, no DOM, no storage. Three modules went to `data/` and
not `domain/` on that test, and the layering itself decided the last one: `position` is a stored
FIELD, `sessionCache.js` needs the logic keeping it well-formed, and a `data/` module may not import
upward.

### 24.7 [~] Stage 7 — three more multi-responsibility modules
- [ ] **`applicationHeader.js` (512)** → header shell + menu (~250) once `renderSyncBadge` moves beside
      `driveSyncUi.js` and the about/terms dialogs move to `legalDialogs.js`.
- **`editSessionControl.js` — commit half shipped 2026-08-07.** `domain/sessionRecord.js` owns what the
  form PRODUCES. It had no test at all — reachable only by filling in a real form in a real browser.
  Two rules now pinned that would cost a trainer data: the upsert **MERGES** (a stored session carries
  `completed`/`duration` this form never edits, so a wholesale replace would silently un-complete a
  session by editing its title), and invites go only to **newly** assigned participants. The complexity
  gate fired here and was fixed at source per AGENT_RULES, not allowlisted.
  **Still open**: the draft-persistence and form-population halves.
- **`notificationArea.js` — derivation half shipped 2026-08-07** (`domain/notificationItems.js`,
  498 → 405). Extracting it removed a THIRD copy of the item-id list: "mark all read" rebuilt the ids
  by hand, so an item kind added to the feed would have rendered but never been markable.
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
  [agent_tools/module_headers.py](agent_tools/module_headers.py). The sweep found **28** stale
  self-claims, not the 14 the audit spotted by eye. The rule is deliberately narrower than "every
  module states its path": a header that OPENS with a path is making a claim and must be right; one
  that opens with prose is making no claim and is left alone; and a path *after* the first token is a
  reference to a NEIGHBOUR, never a self-claim, so it is never "fixed". Too strict and it nags about
  good headers, too loose and it rewrites references to other files. It needed a tool because moving a
  file is both what invalidates line 1 and the exact moment nobody thinks to look at line 1 — this
  reorganisation alone moved 11 modules.

**Not a problem, deliberately left alone**: `src/index.css` (773) is a genuine design system;
`src/data/exercises.js` and the i18n dictionaries are flat data. Size alone is not a defect.
