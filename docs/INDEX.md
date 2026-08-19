---
type: index
title: LibrePT Web Documentation & Legal Templates Index
description: Catalog of documentation, GDPR compliance guides, and legal intake templates.
status: active
tags:
  - index
  - docs
  - okf
---

# LibrePT Documentation Catalog

| Document / Template | Type | Description |
| :--- | :--- | :--- |
| [DATA_MODEL.md](DATA_MODEL.md) | `architecture` | Data model & storage schema — IndexedDB layout, record model, star-write projections, migration and retention |
| [ROUTING.md](ROUTING.md) | `architecture` | Routing architecture — the Route class hierarchy, the registry, specificity ordering, and the invariants a new route must respect |
| [PREVIEW.md](PREVIEW.md) | `guidelines` | Pre-release PREVIEW build risks & data-loss notice (linked from the header PREVIEW tag) |
| [BUG_REPORTING.md](BUG_REPORTING.md) | `guidelines` | Bug Reporting Guide — how to submit issues, include build stamps, and steps to reproduce |
| [GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md) | `guidelines` | Google Cloud setup runbook — Part A, the production OAuth client trainers consent to (scopes, consent screen, authorized domains); Part B, the stored credential the live API canary runs on. Written against role handles and naming no credential, so the procedure is reviewable in the open; only the handle-to-address mapping stays private |
| [PRIVACY.md](../PRIVACY.md) | `guidelines` | Core Privacy Policy & GDPR Data Controller Statement |
| [PRIVACY_FOR_TRAINERS.md](PRIVACY_FOR_TRAINERS.md) | `guidelines` | Trainer Privacy Guide — the controller's operational workflow: obtain consent, record it, archive the signed form, handle withdrawal and data-subject requests |
| [templates/INDEX.md](templates/INDEX.md) | `index` | Client-facing legal templates, one folder per language (`en/`, `sl/`): the consent letter and the Art. 13 privacy notice, plus the rule for adding a language. The app links each client to the folder matching their chosen form language |
| [SRC_MODULES.md](SRC_MODULES.md) | `index` | Catalog of every runtime module under `src/` — app entry, data layer, feature modules, controllers, service worker. Lives here, not in `src/`, because `src/` is copied wholesale into `dist/` on deploy (AGENT_RULES §4.5: docs stay out of the app tree). |
