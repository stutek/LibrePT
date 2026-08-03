# tests/e2e/test_reps_and_load.py
# The reps/load preset datalists (index.html's #reps-preset-datalists) are generated at boot from
# REPS_TIERS by app.js's own DOM wiring, not hardcoded markup — this is a real-DOM assertion on the
# live rendered page, so it stays here. Pure parse/format/derive coverage for
# helper/repsAndLoad.js moved to tests/unit_js/modules/common/repsAndLoad.test.mjs.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_reps_preset_datalists_are_data_driven(page, local_server):
    # The datalists are generated from REPS_TIERS at boot, not hardcoded in index.html.
    page.goto(local_server)
    page.wait_for_timeout(500)
    counts = page.evaluate(
        """() => ({
            total: document.querySelectorAll('#reps-preset-datalists datalist').length,
            time: [...document.querySelectorAll('#reps-presets-time option')].map(o => o.value),
            strength: [...document.querySelectorAll('#reps-presets option')].map(o => o.value),
        })"""
    )
    assert counts["total"] == 4, "one datalist per tier should be generated"
    assert counts["time"] == ["20s", "30s", "45s", "60s"]
    assert counts["strength"] == ["3", "5", "8", "10", "max"]
