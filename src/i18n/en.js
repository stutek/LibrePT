// English (en) translations — a flat key -> string map.
// Keep keys in parity with every other locale in this folder (enforced by
// tests/unit/test_i18n_parity.py, which iterates the registry in ./index.js).
export const en = {
  logo_title: "LibrePT",
  preview_badge: "Preview",
  preview_warning:
    "This is a preview build — pre-release and under active development. Features change without notice and your data can be lost. Keep backups, and do not rely on it for real client records yet.",
  tab_clients: "Clients",
  tab_routines: "Routines",
  tab_exercises: "Exercises",
  tab_history: "History",
  pending_adjustments: "Pending Review",
  btn_start_session: "Start Custom or Group Session",
  btn_create_session: "Create Session",
  no_pending_adjustments: "Nothing pending review. Floor signals are all synced!",
  clients_title: "Clients Directory",
  placeholder_search_clients: "Search clients...",
  btn_add_client: "Add Client",
  notes_injuries: "Pre-existing Injuries & Notes",
  goals: "Training Goals",
  create_exercise_title: "Create Custom Exercise",
  exercise_name_label: "Exercise Name *",
  muscle_group_label: "Target Muscle Group *",
  equipment_label: "Equipment *",
  movement_pattern_label: "Movement Pattern *",
  instructions_label: "Instructions",
  btn_save_exercise: "Save Exercise",
  routine_plans: "Routine Plans & History",
  btn_edit_profile: "Edit Profile",
  btn_add_plan: "Add Plan Adjustment",
  client_history_header: "Logged Session History",
  no_history_yet: "No history logged yet.",
  routines_title: "Routine Templates",
  placeholder_search_routines: "Search routines...",
  btn_create_routine: "Create Routine",
  exercises_count: "exercises",
  exercises_title: "Exercise Library",
  placeholder_search_exercises: "Search exercises...",
  btn_add_exercise: "Add Exercise",
  history_title: "Global Training History",
  no_workouts_history: "No logged workouts in global history.",
  live_tracking_clipboard: "Live Tracking Clipboard",
  active_session: "Active session",
  add_from_catalog: "Add from catalog",
  catalog_picker_title: "Add from Exercise Catalog",
  integrity_error_title: "App verification failed",
  integrity_error_missing:
    "No integrity catalog was found for this build. In local development, run the full build (python -m build) or restart the dev server so the catalog is recomputed; in production this means the deploy is incomplete.",
  integrity_error_mismatch:
    "A file didn't match its verified checksum — the download is corrupt or left over from a different build. Clear the cache and retry to re-download and re-verify this build; if it persists in local dev, restart the dev server to recompute the catalog.",
  integrity_error_retry: "Clear cache & retry",
  btn_collapse: "Minimize",
  collapse: "Collapse",
  expand: "Expand",
  exercise_of: "Exercise",
  btn_add_set: "Add Set",
  btn_inject_exercise: "Inject Exercise",
  btn_cancel: "Cancel",
  btn_discard_changes: "Discard Changes",
  btn_delete_session: "Delete Session",
  btn_delete_plan: "Delete Plan",
  btn_start_workout_session: "Start Session",
  btn_complete: "Complete Workout Session",
  btn_log_feedback: "Add Note",
  alert_no_sets:
    "No completed sets were logged. Are you sure you want to finish and save an empty session?",
  confirm_finish_early: "This session still has about {min} minutes left. Finish it now anyway?",
  confirm_cancel:
    "Delete this session? Its logged progress and feedback will be permanently discarded.",
  confirm_delete_session:
    "Delete this session? It comes off the schedule and its logged progress and feedback are discarded — each participant's plan is kept under Unscheduled plans.",
  confirm_delete_plan:
    "Delete every exercise from this plan? You can rebuild it from scratch or exit editing.",
  warning_banner_title: "Client Safety Advisory",
  workout_setup_title: "Workout Session Setup",
  workout_setup_desc:
    "Set the slot and the place, then add the clients who are training. Each one can be given their own programme, or all of them the same one.",
  label_session_name: "Session Name",
  untitled_session: "Untitled Session",
  label_session_date: "Date",
  label_start_time: "Start Time",
  label_end_time: "End Time",
  time_field_later: "Five minutes later",
  time_field_earlier: "Five minutes earlier",
  time_field_set: "Set {time}",
  date_field_later: "One day later",
  date_field_earlier: "One day earlier",
  date_field_set: "Set {date}",
  date_field_today: "today",
  date_field_tomorrow: "tomorrow",
  date_field_yesterday: "yesterday",
  label_location: "Location",
  select_participants: "Who is training, and on which programme",
  participants_chosen: "Chosen",
  no_participants_chosen: "Nobody is on this session yet. Find a client in the field above.",
  no_matching_clients: "No client of that name",
  remove_participant: "Take off this session:",
  select_routine_for: "Programme for this client",
  btn_launch_clipboard: "Open in Clipboard",
  err_select_client: "You must select at least one participant client.",
  err_assign_routine: "Please assign a routine template to all selected participants.",
  add_ex_session_title: "Inject Exercise on Gym Floor",
  select_exercise: "Select Exercise",
  sets: "Sets",
  reps: "Reps",
  weight: "Weight (kg)",
  rest_seconds: "Rest (sec)",
  btn_inject: "Inject Exercise",
  log_client_feedback: "Log Client Feedback",
  feedback_for: "Feedback for",
  feedback_on: "on",
  custom_details: "Custom Details / Notes",
  btn_log_alert: "Log Alert",
  theme_light: "Light Mode",
  theme_dark: "Dark Mode",
  backup_center: "Sync & Backup Center",
  backup_desc:
    "LibrePT stores your logs directly on this device. Sync the latest session schedule, download a backup file to keep your history safe, or import it to move to another phone.",
  btn_download_backup: "Download JSON Backup",
  btn_import_backup: "Import JSON Backup",
  sync_session_title: "Sync Session Data",
  sync_session_desc: "Pull the latest bookings and session schedule from your connected calendar.",
  backup_export_title: "Export Data Backup",
  backup_export_desc: "Download your clients, routines, and workout logs as a single JSON file.",
  btn_export_json: "Export JSON",
  catalog_export_title: "Export Exercise Catalog",
  catalog_export_desc:
    "Export your movement catalog mapped to the open wger taxonomy, so it stays interchangeable with external tools.",
  btn_export_catalog_json: "Export Catalog JSON",
  btn_export_catalog_csv: "Export Catalog CSV",
  restore_brings_forward:
    "this brings the file's data forward, and it will no longer open in older builds of LibrePT",
  restore_preview_only_lost: "these are not in the file and cannot come back",
  backup_import_title: "Import Data Backup",
  backup_import_desc:
    "Load an existing .json backup file. This will merge or overwrite your current database.",
  btn_select_json: "Select JSON File",
  error_title: "Page not found",
  error_desc: "This link doesn't point to a session, client or view in LibrePT.",
  btn_error_home: "Back to dashboard",
  btn_resolve: "Resolve",
  no_exercises_injected: "No Exercises Injected",
  no_exercises_desc:
    "Please tap the edit icon (✎) above to plan and add exercises for this client.",
  edit_plan: "Edit plan",
  editing_plan_for: "Editing plan for",
  editing_plan_session: "Editing session plan",
  add_exercise: "Add exercise",
  new_label: "New",
  swapped_label: "Swapped",
  browse_catalog: "Browse exercise catalog",
  swap_movement: "Swap movement",
  search_movements: "Search movements",
  muscle: "Muscle",
  equipment: "Equipment",
  reorder: "Reorder",
  exercise: "Exercise",
  close: "Close",
  remove: "Remove",
  done: "Done",
  done_editing_plan: "Done editing plan",
  session_options: "Session options",
  edit_exit_hint: "Tap Done, press Esc, or tap outside to finish.",
  reorder_hint: "Tap top/bottom to move, drag to reorder",
  circuit: "Circuit",
  circuit_title: "Circuit title",
  circuit_none: "No circuit",
  circuit_new: "New circuit",
  add_to_circuit: "Add exercise to circuit",
  rounds: "Rounds",
  ungroup: "Break up circuit",
  rest_timer: "Rest Timer",
  start_rest: "Start Rest",
  trainer_set_notes: "Trainer Set Notes",
  kg: "kg",
  reps_label: "reps",
  // Exercise modality metric labels (see exerciseModality.js) — the primary target unit per movement.
  metric_time: "time",
  metric_hold: "hold",
  metric_distance: "distance",
  metric_calories: "cal",
  metric_watts: "watts",
  metric_pace: "pace",
  metric_heartrate: "bpm",
  modality_strength: "Strength",
  modality_isometric: "Isometric",
  modality_cardio: "Cardio",
  modality_stretch: "Stretch",
  modality_balance: "Balance",
  modality_agility: "Agility",
  add_new_client: "Add New Client",
  edit_client_profile: "Edit Client Profile",
  client_name: "Client Name",
  client_full_name: "Full Name *",
  client_alias: "Alias (only if two clients share a name)",
  client_name_placeholder: "e.g. Jane Doe",
  client_alias_placeholder: "e.g. morning, Novak, the runner",
  client_email_placeholder: "e.g. jane.doe@example.com",
  client_phone_placeholder: "e.g. +386 40 123 456",
  notes_placeholder: "e.g. Left knee issue; monitor squat depth...",
  modal_close: "Close",
  goals_placeholder: "e.g. Muscle gain, fat loss...",
  save_client: "Save Client",
  create_routine_title: "Create Routine Template",
  edit_routine_title: "Edit Routine Template",
  routine_name: "Routine Name",
  routine_desc: "Description",
  btn_save_routine: "Save Routine Template",
  joined: "Joined",
  no_goals_specified: "No goals specified.",
  no_notes_specified: "No health issues or custom caveats noted.",
  no_weight_records: "No weight records.",
  log_weights_progression: "Log weights to see progression.",
  need_two_entries: "Need at least 2 entries for chart layout.",
  no_workouts_logged: "No workouts logged yet.",
  no_routines_found: 'No routine templates found. Click "New Routine" to design one.',
  no_description: "No description.",
  btn_start_group_session: "Start Group Session",
  no_exercises_matched: "No exercises match filter criteria.",
  no_instructions: "No instructions.",
  min_session: "min session",
  less_than_minute: "< 1 min",
  set_label: "Set",
  no_details_specified: "No details specified.",
  no_clients_found: 'No clients found. Click "Add Client" to create one.',
  no_weight_logged: "No weight logged",
  btn_back: "Back",
  routines_desc: "Select or edit workout routines. Launch them with individual or group sessions.",
  filter_all: "All",
  history_desc: "Log of all completed sessions across all clients.",
  sessions_schedule: "Sessions",
  from_date: "From",
  btn_sync_calendar: "Sync Calendar",
  btn_sync_data: "Sync Data",
  spots_filled: "spots filled",
  btn_launch_clipboard_short: "Open in Clipboard",
  syncing_calendar: "Syncing...",
  calendar_synced: "Calendar synchronized successfully!",
  // The board's filters (TODO §45.6). Each chip says what it filters by when nothing is chosen, and
  // its value once something is — the chip IS the readout, which is why there is no modal.
  filter_dates: "Dates",
  filter_client: "Client",
  filter_location: "Location",
  filter_clear: "Clear filters",
  filter_from: "From",
  filter_to: "To",
  filter_prev_month: "Previous month",
  filter_next_month: "Next month",
  no_sessions_for_filters: "No sessions match these filters. Clear them to see the whole board.",
  no_sessions_scheduled: "No sessions scheduled.",
  voice_note_label: "Privacy-First Voice Note",
  voice_ready: "Tap mic to record voice note",
  voice_recording: "Recording... Tap again to save",
  voice_transcribing: "Transcribing audio locally...",
  voice_transcription_done: "On-device transcription completed!",
  voice_playing: "Playing voice note...",
  up_next_label: "Up Next",
  last_exercise: "Last Exercise",
  program_not_defined: "Program Not Defined",
  no_members_assigned: "No Participants",
  session_completed: "Completed",
  session_changed_resend:
    "This session changed — send the new details to the clients you already invited?",
  session_change_focus: "different kind of session",
  session_change_participants: "different people invited",
  session_change_time: "new time",
  session_change_location: "new place",
  session_invite_title: "Send calendar invites",
  session_invite_desc:
    "Newly assigned participants can be sent a calendar invite for this session.",
  // The client intake page (TODO §1.7/§26) — the only screen in the app written FOR the client, so
  // the voice is theirs and not the trainer's: "your trainer", never "the client". It says where each
  // answer goes, because someone disclosing an injury to a person they have not trained with yet is
  // entitled to know that before they type it.
  intake_title: "Introduce yourself to your trainer",
  intake_lede:
    "Fill this in and send it to your trainer. It creates a file on your phone and nothing else — LibrePT has no account to make and no server that sees any of this.",
  intake_name: "First and last name",
  intake_email: "Email",
  intake_phone: "Phone",
  intake_contact_hint: "One of the two is enough — whichever your trainer should use.",
  intake_goals: "What you want out of training (optional)",
  intake_injury: "Injuries or anything a trainer should know (optional)",
  intake_health_hint:
    "Only if you want to. It goes in the file you send your trainer, and nowhere else — not into a text message, and not into any link.",
  // Informed consent rests on full disclosure or it is void (ruled 2026-08-23). The one line a
  // client actually reads has to say what the linked notice says: the trainer's own device, an
  // optional backup in their own private cloud storage, nobody else, and the right to withdraw. The
  // links stay for the detail; they are not where the substance is allowed to hide.
  //
  // The VENDOR is not named here (§39.3, 2026-08-31). It used to say "Google Drive", while the
  // consent letter this line summarises says "my personal cloud storage" and names nobody — two
  // texts about one promise, disagreeing, and the shorter one is the one a client actually ticks.
  // Nothing is hidden by dropping it: the privacy notice this line links to names Google Drive in
  // full, in both languages, and that is where a processor's identity belongs. It is also a promise
  // the app cannot keep for a deployment that syncs somewhere else.
  intake_consent:
    "I agree to my trainer keeping these details and using them to plan and log my training. They stay on my trainer's own device, and may also be kept as a backup copy in my trainer's own private cloud storage — no other service receives them. I can withdraw this at any time by telling my trainer.",
  intake_sender_for: "You are filling this in for {who}.",
  intake_sender_save: "Save this contact",
  intake_sender_check:
    "If that is not the person who gave you this link, do not fill it in. This page sends nothing by itself: your answers become a file on this phone, and you choose who to share it with.",
  intake_notice_link: "What happens to your data",
  intake_form_link: "The full consent wording",
  intake_send: "Share with my trainer",
  intake_save: "Save the file to share",
  intake_privacy_note:
    "Nothing leaves this phone and nothing is uploaded. What you type is kept only until you close the tab — close it and the form is gone.",
  intake_share_title: "My details for training",
  intake_share_text: "Here are my details — this file opens in LibrePT.",
  intake_sent: "Shared. Your trainer will add you from that file.",
  intake_saved: "Saved. Share that file with your trainer — attach it to a message.",
  // Offered after the save, not before it: an address is only useful once there is a file to attach.
  // The BODY is the message the client sends, so it holds no instructions to the client — those are
  // on the page, where the person who has to act on them is looking.
  intake_send_to_email: "Write the email to {who}",
  intake_send_to_subject: "My details for training",
  intake_send_to_body: "Hello, here are my details for training.",
  intake_send_to_hint:
    "Attach the file {file} to that message. Your phone saved it with your downloads.",
  // Precedes the browser's own untranslated message (TODO §45.4). Says who the line is for, so
  // nobody reads a developer's error text as an instruction to them.
  intake_send_failed_detail: "Your trainer may need this:",
  intake_send_failed: "That didn't share. Use “Save the file to share” and attach it to a message.",
  intake_err_identity: "Please add your name, and either an email or a phone number.",
  intake_err_consent:
    "Please tick the consent box — your trainer cannot store your details without it.",
  // Reviewing a submission a client sent in (TODO §26.5). The labels name the FIELD, and the consent
  // rows show the three things that make consent demonstrable under Art. 7(1) rather than a tick.
  signup_review_lede:
    "Open the file your client sent you. Nothing is added to your clients until you accept it — the file was written on their phone and anyone could send you one.",
  signup_review_file: "The file they sent",
  signup_review_name: "Name",
  signup_review_email: "Email",
  signup_review_phone: "Phone",
  signup_review_goals: "Their goals",
  signup_review_injury: "Injuries and notes they gave",
  signup_review_consent_date: "Consent given",
  signup_review_consent_version: "Consent wording",
  signup_review_consent_lang: "Language they read",
  signup_review_no_consent: "Not given — you may not store their details yet",
  signup_review_match_label: "Update the client you already have:",
  signup_review_save: "Add to my clients",
  signup_review_unreadable:
    "That file is not a LibrePT client introduction — check you picked the right attachment.",
  // The invite-reply page (TODO §1.6). Written FOR the client, like the intake page: "your trainer",
  // and no jargon about payloads or deep links — they tap an answer and send a message.
  rsvp_unreadable: "This invite link is incomplete — ask your trainer to send it again.",
  rsvp_expired:
    "This invitation has closed — the session is too soon to answer here. Message your trainer directly if something has changed.",
  rsvp_deadline: "You can answer here for another",
  rsvp_hours: "h",
  rsvp_minutes: "min",
  rsvp_untitled_session: "Training session",
  rsvp_when: "When",
  rsvp_where: "Where",
  rsvp_who: "Your trainer",
  rsvp_question: "Can you make it?",
  rsvp_yes: "Yes, I'll be there",
  rsvp_maybe: "Not sure yet",
  rsvp_no: "No, I can't",
  rsvp_chosen_yes: "You're saying yes. Send it so your trainer knows.",
  rsvp_chosen_maybe: "You're saying you're not sure. Send it so your trainer knows.",
  rsvp_chosen_no: "You're saying no. Send it so your trainer knows.",
  rsvp_send_sms: "Send as a text",
  rsvp_send_email: "Send as an email",
  rsvp_send_hint:
    "This opens your own messaging app with the reply ready — nothing is sent until you send it.",
  rsvp_email_subject: "About our session",
  rsvp_message_yes: "Yes, I'll be at",
  rsvp_message_maybe: "I'm not sure yet about",
  rsvp_message_no: "Sorry, I can't make",
  transport_sms: "Text message",
  transport_email: "Email",
  transport_share: "Share…",
  transport_copy: "Copy link",
  session_invite_organizer: "Replies come back to",
  session_invite_expiry: "Close replies this many hours before",
  session_invite_expiry_hint:
    "0 keeps replies open until the session starts. Applies to invites you send from now on.",
  session_invite_phone: "Your number, for replies by text",
  session_invite_phone_hint:
    "Optional. With it, a client can answer the invite with a text instead of an email.",
  session_invite_body_reply: "Let me know if you can make it:",
  session_invite_send_sms: "Text it",
  session_invite_sms_text: "Training session",
  session_invite_organizer_hint: "Acceptances arrive as email replies to this address.",
  session_invite_organizer_missing:
    "Without an address, a calendar app has nowhere to send an acceptance.",
  session_invite_send: "Send invite",
  session_invite_sent: "Invite sent",
  session_invite_no_email: "No email address on client profile",
  session_invite_send_to: "Send invite to",
  session_invite_subject: "Training session",
  session_invite_body_greeting: "Hi",
  session_invite_body: "You've been scheduled for a session",
  session_invite_body_attach:
    "The calendar invite file just downloaded — attach it to this email before sending.",
  schedule_conflict_double_booked: "You are booked elsewhere then",
  schedule_conflict_busy_elsewhere: "Your calendar shows you busy",
  schedule_conflict_merged: "Runs alongside — opens as one clipboard",
  schedule_conflict_confirm:
    "This slot clashes with something you are already booked for. Schedule it anyway?",
  session_start_time_title: "Session started off schedule",
  session_start_time_desc:
    "Scheduled for {scheduled}, started {minutes} min {direction}. Move the session to when it is actually running?",
  session_start_time_late: "late",
  session_start_time_early: "early",
  session_start_time_keep: "Keep scheduled",
  session_start_time_apply: "Adjust time",
  session_start_time_delete: "Didn't happen",
  demo_cleanup_title: "Clear demo data",
  demo_cleanup_desc:
    "Your own clients, sessions and logs are never touched. The movement catalog is kept so your programmes keep working.",
  demo_cleanup_none: "There is no demo data left to remove.",
  demo_cleanup_retained_title: "Kept because your work depends on it",
  demo_cleanup_kept: "kept",
  demo_cleanup_blocked:
    "That selection would leave records pointing at things that no longer exist.",
  demo_cleanup_clients: "sample clients",
  demo_cleanup_sessions: "sample sessions",
  demo_cleanup_history: "sample training logs",
  demo_cleanup_plan_updates: "sample plan adjustments",
  demo_cleanup_routines: "sample routines",
  demo_cleanup_exercises: "sample exercises",
  demo_cleanup_notifications: "sample notifications",
  demo_cleanup_remove: "Remove",
  // The cold-start splash (index.html). These are the first words a new trainer reads, and until
  // 2026-09-11 they were the only ones a language choice could not reach: the markup carried the
  // English text and no key, so choosing Slovenian left the invitation into the demo in English
  // (reported by the first trainer to use the app, TODO §45.1). The walkthrough button reuses
  // `walkthrough_title` rather than adding a second spelling of the same name.
  splash_tagline: "A lightweight, free app for your clipboard, sessions and training programmes.",
  splash_dismiss: "Dismiss and continue to the app",
  splash_load_demo: "Explore with demo data",
  splash_start_empty: "Start with an empty app",
  // The trainer's own details (TODO §45.2). The lede says what they are FOR, because nothing in the
  // app shows the trainer their own name back — it is only ever read by an invitation on its way to
  // somebody else, and a form whose purpose is invisible gets filled in wrongly or not at all.
  menu_trainer_details: "My details",
  trainer_details_title: "Your details",
  trainer_details_lede:
    "These go on what you send a client: your name signs the invitation, and your phone and email are how they answer it. They stay on this device.",
  trainer_details_name: "First and last name",
  trainer_details_phone: "Phone",
  trainer_details_email: "Email",
  trainer_details_email_invalid: "That is not an email address. Correct it, or leave it empty.",
  trainer_details_save: "Save my details",
  trainer_details_saved: "Saved.",
  // On the splash the same form has to say, in its own words, that it is optional — the first
  // screen of an app whose pitch is "no signup" must not look like one (TODO §45.2).
  trainer_details_splash_lede:
    "Optional, and you can do it later from the menu. Your name signs the invitations you send clients; your phone and email are how they answer.",
  // The guided walkthrough (TODO §9.5) and the captions of the script it shares with the automatic
  // demo (modules/demo/gymFloorTour.js). Each caption names the control by what it DOES, never by
  // where it is on screen — the panel is read on a phone whose layout is not the one this was
  // written on.
  walkthrough_title: "Guided walkthrough",
  walkthrough_progress: "Step {step} of {count}",
  walkthrough_back: "Back",
  walkthrough_show: "Show me",
  walkthrough_next: "Next",
  walkthrough_done: "Done",
  walkthrough_exit: "End the demo",
  walkthrough_collapse: "Put the demo card away",
  walkthrough_expand: "Back to the demo card",
  // Shown when the trainer has taken the app somewhere the current step cannot happen. It says what
  // is true — they went exploring — rather than blaming them, and gives the two ways on.
  walkthrough_off_track_title: "You have wandered off",
  walkthrough_off_track: "You have left the demo's place in the app. Bring it back, or stop here.",
  walkthrough_return: "Back to the demo",
  walkthrough_leave: "Stop the demo",
  walkthrough_finished: "That's the whole loop — one session, one clipboard, four taps.",
  walkthrough_wrong_place:
    "This step needs a different screen — go back to the sessions board and start it again.",
  walkthrough_stuck:
    "This step didn't complete. Leave the walkthrough and keep exploring — your data is untouched.",
  tour_step_open_session: "Open the group session. One clipboard covers everybody in it.",
  tour_step_focus_exercise:
    "Tap the circuit to bring it into focus. Its controls come within thumb reach.",
  tour_step_signal: "Mark the round Too Easy. One tap logs it and leaves a note for the plan.",
  tour_step_next_participant: "Switch to the next participant — same session, their own plan.",
  // The long demo (TODO §35): chapter titles, the narration cards' bodies, and the labels the
  // narration surface itself needs. Captions for taps that the story shares with the wedge stay
  // under tour_step_* — the same step, said once.
  gym_notes_label: "In the gym",
  label_repeats: "Repeats every week",
  label_repeat_days: "On these days",
  label_repeat_until: "Until (optional)",
  btn_invite_client: "Invite a client",
  // The trainer's own name leads the message, because the person reading it met them once and has
  // no other way to tell this from a phishing text. {trainer} is filled in by intakeInvite.js; the
  // unsigned line is what an install that does not know the trainer's name sends instead.
  intake_invite_message:
    "{trainer} is inviting you to fill in your own details for training, through an app called LibrePT. It takes a minute:",
  intake_invite_message_unsigned:
    "You are invited to fill in your own details for training, through an app called LibrePT. It takes a minute:",
  intake_invite_privacy: "What happens to your data:",
  intake_invite_ready: "Link ready — copy it below",
  intake_invite_title: "Invite a client",
  intake_invite_lede:
    "They fill in their own details and their consent on their own phone, and send it back to you. Nothing is created here until you have read what they send.",
  intake_invite_contact_label: "Their phone number or email address",
  intake_invite_send_sms: "Write the text message",
  intake_invite_send_email: "Write the email",
  intake_invite_send_disabled: "Nowhere to send it yet",
  intake_invite_opens_sms:
    "This opens your own messages app with the invitation already written. You press send there.",
  intake_invite_opens_email:
    "This opens your own mail app with the invitation already written. You press send there.",
  intake_invite_needs_contact:
    "Type a phone number or an email address, or use the other ways below.",
  intake_invite_other_ways: "Other ways to send it",
  intake_invite_qr_label: "A code that opens the sign-up page",
  intake_invite_qr_hint:
    "Hold this up and ask them to point their phone camera at it. It opens the same sign-up page, with your name on it.",
  intake_invite_subject: "Your details for our training",
  intake_invite_sent: "Link sent",
  intake_invite_copied: "Link copied",
  data_wipe_title: "Erase this device's LibrePT data",
  data_wipe_lede:
    "Someone helping you sent you this. Nothing has been erased yet — it happens when you confirm below, and only on this device.",
  data_wipe_found: "Found on this device:",
  data_wipe_nothing: "There is nothing stored on this device to erase.",
  data_wipe_schema_store: "Records stored as {store}",
  data_wipe_unversioned: "Settings, the open session, and this device's own bookkeeping",
  data_wipe_unreachable: "What this cannot reach:",
  data_wipe_confirm: "Erase it",
  menu_import_program: "Import a programme",
  menu_sandbox_enter: "Enter the sandbox",
  notif_sandbox_title: "🧪 Sandbox — a place to try things and learn",
  notif_sandbox_desc:
    "These clients, plans and sessions are a sample gym. Try anything: nothing you do in here can reach your business data. To go back to your own work, open the menu ☰ at the top right and choose Leave the sandbox — you will land where you left off. To be walked through the app step by step, tap Show me around below.",
  sync_sandbox_note: "You are in the sandbox: this syncs the sandbox's own copy, not your work.",
  restore_refused_sandbox_file:
    "This file was made in the sandbox, so it cannot be restored into your own work. Open the sandbox and restore it there.",
  menu_sandbox_leave: "Leave the sandbox",
  sandbox_badge: "SANDBOX",
  sandbox_badge_desc: "Sandbox — nothing here is your own work. Open the risks & data-loss notice.",
  sandbox_stale_title: "This sandbox is from earlier",
  sandbox_stale_body:
    "Its sessions were built around the day it was made, so today's board is empty. Resetting the sandbox data throws away everything you did in the sandbox. Your own work is not touched.",
  menu_sandbox_reset: "Reset sandbox data",
  sandbox_reset_title: "Reset the sandbox data?",
  // NAMES what survives — clients, sessions and plans — on the maintainer's ruling (2026-09-11).
  // It used to state the boundary once instead ("Nothing outside the sandbox changes"), on the
  // reasoning that an inventory of exemptions makes a reader hunt for a fourth. Overruled: the
  // person reading this is one tap from deleting things, and at that moment they want their own
  // records named rather than a rule about scope. What actually holds is still guaranteed by
  // tests/unit_js/data/sandboxWorkspace.test.mjs, which is where a guarantee belongs.
  sandbox_reset_body:
    "This deletes everything in the sandbox and builds a new one, with sample clients and sessions for today. Your own clients, sessions and plans outside the sandbox are safe and do not change.",
  sandbox_reset_decline: "Cancel",
  sandbox_stale_confirm: "Reset sandbox data",
  sandbox_stale_decline: "Cancel",
  sandbox_timer_expired_title: "A timer finished in your own work",
  sandbox_timer_return: "Go back to my work",
  sandbox_timer_discard: "Ignore it",
  program_import_title: "Import a programme",
  program_import_lede:
    "Paste a programme written somewhere else — a chat window, a spreadsheet, a colleague's file. It opens in the ordinary plan editor, where you fix anything that came through wrong.",
  program_import_client: "For whom (optional)",
  program_import_session: "Which session (optional)",
  program_import_text: "Paste the programme here",
  program_import_file: "Read a file",
  program_import_template: "Show me the format",
  program_import_prompt: "Copy the prompt",
  program_import_prompt_copied: "Prompt copied",
  program_import_prompt_text:
    'Write the training programme as JSON in this exact shape, and nothing else: {"format": "{format}", "title": "Session name", "items": [{"name": "Back Squat", "sets": 3, "reps": 5, "weight": 60, "unit": "kg"}, {"rest": 90}]}. Use one item per movement, in the order they are performed, and a {"rest": seconds} item wherever there is a pause.',
  program_import_no_client: "Nobody in particular",
  program_import_no_session: "No session yet",
  program_import_open: "Open in the editor",
  program_import_read: "{count} items read, {custom} of them not in your catalogue.",
  program_import_unreadable:
    "{count} could not be read — they are listed with the position they came in at:",
  program_import_custom_hint: "Not in your catalogue — it came in with the programme",
  program_import_custom_tag: "CUSTOM",
  copy_plan_to: "Copy this plan to…",
  copy_plan_nobody: "Nobody else is in this session yet.",
  unknown_client: "Unknown client",
  bind_participants: "Everyone on this plan",
  unbind_participants: "Give everyone their own plan",
  bound_group_label: "Together",
  plan_fit_hint: "Estimated working time against the session slot, rests excluded",
  plan_fit_over: "over",
  plan_fit_tight: "tight",
  label_apply_to_series: "Change every evening of this session",
  session_one_of_a_series:
    "This is one evening of a repeating session. What you change here changes this evening only.",
  gym_note_in_this_plan: "in this plan",
  feedback_keep_on_record: "Keep this on the client's record",
  // The demo's front door, and the only card a stranger reads standing still rather than mid-tap:
  // it says what the app is, what this run is a story OF, and that none of it can reach their own
  // records. The sandbox line replaces the offer to delete the demo data afterwards — with a
  // separate database (TODO §40) there is nothing to clear, which is the stronger promise.
  story_welcome_title: "Welcome to LibrePT",
  story_welcome_body:
    "LibrePT is an app for personal trainers. You manage appointments with it and build individual and group sessions, and while a workout runs it is your notebook. This guided walkthrough follows the story of three new clients: from the decision to train together and the first invitation, to a session you adjust while it runs. The whole walkthrough happens in the sandbox: a separate copy of the app, kept for learning and trying things out. Everything you do in it is kept apart from your business data about clients, appointments and workouts. You can leave the sandbox at any time from the menu, or reset its data.",
  // The way out is named because this is where somebody decides not to do this at all. ▾ parks the
  // card and ✕ ends the run, and the ✕ is only on the bar the parked card leaves behind
  // (modules/demo/walkthrough.css hides it while the card is open) — so the order matters.
  story_step_welcome:
    "Show me points out three things: the SANDBOX badge in the top bar, and in the ☰ menu the rows Leave the sandbox and Reset sandbox data. Next starts the walkthrough. To try the app without the guide, put this card away with ▾ in its top right corner. A small bar stays on screen: its ✕ ends the walkthrough.",
  story_persona_trainer: "Your phone",
  story_chapter_gym: "In the gym",
  story_persona_client: "Ana's phone",
  story_chapter_arrive: "Three friends arrive",
  story_chapter_intake: "On Ana's phone",
  story_handover_title: "Over to Ana",
  story_back_to_your_phone: "Back to your own phone",
  story_open_client_phone: "Open Ana's phone",
  story_step_arrive_menu:
    "Tap the ☰ button — three stacked lines, in the top right corner of the screen, in the dark bar with the app's name. It opens the menu, and the client register, the movements and the history all live in there.",
  story_step_arrive_clients:
    "In the menu that just dropped down, tap Clients Directory — the row with three little people next to it, at the top of the list. Eight people are already in that directory.",
  story_step_arrive_invite:
    "Tap Invite a client — the button with the share arrows just under the Clients heading, at the top of the list of people. Ana asked about training after a class, and instead of taking her details standing in a corridor, the trainer sends her a link she fills in herself.",
  story_step_arrive_contact:
    "Type the number Ana just read out, into the one box that takes either a number or an email address. The app works out which it is: a number gets a text message, an address gets an email. Nothing is saved about her yet — she is not in your register until she has sent her own details back.",
  story_step_arrive_contact_email:
    "Maja gives an email address instead. Type it over the number in the same box — the app reads what it is and swaps the button from a text message to an email. One box, because a trainer holding a phone should not have to pick which kind of contact they were given.",
  story_step_arrive_close_invite:
    "Close this with the ✕ in the top right corner of the box. Ana has her link and Maja has hers; Nik is still standing here.",
  story_step_arrive_add_manually:
    "Nik is standing right here and reads his details out, so tap Add Client — the green button at the top of the list, next to the one you just used. The link is not the only way in.",
  story_step_arrive_type_name:
    "His name, typed once. That is all a client needs to exist in the register; everything else can arrive later, from him or from you.",
  story_step_arrive_save_client:
    "Tap Save Client at the bottom of the form. He is in the register now — one of three friends in by three different routes, and you typed four words in total.",
  story_review_sender: "Ana Novak",
  story_step_review_attach:
    "Tap the attachment — ana-novak.json.librept-signup, under her message. On a real phone that file IS in your messages, and tapping it opens LibrePT with her details in front of you. Nothing has been added to your register yet.",
  story_step_review_accept:
    "Tap Add to my clients. Ana is in your register, and you typed none of it — first task done, one of three friends in without a word of retyping.",
  story_step_read_on: "Read that, then tap Next to take on the task it sets.",
  story_step_handover:
    "Tap Open Ana's phone — the guide's own button, bottom right. The browser leaves your app and goes to the page Ana really opens from the link in her message, and the story carries on over there, on her side.",
  story_step_thanks:
    "Every task is done, from a question after a class to next week already in the diary. Tap Done to put the guide away and keep exploring the app on your own, or Clear the demo data to empty it out and start with your own clients.",
  story_message_title: "A message from your trainer",
  story_message_body:
    "Fill in your details for our training — it takes a minute and nothing stays on your phone: librept.app/intake — Sam, +386 40 111 222",
  story_arrived_title: "It lands on the trainer's phone",
  story_arrived_body:
    "The file Ana sent arrives in the trainer's own messages, like any other attachment. It travelled the way her message travelled, and no server of ours ever saw it: it left her phone and reached his, and he decides whether she joins the register.",
  story_step_intake_send:
    "Tap Share with my trainer — the green button at the bottom. On a real phone this opens the share sheet, so Ana picks the same conversation the link arrived in. Nothing is uploaded anywhere; a file leaves her phone and that is all.",
  story_step_message:
    "This is what lands on Ana's phone: the trainer's own message, with the link in it. Read it, then tap Next — from here on you are on her side of the story.",
  story_step_arrived: "Read what happened to the file, then tap Next.",
  story_step_back_to_your_phone:
    "Tap Back to your own phone — the browser leaves Ana's page and the story carries on where you left it, on your own.",
  story_step_intake_name:
    "Ana types her own name. It is her phone, and nothing here is stored on it.",
  story_step_intake_email: "Somewhere to send the session times.",
  story_step_intake_injury:
    "The shoulder she still feels sometimes — offered, never demanded, and the page says where the answer goes.",
  story_step_intake_consent:
    "Consent, given here rather than assumed: the wording and the language she read it in are recorded with it.",
  // Named, and new: Ana, Maja and Nik are not in the seeded register — the story is about getting
  // them into it. The people already there (Jane, John, Sarah) are the ones the gym chapter trains.
  story_arrive_open_body:
    "Ana, Maja and Nik ask about training together after a class. They have chosen you to guide them through their strength journey. First task: get all three into your register — two by sending a link they fill in themselves, the third by typing his name.",
  story_handover_body:
    "Ana's link is on its way, and your own phone has done its part. Now you play Ana's side of it, on her phone, on the page she really opens from the message. The page is the real one; only her messages are drawn.",
  story_intake_open_body:
    "You are Ana now, standing outside the studio with a link in a message. There is no app to install and nothing is kept on this phone: fill it in, send it, and it is gone from here.",
  story_intake_close_body:
    "Ana's part is done, and the first task with it. Send hands her file to you, the trainer, and you are the one who reads it and decides — a stranger never writes themselves into your register. Back to your own phone.",
  story_chapter_programme: "The programme",
  story_chapter_evening: "The evening after",
  story_step_programme_open_session:
    "Sunday night. Tuesday's session is already on the board — the trainer opens it to build what they will actually run.",
  story_step_programme_editor:
    "Tap Edit plan — the ✎ row in the menu that just dropped down. Jane's plan opens with the number that decides it beside the title: how much of the hour they booked this actually fills.",
  story_step_programme_add_circuit:
    "Add a finisher: tap + Circuit at the bottom of the plan, the button with the stacked-layers glyph. A new block goes in at the end, ready for the movements that go in it — this is the trainer building the hour on a sofa on Sunday, rather than finding out in the gym on Tuesday.",
  story_step_programme_done:
    "Tap Done, top right. The plan is saved and the session comes back with everybody in it — the plan editor shows one person at a time, and what happens next is about all three.",
  story_step_programme_menu_again: "Open the session menu again — one more thing before Tuesday.",
  story_step_programme_bind:
    "Jane, John and Sarah are doing the same circuit, so they go on one plan — and Tuesday's sets get logged once instead of three times.",
  // The friends who arrive in chapter one are new; Tuesday's session is with Jane, John and Sarah,
  // who are already in the seeded register. Said out loud here, because a viewer who noticed the
  // different names and was told nothing would assume the demo had lost track of its own people.
  story_programme_open_body:
    "Sunday, two days out, on the sofa. Ana's file has landed and her first session is still to come; Tuesday belongs to Jane, John and Sarah, who have been training with you a while. Next task: have their hour ready before anyone is standing in front of you.",
  story_programme_close_body:
    "One plan, three people, and it fits the hour. Task done — Tuesday can be about the training instead of about the phone.",
  story_step_evening_menu: "Home, later that night. Open the menu.",
  story_step_evening_move:
    "Tuesday moves two hours later — agreed with all three after the session. The form says it out loud: this evening only.",
  story_step_evening_move_time:
    "Eight instead of six. Next Tuesday, and the one after, stay exactly where they were.",
  story_step_evening_theme: "Dark, because it is half past ten and the trainer is on a sofa.",
  story_evening_open_body:
    "The session is over, everyone has gone home, and you are back on the sofa. This is the half nobody films: what happens to the notes you took between sets. One last task, then the evening is yours.",
  story_thanks_title: "The evening is won",
  story_clear_demo_data: "Clear the demo data",
  // The story's own voice. It names the people the seed puts on screen — Jane, John, Sarah — because
  // a demo that says "the client" is describing software, and one that says "John, whose knee was
  // rebuilt in 2024" is telling you what the evening was like.
  story_step_open_session:
    "Tuesday, 18:00. Jane and John share a slot, Sarah works her rehab plan in the same hour. One tap, and all three are on one clipboard.",
  story_step_focus_exercise:
    "Jane's circuit comes up. Her round, her numbers, everything in thumb reach.",
  story_step_signal_too_easy:
    "She flew through it. One tap says so — and tonight's plan will hear about it.",
  story_step_next_participant: "John is next. Same session, his own plan, no going back to a desk.",
  story_step_refocus: "Tap his circuit to bring it into focus.",
  story_step_capture_open:
    "Between rounds he mentions his knee — the one that was rebuilt in 2024. The clock keeps running; the note opens over the session.",
  story_step_capture_tag: "Joint pain, on this movement.",
  story_step_capture_note: "And what he actually said, typed with one thumb.",
  // What the demo TYPES, not what it says about typing: a Slovenian viewer watched Ana write her
  // shoulder up in English (reported 2026-08-30, TODO §38.19). The words a person enters belong to
  // that person, so they are translated like everything else they read.
  story_typed_note: "left knee, third round",
  story_typed_injury: "shoulder, two years ago",
  story_step_capture_keep:
    "Kept on John's record. This is not about tonight's load, it is about the next three months.",
  story_step_capture_submit: "Saved — against John, and against this movement.",
  story_step_session_menu: "Open the session menu.",
  story_step_plan_editor:
    "John's plan, and the note from a minute ago is already waiting in it. Nobody went looking for it.",
  story_step_swap_open: "So that movement goes — for John only.",
  story_step_swap_pick:
    "Something gentler for the same muscles. Jane and Sarah keep the plans they were given.",
  story_gym_open_body:
    "Tuesday, ten past six. Jane and John are warming up together, Sarah is in the corner working through her rehab plan, and all three are yours to run from one phone. This is what the last two tasks were preparation for — and you do this one yourself, tap by tap, with the clock running.",
  story_gym_close_body:
    "The hour is done and nothing was written twice. John's knee is on his record, his plan already knows about it, and Jane and Sarah were never interrupted. Keep tapping around, or clear the demo data and start with your own clients.",
  today: "Today",
  tomorrow: "Tomorrow",
  yesterday: "Yesterday",
  upcoming: "Upcoming",
  starts_in: "Starts in",
  overdue: "Overdue",
  elapsed: "Elapsed",
  edit_elapsed_time: "Edit elapsed time",
  live: "Live",
  editing: "Editing",
  unscheduled: "Unscheduled",
  undefined: "Undefined",
  combo_round_title: "Circuit",
  bar_clients_label: "clients",
  next_session_label: "Next",
  signal_too_easy: "Too Easy",
  signal_too_hard: "Too Hard",
  feedback_short: "Notes",
  feedback_has_note: "Feedback (note attached)",
  round_label: "Round",
  complete_round: "Complete round",
  finish_circuit: "Finish circuit",
  rest_label: "Rest",
  skipped: "Skipped",
  // A circuit movement whose target is "as many as you can": the field takes the number that were
  // actually done in this round.
  failure_reps_label: "Reps done",
  failure_reps_placeholder: "Max",

  // Application (☰) header menu + About / Terms modals
  menu_language: "Language",
  menu_theme: "Theme",
  menu_clients_register: "Clients Directory",
  menu_adjustments: "Pending Review",
  menu_connect_cloud: "Connect cloud storage",
  menu_export_data: "Export data as a file",
  drive_sync_connect: "Connect Google Drive",
  drive_sync_now: "Sync Now",
  drive_sync_syncing: "Syncing…",
  // What the header cloud's overlay glyph MEANS, spoken (TODO §3.11) — a shape alone is a hover
  // tooltip's problem in another costume: unreachable on touch, silent to a screen reader.
  drive_sync_glyph_failed: "Last sync failed",
  drive_sync_glyph_disconnected: "Cloud sync not connected",
  drive_sync_glyph_idle: "Cloud sync connected",
  notif_crash_title: "Something went wrong",
  notif_crash_report: "Report this",
  notif_rsvp_title: "RSVP replies",
  notif_rsvp_unknown_client: "A client",
  rsvp_answer_yes: "coming",
  rsvp_answer_no: "can't make it",
  rsvp_answer_maybe: "not sure",
  notif_sync_failed_title: "Cloud sync failed",
  drive_sync_desc_connected:
    "Keep your clients, routines and session history mirrored across your own devices, in a hidden app folder only LibrePT can see in your Google Drive.",
  drive_sync_not_configured: "Google Drive sync isn't set up for this deployment yet.",
  drive_sync_status_ok: "Synced",
  drive_sync_status_ok_conflicts: "Synced with conflicts to review",
  drive_sync_status_error: "Sync failed: {error}",
  drive_sync_status_reauth: "Session expired — tap to reconnect.",
  drive_sync_status_denied:
    "Google hasn't approved this account for sync yet. Your data is safe on this device.",
  drive_sync_status_declined: "Not connected — you can connect any time.",
  drive_sync_review_conflicts: "Review conflicts",
  drive_conflict_type_add_add: "Created on both devices",
  drive_conflict_type_edit_edit: "Edited on both devices",
  drive_conflict_type_delete_edit: "Deleted on this device, edited elsewhere",
  drive_conflict_type_edit_delete: "Edited on this device, deleted elsewhere",
  drive_conflict_deleted: "— deleted —",
  drive_conflict_keep: "Keep this version",
  drive_conflict_keep_deleted: "Delete anyway",
  drive_conflict_local: "This device",
  drive_conflict_remote: "Other device",
  drive_conflict_none: "No conflicts left to review.",
  menu_github: "GitHub project",
  menu_feedback: "Send feedback",
  feedback_route_title: "Tell us what you think",
  feedback_route_lede:
    "Ideas, questions, or anything that felt awkward on the gym floor — one email, no account needed.",
  feedback_route_mail: "Write an email",
  feedback_route_subject: "LibrePT feedback",
  feedback_route_intro: "What I wanted to say:",
  feedback_route_bug_lede:
    "Something broken instead? Open an issue and attach a screenshot — it is the most useful thing you can send, and the app cannot take it for you.",
  feedback_route_public_warning:
    "GitHub issues are public. Crop or blur anything that identifies a client before attaching a screenshot — a bug is reproducible without their names.",
  feedback_route_issue: "Report a bug on GitHub",
  feedback_route_issue_title: "Bug: ",
  feedback_route_issue_placeholder:
    "<!-- What were you doing, and what did you expect instead? -->",
  feedback_route_diagnostics: "Sent with it — you can delete any of it before sending:",
  menu_bug_report: "Bug Reporting",
  menu_about: "About",
  menu_terms: "Terms & disclaimer",
  menu_privacy: "Privacy & GDPR Statement",
  about_title: "About LibrePT",
  about_body:
    "LibrePT is a free, open-source, offline-first clipboard for personal trainers — schedule sessions, run them on the gym floor, and track client progress. By default, all data stays on your local device unless you choose to sync with your personal cloud storage.",
  about_repo: "View the project on GitHub",
  about_licenses: "Licences & attribution",
  terms_title: "Terms & Disclaimer",
  terms_body:
    'LibrePT is provided "as is", without warranty of any kind. It is not medical, health, or professional training advice. Your data is stored on your local device (with optional personal cloud storage/backup integrations enabled by you) and you are responsible for its management. Use at your own risk.',
  terms_agree: "I agree",

  // Notification Area & Welcome Demo
  notif_summary_title: "Notifications & Status Feed",
  notif_empty_title: "No notifications",
  notif_empty_desc: "You're all caught up — there's nothing here right now.",
  notif_seed_demo_title: "👋 Welcome to LibrePT",
  notif_seed_demo_desc:
    "Nothing is saved here yet. To see what the app does, tap Show me around: a guided walkthrough that follows three new clients, from the first invitation to a session in the gym. To try things for yourself, tap Enter the sandbox — a separate copy of the app, where nothing you do changes the records you keep here.",
  notif_demo_mode_title: "⚠️ Demo mode — sample data loaded",
  notif_demo_mode_desc:
    "This app is running on sample clients, routines and sessions. Clear them before you use it for real work: clearing lists exactly what it removes and keeps the movement catalog, so anything you have built on top of it keeps working.",
  filter_participants_placeholder: "Find a client by name...",
  notif_demo_walkthrough_btn: "Show me around",
  notif_demo_mode_reset_btn: "Clear Demo Data & Exit Demo Mode",
  notif_welcome_title: "👋 You're exploring with sample data",
  notif_welcome_desc:
    "The clients, routines and sessions here are a sample gym, including one session already under way. Explore freely — none of these people are real.",
  notif_welcome_clients_btn: "See the sample clients",

  // Build-info dialog: reachable by tapping the header stamp (a tooltip is unreachable on a phone).
  build_info_title: "This build",
  build_info_commit: "Commit",
  build_info_schema: "Data schema",
  build_info_built: "Built",
  build_info_copy: "Copy build details",
  build_info_copied: "Copied",
  build_info_copy_failed: "Select and copy the text above",
  notif_spot_res_title: "📅 Client Spot Reservation",
  notif_spot_res_desc: "Alex Smith booked a spot in Friday HIIT session.",
  notif_spot_cancel_title: "⚠️ Spot Cancellation",
  notif_spot_cancel_desc: "Mike Johnson cancelled spot for Tomorrow 10:00 AM.",
  notif_count_badge: "{unread} unread / {all} all",
  notif_mark_all_read: "Mark all as read",
  notif_unscheduled_plans_title: "Unscheduled plans",
  notif_unscheduled_plans_desc: "{count} plan(s) drafted but not yet assigned to a session.",
  notif_pending_sessions_title: "Sessions awaiting review",
  notif_pending_sessions_desc: "{count} client(s) have unresolved feedback signals from a session.",
  client_email: "Email",
  client_phone: "Phone Number",
  not_specified: "Not specified",
  custom_empty_plan: "Custom / Empty Plan",
  plan_program_title: "Plan Upcoming Program",
  planned_program: "Planned Program",
  // The sideways deck of a client's plans on the clipboard (TODO §52.2 step 4).
  plan_peek_previous: "Previous plan",
  plan_peek_next: "Next plan",
  plan_peek_release_open: "Release to open",
  plan_peek_release_create: "Release to create a plan",
  plan_peek_no_previous: "No previous plan.",
  plan_peek_no_next: "{client} has no next plan yet.",
  plan_peek_create: "Create a plan",
  plan_peek_back_to_today: "Back to today's session",
  date_unknown: "Date Unknown",
  planning: "Planning",
  btn_plan_program: "Plan Program",
  offline_cached_badge: "Offline (Cached Code)",
  unbacked_due: "NOT BACKED UP",
  unbacked_urgent: "AT RISK — BACK UP",
  offline_cached_desc:
    "HTTP server unreachable. Running off cached code; unable to check for updates.",
  offline_cached_status: "HTTP server is currently unreachable. You are running off cached code.",
  consent_legend: "Data Protection (GDPR)",
  consent_signed_label: "Client signed the consent form (data storage & cloud sync)",
  consent_date_label: "Date signed",
  consent_withdrawn_label: "Date withdrawn",
  consent_form_version: "Consent form version",
  consent_lang_label: "Form language",
  consent_send_email: "Email form",
  consent_send_sms: "Send link by SMS",
  consent_no_email: "No email on file",
  consent_no_phone: "No phone on file",
  consent_info_button: "Who keeps the form?",
  consent_info_title: "You keep the signed form",
  consent_info_body:
    "LibrePT records only that consent was given and on which date — never a photo, scan, or signature. As the data controller you are responsible for archiving the signed form yourself, for as long as you hold this client's records, so you can prove the consent if you are ever asked to. If the client withdraws consent, delete their records here and note the withdrawal on your copy.",
  consent_info_ack: "Got it",
  notif_test_data_escaped_title: "Test records are in your data",
  notif_test_data_escaped_desc:
    "{count} record(s) written by a test run are stored together with your own work, in {collections}. They are not yours, and removing them leaves everything you made untouched.",
  notif_test_data_escaped_btn: "Remove the test records",
};
