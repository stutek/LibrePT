---
type: index
title: LibrePT Master Knowledge Index
description: Canonical navigation index for AI agents exploring the LibrePT specification and architecture catalog.
status: active
tags:
  - index
  - okf
  - navigation
---

# LibrePT Master Knowledge Index

This index provides AI agents and contributors with a structured navigation map of the LibrePT repository under Google's Open Knowledge Format (OKF v0.1).

## 1. Core Architecture & Operating Rules

| Document | Type | Description |
| :--- | :--- | :--- |
| [README.md](README.md) | `overview` | Canonical system architecture, domain subsystem definitions, high-level feature specifications, and quick start. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | `guidelines` | Human contributor guide: development setup, testing, code conventions, and documentation standards. |
| [TODO.md](TODO.md) | `roadmap` | Backlog of planned features, UX changes, and unresolved design questions awaiting brainstorming. |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | `architecture` | Data model & storage schema: IndexedDB layout, logical record model, star-write projections, migration order and retention. |
| [docs/ROUTING.md](docs/ROUTING.md) | `architecture` | Routing architecture: the Route class hierarchy and registry, specificity-based resolution, the `ctx` a route receives, routing invariants, and how to add a route. |
| [AGENT_RULES.md](AGENT_RULES.md) | `guidelines` | Mandatory interaction protocols, direct execution rules, and single-source-of-truth guardrails for AI agents. |
| [agent_tools/INDEX.md](agent_tools/INDEX.md) | `index` | Catalog of durable, repo-owned agent tools — run these instead of improvising a throwaway script, and the bar a new one must clear. |
| [okf.yaml](okf.yaml) | `manifest` | Root configuration manifest declaring OKF v0.1 compliance and catalog entrypoints. |
| [LICENSE](LICENSE) | `license` | MIT License terms governing use, modification, and distribution of LibrePT. |

## 2. Functional Use Cases (`use_cases/`)

| Use Case | Type | Primary Actor | Description |
| :--- | :--- | :--- | :--- |
| [uc1_gym_floor_clipboard.md](use_cases/uc1_gym_floor_clipboard.md) | `use_case` | Personal Trainer | Active gym-floor session orchestration using the mobile PWA clipboard, focus cards, plan pivots, placeholder cards (with voice notes), and one-tap signals. |
| [uc2_async_plan_adjustments.md](use_cases/uc2_async_plan_adjustments.md) | `use_case` | Personal Trainer | Back-office desk review of logged session signals, audio note playback, and progressive overload trajectories. |
| [uc3_publish_slots.md](use_cases/uc3_publish_slots.md) | `use_case` | Personal Trainer | Publishing recurring training availability slots via Google Calendar Appointment Schedules. |
| [uc4_client_self_subscription.md](use_cases/uc4_client_self_subscription.md) | `use_case` | Client | Self-service slot booking via Google-hosted scheduling pages and automated calendar invites. |
| [uc5_session_day_deck_and_deep_links.md](use_cases/uc5_session_day_deck_and_deep_links.md) | `use_case` | Personal Trainer | Dashboard's continuous, time-ordered session timeline (sticky day headers, scrollspy title bar, date-jump), clean deep-linkable URLs down to the in-focus clipboard card, and the in-app not-found view — with spec↔test traceability. |

3. Source Modules & UI Components (`src/modules/`)

The runtime app lives under `src/` (served as the web root locally and flattened into `dist/`
on deploy). It's a native ES-module app (`<script type="module" src="app.js">`). `src/app.js`
is structured into feature modules under `src/modules/` (`session`, `plans`, `clients`, `exercises`, `history`, `common`, `themes`) and data under `src/data/`.

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
| [src/app.js](src/app.js) | `entry` | Application bootstrapper: root initialization, dependency injection wiring, and global lifecycle hooks. |
| [src/index.html](src/index.html) | `shell` | The app shell: `<head>`, the integrity-error overlay, and empty canvases every other module renders into. |
| [src/index.css](src/index.css) | `styles` | Shared design-system tokens and foundations only (buttons, cards, modals, form controls, resets) — per-feature rules live in each module's own `.css`. |
| [src/theme-boot.js](src/theme-boot.js) | `entry` | Render-blocking classic script that sets the theme class before paint (anti-FOUC) and forces http→https; external so CSP `script-src` can forbid `'unsafe-inline'`. |
| [src/data/stateStore.js](src/data/stateStore.js) | `data` | Central app state management (TODO §18.6 part 4): the in-memory state object stays synchronous, but load-at-boot and save-on-write now run through IndexedDB via a one-time, revertable import from the legacy `localStorage` bucket — falls back to plain `localStorage` if IndexedDB is unavailable. |
| [src/data/storageNamespace.js](src/data/storageNamespace.js) | `data` | The app's plain `localStorage` keys (TODO §16.5/§16.3, both resolved): no bucket-keying scheme here any more — the schema axis lives in IndexedDB's per-schema stores, and `librept_db` is now only the one-time legacy import source / no-IndexedDB fallback. |
| [src/data/indexedDb.js](src/data/indexedDb.js) | `data` | IndexedDB adapter (TODO §18.6): one database with one object store per schema — the layout that lets a single transaction write every live schema atomically — plus promise wrappers that resolve on commit. |
| [src/data/storageDurability.js](src/data/storageDurability.js) | `data` | Storage durability (TODO §18.6/§18.8): requests eviction-proof storage, and reports risk by measuring the consequence (quota, persistence) rather than sniffing for private browsing. |
| [src/data/writeQueue.js](src/data/writeQueue.js) | `data` | Write-behind persistence queue (TODO §18.6): serialises async writes behind a synchronous call so saves can never land out of order, and surfaces failures instead of swallowing them. |
| [src/data/schemaMigrations.js](src/data/schemaMigrations.js) | `data` | **Legacy chain runner, awaiting deletion (TODO §16.5).** Chains are *not* the architecture: [TODO §18](TODO.md) decided **star writes** — every record projected directly from the live domain object into each live schema, no step feeding another. This walks the old v1→v2→v3 chain and is kept only until the projections replace it. Do not extend it. |
| [src/data/migrationSteps.js](src/data/migrationSteps.js) | `data` | `CURRENT_SCHEMA_VERSION` and the pure per-version transforms. The version constant survives star writes (it is what storage buckets key on, TODO §16.3); the ordered *chain* around it does not. |
| [src/data/recordSchemas.js](src/data/recordSchemas.js) | `data` | Declared per-collection record shapes, per live schema major (TODO §18.1/§18.4) — the first place "schema N" exists as data rather than as a side effect of a migration transform. `fieldIssues`/`isRecordValid` are the structural validator every projection is held to. |
| [src/data/recordProjections.js](src/data/recordProjections.js) | `data` | The star-write projection layer (TODO §18.1): one function per collection, domain object → IndexedDB record, plus the inverse (`groupRecordsByCollection`) that reassembles a flat record list back into `stateStore.js`'s in-memory shape. `projectionIssues()` is what proves a projection is total. |
| [src/data/index.js](src/data/index.js) | `data` | Barrel for seed/demo data: `exercises.js`, `clients.js`, `routines.js`, `history.js`, `planUpdates.js`, `sessions.js`. |
| [src/i18n/index.js](src/i18n/index.js) | `i18n` | Translation registry: one flat key→string map per locale (`en.js`, `sl.js`). Key parity enforced by unit tests. |
| [src/modules/sessionList/sessionsView.js](src/modules/sessionList/sessionsView.js) | `view` | Modular view renderer for the Sessions dashboard: merges/sorts all sessions and groups them into the continuous timeline's per-day sections; owns its `<section id="view-clients">` shell markup. |
| [src/modules/sessionList/sessionsView.css](src/modules/sessionList/sessionsView.css) | `styles` | Session booking cards, the sessions title bar/date-picker, the continuous timeline, and the floating "Create Session" button. |
| [src/modules/sessionList/sessionCard.js](src/modules/sessionList/sessionCard.js) | `component` | Dashboard session-booking card that launches the clipboard on tap. |
| [src/modules/sessionList/sessionTimeline.js](src/modules/sessionList/sessionTimeline.js) | `component` | Continuous, time-ordered dashboard timeline: scrollspy focus tracking, sticky-header offset sync (ResizeObserver), Today/date-jump navigation (renders its own `#sessions-date-picker` markup). |
| [src/modules/clipboard/clipboardEditor.js](src/modules/clipboard/clipboardEditor.js) | `component` | Interactive active session plan/clipboard structure editor. |
| [src/modules/clipboard/activeSessionOverlayView.js](src/modules/clipboard/activeSessionOverlayView.js) | `component` | Markup-only: the active-session overlay shell, the add-exercise dialog, and the catalog-picker dialog. No behavior — `activeSessionController.js` calls these at boot, then drives everything. |
| [src/modules/clipboard/activeSessionOverlay.css](src/modules/clipboard/activeSessionOverlay.css) | `styles` | The fullscreen active-session overlay shell's own CSS — title bar, timer block, footer, overflow menu. Styles the overlay chrome; `activeSessionOverlayView.js` renders the markup into `#active-session-overlay`, `activeSessionController.js` drives it. |
| [src/modules/clipboard/clipboardEditor.css](src/modules/clipboard/clipboardEditor.css) | `styles` | The inline editor's own CSS (TODO §14.5/§18.10) — row/circuit/rest editing, reorder control, insert bar. Loaded after index.css, whose foundation it inherits. |
| [src/modules/clipboard/deckCard.js](src/modules/clipboard/deckCard.js) | `component` | Base class for one deck card (TODO — rest-focus redesign, mirrors `Route`/`route.js`): Template Method skeleton (collapsed vs. focused, then wire) that `ExerciseDeckCard`/`CircuitDeckCard`/`RestDeckCard`/`PastDeckCard` implement. |
| [src/modules/clipboard/exerciseDeck.js](src/modules/clipboard/exerciseDeck.js) | `component` | Active-session exercise stack deck renderer — builds deck items, constructs the right `DeckCard` subclass per item, calls `.render()` uniformly. |
| [src/modules/clipboard/exerciseDeck.css](src/modules/clipboard/exerciseDeck.css) | `styles` | Card-stack mechanics and the deck-card chrome SHARED by every card type (compact/top/timer/counter/status/name) — component-exclusive styling lives in that component's own file. |
| [src/modules/clipboard/exerciseCard.js](src/modules/clipboard/exerciseCard.js) | `component` | `ExerciseDeckCard` — standalone exercise card in the clipboard deck. |
| [src/modules/clipboard/exerciseCard.css](src/modules/clipboard/exerciseCard.css) | `styles` | exerciseCard.js's exclusive styling: stat tiles and the Too Easy / Too Hard / Notes action row. Shared deck-card chrome lives in exerciseDeck.css. |
| [src/modules/clipboard/circuitCard.js](src/modules/clipboard/circuitCard.js) | `component` | `CircuitDeckCard` — circuit/giant-set grouped block card. |
| [src/modules/clipboard/restDeckCard.js](src/modules/clipboard/restDeckCard.js) | `component` | `RestDeckCard` — a standalone rest, first-class and focusable like any other plan item; its focused template is what fixes the collapsed-card-starts-its-timer bug. |
| [src/modules/clipboard/pastDeckCard.js](src/modules/clipboard/pastDeckCard.js) | `component` | `PastDeckCard` — the client's most recent past session as a tappable reference card; its "focus" is `expandedPastId`, not `activeExerciseIndex`. |
| [src/modules/clipboard/circuitCard.css](src/modules/clipboard/circuitCard.css) | `styles` | circuitCard.js's exclusive styling: round badge, per-exercise rows, feedback trio, break rows, complete-round button. |
| [src/modules/clipboard/exerciseAndRestTimer.js](src/modules/clipboard/exerciseAndRestTimer.js) | `component` | Session exercise and rest countdown timer stack. |
| [src/modules/clipboard/exerciseAndRestTimer.css](src/modules/clipboard/exerciseAndRestTimer.css) | `styles` | The floating per-client timer stack's own styling: overtime/stopped/flash states. |
| [src/modules/session/sessionBar.js](src/modules/session/sessionBar.js) | `component` | Bottom active/next-session bar with countdowns. |
| [src/modules/session/sessionTitleBar.js](src/modules/session/sessionTitleBar.js) | `component` | Active-session overlay title line and countdown. |
| [src/modules/session/editSessionView.js](src/modules/session/editSessionView.js) | `view` | Modular view renderer for Edit Session & Setup view; owns the `#view-workout-setup` shell and `#dialog-workout-setup`'s markup. |
| [src/modules/session/editSessionView.css](src/modules/session/editSessionView.css) | `styles` | The compact workout-setup dialog: participant picker, checklists. |
| [src/modules/session/editSessionControl.js](src/modules/session/editSessionControl.js) | `component` | Pre-session edit/setup control modal dialog. |
| [src/modules/plans/plansView.js](src/modules/plans/plansView.js) | `view` | Modular view renderer for Plans (formerly Routines) catalog and template editor; owns `#view-routines` and `#dialog-routine`'s markup. |
| [src/modules/plans/plansView.css](src/modules/plans/plansView.css) | `styles` | Routine template cards + the routine builder dialog's exercise list rows. |
| [src/modules/plans/planAdjustments.js](src/modules/plans/planAdjustments.js) | `component` | Pending Plan Adjustments deck & interactive Apply wizard; owns `#view-adjustments` and `#dialog-apply-adjustment`'s markup. |
| [src/modules/clients/clientsView.js](src/modules/clients/clientsView.js) | `view` | Modular view renderer for Client Directory & Client profile views; owns `#view-client-directory`/`#view-client-detail`'s markup. |
| [src/modules/clients/clientsView.css](src/modules/clients/clientsView.css) | `styles` | Client directory cards + client detail layout (profile, avatar, weight-history chart). |
| [src/modules/clients/clientsDirectory.js](src/modules/clients/clientsDirectory.js) | `component` | Client Directory grid component. |
| [src/modules/exercises/exercisesView.js](src/modules/exercises/exercisesView.js) | `view` | Modular view renderer for Exercise taxonomy catalog view; owns `#view-exercises`/`#dialog-exercise`'s markup. |
| [src/modules/exercises/exercisesView.css](src/modules/exercises/exercisesView.css) | `styles` | Exercise library card items (muscle/taxonomy badges, instructions). |
| [src/modules/exercises/exercisePicker.js](src/modules/exercises/exercisePicker.js) | `component` | Reusable exercise picker with taxonomy filter chips. |
| [src/modules/exercises/exercisePicker.css](src/modules/exercises/exercisePicker.css) | `styles` | The reusable filtered exercise picker (routine builder + gym-floor swap + catalog picker). |
| [src/modules/history/historyView.js](src/modules/history/historyView.js) | `view` | Modular view renderer for workout history logs; owns `#view-history`'s markup. |
| [src/modules/history/historyView.css](src/modules/history/historyView.css) | `styles` | History card items, the feedback icon/tooltip, and structured history rows. |
| [src/modules/common/utils.js](src/modules/common/utils.js) | `helper` | Shared formatting, date conversion, and string helper functions. |
| [src/modules/common/recordId.js](src/modules/common/recordId.js) | `helper` | Record identity (TODO §18.2): UUIDv7 as fixed-width base62 — cryptographic collision resistance, and string sort order equal to creation order. |
| [src/modules/common/dom.js](src/modules/common/dom.js) | `helper` | DOM helper utilities and modal helpers. |
| [src/modules/common/repsAndLoad.js](src/modules/common/repsAndLoad.js) | `helper` | Polymorphic reps and equipment-derived load helpers. |
| [src/modules/common/exerciseModality.js](src/modules/common/exerciseModality.js) | `helper` | Exercise modality axis (strength/cardio/stretch/balance) and per-metric target formatting (time/distance/calories/watts/hold). |
| [src/modules/common/exerciseStandard.js](src/modules/common/exerciseStandard.js) | `helper` | Open-standard crosswalk: maps the catalog's category/equipment onto the wger dataset by canonical name for interchangeable JSON/CSV exports (UC6 §6). |
| [src/modules/common/sessionItemOrder.js](src/modules/common/sessionItemOrder.js) | `helper` | Explicit session-item ordering (TODO §17.5): dense `position` stamped by every writer, program-order reads, and the density + circuit-contiguity invariants that make a scrambled or partial item list detectable at rest. |
| [src/modules/common/sessionItemRecord.js](src/modules/common/sessionItemRecord.js) | `helper` | Immutable history program snapshot: typed items (exercise/rest + circuit grouping), shape guards, and `buildProgramSnapshot` keeping rests + skipped work. |
| [src/modules/common/sessionCache.js](src/modules/common/sessionCache.js) | `helper` | Active session local storage cache helper. |
| [src/modules/common/wakeLock.js](src/modules/common/wakeLock.js) | `helper` | Screen Wake Lock API management helper. |
| [src/modules/common/activeUsersList.js](src/modules/common/activeUsersList.js) | `component` | Active-session participant tabs component. |
| [src/modules/common/activeUsersList.css](src/modules/common/activeUsersList.css) | `styles` | The participant-tabs row's own styling — wraps onto multiple rows for a merged group session. |
| [src/modules/common/applicationHeader.js](src/modules/common/applicationHeader.js) | `component` | Shared top header actions, theme/lang switchers, and sync badge; owns the `#app-header` shell's markup and `#dialog-about`/`#dialog-terms`. |
| [src/modules/common/applicationHeader.css](src/modules/common/applicationHeader.css) | `styles` | The top app header: logo, build stamp, preview ribbon, sync/backup button, the ☰ overflow menu. |
| [src/modules/common/backupRestore.js](src/modules/common/backupRestore.js) | `component` | Backup center dialog and JSON import/export handlers; owns `#dialog-backup`'s markup. |
| [src/modules/common/backupRestore.css](src/modules/common/backupRestore.css) | `styles` | The Sync & Backup Center dialog's action cards. |
| [src/modules/common/feedbackModal.js](src/modules/common/feedbackModal.js) | `component` | Feedback tags modal dialog and voice recorder handler; owns `#dialog-feedback`'s markup. |
| [src/modules/common/feedbackModal.css](src/modules/common/feedbackModal.css) | `styles` | The feedback dialog's privacy-first voice-note recorder waveform animation. |
| [src/modules/common/notificationArea.js](src/modules/common/notificationArea.js) | `component` | Toast and banner notification area handler; owns the `#notification-area` shell's markup. |
| [src/modules/common/notificationArea.css](src/modules/common/notificationArea.css) | `styles` | The omnipresent bottom notification/status area, including the embedded active-session mini bar. |
| [src/modules/common/buildInfoDialog.js](src/modules/common/buildInfoDialog.js) | `component` | Tappable build identity (commit, data schema, build time) as a copyable dialog — the phone-reachable replacement for a hover tooltip; owns `#dialog-build-info`'s markup. |
| [src/modules/common/buildInfoDialog.css](src/modules/common/buildInfoDialog.css) | `styles` | The build-info dialog's fact rows. |
| [src/modules/themes/](src/modules/themes/) | `styles` | Theme-specific CSS stylesheets (`daylight.css`, `midnight.css`, `red.css`, `blossom.css`, `nebula.css`). |
| [src/fonts/](src/fonts/) | `assets` | Locally-vendored variable webfonts (DM Sans, Outfit, JetBrains Mono; latin + latin-ext) + `fonts.css`, so the offline-first PWA has no `fonts.googleapis.com`/`fonts.gstatic.com` dependency (regeneration steps in the `fonts.css` header). |
| [src/controllers/routerController.js](src/controllers/routerController.js) | `controller` | SPA route mapping and navigation logic: base path, history writes, and the facade of operations a route may perform; owns `#view-error`'s markup. |
| [src/controllers/routes/route.js](src/controllers/routes/route.js) | `controller` | Base `Route` class: pattern ↔ params translation (`match`/`build`), specificity, and the shared enter/exit chrome lifecycle. |
| [src/controllers/routes/routeRegistry.js](src/controllers/routes/routeRegistry.js) | `controller` | The ordered route collection: register, resolve a path to one route by specificity, and spell a URL for a named route. |
| [src/controllers/routes/dialogRoute.js](src/controllers/routes/dialogRoute.js) | `controller` | `DialogRoute` / `GlobalDialogRoute`: a <dialog> as an addressable state layered over a parent route's view, so Back closes it and a reload reopens it. |
| [src/controllers/routes/viewRoute.js](src/controllers/routes/viewRoute.js) | `controller` | `ViewRoute` (a `#view-*` on screen, optionally re-rendered) and `RedirectRoute` (rewrite one URL into another, render the target in place). |
| [src/controllers/routes/sessionRoutes.js](src/controllers/routes/sessionRoutes.js) | `controller` | Routes that resolve a record first: session timeline, live/recovered session (focus + edit modes), workout setup, client detail. |
| [src/controllers/routes/routeTable.js](src/controllers/routes/routeTable.js) | `controller` | Every addressable state of the app as data — the route patterns, stored without the base path so they stay version-agnostic. |
| [src/controllers/themeController.js](src/controllers/themeController.js) | `controller` | Unified theme manager. |
| [src/controllers/appLifecycleController.js](src/controllers/appLifecycleController.js) | `controller` | PWA runtime lifecycle: SW registration, integrity-error page, online/offline state. |
| [src/controllers/clientFormsController.js](src/controllers/clientFormsController.js) | `controller` | Client create/edit dialog: markup + wiring; owns `#dialog-client`. |
| [src/controllers/routineFormsController.js](src/controllers/routineFormsController.js) | `controller` | Routine create/edit dialog and its exercise-picker-backed builder list; owns `#dialog-routine`. |
| [src/controllers/exerciseFormsController.js](src/controllers/exerciseFormsController.js) | `controller` | Custom-exercise create dialog, including the modality-driven metric selector; owns `#dialog-exercise`. |
| [src/modules/common/populateDropdownSelectors.js](src/modules/common/populateDropdownSelectors.js) | `component` | Repopulates the routine `<select>` and session exercise `<datalist>` from current state — shared by all three form controllers and activeSessionController, so it isn't owned by any one of them. |
| [src/sw.js](src/sw.js) | `service-worker` | Thin classic-worker entry: loads the sw/ modules via `importScripts` and wires the install/activate/fetch lifecycle events. |
| [src/sw/cacheManifest.js](src/sw/cacheManifest.js) | `service-worker` | The offline cache's versioned identity (`CACHE_NAME`), the exact app-shell `ASSETS` set, and cache open/purge/write ops. |
| [src/sw/integrity.js](src/sw/integrity.js) | `service-worker` | Loads the SHA-256 integrity catalog (`integrity.json`) and verifies each precached asset's hash. |
| [src/sw/precache.js](src/sw/precache.js) | `service-worker` | The install-time verified atomic precache; fails loud (integrity error page) on an unverifiable build. |
| [src/sw/runtimeFetch.js](src/sw/runtimeFetch.js) | `service-worker` | The runtime fetch strategy: network-first shell with offline cache fallback, cache-first for third-party assets. |
