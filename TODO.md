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

## 1. Scheduling & Bookings

### 1.1 [ ] PT-side client assignment to a session
The session card on the home dashboard must let the **PT assign clients to a session directly**, not only rely on client self-subscription via the Google-hosted booking page.

- Assignment happens from the session card on the dashboard.
- Assigned clients are **notified by a calendar invite email**, when an email address exists for them in the database.
- Complements, does not replace, the existing self-subscription flow ([uc4_client_self_subscription.md](use_cases/uc4_client_self_subscription.md)).
- **Open**: clients with no email on record — assign silently, or prompt for an address?

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
- Implies a **room/resource** dimension on bookings (which room, which trainer) that the data model does not have yet, and a scheduling/availability source for other PTs' bookings (shared calendar or backend).
- Feeds directly into the planned **date-grouped, scrollable session card stack** ([4.3](#43--collapse-the-duplicated-session-header-into-one-row-with-a-date-picker) and the sessions-view redesign): overlaps and shaded external sessions must be legible within that stacked layout.

---

## 3. Data Sync

### 3.3 [ ] [Brainstorm] Google Drive periodic sync
Data should sync **periodically to Google Drive** and remain **editable directly in the Google Drive view**.

- **Open question**: does it make sense to store the data in **Google's new OKF format**, using it to get concurrent editing and versioning for free?
- No approach is chosen yet — decide in a dedicated brainstorm before implementing.

### 3.5 [ ] Paper consent — record checkbox + date; provide a printable blank form
**Decided (2026-07-22): KISS — consent lives on paper, not in the app.** Blank consent forms are kept at the gym; the client signs one, the PT **files the paper**. That physical file is the system of record for evidence. **No photo capture, no image storage, no email flow, no IMAP** — all considered and dropped as needless complexity for a solo, offline-first PT.

- App's only job: the existing `gdprConsent.cloudSync` checkbox plus an editable **consent date** (defaults to today — the paper may have been signed earlier), recording that signed paper consent was obtained and filed. Replaces relying on the invisible `timestamp` alone.
- Optionally surface a **printable blank consent form** from the app — the full text already exists in `docs/templates/Client_Consent_Form.md` — so a PT can print copies to keep at the desk.
- **Supersedes the shipped `mailto:` consent trigger** (former 3.4); that email path can be removed once this lands.

### 3.7 [ ] [Decision] Persistence engine — stay on localStorage JSON, defer embedding a DB
The consent-photo idea was the only thing pushing toward binary blob storage; KISS-ing consent to paper (3.5) removes it, so the "is it time to embed a DB?" question resolves for now.

- **Decided (2026-07-22): keep the current `localStorage` JSON store.** It's synchronous, trivial to export/import (already the Backup & Restore mechanism), and a solo PT's *text* data (clients, routines, sessions, history) is nowhere near the ~5MB origin cap. The main DB is already centralized in `src/data/stateStore.js` (`librept_db`).
- **Revisit → IndexedDB** (built-in, no wasm/SQLite dependency) only when a real driver appears: binary data returns, the 5MB cap looms, or the long-term analytics vision (13.x — volume load / 1RM aggregation across months) wants indexed queries. Per-version storage isolation (16.2) also nudges this way eventually.
- **Not** SQLite-in-wasm — too heavy a dependency for a buildless offline app at this scale.
- **Cheap prep now**: keep the main DB behind the `stateStore.js` seam so a future swap is localized, rather than scattering more raw `localStorage` calls across components.

---

## 4. UI / UX

### 4.1 [ ] Theme redesign
- **Light mode** needs a nicer design, along the lines of: <https://claude.ai/code/artifact/f27dc4ca-e1b4-47dd-b3c6-34dee3d6110c>
- **Dark theme** should be improved in the same pass.
- Constraint: both themes must keep working from the CSS custom properties in `index.css` — no hard-coded theme colours.

### 4.3 [ ] Collapse the duplicated session header into one row, with a date picker
The redundant second title row is **already removed** (the four `.sessions-column-header` `<h4>`s were deleted); the day column now starts directly at the first session card. What remains open is the **date-picker** half below, blocked on the dated-bookings data-model decision.

- In the remaining title row, make the **calendar icon clickable**, opening an overlay with a **date picker**.
- The picker **must accept a typed date** — no scrolling back through years to reach a past date.
- Note: the removed header is what colour-coded each bucket (purple/cyan/muted/emerald). If that signal is worth keeping, it has to move into the title bar.

> **⚠ Blocking design gap — settle before implementing.** Bookings currently have **no date**. They carry a relative bucket only (`day: 'yesterday' | 'today' | 'tomorrow' | 'upcoming'`, see `mockData.js`), and the title bar *derives* dates live from `new Date()`. That is exactly why the demo keeps working on any day without reseeding. A date picker implies **jumping to an arbitrary date**, which the four-bucket model cannot represent — picking `2025-03-04` would have nothing to show. Choosing a real date field is a **data-model migration** (existing `localStorage` databases included) and it would end the self-following demo behaviour. Decide the model first: real dates, or a picker restricted to the four buckets?

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

---

## 8. Clipboard Interactions

### 8.1 [ ] Bind multiple clients to one shared set of exercises
Allow **two or more participants to be bound to the same set of exercises**, merging their tabs into a **single combined view** in the clipboard (they train the identical programme in lockstep, so the trainer logs the shared plan once instead of switching tabs per person).

- The **exercise cards are shared** across the bound clients; navigating/logging the plan advances it for the whole group.
- **Feedback stays per-person**: `Too Easy` / `Too Hard` / voice notes must still record against the **individual** client, not the group — one client can find a shared set too hard while another finds it too easy.
- Decide the data model: a per-client `clientRoutines[clientId]` today owns its own `exercises` + `logs`. Binding needs either a shared exercise reference with per-client log/feedback overlays, or a "group" pseudo-participant that fans feedback back out to members.
- Interacts with the merged-session view ([1.2](#12--simultaneous-sessions-merged-into-one-clipboard-multi-line-titles--per-participant-tags)) and the horizontal participant tabs — a bound group should read as one tab, expandable to its members.

### 8.3 [ ] Inline Clipboard Editor (Saved Patch: `patches/inline_clipboard_editor.patch`)
An on-the-fly edit mode for the active session clipboard (`src/components/clipboardEditor.js`), saved as an unstaged patch (`patches/inline_clipboard_editor.patch`) so it can be cleanly reviewed/applied after core refactoring passes.
- When the trainer taps a card's edit (✎) affordance (`.deck-card-edit`), the deck flips into an inline editable list (`renderClipboardEditor`).
- Allows swapping exercises, retargeting sets/reps/weight, reordering rows via tap or drag (`.editor-reorder`), adding new exercises, and adjusting rest breaks directly inside the live session without leaving the gym floor.
- To apply later: `git apply patches/inline_clipboard_editor.patch`.

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

- **Done**: `tests/e2e/` suites for themes, the Sync & Backup badge + modal, the ☰ header menu, the first-run terms agreement, the plan-adjustments deck + Apply wizard, and the Client Directory grid + live search.
- **Still open**: the demo walkthrough (9.x) isn't built yet, so it has no tests; and a couple of components (e.g. voice-note capture inside the clipboard) are still only exercised by the legacy `tests/test_browser.py` rather than a focused `tests/e2e/` suite.

### 12.5 [ ] Local git housekeeping (trademark refs)
The trademark was scrubbed from history and force-pushed (remote is clean). Still pending **locally**: expire the reflog and `git gc --prune=now` the old pre-rewrite objects (`refs/original/…` and any leftover backup branch) so the old blobs are purged from the local clone.

- **Status**: no `refs/original/…` refs and no leftover backup branch remain (only `main` / `origin/main`); the old blobs survive only via reflog entries. The purge is a single command the maintainer should run manually — it was blocked when attempted from the agent because reflog expiry is irreversible:

  ```bash
  git reflog expire --expire=now --all && git gc --prune=now
  ```

---

## 13. Exercise Library & Movement Taxonomy (Call to Action & Vision)

> **Status (2026-07-22):** the taxonomy pivot and all three §13.2 selection scenarios are **built** and
> covered by [UC6](use_cases/uc6_exercise_taxonomy_and_picker.md) / `tests/e2e/test_exercise_taxonomy.py`
> + `tests/e2e/test_reps_and_load.py` (shipped, see CHANGELOG). Exercises carry `equipment` + `pattern`;
> the catalog shows taxonomy badges (no instructions); the filtered picker powers routine building and
> gym-floor swaps; custom creation enforces muscle group + equipment + pattern; reps/load are polymorphic.
> **Still open:** seeding/mapping from an open standard (wger / ExRx) for interchangeable exports (§13.1
> last bullet), and the conditioning-metric model (§13.3).

### 13.1 [~] [Brainstorm / Call to Action] Repurpose `exercisesView` from "Beginner Encyclopedia" to "Professional Movement Taxonomy"
**The Core Insight:** A certified, professional Personal Trainer (`LibrePT`) knows all exercises by heart. They do not need lengthy `"instructions"` paragraphs, beginner descriptions, or how-to tutorials on their screen, nor do they ever hand their working device over to a client mid-session.
- **Call to Action**: Remove/deprecate bulky instructional text blocks from `exercisesView.js` (`ex.instructions`) and exercise cards. The UI must pivot from an "encyclopedia for gym beginners" into a **high-density, professional movement taxonomy inspector and fast-selection tool**. *(Done — the picker/taxonomy pivot shipped; see status note above.)*
- **The True Purpose (Referential Integrity)**: The Exercise Catalog exists in software to provide immutable IDs (`exerciseId`), equipment tags (`Barbell`, `Cable`, `Dumbbell`, `Bodyweight`), and anatomical/biomechanical categories (`Primary/Secondary Muscle Groups`, `Horizontal Push/Pull`, `Hip Hinge`). Without strict taxonomy, aggregating long-term volume load or plotting estimated 1RM curves across months of client history is impossible.
- **Adopt Open Standards** *(still open)*: Map or seed the base catalog from an established, open-source sports science taxonomy (e.g., **wger Workout Manager API / dataset** or **ExRx** classifications) to guarantee that LibrePT exports (`.json`/`.csv`) are universally interchangeable with external research, performance tracking, and coaching tools.

### 13.3 [ ] Conditioning metrics: extend the reps/load model beyond sets × reps × kg
Some movements are not `sets × reps × load`. A **conditioning/cardio machine** (assault bike, rower, ski-erg) is **time-bound** (go for 60s), **calorie-bound** (20 cal), or **power-bound** (hold 200 W) — often a mix. Today [helper/repsAndLoad.js](src/helper/repsAndLoad.js) already makes reps polymorphic (count / range / `30s` time / `max`) and load equipment-derived (kg / level / band / bw), so the seam exists. Extend it with a **metric type** per exercise (derived from equipment/pattern, e.g. `Cardio` → target is `time | calories | watts | distance`) so the focus card and the plan editor author and log the right unit, and the **exercise timer** (see the clipboard timer stack in [exerciseAndRestTimer.js](src/components/exerciseAndRestTimer.js) / UC1) can be the primary logging surface for time-bound work. Keep the raw authored value stored and derive meaning at render time, as reps/load already do. Relates to UC6 and the timer stack.

---

## 14. Refactoring: DRY & Complexity Reduction

### 14.5 [ ] Split the monolithic shared files to avoid same-file co-edit conflicts
- **Motivation:** two features touched in parallel (the active-session *plan editor* and the *home/notification-area* redesign) repeatedly collided in the same few god-files, forcing manual hunk-by-hunk staging to keep unrelated work apart. Good modularization should make concurrent feature work conflict-free by default.
- **Worst offenders (single files every feature edits):**
  - `src/index.css` — one giant stylesheet; every component appends here. Split into per-component CSS (co-located or `src/styles/<component>.css`) and load/concatenate at build time, so editing the plan editor never touches the same file as the notification area.
  - `src/index.html` — one document holding every view, overlay, dialog, and the floating timer. Extract per-view/overlay/dialog HTML partials (or render them from JS) so structural edits localize.
  - `src/i18n/en.js` & `src/i18n/sl.js` — flat single-object dictionaries; every string lands in the same file. Consider per-feature namespaced string modules merged into the locale (keeping `test_i18n_parity` green).
- **Guardrail:** the modular-file rule already exists for JS (AGENT_RULES §5); extend the same "one responsibility per file, edit-in-parallel-without-collision" principle to CSS, HTML, and i18n.

---

## 16. Zero-Downtime Deploys & PT-Controlled Version Switching

### 16.1 [ ] [Brainstorm] Zero-downtime re-deploys with PT-controlled upgrade timing and rollback
Feature request by Simon. A deploy/upgrade must never force-interrupt a PT mid-session, and a PT must be able to defer, accept, or reverse an upgrade on their own schedule:

- **Zero-downtime re-deploys**: publishing a new build must not disrupt whoever is currently mid-session on the old one.
- **Routing config is separate from app loading and data migrations**: which build/version a client is currently running, and how it resolves its own routes, must be decoupled from (a) the app-shell loading process and (b) any data-migration step a new version's schema requires — these are three distinct concerns today conflated into one PWA update flow (`src/sw.js`'s cache-bump-on-deploy).
- **Opt-in upgrade timing**: when a new version is available, the PT sees a **non-dismissable** message in the message/notification area (`components/notificationArea.js`) inviting them to switch — but the switch itself is **their choice of moment**, not forced on next load, bounded by a **supportability EOL deadline** (the old version isn't kept alive forever).
- **Rollback anytime (within terms)**: a PT can switch back to the previous version **at any time**, also via a **non-dismissable** message in the message area — but doing so **after** the initial upgrade moment carries a **data-loss warning** (changes made under the newer version's schema/format may not round-trip cleanly back to the old one).
- **No fixes ever land on a "maintenance mode" (old) version** — once superseded, an old version is kept *available* (for rollback, until its EOL) but never *patched*. All fix/feature work happens forward-only on the current version.

**Open question, Simon's own framing — not yet decided:** this implies keeping **multiple versions of the app simultaneously deployable**, which is a "huge toll" on this repo's workflow. Do we solve that via:
  - **git tags** per released version (deploy workflow parameterized to build/publish a specific tag on demand),
  - **long-lived branches** (one per supported version), or
  - **duplicated code** (each supported version literally vendored as its own copy under the deploy target)?

  Each has very different implications for this repo's trunk-based, single-`main`, no-feature-branches workflow (`AGENT_RULES.md`) — this needs a real design pass before any implementation starts. Also unresolved: where multiple simultaneously-live versions actually get *hosted* (GitHub Pages currently serves one `dist/` per push to `main`; serving N versions at once is a deploy-infrastructure question in its own right, separate from the git-history question above).

### 16.2 [ ] [Brainstorm] Multi-version hosting, preview/beta channel, and per-version storage isolation
Continued brainstorm on 16.1's "keep multiple versions deployable" question. Leaning **git tags** (not branches, not duplicated code) — tag `main` at each release, zero change to the existing trunk-based workflow, "which commit is version N" becomes a lookup rather than a maintained fork. The rest of this item is the shape that unlocks, still all open/undecided:

- **Versioned subpath hosting**: serve tagged versions side-by-side under the same GitHub Pages origin as subpaths (`/v1.2.0/`, `/v1.3.0/`, …), with a stable path resolving to whichever version a given PT has opted into as "current." Low-friction because the app already derives its base path dynamically at runtime (`BASE_PATH` from `import.meta.url` in `app.js`) for the GH-Pages-subpath deploy — extending that to "one more path segment per version" is incremental, not new infrastructure. Still open: does GitHub Pages alone support publishing N version folders from one workflow run, or does this need real deploy-pipeline work.
- **`/preview/` stable path**, always resolving to the newest built tag regardless of what any individual PT has opted into. Two tiers:
  - **Anonymous preview** (no opt-in): read-only, demo/seeded data only — never the PT's real `librept_db`, so "just looking" carries none of the upgrade/rollback data risk.
  - **Beta opt-in** (explicit per-PT consent): runs the PT's *real* data against the not-yet-general-release build, early and voluntarily. Surfaced as its own **dismissable** "join the beta" invite in the message area, distinct from 16.1's mandatory (non-dismissable) upgrade-available / switch-back-anytime messages.
  - **Beta data lifecycle — settled**: every time the beta build changes, beta storage is **dropped and re-migrated fresh** from the PT's real stable ("current") data — no state carried between beta iterations. Any progress made only inside a beta session is understood as disposable the moment the next beta build lands; simpler to reason about (and to warn a PT about) than trying to carry forward partial beta state across builds.
- **Per-version storage isolation**: `localStorage` is scoped per **origin**, not per **path** — so without extra work, every version hosted under a subpath of the same origin would silently share one storage bucket. Needs explicit namespacing per version (e.g. `librept_db@v1.2.0`), with:
  - **Migration = an explicit one-time copy** from the old version's namespaced key into the new version's key at the moment a PT accepts an upgrade (or opts into beta) — this *is* the "data migration" step 16.1 already calls out as separate from the routing switch and the app-load step.
  - **The data-loss-on-rollback warning, made concrete**: after that copy, new writes only land in the new version's key. Rolling back means reverting to the old key's snapshot *as of the migration moment* — anything written since is on the new version's key only, and is what the warning is actually about.
  - **Per-version discard**: once a version passes its EOL, its namespaced key can simply be deleted without touching any other still-supported version's data — this is the mechanism, not just a policy statement.
- **Whole-app PREVIEW-STATE UI signal**: while running in `/preview/` (either tier), the app should be **unmistakably** marked as such, so there is no ambiguity about which build a PT (or a screenshot/bug report) is looking at. **Decided**: a warning **ribbon overlaying the header near the logo**, not a full logo replacement — keeps the brand/trust cue intact (matters most exactly when a PT is trusting a beta build with real data) while still being impossible to miss. **Shipped (2026-07-22, standalone):** a basic always-on amber `PREVIEW` pill sits by the logo (`#preview-ribbon`, i18n `preview_ribbon`), theme-independent, pulsing gently only under `prefers-reduced-motion: no-preference`, and the build stamp hides on phones so the header can't overflow — decoupled from the multi-version machinery so the pre-release cue is up now. Still open: whether anonymous preview and beta-opt-in get visually distinct ribbon treatments (beta is running real data on unstable code, arguably deserves a stronger warning color than read-only anonymous preview), the ribbon's animation must respect `prefers-reduced-motion` (steady/pulsing instead of flashing), and whether it also needs a non-visual signal for support/debugging (`renderBuildStamp()` in `app.js` already shows the commit SHA, may be enough).
- **Migration chains, not single jumps**: a PT can sit on one version for a long time while several ship, so upgrading must walk a sequence of small per-version transforms (`v1.0→v1.1→v1.2→…`) from the PT's stored `schemaVersion` to the target, not one big direct conversion — standard, well-trodden shape (each version defines a pure `(oldShape) => newShape` step).
- **Migration runs speculatively in the background**, before the PT ever clicks "switch" — since migration is already "copy old namespaced key → new namespaced key," that copy can happen the moment a new version becomes available, so the actual switch feels instant. Open: if the PT keeps changing their current-version data after that background copy ran, the precomputed snapshot goes stale — leaning toward just redoing the copy at the moment of switch (this is one trainer's local data, not a scale problem) rather than building incremental catch-up, but not decided.
- **Testing migrations without ever seeing real PT data** (a direct cost of the privacy-first, local-only design working as intended): no single fix, several mitigations stacked —
  - **The namespacing already bounds the blast radius for free**: migration *copies*, never mutates the old key in place, so a buggy migration corrupts only the new version's snapshot — the PT's real working data on their current version is never at risk. Worth stating as the actual answer to "what's the worst case," not just a hope.
  - Every migration step **validates its output shape** before being considered successful, rather than trusting the transform; an unrecognized shape fails loud instead of silently corrupting.
  - **Fuzz migrations against synthetic edge-case data in CI**, generated from the existing seed/demo data machinery (`src/data/*.js`) — not a substitute for real-world coverage, but cheap and fits this repo's existing test conventions.
  - **Show the PT a migration summary before they commit** to switching ("7 clients migrated, 1 routine had an unrecognized field and was dropped") so problems are visible and reportable instead of silent.

---

## 17. Structured session/program history (`sessionItemRecord`)

> **⏳ Implementation scheduled for Claude on Fri 2026-07-24, 10:00** (when the subscription resets — this is a larger, cross-cutting change deliberately held for a complex-task budget, per the multi-model cost strategy). Design below is **decided**; it's a build task, not a brainstorm.

### 17.1 [ ] Persist the whole structured program into history, via a generic typed item record
Today a finished session flattens to performed exercises + sets only ([activeSessionController.js](src/controllers/activeSessionController.js) `finishWorkoutSession`), **dropping** rest, superset/circuit grouping, and prescribed-but-skipped exercises. Re-opening a past session therefore loses supersets/rests, and a past session can't seed a faithful template. Fix: store the **whole program** as an immutable snapshot.

- **Generic `sessionItemRecord` with a `type` discriminator** — `exercise | rest | superset`:
  - `superset` is a **container** holding child items (renders/reuses as a unit), not a flag spread across sibling items.
  - `rest` stays a **first-class item type**, but is **not** an exercise (never in `state.exercises`, never focusable/loggable).
  - **Replace the scattered `isRestItem` boolean** with `type` dispatch — ideally one `renderItem(item)` / handler switch rather than predicate checks sprinkled across ~15 call sites. (Resolves the "leaky `isRestItem`" concern.)
- **Two orthogonal axes — don't conflate:** structural `type` (above) vs. an **exercise modality** field — `strength | cardio | stretch | hiit | balance` — that decides *how you log* (reps×load vs time/distance/cal/watts vs hold-time vs rounds). The modality axis **subsumes [13.3](#133--conditioning-metrics-extend-the-repsload-model-beyond-sets--reps--kg)**: add the field cheaply now (default `strength`); each modality's logging surface is the real work, built incrementally.
- **Skipped exercises are kept**, marked `completed: false`, and **rendered greyed** — a deliberate review signal (what the client didn't get to) that feeds plan adjustments (uc2). Analytics must honour the flag so skipped work isn't counted as volume.
- **Immutable snapshot (option a — inline copy).** History embeds a frozen copy of the program, *not* a reference to a live editable routine (editing/deleting a routine must never rewrite the past). A versioned/deduped program store (option b) is deferred — it's 16.2's versioning applied to programs, only worth it if storage bites and programs repeat heavily.
- **Readers to update** (the sweep): only **3** iterate `.exercises` — [historyView.js](src/views/historyView.js), [clientsView.js](src/views/clientsView.js), [exerciseDeck.js](src/components/exerciseDeck.js) (last-performance reference); plus the writer + `openSessionFromHistory` re-open + `backupRestore` round-trip. Each must become rest-aware and completed-aware. **Additive/back-compatible**: old flat rows (and `DEFAULT_HISTORY` seed) stay valid behind a shape guard.
- **Storage note**: an inline program per row makes history the fastest-growing collection → ties to [3.7](#37--decision-persistence-engine--stay-on-localstorage-json-defer-embedding-a-db). The binding wall is the **localStorage ~5MB disk quota** (`JSON.stringify(state)` on every save), *not* RAM; IndexedDB (bigger ceiling + **lazy per-client load**) is the eventual fix, not needed pre-release.

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

- Extraction **strips all person/day-specific magnitudes** — `weight`, `watts`, time/`duration`, distance/calories — keeping the **prescription structure**: exercise, set count, `reps`/target-reps, `rest`, superset grouping. (Rep counts are a reasonable reused default; loads are not.)
- Pairs with the inline clipboard editor ([8.3](#83--inline-clipboard-editor-saved-patch-patchesinline_clipboard_editorpatch)) and "next session prep" ([5.1](#51--tabbed-client-view) Tab 3).
