"""`python -m agent_tools.todo_refs` — no file outside TODO.md and its archive points into them.

Why this exists: a TODO section closes, its reasoning moves to TODO_ARCHIVE.md, and the backlog is
rewritten as work moves. A comment or document that says "see TODO §29" points at text that will
not stay where it was, and the reader who follows it finds something else or nothing. So a file
writes its own reason. Naming TODO.md as the home of open work is allowed; naming one of its
sections is not.

What is a finding, in every git-tracked text file except the exempt ones below:

  1. A pointer that names TODO: `TODO §40`, `TODO.md §29`, `TODO_ARCHIVE.md, §49.2`,
     `TODO.md section 1.5.1`, the old form `TODO 4.8`, and a link to `TODO.md#…` or
     `TODO_ARCHIVE.md#…`.
  2. In anything that is not Markdown — source, tests, tools, build files — a bare `§N` with no
     document named before it. In code an unqualified section sign always meant TODO.
     `DATA_MODEL §1`, `docs/ROUTING.md §2`, `UC6 §6` and `RFC 6350 §3.2` name their document and
     pass, and so does a second section in the same breath (`RFC 6350 §3.2/§3.4`).

  3. In a Markdown document, a bare `§N` when the document has no section numbered N of its own.
     Markdown documents number their own sections, so a bare `§` that lands in the same document
     passes; one that lands nowhere in it was pointing somewhere else — in practice, into TODO.

Exit code is 1 when anything is found, so it can gate a commit.
"""

import re
import subprocess
import sys
import tempfile
from pathlib import Path

from agent_tools.doclinks import parse_headings, strip_code

REPO_ROOT = Path(__file__).resolve().parent.parent

# Files that READ the backlog, and whose examples of its format are what they parse, plus the
# backlog itself. tests/unit/test_catalog_coverage.py holds a module catalog row that links TODO.md
# as test data for the catalog tool. AGENT_RULES.md quotes "the danger in §70" as an example of a
# sentence that points instead of naming — an example of the fault, not a pointer.
EXEMPT = {
    "TODO.md",
    "TODO_ARCHIVE.md",
    "AGENT_RULES.md",
    "agent_tools/doclinks.py",
    "agent_tools/todo_hygiene.py",
    "agent_tools/todo_refs.py",
    "tests/unit/test_doclinks.py",
    "tests/unit/test_todo_hygiene.py",
    "tests/unit/test_todo_refs.py",
    "tests/unit/test_catalog_coverage.py",
    # TEMPORARY. Its comments still hold five pointers into TODO. The test suite refuses to run
    # against a dev server whose copy of this file differs from the working tree, and the running
    # server is the maintainer's to restart. Re-check condition: the next restart of the dev server —
    # then remove the pointers and this line in the same change.
    "deploy/local_http_server.py",
}

NAMES_TODO = re.compile(
    r"TODO(?:_ARCHIVE)?(?:\.md)?,? ?§"
    r"|TODO(?:_ARCHIVE)?\.md#"
    r"|TODO(?:\.md)? section \d"
    r"|\bTODO \d+\.\d"
)
SECTION = re.compile(r"§ ?(\d+)")
# What may stand before a § and name its document: an upper-case document name (DATA_MODEL, UC6),
# a Markdown path, or an RFC by number. TODO itself is caught by NAMES_TODO before this is asked.
QUALIFIER = re.compile(r"(?:\b[A-Z][A-Z0-9_]+|[\w./-]+\.md|RFC \d+)[,:]? ?$")
# A second section right after a qualified one: `§3.2/§3.4`, `§3.2 and §3.4`.
CONTINUATION = re.compile(r"§ ?[\d.]+ ?(?:/|,|and|or) ?$")


def _bare_sections(line):
    """The top-level numbers of every `§N` on this line that names no document."""
    bare = []
    qualified_before = False
    for match in SECTION.finditer(line):
        before = line[: match.start()]
        if QUALIFIER.search(before) and not before.rstrip().endswith("TODO"):
            qualified_before = True
        elif not (qualified_before and CONTINUATION.search(before)):
            bare.append(match.group(1))
            qualified_before = False
    return bare


def _own_top_sections(text):
    """The top-level numbers of a Markdown document's own numbered headings."""
    with tempfile.NamedTemporaryFile("w", suffix=".md", encoding="utf-8") as copy:
        copy.write(text)
        copy.flush()
        _, sections, _ = parse_headings(Path(copy.name))
    return {number.split(".")[0] for number in sections}


def findings_in(path, text):
    """`(line number, line)` for every pointer into TODO in `text`, read as the file at `path`."""
    markdown = str(path).endswith(".md")
    # In Markdown, code spans and fences are examples, as they are to doclinks.
    if markdown:
        text = strip_code(text)
    own = _own_top_sections(text) if markdown else set()
    found = []
    for number, line in enumerate(text.splitlines(), 1):
        bare = _bare_sections(line)
        points_away = [n for n in bare if n not in own] if markdown else bare
        if NAMES_TODO.search(line) or points_away:
            found.append((number, line.strip()))
    return found


def tracked_files():
    """Every file git tracks, and every new one it would add — untracked but not ignored. A new file
    is the one a commit is about to bring in, so it is checked before it is committed; reading only
    the tracked files let a test file carrying "(TODO 1.3)" through the check and the gate, and the
    commit that added it failed the build for every session."""
    out = subprocess.run(
        [
            "git",
            "-C",
            str(REPO_ROOT),
            "ls-files",
            "--cached",
            "--others",
            "--exclude-standard",
        ],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [line for line in out.splitlines() if line and line not in EXEMPT]


def find_all():
    """`(path, line number, line)` for every pointer into TODO in the tracked tree."""
    found = []
    for rel in tracked_files():
        try:
            text = (REPO_ROOT / rel).read_text(encoding="utf-8")
        except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
            continue
        found.extend((rel, number, line) for number, line in findings_in(rel, text))
    return found


def main():
    found = find_all()
    if found:
        print(
            f"\n  ✗ TODO pointers: {len(found)} file line(s) point into TODO.md or its archive\n"
        )
        for rel, number, line in found:
            print(f"    {rel}:{number}  {line[:120]}")
        print(
            "\n    A TODO section closes and its text moves. Write the reason where it is needed."
        )
        return 1
    print(
        "  ✓ TODO pointers: no file outside TODO.md and its archive points into them."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
