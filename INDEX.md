---
type: index
title: LibrePT Master Knowledge Index
description: Canonical navigation index for AI agents exploring the LibrePT specification and architecture catalog.
status: active
tags:
  - index
  - okf
  - navigation
---

# LibrePT Master Knowledge Index

This index provides AI agents and contributors with a structured navigation map of the LibrePT repository under Google's Open Knowledge Format (OKF v0.1).

## 1. Core Architecture & Operating Rules

| Document | Type | Description |
| :--- | :--- | :--- |
| [README.md](README.md) | `overview` | Canonical system architecture, domain subsystem definitions, high-level feature specifications, and quick start. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | `guidelines` | Human contributor guide: development setup, testing, code conventions, and documentation standards. |
| [TODO.md](TODO.md) | `roadmap` | Backlog of planned features, UX changes, and unresolved design questions awaiting brainstorming. |
| [AGENT_RULES.md](AGENT_RULES.md) | `guidelines` | Mandatory interaction protocols, direct execution rules, and single-source-of-truth guardrails for AI agents. |
| [okf.yaml](okf.yaml) | `manifest` | Root configuration manifest declaring OKF v0.1 compliance and catalog entrypoints. |
| [LICENSE](LICENSE) | `license` | MIT License terms governing use, modification, and distribution of LibrePT. |

## 2. Functional Use Cases (`use_cases/`)

| Use Case | Type | Primary Actor | Description |
| :--- | :--- | :--- | :--- |
| [uc1_gym_floor_clipboard.md](use_cases/uc1_gym_floor_clipboard.md) | `use_case` | Personal Trainer | Active gym-floor session orchestration using the mobile PWA clipboard, focus cards, plan pivots, placeholder cards (with voice notes), and one-tap signals. |
| [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md) | `use_case` | Personal Trainer | Back-office desk review of logged session signals, audio note playback, and progressive overload trajectories. |
| [uc3_publish_slots.md](use_cases/uc3_publish_slots.md) | `use_case` | Personal Trainer | Publishing recurring training availability slots via Google Calendar Appointment Schedules. |
| [uc4_client_self_subscription.md](use_cases/uc4_client_self_subscription.md) | `use_case` | Client | Self-service slot booking via Google-hosted scheduling pages and automated calendar invites. |
| [uc5_session_day_deck_and_deep_links.md](use_cases/uc5_session_day_deck_and_deep_links.md) | `use_case` | Personal Trainer | Dashboard day-deck navigation (yesterday→upcoming, swipes, single-column), clean deep-linkable URLs down to the in-focus clipboard card, and the in-app not-found view — with spec↔test traceability. |

## 3. Source Modules & UI Components (`src/`)

The runtime app lives under `src/` (served as the web root locally and flattened into `dist/`
on deploy). It's a native ES-module app (`<script type="module" src="app.js">`). `src/app.js`
is being incrementally split into focused modules — seed data under `src/data/` and UI
components under `src/components/` — so each concern can be found and edited without loading the
whole file. Components are decoupled via dependency injection: `app.js` passes the app-level
helpers they need (`state`, `t`, `escapeHTML`, …).

| Module | Type | Description |
| :--- | :--- | :--- |
| [src/app.js](src/app.js) | `entry` | Application entry: state, view router, render orchestration, session logic, translation lookup (`t`), and wiring of the component modules below. |
| [src/data/index.js](src/data/index.js) | `data` | Barrel for the seed/demo data, split per entity: `exercises.js`, `clients.js`, `routines.js`, `history.js`, `planUpdates.js`, `sessions.js`. Entities reference each other by string id only. |
| [src/i18n/index.js](src/i18n/index.js) | `i18n` | Translation registry: one flat key→string map per locale (`en.js`, `sl.js`). Adding a language is a new file listed here; key parity across locales is enforced by `tests/unit/test_i18n_parity.py`. |
| [src/components/sessionCard.js](src/components/sessionCard.js) | `component` | Dashboard session-booking card (time, participants, program, readiness warnings, temporal tint, live-session emphasis) that launches the clipboard on tap. |
| [src/components/clientsDirectory.js](src/components/clientsDirectory.js) | `component` | Client Directory grid (its own view/route, `/clients` — TODO 4.8): one tappable client card per client (avatar, name, truncated goal), filtered by the search query, with an empty state. |
| [src/components/exerciseCard.js](src/components/exerciseCard.js) | `component` | Standalone (non-superset) exercise card in the clipboard deck: the in-focus logging card (target stats + Too Easy / Too Hard / Feedback) and its compact tap-to-focus row. |
| [src/components/supersetCard.js](src/components/supersetCard.js) | `component` | Superset / Giant Set card: a grouped block of exercises with a round counter, per-exercise feedback trio, rest breaks, and a Complete-round button that advances/finishes the superset. |
| [src/components/exerciseDeck.js](src/components/exerciseDeck.js) | `component` | Active-session exercise stack: builds the deck items (most-recent past session as tappable history cards + current routine folded into superset units and standalone cards), wires their callbacks, and scrolls the acted-on card into view. Delegates card render to `supersetCard`/`exerciseCard`. |
| [src/components/sessionBar.js](src/components/sessionBar.js) | `component` | Bottom active/next-session bar: live-session labels + scheduled-end countdown, and the idle "next session" state with a starts-in countdown. |
| [src/components/sessionList.js](src/components/sessionList.js) | `component` | Renders a column of session cards into a container (delegating each to `sessionCard`), or an empty-state message when a day has no sessions. |
| [src/components/daySelector.js](src/components/daySelector.js) | `component` | Dashboard day-deck navigation: the day-selection title bar, prev/next arrows, and horizontal focus/scroll across the Yesterday→Upcoming session columns. |
| [src/components/sessionTitleBar.js](src/components/sessionTitleBar.js) | `component` | Active-session overlay title line: scheduled date, start time and gym location, plus the live countdown. |
| [src/components/activeUsersList.js](src/components/activeUsersList.js) | `component` | Active-session participant tabs: the client selector buttons (with selected-tab emphasis) and their scroll-fade state. |
| [src/components/applicationHeader.js](src/components/applicationHeader.js) | `component` | Shared top header actions: theme + language switchers, logo-home clicks, and the Sync & Backup control with its mock ahead/behind change badge. |
| [src/components/planAdjustments.js](src/components/planAdjustments.js) | `component` | Pending Plan Adjustments deck (its own view/route, `/adjustments` — TODO 4.8), plus the interactive Apply-Adjustment wizard dialog (feedback → routine template update). |
| [src/components/workoutSetup.js](src/components/workoutSetup.js) | `component` | Pre-session participant check setup modal dialog: selects clients and maps routine program templates. |
| [src/components/feedbackModal.js](src/components/feedbackModal.js) | `component` | Feedback tags modal dialog: tags sets outcomes (Too Easy/Too Hard/Pain) and handles local voice note recorder transcriptions. |
| [src/components/restTimer.js](src/components/restTimer.js) | `component` | Floating rest timer overlay with synthesized audio and haptic feedback triggers. |
| [src/components/backupRestore.js](src/components/backupRestore.js) | `component` | Backup center dialog handlers: database JSON export, backup JSON file import, and factory reset action logic. |
| [src/components/exerciseAndRestTimer.js](src/components/exerciseAndRestTimer.js) | `component` | The clipboard timer stack: one labelled countdown per client (client name + Rest/Exercise), counting into negative overtime, dismiss-only, persisted across reloads. Start guards an existing timer (warn-flash if still running, ack-blink + reset if overtime). |
| [src/components/exercisePicker.js](src/components/exercisePicker.js) | `component` | Reusable, low-friction exercise picker: muscle-group + equipment filter chips over a single-tap movement list. Powers the routine builder (Scenario A) and gym-floor swap (Scenario B) fast-selection flows (UC6 / TODO §13.2). |
| [src/controllers/routerController.js](src/controllers/routerController.js) | `controller` | SPA route mapping and navigation logic: parses URL paths (`/sessions/YYYY-MM-DD`, `/session/ID/client/ID`), handles view transitions (`switchView`), and manages deep-link error fallbacks (`showErrorView`). |
| [src/helper/repsAndLoad.js](src/helper/repsAndLoad.js) | `helper` | Polymorphic reps (count / range / time / `max`-to-failure) and equipment-derived load (kg / cable level / band / bodyweight): parse, format, and the shared load-input markup used by every authoring surface. |
| [src/helper/sessionCache.js](src/helper/sessionCache.js) | `helper` | Handles JSON serialization and recovery of active session state in `localStorage`. |
| [src/helper/utils.js](src/helper/utils.js) | `helper` | Stateless formatting, date conversion, time range overlap detection, and general string helper functions. |
| [src/helper/wakeLock.js](src/helper/wakeLock.js) | `helper` | Screen Wake Lock API management helper to prevent mobile screen dimming during active workout sessions. |
