# tests/unit/test_ci_bare_python.py
# Three CI jobs (static-security-audits, owasp-zap-scan, build) run bare system python with no
# `pip install` — they work only because `build` imports with the stdlib alone. Nothing enforced
# that, and on 2026-08-04 an `import requests` added to ensure_zap_addons passed every local run
# (the venv has requests) while it would have ImportError'd on the runner — failing a job the
# deploy gates on, i.e. a green local gate and a broken release.
#
# This encodes the invariant directly rather than trusting review: for each such job, the build
# functions it calls must reach only stdlib modules. Static analysis, because actually calling them
# would run a ZAP container and a dist/ bundle.

import ast
import pathlib
import sys

import yaml

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
BUILD_MODULE = REPO_ROOT / "build" / "__init__.py"
WORKFLOW = REPO_ROOT / ".github" / "workflows" / "deploy.yml"

# Imported by build/ but vendored into .venv/ by the repo itself, never by pip at CI time. `yaml` is
# the one third-party import a bare-python job may reach, because setup-python's runner image ships
# it; anything else must be stdlib.
ALLOWED_NON_STDLIB = {"yaml"}


def _bare_python_jobs():
    """{job_name: [build functions it calls]} for jobs that never run `pip install`."""
    document = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    jobs = {}
    for name, body in (document.get("jobs") or {}).items():
        steps = (body or {}).get("steps") or []
        commands = [step.get("run") or "" for step in steps]
        if any("pip install" in command for command in commands):
            continue
        called = [
            function
            for command in commands
            for function in _build_functions_in(command)
        ]
        if called:
            jobs[name] = called
    return jobs


def _build_functions_in(command):
    """The build/ functions a `python -c "from build import X; X()"` step invokes."""
    functions = []
    for fragment in command.split("from build import ")[1:]:
        functions.append(fragment.split(";")[0].split()[0].strip())
    return functions


def _imports_reached_by(function_name, tree, seen=None):
    """Every module imported by `function_name`, following calls to other build/ helpers.

    Follows the call graph because the failure is transitive: run_owasp_zap_scan itself imports
    nothing, and reached `requests` only through ensure_zap_addons.
    """
    seen = seen if seen is not None else set()
    if function_name in seen:
        return set()
    seen.add(function_name)

    definitions = {
        node.name: node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)
    }
    node = definitions.get(function_name)
    if node is None:
        return set()

    modules = set()
    for child in ast.walk(node):
        if isinstance(child, ast.Import):
            modules.update(alias.name.split(".")[0] for alias in child.names)
        elif isinstance(child, ast.ImportFrom) and child.module and child.level == 0:
            modules.add(child.module.split(".")[0])
        elif isinstance(child, ast.Call) and isinstance(child.func, ast.Name):
            if child.func.id in definitions:
                modules |= _imports_reached_by(child.func.id, tree, seen)
    return modules


def test_bare_python_ci_jobs_exist_to_be_checked():
    """If this ever finds none, the test below is silently vacuous."""
    assert _bare_python_jobs(), (
        "expected jobs running python with no pip install — did the workflow change?"
    )


def test_functions_called_by_bare_python_jobs_import_only_stdlib():
    tree = ast.parse(BUILD_MODULE.read_text(encoding="utf-8"))

    offenders = {}
    for job, functions in _bare_python_jobs().items():
        for function in functions:
            for module in _imports_reached_by(function, tree):
                if module in sys.stdlib_module_names or module in ALLOWED_NON_STDLIB:
                    continue
                offenders.setdefault(job, []).append(f"{function} -> import {module}")

    assert not offenders, (
        "these CI jobs run bare system python with no `pip install`, so a third-party import "
        f"fails the job (and the deploy) while passing locally: {offenders}"
    )


def test_the_module_itself_imports_only_stdlib_at_top_level():
    """`from build import …` must succeed before any function runs."""
    tree = ast.parse(BUILD_MODULE.read_text(encoding="utf-8"))

    top_level = set()
    for node in tree.body:
        if isinstance(node, ast.Import):
            top_level.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            top_level.add(node.module.split(".")[0])

    non_stdlib = {
        module
        for module in top_level
        if module not in sys.stdlib_module_names
        and module not in ALLOWED_NON_STDLIB
        and module != "build"
    }
    assert not non_stdlib, f"module-level third-party imports in build/: {non_stdlib}"
