"""`python -m agent_tools.todo_hygiene` — keep TODO.md to OPEN work only.

Why this exists: TODO.md is read by every agent that needs the reasoning behind a decision, and it
reached 5,406 lines with 2,542 of them under sections that were already closed — shipped, decided,
superseded. Nobody removed them, because nothing failed when they stayed. The lines were paid for on
every read, by every agent, forever.

So the rule the file's own preamble always stated is now a check: **a closed section keeps its
heading and a pointer, not its body.** The body moves to TODO_ARCHIVE.md, whole — this is not a
deletion tool and nothing here rewards throwing reasoning away. The heading stays behind so a
`§N.M` reference from code, a test or another document still lands somewhere.

Two checks, pure file analysis:

  1. **A closed heading holds at most `MAX_STUB_LINES` lines of body**, and one of them links
     TODO_ARCHIVE.md — a stub that points nowhere is a dead end wearing a signpost.
  2. **Every archived section is stubbed in TODO.md**, so moving a section out cannot silently
     break every `§N.M` that named it.

Exit code is 1 when anything fails, so it can gate a commit.
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TODO = REPO_ROOT / "TODO.md"
ARCHIVE = REPO_ROOT / "TODO_ARCHIVE.md"

# What marks a section closed. `[~]` is deliberately absent: partial work is open work, and its
# reasoning is what the next person needs in front of them.
CLOSED_MARKER = re.compile(r"\[x\]|\[CLOSED|\[RESOLVED|\[Superseded|\[Decided, CLOSED")
HEADING = re.compile(r"^(#{2,3}) (.*)$")
# A stub is a heading, a blank line, and a sentence saying where the reasoning went. Four is that
# with room to breathe; a fifth line is a body starting to grow back.
MAX_STUB_LINES = 4


def sections(text):
    """Every `##`/`###` heading with its body, as `(line_no, level, title, body_lines)`."""
    lines = text.split("\n")
    heads = [
        (i, len(m.group(1)), m.group(2))
        for i, line in enumerate(lines)
        if (m := HEADING.match(line))
    ]
    for k, (i, level, title) in enumerate(heads):
        end = next((h[0] for h in heads[k + 1 :] if h[1] <= level), len(lines))
        yield i + 1, level, title, lines[i + 1 : end]


def check():
    """Report every closed section still carrying a body, and every archived section with no stub.

    Returns findings as `path:line  message` strings — the shape every check here prints.
    """
    findings = []
    todo_text = TODO.read_text()
    archive_text = ARCHIVE.read_text() if ARCHIVE.exists() else ""

    stubbed = set()
    for line_no, _level, title, body in sections(todo_text):
        if not CLOSED_MARKER.search(title):
            continue
        stubbed.add(title.strip())
        # Only the section's OWN body counts. A closed parent may still hold subsections that are
        # open ([ ] or [~]) — those are live work sitting under a done heading, and moving them to
        # the archive would file them where nobody looks. A closed child, though, is body.
        own_body = []
        for line in body:
            if (m := HEADING.match(line)) and m.group(1) == "###":
                if re.search(r"\[ \]|\[~\]", m.group(2)):
                    break
                findings.append(
                    f"TODO.md:{line_no}  closed section keeps a closed subsection: {m.group(2)[:60]}"
                )
                break
            own_body.append(line)
        content = [line for line in own_body if line.strip() and line.strip() != "---"]
        if len(content) > MAX_STUB_LINES:
            findings.append(
                f"TODO.md:{line_no}  closed section keeps {len(content)} lines of body — "
                f"move them to TODO_ARCHIVE.md and leave the pointer: {title[:60]}"
            )
        elif content and not any("TODO_ARCHIVE.md" in line for line in content):
            findings.append(
                f"TODO.md:{line_no}  closed section's stub names no archive entry: {title[:60]}"
            )

    # The stub sits at the level that LEFT the file: a closed `## 38.` covers its whole subtree,
    # so `### 38.4` needs no stub of its own. Requiring one per child would put ninety pointers
    # back into the file this check exists to keep short.
    for line_no, level, title, _body in sections(archive_text):
        if level == 2 and title.strip() not in stubbed:
            findings.append(
                f"TODO_ARCHIVE.md:{line_no}  archived section has no stub in TODO.md, so every "
                f"§ reference to it now dead-ends: {title[:60]}"
            )
    return findings


def main():
    findings = check()
    for finding in findings:
        print(f"  {finding}")
    if findings:
        print(
            f"\n  ✗ TODO hygiene: {len(findings)} closed section(s) still cost every reader."
        )
        return 1
    todo_lines = len(TODO.read_text().split("\n"))
    print(f"  ✓ TODO hygiene: {todo_lines} lines, all of them open work.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
