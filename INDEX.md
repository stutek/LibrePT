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
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | `architecture` | Data model & storage schema: IndexedDB layout, logical record model, star-write projections, migration order and retention. |
| [docs/ROUTING.md](docs/ROUTING.md) | `architecture` | Routing architecture: the Route class hierarchy and registry, specificity-based resolution, the `ctx` a route receives, routing invariants, and how to add a route. |
| [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) | `guidelines` | Copyright notices and licences for the fonts and icon font vendored into `src/` and therefore redistributed in every published build (SIL OFL 1.1, CC BY 4.0, MIT), plus the changes made to each. |
| [AGENT_RULES.md](AGENT_RULES.md) | `guidelines` | Mandatory interaction protocols, direct execution rules, and single-source-of-truth guardrails for AI agents. |
| [agent_tools/INDEX.md](agent_tools/INDEX.md) | `index` | Catalog of durable, repo-owned agent tools — run these instead of improvising a throwaway script, and the bar a new one must clear. |
| [okf.yaml](okf.yaml) | `manifest` | Root configuration manifest declaring OKF v0.1 compliance and catalog entrypoints. |
| [LICENSE](LICENSE) | `license` | MIT License terms governing use, modification, and distribution of LibrePT. |

## 2. Functional Use Cases (`use_cases/`)

| Use Case | Type | Primary Actor | Description |
| :--- | :--- | :--- | :--- |
| [uc1_gym_floor_clipboard.md](use_cases/uc1_gym_floor_clipboard.md) | `use_case` | Personal Trainer | Active gym-floor session orchestration using the mobile PWA clipboard, focus cards, plan pivots, placeholder cards (with voice notes), and one-tap signals. |
| [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md) | `use_case` | Personal Trainer | Back-office desk review of logged session signals, audio note playback, and progressive overload trajectories. |
| [uc3_publish_slots.md](use_cases/uc3_publish_slots.md) | `use_case` | Personal Trainer | Publishing recurring training availability slots via Google Calendar Appointment Schedules. |
| [uc4_client_self_subscription.md](use_cases/uc4_client_self_subscription.md) | `use_case` | Client | Self-service slot booking via Google-hosted scheduling pages and automated calendar invites. |
| [uc5_session_day_deck_and_deep_links.md](use_cases/uc5_session_day_deck_and_deep_links.md) | `use_case` | Personal Trainer | Dashboard's continuous, time-ordered session timeline (sticky day headers, scrollspy title bar, date-jump), clean deep-linkable URLs down to the in-focus clipboard card, and the in-app not-found view — with spec↔test traceability. |

## 3. Directory Catalogs

Each directory owns the catalog of its own contents, so a module move touches the index next to the
code rather than a single shared file every change has to queue behind.
`agent_tools/catalog_coverage.py` gates these: every runtime module is listed exactly once, and
every listed path exists.

| Catalog | Type | Covers |
| :--- | :--- | :--- |
| [docs/SRC_MODULES.md](docs/SRC_MODULES.md) | `index` | Every runtime module: the app entry and `appBoot.js`, the `src/data/` persistence layer, feature modules under `src/modules/`, controllers, routes, and the service worker. |
| [tests/INDEX.md](tests/INDEX.md) | `index` | The four test tiers — what each one boots, which stage runs it, and the rule for choosing where a new test belongs. |
| [docs/INDEX.md](docs/INDEX.md) | `index` | Architecture documents, GDPR/compliance guides, and legal intake templates. |
| [use_cases/INDEX.md](use_cases/INDEX.md) | `index` | Functional use cases, cross-referenced to the tests that pin them. |
| [agent_tools/INDEX.md](agent_tools/INDEX.md) | `index` | Durable, repo-owned agent tools, and the bar a new one must clear. |
