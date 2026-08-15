"""`python -m agent_tools.render_docs` — renders user-facing Markdown into shipped HTML pages.

Why this exists: five links in the running app point at `github.com` — the privacy policy, the
PREVIEW data-loss notice, the bug-reporting guide, and the client consent templates a trainer hands
to a gym client. Every one of them targets someone who will never have a GitHub account, lands them
on a developer site with a "Sign in" header, and **fails entirely offline** — in a basement gym with
no signal, tapping "Privacy" gets nothing. That last part is a real defect in an offline-first app,
independent of anything Google asks for.

It is also a hard requirement for OAuth verification: Google demands the privacy policy live on a
domain we can prove we own, and `github.com` is not one (see `docs/GOOGLE_CLOUD_SETUP.md`).

**The Markdown stays canonical and stays where it is.** AGENT_RULES §5.6 forbids documentation under
`src/` because `run_build` copies that tree wholesale into `dist/`. That rule is about agent-facing
knowledge files shipping by accident; here shipping is the entire point, so the resolution is to keep
every source `.md` in the doc graph (still gated by `doclinks`) and generate the HTML from it. One
source of truth, no drift — which matters more for a legal policy than for anything else in the
repo, because the version Google reviewed and the version we edited must never diverge.

**Output goes to `src/`, not `dist/`, and is committed.** The dev server serves `src/` directly
(`deploy/local_http_server.py`) and `run_build` copies it, so a page emitted only into `dist/` would
be invisible to local development and to every browser test. Committing generated output is the
lesser evil, and `--check` makes it honest: the Stage 1 gate re-renders and fails on any drift, the
same shape as a formatter check.

**Security posture** — these pages ship to production and are hashed into the integrity catalog, so
the renderer is configured for the narrowest possible output rather than the most featureful:

  * `html=False` — raw HTML in a source document is ESCAPED, never passed through. No document can
    inject markup into a shipped page. Passed explicitly rather than relying on a preset default,
    because markdown-it's `commonmark` preset enables HTML and a future version bump must not
    silently turn it back on. Pinned by a test.
  * markdown-it's own link validation neutralises `javascript:` and other dangerous schemes. Also
    pinned by a test.
  * The page shell carries `default-src 'none'` and loads no scripts at all — these are documents,
    so nothing but stylesheet and image loads are permitted, which is stricter than the app's own
    CSP can be.

Injected dependencies: none — a filesystem tool. `markdown_it` is imported at module level here but
`build/` imports THIS module lazily, inside its check function, so `import build` stays reachable
from the bare-system-Python CI jobs that install nothing (tests/unit/test_ci_bare_python.py).
"""

import html
import pathlib
import re
import sys

import yaml
from markdown_it import MarkdownIt

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent

# (source Markdown, generated page, <title>). Adding a row is all it takes to ship another document;
# the gate then keeps it in sync forever. Deliberately NOT every doc in the repo — README,
# DATA_MODEL, ROUTING, SRC_MODULES, use_cases and the INDEX files are developer-facing, and GitHub
# is the right home for those. The test for inclusion is whether a non-developer reaches it from
# the app, or a regulator needs it at a stable URL on a domain we own.
DOCUMENTS = (
    # The trainer-facing front door (TODO §23.5). README.md is developer-facing and correctly stays
    # that way; a trainer arriving from a forum post needs one screen — what it is, a demo they can
    # drive themselves, and how to keep it on their phone.
    ("docs/LANDING.md", "src/landing.html", "LibrePT — the trainer's clipboard"),
    ("PRIVACY.md", "src/privacy.html", "Privacy & GDPR Statement — LibrePT"),
    ("docs/PREVIEW.md", "src/preview.html", "Preview Build — Data Loss Notice"),
    (
        "docs/BUG_REPORTING.md",
        "src/bug-reporting.html",
        "Reporting a Problem — LibrePT",
    ),
    # Per language, and both documents per language: these are handed to a CLIENT, so the language is
    # the client's (gdprConsent.formLang), not the app's. consentForm.js links the pair matching each
    # client's chosen form language.
    (
        "docs/templates/en/Client_Consent_Form.md",
        "src/consent-form-en.html",
        "Client Consent Form",
    ),
    (
        "docs/templates/en/Client_Privacy_Notice.md",
        "src/privacy-notice-en.html",
        "Client Privacy Notice",
    ),
    (
        "docs/templates/sl/Client_Consent_Form.md",
        "src/consent-form-sl.html",
        "Obrazec za privolitev",
    ),
    (
        "docs/templates/sl/Client_Privacy_Notice.md",
        "src/privacy-notice-sl.html",
        "Obvestilo o zasebnosti",
    ),
)

# Where a link that is NOT shipped as a page has to point instead. Repo-relative, so it survives a
# rename of the Pages site.
REPO_BLOB_URL = "https://github.com/stutek/LibrePT/blob/main"

# Documents need no script execution whatsoever, so this is far tighter than the app's own policy:
# no 'unsafe-inline' for styles (the stylesheet is a real file), and no script source at all.
PAGE_CSP = (
    "default-src 'none'; "
    "style-src 'self'; "
    "img-src 'self' data:; "
    "font-src 'self'; "
    "base-uri 'none'; "
    "form-action 'none'"
)


def build_renderer():
    """A markdown-it configured for shipped output: no raw HTML, no cleverness, tables on.

    `linkify` and `typographer` stay off deliberately — both rewrite text the author did not write,
    which is the wrong default for a legal document whose exact wording may have been reviewed.
    """
    renderer = MarkdownIt(
        "commonmark", {"html": False, "linkify": False, "typographer": False}
    )
    renderer.enable("table")
    return renderer


def strip_frontmatter(text):
    """Return `(body, metadata)`, splitting OKF YAML frontmatter off the top when present.

    Not every shipped document has it — PRIVACY.md is a plain policy with no frontmatter, while the
    files under docs/ all carry it — so absence is normal rather than an error.
    """
    if not text.startswith("---\n"):
        return text, {}
    closing = text.find("\n---\n", 4)
    if closing == -1:
        return text, {}
    metadata = yaml.safe_load(text[4:closing]) or {}
    return text[closing + 5 :], metadata


def rewrite_link(href, source_name):
    """Point one Markdown link at something that resolves from a shipped page.

    The docs link to each other the way repository files do — `../PRIVACY.md`,
    `templates/en/Client_Consent_Form.md`, `BUG_REPORTING.md`. Rendered into a FLAT `src/`, every one
    of those is a 404: the directory structure they were written against does not exist there. This
    is the whole reason shipping a second document is more than a table row.

    Two destinations, and the choice is what keeps the set honest:
      * a doc that IS shipped becomes its sibling page, so the trainer stays in the app and offline;
      * anything else becomes an absolute GitHub URL, so it still resolves — just off-app, which is
        the correct outcome for a developer-facing file nobody put in DOCUMENTS.

    Absolute URLs, mailto: and bare anchors are returned untouched.
    """
    if not href or href.startswith(("http://", "https://", "mailto:", "#")):
        return href
    anchor = ""
    if "#" in href:
        href, _, anchor = href.partition("#")
        anchor = f"#{anchor}"
    if not href:
        return anchor
    # Resolve against the source's own directory, exactly as a reader of the repo would.
    target = (pathlib.PurePosixPath(source_name).parent / href).as_posix()
    target = pathlib.PurePosixPath(target)
    resolved = []
    for part in target.parts:
        if part == "..":
            if resolved:
                resolved.pop()
        elif part != ".":
            resolved.append(part)
    repo_relative = "/".join(resolved)

    for source, output, _title in DOCUMENTS:
        if source == repo_relative:
            return f"./{pathlib.PurePosixPath(output).name}{anchor}"
    return f"{REPO_BLOB_URL}/{repo_relative}{anchor}"


def rewrite_links(rendered_html, source_name):
    """Apply `rewrite_link` to every href in a rendered page."""
    return re.sub(
        r'href="([^"]*)"',
        lambda match: f'href="{html.escape(rewrite_link(match.group(1), source_name), quote=True)}"',
        rendered_html,
    )


def render_page(markdown_text, title, source_name="PRIVACY.md"):
    """The complete HTML document for one source file, as bytes-identical output every run."""
    body, metadata = strip_frontmatter(markdown_text)
    page_title = metadata.get("title") or title
    # No "unrewritten link" guard here, deliberately. rewrite_link's two destinations are exhaustive
    # over relative hrefs — a path either matches DOCUMENTS and becomes a sibling page, or it does
    # not and becomes an absolute GitHub URL — so nothing relative can survive. A guard was written
    # first and its own test proved it could never fire; an unreachable branch that looks like a
    # safety net is worse than none, because it invites trusting a check that does nothing.
    # test_no_relative_link_survives_rewriting pins the property instead.
    content = rewrite_links(build_renderer().render(body), source_name)
    return (
        "<!doctype html>\n"
        '<html lang="en">\n'
        "<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f'<meta http-equiv="Content-Security-Policy" content="{PAGE_CSP}">\n'
        f"<title>{html.escape(page_title)}</title>\n"
        '<link rel="stylesheet" href="./docs.css">\n'
        "</head>\n"
        "<body>\n"
        '<main class="doc">\n'
        f"{content}"
        "</main>\n"
        '<p class="doc-back"><a href="./index.html">Back to LibrePT</a></p>\n'
        "</body>\n"
        "</html>\n"
    )


def render_all(check_only=False):
    """Write (or verify) every page in DOCUMENTS. Returns a list of paths that were out of date."""
    stale = []
    for source_name, output_name, title in DOCUMENTS:
        source = REPO_ROOT / source_name
        output = REPO_ROOT / output_name
        rendered = render_page(source.read_text(encoding="utf-8"), title, source_name)
        current = output.read_text(encoding="utf-8") if output.exists() else None
        if current == rendered:
            continue
        stale.append(output_name)
        if not check_only:
            output.write_text(rendered, encoding="utf-8")
    return stale


def main():
    check_only = "--check" in sys.argv
    stale = render_all(check_only=check_only)
    if not stale:
        print(f"  ✓ Rendered docs: {len(DOCUMENTS)} page(s) up to date.")
        return 0
    if check_only:
        print("  ✗ Generated documentation pages are out of date:")
        for path in stale:
            print(f"      {path}")
        print("    Run: .venv/bin/python -m agent_tools.render_docs")
        return 1
    for path in stale:
        print(f"  ✓ Wrote {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
