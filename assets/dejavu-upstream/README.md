---
type: reference
title: DejaVu Sans, unmodified upstream
description: The face the app's symbol subset is cut from, kept out of src/ because it is not shipped.
tags:
  - fonts
  - third-party
---

# DejaVu Sans — upstream, not shipped

`DejaVuSans.ttf`, sha256 `b4c632e3cdf9acc7f28758fb5a323c8524d7fc6660d46904d9b6cbe2809c419c`, as
installed by Debian's `fonts-dejavu-core`.

The app serves `src/fonts/librept-symbols.woff2`, which is cut from this file by
[agent_tools/text_glyphs.py](../../agent_tools/text_glyphs.py) — eight characters the app writes into
its own sentences and no other vendored face carries: → ✓ ⚠ ☰ ✎ ✕ ▾ ⋯

It is committed for the reason the Font Awesome faces are: without it, the next person to put a new
symbol in a sentence would have to find the exact same file again, and "the same version" is what
makes a re-cut glyph comparable to the one it replaces.

Licence: Bitstream Vera Fonts Copyright (c) 2003 Bitstream, Inc., plus the DejaVu changes, which are
in the public domain. Both permit subsetting and redistribution and both reserve their names, so the
cut face is renamed and carries the notice in its own name table. See
[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
