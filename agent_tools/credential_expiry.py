"""`python -m agent_tools.credential_expiry` — force the canary credential to be rotated in time.

Why this exists: Google expires a refresh token that has gone **six months unused**. The trap is
that this is not a six-month renewal chore anyone can diarise, because the clock is reset by *use* —
the canary's daily run keeps the token alive indefinitely, so nothing ever comes due while things
are working. The clock only starts advancing once the canary **stops**, and the ways it stops are
all silent: GitHub disables scheduled workflows on a repository with no activity for 60 days, a
workflow edit can break the schedule, a repository can be archived. By the time anyone notices, the
credential is dead and the fix is the full consent flow again.

So the guard cannot be "check whether the token expired" — by then it has. It is a **rotation
deadline** measured from the mint date the tool stamps into the credential: fail once the credential
is older than five months, one month inside Google's six. A canary that has been running keeps
passing until then and fails loudly with a month of margin; a canary that stopped comes back red the
moment it runs again, which is exactly when someone is looking.

This is deliberately a hard failure and not a warning. No gate step may print a warning and return
success — that pattern is what let a ZAP scan reach nothing and still
report clean. A month of daily red is the point: it is an action item, not a notification.

Runs inside the canary workflow rather than `build check` Stage 1, because the credential only
exists where the credential exists — a contributor's clone has no `.private/google-live.json`, and a
Stage 1 check that skips whenever the file is absent would be a gate that gates nothing. What Stage
1 asserts instead is that the canary still RUNS this (tests/unit/test_google_canary_workflow.py), so
the step cannot be quietly dropped from the workflow.

Usage:
  python -m agent_tools.credential_expiry [path-to-credential.json]
"""

import argparse
import datetime
import json
import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_CREDENTIAL_PATH = REPO_ROOT / ".private" / "google-live.json"

# Google's own boundary: a refresh token unused for this long is revoked.
GOOGLE_UNUSED_EXPIRY_DAYS = 180

# How much runway to leave. One month of daily red is enough to act on without being so early that
# the rotation itself becomes the chore.
ROTATION_WARNING_DAYS = 30

ROTATE_AFTER_DAYS = GOOGLE_UNUSED_EXPIRY_DAYS - ROTATION_WARNING_DAYS


def parse_minted(document):
    """The mint date stamped by agent_tools.google_credential. Absent means a credential minted
    before stamping existed (or hand-rolled), which is indistinguishable from an ancient one — so it
    is treated as due rather than assumed fresh."""
    stamped = document.get("minted")
    if not stamped:
        return None
    try:
        return datetime.date.fromisoformat(stamped[:10])
    except ValueError:
        return None


def days_remaining(minted, today):
    """Days left before rotation is due. Negative once overdue."""
    return ROTATE_AFTER_DAYS - (today - minted).days


def rotation_report(document, today):
    """Returns (is_ok, message). Split from I/O so the deadline arithmetic is unit-testable without
    a credential file or a frozen clock."""
    minted = parse_minted(document)
    if minted is None:
        return False, (
            "The credential carries no usable `minted` stamp, so its age cannot be checked and it "
            "may already be inside Google's six-month unused-token window. Re-mint it with "
            "`python -m agent_tools.google_credential`."
        )
    if minted > today:
        return False, (
            f"The credential is stamped {minted.isoformat()}, which is in the future — the clock it "
            "would be checked against is not trustworthy. Re-mint it."
        )
    remaining = days_remaining(minted, today)
    age = (today - minted).days
    if remaining > 0:
        return True, (
            f"Credential minted {minted.isoformat()} ({age}d ago); rotation due in {remaining}d, "
            f"{GOOGLE_UNUSED_EXPIRY_DAYS - age}d before Google's unused-token expiry."
        )
    return False, (
        f"The canary credential was minted {minted.isoformat()}, {age} days ago. Google revokes a "
        f"refresh token unused for {GOOGLE_UNUSED_EXPIRY_DAYS} days, and this check fails "
        f"{ROTATION_WARNING_DAYS} days ahead of that so the rotation happens with runway.\n"
        "Rotate it now:\n"
        "  .venv/bin/python -m agent_tools.google_credential\n"
        "  gh secret set GOOGLE_LIVE_CREDENTIALS < .private/google-live.json\n"
        "See docs/GOOGLE_CLOUD_SETUP.md Part B."
    )


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("path", nargs="?", default=str(DEFAULT_CREDENTIAL_PATH))
    args = parser.parse_args(argv)

    path = pathlib.Path(args.path)
    if not path.exists():
        # A dispatch run supplies a short-lived access token and installs no credential file; there
        # is no stored credential to have a deadline. Nothing to check, nothing to fail.
        print(f"No stored credential at {path}; nothing to rotate.")
        return 0

    try:
        document = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as err:
        print(f"Cannot read {path}: {err}", file=sys.stderr)
        return 1

    is_ok, message = rotation_report(document, datetime.date.today())
    if is_ok:
        print(message)
        return 0
    print(
        f"::error title=Google canary credential is due for rotation::{message}",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
