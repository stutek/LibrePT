---
type: index
title: LibrePT Test Tier Catalog
description: The four test tiers, what each one boots, and the rule for choosing where a new test belongs.
status: active
tags:
  - index
  - tests
  - okf
---

# LibrePT Test Tier Catalog

Four tiers, ordered by how much of the app each one boots. The gate runs them in that order
(`build/__init__.py`, stages 1→4) so the cheapest, most localised failure surfaces first. **Put a
new test in the highest tier that can actually hold it** — the tier below is always faster and
localises the fault better, and a test placed too low simply cannot express what it needs.

| Tier | Runner | Boots | Put a test here when… |
| :--- | :--- | :--- | :--- |
| [tests/unit/](unit/) (13 files) | pytest, stage 1 | nothing — static analysis of the repo | It inspects files/structure: layout rules, i18n parity, doc links, generated catalogs. |
| [tests/unit_js/](unit_js/) (20 files, 80 tests) | `node:test`, stage 1 | one ES module, no DOM | It pins **pure logic** — schema/migration transforms, id generation, merge algorithms, projections. Mirrors the `src/` subpath it covers. |
| [tests/medium/](medium/) (5 files) | Playwright, stage 2 | one component against real `index.html` markup | It needs the **DOM/CSS** but not navigation, persistence or a real app boot. Mounts via a `src/appBoot.js` step through [tests/medium/_harness.py](medium/_harness.py). |
| [tests/e2e/](e2e/) (48 files) | Playwright, stage 3 | the whole app | It needs the router, IndexedDB, the service worker, reload/deep-link behaviour, or a multi-step flow across views. |

**Why the split is worth maintaining:** the pure-logic tests used to run in a browser purely because
the app's CSP forbids `new Function` — they now fail in ~4s inside stage 1 instead of at the
3-minute mark. The win is *feedback latency*, not total wall clock: e2e is fanned out across workers,
so moving cheap tests out of it barely moves the stage's duration (measured — do not expect
otherwise), while moving a *slow* one does.

**Shared fixtures** live in [tests/conftest.py](conftest.py) and apply to every tier, notably
`local_server` — which refuses to run against a dev server whose revision does not match the working
tree, because a long-lived server silently outliving its own source once invalidated a full day of
measurements.
