// src/controllers/routes/routeTable.js — every addressable state of the app, in one readable list.
// Single responsibility: the route DATA. The machinery lives in route.js / routeRegistry.js and the
// subclasses; nothing here should need a code path of its own.
//
// Patterns are stored WITHOUT the base path: toUrl() prepends BASE_PATH, which is derived from
// import.meta.url. That is what makes every route version-agnostic — the same pattern resolves
// wherever the app happens to be hosted, and no route may ever name a version.

import { RouteRegistry } from "./routeRegistry.js";
import {
  ClientDetailRoute,
  SessionRoute,
  SessionsDayRoute,
  WorkoutSetupRoute,
} from "./sessionRoutes.js";
import { RedirectRoute, ViewRoute } from "./viewRoute.js";

const ISO_DATE = "[0-9]{4}-[0-9]{2}-[0-9]{2}";

export function buildRouteTable() {
  const registry = new RouteRegistry();

  const sessionsDay = registry.register(
    new SessionsDayRoute({
      name: "sessions.day",
      pattern: `/sessions/:isoDate(${ISO_DATE})`,
      viewId: "clients",
    }),
  );

  // The dashboard is the app's home. Both spellings rewrite to the dated route so that what is in the
  // address bar always names the day being looked at.
  const toToday = {
    target: sessionsDay,
    paramsFor: (ctx) => ({
      isoDate: ctx.deps.getISODateForColumn ? ctx.deps.getISODateForColumn("today") : "",
    }),
  };
  registry.register(new RedirectRoute({ name: "home", pattern: "/", ...toToday }));
  registry.register(new RedirectRoute({ name: "home.index", pattern: "/index.html", ...toToday }));

  registry.register(
    new WorkoutSetupRoute({
      name: "session.new",
      pattern: "/session/new",
      viewId: "workout-setup",
    }),
  );
  // A pre-existing alias. Kept because links to it are already in the wild; patterns are additive.
  registry.register(
    new WorkoutSetupRoute({
      name: "session.newAlias",
      pattern: "/sessions/new",
      viewId: "workout-setup",
    }),
  );
  registry.register(
    new WorkoutSetupRoute({
      name: "session.setup",
      pattern: "/session/setup/:bookingId",
      viewId: "workout-setup",
    }),
  );

  registry.register(
    new SessionRoute({
      name: "session.edit",
      pattern: "/session/:sessionId/client/:clientId/edit",
      mode: "edit",
    }),
  );
  // `superset` is the pre-rename spelling of the circuit segment. It stays matched forever: links are
  // shared and bookmarked, and a URL that once worked must not start showing an error page. Patterns
  // are additive — removing one is a breaking change that needs a redirect left in its place.
  registry.register(
    new SessionRoute({
      name: "session.focus",
      pattern:
        "/session/:sessionId/client/:clientId/:focusType(exercise|circuit|superset)/:focusId",
      mode: "focus",
    }),
  );
  registry.register(
    new SessionRoute({
      name: "session.client",
      pattern: "/session/:sessionId/client/:clientId",
    }),
  );
  registry.register(new SessionRoute({ name: "session", pattern: "/session/:sessionId" }));

  registry.register(
    new ViewRoute({
      name: "clients",
      pattern: "/clients",
      viewId: "client-directory",
      render: (ctx) => ctx.deps.renderClientsList?.(),
    }),
  );
  registry.register(
    new ClientDetailRoute({ name: "client.detail", pattern: "/clients/:clientId" }),
  );

  registry.register(
    new ViewRoute({ name: "adjustments", pattern: "/adjustments", viewId: "adjustments" }),
  );
  registry.register(new ViewRoute({ name: "routines", pattern: "/routines", viewId: "routines" }));
  registry.register(
    new ViewRoute({ name: "exercises", pattern: "/exercises", viewId: "exercises" }),
  );
  registry.register(new ViewRoute({ name: "history", pattern: "/history", viewId: "history" }));

  return registry;
}
