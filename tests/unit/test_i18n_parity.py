# tests/unit/test_i18n_parity.py
# The EN and SL translation dictionaries in src/app.js must define exactly the same keys, or
# switching language leaves gaps. (When i18n is extracted to its own module, point this at it.)

import re


def test_translation_dictionaries_parity(src_dir):
    content = (src_dir / "app.js").read_text(encoding="utf-8")

    translations_match = re.search(r"const TRANSLATIONS = \{(.*?)\n\};", content, re.DOTALL)
    assert translations_match, "TRANSLATIONS object not found in app.js"
    translations_block = translations_match.group(1)

    en_match = re.search(r"en:\s*\{(.*?)\n\s*\},", translations_block, re.DOTALL)
    assert en_match, "English translations block not found"
    en_keys = set(re.findall(r"^\s*([a-zA-Z0-9_]+)\s*:", en_match.group(1), re.MULTILINE))

    sl_match = re.search(r"sl:\s*\{(.*?)\n\s*\}", translations_block, re.DOTALL)
    assert sl_match, "Slovenian translations block not found"
    sl_keys = set(re.findall(r"^\s*([a-zA-Z0-9_]+)\s*:", sl_match.group(1), re.MULTILINE))

    assert en_keys, "No English keys found"
    assert sl_keys, "No Slovenian keys found"

    missing_in_sl = en_keys - sl_keys
    missing_in_en = sl_keys - en_keys
    assert not missing_in_sl, f"Keys in English but missing in Slovenian: {missing_in_sl}"
    assert not missing_in_en, f"Keys in Slovenian but missing in English: {missing_in_en}"
