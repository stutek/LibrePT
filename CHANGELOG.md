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

## 2026-07-22 — Session setup view, security headers, resilience hardening

### Added
- **PREVIEW ribbon** — an always-visible amber pre-release marker next to the logo (`#preview-ribbon`, i18n `preview_ribbon`), theme-independent, pulsing only under `prefers-reduced-motion: no-preference`; the build stamp hides on phones to avoid header overflow. Standalone, decoupled from the multi-version `/preview/` machinery (TODO 16.2).
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
