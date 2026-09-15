// src/modules/common/dom.js - DOM and Modal lifecycle helpers for DRY component handling

export function $id(id) {
  return document.getElementById(id);
}

/** Is this tap on the GUIDE rather than on the app?
 *
 * Every "tap outside closes me" rule in this app — the ☰ menu, the session menu, the plan editor —
 * means "outside the thing you are working on". The guided demo floats its panel and its story card
 * over the app, and a tap on those is the trainer working the guide, not dismissing what the guide
 * is pointing at. Three separate rules learned this on 2026-08-22, one bug each: the plan editor
 * closed under Show me, and the menus closed themselves so the next step pointed at an item that
 * was no longer on screen.
 *
 * Declared here, once, because the next surface with a tap-outside rule will have the same
 * question and no reason to know the answer. Pinned by
 * tests/medium/test_guide_is_not_the_app.py, which tests the TAP rather than a demo flow — the
 * demo's own walk did not catch this, because it taps Show me at moments where the closure happens
 * to do no harm.
 */
export function isGuideSurface(target) {
  return Boolean(target?.closest?.("#walkthrough-overlay, #demo-narrator-card"));
}

export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

export function openModal(modalId, { resetForm = false, formId = null } = {}) {
  const modal = document.getElementById(modalId);
  if (!modal) return null;
  if (resetForm) {
    const form = formId ? document.getElementById(formId) : modal.querySelector("form");
    if (form) form.reset();
  }
  modal.showModal();
  document.dispatchEvent(new CustomEvent("formdraftopen", { detail: modalId }));
  return modal;
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal && typeof modal.close === "function") {
    modal.close();
  }
  return modal;
}

export function renderMarkupOnce(containerId, existsCheckFn, html) {
  const root = document.getElementById(containerId);
  if (!root || existsCheckFn(root)) return;
  root.insertAdjacentHTML("beforeend", html);
}
