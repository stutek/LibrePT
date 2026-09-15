// src/modules/common/formDraft.js — what a half-filled form remembers across a reload (TODO §38.12).
//
// Single responsibility: hold one form's typed values while the page is open, put them back when the
// same form comes up again. The owner forgets them only after a successful save. It knows nothing about
// clients, intake or the app's own store — a form and a key are the whole interface.
//
// **Why it exists.** Reported 2026-08-29: "kadar se izpolnjujejo obrazci in se zgodi page reload
// poskrbi, da se vsebina vnosnih polj ohrani". Measured first, on the client's intake page: type a
// name, an email and a phone number, reload, and all three are gone. On a gym floor a reload is not
// a rare accident — it is a locked phone, a browser reclaiming memory, a mis-tap on the address bar.
// Losing a long form to any of those is the app throwing away work somebody did by hand.
//
// **sessionStorage, never localStorage, and that distinction is the product decision** (§38.12). The
// client's intake page is the one surface whose user is not the trainer, and it promises that
// nothing is kept on their phone. A draft that outlived the tab would break that promise outright; a
// draft that dies with the tab keeps its substance — close the page and it is gone — while surviving
// the reload that was losing people's work. The page's own wording was changed with this, because
// the old sentence ("Nothing is saved on this phone") stopped being true the moment anything was
// written at all, and a promise that is nearly true is worse than one that is exact.
//
// **Consent is never restored.** A ticked consent box put back by a script is a person agreeing to
// something without being asked, on a page they have just reloaded — the one field where "carry on
// where you left off" is the wrong answer. Any field can opt out the same way, with
// `data-draft="never"`, and the consent checkbox is the reason the attribute exists.
//
// **A file input is not restorable and is not attempted**: a browser will not let a page put a file
// back on an input, for good reasons, and a form that came back with every field but the attachment
// would be worse than one that came back empty — the person cannot see what is missing.
//
// Injected dependencies: `storage` (defaults to `sessionStorage`) so tests can hand it a plain
// object, and so a browser that refuses storage entirely degrades to no drafts rather than throwing.
// Trainer-owned forms use trainerFormDraft.js, whose durable workspace bucket is intentionally a
// separate lifecycle and storage policy.

const PREFIX = "librept_draft:";

/** Fields whose value is worth keeping: named, not a file, not opted out. */
function draftableFields(form) {
  const fields = form.matches("input, textarea, select")
    ? [form]
    : [...form.querySelectorAll("input, textarea, select")];
  return fields.filter(
    (field) =>
      Boolean(field.dataset.draftKey || field.id || field.name) &&
      field.type !== "file" &&
      field.type !== "password" &&
      field.type !== "hidden" &&
      !field.readOnly &&
      field.dataset.draft !== "never",
  );
}

const fieldKey = (field) => field.dataset.draftKey || field.id || field.name;
const isTicked = (field) => field.type === "checkbox" || field.type === "radio";

/** What the form holds right now, as a plain object a JSON round-trip can carry. */
export function readFormDraft(form) {
  const values = {};
  for (const field of draftableFields(form)) {
    if (field.type === "radio") {
      values[fieldKey(field)] ??= { radio: null };
      if (field.checked) values[fieldKey(field)] = { radio: field.value };
    } else values[fieldKey(field)] = isTicked(field) ? field.checked : field.value;
  }
  return values;
}

/** Puts remembered values back, and fires the events a typed value fires.
 *
 * The events matter: several forms in this app decide what to show from what has been typed — the
 * intake invitation reads a contact box to choose between a text message and an email — and a value
 * assigned in silence would leave those decisions made against an empty field.
 */
export function applyFormDraft(form, values) {
  if (!values) return;
  const keys = [...new Set(draftableFields(form).map(fieldKey))];
  for (const key of keys) {
    // A previous field's change handler may have rebuilt this field. Find the live node again.
    for (const field of draftableFields(form).filter((candidate) => fieldKey(candidate) === key)) {
      const remembered = values[fieldKey(field)];
      if (remembered === undefined) continue;
      if (field.type === "radio") field.checked = remembered?.radio === field.value;
      else if (isTicked(field)) field.checked = Boolean(remembered);
      else field.value = remembered;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

/** Reads one stored draft. A browser that refuses storage (private windows, blocked site data) is
 *  answered with "no draft" rather than an exception — the form still works, it just forgets. */
export function loadFormDraft(key, storage = sessionStorage) {
  try {
    const stored = storage.getItem(PREFIX + key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveFormDraft(key, values, storage = sessionStorage) {
  try {
    storage.setItem(PREFIX + key, JSON.stringify(values));
  } catch {
    // Same reasoning as above, plus a full quota: a form that cannot be remembered is still a form.
  }
}

export function clearFormDraft(key, storage = sessionStorage) {
  try {
    storage.removeItem(PREFIX + key);
  } catch {
    // Nothing to do: the draft either never existed or cannot be reached, and both mean "gone".
  }
}

/**
 * Keeps `form` remembering what is typed into it, under the key `keyOf()` returns.
 *
 * `keyOf` is a FUNCTION, not a string, because one form serves several subjects: the client dialog
 * is "add a client" one moment and "edit Jane" the next, and a draft that did not know the
 * difference would spill half of Jane's details into the next person's form.
 *
 * Returns `{ restore, forget }`. Restoring is the CALLER's call rather than something that happens
 * here on mount: a dialog fills itself from the store when it opens, and the draft has to land after
 * that or the saved values would overwrite the unsaved ones — the wrong way round.
 */
export function keepFormDraft(form, keyOf, { storage = sessionStorage } = {}) {
  if (!form) return { restore: () => {}, forget: () => {} };

  let restoring = false;
  const remember = () => {
    if (!restoring) saveFormDraft(keyOf(), readFormDraft(form), storage);
  };
  // `input` for typing, `change` for the ones that never fire `input` — a select, a checkbox.
  form.addEventListener("input", remember);
  form.addEventListener("change", remember);
  // Submission may fail validation or persistence. Only the caller knows it succeeded.

  return {
    restore: () => {
      restoring = true;
      try {
        applyFormDraft(form, loadFormDraft(keyOf(), storage));
      } finally {
        restoring = false;
      }
    },
    forget: () => clearFormDraft(keyOf(), storage),
  };
}
