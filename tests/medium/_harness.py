# tests/medium/_harness.py — shared helper for medium-tier component tests.
# A medium test intercepts the real app.js request and serves a stub module the test writes
# inline (same "each test inlines its own literal JS body" style tests/e2e/ already uses) that
# calls ONE bootXyz(deps) step from src/appBoot.js — the exact function app.js's real init() calls
# — with test-supplied fakes. index.html's real markup still loads unchanged, so the component
# under test wires against the same DOM ids production does; only the boot path (router,
# IndexedDB, service worker, demo-data seed) is skipped, not the markup or the component logic.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.
#
# Two gotchas found converting the first two components, worth knowing before writing another:
#   1. Fake `t` with the REAL translation dict (`TRANSLATIONS.en[key] || key`), never an identity
#      function `(key) => key`. The app's own `t()` only falls back to the raw key when a
#      translation is genuinely MISSING; an identity fake makes every lookup look "missing" and
#      silently breaks any assertion on translated text (a label becomes the key, not the word).
#   2. Import ONLY the specific pure render function you need (e.g. `renderBuildStamp`) rather
#      than pulling in a whole boot step for one side effect — `bootAppLifecycle` also registers
#      the service worker, resizes the viewport, and starts Drive-sync polling, none of which a
#      component test wants running.


def load_with_stub(page, local_server, stub_js_body):
    """Navigate to `local_server` with app.js replaced by `stub_js_body` (literal ES module
    source, relative imports resolve the same as the real app.js since it's served from the same
    path). Must be called before `page.goto`."""

    def handle(route):
        route.fulfill(body=stub_js_body, content_type="application/javascript")

    page.route("**/app.js", handle)
    page.goto(local_server)
