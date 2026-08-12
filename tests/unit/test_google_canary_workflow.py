# tests/unit/test_google_canary_workflow.py
# The live-Google canary is the one workflow that holds a real Google credential, so the properties
# that keep it safe are worth enforcing mechanically rather than trusting to review — each of these
# is a mistake that would look harmless in a diff and be invisible until exploited or until the
# canary quietly stopped testing anything real.
#
# The design changed on 2026-08-12, and what these tests guard changed with it. Workload Identity
# Federation stored nothing, so the rule then was "no stored Google secret, ever". It could only
# ever mint a SERVICE ACCOUNT token, and Google refuses a service account's appDataFolder writes for
# lack of storage quota — so the canary now carries a real account's refresh token in an Actions
# secret. The secret is no longer the thing to forbid; LEAKING it is, and so is a canary that
# reports confidence it has not earned.
#
# Static analysis of the workflow YAML, because actually running it needs a live credential.

import pathlib
import re

import yaml

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
WORKFLOW_DIR = REPO_ROOT / ".github" / "workflows"
CANARY = WORKFLOW_DIR / "google-canary.yml"
DRIVE_CONFIG = REPO_ROOT / "src" / "data" / "driveSyncConfig.js"
SCOPE_TEST = REPO_ROOT / "tests" / "live" / "tokenScopes.live.test.mjs"


def _canary_document():
    return yaml.safe_load(CANARY.read_text(encoding="utf-8"))


def _canary_steps():
    return _canary_document()["jobs"]["live-google-canary"]["steps"]


def test_no_workflow_uses_pull_request_target():
    """`pull_request_target` runs in the BASE repo's context WITH secrets, while checking out a
    fork's head — the standard way a public repository leaks credentials to untrusted code. It was
    always forbidden here; now that a real refresh token sits in Actions secrets, it is the single
    change that would turn this workflow into a credential giveaway."""
    for workflow in sorted(WORKFLOW_DIR.glob("*.yml")) + sorted(
        WORKFLOW_DIR.glob("*.yaml")
    ):
        document = yaml.safe_load(workflow.read_text(encoding="utf-8"))
        # PyYAML parses the unquoted key `on:` as the boolean True — hence both spellings.
        triggers = document.get("on", document.get(True)) or {}
        assert "pull_request_target" not in triggers, (
            f"{workflow.name} uses pull_request_target, which exposes credentials to fork code"
        )


def test_the_credential_is_a_secret_not_a_variable():
    """`vars.` is world-readable to anyone who can see the repository's settings, and prints in
    plain text in logs. The three identifiers this workflow used to read really were addresses, but
    the credential that replaced them is a refresh token — so the moment it moves to `vars.` it is
    published rather than stored."""
    text = CANARY.read_text(encoding="utf-8")
    leaked = re.findall(r"vars\.GOOGLE[A-Z_]*", text)
    assert not leaked, (
        f"canary reads Google credentials from variables {leaked}; use secrets."
    )
    assert "secrets.GOOGLE_LIVE_CREDENTIALS" in text, (
        "canary reads no stored credential at all — it would skip on every scheduled run"
    )


def test_derived_secret_fields_are_masked():
    """GitHub masks a secret's own value, not values DERIVED from it. The credential is a JSON blob
    whose `refresh_token` and `client_secret` are what an error dump or a `set -x` would print, and
    neither matches the blob byte-for-byte, so neither is masked automatically."""
    text = CANARY.read_text(encoding="utf-8")
    assert text.count("::add-mask::") >= 2, (
        "both the refresh token and the client secret must be masked after being written"
    )


def test_the_credential_install_cannot_fail_silently():
    """A half-written credential file would make the suite report "skipped" rather than fail — a
    disarmed canary reporting green, which AGENT_RULES §2.A.3 calls a failure, not a pass."""
    steps = _canary_steps()
    install = next(s for s in steps if "credential" in s.get("name", "").lower())
    assert "set -euo pipefail" in install["run"], (
        "the credential install must not swallow a mid-pipeline failure"
    )
    assert "::warning::" in install["run"], (
        "an absent credential must announce itself; a silent skip is a canary testing nothing"
    )


def test_a_manual_run_can_supply_its_own_short_lived_token():
    """Testing a PR branch against real Google must not require touching the stored secret.

    The dispatch input is deliberately an ACCESS token, not the refresh token: a workflow_dispatch
    input is echoed back on the run's own page, so on a public repository it should be treated as
    published the moment it is submitted. An access token expires within the hour and can be revoked
    immediately after; a refresh token pasted there would be a standing grant on a real account."""
    document = _canary_document()
    triggers = document.get("on", document.get(True)) or {}
    dispatch_inputs = (triggers.get("workflow_dispatch") or {}).get("inputs") or {}
    assert "access_token" in dispatch_inputs, (
        "no way to run this against a PR branch by hand"
    )
    assert not dispatch_inputs["access_token"].get("required", False), (
        "a scheduled run supplies no input, so requiring one would break the daily canary"
    )
    description = dispatch_inputs["access_token"].get("description", "")
    assert "refresh token" in description.lower(), (
        "the input must say, where it is typed, that a refresh token does not belong there"
    )

    run_step = next(s for s in _canary_steps() if "Run Live" in s.get("name", ""))
    assert "inputs.access_token" in str(run_step.get("env", {})), (
        "the dispatch token never reaches the suite"
    )


def test_the_canary_mints_nothing():
    """`id-token: write` let this workflow exchange GitHub's OIDC assertion for a Google token. That
    design is gone, and the permission must go with it: leaving it behind grants the ability to
    authenticate as whatever federation is configured later, with nothing in the workflow using
    it — a capability nobody would notice was still granted."""
    permissions = _canary_document().get("permissions") or {}
    assert "id-token" not in permissions, (
        "canary no longer uses federation; id-token: write is a standing capability with no user"
    )
    assert permissions.get("contents") == "read", (
        "canary must not hold write access to the repo"
    )


def test_the_shipping_drive_scope_is_asserted_against_the_live_grant():
    """The canary must exercise the SAME Drive scope production asks for, and since the grant lives
    on a consent screen rather than in this YAML, the check lives in the live suite —
    tests/live/tokenScopes.live.test.mjs asks the token itself. Pin that it still imports the
    shipping constant, so deleting the constant cannot quietly leave the drift unchecked."""
    shipped = re.search(
        r'GOOGLE_DRIVE_SCOPE\s*=\s*"([^"]+)"', DRIVE_CONFIG.read_text(encoding="utf-8")
    )
    assert shipped, "could not read GOOGLE_DRIVE_SCOPE from driveSyncConfig.js"
    scope_test = SCOPE_TEST.read_text(encoding="utf-8")
    assert "GOOGLE_DRIVE_SCOPE" in scope_test and "driveSyncConfig.js" in scope_test, (
        "the live scope test must import the shipping GOOGLE_DRIVE_SCOPE, not restate it"
    )


def test_canary_is_not_labelled_as_a_pipeline_stage():
    """agent_tools/pipeline_gates.py binds a job to a local pipeline stage by a 'Stage N ·' name
    prefix and then enforces stage ordering against it. This job belongs to no stage, and labelling
    it as one would silently enrol the deploy gate in Google's uptime."""
    for name, body in (_canary_document().get("jobs") or {}).items():
        label = (body or {}).get("name", "")
        assert not re.match(r"\s*Stage\s+\d+\s*[·:-]", label), (
            f"canary job {name} claims a pipeline stage"
        )
