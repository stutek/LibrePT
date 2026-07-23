---
type: guidelines
title: LibrePT Bug Reporting Guide
description: Guidelines on how to report issues and bugs effectively for LibrePT, including build stamp details and steps to reproduce.
status: active
tags:
  - bug-reporting
  - support
  - guidelines
  - okf
---

# 🐛 LibrePT Bug Reporting Guide

Thank you for helping improve **LibrePT**! Whether you encountered a glitch on the gym floor, a rendering issue, or unexpected behavior during session logging, filing a detailed bug report helps us fix it quickly.

---

## 🚀 How to Submit a Bug Report

1. Open the [LibrePT Issue Tracker](https://github.com/stutek/LibrePT/issues).
2. Click **New Issue** to open a new bug report.
3. Fill out the report details described below.

---

## 📋 What to Include in Your Report

To help us diagnose and resolve issues efficiently, please include the following information:

### 1. Build Stamp (Commit Hash)
LibrePT displays a **build stamp** (e.g. `a1b2c3d`) next to the LibrePT logo in the header bar and inside **Menu (☰) → About**.
- *Why it matters:* This pins your report to the exact build code version you were running.

### 2. Clear Steps to Reproduce
List the precise actions taken leading up to the issue:
1. Open active session clipboard for client `John Doe`.
2. Tap `Step Back` button on Exercise 2.
3. Observe unexpected behavior.

### 3. Expected vs. Actual Behavior
- **Expected:** What should have happened.
- **Actual:** What actually occurred (e.g. error message displayed, view failed to update).

### 4. Device & Browser Environment
- **Device:** e.g. Samsung Galaxy S23, iPhone 14, Desktop PC.
- **OS & Version:** e.g. Android 14, iOS 17.5, macOS, Windows 11.
- **Browser:** e.g. Mobile Chrome, Safari, Firefox.
- **App Mode:** PWA (Installed to Home Screen) or Browser Tab.

### 5. Screenshots & Console Logs (If Available)
- Attach screenshots or screen recordings showing the issue.
- If using desktop browser DevTools (`F12`), copy any error tracebacks from the **Console** tab.

---

## 🔒 Data & Privacy Note
Never include sensitive client personal details (such as real names, contact details, or private health notes) in public GitHub issues or screenshots. Please redact or blur any sensitive client information before uploading images.
