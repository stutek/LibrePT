---
type: architecture
title: LibrePT Code Architecture
description: How the front end is organised and why — file granularity, the import layering, dependency injection, and the design invariants a change must respect.
status: active
tags:
  - architecture
  - modularity
  - okf
---

# LibrePT Code Architecture

The front end is a **buildless native-ES-module app** under `src/`: no bundler, no npm at runtime,
every file served as written. Many small single-responsibility files step few large ones — less
context to load, fewer collisions, and a tree that documents itself.

Related: [SRC_MODULES.md](SRC_MODULES.md) catalogues every module; [DATA_MODEL.md](DATA_MODEL.md)
holds storage and schemas; [ROUTING.md](ROUTING.md) holds the router; [tests/INDEX.md](../tests/INDEX.md)
holds the test tiers and what an assertion may look at.

## File granularity

- **One responsibility per file**, extracted as soon as it grows inside `src/app.js`.
- **Every module opens with a comment** naming that responsibility and its injected dependencies,
  and carrying the constraint or decision the code cannot state. Names carry *what*, comments carry
  *why*; dead code is deleted rather than commented out.
- **Organised by concern**: UI in `src/modules/`, records at rest in `src/data/`, the training
  vocabulary in `src/domain/`, wiring in `src/controllers/`.
- **`src/` is the runtime app only.** It ships wholesale into `dist/`, so documentation, tooling and
  CI live outside it, and no source sits loose at the repository root.
- Any module added, moved or removed updates [SRC_MODULES.md](SRC_MODULES.md) in the same change —
  gated by `agent_tools/catalog_coverage.py`.

## Layering and dependency injection

```
data/ → domain/ → modules/common/ → modules/<feature>/ → controllers/ → app.js
```

Each layer imports only from strictly below, gated by `agent_tools/import_layers.py`. `data/` is
records at rest; `domain/` is the training vocabulary and is pure.

Components are **decoupled by dependency injection, never by cross-imports**: they receive `state`,
`t`, `escapeHTML` and callbacks, and a reassigned global is passed as an accessor rather than read.
Importing *sideways or up* costs a module its independent mountability, which the medium test tier
depends on — that tier mounts one component and nothing else.

## Design invariants a change must respect

- **Prefer repeating a thing to adding a layer whose only job is to choose between cases** — a
  `kind` field plus a dispatcher. Duplicated *logic* is still extracted.
- **A side effect added at a shared seam is scoped to the event that motivated it.** Enumerate what
  else calls that seam, including re-entry with identical arguments, and test the other callers
  through their real controls.
- **A condition that can already hold when a step begins cannot detect that step finishing.** Before
  writing "wait until X", ask what X reads at the first instant.
- **A rule that moves A to clear B must not be able to move B**, or, re-evaluated on a timer, it
  oscillates forever.

## Themes and styling

- **A theme is a stylesheet, not a palette.** Each theme owns one file in `src/modules/themes/`: its
  tokens on `html.<name>-theme`, and any component it restyles — shape, spacing, borders, shadows —
  under the same class. Ruled 2026-09-13 (TODO §49): a palette alone cannot make a spreadsheet look
  like a spreadsheet, because the grid is spacing and edges, not colour.
- **Theme files load after every module stylesheet**, so a theme's rule wins over the component's
  on order as well as on specificity.
- **Look and layout live only in CSS.** JavaScript and templates set classes and state attributes;
  a declaration written on the element (`el.style.gap`, `style="…"`) beats every stylesheet, so no
  theme can reach it. A number only the running code knows — a measured height, a drag offset —
  goes to CSS as a custom property.

## UI invariants

- **A record dialog writes into the record as it is typed; it keeps no draft beside it.**
  The client, exercise and routine dialogs go through
  [`modules/common/liveRecordForm.js`](../src/modules/common/liveRecordForm.js): a new record exists
  from the first typed character, Cancel undoes, and any other way out finishes the record. A record
  still open in its dialog is counted as it was before the dialog opened
  ([`data/openRecordEdits.js`](../src/data/openRecordEdits.js)), so the ahead count and the backup
  warning rise only once it is finished. Ruled 2026-09-17 (TODO §50.2).
- **Hide a control with the `.hidden` class, never the `hidden` attribute.** Every `.btn` sets
  `display: flex`, which beats the user-agent stylesheet's `[hidden]` rule, so the control stays on
  screen and only a test notices.
- **Visibility is inherited.** Anything measuring whether a node is visible inherits every
  ancestor's state: a closed `<dialog>` draws nothing, so everything parented inside it reads as
  invisible.
- **Nothing is built with `innerHTML` from translated or user text** — nodes are created and strings
  set as `textContent`, so copy cannot become markup and the content-security policy stays honest.
