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
webfonts and the icon font. Their licences are separate from, and unaffected by, LibrePT's.

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

## Font Awesome Free 6.4.0

Copyright 2023 Fonticons, Inc. Vendored as [`src/fonts/fontawesome.css`](src/fonts/fontawesome.css)
plus `fa-solid-900.woff2` and `fa-brands-400.woff2`. Full licence:
<https://fontawesome.com/license/free>.

- **Icons** — CC BY 4.0
- **Fonts** — SIL OFL 1.1, Reserved Font Name *"Font Awesome"*
- **Code (CSS)** — MIT

**Changes made**, as CC BY 4.0 requires be indicated:

- The stylesheet was edited — `url()` targets repointed to the local files, the `.ttf` fallbacks
  dropped, and the `@font-face` blocks for faces this build does not use removed. The upstream
  licence banner is retained verbatim at the top of the file.
- The `woff2` binaries are **unmodified** and byte-identical to upstream. No Modified Version of the
  font software exists, so the Reserved Font Name clause is not engaged. **If the font is ever
  subset** (see [TODO §12.6](TODO.md)), that changes: deleting glyphs creates a Modified Version,
  and clause 3 then forbids presenting it under the name "Font Awesome" — the `font-family` would
  have to be renamed.

---

## Related

- [LICENSE](LICENSE) — LibrePT's own licence (MIT)
- [src/fonts/fonts.css](src/fonts/fonts.css) — the vendored webfont declarations
- [TODO.md](TODO.md) — §12.6 covers the icon-font vendoring and the subsetting constraints
