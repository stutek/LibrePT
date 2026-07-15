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

### 4.3 Rename the session launch action
Rename **"Launch Clipboard"** / **"Začni sledenje"** to something closer to **"Podrobnosti seje"** (session details).

- Affects `btn_launch_clipboard`, `btn_launch_clipboard_short`, and `btn_start_session` — EN + SL dictionaries must stay at parity.
- The label should read as opening the session's details, not as starting a stopwatch.

---

## 5. Feedback Loop

### 5.1 [Brainstorm] One-click resolve for pending plan adjustments
Pending plan adjustment reminders — **do we allow a 1-click resolve?**

- Tension to resolve: one-tap resolution fits the low-interaction principle, but plan adjustments are exactly the decisions that deserve deliberate review at the desk ([uc2_async_plan_adjustments.md](file:///home/simon/Projects/LibrePT/use_cases/uc2_async_plan_adjustments.md)).
