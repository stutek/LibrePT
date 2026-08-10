# tests/unit/test_google_canary_workflow.py
# The live-Google canary is the one workflow that mints a real Google credential, so the properties
# that keep it safe are worth enforcing mechanically rather than trusting to review — each of these
# is a mistake that would look harmless in a diff and be invisible until exploited or until the
# canary quietly stopped testing anything real.
#
# Static analysis of the workflow YAML, because actually running it needs GCP federation configured.

import pathlib
import re

import yaml

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
WORKFLOW_DIR = REPO_ROOT / ".github" / "workflows"
CANARY = WORKFLOW_DIR / "google-canary.yml"
DRIVE_CONFIG = REPO_ROOT / "src" / "data" / "driveSyncConfig.js"

# Scopes that would make the canary pass while the app's real, narrow scopes were broken — and that
# would hand a leaked token far more reach than the app ever needs. `drive.appdata` is bounded to
# this app's own hidden folder and `calendar.freebusy` authorises one endpoint that cannot read an
# event body; every entry below escapes one of those bounds.
OVERBROAD_SCOPES = (
    "https://www.googleapis.com/auth/drive ",
    "https://www.googleapis.com/auth/drive,",
    "https://www.googleapis.com/auth/drive'",
    "/auth/drive.file",
    "/auth/drive.readonly",
    "/auth/calendar ",
    "/auth/calendar,",
    "/auth/calendar'",
    "/auth/calendar.readonly",
    "/auth/calendar.events",
)


def _canary_document():
    return yaml.safe_load(CANARY.read_text(encoding="utf-8"))


def test_no_workflow_uses_pull_request_target():
    """`pull_request_target` runs in the BASE repo's context WITH secrets and OIDC, while checking
    out a fork's head — the standard way a public repository leaks credentials to untrusted code.
    Nothing here needs it, so the safe state is that no workflow may ever grow one."""
    for workflow in sorted(WORKFLOW_DIR.glob("*.yml")) + sorted(
        WORKFLOW_DIR.glob("*.yaml")
    ):
        document = yaml.safe_load(workflow.read_text(encoding="utf-8"))
        # PyYAML parses the unquoted key `on:` as the boolean True — hence both spellings.
        triggers = document.get("on", document.get(True)) or {}
        assert "pull_request_target" not in triggers, (
            f"{workflow.name} uses pull_request_target, which exposes credentials to fork code"
        )


def test_canary_stores_no_long_lived_google_secret():
    """The whole point of Workload Identity Federation here is that no Google credential is stored
    in the repository at all. A `secrets.GOOGLE_*` reference means someone reintroduced one —
    reverting the property this design was chosen for."""
    text = CANARY.read_text(encoding="utf-8")
    leaked = re.findall(r"secrets\.GOOGLE[A-Z_]*", text)
    assert not leaked, (
        f"canary references stored Google secrets {leaked}; use WIF instead"
    )


def test_canary_requests_only_the_narrow_production_scopes():
    """A canary minted with broader access than the app uses would pass while the real scopes were
    broken — worse than no canary, because it reports confidence it has not earned. Widening the
    scope list is also the tempting 'fix' for a genuine permissions failure."""
    text = CANARY.read_text(encoding="utf-8")
    scope_lines = [line for line in text.splitlines() if "access_token_scopes" in line]
    assert scope_lines, "canary declares no access_token_scopes"
    scopes = scope_lines[0]
    for overbroad in OVERBROAD_SCOPES:
        assert overbroad not in scopes, (
            f"canary requests overbroad scope {overbroad.strip()}"
        )


def test_canary_drive_scope_matches_the_shipping_app():
    """The canary must exercise the SAME Drive scope production asks for. If they drift, the canary
    is testing a configuration no user has."""
    shipped = re.search(
        r'GOOGLE_DRIVE_SCOPE\s*=\s*"([^"]+)"', DRIVE_CONFIG.read_text(encoding="utf-8")
    )
    assert shipped, "could not read GOOGLE_DRIVE_SCOPE from driveSyncConfig.js"
    assert shipped.group(1) in CANARY.read_text(encoding="utf-8"), (
        f"canary does not request the app's Drive scope {shipped.group(1)}"
    )


def test_canary_declares_its_own_minimal_permissions():
    """`id-token: write` is what lets this job mint a Google token, so it is declared at the job's
    own workflow rather than inherited — and `contents` stays read-only, since a canary has no
    business writing to the repository."""
    document = _canary_document()
    permissions = document.get("permissions") or {}
    assert permissions.get("id-token") == "write", (
        "canary needs id-token: write for WIF"
    )
    assert permissions.get("contents") == "read", (
        "canary must not hold write access to the repo"
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
