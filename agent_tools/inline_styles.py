"""`python -m agent_tools.inline_styles` — look and layout written in JavaScript instead of CSS.

Ruled 2026-09-13 (Simon): *"vsaka tema rabi svoj lastni CSS override, ne samo barvne sheme — po
principu lokalnosti in single responsibility layout ne sme biti pisan v kodi"*. A theme is a
stylesheet that may restyle any component (docs/ARCHITECTURE.md, "Themes"). A declaration written
by code — `el.style.gap = "12px"`, `style="color: #ef4444"` in a template — sits on the element
itself and beats every stylesheet, so no theme can reach it. On the day of the ruling there were 145
of them in 20 files, several carrying colours a theme had no way to change.

**What stays allowed: a number only the running code knows**, handed to CSS as a custom property —
`el.style.setProperty("--plan-column-count", n)`, or `style="--spot-x: ${x}px"` in a template. The
stylesheet still decides what that number does, so a theme can still restyle the element.

Generated documentation pages are not scanned: they load no app stylesheet and no theme, and their
`style="text-align:left"` comes from the Markdown renderer's table alignment.

Exit code is 1 on any finding, so it gates a commit.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"

# Upstream code is not ours to restyle.
SKIP = ("vendor", "fonts")

# `el.style.gap = …`, `el.style["gap"] = …`, `el.style.cssText = …` — a declaration by assignment.
ASSIGNED = re.compile(r"\.style(?:\.[A-Za-z]+|\[[^\]]+\])\s*=(?!=)")
# `el.style.setProperty("gap", …)` — the same, spelled as a call. Custom properties are the exception.
SET_PROPERTY = re.compile(r"\.style\.setProperty\(\s*[\"'`](?!--)")
# `style="…"` in a template or in markup: every declaration inside must be a custom property.
ATTRIBUTE = re.compile(r"""\sstyle=\\?(["'])(.*?)\\?\1""", re.DOTALL)


def scanned():
    return sorted(
        [
            *(
                p
                for p in SRC.rglob("*.js")
                if not any(part in SKIP for part in p.parts)
            ),
            SRC / "index.html",
        ]
    )


def _attribute_writes_a_declaration(body):
    declarations = [part.strip() for part in body.split(";") if part.strip()]
    return any(not declaration.startswith("--") for declaration in declarations)


def findings_in(text):
    """[(line number, source line)] for every style a stylesheet cannot override."""
    lines = text.splitlines()
    offsets = [
        *(m.start() for m in ASSIGNED.finditer(text)),
        *(m.start() for m in SET_PROPERTY.finditer(text)),
        # Matched over the whole text, not per line: a template may wrap an attribute.
        *(
            m.start()
            for m in ATTRIBUTE.finditer(text)
            if _attribute_writes_a_declaration(m.group(2))
        ),
    ]
    numbers = sorted({text.count("\n", 0, offset) + 1 for offset in offsets})
    return [(number, lines[number - 1].strip()) for number in numbers]


def main():
    total = 0
    for path in scanned():
        for number, line in findings_in(path.read_text(encoding="utf-8")):
            total += 1
            print(f"  {path.relative_to(REPO_ROOT)}:{number}: {line[:120]}")
    if total:
        print(
            f"\n  {total} style(s) written in code. Give the element a class or a state attribute and "
            "put the declaration in the module's stylesheet; a number only the code knows goes in "
            "as a custom property (`setProperty('--name', value)`)."
        )
        return 1
    print("  No styles written in code.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
