"""Unit tests for agent_tools/pipeline_gates.py — every CI job must gate the deploy.

The failure this prevents is a job that runs, reports red, and blocks nothing: the run page shows a
failure while the release ships anyway. Nothing about a workflow file makes that visible, which is
why it is asserted rather than reviewed.
"""

import textwrap

import pytest

from agent_tools import pipeline_gates


@pytest.fixture
def workflow(tmp_path):
    def write(body):
        path = tmp_path / "wf.yml"
        path.write_text(textwrap.dedent(body), encoding="utf-8")
        return pipeline_gates.load_jobs(path)

    return write


def test_orphan_job_is_reported(workflow):
    """The real shape of the bug: doc-graph ran on every push and nothing waited for it."""
    jobs = workflow("""
        jobs:
          lint: {}
          doc-graph: {}
          tests:
            needs: [lint]
          deploy:
            needs: [tests]
        """)
    ungated, terminals = pipeline_gates.orphans(jobs)
    assert ungated == ["doc-graph"]
    assert terminals == ["deploy", "doc-graph"]


def test_a_fully_chained_workflow_is_clean(workflow):
    jobs = workflow("""
        jobs:
          lint: {}
          doc-graph: {}
          tests:
            needs: [lint, doc-graph]
          deploy:
            needs: [tests]
        """)
    assert pipeline_gates.orphans(jobs)[0] == []


def test_transitive_dependencies_count_as_gating(workflow):
    """A job two hops from the deploy still gates it — only unreachable jobs are orphans."""
    jobs = workflow("""
        jobs:
          a: {}
          b:
            needs: [a]
          c:
            needs: [b]
          deploy:
            needs: [c]
        """)
    assert pipeline_gates.orphans(jobs)[0] == []
    assert pipeline_gates.closure_of("deploy", jobs) == {"a", "b", "c"}


def test_a_scalar_needs_is_accepted(workflow):
    """GitHub allows `needs: build` as well as `needs: [build]`."""
    jobs = workflow("""
        jobs:
          build: {}
          deploy:
            needs: build
        """)
    assert jobs["deploy"] == ["build"]
    assert pipeline_gates.orphans(jobs)[0] == []


def test_the_real_workflow_gates_every_job():
    """The invariant itself, on this repository — Simon: 'all pipeline tasks should be a gate'."""
    assert pipeline_gates.main() == 0


def test_a_stage_1_check_with_no_ci_step_is_reported():
    """The mirror of the orphan-job check, and the easier failure to create: adding a Stage 1 task
    is a one-line edit, giving it a CI job is not. Four had accumulated (catalog coverage, import
    layering, pipeline gating, complexity) before the drift was noticed — each blocking a local
    commit while the deploy sailed past it."""
    workflow = "run: python -c 'from build import run_python_lint; run_python_lint()'"
    ungated = pipeline_gates.locally_gated_only([workflow])

    assert "run_python_lint" not in ungated, "a task CI does run must not be reported"
    assert "run_import_layer_check" in ungated, (
        "a Stage 1 task absent from every workflow must be reported"
    )


def test_the_real_workflow_runs_every_stage_1_check():
    """Guards the repo itself, not a fixture — this is the invariant that actually drifted."""
    workflows = sorted(pipeline_gates.WORKFLOW_DIR.glob("*.yml"))
    texts = [w.read_text(encoding="utf-8") for w in workflows]

    assert pipeline_gates.locally_gated_only(texts) == []
    assert pipeline_gates.stage_1_tasks(), "the Stage 1 task table must be parseable"


def test_stage_leaves_reads_every_stage_from_the_build_table():
    """Stage 1 must survive the parse.

    Its row in PIPELINE_STAGES is deliberately empty (its fourteen checks are declared in
    run_stage_1_parallel's own table), and an earlier version let that empty row overwrite the
    seeded set. The whole ordering check then passed vacuously for stage 1 — nothing to compare
    against is not the same as nothing wrong.
    """
    stages = pipeline_gates.stage_leaves()

    assert set(stages) == {1, 2, 3, 4}
    assert "run_python_lint" in stages[1]
    assert stages[2] == {"run_medium_tests"}
    assert stages[3] == {"run_e2e_tests"}
    assert stages[4] == {"run_owasp_zap_scan"}


def test_a_later_stage_that_does_not_wait_for_an_earlier_one_is_reported():
    """The detector must catch a real violation, not merely never fire.

    This is the shape CI actually had: the medium and e2e suites fanning out from Stage 1 side by
    side, so a broken component failed fast locally and only after the slowest suite in CI.
    """
    jobs = {"fast": [], "medium": ["fast"], "e2e": ["fast"]}
    commands = {
        "fast": "run_python_lint()",
        "medium": "run_medium_tests()",
        "e2e": "run_e2e_tests()",
    }

    problems = pipeline_gates.out_of_order_stages(jobs, commands)

    assert any(
        "'e2e' (stage 3) does not wait for 'medium' (stage 2)" in p for p in problems
    )


def test_a_correctly_chained_pipeline_reports_nothing():
    """The same three jobs, staged — the arrangement this repo now uses."""
    jobs = {"fast": [], "medium": ["fast"], "e2e": ["medium"]}
    commands = {
        "fast": "run_python_lint()",
        "medium": "run_medium_tests()",
        "e2e": "run_e2e_tests()",
    }

    assert pipeline_gates.out_of_order_stages(jobs, commands) == []


def test_the_real_workflow_enforces_the_local_stage_order():
    """The invariant on this repository: CI fails in the same order `build check` does."""
    workflow = pipeline_gates.WORKFLOW_DIR / "deploy.yml"

    problems = pipeline_gates.out_of_order_stages(
        pipeline_gates.load_jobs(workflow),
        pipeline_gates.load_job_commands(workflow),
    )

    assert problems == []
