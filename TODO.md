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
- **Revisit → IndexedDB** (built-in, no wasm/SQLite dependency) only when a real driver appears: binary data returns, the 5MB cap looms, or the long-term analytics vision (13.x — volume load / 1RM aggregation across months) wants indexed queries.
- **Not** SQLite-in-wasm — too heavy a dependency for a buildless offline app at this scale.
- **Cheap prep now**: keep the main DB behind the `stateStore.js` seam so a future swap is localized, rather than scattering more raw `localStorage` calls across components.

### 3.8 [ ] Unbacked-data warning banner — same weight as the PREVIEW ribbon
**Raised 2026-07-26 (Simon).** The database holds the **only** copy of a trainer's records ([DATA_MODEL §6](docs/DATA_MODEL.md)), and a browser can evict IndexedDB under storage pressure. A PT with months of history and no external copy is one wiped profile away from losing the business's records, and today nothing on screen says so.

- **Surface**: a persistent banner in the header strip, styled and placed like `#preview-ribbon` ([index.html](src/index.html)) — same visual weight, same "tap for the full explanation" affordance, linking to a short doc on what is at risk and how to fix it.
- **Condition**: shown while the data has **no secured external copy** — no cloud target configured, or the last successful export/sync is stale (threshold to decide; "never" is the obvious first case). It is *not* the offline indicator and not the ahead/behind badge (3.9) — those say "not pushed *yet*"; this says "nothing anywhere but this browser profile".
- **Dismissal**: must not be permanently dismissible while the condition holds — the risk does not go away because the banner was closed. Session-scoped dismissal at most; decide.
- **Wording is the whole feature.** It has to be honest without being alarmist to a PT mid-session ("Only copy — no backup yet" beats "DATA LOSS RISK"), and it must state the fix in the same breath (Sync & Backup, one tap away).
- **Interacts with**: [storageDurability.js](src/data/storageDurability.js) already measures eviction risk by consequence (quota, `persist()`), so the banner can escalate its wording when the browser has *refused* persistence rather than merely not been asked.
- **Depends on** a real cloud target existing (3.3); until then it can only track "last export downloaded", which the Backup dialog already knows.

### 3.9 [ ] Every write increments the ahead counter on the Sync & Backup button
**Raised 2026-07-26 (Simon).** The `↑n ↓n` badge on `#backup-btn` is meant to read like git's ahead/behind — "you have n local changes not yet pushed". Today it under-reports, so a PT can believe they are safer than they are.

- **Current wiring**: only `saveState()` in [app.js](src/app.js) passes `incrementLocalSync` into `saveToLocalStorage` ([applicationHeader.js](src/modules/common/applicationHeader.js)). There are **~21 other `saveToLocalStorage(...)` call sites** that pass nothing, plus **~16 `saveActiveSessionToCache()`** calls (every clipboard edit, every logged set) that never touch the badge at all.
- **Fix at the seam, not the call sites**: the counter belongs *inside* the store's write path (and the live-session cache write), so a new writer cannot forget it. Passing a callback per call site is exactly the pattern that produced the gap. Ties into [§18.6](#18-data-layer-simultaneous-multi-schema-writes-star-writes) — once writes go through `writeQueue`/`stateStore`, that is the one place to count.
- **Decide what "one change" means**: per `save()` (a keystroke in the plan editor would tick it) or per logical mutation. Per-keystroke makes the number noise; debouncing to a logical edit is closer to git's "one commit".
- **The counter is currently mock state** (`mockSyncState` in `applicationHeader.js`) reset on load — real ahead/behind needs a persisted "last synced" marker (record ids from §18.2 make this cheap: count records written since the last synced id/time).

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

### 8.3 [ ] Inline Clipboard Editor (Saved Patch: `patches/inline_clipboard_editor.patch`)
An on-the-fly edit mode for the active session clipboard (`src/components/clipboardEditor.js`), saved as an unstaged patch (`patches/inline_clipboard_editor.patch`) so it can be cleanly reviewed/applied after core refactoring passes.
- When the trainer taps a card's edit (✎) affordance (`.deck-card-edit`), the deck flips into an inline editable list (`renderClipboardEditor`).
- Allows swapping exercises, retargeting sets/reps/weight, reordering rows via tap or drag (`.editor-reorder`), adding new exercises, and adjusting rest breaks directly inside the live session without leaving the gym floor.
- To apply later: `git apply patches/inline_clipboard_editor.patch`.

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

### 13.4 [x] Assault Bike time/watts coverage — see CHANGELOG

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

### 14.7 [ ] Extract a shared `renderMarkupOnce()` helper — 22 duplicated render-guard blocks
The shell split (§14.5) copy-pasted the same 3-line pattern into 22 call sites across 14 files
(`formsController.js` ×3, `activeSessionController.js` ×3, `applicationHeader.js` ×3, one each in
`backupRestore.js`, `buildInfoDialog.js`, `feedbackModal.js`, `notificationArea.js`,
`routerController.js`, and one per view module):

```js
const root = document.getElementById(containerId);
if (!root || <exists-check>) return;
root.insertAdjacentHTML("beforeend", `...`);
```

- **Risk**: a future fix to the idempotency guard (e.g. switching from an existence-check to a
  data-attribute flag to survive a hot-reload) has to be hand-applied to all 22 sites; missing one
  reintroduces the exact duplicate-injection bug the other 21 correctly guard against.
- **Fix**: one helper in [`modules/common/dom.js`](src/modules/common/dom.js) (already the home for
  DOM utilities) — `renderMarkupOnce(containerId, existsCheckFn, html)` — and thread all 22 call
  sites through it.

### 14.8 [ ] Render-order dependencies between modules are unenforced — already caused 2 bugs
`app.js` sequences ~10 `renderXShell()`/`renderXDialog()` calls across two hand-ordered blocks
(`renderHeaderShell()` specially hoisted above `initAppLifecycle()`, the other nine grouped later).
Nothing structurally enforces that a module's render call happens before every *other* module that
queries its elements — this already produced two real bugs in §14.5's own build, caught only by
end-to-end testing: the header rendering too late for `backupRestore.js`'s `#backup-btn` and
`buildInfoDialog.js`'s `#app-version` lookups, and `dialog-apply-adjustment` rendering too late for
its own route's existence check.

- **Risk**: the next module added that queries another module's element, placed above that
  element's `renderXShell()` call, silently no-ops with no error — the same class of bug recurring
  with no structural guard against it.
- **Fix direction**: a small render registry app.js calls in one pass (each module registers its
  shell render + declares what it depends on existing first), rather than a hand-maintained call
  order a future edit can silently get wrong.

### 14.9 [ ] `activeSessionController.js` (1553 lines) mixes markup templates into a behavior file
The shell split (§14.5) added ownership of three unrelated UI surfaces' markup — the full-screen
active-session overlay shell, `dialog-add-session-exercise`, and `dialog-catalog-picker` — into
`activeSessionController.js`, on top of its existing active-session state/behavior logic, growing
an already-large controller further instead of extracting a companion view file.

- **Risk**: a future change to the overlay's markup requires scrolling a 1500+ line behavior-heavy
  file to find the ~100-line template block buried inside it, and any edit there risks an unrelated
  merge conflict with concurrent active-session logic changes in the same file — exactly the
  same-file co-edit collision [AGENT_RULES §5](AGENT_RULES.md) exists to prevent.
- **Fix direction**: extract the three `renderXShell`/`renderXDialog` functions (and their markup)
  into a new `modules/clipboard/activeSessionOverlayView.js`, leaving `activeSessionController.js`
  to own behavior only.

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
> ([16.3](#163--decided-not-built-key-storage-buckets-on-the-data-schema-not-the-release-tag)); the
> build stamp is the commit SHA, not a tag; the PREVIEW ribbon (generalised into severity tiers by
> [§18.12](#1812--decided-reuse-the-preview-ribbon-for-unsupported-version-warning)); migration must
> validate every step's output and refuse data from a newer build.
>
> **Two findings worth not re-learning:** an ordering authority must be a *total* order (same-second
> tags tied under a date sort once offered a PT a downgrade labelled "a new version is available"),
> and anything that changes an already-published build's bytes forces a service-worker re-install on
> everyone sitting on it.

### 16.3 [ ] [Decided, not built] Key storage buckets on the DATA SCHEMA, not the release tag
> **Simplified by the no-tags decision**: no release identity means no `UNRELEASED` case, no tag
> normalisation, and no per-release bucket to migrate away from — storage keys go straight onto the
> schema major, and there is no window of releases to size.

> **This is [§18](#18-data-layer-simultaneous-multi-schema-writes-star-writes)'s prerequisite**: the
> star-write model *is* this bucket-per-schema-major layout expressed as a write policy. Build it
> first. Cheapest right after [16.5](#165--retire-the-multi-version-hosting-machinery-from-the-code),
> which removes the per-release layer this would otherwise have to be threaded through.

**Decided (2026-07-25).** As shipped, `storageNamespace.js` keys buckets on the release tag, so
**every** tag mints a new bucket — forcing a pointless copy and, worse, showing the data-loss warning
on a rollback where *nothing can be lost*. A scary warning that isn't true trains a PT to click
through the real one. With tags gone the tag axis simply disappears; the schema axis is all that is left.

- **Data = a plain integer major** (`schemaVersion`, [migrationSteps.js](src/data/migrationSteps.js)),
  bumped only when a migration step is added. **Not** full semver on the schema — a "patch" to a
  schema is either a migration step or nothing, and *minor* buys no correctness because the store
  already round-trips unknown fields (it serialises the whole state object rather than reconstructing
  it — the restore path *reconstructing* one was exactly the bug fixed on 2026-07-25). Add a schema
  minor the day an additive change needs describing in a downgrade warning; not before.
- **Follows from integer-only majors**: refusing *any* newer `schemaVersion` (as `migrateState` does
  today) stays correct. The minor-tolerant read discussed on 2026-07-25 — accept same-major-higher-minor
  rather than refusing — only becomes necessary if a schema minor is ever introduced.
- **Invariant to protect**: unknown fields must survive a read/write round-trip. The store gets this
  by serialising the whole state object; anything that *reconstructs* state from a known field list
  breaks it silently (exactly the backup restore bug fixed 2026-07-25). Never rebuild state from an
  explicit key list.
- **Bucket key becomes the schema major** (`librept_db@schema2`), which is also the IndexedDB object
  store name in [DATA_MODEL §2](docs/DATA_MODEL.md) — one naming scheme across both engines, so the
  §18.6 part-4 import is a copy between two things named the same way.
- **Consequences to implement**: the schema major is the only thing storage keys on; migration steps
  stay keyed on the integer major; and the degraded/unsupported signal ([§18.12](#1812--decided-reuse-the-preview-ribbon-for-unsupported-version-warning))
  fires off a schema comparison rather than off a release comparison.

### 16.5 [ ] Retire the multi-version hosting machinery from the code
The TODO items are dropped (above); the implementation is still in the tree and is now dead weight
sitting directly on §16.3's path. **Delete rather than adapt** — none of it has a subject any more.

- **Modules**: [releaseIdentity.js](src/modules/common/releaseIdentity.js) (tag → storage suffix /
  URL segment), [versionCatalog.js](src/data/versionCatalog.js) (the `versions.json` reader and offer
  rules), [versionMessages.js](src/modules/common/versionMessages.js) (upgrade / switch-back / EOL
  messages), the per-release suffixing half of [storageNamespace.js](src/data/storageNamespace.js),
  and the chain runner in [schemaMigrations.js](src/data/schemaMigrations.js) — the chain is what star
  writes replace, so it goes when §18.1 lands, not before.
- **Build/deploy**: [build/releases.py](build/releases.py) and the release-publishing step in
  `.github/workflows/deploy.yml`; `release` in [src/version.js](src/version.js).
- **Tests**: `test_release_identity.py`, `test_storage_namespace.py`, `test_version_catalog.py`,
  `test_version_messages.py`, `test_release_publishing.py`, `test_release_stamp_writers.py` —
  the storage-namespace ones survive in schema-keyed form as §16.3's coverage.
- **Keep**: the commit SHA build stamp and the build-info dialog ([buildInfoDialog.js](src/modules/common/buildInfoDialog.js)),
  which are support surfaces, not switching machinery — but the dialog's release row becomes the
  **schema** row.
- **Order**: do this *before* §16.3, so the bucket change is a small diff against a store that has one
  axis instead of a rewrite against one that has two.

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
- Pairs with the inline clipboard editor ([8.3](#83--inline-clipboard-editor-saved-patch-patchesinline_clipboard_editorpatch)) and "next session prep" ([5.1](#51--tabbed-client-view) Tab 3).
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
> supported is a set of **schemas**, the only axis storage keys on ([16.3](#163--decided-not-built-key-storage-buckets-on-the-data-schema-not-the-release-tag)).
> "No fixes ever land on a maintenance-mode version" is inverted, deliberately: old behaviours live
> inside the current build, so they get fixes automatically.
>
> **Open question to confirm before building the write layer**: with one build, what still justifies
> writing every live schema? The surviving case is the **previously-cached Service Worker build** — a
> PT on yesterday's cached build *is* an older app version even with no tags, and multi-schema writes
> keep their data readable. Backup portability is the second case.
>
> **Build order: DB first, then the star write layer, then the CD pipeline tests (18.13).** The
> engine comes first because the fan-out cannot be built on localStorage at all (exceeds the 5 MB
> cap; atomic fan-out needs IndexedDB transactions).
>
> **Remaining work, in order:**
> - [ ] **18.6 engine, part 4** — move `stateStore`'s read/write path onto IndexedDB through the
>   write queue, with §17.1's lazy per-client load. The risky one: needs a one-way import from the
>   existing localStorage bucket, revertable until proven on real data. **Gated by §17.5** (shipped):
>   session-item `position` must be written and authoritative before the import runs.
> - [ ] **Documentation** — [docs/DATA_MODEL.md](docs/DATA_MODEL.md) must be kept in step with each
>   step below.
> - [ ] **[16.5](#165--retire-the-multi-version-hosting-machinery-from-the-code)** — delete the
>   multi-version hosting machinery, so the next item is a small diff instead of a rewrite.
> - [ ] **[16.3](#163--decided-not-built-key-storage-buckets-on-the-data-schema-not-the-release-tag)** —
>   bucket on the schema major, matching the IndexedDB store naming.
> - [ ] **18.1/18.4, the rest** — the actual fan-out (write a projection into an IndexedDB bucket);
>   waits on a second live schema existing.
> - [ ] **18.13** — the CD pipeline tests.

### 18.1 [~] [Decided in principle] The star write model, and its relationship to §16.3
> **Schemas exist as data now (2026-07-27)** — [recordSchemas.js](src/data/recordSchemas.js) declares
> `SCHEMA_2`'s per-collection field shapes, and [recordProjections.js](src/data/recordProjections.js)
> projects each live domain object into it. Until this landed, "schema N" had no existence except as
> whatever `migrationSteps.js` happened to produce as a side effect of a transform — there was
> nothing a projection could target and nothing for §18.4's staging guard to compare. Every real
> record this build writes (every seed fixture, plus the actual object literals `formsController.js`,
> `feedbackModal.js` and `finishWorkoutSession` build — not just the seed data) is asserted to project
> cleanly, in `tests/e2e/test_record_schemas.py`. **Still not built**: the fan-out itself — writing a
> projection into an actual IndexedDB bucket. That is blocked on [16.5](#165--retire-the-multi-version-hosting-machinery-from-the-code)
> and [16.3](#163--decided-not-built-key-storage-buckets-on-the-data-schema-not-the-release-tag)
> landing first, per the agreed build order, and there is still only one live schema — the table
> below is the layout the moment a second one is cut, not something exercised yet.

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

### 18.4 [~] [Decided — staging, not envelopes] The lossy-projection problem
> **The single-schema half of the guard exists (2026-07-27)**: `recordProjections.js`'s
> `projectionIssues()` plus `test_record_schemas.py` already assert "every record this build
> actually writes conforms to the schema it targets" — proven against real seed data AND the literal
> object shapes live writers build (`formsController.js`'s new-client form, `feedbackModal.js`'s
> new-feedback form, `finishWorkoutSession`'s history record), not an idealised model. **The
> cross-schema half — "exists in every OTHER live schema's projection" — has no subject yet**,
> because there is still only one live schema; nothing has proposed a field schema 2 cannot carry.
> This activates automatically the day a schema 3 is cut: `LIVE_SCHEMAS` in `recordSchemas.js` gains
> an entry, and the same `projectionIssues()` machinery checks the new field against it.

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
  fuzzable properties for the CI migration fuzzing §18.13 wants: `project(x)` is idempotent,
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

### 18.12 [ ] [Decided] Reuse the preview ribbon for unsupported-version warning
Generalise `#preview-ribbon` from an always-on `PREVIEW` pill into a **build-status ribbon with
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

### 18.13 [ ] CD pipeline tests for the star-write layer
Requested by Simon (2026-07-26) as the step that follows the write layer. The properties §18 relies
on are all *invariants across releases*, which is precisely what a per-commit gate can hold and what
review cannot — none of them can ever be tested against a real PT's data, because that data is
local-only by design.

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
- **Migration fuzzing** — synthetic edge-case databases through every projection, checking the runner
  refuses rather than corrupts.
- **Ordering invariants (§17.5)** — positions are dense `0..n-1` per session and circuit members are
  contiguous, asserted over every writer's output. This replaces the retired manifest-ordering check
  as the place where "the order is authoritative and total" is enforced; that one burned once already
  (same-second release tags tying under a date sort), and the failure here is worse — a silently
  scrambled program that every id-completeness check passes.

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
      ([formsController.js](src/controllers/formsController.js) `setupClientForms`).
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
