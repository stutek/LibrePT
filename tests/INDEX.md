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
| [tests/unit/](unit/) (19 files + `test_app.py`, 112 tests) | pytest, stage 1 | nothing — static analysis of the repo | It inspects files/structure: layout rules, i18n parity, doc links, generated catalogs. |
| [tests/unit_js/](unit_js/) (32 files, 195 tests) | `node:test`, stage 1 | one ES module, no DOM | It pins **pure logic** — schema/migration transforms, id generation, merge algorithms, projections, domain rules. Mirrors the `src/` subpath it covers, so `src/domain/sessionClock.js` → `unit_js/domain/sessionClock.test.mjs`. |
| [tests/unit_js/security/](unit_js/security/) (3 files, 10 tests) | `node:test`, stage 1 | one ES module, no DOM | It pins a **security property** with no DOM: injection into a generated file, attacker-controlled object keys. Its own gate task and its own CI job (`security-tests`), so a regression is named as a security one instead of a generic unit-test failure. Excluded from the glob above — it is gated separately, not twice. |
| [tests/medium/](medium/) (23 files, 88 tests) | Playwright, stage 2 | one component against real `index.html` markup | It needs the **DOM/CSS** but not navigation, persistence or a real app boot. Four shapes, all in [_harness.py](medium/_harness.py): `HEADER_STUB` (header + its route-backed dialogs), `SESSIONS_STUB` (the dashboard timeline), `clipboard_stub()` (the live session, fed an injected `activeSession`), and `view_stub()` to build one for any other view — shell markup → activate → render. |
| [tests/e2e/](e2e/) (36 files, 136 tests) | Playwright, stage 3 | the whole app | It needs the router, IndexedDB, the service worker, reload/deep-link behaviour, or a multi-step flow across views. |

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

**Those numbers were taken under `--dist=loadfile`, which both Playwright stages have since
dropped** (2026-08-07 — see `run_e2e_tests`, and the budget table in
[AGENT_RULES.md §2](../AGENT_RULES.md)). The conclusion above survives the change, but its
arithmetic shifts: with the file no longer pinned to a worker, a stage's floor is its slowest
*test* rather than its heaviest *file*, so moving a slow test down now removes close to its full
cost from stage 3 instead of a share of one worker's queue. **Before migrating anything for speed,
check which shape the cost has** — `--durations=0` on the suite. In 2026-08-07's pass the entire
stage-3 win, 215s → 45s, came from two harness waits (the distribution flag, then a swallowed 20s
splash-dismiss timeout on every `clean_start` navigation) and **not one test moved between tiers**.
A tight cluster of near-identical durations is a timeout, not work — 17 tests all landing on
~21.2s was the whole tell.

**Duplication is the other thing an audit finds, and it does not show up as a tier mistake.** Two
full-app flows can each be legitimately e2e and still assert the same thing twice: `test_clipboard.py`
was a strict prefix of `test_gym_floor_flow.py` and was deleted in 2026-08-05's pass, exactly as
`test_browser.py`'s sessions-dashboard tests had been earlier. Neither was in the wrong tier — both
were simply already covered. When reviewing a file, check what ELSE asserts it before concluding it
has to stay.

**And check that finished migrations actually deleted their source.** `tests/e2e/test_xss_hardening.py`
survived its own migration: `tests/medium/test_xss_hardening.py`'s header already described moving
the avatar sink down and the initials check into `tests/unit_js/`, both of which had genuinely
happened — the e2e file simply was not removed, and went on asserting verbatim what two other tiers
already asserted. A migration is not finished until the source file is gone; grep both tiers for the
same test name (`ls tests/*/test_<name>.py`) before assuming a duplicate pair is intentional.

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

**Security tests are a concern, not a tier — they live wherever their tier puts them.** Only the
DOM-free ones are collected under [unit_js/security/](unit_js/security/) and gated by name; the
stored-XSS sink is a component test ([medium/test_xss_hardening.py](medium/test_xss_hardening.py))
and IndexedDB injection needs the real engine ([e2e/test_indexed_db.py](e2e/test_indexed_db.py)).
What a test must boot still decides where it lives. Worth knowing when judging coverage: **the OWASP
ZAP baseline scan in stage 4 is PASSIVE** — it spiders and inspects responses, it never injects a
payload — so it cannot see stored XSS from an imported backup, formula injection in a generated CSV,
or prototype pollution on the boot path. None of those cross the network. ZAP is not the reason any
of these classes is covered.

**The frozen backup corpus** lives in [tests/fixtures/backups/](fixtures/backups/) — one committed
file per schema version a real backup can arrive at (1, 2, 3, 4, plus a demo-scale `schema0_demo`
that enters below the floor). Both tiers use the SAME files: `tests/unit_js/data/frozenBackupCorpus`
migrates them as pure logic, and `tests/e2e/test_backup_restore.py` restores them through the actual
import UI. **Never edit an existing fixture** — that stops it testing what it always tested; add a
new one when a version is added.

**Shared fixtures** live in [tests/conftest.py](conftest.py) and apply to every tier, notably
`local_server` — which refuses to run against a dev server whose revision does not match the working
tree, because a long-lived server silently outliving its own source once invalidated a full day of
measurements.
