# tests/unit/test_no_browser_dialogs.py
# The app asks and tells through its own dialog (src/modules/common/appQuestion.js), never through
# the browser's alert(), confirm() or prompt(). Those windows are drawn by the browser: their buttons
# are in the device's language ("OK", "Cancel" on a Slovenian page), no theme reaches them, and while
# one is open the page does nothing else — two in a row at the end of a session left a tab that
# answered nothing.
#
# Comment lines are skipped: explaining why a confirm() is not used is allowed.

import re

CALL = re.compile(r"(?<![\w.])(?:window\.)?(alert|confirm|prompt)\s*\(")


def test_no_code_opens_a_browser_dialog(src_dir):
    found = []
    for path in sorted(src_dir.rglob("*.js")):
        if "fonts" in path.parts:
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith(("//", "*", "/*")):
                continue
            if CALL.search(line):
                found.append(
                    f"{path.relative_to(src_dir).as_posix()}:{number}: {stripped}"
                )
    assert not found, "use askInApp / tellInApp instead:\n" + "\n".join(found)
