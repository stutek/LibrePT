# tests/medium/test_clipboard_note_mark.py
# The feedback button carries a corner dot when the trainer has WRITTEN something for that exercise
# (a typed note), and carries none when there is only a bare Too Easy / Too Hard tap or nothing at
# all. The dot is drawn by the stylesheet (`::after` on the button), so the promise is read where a
# trainer sees it: the drawn dot, on a standalone card and on a member row of a circuit.
#
# The lookup (`hasExerciseNote`) is covered in tests/unit_js; this pins that the real markup and CSS
# turn it into something visible, on both card shapes. The buttons exist only on the card in focus,
# so each case brings one card into focus first.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

CLIENT_ID = "c1a9f0e2"


def _entry(name, note, tag="Too Hard - Reduce Load"):
    return {"clientId": CLIENT_ID, "exerciseName": name, "tag": tag, "note": note}


# Noted: a plain exercise and one circuit member. Not noted: a plain exercise with nothing, one
# with only a bare signal tap, and the other circuit member (a note on its neighbour must not leak).
PLAN = [
    exercise_item("exA", "Noted Squat"),
    exercise_item("exB", "Bare Deadlift"),
    exercise_item("exC", "Tapped Lunge"),
    exercise_item("exC1", "Noted Swing", circuit_id="c1", circuitTitle="Finisher"),
    exercise_item("exC2", "Plain Press", circuit_id="c1", circuitTitle="Finisher"),
]
FEEDBACK = [
    _entry("Noted Squat", "Knee felt tight"),
    _entry("Tapped Lunge", ""),
    _entry("Noted Swing", "Grip slipped"),
]

# The dot a trainer sees on each feedback button of the card in focus, keyed by exercise name.
DOTS = """() => {
  const drawn = (button) => {
    const dot = getComputedStyle(button, '::after');
    return dot.content !== 'none' && dot.content !== 'normal' && parseFloat(dot.width) > 0;
  };
  const out = {};
  const card = document.querySelector('#active-exercise-scroll-deck .exercise-deck-card.in-focus');
  const rows = card.querySelectorAll('.circuit-ex-row');
  if (rows.length) {
    for (const row of rows) {
      out[row.querySelector('.circuit-ex-name')?.textContent.trim() ?? row.dataset.exId] =
        drawn(row.querySelector('.deck-action-feedback'));
    }
  } else {
    out[card.querySelector('.deck-card-name-inline').textContent.trim()] =
      drawn(card.querySelector('.deck-action-feedback'));
  }
  return out;
}"""


def _mount(page, local_server):
    stub = clipboard_stub(
        active_session_fixture(exercises=PLAN, feedback=FEEDBACK),
    )
    load_with_stub(page, local_server, stub)
    page.wait_for_selector("#active-exercise-scroll-deck .exercise-deck-card")


def _focus(page, name):
    # A DOM click: stacked cards overlap, so the neighbour would swallow a pointer click.
    page.evaluate(
        """(name) => [...document.querySelectorAll('.exercise-deck-card')]
             .find((el) => el.textContent.includes(name))
             .click()""",
        name,
    )
    page.wait_for_timeout(400)


def test_the_dot_marks_a_written_note_and_nothing_else(page, local_server):
    _mount(page, local_server)

    for name, expected in (
        ("Noted Squat", True),
        ("Bare Deadlift", False),
        ("Tapped Lunge", False),
    ):
        _focus(page, name)
        assert page.evaluate(DOTS) == {name: expected}, name


def test_a_circuit_marks_only_the_member_that_has_a_note(page, local_server):
    _mount(page, local_server)
    _focus(page, "Finisher")

    assert page.evaluate(DOTS) == {"Noted Swing": True, "Plain Press": False}
