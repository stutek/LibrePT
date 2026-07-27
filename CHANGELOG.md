---
type: changelog
title: LibrePT Changelog
description: Chronological record of shipped changes to LibrePT — features added, changed, and fixed, newest first.
status: active
tags:
  - changelog
  - okf
  - history
---

# LibrePT Changelog

Shipped changes, newest first. Backlog and open questions live in [TODO.md](TODO.md); completed backlog items graduate here once they are older than a week.

Format follows [Keep a Changelog](https://keepachangelog.com): grouped into **Added**, **Changed**, **Fixed**.

---

## 2026-07-27 — Continuous, time-ordered session timeline

### Added
- **Sessions carry a real `startDate`** — the dashboard's day model was four bucket labels (`yesterday|today|tomorrow|upcoming`) plus a free-text time-range string, with no actual date anywhere. Schema 3 (`src/data/migrationSteps.js`, `recordSchemas.js`) adds a required, absolute ISO timestamp, derived once for existing data and stamped directly on fresh seed data. `day` is untouched — overlap detection and card temporal tint still key off it.
- **The date-jump control** — a calendar-days button opens a native `<input type="date">` (`.showPicker()`); choosing a date scrolls the timeline straight to it, falling back to the nearest date with a session when the exact day chosen has none.
- **A dedicated Today button** — resets the timeline in one tap and disables itself once today is already focused (the markup and styling existed already; it had no wired behaviour until now).

### Changed
- **The four-column day-deck became one continuous, vertical, time-ordered timeline** — sessions render grouped under sticky per-day headers instead of paging through fixed yesterday/today/tomorrow/upcoming columns. An `IntersectionObserver` on the sticky headers replaces the old scroll-snap/swipe-clamp column detection; prev/next/Today/date-jump all resolve to a real ISO date. `daySelector.js` is renamed `sessionTimeline.js` to match. [UC5](use_cases/uc5_session_day_deck_and_deep_links.md) rewritten to match; `test_sessions_dashboard.py`'s three column-based tests replaced.

### Fixed
- **`focusActiveSessionCard` searched a container that no longer exists** — it queried `#today-sessions-list` directly, a leftover from the four-column markup; now searches the whole timeline (`routerController.js`).

## 2026-07-27 — Routing becomes a route table

### Added
- **The plan row you just touched survives a reload** — inserting or swapping a row in the inline editor now names it in the URL (`/session/{id}/client/{cid}/edit/exercise/{slotId}`). The call-out that highlights, scrolls to and focuses a fresh row was in-memory only, so a refresh mid-edit dropped the trainer into a long plan with nothing saying which row they were on. A **restored** row is deliberately not treated as a new one: it keeps the highlight and the scroll, but takes no caret (a reload must not pop the phone keyboard) and carries no *New* badge (nothing just happened to it). An id that no longer resolves is ignored and the segment drops, like a stale focus card. Covered by `test_editor_row_deeplink.py`.
- **[docs/ROUTING.md](docs/ROUTING.md)** — the routing architecture: the class hierarchy and the patterns it applies, specificity ordering, the `ctx` a route receives, the five invariants (no version in a path, patterns are additive, unknown routes 404 rather than redirect, URLs are built not spelled, no personal data in a path) and a checklist for adding a route. [UC5 §4](use_cases/uc5_session_day_deck_and_deep_links.md) stays the catalogue of *what* the URLs are.
- **The session's taxonomy picker is a route** — `/session/{id}/client/{cid}/edit/catalog`, and `…/catalog/slot/{slotId}` when swapping a specific row. A reload mid-browse reopens the picker over the restored editor instead of dropping the trainer back on the deck. The client id is already in the parent session URL, so this adds no new class of exposure.
- **The record editors are routes** — `/routines/new`, `/routines/{id}`, `/exercises/new` and `/adjustments/{updateId}`, each opening over its own list view. A routine link now opens that template's builder, a reload keeps the form (and its record) instead of dropping the trainer on a list, and Back backs out of the editor. Saving pops exactly one entry: the submit handler closes the dialog and the router turns that close into the matching pop, so Back after a save leaves the list rather than skipping a screen. Covered by `test_record_dialog_routes.py`.
- **Back closes a dialog** — About, Terms, build info and Sync & Backup are now routes (`/about`, `/terms`, `/build`, `/backup`), so the gesture a phone user already knows dismisses them, a reload reopens the one that was open, and the build stamp is a link a PT can paste into a bug report. The ✕, Cancel and Escape need no new wiring: `close` reaches a capturing listener even though it does not bubble, so one hook turns every existing close into the matching history pop. Arriving straight at a dialog URL synthesises the entry underneath it, so Back lands on the dashboard instead of leaving the app. The **first-run agreement is deliberately not routed** — it is a boot precondition, not a place the trainer navigated to, and Back must not dismiss an agreement that has not been accepted. Covered by `test_dialog_routing.py`.

### Changed
- **Routes resolve through a registry instead of a 27-branch `if/else`** — each addressable state is now a `Route` object owning its own pattern *and* what entering it does ([`routes/`](src/controllers/routes/routeTable.js)), and [`routerController.js`](src/controllers/routerController.js) only resolves and delegates. Three things the chain got wrong are structurally gone: the header/overlay lines that were copy-pasted into nine branches live once in the base class; `/session/new` outranking `/session/:sessionId` is now a property of the patterns (**literal segments win**) rather than of where a human wrote the branch; and a route no longer reaches for `document`, so routing is exercisable against stubs. Reverse routing (`urlFor`) makes a hand-spelled path unnecessary — which is what keeps patterns **version-agnostic**, since none of them ever sees the base path. Behaviour is unchanged, including the legacy `…/superset/{id}` focus spelling and the not-found view keeping the failed path in the address bar.

### Fixed
- **The session stopped overwriting its own dialogs' URLs** — the clipboard rewrites the address bar to whatever card is in focus on every render, guarded by two path-prefix tests that only ever excluded `/session/new` and `/session/setup/`. Every later route slipped through, so opening the taxonomy picker and typing one character erased the picker's URL. The sync now asks the router which route is active, and stands down entirely before the first route is entered — recovery renders at boot, ahead of routing, and a write there would erase the deep link the router is about to read ([`activeSessionController.js`](src/controllers/activeSessionController.js)).
- **A background re-render no longer bounces the URL off what the trainer is looking at** — the day deck reflected its focused day in the address bar whenever the dashboard redrew, guarded only by a "path does not start with `/session/`" test. Any other route slipped past it, so syncing from the Sync & Backup dialog pushed `/sessions/{date}` over the dialog's own URL and left Back reopening it. The guard now asks the router which route is actually active ([`daySelector.js`, since renamed `sessionTimeline.js`](src/modules/sessionList/sessionTimeline.js)); covered by `test_a_background_render_does_not_clobber_an_open_dialog`.
- **Tapping the build stamp no longer also navigates home** — it sits inside `#logo-area`, whose click goes to the dashboard. Harmless while the dialog merely opened on top; now that it is a route, the stray navigation closed it again ([`buildInfoDialog.js`](src/modules/common/buildInfoDialog.js)).
- **The build gate fixes formatting instead of printing a diff** — both lint steps checked without applying, so a run ended by asking a human to re-apply whitespace by hand and re-run the whole gate (which is what produced `c3cc369`). Ruff and Biome now write those fixes and the stage **names every file it rewrote**; findings that need a human decision are untouched, and the re-check without `--write` is still the verdict ([`build/__init__.py`](build/__init__.py)).

---

## 2026-07-27 — Data layer: record identity, IndexedDB engine, and schema projections

First steps of the star-write architecture (TODO §18): a data layer that writes every record to
all supported schema versions at once, so moving between app versions loses nothing either way.

### Added
- **Record identity moved to UUIDv7** ([`recordId.js`](src/modules/common/recordId.js)) — 122 bits of
  collision resistance plus lexicographic time-ordering, replacing a 41.4-bit `Math.random`
  generator that carried a 1.38% chance of at least one collision over five years of a very busy
  PT's records. All call sites switched to `newRecordId()`. **Decided (TODO §18.2, closed):**
  identity is the record's own `id` acting as a `lineageId` — no separate old-id→new-id mapping
  table; a set-difference completeness check gives migration the same guarantee a mapping table
  would have, at no extra storage cost.
- **IndexedDB engine, parts 1-3** — [`indexedDb.js`](src/data/indexedDb.js): one database, one
  object store per schema, transactions that resolve on commit, collection + client indexes
  (including a compound `byClientAndCollection` index for per-client queries).
  [`storageDurability.js`](src/data/storageDurability.js): requests eviction-proof storage on boot,
  reports risk by measuring the consequence (quota, `persist()`) rather than sniffing for private
  browsing. [`writeQueue.js`](src/data/writeQueue.js): write-behind persistence — reads stay
  synchronous against in-memory state, writes serialise through a queue. None of this is wired into
  `stateStore` yet (still on localStorage); this is the engine the eventual swap will run on.
- **Schemas exist as data** — [`recordSchemas.js`](src/data/recordSchemas.js) declares the current
  schema's per-collection field shapes, and [`recordProjections.js`](src/data/recordProjections.js)
  projects each live domain object into it, proven against real seed data and the actual object
  literals live writers build (not an idealised model), in `test_record_schemas.py`. This is the
  single-schema half of TODO §18.4's staging guard; the fan-out into an actual IndexedDB bucket and
  the cross-schema half both wait on a second live schema existing.

## 2026-07-27 — Explicit session-item ordering

### Added
- **Every session item carries a `position`** ([`sessionItemOrder.js`](src/modules/common/sessionItemOrder.js))
  — dense, unique `0..n-1` per session, so order is data rather than implied by array index. Writers
  stamp it at the one choke point they all funnel through (`saveActiveSessionToCache`), plus
  `buildProgramSnapshot` for the frozen history record, so a splice site added later cannot forget.
  Unblocks the eventual IndexedDB move (TODO §18.6 part 4): a key order is not a program order, so
  position must exist before the store stops guaranteeing list order. Covered by
  `test_session_item_order.py`. Full design rationale (why dense not gapped, why not a linked list):
  [DATA_MODEL §"Ordering"](docs/DATA_MODEL.md).

## 2026-07-27 — Rests become first-class, focusable plan items

### Changed
- **Polymorphic `DeckCard` hierarchy replaces the exercise deck's `if/else` dispatch** — started as a
  narrower bug (a collapsed standalone rest card started its timer on any tap instead of coming into
  focus like every other card) that exposed a structural gap: a rest item could **never** hold
  `activeExerciseIndex`, so there was no "focused rest" state to fix the bug on.
  [`deckCard.js`](src/modules/clipboard/deckCard.js) is now a Template Method base class (mirroring
  [`route.js`](src/controllers/routes/route.js)'s `Route`); `ExerciseDeckCard`
  ([`exerciseCard.js`](src/modules/clipboard/exerciseCard.js)), `CircuitDeckCard`
  ([`circuitCard.js`](src/modules/clipboard/circuitCard.js)), `RestDeckCard`
  ([`restDeckCard.js`](src/modules/clipboard/restDeckCard.js), new), and `PastDeckCard`
  ([`pastDeckCard.js`](src/modules/clipboard/pastDeckCard.js), extracted from an inline branch) each
  implement collapsed/focused rendering and their own focus rule. A rest is now deep-linkable as
  `/session/{id}/client/{cid}/rest/{restId}`. Four independent re-implementations of "is this a
  rest?" converged onto [`sessionItemRecord.js`](src/modules/common/sessionItemRecord.js)'s existing
  `isRestRecord`/`isExerciseRecord`. Scope: the active-session clipboard only — routine/plan
  templates are untouched.

## 2026-07-27 — Quick-signal toggles, insert-bar polish, and Assault Bike metrics

### Added
- **Assault Bike gained time and watts coverage, not just calories** — two sibling catalog entries,
  **Assault Bike (Time)** and **Assault Bike (Watts)**, next to the original calories entry
  ([`exercises.js`](src/data/exercises.js)), matching the one-machine-one-metric convention every
  other cardio machine already follows.

### Changed
- **Too Easy / Too Hard are now toggles, and Feedback is relabelled Notes** — a second tap on the
  same quick-signal removes it (`isPlainQuickSignal` guards a modal-authored entry from being
  touched by a re-tap); pressed state is visible (solid fill + `aria-pressed`); the two signals are
  mutually exclusive — tapping the opposite one silently swaps it, enforced from both the quick-tap
  path and the Notes-modal submit path via one canonical `enforceQuickSignalExclusivity`
  ([`activeSessionController.js`](src/controllers/activeSessionController.js)). The third button's
  warning-triangle icon/label ("Feedback") is now a note icon labelled **Notes**, matching what it
  actually does. Covered by `tests/e2e/test_quick_signal_toggle.py`.
- **The editor's insert bar hides `+Rest` next to an existing rest** — back-to-back rests are two
  waits with nothing between them, never a real plan shape
  ([`clipboardEditor.js`](src/modules/clipboard/clipboardEditor.js)); `+Exercise`/`+Circuit` stay
  available in every gap. Covered by `test_editor_insert_bar_rest_adjacency.py`.

---

## 2026-07-26 — One word for a grouped block: circuit

### Changed
- **"Superset" is now "circuit" everywhere** — UI labels (both locales), i18n keys, identifiers (`buildCircuitUnits`, `completeCircuitRound`, `renderCircuitCard`), CSS classes, the `supersetCard.js` module (now [`circuitCard.js`](src/modules/clipboard/circuitCard.js)), seed data and docs. The data always said `circuit*`; the UI drifted to *superset* the day after the feature shipped and stayed there. The words are not synonyms — a superset is two movements back-to-back, a circuit is a round-based block of three or more — and what the model stores is the round-counted one (`circuitSeries` **is** each member's set count), so the label was the half that was wrong.
- **Stored keys are untouched**, so this is a rename, not a schema major: `circuitId` / `circuitTitle` / `circuitSeries` read identically in old and new records and no migration runs. Two surfaces keep the old spelling working permanently — the `/session/…/superset/{id}` deep link (bookmarked and shared links must not start erroring; it resolves and the address bar rewrites itself to `/circuit/`) and a persisted `focusRef.type: "superset"` in a session cached by an older build, so a running timer keeps the card it belongs to. Covered by `test_legacy_superset_deep_link_still_resolves`.

### Fixed
- **Bookings still minted `session-${Date.now()}` / `plan-${Date.now()}` ids** ([`editSessionControl.js`](src/modules/session/editSessionControl.js)) — the one call site TODO §18.2 missed when identity moved to UUIDv7. Two bookings created in the same millisecond collided outright, and the id leaked its creation time; across devices a backup merge could silently overwrite one booking with another. Now `newRecordId()` like every other record. Existing ids are opaque strings and keep working untouched.

---

## 2026-07-25 — Plan editor: never lose the row you just touched

### Added
- **Just-touched plan item is called out in the inline editor** — inserting an exercise, superset or rest (from the live deck's fast-adjust bar, an editor insert bar, or the catalog) flips into edit mode with that row **highlighted, scrolled into view and holding the caret**, instead of dropping the trainer into a full-plan list where a fresh row is just another empty name field. A row inserted this way carries **no badge** — it lands blank and holding the caret, which is the announcement; the label is reserved for rows the catalog filled in, which take no focus (***New*** when injected, ***Swapped*** when retargeted in place). The call-out is **one-shot**: the next insert moves it and any other re-render clears it, so a highlight never outlives the moment it describes ([`clipboardEditor.js`](src/modules/clipboard/clipboardEditor.js), [`activeSessionController.js`](src/controllers/activeSessionController.js)); covered by `test_editor_new_item_callout.py`.
- **📖 catalog button on every plan-editor row** — the name combobox only serves a PT who already knows the movement's name, so each row now opens the **filtered taxonomy picker for that row** and swaps the movement **in place**: the slot keeps its id, set count and logs, so a swap changes *what is done*, never *what was done*. The picker opens pre-filtered on the row's muscle group, with the row's current movement excluded and any half-typed text carried across as the query; covered by `test_editor_row_catalog_swap.py` and documented in [UC6 §3.2](use_cases/uc6_exercise_taxonomy_and_picker.md).
- **Live search in the reusable exercise picker** — a focused search box filters by name, pattern, equipment or muscle group as the PT types, and **Enter takes the top match**, so a known movement costs a few letters instead of a scroll and an aimed tap ([`exercisePicker.js`](src/modules/exercises/exercisePicker.js)). Every picker surface (routine builder, gym-floor swap, plan editor) gains it.

### Changed
- **Filter chip rows are labelled by axis** — the exercise picker's *Muscle* and *Equipment* rows, and the Exercise Library's category row, now carry a leading label. Two unlabelled chip rows read as one wall of options and the **All** chip appears in both, so the label is the only thing saying which axis a tap resets ([`exercisePicker.js`](src/modules/exercises/exercisePicker.js)); covered by `test_filter_rows_are_labelled_by_axis`.

---

## 2026-07-25 — Offline-first hardening: vendored fonts, verified precache, modular service worker

### Added
- **SHA-256 integrity-verified precache** — the service worker now verifies every precached app-shell asset against a SHA-256 catalog (`integrity.json`) and **refuses to install an unverifiable build** (corrupt download, version-skewed file, or missing catalog), showing a blocking **integrity error page** with a retry instead of silently skipping. The catalog is generated by the build for production ([`build.generate_integrity_catalog`](build/__init__.py), written last so it covers the exact shipped bytes) and computed **live from `src/` by the dev server** ([`deploy/local_http_server.py`](deploy/local_http_server.py)), so the identical check runs in local dev, the e2e suite, and production — turning the module-version-coherence invariant from convention into enforcement. Covered by `test_integrity_catalog.py`, `test_dev_integrity_server.py`, and `test_integrity_verification.py`.
- **Routine-builder metric authoring by modality** (part of TODO §17.1) — picking a movement in the routine template builder relabels the primary field to its modality metric (reps / time / distance / cal / watts / …) and hides the load axis for non-load-bearing modalities, at parity with the inline clipboard editor ([`plansView.js`](src/modules/plans/plansView.js)); covered by `test_routine_builder_row_is_modality_aware`.

### Changed
- **Service worker split into single-responsibility modules** — [`sw.js`](src/sw.js) is now a thin **classic-worker** entry that wires the install/activate/fetch lifecycle to focused modules under [`src/sw/`](src/sw/) (`cacheManifest`, `integrity`, `precache`, `runtimeFetch`). Kept a classic worker (`importScripts`, `updateViaCache:"none"`) rather than a module worker so offline caching keeps working on every browser that can run the app. See the README "Service Worker architecture" section.
- **Clipboard title** — the active-session title placeholder now reads **"Clipboard"** instead of "Live Session".

### Fixed
- **Google Fonts blocked under CSP on first load** — the webfonts (DM Sans, Outfit, JetBrains Mono) are now **vendored locally** under [`src/fonts/`](src/fonts/) (variable woff2, latin + latin-ext for Slovenian), ending the CSP-blocked `fonts.googleapis.com` fetch that broke fonts on a signal-less / incognito first load and violated offline-first. The Google Fonts origins are dropped from the CSP; only Font Awesome remains CDN-hosted.

---

## 2026-07-25 — Open-standard catalog exports

### Added
- **Open-standard crosswalk** (completes TODO §13.1) — the exercise catalog now maps onto the open **wger Workout Manager** dataset (chosen over proprietary ExRx) so exports are universally interchangeable with external research / coaching tools ([`exerciseStandard.js`](src/modules/common/exerciseStandard.js)). The mapping key is the canonical **name** — wger's numeric PKs are per-instance and don't round-trip — so `category` → wger `ExerciseCategory` (`Core`→`Abs`) and `equipment` → wger `Equipment` (bodyweight → `none (bodyweight exercise)`). LibrePT is a **superset**: its biomechanical `pattern` and richer `modality`/`metric` axes have no wger field, so they're preserved under an `x_librept` extension, and terms the standard lacks (Cardio/Recovery categories, Cable/Machine equipment) map to an explicit **null** rather than a wrong best-fit (`unmappedTerms()` surfaces the gaps). The **Sync & Backup** dialog gains an *Export Catalog* card that downloads the live catalog (custom movements included) as a self-describing interchange **JSON** envelope or a side-by-side crosswalk **CSV**. Covered by `test_exercise_standard.py`; documented in [UC6 §6](use_cases/uc6_exercise_taxonomy_and_picker.md). Section 13 (Exercise Library & Movement Taxonomy) is now complete.

---

## 2026-07-25 — Editor & session-completion polish

### Added
- **"Add from catalog" button in the inline plan editor** — opens the reusable filtered taxonomy
  picker (`mountExercisePicker`) in `#dialog-catalog-picker`; tapping a movement injects it into the
  active plan (fresh slot id + taxonomy fields, defaults 3×10, adjustable inline) via
  `injectExerciseIntoActivePlan` and returns to the editor. Covered by `test_catalog_picker_in_edit.py`.

### Fixed
- **Exercise catalog filter chips overflowed off-screen** — the `.filter-chips` row used
  `overflow-x` with a hidden scrollbar, pushing trailing chips unreachably off-screen on a phone.
  Now `flex-wrap`, consistent with `.picker-chips`, so every filter stays visible.
- **"Complete Workout Session" showed while editing the plan or running a planning-mode programme**
  — completing an in-edit or never-run session logs a meaningless execution to history. The whole
  finish bar (`.session-actions-footer`, `#btn-finish-session`) now hides whenever edit-plan mode or
  `isPlanning` is active, and returns on exit since every mode change re-renders through
  `renderActiveGroupBoard`. Covered by `test_edit_mode_hides_complete.py`.

---

## 2026-07-24 — Exercise modalities & a real security gate

### Added
- **More exercise types & cardio metrics** (extends TODO §13.3) — the modality axis gains **isometric** (a hold *under load* — weighted plank, wall sit, overhead hold) and **agility** (speed/coordination drills logged in time / distance / reps), and cardio gains **pace** (min/km) and **heart-rate** (bpm) metrics. The load axis is now decided centrally by `usesLoad` (strength + isometric carry load; cardio, holds, agility don't), and the custom-create metric selector is populated per modality. Seed movements added for each; covered by `test_exercise_modality.py`. Brings coverage in line with the recognised health- + skill-related fitness components ([UC6 §5](use_cases/uc6_exercise_taxonomy_and_picker.md)); only HIIT/rounds remains reserved-but-unbuilt.
- **Structured session history** (TODO §17.1) — a finished session now persists the **whole program** as an immutable snapshot ([`sessionItemRecord.js`](src/modules/common/sessionItemRecord.js)), not just performed sets. History records store a flat list of typed items — exercises and first-class **rests** — with **superset grouping** (via `circuitId`, folded at render like the live deck) and a **completed** flag per exercise, so **prescribed-but-skipped** movements are kept (rendered greyed with a *Skipped* badge) instead of dropped. The History view renders superset groups, rest chips, greyed skips, and per-modality metrics; re-opening a past session rebuilds the full live plan (rests + circuits + modality) from the snapshot. Additive and back-compatible — legacy flat rows and the seed render unchanged behind a shape guard. Covered by `test_session_item_record.py`; the demo dataset gains a structured record + cardio/balance/stretch cards in the demo session.
- **Exercise modalities** (TODO §13.3 / the modality field of §17.1) — a movement is no longer always sets × reps × load. Each carries a **modality** ([`exerciseModality.js`](src/modules/common/exerciseModality.js)): **strength** (default), **cardio** (logged against **time / distance / calories / watts** — assault bike, rower, ski-erg, watt bike, treadmill), and **stretch** / **balance** (a **hold-time**). Like reps/load, the raw target is stored on the item and its meaning derived at render, so routines/sessions/history need **no migration**. The focus card, compact row, past-session peek, plans preview and history log show the right unit and drop the load tile for non-strength work; the focus timer seeds the target duration for time-bound cardio/holds. Custom-create gains a modality selector (cardio also picks its metric); the catalog and picker flag non-strength movements with a highlighted modality badge. Covered by `test_exercise_modality.py`; documented in [UC6 §5](use_cases/uc6_exercise_taxonomy_and_picker.md).

### Changed
- **OWASP ZAP is now a real, enforced build gate.** It previously ran without host networking (so it reached nothing → exit 3) and swallowed every non-zero exit as success. Now the container runs with `--network host` so it truly scans the app, the dev server serves real security headers (CSP-as-header, Permissions-Policy, Referrer-Policy, COOP, scrubbed `Server`), `script-src` drops `'unsafe-inline'` (the theme bootstrap moved to [`theme-boot.js`](src/theme-boot.js); two inline `onclick`s became delegated listeners), and a non-zero ZAP exit **fails the build**. Remaining alerts are triaged in [`deploy/zap/zap-baseline.conf`](deploy/zap/zap-baseline.conf) with written justifications — result: `FAIL-NEW: 0, WARN-NEW: 0`. Codified as a squeaky-clean-builds rule in [AGENT_RULES.md §2.A.3](AGENT_RULES.md).

---

## 2026-07-23 — Fixes

### Fixed
- **Late-evening session cards silently failed to launch.** The demo generates session times relative to now, so after ~21:00 a live session's range crossed midnight (e.g. `"22:00 - 00:00"`); `parseTimeRange` read it as inverted (`end < start`), so `isTimeOverlapping` matched nothing — not even itself — `getOverlappingBookings` returned `[]`, and clicking the card did nothing. `parseTimeRange` now treats an end at/before the start as crossing into the next day. This was exposed when the 18:00 demo-hours clamp was dropped (TODO 1.4). Guarded by a clock-mocked regression test (`test_session_launch_time_of_day.py`) so it's no longer time-of-day dependent.

---

## 2026-07-22 — Session setup view, security headers, resilience hardening

### Added
- **PREVIEW ribbon** — an always-visible amber pre-release marker next to the logo (`#preview-ribbon`, i18n `preview_ribbon`), theme-independent, gently pulsing under `prefers-reduced-motion: no-preference`. It's a **clickable link with a help (?) icon** opening the risks & data-loss notice ([docs/PREVIEW.md](docs/PREVIEW.md)). On phones the logo wordmark truncates so the tag, build stamp, and controls all stay visible. Standalone, decoupled from the multi-version `/preview/` machinery (TODO 16.2).
- **Session setup as a first-class view** (`editSessionView.js`), reached from an edit (✎) icon on each session card: configure a session's **start time, end time, date, name, location** (combobox), and **assigned program** up-front instead of discovering them after booking (TODO 1.5). Start time rounds to the next `:00`/`:30`, end defaults to +1h, with data-loss warnings and a discard-changes action.
- **Interactive demo invitation** shown on the empty dashboard (TODO 9.3), with reset/reload demo data callable straight from the notification card.
- **Security headers**: Content-Security-Policy and related `<meta>` tags in `index.html`; HTTPS redirect enforced for non-localhost HTTP requests.
- **`pip-audit`** vulnerability scanning wired into `python -m build`, with `setuptools` pinned.
- Rendering optimizations: `content-visibility` on off-screen views, `modulepreload` for cold boot, and `DocumentFragment` batching in list/table renders (TODO 15.3, 15.4).

### Changed
- **`app.js` / `index.html` / `index.css` broken down for single responsibility** — router/navigation, app lifecycle, active-session storage cache, and screen wake-lock extracted into their own modules; legacy `window.*` bridge wrappers dropped (TODO 14.x).
- Session times use ISO/24h formats; session-setup layout is compact with a participant filter.
- Removed the obsolete **Log Workout Session** button from the Client Detail view.
- CI split into **parallel lint + test phases**, with the Pages deploy gated on `pytest`.

### Fixed
- **One-day-per-swipe clamp on the day deck**: a hard flick's fling momentum could carry the native snap deck two columns (today→upcoming) in a single swipe; the settled column is now clamped to one step from where the swipe began.
- **Service worker** ignores non-`http(s)` schemes (e.g. `chrome-extension`) in `fetch` and `cachePut`, via an explicit scheme check with informative logging.
- Silent `try/catch` blocks across the app replaced with explicit `console.warn`/`debug` logging.
- Create-Session FAB and the sticky title bar stay visible while browsing the session list.
- Eliminated the theme flash on reload (synchronous head script; old theme classes stripped in `applyTheme`).

## 2026-07-21 — Session-card status lines, global timer stack, view split, GDPR consent

### Added
- **Unified session-card status line** on every card — live countdown, upcoming countdown, and an **editable** past-elapsed time (TODO 2.3). `finishWorkoutSession` now stamps `completed`/`duration` onto the booking so a dynamically-finished session can show its past line.
- **Global clipboard timer stack**: active timers stay visible on **all** views, **tap-to-focus** deep-links to the card that owns the timer, and finishing a superset **freezes** (not closes) a still-running timer; per-client labelled/overtime/persisted timers, plus a count-up timer for cards without a prescribed duration (TODO 13.4).
- **Homepage split into three first-class views** — Sessions, Pending Adjustments (`/adjustments`), Client Directory (`/clients`) — each reachable from the ☰ menu, with a pending-adjustments count badge (TODO 4.8). Edit Plan action added to pending-adjustment cards.
- **GDPR client consent tracking**: profile consent checkbox + status badge, a `mailto:` consent-form trigger, and a PII-stripped **AI Safe Copy** action (TODO 3.4).
- **Professional exercise taxonomy**: exercises carry `equipment` + `pattern`; the catalog shows taxonomy badges (no instructions); a filtered picker powers routine building and gym-floor swaps; custom creation enforces muscle group + equipment + pattern; reps/load are polymorphic (TODO 13.2, UC6).
- **Screen Wake Lock** held during active sessions (TODO 15.2); extracted core modules and Font Awesome fonts added to the service-worker precache, `CACHE_NAME` bumped (TODO 15.1).
- **☰ header menu** (Connect cloud storage placeholder, Export data, GitHub, About, Terms) and a mandatory **first-run terms & disclaimer** modal persisted in `localStorage` (TODO 10.1, 10.2).
- **App boots empty**; demo data is opt-in via the `?init=demo_data_load` deep-link and never clobbers real records (TODO 9.1). Header **sync ahead/behind badge** (TODO 3.2).

### Changed
- Dropped the **18:00 clamp** on demo session hours so demo sessions can run late (TODO 1.4).
- Timers show `HH:MM` (not `HH:MM:SS`); upcoming icon swapped to fast-forward; hours zero-padded.
- Removed the redundant per-column session-header row; the day column now starts at the first card.
- **Body-weight tracking UI removed** (hidden, `weightHistory` left dormant so data survives) (TODO 6.1).
- Header controls harmonized to `44px`; session title/date typography aligned to the view-header font (TODO 4.6, 4.7).
- Documentation sweep: `okf.yaml`, README, CONTRIBUTING, INDEX refreshed for the `src/` layout and 5-theme system; UC5 written up for the day deck / deep links; GDPR guidance moved to `PRIVACY.md` + `docs/templates/` (TODO 12.1, 12.2, 12.6).

### Fixed
- Two e2e tests broken by the intentional 2h **session-staleness-on-reload** discard (TODO 13.5).
- **Nebula** theme timer flash-warning made perceptually consistent across all five themes (TODO 13.6).
- Ruff/Biome formatting across `src/` and `tests/`, unblocking the silently-failing Pages deploy (TODO 12.7).
- `daylight` theme `--secondary` was leaking `midnight`'s violet.

## 2026-07-16 — Clipboard redesign, realistic demo, GitHub Pages

### Added
- **Vertical stacked exercise cards** in the gym-floor clipboard: the in-focus card is full-size (sets/reps/weight), the rest collapse to an overlapping peek showing name + a labelled `S4 × R6 × 60kg` target.
- **One-tap outcome logging** — `Too Easy` / `Too Hard` / `Feedback` buttons on the focus card replace the per-set stepper grid. Completions carry into saved session history; feedback stays per-person.
- **Feedback-tinted card titles**: an exercise title turns green (Too Easy), amber (Too Hard), or red (a note / voice memo / safety flag), matching the action-button colours.
- **Session status bar** — active state shows session name, client count, scheduled time, and a countdown that can go negative on overrun; the whole row is clickable. Idle state is colour-distinct and names the next upcoming session (merging parallel sessions).
- **Wrapping participant tabs**: many merged participants wrap onto multiple rows instead of scrolling out of view.
- **Session readiness states**: a *Completed* badge (muted, green edge) and warnings for a session missing its **program** or its **participants**.
- **Delete Session** action tucked into a header overflow (⋯) menu, out of the primary action row so it can't be mis-tapped mid-set.
- **Realistic demo dataset**: 7 clients, varied routines and multi-set history; a `SEED_VERSION` guard refreshes demo data on existing databases; session 1 is seeded as a live, half-finished workout with participants at varied completion.
- **GitHub Pages deployment** via a GitHub Actions workflow that publishes an app-only `dist/` on every push to `main`.

### Changed
- Renamed **Sync Sessions → Sync Data** and **Launch Clipboard → Session Details** (EN + SL).
- Session times switched to **24-hour `HH:MM`** (ISO-style), dropping AM/PM.
- Removed the **Up Next foreshadowing card** and the redundant exercise-detail widget — upcoming work is legible from the card stack itself.

### Fixed
- **Afternoon session cards would not open**: `parseTimeRange` ignored AM/PM, inverting afternoon time ranges and breaking overlap detection.
- **Clipboard overlay did not scroll**: content past the fold — the historical-review panel opened by a past (purple) card, plus the Complete/Delete actions — was clipped and unreachable.
- **Service Worker served stale builds**: same-origin fetch now uses `cache: no-store`, so a normal reload picks up new deploys.
