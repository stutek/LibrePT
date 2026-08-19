"""`python -m agent_tools.doclinks` — verify the OKF knowledge graph actually connects.

Why this exists: cross-document Markdown links are load-bearing here — agents traverse
them to find context. Nothing enforced them, so a renumbered or deleted section left dangling `§N.M`
references and dead `(#anchor)` links behind, silently, and the next agent followed them into
nothing. Dropping TODO §16's multi-version hosting items (2026-07-27) produced fourteen such
references in one edit; they were found by hand-grepping, which is exactly the work this replaces.

Three checks, all pure file analysis (no network, no browser):

  1. **File links** — every relative `[label](path)` resolves to a file that exists.
  2. **Anchors** — every `(#frag)` / `(path.md#frag)` resolves to a heading in the target file,
     using GitHub's slug rules.
  3. **Section references** — every `§N.M` resolves to a numbered heading. Only references whose
     document is actually named are checked (`TODO §16.3`, `[PRIVACY.md](PRIVACY.md) §3.2`,
     `[… §18.6](../TODO.md)`), plus every `§` inside TODO.md, which means TODO.md. Unqualified
     prose elsewhere is ambiguous and deliberately left alone — guessing there produced only noise.

Exit code is 1 when anything is unresolved, so it can gate a commit.
"""

import difflib
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# A link that leaves the repository, so there is no file to resolve. `{{NAME}}` counts: a document
# rendered by agent_tools/render_docs.py names an address rather than writing it out (TODO §28.2), and
# every placeholder resolves to an absolute URL at render time — checking it as a relative path here
# would report the mechanism working as a dead link.
EXTERNAL_LINK = re.compile(r"^(https?:|mailto:|tel:|data:|//|\{\{[A-Z_]+\}\})")
MD_LINK = re.compile(r"\[([^\]]*)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
FENCE = re.compile(r"^\s*(```|~~~)")
# Only the numeric part of a §-reference is resolved — "§2.D.2" checks "§2", because sub-item
# lettering is not a heading in any of these documents.
SECTION_REF = re.compile(r"§\s*(\d+(?:\.\d+)*)")
# A bare document name qualifying the § that follows it: "TODO §16.3", "UC6 §6".
DOC_QUALIFIER = re.compile(r"\b([A-Za-z][A-Za-z0-9_]*)(?:\.md)?[\s,]*$")
# A heading that opens a numbered section: "## 16. Deploy safety", "### 16.3 [ ] Key storage…".
NUMBERED_HEADING = re.compile(r"^(\d+(?:\.\d+)*)\s*[.:)]?\s")
# A top-level ordered-list item: "5. **No personal data in a path.**"
ORDERED_ITEM = re.compile(r"^(\d+)[.)]\s")
# How far back a preceding link may sit and still be read as naming the document a § points into.
QUALIFIER_REACH = 4


def tracked_markdown_files():
    """Git-tracked *.md only: untracked scratch notes are not part of the knowledge graph."""
    out = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "ls-files", "*.md"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    return [REPO_ROOT / line for line in out.splitlines() if line]


def slugify(heading_text):
    """GitHub's anchor rules: lowercase, strip formatting, drop punctuation, spaces to hyphens."""
    text = re.sub(r"<[^>]+>", "", heading_text)  # inline HTML
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)  # links keep their label
    # Code/emphasis marks vanish — but NOT `_`, which GitHub keeps in the slug because it is a word
    # character. Stripping it silently broke every anchor into a heading holding a file name.
    text = re.sub(r"[`*~]", "", text)
    text = text.strip().lower()
    text = re.sub(r"[^\w\s-]", "", text)  # punctuation vanishes, including §
    return normalize_anchor(re.sub(r"\s", "-", text))


def normalize_anchor(fragment):
    """Collapse hyphen runs before comparing.

    Deliberately looser than GitHub's slugger. A heading like `### 16.3 [ ] [Decided] Key storage`
    drops three punctuation marks and leaves a run of spaces, and whether that lands as `--` or
    `---` is a detail of which renderer you ask. This tool's job is catching dead ends — a fragment
    naming a section that no longer exists — not adjudicating hyphen counts, and being strict there
    would fail the build over links that resolve perfectly well.
    """
    return re.sub(r"-{2,}", "-", fragment.lower())


def parse_headings(path):
    """Return (anchors, section_numbers, list_item_refs), ignoring anything inside a code fence.

    `list_item_refs` holds "N.M" for every ordered-list item M written directly under section N —
    the evidence that lets a §N.M reference name a numbered *item* rather than a heading.
    """
    anchors, sections, list_items, seen = set(), set(), set(), {}
    in_fence, current = False, None
    for line in path.read_text(encoding="utf-8").splitlines():
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = HEADING.match(line)
        if m:
            text = m.group(2)
            slug = slugify(text)
            # GitHub disambiguates repeated headings with -1, -2, … Keep both forms resolvable.
            count = seen.get(slug, 0)
            seen[slug] = count + 1
            anchors.add(slug)
            if count:
                anchors.add(normalize_anchor(f"{slug}-{count}"))
            num = NUMBERED_HEADING.match(text)
            current = num.group(1) if num else None
            if num:
                sections.add(current)
            continue
        item = ORDERED_ITEM.match(line)
        if item and current:
            list_items.add(f"{current}.{item.group(1)}")
    return anchors, sections, list_items


def strip_code(text):
    """Blank out fenced blocks and inline code so examples are not mistaken for references."""
    out, in_fence = [], False
    for line in text.splitlines():
        if FENCE.match(line):
            in_fence = not in_fence
            out.append("")
            continue
        out.append("" if in_fence else re.sub(r"`[^`]*`", "", line))
    return "\n".join(out)


def resolve_doc(name, all_files):
    """Map a reference's document name ('TODO', 'DATA_MODEL', 'UC6') to a tracked file.

    Exact stem first, then a case-insensitive prefix ('UC6' → uc6_exercise_taxonomy_and_picker.md).
    An ambiguous name resolves to nothing rather than to a guess.
    """
    exact = [p for p in all_files if p.stem == name]
    if len(exact) == 1:
        return exact[0]
    prefixed = [p for p in all_files if p.stem.lower().startswith(name.lower())]
    return prefixed[0] if len(prefixed) == 1 else None


def qualifier_for(line, ref_start, links, path, all_files):
    """Which document does a § on this line point into? None means 'ambiguous — do not check'.

    A §-reference is only resolvable when the prose actually names its document. Three ways it can:
    the § sits inside a link label pointing at a .md file (`[§16 in TODO.md](../TODO.md)`), a link to
    a .md file ends just before it (`[PRIVACY.md](PRIVACY.md) §3.2`), or a bare document name
    precedes it (`TODO §16.3`). Inside TODO.md an unqualified § means TODO.md — that file is the one
    whose renumbering strands references, and the reason this check exists.
    """
    for start, end, label_end, target in links:
        md_target = (path.parent / target.partition("#")[0]).resolve()
        if md_target.suffix != ".md" or not md_target.exists():
            continue
        inside_label = start < ref_start < label_end
        just_before = 0 <= ref_start - end <= QUALIFIER_REACH
        if inside_label or just_before:
            return md_target

    name = DOC_QUALIFIER.search(line[:ref_start])
    if name:
        resolved = resolve_doc(name.group(1), all_files)
        if resolved is not None:
            return resolved

    return path if path.name == "TODO.md" else None


def nearest(fragment, anchors):
    """The closest surviving anchor, when there is an obvious one.

    A heading picks up an `[x]` or a `— SHIPPED <date>` suffix far more often than it is deleted, so
    a dead anchor is usually one edit away from the right one. Naming that candidate is what turns a
    failing check into a fix.
    """
    close = difflib.get_close_matches(fragment, sorted(anchors), n=1, cutoff=0.75)
    return close[0] if close else None


def anchors_of(path, cache):
    if path not in cache:
        cache[path] = parse_headings(path)
    return cache[path][0]


def sections_of(path, cache):
    if path not in cache:
        cache[path] = parse_headings(path)
    return cache[path][1]


def list_items_of(path, cache):
    if path not in cache:
        cache[path] = parse_headings(path)
    return cache[path][2]


def display_path(path):
    """Repo-relative when it can be — a path outside the repo is shown whole rather than crashing."""
    try:
        return path.relative_to(REPO_ROOT)
    except ValueError:
        return path


def _extract_line_links(line):
    return [
        (m.start(), m.end(), m.start(1) + len(m.group(1)), m.group(2))
        for m in MD_LINK.finditer(line)
    ]


def _check_link_targets(links, path, rel, number, cache):
    findings = []
    for _, _, _, target in links:
        if EXTERNAL_LINK.match(target) or target.startswith("#!"):
            continue
        file_part, _, fragment = target.partition("#")
        resolved = (path.parent / file_part).resolve() if file_part else path
        if file_part and not resolved.exists():
            findings.append((rel, number, f"dead link → {file_part}"))
            continue
        if fragment and resolved.suffix == ".md":
            anchors = anchors_of(resolved, cache)
            if normalize_anchor(fragment) not in anchors:
                near = nearest(normalize_anchor(fragment), anchors)
                hint = f"  (did you mean #{near}?)" if near else ""
                findings.append((rel, number, f"dead anchor → #{fragment}{hint}"))
    return findings


def _check_section_refs(line, links, path, rel, number, cache, all_files):
    findings = []
    for match in SECTION_REF.finditer(line):
        target_path = qualifier_for(line, match.start(), links, path, all_files)
        if target_path is None:
            continue  # prose that names no document — ambiguous, not this tool's business
        sections = sections_of(target_path, cache)
        section = match.group(1)
        if not sections or section in sections:
            continue
        # A reference to a whole section ("§18") is satisfied by any of its sub-items.
        if any(s.startswith(section + ".") for s in sections):
            continue
        # A §N.M may name a numbered *item* rather than a heading — ROUTING.md numbers its
        # invariants as a list inside "## 5", so "§5.5" is item 5 of section 5. Accept that only
        # on evidence: the parent section exists, publishes no sub-headings of its own, and
        # really does carry an item with that number. Anything looser would swallow the very
        # thing this check is for — a §16.2 left behind when section 16.2 was deleted.
        parent, _, item = section.rpartition(".")
        parent_has_subheadings = any(s.startswith(parent + ".") for s in sections)
        if (
            parent in sections
            and not parent_has_subheadings
            and section in list_items_of(target_path, cache)
        ):
            continue
        where = "" if target_path == path else f"{target_path.name} "
        findings.append((rel, number, f"dangling ref → {where}§{section}"))
    return findings


# The agent rules are for AGENT consumption only. Any other document that mentions them has made the
# rulebook a dependency of itself: rewording or reordering a rule then reaches files that describe
# behaviour, requirements or work — measured once at 87 source and test files. A document states its
# own requirement instead.
RULE_MENTION = re.compile(r"AGENT_RULES")
# The only files that may name it: the three loaders an agent reads on arrival, the two document maps
# that catalogue every file in the repository, and the contributor onboarding note. All of them POINT
# at the rules; none of them leans on one.
RULE_POINTERS = {
    "AGENT_RULES.md",
    "CLAUDE.md",
    "GEMINI.md",
    "AGENTS.md",
    "INDEX.md",
    "README.md",
    "CONTRIBUTING.md",
}


def _check_rule_citations(line, path, rel, number):
    """The rules are read by agents, never referenced by documents — see RULE_MENTION."""
    if path.name in RULE_POINTERS or not RULE_MENTION.search(line):
        return []
    return [
        (
            rel,
            number,
            "mentions the agent rules — state the requirement itself instead, so this file does "
            "not depend on how the rules are worded or ordered",
        )
    ]


# Inside AGENT_RULES.md a bare "see §4.2" means a rule, and a rule's number is a position that
# changes whenever the order does. A § qualified by ANOTHER document (`TODO §6.4`) is that
# document's own numbering and is fine: the rules file may point outward, just not at itself.
SELF_RULE_REF = re.compile(r"(?<![\w./])§\s*\d")
QUALIFIED_REF = re.compile(r"(?<![\w./])(?!AGENT_RULES\b)[\w./]+ §\s*\d")


def _check_self_rule_refs(line, path, rel, number):
    if path.name != "AGENT_RULES.md":
        return []
    if not SELF_RULE_REF.search(QUALIFIED_REF.sub("", line)):
        return []
    return [
        (
            rel,
            number,
            "refers to one of its own rules by number — name it, so the rules can be reordered "
            "by importance without rewriting the references to them",
        )
    ]


def check_file(path, cache, all_files):
    findings = []
    rel = display_path(path)

    for number, line in enumerate(
        strip_code(path.read_text(encoding="utf-8")).splitlines(), 1
    ):
        links = _extract_line_links(line)
        findings.extend(_check_link_targets(links, path, rel, number, cache))
        findings.extend(
            _check_section_refs(line, links, path, rel, number, cache, all_files)
        )
        findings.extend(_check_rule_citations(line, path, rel, number))
        findings.extend(_check_self_rule_refs(line, path, rel, number))

    return findings


def main():
    files = tracked_markdown_files()
    cache = {}
    findings = []
    for path in files:
        findings.extend(check_file(path, cache, files))

    if findings:
        print(f"\n  ✗ Doc graph: {len(findings)} unresolved reference(s)\n")
        for rel, line, message in sorted(findings, key=lambda f: (str(f[0]), f[1])):
            print(f"    {rel}:{line}  {message}")
        print(
            "\n    Fix the reference or the heading — a broken link is a dead end for the"
        )
        print("    next agent traversing the knowledge graph.")
        return 1

    print(
        f"  ✓ Doc graph: {len(files)} markdown files, every link and §-reference resolves."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
