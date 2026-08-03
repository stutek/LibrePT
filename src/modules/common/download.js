// src/modules/common/download.js
// One blob-anchor pattern for triggering a client-side file download, shared by every export
// action (JSON backup, calendar invites) so each caller doesn't reimplement it.

export function downloadFile(contents, filename, mimeType) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
