"""`python -m agent_tools.css_tokens` — verify every custom property the CSS reads is one something writes.

Why this exists: a `var(--name)` naming a property nobody defines does not fail, does not warn and
does not render as nothing. CSS quietly takes the fallback written beside it — and a fallback is a
colour someone typed on the day they wrote the line, so the declaration silently stops following the
theme and freezes at whatever the author's theme was.

That is not hypothetical. `modules/demo/storyNarration.css` asked for `--text-primary`,
`--text-secondary`, `--bg-secondary` and `--bg-primary`; this app's tokens are `--text-main`,
`--text-muted`, `--card-bg` and `--bg-color`. All five declarations fell through to their light-theme
fallbacks, so the demo's story card was slate-on-white everywhere — correct on the Daylight theme by
coincidence, and 2.38:1 body text on Midnight, which is the theme the story's own handover link
forces on the client's phone. Reported 2026-08-27 as "the 2/8 card is hard to read" (TODO §38.8),
invisible in review for a year of edits, and invisible to every test that did not measure contrast.

**A property is DEFINED by whoever writes it, which is not only a stylesheet.** Three writers count:

    --name: value            anywhere in src/**/*.css        the ordinary case
    setProperty("--name",…)  in src/**/*.js                  JS handing timing/geometry to CSS
    style="--name: …"        inline in markup or a template   the same, written into an attribute

The second is real and load-bearing: `modules/demo/demoHand.js` stamps `--ripple-ms` and
`--ripple-delay` onto the rings it builds, and `demoTour.css` animates with them — deliberately with
no fallback, so that the duration has ONE source. A checker that only read stylesheets would call
that an error and push the value back into two places.

**Vendored CSS is skipped, not audited.** `fonts/fontawesome.css` is upstream's file: its `--fa-*`
properties are its own contract with its own users, and we neither wrote them nor may fix them.

**The second half is theme PARITY**, which is the same failure one level up. The five palettes in
`modules/themes/` are alternatives, not layers: whichever class is on `<html>`, that file alone
supplies the colours. So a property added to one palette and forgotten in the other four is defined
as far as the check above is concerned, and undefined for four fifths of the app's users — the same
frozen-fallback bug, reachable only by switching theme. Every property any palette defines must be
defined by all of them.

Exit code is 1 when a stylesheet reads a property nothing writes, or when the palettes disagree
about what they define, so it can gate a commit.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"

# Upstream files we ship as they came. Their properties are their own business.
VENDORED = ("fonts/",)

# `var(--name` and `var( --name` — the read. The closing side is irrelevant: what is being asked for
# is the name, and a fallback after the comma is exactly what this check exists to distrust.
USES = re.compile(r"var\(\s*(--[\w-]+)")
# `--name:` as a DECLARATION, which is the colon immediately after the name. Excludes a name that
# merely appears in prose or inside another value.
DEFINES_CSS = re.compile(r"(--[\w-]+)\s*:")
# The two ways JavaScript writes one: the DOM call, and an inline style attribute in a template.
DEFINES_JS = re.compile(r"""setProperty\(\s*["'`](--[\w-]+)["'`]""")
DEFINES_INLINE = re.compile(r"""style\s*=\s*["'`][^"'`]*?(--[\w-]+)\s*:""")


def scanned(suffix):
    """Every non-vendored `src/` file of one kind, in a stable order."""
    return sorted(
        path
        for path in SRC.rglob(f"*{suffix}")
        if not any(str(path.relative_to(SRC)).startswith(skip) for skip in VENDORED)
    )


def defined_tokens():
    """Every custom property this app writes, however it writes it."""
    names = set()
    for path in scanned(".css"):
        names.update(DEFINES_CSS.findall(path.read_text(encoding="utf-8")))
    for suffix in (".js", ".html"):
        for path in scanned(suffix):
            text = path.read_text(encoding="utf-8")
            names.update(DEFINES_JS.findall(text))
            names.update(DEFINES_INLINE.findall(text))
    return names


def used_tokens():
    """Every custom property the stylesheets read, mapped to where each read happens."""
    uses = {}
    for path in scanned(".css"):
        for number, line in enumerate(
            path.read_text(encoding="utf-8").splitlines(), start=1
        ):
            for name in USES.findall(line):
                uses.setdefault(name, []).append(
                    f"{path.relative_to(REPO_ROOT)}:{number}"
                )
    return uses


def palette_gaps():
    """Properties one palette defines and another does not, as `{name: [palettes missing it]}`."""
    palettes = {
        path.stem: set(DEFINES_CSS.findall(path.read_text(encoding="utf-8")))
        for path in sorted((SRC / "modules" / "themes").glob("*.css"))
    }
    if len(palettes) < 2:
        return {}
    everything = set().union(*palettes.values())
    gaps = {
        name: sorted(stem for stem, names in palettes.items() if name not in names)
        for name in sorted(everything)
    }
    return {name: missing for name, missing in gaps.items() if missing}


def main():
    defined = defined_tokens()
    uses = used_tokens()
    undefined = {name: where for name, where in uses.items() if name not in defined}

    gaps = palette_gaps()
    if gaps:
        print(
            f"\n  ✗ CSS tokens: {len(gaps)} propert(ies) not defined by every palette\n"
        )
        for name, missing in gaps.items():
            print(f"    {name}  missing from {', '.join(missing)}")
        print(
            "\n    The palettes are alternatives, not layers: the one on <html> supplies every"
        )
        print(
            "    colour by itself, so a property only one of them defines is undefined for anyone"
        )
        print("    on the others — visible only by switching theme.")
        return 1

    if undefined:
        total = sum(len(where) for where in undefined.values())
        print(
            f"\n  ✗ CSS tokens: {total} read(s) of {len(undefined)} property nobody defines\n"
        )
        for name in sorted(undefined):
            for where in undefined[name]:
                print(f"    {where}  reads {name}")
        print(
            "\n    An undefined property does not fail — CSS takes the fallback beside it, which is"
        )
        print(
            "    a value frozen on the day it was typed, so the declaration stops following the"
        )
        print(
            "    theme. Name the property the app actually defines, or define this one."
        )
        return 1

    print(
        f"  ✓ CSS tokens: all {len(uses)} custom propert(ies) read in src/ are defined."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
