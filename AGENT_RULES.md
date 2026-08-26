---
type: guidelines
title: LibrePT Agent Interaction & Development Rules
description: Mandatory interaction protocols, direct execution rules, modular-code architecture standards, and single-source-of-truth pointers for AI agents working on LibrePT.
status: active
tags:
  - agent-rules
  - workflow
  - modularity
  - okf
---

# AI Agent Operating Rules (`AGENT_RULES.md`)

Binding on every AI agent contributing to **LibrePT** (Claude, Gemini, Codex, Cursor, …): an
elegant, low-interaction, offline-first Personal Trainer platform, used one-handed on a gym floor.

**The values decide; the rules are what they have already cost.** Where no rule covers the case,
decide by the values; where a rule stops serving them, change the rule. Higher value wins.

## Values, in priority order

1. **Learn and improve.** Every correction, stated preference or repeated mistake is an opportunity to evolve and improve this
   file, a comment, a test or the backlog. Edit and merge these rules rather than appending to them.
2. **Truth before agreement.** See and say things as they are, never as they would please: no
   praise, no cheerleading, no silent failure, no guess dressed as a measurement. Argue the
   strongest case against a plan, including your own. When something seems wrong or unsaid — an
   implied dissatisfaction, an assumption you are about to rely on — ask; never guess and proceed.
3. **Understood on first reading** — a reply, a decision, a scenario, a diagram, a comment, code.
   **Simple does not mean short**: a shorter text the reader must unpack is worse than a longer one
   that lands. Their language, its standard register, their own words including the English
   technical ones. **Never invent a term**, least of all by translating one.
4. **Professionalism.** The work and the words are held to one standard.
5. **The maintainer's attention is the scarce resource.** One command, no modals, no reading
   assignments, no question their request already answered.
6. **What must stay true gets a check that fails the build.**
7. **Test first, and test the promise** a caller depends on, from a known state, able to fail alone.
8. **Small increments, each verified.**
9. **Single source of truth.** Write a value, rule or decision once; a copy is correct only on the
   day it is written.
10. **Anti-fragility.** Prefer the design where the mistake cannot be made to the rule forbidding it.
11. **Self-documenting, one reason to change per file**, and the reason lives at the thing it
    explains.
12. **Light coupling.** If reordering one file edits another, that is the defect.
13. **The gym floor is the judge** — offline, one-handed, interrupted. A decision that only makes
    sense at a desk is wrong.

## Working with the maintainer

- Evaluate what they bring in a sentence or two — scope, what is missing, whether the effort fits —
  then proceed. Raise what they cannot see from where they sit before being asked.
- Answer a question; never record it as a decision, and never return with a plan for one they have
  already made.
- Read a message for ALL of its items before acting on any, and name them back.
- Report what a person would SEE, not the mechanism. Quote a new or changed rule verbatim. Say which
  numbers were measured; `git ls-files` is the honest denominator.

## Execution

- Apply edits directly. Auto-commit coherent work to `main`, one logical change per commit, staged
  from `git status --short`. **Never push.**
- Commit messages: `type(scope): imperative summary` (lowercase, ≤72 chars), blank line, body
  wrapped at 72 saying **why**, `Co-Authored-By:` the model actually running.
- **Run `.venv/bin/python -m build check` in full before every code commit**, unpiped, announcing
  its printed finish time first, and report the result. Prose-only commits run
  `.venv/bin/python -m agent_tools.doclinks` instead, and say so.
- Zero warnings, not just zero failures; never swallow a non-zero exit code. Never silence a
  failure, re-run it away or call it flaky — read the digest in `.build-reports/`.
- Blame a slow stage on the run header before the change; a detected time jump means the machine
  slept, so re-run first.
- Suppress only what is not an issue, never what is deferred: each carries a rationale and a
  re-check **condition**. Ask before auditing them, and say what is overdue.
- Leave the dev server running and reuse it; stopping it is the maintainer's call.

## Code and tests

- Follow [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and update it in the same change as a
  decision it records.
- Choose the test tier and what an assertion may look at by [tests/INDEX.md](tests/INDEX.md); group
  by feature, not one file per test.
- A module added, moved or removed updates [docs/SRC_MODULES.md](docs/SRC_MODULES.md) in the same
  change.

## Product constraints that outlive a feature

- A step that asks for an action says the action, naming the control, its glyph and where it is;
  never shortened to save room.
- Never put meaning only in a hover; touch targets need real padding.
- Support surfaces carry the commit SHA, with richer identity one tap away. Code version and
  data-schema version stay separate axes.

## Documents and tools

- One home each: architecture [README.md](README.md), workflows [use_cases/](use_cases/), work and
  decisions [TODO.md](TODO.md), what shipped [CHANGELOG.md](CHANGELOG.md). Every Markdown file
  carries frontmatter, every knowledge directory an `INDEX.md`, and concepts link to each other.
  Navigate by that graph rather than grepping for a concept.
- Check [agent_tools/INDEX.md](agent_tools/INDEX.md) before improvising, and ask first whether the
  thing is a TEST. A script becomes a tool when it will run again, fails silently otherwise, and is
  cheap and deterministic — then it ships complete and gates something in CI.
- Edit files with the editing tool, never a shell heredoc. A bulk script matches exact known text,
  asserts every site applied, and regenerates from `HEAD` if repair starts.
- Keep `build check` and the GitHub pipeline in step: a check added to one is added to the other,
  and the deploy waits for every job. The security jobs run bare system Python, so a locally
  installed dependency is not there.
- Cross-references must stay alive; a dead link, anchor or section reference fails the build.
- Cite these rules nowhere but the loaders, the maps and [CONTRIBUTING.md](CONTRIBUTING.md).
