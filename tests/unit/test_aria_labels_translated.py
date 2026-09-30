# tests/unit/test_aria_labels_translated.py
# A name a screen reader speaks for a button must come from the dictionary, so it is in the page's
# language. `aria-label="Close modal"` typed into a template stays English on every page.
#
# Static over src rather than a browser walk: a browser test can only compare a label with the
# dictionary, and these labels are not in it, so a walk finds nothing. It also reaches dialogs that
# are only drawn on some path. A literal label is allowed only when the same tag names its key with
# `data-i18n-label` (which the app applies to the page and to dialogs drawn later), or it is one of
# the few written in both languages on purpose.

import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"

# Written in two languages at once, because they are the controls that change the language.
BILINGUAL = {
    "Switch Language / Zamenjaj jezik",
    "Theme / Tema",
    "Menu / Meni",
}

LITERAL_LABEL = re.compile(r'aria-label="([^"$]+)"')
CALL_LABEL = re.compile(r'setAttribute\(\s*"aria-label",\s*"([^"]+)"')
# A label handed to a helper as an argument (the weight field of the plan editor).
ARG_LABEL = re.compile(r'ariaLabel:\s*"([^"]+)"')
TAG_KEY = re.compile(r"data-i18n-label=")


def _tag_around(text, start):
    """The opening tag holding the attribute at `start`: from the `<` before it to the `>` after."""
    begin = text.rfind("<", 0, start)
    end = text.find(">", start)
    return text[begin : end + 1]


def _untranslated():
    found = []
    for path in sorted(SRC.rglob("*")):
        if path.suffix not in {".js", ".html"} or "vendor" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        for match in LITERAL_LABEL.finditer(text):
            if match.group(1) in BILINGUAL or not re.search(
                r"[A-Za-z]", match.group(1)
            ):
                continue
            if not TAG_KEY.search(_tag_around(text, match.start())):
                found.append(f'{path.relative_to(SRC)}: aria-label="{match.group(1)}"')
        for match in ARG_LABEL.finditer(text):
            found.append(f'{path.relative_to(SRC)}: ariaLabel "{match.group(1)}"')
        for match in CALL_LABEL.finditer(text):
            found.append(
                f'{path.relative_to(SRC)}: setAttribute aria-label "{match.group(1)}"'
            )
    return found


def test_no_literal_aria_label_escapes_the_dictionary():
    found = _untranslated()
    assert not found, (
        "aria-label written as a literal without data-i18n-label (English on every page):\n"
        + "\n".join(found)
    )
