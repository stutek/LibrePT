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
| [tests/unit/](unit/) (17 files + `test_app.py`, 92 tests) | pytest, stage 1 | nothing — static analysis of the repo | It inspects files/structure: layout rules, i18n parity, doc links, generated catalogs. |
| [tests/unit_js/](unit_js/) (21 files, 81 tests) | `node:test`, stage 1 | one ES module, no DOM | It pins **pure logic** — schema/migration transforms, id generation, merge algorithms, projections. Mirrors the `src/` subpath it covers. |
| [tests/medium/](medium/) (20 files, 72 tests) | Playwright, stage 2 | one component against real `index.html` markup | It needs the **DOM/CSS** but not navigation, persistence or a real app boot. Four shapes, all in [_harness.py](medium/_harness.py): `HEADER_STUB` (header + its route-backed dialogs), `SESSIONS_STUB` (the dashboard timeline), `clipboard_stub()` (the live session, fed an injected `activeSession`), and `view_stub()` to build one for any other view — shell markup → activate → render. |
| [tests/e2e/](e2e/) (34 files, 109 tests) | Playwright, stage 3 | the whole app | It needs the router, IndexedDB, the service worker, reload/deep-link behaviour, or a multi-step flow across views. |

**Why the split is worth maintaining:** the pure-logic tests used to run in a browser purely because
the app's CSP forbids `new Function` — they now fail in ~4s inside stage 1 instead of at the
3-minute mark. The win is *feedback latency*, not total wall clock: e2e is fanned out across workers,
so moving cheap tests out of it barely moves the stage's duration (measured — do not expect
otherwise), while moving a *slow* one does.

**Expect the gate to get slightly LONGER, not shorter, as tests move down a tier.** Measured on the
26-test clipboard migration: stage 3 fell 115s → 97s while stage 2 rose 20s → 83s, for ~+23s
overall. Both stages run at the same worker count, so a test removed from a well-packed e2e fan-out
saves only its share of one worker's queue, while the same test arriving in the smaller stage-2 pool
adds close to its full cost. What is bought is that a broken component now fails at the 85-second
mark against one mounted module instead of at the 3-minute mark against the whole app. Do not
justify a migration on total wall clock — it will not deliver that.

**Duplication is the other thing an audit finds, and it does not show up as a tier mistake.** Two
full-app flows can each be legitimately e2e and still assert the same thing twice: `test_clipboard.py`
was a strict prefix of `test_gym_floor_flow.py` and was deleted in 2026-08-05's pass, exactly as
`test_browser.py`'s sessions-dashboard tests had been earlier. Neither was in the wrong tier — both
were simply already covered. When reviewing a file, check what ELSE asserts it before concluding it
has to stay.

**What is left in `tests/e2e/` is there on merit — and that claim was audited, not assumed.** An
earlier pass declared the pool exhausted after examining only the files a crude grep had flagged;
a file-by-file review of all 44 then found eight more movable tests, including two whose own header
comment (written during that pass) gave a reason that was simply false. If you are tempted to
conclude the migration stopped early, check against that review rather than against a pattern match.
The remaining files each have a concrete reason to boot the whole app: a `page.reload()` asserting
state survives it, a real IndexedDB engine or Storage API, a service-worker install, a download, or
`app.js`'s boot wiring itself. Moving those would not make them faster — it would make them test
something else.

**The clipboard was the one large exception, and it is now resolved.** Half the e2e suite used to be
the gym-floor clipboard, held there because `activeSession`'s shape was written down nowhere — the
only reliable way to get a valid one was to drive the real flow. `active_session_fixture()` +
`clipboard_stub()` in [_harness.py](medium/_harness.py) encode that contract, mounted through the
same `bootActiveSession` step `app.js` calls, so the render/interaction half of that feature now
lives in `tests/medium/`. What stayed is the lifecycle (start → log → finish → history), the deep
links (a focus or edit-mode URL surviving a reload), and the seams between the clipboard and another
component's boot step.

**Counts above are what pytest COLLECTS, not `grep -c "def test_"`.** Parametrised tests expand at
collection (`[chromium-nebula]`, `[chromium-10]`, `[chromium-23]`), so the function count understates
every browser tier — it read 67/109 where pytest collects 72/110. Recount with
`pytest <dir> --collect-only -q`, never with grep.

**Shared fixtures** live in [tests/conftest.py](conftest.py) and apply to every tier, notably
`local_server` — which refuses to run against a dev server whose revision does not match the working
tree, because a long-lived server silently outliving its own source once invalidated a full day of
measurements.
