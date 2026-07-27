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
