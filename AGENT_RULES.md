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

Rules are short on purpose, ordered by how much they cost when broken, and carry evidence only where
they are counter-intuitive without it. Keep responses the same way: decisions, trade-offs, progress —
no fluff.

---

## 1. Execution & Git Flow

1. **Apply edits directly**, choosing the best architectural option, without waiting for
   clarification.
2. **Auto-commit coherent work** to `main` without being asked: stage the files this change touched,
   one logical change per commit, so the user can review or roll back. Never sweep in unrelated or
   concurrently-edited files.
3. **Trunk-based**: work directly on `main`, no feature branches. `main` must stay releasable — the
   GitHub Pages deploy runs on every push.
4. **Never push.** The user pushes; that is their deploy trigger.
5. **Commit message format** — the subject becomes a title in `git log`, CI and PRs:
   - `type(scope): imperative summary`, lowercase, no trailing period, **≤72 chars** (aim ~60).
   - Blank line, then a body wrapped at 72 columns explaining **why**: the constraint, the decision,
     what was measured. Not a restatement of the diff.
   - Footer `Co-Authored-By: <the model actually running> <noreply@anthropic.com>`.
   - Never put the body in a CI `run-name` — Actions expressions cannot split a string.
6. **No interactive modals.** Questions, options and recommendations go in the chat response.
7. **Stage from `git status --short`, never from the paths you remember touching.** A forgotten file
   leaves HEAD broken while your own tree passes, because the gate certifies the tree it ran on.
   Re-read `git status` between commits when splitting a change.

---

## 2. The Pipeline Gate

1. **Run `.venv/bin/python -m build check` in full before every code commit, and report the result.**
   A test subset is not verification — it skips lint, the frontend audit and the dependency scan. Fix
   pre-existing failures rather than tolerating them.

   **Prose-only exception.** A commit touching *only* Markdown that no gate reads as data runs
   `.venv/bin/python -m agent_tools.doclinks` instead, and says so. Gate INPUT is not prose:
   `docs/SRC_MODULES.md`, any `INDEX.md` a tool parses, and this file when it changes a rule a tool
   enforces. Mixed code+Markdown commits are code commits. When unsure, run the gate.

   | Command | What it does |
   | :--- | :--- |
   | `.venv/bin/python -m build check` | The gate: stages 1→4, each running only if the previous was clean |
   | `.venv/bin/python -m build` | Gate, then bundle `src/` into `dist/` |
   | `.venv/bin/python -m deploy` | Publish the built `dist/` |

   | Stage | What runs | Typical | Investigate past |
   | :--- | :--- | :--- | :--- |
   | 1 | Ruff, Biome, `pip-audit`, `tests/unit/`, `tests/unit_js/`, static audits (HTML-sink/CSP, doc graph, pipeline gating, catalog, layering, complexity) — parallel | ~6s | 60s |
   | 2 | `tests/medium/` component suite | ~13s | 90s |
   | 3 | `tests/e2e/` Playwright suite | ~45s | 2min |
   | 4 | OWASP ZAP baseline scan | ~15s | 3min (killed at 20min) |
   | **all** | | **~1m20s** | **3min** |

   Both browser stages use `build._playwright_worker_count` (half the cores), never `-n auto`:
   full-core parallelism starves compositor frames AND bursts past the dev server's TCP listen
   backlog, producing `Page.goto` timeouts unrelated to the change. Stage 4 is sequential with stage
   3 for the same reason — ZAP flooding the dev server mid-suite cost 30 spurious failures
   (2026-08-03). CI reproduces the same four stages in the same order, declared once in
   `build/__init__.py`'s `PIPELINE_STAGES` and asserted by `agent_tools/pipeline_gates.py`
   ([TODO §6.4](TODO.md)).
2. **Announce a WALL-CLOCK finish time before starting anything long.** For `build` commands
   `print_run_header` prints it (last run's duration on this machine, plus the time this one should
   land by) — quote that line. Elsewhere read `date`. "Running the pipeline…" with no number leaves
   the user unable to tell a normal run from a hung one.
3. **Read the header's second line before blaming a slow stage on the change**: cores, browser
   workers, free memory, and the load average with its per-core verdict. The budgets above assume a
   quiet box; measured afterwards, load is the pipeline's own exhaust. If a stage passes its
   "investigate" column, say so and diagnose from `.build-reports/` — do not report "still running"
   indefinitely.
4. **Zero warnings, not just zero failures** — every stage, ZAP included (`WARN-NEW: 0` *and*
   `FAIL-NEW: 0`). Fix at the source or suppress with a written justification; never let one print
   and pass. Lint and format are always clean: auto-fix (`biome format --write`, `ruff format`) and
   re-run.
5. **A suppression states that there is no issue; it never defers one.** Legitimate only for a false
   positive or something inapplicable to this architecture. Never for a real finding — no gate may
   carry an allowlist for unfixed debt, and no bare `# noqa` without a non-applicability rationale.
6. **Every `IGNORE` line carries its rationale AND a `RE-CHECK` condition** — an invalidating
   condition, not a date ("if `googleAuth.js` moves to `initCodeClient`, validate a `state`
   parameter"). When a change fires that condition, re-verify **in that change**, by reading the code
   rather than the comment. A rationale nobody can re-derive today is deleted, not carried.
   `WARN-NEW: 0` says nothing about what `deploy/zap/zap-baseline.conf` already silences, so audit
   the skips on their own schedule.
7. **Never swallow a non-zero exit code**, including ZAP's `2` (warnings) and `3` (scan errored). A
   stage that cannot run is a failure, not a pass to log. **A scan that reaches nothing is a failed
   scan** — the ZAP container needs host networking to hit the dev server.
8. **Add no new test failures, and never silence one.** **A failing e2e test fails the build — no
   automatic re-run**: retry-and-forgive once hid a real `requestAnimationFrame` race for weeks.
   Root-cause it; never call a failure "probably flaky".
9. **A detected time jump means interruption, not regression.** Wall time inconsistent with the work
   done = the machine slept, dropping sockets and stalling timers. Re-run before investigating.
10. **Read the digest, don't re-run blind.** `.build-reports/*.log` plus the printed exceptions, call
    chain and failing node ids come first.
11. **No artifact capture in a gated run** — not tracing, video, or screenshots.
    `--screenshot=only-on-failure` cost ~23% of a green e2e stage while writing nothing. Escalate per
    failure instead: re-run the one node id with `--screenshot=on` or `--tracing=on`.
12. **Run the gate as its own command, through the front door.** Importing `build`'s `run_*`
    functions skips the staging that gives the gate its meaning, and folding it onto a heredoc edit
    makes the one command everything rests on unverifiable at a glance.

---

## 3. Learning: a lesson lands in the repository, not in an agent's head

Corrections are the most expensive thing the maintainer produces. One given twice was not captured.

1. **Every correction is a learning event, captured in the SAME change** — as is a repeated mistake,
   a *"why are you doing X?"*, or any expressed dissatisfaction. Not "noted for next time": the next
   session is a different context window.
2. **Where it goes is decided by one question: who needs this next?**

   | The lesson is about… | It belongs in… |
   | :--- | :--- |
   | how any agent must work here | **this file** |
   | why one piece of code is the way it is | a comment **at that code** |
   | work still to do, or a decision taken | [TODO.md](TODO.md), dated, naming who decided |
   | what shipped | [CHANGELOG.md](CHANGELOG.md) |
   | a behaviour that must not regress | **a test**, in the tier that matches how much of the app it boots |
   | the maintainer's context and preferences | the agent's private memory |

3. **A rule governing work here may never live only in private memory** — unreadable, unreviewable,
   uncommitted, different per agent. Memory may point at a rule; it may not be its home.
4. **Detect dissatisfaction proactively and ask rather than guess.** On *"why are you…"*, *"no"*, a
   repeated instruction or a small correction: stop, state what you think the problem is, and ask
   whether the answer changes what you write — in prose, never an interactive modal.
5. **Edit and reorder the rules; do not only append.** A lesson usually belongs *inside* an existing
   rule, sharpening it — find that rule first and extend it. A file that only grows stops being read,
   at which point every rule in it is decorative.
6. **Reorder freely: this file is read, never referenced.** Importance decides the order, and
   importance changes, so reordering must cost nothing anywhere — which holds only because nothing
   points back here. Numbers are positions for a reader, not identifiers, and even this file names
   its own rules rather than numbering them. Gated by `agent_tools/doclinks.py`.
7. **Write the rule and the evidence, never the apology.** Evidence is one clause, not a story.
8. **Quote the new or changed rule VERBATIM in the reply**, saying which rule it extends or that it
   is new. It binds every future session, so rejecting it must cost one sentence rather than three
   sessions of work done under it.
9. **Every entry is also a small refactor of its neighbourhood**: merge overlapping bullets, delete
   what is obsolete, move a rule to the section it belongs in. Rules stay short, concrete and
   checkable; the test is whether an agent that read the rule and nothing else behaves correctly.
   **The rules live HERE and nowhere else** — [CLAUDE.md](CLAUDE.md) and [GEMINI.md](GEMINI.md) load
   this file, [INDEX.md](INDEX.md) maps to it, [TODO.md](TODO.md) and [CHANGELOG.md](CHANGELOG.md)
   record work rather than rules — and none of them cites one (see below).
10. **These rules are for agent consumption only — nothing in the repository cites them.** Code and
    tests work from behaviour and requirements: [use_cases/](use_cases/) states WHY the app behaves
    as it does, which is what a test protects and what a comment may point at. Documents state their
    own requirement in their own words. This file states HOW work is done and changes for reasons
    none of them care about, so a citation couples them to it — reordering these rules once made 87
    source and test files need editing.

    Only the three loaders an agent reads on arrival ([CLAUDE.md](CLAUDE.md),
    [GEMINI.md](GEMINI.md), `AGENTS.md`), the document maps ([INDEX.md](INDEX.md),
    [README.md](README.md)) and [CONTRIBUTING.md](CONTRIBUTING.md) may name this file at all. They
    POINT at it; they do not lean on it. `agent_tools/doclinks.py` fails the build on any other
    mention.

---

## 4. Code & Test Architecture

The front end is a buildless native-ES-module app under `src/`. Many small single-responsibility
files beat few large ones: less context to load, fewer collisions, and a directory tree that
documents itself.

1. **One responsibility per file.** Extract a unit as soon as it grows inside `src/app.js`.
2. **Organise by concern**: UI in `src/components/`, seed data in `src/data/`, and tests in the tier
   that matches how much of the app they boot —
   - `tests/unit_js/` — pure logic, no DOM, no persistence, mirroring the `src/` subpath. Runs under
     Node's built-in `node:test` (Stage 1) with a vendored, checksum-verified Node
     (`build.ensure_node_binary`) and no npm dependency at all.
   - `tests/medium/` — ONE component mounted via a `src/appBoot.js` boot step against the real
     `index.html` markup, with `app.js` intercepted (`tests/medium/_harness.py`'s `load_with_stub`).
     No router, IndexedDB, service worker or demo seed.
   - `tests/e2e/` — full flows that need navigation, persistence or a real boot.
   - `tests/unit/` — Python static and unit tests.

   Group by feature, not one file per test.
3. **Decouple by dependency injection, not cross-imports.** Extracted components receive `state`,
   `t`, `escapeHTML`, launch callbacks; for reassigned globals pass an accessor
   (`getActiveSession()`). Layering is gated by `agent_tools/import_layers.py`: `data/` → `domain/` →
   `modules/common/` → `modules/<feature>/` → `controllers/` → `app.js`, each importing only from
   strictly below. `data/` is records at rest; `domain/` is the training vocabulary (pure, no DOM, no
   storage). Cross-feature imports are allowed; importing *up* is not, because that is what costs a
   module its independent mountability.
4. **Head every module with a short comment**: its single responsibility and its injected
   dependencies. Descriptive names over clever ones.
5. **Runtime app in `src/`, nothing else.** Dev tooling, docs and CI stay out of the app tree; no
   source files loose at the repo root.
6. **Update [docs/SRC_MODULES.md](docs/SRC_MODULES.md) in the same change** as any module added,
   moved or removed — gated by `agent_tools/catalog_coverage.py`. The catalog lives in `docs/`, never
   under `src/`: `run_build` copies that tree wholesale into `dist/`, so anything there ships.
7. **Self-documenting code inside each module too.** Names carry *what*; comments carry *why* — the
   constraint, edge case or decision the code cannot state itself. Delete dead code rather than
   commenting it out.
8. **Assert the BEHAVIOUR a caller depends on, never the mechanics that produce it.** Ask: if I
   rewrote the internals and kept the contract, would this assertion hold? A test pinned to mechanics
   fails on harmless refactors and passes while the behaviour is broken.

   | Pinned to mechanics | Pinned to behaviour |
   | :--- | :--- |
   | `erasurePseudonym(id) === "Client #JANE-A"` | the label is stable, differs per client, carries no PII |
   | `drive.created === 1` | the register ends up holding both erasures |
   | `assert.deepEqual(health, {…})` | `lost` reports the shortfall the caller reads |
   | `el.classList.contains("hidden")` | `expect(el).to_be_hidden()` |
   | `id.length === 22` | ids are unique, sortable, URL-safe |

   Carve-outs: a class name that IS a contract for another module or stylesheet (say which); an
   avoided side effect ("a second sync writes nothing to Drive"); and a persisted format — a stored
   field, a file, a bookmarked URL — because changing it breaks data already written. Name tests for
   the promise, not the function.
9. **Prefer saying a thing several times over adding a layer that says it once.**
   Explicit declarations beat a registry keyed on a discriminator, a config table, or a dispatcher
   standing between caller and effect. This is **not** licence to duplicate logic — the same
   behaviour written twice still gets extracted; what is rejected is an intermediary whose only job
   is to *choose*. Say so when the count of explicit declarations becomes the larger cost.
10. **Write the test first.** It states the promise in the caller's words, and
    failing once is the only proof the test can fail at all. It replaces the build-then-poke probe,
    which leaves nothing behind. Where the shape is not knowable until something renders (layout,
    geometry), build first and **say that is why**.
11. **A side effect added at a shared seam must be scoped to the event that motivated it.** Enumerate
    what else calls that seam, **including re-entry with identical arguments**: collapsing the
    messages drawer on every `switchView` broke the drawer, because expanding it rewrote the URL and
    re-entered the same route 3ms later. Test the seam's OTHER caller, through the real control.

---

## 5. Working With the Maintainer

1. **Evaluate the user's own changes** and say how they refine the domain model or gym ergonomics.
2. **Call out real-world friction**: basement-gym offline states, sweaty hands, equipment pivots,
   group-session distraction.
3. **Propose architectural opportunities** proactively.
4. **A question is not a decision.** "Any reason for X?" explores the option space. Answer,
   recommend, leave it open — do not record it in [TODO.md](TODO.md) as **Decided**, narrate it back
   as settled, or drop the option from later work. Mark something Decided only when the user said so
   in words that decide it, dated to when they said it.
5. **Evaluate the prompt, not just the code.** In a sentence or two: is it well-scoped, what's
   missing, and is the effort proportionate — would a cheaper approach or a smaller model do? Then
   proceed. Skip it for small unambiguous asks.

---

## 6. Product Constraints That Outlive Any One Feature

1. **Nothing lives only in a hover.** LibrePT is used on a phone on the gym floor: a `title` tooltip
   is unreachable on touch, so hover-only information is information nobody has. Touch targets need
   real padding, not just visible text.
2. **In support surfaces, prefer the exact always-present identifier over the pretty one.** The
   header stamp is the **commit SHA** — every build has one, while most deploys sit between tags.
   Richer identity (schema, build time) goes one tap away, and copyable.
3. **Code version and data-schema version are different axes.** The commit SHA identifies the code
   (there are no release tags — [TODO §16](TODO.md)); `schemaVersion` identifies the data shape and
   is the only axis storage is keyed on. See [docs/DATA_MODEL.md §1](docs/DATA_MODEL.md).

---

## 7. Documentation & the Knowledge Graph (OKF v0.1)

1. **Never duplicate feature lists or domain specs.** Architecture and features:
   [README.md](README.md). Workflows: [use_cases/](use_cases/). One vocabulary across docs and code.
2. **YAML frontmatter on every Markdown file**: at minimum `type` (`overview`, `guidelines`,
   `use_case`, `index`), plus `title`, `description`, `status`, `tags`.
3. **Every knowledge directory keeps an `INDEX.md`** catalog table: file, `type`, link.
4. **Link related concepts explicitly** with relative Markdown links, so agents can traverse the
   graph.
5. **Navigate BY the graph.** [docs/SRC_MODULES.md](docs/SRC_MODULES.md) (one line per runtime
   module) and the feature's `§` in [TODO.md](TODO.md) reach the code in one read and carry the
   rationale with it. Grep for a symbol, never for a concept.

---

## 8. Agent Tooling: Build the Tool, Don't Re-Improvise the Script

1. **Check [agent_tools/INDEX.md](agent_tools/INDEX.md) before improvising**; run
   `python -m agent_tools.<name>` rather than rebuilding its logic in a shell pipeline.
2. **Promote a script to a tool when it will run again, fails silently otherwise, and is cheap and
   deterministic** — all three. **Build it for yourself first; wire it into the gate only once it has
   caught something more than once**: a hand-run tool costs only its writing,
   while a Stage 1 task costs every commit forever. Some recurring checks want to stay periodic
   audits in [TODO.md](TODO.md) instead, because their findings need judgement.
3. **A tool means all of it**: the module (docstring saying *why it exists*), a catalog row, a unit
   test in [tests/unit/](tests/unit/), and a Stage 1 task if it should gate commits.
4. **On small files, just make the edit.** A heredoc that rewrites two lines costs more tokens than
   the direct edit, is written blind, discards the read-before-edit guard, and shows no reviewable
   diff. A script earns its keep only on volume — many exact replacements in one pass. Scripting the
   same shape twice means it wants to be a tool.

   **And a bulk pass may only match an ANCHOR, never a shape.** Measured in one session: 60 explicit `(file, exact old text, new text)` replacements applied with zero
   collateral and reported the three that did not match; two regexes matching by shape — a bare
   `" ()"`, and a substitution table applied twice over the same line — broke arrow functions in
   eleven modules, renumbered references twice, and cost a full regeneration from `HEAD`. So:
   - **Assert every intended site applied.** A silent no-op is the failure mode that ships broken
     code, and the list of misses is the only proof the pass did what it claimed.
   - **Match text that cannot occur outside the target.** `" ()"` occurs in every arrow function;
     `§N` occurs in another document's numbering. If the pattern needs a lookahead to be safe, it is
     the wrong pattern.
   - **Verify structurally before anything else** — parse every touched file, then lint, then the
     gate. A syntax error found by the formatter three steps later has already been built on.
   - **When repair starts, stop repairing.** Regenerate the touched files from `HEAD` and re-apply
     the anchored edits; chasing the damage forward costs more than the pass saved. That recovery is
     only available if the edits were written as explicit replacements in the first place.
5. **Documentation cross-references are gated**: `agent_tools/doclinks.py` fails the build on a dead
   link, anchor or `§N.M`.
6. **Every pipeline task must gate something.** A CI job nothing lists in `needs:` reports red while
   the deploy ships anyway; a Stage 1 check with no CI job blocks your commit but not the deploy.
   `agent_tools/pipeline_gates.py` enforces both directions. Group fast pure-analysis checks into one
   job — a fresh runner costs ~30s apiece. **Local green is not CI green**: `owasp-zap-scan` and
   `static-security-audits` run bare system Python with no `pip install`, so check what the calling
   job installs.

---

## 9. Local Dev Server

1. **Leave it running** across tasks (`python -m deploy.local_http_server`, on `DEV_SERVER_PORT`
   under `DEV_SERVER_BASE_PATH`, [TODO §28.1](TODO.md)) — the user tests changes in the browser.
2. **The user stops it**, not the agent, unless a change genuinely needs a restart (say so first).
3. **Reuse it** if it is already listening; do not spawn a duplicate.
