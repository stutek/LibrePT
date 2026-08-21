# tests/medium/_overflow.py — one line of geometry for a component test (TODO §25.6).
#
# tests/e2e/test_layout_overflow.py walks every route and sweeps the whole page, which finds the
# defect but names the ROUTE it appeared on; the component that produced it is then a guess. This
# tier already mounts exactly one component, so the same sweep — agent_tools/overflow_scan.py, no
# second copy of the rules — scoped to that component's own element attributes the finding to it,
# in the test that owns it and can fix it.
#
# The sweep measures against real ancestors either way: only the set of elements ASSERTED is
# scoped, so a card clipped by the real overlay above it is still reported.

from agent_tools import overflow_scan

# The width overflow shows at first, and the one a trainer holds. A component test that never set
# a viewport otherwise sweeps at Playwright's default desktop width, where nothing is tight enough
# to break — a green sweep that proves nothing is worse than no sweep, so the phone is the default
# and a caller wanting another width passes it.
PHONE = {"width": 390, "height": 844}


def assert_component_fits(page, root, label=None, viewport=PHONE, tolerance=None):
    """Assert nothing inside `root` (a CSS selector) escapes or silently clips its box.

    Call it after mount, with the component's own element:

        assert_component_fits(page, "#active-session-overlay")

    `viewport=None` keeps whatever the test already set. Resizing here re-runs layout, so a test
    that measured pixels before this line measured them at ITS width, not this one.
    """
    if viewport:
        page.set_viewport_size(viewport)
    # Post-resize layout, plus whatever the component re-renders on it — measuring mid-reflow
    # reports overflow that is gone a frame later.
    page.wait_for_timeout(300)

    assert page.locator(root).count(), (
        f"overflow sweep asked for {root}, which is not mounted"
    )

    size = page.viewport_size
    findings = overflow_scan.scan(
        page,
        root=root,
        **({"tolerance": tolerance} if tolerance is not None else {}),
    )
    context = f"{label or root} at {size['width']}x{size['height']}"
    assert not findings, overflow_scan.format_findings(context, findings)
