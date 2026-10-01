---
type: roadmap
title: LibrePT Planned Work & Open Questions
description: Backlog of planned features, UX changes, and unresolved design questions for LibrePT, captured for later brainstorming and implementation.
status: active
tags:
  - roadmap
  - backlog
  - brainstorming
  - okf
---

# LibrePT — Planned Work & Open Questions

Open and in-progress backlog, and **only** that. **[Brainstorm]** marks a design question to settle
before code; **[~]** marks partial work; gaps in the numbering mark items pruned entirely.

**A closed section leaves this file the day it closes.** What shipped goes to
[CHANGELOG.md](CHANGELOG.md); the reasoning that produced it goes to
[TODO_ARCHIVE.md](TODO_ARCHIVE.md), verbatim and in full. Only the heading stays here, above one line
saying where the rest went, so a `§N.M` reference from code, a test or another document still lands.
A subsection still marked `[ ]` or `[~]` stays behind under that heading: open work is never filed
under done. [agent_tools/todo_hygiene.py](agent_tools/todo_hygiene.py) fails the build when a closed
section keeps its body — this file reached 5,406 lines, 2,542 of them closed, before anyone noticed,
and every agent that read it paid for those lines.

New sections go at the END of the file, in number order.

Canonical context: [README.md](README.md) (architecture & features), [use_cases/](use_cases/)
(workflows), [CONTRIBUTING.md](CONTRIBUTING.md) (conventions). Durable engineering lessons live
with the agent operating rules, not here — this file records *work*, not process.

## [x] Resume point — state as at 2026-09-26 12:06 — merged 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-resume-point--state-as-at-2026-09-26-1206--merged-2026-09-30).

## [x] Where to start (ranked 2026-08-22) — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-where-to-start-ranked-2026-08-22--superseded-2026-09-30).

## 1. Scheduling & Sessions

### 1.1 [x] PT-side client assignment to a session

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#11-x-pt-side-client-assignment-to-a-session); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 1.2 [x] Simultaneous sessions merged into one clipboard: multi-line titles + per-participant tags — dots shipped 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#12-x-simultaneous-sessions-merged-into-one-clipboard-multi-line-titles--per-participant-tags--dots-shipped-2026-09-30).

### 1.3 [x] Session list must model partial overlaps — shipped 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#13-x-session-list-must-model-partial-overlaps--shipped-2026-09-30).

### 1.4 [ ] Calendar preferences — holidays and non-working days

Import a holiday calendar (public holidays, gym closures) and colour-code off days on the date-jump
picker and the timeline's day lines. Needs a per-region feed and a per-trainer toggle, because a gym's
closures do not match a public holiday list. Distinct from the temporal tinting
(`--temporal-past`/`--temporal-future`), which shows how recent a session is, not whether the day is
open. **Stays in the free app** although §1.5's 2026-09-27 ruling moved Google Calendar to the paid
tier: a holiday list is a public feed, not a read of the trainer's own Google account.

### 1.5 [ ] [Brainstorm] The Google grant this app asks for, and the data-processor exposure it avoids

**Raised 2026-08-01 (Simon).** Cross-referenced from [PRIVACY.md](PRIVACY.md).

**Ruled 2026-09-27: Google Calendar left this app.** Scheduling facts, room occupancy and reading the
trainer's own calendar are paid capabilities (private `~/Projects/EnterprisePT` `TODO.md` §19; §68.3
lists what leaves this repository). This app's Google grant is Drive only.

Settled:

- **No backend of our own.** Cross-device sync uses Drive `appDataFolder` on the same grant (§3.3).
- **PII on Drive.** No server LibrePT operates touches the data, so the maintainer is outside the
  controller/processor chain. The backup is encrypted on the device since 2026-09-28 (§18.8), and sync
  does not run until the backup password is set, so Drive never holds a readable copy.
- **Firestore is rejected as the default.** It would make the maintainer a GDPR processor (DPA,
  subprocessor disclosure, residency choice, breach duties).

Open:

- Is sub-second push or server-side compute ever needed, or is a refresh on resume enough? Only a yes
  reopens Firestore.
- **Google's consent-screen verification is a launch dependency.** The app runs *In production,
  unverified*: up to 100 users ([GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md)). Verification
  needs a privacy policy, a homepage and review time. `github.io` is on the Public Suffix List, so
  domain ownership may not be provable there; a custom domain solves both, and §16.6 decides the
  domain.

#### 1.5.1 [x] Live-Google testing with a bounded stored credential — 2026-08-16 — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#151-x-live-google-testing-with-a-bounded-stored-credential--2026-08-16--archived-2026-09-30).

### 1.6 [~] Double-booking warning while the slot is being typed

**Raised 2026-08-16 (Simon).**

**Done** (details in [CHANGELOG.md](CHANGELOG.md)):

- **The local clash warning.** [scheduleConflicts.js](src/domain/scheduleConflicts.js), shown live under
  the time fields. Two sessions in the SAME place are §1.2's merged clipboard, not a clash; a clash
  needs two different named locations. It is a warning the trainer can confirm, never a block.
- **Invites.** They carry `ORGANIZER`, a reply link and a **Text it** button; the channels are email and
  SMS (decided 2026-08-17). What an event is and how it travels are separate
  ([sessionEventPayload.js](src/data/sessionEventPayload.js),
  [eventTransports.js](src/modules/common/eventTransports.js)).
- **Replies.** The client's reply page is [rsvpView.js](src/modules/rsvp/rsvpView.js); a reply carries
  only `{sessionId, clientId, answer}`. Answers are stored in `invites`
  ([inviteRecord.js](src/data/inviteRecord.js)), which is in schema 4, so a restore keeps them.
- **Changes and expiry.** A changed slot, room, session kind or invitee list offers to re-send
  ([sessionChangeNotice.js](src/domain/sessionChangeNotice.js)); invitations expire at a time the
  trainer sets ([inviteExpiry.js](src/domain/inviteExpiry.js)).
- **The external half** (reading the trainer's Google calendar) left this app on 2026-09-27 with the
  rest of Calendar (§1.5, §68.3).

**Open, waits on Simon's ruling — the replay question.** The reply link works for anyone who holds it,
and it can be sent again. It writes only to the trainer's own store and an RSVP deletes nothing, but a
forwarded invite lets a third party answer for the client. Decide whether that is acceptable.

### 1.7 [x] Client self-onboarding and GDPR consent from a QR on a leaflet — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#17-x-client-self-onboarding-and-gdpr-consent-from-a-qr-on-a-leaflet--archived-2026-09-30).

## 3. Data Sync

### 3.3 [x] Google Drive periodic sync

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#33-x-google-drive-periodic-sync); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.5 [x] Paper consent — checkbox, signed date, form version, and delivery

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#35-x-paper-consent-checkbox-signed-date-form-version-and-delivery); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.7 [x] [Superseded by §18.6] Persistence engine — localStorage JSON, then IndexedDB

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#37-x-superseded-by-186-persistence-engine-localstorage-json-then-indexeddb); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.8 [x] Unbacked-data warning banner — same weight as the PREVIEW badge

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#38-x-unbacked-data-warning-banner-same-weight-as-the-preview-badge); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.9 [x] [Decided] Every write increments the ahead counter on the Sync & Backup button

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#39-x-decided-every-write-increments-the-ahead-counter-on-the-sync-backup-button); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.10 [x] [Decided] Drive syncing is manual-only; periodic/resume ticks refresh counters, not data

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#310-x-decided-drive-syncing-is-manual-only-periodicresume-ticks-refresh-counters-not-data); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.13 [ ] A second sync store for Apple users, or a backend of our own — researched 2026-09-27

**Asked by Simon, 2026-09-27**: would a private sync layer on Google Cloud (Android users) or iCloud
(Apple users) be easier than the services those accounts already provide?

**Answered: no.**

- **Google.** Drive `appDataFolder` (§3.3) already is that private layer: one hidden folder only this
  app reads, with merge, conflict detection and a live canary built.
- **iCloud.** A web app reaches it only through CloudKit JS, which needs an existing native iOS or Mac
  app, a Mac to build it on and the $99-a-year Apple Developer Program
  ([CloudKit JS](https://developer.apple.com/documentation/cloudkitjs),
  [Apple Developer Program](https://developer.apple.com/programs/)). Its web token lasts 30 minutes, or
  2 weeks with "Keep me signed in"
  ([CloudKit Web Services Reference](https://developer.apple.com/library/archive/documentation/DataManagement/Conceptual/CloudKitWebServicesReference/SettingUpWebServices.html)).
  The app's Google access token lasts about an hour, in memory only, and Google renews it without
  asking (`src/data/googleAuth.js`). Storage counts against the user's own iCloud quota
  ([TN2241](https://developer.apple.com/library/archive/technotes/tn2241/_index.html)), as Drive's does.
  The one gain: an Apple user would not need a Google account.
- **A backend of our own on Google Cloud** puts us in the processor chain
  ([Cloud Data Processing Addendum](https://cloud.google.com/terms/data-processing-addendum)): a
  processing agreement per trainer, a hosting location, deletion and export duties, a breach
  notification path. That is why §1.5 rejected Firestore.

**Open**: an Apple user needs a Google account to sync. The cheap answer is the file the app already
writes: export and import through the share sheet, with no account anywhere. Whether that is enough
for a trainer with two devices is unknown. Next step: ask a trainer who uses two devices.

## 4. UI / UX

### 3.11 [x] Sync surface — the icon vocabulary and tap-to-sync — SHIPPED 2026-08-12

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#311-x-sync-surface-the-icon-vocabulary-and-tap-to-sync-shipped-2026-08-12); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 3.12 [x] Ship the remaining trainer-facing docs as pages, not GitHub links

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#312-x-ship-the-remaining-trainer-facing-docs-as-pages-not-github-links); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 4.1 [ ] Theme redesign

The light theme needs a nicer design (reference:
<https://claude.ai/code/artifact/f27dc4ca-e1b4-47dd-b3c6-34dee3d6110c>), and the dark themes are improved
in the same pass. Each theme is a whole stylesheet in [src/modules/themes/](src/modules/themes/);
`agent_tools/css_tokens.py` holds all of them to the same set of properties.

### 4.3 [x] Collapse the duplicated session header into one row, with a date picker — see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#43-x-collapse-the-duplicated-session-header-into-one-row-with-a-date-picker-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 5. Client Detail

### 5.1 [ ] Tabbed client view

Clicking a client opens a tabbed view instead of today's flat `view-client-detail`. Keep the goals
and health/injury notes as they are.

| Tab                       | Content                                                                                                                          |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------- |
| **1 — Sessions**          | The sessions this person attended.                                                                                               |
| **2 — Exercises**         | Every exercise the person has done or will do, **in time order, not grouped by session** — one timeline across history and plan. |
| **3 — Next session prep** | Where the trainer creates cards for the next planned session, **or** for a placeholder session not yet on the calendar.          |

- Tab 2 is a new projection: today exercises exist only inside sessions and routines.
- Tab 3 introduces a **session with no calendar entry**. Decide where it lives in the data model and
  what happens when it is later attached to a real booking. §7.3 item 5 (unscheduled sessions) is the
  same question from the other end, and is partly built.
- **Create and edit (decided 2026-07-22): no standalone add/modify client view.** A client has no live
  mode, so a separate edit view would duplicate the detail screen. **Create** is a small modal with
  the minimum fields that then opens the detail view; **edit** is inline in the tabbed view. Ships
  with the tabbed view.
- Closes the loop with [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md).

### 5.2 [x] Client add/modify — fold editing into the detail view, keep creation a minimal modal — merged 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#52-x-client-addmodify--fold-editing-into-the-detail-view-keep-creation-a-minimal-modal--merged-2026-09-30).

## 6. Housekeeping

### 6.2 [~] Extract use cases and usage scenarios from the tests

Write the end-to-end flows the Playwright suites drive into [use_cases/](use_cases/) (frontmatter,
`INDEX.md` row, graph links).

**Done**: [UC5](use_cases/uc5_session_day_deck_and_deep_links.md); traceability tables for UC1–UC4,
gated by `agent_tools/use_case_tests.py`; coverage measured 2026-09-28 at 93.3% of `src/` lines, gaps
closed in `ddd9e95`, pure logic held at 90% by `agent_tools/unit_coverage.py` (`2d7ef08`); the last
save kept when the page closes at once (`76d9af1`, [unsavedStateJournal.js](src/data/unsavedStateJournal.js));
UC1 step 2 and UC4 step 8 (Calendar guests) resolved by §68.3.

**Open:**

- (a) UC1/UC2 behaviour with partial or no coverage: voice notes, the feedback→adjustment wizard.
  (b) Whether themes, the header menu, first-run terms and sync/backup each need a use case or belong
  in README.
- [ ] **The tier counts in [tests/INDEX.md](tests/INDEX.md) are stale**: e2e says 55 files / 253 tests
  where pytest collected 73 / 328 on 2026-09-28; medium 60/349 against 64/442; unit 44/316 against
  52/360. Next step: drop the counts, or generate them.
- [~] **Adapting a plan: during the session, after it, and for the next one — ruled 2026-09-28
  (Simon).** *Pivot / Wipe Plan* was never asked for. Wanted: during a session the trainer logs the
  changed steps with as few taps as possible; afterwards edits notes and plans as a retrospective and
  adjusts future plans. Find the simplest way. The pivot text leaves UC1 and README with that design.
  Proposal under discussion: a client always trains from their OWN copy of the plan; the routine is
  only where a copy starts.
- [~] **UC2 *Apply & Resolve* changes a routine every client shares — ruled 2026-09-28 (Simon): on a
  change to something shared, detect the client it is for and split off a copy for them.** The dialog
  writes into the first routine holding the exercise (`resolveAdjustmentTargets` in
  `src/modules/plans/planAdjustments.js`). A scheduled session holds ONE `routineId` for all
  participants, and the per-client planning draft in `history` is not read when a session starts, so a
  copy would not reach the gym floor until sessions read it. Same design round as the item above.

### 6.3 [x] The bottom session bar renders nothing — decided: restore, active state only

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#63-x-the-bottom-session-bar-renders-nothing-decided-restore-active-state-only); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 6.4 [x] CI runs medium and e2e in parallel; the local gate runs them staged — RESOLVED: keep parallel

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#64-x-ci-runs-medium-and-e2e-in-parallel-the-local-gate-runs-them-staged-resolved-keep-parallel); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 7. Feedback Loop

### 7.1 [ ] [Brainstorm] One-click resolve for pending plan adjustments
Do we allow a 1-click resolve on pending plan-adjustment reminders? Tension: one-tap fits the
low-interaction principle, but plan adjustments are exactly the decisions that deserve deliberate
review at the desk ([uc2](use_cases/uc2_async_plan_adjustments.md)).

### 7.2 [x] Feedback button must show its own state — toggled, and "notes exist" — note mark drawn and tested 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#72-x-feedback-button-must-show-its-own-state--toggled-and-notes-exist--note-mark-drawn-and-tested-2026-09-30).

### 7.3 [~] [Brainstorm] Session-level "Pending Review" flag, unscheduled sessions, and a shared scrollable-deck component

**Raised 2026-07-27 (Simon).** The label rename and the time-ordered timeline shipped (see CHANGELOG).

**Settled**: resolution is per feedback record (`resolved` on a `planUpdates` entry), so a session-level
roll-up is derived and never stored. Cards are strictly time-ordered, except unscheduled cards, which
sit together where the past and active cards end and the future begins.

Open, in this order:

1. [ ] **Unscheduled cards stay on screen when scrolling toward the future** (a "needs scheduling"
   reminder) but may scroll away toward the past. `position: sticky` pins in both directions, so this
   needs code that reads the scroll direction.
2. [ ] **Client registry → all sessions as a scrollable deck**, rendered in a window, not as unbounded
   DOM. Nothing is virtualised yet; worth it only if session volumes justify it.
3. [ ] **Filter chips** (past/active/future/for-review/unscheduled). Needs items 4 and 5.
4. [ ] **Session-level review flag**: a derived `needsReview` roll-up for the dashboard and registry;
   opening the session still shows which items carry which tag.
5. [~] **Unscheduled sessions.** Deleting a session keeps each participant's plan as an unscheduled
   draft, reachable from the feed (2026-08-07). Open: creating one directly.
6. [ ] **One shared scrollable-deck component**: only the scroll/snap container and the card shell.
   Clipboard cards add drag and edit on top; registry cards are browse-only.

## 8. Clipboard Interactions

### 8.1 [x] Bind multiple clients to one shared set of exercises — shipped 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#81-x-bind-multiple-clients-to-one-shared-set-of-exercises-shipped-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 8.3 [x] Inline Clipboard Editor — shipped, see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#83-x-inline-clipboard-editor-shipped-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 8.6 [x] Rests are first-class, focusable plan items — shipped, see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#86-x-rests-are-first-class-focusable-plan-items-shipped-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 8.7 [ ] [Discuss] Should completing a circuit ROUND stop its timer, like completing the block does?
**Raised 2026-08-06 (Simon).** `completeCircuitRound` is asymmetric and the asymmetry was never
decided — it fell out of where the code happened to put the call. On the **final** round the timer is
**frozen** (not cleared: the trainer dismisses it themselves); on any **earlier** round the timer is
left entirely alone. So the same control does or does not touch the timer depending on a number the
trainer is not looking at.

- **For leaving it running**: between rounds, a running rest countdown is exactly what the trainer is
  pacing off. Freezing at round 2 of 4 destroys the thing they started it for.
- **For stopping it**: the round is over — but `focusRef` only records `{type: "circuit", id}`, so
  the app cannot tell "resting between rounds" from "timing this round's work". **That may be the
  real gap**: the decision needs a distinction the data model does not make.
- **Check the gym floor first**: §8.6's first-class rests mean a between-rounds rest can now be a real
  plan item with its own timer, which may make the question moot for well-authored circuits.

No behaviour change until this is settled; the entry exists so the asymmetry is recorded rather than
re-discovered.

### 8.8 [x] Copy the program to another participant — shipped 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#88-x-copy-the-program-to-another-participant-shipped-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 9. Interactive Demo / Guided Onboarding

The guided walkthrough, the simulated finger and selective demo removal shipped (see
[CHANGELOG.md](CHANGELOG.md)); sample data now lives in a separate sandbox workspace. Open: §9.6.

### 9.2 [x] Demo-data loader — PARTIAL — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#92-x-demo-data-loader--partial--superseded-2026-09-30).

### 9.3 [x] Selective demo-data removal — shipped 2026-08-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#93-x-selective-demo-data-removal-shipped-2026-08-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 9.4 [x] Simulated finger / touch controller — 2026-08-16

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#94-x-simulated-finger-touch-controller-2026-08-16); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 9.5 [x] Guided walkthrough engine (step overlay) — 2026-08-17

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#95-x-guided-walkthrough-engine-step-overlay-2026-08-17); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 9.6 [ ] [TBD] Install as an offline Android / iOS app
Already a PWA (manifest + service-worker precache). Open: install-prompt/A2HS UX, fully-offline first
load, and whether the GitHub Pages origin is acceptable or a packaged wrapper (TWA / Capacitor / bare
PWA) is needed.

---

## 11. Navigation & Layout Redesign

### 11.1 [x] Replace the footer nav with a message / status area — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#111-x-replace-the-footer-nav-with-a-message--status-area--superseded-2026-09-30).

### 11.2 [ ] Active-session overlay → a normal `#view`
Fold `#active-session-overlay` into a normal `#view-session` inside `#main-content`. Now that the
header is omnipresent and sits above it, the fixed-overlay special-casing is redundant; this
simplifies the deck/tabs/title-bar wiring and unifies router handling.

### 11.3 [x] The ☰ menu is where everything without a home ended up — superseded by §81.2, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#113-x-the--menu-is-where-everything-without-a-home-ended-up--superseded-by-812-closed-2026-09-30).

## Audit schedule — every two weeks

Decided 2026-08-18 (Simon). Checks whose findings need judgement rather than pass/fail, so they are
not gates. Whoever is working runs them on the cadence and records the date. **All three are overdue**:
the last runs were 2026-08-12 to 2026-08-19.

| Every two weeks              | What to look for                                                                                                                                                                                                                                               | Last done  |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **Duplication sweep**        | `python -m agent_tools.constant_copies` (§28.3) for declared constants; then, by hand, values or blocks that have copies and are declared nowhere. A copy-paste detector was rejected: the standard one is an npm package, and this repo has no npm dependency | 2026-08-18 |
| **ZAP suppression review**   | Every `IGNORE` in `deploy/zap/zap-baseline.conf` still true, re-derived from the code, not from its comment                                                                                                                                                    | 2026-08-12 |
| **Timing budget re-measure** | The per-stage budget table against an idle machine. A stage that grows with no tests added is a defect                                                                                                                                                         | 2026-08-19 |

A tool moves from this table into `build/` once it has caught something more than once.

## 12. Documentation, Tests, OKF & Housekeeping

### 12.3 [x] Test completeness — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#123-x-test-completeness--superseded-2026-09-30).

### 12.4 [x] Capture exceptions and offer semi-automatic bug reporting — 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#124-x-capture-exceptions-and-offer-semi-automatic-bug-reporting-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 12.5 [ ] Local git housekeeping (trademark refs)
The trademark was scrubbed and force-pushed; the remote is clean and no `refs/original/…` or backup
branch remains. The old blobs survive only in reflog entries. **Maintainer action** — it was blocked
from the agent because reflog expiry is irreversible:

```bash
git reflog expire --expire=now --all && git gc --prune=now
```

### 12.6 [x] Vendor Font Awesome locally — the last CDN dependency — done, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#126-x-vendor-font-awesome-locally--the-last-cdn-dependency--done-closed-2026-09-30).

### 12.7 [x] [CLOSED — measured, do not reopen] ~89 separate module requests on first load

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#127-x-closed-measured-do-not-reopen-89-separate-module-requests-on-first-load); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 12.8 [x] `tests/e2e/` vs `tests/unit/` is a browser split, not a UI split — resolved by `tests/unit_js/`

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#128-x-testse2e-vs-testsunit-is-a-browser-split-not-a-ui-split-resolved-by-testsunit_js); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 13. Exercise Library & Movement Taxonomy

**CLOSED — fully shipped.** See [CHANGELOG.md](CHANGELOG.md) and
[UC6](use_cases/uc6_exercise_taxonomy_and_picker.md).

### 13.1 [x] Repurposed `exercisesView` into a Professional Movement Taxonomy — see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#131-x-repurposed-exercisesview-into-a-professional-movement-taxonomy-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 13.2 [x] Fast-selection flows over the taxonomy — see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#132-x-fast-selection-flows-over-the-taxonomy-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 13.3 [x] Conditioning metrics (modality axis) — see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#133-x-conditioning-metrics-modality-axis-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 14. Refactoring: DRY & Complexity Reduction

> Superseded in scope by **§24**, which re-audited `src/` on 2026-08-07. Only §14.5's i18n half is
> still open; the rest shipped, see CHANGELOG.

### 14.5 [~] Split the monolithic shared files to avoid same-file co-edit conflicts

**`index.css` and `index.html` shipped 2026-07-27**: both are shells, and every view, dialog and the
header renders its own markup with a co-located `.css`. **Still open**: `src/i18n/en.js`, `sl.js` and
`de.js` are flat single-object dictionaries (`en.js` is 1,393 lines), so every new string edits the same
three files. Consider per-feature string modules merged into the locale, keeping `test_i18n_parity`
green.

### 14.6 [x] Rename the `booking` domain term to `session` — shipped 2026-07-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#146-x-rename-the-booking-domain-term-to-session-shipped-2026-07-27); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 14.7 [x] Extract a shared `renderMarkupOnce()` helper — shipped 2026-08-01, see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#147-x-extract-a-shared-rendermarkuponce-helper-shipped-2026-08-01-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 14.8 [x] Render-order dependencies between modules are unenforced — shipped 2026-08-01, see CHANGELOG

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#148-x-render-order-dependencies-between-modules-are-unenforced-shipped-2026-08-01-see-changelog); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 14.9 [x] `activeSessionController.js` mixed markup templates into a behavior file — shipped 2026-08-01

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#149-x-activesessioncontrollerjs-mixed-markup-templates-into-a-behavior-file-shipped-2026-08-01); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 16. Deploy safety & schema-keyed storage

> **Multi-version hosting is DROPPED, not deferred** (§18's no-release-tags decision). One build carries
> every supported behaviour; storage keys on the data schema alone. Do not re-propose per-tag
> publishing, a `/preview/` channel, per-release storage buckets or rollback-by-URL.
>
> **What survives**: a deploy never interrupts a trainer mid-session (a service-worker concern); the
> build stamp is the commit SHA; the PREVIEW badge grows into severity tiers (§18.12); migration
> validates every step's output and refuses data from a newer build.
>
> **Two findings**: an ordering authority must be a total order (tags from the same second once offered
> a downgrade labelled "a new version is available"); changing a published build's bytes forces a
> service-worker re-install on everyone using it.

### 16.3 [x] [Resolved — superseded by §18.6] Key storage buckets on the DATA SCHEMA, not the release tag

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#163-x-resolved-superseded-by-186-key-storage-buckets-on-the-data-schema-not-the-release-tag); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 16.5 [x] Retire the multi-version hosting machinery from the code — done

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#165-x-retire-the-multi-version-hosting-machinery-from-the-code-done); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 16.6 [ ] One origin or two: the boundary around LibrePT's data is undecided

**Found 2026-09-28.** The app is at `https://stutek.github.io/LibrePT`
([publicUrls.js](src/data/publicUrls.js)). Browsers separate storage by origin (scheme, host, port), so
the path `/LibrePT` separates nothing: every page published on GitHub Pages under this account shares
LibrePT's IndexedDB, localStorage and cookies.

**Nothing is exposed today**: on 2026-09-28 `~/Projects/EnterprisePT` held documents only, with nothing
published.

**What a second page on the origin could do**: open the `librept` database and read clients, health
notes and history, which are stored unencrypted (§18.8), and use the non-extractable backup key to open
any backup file it obtains. It needs no bug in LibrePT: the same origin is a permission, not a defect,
and it covers pages not written yet. LibrePT's strict CSP ([index.html](src/index.html)) protects
LibrePT's page, not its data from a neighbour with a looser CSP. A commercial EnterprisePT with a
payment widget, analytics or a support chat would let each vendor read health data.

**Simon, 2026-09-28: sharing may be wanted.** One origin is the simplest way for EnterprisePT to extend
LibrePT for the same trainer. The defect is that today the sharing is accidental: nothing states it and
nothing checks it.

**The decision, waits on Simon:**

- **One origin, on purpose.** Everything published there is held to LibrePT's rules, with **no
  third-party script anywhere on it, ever**, and PRIVACY.md says so.
- **Two origins, one domain.** `librept.<domain>` and `enterprise.<domain>`; sharing becomes explicit
  (`postMessage`, or an exported file). GitHub Pages allows a custom domain per repository.

**Decide before launch.** Moving origin later empties the app for every trainer: IndexedDB does not
move, so each would export on the old address and import on the new one by hand. The move also changes
Google's allowed JavaScript origins ([GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md)) and
`PUBLIC_SITE_URL`. No test can hold this: LibrePT cannot see other pages on its origin. It blocks
nothing in the code, and it blocks the launch plan.

## 17. Structured session/program history (`sessionItemRecord`)

### 17.1 [~] Persist the whole structured program into history, via a generic typed item record

**Done**: the whole program snapshots as a flat typed array
([sessionItemRecord.js](src/domain/sessionItemRecord.js)); the snapshot carries `modality` and `metric`
(`buildExerciseSnapshotItem`); the routine builder authors each exercise's metric
([plansView.js](src/modules/plans/plansView.js)); a time or distance typed in the reps field reads
"S4 × 40s", not "S4 × R40s" (`3caf281`).

**Open, a design question for Simon:**

- Logging for `hiit` (rounds). It has no logging surface;
  [exerciseModality.js](src/domain/exerciseModality.js) reserves the value.
- Whether a movement with its own name, typed inline, is offered a measure (time, distance) at all.

**Dokaz iz dneva trenerja 05 (§88):** krog ob reki s petimi postajami (40 s dela, 20 s počitka, štirje
krogi) in intervali 6 × 400 m. Trenerka je čas in razdaljo vpisala v polje za ponovitve (»40s«,
»400m«). Vaji z lastnim imenom merilo (čas, razdalja) ni ponujeno.

### 17.2 [ ] Edit rules for a completed, dated session — immutable except three narrow cases
A completed dated session is an **immutable execution record**; anything forward-looking is
copy-to-a-new-session from a template, never an edit of the past. The only permitted mutations:

1. **Field-level correction** of mis-logged data, ideally stamped with an `edited` marker.
2. **Append-only annotation/feedback** at review — an append to the separate feedback layer, so it
   never touches the execution record.
3. **Anonymization** (§17.3) — never deletion.

### 17.3 [x] Erasure = anonymization only (never delete) — shipped 2026-08-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#173-x-erasure-anonymization-only-never-delete-shipped-2026-08-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 17.4 [x] Save a past session as a routine template (library fills itself from history) — shipped 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#174-x-save-a-past-session-as-a-routine-template-library-fills-itself-from-history--shipped-2026-09-30).

### 17.5 [~] Explicit item ordering — `position` on every session item

**Shipped** in [sessionItemOrder.js](src/data/sessionItemOrder.js); the rationale (dense, not gapped;
not a linked list) is in [DATA_MODEL](docs/DATA_MODEL.md). Writers stamp `position` at the one place
they all pass through.

**Still open**: `positionIssues()` is used at runtime only to renumber a cached session on load
([sessionCache.js](src/data/sessionCache.js)); nothing shows the trainer an integrity warning.
`activeExerciseIndex` still means an array index, which holds only while the live array stays in
position order. Step 4 — the store may stop guaranteeing list order — waits on §18.6's lazy loading.

## 18. Data layer: simultaneous multi-schema writes ("star writes")

> **The architectural change**: the data layer writes every record to all supported schema versions at
> once. Each schema gets one projection, computed from the live domain object, none feeding another (a
> star). The old migration was a chain (v1→v2→v3) whose loss compounded and whose steps were tested only
> against the previous step's output. There are no backward transforms: a downgrade is a projection
> already being written.
>
> **Decided: NO RELEASE TAGS.** One build carries old and new behaviour; switching is an in-app choice.
> Storage keys on the schema alone. Writing every live schema is still needed for a trainer on a
> previously cached service-worker build, and for backup portability.
>
> **The build order (DB → write layer → CD tests) is complete.** Open: §18.3's idle deferral, failure
> reporting and switch UI; §18.6's lazy per-client load; §18.8's WebAuthn unlock and desktop file
> handle; §18.9 (Simon to close or keep); §18.12's ribbon tiers.

### 18.1 [x] [Decided in principle] The star write model, and its relationship to §16.3

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#181-x-decided-in-principle-the-star-write-model-and-its-relationship-to-163); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.2 [x] [Decided, CLOSED] Identity: lineage IDs, no ID-mapping table

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#182-x-decided-closed-identity-lineage-ids-no-id-mapping-table); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.3 [~] [Decided] Migration is pre-emptive, resumable, and runs through the normal write layer

**Shipped 2026-08-07** — [readSchema.js](src/data/readSchema.js), see [CHANGELOG](CHANGELOG.md). It relies on
one transaction; revisit near ~50k records, when that becomes a stall worth splitting. The design for
that day:

- **Pre-emptive**: a switch is instant, with no staleness window. Catch-up re-derives; it does not
  restore a point in time (which is also why §18.7 rejected a snapshot tier).
- **Yields to user writes**: migration stops on any interaction write and resumes when the burst ends.
- **Ordinary use speeds it up**: a star write to an unmigrated record fills the new bucket and marks it
  migrated.
- **The invariant**: migration is `read old record → build domain object → normal star write` — the
  write layer itself, never a second transform.
- **A partly migrated bucket is not readable.** Completeness is a set difference over ids,
  `keys(source) \ keys(target) = ∅`, never a count comparison: containment, not equality, and it names
  the missing ids.

**Still open**: run the backfill when idle or charging, not mid-session; report a failed background
backfill by withholding the switch offer, never by raising an error; and any UI for the switch —
`setReadSchema` and `upgradableSchemas` exist, and nothing outside `readSchema.js` calls them.

### 18.4 [x] [Decided — staging, not envelopes] The lossy-projection problem

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#184-x-decided-staging-not-envelopes-the-lossy-projection-problem); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.5 [x] [Decided] Ordering is topological, not chronological

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#185-x-decided-ordering-is-topological-not-chronological); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.6 [~] [Decided] Persistence engine → IndexedDB (supersedes the §3.7 deferral)

**Engine shipped 2026-08-02**; [CHANGELOG](CHANGELOG.md) carries the choice and the single-database
layout that decided it.

**Still open — lazy per-client loading, deliberately not done.** The read model stays synchronous so
~115 `state.<collection>.push(...)` call sites need no change; making them async per-client fetches is
separate, larger work. The index it needs (`CLIENT_COLLECTION_INDEX`) exists.

**Sizing** (measured 2026-07-26 against the real §17.1 record shape, ~6.0 KB per session):

|                                   | sessions/yr | 1 bucket | ×2      | ×3          |
| --------------------------------- | ----------- | -------- | ------- | ----------- |
| Busy PT (7/day, 5.5 d/wk)         | 1,809       | 10.5 MiB | 21 MiB  | 31 MiB      |
| **Very busy PT (10/day, 6 d/wk)** | 2,880       | 16.6 MiB | 33 MiB  | **50 MiB**  |
| Studio ceiling (14/day)           | 4,200       | 24.3 MiB | 49 MiB  | 73 MiB      |
| Very busy PT, 5 yrs (no deletes)  | 14,400      | 83 MiB   | 166 MiB | **250 MiB** |

Quotas are far above this table; eviction is the constraint, not size. The risks are Safari's 7-day cap
on script-writable storage for sites not installed to the home screen, quota-pressure eviction on
Android, and private-browsing quotas. The recovery for all three is the backup file (§18.7).

### 18.7 [x] [Decided] Backups: 1× not N×, readers forever, writers never — every part shipped, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#187-x-decided-backups-1-not-n-readers-forever-writers-never--every-part-shipped-closed-2026-09-30).

### 18.8 [ ] [Open] Encryption, device theft, and storage durability

- **The live IndexedDB is not encrypted by the app**; it relies on the operating system. A locked phone
  with a passcode is well protected (iOS Data Protection, Android FBE); a laptop without full-disk
  encryption is not. Same-origin scripts, extensions with host permissions and anyone holding the
  unlocked device read plaintext. Encrypting the live store is refused: a forgotten password would
  destroy a solo trainer's records, a larger risk than theft.
- **Desktop is its own threat model** (Simon, 2026-07-26): disk encryption is often off, extensions are
  common, the device is shared more often.
- **[x] Backups are encrypted — shipped 2026-09-28** (see [CHANGELOG.md](CHANGELOG.md)). Format version 6
  whose `BACKUP_FORMATS` row names schema 5, not a new schema 6, which would have doubled every write.
  Drive sync does not run without the password. The key is derived from six words the trainer keeps;
  the device keeps only a non-extractable derived key. This also closed §81.6.
- **[x] Storage-durability warning** (checked 2026-09-30):
  [storageDurability.js](src/data/storageDurability.js) asks for persistent storage and measures the
  quota; [backupHealthController.js](src/controllers/backupHealthController.js) passes the result to the
  backup badge. It detects the consequence, not private-browsing mode.

**Still open:**

- [ ] **Unlock with fingerprint or face through the WebAuthn `prf` extension.** Plain WebAuthn returns a
  signature, never key material; `prf` derives a stable secret usable as an AES-GCM key (Chrome/Edge and
  Safari passkeys; support is not universal). Not built;
  [backupKeyStore.js](src/data/backupKeyStore.js) names it as the second way to reach the key.
- [ ] **Desktop File System Access handle**: save backups to a file the trainer chooses and keep the
  handle for repeat exports. Not built.

### 18.9 [ ] [Decided] Concurrency: transactions plus CAS, not app-level locks

IndexedDB transactions give atomicity and cross-tab serialisation for the fan-out (single-database
layout, §18.6), so no app-level lock is needed for it. The residual was read → compute → write across a
non-IDB `await`, which closes the transaction, so two tabs could interleave. The decided fix was
compare-and-swap: a version counter per record, a write conditional on it, retry on mismatch; plus
`navigator.locks` around the migration pass, for efficiency only.

**Presoja 2026-09-30 (Claude): ostanka, ki ga ta razdelek rešuje, ni več.** §80.40 (`4b17230`) dovoli
pisati le enemu zavihku ([tabOwnership.js](src/data/tabOwnership.js)): zavihek, ki se zažene pozneje,
prevzame pisanje, drugi nehajo shranjevati in to povedo. Z enim piscem ni prepletanja, ki bi ga CAS
zaznal, zato ga ne gradim. **Čaka na Simona:** razdelek zapreti, ali ga ohraniti za dan, ko bo hkrati
pisalo več naprav (sinhronizacija).

### 18.10 [x] [RESOLVED — one build] Deep links, and one build vs. many builds

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1810-x-resolved-one-build-deep-links-and-one-build-vs-many-builds); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.11 [x] Legal gaps this design creates — every gap answered, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1811-x-legal-gaps-this-design-creates--every-gap-answered-closed-2026-09-30).

### 18.12 [ ] [Decided] Reuse the preview badge for unsupported-version warning
Generalise `#preview-badge` into a **build-status ribbon with severity tiers**: `PREVIEW` (amber,
informational) → `DEGRADED` → `BETA` (real data on unstable code) → `UNSUPPORTED` (red,
non-dismissable). `BETA` keeps its slot even with no beta channel: an in-app behaviour opt-in is the
same promise and needs the same signal.

- **`DEGRADED` is the downgrade tier** (§18.4): the app is older than the schema its data was authored
  in, so records display wrong and — the part that matters — **anything logged here may be recorded
  lossily**. Say that plainly rather than implying a read-only display quirk.
- **The ribbon must not be the only signal.** Persistent chrome goes invisible within days, which is
  what makes an always-on amber pill safe today and an unsupported-version warning useless tomorrow.
  Pair it with a non-dismissable notification-area message.
- **Never block mid-session.** The ribbon carries severity continuously, but any *blocking* prompt is
  gated on there being no active session — a red warning plus a modal is maximally alarming exactly
  when a PT has a client in front of them.
- Keep the existing `prefers-reduced-motion` handling; a red flashing element is an accessibility
  problem in a way an amber pulse is not.

### 18.13 [x] CD pipeline tests for the star-write layer — shipped

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1813-x-cd-pipeline-tests-for-the-star-write-layer-shipped); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.14 [x] One numbering axis, and a disposable preview schema — shipped 2026-08-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1814-x-one-numbering-axis-and-a-disposable-preview-schema-shipped-2026-08-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 18.15 [x] A hard reload can outrun a queued write — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1815-x-a-hard-reload-can-outrun-a-queued-write--archived-2026-09-30).

### 18.16 [x] Local runs stopped disagreeing with CI about what time it is — 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#1816-x-local-runs-stopped-disagreeing-with-ci-about-what-time-it-is-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 19. Deep-linkable app state

**The rule agreed for scope: anything a page reload would change belongs in the URL.** Design,
invariants and the "how to add a route" checklist live in **[docs/ROUTING.md](docs/ROUTING.md)**; the
catalogue of the URLs themselves is [UC5 §4](use_cases/uc5_session_day_deck_and_deep_links.md).

### 19.2 Blocked on the URL-privacy question
Both would mint **new** URLs carrying a client id. `/clients/{id}` and
`/session/{id}/client/{cid}/…` already do, so this is a question of degree, not a new exposure — but
it is unresolved, so these are parked rather than shipped.

- [ ] **Client dialogs** — `/clients/new`, `/clients/{clientId}/edit`.
- [ ] **Workout-setup preselection** — `openEditSessionControlModal` takes four identifiers but the URL
      carries only the session id, so "Plan Program" from a client and "Start Group Session" from a
      routine lose their preselection *and* the planning-mode flag on reload. Would need
      `/session/plan/client/{clientId}` and `/session/new/routine/{routineId}`.

**The question to settle**: whether to commit to an ids-and-enums-only invariant enforced by a test
(no names, emails or free text in a path), and whether client-detail navigation should `replaceState`
so repeated browsing does not accumulate a who-was-viewed list in history. Client records are GDPR
Art. 9 health data ([PRIVACY.md](PRIVACY.md)); the mitigating facts are that ids are opaque and the
database is device-local, so a copied id dereferences to nothing elsewhere.

### 19.3 Undecided — decide per use case

- [ ] **Filter and search state.** Enumerated chips (muscle, equipment, category) are a closed,
      non-personal vocabulary and could be path segments; **free-text search must not be**, because a
      typed client name would land in history, screenshots and shared links.
- [ ] **Transient chrome** — the ☰ menu, the session ⋮ menu, the notification drawer, a drag in
      progress. A reload closes them, which is arguably correct; a URL that reopens a menu adds a history
      entry and conflicts with the outside-click handlers. Recorded so the decision is explicit.
- [ ] **`#dialog-add-session-exercise` is unreachable UI.** Its only button sits in a
      `display: none !important` container, and the clipboard editor receives `openAddExercise` without
      calling it ([routeTable.js](src/controllers/routes/routeTable.js)). Decide: restore the button, or
      delete the dialog, the button and the opener.
- [ ] **Session sub-state that already survives through the cache** — `expandedPastId`,
      `circuitRounds`. A URL would only make them shareable, a weaker argument. Pinned by tests, not
      routed.

## 20. [x] Test tiers: the clipboard, and the `activeSession` contract — COMPLETE

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#20-x-test-tiers-the-clipboard-and-the-activesession-contract-complete); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 20b. [x] Backlog sweep — 2026-08-06 — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#20b-x-backlog-sweep--2026-08-06--superseded-2026-09-30).

## 21. [x] `Page.goto` stalls against the local dev server — ROOT-CAUSED AND FIXED

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#21-x-pagegoto-stalls-against-the-local-dev-server-root-caused-and-fixed); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 22. [x] Two `src` defects found while testing — FIXED

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#22-x-two-src-defects-found-while-testing-fixed); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 23. [Brainstorm] Go-to-market — audiences, channels, and what blocks a launch

Captured 2026-08-06. Nothing here is decided; the point is that promotion is sequenced work with
prerequisites, not a post written on a whim. **The governing fact is
[docs/PREVIEW.md](docs/PREVIEW.md)**: the app tells its own users it can wipe their data. A successful
trainer-facing launch in that state is the worst available outcome — one first impression per person,
spent on a build that will lose their clients' records.

### 23.1 [ ] [Decide] What "winning" means, before any channel is chosen
Every downstream choice hangs on this and it is unresolved. The candidates pull in different
directions: **users** (a roster to learn from), **contributors** (a project surviving one maintainer),
**credibility** (a portfolio artefact), or **a future paid tier** (hosted sync, which reintroduces the
data-processor exposure §1.5 deliberately avoids). Pick one as primary — optimising for all four picks
none.

### 23.2 [ ] Two motions, sequenced — dev audience now, trainers only after PREVIEW comes off
- **Now**: developers expect pre-release software and are not harmed by it. r/selfhosted (angle: no
  backend, no account, data never leaves the browser), r/opensource, r/webdev, r/PWA. **Show HN is a
  one-shot** and should be spent only once §23.5's recording exists. Durable placements step any
  single post: a PR to **awesome-selfhosted**, an **AlternativeTo** listing against Trainerize /
  TrueCoach / My PT Hub / PT Distinction, and **F-Droid** if §9.6 ever lands. Product Hunt is largely
  vanity.
- **Also now, higher value**: recruit 5–15 trainers **as design partners, not users**, by hand. Ten
  trainers who reply are worth more than a thousand stars.
- **Later**: the real trainer-facing launch, only once the PREVIEW badge is gone and sync works.

### 23.3 [ ] Channel ranking for the trainer audience — Reddit is not the top of it
The PT subs skew toward *aspiring* and newly-certified trainers; the person who needs a gym-floor
clipboard has a full roster and is on their feet all day. r/personaltraining is worth entering
eventually, but **via months of helpful comments in the recurring "what software do you use" threads,
never a launch post** — those get removed. Higher-density channels, best first:

1. **Gyms and studios, in person.** One manager reaches 5–20 trainers at once — the best conversion
   per conversation available, and the shipped SL translation makes Slovenia the natural first market.
2. **Facebook groups** — national/local PT groups, online-coaching groups, certification alumni. Where
   working trainers actually ask the software question.
3. **Certification bodies and federations** — EREPS, NASM/ACE/ISSA alumni, Fitnes zveza Slovenije. One
   newsletter mention outreaches any forum post.
4. **PT education providers.** Students cannot afford subscription SaaS; a curriculum yields a cohort
   every year.
5. **Instagram / short-form video** — the profession's own platform. Not a link drop: 15 seconds of
   one-handed set logging, native to both the format and the audience.
6. **LinkedIn** — reaches the gym-owner tier, i.e. the buyers for (1).

### 23.4 [ ] Positioning — "open source" is the proof, not the pitch
Trainers do not buy licences. The claims that land, each already true: **free, no subscription** (the
entire competitive set is $20–100/month); **no signup, no account**; **works with no signal** (basement
gyms kill every cloud app); **client data never leaves your phone** (EU trainers legally hold health
data, so this is a compliance answer, not a mood). And **narrow the wedge**: do not pitch "replace your
PT software" — switching costs are brutal and they already have a system. Pitch the **clipboard**, the
one job they all hate, and expand from there.

### 23.5 [ ] Launch prerequisites — these block promotion more than channel choice does

**Done**: a scripted demo that drives the real controls (`?init=demo_data_load&demo=gym_floor`, held by
[tests/e2e/test_demo_tour.py](tests/e2e/test_demo_tour.py)), chosen over a recording because a video
goes out of date without anyone noticing; a video made from the same script by
[demo_recording.py](agent_tools/demo_recording.py), which refuses to write a file when the tour fails
(check the footage by eye, not by exit code); the landing page ([docs/LANDING.md](docs/LANDING.md) →
`src/landing.html`, 2026-08-16); onboarding for an empty app (§9.5, 2026-08-17); a feedback route that
needs no GitHub account (2026-08-22, [docs/BUG_REPORTING.md](docs/BUG_REPORTING.md)).

**Still open:**

- [ ] **Share only the demo deep-link, never the bare URL.** `?init=demo_data_load&lang=…&theme=…` takes
      a visitor from a comment to a working clipboard in three seconds, with no email gate.
- [ ] **Drive sync can be promised only with its limit.** The OAuth app is *In production, unverified*
      ([GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md)): up to 100 users, with Google's
      unverified-app warning, until Google verifies it (§1.5). Google Calendar is no longer claimed
      (README, §68.3).

### 23.6 [ ] Campaign plan — kept private, not in this repo

The Slovenia-first campaign (target list, outreach scripts, timing, named gyms and contacts) lives
outside version control at `.private/go-to-market-campaign.md`, because it names people and drafts
outreach copy. §23.1–§23.5 stay public. To act on the campaign, read the private file; to change the
strategy, update both.

**The one recorded deadline has passed.** The sport-science faculty was reachable only from late August
to mid-September; on 2026-09-30 that window was closed. Unless contact was made (see the private file),
that channel moves to the next semester.

## 24. Single-responsibility & module-boundary reorganisation

Audit of `src/` on **2026-08-07** (25,508 lines, 100 modules): five oversized modules and four boundary
defects, not a rewrite. Stages 1, 2, 3, 4, 6 and 8's module headers are done; open halves remain in
§24.4d, §24.5, §24.7 and §24.8, all low priority.

Findings that still apply:

- **A gate refusing an import can mean the callee is in the wrong layer.** Check the layering before
  copying code; `import_layers.py` cannot see a copy.
- **Extract what becomes testable or shared, not what only makes a file shorter.**
- **Logic that depends on the time of day is tested in `unit_js/`, where the clock is an argument.** A
  demo seed limited to hours 03..17 hid an end-date bug from e2e until after 18:00.

### 24.1 [x] Stage 1 — one theme system, not two — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#241-x-stage-1-one-theme-system-not-two-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.2 [x] Stage 2 — two `formatDuration`, two `escapeHTML` — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#242-x-stage-2-two-formatduration-two-escapehtml-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.3 [x] Stage 3 — the board render leaves `controllers/` — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#243-x-stage-3-the-board-render-leaves-controllers-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.4 [x] Stage 4 — split the rest of `activeSessionController.js` — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#244-x-stage-4-split-the-rest-of-activesessioncontrollerjs-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.4d [ ] Follow-up: one movement → plan item mapping

The projection "catalog movement → plan item fields" was written in four places. They agree on the
fields but not on `exerciseId`: only the inject/swap pair sets it, which is why
`resolveCurrentMovementId` needs a name-based fallback for older plans. One `planItemFromCatalogEntry()`
would let the routine path carry `exerciseId` and retire the fallback, but it changes what the catalog
picker excludes for routine-authored slots: a behaviour change for its own commit.

**Dve kopiji odpravljeni 2026-09-29 (`7abeb08`, §89):** demo tabla gradi načrt z
`buildClientStateFromRoutine`, prazna nova vaja pa nastane le v `blankExercise`. **Še odprto:**
`exerciseId` na poti iz rutine, zgoraj opisana sprememba vedenja.

### 24.5 [~] Stage 5 — `clipboardEditor.js`'s 710-line function

`renderClipboardEditor()` holds a template layer, the wiring closures, a drag reorder engine and circuit
normalisation in one scope. [clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) is 917 lines
at `HEAD` on 2026-09-30 (808 after the audit).

- **`domain/circuitGrouping.js` — shipped 2026-08-07**, see [CHANGELOG](CHANGELOG.md).
- [ ] **`clipboardEditorMarkup.js`** — pure `(item, ctx) → HTML` row/circuit/insert-bar builders.
- [ ] **`listReorder.js`** — a generic tap-nudge/drag reorder engine, not editor-specific.

### 24.6 [x] Stage 6 — `src/domain/`, a layer for what is neither storage nor UI — shipped 2026-08-07

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#246-x-stage-6-srcdomain-a-layer-for-what-is-neither-storage-nor-ui-shipped-2026-08-07); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 24.7 [~] Stage 7 — three more multi-responsibility modules

- [ ] **`applicationHeader.js`** (772 lines at `HEAD` on 2026-09-30; 512 at the audit) → header shell +
      menu, once `renderSyncBadge` moves beside `driveSyncUi.js` and the about/terms dialogs move to a
      `legalDialogs.js`.
- **`editSessionControl.js`**: the commit half shipped 2026-08-07 (`domain/sessionRecord.js`), pinning two
  rules: the upsert MERGES (a whole replace would un-complete a session when its title is edited), and
  invites go only to newly assigned participants. **Still open**: the draft-persistence and
  form-population halves.
- **`notificationArea.js`**: the derivation half shipped 2026-08-07 (`domain/notificationItems.js`).
  **Still open**: a `notificationReadState.js` (the UI module still imports `storageNamespace`
  directly) and the gesture block.

### 24.8 [~] Stage 8 — names that match what the tree holds

- [ ] **The directory rename, optional.** Three session directories, none named for its stage:
      `modules/session/` (setup, edit, dialogs), `modules/sessionList/` (dashboard), `modules/clipboard/`
      (the live run; "clipboard" is domain slang). Rename to `sessionPlanning/` / `sessionDashboard/` /
      `sessionLive/` in ONE mechanical commit. `session/sessionTitleBar.js` renders the live overlay's
      title and belongs with it. `session/sessionBar.js` was filed against `sessionList/`, but is now also
      imported by `app.js`, `appBoot.js` and three controllers; check before moving it.
- **Module headers — shipped 2026-08-07**, gated by
  [agent_tools/module_headers.py](agent_tools/module_headers.py).

Size alone is not a defect: `src/index.css`, `src/data/exercises.js` and the i18n dictionaries are left
alone.

## 25. [x] Layout overflow: assert geometry, not just semantics

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#25-x-layout-overflow-assert-geometry-not-just-semantics); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 26. [Brainstorm] Client self-onboarding — an intake page the client fills on their own phone

The trainer hands over a QR or a link; the client enters their own details and consent on their own
phone; the record comes back for the trainer to review and save. There is no backend, so the return
path is the design problem, not the form.

**Done** (see [CHANGELOG.md](CHANGELOG.md) and [UC8](use_cases/uc8_client_self_onboarding.md)): the
`/intake` route with its own boot that writes nothing (`bootIntake` in [appBoot.js](src/appBoot.js)); the
signup file and its share/save delivery (§1.7); the trainer's review dialog (§26.5); a pre-addressed mail
after saving; the trainer's contact and a vCard on the intake page; the invitation drawn as a QR on the
trainer's screen. What is left is below.

### [x] 26.1 One app, one route — not a second PWA — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-261-one-app-one-route--not-a-second-pwa--archived-2026-09-30).

### 26.2 [Superseded 2026-08-17] The payload, and why it lives in the fragment

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#262-superseded-2026-08-17-the-payload-and-why-it-lives-in-the-fragment); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 26.3 Return path — share first, mail/SMS second, QR third

Steps 1 and 2 are built: the share sheet, and after saving, a pre-addressed `mailto:` when the link
named the trainer ([intakeView.js](src/modules/intake/intakeView.js), 2026-09-11). The intake page also
shows the trainer's contact and builds a vCard on the client's device
([intakeSender.js](src/domain/intakeSender.js), [trainerVcard.js](src/data/trainerVcard.js)).

**Open — step 3, the code on the CLIENT's screen (the rest of Phase 2).** The client's phone shows the
submission as a QR; the trainer's own camera app decodes it and opens LibrePT, landing on the same
review dialog (§26.5). It needs an encoder on the client side only: no `getUserMedia`, no
`BarcodeDetector` (absent on iOS Safari), no camera permission. The vendored encoder
([vendor/qrcode.js](src/vendor/qrcode.js)) already draws the trainer's code. ~250–400 characters is QR
version ~10–13, which scans off a phone screen at arm's length. It is the only return path with no
network and no messaging app.

- **Open question:** a QR carries a URL, and §1.7 ruled that goals and injuries never travel in a URL.
  Decide what the code carries.
- **Deferred** until the messaging handover has been tried in a gym.

### [x] 26.4 The trainer's own QR has to be drawn, not printed — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-264-the-trainers-own-qr-has-to-be-drawn-not-printed--archived-2026-09-30).

### 26.5 [x] Import is a review, never an auto-save — 2026-08-17

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#265-x-import-is-a-review-never-an-auto-save-2026-08-17); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 26.6 Consent is the actual prize, and it does not overturn §3.5

Paper stays the evidence — the 2026-07-22 decision holds. A client ticking the box on their own device
gives a better record: the date is theirs, the language is the one they read
([src/i18n/consent/](src/i18n/consent/) has `en`, `sl` and `de`), and `CONSENT_FORM_VERSION` is stamped
when they were shown that version, not at save time.

**Open**: does a checkbox on the client's own phone count as retained evidence, or only as a
better-attested claim about the paper? [PRIVACY_FOR_TRAINERS.md](docs/PRIVACY_FOR_TRAINERS.md) needs a
paragraph either way and has none (checked 2026-09-30). This is the first surface a client reads alone,
so check that the translation gap §3.5 once named is closed.

### [x] 26.7 Phasing — merged 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-267-phasing--merged-2026-09-30).

### 26.8 Known gaps

- **First load needs network.** The client's phone has never cached the app, and a basement gym may
  have no signal. Either a printed fallback, or intake happens at the desk, not on the floor.
- **The submission has no authenticity, deliberately.** Signing needs a key exchange, which needs a
  server. The review dialog (§26.5) is the mitigation; the stakes are one reviewable record.
- **No photo or avatar.** Out of scope; initials are derived as in [clients.js](src/data/clients.js).

## 27. [x] Data-subject rights the app documents but cannot perform — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#27-x-data-subject-rights-the-app-documents-but-cannot-perform--archived-2026-09-30).

## 28. Reported 2026-08-18 — bugs and changes, unverified

Reported by the maintainer on 2026-08-18. Everything except §28.2 shipped the same day.

### 28.1 [x] Comments and docstrings must name a constant, not repeat its value — 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#281-x-comments-and-docstrings-must-name-a-constant-not-repeat-its-value-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.2 [~] Documentation is BUILT, with values injected

**Wanted 2026-08-18 (Simon):** documents carry placeholders, and values are injected at build time from
the declarations the app reads, as `src/landing.html` already is
([render_docs.py](agent_tools/render_docs.py)).

**Shipped 2026-08-18**: `render_docs.py` resolves `{{PUBLIC_SITE_URL}}`, `{{ISSUE_TRACKER_URL}}` and
`{{DEV_SERVER_URL}}` by reading the JS declaration directly, and all eight generated pages use
placeholders.

**Open, the maintainer's call**: whether `README.md`, `CONTRIBUTING.md` and
`docs/GOOGLE_CLOUD_SETUP.md` get built. GitHub shows them raw, so a placeholder would appear as
`{{PUBLIC_SITE_URL}}`; building them means generating the repository's front page from a source file,
which changes how everyone edits it. Until decided, their addresses stay written out and
`constant_copies` lists them.

### 28.3 [x] A declared constant must appear in exactly one place — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#283-x-a-declared-constant-must-appear-in-exactly-one-place-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.4 [x] BUG — a collapsed deck card's first line is unreadable — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#284-x-bug-a-collapsed-deck-cards-first-line-is-unreadable-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.5 [x] BUG — backup warnings appear in DEMO mode — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#285-x-bug-backup-warnings-appear-in-demo-mode-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.6 [x] BUG — loading demo data increments the ahead counter — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#286-x-bug-loading-demo-data-increments-the-ahead-counter-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.7 [x] BUG — the header menu does not work while the messages pane is expanded — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#287-x-bug-the-header-menu-does-not-work-while-the-messages-pane-is-expanded-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.8 [x] BUG — the disabled-backup strikethrough is not visible enough — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#288-x-bug-the-disabled-backup-strikethrough-is-not-visible-enough-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.9 [x] CHANGE — a DEMO tag replaces the PREVIEW tag in demo mode — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#289-x-change-a-demo-tag-replaces-the-preview-tag-in-demo-mode-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.10 [x] CHANGE — cancellations and bookings accumulate in one message card — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2810-x-change-cancellations-and-bookings-accumulate-in-one-message-card-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.11 [x] BUG — a cleared browser boots to a splash with no demo or animation offer — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2811-x-bug-a-cleared-browser-boots-to-a-splash-with-no-demo-or-animation-offer-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.12 [x] CHANGE — the guided walkthrough wants a glow, instructions and a real hand — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2812-x-change-the-guided-walkthrough-wants-a-glow-instructions-and-a-real-hand-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.13 [x] BUG — a walkthrough reloaded by deep link points at the wrong element — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2813-x-bug-a-walkthrough-reloaded-by-deep-link-points-at-the-wrong-element-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.14 [x] CHANGE — the demo-mode message offers to start the walkthrough — shipped 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2814-x-change-the-demo-mode-message-offers-to-start-the-walkthrough-shipped-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 28.15 [x] BUG — the walkthrough panel covers the control it points at — fixed 2026-08-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#2815-x-bug-the-walkthrough-panel-covers-the-control-it-points-at-fixed-2026-08-18); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 29. Easy program import — the trainer writes the plan in an external tool

**Wanted 2026-08-18 (Simon):** a trainer who plans outside LibrePT (an LLM, a spreadsheet, a PDF, a
colleague's plan) imports it instead of retyping it. **Shipped 2026-08-23** (`af17b0b`,
[UC9](use_cases/uc9_program_import.md),
[programImportDialog.js](src/modules/plans/programImportDialog.js)). What is still open is in §29.5.

### [x] 29.1 Decided 2026-08-18 (Simon) — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-291-decided-2026-08-18-simon--archived-2026-09-30).

### [x] 29.2 Why the editor-as-review makes ingestion robust — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-292-why-the-editor-as-review-makes-ingestion-robust--archived-2026-09-30).

### [x] 29.3 Built so far (2026-08-18) — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-293-built-so-far-2026-08-18--archived-2026-09-30).

### 29.5 Shipped 2026-08-23

The surface shipped with everything §29.1 decided (`af17b0b`). Deviations from §29.1: the template is
shown in the box, not downloaded; a file and a paste share one path; an import with no named session
opens a PLANNING session; `startWorkoutSession` takes a `plan` option instead of a second way to build a
session.

**Still open**:

- [ ] The CUSTOM tag in the live DECK. Today it shows only in the editor (`customBadge` in
  [clipboardEditor.js](src/modules/clipboard/clipboardEditor.js)).
- A paste that fails in real use joins the frozen corpus in
  [tests/fixtures/programs/](tests/fixtures/programs/).

### [x] 29.4 What is already in the repository, and should be copied rather than invented — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-294-what-is-already-in-the-repository-and-should-be-copied-rather-than-invented--archived-2026-09-30).

## 30. Reported 2026-08-18 (evening) — demo and feed polish

### 30.1 [x] BUG — loading demo data from the message button freezes the app for a while — closed 2026-09-11, not reproducible

Closed — the measurement is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#301-x-bug-loading-demo-data-from-the-message-button-freezes-the-app-for-a-while-closed-2026-09-11-not-reproducible).

### 30.5 [x] BUG — Show me did nothing on a card, and a second caption sat on the panel — fixed 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#305-x-bug-show-me-did-nothing-on-a-card-and-a-second-caption-sat-on-the-panel-fixed-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 30.4 [x] BUG — the guide asked for a screen the trainer was already past — fixed 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#304-x-bug-the-guide-asked-for-a-screen-the-trainer-was-already-past-fixed-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 30.3 [x] BUG — a cleared browser plays the demo to an empty room — fixed 2026-08-22

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#303-x-bug-a-cleared-browser-plays-the-demo-to-an-empty-room-fixed-2026-08-22); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 30.2 [ ] CHANGE — the demo should end with a thank you and two ways onward

**Wanted 2026-08-18:** when the walkthrough ends it says thank you and offers two ways on: play around,
or clear the demo data. Today its last caption is `walkthrough_finished` ("That's the whole loop…",
[walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js)), and it leaves the trainer in the live
clipboard — deliberately, as [test_walkthrough.py](tests/e2e/test_walkthrough.py) pins.

Reuse both ways on: the feed's demo card already opens the cleanup dialog, and "play around" is
dismissing the panel. `?demo=story` already ends this way, on its own narration card (2026-08-21).

**Open**: where the walkthrough says it — a final step with no control to tap, or a card in the feed.
That decides whether the guide can be left before reading it. The story's card does not carry over:
the walkthrough's steps are the trainer's own taps, with no card between them. Since the sandbox
(`f562c37`), check whether "clear the demo data" now means leaving the sandbox.

## 31. [x] A support data-wipe link — shipped 2026-08-23

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#31-x-a-support-data-wipe-link-shipped-2026-08-23); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 32. Application log storage — a seven-day sliding window

**Wanted 2026-08-19 (Simon)**, deferred to its own session: application logs kept in storage, in schema
**P and 5**, as a sliding window of the last seven days.

**Why it is not small.** Schema 5 is the stable schema since `19ea11c`, so a new collection there changes
a released schema: a projection per live schema, backup-file consequences and the staging rule of §18.4
([docs/DATA_MODEL.md](docs/DATA_MODEL.md) §4). Logs would also be the first collection whose retention
depends on time, not on the trainer.

**Settle first:**

- **What a log entry is.** §12.4 keeps crashes in an in-memory ring buffer and never stores them. The
  same records, or a wider stream (navigation, sync attempts, writes)? That decides the volume and the
  eviction cost.
- **PII.** §12.4's crash payload is non-identifying by construction: a fixed field list, anything else
  dropped. Logs must follow the same rule from the first line, or client names reach the backup file,
  the Drive snapshot and any support bundle.
- **Who reads them and how they leave the device.** A log nobody retrieves costs storage for nothing;
  one that leaves automatically is an unannounced transfer ([PRIVACY.md](PRIVACY.md)). §31's support
  surfaces are the obvious place.
- **When the window slides**: on write, at boot or on a timer, and what stops a busy day from evicting
  the entries a support call is about.

## 33. [x] Code and tests still cite `TODO.md` 495 times — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#33-x-code-and-tests-still-cite-todomd-495-times--superseded-2026-09-30).

## 34. [x] Browser-suite cost: what an audit of test durations found — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#34-x-browser-suite-cost-what-an-audit-of-test-durations-found--archived-2026-09-30).

## 35. The demo STORY — a chaptered scenario, not a longer tour

**Shipped 2026-08-22:** the guided story plays in chapters (`?demo=story`, `?demo=story&chapter=…`),
from [storyTour.js](src/modules/demo/storyTour.js) and [domain/demoStory.js](src/domain/demoStory.js).
The chapter index and the chapter names are §73; the card-by-card review is §39. The short
`gym_floor` tour (§23.5) stays a separate thing: a stranger gets the short tour, someone already
interested gets the story.

What is still open from the original plan is in §35.3 and §35.4.

### [x] 35.1 Shape before content — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-351-shape-before-content--archived-2026-09-30).

### [x] 35.2 The events — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-352-the-events--archived-2026-09-30).

### 35.3 What the story needs that does not exist

a. [~] **Recurrence model** — shipped 2026-08-22 ([sessionSeries.js](src/domain/sessionSeries.js)).
   The rule is stored once, and an evening becomes a `sessions` row only when the trainer opens,
   moves, cancels, starts or edits it (§72). Deleting an evening cancels it. Editing the series,
   weekdays included, goes through `seriesWithEdit`.

   **[ ] Open: a past evening that was never opened counts as overdue for ever.** A derived evening
   is not a record, so nothing marks it finished, and the board shows it red with a growing
   "Overdue" for the week it looks back. The demo avoids it
   ([sessionSeriesSeed.js](src/data/sessionSeriesSeed.js) seeds the evenings already held as
   finished sessions); a real trainer's board does not. Two answers, neither ruled by Simon: stop
   the count at the end of that evening's day, or let the trainer dismiss a past evening like a
   message.

b.–f. [x] Shipped 2026-08-21/22: the net-vs-slot meter ([planDuration.js](src/domain/planDuration.js)),
   the in-session injury note kept on the client's record, the movement note that comes back when
   the movement is next planned ([gymNotes.js](src/domain/gymNotes.js)), the handover to the
   client's own page, and shared binding across participants (§8.1).

### 35.4 Build log

The build log of 2026-08-21/22 goes to the archive with the shipped parts of this section.

- [ ] **Event 18 — the session is completed, with net time shown against slot time.** The gym
      chapter still ends on the swap and its closing card (`gym-close` in
      [storyTour.js](src/modules/demo/storyTour.js)); no step completes the session.
- [x] The step the log said the story could not show — the trainer opening Ana's file — is now the
      `review` chapter: a drawn message screen whose attachment opens the real review dialog
      (`review-message`, `review-accept`).

## 36. [nice to have] Rename the `main` branch to `trunk`

**Wanted 2026-08-19 (Simon), explicitly a nice-to-have.** The repo is trunk-based by rule — no
feature branches, one releasable line — and the branch name is the last place that does not say so.
Cosmetic, so it waits for a quiet day rather than riding alongside feature work.

**Not destructive; history is untouched.** The cost is everything that NAMES the branch, and the
order is the whole risk:

1. `git branch -m main trunk`, push `trunk`, set its upstream.
2. **Switch the GitHub default branch to `trunk` BEFORE deleting `main`.** The default branch is what
   GitHub Pages deploys from; deleting `main` while it is still the default takes the live site down
   until someone notices.
3. Update `.github/workflows/deploy.yml`'s `branches: [main]` **in the same push**. This is the bad
   failure mode: miss it and the deploy simply stops firing — a green tree and no deploy, with
   nothing red to tell you.
4. Re-apply branch protection; rules do not follow a rename.
5. Sweep the prose mentions (`AGENT_RULES.md`, `CONTRIBUTING.md`, a few docs) BY HAND — `grep -w main`
   also matches `#main-content`.
6. Each existing clone: `git branch -m`, `git fetch`, `git branch -u origin/trunk`.

Everything above is reversible except the Pages outage step 2 exists to avoid.

---

## 37. The browser tiers are CPU-SATURATED, and the pipeline was under-reporting it

**Measured 2026-08-19:** the browser tiers keep the machine near 14 of 16 cores, so more workers do
not help (`tests/medium` at 4, 6 and 8 workers: 47.3s, 45.7s, 48.0s), and `--dist=worksteal` is
noise. Each stage prints the machine's CPU average from `/proc/stat`; the per-task figure misses
Chromium's processes. Since 2026-09-10 the runs are on the performance power mode: compare a timing
only with one measured on the same mode, and say which.

**Rejected:** one page shared by the tests of a file. State leaks between tests, the tests become
order-dependent, and under `--dist=load` it would not even save the loads.

**[ ] The one lever left: replace fixed sleeps with waits for what the test needs.** A sleep tuned
to one machine is a race on another, so each fix makes a test faster and more reliable. Counted
2026-09-30 (lines with `wait_for_timeout`): 185 in `tests/e2e/`, 99 in `tests/medium/` — up from 144
and 26 on 2026-08-19. Next: start with the files that hold the most.

## 38. [x] Reported 2026-08-25 — the demo's own entry points — fixed 2026-08-25

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#38-x-reported-2026-08-25-the-demos-own-entry-points-fixed-2026-08-25); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 38.23 [ ] WATCH — the ZAP stage failed once with a container-side write error

2026-08-30, one run out of ten that day. The log:

```
Unable to copy yaml file to /zap/wrk/zap.yaml [Errno 30] Read-only file system: '/zap/wrk/zap.yaml'
Failed to access summary file /home/zap/zap_out.json
Using the Automation Framework
```

…then exit 3 after 11s, against a usual 17-35s. An immediate re-run with no change passed cleanly.

**Not called flaky, because there is a readable hypothesis.** `zaproxy/zap-stable` is pulled rather
than pinned, and its newer builds drive the scan through the Automation Framework, which wants to
write a generated `zap.yaml` into `/zap/wrk` — the directory this gate mounts **read-only** on
purpose. If that is it, the failure is the image changing under us and will recur, at which point the
fix is either a writable scratch mount or a pinned image tag rather than a retry.

The machine was also at a load of 13.7 when it failed, so a slow start under contention is the other
candidate, and the two are not distinguishable from one log.

**Re-check condition:** the next time this stage fails, compare the log against the block above. Two
matches make it the image, and the tag gets pinned.

### 38.21 [ ] OPEN — the demo's card copy, waiting on the maintainer

**Said 2026-08-30 (Simon):** the demo's card texts are poor; edit the English together, then
translate. The proposals per card are in [docs/DEMO_CARD_COPY.md](docs/DEMO_CARD_COPY.md).

**Done 2026-09-25**, after three rounds with a trainer persona and a fix-all pass: every step that
asks for an action names the control; the closing card has its own text; no two cards share a
title; the message on Ana's phone is the invitation the app sends (`intakeInviteMessage`,
`361c58b`); the client list is *Imenik strank* / *Clients Directory* everywhere; every step fits a
390×844 phone in both languages (`test_every_card_fits_a_phone_without_scrolling`).

**[ ] Decision for Simon:** two chapter names he gave on 2026-09-21 (§73.8) disagree with their
cards. *Vnesi svoje podatke* tells the trainer to enter their details, while the card says they need
not; *Pregled zaznamkov in priprava treningov* promises a review of notes, while the chapter switches
the theme and moves Tuesday's session. The names were kept.

**[ ] Decision for Simon:** all three personas would stop at the English note-type button
(🔥 Joint Pain / Discomfort, §38.20), and one also at the English names of Tuesday's clients (Jane,
John, Sarah). The names are kept on purpose ([demoText.js](src/data/demoText.js)); Ana, Maja and Nik
are Slovenian already. Slovenian clients in a Slovenian demo would change the seed and every test
that names them.

**Re-check condition:** when Simon has time for the copy pass.

### 38.20 [~] IN PROGRESS — user-visible English that never reaches the translator

**Reported 2026-08-30 (Simon):** English text appears in the Slovenian app ("Cancel" in a dialog).

**Cause:** not missing translations — the dictionaries are in parity — but English written into
markup and code that never passes through `t`. Two related defects were fixed on the way:
`data-i18n` attributes that nothing applied (now applied by [domMappings.js](src/i18n/domMappings.js),
with `data-i18n-placeholder` and `data-i18n-label`), and dictionary keys that no code applied.

**Progress:** a ratchet ([agent_tools/ui_strings.py](agent_tools/ui_strings.py), Stage 1 + CI) counts
user-visible literals in markup. The count may not rise, and the baseline follows every fall: 332 on
2026-08-30, **98** on 2026-09-30. The ratchet cannot see sentences built in code (`alert`, `confirm`,
`textContent`); those are found by searching.

**Left bilingual on purpose:** "Menu / Meni" and "Switch Language / Zamenjaj jezik", so that someone
who cannot read the current language still finds the way to change it.

**[ ] Still English, known:**
- the erasure receipt and the email the Compose button writes to the client
  ([clientDataRights.js](src/modules/clients/clientDataRights.js)). The email is a wording decision, not
  only a translation: it goes to the client. (The confirmation word is translated: the Slovenian screen
  asks for »IZBRIŠI«, seen 2026-10-01 on `main` `6230070`.) The receipt is what the trainer must act on
  after an erasure: on a Slovenian screen it reads »Erased in the app as Client #I3W10R. The rest is
  yours — LibrePT cannot reach these: The gym calendar — …«;
- **waits on Simon:** the erased client's label »Client #I3W10R« is stored in the record and goes into
  sync and exports, so translating it is a data decision (may a stored label carry a language?). This
  question was left open in the archive when §80.101 closed, with no home here;
- the restore warning's list of what would be lost ("3 clients"), in
  [backupRestore.js](src/modules/common/backupRestore.js);
- screen-reader labels in `activeSessionOverlayView.js`, `applicationHeader.js` and
  `clientConsentSection.js`, whose visible text is translated already.

**[ ] Decisions for Simon:**
- the taxonomy values (Chest, Barbell, Hinge) in the exercise form and the library's filter chips:
  a label per value, while the stored value stays the English one the wger crosswalk (§13.1) reads;
- the five feedback choices ("Too Easy - Increase Load" and the others) are stored in English and
  shown again on the review screen, so translating them is one decision with their display;
- whether "Theme / Tema" in the ☰ menu was meant to be bilingual like its two neighbours.

**Re-check condition:** the ratchet becomes an ordinary gate when the count reaches the irreducible
set (a licence name, a word that is the same in every language), and this section closes then.
Before any release that offers Slovenian as supported rather than as a preview.

### 38.11 [x] GAP — muted text sits ON the AA bar on the light palettes — fixed 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3811-x-gap-muted-text-sits-on-the-aa-bar-on-the-light-palettes-fixed-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 39. Reported 2026-08-31 — the story walked card by card

Twenty observations from Simon's hand-walk of the story's 47 cards. His card numbers were the
guide's counter at the time; each item names the step id, which is what the work touches. An item
is reproduced only where it says so.

### 39.1 [x] BUG — the story told the viewer four things that were not true

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#391-x-bug-the-story-told-the-viewer-four-things-that-were-not-true); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.2 [x] BUG — crossing to Ana's phone lost the language

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#392-x-bug-crossing-to-anas-phone-lost-the-language); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.3 [x] BUG — the consent Ana ticked named Google Drive

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#393-x-bug-the-consent-ana-ticked-named-google-drive); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.4 [x] CHANGE — the invite dialog's two buttons — fixed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#394-x-change--the-invite-dialogs-two-buttons--fixed-2026-09-30).

### 39.5 [~] BUG — the register takes the same person twice

**Reported at card 8:** walking the demo again leaves several Nik Zupans in the register, and the
clipboard shows people by name, so two clients with one name cannot be told apart on the gym floor.
The defect is the app's, not only the demo's.

**Done 2026-09-30 (`e46267f`):** the alias shows wherever two namesakes sit side by side — the
picker, the session tabs, the invitation rows, the feedback form's title, the rest and exercise
timers, and "Copy this plan to…". The last four were found by walks of the published `0625bd6`.

**[ ] Open, waiting on Simon:** whether an alias becomes mandatory when a second client of the same
name is saved. §80.69 records the opposite pull: the alias field is always visible, and a first
visit does not need it.

### 39.6 [x] BUG — the clipboard says which session, and the chapter builds a programme

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#396-x-bug-the-clipboard-says-which-session-and-the-chapter-builds-a-programme); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.7 [ ] CHANGE — the demo's cards are still not one shape

**Reported at card 9:** *"first time I see drop down icon in top right (all cards should be uniform!),
x buttom appears only once collapsing a card"*, with *"demo cards should have a bacground color that
makes them easy to distinguish from in app controls"*.

§38.16 put the ✕ on the parked bar deliberately — it is the only place it means "end the demo" — so
the second half of the report is a consequence of a decision, and what is left to answer is why the
panel's chrome reads as arriving at card 9 rather than at card 1. The background ask is separate and
straightforward: the guide's card should never be mistakable for one of the app's own.

### 39.8 [ ] GAP — what the story shows of the other phone

Four asks, one subject: the parts of the journey that happen outside this app.

- **Card 10/11:** a clearly marked mock of the message arriving on Ana's phone, and of the tap on its
  link. *Since 2026-09-25 the card shows the invitation the app really sends (`361c58b`); a drawn
  notification and the tap on the link are not there.*
- **Card 11:** Ana's phone in the blossom theme, so that it does not look like the trainer's.
- **Card 18:** a clearly marked mock of Ana's share step. To answer before drawing it: an
  approximation of the iPhone share sheet is Apple's design, not ours.
- **Card 19:** a third-party message app where the trainer taps the file. *The `review` chapter now
  opens on a drawn message screen whose attachment opens the review dialog
  ([demoNarratorCard.js](src/modules/demo/demoNarratorCard.js), `ScreenshotNarratorCard`); whether
  that answers the ask is Simon's call.*

The rule for all of them, written in demoNarratorCard.js: a step outside this app is drawn on
something nobody could mistake for one of its screens.

### 39.9 [ ] BUG — Show me skips what it is there to show

**Fixed 2026-09-30 (`5c269da`):** Show me filled two fields as one and closed the ✕ without drawing
the tap (cards 6→7, walked backwards), and drew no tap on card 20. Replays now carry the hand, a
control at 0,0 is not taken as settled, and the hand presses again where a control moved.
`test_every_tap_show_me_performs_is_drawn_by_the_hand_first` walks the story forward and every
chapter back.

**[ ] Open (found 2026-09-30): a demonstration that fails part-way leaves open what it opened.**
`demonstrateBeats` stops at the first beat that does not come true, so a later closing beat never
runs: on the welcome card the ☰ menu stays open (§91.5 says how the tests reached it). Proposed: run
a sequence's closing beat even after a failure.

### 39.10 [x] CHANGE — the intake-link button is named for the intent

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3910-x-change-the-intake-link-button-is-named-for-the-intent); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### [x] 39.11 Answered 2026-08-31 — not work — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-3911-answered-2026-08-31--not-work--archived-2026-09-30).

### 39.12 [x] BUG — a deep-linked clipboard showed a placeholder instead of the session

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3912-x-bug-a-deep-linked-clipboard-showed-a-placeholder-instead-of-the-session); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.13 [ ] BUG — the ⋯ menu says "this session" and deletes several

**Raised 2026-08-31 (Simon):** on a clipboard that merges overlapping sessions, the ⋯ menu does not
make sense.

**Fixed 2026-09-01 (`9420cc6`):** both title builders join the merged titles with " + "
([test_clipboard_title.py](tests/medium/test_clipboard_title.py)).

**What is left is narrower than "several edit entries".** *Edit plan*, *Copy this plan to…* and
*Everyone on this plan* act on the active client's plan and mean one thing either way. **Delete
Session** does not: `deleteScheduledSession` removes every session in `sourceSession.ids`, so on a
merged clipboard it removes all the slots while the question asks about "this session".

**[ ] Question for Simon:** when a clipboard covers two slots, should Delete remove both (saying so,
with the count and the names), or offer them one by one? §39.17's merged row waits on this.

### 39.14 [ ] QUESTION — two decisions still open on the clipboard's title bar

**[ ] Question for Simon — where the ⋯ sits:** *"should we move the tree dots menu to the left of
session name?"* Measured: the title block gets 240px whether ⋯ leads or trails the action cluster,
and 234px at the far left, so this is not about space. The far-left slot belongs to the
`.view-grabber` (close the session, go home), and the app puts menus on the right: the ☰ is top
right, and the story card teaches it as "the top right corner".

**Done 2026-09-01:** the editor's second line matches the clipboard's. It uses the clipboard's own
`.clipboard-title-when` class, and the red pill that wore the day and time is gone.

### 39.15 [x] BUG — the plan-fit meter looked like a button and explained itself only on hover

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3915-x-bug-the-plan-fit-meter-looked-like-a-button-and-explained-itself-only-on-hover); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.16 [x] CHANGE — the fit meter warns before the hour is gone, and costs a set by its reps

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3916-x-change-the-fit-meter-warns-before-the-hour-is-gone-and-costs-a-set-by-its-reps); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 39.17 [~] CHANGE — deleting a session earns ceremony proportional to what it destroys

**Reported 2026-09-01 (Simon):** deleting a session is intrusive. It needs a clear warning, a
stronger one once the session has started, and protection against a delete in the pocket (a slide?).
Deleting already keeps each participant's plan under *Unscheduled plans*
([sessionLifecycle.js](src/controllers/sessionLifecycle.js)); an empty plan is not kept.

**Design, with ceremony scaled to what is destroyed:**

| Case              | What the dialog says                                              | To confirm                    |
| :---------------- | :---------------------------------------------------------------- | :---------------------------- |
| Future, untouched | Names the session; the plans stay under Unscheduled               | Destructive button, set apart |
| Merged            | Names every session it removes, with the count                    | Same                          |
| Already started   | Names what cannot come back: "4 sets logged for Jane, 2 for John" | Slide to confirm              |

The slide was ruled 2026-09-01 (Simon) for the started case only; every other delete stays a button.

**Done 2026-09-30 (`5da23e1`):** the future and started rows. The question names the session with
its date and time; a started session lists the logged sets per participant and is deleted only by
sliding from the handle to the end (a tap on the track does nothing; End on the keyboard confirms).

**[ ] Open:** the merged row, which waits on §39.13's ruling.

### 39.18 [x] FIX — the gate's worker split had gone stale, and it cost half the run

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#3918-x-fix-the-gates-worker-split-had-gone-stale-and-it-cost-half-the-run); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 40. [x] Two workspaces — the trainer's own work, and a sandbox to learn in — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#40-x-two-workspaces-the-trainers-own-work-and-a-sandbox-to-learn-in-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 41. [Brainstorm] A wide screen shows more than one thing at once

**Asked 2026-09-10 (Simon):** on a tablet or a desktop, show several programmes at once instead of one
narrow column with empty space either side.

**Ruled 2026-09-11 (Simon): planning gets the columns, the live clipboard does not.** Planning is done
at a desk, where the width is, and a wrong drop in a plan is seen and undone before anyone trains.
The live clipboard stays one participant per screen with thumb-sized targets, so a mis-tap cannot log
a set against the wrong client — until someone shows that this is missing on the floor.

**Shipped 2026-09-11 (`c200149`):** [planColumns.js](src/modules/clipboard/planColumns.js) draws one
editor per participant while planning. The count is what the width allows (330px per column),
bounded by the number of participants; the tapped participant comes first; one shared exercise-name
list serves all editors.

**Still open, all ideas rather than work in progress:**
- the layout is remembered on the device, not written into the address (§41.5), and comes back after
  a reload (§41.7) — not built;
- dragging an exercise from one participant's plan into another's while both are in edit (§41.6) —
  not built;
- which views a wide home screen shows (§41.3); the cheaper answer is to widen the one column, with
  the deck showing more days at once;
- for the live clipboard on a tablet, if it is ever wanted: a fixed strip of participant names down
  the side, so switching is one tap and no route changes. Simon's Tuesday session (three clients,
  three programmes) is the case that would ask for it.

### [x] 41.0 REDIRECTED 2026-09-11 — planning gets the columns, the clipboard does not — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-410-redirected-2026-09-11--planning-gets-the-columns-the-clipboard-does-not--archived-2026-09-30).

### [x] 41.1 Two layouts, not one — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-411-two-layouts-not-one--superseded-2026-09-30).

### [x] 41.2 The deep links are the hard part, and they are ruled to change — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-412-the-deep-links-are-the-hard-part-and-they-are-ruled-to-change--superseded-2026-09-30).

### 41.3 Which views the home screen shows — the choosing rule first

**Wanted 2026-09-10 (Simon):** *"domača stran pa pobere več vpogledov iz menuja in jih prikaže hkrati
(z enako logiko porazdelitve), pomagaj mi izbrati katere"*.

The menu offers: **Clients Directory**, **Pending Review** (plan adjustments), **Plans**,
**Exercises**, **History**. The dashboard already carries two more without being asked: the **session
deck** and the **message feed**.

**The rule to choose by: a column earns its place by being WORK THE TRAINER OWES, not a place to look
something up.** A lookup is one tap away and is remembered as a need at the moment it arises. Work
owed is what gets forgotten, and a column is worth its width only if it is looked at without being
sought.

Recommended, at desk width:

| Column | What it is | Why it earns the width |
| :--- | :--- | :--- |
| 1 · Sessions | today's deck | it is what the app is opened for; leftmost because it is what they came for |
| 2 · Pending Review + messages | plan adjustments awaiting a decision, and the feed | the only two surfaces that are work owed rather than reference; the feed already ranks unfinished work above FYI |
| 3 · Plans | the programme library | what a trainer prepares between sessions, and where an adjustment is acted on |

**Deliberately not columns:** Exercises and History are reference material, reached from a plan when
a question arises. The Clients Directory is a way to REACH a person — and everyone on today's board
is already in column 1.

**The one open swap:** column 3 is Plans or Clients depending on a habit only the maintainer can
report — after looking at today, what do you open next: the plan you are changing, or the person you
are changing it for?

### [x] 41.4 Red team — the strongest case against the whole idea — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-414-red-team--the-strongest-case-against-the-whole-idea--superseded-2026-09-30).

### 41.5 Is the query-string shape a problem — "it is not REST"

**Ruled 2026-09-10 (Simon): the layout is REMEMBERED, not addressed.** *"zapis postavitve je dovolj
dobra rešitev, saj delimo vedno povezavo za neznan prikazovalnik"*. A link is always opened on a
screen nobody can see, so an address naming three columns would describe a state a phone cannot
enter.

| The address                                                                | The local record                                                       |
| :------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| which session, which client is focused, and whether that one opens in edit | which columns are open, each one's mode, and the row each has expanded |
| survives being sent to anybody                                             | survives a reload on this device only                                  |

**Precedence:** what the address asks for wins over what the device remembers, as `?lang=` and
`?workspace=sandbox` already do, and the record is then updated to match. With nothing asked for,
the record decides.

The question that started this — a query string "is not REST" — needs no answer any more: no column
state goes into the address.

### 41.7 How a reload comes back with two plans in edit

**Asked 2026-09-10 (Simon):** *"kako pa reload page-a lahko ohrani 2 načrta v edit mode-u?"*

**Because edit mode holds almost nothing.** It is not a transaction (§41.6): every plan change is
written the moment it is made, so what has to survive a reload is a flag per column and, at most,
which row is expanded — not a document, not a pending save, not a diff.

Concretely, the record is per workspace and per session:

```
librept_clipboard_layout   →   { sessionId, columns: [ { clientId, mode, openRow }, … ] }
```

- **Per workspace** by the ordinary key suffix (§40.1), so a sandbox reset drops it with everything
  else that sandbox held.
- **Keyed by session**, so it is meaningless the moment that session is finished, and a record naming
  another session is ignored rather than repaired.
- **Read defensively**, the same rule the remembered route follows ([lastRoute.js](src/data/lastRoute.js)):
  a column naming a client who is no longer a participant is dropped on read, and an `openRow` naming
  a row that is gone is dropped by the validation the router already performs.

**What is deliberately NOT restored:** anything half-typed in an input. That is a different problem
with a different answer already shipped — [formDraft.js](src/modules/common/formDraft.js) keeps
half-filled forms in `sessionStorage`, per subject, and drops them on submit or cancel.

The order on the way back in is the order §40.3 already established for a workspace switch: the
address is set first, the live session is recovered from its cache — which is what supplies the
participants the columns are drawn for — and only then is the board drawn, from the record.

### 41.6 What happens when a second column is put into edit

**Asked 2026-09-10 (Simon):** does putting a second column into edit save the first plan, and does it
reorder the columns?

**Nothing is saved on leaving edit:** every plan change is written the moment it is made
(`saveActiveSessionToCache()` in [sessionPlanEditing.js](src/controllers/sessionPlanEditing.js)).
Edit mode shows handles and the add/remove controls; it is not a transaction.

**Recommended, not ruled:**
1. **Concurrent edit** in several columns — the per-column mode Simon asked for, and what would allow
   dragging an exercise from one client's plan into another's.
2. **Fixed column order**, never changed by a tap: a column that moves under the hand invites an edit
   to the wrong client's programme. A narrower window changes which columns are visible, not their
   order.

**[ ] Conflicts with what shipped:** [planColumns.js](src/modules/clipboard/planColumns.js) puts the
tapped participant first, so the order depends on which name was tapped. Decide which rule holds.

## 42. The clipboard, read at a glance — expand all, and cards worth expanding

**Reported 2026-09-10 (a trainer, via Simon):** the clipboard *"mora biti bolj pregleden"* — the deck
shows one card open and the rest as peeking rows, which is compact and does not answer *what is the
whole session*.

### 42.1 [x] Expand all — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#421-x-expand-all-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 42.2 [x] Measured: why expanding alone does not finish the job — closed 2026-09-10

Closed by §42.3, which re-measured the same stub after the change — the reasoning and the before
numbers are in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#422-x-measured-why-expanding-alone-does-not-finish-the-job-closed-2026-09-10).

### 42.3 [x] One card design, opened up — ruled and shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#423-x-one-card-design-opened-up-ruled-and-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md). The chrome question it left open is §42.13.

### 42.4 [x] Expand all is a SETTING — shipped 2026-09-10, halved by §42.14

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#424-x-expand-all-is-a-setting-shipped-2026-09-10-halved-by-4214). One of the two settings is left: the day's session cards.

### [x] 42.5 One head row, however open the card is — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-425-one-head-row-however-open-the-card-is--archived-2026-09-30).

### [x] 42.6 A collapsed circuit names its movements — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-426-a-collapsed-circuit-names-its-movements--archived-2026-09-30).

### 42.7 A theme's colours may only be written in that theme

**Reported 2026-09-10 (Simon):** in nebula, past cards look like the active session; in midnight
they kept nebula's violet.

**Fixed 2026-09-10 (`dad5afc`):** the deck painted past cards in `rgba(139, 92, 246, …)`, which is
nebula's `--primary` written out. The card now takes its tint from `--temporal-past`, and nebula's
own `--temporal-past` moved off its accent to a slate.

**[ ] Open:**
- the sweep: [test_theme_colours.py](tests/unit/test_theme_colours.py) fails when a component
  stylesheet spells out a colour a theme defines and the count rises. `BASELINE` is 20 (21 on
  2026-09-10) and comes down as each colour is replaced by its token;
- whether midnight's `--temporal-past` (`#c084fc`, purple) suits its emerald palette now that the
  card obeys it.

### 42.8 [x] No badge on the card in focus — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#428-x-no-badge-on-the-card-in-focus-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 42.9 [Open question] Does the active circuit card still need its timer?

**Asked 2026-09-10 (Simon), undecided:** *"genuine question undecided — should we remove the timer
from the active circuit card"*.

What is on the card today: a ⏱ in the head row that starts a rest timer, and — since §42.6 — a
`Rest · 60s` line for each rest the circuit actually contains.

**The case for removing it:** a circuit that names its own rests already says when the trainer stops
and for how long, and each of those break rows starts that rest itself on the open card. A second
control that starts an unnamed timer of its own is a second answer to one question, on the card with
the least room for it.

**The case for keeping it:** the plan's rest is what was written down; the rest a trainer actually
takes in a circuit is a decision made in the room. The ⏱ is the one that times what is happening
rather than what was planned.

**What would settle it, and it is cheap:** whether anybody uses it. Ask the trainer who reported the
clipboard's legibility whether they have ever started a circuit's timer from the head row rather than
from a break row.

### 42.10 [x] The sandbox says where its own exit is — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4210-x-the-sandbox-says-where-its-own-exit-is-shipped-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 42.11 [x] The expand-all menu item wears the app's own chevron — fixed 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4211-x-the-expand-all-menu-item-wears-the-apps-own-chevron-fixed-2026-09-10); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 42.12 [x] In the sandbox the badge is a marker, not a link — shipped 2026-09-10

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4212-x-in-the-sandbox-the-badge-is-a-marker-not-a-link--shipped-2026-09-10).

### 42.13 [x] Should an expanded card keep its border and shadow? — dissolved 2026-09-11

Closed without being answered: §42.14 removed the expanded tier the question was about. The reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4213-x-should-an-expanded-card-keep-its-border-and-shadow-dissolved-2026-09-11).

### 42.14 [x] The clipboard's expand-all is gone — removed 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4214-x-the-clipboards-expand-all-is-gone-removed-2026-09-11).

## 43. [Brainstorm] The client's own copy: their plan, their feedback

**Asked 2026-09-10 (Simon):** *"should we enable plan sharing and letting clients record too hard too
easy and notes themselves and share feedback with PT post excersize?"*

Today the trainer holds the clipboard and logs everything: the sets, the Too Easy / Too Hard signals,
the notes. The client's own device already appears in the product twice — the intake page they fill
in themselves (§26/§1.7) and the RSVP reply (§1.6) — so the route exists and the privacy posture is
written down. This asks for a third: the client sees their plan, and answers back on it.

**Two features, and they should not be decided together:**

1. **Plan sharing** — the client can SEE what they are meant to do, on their own phone, between
   sessions. Read-only, and mostly a publishing problem: what a plan looks like with no app around
   it, how the link is issued and revoked, and what it exposes if it is forwarded.
2. **Client-side feedback** — the client records too easy / too hard / a note against an exercise,
   and it reaches the trainer. That is a WRITE from a device the trainer does not control, and it
   lands in the trainer's training record.

Open before either, and the second is where the weight is:

- **Where does a client's answer live until the trainer accepts it?** The app has a shape for this
  already — an intake submission is reviewed before it becomes a client (§26.5) — and the same rule
  looks right here: nothing a client sends edits the training record until the trainer has read it.
- **Offline is the trainer's promise, not the client's.** The whole product works with no network; a
  client's phone in a basement gym does not sync. What happens to feedback typed with no signal?
- **What the link exposes.** A plan carries a person's name, their programme and their loads. A
  forwarded link must not be a data breach, which means the same question §31 asked of the support
  wipe: what authority does a link carry, and for how long?
- **Whose words are they?** A client's note is their own account of their own body. It is not the
  trainer's clinical note, and mixing the two into one field would make the record impossible to
  read later and awkward under Art. 15 (§27).
- **The gym floor is still the judge.** A trainer running three people cannot also be moderating an
  inbox. If accepting feedback is not one tap from where they already are, it will not happen.

**What it would be worth:** the two things a trainer currently reconstructs from memory — how the
work actually felt, and what the client did between sessions — arrive as data instead. That is the
same argument the asynchronous plan adjustments in
[uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md) already won.

### 43.1 Three features, not two — and the aim is the third

**Aimed 2026-09-10 (Simon):** *"ciljava na post workout feedback"*.

The two above split into three once you ask **when** the client is holding their phone, and the three
have different costs:

1. **Plan sharing** — she looks at her programme between sessions. A publishing problem.
2. **In-session self-report** — she presses Too Easy / Too Hard herself, on the floor, while the
   trainer is standing there.
3. **Post-workout feedback** — hours or days later, at home: how it felt, whether it hurt the next
   morning, whether she slept.

**The third is the target, and it is also the strongest of the three.** It carries what the trainer
cannot get on the floor at all. Soreness arrives 48 hours after the session that caused it; the
trainer is not there and the clipboard is closed. Today that information reaches them as a chat
message at 21:00, against no session and no exercise, and is gone by the time next week's plan is
written.

It is also the cheapest: **once per session, tiny, asynchronous, and it has a screen already** —
pending review, which [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md)
built for exactly this shape of arrival.

**Against the second.** In-session self-report is the one to be most careful with, because it looks
like a small addition to something that already exists and is not. Too Easy / Too Hard are already
on the cards ([exerciseCard.js](src/modules/clipboard/exerciseCard.js),
[circuitCard.js](src/modules/clipboard/circuitCard.js)) as the **trainer's** signals. A client
pressing the same button is **not the same measurement wearing a second author** — the trainer's is
an observation, hers is a perception, and *the gap between them is the useful part*: she says brutal,
the trainer saw easy, and that is the conversation. **They must never share a field.** Merged, the
plan adjustment is fed a contradiction and nobody can tell afterwards which of the two it obeyed.

### 43.2 The carrier is the problem, not the feature

**There is no server, and that is the whole product.** Every client-to-trainer message today is a
file the client sends through their own messaging app
([signupDelivery.js](src/modules/intake/signupDelivery.js)).

**That works at intake because intake happens once**, and the payoff is immediate and obvious: fill
this in and you get to train. Post-workout feedback is the opposite — a **repeated** act with a
diffuse payoff. A client will do it twice and then stop, and a feature that decays to nothing is
worse than none, because the trainer will have stopped asking in person.

So the design question is not what the client's screen looks like. It is **what carries a small
message from her phone to the trainer's, every week, for a year, with no server.** Every answer has
a cost that must be named before anything is built:

- **A file per session, sent by hand.** Works today, nothing to build, and it is the one that decays.
- **A page she keeps** that accumulates answers locally — then still has to hand them over, with the
  same problem one step later.
- **The trainer's Drive as a drop box.** Breaks the privacy posture: it is the trainer's own storage,
  and giving clients write access to it is not a small change to §3.9.
- **A server.** Answers it properly and ends the product this is.

### 43.3 The cheap shape: build the ask and the filing, not a client app

The version that fits the architecture instead of fighting it, and is a fraction of the work:

- **The app composes the question** — the same shape as the intake invitation
  ([intakeInvite.js](src/modules/clients/intakeInvite.js)), which already solves "a message from an
  unknown number that must not read like phishing": the trainer's name first, one tap to send.
- **The client answers in an ordinary chat**, which is where she already messages the trainer at
  21:00 anyway. Nothing to install, nothing to keep, nothing to update.
- **The app makes it one tap to file that reply** against the right session and the right client, and
  pending review is where it lands.

**A client-side app is a second product** — its own onboarding, its own updates, and support calls
from people who are not the trainer's customers and cannot be reached. The intake page is the
precedent for how far to go: a stateless page with no database, used once.

### 43.4 Two things to decide that are not technical

- **Duty to read.** If the app accepts a message saying someone is in pain, there is an expectation
  that it is read. The product's own disclaimer says this is not medical or coaching advice, and an
  unread pain report three days old is a professional problem rather than a bug. **Whether the app
  may accept health information it does not promise to surface is the first question**, ahead of any
  screen.
- **Health data on a second device.** A client typing about her knee creates health data outside the
  trainer's device and a channel carrying it. The consent form
  ([docs/templates/](docs/templates/INDEX.md)) covers what the **trainer** holds. It would have to
  cover this, in the same pass, or the feature ships ahead of the paperwork that legitimises it.

### 43.5 What it fixes in the demo

The evening chapter's card promises *"kaj se zgodi z zapiski, ki si jih delal med serijami"* — what
happens to the notes taken between sets — and then changes the colour theme. A client's reply landing
in pending review and turning into next week's plan **is** that payoff, and the chapter has been
missing it since it was written.

### 43.6 And if plan sharing is built anyway: date the copy

Not the aim, but worth recording so it is not re-derived. The moment the client holds a copy, the
trainer's clipboard is no longer the only one: a movement swapped on Tuesday leaves her copy saying
the old one, with nothing telling either of them. That is [§44](TODO.md) — silent rot — with a person
doing the wrong exercise at the end of it.

**A read-only snapshot, stamped with the day it was taken, that says plainly it is a copy.** Naming
the staleness defuses it. Pretending to sync without a server is what produces the injury.

## 44. [Idea] Detect and report stale or dead links, across versions

**Asked 2026-09-10 (Simon):** *"a way to detect and report stale or dead deep links passed around the
internet (across versions)"*, then, on reading a first draft that covered only the demo:
*"stale link detection ni samo za demo, temveč za vse"* — not only the demo, all of them.

*(First written the same day and lost: commit `283254e` rewrote the tail of this file and deleted the
section. Restored and broadened.)*

**Every link this app hands out is a promise made to a page that will keep changing.** They get pasted
into chats, forum posts, calendar invites and user documentation, and then they sit there for months.

**The general defect: every one of them degrades silently, deliberately.**
[shareLink.js](src/modules/common/shareLink.js) — the module that reads promo and deep-link
parameters off the address — documents the fallback for each: an unknown `theme` gives the default
theme, an unknown `lang` the saved one, an unknown `chapter` the whole story, an unknown `demo` or
`init` nothing at all, and an absent or unrecognised `workspace` **the trainer's own database rather
than the sandbox**. Routes do the same: `resumeWalkthroughAt` in
[domain/walkthrough.js](src/domain/walkthrough.js) starts the demo from the beginning when the step
id is gone.

Each of those fallbacks is right on its own. A mistyped link pasted into a chat should still show a
stranger something rather than an error page. Together they mean **no link can ever be observed to
have rotted** — it keeps working and shows the wrong thing.

**The links in question, and they are not all the demo's:**

- demo deep links naming a step or a chapter;
- promo links carrying `lang`, `theme`, `init`, `workspace`;
- app routes naming a session date or a client id — a link to a client since deleted;
- the **client intake link** in an invitation, and the privacy-notice URL sent beside it, both of
  which leave the app and land in somebody's messages;
- links inside this repository's own documentation.

**Two halves, and they are different problems.**

- **Links inside this repository** are ours to check.
  [agent_tools/doclinks.py](agent_tools/doclinks.py) — the tool that resolves every Markdown link,
  anchor and `§`-reference and fails the build on a dead one — could resolve the app's own link
  vocabulary too: a `step=` that names no step, a `theme=` that names no theme.
- **Links out in the world** cannot be checked from here. What is possible is for the **app** to
  notice it was handed a value it does not recognise, and report it rather than silently substituting
  a default. Where such a report goes, and whether a stranger's first screen is the right place to
  raise it, is the open question.

**"Across versions" is why this is not just a build check.** There are no release tags and no
multi-version hosting ([§16](TODO.md), [§18](TODO.md)) — one build is live at a time. A link made a
year ago is judged by today's code, with no older version to fall back to and no version axis to read
the link's age from.

**Decided already, so it is not re-derived:** **ids in links stay human-readable** — `swap-open-catalog`,
not a UUID. A UUID prevents an accidental rename and nothing else; a build check catches that too, and
the id is what a failing test, a debug message and a documentation URL all show a person. A UUID also
hides the one failure no check can catch — the id staying while the thing it names drifts.

**Deliberately not designed further** (Simon, same day: *"I am over engineering it"*). This is the
problem, written down.

---

## 45. Reported 2026-09-11 — the first trainer's feedback on using the app

A working personal trainer used the app and reported back; Simon relayed the list and ruled on every
item the same day (2026-09-11). It is feedback on the app in use, not on the promotional pages.

### 45.1 [x] The first screen is English whatever language was chosen — fixed 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#451-x-the-first-screen-is-english-whatever-language-was-chosen--fixed-2026-09-11);
what shipped is in [CHANGELOG.md](CHANGELOG.md). The promotional page it left open is §45.15.

### 45.2 [x] The trainer can enter their own name, phone and email — shipped 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#452-x-the-trainer-can-enter-their-own-name-phone-and-email--shipped-2026-09-11).

### 45.3 [x] The signup form asks for first and last name — fixed 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#453-x-the-signup-form-asks-for-first-and-last-name--fixed-2026-09-11).

### 45.4 [ ] The share of a filled-in signup FAILED, and fell back to saving the file

**Reported:** sending the filled-in signup back to the trainer failed and offered to save the file
instead. Reproduced by Simon on a Samsung Galaxy S23 (Android): *"Deljenje ni uspelo …"*. So
`canShare` said yes and `navigator.share()` then refused.

**Why, read in the browsers' source (2026-09-15, not tried on a phone):**
- Chrome on Android shares a file only when its extension AND its media type are on two fixed lists
  (pictures, sound, video, `pdf`, `txt`, `csv`, `html`, `css`; `ShareServiceImpl.java`).
  `.json.librept-signup` is not on them, and neither is `.json`. The page gets `NotAllowedError`.
- `canShare` does not check the file type (`navigator_share.cc`), which is why the Share button
  showed.
- A second `share()` needs a new tap, and no manifest entry or installation can add a type to the
  lists.
- iPhone (WebKit) checks no type, so the share works there.
- `sms:` and `mailto:` cannot carry an attachment, and health answers must not go into a message body
  (UC8).

**Built:**
- 2026-09-11: the page shows the browser's error name and message under the status line.
- 2026-09-18, on Simon's ruling of 2026-09-15: a refused share (not a cancel) saves the file at once;
  the status line, in the warning tone, names the saved file and says to attach it to a message; the
  form is kept ([signupDelivery.js](src/modules/intake/signupDelivery.js),
  [signupDelivery.test.mjs](tests/unit_js/modules/intake/signupDelivery.test.mjs),
  [test_intake_form.py](tests/medium/test_intake_form.py)).
- 2026-09-30 (`2b3524e`): *Save the file to share* keeps the form too; the page is numbered
  "1. Save this contact" and "2. Fill in the form"; a page with no contact card shows no numbers.

**QR sizes, measured 2026-09-15** with the real `buildClientSignup` (compact JSON, error correction
M): a short signup is 302 bytes (version 13); about 450 characters in each prose field, 957 bytes
(version 25); both prose fields near their limit, 1991 bytes (version 37); every field at its limit
does not fit. Deflate gives 235, 627 and 859 bytes.

**[ ] Open, all three waiting on Simon:**
- try the share on the S23 itself;
- show the three QR codes (versions 13, 25, 37) on one phone and scan each with the stock camera of
  an Android phone and an iPhone; record read or not, and how long. This decides whether the QR
  route stays;
- what a link that carried no trainer name shows in place of the contact card.

### 45.5 [ ] Import covers a programme, but not the trainer's own exercise LIBRARY

**Reported:** trainers want to bring in their own exercises and circuits from files.

**Built 2026-09-23/24**, on Simon's rulings (2026-09-11: extend §29's format rather than use a backup;
2026-09-23: any number of sources, and circuits are their own collection): the LibrePT catalog in
every workspace, read from code ([exerciseLibrary.js](src/data/exerciseLibrary.js)); a Source filter
with one chip and one mark per source; the import reader ([libraryImport.js](src/domain/libraryImport.js))
of `librept.library/1` and of a bare list, with a review before anything is written; circuits in
`circuits` on schema 5 (§76), named "Sklop — first two exercises" when the file gives no name; an
export that carries circuits and sources, which a re-import keeps; the plan editor inserts a library
circuit; the Import button is gated on the `libraryImport` behaviour. See
[UC6](use_cases/uc6_exercise_taxonomy_and_picker.md).

**[ ] Next:** a frozen corpus of real library files, as §29 has for programmes. Blocked: no real
library file from a trainer has been found yet, so a corpus now could not claim to represent real
exchanges.

### 45.6 [x] The session list needs filters: a date range, a client, a location — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#456-x-the-session-list-needs-filters-a-date-range-a-client-a-location--archived-2026-09-30).

### 45.7 [x] Finish "seja" → "trening", and settle on ONE form of address — finished 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#457-x-finish-seja--trening-and-settle-on-one-form-of-address--finished-2026-09-30).

### 45.8 [ ] The clipboard and the client's history are two views of one thing

**Reported:** the clipboard and a client's history should be one view.

**The duplication:** the clipboard draws cards through [deckCard.js](src/modules/clipboard/deckCard.js)
and its subclasses; the client's history draws the same records again in
[historyView.js](src/modules/history/historyView.js)'s `renderHistoryItems`, with its own circuit
grouping, rest row, skipped badge and CSS.

**Ruled 2026-09-11 (Simon), final form:** the client's history shows the CLIPBOARD's item cards —
exercises and circuits — in sequence, divided by sticky date headers (the board's own pattern in
[sessionsView.js](src/modules/sessionList/sessionsView.js)), with past items set apart by colour. A
session is a header, not a card. When a plan is shared by several clients, the history is always one
named person's sequence.

**[ ] Still to place, since the clipboard's cards never showed them:** the session duration (on the
date header), and the skipped badge and the per-exercise feedback icons (on the exercise card, which
has a place for signals).

Since then: history is shown only on a client's page (`c7ab3a2`), so the question about a global
history is gone; the live deck no longer mounts past cards (§92.2), but
[pastDeckCard.js](src/modules/clipboard/pastDeckCard.js) is kept for this section.

### 45.9 [ ] Running a session: keep it interactive, drop the confirming

**Wanted (clarified by Simon, 2026-09-11):** the session screen stays interactive; what goes is the
confirming — tapping "done" on each round and exercise to move the session on. A tap should record
something the trainer learned or changed, never tell the app what it can see.

**Found 2026-09-11:** a plain exercise already has no "done" control; a signal on it marks it
performed ([sessionQuickSignals.js](src/controllers/sessionQuickSignals.js)). The circuit card still
asks: **Complete round N / M**, then **Finish circuit** ([circuitCard.js](src/modules/clipboard/circuitCard.js)).
So one item type is ticked off and the other is inferred — which is also why an exercise has no
rounds button and a circuit does.

**[ ] To decide before the button goes — what advances a circuit's round:**
- a signal on any member, the same rule as an exercise;
- the last member's rest timer ending;
- the counter stays as a display, tappable only to correct it.

Answer §8.7 (does completing a round stop its timer) in the same pass. If the round button goes,
most of what makes a circuit and an exercise look different in the list goes with it. Live editing
belongs to one card, not the whole programme.

### 45.10 [ ] The demo in chapters — and demo links become PATHS, not query parameters

**Reported:** split the demo into chapters. Built as the guided story (§35; chapter index and names
§73). Done from Simon's list of 2026-09-11: the trainer's own details are shown before the chapters,
without typing invented data (the `trainer-details` chapter in
[storyTour.js](src/modules/demo/storyTour.js)); the evening chapter moves an appointment.

**[ ] Open from that list:**
- a fast mid-session adjustment, **counted in taps and seconds** — a number a viewer can check;
- telling the client about the moved appointment;
- in the planning chapter, a look at a past session while planning the next one.

**[ ] Demo links become PATHS, not query parameters** (Simon, 2026-09-11). Chapter links are still
`?demo=story&chapter=…`. Cheap: the service worker and the deploy already answer any path with the
app shell, and the router resolves paths ([docs/ROUTING.md](docs/ROUTING.md)). What is left is a
naming decision (for example `/demo/story/floor`) and what an unknown chapter in a path does (§44).
Chapter links already sent must keep working or redirect.

### 45.11 [ ] Assessment sessions — the trainer measures, and records as they go

**Wanted (Simon, 2026-09-11).** A session whose purpose is measurement rather than training: the
trainer tests a participant's capabilities and records the results interactively, as they happen.

Nothing like it exists — not in the code, not in the use cases. Open by its nature: whether this is a
session type, a programme of a special kind, or a record that hangs off a client independently of any
session; and what a measurement IS as data, given that [§17](TODO.md)'s history record was shaped
around sets, reps and load.

Worth noting as a reason it matters commercially: a re-test is the only thing in a trainer's work
that demonstrates progress in a number, which is what a client renews on.

### 45.12 [CLOSED 2026-09-27] Published slots a client picks from an INVITATION, moved to PRO

Closed — a client choosing from published times is a paid feature (`~/Projects/EnterprisePT`
`TODO.md` §11 and §19). The reasoning is in
[TODO_ARCHIVE.md](TODO_ARCHIVE.md#4512-closed-2026-09-27-published-slots-a-client-picks-from-an-invitation-moved-to-pro).

### 45.13 [ ] An appointment already agreed — just send the client an ICS

**Wanted (Simon, 2026-09-11).** The time is agreed, nothing needs deciding, and all the client needs
is a calendar entry.

**This is the whole of client-facing booking in the free app, as of 2026-09-27.** The trainer names
the time and sends the entry; a client never picks from a list of times here (§45.12).

**Most of this is built.** [calendarInvite.js](src/data/calendarInvite.js) writes the ICS, and
[sessionInviteDialog.js](src/modules/session/sessionInviteDialog.js) already hands it to a client by
email or SMS. What is missing is that it is not written down as a use case, and that the route into
it goes through inviting somebody to a session — rather than "this is agreed, send the entry".

Cheapest of the three new scenarios, and the one a trainer would use every week.

### 45.16 [x] The session card, read off a screenshot — shipped 2026-09-11

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4516-x-the-session-card-read-off-a-screenshot--shipped-2026-09-11); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 45.14 [x] Found while running the gate: `_switch` waits for the wrong thing — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#4514-x-found-while-running-the-gate-_switch-waits-for-the-wrong-thing--archived-2026-09-30).

### 45.15 [ ] The promotional page is English only

Split out of §45.1 when that closed. [landing.html](src/landing.html) is English-only by
construction: it is a built document with no translation mechanism of any kind, and its calls to
action are the same demo and walkthrough links. Translating it means giving the built docs a language
axis, which is a larger change than §45.1 was.

---

## 46. [x] Reported 2026-09-12 — the setup form, read off a screenshot — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#46-x-reported-2026-09-12--the-setup-form-read-off-a-screenshot--archived-2026-09-30).

## 47. Reported 2026-09-12 — what the tests do not catch, and how the app should say so

Simon sent a screenshot of the sandbox: the session title on the card runs past the card's right
edge and under the ▶ and ⋮ buttons. His verdict was about more than the title — **catching defects
in the test phase is not enough.** A build that only reports what a test thought to look for is
blind to everything else, on every phone that is not this one.

### 47.1 [x] The session title runs off the card — fixed 2026-09-13

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#471-x-the-session-title-runs-off-the-card--fixed-2026-09-13); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 47.2 [ ] The app catches its own errors, writes a log, and can send a bug report

Asked 2026-09-12: catch the errors the app does not survive, keep a log, and let the trainer send a
bug report.

**Mostly built already, on 2026-08-18 (`4825b9c`, §12.4) — this section was written without it.**
`error` and `unhandledrejection` handlers on `window` (`captureUncaughtErrors` in
[appLifecycleController.js](src/controllers/appLifecycleController.js)) record each crash with its
route and the build SHA, from a fixed list of safe fields, so no client's name or note can enter
it ([crashReport.js](src/data/crashReport.js)). At most five are kept, and a repeat is counted, not
copied. The notification feed offers a prefilled GitHub issue that the trainer reads and submits
themselves ([notificationItems.js](src/domain/notificationItems.js)); nothing is sent automatically
and nothing interrupts a session.

**[ ] Open:**
- the log is kept in memory only, so a reload loses it: whether it is written on the device, and
  whether it survives a sandbox reset;
- errors the app catches itself (a failed IndexedDB write, a render error inside a caught path) do
  not reach it;
- whether the report also carries the data-schema version.

### 47.3 [ ] Sessions are merged only while they overlap

Said 2026-09-13 (Simon), answering §47.1: he did not expect merged names in the list of sessions,
only on the clipboard, where the trainer follows the session as it runs — and there only for the
time the sessions overlap.

**What the app does today.** The cards in the session list show one name each. The merge happens
when a clipboard is opened from a card or a link (`launchClipboardDirectly` in
[sessionsView.js](src/modules/sessionList/sessionsView.js), via `getOverlappingSessions` and
`buildSessionMeta` in [utils.js](src/modules/common/utils.js)): every session whose slot overlaps
the tapped one at ANY point joins it, for the whole life of that clipboard. Its time label runs from
the earliest start to the latest end. So 10:00-12:00 and 11:00-13:00 make one clipboard from 10:00 to
13:00 named after both, although they share only one hour. The collapsed clipboard bar at the bottom
of the list screen also shows the joined names, which may be what read as "names in the list".

**Open, to settle before code:** what happens to the clipboard at 11:00 when the second session
starts, and at 12:00 when the first one ends; and whether a trainer opening the 10:00 session at 10:15
sees one name or both.

## 48. PRIORITY — fewer taps on the live clipboard

Set as a priority 2026-09-13 (Simon).

### 48.1 [x] The active card and the open card are two different things — shipped 2026-09-13

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#481-x-the-active-card-and-the-open-card-are-two-different-things--shipped-2026-09-13); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 48.2 [ ] Tracking and notes are done after the session, not during it

**Wanted.** During a training session the trainer does not record results or write notes. That
work is done afterwards, as a follow-up. This keeps the live clipboard to the taps the session
needs.

**The exception** is a session for measuring performance (§45.11): there the result IS the
session, so it is recorded as it happens.

**To settle before code:** what stays on the live card from today's controls — the quick signal
(`logQuickSignal`) and the feedback note (`openFeedbackModal`) are both on it now; where the
follow-up happens and what reminds the trainer that it is still open; and how a session is marked
as a measuring session, which §45.11 has not decided yet.

## 49. [x] A theme is a stylesheet, and the Red theme becomes Spreadsheet — shipped 2026-09-13

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#49-x-a-theme-is-a-stylesheet-and-the-red-theme-becomes-spreadsheet--shipped-2026-09-13); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 50. A reload keeps what the trainer typed

**Wanted 2026-09-13 (Simon)**, raised with §48.1: a reload has to bring the app back to the state it
was in before. That includes every form, not only the clipboard.

### 50.1 [~] Review every form for what a reload throws away

**Why it matters:** a phone reloads a page on its own (a tab dropped in the background, a switch of
apps, a new service-worker version), and anything typed and not saved is lost without warning.

**Audit 2026-09-14 (Codex), in a local browser:** what each form lost on a reload. The client,
exercise and routine dialogs write as they are typed since 2026-09-17 (§50.2), so they are off this
list. The rest, not re-checked since:

- session setup ([editSessionControl.js](src/modules/session/editSessionControl.js)): the repeat
  toggle, the repeat-until date, the weekday buttons and the participant search are lost; name,
  place, date and times survive. Since `4907878` the draft belongs to one form (a new session, a new
  plan, or one session by id);
- trainer details, programme import, intake invitation, session invitation, start-time correction,
  plan adjustment, client erasure;
- client export: edited disclosure notes revert — losing a redaction can put another person's
  information back into an export;
- the encrypted-file reader: the passphrase is a text input, so excluding only `type=password` would
  store it;
- the feedback / gym note dialog: the note, the keep-on-record tick and the chosen tag.

**[ ] Defects in [formDraft.js](src/modules/common/formDraft.js)**, which the intake page still uses:
- the draft is cleared when `submit` fires, before the caller validates, so a rejected save loses it;
- radio groups cannot round-trip: the shared `name` is the key, so each radio overwrites the one
  before.

**Rules for any future draft:** it belongs to one subject and one workspace; dynamic rows are saved
as data, not as DOM ids; restoring runs as its own phase before autosave resumes.

Not yet exercised in a browser: new-client against edit-client isolation, the intake's other fields,
signup-file and backup-file review, inline duration editing on a past card, settings.

### 50.2 [ ] No separate draft storage for the trainer's forms

**Decided 2026-09-15 (Simon): no separate temporary storage for the trainer's forms.** A draft store
built that day was reverted.

**Ruled 2026-09-17 (Simon): a record form writes into the database as it is typed**, and the ahead
count rises only once the record is finished. Any way out (Save, ✕, Escape, Back, a route change)
finishes the record. Cancel undoes it: an edited record returns to what the dialog found, an added
one is removed. A new record exists from the first typed character, with a placeholder in an empty
required field ("New client", 3 sets).

**Done 2026-09-17 for the client, exercise and routine dialogs** (`8f8ae1b`,
[liveRecordForm.js](src/modules/common/liveRecordForm.js), counts in
[openRecordEdits.js](src/data/openRecordEdits.js)). The button is still called Save.

**Known limits:**
- a reload in the same instant as a keystroke loses that keystroke: the database is written behind
  the typing;
- a half-typed exercise cannot be finished after a reload: there is no form to edit an exercise;
- a reload does not reopen the client dialog; the record is kept.

**[ ] Open, to settle before code:**
- **session setup:** whether it writes as it is typed too. Its button also asks about removed
  participants and clashing sessions, creates a series, offers invitations and starts the session,
  and each needs a new place first. Asked 2026-09-17, not ruled. Until then its
  `librept_workout_setup_draft` stays;
- **dialogs that prepare an action** (invitations, import, export, erasure, restore, start-time
  correction) keep nothing — proposed, not ruled;
- **the client's intake page** keeps its tab-only draft for now; Simon wants to think it through
  together.

### 50.3 [ ] An incomplete record needs attention rather than a refusal

**Raised 2026-09-15 (Simon):** a record with a gap (a client without a name, a session without a
place) may need the trainer's attention rather than a refusal — perhaps a badge, perhaps one shared
with other work owed. The feed already computes work owed from state
([notificationItems.js](src/domain/notificationItems.js)).

**Ruled 2026-09-17 (Simon):**
- Save, ✕, Escape, Back and a route change check the record as the dialog is left. Enough filled
  in: the "unfinished" badge goes. A required field missing: saved anyway, with the "incomplete"
  badge.
- "Unfinished" is stored on the record, because the case it marks is a reload before Save or ✕.
  After a reload such a record counts towards the ahead count and the backup warning.
- Required fields are the ones the form marks `required`.
- A record can carry several badges at once: test data, incomplete, anonymised (§17.3).

**[ ] Open, to discuss before code — stored placeholders against the incomplete badge.** Simon
prefers the placeholder stored in the record, so the app never meets an empty value. Then "New
client" typed cannot be told from "New client" filled in, so "incomplete" must be stored when the
dialog checks the record. Proposed (Claude): store a badge only when nothing else in the record says
it — test data is read from its `testData` stamp, an anonymised client from `erasure.erasedAt`;
"unfinished" and "incomplete" are stored. Also open: what other writers do (signup import, programme
import, Drive merge), and whether existing records get "incomplete" before they are next opened.

Gaps a placeholder does not cover: a client with no way to reach them, a session without a location,
and a routine with no exercises (an empty plan if a session uses it). Several clients left as "New
client" share a name, so the alias hint treats them as namesakes.

## 51. [x] A tap the demo step did not ask for interrupts the guide — fixed 2026-09-13

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#51-x-a-tap-the-demo-step-did-not-ask-for-interrupts-the-guide--fixed-2026-09-13); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 52. [x] The Spreadsheet theme looks like a sheet, and a plan can be pulled aside — shipped 2026-09-14

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#52-x-the-spreadsheet-theme-looks-like-a-sheet-and-a-plan-can-be-pulled-aside--shipped-2026-09-14); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 53. [ ] Two medium tests fail when the machine is busy

**Two medium tests failed once under load** (2026-09-14, a game using 128 % CPU; both passed alone
and in a second full run):
- `test_scrolling_to_either_end_reaches_the_first_and_the_last_card`
  ([test_clipboard_active_card.py](tests/medium/test_clipboard_active_card.py)): card 38 active
  instead of 39;
- `test_the_panel_clears_the_control_even_while_a_card_is_open[iPhone SE]`
  ([test_walkthrough_panel.py](tests/medium/test_walkthrough_panel.py)): the panel covered the control
  it rings.

**A third still fails in full runs:** `test_a_reload_keeps_the_active_card_closed_when_it_was_closed`
([test_session_deeplink.py](tests/e2e/test_session_deeplink.py)). It waits up to 5 s for the end
state; when it fails, no `scroll` event follows the `wheel` at all, so the scroll did not happen
rather than came late. Last seen 2026-09-30 01:36 on a quiet machine. Alone it passed 3 of 3, and 10
of 10 beside twelve busy-loop processes, so CPU load alone does not reproduce it; something only a
full parallel run has does (other browser workers, or the stage's order).

**[ ] Next:** record where the wheel lands (listen on the deck's scroller, not the window) and trace
one failing full run.

**[ ] Open:** whether the tests read the screen before the app settles, or the app lands in the wrong
place when it is slow — a busy phone in a gym would see the second.

**Since 2026-09-30 (`ed041fd`, Simon's ruling that an exploring browser and the gate run at the same
time):** the gate runs its browser tests on half of the free cores and refuses only above half the
machine ([quiet_machine.py](build/quiet_machine.py)). Whether fewer workers beside load cures these
failures is not measured; the module holds the re-check condition.

## 54. [x] The past cards on the clipboard write their date as "20. jul." — fixed 2026-09-20

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#54-x-the-past-cards-on-the-clipboard-write-their-date-as-20-jul--fixed-2026-09-20).

## 68. [ ] The paid tiers: what stays out of this app, and the tag that invites the upgrade

Simon's tier idea, 2026-09-19, with the names and the price he set on 2026-09-24: **LibrePT**
(everything today, free), **ProPT** (invoices with a payment QR code and self-service booking, 10 € a
month or 60 € a year), **EnterprisePT** (a hosted service coordinating several trainers and gyms, plus
AI when the trainer supplies their own API key). The reasoning, the prices and the open questions live
in the separate private project `~/Projects/EnterprisePT` and in `.private/monetisation-tiers.md`;
what is recorded here is only what touches THIS repository.

**How ProPT would be built was worked out on 2026-09-24** in that project
(`PROPT_IMPLEMENTATION.md`), and two of its findings bind THIS repository:

- **Nothing of ProPT is built here, and nothing here changes shape for it.** ProPT is a file overlay
  over a pinned checkout of this app: it may add files and register itself into existing registries
  (`renderRegistry.js`, `eventTransports.js`), and it may not edit a file of this app. If it ever
  must, that is a request for a seam here, discussed here — never a patch carried privately.
- **The QR encoder needs no change.** `qrCodePath(text, encoder)` already takes the encoder as an
  argument, so the payment codes come from an encoder ProPT vendors itself.

The free app's own share of that work is §78 below: measurements and their progress over time, which
need no server and are worth having whether or not a paid tier is ever sold.

### 68.1 [ ] UPN generation stays OUT of LibrePT — ruled 2026-09-19 (Simon); the privacy half is open

A UPN payment order could be produced on the phone with the QR encoder this app already vendors. It
still stays out, for a reason that is not technical: **a paid capability shipped inside a free,
offline, open app cannot be enforced.** There are no accounts and no server to check a licence
against, and a licence key checked on the device is the shape people share.

**Open, and Simon named it as the thing to think about: privacy.** Moving the feature to a server
moves the DATA to a server. A UPN order carries who is paying, to whom, how much and for what, and an
invoice carries the client's name and address — so the tier that is easiest to enforce is also the one
that ends LibrePT's "nothing leaves this phone" promise. Whether there is a shape that enforces
payment without collecting the trainer's clients is the question EnterprisePT has to answer before any
of it is built.

### 68.2 [ ] A visual tag in the app that invites the upgrade

Wanted 2026-09-19 (Simon): LibrePT carries a tag inviting the upgrade to PRO, and PRO carries one
inviting ENTERPRISE.

**Red team, so it is decided rather than discovered later.** This app's rules say the trainer's
attention is the scarce resource and that the gym floor is the judge. An upgrade tag spends exactly
that attention, and it is the one element in the app whose purpose is ours rather than theirs. So it
has to be ruled, not styled:

- **Never during a session.** The live clipboard is a one-handed surface with a client waiting; an
  upsell there is the clearest way to make a trainer resent the app.
- **Where, then**: candidates are the ☰ menu, the support/about surface, and the empty states of the
  features PRO would extend. Each shows the tag to someone who is looking at the app rather than at a
  person.
- **Shown once, dismissible, and it stays dismissed.** A tag that returns is an advertisement.
- **It must say what PRO does**, not "upgrade". A reader who cannot tell what they would get has been
  asked to pay for a word.
- **Not hover-only, real padding, both languages** — the app's ordinary rules, which an upsell does
  not get to skip.
- **Open:** does a free-tier tag belong in an app whose licence and pitch are "free and complete"?
  The honest version names the paid tier without implying the free one is crippled.

### 68.3 [ ] Google Calendar leaves this repository — ruled 2026-09-27 (Simon)

**Ruled 2026-09-27 (Simon)** — the reasoning is in the private `~/Projects/EnterprisePT` `TODO.md`
§19. Every Google Calendar integration is a paid capability; this app keeps only the `.ics`
invitation for one named session, a file it writes itself.

**Done 2026-09-28 in this repository:** the untrue sentences in the privacy texts,
`calendarFreeBusy.js` with its tests and manifest lines, UC3 and UC4 with every pointer to them, and
the comments naming the calendar as a coming source. The erasure checklist's gym-calendar item is
manual for good (`reach: "never"`); the generic `busy` seam in `scheduleConflicts.js` stays.

**[ ] Left for Simon, in the Google Cloud console:** disable the Google Calendar API in Part A's
project, and remove `calendar.freebusy` from the consent screen's scopes
([docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md) already describes Drive only).

**[ ] Waits for the canary rotation:** the canary credential is still granted `calendar.freebusy`
beside `drive.appdata` (§1.5.1); narrowing it means running the consent flow again.

## 78. [ ] Measurements, and a client's progress over time

**Raised 2026-09-24**, out of planning the paid tiers: Simon wants ability measurements and a picture
of a client's physical abilities over time, for coaches working with athletes. **This belongs in the
free app.** A test, a result and a chart need no server, no account and no sync — so building it here
costs nothing that a hosted tier would later have to undo, and it is the strongest thing on the whole
paid-tier list for a coach.

### 78.1 [ ] A measure is a definition plus a value, never a number on its own

"Squat 100" says nothing. It has to say one repetition maximum, in kilograms, tested a stated way. So
the record has two halves:

- **The definition**: a name, the protocol (how it is tested), the unit, and whether higher or lower
  is better. Definitions are shared between clients and reused, the way the exercise taxonomy of §13
  already works — a coach who renames a test must not silently split a client's history in two.
- **The value**: the number, its unit, the date, and who or what produced it.

### 78.2 [ ] An estimate and a measurement must never share a line

A field test that estimates a value is not the same fact as a measured one. The standard estimate of
maximal oxygen uptake is reported to overestimate the directly measured value by about 20 % in men
and 16 % in women ([validation study, NIH](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7356312/)).
A chart that draws both as one line therefore shows a client improving when the coach only changed
method.

**So the value carries how it was obtained, and a chart separates the two** — different series, or a
refusal to draw them together at all. This is a data-model decision, not a chart decision, which is
why it is written before anything is built.

### 78.3 [ ] What it must NOT do in the first version

- **No norms and no percentiles.** "You are in the 60th percentile for your age" is a claim about a
  population, from tables we would be copying without the right to and could not keep current.
- **No score out of ten, no composite fitness number.** It reads as authoritative and is arbitrary.
- **No health advice of any kind.** A measurement is a record; interpreting it is the coach's job and
  their professional responsibility.

### 78.4 [ ] This is health data, and it stays where the rest of it is

A record describing a person's body is health data. The app already keeps every client record on the
trainer's device and nowhere else, so this adds no new duty — provided it is stored the same way as
everything else and does not arrive with an export, a share link or a sync of its own.

### 78.5 [ ] Two things that cannot be retrofitted, so they are checked now

Raised while planning the hosted tier, and true whether or not it is ever built:

- **Every record needs an identifier that never changes and never collides between two devices.**
- **Every record needs to say when it last changed, and on which device**, or no later merge can
  decide which copy wins or show the trainer why.

**Read 2026-09-30 (Claude), for live schema 5 and PREVIEW:**
- **Identifier: mostly yes.** Every collection has an unchanging `id`; everything the app creates
  gets `newRecordId()` ([recordId.js](src/data/recordId.js)), a UUIDv7 with 122 random bits.
  Exceptions: sample and test records have fixed ids, on purpose; a library import keeps an exercise
  or circuit id from the file when it is free on THIS device (§77.1 closed collisions between
  collections on one device, not between devices); older builds made 8-character ids from
  `Math.random` (about 41 bits), which stay valid.
- **When and on which device: no, in no collection.** There is no `updatedAt` and no device field.
  Drive sync is built without them on purpose: a three-way merge by id that shows a conflict rather
  than choosing a winner.

**[ ] Decision for Simon:** the second half needs a new field in every collection, so a new schema
number (numbered shapes are frozen). The library-import exception above needs the same thought if
several devices will write the same records.

## 67. [ ] Free text elsewhere is not checked for a client's name

Left open by §66 (2026-09-18): the refusal covers a session's name and location only. A routine's
name, a feedback note and a gym note are free text too, and a note about a session is where a trainer
has the most reason to write a person's name. Whether the same refusal belongs there is its own
decision — refusing a note may cost more than it protects, and a note is not a label the app reuses
on every screen the way a session's name is.

## 66. [x] A session may not be named after a client — shipped 2026-09-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#66-x-a-session-may-not-be-named-after-a-client--shipped-2026-09-18).

## 65. [x] The erasure sweep does not reach repeating sessions — closed 2026-09-24

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#65-x-the-erasure-sweep-does-not-reach-repeating-sessions--closed-2026-09-24).

## 64. [x] The gate fails on a different test each run, and each one passes on its own — fixed 2026-09-19

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#64-x-the-gate-fails-on-a-different-test-each-run-and-each-one-passes-on-its-own--fixed-2026-09-19).

## 63. [ ] Migrations are tested from the oldest version, but not for ever and not on a device

Asked 2026-09-17 (Simon): is there a test that covers migrations from the oldest version onward, for
ever?

**What exists:** [frozenBackupCorpus.test.mjs](tests/unit_js/data/frozenBackupCorpus.test.mjs)
migrates one frozen backup per schema through `migrateState`, and the required fixtures are derived
from `MIGRATION_STEPS` (`ea16316`), so a schema that arrives without one fails.
[test_device_database_corpus.py](tests/e2e/test_device_database_corpus.py) boots two frozen device
databases: a P-era install and a schema-4 phone (§76.4). Preview versions are refused as previews,
with the reason (`a37e926`; `refusalFor` in [schemaMigrations.js](src/data/schemaMigrations.js),
test in [schemaMigrations.test.mjs](tests/unit_js/data/schemaMigrations.test.mjs)).

**What is missing:**
- **A frozen device database for every version**, not only the two above.
- **Migrated data is checked field by field, never used:** no test opens the app on a migrated
  database and walks a feature on it.
- **Two paths, and nothing checks that they agree.** A phone never runs the migration chain after its
  first boot: `migrateState` runs only when an install first moves `localStorage` into IndexedDB, on
  every boot of a browser without IndexedDB, and when a backup is restored. On an IndexedDB install a
  new schema arrives through the backfill (`backfillSchema` in [readSchema.js](src/data/readSchema.js)).
- **Drive sync migrates nothing and checks no version**
  ([driveSyncService.js](src/data/driveSyncService.js)): a snapshot from another device on another
  build is merged as it is.

**[ ] Proposed (Claude), not ruled:** a frozen device database per version, derived from the chain;
each booted in the browser tests and walked through a client, a routine, a repeating session and an
invitation, under both passes of §62.

## 62. [x] Feature code may write only what the live schema declares — shipped 2026-09-19

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#62-x-feature-code-may-write-only-what-the-live-schema-declares--shipped-2026-09-19).

## 61. [x] Every install reads the preview schema P — the live schema must not be P — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#61-x-every-install-reads-the-preview-schema-p--the-live-schema-must-not-be-p--archived-2026-09-30).

## 60. [x] A numbered schema changed shape without a new number — ruled and enforced 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#60-x-a-numbered-schema-changed-shape-without-a-new-number--ruled-and-enforced-2026-09-21).

## 59. [x] Erasing a client keeps their alias — fixed 2026-09-18

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#59-x-erasing-a-client-keeps-their-alias--fixed-2026-09-18).

## 58. [x] A record is written whole, so a field cannot be staged at all — merged 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#58-x-a-record-is-written-whole-so-a-field-cannot-be-staged-at-all--merged-2026-09-30).

## 57. [x] The demo story tests count steps — fixed 2026-09-24

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#57-x-the-demo-story-tests-count-steps--fixed-2026-09-24).

## 56. [ ] A commit is not tied to the tree its gate proved

Found 2026-09-17: commit ccacbdc broke two demo tests, yet the gate before it passed, so the committed
tree was not the tree the gate proved (fixed in 040bcb9).

**Since 2026-09-30 (`f9091e3`):** `build check -- <paths>` gates HEAD plus the named files in a
separate worktree and writes `.build-reports/proof.json`; `build commit -F <msg> -- <paths>` commits
exactly those files, and only while they still match the proof ([build/snapshot.py](build/snapshot.py)).

**[ ] Open:** a plain `git commit` still bypasses the proof. No pre-commit hook refuses a commit whose
tree the gate did not prove, and none is installed. A hook would bind every agent, not only the ones
that read the rules. Proposed (Claude), not ruled.

## 55. [x] Found while shipping §52.2 — both fixed 2026-09-20

Closed — §55.1 (a reopened record is named, and offers no Start) and §55.2 (Blossom's future colour)
are in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#551-x-a-history-record-opened-from-the-clipboard-reads-untitled-session-and-offers-start--fixed-2026-09-20).

## 69. [x] One board test fails for a whole hour every night — fixed 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#69-x-one-board-test-fails-for-a-whole-hour-every-night--fixed-2026-09-21).

## 70. [x] Reading a narrower schema narrows the whole database on the next save — closed 2026-09-23

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#70-x-reading-a-narrower-schema-narrows-the-whole-database-on-the-next-save--closed-2026-09-23).
No install reads a narrower schema any more: every install reads the newest numbered one (§76).

## 71. [ ] Nothing detects when the code stops supporting a live schema with the right data

Asked 2026-09-21 (Simon): *"potrebujeva mehanizem, ki zazna neskladje — dokler je shema živa, jo mora
koda podpirati s pravimi podatki"* — for example a field renamed AND retyped between schema 4 and 5,
converted correctly and written into both. **Settled with it (Simon):** one domain object, two
records, one per store; the conversion lives in the projector, and the domain keeps one
representation.

**Done so far (from §58, 2026-09-23):** a store no longer receives a field that only a newer live
schema declares, and a field the schema being read cannot see is carried over from the row the store
already holds (`narrowToSchema`, `fieldsHiddenFrom` in [recordSchemas.js](src/data/recordSchemas.js)).
A field no live schema declares is still written whole; §62's guard in [conftest.py](tests/conftest.py)
(`UNDECLARED_STORED_FIELDS`) reports it in the tests.

**Four questions the code cannot answer today:**

1. **Who converts.** Nobody. `starWrite` in [stateStore.js](src/data/stateStore.js) projects a record
   once and then only trims it per schema; the projectors in
   [recordProjections.js](src/data/recordProjections.js) are per collection, not per schema. A
   projector per schema is the precondition for the rest.
2. **Does it fit.** `every live writer shape validates against every live schema` in
   [starWriteInvariants.test.mjs](tests/unit_js/data/starWriteInvariants.test.mjs) is the detector,
   but today it validates the same untransformed object against every schema, which passes only
   because every shape is a superset.
3. **Is it still the same thing.** A wrongly converted value can still be a valid string. The round
   trip catches it: project into schema N, read it back, require the original. That needs a READER
   per schema as well as a writer (§71.2).
4. **Can the shape language see a retype.** No. `sessions.startDate` is an instant (`toISOString()` in
   [sessions.js](src/data/sessions.js)); `sessionSeries.startDate` is a local calendar day
   ([sessionSeries.js](src/domain/sessionSeries.js), `atMidnight`). `SCHEMA_4` declares both as
   `{ type: "string" }`. **Proposed (Claude), not ruled:** a field descriptor carries its kind
   (instant or calendar date, the words of `docs/DATA_MODEL.md` §1) beside its JS type.

**Removing a field (from §58.1).** Not expressible while two live schemas disagree: the star write
projects from one domain object, so while schema 4 is live and declares a field, the app must keep
producing it. `docs/DATA_MODEL.md`'s star-write rule is expand-first, and
[starWriteInvariants.test.mjs](tests/unit_js/data/starWriteInvariants.test.mjs) asserts that no field
is dropped between live schemas; a field goes only when every schema that declares it is retired
(§60). A missing REQUIRED field is caught by the writer-shape test in question 2, not by §62's store
guard, which finds only extra fields.

### 71.2 [ ] The round trip is a TEST, not a runtime check — answered 2026-09-21, not ruled

**Answered (Claude), not ruled by Simon: the round trip of question 3 is a TEST, not a runtime
check.** At runtime a failure could only refuse the trainer's save or be logged and ignored, and the
round trip is a property of the projector/reader pair, not of one record. For a time conversion the
test corpus must carry the edges on purpose: an instant either side of local midnight, a
daylight-saving change, a browser east and west of UTC, a missing field and an empty string.

**One production check is earned instead**, at the moments data crosses a schema boundary and the
app already stops to ask: restoring a file, and switching the app version (§76.6). Before anything
changes, one sentence says what the target cannot hold and how many records that is — for example,
three repeating sessions it will not show — and the trainer chooses. It runs a handful of times per
install, so it may be slow; [backupHealth.js](src/data/backupHealth.js) shows the cost it must stay
within: one short number per record, never a second copy of the database.

### 71.1 [ ] Schema 3 is the test subject, and stays test-only — ruled 2026-09-21, not yet built

Asked by Simon whether schema 3 could be made, and whether old backups exist. Both answered the same
day (Claude): schema 3 already exists as a step in the migration chain, and
`tests/fixtures/backups/` holds one frozen file per schema, 0 to 4.

**Schema 2 against schema 3 is the maintainer's own example, from this project's history.** The
schema 2 session carries `day: "today"` and `time: "09:00 - 10:00"` and no absolute time; the schema
3 session adds `startDate: "2026-08-10T05:00:00.000Z"`. A local bucket plus a text range became an
absolute instant. The rename half is in the history too: schema 4 still declares BOTH `titles` (an
array, from schema 1 rows) and `title` (a string) — a rename with a type change that never got a
migration step, which is exactly what §60 now forbids.

**Ruled 2026-09-21 (Simon): schema 3 is for TESTING ONLY.** It is declared as a shape the mechanism
above is proved against, and it is **not** registered in `LIVE_SCHEMAS` — no store, no place in the
fan-out, no cost carried for ever under §60's "every numbered schema stays live". Reviving it as a
live shape would also have needed §70 settled first, since schema 3 is narrower than schema 4.

Red team, recorded so it is not rediscovered: as a product capability a rollback to schema 3 was
never wanted anyway — schema 3 has no `alias`, no `invites` and no `sessionSeries`, so a trainer
arriving there would lose their repeating sessions and invitations.

## 72. [x] Should every evening of a repeating session be stored? — decided 2026-09-21: no

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#72-x-should-every-evening-of-a-repeating-session-be-stored--decided-2026-09-21-no).
The model stays: the rule is stored once, and an evening becomes a stored record only when the
trainer opens, moves, cancels, starts or edits the plan of it.

## 73. [~] The guided story is offered by chapter, and the language choice comes from the registry

Asked for 2026-09-21 (Simon): the sandbox's message card and the splash should carry the whole table
of contents of the guided walkthrough, with any chapter clickable; and the splash should be ready to
offer any official European language.

### 73.1 [x] A table of contents on both surfaces — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#731-x-a-table-of-contents-on-both-surfaces--shipped-2026-09-21).

### 73.2 [x] Only a chapter that actually runs from cold is offered — measured 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#732-x-only-a-chapter-that-actually-runs-from-cold-is-offered--measured-2026-09-21).
The programme chapter is not an entry point; §73.3 is the open decision that would make it one.

### 73.3 [ ] Decide whether the sandbox seed should carry a submission already waiting

**2026-09-25:** the programme chapter became an entry point without a seed change: Ana's file moved
into a chapter of its own, `review`, which is left out of the index (§38.21).

**[ ] Simon's call:** whether the short `review` chapter is offered in the index too. Offering it from
cold needs the sandbox seed to hold an unreviewed signup from Ana — a pending submission that every
trainer sees on first entering the sandbox, and that the arrive chapter then delivers again.

### 73.4 [x] The language choice is built from the shipped dictionaries — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#734-x-the-language-choice-is-built-from-the-shipped-dictionaries--shipped-2026-09-21).

### 73.6 [x] The index is open, and the "show me around" button is gone — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#736-x-the-index-is-open-and-the-show-me-around-button-is-gone--shipped-2026-09-21).

### 73.8 [x] The chapters carry Simon's own names — shipped 2026-09-21

Closed — the names and their English are in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#738-x-the-chapters-carry-simons-own-names--shipped-2026-09-21).

### 73.9 [x] The splash's walkthrough button went the same way — shipped 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#739-x-the-splashs-walkthrough-button-went-the-same-way--shipped-2026-09-21).

### 73.10 [x] A chosen chapter counts inside itself — fixed 2026-09-21

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#7310-x-a-chosen-chapter-counts-inside-itself--fixed-2026-09-21).
The whole story still counts across its own length, handover included; §38.9 keeps that half.

### 73.7 [ ] Two chapters the story does not have yet

Proposed by Simon 2026-09-21, alongside the names of the four that exist:

- **Ustvarjanje termina za trening** — between *Sprejem treh novih strank* and *Izvedba in
  prilagoditve treninga*. The story never shows a session being CREATED: every session it drives was
  already in the seeded sandbox, so the one act a trainer performs most often is the one the demo
  skips.
- **Varnostne kopije in uporaba več naprav** — between *Izvedba in prilagoditve treninga* and
  *Pregled zaznamkov in priprava treningov*. A chapter about the app rather than about a client, and
  the only one that would touch Google Drive.

Neither is a rename: each is a new chapter of the guided story — steps that drive the app's real
controls, narration in both languages, and a cold-start walk that passes (§73.2). The Drive one also
has to decide what it demonstrates on a machine with no Drive account connected, because a guide
that stops at a sign-in screen in front of a visitor is the failure §28.14 exists to prevent.

**Not started. Agree the shape of each before the copy is written.**

### 73.5 [ ] Which official European languages, and translated by whom

Open, and the reason §73.4 stopped at the structure. Each language is 6xx keys. Machine translation
is a guess, and this app's own rule is that a guess is not reported as a measurement — so the
decision needed is **which languages** and **who translates them**, before any file is added.

## 74. [x] The sessions board's header and its calendar — all four done, closed 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#74-x-the-sessions-boards-header-and-its-calendar--all-four-done-closed-2026-09-30).

## 75. [ ] The displayed date format should be the trainer's choice

Simon, 2026-09-21: "date format mora biti izbiren zato, da si ga lahko vsakdo prilagodi", and
"date format v prikazu, zapis je vedno utc".

So: **display only**. What is stored does not move — dates and times are written in UTC and stay
that way, and nothing about a chosen display format may reach a record, a backup or a sync.

**This changes a standing product rule**, which is why it is written down rather than built: the app
currently decides the written form itself, ISO dates and 24-hour times everywhere, in every language,
precisely so that a Slovenian app on a US-set phone cannot show 09/12/2026 for the twelfth of
September or ask for a time in AM/PM. A trainer's own choice is a third thing, different from both
the app deciding and the phone deciding — it keeps the device out of it, which is the part that
matters, but the rule about the app's own decision has to be rewritten rather than quietly broken.

Open: which formats are offered, where the choice lives, and whether it covers times as well as
dates. Entry stays as it is — `timeField.js` and `dateField.js` on `steppedField.js`.

## 76. [~] The trainer chooses which supported version of the app to run — schema 5 shipped, the choice in progress

Asked 2026-09-23 (Simon): a setting to run any supported version of the app. Ruled the same day: the
star write exists so that several versions can be live; the trainer chooses how the app BEHAVES and
never sees a schema; older supported versions get security and critical fixes. With §18's decision
this is one build: every supported version is code inside it, so a fix lands once. Simon, the same
day: fix the defects and build the switching.

**Built 2026-09-23:** schema 5 (`19ea11c`); the registry [appVersions.js](src/data/appVersions.js)
with its checks in [appVersions.test.mjs](tests/unit_js/data/appVersions.test.mjs); the *App version*
dialog in the ☰ menu ([appVersionDialog.js](src/modules/common/appVersionDialog.js)) — refused while
a session runs, stored per device, applied by a reload. Feature code asks for a behaviour by name
(`libraryImport`), never for a version number. Three identities stay apart: the app version the
trainer chooses, the schema it writes, and the commit SHA for support.

What is open is §76.4 and §76.6.

### [x] 76.1 Three identities, kept apart — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-761-three-identities-kept-apart--archived-2026-09-30).

### [x] 76.2 One registry of app versions — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-762-one-registry-of-app-versions--archived-2026-09-30).

### [x] 76.3 What the trainer sees, and what happens when they switch — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-763-what-the-trainer-sees-and-what-happens-when-they-switch--archived-2026-09-30).

### 76.4 What the data layer guarantees — changed while implementing, 2026-09-23

**Changed while implementing:** if each version read its own schema, data would be lost — a backup
and a Drive sync are built from memory ([backupFile.js](src/data/backupFile.js)), and memory holds
only what the read brought in. **So every install reads the newest numbered schema, and the version
decides behaviour only.** Schema 4 is still written, for a phone whose cached older build reads store
4 alone. A newly live store is filled from the schema below it, proved from a schema-4 phone snapshot
in [test_device_database_corpus.py](tests/e2e/test_device_database_corpus.py).

**[ ] The rule that keeps it true:** a field or collection leaves the newest schema only with the last
version that uses it. This section said `recordSchemas.test.mjs` fails the build otherwise; on
2026-09-30 no test there states that rule. Find the check, or write it.

A rename or a retype still needs §71's projector and reader per schema, and a test over every pair of
supported versions: switch, edit, create, delete, switch back, and nothing the trainer did not delete
is missing. Going back to a real older BUILD is §77.2.

### [x] 76.5 What each supported version costs — merged 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#x-765-what-each-supported-version-costs--merged-2026-09-30).

### 76.6 The first use: schema 5 for §45.5

§45.5's library import needed schema 5: `SCHEMA_4` plus an optional `exercises.source` and a
collection `circuits` `{id, name, series?, exercises, source?}`, `name` required (Simon, 2026-09-23).
**[x] Shipped 2026-09-23** with the registry: *2026-09* names schema 4; *2026-10* names schema 5 and
turns on `libraryImport`.

**[ ] Not built:**
- the sentence before a switch that names what the chosen version will not show, and how many
  records (§71.2's earned check). Today 2026-09 only hides the Import button and hides no data;
- the `BETA` ribbon of §18.12 for a version newer than the default;
- a browser-test pass per supported version, the way §62 adds one for PREVIEW. Its cost is not
  measured; the last full gate took 341 seconds on 2026-09-23.

**What each supported version costs:** a browser-test pass; every behaviour branch stays in the code
until the last version that needs it is retired; one more star-write store per new schema
(`docs/DATA_MODEL.md`).

**[ ] Open for Simon:**
- whether the default stays *2026-10* — chosen by Claude, not ruled: the library import had already
  shipped to every trainer, and 2026-09 as the default would have taken it away;
- **proposed: at most two numbered versions supported at once**, plus PREVIEW — a way back and a way
  forward, while each further version adds a test pass and a branch in every feature that differs;
- the Drive sync rule, which reading the newest schema (§76.4) has made unnecessary.

## 77. [ ] Odprte ugotovitve pregleda Claudovega dela v tednu 2026-09-21–2026-09-24

**Pregled Codexa, 2026-09-24:** Claudovo delo od 2026-09-21 do commita `06b292b` (58 commitov).
Napake so ponovljene na izolirani kopiji z začasnim profilom Chromiuma. P1 pomeni možnost izgube
podatkov, P2 napačno delovanje, P3 manjšo napako prikaza ali filtriranja. Točka ostane odprta do
popravka in regresijskega testa. Šest od sedmih je popravljenih; odprta je §77.2.

### 77.1 [x] P1 — Uvoženi ID vaje lahko prepiše stranko — popravljeno 2026-09-24

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#771-x-p1--uvoženi-id-vaje-lahko-prepiše-stranko--popravljeno-2026-09-24).

### 77.2 [ ] P1 — Vrnitev iz dejanske stare izdaje izgubi njene spremembe

**Izvor:** `19ea11c`, [readSchema.js](src/data/readSchema.js),
`ensureLiveSchemasBackfilled`; [stateStore.js](src/data/stateStore.js), `SCHEMAS` in
`starWrite`. Nova izdaja bere `schema5`, ki jo iz `schema4` napolni samo enkrat. Stara
izdaja `fc172f9` pozna samo 4 in PREVIEW ter zato ne posodobi `schema5`.

**Ponovitev:** z `06b292b` shrani stranko z imenom `Before downgrade`; z dejansko kodo
`fc172f9` na isti bazi spremeni ime v `Edited in old build` in počakaj na zapis. Po
ponovnem odprtju s kodo `06b292b` je ime spet `Before downgrade`. Sprememba je še v
starejši shrambi, nova je ne prebere; naslednje shranjevanje nove izdaje lahko prepiše
tudi starejšo shrambo. To ni menjava vedenja v meniju App version: tisti možnosti obe
uporabljata novo kodo in zato tega primera ne preverita.

**Odprava:** določiti in izvesti varen prehod med dejanskimi izdajami, vključno s staro
predpomnjeno aplikacijo; ne razglašati stare shrambe za združljivo samo zato, ker jo nova
koda še piše. Regresijski test mora naložiti obe izdaji in preveriti spremembo, dodajanje
in brisanje ob povratku. Obstoječi
[test_read_schema_toggle.py](tests/e2e/test_read_schema_toggle.py) uporablja samo novo
kodo. Blokira zagotovilo varnega povratka oziroma dela stare predpomnjene izdaje (§76.4).

### 77.3 [x] P2 — Uvoz sklopa tiho zavrže nenumerične cilje vaj — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#773-x-p2--uvoz-sklopa-tiho-zavrže-nenumerične-cilje-vaj--popravljeno-2026-09-30).

### 77.4 [x] P2 — Vir iz imena datoteke izgine ob potrditvi uvoza — popravljeno 2026-09-25

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#774-x-p2--vir-iz-imena-datoteke-izgine-ob-potrditvi-uvoza--popravljeno-2026-09-25).

### 77.5 [x] P2 — Ponovni uvoz istega kataloga podvoji sklope — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#775-x-p2--ponovni-uvoz-istega-kataloga-podvoji-sklope--popravljeno-2026-09-30).

### 77.6 [x] P3 — Ime uvoznega vira se lahko zamenja z internim filtrom — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#776-x-p3--ime-uvoznega-vira-se-lahko-zamenja-z-internim-filtrom--popravljeno-2026-09-30).

### 77.7 [x] P2 — Danes ne prikaže današnjih vadb ob aktivnem datumskem filtru — popravljeno 2026-09-24

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#777-x-p2--danes-ne-prikaže-današnjih-vadb-ob-aktivnem-datumskem-filtru--popravljeno-2026-09-24).

## 79. [~] German (de) — the second market, Germany and Austria

**Asked 2026-09-26.** German-speaking trainers are the plan's second market. The app now ships a
German dictionary ([src/i18n/de.js](src/i18n/de.js)), a German consent letter
([src/i18n/consent/de.js](src/i18n/consent/de.js)) and the German consent form and privacy notice
([docs/templates/de/](docs/templates/de/INDEX.md)). All of it is a **machine translation**. It uses
the familiar "du", as the Slovenian uses "ti", and the DSGVO's own words for consent (Einwilligung)
and withdrawal (Widerruf).

German is selectable from the language menu, the splash and the client's intake page as soon as
this is deployed. Nothing stops a trainer from sending the German consent letter before §79.1 is done.

### 79.1 [ ] A German speaker reviews the German text — *Blocks:* inviting German-speaking trainers

Read `de.js`, `consent/de.js`, both documents in `docs/templates/de/` and the German part of
[src/data/demoText.js](src/data/demoText.js). The terms least certain: *Klemmbrett* for the
clipboard, *Sandbox*, *Zirkel* for a circuit, *Kunde* (generic masculine) for a client, *Routine*,
*Wdh.* for reps, the reply words *ICH WILLIGE EIN* / *WIDERRUF*, and *Speicherdauer*. Before real
use with clients, the consent letter and the notice also need someone who knows German
data-protection law.

### 79.2 [ ] Which supervisory authority the German notice names — *Blocks:* §79.1's legal review

The English notice, and so the German one, names the Slovenian Information Commissioner and the
European Data Protection Board's list. A client in Germany or Austria would look for their own
authority (in Germany one per federal state; in Austria the Datenschutzbehörde). Naming them changes
the notice's substance in one language only, so it is a decision, not a translation fix.

### 79.3 [x] The evening theme card names an option the menu does not have — popravljeno 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#793-x-the-evening-theme-card-names-an-option-the-menu-does-not-have--popravljeno-2026-09-26).

### 79.4 [x] The client documents declare `lang="en"` whatever their language — popravljeno 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#794-x-the-client-documents-declare-langen-whatever-their-language--popravljeno-2026-09-26).

## 80. [ ] Preizkus prve uporabe v vlogi osebnega trenerja

**Naročilo:** raziskovalno preizkušanje v brskalniku v vlogi trenerja, brez branja uporabniške
dokumentacije. Izmišljene stranke, podatki in treningi; po vsakem scenariju tukaj zapisati korake,
opaženo, težavo, vpliv na trenerjevo delo in predlog. Nove scenarije izbirati po tem, kar pokaže
aplikacija. Postopek je veščina `exploratory-test` (`.agents/skills/exploratory-test/`).

Vsaka točka pove, na kateri različici je bila opažena: objavljena `0625bd6` ali `8b2ce80`, ali `main`
s SHA. Ugotovitev z objavljene različice se pred popravkom preveri na `main`. Pod točko stoji verdikt:
popravljeno s commitom, čaka na Simona ali zavrnjeno z razlogom. Zaprta točka ima tu le naslov in
kazalec v [TODO_ARCHIVE.md](TODO_ARCHIVE.md).

### 80.1 [x] Prva stranka in prvi individualni trening — v teku — superseded 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#801-x-prva-stranka-in-prvi-individualni-trening--v-teku--superseded-2026-09-30).

### 80.2 [x] P2 — Pogoji uporabe prekrijejo izbiro jezika ob prvem obisku — popravljeno 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#802-x-p2--pogoji-uporabe-prekrijejo-izbiro-jezika-ob-prvem-obisku--popravljeno-2026-09-26).

### 80.3 [ ] P2 — Slovensko iskanje ne najde obstoječega počepa

**Opaženo** (`0625bd6`, sl): v »Dodaj iz kataloga« iskanje »počep« ne najde ničesar, »goblet« najde
»Dumbbell Goblet Squat«. Katalog ([exercises.js](src/data/exercises.js), 48 vaj) ima samo angleška
imena in nobenih sopomenk. Slovenski trener sklepa, da običajne vaje ni.

**Odločeno:** imena vaj ostanejo angleška (§46.4). Rešitev so **iskalne sopomenke**: »počep« najde
`Dumbbell Goblet Squat`, angleško iskanje ostane uporabno.

**Narejeno:** prazno stanje pove iskano besedilo, ne krivi filtrov: »Nobena vaja ne ustreza iskanju
»počep«. Imena vaj v katalogu so v angleščini.« (`a53f9db`). Prevod filtrov in izbirnikov je §80.54.

**Čaka na Simona:** nabor slovenskih in nemških iskalnih izrazov za 48 vaj, ki jih trener res vtipka.
Agent jih ne sme izmisliti s prevajanjem imena. Mehanizem je lahko zgrajen prej.

### 80.4 [x] P3 — Po izbiri slovenščine del osnovnega vmesnika ostane angleški — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#804-x-p3--po-izbiri-slovenščine-del-osnovnega-vmesnika-ostane-angleški--popravljeno-2026-09-27).

### 80.5 [ ] P1 — Vnos datuma in ure iz profila ne ustvari pričakovanega termina

**Stanje 2026-09-30 (librept-02): čaka na Simona.** Vzrok je namenski: »Načrtuj program« odpre
obrazec v načinu načrtovanja, ki datum in uro shrani le kot besedilo pri načrtu in ne ustvari
termina; gumb »Shrani« je bil tam odstranjen namenoma (`3f30a34`). **Vprašanje:** naj obrazec z
datumom in uro ustvari tudi termin, naj datum in uro v tem načinu skrije, ali naj ostane tak in le
podnaslov pove, da termin ni rezerviran? Odločiti skupaj s §80.9.

**Scenarij:** v profilu stranke »Načrtuj program«. Obrazec »Načrtuj prihodnji program« poziva
»Nastavi termin in kraj«. Vpisati ime, kraj in 10:00–10:45 (današnji datum), »Odpri v beležki«,
dodati tri vaje, zapreti.

**Opaženo** (`0625bd6`): glava beležke kaže »Nenačrtovano«. Na seznamu treningov termina ni;
obvestilo pove, da program še ni dodeljen treningu. Program in opombe ostanejo. **Ponovljeno
2026-09-30** na `main` `12d0e66` z izbranim dnem (čip »pet. 2.«, 13:00): glava »Nenačrtovano · SIM
Vera Kos« in gumb »Danes«, za 2026-10-02 ni ničesar. Trener: »Izbrani datum 2. 10. je izgubljen; čas
ni moj.«

**Vpliv:** trener po vnosu datuma in ure pričakuje termin v urniku, ga pa ni, in nič ne pove, da manjka
korak dodelitve.

**Predlog:** ločiti pripravo programa od rezervacije termina. Po vnosu datuma, ure in kraja ponuditi
shranitev v urnik ali jasno povedati, da termin ni rezerviran. Preizkus: pot iz profila se konča s
kartico na izbranem dnevu ali z obvestilom, da termin ni rezerviran.

### 80.6 [ ] P1 — Zgodovina zaključenih vadb kaže načrt in vse vaje kot preskočene

**Prvotno opaženo** (`0625bd6`): »Splošna zgodovina vadb« je kazala nezačet načrt z vsemi vajami
»PRESKOČENO«. Ta pogled je odstranjen (§81.7); stran stranke osnutke izpusti (`!log.isPlanning` v
[clientsView.js](src/modules/clients/clientsView.js)).

**Kar ostane, preizkušeno 2026-09-30** na `main` `12d0e66`, 390 × 844, sl: trening »Skupina torek« s
tremi vajami za SIM Vera Kos. Na prvi vaji nič, na drugi »Prelahko«, na tretji nič, »Zaključi vadbo«.
Stran stranke: »Dumbbell Goblet Squat PRESKOČENO«, »Dumbbell Bench Press: 10, 10, 10«, »Barbell Row
PRESKOČENO«. Odprta kartica vaje ponudi le »Časomer premora«, »Prelahko«, »Pretežko« in »Opombe«.
Dotik na »S3 × R10 × 12 kg« ne naredi ničesar. Premik na naslednjo vajo prejšnje ne označi: ta spet
piše »Prihodnje«.

**Težava:** vaje, ki jo je stranka naredila po načrtu, trener nima s čim zapisati kot opravljene; edini
zapis je signal »Prelahko«. Zgodovina zato kaže opravljeno kot preskočeno. Trener brez predznanja po
treh poskusih: »V telovadnici bi nazaj na zvezek.«

**Predlog:** en dotik »opravljeno po načrtu« na kartici vaje ali »Vse je bilo po načrtu« ob zaključku
(§94, točka 1, čaka na Simona). Preizkus: ista vaja kot samo načrtovana, opravljena po načrtu in
izrecno preskočena da tri različne zapise.

**Dokaz 2026-10-01** na `main` `6230070` (zamrznjena kopija), 390 × 844, sl, stranka »Nika Rozman«,
trening »Jutranji« s tremi vajami (»Barbell Back Squat« 3 × 10 × 60 kg, »Barbell Row«, »Barbell
Bench Press«). Na počepu »Pretežko«, nato »Zaključi vadbo« → »Zaključi zdaj«. Drugo vprašanje: »Ni
zabeleženih zaključenih serij. Res želiš zaključiti in shraniti prazno vadbo?« Trener, ki je vse
naredil po načrtu, ima na izbiro le »prazno vadbo«. Po »Zaključi zdaj« plošča pri treningu piše
»Program ni določen«, odprta kartica pa »Ni vstavljenih vaj / Vaj še ni. Pritisni tri pike (⋮) …«.
Načrt s tremi vajami ni nikjer več viden. Isto opiše dnevnik prvega odprtja 04.

### 80.7 [x] P2 — Prvi prikaz novega termina pokaže 1970-01-01 — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#807-x-p2--prvi-prikaz-novega-termina-pokaže-1970-01-01--popravljeno-2026-09-27).

### 80.8 [x] P1 — Prosta opomba brez izbrane ocene postane priporočilo za večjo težo — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#808-x-p1--prosta-opomba-brez-izbrane-ocene-postane-priporočilo-za-večjo-težo--popravljeno-2026-09-27).

### 80.9 [ ] P2 — Pripravljenega programa ni mogoče izbrati pri ustvarjanju termina

**Stanje 2026-09-30 (librept-02): čaka na Simona.** Termin v `state.sessions` hrani le `routineId`;
pripravljen program je zapis v `state.history` z lastnimi vajami, zato ga termin nima kam prevzeti.
**Vprašanje:** naj termin dobi shranjen program po stranki (sprememba podatkovnega modela, gl. §95),
in naj bo vstop izbira v spustnem seznamu ali »Dodeli terminu« pri programu?

**Scenarij** (`0625bd6`): za Ano obstaja »Uvodna vadba« s tremi vajami med »Nenačrtovani programi«.
Trener prek »Ustvari trening« ustvari današnjo »Individualna vadba« z isto Ano.

**Opaženo:** »Program za to stranko« ponudi le »Poljuben / Prazen načrt«; novi termin je prazen. Stari
program odpre le obvestilo; njegov »Kopiraj ta načrt na …« odgovori »V tem treningu ni še nikogar
drugega.« (§80.93).

**Vpliv in predlog:** pripravljeno delo ni dosegljivo tam, kjer trener izbira program za termin.
Ponuditi nenačrtovane programe izbrane stranke ob rutinah ali dejanje »Dodeli terminu« na programu.
Preizkus: dodelitev brez ponovnega sestavljanja vaj. Na `main` še ni preverjeno.

### 80.10 [x] P1 — Po zaključku aktivnega treninga se testni zavihek ne odziva — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8010-x-p1--po-zaključku-aktivnega-treninga-se-testni-zavihek-ne-odziva--popravljeno-2026-09-30).

### 80.11 [x] P2 — Števec sinhronizacije v glavi je brez besed in samo v angleščini — merged 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8011-x-p2--števec-sinhronizacije-v-glavi-je-brez-besed-in-samo-v-angleščini--merged-2026-09-30).

### 80.12 [x] P2 — Zamujen trening na plošči pokaže samo številko, besede »Zamuja« ni nikoli — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8012-x-p2--zamujen-trening-na-plošči-pokaže-samo-številko-besede-zamuja-ni-nikoli--popravljeno-2026-09-27).

### 80.13 [x] P2 — Opozorilo o poškodbi stranke je samo v opisu ob dotiku miške, in v angleščini — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8013-x-p2--opozorilo-o-poškodbi-stranke-je-samo-v-opisu-ob-dotiku-miške-in-v-angleščini--popravljeno-2026-09-27).

### 80.14 [x] P3 — V slovenskem vzorčnem treningu je stolpec z navodilom vaje angleški — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8014-x-p3--v-slovenskem-vzorčnem-treningu-je-stolpec-z-navodilom-vaje-angleški--popravljeno-2026-09-27).

### 80.15 [x] P3 — Oznaka v glavi piše »PREVIEW« in »DEMO«, čeprav prevod obstaja — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8015-x-p3--oznaka-v-glavi-piše-preview-in-demo-čeprav-prevod-obstaja--popravljeno-2026-09-27).

### 80.16 [x] P2 — Po izhodu iz peskovnika ostane vzorčni trening v vrstici nad dnom zaslona — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8016-x-p2--po-izhodu-iz-peskovnika-ostane-vzorčni-trening-v-vrstici-nad-dnom-zaslona--popravljeno-2026-09-27).

### 80.17 [x] P3 — Slovenska števila: »3 strank«, »3 stranka(-e/-k) ima« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8017-x-p3--slovenska-števila-3-strank-3-stranka-e-k-ima--popravljeno-2026-09-27).

### 80.18 [x] P2 — Prvi trening: iskanje udeleženca je slepa ulica, ko strank še ni — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8018-x-p2--prvi-trening-iskanje-udeleženca-je-slepa-ulica-ko-strank-še-ni--popravljeno-2026-09-27).

### 80.19 [x] P2 — Aplikacija sprašuje z okni brskalnika, ki jih ne oblikuje in ne prevaja — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8019-x-p2--aplikacija-sprašuje-z-okni-brskalnika-ki-jih-ne-oblikuje-in-ne-prevaja--popravljeno-2026-09-27).

### 80.20 [x] P3 — Prazen imenik strank govori o neuspelem iskanju in veli »Klikni« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8020-x-p3--prazen-imenik-strank-govori-o-neuspelem-iskanju-in-veli-klikni--popravljeno-2026-09-27).

### 80.21 [x] P2 — Ista stvar se na enem zaslonu imenuje vaja, program, rutina in načrt — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8021-x-p2--ista-stvar-se-na-enem-zaslonu-imenuje-vaja-program-rutina-in-načrt--popravljeno-2026-09-27).

### 80.22 [x] P3 — Gumb »Done« v oknu za vabila ostane angleški — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8022-x-p3--gumb-done-v-oknu-za-vabila-ostane-angleški--popravljeno-2026-09-27).

### 80.23 [x] P2 — Prazna podloga veli pritisniti ikono (✎), ki je na zaslonu ni — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8023-x-p2--prazna-podloga-veli-pritisniti-ikono--ki-je-na-zaslonu-ni--popravljeno-2026-09-27).

### 80.24 [x] P3 — Vabilo stranki govori o stranki kot o moškem, njena lastna stran pa kot o ženski — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8024-x-p3--vabilo-stranki-govori-o-stranki-kot-o-moškem-njena-lastna-stran-pa-kot-o-ženski--popravljeno-2026-09-27).

### 80.24.1 [x] P3 — Pet slovenskih besedil še piše končnico v oklepaju, »(-a)« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80241-x-p3--pet-slovenskih-besedil-še-piše-končnico-v-oklepaju--a--popravljeno-2026-09-27).

### 80.25 [ ] P3 — Na zaslonu za nov trening je 46 od 52 kontrol nižjih od 44 pik

**Izmerjeno** (`0625bd6`, 390 × 844; pravila na `main` so ista): na zaslonu »Ustvari trening« je 46 od
52 kontrol nižjih od 44 pik (Apple priporoča 44, Android 48). Puščici za dan in za pet minut sta visoki
26 pik in stojita druga nad drugo; oznake »danes«, »jutri«, »10:30« 36 pik; ročaj »Nazaj na začetek«
5 pik (§80.78); oznaka različice 21 pik. Palec zgreši in premakne datum v napačno smer.

**Vzrok:** izbrani vrednosti v [steppedField.css](src/modules/common/steppedField.css): `min-height:
26px` za puščici, `36px` za oznake. Zato je sprememba **Simonova odločitev**, ne popravek.

**Predlog:** nevidna tarča 44 pik okoli narisanega gumba, kot jo imajo od `b2aa98f` okrogli gumbi in
časomeri na podlogi, brez spremembe videza. Sicer puščici na 44 pik (stolpec 44 × 92) in oznake na 44,
raje manj oznak kot nižje. Preizkus na treh širinah: nobena kontrola na tem zaslonu ni nižja od 44 pik.

**Isto vprašanje drugje** (`main`, ukaz `measure`, 2026-09-29): čipi filtrov v »Knjižnica vaj« 31 pik,
čipi izbirnika vaj 26, vrstice vaj v izbirniku 37, »Prelahko« / »Pretežko« / »Opombe« na kartici 40,
jezikovni gumbi na strani za stranko 40. Že popravljeno: ✕ v oknih (§80.68), iskalno polje
izbirnika, izbire v obrazcu za opombe, polje za kontakt v »Povabi stranko«.

### 80.26 [x] P2 — Trenerjev lastni signal se v pregledu pokaže kot »Too Easy - Increase Load« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8026-x-p2--trenerjev-lastni-signal-se-v-pregledu-pokaže-kot-too-easy---increase-load--popravljeno-2026-09-27).

### 80.27 [x] P2 — Svinčnik pri čakajočem signalu ne naredi nič, če vaja ni iz programa — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8027-x-p2--svinčnik-pri-čakajočem-signalu-ne-naredi-nič-če-vaja-ni-iz-programa--popravljeno-2026-09-27).

### 80.28 [x] P2 — Predlagana ciljna teža je 2,5 kg za vajo, ki jo je stranka delala s 40 kg — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8028-x-p2--predlagana-ciljna-teža-je-25-kg-za-vajo-ki-jo-je-stranka-delala-s-40-kg--popravljeno-2026-09-27).

### 80.29 [x] P3 — Predal obvestil še naprej trdi, da signal čaka, dokler strani ne osvežiš — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8029-x-p3--predal-obvestil-še-naprej-trdi-da-signal-čaka-dokler-strani-ne-osvežiš--popravljeno-2026-09-27).

### 80.30 [x] P2 — Nepovratni izbris stranke se potrdi z angleškim navodilom in angleško besedo — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8030-x-p2--nepovratni-izbris-stranke-se-potrdi-z-angleškim-navodilom-in-angleško-besedo--popravljeno-2026-09-27).

### 80.31 [x] P2 — Po izbrisu stranke profil še vedno kaže ime, telefon in cilje — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8031-x-p2--po-izbrisu-stranke-profil-še-vedno-kaže-ime-telefon-in-cilje--popravljeno-2026-09-27).

### 80.32 [x] P3 — Skupinski trening, začet iz rutine, nima svojega naslova; osvežitev ga izbriše — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8032-x-p3--skupinski-trening-začet-iz-rutine-nima-svojega-naslova-osvežitev-ga-izbriše--popravljeno-2026-09-27).

### 80.33 [x] P3 — Dva prevajalna ključa ne obstajata, zato se uporabniku pokaže ključ sam — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8033-x-p3--dva-prevajalna-ključa-ne-obstajata-zato-se-uporabniku-pokaže-ključ-sam--popravljeno-2026-09-27).

### 80.34 [x] P3 — »Glasovna opomba (zasebnost-prva)« je izmišljen izraz — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8034-x-p3--glasovna-opomba-zasebnost-prva-je-izmišljen-izraz--popravljeno-2026-09-27).

### 80.35 [x] P1 — Glasovna opomba si izmisli stavek o stranki in ga zapiše v njeno kartoteko — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8035-x-p1--glasovna-opomba-si-izmisli-stavek-o-stranki-in-ga-zapiše-v-njeno-kartoteko--popravljeno-2026-09-27).

### 80.36 [x] P2 — »Anonimna kopija za AI« s seboj odnese cilje in zdravstvene opombe — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8036-x-p2--anonimna-kopija-za-ai-s-seboj-odnese-cilje-in-zdravstvene-opombe--popravljeno-2026-09-27).

### 80.37 [x] P2 — Pred nepovratno zamenjavo podatkov piše, kaj bo izgubljeno, v angleščini — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8037-x-p2--pred-nepovratno-zamenjavo-podatkov-piše-kaj-bo-izgubljeno-v-angleščini--popravljeno-2026-09-27).

### 80.38 [x] P2 — Uvoz pravi »združilo ali prepisalo«, v resnici vedno zamenja — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8038-x-p2--uvoz-pravi-združilo-ali-prepisalo-v-resnici-vedno-zamenja--popravljeno-2026-09-27).

### 80.39 [ ] P3 — Obrazca za povratno informacijo in za napako mešata slovenščino in angleščino

**Stanje 2026-09-30 (librept-02): čaka na Simona**, kot pravi točka sama: sta obrazca namenjena
Simonu in tujim sodelavcem (vse angleško) ali trenerju (v njegovem jeziku)?

**Scenarij in koraki:** trener v meniju ☰ izbere »Pošlji povratno informacijo« in nato »Napiši
e-pošto«, oziroma »Prijavi napako na GitHubu«.

**Opaženo:** obe pripravljeni besedili sta mešani. E-pošta se začne slovensko (»Kar sem hotel
povedati:«), podatki pod črto pa so angleški (»Build«, »Page«, »Language«, »Screen«). Prijava
napake ima slovenski začetek naslova (»Napaka: «) in slovensko vprašanje v skritem komentarju,
naslovi razdelkov pa so angleški: »**What happened**«, »**A screenshot**«, »**Details LibrePT
filled in**«, prav tako opozorilo, naj trener na sliki zakrije podatke strank.

**Težava in vpliv:** trener, ki angleško ne bere, v obrazcu ne ve, kam kaj spada — in prav to
opozorilo o zakrivanju podatkov strank je tisto, ki ga mora razumeti.

**Odločitev, ki jo to terja:** ali sta ti dve besedili namenjeni Simonu in mednarodnim
sodelavcem (potem naj bosta v celoti angleški, tudi vprašanje in opozorilo) ali trenerju (potem
naj bosta v njegovem jeziku, z angleškim povzetkom le v podatkih o gradnji). Mešanica ne služi
nobenemu.

**Preverjanje:** ko bo odločeno, naj preizkus zahteva, da je pripravljeno besedilo v enem jeziku.
Opaženo na objavljeni različici `0625bd6`.

### 80.40 [x] P1 — Dva odprta zavihka: tisti, ki shrani pozneje, izbriše delo drugega — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8040-x-p1--dva-odprta-zavihka-tisti-ki-shrani-pozneje-izbriše-delo-drugega--popravljeno-2026-09-27).

### 80.41 [ ] P2 — Trije izhodi iz obrazca za stranko, dva izida: »Prekliči« zavrže, ✕ in Esc obdržita

**Opaženo** (`0625bd6`, koda na `main` ista): v »Dodaj stranko« vpisati ime in zapreti. »Prekliči«
zapis zavrže; ✕ in Esc ga obdržita, stranka ostane v imeniku. Obrazec, zaprt brez vpisa, ne pusti
ničesar. Enako pri vajah in rutinah: »Esc vaja« in »Esc rutina« ostaneta, »Preklic rutina« izgine.

**Vzrok:** obrazci pišejo zapis ob vsaki tipki
([clientFormsController.js](src/controllers/clientFormsController.js)). Simon je 2026-09-17 odločil:
»Prekliči« razveljavi, vsak drug izhod (Shrani, ✕, Esc, Nazaj, menjava pogleda) zapis dokonča
([liveRecordForm.js](src/modules/common/liveRecordForm.js)). Vedenje torej sledi odločitvi.

**Težava:** trener ne izve, da je stranka nastala; v imeniku, ki ga preiskuje med treningom, se
nabirajo na pol vpisane stranke.

**Čaka na Simona:** ali ✕ in Esc preideta k »Prekliči«, ali obrazec ob njiju vpraša, ali ostane, kot
je, in se samo pokaže, da je stranka nastala. Preizkus: vsi trije izhodi z vpisanim imenom dajo isti
izid.

**Odstopa od pravila** (`8b2ce80`, sl, 390 × 844): v Nastavitve → Moji podatki telefon spremeniti in
zapreti z Esc ali s ✕ »Zapri«. Ob ponovnem odprtju je v polju spet stara številka. Po veljavnem
pravilu bi se popravek ohranil. Kode nismo pregledali. Enako vprašanje ima okno »Uveljavi spremembo
programa« (§80.133).

### 80.42 [x] P2 — Izvoz podatkov, ki ga prebere stranka, je v celoti angleški — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8042-x-p2--izvoz-podatkov-ki-ga-prebere-stranka-je-v-celoti-angleški--popravljeno-2026-09-27).

### 80.43 [x] P2 — Če trener ni vpisal svojih podatkov, v dokumentu piše »[trainer name]« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8043-x-p2--če-trener-ni-vpisal-svojih-podatkov-v-dokumentu-piše-trainer-name--popravljeno-2026-09-27).

### 80.44 [x] P2 — Uvoz programa odgovori na napako v angleščini, z malo začetnico — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8044-x-p2--uvoz-programa-odgovori-na-napako-v-angleščini-z-malo-začetnico--popravljeno-2026-09-27).

### 80.45 [x] P3 — »Nikogar posebej« pri uvozu programa vseeno izbere prvo stranko — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8045-x-p3--nikogar-posebej-pri-uvozu-programa-vseeno-izbere-prvo-stranko--popravljeno-2026-09-27).

### 80.46 [x] P2 — Na podlogi skupinskega treninga sta dve stranki z istim imenom oba »Ana« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8046-x-p2--na-podlogi-skupinskega-treninga-sta-dve-stranki-z-istim-imenom-oba-ana--popravljeno-2026-09-27).

### 80.47 [x] P3 — »Vsi na ta načrt« preklaplja v obe smeri, napis pa se ne spremeni — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8047-x-p3--vsi-na-ta-načrt-preklaplja-v-obe-smeri-napis-pa-se-ne-spremeni--popravljeno-2026-09-27).

### 80.48 [x] P3 — Trening, ki se konča pred svojim začetkom, se shrani brez besede — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8048-x-p3--trening-ki-se-konča-pred-svojim-začetkom-se-shrani-brez-besede--popravljeno-2026-09-27).

### 80.49 [x] P3 — Pri brisanju enega večera ponavljajočega se treninga ni povedano, da gre za en večer — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8049-x-p3--pri-brisanju-enega-večera-ponavljajočega-se-treninga-ni-povedano-da-gre-za-en-večer--popravljeno-2026-09-27).

### 80.50 [x] P2 — Stran, na kateri stranka odgovori na vabilo, kaže »12:00 PM« in »Thursday, October 8« — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8050-x-p2--stran-na-kateri-stranka-odgovori-na-vabilo-kaže-1200-pm-in-thursday-october-8--popravljeno-2026-09-27).

### 80.51 [x] P1 — Stranka izbere odgovor na vabilo, poslati pa ga nima s čim — popravljeno 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8051-x-p1--stranka-izbere-odgovor-na-vabilo-poslati-pa-ga-nima-s-čim--popravljeno-2026-09-27).

### 80.52 [ ] P1 — Spremembe načrta nezačetega treninga izginejo, ko trening odpreš znova s kartice

**Opaženo** (dan trenerja 01, §88; ponovljeno na `main`): trener odpre jutrišnji trening s kartice, v
⋮ »Uredi načrt« doda ali preimenuje vajo, »Končano«, se z ročico vrne na ploščo in trening spet odpre s
kartice. Načrt je spet tak, kot ga da rutina (»Probe Movement« je spet »Face Pulls«), brez besede, tudi
po osvežitvi. Enako izgine sklop s krogi (`0625bd6`, »SIM Ravnotežje in moč«, dva kroga, Wall Sit).

**Sprememba teže** (`8b2ce80`, prej §80.91): prihodnji trening »Ponedeljkova moc«, Barbell Bench Press
z 62.5 na 90, »Končano z urejanjem načrta«. Podloga kaže 90 kg, po osvežitvi 62.5; v `sessions` in
`planUpdates` ni zapisa, opozorila ni. Trener, ki za mizo pripravi obremenitve za teden, tega ne izve.

**Zaključek izbriše ročno sestavljen načrt** (`main` `12d0e66`, 2026-09-30): trening »Moč« za jutri brez
rutine, tri vaje z 12, 30 in 25 kg, »Začni trening«, »Zaključi vadbo« brez zapisane vaje (§80.6). Nato
podloga »Vaj še ni.«, stran stranke »Ni še zabeleženih vadb.«, ni niti »Shrani kot rutino«; v IndexedDB
ni nobene od treh vaj.

**Vzrok, potrjen v kodi:** načrt treninga, ki se še ni začel, živi samo v eni podlogi,
`librept_active_session`. Tap na kartico ([sessionCard.js](src/modules/sessionList/sessionCard.js))
pokliče `launchClipboardDirectly` ([sessionsView.js](src/modules/sessionList/sessionsView.js)) in
`startWorkoutSession`, ki podlogo zgradi na novo iz rutine. Načrt zato izgine ob osvežitvi in ob
odprtju katerega koli drugega treninga.

**Preprost popravek ne zadošča** (preizkušeno 2026-09-29): tap, ki vrne na že odprto podlogo, ohrani
načrt, izgubi pa udeleženca, dodanega treningu pozneje (pokvari demo korak »Pritisni Johnovo ime«).

**Popravek, ki drži:** načrt vsakega udeleženca se shrani pri treningu samem. Simon je 2026-09-30
odločil, da je trening en zapis s stanjem (§95, stanje »planned« v §95.2), zato ta točka čaka na §95.
Preizkus: spremeniti načrt nezačetega treninga, osvežiti, odpreti s kartice in s spodnje vrstice, nato
zaključiti — sprememba je povsod, tudi na strani stranke. Na `0625bd6` sta spodnja vrstica in kartica
po spremembi rutine vrnili različno težo (4 kg in 6 kg).

### 80.53 [x] P2 — Načrt treninga, vpisanega za nazaj, po osvežitvi izgine — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8053-x-p2--načrt-treninga-vpisanega-za-nazaj-po-osvežitvi-izgine--popravljeno-2026-09-29).

### 80.54 [ ] P3 — Filtri kataloga vaj so v slovenščini angleški: »Chest«, »Barbell«, »Bodyweight«

**Opaženo** (`?lang=sl`, »Uredi načrt« → »Dodaj iz kataloga«): vrstici filtrov imata slovenski
oznaki, gumbi pa so angleški: »All, Chest, Back, Legs, …« in »Barbell, Dumbbell, Cable, …«. V
nemščini (`e2daf5e`) isto; na istem zaslonu »Alle« (vir) in »All« (mišica, oprema), oznake na
karticah mešajo »AUSDAUER« s »CONDITIONING« in »HORIZONTAL PUSH«. Enako angleške so možnosti v
obrazcu za vajo ([exerciseFormsController.js](src/controllers/exerciseFormsController.js),
`<option value="Chest">Chest</option>`); v knjižnici se prva možnost glasi »Vse«, v izbirniku »All«.

**Vzrok:** [exercisePicker.js](src/modules/exercises/exercisePicker.js) da prevedene besede le vrstici
izvora (`sources.words`); vrednosti `MUSCLE_GROUPS` in `EQUIPMENT` izpiše dobesedno.

**Čaka na Simona** v §38.20 (»Decision, not work — Simon«): ali mišične skupine, oprema in vzorci
gibanja dobijo besedo v vsakem jeziku. Popravek: ključi `muscle_*` in `equipment_*` v treh slovarjih;
shranjena vrednost ostane angleška, ker jo bere preslikava wger (§13.1). Preizkus: v slovenščini noben
gumb filtra ni angleški.

**V istem popravku:** kartica rutine skrajša seznam z angleškim »+2 more« (`8b2ce80`). Angleški opisi
vzorčnih rutin so vzorčni podatek, ne besedilo vmesnika.

### 80.55 [x] P3 — Kartica treninga pravi samo »Nedoločen«, trener pa to bere kot stanje — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8055-x-p3--kartica-treninga-pravi-samo-nedoločen-trener-pa-to-bere-kot-stanje--popravljeno-2026-09-29).

### 80.52 [x] P2 — Gumb »Shrani« je ob odprtju obrazca pod robom zaslona — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8052-x-p2--gumb-shrani-je-ob-odprtju-obrazca-pod-robom-zaslona--popravljeno-2026-09-29).

### 80.56 [x] P2 — Iskanje strank ne najde vidnega vzdevka — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8056-x-p2--iskanje-strank-ne-najde-vidnega-vzdevka--popravljeno-2026-09-29).

### 80.57 [x] P1 — Decimalna vejica spremeni 2,5 kg v 25 kg brez opozorila — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8057-x-p1--decimalna-vejica-spremeni-25-kg-v-25-kg-brez-opozorila--popravljeno-2026-09-29).

### 80.58 [x] P2 — Prvi termin tedenske serije ima dve enaki kartici — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8058-x-p2--prvi-termin-tedenske-serije-ima-dve-enaki-kartici--popravljeno-2026-09-29).

### 80.59 [x] P2 — Neveljavni datum se brez pojasnila zamenja z drugim dnevom — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8059-x-p2--neveljavni-datum-se-brez-pojasnila-zamenja-z-drugim-dnevom--popravljeno-2026-09-29).

### 80.60 [x] P1 — Kartica »Sled predloge« odpre drug trening z drugima terminom in udeležbo — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8060-x-p1--kartica-sled-predloge-odpre-drug-trening-z-drugima-terminom-in-udeležbo--popravljeno-2026-09-29).

### 80.61 [x] P2 — Konec ponavljanja pred začetkom se shrani brez opozorila — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8061-x-p2--konec-ponavljanja-pred-začetkom-se-shrani-brez-opozorila--popravljeno-2026-09-29).

### 80.62 [ ] P2 — Izvoz kataloga izpusti shranjena navodila lastne vaje

**Opaženo** (`0625bd6`, sl): lastna vaja z dvovrstičnimi navodili. »Izvozi katalog CSV« in »Izvozi
katalog JSON« navodil nimata; polna kopija (»Izvozi JSON«) jih ima natančno, s prelomom vrstice. CSV
sicer pravilno ohrani šumnike, vejice in narekovaje. Pojasnilo izvoza izpusta ne omeni.

**Vzrok:** namerno. `toInterchangeExercise` v [exerciseStandard.js](src/domain/exerciseStandard.js)
navodila izpusti, ker jih vgrajeni katalog opušča ([exercises.js](src/data/exercises.js)). Ta razlog
velja za vgrajeni katalog, ne za navodila, ki jih trener vpiše sam in jih aplikacija pokaže med vadbo.

**Čaka na Simona:** ali kataloški izvoz nosi navodila trenerjevih lastnih vaj (in jih uvoz prebere), ali
pojasnilo izvoza pove, da jih ne nosi. Preizkus: večvrstično besedilo s šumniki, vejicami in
narekovaji.

### 80.63 [x] P2 — Časovna vaja v sklopu izgubi oznako trajanja — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8063-x-p2--časovna-vaja-v-sklopu-izgubi-oznako-trajanja--popravljeno-2026-09-29).

### 80.64 [x] P3 — Prazna plošča po filtrih reče »Počisti jih«, ne pove pa, kje — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8064-x-p3--prazna-plošča-po-filtrih-reče-počisti-jih-ne-pove-pa-kje--popravljeno-2026-09-29).

### 80.65 [x] P3 — Vzorčna obvestila v peskovniku omenjajo stranke in trening, ki jih ni — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8065-x-p3--vzorčna-obvestila-v-peskovniku-omenjajo-stranke-in-trening-ki-jih-ni--popravljeno-2026-09-29).

### 80.66 [x] P2 — Vrstica nad dnom pri prihodnjem treningu kaže stoječo številko za napačen dan — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8066-x-p2--vrstica-nad-dnom-pri-prihodnjem-treningu-kaže-stoječo-številko-za-napačen-dan--popravljeno-2026-09-29).

### 80.67 [x] P3 — Čip »Datumi« zapiše izbrano obdobje kot »5. okt. – 11. okt.«, ne v ISO — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8067-x-p3--čip-datumi-zapiše-izbrano-obdobje-kot-5-okt--11-okt-ne-v-iso--popravljeno-2026-09-29).

### 80.68 [x] P2 — Križec ✕, ki zapre okno, meri 12 × 16 pik — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8068-x-p2--križec--ki-zapre-okno-meri-12--16-pik--popravljeno-2026-09-29).

### 80.69 [~] P1 — Ocena obrazca »Dodaj stranko«: poškodba, ki jo vpiše trener, ne sproži opozorila

Ocena obrazca (način 3 veščine): nova stranka na prvem treningu. Pot: ☰ → »Imenik strank« →
»Dodaj stranko«. `main` `e55bbd2`, sl, 390 × 844. Ocena:
`.private/exploratory-test/forms/2026-09-29-01-evaluation.md`.

**Popravljeno:** P1 — poškodba, vpisana v opombe, ni sprožila opozorila; obrazec ima zdaj polje
»Poškodbe in omejitve«, iz katerega se izpelje opozorilo, »Opombe« so ločene (`d273a74`). P3 —
obvestilo »Tukaj še ni ničesar shranjenega« po prvi stranki (`7a1670d`). ✕ je §80.68.

**Odprto, čaka na Simona:**
- »Vzdevek« je vedno viden, čeprav ga oznaka omeji na dve stranki z enakim imenom.
- Razdelek GDPR (»Jezik obrazca«, »Kdo hrani obrazec?«) na dan prvega obiska, ko ga naloga ne želi
  (§27).
- Vrstni red: e-pošta je pred telefonom; naloga ima telefon vedno, e-pošto pozneje.

Manjkata še zapis prvega, že opravljenega treninga (§88.4) in teža ob prvem obisku (§78, §86.4);
oboje je zapisano tam.

### 80.70 [ ] P2 — Ocena obrazca »Nov trening«: brez imena je trening »Nastavitev treninga«, gumbi pod robom

Ocena obrazca (način 3): naslednji torek ob 18:00 za dve stalni stranki, Fitpark dvorana 2. Pot:
plošča → »Ustvari trening«. `main` `e55bbd2`, sl, 390 × 844. Ocena:
`.private/exploratory-test/forms/2026-09-29-02-evaluation.md`.

**Popravljeno 2026-09-29:** trening brez imena se imenuje »Trening«, ne »Nastavitev treninga«
(`a8939c6`); »Shrani« in »Odpri v beležki« sta ob odprtju na zaslonu (`9dfa340`); »Prazen načrt, brez
rutine« se odpre prazen (`0caf9b5`); začetek izven urnika je povedan v urah in minutah (`c3da9c7`).

**Odprto, čaka na Simona:**
- Manjka: lokacija na kartici treninga; prihodnji treningi na strani stranke; cena in plačilo (§86);
  polje za število mest (§80.81).
- Vrstni red: stranke so zadnje, naloga jih ima prve; »Ime treninga« je prvo, naloga ga ne omenja.

### 80.71 [ ] P2 — Ocena obrazca »Dodaj vajo«: izbire, ki jih trener ni naredil, se shranijo

Ocena obrazca (način 3): ozek potisk s prsi z drogom. Pot: ☰ → »Vaje in rutine« → »Dodaj vajo«.
`main` `e55bbd2`, sl, 390 × 844.

**Čaka na Simona — tip polja.** Štirje obvezni izbirni seznami se odprejo z vrednostjo (Chest,
Barbell, Horizontal Push, Moč). Vaja z vpisanim samo imenom se shrani s temi vrednostmi; od njih so
odvisni filtri, izbirnik in enota bremena. To je posledica pravila 2026-09-17 (obrazec nikoli ne
zavrne). Odločitev: ali se seznami odprejo prazni. Dokaz 2026-09-30 (`12d0e66`): oba trenerja brez
predznanja sta vpisala le ime (»Bolgarski počep«, »Dvig na prste«) in dobila »Chest«, »Barbell«,
»Horizontal Push«. »Brez opozorila, da sem pustil privzeto.« »Vzorca giba ne razumem.« Trije od štirih
seznamov so angleški (§80.54).

**Čaka na Simona — manjka:** »Kettlebell« med opremo; »Triceps« (le »Arms«); iskalne sopomenke
(§80.3); privzete serije in ponovitve.

✕ 12 × 16 je popravljen v §80.68.

### 80.72 [x] P2 — Ocena obrazca »Ustvari rutino« — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8072-x-p2--ocena-obrazca-ustvari-rutino--popravljeno-2026-09-29).

### 80.73 [x] P1 — »Sinhroniziraj podatke« je zamenjal trenerjeve treninge z vzorčnimi — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8073-x-p1--sinhroniziraj-podatke-je-zamenjal-trenerjeve-treninge-z-vzorčnimi--popravljeno-2026-09-29).

### 80.74 [x] P2 — Vaja, ki je v rutini dvakrat, si deli zapis serij — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8074-x-p2--vaja-ki-je-v-rutini-dvakrat-si-deli-zapis-serij--popravljeno-2026-09-30).

### 80.75 [x] P3 — Vzorčni peskovnik obljublja trening, ki že poteka, a ga ni — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8075-x-p3--vzorčni-peskovnik-obljublja-trening-ki-že-poteka-a-ga-ni--popravljeno-2026-09-30).

### 80.76 [x] P1 — Tap na kartico treninga, ki že teče, ga zamenja z novim, nezačetim — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8076-x-p1--tap-na-kartico-treninga-ki-že-teče-ga-zamenja-z-novim-nezačetim--popravljeno-2026-09-30).

### 80.77 [x] P2 — Po polnoči obrazec »Nastavitev treninga« privzame včerajšnji datum — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8077-x-p2--po-polnoči-obrazec-nastavitev-treninga-privzame-včerajšnji-datum--popravljeno-2026-09-30).

### 80.78 [~] P2 — Ročica, ki zapre podlogo treninga, je visoka 21 pik, tik pod njo pa je drug gumb

**Izmerjeno** (`8b2ce80`, `elementFromPoint`): ročica na vrhu podloge (»Zapri trening in se vrni na
začetek«, gumb `.view-grabber`) se odziva v pasu 86 × 21 pik, od 56. do 77. pike navpično. Od 78. pike
naprej je gumb »Nazaj na današnji trening« (98 × 44). Palec meri okoli 44 pik, zato trener namesto
zapiranja odpre drug trening in sredi vadbe izgubi mesto. Gumb za nazaj na telefonu podlogo zapre, a
tega zaslon ne pove.

**Popravljeno za predal obvestil** (`25ab13d`): dotik na prazni del vrstice predala (56–64 pik) odpre
predal, gumbi v vrstici obdržijo svoje dotike (`src/modules/common/notificationArea.js`,
`tests/medium/test_notification_footer.py`).

**Odprto za podlogo, čaka na Simona:** nevidna tarča `::before` razširi ročico na 23 pik. Nad njo je 6
pik naslovne vrstice, nato glava. Tarča 44 pik zahteva naslovno vrstico, višjo za okoli 20 pik na
vsakem zaslonu z ročico (plošča, načrti, nastavitev treninga, podloga), ali tarčo čez sredino glave.
Oboje je odločitev o prostoru na zaslonu, kot §80.25. Med tarčo in gumbom »Nazaj na današnji trening«
naj bo prazen pas.

### 80.79 [x] P2 — Kartica treninga brez udeležencev se na dotik ne odzove, noter vodi le svinčnik — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8079-x-p2--kartica-treninga-brez-udeležencev-se-na-dotik-ne-odzove-noter-vodi-le-svinčnik--popravljeno-2026-09-30).

### 80.80 [x] P1 — Vrstica »Zadnjič« na podlogi pokaže tudi serije, ki jih stranka ni naredila — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8080-x-p1--vrstica-zadnjič-na-podlogi-pokaže-tudi-serije-ki-jih-stranka-ni-naredila--popravljeno-2026-09-30).

### 80.81 [~] P1 — Ko trener na prost termin doda eno stranko, termin izgubi mesta in zamenja rutino

**Opaženo** (`8b2ce80`, vzorčni podatki): kartica »Prost termin (brez najave)« kaže »0/3 mest
zasedenih« in »Noge in trup B«. Svinčnik → iskanje »Sarah« → »Sarah Jenkins« → »Odpri v beležki«.
Kartica nato: »1/1 mest zasedenih« in »Zgornji del A« (`maxCapacity` 3 → 1, `routineId` zamenjan).
Enako pri »Skupinska moč in kondicija«: 2/7 → po odstranitvi ene stranke 1/1 → po dodani 2/2.

**Popravljeno** (`cfd4e10`): urejanje termina ne zmanjša več števila mest; stranka, dodana terminu z
rutino, dobi rutino termina.

**Odprto, čaka na Simona:** obrazec »Nastavitev treninga« nima polja za število mest, zato ga trener
nikjer ne more popraviti. Novo polje in njegov vrstni red sta Simonova odločitev (§80.70).

### 80.82 [x] P2 — Odprt in zaprt urejevalnik načrta pobriše oznako »Zaključeno« z opravljenega sklopa — popravljeno 2026-09-30 z 5ea4ada

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8082-x-p2--odprt-in-zaprt-urejevalnik-načrta-pobriše-oznako-zaključeno-z-opravljenega-sklopa--popravljeno-2026-09-30-z-5ea4ada).

### 80.83 [x] P1 — Treninga, ki se konča po polnoči, ni mogoče niti vpisati niti urediti — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8083-x-p1--treninga-ki-se-konča-po-polnoči-ni-mogoče-niti-vpisati-niti-urediti--popravljeno-2026-09-30).

### 80.84 [x] P1 — Nedokončan nov trening se prilepi na urejanje drugega treninga in ga pri shranjevanju povozi — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8084-x-p1--nedokončan-nov-trening-se-prilepi-na-urejanje-drugega-treninga-in-ga-pri-shranjevanju-povozi--popravljeno-2026-09-30).

### 80.85 [x] P2 — V skupnem načrtu je opozorilo o poškodbi ene stranke prikazano brez imena — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8085-x-p2--v-skupnem-načrtu-je-opozorilo-o-poškodbi-ene-stranke-prikazano-brez-imena--popravljeno-2026-09-30).

### 80.86 [~] P2 — Značka v glavi piše »7?« in nikjer na zaslonu ni povedano, kaj šteje

**Opaženo** (`0625bd6` in `8b2ce80`, sl): gumb z oblakom v glavi, levo od ☰, kaže število in vprašaj
(»7?«); nad devet namesto števila klicaj (»↑!«), ki je videti kot napaka. Število raste z vsakim
shranjenim delom. Kaj šteje, je bilo zapisano le v pomožnem imenu gumba, in to angleško, čeprav je
stran `lang="sl"`.

**Narejeno:** pomožno ime je v izbranem jeziku, s pravilnimi števili (`22b79bf`). Okno »Središče za
sinhronizacijo in varnostne kopije« z besedami pove, da število šteje spremembe na tej napravi, ki še
niso v Google Drive, in da je stanje v oblaku neznano, dokler Drive ni povezan (`68b56da`). Število
šteje razliko do zadnje sinhronizacije z Drive, ne do zadnje izvožene datoteke.

**Odprto, čaka na Simona:** ali značko skriti, ko oblak ni povezan. To bi spremenilo odločitev z dne
2026-08-18, da števca ostaneta vidna in siva.

**Dokaz, prvo odprtje 2026-09-30,** `main` `12d0e66`: oba trenerja brez predznanja sta okno odprla in
prebrala, pa sta ostala v skrbeh. Prvi: »"!" ne pove, kaj je narobe … Za trenerja, ki ne razume Google
Drive, je to alarm brez razlage«; skupaj z rumeno oznako »PREDOGLED«: »pomeni, da ne smem zaupati
podatkom«. Drugi, brez računa Google: »Stavek "Vprašaj v glavi" ne razumem. "Izvozi JSON" — beseda
JSON mi ne pove nič.« Nobeden ni izvedel, kam gredo podatki, če se telefon pokvari. Napis »Offline« v
isti glavi je §80.149.

### 80.87 [x] P2 — Napačna datoteka pri uvozu odgovori angleško: »Error: Invalid backup file format.« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8087-x-p2--napačna-datoteka-pri-uvozu-odgovori-angleško-error-invalid-backup-file-format--popravljeno-2026-09-30).

### 80.88 [~] P1 — V oknu, ki briše podatke, sta »Prekliči« in »Odstrani« visoka 21 pik in 4 pike narazen

**Opaženo** (`8b2ce80`): okno »Počisti vzorčne podatke« (predal na dnu → »Počisti podatke in zapusti
predstavitveni način«) je imelo gumba »Prekliči« in »Odstrani«, visoka 21 pik in 4 pike narazen; palec
pokrije oba.

**Popravljeno** (`367f4ef`): gumba sta gumba aplikacije, visoka 44 pik, z razmikom, »Odstrani« desno.
Vzrok je bil, da razreda `btn-secondary` in `btn-danger` nimata pravila v CSS.

**Odprto, čaka na Simona** (novo besedilo v oknu): okno naj pove, da izbrisa ni mogoče razveljaviti, in
pred izbrisom ponudi »Izvozi JSON«.

### 80.89 [x] P2 — Po čiščenju vzorčnih podatkov vrstica na dnu še vodi v izbrisani vzorčni trening — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8089-x-p2--po-čiščenju-vzorčnih-podatkov-vrstica-na-dnu-še-vodi-v-izbrisani-vzorčni-trening--popravljeno-2026-09-30).

### 80.90 [~] P2 — Aplikacija po čiščenju še naprej terja odstranitev testnih zapisov, gumba za to pa ni več

**Opaženo** (`8b2ce80`): svež zagon z vzorčnimi podatki, en lasten trening z vzorčno stranko Jane Doe,
nato »Počisti podatke in zapusti predstavitveni način« → »Odstrani«. Predal je še naprej terjal
odstranitev 51 testnih zapisov, gumba za to pa ni bilo več; razlogi za ohranjene zapise in imena zbirk
so bili angleški.

**Popravljeno:** opozorilo šteje le zapise, ki bi jih odstranitev izbrisala (`367f4ef`); razlogi in
imena zbirk so v jeziku trenerja (`03aeba4`).

**Odprto, čaka na Simona:** vzorčna stranka Jane Doe, ki ostane, ker je od nje odvisen trenerjev
trening, je v imeniku brez oznake »vzorec«; oznaka »PREDOGLED« ostane v glavi. Trener ne ve, ali je
aplikacija pripravljena za resnično delo.

### 80.91 [x] P1 — Sprememba teže v načrtu prihodnjega treninga po osvežitvi izgine brez besede — merged 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8091-x-p1--sprememba-teže-v-načrtu-prihodnjega-treninga-po-osvežitvi-izgine-brez-besede--merged-2026-09-30).

### 80.92 [ ] P2 — »Uveljavi in razreši« spremeni skupno rutino, okno pa govori samo o eni stranki

**Opaženo** (`8b2ce80`): stranki je bilo pretežko (»Pretežko – zmanjšaj težo«). Predal → »Treningi, ki
čakajo na pregled« → »Razreši« → »Uveljavi in razreši«. Okno govori o eni stranki (»Stranka: SIM
Ana«), spremeni pa **rutino** »SIM Rutina Ana« (Barbell Back Squat 77.5 → 75). Isto rutino izbirnik
ponudi pri vsaki stranki in vsakem terminu.

**Vpliv:** trener zniža breme eni stranki in s tem vsem na isti rutini in vsem prihodnjim terminom z
njo, ne da bi izvedel. Dokaz 2026-09-30 (`12d0e66`, poročilo trenerja-podagenta): stranki z bolečim
kolenom je v »Razreši« zamenjal počep z »Leg Press« 14 kg; naslednja stranka z isto rutino, brez težav s
kolenom, je dobila »Leg Press S3 × R10 × 14 kg«.

**Čaka na Simona** (model podatkov): ali prilagoditev velja samo za to stranko (njena kopija rutine ali
prilagoditev pri stranki) ali za vse na rutini. Najmanj v obeh primerih: okno pove, da se spremeni
rutina, in koliko strank jo uporablja. Isto vprašanje ima ocena obrazca §80.133 (»Za koga«).

### 80.93 [x] P2 — »Kopiraj ta načrt na …« ne kopira na drug dan, ampak na drugo stranko istega treninga — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8093-x-p2--kopiraj-ta-načrt-na--ne-kopira-na-drug-dan-ampak-na-drugo-stranko-istega-treninga--popravljeno-2026-09-30).

### 80.94 [x] P2 — V kartoteki stranke je signal s treninga še vedno angleški: »Too Hard - Reduce Load« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8094-x-p2--v-kartoteki-stranke-je-signal-s-treninga-še-vedno-angleški-too-hard---reduce-load--popravljeno-2026-09-30).

### 80.95 [x] P1 — Dotik »Pretežko« zapiše vajo kot opravljeno z vsemi načrtovanimi serijami — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8095-x-p1--dotik-pretežko-zapiše-vajo-kot-opravljeno-z-vsemi-načrtovanimi-serijami--popravljeno-2026-09-30).

### 80.96 [x] P2 — Prva kartica vodenega ogleda veleva pritisniti »Naprej«, tega gumba pa ni — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8096-x-p2--prva-kartica-vodenega-ogleda-veleva-pritisniti-naprej-tega-gumba-pa-ni--popravljeno-2026-09-30).

### 80.97 [x] P3 — Peskovnik napoti trenerja na seznam poglavij, ki je 325 pik pod robom zaslona — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8097-x-p3--peskovnik-napoti-trenerja-na-seznam-poglavij-ki-je-325-pik-pod-robom-zaslona--popravljeno-2026-09-30).

### 80.98 [x] P2 — Korak ogleda imenuje polje »Ime stranke«, obrazec pa ima »Ime in priimek« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8098-x-p2--korak-ogleda-imenuje-polje-ime-stranke-obrazec-pa-ima-ime-in-priimek--popravljeno-2026-09-30).

### 80.99 [x] P2 — Kartica »Ta zaslon ni del demota« pokrije oba gumba zaslona, na katerem stoji — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#8099-x-p2--kartica-ta-zaslon-ni-del-demota-pokrije-oba-gumba-zaslona-na-katerem-stoji--popravljeno-2026-09-30).

### 80.100 [x] P2 — Berljiv izvoz podatkov za stranko meša prihodnje termine z opravljenimi, je delno angleški, in pogreša obljubljeno spremembo načrta — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80100-x-p2--berljiv-izvoz-podatkov-za-stranko-meša-prihodnje-termine-z-opravljenimi-je-delno-angleški-in-pogreša-obljubljeno-spremembo-načrta--popravljeno-2026-09-30).

### 80.101 [x] P2 — Izbrisana stranka ima še vedno cel zaslon stranke in ponuja izvoz svojih podatkov — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80101-x-p2--izbrisana-stranka-ima-še-vedno-cel-zaslon-stranke-in-ponuja-izvoz-svojih-podatkov--popravljeno-2026-09-30).

### 80.102 [x] P2 — Preklic privolitve nima polja za datum in ne pove, kaj se z njim ustavi — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80102-x-p2--preklic-privolitve-nima-polja-za-datum-in-ne-pove-kaj-se-z-njim-ustavi--popravljeno-2026-09-30).

### 80.103 [x] P1 — Odprtje in zapiranje enega večera serije ustvari drugo, enako kartico istega večera — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80103-x-p1--odprtje-in-zapiranje-enega-večera-serije-ustvari-drugo-enako-kartico-istega-večera--popravljeno-2026-09-30).

### 80.104 [x] P2 — Izbrisana serija pusti za sabo programe brez datuma, ki jih ni mogoče razločiti — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80104-x-p2--izbrisana-serija-pusti-za-sabo-programe-brez-datuma-ki-jih-ni-mogoče-razločiti--popravljeno-2026-09-30).

### 80.105 [ ] P1 — Stranka brez imena se shrani kot »Nova stranka«, čeprav je ime obvezno

**Opaženo** (`8b2ce80`): »Dodaj stranko«, polja »Ime in priimek *« se ne dotakniti, vpisati cilj,
»Shrani«. Okno se zapre brez sporočila; v imeniku je »Nova stranka« s tem ciljem, čeprav ima polje
zvezdico in `required`. Pri dveh takih trener ne ve, katera je katera.

**Vzrok je pravilo, ne izvedba.** Simon je 2026-09-17 odločil: »A new record exists from the first
typed character. An empty required field is written as a placeholder ("New client", …) — no alert, no
refusal.«

**Čaka na Simona:** ali sme trener zapustiti obrazec z neimenovano stranko brez besede. Tri poti brez
zavrnitve shranjevanja:
1. vrstica brez imena je v imeniku označena (»brez imena«), da jo trener najde in dopolni;
2. polje že ob odprtju kaže podomestek kot vrednost;
3. podomestek velja za vse razen imena; ime zadrži zapiranje z besedilom pri polju, kot uvodni obrazec
   (»Izpolni to polje.«).

Popravljeno (`a84138b`): začetnice sledijo imenu tudi pri preimenovanju (prej »NS« po »Nova
stranka«); posebej nastavljen znak se ne povozi.

### 80.106 [x] P3 — Vprašanje pred zaključkom treninga šteje čas v minutah: »še približno 3812 minut« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80106-x-p3--vprašanje-pred-zaključkom-treninga-šteje-čas-v-minutah-še-približno-3812-minut--popravljeno-2026-09-30).

### 80.107 [x] P3 — Kartica zaključenega treninga takoj po zaključku še vedno piše »Aktiven trening« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80107-x-p3--kartica-zaključenega-treninga-takoj-po-zaključku-še-vedno-piše-aktiven-trening--popravljeno-2026-09-30).

### 80.108 [x] P3 — Na 320 × 680 je od gumba »Shrani in nadaljuj« na uvodnem zaslonu vidne štiri pike — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80108-x-p3--na-320-×-680-je-od-gumba-shrani-in-nadaljuj-na-uvodnem-zaslonu-vidne-štiri-pike--popravljeno-2026-09-30).

### 80.109 [x] P2 — Ocena trajanja istega intervala je odvisna od zapisa časa — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80109-x-p2--ocena-trajanja-istega-intervala-je-odvisna-od-zapisa-časa--popravljeno-2026-09-30).

### 80.110 [~] P2 — »Shrani kot rutino« pozabi težo, številke v poljih so odrezane, polja nimajo oznak

**Opaženo** (`main` `12d0e66`, sl, 390 × 844): trening »Skupina torek« brez rutine, tri vaje iz kataloga
(Dumbbell Goblet Squat 3 × 10, 12 kg). Po zaključku na strani stranke »Shrani kot rutino«: vse tri
vaje imajo težo 0.

**Popravljeno** (`b331017`): rutina iz treninga brez rutine dobi naslov treninga, ne »Prazen načrt,
brez rutine 2026-09-30«; polja v obrazcu rutine imajo vidne oznake in niso več odrezana.

**Odprto, čaka na Simona — teža.** §17.4 določa, da rutina iz treninga dnevne teže izpusti (»strips
person/day-specific magnitudes (`weight` …)«). Če trener tega ne opazi, naslednja stranka dobi počep z
0 kg. Odločitev: ali rutina prevzame težo iz načrta. Soroden predlog je §94, točka 2.

### 80.111 [x] P2 — Nova stranka: gumba pravita »E-pošta ni vpisana« in »Telefon ni vpisan«, čeprav sta vpisana — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80111-x-p2--nova-stranka-gumba-pravita-e-pošta-ni-vpisana-in-telefon-ni-vpisan-čeprav-sta-vpisana--popravljeno-2026-09-30).

### 80.112 [x] P3 — Gumb »Ni se zgodila« v oknu, ki govori o »treningu« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80112-x-p3--gumb-ni-se-zgodila-v-oknu-ki-govori-o-treningu--popravljeno-2026-09-30).

### 80.113 [x] P1 — Uvoz programa izgubi serije, ponovitve in težo, tudi pri primeru, ki ga pokaže aplikacija — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80113-x-p1--uvoz-programa-izgubi-serije-ponovitve-in-težo-tudi-pri-primeru-ki-ga-pokaže-aplikacija--popravljeno-2026-09-30).

### 80.114 [~] P2 — Zaključen trening s tremi vajami piše »Program ni določen« in »Zaključeno 00:01«

**Opaženo** (`main` `12d0e66`): trening »Skupina torek« brez rutine s tremi vajami, začet in zaključen.
Kartica: »1/1 mest zasedenih«, »Program ni določen«, »Zaključeno«, »00:01«. Trener brez predznanja pri
skupini treh strank: »oznaka ne pove, za koga« in »prikaz zgleda kot ura, ne kot trajanje«.

**Popravljeno** (`3210821`): »Program ni določen« le pri treningu brez vsakega načrta; zaključen
trening se prepozna po zapisu v zgodovini istega dne.

**Odprto, čaka na Simona:** kako zapisati trajanje. »00:01« je oblika polja za urejanje; trener jo
bere kot uro zaključka. Predlog: »trajal 1 min«. Nezačet trening z ročno sestavljenim načrtom še kaže
»Program ni določen«, ker načrt ni shranjen pri treningu (§80.52).

### 80.115 [x] P2 — Na slovenski podlogi vaja po »Prelahko« dobi oznako »Completed« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80115-x-p2--na-slovenski-podlogi-vaja-po-prelahko-dobi-oznako-completed--popravljeno-2026-09-30).

### 80.116 [x] P2 — Okno »Trening se je začel izven urnika« skrije »Končni čas« desno od roba — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80116-x-p2--okno-trening-se-je-začel-izven-urnika-skrije-končni-čas-desno-od-roba--popravljeno-2026-09-30).

### 80.117 [x] P3 — Trening čez teden dni »se začne čez 870h 01m« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80117-x-p3--trening-čez-teden-dni-se-začne-čez-870h-01m--popravljeno-2026-09-30).

### 80.118 [ ] P2 — Zaslon treninga ima dve imeni, »beležka« in »podloga«, in nobeno ni razloženo

**Scenarij in koraki:** prvi zagon. Prebrati prvi stavek aplikacije, nato ustvariti trening in
pritisniti »Odpri v beležki«.

**Opaženo:** prvi stavek pravi »Lahek in brezplačen pripomoček za tvojo podlogo, treninge in
programe vadbe.« Gumb, ki odpre zaslon treninga, pravi »Odpri v beležki«; ročica istega zaslona
»Odpri podlogo treninga«; obrazec »Poteka vzporedno — odpre se kot ena podloga«; vodeni ogled
»beležka med vadbo«. Slovenski slovar aplikacije ima »beležk« trikrat in »podlog« petkrat. Oba
trenerja brez predznanja sta se ustavila: »ne vem, kaj je podloga. Mislim, da podlaga za vadbo
(preproga?)«; »"Odpri v beležki" — beležka? Mislil sem, da je to zvezek«; »kaj je podloga?«.

**Težava in vpliv:** prvi stavek aplikacije trenerju ne pove, kaj aplikacija je. Ko prebere
»podloga« in »beležka«, ne ve, da gre za isti zaslon. Sledi navodilu, ki imenuje eno, na zaslonu
pa vidi drugo.

**Predlog:** en izraz za ta zaslon v vseh besedilih, in tak, ki ga trener pozna brez razlage
(na primer »trening« ali »vadba«: »Odpri trening«). Izbira besede je Simonova. Opaženo na `main`
`12d0e66`, sl, 390 × 844.

### 80.119 [x] P2 — Zgodovina stranke izpusti težo: »Dumbbell Goblet Squat: 10, 10, 10« pri 12 kg — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80119-x-p2--zgodovina-stranke-izpusti-težo-dumbbell-goblet-squat-10-10-10-pri-12-kg--popravljeno-2026-09-30).

### 80.120 [x] P2 — Pod poškodbo kolena stran stranke pravi »Brez zabeleženih zdravstvenih težav« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80120-x-p2--pod-poškodbo-kolena-stran-stranke-pravi-brez-zabeleženih-zdravstvenih-težav--popravljeno-2026-09-30).

### 80.121 [x] P2 — »Zamenjaj vajo« stranki z bolečim kolenom vnaprej izbere Barbell Back Squat — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80121-x-p2--zamenjaj-vajo-stranki-z-bolečim-kolenom-vnaprej-izbere-barbell-back-squat--popravljeno-2026-09-30).

### 80.122 [x] P3 — Koledar »Datumi« ne pokaže ne današnjega dne ne dni s treningi — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80122-x-p3--koledar-datumi-ne-pokaže-ne-današnjega-dne-ne-dni-s-treningi--popravljeno-2026-09-30).

### 80.123 [x] P2 — Podloga treninga čez dva ali več dni v glavi ne pove dneva, samo »Prihodnje« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80123-x-p2--podloga-treninga-čez-dva-ali-več-dni-v-glavi-ne-pove-dneva-samo-prihodnje--popravljeno-2026-09-30).

### 80.124 [x] P2 — Oznaka »PREDOGLED« vodi na »Stran ni najdena«, ko je aplikacija že naložena — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80124-x-p2--oznaka-predogled-vodi-na-stran-ni-najdena-ko-je-aplikacija-že-naložena--popravljeno-2026-09-30).

### 80.125 [x] P3 — Na slovenski strani so pomožna imena gumbov za bralnik zaslona angleška — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80125-x-p3--na-slovenski-strani-so-pomožna-imena-gumbov-za-bralnik-zaslona-angleška--popravljeno-2026-09-30).

### 80.126 [x] P3 — Pred izbiro jezika stran nima `<html lang>`, besedilo za oknom pa je angleško — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80126-x-p3--pred-izbiro-jezika-stran-nima-html-lang-besedilo-za-oknom-pa-je-angleško--popravljeno-2026-09-30).

### 80.127 [x] P1 — Datum, vpisan po slovensko »6.10.2026«, se tiho shrani kot 6102-02-06 — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80127-x-p1--datum-vpisan-po-slovensko-6102026-se-tiho-shrani-kot-6102-02-06--popravljeno-2026-09-30).

### 80.128 [x] P2 — Prazna slovenska aplikacija predlaga angleška imena treningov in krajev — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80128-x-p2--prazna-slovenska-aplikacija-predlaga-angleška-imena-treningov-in-krajev--popravljeno-2026-09-30).

### 80.129 [~] P3 — Ob začetku treninga ni odprta prva vaja: ali nobena ali zadnja dodana

**Opaženo** (`main` `12d0e66`): (a) trening z rutino »Moč A«, »Začni trening«: vse tri vaje pišejo
»Prihodnje«, nobena ni odprta, »Prelahko«, »Pretežko« in »Opombe« ni. (b) trening z ročno dodanimi
vajami: odprta je bila zadnja dodana vaja. »Pričakoval sem, da bo odprta prva vaja … mislil sem, da
sta ti dve že opravljeni.«

**Popravljeno (b)** (`ba6c546`): »Začni trening« za aktivno vajo izbere prvo, ki še ni opravljena.

**Odprto (a), čaka na Simona:** da se nov trening odpre z vsemi vajami zaprtimi, je zapisana odločitev
v `sessionPlanFactory.js`. Ali ob »Začni trening« odpreti prvo vajo, je sprememba te odločitve.
Prihranek: en dotik na trening (§94, točka 8).

### 80.130 [x] P2 — Vsaka stranka, dodana na trening, samodejno dobi prvo rutino v knjižnici — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80130-x-p2--vsaka-stranka-dodana-na-trening-samodejno-dobi-prvo-rutino-v-knjižnici--popravljeno-2026-09-30).

### 80.131 [x] P2 — Takoj po zaključku treninga predal pravi »Vse je pregledano«, signal se pokaže šele po osvežitvi — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80131-x-p2--takoj-po-zaključku-treninga-predal-pravi-vse-je-pregledano-signal-se-pokaže-šele-po-osvežitvi--popravljeno-2026-09-30).

### 80.132 [~] P2 — Teža pri Lat Pulldown se shrani kot »Lvl 60«; polje enoto pove le angleško in le, ko je prazno

**Opaženo** (`main` `e8e90d8`, trener dneva 07): v »Ustvari rutino« za Lat Pulldown vpisati 60 (trener
misli kilograme). Rutina: »Lat Pulldown 3×10 · Lvl 60«. »Ni jasno, kaj pomeni in kako vnesti kg.«
Katalog vodi to vajo v stopnjah, večina naprav za poteg pa ima ploščice v kilogramih.

**Popravljeno** (`151b92d`): enota je v jeziku aplikacije (»Stopnja 60«) in stoji ob polju tudi z
vpisano številko.

**Odprto, čaka na Simona:** ali vaja na napravi dovoli kilograme.

### 80.133 [~] P2 — Ocena obrazca »Uveljavi spremembo programa«: ne pove vaje ne stare vrednosti, Esc zavrže

**Stanje 2026-09-30 (librept-02):** okno pove vajo (»Vaja: …«), oznaka polja sledi enoti vaje
(stopnja, elastika, dodatna teža ali kg) (`22df0f8`). **Odprto, čaka na Simona:** kaj naredita Esc
in ✕. Okno ne piše sproti kot obrazec, zato pravilo »zavrže le Prekliči« zanj ne velja samo po sebi;
enako vprašanje je pri »Moji podatki«. Odprto ostaja tudi: »prej«, za koga, od katere seje,
ponovitve odprejo številsko tipkovnico, kadar je v polju število (`f5c0744`).

Način 3. Naloga (podagent, pred ogledom obrazca): stranki je bila vaja pretežka, po treningu ji
popravi program. Pot: »Treningi, ki čakajo na pregled« → vrstica stranke → »Razreši«. `main`
`e8e90d8`, sl, 390 × 844 in 320 × 680 (brez premikanja, gumbi na zaslonu, nobena tarča pod 44 pik).
Naloga podagenta: `.private/exploratory-test/forms/2026-09-30-06-task.md`. Stranka Ana Zupan, rutina
»Test pon«, dva signala »Pretežko« (Dumbbell Goblet Squat pri 0 kg, Lat Pulldown pri »Lvl 60«).

**Odveč.** Nič: okno ne sprašuje ničesar, kar bi naloga imela za odveč.

**Manjka.**
- **Katera vaja** (P2). Naloga: »Vaja, ki je bila pretežka — VEDNO«. Okno pove »Stranka«,
  »Povratna informacija«, »Podrobnosti«, vaje ne. Pri dveh signalih iste stranke sta okni enaki do
  številk; seznam za oknom vajo pove (»Vaja: Dumbbell Goblet Squat«).
- **Stara vrednost** (P3). Naloga: »Nova teža 10 kg (prej 12)«. Polja so predizpolnjena (dobro), »prej«
  pa ni napisano nikjer; po prvem popravku trener ne ve več, iz česa je izšel.
- **Za koga** (čaka na Simona, §80.92): naloga zahteva »samo ta stranka / vsi s tem programom«;
  okno spremeni skupno rutino (preverjeno: »Lat Pulldown 3×8 · Lvl 55.5« v knjižnici).
- **Od katere seje** (čaka na Simona): naloga »od naslednje seje (četrtek)«; polja ni.

**Ne deluje.**
- **Esc zavrže vpisano** (P2). Ponovitve spremenjene z 18 na 12, Esc, ponovno »Razreši«: spet 18.
  Pravilo 2026-09-17: zavrže le »Prekliči«, vsak drug izhod ohrani.
- **Enota ne ustreza vaji** (P2). Pri Lat Pulldown, ki ga katalog vodi v stopnjah (»Lvl 60«, §80.132),
  okno predlaga 57.5 pod oznako »Ciljna teža (kg)«.
- Vejica deluje: »55,5« je shranjeno kot 55.5. »Uveljavi in razreši« zapiše spremembo v rutino.

**Napačen tip ali vrstni red.**
- **Ponovitve so besedilno polje brez številske tipkovnice**, serije so številsko polje, teža ima
  decimalno tipkovnico (P3). Na telefonu se pri ponovitvah odpre cela tipkovnica.
- Vrstni red sledi nalogi (kaj se spremeni, nato teža, ponovitve, serije).

Trenerjeva preverba po koncu: »Odprem njeno današnjo sejo, ki je že bila: stara vrednost je ostala.«
Tega ni mogel preveriti, ker trening brez zapisane vaje ne pride v zgodovino (§80.6).

### 80.134 [~] P1 — Ocena obrazca »Uredi načrt«: načrt za jutri po osvežitvi izgine, ogrevanje ne more biti časovno

**Stanje 2026-09-30 (librept-02):** urejevalnik pravi »Krogi«, kot podloga (`b95c673`). Vaja po
meri je lahko časovna (»Merjeno v«), 8:00 šteje 8 minut, in vaja iz kataloga ne prinese več počitka
60 s, ki ga trener ni dodal (`c1bd2b8`). Prazno vrstico v novem sklopu »Končano« odstrani (test
`test_a_new_circuit_left_empty_leaves_no_nameless_row`); ostane le, če trener zapusti urejanje brez
»Končano«, na primer z osvežitvijo, kar ostaja kot manjša nevšečnost. **Odprto:** izginuli načrt
čaka na §80.52, opomba pri vaji na Simona.

Način 3. Naloga (podagent, pred ogledom obrazca): zvečer načrt jutrišnjega enournega treninga za
stranko z bolečo levo ramo: ogrevanje 8 min, štiri vaje s serijami, ponovitvami in težo, dve od
njih v paru za 3 kroge, počitki, plank 3 × 40 s. Naloga podagenta:
`.private/exploratory-test/forms/2026-09-30-07-task.md`. Pot: trening »Moč« jutri 17:00, stranka
Maja Novak brez rutine → podloga → ⋮ → »Uredi načrt«. `main` `e8e90d8`, sl, 390 × 844.

**Odveč.** Nič. Trening, stranka in ura so že znani; urejevalnik jih ne sprašuje znova.

**Manjka.**
- **Opomba pri vaji** (čaka na Simona). Naloga: »Potisk ima opombo o rami, vidno, ko ga odprem.«
  Vrstica ima le ime, serije, ponovitve, težo in sklop; opombo je mogoče napisati le v ime vaje.
- **Časovna vaja po meri** (P2). Ogrevanje »Vaja« brez kataloga ima le ponovitve: »8:00« je na
  podlogi »S1 × R8:00«, »480« pa »S1 × R480«; ocena trajanja ogrevanje šteje kot 1 minuto
  (»1 / 60 min«). Katalogove časovne vaje (Plank: »DRŽA«, »S3 × 0:40 × BW«) to znajo.

**Ne deluje.**
- **Načrt po osvežitvi izgine** (P1, §80.52). Šest vaj, sklop in počitki, »Končano z urejanjem
  načrta«; podloga pokaže ves načrt. Osvežitev in dotik iste kartice: »Ni vstavljenih vaj.« Naloga je
  prav to: »Ko aplikacijo zaprem in odprem brez omrežja, je vse še tam.«
- **Sklop ob dodajanju ustvari prazno vajo** (P3). Po »Sklop« je v njem vrstica brez imena; ostane,
  dokler je trener ne odstrani z »Odstrani«.
- Počitki: za sklopom sta na podlogi dva »Počitek 60s«, ki ju trener ni dodal; naloga zahteva 0 s
  med vajama v paru in 90 s po paru.

**Napačen tip ali vrstni red.**
- **Dve imeni za krog** (P3): urejevalnik »Runde« (pri polju za število krogov), podloga »KROG 1 / 3«.
- Nova kataloška vaja se ne odpre sama; odpre jo le »Razširi« (§94, točka 3).
- Dobro: fokus je v imenu nove vaje, ocena trajanja opozori »49 / 60 min · na tesnem«, plank je
  časovna vaja s poljem »DRŽA«, vrstni red na podlogi je enak vrstnemu redu v urejevalniku.

### 80.135 [x] P2 — Trening, ki teče, se brez vprašanja prestavi na drug dan; tam ostane »Zaključeno« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80135-x-p2--trening-ki-teče-se-brez-vprašanja-prestavi-na-drug-dan-tam-ostane-zaključeno--popravljeno-2026-09-30).

### 80.136 [ ] P1? — Šifrirana varnostna kopija v brskalniku orodja ne pride do datoteke; preveriti na telefonu

**Scenarij in koraki:** ☰ → »Upravljanje podatkov« → »Izvozi JSON« → okno »Geslo za varnostne
kopije« → »Zapisal sem si ga, shrani« → »Izvozi JSON«.

**Opaženo:** na zaslonu »Izvoženo in šifrirano.« in gumb »Odpri šifrirano datoteko«. Brskalnik orodja
(Chromium brez zaslona) prenos začne in ga prekine: `Download.save_as: canceled`, datoteke ni. Enako
na `main` `e8e90d8` in na objavljeni `8b2ce80`, tudi ko stran naslova datoteke ne sprosti
(`URL.revokeObjectURL` onemogočen). Na objavljeni `0625bd6` (pred šifriranjem) je isti ukaz datoteko
prenesel. Trenerka dneva 08 zato ni mogla preskusiti prenosa na nov telefon. Ob tem sta v istem oknu
hkrati vidni »Varnostne kopije s te naprave še niso šifrirane.« in »Izvoženo in šifrirano.« (P3).

**Težava in vpliv:** če se to zgodi tudi na telefonu, trener misli, da ima kopijo, pa je nima; na dan,
ko telefon izgubi, izgubi vse stranke. Iz brskalnika orodja tega ni mogoče ločiti od njegove omejitve.

**Preverba za Simona (ročno, na telefonu, `LibrePT.test@gmail.com` ni potreben):** v Chromu na
Androidu in v Safariju na iPhonu izvoziti kopijo in pogledati, ali je v »Prenosi« datoteka. Če je,
se zapis zapre kot omejitev orodja in ostane le protislovje sporočil (P3).

### 80.137 [x] P2 — Stranka z angleškim »Jezik obrazca« dobi slovensko vabilo in slovensko stran za odgovor — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80137-x-p2--stranka-z-angleškim-jezik-obrazca-dobi-slovensko-vabilo-in-slovensko-stran-za-odgovor--popravljeno-2026-09-30).

### 80.138 [x] P1 — Konec serije, vpisan pri današnjem večeru, podvoji današnji večer in serije ne konča — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80138-x-p1--konec-serije-vpisan-pri-današnjem-večeru-podvoji-današnji-večer-in-serije-ne-konča--popravljeno-2026-09-30).

### 80.139 [x] P3 — V »Ustvari rutino« gumb »Dodaj vajo« skrije izbirnik vaj, ki je že odprt — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80139-x-p3--v-ustvari-rutino-gumb-dodaj-vajo-skrije-izbirnik-vaj-ki-je-že-odprt--popravljeno-2026-09-30).

### 80.140 [ ] P2 — Poglavje »Izvedba in prilagoditve treninga«: korak imenuje angleški gumb, opombe ob vaji ni

**Scenarij in koraki:** prvi zagon, pogoji, tema, osebni podatki, poglavje »Izvedba in prilagoditve
treninga« (15 korakov). Vsak korak opraviti sam, kot ga korak opiše; »Pokaži mi« le, kjer korak ni
enoznačen.

**Opaženo:**
- **Korak 7** (P2): »Pritisni 🔥 Joint Pain / Discomfort — bolečina v sklepu.« Gumb v oknu »Zabeleži
  povratne informacije« se glasi »🔥 Bolečina ali nelagodje v sklepu«. Pravilo izdelka: korak imenuje
  gumb z napisom, ki ga gumb kaže v tem jeziku. Odprta Simonova odločitev o angleških imenih v vodenem
  ogledu (»all three personas named the English note-type button …«) izhaja iz časa, ko je bil gumb še
  angleški; zdaj je slovenski, angleški je le še korak (ključ `story_step_capture_tag`). Enako v
  drugih jezikih: angleški korak »Tap 🔥 Joint Pain / Discomfort.«, gumb »Joint pain or discomfort«;
  nemški »Tippe auf 🔥 Joint Pain / Discomfort — Gelenkschmerzen.«, gumb »Gelenkschmerz oder
  Beschwerden«. Meritev: v vseh 53 korakih vsakega jezika je to edini napis gumba, ki ga slovar nima.
- **Korak 12** (P2): »Pritisni Uredi načrt. Odpre se Johnov načrt; opomba je v njem, ob vaji.« V
  urejevalniku opombe »levo koleno, tretja runda« ob vaji ni (vrstica nima polja za opombo, §80.134);
  besedilo je le v pogledu prejšnjega načrta nad robom zaslona.
- **Koraka 2 in 5** (P3): »Pritisni Janin sklop.« in »Pritisni njegov sklop, da se odpre.« Jane ima
  tri sklope, John pet; mišljen je prvi (»Dinamično ogrevanje«), kar pokaže šele »Pokaži mi«.
- Drži: po koraku 14 ima John Lat Pulldown, Jane pa še Face Pulls (»Vaja se zamenja samo pri Johnu«).

**Težava in vpliv:** vodeni ogled je za trenerja brez predznanja edini učitelj. Kjer korak imenuje
gumb, ki ga ni, ali obljubi, česar zaslon ne pokaže, trener ne ve, ali je zgrešil on ali aplikacija.

**Predlog:** korak 7 z napisom gumba; korak 12 naj pove, kje je opomba res vidna; koraka 2 in 5 naj
sklop imenujeta. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.141 [~] P3 — Poglavje »Načrt za torek« obljublja oceno minut, ki je ni, in shrani prazen sklop

**Stanje 2026-09-30 (librept-02):** kartica pove, kje je ocena minut (desno od »Dodaj iz kataloga«),
nov korak v sklop vpiše vajo, da ga »Končano« ne zavrže, korak z verigo pove, da se Sarahin
dosedanji načrt zamenja (`3a4b7b6`). **Odprto, čaka na Simona:** ali naj Sarah v demo podatkih sploh
bo na istem treningu kot Jane in John.

**Scenarij in koraki:** prvi zagon, poglavje »Načrt za torek« (8 korakov), vsak korak opravljen sam.

**Opaženo:**
- **Korak 3:** »Ob naslovu piše na primer 45 / 60 min: 45 minut vaj v 60-minutnem terminu.« Podloga
  združi »Skupinska moč in kondicija« in »Vrnitev po poškodbi« (»Danes · 17:00 - 19:00«); ocene
  minut ob naslovu ni (posnetek zaslona). Pri treningu z eno stranko je (»49 / 60 min«, §80.134).
- **Koraka 4 in 5:** »+ Sklop … doda prazen sklop, v katerega dodaš vaje«, takoj zatem »Pritisni ✓ …
  Načrt se shrani«. Vaj ne doda nihče; po ✓ praznega sklopa na podlogi ni. Trener se nauči dodati
  nekaj, kar izgine.
- **Korak 7:** »Jane, John in Sarah delajo isti sklop, zato imajo en načrt.« Sarah je na drugem
  treningu, »Vrnitev po poškodbi«, z načrtom »Trup in gibljivost po porodu«; po »Vsi na ta načrt« ima
  načrt skupine (zavihek »Skupaj JD · JS · SJ«).

**Težava in vpliv:** trener, ki se iz ogleda uči, išče oceno, ki je ni, in se nauči, da stranko po
porodu pridruži skupinskemu metaboličnemu krogu z enim dotikom.

**Predlog:** korak 3 naj pokaže oceno tudi pri združeni podlogi ali naj je ne omenja; v koraku 4 naj
trener v sklop doda vajo; korak 7 naj velja za stranke, ki res delajo isto, ali naj pove, da Sarah
zamenja načrt. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.142 [ ] P2 — Poglavje »Pregled zaznamkov in priprava treningov« trdi, da je torek ob 20:00, ura pa se ne shrani

**Scenarij in koraki:** prvi zagon, poglavje »Pregled zaznamkov in priprava treningov« (7 korakov),
vsak korak opravljen sam; pri koraku 5 še »Pokaži mi«.

**Opaženo:**
- **Korak 5:** »Torek se ta teden premakne za dve uri … Pritisni svinčnik na kartici Moč ob torkih in
  četrtkih.« Prva taka kartica je četrtek 2026-09-24, ki je že mimo; tudi »Pokaži mi« odpre
  `session/setup/ss092426` z datumom 2026-09-24.
- **Koraka 6 in 7:** »V polje za začetek vpiši 20:00.« in takoj »Konec ogleda … Torek je ta teden ob
  20:00.« »Shrani« korak ne zahteva. Po »Končaj« in ponovnem nalaganju kartica 2026-09-24 še vedno
  kaže »18:00 - 19:00«.
- **Korak 7**, ko je poglavje začeto samo: »Pri Jane je zapisano, da ji je šlo prelahko. Johnovo koleno
  je v njegovi kartoteki in v načrtu.« To se zgodi v poglavju »Izvedba in prilagoditve treninga«, ne
  v tem. (Da ime poglavja obljublja pregled zaznamkov, ki ga ni, je že odprto vprašanje za Simona pri
  vodenem ogledu.)

**Težava in vpliv:** trener se nauči, da je ura spremenjena, ko jo vpiše; v resnici ni. Termin, ki ga
misli premakniti, je napačen dan.

**Predlog:** korak 5 naj odpre torek in ga imenuje z datumom; med korakoma 6 in 7 naj bo »Shrani«;
povzetek naj opiše le, kar je poglavje naredilo. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.143 [~] P2 — Poglavje »Vnesi svoje podatke« povabi k vpisu, vpis pa ogled ustavi; okno imenuje gumb, ki ga ni

**Stanje 2026-09-30 (librept-02):** vpis v polje obrazca, ki ga korak pokaže, ne ustavi več ogleda,
in kartica imenuje gumba, kot se res imenujeta (`3a4b7b6`, `5fcd503`). **Odprto, čaka na Simona:**
besedilo 1. koraka še imenuje »temno« vrstico.

**Scenarij in koraki:** prvi zagon, poglavje »Vnesi svoje podatke« (5 korakov). Pri koraku 4 (»Pritisni
Prekliči na dnu obrazca, ali Shrani, če si vpisal svoje podatke.«) v »Moji podatki« spremeniti
telefon v 041 222 333.

**Opaženo:**
- Po vpisu se ogled ustavi: »Ogled čaka. Zadnje dejanje ni bilo korak ogleda. Z »Nazaj v demo«
  nadaljuješ tam, kjer si bil, s »Končaj demo« ga končaš.« Gumba sta »Nazaj v demo« in **»Ustavi
  demo«**; »Končaj demo« ni nikjer. Isto okno ogled pokaže ob vsakem odstopu, torej v vseh poglavjih.
  V angleščini enako (besedilo »End the demo stops it«, gumb »Stop the demo«); v nemščini se ujemata
  (»Demo beenden«). Gumb je bil preimenovan, besedilo, ki ga navaja (`walkthrough_off_track`), ne.
- Korak 1: »Pritisni ☰ … zgoraj desno v temni vrstici.« Pri temi »Dan« je glava bela
  (`rgba(255, 255, 255, 0.96)`).
- Drži: »Shrani moje podatke« shrani telefon in ta ostane tudi po »Zapusti peskovnik«.

**Težava in vpliv:** korak, ki trenerja povabi, naj vpiše svoje podatke, ga ob vpisu ustavi in mu reče,
da tisto ni bil korak. Okno potem imenuje gumb z napisom, ki ga ne najde.

**Predlog:** vpis v polja obrazca v tem koraku naj ogleda ne ustavi; besedilo okna naj imenuje
»Ustavi demo«; korak 1 brez »temni«. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.144 [~] P3 — »S3 × R10« je angleška kratica v vseh jezikih; nemški namig imenuje gumb »Fertig«, ki ga ni

**Stanje 2026-09-30 (librept-02):** nemški namig imenuje gumb z njegovim pravim imenom (`5fcd503`).
**Odprto, čaka na Simona:** s čim zamenjati »S3 × R10 × 12 kg« in »BW« (predlog »3 × 10 × 12 kg« ne
loči serij od ponovitev in ne pokrije »BW«); in ali oznaka »Menu / Meni« gre v slovar, čeprav jo
`tests/unit/test_aria_labels_translated.py` namenoma vodi kot dvojezično.

**Scenarij in koraki:** trening z vajami na podlogi in v urejevalniku, v slovenščini in nemščini.

**Opaženo:**
- Vrstica vaje se glasi »S3 × R10 × 12 kg« (in »S3 × 0:10 × BW«) v slovenščini, nemščini in
  angleščini: kratici sta iz angleških »Sets« in »Reps« in nista v slovarju, »BW« prav tako. Vsi trije
  trenerji brez predznanja so se ustavili: »Razumem šele po ugibanju (S = serije, R = ponovitve?)«;
  »Oblika "3×10" mi ni povedala …«; nemška trenerka: »S in R ne pomenita nič v nemščini (Sätze,
  Wiederholungen).«
- Nemški urejevalnik: namig »Tippe auf Fertig, drücke Esc oder tippe daneben, um zu beenden.«, gumb
  pa »Bearbeitung des Plans beenden«; »Fertig« ni nikjer. (Slovenski »Pritisni Končano …« ob gumbu
  »Končano z urejanjem načrta« in angleški »Tap Done …« ob »Done editing plan« se ujemata.)
- Gumb menija ima v vseh jezikih pomožno ime »Menu / Meni«, zapisano v kodi glave, ne v slovarju
  (dopolnitev k §80.125).

**Težava in vpliv:** trener prebere program z ugibanjem; ne ve, ali je 10 ponovitev ali 10 serij.
Nemški trener išče gumb, ki ga ni.

**Predlog:** kratice in enota iz slovarja (na primer »3 × 10 × 12 kg«, kot jo že kaže rutina: »3×10 ·
12 kg«); nemški namig z napisom gumba. Opaženo na `main` `e2daf5e`, sl in de, 390 × 844.

### 80.145 [x] P3 — Stran za prijavo nagovori vsako stranko v ženskem spolu: »izbereš sama« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80145-x-p3--stran-za-prijavo-nagovori-vsako-stranko-v-ženskem-spolu-izbereš-sama--popravljeno-2026-09-30).

### 80.146 [ ] P3 — Po »Začni s prazno aplikacijo« se izbira ob vsakem nalaganju vrne, dokler trener nič ne vpiše

**Stanje 2026-09-30 (librept-02): čaka na Simona.** `index.html` in `splashScreen.js` pravita, da se
ponudba namenoma vrača, dokler trener ne shrani podatkov. **Vprašanje:** naj se izbira »Začni s
prazno aplikacijo« zapomni ob prvem kliku? Potem trener s prazno aplikacijo ponudbe za demo ne vidi
več.

**Scenarij in koraki:** svež brskalnik, pogoji, tema, osebni podatki, »Začni s prazno aplikacijo«.
Brez vpisa česar koli stran ponovno naložiti (v istem zavihku).

**Opaženo:** celozaslonska izbira (844 pik) je spet tu: »Razišči z vzorčnimi podatki«, »Vodeni ogled:
izberi poglavje« s šestimi poglavji, »Začni s prazno aplikacijo«. Dokler je odprta, prestreže vse
dotike pod njo. Ko je v aplikaciji ena stranka, se ne vrne več.

**Težava in vpliv:** trener, ki je izbral prazno aplikacijo in jo zaprl, preden je kaj vpisal, mora
izbirati znova in ne ve, ali se je prva izbira sploh prijela.

**Predlog:** izbira naj velja, ko je enkrat narejena. Opaženo na `main` `e2daf5e`, sl, 390 × 844.

### 80.147 [ ] P2 — Ocena obrazca »Uvozi program«: obljubi program iz klepeta, sprejme le obliko JSON

Način 3. Naloga (podagent, pred ogledom obrazca): štiritedenski program, ki ga trener že ima zapisan
drugje (»Počep 3x10 40kg, Potisk s prsi 3x8 30kg, Veslanje 3x12 25kg, Plank 3x40s«), spraviti k
stranki, ne da bi ga pretipkal. Naloga podagenta: `.private/exploratory-test/forms/2026-09-30-08-task.md`.
Pot: ☰ → »Vaje in rutine« → »Rutine« → »Uvozi program«. `main` `e2daf5e`, sl, 390 × 844 (okno cele
na zaslonu, nobena tarča pod 44 pik).

**Odveč.** Nič.

**Manjka.**
- **Program v obliki, kot ga trener ima** (P2, naprej čaka na Simona). Opis okna: »Prilepi program,
  napisan drugje — v klepetu, preglednici, datoteki od kolega.« Za besedilo iz naloge okno že med
  tipkanjem odgovori »V tem besedilu ni programa. Pritisni »Pokaži obliko« in primerjaj.« »Pokaži
  obliko« pokaže JSON (`"format": "librept.program/1"`), ki ga trener ne napiše. Pot prek »Kopiraj
  navodilo« (besedilo za pomočnika z umetno inteligenco) okno ne razloži. Opis obljublja več, kot
  obrazec sprejme; ali naj uvoz bere navadno besedilo, je odločitev o izdelku.
- **Dnevi, začetni datum, število tednov** (čaka na Simona): naloga pričakuje osem treningov (pon +
  čet, 4 tedne); uvoz odpre en nenačrtovan načrt (»Zaenkrat brez treninga«).
- **Časovna vaja v primeru:** »Pokaži obliko« nima vaje na čas, zato trener ne ve, kako zapisati
  »Plank 3x40s«.

**Ne deluje.**
- **Esc in ✕ zavržeta prilepljeno besedilo** (P3): ponovno odprto okno ima prazno polje in prazno
  »Za koga«. Pravilo 2026-09-17: zavrže le »Prekliči«.
- Popravljeno od §80.113: primer se uvozi s pravimi številkami (Barbell Bench Press 4 × 5 × 60 kg,
  »S4 × R8 × 45 kg«, »S3 × R12«); »Prebranih 4 postavk, 2 jih ni v tvojem katalogu.«

**Napačen tip ali vrstni red.** Vrstni red (stranka, trening, besedilo) ustreza nalogi.

### 80.148 [x] P2 — Zamenjava vaje obdrži težo prejšnje: Wall Sit dobi »BW+80kg« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80148-x-p2--zamenjava-vaje-obdrži-težo-prejšnje-wall-sit-dobi-bw80kg--popravljeno-2026-09-30).

### 80.149 [x] P3 — Brez povezave glava slovenske aplikacije napiše »Offline« — popravljeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#80149-x-p3--brez-povezave-glava-slovenske-aplikacije-napiše-offline--popravljeno-2026-09-30).

### 80.150 [ ] P2 — Trening, ustvarjen s čipom »jutri«, na podlogi ostane »Jutri« tudi naslednji dan

**Scenarij in koraki:** 2026-09-30 ob 23:59 »Ustvari trening«, ime »Test B«, obrazec sam izbere
jutri 00:00–01:00, stranka »Vesna Lipnik«, »Odpri v beležki«, v oknu vabil »Končano«. Po polnoči
(2026-10-01 00:02) trening znova odpreti s kartice na plošči, nato stran še osvežiti. Za primerjavo
po polnoči ustvariti »Test D« za danes 00:30 in »Test C« za včeraj 23:00.

**Opaženo:** glava podloge »Test B« še ob 00:02 in po osvežitvi piše »Jutri · 00:00 - 01:00«, plošča
pa isti trening pravilno pokaže pod »četrtek 2026-10-01« z »Zamuja 00h 01m«. »Test D« ima »Danes ·
00:30 - 01:30«, »Test C« »Včeraj · 23:00 - 23:30«. V bazi ima zapis »Test B« poleg pravilnega
`startDate` tudi `"day":"tomorrow"`.

**Težava in vpliv:** trener zvečer pripravi jutrišnji trening, naslednji dan pa podloga za današnji
trening piše »Jutri«. Na telovadnici, kjer je glava podloge edini kraj s časom, ne ve, ali je odprl
pravi trening.

**Predlog:** dan v glavi podloge naj pove odnos do današnjega dne ob odprtju, ne do dneva, ko je bil
trening ustvarjen — opaženo na različici `main` `6230070` (zamrznjena kopija, vrata 8093), sl,
390 × 844.

### 80.151 [ ] P2 — Pri urejanju načrta se katalog zapre po vsaki vaji, v »Ustvari rutino« pa ostane odprt

**Scenarij in koraki:** trening »Test D« (stranka »Vesna Lipnik«) → ⋮ → »Uredi načrt« → »Dodaj iz
kataloga« → »Barbell Back Squat«. Za primerjavo: ☰ → »Vaje in rutine« → »Rutine« → »Ustvari
rutino« → »Barbell Back Squat«, nato »Barbell Row«.

**Opaženo:** pri urejanju načrta se okno »Dodaj iz kataloga vaj« po prvi vaji zapre; za vsako
naslednjo vajo je treba znova pritisniti »Dodaj iz kataloga« in znova poiskati vajo. V »Ustvari
rutino« okno ostane odprto in obe vaji dobita vrstico (3 × 10). Isto trdi dnevnik prvega odprtja 04
(tri vaje, trikrat odprt katalog).

**Težava in vpliv:** trening s šestimi vajami stane pri urejanju načrta šest odprtij kataloga in
šestkrat iskanje od začetka seznama. Trener, ki je rutino že sestavil z enim odprtjem, ne ve, zakaj
tu ne gre.

**Predlog:** katalog pri urejanju načrta naj ostane odprt, dokler trener ne pritisne »Končano«, kot v
»Ustvari rutino« — opaženo na različici `main` `6230070` (zamrznjena kopija), sl, 390 × 844.

### 80.152 [ ] P3 — Med urejanjem načrta prazna kartica še vedno pravi »izberi Uredi načrt«, namig pa imenuje gumb brez besede

**Scenarij in koraki:** trening brez vaj (»Test D«) → ⋮ → »Uredi načrt«.

**Opaženo:** nad urejevalnikom piše »Ni vstavljenih vaj«, pod vrstico »Vaja · Sklop · Počitek«
»Pritisni Končano, tipko Esc ali zunaj okna za zaključek.«, pod tem pa kartica »Ni vstavljenih vaj /
Vaj še ni. Pritisni tri pike (⋮) zgoraj desno in izberi Uredi načrt.« — prav to, kar je trener
pravkar naredil. Gumb, ki ga namig imenuje »Končano«, na zaslonu kaže samo kljukico ✓ v zelenem krogu
zgoraj desno; beseda »Končano« je le v njegovem skritem imenu. Posnetek zaslona, ker gre za vidno
stanje.

**Težava in vpliv:** trener, ki prvič ureja načrt, dobi navodilo, naj stori, kar je že storil, in
iskati mora gumb z besedo, ki je ni. Dnevnik prvega odprtja 04 navaja oboje kot zmedo.

**Predlog:** med urejanjem naj prazna kartica ne kaže navodila za vstop v urejanje, namig pa naj
imenuje gumb po tem, kar se vidi (»Pritisni ✓ zgoraj desno …«) — opaženo na različici `main`
`6230070`, sl, 390 × 844.

### 80.153 [ ] P3 — Pri slabem signalu aplikacija počaka na odgovor strani, čeprav je vse na telefonu

**Popravek 2026-10-01 00:59 (Claude):** prva različica te točke je bila P1 s številkama 96,9 s in več kot
150 s. Napačni sta: čas sem meril od začetka ukaza `goto` v explore.py, ta pa čaka, da omrežje utihne,
kar pri zadržanih odgovorih traja do 60 sekund. Spodnje številke so izmerjene znova, s štoparico od
začetka navigacije do slovenske plošče ali uvodne izbire.

**Scenarij in koraki:** zamrznjena kopija `main` na strežniku, ki vsak odgovor zadrži za nastavljivo
število sekund (telovadnica z eno črtico signala). Prvi obisk brez zamika: »Se strinjam«, tema,
podatki trenerke »Tara Zorko«, »Začni s prazno aplikacijo«; service worker je nameščen. Nato stran
znova odpreti pri različnih zamikih, vsakič dvakrat.

**Opaženo:**

| Omrežje                  | Čas do plošče |
| :----------------------- | :------------ |
| brez zamika              | 0,1–0,5 s     |
| strežnik ustavljen       | 0,1 s         |
| vsak odgovor zamuja 2 s  | 2,1 s         |
| vsak odgovor zamuja 10 s | 10,1 s        |

Aplikacija čaka na en odgovor, na samo stran; moduli pridejo iz predpomnilnika. Med čakanjem je na
zaslonu angleški zaslon za nalaganje.

**Težava in vpliv:** pri zelo slabem signalu trener čaka toliko, kolikor traja en odgovor omrežja, brez
signala pa nič. Pri odgovoru, ki ne pride, bi čakal, dokler telefon ne obupa — tega nisem izmeril.

**Predlog:** ko je stran na telefonu, naj se odpre iz njega in omrežje vpraša v ozadju — opaženo na
različici `main` `6230070` (zamrznjena kopija), 390 × 844, sl.

### 80.154 [ ] P2 — Občasno se aplikacija ne naloži: ostane na angleškem zaslonu za nalaganje — preveriti na telefonu

**Stanje 2026-10-01 01:18 (Claude):** zastoj je resničen v brskalniku, ki ga poganja orodje, vzroka pa
orodje ne more ločiti od sebe, ker se ob vsakem ukazu znova priklopi prek CDP. Ta točka je bila v eni
uri zapisana kot P1, znižana, umaknjena in vrnjena; vsakič na podlagi ene serije meritev. Spodaj je
samo tisto, kar drži čez vse serije.

**Opaženo:** stran ostane na zaslonu »LibrePT / A lightweight, free app for your clipboard, sessions and
training programmes.« v angleščini, `<html lang="en">`, brez napak v konzoli, tudi po 50 sekundah.
Na objavljeni `#8b2ce80` enkrat v približno 40 nalaganjih. Na kopiji `main` `6230070` pogosto, v nizih:
ko se zgodi, obstane več zaporednih nalaganj, nato spet steče. Najpogosteje stran `/intake` po prvem
zagonu trenerja v istem brskalniku. Zgodi se z ukazom `goto` iz explore.py (3 od 6 v enem poskusu) in z
navadno navigacijo (`goto(wait_until="commit")`, 4 zaporedna na `/intake`), a drugič navadna 6 od 6
steče. Enkrat stran ni odgovorila niti na `1+1` prek CDP.

**Težava in vpliv, če je aplikacija:** trener vidi angleški zaslon, ki se ne premakne; trener, ki
povezavo povabila preizkusi na svojem telefonu, ne pride do obrazca.

**Dokaz k orodju:** v enem procesu Playwright, ki je ves čas priklopljen na svoj brskalnik (brez
explore.py), je deset zaporednih celih zagonov z urejanjem rutine steklo brez zastoja.

**Preverba za Simona, na telefonu, brez orodja:** odpri aplikacijo in jo uporabljaj kot trener, nato v
istem brskalniku odpri povezavo iz »Povabi stranko« in stran nekajkrat osveži. Če obrazec vedno pride,
je bil zastoj orodje in se ta točka zapre — opaženo na `#8b2ce80` in `main` `6230070`, 390 × 844, sl.

### 80.155 [ ] P3 — Ocena obrazca »Dodaj stranko iz podatkov, ki jih je poslala«

Naloga (podagent brez konteksta, pred ogledom obrazca): stranka »Maja Kovač« je na svojem telefonu
izpolnila podatke in privolitev in poslala datoteko; trener hoče, da postane stranka, in ne želi
prepisovati ničesar, kar je v datoteki. Datoteka je nastala na obrazcu `/intake` iste kopije. Pregled
na `main` `6230070` (zamrznjena kopija), sl, 390 × 844 in 320 × 680.

**Kar drži:** en izbor datoteke in en gumb; vsi podatki iz datoteke se pokažejo za branje; stranka se
pokaže enkrat, z enakimi podatki in z »Privolitev dana (2026-10-01 · v2026-09-30)«. Pokvarjena datoteka:
»Ta datoteka ni LibrePT predstavitev stranke …«, gumb ostane onemogočen, nihče ni dodan. Ista datoteka
drugič: »Posodobi stranko, ki jo že imaš: Maja Kovač«, že obkljukano, druge Maje ni. Pri 320 × 680 je
gumb na zaslonu, cilji niso manjši od palca.

**1. Odveč:** nič. Obrazec ne vpraša ničesar, česar naloga ne bi imela.

**2. Manjka:**
- Popravek napake pred dodajanjem: naloga pravi »popravim le, če je napaka«, pregled pa je samo za
  branje; datoteka z e-pošto »x« doda stranko z e-pošto »x«, popravek šele v »Uredi profil«. P3,
  **čaka na Simona** (spremeni, kaj obrazec je).

**3. Ne deluje:**
- Ob obstoječi stranki gumb še vedno pravi »Dodaj med moje stranke«, čeprav stranko posodobi. P3.
- Datoteka brez privolitve: pregled pravi »Ni dana — podatkov še ne smeš hraniti«, gumb »Dodaj med moje
  stranke« pa je omogočen in stranko doda. Besedilo in gumb si nasprotujeta. P3, **čaka na Simona**
  (ali naj gumb v tem primeru ustavi ali naj besedilo pove, kaj trener sme).
- Sporočilo pokvarjene datoteke »preveri, ali si izbral pravo priponko« predpostavi trenerja moškega
  spola; drugod slovenski vmesnik to obide. P3.

**4. Napačen tip ali vrstni red:**
- »Jezik, v katerem je brala« pokaže kodo »sl«, ne »Slovenščina«, kot jo pokaže izbira jezika obrazca. P3.
- »Besedilo privolitve« pokaže »2026-09-30«, torej različico, ne besedila. Bolje »Različica besedila
  privolitve«. P3.

### 80.156 [ ] P2 — Ocena obrazca »Moji podatki«: Esc in »Zapri« zavržeta vpisano

Naloga (podagent brez konteksta): trener je zamenjal telefonsko številko in e-pošto in hoče, da jih
odslej dobijo stranke v vabilih in v pismu privolitve. Pot: ☰ → »Nastavitve« → »Moji podatki« (trije
dotiki). Na `main` `6230070` (zamrznjena kopija), sl, 390 × 844 in 320 × 680, v enem procesu Playwright.

**Kar drži:** štiri polja (»Ime«, »Priimek«, »Telefon«, »E-pošta«) s pravimi tipi in samodejnim
izpolnjevanjem; »tara@studio« zavrnjeno ob polju (»To ni e-poštni naslov. Popravi ga.«); po shranitvi
in ponovnem odprtju »+386 31 777 888« in »info@studio-zorko.invalid«; pismo privolitve se konča s
»Tara Zorko / +386 31 777 888 / info@studio-zorko.invalid«, SMS se začne »Piše ti Tara Zorko«.
»Shrani moje podatke« je na zaslonu pri obeh velikostih.

**1. Odveč:** nič.

**2. Manjka:**
- Ime podjetja ali studia, ki ga naloga navaja kot »SOMETIMES«; podpis pisma ima le ime in priimek.
  P3, **čaka na Simona**.

**3. Ne deluje:**
- Esc in »Zapri« (✕ zgoraj) zavržeta vpisano: telefon spremenjen, izhod, ponovno odprtje — spet
  stara številka. Pravilo 2026-09-17: zavrže le »Prekliči«. P2. Enako po osvežitvi strani.
- Gumbi v »Nastavitvah« (»Moji podatki«, »Verzija aplikacije«, …) so visoki 42 pik, manj od 44. P3.

**4. Napačen tip ali vrstni red:**
- Uvodno besedilo »tvoje ime podpiše povabilo, telefon in e-pošta pa sta pot, po kateri ti stranka
  odgovori« ne pove, da isti podatki podpišejo pismo privolitve in tam povedo, kdo je upravljavec. P3.

### 80.157 [ ] P3 — Ob prvem odprtju po zagonu brskalnika zaslon za nalaganje čaka pet sekund — čaka na Simona

**Scenarij in koraki:** brskalnik s profilom, v katerem je aplikacija že uporabljena (trenerka »Tara
Zorko«, stranka »Gaja Mlakar«). Brskalnik zapreti in znova zagnati, odpreti `/?lang=sl`, nato isto stran
še dvakrat. Merjeno od navigacije do trenutka, ko zaslon za nalaganje začne izginjati.

**Opaženo:** prvo odprtje po zagonu brskalnika 5,02–5,04 s, drugo in tretje 0,07–0,11 s. Enako na
objavljeni `#8b2ce80` (4,95–5,02 s) in na `main` `6230070`. Aplikacija je slovenska in preusmerjena na
ploščo že po 0,6 s; preostanek je zadrževanje zaslona za nalaganje. Zadrževanje je namerno (arhiv:
»the splash hold (`max(5s, boot)`)«, z lastnim testom).

**Težava in vpliv:** telefon brskalnik v ozadju pogosto ugasne, zato je »prvo odprtje po zagonu«
običajno odprtje med dvema strankama. Pet sekund vsakič, čeprav je aplikacija pripravljena po pol
sekunde.

**Predlog:** **čaka na Simona** — ali je pet sekund vredno zadrževati ob vsakem hladnem zagonu ali le
ob prvem obisku — opaženo na `#8b2ce80` in `main` `6230070`, 390 × 844, sl.

## 81. [ ] The welcome screen asks for everything once, and the menu has five entries

**Ruled 2026-09-26 (Simon):** the welcome screen makes the language, the theme, and the trainer's first
name, last name, phone and email mandatory, on every path (the sandbox and the guided tour included),
before the offer to enter the sandbox. The ☰ menu keeps five entries: *Training sessions*, *Client
directory*, *Exercises and routines*, *Data management* and *Settings*; *Leave the sandbox* is a row
only while the sandbox is open. *Pending review* is only a status message in the notification area; a
client's history is only on that client's page. This replaced §11.3's plan of 14 rows.

A client who opens an invitation link (`?evt=`) is not the trainer and never sees the trainer's form.

§81.1–§81.4, §81.6 and §81.7 are done. Open: §81.5, iCloud only.

### 81.1 [x] Language, theme and the trainer's details are mandatory on the welcome screen — done 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#811-x-language-theme-and-the-trainers-details-are-mandatory-on-the-welcome-screen--done-2026-09-26); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 81.2 [x] The menu in five entries — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#812-x-the-menu-in-five-entries--done-2026-09-27); what shipped is in [CHANGELOG.md](CHANGELOG.md). The global History view's removal is §81.7.

### 81.3 [x] Pending review only in the notification area — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#813-x-pending-review-only-in-the-notification-area--done-2026-09-27).

### 81.7 [x] Remove the global History view — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#817-x-remove-the-global-history-view--done-2026-09-27); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 81.4 [x] Import and export of exercises, routines and circuits in one place — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#814-x-import-and-export-of-exercises-routines-and-circuits-in-one-place--done-2026-09-27); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 81.5 [~] Every service credential the app holds can be cleared or revoked — Drive done, iCloud waits

**Ruled 2026-09-27 (Simon):** *"Shramba vseh api ključev v aplikaciji mora omogočiti, da se
počistijo ali razveljavijo. GDrive in iCloud sta zaenkrat edina."*

**Done for Google Drive** (`af6cbaf`): Settings → *Connected accounts* over `data/connectedAccounts.js`,
with *Clear from this device* (the `librept_drive_connected` flag and the in-memory token; other devices
keep access) and *Revoke access* (the grant ends for every device). `revokeAccess` asks Google for a
token first, so a revoke after a reload reaches Google; when that fails it names Google's own page,
`myaccount.google.com/linkedapps`.

**Open:** iCloud. The app holds nothing for it: there is no iCloud integration, and §3.13 found that one
needs a native Apple app, a Mac and the $99 Apple Developer Program. When §3.13 decides to build it, it
is one more entry in the same list.

### 81.6 [x] The backup password is stored, safely — done 2026-09-28

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#816-x-the-backup-password-is-stored-safely--done-2026-09-28); what shipped is in [CHANGELOG.md](CHANGELOG.md).

## 83. [ ] §66 gleda samo naprej: stranka, ki pride za besedilom

**Vprašal 2026-09-26 (Simon):** kaj pa, če stranka Novak pride naknadno, ko lokacija »Telovadnica
Novak« že obstaja? Preverjeno isti dan (Claude): **ni v redu niti logika niti GDPR.**

Pravilo §66 ima **eno samo klicno mesto** — `sessionTextNamesNobody` ob oddaji obrazca termina
([editSessionControl.js](src/modules/session/editSessionControl.js)). Nič v aplikaciji ga ne vpraša,
ko se doda ali preimenuje stranka. Obstoječa besedila se nikoli ne preverijo znova.

**Logična napaka: star termin se ne da več shraniti.** Preverba bere trenutno vrednost polja, ne
tega, kar je trener spremenil, in se izvede kot prva v `submit`, pred vsem drugim. Trener odpre
marčevski termin, da ga premakne za pol ure, pritisne *Shrani* in dobi »Kraj ne sme vsebovati imena
stranke, **Novak** pa je ime stranke« na polju, ki se ga ni dotaknil. Termina ne more premakniti,
dokler ne preimenuje kraja, ki s stranko Novak ni imel nikoli nič. Ponavljajoči se termini gredo
skozi isti obrazec, torej velja isto za vso serijo.

**Aplikacija ponuja, kar nato zavrne.** `populateLocationSuggestions` zbira predloge iz
`state.sessions`, zato »Telovadnica Novak« ostane v spustnem seznamu za vedno. Trener jo izbere iz
ponujenega seznama in shranjevanje jo zavrne.

**Tudi GDPR ni v redu, in to je resnejše.** §66 obstaja zato, da nobeno besedilo termina ne imenuje
stranke, ki jo je pozneje treba izbrisati. Ker preverba gleda samo naprej, je obhod običajen
delovni vrstni red: trener napiše »Novak« v ime termina za uvodno vadbo, **preden** je Novak v
imeniku, in ga doda za tem. Besedilo se nikoli več ne preveri in nobeno pometanje ga ne doseže. Ko
je Novak pozneje izbrisan, ta zapis ostane — natanko ostanek, ki naj bi ga §66 preprečil.

**Četrta stvar, ki jo je pokazalo isto vprašanje: pravilo ne pozna naključja.** Priimek je lahko
pravo ime telovadnice. Danes ni nobene poti, da bi trener povedal »to je fitnes, ne stranka«;
zavrnitev je absolutna. Aplikacija tega ne more vedeti sama — ve samo trener.

**Dodaten scenarij prek vmesnika, objavljena `8b2ce80`:** v imeniku je TEST Luka
Kovač z vzdevkom »jutranji · Studio A«. Trener ustvari »SIM Previdna vadba« samo za
drugo stranko, TEST Maja Omejitev, za jutri 10:00–10:45. Lokaciji »Studio test« in
»Studio« sta obe zavrnjeni: »Kraj ne sme vsebovati imena stranke, Studio pa je ime
stranke.« Po zamenjavi lokacije s »Telovadnica B« ista oddaja uspe. Tako že del
vzdevka osebe, ki pri vadbi ne sodeluje, prepreči uporabo običajnega naziva prostora.
Predlog: pri presoji naključnega ujemanja zajeti tudi vzdevke in generične besede
za kraj, ne le priimke; morebitna sprememba pravila ostaja predmet zgornje odločitve.
Sl, 390 × 844, brez novih prestreženih napak; brez pregleda kode.

**Dokaz 2026-09-30, `main` `12d0e66`:** priimek, ki je navadna beseda. Za stranko »SIM Nina Koleno«
je ime treninga »Preizkus koleno« zavrnjeno: »Ime termina ne sme vsebovati imena stranke, koleno pa
je ime stranke.« Pri rehabilitaciji kolena je beseda »koleno« v imenu treninga naravna; enako bi
veljalo za Kos, Zajc, Medved, Vrabec.

**Pokritost:** [clientNameWords.test.mjs](tests/unit_js/domain/clientNameWords.test.mjs) preizkuša
samo čisto funkcijo. Vrstni red »besedilo prej, stranka pozneje« ni pokrit z nobenim testom.

**Predlog, čaka na Simonovo odločitev, ker spreminja obliko §66:** dvoje, ki nista isto.

- **Obrazec zavrne le to, kar trener dodaja.** Primerjaj z shranjeno vrednostjo polja: če je beseda
  tam bila že prej, shranjevanje ne pade. To odpravi nezmožnost urejanja, GDPR luknje pa ne.
- **Dodana ali preimenovana stranka pregleda obstoječe termine** in trenerju pokaže, katera besedila
  jo zdaj imenujejo, da jih popravi ali potrdi kot naključje. To zapre GDPR luknjo in je hkrati
  edini kraj, kjer naključje sploh lahko potrdi. Kot opravilo v obvestilih, ne kot modal — odloča se
  lahko pozneje, ne sredi dodajanja stranke.

Predlogi kraja ne smejo ponujati vrednosti, ki jo bi shranjevanje zavrnilo.

**Dve dopolnitvi, ki ju je Simon zahteval 2026-09-26** (prej zapisani le v zapisu stanja na vrhu
datoteke):

1. **Preverba ne pozna sklonov.** Preizkus s pravo funkcijo `clientNamesIn` in strankama »Ana Novak« in
   »Jože Kovačič«: **devet od trinajstih besedil preverbo prestane** — *Anin trening*, *trening za
   Novaka*, *pri Novaku*, *Vadba z Ano*, *Ano peljem ven*, *Anini zgibi*, *Kovačičev program*, *pri
   Jožetu*, *Novakova garaža*. Zavrnjena so le *Ana 1:1*, *NOVAK doma* in *Telovadnica Novak*, zadnje
   pa je lahko pravo ime telovadnice. Pravilo torej greši v obe smeri. Ujema le imenovalnik, ki ga
   slovenski trener v naslov napiše najredkeje. »Samo cele besede« je bilo odločeno 2026-09-18 po
   angleški predpostavki; prvi trg je slovenski. Preverjata se le polji `setup-session-name` in
   `setup-location`, [clientErasure.js](src/data/clientErasure.js) pa našteva tri besedila, ki jih
   izbris ne doseže: naslove terminov, naslove osnutkov in opombe povratne informacije. Opomba
   (`feedback_note_placeholder`) se ne preverja.
2. **Trener potrebuje izhod iz zavrnitve: spremeni ime stranke ali spremeni vrednost polja** (Simon,
   2026-09-26). Danes je edini izhod ponovni vnos polja. Od tam ni mogoče spremeniti imena ali
   vzdevka stranke in ni mogoče povedati, da je ujemanje naključje.

**Vrstni red je bistven:** strožja preverba je varna šele, ko ima zavrnitev izhod. Dokler ga nima,
vsaka izboljšava preverbe stane več, kot prinese.

## 82. [ ] Links run one way, out of TODO.md

**Ruled 2026-09-26 (Simon):** TODO.md holds only soft links to other files, which nothing checks; no
other file points at a section of TODO.md, because its content is not stable. Naming the file as the
home of open work stays allowed. The rule is in `AGENT_RULES.md`, the references were removed (§82.2),
and `agent_tools/todo_refs.py` fails the build on a new one. One exemption is left: §82.3.

### 82.1 [x] The link check stops scanning TODO.md and its archive — done 2026-09-26

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#821-x-the-link-check-stops-scanning-todomd-and-its-archive--done-2026-09-26).

### 82.2 [x] Remove every reference into TODO.md, then make one fail the build — done 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#822-x-remove-every-reference-into-todomd-then-make-one-fail-the-build--done-2026-09-27).

### 82.3 [ ] Five pointers left in the dev server's own file — blocked on a restart

`deploy/local_http_server.py` keeps five pointers into TODO in its comments, and
`agent_tools/todo_refs.py` exempts it. The test suite refuses to run against a dev server whose copy
of that file differs from the working tree, and the server on :8081 has been running since
2026-09-23; restarting it is Simon's call. **Blocks:** removing the last exemption. When the server
is next restarted, remove the pointers and the exemption in one change.

## 84. [x] A session with no participants stops the boot — test data, not a defect — closed 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#84-x-a-session-with-no-participants-stops-the-boot--test-data-not-a-defect--closed-2026-09-27).

## 85. [x] BUG — the rendered landing page showed a developer comment as text — fixed 2026-09-27

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#85-x-bug--the-rendered-landing-page-showed-a-developer-comment-as-text--fixed-2026-09-27).

## 86. [Brainstorm] Kaj trener potrebuje za posel in česa aplikacija ne dela

Nastalo 2026-09-27 iz istega dela kot §80: 84 ciklov raziskovalnega preizkušanja objavljene
aplikacije (`0625bd6`), plus branje seznama poti (`routeTable.js`) in podatkovnega modela. §80 gleda,
ali kar aplikacija dela, dela prav. Ta razdelek gleda drugo vprašanje: **kaj mora trener opraviti,
da posel teče, in česa aplikacija ne prevzame.**

**Kaj je izmerjeno in kaj ne.** Izmerjeno je, kaj aplikacija ima: v `src/` ni nobene kode za denar,
račune, cene ali plačila (iskano po `invoice`, `payment`, `price`, `€`, `plačil`), ni zapisa o
prisotnosti (`cancelled` obstaja samo kot »ta torek odpade«, ne kot »stranka ni prišla«) in ni
nobenega seštevanja čez zapise. **Ocene vrednosti niso izmerjene.** Sestavljene so iz mehanike
opravila (koliko minut vzame, kolikokrat na mesec) pod predpostavkami spodaj. Številke, ki jih Simon
pozna iz prakse — cena ure, delež neprihodov, koliko strank plača z zamudo — naj popravi; ocene so
napisane tako, da se popravijo z eno številko.

**Predpostavke za vse ocene:** slovenski samostojni trener, 20 rednih strank, približno 90 vadb na
mesec (4–5 na dan), večina ena na ena in dve manjši skupini, brez recepcije, cena ure 25 €.

### 86.1 Pridobivanje strank

| Opravilo                                   | Kaj aplikacija dela danes                                          | Kje je že prevzeto | Ocena vrednosti, če to prevzame program |
| :----------------------------------------- | :----------------------------------------------------------------- | :----------------- | :-------------------------------------- |
| Biti najden (splet, Instagram, Google)     | nič                                                                 | —                  | zunaj aplikacije; tu se ne splača      |
| Sprejem podatkov nove stranke              | **dela**: stran `/intake`, stranka izpolni na svojem telefonu       | §26, izdelano      | prihranjenih ~10 min na stranko         |
| Sled od prvega stika do prve vadbe         | nič — stranka je v imeniku ali je ni                                | nikjer             | ~1 h/mesec, večja pa je izgubljena stranka, ki se je pozabila |
| Brezplačna uvodna vadba in njen izid       | nič                                                                 | nikjer             | majhna; to je opomnik, ne program       |

### 86.2 Denar

| Opravilo                                        | Kaj aplikacija dela danes | Kje je že prevzeto        | Ocena vrednosti |
| :---------------------------------------------- | :------------------------ | :------------------------ | :-------------- |
| Cenik in paketi (npr. karta za 10 vadb)         | nič                       | nikjer                    | ~0,7 h/mesec vodenja evidence; večja je izguba: ena nezaračunana vadba na deset strank na mesec je 50 € |
| Stanje na paketu (koliko vadb je še ostalo)     | nič                       | nikjer                    | isto kot zgoraj; brez tega šteje stranka sama, trener pa ji verjame |
| Izdaja računa                                   | nič                       | **ProPT** (§68)           | ~1,7 h/mesec (20 računov po 5 min) |
| Davčno potrjevanje računov za gotovino          | nič                       | ni razčiščeno niti v §68  | zakonska obveznost, ne udobje; brez nje gotovina ni legalna |
| Opomniki za neplačano                           | nič                       | nikjer                    | ~0,5 h/mesec, denar pa pride prej |
| Pregled prihodka po mesecu, stranki in uri      | nič                       | nikjer                    | ~0,5 h/mesec ročnega seštevanja; brez tega trener ne ve, katera stranka se izplača |

Dan 07 (2026-09-30): paket stranke (6 od 10) in plačilo z gotovino je trener zapisal v »Opombe«;
ocena 0, 15 minut na dan zunaj aplikacije (trenerjeva ocena).

Dan 11 (2026-10-01, trener v Kopru, hišni obiski in studio): kdo je danes plačal (4 min na dan), stanje
karte za 10 (3 min na dan) in račun za september za eno stranko (4 × 35 €, 6 min, okoli 10 računov na
mesec) — vse ocena 0, vse v »Opombe« ali zunaj aplikacije. Minute so trenerjeva ocena.

### 86.3 Termini

| Opravilo                                     | Kaj aplikacija dela danes                                             | Kje je že prevzeto | Ocena vrednosti |
| :------------------------------------------- | :-------------------------------------------------------------------- | :----------------- | :-------------- |
| Dogovor za termin                            | trener vpiše sam; vabilo vpraša samo »prideš / ne prideš«             | ProPT (samopostrežna rezervacija) | ~3 h/mesec (90 vadb × 2 min pisanja sporočil) |
| Opomnik dan prej                             | nič                                                                    | nikjer             | ~1,5 h/mesec; in en neprihod manj na mesec je 25 € |
| Odpoved in pravilo o pozni odpovedi          | odpoved večera obstaja, zapisa o tem, kdo je odpovedal in kdaj, ni     | nikjer             | brez zapisa je pravilo neizvedljivo; 1–2 pozni odpovedi na mesec sta 25–50 € |
| Čakalna vrsta za polno skupino               | zasedenost je vidna, vrste ni                                          | nikjer             | majhna pri 20 strankah, večja pri skupinah |
| Uskladitev z lastnim koledarjem              | izvoz vabila v koledar (datoteka), sinhronizacija urnika prek oblaka   | delno izdelano     | ~0,5 h/mesec |

**Odpoved ni zapis** (`0625bd6`, `8b2ce80`): »Ni se zgodila« v oknu »Trening se je začel izven urnika«
termin odstrani s plošče in program premakne med nedodeljene (»Individualna vadba · TEST Ana Novak«);
napis gumba te posledice ne pove, evidence odpovedi ni. Pri skupini velja za cel trening; za eno
stranko, ki ni prišla, je le »Odstrani s tega treninga: <ime>«, ki sprosti mesto in o odsotnosti ne
pusti nič. Zapis prisotnosti po strankah je pogoj tudi za skupine.

Dan 11 (2026-10-01): pozna odpoved (17,50 €) in neprihod (35 €) — ocena 0. »Ni se zgodil« in »Izbriši
trening« le izbrišeta termin, brez sledi in zneska; trener: »zamudim 17,50 do 35 EUR vsakič, ko pozabim
v zvezku«. Naročilo po sporočilu (»ali lahko v soboto ob 10:00«): trener vpiše sam, 2 minuti in eno
sporočilo za potrditev.

Dan 07 (2026-09-30): vikend tabor za 15 udeležencev v treh skupinah. Najvišjega števila mest, čakalne
vrste, skupin znotraj termina in predplačila ni. Vpis treh udeležencev 8 minut; trener ocenjuje 20
minut za vseh 15 na papirju.

### 86.4 Izvedba in stranka

| Opravilo                                  | Kaj aplikacija dela danes                                   | Kje je že prevzeto | Ocena vrednosti |
| :---------------------------------------- | :---------------------------------------------------------- | :----------------- | :-------------- |
| Načrt vadbe in beležka med vadbo          | **dela; to je jedro aplikacije**                             | izdelano           | to je razlog, da aplikacija obstaja |
| Zapis prisotnosti (prišla / ni prišla)    | nič — trening je zaključen ali ne                            | nikjer             | pogoj za vse zgoraj: obračun paketa, pozne odpovedi, opomnike |
| Meritve in napredek skozi čas             | teža stranke je polje; zgodovine meritev ni                  | §78, odprto        | ~1,1 h/mesec poročil, večja pa je zadržana stranka |
| Poročilo stranki o napredku               | nič                                                          | nikjer             | ista postavka kot meritve |
| Domača naloga med vadbama                 | nič                                                          | nikjer             | majhna, dokler ni meritev |

Dan 07 (2026-09-30): obseg stegna, telesna teža in čas na 400 m nimajo mesta; ocena 0, 5 minut na dan
zunaj aplikacije (trenerjeva ocena).

### 86.5 Zadrževanje strank in vodenje posla

| Opravilo                                        | Kaj aplikacija dela danes | Kje je že prevzeto | Ocena vrednosti |
| :---------------------------------------------- | :------------------------ | :----------------- | :-------------- |
| Opozorilo na stranko, ki je ni bilo tri tedne   | nič                       | nikjer             | ena vrnjena stranka na mesec je 100 € (štiri vadbe) |
| Zbiranje mnenj in priporočil                    | nič                       | nikjer             | posredna; vpliva na pridobivanje |
| Izkoriščenost (koliko ur od razpoložljivih)     | nič                       | nikjer             | ~0,5 h/mesec; odloča o ceni in urniku |
| Varnostna kopija in selitev na nov telefon      | **dela**: izvoz, uvoz, oblak | izdelano        | izdelano |
| Več trenerjev, več telovadnic                   | nič                       | **EnterprisePT**   | zunaj te aplikacije |
| Privolitve in pravice strank po GDPR            | **dela**: privolitev z datumom, izvoz, izbris | §27, izdelano | izdelano (napake v podrobnostih so v §80.30, §80.42, §80.43) |

### 86.6 Seštevek in kaj iz tega sledi

Pod predpostavkami zgoraj aplikacija danes pokriva **izvedbo vadbe in podatke o strankah**, ne pa
**denarja, prisotnosti in stika s stranko med vadbama**. Seštevek nepokritega je približno **8 do 10
ur pisarniškega dela na mesec** in **100 do 200 € na mesec, ki odtečejo** (nezaračunane vadbe, pozne
odpovedi, neprihodi, stranke, ki tiho odidejo). Za trenerja, ki dela 90 ur na mesec, je to desetina
delovnega časa in približno ena delovna ura tedensko, ki jo ne zaračuna nikomur.

**Tri stvari, ki niso prevzete nikjer in so največ vredne:**

1. **Zapis prisotnosti.** Sam po sebi je majhen (prišla / ni prišla / pozno odpovedala), brez njega pa
   ni ne obračuna paketa, ne pravila o pozni odpovedi, ne opozorila o stranki, ki je ni. Vse tri
   postavke zgoraj stojijo na njem. Aplikacija ima že vse, kar za to potrebuje: trening, udeležence in
   zaključek.
2. **Paket in stanje na njem.** Ne zahteva ne strežnika ne plačila v aplikaciji — samo števec ob
   stranki in odštevanje ob zaključeni vadbi. Zaračunavanje ostane v ProPT, evidenca pa ne rabi biti
   tam.
3. **Opomnik dan prej.** Brez strežnika ga ni mogoče poslati samodejno, mogoče pa je narediti
   »pripravljeno sporočilo za jutrišnje stranke« — en zaslon, ki trenerju pripravi besedila, in on
   jih pošlje. To je ista rešitev, ki jo aplikacija že uporablja za vabila.

**Kaj tu namenoma ne sodi.** Izdaja računov in samopostrežna rezervacija sta že prevzeti v ProPT
(§68), zato tu nista predlagani. Davčno potrjevanje računov ni prevzeto nikjer in ni tehnično
vprašanje — če ProPT izdaja račune za gotovino, brez tega ne sme.

**Odprto vprašanje za Simona:** ali sta prisotnost in paket še »brezplačna aplikacija« ali sta že
ProPT. Moja presoja: prisotnost sodi v brezplačno (brez nje je zapis o vadbi nepopoln), paket pa je
mejni primer, ker je prvi korak k denarju. Odločitev je tvoja; napisana naj bo v §68, ne tukaj.

**Dokazi iz izpeljanih dni (§88):** paketi in odštevanje kartic v Excelu ali ločeni tabeli (dan 01: 5
min na dan; dan 02; dan 04: 5–10 min na dan); plačila in račun podjetju (dan 01: 3 in 10 min; dan 06:
mesečni pavšal, 15 min na mesec); odpoved in neprihod je mogoče le izbrisati (dan 01); prisotnosti ni
kam zapisati (dan 05 je »Nedoločen« na kartici brala kot prisotnost, §80.55); opomniki in sporočila
prek WhatsAppa, 8 min na dan (dan 01); čakalna vrsta v opombi (dan 06); meritve v zvezku ali
preglednici (dan 01; dan 02: 2 min na stranko ob prvem obisku; dan 06: 8 min na stranko na mesec);
domača naloga brez potrditve (dan 01) in v istem polju kot zdravstvene opombe (dan 03, §88.7).

## 87. [ ] Prihodnja shema ne nosi polja glasovne opombe

**Naročilo (Simon, 2026-09-27):** prihajajoča shema naj bo brez polj glasovne opombe.

**Dejstva:** shema 5 je živa ([recordSchemas.js](src/data/recordSchemas.js): `STABLE_SCHEMA = 5`,
`DEFAULT_READ_SCHEMA = 5`); prihajajoča oblika je `SCHEMA_PREVIEW`. Edino polje je `hasVoiceNote` v
`SCHEMA_4.planUpdates`, ki ga SCHEMA_5 in PREVIEW podedujeta. Nič ga ne piše več (`ff15fff`) in nič ga
ne izriše; bere ga le `isPlainQuickSignal` ([quickSignals.js](src/domain/quickSignals.js)). Posnetka ni
bilo nikoli (§80.35).

**Ustavljeno, čaka na Simona.** Izpust polja iz PREVIEW podre dve pravili gradnje:
- »Shema se samo širi«
  ([starWriteInvariants.test.mjs](tests/unit_js/data/starWriteInvariants.test.mjs)): polje iz SCHEMA_4
  mora ostati v vsaki novejši živi obliki, ker ga starejša gradnja na telefonu še piše (gradnja pred
  `ff15fff` ga piše v vsako živo shrambo).
- »PREVIEW je nadmnožica stabilne oblike« ([backupFile.test.mjs](tests/unit_js/data/backupFile.test.mjs)).

**Odločitev:** ali se uvede postopek za **umik** polja in katero od obeh pravil se zanj omili. **Predlog
(Claude):** seznam umaknjenih polj ob shemah (zbirka, polje, datum, razlog), ki ga obe pravili
upoštevata. Nenameren izpust še naprej podre gradnjo, načrten umik je viden v isti datoteki kot sheme.
Polje gre na seznam šele, ko gradnja, ki ga je nehala pisati, teče v objavi dovolj dolgo, da starejše
gradnje s telefonov izginejo. `hasVoiceNote` je prvi kandidat.

**Ko bo odločeno:** `SCHEMA_PREVIEW.planUpdates` brez `hasVoiceNote`; SCHEMA_4 in SCHEMA_5 ostaneta
(§60), prav tako `tests/fixtures/schemas/schema_4.json` in `schema_5.json`. Na PREVIEW star vnos s
`hasVoiceNote: true` postane gol dotik, ki ga ponoven pritisk sme odstraniti; to je prav, ker posnetka ni
bilo. Izvoz se piše pri 5, zato ga trener ne občuti.

## 88. [~] Dan trenerja: vrzeli, ki jih pokaže izpeljan delovni dan

Odprto 2026-09-27. Način 2 raziskovalnega preizkusa (veščina `exploratory-test`): podagent brez
konteksta si kot osebni trener zamisli svoj delovni dan — treninge, stranke in vaje, pa tudi podporne
naloge, pakete, plačila, sporočila — in ga nato poskusi izpeljati z LibrePT na `main`. Dnevi in
poročila so v `.private/exploratory-test/days/`, seznam odigranih dni v
`.private/exploratory-test/scenarios.md`.

**Razmerje do §86:** §86 je namizna ocena iz kode in predpostavk. Tukaj je vsaka vrzel izpričana z
enim konkretnim dnem. Vrzel, ki jo §86 že ima, dobi tam vrstico dokaza, ne novega razdelka; tukaj je
samo, česar ni nikjer drugje, in presoja, ali se avtomatizacija izplača.

### 88.1 [x] Iskanje v katalogu brez zadetka se konča, uvoz večjega kataloga pa obstaja — narejeno 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#881-x-iskanje-v-katalogu-brez-zadetka-se-konča-uvoz-večjega-kataloga-pa-obstaja--narejeno-2026-09-30).

### 88.2 [ ] Šest novih strank za skupinski trening je šest celih obrazcev

Dan 01: prva jutranja skupina, šest strank, ki jih aplikacija še ne pozna. Vsaka je odprla cel obrazec
za stranko; 9 minut namesto 4 v koledarju. Od §80.18 obrazec ponudi dodajanje s pravkar vpisanim imenom,
še vedno pa vsaka stranka odpre celoten obrazec. **Vrednost:** enkratna pri vsaki novi skupini, a prav
na prvi dan, ko se odloča, ali trener aplikacijo obdrži (ocena trenerke, ne meritev). **Cena:** majhna —
dodajanje samo z imenom, ostali podatki pozneje. Paziti na privolitev po GDPR, ki ob vpisu nastane.
**Presoja: čaka na Simona** — ali stranka sme nastati brez privolitve, je njegova odločitev (§27).

Prvo odprtje 2026-09-30: trener skupine 60+ (deset ljudi) je po treh vpisanih strankah ocenil »vsaj 4
dotiki na osebo« in dodal, da med vadbo nima gumba »vsi opravili vajo«.

Dan 10 (2026-09-30): enkratna delavnica za 20 članov tekaškega kluba. Trening zahteva vsaj eno
stranko (»Izbrati moraš vsaj eno stranko.«); trener je vpisal eno izmišljeno »stranko« z imenom kluba.
Števila udeležencev in postaj ni; ocena 0.

### 88.3 [ ] Nadomestni trener dobi načrt po WhatsAppu

Nadomeščanje: dan 01 pošlje načrt kolegici po WhatsAppu; dan 03 prevzame stranko bolnega kolega,
dogovor po SMS-u, pojasnilo v polju za zdravstvene opombe; dan 04 prek sporočila ali tabele kluba. Trije
dnevi od štirih. Dan 09: fizioterapevtka stranke želi videti program; edini izvoz pri stranki je
šifriran izvoz po GDPR (3 minute v aplikaciji, 4 zunaj, trenerjeva ocena).

**Presoja: izplača se majhen del** — »Deli kot besedilo« za načrt in zapis treninga, brez drugega
trenerja v aplikaciji. Pokrije tudi fizioterapevtko. Več trenerjev na enem računu je EnterprisePT.

### 88.4 [ ] Trening, vpisan za nazaj, aplikacija imenuje »Zamuja«

Dan 02: trener je jutranje treninge vpisoval popoldne, ker jih je vodil brez telefona. Plošča jih je
kazala kot »Zamuja 8 h«. Poti »to se je zgodilo, zapiši« ni: trening je treba začeti in zaključiti s
časi, ki niso pravi. Izguba načrta ob osvežitvi (§80.53) je popravljena. **Vrednost:** vsak trener, ki
kdaj vodi trening brez telefona (ocena trenerja). **Cena:** majhna do srednja — pri minulem, nezačetem
treningu »Zabeleži kot opravljen« z izbranim časom namesto odštevanja zamude. **Presoja: izplača se.**

### 88.5 [ ] Naslednji teden se sestavi trening za treningom

Dan 03: za prihodnji teden je trenerka vsak trening ustvarila posebej (ime, kraj, datum, čas, stranka,
vaje). Ni pogleda na teden in ne kopije treninga na drug datum; »Ponovi vsak teden« pomaga le, ko je
vsebina vsak teden enaka, »Kopiraj ta načrt na …« pa kopira načrt k drugemu udeležencu, ne na drug dan.
Ocena trenerke: 10–15 min na teden več kot na papirju. **Vrednost:** vsak teden, pri vsakem trenerju, čigar
programi napredujejo. **Cena:** majhna do srednja — »Kopiraj trening na datum«, z načrti udeležencev.
**Presoja: izplača se.**

### 88.6 [ ] Okno za vabila se odpre po vsakem shranjenem treningu

Dan 03: ob sestavljanju petih treningov zapored se je po vsakem odprlo okno »Pošlji vabila« in ga je
bilo treba zapreti, preden je lahko dodala vaje. **Vrednost:** majhna, a ob vsakem načrtovanju tedna.
**Cena:** majhna. **Presoja: čaka na Simona** — samodejno odpiranje je bila odločitev (vabilo takoj po
dodanem udeležencu); vprašanje je, ali ob načrtovanju vnaprej zadošča obvestilo »vabila niso poslana«.
Prvo odprtje 2026-09-30: oba trenerja brez predznanja sta okno zapisala kot zmedo (»Nisem prosil za
vabila; okno je skočilo vmes«), drugi tudi, ko stranka ni imela e-pošte in je bil »Pošlji vabilo«
zbledel.

### 88.7 [~] Polje za poškodbe nosi vse, kar trener ve o stranki

**Narejeno** (`d273a74`, §80.69): obrazec stranke ima ločeni polji »Poškodbe in omejitve« in »Opombe«;
urejevalnik načrta pokaže obe, poškodbo prvo. Obstoječi zapiski ostanejo v »Opombah«; trener, ki želi
opozorilo, jih prenese sam.

**Odprto** — dan 08 (2026-09-30): nova stranka mora pred vadbo prinesti zdravniško potrdilo. Trenerka
ga je lahko zapisala le v »Opombe«, brez datuma veljavnosti in brez opomnika, ko poteče; ocena 1.
Vrednost in cena še nista presojeni.

Dan 11 (2026-10-01): stranka s kolenom; trener je želel opozorilo ob sami vaji (»koleno« pri počepu),
aplikacija pa poškodbo pokaže enkrat, na vrhu podloge pod imenom stranke (preverjeno na `6230070`:
»Desna rama, brez potiskanja nad glavo.«). Ocena 1. Vrednost in cena še nista presojeni.

### 88.8 [ ] Prehransko svetovanje nima mesta

Dan 05: trenerka nekaterim strankam svetuje tudi prehrano (teža, cilj kalorij, jedilnik za teden) in
to vodi v ločenem zvezku, po njeni oceni eno uro na teden za tri do štiri stranke. **Vrednost:** samo pri
trenerjih, ki prehrano svetujejo. **Cena:** velika, če naj aplikacija vodi jedilnike; prehransko
svetovanje je tudi ločena stroka z lastnimi pravili. **Presoja: ne izplača se.** Kar od tega zares
potrebuje prostor, pokrijeta ločeno polje za opombe (§88.7) in meritve skozi čas (§86.4, §78).

### 88.9 [ ] Stranka, ki je podjetje, in lokacija z njegovim imenom

Dan 06: trener ima pogodbo s podjetjem (osem zaposlenih, mesečni pavšal) in vadi pri njih. Podjetje je
vpisal kot stranko, lokacija pa je naravno kar ime podjetja — in aplikacija jo zavrne: »Kraj ne sme
vsebovati imena stranke, Northlight pa je ime stranke.« Pravilo je bilo narejeno za zasebnost
posameznikov (ime stranke ne sme v naslov ali kraj, ki ga vidijo drugi). **Vrednost:** vsak trener s
pogodbo za podjetje, vsak tak termin. **Cena:** majhna, a zahteva pojem »stranka je skupina ali
podjetje«, ki ga danes ni (ni števila ljudi, ni ločenega obračuna). **Presoja: čaka na Simona** — ali
podjetje sodi med stranke z izjemo pri pravilu o imenu, ali pa je to lokacija oziroma skupina.

### 88.10 [ ] Izposoja opreme strankam

Dan 06: trener strankam posoja opremo za domačo vadbo (15 € na mesec) in to vodi v opombah; ob treh
strankah se boji, da pozabi pobrati najemnino. **Vrednost:** redka dejavnost ob treningu. **Cena:**
srednja, in je denar, ki ga aplikacija sploh ne vodi (§86.2). **Presoja: ne izplača se.**

### 88.11 Seštevek po šestih dneh (2026-09-27)

Šest dni, šest trenerjev (2026-09-27). Aplikacija je vsak dan nosila vnos strank, termine in
sestavljanje načrta, pogosto hitreje od papirja. Zunaj je ostal denar (paketi, plačila, računi) v petih
dneh od šestih, meritve v štirih, nadomeščanje v treh, prisotnost in odpovedi v dveh (§86, §88.3).

**Izplača se, po vrstnem redu** (§80.53, §80.55, §88.1 in §88.7 so medtem narejeni):
1. Izgubljen načrt §80.52 (popravek je §95), nato §80.54.
2. Paket in zapis prisotnosti (§86.6, točki 2 in 1); »brezplačno ali ProPT« čaka na Simona.
3. Kopija treninga na drug datum (§88.5), vpis za nazaj (§88.4), deljenje načrta kot besedilo (§88.3).

**Čaka na Simona:** §88.2, §88.6, §88.9. **Ne izplača se:** §88.8, §88.10.

**O postopku:** dan izpelje tri do šest treningov v eni uri; dnevi, ki so poskusili zajeti vse, niso
prišli do konca.

### 88.12 [ ] Trener zboli: vsak termin se prestavi posebej, obvestilo dobijo le povabljeni

Dan 07 (2026-09-30, `main` `e8e90d8`; samostojni trener v Kranju, 12 strank, ki jih vodi v Excelu):
zjutraj bolan, šest terminov današnjega in jutrišnjega dne prestavi drugam. Za vsak termin »Uredi«,
datum, čas, »Shrani«; opozorilo o prekrivanju in ponudba, da povabljenim pošlje nov čas, sta
pohvaljena. **14 minut v aplikaciji proti 10 na papirju, in še 10 minut ročnih sporočil**, ker
obvestilo dobijo le stranke, ki so vabilo že prejele (minute so trenerjeve ocene). Zapisa »odpadlo
zaradi bolezni« ni, trening pa na plošči kaže »Zamuja«.
**Vrednost:** nekajkrat na leto (predpostavka: 3–5 dni bolezni) po okoli 25 minut, torej ~2 h na
leto; večja je zaupanje strank, ki za odpoved izvedo pravočasno. **Cena:** srednja: izbira več
terminov, »prestavi za N dni« ali »odpovej ta dan«, eno besedilo za vse prizadete. Sporočilo brez
strežnika je lahko pripravljeno besedilo za SMS ali e-pošto. **Presoja: čaka na Simona**, ker je del
iste odločitve kot zapis odpovedi (§86.3, »Odpoved in pravilo o pozni odpovedi«): brez zapisa
odpovedi je prestavljanje le premik ure.

### 88.13 [ ] Selitev iz preglednice: stranke in programi se vpišejo na roke

Dan 07: sedem strank iz Excela je vpisal ročno, 1–2 minuti vsako; **14 minut v aplikaciji proti 10 v
preglednici**. Programi 10 minut, ker katalog nima vaj, kot so potisk nog na napravi, kettlebell zamah in
dvig medenice. Za 12 strank okoli 20 minut, enkrat. Uvoz programa zahteva obliko JSON (§80.147); izguba
številk ob uvozu je popravljena (§80.113).
**Vrednost:** enkratna, a na dan, ko trener odloča, ali aplikacijo obdrži (kot §88.2). **Cena:** majhna
za stranke (CSV: ime, telefon, e-pošta, cilj, poškodba); srednja za programe. **Presoja: čaka na
Simona**: uvožena stranka nima privolitve, isto vprašanje kot §88.2.

**Preveriti na pravem telefonu:** v »Ustvari rutino« vpis ponovitev v pravkar dodano vajo ne ostane (8
postane 10). V brskalniku orodja se zgodi le pri polju s seznamom predlogov (`list="reps-presets"`).

### 88.14 [ ] Nov telefon: obnovitev iz kopije je šele za uvodom, ki sprašuje, kar je v kopiji

Dan 08 (2026-09-30, `main` `e8e90d8`; trenerka, ki ji je stari telefon razpadel): prvi zagon na
novem telefonu ponudi pogoje, izbiro teme, štiri obvezne osebne podatke, nato »Razišči z vzorčnimi
podatki«, vodeni ogled in »Začni s prazno aplikacijo«. Obnovitve iz kopije ni; ta je v ☰ →
»Upravljanje podatkov« → »Uvozi varnostno kopijo«, do katerega trenerka pride šele po uvodu. Kopije
sama ni mogla preskusiti (§80.136); napačno datoteko je aplikacija pravilno zavrnila: »Ta datoteka ni
varnostna kopija LibrePT. Na tej napravi se ni nič spremenilo.«
**Vrednost:** redka (predpostavka: enkrat na dve leti na trenerja), a prav takrat odloči, ali trener
aplikaciji še zaupa; uvod pri tem stane okoli minute in vodi v napačno smer (»Začni s prazno
aplikacijo«). **Cena:** majhna: na prvem zaslonu »Obnovi iz varnostne kopije« pred uvodom.
**Presoja: čaka na Simona**, ker spremeni uvod, o katerem je odločil v §81 (podatki obvezni na vsaki
poti); kopija te podatke že nosi.

### 88.15 [ ] Serija se ne da ustaviti za dopust stranke ne spremeniti od nekega dne naprej

Dan 09 (2026-09-30, `main` `e2daf5e`; samostojni trener v Novem mestu, 14 strank): stranka gre za dva
tedna na dopust, njeni sredini termini naj izpadejo in se nato nadaljujejo. Premora ali preskoka večerov
ni. **6 minut v aplikaciji, 1 na papirju, ocena 0.** Isti dan: od novembra so vsi torki uro pozneje;
uspelo je le kot dva koraka na stranko (stara serija do 27. 10., nova od 3. 11.): **8 minut proti 4**,
ocena 1 (minute so trenerjeve ocene).
**Vrednost:** dopusti strank so pogosti (predpostavka: vsaka redna stranka dva- do trikrat na leto),
sprememba urnika telovadnice nekajkrat na leto; brez tega trener serijo briše ali pušča napačne termine,
ki jih vabila pošljejo naprej. **Cena:** srednja: »izpusti večere od–do« in »spremeni od tega dne
naprej« pri seriji. **Presoja: izplača se**; konec serije pri današnjem večeru (§80.138) je popravljen.
Obseg (kaj z že poslanimi vabili) čaka na Simona.

### 88.16 [ ] Nesreča med vadbo nima zapisa, ki bi ostal

Dan 10 (2026-09-30, `main` `d12646c`; zunanji trener v velikem fitnesu v Kranju, 5 strank): stranki
med vadbo zdrsne in si poškoduje zapestje. Trener je zapisal, kaj se je zgodilo in kaj je naredil, v
»Opombe« ob vaji z »Bolečina ali nelagodje v sklepu«. Ker je vajo nato odstranil iz načrta, opombe ni
v zgodovini treninga; polje »Poškodbe in omejitve« je ostalo »Ni navedeno«; opomnika »pokliči jutri«
ni. Na seznamu »Čakajoče na pregled« je signal bolečine med enajstimi »Prelahko« brez razlike in brez
besedila opombe. **5 minut v aplikaciji proti 3 na papirju, ocena 1** (trenerjeva ocena).
**Vrednost:** redko (predpostavka: nekajkrat na leto), a pomembno za trenerjevo odgovornost in za
naslednji trening stranke; zdaj zapis izgine z vajo. **Cena:** majhna: signal bolečine naj se zapiše
pri stranki, ne le pri vaji, in naj bo na seznamu za pregled viden kot drugačen. **Presoja: izplača
se** za ta del; ločen obrazec za poročilo o nesreči čaka na Simona.

## 89. [~] Pregled 2026-09-28: isti podatek na več mestih

Iskano po vrednotah »en vir resnice«, »preprostost« in »napake ne more narediti«. Dobesednih
kopij kode je malo: iskanje enakih blokov šestih vrstic v `src/` je našlo le spodnje. Dobiček je
v podatkih in seznamih, ki jih ljudje ročno prepisujejo na drugo mesto. Po dobičku padajoče.

### 89.1 [x] Seznam datotek za delo brez povezave je ročna kopija `integrity.json` — odločeno 2026-09-29: ostane

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#891-x-seznam-datotek-za-delo-brez-povezave-je-ročna-kopija-integrityjson--odločeno-2026-09-29-ostane); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 89.2 [ ] `docs/SRC_MODULES.md` (128 KB) prepisuje glave modulov

Opis vsake datoteke v `docs/SRC_MODULES.md` ponovi razlog iz njene glave, zato ima vsak razlog dve
mesti. **Predlog:** katalog ustvari orodje iz prve vrstice glave in plasti iz
`agent_tools/import_layers.py`; ročno ostane le uvod.

**Narejeno** (`a87e0e8`): 21 glav nosi, kar je pisalo le v katalogu. Vrstic kataloga, katerih glava ima
manj kot 30 % njihovih besed, je bilo 48 od 286 (2026-09-29), pred `a87e0e8` 31, zdaj 11 (ustvarjene
strani, vendorirana datoteka, mape — nimajo glave). Ena napačna vrstica je popravljena.

**Odprto:** orodje, ki katalog ustvari, in sprememba pravila, da nov ali premaknjen modul popravi
katalog v isti spremembi; pravilo spremeni Simon.

### 89.3 [x] Pet pravil o usklajevanju sej opisuje, kar `build check` že izsili — uveljavljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#893-x-pet-pravil-o-usklajevanju-sej-opisuje-kar-build-check-že-izsili--uveljavljeno-2026-09-29); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 89.4 [x] Tema je zapisana na šestih mestih, ena kopija je že zastarela — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#894-x-tema-je-zapisana-na-šestih-mestih-ena-kopija-je-že-zastarela--popravljeno-2026-09-29); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 89.5 [x] Seznam zbirk ročno, čeprav obstaja izpeljan — popravljeno 2026-09-29

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#895-x-seznam-zbirk-ročno-čeprav-obstaja-izpeljan--popravljeno-2026-09-29); what shipped is in [CHANGELOG.md](CHANGELOG.md).

### 89.6 Kar se ne izplača
Nadaljnje delitve velikih datotek (§24.5, §24.7) le, če kaj postane preizkusljivo ali skupno — §24
je to že ugotovil. Razdelitev slovarjev po funkcijah (§14.5) ne odpravi nobene kopije.

## 90. [ ] Extending this app into ProPT: the scenarios, the approaches, and the seam

**Asked by Simon 2026-09-28**, in two parts: list the scenarios ProPT adds, and find the
architectural approaches for extending this app into it. The design belongs here rather than in
`~/Projects/EnterprisePT`, because that is what its `TODO.md` §16.3 concluded on 2026-09-25 — *"the
seam is designed there, not here"* — and it names itself as what blocks `PROPT_IMPLEMENTATION.md` §8
step 2, since an invoice needs somewhere to live before it needs anything else.

Read at the source before writing this: that project's `README.md`, `AGENT_RULES.md`,
`PROPT_IMPLEMENTATION.md` §2 and §9, and its `TODO.md` §15.1, §15.4 and §16. The scenarios below are
its list, not a new one; what is added here is what each one demands of THIS repository.

### 90.1 [ ] The contradiction that decides everything else

Two documents there disagree, and neither says so:

- `PROPT_IMPLEMENTATION.md` §2: the trainer who pays **"installs a different app from a different
  address"**.
- `TODO.md` §16.3 recommends the overlay because then **"the trainer has one app"**.

**A different address is a different origin, and a different origin has an empty IndexedDB.** The paid
build would start with no clients, no sessions and no history. Buying ProPT would mean carrying the
database across by hand, and since 2026-09-28 that also means typing the backup password (§18.8).
Nobody wrote that down, and it is the first thing a paying customer would meet.

**Why the addresses cannot simply be the same.** The lock is physical: a separate build, because a
licence check inside an MIT app can be deleted (§68.1). Physical enforcement needs the build not to be
publicly downloadable, which needs an access-controlled host, which is a different origin. **The
separation is forced by the lock, not chosen.** Anyone arguing for one origin has to propose a
different lock first.

**Recommended: separate origins, and the data crosses by a channel that already exists.**

- **Google Drive.** `appDataFolder` is scoped to the OAuth grant rather than to the origin
  ([driveAppData.js](src/data/driveAppData.js) says so), so a ProPT build shipping this app's own
  client id would see the same snapshot: install, connect Drive, type the backup password, sync.
  **Not verified at Google's documentation** — that is this repository's own comment, and it must be
  read at the source before anything depends on it.
- **The backup file**, for a trainer who never connected Drive: export on the old address, import on
  the new one, one password. Already built, and now the upgrade path as well.

This is the same question as §16.6. It is one decision, not two, and it decides both.

### 90.2 [ ] The scenarios ProPT adds, and what each one demands here

From `TODO.md` §15.1 there, in its order. The right-hand column is the new part: what each scenario
needs from THIS app, which is what makes the approaches in §90.3 comparable at all.

| Scenario | What it needs here |
| :--- | :--- |
| **The month-end invoice run** — every client, the sessions actually held, the price of each, one action that produces every invoice with its QR code | Reads sessions, which exist. Writes invoices — **storage this app does not have**. A screen and a menu entry. Its own QR encoder, already a parameter |
| **Session packages and the balance left** — bought ten, used seven, three left, and **the client must see it too** | Storage. Reads sessions. A document the phone shares — no server, no client account |
| **Who owes, and for how long** — invoices sent and unpaid, oldest first, a reminder carrying the same QR | Reads its own storage. A screen. The phone's own share, not a transport here |
| **A cancellation that costs, and one that does not** — the trainer's rule, applied when a session is cancelled | Reads sessions, which already carry when the cancellation happened. **Needs no hook** — see §90.5 |
| **A different price per client and per kind of session** | Storage, attached to a client |
| **The client's monthly summary** | Reads records that exist. No new storage |
| **The year in one file, for the accountant** | An export that carries its storage |
| **Self-service booking, and every Google Calendar integration** (§11 and §19 there) | The whole calendar integration moves OUT of this app (§68.3). The overlay needs network and screens, and it writes this app's own sessions |

**Three of them are the product**: the invoice run, packages, and who owes (§15.4 there). They are one
loop — the work is recorded, the invoice follows from it, the money is chased from the invoice — and
each replaces a notebook. **All three need exactly one thing this app cannot do: store a record whose
shape it does not declare.** Everything else on the list is screens and reading.

### 90.3 [ ] Four approaches, and what each costs

`TODO.md` §16.3 in the other project compares three. A fourth is missing, and it changes the answer.

| Approach | How it composes | What it costs |
| :--- | :--- | :--- |
| **1. Fork** | Copy the repository, edit freely | A merge conflict on every release of this app, for ever. Rejected there, and still rejected |
| **2. A separate app reading an export** | Two apps, a monthly import | Fails the invoice run: a month-end screen that needs re-importing a diary is the work the trainer already does. Invoices land outside this app's backup and sync |
| **3. This app provides an empty function for ProPT to fill** | This app adds `registerExtensions()`, which does nothing here, and `appBoot.js` calls it at start-up. The paid build replaces that one file | One function in the free app whose only purpose is elsewhere. Against value 4 — the simplest thing that does the job, no layer without a concrete problem — but it is honest and testable, because the contract is named |
| **4. The paid build provides its own starting file** | `index.html` is the first file a browser loads, and it names the JavaScript file that starts the app. The paid build GENERATES its own `index.html` from this one, substituting that single line | **Recommended.** Nothing is added to this app for the paid product, and generating rather than copying means every later change here — a new tag, a tightened `Content-Security-Policy` — reaches the paid build on its next rebuild |

**Why 4 beats 3.** A file the paid build replaces with its own copy stops receiving later changes to it,
silently. So which files it may replace depends on how often each changes:

- `index.html` changes almost never, but when it does the change is often security-relevant (the
  `Content-Security-Policy`). The paid build **generates** its copy, substituting the one line that
  names the starting script.
- `app.js` / `appBoot.js` change with every feature — **never replaced**.
- `routeTable.js` (a line per screen) and `applicationHeader.js` (one per menu entry) — **neither**:
  this app gains a list they register into. That is its existing pattern, `registerShellRender` in
  [renderRegistry.js](src/modules/common/renderRegistry.js), used by its own routes and menu, so it is
  not code for a paid tier; §68's first bullet already allows the overlay to *"register itself into
  existing registries"*.
- `cacheManifest.js`, the offline file list, changes with every module. It stays hand-written by the
  2026-09-29 decision (§89.1); how the overlay's files reach it is §90.4.
- `recordSchemas.js` is never touched; the one new collection is declared here (§90.6).

**Approach 3 is not forbidden.** *"No paid features, no dead code for them"* is from
`PROPT_IMPLEMENTATION.md` §2 in the other project, written by an agent; §68 here does not contain it. The
case for 4 is this app's value 4 (the simplest thing, no layer without a concrete problem): a
preference, and Simon may pick 3. Whether §68's two bullets are Simon's rulings is §90.8, decision 1.

**Copying the source is cheap here because there is no bundler**: `python -m build` is `copytree` of
`src/`, a version stamp, one `<base href>` rewrite and the integrity catalog. The copy is pinned to a
commit (a git submodule; `PROPT_IMPLEMENTATION.md` §9 says "a pinned checkout"), and on each new pin the
paid build runs its own gate. If this app ever gains a bundler, ask again. **The cost is operational**:
a fix here reaches a paying trainer only when the paid build is rebuilt and redeployed — a promise
ProPT makes, written there. The MIT notice travels with the copy.

**Rejected:** publishing this app as an npm package (no `package.json` or bundler here on purpose; §68:
*"nothing here changes shape for it"*); loading modules at run time from the free site (breaks offline
use, `script-src 'self'` in [index.html](src/index.html) and the integrity catalog, ties the paid
product to the free site, and tells the free host which trainers pay).

**Not a plugin system (Simon asked, 2026-09-28).** No loader: one `index.html` and static `import`s.
ProPT is one product built from two source trees with the same owner — a build variant. The
registration lists are no API: [CONTRIBUTING.md](CONTRIBUTING.md) §4 says *"Nothing here is a public
API."* A fork that leans on internal structure re-pins and fixes itself.

### 90.4 [ ] The precache list becomes generated, and that pays for itself here

A ProPT file missing from [cacheManifest.js](src/sw/cacheManifest.js) is not precached, and the app
fails in the gym basement. This section proposed generating the list with a tool the overlay also runs.

**Decided otherwise for this app on 2026-09-29 (§89.1, archived):** the list stays hand-written, because
a changed byte in `sw.js` or `sw/*.js` is what makes a phone fetch a new version, and a generated list
would re-download every file on every release. A test compares the list with `src/` exactly, both ways
(`d4ee523`).

**Open for ProPT:** the overlay's files must reach the list without the paid build replacing
`cacheManifest.js`, which changes with every module (§90.3). Either the list gains a registration point
like routes and the menu, or the paid build generates its copy the way it generates `index.html`.

### 90.5 [ ] Money is computed at invoice time, so no event hook is needed

The cancellation rule looks like it needs a hook: *apply the rule when a session is cancelled*. **It
does not, and building it that way would be worse.**

A side effect at cancellation time writes down a decision that cannot afterwards be re-derived — change
the rule, or fix a wrong cancellation time, and last month's charge is a number nobody can explain.
Computing it **at invoice time**, from the session records this app already keeps, makes every charge
re-computable from the records and auditable against the rule that was in force. The screen that shows
*"cancelled at 07:10, less than 24 hours, this session is used up"* is then a read, not a write.

**So the overlay never reacts to anything in this app.** No event bus, no hooks, no listeners for a
paid tier. That is the single biggest reason this app stays clean under approach 4.

### 90.6 [ ] Storage: one collection this app carries and never reads

The invoice must ride in the backup, the Drive sync and the export, or the one record the law requires
to be kept is the least protected record on the phone. And this app must not interpret it.

**One collection, declared in a numbered schema**, with a fixed envelope and an opaque body:

| Field           | Meaning                                                                          |
| :-------------- | :------------------------------------------------------------------------------- |
| `id`            | UUIDv7, as every record here                                                      |
| `kind`          | namespaced, owned by the overlay — `propt.invoice`, `propt.package`               |
| `ownerClientId` | which client it concerns, or null, so erasure and the Art. 15 export can find it  |
| `sealedAt`      | once set, the write layer REFUSES any further change to that record               |
| `keptUntil`     | an ISO date before which erasure must not touch it                                |
| `payload`       | opaque JSON: stored, projected, backed up, synced and exported, never read        |

**Two properties this app does not have, and both are right on their own merits:**

1. **Sealed records.** ZDDV-1 article 86(3) requires that a stored invoice cannot be changed or
   deleted. The star-write layer has no notion of a record that refuses an update.
2. **Kept by law, and SAID so.** [clientErasure.js](src/data/clientErasure.js) irreversibly anonymises
   every identifying field of a client; run over an invoice it would destroy a record the law requires
   to be kept. GDPR article 17(3)(b) exempts exactly that. So erasure must skip records whose
   `keptUntil` has not passed **and report what it kept and why** — a person asking to be forgotten
   has to be told what remains. **That is a gap here today, with or without a paid tier.**

**A decision that keeps new personal data out of the free app.** A UPN order needs the payer's street
and city (`PROPT_IMPLEMENTATION.md` §3.1), and that project assumed this app's client record gains an
address. **It should not.** The address belongs in the overlay's own record, reached through
`ownerClientId`, so this app gains no category of personal data it has no use for, and neither its
consent wording nor [PRIVACY.md](PRIVACY.md) changes for a feature it does not have.

**The cost, named rather than discovered**: a collection the backup carries must be in a NUMBERED
schema, so this is a schema bump with a real record change behind it — unlike §18.8's container change,
which deliberately avoided one.

### 90.7 [ ] What is deliberately NOT built here

- **No licence check, no token, no server address.** The lock lives in the paid build alone (§68.1). A
  check here would be both removable and dishonest.
- **No transport seam.** Closed there 2026-09-25: an invoice leaves as a file the phone made.
- **No sync-target seam.** [syncMerge.js](src/data/syncMerge.js) is already pure and takes no view on
  where a snapshot came from; a hosted tier calls it with its own wire. This line exists so nobody
  adds one.
- **Nothing for the multi-trainer tier.** One trainer per install is a decision here
  ([trainerIdentity.js](src/modules/common/trainerIdentity.js): *"Not a profile, and deliberately not
  one"*). A client belonging to two trainers is a different data model, not an overlay on this one.

### 90.8 [ ] What Simon decides, and what is already answered

**Answered by this design, needing no ruling:** how the overlay loads (it owns the entry), how it
appears (the registry pattern this app already uses), and whether §68 has to change (**no** under
approach 4, which adds nothing here for a paid tier). How the overlay's files are kept for offline use
is open again since §89.1 kept the list hand-written (§90.4).

**His to decide:**

1. **Whether §68's two bullets are his decisions at all.** They are introduced there as findings of
   another project's proposal that *"bind THIS repository"* — written by an agent, not ruled by him.
   Until that is settled, this section treats them as the best available reasoning rather than as
   rules, and approach 3 stays open to him.
2. **The origin fork of §16.6**, which §90.1 answers but cannot close.
3. **Whether the collection is declared now or when the first invoice is built.** Declaring is cheap;
   the schema bump is the cost, and it buys nothing until something writes to it.
4. **Whether erasure's "kept by law" behaviour is built now on its own merits**, ahead of any paid
   tier. It is a correctness gap in this app today.

**Blocks**: `PROPT_IMPLEMENTATION.md` §8 step 2 there. **Blocked on**: nothing here — decisions 3 and 4
set the order, not the design.

## 91. [ ] The pipeline is slower than it needs to be — measured 2026-09-30

Last green CI run (36063598211): 20 min; Stage 3 alone 12 min (e2e 675s, demo 472s). Local `build
check`: 9–10½ min.

**Done 2026-09-30:** the story walk no longer waits 8s on a card with no Show me (`e2f0d21`), walks each
chapter alone and ends on step n of n (`e164826`), and opens the story in the sandbox as the app does
(`fbddd8a`). Whole-story walks 83–86s → 20–21s; in the gate demo 248s and e2e 313s, so e2e now sets
Stage 3's length. The longest demo test, `test_every_tap_show_me_performs_is_drawn_by_the_hand_first`
(150–185s), librept-02 plans to split per chapter.

1. **[~] CI gave e2e and demo one browser worker each — fixed in `64936fa`, not yet measured in CI.**
   Each CI task has its own 4-core runner; a task called with no argument now takes the whole budget,
   and only Stage 3 of `build check` splits it (`demo_worker_count`, `e2e_worker_count` in
   `build/__init__.py`). Expected: CI Stage 3 from ~12 to ~6 min. Next step: read the Stage 3 job
   times of the first CI run after the push, then close this item.
2. **[ ] Low priority: every browser job installs Chromium with `--with-deps` again** (34–75s per job,
   four jobs in a row on the critical path). Caching `~/.cache/ms-playwright` saves the download, not
   the system packages; the gain is unknown and likely under a minute. Measure one job with the cache
   before deciding.
3. **[ ] Low priority: the Stage 4 CI job spends ~48s on setup for ~15s of tests.** Stage 4 is its own
   stage by Simon's ruling (2026-09-19); this changes only if that ruling does.
4. **[ ] Gap: no test walks the story at full motion.** Every walk runs with reduced motion, where
   `demoPace` makes every pause zero; `test_demo_pacing.py` times one step at full motion. A defect
   that shows only while the hand travels is found by nobody. One full-motion walk costs ~2.5 min of
   worker time (~3s × 48 steps). Decide whether it runs, and where (the gate, or a scheduled workflow
   like `google-canary.yml`).

## 92. [ ] The peek gesture becomes an L, the deck holds one session, and the demo shows a drag

Ruled by Simon 2026-09-30: (1) sideways uncovers the neighbouring session and only a second, upward
stroke opens it (»obrnjena črka L«), mirrored for the next session; (2) the opened session replaces the
current one's cards; (3) the peeked session is aligned so that the exercise with the same name sits level
with the exercise in focus. Built in §92.1–§92.3. Open: §92.4 and §92.5; §92.6 is §95.1.

### 92.1 [x] The L: sideways looks, up opens — shipped 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md). Commit `97e3226`; `build check` green 12:31 to
12:40.

### 92.2 [x] The deck holds one session, and the peek is aligned to the exercise in focus — shipped 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md). Commit `53a3fed`; `build check` green 16:13 to
16:22.

### 92.5 [ ] The walkthrough's forward switch does nothing — in the DEMO, not in the app

**Measured.** In the guided demo (`?demo=tour`), the forward L did nothing three times, while on the same
screen the mirrored backward L opened the previous session. The app is fine: librept-02's e2e test with
a real mouse opens the next session twice in a row, from a session the gesture had opened. This was
first recorded as an app defect; that was wrong.

**Likely cause, in the demo.** Every demo drag is a synthetic pointer sequence from `performDrag` in
`modules/demo/demoTourPlayer.js`: `setPointerCapture` refuses an id the browser never issued,
`elementFromPoint` returns nothing past the screen edge, and nothing coalesces the moves.

**Narrowed by six probes through the demo's `expectHeld`:** not a negative screen coordinate (a path
inside the viewport fails too); the neighbour is there (`#plan-peek-under-future` has `has-plan`);
`is-open-ready`, `pulled-left` and `is-held` are never set; the blanket keeps `data-plan-peek-wired`,
`EDGE_PX` does not refuse the press, and `isDisabled()` is false in `pointerdown`. So `pointerdown` runs,
but no `pointermove` locks the axis — forward only, on that screen only.

**Stopped deliberately.** One step of a demonstration is broken, not the app. The walkthrough ships the
look and the switch back, not the switch forward. **Next step, when the demo is next worked on**, in
`demoTourPlayer.js`: check whether `pointermove` events arrive at all (the listener is on `window`),
clearing the probe attribute at the start of each gesture; then send the same path through Playwright's
real mouse and through `performDrag`, and compare what `planPeek.js` sees.

**Not established, may be an app defect:** the same starting session gave two different previous
neighbours (`ss081326`, a series row; `h010f2e3`, a history record from 2026-07-20). The runs differed in
route, clock and navigation. To check: open one session from the board and by its
`/session/:id/client/:id` address under one clock, and compare the past layer.

### 92.6 [x] Leaving a session by the peek throws away what was logged in it — merged 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#926-x-leaving-a-session-by-the-peek-throws-away-what-was-logged-in-it--merged-2026-09-30).

### 92.4 [ ] A bound group's last sessions are now shown nowhere — Simon's call

**Found by the gate on 2026-09-30, while §92.2 was built.** Clients bound to ONE plan share one tab.
Before §92.2 the deck listed every member's last session under that member's name, a rule from a real
defect (a trainer read one person's history while coaching another). The injury half of that rule
still holds and is tested. The last-session half is gone: the deck carries no past sessions, and the
peek shows only the ACTIVE client's previous session, because `clientSessionNeighbours.js` answers for
one client. In a bound group of three, two members' previous sessions are reachable nowhere, and
nothing on the screen says so. The docstring in `tests/medium/test_participant_binding.py` records the
same gap.

**Simon's question:** when several clients share one plan, should the peek show each member's previous
session (one sheet per member, or the tapped client's with the others named), or is one client's
history enough? The answer decides whether `clientSessionNeighbours.js` stays a one-client function.

### 92.3 [x] The demo shows a press, a hold and a drag at once — shipped 2026-09-30

Reasoning in [TODO_ARCHIVE.md](TODO_ARCHIVE.md). Commit `78c7bb6`; `build check` green 17:46 to
17:55.

## 93. [x] The exploratory-test skill is Claude's alone, and the agent that needed it could not see it — archived 2026-09-30

Closed — the reasoning is in [TODO_ARCHIVE.md](TODO_ARCHIVE.md#93-x-the-exploratory-test-skill-is-claudes-alone-and-the-agent-that-needed-it-could-not-see-it--archived-2026-09-30).

## 94. [ ] Manj korakov v trenerjevih opravilih — štetje 2026-09-30

**Naročil Simon 2026-09-30:** preštej dotike in črke pri trenerjevih opravilih, oceni čas in poišči, kje
se da korake skrajšati. Opravila so iz pričakovanj dveh trenerjev brez predznanja pred prvim odprtjem.
Šteto po najkrajši poti, ki jo trener pozna po prvi uri, `main` `12d0e66`, 390 × 844, sl, prazna
aplikacija. Potek: `.private/exploratory-test/first-open/2026-09-30-stetje-korakov.md` (ni v gitu).

**Čas je ocena, ne meritev:** dotik 1,5 s, črka 0,4 s, vsako novo okno ali zaslon 2 s branja.

| opravilo                                        | dotiki | črke | okna | ocena |
| :---------------------------------------------- | -----: | ---: | ---: | ----: |
| T0 prvi zagon do prazne aplikacije              |     10 |   40 |    5 |  41 s |
| T1 nova stranka: ime, telefon, poškodba         |      7 |   51 |    3 |  37 s |
| T2 trening jutri 18:00–19:00 za stranko         |      9 |   16 |    2 |  24 s |
| T3 načrt: 3 vaje iz kataloga s težo             |     17 |   17 |    4 |  40 s |
| T4 izvedba in zaključek                         |      5 |    0 |    2 |  12 s |
| T5 isti načrt kot rutina (»Ustvari rutino«)     |     15 |   30 |    3 |  41 s |
| T6 skupina treh novih strank                    |     15 |   42 |    5 |  49 s |
| T7 »Pretežko« in razrešitev po treningu         |      6 |    0 |    3 |  15 s |
| T8 tedenska serija z rutino                     |     12 |   24 |    3 |  34 s |

**Kaj številke skrijejo.** T4 je kratek, ker ničesar ne zapiše: vaje, narejene po načrtu, ni s čim
označiti (§80.6), ročno sestavljen načrt pa po zaključku izgine (§80.52). Zato je T5 ponoven vnos istih
treh vaj: T3 in T5 skupaj 81 s za en program. T6 doda za vsako nadaljnjo stranko 3 dotike, okoli 11 črk
in eno okno (≈ 11 s); skupina desetih je okoli dve minuti.

**Priložnosti, od največjega prihranka.** Vsaka spremeni izdelek, zato **čakajo na Simona**, razen kjer
piše drugače.

1. **En dotik »opravljeno po načrtu« na kartici vaje**, ali ob zaključku »Vse je bilo po načrtu«. Ne
   skrajša T4, ampak ga naredi uporabnega: brez tega trening ne pusti zgodovine (§80.6).
2. **»Shrani kot rutino« v meniju ⋮ podloge**, iz načrta na zaslonu. T5 s 15 dotikov in 30 črk na okoli
   3 dotike in ime (≈ 10 s namesto 41 s), brez ponovnega vnosa tež.
3. **Izbirnik kataloga ostane odprt za več vaj**, kot v »Ustvari rutino«, in nova vaja se odpre sama. T3
   s 17 na 11 dotikov (≈ −9 s); iskanje se po izbiri izprazni.
4. **Eno vprašanje ob zaključku namesto dveh** (»še 26h 49m« in »Ni zabeleženih zaključenih serij«): −1
   dotik, −1 okno pri vsakem treningu, zaključenem pred koncem ure.
5. **Okno »Pošlji vabila v koledar« ne po vsakem »Shrani«** (§88.6): −1 dotik, −1 okno pri vsakem
   treningu (≈ 3,5 s, 15 % T2).
6. **Nova stranka samo z imenom, brez okna** (§88.2): pri skupini −1 dotik in −1 okno na osebo.
7. **Fokus v prvem polju, ko se obrazec odpre** (»Dodaj novo stranko« ima fokus na ✕): −1 dotik,
   tipkovnica se odpre sama.
8. **Ob »Začni trening« odprta prva vaja** (§80.129): −1 dotik na trening. Pri ročno sestavljenem načrtu
   narejeno (`ba6c546`); pri treningu z rutino čaka na Simona.
9. **Polja urejevalnika načrta ob dotiku označijo vsebino**, kot polje za uro: sprememba »10« v »8« brez
   dveh izbrisov.
10. **Datum:** »6.10.2026« se bere od `1024151` (§80.127). Odprto: pri »DO (NEOBVEZNO)« ponuditi konec
    glede na začetek (»+4 tedne«, »+8 tednov«) namesto »danes«, »jutri«, »pet. 2.«, ki za konec serije
    ne pomagajo.
11. **Prvi zagon:** tema bi lahko bila privzeta (Dan) in izbira v Nastavitvah: −2 dotika, −1 okno.
    Obvezni podatki so Simonov sklep v §81, zato jih ta točka ne spreminja.

Že dobro: dotik na uro označi vsebino in »1800«, »9.30«, »17.45« se preberejo pravilno; konec ure se
premakne sam; »Ponovi vsak teden« sam izbere dan; predlog pri »Pretežko« je izračunan iz načrta (12 →
9.5 kg); iskanje strank ponudi »Dodaj »ime« kot novo stranko« in ime prenese v obrazec.

## 95. [ ] A session in progress is a record like any other

**Ruled by Simon 2026-09-30**, from one question: why would only finished sessions be written? The
app does not in fact do that, and its two halves contradict each other.

**What is true today.** A planning draft IS written as an ordinary record, one per participant, into
`state.history`, from the moment it is edited — `syncPlanningSnapshotToHistory` in
`controllers/activeSessionCache.js` rebuilds it from the live session on every save and remembers
each participant's draft id, so several unfinished plans coexist and survive anything. A session in
progress is written nowhere of the kind. It lives in ONE storage key, `librept_active_session`
(`data/sessionCache.js`), which is a constant: opening another session overwrites it, and what the
trainer had logged into the first one is gone. Same problem, two answers, and only one of them
loses data.

**Worse, a draft is written TWICE on every save** — into that cache blob and into history — and the
function above exists to keep the copy in step. That is the single-source-of-truth value paying
rent: one of the two shapes has to win at recovery, and `recoverActiveSession` decides it is the
cache.

**Simon's requirements, which the change is measured against** (2026-09-30): one source of truth;
several unfinished sessions or plans stored at the same time; **no temporary store for a session in
progress at all** — he sees no value in one; and **several sessions may be live in parallel**. The
draft path already meets the first two; a live session must meet all four the same way.

**Parallel live sessions are not hypothetical, and the product said so first.** `a165d08`, shipped
the same day, puts sessions that overlap in time side by side in columns on the board, because a
trainer really does have two groups at once. The clipboard can hold one. A feature that shipped
today already contradicts the single slot.

**The shape.** A session is one record with a STATE — planned, in progress, finished — not a record
plus a private slot. Complete stops being the moment of first writing and becomes a change of state.

**One status, never a second flag, and this is the part that decides whether the change is safe.**
`isPlanning` appears 77 times in `src/`. Every reader that must not count a draft as performed work
filters on it: the client's history, the "last time" numbers, the neighbours the peek offers, the
routine built from a session. Give a live session its own boolean and every one of those filters
silently counts it as performed. One field with three values forces each of those sites to be looked
at once and decided, which is the only version of this that can be finished.

**What stops existing** — not fixed, but with nothing left to protect: the live-session cache
ENTIRELY, its staleness rule, the recovery path at boot, the `canOpen` guard, and §92.6. A reload
reads the record; opening a neighbour leaves the other record alone.

**`canOpen` is not merely unnecessary, it is backwards.** It refuses to leave a STARTED session, to
protect the one slot. With several live sessions allowed, leaving one is the ordinary thing a
trainer does between two groups, and the sideways gesture stops being a way to LOOK at neighbouring
plans and becomes the way to MOVE between the sessions being run. That is a bigger promotion for the
gesture than anything in §92, and it is what the guard would have to stop doing.

**What it costs.** A data-schema version and its migration. Those 77 sites, read once. The Drive
sync will carry a session in progress and push it repeatedly, which has to be looked at before it is
switched on. And the consequence of allowing several at once, which is design work and not
migration: the dashboard badge, the clipboard bar and the running timers each speak about "the
session" today and must each name WHICH one — on a phone screen, one-handed, without a second row of
chrome. That is the part to draw before any of it is written.

### 95.2 [ ] The structure: trening, načrt, rutina — and the states that replace the flags

Asked by Simon 2026-09-30: the data structure for session/training/plan, with the states.

**What exists today, measured rather than recalled.** One lifecycle is spread across three shapes
with three separate flags, and a fourth shape that is not stored as a record at all:

| Shape | Where | Flag it carries |
| --- | --- | --- |
| The booked slot: date, time, location, participants, `routineId` | `state.sessions` | `completed` |
| The plan authored for one client | `state.history`, one record per client | `isPlanning` |
| What one client performed | `state.history`, one record per client | none — the absence of `isPlanning` |
| The clipboard being run | one storage key, `librept_active_session` | `started` |

**And the training does not survive into history.** `buildSessionHistoryRecord`
(`domain/sessionHistoryRecord.js`) writes `id`, `clientId`, `clientName`, `routineName`, `date`,
`duration`, the program and that client's feedback — and no session id. A group of three produces
three unrelated records: afterwards nothing says they were one training, or which booked slot they
came from. The entity the trainer thinks in is the one thing not stored.

**The structure, in the words the app already uses.**

- **Trening** — one occasion. Date, time, location, participants, the rutina it came from, and its
  STATE. This is the thing the board shows, the thing the clipboard opens, and the thing history
  should list. It exists from the moment the slot is booked until long after it is finished; it is
  never two records.
- **Načrt** — one participant's program within a trening: what is prescribed and, as the trening is
  run, what was performed. One per participant, carrying that participant's own state. This is what
  `clientRoutines` holds live and what the per-client history record holds afterwards.
- **Rutina** — a reusable template, no date and no participants, in `state.routines`. NOT part of
  this: a trening is made FROM a rutina and then goes its own way. It stays exactly as it is.

**The states, replacing `completed`, `isPlanning` and `started`.** One field on the trening, not
three booleans in three places:

- **scheduled** — booked, no plan authored yet.
- **planned** — a načrt exists for at least one participant (today: an `isPlanning` record).
- **live** — being run (today: `started` on the cache blob). Several trenings may be live at once.
- **done** — finished (today: a history record without `isPlanning`).

**Questions this does NOT answer, and must not be answered by whoever writes the code.** They change
what a trainer sees, so they are Simon's:

1. **Cancelled and missed.** A slot the client cancelled, and a slot nobody came to, are neither
   done nor live. Are they states of a trening, or is a cancelled trening deleted? The app already
   sends cancellations through the notification feed, so the case exists today.
2. **Per-participant state.** In a group of three, one attends, one is absent and one arrives late.
   Is that a state on the načrt, and what are its values?
3. **Embedded or linked.** Is a načrt a field inside the trening record, or its own record pointing
   at one? Embedded keeps a trening in one piece; linked lets one client's history be read without
   loading every group they trained in.
4. **What happens to history as it is stored today.** Existing records have no session id and cannot
   get one — the trening they belonged to was never written. Do old records become single-participant
   trenings, or does history keep two shapes with a migration boundary and a date?

### 95.3 [ ] Every entity stored today, read out of the schema rather than recalled

Asked by Simon 2026-09-30, before normalising anything. Read from `data/recordSchemas.js`, which is
where a collection's shape is declared, and from the storage keys in `src/`.

**Business records — the nine collections schema 4 declares, plus one schema 5 adds:**

| Entity | Collection | What it is | Required fields |
| --- | --- | --- | --- |
| Stranka | `clients` | A person the trainer trains | `id`, `name`, `active` |
| Vaja | `exercises` | The movement catalogue | `id`, `name` |
| Rutina | `routines` | A reusable program template, no date, no people | `id`, `name`, `exercises` |
| Sklop | `circuits` (schema 5) | A reusable circuit template | `id`, `name`, `exercises` |
| Trening | `sessions` | One booked occasion: time, place, who | `id`, `participants` |
| Ponavljajoči trening | `sessionSeries` | The RULE, not its evenings — occurrences are derived | `id`, `startDate`, `time`, `weekdays` |
| Zapis vadbe AND načrt | `history` | Both, told apart by `isPlanning` | `id`, `clientId`, `exercises` |
| Prilagoditev načrta | `planUpdates` | A feedback tag waiting to change the next plan | `id`, `clientId`, `resolved` |
| Vabilo | `invites` | An RSVP is a fact about an invitation, by reference only | `id`, `sessionId`, `clientId`, `status` |

`notifications` is declared too but is app chrome, not a business record — its own comment says so.
`previewProbe` exists only to keep staging exercised by the real schemas; no screen writes one.

**Stored outside every collection, and this is where the trouble is:**

- **Trening v teku** — `librept_active_session`, one key, one session, overwritten by the next. The
  subject of this whole section.
- Settings and chrome, correctly not records: trainer identity, language, workspace, last route,
  Drive sync settings, read notifications, terms accepted, expand preferences, the unsaved-state
  journal, the workout-setup draft, running timers.

**Two of the entities Simon named do not exist as data.**

1. **Zaznamki.** There is no such record. What a trainer notes is scattered across three shapes: a
   free-text `notes` field on the client, an untyped `feedback` array inside each history record,
   and the `planUpdates` collection for the ones that should change the next plan. Three homes for
   one idea, and only the third can be found, listed or resolved.
2. **Skupinski program za več strank (M:N).** `sessions.participants` is the M:N between a trening
   and its clients, and that one is real. But WHICH clients share ONE program — `bindings` — is
   declared in no schema at all. It lives on the live session object only, is re-applied at recovery
   by `boundClientRoutines`, and dies with the cache. The grouping Simon names as an entity is the
   one piece of the clipboard that was never written down.

**Which makes the refactor the test Simon wants** (his own point, 2026-09-30): it exercises
`SCHEMA_PREVIEW`, `schemaMigrations.js` and schema 5 for real, on a change that touches the two
collections carrying the durability stakes, rather than on a probe record written by tests.

### 95.4 [ ] What the entity list turned up: one program shape, one grouping key, no history

Simon's four questions of 2026-09-30, answered from the code.

**Does `routines` deserve to be an entity?** Yes, but not in its present shape. What justifies it: a
template carries no date and no participants, is reused by many trenings, and deleting it must not
touch what was already run. What does NOT justify it: a routine and a plan are the same idea — a
list of prescribed exercise instances — stored in two different shapes. In `data/routines.js` an
entry reads `sets: 3, reps: 5, weight: 62.5`: numbers, the prescription. In a `history` record the
same field reads `sets: [ … ]`: an array of what was performed. **The same field name holds a
different type depending on which collection it is in**, which is the normalisation to do — one
program structure, used by a routine and by a trening's plan alike, with performance recorded ON the
instance instead of by redefining the field under it.

**Is a `circuit` a mapping of exercise ids plus a name?** Nearly. Schema 5 declares
`{id, name, series, exercises, source}` — `series` being the number of rounds — and its `exercises`
carry the prescription too, not ids alone. Schema 5 has already begun extracting it, because
`routines` denormalises the same circuit onto every member row: `circuitId`, `circuitTitle` and
`circuitSeries` repeat on each exercise of the group.

**And there are TWO grouping keys for one grouping.** `circuitId` is what the app actually groups by
(129 uses, `controllers/sessionCircuits.js`). `comboGroupId` is written into every seed routine and
preserved on import by `ROUTINE_GROUPING` in `domain/libraryImport.js` — and grouped by nothing.
Dead weight carried forward on every routine.

**Is `history` needed at all, or a state on the exercise instances?** Not needed as a collection, and
the instinct matches this section. `history` holds two different things in one shape: a plan not yet
performed (`isPlanning`) and a trening that happened. Under §95 both are a trening with a state, and
the per-client program is its plan. What remains genuinely needed is state on the INSTANCE, which
half-exists already — `completed` on a session item, with "skipped" derived from it.

**The caution that belongs with that answer.** `history` is what the client's page, the "last time"
numbers on the clipboard, the statistics, the routine-from-session feature and the Drive backup all
read. Removing it is the largest single migration in the app — which is exactly why Simon wants the
refactor to exercise `SCHEMA_PREVIEW` and `schemaMigrations.js` rather than a probe record.

### 95.1 [ ] §92.6 is this section's subordinate case, not its own task

Leaving a session by the peek throws away what was logged in it. Found 2026-09-30 in the walkthrough:
Too Easy logged on the first participant, a look aside to the previous session, back with Today — the
signal was gone and the control no longer showed it set, so a trainer taps again, and a second tap
CLEARS it.

The guard (`canOpen` in `controllers/planPeekController.js`) refuses only a STARTED session, while the
risk is a session that has anything in it — on the gym floor the plan is marked up long before anyone
taps Start. Widening the guard treats the symptom; giving the session its own record removes the case.
Not worth fixing twice, so it waits here.

Until then the walkthrough places the gesture before anything is logged. That is a workaround, and this
is why.

## 96. [ ] Predstaviti Simonu najdbe in meritve raziskovalnega testiranja 2026-09-30

**Naročil Simon 2026-09-30 zvečer:** ko bo čas, mu predstaviti, kaj je raziskovalno testiranje tistega
dne našlo in izmerilo. Predstavitev naj pove, kaj je že popravljeno in kaj še čaka nanj.

Gradivo:
- Prvo odprtje (štirje trenerji brez predznanja, tudi v nemščini): poročilo z navdušenjem, iskanjem,
  zmedo in frustracijami v `.private/exploratory-test/first-open/2026-09-30-porocilo.md`, dnevniki v
  isti mapi. Dnevnik trenerja 04 še ni obdelan.
- Napake §80.110–§80.149 (del je že popravljen in zaprt).
- Vrzeli §88.12–§88.16 (množično prestavljanje, selitev iz preglednice, nov telefon, premor serije,
  nesreča med vadbo); dnevi trenerja 07–10 v `.private/exploratory-test/days/`.
- Meritve: dotiki, črke in ocena časa za devet opravil v §94.
- Odločitve, ki čakajo nanj: točke z oznako »čaka na Simona« v §80, §88 in §94; preverba šifrirane
  kopije na telefonu (§80.136); predlog pravila o commitih z `git commit --only` (iz pogovora
  2026-09-30).

## 97. [ ] Besedila privolitve in obvestila po GDPR — pregled in popravek v vseh jezikih

**Naročil Simon 2026-09-30:** temeljito preveriti vsebino privolitve, jo primerjati z objavljenimi in
uradnimi vzorci ter popraviti v vseh podprtih jezikih (en, sl, de).

**Popravljeno 2026-09-30 (commit e5bd1f3), različica obrazca 2026-09-30.** Vse spodaj naštete
najdbe iz kode so odpravljene v pismu, kljukici na obrazcu za vpis in obvestilu, v vseh treh jezikih.
Primerjano z: vzorcem IP RS po členu 13 (ip-rs.si/obrazci), mnenji IP RS o privolitvi in fitnesu,
EDPB Guidelines 05/2020, WP260 rev.01, DSK Kurzpapier 10 in 20, obrazcem TLfDI, vzorcem LfD
Niedersachsen za fitnes studie, obrazci F45 Ljubljana, Uni Paderborn, Uni Hannover in dvema
angleškima obrazcema za trenerje.

**Čaka na Simona:**
- **97.1 Obdobje hrambe.** Besedila zdaj obljubljajo »največ dve leti po zadnjem treningu«. Izbral
  agent, ker je bil to primer v stari predlogi in ker člen 13(2)(a) zahteva obdobje ali merila.
  Drugačna številka pomeni novo različico obrazca.
- **97.2 Pravna podlaga.** Vse sloni na privolitvi. EDPB (05/2020, točka 26) pravi, da se privolitev
  in pogodba ne smeta mešati; za ime, kontakt in dnevnik treningov bi bila podlaga lahko pogodba
  (člen 6(1)(b)), privolitev pa le za zdravje. Sprememba vpliva na to, kaj naredi preklic.
- **97.3 »ti« in »du«.** Vzorec IP RS in vsi prebrani nemški vzorci nagovarjajo z »vi« oziroma »Sie«.
  Besedila ostajajo pri »ti« in »du« kot ves vmesnik.
- **97.4 AI kopija kot ločen namen.** EDPB (točka 42) želi ločeno privolitev za ločen namen. Zdaj je
  AI kopija razkrita kot prejemnik, brez ločene kljukice.
- **97.5 Google ni obdelovalec po členu 28** pri brezplačnem računu (pogodbo DPA ima le Workspace in
  Cloud). Besedila Googla ne imenujejo več obdelovalca; kopija je šifrirana. Ali to trenerju zadošča,
  je pravno vprašanje.
- **97.6 Pravni pregled** ni opravljen v nobenem jeziku; nemščine ni prebral nihče, ki govori nemško.
- **97.7 Kaj preklic ustavi.** Pismo zdaj obljublja: »Preklic … ustavi nadaljnjo obdelavo.« Preizkus
  2026-10-01 na `main` `6230070`: Maja Kovač, privolitev dana 2026-10-01, nato odkljukano, »Datum
  preklica« 2026-10-01, »Shrani«. Profil: »Privolitev preklicana (Datum podpisa: 2026-10-01 · Datum
  preklica: 2026-10-01)«. Nato »Ustvari trening« z Majo, »Odpri v beležki«, »Pošlji vabilo«, »Začni
  trening«: nikjer opozorila, podloga pokaže njeno poškodbo. Ostanek zaprte §80.102 (»kaj se s
  preklicem ustavi, na zaslonu še ni povedano«) je bil le v arhivu. Odločitev je ista kot 97.2: kaj
  aplikacija s stranko brez privolitve sme, in to naj pove ob dodajanju na trening.

**Vrzel v aplikaciji, ni zgrajeno:** aplikacija ne pokaže, katere stranke so privolile po starejši
različici. Po tej spremembi so to vse obstoječe stranke, trener pa tega ne izve nikjer.

**Opaženo med delom:** razvojni strežnik na :8081 teče na starejši različici
`deploy/local_http_server.py`, zato ga brskalniški testi zunaj `build check` odklonijo. Ponovni zagon
je Simonova odločitev.

Najdeno v kodi, pred primerjavo z vzorci:
- Obvestilo pravi, da Google kopijo lahko prebere. Kopija na Drive je šifrirana z geslom trenerja
  ([driveSyncService.js](src/data/driveSyncService.js)), zato je ne more.
- Povezava v e-pošti in SMS vodi na javno stran z neizpolnjenimi polji (ime trenerja, obdobje
  hrambe) in z navodili trenerju in razvijalcem. Stranka tako ne izve, kdo je upravljavec.
- AI kopija ni anonimna: nosi številko stranke in datume (psevdonimizacija). Izpusti pa tudi cilje in
  opombe, česar besedilo ne pove ([aiClientSummary.js](src/domain/aiClientSummary.js)).
- Izbris ohrani zgodovino treningov brez imena; obvestilo pravi, da se izbriše vse.
- Besedilo privolitve ne imenuje izrecno zdravstvenih podatkov (člen 9(2)(a)).
- Manjka iz člena 13: omejitev obdelave (en, de), ali je dajanje podatkov obvezno in posledice,
  avtomatizirano odločanje, prenos v tretje države.
- Jeziki se razhajajo: le sl pismo pove, da je ponudnik shrambe obdelovalec.

**Izpust v e5bd1f3, najden 2026-10-01 pri raziskovalnem testiranju (§80.155):** popravek je zajel pismo,
kljukico in obvestilo, ne pa napisov v vmesniku trenerja, ki trdijo drugače:
- Profil stranke: »Privolitev GDPR za sinhronizacijo v oblak« (`profile_consent_label`), značka »Brez
  privolitve (samo lokalno)« (`consent_badge_none`) in kljukica »Stranka je podpisala privolitev (hramba
  podatkov in sinhronizacija v oblak)« (`consent_signed_label`). Pravijo, da je privolitev le za oblak in
  da brez nje trener podatke sme hraniti na napravi. Pismo pravi: »Brez privolitve o tebi v aplikaciji ne
  smem voditi zapisov.« **Čaka na Simona**, ker je to vprašanje 97.2: ali aplikacija brez privolitve
  podatke hrani (in bi moralo pismo reči drugače) ali ne.
- Gumb »Anonimna kopija za AI« je trdil anonimnost, ki je ni. **Popravljeno 2026-10-01 (da929f9):** »Kopija
  za AI brez imen«, »Copy for AI, without names«, »Kopie für KI ohne Namen«, tudi v PRIVACY.md in
  vodniku za trenerje.

## 98. [ ] Odprti ostanki zaprtih točk živijo le v arhivu

**Najdeno 2026-10-01 pri raziskovalnem testiranju.** Pravilo pravi, da ob zaprtju točke odprti deli
ostanejo v TODO.md. Dvakrat v eni noči pa je bila odprta odločitev le v arhivu: »kaj se s preklicem
ustavi« (§80.102, zdaj §97.7) in »ali sme shranjena oznaka »Client #…« nositi jezik« (§80.101, zdaj na
seznamu angleških besedil). Iskanje po arhivu najde 13 zaprtih razdelkov z besedilom »Odprto«,
»Open«, »čaka na Simona« ali »waits on Simon«: §1.7, §27.6, §42.11, §55.2, §80.10, §80.11, §80.101,
§80.102, §80.104, §80.108, §80.137, §80.145, §89.1. Nekateri imajo dom drugje (§80.11 je združen v
§80.86, §80.145 kaže na §83); kateri ga nimajo, še ni pregledano.

**Predlog:** pregledati teh 13 in vsakemu odprtemu ostanku dati vrstico v TODO.md ali ga zapreti z
razlogom; nato preverba v `todo_hygiene`, ki zavrne arhivski razdelek z »Odprto«/»Open« brez kazalca
na odprto mesto. **Čaka na Simona:** ali preverbo hoče, ker spremeni, kako se točke zapirajo.
