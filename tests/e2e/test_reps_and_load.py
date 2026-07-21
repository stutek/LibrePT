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
              presetList: [m.repsPresetListId('bw'), m.repsPresetListId('kg'), m.repsPresetListId('level')],
              presets: [m.REPS_PRESETS, m.REPS_PRESETS_BODYWEIGHT],
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

    # Reps combobox presets: bodyweight rows point at the high-rep datalist, loaded rows at the low one.
    assert r["presetList"] == ["reps-presets-bw", "reps-presets", "reps-presets"]
    assert r["presets"] == [["3", "5", "8", "10", "max"], ["10", "20", "50", "max"]]
