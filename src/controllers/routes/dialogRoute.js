// src/controllers/routes/dialogRoute.js — an app state that is a <dialog> layered over a view.
// Single responsibility: keep a dialog's open/closed state and the URL saying the same thing.
//
// A dialog IS a state a reload should restore, so it gets a route. Two consequences follow, and both
// are the point rather than side effects: Back closes the dialog (the universal dismiss gesture on a
// phone, where this app lives), and a shared link can open one.
//
// Openers move to the router; CLOSERS DO NOT CHANGE. `close` does not bubble, but it does reach a
// capturing listener on document, so one hook in routerController turns every existing `.close()`
// call — the ✕, Cancel, Escape, a save handler — into the history pop that matches it. See
// docs/ROUTING.md.

import { Route } from "./route.js";

export class DialogRoute extends Route {
  // `parent`   — the route whose view sits underneath, rendered first so the dialog is never the
  //              whole screen. By default the pattern is the parent's plus `segment`, which makes
  //              our params a superset of the parent's; `pattern` overrides that for a dialog that
  //              hangs off the app root instead (see GlobalDialogRoute).
  // `open`     — (ctx, el) => void: populate the dialog before it is shown.
  // `close`    — optional teardown before .close() when routing away.
  // `ownable`  — false leaves the dialog alone entirely: it is on screen for a reason the URL does
  //              not describe (the mandatory first-run agreement), and Back must not dismiss it.
  constructor({
    name,
    parent,
    segment,
    pattern = null,
    dialogId,
    open = null,
    close = null,
    ownable = () => true,
    parentParams = (ctx) => ctx.params,
  }) {
    super({
      name,
      pattern: pattern ?? `${parent.pattern === "/" ? "" : parent.pattern}${segment}`,
      viewId: parent.viewId,
      headerActions: parent.headerActions,
      hidesSessionOverlay: parent.hidesSessionOverlay,
    });
    this.parent = parent;
    this.dialogId = dialogId;
    this.openDialog = open;
    this.closeDialog = close;
    this.ownable = ownable;
    this.parentParams = parentParams;
  }

  // The URL of the view underneath — what Back returns to, and what a cold deep link into this
  // dialog has to synthesise an entry for.
  parentUrl(ctx) {
    return this.parent.build(this.parentParams(ctx));
  }

  enter(ctx) {
    const params = this.parentParams(ctx);
    this.parent.enter({ ...ctx, route: this.parent, params });

    const el = document.getElementById(this.dialogId);
    if (!el) return this;
    // Not ours to drive: leave it exactly as it is, and claim no history.
    if (!this.ownable(el)) return this;
    this.openDialog?.(ctx, el);
    if (!el.open) el.showModal();
    // Marks the dialog as the one the URL currently names, which is what the close-capture hook
    // checks before popping: a dialog opened outside the router must not move history.
    el.dataset.routeName = this.name;
    return this;
  }

  exit(ctx) {
    const el = document.getElementById(this.dialogId);
    if (!el || el.dataset.routeName !== this.name) return;
    this.closeDialog?.(ctx, el);
    if (el.open) {
      // Tells the close-capture hook that this close IS the navigation, so it does not pop again.
      el.dataset.routeClosing = "1";
      el.close();
      delete el.dataset.routeClosing;
    }
    delete el.dataset.routeName;
  }
}

// A dialog reachable from every view (About, Terms, Build info, Backup), so it has no one parent:
// its pattern is the bare segment, and the view underneath is whatever the trainer was already
// looking at. Only a cold boot needs a backdrop painted, and the dashboard is the sensible one.
export class GlobalDialogRoute extends DialogRoute {
  constructor({ segment, home, ...dialogOptions }) {
    super({
      ...dialogOptions,
      segment,
      pattern: segment,
      parent: home,
      parentParams: (ctx) => ({ isoDate: ctx.deps.getISODateForColumn?.("today") ?? "" }),
    });
  }

  enter(ctx) {
    // Reopening About from the exercise library must not bounce the trainer to the dashboard behind
    // the dialog — so the parent view is painted only when there is no view yet.
    if (ctx.previousRoute) {
      const el = document.getElementById(this.dialogId);
      if (!el || !this.ownable(el)) return this;
      this.openDialog?.(ctx, el);
      if (!el.open) el.showModal();
      el.dataset.routeName = this.name;
      return this;
    }
    return super.enter(ctx);
  }
}
