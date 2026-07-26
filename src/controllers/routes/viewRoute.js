// src/controllers/routes/viewRoute.js — routes that are just a `#view-*` on screen.
// Single responsibility: the two simplest route shapes — show a view (optionally rendering it), and
// rewrite one URL into another.

import { Route } from "./route.js";

// A plain view. `render` runs after the chrome is in place, for views whose content is not already
// painted by the boot render pass (the client directory re-renders its list on entry).
export class ViewRoute extends Route {
  constructor({ render = null, ...routeOptions }) {
    super(routeOptions);
    this.render = render;
  }

  enter(ctx) {
    super.enter(ctx);
    this.render?.(ctx);
    return this;
  }
}

// Rewrites the URL to another route and renders THAT route in place, without a second resolve pass.
// Used for `/` and `/index.html`: the dashboard is the app's real home, and landing there should not
// leave a bare `/` in history for Back to return to.
export class RedirectRoute extends Route {
  constructor({ target, paramsFor = () => ({}), ...routeOptions }) {
    super(routeOptions);
    this.target = target;
    this.paramsFor = paramsFor;
  }

  enter(ctx) {
    const params = this.paramsFor(ctx);
    ctx.router.replaceUrl(this.target.build(params));
    // The target is what the user is now looking at, so the router records IT as the active route:
    // an exit() later must undo the target's state, not this redirect's.
    return this.target.enter({ ...ctx, route: this.target, params });
  }
}
