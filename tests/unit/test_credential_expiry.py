"""Unit tests for agent_tools/credential_expiry.py — the canary credential's rotation deadline.

What makes this worth pinning is that the failure it guards is invisible while everything works.
Google revokes a refresh token unused for six months, and the canary's daily run resets that clock,
so nothing ever comes due until the canary *stops* — and it stops silently (GitHub disables
scheduled workflows after 60 days of repository inactivity). The deadline is therefore measured from
the mint date rather than from any observable expiry, and the arithmetic below is the whole guard.

The boundary tests matter more than the middle: an off-by-one at the far end eats the warning month
that is the entire point of failing early.
"""

import datetime

from agent_tools import credential_expiry

MINTED = datetime.date(2026, 8, 13)


def _document(minted=MINTED):
    return {"refresh_token": "rtok", "minted": minted.isoformat()}


def test_the_deadline_leaves_a_month_before_google_revokes():
    """The margin is the feature. If these two constants ever meet, the check starts failing at the
    same moment the credential dies, which is no warning at all."""
    assert credential_expiry.ROTATE_AFTER_DAYS == (
        credential_expiry.GOOGLE_UNUSED_EXPIRY_DAYS
        - credential_expiry.ROTATION_WARNING_DAYS
    )
    assert credential_expiry.ROTATION_WARNING_DAYS >= 30
    assert (
        credential_expiry.ROTATE_AFTER_DAYS
        < credential_expiry.GOOGLE_UNUSED_EXPIRY_DAYS
    )


def test_a_fresh_credential_passes():
    is_ok, message = credential_expiry.rotation_report(_document(), MINTED)
    assert is_ok
    assert "rotation due in" in message


def test_the_day_before_the_deadline_still_passes():
    """One day inside the window is not yet an action item; failing early by a day would make the
    deadline unpredictable to anyone reading the constant."""
    today = MINTED + datetime.timedelta(days=credential_expiry.ROTATE_AFTER_DAYS - 1)
    is_ok, _ = credential_expiry.rotation_report(_document(), today)
    assert is_ok


def test_the_deadline_itself_fails():
    today = MINTED + datetime.timedelta(days=credential_expiry.ROTATE_AFTER_DAYS)
    is_ok, message = credential_expiry.rotation_report(_document(), today)
    assert not is_ok
    assert "google_credential" in message, (
        "the failure must say how to rotate, not just that to"
    )


def test_the_failure_still_leaves_google_runway():
    """At the moment this first fails there must be real time left to act — otherwise the check is
    an obituary rather than a warning."""
    today = MINTED + datetime.timedelta(days=credential_expiry.ROTATE_AFTER_DAYS)
    days_left = credential_expiry.GOOGLE_UNUSED_EXPIRY_DAYS - (today - MINTED).days
    assert days_left >= 30


def test_a_credential_with_no_mint_stamp_is_treated_as_due():
    """An unstamped credential is indistinguishable from an ancient one. Assuming it fresh would
    hide exactly the case this exists to catch."""
    is_ok, message = credential_expiry.rotation_report(
        {"refresh_token": "rtok"}, MINTED
    )
    assert not is_ok
    assert "no usable `minted` stamp" in message


def test_an_unparseable_mint_stamp_is_treated_as_due():
    is_ok, _ = credential_expiry.rotation_report({"minted": "last Tuesday"}, MINTED)
    assert not is_ok


def test_a_future_mint_date_fails_rather_than_granting_extra_runway():
    """A clock skew or a typo that dates the credential forward would otherwise buy it unlimited
    extra life, silently."""
    is_ok, message = credential_expiry.rotation_report(
        _document(MINTED + datetime.timedelta(days=1)), MINTED
    )
    assert not is_ok
    assert "future" in message


def test_a_missing_credential_file_is_not_a_failure(tmp_path):
    """A dispatch run supplies a short-lived access token and installs no credential file. There is
    no stored credential to have a deadline, so there is nothing to fail."""
    assert credential_expiry.main([str(tmp_path / "absent.json")]) == 0
