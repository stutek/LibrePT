# tests/e2e/test_reps_and_load.py
# Unit-level coverage for helper/repsAndLoad.js, exercised in the real runtime by importing the ES
# module in the browser. Reps and load are polymorphic (count/range/time/max; kg/level/band/bw), so
# the parse/format/derive helpers are the single source of truth every authoring surface relies on.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _load_helpers(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(200)
    return page.evaluate(
        """async () => {
            const m = await import(new URL('./helper/repsAndLoad.js', document.baseURI).href);
            return {
              parseReps: [m.parseReps('10'), m.parseReps('8-12'), m.parseReps('max'), m.parseReps('')],
              isFailure: [m.isFailureReps('max'), m.isFailureReps('AMRAP'), m.isFailureReps('10')],
              formatReps: [m.formatReps('max'), m.formatReps(10), m.formatReps('')],
              parseLoad: [m.parseLoad('40'), m.parseLoad('Medium'), m.parseLoad('')],
              unit: [
                m.loadUnitForEquipment('Cable'), m.loadUnitForEquipment('Band'),
                m.loadUnitForEquipment('Bodyweight'), m.loadUnitForEquipment('Barbell'),
              ],
              formatLoad: [
                m.formatLoad(40, 'kg'), m.formatLoad(3, 'level'),
                m.formatLoad(0, 'bw'), m.formatLoad(5, 'bw'), m.formatLoad('Heavy', 'band'),
              ],
              hasLoad: [
                m.hasLoad(0, 'bw'), m.hasLoad(0, 'kg'), m.hasLoad(5, 'kg'),
                m.hasLoad('', 'band'), m.hasLoad('Light', 'band'),
              ],
              tier: [
                m.repsTier('Squat', 'kg'), m.repsTier('Squat', 'bw'),
                m.repsTier('Vertical Pull', 'bw'), m.repsTier('Core', 'kg'),
                m.repsTier('Mobility', 'kg'), m.repsTier('Isolation', 'kg'),
                m.repsTier(undefined, 'bw'), m.repsTier(undefined, 'kg'),
              ],
              presetList: [m.repsPresetListId('Squat', 'kg'), m.repsPresetListId('Mobility', 'kg')],
              presetsFor: m.repsPresetsFor('Squat', 'kg'),
              tiers: m.REPS_TIERS,
            };
        }"""
    )


def test_reps_and_load_helpers(page, local_server):
    r = _load_helpers(page, local_server)

    # Reps: pure numbers become Number; tokens stay strings; empty → default 10.
    assert r["parseReps"] == [10, "8-12", "max", 10]
    assert r["isFailure"] == [True, True, False]
    assert r["formatReps"] == ["Max", "10", "—"]

    # Load: numeric → Number, band label stays string, empty → 0.
    assert r["parseLoad"] == [40, "Medium", 0]
    # Equipment → load unit (unlisted equipment is kilograms).
    assert r["unit"] == ["level", "band", "bw", "kg"]
    # Display strings per unit.
    assert r["formatLoad"] == ["40 kg", "Lvl 3", "BW", "BW+5kg", "Heavy"]
    # Visibility: bodyweight always shows; kg needs a positive value; band needs a label.
    assert r["hasLoad"] == [True, False, True, False, True]

    # Reps tier tracks pattern × load: loaded squat = strength; bodyweight squat shifts to endurance;
    # a bodyweight vertical pull (pull-up) stays strength; core = endurance; mobility = time; loaded
    # isolation = hypertrophy; no-pattern falls back to load (bw → endurance, else strength).
    assert r["tier"] == [
        "strength",
        "endurance",
        "strength",
        "endurance",
        "time",
        "hypertrophy",
        "endurance",
        "strength",
    ]
    assert r["presetList"] == ["reps-presets", "reps-presets-time"]
    assert r["presetsFor"] == ["3", "5", "8", "10", "max"]
    assert r["tiers"]["endurance"] == ["10", "20", "50", "max"]


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
