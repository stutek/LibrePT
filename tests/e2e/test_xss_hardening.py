# tests/e2e/test_xss_hardening.py
# Stored-XSS hardening for data that ENTERS the app from outside it. A backup file is the one
# untrusted input this offline-first app has: it is JSON a trainer is invited to import, it is
# restored whole (so every field round-trips), and it renders into the trainer's own origin where
# the entire client database lives in localStorage. Any field interpolated into HTML must therefore
# be escaped at the sink, and "it is only ever two characters" is not a safety argument.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

PAYLOAD = '<img src=x onerror="window.__xss=1">'


def test_a_hostile_avatar_in_a_backup_cannot_inject_markup(page, local_server):
    """`client.avatar` is rendered into the directory card and was interpolated unescaped."""
    page.add_init_script(
        "window.localStorage.setItem('librept_db', %s);"
        % json.dumps(
            json.dumps(
                {
                    "schemaVersion": 2,
                    "clients": [
                        {"id": "c1", "name": "Mallory", "avatar": PAYLOAD, "goals": ""}
                    ],
                    "exercises": [],
                    "routines": [],
                    "history": [],
                    "sessions": [],
                }
            )
        )
    )
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.wait_for_timeout(400)

    assert page.evaluate("() => window.__xss") is None, "the payload must never execute"
    assert page.locator("#clients-list .client-card img").count() == 0, (
        "the payload must not become an element"
    )
    # It is shown as literal text — visible and harmless, which is what escaping means.
    assert (
        PAYLOAD in page.locator("#clients-list .client-card .avatar").first.inner_text()
    )


def test_initials_from_a_hostile_name_stay_alphanumeric(page, local_server):
    """Initials are derived, not escaped at source, so the derivation itself must not emit markup."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const m = await import(new URL('modules/common/utils.js', document.baseURI).href);
            return {
                hostile: m.getInitials('<img src=x> <script>'),
                punctuation: m.getInitials('!!!'),
                normal: m.getInitials('Jane Doe'),
                single: m.getInitials('Prince'),
                empty: m.getInitials(''),
            };
        }"""
    )

    for value in r.values():
        assert "<" not in value and ">" not in value, (
            f"initials leaked markup: {value!r}"
        )
    assert r["normal"] == "JD"
    assert r["single"] == "PR"
    # A name with nothing alphanumeric in it still has to produce something renderable.
    assert r["punctuation"] == "PT"
    assert r["empty"] == "PT"
