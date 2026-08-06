"""`python -m agent_tools.icon_coverage` — verify every icon the app asks for actually ships.

Why this exists: today the app ships Font Awesome WHOLE (~1400 glyphs for the ~48 it uses), so a
typo'd or renamed icon class renders as an invisible nothing — no error, no failing test, just a
gap where a control should be. The moment the font is subset (TODO §12.6) that failure mode gets
worse rather than better: a correct class for a glyph nobody remembered to include looks identical
to a typo. This check closes both, and it is deliberately built BEFORE any subsetting, because
subsetting without it is a silent-breakage machine.

The check is a pure text comparison, no font parsing and no `fonttools`: the shipped stylesheet
declares `.fa-NAME:before{content:"\\fXXX"}` for exactly the glyphs it can render, so the CSS is a
faithful manifest of the font beside it — the two are generated together and cannot disagree. That
keeps this dependency-free and fast enough for Stage 1, and it means subsetting never has to add a
build-time dependency: regeneration stays a deliberate, committed act (AGENT_RULES §6), the same
way Node, Biome and the ZAP rules are vendored rather than fetched.

**Runtime-built class names are the whole difficulty.** Three call sites assemble the name from a
variable, so no scanner can see the resulting icon:

    `<i class="fa-solid fa-arrow-${dir}"></i>`                    applicationHeader.js
    `<i class="fa-solid fa-chevron-${expanded ? "up" : "down"}">`  sessionCard.js, clipboardEditor.js

A static extractor finds 46 of the 48 glyphs actually needed and misses `arrow-up`, `arrow-down`,
`chevron-up`, `chevron-down` — measured, not hypothetical. Those are declared in RUNTIME_BUILT below
with their call site, and this tool checks them exactly like a literal usage. Anything that stops
being derivable statically belongs there too, with a comment saying why.

Exit code is 1 when the app asks for an icon the stylesheet cannot render, so it can gate a commit.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"
ICON_CSS = SRC / "fonts" / "fontawesome.css"
SCANNED_SUFFIXES = (".js", ".html")

# Icon names the source cannot spell out, because the class is assembled at runtime. Each entry
# names the call site that builds it — if that call site goes, so should the entry.
RUNTIME_BUILT = {
    # modules/common/applicationHeader.js — `fa-arrow-${dir}`, called with "up" and "down".
    "arrow-up",
    "arrow-down",
    # modules/sessionList/sessionCard.js and modules/clipboard/clipboardEditor.js —
    # `fa-chevron-${expanded ? "up" : "down"}`.
    "chevron-up",
    "chevron-down",
}

# Font Awesome's own style, sizing, layout and animation modifiers. These share the `fa-` prefix but
# are NOT glyphs, so they have no `:before` rule and must not be demanded of the stylesheet.
MODIFIERS = {
    "solid",
    "regular",
    "brands",
    "classic",
    "sharp",
    "duotone",
    "light",
    "thin",
    "1x",
    "2x",
    "3x",
    "4x",
    "5x",
    "6x",
    "7x",
    "8x",
    "9x",
    "10x",
    "2xs",
    "xs",
    "sm",
    "lg",
    "xl",
    "2xl",
    "fw",
    "ul",
    "li",
    "border",
    "pull-left",
    "pull-right",
    "inverse",
    "spin",
    "spin-reverse",
    "spin-pulse",
    "pulse",
    "beat",
    "fade",
    "beat-fade",
    "bounce",
    "shake",
    "flip",
    "flip-horizontal",
    "flip-vertical",
    "flip-both",
    "rotate-90",
    "rotate-180",
    "rotate-270",
    "rotate-by",
    "stack",
    "stack-1x",
    "stack-2x",
    "swap-opacity",
}

# `class="…"` / `class='…'`, including the interpolated halves of a template literal.
CLASS_ATTR = re.compile(r"""class\s*=\s*["']([^"']*)["']""")
FA_TOKEN = re.compile(r"\bfa-([a-z0-9-]+)")
# A glyph the stylesheet can actually render. Font Awesome GROUPS aliases onto one rule —
# `.fa-magnifying-glass:before,.fa-search:before{content:"\f002"}` — so a pattern anchored on
# `:before{` only ever sees the last selector in each group and reports every alias before it as
# missing. The first draft did exactly that and accused 17 icons, `fa-bars` among them, of not
# shipping. Match the whole selector list, then pull the names out of it.
CSS_RULE = re.compile(r"((?:\.fa-[a-z0-9-]+:before\s*,?\s*)+)\{\s*content:")
CSS_GLYPH = re.compile(r"\.fa-([a-z0-9-]+):before")
# `fa-something-${…}` — a name completed at runtime, so its literal prefix is not a real icon.
TEMPLATE_TOKEN = re.compile(r"\bfa-[a-z0-9-]*\$\{")


def scanned_files():
    """Every source file that could name an icon. The vendored stylesheet is excluded: it declares
    ~1400 classes the app does not use, and reading it as USAGE would make the check vacuous."""
    return sorted(
        path
        for path in SRC.rglob("*")
        if path.suffix in SCANNED_SUFFIXES
        and path.is_file()
        and "fonts" not in path.parts
    )


def used_icons(paths):
    """Icon names requested by the source, as {name: {file, …}}.

    Only `class` attributes are read. Scanning raw text instead would drag in prose ("far too
    early"), CSS selectors and unrelated identifiers — an earlier loose grep did exactly that and
    reported `far` as used when nothing used it.
    """
    found = {}
    for path in paths:
        text = path.read_text(encoding="utf-8", errors="ignore")
        for attr in CLASS_ATTR.findall(text):
            # Drop the truncated prefix of a runtime-built name (`fa-arrow-` in `fa-arrow-${dir}`);
            # RUNTIME_BUILT carries the real names instead.
            cleaned = TEMPLATE_TOKEN.sub(" ", attr)
            for name in FA_TOKEN.findall(cleaned):
                if name in MODIFIERS:
                    continue
                found.setdefault(name, set()).add(
                    path.relative_to(REPO_ROOT).as_posix()
                )
    for name in RUNTIME_BUILT:
        found.setdefault(name, set()).add("declared in agent_tools/icon_coverage.py")
    return found


def shipped_icons(css_text):
    """Every glyph the stylesheet can render, aliases included."""
    names = set()
    for selector_list in CSS_RULE.findall(css_text):
        names.update(CSS_GLYPH.findall(selector_list))
    return names


def main():
    if not ICON_CSS.exists():
        print(f"\n  ✗ Icon stylesheet missing: {ICON_CSS.relative_to(REPO_ROOT)}")
        return 1

    shipped = shipped_icons(ICON_CSS.read_text(encoding="utf-8"))
    used = used_icons(scanned_files())
    missing = {name: files for name, files in used.items() if name not in shipped}

    if missing:
        print(f"\n  ✗ Icons: {len(missing)} class(es) the shipped font cannot render\n")
        for name in sorted(missing):
            for where in sorted(missing[name]):
                print(f"    fa-{name}  ← {where}")
        print(
            "\n    A missing glyph renders as an invisible gap, not an error. Either the class is"
        )
        print(
            "    misspelled, or the icon needs adding to the shipped set (and to RUNTIME_BUILT if"
        )
        print("    its name is assembled at runtime).")
        return 1

    print(
        f"  ✓ Icons: all {len(used)} icon(s) used in src/ are renderable "
        f"({len(shipped)} shipped)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
