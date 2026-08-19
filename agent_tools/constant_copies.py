"""`python -m agent_tools.constant_copies` — a declared constant's value must appear only once.

Why this exists (TODO §28.3): `a9cad18` centralised the dev-server port after its value had been
written out in six places, and `70aaec0` did the same for the Python version after thirteen.
Both were found by a person noticing, which is not a strategy. The failure is silent by construction:
every copy is correct on the day it is written and the repository keeps working after the declaration
changes, so nothing fails until someone reads a stale value and believes it.

**It inverts the obvious design, deliberately.** The natural check is "no hardcoded ports anywhere",
which needs an ever-growing exemption list — and an ignore file is where findings go to disappear
. This asserts the opposite: for each constant the repository has DECLARED as
shared, its literal appears only at that declaration. The list grows only when someone declares a
shared constant, which is exactly when the protection is wanted, and it needs no exemptions because
an undeclared value is simply not its business.

It therefore catches RE-INTRODUCTION, not first introduction. The first copy of a new value is a
judgement call a reader has to make; the second copy of a value already declared is mechanical.

**Not a gate, on purpose**: a tool an agent runs by hand costs
nothing but the writing, while a Stage 1 task costs every commit forever and acquires a second job —
being maintained — before anyone knows whether it earns one. Run it in the duplication sweep. If it
catches something more than once, it earns a gate task, a CI job and a catalog row.

**Comments and docstrings count** (TODO §28.1, decided by the maintainer): *"if we ever change the
port or domain, we want to change in one place not 100s"*. A comment quoting a port number is a copy
like any other — it goes stale silently, and the next reader believes it. Prose names the constant.

Three kinds of file are deliberately NOT scanned, and none is an allowlist of unfixed findings:

  * `TODO.md` and `CHANGELOG.md` are historical records. "the port appeared in six places, and here
    they were" is a true statement about the past, and rewriting it would falsify the record.
  * Generated and vendored trees (`dist/`, `.venv/`, `.build-reports/`) are outputs, not sources.
  * The pages `render_docs.py` generates. A value SUBSTITUTED INTO an output is the mechanism working,
    not a copy — the copy would be in the Markdown source, which is scanned. The generated set is read
    from the renderer's own table rather than listed again here, or this tool would hold the very kind
    of duplicate it exists to find.

Injected dependencies: none — a filesystem tool.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent

# Where each tracked constant is declared, and how to read its value out of that file. A row is
# (name, declaring file, pattern whose first group is the literal). Adding a row is the whole cost of
# protecting a new shared constant.
#
# The Python version is deliberately absent: `agent_tools/python_version.py` already gates it, and
# two checkers on one fact is the duplication this tool exists to complain about.
#
# `DEV_SERVER_BASE_PATH` is absent for a different reason, worth stating so nobody adds it back: its
# value is the repository's own name, so the literal matches every absolute path on the maintainer's
# disk and every link into the GitHub repo. A constant whose value collides with unrelated text is
# not trackable this way, and a check that cries wolf is one nobody runs.
DECLARATIONS = (
    ("DEV_SERVER_PORT", "deploy/local_http_server.py", r"^DEV_SERVER_PORT\s*=\s*(\d+)"),
    (
        "PUBLIC_SITE_URL",
        "src/data/publicUrls.js",
        r"^export const PUBLIC_SITE_URL = \"([^\"]+)\"",
    ),
    (
        "ISSUE_TRACKER_URL",
        "src/data/publicUrls.js",
        r"^export const ISSUE_TRACKER_URL = \"([^\"]+)\"",
    ),
)

SCANNED_SUFFIXES = (
    ".py",
    ".js",
    ".mjs",
    ".css",
    ".html",
    ".md",
    ".yml",
    ".yaml",
    ".json",
)

SKIPPED_DIRECTORIES = {
    ".git",
    ".venv",
    "dist",
    "node_modules",
    ".build-reports",
    "__pycache__",
    ".private",
    # Agent-tool configuration, gitignored and machine-local — not this repository's source.
    ".claude",
    ".gemini",
    ".agents",
}

# Records of what happened, not instructions to follow — see the module docstring.
HISTORICAL_FILES = {"TODO.md", "CHANGELOG.md"}


def declared_values():
    """Every tracked constant as `(name, declaring path, literal)`, read from its declaration.

    A declaration that cannot be found is a failure rather than a skip: a row here naming a constant
    the repository no longer declares means this tool is quietly protecting nothing.
    """
    resolved = []
    for name, relative_path, pattern in DECLARATIONS:
        path = REPO_ROOT / relative_path
        if not path.exists():
            raise SystemExit(
                f"constant_copies: {relative_path} does not exist (declares {name})"
            )
        match = re.search(pattern, path.read_text(encoding="utf-8"), re.M)
        if not match:
            raise SystemExit(
                f"constant_copies: no declaration of {name} in {relative_path}"
            )
        resolved.append((name, relative_path, match.group(1)))
    return resolved


def generated_pages():
    """The pages render_docs.py writes, as repository-relative paths.

    Imported lazily and from the renderer's own table: naming them here would be a second copy of a
    list, which is the failure this tool is about.
    """
    from agent_tools.render_docs import DOCUMENTS

    return {pathlib.Path(generated) for _, generated, *_ in DOCUMENTS}


def scanned_files():
    """Every source file worth reading, relative to the repository root."""
    generated = generated_pages()
    for path in sorted(REPO_ROOT.rglob("*")):
        if not path.is_file() or path.suffix not in SCANNED_SUFFIXES:
            continue
        relative = path.relative_to(REPO_ROOT)
        if set(relative.parts) & SKIPPED_DIRECTORIES:
            continue
        if relative.name in HISTORICAL_FILES or relative in generated:
            continue
        yield relative


def copies_of(name, declaring_path, literal, files):
    """Every occurrence of `literal` outside its own declaration, as `(path, line number, text)`.

    The declaring file is scanned too — a value written once at the top and then repeated in that
    same file's docstring is the exact shape `deploy/local_http_server.py` had. Only lines that
    mention the constant's NAME are exempt there, since those are the declaration and the places
    already doing the right thing.
    """
    found = []
    for relative in files:
        for number, line in enumerate(
            (REPO_ROOT / relative).read_text(encoding="utf-8").splitlines(), start=1
        ):
            if literal not in line:
                continue
            if name in line:
                continue
            found.append((relative, number, line.strip()))
    return found


def main():
    files = list(scanned_files())
    findings = []
    for name, declaring_path, literal in declared_values():
        for relative, number, line in copies_of(name, declaring_path, literal, files):
            findings.append((name, literal, relative, number, line))

    if findings:
        print(
            f"\n  ✗ Constant copies: {len(findings)} literal(s) written out instead of named\n"
        )
        for name, literal, relative, number, line in findings:
            excerpt = line if len(line) <= 96 else f"{line[:93]}…"
            print(f"    {relative}:{number}  {literal!r} — say {name}")
            print(f"      {excerpt}")
        print(
            "\n    Import the constant, or name it in the prose. A written-out value is a copy"
        )
        print(
            "    that goes stale silently, and the next reader believes it (TODO §28.1)."
        )
        return 1

    print(
        f"  ✓ Constant copies: {len(DECLARATIONS)} declared constant(s), each written once, "
        f"across {len(files)} file(s)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
