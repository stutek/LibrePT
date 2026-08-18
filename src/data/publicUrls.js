// src/data/publicUrls.js — the addresses this app has in the world, declared once.
//
// Single responsibility: two strings that appear in several unrelated surfaces and must agree — the
// deployed site, and the issue tracker.
//
// **Why they live together and why here.** They were spelled out in five places (the consent letter's
// links, the crash reporter, two pieces of header markup, and the generated landing page), which is the
// shape of a value with no home: nothing wrong until the repository moves, and then four of the five get
// updated. `data/` because both are facts about the deployment rather than about any feature, and every
// layer above may read down to them.
//
// **Absolute, deliberately.** A relative link is meaningless the moment it leaves the app — in an email
// a client opens on their own phone, or in a GitHub issue read on a laptop. That is the same reasoning
// consentForm.js has always carried for its notice links.
//
// deps: none.

/** Where the app is deployed. Used by anything a person opens somewhere other than in the app. */
export const PUBLIC_SITE_URL = "https://stutek.github.io/LibrePT";

/** Where a bug report goes. Not everyone has an account here — see TODO §23.5, which is about the
 *  people who do not. */
export const ISSUE_TRACKER_URL = "https://github.com/stutek/LibrePT";
