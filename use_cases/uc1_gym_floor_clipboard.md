---
type: use_case
title: UC1 - Active PT Session Logging & Gym Floor Clipboard
description: Specification for the trainer's mobile PWA clipboard, including single-exercise focus cards, reversible plan pivots, and local-only voice notes.
status: active
tags:
  - gym-floor
  - pwa
  - session-logging
  - voice-notes
  - progression-signals
---

# Use Case 1: PT Session Orchestration & Execution Tracking (PWA Clipboard)

This use case outlines how the Personal Trainer (PT) orchestrates a live training session on the gym floor using low-interaction, single-exercise focus cards and one-tap progression or safety signals.

---

## BPMN Horizontal Multi-Client Gym Floor Scenarios

### Scenario 1: Clean Completion & Multi-Client Rotation (Client B -> Client C -> Return to Client B)
Horizontal flow modeling how the PT opens the app, inspects Client B's Focus Card (`Exercise`, `Load`, `Series`, `Rest`, `Reps`), cues initial reps, rotates attention to Client C while Client B completes remaining sets autonomously, and returns to log a single-click clean completion.

```mermaid
graph LR
    subgraph TrainerLane["PT Orchestration Lane"]
        T1["1. Open App & Select Tab: Client B<br/>Focus Card: Barbell Bench Press<br/>Load: 80kg | Series: Set 1/3 | Rest: 90s | Reps: 8"]
        T2["2. Observe Client B Reps 1-3:<br/>Form solid, RPE 7 -> Give verbal cue"]
        T3["3. Switch Context to Client C:<br/>Mentor Client C on Squat rack"]
        T4["5. Return to Client B Tab:<br/>Client B completed Sets 2 & 3 cleanly"]
        T5["6. Single Click:<br/>Tap '[ ✓ Clean / Load Up Next ]'"]
    end

    subgraph ClientBLane["Client B Physical Gym Floor"]
        CB1["Performs Reps 1-3 under PT observation"]
        CB2["4. Autonomously completes remaining reps,<br/>observes 90s rests, finishes Sets 2 & 3"]
    end

    subgraph PWALane["OpenPT PWA Clipboard"]
        P1["7. Locks Bench Press Set Log<br/>Advances Client B Card to Next Exercise"]
    end

    T1 --> CB1
    CB1 --> T2
    T2 --> T3
    T3 --> CB2
    CB2 --> T4
    T4 --> T5
    T5 --> P1
```

### Scenario 2: Load Too Easy (Split: In-Session Stepper Bump + Future Session Overload)
Horizontal flow showing how the PT adjusts load on the fly when Client B reports low RPE on Set 1, bumping remaining sets today while flagging progression for next week before rotating to Client C.

```mermaid
graph LR
    subgraph TrainerLane["PT Orchestration Lane"]
        T21["1. Focus Card: Lat Pulldown<br/>Load: 50kg | Series: Set 1/3 | Rest: 60s | Reps: 10"]
        T22["3. Split Decision & Action:<br/>• Tap '[ + Set Load Today ]' -> Bump Sets 2-3 to 55kg<br/>• Tap '[ 📈 Too Easy / Progression Next Session ]'"]
        T23["4. Switch Tab to Client C:<br/>Mentor Client C while Client B pulls 55kg"]
    end

    subgraph ClientBLane["Client B Physical Gym Floor"]
        CB21["2. Completes Set 1 easily:<br/>Reports 'Felt light, RPE ~6'"]
        CB22["5. Performs Sets 2 & 3 at adjusted 55kg load"]
    end

    subgraph PWALane["OpenPT PWA Clipboard"]
        P21["Persists In-Session Load Modification (55kg)<br/>Queues Next-Session Overload Flag"]
    end

    T21 --> CB21
    CB21 --> T22
    T22 --> T23
    T23 --> CB22
    CB22 --> P21
```

### Scenario 3: Rep Failure (Intended AMRAP/Max-Reps vs. Unintended Premature Failure)
Horizontal flow modeling how the PT evaluates failure on Client B's final set—distinguishing intentional AMRAP sets from premature technique breakdown.

```mermaid
graph LR
    subgraph TrainerLane["PT Orchestration Lane"]
        T31["1. Focus Card: Barbell Back Squat<br/>Load: 100kg | Series: Set 3/3 | Rest: 120s | Reps: AMRAP / 8"]
        T32{"3. Evaluate Failure Type"}
        T3Intended["Intended AMRAP Failure:<br/>Input actual reps hit -> Tap '[ ✓ Target Met ]'"]
        T3Unintended["Unintended Premature Failure:<br/>Single Click '[ ⬇ Step Back ]'"]
    end

    subgraph ClientBLane["Client B Physical Gym Floor"]
        CB31["2. Reaches muscle failure at Rep 7"]
    end

    subgraph PWALane["OpenPT PWA Clipboard"]
        P31["Persist Volume PR / AMRAP Log"]
        P32["Queue Regression Flag for Back-Office"]
    end

    T31 --> CB31
    CB31 --> T32
    T32 -- "AMRAP / Max Effort" --> T3Intended
    T3Intended --> P31
    T32 -- "Premature Fatigue / Breakdown" --> T3Unintended
    T3Unintended --> P32
```

### Scenario 4: Acute Pain / Injury Report (One-Tap Flag, Local Voice Note & Placeholder Pivot)
Horizontal flow modeling how the PT immediately flags pain on Client B's card, records a privacy-protected local voice note, and pivots Client B to a generic placeholder flow before rotating to Client C.

```mermaid
graph LR
    subgraph TrainerLane["PT Orchestration Lane"]
        T41["1. Focus Card: Romanian Deadlift<br/>Load: 90kg | Series: Set 2/3 | Rest: 90s | Reps: 8"]
        T42["3. Single Click: Tap '[ ⚠️ Pain / Injury Flag ]'<br/>Hold Mic Icon -> Record local voice note"]
        T43["4. One-Tap Pivot:<br/>Inject '[ Mobility & Rehab Placeholder Card ]'<br/>Switch context to Client C"]
    end

    subgraph ClientBLane["Client B Physical Gym Floor"]
        CB41["2. Stops rep 3 reporting acute knee/hamstring strain"]
        CB42["5. Performs safe mobility flow autonomously"]
    end

    subgraph PWALane["OpenPT PWA Clipboard"]
        P41["Highlights Movement Red | Encrypts Local Audio File<br/>Auto-Maps Metadata (client_id, exercise_id)"]
    end

    T41 --> CB41
    CB41 --> T42
    T42 --> P41
    T42 --> T43
    T43 --> CB42
```

---

## Details

### 1. Preconditions
- The session start time is reached.
- Participants have self-subscribed to the class slot via Google Calendar.
- The PT has opened the app on their mobile device.

### 2. Main Flow of Events
1. **Initialize Session**: The PT selects the scheduled session slot from their dashboard.
2. **Attendance Check**: The PT reviews the subscriber list fetched from Google Calendar, confirms attendees, and taps **Launch Clipboard**.
3. **Lock Clipboard Workspace**: The system opens the tracking dashboard, **locking participant tabs** strictly to the checked-in clients.
4. **Session Orchestration & Single-Exercise Tracking**:
   - **Sub-Second Tab Switch**: Tapping a participant's name (`[ Jane ]`, `[ John ]`) swaps the active view in under 50ms.
   - **Primary Focus Card with Foreshadowing**: The screen centers the participant's current active exercise (e.g., *Barbell Back Squat — Target: 80kg × 8 reps*) while displaying a compact **"Up Next" foreshadowing card** below it so the PT can proactively prepare equipment for the next movement.
   - **One-Tap Progression & Safety Signals**: Instead of typing notes on a phone keyboard, the PT has immediate one-tap signal buttons:
     - `[ ⬆ Load Up Next ]`: Client completed the set cleanly; increase target load for their next session.
     - `[ ⬇ Step Back ]`: Client struggled or failed reps; reduce target load for their next session.
     - `[ ⚠️ Pain / Injury Flag ]`: Immediately flag joint pain or acute discomfort on this exercise.
   - **Privacy-First Voice Notes (Auto-Mapped & Local-Only)**: Triggered directly from the feedback UI, voice notes are automatically tagged with the active client and exercise metadata (`clientId`, `exerciseId`). Audio is stored locally on the device and converted asynchronously using **local, on-device transcription libraries only**—ensuring sensitive client medical/physical PII never leaves the local device to external cloud speech APIs.
   - **Reversible Plan Pivot & Session Wipe**: If a client arrives with acute fatigue or equipment is unavailable, the PT taps `[ 🔄 Pivot / Wipe Plan ]`. This wipes the planned routine and immediately injects pre-configured **Generic Placeholder Cards** (`[ Mobility & Core Flow ]`, `[ Machine Circuit ]`, `[ Freestyle Block ]`) to maintain effort tracking without typing. This action is fully undoable (`[ ↩ Undo Pivot ]`) and preserved in the audit log for later desk review.
   - Once an exercise is finished for a participant, the PT taps **Next Exercise** to slide the focus card to their next movement.
5. **Complete Session**: The PT taps **Finish Session**.
6. **Split Database Save**: The system:
   - Splits the group log into individual records.
   - Appends execution histories to client profiles.
   - Creates action cards in the trainer's back-office review deck for any recorded `Load Up`, `Step Back`, or `Pain/Injury` signals.
   - Queues a background sync to send the logged data to the server.

### 3. Alternative Flows
- **Offline Mode**: If internet access is lost on the gym floor, all signals, focus card progressions, and audio recordings are saved locally in browser storage, syncing automatically once a connection is re-established.
