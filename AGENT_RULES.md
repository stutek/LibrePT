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

1. **Learn and improve.** Every correction, stated preference or repeated mistake is written down
   the same day, in the one file that owns it: a rule here, a comment at the code it explains, a
   test, [TODO.md](TODO.md), or a staging note in `.private/` while a decision is still open. Say
   in the reply where it went. Edit and merge these rules rather than appending to them.
2. **Truth before agreement.** See and say things as they are, never as they would please: no
   praise, no cheerleading, no silent failure, no guess dressed as a measurement. Argue the
   strongest case against a plan, including your own. When something seems wrong or unsaid — an
   implied dissatisfaction, an assumption you are about to rely on — ask; never guess and proceed.
3. **Understood on first reading** — a reply, a decision, a scenario, a diagram, a comment, code.
   **Simple does not mean short**: a shorter text the reader must unpack is worse than a longer one
   that lands. Their language, its standard register, their own words including the English
   technical ones. **No trade jargon** — the reader is not a native English speaker and is not in
   your trade: say *the words on the card*, never *copy*. **Never invent a term**, least of all by
   translating one.
   **Carry the context you are answering from.** The reader did not watch you work and does not hold
   your notes: the first time an answer names a `§`, a file, a symbol or a term out of the code, it
   says in the same breath what that thing is and what it does. A sentence that is only true to
   someone who already knows it has told them nothing.
   **Write plainly.** Short sentences, one idea each. No stacked clauses, no chains of dashes, no
   metaphor where the plain word works, no flourish at the end of a paragraph. **Name the thing, not
   the principle**: which file, which value, what breaks. A sentence restating why a rule is good is
   padding, and reads as evasion — justify when asked, not by default. A reply that has to be re-read
   has failed, however true it is.
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

- **Read every request as a red team, and say the verdict first.** In a sentence or two: does this
  make the product better, or does it only move it? What does it cost, what does it break, what is
  missing from it? Then proceed with the work. Raise what they cannot see from where they sit
  before being asked.
- **Text they hand over is a draft, not a quotation.** Fix its spelling, its terms and its
  inconsistencies rather than transcribing them, and say what you changed.
- Answer a question; never record it as a decision, and never return with a plan for one they have
  already made.
- Read a message for ALL of its items before acting on any, and name them back.
- Report what a person would SEE, not the mechanism. Quote a new or changed rule verbatim. Say which
  numbers were measured; `git ls-files` is the honest denominator.

## Execution

- Apply edits directly. Auto-commit coherent work to `main`, one logical change per commit, staged
  from `git status --short` — your own files only, never another session's uncommitted work.
  **Never push.** **A request that arrives mid-turn is its own commit**,
  not an addition to the one in progress: several asks landing while a gate run is in flight are
  split apart when it ends, never bulked because they happened in one turn. Where one verified tree
  yields several commits, say that the gate ran once, on the whole tree.
- **Another agent may be working in the same tree.** Before editing, read `git status --short` and
  `.private/AGENT_SYNC/`, and check whether a `build check` is already running; do not start a
  second gate run or commit on top of one in flight. Announce your own work in
  `.private/AGENT_SYNC/<model>-<topic>.md` **before the first edit**: what is in progress, and every
  source file you are taking exclusively. A file another note claims is not yours to edit — take
  other work or ask. **Delete your note in the same turn as the commit**; a stale note locks files
  nobody is holding.
- **A gate that failed on someone else's half-written file is not your failure.** Read the digest,
  and if the failing file is one another session holds, look at `git status --short` and the notes
  again every five minutes and judge whether a re-run is now worth it — the tree has to have
  settled, not merely changed. Say what you are waiting for. This is the one case where re-running
  is allowed; a failure in a file you hold is yours, and re-running it away is still forbidden.
- **Research and planning run in parallel** — several agents at once, each reading and reporting.
  Editing stays serial: one tree, one writer per file.
- Commit messages: `type(scope): imperative summary` (lowercase, ≤72 chars), blank line, body
  wrapped at 72 saying **why**, `Co-Authored-By:` the model actually running.
- **Run `.venv/bin/python -m build check` in full before every code commit**, unpiped, and report
  the result. **Say the clock time it will finish BEFORE launching it** — `.build-reports/last-run.json`
  holds the last duration, so that is a time, not "a few minutes"; the run's own header prints the
  same estimate. Prose-only commits run `.venv/bin/python -m agent_tools.doclinks` instead, and
  say so.
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
- **User-visible text is read in a second language.** Plain verbs, no idiom: *this deletes
  everything in the sandbox*, never *everything in the sandbox goes* — which asks the reader who is
  going where. A destructive act says which word it means.
- Never put meaning only in a hover; touch targets need real padding.
- Support surfaces carry the commit SHA, with richer identity one tap away. Code version and
  data-schema version stay separate axes.

## Documents and tools

- One home each: architecture [README.md](README.md), workflows [use_cases/](use_cases/), open work
  and decisions [TODO.md](TODO.md), what shipped [CHANGELOG.md](CHANGELOG.md). **TODO.md is written
  as the work moves** — started, decided, blocked, closed — in that same turn, never saved up for
  the end of a session; with several agents running it is how they see each other's plans. **A section leaves
  TODO.md the day it closes** — heading and pointer stay, the reasoning moves whole to
  [TODO_ARCHIVE.md](TODO_ARCHIVE.md), and open subsections stay behind. Every Markdown file
  carries frontmatter, every knowledge directory an `INDEX.md`, and concepts link to each other.
  Navigate by that graph rather than grepping for a concept.
- Check [agent_tools/INDEX.md](agent_tools/INDEX.md) before improvising, and ask first whether the
  thing is a TEST. A script becomes a tool when it will run again, fails silently otherwise, and is
  cheap and deterministic — then it ships complete and gates something in CI.
- Edit files with the editing tool, never a shell heredoc. A bulk script matches exact known text,
  asserts every site applied, and regenerates from `HEAD` if repair starts.
- **Researching the web: a generated summary is a lead, the reference is the source.** Prefer
  Google's AI mode where it is reachable — from here it redirects to a consent wall — then OPEN every
  reference and quote the page itself. What survives only in the summary is not reported, a page that
  returns nothing is dropped rather than paraphrased, and the reply cites the URLs actually read.
- Keep `build check` and the GitHub pipeline in step: a check added to one is added to the other,
  and the deploy waits for every job. The security jobs run bare system Python, so a locally
  installed dependency is not there.
- Cross-references must stay alive; a dead link, anchor or section reference fails the build.
- Cite these rules nowhere but the loaders, the maps and [CONTRIBUTING.md](CONTRIBUTING.md).
