"""Unit tests for agent_tools/icon_coverage.py — the icon-renderability gate.

It gates every commit, so both halves matter: it must catch an icon the shipped font cannot render,
and it must not fail the build over one it can. The false-positive tests below each pin a shape that
produced a spurious finding while the tool was being written — the grouped-selector one is not
hypothetical, it accused 17 real, working icons (`fa-bars` among them) on the first run.
"""

from agent_tools import icon_coverage


def test_grouped_alias_selectors_all_count_as_shipped():
    """Font Awesome groups aliases onto one rule. A pattern anchored on `:before{` sees only the
    LAST selector in each group and reports every alias before it as missing."""
    css = '.fa-magnifying-glass:before,.fa-search:before{content:"\\f002"}'
    assert icon_coverage.shipped_icons(css) == {"magnifying-glass", "search"}


def test_a_single_selector_rule_still_works():
    assert icon_coverage.shipped_icons('.fa-bars:before{content:"\\f0c9"}') == {"bars"}


def test_a_class_that_is_not_a_glyph_rule_is_not_shipped():
    # Layout/animation rules share the prefix but set no `content`, so they are not glyphs.
    assert icon_coverage.shipped_icons(".fa-spin{animation:x}") == set()


def test_icon_used_in_a_class_attribute_is_collected(tmp_path, monkeypatch):
    src = tmp_path / "src"
    (src / "modules").mkdir(parents=True)
    (src / "modules" / "a.js").write_text('html`<i class="fa-solid fa-gear"></i>`')
    monkeypatch.setattr(icon_coverage, "SRC", src)
    monkeypatch.setattr(icon_coverage, "REPO_ROOT", tmp_path)

    used = icon_coverage.used_icons(icon_coverage.scanned_files())
    assert "gear" in used
    # Style modifiers share the prefix but are not glyphs — demanding them of the font would fail
    # every build.
    assert "solid" not in used


def test_prose_and_css_selectors_are_not_mistaken_for_usage(tmp_path, monkeypatch):
    """An earlier loose grep reported `far` as used, having matched the words "far too early" in a
    comment. Only `class` attributes count."""
    src = tmp_path / "src"
    src.mkdir()
    (src / "a.js").write_text(
        "// this fires far too early, see fa-ghost below\n"
        "const css = '.fa-phantom:before{}';\n"
    )
    monkeypatch.setattr(icon_coverage, "SRC", src)
    monkeypatch.setattr(icon_coverage, "REPO_ROOT", tmp_path)

    used = icon_coverage.used_icons(icon_coverage.scanned_files())
    assert used.keys() <= icon_coverage.RUNTIME_BUILT, (
        f"prose leaked into usage: {used}"
    )


def test_the_truncated_prefix_of_a_runtime_built_name_is_not_demanded(
    tmp_path, monkeypatch
):
    """`fa-arrow-${dir}` must not make the tool demand a glyph literally called `arrow` — the real
    names are declared in RUNTIME_BUILT instead."""
    src = tmp_path / "src"
    src.mkdir()
    (src / "a.js").write_text('`<i class="fa-solid fa-arrow-${dir}"></i>`')
    monkeypatch.setattr(icon_coverage, "SRC", src)
    monkeypatch.setattr(icon_coverage, "REPO_ROOT", tmp_path)

    used = icon_coverage.used_icons(icon_coverage.scanned_files())
    assert "arrow" not in used
    # …and the declared names ARE demanded, so a subset that dropped them would fail.
    assert {"arrow-up", "arrow-down"} <= used.keys()


def test_the_vendored_stylesheet_is_not_read_as_usage():
    """It declares ~2400 classes the app does not use; counting those as usage makes the gate
    vacuous, since everything it demands would be everything it ships."""
    assert all("fonts" not in path.parts for path in icon_coverage.scanned_files())


def test_the_repository_renders_every_icon_it_asks_for():
    """The gate itself, as a test. Reports the offending classes in the assertion message rather
    than only on stdout, so a failure names them without re-running the tool."""
    shipped = icon_coverage.shipped_icons(
        icon_coverage.ICON_CSS.read_text(encoding="utf-8")
    )
    used = icon_coverage.used_icons(icon_coverage.scanned_files())
    missing = {
        name: sorted(files) for name, files in used.items() if name not in shipped
    }

    assert not missing, "icon classes the shipped font cannot render: " + ", ".join(
        f"fa-{name} ({', '.join(files)})" for name, files in sorted(missing.items())
    )
