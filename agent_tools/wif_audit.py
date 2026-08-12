"""`python -m agent_tools.wif_audit` — audit the live Workload Identity Federation setup.

Why this exists: the security of the whole keyless-CI design rests on **two settings that live in
GCP, not in this repository** — so nothing under version control can be reviewed to confirm they are
right, and both fail SILENTLY when wrong. Everything keeps working; the canary stays green; the only
difference is that strangers can now mint tokens as our service account.

The two:

  1. **The provider's `attributeCondition`** must pin `assertion.repository` to this repo. Without
     it, the provider trusts *any* GitHub Actions OIDC token — which every public repository on
     GitHub can obtain — so anyone can impersonate the service account. This is the classic WIF
     misconfiguration and it has been exploited in the wild.
  2. **The service account's IAM binding** must name `attribute.repository/<owner>/<repo>`. A
     binding on the bare pool (`principalSet://…/workloadIdentityPools/<pool>/*`) re-opens exactly
     the same hole one layer down, and it is the more tempting mistake because it is what most
     copy-pasted snippets show.

A `diagnostic`, not a `check` (agent_tools/INDEX.md): it needs the network and an authenticated
`gcloud`, so it cannot gate `build check`. Run it after the one-time setup and after ANY change to
the pool, provider or bindings. The pure analysis below is unit-tested without touching gcloud;
only `main()` shells out.

Usage:
  python -m agent_tools.wif_audit --project librept-test-1234 --repo stutek/LibrePT
  python -m agent_tools.wif_audit --project … --repo … --pool github --provider github-librept \\
      --service-account librept-canary@librept-test-1234.iam.gserviceaccount.com

Exits non-zero, naming the exact hole, if either setting fails to constrain the repository.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys


def check_attribute_condition(condition, repo):
    """Findings for a provider's `attributeCondition`. Empty list means it constrains this repo.

    Deliberately strict about *how* the repository is named, because several conditions that look
    protective are not: a `!=` test excludes one repo and admits the rest, and `startsWith` on the
    owner admits every repository that owner will ever create — including one an attacker persuades
    them to accept a pull request into. Only an equality test against the full `owner/name` closes it.
    """
    if not condition or not condition.strip():
        return [
            "provider has NO attributeCondition — every GitHub Actions OIDC token on the "
            "internet is accepted, so any repository can mint tokens as this service account"
        ]
    if "assertion.repository" not in condition:
        return [
            f"attributeCondition does not mention assertion.repository: {condition!r} — "
            "it may constrain something else, but not WHICH repository may authenticate"
        ]
    findings = []
    if not re.search(
        rf"assertion\.repository\s*==\s*['\"]{re.escape(repo)}['\"]", condition
    ):
        findings.append(
            f"attributeCondition does not pin assertion.repository == '{repo}': {condition!r}"
        )
    if re.search(r"assertion\.repository\s*!=", condition):
        findings.append(
            "attributeCondition uses `assertion.repository !=`, which excludes one repository "
            "and admits every other one"
        )
    if re.search(r"assertion\.repository(_owner)?\s*\.\s*startsWith", condition):
        findings.append(
            "attributeCondition uses startsWith on the repository/owner, which admits every "
            "repository that owner ever creates — use an equality test on the full owner/name"
        )
    return findings


def check_principal_members(members, repo):
    """Findings for the principals bound to the service account.

    A pool-wide `principalSet://…/workloadIdentityPools/<pool>/*` grants the role to anything the
    provider lets in, so a correctly-pinned provider is the only thing left standing — and this tool
    exists precisely because that single remaining control fails silently.
    """
    if not members:
        return [
            "service account has no workloadIdentityUser binding — CI cannot authenticate"
        ]
    findings = []
    scoped = [m for m in members if f"attribute.repository/{repo}" in m]
    for member in members:
        if re.search(r"/workloadIdentityPools/[^/]+/\*$", member):
            findings.append(
                f"binding {member} grants the whole pool, not one repository — "
                f"scope it to attribute.repository/{repo}"
            )
    if not scoped and not findings:
        findings.append(
            f"no binding names attribute.repository/{repo}; found {members} — "
            "the service account may be reachable from another repository"
        )
    return findings


def _gcloud_json(args):
    """Run a gcloud command expected to print JSON. Returns None if it failed."""
    try:
        completed = subprocess.run(
            ["gcloud", *args, "--format=json"],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        return None
    if completed.returncode != 0:
        print(
            f"  gcloud {' '.join(args)} failed:\n{completed.stderr.strip()}",
            file=sys.stderr,
        )
        return None
    return json.loads(completed.stdout or "null")


def members_for_role(policy, role):
    """Principals holding `role` in a getIamPolicy result."""
    for binding in (policy or {}).get("bindings") or []:
        if binding.get("role") == role:
            return list(binding.get("members") or [])
    return []


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--repo", required=True, help="owner/name, e.g. stutek/LibrePT")
    parser.add_argument("--pool", default="github")
    parser.add_argument("--provider", default="github-librept")
    parser.add_argument("--service-account", default=None)
    args = parser.parse_args(argv)

    if not shutil.which("gcloud"):
        print(
            "✗ gcloud not found — this audit reads LIVE GCP config and cannot run without it"
        )
        return 2

    provider = _gcloud_json(
        [
            "iam",
            "workload-identity-pools",
            "providers",
            "describe",
            args.provider,
            f"--project={args.project}",
            "--location=global",
            f"--workload-identity-pool={args.pool}",
        ]
    )
    if provider is None:
        print(
            "✗ could not read the provider — check --project/--pool/--provider and your login"
        )
        return 2

    findings = check_attribute_condition(provider.get("attributeCondition"), args.repo)

    # The mapping is what makes the condition expressible at all; a condition referencing an
    # unmapped attribute is a configuration that cannot do what it appears to.
    mapping = provider.get("attributeMapping") or {}
    if "assertion.repository" not in " ".join(mapping.values()):
        findings.append(
            f"attributeMapping never reads assertion.repository: {mapping} — "
            "the repository cannot be constrained by a condition it does not map"
        )

    if args.service_account:
        policy = _gcloud_json(
            [
                "iam",
                "service-accounts",
                "get-iam-policy",
                args.service_account,
                f"--project={args.project}",
            ]
        )
        if policy is None:
            findings.append("could not read the service account IAM policy")
        else:
            findings.extend(
                check_principal_members(
                    members_for_role(policy, "roles/iam.workloadIdentityUser"),
                    args.repo,
                )
            )

    if findings:
        print(
            f"✗ Workload Identity Federation is not safely constrained ({len(findings)}):"
        )
        for finding in findings:
            print(f"    {finding}")
        return 1
    print(f"✓ WIF audit: provider and bindings both pin {args.repo}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
