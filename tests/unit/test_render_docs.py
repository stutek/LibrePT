# tests/unit/test_render_docs.py
# The documentation renderer emits pages that SHIP — served to trainers, hashed into the integrity
# catalog, and read by Google's OAuth reviewers. Its security posture is therefore a property to pin,
# not a configuration to trust: markdown-it's `commonmark` preset enables raw HTML, so `html: False`
# is passed explicitly in build_renderer() and a library upgrade must not be able to silently undo
# it. These tests fail if it ever does.

import pathlib
import re

from agent_tools import render_docs

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]


def test_raw_html_is_escaped_not_passed_through():
    """The single most important property: a document cannot inject markup into a shipped page.

    Our Markdown is trusted today, but these pages are served under an integrity catalog and read by
    reviewers — a source file that could emit a <script> tag would make the catalog attest to
    something nobody reviewed."""
    rendered = render_docs.build_renderer().render(
        "Hello <script>alert(1)</script> <b>bold</b>"
    )
    assert "<script>" not in rendered
    assert "&lt;script&gt;" in rendered
    # A literal <b> in the source is content, not formatting — it must display, not apply.
    assert "&lt;b&gt;" in rendered


def test_dangerous_link_schemes_are_neutralised():
    """markdown-it validates link destinations; confirm that survives our configuration.

    It refuses to build the anchor at all, leaving the source as literal text — so the assertion is
    that no `href` is produced, NOT that the string vanishes. Escaped text containing
    `javascript:` is inert; an `<a href="javascript:...">` is not."""
    renderer = render_docs.build_renderer()
    rendered = renderer.render("[click](javascript:alert(1))")
    assert "href" not in rendered
    # Paired with the negative case, so this proves link validation is active rather than link
    # rendering being broken outright.
    assert 'href="https://example.com"' in renderer.render("[ok](https://example.com)")


def test_tables_are_enabled():
    """Tables are not in bare CommonMark and carry real content in the privacy policy (the data
    category and retention tables), so they are explicitly enabled and must stay that way."""
    rendered = render_docs.build_renderer().render(
        "| a | b |\n| --- | --- |\n| 1 | 2 |"
    )
    assert "<table>" in rendered
    assert "<td>1</td>" in rendered


def test_okf_frontmatter_is_stripped_and_supplies_the_title():
    body, metadata = render_docs.strip_frontmatter(
        "---\ntitle: Preview Notice\ntype: guidelines\n---\n# Heading\n\nText.\n"
    )
    assert body.startswith("# Heading")
    assert metadata["title"] == "Preview Notice"
    # A page whose frontmatter names a title should use it rather than the fallback.
    assert "<title>Preview Notice</title>" in render_docs.render_page(
        "---\ntitle: Preview Notice\n---\n# Heading\n", "Fallback"
    )


def test_documents_without_frontmatter_are_left_intact():
    """PRIVACY.md is a plain policy with no frontmatter — absence is normal, not an error."""
    body, metadata = render_docs.strip_frontmatter("# Policy\n\nText.\n")
    assert body == "# Policy\n\nText.\n"
    assert metadata == {}


def test_rendered_pages_load_no_scripts_and_declare_a_strict_policy():
    page = render_docs.render_page("# Title\n", "T")
    assert "<script" not in page
    assert "default-src 'none'" in page
    # Styles come from a real file, so the policy needs no 'unsafe-inline' — stricter than the app's
    # own CSP, which does need it.
    assert "'unsafe-inline'" not in page


def test_a_link_to_a_shipped_doc_becomes_its_sibling_page():
    """The docs link to each other as repository files do. Rendered into a flat src/, those paths do
    not exist — so a shipped doc has to become its generated sibling, or the trainer taps a 404."""
    # From docs/PREVIEW.md, one level up to the repo root.
    assert (
        render_docs.rewrite_link("../PRIVACY.md", "docs/PREVIEW.md") == "./privacy.html"
    )
    # A sibling inside docs/.
    assert (
        render_docs.rewrite_link("BUG_REPORTING.md", "docs/PREVIEW.md")
        == "./bug-reporting.html"
    )
    # Down into a subdirectory.
    assert (
        render_docs.rewrite_link(
            "templates/en/Client_Consent_Form.md", "docs/PREVIEW.md"
        )
        == "./consent-form-en.html"
    )


def test_a_link_to_an_unshipped_doc_becomes_an_absolute_github_url():
    """Developer-facing files stay on GitHub deliberately — but the link must still RESOLVE, so it
    becomes absolute rather than being left as a relative path into a directory that ships nothing."""
    assert (
        render_docs.rewrite_link("../docs/DATA_MODEL.md", "docs/PREVIEW.md")
        == f"{render_docs.REPO_BLOB_URL}/docs/DATA_MODEL.md"
    )


def test_anchors_survive_rewriting():
    """A link into a section must keep its fragment, or it silently lands at the top of the page."""
    assert (
        render_docs.rewrite_link("../PRIVACY.md#retention", "docs/PREVIEW.md")
        == "./privacy.html#retention"
    )
    assert (
        render_docs.rewrite_link("#local-section", "docs/PREVIEW.md")
        == "#local-section"
    )


def test_absolute_and_mailto_links_are_left_alone():
    for href in (
        "https://forge.example.test/acme/tracker/issues",
        "http://example.com",
        "mailto:someone@example.com",
    ):
        assert render_docs.rewrite_link(href, "docs/PREVIEW.md") == href


def test_no_relative_link_survives_rewriting():
    """The property that makes a shipped page safe to hand a trainer: nothing relative is left.

    This replaced a runtime guard that raised on "unrewritten" links. Writing this test is what
    showed the guard could never fire — the two destinations are exhaustive over relative hrefs, so
    an unmatched path becomes an absolute GitHub URL rather than surviving. Pinning the property
    beats keeping an unreachable branch that reads like a safety net.
    """
    for href, source in (
        ("./nope.md", "docs/PREVIEW.md"),
        ("../README.md", "docs/BUG_REPORTING.md"),
        ("deep/nested/thing.md", "PRIVACY.md"),
    ):
        rewritten = render_docs.rewrite_link(href, source)
        assert rewritten.startswith(("./", "http")), f"{href} left as {rewritten}"
        if rewritten.endswith(".md"):
            assert rewritten.startswith("http"), "a .md destination must be absolute"


def test_generated_pages_carry_no_relative_markdown_links():
    """The same property, asserted end-to-end against every page actually shipped."""
    for _source, output_name, _title in render_docs.DOCUMENTS:
        page = (REPO_ROOT / output_name).read_text(encoding="utf-8")
        for href in re.findall(r'href="([^"]*)"', page):
            assert not (href.endswith(".md") and not href.startswith("http")), (
                f"{output_name} ships a relative Markdown link: {href}"
            )


def test_every_declared_document_exists_and_is_current():
    """Guards the table itself: a row naming a missing source, and drift between a source and its
    generated page (the same thing run_docs_render_check gates in Stage 1)."""
    for source_name, output_name, _title in render_docs.DOCUMENTS:
        assert (REPO_ROOT / source_name).is_file(), f"missing source {source_name}"
        assert (REPO_ROOT / output_name).is_file(), (
            f"missing generated page {output_name}"
        )
    assert render_docs.render_all(check_only=True) == []


def test_a_query_string_survives_rendering_intact():
    """markdown-it escapes hrefs, so escaping them a second time produced `&amp;amp;` — read by a
    browser as the literal `&amp;`, which renames the parameter after it. The landing page's
    "watch the demo" link shipped that way and quietly did not start the tour."""
    page = render_docs.render_page(
        "[demo](https://example.test/app/?init=demo_data_load&demo=gym_floor)",
        "T",
        source_name="docs/LANDING.md",
    )
    assert "&amp;amp;" not in page, "href was escaped twice"
    assert "?init=demo_data_load&amp;demo=gym_floor" in page


def test_the_landing_page_demo_links_reach_the_app_not_a_code_host():
    """A relative link from docs/ is rewritten to a github.com blob URL for anything not shipped —
    correct for a developer file, catastrophic for this page, whose two calls to action are the
    whole point and whose readers will never have a GitHub account (TODO §3.12's defect)."""
    # Read AFTER the placeholders are resolved (TODO §28.2): the source now names the deployed
    # address rather than writing it out, and what matters is where the rendered link points.
    source = render_docs.inject_declared_values(
        (render_docs.REPO_ROOT / "docs" / "LANDING.md").read_text(encoding="utf-8")
    )
    demo_links = re.findall(r"\]\((\S*init=demo_data_load[^)]*)\)", source)
    assert demo_links, "the landing page no longer links to the demo at all"
    for link in demo_links:
        assert link.startswith("https://"), f"{link} will be rewritten to a blob URL"
        assert "github.com" not in link
