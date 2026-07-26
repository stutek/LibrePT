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
> **Superseded 2026-07-26 by [§18.6](#186--decided-persistence-engine--indexeddb-supersedes-the-37-deferral).** The revisit trigger this item names ("the 5 MB cap looms") has fired: §17.1 shipped, and a very busy PT reaches ~16.6 MiB/yr in a single bucket. The engine decision is now IndexedDB; the reasoning and sizing live in §18.6. The "keep the DB behind the `stateStore.js` seam" prep below stands and is what makes the swap cheap.

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

### 4.4 [x] Exercise catalog filter chips overflow off-screen — **SHIPPED 2026-07-25**
The catalog's `.filter-chips` row used `overflow-x` with a hidden scrollbar, so trailing chips were pushed off-screen unreachably on a phone. Fixed by making the row `flex-wrap` (consistent with `.picker-chips`), so every filter stays visible.

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

### 8.4 [x] Hide "Complete Workout Session" while editing the session plan — **SHIPPED 2026-07-25**
The clipboard's finish bar (`.session-actions-footer`, holding `#btn-finish-session`) is hidden whenever **edit-plan mode** is active (`clipboardEditMode` / the `/edit` route) or the session is a **planning-mode** (`isPlanning`) programme — completing logs an execution to history, which is meaningless mid-edit and wrong for a programme that was never run. The whole footer hides (not just the button) so no empty action bar is left behind, and it returns on exit from edit mode because every mode change re-renders through `renderActiveGroupBoard`. Covered by `test_edit_mode_hides_complete.py`.

### 8.5 [x] Catalog picker button in the plan edit view — **SHIPPED 2026-07-25**
The inline clipboard editor (`clipboardEditor.js`) gained an **"Add from catalog"** button that opens the reusable filtered taxonomy picker (`mountExercisePicker`) in `#dialog-catalog-picker`; tapping a movement injects it into the active plan (fresh slot id + taxonomy fields, defaults 3×10, adjustable inline) via the shared `injectExerciseIntoActivePlan` helper and returns to the editor. Covered by `test_catalog_picker_in_edit.py`.

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

### 12.6 [ ] Vendor Font Awesome locally — the last CDN dependency
Every other external origin is now vendored (webfonts landed 2026-07-25); **Font Awesome on cdnjs is
the only one left**, and it contradicts offline-first: the icon font is fetched cross-origin on first
load, needs its own CSP allowance, and is cached only best-effort by the service worker (it is
deliberately excluded from the atomic, integrity-verified shell precache, since a blocked
cross-origin fetch must not fail the whole install).

- Vendoring it would let `style-src`/`font-src` drop the cdnjs origin entirely, and fold the icons
  into the integrity-verified shell like the webfonts already are.
- **Watch the size**: ship a *subset* of the glyphs actually used, not the full 6.4.0 set — the
  reason it was left on a CDN in the first place.
- Recurring source of CSP / SRI / COEP friction in the build gate.

### 12.7 [ ] [Observation, low priority] ~89 separate module requests on first load
The buildless native-ES-module design means a cold visit fetches ~89 files. In production this is
fine — GitHub Pages multiplexes over HTTP/2 and the service worker precaches everything after the
first visit, so it costs one visit, once. Recording it because it is the amplifier that turned a
40ms-per-request dev-server stall into a 3.8-second page load (fixed 2026-07-25, dev server only).

- Only worth acting on if first-load time on a poor mobile connection ever becomes a real complaint.
- Any fix (bundling) trades away the buildless property, which is a deliberate architectural choice —
  so the bar for changing it is high.

---

## 13. Exercise Library & Movement Taxonomy (Call to Action & Vision)

> **Status (2026-07-24):** the taxonomy pivot and all three §13.2 selection scenarios are **built** and
> covered by [UC6](use_cases/uc6_exercise_taxonomy_and_picker.md) / `tests/e2e/test_exercise_taxonomy.py`
> + `tests/e2e/test_reps_and_load.py` (shipped, see CHANGELOG). Exercises carry `equipment` + `pattern`;
> the catalog shows taxonomy badges (no instructions); the filtered picker powers routine building and
> gym-floor swaps; custom creation enforces muscle group + equipment + pattern; reps/load are polymorphic.
> **§13.3 (conditioning/modality) shipped 2026-07-24** — see the modality note below and CHANGELOG.
> **§13.1 open-standard crosswalk shipped 2026-07-25** — the catalog maps onto the wger dataset for
> interchangeable JSON/CSV exports; see the §13.1 note below and CHANGELOG. Section 13 is now complete.

### 13.1 [x] [Brainstorm / Call to Action] Repurpose `exercisesView` from "Beginner Encyclopedia" to "Professional Movement Taxonomy"
**The Core Insight:** A certified, professional Personal Trainer (`LibrePT`) knows all exercises by heart. They do not need lengthy `"instructions"` paragraphs, beginner descriptions, or how-to tutorials on their screen, nor do they ever hand their working device over to a client mid-session.
- **Call to Action**: Remove/deprecate bulky instructional text blocks from `exercisesView.js` (`ex.instructions`) and exercise cards. The UI must pivot from an "encyclopedia for gym beginners" into a **high-density, professional movement taxonomy inspector and fast-selection tool**. *(Done — the picker/taxonomy pivot shipped; see status note above.)*
- **The True Purpose (Referential Integrity)**: The Exercise Catalog exists in software to provide immutable IDs (`exerciseId`), equipment tags (`Barbell`, `Cable`, `Dumbbell`, `Bodyweight`), and anatomical/biomechanical categories (`Primary/Secondary Muscle Groups`, `Horizontal Push/Pull`, `Hip Hinge`). Without strict taxonomy, aggregating long-term volume load or plotting estimated 1RM curves across months of client history is impossible.
- **Adopt Open Standards** *(shipped 2026-07-25)*: The catalog maps onto the **wger Workout Manager** open dataset (chosen over proprietary ExRx) by canonical category/equipment **name** — the only interchange key that survives across installs, since wger's numeric PKs are per-instance. `category` → wger `ExerciseCategory` (`Core`→`Abs`), `equipment` → wger `Equipment` (bodyweight → `none (bodyweight exercise)`); LibrePT's superset axes (`pattern`, `modality`, `metric`) are preserved under an `x_librept` extension, and terms the standard lacks (Cardio/Recovery categories, Cable/Machine equipment) map to an explicit **null** rather than a wrong best-fit. The Sync & Backup dialog exports the live catalog as a self-describing interchange **JSON** envelope and a side-by-side crosswalk **CSV** ([exerciseStandard.js](src/modules/common/exerciseStandard.js), [UC6 §6](use_cases/uc6_exercise_taxonomy_and_picker.md), covered by `tests/e2e/test_exercise_standard.py`).

### 13.3 [x] Conditioning metrics: extend the reps/load model beyond sets × reps × kg — **SHIPPED 2026-07-24**
Graduated to [CHANGELOG](CHANGELOG.md) / [UC6 §5](use_cases/uc6_exercise_taxonomy_and_picker.md). Built as the **modality** axis ([exerciseModality.js](src/modules/common/exerciseModality.js)): cardio targets are `time | distance | calories | watts`, stretch/balance are hold-time, strength stays sets × reps × load. The raw value is stored and its meaning derived at render (as reps/load already do), the focus timer seeds the target duration for time-bound work, and modality is authored in custom-create + the inline editor. Subsumed under §17.1's modality field — see the modality note there for what remains (routine-builder metric authoring polish, `hiit`).

---

## 14. Refactoring: DRY & Complexity Reduction

### 14.5 [ ] Split the monolithic shared files to avoid same-file co-edit conflicts
- **Motivation:** two features touched in parallel (the active-session *plan editor* and the *home/notification-area* redesign) repeatedly collided in the same few god-files, forcing manual hunk-by-hunk staging to keep unrelated work apart. Good modularization should make concurrent feature work conflict-free by default.
- **Worst offenders (single files every feature edits):**
  - `src/index.css` — one giant stylesheet; every component appends here. Split into per-component CSS (co-located or `src/styles/<component>.css`) and load/concatenate at build time, so editing the plan editor never touches the same file as the notification area.
  - `src/index.html` — one document holding every view, overlay, dialog, and the floating timer. Extract per-view/overlay/dialog HTML partials (or render them from JS) so structural edits localize.
  - `src/i18n/en.js` & `src/i18n/sl.js` — flat single-object dictionaries; every string lands in the same file. Consider per-feature namespaced string modules merged into the locale (keeping `test_i18n_parity` green).
- **Guardrail:** the modular-file rule already exists for JS (AGENT_RULES §5); extend the same "one responsibility per file, edit-in-parallel-without-collision" principle to CSS, HTML, and i18n.

### 14.6 [ ] Rename the `booking` domain term to `session`
**Decided (2026-07-23):** from the PT's stance the entity is a **session**; "booking" is the customer-facing framing (a client *books* a slot; the PT *runs* a session). Unify the code on `session`.

- **Scope:** ~200 `booking`/`bookings` references in `src/` (data objects, `state.bookings`, `getOverlappingBookings`, `buildBookingMeta`, `activeSession.booking`, `isPlanning` bookings, …), the CSS class family (`.booking-card`, `.booking-live`, `.booking-completed`, `.booking-status-stack`, `.booking-card-title`, `.booking-live-bar`, `.booking-live-timer`, `.booking-past`, …), and the ~12 e2e test files that select `.booking-card`.
- **⚠ Migration risk (must handle):** the persisted DB (`librept_db`) stores the field as `state.bookings`. Renaming to `state.sessions` breaks existing local databases unless a **load-time migration** copies `bookings → sessions` — mirror the existing `openpt_db → librept_db` shim in `src/data/stateStore.js`. Keep it backward-compatible.
- **Do it as one focused pass on a green baseline**, updating `src/` + CSS + tests together so nothing half-renames (a partial rename leaves the suite red).
- **Best bundled with [§17](#17-structured-sessionprogram-history-sessionitemrecord)** (the `sessionItemRecord` build scheduled for Fri 2026-07-24): both rework the same session/history model and the same files. Renaming *first*, then building §17 on the `session` vocabulary, avoids touching the same code twice and keeps §17's new names consistent from the start.

---

## 16. Zero-Downtime Deploys & PT-Controlled Version Switching

> **Status (2026-07-25): the machinery is BUILT and dormant.** The brainstorms below are settled and
> implemented end to end — release identity from git tags ([releaseIdentity.js](src/modules/common/releaseIdentity.js)),
> per-release storage buckets ([storageNamespace.js](src/data/storageNamespace.js)), the validated
> schema-migration chain ([schemaMigrations.js](src/data/schemaMigrations.js) + [migrationSteps.js](src/data/migrationSteps.js)),
> the manifest reader and offer rules ([versionCatalog.js](src/data/versionCatalog.js)), the
> non-dismissable upgrade / switch-back / EOL messages ([versionMessages.js](src/modules/common/versionMessages.js)),
> and the deploy that publishes every supported tag under its own subpath plus `versions.json`
> ([build/releases.py](build/releases.py)). Covered by `test_release_identity.py`,
> `test_storage_namespace.py`, `test_schema_migrations.py`, `test_version_catalog.py`,
> `test_version_messages.py`, `test_release_publishing.py`, `test_release_stamp_writers.py`.
>
> **It is deliberately a strict no-op until the first `git tag` is cut**: an untagged build stamps
> `release: "dev"`, keeps the plain unsuffixed storage keys, and takes no part in switching; with no
> tags the deploy publishes no `versions.json`, so no version is ever advertised that isn't hosted.
> **To turn it on**: tag a commit (`git tag v1.0.0`) and push — the deploy does the rest.
>
> **Settled while building (2026-07-25), and load-bearing:**
> - **A rollback does not roll back code.** Every supported version stays published; switching only
>   changes which one is routed to. Two bugs came from not honouring that, both fixed: a release
>   folder was stamped with the *deploying* commit rather than its own, and `builtAt` was "now", so
>   re-publishing an old version changed its bytes → changed its integrity catalog → forced a
>   service-worker re-install on every trainer sitting on it. Release folders are now byte-identical
>   across deploys.
> - **The published manifest is the authority on order**, and that order must be *total*. Same-second
>   tags tied under a date sort and published oldest-first, which would have offered a downgrade as
>   "a new version is available". Sorted by `-v:refname` today; see [16.4](#164--open-dilemma-what-shape-should-a-release-tag-be--semver-or-an-iso-timestamp).
>
> **Still open** (see the sub-items): storage keyed on the schema rather than the tag ([16.3](#163--decided-not-built-key-storage-buckets-on-the-data-schema-not-the-release-tag)),
> the tag format itself ([16.4](#164--open-dilemma-what-shape-should-a-release-tag-be--semver-or-an-iso-timestamp)),
> the `/preview/` channel and beta opt-in (16.2), distinct ribbon treatments per preview tier,
> speculative background migration, migration fuzzing in CI, and showing the migration summary to the
> PT before they accept a switch (the summary is produced and exposed via `getLastMigrationSummary()`,
> but nothing renders it yet).

### 16.1 [x] Zero-downtime re-deploys with PT-controlled upgrade timing and rollback — **SHIPPED 2026-07-25**
Feature request by Simon. A deploy/upgrade must never force-interrupt a PT mid-session, and a PT must be able to defer, accept, or reverse an upgrade on their own schedule:

- **Zero-downtime re-deploys**: publishing a new build must not disrupt whoever is currently mid-session on the old one.
- **Routing config is separate from app loading and data migrations**: which build/version a client is currently running, and how it resolves its own routes, must be decoupled from (a) the app-shell loading process and (b) any data-migration step a new version's schema requires — these are three distinct concerns today conflated into one PWA update flow (`src/sw.js`'s cache-bump-on-deploy).
- **Opt-in upgrade timing**: when a new version is available, the PT sees a **non-dismissable** message in the message/notification area (`components/notificationArea.js`) inviting them to switch — but the switch itself is **their choice of moment**, not forced on next load, bounded by a **supportability EOL deadline** (the old version isn't kept alive forever).
- **Rollback anytime (within terms)**: a PT can switch back to the previous version **at any time**, also via a **non-dismissable** message in the message area — but doing so **after** the initial upgrade moment carries a **data-loss warning** (changes made under the newer version's schema/format may not round-trip cleanly back to the old one).
- **No fixes ever land on a "maintenance mode" (old) version** — once superseded, an old version is kept *available* (for rollback, until its EOL) but never *patched*. All fix/feature work happens forward-only on the current version.

**Resolved (2026-07-25): git tags, rebuilt into subpaths on every deploy.** Not branches, not
vendored copies — "which commit is version N" stays a lookup, and the trunk-based single-`main`
workflow is untouched. Hosting: a Pages run publishes one artifact, so a version folder omitted from
it disappears; the deploy therefore re-materialises **each supported tag from its own commit** into
`/<tag>/` on every run ([build/releases.py](build/releases.py)). The app is buildless, so a release
folder is just that commit's `src/` — no past toolchain has to still work. The supported window is
the newest `SUPPORTED_RELEASE_COUNT` tags; dropping out of that window *is* the EOL mechanism today.

**Ordering caveat worth keeping:** the manifest's order is the app's absolute authority on which
release is newer, so tags are sorted with git's version-aware `-v:refname`, **not** by date — two
tags cut in the same second tie under a date sort, and a tie publishes releases in the wrong order,
which would present a *downgrade* to a PT as "a new version is available". (Found in testing; pinned
by `test_releases_are_listed_newest_first_even_when_tag_dates_tie`.)

### 16.2 [~] Multi-version hosting, preview/beta channel, and per-version storage isolation — **hosting + storage SHIPPED 2026-07-25; preview/beta still open**
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

### 16.3 [ ] [Decided, not built] Key storage buckets on the DATA SCHEMA, not the release tag
> **Promoted to a prerequisite 2026-07-26**: [§18](#18-data-layer-simultaneous-multi-schema-writes-star-writes)'s star-write model is this item's bucket-per-schema-major layout expressed as a write policy, so §18 cannot start until this lands. Build it first.

**Decided (2026-07-25).** As shipped, `storageNamespace.js` keys buckets on the release tag, so
**every** tag mints a new bucket — forcing a pointless copy and, worse, showing the data-loss warning
on a rollback where *nothing can be lost*. A scary warning that isn't true trains a PT to click
through the real one.

- **Two axes, deliberately different shapes.** Code = the **git tag** (switchable identity, hosting
  subpath, rollback target; format still open — see [16.4](#164--open-what-shape-should-a-release-tag-be)).
  Data = a plain **integer major** (`schemaVersion`, [migrationSteps.js](src/data/migrationSteps.js)),
  bumped only when a migration step is added. **Not** full semver on the schema — a "patch" to a
  schema is either a migration step or nothing, and *minor* buys no correctness because the store
  already round-trips unknown fields (it serialises the whole state object rather than reconstructing
  it — the restore path *reconstructing* one was exactly the bug fixed on 2026-07-25). Add a schema
  minor the day an additive change needs describing in the rollback warning; not before.
- **Follows from integer-only majors**: refusing *any* newer `schemaVersion` (as
  `migrateState` does today) stays correct. The minor-tolerant read discussed on 2026-07-25 —
  accept same-major-higher-minor rather than refusing — only becomes necessary if a schema minor is
  ever introduced.
- **Invariant to protect**: unknown fields must survive a read/write round-trip, which is what makes
  a same-major rollback lossless. The store gets this by serialising the whole state object;
  anything that *reconstructs* state from a known field list breaks it silently (exactly the backup
  restore bug fixed 2026-07-25). Never rebuild state from an explicit key list.
- **Bucket key becomes the schema major** (`librept_db@schema2`). Two releases sharing a schema share
  a bucket: switching between them is instant, needs no copy, and carries no warning — because the
  move is genuinely reversible. Only crossing a schema major copies, migrates and warns.
- **Consequences to implement**: `evaluateVersionOffer` compares schemas so the rollback warning
  fires only when true; `versions.json` carries each release's `schemaVersion` so the running build
  can tell *before* switching whether the move is free; migration steps stay keyed on the integer
  major (no step per release); tags become free to cut whenever a rollback point is wanted.
- **Open**: whether the hosted window (`SUPPORTED_RELEASE_COUNT`) counts releases or schemas —
  leaning hosting-counts-tags, since a tag is what a rollback targets, with data retention following
  schema majors.

### 16.4 [ ] [Open dilemma] What shape should a release tag be — semver, or an ISO timestamp?
Raised by Simon (2026-07-25): *"tags are not worth it — maybe if tag would be ISO date and time
numeric, but not sure. Or maybe we need semver for rollbacks and upgrades?"* **Not decided.**

What the tag has to do, and nothing more: name a rollback target to a PT, be a hosting path segment
(`/<tag>/`), establish **order** (upgrade vs downgrade), and be cheap enough to cut without thinking.

- **Case for an ISO timestamp** (`2026-07-25-1846`, UTC) — the agent's recommendation:
  - **Order is intrinsic.** Zero-padded ISO sorts lexicographically *as* chronologically, killing a
    real bug class: same-second tags tied under `--sort=-creatordate` during the §16.2 build and
    published releases oldest-first, which would have offered a PT a downgrade labelled "a new
    version is available". Would also let the publisher use plain `--sort=-refname`, which is
    *provably* right for dates rather than merely usually right (`-v:refname` today).
  - **Zero decision cost**: `git tag $(date -u +%Y-%m-%d-%H%M)` — never adjudicate minor vs patch.
  - **Matches how a trainer thinks**: "go back to the 25th" beats "go back to v1.3.2".
- **Case against / for semver**: semver communicates the *magnitude* of a change. But the only
  magnitude with operational consequence here — "can I go back without losing data?" — is already
  answered by `schemaVersion` ([16.3](#163--decided-not-built-key-storage-buckets-on-the-data-schema-not-the-release-tag)),
  and answered *better*, because it is derived from whether a migration step exists rather than from
  remembering to bump a number. Semver's real job is compatibility contracts for third-party
  consumers, of which this project has none.
- **Either way it is nearly free to switch**: `normalizeRelease` already accepts a leading digit,
  `releasePath` just appends `/`, and buckets stop caring entirely once 16.3 lands. The only code
  change is the publisher's sort key, plus docs and test fixtures.
- **Settled either way (2026-07-25)**: a rollback **does not roll back code**. Both versions stay
  published side by side; the switch only changes which one is routed to. This is why each release
  folder is stamped with its *own* commit and time and re-materialises byte-identically — see the
  status note above.

---

## 17. Structured session/program history (`sessionItemRecord`)

> **⏳ Implementation scheduled for Claude on Fri 2026-07-24, 10:00** (when the subscription resets — this is a larger, cross-cutting change deliberately held for a complex-task budget, per the multi-model cost strategy). Design below is **decided**; it's a build task, not a brainstorm.

### 17.1 [x] Persist the whole structured program into history, via a generic typed item record — **SHIPPED 2026-07-24**
Graduated to [CHANGELOG](CHANGELOG.md). Built in [sessionItemRecord.js](src/modules/common/sessionItemRecord.js): `finishWorkoutSession` now snapshots the whole program (rests + superset grouping + prescribed-but-skipped exercises kept `completed:false`, greyed in the view) instead of flattening to performed sets; historyView / exerciseDeck read it structure- and completed-aware; `openSessionFromHistory` rebuilds the full live plan from the snapshot; back-compat via a shape guard. Covered by `tests/e2e/test_session_item_record.py`.

**Deviation from the design below (decided during build):** supersets are **not** a stored container — the snapshot is a **flat typed array** (`exercise` | `rest`) with `circuitId` grouping folded at render (`buildSupersetUnits`), the *same* single model the live session uses, so there is no second representation to keep in sync and the frozen record's contiguity can't drift. The `isRestItem` boolean is replaced by `type` dispatch (`isRestRecord`/`isExerciseRecord`). The original container-based design is kept below for reference; the rest of §17 (17.2–17.4) still applies.

Historical design (superseded by the flat model above for storage; the goals stand):

- **Generic `sessionItemRecord` with a `type` discriminator** — `exercise | rest | superset`:
  - `superset` is a **container** holding child items (renders/reuses as a unit), not a flag spread across sibling items.
  - `rest` stays a **first-class item type**, but is **not** an exercise (never in `state.exercises`, never focusable/loggable).
  - **Replace the scattered `isRestItem` boolean** with `type` dispatch — ideally one `renderItem(item)` / handler switch rather than predicate checks sprinkled across ~15 call sites. (Resolves the "leaky `isRestItem`" concern.)
- **Two orthogonal axes — don't conflate:** structural `type` (above) vs. an **exercise modality** field — `strength | cardio | stretch | hiit | balance` — that decides *how you log* (reps×load vs time/distance/cal/watts vs hold-time vs rounds). The modality axis **subsumes [13.3](#133--conditioning-metrics-extend-the-repsload-model-beyond-sets--reps--kg)**. **[~] Partially built (2026-07-24):** the modality field + `strength`/`cardio`/`stretch`/`balance` logging surfaces shipped ([exerciseModality.js](src/modules/common/exerciseModality.js), see §13.3 / CHANGELOG) — additive on the catalog entry, no migration. **Still open here:** wiring modality into the **`sessionItemRecord`** history snapshot itself (this item's core), routine-**builder** (`plansView`) metric authoring to match the inline editor, and `hiit` (rounds) which has no logging surface yet.
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
- **Watch item for §18.5**: making template provenance a *hard* reference back to the source history record would create the first cycle in the reference graph (`history → routine → history`), which §18.5's topological migration order forbids. Keep provenance a soft/denormalised field.

---

## 18. Data layer: simultaneous multi-schema writes ("star writes")

> **Status (2026-07-26): brainstorm, nothing built.** Raised by Simon as an architectural change to the
> persistence layer: **the data layer writes every record to all supported data-schema versions at
> once**, so that moving between app versions loses nothing in either direction. Captured here in full
> so it can be resumed; the sub-items mark what is settled and what is still open.
>
> **The core idea, and why it is structurally good.** Today's shipped migration is a **chain**
> (v1→v2→v3, [schemaMigrations.js](src/data/schemaMigrations.js)): lossiness compounds, and each step
> is tested against the previous step's output rather than against reality. Star writes replace the
> chain with a **star** — one projection per schema, each computed directly from the live domain
> object, none feeding another. Error cannot compound, every projection is independently testable
> against a single source, and there are **no backward transforms** to write: a "downgrade" is just
> another projection that was already being written all along. This is the strongest argument for the
> proposal and it should not be lost when weighing the costs.
>
> **This supersedes the "stay on localStorage" half of §3.7** (see 18.6) and **depends on §16.3**
> (see 18.1). It does not conflict with §16.1/§16.2's shipped machinery except where 18.10 says so.
>
> **Build order (decided with Simon 2026-07-26): DB first, then the star write layer, then the CD
> pipeline tests (18.13), then onwards in small steps.** The engine comes first because the star write
> layer cannot be built on localStorage at all — the fan-out multiplies a figure that already exceeds
> the 5 MB cap, and atomic fan-out needs IndexedDB transactions. The pipeline tests come *after* the
> write layer because most of what they assert (projection round-trips, the staging guard) has no
> subject until projections exist.
>
> **Progress:**
> - [x] **18.2 record identity** — [recordId.js](src/modules/common/recordId.js), UUIDv7 as fixed-width
>   base62, all call sites switched. Replaced a 41.4-bit `Math.random` generator carrying a **1.38%
>   chance of at least one collision** over five years of a very busy PT's records.
> - [x] **18.6 engine, part 1** — [indexedDb.js](src/data/indexedDb.js): one database, one object
>   store per schema, transactions that resolve on commit, collection + client indexes.
> - [x] **18.6/18.8 engine, part 2** — [storageDurability.js](src/data/storageDurability.js):
>   `persist()` on boot, eviction risk reported by consequence rather than private-mode sniffing.
> - [ ] **18.6 engine, part 3** — move the main DB read/write path behind
>   [stateStore.js](src/data/stateStore.js) onto IndexedDB, with §17.1's lazy per-client load. This is
>   the risky one: it needs a one-way import from the existing localStorage bucket and must stay
>   revertable until it has run on real data.
> - [ ] **16.3** — bucket on the schema major. Coupled: `listReleaseBuckets()` feeds
>   `evaluateVersionOffer`'s rollback check *by release id*, so the bucket key, the offer logic and
>   `versions.json`'s new `schemaVersion` field have to move together or rollback offers silently stop.
> - [ ] **18.1/18.4** — the star write layer itself (projections + fan-out).
> - [ ] **18.13** — the CD pipeline tests.

### 18.1 [ ] [Decided in principle] The star write model, and its relationship to §16.3
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
- **A build can only write schemas it knows how to project**, so an old build's fan-out set can shrink
  over time but never grow. Read the set from `versions.json` at runtime (already fetched `no-store`,
  already the authority on order — [versionCatalog.js](src/data/versionCatalog.js)) rather than
  hardcoding it, so an old release folder stays byte-identical (§16.2) while still learning that a
  schema was retired.
- **Write set ⊇ read set.** A bucket must start receiving star writes the moment its migration
  *begins*, not when it completes — that is what makes 18.3's accelerator work.

### 18.2 [ ] [Open] Identity: lineage IDs vs. the ID-mapping table
Simon's proposal remaps record IDs at each schema migration and keeps an
`old-id → migrated-id` mapping table, which also serves as the idempotency guard.

- **Clash probability is *not* the justification** — 122 random bits do not collide. The real
  justification is **split/merge migrations**: when one v5 record becomes N v6 rows (or the reverse),
  identity genuinely cannot be preserved and no key format saves you.
- **Cost of remapping**: the same logical record has a different ID per bucket, so the mapping becomes
  **hot-path infrastructure** (every fan-out write translates IDs), must itself be stored, backed up
  and reconciled, and grows as `records × schemas` forever with no deletes and no compaction story.
- **Proposed alternative — an immutable `lineageId`** minted once and never changed, with per-schema
  local ids only where a schema truly needs one; splits produce children under a stable parent. The
  mapping becomes a *column on the record* instead of a second store. **Four independent arguments
  now point at this**: split/merge identity, the suppression list (18.7), deep-link durability
  (18.10), and dropping the hot-path lookup.
- **ID format — UUIDv7, decided 2026-07-26** (RFC 9562): 122 bits of collision resistance *and* lexicographic
  time-ordering in the prefix, so it doubles as a tiebreak within 18.5's topological order. Today's
  generators are a real clash risk and leak creation time — `Date.now()` + 4 chars of `Math.random()`
  ([clipboardEditor.js](src/modules/clipboard/clipboardEditor.js)), `session-${Date.now()}`
  ([editSessionControl.js](src/modules/session/editSessionControl.js)). If "short" ids are wanted,
  shorten by base62-encoding a v7 — never by dropping entropy.

### 18.3 [ ] [Decided] Migration is pre-emptive, resumable, and runs through the normal write layer
- **Pre-emptive**: migration into a newly-available schema starts *before* the PT opts into anything,
  so a switch is instant. **This closes §16.2's open staleness question** — §16.2 worried that a
  speculative copy goes stale if the PT keeps working, and leaned toward redoing it at switch time.
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
  - **Completeness is a query, not a stored flag** (decided 2026-07-26): `count(source records) ===
    count(mapping entries for that schema)`. Derived state cannot drift from reality the way a flag
    written at the wrong moment can, and it needs no crash-safe flag update. Requires an IndexedDB
    index on the migration marker so `count()` hits the index B-tree instead of scanning. **Count
    equality is sound here precisely because there are no deletes (§17.3)** — the mapping can never
    hold an entry whose source has gone, so equal counts cannot hide a mismatched pair.
- **Still open**: defer pre-emptive migration to idle/charging (`requestIdleCallback`) so it does not
  cost battery mid-session; how a *failed* background migration reports itself without alarming a PT
  who never asked for it (block the switch offer, do not raise an error).

### 18.4 [ ] [Decided — staging, not envelopes] The lossy-projection problem
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
currently-supported schema* — the field lands N releases before the UI that uses it. **Enforce in
CI**: assert every field the current domain model writes exists in every live schema's projection.
Without the check the discipline survives until the first hurried release.

- **Projections must be pure and total** so buckets are always fully re-derivable. That yields two
  fuzzable properties for the CI migration fuzzing §16.2 already wants: `project(x)` is idempotent,
  and `unproject(project(x)) == x` for every live schema.
- **Test-corpus gap**: migration tests must include a record using the *newest* fields written through
  an *old* schema's UI path. That is the exact case that loses data, and nothing exercises it today.
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

### 18.5 [ ] [Decided] Ordering is topological, not chronological
Migration replay order means **correct order of foreign-key availability**, not timestamp order.

- **The reference graph must be acyclic**, so all dependent data reconstructs as a DAG. **Enforce it
  in CI** — a convenience back-reference added later would otherwise deadlock migration or silently
  pick an arbitrary order, and it would be found by a trainer, not by the build.
- **§17.4 is the first realistic cycle risk** — see the watch item there.
- **The wall clock is not an ordering key anywhere.** Star writes are immune to clock skew because a
  single sequential writer resolves by execution order, not by comparing timestamps; timestamps are
  inert data. Two riders: a backward clock jump still writes a wrong `loggedAt` (cosmetic, but it is
  what the PT reads), and **§3.3 Google Drive sync reintroduces the problem structurally** — the
  moment a second device writes concurrently, arbitration is unavoidable and a `(deviceId, seq)`
  Lamport pair becomes necessary. Not needed before then.

### 18.6 [ ] [Decided] Persistence engine → IndexedDB (supersedes the §3.7 deferral)
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

### 18.10 [ ] [Open — the fork to decide first] Deep links, and one build vs. many builds
Three deep-link failure modes as UI behaviours are added and dropped:

1. **Version segment dies at EOL** — a shared `/LibrePT/v1.5.0/#/…` 404s. Fix: **never version-qualify
   a shareable link.** One canonical version-less URL space; the versioned path is the *switcher's*
   mechanism. **Version selection is per-PT state, never part of a shared URL.**
2. **Route removed or renamed** — deprecated routes become permanent aliases to canonical ones,
   retained forever (routes are bytes, same principle as keeping backup readers forever). A link to a
   retired *behaviour* resolves to the nearest surviving ancestor rather than erroring.
3. **The ID in the link no longer exists** — created by 18.2's remapping. The mapping table can
   resolve it, but the better answer is that **deep links carry the `lineageId`, never a per-schema
   id**, and no lookup is ever needed.

**The fork worth deciding before anything here is built.** Simon's "each new release packages all UI
code for supported version behaviours" implies **one build with versioned behaviours behind flags**,
not multiple hosted builds. That is arguably a *simplification*: no byte-identical release folders, no
per-tag subpath publishing, no service-worker reinstall hazard, no "which build am I running", and
deep-link failure mode 1 disappears rather than being mitigated. **Confirmed as the intent
(Simon, 2026-07-26).** Costs: old behaviours must be actively maintained rather than frozen, and it
**inverts §16.1's "no fixes ever land on a maintenance-mode version"** — old behaviours living inside
the current build *do* get fixes automatically. That may well be better, but it must be a deliberate
reversal, and it decides whether §16.1/§16.2's hosting machinery stays or is retired. Everything else
in §18 holds either way.

- **Content-addressed modules make the payload cost much smaller than a naive ×N** (Simon,
  2026-07-26): a module whose SHA is unchanged across behaviour generations is stored and downloaded
  **once**, so the marginal cost of an extra generation is only the files that actually differ — not
  another 671 KB. The app already computes a per-file integrity catalog for the service-worker cache
  ([cacheManifest.js](src/sw/cacheManifest.js)), which is most of the machinery.
- **The price is dependency resolution**: routing must work out which module graph a given behaviour
  needs when the files are shared and deduplicated. **This is the payoff case for modularization** —
  it raises the value of §14.5 (split the monolithic shared files) and §12.7 (~89 module requests on
  first load) from housekeeping to load-bearing, because coarse modules dedupe badly and a file that
  mixes two behaviours' code can never be shared.
- **Watch the shipped invariant**: `cacheManifest.js` documents that the cache is *atomic* — one whole
  coherent module version or nothing — because a stale module importing a fresh one is a runtime
  version skew. Content-addressed sharing across generations must preserve that per-graph coherence,
  not just per-file freshness.

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

### 18.12 [ ] [Decided] Reuse the preview ribbon for unsupported-version warning
Generalise `#preview-ribbon` from an always-on `PREVIEW` pill into a **build-status ribbon with
severity tiers**: `PREVIEW` (amber, informational) → `DEGRADED` → `BETA` (stronger — real data on
unstable code) → `UNSUPPORTED` (red, non-dismissable). This collapses §16.2's open "distinct ribbon
treatments per preview tier" question into one piece of work.

- **`DEGRADED` is the downgrade tier** (§18.4): the running app is older than the schema its data was
  authored in, so some records display wrong and — the part that matters — **anything logged here may
  be recorded lossily**. Wording must say that plainly rather than implying a read-only display quirk.

- **The ribbon must not be the only signal.** Persistent chrome goes invisible within days — which is
  what makes an always-on amber pill safe today and an unsupported-version warning useless tomorrow.
  Pair it with §16.1's non-dismissable notification-area message.
- **Never block mid-session.** The ribbon carries severity continuously, but any *blocking* consent
  prompt is gated on there being no active session — a red warning plus a modal is maximally alarming
  exactly when a PT has a client in front of them.
- Keep the existing `prefers-reduced-motion` handling; a red flashing element is an accessibility
  problem in a way an amber pulse is not.

### 18.13 [ ] CD pipeline tests for the star-write layer
Requested by Simon (2026-07-26) as the step that follows the write layer. The properties §18 relies
on are all *invariants across releases*, which is precisely what a per-commit gate can hold and what
review cannot — none of them can ever be tested against a real PT's data, because that data is
local-only by design (§16.2).

What the pipeline has to assert, roughly in order of how expensive the failure is:

- **The staging guard (§18.4)** — every field the current domain model writes exists in every live
  schema's projection. This is the check that makes expand-first staging real rather than aspirational;
  without it the discipline survives until the first hurried release, and the failure is silent data
  loss on downgrade.
- **Projection round-trips (§18.4)**, property-based over synthetic data generated from the existing
  seed machinery (`src/data/*.js`): `project(x)` is idempotent, and `unproject(project(x)) === x` for
  every live schema. Together these are what "projections are pure and total" actually means, and they
  are what lets a bucket be re-derived rather than restored.
- **The old-UI-writes case (§18.4)** — the specific scenario that loses data: a record using the
  *newest* fields, written through an *older* schema's UI path. Nothing exercises it today.
- **The reference graph is acyclic (§18.5)** — migration replay orders by foreign-key availability, so
  a convenience back-reference added later would deadlock it or make the order arbitrary. §17.4 is the
  first realistic cycle risk.
- **The frozen backup corpus (§18.7)** — one committed fixture per historical schema, each asserted to
  still import to the expected domain object. This is what turns "restorable indefinitely" from a hope
  into something enforced on every commit.
- **Migration fuzzing (§16.2, still open there)** — synthetic edge-case databases through the whole
  chain, checking the runner refuses rather than corrupts.
- **Manifest correctness (§16.3)** — `versions.json` carries each release's `schemaVersion`, releases
  are ordered newest-first under a *total* order, and every advertised release is actually published.
  The ordering half already burned once (§16.2's same-second tag tie).

Fits the existing gate: `python -m build check` already runs staged parallel validation, and the
property/fuzz work belongs in Stage 1 (fast, no browser) rather than in the e2e stage.
