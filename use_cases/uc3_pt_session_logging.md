# Use Case 3: PT Session Orchestration & Execution Tracking (PWA Clipboard)

This use case outlines how the Personal Trainer (PT) orchestrates a live training session on the gym floor using low-interaction, single-exercise focus cards and one-tap progression or safety signals.

---

## Process Flow Diagram

```mermaid
graph TD
    subgraph Trainer["Trainer Lane"]
        Start([Start: Session Start Time]) --> OpenApp[1. Open OpenPT App]
        OpenApp --> SelectSlot[2. Select Today's Class Slot]
        SelectSlot --> VerifyAttendance[3. Verify Participant Attendance]
        VerifyAttendance --> LaunchClipboard[4. Tap 'Launch Clipboard']
        
        LaunchClipboard --> ActiveSession["5. Active Clipboard Workspace Opens"]
        ActiveSession --> ToggleTabs["6. Tap Participant Tab -> Single-Exercise Focus Card Opens"]
        
        ToggleTabs --> TrackExecution["7. View Focused Exercise & Confirm/Adjust Set Details"]
        
        TrackExecution --> DecisionSignal{"8. Log Outcome Signal or Note?"}
        
        DecisionSignal -- "Progression / Safety" --> ClickSignal["9. One-Tap: 'Load Up Next', 'Step Back', or 'Pain/Injury Flag'"]
        ClickSignal --> ToggleTabs
        
        DecisionSignal -- "Voice Note" --> RecordVoice["10. Hold 'Mic' in Feedback UI -> Auto-Map & Save Locally"]
        RecordVoice --> ToggleTabs
        
        DecisionSignal -- "Pivot / Wipe Plan" --> PivotSession["11. One-Tap: Wipe Session & Inject Generic Placeholder Card (Reversible via Undo)"]
        PivotSession --> ToggleTabs
        
        DecisionSignal -- "No Signal Needed" --> CheckNextEx{"12. Next Exercise?"}
        CheckNextEx -- "Yes" --> CycleExercise["12. Tap 'Next Exercise'"]
        CycleExercise --> ToggleTabs
        
        CheckNextEx -- "No" --> FinishSession["13. Tap 'Finish Session'"]
    end
    
    subgraph System["OpenPT System Lane"]
        LaunchClipboard --> LockWorkspace[14. Lock Client Selection Strictly to Session Participants]
        LockWorkspace --> ActiveSession
        
        ClickSignal --> SaveSignalAsync[15. Save Signal to Local Session Cache]
        RecordVoice --> SaveAudioFile[16. Save Local Audio & Auto-Map to Active Client/Exercise (Local Speech-to-Text)]
        
        FinishSession --> SplitLogs[17. Split Group Session into Individual Execution Logs]
        SplitLogs --> UpdateProfiles[18. Append Execution Histories & Queue Adjustment Cards]
        UpdateProfiles --> SyncCloud[19. Sync Session Data, Signals & Voice Notes to Server]
        SyncCloud --> End([End: Workout Session Completed & Saved])
    end
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
