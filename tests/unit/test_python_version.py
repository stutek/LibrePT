# tests/unit/test_python_version.py
# One declaration of the Python version, and this machine on it (agent_tools/python_version.py).
#
# Asked for 2026-08-18 after CI failed a test that had passed locally three times. That failure was a
# frozen-clock problem, but chasing it surfaced a quieter divergence: CI ran Python 3.11 while this
# machine ran 3.14.4, and nothing said so.
#
# The first attempt bumped thirteen literals and checked they agreed — a checker whose job is keeping
# copies in step, which is the shape of a missing single source of truth. These tests pin the version
# that replaced it: `.python-version` is the one declaration, workflows read it, and a literal pin is
# itself a failure because it re-introduces a copy.

from agent_tools import python_version


def _workflow(tmp_path, body, name="deploy.yml"):
    path = tmp_path / name
    path.write_text(body)
    return path


def _version_file(tmp_path, value="3.14"):
    path = tmp_path / ".python-version"
    path.write_text(f"{value}\n")
    return str(path)


def test_workflows_reading_the_declaration_pass(tmp_path):
    workflow = _workflow(
        tmp_path,
        "      - uses: actions/setup-python@v6\n        with:\n"
        "          python-version-file: .python-version\n",
    )

    problems = python_version.version_problems(
        [workflow], running="3.14", version_file=_version_file(tmp_path)
    )

    assert problems == []


def test_an_inline_pin_is_a_problem_even_when_it_is_the_right_version(tmp_path):
    """The point is not the number, it is the copy. A literal that happens to be correct today is the
    one that quietly stops being correct tomorrow."""
    workflow = _workflow(tmp_path, "          python-version: '3.14'\n")

    problems = python_version.version_problems(
        [workflow], running="3.14", version_file=_version_file(tmp_path)
    )

    assert len(problems) == 1
    assert "one declaration" in problems[0]


def test_a_machine_on_a_different_minor_is_reported(tmp_path):
    # The exact state on 2026-08-18, before the fix: the declaration and the machine disagreed.
    problems = python_version.version_problems(
        [], running="3.11", version_file=_version_file(tmp_path, "3.14")
    )

    assert len(problems) == 1
    assert "3.14" in problems[0] and "3.11" in problems[0]


def test_a_patch_difference_is_not_a_divergence(tmp_path):
    """CI takes whatever patch the runner image carries and so does a developer. Failing on that would be
    a gate nobody could keep green."""
    assert (
        python_version.version_problems(
            [], running="3.14.4", version_file=_version_file(tmp_path)
        )
        == []
    )


def test_a_missing_declaration_is_itself_the_problem(tmp_path):
    problems = python_version.version_problems(
        [], running="3.14", version_file=str(tmp_path / "nope")
    )

    assert len(problems) == 1
    assert "missing" in problems[0]


def test_a_workflow_with_no_python_step_is_not_a_problem(tmp_path):
    """A job that never sets up Python has no opinion about the version, and inventing one for it would
    fail every future non-Python job."""
    workflow = _workflow(
        tmp_path, "    steps:\n      - uses: actions/deploy-pages@v4\n", "pages.yml"
    )

    assert (
        python_version.version_problems(
            [workflow], running="3.14", version_file=_version_file(tmp_path)
        )
        == []
    )


def test_the_repository_has_one_declaration_and_this_interpreter_is_on_it():
    """The real check, against the real workflows and the interpreter running this test — which is what
    fails when someone upgrades their machine and forgets CI exists, or pins a literal back in."""
    assert python_version.version_problems() == []
