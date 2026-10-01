# tests/medium/test_clients_directory.py
# The Client Directory grid (modules/clients/clientsDirectory.js), its own first-class view/route:
# it lists one .client-card per seeded client, filters live as the search box is
# typed (by name or goal), and shows an empty state when nothing matches. Mounted as a single view
# via tests/medium/_harness.py's view_stub — no router, no IndexedDB, no app boot.
#
# The search box's listener lives in clientFormsController, not in the view module, so the stub
# boots that controller through appBoot.bootClientForms — the exact step app.js calls. It used to
# hand-duplicate the listener instead, which passed navigateToPath on both paths and so could not
# see that the real controller passed it on neither, fixed alongside this change: the
# filtered grid rendered correctly and threw on the first card tap.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { bootClientForms } from './appBoot.js';
import { openClientEditor } from './controllers/clientFormsController.js';
import {
  renderClientDetailViewShell,
  renderClientDirectoryViewShell,
  renderClientsList,
} from './modules/clients/clientsView.js';
import { DEFAULT_CLIENTS } from './data/index.js';
""",
    view_id="client-directory",
    body="""
const state = { clients: structuredClone(DEFAULT_CLIENTS), lang: 'en' };

// Both shells: setupClientForms wires #btn-add-client (directory) and #btn-edit-client (detail),
// and reaches for the latter unguarded.
renderClientDirectoryViewShell();
renderClientDetailViewShell();

// Recorded rather than acted on — there is no router here, so what a card click must prove is that
// the callback EXISTS and is reached, which is exactly what was broken.
window.__navigated = [];
// No router here: the client.edit route's enter() is what opens the editor in the app, so this fake
// does that one pairing itself, keyed on what urlFor() named.
const routeTo = (path) => {
  const [name, clientId] = path.split('/').filter(Boolean);
  if (name === 'client.edit') openClientEditor(clientId);
};
const urlFor = (name, params = {}) => `/${name}/${params.clientId ?? ''}`;
bootClientForms({
  // The controller reads the state WHEN a handler runs, not when it was wired.
  getState: () => state,
  t,
  navigateToPath: (path) => {
    window.__navigated.push(path);
    routeTo(path);
  },
  urlFor,
  saveToLocalStorage: noop,
  populateDropdownSelectors: noop,
  showErrorView: noop,
  switchView: noop,
  openWorkoutSetupModal: noop,
});
renderClientsList({ state, t, navigateToPath: (path) => window.__navigated.push(path) });
""",
)


def _cards(page):
    return page.locator("#clients-list .client-card")


def test_directory_lists_all_seeded_clients(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    # Eight clients are seeded (src/data/clients.js).
    assert _cards(page).count() == 8


def test_search_filters_clients_live(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")

    page.locator("#search-clients").fill("jane")
    # expect() rather than count()/inner_text(): .client-card carries `content-visibility: auto`
    # (src/index.css), so the browser is free to skip rendering the card's subtree on the frame
    # this assertion reads — and inner_text() only sees RENDERED text, so it came back empty while
    # count() correctly saw 1 card. expect().to_contain_text() reads textContent and retries, so it
    # is immune to the skipped-rendering window. The full-app boot this test came from was slow
    # enough to hide the race; a bare mounted view is not.
    expect(_cards(page)).to_have_count(1)
    expect(_cards(page).first).to_contain_text("Jane Doe")

    # Clearing the query restores the full directory.
    page.locator("#search-clients").fill("")
    expect(_cards(page)).to_have_count(8)


def test_search_with_no_match_shows_empty_state(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")

    page.locator("#search-clients").fill("zzzznomatch")
    expect(_cards(page)).to_have_count(0)
    empty = page.locator("#clients-list").inner_text().strip()
    assert empty, "expected a non-empty empty-state message"


def test_a_card_still_opens_after_the_grid_has_been_filtered(page, local_server):
    """The search re-render dropped navigateToPath, so every card in a FILTERED grid threw
    on tap while an unfiltered one worked — the failure only ever appeared after a search."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")

    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))

    page.locator("#search-clients").fill("jane")
    expect(_cards(page)).to_have_count(1)
    _cards(page).first.click()

    assert not errors, f"clicking a filtered card raised: {errors}"
    assert page.evaluate("() => window.__navigated") == ["/clients/c1a9f0e2"]


def test_the_cross_that_closes_the_form_is_a_thumb_wide(page, local_server):
    """The ✕ in the corner of every dialog measured 12 × 16 pixels: the smallest target in the form
    is the one a trainer leaves it by."""
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    page.locator("#btn-add-client").click()
    page.wait_for_selector("#dialog-client[open]")

    box = page.locator("#dialog-client .modal-close-btn").bounding_box()
    assert box and box["width"] >= 44 and box["height"] >= 44, box


def test_an_injury_the_trainer_writes_down_raises_the_warning(page, local_server):
    """The trainer wrote "knee surgery 2023, right" into the client form, and the clipboard never
    warned about it: only a client's own signup set the flag the warning reads. The form has its own
    field for injuries, and what is written there is what the warning shows; other notes stay apart."""
    seeded = "const state = { clients: structuredClone(DEFAULT_CLIENTS), lang: 'en' };"
    assert seeded in STUB
    load_with_stub(
        page, local_server, STUB.replace(seeded, seeded + "\nwindow.__state = state;")
    )
    page.wait_for_selector("#view-client-directory.active")
    page.locator("#btn-add-client").click()
    page.wait_for_selector("#dialog-client[open]")

    page.fill("#client-name", "Ana Testna")
    page.fill("#client-injury", "knee surgery 2023, right")
    page.fill("#client-notes", "prefers mornings")
    page.locator("#form-client button[type=submit]").click()
    page.wait_for_selector("#dialog-client", state="hidden")

    saved = page.evaluate(
        "() => window.__state.clients.find((c) => c.name === 'Ana Testna')"
    )
    assert saved["hasInjury"] is True
    assert saved["injury"] == "knee surgery 2023, right"
    assert saved["notes"] == "prefers mornings"


def test_the_initials_follow_a_rename(page, local_server):
    """They were stamped once, while the client was being added. A client saved before their name was
    typed carries the placeholder's letters, and renaming them left those letters on the round badge in
    the directory and on the clipboard — NS beside "SIM Ana Testna"."""
    seeded = "const state = { clients: structuredClone(DEFAULT_CLIENTS), lang: 'en' };"
    assert seeded in STUB
    load_with_stub(
        page, local_server, STUB.replace(seeded, seeded + "\nwindow.__state = state;")
    )
    page.wait_for_selector("#view-client-directory.active")
    page.locator("#btn-add-client").click()
    page.wait_for_selector("#dialog-client[open]")
    page.fill("#client-goals", "lose weight")
    page.locator("#form-client button[type=submit]").click()
    page.wait_for_selector("#dialog-client", state="hidden")

    added = page.evaluate(
        "() => window.__state.clients.find((c) => c.goals === 'lose weight')"
    )
    placeholder_initials = added["avatar"]

    # The Edit button asks the view which client is on screen, and there is no router here to put one
    # there — so the test does both halves of what opening the page would: names the client, and shows
    # the detail section the button lives in.
    page.evaluate(
        """(id) => import('./modules/clients/clientsView.js').then((m) => {
            m.setActiveDetailClientId(id);
            document.getElementById('view-client-detail').classList.add('active');
        })""",
        added["id"],
    )
    page.locator("#btn-edit-client").click()
    page.wait_for_selector("#dialog-client[open]")
    page.fill("#client-name", "Ana Testna")
    page.locator("#form-client button[type=submit]").click()
    page.wait_for_selector("#dialog-client", state="hidden")

    renamed = page.evaluate(
        "() => window.__state.clients.find((c) => c.name === 'Ana Testna')"
    )
    assert renamed["avatar"] == "AT", (
        f"the badge still carries the old name's letters: {renamed['avatar']} "
        f"(was {placeholder_initials})"
    )


@pytest.mark.parametrize("width,height", [(390, 844), (320, 680)])
def test_save_is_on_the_screen_when_the_client_form_opens(
    page, local_server, width, height
):
    """The form opened with its Save 133 pixels below a 390×844 screen and 387 below a 320×680 one:
    a trainer fixing one field had to scroll the whole form to find the one way to keep it, and a
    new user concluded it could not be saved. The action row stays on the screen."""
    page.set_viewport_size({"width": width, "height": height})
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")
    page.locator("#btn-add-client").click()
    page.wait_for_selector("#dialog-client[open]")

    save = page.locator("#form-client button[type=submit]")
    box = save.bounding_box()
    assert box and box["y"] >= 0 and box["y"] + box["height"] <= height, (box, height)
    hit = page.evaluate(
        """() => { const b = document.querySelector('#form-client button[type=submit]');
                   const r = b.getBoundingClientRect();
                   return b.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }"""
    )
    assert hit, "something covers the Save button"


def test_the_search_finds_a_client_by_the_alias_on_their_card(page, local_server):
    """An alias exists to tell two people with one name apart, and it is printed on the card; a
    search for it answered "No clients found" and offered to add a new client."""
    seeded = "const state = { clients: structuredClone(DEFAULT_CLIENTS), lang: 'en' };"
    assert seeded in STUB
    stub = STUB.replace(
        seeded,
        seeded
        + "\nstate.clients.find((c) => c.name === 'Jane Doe').alias = 'mornings';",
    )
    load_with_stub(page, local_server, stub)
    page.wait_for_selector("#view-client-directory.active")

    page.locator("#search-clients").fill("morn")
    expect(_cards(page)).to_have_count(1)
    expect(_cards(page).first).to_contain_text("Jane Doe")
