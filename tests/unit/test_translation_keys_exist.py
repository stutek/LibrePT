# tests/unit/test_translation_keys_exist.py
# Every translation key the code asks for by name exists in the dictionary. When one does not, t()
# returns the key itself, and the trainer reads "voice_processing" or a lower-case English "edit" on
# screen — in every language, and unnoticed in English because it looks almost right.
#
# Only keys written out whole are checked (`t("key")`); a key built at run time (`t(`account_${x}`)`)
# cannot be read here.

import re

CALL = re.compile(
    r"""\b(?:t|tr|deps\.t|deps\?\.t\?\.)\(\s*["']([a-z][a-z0-9_]*)["']\s*\)"""
)
KEY = re.compile(r"^\s*([a-zA-Z0-9_]+)\s*:", re.M)


def test_every_key_the_code_names_is_in_the_dictionary(src_dir):
    dictionary = set(
        KEY.findall((src_dir / "i18n" / "en.js").read_text(encoding="utf-8"))
    )
    missing = {}
    for path in sorted(src_dir.rglob("*.js")):
        if "i18n" in path.parts:
            continue
        for key in CALL.findall(path.read_text(encoding="utf-8")):
            if key not in dictionary:
                missing.setdefault(key, []).append(path.relative_to(src_dir).as_posix())
    assert not missing, f"keys asked for but not in en.js: {missing}"
