"""`python -m agent_tools.catalog_coverage` — verify the module catalog actually covers the modules.

Why this exists: the catalog must be updated whenever a module is added,
moved or removed, and nothing enforced it. `doclinks` is the neighbouring check and deliberately
does not cover this — it verifies that every link RESOLVES, which says nothing about the module that
was never linked in the first place. So the failure mode was silent in exactly the direction that
matters: a catalog can rot into a partial map while every link in it stays green, and an agent
trusting it as "the map of the codebase" then reasons from a version of the repo that no longer
exists. When this check was first written it found 22 uncatalogued modules, among them
`activeSessionController.js` — the live-session controller, one of the largest in the app.

Two directions, because only checking one is a half-map:

  1. **Coverage** — every runtime `.js`/`.css` under `src/` appears in the catalog.
  2. **Staleness** — every `src/` path the catalog names still exists on disk.

Scope is `src/` only: it is the deployable tree, so "what modules exist" is exactly the question
the catalog answers. The catalog lives in `docs/`, NOT in `src/`, because `run_build` copies `src/`
wholesale into `dist/` — an INDEX.md there would ship to production and be hashed into the
integrity catalog.

Pure file analysis, no network and no browser, so it runs in Stage 1.
Exit code is 1 when the catalog and the tree disagree, so it can gate a commit.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = REPO_ROOT / "docs" / "SRC_MODULES.md"
SRC = REPO_ROOT / "src"
CATALOGUED_SUFFIXES = (".js", ".css")

# Markdown link targets pointing into src/. The catalog sits in docs/, so they are written `../src/…`.
SRC_LINK = re.compile(r"\]\(\.\./(src/[^)#]+)\)")


def catalogued_paths(catalog_text):
    """Every distinct src/ path the catalog links to, as repo-relative POSIX strings."""
    return {match.group(1) for match in SRC_LINK.finditer(catalog_text)}


def runtime_modules(src_dir):
    """Every runtime module the catalog is expected to describe."""
    return {
        path.relative_to(src_dir.parent).as_posix()
        for path in src_dir.rglob("*")
        if path.is_file() and path.suffix in CATALOGUED_SUFFIXES
    }


def coverage_problems(catalogued, actual):
    """(uncatalogued, stale) — modules missing from the catalog, and catalog entries with no file."""
    uncatalogued = sorted(actual - catalogued)
    stale = sorted(
        path
        for path in catalogued - actual
        if path.endswith(
            CATALOGUED_SUFFIXES
        )  # non-module links (index.html, icons) are fine
    )
    return uncatalogued, stale


def main():
    if not CATALOG.exists():
        print(f"  ✗ Module catalog not found: {CATALOG.relative_to(REPO_ROOT)}")
        return 1

    uncatalogued, stale = coverage_problems(
        catalogued_paths(CATALOG.read_text(encoding="utf-8")), runtime_modules(SRC)
    )
    relative_catalog = CATALOG.relative_to(REPO_ROOT)

    for path in uncatalogued:
        print(f"  ✗ {path} is not in {relative_catalog}")
    for path in stale:
        print(f"  ✗ {relative_catalog} lists {path}, which no longer exists")

    if uncatalogued or stale:
        print(
            f"  ✗ Module catalog out of sync: {len(uncatalogued)} uncatalogued, {len(stale)} stale."
        )
        return 1

    print(
        f"  ✓ Module catalog: all {len(runtime_modules(SRC))} runtime modules catalogued."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
