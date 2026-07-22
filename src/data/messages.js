// data/messages.js
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
  // running on sample data and links to the clean-up procedure to follow before professional use.
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
      {
        labelKey: "notif_demo_mode_btn",
        url: "https://github.com/stutek/LibrePT/blob/main/README.md#resetting-to-a-clean-state",
        primary: false,
      },
    ],
  },
  // Welcome / interactive-demo invitation (TODO 9.3 & 11.1).
  {
    id: "demo-welcome",
    type: "welcome",
    icon: "fa-solid fa-sparkles",
    titleKey: "notif_welcome_title",
    descKey: "notif_welcome_desc",
    actions: [
      { labelKey: "notif_demo_btn", url: "https://stutek.github.io/LibrePT/", primary: true },
      { labelKey: "notif_walkthrough_btn", view: "/clients", primary: false },
    ],
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
