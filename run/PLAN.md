---
type: plan
title: Trainer weeks, 2026-10-10
description: The plan and the state of a run in which 100 invented trainer weeks are ranked, 10 are lived with LibrePT, and their gaps and defects become TODO.md items. Read this first to resume.
tags: [exploratory, trainer-week, resumable]
---

# Trainer weeks, 2026-10-10

Asked by Simon, 2026-10-10 04:37: Sonnet subagents write about 100 different weeks of a personal
trainer; they are ranked by feasibility; the top 10 are picked for diversity; each of the 10 goes to
a subagent with a clean context, which lives the week with LibrePT and reports gaps and defects; the
orchestrator judges the reports and writes action items in TODO.md. **Every agent knows the token
quota is limited, and all work is written so it can be resumed.**

## How to resume

1. `git fetch origin trials/weeks-2026-10-10` holds a copy of this folder under `run/` if this
   machine is gone; copy it back to `.private/exploratory-test/weeks/2026-10-10/`.
2. Read **State** below. Each phase lists its files; a file that is complete ends with its own end
   marker, so a phase is resumed by re-running only the agents whose files are missing or unfinished.
   Each prompt in `prompts/` already tells its agent to read its own file first and continue.
3. Run `checkpoint.sh` after every phase step, and whenever an agent returns.
4. Before phase 3: `python3 .agents/skills/exploratory-test/cloud_setup.py` (cloud session) starts
   the dev server; the runners use `http://localhost:8081/LibrePT/`. **Do not switch branches in the
   working tree while runners run: the dev server serves it.**

## Phases

| Phase | What | Who | Files | Done when |
| --- | --- | --- | --- | --- |
| 1 | 100 weeks, 10 batches of 10, one theme per batch | 10 Sonnet agents | `gen/batch-NN.md` | each file ends with `<!-- konec serije NN -->` |
| 2 | Feasibility score and diversity tags for every week | 2 Sonnet agents (A: batches 01–05, B: 06–10) | `rank/rank-A.md`, `rank/rank-B.md` | each ends with `<!-- konec ocen X -->` |
| 2b | Top 10 for diversity | orchestrator | `rank/selection.md` | the table of 10 exists |
| 3 | Live each week with LibrePT | 10 Sonnet agents, 3 at a time, ports 9361–9370 | `runs/rNN/` | `runs/rNN/report.md` ends with `<!-- konec poročila rNN -->` |
| 4 | Judge every finding; write TODO.md items | orchestrator | `evaluation.md`, TODO.md §80 and §88 | every finding has a verdict in `evaluation.md` |

## State

Updated by the orchestrator after every step.

- 2026-10-10 04:46 — tooling committed on `feat/week-trials` (09b248d): `EXPLORE_PORT`, `clock`.
  Phase 1 not started.
- 2026-10-10 05:00 — **phase 1 done**: 10 batches, 100 weeks, every end marker present, ~85,000
  words. Batches 06 and 10 report a few numeric slips; the ranking will see them. Phase 2 started.

## Decisions taken

- **Feasibility means realism**: could a real personal trainer in Slovenia have this week (hours,
  travel, prices, loads, number of clients). Not "how well LibrePT could carry it": that is what
  phase 3 measures, and scoring it in advance would pick the weeks the app already suits.
- **Generators never see the app.** The skill's rule for mode 2: a day invented after looking at the
  app is planned around it.
- **Runners use Sonnet too**, for the quota. Their findings are reproduced by the orchestrator before
  they become TODO items, so a weaker report costs a check, not a wrong item.
- **Three runners at a time.** The machine has two cores, and each runner holds a browser.
- **The app's clock is shifted** to the simulated day (`explore.py clock`), so Monday's sessions
  happen on a Monday as the app sees it.
- 2026-10-10 05:20 — **phase 2 done**: rank-A and rank-B, 100 rows (37 × 5, 47 × 4, 16 × 3).
  **Phase 2b done**: `rank/selection.md`, ten weeks copied to `runs/r01..r10/week.md`.
  `known.md` lists 35 open §80 defects and 16 open §88 gaps. Phase 3 starts with r01–r03 on ports
  9361–9363; waves of three: r01–r03, r04–r06, r07–r09, r10.
