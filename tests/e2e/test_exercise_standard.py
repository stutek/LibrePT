# tests/e2e/test_exercise_standard.py
# The open-standard crosswalk (TODO §13.1, UC6 §6): LibrePT's movement taxonomy mapped to the wger
# dataset so catalog exports stay universally interchangeable. Pure mapping-model coverage
# (category/equipment → wger canonical names, the interchange record, CSV shape) moved to
# tests/unit_js/domain/exerciseStandard.test.mjs. What stays here needs the real,
# live-booted app: the integration path where the exercise library's export downloads a
# self-describing interchange file that carries the whole library, routines included.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json


def test_catalog_export_button_downloads_interchange_json(page, local_server):
    page.goto(local_server + "exercises")
    page.wait_for_selector("#view-exercises.active")
    assert page.locator("#view-exercises #btn-export-catalog-json").is_visible()

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
    # The whole library travels: the seeded routines are in the file, each naming its exercises.
    assert len(payload["routines"]) > 0
    assert all("name" in entry for entry in payload["routines"][0]["exercises"])
