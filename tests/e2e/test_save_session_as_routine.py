# tests/e2e/test_save_session_as_routine.py
# A finished session on the client's page can be saved as a routine: the library gains a routine
# with every weight at 0 and a description saying where it came from, and the routine editor opens
# on it so the trainer can rename it. A planned (not performed) session offers no such button.


STORE = "(await import(new URL('data/stateStore.js', document.baseURI).href))"


def _base(page):
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _nav(page, path):
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        path,
    )
    page.wait_for_timeout(300)


def test_save_as_routine_adds_a_zero_weight_routine_and_opens_the_editor(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/clients/c1a9f0e2")

    before = page.evaluate(f"async () => {STORE}.getState().routines.length")
    card = page.locator(
        "#client-history-list .history-card", has_text="Assault Bike"
    ).first
    button = card.get_by_role("button", name="Save as routine")
    assert button.bounding_box()["height"] >= 44
    button.click()
    page.wait_for_timeout(600)

    # Some movements may be left out; the trainer is told in a dialog, so answer it if it shows.
    dialog_ok = page.locator("dialog[open] button", has_text="OK")
    if dialog_ok.count():
        dialog_ok.first.click()
        page.wait_for_timeout(400)

    saved = page.evaluate(
        f"""async () => {{
            const routines = {STORE}.getState().routines;
            return {{ count: routines.length, last: routines[routines.length - 1] }};
        }}"""
    )
    assert saved["count"] == before + 1
    routine = saved["last"]
    assert routine["exercises"], "the routine keeps the session's movements"
    assert all(item["weight"] == 0 for item in routine["exercises"])
    assert routine["description"].startswith("Saved from the session of ")
    assert page.locator("#dialog-routine").evaluate("d => d.open")
    assert page.locator("#routine-name").input_value() == routine["name"]


def test_a_planned_session_has_no_save_as_routine_button(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/clients/c1a9f0e2")
    performed = page.locator("#client-history-list .history-card").count()
    buttons = page.get_by_role("button", name="Save as routine").count()
    assert buttons == performed
