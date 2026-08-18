---
type: overview
title: LibrePT — the clipboard for trainers who work on the gym floor
description: The one-screen introduction a trainer lands on — what LibrePT is, a live demo they can drive themselves, and how to keep it on their phone.
status: active
tags:
  - landing
  - overview
  - okf
---

# LibrePT

<!-- The three demo links below are ABSOLUTE, deliberately, for the same reason consentForm.js
hardcodes PUBLIC_SITE_URL: a relative link here is rewritten by render_docs.py into a github.com
blob URL — which is what shipped in 1b3c9e1 and pointed this page's only calls to action at a
code host, aimed at trainers who will never have a GitHub account (the exact defect §3.12 fixed).
A link that has to work from a rendered page, from GitHub, and from a shared URL must name the
app's real home. -->

**The clipboard, not another gym CRM.** Log a set one-handed, mid-session, with a client waiting —
then move to the next person in the group without leaving the screen.

Free, no subscription, no signup, no account.

## See it working

**[▶ Watch the demo]({{PUBLIC_SITE_URL}}/?init=demo_data_load&demo=gym_floor)** — the app drives itself through a
real group session: open it, focus a circuit, mark a lift too easy, switch participant. Nothing is
pre-rendered; that is the actual app running in your browser.

**[Walk through it yourself]({{PUBLIC_SITE_URL}}/?init=demo_data_load&demo=walkthrough)** — the same four taps, but
you do them. A panel explains each one and taps it for you if you would rather watch; leave it
whenever you like.

**[Or just poke at it]({{PUBLIC_SITE_URL}}/?init=demo_data_load)** — the same sample gym, no guide. Three clients, a
session already under way, nothing real and nothing to sign up for.

## Why trainers use it

- **Works with no signal.** Basement gyms kill every cloud app. This one is offline-first: it keeps
  working, and syncs later if you want it to.
- **Client data stays on your phone.** No server of ours ever sees it. If you train in the EU you
  are holding health data, so this is a compliance answer, not a mood —
  [what that means in practice](PRIVACY_FOR_TRAINERS.md).
- **One clipboard for a whole group.** Overlapping sessions merge into a single board, with each
  person's plan a tab away.
- **No subscription.** The rest of the field is €20–100 a month.

## Keep it on your phone

It installs like an app without an app store — no download, no account.

- **iPhone (Safari):** Share → *Add to Home Screen*
- **Android (Chrome):** ⋮ → *Add to Home screen* / *Install app*

After that it opens full-screen from your home screen and runs with no connection.

## Before you rely on it

LibrePT is a **preview**. It is genuinely usable and genuinely unfinished, and the honest version of
that is [written down](PREVIEW.md) rather than buried — including how to get your data out, and what
could still go wrong with it.

Something broken or missing? [Tell us](BUG_REPORTING.md).
