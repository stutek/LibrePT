---
type: reference
title: Font Awesome upstream faces
description: The unmodified upstream woff2 files the shipped icon subsets are cut from.
status: active
tags:
  - fonts
  - vendored
---

# Font Awesome upstream faces

The two **unmodified** Font Awesome Free 6.4.0 woff2 files, kept here rather than in `src/` because
they are not shipped: the app serves subsets of them (`src/fonts/librept-icons*.woff2`, 7KB instead
of 252KB), and `src/` is the runtime app.

They are committed so that regenerating the subsets needs nothing but the repository —
`python -m agent_tools.font_subset` reads them from here. Without them the next person to add an icon
would have to find the exact upstream version again, and "the same version" is the whole reason the
subset can be verified against a recorded render ([agent_tools/glyph_render.py](../../agent_tools/glyph_render.py)).

Licence: SIL OFL 1.1 (fonts), CC BY 4.0 (icons) — see [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
