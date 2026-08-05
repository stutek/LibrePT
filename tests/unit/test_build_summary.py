# tests/unit/test_build_summary.py
# The gate's closing report (build/__main__.py's _print_summary). A `build check` is minutes of
# scrolling output, so the summary is the part anyone actually reads — these pin the three things
# that make it readable without interpretation: the `=== Report ===` banner that makes it findable
# by the same visual cue as the per-stage banners, the total wall time labelled as such (it sits
# under Stage 4's own timing, so an unlabelled number reads as that stage's), and the per-stage
# breakdown the total is the sum of.

from build.__main__ import _fmt_elapsed, _print_summary


def test_report_banner_precedes_the_verdict(capsys):
    _print_summary(
        "build check PASSED — all 4 stages green", 240.0, [24.1, 67.2, 112.8, 35.7]
    )
    lines = [line for line in capsys.readouterr().out.splitlines() if line.strip()]

    # The banner must come FIRST: its whole job is to mark where the summary starts when scrolling
    # back, which it cannot do sitting below the verdict it introduces.
    assert lines[0] == "=== Report ==="
    assert lines[1].strip().startswith("✓ build check PASSED")


def test_total_time_is_labelled_and_broken_down_by_stage(capsys):
    _print_summary("build check PASSED", 240.0, [24.1, 67.2, 112.8, 35.7])
    out = capsys.readouterr().out

    # Labelled, so it cannot be misread as Stage 4's timing directly above it.
    assert "TOTAL WALL TIME: 4m00s" in out
    assert "= stage 1 24s  stage 2 67s  stage 3 113s  stage 4 36s" in out


def test_lint_and_test_verdicts_omit_the_stage_breakdown(capsys):
    # `build lint` / `build test` run no stages, so a "= " line would be an empty claim.
    _print_summary("LINT PASSED", 3.2, [])
    out = capsys.readouterr().out

    assert "=== Report ===" in out
    assert "TOTAL WALL TIME: 3s" in out
    assert "= stage" not in out


def test_elapsed_formatting_spans_the_minute_boundary():
    assert _fmt_elapsed(3.2) == "3s"
    assert _fmt_elapsed(59.6) == "1m00s"  # rounds up ACROSS the boundary, not to "60s"
    assert _fmt_elapsed(240.0) == "4m00s"
    assert _fmt_elapsed(154.48) == "2m34s"
