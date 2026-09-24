"""`python -m agent_tools.ui_strings` — user-visible text that never passes through the translator.

Reported 2026-08-30: "prevodi so nekonsistentni, na slovenski strani se včasih pojavlja angleški
tekst", and then, concretely, "gumb cancel se pojavi na slovenski izvedbi". The dictionaries were
not the problem — they are in exact parity, 622 keys each — the English is written into the markup
and never asked about again.

**A RATCHET, not a gate that can be passed.** There are hundreds of these, spread over a third of
the module tree, and each one is a small decision about wording rather than a mechanical rename. A
check that failed on all of them would be a check nobody could run, so this one fails when the number
goes UP: the sweep proceeds file by file, `BASELINE` comes down with it, and no new dialog can be
written in English in the meantime. When it reaches the irreducible set — a licence name, a
taxonomy value that is the same word everywhere — the ratchet becomes an ordinary gate and TODO
§38.20 closes.

**What counts as user-visible.** Text between tags in a template literal, and the three attributes a
person actually reads: `placeholder`, `aria-label`, `title`. An element carrying `data-i18n`,
`data-i18n-placeholder` or `data-i18n-label` is translated at runtime (i18n/domMappings.js) and is
not counted — that attribute is the fix, so counting it would punish the repair.

Exit code is 1 when the count rises above the baseline, so it can gate a commit.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"

# The count on the day the ratchet was fitted. It only ever goes down: 332 before the sweep started,
# then the 27 `data-i18n` attributes nothing was applying, then the client dialog somebody reported
# "Cancel" from, then the clipboard's Start and Done buttons becoming glyphs whose words live in
# `aria-label` (TODO §39.6), then the day's expand-all control, whose label the timeline sets
# from the dictionary in both directions (TODO §42.4), then the setup form's participant picker,
# whose checkbox wall became a search field with two fewer hardcoded strings (TODO §46.2), then the
# theme picker, whose options are built from theme.js's label table instead of the markup (§49.2),
# then the board's Today button, which moved into the date filter's calendar and left its English
# title and label behind with it (§74.2), then the two data-subject-request dialogs, whose markup now
# carries a key on every text (clientDataRights.js), then the client directory and detail views,
# whose placeholder texts went and whose labels carry their keys (clientsView.js), then the consent
# button's words, which only the code sets now, then the Sync & Backup dialog (backupRestore.js),
# then the Custom Exercise dialog's labels and logging options (exerciseFormsController.js), then
# the clipboard's feedback dialog (feedbackModal.js), then the Apply Program Adjustment dialog
# (planAdjustments.js), then the encrypted-file reader a client opens (encryptedFileReader.js), then
# the Routine Template dialog and its rows (routineFormsController.js, plansView.js).
BASELINE = 144

# Upstream files and the dictionaries themselves: the first are not ours to translate, the second
# ARE the translations.
SKIP = ("fonts", "i18n")

# Text between two tags, starting with a capital — a label, a heading, a button's words.
TEXT = re.compile(r">([A-Z][A-Za-z][^<>{}\n]{2,60})<")
# The attributes somebody reads or hears. Anchored on the space before the name, or
# `data-i18n-placeholder="…"` matches its own tail and the twin that cancels it never wins.
ATTR = re.compile(r'\s(placeholder|aria-label|title)="([^"${}]{3,60})"')
# …and the attribute that says "this one is translated at runtime".
TRANSLATED_ATTR = re.compile(r'data-i18n-(placeholder|label)="')


def scanned():
    return sorted(
        path
        for path in SRC.rglob("*.js")
        if not any(part in SKIP for part in path.parts)
    )


def literals_in(text):
    """Every user-visible literal in one file's source, minus what is translated at runtime."""
    found = 0
    for match in TEXT.finditer(text):
        tag = text[text.rfind("<", 0, match.start()) : match.start()]
        if "data-i18n" in tag:
            continue
        words = match.group(1).strip()
        # A single short token is usually a value rather than a sentence — a unit, an initial, a
        # taxonomy entry that reads the same in every language.
        if words and (" " in words or (words.isalpha() and len(words) > 3)):
            found += 1
    found += len(ATTR.findall(text))
    return found - len(TRANSLATED_ATTR.findall(text))


def main():
    per_file = {}
    for path in scanned():
        count = literals_in(path.read_text(encoding="utf-8"))
        if count > 0:
            per_file[str(path.relative_to(REPO_ROOT))] = count
    total = sum(per_file.values())

    if total > BASELINE:
        print(f"\n  ✗ UI strings: {total} hardcoded, up from {BASELINE}\n")
        for name, count in sorted(per_file.items(), key=lambda kv: -kv[1])[:10]:
            print(f"    {count:4}  {name}")
        print(
            "\n    New user-visible text has to go through the dictionary, or a trainer reading\n"
            "    Slovenian meets it in English (TODO §38.20). Put the key on the element itself —\n"
            '    `data-i18n="key"`, `data-i18n-placeholder`, `data-i18n-label` — or call `t()`.'
        )
        return 1

    if total < BASELINE:
        print(
            f"\n  ✗ UI strings: {total} hardcoded, below the baseline of {BASELINE}\n"
        )
        print(
            "    Good — and the baseline has to come down with it, or the ratchet stops holding\n"
            f"    anything. Set BASELINE = {total} in agent_tools/ui_strings.py."
        )
        return 1

    print(f"  ✓ UI strings: {total} hardcoded, none added (TODO §38.20 is the sweep).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
