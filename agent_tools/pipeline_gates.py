"""`python -m agent_tools.pipeline_gates` — every CI job must actually gate the deploy.

Why this exists: a GitHub Actions job that nothing `needs` still runs, still reports, and still shows
a red X — but it blocks nothing. The deploy proceeds. That is the worst shape a check can take,
because it looks *more* trustworthy than no check at all: the run page shows a failure while the
release ships anyway. `doc-graph` was added in exactly that state (2026-07-27) and would have stayed
there, since nothing about the workflow file makes an orphan visible.

The invariant, stated directly: **exactly one job is terminal, and every other job is inside its
transitive `needs` closure.** A second terminal job is by definition one nothing waits for.

A second drift followed the same shape and needed the same treatment: the STAGE ORDER was written by
hand in two files, so CI ran the medium and e2e suites concurrently while the local gate staged them
(TODO §6.4). `build/__init__.py`'s `PIPELINE_STAGES` is now the single declaration of that order, and
`out_of_order_stages()` asserts the workflow reproduces it — a job running a Stage N check must have
every Stage N-1 job in its transitive closure.

The standing rule already required this — a gate step that exits non-zero MUST fail the build —
and the workflow just did not implement it. This is that rule, made mechanical.
"""

import re
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKFLOW_DIR = REPO_ROOT / ".github" / "workflows"
BUILD_MODULE = REPO_ROOT / "build" / "__init__.py"

# The Stage 1 task table in build/__init__.py, read as text rather than imported: this tool must
# work on a bare interpreter (the CI jobs that run it install no dependencies beyond requirements),
# and importing `build` here would also make the checker depend on the thing it checks.
STAGE_1_TABLE = re.compile(r"tasks = \{(.*?)\n    \}", re.S)
STAGE_1_TASK = re.compile(r'"[^"]+":\s*(run_[a-z_0-9]+)')
# The stage-order table, read the same way and for the same reason as STAGE_1_TABLE above.
PIPELINE_STAGES_TABLE = re.compile(r"PIPELINE_STAGES = \((.*?)\n\)", re.S)
PIPELINE_STAGE_ROW = re.compile(r"\((\d+),\s*run_stage_[a-z_0-9]+,\s*\(([^)]*)\)\)")
# A job's displayed name claiming a stage: "Stage 2 · Medium Component Tests".
STAGE_LABEL = re.compile(r"\s*Stage\s+(\d+)\s*[·:-]")


def load_jobs(workflow_path):
    """Return {job_name: [needs]} for one workflow file."""
    document = yaml.safe_load(workflow_path.read_text(encoding="utf-8"))
    jobs = {}
    for name, body in (document.get("jobs") or {}).items():
        needs = (body or {}).get("needs") or []
        jobs[name] = [needs] if isinstance(needs, str) else list(needs)
    return jobs


def load_job_commands(workflow_path):
    """Return {job_name: every `run:` string in its steps, concatenated}.

    Needed to answer "which job runs this check", which is what ties a workflow job to a local
    pipeline stage. Matching on the `run_*` function name rather than the job's display name means
    renaming a job cannot silently detach it from the stage it belongs to.
    """
    document = yaml.safe_load(workflow_path.read_text(encoding="utf-8"))
    commands = {}
    for name, body in (document.get("jobs") or {}).items():
        steps = (body or {}).get("steps") or []
        commands[name] = " ".join(str(step.get("run", "")) for step in steps)
    return commands


def load_job_names(workflow_path):
    """Return {job_name: its `name:` display string}, empty when a job declares none."""
    document = yaml.safe_load(workflow_path.read_text(encoding="utf-8"))
    return {
        name: str((body or {}).get("name", ""))
        for name, body in (document.get("jobs") or {}).items()
    }


def mislabelled_stages(commands, names):
    """Jobs whose displayed stage does not match the stage they actually run.

    The `needs` graph already enforces the ORDER; this enforces that the order is legible. Without
    it the stage a job belongs to is implicit in its dependency list, which is exactly how a job
    came to sit between stages — `static-security-audits` had acquired a `needs` on every Stage 1
    job, making it an unnamed Stage 1.5 that delayed everything behind it and that no label
    contradicted. A stage number in the name is a claim, so it is checked like one: a job running a
    Stage N check must say `Stage N`, and a job running no staged check must not claim a stage at
    all.
    """
    leaves = stage_leaves()
    problems = []
    for job, command in sorted(commands.items()):
        actual = max(
            (
                number
                for number, tasks in leaves.items()
                if any(re.search(rf"\b{task}\b", command) for task in tasks)
            ),
            default=None,
        )
        declared = STAGE_LABEL.match(names.get(job, ""))
        declared = int(declared.group(1)) if declared else None

        if actual is None and declared is not None:
            problems.append(
                f"'{job}' is named Stage {declared} but runs no stage's checks"
            )
        elif actual is not None and declared is None:
            problems.append(
                f"'{job}' runs Stage {actual} checks but its name says no stage"
            )
        elif actual is not None and declared != actual:
            problems.append(
                f"'{job}' is named Stage {declared} but runs Stage {actual} checks"
            )
    return problems


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


def stage_1_tasks():
    """The `run_*` functions the local Stage 1 gate gets its verdict from."""
    table = STAGE_1_TABLE.search(BUILD_MODULE.read_text(encoding="utf-8"))
    return set(STAGE_1_TASK.findall(table.group(1))) if table else set()


def stage_leaves():
    """{stage number: the `run_*` checks it holds}, read from build's PIPELINE_STAGES table.

    Stage 1's row is deliberately empty in that table — it has fourteen checks and they are already
    declared in `run_stage_1_parallel`'s own `tasks` dict, so reading them twice would be the exact
    duplication this checker exists to prevent.
    """
    text = BUILD_MODULE.read_text(encoding="utf-8")
    table = PIPELINE_STAGES_TABLE.search(text)
    stages = {1: stage_1_tasks()}
    if table:
        for number, tasks in PIPELINE_STAGE_ROW.findall(table.group(1)):
            declared = set(re.findall(r'"(run_[a-z_0-9]+)"', tasks))
            # An empty row means "this stage declares its checks elsewhere" (stage 1's `tasks`
            # dict), so it must not clobber what was seeded above. Overwriting it silently dropped
            # stage 1 from the ordering entirely, which meant the Stage 2 job was never checked for
            # waiting on the fast checks — the check passed by having nothing to compare.
            if declared:
                stages[int(number)] = declared
    return {number: tasks for number, tasks in stages.items() if tasks}


def out_of_order_stages(jobs, commands):
    """Workflow jobs whose `needs` do not reproduce the local stage order.

    The local gate runs stages strictly in sequence — each starts only if the previous was clean —
    so a job running a Stage N check must have every Stage N-1 job in its transitive `needs`
    closure. Without this the two orderings are maintained by hand in two files, which is how CI
    came to run the medium and e2e suites concurrently while `build check` staged them: a broken
    component failed fast locally and only after the slowest suite in CI (TODO §6.4).
    """
    leaves = stage_leaves()
    stage_of_job = {}
    for job, command in commands.items():
        for number, tasks in leaves.items():
            if any(re.search(rf"\b{task}\b", command) for task in tasks):
                stage_of_job[job] = max(stage_of_job.get(job, 0), number)

    problems = []
    for job, stage in sorted(stage_of_job.items()):
        if stage <= 1:
            continue
        gated_by = closure_of(job, jobs)
        for earlier, earlier_stage in sorted(stage_of_job.items()):
            if earlier_stage < stage and earlier not in gated_by:
                problems.append(
                    f"'{job}' (stage {stage}) does not wait for '{earlier}' "
                    f"(stage {earlier_stage})"
                )
    return problems


def locally_gated_only(workflow_texts):
    """Stage 1 checks no CI job runs — gates that block a commit but not the deploy.

    The neighbouring `orphans()` check covers the opposite direction: a CI job nothing waits for.
    Both are the same failure in mirror image — a check whose result changes nothing — and this one
    is the easier to create, because adding a Stage 1 task is a one-line edit while giving it a CI
    job is not. Four accumulated this way (module catalog coverage, import layering, pipeline
    gating, cyclomatic complexity) before anyone noticed the local gate and the deploy gate had
    drifted apart.
    """
    invoked = " ".join(workflow_texts)
    return sorted(task for task in stage_1_tasks() if task not in invoked)


def local_actions_before_checkout(workflow_path):
    """Jobs that `uses:` a local `./` action before checking the repository out.

    A local action is read from the WORKSPACE, so the checkout that puts it there cannot itself live
    inside it — GitHub fails the job with "Can't find 'action.yml' ... Did you forget to run
    actions/checkout before running your local action?", which is the runner naming the cycle. The
    shared python-env action shipped with exactly that shape on 2026-08-18 and took every job in the
    deploy down.

    It is asserted here rather than reviewed because nothing else can see it: the workflow file is
    valid YAML, no gate stage reads it, and the whole failure lives on the runner. That is the same
    "local green is not CI green" gap.
    """
    document = yaml.safe_load(workflow_path.read_text(encoding="utf-8"))
    problems = []
    for name, body in (document.get("jobs") or {}).items():
        checked_out = False
        for step in (body or {}).get("steps") or []:
            uses = str(step.get("uses", ""))
            if uses.startswith("actions/checkout"):
                checked_out = True
            elif uses.startswith("./") and not checked_out:
                problems.append(f"job '{name}' uses {uses} before actions/checkout")
    return problems


def workflow_failures(workflow):
    """Every gating problem in one workflow file, already prefixed with its path.

    Split out of `main()` when adding the stage-order and stage-label checks pushed it past the
    complexity gate — three checks over one file is one job, and `main()`'s remaining job is
    reporting.
    """
    jobs = load_jobs(workflow)
    if not jobs:
        return []

    rel = workflow.relative_to(REPO_ROOT)
    commands = load_job_commands(workflow)
    ungated, terminals = orphans(jobs)

    failures = []
    if len(terminals) > 1:
        failures.append(
            f"{rel}: {len(terminals)} terminal jobs — {', '.join(terminals)}"
        )
    failures += [
        f"{rel}: job '{job}' gates nothing (no job lists it in `needs`)"
        for job in ungated
    ]
    failures += [
        f"{rel}: stage order not enforced — {problem}"
        for problem in out_of_order_stages(jobs, commands)
    ]
    failures += [
        f"{rel}: stage label wrong — {problem}"
        for problem in mislabelled_stages(commands, load_job_names(workflow))
    ]
    failures += [
        f"{rel}: local action unreachable — {problem}"
        for problem in local_actions_before_checkout(workflow)
    ]
    return failures


def main():
    workflows = sorted(WORKFLOW_DIR.glob("*.yml")) + sorted(WORKFLOW_DIR.glob("*.yaml"))
    failures = [f for workflow in workflows for f in workflow_failures(workflow)]

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
        print(
            "    For a stage-order failure, the fix is the same edit: the later stage's job must"
        )
        print(
            "    `needs:` the earlier one, so CI fails in the order build check does."
        )
        print(
            "    For an unreachable local action, add `- uses: actions/checkout@v5` as that job's"
        )
        print(
            "    first step — the workspace has to hold the action before GitHub can read it."
        )
        return 1

    ungated_locally = locally_gated_only(
        [w.read_text(encoding="utf-8") for w in workflows]
    )
    if ungated_locally:
        print(
            f"\n  ✗ Pipeline gates: {len(ungated_locally)} Stage 1 check(s) run locally but in no "
            "CI job\n"
        )
        for task in ungated_locally:
            print(f"    build.{task} gates a commit but not the deploy")
        print(
            "\n    Add a CI step invoking it (group fast pure-analysis checks into one job — a"
        )
        print(
            "    fresh runner costs ~30s apiece). A gate CI never runs is a gate you can push past."
        )
        return 1

    checked = sum(len(load_jobs(w)) for w in workflows)
    print(
        f"  ✓ Pipeline gates: {checked} job(s), every one gates the deploy; "
        f"all {len(stage_1_tasks())} Stage 1 checks run in CI; "
        f"{len(stage_leaves())} stages ordered and labelled as locally."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
