// src/controllers/routes/routeTable.js — every addressable state of the app, in one readable list.
// Single responsibility: the route DATA. The machinery lives in route.js / routeRegistry.js and the
// subclasses; nothing here should need a code path of its own.
//
// Patterns are stored WITHOUT the base path: toUrl() prepends BASE_PATH, which is derived from
// import.meta.url. That is what makes every route version-agnostic — the same pattern resolves
// wherever the app happens to be hosted, and no route may ever name a version.

import { GlobalDialogRoute } from "./dialogRoute.js";
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

  // Dialogs reachable from anywhere (the ☰ menu, the build stamp). Each is a state a reload should
  // restore and a link should be able to open, and routing them is what makes Back close them.
  for (const [name, segment, dialogId, open] of [
    ["about", "/about", "dialog-about", null],
    // The build stamp is read off the running app, and a stale import status must not greet the
    // next open — so both are refreshed before the dialog is shown, not when the page loaded.
    ["build", "/build", "dialog-build-info", (ctx) => ctx.deps.renderBuildInfo?.()],
    ["backup", "/backup", "dialog-backup", (ctx) => ctx.deps.prepareBackupDialog?.()],
  ]) {
    registry.register(new GlobalDialogRoute({ name, segment, dialogId, open, home: sessionsDay }));
  }

  registry.register(
    new GlobalDialogRoute({
      name: "terms",
      segment: "/terms",
      dialogId: "dialog-terms",
      home: sessionsDay,
      // The first-run agreement is mandatory: its ✕ is hidden and Escape is blocked
      // (applicationHeader.setupFirstRunTerms). It is a boot precondition, not a place the trainer
      // navigated to — so the router leaves it alone entirely rather than letting Back dismiss an
      // agreement that has not been accepted.
      ownable: (el) => !el.classList.contains("first-run"),
    }),
  );

  return registry;
}
