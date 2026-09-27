// src/modules/common/libraryTabs.js — the two tabs that make the exercise library and the routines
// one place: the ☰ menu's *Exercises and routines* opens the library, and the tab row on both views
// moves between them.
//
// Single responsibility: the tab row's markup and its taps. The two views stay separate views with
// their own routes (`/exercises`, `/routines`), so a link, a reload and Back behave as before; this
// only puts the way between them on both screens.
//
// Links rather than buttons, so each tab is a real address a trainer can open in a new tab — and the
// tap is routed in place, like the app name in the header, so an ordinary tap does not reload the app.

const TABS = [
  { key: "exercises", route: "exercises", label: "tab_exercises", text: "Exercises" },
  { key: "routines", route: "routines", label: "tab_routines", text: "Routines" },
];

/** The tab row, with `active` marked as the page the trainer is on. */
export function libraryTabsHtml(active) {
  const tabs = TABS.map(
    ({ key, route, label, text }) =>
      `<a class="library-tab" href="${route}" data-library-tab="${route}"${
        key === active ? ' aria-current="page"' : ""
      }><span data-i18n="${label}">${text}</span></a>`,
  ).join("");
  return `<nav class="library-tabs" data-i18n-label="menu_library" aria-label="Exercises and routines">${tabs}</nav>`;
}

/** Route a plain tap on a tab in place. A modified click (new tab, new window) is left to the
 *  browser, since that is what it asks for. */
export function wireLibraryTabs(view, navigateToPath, urlFor) {
  view?.querySelector(".library-tabs")?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-library-tab]");
    if (!tab || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    navigateToPath(urlFor(tab.dataset.libraryTab));
  });
}
