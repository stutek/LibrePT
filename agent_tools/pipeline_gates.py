"""`python -m agent_tools.pipeline_gates` — every CI job must actually gate the deploy.

Why this exists: a GitHub Actions job that nothing `needs` still runs, still reports, and still shows
a red X — but it blocks nothing. The deploy proceeds. That is the worst shape a check can take,
because it looks *more* trustworthy than no check at all: the run page shows a failure while the
release ships anyway. `doc-graph` was added in exactly that state (2026-07-27) and would have stayed
there, since nothing about the workflow file makes an orphan visible.

The invariant, stated directly: **exactly one job is terminal, and every other job is inside its
transitive `needs` closure.** A second terminal job is by definition one nothing waits for.

AGENT_RULES §2.A.3 already required this ("a gate step that exits non-zero MUST fail the build") —
the workflow just did not implement it. This is that rule, made mechanical.
"""

import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKFLOW_DIR = REPO_ROOT / ".github" / "workflows"


def load_jobs(workflow_path):
    """Return {job_name: [needs]} for one workflow file."""
    document = yaml.safe_load(workflow_path.read_text(encoding="utf-8"))
    jobs = {}
    for name, body in (document.get("jobs") or {}).items():
        needs = (body or {}).get("needs") or []
        jobs[name] = [needs] if isinstance(needs, str) else list(needs)
    return jobs


def closure_of(job, jobs, seen=None):
    """Every job that must succeed before `job` can start."""
    seen = seen if seen is not None else set()
    for dependency in jobs.get(job, []):
        if dependency not in seen:
            seen.add(dependency)
            closure_of(dependency, jobs, seen)
    return seen


def orphans(jobs):
    """Jobs that gate nothing: not the terminal job, and not required by it.

    Terminal jobs are those no other job names in `needs`. A healthy workflow has exactly one — the
    deploy. Any additional terminal job runs for show, and so does anything only it depends on.
    """
    required_by_someone = {dep for needs in jobs.values() for dep in needs}
    terminals = sorted(set(jobs) - required_by_someone)
    if len(terminals) <= 1:
        terminal = terminals[0] if terminals else None
        gated = closure_of(terminal, jobs) | ({terminal} if terminal else set())
        return sorted(set(jobs) - gated), terminals
    # More than one terminal: keep the one gating the most work and report the rest.
    ranked = sorted(terminals, key=lambda job: len(closure_of(job, jobs)), reverse=True)
    primary = ranked[0]
    gated = closure_of(primary, jobs) | {primary}
    return sorted(set(jobs) - gated), terminals


def main():
    failures = []
    workflows = sorted(WORKFLOW_DIR.glob("*.yml")) + sorted(WORKFLOW_DIR.glob("*.yaml"))
    for workflow in workflows:
        jobs = load_jobs(workflow)
        if not jobs:
            continue
        ungated, terminals = orphans(jobs)
        rel = workflow.relative_to(REPO_ROOT)
        if len(terminals) > 1:
            failures.append(
                f"{rel}: {len(terminals)} terminal jobs — {', '.join(terminals)}"
            )
        for job in ungated:
            failures.append(
                f"{rel}: job '{job}' gates nothing (no job lists it in `needs`)"
            )

    if failures:
        print(
            f"\n  ✗ Pipeline gates: {len(failures)} job(s) run without gating the deploy\n"
        )
        for failure in failures:
            print(f"    {failure}")
        print(
            "\n    Add the job to the `needs:` of whatever must wait for it. A check that runs"
        )
        print(
            "    but blocks nothing is worse than no check — it shows red while the deploy ships."
        )
        return 1

    checked = sum(len(load_jobs(w)) for w in workflows)
    print(f"  ✓ Pipeline gates: {checked} job(s), every one gates the deploy.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
