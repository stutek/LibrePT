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

Your records live **in this browser, on this device**. They are stored in IndexedDB, a database built into the browser. Only the language, the theme and the accepted terms are kept in `localStorage`. That has real consequences in a preview build:

- **A new build can change or lose your data.** Preview builds change how data is stored. An update converts your data to the new format, and a conversion can go wrong. LibrePT has **no server of its own**, so it holds no backup for you.
- **Clearing browser data deletes everything.** Clearing site data or history, wiping the app's data, a private window, or low storage space on the device can erase your records permanently. A browser may also delete the data of a site you have not used for a long time.
- **Google Drive sync is limited.** You can copy your data to your own Google Drive with **Connect Google Drive** in the **Sync & Backup Center**. Google has not verified LibrePT yet. It shows an "unverified app" warning when you connect, and **at most 100 people** can connect. If you cannot connect, or you do not, the only copy is the one on this device. If you lose the device or the browser profile, you lose the data.
- **Storage has a limit.** Each browser decides how much a site may store. The limit depends on the browser and on the free space on the device. When it is full, saves fail.

## How to protect yourself

1. **Don't put real, irreplaceable client data in a preview build.** Use demo/sample data, or data you can afford to lose.
2. **Export your data regularly.** Open the **Sync & Backup Center** with the cloud button at the top right of the screen, then tap **Export JSON** to download a JSON file. Keep it somewhere safe. Use it as your backup, together with Google Drive sync if you connect it.
3. **Import the file again after an update** if your data is gone. In the **Sync & Backup Center**, under **Import Data Backup**, tap **Select JSON File**. An import replaces everything on this device with what is in the file.
4. **Handle client personal data lawfully.** If you do enter real client information, you are the Data Controller — see [PRIVACY.md](../PRIVACY.md) and the [client consent template](templates/en/Client_Consent_Form.md).

---

## 🐛 Bug Reporting

Questions or problems? Read our [Bug Reporting Guide](BUG_REPORTING.md) for instructions on how to capture details, and open an issue on the [LibrePT]({{ISSUE_TRACKER_URL}}/issues) repository. Including the small **build stamp** shown next to the logo (the commit hash) helps pin your report to an exact build.
