# tests/medium/test_intake_form.py
# The client intake form, mounted cold (TODO §1.7/§26.1).
#
# §26.1 asked for exactly this tier: "intake must render on a stock, cold browser — no IndexedDB
# write, no demo seed, no service-worker dependency, no boot of the trainer's app state. It is the
# only route in the app that is stateless by design, and a medium test should pin that rather than
# trusting it."
#
# So these mount `bootIntake` — the real boot step app.js calls for a client — against the real
# index.html markup, with platform calls faked. The one thing they cannot pin here is the boot
# DECISION (that a visit to /intake never starts the trainer's app); that needs a real navigation and
# lives in tests/e2e/test_intake.py.

import json

from playwright.sync_api import expect

from tests.medium._harness import load_with_stub

# A fake share/save platform that records what it was handed, so a test can read the file's bytes —
# the thing the client actually sends — instead of asserting on a click.
INTAKE_STUB = """
import * as appBoot from './appBoot.js';
import { TRANSLATIONS } from './i18n/index.js';

// A real invitation arrives with the sender in its fragment; the harness always navigates to the
// bare root, so a test that is about that fragment puts it on before the page reads it.
if (window.__intakeHash) window.location.hash = window.__intakeHash;

window.__delivered = [];
let lang = 'en';

appBoot.bootIntake({
  t: (key) => TRANSLATIONS[lang][key] || key,
  lang: () => lang,
  onChooseLanguage: (chosen) => { lang = chosen; },
  platform: {
    canShareFiles: () => window.__canShare !== false,
    shareFiles: async (data) => {
      window.__delivered.push({ how: 'share', name: data.files[0].name, text: await data.files[0].text() });
    },
    saveFile: async (file) => {
      window.__delivered.push({ how: 'save', name: file.name, text: await file.text() });
    },
  },
  todayIso: () => '2026-08-17',
  consentVersion: '2026-08-09',
  noticeUrlFor: (l) => `privacy-notice-${l}.html`,
  formUrlFor: (l) => `consent-form-${l}.html`,
});
"""


def _mount(page, local_server, can_share=True):
    page.add_init_script(f"window.__canShare = {json.dumps(can_share)};")
    load_with_stub(page, local_server, INTAKE_STUB)
    expect(page.locator("#view-intake")).to_be_visible()


def _deliver(page, button):
    """Tap a send button and wait for the fake platform to have been handed the file.

    The wait is not politeness: reading the file's bytes is `await file.text()`, so the stub records
    the delivery a tick after the click returns. Asserting immediately read an empty list — and would
    have gone on doing so for any future delivery route.
    """
    page.click(button)
    page.wait_for_function("() => window.__delivered.length > 0", timeout=5000)
    return page.evaluate("() => window.__delivered")


def _app_written_local_storage(page):
    """localStorage keys the APP wrote. `librept_terms_accepted` is pre-seeded by conftest's autouse
    fixture for every browser test, so it is the harness's key, not something this path stored."""
    keys = page.evaluate("() => Object.keys(localStorage)")
    return [key for key in keys if key != "librept_terms_accepted"]


def _fill(page, name="Jana Novak", email="jana@example.com", goals="", injury=""):
    page.fill("#intake-name", name)
    page.fill("#intake-email", email)
    if goals:
        page.fill("#intake-goals", goals)
    if injury:
        page.fill("#intake-injury", injury)


def test_the_form_leaves_nothing_on_the_client_phone(page, local_server):
    """The promise §26.1 makes and the one a stranger is entitled to: filling this in and walking away
    stores nothing. No database, no keys, not even a theme preference — the trainer's boot writes all
    three and this path runs none of it."""
    _mount(page, local_server)
    _fill(page, injury="knee reconstruction 2024")
    page.check("#intake-consent")
    _deliver(page, "#intake-save")

    assert _app_written_local_storage(page) == []
    assert page.evaluate("() => Object.keys(sessionStorage)") == []
    assert (
        page.evaluate("async () => (await indexedDB.databases()).map((d) => d.name)")
        == []
    )


def test_the_file_carries_what_the_client_typed_and_what_they_ticked(
    page, local_server
):
    _mount(page, local_server)
    _fill(page, goals="back to squatting", injury="knee reconstruction 2024")
    page.check("#intake-consent")

    delivered = _deliver(page, "#intake-save")

    assert len(delivered) == 1
    payload = json.loads(delivered[0]["text"])
    assert payload["name"] == "Jana Novak"
    assert payload["injury"] == "knee reconstruction 2024"
    assert payload["goals"] == "back to squatting"
    # The consent stamp is the point of the client doing this themselves: their date, the wording
    # version live when they were shown it, and the language they read it in.
    assert payload["gdprConsent"] == {
        "cloudSync": True,
        "consentDate": "2026-08-17",
        "formVersion": "2026-08-09",
        "formLang": "en",
    }
    assert delivered[0]["name"] == "jana-novak-2026-08-17.json.librept-signup"


def test_the_page_says_who_the_link_came_from(page, local_server):
    """Asked 2026-08-23: "how would she know this is not phishing?" — the page asked a stranger for
    health details while saying only "your trainer", naming nobody.

    It cannot PROVE who sent it, and does not try: with no server there is no identity to check. What
    it gives the reader is something to compare — the name in the message, the name here, and the
    person they just spoke to — plus the plain fact that this page sends nothing on its own."""
    page.add_init_script(
        "window.__intakeHash = '#from=' + encodeURIComponent('Sam Trainer|+386 40 111 222');"
    )
    _mount(page, local_server)

    sender = page.locator("#intake-sender")
    expect(sender).to_be_visible()
    expect(sender).to_contain_text("Sam Trainer")
    expect(sender).to_contain_text("+386 40 111 222")
    # And the reader is told what to do about it, in the one place they are looking.
    expect(sender).to_contain_text("do not fill it in")
    expect(sender).to_contain_text("sends nothing by itself")


def test_a_link_naming_nobody_claims_nothing(page, local_server):
    """A leaflet QR and a link from an install that never filled the trainer's own details in both
    arrive without a name. Saying "sent by —" would look like something had been checked."""
    _mount(page, local_server)

    expect(page.locator("#intake-sender")).to_be_hidden()


def test_the_tick_itself_says_what_is_being_agreed_to(page, local_server):
    """Informed consent rests on full disclosure or it is void (ruled 2026-08-23).

    The line beside the box is the only thing most people read — the notice and the full wording are
    one tap away and stay there for the detail, but the substance may not hide behind them. So the
    sentence names where the details live, that there may be a backup copy in cloud storage, that
    nobody else receives them, and the right to withdraw.

    **The VENDOR is not part of that list** (ruled 2026-08-31, §39.3). This asked for "Drive" until
    then, which put it at odds with the letter it summarises — that letter says "my personal cloud
    storage" and names nobody, and a client handed one wording while ticking another has not been
    informed. What is disclosed here is the KIND of recipient; who it is belongs in the privacy
    notice this line links to, which names Google Drive in full in both languages.
    tests/unit_js/modules/common/consentForm.test.mjs holds the other half: no consent text a client
    ticks or signs may name a vendor at all."""
    _mount(page, local_server)

    agreed = page.locator("label[for='intake-consent']").inner_text()

    for disclosed in (
        "device",
        "backup",
        "cloud storage",
        "no other service",
        "withdraw",
    ):
        assert disclosed.lower() in agreed.lower(), (
            f"the consent line does not disclose {disclosed!r}: {agreed!r}"
        )


def test_nothing_is_sent_until_the_consent_box_is_ticked(page, local_server):
    """A trainer may not store a stranger's details without it, so the form refuses to produce the
    file at all — and says which of the two problems it is, rather than one generic error."""
    _mount(page, local_server)
    _fill(page)

    page.click("#intake-save")

    assert page.evaluate("() => window.__delivered") == []
    expect(page.locator("#intake-status")).to_be_visible()
    expect(page.locator("#intake-status")).to_contain_text("consent")


def test_a_nameless_or_uncontactable_submission_is_refused_for_its_own_reason(
    page, local_server
):
    _mount(page, local_server)
    page.check("#intake-consent")

    page.click("#intake-save")

    assert page.evaluate("() => window.__delivered") == []
    # Distinct from the consent message above: "you left a field blank" and "you have not agreed to
    # anything" are different problems, and one generic error would hide which.
    expect(page.locator("#intake-status")).to_contain_text("name")


def test_health_detail_is_optional_and_absent_rather_than_blank(page, local_server):
    """Ruled 2026-08-17: the client offers these if they choose. Saying nothing must produce a complete
    submission — and leave no empty strings behind, so a trainer can tell "chose not to say" from a
    field nobody has filled in yet."""
    _mount(page, local_server)
    _fill(page)
    page.check("#intake-consent")

    payload = json.loads(_deliver(page, "#intake-save")[0]["text"])
    assert "goals" not in payload
    assert "injury" not in payload
    assert payload["name"] == "Jana Novak"


def test_the_client_reads_and_consents_in_their_own_language(page, local_server):
    """The language switch is not a nicety here: it decides which wording the client is agreeing to,
    and `formLang` has to record the one they actually read (Art. 7(1))."""
    _mount(page, local_server)

    page.click('[data-intake-lang="sl"]')

    expect(page.locator("#intake-title")).to_contain_text("Predstavi se")
    # The links follow the choice — the notice they are being pointed at must be the one they can read.
    assert "consent-form-sl.html" in page.locator("#intake-form-link").get_attribute(
        "href"
    )
    assert page.evaluate("() => document.documentElement.lang") == "sl"

    _fill(page)
    page.check("#intake-consent")

    payload = json.loads(_deliver(page, "#intake-save")[0]["text"])
    assert payload["gdprConsent"]["formLang"] == "sl"


def test_the_share_button_is_offered_only_where_sharing_a_file_works(
    page, local_server
):
    """Every desktop browser and iOS below 15 cannot share files — a permanent case, not a gap. The
    save button is the whole flow there, so a share button that would throw is never shown."""
    _mount(page, local_server, can_share=False)

    expect(page.locator("#intake-send")).to_be_hidden()
    expect(page.locator("#intake-save")).to_be_visible()


def test_where_sharing_works_it_is_the_one_tap_route(page, local_server):
    _mount(page, local_server, can_share=True)
    _fill(page)
    page.check("#intake-consent")

    delivered = _deliver(page, "#intake-send")

    assert [entry["how"] for entry in delivered] == ["share"]
    expect(page.locator("#intake-status")).to_contain_text("Shared")
