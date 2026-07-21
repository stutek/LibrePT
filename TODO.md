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

Captured backlog. Nothing here is implemented yet. Items marked **[Brainstorm]** are unresolved design questions to settle before any code is written.

Canonical context: [README.md](file:///home/simon/Projects/LibrePT/README.md) (architecture & features), [use_cases/](file:///home/simon/Projects/LibrePT/use_cases/) (workflows), [CONTRIBUTING.md](file:///home/simon/Projects/LibrePT/CONTRIBUTING.md) (conventions).

---

## 1. Scheduling & Bookings

### 1.1 [ ] PT-side client assignment to a session
The session card on the home dashboard must let the **PT assign clients to a session directly**, not only rely on client self-subscription via the Google-hosted booking page.

- Assignment happens from the session card on the dashboard.
- Assigned clients are **notified by a calendar invite email**, when an email address exists for them in the database.
- Complements, does not replace, the existing self-subscription flow ([uc4_client_self_subscription.md](file:///home/simon/Projects/LibrePT/use_cases/uc4_client_self_subscription.md)).
- **Open**: clients with no email on record — assign silently, or prompt for an address?

### 1.2 [ ] Simultaneous sessions merged into one clipboard
When several sessions run in **the same time slot with different programmes**, the clipboard must merge **all participants into a single view**, with enough visual separation to tell which participant belongs to which session/programme.

- Relates to the existing "Asynchronous Session Scenarios" capability in [uc1_gym_floor_clipboard.md](file:///home/simon/Projects/LibrePT/use_cases/uc1_gym_floor_clipboard.md).
- The distinguishing signal must survive the gym-floor constraints: glanceable, no reading required.

### 1.3 [ ] Session list must model partial overlaps and other PTs' room usage
The session list can no longer assume one session per time slot. Model and display:

- **Partially overlapping sessions** (not just same-slot): sessions that share *part* of a time window — e.g. 10:00–11:00 and 10:30–11:30 — must both render, visibly showing the overlap rather than stacking as if sequential. The current relative-bucket model (`day: today/tomorrow/…`) and the same-day time-overlap merge in `launchClipboardDirectly` only handle full-slot collisions; partial overlaps need a real start/end time model.
  - **Render overlaps the way calendar apps do**: a vertical **time grid** with sessions as blocks whose **top/height map to start/end**, and overlapping blocks placed **side by side** (columns) within the shared span, each narrowed to fit. This replaces the single-column stacked card idea *for time-conflicted ranges* — a session's horizontal position/width encodes its overlap, its vertical position encodes when. Non-overlapping parts of the day can still collapse to save space, but any overlap expands into the aligned grid.
- **Shaded sessions from other PTs sharing the gym/room**: show *other trainers'* bookings for the **same gym/room** as read-only, visually **shaded/muted** context, so a PT sees when a room is already occupied and avoids double-booking equipment. These are not the PT's own sessions — not launchable, no participant detail, just occupancy.
- Implies a **room/resource** dimension on bookings (which room, which trainer) that the data model does not have yet, and a scheduling/availability source for other PTs' bookings (shared calendar or backend).
- Feeds directly into the planned **date-grouped, scrollable session card stack** ([4.3](#43-collapse-the-duplicated-session-header-into-one-row-with-a-date-picker) and the sessions-view redesign): overlaps and shaded external sessions must be legible within that stacked layout.

---

## 2. Active Session Bar (bottom green row)

### 2.1 [x] Active state
The bottom bar currently shows only a timer. It should show:

- Session **name**
- **Number of clients**
- **Start and end time**
- A **countdown timer** of remaining minutes, which **may go negative** when a session runs over.
- The **entire row must be clickable**, not just the up-arrow.
- **Open**: *why do we need the timer control at all?* Re-evaluate whether the manual timer control earns its place, or whether the countdown should simply derive from the session's scheduled start/end.

### 2.2 [x] Idle state (no active session)
When no session is active:

- Change the row colour to distinguish it from the active state.
- Content and click target refer to the **next upcoming session**.
- If **multiple sessions run in parallel**, list them all in the same row — they all open the same clipboard.

### 2.3 [ ] Every session card gets a status line (live / upcoming countdown / past elapsed, editable)
Feature request by Simon, expanding the earlier "countdown for upcoming cards" ask into a unified status line **every** session card carries, not just live ones — `.booking-live-bar` / `.booking-live-timer` in [sessionCard.js](file:///home/simon/Projects/LibrePT/src/components/sessionCard.js) is currently the only session state with an on-card timer.

- **Active** (today, exists): the `.booking-live-bar` duration timer — no change to the state itself, only to its **format** (see below).
- **Upcoming** (not yet started): a live countdown to the scheduled `startTime`, mirroring `.booking-live-timer`'s per-second tick pattern but counting down instead of up.
  - **Open**: what happens at `00:00` — flip straight into the live/`booking-live` state, or hold a brief "starting now" beat first?
- **Past** (completed): an elapsed-time status line with an icon that reads as "past" (distinct from the live/upcoming icons), showing how long the session actually ran.
  - **Editable**: the trainer can correct the recorded elapsed time after the fact (e.g. forgot to end the session on time) — needs an inline edit affordance and a data-model field this writes back to (today's `activeSession.duration`/history log is captured at finish time, not touched after).
- **Formatting constraint**: every one of these session-list-level status timers displays **`HH:MM` only, no seconds** — this changes the *current* active-session timer too, which today renders via `formatSignedDuration`/`formatDuration` ([helper/utils.js](file:///home/simon/Projects/LibrePT/src/helper/utils.js)), both of which include seconds (`h:mm:ss`). Needs either a new minutes-only formatter or a variant param, used consistently across all three states. (The floating clipboard timer stack and the overlay's own session-duration readout are a separate surface — not in scope here unless later said otherwise.)

---

## 3. Data Sync

### 3.1 [x] "Sync Sessions" → "Sync Data"
Rename the dashboard action from **Sync Sessions** to **Sync Data** (`btn_sync_sessions` → new key; update EN + SL dictionaries together).

### 3.2 [x] Git-style change counters
Show a **count of local changes and remote changes**, in the spirit of git's ahead/behind indicator, so the PT can see at a glance whether their device is in sync.

- **Done**: the header's Sync & Backup control carries a `sync-badge` (`renderSyncBadge` in `components/applicationHeader.js`) with an ahead (↑ local edits to push) and behind (↓ remote changes to pull) count, styled as a git-style pill (`.sync-ahead`/`.sync-behind` in `index.css`). Each on-device edit increments the local count; the badge hides at 0/0 and caps at `9+`.

### 3.3 [ ] [Brainstorm] Google Drive periodic sync
Data should sync **periodically to Google Drive** and remain **editable directly in the Google Drive view**.

- **Open question**: does it make sense to store the data in **Google's new OKF format**, using it to get concurrent editing and versioning for free?
- No approach is chosen yet — decide in a dedicated brainstorm before implementing.

### 3.4 [ ] [Brainstorm] GDPR Client Consent Tracking & Email Trigger
To support cloud sync and GDPR Article 9 compliance, personal trainers (as Data Controllers) need verifiable client consent before syncing health and training notes to external storage.
- **Client Profile Checkbox:** Add a `gdprConsent: { cloudSync: boolean, timestamp: string }` flag to the `Client` data model and a simple `[ ] Client consented to cloud sync` checkbox inside the client profile modal (`clientsView.js` / `formsController.js`).
- **Sync Safety Lock:** If `cloudSync` is false, exclude that client's profile and session logs from cloud backup payloads (or warn the PT).
- **Email Consent Trigger (`mailto:`):** Add a `✉ Send Consent Form` button on the client profile that launches a pre-populated `mailto:` link (`client.email`) with a standardized informative consent letter explaining data storage, encryption, and GDPR rights, requesting an "I CONSENT" email reply.
- **AI / LLM Safe Copy Button:** Add an `AI Safe Copy (Anonymized)` action on client history/routine views that copies a PII-stripped Markdown summary (swapping name/email for `Client #UUID`) to the clipboard so PTs can safely query LLMs without leaking personal data.

---

## 4. UI / UX

### 4.1 [ ] Theme redesign
- **Light mode** needs a nicer design, along the lines of: <https://claude.ai/code/artifact/f27dc4ca-e1b4-47dd-b3c6-34dee3d6110c>
- **Dark theme** should be improved in the same pass.
- Constraint: both themes must keep working from the CSS custom properties in `index.css` — no hard-coded theme colours.

### 4.2 [x] Constant header line
The **title/header line should stay constant** when switching between the clipboard, session management, and other views — it should not jump or re-flow between contexts.

- **Done**: the active-session overlay no longer carries its own duplicate `.app-header`; the single `.app-header` is now omnipresent (the overlay starts below it via `top: var(--hdr-height)`). The clipboard gained a `.session-title-bar` context line — `date time location` (e.g. `2026-07-17 10:00 Trib gym base`) — and the countdown timer moved onto it. This also removed the duplicate element IDs (`btn-collapse-session`, `overlay-session-duration`, …) the two headers shared.
- Deep-link URLs that match no route now show an in-app not-found view (`#view-error`) that keeps this header in place, rather than silently redirecting to today.

### 4.3 [ ] Collapse the duplicated session header into one row, with a date picker
There are currently **two title rows** above the session list. The second row — the per-column header with the calendar icon and the `Today` label (`.sessions-column-header`) — is redundant now that the deck shows a single column and the title bar already names the day.

- **Done**: the redundant second row is **removed** — all four `.sessions-column-header` `<h4>`s (Yesterday/Today/Tomorrow/Upcoming) were static HTML with no JS regenerating them, so deleting them from `index.html` drops the row permanently; the day-column now starts directly with the first session card below the title bar. (This also cleared the untranslated "Today" label the row showed under the SL locale.) The **date-picker** half below is still open and blocked on the dated-bookings data-model decision.
- **Remove** the second row (the column header with the icon and `Today`/`Yesterday`/`Tomorrow`/`Upcoming` label).
- In the remaining title row, make the **calendar icon clickable**, opening an overlay with a **date picker**.
- The picker **must accept a typed date** — no scrolling back through years to reach a past date.
- Note: the removed header is what colour-codes each bucket (purple/cyan/muted/emerald). If that signal is worth keeping, it has to move into the title bar.

> **⚠ Blocking design gap — settle before implementing.** Bookings currently have **no date**. They carry a relative bucket only (`day: 'yesterday' | 'today' | 'tomorrow' | 'upcoming'`, see `mockData.js`), and the title bar *derives* dates live from `new Date()`. That is exactly why the demo keeps working on any day without reseeding. A date picker implies **jumping to an arbitrary date**, which the four-bucket model cannot represent — picking `2025-03-04` would have nothing to show. Choosing a real date field is a **data-model migration** (existing `localStorage` databases included) and it would end the self-following demo behaviour. Decide the model first: real dates, or a picker restricted to the four buckets?

### 4.4 [x] Horizontal client names in the clipboard
Lay the client/participant names out **horizontally in the clipboard to save vertical space**, rather than stacking them.

- Must not cost sub-second participant switching — the tap targets stay gym-floor sized.
- Interacts with **[1.2 Simultaneous sessions merged into one clipboard](#12-simultaneous-sessions-merged-into-one-clipboard)**: a merged view carries more participants, so decide the two layouts together.

### 4.5 [x] Rename the session launch action
Rename **"Launch Clipboard"** / **"Začni sledenje"** to something closer to **"Podrobnosti seje"** (session details).

- Affects `btn_launch_clipboard`, `btn_launch_clipboard_short`, and `btn_start_session` — EN + SL dictionaries must stay at parity.
- The label should read as opening the session's details, not as starting a stopwatch.

### 4.6 [x] Header control height harmonization
Make all header interactive elements (`.sync-backup-btn` cloud button, `#btn-app-menu` hamburger button, `.header-select` language and theme dropdowns, and `.logo-area` app brand) share a consistent `height: 44px` across both desktop and mobile views.

### 4.7 [x] Sessions title and date picker typography alignment
Ensure `#calendar-title` and `#calendar-title-date` within the `.sessions-date-picker` match the `font-family: var(--font-header)` (`Outfit`), weight (`800`), and letter-spacing (`-0.5px`) of the `Sessions` view header (`h2.view-title-label`) across both desktop and mobile layouts.

### 4.8 [ ] Split `#view-clients` into three first-class views (Sessions / Pending Adjustments / Client Directory)
Feature request by Simon, triggered by a report that the `<hr class="view-divider">` spacing between "Client Directory ↔ Pending Plan Adjustments" still doesn't match "Pending Plan Adjustments ↔ session list" even after the [13.4](#134-x-timer-stack-global-visibility--click-to-focus--freeze-on-finish)-adjacent top-margin fix. Rather than keep chasing per-divider spacing parity, **stop merging the three into one view**:

- Today `#view-clients` (`src/index.html` ~line 143) bundles: the session list (`#sessions-categories-grid`), **Pending Plan Adjustments** (`#dashboard-adjustments-list`), and **Client Directory** (`#clients-list` + search). Two `<hr class="view-divider">`s currently seam them together.
- **Target**: the **homepage keeps only the session list**. Pending Plan Adjustments and Client Directory each become their own top-level `<section class="app-view">` with their own route (today `/clients` is a legacy alias that just redirects to `/sessions/{today}` — it needs to become the real Client Directory route instead), reachable from the ☰ menu the same way Routines/Exercises/History already are (`menu-routines`/`menu-exercises`/`menu-history` in `src/components/applicationHeader.js`).
- **Status**: not started (paused before implementation). A reconnaissance pass is done — findings below — so resuming shouldn't need to re-survey.

**Reconnaissance findings (resume from here):**

- **Routing** (`app.js` `handlePathChange()` ~624-698): `/clients` is bucketed with `/` and `/index.html` (~679-686) and immediately `replaceState`'d to `/sessions/{today}` — there is no dedicated `/clients` branch today. `/routines`, `/exercises`, `/history` (~687-698) each do a plain `switchView("<name>")` into their own already-dedicated section — that's the pattern the new `/adjustments` and real `/clients` routes should copy. `/clients/{clientId}` (client detail) is a separate, already-correct route, untouched by this.
- **Four call sites treat `/clients` as "go home"**, not "open the directory" — `app.js:479` (logo click), `app.js:487` (error-view home button), `app.js:495` (client-detail back button), `applicationHeader.js:155` (header logo click). Once `/clients` becomes the real Client Directory route, all four need to retarget to `/` (or `/sessions/{today}`) or they'll silently start opening the directory instead of home.
- **Nav entry point**: `menu-clients-register` (`applicationHeader.js:230-239`) currently does `navigateToPath("/clients")` + a `setTimeout` scroll-into-view hack to reach `.view-header` inside the merged view. Once Client Directory is its own route, drop the hack and match the existing `goto(route)` helper used by `menu-routines`/`menu-exercises`/`menu-history` (`applicationHeader.js:241-247`). A new `menu-adjustments` item follows the same pattern for `/adjustments`. New menu buttons go in `index.html:100-112`; labels need i18n keys (EN+SL parity is test-enforced).
- **Render functions need no changes** — `renderPendingPlanAdjustments()` (app.js:795), `renderClientsList()`/`clientsViewRender` (app.js:819, `views/clientsView.js`), and `renderSessions()`/`sessionsViewRender` all resolve their containers by absolute element id (`getElementById`), never scoped through `#view-clients`. Same for `focusSessionsColumn` (`components/daySelector.js`) and `focusActiveSessionCard` (app.js). Relocating the markup into new `<section>`s is safe for all of these as-is.
- **`switchView()` (app.js:503-537)** only toggles `.active` on `#view-${viewId}` — no dependency on `#view-clients`'s internal structure — except one special case: `if (viewId === "clients") requestAnimationFrame(() => focusSessionsColumn(...))`. That branch needs to move/duplicate onto whichever id the sessions-only home view keeps. (Also confirmed dead code in the same function: `.header-nav`/`.bottom-nav .nav-item` nav highlighting has zero matching markup anywhere in `index.html` — pre-existing, unrelated to this split, not a blocker.)
- **CSS**: exactly one `#view-clients`-scoped rule exists, `#view-clients .view-header { margin-top: 24px; }` (`index.css:509-511`, the fix from this same conversation). It must move to whichever section keeps the Client Directory `.view-header` — and worth re-checking whether it's even still needed once there's no `.view-divider`/Pending-Adjustments section sitting directly above it. Everything else touching this content (`.sessions-categories-grid`, `.grid-list`, `.view-header h2` typography) is class-based, not id-scoped, so it carries over unchanged.
- **Silent-breakage risk**: `src/i18n/domMappings.js:34` has `"#view-clients .view-header h2": "clients_title"` — `applyStaticDOMMappings()` runs on boot and every language switch; if that `<h2>` moves to a new section without updating this selector, the "Client Directory" heading **silently stops translating** (no error, just a no-op querySelector) rather than throwing. Easy to miss — check this explicitly when moving the markup.
- **Tests**: `test_clients_directory.py` and `test_plan_adjustments.py` assert entirely via absolute element ids (`#clients-list`, `#search-clients`, `#dashboard-adjustments-list`, `#badge-adjustments-count`) so content assertions keep working, but every test currently lands on the content by going to home — each needs a navigate-to-`/clients`-or-`/adjustments` step inserted once those routes stop aliasing home. `test_header_menu.py:25` clicks `#view-clients .view-header h2` purely as "a neutral element to dismiss the menu" — that locator breaks once the `<h2>` moves; retarget it (e.g. the sessions title bar `h2#sessions-view-title`). **Biggest single decision**: ~20 `wait_for_selector("#view-clients.active")` calls across 6 other test files (`test_session_reload_follows_id.py`, `test_error_view.py`, `test_first_run_terms.py`, `test_share_deeplink.py`, `test_theme.py`, `test_sync_backup.py`) use it purely as a generic "app booted to home" signal with zero interest in directory/adjustments content — **keeping the trimmed sessions-only home view's id as `view-clients`** (even though it'll only hold sessions) avoids touching any of them; renaming it means updating all ~20 in lockstep. No existing test exercises `menu-clients-register` at all, so there's no coverage to fix there, but also no safety net — new nav-entry tests would need to be written from scratch.

---

## 5. Client Detail

### 5.1 [ ] Tabbed client view
Clicking an individual client opens a **tabbed** view (today it opens a single flat profile screen, `view-client-detail`):

NOTE: keep the goals and health & injury notes as is, remove "log workout session" button.

| Tab | Content |
| :--- | :--- |
| **1 — Sessions** | The sessions this person attended. |
| **2 — Exercises** | A **chronologically ordered** list of every exercise the person **has done or will do**, with **no grouping or restriction by session** — one continuous timeline across their whole history and future plan. |
| **3 — Next session prep** | Where the trainer **creates new cards** for the next planned session, **or** for a generic **"placeholder session" that is not yet on the calendar**. |

- Tab 2 is a genuinely new projection of the data: exercises currently only exist *inside* sessions/routines, so this needs a flattened, date-ordered view spanning logged history **and** planned future work.
- Tab 3 introduces a **session that exists without a calendar entry**. Decide where such a placeholder session lives in the data model, and what happens when it is later attached to a real booking.
- Reuses the existing placeholder-card concept from [uc1_gym_floor_clipboard.md](file:///home/simon/Projects/LibrePT/use_cases/uc1_gym_floor_clipboard.md), but at the desk rather than on the gym floor — closes the loop with [uc2_async_plan_adjustments.md](file:///home/simon/Projects/LibrePT/use_cases/uc2_async_plan_adjustments.md).

---

## 6. Housekeeping

### 6.1 [x] Remove body-weight tracking (for now)
Strip **client body-weight tracking** from the app for the time being.

- **Done (hide, not delete)**: the open question is resolved in favour of *hiding*. The body-weight **UI** is fully gone — the weight chart, the `client-weight` input, and the `client-weight-pill` were removed from `index.html`/`app.js` in an earlier pass; this pass swept the remaining dead artifacts: the stale `staticMappings` entry for `label[for="client-weight"]` (`app.js`), the now-unused `current_weight` label from **both** dictionaries (EN + SL parity preserved), and the orphaned `.client-weight-pill` CSS rule.
- The `weightHistory` field is left **dormant** on the client model (seed + new-client creation) rather than deleted. Nothing reads or writes it now, so no body weight can be entered, but existing `localStorage` records keep their data and re-enabling the feature stays a UI-only change. Exercise **load** (`session-add-weight`, `adjust-weight`, `weightTarget`, Load Up/Step Back) is untouched, as required.

> **⚠ Do not confuse the two kinds of "weight".** The codebase uses `weight` for **two unrelated things**, and only the first is in scope here:
> - **Body weight (in scope — remove)**: `weightHistory` on clients (`mockData.js`), the weight chart (`.weight-chart-container`, `index.html`), the `client-weight` input and its `current_weight` label (EN + SL), and the `client-weight-pill` on the client profile (`app.js`).
> - **Exercise load (out of scope — keep)**: target load per set, `session-add-weight`, `adjust-weight`, and the "Load Up Next / Step Back" progression signals. These are core to [uc1_gym_floor_clipboard.md](file:///home/simon/Projects/LibrePT/use_cases/uc1_gym_floor_clipboard.md) and [uc2_async_plan_adjustments.md](file:///home/simon/Projects/LibrePT/use_cases/uc2_async_plan_adjustments.md) and **must not be touched** (~16 call sites).

- Removing `current_weight` means dropping it from **both** dictionaries — the test suite enforces EN/SL key parity.
- **Open**: is this a removal or a hide? Existing `localStorage` databases already hold `weightHistory`. Decide whether to migrate it away (destructive, loses real client data) or simply stop rendering it, so the data survives if the feature returns. "For now" argues for hiding rather than deleting.

### 6.2 [~] Extract use cases and usage scenarios from the tests
The Playwright suite already drives real end-to-end flows (gym-floor clipboard launch, voice notes, feedback → adjustment wizard, day-deck navigation, swipes). Those flows are **executable usage scenarios** that are currently documented nowhere.

- Extract the scenarios the tests actually exercise and **document them properly** in [use_cases/](file:///home/simon/Projects/LibrePT/use_cases/), following OKF (frontmatter + `INDEX.md` row + graph links).
- Reconcile against the existing UC1–UC4: some tested behaviour is already specified, some (the session day deck) is not, and some specified behaviour has no test — the gaps in **both** directions are the interesting output.
- Goal: tests and use cases describe the same system, so a scenario can be traced from spec to the test that proves it.

- **Partly done**: the biggest gap the tests exercised but no UC specified — the **session day deck, deep-linkable views, and the not-found flow** — is now written up as **[UC5](file:///home/simon/Projects/LibrePT/use_cases/uc5_session_day_deck_and_deep_links.md)** (OKF frontmatter + both INDEX rows + graph links to UC1/UC2/UC4), including a **spec↔test traceability table** mapping each scenario to `test_sessions_dashboard.py` / `test_session_deeplink.py` / `test_error_view.py` / `test_clipboard.py`.
- **Still open**: (a) the reverse gaps — UC1/UC2 behaviour (voice notes, the feedback→adjustment wizard, plan pivots) that has partial or no test coverage; (b) whether the newer app-surface flows (themes, header menu, first-run terms, sync/backup) each deserve a UC or belong in README feature docs. The interesting reconciliation of *specified-but-untested* is not yet complete.

---

## 7. Feedback Loop

### 7.1 [ ] [Brainstorm] One-click resolve for pending plan adjustments
Pending plan adjustment reminders — **do we allow a 1-click resolve?**

- Tension to resolve: one-tap resolution fits the low-interaction principle, but plan adjustments are exactly the decisions that deserve deliberate review at the desk ([uc2_async_plan_adjustments.md](file:///home/simon/Projects/LibrePT/use_cases/uc2_async_plan_adjustments.md)).

---

## 8. Clipboard Interactions

### 8.1 [ ] Bind multiple clients to one shared set of exercises
Allow **two or more participants to be bound to the same set of exercises**, merging their tabs into a **single combined view** in the clipboard (they train the identical programme in lockstep, so the trainer logs the shared plan once instead of switching tabs per person).

- The **exercise cards are shared** across the bound clients; navigating/logging the plan advances it for the whole group.
- **Feedback stays per-person**: `Too Easy` / `Too Hard` / voice notes must still record against the **individual** client, not the group — one client can find a shared set too hard while another finds it too easy.
- Decide the data model: a per-client `clientRoutines[clientId]` today owns its own `exercises` + `logs`. Binding needs either a shared exercise reference with per-client log/feedback overlays, or a "group" pseudo-participant that fans feedback back out to members.
- Interacts with the merged-session view ([1.2](#12-simultaneous-sessions-merged-into-one-clipboard)) and the horizontal participant tabs — a bound group should read as one tab, expandable to its members.

### 8.2 [x] Rename "Cancel" → "Delete Session" and make it harder to reach
The clipboard's **Cancel** button (bottom-left) discards the active session with no history saved. Rename it to **"Delete Session"** to say what it actually does.

- It is currently **too easily accessible** for a destructive, unrecoverable action sitting next to "Complete Workout Session". Move it out of the primary action row (e.g. behind an overflow/⋯ menu, a long-press, or a secondary confirm step) so it can't be hit by accident mid-set.
- Keep the existing confirm dialog, but tighten the wording now that logging is one-tap (no per-set grid): it discards the session's completions and feedback.

### 8.3 [ ] Inline Clipboard Editor (Saved Patch: `patches/inline_clipboard_editor.patch`)
An on-the-fly edit mode for the active session clipboard (`src/components/clipboardEditor.js`), saved as an unstaged patch (`patches/inline_clipboard_editor.patch`) so it can be cleanly reviewed/applied after core refactoring passes.
- When the trainer taps a card's edit (✎) affordance (`.deck-card-edit`), the deck flips into an inline editable list (`renderClipboardEditor`).
- Allows swapping exercises, retargeting sets/reps/weight, reordering rows via tap or drag (`.editor-reorder`), adding new exercises, and adjusting rest breaks directly inside the live session without leaving the gym floor.
- To apply later: `git apply patches/inline_clipboard_editor.patch`.

---

## 9. Interactive Demo / Guided Onboarding

The big new feature: a first-run onboarding that walks a new user through the app end-to-end with a simulated finger, instead of seeding demo data silently. Build in the phases below; each is committable on its own.

### 9.1 [x] App starts with NO data — DONE
On a fresh install the app now contains **no test/demo data at all** — empty client directory, no sessions, no active session. The old `seedMockData()`-on-empty fallback and the `SEED_VERSION` auto-seed guard were removed from `app.js init()`; seeding is now opt-in via the demo deep-link (9.2). Existing local data is loaded as-is and never overwritten.

- **Blocking ripple — resolved:** the suite stays green via a conftest bootstrap. `tests/conftest.py` autouse `seed_demo_data` injects `?init=demo_data_load` for `page`-fixture tests; own-context tests add the `demo_data_script` fixture; tests that verify the empty/clean boot opt out with `@pytest.mark.clean_start` (see `tests/e2e/test_share_deeplink.py`).
- Empty state renders cleanly. Still TODO: surface the "Run the demo" invitation on the empty dashboard (9.3).
- The in-app "Reset database" button (which re-seeded demo data) was removed as part of this — the Backup & Restore modal now offers only export/import. Returning to a clean slate is a manual storage clear (documented in README → *Resetting to a clean state*).

### 9.2 [~] Demo-data loader — PARTIAL
A demo loader exists: opening `?init=demo_data_load` (parsed in `src/helper/shareLink.js`, applied in `app.js init()`) populates the demo dataset, but **only when the app is genuinely empty** — it's ignored if any data is already present, so it never clobbers real records. It currently loads the **full** `src/data/` fixture via `seedMockData()` + `seedDemoActiveSession()`.
- **Still TODO:** narrow it to a focused **subset** (a few clients, one or two routines, today's sessions, the in-progress session) for the guided walkthrough, and expose it as a callable `loadDemoData()` invoked by the in-app demo activation (9.3) rather than only via the URL param.

### 9.3 [ ] "Run the demo" message / invitation
A message/notification (the first real use of the planned message area — see [11.1](#111--replace-the-footer-nav-with-a-message--status-area)) that **invites the user to run the demo end-to-end**.

- Shown **only when the app is empty** (9.1). Activating it loads the demo data (9.2) and starts the walkthrough (9.5).
- When the app already has data, don't offer the in-place demo — instead **offer to open the demo on the GitHub Pages instance** (`stutek.github.io/LibrePT/`).

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

## 10. Application Header Menu & First-Run Agreement

### 10.1 [x] Hamburger (☰) menu in the header
Add a hamburger/overflow menu to the app header (next to the Sync & Backup cloud button) with **placeholder** items:

- **Connect cloud storage** (placeholder → "coming soon").
- **Export all data as a file** (can open the existing Sync & Backup modal, which already has JSON export).
- **GitHub project** (link to `github.com/stutek/LibrePT`, opens in a new tab).
- **About** (modal: short app description + repo link).
- **Terms & disclaimer** (opens the modal from 10.2).

Wire it in `components/applicationHeader.js` following the existing `.session-menu` dropdown pattern (toggle + close-on-outside-click). Add i18n keys (EN + SL) for every label — the parity test enforces it. (A partial HTML draft was made and reverted; redo cleanly.)

- **Done**: the ☰ button + `#app-menu` dropdown ship next to the Sync & Backup control, wired in `setupAppMenu()` in `applicationHeader.js` (toggle + close-on-outside-click, mirroring `.session-menu`). Items: **Connect cloud storage** → "coming soon" placeholder; **Export data as a file** → opens the existing Sync & Backup modal; **GitHub project** → real new-tab link to the repo; **About** → `#dialog-about` (description + repo link); **Terms & disclaimer** → `#dialog-terms`. All labels are i18n keys (EN + SL, parity-clean) applied through `staticMappings`. Covered by `tests/e2e/test_header_menu.py`. The first-run auto-show + acceptance persistence is 10.2.

### 10.2 [x] First-run no-liability disclaimer + user agreement
A modal with a **no-liability disclaimer and user agreement**, shown **once on first run** (persist acceptance in `localStorage`, e.g. `librept_terms_accepted`), and also reachable from the header menu (10.1) any time. Keep the text concise ("provided as is, no warranty, not medical/professional advice, data stays local, use at your own risk") and translated to SL. First-run modal requires an "I agree" action.

- **Done**: `setupFirstRunTerms()` in `applicationHeader.js` shows `#dialog-terms` once when no `librept_terms_accepted` flag is stored. On first run the modal is **mandatory** — the ✕ is hidden (`.first-run` CSS) and Escape is blocked (`cancel` preventDefault) — so the only exit is **I agree**, which persists the flag and dismisses it. Concise disclaimer text is translated (EN + SL). Reopening from the ☰ menu behaves as a normal dismissable modal. Browser tests pre-accept via a conftest autouse fixture (`accept_first_run_terms`) so the overlay doesn't block other flows; `tests/e2e/test_first_run_terms.py` covers the first-run behaviour in its own context.

---

## 11. Navigation & Layout Redesign

### 11.1 [ ] Replace the footer nav with a message / status area
Replace the bottom navigation bar with the session-bar contents evolved into a **general message area**: current/upcoming session, client spot reservations in slots, customers cancelling their spot on a session, and the "run the demo" invite (9.3).

- Navigation (Clients / Routines / Exercises / History) needs a new home — proposal: a compact tab row **in the omnipresent header**.
- The message feed is priority-ordered: live session → next upcoming session → notifications (reservations / cancellations, tappable to the affected session).

### 11.2 [ ] Active-session overlay → a normal `#view`
Fold the full-screen active-session overlay (`#active-session-overlay`) into a normal `#view-session` inside `#main-content`, like the other views — now that the header is omnipresent and sits above it, the fixed-overlay special-casing is redundant. Consistent view/router handling; simplifies the deck/tabs/title-bar wiring.

---

## 12. Documentation, Tests, OKF & Housekeeping

### 12.1 [x] OKF review (`okf.yaml`)
Review and update the Open Knowledge Format descriptor to reflect the current architecture (i18n externalized to `src/i18n/`, the component split under `src/components/`, `build/`+`deploy/` packages, the deep-link routing, the 5-theme system).

- **Done**: `okf.yaml`'s `description` now reflects the vanilla ES-module app under `src/` (per-entity `src/data/`, externalized `src/i18n/`, extracted `src/components/`), the 5-theme CSS-custom-property system, deep-link routing, and the `build/`+`deploy/` chain, with a header comment pointing at `INDEX.md`. Kept schema-minimal (no invented OKF fields, since the spec's optional field set wasn't verifiable).

### 12.2 [x] Documentation pass
Sweep README / CONTRIBUTING / INDEX / AGENT_RULES for staleness after the recent refactors (e.g. README's codebase tree still lists `mockData.js`; ensure all features — themes, deep links, sync/backup, dev server, build/deploy — are documented and accurate).

- **Done**: README codebase tree rewritten for the `src/` layout (dropped the removed root files and `mockData.js`, added `data/`/`i18n/`/`components/`); README + CONTRIBUTING now describe the 5-theme system (was "Emerald & Zinc"); CONTRIBUTING points i18n at `src/i18n/` (was `app.js`) and its test table reflects the `tests/unit/` + `tests/e2e/` split. INDEX/AGENT_RULES had no `mockData` staleness. (Deeper API-vision lines like the aspirational Firebase/Capacitor stack left as-is.)

### 12.3 [~] Test completeness
Broaden coverage: themes (switch + persistence), the Sync & Backup modal + mock counters, the header menu + first-run agreement (10.x), the not-found view is covered but the demo walkthrough (9.x) will need its own tests. Confirm every extracted component has at least one exercised path.

- **Done**: added `tests/e2e/` suites for themes (`test_theme.py`), the Sync & Backup badge + modal (`test_sync_backup.py`), the ☰ header menu (`test_header_menu.py`), the first-run terms agreement (`test_first_run_terms.py`), the plan-adjustments deck + Apply wizard (`test_plan_adjustments.py` → covers `planAdjustments.js`), and the Client Directory grid + live search (`test_clients_directory.py` → covers `clientsDirectory.js`). Suite is 22 → 46 tests, all green.
- **Still open**: the demo walkthrough (9.x) isn't built yet, so it has no tests; and a couple of components (e.g. voice-note capture inside the clipboard) are still only exercised by the legacy `tests/test_browser.py` rather than a focused `tests/e2e/` suite.

### 12.4 [x] TODO.md contents review
Reconcile this file with what actually shipped (e.g. **3.2 Git-style change counters** is effectively done via the mock ahead/behind sync badge; **4.2 Constant header line** is done and the active-session overlay no longer duplicates the header). Tick off completed items and prune stale ones.

- **Done (this pass)**: ticked **3.2** (the ahead/behind sync badge ships). Verified the remaining `[ ]` items are genuinely outstanding: 1.x scheduling, 4.1 theme redesign, 4.3 date-picker (blocked on the dated-bookings data-model decision), 5.1 tabbed client view, 6.1 body-weight removal, 7.1/3.3 brainstorms, 8.1 bound clients, 9.x demo, 10.x header menu, 11.x nav redesign, 12.1–12.3/12.5. No further silently-shipped items found.

### 12.5 [ ] Local git housekeeping (trademark refs)
The trademark was scrubbed from history and force-pushed (remote is clean). Still pending **locally**: expire the reflog and `git gc --prune=now` the old pre-rewrite objects (`refs/original/…` and any leftover backup branch) so the old blobs are purged from the local clone.

- **Status**: no `refs/original/…` refs and no leftover backup branch remain (only `main` / `origin/main`); the old blobs survive only via reflog entries. The purge is a single command the maintainer should run manually — it was blocked when attempted from the agent because reflog expiry is irreversible:

  ```bash
  git reflog expire --expire=now --all && git gc --prune=now
  ```

### 12.6 [ ] Web Documentation for GDPR, AI Safety & Consent Templates
Delegate lengthy legal explanations and templates to external web documentation (`docs/` or `stutek.github.io`), keeping the in-app UI clutter-free.
- **PT Data Controller Guide:** Create a concise guide explaining why PTs are Data Controllers under GDPR Art. 4(7)/Art. 9, how client-side E2EE works during cloud sync (`PBKDF2` + `AES-GCM`), and why pasting identifiable client health notes into LLMs violates privacy laws.
- **Downloadable/Printable Intake Templates:** Host the full text of the Informative Consent Letter (`docs/templates/Client_Consent_Form.md`) for physical paper signing or custom adaptations.
- **In-App Footnote Links:** Link to this web guide from `#dialog-terms`, the About modal, and the Cloud Sync setup screen.

### 12.7 [ ] Unify local runs and CI so lint/format failures surface locally, not just on push
Discovered live: the GitHub Pages deploy (`.github/workflows/deploy.yml`) had been **failing silently for 3 pushes / 2 days** because `run_lint()` (`build/__init__.py`) failed its Ruff format-check step on 8 already-committed `tests/` files, and Biome flagged formatting/import-order issues in `src/` from the same session — none of it visible until Simon checked the Actions log by hand.

- **Root cause**: `pytest` (what gets run locally to check behaviour) and `run_lint()` (Ruff + Biome, what CI runs to gate the build) are two totally disconnected commands — running the test suite green gives no signal about lint/format state, and nothing prompts running `run_lint()` before a push. Compounding it: `deploy.yml`'s `build` job never runs `pytest` at all, only lints `tests/` as text — so there is currently **no CI step that actually executes the test suite**.
- **Fix shape**: (a) a single local command (`make check` / `python -m build check` / a documented one-liner in CONTRIBUTING.md) that runs `run_lint()` + `pytest` together, so "did I break anything" has one answer instead of two; (b) consider a pre-commit or pre-push git hook running the same; (c) decide whether `deploy.yml` should also run `pytest` before `Assemble dist` — right now a red test suite would still deploy successfully as long as lint passes.

---

## 13. Exercise Library & Movement Taxonomy (Call to Action & Vision)

> **Status (2026-07-21):** the taxonomy pivot and all three §13.2 selection scenarios are **built** and
> covered by [UC6](use_cases/uc6_exercise_taxonomy_and_picker.md) / `tests/e2e/test_exercise_taxonomy.py`
> + `tests/e2e/test_reps_and_load.py`. Exercises carry `equipment` + `pattern`; the catalog shows
> taxonomy badges (no instructions); the filtered picker powers routine building and gym-floor swaps;
> custom creation enforces muscle group + equipment + pattern; reps/load are polymorphic. **Still open:**
> seeding/mapping from an open standard (wger / ExRx) for interchangeable exports (§13.1 last bullet).

### 13.1 [~] [Brainstorm / Call to Action] Repurpose `exercisesView` from "Beginner Encyclopedia" to "Professional Movement Taxonomy"
**The Core Insight:** A certified, professional Personal Trainer (`LibrePT`) knows all exercises by heart. They do not need lengthy `"instructions"` paragraphs, beginner descriptions, or how-to tutorials on their screen, nor do they ever hand their working device over to a client mid-session.
- **Call to Action**: Remove/deprecate bulky instructional text blocks from `exercisesView.js` (`ex.instructions`) and exercise cards. The UI must pivot from an "encyclopedia for gym beginners" into a **high-density, professional movement taxonomy inspector and fast-selection tool**.
- **The True Purpose (Referential Integrity)**: The Exercise Catalog exists in software to provide immutable IDs (`exerciseId`), equipment tags (`Barbell`, `Cable`, `Dumbbell`, `Bodyweight`), and anatomical/biomechanical categories (`Primary/Secondary Muscle Groups`, `Horizontal Push/Pull`, `Hip Hinge`). Without strict taxonomy, aggregating long-term volume load or plotting estimated 1RM curves across months of client history is impossible.
- **Adopt Open Standards**: Map or seed the base catalog from an established, open-source sports science taxonomy (e.g., **wger Workout Manager API / dataset** or **ExRx** classifications) to guarantee that LibrePT exports (`.json`/`.csv`) are universally interchangeable with external research, performance tracking, and coaching tools.

### 13.2 [x] Usage Scenarios for the Professional Exercise Catalog
Define and build towards the three concrete ways a personal trainer actually interacts with the exercise catalog:

1. **Scenario A: Rapid Routine & Program Builder (Template Assembly)**
   - **Context**: The PT is at their desk or preparing next week's block for a client (`routinesView.js` or Next Session Prep).
   - **Action**: Instead of typing free-text names (`"DB Bench"` vs `"Dumbbell Bench Press"`), the PT filters the catalog by *Equipment* and *Muscle Group* and clicks to drop standardized movement IDs into the workout template.
   - **Benefit**: Zero string-matching errors; clean, automated long-term historical analytics across all clients and routines.

2. **Scenario B: On-the-Fly Equipment & Injury Substitution (Gym Floor)**
   - **Context**: During a live session on the gym floor (`launchClipboardDirectly`), the cable station is occupied, or the client feels shoulder discomfort on a Barbell Overhead Press.
   - **Action**: The PT opens the quick-substitute picker (`exercisesView`), filters for *Target = Shoulders* and *Equipment = Dumbbell / Machine*, and swaps the movement in under 3 seconds.
   - **Benefit**: Session momentum is preserved without breaking historical tracking (the substitute inherits the correct muscle-group volume bucket).

3. **Scenario C: Custom Exercise Creation vs. Taxonomy Integrity**
   - **Context**: The PT coaches a proprietary rehab drill or specialized variation (*"Landmine Curtsy Lunge with Isometric Hold"*).
   - **Action**: To prevent ad-hoc text from destroying data hygiene, custom creation enforces one of two strict rules:
     - *(Option 1 - Modifiers)*: Select a standard parent movement (`Base: Lunge`) and attach specific **Modifiers** (`Tempo: 3-1-X-0`, `Stance: Curtsy`, `Attachment: Landmine`).
     - *(Option 2 - Strict Inheritance)*: If creating a brand-new entity ID, the PT is required to tag its **Target Muscle Group** and **Biomechanical Movement Pattern** so high-level volume analytics continue working seamlessly across the whole client roster.

### 13.3 [ ] Conditioning metrics: extend the reps/load model beyond sets × reps × kg
Some movements are not `sets × reps × load`. A **conditioning/cardio machine** (assault bike, rower, ski-erg) is **time-bound** (go for 60s), **calorie-bound** (20 cal), or **power-bound** (hold 200 W) — often a mix. Today [helper/repsAndLoad.js](file:///home/simon/Projects/LibrePT/src/helper/repsAndLoad.js) already makes reps polymorphic (count / range / `30s` time / `max`) and load equipment-derived (kg / level / band / bw), so the seam exists. Extend it with a **metric type** per exercise (derived from equipment/pattern, e.g. `Cardio` → target is `time | calories | watts | distance`) so the focus card and the plan editor author and log the right unit, and the **exercise timer** (see the clipboard timer stack in [exerciseAndRestTimer.js](file:///home/simon/Projects/LibrePT/src/components/exerciseAndRestTimer.js) / UC1) can be the primary logging surface for time-bound work. Keep the raw authored value stored and derive meaning at render time, as reps/load already do. Relates to UC6 and the timer stack.

### 13.4 [x] Timer stack: global visibility + click-to-focus + freeze-on-finish
Priority feature request by Simon: *"can you keep active timers on all views? and clicking the timer should bring focus back to the specific card owning the timer"*

- **Done**: `#clipboard-timer-stack` moved out from inside `#active-session-overlay` to a `<body>`-level sibling ([exerciseAndRestTimer.js](file:///home/simon/Projects/LibrePT/src/components/exerciseAndRestTimer.js)), so active timers now stay visible on every view, not just the live clipboard.
- Timers now carry `sessionId` + `focusRef` (`{ type: 'exercise'|'superset', id }`); tapping a timer card navigates to that card's deep link (`/session/{id}/client/{id}/exercise|superset/{id}`) and the existing exercise-deck auto-scroll brings it into focus.
- Follow-up from the same conversation: finishing a superset now **freezes** (not closes) any timer still running against it — held at its final value, dimmed, green ack-blink — so the trainer must still dismiss it via ✕ rather than it vanishing or ticking into overtime for finished work (`stopTimerIfMatches` in the same file).

### 13.5 [ ] [Defect] `test_timer_survives_reload_and_goes_overtime` fails — pre-existing, not caused by 13.4
`tests/e2e/test_timer_stack.py::test_timer_survives_reload_and_goes_overtime` fails on current `main`. Confirmed **pre-existing**: reproduces identically on the commit immediately before the 13.4 work started (checked via an isolated worktree), so this predates today's session.

- **Symptom**: after rewinding a timer's `endTime` into the past and reloading, the card never gets the `.overtime` class (`assert 'overtime' in 'timer-card count-up'` fails).
- **Root cause**: `_start_a_timer()` clicks `#active-exercise-scroll-deck .deck-card-timer` — the first exercise in current demo data (`routines.js`, the Tri-Set Metabolic Conditioning superset's first item) has `workDuration: 0`/no prescribed duration, so it now starts a **count-up** (stopwatch) timer, not a countdown. Count-up timers have no "past zero" state — `overtime` is countdown-only — so the test's premise no longer matches what that button starts. Likely went stale when the count-up timer feature (commit `301bc08`) shipped without updating this test or picking a different demo exercise with a real duration.
- **Fix shape**: either point the test at an exercise/control with a real `workDuration`/`rest` (so it starts a countdown timer), or add a dedicated helper that starts a countdown explicitly rather than relying on whichever exercise happens to be first in focus.

### 13.6 [ ] [Defect] Nebula theme: timer protected-warning flash reads faster than in other themes
The `.timer-card.flash-warning` "still running, refused reset" blink (`timerFlashWarn` keyframe, `index.css`) is a fixed `1s` animation — same declared duration in every theme — but under the **Nebula** theme it visually reads as noticeably faster/shorter than in the others.

- Not yet root-caused (not investigated this pass, logged as reported). Prime suspect: the keyframe blends to `color-mix(in srgb, #f59e0b 35%, var(--card-bg))` — Nebula's `--card-bg` (`rgba(24, 21, 52, 0.9)`, a dark violet) may sit close enough to the amber warning color, or close enough to Nebula's base card tone, that the mid-animation peak is less perceptually distinct, making the *whole* 1s blink feel like it flashes and resolves faster even though the timing is identical across themes. Needs a side-by-side capture across all 5 themes to confirm before touching the animation/color-mix values.

---

## 14. Phase 5 Refactoring: DRY & Complexity Reduction

### 14.1 [x] Extract Touch/Swipe Gestures (`src/controllers/gestureController.js`)
- `src/app.js` currently holds **196 lines** of touch/swipe gesture handlers (`touchstart`, `touchmove`, `touchend`, `handleSwipeBetweenDays`) for navigating the sessions day deck and title bar actions.
- Extract this self-contained subsystem into a dedicated controller module (`src/controllers/gestureController.js`) to decouple touch input logic from the application entrypoint.

### 14.2 [x] Extract DOM i18n Static Mappings (`src/i18n/domMappings.js`)
- `src/app.js` contains a **160-line** static lookup table (`staticMappings`) that binds CSS selectors (`'button[data-view="history"] span': 'tab_history'`, `#sessions-view-title`, etc.) to localization keys.
- Move `staticMappings` into a dedicated file under `src/i18n/domMappings.js` and import it during boot (`applyTranslations`) so `app.js` stays strictly focused on initialization and routing.

### 14.3 [x] Drop Legacy `window` Bridge Wrappers in `src/app.js`
- `app.js` retains **122 lines** of global wrapper proxies (`window.openRoutineEditorModal`, `renderSessions`, etc.) created during the transition to modular views.
- Now that `src/views/` and `src/controllers/` are clean ES modules, directly import and wire their callbacks in event listeners and drop the redundant proxy wrappers entirely. Combining 14.1, 14.2, and 14.3 will reduce `app.js` from 925 lines down to ~447 lines.

### 14.4 [x] Create DOM/Modal Helper Utility (`src/helper/dom.js`)
- Across `src/`, there are **227 occurrences** of `document.getElementById` and repeated boilerplate for opening, resetting, and closing `<dialog>` modals (especially dense in `formsController.js` with 51 queries and `feedbackModal.js` with 30 queries).
- Introduce a lightweight DOM utility (`openModal(id, { reset: true })`, `closeModal(id)`, `$id(id)`) to eliminate null-check boilerplate and unify dialog lifecycle management across all controllers and components.

### 14.5 [ ] Split the monolithic shared files to avoid same-file co-edit conflicts
- **Motivation:** two features touched in parallel (the active-session *plan editor* and the *home/notification-area* redesign) repeatedly collided in the same few god-files, forcing manual hunk-by-hunk staging to keep unrelated work apart. Good modularization should make concurrent feature work conflict-free by default.
- **Worst offenders (single files every feature edits):**
  - `src/index.css` — one giant stylesheet; every component appends here. Split into per-component CSS (co-located or `src/styles/<component>.css`) and load/concatenate at build time, so editing the plan editor never touches the same file as the notification area.
  - `src/index.html` — one document holding every view, overlay, dialog, and the floating timer. Extract per-view/overlay/dialog HTML partials (or render them from JS) so structural edits localize.
  - `src/i18n/en.js` & `src/i18n/sl.js` — flat single-object dictionaries; every string lands in the same file. Consider per-feature namespaced string modules merged into the locale (keeping `test_i18n_parity` green).
- **Guardrail:** the modular-file rule already exists for JS (AGENT_RULES §5); extend the same "one responsibility per file, edit-in-parallel-without-collision" principle to CSS, HTML, and i18n.

---

## 15. Phase 6: PWA Resilience, Mobile UX & Performance Optimizations

### 15.1 [x] Update Service Worker Caching & Offline Resilience (`src/sw.js`)
- Add newly extracted core modules (`./controllers/gestureController.js`, `./helper/dom.js`, `./i18n/domMappings.js`, `./helper/utils.js`) to `ASSETS` in `src/sw.js`.
- Add Font Awesome `.woff2` font files to `ASSETS` (or local cache rules) so icons never fail when requested offline in a gym without cellular signal.
- Bump `CACHE_NAME` to `'librept-v10'` to trigger the `activate` event and purge stale caches across client devices.

### 15.2 [x] Integrate Screen Wake Lock API (`navigator.wakeLock`)
- In `src/controllers/activeSessionController.js`, request `navigator.wakeLock.request('screen')` when `startWorkoutSession` initiates or resumes an active workout.
- Release the screen lock automatically during `finishWorkoutSession` or `cancelWorkoutSession`, preventing mobile screens from dimming or locking mid-workout while PTs are coaching.

### 15.3 [x] Add Module Preloading & Rendering Optimizations (`src/index.html` & `src/index.css`)
- In `src/index.html`, add `<link rel="modulepreload" href="./app.js">` and `<link rel="modulepreload" href="./views/sessionsView.js">` inside `<head>` to parallelize module fetching during cold boot.
- In `src/index.css`, add `content-visibility: auto` to off-screen view containers (`.view-container.hidden`) and long scroll decks to skip off-screen layout calculations on mobile devices.

### 15.4 [x] Batch DOM Operations with DocumentFragments
- In `src/views/exercisesView.js`, `src/views/historyView.js`, and `src/components/clientsDirectory.js` (used by `src/views/clientsView.js`), construct list and table rows inside `DocumentFragment` instances before appending to live containers to prevent layout reflow bottlenecks on low-end mobile devices.

### 15.5 [x] Adopt DOM Helper Utility Across Controllers (`src/helper/dom.js` adoption)
- Complete task 14.4 by migrating repeated `document.getElementById` and `<dialog>` `showModal()`/`close()` checks across `src/controllers/formsController.js` and `src/components/feedbackModal.js` to use `$id`, `openModal`, and `closeModal`.


