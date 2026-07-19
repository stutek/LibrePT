# tests/e2e/test_first_run_terms.py
# End-to-end coverage of the first-run Terms & disclaimer agreement (TODO 10.2): on a fresh
# install the mandatory Terms modal is shown (no ✕, Escape blocked), "I agree" persists the
# acceptance to localStorage and dismisses it, and a returning (accepted) user never sees it.
#
# These tests build their OWN browser context so the conftest auto-accept fixture (which only
# covers the shared `page` fixture) does not suppress the modal.


def _fresh_page(browser, local_server, accepted=False):
    context = browser.new_context()
    if accepted:
        context.add_init_script(
            "window.localStorage.setItem('librept_terms_accepted', '1');"
        )
    page = context.new_page()
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    return context, page


def test_terms_shown_and_mandatory_on_first_run(browser, local_server):
    context, page = _fresh_page(browser, local_server)
    try:
        terms = page.locator("#dialog-terms")
        assert terms.get_attribute("open") is not None
        assert "first-run" in (terms.get_attribute("class") or "")

        # Mandatory: the ✕ dismiss is hidden and Escape does not close it.
        assert page.locator("#dialog-terms .modal-close-btn").is_hidden()
        assert page.locator("#btn-terms-agree").is_visible()

        page.keyboard.press("Escape")
        page.wait_for_timeout(150)
        assert terms.get_attribute("open") is not None, (
            "Escape must not dismiss the first-run terms"
        )

        # Not accepted until the user agrees.
        assert (
            page.evaluate("() => localStorage.getItem('librept_terms_accepted')")
            is None
        )
    finally:
        context.close()


def test_agree_persists_and_survives_reload(browser, local_server):
    context, page = _fresh_page(browser, local_server)
    try:
        page.locator("#btn-terms-agree").click()

        terms = page.locator("#dialog-terms")
        assert terms.get_attribute("open") is None
        assert "first-run" not in (terms.get_attribute("class") or "")
        assert (
            page.evaluate("() => localStorage.getItem('librept_terms_accepted')") == "1"
        )

        # A returning load does not re-show the modal.
        page.reload()
        page.wait_for_selector("#view-clients.active")
        assert page.locator("#dialog-terms").get_attribute("open") is None
    finally:
        context.close()


def test_accepted_user_never_sees_terms(browser, local_server):
    context, page = _fresh_page(browser, local_server, accepted=True)
    try:
        assert page.locator("#dialog-terms").get_attribute("open") is None
    finally:
        context.close()
