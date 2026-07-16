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
| [README.md](file:///home/simon/Projects/LibrePT/README.md) | `overview` | Canonical system architecture, domain subsystem definitions, high-level feature specifications, and quick start. |
| [CONTRIBUTING.md](file:///home/simon/Projects/LibrePT/CONTRIBUTING.md) | `guidelines` | Human contributor guide: development setup, testing, code conventions, and documentation standards. |
| [TODO.md](file:///home/simon/Projects/LibrePT/TODO.md) | `roadmap` | Backlog of planned features, UX changes, and unresolved design questions awaiting brainstorming. |
| [AGENT_RULES.md](file:///home/simon/Projects/LibrePT/AGENT_RULES.md) | `guidelines` | Mandatory interaction protocols, direct execution rules, and single-source-of-truth guardrails for AI agents. |
| [okf.yaml](file:///home/simon/Projects/LibrePT/okf.yaml) | `manifest` | Root configuration manifest declaring OKF v0.1 compliance and catalog entrypoints. |
| [LICENSE](file:///home/simon/Projects/LibrePT/LICENSE) | `license` | MIT License terms governing use, modification, and distribution of LibrePT. |

## 2. Functional Use Cases (`use_cases/`)

| Use Case | Type | Primary Actor | Description |
| :--- | :--- | :--- | :--- |
| [uc1_gym_floor_clipboard.md](file:///home/simon/Projects/LibrePT/use_cases/uc1_gym_floor_clipboard.md) | `use_case` | Personal Trainer | Active gym-floor session orchestration using the mobile PWA clipboard, focus cards, plan pivots, placeholder cards (with voice notes), and one-tap signals. |
| [uc2_async_plan_adjustments.md](file:///home/simon/Projects/LibrePT/use_cases/uc2_async_plan_adjustments.md) | `use_case` | Personal Trainer | Back-office desk review of logged session signals, audio note playback, and progressive overload trajectories. |
| [uc3_publish_slots.md](file:///home/simon/Projects/LibrePT/use_cases/uc3_publish_slots.md) | `use_case` | Personal Trainer | Publishing recurring training availability slots via Google Calendar Appointment Schedules. |
| [uc4_client_self_subscription.md](file:///home/simon/Projects/LibrePT/use_cases/uc4_client_self_subscription.md) | `use_case` | Client | Self-service slot booking via Google-hosted scheduling pages and automated calendar invites. |

## 3. Source Modules & UI Components (`components/`)

The front-end is a native ES-module app (`<script type="module" src="app.js">`). `app.js` is being
incrementally split into focused component modules under `components/` so each concern can be
found and edited without loading the whole file. Components are decoupled via dependency
injection: `app.js` passes the app-level helpers they need (`state`, `t`, `escapeHTML`, …).

| Module | Type | Description |
| :--- | :--- | :--- |
| [app.js](file:///home/simon/Projects/LibrePT/app.js) | `entry` | Application entry: i18n, state, view router, render orchestration, session logic, and wiring of the component modules below. |
| [mockData.js](file:///home/simon/Projects/LibrePT/mockData.js) | `data` | Default seed data (exercises, clients, routines, history, plan updates, sessions). |
| [components/sessionCard.js](file:///home/simon/Projects/LibrePT/components/sessionCard.js) | `component` | Dashboard session-booking card (time, participants, program, readiness warnings, temporal tint) that launches the clipboard on tap. |
| [components/exerciseCard.js](file:///home/simon/Projects/LibrePT/components/exerciseCard.js) | `component` | Standalone (non-circuit) exercise card in the clipboard deck: the in-focus logging card (target stats + Too Easy / Too Hard / Feedback) and its compact tap-to-focus row. |
