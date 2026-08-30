# tests/e2e/test_share_target.py
# A client's submission shared straight into the app, through the real service worker (TODO §38.22).
#
# The operating system's half cannot be driven from a test — no browser lets a page pretend to be the
# Android share sheet — but everything after it can: the OS makes an ordinary multipart POST to the
# app's share-target URL, and from there it is the worker, a redirect, and the app's own boot. So the
# test makes that POST itself, exactly as the phone would, and asserts the trainer ends up looking at
# the submission.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

import pytest

SUBMISSION = {
    "v": 1,
    "name": "Ana Novak",
    "email": "ana.novak@example.com",
    "goals": "back to squatting after the knee",
    "gdprConsent": {
        "cloudSync": True,
        "signedDate": "2026-08-30",
        "formVersion": "2026-08-17",
        "formLang": "en",
    },
}

# What the phone posts: one file, in the field the manifest names.
POST_THE_SHARE = """
async (payload) => {
  const body = new FormData();
  // The type and the name the client's own phone gives it (data/signupFile.js), not a generic JSON:
  // that pair is what the manifest claims, and claiming anything wider would offer LibrePT in the
  // share sheet for every JSON file somebody has (TODO §38.22).
  body.append(
    'signup',
    new File([payload], 'ana-novak.librept-signup.json', {
      type: 'application/vnd.librept.signup+json',
    }),
  );
  const response = await fetch('share-target', { method: 'POST', body, redirect: 'manual' });
  return { status: response.status, type: response.type };
}
"""


@pytest.mark.clean_start
def test_a_shared_submission_opens_in_the_review(page, local_server):
    """The whole point of §38.22: the trainer taps Share on the attachment in their messaging app and
    picks LibrePT. No saving the file, no file picker, no menu — and no auto-import either: what they
    get is the review dialog with the submission in it, because a human reads every field before a
    record is written (§26.5)."""
    page.goto(local_server)
    # The worker answers the POST, so it has to be running first — which is also true on a phone: the
    # share target is only offered once the app is installed.
    page.evaluate("() => navigator.serviceWorker.ready.then(() => true)")

    page.evaluate(POST_THE_SHARE, json.dumps(SUBMISSION))
    # The worker redirects to the app with the marker; going there is what the browser would do.
    page.goto(f"{local_server}?open=signup")

    dialog = page.locator("#dialog-signup-review")
    dialog.wait_for(state="visible", timeout=15_000)
    assert "Ana Novak" in dialog.inner_text()
    assert page.locator("#signup-review-save").is_enabled()


@pytest.mark.clean_start
def test_the_submission_is_taken_out_of_the_inbox_once(page, local_server):
    """A reload must not put the same dialog back. The marker stays in the address across one, so the
    submission itself is what is read once and dropped — otherwise the trainer dismisses the same box
    every time they refresh."""
    page.goto(local_server)
    page.evaluate("() => navigator.serviceWorker.ready.then(() => true)")
    page.evaluate(POST_THE_SHARE, json.dumps(SUBMISSION))

    page.goto(f"{local_server}?open=signup")
    page.locator("#dialog-signup-review").wait_for(state="visible", timeout=15_000)
    page.reload()
    page.wait_for_timeout(1_500)

    assert page.locator("#dialog-signup-review[open]").count() == 0, (
        "the same submission opened again on a reload"
    )


@pytest.mark.clean_start
def test_the_marker_does_not_stay_in_the_address(page, local_server):
    """`?open=signup` describes an arrival, not a place. Left behind, it is a URL the trainer can
    share or come back to with Back, advertising a submission that is no longer there."""
    page.goto(local_server)
    page.evaluate("() => navigator.serviceWorker.ready.then(() => true)")
    page.evaluate(POST_THE_SHARE, json.dumps(SUBMISSION))

    page.goto(f"{local_server}?open=signup")
    page.locator("#dialog-signup-review").wait_for(state="visible", timeout=15_000)

    assert "open=signup" not in page.url, page.url
