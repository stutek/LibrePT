# tests/unit/test_i18n_parity.py
# Every locale under src/i18n/ must define exactly the same keys, or switching language leaves
# untranslated gaps. This is data-driven: it discovers every locale file and compares them all
# against the union of keys, so adding a new language is covered automatically and any missing
# translation (a key present in one locale but absent in another) fails the test.

import re


def _locale_files(src_dir):
    """Every locale file in src/i18n/ (the registry index.js and domMappings.js are not locales)."""
    return sorted(p for p in (src_dir / "i18n").glob("*.js") if p.name not in ("index.js", "domMappings.js"))


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
        assert f.stem in index, f"locale '{f.stem}' is not registered in src/i18n/index.js"


def test_all_locales_have_the_same_keys(src_dir):
    files = _locale_files(src_dir)
    keysets = {f.stem: _keys(f) for f in files}
    for name, ks in keysets.items():
        assert ks, f"no keys parsed from locale '{name}'"

    all_keys = set().union(*keysets.values())
    # For each locale, list the keys it is missing (present in some other locale but not here).
    missing = {name: sorted(all_keys - ks) for name, ks in keysets.items() if all_keys - ks}
    assert not missing, f"locales with missing translations: {missing}"
