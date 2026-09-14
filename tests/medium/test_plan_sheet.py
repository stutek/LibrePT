# tests/medium/test_plan_sheet.py — the read-only plan sheet drawn under the live clipboard
# (TODO §52.2 step 2). Nothing calls src/modules/clipboard/planSheet.js yet except this test; the
# drag that reveals it under the current plan is step 3.
#
# Needs the DOM/CSS (computed colours, aria-labels, DOM order) but no router, no persistence and no
# live session — renderPlanSheet is a pure DOM builder, so this mounts it directly rather than
# through clipboard_stub()'s full activeSession boot (tests/medium/_harness.py).
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import load_with_stub

STUB = """
import { renderPlanSheet } from './modules/clipboard/planSheet.js';
import { buildCircuitUnits } from './controllers/sessionCircuits.js';
import { TRANSLATIONS } from './i18n/index.js';

const t = (key) => TRANSLATIONS.en[key] || key;

window.__mountPlanSheet = (opts) => {
  const sheet = renderPlanSheet({ ...opts, t, buildCircuitUnits });
  const host = document.getElementById('main-content');
  host.textContent = '';
  host.appendChild(sheet);
  return sheet;
};
"""

CIRCUIT_ITEMS = [
    {
        "id": "c1a",
        "name": "Goblet Squat",
        "setsTargetCount": 3,
        "repsTarget": 10,
        "weightTarget": 16,
        "loadUnit": "kg",
        "modality": "strength",
        "metric": "reps",
        "circuitId": "circuit-1",
        "circuitTitle": "Metabolic Circuit",
        "circuitSeries": 3,
    },
    {
        "id": "c1b",
        "name": "Push-Ups",
        "setsTargetCount": 3,
        "repsTarget": 8,
        "weightTarget": 0,
        "loadUnit": "kg",
        "modality": "strength",
        "metric": "reps",
        "circuitId": "circuit-1",
        "circuitTitle": "Metabolic Circuit",
        "circuitSeries": 3,
    },
]

STANDALONE_ITEM = {
    "id": "solo1",
    "name": "Farmer's Carry",
    "setsTargetCount": 3,
    "repsTarget": 12,
    "weightTarget": 24,
    "loadUnit": "kg",
    "modality": "strength",
    "metric": "reps",
    "circuitId": None,
}


def _mount(page, local_server, items, feedback=None, when="past", client_id="c1"):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#main-content")
    page.evaluate(
        "(opts) => window.__mountPlanSheet(opts)",
        {
            "items": items,
            "feedback": feedback or [],
            "clientId": client_id,
            "when": when,
        },
    )
    return page.locator(".plan-sheet")


def test_a_circuit_becomes_one_block_with_a_head_row(page, local_server):
    """Consecutive items sharing a circuitId fold into one block: a head row naming the circuit and
    its round count, then one row per member — not one block per exercise."""
    sheet = _mount(page, local_server, CIRCUIT_ITEMS)
    blocks = sheet.locator(".plan-sheet-block")
    assert blocks.count() == 1, "the two circuit members must land in ONE block"

    head = blocks.first.locator(".plan-sheet-head")
    assert head.count() == 1
    assert "Metabolic Circuit" in head.locator(".plan-sheet-name").inner_text()
    assert head.locator(".plan-sheet-target").inner_text() == "3×"

    rows = blocks.first.locator(".plan-sheet-row:not(.plan-sheet-head)")
    assert rows.count() == 2
    names = [rows.nth(i).locator(".plan-sheet-name").inner_text() for i in range(2)]
    assert names == ["Goblet Squat", "Push-Ups"]


def test_a_standalone_exercise_is_its_own_block(page, local_server):
    """An exercise outside a circuit is a block of one, with no head row."""
    sheet = _mount(page, local_server, [STANDALONE_ITEM])
    blocks = sheet.locator(".plan-sheet-block")
    assert blocks.count() == 1
    assert blocks.first.locator(".plan-sheet-head").count() == 0
    rows = blocks.first.locator(".plan-sheet-row")
    assert rows.count() == 1
    assert rows.first.locator(".plan-sheet-name").inner_text() == "Farmer's Carry"


def test_the_target_follows_the_name(page, local_server):
    """Only the left part of the sheet is uncovered while the current plan is held aside, so the
    target sits right after the name rather than at the row's far edge — checked as DOM order, since
    that is what a truncating flex row actually reveals first."""
    sheet = _mount(page, local_server, [STANDALONE_ITEM])
    row = sheet.locator(".plan-sheet-row").first
    tags = row.evaluate("row => [...row.children].map(el => el.className)")
    name_index = next(i for i, c in enumerate(tags) if "plan-sheet-name" in c)
    target_index = next(i for i, c in enumerate(tags) if "plan-sheet-target" in c)
    assert target_index == name_index + 1, tags

    target_text = row.locator(".plan-sheet-target").inner_text()
    assert target_text == "S3 × R12 × 24 kg"


def test_signal_icons_show_only_for_recorded_feedback(page, local_server):
    """A row with a logged signal shows that glyph, labelled; an exercise nobody tagged shows none —
    the sheet marks what was RECORDED, never a tick for what was performed."""
    feedback = [
        {
            "clientId": "c1",
            "exerciseName": "Goblet Squat",
            "tag": "Too Easy - Increase Load",
            "note": "",
        },
        {
            "clientId": "c1",
            "exerciseName": "Push-Ups",
            "tag": "Too Hard - Reduce Load",
            "note": "knee sore",
        },
    ]
    sheet = _mount(page, local_server, CIRCUIT_ITEMS, feedback=feedback)
    rows = sheet.locator(".plan-sheet-row:not(.plan-sheet-head)")

    easy_row = rows.nth(0)
    easy_icons = easy_row.locator("i")
    assert easy_icons.count() == 1
    assert "fa-feather" in easy_icons.first.get_attribute("class")
    assert easy_icons.first.get_attribute("aria-label") == "Too Easy"

    # Push-Ups carries BOTH a "too hard" tag and a note: both icons show, independently.
    hard_row = rows.nth(1)
    hard_icons = hard_row.locator("i")
    assert hard_icons.count() == 2
    classes = [hard_icons.nth(i).get_attribute("class") for i in range(2)]
    assert any("fa-weight-hanging" in c for c in classes)
    assert any("fa-note-sticky" in c for c in classes)


def test_a_past_sheet_colours_names_differently_from_a_future_sheet(page, local_server):
    """Exercise names carry the session's time: past in --temporal-past, future in
    --temporal-future (ruled 2026-09-14). Compared against the theme TOKEN, not a literal rgb."""
    past_sheet = _mount(page, local_server, [STANDALONE_ITEM], when="past")
    past_color = past_sheet.locator(".plan-sheet-name").first.evaluate(
        "el => getComputedStyle(el).color"
    )
    past_token = page.evaluate(
        "() => { const p = document.createElement('span'); "
        "p.style.color = 'var(--temporal-past)'; document.body.appendChild(p); "
        "const c = getComputedStyle(p).color; p.remove(); return c; }"
    )
    assert past_color == past_token

    future_sheet = _mount(page, local_server, [STANDALONE_ITEM], when="future")
    future_color = future_sheet.locator(".plan-sheet-name").first.evaluate(
        "el => getComputedStyle(el).color"
    )
    future_token = page.evaluate(
        "() => { const f = document.createElement('span'); "
        "f.style.color = 'var(--temporal-future)'; document.body.appendChild(f); "
        "const c = getComputedStyle(f).color; f.remove(); return c; }"
    )
    assert future_color == future_token
    assert past_color != future_color


def test_a_name_containing_markup_is_shown_as_text(page, local_server):
    """Nothing is built with innerHTML from user text (docs/ARCHITECTURE.md "UI invariants"): a
    stray '<b>' in an exercise name must render literally, never as a tag."""
    item = dict(STANDALONE_ITEM, name="Squat <b>heavy</b> day")
    sheet = _mount(page, local_server, [item])
    name_el = sheet.locator(".plan-sheet-name").first
    assert name_el.inner_text() == "Squat <b>heavy</b> day"
    assert name_el.locator("b").count() == 0
