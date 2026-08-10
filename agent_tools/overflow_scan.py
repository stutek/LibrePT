"""`python -m agent_tools.overflow_scan` — find components that break out of their box.

Why this exists: every test in this repo asserts *semantics* — text, counts, element ids — and none
asserts *geometry*, so a control that runs off the screen edge or one whose label is silently
clipped inside its own box passes the whole gate (TODO §25). The `.filter-chips` overflow recorded
in `src/index.css` was found by looking at the app, not by a test.

This module owns the sweep itself — one function of browser-side JavaScript — so the e2e suite
(`tests/e2e/test_layout_overflow.py`) and an agent diagnosing a live page run the *same* check
rather than two that drift apart.

Two invariants, deliberately separate:

  **A — nothing extends past its clipping boundary.** Not "past the viewport": `body` is
  `max-width: 480px` centred, so on a desktop window the real boundary is the app column. Each
  element is compared against the client box of its nearest CLIPPING ancestor (`position: fixed`
  escapes that chain and is compared to the viewport). The mechanic that makes this non-obvious is
  that `body { overflow-x: hidden }` *already* masks this whole class of bug — an overflowing child
  is clipped silently and `documentElement.scrollWidth` never reports it, so a root-level check
  would read clean today and forever. A per-element rect still sees the true layout box through a
  clipping ancestor.

  **B — clipped content.** `scrollWidth > clientWidth` (and the height equivalent) on elements that
  clip on that axis. This is the silent-clipping case: `overflow: hidden` swallowing a label with
  no scrollbar, no ellipsis and no error.

What is deliberately NOT reported, and why each would otherwise be noise:

  * **A declared scroll container** (`overflow: auto|scroll` on that axis) — content exceeding the
    box is the entire point. Only that AXIS is exempt; the other is still asserted.
  * **`overflow: visible`, for invariant B** — a non-clipping element reports its children's
    overflow as its own `scrollWidth`, so every ancestor up the chain would report the same defect.
    Invariant A names the one offending child instead. B is therefore about clipping only.
  * **The ellipsis idiom** (`text-overflow: ellipsis`, or `-webkit-line-clamp` vertically) — a
    truncation the author explicitly asked for and the user can see.
  * **An element entirely outside its boundary** — a parked drawer or an off-canvas menu is a
    legitimate pattern; a real overflow *intersects* its boundary and sticks out of it.
  * **Form controls**, for invariant B — an `<input>` whose value is longer than the field always
    reports `scrollWidth > clientWidth`, and that is how text fields work.

`data-clip="intentional"` on an element opts it out of B where the clipping is genuine but not
expressible via the ellipsis idiom (a circular avatar crop, a decorative bleed). The opt-out lives
in the MARKUP on purpose: a Python allowlist here would be a way to park real debt, which
AGENT_RULES §2 forbids, whereas an attribute is reviewable in the diff and travels with the
component.

A `diagnostic`, not a `check` (see agent_tools/INDEX.md): it needs a browser and a running server,
so it is not wired into a gate — the e2e suite is what gates these invariants.

Usage:
  python -m agent_tools.overflow_scan --url http://localhost:8081/LibrePT/?init=demo_data_load \\
      --device iphone-14 --wait-selector "#view-clients.active"
  python -m agent_tools.overflow_scan --url ... --viewport 412x915 --invariant A
"""

import argparse
import json
import sys

# CSS-pixel viewports, which is the only axis that changes layout — device pixel ratio does not, so
# these are deliberately plain sizes rather than full Playwright device descriptors. Portrait, since
# that is how a trainer holds a phone mid-session.
DEVICE_PROFILES = {
    "iphone-14": {
        "width": 390,
        "height": 844,
        "description": "iPhone 14 (1170x2532 at DPR 3) — the narrowest supported phone",
    },
    "galaxy-s23-ultra": {
        "width": 412,
        "height": 915,
        "description": "Samsung Galaxy S23 Ultra (1440x3088 at DPR 3.5)",
    },
    "desktop": {
        "width": 1280,
        "height": 800,
        "description": "Desktop browser — where body's 480px max-width column is the boundary",
    },
}

DEFAULT_DEVICE = "iphone-14"

# A layout engine's subpixel rounding is not a defect; a component leaving the screen is. 1 CSS
# pixel is above the former and far below the latter.
DEFAULT_TOLERANCE_PX = 1.0


def device_profile(name):
    """The viewport for a named device. Raises ValueError naming the valid options."""
    try:
        return DEVICE_PROFILES[name]
    except KeyError:
        raise ValueError(
            f"unknown device {name!r}; expected one of {', '.join(sorted(DEVICE_PROFILES))}"
        ) from None


def parse_viewport(spec):
    """ "WxH" -> {"width": W, "height": H}. Raises ValueError on a malformed spec."""
    try:
        width, height = spec.lower().split("x")
        return {"width": int(width), "height": int(height)}
    except (ValueError, AttributeError) as err:
        raise ValueError(f"--viewport must look like '390x844', got {spec!r}") from err


# One argument object in, one array of findings out. Kept as a single expression so it can be
# handed straight to Playwright's page.evaluate() from either consumer.
OVERFLOW_SCAN_JS = r"""
(options) => {
  const tolerance = options.tolerance;
  const wanted = options.invariants;
  const findings = [];
  const styles = new WeakMap();

  function styleOf(element) {
    let cached = styles.get(element);
    if (!cached) {
      cached = getComputedStyle(element);
      styles.set(element, cached);
    }
    return cached;
  }

  function describe(element) {
    const id = element.id ? "#" + element.id : "";
    const classAttr = element.getAttribute("class") || "";
    const classes = classAttr.trim()
      ? "." + classAttr.trim().split(/\s+/).slice(0, 3).join(".")
      : "";
    return element.tagName.toLowerCase() + id + classes;
  }

  // "auto"/"scroll" is the element declaring that content is SUPPOSED to exceed its box on this
  // axis. Note a browser quirk that matters here: when one axis is not "visible" the other
  // computes to "auto", so body { overflow-x: hidden } reads as overflow-y: auto — which is
  // correct, and is why every decision below is made per axis rather than per element.
  function overflowOn(style, axis) {
    return axis === "x" ? style.overflowX : style.overflowY;
  }
  function scrollsOn(style, axis) {
    const value = overflowOn(style, axis);
    return value === "auto" || value === "scroll";
  }
  function clipsOn(style, axis) {
    return overflowOn(style, axis) !== "visible";
  }

  function isRendered(element, style, rect) {
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (Number(style.opacity) === 0) return false;
    return rect.width > tolerance && rect.height > tolerance;
  }

  function boxOf(element, axis) {
    const rect = element.getBoundingClientRect();
    return axis === "x"
      ? { start: rect.left + element.clientLeft, size: element.clientWidth }
      : { start: rect.top + element.clientTop, size: element.clientHeight };
  }

  // The boundary an element may not exceed on this axis, or null when there is nothing to assert.
  function boundaryFor(element, style, axis) {
    // The viewport bounds an element HORIZONTALLY only, and that holds for fixed elements too.
    // A bottom sheet is deliberately taller than the screen with only its handle peeking above
    // the fold — this app's #notification-area sits 716px below the viewport at 390x844 by
    // design, and every drawer, sheet and off-canvas panel ever written does the same. Vertical
    // extent past the viewport is how they work; horizontal extent past it is the bug. A real
    // clipping ancestor still bounds both axes (below), because there the content IS lost.
    if (style.position === "fixed") {
      return axis === "y" ? null : { start: 0, end: window.innerWidth, label: "viewport" };
    }
    let ancestor = element.parentElement;
    while (ancestor && ancestor !== document.documentElement) {
      const ancestorStyle = styleOf(ancestor);
      if (clipsOn(ancestorStyle, axis)) {
        // Declared scrollable: content beyond the box is reachable, not lost.
        if (scrollsOn(ancestorStyle, axis)) return null;
        const box = boxOf(ancestor, axis);
        return {
          start: box.start,
          end: box.start + box.size,
          label: describe(ancestor),
          // A single-line container clips its children's line boxes by a pixel or two purely from
          // line-height rounding (a 26px font on a 25.3px line). Nothing is lost, so the vertical
          // check is switched off inside one — see the `nowrap` note on invariant B.
          singleLine: ancestorStyle.whiteSpace.startsWith("nowrap"),
          ellipsised: ancestorStyle.textOverflow === "ellipsis",
        };
      }
      ancestor = ancestor.parentElement;
    }
    // Nothing up the chain clips. Horizontally that means the viewport edge is the boundary;
    // vertically it does not, because content below the fold is normal scrollable page content.
    if (axis === "y") return null;
    return { start: 0, end: window.innerWidth, label: "viewport" };
  }

  const FORM_CONTROLS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

  for (const element of document.body.querySelectorAll("*")) {
    const style = styleOf(element);
    const rect = element.getBoundingClientRect();
    if (!isRendered(element, style, rect)) continue;

    if (wanted.includes("A")) {
      for (const axis of ["x", "y"]) {
        const boundary = boundaryFor(element, style, axis);
        if (!boundary) continue;
        if (axis === "y" && boundary.singleLine) continue;
        const start = axis === "x" ? rect.left : rect.top;
        const end = axis === "x" ? rect.right : rect.bottom;
        // Wholly outside its boundary is a parked drawer or off-canvas panel — but ONLY when the
        // element is positioned out of flow, which is how a drawer parks itself. In-flow static
        // content sitting entirely outside its clipping box has simply been truncated away, and
        // that is the defect this whole sweep exists to find: the app's edit-mode status chip is
        // pushed fully out of the ellipsised session title at 390px and partly out at 412px, so
        // exempting "fully outside" unconditionally would have reported the wider phone and let
        // the narrower — worse — case through.
        const parked = style.position !== "static" || style.transform !== "none";
        const whollyOutside = end <= boundary.start || start >= boundary.end;
        if (parked && whollyOutside) continue;
        // An ellipsis container truncates on purpose, and a partly-visible child ending in "…"
        // is that promise being kept: the trainer can see there is more. A child pushed ENTIRELY
        // out of one is not truncation, it is deletion — nothing on screen says it exists. So
        // inside an ellipsised box the bar is "wholly invisible", not "exceeds by a pixel";
        // otherwise every long client name in Slovenian reports as a defect.
        if (boundary.ellipsised && !whollyOutside) continue;
        const over = Math.max(boundary.start - start, end - boundary.end);
        if (over > tolerance) {
          findings.push({
            invariant: "A",
            axis: axis,
            element: describe(element),
            boundary: boundary.label,
            overflowPx: Math.round(over),
          });
        }
      }
    }

    if (!wanted.includes("B")) continue;
    if (FORM_CONTROLS.has(element.tagName)) continue;
    if (element.dataset.clip === "intentional") continue;
    for (const axis of ["x", "y"]) {
      // Only a CLIPPING element can silently swallow content; "visible" is invariant A's business
      // (reported once against the offending child, not once per ancestor).
      if (!clipsOn(style, axis) || scrollsOn(style, axis)) continue;
      if (axis === "x" && style.textOverflow === "ellipsis") continue;
      // A single line has nothing to lose vertically: `scrollHeight` on a nowrap element exceeds
      // its box by the few pixels a line box rounds to (the header's h1 — 26px font at 26px
      // line-height — reports 3px at every width), which is layout arithmetic, not truncation.
      if (axis === "y" && style.whiteSpace.startsWith("nowrap")) continue;
      if (axis === "y" && style.webkitLineClamp && style.webkitLineClamp !== "none") continue;
      const over = axis === "x"
        ? element.scrollWidth - element.clientWidth
        : element.scrollHeight - element.clientHeight;
      if (over > tolerance) {
        findings.push({
          invariant: "B",
          axis: axis,
          element: describe(element),
          boundary: "its own box",
          overflowPx: Math.round(over),
        });
      }
    }
  }

  return findings;
}
"""


def scan(page, tolerance=DEFAULT_TOLERANCE_PX, invariants=("A", "B")):
    """Run the sweep on an already-loaded Playwright page. Returns a list of finding dicts."""
    return page.evaluate(
        OVERFLOW_SCAN_JS,
        {"tolerance": tolerance, "invariants": list(invariants)},
    )


def format_findings(context, findings):
    """A failure message that says where the app was, not just what overflowed — the same sweep
    runs at a dozen routes, so a finding without its route is not actionable."""
    if not findings:
        return f"{context}: no overflow"
    lines = [f"{context}: {len(findings)} overflow finding(s)"]
    for finding in findings:
        axis = "horizontally" if finding["axis"] == "x" else "vertically"
        lines.append(
            f"  [{finding['invariant']}] {finding['element']} overflows "
            f"{finding['boundary']} {axis} by {finding['overflowPx']}px"
        )
    return "\n".join(lines)


def build_parser():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--url", required=True, help="page to load, e.g. a local dev-server URL"
    )
    parser.add_argument(
        "--device",
        default=DEFAULT_DEVICE,
        choices=sorted(DEVICE_PROFILES),
        help=f"named viewport preset (default {DEFAULT_DEVICE})",
    )
    parser.add_argument(
        "--viewport",
        default=None,
        help="WxH, overriding --device with an explicit size",
    )
    parser.add_argument(
        "--invariant",
        action="append",
        dest="invariants",
        choices=["A", "B"],
        default=None,
        help="restrict to one invariant; repeatable, default both",
    )
    parser.add_argument(
        "--wait-selector", default=None, help="wait for this selector before sweeping"
    )
    parser.add_argument("--tolerance", type=float, default=DEFAULT_TOLERANCE_PX)
    parser.add_argument("--timeout-ms", type=int, default=10000)
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)

    try:
        viewport = (
            parse_viewport(args.viewport)
            if args.viewport
            else {k: device_profile(args.device)[k] for k in ("width", "height")}
        )
    except ValueError as err:
        print(f"overflow_scan: {err}", file=sys.stderr)
        return 2

    from playwright.sync_api import (
        sync_playwright,
    )  # deferred: only the browser path needs it

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport=viewport)
        page.goto(args.url)
        if args.wait_selector:
            page.wait_for_selector(args.wait_selector, timeout=args.timeout_ms)
        page.wait_for_timeout(
            300
        )  # settle post-render animations/observers before measuring
        findings = scan(page, args.tolerance, args.invariants or ("A", "B"))
        browser.close()

    print(json.dumps(findings, indent=2))
    if findings:
        print(
            format_findings(
                f"{args.url} at {viewport['width']}x{viewport['height']}", findings
            ),
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
