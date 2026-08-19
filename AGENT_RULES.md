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

Rules are ordered by what they cost when broken, and kept short so all of them stay read. Evidence
appears only where a rule is counter-intuitive without it.

---

## 1. Values

Every rule below applies one of these. When no rule covers the case, decide by these — and when a
rule stops serving them, change the rule.

- **Separation of concerns** — one reason to change per file. Behaviour, requirements and process
  never share a home.
- **Single source of truth** — write a value, rule or decision once. A copy is correct the day it is
  written and silently wrong after.
- **Locality** — the reason lives next to the thing: a comment at the code, not a pointer to a
  document.
- **Light coupling** — nothing depends on how something else is worded, ordered or built inside. If
  reordering one file edits another, that is the defect.
- **Anti-fragility** — prefer the design where the mistake cannot be made over the rule that forbids
  it.
- **Simplicity** — the explicit version a reader can follow beats the clever one.
- **Self-documenting code** — names carry *what*, comments carry *why*.
- **Validation automation** — anything that must stay true gets a check that fails the build.
- **Test first** — the test states the promise in the caller's words; failing once proves it can.
- **Test isolation** — every test starts from a known state and can fail alone.
- **Small increments** — one coherent change per commit, verified before the next starts.

---

## 2. Execution & Git Flow

1. **Apply edits directly**, choosing the best architectural option, without waiting for
   clarification.
2. **Auto-commit coherent work** to `main` unasked: stage what this change touched, one logical
   change per commit. Never sweep in unrelated or concurrently-edited files.
3. **Work directly on `main`** — no feature branches. It must stay releasable; the Pages deploy runs
   on every push.
4. **Never push.** The user pushes; that is their deploy trigger.
5. **Write commit messages as `type(scope): imperative summary`** — lowercase, no trailing period,
   ≤72 chars. Blank line, then a body wrapped at 72 columns saying **why**: the constraint, the
   decision, what was measured. Footer `Co-Authored-By: <the model actually running>
   <noreply@anthropic.com>`. Never put the body in a CI `run-name` — Actions cannot split a string.
6. **No interactive modals.** Questions, options and recommendations go in the chat response.
7. **Stage from `git status --short`**, never from the paths you remember touching. A forgotten file
   leaves HEAD broken while your own tree passes, because the gate certifies the tree it ran on.

---

## 3. The Pipeline Gate

1. **Run `.venv/bin/python -m build check` in full before every code commit, and report the result.**
   A test subset is not verification. Fix pre-existing failures rather than tolerating them.

   **Prose-only exception**: a commit touching *only* Markdown that no gate reads as data runs
   `.venv/bin/python -m agent_tools.doclinks` instead, and says so. Gate INPUT is not prose —
   `docs/SRC_MODULES.md`, any `INDEX.md` a tool parses, this file when it changes a rule a tool
   enforces. Mixed commits are code commits.

   | Command | What it does |
   | :--- | :--- |
   | `python -m build check` | The gate: stages 1→4, each running only if the previous was clean |
   | `python -m build` | Gate, then bundle `src/` into `dist/` |
   | `python -m deploy` | Publish the built `dist/` |

   | Stage | What runs | Typical | Investigate past |
   | :--- | :--- | :--- | :--- |
   | 1 | Ruff, Biome, `pip-audit`, `tests/unit/`, `tests/unit_js/`, static audits | ~4s | 60s |
   | 2 | `tests/medium/` — 193 tests | ~48s | 90s |
   | 3 | `tests/e2e/` at 7 workers ∥ demo suite at 1 | ~2min | 4min |
   | 4 | OWASP ZAP baseline scan | ~15s | 3min |
   | **all** | | **~3min** | **6min** |

   Both browser stages take half the cores (`build._playwright_worker_count`), never `-n auto`:
   full-core parallelism starves compositor frames and bursts the dev server's TCP backlog, giving
   `Page.goto` timeouts unrelated to the change. Stage 4 is sequential with 3 for the same reason.
   CI reproduces the four stages from `PIPELINE_STAGES`, asserted by `agent_tools/pipeline_gates.py`.
2. **Announce a WALL-CLOCK finish time before starting anything long.** `build` prints its own —
   quote that line; elsewhere read `date`.
3. **Read the run header before blaming a slow stage on the change.** It gives cores, workers, free
   memory and load; each stage prints the cores the machine averaged, and the closing line reports IO
   stall and swapping. Budgets above assume a quiet box.
4. **Finish with zero warnings, not just zero failures** — every stage, ZAP included (`WARN-NEW: 0`
   *and* `FAIL-NEW: 0`). Lint and format are always clean: auto-fix and re-run.
5. **Suppress only what is genuinely not an issue; never defer one.** No gate may carry an allowlist
   for unfixed debt, and no bare `# noqa` without a non-applicability rationale.
6. **Give every `IGNORE` line a rationale AND a `RE-CHECK` condition** — an invalidating condition,
   not a date. When a change fires it, re-verify in that change by reading the code, not the comment.
   A rationale nobody can re-derive is deleted, not carried.
7. **Ask permission to audit the suppressions when they fall due, and say what is overdue.** A green
   gate proves nothing about what it was told to ignore. Read the audit dates in [TODO.md](TODO.md)
   at the start of any session that touches the gate; the findings need judgement, so running it is
   the user's call.
8. **Never swallow a non-zero exit code**, including ZAP's `2` (warnings) and `3` (scan errored). A
   scan that reaches nothing is a failed scan.
9. **Add no new test failures, and never silence one. A failing e2e test fails the build — no
   automatic re-run.** Retry-and-forgive once hid a real `requestAnimationFrame` race for weeks; never
   call a failure "probably flaky".
10. **Treat a detected time jump as interruption, not regression** — the machine slept, dropping
    sockets and stalling timers. Re-run before investigating.
11. **Read the digest, don't re-run blind**: `.build-reports/*.log` plus the printed exception, call
    chain and failing node ids.
12. **Capture no artifacts in a gated run** — screenshots cost ~23% of a green e2e stage while
    writing nothing. Escalate per failure with `--screenshot=on` or `--tracing=on`.
13. **Run the gate as its own command, unpiped, through the front door.** Importing `build`'s `run_*`
    skips the staging that gives the gate its meaning, and its output is already the report.

---

## 4. Learning: a lesson lands in the repository, not in an agent's head

Corrections are the most expensive thing the maintainer produces. One given twice was not captured.

1. **Capture every correction as a learning event, in the SAME change** — also a repeated mistake, a
   *"why are you doing X?"*, or any dissatisfaction. The next session is a different context window.
2. **A lesson need not arrive as a complaint.** A stated value, preference or standard — calm,
   declarative, often appended to something else — is the most durable kind and the easiest to miss.
3. **Mine every prompt for a general practice these rules do not state**, and adopt it only if it is
   generic and generally accepted wisdom. Anything true only of this task goes in the comment, the
   TODO entry or the test.
4. **Read a message for ALL of its items before acting on any**, and name them back in the reply, so
   an omission is visible at once rather than a session later.
5. **Place each lesson by asking who needs it next:**

   | The lesson is about… | It belongs in… |
   | :--- | :--- |
   | how any agent must work here | **this file** |
   | why one piece of code is the way it is | a comment **at that code** |
   | work to do, or a decision taken | [TODO.md](TODO.md), dated, naming who decided |
   | what shipped | [CHANGELOG.md](CHANGELOG.md) |
   | a behaviour that must not regress | **a test**, in the tier that matches how much it boots |
   | the maintainer's context and preferences | the agent's private memory |

6. **Never leave a rule governing work here in private memory alone** — unreadable, unreviewable,
   different per agent. Memory may point at a rule; it may not be its home.
7. **Detect dissatisfaction proactively and ask rather than guess.** Stop, say what you think the
   problem is, and ask whether the answer changes what you write — in prose, never a modal.
8. **Edit and reorder the rules; do not only append.** A lesson usually belongs *inside* an existing
   rule. A file that only grows stops being read, at which point every rule in it is decorative.
9. **Reorder freely: this file is read, never referenced.** Numbers are positions for a reader, not
   identifiers — nothing points back here, including this file. Gated by `agent_tools/doclinks.py`.
10. **Write the rule and the evidence, never the apology**, and write it as an instruction: "Stage
    from `git status`", not "staging from remembered paths has caused problems".
11. **Quote the new or changed rule VERBATIM in the reply**, saying what it extends. Rejecting it
    then costs one sentence rather than sessions of work done under it.
12. **Refactor the neighbourhood on every entry**: merge overlapping bullets, delete what is
    obsolete, move a rule to the section it belongs in. The test is whether an agent that read the
    rule and nothing else behaves correctly.
13. **Cite these rules nowhere — they are for agent consumption only.** Code and tests work from
    behaviour and requirements: [use_cases/](use_cases/) states WHY the app behaves as it does.
    Documents state their own requirement in their own words. Only the loaders
    ([CLAUDE.md](CLAUDE.md), [GEMINI.md](GEMINI.md), `AGENTS.md`), the maps
    ([INDEX.md](INDEX.md), [README.md](README.md)) and [CONTRIBUTING.md](CONTRIBUTING.md) may name
    this file at all.

---

## 5. Code & Test Architecture

The front end is a buildless native-ES-module app under `src/`. Many small single-responsibility
files beat few large ones: less context to load, fewer collisions, a tree that documents itself.

1. **Give each file one responsibility.** Extract a unit as soon as it grows inside `src/app.js`.
2. **Organise by concern**: UI in `src/components/`, seed data in `src/data/`, and tests in the tier
   that matches how much of the app they boot —
   - `tests/unit_js/` — pure logic, no DOM, no persistence, mirroring the `src/` subpath. Node's
     built-in `node:test` under a vendored, checksum-verified Node; no npm dependency at all.
   - `tests/medium/` — ONE component mounted via a `src/appBoot.js` boot step against real
     `index.html` markup, `app.js` intercepted (`tests/medium/_harness.py`). No router, IndexedDB,
     service worker or demo seed.
   - `tests/e2e/` — full flows needing navigation, persistence or a real boot.
   - `tests/unit/` — Python static and unit tests.

   Group by feature, not one file per test.
3. **Decouple by dependency injection, not cross-imports.** Components receive `state`, `t`,
   `escapeHTML`, callbacks; reassigned globals are passed as accessors. Layering is gated by
   `agent_tools/import_layers.py`: `data/` → `domain/` → `modules/common/` → `modules/<feature>/` →
   `controllers/` → `app.js`, importing only from strictly below. `data/` is records at rest;
   `domain/` is the training vocabulary, pure. Importing *up* costs a module its independent
   mountability, which `tests/medium/` depends on.
4. **Head every module with a comment** naming its single responsibility and injected dependencies.
5. **Keep `src/` to the runtime app** — it ships wholesale to `dist/`, so no docs, tooling or CI
   there, and no source loose at the repo root.
6. **Update [docs/SRC_MODULES.md](docs/SRC_MODULES.md) in the same change** as any module added,
   moved or removed — gated by `agent_tools/catalog_coverage.py`.
7. **Write self-documenting code inside each module too.** Comments carry the constraint or decision
   the code cannot state. Delete dead code rather than commenting it out.
8. **Assert the BEHAVIOUR a caller depends on, never the mechanics that produce it.** Ask: if I
   rewrote the internals and kept the contract, would this assertion hold?

   | Pinned to mechanics | Pinned to behaviour |
   | :--- | :--- |
   | `erasurePseudonym(id) === "Client #JANE-A"` | the label is stable, differs per client, carries no PII |
   | `drive.created === 1` | the register ends up holding both erasures |
   | `el.classList.contains("hidden")` | `expect(el).to_be_hidden()` |
   | `id.length === 22` | ids are unique, sortable, URL-safe |

   Three carve-outs, each NAMED in the test: a class that IS a contract, an avoided side effect ("a
   second sync writes nothing"), and a persisted format that outlives the code. Name tests for the
   promise, not the function.
9. **Prefer saying a thing several times over adding a layer that says it once.** What is rejected is
   an intermediary whose only job is to *choose* — a `kind` field plus a dispatcher. Duplicated
   *logic* still gets extracted.
10. **Write the test first.** Where the shape is not knowable until something renders, build first
    and say that is why.
11. **Scope a side effect added at a shared seam to the event that motivated it.** Enumerate what
    else calls that seam, including re-entry with identical arguments, and test the other caller
    through the real control.

---

## 6. Working With the Maintainer

1. **Evaluate what the user brings — the request and their own edits alike.** In a sentence or two:
   scope, what is missing, whether the effort is proportionate. Then proceed. Skip it for small asks.
2. **Raise what they cannot see from where they sit** — gym friction (offline basements, sweaty
   hands, equipment pivots, group sessions) and architectural opportunities, before being asked.
3. **Say the point in plain words first, then the one clause of why.** A sentence that only parses
   if the reader is holding an internal invariant, a `§`-reference or an earlier decision in their
   head has not been read — it has been re-asked, and the second telling costs more than the plain
   one would have. Name the thing to do or the thing that is true, then the reason.
4. **Answer a question; never record it as a decision.** "Any reason for X?" explores the option
   space: answer, recommend, leave it open. Mark something Decided only when they said so, dated.

---

## 7. Product Constraints That Outlive Any One Feature

1. **Never put meaning only in a hover.** On a phone a tooltip is unreachable, so hover-only
   information is information nobody has. Touch targets need real padding.
2. **In support surfaces, prefer the exact always-present identifier**: the commit SHA, which every
   build has, over a tag most deploys sit between. Richer identity goes one tap away, copyable.
3. **Keep code version and data-schema version as separate axes.** The SHA identifies the code;
   `schemaVersion` identifies the data shape and is the only axis storage is keyed on.

---

## 8. Documentation & the Knowledge Graph (OKF v0.1)

1. **Never duplicate feature lists or domain specs.** Architecture: [README.md](README.md).
   Workflows: [use_cases/](use_cases/).
2. **Give every Markdown file YAML frontmatter**: `type`, `title`, `description`, `status`, `tags`.
3. **Keep an `INDEX.md` in every knowledge directory** — file, `type`, link.
4. **Link related concepts explicitly**, with relative links, so agents can traverse the graph.
5. **Navigate BY the graph**: [docs/SRC_MODULES.md](docs/SRC_MODULES.md) and the feature's `§` in
   [TODO.md](TODO.md) reach the code in one read, with the rationale attached. Grep for a symbol,
   never for a concept.

---

## 9. Agent Tooling: Build the Tool, Don't Re-Improvise the Script

1. **Check [agent_tools/INDEX.md](agent_tools/INDEX.md) before improvising.**
2. **Promote a script to a tool when it will run again, fails silently otherwise, and is cheap and
   deterministic** — all three. Build it for yourself first; wire it into the gate only once it has
   caught something more than once. Checks needing judgement stay periodic audits in
   [TODO.md](TODO.md).
3. **Ship a tool complete**: the module with a docstring saying why it exists, a catalog row, a unit
   test, and a Stage 1 task if it should gate commits.
4. **On small files, just make the edit.** A script earns its keep only on volume, and then may match
   only an ANCHOR — exact known text — never a shape: a bare `" ()"` cleanup broke arrow functions in
   eleven modules. Assert every intended site applied, parse every touched file before linting, and
   if repair starts, regenerate from `HEAD` and re-apply rather than chasing the damage forward.
5. **Keep cross-references alive** — `agent_tools/doclinks.py` fails the build on a dead link, anchor
   or `§N.M`.
6. **Make every pipeline task gate something.** A CI job nothing `needs:` reports red while the
   deploy ships; a Stage 1 check with no CI job blocks your commit but not the deploy.
   `agent_tools/pipeline_gates.py` enforces both directions. Group fast checks into one job — a fresh
   runner costs ~30s. **Local green is not CI green**: the ZAP and static-audit jobs run bare system
   Python with no `pip install`.

---

## 10. Local Dev Server

1. **Leave it running** across tasks (`python -m deploy.local_http_server`, `DEV_SERVER_PORT` under
   `DEV_SERVER_BASE_PATH`) — the user tests changes in the browser.
2. **Leave stopping it to the user**, unless a change genuinely needs a restart (say so first).
3. **Reuse it** if it is already listening; never spawn a duplicate.
