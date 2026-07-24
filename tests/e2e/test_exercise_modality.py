# tests/e2e/test_exercise_modality.py
# The exercise MODALITY axis (TODO §13.3 / §17.1): a movement is not always sets × reps × load.
# Cardio is logged against an effort metric (time/distance/calories/watts), stretch & balance
# against a hold-time. These tests cover the catalog/picker surfacing of modality, the custom-
# create authoring flow (cardio reveals its metric selector and persists it), and the pure
# metric-formatting model that the focus card / plans / history all render through.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _base(page):
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _nav(page, path):
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        path,
    )
    page.wait_for_timeout(300)


def test_catalog_marks_cardio_with_a_modality_badge(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/exercises")

    # A seeded cardio erg leads with a modality badge; a strength lift shows none.
    page.fill("#search-exercises", "Assault Bike")
    page.wait_for_timeout(200)
    assert page.locator("#view-exercises .taxonomy-badge-modality").count() >= 1, (
        "a cardio movement should carry a highlighted modality badge in the catalog"
    )

    page.fill("#search-exercises", "Barbell Bench Press")
    page.wait_for_timeout(200)
    assert page.locator("#view-exercises .taxonomy-badge-modality").count() == 0, (
        "a strength movement should not carry a modality badge"
    )


def test_create_cardio_exercise_reveals_metric_and_persists(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/exercises")

    page.click("#btn-add-exercise")
    page.wait_for_selector("#dialog-exercise[open]")

    # The cardio metric selector is hidden until the modality is set to cardio.
    assert page.locator("#exercise-metric-group").evaluate(
        "el => el.classList.contains('hidden')"
    ), "the cardio metric field should start hidden"

    page.fill("#exercise-name", "Test Rower Sprint")
    page.select_option("#exercise-category", "Cardio")
    page.select_option("#exercise-equipment", "Machine")
    page.select_option("#exercise-pattern", "Conditioning")
    page.select_option("#exercise-modality", "cardio")
    page.wait_for_timeout(100)
    assert not page.locator("#exercise-metric-group").evaluate(
        "el => el.classList.contains('hidden')"
    ), "choosing cardio should reveal the metric selector"

    page.select_option("#exercise-metric", "distance")
    page.locator("#form-exercise button[type='submit']").click()
    page.wait_for_timeout(200)

    saved = page.evaluate(
        "() => (JSON.parse(localStorage.getItem('librept_db')).exercises || [])"
        "        .find(e => e.name === 'Test Rower Sprint') || null"
    )
    assert saved is not None, "the custom cardio exercise should persist to the store"
    assert saved["modality"] == "cardio"
    assert saved["metric"] == "distance"


def test_metric_formatting_model_renders_the_right_units(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    results = page.evaluate(
        """async () => {
            const url = new URL('modules/common/exerciseModality.js', document.baseURI).href;
            const m = await import(url);
            return {
                watts: m.formatMetricValue(200, 'watts'),
                meters: m.formatMetricValue(500, 'distance'),
                km: m.formatMetricValue(1500, 'distance'),
                cals: m.formatMetricValue(20, 'calories'),
                hold: m.formatMetricValue('30s', 'hold'),
                clock: m.formatMetricValue('20:00', 'time'),
                strengthMetric: m.primaryMetricOf({ modality: 'strength' }),
                cardioMetric: m.primaryMetricOf({ modality: 'cardio', metric: 'watts' }),
                legacyDefault: m.modalityOf({}),
            };
        }"""
    )
    assert results["watts"] == "200 W"
    assert results["meters"] == "500 m"
    assert results["km"] == "1.5 km"
    assert results["cals"] == "20 cal"
    assert results["hold"] == "0:30"
    assert results["clock"] == "20:00"
    assert results["strengthMetric"] == "reps"
    assert results["cardioMetric"] == "watts"
    assert results["legacyDefault"] == "strength", (
        "a legacy exercise with no modality field must default to strength"
    )


def test_isometric_agility_and_extended_cardio_metrics(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/exerciseModality.js', document.baseURI).href;
            const m = await import(url);
            return {
                pace: m.formatMetricValue('5:00', 'pace'),
                bpm: m.formatMetricValue(150, 'heartrate'),
                isoMetric: m.primaryMetricOf({ modality: 'isometric' }),
                agilityDefault: m.primaryMetricOf({ modality: 'agility' }),
                agilityDistance: m.primaryMetricOf({ modality: 'agility', metric: 'distance' }),
                isoLoad: m.usesLoad('isometric'),
                strengthLoad: m.usesLoad('strength'),
                cardioLoad: m.usesLoad('cardio'),
                agilityLoad: m.usesLoad('agility'),
                agilityOpts: m.metricOptionsFor('agility'),
                cardioHasPace: m.metricOptionsFor('cardio').includes('pace'),
                strengthOpts: m.metricOptionsFor('strength'),
            };
        }"""
    )
    assert r["pace"] == "5:00 /km"
    assert r["bpm"] == "150 bpm"
    assert r["isoMetric"] == "hold", "isometric logs a hold-time"
    assert r["agilityDefault"] == "time" and r["agilityDistance"] == "distance"
    # Load axis: strength + isometric carry load; cardio + agility do not.
    assert r["isoLoad"] is True and r["strengthLoad"] is True
    assert r["cardioLoad"] is False and r["agilityLoad"] is False
    assert r["agilityOpts"] == ["time", "distance", "reps"]
    assert r["cardioHasPace"] is True
    assert r["strengthOpts"] is None, "fixed-metric modalities offer no metric choice"
