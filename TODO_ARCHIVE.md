---
type: archive
title: LibrePT Archived TODO Sections
description: The full reasoning behind closed TODO sections — decided, shipped, superseded or abandoned — kept out of the working backlog so TODO.md stays the open work.
status: active
tags:
  - roadmap
  - archive
  - okf
---

# LibrePT — Archived TODO Sections

Closed sections moved out of [TODO.md](TODO.md), verbatim and in full: what was decided, why, and
what it cost. **Nothing here is open work.** TODO.md keeps every closed heading as a one-line stub,
so a `§N.M` reference from code, a test or another document still lands somewhere — and lands here
for the reasoning.

Read [CHANGELOG.md](CHANGELOG.md) for what shipped and when. This file is why.

---

### 66. [x] A session may not be named after a client — shipped 2026-09-18

**Ruled 2026-09-18 (Simon)**, after asking how trainers are kept from putting names into session
titles: check every single word against every client's name and REFUSE the save, with a message the
trainer can act on. Then: match whole words only, outline the field, and show the offending word in
the message, bold and coloured.

**Why refusing beats cleaning up.** A name typed into a session's name or location is a name the app
can never take out again: scrubbing prose needs the name, and after an erasure the name is gone
(§65). The participants are already on the record as ids, so the name adds nothing the app did not
know.

**What shipped.** [clientNameWords.js](src/domain/clientNameWords.js) folds case and accents, splits
on anything that is not a letter or a digit, and takes names, surnames and aliases from three
characters up — two-letter names would refuse ordinary titles and leave a trainer unable to start a
session. An erased client's pseudonym is not blocked. The session form checks the name and the
location before anything else, outlines the field, and quotes the word back in bold.

What it deliberately does not cover: free text elsewhere — a routine's name, a feedback note, a gym
note — which stayed open as §67.

---

### 59. [x] Erasing a client keeps their alias — fixed 2026-09-18

Found 2026-09-17 (Claude) while checking what a numbered schema may carry: `eraseClientRecord` in
[clientErasure.js](src/data/clientErasure.js) copied the whole client and cleared only email, phone,
goals, notes and injury. `alias` was not in that list.

**Why that mattered.** The alias is the trainer's own label for telling two same-named clients apart,
and the form asks for exactly the words that identify one — a surname, or a detail about an injury.
It is drawn beside the name on every screen that shows a client, so an erased record went on naming
the person its pseudonym exists to hide: the erasure was not an anonymisation. No test checked it.

**Fixed** by adding `alias` to the cleared fields, with a test that fails without it — it asserts the
label is nowhere in the erased record, not merely that the field is empty.

---

### 1.1 [x] PT-side client assignment to a session
Shipped 2026-08-04 — [CHANGELOG](CHANGELOG.md). Invites are `.ics` + `mailto:`, because there is no
backend to send mail from (§1.5).

---

### 3.3 [x] Google Drive periodic sync

Shipped 2026-08-02, manual-only as of §3.10 — [CHANGELOG](CHANGELOG.md) carries the decisions worth
not re-litigating (no visible Drive file ever; three-way merge, so no Lamport pair and no tombstones).
Setup steps live in [docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md), written against role
handles and naming no credential, so the procedure is reviewable in the open.

**Unblocked 2026-08-12** by a real OAuth client id in
[driveSyncConfig.js](src/data/driveSyncConfig.js). Two consequences worth knowing:

- **Only listed test users can grant access.** The OAuth app is in *Testing*: 100 explicitly-listed
  accounts, everyone else gets `403: access_denied`, and refresh tokens expire after 7 days. Demo
  users are unaffected (`?init=demo_data_load` never contacts Google). Publishing WITHOUT verification
  is the useful middle state — it drops the manual list and the 7-day expiry, keeping the 100-user cap
  and an "unverified app" warning.
- **The connected state is unreachable from any Playwright tier** — Google fingerprints and blocks
  automated browsers on `accounts.google.com`, which is what [tests/live/](tests/live/) exists for.
  `tests/medium/test_drive_sync_ui.py` pins configured-but-not-connected instead.

**Not built**: incremental sync via the Drive Changes API. Every pass moves the whole file — correct,
not bandwidth-minimal.

---

### 3.5 [x] Paper consent — checkbox, signed date, form version, and delivery
**Decided 2026-07-22: KISS — consent lives on paper.** The client signs a form kept at the gym; that
physical file is the evidence. No photo capture, no image storage, no IMAP — considered and dropped,
and still dropped. **Shipped 2026-08-09**, per client and per language — see
[CHANGELOG](CHANGELOG.md) for the editable signed date, the versioned letter, the localised client
documents and why the archiving reminder is a dialog rather than a tooltip.

One amendment to the 07-22 decision worth recording: the `mailto:` delivery trigger was to be removed
once paper consent landed. **Reversed on request (Simon, 2026-08-09)** and given an SMS sibling — a
trainer who has to produce the letter themselves before the first session will not, and both buttons
open the device's OWN mail/messaging app, so neither is an "email flow" in the IMAP sense rejected
above.

**Still open**: `PRIVACY_FOR_TRAINERS.md` and `PRIVACY.md` remain English-only (they are read by the
trainer, not the client), and the Slovenian client documents are maintainer translations that have
**not** been reviewed by a data-protection lawyer — each says so at the top. That review is a launch
prerequisite for §23.6, not a code task.

---

### 3.7 [x] [Superseded by §18.6] Persistence engine — localStorage JSON, then IndexedDB
Engine decision and sizing live in §18.6. The Export/Import JSON backup remains the user-facing
escape hatch (§3.3, §18.7).

---

### 3.8 [x] Unbacked-data warning banner — same weight as the PREVIEW badge

**Shipped 2026-08-13.** [backupHealth.js](src/data/backupHealth.js) decides,
[backupHealthController.js](src/controllers/backupHealthController.js) keeps it current, and
`renderBackupBadge` shows it beside the PREVIEW tag. Three things worth not re-deriving:

- **A `{id, hash}` fingerprint, not a snapshot.** Counting "changes since the last backup" needs a
  reference point and records carry no `updatedAt`. Storing a full state copy (as the Drive ancestor
  does) works and was rejected: it roughly doubles what the database holds, and a feature that exists
  to warn about STORAGE EVICTION must not be a cause of it. `countChangedRecords` diffs two
  fingerprints unchanged, since it compares any two state-shaped objects.
- **Time alone never fires.** A database backed up a year ago and untouched since is still backed up;
  warning there teaches the trainer the badge means nothing. Never-backed-up is judged on count
  alone, because there is no timestamp to measure an interval from and inventing one would nag
  someone still evaluating the app with three test clients.
- **`onStateSaved` had to become additive first**, and that is the sharp lesson. It stored ONE
  listener in one slot, which was indistinguishable from correct while the ahead/behind badge was its
  only consumer. Registering this feature's listener silently *unsubscribed* the badge, which then
  showed whatever it had last rendered — nothing threw, and the only symptom was a number that had
  been right a moment earlier. Pinned now by `tests/unit_js/data/stateSavedListeners.test.mjs`.
  `onSyncCountsChanged` still has the single-slot shape and one consumer; it is the next one to trip.

Three requirements from the original scope still bind any change: it must be clearable **without Google** (a downloaded backup resolves it exactly as a sync does, or a warning colour is a growth prompt and trainers can tell); it is **not the same number as §3.9's ↑**, which is Drive-relative while this is backup-relative; and it escalates by **colour, never animation** — a permanent pulse in a fixed header is ignored within a day and devalues the PREVIEW badge beside it.

---

### 3.9 [x] [Decided] Every write increments the ahead counter on the Sync & Backup button
Shipped 2026-08-03, fixed at the seam (`onStateSaved`) rather than the ~21 call sites —
[CHANGELOG](CHANGELOG.md).

---

### 3.10 [x] [Decided] Drive syncing is manual-only; periodic/resume ticks refresh counters, not data
Shipped 2026-08-04 — [CHANGELOG](CHANGELOG.md).

---

### 3.11 [x] Sync surface — the icon vocabulary and tap-to-sync — SHIPPED 2026-08-12

Split out of 2026-08-12's sync work, which fixed the counter's honesty and its legibility but stopped
before the states around it. All five items built; what shipped, and what was decided along the way:

- **`↑!` past nine, for AHEAD only** — `↑↑` said "many" only to whoever wrote it. **Behind keeps
  `↓↓`**: *behind* means Drive holds changes not pulled yet, so nothing is at risk, while *ahead*
  means those edits exist only on this device. Same width, and the asymmetry is the point.
- **Warning over the cloud on a failed sync**, replacing the sync glyph — a genuine fault earns the
  treatment deliberately withheld from "merely not connected".
- **A muted slashed cloud when not connected** — informational, not an ✕ and not warning colour,
  because [PRIVACY.md](PRIVACY.md) tells trainers local-first is the point. The cloud desaturates
  along with its slash: a bright cloud under a grey slash still reads as connected.
- **Animated arrows while syncing** — Font Awesome's own `fa-spin`, whose stylesheet already cuts
  the animation under `prefers-reduced-motion`, so the guard cannot drift from what it guards.
- **Tap-to-sync when connected**, with the dialog left in the ☰ menu. The two listeners on
  `#backup-btn` became one: `driveSyncUi` answers first and `backupRestore` opens the dialog only
  for the taps it declines. Both exceptions survived — conflicts open the review modal, and a
  failure posts to the notification feed.

The four states live in [syncStatusGlyph.js](src/modules/common/syncStatusGlyph.js), DOM-free so
each is forced to carry a LABEL as well as a shape (the glyph is `aria-hidden`, so without words in
the button's `aria-label` the state would be unreachable on touch and silent to a screen reader).
The failure notification is **synthetic, never stored in `state.notifications`** — a stored one
would ride into the backup file and the Drive snapshot and count as a local change, so a failed
sync would increment the very ahead counter it failed to clear.

---

### 3.12 [x] Ship the remaining trainer-facing docs as pages, not GitHub links

**Shipped 2026-08-13** — six more pages (PREVIEW, bug reporting, and the consent form + privacy
notice in `en` and `sl`), the four in-app links repointed, and `privacy.html` finally linked from the
menu: it had been generated on 2026-08-12 and the link left on `github.com`, so the page shipped for
a day while nobody could reach it.

Two things worth keeping from the build:

- **Link rewriting is the real work, not the table row.** The docs link to each other as repository
  files do (`../PRIVACY.md`, `templates/en/Client_Consent_Form.md`), and rendered into a flat `src/`
  every one of those is a 404. `rewrite_link()` sends a shipped doc to its sibling page and anything
  else to an absolute GitHub URL. A runtime guard against "unrewritten" links was written first, and
  its own test proved it could never fire — the two destinations are exhaustive — so it was deleted
  and the property is pinned by a test instead.
- **The consent URLs had to stay absolute.** They are interpolated into the email a trainer sends a
  client, where a relative `./privacy-notice-en.html` is meaningless. `consentForm.js` derives them
  from `import.meta.url` rather than importing `routerController`'s `BASE_PATH`, since `controllers/`
  is a layer above `modules/common/`.

**Deliberately not done**: `README.md#about-demo-data` ([messages.js](src/data/messages.js)) still
points at GitHub. The README is developer-facing and stays there by this section's own rule — the
right fix is not a seventh page but moving that explanation in-app, which belongs with §9.3/§9.5's
demo-data and onboarding work rather than here.

---

### 4.3 [x] Collapse the duplicated session header into one row, with a date picker — see CHANGELOG
Shipped 2026-07-27 with the continuous-timeline rewrite. The blocking premise (sessions carried no
real date) was resolved by schema 3's `startDate`.

---

### 6.3 [x] The bottom session bar renders nothing — decided: restore, active state only
Shipped 2026-08-08 — [CHANGELOG](CHANGELOG.md). The idle "Next: …" state was deliberately not
restored.

---

### 6.4 [x] CI runs medium and e2e in parallel; the local gate runs them staged — RESOLVED: keep parallel
Resolved 2026-08-08 (Simon): **CI mirrors the local gate**, four stages chained from one declaration
(`PIPELINE_STAGES`). See `build/__init__.py` for the staged definition and
[CHANGELOG](CHANGELOG.md) for the cost this was overruled on.

---

### 8.1 [x] Bind multiple clients to one shared set of exercises — shipped 2026-08-22
Two or more participants bound to the same exercises, merged into a single combined view — they train
the identical programme in lockstep, so the trainer logs it once instead of switching tabs.

- The **cards are shared**: navigating/logging advances the plan for the whole group.
- **Feedback stays per-person** — one client can find a shared set too hard while another finds it
  too easy.
- **The model, decided by building it**: bound participants SHARE one `clientState` object
  ([participantBinding.js](src/domain/participantBinding.js)). Every existing write — a set logged, a
  round completed, an exercise swapped in the editor — then lands for the whole group without a
  single write site learning that bindings exist; a mirror-on-write would have been a side effect at
  a dozen seams, each of which could be missed. Feedback needed no work at all: it lives on the
  SESSION keyed by client, never in the plan, so "too hard for one, too easy for another" was
  already true.
- **A bound group is one tab**, named with its members' initials — three tabs that always show the
  same plan invite three taps to check whether they still do. One control in the ⋯ menu binds and
  unbinds; unbinding hands each member a COPY of what they were training, because dropping the
  binding alone would leave them holding one object and the next set would still appear for both
  (found by a test, not by reasoning).
- **The bindings are stored beside the plans they join**, because the live session is cached as JSON
  and object identity does not survive it — a restored session would otherwise come back silently
  unbound, logging each set for one person.
- Still open: §1.2's multi-line titles, and per-person signals from INSIDE the bound tab (today the
  trainer unbinds, or switches to that person's tab, to log one).

---

### 8.3 [x] Inline Clipboard Editor — shipped, see CHANGELOG

---

### 8.6 [x] Rests are first-class, focusable plan items — shipped, see CHANGELOG

---

### 8.8 [x] Copy the program to another participant — shipped 2026-08-22
**Raised 2026-08-09 (Simon); built once §8.1 made its open questions answerable.** *Copy this plan
to…* in the session ⋯ menu, listing the other participants by name.

**Every open question below, answered by building it:**

- **To whom** — a participant in the same clipboard, which was named here as the common case (a
  walk-in joining a session underway). Listed by NAME rather than performed by a single action,
  because "to whom" is the entire question and a control that guessed would answer it for them. The
  same client's next session and a routine template stay §17.4's business.
- **What** — the prescription only ([planCopy.js](src/domain/planCopy.js)): movements, targets, rests
  and circuits. Logged sets and completions stay with whoever did them, or a copy would write a
  stranger's numbers into this person's history.
- **Placement** — the ⋯ menu, beside *Everyone on this plan*, rather than the title bar: the bar was
  measured at 48px of icons against 169px of title on a 390px phone (§30.1's neighbourhood), and the
  unit being copied is the whole programme, not a card.
- **Against §8.1** — the two are deliberately adjacent and deliberately different, and the menu now
  states both in one place: a copy DIVERGES the moment either plan is edited, a binding never does.
  Each item gets a fresh id, circuits remapped together, so nothing is shared by accident.

The original notes, kept because they are what made the answers obvious:

- **Copy to what?** The three plausible targets are a different participant in the same clipboard
  (the common case when a walk-in joins a session already underway), the same client's next session,
  or a routine template. The third overlaps §17.4, which extracts a template from *history*; this one
  would act on the plan that is live right now.
- **Copy what, exactly?** Prescription structure only (exercise, sets, reps/targets, rest, circuit
  grouping) or logged magnitudes too. §17.4 already decided that a *template* strips person- and
  day-specific magnitudes; a participant-to-participant copy mid-session probably wants the same
  rule, since the point is a shared plan, not a shared performance.
- **Placement**: it belongs beside the existing edit affordance in the title bar, not on a card —
  the unit being copied is the whole program. Must satisfy the no-hover rule and carry a real touch
  target, not a 9px glyph.
- Interacts with §8.1 (binding several clients to one shared set) — if that ships, a copy and a bind
  are two different intentions and the UI must not blur them: a copy diverges afterwards, a bind
  does not.

---

### 9.3 [x] Selective demo-data removal — shipped 2026-08-10
The demo notice's primary action called `resetLibrePTData()`, which deletes the **whole database** —
fine while the only person pressing it had nothing else, destructive from the moment a trainer adds
real clients, which is exactly when the fake people become a stain worth removing. Now a
confirmation screen that removes demo records selectively. See [CHANGELOG](CHANGELOG.md) and
[UC7](use_cases/uc7_demo_to_clean_database.md). Two rules worth not re-deriving: **provenance is
never inferred from id shape**, and the seeded exercise **catalog is an asset, not a stain** — it is
kept, with the reason it survived shown on its own line rather than in a tooltip.

Also fixed the same week: the seed anchored "today" sessions with a `min(17, …)` hour clamp, so a
demo loaded after 17:00 opened on a wall of already-past sessions counting down in negative hours.
Slots now follow the real clock and may cross midnight, each session's `day` bucket is **derived**
from its timestamp rather than asserted alongside it, and an overdue card flips its label to
"Overdue" instead of printing a minus sign.

---

### 9.4 [x] Simulated finger / touch controller — 2026-08-16
Shipped as [demoHand.js](src/modules/demo/demoHand.js): an overlay pointer that travels to a target,
pulses as a tap, and lets the player dispatch the real interaction underneath it.

**It lives in `src/modules/demo/`, not the `src/demo/` this asked for.** Every other feature sits in
`modules/<feature>/` and `import_layers.py` derives a module's layer from that path, so a top-level
`src/demo/` would have been a directory outside the layering with no rule saying what it may import.
The folder was the incidental part of this item; the pointer was the point.

---

### 9.5 [x] Guided walkthrough engine (step overlay) — 2026-08-17
Shipped: [walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js) over
[domain/walkthrough.js](src/domain/walkthrough.js), reached by `?demo=walkthrough` and by the splash's
own button. **Back / "Show me" / Next**, one step at a time, over the real app.

- **It plays the SAME script as the automatic demo** ([gymFloorTour.js](src/modules/demo/gymFloorTour.js)),
  and shares its tap (`performStep`). Two scripts would have been two things that must stay true of
  the app, which is the failure mode §23.5 chose a script over a recording to avoid — and the demo's
  e2e replay already keeps this one honest.
- **The trainer doing the step themselves is what advances it** — beyond what this item asked for, and
  the reason the app stays fully tappable underneath with no scrim. Completion is the step's own
  expectation becoming true, watched on a poll, so it does not care who caused it. A walkthrough that
  only advanced on its own buttons would be teaching its own buttons.
- **"Show me" is the escape hatch, not the path**, and it withdraws once the step is done: an offer to
  do something already done is a control that does nothing.
- **Back re-explains; it does not undo.** An inverse for every step is an undo stack for a
  demonstration. A step returned to stays done, so re-reading what Too Easy meant cannot log a second
  signal.
- **The splash button is enabled and the "soon" pill is gone** — that control was the last place in
  the app announcing something unbuilt. It carries `?init=demo_data_load` with it, because the script
  drives the seeded group session and a walkthrough over an empty app would point at nothing.
- **Still open — the script is four steps, not six.** This item listed "complete a round" and "review
  an adjustment" too; the shipped script is §23.4's wedge (open the session, focus a circuit, signal
  Too Easy, switch participant). Adding either is a data change in `gymFloorTour.js` plus a caption —
  worth doing only if a viewer is demonstrably left wanting them, since every step is one more thing
  between a stranger and the point.

---

### 12.4 [x] Capture exceptions and offer semi-automatic bug reporting — 2026-08-18
**Raised 2026-07-26 (Simon); shipped 2026-08-18.** [crashReport.js](src/data/crashReport.js) builds
the payload, [appLifecycleController.js](src/controllers/appLifecycleController.js) installs the
`error`/`unhandledrejection` listeners as the FIRST boot step (a crash during boot is the one a
trainer can least describe), and the notification feed offers it. Five constraints that still bind:

- **Non-identifying by construction, not by redaction** — a fixed field list (message, stack, route,
  build, time) and anything else a caller passes is dropped, because a pass that strips known-bad keys
  fails the first time someone adds a field nobody remembered to strip. Names, notes and injuries are
  Art. 9 data (§17.3) and the issue is public.
- **Offer, never send.** A prefilled GitHub issue URL the trainer reviews and submits; no server, no
  telemetry, no `connect-src` change. Automatic reporting would be unannounced egress of a PT's data.
- **The feed, not a modal** — a handler rendering over a live session mid-set is worse than the bug it
  reports. An e2e case asserts no dialog opens and the app stays usable after an uncaught throw.
- **The handler cannot throw**, and a failure inside it is deliberately silent: there is nowhere left
  to report a failure to report.
- **A repeat collapses into a count**, so a render loop throwing every frame cannot evict the report
  that explains how it started. Kept distinct from the integrity error page (`sw/integrity.js`) — a
  corrupt download must never be reported as an app bug.

**The wiring bug the tests caught**, and the reason that e2e case exists: `appBoot.crashLog` was
imported but never re-exported, so the feed asked for the crash log, got `undefined`, and rendered
nothing — silently, because a missing optional dep looks exactly like "no crashes yet".

**Still open, and a maintainer decision: §23.5's feedback route for a PT without a GitHub account.**

---

### 12.7 [x] [CLOSED — measured, do not reopen] ~89 separate module requests on first load
The cheap half shipped (15 `<link rel="modulepreload">` hints on the boot-critical path); page
pooling was built, measured at ~4% of the gate and **reverted** 2026-08-08. Full measurements, and
how to read a subset benchmark, are in [CHANGELOG](CHANGELOG.md) — they are expensive to retake, so
read them before proposing this again (it was mis-recommended as "the next big win" twice).

Bundling remains the only untried half, and it trades away the buildless property — a deliberate
architectural choice, so the bar is high.

---

### 12.8 [x] `tests/e2e/` vs `tests/unit/` is a browser split, not a UI split — resolved by `tests/unit_js/`
Shipped 2026-08-04/05 — [CHANGELOG](CHANGELOG.md). See [tests/INDEX.md](tests/INDEX.md) for the four
tiers.

---

### 13.1 [x] Repurposed `exercisesView` into a Professional Movement Taxonomy — see CHANGELOG

---

### 13.2 [x] Fast-selection flows over the taxonomy — see CHANGELOG
Restored as a stub because four `src/` modules still cite it. The three scenarios those comments
mean: **A** multi-add from the picker, staying open for rapid entry; **B** swap-by-volume-bucket in
the adjustment wizard; **C** strict taxonomy inheritance when authoring a new movement.

---

### 13.3 [x] Conditioning metrics (modality axis) — see CHANGELOG

---

### 14.6 [x] Rename the `booking` domain term to `session` — shipped 2026-07-27
**No back-compat kept** — decided pre-release with no real PT data to protect, so the v1→v2 migration
drops stray `bookings` rather than carrying it forward.

---

### 14.7 [x] Extract a shared `renderMarkupOnce()` helper — shipped 2026-08-01, see CHANGELOG

---

### 14.8 [x] Render-order dependencies between modules are unenforced — shipped 2026-08-01, see CHANGELOG

---

### 14.9 [x] `activeSessionController.js` mixed markup templates into a behavior file — shipped 2026-08-01

---

### 16.3 [x] [Resolved — superseded by §18.6] Key storage buckets on the DATA SCHEMA, not the release tag
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). `CURRENT_SCHEMA_VERSION` stays a plain integer major:
a "patch" to a schema is either a migration step or nothing.

---

### 16.5 [x] Retire the multi-version hosting machinery from the code — done
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). **Kept**: the commit-SHA build stamp and the
build-info dialog — support surfaces, not switching machinery.

---

### 17.3 [x] Erasure = anonymization only (never delete) — shipped 2026-08-11
Decided 2026-07-22, built 2026-08-11 as `clientErasure.js`. See [CHANGELOG](CHANGELOG.md).

The one open question this section carried — **reversible vs irreversible**, and where a
re-identification key could live — is settled as **irreversible**, and the reasoning is worth not
re-deriving: a reversible scheme needs a mapping, and with no server the mapping would live in the
database it is protecting, making one file that un-erases everyone. Deriving the pseudonym from the
record's own opaque id instead means there is nothing extra stored to reverse, so the key-location
question stops existing rather than being answered.

---

### 18.1 [x] [Decided in principle] The star write model, and its relationship to §16.3
**Built** — [recordSchemas.js](src/data/recordSchemas.js), [recordProjections.js](src/data/recordProjections.js)
and `starWrite()` in [stateStore.js](src/data/stateStore.js). Three constraints that still bind any
change here:

- **The fan-out set is global, never per-app-version.** If each version declared its own, two tabs on
  two versions would write different sets and buckets would silently diverge.
- **A cached build's fan-out set is fixed at cache time** — it can never learn a schema was retired.
  So the set is a constant compiled into the build, and retirement is a two-step: stop reading it,
  then stop provisioning it. A retired schema goes on receiving writes from stale builds, which is
  harmless (a store nobody reads).
- **Write set ⊇ read set.** A bucket must receive star writes the moment its migration *begins*, not
  when it completes — that is what makes §18.3's accelerator work.

---

### 18.2 [x] [Decided, CLOSED] Identity: lineage IDs, no ID-mapping table
`lineageId` **is** the record's own `id` — projections carry it unchanged, so today's UUIDv7 already
is the lineage id and no mapping table exists. **UUIDv7** (RFC 9562) gives 122 bits of collision
resistance *and* lexicographic time-ordering, doubling as the tiebreak within §18.5's topological
order. If short ids are ever wanted, base62-encode a v7 — never drop entropy.

---

### 18.4 [x] [Decided — staging, not envelopes] The lossy-projection problem
**The problem is narrower than it looks.** A rollback loses nothing — the newest bucket keeps full
fidelity while the PT reads a degraded older one. The loss happens only when **the old UI writes**: a
v5 domain object with no v6 concept in it fans out and overwrites the full-fidelity record everywhere.

**Chosen: expand-first staged releases** — never let a supported schema be unable to carry a field.
Free in code, paid for in release discipline. (Rejected: a preservation envelope, an opaque field
older versions round-trip verbatim — if staging guarantees projections are not lossy, there is
nothing to reconstruct.)

- **The rule staging obligates**: *no feature ships until its storage has shipped in every currently
  supported schema* — the field lands N releases before the UI that uses it. **Enforced in CI**
  (`test_star_write_invariants.py`), because without a check the discipline survives until the first
  hurried release.
- **Projections must be pure and total** so buckets are always re-derivable — enforced by
  `test_projections_are_idempotent_and_invertible`.
- **Escape hatch**: a change that genuinely cannot be staged is the trigger to **EOL the incompatible
  schema**, not to ship a lossy projection.
- **Reading degraded is mild; WRITING degraded is the danger.** A wrongly displayed HIIT exercise is a
  display problem; a PT *logging into that wrong view* produces bad data that fans out everywhere. So
  the signal belongs at the point of writing, announced app-wide via §18.12's ribbon.

---

### 18.5 [x] [Decided] Ordering is topological, not chronological
Replay order means correct **foreign-key availability**, not timestamp order.
[recordReferences.js](src/data/recordReferences.js) declares the reference graph (structural
ownership only) and a DFS cycle check is asserted in CI. Today's graph is trivial; the point is
catching a future convenience back-reference before a trainer does — **§17.4 is the first realistic
cycle risk.** The wall clock is not an ordering key anywhere.

---

### 18.10 [x] [RESOLVED — one build] Deep links, and one build vs. many builds
Resolved in favour of the one-build model. Three deep-link invariants that follow and still apply:
**never version-qualify a shareable link**; a **removed or renamed route becomes a permanent alias**
retained forever, so a link to a retired behaviour resolves to the nearest surviving ancestor rather
than erroring; and **deep links carry the `lineageId`**, never a per-schema id (§18.2).

---

### 18.13 [x] CD pipeline tests for the star-write layer — shipped
Shipped 2026-08-02 — [CHANGELOG](CHANGELOG.md). The properties §18 relies on are *invariants across
releases*, which a per-commit gate can hold and review cannot: none can ever be tested against a real
PT's data, because that data is local-only by design.

---

### 18.14 [x] One numbering axis, and a disposable preview schema — shipped 2026-08-10
Record schemas and the migration chain used small integers for **different** things (`{2, 3}` vs
`1–4`+`P`), so "schema 3" meant two things in two files. Unified: `LIVE_SCHEMAS` is `{4, P}` and 4 is
the same 4 the migration chain ends at. See [CHANGELOG](CHANGELOG.md). Two rules this pins:

- **`schema4` is durable, `schemaP` is not.** P is the shape *this build* reads; its fields may change
  on any commit, so it is never a source of truth for anything outliving the build. It is rebuilt from
  schema 4 whenever the recorded build SHA does not match the running one — and an **absent** marker
  counts as not matching, so "we don't know which build wrote this" costs a projection pass rather
  than risking a read of fields that are not there.
- **Non-numeric schema keys must be threaded, never coerced.** `Number("P")` is `NaN`;
  `Object.keys(LIVE_SCHEMAS).map(Number)` once sent every star write to a `schemaNaN` store that does
  not exist, failing 139 of 141 e2e tests on a splash timeout. Use `liveSchemas()`.

---

### 18.16 [x] Local runs stopped disagreeing with CI about what time it is — 2026-08-18

Asked for after CI failed on a test that had passed locally three times. Four divergence classes were
visible in one day's evidence; three were closed:

- **Wall-clock dependence.** Browser tests run on a frozen `Date.now` ([conftest.py](tests/conftest.py)),
  so the demo seed's relative times, day buckets and overdue labels are identical whatever hour the
  suite runs. Four tests had been deriving "today" from the HOST clock and comparing it against the
  app's — agreement by luck, and already a midnight race.
- **Suspend detection.** `_timed_task` compares monotonic against wall time and says so when a task
  spanned a gap it did not spend working ([build/__init__.py](build/__init__.py)). A time jump means
  the run was interrupted, not that the change regressed — it previously relied on somebody noticing
  timestamps by eye, which failed twice in one session.
- **One Python declaration.** CI ran 3.11 while this machine ran 3.14.4 with nothing saying so. The
  first fix bumped thirteen `python-version:` literals and added a checker that they agreed, which the
  maintainer rejected outright — *"12 pins for python? that is not single source of truth"*. There is
  one declaration now (`.python-version`), read by every job via `python-version-file:` and by pyenv,
  so drift is impossible rather than detected. [python_version.py](agent_tools/python_version.py)
  keeps what a file cannot: this machine on the declared minor, plus a guard against literals
  returning.
- **A shared wait for durable writes.** Two tests raced the write queue in one day (signup, then RSVP
  ingestion): both wrote, then did a full page load that re-read IndexedDB before the enqueued write
  had flushed. `wait_for_stored_record` in [conftest.py](tests/conftest.py) is the one wait now, taking
  a field/value dict rather than a JS predicate — the first draft used `new Function`, which the app's
  own CSP forbids.

**Left deliberately**, as theoretical rather than observed: an opt-in stress mode (higher worker count,
to surface write-queue races on purpose) and randomized test order with a printed seed.

---

## 20. [x] Test tiers: the clipboard, and the `activeSession` contract — COMPLETE
**Closed 2026-08-05** — [CHANGELOG](CHANGELOG.md); the seam is [DATA_MODEL §7](docs/DATA_MODEL.md).

**Two shapes that break naive consumers**, worth keeping in front of anyone writing a fixture: a
planning draft carries `isPlanning: true` and NO `startDate`/`endDate`, and a session opened from
history has `sourceSession: null` unless it was a plan. `buildSessionMeta`'s 2h `endDate` clamp is
load-bearing — `recoverActiveSession()` discards a cache more than 2h past its scheduled end.

---

## 21. [x] `Page.goto` stalls against the local dev server — ROOT-CAUSED AND FIXED
**The cause was the Font Awesome CDN stylesheet (§12.6), vendored 2026-08-05.** The measurements, and
the list of things ruled out so they are not re-derived, are in [CHANGELOG](CHANGELOG.md); the
per-stage budget and the diagnostic that generalises (**a tight cluster of near-identical durations
is a timeout, not work**) are in the per-stage budget table.

**One loose end**: the navigation timeout was raised 30s → 60s while chasing this. With the cause
fixed, consider reverting it so any future stall fails fast and cheap.

---

## 22. [x] Two `src` defects found while testing — FIXED
Fixed 2026-08-05 — [CHANGELOG](CHANGELOG.md). **The general lesson**: a stub that hand-duplicates
production wiring will agree with itself and disagree with the app. Mount the real `bootXyz` step, or
the test proves only that the test is self-consistent.

---

### 24.1 [x] Stage 1 — one theme system, not two — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md). `src/theme-boot.js` keeps its own small copy deliberately: it must stay
import-free to run before first paint.

---

### 24.2 [x] Stage 2 — two `formatDuration`, two `escapeHTML` — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md). The two durations were deliberately **not** merged; the duplicate
`escapeHTML` was, because `build/frontend_audit.py` recognises the *name*, so a local copy passes the
audit while being free to drift.

---

### 24.3 [x] Stage 3 — the board render leaves `controllers/` — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md), which also records why `correctness/noUndeclaredVariables` is on
despite not being in Biome's recommended set.

---

### 24.4 [x] Stage 4 — split the rest of `activeSessionController.js` — shipped 2026-08-07
`domain/sessionPlanFactory.js`, `domain/quickSignals.js`, `domain/sessionFocus.js` and
`domain/sessionHistoryRecord.js` — see [CHANGELOG](CHANGELOG.md) for the three defects it surfaced.
The rule that decided the split boundary: **the quick-signal DECISIONS are pure while the MUTATION is
not**, so the controller keeps thin wrappers rather than the whole thing moving.

---

### 24.6 [x] Stage 6 — `src/domain/`, a layer for what is neither storage nor UI — shipped 2026-08-07
See [CHANGELOG](CHANGELOG.md). `src/domain/` is ranked in `import_layers.py` between `data/` and
`modules/common/`.

**The line to hold when adding to either**: **`data/` is records at rest** (shape, identity, ordering,
persistence); **`domain/` is the training vocabulary** (what a modality is, how reps and load are
authored, what a session's clock means) — pure, no DOM, no storage. Three modules went to `data/` and
not `domain/` on that test, and the layering itself decided the last one: `position` is a stored
FIELD, `sessionCache.js` needs the logic keeping it well-formed, and a `data/` module may not import
upward.

---

## 25. [x] Layout overflow: assert geometry, not just semantics

**Shipped 2026-08-10** — [overflow_scan.py](agent_tools/overflow_scan.py) plus
[tests/e2e/test_layout_overflow.py](tests/e2e/test_layout_overflow.py); the rules the sweep learned,
and the real defect it found, are in [CHANGELOG](CHANGELOG.md). Every other test in this repo asserts
*semantics* (text, counts, ids); this one asserts *geometry*, which is the class of bug a trainer
hits on the gym floor and the pipeline never saw.

### 25.1 [x] Invariant A — nothing extends past its clipping boundary
Each visible element's `getBoundingClientRect()` against the client box of its nearest **clipping
ancestor** (`position: fixed` escapes that chain and is bounded by the viewport **horizontally
only** — a bottom sheet is not a bug). **The mechanic worth keeping**: `body { overflow-x: hidden }`
already masks this whole class, so `documentElement.scrollWidth` reads clean today and forever. The
check has to be geometric and per-element to see the true layout box.

### 25.2 [x] Invariant B — nothing overflows its own box
`scrollWidth > clientWidth + 1` and the height equivalent, exempted **per axis** by what the element
itself declares: `auto`/`scroll` is self-declaring intent, `visible` is skipped (a non-clipping
element reports its children's overflow as its own, so one defect would repeat up the whole chain —
Invariant A names the offending child once), and the ellipsis / line-clamp idioms state their intent.
Bare `overflow: hidden` with real overflow is the silent-clipping case, and the one worth finding.
**No test-side allowlist** — intentional clipping opts out in the markup as `data-clip="intentional"`,
reviewable in a diff and travelling with the component.

### 25.3 [x] Where it runs
With demo data seeded, one page context per device walks every route in
`src/controllers/routes/routeTable.js` — views, then each route-backed dialog while OPEN — via
router-driven `pushState`, so ~20 routes cost one cold boot (~12.5s of call time per walk). Devices
are **iPhone 14 (390×844)**, **Galaxy S23 Ultra (412×915)** and **desktop (1280×800)** (where
`body`'s 480px column, not the window, is the edge), plus **one Slovenian pass** at the narrowest
width, because overflow is a text-length bug. A fifth test needs no browser: it diffs the walk's
route list against `routeTable.js`, so a route added later fails until someone decides whether its
view can overflow.

### 25.4 [x] One sweep, two consumers
The JS lives in ONE module, used by the e2e suite and
runnable directly as a diagnostic (`--device`, `--viewport`, `--invariant`). Its own tool rather than
a flag on [layout_probe.py](agent_tools/layout_probe.py), which stays about *named selectors*.

### 25.5 [x] What it found
One real, phone-only defect — the edit-mode status chip pushed 169px outside the ellipsised session
title, entirely invisible, and the only thing on screen distinguishing editing a LIVE session from a
future one. **Reordering did not fix it, it only chose the casualty**; an ellipsis eats whole
ELEMENTS, so the fix was structural (flex row, `min-width: 0`, only the client name shrinks). Three
false positives came first, each buying a rule now written into the tool — see
[CHANGELOG](CHANGELOG.md).

### 25.6 Status
- [x] The tool, its unit tests, and the four-device e2e suite; full gate green 2026-08-10.
- [x] `tests/medium/_overflow.py` — 2026-08-21. `assert_component_fits(page, root)` after mount; the
      sweep gained a `root` selector that scopes which elements are asserted, not what they are
      measured against, so the boundary is still the real page's. Defaults to a 390px phone, because
      a medium test that set no viewport sweeps at a desktop default where nothing is tight enough to
      break, and a missing root fails rather than sweeping nothing. Its own tests plant an overflow
      and assert the failure names the element; wired into the clipboard title bar (§25.5's defect)
      and the signup review dialog.

**Cost, measured**: ~50s of call time across the four walks, ~13s on stage 3's floor once fanned out.

---

### 26.2 [Superseded 2026-08-17] The payload, and why it lives in the fragment
**The transport is a shared FILE, not a link** (§1.7, ruled by Simon). Nothing below is being built:
there is no URL payload, so there is no codec, no fragment, and no compression. The reasoning is kept
because it is the argument for why a URL was never the right place for this data — which is the same
argument that makes the file transport correct.


Name / email / phone / goals / injury plus `gdprConsent` is ~400–600 bytes of JSON;
`CompressionStream('deflate-raw')` + base64url takes it to ~250–400 characters. The codec belongs in
`src/data/` with a round-trip unit test in [tests/unit_js/](tests/unit_js/) — pure logic, no DOM, no
persistence.

**In the fragment (`#`), never the query string.** A fragment is not sent to the host, so it never
reaches GitHub Pages logs or a `Referer`, and WhatsApp's link-preview crawler cannot fetch it. This
is §19.2's URL-privacy question in its sharpest form — the payload is names, phone numbers and
health data rather than an opaque id — and the fragment is what keeps it off every wire except the
two devices that already hold it.

---

### 26.5 [x] Import is a review, never an auto-save — 2026-08-17
Anyone who photographs the wall QR can craft a payload, so the review dialog is the trust boundary,
not a nicety. It also carries **dedupe**: match email/phone against existing clients and offer
"update existing" rather than minting a second Jane Doe — the same key
[UC4](use_cases/uc4_client_self_subscription.md) already uses to reconcile bookings, so the two
should agree on it. Sits naturally inside §5.2's "creation is a minimal modal, editing is inline"
decision.

---

### 27.1 [x] Erasure (Art. 17) — shipped 2026-08-11
Built as `clientErasure.js`; see [CHANGELOG](CHANGELOG.md) and §17.3. The framing this section
argued for survived into the implementation: **per-field redaction inside shared records**, not row
removal, because a completed group session with three participants is simultaneously two *other*
clients' training record. Art. 17 is not absolute either, so what a trainer gets is "redact identity,
keep the training record" rather than a delete button.

What the section did not anticipate, and is the part worth remembering: **two Jane Does is ordinary
in a gym**, and it is where a name-based sweep does real damage. Prose in records the client *owns*
is rewritten; text several clients share is left as typed and reported for a human pass.

---

### 27.2 [x] Access & portability (Art. 15, 20) — shipped 2026-08-11
Built as `clientDataExport.js` + `encryptedExport.js`; see [CHANGELOG](CHANGELOG.md). Whitelist-scoped
to one client, so this section's central hazard — the whole-database backup carries every *other*
client's Art. 9 health data, and sending it to answer an access request would itself be a breach — is
structurally hard to hit rather than filtered against. Both renderings landed: Markdown for Art. 12(1)
legibility, JSON for portability, from one projection.

---

### 27.3 [x] Erasure does not reach the copies — closed 2026-08-11 by the register
Settled as **prune on restore**, the option this section thought was the less obvious one. The
recursion it flagged is real and is what shaped the answer: the register stores a **salted hash per
entry** and nothing else, so what is retained after an erasure request is the minimum needed to
honour it. Applied at import, before restored data becomes live. See §18.11 and [CHANGELOG](CHANGELOG.md).

The half that is still true: a backup file sitting in Drive **still contains the name**. The register
neutralises it on the way back in, which is what protects the trainer's own database; it does nothing
about a copy someone else holds. That belongs in the retention paragraph §18.11 still owes.

---

### 27.4 [x] Withdrawal as easy as consent (Art. 7(3)) — 2026-08-14
The letter now carries the route, not just the right. Consent is given by replying **"I CONSENT"** /
**"PRIVOLIM"**; withdrawal is replying **"WITHDRAW"** / **"PREKLICUJEM"** to the same message. That
symmetry *is* the Art. 7(3) standard — withdrawal must be as easy as consent, and the same reply to
the same person is exactly as easy, not merely possible.

**No prefilled `mailto:` to the trainer, because the app stores no trainer contact** — and it does
not need to. The letter reaches the client *from* the trainer's own address (a `mailto:` opens the
trainer's mail client), so reply is already the one-tap route, and it survives the trainer changing
address. A stored contact would have been a second thing to keep correct for no gain.

Both channels carry it: a client sent the short SMS variant never receives the email letter, so a
route living only in the email is missing for exactly the clients reached by the shorter channel.

`CONSENT_FORM_VERSION` deliberately **not** bumped, on the 2026-08-10 precedent recorded in
[the template](docs/templates/en/Client_Consent_Form.md): purposes, recipients, retention and the
rights on offer are unchanged, and making an existing right easier to exercise does not make earlier
consent cover less. A bump would have asked every signed client to re-sign for nothing.

**Still open, and a different item: nothing RECORDS a withdrawal.** `gdprConsent` holds
`{cloudSync, consentDate, formLang, formVersion, timestamp}` and no withdrawal state, so a trainer
acting on the reply can only untick the box — which destroys the evidence that consent was ever
given. Art. 7(1) requires being able to demonstrate that it was. See §27.7.

---

### 27.7 [x] Record a withdrawal instead of erasing the consent — 2026-08-14
Surfaced building §27.4. Withdrawal arrives as a message; the trainer's only way to act on it today
is to untick the consent box, which leaves a record indistinguishable from a client who never
consented at all. Art. 7(1) requires demonstrating that consent *was* obtained, and §3.5's
`formVersion` stamp exists precisely to answer "who is still covered?" — a question that needs
"consented on X, withdrew on Y" rather than silence.

Shipped as [clientConsent.js](src/data/clientConsent.js), and it needed **no schema bump** —
`gdprConsent` is `type: "object"` in [recordSchemas.js](src/data/recordSchemas.js) with no inner
schema, so `withdrawnDate` is additive.

**Unticking the box now records the withdrawal rather than blanking the record.** That was the
actual defect: `readConsentFromSection` wrote `{cloudSync: false, consentDate: "", formVersion: "",
formLang: ""}`, so the only action available for honouring a withdrawal destroyed the proof that
consent had ever been given. `cloudSync` stays the "may I process?" flag every caller already reads,
so nothing had to learn a second rule; the signed date, wording version and language survive beside
the new `withdrawnDate`. Re-ticking drops the withdrawal date, because signing again is a new
consent and not an undo.

**The archiving dialog was telling trainers the wrong thing** and was corrected in the same change:
it said "if the client withdraws consent, delete their records here", which conflates Art. 7(3) with
Art. 17 and loses the withdrawal record along with everything else. Withdrawal halts processing;
erasure (§27.2) is a separate request the client makes, and they may well want their history kept.

Three states now render distinctly — never consented, consented, withdrawn — in the profile badge
and in the client's own Art. 15 export, since the subject reading it is the person most entitled to
see that their withdrawal was acted on.

---

### 27.5 [x] The doc describes what a trainer can actually do — 2026-08-11
Resolved by the other branch: [PRIVACY_FOR_TRAINERS.md §5](docs/PRIVACY_FOR_TRAINERS.md)'s rows name
**Export data (GDPR)** and **Erase client (GDPR)**, and both now exist. The rule stands for whatever
this doc promises next — a compliance document naming a button that does not exist is worse than one
saying "do this by hand", because the trainer discovers the gap while a statutory clock is running.

---

### 28.1 [x] Comments and docstrings must name a constant, not repeat its value — 2026-08-18

See [CHANGELOG](CHANGELOG.md). Swept: `deploy/local_http_server.py`, `build/__init__.py`,
`src/modules/common/consentForm.js`, the three `agent_tools/` usage docstrings, and
the tests that had a deployment address written into them (those now use obviously foreign hosts,
which is also the better test — they pin how a link is BUILT, not where this app is deployed).
`dev_server_url()` was added alongside, so nothing has to write out the port and base path together.

**What remains, and it is §28.2's, not this one's**: `README.md`, `CONTRIBUTING.md` and
`docs/GOOGLE_CLOUD_SETUP.md` still spell out addresses, because every one of them is a string a human
copy-pastes into a shell, a browser or the Google console — `git clone {{ISSUE_TRACKER_URL}}` helps
nobody. Those files are not built, so they cannot be injected into; which contributor-facing docs get
built is exactly §28.2's open question. `constant_copies` reports them meanwhile, so they are a list
rather than a forgotten corner.

---

### 28.3 [x] A declared constant must appear in exactly one place — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). `python -m agent_tools.constant_copies`, a **diagnostic and not a
gate**, exactly as decided: it earns a Stage 1 task by catching something twice, not before. It is now
the first step of the fortnightly duplication sweep above.

One row was dropped during the build and the reason is worth keeping: `DEV_SERVER_BASE_PATH`'s value is
the repository's own name, so its literal matches every absolute path on the maintainer's disk and
every link into the GitHub repo. A constant whose value collides with unrelated text is not trackable
this way, and a check that cries wolf is one nobody runs.

---

### 28.4 [x] BUG — a collapsed deck card's first line is unreadable — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The "unless it is a past card" half of the report was the clue: the past
card is LAST in the deck, so nothing is stacked on it. Nothing about past cards was involved, and the
`2fe2464` pointer was right — that fix covered desktop only.

---

### 28.5 [x] BUG — backup warnings appear in DEMO mode — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Fixed together with §28.6: one predicate, `withoutSeedRecords`, applied
at both counters — the reports were two symptoms of the same wrong question.

---

### 28.6 [x] BUG — loading demo data increments the ahead counter — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The `seededDemo` stamp pointer in the original note was right, and the
committed seed id set covered the databases minted before it existed.

---

### 28.7 [x] BUG — the header menu does not work while the messages pane is expanded — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The menu worked; the expanded drawer covered the view it navigated to.
The `753985a` scroll-container suspicion in the original note was a red herring.

---

### 28.8 [x] BUG — the disabled-backup strikethrough is not visible enough — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). This reverses §3.11's deliberate "informational, never a warning"
treatment on the maintainer's ruling; the reasoning for the reversal is in the commit and the test.

---

### 28.9 [x] CHANGE — a DEMO tag replaces the PREVIEW tag in demo mode — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The open question — whether both matter at once — was answered by the
one slot: DEMO while the store holds nothing but the demo, PREVIEW from the trainer's first real
record, because that is when data loss stops being hypothetical.

---

### 28.10 [x] CHANGE — cancellations and bookings accumulate in one message card — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The group takes the place of the FIRST of its members rather than
floating to the top, so the demo-mode notice stays the collapsed summary.

---

### 28.11 [x] BUG — a cleared browser boots to a splash with no demo or animation offer — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). The maintainer's diagnosis was right: the deep link, not the empty
store. Only the `?splash=off` half was overridden — the language half was tried and reverted, because
a share link naming a language must open in it ([test_share_deeplink.py](tests/e2e/test_share_deeplink.py)).

---

### 28.12 [x] CHANGE — the guided walkthrough wants a glow, instructions and a real hand — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). Two of the three were built: the glow, and a hand that is actually a
hand. The instructions overlay already existed and was left alone.

---

### 28.13 [x] BUG — a walkthrough reloaded by deep link points at the wrong element — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Target resolution now skips anything with a zero-sized box, so an
inactive view's copy of a selector can never win.

---

### 28.14 [x] CHANGE — the demo-mode message offers to start the walkthrough — shipped 2026-08-18

See [CHANGELOG](CHANGELOG.md). The "verify all needed data is there" half became
[walkthroughReadiness.js](src/domain/walkthroughReadiness.js), keyed on shape rather than seed ids.

---

### 28.15 [x] BUG — the walkthrough panel covers the control it points at — fixed 2026-08-18

See [CHANGELOG](CHANGELOG.md). Reported as steps 2 and 4, "sometimes", after scrolling — and both
halves of the "sometimes" were timing: the clearance check ran once per step, right after
`scrollIntoView` and therefore before the scroll settled, and the poll that keeps the spotlight on a
moving target never re-ran it.

---

### 30.1 [x] BUG — loading demo data from the message button freezes the app for a while — closed 2026-09-11, not reproducible

**Reported 2026-08-18:** tapping the empty feed's "load demo data" offer appeared to hang the app
briefly. The suspected cause was named in the report itself: the handler seeded the whole dataset
and then RELOADED the page, so the freeze was probably the synchronous seed, the write queue
flushing behind it, or the reload landing while those writes were still in flight. The section said
measure before choosing, because the fix is different for each.

**Measured 2026-09-11, and the freeze is gone.** An empty app, the real boot, the drawer open, the
button tapped: the click returns in **76ms** and the browser records **no long task at all** — no
span over 50ms in which the page could not have answered a tap. Throttled to a sixth of this
machine's CPU, which is the order of a mid-range phone, it is **one 249ms task** and a click that
returns in 359ms: a visible hitch on a button that writes a whole gym's records, not an app that
hangs.

**What removed it was not aimed at it.** The reload is no longer there — §40.3a replaced it with
`renderEverything()`, so seeding now writes the records and repaints, and the report's own leading
suspect went with the reload. The remaining 249ms is the seed plus a full re-render; the writes
themselves are behind the queue ([writeQueue.js](src/data/writeQueue.js)) and never blocked the
main thread.

**Nothing shipped for this, so there is no CHANGELOG entry.** The measurement is the outcome, and
it is written here so the next person who reads the report knows it was answered rather than
forgotten. Reopen it if a trainer reports the hitch on real hardware — the cheap fix then is a
progress state on the button, not a yielded seed.

### 30.5 [x] BUG — Show me did nothing on a card, and a second caption sat on the panel — fixed 2026-08-22

**Reported 2026-08-22 (Simon)**, walking the story in the browser:

- *"Show me for three friends arrive does nothing."* It did something, and that was the problem: it
  spent three seconds walking a pointer to the **Continue button already under the reader's thumb**.
  From outside, a guide that pauses for three seconds and then closes a card is a guide that has
  stopped working.

  **Fix, in his words: "for steps that have no Show me, merge them with the next one".** A card is
  now attached to the step it introduces — read it, then do the thing it is about, and the first tap
  anywhere takes it away. One rule, [foldCards](src/modules/demo/storyTour.js), so the chapters stay
  readable as a sequence: the card is still written where it belongs in the story. A card with
  nowhere to ride — the last step, or the handover to the client's phone — stays a step and declares
  `showMe: false`, and the guide hides the button rather than offering a dead one. The story went
  from 35 steps to 31, all of them things a person does.

- *"Steps 3 and 4 have an overlapping black subtitle over the buttons."* The story's own caption bar,
  fixed to the bottom of the screen, over the guide's panel — which carries the same caption. The bar
  was written when the story played itself and nothing else showed captions; it has had no reason to
  exist since the story became guided. Gone, and the card now sits in the upper half so it cannot
  cover the panel either.

- **Found while fixing the first**: dismissing the card on the first tap ALSO fired for taps on the
  guide's own panel, so Show me made the card vanish before the pointer reached it.

- *"Step 2 of 31 … this step didn't complete."* The ☰ menu closes on any click outside it, and Show
  me is outside it — so the guide closed the menu holding the item its next step points at.

**Asked while fixing this (Simon): "do you have other TOOLS that should really be tests? fix
them."** One did, and it was the one written the same day: the icon RENDER check. It asserts
something that has to stay true — every icon draws, and draws the shape it drew before — so it is
[tests/e2e/test_icons_render.py](tests/e2e/test_icons_render.py) now, importing the rendering from
the tool rather than reimplementing it. What stayed a command is recording the baseline, which is a
deliberate act taken with a regenerated font. The same question was asked of the rest of the catalog:
the gates are already gates, and what is left (the font subsetter, the icon rasteriser, the demo
recorder, the layout probe, the credential minter) either PRODUCES a committed artifact or explores a
running page, and neither is a claim a build can hold.

A story walker was written and deleted in the same hour for the same reason: the e2e suite already
walks the story, so a second walker was a second thing to keep true. What it was really offering was
a readable failure, which is now what the suite gives — the step, its caption, what the guide said,
and what was on screen.

**Three surfaces, one rule, now declared once**: [isGuideSurface](src/modules/common/dom.js). Every
"tap outside closes me" rule in this app means *outside the thing you are working on*, and the guide
floats over the app: its panel and its story card are the trainer working the GUIDE. The plan editor,
the ☰ menu, the session menu and the card's own dismissal all ask the same question of the same
helper now. Pinned by [test_guide_is_not_the_app.py](tests/medium/test_guide_is_not_the_app.py),
which tests the TAP — the demo's own walk missed all three, because it taps Show me at moments where
the closure happens to do no harm.

---

### 30.4 [x] BUG — the guide asked for a screen the trainer was already past — fixed 2026-08-22

**Reported 2026-08-22 (Simon), with a screenshot**: "step 1 of 4 on the clipboard view" — the panel
said *open the group session* over an already-open clipboard. The app opens a live session on its own
(the demo seed has one in progress), so the first step was satisfied before anyone read it.

**The fix is to move past it, not to undo it.** The first attempt re-checked the PRECONDITION on
every poll tick and rebuilt the ground when it failed — which turned the guide against the trainer:
tapping the session card themselves opened the clipboard, and the guide navigated straight back out
of it. A test caught that within the minute. What is right is narrower: a step already satisfied when
the guide ARRIVES at it is one the trainer is past, so the guide advances to the one they are not.
Never on Back, where a step returned to stays done and stays put — otherwise Back does nothing at all
and gets tapped twice.

Two more from the same session, both real beyond the demo:

- **The highlight lagged the control.** "When Show me clicks a collapsed card, the card expands way
  faster than the surrounding border highlight" — a card expanding fires no scroll and no window
  resize, so the ring sat on the old geometry until the next poll tick, up to a quarter second. A
  `ResizeObserver` on the target sees it in the same frame.
- **Two looks for the same three buttons.** Too Easy / Too Hard / Notes were grey and 32px tall
  inside a circuit and coloured and 40px on a standalone card. §7.2 already said in words that the
  two must agree; the circuit rows now wear the deck's own classes, so the look comes from one place,
  and [test_signal_buttons_match.py](tests/medium/test_signal_buttons_match.py) says it in a way that
  fails.

---

### 30.3 [x] BUG — a cleared browser plays the demo to an empty room — fixed 2026-08-22

**Reported 2026-08-21 (Simon):** clear the browser data, open a demo deep link, and you get neither
the language choice nor the demo. Two independent causes, both invisible to the whole e2e suite
because the shared fixtures auto-accept the terms and auto-dismiss the splash — so the first test
written for this had to build its own browser context
([test_first_run_deeplink.py](tests/e2e/test_first_run_deeplink.py)).

- **Seeding the demo answered the language question.** `seedMockData()` set `lang = state.lang ||
  "en"`, so a store that had never chosen one came out of the seed looking as though it had, and the
  splash skipped the step. Seeding is about RECORDS; the preference is the person's to give. The
  line is gone.
- **The demo started as soon as the app was wired**, which on a first run is BEHIND the mandatory
  terms modal — measured: all sixteen steps played out and finished at ~44s while the agreement was
  still on screen. It now waits on the splash's own promise (which also covers the language step, so
  the demo narrates itself in the language just chosen) and on the agreement being closed. Started,
  never awaited: `init()` must finish wiring whatever the trainer is reading.

---

## 31. [x] A support data-wipe link — shipped 2026-08-23

**Wanted 2026-08-19 (Simon):** a link support can send by SMS or email that opens a **consent dialog**
asking the trainer to confirm a data wipe. *"Link should not be advocated"*, it should offer a wipe
**per schema version (plus unversioned data)**, and it must carry the note that **exports and backups
are not removed from storage the app does not own.**

**Shipped as `/wipe`**, every one of those honoured. Asked on 2026-08-23 whether it existed yet: the
pure planner ([dataWipe.js](src/data/dataWipe.js)) had been built with the spec and nothing called
it, which is the shape of a feature that looks done in a diff and does nothing in an app.

- **The stores are read from the DATABASE, not from this build's schema list**
  ([listDatabaseStores](src/data/indexedDb.js)). A long-lived install accumulates stores from builds
  this one never made, and a wipe that cleared only the familiar ones would leave a trainer's data
  behind while telling them it was gone.
- **Stores are EMPTIED, not dropped.** Dropping one needs a version change, and a half-applied
  upgrade is a worse state than the one they called support about. An empty store reads as no data
  everywhere in this app.
- **It reloads afterwards.** Every module in the page is holding state from a database that no longer
  has it; asking a dozen of them to notice would be a dozen places to be wrong.
- **Linked from nowhere**, as asked. No menu item, no button — a permanent "erase everything" control
  on a phone used one-handed is a mis-tap waiting to happen, and anyone who has not been sent here by
  someone helping them has no reason to be here.

### 31.1 The one invariant

**The link carries no authority.** Opening it can only ever OPEN A DIALOG; there is no parameter that
performs the wipe, no `confirm=1`, no auto-run after a delay. A URL that destroys data on open would
be one forwarded message away from destroying a stranger's — and support links are, by their nature,
sent to people who are already confused and inclined to tap.

That makes the dialog the whole security boundary, so it: names the device it is about to erase,
lists what will go by schema, states what it CANNOT reach, and requires a deliberate confirmation
rather than a default-focused OK.

### 31.2 What it wipes, and what it cannot

Storage is `librept` in IndexedDB — one store per live schema (`schema4`, `schemaP`, and any older
store a long-lived device still carries) plus a `meta` store — and a set of `librept*` localStorage
keys. So the offer is per schema store, plus **unversioned**: `meta` and localStorage, which is where
the active session, read-notification ids, the terms acceptance and the Drive sync meta live.

**Not reachable, and the dialog must say so**: a downloaded backup file, a Drive sync file, an
encrypted export a client was sent, a consent letter already in someone's mailbox. The app can erase
what it holds; it cannot reach into storage it does not own, and a support wipe that implied
otherwise would be worse than none.

### 31.3 Not advocated

No menu entry, no notification card, no link from anywhere in the app. It exists at a URL support
sends deliberately. The support runbook can document it; the product must not offer it — a
"wipe everything" control one tap from the gym floor is a support ticket waiting to happen, which is
also why §9.3's demo cleanup is selective rather than a reset.

---

## 38. [x] Reported 2026-08-25 — the demo's own entry points — fixed 2026-08-25

See [CHANGELOG](CHANGELOG.md).

### 38.22 [x] CHANGE — a client's file opens the app, instead of being saved and hunted for

**Asked 2026-08-30 (Simon):** *"a PWA import rabi shranjevanje datoteke iz message-a in nato
odpiranje? … a je branje datoteke preko menija sploh potrebno?"* and, for the demo, *"raje bi videl,
da simuliraš branje sporočila s priponko in odpiranje priponke odpre LibrePT"*, with *"zunanjo
aplikacijo simuliraj z zaslonsko sliko in kartico razlage"*.

**It did.** There was one way in: save the attachment out of the messaging app, open LibrePT, open
the ☰ menu, choose "Review a client's file", find the file in the picker. Five acts, two of them in
somebody else's app, for a file already on the phone.

**Two ways in now, and neither of them saves anything.**

- **`share_target`** — the trainer taps Share on the attachment and picks LibrePT. The OS POSTs the
  file to the app; the service worker answers that POST
  ([sw/sharedInbox.js](src/sw/sharedInbox.js)) because there is no server to, keeps the text, and
  redirects to the app with `?open=signup`.
- **`file_handlers`** — the trainer taps the `.json` itself and the OS launches LibrePT with it,
  which arrives through `launchQueue` rather than as a POST.

Both end in the same review dialog, so the trust boundary is untouched: a share target accepts a
file from any app on the phone, and a human still reads every field before a record is written
(§26.5). What is saved is the fetching, not the reading.

**The menu keeps its file picker, and that is the trade.** Both mechanisms are Chromium's and both
need the app installed; **iOS has neither**. So the picker stops being the main road and stays as the
one that works everywhere.

**Three things had to be got right, each found by building it:**

1. The inbox cache is not a version of the app shell, so `deleteObsoleteCaches` had to stop treating
   it as an obsolete one — a deploy while an unread submission sat there threw away a client's file.
2. A submission that opened during boot put a modal over the splash, and a modal makes the page under
   it inert — including the splash's own dismiss button. The trainer was left on a splash screen they
   could not get past. It now opens after the splash has gone.
3. The submission is read once and dropped: the marker survives a reload, so leaving it in the inbox
   re-opened the same dialog on every refresh.

**The type and the extension are the app's own, not JSON's.** The first version of this declared
`application/json` and `.json`, which would have offered LibrePT in the share sheet for every JSON
file on the phone and claimed the extension system-wide. Asked about directly: *"a nisva rekla, da
bova imela custom mime in custom končnico za uvoz v LibrePT?"* — and the pair was already decided and
already in the code (§1.7): `application/vnd.librept.signup+json` and `.json.librept-signup`, one
home in [data/signupFile.js](src/data/signupFile.js). The manifest now names that pair and nothing
wider, and a check compares the two files so they cannot drift.

**The suffix order was wrong for this, and changed with it.** The file was
`.librept-signup.json`; an operating system associates on the LAST suffix, so the distinctive part
sat where nothing reads it and the only way to be tapped open would have been to claim `.json` —
every JSON file on the phone. It is `.json.librept-signup` now (§1.7, amended 2026-08-30), which is
what makes registering as a handler possible at all. The `.json` stays as a hint to whoever looks at
the file.

**Still not testable here:** whether a given OS offers the app for that suffix is an association, not
a browser behaviour, and no test harness can answer it. **Re-check on a real Android phone before
this is called finished.** A share is unaffected either way — it carries the media type.

**The demo shows the new path.** Three steps — open the menu, choose the review, find the file — became
one: a screenshot of the trainer's messaging app with Ana's message and her attachment under it,
drawn rather than photographed (a picture goes stale the day either app changes and nobody notices).
The attachment is a real button, and tapping it calls the same entry point the share target does
rather than a path invented for the demo. The card quotes the message the app really sends
(`intake_share_text`), so it cannot drift the way the invitation text did (§38.19). The story is 47
steps now, down from 49.

`ScreenshotNarratorCard` is the fifth kind in the card hierarchy (§38.10) and the first to draw a
control of its own, which is what the `extras` hook is for. Its text colours are its own, like the
message card's: a tinted card puts muted text under the AA bar on the light palettes (§38.11), and
the contrast walk now covers it.

### 38.19 [x] BUG — the demo could not be finished in Slovenian

**Reported 2026-08-30 (Simon)**, from a Slovenian run, with the card pasted in: *"Korak 16 od 49 …
Tega koraka ni bilo mogoče zaključiti."* Followed by *"ana poškodbo piše v angleščini?"*

**The step asserted the app's English words.** `intake-send` expected
`containsText: "Shared"`; the Slovenian page says *"Deljeno. Trener te bo dodal iz te datoteke."*
The claim could never come true, so the story stopped dead at step 16 for every Slovenian viewer —
and passed every test we had, because the suite runs in English.

Four expectations read translated copy back to the app. All four now ask for a fact instead:

| step | was | is |
| :-- | :-- | :-- |
| `arrive-contact` | `containsText: "text message"` | `#intake-invite-send[data-channel='sms']` |
| `arrive-contact-email` | `containsText: "email"` | `#intake-invite-send[data-channel='email']` |
| `intake-send` | `containsText: "Shared"` | `#intake-status.is-done` |
| `swap-pick-movement` | `containsText: "Swapped"` | `.editor-added-badge[data-callout='swap']` |

Two of those hooks did not exist and were added, which is a small improvement in its own right: the
invite dialog now says which channel it chose (`data-channel`) and the editor says which kind of
callout a badge is (`data-callout`), rather than only rendering a sentence about it.

**And what the demo TYPES is content, so it is translated too.** Ana wrote up her shoulder in English
on a Slovenian phone. A step now says which words with `enterKey` and the expectation that reads them
back uses `hasValueKey` — the same key, so the two cannot drift into different languages — resolved
by `storyStepsFor` where the story becomes a runnable list. Names, addresses, phone numbers and times
stay literal: they are the same in every language. Measured after, in Slovenian: Ana writes *"rama,
pred dvema letoma"*, and step 16 completes.

**The check that keeps the fifth from being written**
([storyLanguage.test.mjs](tests/unit_js/modules/demo/storyLanguage.test.mjs)): a demo step may not
match on text the app says in English and never says in the other language. Verified by putting the
reported bug back and watching it fail — which is also how a hole in the first version was found: it
read the trainer's run, and step 16 is on the client's phone, so it walked straight past the one step
it was written for.

**A false alarm the check taught me something with:** matching the same key across locales flagged
`hasValue: "Ana"` — the client's own NAME, which the demo types — because "Ana" sits inside "Ana's
phone" and Slovenian declines it to "Anin telefon". The rule is therefore about the whole dictionary:
what makes the four real ones real is that the word is absent from the other language altogether.

**Still open, and much larger: §38.20.**

### 38.18 [x] BUG — Show me advanced the demo, or did not, depending on something invisible

**Reported 2026-08-30 (Simon):** *"show me behavior is inconsistent, should it advance always or
never?"* Measured before answering, on two kinds of step:

| the step's expectation when its card arrived | Show me | what happened |
| :-- | :-- | :-- |
| not yet true (the ordinary case) | performs it | **the card moved on** |
| already true — the screen the step before left behind | performs it | **the card sat still** |

So it was neither always nor never: it turned on whether the expectation happened to be true on
arrival, which nothing on screen shows. From the floor that reads as a button that sometimes works.

**Two rules, laid down three days apart, had come to contradict.** The guide's own source still
carried the first one verbatim:

> *"Show me demonstrates the step; it never moves the guide. Next is always the trainer's tap
> (reported 2026-08-23: 'sometimes show me advances demo step sometimes not')."*

…and §38.5 then made the card follow the app whenever a step completed in front of the viewer. Show
me completes a step in front of the viewer, so the second rule quietly overruled the first — except
where `enteredSatisfied` blocked it. The 2026-08-23 ruling was correct when NOTHING advanced by
itself; §38.5 made "never" the inconsistent choice, because doing the step yourself moved the card
and asking to be shown it did not.

**Ruled 2026-08-30: always.** One sentence, one function (`carryCardOn`): *a step completed while the
trainer is watching carries the card on, whether their own thumb did it or they asked to be shown.*

Two exceptions kept, each for its own reason and neither invisible:

- **the last step waits** — finishing is a decision, and a demo that closed itself on the final tap
  would take the thank-you card with it before anyone read it;
- **a step walked BACK to is re-explained, not advanced past** — carrying them on from there would
  skip the step they came back for.

The second needed a distinction the code did not have. A step whose expectation arrives true is
marked done by the very next poll, so by the time Show me is tapped, "already done" cannot tell a
step never seen from one walked back to. `enterStep` now records both facts separately: whether the
outcome held on arrival (`enteredSatisfied`, which the poll uses) and whether the trainer had already
been past it (`enteredDone`, which Show me uses).

Pinned by [test_walkthrough_show_me.py](tests/medium/test_walkthrough_show_me.py) over a three-step
tour built for exactly these cases: one that arrives untrue, one that arrives already true, and the
last one.

### 38.17 [x] BUG — the guide called the screen wrong while scrolling to it

Measured 2026-08-30 at story step 47 (the evening's session move), deep-linked on a 390×844 phone:

```
t+1.0s  busy rebuilding, every button greyed
t+4.1s  "This step needs a different screen — go back to the sessions board and start it again."
t+4.7s  the board scrolls, the control is ringed — the message gone
```

**The screen was right the whole time**, and the first diagnosis here was wrong: nothing was slow to
render and `READY_SETTLE_MS` was never the problem. The Tuesday & Thursday card was on the board from
the first paint, 650px above the fold. What was wrong is the question the guide asked about it.
`isCovered` clamped the control's centre into the viewport before asking `elementFromPoint` what was
drawn there — so a control above the fold answered with whatever sits at the top of the screen, the
app header. The guide then waited out its full 2500ms settle for a control nothing was going to
uncover, said the app was on the wrong screen, and only then ran the scroll that brings it into view.

**Out of view is not covered.** Two changes in
[walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js), and neither touches the settle:

1. `isCovered` asks about the control's real centre, and a centre outside the viewport is not
   covered. Bringing a control into view is the guide's own job — `enterStep` scrolls to it, and
   `moveTargetOutFromUnderPanel` scrolls it out from under the panel.
2. The stale-overlay sweep after a replay no longer asks `stepIsReady` first. It was leaning on the
   old reading: with the control honestly off screen, the sweep stopped running and left the ☰ menu
   the replayed theme step re-opens standing over the very card the ring was about to name.

The step now settles at **t+2.4s with no message at all**, 2.8s sooner than the complaint used to
arrive.

Pinned by [test_demo_story.py](tests/e2e/test_demo_story.py): the complaint line is watched with a
MutationObserver installed before the app boots — a message shown for half a second and withdrawn
again is exactly what a retrying assertion is built to miss — and the ☰ menu must be closed when the
control lands.

### 38.16 [x] CHANGE — the demo card is put away, not shut

**Reported 2026-08-30 (Simon):** *"demo cards exiting does not allow for return to demo, find a way
for the demo card to be collapsed only (just like message area is) that allows for the user to return
to demo"*, with the brainstorm *"do we get rid of the x button on the demo cards?"*

**Yes — and that is the fix.** The corner of the panel held a ✕ that called `stop()`: the most final
act available, wearing the glyph that everywhere else in this app means "close this box". A trainer
who taps it wants the card out of the way for a moment; what they got was the demo over, with no way
back — 49 steps in, that is the whole thing gone to one tap on a glyph that promised less.

- The corner now **parks** the guide, the way the message drawer parks itself: everything but the
  head goes, leaving a bar with the one line worth reading from across the room — which step, of how
  many, on whose phone. Tapping the bar anywhere brings the guide back.
- **It keeps running while parked.** A trainer who does the step by hand with the card out of the way
  comes back to a guide that moved on with them. That is what makes it a park rather than a pause,
  and why the bar keeps the step number.
- **Ending the demo is offered only from the parked bar** — one tap from a guide already out of the
  way, two from one you are reading, which is the right way round for the act with nothing after it.
  It is also the only place the ✕ appears now, on a bar that says DEMO, so it reads as "end the demo"
  rather than "close this card".

Pinned by [test_walkthrough_panel.py](tests/medium/test_walkthrough_panel.py): the bar keeps the step
number and drops the card, the instruction and the buttons; tapping it brings them back; the ✕ is
absent until parked and still ends the walkthrough; and the spotlight keeps following the control
while parked, which is the proof that the guide is still watching.

### 38.15 [x] BUG — a chapter's opening card left the panel nowhere to get out of the way

Found 2026-08-29 in the same hand-walk as §38.13, and confirmed by looking at the screen rather than
at a number: at **steps 23 and 30** — the openings of the programme and gym chapters — the guide's
panel sits **on top of the session card its own spotlight is ringing**. The ring is visible below the
panel's bottom edge with its top half covered.

Both are folded-card steps: the chapter's opening card rides on the first real step, so the panel is
carrying a paragraph AND an instruction. That makes it ~375px tall on an 844px screen, and
`keepPanelClearOf` has nowhere left to put it — moving to the top covers the top half of the board,
which is where the ringed card is. The pure card steps flagged by the same walk (11, 17, 18, 44, 49)
are **not** this: their target IS the card inside the panel, so an overlap is what they mean.

**Measured again on 2026-08-30, this time at both iPhone sizes**, after *"opravi še isti prehod dema
na iPhone resoluciji in popravi čudno postavljene kartice"*. The numbers are worse on the short
phone, and there was a third symptom nobody had reported:

| | iPhone 14 (390×844) | iPhone SE (375×667) |
| :-- | :-- | :-- |
| tallest panel | 47% of the screen | **63%** (story step 1) |
| covers the ringed control | steps 23, 30 | steps 12, 21 |
| **hangs off the screen** | — | step 9 |

**Fixed in two halves, because one alone cannot do it.**

1. **The panel is bounded** (45vh) and laid out as a column: the prose scrolls inside it, while the
   step number, the instruction and the buttons keep their own height and stay where a thumb expects
   them. The card's own `max-height: 32vh` is gone — it was a second number saying the same thing in
   different units, and on a short phone the two disagreed: the card obeyed its cap while the panel
   holding it came to 63% of the screen.
2. **When neither end of the screen clears the control, the control moves.** A cap cannot win the
   middle band: a control at half-height is under a panel docked low AND under the same panel docked
   high. The board scrolls and the panel's ends do not, so the guide scrolls the control out from
   under itself — ONCE per control, never on the poll (which asks four times a second and would be
   wrestling the thumb), and never while a demonstration is running, because the player scrolls the
   control into view itself and then reads its box to place the hand.

Pinned by [test_walkthrough_panel.py](tests/medium/test_walkthrough_panel.py) at both phone sizes,
with a card in the panel and the control in the middle band: the panel must not cover it, and must
not exceed 45% of the screen.

**After, walked again on both phones:** all 49 steps on each (from 23 before), tallest panel 45%,
nothing hanging off the screen. The walk still reports two chapter openings as covered — it samples
350ms after arriving, and what it catches is the repair in flight. Deep-linked to the same step and
measured at 0.4s, 1.2s, 2.5s and 4s, the overlap is **0 on both phones**; the panel had settled to
the far end of the screen from the control. A viewer sees the card land and the screen sort itself
out inside a second, which is the honest state of it: at rest it is clear, in transit it is not.

### 38.14 [x] CHANGE — the gate refuses to run with a filter reading its output

**Asked 2026-08-29 (Simon):** *"can we somehow prevent build checks to be run piped? to exit if pipe
is detected?"* — after four gate runs in one session went through `| tail`, which is what the rules
already forbid. A rule is the weakest way to hold anything (value 10), so it is now held by the gate.

**A TTY check cannot do it, and that is the design problem.** `sys.stdout.isatty()` is false for an
agent's shell whether or not anything was piped — a tool capturing output captures it the same way —
so a TTY test refuses the honest run and the careless one alike, and the only way past it would be a
flag, which is the same mistake with one more keystroke. **Measured**: a plain
`.venv/bin/python -m build lint` from this session's shell is not a TTY.

So the guard looks for what is actually wrong: a **truncating filter reading this process's output**,
found by walking `/proc` for siblings under the same shell — `cmd | tail` puts both under one parent.
`tail`, `head`, `grep`, `sed`, `awk`, `cut`, `wc`. Nothing else is refused: `| cat`, a pager and a
redirect to a file all keep every line. `CI` is exempt, which is an escape hatch for a machine.

**What piping costs, and why this is worth a guard:** the output IS the report. `| tail -20` keeps
the closing summary and throws away the stage lines above it — a check that was skipped, a warning
nobody failed on, a stage that suddenly takes four times as long as the header predicted. A green
summary read through a pipe is a green summary with the evidence removed.

### 38.13 [x] BUG — the evening chapter opened wherever the gym chapter had left the app

Found 2026-08-29 by walking the whole demo by hand at full motion, which is not what the e2e suite
does (it runs at reduced motion and asserts the story finishes). At **step 47 of 49** the guide greyed
out every button for about five seconds and then said *"This step needs a different screen — go back
to the sessions board and start it again"* — while the board was where it had just navigated.

**The cause is three lines away from the symptom.** A chapter's opening card declares the screen its
chapter happens on (`route: "/"`), and `foldCards` — which merges that card into the first real step,
so nobody has to tap Continue on a paragraph — copied `narrate` and **dropped everything else**. The
evening chapter therefore began wherever the gym chapter had left the app, which is deep inside the
plan editor, and by the third step the guide was trying to rebuild ground from an anchor two chapters
back. The other three chapters were fine only by luck: their first step happens to declare a route of
its own.

Fixed in the fold (the card's route rides along, unless the step names its own — the step is the more
specific of the two), and pinned by
[storyTour.test.mjs](tests/unit_js/modules/demo/storyTour.test.mjs) with the invariant behind it:
**every chapter played on the trainer's phone says which screen it starts on.** The client's chapter
is exempt and cannot be otherwise — it is a different page on a different device, reached by handing
the browser over rather than by routing.

### 38.12 [x] CHANGE — a reload no longer throws away a half-filled form

**Asked 2026-08-29 (Simon):** *"kadar se izpolnjujejo obrazci in se zgodi page reload poskrbi, da se
vsebina vnosnih polj ohrani"*. Measured on the client's intake page before writing anything: type a
name, an email and a phone number, reload, all three gone.

That form is the longest thing anyone is asked to fill in on their own phone, there is **no second
copy of it anywhere**, and a reload on a gym floor is not a rare accident — a locked phone, a browser
reclaiming memory, a mis-tap on the address bar.

**The conflict this had to resolve, and the ruling.** §26.1 promises the client's phone is written to
by nothing, and the page says so in as many words. Keeping a draft is a write. Ruled 2026-08-29
(Simon), presented with the trade: **sessionStorage, and the wording sharpened to match** — the draft
survives the reload and dies with the tab, so the promise's substance holds (close the page and it is
gone) while its old letter ("Nothing is saved on this phone") does not, and a promise that is nearly
true is worse than one that is exact. Both languages' copy, the module headers,
[uc8](use_cases/uc8_client_self_onboarding.md) and the catalog were changed in the same commit; the
e2e test that asserted the old promise now asserts the exact one, including that `sessionStorage`
holds the draft and nothing else.

**Consent is never restored.** A ticked consent box put back by a script is a person agreeing to
something without being asked, on a page they have just reloaded. `data-draft="never"` exists for
that field, on both the client's form and the trainer's.

**The trainer's client form too**, keyed by who is being edited: one form is "add a client" one
moment and "edit Jane" the next, and a draft that did not know the difference would spill half of
Jane's details into the next person's form. Cancel and ✕ mean "throw this away", so they do — only a
reload, the thing nobody chose, brings the form back.

### 38.11 [x] GAP — muted text sits ON the AA bar on the light palettes — fixed 2026-09-10

Found 2026-08-27 while measuring the demo's cards, and it is not about the demo. `--text-muted`
measured **4.76:1** on Daylight and **4.87:1** on Blossom (after §38.8 deepened Blossom's from
4.28:1) against those palettes' cards. The bar for body text is 4.5:1, so both passed — with so
little margin that **any** tinted surface put the text under it. That is exactly what happened to
the demo's message card at 4.28:1, and it would have happened again to the next component that
tints a card: warnings, selected rows, anything mixing an accent into `--card-bg`.

The dark palettes have room (Midnight 7.1:1, Nebula 7.2:1, Red 9.2:1), so this was a light-palette
question only. It was parked as "an app-wide colour decision, not a demo one" — deepening
`--text-muted` on Daylight and Blossom changes every muted line in the app.

**Fixed 2026-09-10, and the measurement that had been missing changed the answer.** The two
palettes were measured against the PAGE FIELD as well as the card, because a muted line does not
only sit on a card: **4.45:1 on Daylight and 4.46:1 on Blossom**, both already UNDER the 4.5:1 a
paragraph needs. So this was not a thin margin waiting for the next tint — it was a live failure
wherever muted text sat outside a card.

Both moved, each staying in its own hue: Daylight from slate-500 to **slate-600** (`#475569`,
7.58:1 on the card and 7.08:1 on the field) and Blossom's plum from `#96617f` to **`#7a4a64`**
(6.98:1 and 6.43:1). Both now carry the same room the dark palettes always had.

**The bar in the check is 6:1, not 4.5:1** ([test_theme_contrast.py](tests/unit/test_theme_contrast.py)):
the gap above 4.5 is what a component is allowed to spend on tinting a surface, which is the whole
of what went wrong here. It is a Stage 1 text test rather than a browser one because both surfaces
come from the theme's own tokens — `--bg-color` is a plain hex and `--card-bg` is a colour with an
alpha over it, so compositing them is arithmetic. A theme whose `--card-bg` stops being either
fails the check instead of quietly dropping out of it.

### 38.10 [x] CHANGE — one definition for every card the demo shows, and one word for a step

**Asked 2026-08-27 (Simon):** *"poenoti vse demo kartice, da bodo enotne, uporabi
polimorfizem/objektno orientirano abstrakcijo"*, and then *"poskrbi, da bo terminologija jasna:
nadomesti Beat z DemoNarratorCard ali ekvivalentom (sledi self-documenting code načelu)"* and
*"posodobi tudi prose da bo razumljiv, ne samo code"*.

**What they were.** A `kind` string interpolated into a class name
(`story-card--${step.narrate.kind}`), two stylesheet blocks that knew about two of those kinds, and
— for the guide's own "you have wandered off" state — no card at all, just the caption line
overwritten in place beside two buttons. Four things to read, three shapes, and a typo'd kind
produced a real box with no styling and no complaint.

**What they are.** `DemoNarratorCard` owns the shell, the three slots, the reading behaviour and the
one rule about the way out of the demo; a subclass declares only what makes its kind different:

- `ChapterNarratorCard` — the story's own narrating voice;
- `MessageNarratorCard` — words from another app, set as the `blockquote` they are (the italics said
  that to a reader and nothing at all to a screen reader);
- `PaperNarratorCard` — the paper track, whose texture is its declaration (§35.1);
- `OffTrackNarratorCard` — the guide's own card, which takes its words from the GUIDE because the
  step's instruction names a control that is not on screen, and refuses the way-out offer that only
  a closing card is entitled to make.

A kind with no class now draws nothing rather than an unstyled box, and
[demoNarratorCard.test.mjs](tests/unit_js/modules/demo/demoNarratorCard.test.mjs) walks the shipped
script demanding a class for every kind it names. That check lives in a test rather than in
`validateStory` because the import layering keeps a `modules/` registry out of `domain/`.

**The guide always has a card surface now**, whether or not a story is being told through it: the
long story mounts its own and hands it in (it narrates through the same one), and anything else — the
four-tap wedge — gets one from the overlay and has it torn down with the guide.

**Measured while unifying them**, by extending the contrast walk to every kind on every palette: the
message card's tint pushed muted text to 4.28:1 on Daylight and 4.37:1 on Blossom. A card that tints
itself owns its own text colours. The general fact behind it is recorded in §38.11.

**Terminology.** "Beat" was this codebase's private word for a step, used 345 times across code,
tests, docs, `TODO.md` and `CHANGELOG.md` while every identifier around it said `step`
(`tour.steps`, `stepIndex`, `currentWalkthroughStep`, "Step 4 of 49"). One thing, two words, and the
one a reader could not look up. Now: a **step** is a unit of the script, a **DemoNarratorCard** is
what narrates one, and the animation's own pauses are called waits — they were "beats" too, in a
different sense, which is exactly the confusion the word was causing. `replayBeats` → `replaySteps`,
`keepOwnBeat` → `keepOwnStep`, `_do_beat` → `_do_step`, `#story-card` → `#demo-narrator-card`.
Nine sites where "beats" is a verb were left alone by name rather than by guess.

### 38.9 [x] CHANGE — one story, one count, across both phones

**Asked 2026-08-27 (Simon):** *"zakaj je anin telefon demo števec 1/10, zakaj ne nadaljuje po demo
števcu z enakim slogom kot do sedaj"*. Walked and measured: the story went **step 10 of 41 → step 1
of 8 → step 19 of 41**, three numberings for one story, with nothing on screen saying why.

Nobody decided that. The counter counted the TOUR, and the story is played by two of them: the
client's chapter runs in its own boot on the intake page — no database, no seed, no terms modal,
because in the story it is a stranger's phone — so it has its own step list, and
`storyStepsFor` deliberately keeps those steps out of the trainer's run (the guide would otherwise
point at a form that is not on his screen). The script already held the opposite value one step
later: the hand back is written by step id rather than by chapter *"because the trainer's run is one
numbered sequence, and returning to 'chapter 3, step 1' would restart the count in the middle of a
story the viewer is four steps into"*. Going the other way had no such rule.

**A step's number is now its place in the STORY**, attached by `storyStepsFor` as `storyPosition`
and carried with the step — the one thing both boots can agree on while sharing no state, because it
is a property of the script and both of them have the script. Measured after: **10 of 49 → 11 of 49
→ 19 of 49**.

**Two numbers, deliberately** ([domain/walkthrough.js](src/domain/walkthrough.js)): what the viewer
READS is their place in the story; what the buttons OBEY is this run ending. Counting the story for
`isLastStep` would leave the client's page unable to finish, waiting for step 49 on a page that has
eight. The choice between them is a `TourNumbering` / `StoryNumbering` pair rather than a condition
at the point of use — a run whose steps know where they belong is counted by the story, everything
else counts itself, and the wedge tour is untouched.

A chapter link now opens at that chapter's place in the story (30 of 49), not at 1 of its own
length: someone handed one is joining a story part-way, and the count is what tells them so.

### 38.8 [x] BUG — the story card was painted with tokens this app has never had

**Reported 2026-08-27 (Simon):** *"2/8 kartica je slabo berljiva"* — the demo's card on the client's
phone. Measured before touching anything: **2.38:1** body text on the Midnight palette, against the
4.5:1 a paragraph needs. Title and caption were 17.29:1, which is why it read as one broken half.

[demoNarratorCard.css](src/modules/demo/demoNarratorCard.css) asked for `--text-primary`,
`--text-secondary`, `--bg-secondary` and `--bg-primary`. This app defines `--text-main`,
`--text-muted`, `--card-bg` and `--bg-color`. **An undefined custom property does not fail** — CSS
takes the fallback written beside it, and a fallback is a colour someone typed on the day they wrote
the line. So all five declarations froze at light-theme slate: right on Daylight by coincidence, and
dark-on-dark everywhere else — including the palette the story's own handover link **forces** on the
client's phone (`theme=midnight`), which is why this surfaced there and nowhere else.

**The check is the real fix** ([agent_tools/css_tokens.py](agent_tools/css_tokens.py), Stage 1): a
`var()` naming a property nobody writes fails the build. Its first run found **38 reads of 17
properties across 12 files** — the story card was one of them. The rest, all fixed here:

- `.notification-card` and the header's nav hover painted `var(--bg-surface)`, which is invalid at
  computed-value time and therefore **transparent** — feed cards had a border, a radius and no
  surface;
- seven `color: var(--text-color)` declarations that quietly did nothing (the property is inherited,
  so an invalid value inherits) — said out loud as `color: inherit`, since each sits on a fixed dark
  overlay where naming a theme token would be wrong on half the palettes;
- the backup warnings' frozen amber, now `--warning` mixed the way `index.css` already mixes
  `--danger`, which retired a `prefers-color-scheme` override that contradicted the trainer's own
  theme choice — and a byte-identical duplicate of the whole rule beside it;
- two dead middle links (`var(--card-bg, var(--bg-surface, #fff))`).

**The check's second half is palette parity**: the five themes are alternatives, not layers, so a
property only one of them defines is undefined for everyone on the other four. It holds today (33
properties × 5) and now cannot quietly stop holding.

**Found by the test that pins it**: `--text-muted` on Blossom was 4.28:1 — under AA for **every**
muted line in the app on that palette, not just this card. Deepened to `#96617f`, same hue.

Pinned by [test_demo_narrator_card.py](tests/medium/test_demo_narrator_card.py), which measures what an eye
gets — the card's four text elements against the surface actually behind them, on every palette the
app ships, read from the app rather than listed in the test.

### 38.7 [x] BUG — the tap's rings landed on the screen the tap had already opened

**Reported 2026-08-27 (Simon):** *"show me click ripple effect is sometimes too late as application
already loads new view when the effect fires. Try to animate the effect a bit before the actual
click."*

The click is what changes the screen, so the mark can only be spent BEFORE it. It was not: the
player waited 160ms — the time a finger takes to land — and then tapped, while the rings need most
of a second. The trailing two had not even been SENT when the view changed, so the whole set played
out over a screen it had never touched. What a viewer sees then is not a late effect; it is a tap on
the screen that just arrived.

**The pointer's mark and the real click are one gesture, so one module times both.** The ring's
duration moved out of the stylesheet into [demoPace.js](src/modules/demo/demoPace.js) — the module
that already owns every wait a step takes — and the wait before the tap IS that duration.
[demoHand.js](src/modules/demo/demoHand.js) stamps it onto the rings for the CSS to animate with,
and clears them on it. Three numbers that had to agree became one, which is the actual repair: the
old comment said "kept in sync by hand", and they were not.

By the time the app is told anything, a whole ring has expanded over the control being tapped and
the two behind it are past their peak. What crosses the view change is their tail — the echo of the
tap that left.

**Found while fixing it:** the delayed rings were painted at their full 26px until their turn came,
because the animation filled `forwards` only. Three rings appeared as one hard blob at the contact
point, snapped back to a third of their size, and only then rippled. Filling `both` starts each one
where its own animation starts. The per-ring fading was dead for the same reason and is now carried
inside the keyframes, so the group still reads as waves rather than as a target reticle.

Pinned at both tiers: [demoPace.test.mjs](tests/unit_js/modules/demo/demoPace.test.mjs) holds the
lead to the ring's own duration, and
[test_walkthrough_target.py](tests/medium/test_walkthrough_target.py) times the real player's
gesture on its own injected clock — the rings must be out and the first one finished before the
control is touched — and measures the rings at the instant of contact.

### 38.1 [x] BUG — "show me around" started the old four-tap tour, not the story

**Reported 2026-08-25 (Simon):** *"Message in notification area starts the old 1/4 demo not the new
1/31"*, and on the same walk *"same with guided walkthrough on the splash screen"*. Both offers built
their URL from one function, and that function still wrote `?demo=walkthrough` — the gym-floor wedge
that predates §35. Invisible in the code, because the story runs on the same guided panel: the only
symptom was the step counter saying 1 / 4. Fixed by making that builder write `?demo=story`, and by
pinning the VALUE in the tests, which had asserted only that some `?demo=` was set. The wedge keeps
its own link for the engine's tests; nothing in the app offers it.

### 38.6 [x] BUG — walking back left the card describing a screen the app was not showing

**Reported 2026-08-26 (Simon):** *"going back in demo from step 7 to step 4 does not clear/update the
intake address / number"*. Worse than stale: every one of those steps showed an EMPTY contact box,
under cards reading "type the number" and "type it over the number".

Being able to PERFORM a step is not the same as standing where it begins. The rebuild reopened the
invite dialog — which empties its field on every open, correctly, since it is the next person's
invitation — and then stopped, because the step's own control was now reachable and nothing looked
wrong. The two steps that fill that box were never replayed.

**A step's ground now includes what the step before it left on screen**, and the rebuild replays
until that holds rather than until the control is merely tappable.

**Two repairs, told apart, and that distinction is the whole cost of this fix.** Conflating them
froze the guide for tens of seconds at the programme chapter — resuming the trainer's run after the
client's phone made every step try to rebuild the arrive chapter, one unsatisfiable replay at a
time, with every button greyed out. So:

- a step that **cannot be performed** replays from its anchor and stops the moment its control is
  reachable, exactly as before;
- a step that **can** be performed but whose immediate history is wrong restores at most the last
  three taps, and never reports a problem — the trainer is looking at a card whose control is right
  there.

Only the step IMMEDIATELY before counts as ground. Most of what a story does is undone on purpose by
what comes later — the invite dialog is opened by one step and closed four steps on — so demanding
every earlier outcome would have the guide re-opening dialogs the story had deliberately shut.

### 38.5 [x] CHANGE — the card follows the app, and says so when the trainer goes exploring

**Decided 2026-08-26 (Simon)**, after reporting the same thing three ways in one session — a modal
closed by hand with the card still asking for it, and two "Show me does not fill the form" reports
where the filling was the NEXT step:

> *"make Show me fill in the fields and point to the action and execute it, when performs the
> expected action the card should advance, but if user explores on its own we should display a demo
> card with 2 buttons 'return to demo' and 'exit demo mode' (same as x on demo card)"*

**A step completed in front of the viewer carries the card on**, whoever completed it — the trainer's
own tap or Show me. This reverses the 2026-08-23 rule (only Next advances), which was itself a fix
for THREE rules: Show me advancing on some steps and not others. What makes one rule safe now is the
guard that did not exist then: **a step whose expectation was already true when its card appeared is
read, not performed**, and is never advanced past on its own. Narrated cards are exactly that — a
card is satisfied by being on screen — and so are steps the previous screen already answers, which
is what "skipped two steps in a blink" was. Never off the LAST step either: finishing is a decision,
and the thank-you card would have closed itself before anyone read it.

**Going exploring is not a fault, so it no longer looks like one.** When the step's control is not on
this screen at all — the trainer opened another view — the card says so and offers exactly two ways
on: *Back to the demo*, which is the same rebuild Back and Next already use, and *Stop the demo*,
which is the ✕. Deliberately weaker than the readiness test: a control merely scrolled out of view or
under a menu is still on the step's own screen, and the guide handles both by itself. It takes three
consecutive polls, because one reading is a view mid-render.

The e2e walkers gained ONE definition of "do the step on screen" (`_do_step`, `_card_moved_on`) —
they had four copies of Show-me-then-Next between them, and each copy was a place the rule could be
half-changed.

### 38.4 [x] CHANGE — the invitation text says who it is from and what happens to the data

**Wanted 2026-08-26 (Simon)**, from the message as it arrived on a phone: it should name the
trainer, say it is an invitation to fill the signup form, and carry the privacy statement.

The old opening — *"Fill in your details for our training"* — is exactly what a phishing text says,
and the trainer's name only appeared as a signature under the link. The name now leads, the app is
named with it, and the notice comes WITH the invitation rather than as small print on a form
somebody has already started filling in. It is [consentForm.js](src/modules/common/consentForm.js)'s
`clientPrivacyNoticeUrl` — the same shipped page the consent letter links to, in the language the
link opens in — so the two cannot drift.

An install that does not know the trainer's name sends an unsigned line rather than a message with a
gap in it. Around 300 characters with both links, so two or three SMS parts; the alternative is a
bare URL, which is the thing being fixed.

### 38.3 [x] BUG — the guide and the app's own modals — fixed 2026-08-26

**Reported 2026-08-25 (Simon)**, walking the story: *"step 3/41 does not ensure menu closed"*, then
*"send intake link does not count the steps right, back button keeps the app stuck in the modal, the
modal for intake sharing is hijacking the demo step card and the card is covering the controls"*.
Four symptoms, three causes, all of them at the seam where the guide meets a `<dialog>` or a
dropdown it opened itself.

- **A control behind an open modal counted as visible.** `showModal()` makes the rest of the page
  inert, but the buttons under it keep their boxes — so the step that closes the intake-invite
  dialog, which claimed only "the register button is visible", was satisfied the moment the dialog
  OPENED. The guide lit Next, the viewer walked on, and every step after it happened over a modal
  nobody had closed, with the whole app inert behind it: the miscounted steps and the Back that
  could not escape are both this. `probe` and `resolveTarget` now read reachable, not painted, and
  the step claims what it is about — the dialog gone.
- **The modal took the card over.** Every dialog here is a glass card, and `backdrop-filter` makes
  an element the containing block for `position: fixed` descendants — so the guide's full-screen
  frame collapsed onto the dialog the moment the panel was moved inside it (which is what keeps it
  tappable). The card drew INSIDE the modal, over the controls the step was asking for, and on the
  taller new-client form the scroll carried it off the top of the screen. The frame is measured back
  onto the viewport by hand, the dialog's own scroll included.
- **A rebuild could not undo, and a modal is the one state nothing else escapes.** Restoring a
  step's ground navigates and replays forward; neither reaches out of a modal, because everything
  outside it is inert. The rebuild now closes a modal the step does not live in, through the
  dialog's own ✕.
- **The ground a rebuild puts back has to be taken away again by the step that is already done.**
  The register opens from the ☰ menu and the tap that opens it closes the menu; walking back into
  that step re-opened the menu over the register, and the tap that would have closed it was skipped
  as redundant. Both the entry rebuild and Show me now re-fire a done step's action after a rebuild
  — after one, the app is by construction back BEFORE the step, so it is a replay rather than a
  double tap.

**The frame fix above was wrong, and the same evening said so twice more** — *"send intake link
modal has some really long scroll bars (should have none)"*, then *"send intake link modal does not
display demo card anymore, so I can't click show me or next or back"*. Stretching the guide's frame
back over the viewport from inside the dialog does not work in either direction: a dialog's UA
`overflow: auto` CLIPS what hangs off its top and left — which is where the card went — and what
hangs off its bottom becomes scrollable overflow, which is where the scrollbars came from. Living
outside the dialog is not available either: a popover in the top layer is still not clickable while
a modal is open (measured, not assumed).

So while the guide is inside a dialog, **the dialog is its screen**: the frame becomes the dialog's
own visible box, scroll offset included, and the card docks inside it — top or bottom by the same
rule that keeps it off the control everywhere else. The ring is placed in frame coordinates for the
same reason.

**And the lesson that cost the third report**: the geometry was verified by reading boxes, and a
clipped element still reports a perfectly good box. Where the question is "can a person see and tap
this", `elementFromPoint` at the control's own centre is the check; a rect is not.

A second Show me on the step that OPENS a modal also told the trainer it had failed — the step's own
success puts its control behind the dialog, and a precondition that reads "met" says nothing about
that. The rebuild is now forced whenever the step's own control cannot be reached.

**Back and forth, and the state nothing was checking** — *"back and forth for demo steps
surrounding sending intake link don't work"*, and, reproducing the menu report by hand, *"manually
open menu and click show me -> observe menu is not closed (no state enforcement)"*.

One cause. The guide asked only whether a step's declared `requires` held, and almost no step
declares any — `requires` was written for the states a selector cannot see. So nothing noticed that
a step's own CONTROL was gone or buried: walking Back out of the invite modal closes it, correctly,
and walking forward again then stepped through four steps whose controls were inside that closed
dialog, lighting Next on each because each was done on the first pass, over a screen where none of
it was happening. A dropped-down menu is the same defect a layer up — it covers, so the
demonstration is a hand tapping something the viewer cannot see.

**Being READY now means: preconditions hold, the control resolves, and nothing is drawn on top of
it** — asked with `elementFromPoint` at the control's own centre, since a rect cannot answer it. And
what the app has left lying on top is cleared before anything is replayed: a menu through the
control that opened it, a modal through its own ✕. Cheap repair first, replay only if that was not
the whole problem, because several steps exist to OPEN a menu and rebuilding through them re-opens
the very thing that was in the way.

**Three things this taught, all of them about instrumentation rather than the guide:**

- A geometry check passes on a clipped element, and a `requires` check passes on a buried one. Where
  the question is "can a person see and tap this", only a hit test answers it.
- **Waiting for a state to look right will take the first frame where it does.** Waiting for
  readiness before deciding whether to rebuild made the guide stop tearing the clipboard down on
  Back: an overlay mid-transition measures as gone for one frame. That decision is taken on one
  reading; only the complaint waits, and only when the rebuild actually moved the app.
- **The browser suites pin `Date.now()`**, so a `Date.now() + budget` deadline never arrives there.
  A settle loop written that way hung for ever, with every button on the panel greyed out. Count
  ticks.

**And the card is OUT of the modal** — *"step 4 of 41 card is still trapped in the modal view and
covers the interface, can you move the demo card outside of modal please?"*. What kept it in there
was the dialog's own UA `overflow: auto` clipping its children; lifting that lets the card draw at
the bottom of the SCREEN while staying a child of the dialog, which is the only thing that keeps it
tappable while the rest of the page is inert. Measured before it was built: it is then the topmost
element at its own centre and a real tap lands on it. Not for a dialog that needs its own scrolling
— the new-client form is taller than a phone, and a form that cannot scroll is worse to hand someone
than a card in the way — so that one keeps the card docked inside.

**A repeat Show me stopped blinking the dialog** — *"show me on step 3/41 seems to loop"*. The step
that opens the invite dialog puts its own control, the button on the page behind, out of reach by
succeeding. Asking to be shown it again therefore closed the dialog to get at that button, tapped
it, and opened the dialog afresh — the app blinking, and anything typed in the meantime gone, since
the dialog empties its field on every open. A step that is done and whose control its own success
removed has nothing left to demonstrate, so Show me does nothing there. Quietly: a complaint about a
step that worked is worse than silence.

Pinned by [tests/medium/test_walkthrough_modal.py](tests/medium/test_walkthrough_modal.py) (six
rules, one stub), the story's own back-and-forth walk across the invite dialog, and the menu-closed
assertion in its repeat-Show-me test.

### 38.2 [x] CHANGE — the demo-mode notice leads the whole feed

**Wanted 2026-08-25 (Simon):** *"DEMO mode message should be the 1st one on the message area, above
bookings and cancelations"*. It led the STORED messages already, but synthetic work items — pending
sessions, unscheduled plans — lead the feed by rule, and the demo seed generates those, so the card
was pushed below them. It is now the one exception to that rule, and the reason is not politeness:
every other item is a claim about the trainer's own gym, and reading one before knowing the data is
a fiction is reading it wrong. It is also the collapsed drawer's summary line and the only way back
to the guided demo and the cleanup screen.

---

### 39.1 [x] BUG — the story told the viewer four things that were not true

Verified against [en.js](src/i18n/en.js) and the shipped script; every one of them is a sentence, not
a mechanism.

| Card | Key | What it says | Why it is false |
| :-- | :-- | :-- | :-- |
| 1 | `story_arrive_open_body` | *"without writing down a single detail for them yourself"* | Cards 8 and 9 have the trainer typing Nik's name, and card 9 says so: *"you typed four words in total"*. |
| 10 | `story_handover_body` | *"Nothing ahead is a mock-up."* | Cards 11, 17 and 19 are drawn message screenshots. They are honest mock-ups; the sentence is what makes them dishonest. |
| 17 | `story_arrived_body` | *"Nothing went through a server on the way"* | A text message crosses an operator's servers. The true claim is narrower and better: nothing went through **ours**, and nothing was uploaded. |
| 6 | `story_step_arrive_close_invite` | *"Two of the three are on their way."* | *"where are they going? drop the poetics!"* — nobody is going anywhere; two invitations have been written. |

Simon on card 1: *"this is a lie and not needed sentence"*. The fix for each is the same shape — say
what happened, drop the flourish.

**Fixed 2026-08-31**, eight strings across [en.js](src/i18n/en.js) and [sl.js](src/i18n/sl.js):

- Card 1 names the three routes into the register instead of promising one that the chapter itself
  breaks two cards later.
- Card 10 says what is actually true of the crossing: *"The page is the real one; only her messages
  are drawn."* That is the stronger claim as well as the honest one — the drawn messages are the
  point of §35.1's rule, and the old sentence was disowning them.
- Card 17 keeps the claim worth making and drops the one that is not ours to make: *"no server of
  ours ever saw it"*.
- Card 6 says where the three of them stand, which is also what sets up card 7: *"Ana has her link
  and Maja has hers; Nik is still standing here."*

**No check can hold this.** Whether a sentence is true of the app is not a property a test can read,
and the two suites that walk the story pass either way. What the gate does hold is that both
dictionaries stay in step, so a sentence cannot be corrected in one language only.

---

### 39.2 [x] BUG — crossing to Ana's phone lost the language

**Reported at card 20:** *"zagotovo je Ana imela nekaj slovenskih besedil, če ne kar celega UI slo, ta
import pa pravi 'en'"*.

**Found, not guessed:** [storyTour.js](src/modules/demo/storyTour.js) hands the browser over with a
fixed address — `intake?demo=story&chapter=intake&theme=midnight` — and there is no `lang` in it.
Ana's page is a separate boot with no database (§35.1), so it has nothing to read a language from and
comes up in the default. A Slovenian viewer watches Ana fill in an English form, and the consent her
file records is the language she never chose.

The way back, `clients?demo=story&step=review-message`, dropped it too; the trainer's own side
survived only because his choice is in storage.

**Fixed 2026-08-31 at the crossing itself, not in the script.** The guide's Next puts the current
language on any address a step hands the browser to, unless that step names one of its own
([walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js)). Written there because the story
already had two crossings and forgot it on both: a rule at the seam cannot be forgotten by the third
one. The trainer's side reads it from `state.lang` at the moment of the crossing rather than at boot,
since the ☰ menu can change it mid-story; the client's side passes on the language it was given.

Pinned by [test_demo_story.py](tests/e2e/test_demo_story.py): walked in Slovenian to the handover,
the button Ana is about to tap says *Deli s trenerjem*.

**Found while writing that test, and worth more than the bug:** both story walkers asked "did the
card move on?" by matching `step N of` — English, so in every other language the answer was always
"yes", the walk stopped tapping Next and stalled where it stood. Every walk in the suite is English,
so nothing had ever noticed.

**And the first fix for it was worse**, which is the part worth keeping. Comparing
`inner_text()` against `not_to_have_text` looks language-agnostic and is not: the panel uppercases
that line in CSS, `inner_text()` returns what CSS made of it, and the assertion compares
`textContent` — so "is it still this text?" answered *no* before anything had happened, for every
step in every language. The walk stopped tapping Next altogether and the demo stage ran **41 minutes
without failing** before it was killed. A comment two files away had already written this down.

Both walkers now read the value the assertion reads, through a named helper rather than by hand, and
the rule is in [tests/INDEX.md](tests/INDEX.md) where the next person meets it before writing the
test rather than after.

---

### 39.3 [x] BUG — the consent Ana ticked named Google Drive

**Reported at card 16:** *"privacy consent naj ne omeni google drive-a, naj bo generičen "PT's private
cloud storage""*.

Verified: [en.js:265](src/i18n/en.js) has the client agreeing to a backup *"in my trainer's personal
Google Drive"*, and [sl.js:256](src/i18n/sl.js) says the same. The long consent letter
([consent/en.js](src/i18n/consent/en.js)) already says *"my personal cloud storage"* and names no
vendor — so the two texts a client reads disagree, and the shorter one is the one they actually tick.

Naming the vendor in the tick is also a promise the app cannot keep across a deployment that syncs
somewhere else, and it dates the consent record to a product decision rather than to a practice.

**Fixed 2026-08-31.** The tick now says *"my trainer's own private cloud storage"* / *"njegovi osebni
shrambi v oblaku"*, which is what the letter says.

**Nothing is concealed by it**, and that is what made it safe: the privacy notice the tick links to
names Google Drive in full, in both languages, and a processor's identity is what that notice is for.

**`CONSENT_FORM_VERSION` is deliberately NOT bumped.** It stamps the letter's substance — purposes,
recipients, rights, retention — and the letter has not changed. This makes its summary agree with it
instead of contradicting it, adds no recipient and narrows no right, so a bump would ask every client
already on the record to consent again to the promise they already made.

**Now checked**, in [consentForm.test.mjs](tests/unit_js/modules/common/consentForm.test.mjs): no
consent text a client ticks or signs may name a storage vendor, in any language. It is the same drift
the letters were already pinned against — *"Google Drive/iCloud" vs "personal cloud storage" across
three copies* — caught one artifact further out.

**The gate found the rule this replaces**, which is why it is written down twice.
[test_intake_form.py](tests/medium/test_intake_form.py) required the tick to disclose *"Drive"* by
name, from the 2026-08-23 full-disclosure ruling. That test now asks for the KIND of recipient —
`cloud storage` — and says why: what must be disclosed here is that a backup copy may leave the
trainer's device, and WHO holds it is what the linked notice is for.

---

### 39.6 [x] BUG — the clipboard says which session, and the chapter builds a programme

**Reported at cards 23–24:** *"the edit view is not clear which session and for whom that plan is, the
demo card text is useless"*, and *"demonstrate actually adding one circuit please, before just saying
done"*.

Two different faults, one screen.

**The app's — fixed 2026-08-31.** Measured before building, and the report was half right: *for whom*
was already there (*Editing Jane Doe*). *Which session* was not — `Group Strength & Conditioning`
appeared nowhere in the clipboard, in either mode, and the bar carried
`2026-09-01 11:30 playground outside` on one 22px line. Simon then found the rest of it at desktop
width — *"this one clips on desktop"* — where that line lost **90px** to an ellipsis. The repo's own
sweep passes that, correctly: an ellipsis is visible truncation, not the silent clipping
[overflow_scan](agent_tools/overflow_scan.py)'s invariant B hunts for.

**Two lines, and they cost nothing.** The bar is 76px tall because its buttons need a 44px touch row;
the title was using 25px of it. A 15px line over a 12px line comes to ~36px — still inside height
already spent. Measured at 390, 375 and the desktop column: same bar height, same actions width, no
overflow, sweep clean.

- **The clipboard** ([sessionTitleBar.js](src/modules/session/sessionTitleBar.js)): the session's name,
  then `day · time · gym`. `TODAY` replaces `2026-09-01`, which is what a person standing in the gym
  reads. The gym goes last because it is the least identifying thing on the bar and usually the same
  one every day — **the order is the design**: what gets cut is chosen, not left to chance.
- **The editor** ([activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js)): `✎ <session>`
  over `[day · time] <client>`. The ✎ shrinks from 22px to 12px and moves to the name it is about.
  **The word "Editing" is gone**, and that was decided by measurement rather than taste: rendered both
  ways, four things on one 12px line clip the client's name at 390 *and* 375, three clip nothing. The
  glyph says the mode and Done sits beside it.

**Then the buttons beside it gave the room back** (asked the same day: *"we probably should change
start session button from text to play glyph"*). Start and Done carry only their glyph now, with
their words in `aria-label` through `data-i18n-label`, and the touch target held at 44px by
`.btn-glyph` — a control a thumb cannot hit has not been made smaller, it has been made worse.

| | title block | session name clipped |
| :-- | --: | --: |
| clipboard 390, Start as words | 171px | 0 |
| clipboard 390, Start as glyph | **258px** | 0 |
| editor 375, Done as words | 191px | **27px** |
| editor 375, Done as glyph | **231px** | **0** |

So the editor's last truncation is gone at both phone sizes, and only a deliberately long name still
ellipsises — visible, with an affordance, which is the whole point of choosing the order.

**And the play glyph was never on screen at all.** `fa-circle-play` has been in that markup all
along. The button was wired through BOTH translation mechanisms at once: the selector table in
[domMappings.js](src/i18n/domMappings.js), which keeps an icon and appends the label after it, and a
`data-i18n` on the button itself, which calls `replaceChildren` and throws the icon away. They
disagreed on every boot and the second one won. Nothing noticed — the dictionaries were in parity,
the label was right in both languages, the button worked, and the glyph was simply absent.
[test_i18n_parity.py](tests/unit/test_i18n_parity.py) now refuses any element that carries
`data-i18n` while containing markup, which is the shape that loses it.

Pinned by [test_clipboard_title.py](tests/medium/test_clipboard_title.py) (the name leads, in the
larger type) and [test_session_deeplink.py](tests/e2e/test_session_deeplink.py) (the bar names the
session, and that name is not the part that gets cut).

**The story's — fixed 2026-08-31.** The chapter now builds something, which is what a chapter called
*The programme* is for.

- **It adds a circuit** (*"demonstrate actually adding one circuit please, before just saying done"*).
  A new step taps `+ Circuit` on the last insert bar, so the block lands at the end where a finisher
  belongs. Its expectation is a circuit with **no title yet**: the seeded plan's five circuits are all
  named, so an untitled one is proof this tap made it rather than a selector that was already true —
  measured before writing it, 5 circuits and 0 untitled before, 6 and 1 after. The story is 48 cards.
- **Both captions name their control**, the glyph and where it is, which neither did.
  `story_step_programme_editor` never said to tap anything at all; it now opens with *"Tap Edit plan —
  the ✎ row in the menu that just dropped down"*.
- **"Done — back to the room" is gone** (*"what room are we going back to?"*). It says what the tap
  does and why the screen changes: the plan is saved, and the session comes back with everybody in it,
  because the editor shows one person at a time and what follows is about all three.

---

### 39.10 [x] CHANGE — the intake-link button is named for the intent

**Reported at card 3:** *"would text button be better as invite customer instead send intake form?"*

`Send an intake link` named our mechanism; `Invite a client` names the trainer's intent. The register
already calls the other route `Add Client`, so the pair now reads as two ways to do one thing —
**Invite a client** / **Add Client**, *Povabi stranko* / *Dodaj stranko*.

**Fixed 2026-08-31**, and in three places rather than one, because a name is not only on the control:

- the button, and the dialog it opens — a dialog that opens under a different heading from the button
  that summoned it reads as having gone somewhere else;
- the story's own caption, which names the control the viewer has to find. It gained the glyph while
  it was being rewritten: *"the button with the share arrows just under the Clients heading"*.

---

### 39.12 [x] BUG — a deep-linked clipboard showed a placeholder instead of the session

**Reported 2026-08-31 (Simon)**, with the address he was standing on:
`/session/s04f2e3d/client/c1a9f0e2/circuit/z08a2b3c` — *"still no title visible"*.

Not §39.6. The bar was not merely missing the session's NAME; it was showing the word `Clipboard`,
the placeholder that ships in the static markup, on a screen that knew perfectly well it was holding
*Morning Conditioning, 09:00 - 10:00, city park*. Tapping a session in from the board wrote the bar
correctly; arriving at the same address from cold never did.

**Traced, not guessed.** A MutationObserver on the title showed it written exactly once — at
t+1357ms, when the overlay's markup renders — and never touched again. `renderSessionTitle` runs
before that markup exists, takes its `if (!el) return`, and nothing calls it a second time. Calling
it by hand on the stuck page produced the right line immediately.

**A deep link is the common case, not the exotic one**: a reload, a bookmark, a link sent to a
colleague and the app's own restored session all arrive that way.

**Fixed by deriving the title instead of stashing it.** Edit mode repurposes that bar, and it used to
keep the bar's HTML in a module variable and restore it verbatim on the way out — faithfully putting
back whatever was there, placeholder included, which is how one wrong render spread to every later
one. Leaving edit mode now re-derives from the session
([activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js)), and the module variable is
gone: a value that cannot be stale beats a rule about keeping it fresh.

Pinned by [test_session_deeplink.py](tests/e2e/test_session_deeplink.py) on both halves — a cold deep
link names the session, and so does the screen you get back after leaving the editor.

---

### 39.15 [x] BUG — the plan-fit meter looked like a button and explained itself only on hover

**Reported 2026-09-01 (Simon)**, from the editor route: *"there is a 65 / 60 min button like element
that I don't know what it does"*.

Two faults in one element, and he demonstrated the first by being unable to name it:

- **It was shaped like a control.** `border-radius: 999px`, a tint and padding, sitting in a toolbar
  immediately beside *Add from catalog*, which is a real button.
- **Its only explanation was a `title` attribute.** A phone has no hover, and this repository does not
  accept meaning that lives there — so on the device the app is built for, the element said `65 / 60
  min` and nothing else.

**And the state it exists to report was in the colour alone.**
[clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) already said it in a comment — *the
number a trainer scans for is not "45", it is "over"* — while encoding "over" as red text, which is
the half a colour-blind trainer cannot read and the half sunlight takes first.

**Fixed:** a clock glyph says the number is a duration, the word `over` / `čez` says the state, and
the pill is gone — plain text while the plan fits, with the tint kept only for the case that wants
attention. Pinned by [test_clipboard_editor.py](tests/medium/test_clipboard_editor.py), which had to
teach its mount about a booked slot: the meter is silent without one, because a planning programme
has no hour to fit into and inventing a constraint nobody set would be worse than saying nothing.

---

### 39.16 [x] CHANGE — the fit meter warns before the hour is gone, and costs a set by its reps

Two rulings from 2026-09-01, one screen apart, and they answer each other.

**"If the plan (not counting rests) exceeds 75% of time then it should mark warning and at 100%
should turn error."** There were two states, so a plan at 95% of its hour looked exactly like one at
30% — a trainer found out it was too long by going over. Three now, each saying its own WORD (`tight`
/ `na tesnem`, `over` / `čez`), because the state used to be in the colour alone: the half a
colour-blind trainer cannot read, and the half sunlight takes first.

**Judged on WORK, which is the part of the ruling worth keeping.** This module counts rest only where
a trainer wrote a rest ROW; the rest they take between sets without typing it in is invisible. So a
total that includes authored rests under-reads exactly the plans most likely to overrun, and the
quarter of the slot the threshold leaves free IS that unwritten rest. `planFitsSlot` now reports
`workSeconds` beside `netSeconds`, and the meter shows work — showing one number while colouring by
the other would leave an amber reading nobody could explain.

**"We should also find a way to account time for 20 bolgarian squats, or 5 pullups."** A flat 45s per
set said those cost the same. A set is now an overhead plus a cost per rep — 15s + 3s each:

| | before | now |
| :-- | --: | --: |
| 5 pull-ups | 45s | 30s |
| 10 bench press | 45s | 45s |
| 20 Bulgarian split squats | 45s | 75s |

Calibrated where it always was, so the common set did not move, and it still invents **no
per-movement table** — the thing this module refused for good reason. Reps are already in the plan.
A rep range costs its top; `Max`, a band label or an empty box fall back to the plain working set,
because costing them at nothing would make a plan of failure sets look free.

**Ruled 2026-09-01, and built:** *"keep the description 'X reps per arm', but when estimating
duration for a card or a cycle it should return calculated time back"*. The authored text is never
rewritten — the cost model reads it, and any per-side wording (`arm`, `leg`, `side`, `hand`, `foot`)
counts double. Side words are matched, never guessed: a movement that is unilateral without saying so
cannot be detected from a plan at all.

**And a set to failure costs the recovery it forces**, ruled the same day: *"max reps should probably
default to 3 or 5 min"*. Three, the conservative end — at five, four such sets eat a third of an hour
by themselves. `SECONDS_PER_MAX_SET` is the dial if it reads short on the floor. `Max`, `AMRAP` and
`F` are the tokens [repsAndLoad.js](src/domain/repsAndLoad.js) already recognises, so this needs no
new vocabulary.

**The arithmetic is a list of shapes now, not a chain of ifs** — asked for as *"in object oriented
manner"*. Each shape of work answers for its own cost (rest, timed, to failure, per side, counted,
uncounted) and the first whose test holds wins, so the order is the meaning and a new kind of work is
an entry rather than another branch to hold in your head.

Pinned by [planDuration.test.mjs](tests/unit_js/domain/planDuration.test.mjs) (nine new cases, from
the pull-up/squat asymmetry to rests being excluded from the judgement but kept in the total) and
[test_clipboard_editor.py](tests/medium/test_clipboard_editor.py) (the meter says `tight` before it
says `over`).

---

### 39.18 [x] FIX — the gate's worker split had gone stale, and it cost half the run

**Asked 2026-09-01 (Simon):** *"is there a way to support local development with code graphs, so that
tests unit, e-2-e and compliance get run on every edit premptivly to reduce wait times?"* — and the
first thing that question deserved was a look at where the time actually went.

**It went to one worker.** `demo_worker_count()` returned 1, derived on 2026-08-19 when the demo
suite was ~90s of call time against ~600s for the rest of e2e, with its own docstring asking to
*"re-derive this if either suite's call time moves substantially — the ratio, not the number, is what
matters"*. Both moved, in opposite directions: the demo suite grew with the story (48 cards, walked
twice over) while the rest of e2e got faster. Measured today: **demo 387s against e2e 192s** — the
ratio inverted, the stage's long pole running on a single worker while seven idled beside it.

The demo files alone finish in 163s at four workers. At three, inside the shared budget:

| | before | after |
| :-- | --: | --: |
| Demo & Walkthrough | 387s | **181s** |
| E2E Browser Tests | 192s | 162s |
| Stage 3 | 387s | **181s** |
| **whole gate** | **8m51s** | **4m44s** |

The two tasks now land within 20s of each other, which is the property the split exists for: the
stage costs as long as its slower half.

**[test_stage_tasks.py](tests/unit/test_stage_tasks.py) pinned the number, not the rule** — it
asserted `demo_worker_count() == 1`, so an honest re-derivation read as a regression. It now asserts
what must stay true: both tasks come out of ONE browser allowance, neither is starved, and the shares
add up. The number is free to follow the measurement, which is what its own docstring always asked.

**Re-check condition:** whenever either suite's wall time moves substantially — the same condition as
before, now with a test that does not fight it.

---

## 40. [x] Two workspaces — the trainer's own work, and a sandbox to learn in — shipped 2026-09-10

**Asked 2026-09-10 (Simon):** research whether demo data should be separated from the trainer's real
data, so that they can *"preklopi kadarkoli med svojim delovnim stanjem in stanjem za učenje in
experementiranje"* — switch at any time between their working state and a state for learning and
experimenting. Decided and **shipped the same day**; see [CHANGELOG](CHANGELOG.md). The subsections
below are kept as the record of what was decided and why — every one of them is now code.

Today the two are the same database, told apart by a `seededDemo` stamp on each record
([seedProvenance.js](src/data/seedProvenance.js)), and the only operation is one-way: the demo is
*removed* (§9.3, UC7). Three
things follow, and all three are what this section answers:

- **There is no way back.** A trainer who clears the demo cannot get it back without losing their own
  work, and one who has started working cannot put the demo aside.
- **Experimenting on real data has nowhere to happen.** Trying a plan change on a real client's
  programme means doing it to the client's programme.
- **The DEMO badge is a guess.** `isDemoOnlyStore(state)` holds only until the trainer's first real
  record, so the badge goes off while the demo is still all over the screen. With workspaces it is a
  fact, not a heuristic.

### 40.1 Two workspaces, and the line between shared and per-workspace

**Two, not many** (Simon): a working workspace and a sandbox. Any number would need naming, a list,
and a choice at boot; two keep the switch to one control.

One rule decides where every stored thing lives: **a fact about the person or the device is shared; a
fact about the data is per workspace.** That axis already exists in
[storageNamespace.js](src/data/storageNamespace.js) as `VERSION_SCOPED_KEYS` against
`ORIGIN_GLOBAL_KEYS` — it is renamed, not invented.

| Shared | Per workspace |
| :--- | :--- |
| The Drive OAuth grant, `librept_drive_connected`, the client id | `driveSync` meta — **the file id and the merge ancestor** |
| `librept_erasure_suppressions` — the erasure register | `backupHistory` meta |
| `trainerIdentity` — name, email, phone | `librept_active_session`, `librept_active_timers`, `librept_workout_setup_draft`, `librept_read_notifications` |
| Theme, accepted terms, chosen language | |

Two of those are not preferences:

**The `driveSync` ancestor MUST be per workspace.** A three-way merge is correct only if the ancestor
is exactly what Drive last saw ([syncMerge.js](src/data/syncMerge.js)). A sandbox that overwrote it
would silently corrupt the next merge of the trainer's real data. This is the only thing in the whole
design that can destroy work.

**The erasure register MUST be shared, as a union.** It is a grow-only set
([erasureSuppression.js](src/data/erasureSuppression.js)), so merging is a union — associative,
idempotent, no conflict. A promise made to a person must not be escapable by switching workspace, and
because every entry is a salted SHA-256 of an opaque record id, a shared list describes nobody.

### 40.2 A separate database, not a store-name prefix

**Ruled 2026-09-10 (Simon):** *"ločeni hrambi"* — separate storage.

**The prefix was considered and rejected** (Simon proposed it as the simpler build, with a guard in
the star write). Three facts decide against it:

1. **An IndexedDB object store can only be created inside `onupgradeneeded`.** A prefix doubles the
   stores at upgrade time and drags `databaseVersion()` ([indexedDb.js](src/data/indexedDb.js)) into a
   second axis, when it is deliberately derived from the highest numbered schema and nothing else. A
   second database changes none of that: `openDatabase({ schemas, name })` already takes `name` as an
   injected argument, because that is how tests have always run against a throwaway database.
2. **Resetting the sandbox is now a recurring operation (§40.4).** With its own database that is
   `deleteDatabase("librept_sandbox")` — one call that cannot reach the trainer's records. With a
   prefix it is deleting by name pattern *inside the database that holds them*.
3. **A guard in the star write is a rule; a separate database is the design.** The handle points at
   another database, so a sandbox write *cannot* touch real data — there is no check to forget and no
   exception to argue about for sync. Value 10.

Atomicity is not lost: a transaction cannot span databases, but the fan-out only ever writes within
one workspace. The prefix would win only for a cross-workspace transaction — "move this record into
my real data" — which is not wanted, and would be an export/import if it ever is.

### 40.3 Switching re-renders; it does not reload the page

**Ruled 2026-09-10 (Simon):** *"Si pa želim preklopa s ponovnim renderiranjem, ne pa reloadom
page-a"* — the switch re-renders, it does not reload. A reload costs the splash hold (`max(5s, boot)`),
the open view, the scroll position and any half-filled dialog, and it puts a service-worker fetch in
the path of a switch that may happen on the gym floor.

The app already replaces its whole database under a running UI — a backup restore
([backupRestore.js](src/modules/common/backupRestore.js)) and a Drive merge
([driveSyncService.js](src/data/driveSyncService.js)) both call `setState()` and re-render. So the
switch is four steps, three of which exist:

```js
async function switchWorkspace(name) {
  await flushWrites();         // writeQueue.js, already exported
  closeDb();                   // dbPromise = null
  setActiveWorkspace(name);    // one localStorage key
  setState(await loadState()); // the existing boot path
  renderEverything();          // §40.3a — does not exist yet
  navigateToPath("/");         // a route from the old workspace must not survive
}
```

**§40.3a `renderEverything()` is the only new piece, and it is a consolidation.** It exists three
times by halves today: the erasure path in [app.js](src/app.js) re-renders three things, the restore
and the Drive merge re-render others. One function used by all four callers removes that drift.

**Four boot-time captures have to become accessors.** `setupClientForms`, `setupRoutineForms`,
`setupExerciseForms` and `setupActiveSession` are each handed `state: getState()` once at boot, so
after any `setState()` they hold the previous object. Measured: **11 `state.` uses across the four
controllers**. This is a latent defect *today*, after every restore and every Drive merge — the switch
does not create it, it exposes it.

Measured cost of the whole switch:

| Work | Size |
| :--- | :--- |
| `workspace.js` — active workspace, database name, key suffix | ~40 lines, new |
| `stateStore`: workspace-scoped `getDb()` plus `switchWorkspace()` | ~30 lines |
| `renderEverything()` extracted, used at 4 call sites | ~30 lines, mostly moved |
| 4 controllers: `state` object → `getState` accessor | 11 references |
| Tinted header and the switch control (§40.5) | small |
| Sandbox lifecycle: seed, reset, staleness (§40.4) | ~80 lines |
| [dataWipe.js](src/data/dataWipe.js): enumerate both databases | small |
| Tests: unit_js for naming and staleness, e2e for isolation and switching | 2 files |

### 40.4 The sandbox holds today's seed, and says when it has gone stale

**Ruled (Simon):** the sandbox is filled exactly as the demo is filled today. No copy-of-real-data
variant for now.

Seeded sessions are generated relative to *now* ([sessions.js](src/data/sessions.js),
[sessionSeriesSeed.js](src/data/sessionSeriesSeed.js)), so a sandbox left for a month is an empty
board. **Ruled:** *"Najbolje, da zaznava zastarelost in predlagava data reset (z izgubo podatkov, če
se uporabnik strinja)"* — detect staleness and offer a reset, losing the sandbox's contents with the
trainer's agreement.

**Ruled 2026-09-10 (Simon):** *"zastarelost naredi v primeru več kot 12 ur — vprašaj ob vklopu demo
načina s cooldown timerjem 3 ure"* — stale after **12 hours**, asked when the sandbox is entered, and
a declined offer is not repeated for **3 hours**.

- The sandbox's `meta` store carries `seededAt`, and `staleOfferDeclinedAt` beside it.
- **Stale at 12 hours.** Not the week the seed spans: what the demo is *for* is a live and an upcoming
  session on today's board ([sessions.js](src/data/sessions.js)), and that is gone by the next
  morning, long before the week's edges are. A trainer who opens the sandbox in the morning and again
  the next day is asked, which is the intent.
- **The cooldown is 3 hours**, held in the sandbox's own `meta`. It survives declining, which is the
  case it exists for, and dies with the reset, which is the case where it means nothing.
- Offered **on entry**, not at boot — at boot it is a question about a workspace the trainer is not in.
- The reset is the first-entry path: delete the database, seed again.
- The dialog says what is lost — *what you did in the sandbox goes* — never "your data will be
  refreshed".

Both numbers are testable exactly, because the browser tiers run on a frozen wall clock
([tests/INDEX.md](tests/INDEX.md)): 11h59m does not ask, 12h01m does, and a decline followed by a
re-entry two hours later stays quiet.

### 40.5 What the trainer sees

**Agreed (Simon):** a tinted header, not only a badge. A badge read at arm's length, one-handed, mid
session, is not enough to stop someone logging a real set into the sandbox. The DEMO/PREVIEW badge
slot ([applicationHeader.js](src/modules/common/applicationHeader.js)) then states the workspace as a
fact and `isDemoOnlyStore()` stops being load-bearing.

**Ruled:** the sandbox survives a reload and a later visit. *"Da."* Otherwise it is a demo with a
timer, and nothing can be learned in it across two days.

### 40.6 Backup and Drive sync stay available inside the sandbox

**Ruled (Simon):** *"Backup in sync ni smiseln, je pa morda uporaben za e-2-e testing in za učenje. Se
mi zdi, da je tudi manj dela, če ohraniva polno funkcionalnost."* Keeping them is both the more useful
and the cheaper answer: **switching them off is a condition at every sync seam — a rule in ten places
— while isolating them is the per-workspace `driveSync` meta §40.1 already requires.**

The residual cost has to be stated rather than discovered: a sync from the sandbox creates a **second
file** in `appDataFolder` and spends the same OAuth grant. So the sandbox syncs to its own file name,
and the sync card in the sandbox says what it is syncing — otherwise a trainer reads "synced" and
believes their real work is safe.

A downloaded backup file is harmless, and "try a restore before doing it for real" is one of the
better things a sandbox offers.

### 40.7 The e2e suite must keep testing production, not the sandbox

**Simon's warning, and it lands:** *"Pozor e-2-e testi ne validirajo peskovnika temveč produkcijsko
kodo!"*

[conftest.py](tests/conftest.py) injects `?init=demo_data_load` for **every** test using the shared
`page` fixture. If demo data came to mean *the sandbox*, the whole e2e tier (231 tests) would quietly
start validating the sandbox instead of the app.

**The rule that prevents it, which is also less work: `?init=demo_data_load` keeps meaning "seed the
CURRENT workspace", which is the working one by default.** The sandbox is entered by a separate,
explicit act — a `?workspace=` parameter or the header control. The existing suite is then untouched,
and the sandbox gets its own e2e file covering exactly what is new: isolation, switching, staleness.

### 40.8 What this leaves of UC7

[uc7_demo_to_clean_database.md](use_cases/uc7_demo_to_clean_database.md) specifies removing demo
records from a mixed database. With two workspaces "clear the demo" is deleting a database, and the
fixpoint dependency planner is not needed for it — but it cannot simply retire:
[demoDataRemoval.js](src/data/demoDataRemoval.js) (172 lines) and
[seedProvenance.js](src/data/seedProvenance.js) (130 lines) are what a device whose database is
*already* mixed needs on the way onto this design. **UC7 becomes the one-time migration**, and the
document is rewritten as that rather than as a standing feature.

**Ruled 2026-09-10 (Simon):** a mixed install is **not split automatically**. Everything it holds
stays in the working workspace, and UC7's cleaner is offered once. Splitting by the stamp would tear a
demo client the trainer renamed and has been training for months away from the real records that
reference them — the exact case `planDemoRemoval`'s fixpoint exists to protect, and it cannot be
protected by a rule applied at boot without a trainer looking at it.

### 40.9 Both "show me around" offers now open the sandbox

**Ruled 2026-09-10 (Simon):** *"oba v demo način"* — the splash's demo-data offer and the guided
story/walkthrough both enter the sandbox rather than seeding the working one.

That is what makes the whole design honest: today the only way to see the product is to put sample
people into the database the trainer is about to work in.
[splashScreen.js](src/modules/splash/splashScreen.js)'s `guidedDemoUrl()` is the single builder behind
both offers, so both move together.

**The `?init=demo_data_load` parameter keeps its own meaning — seed the CURRENT workspace** (§40.7).
The two do not collide: the buttons change where they lead, the parameter does not change what it
does, and [conftest.py](tests/conftest.py)'s injection keeps every existing e2e test in the working
workspace against production paths. The demo and walkthrough tests move into the sandbox, which
is where they belong.

### 40.10 Demo data can never enter the working workspace

**Ruled 2026-09-10 (Simon):** *"restore demo podatkov ne sme biti mogoč v produkcijsko bazo"* — a
restore must not be able to put demo data into the trainer's own database. This overrides the earlier
working assumption that a restore simply lands wherever the trainer happens to be.

**One exact test, not two.** The backup file **declares the workspace it was written in**, and a file
declaring the sandbox is refused whole on the way into the working one. A restore that silently
landed nothing would be a failure reported as a success, so it is a refusal with a reason, not a
filter.

**Ruled 2026-09-10 (Simon):** *"produkcijski backup naj ne ločuje (starih) demo vnosov, install base
je premajhen, da bi to skrbela"* — a file written before this ships carries no declaration, and its
seeded records ride back in untouched. This drops the per-record filter that was proposed here.

It costs nothing real. Such a file came from a mixed database, so restoring it returns exactly the
database the trainer already had — no loss and no surprise — and the rule that matters holds anyway:
nothing can flow *out of the sandbox* into the working one, because the sandbox only
ever writes declared files. The heuristic half of [seedProvenance.js](src/data/seedProvenance.js) (the
committed seed id set) is therefore not needed on this path at all; it stays only for UC7's one-time
cleaner (§40.8).

Into the sandbox nothing is refused: it is the workspace where sample data belongs.

Drive sync needs no separate rule. The `driveSync` file id and ancestor are per workspace (§40.1), so
the working workspace never reads the sandbox's file — the isolation is the same one that keeps
the merge ancestor correct.

### 40.11 A running timer keeps running, and every timer knows which workspace it belongs to

The case: a trainer with a session running steps into the sandbox during a rest period — the only free
moment a session has, and exactly when a rest timer is counting down.

**Nothing is lost by leaving.** A rest timer computes its remaining time from an absolute `endTime`
([exerciseAndRestTimer.js](src/modules/clipboard/exerciseAndRestTimer.js)) and the live session is a
per-workspace key ([sessionCache.js](src/data/sessionCache.js)), so time spent away is accounted for
on return. What would be lost is the **beep**: the module holds its timers in memory, the switch has
to stop the sandbox from showing the working workspace's timers, and tearing the module down stops the
tick that beeps. Same class of defect as §40.3's four boot-time captures — module state silently bound
to one workspace.

**Ruled 2026-09-10 (Simon):** the switch does not stop the clocks. **Every timer carries a mark
saying which workspace it belongs to**, and the mark decides who hears it:

| Where the trainer is | A working-workspace timer expires | A sandbox timer expires |
| :--- | :--- | :--- |
| Working workspace | beeps | **expires silently** |
| Sandbox | **beeps, and says which one** | beeps |

The asymmetry is the point, and it is one sentence: **real work is never missed, and the demonstration
never intrudes on real work.**

**A working-workspace timer expiring while the trainer is in the sandbox names itself and offers two
ways on** — *return to the working workspace*, or *ignore and discard the expired timer*. Naming it
is possible today: a timer already carries `clientName`, `label` and `sessionId`, so the card can say
whose rest is over rather than that some timer somewhere finished.

Neither answer interrupts anything else: nothing is blocked, and a trainer who chooses to stay in the
sandbox stays there.

Implementation notes this leaves:

- The mark is **stamped when the timer is loaded, from the store it came out of** — it is not a second
  place where the truth lives.
- The in-memory map is keyed by `clientId` today, so it becomes keyed by workspace and client. Two
  workspaces cannot collide on an id, but a map that cannot express the pair would drop one of them.
- Ticking is global, the display is filtered by workspace, and §40.3's `switchWorkspace()` therefore
  must **not** tear the timer module down.

### 40.12 It is called the sandbox — in the code, in the docs, and on screen

**Ruled 2026-09-10 (Simon):** *"preklopiva na sandbox povsod"* — one word everywhere, against the
recommendation of a split (screen word "demo", code word `sandbox`) made in the same session. One
word means nothing has to be translated between what we say and what the trainer reads, and it names
the **place** rather than its current **contents** — which is what survives if the sandbox is ever
filled with something other than the demo seed.

`sandbox` is therefore the term in module names, the database name (`librept_sandbox`), storage keys,
i18n keys, this section and the rewritten UC7.

**On screen in Slovenian it is `peskovnik`** (Simon, 2026-09-10) — `sandbox` in `en`, `peskovnik` in
`sl`, one i18n key behind both.

### 40.13 What was assumed while building it

Decisions taken during implementation that no ruling covered. Each is cheap to reverse; each is
written here rather than only in a comment, because a decision nobody was asked about is the kind
that gets found by accident.

**Storage**

1. **The working workspace keeps every name it already has** — the `librept` database, unsuffixed
   keys. So the split arrived as a no-op for existing installs: nothing to migrate, and a sandbox
   nobody has opened does not exist as a database at all.
2. **`librept_workspace` — the pointer saying which workspace is open — belongs to neither of them.**
   It cannot live inside a workspace: it is what selects one. Absent means the working workspace, so
   an unreadable or unknown value fails towards the trainer's own data.
3. **A sandbox reset keeps what belongs to the person.** It deletes the sandbox database and the keys
   suffixed to it; the theme, the language, the accepted terms and the trainer's own name are
   untouched, because they were never the sandbox's.
4. **`resetLibrePTData` deletes both databases.** It sweeps every `librept*` key already, so leaving
   the sandbox database standing would leave a database nothing points at — after telling the trainer
   everything was removed.
4a. **The support wipe (§31) takes the sandbox with the device's own bookkeeping, not as a row of its
   own.** Both databases name their stores identically — `schema4` is in each — so two identical rows
   would ask somebody on a support call to tell them apart, and the sandbox holds sample data only,
   which is nothing worth keeping back. **Ruled 2026-09-10 (Simon):** *"data wipe naj ostane
   totalen"* — the offer of a separate, deselectable sandbox row was declined; a wipe removes
   everything this device holds.

**The language, which was a defect the tests found**

5. **`lang` moved to an origin-global key** (`librept_lang`), joining the theme and the accepted
   terms. It had lived only in each database's meta store — invisible while there was one database,
   and wrong the moment there were two: entering the sandbox produced a store with no language in it,
   and the splash asked a trainer who had answered that question already. The meta copy is still
   written and is still read when the shared key is absent, which carries an install that chose its
   language before this existed.
6. **A save carrying no language never clears that key.** A store that was never asked is not an
   answer being withdrawn — and the sandbox's very first save is exactly such a store.

**Behaviour**

7. ~~The switch resets the route to the dashboard.~~ **Overruled 2026-09-10 (Simon):** *"vrnitev,
   bi bila idelna, da se vrne na prejšnji view (primer clipboard, uporabnik in aktivna vaja)"* —
   coming back returns to the view that was left, the live session included
   ([lastRoute.js](src/data/lastRoute.js)). Stepping out to look something up and landing on the
   dashboard costs three taps to find the session, the client and the exercise again, on a gym floor
   with somebody waiting. A remembered path is used only if the router still recognises it: what it
   names may have been deleted in the meantime, or rebuilt under a sandbox reset. The live session is
   re-recovered for the workspace being entered, and the one held in memory is dropped first — its
   cache key is per workspace, so without that the sandbox would keep showing the trainer's real
   session on the clipboard bar.
8. **A restore lands in the workspace the trainer is in**, and only sandbox → working is refused.
9. **The staleness offer is a real dialog, not a `confirm()`**, and dismissing it counts as declining
   — a question closed is not a question answered yes, so the cooldown starts either way.
10. **A sandbox of unknown age is never stale**, and a clock that moved backwards never makes one
    stale. Both would offer to delete somebody's work on no evidence.
11. **The sandbox is seeded on first entry only** — when it holds nothing. It is never re-seeded
    behind the trainer; §40.4's offer is the only other way it gets filled.
12. **The timer rule, stated as one line in the code:** the trainer's own work beeps wherever they
    are; the sandbox beeps only in the sandbox. The card names the client and what was being timed,
    and "ignore" discards that timer rather than silencing all of them.
13. **The sandbox syncs to its own Drive file** (`librept_sandbox_sync.json`), and the sync card says
    so while the trainer is in there. The erasure register stays ONE file, shared, per §40.1.

**Two things the estimate in §40.3 got wrong**, both worth remembering:

- The four boot-time state captures were real and small, exactly as measured — but `appDeps` was a
  fifth, reaching ten more call sites, and it was fixed at the seam instead: `deps.state` is now a
  live getter, so nothing downstream changed.
- Nothing in the estimate predicted the language defect. It was not introduced by this work; it was
  **exposed** by it, which is the ordinary way a hidden coupling surfaces.

---

### 42.1 [x] Expand all — shipped 2026-09-10

See [CHANGELOG](CHANGELOG.md). The ⋯ menu opens every card at once, and the item says which direction
it goes. Two decisions in it are worth keeping:

- **An expanded card that is not in focus draws what the focused card draws and BEHAVES like a
  collapsed one.** Its controls are removed from the DOM rather than disabled — twelve open cards
  with live Too Easy / Too Hard / timer buttons put a mis-tap one thumb-width from logging against
  the wrong exercise, and a control that is drawn but inert is worse than either. A tap focuses the
  card, exactly as a collapsed one's does.
  **Half superseded by §42.3:** there is no second template to draw and nothing to strip any more —
  every card is one design and focus ADDS its controls. What survives is the promise: a card that is
  not in focus carries nothing to tap.
- **Expansion and focus are separate states.** Focus is a fact about the session — it keeps the tint,
  the ring, and what a card may do. Expansion only decides how much is drawn.

Two defects the first version had, both found by the test rather than by reading: stripping the two
named containers missed the rest card's Start button, which sits in neither (it strips every button
and input now), and the rest card hardcoded an "In Focus" badge that was only true while its template
was drawn for the focused card alone.

---

### 42.2 [x] Measured: why expanding alone does not finish the job — closed 2026-09-10

A phone at 390×844, the deck stub with a four-item plan:

| | Height |
| :--- | ---: |
| Focused card | **172px** — top row 32, name 17, stats block 52, action row 39, padding 16 |
| Expanded, not in focus | **133px** — the same without the action row |
| Collapsed row in the stack | **37px** |

The deck's own visible area on that phone is roughly 500px once the header, the title bar and the
clipboard bar are out. So expanding gives **under four cards on screen** where the stack gives
eleven. For a six-item plan the trainer still scrolls — the control answers "show me everything" and
not yet "let me see it".

---

### 42.3 [x] One card design, opened up — ruled and shipped 2026-09-10

**Ruled (Simon):** *"fix the card redesign, expanding the card should just insert elements into
existing exercise design, not load a completely different one"* — and, asked whether that also
governs the card in FOCUS: yes, all three states are one design.

What was there before: every card type carried two full templates, and the deck swapped one for the
other. The collapsed exercise row said `S4 × R6 × 60kg` on one line; the focused card threw that line
away and said the same three numbers again as a block of big tiles 52px further down. So a tap
replaced what the trainer was reading instead of opening it — and the two templates had to be kept in
agreement by hand, which is how the status tag ended up in a different place in each (§42.5).

**Now:** `renderCard` draws the one design, for every state. `addFocusElements` ADDS to it — the ⏱ at
the end of the head row, the Too Easy / Too Hard / Feedback row, a rest's Start, a circuit's feedback
trio per movement and its round button, a past card's set-by-set panel. The focused card is bigger
only where being read at arm's length needs it: the name, the target line and a circuit's movements
grow, and nothing moves.

**The safety rule became structural.** A card that is not in focus carries nothing to tap because no
control was ever drawn, not because a `stripControls` pass removed every button and field afterwards.
That pass is gone, and with it the class of bug it had already produced twice (a Start button in
neither named container; a live number field on a card being read).

**What "expand all" now does, stated plainly:** it takes the cards out of the stack. Collapsed cards
slide up over each other and only their top row peeks; an expanded card lays flat and is fully
visible. It no longer draws MORE of a card — there is no more to draw — which is the honest version
of what the trainer asked for: *see the whole session*.

**Measured on a phone (390×844), the deck stub with a four-item plan** — the same setup §42.2
measured before the change:

| | Before | After |
| :--- | ---: | ---: |
| Focused card | 172px | **96px** |
| Expanded, not in focus | 133px | **39px** |
| Collapsed row in the stack | 37px | 37px |

An expanded card is now the collapsed row laid flat, 2px taller only because it stops being scaled
back into the stack. With its 8px gap that is a 47px pitch: **ten expanded cards** in the deck's
~500px of visible area on that phone, against under four before.

**The savings §42.3 estimated, taken:** folding the stats block into the target line (~35px) and the
top row into the name line (~32px, taken by §42.5).

What stayed open is the card chrome question — see §42.13.

---

### 42.4 [x] Expand all is a SETTING — shipped 2026-09-10, halved by §42.14

**Ruled 2026-09-10 (Simon):** *"expand all cards should be a permanent setting, and should be
reversable with collapse all cards (ločeni nastavitvi za termine in za klipboard kartice)"*.

Two corrections to what §42.1 shipped, both now in (`data/displayPrefs.js`, the module [§45.16](TODO.md) later retired):

1. **It persists.** The flag was written onto the live session, so it died with that session — a
   trainer who wants the whole plan open wants it open tonight as well. It sits beside the theme now:
   plain unscoped `localStorage`, shared by both workspaces, because it is a fact about the PERSON
   and not about either workspace's data (§40.1).
2. **Two settings, not one.** The day's session cards and the clipboard's exercise cards are read in
   different postures — scanning tomorrow at a desk wants every session card open, mid-set wants the
   clipboard down to the card being worked. One switch would make each answer wrong half the time.

Both default OFF: a preference that changes how the app looks before anybody asks for it is a
surprise, not a default.

**Where each control lives: beside the cards it changes.** The clipboard's is in the ⋯ session menu;
the day's is beside Today and the date jump, wearing the same chevron pair the cards' own controls
wear. A setting two taps away from the thing it changes is a setting nobody finds — which is the
argument against the other candidate home, a "display" section in the ☰ app menu.

**The per-card control still works in both directions.** A session card's chevron is now an EXCEPTION
to the setting rather than a list of open cards, so it opens or closes whichever way the setting
points. Exceptions are cleared when the setting itself flips: a fresh default with yesterday's
exceptions on top is neither answer.

**Amended 2026-09-11 by §42.14:** the clipboard's half of this is removed. Everything above still
holds for the day's session cards, which is the one setting left.

---

### 42.13 [x] Should an expanded card keep its border and shadow? — dissolved 2026-09-11

Left open by §42.3. A card that is not in focus is now one line, and ten of them fit the phone. If
the expanded tier also dropped the card chrome — border, radius, shadow — it would save perhaps
another 10px each and the deck would read as a table, which is what a trainer scanning a whole
session is doing. It is also the point where the deck stops looking like the app.

**What would settle it:** show the trainer who reported the legibility both, on their own phone.
Nothing in the code has to be decided first — the chrome is three lines in
[exerciseDeckOfCards.css](src/modules/clipboard/exerciseDeckOfCards.css)'s `.expanded` rule.

**Never answered, and no longer askable.** §42.14 removed the expanded tier the same day: there is no
state between the stack and the card in focus for the chrome question to be about. If the deck is
ever asked to read as a table again, the question comes back with it.

---

### 42.14 [x] The clipboard's expand-all is gone — removed 2026-09-11

**Ruled (Simon):** *"da, odpri vse je sedaj redundantno, lahko odstraniva"* — after §42.3 made every
deck card one design.

The control answered "let me see the whole session". Once a card said everything it had on its own
row, it had nothing left to open: what it still did was stop the cards overlapping. **Measured on a
phone (390×844), a plan with a three-movement circuit:** the circuit card's content needs 80px and
the stack leaves it 85px; a rest needs 29px and is left 31px. Nothing was clipped, so the setting
was buying a layout preference, not legibility — and it cost a menu item, a stored setting, a
deck-wide render flag, a CSS state and a third card state to reason about.

**What replaces it is a check, not a promise.** The deck's legibility test used to assert that a
collapsed card's FIRST LINE clears the card above it; it now asserts that ALL of its content does
([test_clipboard_deck_legibility.py](tests/medium/test_clipboard_deck_legibility.py)). That is the
guard the removed setting was standing in for: with no way to open the cards, the stack has to be
readable, and the margin is thin enough (2px on a one-line card) that anything which grows a card
will say so.

**What came off:** the ⋯ menu item and its label repaint, `clipboardCardsExpanded` in
`data/displayPrefs.js` — retired by [§45.16](TODO.md) — with its `librept_expand_clipboard` key, the `expandAll`
flag threaded to every card, `DeckCard.isExpanded`, and the `.expanded` layout rules. A card is now
either the one being worked or one of the rest.

**One word changed with it.** `collapse_all` read *"Back to the deck"* — deck language, written for
the clipboard. The day's session cards are the only caller left and they are not a deck, so it says
*"Collapse all cards"* / *"Skrči vse kartice"*.

**Left standing:** the day's session-card setting (§42.4). Those cards genuinely hide something —
participants and programme — so opening them all still opens something.

---

### 42.8 [x] No badge on the card in focus — shipped 2026-09-10

**Ruled (Simon):** *"do not create inFocus tag for active excersize (i like the background and border
highlight on midnight)"*. The tint and the border already say which card it is, in every theme, and a
word repeating what the colour has said costs a slot in the title row. **Completed** and **Upcoming**
stay: nothing else on the card says those.

---

### 42.10 [x] The sandbox says where its own exit is — shipped 2026-09-10

**Asked, then ruled, 2026-09-10 (Simon):** *"kaj pa je hitra vrnitev iz peskovnika v produkcijo?"* —
and, after the options were laid out: *"ne, imaš prav, uporaba menija je dovolj, bi pa bilo treba to
uporabniku povedati, da bo vedel"*.

Two taps through the ☰ menu is the way out, and it stays that way. A one-tap control was considered
and declined: the badge beside it is the only route to the data-loss notice, and a mode switch hidden
behind a tap on the logo is a surprise. What was missing was not a control but a sentence.

**The feed's leading card says it**, because that is the card a trainer in the sandbox is already
reading — it is what tells them none of this is real, and it is the collapsed drawer's summary line.
In the sandbox it now says what the sandbox is, that nothing done in there can reach their own data,
and how to get back: **the menu ☰ at the top right, and the item by its name**, per the standing rule
that a step naming an action names the control.

The stored card's other half goes with it: **"Clear demo data" is not offered in the sandbox.** It was
written for a database where sample records sat among real ones; in here it would empty the very
thing the trainer came to look at.

---

### 42.11 [x] The expand-all menu item wears the app's own chevron — fixed 2026-09-10

CI caught what this machine could not: `fa-up-right-and-down-left-from-center`, added for the
clipboard's expand-all item, **drew a different shape on the runner than in the baseline recorded
here** — 141 of 256 cells apart, while all 90 other icons matched exactly.

The gap that let it through: **`agent_tools/icon_render.py` checks that a class maps to a codepoint in
the shipped CSS, not that the vendored subset FONT contains that glyph.** A codepoint with no glyph in
the subset falls back to whatever the machine has, which is a different outline on a runner than on a
laptop — and recording a baseline from here baked this machine's fallback in as the truth.

The item now wears `fa-chevron-down`/`fa-chevron-up`, the same pair the day's control and every
session card's own control already use: one idea, one glyph, and a shape whose drawing is already
recorded. The baseline is back to 90 icons, with the one line removed and nothing else changed —
which is itself the evidence that only that glyph was ever in question.

**Open:** whether `--baseline` should refuse to record a glyph the subset does not contain, rather
than recording a fallback. The blank check covers a glyph that draws nothing; it does not cover one
that draws something else.

### 42.12 [x] In the sandbox the badge is a marker, not a link — shipped 2026-09-10

**Reported, then ruled, 2026-09-10 (Simon):** *"klik na peskovnik značko vodi na neobstoječo stran"*
· *"odstrani povezavo iz značke"*.

The 404 could not be reproduced: the badge's `./preview.html` resolves through the shipped `<base>`
to `/LibrePT/preview.html`, which answers 200 on the dev server and on the published site, and the
page has existed since 2026-08-13. What the report exposed is a better question than the one it
asked — **whether that destination belongs to the sandbox at all.**

It does not. The notice explains that a preview build can lose the trainer's data; a workspace that
holds nothing but sample data is the one place where that warning is beside the point, and the badge
is the first thing a trainer taps when they want to know what they are looking at. Since §42.10 that
explanation is one tap away in the feed's leading card, in words about the sandbox.

So in the sandbox the badge carries no `href` and no `target`, and announces itself as a status. An
`<a>` without an href is neither focusable nor clickable, which is the point: it stops offering what
it cannot honour, rather than pointing somewhere else. The link is put back on the way out, because
one element serves every state — pinned by a test that switches in and out.

**Unchanged in the other two states.** PREVIEW and DEMO keep the link: the build is still a preview,
and that page is still the only place the risk is explained without signal.

---

#### 45.16 [x] The session card, read off a screenshot — shipped 2026-09-11

**Reported (Simon), with a picture:** the *Zaključeno* badge takes room in the heading row, the card
carries a block of empty space, and the programme name is written twice.

**Three complaints, one cause.** The heading row wraps. With the time, the title, the badge and two
icon buttons in it, the EDIT button was pushed onto a line of its own — and that line, otherwise
empty, is the "empty space". So the badge was not merely taking room; it was breaking the row.

**What the card lost, and why each was costing more than it said:**

- **The participants' NAMES.** They were the only thing the card hid, which is the whole reason an
  expand control existed. A name is also the slowest thing on the card to read and the least useful
  at a glance: the count says whether the session is full, and [§45.6](TODO.md)'s client filter now
  answers "which sessions is Ana in" far better than reading every card on the board. An injury is
  NOT dropped — it becomes ONE mark on the card, because that is a warning rather than a detail.
- **The programme name when it repeats the title.** A session usually takes its name from its
  programme, so the repeat is the common case. Compared trimmed and case-insensitively: what matters
  is what a reader sees twice.
- **The completed badge, out of the heading row** and into the status bar at the foot, which already
  exists on a finished session and already reports how long it ran.
- **The expand chevron and the expand-all control**, which now have nothing left to open.

**So `data/displayPrefs.js` is gone.** It held exactly one setting, the session cards' expand-all —
the clipboard's copy having been removed by §42.14 for the same reason, in the same words. A module
whose only reason to exist has been retired is deleted rather than left empty. Its two localStorage
KEYS stay listed in `storageNamespace.js`: an install that still holds one must go on being read and
wiped unscoped, and moving a leftover value into a workspace scope would be a migration performed by
accident.

**§42.4 is thereby reversed, seven weeks after it shipped.** It was right when a card hid something.

### 46.1 [x] The warning list called the whole day taken — fixed 2026-09-12

The form sat at 06:00-06:00 and reported five collisions, none of them real. `slotFromForm`
([scheduleConflicts.js](src/domain/scheduleConflicts.js)) handed `"06:00 - 06:00"` to
`parseTimeRange` ([timeRange.js](src/domain/timeRange.js)), whose midnight rule reads an end at or
before the start as the next day — right for 22:00-00:00, and a full 24-hour slot for two equal
times. A missing end was worse: it defaulted to the start, so an untouched field meant "all day"
too.

**Fixed by measuring the length instead of trusting the pair**: no end, or a length of a full day,
now means "the trainer has not said how long this is", and an unknown length collides with nothing.
The rule a live warning lives or dies by is that it must not fire on the ordinary case.

**And the end now follows the start**, keeping the length already chosen (an hour until the trainer
says otherwise) — the state that produced the screenshot could not have been reached.

### 46.2 [x] Choosing two clients out of a hundred — redesigned 2026-09-12

The form rendered EVERY client in the base as a checkbox row carrying its own routine `<select>`,
and opened with all of them ticked. With the eight seeded clients that is merely untidy; with a real
base of a hundred it is a wall to scroll one-handed, a hundred `<select>` elements built on every
open, and a session that starts out booking ninety-eight people the trainer must then remove.

**What it is now**: the form opens with nobody on the session. One search field finds a client by
name and shows at most eight matches; a tap — or Enter — puts that person on the session with their
own programme picker and a cross to take them off again. A row exists only for someone who is
actually training, so the rows ARE the selection and there is no checkbox to read.

Pinned in [tests/medium/test_session_participant_picker.py](tests/medium/test_session_participant_picker.py).

### 46.3 [x] Four smaller things in the same screenshot — fixed 2026-09-12

- **The labels promised a format the control does not use.** "DATUM (YYYY-MM-DD)" sat above a field
  showing `09/12/2026`, and "ZAČETNI ČAS (24H)" above `06:00 AM`. A `<input type="date">` or
  `type="time"` always renders in the browser's own locale; the hint could not be honoured and was
  only misleading. Removed from both languages.
- **The session name appeared twice**, once in its field and again as plain text above the
  participants. The subtitle existed because the form was long enough to scroll the name out of
  sight — which §46.2 fixed at the cause.
- **The warning list was five full-width tinted blocks** pushing the participant picker off a phone
  screen. Now a coloured bar down the left of a compact line, with the two states still told apart.
- **The form's own description still said "check clients to select participants (2-6)"** — a
  description of the picker that no longer exists, and a count the form never enforced.

### 46.4 [x] The demo data speaks the trainer's language — shipped 2026-09-12

**Reported 2026-09-12 (Simon), from a screenshot**: "Morning Conditioning", "Trib gym base" and
"playground outside" read as English in a Slovenian app.

**Ruled the same day**: the demo is a SNAPSHOT in the language selected when it is loaded. A later
language switch does not rewrite it — by then those rows are the trainer's to edit, and reseeding
them would throw that away. Reloading the demo in the other language is how to get it in the other
language.

**Why it was not a text edit.** The seed is a static dataset written into the database at load time,
and `data/` may not import the interface dictionaries as a layer. Two things made it safe in the
end. `data/seedProvenance.js` identifies demo rows by ID, not by text, so translating the words
cannot break selective removal. And the dictionary lives at
[src/data/demoText.js](src/data/demoText.js) rather than in `src/i18n/`: every `.js` in the locale
directory is read as a LANGUAGE by the parity check, so a helper dropped there is a locale missing
six hundred keys. Found by the gate, on another session's run.

**Keyed by the seed's own English**, not by invented key names: a seed record is a sample session
called "Morning Conditioning", and a key per record would mean two places to edit with nothing to
catch a miss. The walk translates every string at any depth, because the words are not only on the
record — a routine's circuits carry titles and a history entry's sets carry the note written during
the set. Its test walks the real seed modules and failed twice while being written, on strings a
by-hand sweep had missed.

**Not translated, deliberately**: exercise names (the movement catalog's own vocabulary, used in
English on a Slovenian gym floor), people's names, and "Trib gym base" — a gym's name, not a
description of one.

### 46.5 [x] The seed stamp says what it is — renamed 2026-09-12

Every seeded record carried `seededDemo: true`. That name was not true of all of them: the browser
suite seeds the same rows through `?init=demo_data_load`, and those are not a demo of anything. The
field is now `testData`, which is true of both and is the word someone reading a backup needs —
**the manual cleanup route Simon named is to hand an exported backup to an AI and have it strip
those rows**, so the file has to say plainly which rows are not the trainer's. The old name is still
READ, for the two preview installs that carry it and sit at schema "P", where the migration chain
never runs again.

### 46.6 [x] [Decided] The demo-removal code stays, as a safety valve — ruled 2026-09-12

Simon first said it was no longer needed: the demo lives in the sandbox now, and a sandbox is thrown
away whole. He then asked what keeping it costs, and on the measurement ruled that it **stays**, for
the case the sandbox does not cover — test data that reaches the working workspace, through an old
`?init=demo_data_load` link or a restored backup.

**What it costs: nothing that grows.** [seedProvenance.js](src/data/seedProvenance.js) identifies a
record by the `testData` stamp, and failing that by the seed id set derived from the seed modules
themselves — never by text. So translating the demo (§46.4) could not break it, and adding a demo
record keeps it correct with nothing to remember. Seed ids are 8 characters where a real one is a
22-character base62 UUIDv7 ([recordId.js](src/data/recordId.js)). It is 172 lines of rule, 180 of
dialog and 447 of tests.

**And it costs the trainer nothing to carry**: the button lives on a notification that is itself a
seeded record, so an install with no test data has no card and no button.

**The manual route stays the fallback** for a store nobody can reach through the app: hand the
exported backup to a tool that strips every row stamped `testData`. That is what §46.5 renamed the
stamp for.

### 46.7 [x] The stamp says WHICH kind, and the app notices when test data escapes — shipped 2026-09-12

**Asked by Simon**: tag seeded rows as demo or test, and find a way to detect when such rows are in
the production database outside a test run.

**The stamp now carries an origin**, written when the row is created, because the two are byte-identical
afterwards and nothing can tell them apart later. The sandbox writes `testData: "demo"` — the sample gym
a trainer asked to see. `?init=demo_data_load` writes `testData: "test"` — the switch the browser suite
puts on every navigation, and the only way anything reaches the WORKING database.

**The app cannot detect a test run, and does not pretend to.** No page can: it is the same app under
Playwright as under a thumb. The alarm is built from two facts instead. One is already written down —
which switch wrote this row. The other is the current boot: does the address carry `?init=`? A test run
always does, so it never sees the alarm; a trainer's install never does, so one escaped row shows up
the moment the app opens. In the sandbox it says nothing, because that is where sample data belongs.

**What the trainer sees**: a warning at the top of the message feed — *V tvojih podatkih so testni
zapisi* — naming how many rows and which collections, and offering the removal screen §46.6 kept.

**Two weaknesses, on the record.** Anyone can type `?init=` into a URL, so a person can create
test-stamped rows; that is the case the alarm is FOR, not a defect in it. And the alarm stays quiet
during the suite only while every test navigation carries the switch — a test that seeds with it and
then reloads without it would raise the alarm on itself.

### 47.1 [x] The session title runs off the card — fixed 2026-09-13

The card in the screenshot is the clipboard's title bar, not a card in the session list. Its name
was "Group Strength & Conditioning + …": two sessions booked into one slot share one clipboard, and
the name joins both.

**The title.** `h3#session-title-text` is a flex item of `.session-title-block` and had no
`min-width: 0`, so it would not shrink below its text. At 390px it was 379px wide in a 240px slot.
The name never reached its ellipsis and ran under ▶ and ⋮. Fixed in
[activeSessionOverlay.css](src/modules/clipboard/activeSessionOverlay.css).

**Each name on its own line — ruled 2026-09-13.** With the h3 shrinking, the joined name was cut
with "…": at 390px it read "Group Strength & Conditioning + …", and the second session was not
named at all. Measured options were one line with "…" or two wrapped lines (+8px of bar height).
Simon's ruling: one line per session name, and a name too long by itself still ends in "…". Both
the clipboard ([sessionTitleBar.js](src/modules/session/sessionTitleBar.js)) and the editor title
([activeSessionBoard.js](src/modules/clipboard/activeSessionBoard.js)) do it, because they are one
bar in two modes. The collapsed bar at the bottom of the screen still joins names with " + ".

**Why the sweep missed it — three reasons, all measured.**

1. **The walk opened the wrong clipboard.** `_walk_live_session` clicked the first card, a finished
   session with a short name. With the seed's merged pair open, the old sweep did report the h3, by
   5px past the screen edge. The walk now opens that pair.
2. **No rule saw text that stays on the screen.** A name ending at 286px lies under ▶ (from 272px)
   and inside the screen. Rule A needs a box that clips, or the screen edge; rule B needs a box that
   clips. Nothing here clips. **New rule C**: an element in the normal flow may not be wider than a
   parent that does not clip it, measured against the parent's padding box and allowing any negative
   margin. Pinned against built-to-break pages in
   [test_overflow_scan_invariants.py](tests/medium/test_overflow_scan_invariants.py).
3. **The component test measured a shape the app no longer draws.** `_mount` in
   [test_clipboard_title.py](tests/medium/test_clipboard_title.py) wrote a plain string into the h3.
   Since §39.6 the renderer puts two lines there, and only that shape breaks. The fit test now goes
   through the real renderer, with the merged name.

**Rule C found two more, on its first run, on every width.**

- **Plan editor rows.** At 390px a row needed 380px and had 304: the rest field and the delete
  button sat past the screen edge. Rule A had stayed quiet because the list around the rows has
  `overflow-y: auto`, which makes the browser compute `overflow-x: auto` too, and A reads that as
  "can be scrolled sideways". The row now has two lines: the exercise, then the four numbers and
  the delete button. The exercise name is no longer cut either.
- **Exercise picker badges.** `flex-shrink: 0` stopped them wrapping, so "CONDITIONING" ran past the
  item's border and the name beside it was squeezed to one word per line. They now wrap.

### 48.1 [x] The active card and the open card are two different things — shipped 2026-09-13

**Wanted.** On the clipboard, the card the participant is working on now (the ACTIVE card) must be
separate from the card the trainer has opened to look at (the OPEN card). The aim is fewer taps.

**What the app does today.** One value, `activeExerciseIndex` in the client's session state, does
both jobs. The deck in [exerciseDeckOfCards.js](src/modules/clipboard/exerciseDeckOfCards.js) opens
the card at that index, and a tap on another card calls `focusExerciseByIndex`, which moves it. So
when the trainer opens the next card to read it ahead, the app also treats that card as the one in
progress. Getting back costs another tap.

**Decided 2026-09-13 (Simon):**

- A tap on a card that is not active opens it AND makes it active, as today.
- The active card follows the scroll: the card the trainer is looking at is the active one. Nothing
  else moves it forward.
- The rest timer starts on a tap and does not depend on any card. Assumed, not yet confirmed: it
  keeps the way back to the card that started it
  ([sessionFocus.js](src/domain/sessionFocus.js) records that card).
- The active card has a coloured left edge and a thin outline, drawn by a class and CSS (§49.1).

**Ruled 2026-09-13 (Simon), second answer:** *"scroling does collapse cards, but it only highlights
the one in focus, so it can quickly be returned to when switching client views. We don't want to
show any buttons on active card, to not clutter in progress session, card opens buttons and controls
only on tap."* And, asked separately: *"fix also reload to return to same state as before"* — which
also opened §50 for every other form.

**What shipped.**

- The state stayed one index per client. `activeExerciseIndex` is the active card and is always
  marked (`is-active`); `deckAllCollapsed` now means only "no card is open".
- [deckScrollFocus.js](src/modules/clipboard/deckScrollFocus.js) reads the card at the focus line
  after a scroll and hands it to `activateExerciseByScroll` in
  [sessionFocusUrl.js](src/controllers/sessionFocusUrl.js), which closes the open card. It
  re-renders only when a card was open, so a scroll with nothing open does not rebuild the deck
  under a moving finger.
- Only the trainer's scrolling counts: a wheel, a touch drag or a scrolling key opens an 800 ms
  window, and a tap closes it. Without this, the scroll the deck makes by itself after a render
  would close a card opened low on the screen at once. The test for it was checked by removing the
  guard and seeing it fail.
- The focus line moves with the scroll, from the top edge at the start of the list to the bottom
  edge at its end. **Reported by Simon while it was being built:** a line fixed a third of the way
  down could never be reached by the first and last cards.
- When the open card closes, the list gets shorter and the browser scrolls on its own. That scroll
  is ignored, or it moved the mark straight back to the first card.
- The URL keeps naming the active card, and ends in `/closed` when no card is open, so a reload
  restores both the card and whether it was open (`session.focus.closed` in
  [routeTable.js](src/controllers/routes/routeTable.js)).
- The deck scrolls to the active card when no card is open, which is what a switch back to a client
  returns to.
- The mark is an outline and a 4px left edge, from `outline` and `::before`: neither takes layout
  room, so the stack does not move when the mark moves.

**Not changed:** the rest timer. It already starts on a tap and keeps its way back to the card that
started it.

**Follow-up the same day (Simon):** *"je možno premikati aktivno kartico samo s scrollom tudi, na
kratkih seznamih brez page reload-a?"* — then *"1+2 prosim"*. A short list could not scroll, so only a
tap moved the active card there. Now the deck measures the room it is missing and adds it at its end,
and the scroll works like the wheel of a time picker: how far the list has scrolled decides the card,
and the active card rests where the first card rests. While the clipboard is open, the page and the
clipboard's scrolling area have `overscroll-behavior-y: contain`, so a pull down does not reload the
page on a phone. The cost, said before it was built: closed cards stand about 30px apart on a phone,
so a short pull moves the active card by one.

## 49. [x] A theme is a stylesheet, and the Red theme becomes Spreadsheet — shipped 2026-09-13

Simon sent a screenshot of the spreadsheet a trainer runs her sessions from — a white sheet, thin
grid lines, a header row, grey rows for each round — and asked for a theme modelled on it, in place
of Red, with cell colours that appeal to as many people as possible and do not recall the orange
sandbox marks. Asked what a palette alone could do, he ruled: *"vsaka tema rabi svoj lastni CSS
override, ne samo barvne sheme — po principu lokalnosti in single responsibility layout ne sme biti
pisan v kodi"*. The decision is recorded in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#themes-and-styling).

### 49.1 [x] No style written in code — shipped 2026-09-13

Ruled 2026-09-13 (Simon) as the ground for §49.2: a theme is a whole stylesheet, and layout is not
written in code. A declaration on the element beats every stylesheet, so a theme could not reach it.

**Measured before:** 126 declarations in 16 JavaScript files — `planAdjustments.js` 36,
`sessionCard.js` 18, `activeUsersList.js` 17, `feedbackModal.js` 15, the rest six or fewer. Another
25 were already custom properties and stay.

**What moved, and how.** Each declaration went to its module's stylesheet as a class. Code that
switched a look (`isActive ? … : …`, `display = cond ? "flex" : "none"`) now toggles a state class or
`.hidden`. The overlay's slide-down is two classes with the same reflow between them. Values only the
code knows became custom properties: the walkthrough panel's measured height
(`--walkthrough-panel-max-height`) and an exercise's signal colour (`--signal-color`). An inline style
used to beat every rule, so where an existing rule on the same element set the same property, the new
selector is chained (`.badge.session-card-time-badge`, `.modal-actions.adjust-modal-actions`, …).

**Visible on purpose:** the literal `#ef4444` — midnight's `--danger` — became `var(--danger)`, so
warning pills, injury marks and the recording icon follow the theme. Two reads of `--text-color`, a
property nothing defines, now name `--text-main`, which they were already inheriting.
**Visible by accident, and accepted:** a session card's hover lift moved from JavaScript listeners to
`.session-card:hover`, where a completed or live card's own background now wins over the hover tint.

**Held by** [agent_tools/inline_styles.py](agent_tools/inline_styles.py) in Stage 1 and CI, a plain
gate rather than a ratchet, since the count reached zero in the same change.

The conversion ran on four cheaper subagents, one set of files each; the six sites in
`clientsView.js` were missed when the files were split and were moved by hand.

### 49.2 [x] The Spreadsheet theme replaces Red — shipped 2026-09-13

**The colour.** The sheet's own amber header and yellow highlights were dropped first: they recall
the sandbox's orange marks. Blue came next, as the colour named first worldwide — YouGov, ten
countries on four continents, 23 % to 33 % — but it leans male: 40 % of men against 24 % of women in
the US ([YouGov](https://yougov.com/en-gb/articles/12331-blue-worlds-favourite-colour)). Simon chose
**petrol** (`#0e7490`), between blue and green, the first two choices worldwide. It is 32° from
Daylight's emerald on the colour wheel. Every contrast was measured: white on petrol 5.36:1, muted
text 7.66:1 on a cell and 6.83:1 on the field.

**The grid.** Tokens set the colours and 2px corners; rules under them draw the table. The clipboard's
deck is rows sharing one line instead of a tilted stack, and the card in focus is the selected cell,
tinted with a 2px edge, in its own row. A circuit's round count is the grey row. The day's sessions
are rows too, pills are cells, and side-by-side plan columns share their borders. **Cost:** a
collapsed deck card shows its whole row, 8px more per card than the stacked deck.

**Found by looking, not by a test.** The overdue bar puts dark text (`#3d2600`) on `--warning`, and
this palette's `--warning` is dark enough to be read as text on white. The theme draws that bar as a
pale yellow cell instead (11.22:1).

**Two decisions a theme has to respect.** Theme stylesheets now load after every module stylesheet,
as the last `<link>` tags, with the sandbox marks after them. And a theme must not restyle the app
header: at equal specificity it would win over the sandbox's orange header.

**Held by** [test_theme_selectors.py](tests/unit/test_theme_selectors.py): every class a theme
restyles must still exist, since a renamed component would otherwise drop out of one theme without a
sound. A saved `red` choice and an old `?theme=red` link open the new theme
([test_theme.py](tests/medium/test_theme.py)).

## 51. [x] A tap the demo step did not ask for interrupts the guide — fixed 2026-09-13

**Reported 2026-09-13 (Simon):** *"klik na meni ne odstrani highlightov od walkthrough-a,
nepričakovani klik naj prekine walkthrough in kartica ponudi vrnitev"* — a tap on the menu leaves
the walkthrough's highlight on screen; an unexpected tap should interrupt the walkthrough, and the
card should offer the way back.

**Why it happened.** The guide already had a "you have wandered off" card (§38.5), but it appeared
only when the step's control was gone from the screen for three polls. The ☰ menu drops down while
the step's session card is still there, so the ring stayed lit over the menu.

**What changed** ([walkthroughOverlay.js](src/modules/demo/walkthroughOverlay.js)):

- A real tap on a control (button, link, field, menu item) that is not the step's own control and
  not on the guide's panel is recorded. Taps on empty space do not count.
- The next poll judges it. If the step is not done by then, the guide is interrupted: the ring
  goes away and the card shows *Back to the demo* / *Stop the demo*. A tap that does the step by
  another route is a step done, so the guide moves on instead.
- The guide's own taps (*Show me*, the rebuild) use `click()`, which is never `isTrusted`, so they
  never interrupt.
- *Back to the demo* first closes the menu or window the tap opened, through its own control, and
  then rebuilds the step as before.

**An earlier ruling changed with it.** On 2026-08-26 the case "open the menu by hand, then tap
*Show me*" was answered by *Show me* closing the menu. The menu tap now interrupts the guide, so
*Show me* is not offered there; *Back to the demo* closes the menu and *Show me* returns.
[test_walkthrough_modal.py](tests/medium/test_walkthrough_modal.py) walks that path now. Closing the
clipboard mid-step is also a stray tap, so the console-diagnosis test in
[test_walkthrough.py](tests/e2e/test_walkthrough.py) returns through the card instead of Back and
Next — it had passed only because the guide took three polls to notice.

**Words unchanged, possibly worth revisiting:** the card still says *"You have left the demo's place
in the app"*, which is loose after a menu tap on the same screen. Left for §38.21 (the demo's card
text, waiting on the maintainer).

Tested by `test_a_tap_the_step_did_not_ask_for_interrupts_the_demo` in
[test_walkthrough.py](tests/e2e/test_walkthrough.py).

## 52. [x] The Spreadsheet theme looks like a sheet, and a plan can be pulled aside — shipped 2026-09-14

Simon, after §49.2 shipped: *"izgled je še vedno preveč podoben ostalim temam, pričakujem mrežo in
razporeditev bolj podobno zaslonski sliki (z merge celicami za naslov in podobno)"*. Shown two
layouts, he ruled: no column letters and no row numbers; a thick border round each block of the
plan (a circuit, or an exercise outside one); history and future as columns scrolled left and
right. Then: *"poenostaviva, pusti levo-desno scroll za prihodnost in najprej implementiraj samo
izgled"*.

### 52.1 [x] The look — shipped 2026-09-13

Reported by Simon after §49.2 shipped: the Spreadsheet theme still looked too much like the other
themes. The first version only made cards flat and square. He asked for a grid with merged cells,
like his screenshot. He then ruled out column letters and row numbers, asked for a thick border round
each block, and deferred the history columns (§52.2).

**What changed, all in [spreadsheet.css](src/modules/themes/spreadsheet.css):**

- **Blocks.** A circuit is one block, and so is an exercise or a rest outside a circuit. Each has a
  2px border in `--text-muted`, and neighbouring blocks overlap by 2px so they share one line. A past
  card keeps the thin grid line, because it is one movement pulled out of an old session, not a
  block.
- **Merged cells.** A circuit's name and round count are one grey cell across the block. Negative
  margins cancel the card's padding so the fill meets the border. The movements under it are rows
  divided by the thin grid line. The clipboard's title bar is the merged title cell at the top of
  the sheet.
- **Sheet tabs.** Client tabs are flat cells, and the client shown is underlined in petrol. The
  component painted the active tab's initials white for its solid tab. On a white tab they vanished,
  which the first screenshot showed, so the theme gives them a petrol disc (5.36:1).

**Kept:** §48.1's active-card outline and left edge.

**Changed 2026-09-14.** Simon: *"debela obroba sklopov je premočna, se izgubi poudarek na aktivni
kartici"*. The 2px dark block border became a 4px empty strip between blocks, the way his sheet
leaves an empty row between sections, and every other line on the clipboard is thin, the title bar's
included. The active card's outline went from 1px to 2px, so it is the one heavy edge on the screen.
4px was chosen after comparing 3px and 6px on a 390px phone. A circuit is set apart at 3px already,
by its grey name row, but an exercise outside a circuit has no such row.

**Not possible in a theme alone:** columns for sets, reps and load. The exercise card writes its
target as ONE string (`compactTarget` in exerciseCard.js). It was not needed once Simon chose
sessions, not values, as the columns.

### 52.2 [x] Pull the current plan aside to see the previous one — shipped 2026-09-14

**What Simon described, 2026-09-14.** A way to compare a client's current plan with the previous one,
as his sheet does with two columns side by side:

> *"umikanje trenutnega načrta razkrije starega, ko prst drsanje spusti trenutni načrt skoči nazaj
> na svoje mesto (in zakrije preteklega). Torej dokler prst drži 'odejo' sta vidna oba načrta."*

- The current plan lies over the previous one. A drag from left to right moves the current plan
  aside, and the previous plan shows underneath.
- While the finger holds, both plans are visible. On release, the current plan springs back and
  covers the previous one.
- **Not** a comparison inside one row: exercises are not repeated from plan to plan, so there is
  nothing to match a row against.
- The whole current plan is visible at once, and the reveal shows every row of the previous plan.

This replaces the sideways columns of history and future that were first proposed here on
2026-09-13.

**Measured in the code on 2026-09-13.** The deck draws only the LAST past session (`pastExList` in
[exerciseDeckOfCards.js](src/modules/clipboard/exerciseDeckOfCards.js)), and
`buildPastExerciseItems` flattens it without its circuits. Nothing uses a sideways drag yet; the only
gesture is the swipe down that closes the clipboard.
[deckScrollFocus.js](src/modules/clipboard/deckScrollFocus.js) picks the active card from vertical
scrolling, so a sideways drag must not count as a scroll.

**Ruled 2026-09-14 (Simon), while trying a prototype:**
- **The previous plan always shows what was PLANNED.** No ticks. An icon marks a signal recorded
  against a row, in the active card's own glyphs (exerciseCard.js): `fa-feather` for too easy,
  `fa-weight-hanging` for too hard, `fa-note-sticky` for a note. Corrected the same day: the first
  record here read Simon's "pero, utež" as a pen for a note and a weight for a logged load.
- **The session's title bar and client tabs are part of the plan** that moves aside, and the plan
  underneath shows its own.
- **Press and hold shrinks the plan by itself**, before any movement, so the trainer can see it can
  be pulled. A short tap does nothing, so tapping a card is not disturbed. It narrows too, so the
  edge of the previous session shows on the left and of the next one on the right. Simon asked for
  more than the first 22px a side; at 60px on a 390px phone the plan is 256px wide, no exercise name
  of the demo plan is cut, and the neighbours show the start of their names and their loads.
- **Exercise names carry the session's time**: a past session's names in `--temporal-past`, a
  future session's in `--temporal-future`, under the blanket and when that session is opened.
- **Signal icons are coloured**, in the active card's colours but darker: the app's `#10b981` and
  `#f59e0b` measure 2.27:1 and 1.96:1 on the sheet's white, under the 3:1 an icon needs. The
  prototype uses `#1e7e34` (4.38:1), `#b45309` (4.25:1) and `#c5221f` (4.75:1). "Too hard" keeps
  `fa-weight-hanging`: Simon saw eleven other glyphs on the prototype and kept it.
- **The main colour stays `#0e7490`.** Simon compared it on the prototype with two greener
  candidates and chose it.

**Approved 2026-09-14 with the prototype as a whole** (*"všeč mi je! greva v implementacijo"*):
- **Rows shrink while the plan is held or pulled aside**, animated, so more of both plans fits; they
  grow back on release. The row under the finger stays where it is while the rows shrink.
- **Sessions as a sideways deck.** A pull past a marked threshold ("Release to open") opens the
  neighbouring session's clipboard; a **Today** button leads back. A pull from right to left shows
  the next plan, or, when the client has none, a card offering to create one.
- **The sessions are the ACTIVE CLIENT'S** (Simon, the same day): back and forward move through this
  client's previous and next plans, not through all sessions in time order.
- **Why the live deck keeps its row height:** every collapsed card is a tap target, and a 22px row is
  too small for one thumb. Rows that are not tapped (the plan under the blanket) can be dense.

**Chosen by the implementing session, not ruled** (say so if one is wrong):
- **The back gesture:** a drag that starts within 24px of either screen edge is ignored, as in the
  prototype. It still needs trying on a real phone.
- **A plan longer than the screen:** the plan underneath shows from its top. First chosen as "both
  scroll together", changed at step 3: in the app the deck is its own scroller, and since exercises
  do not correspond between plans, aligning the two scroll positions says nothing.
- **Every theme gets the drag.** It is behaviour, and a theme only styles; colours come from each
  theme's `--temporal-past` / `--temporal-future`.

**Chosen at step 3, not ruled:**
- **Held cards get denser by their own padding.** A deeper stack overlap was tried first and dropped
  in review: it hid the row a collapsed card needs read (§28.4) and did nothing in the Spreadsheet
  theme, which sets its own overlap.
- **Holding or pulling the plan never changes the active card.** The rows reflow under the finger and
  the browser scrolls on its own; on a phone the same press's touchmove would make §48.1 read that
  as the trainer scrolling. Found in review, not by the first tests, which drive a mouse.
- **The under-layer header repeats the neighbour's title, ISO date and client name** as plain text,
  not the real title-bar/tabs components — nothing there is tapped, and mounting the real components
  twice would wire two copies of every listener they carry.

**Chosen at step 4, not ruled:**
- **A started session is never left by a pull.** The pull still uncovers the other plan, but shows
  no "Release to open" and opens nothing. Opening another session replaces the one clipboard slot,
  and a running session's logs would go with it. The same holds for the create-a-plan card.
- **Today is worked out, not remembered.** It leads to the client's session on today's date (a
  finished day: its history record), found by `clientSessionToday` from the same history and
  schedule as the neighbours. So it also shows when a past record was opened from the History view
  and the client trains today. It shows only when the clipboard is showing a different session.
- **Today sits on the title bar as a calendar glyph with the word**, left of Start. It costs the
  title 106px while it shows.
- **"Create a plan" opens the client's planning form**, the one the client card's "Plan Program"
  button opens, at the `session.new` address. Nothing new was built for it.
- **A pull on a phone needed `touch-action: pan-y` on the clipboard body as well.** Found at step 4
  with emulated touch: touch-action stops at the nearest scroll container, so a finger on a card
  never moved the plan at all. Pinned by `tests/e2e/test_plan_peek_open.py`. `pinch-zoom` was added
  beside it in review: `pan-y` alone switches off two-finger zoom on the whole clipboard.

**Seen at step 4, not changed:** see §55.

**Steps, one commit and one gate each:** 1) the client's previous and next plan, as a pure domain
function (`clientSessionNeighbours.js`, shipped 2026-09-14); 2) the plan drawn under the blanket
(`planSheet.js`, with the live card's target wording moved to one shared helper, shipped 2026-09-14); 3) the drag, with title bar and tabs moving with the
plan (`planPeek.js` + `planPeekController.js`, shipped 2026-09-14); 4) opening a neighbour, Today, and the create-a-plan card (shipped 2026-09-14).
