---
type: guidelines
title: LibrePT Preview Build — Risks & Data-Loss Notice
description: What the PREVIEW marker means, why this pre-release build can lose your data, and how to protect yourself while trying it.
status: active
tags:
  - preview
  - pre-release
  - data-loss
  - risks
  - okf
---

# ⚠️ You are running a PREVIEW build

The amber **PREVIEW** tag in the header means this is a **pre-release build under active development**. It is here so you can try LibrePT and give feedback — **not** for running your real business on yet.

Please read this before you put any data you care about into it.

---

## What "preview" means

- **Unfinished and changing.** Features are added, changed, and removed between builds without notice. What works today may move or disappear tomorrow.
- **Not warranted.** The app is provided *as is*, with no guarantee of correctness, availability, or fitness for any purpose. (See [PRIVACY.md](../PRIVACY.md) and the in-app Terms.)
- **Not professional advice.** LibrePT is a tool for a qualified trainer's own workflow; it is not medical, legal, or professional advice.

## ⚠️ How you can lose data

Your data lives **only in this browser**, on this device (`localStorage`). That has real consequences in a preview build:

- **A new build can wipe or migrate your data.** Preview builds change how data is stored. An update may reset the database, or migrate it imperfectly, and there is **no server-side backup** to fall back on.
- **Clearing browser data deletes everything.** Clearing site data / history, "reset the app", private-window sessions, or browser storage limits can erase your records permanently.
- **No cloud sync yet.** Data does **not** sync anywhere. There is no copy but the one on this device — lose the device or the browser profile, lose the data.
- **Storage is capped.** The browser limits local storage (~5 MB). A large history can hit that ceiling and cause saves to fail.

## How to protect yourself

1. **Don't put real, irreplaceable client data in a preview build.** Use demo/sample data, or data you can afford to lose.
2. **Export your data regularly.** Use **Sync & Backup → Export** to download a JSON copy, and keep it somewhere safe. This is your only backup.
3. **Re-import after an update** if a build resets your data (**Sync & Backup → Import**).
4. **Handle client personal data lawfully.** If you do enter real client information, you are the Data Controller — see [PRIVACY.md](../PRIVACY.md) and the [client consent template](templates/Client_Consent_Form.md).

---

Questions or problems? Open an issue on the project repository. Including the small **build stamp** shown next to the logo (the commit hash) helps pin your report to an exact build.
