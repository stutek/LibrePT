// src/controllers/routes/sessionRoutes.js — the routes that resolve a record before they can render:
// the session-day dashboard, a live/recovered session, workout setup, and client detail.
// Single responsibility: turn route params into the one app call that restores that state.

import { Route } from "./route.js";

// `/sessions/:isoDate` — the day deck. Focuses the column the date belongs to, then the live card.
// Bookings carry no real date yet (TODO §4.3), so a date only ever resolves to one of the four
// relative columns; getColumnForISODate encodes exactly that limitation.
export class SessionsDayRoute extends Route {
  enter(ctx) {
    super.enter(ctx);
    const column = ctx.deps.getColumnForISODate
      ? ctx.deps.getColumnForISODate(ctx.params.isoDate)
      : "today";
    requestAnimationFrame(() => ctx.deps.focusSessionsColumn?.(column, "auto"));
    ctx.router.focusActiveSessionCard();
    return this;
  }
}

// `/session/new`, `/sessions/new`, `/session/setup/:bookingId` — the setup form. Despite its
// `…Modal` name, openWorkoutSetupModal switches to a full `#view-workout-setup`, so this is a view
// route, not a dialog route.
export class WorkoutSetupRoute extends Route {
  enter(ctx) {
    super.enter(ctx);
    ctx.deps.openWorkoutSetupModal?.(null, null, ctx.params.bookingId || null, false);
    return this;
  }
}

// `/session/:sessionId[/client/:clientId[/edit | /(exercise|superset)/:focusId]]`.
// One class, four registered instances: they differ only in which part of the focus the URL names, and
// showSessionView already owns the hard part (recover from cache, launch from a booking, or replay a
// history log — and the error view when the id matches none of them).
export class SessionRoute extends Route {
  constructor({ mode = "plain", ...routeOptions }) {
    // A session owns the overlay itself — showSessionView shows it on success and hides it on a miss —
    // so this route must not pre-hide it the way an ordinary view does.
    super({ headerActions: true, hidesSessionOverlay: false, ...routeOptions });
    this.mode = mode;
  }

  enter(ctx) {
    super.enter(ctx);
    const { sessionId, clientId = null, focusType, focusId } = ctx.params;
    // Legacy `superset` links resolve to the same focus as `circuit`; syncSessionFocusUrl then
    // rewrites the address bar to the current spelling, so an old link upgrades itself on arrival.
    const type = focusType === "superset" ? "circuit" : focusType;
    const focusRef = this.mode === "focus" ? { type, id: focusId } : null;
    ctx.router.showSessionView(sessionId, clientId, focusRef, { edit: this.mode === "edit" });
    return this;
  }
}

// `/clients/:clientId` — the client detail card. clientsViewShowDetails switches the view itself
// (and falls back to the error view for an unknown id), so viewId stays null here.
export class ClientDetailRoute extends Route {
  enter(ctx) {
    super.enter(ctx);
    ctx.deps.clientsViewShowDetails?.({
      clientId: ctx.params.clientId,
      state: ctx.deps.getState(),
      t: ctx.deps.t,
      showErrorView: ctx.router.showErrorView,
      switchView: ctx.router.switchView,
      openWorkoutSetupModal: ctx.deps.openWorkoutSetupModal,
    });
    return this;
  }
}
