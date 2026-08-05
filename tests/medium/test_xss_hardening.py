# tests/medium/test_xss_hardening.py
# Stored-XSS hardening for data that ENTERS the app from outside it. A backup file is the one
# untrusted input this offline-first app has: it is JSON a trainer is invited to import, it is
# restored whole (so every field round-trips), and it renders into the trainer's own origin where
# the entire client database lives. Any field interpolated into HTML must therefore be escaped at
# the sink, and "it is only ever two characters" is not a safety argument.
#
# The sink under test is clientsDirectory.js rendering `client.avatar`. The e2e original delivered
# the hostile value by seeding localStorage and letting the app boot and migrate it; that path is
# already covered by the restore tests, and it is not what makes this a security test — the payload
# reaching the sink is. Handing the component a hostile client directly tests the same sink with
# nothing between the payload and the render to explain away a pass.
#
# The companion check — that DERIVED initials cannot emit markup either — needs no DOM at all and
# lives in tests/unit_js/modules/common/utils.test.mjs.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

PAYLOAD = '<img src=x onerror="window.__xss=1">'

STUB = view_stub(
    imports="""
import { renderClientDirectoryViewShell, renderClientsList } from './modules/clients/clientsView.js';
""",
    view_id="client-directory",
    body="""
const state = {
  lang: 'en',
  clients: [
    {
      id: 'c1',
      name: 'Mallory',
      avatar: '<img src=x onerror="window.__xss=1">',
      goals: '',
    },
  ],
};

renderClientDirectoryViewShell();
renderClientsList({ state, t, navigateToPath: noop });
""",
)


def test_a_hostile_avatar_in_a_backup_cannot_inject_markup(page, local_server):
    """`client.avatar` is rendered into the directory card and was interpolated unescaped."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-client-directory.active")

    assert page.evaluate("() => window.__xss") is None, "the payload must never execute"
    assert page.locator("#clients-list .client-card img").count() == 0, (
        "the payload must not become an element"
    )
    # It is shown as literal text — visible and harmless, which is what escaping means.
    assert (
        PAYLOAD in page.locator("#clients-list .client-card .avatar").first.inner_text()
    )
