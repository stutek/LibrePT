# tests/e2e/test_signup_round_trip.py
# The whole loop, end to end: a client fills in /intake, the file they send is opened by the trainer,
# and the person becomes a client record that survives a reload (TODO §1.7/§26).
#
# Every step of this is covered in isolation elsewhere — the form in tests/medium/test_intake_form.py,
# the review in tests/medium/test_signup_review_dialog.py, the artifact in
# tests/unit_js/data/signupFile.test.mjs. What only this tier can show is that the two halves agree
# about the SAME file: the client's phone writes it, the trainer's app reads it, and nothing in between
# is a stub. It is also the only place the real file input and real IndexedDB persistence are exercised.

import json

import pytest
from playwright.sync_api import expect


def _client_file(tmp_path, page, local_server):
    """Fill in the real intake page and return the path of the file it actually produced."""
    page.goto(f"{local_server}intake")
    expect(page.locator("#view-intake")).to_be_visible(timeout=15_000)

    page.fill("#intake-name", "Nova Oseba")
    page.fill("#intake-email", "nova@example.com")
    page.fill("#intake-phone", "041 555 222")
    page.fill("#intake-goals", "first marathon next spring")
    page.fill("#intake-injury", "left knee, careful with deep flexion")
    page.check("#intake-consent")

    with page.expect_download() as download_info:
        page.click("#intake-save")
    download = download_info.value
    path = tmp_path / download.suggested_filename
    download.save_as(path)
    return path


@pytest.mark.clean_start
def test_a_stranger_becomes_a_client_without_the_trainer_typing_anything(
    page, local_server, tmp_path
):
    """§26's whole point: the slowest and least accurate part of taking on a client is the trainer
    retyping what the person said. Here the client's own words end up in the register, and the trainer's
    only act is to read them and accept."""
    sent_file = _client_file(tmp_path, page, local_server)

    # The trainer, on their own device, opening what arrived.
    page.goto(local_server)
    page.wait_for_selector("#app-header", timeout=15_000)
    page.locator("#btn-app-menu").click()
    page.locator("#menu-review-signup").click()

    expect(page.locator("#dialog-signup-review")).to_be_visible()
    page.set_input_files("#signup-review-file", str(sent_file))

    review = page.locator("#dialog-signup-review")
    expect(review).to_contain_text("Nova Oseba")
    # The health detail the client chose to offer is the part the trainer must read before session one.
    expect(review).to_contain_text("left knee, careful with deep flexion")
    # Consent as evidence: the date they ticked and the wording version they were shown.
    expect(review).to_contain_text("2026-08-09")

    page.click("#signup-review-save")
    expect(page.locator("#dialog-signup-review")).to_be_hidden()

    # In the register, and still there after a reload — through real IndexedDB, not an in-memory state.
    page.goto(f"{local_server}clients")
    expect(page.locator("#view-client-directory")).to_be_visible(timeout=15_000)
    expect(page.locator("#clients-list")).to_contain_text("Nova Oseba")


@pytest.mark.clean_start
def test_the_file_the_client_sent_is_readable_and_carries_no_more_than_they_offered(
    page, local_server, tmp_path
):
    """Read as bytes, because this file leaves one person's phone and lands on another's. It has to hold
    what the client said and nothing else — no trainer-only fields, no record id that could aim it at an
    existing client."""
    sent_file = _client_file(tmp_path, page, local_server)

    payload = json.loads(sent_file.read_text(encoding="utf-8"))

    assert sorted(payload.keys()) == [
        "email",
        "gdprConsent",
        "goals",
        "injury",
        "name",
        "phone",
        "v",
    ]
    assert payload["gdprConsent"]["cloudSync"] is True
    assert "id" not in payload
