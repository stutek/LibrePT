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

### 1.1 PT-side client assignment to a session
The session card on the home dashboard must let the **PT assign clients to a session directly**, not only rely on client self-subscription via the Google-hosted booking page.

- Assignment happens from the session card on the dashboard.
- Assigned clients are **notified by a calendar invite email**, when an email address exists for them in the database.
- Complements, does not replace, the existing self-subscription flow ([uc4_client_self_subscription.md](file:///home/simon/Projects/LibrePT/use_cases/uc4_client_self_subscription.md)).
- **Open**: clients with no email on record — assign silently, or prompt for an address?

### 1.2 Simultaneous sessions merged into one clipboard
When several sessions run in **the same time slot with different programmes**, the clipboard must merge **all participants into a single view**, with enough visual separation to tell which participant belongs to which session/programme.

- Relates to the existing "Asynchronous Session Scenarios" capability in [uc1_gym_floor_clipboard.md](file:///home/simon/Projects/LibrePT/use_cases/uc1_gym_floor_clipboard.md).
- The distinguishing signal must survive the gym-floor constraints: glanceable, no reading required.

---

## 2. Active Session Bar (bottom green row)

### 2.1 Active state
The bottom bar currently shows only a timer. It should show:

- Session **name**
- **Number of clients**
- **Start and end time**
- A **countdown timer** of remaining minutes, which **may go negative** when a session runs over.
- The **entire row must be clickable**, not just the up-arrow.
- **Open**: *why do we need the timer control at all?* Re-evaluate whether the manual timer control earns its place, or whether the countdown should simply derive from the session's scheduled start/end.

### 2.2 Idle state (no active session)
When no session is active:

- Change the row colour to distinguish it from the active state.
- Content and click target refer to the **next upcoming session**.
- If **multiple sessions run in parallel**, list them all in the same row — they all open the same clipboard.

---

## 3. Data Sync

### 3.1 "Sync Sessions" → "Sync Data"
Rename the dashboard action from **Sync Sessions** to **Sync Data** (`btn_sync_sessions` → new key; update EN + SL dictionaries together).

### 3.2 Git-style change counters
Show a **count of local changes and remote changes**, in the spirit of git's ahead/behind indicator, so the PT can see at a glance whether their device is in sync.

### 3.3 [Brainstorm] Google Drive periodic sync
Data should sync **periodically to Google Drive** and remain **editable directly in the Google Drive view**.

- **Open question**: does it make sense to store the data in **Google's new OKF format**, using it to get concurrent editing and versioning for free?
- No approach is chosen yet — decide in a dedicated brainstorm before implementing.

---

## 4. UI / UX

### 4.1 Theme redesign
- **Light mode** needs a nicer design, along the lines of: <https://claude.ai/code/artifact/f27dc4ca-e1b4-47dd-b3c6-34dee3d6110c>
- **Dark theme** should be improved in the same pass.
- Constraint: both themes must keep working from the CSS custom properties in `index.css` — no hard-coded theme colours.

### 4.2 Constant header line
The **title/header line should stay constant** when switching between the clipboard, session management, and other views — it should not jump or re-flow between contexts.

- **Note**: the original request trailed off mid-sentence ("...clipboard, session management and"). Confirm the full list of views this must hold across.

### 4.3 Collapse the duplicated session header into one row, with a date picker
There are currently **two title rows** above the session list. The second row — the per-column header with the calendar icon and the `Today` label (`.sessions-column-header`) — is redundant now that the deck shows a single column and the title bar already names the day.

- **Remove** the second row (the column header with the icon and `Today`/`Yesterday`/`Tomorrow`/`Upcoming` label).
- In the remaining title row, make the **calendar icon clickable**, opening an overlay with a **date picker**.
- The picker **must accept a typed date** — no scrolling back through years to reach a past date.
- Note: the removed header is what colour-codes each bucket (purple/cyan/muted/emerald). If that signal is worth keeping, it has to move into the title bar.

> **⚠ Blocking design gap — settle before implementing.** Bookings currently have **no date**. They carry a relative bucket only (`day: 'yesterday' | 'today' | 'tomorrow' | 'upcoming'`, see `mockData.js`), and the title bar *derives* dates live from `new Date()`. That is exactly why the demo keeps working on any day without reseeding. A date picker implies **jumping to an arbitrary date**, which the four-bucket model cannot represent — picking `2025-03-04` would have nothing to show. Choosing a real date field is a **data-model migration** (existing `localStorage` databases included) and it would end the self-following demo behaviour. Decide the model first: real dates, or a picker restricted to the four buckets?

### 4.4 Horizontal client names in the clipboard
Lay the client/participant names out **horizontally in the clipboard to save vertical space**, rather than stacking them.

- Must not cost sub-second participant switching — the tap targets stay gym-floor sized.
- Interacts with **[1.2 Simultaneous sessions merged into one clipboard](#12-simultaneous-sessions-merged-into-one-clipboard)**: a merged view carries more participants, so decide the two layouts together.

### 4.5 Rename the session launch action
Rename **"Launch Clipboard"** / **"Začni sledenje"** to something closer to **"Podrobnosti seje"** (session details).

- Affects `btn_launch_clipboard`, `btn_launch_clipboard_short`, and `btn_start_session` — EN + SL dictionaries must stay at parity.
- The label should read as opening the session's details, not as starting a stopwatch.

---

## 5. Client Detail

### 5.1 Tabbed client view
Clicking an individual client opens a **tabbed** view (today it opens a single flat profile screen, `view-client-detail`):

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

### 6.1 Remove body-weight tracking (for now)
Strip **client body-weight tracking** from the app for the time being.

> **⚠ Do not confuse the two kinds of "weight".** The codebase uses `weight` for **two unrelated things**, and only the first is in scope here:
> - **Body weight (in scope — remove)**: `weightHistory` on clients (`mockData.js`), the weight chart (`.weight-chart-container`, `index.html`), the `client-weight` input and its `current_weight` label (EN + SL), and the `client-weight-pill` on the client profile (`app.js`).
> - **Exercise load (out of scope — keep)**: target load per set, `session-add-weight`, `adjust-weight`, and the "Load Up Next / Step Back" progression signals. These are core to [uc1_gym_floor_clipboard.md](file:///home/simon/Projects/LibrePT/use_cases/uc1_gym_floor_clipboard.md) and [uc2_async_plan_adjustments.md](file:///home/simon/Projects/LibrePT/use_cases/uc2_async_plan_adjustments.md) and **must not be touched** (~16 call sites).

- Removing `current_weight` means dropping it from **both** dictionaries — the test suite enforces EN/SL key parity.
- **Open**: is this a removal or a hide? Existing `localStorage` databases already hold `weightHistory`. Decide whether to migrate it away (destructive, loses real client data) or simply stop rendering it, so the data survives if the feature returns. "For now" argues for hiding rather than deleting.

### 6.2 Extract use cases and usage scenarios from the tests
The Playwright suite already drives real end-to-end flows (gym-floor clipboard launch, voice notes, feedback → adjustment wizard, day-deck navigation, swipes). Those flows are **executable usage scenarios** that are currently documented nowhere.

- Extract the scenarios the tests actually exercise and **document them properly** in [use_cases/](file:///home/simon/Projects/LibrePT/use_cases/), following OKF (frontmatter + `INDEX.md` row + graph links).
- Reconcile against the existing UC1–UC4: some tested behaviour is already specified, some (the session day deck) is not, and some specified behaviour has no test — the gaps in **both** directions are the interesting output.
- Goal: tests and use cases describe the same system, so a scenario can be traced from spec to the test that proves it.

---

## 7. Feedback Loop

### 7.1 [Brainstorm] One-click resolve for pending plan adjustments
Pending plan adjustment reminders — **do we allow a 1-click resolve?**

- Tension to resolve: one-tap resolution fits the low-interaction principle, but plan adjustments are exactly the decisions that deserve deliberate review at the desk ([uc2_async_plan_adjustments.md](file:///home/simon/Projects/LibrePT/use_cases/uc2_async_plan_adjustments.md)).
