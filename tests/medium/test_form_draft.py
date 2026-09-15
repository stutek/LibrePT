# tests/medium/test_form_draft.py
# What a half-filled form remembers across a reload (src/modules/common/formDraft.js, TODO §38.12).
#
# Reported 2026-08-29: "kadar se izpolnjujejo obrazci in se zgodi page reload poskrbi, da se vsebina
# vnosnih polj ohrani". Measured on the client's intake page before anything was written: type a
# name, an email and a phone number, reload, and all three are gone.
#
# Medium rather than unit_js: the subject is a real form in a real browser, and the storage it uses
# is the browser's own — a Node test would be testing a fake of both. Medium rather than e2e: it
# needs no router, no database and no boot, and the reload here is a genuine one.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub

pytestmark = pytest.mark.clean_start

# One form, two subjects, and a field that opts out — the three things the helper has to tell apart.
STUB = """
import { keepFormDraft } from './modules/common/formDraft.js';

const stage = document.createElement('div');
stage.innerHTML = `
  <form id="the-form">
    <input type="text" id="who">
    <input type="email" id="mail">
    <textarea id="story"></textarea>
    <input type="checkbox" id="agreed" data-draft="never">
    <button type="submit" id="send">Send</button>
  </form>
`;
document.body.appendChild(stage);

// The subject the form is filled in FOR, the way the client dialog reads which client is open.
window.__subject = 'new';
const form = document.getElementById('the-form');
form.addEventListener('submit', (event) => event.preventDefault());

// What a dependent control would do: several forms in this app decide what to show from what has
// been typed, so a restored value that fired no event would leave those decisions made on an empty
// field.
window.__echoes = 0;
document.getElementById('mail').addEventListener('input', () => { window.__echoes += 1; });

window.__draft = keepFormDraft(form, () => window.__subject);
window.__draft.restore();
"""


def _mount(page, local_server):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#the-form")


def _fill(page, who="Ana Novak", mail="ana@example.com", story="Shoulder, sometimes."):
    page.fill("#who", who)
    page.fill("#mail", mail)
    page.fill("#story", story)


def test_a_reload_does_not_throw_away_what_was_typed(page, local_server):
    """The whole point. A reload on a gym floor is not a rare accident — it is a locked phone, a
    browser reclaiming memory, a mis-tap on the address bar — and the longest form in this app is
    filled in by a stranger on their own phone, with no second copy of it anywhere."""
    _mount(page, local_server)
    _fill(page)

    page.reload()
    page.wait_for_selector("#the-form")

    expect(page.locator("#who")).to_have_value("Ana Novak")
    expect(page.locator("#mail")).to_have_value("ana@example.com")
    expect(page.locator("#story")).to_have_value("Shoulder, sometimes.")


def test_agreement_is_given_again_rather_than_restored(page, local_server):
    """A ticked consent box put back by a script is a person agreeing to something without being
    asked, on a page they have just reloaded. Every other field carries on where it was; this one is
    the field where that is the wrong answer, which is why `data-draft="never"` exists at all."""
    _mount(page, local_server)
    _fill(page)
    page.check("#agreed")

    page.reload()
    page.wait_for_selector("#the-form")

    expect(page.locator("#who")).to_have_value("Ana Novak", timeout=5_000)
    expect(page.locator("#agreed")).not_to_be_checked()


def test_a_draft_belongs_to_the_subject_it_was_typed_for(page, local_server):
    """One form serves several subjects — the client dialog is "add a client" one moment and "edit
    Jane" the next. A draft that did not know the difference would spill half of Jane's details into
    the next person's form."""
    _mount(page, local_server)
    _fill(page, who="Jane's half-typed note")

    page.evaluate("() => { window.__subject = 'client:someone-else'; }")
    page.reload()
    page.wait_for_selector("#the-form")

    # The reloaded page starts on the first subject again, so the draft it restores is that one's.
    expect(page.locator("#who")).to_have_value("Jane's half-typed note")
    # ...and asking for another subject's draft finds nothing rather than the first one's words.
    page.evaluate(
        "() => { window.__subject = 'client:someone-else'; window.__draft.restore(); }"
    )
    expect(page.locator("#who")).to_have_value("Jane's half-typed note")
    assert (
        page.evaluate(
            "() => JSON.parse(sessionStorage.getItem('librept_draft:client:someone-else') || 'null')"
        )
        is None
    )


def test_submitting_forgets(page, local_server):
    """Submitted means finished. A draft left behind would come back the next time the form opens,
    offering to redo work that is already done."""
    _mount(page, local_server)
    _fill(page)

    page.click("#send")
    page.reload()
    page.wait_for_selector("#the-form")

    expect(page.locator("#who")).to_have_value("")


def test_a_restored_value_tells_the_form_it_arrived(page, local_server):
    """Assigning `.value` in silence is invisible to every listener. The intake invitation reads its
    contact box to choose between a text message and an email; a restored address that fired nothing
    would leave that choice made against an empty field."""
    _mount(page, local_server)
    _fill(page)
    page.reload()
    page.wait_for_selector("#the-form")

    expect(page.locator("#mail")).to_have_value("ana@example.com")
    assert page.evaluate("() => window.__echoes") >= 1


def test_nothing_outlives_the_tab(page, local_server, browser):
    """The client's page promises that closing it ends the matter, and that promise is the reason
    this is sessionStorage and not localStorage. A draft that outlived the tab would break it
    outright; one that dies with the tab keeps its substance while surviving the reload."""
    _mount(page, local_server)
    _fill(page)
    assert page.evaluate("() => Object.keys(sessionStorage).length") > 0

    other = browser.new_context()
    fresh = other.new_page()
    load_with_stub(fresh, local_server, STUB)
    fresh.wait_for_selector("#the-form")

    expect(fresh.locator("#who")).to_have_value("")
    assert fresh.evaluate("() => Object.keys(sessionStorage).length") == 0
    other.close()
