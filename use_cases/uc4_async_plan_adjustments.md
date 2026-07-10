# Use Case 4: Asynchronous Program Updates & Client Progression

This use case describes the desk-side workflow where the Personal Trainer (PT) reviews exercise feedback and voice notes logged during live sessions to adjust client routines and plan future progressive overload trajectories asynchronously.

---

## Process Flow Diagram

```mermaid
graph TD
    subgraph Trainer["Trainer Lane"]
        Start([Start: Desk Prep Session]) --> OpenDashboard[1. View Dashboard Home Screen]
        OpenDashboard --> ReviewAdjustments["2. Review 'Pending Plan Adjustments' Deck"]
        ReviewAdjustments --> ListenVoice["3. Tap Alert Card: Review Tag & Playback Voice Note"]
        ListenVoice --> EditTemplate[4. Open Client's Routine Template & Adjust Load/Reps/Sets]
        EditTemplate --> ResolveAlert[5. Click 'Resolve Card']
    end
    
    subgraph System["OpenPT System Lane"]
        ReviewAdjustments --> QueryDB[6. Query Local Database for Unresolved Session Feedback & Audio Logs]
        QueryDB --> OpenDashboard
        
        ResolveAlert --> UpdateAlertState[7. Mark Feedback Item as Resolved]
        UpdateAlertState --> SaveDB[8. Save Updated Client Routine Template & Feedback State]
        SaveDB --> RefreshDashboard[9. Remove Card from Home Screen Alert Deck]
        RefreshDashboard --> End([End: Client Program Adjusted for Progression])
    end
```

---

## Details

### 1. Preconditions
- The PT has completed group or individual sessions.
- Granular exercise feedback tags or on-the-fly voice notes were recorded during those sessions.

### 2. Main Flow of Events
1. **Access Back-Office**: The PT opens the OpenPT app on their computer or tablet.
2. **Review Feedback Deck**: The system queries the database and displays the **Pending Plan Adjustments** deck on the home screen.
3. **Analyze Alert**: The PT reviews an alert card:
   - e.g., *"Jane Doe - Barbell Back Squat - Form Break (Depth Alert)"*
   - The card includes a playback button for a 5-second audio note recorded in the gym: *"Jane felt slight lower back tightness on set 3, so we limited depth. Drop load by 5kg next week and focus on hip mobility warm-ups."*
4. **Modify Template**: The PT clicks the card to jump into Jane's program template. They:
   - Lower the squat target weight by 5kg.
   - Insert a custom note: *"Focus on deep squats during warm-up; monitor depth."*
5. **Resolve Alert**: The PT clicks **Resolve Alert** on the card.
6. **Save Changes**: The system:
   - Updates Jane's template in the database.
   - Marks the feedback item as resolved.
   - Removes the card from the dashboard deck.

### 3. Alternative Flows
- **Keep Alert Pending**: The PT can close the detail panel without resolving, keeping the card in the "Adjustments Needed" queue until they have time to re-evaluate.
- **Dismiss Alert**: If the feedback was a minor one-off notice, the PT can click **Dismiss** to archive the record without updating the client's template.
