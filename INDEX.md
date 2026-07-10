---
type: index
title: OpenPT Master Knowledge Index
description: Canonical navigation index for AI agents exploring the OpenPT specification and architecture catalog.
status: active
tags:
  - index
  - okf
  - navigation
---

# OpenPT Master Knowledge Index

This index provides AI agents and contributors with a structured navigation map of the OpenPT repository under Google's Open Knowledge Format (OKF v0.1).

## 1. Core Architecture & Operating Rules

| Document | Type | Description |
| :--- | :--- | :--- |
| [README.md](file:///home/simon/Projects/OpenPT/README.md) | `overview` | Canonical system architecture, domain subsystem definitions, and high-level feature specifications. |
| [AGENT_RULES.md](file:///home/simon/Projects/OpenPT/AGENT_RULES.md) | `guidelines` | Mandatory interaction protocols, direct execution rules, and single-source-of-truth guardrails for AI agents. |
| [okf.yaml](file:///home/simon/Projects/OpenPT/okf.yaml) | `manifest` | Root configuration manifest declaring OKF v0.1 compliance and catalog entrypoints. |

## 2. Functional Use Cases (`use_cases/`)

| Use Case | Type | Primary Actor | Description |
| :--- | :--- | :--- | :--- |
| [uc1_publish_slots.md](file:///home/simon/Projects/OpenPT/use_cases/uc1_publish_slots.md) | `use_case` | Personal Trainer | Publishing recurring training availability slots via Google Calendar Appointment Schedules. |
| [uc2_client_self_subscription.md](file:///home/simon/Projects/OpenPT/use_cases/uc2_client_self_subscription.md) | `use_case` | Client | Self-service slot booking via Google-hosted scheduling pages and automated calendar invites. |
| [uc3_pt_session_logging.md](file:///home/simon/Projects/OpenPT/use_cases/uc3_pt_session_logging.md) | `use_case` | Personal Trainer | Active gym-floor session orchestration using the mobile PWA clipboard, focus cards, plan pivots, and local voice notes. |
| [uc4_async_plan_adjustments.md](file:///home/simon/Projects/OpenPT/use_cases/uc4_async_plan_adjustments.md) | `use_case` | Personal Trainer | Back-office desk review of logged session signals, voice notes, and progressive overload trajectories. |
