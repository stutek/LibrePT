// src/controllers/routes/route.js — the base class for ONE addressable app state: its path pattern,
// the params that pattern carries, and what entering or leaving it does to the app chrome.
// Single responsibility: pattern ↔ params translation plus the shared enter/exit lifecycle.
//
// A route never imports a view module: everything it needs arrives per call in
// `ctx = { path, params, route, previousRoute, isBootPass, deps, router }`, where `deps` is the
// injected routerDeps and `router` is the small facade of operations the router exposes to its routes
//. That is what lets a route be
// constructed and matched with no DOM and no booted app, so the registry is unit-testable.

// A pattern segment is either a literal or `:name`, optionally constrained inline as `:name(regex)`.
// The inline constraint is not decoration: it is what stops `/sessions/new` from being swallowed by
// `/sessions/:isoDate`, without depending on which one a human registered first.
const PARAM_SEGMENT = /^:([A-Za-z0-9_]+)(?:\((.+)\))?$/;
const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

export class Route {
  // `viewId`              — the `#view-<id>` this state shows, or null when the route's own enter()
  //                         decides (a session hands that to showSessionView, client detail to
  //                         clientsViewShowDetails).
  // `headerActions`       — argument for setHeaderState().
  // `hidesSessionOverlay` — false ONLY for routes that own the overlay themselves; every ordinary
  //                         view hides it, which is the `overlay.classList.add("hidden")` line that
  //                         used to be copy-pasted into nine branches of handlePathChange.
  constructor({ name, pattern, viewId = null, headerActions = false, hidesSessionOverlay = true }) {
    this.name = name;
    this.pattern = pattern;
    this.viewId = viewId;
    this.headerActions = headerActions;
    this.hidesSessionOverlay = hidesSessionOverlay;
    this.paramNames = [];
    this.segments = pattern.split("/").filter(Boolean);
    this.literalCount = this.segments.filter((s) => !PARAM_SEGMENT.test(s)).length;
    this.regex = this.#compile();
  }

  #compile() {
    let source = "^";
    for (const segment of this.segments) {
      const param = PARAM_SEGMENT.exec(segment);
      if (param) {
        this.paramNames.push(param[1]);
        source += `/(${param[2] || "[^/]+"})`;
      } else {
        source += `/${segment.replace(REGEX_SPECIALS, "\\$&")}`;
      }
    }
    return new RegExp(`${source}\\/?$`);
  }

  // Literal segments decide the winner, so `/session/new` outranking `/session/:sessionId` is a
  // property of the patterns rather than of where someone put an else-if. Segment count only breaks
  // ties between patterns that are equally literal.
  get specificity() {
    return this.literalCount * 1000 + this.segments.length;
  }

  // Returns the decoded params, or null when this route does not describe `path`.
  match(path) {
    const found = this.regex.exec(path.replace(/\/+$/, ""));
    if (!found) return null;
    const params = {};
    try {
      this.paramNames.forEach((paramName, index) => {
        params[paramName] = decodeURIComponent(found[index + 1]);
      });
    } catch {
      return null; // a malformed %-escape is an unknown route, never a thrown boot
    }
    return params;
  }

  // Reverse routing. Spelling a URL anywhere else by hand is what lets a pattern change quietly
  // leave a broken link behind, so this is the only sanctioned way to build one.
  build(params = {}) {
    if (!this.segments.length) return "/";
    const parts = this.segments.map((segment) => {
      const param = PARAM_SEGMENT.exec(segment);
      return param ? encodeURIComponent(params[param[1]] ?? "") : segment;
    });
    return `/${parts.join("/")}`;
  }

  // Whether this state sits inside the plan editor. Session recovery needs to know before routing
  // runs, and asking the route graph beats matching on name prefixes — a dialog layered over the
  // editor inherits the answer instead of having to be remembered separately.
  get isEditor() {
    return false;
  }

  // May return a different Route for the router to record as active — see RedirectRoute, which
  // rewrites the URL and then renders its target in place.
  enter(ctx) {
    ctx.router.setHeaderState(this.headerActions);
    if (this.hidesSessionOverlay) ctx.router.hideSessionOverlay();
    if (this.viewId) ctx.router.switchView(this.viewId);
    return this;
  }

  // Called with the OUTGOING route's own ctx when routing away — which is why the router keeps that
  // ctx rather than recomputing one. Nothing to undo for a plain view.
  exit(_ctx) {}
}
