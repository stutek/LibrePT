# OpenPT - Personal Trainer Management & Scheduling System

OpenPT is a comprehensive, client-centric, and business-enabling software ecosystem designed for personal trainers (PTs) to manage schedules, publish slots, handle client bookings, orchestrate workout sessions, track execution, create and manage asynchronous session scenarios, capture on-the-fly voice notes, and collect granular exercise feedback to enable planning of client progression. 

While the **mobile-first, offline PWA Gym Clipboard** is the core real-time tracking interface used on the gym floor, OpenPT is built as an end-to-end system that connects the trainer's scheduling back-office, client calendar invites, and program adjustments into a single unified database.

---

## 🏗️ System Architecture & Subsystems

OpenPT is comprised of three major subsystems:

1. **The PT Clipboard Dashboard (Mobile Web/Native PWA)**
   - The trainer's core gym-floor interface.
   - Restricts active client views strictly to checked-in session participants to avoid logging errors.
   - **Sub-Second Participant Switching**: Frictionless switches between active participants with as few clicks and scrolls as possible.
   - **Primary Focus Card with Foreshadowing**: Prominently displays the active exercise (directions and target load) while offering a compact preview of the upcoming exercise ("Up Next") for proactive equipment setup.
   - **Low-Interaction Progression & Safety Signals**: One-tap action buttons to record *"Load Up Next Weight"* (progression), *"Step Back Load"* (regression), or *"Pain / Injury Flag"* without typing on a phone keyboard.
   - **Privacy-First Voice Notes (Local-Only)**: Triggered directly from the feedback UI and auto-mapped to the active exercise. Audio is stored locally on the device for async playback and on-device text conversion to protect client PII.
   - **Reversible Plan Pivot & Placeholder Injection**: Low friction session wipe/pivot with full undo capability. Low friction ability to inject generic placeholder cards when client fatigue or equipment delays force a sudden plan change.

2. **Google Calendar Booking & Sync Integration (Cloud APIs)**
   - **No Custom Client Web App Needed**: Rather than building and hosting a custom booking portal, OpenPT leverages **Google Calendar Appointment Schedules** out of the box.
   - **For Trainers**: PT publishes slots/schedules directly via Google Calendar (supporting recurring slot rules and guest capacity limits).
   - **For Clients**: Clients self-subscribe to slots via the standard Google-hosted scheduling page.
   - **Active Sync**: The OpenPT app queries the Google Calendar API to fetch session participant guest lists, automatically pre-loading the active clipboard with checked-in clients.

3. **Trainer Program Adjustments Deck (Back-Office)**
   - The desk-side workspace where feedback alerts and audio notes are reviewed to asynchronously edit client routine templates and plan progressive overload trajectories.

---

## 🚀 Key Functional Features

### 1. The PT Clipboard Dashboard (Main Gym Use Case)
*   **Sub-Second Participant Switching**: Tapping participant tabs swaps views in under 50ms.
*   **Primary Focus Card with Foreshadowing**: Centers the current active exercise (directions, target load/reps, and action buttons) while offering a compact "Up Next" foreshadowing card (visible on larger screens or via a quick scroll) so the PT can prep equipment for smooth transitions.
*   **One-Tap Progression & Safety Signals**: Instant, low-interaction buttons to record outcome signals without opening a phone keyboard:
    *   `[ ⬆ Load Up Next ]`: Client completed cleanly; increase weight next session.
    *   `[ ⬇ Step Back ]`: Client struggled or broke form; reduce load next session.
    *   `[ ⚠️ Pain / Injury ]`: Immediately flag joint pain or acute discomfort on this movement.
*   **Privacy-First Voice Notes (Local-Only & Auto-Mapped)**: Triggered directly from the feedback UI, voice recordings automatically attach to the current exercise and client. All audio is stored locally on the device and transcribed asynchronously using local, on-device libraries only—preventing PII exposure to cloud transcription services.
*   **Asynchronous Session Scenarios**: Guide multiple participants through separate, distinct individual routines in the same session slot.

### 2. Google Calendar Appointment Booking & Integration
*   **No Custom Web Hosting**: The PT creates recurring training slots directly in Google Calendar (using Appointment Schedules). Google auto-generates the public scheduling page.
*   **Self-Subscription**: Clients visit the Google-hosted page to book slots, entering their name and email.
*   **Automated Invitations**: Booking a slot adds the client to the Google Calendar event guest list, triggering a formal invite sent directly to their email inbox.
*   **Participant Lock Guard**: The OpenPT app queries the Google Calendar API to fetch the guest list, pre-loading the active session clipboard and locking client selection strictly to checked-in participants.

### 3. Closed-Loop Plan Feedback & Client Progression
*   **Granular Signal Processing**: Signals recorded on the gym floor (`Load Up`, `Step Back`, `Pain/Injury`) flow directly into the trainer's back-office review queue.
*   **Pending Program Adjustments Deck**: Feedback and voice notes compile into a desk workspace for the PT to review, allowing them to asynchronously plan client progression and update routine templates before the next session.

---

## 🛠️ Codebase Structure

The system is configured as a single codebase running on Web, iOS, and Android:

```
OpenPT/
├── index.html          # Main application templates (Dashboard, Modals, Booking pages)
├── index.css           # Custom HSL-color variables, glassmorphic layouts, and mobile viewport limits
├── app.js              # State manager, views router, Google API hooks, and split-sync databases
├── mockData.js         # Default database (Exercises, client profiles, historical logs, and adjustments)
├── manifest.json       # Web App Manifest for mobile PWA standalone styling
└── sw.js               # Service Worker for offline asset caching (PWA logic)
```

---

## ⚡ Technical Stack

*   **Core**: HTML5, Vanilla JavaScript (ES6+), and Vanilla CSS Variables (Emerald & Zinc themes).
*   **Data Sync**: Serverless Google Firebase (Firestore Database + Firebase Hosting) for real-time bookings.
*   **Third-Party APIs**: Google Calendar API (OAuth 2.0).
*   **Native Wrap**: **Capacitor** to wrap the HTML/CSS/JS code into native Android (.apk) and iOS (.ipa) app packages.
