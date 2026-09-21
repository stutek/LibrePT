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
   flourish at the end of a paragraph. **Be literal — no metaphor at all**, not merely none where a
   plain word would do: say *an evening the trainer opened, moved, cancelled, started or edited*,
   never *an evening the trainer touched*; say what the code does, never what it feels like. A verb
   doing figurative work is the commonest form of it, and the hardest to see on re-reading.
   **Name the thing, not
   the principle**: which file, which value, what breaks. **Never point at something instead of
   naming it** — not *that decision*, *one of those costs*, *the danger in §70*: state which
   decision, which cost, what §70 says. A sentence restating why a rule is good is
   padding, and reads as evasion — justify when asked, not by default. **Cut, then cut again**: the
   same content in fewer words is always better, and what goes is repetition, throat-clearing and the
   sentence explaining the sentence before it. A reply that has to be re-read has failed, however
   true it is.
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
  missing from it? **Start the work only on a verdict that it improves the product; otherwise stop
  and discuss it first.** This holds for a message that arrives mid-turn too. Raise what they cannot
  see from where they sit before being asked.
- **Text they hand over is a draft, not a quotation.** Fix its spelling, its terms and its
  inconsistencies rather than transcribing them, and say what you changed.
- Answer a question; never record it as a decision, and never return with a plan for one they have
  already made.
- Read a message for ALL of its items before acting on any, and name them back.
- Report what a person would SEE, not the mechanism. Quote a new or changed rule verbatim. Say which
  numbers were measured; `git ls-files` is the honest denominator.

## Execution

- Apply edits directly. Auto-commit coherent work to `main`, one logical change per commit, staged
  from `git status --short` — your own files only, and a file two sessions have touched is staged by
  hunk, never whole. **Read `git diff --cached` before every commit** — a claim in a note does not
  stop another session writing the file, and a whole-file `git add` then commits its work as yours.
  **Never push.** **A request that arrives mid-turn is its own commit**,
  not an addition to the one in progress: several asks landing while a gate run is in flight are
  split apart when it ends, never bulked because they happened in one turn. Where one verified tree
  yields several commits, say that the gate ran once, on the whole tree.
- **Another agent may be working in the same tree.** Before the first edit, read
  `git status --short` and `.private/AGENT_SYNC/`; never start a second `build check` or commit on
  top of one in flight. Claim your work in `.private/AGENT_SYNC/<model>-<topic>.md`: what is in
  progress, and every file you take exclusively. A file another note claims is not yours — take
  other work or ask. **Delete the note in the same turn as the commit**; a stale note locks files
  nobody holds.
- **A gate needs a QUIET TREE for its whole run, not merely a free slot.** The dev server computes
  the integrity catalog live from `src/`, so a file written mid-run changes its hash under the
  service worker and the app comes up behind the blocking *App verification failed* overlay — which
  then fails whatever tests happen to be running, naming none of the cause. Seven unrelated e2e
  tests, 2026-09-12. Say in your note when a run starts, and hold edits to `src/` until it ends.
- **`pgrep -f "python -m build"` DOES NOT detect a gate.** It matches any command line containing
  that string — including the watcher that is looking for it, and the shell wrapping the `pgrep`
  itself. On 2026-09-12 it reported a run in flight for twenty minutes while none existed: one
  session held back, edited anyway on a false positive, apologised to a second session for spoiling
  a run, and accused a third of owning it. Three sessions coordinated around a process that was the
  watcher's own reflection. Ask the gate, not the process table — `build check` holds
  `.build-reports/gate.lock` with its pid, and a probe that cannot name the pid it found has found
  nothing.
- **A check whose result nothing acts on is not a check.** Putting the probe and the action in one
  shell line prints the warning and does the thing anyway. Guard it, or read the answer in one call
  and act in the next. **And a probe before the run proves nothing about the run**: what makes a
  green gate trustworthy in a shared tree is a snapshot of every path and mtime under `src/` taken
  before AND after, compared — anything less is a green light for a tree that may not have existed.
  **A snapshot that differs VOIDS the run; it does not annotate it.** On 2026-09-12 a session
  reported "green on all four stages, the fingerprint differs by exactly one added path" — and that
  path was a file whose own Stage 1 check fails deterministically. Stage 1 had simply finished before
  it appeared. Green obtained before the tree moved is not a verdict on the tree after.
- **The quiet tree includes `tests/`.** Deleting or renaming a test file mid-run changes what Stage 2
  and Stage 3 collect, which is the same damage as moving a byte under `src/` and is equally outside
  what the lock can see.
- **A window goes in the NOTE, not only in a message.** Announced by message, two of three sessions
  knew and the third wrote into that window in good faith — it had read the note, which said only
  that a window would be announced. A note is read by whoever arrives next; a message reaches only
  who was listening at the time.
- **A refusal from the gate means WAIT, not proceed.** The lock exists to make a second run
  impossible, not to give anyone a reason to commit without one.
- **The note carries state, a message carries negotiation.** `ListAgents` and `SendMessage` reach a
  session that is alive and listening; the note reaches one that starts later, or one that died
  mid-edit. So on finding foreign changes, read the notes first and message second, and never let a
  message be the only record of who holds what.
- **A gate that failed on someone else's half-written file is not your failure.** Read the digest;
  if the failing file is another session's, re-read `git status --short` and the notes every five
  minutes and judge whether the tree has settled. Say what you are waiting for. This is the one
  allowed re-run; a failure in a file you hold is yours.
- **Research and planning run in parallel; WRITING THE TREE DOES NOT.** Several sessions reading,
  planning and drafting at once is wanted. The working tree takes ONE writer at a time: claim it in
  the note, write, verify, commit, release, and say so. Per-file turn-taking is not enough — three
  sessions editing three different files broke three gate runs on 2026-09-12, because a run proves
  a TREE and anyone else's write voids it while it is in flight.
- Commit messages: `type(scope): imperative summary` (lowercase, ≤72 chars), blank line, body
  wrapped at 72 saying **why**, blank line, and last a line `Co-Authored-By: <model> <email>`
  naming the model actually running. **Write the message to a file and commit with
  `git commit -F <file>`.** `git commit -m "…\n\n…"` stores the two characters `\` and `n`, not a
  line break: git then finds no body and no co-author (Codex, 2026-09-15). After the commit,
  `git log -1 --format='%(trailers:key=Co-Authored-By)'` must print that line.
- **Run `.venv/bin/python -m build check` in full before every code commit**, unpiped, and report
  the result. **Say the clock time it will finish BEFORE launching it, in the reply, for every run —
  a re-run too** — `.build-reports/last-run.json` holds the last duration, so that is a time such as
  "done at 08:49", never "312 seconds" or "a few minutes", and a time written only in the note has
  not been said; the run's own header prints the same estimate. **Every clock time you give — to
  Simon, in a note, or to another session — comes from `date` read in that turn**, never carried
  over: a machine that slept makes an old reading hours wrong ("release by ~09:50" at 23:41). Prose-only commits run `.venv/bin/python -m agent_tools.doclinks` instead, and
  say so.
- **Run the checks your change can break BEFORE the gate**, one at a time: `pytest <file>`,
  `node --test <file>`, and the `agent_tools.*` check that owns the rule — a theme calls for contrast
  and palette parity, a new module for catalog coverage, doclinks and the service worker's precache
  list (`tests/unit/test_project_layout.py`), a new route for the overflow walk
  (`tests/e2e/test_layout_overflow.py::test_the_walk_still_covers_every_route`), a new icon for coverage and the
  render baseline, new user-visible text for `ui_strings`, a closed `§` for `todo_hygiene`. The gate
  PROVES a tree; it is not where facts are discovered. Five minutes spent learning a two-second fact
  is the maintainer's time, and the same five minutes blocks every other agent in the tree.
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
- **Look and layout are written only in CSS, and a theme is a whole stylesheet** that may restyle
  any component. Code sets classes, state attributes and custom properties — never `style="…"` or
  `el.style.*`, which beats every theme.
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
- **A time is 24-hour and a date is ISO, everywhere, in every language**, and the written form is
  the app's decision rather than the device's. `<input type="time">`, `<input type="date">` and
  `toLocaleTimeString` all ask the PHONE: a Slovenian app on a US-set phone asks for AM/PM and shows
  09/12/2026 for the twelfth of September, so an evening session can be saved in the morning and a
  session three months away looks right. Entry goes through `modules/common/timeField.js` and
  `dateField.js` (both on `steppedField.js`), display through `formatClockFromMinutes` /
  `formatClockFromEpoch`. A local reading is at most a setting on those seams, never a second field —
  and a locale passed to `toLocaleDateString` must be the APP's language, never the device default.
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
