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
| [tests/unit_js/](unit_js/) (21 files, 81 tests) | `node:test`, stage 1 | one ES module, no DOM | It pins **pure logic** — schema/migration transforms, id generation, merge algorithms, projections. Mirrors the `src/` subpath it covers. |
| [tests/medium/](medium/) (13 files) | Playwright, stage 2 | one component against real `index.html` markup | It needs the **DOM/CSS** but not navigation, persistence or a real app boot. Two shapes, both in [_harness.py](medium/_harness.py): `HEADER_STUB` for the header and its route-backed dialogs, `view_stub()` for one view (shell markup → activate → render). |
| [tests/e2e/](e2e/) (43 files) | Playwright, stage 3 | the whole app | It needs the router, IndexedDB, the service worker, reload/deep-link behaviour, or a multi-step flow across views. |

**Why the split is worth maintaining:** the pure-logic tests used to run in a browser purely because
the app's CSP forbids `new Function` — they now fail in ~4s inside stage 1 instead of at the
3-minute mark. The win is *feedback latency*, not total wall clock: e2e is fanned out across workers,
so moving cheap tests out of it barely moves the stage's duration (measured — do not expect
otherwise), while moving a *slow* one does.

**What is left in `tests/e2e/` is there on merit — and that claim was audited, not assumed.** An
earlier pass declared the pool exhausted after examining only the files a crude grep had flagged;
a file-by-file review of all 44 then found eight more movable tests, including two whose own header
comment (written during that pass) gave a reason that was simply false. If you are tempted to
conclude the migration stopped early, check against that review rather than against a pattern match.
The remaining files each have a concrete reason to boot the whole app: a `page.reload()` asserting state survives it, a
live session started through the real `openSessionFromHistory` path (test_quick_signal_toggle says
so in its own header, and a medium version would substitute exactly the hand-built shortcut its
author rejected), a real IndexedDB engine or Storage API, a service-worker install, a download, or
`app.js`'s boot wiring itself. Moving those would not make them faster — it would make them test
something else.

**Shared fixtures** live in [tests/conftest.py](conftest.py) and apply to every tier, notably
`local_server` — which refuses to run against a dev server whose revision does not match the working
tree, because a long-lived server silently outliving its own source once invalidated a full day of
measurements.
