# tests/unit/test_dialog_action_order.py
# Where a dialog's action row has two or more buttons, the action the dialog exists for (the primary
# or destructive one) is the LAST, so it is on the right; the secondary (Cancel, Close, Back) is on
# the left. One rule for every dialog means a trainer's thumb learns one place.
#
# Read from the markup in src/, so DOM order, tab order and visual order are the same thing: no
# stylesheet may reorder a row either (row-reverse, order:).
#
# A red-styled link (`danger-link-btn`) is exempt: it is set apart to the far left on purpose, so
# that a thumb aiming at the safe answer cannot find it.

import re

ROW = re.compile(
    r'<div class="[^"]*\b(?:modal-actions|modal-footer|restore-confirm-actions)\b[^"]*">'
    r"(.*?)</div>",
    re.S,
)
CONTROL = re.compile(r'<(?:button|a)\b[^>]*?\bclass="([^"]*)"', re.S)
PRIMARY = {"primary-btn", "success-btn", "danger-btn", "btn-danger"}
SECONDARY = {"secondary-btn", "btn-secondary"}


def _roles(row_markup):
    roles = []
    for classes in CONTROL.findall(row_markup):
        words = set(classes.split())
        if "danger-link-btn" in words:
            continue
        if words & PRIMARY:
            roles.append("primary")
        elif words & SECONDARY:
            roles.append("secondary")
    return roles


def test_every_dialog_puts_its_primary_action_last(src_dir):
    wrong = []
    rows = 0
    for path in sorted(src_dir.rglob("*.js")):
        text = path.read_text(encoding="utf-8")
        for match in ROW.finditer(text):
            roles = _roles(re.sub(r"<!--.*?-->", "", match.group(1), flags=re.S))
            if len(roles) < 2:
                continue
            rows += 1
            if roles[-1] != "primary" and "primary" in roles:
                line = text.count("\n", 0, match.start()) + 1
                wrong.append(f"{path.relative_to(src_dir).as_posix()}:{line}: {roles}")
    assert rows >= 15, (
        f"the scan found only {rows} two-button rows; the pattern has drifted"
    )
    assert not wrong, (
        "primary/destructive action must come last (right):\n" + "\n".join(wrong)
    )


RULE = re.compile(r"([^{}]+)\{([^{}]*)\}")


def test_no_stylesheet_reorders_an_action_row(src_dir):
    found = []
    for path in sorted(src_dir.rglob("*.css")):
        for selector, body in RULE.findall(path.read_text(encoding="utf-8")):
            if not re.search(r"actions|modal-footer", selector):
                continue
            if re.search(r"row-reverse|(?<![\w-])order\s*:", body):
                found.append(
                    f"{path.relative_to(src_dir).as_posix()}: {selector.strip()}"
                )
    assert not found, "DOM order must be visual order:\n" + "\n".join(found)
