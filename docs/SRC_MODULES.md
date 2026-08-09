---
type: index
title: LibrePT Source Module Catalog
description: Catalog of every runtime module under src/ — the app entry, data layer, feature modules, controllers, and service worker.
status: active
tags:
  - index
  - src
  - okf
---

# LibrePT Source Module Catalog

The runtime app lives under `src/` (served as the web root locally and flattened into `dist/`
on deploy). It's a native ES-module app (`<script type="module" src="app.js">`). `src/app.js`
is structured into feature modules under `src/modules/` (`session`, `plans`, `clients`, `exercises`, `history`, `common`, `themes`), the training vocabulary under `src/domain/`, and storage under `src/data/`.

**The tree is layered, and the layering is gated** by
[agent_tools/import_layers.py](../agent_tools/import_layers.py) — each layer may import only from
those strictly below it: `data/` → `domain/` → `modules/common/` → `modules/<feature>/` →
`controllers/` → `app.js`. The two lowest are the ones easily confused: **`data/` is about records
at rest** (their shape, identity, ordering, persistence), while **`domain/` is the training
vocabulary** — what a modality is, how reps and load are authored, what a session's clock means —
pure, with no DOM and no storage. `domain/` was carved out of `modules/common/` in
[TODO §24.6](../TODO.md), which had grown into two directories wearing one name: a
DOM-reference count split its modules cleanly into ten with zero and the rest with 5–35, so a
directory documented as "shared UI helpers" was also holding half the domain rules.

**`src/index.html` and `src/index.css` are shells, not feature owners.** `index.html` holds only
`<head>` boilerplate, the boot-critical integrity-error overlay, and empty named canvases
(`#app-header`, `#main-content`, `#notification-area`, `#active-session-overlay`,
`#clipboard-timer-stack`, `#dialogs-root`); every view section, dialog, the header, and the
notification area render their own markup from the JS module that owns their behavior (e.g.
`renderHeaderShell()` in `applicationHeader.js`, `renderClientDialog()` in `formsController.js`).
`index.css` holds only shared design-system tokens/foundations (buttons, cards, modals, form
controls, color tokens) — each feature's own rules live in a same-named `.css` file next to its
module, listed in the table below alongside that module's `.js`.

| Module | Type | Description |
| :--- | :--- | :--- |
| [src/app.js](../src/app.js) | `entry` | Application bootstrapper: root initialization, dependency injection wiring, and global lifecycle hooks. |
| [src/appBoot.js](../src/appBoot.js) | `entry` | Side-effect-free boot steps extracted from `app.js`'s `init()` — one exported `bootXyz(deps)` per feature, callable independently of the real boot (used by `tests/medium/` to mount one component without running the full app). |
| [src/index.html](../src/index.html) | `shell` | The app shell: `<head>`, the integrity-error overlay, and empty canvases every other module renders into. |
| [src/index.css](../src/index.css) | `styles` | Shared design-system tokens and foundations only (buttons, cards, modals, form controls, resets) — per-feature rules live in each module's own `.css`. |
| [src/theme-boot.js](../src/theme-boot.js) | `entry` | Render-blocking classic script that sets the theme class before paint (anti-FOUC) and forces http→https; external so CSP `script-src` can forbid `'unsafe-inline'`. |
| [src/data/stateStore.js](../src/data/stateStore.js) | `data` | Central app state management (TODO §18.6 part 4): the in-memory state object stays synchronous, but load-at-boot and save-on-write now run through IndexedDB via a one-time, revertable import from the legacy `localStorage` bucket — falls back to plain `localStorage` if IndexedDB is unavailable. |
| [src/data/storageNamespace.js](../src/data/storageNamespace.js) | `data` | The app's plain `localStorage` keys (TODO §16.5/§16.3, both resolved): no bucket-keying scheme here any more — the schema axis lives in IndexedDB's per-schema stores, and `librept_db` is now only the one-time legacy import source / no-IndexedDB fallback. |
| [src/data/indexedDb.js](../src/data/indexedDb.js) | `data` | IndexedDB adapter (TODO §18.6): one database with one object store per schema — the layout that lets a single transaction write every live schema atomically — plus promise wrappers that resolve on commit. |
| [src/data/storageDurability.js](../src/data/storageDurability.js) | `data` | Storage durability (TODO §18.6/§18.8): requests eviction-proof storage, and reports risk by measuring the consequence (quota, persistence) rather than sniffing for private browsing. |
| [src/data/writeQueue.js](../src/data/writeQueue.js) | `data` | Write-behind persistence queue (TODO §18.6): serialises async writes behind a synchronous call so saves can never land out of order, and surfaces failures instead of swallowing them. |
| [src/data/schemaMigrations.js](../src/data/schemaMigrations.js) | `data` | **Legacy chain runner, awaiting deletion (TODO §16.5).** Chains are *not* the architecture: [TODO §18](../TODO.md) decided **star writes** — every record projected directly from the live domain object into each live schema, no step feeding another. This walks the old v1→v2→v3 chain and is kept only until the projections replace it. Do not extend it. |
| [src/data/migrationSteps.js](../src/data/migrationSteps.js) | `data` | `CURRENT_SCHEMA_VERSION` and the pure per-version transforms. The version constant survives star writes (it is what storage buckets key on, TODO §16.3); the ordered *chain* around it does not. |
| [src/data/recordSchemas.js](../src/data/recordSchemas.js) | `data` | Declared per-collection record shapes, per live schema major (TODO §18.1/§18.4) — the first place "schema N" exists as data rather than as a side effect of a migration transform. `fieldIssues`/`isRecordValid` are the structural validator every projection is held to. Also owns `DEFAULT_READ_SCHEMA` — the schema a fresh install reads, **declared not derived** (see [readSchema.js](../src/data/readSchema.js) for the per-install override). |
| [src/data/readSchema.js](../src/data/readSchema.js) | `data` | Which live schema THIS INSTALL reads, as a trainer-owned setting: the pre-emptive boot backfill that keeps every live schema ready, and the toggle that moves between them. An upgrade is a read re-point, not a migration — the star-write fan-out keeps the schema being left current too, so switching is instant and reversible. |
| [src/data/recordProjections.js](../src/data/recordProjections.js) | `data` | The star-write projection layer (TODO §18.1): one function per collection, domain object → IndexedDB record, plus the inverse (`groupRecordsByCollection`) that reassembles a flat record list back into `stateStore.js`'s in-memory shape. `projectionIssues()` is what proves a projection is total. |
| [src/data/recordReferences.js](../src/data/recordReferences.js) | `data` | The domain's cross-collection reference graph (TODO §18.5): which fields are structural references to another collection (vs. a denormalised "soft ref" label), and `findCycle()`/`isAcyclic()` — migration replay order needs the graph to be a DAG. |
| [src/data/index.js](../src/data/index.js) | `data` | Barrel for seed/demo data: `exercises.js`, `clients.js`, `routines.js`, `history.js`, `planUpdates.js`, `sessions.js`. |
| [src/data/syncMerge.js](../src/data/syncMerge.js) | `data` | Google Drive sync's three-way merge (TODO §1.5/§3.3): per-record-id merge against the last-synced ancestor, no wall-clock ordering — same-record conflicts are reported, never silently guessed. |
| [src/data/driveSyncConfig.js](../src/data/driveSyncConfig.js) | `data` | The one deployment constant Drive sync needs (TODO §1.5): `GOOGLE_DRIVE_CLIENT_ID`, blank by default and a valid "not configured" state until the maintainer fills it in. |
| [src/data/driveAppData.js](../src/data/driveAppData.js) | `data` | Google Drive `appDataFolder` REST client (TODO §1.5/§3.3): find/download/create/update the app's one hidden sync file. `fetchImpl`-injectable for tests. |
| [src/data/driveSyncService.js](../src/data/driveSyncService.js) | `data` | Orchestrates one Drive sync pass (TODO §1.5/§3.3): auth → download → three-way merge → apply locally → upload → record the new ancestor. |
| [src/data/calendarInvite.js](../src/data/calendarInvite.js) | `data` | Builds an RFC 5545 `.ics` VEVENT for a PT-assigned session (TODO §1.1) — LibrePT has no backend/SMTP relay, so this is a downloadable invite file, not a sent email. |
| [src/data/recordId.js](../src/data/recordId.js) | `data` | Record identity (TODO §18.2): UUIDv7 as fixed-width base62 — cryptographic collision resistance, and string sort order equal to creation order. |
| [src/data/sessionItemOrder.js](../src/data/sessionItemOrder.js) | `data` | Explicit session-item ordering (TODO §17.5): dense `position` stamped by every writer, program-order reads, and the density + circuit-contiguity invariants that make a scrambled or partial item list detectable at rest. |
| [src/data/sessionCache.js](../src/data/sessionCache.js) | `data` | Active session local storage cache helper. |
| [src/domain/repsAndLoad.js](../src/domain/repsAndLoad.js) | `domain` | Polymorphic reps and equipment-derived load helpers. |
| [src/domain/exerciseModality.js](../src/domain/exerciseModality.js) | `domain` | Exercise modality axis (strength/cardio/stretch/balance) and per-metric target formatting (time/distance/calories/watts/hold). |
| [src/domain/exerciseStandard.js](../src/domain/exerciseStandard.js) | `domain` | Open-standard crosswalk: maps the catalog's category/equipment onto the wger dataset by canonical name for interchangeable JSON/CSV exports (UC6 §6). |
| [src/domain/sessionItemRecord.js](../src/domain/sessionItemRecord.js) | `domain` | Immutable history program snapshot: typed items (exercise/rest + circuit grouping), shape guards, and `buildProgramSnapshot` keeping rests + skipped work. |
| [src/domain/sessionClock.js](../src/domain/sessionClock.js) | `domain` | Wall clock ↔ schedule reconciliation for a live session: the one countdown-vs-count-up decision the bar, title bar and dashboard card all share (a session started after its slot has no countdown left, so it never opens negative), plus the ±15min start-drift test and the shifted-slot proposal behind the adjust dialog. |
| [src/domain/sessionPlanFactory.js](../src/domain/sessionPlanFactory.js) | `domain` | Builds a live session's per-client plan from the two things a session can start from — a stored history/planning snapshot or a routine (TODO §24.4). Pure: the plan's SHAPE is a training rule, while deciding when to build one is orchestration. Also owns the legacy exercise-level-rest migration and the focus-index clamp. |
| [src/domain/quickSignals.js](../src/domain/quickSignals.js) | `domain` | The rules behind the deck's one-tap Too Easy / Too Hard buttons (TODO §24.4): what counts as a disposable quick tap versus something the trainer WROTE, which tags supersede each other, and the severity order behind a card's signal colour. Pure — the controller owns the mutation and the render. |
| [src/domain/sessionFocus.js](../src/domain/sessionFocus.js) | `domain` | Which plan item the trainer is looking at, as a `{ type, id }` ref that survives a URL, a cached session and a running timer (TODO §24.4). Holds BOTH directions of the round trip — item → ref and ref → index — in one module, because they were written in three places and one of them disagreed about standalone rests. |
| [src/domain/sessionHistoryRecord.js](../src/domain/sessionHistoryRecord.js) | `domain` | One live session projected into the record stored per participant (TODO §24.4) — `sessionItemRecord.js` owns the `exercises` array inside it, this owns the record around it. Also the planning-draft upsert: one open draft per client, keeping the id a deep link and the notification feed are keyed on. |
| [src/domain/circuitGrouping.js](../src/domain/circuitGrouping.js) | `domain` | The invariants that make a circuit a circuit (TODO §24.5): members contiguous in the flat plan array, one shared title/round count per circuit, and set counts + round counters tracking the series. A circuit is not a container in the data, so this is maintained rather than enforced by structure — and every way of breaking it yields a plan that still looks plausible. |
| [src/domain/notificationItems.js](../src/domain/notificationItems.js) | `domain` | What the notification feed says, derived from state (TODO §24.7). STORED items carry i18n keys so the feed re-localises on a language switch; SYNTHETIC items (unscheduled plans, unreviewed feedback) are computed fresh and never stored — they are work the trainer owes, and a stored copy would drift from `state.history`/`state.planUpdates`. Synthetic leads, because outstanding work outranks FYI. |
| [src/domain/sessionRecord.js](../src/domain/sessionRecord.js) | `domain` | The session form's output (TODO §24.7): the dashboard row a REAL session becomes, the slot-less meta a PLANNING session becomes instead, the day bucket, the time label, and the newly-assigned diff behind invites. The upsert MERGES, so editing a title cannot drop the `completed`/`duration` fields finishing a session stamped on it. |
| [src/i18n/index.js](../src/i18n/index.js) | `i18n` | Translation registry: one flat key→string map per locale (`en.js`, `sl.js`). Key parity enforced by unit tests. |
| [src/modules/sessionList/sessionsView.js](../src/modules/sessionList/sessionsView.js) | `view` | Modular view renderer for the Sessions dashboard: merges/sorts all sessions and groups them into the continuous timeline's per-day sections; owns its `<section id="view-clients">` shell markup. |
| [src/modules/sessionList/sessionsView.css](../src/modules/sessionList/sessionsView.css) | `styles` | Session booking cards, the sessions title bar/date-picker, the continuous timeline, and the floating "Create Session" button. |
| [src/modules/sessionList/sessionCard.js](../src/modules/sessionList/sessionCard.js) | `component` | Dashboard session-booking card that launches the clipboard on tap. |
| [src/modules/sessionList/sessionTimeline.js](../src/modules/sessionList/sessionTimeline.js) | `component` | Continuous, time-ordered dashboard timeline: scrollspy focus tracking, sticky-header offset sync (ResizeObserver), Today/date-jump navigation (renders its own `#sessions-date-picker` markup). |
| [src/modules/clipboard/activeSessionBoard.js](../src/modules/clipboard/activeSessionBoard.js) | `component` | Everything the active-session clipboard PAINTS (TODO §24.3): client tabs, injury banner, focus panel, the title bar's edit-mode chrome, Start/Complete visibility, and the deck-or-editor body. Extracted from `activeSessionController.js`, which orchestrates rather than renders; wired purely by injection so the board stays independently mountable. |
| [src/modules/clipboard/editModeState.js](../src/modules/clipboard/editModeState.js) | `component` | Whether the clipboard is in inline plan-edit mode and which row is being worked on (TODO §24.3). Side-effect free — the three variables have different lifetimes (a flag, a one-shot call-out, a URL-carried row id) and conflating them is what this module prevents. |
| [src/modules/clipboard/clipboardEditor.js](../src/modules/clipboard/clipboardEditor.js) | `component` | Interactive active session plan/clipboard structure editor. |
| [src/modules/clipboard/activeSessionOverlayView.js](../src/modules/clipboard/activeSessionOverlayView.js) | `component` | Markup-only: the active-session overlay shell, the add-exercise dialog, and the catalog-picker dialog. No behavior — `activeSessionController.js` calls these at boot, then drives everything. |
| [src/modules/clipboard/activeSessionOverlay.css](../src/modules/clipboard/activeSessionOverlay.css) | `styles` | The fullscreen active-session overlay shell's own CSS — title bar, timer block, footer, overflow menu. Styles the overlay chrome; `activeSessionOverlayView.js` renders the markup into `#active-session-overlay`, `activeSessionController.js` drives it. |
| [src/modules/clipboard/clipboardEditor.css](../src/modules/clipboard/clipboardEditor.css) | `styles` | The inline editor's own CSS (TODO §14.5/§18.10) — row/circuit/rest editing, reorder control, insert bar. Loaded after index.css, whose foundation it inherits. |
| [src/modules/clipboard/deckCard.js](../src/modules/clipboard/deckCard.js) | `component` | Base class for one deck card (TODO — rest-focus redesign, mirrors `Route`/`route.js`): Template Method skeleton (collapsed vs. focused, then wire) that `ExerciseDeckCard`/`CircuitDeckCard`/`RestDeckCard`/`PastDeckCard` implement. |
| [src/modules/clipboard/exerciseDeck.js](../src/modules/clipboard/exerciseDeck.js) | `component` | Active-session exercise stack deck renderer — builds deck items, constructs the right `DeckCard` subclass per item, calls `.render()` uniformly. |
| [src/modules/clipboard/exerciseDeck.css](../src/modules/clipboard/exerciseDeck.css) | `styles` | Card-stack mechanics and the deck-card chrome SHARED by every card type (compact/top/timer/counter/status/name) — component-exclusive styling lives in that component's own file. |
| [src/modules/clipboard/exerciseCard.js](../src/modules/clipboard/exerciseCard.js) | `component` | `ExerciseDeckCard` — standalone exercise card in the clipboard deck. |
| [src/modules/clipboard/exerciseCard.css](../src/modules/clipboard/exerciseCard.css) | `styles` | exerciseCard.js's exclusive styling: stat tiles and the Too Easy / Too Hard / Notes action row. Shared deck-card chrome lives in exerciseDeck.css. |
| [src/modules/clipboard/circuitCard.js](../src/modules/clipboard/circuitCard.js) | `component` | `CircuitDeckCard` — circuit/giant-set grouped block card. |
| [src/modules/clipboard/restDeckCard.js](../src/modules/clipboard/restDeckCard.js) | `component` | `RestDeckCard` — a standalone rest, first-class and focusable like any other plan item; its focused template is what fixes the collapsed-card-starts-its-timer bug. |
| [src/modules/clipboard/pastDeckCard.js](../src/modules/clipboard/pastDeckCard.js) | `component` | `PastDeckCard` — the client's most recent past session as a tappable reference card; its "focus" is `expandedPastId`, not `activeExerciseIndex`. |
| [src/modules/clipboard/circuitCard.css](../src/modules/clipboard/circuitCard.css) | `styles` | circuitCard.js's exclusive styling: round badge, per-exercise rows, feedback trio, break rows, complete-round button. |
| [src/modules/clipboard/exerciseAndRestTimer.js](../src/modules/clipboard/exerciseAndRestTimer.js) | `component` | Session exercise and rest countdown timer stack. |
| [src/modules/clipboard/exerciseAndRestTimer.css](../src/modules/clipboard/exerciseAndRestTimer.css) | `styles` | The floating per-client timer stack's own styling: overtime/stopped/flash states. |
| [src/modules/session/sessionBar.js](../src/modules/session/sessionBar.js) | `component` | The live-clipboard bar (`#clipboard-bar`) in the notification handle bar: names the clipboard — every merged session's title, never "the session" — carries its countdown/overtime, and is one tap back into it. Active state only; the old idle "next session" state was dropped as planning information that did not earn permanent space. |
| [src/modules/session/sessionTitleBar.js](../src/modules/session/sessionTitleBar.js) | `component` | Active-session overlay title line and countdown. |
| [src/modules/session/editSessionView.js](../src/modules/session/editSessionView.js) | `view` | Modular view renderer for Edit Session & Setup view; owns the `#view-workout-setup` shell and `#dialog-workout-setup`'s markup. |
| [src/modules/session/editSessionView.css](../src/modules/session/editSessionView.css) | `styles` | The compact workout-setup dialog: participant picker, checklists. |
| [src/modules/session/editSessionControl.js](../src/modules/session/editSessionControl.js) | `component` | Pre-session edit/setup control modal dialog. |
| [src/modules/session/sessionInviteDialog.js](../src/modules/session/sessionInviteDialog.js) | `component` | "Send calendar invites" dialog (TODO §1.1): offers each newly PT-assigned participant a downloadable `.ics` + prefilled mailto compose; owns `#dialog-session-invite`'s markup. |
| [src/modules/session/sessionInviteDialog.css](../src/modules/session/sessionInviteDialog.css) | `styles` | The invite dialog's per-participant row and send-button states. |
| [src/modules/session/sessionStartTimeDialog.js](../src/modules/session/sessionStartTimeDialog.js) | `component` | "Session started off schedule" dialog: raised (non-blocking, after the session is already running) when Start lands more than ±15 minutes from the scheduled slot, prefilled with the slot shifted onto the clock; owns `#dialog-session-start-time`'s markup. |
| [src/modules/plans/plansView.js](../src/modules/plans/plansView.js) | `view` | Modular view renderer for Plans (formerly Routines) catalog and template editor; owns `#view-routines` and `#dialog-routine`'s markup. |
| [src/modules/plans/plansView.css](../src/modules/plans/plansView.css) | `styles` | Routine template cards + the routine builder dialog's exercise list rows. |
| [src/modules/plans/planAdjustments.js](../src/modules/plans/planAdjustments.js) | `component` | Pending Plan Adjustments deck & interactive Apply wizard; owns `#view-adjustments` and `#dialog-apply-adjustment`'s markup. |
| [src/modules/clients/clientsView.js](../src/modules/clients/clientsView.js) | `view` | Modular view renderer for Client Directory & Client profile views; owns `#view-client-directory`/`#view-client-detail`'s markup. |
| [src/modules/clients/clientsView.css](../src/modules/clients/clientsView.css) | `styles` | Client directory cards + client detail layout (profile, avatar, weight-history chart). |
| [src/modules/clients/clientsDirectory.js](../src/modules/clients/clientsDirectory.js) | `component` | Client Directory grid component. |
| [src/modules/clients/clientConsentSection.js](../src/modules/clients/clientConsentSection.js) | `component` | The GDPR consent block of the Add/Edit Client dialog: signed checkbox, the date on the signed paper, the form version stamp, email/SMS delivery of the consent letter, and the "you keep the signed form" dialog; owns `#dialog-consent-info`'s markup. |
| [src/modules/exercises/exercisesView.js](../src/modules/exercises/exercisesView.js) | `view` | Modular view renderer for Exercise taxonomy catalog view; owns `#view-exercises`/`#dialog-exercise`'s markup. |
| [src/modules/exercises/exercisesView.css](../src/modules/exercises/exercisesView.css) | `styles` | Exercise library card items (muscle/taxonomy badges, instructions). |
| [src/modules/exercises/exercisePicker.js](../src/modules/exercises/exercisePicker.js) | `component` | Reusable exercise picker with taxonomy filter chips. |
| [src/modules/exercises/exercisePicker.css](../src/modules/exercises/exercisePicker.css) | `styles` | The reusable filtered exercise picker (routine builder + gym-floor swap + catalog picker). |
| [src/modules/history/historyView.js](../src/modules/history/historyView.js) | `view` | Modular view renderer for workout history logs; owns `#view-history`'s markup. |
| [src/modules/history/historyView.css](../src/modules/history/historyView.css) | `styles` | History card items, the feedback icon/tooltip, and structured history rows. |
| [src/modules/common/utils.js](../src/modules/common/utils.js) | `helper` | Shared formatting, date conversion, and string helper functions. |
| [src/modules/common/dom.js](../src/modules/common/dom.js) | `helper` | DOM helper utilities and modal helpers. |
| [src/modules/common/download.js](../src/modules/common/download.js) | `helper` | Blob-anchor client-side file download, shared by JSON backup export and calendar-invite `.ics` download. |
| [src/modules/common/wakeLock.js](../src/modules/common/wakeLock.js) | `helper` | Screen Wake Lock API management helper. |
| [src/modules/common/activeUsersList.js](../src/modules/common/activeUsersList.js) | `component` | Active-session participant tabs component. |
| [src/modules/common/activeUsersList.css](../src/modules/common/activeUsersList.css) | `styles` | The participant-tabs row's own styling — wraps onto multiple rows for a merged group session. |
| [src/modules/common/applicationHeader.js](../src/modules/common/applicationHeader.js) | `component` | Shared top header actions, theme/lang switchers, and sync badge; owns the `#app-header` shell's markup and `#dialog-about`/`#dialog-terms`. |
| [src/modules/common/applicationHeader.css](../src/modules/common/applicationHeader.css) | `styles` | The top app header: logo, build stamp, preview badge, sync/backup button, the ☰ overflow menu. |
| [src/modules/common/backupRestore.js](../src/modules/common/backupRestore.js) | `component` | Backup center dialog and JSON import/export handlers; owns `#dialog-backup`'s markup, including the Google Drive card driveSyncUi.js wires up. |
| [src/modules/common/backupRestore.css](../src/modules/common/backupRestore.css) | `styles` | The Sync & Backup Center dialog's action cards. |
| [src/modules/common/driveSyncUi.js](../src/modules/common/driveSyncUi.js) | `component` | Wires the "Cloud Backup (Google Drive)" card in `#dialog-backup` to driveSyncService.js: connect/sync-now/disconnect and status rendering. |
| [src/data/googleAuth.js](../src/data/googleAuth.js) | `helper` | Google Identity Services token-client wrapper (TODO §1.5): lazily loads the GIS script only on first use, holds the access token in memory only. |
| [src/modules/common/feedbackModal.js](../src/modules/common/feedbackModal.js) | `component` | Feedback tags modal dialog and voice recorder handler; owns `#dialog-feedback`'s markup. |
| [src/modules/common/feedbackModal.css](../src/modules/common/feedbackModal.css) | `styles` | The feedback dialog's privacy-first voice-note recorder waveform animation. |
| [src/modules/common/notificationArea.js](../src/modules/common/notificationArea.js) | `component` | Toast and banner notification area handler; owns the `#notification-area` shell's markup. |
| [src/modules/common/notificationArea.css](../src/modules/common/notificationArea.css) | `styles` | The omnipresent bottom notification/status area, including the embedded active-session mini bar. |
| [src/modules/splash/splashScreen.js](../src/modules/splash/splashScreen.js) | `component` | Cold-start splash: dismisses `#app-splash` once the app has booted AND a minimum hold has elapsed (`max(5s, boot)`). With an empty database it instead becomes the onboarding entry point (demo data / guided walkthrough / start empty) and waits for a choice. `?splash=off` disables both. |
| [src/modules/splash/splashScreen.css](../src/modules/splash/splashScreen.css) | `styles` | The splash overlay: themed background (`--bg-color`/`--bg-gradient`, so it matches whatever theme is set), staggered entrance animations, indeterminate progress sweep, the onboarding action stack, and a static frame under `prefers-reduced-motion`. |
| [src/modules/common/buildInfoDialog.js](../src/modules/common/buildInfoDialog.js) | `component` | Tappable build identity (commit, data schema, build time) as a copyable dialog — the phone-reachable replacement for a hover tooltip; owns `#dialog-build-info`'s markup. |
| [src/modules/common/buildInfoDialog.css](../src/modules/common/buildInfoDialog.css) | `styles` | The build-info dialog's fact rows. |
| [src/modules/common/consentForm.js](../src/modules/common/consentForm.js) | `component` | The one wording of the GDPR consent letter the app sends, its version stamp, and the `mailto:`/`sms:` builders behind the two delivery buttons. Pinned to [docs/templates/Client_Consent_Form.md](templates/Client_Consent_Form.md) by a unit test so the shipped text and the printable template cannot drift. |
| [src/modules/themes/](../src/modules/themes/) | `styles` | Theme-specific CSS stylesheets (`daylight.css`, `midnight.css`, `red.css`, `blossom.css`, `nebula.css`). |
| [src/fonts/](../src/fonts/) | `assets` | Locally-vendored variable webfonts (DM Sans, Outfit, JetBrains Mono; latin + latin-ext) + `fonts.css`, and Font Awesome 6.4.0 + `fontawesome.css` since 2026-08-05 — so the offline-first PWA has no `fonts.googleapis.com`/`fonts.gstatic.com`/`cdnjs.cloudflare.com` dependency at all (regeneration steps in each CSS header). |
| [src/controllers/routerController.js](../src/controllers/routerController.js) | `controller` | SPA route mapping and navigation logic: base path, history writes, and the facade of operations a route may perform; owns `#view-error`'s markup. |
| [src/controllers/routes/route.js](../src/controllers/routes/route.js) | `controller` | Base `Route` class: pattern ↔ params translation (`match`/`build`), specificity, and the shared enter/exit chrome lifecycle. |
| [src/controllers/routes/routeRegistry.js](../src/controllers/routes/routeRegistry.js) | `controller` | The ordered route collection: register, resolve a path to one route by specificity, and spell a URL for a named route. |
| [src/controllers/routes/dialogRoute.js](../src/controllers/routes/dialogRoute.js) | `controller` | `DialogRoute` / `GlobalDialogRoute`: a <dialog> as an addressable state layered over a parent route's view, so Back closes it and a reload reopens it. |
| [src/controllers/routes/viewRoute.js](../src/controllers/routes/viewRoute.js) | `controller` | `ViewRoute` (a `#view-*` on screen, optionally re-rendered) and `RedirectRoute` (rewrite one URL into another, render the target in place). |
| [src/controllers/routes/sessionRoutes.js](../src/controllers/routes/sessionRoutes.js) | `controller` | Routes that resolve a record first: session timeline, live/recovered session (focus + edit modes), workout setup, client detail. |
| [src/controllers/routes/routeTable.js](../src/controllers/routes/routeTable.js) | `controller` | Every addressable state of the app as data — the route patterns, stored without the base path so they stay version-agnostic. |
| [src/controllers/appLifecycleController.js](../src/controllers/appLifecycleController.js) | `controller` | PWA runtime lifecycle: SW registration, integrity-error page, online/offline state. |
| [src/controllers/clientFormsController.js](../src/controllers/clientFormsController.js) | `controller` | Client create/edit dialog: markup + wiring; owns `#dialog-client`. |
| [src/controllers/routineFormsController.js](../src/controllers/routineFormsController.js) | `controller` | Routine create/edit dialog and its exercise-picker-backed builder list; owns `#dialog-routine`. |
| [src/controllers/exerciseFormsController.js](../src/controllers/exerciseFormsController.js) | `controller` | Custom-exercise create dialog, including the modality-driven metric selector; owns `#dialog-exercise`. |
| [src/modules/common/populateDropdownSelectors.js](../src/modules/common/populateDropdownSelectors.js) | `component` | Repopulates the routine `<select>` and session exercise `<datalist>` from current state — shared by all three form controllers and activeSessionController, so it isn't owned by any one of them. |
| [src/sw.js](../src/sw.js) | `service-worker` | Thin classic-worker entry: loads the sw/ modules via `importScripts` and wires the install/activate/fetch lifecycle events. |
| [src/sw/cacheManifest.js](../src/sw/cacheManifest.js) | `service-worker` | The offline cache's versioned identity (`CACHE_NAME`), the exact app-shell `ASSETS` set, and cache open/purge/write ops. |
| [src/sw/integrity.js](../src/sw/integrity.js) | `service-worker` | Loads the SHA-256 integrity catalog (`integrity.json`) and verifies each precached asset's hash. |
| [src/sw/precache.js](../src/sw/precache.js) | `service-worker` | The install-time verified atomic precache; fails loud (integrity error page) on an unverifiable build. |
| [src/sw/runtimeFetch.js](../src/sw/runtimeFetch.js) | `service-worker` | The runtime fetch strategy: network-first shell with offline cache fallback, cache-first for third-party assets. |
| [src/version.js](../src/version.js) | `entry` | Build/deploy stamp shown in the header so a screenshot pins a bug report to an exact build. The checked-in copy ships as `dev`; the build and the Pages deploy overwrite `dist/version.js` with the real short commit SHA. |
| [src/controllers/activeSessionController.js](../src/controllers/activeSessionController.js) | `controller` | The live gym-floor session: staging and starting a workout, focus/edit modes, per-exercise logging, quick signals, recovery from cache, and finishing into history. |
| [src/controllers/gestureController.js](../src/controllers/gestureController.js) | `controller` | Touch gestures: view title-bar drag/swipe-to-dismiss (70px commits the gesture). |
| [src/modules/common/renderRegistry.js](../src/modules/common/renderRegistry.js) | `component` | Structural guard for TODO §14.8: each view shell registers itself plus what must exist first, and a topological sort computes a valid render order — replacing a hand-ordered call list that silently no-op'd when a module queried an element rendered after it. |
| [src/modules/common/shareLink.js](../src/modules/common/shareLink.js) | `component` | Promo/share deep links for the demo instance: preselected UI language, colour theme, and the optional `?init=demo_data_load` dataset initializer. |
| [src/modules/common/theme.js](../src/modules/common/theme.js) | `component` | The one theme service (TODO §24.1): resolve / apply / persist / localize, plus the `#theme-switcher` wiring. In `modules/common/` rather than `controllers/` because it orchestrates nothing — the old `controllers/themeController.js` placement was unreachable from the header, which duplicated it instead. `src/theme-boot.js` keeps its own pre-paint copy of the map on purpose. |
| [src/modules/common/driveSyncUi.css](../src/modules/common/driveSyncUi.css) | `styles` | Styles for the Google Drive sync card inside the Sync & Backup dialog. |
| [src/i18n/domMappings.js](../src/i18n/domMappings.js) | `i18n` | Static DOM-selector → translation-key map, applied on every language switch. |
| [src/i18n/en.js](../src/i18n/en.js) | `i18n` | English translation dictionary (the fallback locale). |
| [src/i18n/sl.js](../src/i18n/sl.js) | `i18n` | Slovenian translation dictionary. |
| [src/data/clients.js](../src/data/clients.js) | `data` | Seed client roster for the demo dataset. |
| [src/data/exercises.js](../src/data/exercises.js) | `data` | Seed exercise catalog — the movement taxonomy's starting corpus. |
| [src/data/routines.js](../src/data/routines.js) | `data` | Seed routine/plan templates for the demo dataset. |
| [src/data/sessions.js](../src/data/sessions.js) | `data` | Seed sessions, generated relative to "now" so the demo dashboard always has a live/upcoming day. |
| [src/data/history.js](../src/data/history.js) | `data` | Seed completed-session history, including a structured program snapshot. |
| [src/data/planUpdates.js](../src/data/planUpdates.js) | `data` | Seed pending plan adjustments (unresolved client feedback) for the adjustments deck. |
| [src/data/messages.js](../src/data/messages.js) | `data` | Seed notification/message feed the notification area renders from. |
| [src/fonts/fonts.css](../src/fonts/fonts.css) | `styles` | LibrePT-vendored variable webfonts (DM Sans, Outfit, JetBrains Mono), latin + latin-ext only, so the offline-first PWA has zero third-party font origin. |
| [src/fonts/fontawesome.css](../src/fonts/fontawesome.css) | `styles` | LibrePT-vendored Font Awesome Free 6.4.0 (woff2 only), replacing the cdnjs stylesheet — the last cross-origin asset. Upstream-minified, so it is the one file Biome is configured to skip; regenerate by re-downloading rather than editing (steps in its header). |
| [src/modules/themes/daylight.css](../src/modules/themes/daylight.css) | `styles` | Daylight theme palette (the default). |
| [src/modules/themes/midnight.css](../src/modules/themes/midnight.css) | `styles` | Midnight theme palette. |
| [src/modules/themes/red.css](../src/modules/themes/red.css) | `styles` | Red theme palette. |
| [src/modules/themes/blossom.css](../src/modules/themes/blossom.css) | `styles` | Blossom theme palette. |
| [src/modules/themes/nebula.css](../src/modules/themes/nebula.css) | `styles` | Nebula theme palette. |
