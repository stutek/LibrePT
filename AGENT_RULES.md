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

Binding on every AI agent contributing to **LibrePT** (Claude, Gemini, Codex, Cursor, …). The
outcome everything serves: **an elegant, low-interaction, offline-first Personal Trainer platform**,
used one-handed on a gym floor.

Ordered by what they cost when broken, and kept short so all of them stay read. Evidence appears
only where a rule is counter-intuitive without it, and then as a clause, not a paragraph.

---

## 1. Values

Decide by these when no rule covers the case, and change a rule that stops serving them.

- **Separation of concerns** — one reason to change per file.
- **Single source of truth** — write a value once; a copy is correct only the day it is written.
- **Locality** — the reason lives at the code, not in a document pointing at it.
- **Light coupling** — if reordering one file edits another, that is the defect.
- **Anti-fragility** — prefer the design where the mistake cannot be made over the rule forbidding it.
- **Simplicity** — the explicit version a reader can follow beats the clever one.
- **Self-documenting code** — names carry *what*, comments carry *why*.
- **Validation automation** — anything that must stay true gets a check that fails the build.
- **Test first** — the test states the promise in the caller's words; failing once proves it can.
- **Test isolation** — every test starts from a known state and can fail alone.
- **Small increments** — one coherent change per commit, verified before the next starts.

---

## 2. Execution & Git Flow

1. **Apply edits directly**, choosing the best architectural option, without waiting for
   clarification. Questions and recommendations go in the reply, never in a modal.
2. **Auto-commit coherent work to `main`** unasked, one logical change per commit, and **never
   push** — that is the maintainer's deploy trigger. No feature branches; `main` stays releasable.
3. **Stage from `git status --short`**, never from the paths you remember touching: a forgotten file
   leaves HEAD broken while your own tree passes, because the gate certifies the tree it ran on.
   Never sweep in unrelated or concurrently-edited files.
4. **Commit messages are `type(scope): imperative summary`** — lowercase, no trailing period, ≤72
   chars; blank line; body wrapped at 72 columns saying **why** (the constraint, the decision, what
   was measured); footer `Co-Authored-By: <the model actually running> <noreply@anthropic.com>`.
   Never put the body in a CI `run-name` — Actions cannot split a string.

---

## 3. The Pipeline Gate

1. **Run `.venv/bin/python -m build check` in full before every code commit, and report the result.**
   A test subset is not verification; fix pre-existing failures rather than tolerating them.
   **Prose-only exception**: a commit touching *only* Markdown that no gate reads as data runs
   `.venv/bin/python -m agent_tools.doclinks` instead, and says so. Gate INPUT is not prose —
   `docs/SRC_MODULES.md`, any `INDEX.md` a tool parses, this file when it changes a rule a tool
   enforces. Mixed commits are code commits.

   `python -m build check` runs stages 1→4, each only if the previous was clean; `python -m build`
   then bundles `src/` into `dist/`; `python -m deploy` publishes it. On a quiet box stage 1 takes
   ~5s (Ruff, Biome, `pip-audit`, `tests/unit/`, `tests/unit_js/`, static audits), stage 2 ~50s
   (`tests/medium/`), stage 3 ~2min (`tests/e2e/` at 7 workers ∥ the demo suite at 1), stage 4 ~15s
   (OWASP ZAP baseline) — ~3min in all. Investigate anything past double.

2. **Run it as its own command, unpiped, through the front door**: `build check` and nothing after
   it. No `| tail`, no `| grep`, no wrapper — its output IS the report, and a pipe throws away the
   run header and the digests that say what to do next. Importing `build`'s `run_*` skips the
   staging that gives the gate its meaning. Corrected twice.
3. **Announce a wall-clock finish time before anything long** — quote the line `build` prints;
   elsewhere read `date`. Budgets above assume a quiet box: **read the run header** (cores, free
   memory, load, IO stall, swapping) before blaming a slow stage on the change, and treat a detected
   time jump as the machine having slept, so re-run before investigating.
4. **Finish with zero warnings, not just zero failures** — every stage, ZAP included (`WARN-NEW: 0`
   *and* `FAIL-NEW: 0`). Lint and format are auto-fixed and re-run. Never swallow a non-zero exit
   code, including ZAP's `2` (warnings) and `3` (scan errored): a scan that reaches nothing failed.
5. **Add no new test failures, and never silence one — no automatic re-run.** Retry-and-forgive once
   hid a real `requestAnimationFrame` race for weeks; never call a failure "probably flaky". Read
   the digest instead of re-running blind (`.build-reports/*.log`, the exception, the failing node
   ids), and capture no artifacts in a gated run — escalate one failure with `--screenshot=on`.
6. **Suppress only what is genuinely not an issue; never defer one.** No allowlist for unfixed debt,
   no bare `# noqa`. Every `IGNORE` carries a rationale AND a `RE-CHECK` **condition** — not a date —
   and a rationale nobody can re-derive is deleted rather than carried. **Ask permission to audit
   the suppressions when they fall due** (dates in [TODO.md](TODO.md)) and say what is overdue: a
   green gate proves nothing about what it was told to ignore.
7. Both browser stages take half the cores (`build._playwright_worker_count`), never `-n auto`:
   full-core parallelism starves compositor frames and bursts the dev server's TCP backlog, giving
   `Page.goto` timeouts unrelated to the change. Stage 4 is sequential with 3 for the same reason.
   CI reproduces the four stages from `PIPELINE_STAGES`, asserted by `agent_tools/pipeline_gates.py`.

---

## 4. Learning: a lesson lands in the repository, not in an agent's head

Corrections are the most expensive thing the maintainer produces. One given twice was not captured.

1. **Capture every correction in the SAME change** — also a repeated mistake, a *"why are you doing
   X?"*, or any dissatisfaction. The next session is a different context window.
2. **A lesson need not arrive as a complaint.** A stated value or preference — calm, declarative,
   often appended to something else — is the most durable kind and the easiest to miss.
3. **Read a message for ALL of its items before acting on any**, and name them back in the reply, so
   an omission is visible at once rather than a session later. Where dissatisfaction is implied, say
   what you think the problem is and ask whether the answer changes what you write.
4. **Mine every prompt for a general practice these rules do not state**, and adopt it only if it is
   generally accepted wisdom. Anything true only of this task goes in the comment, the TODO entry or
   the test.
5. **Place each lesson by asking who needs it next**: how any agent must work here → this file; why
   one piece of code is the way it is → a comment at that code; work to do or a decision taken →
   [TODO.md](TODO.md), dated, naming who decided; what shipped → [CHANGELOG.md](CHANGELOG.md); a
   behaviour that must not regress → a test, in the tier that matches how much it boots; the
   maintainer's context and preferences → the agent's private memory.
6. **Never leave a rule governing work here in private memory alone** — unreadable, unreviewable,
   different per agent. Memory may point at a rule; it may not be its home.
7. **Edit, merge and reorder; do not only append.** A lesson usually belongs *inside* an existing
   rule, and every entry refactors its neighbourhood: merge overlapping bullets, delete the
   obsolete, move a rule to the section it belongs in. A file that only grows stops being read, at
   which point every rule in it is decorative. Numbers are positions, not identifiers — nothing
   cites this file.
8. **Write the rule and its evidence, never the apology**, as an instruction: "Stage from `git
   status`", not "staging from remembered paths has caused problems". **Quote a new or changed rule
   verbatim in the reply**, saying what it extends, so rejecting it costs one sentence rather than
   sessions of work done under it.
9. **Cite these rules nowhere — they are for agent consumption only.** Code and tests work from
   behaviour and requirements: [use_cases/](use_cases/) states WHY the app behaves as it does, and
   documents state their own requirement in their own words. Only the loaders
   ([CLAUDE.md](CLAUDE.md), [GEMINI.md](GEMINI.md), `AGENTS.md`), the maps ([INDEX.md](INDEX.md),
   [README.md](README.md)) and [CONTRIBUTING.md](CONTRIBUTING.md) may name this file at all.

---

## 5. Code & Test Architecture

The front end is a buildless native-ES-module app under `src/`. Many small single-responsibility
files beat few large ones: less context to load, fewer collisions, a tree that documents itself.

1. **One responsibility per file**, extracted as soon as it grows inside `src/app.js`, and **headed
   by a comment** naming that responsibility and its injected dependencies. Comments carry the
   constraint the code cannot state; dead code is deleted, not commented out.
2. **Keep `src/` to the runtime app** — it ships wholesale to `dist/`, so no docs, tooling or CI
   there, and no source loose at the repo root. Update
   [docs/SRC_MODULES.md](docs/SRC_MODULES.md) in the same change as any module added, moved or
   removed (gated by `agent_tools/catalog_coverage.py`).
3. **Decouple by dependency injection, not cross-imports.** Components receive `state`, `t`,
   `escapeHTML`, callbacks; reassigned globals are passed as accessors. `agent_tools/import_layers.py`
   gates the layering — `data/` → `domain/` → `modules/common/` → `modules/<feature>/` →
   `controllers/` → `app.js`, importing only from strictly below. `data/` is records at rest,
   `domain/` the training vocabulary, pure. Importing *up* costs a module its independent
   mountability, which `tests/medium/` depends on.
4. **Put a test in the tier that matches how much of the app it boots**, grouped by feature rather
   than one file per test. `tests/unit_js/`: pure logic, no DOM, mirroring the `src/` subpath, under
   a vendored checksum-verified Node with no npm dependency at all. `tests/medium/`: ONE component
   mounted via a `src/appBoot.js` boot step against real `index.html` markup with `app.js`
   intercepted (`tests/medium/_harness.py`) — no router, IndexedDB, service worker or demo seed.
   `tests/e2e/`: full flows needing navigation, persistence or a real boot. `tests/unit/`: Python.
5. **Write the test first.** Where the shape is not knowable until something renders, build first
   and say that is why.
6. **Assert the BEHAVIOUR a caller depends on, never the mechanics.** Ask: if I rewrote the
   internals and kept the contract, would this assertion hold?

   Not `erasurePseudonym(id) === "Client #JANE-A"` but "the label is stable, differs per client and
   carries no PII"; not `drive.created === 1` but "the register ends up holding both erasures"; not
   `classList.contains("hidden")` but `to_be_hidden()`; not `id.length === 22` but "ids are unique,
   sortable, URL-safe".

   Three carve-outs, each NAMED in the test: a class that IS a contract, an avoided side effect ("a
   second sync writes nothing"), and a persisted format that outlives the code. Name tests for the
   promise, not the function.
7. **Prefer saying a thing several times over adding a layer that says it once.** What is rejected
   is an intermediary whose only job is to *choose* — a `kind` field plus a dispatcher. Duplicated
   *logic* still gets extracted.
8. **Scope a side effect added at a shared seam to the event that motivated it.** Enumerate what
   else calls that seam, including re-entry with identical arguments, and test the other caller
   through the real control.
9. **Three traps this app has already paid for:**
   - **Hide a control with the `.hidden` CLASS, never the `hidden` attribute** — every `.btn` here
     sets `display: flex`, which beats the UA stylesheet's `[hidden]` rule, so the control stays on
     screen and only a test notices.
   - **A condition that can already hold when a step begins cannot detect that step finishing.** Ask
     what it reads at the first instant. Visibility inherits every ancestor's: a closed `<dialog>`
     draws nothing, so everything inside it reads as invisible.
   - **A rule that moves A to clear B must not be able to move B** — re-evaluated on a timer it
     oscillates forever. Ask what the rule's own effect does to its inputs, then exclude that case.

---

## 6. Working With the Maintainer

1. **Evaluate what they bring — the request and their own edits alike.** In a sentence or two:
   scope, what is missing, whether the effort is proportionate. Then proceed; skip it for small asks.
2. **Raise what they cannot see from where they sit** — gym friction (offline basements, sweaty
   hands, equipment pivots, group sessions) and architectural opportunities, before being asked.
3. **Plain words, standard register, none invented.** Name the thing to do or the thing that is
   true, then at most one clause of why. Describe what a person SEES, never the mechanism, and never
   in repository vocabulary — no section numbers, no file names used as nouns, no test terms.
   **Reply in the language they wrote in, in its standard written register**: whole sentences,
   ordinary words, no clipped headline fragments. **Never coin a term by translating an English
   one** — "deck" became a ship's deck in a sentence about exercise cards.
4. **No cheerleading, and red-team what is asked for.** Never open with praise, agree to be
   agreeable, or dress a report in enthusiasm — professional throughout, in what is written and how
   it is written. Put the strongest case AGAINST a plan, including your own, and say what you would
   do instead. A maintainer who only hears agreement is working alone.
5. **Answer a question; never record it as a decision.** "Any reason for X?" explores the option
   space: answer, recommend, leave it open. Mark something Decided only when they said so, dated.
   **A decision already given is not re-opened as a plan for approval** — once they have said build
   it, build it, and explain the shape in the commit. Ask again only if proceeding either way would
   be unsafe or would waste the work.
6. **Separate what you measured from what you assume, and scope every count.** Say which numbers
   came from a command and which are estimates, and exclude vendored and generated trees (`.venv/`,
   `node_modules/`, `dist/`) — `git ls-files` is the honest denominator. An unlabelled guess in a
   list of measurements is read as a measurement.

---

## 7. Product Constraints That Outlive Any One Feature

1. **Shipped copy is held to the same plain-words rule as a reply, and a step that asks for an
   action says the action** — imperative first, then at most one clause of why. **An instruction to
   tap something names the control, its glyph and where it is**: "Tap the ☰ button — three stacked
   lines, in the top right corner", never "open the menu", which assumes the reader already knows
   which of forty things on screen that is. Never shorten these to save room.
2. **Never put meaning only in a hover.** On a phone a tooltip is unreachable, so hover-only
   information is information nobody has. Touch targets need real padding.
3. **In support surfaces, prefer the exact always-present identifier**: the commit SHA, which every
   build has, over a tag most deploys sit between. Richer identity goes one tap away, copyable.
4. **Keep code version and data-schema version as separate axes.** The SHA identifies the code;
   `schemaVersion` identifies the data shape and is the only axis storage is keyed on.

---

## 8. Documentation & the Knowledge Graph (OKF v0.1)

1. **Never duplicate feature lists or domain specs.** Architecture: [README.md](README.md).
   Workflows: [use_cases/](use_cases/).
2. **Every Markdown file carries YAML frontmatter** (`type`, `title`, `description`, `status`,
   `tags`), every knowledge directory an `INDEX.md` (file, `type`, link), and related concepts link
   to each other by relative path so agents can traverse the graph.
3. **Navigate BY the graph**: [docs/SRC_MODULES.md](docs/SRC_MODULES.md) and the feature's section
   in [TODO.md](TODO.md) reach the code in one read, with the rationale attached. Grep for a symbol,
   never for a concept.

---

## 9. Agent Tooling: Build the Tool, Don't Re-Improvise the Script

1. **Check [agent_tools/INDEX.md](agent_tools/INDEX.md) before improvising.**
2. **Ask first whether it is a TEST.** Anything asserting something that must stay true is a test,
   whatever it needs to run — a browser and a server are what `tests/e2e/` is for. What stays a
   tool: producing a committed artifact, exploring a running page, and anything needing a human to
   look.
3. **Promote a script to a tool when it will run again, fails silently otherwise, and is cheap and
   deterministic** — all three. Wire it into the gate only once it has caught something more than
   once; checks needing judgement stay periodic audits in [TODO.md](TODO.md). **Ship it complete**:
   a docstring saying why it exists, a catalog row, a unit test, and a Stage 1 task if it gates.
4. **Edit files with the editing tool, never a shell heredoc** — unreviewable in the transcript, a
   silent no-op once its anchor drifts, and impossible for the maintainer to re-run. Corrected
   twice. A script earns its keep only on volume, and then matches an ANCHOR — exact known text —
   never a shape: a bare `" ()"` cleanup broke arrow functions in eleven modules. Assert every
   intended site applied, and if repair starts, regenerate from `HEAD`.
5. **Make every pipeline task gate something.** A CI job nothing `needs:` reports red while the
   deploy ships; a Stage 1 check with no CI job blocks your commit but not the deploy, and
   `agent_tools/pipeline_gates.py` enforces both directions. Group fast checks into one job — a
   fresh runner costs ~30s. **Local green is not CI green**: the ZAP and static-audit jobs run bare
   system Python with no `pip install`. `agent_tools/doclinks.py` fails the build on a dead link,
   anchor or section reference.

---

## 10. Local Dev Server

**Leave it running** across tasks (`python -m deploy.local_http_server`, `DEV_SERVER_PORT` under
`DEV_SERVER_BASE_PATH`) — the maintainer tests changes in the browser. Reuse it if it is already
listening, never spawn a duplicate, and leave stopping it to them unless a change genuinely needs a
restart, which you say first.
