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


STORE = "(await import(new URL('data/stateStore.js', document.baseURI).href))"
FLUSH = "await (await import(new URL('data/writeQueue.js', document.baseURI).href)).flushWrites()"


def test_an_imported_id_that_a_client_holds_does_not_replace_the_client(
    page, local_server
):
    """Found by Codex's review, TODO §77.1: every record of one schema shares one key in IndexedDB,
    and the import kept a file's id after checking only the exercises. An exercise carrying a
    client's id replaced that client, with nothing said."""
    page.goto(local_server + "exercises")
    page.wait_for_selector("#view-exercises.active")
    client = page.evaluate(
        f"async () => {{ const c = {STORE}.getState().clients[0]; return {{ id: c.id, name: c.name }}; }}"
    )
    library = (
        '{"format": "librept.library/1", "exercises": [{"name": "Injected exercise", '
        f'"x_librept": {{"id": "{client["id"]}"}}}}]}}'
    )

    page.click("#btn-import-library")
    page.wait_for_selector("#dialog-library-import[open]")
    page.fill("#library-import-text", library)
    page.click("#library-import-add")
    page.wait_for_selector("#dialog-library-import", state="hidden")
    page.evaluate(f"async () => {{ {FLUSH}; }}")
    page.reload()
    page.wait_for_selector("#view-exercises.active")

    after = page.evaluate(
        f"""async (id) => {{
            const s = {STORE}.getState();
            return {{
                client: (s.clients.find((c) => c.id === id) || {{}}).name || null,
                exercise: (s.exercises.find((e) => e.name === 'Injected exercise') || {{}}).id || null,
            }};
        }}""",
        client["id"],
    )
    assert after["client"] == client["name"], (
        "the client was replaced by the imported exercise"
    )
    assert after["exercise"] and after["exercise"] != client["id"]
