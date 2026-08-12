# tests/unit/test_wif_audit.py
# agent_tools/wif_audit.py's analysis, exercised without gcloud or a network.
#
# These pin the cases the tool exists for: WIF misconfigurations that leave everything WORKING while
# silently letting strangers mint tokens as our service account. A green canary proves nothing about
# any of them, which is why the checks are worth having and worth pinning — a laxer regex here would
# make the audit pass on exactly the setup it was written to catch.

from agent_tools.wif_audit import (
    check_attribute_condition,
    check_principal_members,
    members_for_role,
)

REPO = "stutek/LibrePT"
GOOD = "assertion.repository == 'stutek/LibrePT'"


def test_a_correctly_pinned_condition_passes():
    assert check_attribute_condition(GOOD, REPO) == []
    assert (
        check_attribute_condition(f"{GOOD} && assertion.ref == 'refs/heads/main'", REPO)
        == []
    )


def test_a_missing_condition_is_the_headline_failure():
    """No condition means the provider trusts any GitHub Actions token in existence — every public
    repository can obtain one."""
    for empty in (None, "", "   "):
        findings = check_attribute_condition(empty, REPO)
        assert len(findings) == 1
        assert "NO attributeCondition" in findings[0]


def test_a_condition_about_something_else_does_not_count():
    """Constraining the branch while leaving the repository open still admits every repository."""
    findings = check_attribute_condition("assertion.ref == 'refs/heads/main'", REPO)
    assert findings and "does not mention assertion.repository" in findings[0]


def test_a_different_repository_is_rejected():
    findings = check_attribute_condition("assertion.repository == 'someone/else'", REPO)
    assert findings and "does not pin" in findings[0]


def test_negation_looks_protective_and_is_not():
    """`!=` excludes one repository and admits every other — the inversion of what is wanted."""
    findings = check_attribute_condition("assertion.repository != 'evil/repo'", REPO)
    assert any("!=" in f for f in findings)


def test_prefix_matching_on_the_owner_is_rejected():
    """startsWith on the owner admits every repository that owner will ever create, including one
    an attacker gets a pull request merged into."""
    findings = check_attribute_condition(
        "assertion.repository.startsWith('stutek/')", REPO
    )
    assert any("startsWith" in f for f in findings)


def test_a_repository_scoped_binding_passes():
    member = (
        "principalSet://iam.googleapis.com/projects/1/locations/global/"
        "workloadIdentityPools/github/attribute.repository/stutek/LibrePT"
    )
    assert check_principal_members([member], REPO) == []


def test_a_pool_wide_binding_is_flagged():
    """The tempting copy-paste: binding the whole pool re-opens the hole one layer below the
    provider condition, leaving a single control between strangers and the service account."""
    member = (
        "principalSet://iam.googleapis.com/projects/1/locations/global/"
        "workloadIdentityPools/github/*"
    )
    findings = check_principal_members([member], REPO)
    assert findings and "whole pool" in findings[0]


def test_no_binding_at_all_is_reported():
    assert check_principal_members([], REPO)[0].startswith("service account has no")


def test_a_binding_for_another_repository_is_reported():
    member = (
        "principalSet://iam.googleapis.com/projects/1/locations/global/"
        "workloadIdentityPools/github/attribute.repository/someone/else"
    )
    findings = check_principal_members([member], REPO)
    assert findings and "may be reachable from another repository" in findings[0]


def test_members_are_read_from_the_matching_role_only():
    policy = {
        "bindings": [
            {"role": "roles/iam.serviceAccountTokenCreator", "members": ["user:a@b.c"]},
            {"role": "roles/iam.workloadIdentityUser", "members": ["principalSet://x"]},
        ]
    }
    assert members_for_role(policy, "roles/iam.workloadIdentityUser") == [
        "principalSet://x"
    ]
    assert members_for_role(policy, "roles/iam.missing") == []
    assert members_for_role(None, "roles/iam.workloadIdentityUser") == []
