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

## 2026-07-24 — Exercise modalities & a real security gate

### Added
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
