# tests/e2e/test_deeplink_page_isolation.py
# The pooled `deeplink_page` (tests/conftest.py) trades isolation-by-construction for
# isolation-by-teardown: instead of throwing a browser context away, it clears the origin's storage
# between tests. That is only sound while the list of what gets cleared is COMPLETE, and a missing
# store would leak silently and intermittently — the worst failure shape this suite can have.
#
# So the list is pinned here rather than trusted. The first test writes a marker into every storage
# surface the app can reach; the second, which shares the same pooled page, asserts none of them
# survived. Ordering within a file is guaranteed by pytest, and both tests share a worker because
# xdist's default distribution keeps a module's tests together only by chance — hence the explicit
# xdist_group, which forces them onto the same worker and therefore the same pooled page.
#
# If this file ever fails, do not relax it: it means `deeplink_page` is handing one test another
# test's state, which is exactly what it promises not to do.

import pytest


@pytest.fixture
def page(deeplink_page):
    """This file tests the pooled page, so it must be on it."""
    return deeplink_page


MARKER = "librept-isolation-probe"

WRITE_EVERY_STORE = """async (marker) => {
  localStorage.setItem(marker, 'local');
  sessionStorage.setItem(marker, 'session');
  await new Promise((resolve) => {
    const open = indexedDB.open(marker, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('probe');
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('probe', 'readwrite');
      tx.objectStore('probe').put('idb', marker);
      tx.oncomplete = () => { db.close(); resolve(); };
    };
    open.onerror = () => resolve();
  });
  if (window.caches) {
    const cache = await caches.open(marker);
    await cache.put('/probe', new Response('cache'));
  }
}"""

READ_EVERY_STORE = """async (marker) => {
  const databases = (await indexedDB.databases()).map((db) => db.name);
  const cacheKeys = window.caches ? await caches.keys() : [];
  return {
    local: localStorage.getItem(marker),
    session: sessionStorage.getItem(marker),
    indexedDb: databases.includes(marker),
    caches: cacheKeys.includes(marker),
  };
}"""


@pytest.mark.xdist_group("deeplink_page_isolation")
def test_a_test_can_write_to_every_storage_surface(page, local_server):
    """Establishes that the probe actually writes — otherwise the assertion in the next test would
    pass against a page where nothing was ever stored, proving nothing at all."""
    page.goto(local_server)
    page.evaluate(WRITE_EVERY_STORE, MARKER)

    written = page.evaluate(READ_EVERY_STORE, MARKER)

    assert written == {
        "local": "local",
        "session": "session",
        "indexedDb": True,
        "caches": True,
    }, "the probe must write to every surface, or the isolation check below is vacuous"


@pytest.mark.xdist_group("deeplink_page_isolation")
def test_none_of_it_survives_into_the_next_test(page, local_server):
    """The guarantee: the pooled page arrives clean, on every surface the test above wrote to."""
    page.goto(local_server)

    survived = page.evaluate(READ_EVERY_STORE, MARKER)

    assert survived == {
        "local": None,
        "session": None,
        "indexedDb": False,
        "caches": False,
    }, "storage leaked between tests — RESET_ORIGIN_STORAGE is missing a surface"


@pytest.mark.xdist_group("deeplink_page_isolation")
def test_the_pooled_page_is_actually_reused(page, deeplink_page):
    """Guards the point of the whole thing.

    If the module-local `page` override were dropped, or the fixture quietly started handing out
    fresh pages, every test above would still pass — they would just be testing a fresh page's
    emptiness, and the speedup would be gone with nothing failing to say so."""
    assert page is deeplink_page
    assert getattr(page, "goto_without_splash_dismiss", None), (
        "the splash wrapper must be installed exactly once on the pooled page"
    )
