# tests/unit/test_domsecurity.py
# The static security audits the scanners structurally cannot do (build/domsecurity.py). Both exist
# because a green OWASP ZAP badge overstated our position: the baseline scan is passive, its spider
# sees ~one page of a client-routed SPA, and it scans the DEV SERVER — whose real HTTP headers
# production (GitHub Pages) cannot send at all. A stored XSS via `client.avatar` shipped under that
# badge, twice, in two different views.

from build.domsecurity import audit_html_sinks, compare_csp, parse_csp

HEADER_CSP = "default-src 'self'; script-src 'self'; frame-ancestors 'none'; img-src 'self' data:"


def test_the_live_tree_has_no_unescaped_user_text_in_html(src_dir):
    """The regression guard: this is the exact check that would have caught both avatar bugs."""
    assert audit_html_sinks(str(src_dir)) == []


def test_an_unescaped_user_field_in_a_sink_is_found(tmp_path):
    (tmp_path / "bad.js").write_text(
        'card.innerHTML = `<div class="avatar">${client.avatar}</div>`;\n',
        encoding="utf-8",
    )
    findings = audit_html_sinks(str(tmp_path))

    assert len(findings) == 1
    assert findings[0][2] == "client.avatar"


def test_escaping_is_recognised_at_the_sink_and_at_assignment(tmp_path):
    (tmp_path / "ok.js").write_text(
        "const title = escapeHTML(item.title);\n"
        "card.innerHTML = `<h3>${escapeHTML(client.name)}</h3><span>${title}</span>`;\n",
        encoding="utf-8",
    )
    # Escaping at assignment counts: an audit that cries wolf gets suppressed rather than fixed.
    assert audit_html_sinks(str(tmp_path)) == []


def test_non_html_interpolation_is_not_flagged(tmp_path):
    """A mailto: body and an element title are not HTML sinks — flagging them trains people to ignore."""
    (tmp_path / "safe.js").write_text(
        "btn.href = `mailto:${client.email}?subject=${subject}`;\n"
        "btn.title = `Send to ${client.email}`;\n",
        encoding="utf-8",
    )
    assert audit_html_sinks(str(tmp_path)) == []


def test_csp_parity_passes_when_meta_matches_the_header():
    weaker, header_only = compare_csp(HEADER_CSP, HEADER_CSP)
    assert weaker == []
    # A meta tag cannot carry frame-ancestors, so it is reported as a hosting gap, not a failure.
    assert header_only == ["frame-ancestors"]


def test_csp_parity_fails_when_production_is_weaker():
    meta = "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:"
    weaker, _ = compare_csp(HEADER_CSP, meta)

    # Both shapes of "weaker": a directive dropped entirely, and one loosened.
    assert any(
        "script-src" in problem and "unsafe-inline" in problem for problem in weaker
    )


def test_parse_csp_splits_directives():
    assert parse_csp("default-src 'self'; object-src 'none'") == {
        "default-src": "'self'",
        "object-src": "'none'",
    }
