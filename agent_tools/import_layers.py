"""`python -m agent_tools.import_layers` — verify the app's import graph still flows one way.

Why this exists: AGENT_RULES §5.3 builds the whole front-end on dependency injection — a component
receives what it needs as parameters rather than importing it — and the payoff is that any module
can be mounted on its own (which is exactly what `tests/medium/` does through `src/appBoot.js`).
That property is held together purely by discipline, and a single `import` in the wrong direction
silently removes it: the module still works, nothing fails, and the next person to try mounting it
in isolation discovers it drags a controller (and transitively half the app) along with it.

Measured before this gate existed, the graph was in good shape — the data layer had zero upward
imports — with exactly one inversion: `modules/history/historyView.js` imported
`controllers/activeSessionController.js` to open a session from a history card. It was fixed by
injection (the established pattern) rather than allowlisted, because a gate that ships with an
exemption is a gate that documents debt instead of preventing it (AGENT_RULES §2.A.3).

The layering, bottom to top — each may import only from layers strictly below it:

    data/          persistence and record shape; imports nothing above itself
    domain/        the training vocabulary — pure, no DOM, no storage (TODO §24.6)
    modules/common/ shared UI helpers, usable by any feature
    modules/<feat>/ one feature's views and components
    controllers/   orchestration; wires modules together and owns app-level actions
    app.js         composition root

`domain/` was carved out of `modules/common/`, which had become two directories wearing one name:
a DOM-reference count split its 22 modules cleanly, ten with zero and the rest with 5-35. A
directory documented as "shared UI helpers" holding the exercise-modality axis and the session
clock is a directory that has stopped describing itself, and there was nowhere to put a pure
domain rule that both storage and UI needed. The test tree had already ratified the split before
the code did — `tests/unit_js/` contained exactly the DOM-free set and nothing else.

CROSS-FEATURE imports are deliberately allowed and not flagged. Three exist (the adjustment wizard
mounting the exercise picker, the client card rendering history rows, the dashboard showing the
idle session bar); each is a genuine composition, and forcing them through injection would push
callback plumbing into the composition root for no isolation gain — the modules are still mountable.
What is forbidden is importing UP a layer, which is what actually costs mountability.

Pure file analysis, no network and no browser, so it runs in Stage 1.
Exit code is 1 on any upward import, so it can gate a commit.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"

# Lower number = lower layer. A module may import only from a STRICTLY lower rank.
LAYERS = {
    "data": 0,
    "domain": 1,
    "modules/common": 2,
    "modules": 3,
    "controllers": 4,
}

IMPORT = re.compile(r"""^\s*import\s[^'"]*['"]([^'"]+)['"]""", re.M)


def layer_of(repo_relative_path):
    """The layer rank for a path like `src/modules/history/historyView.js`, or None if unlayered
    (app.js, appBoot.js, i18n, sw — the composition root and leaf assets, which are not ranked)."""
    inner = repo_relative_path.removeprefix("src/")
    for prefix in sorted(
        LAYERS, key=len, reverse=True
    ):  # modules/common before modules
        if inner.startswith(f"{prefix}/"):
            return LAYERS[prefix]
    return None


def violations(src_dir):
    """[(importer, imported, importer_layer, imported_layer)] for every upward import."""
    found = []
    for path in sorted(src_dir.rglob("*.js")):
        importer = path.relative_to(src_dir.parent).as_posix()
        importer_layer = layer_of(importer)
        if importer_layer is None:
            continue
        for match in IMPORT.finditer(path.read_text(encoding="utf-8")):
            specifier = match.group(1)
            if not specifier.startswith("."):
                continue  # bare/URL specifiers are not local layering
            target = (path.parent / specifier).resolve()
            try:
                imported = target.relative_to(REPO_ROOT).as_posix()
            except ValueError:
                continue  # resolves outside the repo; not ours to judge
            imported_layer = layer_of(imported)
            if imported_layer is not None and imported_layer > importer_layer:
                found.append((importer, imported, importer_layer, imported_layer))
    return found


def broken_imports(src_dir):
    """[(importer, specifier)] for every relative import that resolves to no file.

    Layering is what this tool is for, but it has already parsed and resolved every local import,
    so checking that the target exists is free — and the miss it covers is real: moving
    `googleAuth.js` between layers left its own `../../data/...` imports pointing outside `src/`,
    where the layering pass skipped them as "not ours to judge" and reported a clean graph. The
    breakage surfaced two stages later as a Node module-resolution error with no hint of the cause.
    A relative import to nothing is always a defect, so it is cheaper to say so here.
    """
    broken = []
    for path in sorted(src_dir.rglob("*.js")):
        importer = path.relative_to(src_dir.parent).as_posix()
        for match in IMPORT.finditer(path.read_text(encoding="utf-8")):
            specifier = match.group(1)
            if not specifier.startswith("."):
                continue
            if not (path.parent / specifier).resolve().exists():
                broken.append((importer, specifier))
    return broken


def name_of(rank):
    return next(name for name, value in LAYERS.items() if value == rank)


def main():
    found = violations(SRC)
    broken = broken_imports(SRC)

    for importer, imported, importer_layer, imported_layer in found:
        print(
            f"  ✗ {importer} ({name_of(importer_layer)}) imports UP into "
            f"{imported} ({name_of(imported_layer)})"
        )
    for importer, specifier in broken:
        print(f"  ✗ {importer} imports '{specifier}', which resolves to no file")

    if found:
        print(
            f"  ✗ Import layering: {len(found)} upward import(s). Inject the dependency instead "
            "(AGENT_RULES §5.3) — importing up costs the module its independent mountability."
        )
    if broken:
        print(f"  ✗ Import layering: {len(broken)} import(s) resolve to nothing.")
    if found or broken:
        return 1

    print(
        "  ✓ Import layering: no module imports above its own layer, every import resolves."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
