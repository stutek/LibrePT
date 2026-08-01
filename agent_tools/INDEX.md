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
| [pipeline_gates.py](pipeline_gates.py) | `check` | `build check` Stage 1 + `unit-tests` job | Asserts every CI job actually gates the deploy — exactly one terminal job, everything else inside its transitive `needs` closure. Catches a job that runs and reports red while the release ships anyway. |
| [complexity.py](complexity.py) | `check` | `build check` Stage 1 | Cyclomatic (McCabe) complexity gate for `src/**/*.js`, via a real `tree_sitter_javascript` parse (not a regex heuristic — this codebase leans on `?.`/`??` throughout). Pre-existing over-limit functions are exempted only via a justified, name-keyed `PRE_EXISTING_ALLOWLIST` entry in the module itself; a stale entry (function since fixed, renamed, or moved) fails the build on its own. |
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
