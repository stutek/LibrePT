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

### 6.2 [ ] Extract use cases and usage scenarios from the tests
The Playwright suite already drives real end-to-end flows (gym-floor clipboard launch, voice notes, feedback → adjustment wizard, day-deck navigation, swipes). Those flows are **executable usage scenarios** that are currently documented nowhere.

- Extract the scenarios the tests actually exercise and **document them properly** in [use_cases/](file:///home/simon/Projects/LibrePT/use_cases/), following OKF (frontmatter + `INDEX.md` row + graph links).
- Reconcile against the existing UC1–UC4: some tested behaviour is already specified, some (the session day deck) is not, and some specified behaviour has no test — the gaps in **both** directions are the interesting output.
- Goal: tests and use cases describe the same system, so a scenario can be traced from spec to the test that proves it.

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

---

## 9. Interactive Demo / Guided Onboarding

The big new feature: a first-run onboarding that walks a new user through the app end-to-end with a simulated finger, instead of seeding demo data silently. Build in the phases below; each is committable on its own.

### 9.1 [ ] App starts with NO data
On a fresh install the app must contain **no test/demo data at all** — empty client directory, no sessions, no active session. Today `seedMockData()` / `SEED_VERSION` auto-seeds on first load; that seeding must move behind the demo activation (9.2).

- **Blocking ripple:** every browser test (`tests/test_browser.py`, `tests/e2e/*`) currently depends on the seeded active session, clients and bookings. With an empty start they all fail. Keep the suite green by having the tests **explicitly load the demo data** first (expose a small `loadDemoData()` the tests call, or a `?demo=1` / `localStorage` bootstrap the test fixture sets). Decide this before flipping the default.
- Empty state should render cleanly (the not-found/empty views already exist for some lists) and surface the "Run the demo" message (9.3).

### 9.2 [ ] Demo-data loader (subset of the seed data)
A `loadDemoData()` that populates a **subset** of the current `src/data/` seed (a few clients, one or two routines, today's sessions, and the seeded in-progress session) on demand — invoked when the user activates the demo. Keep it a real subset, not the whole fixture, so the walkthrough stays focused.

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

### 10.1 [ ] Hamburger (☰) menu in the header
Add a hamburger/overflow menu to the app header (next to the Sync & Backup cloud button) with **placeholder** items:

- **Connect cloud storage** (placeholder → "coming soon").
- **Export all data as a file** (can open the existing Sync & Backup modal, which already has JSON export).
- **GitHub project** (link to `github.com/stutek/LibrePT`, opens in a new tab).
- **About** (modal: short app description + repo link).
- **Terms & disclaimer** (opens the modal from 10.2).

Wire it in `components/applicationHeader.js` following the existing `.session-menu` dropdown pattern (toggle + close-on-outside-click). Add i18n keys (EN + SL) for every label — the parity test enforces it. (A partial HTML draft was made and reverted; redo cleanly.)

### 10.2 [ ] First-run no-liability disclaimer + user agreement
A modal with a **no-liability disclaimer and user agreement**, shown **once on first run** (persist acceptance in `localStorage`, e.g. `librept_terms_accepted`), and also reachable from the header menu (10.1) any time. Keep the text concise ("provided as is, no warranty, not medical/professional advice, data stays local, use at your own risk") and translated to SL. First-run modal requires an "I agree" action.

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

### 12.1 [ ] OKF review (`okf.yaml`)
Review and update the Open Knowledge Format descriptor to reflect the current architecture (i18n externalized to `src/i18n/`, the component split under `src/components/`, `build/`+`deploy/` packages, the deep-link routing, the 5-theme system).

### 12.2 [ ] Documentation pass
Sweep README / CONTRIBUTING / INDEX / AGENT_RULES for staleness after the recent refactors (e.g. README's codebase tree still lists `mockData.js`; ensure all features — themes, deep links, sync/backup, dev server, build/deploy — are documented and accurate).

### 12.3 [ ] Test completeness
Broaden coverage: themes (switch + persistence), the Sync & Backup modal + mock counters, the header menu + first-run agreement (10.x), the not-found view is covered but the demo walkthrough (9.x) will need its own tests. Confirm every extracted component has at least one exercised path.

### 12.4 [x] TODO.md contents review
Reconcile this file with what actually shipped (e.g. **3.2 Git-style change counters** is effectively done via the mock ahead/behind sync badge; **4.2 Constant header line** is done and the active-session overlay no longer duplicates the header). Tick off completed items and prune stale ones.

- **Done (this pass)**: ticked **3.2** (the ahead/behind sync badge ships). Verified the remaining `[ ]` items are genuinely outstanding: 1.x scheduling, 4.1 theme redesign, 4.3 date-picker (blocked on the dated-bookings data-model decision), 5.1 tabbed client view, 6.1 body-weight removal, 7.1/3.3 brainstorms, 8.1 bound clients, 9.x demo, 10.x header menu, 11.x nav redesign, 12.1–12.3/12.5. No further silently-shipped items found.

### 12.5 [ ] Local git housekeeping (trademark refs)
The trademark was scrubbed from history and force-pushed (remote is clean). Still pending **locally**: expire the reflog and `git gc --prune=now` the old pre-rewrite objects (`refs/original/…` and any leftover backup branch) so the old blobs are purged from the local clone.

- **Status**: no `refs/original/…` refs and no leftover backup branch remain (only `main` / `origin/main`); the old blobs survive only via reflog entries. The purge is a single command the maintainer should run manually — it was blocked when attempted from the agent because reflog expiry is irreversible:

  ```bash
  git reflog expire --expire=now --all && git gc --prune=now
  ```
