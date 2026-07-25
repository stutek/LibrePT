# tests/e2e/test_build_info.py
# "Which build am I on" has to be answerable ON A PHONE. The long build identity used to live only
# in the header stamp's `title` tooltip, which a touch device cannot reach at all — a support detail
# only a mouse can see is a support detail nobody has. The stamp is now a button opening a dialog
# that shows release, commit and DATA SCHEMA (after a rollback those are different questions), and
# offers the text as one copyable block, because the point of a build id is pasting it somewhere.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_the_header_stamp_is_a_real_touch_target(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#app-version")
    page.wait_for_timeout(300)

    stamp = page.locator("#app-version")
    assert stamp.is_visible(), "the stamp is shown on every viewport, phones included"
    assert stamp.evaluate("el => el.tagName") == "BUTTON", (
        "it must be a button, not a span, to be operable by touch and assistive tech"
    )
    # 9px of text is nothing to aim at with a gym-floor thumb; padding buys a usable target.
    height = stamp.evaluate("el => el.getBoundingClientRect().height")
    assert height >= 20, f"touch target is only {height}px tall"


def test_tapping_the_stamp_shows_release_commit_and_data_schema(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#app-version")
    page.wait_for_timeout(300)

    page.click("#app-version")
    page.wait_for_selector("#dialog-build-info[open]")

    labels = page.locator("#build-info-rows dt").all_inner_texts()
    values = page.locator("#build-info-rows dd").all_inner_texts()
    facts = dict(zip(labels, values))

    assert facts["Version"] == "dev", "the untagged build every install runs today"
    assert facts["Commit"], "a bug report has to be pinnable to a build"
    # The data schema sits beside the code version on purpose: after a rollback it is the answer to
    # "why are records missing", and the code version alone cannot tell you.
    assert facts["Data schema"] == "2"
    assert "Built" in facts


def test_the_build_details_are_offered_as_one_copyable_block(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    text = page.evaluate(
        """async () => {
            const m = await import(new URL('modules/common/buildInfoDialog.js', document.baseURI).href);
            return m.buildInfoText();
        }"""
    )

    # Plain text, one fact per line: it gets pasted into whatever chat app is to hand.
    assert "release: dev" in text
    assert "data schema: 2" in text
    assert "commit:" in text
    assert "built:" in text


def test_the_dialog_closes(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#app-version")
    page.wait_for_timeout(300)

    page.click("#app-version")
    page.wait_for_selector("#dialog-build-info[open]")
    page.click("#dialog-build-info .modal-close-btn")
    page.wait_for_timeout(200)

    assert page.locator("#dialog-build-info[open]").count() == 0
