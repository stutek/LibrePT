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

3. Source Modules & UI Components (`src/modules/`)

The runtime app lives under `src/` (served as the web root locally and flattened into `dist/`
on deploy). It's a native ES-module app (`<script type="module" src="app.js">`). `src/app.js`
is structured into feature modules under `src/modules/` (`session`, `plans`, `clients`, `exercises`, `history`, `common`, `themes`) and data under `src/data/`.

| Module | Type | Description |
| :--- | :--- | :--- |
| [src/app.js](src/app.js) | `entry` | Application bootstrapper: root initialization, dependency injection wiring, and global lifecycle hooks. |
| [src/data/stateStore.js](src/data/stateStore.js) | `data` | Central app state management: state object, localStorage persistence, seed data loading, and reset triggers. |
| [src/data/index.js](src/data/index.js) | `data` | Barrel for seed/demo data: `exercises.js`, `clients.js`, `routines.js`, `history.js`, `planUpdates.js`, `sessions.js`. |
| [src/i18n/index.js](src/i18n/index.js) | `i18n` | Translation registry: one flat key→string map per locale (`en.js`, `sl.js`). Key parity enforced by unit tests. |
| [src/modules/sessionList/sessionsView.js](src/modules/sessionList/sessionsView.js) | `view` | Modular view renderer for Sessions dashboard. |
| [src/modules/sessionList/sessionList.js](src/modules/sessionList/sessionList.js) | `component` | Renders a column of session cards into a container. |
| [src/modules/sessionList/sessionCard.js](src/modules/sessionList/sessionCard.js) | `component` | Dashboard session-booking card that launches the clipboard on tap. |
| [src/modules/sessionList/daySelector.js](src/modules/sessionList/daySelector.js) | `component` | Dashboard day-deck navigation and focus/scroll handlers. |
| [src/modules/clipboard/clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) | `component` | Interactive active session plan/clipboard structure editor. |
| [src/modules/clipboard/exerciseDeck.js](src/modules/clipboard/exerciseDeck.js) | `component` | Active-session exercise stack deck renderer. |
| [src/modules/clipboard/exerciseCard.js](src/modules/clipboard/exerciseCard.js) | `component` | Standalone exercise card in clipboard deck. |
| [src/modules/clipboard/supersetCard.js](src/modules/clipboard/supersetCard.js) | `component` | Superset/Giant set grouped block card. |
| [src/modules/clipboard/exerciseAndRestTimer.js](src/modules/clipboard/exerciseAndRestTimer.js) | `component` | Session exercise and rest countdown timer stack. |
| [src/modules/session/sessionBar.js](src/modules/session/sessionBar.js) | `component` | Bottom active/next-session bar with countdowns. |
| [src/modules/session/sessionTitleBar.js](src/modules/session/sessionTitleBar.js) | `component` | Active-session overlay title line and countdown. |
| [src/modules/session/editSessionView.js](src/modules/session/editSessionView.js) | `view` | Modular view renderer for Edit Session & Setup view. |
| [src/modules/session/editSessionControl.js](src/modules/session/editSessionControl.js) | `component` | Pre-session edit/setup control modal dialog. |
| [src/modules/plans/plansView.js](src/modules/plans/plansView.js) | `view` | Modular view renderer for Plans (formerly Routines) catalog and template editor. |
| [src/modules/plans/planAdjustments.js](src/modules/plans/planAdjustments.js) | `component` | Pending Plan Adjustments deck & interactive Apply wizard. |
| [src/modules/clients/clientsView.js](src/modules/clients/clientsView.js) | `view` | Modular view renderer for Client Directory & Client profile views. |
| [src/modules/clients/clientsDirectory.js](src/modules/clients/clientsDirectory.js) | `component` | Client Directory grid component. |
| [src/modules/exercises/exercisesView.js](src/modules/exercises/exercisesView.js) | `view` | Modular view renderer for Exercise taxonomy catalog view. |
| [src/modules/exercises/exercisePicker.js](src/modules/exercises/exercisePicker.js) | `component` | Reusable exercise picker with taxonomy filter chips. |
| [src/modules/history/historyView.js](src/modules/history/historyView.js) | `view` | Modular view renderer for workout history logs. |
| [src/modules/common/utils.js](src/modules/common/utils.js) | `helper` | Shared formatting, date conversion, and string helper functions. |
| [src/modules/common/dom.js](src/modules/common/dom.js) | `helper` | DOM helper utilities and modal helpers. |
| [src/modules/common/repsAndLoad.js](src/modules/common/repsAndLoad.js) | `helper` | Polymorphic reps and equipment-derived load helpers. |
| [src/modules/common/sessionCache.js](src/modules/common/sessionCache.js) | `helper` | Active session local storage cache helper. |
| [src/modules/common/wakeLock.js](src/modules/common/wakeLock.js) | `helper` | Screen Wake Lock API management helper. |
| [src/modules/common/activeUsersList.js](src/modules/common/activeUsersList.js) | `component` | Active-session participant tabs component. |
| [src/modules/common/applicationHeader.js](src/modules/common/applicationHeader.js) | `component` | Shared top header actions, theme/lang switchers, and sync badge. |
| [src/modules/common/backupRestore.js](src/modules/common/backupRestore.js) | `component` | Backup center dialog and JSON import/export handlers. |
| [src/modules/common/feedbackModal.js](src/modules/common/feedbackModal.js) | `component` | Feedback tags modal dialog and voice recorder handler. |
| [src/modules/common/notificationArea.js](src/modules/common/notificationArea.js) | `component` | Toast and banner notification area handler. |
| [src/modules/themes/](src/modules/themes/) | `styles` | Theme-specific CSS stylesheets (`daylight.css`, `midnight.css`, `red.css`, `blossom.css`, `nebula.css`). |
| [src/controllers/routerController.js](src/controllers/routerController.js) | `controller` | SPA route mapping and navigation logic. |
| [src/controllers/themeController.js](src/controllers/themeController.js) | `controller` | Unified theme manager. |
| [src/controllers/appLifecycleController.js](src/controllers/appLifecycleController.js) | `controller` | PWA runtime lifecycle. |
