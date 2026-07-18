---
type: overview
title: LibrePT System Overview & Architecture
description: Core architectural overview, subsystems, and functional specification for the LibrePT Personal Trainer Management & Scheduling System.
status: active
tags:
  - architecture
  - personal-training
  - gym-floor-pwa
  - google-calendar-sync
---

# LibrePT - Personal Trainer Management & Scheduling System

[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-offline--first-06b6d4.svg)](manifest.json)
[![Stack](https://img.shields.io/badge/stack-vanilla%20JS%20%7C%20HTML5%20%7C%20CSS-f7df1e.svg)](#-technical-stack)
[![Tests](https://img.shields.io/badge/tests-pytest%20%2B%20playwright-10b981.svg)](tests/)

LibrePT is a comprehensive, client-centric, and business-enabling software ecosystem designed for personal trainers (PTs) to manage schedules, publish slots, handle client bookings, orchestrate workout sessions, track execution, create and manage asynchronous session scenarios, capture on-the-fly voice notes, and collect granular exercise feedback to enable planning of client progression. 

While the **mobile-first, offline PWA Gym Clipboard** is the core real-time tracking interface used on the gym floor, LibrePT is built as an end-to-end system that connects the trainer's scheduling back-office, client calendar invites, and program adjustments into a single unified database.

---

## 🚦 Quick Start

LibrePT is a dependency-free static PWA — no bundler, no install step, no build required to run it.

```bash
git clone https://github.com/stutek/LibrePT.git
cd LibrePT
python3 deploy/local_http_server.py     # dev server on http://localhost:8081
```

Then open <http://localhost:8081>; it redirects to <http://localhost:8081/LibrePT/>. `deploy/local_http_server.py` deliberately serves `src/` under the **same `/LibrePT/` sub-path GitHub Pages uses** (rewriting `<base>` and adding a deep-link SPA fallback), so local dev exercises the real production base path instead of hiding sub-path bugs behind a domain-root server. The app seeds itself with mock clients, routines, and sessions on first load, so the dashboard is immediately explorable.

> **Note**: Serve over HTTP rather than opening `index.html` via `file://` — the app loads ES modules and registers a Service Worker, both of which require an HTTP origin. A plain `python3 -m http.server -d src 8081` also works if you don't need the Pages sub-path, but then deep-link refreshes 404 locally.

**Data & privacy**: all state lives in the browser's `localStorage` under the `librept_db` key, and voice notes never leave the device. Use the header's cloud **Sync & Backup** button (cloud + ↻, with mock ahead/behind change counters) to sync session data or export/restore the database as JSON.

---

## 🧪 Development & Testing

The test suite runs static structure checks (`tests/test_app.py`) plus a Playwright end-to-end gym-floor flow (`tests/test_browser.py`) that drives a real Chromium browser against a local server.

```bash
# One-time environment setup
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/playwright install chromium

# Run the whole suite
.venv/bin/python -m pytest tests/ -v
```

The verify → build → deploy chain lives in the `build/` and `deploy/` packages, each runnable on its own and debuggable:

```bash
.venv/bin/python -m build                # env check → tests → bundle src/ into dist/
.venv/bin/python -m deploy               # publish the built dist/
.venv/bin/python -m build && .venv/bin/python -m deploy   # the whole chain
.venv/bin/python -m pdb -m build         # step-by-step debugging
```

---

## 🏗️ System Architecture & Subsystems

LibrePT is comprised of three major subsystems:

1. **The PT Clipboard Dashboard (Mobile Web/Native PWA)**
   - The trainer's core gym-floor interface.
   - Restricts active client views strictly to checked-in session participants to avoid logging errors.
   - **Sub-Second Participant Switching**: Frictionless switches between active participants with as few clicks and scrolls as possible.
   - **Primary Focus Card with Foreshadowing**: Prominently displays the active exercise (directions and target load) while offering a compact preview of the upcoming exercise ("Up Next") for proactive equipment setup.
   - **Low-Interaction Progression & Safety Signals**: One-tap action buttons to record *"Load Up Next Weight"* (progression), *"Step Back Load"* (regression), or *"Pain / Injury Flag"* without typing on a phone keyboard.
   - **Privacy-First Voice Notes (Local-Only)**: Triggered directly from the feedback UI and auto-mapped to the active exercise. Audio is stored locally on the device for async playback and on-device text conversion to protect client PII.
   - **Reversible Plan Pivot & Placeholder Injection**: Low friction session wipe/pivot with full undo capability. Low friction ability to inject generic placeholder cards when client fatigue or equipment delays force a sudden plan change.

2. **Google Calendar Booking & Sync Integration (Cloud APIs)**
   - **No Custom Client Web App Needed**: Rather than building and hosting a custom booking portal, LibrePT leverages **Google Calendar Appointment Schedules** out of the box.
   - **For Trainers**: PT publishes slots/schedules directly via Google Calendar (supporting recurring slot rules and guest capacity limits).
   - **For Clients**: Clients self-subscribe to slots via the standard Google-hosted scheduling page.
   - **Active Sync**: The LibrePT app queries the Google Calendar API to fetch session participant guest lists, automatically pre-loading the active clipboard with checked-in clients.

3. **Trainer Program Adjustments Deck (Back-Office)**
   - The desk-side workspace where feedback alerts and audio notes are reviewed to asynchronously edit client routine templates and plan progressive overload trajectories.

---

## 🚀 Key Functional Features

### 1. The PT Clipboard Dashboard (Main Gym Use Case)
*   **Single-Column Session Day Deck**: The dashboard schedule is a horizontally swipeable deck of day columns (`Yesterday → Today → Tomorrow → Upcoming`), showing exactly one day at a time at every viewport so the gym-floor phone view and the desk view stay identical. The deck is driven three ways, all kept in sync:
    *   **Swipe**: Scroll-snapped left/right swiping between days, which retitles the bar to whichever day it lands on.
    *   **Title Arrows**: `[ ‹ ]` / `[ › ]` in the title bar step to the previous/next day and disable at the ends of the deck. They are sized as wide tap targets for sweaty, one-handed use.
    *   **Day Title Bar**: Always names the day currently in focus by ISO date and weekday — `2026-07-15 Wednesday (Today)` — flagging the current day with a `(Today)` tag. The weekday is locale-aware (EN/SL) and abbreviates on narrow screens so the date and tag always stay readable on one line; the open-ended `Upcoming` bucket reads `Upcoming From 2026-07-17` instead of naming a weekday.
*   **Home Returns to Today**: Navigating home (LibrePT logo or the Clients tab) always pulls the deck back into focus on today, so the trainer never lands on a stale day left over from earlier browsing.
*   **Sub-Second Participant Switching**: Tapping participant tabs swaps views in under 50ms.
*   **Primary Focus Card with Foreshadowing**: Centers the current active exercise (directions, target load/reps, and action buttons) while offering a compact "Up Next" foreshadowing card (visible on larger screens or via a quick scroll) so the PT can prep equipment for smooth transitions.
*   **One-Tap Progression & Safety Signals**: Instant, low-interaction buttons to record outcome signals without opening a phone keyboard:
    *   `[ ⬆ Load Up Next ]`: Client completed cleanly; increase weight next session.
    *   `[ ⬇ Step Back ]`: Client struggled or broke form; reduce load next session.
    *   `[ ⚠️ Pain / Injury ]`: Immediately flag joint pain or acute discomfort on this movement.
*   **Privacy-First Voice Notes (Local-Only & Auto-Mapped)**: Triggered directly from the feedback UI, voice recordings automatically attach to the current exercise and client. All audio is stored locally on the device and transcribed asynchronously using local, on-device libraries only—preventing PII exposure to cloud transcription services.
*   **Reversible Plan Pivot & Session Wipe**: Low-friction action to wipe or pivot a client's planned session on the fly when fatigue, injury, or equipment delays occur. Fully undoable (`[ ↩ Undo ]`) and preserved in the audit history for later desk review.
*   **Generic Placeholder Card Injection**: When a session is wiped or pivoted, the PT can instantly inject low-friction placeholder cards (`[ Mobility & Core Flow ]`, `[ Machine Superset/Giant Set ]`, `[ Freestyle Block ]`) to continue tracking effort without typing new exercises from scratch and using voice notes on the new card too.
*   **Asynchronous Session Scenarios**: Guide multiple participants through separate, distinct individual routines in the same session slot.

### 2. Google Calendar Appointment Booking & Integration
*   **No Custom Web Hosting**: The PT creates recurring training slots directly in Google Calendar (using Appointment Schedules). Google auto-generates the public scheduling page.
*   **Self-Subscription**: Clients visit the Google-hosted page to book slots, entering their name and email.
*   **Automated Invitations**: Booking a slot adds the client to the Google Calendar event guest list, triggering a formal invite sent directly to their email inbox.
*   **Participant Lock Guard**: The LibrePT app queries the Google Calendar API to fetch the guest list, pre-loading the active session clipboard and locking client selection strictly to checked-in participants.

### 3. Closed-Loop Plan Feedback & Client Progression
*   **Granular Signal Processing**: Signals recorded on the gym floor (`Load Up`, `Step Back`, `Pain/Injury`) flow directly into the trainer's back-office review queue.
*   **Pending Program Adjustments Deck**: Feedback and voice notes compile into a desk workspace for the PT to review, allowing them to asynchronously plan client progression and update routine templates before the next session.

### 4. Deep-Linkable Clean URLs (App Routing)
*   **Every view and record is addressable by a clean URL**, so links are shareable and bookmarkable and restore the same screen on load:
    *   `/sessions/{YYYY-MM-DD}` — the day deck focused on a given day
    *   `/session/{sessionId}` and `/session/{sessionId}/client/{clientId}` — the active-session clipboard, optionally on a specific participant
    *   `/session/{sessionId}/client/{clientId}/exercise/{exerciseId}` and `…/superset/{circuitId}` — the clipboard with a specific card in focus. Opening the session upgrades the URL to whatever card is focused, and tapping a card updates it, so the address bar is always a copy-able link to the exact card on screen.
    *   `/clients/{clientId}` — a client detail page
    *   `/routines`, `/exercises`, `/history` — the primary views
*   **Omnipresent header**: the app header stays fixed in place across every view — dashboard, client detail, and the active-session clipboard — so it never jumps or re-flows between contexts. The active session view adds a context line beneath it reading `date time location` (e.g. `2026-07-17 10:00 Trib gym base`) with the live countdown.
*   **In-app Not-Found view**: a deep link that matches no route — or points at a deleted client — renders a not-found (404) view *inside* the content area, keeping the header and bottom navigation in place, with the bad path shown and a one-tap return to the dashboard. Unknown links are never silently redirected.
*   **Offline PWA shell**: the service worker serves the cached app shell for any in-scope navigation, so clean-URL deep links keep working offline (a basement gym with no signal).
*   **GitHub Pages sub-path support**: the public demo is served from a project sub-path (`stutek.github.io/LibrePT/`), not a domain root. The deploy step rewrites the HTML `<base>` to the repo sub-path and ships the shell as `404.html` (GitHub Pages' SPA fallback), while the router derives that same base from its own module URL — so assets load and deep links resolve wherever the app is mounted, with no code changes. The local dev server (`deploy/local_http_server.py`) mounts the app under the same `/LibrePT/` sub-path (with an equivalent base rewrite + SPA fallback), so development and the test suite run against the real production base path rather than masking sub-path bugs behind a domain-root server.

---

## 🛠️ Codebase Structure

The system is configured as a single codebase running on Web, iOS, and Android:

```
LibrePT/
├── src/                # The runtime PWA (served as web root locally, flattened into dist/ on deploy)
│   ├── index.html      # Application templates (dashboard, active-session overlay, modals, views)
│   ├── index.css       # Themed CSS custom properties, glassmorphic layouts, mobile viewport limits
│   ├── app.js          # State manager, view router, session logic, translation lookup, component wiring
│   ├── sw.js           # Service Worker for offline app-shell caching (PWA logic)
│   ├── manifest.json   # Web App Manifest for mobile PWA standalone styling
│   ├── data/           # Default database, split per entity (exercises, clients, routines, history, planUpdates, sessions)
│   ├── i18n/           # EN/SL translation dictionaries (key parity enforced by the test suite)
│   ├── components/     # Extracted UI components (session cards, exercise deck, header, plan adjustments, …)
│   └── icons/          # PWA install icons (dumbbell mark, matching the in-app logo and favicon)
├── build/              # Build steps (verify → build): env check, tests, bundle src/ → dist/ (python -m build)
├── deploy/             # Deploy step + local dev server (local_http_server.py) — python -m deploy
├── dist/               # Build output: flattened, base-rewritten app shell for GitHub Pages
├── requirements.txt    # Python test toolchain (pytest, playwright)
├── tests/              # Static structure checks + Playwright end-to-end gym-floor flow
├── use_cases/          # OKF functional workflow specifications (see use_cases/INDEX.md)
├── INDEX.md            # Master knowledge index for agents and contributors
├── AGENT_RULES.md      # Operating rules for AI agents contributing to this repository
├── CONTRIBUTING.md     # Development setup, testing, and documentation standards
├── CHANGELOG.md        # Notable changes, newest first
├── TODO.md             # Planned work & open questions backlog
├── okf.yaml            # OKF v0.1 catalog manifest
└── LICENSE             # MIT License
```

---

## ⚡ Technical Stack

*   **Core**: HTML5, Vanilla JavaScript (ES6+ ES modules), and Vanilla CSS custom properties driving a 5-theme system (Midnight, Daylight, Red, Blossom, Nebula) — no hard-coded theme colours.
*   **Internationalization**: Built-in EN/SL dictionaries with locale-aware date formatting via `Intl`.
*   **Data Sync**: Serverless Google Firebase (Firestore Database + Firebase Hosting) for real-time bookings.
*   **Third-Party APIs**: Google Calendar API (OAuth 2.0).
*   **Native Wrap**: **Capacitor** to wrap the HTML/CSS/JS code into native Android (.apk) and iOS (.ipa) app packages.

---

## 📚 Documentation Map

This repository follows Google's **Open Knowledge Format (OKF v0.1)**: every Markdown file carries YAML frontmatter, and every directory of knowledge files is catalogued by an `INDEX.md`.

| Document | Purpose |
| :--- | :--- |
| [INDEX.md](INDEX.md) | Master knowledge index — the navigation entrypoint for the whole catalog. |
| [use_cases/](use_cases/) | Functional workflow specifications, one file per actor-facing use case. |
| [AGENT_RULES.md](AGENT_RULES.md) | Operating rules for AI coding agents contributing to this repository. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to set up, test, and submit changes. |
| [okf.yaml](okf.yaml) | OKF catalog manifest declaring the spec version and entrypoint. |

---

## 🤝 Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, testing expectations, and documentation standards before opening a pull request.

Because LibrePT is used one-handed on a gym floor, changes are evaluated against real-world training friction: offline basement gyms, sweaty hands, sub-second participant switches, and sudden equipment pivots. Keep interactions low-tap and keyboard-free.

---

## 📄 License

LibrePT is released under the [MIT License](LICENSE).

Copyright (c) 2026 Simon Tutek.
