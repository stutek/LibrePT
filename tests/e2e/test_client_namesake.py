# tests/e2e/test_client_namesake.py
# A second client with a name that is already in the directory is not saved without a question.
# Found by exploratory testing: two identical "Hana Kolar" cards, and a session's client search
# showing two identical rows. Fixtures (page, local_server) come from tests/conftest.py.

from playwright.sync_api import expect


def _open_clients(page, local_server):
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")


def _add(page, name, alias=""):
    page.locator("#btn-add-client").click()
    page.locator("#client-name").fill(name)
    if alias:
        page.locator("#client-alias").fill(alias)
    page.locator("#dialog-client button[type='submit']").click()


def test_a_first_client_of_a_name_is_saved_without_a_question(page, local_server):
    _open_clients(page, local_server)
    _add(page, "Hana Namesake")
    expect(page.locator("#dialog-client")).to_be_hidden()
    expect(page.locator("#dialog-app-question")).not_to_be_visible()


def test_a_second_client_of_the_same_name_asks_first(page, local_server):
    _open_clients(page, local_server)
    _add(page, "Hana Namesake")
    expect(page.locator("#dialog-client")).to_be_hidden()

    _add(page, "Hana Namesake")
    question = page.locator("#dialog-app-question")
    expect(question).to_be_visible()
    assert "Hana Namesake" in question.inner_text()

    # Cancel goes back to the form, to the alias field.
    page.locator("#app-question-cancel").click()
    expect(page.locator("#dialog-client")).to_be_visible()
    expect(page.locator("#client-alias")).to_be_focused()

    # With an alias there is nothing to ask.
    page.locator("#client-alias").fill("morning")
    page.locator("#dialog-client button[type='submit']").click()
    expect(page.locator("#dialog-client")).to_be_hidden()
    expect(page.locator("#dialog-app-question")).not_to_be_visible()


def test_the_trainer_can_keep_the_second_client_without_an_alias(page, local_server):
    _open_clients(page, local_server)
    _add(page, "Hana Namesake")
    _add(page, "Hana Namesake")
    page.locator("#app-question-confirm").click()
    expect(page.locator("#dialog-client")).to_be_hidden()
    count = page.evaluate(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return s.getState().clients.filter((c) => c.name === 'Hana Namesake').length;
        }"""
    )
    assert count == 2


def test_the_name_field_has_a_length_limit(page, local_server):
    _open_clients(page, local_server)
    page.locator("#btn-add-client").click()
    assert int(page.locator("#client-name").get_attribute("maxlength")) <= 100
