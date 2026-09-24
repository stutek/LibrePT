// src/i18n/domMappings.js — translating the markup the app renders once and then lives with.
//
// Two mechanisms, and the difference matters. The TABLE below names a selector and a key, which is
// what an element needs when its own markup cannot carry the key — a third-party control, a node
// that is rebuilt from data, an attribute rather than text. The ATTRIBUTE (`data-i18n="key"`) is
// what somebody writing a template reaches for, because it sits on the element it is about and
// cannot drift from it the way a selector in another file can.
//
// **The attribute did nothing until 2026-08-30.** Twenty-seven elements carried one — the whole
// session editor, the client register's invite button, the clipboard's plan menu — and every one of
// them shipped its English placeholder text in every language, because no code ever read the
// attribute (reported as "na slovenski strani se včasih pojavlja angleški tekst", TODO §38.20). The
// keys were all there and all translated; nothing was asking for them.

/** Every element whose own markup names its translation key.
 *
 * Three attributes, because a control says three different things to a person: its text, the words a
 * field shows while it is empty, and what a screen reader is told about a button with only an icon
 * on it. All three were being written in English into markup that then never changed.
 */
function applyMarkupKeys(tDict) {
  for (const [selector, dataKey, set] of [
    // `replaceChildren` rather than `textContent =`: the same write, said as a call, because an
    // assignment inside an arrow is what the linter reads as a value being smuggled out of an
    // expression.
    ["[data-i18n]", "i18n", (element, value) => element.replaceChildren(value)],
    [
      "[data-i18n-placeholder]",
      "i18nPlaceholder",
      (element, value) => {
        element.placeholder = value;
      },
    ],
    [
      "[data-i18n-label]",
      "i18nLabel",
      (element, value) => element.setAttribute("aria-label", value),
    ],
  ]) {
    for (const element of document.querySelectorAll(selector)) {
      const value = tDict[element.dataset[dataKey]];
      // A key with no translation leaves the element alone rather than blanking it: the English in
      // the markup is a worse answer than the Slovenian, and both are better than nothing at all.
      if (value) set(element, value);
    }
  }
}

export function applyStaticDOMMappings(tDict) {
  if (!tDict) return;
  applyMarkupKeys(tDict);

  // Map of selector to translation key
  const staticMappings = {
    ".logo-area h1": "logo_title",
    "#preview-badge-label": "preview_badge",
    "#build-info-preview-text": "preview_warning",
    // Application (☰) header menu + About / Terms modals
    "#menu-label-lang": "menu_language",
    "#menu-label-theme": "menu_theme",
    "#menu-clients-register": "menu_clients_register",
    // Targets the text span, not the button: the button also carries a count badge sibling that
    // the icon-preserving replacement below would otherwise wipe out along with the icon+text.
    "#menu-adjustments-text": "menu_adjustments",
    "#menu-routines": "tab_routines",
    "#menu-exercises": "tab_exercises",
    "#menu-history": "tab_history",
    "#menu-connect-cloud": "menu_connect_cloud",
    "#menu-export-data": "menu_export_data",
    "#menu-github": "menu_github",
    "#menu-bug-report": "menu_bug_report",
    "#menu-about": "menu_about",
    "#menu-terms": "menu_terms",
    "#menu-privacy": "menu_privacy",
    "#about-title": "about_title",
    "#about-body": "about_body",
    "#about-repo-link": "about_repo",
    "#about-licenses-label": "about_licenses",
    "#terms-title": "terms_title",
    "#terms-body": "terms_body",
    "#btn-terms-agree": "terms_agree",
    "#notification-feed-title-text": "notif_summary_title",
    "#btn-mark-all-read-text": "notif_mark_all_read",

    // Dashboard / Clients view
    "#sessions-view-title": "sessions_schedule",
    "#pending-adjustments-title": "pending_adjustments",

    // The client directory and detail views carry their own keys in their markup (clientsView.js).

    // Routines View
    "#view-routines .view-header h2": "routines_title",
    "#btn-add-routine": "btn_create_routine",
    "#view-routines .view-desc": "routines_desc",

    // Exercises View
    "#view-exercises .view-header h2": "exercises_title",
    "#btn-add-exercise": "btn_add_exercise",
    '.filter-chips button[data-filter="All"]': "filter_all",
    "#exercises-filter-label": "muscle",

    // History View
    "#view-history .view-header h2": "history_title",
    "#view-history .view-desc": "history_desc",

    // Active session clipboard overlay
    "#btn-add-exercise-to-session": "btn_inject_exercise",
    "#btn-delete-session": "btn_delete_session",
    // NOT #btn-start-session: it is a glyph now (TODO §39.6), and its words live in `aria-label`
    // through `data-i18n-label`. It used to be wired through BOTH mechanisms at once — this table,
    // which keeps an icon and appends the label after it, and a `data-i18n` on the button, which
    // replaces the whole content. They disagreed on every boot and the second one won, so the play
    // glyph the markup has always declared was never on screen in either language.
    "#btn-finish-session": "btn_complete",

    "#dialog-add-session-exercise .modal-header h3": "add_ex_session_title",
    '#dialog-add-session-exercise label[for="session-add-select-ex"]': "select_exercise",
    '#dialog-add-session-exercise label[for="session-add-sets"]': "sets",
    '#dialog-add-session-exercise label[for="session-add-reps"]': "reps",
    '#dialog-add-session-exercise label[for="session-add-weight"]': "weight",
    '#dialog-add-session-exercise label[for="session-add-rest"]': "rest_seconds",
    '#dialog-add-session-exercise button[type="submit"]': "btn_inject",
    "#catalog-picker-title": "catalog_picker_title",

    // The feedback dialog carries its own keys in its markup (feedbackModal.js).

    // The Sync & Backup dialog carries its own keys in its markup (backupRestore.js).

    // Not-found (error) view
    "#error-view-title": "error_title",
    "#view-error .view-desc": "error_desc",
    "#btn-error-home": "btn_error_home",

    // Add Client modal
    // The client dialog is not here any more: since 2026-08-30 its markup carries its own keys
    // (data-i18n), and an element named in both places is an element two files disagree about —
    // this table said `client_name` where the label reads "Full Name *", and won, because it runs
    // second. One home each (§38.20).

    // GDPR consent block inside the client modal, and its archiving-reminder dialog. The two
    // delivery buttons are deliberately absent: their labels swap between "send" and "no address on
    // file" per client (clientConsentSection.js), so a static mapping would overwrite that state.
    "#client-consent-legend": "consent_legend",
    "#label-client-gdpr-consent": "consent_signed_label",
    "#label-client-consent-date": "consent_date_label",
    "#label-client-withdrawn-date": "consent_withdrawn_label",
    "#label-client-consent-lang": "consent_lang_label",
    "#btn-consent-info-text": "consent_info_button",
    "#consent-info-title": "consent_info_title",
    "#consent-info-body-text": "consent_info_body",
    "#btn-consent-info-close": "consent_info_ack",

    // The Routine Template dialog carries its own keys in its markup (routineFormsController.js);
    // its title is written by the create and edit paths.

    // The Custom Exercise dialog carries its own keys in its markup (exerciseFormsController.js).
  };

  for (const selector in staticMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const key = staticMappings[selector];
      const val = tDict[key];
      if (val) {
        const icon = el.querySelector("i");
        if (icon) {
          el.innerHTML = "";
          el.appendChild(icon);
          el.appendChild(document.createTextNode(` ${val}`));
        } else {
          el.textContent = val;
        }
      }
    }
  }

  // Update input placeholders
  const placeholderMappings = {
    "#search-routines": "placeholder_search_routines",
    "#search-exercises": "placeholder_search_exercises",
  };

  for (const selector in placeholderMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const key = placeholderMappings[selector];
      const val = tDict[key];
      if (val) {
        el.placeholder = val;
      }
    }
  }

  // Update screen-reader region labels
  const ariaMappings = {
    "#sessions-categories-grid": "sessions_schedule",
  };

  for (const selector in ariaMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const val = tDict[ariaMappings[selector]];
      if (val) {
        el.setAttribute("aria-label", val);
      }
    }
  }
}
