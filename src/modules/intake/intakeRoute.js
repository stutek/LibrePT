// src/modules/intake/intakeRoute.js — is this visitor a prospective client, and what language do they
// read? (TODO §1.7/§26)
//
// Single responsibility: the two pure questions app.js asks before it decides which boot to run. Kept
// out of the router deliberately — the router is part of the trainer's app, and the whole point of the
// intake path is that none of that has started yet.
//
// **Matched on the path, not a query parameter.** `/intake` is a URL a trainer prints on a leaflet or
// puts behind a QR code on a gym wall (§1.7), so it has to be short, typeable, and obviously about
// signing up. A `?intake=1` on the app's root would be neither, and would also boot the trainer's app
// first and the form second.
//
// deps: none — pure string functions.

const INTAKE_SEGMENT = "/intake";

/** True for the intake page at any base path, with or without a trailing slash — the app is hosted
 *  under `/LibrePT/` on Pages and at `/` in local dev, and a client's typed URL may end either way. */
export function isIntakeLocation(pathname = "") {
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith(INTAKE_SEGMENT);
}

/**
 * The language the form — and therefore the consent record — is in.
 *
 * A trainer's QR may name it (`?lang=sl`), and otherwise the client's own device is a far better guess
 * than the app's default: this is the first surface in LibrePT read by someone who never chose a
 * language in it, and their phone already knows. Anything unrecognised falls back to English rather
 * than rendering i18n keys.
 *
 * The client can still change it on the page, because the guess decides what wording their consent is
 * stamped with and only they can say whether they can read it.
 */
export function resolveIntakeLang(requested, deviceLanguages = [], supported = ["en", "sl"]) {
  const wanted = typeof requested === "string" ? requested.toLowerCase() : "";
  if (supported.includes(wanted)) return wanted;

  const candidates = Array.isArray(deviceLanguages) ? deviceLanguages : [deviceLanguages];
  for (const candidate of candidates) {
    // "sl-SI" and "sl" are the same reader; a region subtag never changes which dictionary applies.
    const base = String(candidate || "")
      .toLowerCase()
      .split("-")[0];
    if (supported.includes(base)) return base;
  }
  return supported[0];
}
