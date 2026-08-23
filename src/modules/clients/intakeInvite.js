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
// Injected dependencies: `platform` = { canShare, share, copy }, `t`, and `trainer` — who signs the
// message. Injected rather than read here: this module is a browser away from `localStorage`, and a
// default that reached for it would make every caller depend on a browser having one.

import { PUBLIC_SITE_URL } from "../../data/publicUrls.js";
import { contactChannelFor, dialledForm } from "../../domain/contactChannel.js";

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

/** The message the invitation travels in, signed by the trainer when the install knows who they are.
 *
 * **Signed, because the person receiving it has usually met the trainer once.** A bare URL in a text
 * is indistinguishable from phishing; a URL under a name and a number is somebody they just spoke
 * to. The number is also the practical half of "can the invitation carry your contact?" (asked
 * 2026-08-23): neither `sms:` nor `mailto:` can attach a vCard, but a number written in a message
 * is tappable on both phones and reaches the address book in two taps.
 *
 * Nothing is added when the trainer has not filled their details in — those exist for calendar
 * invites (data/trainerIdentity.js) and are not required — because a signature reading "— ," is
 * worse than none.
 */
export function intakeInviteMessage({ url, t, trainer } = {}) {
  const signature = [trainer?.name, trainer?.phone].filter(Boolean).join(", ");
  return signature
    ? `${t("intake_invite_message")} ${url}\n\n— ${signature}`
    : `${t("intake_invite_message")} ${url}`;
}

/** Sends the link the way the device can: the share sheet if there is one, the clipboard otherwise.
 *
 * Returns what actually happened — "shared", "copied" or "cancelled" — because a cancelled share is
 * a decision rather than a failure, and reporting it as sent is the one outcome that costs a client
 * their appointment. Same distinction signupDelivery.js makes on the other side of this flow.
 */
export async function sendIntakeInvite({ platform, t, lang, trainer } = {}) {
  const url = intakeInviteUrl({ lang });
  const text = intakeInviteMessage({ url, t, trainer });
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

/** The link ready to send to one person, by the channel their contact implies (TODO §26.3 step 2).
 *
 * Returns `null` when there is nothing to send to yet, so a caller has one thing to check before
 * offering the control — an anchor with no href is the shape the consent section already uses for
 * "there is a way to send this, you just have no number for them yet".
 *
 * **Why a link the trainer taps rather than a send the app performs.** Neither `sms:` nor `mailto:`
 * sends anything: they open the phone's own composer with the message already in it, and the
 * trainer presses send there. That is the honest arrangement — the message leaves from their own
 * number or address, lands in their own sent items, and this app never touches a carrier or a
 * mail server.
 */
export function intakeInviteHref({ contact, lang, t, trainer } = {}) {
  const channel = contactChannelFor(contact);
  if (!channel) return null;
  const text = intakeInviteMessage({
    url: intakeInviteUrl({ lang }),
    t,
    trainer,
  });
  if (channel === "sms") {
    // `?&body=` rather than `?body=`: iOS only honours the body after a leading `&`, Android takes
    // either. The same one form the consent letter settled on (modules/common/consentForm.js).
    return { channel, href: `sms:${dialledForm(contact)}?&body=${encodeURIComponent(text)}` };
  }
  const subject = encodeURIComponent(t("intake_invite_subject"));
  return {
    channel,
    href: `mailto:${encodeURIComponent(contact.trim())}?subject=${subject}&body=${encodeURIComponent(text)}`,
  };
}
