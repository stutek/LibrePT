---
name: exploratory-test
description: Exploratory testing of LibrePT in a headless browser, in the role of a trainer who has never seen it and reads no documentation. Three modes. FORMS — judge one form at a time: which fields are too many, which are missing, where a control does not work, where a field has the wrong type or order; judged against what a context-free trainer subagent says the task needs, written before the form is seen; one subsection of the first-use trial section per form. SCENARIOS — hunt for defects no scripted test covers in the published app, one short scenario at a time, findings into the first-use trial section of TODO.md. A TRAINER'S DAY — a context-free subagent invents a whole working day (sessions, exercises, packages, billing, messages) and then tries to live it in the app; the orchestrator judges which gaps are worth automating and writes them into the trainer's-day section of TODO.md. Use when asked to explore, probe, "test as a trainer", run cycles of exploratory testing, or continue the first-use trial or the trainer's-day work. Every scenario and every day is recorded so none is repeated.
type: Skill
title: "Raziskovalno preizkušanje v vlogi novega trenerja"
tags: [testing, exploratory, browser, playwright, first-use-trial, all-agents]
---

# Exploratory testing as a trainer who has never seen the app

Binds every agent doing this work. Scripted tests in [tests/](../../../tests/INDEX.md) assert what we
already decided; this finds what nobody thought to assert. The judge is a personal trainer standing on
a gym floor with a phone in one hand, who has read nothing.

## The role

You are that trainer. Hold it for the whole session:

- **Read no documentation** — not [README.md](../../../README.md), not
  [use_cases/](../../../use_cases/), not the source. You may only read what the app puts on the
  screen. Looking up a control's real selector to "help yourself click it" is cheating the test: if
  you cannot find the control, that is the finding.
- **Phone first, one hand.** 390×844 is the default viewport. A thing that needs two hands, a
  hover or a wide screen is a defect.
- **Slovenian first** (`?lang=sl`), because that is the first market. Repeat a scenario in `en` or
  `de` only when the Slovenian run raises a question about translation.
- **Invent the data.** Made-up clients, goals, times, weights. Never a real person's name and never
  a real email — the published app is the public instance.
- **The maintainer's own Google account never reaches this browser.** Ruled 2026-09-27 (Simon).
  `LibrePT.test@gmail.com` exists for exactly this and is the only identity a test may use; his
  private inbox is not typed into a test browser, not once, not "just to see". The browser makes
  that hard to get wrong: it runs the Chromium Playwright ships, under its own `--user-data-dir`
  that is DELETED at every `start`, with `--incognito` on top, so it begins each session knowing
  nobody.
- **This skill does not sign into Google at all.** Not a policy — Google blocks automated browsers
  on `accounts.google.com` ([GOOGLE_CLOUD_SETUP.md](../../../docs/GOOGLE_CLOUD_SETUP.md)), so a
  scenario that needs a connected Drive cannot be driven from here. Test everything up to the
  sign-in — what the button says, what the app claims before and after, what it does with no cloud
  connected — and write the rest as a check for the maintainer to run by hand, naming
  `LibrePT.test@gmail.com` as the identity.

## Mode 1 — scenarios, on the PUBLISHED app, which lags `main`

Base URL `https://stutek.github.io/LibrePT/`, deep-link params `?lang=`, `?theme=`, `?init=demo_data_load`.
The app prints its commit SHA in the header (`#0625bd6` at the time of writing).

**The published build is FROZEN, and that is the point, not a compromise.** It does not move while
somebody else rewrites `src/` and runs gates, so a fixer and a tester work at the same time without
touching each other — on 2026-09-27 one session closed 41 findings while this one kept testing, and
neither disturbed the other once. Against the dev server both would break: every commit would swap
the app mid-scenario, and a gate needs a quiet tree anyway. So mode 1 tests the shipped build, which
is also what the trainer has in hand. Mode 2 uses the dev server for the opposite reason: it is one
long run, and a day spent rediscovering fixed defects measures nothing — so it takes the tree when
nobody else holds it.

**Read that SHA at the start of every session and write it into every finding.** Whether a defect
is already fixed on `main`, and where in `src/` it lives, is the implementer's check, not yours: a
tester never opens the source, not even after the observation. The SHA is what lets the implementer
make that check in a minute.

## Driving the browser

[explore.py](explore.py) holds ONE headless Chromium open across shell calls, so the next step can be
chosen from what the last one showed. Its profile is `.session/` beside it (a throwaway; delete it to
get a first-visit app back).

```bash
S=.agents/skills/exploratory-test/explore.py
.venv/bin/python $S start                  # once per session; add width height to change the viewport
.venv/bin/python $S goto 'https://stutek.github.io/LibrePT/?lang=sl'
.venv/bin/python $S text 3000        # URL, <html lang>, and visible text, capped
.venv/bin/python $S dialog             # only what an open dialog or overlay says
.venv/bin/python $S measure            # the open form: Save on screen? targets under 44×44? scrolls?
.venv/bin/python $S controls                # every tappable thing and the label it shows
.venv/bin/python $S click 'Ustvari trening' # by visible text, as a trainer taps
.venv/bin/python $S tap '#some-id'          # by selector, only when the text is ambiguous
.venv/bin/python $S fill '#client-name' 'Ana Novak'
.venv/bin/python $S type 'Ana Novak'        # into the field that has focus (tap it first): fill
                                            # with a class selector always hits the FIRST match
.venv/bin/python $S press '#search' Enter
.venv/bin/python $S select '#theme' nebula
.venv/bin/python $S offline on         # the gym basement; 'off' puts the network back
.venv/bin/python $S errors                  # console errors, warnings, uncaught throws since `goto`
.venv/bin/python $S eval 'document.title'
.venv/bin/python $S download '#btn-export-db' /tmp/…/backup.json   # a control that hands over a file
.venv/bin/python $S upload '#import-db-file' /tmp/…/backup.json    # hand the app a file back
.venv/bin/python $S inject "<js>"           # run JS before the page's scripts, then reload
EXPLORE_TAB=0 .venv/bin/python $S text      # drive a particular tab when two are open
.venv/bin/python $S shot /tmp/…/x.png       # only for a visual-only claim
.venv/bin/python $S stop                    # at the end of the session
```

The browser also closes itself after 15 minutes without a command (`IDLE_SECONDS` in explore.py), so
a session that ends without `stop` does not leave it running. The gate runs beside an exploring
browser: it gives its own browser tests only the cores the explorer leaves free, so exploring never
has to pause for a gate.

**Read the DOM, not pictures.** `text` and `controls` cost a fraction of a screenshot and are what an
assertion can quote. Take a screenshot only for a claim that is visual by nature (overlap, cut-off
text, contrast) and say so in the finding.

**When you cannot work a control, ask FIRST whether the app is at fault.** A tester who cannot
operate something is evidence, not noise — treat the failure as a candidate finding and only then
look for your own mistake. Two of the three "driver problems" below turned out to be the app:
the native dialogs and the control below the fold each became a finding of their own, measured after Simon
refused the excuse — the Save button opens 133 pixels under a 390×844 screen and 387 under a
320×680 one. A trainer meets exactly what the agent met. Only two of these are really the driver's
physics: a synthetic click carries no user gesture, and `innerText` cannot see a list the page keeps
off screen.

**A step that seems to do nothing is sometimes the driver, not the app.** Two ways it happens, both
cost an hour on 2026-09-27: a native `alert`/`confirm` is answered and printed by the driver, so an
app that DID reply looks mute if you are not reading for a `NATIVE` line; and a control below the
fold inside a scrolling dialog is not reached by scrolling the page — scroll the dialog's own
container (`.modal-body-scroll`) first, then tap. Before writing "nothing happened", ask
`document.elementFromPoint` what is actually under the control's middle.

**"Intercepts pointer events" can name an element nobody sees.** At 320×680 the welcome screen's
chapter list is a scrolling box whose sixth button is clipped at its edge, yet Playwright reports it as
covering "Začni s prazno aplikacijo" and refuses the tap; `elementFromPoint` at every height of the
link returns the link itself. A night session wrote this down as `blocked`. Before calling a control
covered, hit-test it: if every point of it returns the control, a finger reaches it, and the refusal
is the driver's. Then, and only then, `eval` a `.click()` on that one element to go on (no permission
is involved in such a button).

**Tap, never `el.click()` from `eval`.** A synthetic click carries no user gesture, so anything
behind a permission — the clipboard above all — waits for one that never comes, and the tab stops
answering every later command. That looks exactly like an app that froze. If the tab does stop
answering, an unanswered native dialog or a pending permission is the first suspect: close the page
through `http://127.0.0.1:9333/json/close/<id>` and open a fresh one rather than restarting.

**`innerText` lies about long lists.** A list the page keeps off screen (`content-visibility`) is
in the DOM and absent from `innerText`, so "the record I just saved is not there" can be false — it
cost half an hour on 2026-09-27, with the record sitting in the list all along. Ask the elements
(`querySelectorAll(...).map(e => e.textContent)`) or search `innerHTML` before believing that
something is missing, and check the database as well: reading IndexedDB from `eval` settles "saved
but not shown" against "not saved" in one call.

**One measurement beats a sweep of guesses.** The app's dictionaries are ordinary modules the page
can import, so a single `eval` can compare every `[data-i18n]` element on screen against the
Slovenian dictionary and name the ones that differ — 847 keys, one mismatch, no reading. Reach for
that shape whenever a finding would otherwise be "I noticed a few of these".

**`inject` stays for the life of the tab.** It runs before the page's scripts on EVERY later
`goto` and reload, not once. A clock shifted by two days on 2026-10-01 left the header saying
»Brez povezave« on a machine that was online, which reads exactly like a defect. After a scenario
that used `inject`, `stop` and `start` again before believing anything the app shows.

**A copy of `main` must carry a SHA.** `git archive` gives `src/version.js` with `commit: "dev"`,
and an unstamped build behaves unlike anything a trainer runs: on 2026-10-01 it stalled `/intake`
every time after the trainer's first launch and put »Brez povezave« in the header while online. Write
the SHA into the copy's `BUILD_INFO` before testing on it; the dev server on 8081 is unstamped too.

**`goto` is not a stopwatch.** It waits until the network goes quiet, up to 60 seconds, so a load
timed around it measures the driver. On 2026-10-01 that turned a 2.1-second boot on a slow line into
a 96.9-second P1 that had to be withdrawn. Time a load from `page.goto(url, wait_until="commit")` to
a `wait_for_function` on what the trainer sees, and write the predicate as a function (`() => …`):
the app's CSP refuses a string.

**A tab opened through `json/new` is not the same browser.** The browser runs `--incognito`, so that
tab gets its own, empty storage and looks exactly like an app that lost every record.

**`errors` after every scenario.** A console error with nothing visible on screen is still a finding.

## Mode 2 — a trainer's whole day

Scenarios find defects in what the app does. A day finds what the app does not do: the trainer lives
a working day invented before looking at the app, including the work around the training — bookings,
cancellations, prepaid packages, payments, invoices, messages, travel, measurements, planning. The
question is **how much of the day the app carries, and which missing part is worth building.**

**Roles.** The ORCHESTRATOR (the session running this skill) never plays the trainer. It prepares the
run, spawns the trainer, and judges the report. The TRAINER is a subagent started with no context
(`Agent`, `general-purpose`, model `sonnet` — the persona needs judgement about a working day, not
about this codebase), given only [persona-day-prompt.md](persona-day-prompt.md) with its placeholders
filled. Anything more — the TODO, the source, earlier reports — would let it plan the day around the
app, which is exactly what the test must not measure.

**Target: the local dev server, `http://localhost:8081/LibrePT/`,** which serves `main`. The
published build lags `main` by whatever was fixed since the last deploy, and a day spent rediscovering
fixed defects measures nothing. Check it answers (`curl -s -o /dev/null -w '%{http_code}'`) before a
run; starting or stopping it is Simon's call. **One day at a time:** the browser tool holds one
browser on port 9333, so two trainers at once would drive each other's pages.

**One cycle:**

1. Read the "Dnevi trenerja" table in the ledger. List the days already lived (persona type and
   covered tags) for `{already_lived}`, and the tags of the vocabulary below that no row has yet for
   `{uncovered_tags}`. For `{known_defects}`, list the open defects earlier days found, each with the
   workaround, so the next trainer spends its hour on new ground instead of rediscovering them.
2. Name the files: `.private/exploratory-test/days/<date>-<nn>-day.md` and `…-report.md`, `<nn>` the
   next free number.
3. Spawn the trainer with the filled prompt, `run_in_background: false`; its result is the input of
   the next step.
4. Read the report and the day. **Judge each gap against what is already written**: the business-needs
   brainstorm (the desk estimate of what a trainer's business needs), the first-use trial section
   (defects), the trainer's-day section (gaps from earlier days), and the rest of TODO.md. A gap already there gets one line of evidence under it — which day, the minutes
   it cost, the words the trainer used — never a second section. A defect goes to the first-use trial section by the
   rules of mode 1. Before writing one, repeat its steps in the browser, because a trainer's report of a
   broken control is often the browser tool (a hidden duplicate clicked, `fill` into the first
   matching field); do not look for its cause in the source. Only a gap written nowhere gets a new
   row in the trainer's-day section.
5. **Judge the investment** for every new or strengthened gap, and write the judgement into the trainer's-day section:
   value (minutes per month × how many trainers have the task, money that leaks), cost (small, medium,
   large; does it need a server, does it belong to ProPT, which TODO.md has its own section for, rather than to the free app), and a
   verdict — **izplača se**, **ne izplača se**, or **čaka na Simona** when the verdict turns on a
   decision that is his. A number the trainer made up is an assumption and is labelled so.
6. Add the day's row to the ledger, then commit the TODO edit alone (prose-only: run
   `agent_tools.doclinks`, not the gate).

**Tag vocabulary** (a day covers several; the ledger lists them so the next day can differ):
`individualno`, `skupina`, `krožna-vadba`, `kardio`, `rehabilitacija`, `zunaj` (park, stranka doma),
`več-lokacij`, `paket`, `plačilo`, `račun`, `odpoved`, `neprihod`, `rezervacija`, `opomnik`,
`sporočila`, `meritve`, `napredek`, `načrt-za-teden`, `prvi-obisk`, `domača-naloga`, `nadomeščanje`,
`sezona` (priprave na tekmo, zimski čas), `mladostniki`, `starejši`, `nosečnost`, `online`,
`zaposlen-v-fitnesu`, `ekipa` (klub, moštvo), `podjetje`, `v-paru`, `otroci`, `prehrana`,
`brez-signala` (klet, tujina), `posebne-potrebe`, `tekmovalec`.
A new kind of work gets a new tag in the same edit that first uses it.

**Cycles for a fixed time.** When Simon asks for "N hours of exploratory testing", read `date` at the
start and before every cycle, stop starting cycles when the time is up, and say how many ran. Between
cycles nothing else is needed: the ledger is the only memory the next cycle has.

## Mode 3 — evaluating a form

One form at a time, and the question is the one a trainer asks of it: **which fields are too many,
which are missing, where a control does not work, and where a field has the wrong kind or sits in
the wrong place.** Scenarios meet a form by accident, a field at a time; this judges it whole, against
what the task needs rather than against what the form happens to contain.

**What it is judged against — written before the form is seen.** A tester who has used the app reads
the form as it is and finds it reasonable. So the task comes first: the orchestrator names the task in
a trainer's words ("vpiši novo stranko", "načrtuj trening za naslednji torek") and spawns a trainer
with no context (`Agent`, `general-purpose`, model `sonnet`) given only
[form-task-prompt.md](form-task-prompt.md), as mode 2 does with its day. It writes what a trainer
would enter, in what order, in what form, what they would NOT want asked, and how they would check
the result. Files: `.private/exploratory-test/forms/<date>-<nn>-task.md` and `…-evaluation.md`.

**Target:** the published app, as in mode 1, because it does not move under you. Before writing a
point, look it up in TODO.md AND in [TODO_ARCHIVE.md](../../../TODO_ARCHIVE.md): the published build
lags `main`, and what was closed after its SHA is not a finding. Reach the form as a trainer does,
from the screens, never from the source. At 390×844 and at 320×680, in Slovenian.

**The four verdicts, each point with its evidence:**

1. **Odveč — a field the task does not need.** Evidence: the task file does not have it, or marks it
   LATER or "would not want to be asked"; or the same fact is already in another field or already
   known to the app (the trainer's own details, today's date, the client just chosen). A required
   field that the trainer does not have at that moment is the worst kind — say so.
2. **Manjka — something the task needs and the form has no place for.** Evidence: a line of the task
   file with no field, and where the trainer would put it instead (the notes field, a name, nowhere).
   A fact that ends up in a free-text note because it has no field of its own is the usual sign.
3. **Ne deluje — a control that does not do what it says.** Try every control once: it does nothing,
   does something other than its label, cannot be reached (`measure`: Save off the screen, targets
   under 44×44), or cannot be answered correctly (the wrong inputs: a day that does not exist, an end
   before the start, "2,5", a negative number, 300 characters, a leading "="; the result must be
   refused at the field or said, never a different value in silence). Then the exits — *Prekliči*, ✕,
   Esc, back, the ☰ menu — against Simon's rule (2026-09-17): *Prekliči* discards, every other exit
   keeps what was typed. Then a reload mid-form. Then save, reopen and compare every field with what
   was typed, as the task file says the trainer would check it.
4. **Napačen tip ali vrstni red.**
   - *Type:* the control against the form the task file gives. Free text for a short fixed list, a
     list for a number, a number field that reads the separator by the phone's language, a date or
     time the phone formats, a yes or no for something with three answers, a unit that is not shown.
   - *Order:* against the order the task file thinks in. A field that decides others (the date before
     the time, the client before their programme) placed after them; required fields below optional
     ones; the field most often changed out of the thumb's reach; the order of the eye different
     from the order of Tab.

**Where it goes.** One subsection of the first-use trial section of TODO.md per form, headed with the form's name, with the four
lists in that order; each point gives its evidence in one line and its priority (P1 loses data or
blocks, P2 costs time or misleads, P3 cosmetic). A point that is a defect is a defect; a point that
would add, remove or reorder a field changes what the form IS, and is marked **čaka na Simona** — the
evaluation says what is wrong and why, the ruling is his. The ledger gets a row in its third table,
"Obrazci": | datum | obrazec (kako se odpre) | naloga | SHA | izid (the finding's number) | polja / dotiki |, the last
column the fields and taps of the shortest save that is of use. Read it first: a form evaluated on
the same SHA is not evaluated again.

## Never run the same scenario twice

The ledger is `.private/exploratory-test/scenarios.md` (gitignored, so named rather than linked: a
link into it is dead in every clone and in CI). Scenarios have one table, days (mode 2) another,
"Dnevi trenerja", with one row per day:
| datum | št. | kdo je trener | dan v enem stavku | oznake | izid (the numbers it produced) |.
**Read it before inventing anything**, and add a row the moment a scenario ends —
clean runs included, because a clean run is what stops the next session repeating it. One row:

| date | viewport+lang | scenario in one sentence | result |

`result` is `clean`, `§80.N` (the finding it produced), or `blocked: …`. Keep the invented names in
the row, so a later session can tell which records in the app are its own.

Pick the next scenario from what the app just showed, not from a list made up front: an unexplained
label, a control that did nothing, a state you reached by accident. When nothing suggests itself, take
a path the ledger has no row for — a cancellation, an interruption, a reload mid-flow, a second
device width, an empty app rather than the demo seed.

## Where a finding goes

**The first-use trial section of TODO.md, as its own numbered subsection, in the same turn you find it** — never saved up for
the end of the session. Tokens run out mid-session; an unwritten finding is a finding lost. That section is
written in Slovenian and its subsections have a fixed shape; follow it:

```
### 80.N [ ] P<1-3> — <what a trainer sees, in one line>

**Scenarij in koraki:** <the taps, in order, naming each control by the label it showed>

**Opaženo:** <what happened, quoting the app's own words>

**Težava in vpliv:** <what it costs the trainer at work>

**Predlog:** <what would help the trainer, in their terms> — opaženo na različici `<sha>`.
```

Priority: **P1** blocks the work or loses data. **P2** costs the trainer real time or misleads them.
**P3** is cosmetic. A defect the app already decided to have is not a finding — check that section and the
neighbouring ones before writing, and if an existing subsection already covers it, add to that one.

TODO.md is claimed by nobody: read the section, add your subsection, and commit that edit alone,
staged by hunk. Prose-only commit, so run `.venv/bin/python -m agent_tools.doclinks`, not the gate.

**Never edit `src/` or `tests/` in this work.** This skill observes and reports. A fix is separate
work, after Simon has read the finding — and another session may hold the tree.

## What is worth reporting, and what is not

Report: a control whose label does not say what it does; a step that cannot be completed; data that
disappears after a reload; a time that is not 24-hour or a date that is not ISO; English inside a
Slovenian screen; a message that blames the trainer; a tap target too small for a thumb; text cut off
or overlapping; a dead end with no way back.

Do not report: your own failure to find something the screen states plainly; a cause — say what you
saw and what it costs, not why it happened, which is the implementer's to find; a wish for a feature
that is not there (that is a new TODO section, and it
needs Simon's ruling, not a defect report).
