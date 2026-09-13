# tests/unit/test_theme_selectors.py
# Every class a theme restyles still exists (TODO §49.2).
#
# Since 2026-09-13 a theme is a whole stylesheet: besides its tokens it may restyle any component,
# by the component's class (docs/ARCHITECTURE.md#themes-and-styling). That couples the theme to a
# name it does not own. Rename `.exercise-deck-card` in the clipboard and the Spreadsheet theme's
# grid silently stops applying — no error, no warning, the deck is simply drawn the default way in
# one theme out of five, where nobody looking at another theme would notice.
#
# Pure text analysis, no browser — Stage 1. Uses the src_dir fixture (tests/conftest.py).

import re

# `.name` in a selector, not inside a value (`0.2s`, `url(./x.css)`): a class starts with a letter.
CLASS_IN_SELECTOR = re.compile(r"\.([a-zA-Z][a-zA-Z0-9_-]*)")
# Everything before a `{` is a selector list; declarations are dropped with their braces.
RULE = re.compile(r"([^{}]+)\{[^{}]*\}")
COMMENT = re.compile(r"/\*.*?\*/", re.DOTALL)


def _theme_files(src_dir):
    return sorted((src_dir / "modules" / "themes").glob("*.css"))


def _restyled_classes(path):
    text = COMMENT.sub("", path.read_text(encoding="utf-8"))
    classes = set()
    for selectors in RULE.findall(text):
        classes.update(CLASS_IN_SELECTOR.findall(selectors))
    return classes - {f"{path.stem}-theme"}


def _source_outside_themes(src_dir):
    themes = {path.resolve() for path in _theme_files(src_dir)}
    return "\n".join(
        path.read_text(encoding="utf-8")
        for pattern in ("*.js", "*.css", "*.html")
        for path in src_dir.rglob(pattern)
        if path.resolve() not in themes and "vendor" not in path.parts
    )


def test_every_class_a_theme_restyles_exists_outside_the_themes(src_dir):
    source = _source_outside_themes(src_dir)
    missing = []
    for path in _theme_files(src_dir):
        for name in sorted(_restyled_classes(path)):
            if not re.search(rf"(?<![\w-]){re.escape(name)}(?![\w-])", source):
                missing.append(f"{path.name}: .{name}")
    assert not missing, (
        "a theme restyles a class no component has any more — renamed or removed, so that part of "
        "the theme no longer applies:\n  " + "\n  ".join(missing)
    )


def test_the_check_sees_the_spreadsheet_grid(src_dir):
    """Guards the check itself: if the parser stopped finding selectors, the test above would pass
    by measuring nothing."""
    assert "exercise-deck-card" in _restyled_classes(
        src_dir / "modules" / "themes" / "spreadsheet.css"
    )
