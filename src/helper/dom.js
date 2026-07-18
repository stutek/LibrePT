// src/helper/dom.js - DOM and Modal lifecycle helpers for DRY component handling

export function $id(id) {
  return document.getElementById(id);
}

export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

export function openModal(modalId, { resetForm = false, formId = null } = {}) {
  const modal = document.getElementById(modalId);
  if (!modal) return null;
  if (resetForm) {
    const form = formId ? document.getElementById(formId) : modal.querySelector('form');
    if (form) form.reset();
  }
  modal.showModal();
  return modal;
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal && typeof modal.close === 'function') {
    modal.close();
  }
  return modal;
}
