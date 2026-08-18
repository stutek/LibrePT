---
type: index
title: LibrePT Agent Tools Catalog
description: Catalog of durable, repo-owned tools an AI agent runs instead of improvising a throwaway script — what each one checks, how to run it, and the bar a new tool must clear.
status: active
tags:
  - index
  - agent-tools
  - tooling
  - okf
---

# Agent Tools (`agent_tools/`)

Tools an agent would otherwise rewrite as a one-off shell pipeline every session. A throwaway script
costs the same tokens every time and leaves nothing behind; a tool here is written once, reviewed
once, and runs in the gate forever.

**Every tool in this directory** runs as `python -m agent_tools.<name>` and appears in the catalog
below. Two categories, distinguished by the Type column:
- **`check`** — needs no network and no browser, exits non-zero on failure, prints findings as
  `path:line  message`. Cheap and deterministic enough to gate `build check`.
- **`diagnostic`** — a manual tool an agent runs on demand while investigating something (not
  wired into the gate); may need a browser and a running server. Still exits non-zero on a
  well-defined failure (e.g. a requested selector never found), still gets a unit test for its
  pure-logic parts.

## Catalog

| Tool | Type | Runs in | Description |
| :--- | :--- | :--- | :--- |
| [doclinks.py](doclinks.py) | `check` | `build check` Stage 1 | Verifies the OKF knowledge graph connects: every relative Markdown link resolves to a real file, every `#anchor` to a real heading, and every `§N.M` to a real numbered section. Suggests the nearest surviving anchor when one is dead. |
| [catalog_coverage.py](catalog_coverage.py) | `check` | `build check` Stage 1 | Verifies [docs/SRC_MODULES.md](../docs/SRC_MODULES.md) still describes the tree: every runtime `.js`/`.css` under `src/` is catalogued, and every catalogued path still exists. Complements `doclinks.py`, which proves links RESOLVE but cannot see a module nobody linked — it found 22 uncatalogued modules when first run, including the live-session controller. |
| [module_headers.py](module_headers.py) | `check` | `build check` Stage 1 | Verifies that a module whose first line NAMES a path names its own (AGENT_RULES §5.4). A header opening with prose makes no such claim and is left alone; a path mentioned after the first token is a reference to another module, not a self-claim. Moving a file is both what invalidates line 1 and the moment nobody thinks to look at it — 28 modules named directories the repo no longer had (`components/`, `helper/`, `src/views/`) when this was first run. Auto-fixable with `--fix`. |
| [import_layers.py](import_layers.py) | `check` | `build check` Stage 1 | Verifies the import graph flows one way (`data` → `domain` → `modules/common` → `modules/<feature>` → `controllers`), so every module stays independently mountable — the property `tests/medium/` depends on. Cross-feature imports are deliberately allowed; importing UP a layer is not. Found two inversions when first run, both fixed by injection/relocation rather than exemption. |
| [python_version.py](python_version.py) | `check` | `build check` Stage 1 + `structure-checks` job | ONE declaration of the Python version (`.python-version`, which `actions/setup-python` reads via `python-version-file:` and pyenv reads directly), and this machine on it. Added after CI ran 3.11 while the maintainer's machine ran 3.14.4 with nothing saying so — a "works locally" that is not about the tests at all. **A literal `python-version:` in a workflow is itself a failure**, whatever number it carries: the first attempt at this bumped thirteen literals and checked they agreed, which is a checker whose job is keeping copies in step, i.e. the shape of a missing single source of truth. Minor versions only — patch differences are what runner images and developers legitimately differ on. |
| [pipeline_gates.py](pipeline_gates.py) | `check` | `build check` Stage 1 + `structure-checks` job | Both directions of "a check that blocks nothing": every CI job must gate the deploy (exactly one terminal job, everything else inside its transitive closure), AND every Stage 1 check must be invoked by some CI job — a local gate with no workflow step blocks your commit but not the deploy. Four had drifted that way before this half existed. Third and fourth checks: CI must enforce the same STAGE ORDER as `build check`, read from `build/__init__.py`'s `PIPELINE_STAGES` so the order is declared once rather than maintained in two files — and every job's `name:` must state the stage it actually runs, so a job cannot sit between stages the way `static-security-audits` did. |
| [icon_coverage.py](icon_coverage.py) | `check` | `build check` Stage 1 + `structure-checks` job | Verifies every `fa-` icon class in `src/` maps to a glyph the shipped stylesheet can render. A missing glyph is INVISIBLE — CSS resolves it to nothing and the control renders as a gap, with no error and no failing test — so a Font Awesome **Pro** class is indistinguishable from a typo at runtime. Its first run found two live ones: `fa-wifi-slash` on the header's offline indicator and `fa-sparkles` on the demo invitation. Pure text analysis against the CSS (no font parsing, no `fonttools`), and a prerequisite for ever subsetting the font (TODO §12.6), which turns "correct class, glyph not shipped" into the same silent gap. Class names built at runtime (`fa-arrow-${dir}`) are declared explicitly, since no scanner can derive them. |
| [icon_render.py](icon_render.py) | `diagnostic` | manual, on demand | Renders every PWA icon and the favicon from the single master artwork (`assets/icon-master.png`) via headless Chromium, at the sizes `src/manifest.json` declares — so the sizes have one source of truth and a binary icon stays editable at all (an agent cannot hand-edit a PNG). Renders `any` and `maskable` at deliberately different scales, since a maskable icon is cropped to the centre 80% circle and artwork drawn edge-to-edge loses its corners; `purpose: "any maskable"` on one file is therefore always wrong for one of the two. The favicon is cropped to the whistle alone — the full clipboard mark is an unreadable smudge at tab size. `--check` reports drift without writing. |
| [test_assertions.py](test_assertions.py) | `check` | `build check` Stage 1 + `structure-checks` job | Verifies tests pin the BEHAVIOUR a caller depends on, not the mechanics that produce it (AGENT_RULES §5.8): exact multi-class strings, assertions on a stub's call count, identity equality standing in for "unchanged", and counters a stub keeps that nothing reads. Written because auditing 125 test files by hand costs more than the cleanup is worth and decays with the next test written — and it found a true positive the manual audit had missed on its first clean run. Each finding is cleared by NAMING the rule, which is what §5.8's three carve-outs require anyway; it is not an allowlist. Cannot see naming or over-mocking — those still need a reader. |
| [complexity.py](complexity.py) | `check` | `build check` Stage 1 | Cyclomatic (McCabe) complexity gate for `src/**/*.js`, via a real `tree_sitter_javascript` parse (not a regex heuristic — this codebase leans on `?.`/`??` throughout). No allowlist mechanism (AGENT_RULES §2.A.3) — every over-limit function fails the build unconditionally; split it instead. |
| [overflow_scan.py](overflow_scan.py) | `diagnostic` | manual + `tests/e2e/test_layout_overflow.py` (stage 3) | Sweeps a rendered page for components that break out of their box: **A** — nothing extends past its nearest CLIPPING ancestor (not the viewport: `body` is a 480px centred column, and `body { overflow-x: hidden }` already masks this whole class from any root-level `scrollWidth` check); **B** — nothing is silently clipped inside its own box. Declared scroll containers, the ellipsis idiom and out-of-flow parked drawers are exempt per axis, each for a reason its docstring states. Owns the sweep so the e2e suite and a by-hand diagnosis run the same check; presets for iPhone 14 / Galaxy S23 Ultra / desktop. |
| [render_docs.py](render_docs.py) | `check` | `build check` Stage 1 + `structure-checks` job | Renders user-facing Markdown (currently [PRIVACY.md](../PRIVACY.md)) into shipped HTML under `src/`, so documents a non-developer reaches from the app work **offline** and live on a domain we can prove we own — OAuth verification requires the latter, and `github.com` fails both. Markdown stays canonical and stays in the doc graph (AGENT_RULES §5.6 keeps `.md` out of `src/`); only the generated page ships. Configured for the narrowest output rather than the most featureful: `html=False` passed explicitly so a library upgrade cannot re-enable raw-HTML passthrough, link-scheme validation on, and a `default-src 'none'` page shell that loads no scripts. `--check` re-renders and fails on drift, so an edited policy can never ship as stale HTML. |
| [google_credential.py](google_credential.py) | `diagnostic` | manual, on demand | Mints the live canary's Google refresh token in one command, replacing [the setup runbook](../docs/GOOGLE_CLOUD_SETUP.md)'s export-three-variables → paste-a-heredoc → `curl`-pipeline sequence. Collapsing the two steps removes the footgun that shaped them: the authorization code is **single-use**, and writing it to a file between steps meant any stumble after that burned it ("start again at B2"). Also stops the scopes being retyped per run — they mirror `GOOGLE_DRIVE_SCOPE` and the live suite's `OVERBROAD_SCOPES`, with a unit test asserting the mirror holds, since a stray `drive` scope keeps every Drive test green while production's narrow `drive.appdata` is broken. Verifies the grant against `tokeninfo` **before** writing, so a wrong consent-screen selection surfaces at mint time rather than on a scheduled run days later. |
| [credential_expiry.py](credential_expiry.py) | `check` | `google-canary` workflow (not `build check` — see below) | Fails once the canary's Google credential is within a month of Google's six-month **unused**-token revocation, measured from the `minted` stamp `google_credential.py` writes. The clock is the trap: it resets on every use, so the daily canary keeps the token alive and nothing ever comes due — until the canary silently STOPS (GitHub disables scheduled workflows after 60 days of repository inactivity), after which there is nothing to observe until the credential is already dead. A deadline is therefore the only workable guard. Runs in the canary rather than Stage 1 because a contributor's clone has no credential, and a check that skips when the file is absent gates nothing; [tests/unit/test_google_canary_workflow.py](../tests/unit/test_google_canary_workflow.py) asserts from Stage 1 that the workflow still runs it. |
| [demo_recording.py](demo_recording.py) | `diagnostic` | manual, on demand | Records the scripted demo tour (TODO §23.5) as a phone-sized `.webm`, for channels that cannot embed a live app. Authors nothing: it points a camera at `gymFloorTour.js`, the same script the e2e suite replays, so re-shooting after a UI change is running the command again. **Refuses to write a file when the tour fails** — a recorder that saved one regardless would reintroduce exactly the stale, confident-looking asset a script was chosen to avoid, only now showing a broken app. Two defects it produced on the first takes are pinned in its comments, and both had a clean exit code: the first-run Terms modal covering the demo (the recorder skipped the fixtures conftest applies), and grey letterboxing from filming a 1280x720 window around a 390x844 page. Check the footage by eye. |
| [layout_probe.py](layout_probe.py) | `diagnostic` | manual, on demand | Reads real, rendered layout (bounding boxes + computed style) for one or more CSS selectors on a running page via headless Chromium — for pinning down a reported CSS positioning bug (wrong sticky/fixed offset, a custom property not cascading where expected) without writing a fresh throwaway Playwright script each time. |

## When to add a tool here

Add one when **all three** hold; otherwise just run the command:

1. **It will run again.** A check tied to an invariant that outlives the change — not a one-off
   inspection of today's diff.
2. **It fails silently otherwise.** The thing it catches is invisible to review. A dangling `§16.2`
   still reads like a correct sentence; only following it reveals it goes nowhere.
3. **It is cheap and deterministic.** File analysis, no network, no browser, no flakiness — so it
   can sit in Stage 1 next to the linters.

A tool that fails (2) belongs in the test suite; a tool that fails (3) belongs in Stage 2.

**Adding one means all of:** the module (with a docstring saying *why it exists*, not just what it
does), a row in the catalog above, a unit test in [tests/unit/](../tests/unit/), and — if it should
gate commits — a task in `run_stage_1_parallel()` in [build/\_\_init\_\_.py](../build/__init__.py).

## Related

- [AGENT_RULES.md](../AGENT_RULES.md) — §6 states the build-a-tool rule these implement
- [INDEX.md](../INDEX.md) — the master knowledge index
- [build/](../build/) — the pipeline these tools are wired into
