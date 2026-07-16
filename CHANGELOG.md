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

Shipped changes, newest first. Backlog and open questions live in [TODO.md](file:///home/simon/Projects/LibrePT/TODO.md); completed backlog items graduate here once they are older than a week.

Format follows [Keep a Changelog](https://keepachangelog.com): grouped into **Added**, **Changed**, **Fixed**.

---

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
