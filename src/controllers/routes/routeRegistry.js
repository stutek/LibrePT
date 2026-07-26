// src/controllers/routes/routeRegistry.js — the ordered collection of every addressable app state.
// Single responsibility: hold the routes, resolve a path to exactly one of them, and spell a URL for
// a named one. It knows nothing about views, dialogs or the DOM.

export class RouteRegistry {
  #routes = [];
  #byName = new Map();

  // Registration order is deliberately NOT significant: routes are kept sorted by specificity, so a
  // route added at the bottom of the table can still win over a vaguer one above it. Duplicate names
  // throw rather than shadow, because a silently shadowed name would make build() spell the wrong URL.
  register(route) {
    if (this.#byName.has(route.name)) {
      throw new Error(`duplicate route name: ${route.name}`);
    }
    this.#byName.set(route.name, route);
    this.#routes.push(route);
    this.#routes.sort((a, b) => b.specificity - a.specificity);
    return route;
  }

  resolve(path) {
    for (const route of this.#routes) {
      const params = route.match(path);
      if (params) return { route, params };
    }
    return null;
  }

  get(name) {
    return this.#byName.get(name) || null;
  }

  urlFor(name, params) {
    const route = this.#byName.get(name);
    if (!route) throw new Error(`unknown route: ${name}`);
    return route.build(params);
  }

  // Ordered names, for tests that pin resolution precedence and for the route-table documentation.
  names() {
    return this.#routes.map((route) => route.name);
  }
}
