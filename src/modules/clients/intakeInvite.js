// src/modules/clients/intakeInvite.js — the link a trainer sends someone so they can fill in their
// own details (TODO §26.3).
//
// Single responsibility: build that link and get it out of the app. No records are created here —
// nothing exists until the person sends their details back and the trainer accepts them
// (modules/clients/signupReviewDialog.js), which is the trust boundary §26.5 is built around.
//
// **Why a link at all, when §26 planned a QR.** The QR is the leaflet-on-the-wall case and is still
// unbuilt; a link is the case that happens far more often — a trainer texting someone who just asked
// about training. Both land on the same page, and neither needs a server.
//
// **The message says what the link is for.** A bare URL in a text message is indistinguishable from
// a phishing attempt, and the person receiving it has usually just met the trainer once.
//
// **The language is the CLIENT's.** A link naming one opens the intake page in it; a link naming
// none lets the visitor's own phone decide (modules/intake/intakeRoute.js), which is a better guess
// than the trainer's app language.
//
// Injected dependencies: `platform` = { canShare, share, copy } and `t`.

import { PUBLIC_SITE_URL } from "../../data/publicUrls.js";

/** The browser's own sharing and clipboard, wrapped so nothing above touches `navigator`. */
export function browserInvitePlatform() {
  return {
    canShare: () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    share: (data) => navigator.share(data),
    copy: (text) => navigator.clipboard.writeText(text),
  };
}

export function intakeInviteUrl({ lang } = {}) {
  const base = `${PUBLIC_SITE_URL}/intake`;
  return lang ? `${base}?lang=${encodeURIComponent(lang)}` : base;
}

export function intakeInviteMessage({ url, t }) {
  return `${t("intake_invite_message")} ${url}`;
}

/** Sends the link the way the device can: the share sheet if there is one, the clipboard otherwise.
 *
 * Returns what actually happened — "shared", "copied" or "cancelled" — because a cancelled share is
 * a decision rather than a failure, and reporting it as sent is the one outcome that costs a client
 * their appointment. Same distinction signupDelivery.js makes on the other side of this flow.
 */
export async function sendIntakeInvite({ platform, t, lang } = {}) {
  const url = intakeInviteUrl({ lang });
  const text = intakeInviteMessage({ url, t });
  if (platform?.canShare?.()) {
    try {
      await platform.share({ text, url });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
      // Anything else is the share sheet failing, not the trainer declining — fall through to the
      // clipboard rather than leaving them with nothing.
    }
  }
  try {
    await platform?.copy?.(text);
    return "copied";
  } catch {
    // A browser is allowed to refuse the clipboard — it does so headlessly, and it does so on some
    // phones without a fresh user gesture. Leaving the trainer with nothing at all is the one
    // outcome that has to be impossible, so the caller shows them the link to copy by hand.
    return "unavailable";
  }
}
