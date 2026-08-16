"""`python -m agent_tools.google_credential` — mint the live canary's Google credential.

Why this exists: the setup runbook's Part B (docs/GOOGLE_CLOUD_SETUP.md) asked the maintainer to
export three shell variables, paste a 45-line Python heredoc into a terminal, then run a separate
`curl` pipeline to trade the authorization code for a refresh token. That is precisely the improvised script AGENT_RULES §6 says
to build once and keep — and it will run again, because a refresh token has to be re-minted whenever
it is revoked, the scopes change, or the account sits unused for six months.

Three failure modes came from the two-step shape, and collapsing it removes all three:

1. **The authorization code is single-use and was written to a file** between steps. Any stumble
   after that write — a mistyped client secret, a stale shell — burned the code, and the runbook's
   own remedy was "start again at B2". Here the exchange happens in-process, so there is no window
   in which a spent code is sitting on disk.
2. **`access_type=offline` and `prompt=consent` are what make a refresh token exist at all**, and
   omitting either produced a bare `KeyError: 'refresh_token'` several steps downstream. They are no
   longer retyped per run.
3. **The scopes were retyped by hand** into a shell export, so the grant could silently drift from
   what production asks for. A stray `drive` scope keeps every Drive test green while production's
   narrow `drive.appdata` is broken — the canary would report confidence it has not earned. The
   scopes now live here, and `tests/unit/test_google_credential.py` asserts they still match the
   shipping constants they mirror.

This also verifies the grant with `tokeninfo` **before** writing anything, so a wrong consent screen
selection is caught here rather than on the next scheduled canary run.

Not a gate (see agent_tools/INDEX.md): it needs a browser, a network and a human at the consent
screen. "Failure" means no credential was written — a rejected consent, a scope mismatch, or a
token endpoint that refused the exchange.

Usage:
  .venv/bin/python -m agent_tools.google_credential
  .venv/bin/python -m agent_tools.google_credential --port 9000 --no-browser
"""

import argparse
import datetime
import getpass
import http.server
import json
import os
import pathlib
import secrets
import sys
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

from agent_tools import credential_expiry

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
CREDENTIAL_PATH = REPO_ROOT / ".private" / "google-live.json"

AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo"
# Drive's `about.get` is readable with `drive.appdata` alone, so the account a token belongs to
# can be confirmed without asking for `email`/`openid`. Widening the grant merely to find out who
# granted it would defeat the point of the narrow scopes this whole tool exists to protect.
DRIVE_ABOUT_ENDPOINT = (
    "https://www.googleapis.com/drive/v3/about?fields=user/emailAddress"
)

# Mirrors of shipping constants, not new decisions: GOOGLE_DRIVE_SCOPE in src/data/driveSyncConfig.js
# and CALENDAR_FREEBUSY_SCOPE in tests/live/tokenScopes.live.test.mjs. A unit test asserts the mirror
# still matches, because a drift here mints a credential the canary then rejects.
REQUIRED_SCOPES = (
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/calendar.freebusy",
)

# Each would keep the Drive tests green while reaching far beyond the hidden per-app folder
# production is bounded to. Kept in step with tokenScopes.live.test.mjs's OVERBROAD_SCOPES.
OVERBROAD_SCOPES = (
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
)


def build_consent_url(
    client_id, redirect_uri, state, scopes=REQUIRED_SCOPES, login_hint=None
):
    """The authorization URL, with the two parameters whose absence is only felt much later:
    `access_type=offline` is what makes Google issue a refresh token at all, and `prompt=consent`
    forces a fresh one even if this client was granted before (a re-grant otherwise returns an
    access token only, and the exchange fails with no refresh token to store)."""
    query = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(scopes),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
    )
    # A HINT, not an enforcement: Google pre-selects this account, which removes the common accident
    # of a browser already signed in as someone else consenting silently — but a human can still
    # switch. That is why the token is checked against it afterwards rather than trusted.
    if login_hint:
        query += f"&login_hint={urllib.parse.quote(login_hint)}"
    return f"{AUTH_ENDPOINT}?{query}"


def scope_problems(granted, required=REQUIRED_SCOPES, overbroad=OVERBROAD_SCOPES):
    """Reports what tests/live/tokenScopes.live.test.mjs would report, at mint time instead of on the
    next canary run. Returns a list of human-readable problems; empty means the grant is exactly what
    production asks for. Scopes beyond these two lists are not policed here — that is the live
    test's call to make, and duplicating the judgement in two places invites them to disagree."""
    granted = set(granted)
    problems = [
        f"missing required scope {scope}" for scope in required if scope not in granted
    ]
    problems += [
        f"granted overbroad scope {scope}" for scope in overbroad if scope in granted
    ]
    return problems


def account_mismatch(expected, actual):
    """The complaint to make when a token turned out to belong to the wrong account, or "" when it
    did not. Gmail treats addresses case-insensitively, so `LibrePT.test@` and `librept.test@` are
    the same mailbox and must not read as a mismatch."""
    if not expected:
        return ""
    if not actual:
        return (
            f"could not confirm which account granted this — expected {expected}. Drive refused the "
            "check, so re-run without --account if you are certain, or check the grant by hand."
        )
    if expected.strip().lower() != actual.strip().lower():
        return f"granted by {actual}, but --account asked for {expected}"
    return ""


def granted_account_email(access_token, fetch=None):
    """Which account this token belongs to, or "" when Drive will not say."""
    request = urllib.request.Request(
        DRIVE_ABOUT_ENDPOINT, headers={"Authorization": f"Bearer {access_token}"}
    )
    opener = fetch or urllib.request.urlopen
    try:
        with opener(request, timeout=30) as response:
            return json.load(response).get("user", {}).get("emailAddress", "")
    except (urllib.error.URLError, ValueError, KeyError):
        return ""


def credential_document(client_id, client_secret, refresh_token, minted=None):
    """The three keys tests/live/_credentials.mjs reads back out of the file, plus the mint date.

    `minted` is not part of the OAuth exchange — it is stamped here because nothing else ever
    knows it. Google revokes a refresh token unused for six months, and that clock is invisible
    from the token itself; agent_tools.credential_expiry measures the rotation deadline from this
    field. _credentials.mjs destructures only the three it needs, so the extra key is inert there.
    """
    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "minted": (minted or datetime.date.today()).isoformat(),
    }


def _post_form(endpoint, fields):
    """POSTs a form and returns the parsed JSON, raising with Google's own error text on failure —
    an HTTPError's default string is `HTTP Error 400: Bad Request`, which says nothing about which
    field was wrong, while the body names it."""
    request = urllib.request.Request(
        endpoint,
        data=urllib.parse.urlencode(fields).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace").strip()
        raise SystemExit(f"Google rejected the request ({err.code}): {detail}") from err
    except urllib.error.URLError as err:
        raise SystemExit(f"Could not reach {endpoint}: {err.reason}") from err


class _CallbackHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Silence the default access log — its request line contains the authorization code."""

    def do_GET(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        # A browser also asks for /favicon.ico on this origin. Ignoring query-less requests keeps a
        # favicon from consuming the listener's one real response.
        if not query:
            self.send_response(404)
            self.end_headers()
            return
        if query.get("state", [None])[0] != self.server.expected_state:
            self._finish(400, b"State mismatch. Return to the terminal.")
            self.server.error = (
                "state mismatch — the response did not come from this request"
            )
            return
        if "error" in query:
            denial = query["error"][0]
            self._finish(400, b"Authorization was declined. Return to the terminal.")
            self.server.error = f"Google returned {denial}"
            return
        code = query.get("code", [None])[0]
        if not code:
            self._finish(400, b"No authorization code. Return to the terminal.")
            self.server.error = "callback carried no authorization code"
            return
        self.server.code = code
        self._finish(200, b"Authorization complete. You can close this tab.")

    def _finish(self, status, body):
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)


def wait_for_authorization_code(port, state, timeout_seconds=300):
    """Runs a one-shot loopback listener until the consent screen redirects back to it."""
    try:
        server = http.server.HTTPServer(("127.0.0.1", port), _CallbackHandler)
    except OSError as err:
        raise SystemExit(
            f"Cannot listen on 127.0.0.1:{port} ({err}). Try --port."
        ) from err
    server.expected_state = state
    server.code = None
    server.error = None
    server.timeout = timeout_seconds
    with server:
        while server.code is None and server.error is None:
            server.handle_request()
            if server.code is None and server.error is None and not server.timeout:
                break
    if server.error:
        raise SystemExit(f"Authorization failed: {server.error}")
    if not server.code:
        raise SystemExit(f"No response within {timeout_seconds}s. Nothing was written.")
    return server.code


def write_credential(document, path=CREDENTIAL_PATH):
    """Writes the credential 0600. `.private/` is gitignored and must stay that way."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    os.chmod(path, 0o600)
    return path


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--port", type=int, default=8765, help="loopback callback port")
    parser.add_argument(
        "--account",
        help="the Google address this credential must belong to; pre-selects it at the consent "
        "screen and refuses to write the file if a different account granted it",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="print the consent URL instead of opening it (headless machines)",
    )
    args = parser.parse_args(argv)

    print("Desktop OAuth client from the runbook's B1 (not Part A's Web client).")
    client_id = input("  Client ID: ").strip()
    # getpass, not input: a Desktop client's secret is not a true secret, but it still lands in the
    # GitHub secret alongside the refresh token, and echoing it puts it in the scrollback.
    client_secret = getpass.getpass("  Client secret (not echoed): ").strip()
    if not client_id or not client_secret:
        raise SystemExit("Both values are required; nothing was written.")

    redirect_uri = f"http://127.0.0.1:{args.port}"
    state = secrets.token_urlsafe(32)
    consent_url = build_consent_url(
        client_id, redirect_uri, state, login_hint=args.account
    )

    print(
        f"\nApprove as {args.account}, granting both scopes and nothing else:"
        if args.account
        else "\nApprove as the account the canary should run as, granting both scopes and nothing else:"
    )
    for scope in REQUIRED_SCOPES:
        print(f"  · {scope}")
    if args.no_browser:
        print(f"\nOpen this URL:\n{consent_url}\n")
    else:
        print(f"\nOpening the consent screen. If it does not open:\n{consent_url}\n")
        webbrowser.open(consent_url)

    code = wait_for_authorization_code(args.port, state)
    print("Authorization received; exchanging it now.")

    payload = _post_form(
        TOKEN_ENDPOINT,
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        },
    )
    refresh_token = payload.get("refresh_token")
    if not refresh_token:
        raise SystemExit(
            "Google returned no refresh token. This client had a live grant already; revoke it at "
            "https://myaccount.google.com/permissions and run this again."
        )

    # WHO granted it, checked rather than assumed. `login_hint` only pre-selects an account; a
    # browser already signed in elsewhere can still consent as someone else, and the resulting
    # credential would work perfectly while belonging to the wrong person — a silent failure that
    # surfaces months later as an unexplained standing grant on somebody's personal account.
    wrong_account = account_mismatch(
        args.account, granted_account_email(payload.get("access_token", ""))
    )
    if wrong_account:
        raise SystemExit(f"Nothing was written: {wrong_account}")

    granted = (payload.get("scope") or "").split()
    problems = scope_problems(granted)
    if problems:
        print("\nThe grant does not match what production asks for:", file=sys.stderr)
        for problem in problems:
            print(f"  · {problem}", file=sys.stderr)
        raise SystemExit(
            "Nothing was written. Re-run and tick exactly the two scopes above, or revoke the "
            "grant at https://myaccount.google.com/permissions first."
        )

    document = credential_document(client_id, client_secret, refresh_token)
    path = write_credential(document)
    relative = path.relative_to(REPO_ROOT)
    print(f"\nWrote {relative} (0600), granting exactly:")
    for scope in granted:
        print(f"  · {scope}")
    minted = datetime.date.fromisoformat(document["minted"])
    due = minted + datetime.timedelta(days=credential_expiry.ROTATE_AFTER_DAYS)
    print(
        f"\nRotate by {due.isoformat()} — the canary fails from that date, "
        f"{credential_expiry.ROTATION_WARNING_DAYS} days before Google's unused-token expiry."
    )
    print("\nNext:")
    print(
        '  .venv/bin/python -c "from build import run_live_google_tests; run_live_google_tests()"'
    )
    print(f"  gh secret set GOOGLE_LIVE_CREDENTIALS < {relative}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
