---
type: guidelines
title: LibrePT Contribution Guide
description: Development setup, testing expectations, coding conventions, and documentation standards for contributors to the LibrePT repository.
status: active
tags:
  - contributing
  - workflow
  - testing
  - okf
---

# Contributing to LibrePT

Thanks for your interest in LibrePT. This guide covers how to set the project up, how to verify changes, and the conventions a pull request is expected to follow.

For the system architecture and feature specification, see [README.md](README.md). If you are an AI coding agent, read [AGENT_RULES.md](AGENT_RULES.md) first.

---

## 1. Design Principles

LibrePT is used one-handed, mid-set, on a noisy gym floor — often on a phone with no signal in a basement. Every change is judged against that reality:

- **Low-interaction first**: Prefer one-tap actions over typing. The phone keyboard is a last resort.
- **Mobile-first, single-column**: The gym-floor phone view is the primary view. Layouts show one thing at a time rather than dense multi-column grids.
- **Offline by default**: The app must stay fully usable with no network. Nothing on the critical path may block on a remote call.
- **Privacy-first**: Voice notes and client PII stay on the device. Do not add cloud transcription or third-party analytics.
- **No build step**: The app is dependency-free vanilla HTML/CSS/JS served statically. Do not introduce a bundler or a runtime framework.

---

## 2. Development Setup

The app itself needs no install — only a static server:

```bash
git clone https://github.com/stutek/LibrePT.git
cd LibrePT
python3 -m http.server -d src 8081   # the app is in src/; then open http://localhost:8081
```

The Python toolchain is needed only to run the tests:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/playwright install chromium
```

> Serve over HTTP rather than `file://` — the app uses ES modules and a Service Worker, which require an HTTP origin.

---

## 3. Testing

Run the full suite (linting + automated tests) before opening a pull request:

```bash
.venv/bin/python -m build check
```

Or run the test suite directly:

```bash
.venv/bin/python -m pytest tests/ -v
```

| Suite | Covers |
| :--- | :--- |
| [tests/test_app.py](tests/test_app.py) | Static integrity: file structure, manifest icons, `staticMappings` selectors resolving against `index.html`, and seed data structure. |
| [tests/unit/](tests/unit/) | Non-browser structural checks: EN/SL translation key parity (`test_i18n_parity.py`), DOM id/selector mappings (`test_dom_mappings.py`), and project layout (`test_project_layout.py`). |
| [tests/e2e/](tests/e2e/) | Playwright end-to-end suites in real Chromium: the sessions dashboard, clipboard launch, session deep-link routing, the gym-floor smoke flow, and the not-found/error view. |

The verify → build → deploy chain lives in the `build/` and `deploy/` packages, each runnable on its own and debuggable:

```bash
.venv/bin/python -m build                # env check → tests → bundle into dist/
.venv/bin/python -m deploy               # publish the built dist/
.venv/bin/python -m build && .venv/bin/python -m deploy   # full chain
.venv/bin/python -m pdb -m build         # step-by-step
```

### Verifying the session timeline by hand

The dashboard's session timeline (TODO §7.3 item 8) is one continuous **vertical** scroll — plain
mouse wheel, trackpad, or touch all work with no emulation needed, unlike the old horizontal
day-deck this replaced. The title-bar `◀`/`▶`/Today/date-jump controls are there for a fast,
discrete jump; scrolling itself is standard native browser behaviour.

This is covered automatically by `test_scrolling_the_timeline_updates_the_focused_day` and
`test_date_jump_control_scrolls_to_chosen_date`.

**Testing notes:**

- The browser suite serves the repository root on port 8081 and reuses an already-running server if one is bound. A stale server left over from an earlier session will silently serve outdated files — kill it if results look impossible.
- CDP's `Input.synthesizeScrollGesture` does **not** scroll overflow containers in this headless setup — it silently does nothing, which reads as a broken swipe. Build gestures from raw `Input.dispatchTouchEvent` sequences instead (see `_touch_swipe`), and calibrate against a plain control deck before concluding the app is at fault.
- The Service Worker serves same-origin app code network-first, so a normal reload picks up your edits while the app stays fully usable offline. If the server is down or unreachable, the SW falls back to its cache and you will be looking at the last build it saw — check the server before trusting what you see.
- Bump `CACHE_NAME` in `sw.js` when releasing: `activate` purges every cache that does not match it.

---

## 4. Code Conventions

- **Vanilla only**: No frameworks, no bundlers, no CDN runtime dependencies on the critical path.
- **State**: [`data/stateStore.js`](src/data/stateStore.js) is the single source of truth — read it with `getState()`, replace it with `setState()`, and persist with `saveToLocalStorage()`. Route all mutations through it. Despite its name, `saveToLocalStorage()` writes to **IndexedDB** (star-writing the state into every live schema store in one transaction) and only falls back to a plain `librept_db` `localStorage` key when IndexedDB is unavailable.
- **Styling**: Use the CSS custom properties defined at the top of `index.css` (`--text-main`, `--text-muted`, `--border-color`, `--accent-cyan`, …). Do not hard-code theme colors — all five themes (Midnight, Daylight, Red, Blossom, Nebula) must work from the same properties.
- **Internationalization**: Every user-facing string goes in both the `en` and `sl` dictionaries under `src/i18n/` (`en.js` / `sl.js`, registered in `src/i18n/index.js`) and is read via `t('key')`. Key parity is enforced by the test suite (`tests/unit/test_i18n_parity.py`). Prefer `Intl` / `toLocaleDateString` for dates rather than hand-written month or weekday names.
- **Static translations**: Selectors in `staticMappings` overwrite an element's text content. Give a translated element its own `id` rather than relying on a positional selector — a positional selector will silently retarget when markup is reordered, and the tests only verify that the selector's root exists.

---

## 5. Documentation Standards (OKF v0.1)

All Markdown in this repository follows Google's **Open Knowledge Format (OKF v0.1)**:

1. **Frontmatter**: Every Markdown file begins with YAML frontmatter containing at minimum `type` (`overview`, `guidelines`, `use_case`, `index`), plus `title`, `description`, `status`, and `tags`.
2. **Directory indexing**: Every directory containing knowledge files maintains an `INDEX.md` catalog table listing each file, its `type`, and a clickable link. Adding a document means adding its index row in the same change.
3. **Graph interconnectivity**: Link related concepts with explicit Markdown links so the knowledge graph stays traversable.
4. **Single source of truth**: Do not duplicate feature specifications across files. Architecture and features live in [README.md](README.md); workflows live in [use_cases/](use_cases/). Link to them instead of restating them.

---

## 6. Pull Requests

1. Branch off `main`.
2. Keep the change focused, and update the documentation affected by it in the same PR.
3. Run the test suite, and add coverage for new user-facing behavior.
4. Describe the gym-floor problem the change solves — the ergonomics rationale matters as much as the diff.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
