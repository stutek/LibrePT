"""Unit tests for agent_tools/google_credential.py — the canary credential minter.

The tool is interactive and network-bound, so what is testable here is the part that goes wrong
SILENTLY: the scopes it asks for, and the shape of the file it leaves behind. Both are contracts
with something outside this module — Google's consent screen, and `tests/live/_credentials.mjs`
reading the JSON back — so both are pinned as contracts rather than as internals (AGENT_RULES §5.8's
"a format that outlives the code" carve-out).

The parity tests are the ones with teeth. The tool mirrors two scope constants it cannot import
across the Python/JavaScript line; if the shipping constants move and the mirror does not, the tool
happily mints a credential the canary then rejects — and the error surfaces on a scheduled run days
later, nowhere near the change that caused it.
"""

import json
import re
import stat

from agent_tools import google_credential

REPO_ROOT = google_credential.REPO_ROOT
DRIVE_SYNC_CONFIG = REPO_ROOT / "src" / "data" / "driveSyncConfig.js"
TOKEN_SCOPES_TEST = REPO_ROOT / "tests" / "live" / "tokenScopes.live.test.mjs"
CALENDAR_FREEBUSY = REPO_ROOT / "src" / "data" / "calendarFreeBusy.js"


def _js_string_const(source, name):
    match = re.search(rf'{name}\s*=\s*"([^"]+)"', source)
    assert match, (
        f"{name} is no longer a plain string constant; the mirror cannot be checked"
    )
    return match.group(1)


def _js_string_array(source, name):
    match = re.search(rf"{name}\s*=\s*\[(.*?)\]", source, re.DOTALL)
    assert match, f"{name} is no longer an array literal; the mirror cannot be checked"
    return re.findall(r'"([^"]+)"', match.group(1))


def test_the_required_scopes_mirror_the_shipping_constants():
    """The tool asks for exactly what production holds. If these drift apart, the minted credential
    fails tokenScopes.live.test.mjs on a scheduled run rather than here."""
    drive_scope = _js_string_const(
        DRIVE_SYNC_CONFIG.read_text(encoding="utf-8"), "GOOGLE_DRIVE_SCOPE"
    )
    # Reads the shipping module, not the live test — the calendar scope earned a real constant when
    # src/data/calendarFreeBusy.js landed, and the live test now imports it rather than restating it.
    freebusy_scope = _js_string_const(
        CALENDAR_FREEBUSY.read_text(encoding="utf-8"), "GOOGLE_CALENDAR_FREEBUSY_SCOPE"
    )
    assert set(google_credential.REQUIRED_SCOPES) == {drive_scope, freebusy_scope}


def test_the_overbroad_list_mirrors_what_the_live_test_rejects():
    """A scope the live test rejects but this tool tolerates would be written to disk, uploaded, and
    only then fail — with the consent already granted and needing revocation to redo."""
    declared = _js_string_array(
        TOKEN_SCOPES_TEST.read_text(encoding="utf-8"), "OVERBROAD_SCOPES"
    )
    assert set(google_credential.OVERBROAD_SCOPES) == set(declared)


def test_the_consent_url_asks_for_a_refresh_token():
    """`access_type=offline` is the entire reason a refresh token exists, and `prompt=consent`
    forces a fresh one when the client was granted before. Dropping either still produces a valid
    consent screen and a working access token — the failure appears one step later, as a token
    response with no refresh token in it."""
    url = google_credential.build_consent_url("cid", "http://127.0.0.1:8765", "st4te")
    assert "access_type=offline" in url
    assert "prompt=consent" in url


def test_the_consent_url_carries_the_state_and_both_scopes():
    url = google_credential.build_consent_url("cid", "http://127.0.0.1:8765", "st4te")
    assert "state=st4te" in url
    for scope in google_credential.REQUIRED_SCOPES:
        assert scope.replace(":", "%3A").replace("/", "%2F") in url


def test_an_exact_grant_has_no_problems():
    assert google_credential.scope_problems(google_credential.REQUIRED_SCOPES) == []


def test_a_missing_scope_is_reported():
    granted = [google_credential.REQUIRED_SCOPES[0]]
    problems = google_credential.scope_problems(granted)
    assert len(problems) == 1
    assert google_credential.REQUIRED_SCOPES[1] in problems[0]


def test_an_overbroad_scope_is_reported_even_alongside_the_required_ones():
    """The dangerous case: full `drive` keeps every Drive test green while production's narrow
    `drive.appdata` could be broken, so a grant that looks complete is the one to catch."""
    granted = [
        *google_credential.REQUIRED_SCOPES,
        "https://www.googleapis.com/auth/drive",
    ]
    problems = google_credential.scope_problems(granted)
    assert len(problems) == 1
    assert "overbroad" in problems[0]


def test_a_scope_on_neither_list_is_left_to_the_live_test():
    """Google attaches `openid`-style scopes on its own in some configurations. Policing them here
    as well would let the two checks disagree, and the live test is the one that gates the canary."""
    granted = [*google_credential.REQUIRED_SCOPES, "openid"]
    assert google_credential.scope_problems(granted) == []


def test_the_credential_document_is_what_the_live_suite_reads_back():
    """tests/live/_credentials.mjs destructures exactly these three keys off the parsed JSON."""
    document = google_credential.credential_document("cid", "csec", "rtok")
    assert document["client_id"] == "cid"
    assert document["client_secret"] == "csec"
    assert document["refresh_token"] == "rtok"


def test_the_credential_is_stamped_with_its_mint_date():
    """Nothing else ever knows when the token was issued — Google's six-month unused-token clock is
    invisible from the token itself — so agent_tools.credential_expiry has only this field to
    measure a rotation deadline from."""
    import datetime

    document = google_credential.credential_document(
        "cid", "csec", "rtok", minted=datetime.date(2026, 8, 13)
    )
    assert document["minted"] == "2026-08-13"


def test_the_written_credential_is_not_world_readable(tmp_path):
    """It holds a refresh token. `.private/` is gitignored, which keeps it out of the repository —
    it does nothing about the filesystem."""
    target = tmp_path / "nested" / "google-live.json"
    google_credential.write_credential({"refresh_token": "rtok"}, path=target)

    assert json.loads(target.read_text(encoding="utf-8")) == {"refresh_token": "rtok"}
    assert not stat.S_IMODE(target.stat().st_mode) & 0o077


def test_the_account_hint_reaches_the_consent_url():
    """`login_hint` pre-selects the account, which removes the accident this flag exists for: a
    browser already signed in elsewhere consenting silently as the wrong person."""
    url = google_credential.build_consent_url(
        "cid", "http://127.0.0.1:8765", "st", login_hint="LibrePT.test@gmail.com"
    )
    assert "login_hint=LibrePT.test%40gmail.com" in url


def test_no_account_asked_for_means_no_hint():
    url = google_credential.build_consent_url("cid", "http://127.0.0.1:8765", "st")
    assert "login_hint" not in url


def test_the_right_account_is_accepted_whatever_its_capitalisation():
    # Gmail addresses are case-insensitive, so the same mailbox spelled two ways is not a mismatch.
    assert (
        google_credential.account_mismatch(
            "LibrePT.test@gmail.com", "librept.test@gmail.com"
        )
        == ""
    )


def test_the_wrong_account_is_refused_and_both_are_named():
    complaint = google_credential.account_mismatch(
        "canary@example.com", "personal@example.com"
    )
    assert "personal@example.com" in complaint and "canary@example.com" in complaint


def test_an_unconfirmable_account_is_refused_rather_than_assumed_right():
    """The hint is not enforcement — Google lets a human switch — so "could not check" must not
    quietly pass. A credential belonging to the wrong person works perfectly and only surfaces
    months later as an unexplained standing grant on somebody's personal account."""
    complaint = google_credential.account_mismatch("canary@example.com", "")
    assert complaint
    assert "--account" in complaint, "the message must say how to proceed"


def test_no_account_requested_means_nothing_to_check():
    assert google_credential.account_mismatch("", "whoever@example.com") == ""
    assert google_credential.account_mismatch(None, "") == ""
