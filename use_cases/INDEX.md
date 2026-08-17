---
type: index
title: LibrePT Functional Use Cases Index
description: Directory index of all functional use cases defining personal trainer scheduling, gym-floor execution, and back-office planning workflows.
status: active
tags:
  - use-cases
  - index
  - okf
---

# LibrePT Functional Use Cases Index

This index structures the functional workflows and end-to-end domain use cases for LibrePT.

## Catalog of Use Cases

| Identifier | Document | Core Focus Area | Key Features & Domain Patterns |
| :--- | :--- | :--- | :--- |
| **UC1** | [uc1_gym_floor_clipboard.md](uc1_gym_floor_clipboard.md) | Gym-Floor Execution | Sub-second tab switching, Primary Focus Card with Foreshadowing, Reversible Plan Pivots, Generic Placeholder Cards (with voice notes), Privacy-First Local Voice Notes. |
| **UC2** | [uc2_async_plan_adjustments.md](uc2_async_plan_adjustments.md) | Asynchronous Review | Desk-side review of logged signals, audio note playback, progressive overload adjustments. |
| **UC3** | [uc3_publish_slots.md](uc3_publish_slots.md) | Scheduling Back-Office | Google Calendar Appointment Schedules, zero custom web hosting, automated slot exposure. |
| **UC4** | [uc4_client_self_subscription.md](uc4_client_self_subscription.md) | Client Booking | Google-hosted booking form, guest list sync, automated email calendar invites. |
| **UC5** | [uc5_session_day_deck_and_deep_links.md](uc5_session_day_deck_and_deep_links.md) | Dashboard Navigation & Routing | Day deck (yesterday→upcoming), single-finger day swipes, single-column invariant, each card's live/upcoming/past status line (editable elapsed time), clean deep-linkable URLs down to the in-focus clipboard card, in-app not-found view — with spec↔test traceability. |
| **UC6** | [uc6_exercise_taxonomy_and_picker.md](uc6_exercise_taxonomy_and_picker.md) | Movement Taxonomy & Fast Selection | Professional taxonomy catalog (equipment + pattern, no beginner instructions), filtered exercise picker for routine building (A) and gym-floor swaps (B), strict-inheritance custom-exercise creation (C), polymorphic reps/load — with spec↔test traceability. |
| **UC7** | [uc7_demo_to_clean_database.md](uc7_demo_to_clean_database.md) | Data Lifecycle & Provenance | Clearing the sample dataset once real work has started: record provenance by stamp + committed seed ids (never by id shape), the movement catalog kept as an asset, fixpoint retention of anything the trainer's own records depend on, and a per-record confirmation screen — with spec↔test traceability. |
| **UC8** | [uc8_client_self_onboarding.md](uc8_client_self_onboarding.md) | Client Self-Onboarding & Consent | A prospective client introducing themselves on their own phone: the submission travels as a FILE via the share sheet (never a URL, so Art. 9 health detail stays out of carriers and message histories), consent is stamped with the wording version and language they actually read, `/intake` is stateless by construction via its own boot step, and the trainer's review dialog is the trust boundary — contact-only dedupe, offered and declinable, with no auto-import. |
