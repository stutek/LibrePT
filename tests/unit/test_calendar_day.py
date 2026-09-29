# tests/unit/test_calendar_day.py
# A calendar day cut out of `toISOString()` is the UTC day, which east of UTC is yesterday for the
# first hours after midnight: the new-session form offered the day before at 00:38, and consent,
# joining and erasure dates came out a day early. src/data/calendarDay.js is the one way to write a
# calendar day; this fails the build on a date cut out of `toISOString()` anywhere in src/.

import pathlib
import re

SRC = pathlib.Path(__file__).resolve().parents[2] / "src"
UTC_DAY = re.compile(r"toISOString\(\)\s*\.\s*(slice|substring|substr|split)\b")


def _code_lines(path):
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith(("//", "*", "/*")):
            continue
        yield number, line


def test_no_calendar_day_is_cut_out_of_utc():
    found = [
        f"{path.relative_to(SRC.parent)}:{number}"
        for path in sorted(SRC.rglob("*.js"))
        for number, line in _code_lines(path)
        if UTC_DAY.search(line)
    ]
    assert found == [], (
        "a date cut out of toISOString() is the UTC day, a day early after local midnight east "
        f"of UTC; use localDateString from src/data/calendarDay.js: {found}"
    )
