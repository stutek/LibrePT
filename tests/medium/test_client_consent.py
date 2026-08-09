# tests/medium/test_client_consent.py
# The GDPR consent block of the Add/Edit Client dialog (modules/clients/clientConsentSection.js),
# mounted through the real bootClientForms step — the same function app.js's init() calls — so the
# fieldset wires against production's DOM ids and the real save handler in
# controllers/clientFormsController.js is what writes the record.
#
# What only a DOM tier can hold: the date field appearing when consent is ticked and defaulting to
# today, the two delivery links being built from the record on the screen, the archiving reminder
# actually opening as a dialog (not a tooltip — AGENT_RULES §2.D.1), and the round-trip into
# `gdprConsent`. The letter's wording and the href shapes are pure strings and are pinned in
# tests/unit_js/modules/common/consentForm.test.mjs instead.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import datetime

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { bootClientForms } from './appBoot.js';
import {
  renderClientDetailViewShell,
  renderClientDirectoryViewShell,
  setActiveDetailClientId,
} from './modules/clients/clientsView.js';
""",
    view_id="client-directory",
    body="""
// Three shapes the consent block must handle: never consented (with both addresses), consented
// under an older form version, and a record with no way to reach the client at all.
const state = {
  lang: 'en',
  clients: [
    {
      id: 'c-new', name: 'Jane Doe', email: 'jane@example.com', phone: '+386 40 123 456',
      goals: '', notes: '', weightHistory: [], active: true,
    },
    {
      id: 'c-signed', name: 'Marko Novak', email: 'marko@example.com', phone: '+386 41 222 333',
      goals: '', notes: '', weightHistory: [], active: true,
      gdprConsent: { cloudSync: true, timestamp: '2026-03-02T09:00:00.000Z',
                     consentDate: '2026-02-28', formVersion: '2025-01' },
    },
    {
      id: 'c-nocontact', name: 'Ana Kos', email: '', phone: '',
      goals: '', notes: '', weightHistory: [], active: true,
    },
  ],
};

renderClientDirectoryViewShell();
renderClientDetailViewShell();

window.__saved = 0;
bootClientForms({
  state,
  t,
  navigateToPath: noop,
  saveToLocalStorage: () => { window.__saved += 1; },
  populateDropdownSelectors: noop,
  showErrorView: noop,
  switchView: noop,
  openWorkoutSetupModal: noop,
});

// The Edit button reads the client the detail view is showing; there is no router to set it.
window.__editClient = (id) => {
  setActiveDetailClientId(id);
  document.getElementById('btn-edit-client').click();
};
window.__consentOf = (id) => state.clients.find((c) => c.id === id).gdprConsent;
""",
)


def _open_edit(page, client_id):
    page.evaluate(f"() => window.__editClient('{client_id}')")
    expect(page.locator("#dialog-client")).to_be_visible()


def _today():
    return datetime.date.today().isoformat()


def test_date_field_appears_only_once_consent_is_ticked(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    _open_edit(page, "c-new")

    expect(page.locator("#client-consent-date-group")).to_be_hidden()

    page.locator("#client-gdpr-consent").check()
    expect(page.locator("#client-consent-date-group")).to_be_visible()
    # Defaults to today, but stays editable: the paper is often signed before anyone opens the app.
    expect(page.locator("#client-consent-date")).to_have_value(_today())
    expect(page.locator("#client-consent-version")).to_contain_text("2026-08")


def test_existing_consent_shows_its_signed_date_and_the_version_signed_under(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    _open_edit(page, "c-signed")

    expect(page.locator("#client-gdpr-consent")).to_be_checked()
    # The date on the paper (2026-02-28), not the app's write timestamp (2026-03-02).
    expect(page.locator("#client-consent-date")).to_have_value("2026-02-28")
    expect(page.locator("#client-consent-version")).to_contain_text("2025-01")


def test_delivery_buttons_carry_the_client_address_or_say_they_cannot(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    _open_edit(page, "c-new")

    email_btn = page.locator("#btn-consent-email")
    sms_btn = page.locator("#btn-consent-sms")
    assert email_btn.get_attribute("href").startswith("mailto:jane%40example.com?")
    assert sms_btn.get_attribute("href").startswith("sms:+38640123456?&body=")

    page.locator("#dialog-client .modal-cancel").click()
    _open_edit(page, "c-nocontact")
    # No hover-only explanation: with nothing to send to, the label itself says why.
    assert email_btn.get_attribute("href") is None
    expect(email_btn).to_contain_text("No email on file")
    expect(sms_btn).to_contain_text("No phone on file")


def test_archiving_reminder_opens_as_a_dialog(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    _open_edit(page, "c-new")

    page.locator("#btn-consent-info").click()
    info = page.locator("#dialog-consent-info")
    expect(info).to_be_visible()
    # The one sentence a trainer must not be able to miss.
    expect(info).to_contain_text("responsible for archiving the signed form")

    page.locator("#btn-consent-info-close").click()
    expect(info).to_be_hidden()


def test_saving_records_the_signed_date_and_the_current_form_version(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    _open_edit(page, "c-new")

    page.locator("#client-gdpr-consent").check()
    page.locator("#client-consent-date").fill("2026-07-04")
    page.locator("#form-client button[type=submit]").click()

    consent = page.evaluate("() => window.__consentOf('c-new')")
    assert consent["cloudSync"] is True
    assert consent["consentDate"] == "2026-07-04"
    assert consent["formVersion"] == "2026-08"
    # The write timestamp is recorded alongside, and is NOT the consent date.
    assert consent["timestamp"].startswith(_today())


def test_editing_a_consented_client_keeps_the_version_they_signed_under(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    _open_edit(page, "c-signed")

    page.locator("#client-goals").fill("Marathon prep")
    page.locator("#form-client button[type=submit]").click()

    consent = page.evaluate("() => window.__consentOf('c-signed')")
    # Editing an unrelated field must never silently claim the client agreed to newer wording.
    assert consent["formVersion"] == "2025-01"
    assert consent["consentDate"] == "2026-02-28"


def test_unticking_consent_clears_the_date_and_version(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    _open_edit(page, "c-signed")

    page.locator("#client-gdpr-consent").uncheck()
    expect(page.locator("#client-consent-date-group")).to_be_hidden()
    page.locator("#form-client button[type=submit]").click()

    consent = page.evaluate("() => window.__consentOf('c-signed')")
    # Withdrawal leaves no stale stamp behind claiming a live consent (GDPR Art. 7(3)).
    assert consent == {
        "cloudSync": False,
        "timestamp": "",
        "consentDate": "",
        "formVersion": "",
    }
