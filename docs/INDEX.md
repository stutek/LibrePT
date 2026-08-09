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
| [PRIVACY.md](../PRIVACY.md) | `guidelines` | Core Privacy Policy & GDPR Data Controller Statement |
| [PRIVACY_FOR_TRAINERS.md](PRIVACY_FOR_TRAINERS.md) | `guidelines` | Trainer Privacy Guide — the controller's operational workflow: obtain consent, record it, archive the signed form, handle withdrawal and data-subject requests |
| [templates/Client_Consent_Form.md](templates/Client_Consent_Form.md) | `template` | Printable Client Consent Letter — the exact wording the app's Email form button sends, plus the signature block and the form-versioning rule |
| [templates/Client_Privacy_Notice.md](templates/Client_Privacy_Notice.md) | `template` | Client Privacy Notice (Art. 13) — the plain-language notice a client must read before consenting |
| [SRC_MODULES.md](SRC_MODULES.md) | `index` | Catalog of every runtime module under `src/` — app entry, data layer, feature modules, controllers, service worker. Lives here, not in `src/`, because `src/` is copied wholesale into `dist/` on deploy (AGENT_RULES §5.5: docs stay out of the app tree). |
