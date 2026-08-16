---
type: guidelines
title: LibrePT Google Cloud Setup Runbook
description: Maintainer runbook for the two Google Cloud setups LibrePT needs — the production OAuth client trainers consent to, and the stored credential the live API canary runs on.
status: active
tags:
  - google-cloud
  - oauth
  - setup
  - ci
  - guidelines
  - okf
---

# Google Cloud Setup — LibrePT

Maintainer runbook. **Account identities are deliberately not in this file** — it is a public
procedure, so the two accounts below are referred to by role. The mapping to real addresses is the
one thing kept out of version control, in the maintainer's private notes.

**This file contains no credential material and must stay that way.** Every value it names is either
public by design (the OAuth *client ID*, which Google's SPA flows ship in client code — see A7) or
lives only in a GitHub Actions secret. Nothing here is a client secret, a refresh token, or a
project ID.

Two independent setups. Either works without the other.

| | Who it serves | Credential | Where it lives |
| :--- | :--- | :--- | :--- |
| **Part A** — Production OAuth client | Trainers connecting their own Drive and Calendar | OAuth **client ID** — public, not a secret | Committed in `src/data/driveSyncConfig.js` |
| **Part B** — CI canary | The pipeline, checking Google has not changed their API | A real account's OAuth **refresh token** — genuinely secret | One GitHub Actions *secret*, `GOOGLE_LIVE_CREDENTIALS` |
| **Part B** — its Desktop client (B1) | Minting that refresh token, and nothing else | Client **ID + secret** — the secret is not a real one (B1), but it travels with the token | **Nowhere in this repo.** Read them off the Cloud Console when B2 asks; they end up inside the same Actions secret |

**No value above is restated in this file, on purpose.** Each has exactly one home, and a copy in
prose is a copy that goes stale the day it is rotated — the client ID in particular is *public*, so
the reason it is not reproduced here is drift, not secrecy. Look them up where the table says.

**Do Part A first** — it is what makes cross-device sync exist for users at all. Part B only protects
it from breaking silently later, and can be deferred indefinitely.

Background and the decisions behind all of this: [TODO.md](../TODO.md) §1.5.

## Accounts

Three roles, three real Gmail accounts. The addresses live in the private notes, not here.

| Role | What it is | Used for |
| :--- | :--- | :--- |
| `admin@` | A project-branded account, not a person | Owns the GCP project and is the consent screen's user support address |
| `canary@` | A dedicated throwaway, holding nothing | The identity the CI canary runs as — the only account whose refresh token is stored anywhere |
| `maintainer@` | The maintainer's own daily inbox | Google's developer contact for verification and deprecation notices, and the hand-test identity for A8 |

**A human test account IS needed, and this was learned the hard way (2026-08-12).** The canary was
built to run as a SERVICE account precisely so CI would never touch a person's data. That lasted one
run: Drive answered its `files.list` and returned **403** to the `appDataFolder` upload, because
Google removed service-account Drive storage quota. Neither remedy they publish applies — an
`appDataFolder` cannot live in a shared drive, and domain-wide delegation needs Workspace. **A
service account can read the Drive API and can never write to it**, so the canary runs as a real
account (Part B).

**`canary@` is a dedicated throwaway, created 2026-08-16**, and it is the right identity for Part B
even though `admin@` would work. The canary is the one place a long-lived refresh token is stored, so
the account it belongs to should own nothing else — `admin@` owns both GCP projects, and while the
grant could never administer them (an OAuth token carries only its scopes), an account holding
nothing is simply a smaller thing to lose. Running as `maintainer@` would also work and is the worst
option: a daily job holding a token on a personal account.

Google's signup anti-abuse blocked the first attempt at this account, rate-limiting per phone number,
which is why an earlier revision of this file said not to bother retrying. Retrying worked.

The exposure is bounded whichever account is used — the
grant is `drive.appdata` (a hidden folder holding one probe file, unreadable by any other app) plus
`calendar.freebusy` (busy/free intervals only, never an event body, and the suite asserts shape
without logging it).

What no account of either kind can cover is the CONSENT flow, since Google fingerprints and blocks
automated browsers on `accounts.google.com`. That check stays manual (A8), as `maintainer@`.

Revisit only when [TODO.md](../TODO.md) §1.3's room occupancy needs a genuine second calendar identity — "PT A
sees PT B as busy" cannot be tested from one account.

## Part 0 — Forward the admin inbox

The consent screen requires a user support email. **GitHub Issues remains the support channel**
([BUG_REPORTING.md](BUG_REPORTING.md)); this address exists because Google requires one, so it only has to reach
a human.

**Why `admin@` and not a dedicated support Google Group** (considered, dropped): the group only ever
solved one problem — the User support email field is a *picker* listing your own address plus groups
you own, so a standalone support address would not have been selectable without one.
Using `admin@` makes that moot, and the group's other benefits (multiple recipients, a thread archive)
do not apply to a one-maintainer project whose ticketing system is GitHub Issues. The remaining
weakness of `admin@` is cosmetic — it reads internal on a public screen — and a `@googlegroups.com`
address barely improves on that, since both say "free Google address". The real fix is
`support@<custom-domain>` once the domain is bought for verification anyway, so skip the detour.
Revisit only if a second person starts handling support.

Signed in as `admin@` → Gmail → ⚙️ **See all settings** → **Forwarding and POP/IMAP**:

1. **Add a forwarding address** → `maintainer@` → Next → Proceed
2. Confirm via the link Google mails to the personal inbox
3. Back in `admin@` settings, tick **Forward a copy of incoming mail to** → `maintainer@`
4. Keep Gmail's copy in the Inbox
5. **Save Changes** — easy to miss, and nothing above applies without it

This is what lets a project-branded address sit on the consent screen while landing somewhere read
daily.

---

# Part A — Production OAuth client

Signed in as `admin@` throughout.

## A1. Create the project

<https://console.cloud.google.com> → project dropdown → **New Project**

| Field | Value |
| :--- | :--- |
| Project name | `LibrePT` |
| Project ID | accept the generated one |
| Location / Organization | `No organization` |

**Create**, then confirm it is the selected project in the dropdown.

## A2. Enable two APIs

**APIs & Services → Library** — search, open, **Enable**, one at a time:

- **Google Drive API**
- **Google Calendar API**

**Nothing else.** Every enabled API is a permanent cost: attack surface, a line on the consent screen
a nervous trainer reads before granting, and more for Google to review at verification. Analytics and
Gmail were both considered and rejected — see "Rejected APIs" at the end.

## A3. Consent screen — every field

**APIs & Services → OAuth consent screen** (newer consoles: **Google Auth Platform**).

**The new console splits this across a short wizard and then four pages — do not expect one long
form.** The wizard asks only: App name + user support email → **Audience** → developer contact email
→ agree to the User Data Policy. Everything else is edited afterwards:

| Wizard / page | Fill in |
| :--- | :--- |
| Wizard 1 — App Information | App name `LibrePT`, user support email `admin@` |
| Wizard 2 — **Audience** | **External** (see below) |
| Wizard 3 — Contact Information | `maintainer@` — this is the *developer contact* |
| Wizard 4 — Finish | Agree to the User Data Policy |
| Then: **Branding** | Home page, privacy policy link, authorized domains, logo — table below |
| Then: **Audience** | Test users — step A4 |
| Then: **Data Access** | Scopes — step A5 |
| Then: **Clients** | The OAuth client — step A6 |

**Audience: External, and the choice is effectively forced.** *Internal* requires a Google Workspace
organization, which a consumer `gmail.com` account does not have. Do not confuse this axis with
publishing status: **Audience** is who may use the app (Internal = one Workspace domain / External =
any Google account), while **Publishing status** is Testing (≤100 listed test users, unverified-app
warning) vs Production (public, still unverified until a separate review). The operating state is
**External + In production (unverified)**. It permits up to 100 users without weekly refresh-token
rotation; verification is the later public-launch task that removes the warning and raises the cap.
Neither setting has any bearing on LibrePT's own demo mode (`?init=demo_data_load`), which is local
seed data and never contacts Google.

| Field | Value | Notes |
| :--- | :--- | :--- |
| App name | `LibrePT` | Shown on the consent screen |
| User support email | `admin@` | Dropdown; forwards to personal via Part 0 |
| App logo | **leave empty** | ⚠️ Uploading one triggers verification immediately |
| Application home page | `https://stutek.github.io/LibrePT/` | |
| Application privacy policy link | **leave empty** | Optional in Testing, required at verification — see below |
| Application terms of service link | leave empty | Optional |
| Authorized domains | `stutek.github.io` | Domain only — no scheme, no path. **Not `github.io`** — see below |
| Developer contact information | `maintainer@` | ⚠️ **Google's** channel for verification and deprecation notices — use the inbox read daily, not the support address |

**Save and Continue.**

**Authorized domain is `stutek.github.io`, one label deeper than usual.** Google requires a *top
private domain*, computed against the Public Suffix List — and `github.io` is itself on that list
(GitHub put it there so one Pages site cannot set cookies for another). So `github.io` is a public
suffix, not a registrable domain, and cannot be claimed; the registrable domain for this site is
`stutek.github.io`.

**Every branding URL's domain must also be an authorized domain, and must be one you can prove you
own.** This is what makes the privacy policy link awkward: pointing it at
`https://github.com/stutek/LibrePT/blob/main/PRIVACY.md` makes the form demand `github.com` as an
authorized domain ("Missing domain: github.com"), and while Google would accept it in the list, it
could never be verified — nobody here owns GitHub. The constraint is *not* that branding URLs share
one domain; several are fine, as long as each is listed and each is ours. Privacy and terms remain
empty until verification; before submitting it, serve a privacy page from a domain we control —
either `https://stutek.github.io/LibrePT/privacy.html` (a static page under `src/`, which the
integrity catalog, CSP and cache manifest all observe, so it needs a real commit and a full gate
run) or the custom domain once bought.

The same PSL fact is the verification risk noted in "Before public launch", seen from the other side.
It cuts slightly in our favour here: because `stutek.github.io` counts as a registrable domain, it
can be verified in Search Console as a URL-prefix property by uploading an HTML file to the Pages
site, which we control. Whether Google's OAuth *review* accepts a `github.io` subdomain is still
open — a custom domain resolves it. Treat the custom domain as a verification prerequisite, not a
reason to delay the already-published app.

## A4. Audience — test users (only while Testing)

**Audience** (older console: the *Test users* step). This list applies only while publishing status
is **Testing**. LibrePT is now In production, so it does not restrict grants; retain the two
addresses as known hand-test identities.

**+ Add Users**:

```
<the admin@ address>
<the canary@ address>
<the maintainer@ address>
```

Anyone not on this list gets `403: access_denied`. The cap is 100.

## A5. Data Access — scopes

**Data Access** (older console: *Scopes*) → **Add or remove scopes** → tick exactly two:

| Scope | Grants |
| :--- | :--- |
| `https://www.googleapis.com/auth/drive.appdata` | This app's hidden per-app folder only — invisible in the trainer's Drive UI and picker, unreachable by any other app's grant |
| `https://www.googleapis.com/auth/calendar.freebusy` | Busy intervals only — structurally cannot read an event's title, attendees, or location |

**Update** → **Save**.

⚠️ **Never widen these.** Do not add `drive`, `drive.file`, `drive.readonly`, `calendar`,
`calendar.readonly`, or `calendar.events`. The broad `drive*` scopes are Google's *restricted* tier,
which requires a paid annual third-party security assessment (CASA); these two avoid that tier
entirely. `calendar.freebusy` is also what makes §1.5's "no PT's session detail leaks to another"
enforced by Google rather than by our own restraint.

The sensitivity label the console shows beside each scope is authoritative — trust it over any list,
including this one.

**Scopes deliberately NOT requested yet.** Verification asks for a working demo justifying each
scope, so an unused one is a rejection risk. Adding a scope later does force existing users to
re-consent — cheap now with no users, and by the time it is not, a verification pass is happening
anyway. Add each in the same change that ships its feature:

| Scope | Add when |
| :--- | :--- |
| `calendar.app.created` | LibrePT creates session events in a calendar it owns. Narrow by construction — the app can only touch calendars it created, so it stays blind to the trainer's personal calendar (the Calendar analogue of `drive.appdata`). |
| `calendar.events` | Only if writing to a gym's *existing* shared calendar, which `app.created` cannot reach. Broad ("view and edit events on all your calendars") — avoid if `app.created` suffices. |
| `calendar.calendarlist.readonly` | Only for a "pick from your calendars" dropdown. The connected-calendars design pastes a calendar ID instead, which needs no scope at all — a cheap reason to keep pasting. |

Note what does *not* need a new scope: querying any number of gym or room calendars. The grant is
account-wide and the **request** names the calendar IDs, so `freeBusy.query` covers the whole
occupancy feature. What decides whether a given calendar answers is its sharing ACL, not our scope —
a gym calendar shared at "See only free/busy (hide details)" returns busy blocks with no titles,
attendees or locations, enforced by Google rather than by our restraint.

## A6. Create the client

**APIs & Services → Credentials → + Create Credentials → OAuth client ID**

| Field | Value |
| :--- | :--- |
| Application type | **Web application** |
| Name | `LibrePT web` |

**Authorized JavaScript origins** → **+ Add URI**, twice:

```
https://stutek.github.io
http://localhost:8081
```

**Authorized redirect URIs** → **leave completely empty**. The browser-side Google Identity Services
token flow does not use them; only server-side code flows do.

> ⚠️ An origin is **scheme + host + port, with no path**. It is `https://stutek.github.io`, *not*
> `https://stutek.github.io/LibrePT/` — a trailing path silently produces `origin_mismatch` at
> consent time. `127.0.0.1` is also a different origin from `localhost`; add it separately only if
> used.

**Create**, then copy the **Client ID** (ends `.apps.googleusercontent.com`).

## A7. Install the client ID

Paste it into `GOOGLE_DRIVE_CLIENT_ID` in `src/data/driveSyncConfig.js` and commit it. **It belongs
in version control, not in `.private/`**: a browser-app OAuth client ID is public by design (Google's
SPA flows ship it in client code), and the security boundary is the JavaScript-origins allowlist from
A6, which is held server-side by Google and cannot be forged. A blank value stays a supported
"not configured" state.

## A8. Verify by hand

Load `http://localhost:8081/LibrePT/`, sign in as `maintainer@`, tap Connect in
Sync & Backup. Expect an "unverified app" warning — normal until verification; continue via
**Advanced**.

| Error | Cause |
| :--- | :--- |
| `400: origin_mismatch` | A6 — a path or wrong port in the origin |
| `403: access_denied` | A4 — account not in test users |
| `403: access_not_configured` | A2 — API not enabled |

**The consent screen cannot be automated at all** — Google fingerprints and blocks driven browsers on
`accounts.google.com`, so this hand check is the only coverage that step will ever have.

---

# Part B — CI canary (stored credential)

**No second GCP project, no `gcloud`, no service account.** Everything below happens in **Part A's
project**, in the browser plus a terminal, and takes about fifteen minutes once.

Why it looks nothing like it did before: two designs that stored no secret were built here and both
failed for the same reason. Workload Identity Federation is elegant — GitHub's OIDC assertion
exchanged for a Google token at run time, nothing stored anywhere — but the only identity it can
produce is a **service account**, and Google removed service-account Drive storage quota. The first
live run listed `appDataFolder` successfully and got **403** on the upload. Their published remedies
miss this case: an `appDataFolder` cannot live in a shared drive, and domain-wide delegation needs
Workspace, not a consumer Gmail. Seeding the folder by hand does not work either — `appDataFolder`
is written only by the owning account passing `parents: ["appDataFolder"]`, so a manual upload is
the same refused request, and a file *shared* with the account lands in "Shared with me" where
`spaces=appDataFolder` will never see it.

A service account can therefore read the Drive API and can never write to it. Since the folder stays
permanently empty, download, update and the `modifiedTime` check go with the upload — the canary
would have been one call on its empty-result path. So: a real account's refresh token, in a GitHub
Actions secret. The cost is one long-lived credential; what bounds it is the grant itself —
`drive.appdata` reaches one hidden folder holding one probe file, `calendar.freebusy` returns busy
intervals and never an event body.

**Do B0 first.** Skipping it turns this into a weekly manual chore forever.

## B0. Publish the consent screen — do this before anything else

**APIs & Services → OAuth consent screen → Publishing status → PUBLISH APP.**

While the app is in *Testing*, Google expires every refresh token after **7 days** — and a refresh
token is not renewed by use. Exchanging it returns only a new access token, and the 7-day clock runs
from issuance. So in Testing, keeping the canary alive means redoing the browser consent, exchanging
a new code and re-uploading the secret **every week**, not re-uploading the same string.

Publishing ends that. Specifically:

| | Testing | In production (unverified) |
| :--- | :--- | :--- |
| Refresh token lifetime | **7 days** | until revoked / password change / 6 months unused |
| Who may grant | the ≤100 listed test users | anyone, still capped at 100 grants |
| Consent screen | unverified-app warning | unverified-app warning (identical) |
| Verification needed | no | **no** — that is a separate submission |

Publishing is *not* verification. It needs no review, no privacy-policy URL, and changes nothing a
user sees. Verification is the later step that removes the warning screen — see *Before public
launch* at the end of this file.

LibrePT is already In production, so no weekly rotation procedure applies. A missing or expired
credential is a failing canary, never a false green.

## B1. A second OAuth client — Desktop, not Web

Part A's client is a **Web application** using the browser implicit flow, which never issues a
refresh token. A second client in the same project fixes that, and staying in Part A's project is
deliberate: both clients share one consent screen, so the canary exercises the same scopes, the same
publishing status and the same test-user list real trainers meet.

**APIs & Services → Credentials → Create OAuth client ID → Application type: Desktop app**, name
`librept-canary-cli`. No origins or redirect URIs to configure — Desktop clients use the
out-of-band/loopback flows.

Leave that page open — B2 asks you to paste both values it shows you.

A Desktop client's "secret" is not a real secret by design — an installed app cannot keep one, and
Google's own docs say so. It is a client identifier, and the security boundary is the consent grant,
not this string. It still goes in the GitHub *secret* rather than a variable, because it travels
inside the same JSON as the refresh token.

## B2. Consent once, by hand

Decide **which account** first — use **`canary@`**, the dedicated throwaway. Being an ordinary Gmail
account it has the Drive storage quota a service account lacks, which is the whole reason this step
needs a human account at all; and holding nothing else, it is the smallest thing that can be lost if
the stored refresh token ever leaks.

The consent screen is **In production**, so `canary@` can grant without being on A4's test-user list.
Add it there anyway — the list costs nothing and is what would matter if the app ever returned to
Testing.

Run one command from the repository root:

```bash
.venv/bin/python -m agent_tools.google_credential
```

It asks for B1's client ID and secret (the secret is not echoed), opens the consent screen, catches
the redirect on a loopback listener, exchanges the code, checks the granted scopes and writes
`.private/google-live.json`. Approve in the browser **signed in as `canary@`**.

⚠️ **Grant exactly the two scopes it lists and nothing else.** The tool checks the grant against
`tokeninfo` before writing, and refuses on anything broader — a stray `drive` scope would keep every
Drive test green while production's narrow `drive.appdata` was broken, which is a canary reporting
confidence it has not earned. `tests/live/tokenScopes.live.test.mjs` enforces the same rule on every
run; the tool just moves the discovery from "some scheduled morning" to now.

Add `--no-browser` to print the URL instead of opening one, or `--port N` if 8765 is taken.

**Why a tool rather than the steps it replaces**: this used to be two shell exports, a 45-line
heredoc and a `curl` pipeline. Authorization codes are single-use, so writing one to a file between
steps meant any stumble after that — a mistyped secret, a stale shell — burned it and the remedy was
to start over. The exchange now happens in the same process, and the scopes are no longer retyped per
run. See [AGENT_RULES §6](../AGENT_RULES.md) and [agent_tools/INDEX.md](../agent_tools/INDEX.md).

If it reports **no refresh token**, this client already holds a live grant: revoke it at
<https://myaccount.google.com/permissions> and run the command again.

**Do not use Google's retired copy/paste (`urn:ietf:wg:oauth:2.0:oob`) flow** if you are minting one
by hand for any reason — it is blocked for apps in production. The loopback flow above is the
supported Desktop path.

`.private/` is gitignored and must stay that way; the tool also writes the file `0600`.

## B3. Prove it locally before touching CI

```bash
.venv/bin/python -c "from build import run_live_google_tests; run_live_google_tests()"
```

This is the same command the workflow runs, reading the same file. A green run here means the
credential, the scopes and the round trip all work — everything left is plumbing. Debugging locally
costs seconds; debugging through CI costs a push and a five-minute run.

Expect the Drive suite to create `librept_sync.json` in the account's `appDataFolder` on its first
run and reuse it forever after. It is invisible in the Drive UI and unreachable by any other app.

## B4. Upload it to GitHub

Browser: **repo → Settings → Secrets and variables → Actions → Secrets tab** (not Variables) →
**New repository secret**.

| Name | Value |
| :--- | :--- |
| `GOOGLE_LIVE_CREDENTIALS` | the entire contents of `.private/google-live.json` |

Paste the whole JSON object, braces included. The workflow writes it back to
`.private/google-live.json` byte-for-byte, so anything that works locally works there.

Or with the `gh` CLI:

```bash
gh secret set GOOGLE_LIVE_CREDENTIALS < .private/google-live.json
```

**Secret, not variable** — a variable is readable by anyone who can see repository settings and
prints in plain text in logs. `tests/unit/test_google_canary_workflow.py` fails the build if this
ever moves to `vars.`.

Nothing else needs setting. The old `GOOGLE_WIF_PROVIDER`, `GOOGLE_TEST_SERVICE_ACCOUNT` and
`GOOGLE_LIVE_SECRET` **variables are dead** — delete them from the Variables tab if they are still
there, along with the `librept-test` GCP project, the `librept-canary` service account and the
`github` workload identity pool if you created them.

## B5. Run it

**Actions → "Live Google API Canary" → Run workflow.** It also runs daily at 05:17 UTC.

| Symptom | Cause |
| :--- | :--- |
| Job fails before checkout with *"No Google credential"* | B4 — wrong tab, or misspelt secret name |
| `invalid_grant` from the token exchange | The refresh token was revoked, changed, or unused for six months — repeat B2–B4 |
| *"credential is due for rotation"* before the live suite | Working as intended — see B7. Repeat B2–B4 |
| `403` on `createSyncFile` only, list calls fine | The credential is a service account, not a real account — see this part's preamble |
| `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT` | Drive or Calendar API not enabled in Part A's project (A2) |
| `tokeninfo` test fails on a broader scope | B2 — re-consent with only the two scopes |
| Suite reports *skipped* after credential installation | The secret is empty or malformed JSON; treat it as a broken canary |

**What this canary does and does not cover.** It authenticates as a test identity, so it verifies
**Google's API contract** — a deprecated endpoint, a reclassified scope, altered `appDataFolder`
semantics — not Part A's client configuration. That is deliberate: a broken production client is
something users report immediately, whereas a silent Google-side change is exactly what nobody
notices. It also cannot cover the consent UI, which no CI can drive: Google fingerprints and blocks
automated browsers on `accounts.google.com`, so A8's hand check is that step's only coverage. It is
**not** a deploy gate, so Google's uptime can never block a release.

## B6. Rotate before Google revokes it

Google revokes a refresh token that has gone **six months unused**. The catch is that the clock
resets on every use, so the daily canary keeps the credential alive and nothing ever falls due while
things work — the clock only starts advancing once the canary **stops**, and it stops quietly
(GitHub disables scheduled workflows after 60 days of repository inactivity). There is nothing to
observe until the credential is already dead.

So the canary enforces a **rotation deadline** instead, measured from the `minted` stamp
`agent_tools.google_credential` writes into the credential:

| | |
| :--- | :--- |
| Google revokes after | 180 days unused |
| The canary fails from | **150 days** after minting |
| Runway that leaves | 30 days |

`python -m agent_tools.credential_expiry` runs before the live suite on every canary run, and the
minting tool prints the rotation date when it writes the file. A live canary therefore turns red a
month early; one that had stopped comes back red the moment it next runs, which is when someone is
looking. It is a hard failure rather than a warning on purpose — [AGENT_RULES §2.A.3](../AGENT_RULES.md)
forbids a gate step that warns and returns success.

**To rotate**: repeat B2 (the same one command), then B4. Nothing else changes — same client, same
scopes, same secret name.

## B7. Testing a PR branch by hand

A scheduled canary runs `main`. To check a branch that changes `src/data/driveAppData.js` before
merging, dispatch the workflow against that branch with a one-off token.

**Mint a short-lived access token** from the credential you already have:

```bash
python3 - <<'EOF'
import json, urllib.parse, urllib.request
c = json.load(open(".private/google-live.json"))
body = urllib.parse.urlencode({**c, "grant_type": "refresh_token"}).encode()
print(json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", body))["access_token"])
EOF
```

Then **Actions → Live Google API Canary → Run workflow**, pick the branch, and paste the token into
the `access_token` input. It short-circuits `tests/live/_credentials.mjs` for that run only; the
stored secret is untouched.

⚠️ **An access token, never the refresh token.** A `workflow_dispatch` input is echoed back on the
run's own page, so on a public repository treat anything typed there as published the moment you
submit it. An access token expires within the hour and can be killed immediately:

```bash
curl -sS -X POST https://oauth2.googleapis.com/revoke -d token='<the access token>'
```

A refresh token pasted into that field would be a standing grant on a real account, visible to
anyone who can read the repo.

---

# Rejected APIs

Both were considered and dropped; re-proposing either should clear these bars first.

**Analytics.** Tracking would need a `gtag.js` snippet, which breaks the CSP (`script-src` and
`connect-src` are currently tight enough that `accounts.google.com` is the only external origin, and
any change must be mirrored in *both* `src/index.html` and `deploy/local_http_server.py`, enforced by
the gate's CSP-parity audit); breaks offline-first, the app's core scenario; and forfeits the privacy
position §1.5 paid for by rejecting Firestore, adding an ePrivacy cookie banner to an app whose pitch
is zero friction. (Note also that the Cloud console's "Google Analytics API" *reads* GA reports — it
is not tracking, and enabling it would achieve nothing.)

**Gmail / SMTP.** Google Cloud has no SMTP service, and the Gmail API contradicts shipped
architecture: `src/data/calendarInvite.js` builds a downloadable `.ics` for a prefilled `mailto:`
compose precisely because there is no backend relay, and it sends from the trainer's real address,
which delivers better than any relay would. TODO §3.5 already settled the adjacent question ("no
IMAP — considered and dropped, and still dropped"). Gmail scopes are sensitive at minimum and several
are restricted, and the consent screen would read *"send email on your behalf"* — a trust killer for
a feature `mailto:` already covers.

# Before public launch

1. **Buy a custom domain.** `github.io` is on the Public Suffix List, so proving domain ownership for
   OAuth verification may not be possible, and the privacy policy needs hosting on the app's own
   domain regardless. One purchase resolves both.
2. **Re-point A3** — privacy policy URL and authorized domains — and add the domain as an origin in
   A6.
3. **Submit for verification.** Production is already enabled, which ends Testing's seven-day token
   expiry. Verification removes the 100-user cap and unverified-app warning; review takes weeks, so
   start early.
4. **Get branding right before submitting.** Edits are free now and can trigger re-review afterwards.
