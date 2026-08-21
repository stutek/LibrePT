# tests/medium/test_overflow_helper.py
# The helper in tests/medium/_overflow.py is an assertion other component tests lean on, so it
# needs its own proof that it fails when the component overflows and passes when it does not
# (TODO §25.6). Without this, a helper that silently swept nothing would make every caller green.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)
from tests.medium._overflow import assert_component_fits

pytestmark = pytest.mark.clean_start

OVERLAY = "#active-session-overlay"


def _mount(page, local_server):
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(exercises=[exercise_item("e1", "Back Squat")])
        ),
    )
    page.wait_for_selector(f"{OVERLAY}:not(.hidden)")


def test_the_live_clipboard_fits_the_phone_it_is_used_on(page, local_server):
    _mount(page, local_server)

    assert_component_fits(page, OVERLAY, label="live clipboard")


def test_a_card_pushed_out_of_the_clipboard_is_reported_against_the_clipboard(
    page, local_server
):
    """The defect §25 was built for: an element wider than the phone, clipped away silently."""
    _mount(page, local_server)
    page.evaluate(
        """() => {
          const wide = document.createElement('div');
          wide.className = 'planted-overflow';
          wide.style.cssText = 'width: 900px; height: 40px;';
          document.querySelector('#active-session-overlay .session-deck, #active-session-overlay')
            .appendChild(wide);
        }"""
    )

    with pytest.raises(AssertionError) as failure:
        assert_component_fits(page, OVERLAY, label="live clipboard")

    assert "planted-overflow" in str(failure.value), (
        "the failure has to name the element, or the component test cannot act on it"
    )
    assert "live clipboard" in str(failure.value)


def test_a_root_that_never_mounted_fails_rather_than_sweeping_nothing(
    page, local_server
):
    _mount(page, local_server)

    with pytest.raises(AssertionError, match="not mounted"):
        assert_component_fits(page, "#no-such-component")
