# tests/unit/test_url_writers.py
# The router is the only module allowed to write the URL. Five modules used to call
# history.pushState/replaceState themselves, each re-deciding what a URL carries — and each dropping
# the query string, so a ?lang=sl&theme=nebula promo link lost both params on the first navigation.
# Those rules now live in routerController's pushRoute/replaceRoute. A static check is what keeps them
# there: a new writer added anywhere else would silently re-open the same hole.
# Uses the src_dir fixture (tests/conftest.py).

import re

# routerController owns history; the routes/ package reaches it through the injected ctx.router facade.
ALLOWED = ("controllers/routerController.js",)
HISTORY_WRITE = re.compile(r"history\s*\.\s*(?:pushState|replaceState)\s*\(")


def _runtime_js(src_dir):
    for path in sorted(src_dir.rglob("*.js")):
        rel = path.relative_to(src_dir).as_posix()
        # theme-boot.js runs before the app and only reads the query string; sw/ is a separate worker.
        if rel.startswith("sw/") or rel == "sw.js":
            continue
        yield rel, path.read_text(encoding="utf-8")


def test_only_the_router_writes_history(src_dir):
    offenders = []
    for rel, source in _runtime_js(src_dir):
        if rel in ALLOWED:
            continue
        for match in HISTORY_WRITE.finditer(source):
            line = source[: match.start()].count("\n") + 1
            offenders.append(f"src/{rel}:{line}")

    assert not offenders, (
        "history writes outside the router: "
        + ", ".join(offenders)
        + " — navigate with navigateToPath(urlFor(...)) or the injected pushRoute/replaceRoute, "
        "so the query string and duplicate-entry rules stay in one place"
    )


def test_router_history_writes_carry_the_query_string(src_dir):
    """The one writer must re-append location.search, or share/promo params die on first navigation."""
    source = (src_dir / "controllers" / "routerController.js").read_text(
        encoding="utf-8"
    )
    writer = source[source.index("function writeHistory") :]
    body = writer[: writer.index("\n}")]
    assert "carriedSearch()" in body, (
        "writeHistory must carry the share params onto the new URL"
    )
    for state_call in ("pushState", "replaceState"):
        assert state_call in body, f"writeHistory no longer performs {state_call}"

    # ?init= seeds demo data and is consumed once at boot. Carrying it onward would make every URL
    # copied out of the address bar a demo-seeding link for whoever opens it.
    carried = source[source.index("function carriedSearch") :]
    carried = carried[: carried.index("\n}")]
    assert "BOOT_ONLY_PARAMS" in carried and "delete" in carried, (
        "carriedSearch must strip the boot-only params before re-appending the query string"
    )
