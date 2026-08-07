"""`python -m agent_tools.module_headers` — verify a module that names its own path names the right one.

Why this exists: AGENT_RULES §5.4 makes the first line of every module its self-documentation, and
most modules here open by naming themselves — `// src/domain/sessionClock.js — reconciles …`. That
line is the first thing a reader (or an agent grepping for a file) sees, so when it is wrong it does
not merely fail to help, it actively misdirects toward a directory that has not existed for months.

Nothing checked it, and it rotted exactly as you would expect: by the time this was written, 24 of
~90 modules named a directory the repo no longer has — `components/`, `helper/`, `src/views/` —
including `googleAuth.js`, which still claimed to live in `modules/common/` after the import-layering
gate moved it to `data/`. Every reorganisation makes this worse, because moving a file is what
breaks it and moving a file is also when nobody thinks to look at line 1.

What is checked, and what deliberately is not:

  • A header that OPENS with a path-shaped token (`// some/path/name.js …`) is making a claim about
    where it lives, and that claim must be true — the repo-relative path, `src/…` prefix included.
  • A header that opens with prose (`// Owns the Client create/edit dialog: …`) is making no such
    claim and is left alone. Requiring a path on every module would be a different, more annoying
    rule that buys nothing: those headers are already self-documenting, which is what §5.4 asks for.
  • A path mentioned anywhere OTHER than the first token is a reference to some other module
    (`// Markup-only companion to activeSessionController.js`), not a self-claim, so it is ignored.

Pure file analysis, no network and no browser, so it runs in Stage 1.
Exit code is 1 on a wrong self-path, so it can gate a commit. Auto-fixable with `--fix`.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"

# The first token of a leading line comment, when it looks like a path to a .js file. Anchored at
# the start so only a SELF-claim matches, never a mention of a neighbouring module further along.
SELF_PATH = re.compile(r"^//\s*([\w./-]+\.js)(?=\s|$)")


def claimed_path(source_text):
    """The path a module's first line claims for itself, or None if it opens with prose."""
    first_line = source_text.split("\n", 1)[0]
    match = SELF_PATH.match(first_line)
    return match.group(1) if match else None


def wrong_headers(src_dir):
    """[(repo_relative_path, claimed)] for every module whose self-claimed path is not its own.

    Paths are taken relative to `src_dir.parent` rather than the module-level REPO_ROOT — `src/`
    sits at the repo root by definition, so this is the same answer for the real tree and lets the
    tests run the check over a fixture tree instead of the repo.
    """
    wrong = []
    for path in sorted(src_dir.rglob("*.js")):
        actual = path.relative_to(src_dir.parent).as_posix()
        claimed = claimed_path(path.read_text(encoding="utf-8"))
        if claimed is not None and claimed != actual:
            wrong.append((actual, claimed))
    return wrong


def fix_header(path, actual):
    """Rewrite a module's self-claimed path to its real one, leaving the rest of the line intact."""
    text = path.read_text(encoding="utf-8")
    first_line, separator, rest = text.partition("\n")
    fixed = SELF_PATH.sub(f"// {actual}", first_line, count=1)
    path.write_text(fixed + separator + rest, encoding="utf-8")


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    wrong = wrong_headers(SRC)

    if "--fix" in argv:
        for actual, _claimed in wrong:
            fix_header(REPO_ROOT / actual, actual)
        print(f"  ✓ Module headers: rewrote {len(wrong)} self-path(s).")
        return 0

    for actual, claimed in wrong:
        print(f"  ✗ {actual} calls itself {claimed} (AGENT_RULES §5.4)")

    if wrong:
        print(
            f"  ✗ Module headers: {len(wrong)} module(s) name a path that is not their own. "
            "Run `python -m agent_tools.module_headers --fix`."
        )
        return 1

    print("  ✓ Module headers: every self-named path matches its file.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
