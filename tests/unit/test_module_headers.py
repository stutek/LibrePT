# tests/unit/test_module_headers.py
# The module self-path gate (agent_tools/module_headers.py). The whole design rests on one
# distinction: a header that OPENS with a path is claiming where it lives, and a header that
# mentions a path anywhere else is talking about a different module. Getting that wrong in either
# direction ruins the check — too strict and it demands a path on modules that document themselves
# perfectly well in prose; too loose and it "fixes" a reference to a neighbour.
# The real repo is deliberately NOT touched here: the tool's own main() runs against it every
# Stage 1.

from agent_tools.module_headers import claimed_path, fix_header, wrong_headers


def test_a_leading_path_is_read_as_a_self_claim():
    assert claimed_path("// src/domain/sessionClock.js\nexport const x = 1;\n") == (
        "src/domain/sessionClock.js"
    )
    # The common form: path, then an em-dash and the module's purpose.
    assert claimed_path("// src/data/recordId.js — the identity primitive.\n") == (
        "src/data/recordId.js"
    )
    # A hyphen separator is equally common in this repo and must not be swallowed into the path.
    assert claimed_path("// src/modules/common/dom.js - DOM helpers\n") == (
        "src/modules/common/dom.js"
    )


def test_prose_headers_make_no_claim_and_are_left_alone():
    """Requiring a path everywhere would be a different, more annoying rule that buys nothing."""
    assert (
        claimed_path(
            "// Owns the Client create/edit dialog: its markup and its wiring.\n"
        )
        is None
    )
    assert (
        claimed_path("// English (en) translations — a flat key -> string map.\n")
        is None
    )
    assert claimed_path("export const x = 1;\n") is None
    assert claimed_path("") is None


def test_a_path_mentioned_after_the_first_token_is_a_reference_not_a_claim():
    """`// Markup-only companion to activeSessionController.js` describes a NEIGHBOUR."""
    assert (
        claimed_path(
            "// Markup-only companion to activeSessionController.js — shells.\n"
        )
        is None
    )


def test_only_a_mismatched_self_claim_is_reported(tmp_path):
    src = tmp_path / "src"
    (src / "modules" / "common").mkdir(parents=True)
    (src / "domain").mkdir(parents=True)

    honest = src / "domain" / "good.js"
    honest.write_text("// src/domain/good.js — says where it is.\n", encoding="utf-8")
    stale = src / "modules" / "common" / "moved.js"
    stale.write_text("// components/moved.js — moved long ago.\n", encoding="utf-8")
    prose = src / "domain" / "prose.js"
    prose.write_text("// Describes itself without naming a path.\n", encoding="utf-8")

    assert wrong_headers(src) == [
        ("src/modules/common/moved.js", "components/moved.js")
    ], "only the stale claim is reported — the honest one and the prose one are silent"


def test_fixing_rewrites_only_the_path_and_keeps_the_sentence(tmp_path):
    module = tmp_path / "moved.js"
    module.write_text(
        "// components/moved.js — the rest of this line must survive.\n"
        "import { a } from './a.js';\n",
        encoding="utf-8",
    )

    fix_header(module, "src/modules/clipboard/moved.js")

    assert module.read_text(encoding="utf-8") == (
        "// src/modules/clipboard/moved.js — the rest of this line must survive.\n"
        "import { a } from './a.js';\n"
    )
