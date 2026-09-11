---
type: guidelines
title: Third-Party Notices
description: Copyright and licence notices for the fonts and icons LibrePT redistributes in its published build.
status: active
tags:
  - licensing
  - attribution
  - fonts
---

# Third-Party Notices

LibrePT's own source is MIT-licensed (see [LICENSE](LICENSE)). This file covers the third-party
assets that are **vendored into `src/` and therefore redistributed** in every published build — the
webfonts, the icon font, and one JavaScript library. Their licences are separate from, and unaffected by, LibrePT's.

**Why this file exists.** These are not build-time dependencies that stay on a developer's machine;
they are bytes served to every visitor from GitHub Pages. The SIL Open Font License requires, in
clause 2, that *"each copy contains the above copyright notice and this license"*, and CC BY 4.0
requires attribution plus an indication of whether changes were made. Before this file, the vendored
Google Fonts shipped with **no notice at all** — the CSS that carries them documented why they were
vendored but named no copyright holder and no licence.

Nothing here is a restriction on using LibrePT. All of it is permissive; it just has to be *said*.

---

## Webfonts — SIL Open Font License 1.1

Vendored under [`src/fonts/`](src/fonts/) as `woff2`, latin + latin-ext subsets only, and declared by
[`src/fonts/fonts.css`](src/fonts/fonts.css). Subsetting to a unicode range is a permitted
modification; no glyph outlines were altered.

| Family | Copyright | Upstream |
| :--- | :--- | :--- |
| DM Sans | Copyright 2014 The DM Sans Project Authors | <https://github.com/googlefonts/dm-fonts> |
| Outfit | Copyright 2021 The Outfit Project Authors | <https://github.com/Outfitio/Outfit-Fonts> |
| JetBrains Mono | Copyright 2020 The JetBrains Mono Project Authors | <https://github.com/JetBrains/JetBrainsMono> |

Licence text: <https://openfontlicense.org> (SIL OFL 1.1). Each upstream repository ships the full
`OFL.txt`, which is the authoritative copy.

## qrcode-generator 1.5.2 — MIT

Copyright (c) 2009 Kazuhiko Arase. Vendored as [`src/vendor/qrcode.js`](src/vendor/qrcode.js),
fetched 2026-09-11 from `https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.5.2/qrcode.js`.
Upstream: <https://github.com/kazuhikoarase/qrcode-generator>. Full licence:
<https://opensource.org/licenses/mit-license.php>.

It draws the code a trainer holds up for a client to scan
([modules/common/qrCode.js](src/modules/common/qrCode.js)). It is here rather than fetched from a CDN
for the reason everything else in this app is: a gym has no signal, and a code that needs the network
to be drawn is one that fails exactly where it is used.

**Changes made**: one line. `export default qrcode;` and the comment above it, appended at the end.
The file's own UMD tail offers itself to AMD and CommonJS, and this app is plain ES modules with no
bundler, so without an export there is no way to reach it. Nothing above that line is edited —
[test_vendored_files.py](tests/unit/test_vendored_files.py) checksums the rest against upstream, and
`biome.json` keeps the formatter out of `src/vendor/`.

The words *QR Code* are a registered trademark of DENSO WAVE INCORPORATED, as upstream's own header
states.

## Font Awesome Free 6.4.0

Copyright 2023 Fonticons, Inc. Vendored as [`src/fonts/fontawesome.css`](src/fonts/fontawesome.css)
plus `librept-icons.woff2` and `librept-icons-brands.woff2`, which are **subsets** of the upstream
`fa-solid-900` and `fa-brands-400` faces. Full licence: <https://fontawesome.com/license/free>.

- **Icons** — CC BY 4.0
- **Fonts** — SIL OFL 1.1, Reserved Font Name *"Font Awesome"*
- **Code (CSS)** — MIT

**Changes made**, as CC BY 4.0 requires be indicated:

- The stylesheet was edited — `url()` targets repointed to the local files, the `.ttf` fallbacks
  dropped, and the `@font-face` blocks for faces this build does not use removed. The upstream
  licence banner is retained verbatim at the top of the file.
- The `woff2` binaries are **subsets** of the upstream faces (2026-08-22): the ~1900 glyphs the app
  never draws were removed, leaving the 72 it does, and 252KB became 7KB. That makes them Modified
  Versions under OFL 1.1, so — as the Reserved Font Name clause requires — they are **renamed**:
  the families are `LibrePT Icons` and `LibrePT Icons Brands`, and the copyright and licence
  statements travel inside each font's own name table. The subsets are produced by
  [`agent_tools/font_subset.py`](agent_tools/font_subset.py) from the upstream files, which the
  script's own header records; `fonttools` is installed for that run and removed again, so it never
  becomes a build dependency. The two faces are kept SEPARATE rather than merged because they share
  96 codepoints, and merging silently redrew two brand icons as something else — caught by
  [`agent_tools/glyph_render.py`](agent_tools/glyph_render.py), which compares every icon's rendered
  shape against a recorded baseline.
- The icons themselves are CC BY 4.0; the set has been subset, which is stated here as that licence
  requires changes to be indicated.
- **Historical note.** Until 2026-08-22 the binaries were byte-identical to upstream. **If the font is ever
  subset** (see [TODO §12.6](TODO.md)), that changes: deleting glyphs creates a Modified Version,
  and clause 3 then forbids presenting it under the name "Font Awesome" — the `font-family` would
  have to be renamed.

---

## Related

- [LICENSE](LICENSE) — LibrePT's own licence (MIT)
- [src/fonts/fonts.css](src/fonts/fonts.css) — the vendored webfont declarations
- [TODO.md](TODO.md) — §12.6 covers the icon-font vendoring and the subsetting constraints
