# tests/e2e/test_exercise_standard.py
# The open-standard crosswalk (TODO §13.1, UC6 §6): LibrePT's movement taxonomy mapped to the wger
# dataset so catalog exports stay universally interchangeable. These tests cover the pure mapping
# model (category/equipment → wger canonical names, the honest nulls where the standard has no
# equivalent, the interchange record + CSV shape) and the integration path where the backup dialog's
# "Export Catalog" button downloads a self-describing interchange file.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json


def test_crosswalk_maps_categories_and_equipment_to_wger(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/exerciseStandard.js', document.baseURI).href;
            const m = await import(url);
            return {
                core: m.wgerCategoryOf({ category: 'Core' }),
                chest: m.wgerCategoryOf({ category: 'Chest' }),
                cardio: m.wgerCategoryOf({ category: 'Cardio' }),
                recovery: m.wgerCategoryOf({ category: 'Recovery' }),
                barbell: m.wgerEquipmentOf({ equipment: 'Barbell' }),
                bodyweight: m.wgerEquipmentOf({ equipment: 'Bodyweight' }),
                cable: m.wgerEquipmentOf({ equipment: 'Cable' }),
                machine: m.wgerEquipmentOf({ equipment: 'Machine' }),
                categoriesAreWgerNative: m.WGER_CATEGORIES.includes('Abs'),
            };
        }"""
    )
    # Muscle groups map onto wger's ExerciseCategory names; Core folds into wger's "Abs".
    assert r["core"] == "Abs"
    assert r["chest"] == "Chest"
    # wger has no Cardio or flexibility/Recovery category — mapping is an honest null, not a guess.
    assert r["cardio"] is None
    assert r["recovery"] is None
    # Equipment maps to wger's canonical labels; bodyweight is wger's literal "none" label.
    assert r["barbell"] == ["Barbell"]
    assert r["bodyweight"] == ["none (bodyweight exercise)"]
    # Cable / Machine are not in wger's default equipment set → an empty (unmapped) list, not wrong.
    assert r["cable"] == []
    assert r["machine"] == []
    assert r["categoriesAreWgerNative"] is True


def test_interchange_record_preserves_librept_axes_and_flags_gaps(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('modules/common/exerciseStandard.js', document.baseURI).href;
            const m = await import(url);
            const cardio = m.toInterchangeExercise({
                id: 'x1', name: 'Assault Bike', category: 'Cardio',
                equipment: 'Machine', pattern: 'Conditioning', modality: 'cardio', metric: 'calories',
            });
            const legacy = m.toInterchangeExercise({
                id: 'x2', name: 'Barbell Bench Press', category: 'Chest',
                equipment: 'Barbell', pattern: 'Horizontal Push',
            });
            return { cardio, legacy, unmapped: m.unmappedTerms() };
        }"""
    )
    # A cardio erg: wger-native fields are null/empty (no equivalent), but nothing LibrePT-specific
    # is lost — pattern, modality and metric survive under the x_librept extension.
    assert r["cardio"]["category"] is None
    assert r["cardio"]["equipment"] == []
    assert r["cardio"]["x_librept"]["modality"] == "cardio"
    assert r["cardio"]["x_librept"]["metric"] == "calories"
    assert r["cardio"]["x_librept"]["pattern"] == "Conditioning"
    # A legacy strength lift with no modality field defaults to strength on export.
    assert r["legacy"]["category"] == "Chest"
    assert r["legacy"]["equipment"] == ["Barbell"]
    assert r["legacy"]["x_librept"]["modality"] == "strength"
    # The interchange gap is a documented, testable fact.
    assert set(r["unmapped"]["categories"]) == {"Cardio", "Recovery"}
    assert set(r["unmapped"]["equipment"]) == {"Cable", "Machine"}


def test_csv_export_has_header_and_quotes_cells(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    csv = page.evaluate(
        """async () => {
            const url = new URL('modules/common/exerciseStandard.js', document.baseURI).href;
            const m = await import(url);
            return m.catalogToCsv([
                { id: 'x1', name: 'Row, Barbell', category: 'Back',
                  equipment: 'Barbell', pattern: 'Horizontal Pull' },
            ]);
        }"""
    )
    lines = csv.split("\n")
    assert lines[0] == (
        "name,wger_category,wger_equipment,librept_id,librept_category,"
        "librept_equipment,pattern,modality,metric"
    )
    # A name containing a comma must be quoted so the CSV stays parseable.
    assert lines[1].startswith(
        '"Row, Barbell",Back,Barbell,x1,Back,Barbell,Horizontal Pull,strength,'
    )


def test_catalog_export_button_downloads_interchange_json(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator("#backup-btn").click()
    assert page.locator("#dialog-backup #btn-export-catalog-json").is_visible()

    with page.expect_download() as dl:
        page.locator("#btn-export-catalog-json").click()
    download = dl.value
    assert download.suggested_filename.startswith("librept_catalog_")
    assert download.suggested_filename.endswith(".json")

    with open(download.path(), encoding="utf-8") as fh:
        payload = json.load(fh)

    assert payload["format"] == "wger-exercise-interchange"
    assert payload["version"] == 1
    assert isinstance(payload["exercises"], list) and len(payload["exercises"]) > 0
    # Every exported movement carries the wger-native fields plus the preserved LibrePT extension.
    first = payload["exercises"][0]
    assert "category" in first and "equipment" in first and "x_librept" in first
