// src/controllers/routes/routeTable.js — every addressable state of the app, in one readable list.
// Single responsibility: the route DATA. The machinery lives in route.js / routeRegistry.js and the
// subclasses; nothing here should need a code path of its own.
//
// Patterns are stored WITHOUT the base path: toUrl() prepends BASE_PATH, which is derived from
// import.meta.url. That is what makes every route version-agnostic — the same pattern resolves
// wherever the app happens to be hosted, and no route may ever name a version.

import { DialogRoute, GlobalDialogRoute } from "./dialogRoute.js";
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

  const sessionEdit = registry.register(
    new SessionRoute({
      name: "session.edit",
      pattern: "/session/:sessionId/client/:clientId/edit",
      mode: "edit",
    }),
  );
  // The editor with one row called out. Inserting or swapping a row names it here, so a reload lands
  // the trainer back on the row they were in the middle of instead of an undifferentiated plan.
  registry.register(
    new SessionRoute({
      name: "session.edit.item",
      pattern: "/session/:sessionId/client/:clientId/edit/exercise/:slotId",
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
        "/session/:sessionId/client/:clientId/:focusType(exercise|circuit|rest|superset)/:focusId",
      mode: "focus",
    }),
  );
  const sessionClient = registry.register(
    new SessionRoute({
      name: "session.client",
      pattern: "/session/:sessionId/client/:clientId",
    }),
  );
  registry.register(new SessionRoute({ name: "session", pattern: "/session/:sessionId" }));

  // The taxonomy picker, which hangs off a live session. It adds no new class of exposure — the
  // client id is already in the parent URL — and a browse the trainer is mid-way through is exactly
  // the kind of state a reload should restore.
  //
  // `#dialog-add-session-exercise` is deliberately NOT routed: its only button lives in a
  // `display: none !important` container and the editor never calls its opener, so the dialog is
  // unreachable and a route for it would be dead code (see TODO §19).
  registry.register(
    new DialogRoute({
      name: "session.catalog",
      parent: sessionEdit,
      segment: "/catalog",
      dialogId: "dialog-catalog-picker",
      open: (ctx) => ctx.deps.openCatalogPicker?.({}),
    }),
  );
  registry.register(
    new DialogRoute({
      name: "session.catalog.slot",
      parent: sessionEdit,
      segment: "/catalog/slot/:slotId",
      dialogId: "dialog-catalog-picker",
      open: (ctx) => ctx.deps.openCatalogPicker?.({ slotId: ctx.params.slotId }),
    }),
  );

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

  const adjustments = registry.register(
    new ViewRoute({ name: "adjustments", pattern: "/adjustments", viewId: "adjustments" }),
  );
  const routines = registry.register(
    new ViewRoute({ name: "routines", pattern: "/routines", viewId: "routines" }),
  );
  const exercises = registry.register(
    new ViewRoute({ name: "exercises", pattern: "/exercises", viewId: "exercises" }),
  );
  registry.register(new ViewRoute({ name: "history", pattern: "/history", viewId: "history" }));

  // Record editors. Each opens over its own list view, so Back returns to the list and a cold link
  // shows the record in context rather than a dialog floating on a blank shell.
  registry.register(
    new DialogRoute({
      name: "routine.new",
      parent: routines,
      segment: "/new",
      dialogId: "dialog-routine",
      open: (ctx) => ctx.deps.openRoutineCreateDialog?.(),
    }),
  );
  registry.register(
    new DialogRoute({
      name: "routine.edit",
      parent: routines,
      segment: "/:routineId",
      dialogId: "dialog-routine",
      open: (ctx) => ctx.deps.openRoutineEditor?.(ctx.params.routineId),
    }),
  );
  registry.register(
    new DialogRoute({
      name: "exercise.new",
      parent: exercises,
      segment: "/new",
      dialogId: "dialog-exercise",
      open: (ctx) => ctx.deps.openExerciseCreateDialog?.(),
    }),
  );
  // Keyed on the update being resolved, not on the client it belongs to.
  registry.register(
    new DialogRoute({
      name: "adjustment.apply",
      parent: adjustments,
      segment: "/:updateId",
      dialogId: "dialog-apply-adjustment",
      open: (ctx) => ctx.deps.openAdjustmentWizard?.(ctx.params.updateId),
    }),
  );

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
