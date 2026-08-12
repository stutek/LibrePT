# tests/medium/test_client_data_rights.py
# The two data-subject-request dialogs (modules/clients/clientDataRights.js), mounted through the
# real bootClientDataRights step against the real client-detail markup.
#
# What only a DOM tier can hold: that the confirmation ceremony cannot be completed by reflex, that
# BOTH dialogs name which of two same-named clients they are about, and that the erasure receipt
# actually lists the surfaces the app could not reach. The state transforms underneath are pinned in
# tests/unit_js/data/clientErasure.test.mjs and friends.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { bootClientDataRights } from './appBoot.js';
import {
  renderClientDetailViewShell,
  renderClientDirectoryViewShell,
  showClientDetails,
} from './modules/clients/clientsView.js';
""",
    view_id="client-detail",
    body="""
// Two Jane Does, deliberately: this dialog family exists to make sure a request lands on the right
// one. The second carries an alias, which is the trainer's own way of telling them apart.
let state = {
  lang: 'en',
  clients: [
    {
      id: 'c-jane-a', name: 'Jane Doe', email: 'jane.a@example.com', phone: '+386 40 111 111',
      goals: 'Squat 100kg', notes: 'Anxious about maxes', weightHistory: [], active: true,
      joinedDate: '2026-01-05',
    },
    {
      id: 'c-jane-b', name: 'Jane Doe', alias: 'evening', email: 'jane.b@example.com',
      goals: '', notes: '', weightHistory: [], active: true, joinedDate: '2026-02-02',
    },
  ],
  history: [
    { id: 'h1', clientId: 'c-jane-a', clientName: 'Jane Doe', date: '2026-03-01T09:00:00.000Z',
      routineName: 'Upper A', exercises: [], feedback: [] },
  ],
  planUpdates: [],
  sessions: [{ id: 's1', participants: ['c-jane-a'], title: 'Jane Doe 1:1', day: 'Mon' }],
};

renderClientDirectoryViewShell();
renderClientDetailViewShell();

bootClientDataRights({
  getState: () => state,
  saveState: (next) => { state = next; },
  isDriveConfigured: () => false,
  t,
});

window.__openDetail = (id) => showClientDetails({
  clientId: id,
  state,
  t,
  showErrorView: noop,
  switchView: noop,
  openWorkoutSetupModal: noop,
});
window.__clientOf = (id) => state.clients.find((client) => client.id === id);
window.__openDetail('c-jane-a');
""",
)


def _open_detail(page, client_id):
    page.evaluate(f"() => window.__openDetail('{client_id}')")


def test_erase_dialog_names_the_target_and_warns_about_the_namesake(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-detail.active")

    page.locator("#btn-client-erase").click()
    expect(page.locator("#dialog-client-erase")).to_be_visible()

    # The subject line is the whole safety mechanism: a name alone cannot distinguish the two.
    expect(page.locator("#client-erase-subject")).to_contain_text("jane.a@example.com")
    # And the OTHER Jane is named, with her own details, so a trainer with the wrong record open
    # can notice before typing the confirmation.
    expect(page.locator("#client-erase-namesakes")).to_be_visible()
    expect(page.locator("#client-erase-namesakes")).to_contain_text("evening")


def test_erasure_cannot_be_completed_by_reflex(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-detail.active")
    page.locator("#btn-client-erase").click()

    confirm = page.locator("#btn-erase-confirm")
    expect(confirm).to_be_disabled()

    # Lowercase is what a reflex types, so it must not unlock the button.
    page.locator("#client-erase-confirm").fill("erase")
    expect(confirm).to_be_disabled()

    page.locator("#client-erase-confirm").fill("ERASE")
    expect(confirm).to_be_enabled()


def test_erasure_anonymizes_the_record_and_reports_what_it_could_not_reach(
    page, local_server
):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-detail.active")
    page.locator("#btn-client-erase").click()

    page.locator("#client-erase-requested").fill("2026-08-01")
    page.locator("#client-erase-confirm").fill("ERASE")
    page.locator("#btn-erase-confirm").click()

    receipt = page.locator("#client-erase-receipt")
    expect(receipt).to_be_visible()
    # What the trainer must be able to see: the client is gone from their own receipt, replaced by
    # some stable label. The label's exact spelling is the module's business (AGENT_RULES §5.8).
    expect(receipt).not_to_contain_text("Jane Doe")
    expect(receipt).to_contain_text("Erased in the app as")
    # The honest half: the surfaces LibrePT cannot touch are listed, not glossed as "done".
    expect(receipt).to_contain_text("Your sent mail")
    expect(receipt).to_contain_text("The gym calendar")
    # And the one item that must NOT be destroyed.
    expect(receipt).to_contain_text("signed consent form")

    erased = page.evaluate("() => window.__clientOf('c-jane-a')")
    assert erased["email"] == ""
    assert erased["notes"] == ""
    assert erased["erasure"]["requestedOn"] == "2026-08-01"
    # The other Jane is untouched by a request that was not hers.
    assert (
        page.evaluate("() => window.__clientOf('c-jane-b')")["email"]
        == "jane.b@example.com"
    )


def test_the_erased_record_says_so_on_the_profile(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-detail.active")
    page.locator("#btn-client-erase").click()
    page.locator("#client-erase-confirm").fill("ERASE")
    page.locator("#btn-erase-confirm").click()

    _open_detail(page, "c-jane-a")
    # An erased record stays in the directory so a trainer can show the request was actioned — which
    # only works if the record says what it is.
    expect(page.locator("#profile-erased")).to_be_visible()
    expect(page.locator("#profile-erased")).to_contain_text("at the client's request")


def test_export_dialog_shows_scope_notes_and_a_passphrase(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-detail.active")

    page.locator("#btn-client-export").click()
    expect(page.locator("#dialog-client-export")).to_be_visible()
    expect(page.locator("#client-export-subject")).to_contain_text("jane.a@example.com")

    # The trainer's own notes are pre-filled because they ARE disclosed — the field is there to
    # redact third parties, not to decide whether to hand over an opinion.
    expect(page.locator("#client-export-notes")).to_have_value("Anxious about maxes")
    # A generated passphrase, not an empty box a trainer would fill with their dog's name.
    passphrase = page.locator("#client-export-passphrase").input_value()
    assert passphrase.count("-") == 5

    page.locator("#btn-export-new-passphrase").click()
    assert page.locator("#client-export-passphrase").input_value() != passphrase


def test_the_compose_link_never_carries_the_passphrase(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-detail.active")
    page.locator("#btn-client-export").click()

    passphrase = page.locator("#client-export-passphrase").input_value()
    href = page.locator("#btn-export-compose").get_attribute("href")

    assert href.startswith("mailto:jane.a%40example.com")
    # An email carrying both the ciphertext and its key protects nothing.
    assert passphrase not in href
    # And the email must tell the client how to open it, since an app cannot attach the file itself.
    assert "encrypted" in href
