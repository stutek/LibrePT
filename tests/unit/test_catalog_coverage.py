# tests/unit/test_catalog_coverage.py
# The module-catalog gate (agent_tools/catalog_coverage.py). Its job is to notice the two ways the
# catalog and the tree drift apart — a module nobody listed, and a listing whose file is gone — so
# these pin both directions plus the parsing that feeds them. The real repo is deliberately NOT
# touched here: the tool's own `main()` already runs against it every Stage 1.

from agent_tools.catalog_coverage import catalogued_paths, coverage_problems

CATALOG = """\
| [app.js](../src/app.js) | `entry` | Bootstrapper. |
| [data/stateStore.js](../src/data/stateStore.js) | `data` | State. |
| [index.html](../src/index.html) | `shell` | The shell. |
| [TODO §18](../TODO.md) | | A cross-reference, not a module. |
"""


def test_only_src_links_are_treated_as_catalog_entries():
    """Rows link out to TODO.md and other docs; those are references, not catalogued modules."""
    assert catalogued_paths(CATALOG) == {
        "src/app.js",
        "src/data/stateStore.js",
        "src/index.html",
    }


def test_a_module_nobody_listed_is_reported():
    uncatalogued, stale = coverage_problems(
        {"src/app.js"}, {"src/app.js", "src/modules/common/brandNew.js"}
    )
    assert uncatalogued == ["src/modules/common/brandNew.js"]
    assert stale == []


def test_a_listing_whose_file_is_gone_is_reported():
    uncatalogued, stale = coverage_problems(
        {"src/app.js", "src/data/deleted.js"}, {"src/app.js"}
    )
    assert uncatalogued == []
    assert stale == ["src/data/deleted.js"]


def test_non_module_links_are_not_reported_as_stale():
    """index.html and icons are legitimately catalogued but are not `.js`/`.css`, so they must not
    be mistaken for entries whose file vanished."""
    _, stale = coverage_problems(
        {"src/app.js", "src/index.html", "src/icons/icon-192.png"}, {"src/app.js"}
    )
    assert stale == []


def test_a_catalog_matching_the_tree_is_clean():
    assert coverage_problems({"src/app.js"}, {"src/app.js"}) == ([], [])
