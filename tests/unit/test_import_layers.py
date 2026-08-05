# tests/unit/test_import_layers.py
# The import-layering gate (agent_tools/import_layers.py). It defends the property AGENT_RULES §5.3
# buys with dependency injection — that any module can be mounted on its own, which is what
# tests/medium/ relies on — by refusing an import that points UP a layer. These pin the layer
# resolution and both directions of the verdict; the tool's own main() runs against the real tree
# every Stage 1.

from agent_tools.import_layers import LAYERS, layer_of


def test_layers_are_ordered_bottom_up():
    assert (
        LAYERS["data"]
        < LAYERS["modules/common"]
        < LAYERS["modules"]
        < LAYERS["controllers"]
    )


def test_common_is_resolved_before_the_broader_modules_prefix():
    """`modules/common/` is a lower layer than a feature module, so prefix matching must prefer the
    longer, more specific key — otherwise every shared helper reads as a feature and the rule
    inverts."""
    assert layer_of("src/modules/common/utils.js") == LAYERS["modules/common"]
    assert layer_of("src/modules/history/historyView.js") == LAYERS["modules"]


def test_each_layer_resolves():
    assert layer_of("src/data/stateStore.js") == LAYERS["data"]
    assert layer_of("src/controllers/routerController.js") == LAYERS["controllers"]


def test_the_composition_root_and_leaf_assets_are_unranked():
    """app.js wires every layer together by design, and i18n/sw are leaves — ranking them would
    either flag the composition root for doing its job or invent a layer nobody designed."""
    assert layer_of("src/app.js") is None
    assert layer_of("src/appBoot.js") is None
    assert layer_of("src/i18n/en.js") is None
    assert layer_of("src/sw/precache.js") is None


def test_an_upward_import_is_what_gets_flagged(tmp_path):
    """A view reaching into its controller — the exact inversion this gate was built after finding
    in historyView.js — must be reported, while the reverse direction stays silent."""
    from agent_tools.import_layers import violations

    src = tmp_path / "src"
    (src / "modules" / "history").mkdir(parents=True)
    (src / "controllers").mkdir(parents=True)
    (src / "data").mkdir(parents=True)
    (src / "controllers" / "activeSessionController.js").write_text(
        'import { getState } from "../data/stateStore.js";\n'  # downward: fine
    )
    (src / "data" / "stateStore.js").write_text("export const x = 1;\n")
    (src / "modules" / "history" / "historyView.js").write_text(
        'import { open } from "../../controllers/activeSessionController.js";\n'  # upward: flagged
    )

    import agent_tools.import_layers as mod

    original_root = mod.REPO_ROOT
    mod.REPO_ROOT = tmp_path
    try:
        found = violations(src)
    finally:
        mod.REPO_ROOT = original_root

    assert [(imp, target) for imp, target, _, _ in found] == [
        (
            "src/modules/history/historyView.js",
            "src/controllers/activeSessionController.js",
        )
    ]


def test_a_relative_import_that_resolves_to_nothing_is_reported(tmp_path):
    """The miss that prompted this check: moving a file between layers left its own relative
    imports pointing outside src/, where the layering pass skipped them as out-of-scope and
    reported a clean graph — the breakage only surfaced later as a Node resolution error."""
    from agent_tools.import_layers import broken_imports

    src = tmp_path / "src"
    (src / "data").mkdir(parents=True)
    (src / "data" / "real.js").write_text("export const x = 1;\n")
    (src / "data" / "mover.js").write_text(
        'import { x } from "./real.js";\n'  # resolves
        'import { y } from "../../data/gone.js";\n'  # escapes the tree entirely
    )

    assert broken_imports(src) == [("src/data/mover.js", "../../data/gone.js")]
