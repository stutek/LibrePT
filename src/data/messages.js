// src/data/messages.js
// Default notification/message feed, seeded together with the rest of the demo dataset (see
// seedMockData in app.js). The notification area (components/notificationArea.js) renders from
// state.notifications, so a genuinely clean install has an empty feed — these appear only once
// the demo data is injected (?init=demo_data_load), together with it.
//
// Records store i18n *keys* (titleKey / descKey / actions[].labelKey) rather than literal text,
// so the feed re-localizes when the user switches language. Each action is either an external
// link (`url`) or an in-app navigation (`view`).

export const DEFAULT_MESSAGES = [
  // Demo-mode notice — first so it's the collapsed summary the user sees. Explains the app is
  // running on sample data, and its one action opens the cleanup screen (demoCleanupDialog.js),
  // which itemises what would go and what is kept. That screen IS the in-app answer to "what
  // counts as demo data here?", which is why the second action — an "About demo data" link to the
  // README on github.com — was dropped rather than repointed at a rendered page (TODO §3.12 left
  // this link to §9.x for exactly that reason): it sent a trainer with no GitHub account, possibly
  // with no signal, to a worse copy of a screen they were already one tap from.
  {
    id: "demo-mode-notice",
    type: "demo-mode",
    icon: "fa-solid fa-triangle-exclamation",
    titleKey: "notif_demo_mode_title",
    descKey: "notif_demo_mode_desc",
    actions: [
      {
        labelKey: "notif_demo_mode_reset_btn",
        resetDemo: true,
        primary: true,
      },
    ],
  },
  // Welcome card, shown alongside the seeded data (TODO §11.1).
  //
  // Its two original actions were both promises the app does not keep, and each is a shape worth
  // recognising again: "Explore Walkthrough" navigated to /clients, standing in for §9.5's
  // unbuilt walkthrough engine — the splash announces that one honestly, disabled and marked
  // "soon", and repeating a dead control down here would only cost thumb space. "Open Live Demo"
  // linked to the app's own public URL from inside the running app: a reload at best, and from any
  // other origin (a local build, a fork) a jump into a stranger's instance, away from the
  // trainer's own data — and dead without signal, in an offline-first app.
  //
  // What is left says what it does and goes where it says. The label names the destination, so it
  // cannot start over-promising again without someone editing the words.
  {
    id: "demo-welcome",
    type: "welcome",
    icon: "fa-solid fa-sparkles",
    titleKey: "notif_welcome_title",
    descKey: "notif_welcome_desc",
    actions: [{ labelKey: "notif_welcome_clients_btn", view: "/clients", primary: true }],
  },
  // Sample client spot reservation (TODO 11.1).
  {
    id: "spot-reservation-1",
    type: "reservation",
    icon: "fa-solid fa-calendar-check",
    titleKey: "notif_spot_res_title",
    descKey: "notif_spot_res_desc",
    actions: [],
  },
  // Sample spot cancellation (TODO 11.1).
  {
    id: "spot-cancellation-1",
    type: "cancellation",
    icon: "fa-solid fa-calendar-xmark",
    titleKey: "notif_spot_cancel_title",
    descKey: "notif_spot_cancel_desc",
    actions: [],
  },
];
