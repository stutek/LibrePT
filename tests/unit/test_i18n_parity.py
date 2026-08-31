# tests/unit/test_i18n_parity.py
# Every locale under src/i18n/ must define exactly the same keys, or switching language leaves
# untranslated gaps. This is data-driven: it discovers every locale file and compares them all
# against the union of keys, so adding a new language is covered automatically and any missing
# translation (a key present in one locale but absent in another) fails the test.

import re


def _locale_files(src_dir):
    """Every locale file in src/i18n/ (the registry index.js and domMappings.js are not locales)."""
    return sorted(
        p
        for p in (src_dir / "i18n").glob("*.js")
        if p.name not in ("index.js", "domMappings.js")
    )


def _keys(path):
    text = path.read_text(encoding="utf-8")
    body = re.search(r"\{(.*)\}", text, re.DOTALL)
    assert body, f"no object literal found in {path.name}"
    return set(re.findall(r"^\s*([a-zA-Z0-9_]+)\s*:", body.group(1), re.MULTILINE))


def test_locales_present_and_registered(src_dir):
    files = _locale_files(src_dir)
    assert files, "no locale files found under src/i18n/"
    index = (src_dir / "i18n" / "index.js").read_text(encoding="utf-8")
    for f in files:
        assert f.stem in index, (
            f"locale '{f.stem}' is not registered in src/i18n/index.js"
        )


def test_all_locales_have_the_same_keys(src_dir):
    files = _locale_files(src_dir)
    keysets = {f.stem: _keys(f) for f in files}
    for name, ks in keysets.items():
        assert ks, f"no keys parsed from locale '{name}'"

    all_keys = set().union(*keysets.values())
    # For each locale, list the keys it is missing (present in some other locale but not here).
    missing = {
        name: sorted(all_keys - ks) for name, ks in keysets.items() if all_keys - ks
    }
    assert not missing, f"locales with missing translations: {missing}"


# An element carrying `data-i18n` has its whole content replaced at runtime: domMappings.js applies
# the key with `replaceChildren(value)`. So anything inside it — an icon, a badge, a nested span —
# is deleted the first time a language is applied, which is every boot.
DATA_I18N_ELEMENT = re.compile(
    r'<(\w+)([^>]*\bdata-i18n\s*=\s*"[^"]+"[^>]*)>(.*?)</\1>', re.DOTALL
)


def test_no_translated_element_wraps_markup_the_translator_would_delete(src_dir):
    """Found 2026-08-31: the clipboard's Start button shipped `<i class="fa-circle-play"></i>` in
    its markup and had no icon on screen, in either language. Its `data-i18n` sat on the button, so
    every boot replaced the icon and the text with the translated words.

    Nothing caught it. The dictionaries were in parity, the button worked, the label was correct in
    both languages, and the glyph the markup asks for was simply never drawn. This is the check that
    would have: the key belongs on an inner element, or — for a control that is only a glyph —
    `data-i18n-label` on the button, which writes `aria-label` and leaves the content alone."""
    offenders = []
    for path in sorted(src_dir.rglob("*.html")) + sorted(src_dir.rglob("*.js")):
        if "i18n" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        for match in DATA_I18N_ELEMENT.finditer(text):
            if "<" not in match.group(3):
                continue
            line = text[: match.start()].count("\n") + 1
            offenders.append(
                f"{path.relative_to(src_dir.parent)}:{line} — "
                f"{match.group(0)[:100].replace(chr(10), ' ')}"
            )

    assert not offenders, (
        "data-i18n replaces an element's whole content, so these lose the markup inside them "
        "on every boot:\n  " + "\n  ".join(offenders)
    )
