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

This document defines universal behavioral and interaction rules for any AI coding assistant or agent (Gemini, Claude, Codex/OpenAI, Cursor, etc.) contributing to the **LibrePT** repository.

---

## 1. Core Operating Directive: Meaningful Progression with Minimum Distraction

Every response and tool action must drive measurable, continuous progress toward the user's core outcome: **building an elegant, low-interaction, offline-first Personal Trainer platform**.
- **Avoid Fluff**: Keep conversational responses concise, structured, and focused on decisions, trade-offs, and implementation progress.
- **Single-Source of Truth**: Maintain terminology consistency across documentation (`README.md`, `use_cases/`) and code. Do not introduce redundant patterns or conflicting architectural concepts.

---

## 2. Mandatory Interaction Protocol: Direct Execution, Evaluation & Gap Calling

### A. Direct Execution & Git Flow
1. **Direct Application**: Apply edits directly and cleanly, always choosing the best architectural option without asking questions or waiting for clarification.
2. **Auto-commit coherent changes**: Commit your own work automatically — do **not** wait to be asked. As soon as a change is coherent and verified, stage exactly the files you touched and commit them to `main` with a clear message. Keep commits small and focused (one logical change each) so the user can review and, if needed, roll back via git history/diff. Never sweep unrelated or concurrently-edited files into your commit.
3. **Run the full local pipeline before every code change commit and report results.** "Verified" means passing the same gate CI runs — not just running a test subset (`pytest tests/` alone skips lint, the frontend HTML-sink/CSP audit, and the dependency scan). Stage commits ONLY after executing `.venv/bin/python -m build check` in full and confirming all static analysis, security audits, automated tests, and documentation checks pass cleanly. Preexisting challenges are not tolerated and should be addressed. Include a concise pipeline status report in the response prior to committing.

   **Command reference:**
   | Command | What it does |
   | :--- | :--- |
   | `.venv/bin/python -m build check` | The gate: Stage 1 → Stage 2 → Stage 3 → Stage 4 below, staged (each stage only runs if the previous is clean). This is what "run the pipeline" means. |
   | `.venv/bin/python -m build` | Full build: env check → the same tests → bundle `src/` into `dist/`. |
   | `.venv/bin/python -m deploy` | Publish the built `dist/`. |
   | `.venv/bin/python -m build && .venv/bin/python -m deploy` | Full chain. |

   **Stage 1 (fast, no browser — runs its tasks in parallel):** Python lint/format (Ruff), frontend
   lint/format (Biome, JS+CSS), dependency security audit (`pip-audit`), unit tests (`tests/unit/` +
   `tests/test_app.py`), JavaScript unit tests (`tests/unit_js/`, under Node's built-in `node:test` —
   see §5.2), and the static security audits (HTML-sink/CSP escaping audit via
   `build/frontend_audit.py`, the OKF doc-graph link checker, the CI pipeline-gating checker).

   **Stage 2 (only if Stage 1 is clean):** the medium-tier component suite (`tests/medium/` — see
   §5.2). Each test mounts ONE component via a `src/appBoot.js` boot step against real `index.html`
   markup, with the real `app.js` request intercepted and replaced — no router, IndexedDB, service
   worker, or demo-data seed. Uses the same half-the-cores worker count as Stage 3
   (`build._playwright_worker_count`), not `-n auto`: full core-count parallelism was tried here
   first on the theory that this tier isn't timing-sensitive the way full e2e is, but it hit the
   OTHER documented `-n auto` failure mode instead — enough simultaneous fresh browser contexts
   can still burst past the dev server's TCP listen backlog and produce the same `Page.goto` 30s
   timeout, a constraint that applies to any Playwright suite hitting this shared server regardless
   of what it asserts (seen 2026-08-04). Gated separately from Stage 3 so a broken component fails
   fast before the slower full-flow suite runs.

   **Stage 3 (only if Stage 2 is clean):** the full Playwright e2e suite (`tests/e2e/`, itself
   fanned out across workers via `pytest-xdist`) against the local dev server.

   **Stage 4 (only if Stage 3 is clean):** an OWASP ZAP baseline scan against that same dev
   server. **Sequential with Stage 3, not concurrent** (`build/__init__.py`'s `run_stage_3_e2e`/
   `run_stage_4_zap`) — the two used to run in one `ThreadPoolExecutor`, and ZAP's request flood
   against the SAME local `:8081` server while `pytest-xdist` workers were mid-suite produced
   `Page.goto` timeouts across specs with no relation to whatever change was under test (seen
   2026-08-03: 30 failures, all `Timeout 30000ms exceeded`). In CI this was never an issue — e2e
   and ZAP are already separate jobs on separate runners, each with its own dev server — so only
   the local path needed the split. This is traceable resource contention, not the "probably
   flaky" hand-wave forbidden below; don't re-parallelize the two locally without addressing that.

   All four stages together typically take 5-15 minutes; expect it, don't interrupt it. Rules:
   - **Say how long it will take, BEFORE starting it, every time — as a WALL-CLOCK time, not just a
     duration.** A gate run is minutes of dead air, and "running the pipeline…" with no number
     leaves the user unable to tell a normal run from a hung one — they end up asking "done yet?",
     which is the agent's failure, not theirs. "~5 minutes" still makes them do the arithmetic and
     then remember when they started reading; **"started 16:59, expect done by ~17:04"** does not.
     So: run `date` when you kick a long task off, and quote both the duration and the clock time
     it should land by. Applies to anything long enough to wait on — the gate, a full e2e run, a
     container build, a scan — not only `build check`. Per-stage budget the run is measured against
     (typical on this 16-core dev box, from `_timed_task`'s own output):

     | Stage | Typical | Investigate past |
     | :--- | :--- | :--- |
     | 1 — lint / unit / JS unit / audits (parallel) | ~5s (~13s on a cold pip-audit) | 60s |
     | 2 — medium component tests | ~14s | 90s |
     | 3 — e2e browser suite | ~1m50s | 4min |
     | 4 — OWASP ZAP baseline | ~15s (~75s on a cold `.venv`) | 3min (hard-killed at 20min) |
     | **whole `build check`** | **~2m20s** | **5min** |

     Re-measured 2026-08-07, after dropping `--dist=loadfile` from both Playwright stages: that
     flag pinned each file to one worker, so a stage could not finish faster than its heaviest
     file, and `tests/e2e/test_share_deeplink.py` alone (13 tests, ~203s of call time) set stage 3
     while seven of eight workers idled. Measured back to back at `-n 8`: stage 3 215s → 98s,
     stage 2 14.7s → 12.1s, whole gate 5m06s → 2m20s. The flag had been added for a reporting
     nicety `-q` does not even render differently. Do not put it back.

     A run well outside these is usually the ENVIRONMENT, not the change under test. The two that
     have actually bitten: a dev server left running across days so it no longer matches its own
     source (now caught up front by `tests/conftest.py`'s `assert_server_is_current`), and a
     machine that slept mid-run — a suspend drops open sockets, so a network-dependent step like
     `pip-audit` fails with a connection error that reads like a finding but is not one.

     If a stage blows past its "investigate" column, say so and diagnose — do not keep reporting
     "still running" indefinitely. Check host load first (`uptime`; this box has 16 cores, so a
     1-minute load average near or above that means the machine is oversubscribed and the run is
     being starved rather than stuck), then the stage's own log under `.build-reports/`.
   - **Squeaky clean, always — zero warnings, not just zero failures.** The bar is a *clean* build, not a *green-enough* one. Every gate stage — lint, format, unit, e2e, dependency audit, dynamic security, **and the OWASP ZAP scan** — must report **no warnings and no findings**. For ZAP specifically that means `WARN-NEW: 0` **and** `FAIL-NEW: 0`, not merely no FAILs. A warning is either **fixed** at its source or **explicitly suppressed with a written justification** — never left to print and pass.
   - **A suppression is only ever a statement that there is no issue, never a way to defer one.** A gate suppression is legitimate in exactly one case: the finding is a false positive or genuinely does not apply to this architecture (e.g. a ZAP `-c` ignore for a CSRF check on an app with no server-side state-changing form). It is never legitimate as a way to park a *real* finding — a complexity violation, a genuine lint issue — for later. If the gate is right that something is wrong, fix it in the same change; do not add it to an allowlist, `# noqa`, or ignore file "for now." **No pipeline gate may carry a mechanism for allowlisting real, unfixed debt** (e.g. `agent_tools/complexity.py`'s old `PRE_EXISTING_ALLOWLIST`, or a bare `# noqa: C901` with no non-applicability justification) — every function a gate flags gets fixed in the change that touches the gate, full stop. Each justified suppression must also be periodically re-verified against the current architecture, not assumed valid forever — a false-positive rationale can stop being true as the app changes (e.g. adding a server-side form would retire the CSRF ignore).
   - **Never swallow a non-zero exit code.** A gate step that exits non-zero (including ZAP exit `2` = warnings and exit `3` = the scan errored / could not reach the target) MUST fail the build. Printing "completed with warnings" and returning success is forbidden — that pattern once hid a ZAP scan that was not even reaching the running app. If a stage cannot run, that is a failure to fix, not a pass to log.
   - **A security scan that scans nothing is a failed scan.** Confirm the scanner actually reaches the app under test (the ZAP container needs host networking to hit the dev server on `:8081`); a scan that connects to nothing and exits "clean" gives false assurance and is treated as a failure.
   - **Lint/format must be clean, always.** If the formatter complains, auto-fix (`biome format --write`, `ruff format`) and re-run — never commit a tree you know is dirty.
   - **Your change must add no new test failures.** Absolute green is the goal; if pre-existing failures exist ask for an excemption. Never silence a failure.
   - **Full pipeline execution mandatory.** Running a single test file or subset is NOT sufficient to authorize a commit. Always run `.venv/bin/python -m build check` to completion.
   - **A failing e2e test fails the build — no automatic re-run.** `run_e2e_tests()` used to re-run failing node ids serially and forgive them if that passed, on the theory that pytest-xdist port contention against the shared dev server produced spurious timeouts. That masked more than it excused: not every failure it caught over the project's history was actually port contention — a genuine app-level async race (two independent, uncoordinated `requestAnimationFrame`-scheduled callbacks stomping each other's result — TODO §7.3's timeline scroll-focus race) surfaced this way and went unnoticed for a while, and "passed on retry" is never evidence a test is reliable, only that it didn't fail *that* time. Root-cause and fix the actual thing — the app race, or an under-specified test wait — never retry-and-forgive. Never hand-wave a failure as "probably flaky" without root-causing it.
   - **A detected time jump means assume interruption, not a regression.** If the agent's own clock (wall time between tool calls, timestamps in output) shows a jump inconsistent with the work actually done — the machine slept mid-run — treat any failures from that run as suspect before treating them as real: a suspend/resume cycle drops sockets and stalls timers, producing exactly the symptoms a genuine bug would (failed fetches, timing-budget overruns, dropped connections), on a change that could not plausibly cause them. This is not the "probably flaky" hand-wave the rule above forbids — a time jump is verifiable evidence, not a guess. Confirm by re-running the pipeline clean; only call it a real failure if it reproduces without an intervening jump.
   - **Read the digest, don't re-run blind — and know it isn't guessing.** Every runner's output is captured to `.build-reports/*.log` (`build/testreport.py`) and a failure prints, in order: the **raised exceptions** (de-duplicated and never truncated — under the browser suites' `--tb=long` the message is the last line of a ~150-line block, so a head-capped digest once printed call-site boilerplate and dropped the `TimeoutError` itself), then the surrounding call chain, then the failing test ids and the log path. Investigate from those before spending another full pipeline run or reaching for ad-hoc debug scripts.
   - **No artifact capture in the gated run — not tracing, not video, and (since 2026-08-04) not screenshots either.** Any artifact option activates pytest-playwright's per-test artifact recorder around every browser context in the suite. Tracing and video were dropped first for recording continuously (a ~4-minute e2e stage became 12+). Screenshots survived on the claim that `--screenshot=only-on-failure` was "essentially free at collection time" — measured, that was false: it cost **~40s of a 175s stage (~23%) on a fully green run**, where by definition not one screenshot is written, and across ~11 real e2e failures diagnosed that day every one was read off the traceback with no screenshot opened. **Escalate on demand instead**: when a specific failure genuinely needs visual state, re-run that one node id with `--screenshot=on` or `--tracing=on`. Do not reintroduce either as a blanket flag without measuring the green-run cost first.
4. **Trunk-based development**: Work directly on `main` — it is the trunk. Do **not** create feature branches; make small, coherent, verified commits straight to `main`. `main` must stay releasable, because the GitHub Pages deploy (`.github/workflows/deploy.yml`) runs on every push to `main`.
5. **Never push — the user pushes manually.** Auto-commit to the trunk, then stop; the user always does the `git push` themselves (their push is the continuous-deployment trigger). Do not run `git push`.
6. **No interactive UI modals for options/questions**: Never invoke interactive popups or modal tools (such as `ask_question`). All clarification questions, options, recommendations, and information requests MUST be presented directly in natural conversational chat response.
7. **Commit message format is not cosmetic — the subject becomes a title elsewhere.** It is what `git log --oneline` shows, what GitHub titles the CI run with, and what a PR inherits. A subject that only makes sense once you have read the body is a broken subject.
   - **`type(scope): imperative summary`** — conventional-commit types (`feat`, `fix`, `refactor`, `docs`, `build`, `perf`, `test`, `ci`). Lowercase after the colon, **no trailing period**.
   - **Subject ≤ 72 characters**, and aim for ~60. Count it before committing; long subjects are silently truncated wherever they are displayed.
   - **Blank line after the subject**, then the body **wrapped at 72 columns** (git tooling does not re-wrap, so unwrapped bodies render as one long line in most viewers).
   - **The body explains WHY**: the constraint, the decision, the evidence, what was measured. Not a restatement of the diff — the diff is already in the commit.
   - **Footer**: `Co-Authored-By: <the agent's own model name> <noreply@anthropic.com>` (or the equivalent for a non-Claude agent) — name the model actually running, not a fixed one.
   - **Never put the body in a CI `run-name`** or any other title field. GitHub Actions expressions cannot split a string, so `head_commit.message` interpolates the entire message; rely on GitHub's default run title instead.

### B. Evaluate Changes, Call Out Gaps & Propose Opportunities
1. **Evaluate User Changes**: Explicitly evaluate user modifications and input, highlighting how they refine the LibrePT domain model or improve real-world gym ergonomics.
2. **Call Out Gaps & Edge Cases**: Actively identify real-world training friction (e.g., basement gym offline states, sweaty hands, quick equipment pivots, group session distractions).
3. **Propose Opportunities**: Proactively call out architectural opportunities and enhancements that make the system more robust and frictionless.
4. **Evaluate every prompt, not just the code it produces.** Before or alongside acting on a non-trivial request, give a short, honest read of the request itself: is it well-scoped or does it bundle unrelated asks that would be clearer split apart; what's missing (constraints, acceptance criteria, edge cases the user likely hasn't considered); and an economic read — is the ask proportionate to the effort/compute/time it costs, is there a cheaper way to get the same outcome, would a smaller model or a simpler approach do. This is feedback on the *request*, separate from executing it — don't let it become a reason to stall or interrogate; state the assessment in a sentence or two and proceed. Skip it for small, unambiguous asks (a typo fix, a one-line question) where it would just be noise.

### C. Local Dev Server: Leave It Running
1. **Keep it up.** Once the local dev server (`python -m deploy.local_http_server --port 8081`, served under `/LibrePT/`) is started, leave it running across tasks — the user relies on it to test changes in the browser. Do **not** kill it as an end-of-task tidy-up.
2. **The user kills it, not the agent.** Stopping the server is the user's call. Only stop or restart it when the user asks, or when a change genuinely requires a restart (and say so first).
3. **Reuse before starting.** Check whether it is already listening on `:8081` and reuse it rather than spawning a duplicate.

### D. Product Constraints That Outlive Any One Feature

These are not style preferences — they are decisions already paid for, and re-litigating them costs the maintainer real money. Treat them as binding.

1. **Nothing lives only in a hover.** LibrePT is used on a phone, on the gym floor. A `title` tooltip is unreachable on touch, so information available *only* on hover is information nobody has. Tooltips may enrich a desktop view; they may never be the sole route to something a trainer or a support request needs. Touch targets need real padding, not just visible text (9px of text is nothing to aim at with a sweaty thumb).
2. **In support surfaces, prefer the exact and always-present identifier over the pretty one.** The header build stamp shows the **commit SHA**, not a release tag: the SHA exists for every build, while most deploys sit between tags — and those are exactly the ones a confusing bug report comes from. Richer identity (release, data schema, build time) belongs one tap away, and copyable.
3. **Code version and data-schema version are two different axes.** The **commit SHA** identifies the *code* (there are no release tags — multi-version hosting was dropped, [TODO.md §16](TODO.md)); `schemaVersion` identifies the *data shape*, and is the only axis storage is keyed on. Never collapse them into one number — see [docs/DATA_MODEL.md §1](docs/DATA_MODEL.md).

---

## 3. Single Source of Truth Reference

To prevent drift and redundant documentation, agents MUST NOT duplicate feature lists or domain specifications in this rules file. Always reference the canonical sources of truth:
- **System Architecture & Features**: See [README.md](README.md).
- **Functional Workflows & Use Cases**: See [use_cases/](use_cases/).

---

## 4. Open Knowledge Format (OKF v0.1) Documentation Standards

All specifications, architectural documentation, and use cases in this repository must strictly adhere to Google's **Open Knowledge Format (OKF v0.1)**:
1. **Mandatory YAML Frontmatter**: Every Markdown file MUST begin with YAML frontmatter containing at minimum the `type` field (`overview`, `guidelines`, `use_case`, `index`), along with `title`, `description`, `status`, and `tags`.
2. **Directory Indexing (`INDEX.md`)**: Every directory containing knowledge files MUST maintain an `INDEX.md` catalog table listing its files, their `type`, and clickable Markdown links.
3. **Graph Interconnectivity**: Use explicit Markdown links (`[label](path/to/file)`) to connect related concepts across files so AI agents can traverse the repository knowledge graph reliably. Relative links must be used to avoid local machine dependencies.

---

## 5. Modular Code Architecture: Small Files, Clear Seams, Self-Documenting

The front-end is a buildless native-ES-module app under `src/`. Keep it navigable and
parallel-friendly by favouring many small, single-responsibility files over large ones. Small
files reduce the context an agent must load to make a change, let separate concerns be edited in
parallel without collisions, and make the directory tree itself act as documentation.

1. **One responsibility per file.** A UI element, a data entity, or a single concern belongs in its own module. When a self-contained unit inside the entry file (`src/app.js`) grows, extract it. Prefer a file an agent can read in full over scrolling a multi-thousand-line file.
2. **Organise by concern in subfolders.** UI components in `src/components/`, seed data per entity in `src/data/`, full-flow browser tests in `tests/e2e/`, single-component browser tests in `tests/medium/`, Python static/unit tests in `tests/unit/`, JavaScript unit tests in `tests/unit_js/`. Group tests by feature/component — not one file per test, and not one monolithic file for everything.

   `tests/unit_js/` exists for tests that pin pure logic — schema/migration transforms, id
   generation, merge algorithms — with no DOM and no persistence, mirroring the `src/data/` /
   `src/modules/common/` subpath they cover (e.g. `src/data/syncMerge.js` →
   `tests/unit_js/data/syncMerge.test.mjs`). They run under Node's built-in `node:test` +
   `node:assert/strict` (`build.run_javascript_unit_tests`, Stage 1) rather than Playwright: these
   tests used to run in the browser ONLY because the app's CSP forbids `new Function`, so there was
   no in-process eval harness — Node's own `import()` never touches a page, so the CSP is not in
   play, and the browser/dev-server/IndexedDB overhead every one of them was paying for nothing goes
   away. Node itself is vendored the same way as Biome (`build.ensure_node_binary`, a pinned,
   checksum-verified download into `.venv/node-runtime/`) rather than assumed on `PATH`. It adds no
   npm dependency at all — no `package.json`, no `node_modules`, nothing for a JS-side `pip-audit`
   equivalent to even cover — because `node:test`/`node:assert` are built into the runtime. A test
   belongs here only if it needs nothing a browser provides; if it touches the DOM at all, it
   belongs in `tests/medium/` or `tests/e2e/` instead (below).

   `tests/medium/` exists for tests that mount ONE component's real markup and behavior without
   the rest of the app — no router, no IndexedDB, no service worker, no demo-data seed. A test uses
   `tests/medium/_harness.py`'s `load_with_stub()` to intercept the real `app.js` request and serve
   a stub that imports one `bootXyz(deps)` step from `src/appBoot.js` — the *exact* function
   `app.js`'s real `init()` calls, extracted so it's independently callable — with test-supplied
   fakes for cross-feature callbacks the test doesn't exercise. `index.html`'s real markup still
   loads unchanged (no separate fixture page, so nothing to go stale against it), so the component
   wires against the same DOM ids production does. Runs as Stage 2, at the same worker count as
   e2e's Stage 3 — see `build._playwright_worker_count`'s docstring for why `-n auto` isn't safe
   here either, even though this tier isn't timing-sensitive the way full e2e is. A test
   belongs here if it needs the DOM/CSS but NOT navigation, persistence, or a real app boot; if it
   needs those, it stays in `tests/e2e/`.
3. **Decouple with dependency injection, not cross-imports.** Extracted components receive the app-level helpers they need as parameters (`state`, `t`, `escapeHTML`, launch callbacks). For globals that get reassigned (`activeSession`, `state`), pass an *accessor* (`getActiveSession()`) so the module always reads the current value. This avoids circular imports and keeps modules independently testable.

   **Gated by `agent_tools/import_layers.py`** (Stage 1), which enforces the direction the app is layered in — `data/` → `modules/common/` → `modules/<feature>/` → `controllers/` → `app.js`, each importing only from strictly below. Cross-feature imports are deliberately allowed (three exist, each a genuine composition); importing *up* a layer is not, because that is what actually costs a module its independent mountability — the property `tests/medium/` depends on. The gate found two inversions on its first run, both fixed rather than exempted: `historyView.js` imported its own controller (now injected), and `googleAuth.js` — a token-client service with no UI — sat in `modules/common/` where the data layer had to reach up for it (now in `data/`, beside the rest of the Drive integration).
4. **Self-document at the top of every module.** Begin each file with a short comment naming its single responsibility and listing its injected dependencies. Choose descriptive names over clever ones — a reader should understand a file without opening its call site.
5. **Keep the runtime app in `src/`; keep the root clean.** Only the app entry, its modules, and its assets live under `src/`. Dev tooling, docs, and CI configuration stay out of the app tree. Source files must never sit loose at the repository root.
6. **Update the catalog when the module map changes.** When you add, move, or remove a module, update [docs/SRC_MODULES.md](docs/SRC_MODULES.md) in the same change, so the knowledge graph stays a reliable map of the codebase. **Gated** by `agent_tools/catalog_coverage.py` in Stage 1 — this rule went unenforced long enough to accumulate 22 uncatalogued modules, including the live-session controller, while every link in the catalog stayed green (`doclinks` proves links resolve; it cannot see a module nobody linked).

   The catalog lives in `docs/`, **not** in `src/`, and no documentation may live under `src/` at any depth: `run_build` copies that tree wholesale into `dist/`, so anything placed there ships to production and is hashed into the integrity catalog. Every other knowledge directory owns its own `INDEX.md` ([tests/](tests/INDEX.md), [docs/](docs/INDEX.md), [use_cases/](use_cases/INDEX.md), [agent_tools/](agent_tools/INDEX.md)) with the root [INDEX.md](INDEX.md) as the map of maps — `src/` is the one exception, and this is why.
7. **Write self-documenting code inside each module, too.** Let names carry the intent — prefer descriptive functions and variables (`toRoute`, `renderSessionTitle`, `BASE_PATH`) over abbreviations or clever one-liners, so a reader rarely needs a comment to follow *what* the code does. Reserve comments for the *why*: the constraint, edge case, or decision the code cannot state itself (e.g. why the router derives its base from `import.meta.url`, or why an unknown route renders a view instead of redirecting). Don't restate mechanics the next line already shows, and delete dead code rather than leaving commented-out or unreachable branches behind.

---

## 6. Agent Tooling: Build the Tool, Don't Re-Improvise the Script

Repeated one-off scripting is invisible waste — it costs the same tokens every session and leaves
nothing behind for the next agent. When a check will be needed again, it belongs in
[`agent_tools/`](agent_tools/INDEX.md) as a real, tested, catalogued tool.

1. **Check the catalog before improvising.** [agent_tools/INDEX.md](agent_tools/INDEX.md) lists what
   already exists. Run `python -m agent_tools.<name>` rather than reconstructing its logic in a shell
   pipeline.
2. **Promote a script to a tool when it will run again, fails silently otherwise, and is cheap and
   deterministic.** All three, or just run the command — the bar and the rationale are in
   [agent_tools/INDEX.md](agent_tools/INDEX.md). Something that fails only the second test belongs in
   the test suite instead.
3. **Adding a tool means all of it**: the module (docstring stating *why it exists*), a catalog row, a
   unit test in [tests/unit/](tests/unit/), and a Stage 1 task in [build/](build/) if it should gate
   commits. A tool nobody runs is worse than no tool — it rots and then misleads.
4. **On small files, just make the edit — scripting it is the more expensive path.** Tokens are the
   real budget here (see the multi-model cost split), and a `python - <<'PY'` heredoc that rewrites
   two lines costs *more* of them than the direct edit: the script has to restate the old text, the
   new text, the file handling and the assertions, and it is written blind. The direct edit also
   keeps the read-before-edit guard (it fails loudly when the file is not what you thought) and shows
   the user a reviewable diff, both of which a heredoc discards.
   - **Default: the dedicated file tools** (Edit / Write) for anything measured in lines.
   - **A script earns its keep only on volume or repetition** — a dozen exact replacements across
     several files in one pass, where the round-trips genuinely dominate. Below that threshold the
     accounting does not work out, however mechanical the change looks.
   - **If you find yourself scripting the same shape twice, that is rule 2**: it wants to be a tool in
     `agent_tools/`, not a better one-off.
5. **Documentation cross-references are gated, not trusted.** `agent_tools/doclinks.py` runs in Stage
   1 and fails the build on a dead link, a dead `#anchor`, or a `§N.M` pointing at a section that no
   longer exists. Renumbering or deleting a section is therefore a whole-repo edit, and the gate will
   say so.
6. **Every pipeline task must be a gate — a check that blocks nothing is worse than no check.** A
   GitHub Actions job that no other job lists in `needs` still runs and still reports red, while the
   deploy ships regardless; the run page then shows a failure next to a successful release, which
   reads as *more* trustworthy than having no check at all. Adding a workflow job therefore means
   adding it to the `needs:` of whatever must wait for it, in the same change. Enforced by
   `agent_tools/pipeline_gates.py`: exactly one terminal job, and every other job inside its
   transitive closure.

   **The same rule runs in the other direction, and that one is easier to break: a Stage 1 check
   with no CI job blocks your commit but not the deploy.** Adding a task to `run_stage_1_parallel`'s
   table is a one-line edit; giving it a workflow job is not — so four had quietly accumulated
   (module catalog coverage, import layering, pipeline gating, cyclomatic complexity), each enforced
   locally and bypassable by anyone who pushed without running the gate. `pipeline_gates.py` now
   also asserts that every Stage 1 `run_*` is invoked by some workflow step. Group fast pure-analysis
   checks into ONE job (`structure-checks`, `static-security-audits`) rather than one job each — a
   fresh runner, checkout and Python setup costs ~30s apiece for checks measured in milliseconds.

   **Local green is not CI green.** The two environments differ in ways that do not surface until a
   push: the `owasp-zap-scan` and `static-security-audits` jobs run bare system Python with no
   `pip install`, so anything they reach must import with the stdlib alone (a `requests` import
   added to `ensure_zap_addons` passed every local run and would have failed the deploy). When a
   change touches a function CI calls, check *which* job calls it and *what that job installs*.
