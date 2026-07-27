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

**Every tool in this directory:** runs as `python -m agent_tools.<name>`, needs no network and no
browser, exits non-zero on failure, prints findings as `path:line  message`, and appears in the
catalog below.

## Catalog

| Tool | Type | Runs in | Description |
| :--- | :--- | :--- | :--- |
| [doclinks.py](doclinks.py) | `check` | `build check` Stage 1 | Verifies the OKF knowledge graph connects: every relative Markdown link resolves to a real file, every `#anchor` to a real heading, and every `§N.M` to a real numbered section. Suggests the nearest surviving anchor when one is dead. |

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
