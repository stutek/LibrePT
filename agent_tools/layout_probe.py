"""`python -m agent_tools.layout_probe` — read real, rendered layout from a running page.

Why this exists: diagnosing a reported CSS positioning bug (a sticky/fixed element stopping at the
wrong offset, an unexpected overlap, a custom property not cascading where expected) means looking
at actual bounding boxes and computed styles, not re-deriving them by eye from the stylesheet. Before
this tool that meant writing a fresh throwaway Playwright script per bug (see AGENT_RULES §6) —
2026-07-28's sticky day-footer/FAB/notification-bar offset bug took three such scripts to pin down.
This is that script, generalized and kept.

Not a Stage 1/2 gate (see agent_tools/INDEX.md's no-network/no-browser bar for those) — it needs a
browser and a running server, so it is a manual diagnostic an agent runs on demand, not something
wired into `build check`. "Failure" here means a requested selector was never found on the page.

Usage:
  # The dev server's address is deploy.local_http_server.dev_server_url() — one declaration of
  # the port and base path (TODO §28.1), so nothing here writes either out.
  python -m agent_tools.layout_probe --url "$(.venv/bin/python -c \
      'from deploy.local_http_server import dev_server_url; print(dev_server_url("?init=demo_data_load"))')" \\
      --selector ".sessions-day-group-footer" --selector ".floating-action-btn" \\
      --css bottom --css position \\
      --wait-selector "#view-clients.active" \\
      --scroll "#main-content:1780" --viewport 390x844

Prints one JSON object per selector: {"box": {x,y,width,height} | null, "styles": {prop: value}}.
"""

import argparse
import json
import sys


def parse_viewport(spec):
    """ "WxH" -> {"width": W, "height": H}. Raises ValueError on a malformed spec."""
    try:
        w, h = spec.lower().split("x")
        return {"width": int(w), "height": int(h)}
    except (ValueError, AttributeError) as err:
        raise ValueError(f"--viewport must look like '390x844', got {spec!r}") from err


def parse_scroll(spec):
    """ "<selector>:<amount>" scrolls that selector's scrollTop; ":<amount>" scrolls the window.
    rpartition (not split) so a selector containing ':' (an id like '#foo:bar' is unusual but not
    invalid CSS) still splits on the LAST colon, which is the one separating it from the amount."""
    sel, sep, amount = spec.rpartition(":")
    if not sep:
        raise ValueError(
            f"--scroll must look like '#selector:1200' or ':800', got {spec!r}"
        )
    return sel, int(amount)


def probe(url, selectors, css_props, viewport, wait_selector, scrolls, timeout_ms):
    """Launch headless Chromium, navigate, optionally wait + scroll, then read each selector's
    bounding box and requested computed-style properties. Returns (results, missing_selectors)."""
    from playwright.sync_api import (
        sync_playwright,
    )  # deferred: only the browser path needs it

    results = {}
    missing = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=viewport)
        page.goto(url)
        if wait_selector:
            page.wait_for_selector(wait_selector, timeout=timeout_ms)
        page.wait_for_timeout(
            300
        )  # settle post-render animations/observers before measuring

        for sel, amount in scrolls:
            if sel:
                page.evaluate(
                    "(a) => { document.querySelector(a[0]).scrollTop = a[1]; }",
                    [sel, amount],
                )
            else:
                page.evaluate("(y) => window.scrollTo(0, y)", amount)
            page.wait_for_timeout(150)

        for sel in selectors:
            el = page.query_selector(sel)
            if not el:
                missing.append(sel)
                continue
            styles = {}
            if css_props:
                styles = page.evaluate(
                    "(args) => Object.fromEntries(args[1].map(p => "
                    "[p, getComputedStyle(args[0]).getPropertyValue(p)]))",
                    [el, css_props],
                )
            results[sel] = {"box": el.bounding_box(), "styles": styles}

        browser.close()
    return results, missing


def build_parser():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--url", required=True, help="page to load, e.g. a local dev-server URL"
    )
    parser.add_argument(
        "--selector",
        action="append",
        dest="selectors",
        required=True,
        help="CSS selector to inspect; repeatable",
    )
    parser.add_argument(
        "--css",
        action="append",
        dest="css_props",
        default=[],
        help="computed-style property to read on each selector (e.g. bottom); repeatable",
    )
    parser.add_argument(
        "--viewport", default="390x844", help="WxH, default a phone-sized 390x844"
    )
    parser.add_argument(
        "--wait-selector", default=None, help="wait for this selector before measuring"
    )
    parser.add_argument(
        "--scroll",
        action="append",
        dest="scrolls",
        default=[],
        help="'<selector>:<amount>' to set that element's scrollTop, or ':<amount>' for the "
        "window; repeatable, applied in order after --wait-selector",
    )
    parser.add_argument("--timeout-ms", type=int, default=10000)
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)

    try:
        viewport = parse_viewport(args.viewport)
        scrolls = [parse_scroll(s) for s in args.scrolls]
    except ValueError as err:
        print(f"layout_probe: {err}", file=sys.stderr)
        return 2

    results, missing = probe(
        args.url,
        args.selectors,
        args.css_props,
        viewport,
        args.wait_selector,
        scrolls,
        args.timeout_ms,
    )

    print(json.dumps(results, indent=2))
    if missing:
        for sel in missing:
            print(
                f"layout_probe: selector not found on {args.url}: {sel}",
                file=sys.stderr,
            )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
