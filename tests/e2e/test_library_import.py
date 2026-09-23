# tests/e2e/test_library_import.py
# Importing a trainer's exercise library into the real, booted app (TODO §45.5): what the import
# writes survives a reload, which only the real storage path can show — the review and the marks
# are covered by tests/medium/test_exercise_catalog.py.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

LIBRARY_FILE = """{
  "format": "librept.library/1",
  "source": "Ana Novak",
  "exercises": [{"name": "Sled Push", "muscle": "Legs", "equipment": "Machine"}],
  "circuits": [{"name": "Finisher", "rounds": 3, "exercises": ["Sled Push", "Push-Ups"]}]
}"""


def test_an_imported_library_is_still_there_after_a_reload(page, local_server):
    page.goto(local_server + "exercises")
    page.wait_for_selector("#view-exercises.active")
    page.click("#btn-import-library")
    page.wait_for_selector("#dialog-library-import[open]")
    page.fill("#library-import-text", LIBRARY_FILE)
    page.click("#library-import-add")
    page.wait_for_selector("#dialog-library-import", state="hidden")
    # The write queue flushes to IndexedDB asynchronously; a reload before it does proves nothing.
    page.wait_for_timeout(500)

    page.reload()
    page.wait_for_selector("#view-exercises.active")
    page.click(".filter-chips[data-axis='source'] .chip[data-filter='Ana Novak']")
    names = page.locator("#view-exercises .exercise-item h3").all_text_contents()
    assert names == ["Sled Push"]
    circuits = page.evaluate(
        "async () => (await import(new URL('data/stateStore.js', document.baseURI).href))"
        ".getState().circuits.map((c) => c.name)"
    )
    assert circuits == ["Finisher"]
