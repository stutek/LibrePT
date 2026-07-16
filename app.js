// app.js - LibrePT Application Controller Logic
import { DEFAULT_EXERCISES, DEFAULT_CLIENTS, DEFAULT_ROUTINES, DEFAULT_HISTORY, DEFAULT_PLAN_UPDATES, DEFAULT_SESSIONS } from './mockData.js';
import { renderSessionCard } from './components/sessionCard.js';
import { renderExerciseCard } from './components/exerciseCard.js';
import { renderCircuitCard } from './components/circuitCard.js';

// --- TRANSLATION / i18n SYSTEM ---
const TRANSLATIONS = {
  en: {
    logo_title: "LibrePT",
    tab_clients: "Clients",
    tab_routines: "Routines",
    tab_exercises: "Exercises",
    tab_history: "History",
    pending_adjustments: "Pending Plan Adjustments",
    btn_start_session: "Start Custom or Group Session",
    no_pending_adjustments: "No pending plan adjustments. Floor signals are all synced!",
    clients_title: "Clients Directory",
    placeholder_search_clients: "Search clients...",
    btn_add_client: "Add Client",
    notes_injuries: "Pre-existing Injuries & Notes",
    goals: "Training Goals",
    routine_plans: "Routine Plans & History",
    btn_edit_profile: "Edit Profile",
    btn_log_workout: "Log Workout Session",
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
    btn_collapse: "Minimize",
    exercise_of: "Exercise",
    btn_add_set: "Add Set",
    btn_inject_exercise: "Inject Exercise",
    btn_cancel: "Cancel",
    btn_delete_session: "Delete Session",
    btn_complete: "Complete Workout Session",
    btn_log_feedback: "Log Feedback",
    alert_no_sets: "No completed sets were logged. Are you sure you want to finish and save an empty session?",
    confirm_cancel: "Delete this session? Its logged progress and feedback will be permanently discarded.",
    warning_banner_title: "Client Safety Advisory",
    workout_setup_title: "Workout Session Setup",
    select_participants: "Select Participants & Assign Routines",
    btn_launch_clipboard: "Session Details",
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
    backup_center: "Data Backup Center",
    backup_desc: "LibrePT stores your logs directly on this device. You can download a backup file to keep your history safe, or import it to sync with another phone.",
    btn_download_backup: "Download JSON Backup",
    btn_import_backup: "Import JSON Backup",
    danger_zone: "Danger Zone",
    danger_desc: "Resetting will permanently erase all custom client logs, routines, and exercises, replacing them with default mock data.",
    btn_reset_db: "Reset All Database Data",
    confirm_reset: "Are you sure you want to reset the database? All custom clients, history, and routines will be lost.",
    btn_resolve: "Resolve",
    no_exercises_injected: "No Exercises Injected",
    no_exercises_desc: "Please tap \"Inject Exercise\" below to add an exercise for this client.",
    rest_timer: "Rest Timer",
    trainer_set_notes: "Trainer Set Notes",
    kg: "kg",
    reps_label: "reps",
    add_new_client: "Add New Client",
    edit_client_profile: "Edit Client Profile",
    client_name: "Client Name",
    current_weight: "Current Weight (kg)",
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
    no_routines_found: "No routine templates found. Click \"New Routine\" to design one.",
    no_description: "No description.",
    btn_start_group_session: "Start Group Session",
    no_exercises_matched: "No exercises match filter criteria.",
    no_instructions: "No instructions.",
    min_session: "min session",
    less_than_minute: "< 1 min",
    set_label: "Set",
    no_details_specified: "No details specified.",
    no_clients_found: "No clients found. Click \"Add Client\" to create one.",
    no_weight_logged: "No weight logged",
    btn_back: "Back",
    routines_desc: "Select or edit workout routines. Launch them with individual or group sessions.",
    filter_all: "All",
    history_desc: "Log of all completed sessions across all clients.",
    sessions_schedule: "Sessions Schedule",
    from_date: "From",
    btn_sync_calendar: "Sync Calendar",
    btn_sync_data: "Sync Data",
    booking_spots: "spots booked",
    spots_filled: "spots filled",
    btn_launch_clipboard_short: "Session Details",
    syncing_calendar: "Syncing...",
    calendar_synced: "Calendar synchronized successfully!",
    no_bookings_today: "No bookings found for today.",
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
    today: "Today",
    tomorrow: "Tomorrow",
    yesterday: "Yesterday",
    upcoming: "Upcoming",
    undefined: "Undefined",
    combo_round_title: "Linked Combo Round",
    bar_clients_label: "clients",
    next_session_label: "Next",
    signal_too_easy: "Too Easy",
    signal_too_hard: "Too Hard",
    feedback_short: "Feedback"
  },
  sl: {
    logo_title: "LibrePT",
    tab_clients: "Stranke",
    tab_routines: "Rutine",
    tab_exercises: "Vaje",
    tab_history: "Zgodovina",
    pending_adjustments: "Čakajoče prilagoditve načrta",
    btn_start_session: "Začni sejo po meri ali skupinsko sejo",
    no_pending_adjustments: "Ni čakajočih prilagoditev načrta. Vsi signali s tal so usklajeni!",
    clients_title: "Imenik strank",
    placeholder_search_clients: "Išči stranke...",
    btn_add_client: "Dodaj stranko",
    notes_injuries: "Predhodne poškodbe in opombe",
    goals: "Cilji treninga",
    routine_plans: "Načrti rutine in zgodovina",
    btn_edit_profile: "Uredi profil",
    btn_log_workout: "Zabeleži vadbo",
    btn_add_plan: "Dodaj prilagoditev načrta",
    client_history_header: "Zgodovina zabeleženih vadb",
    no_history_yet: "Zgodovina še ni zabeležena.",
    routines_title: "Predloge rutine",
    placeholder_search_routines: "Išči rutine...",
    btn_create_routine: "Ustvari rutino",
    exercises_count: "vaje",
    exercises_title: "Knjižnica vaj",
    placeholder_search_exercises: "Išči vaje...",
    btn_add_exercise: "Dodaj vajo",
    history_title: "Splošna zgodovina vadb",
    no_workouts_history: "V splošni zgodovini ni zabeleženih vadb.",
    live_tracking_clipboard: "Sledenje vadbi v živo",
    btn_collapse: "Minimiziraj",
    exercise_of: "Vaja",
    btn_add_set: "Dodaj serijo",
    btn_inject_exercise: "Vstavi vajo",
    btn_cancel: "Prekliči",
    btn_delete_session: "Izbriši sejo",
    btn_complete: "Zaključi vadbo",
    btn_log_feedback: "Zabeleži povratne informacije",
    alert_no_sets: "Ni zabeleženih zaključenih serij. Ali ste prepričani, da želite zaključiti in shraniti prazno vadbo?",
    confirm_cancel: "Izbriši to sejo? Zabeležen napredek in povratne informacije bodo trajno izgubljeni.",
    warning_banner_title: "Varnostno opozorilo za stranko",
    workout_setup_title: "Nastavitev seje vadbe",
    select_participants: "Izberi udeležence in dodeli rutine",
    btn_launch_clipboard: "Podrobnosti seje",
    err_select_client: "Izbrati morate vsaj eno stranko.",
    err_assign_routine: "Prosimo, dodelite predlogo rutine vsem izbranim strankam.",
    add_ex_session_title: "Vstavi vajo na vadbišču",
    select_exercise: "Izberi vajo",
    sets: "Serije",
    reps: "Ponovitve",
    weight: "Teža (kg)",
    rest_seconds: "Premor (sek)",
    btn_inject: "Vstavi vajo",
    log_client_feedback: "Zabeleži povratne informacije",
    feedback_for: "Povratne informacije za",
    feedback_on: "pri",
    custom_details: "Opombe po meri",
    btn_log_alert: "Zapiši opozorilo",
    theme_light: "Svetla tema",
    theme_dark: "Temna tema",
    backup_center: "Središče za varnostno kopiranje",
    backup_desc: "LibrePT hrani vaše podatke neposredno v tej napravi. Prenesete lahko datoteko z varnostno kopijo ali jo uvozite za sinhronizacijo z drugim telefonom.",
    btn_download_backup: "Prenesi varnostno kopijo JSON",
    btn_import_backup: "Uvozi varnostno kopijo JSON",
    danger_zone: "Nevarno območje",
    danger_desc: "Ponastavitev bo trajno izbrisala vse podatke strank, rutine in vaje ter jih nadomestila s privzetimi demo podatki.",
    btn_reset_db: "Ponastavi vse podatke",
    confirm_reset: "Ali ste prepričani, da želite ponastaviti zbirko podatkov? Vse stranke po meri, zgodovina in rutine bodo izgubljene.",
    btn_resolve: "Razreši",
    no_exercises_injected: "Ni vstavljenih vaj",
    no_exercises_desc: "Prosimo, tapnite \"Vstavi vajo\" spodaj, da dodate vajo za to stranko.",
    rest_timer: "Časomer premora",
    trainer_set_notes: "Trenerjeve opombe serije",
    kg: "kg",
    reps_label: "pon.",
    add_new_client: "Dodaj novo stranko",
    edit_client_profile: "Uredi profil stranke",
    client_name: "Ime stranke",
    current_weight: "Trenutna teža (kg)",
    goals_placeholder: "npr. Pridobivanje mišične mase, izguba maščobe...",
    save_client: "Shrani stranko",
    create_routine_title: "Ustvari predlogo rutine",
    edit_routine_title: "Uredi predlogo rutine",
    routine_name: "Ime rutine",
    routine_desc: "Opis",
    btn_save_routine: "Shrani predlogo rutine",
    joined: "Pridružil se",
    no_goals_specified: "Cilji niso določeni.",
    no_notes_specified: "Brez zabeleženih zdravstvenih težav ali posebnosti.",
    no_weight_records: "Ni zapisov teže.",
    log_weights_progression: "Zabeležite teže za spremljanje napredka.",
    need_two_entries: "Za grafikon potrebujete vsaj 2 zapisa.",
    no_workouts_logged: "Ni še zabeleženih vadb.",
    no_routines_found: "Predlog rutine ni mogoče najti. Kliknite \"Ustvari rutino\", da jo oblikujete.",
    no_description: "Brez opisa.",
    btn_start_group_session: "Začni skupinsko sejo",
    no_exercises_matched: "Nobena vaja ne ustreza kriterijem filtra.",
    no_instructions: "Brez navodil.",
    min_session: "min vadba",
    less_than_minute: "< 1 min",
    set_label: "Serija",
    no_details_specified: "Podrobnosti niso navedene.",
    no_clients_found: "Strank ni mogoče najti. Kliknite \"Dodaj stranko\", da jo ustvarite.",
    no_weight_logged: "Teža ni zabeležena",
    btn_back: "Nazaj",
    routines_desc: "Izberite ali uredite vadbene rutine. Zaženite jih za posameznike ali skupine.",
    filter_all: "Vse",
    history_desc: "Dnevnik vseh zaključenih vadb za vse stranke.",
    sessions_schedule: "Urnik sej",
    from_date: "Od",
    btn_sync_calendar: "Sinhroniziraj",
    btn_sync_data: "Sinhroniziraj podatke",
    booking_spots: "mest zasedenih",
    spots_filled: "mest zasedenih",
    btn_launch_clipboard_short: "Podrobnosti seje",
    syncing_calendar: "Sinhronizacija...",
    calendar_synced: "Koledar je bil uspešno sinhroniziran!",
    no_bookings_today: "Za danes ni najdenih rezervacij.",
    voice_note_label: "Glasovna opomba (zasebnost-prva)",
    voice_ready: "Tapnite mikrofon za snemanje opombe",
    voice_recording: "Snemanje... Tapnite ponovno za shranitev",
    voice_transcribing: "Lokalno prepisovanje zvoka...",
    voice_transcription_done: "Prepis v napravi je zaključen!",
    voice_playing: "Predvajanje opombe...",
    up_next_label: "Naslednja vaja",
    last_exercise: "Zadnja vaja",
    program_not_defined: "Program ni določen",
    no_members_assigned: "Ni udeležencev",
    session_completed: "Zaključeno",
    today: "Danes",
    tomorrow: "Jutri",
    yesterday: "Včeraj",
    upcoming: "Prihodnje",
    undefined: "Nedoločen",
    combo_round_title: "Povezana kombinirana serija",
    bar_clients_label: "strank",
    next_session_label: "Naslednja",
    signal_too_easy: "Prelahko",
    signal_too_hard: "Pretežko",
    feedback_short: "Opomba"
  }
};

function t(key) {
  const lang = state.lang || 'en';
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  return dict[key] || key;
}

function applyTranslations(lang = state.lang || 'en') {
  state.lang = lang;
  
  // Set dropdown switcher value
  const switcher = document.getElementById('lang-switcher');
  if (switcher) switcher.value = lang;

  // Theme dropdown labels are localized outside the staticMappings table (compact forms)
  applyThemeSwitcherLabels();

  const tDict = TRANSLATIONS[lang];
  if (!tDict) return;
  
  // Map of selector to translation key
  const staticMappings = {
    '.logo-area h1': 'logo_title',
    'button[data-view="clients"] span': 'tab_clients',
    'button[data-view="routines"] span': 'tab_routines',
    'button[data-view="exercises"] span': 'tab_exercises',
    'button[data-view="history"] span': 'tab_history',
    
    // Dashboard / Clients view
    '#pending-adjustments-title': 'pending_adjustments',
    '#view-clients .view-header h2': 'clients_title',
    '#btn-add-client': 'btn_add_client',
    '#btn-sync-calendar-text': 'btn_sync_data',
    
    // Client Detail view
    '#view-client-detail .client-profile-card h4:nth-of-type(1)': 'notes_injuries',
    '#view-client-detail .client-profile-card h4:nth-of-type(2)': 'goals',
    '#view-client-detail .client-profile-card h4:nth-of-type(3)': 'routine_plans',
    '#btn-edit-client': 'btn_edit_profile',
    '#btn-start-client-workout': 'btn_log_workout',
    '#view-client-detail .history-section h5': 'client_history_header',
    '#btn-back-to-clients': 'btn_back',
    
    // Routines View
    '#view-routines .view-header h2': 'routines_title',
    '#btn-add-routine': 'btn_create_routine',
    '#view-routines .view-desc': 'routines_desc',
    
    // Exercises View
    '#view-exercises .view-header h2': 'exercises_title',
    '#btn-add-exercise': 'btn_add_exercise',
    '.filter-chips button[data-filter="All"]': 'filter_all',
    
    // History View
    '#view-history .view-header h2': 'history_title',
    '#view-history .view-desc': 'history_desc',
    
    // Active session clipboard overlay
    '#btn-add-exercise-to-session': 'btn_inject_exercise',
    '#btn-delete-session': 'btn_delete_session',
    '#btn-finish-session': 'btn_complete',

    // Dialog setups
    '#dialog-workout-setup .modal-header h3': 'workout_setup_title',
    '#dialog-workout-setup label[for="setup-participants-assignment-list"]': 'select_participants',
    '#dialog-workout-setup button[type="submit"]': 'btn_launch_clipboard',
    
    '#dialog-add-session-exercise .modal-header h3': 'add_ex_session_title',
    '#dialog-add-session-exercise label[for="session-add-select-ex"]': 'select_exercise',
    '#dialog-add-session-exercise label[for="session-add-sets"]': 'sets',
    '#dialog-add-session-exercise label[for="session-add-reps"]': 'reps',
    '#dialog-add-session-exercise label[for="session-add-weight"]': 'weight',
    '#dialog-add-session-exercise label[for="session-add-rest"]': 'rest_seconds',
    '#dialog-add-session-exercise button[type="submit"]': 'btn_inject',
    
    '#dialog-feedback .modal-header h3': 'log_client_feedback',
    '#dialog-feedback label[for="feedback-custom-note"]': 'custom_details',
    '#dialog-feedback button[type="submit"]': 'btn_log_alert',
    '#label-voice-note': 'voice_note_label',
    '#voice-record-status': 'voice_ready',

    '#dialog-backup .modal-header h3': 'backup_center',
    '#dialog-backup .dialog-desc': 'backup_desc',
    '#dialog-backup #btn-download-backup': 'btn_download_backup',
    '#dialog-backup label[for="input-import-backup"]': 'btn_import_backup',
    '#dialog-backup .danger-zone h4': 'danger_zone',
    '#dialog-backup .danger-zone p': 'danger_desc',
    '#dialog-backup #btn-reset-db': 'btn_reset_db',
    
    // Add Client modal
    '#client-modal-title': 'add_new_client',
    '#dialog-client label[for="client-name"]': 'client_name',
    '#dialog-client label[for="client-weight"]': 'current_weight',
    '#dialog-client label[for="client-goals"]': 'goals',
    '#dialog-client button[type="submit"]': 'save_client',
    
    // Routine Template modal
    '#routine-modal-title': 'create_routine_title',
    '#dialog-routine label[for="routine-name"]': 'routine_name',
    '#dialog-routine label[for="routine-desc"]': 'routine_desc',
    '#dialog-routine button[type="submit"]': 'btn_save_routine'
  };
  
  for (const selector in staticMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const key = staticMappings[selector];
      const val = tDict[key];
      if (val) {
        // preserve icons if any
        const icon = el.querySelector('i');
        if (icon) {
          el.innerHTML = '';
          el.appendChild(icon);
          el.appendChild(document.createTextNode(' ' + val));
        } else {
          el.textContent = val;
        }
      }
    }
  }

  // Update input placeholders
  const placeholderMappings = {
    '#search-clients': 'placeholder_search_clients',
    '#search-routines': 'placeholder_search_routines',
    '#search-exercises': 'placeholder_search_exercises',
    '#client-goals': 'goals_placeholder',
    '#feedback-custom-note': 'custom_details'
  };

  for (const selector in placeholderMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const key = placeholderMappings[selector];
      const val = tDict[key];
      if (val) {
        el.placeholder = val;
      }
    }
  }

  // Update screen-reader region labels
  const ariaMappings = {
    '#sessions-categories-grid': 'sessions_schedule'
  };

  for (const selector in ariaMappings) {
    const el = document.querySelector(selector);
    if (el) {
      const val = tDict[ariaMappings[selector]];
      if (val) {
        el.setAttribute('aria-label', val);
      }
    }
  }

  // The day title bar is data-driven (weekday/date/arrows), so it re-renders rather than map statically
  renderSessionsTitleBar();
}

// --- STATE MANAGEMENT ---
let state = {
  clients: [],
  exercises: [],
  routines: [],
  history: [],
  planUpdates: [],
  bookings: [],
  lang: 'en'
};

let activeSession = null;
// Voice-note recorder state for the feedback modal — module-scoped so the card's
// Log Feedback button (openFeedbackModal) and the modal's own handlers share it.
let feedbackIsRecording = false;
let feedbackHasVoiceNote = false;
let restTimer = {
  intervalId: null,
  secondsRemaining: 0,
  isActive: false,
  originalDuration: 60
};

// --- INITIALIZE APPLICATION ---
// Best-effort: size the browser window itself to a phone viewport on load/reload, so
// the gym-floor phone view is what you see without manually opening DevTools' device
// toolbar every time. Browsers only honor resizeTo() on a window the page itself opened
// via script with a single tab/history entry (e.g. `chrome --app=<url>`, or a
// window.open() popup) — on an ordinary browser tab this is a documented no-op, not a bug.
function resizeToPhoneViewport() {
  const targetWidth = 412;
  const targetHeight = 915;
  try {
    window.resizeTo(targetWidth, targetHeight);
  } catch (e) {
    // Disallowed by the browser — silently ignored, nothing else on the page depends on it
  }
}

function init() {
  resizeToPhoneViewport();

  // Load data from LocalStorage or initialize with Mock Data
  let savedData = localStorage.getItem('librept_db');
  if (!savedData) {
    // Migrate data from old OpenPT key if it exists
    savedData = localStorage.getItem('openpt_db');
    if (savedData) {
      localStorage.setItem('librept_db', savedData);
      localStorage.removeItem('openpt_db');
      
      const activeSessionData = localStorage.getItem('openpt_active_session');
      if (activeSessionData) {
        localStorage.setItem('librept_active_session', activeSessionData);
        localStorage.removeItem('openpt_active_session');
      }
    }
  }

  if (savedData) {
    try {
      state = JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing local storage database. Re-seeding...', e);
      seedMockData();
    }
  } else {
    seedMockData();
  }

  if (!state.lang) state.lang = 'en';

  // Ensure new bookings/sessions mock data is loaded and has the modern today/tomorrow schema
  const hasTodayOrTomorrow = (state.bookings || []).some(b => b.day === 'today' || b.day === 'tomorrow');
  if (!state.bookings || state.bookings.length < DEFAULT_SESSIONS.length || !hasTodayOrTomorrow) {
    state.bookings = [...DEFAULT_SESSIONS];
    saveToLocalStorage();
  }

  // Demo-data version guard. Editing mockData.js otherwise leaves anyone with an existing
  // localStorage db seeing the old demo data (collections are only seeded on an empty db).
  // Bump SEED_VERSION whenever the demo dataset changes to force a full refresh of every
  // reference collection, then re-seed session 1 as a live workout. This is demo behaviour:
  // it does discard in-session test edits, which is the intent for a reshapeable prototype.
  const SEED_VERSION = 6;
  const storedSeed = parseInt(localStorage.getItem('librept_seed_version') || '0', 10);
  if (storedSeed < SEED_VERSION) {
    state.clients = [...DEFAULT_CLIENTS];
    state.exercises = [...DEFAULT_EXERCISES];
    state.routines = [...DEFAULT_ROUTINES];
    state.history = [...DEFAULT_HISTORY];
    state.planUpdates = [...DEFAULT_PLAN_UPDATES];
    state.bookings = [...DEFAULT_SESSIONS];
    localStorage.setItem('librept_seed_version', String(SEED_VERSION));
    saveToLocalStorage();
    // Demo: open on session 1 already in progress, participants at varied completion
    seedDemoActiveSession();
  }

  // Set up Event Listeners
  setupNavigation();
  setupClientForms();
  setupRoutineForms();
  setupExerciseForms();
  setupWorkoutSetup();
  setupActiveSession();
  setupRestTimer();
  setupBackupRestore();
  setupCalendarBookings();

  // Set up language switcher listener
  const switcher = document.getElementById('lang-switcher');
  if (switcher) {
    switcher.value = state.lang;
    switcher.addEventListener('change', (e) => {
      state.lang = e.target.value;
      saveToLocalStorage();
      applyTranslations(state.lang);
      
      // Re-render views to apply translations
      renderClientsList();
      renderRoutinesList();
      renderExercisesList();
      renderGlobalHistory();
      renderPendingPlanAdjustments();
      renderSessions();
      populateDropdownSelectors();
      if (activeSession) {
        renderActiveGroupBoard();
        renderActiveSessionBarLabels();
      }
    });
  }

  // Apply translations initially
  applyTranslations(state.lang);

  // Render Initial Views
  renderClientsList();
  renderRoutinesList();
  renderExercisesList();
  renderGlobalHistory();
  renderPendingPlanAdjustments();
  renderSessions();
  populateDropdownSelectors();

  // Check if there was an active session saved (session recovery)
  recoverActiveSession();

  // Keep the idle bar's "next session" + starts-in countdown fresh even with no other
  // trigger firing (an active session's own 1s tick handles the bar while one is running)
  setInterval(renderIdleSessionBar, 30000);
}

function seedMockData() {
  const currentLang = state.lang || 'en';
  state.clients = [...DEFAULT_CLIENTS];
  state.exercises = [...DEFAULT_EXERCISES];
  state.routines = [...DEFAULT_ROUTINES];
  state.history = [...DEFAULT_HISTORY];
  state.planUpdates = [...DEFAULT_PLAN_UPDATES];
  state.bookings = [...DEFAULT_SESSIONS];
  state.lang = currentLang;
  saveToLocalStorage();
}

function saveToLocalStorage() {
  localStorage.setItem('librept_db', JSON.stringify(state));
}

// Demo-only: seeds session 1 (b-1) as a live, half-finished workout so the prototype
// opens on a running session rather than an empty dashboard. Each participant is parked
// at a different exercise so the clipboard shows a spread of card-completion counts.
// Written straight to the active-session cache; recoverActiveSession() picks it up on init.
function seedDemoActiveSession() {
  const booking = (state.bookings || []).find(b => b.id === 'b-1');
  if (!booking) return;

  const participantIds = booking.participants.filter(pid => state.clients.some(c => c.id === pid));
  if (participantIds.length === 0) return;

  const routine = state.routines.find(r => r.id === booking.routineId) || state.routines[0];
  if (!routine) return;

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  // Backdate the start by an hour and end an hour out: the session sits at its midpoint,
  // so the bar's countdown reads ~1h remaining of a 2h slot ("half done").
  const startTime = now - HOUR;

  const session = {
    startTime,
    duration: Math.floor((now - startTime) / 1000),
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    booking: {
      titles: [booking.title],
      day: booking.day,
      startDate: new Date(now - HOUR).toISOString(),
      endDate: new Date(now + HOUR).toISOString(),
      timeLabel: booking.time
    },
    feedback: []
  };

  // Different completed-exercise count per participant (clamped to the routine length)
  const completedCounts = [4, 2, 5, 3, 1, 3, 0];

  participantIds.forEach((pid, i) => {
    const clientState = {
      routineId: routine.id,
      routineName: routine.name,
      activeExerciseIndex: 0,
      exercises: [],
      logs: {}
    };

    routine.exercises.forEach(item => {
      const ex = state.exercises.find(e => e.id === item.id);
      if (!ex) return;
      clientState.exercises.push({
        id: item.id,
        name: ex.name,
        category: ex.category,
        instructions: ex.instructions,
        setsTargetCount: item.sets,
        repsTarget: item.reps,
        weightTarget: item.weight,
        rest: item.rest,
        circuitId: item.circuitId || null,
        circuitTitle: item.circuitTitle || '',
        circuitSeries: item.circuitSeries || 1
      });
      clientState.logs[item.id] = Array.from({ length: item.sets }, () => ({
        reps: item.reps,
        weight: item.weight,
        completed: false,
        note: ''
      }));
    });

    const doneCount = Math.min(completedCounts[i % completedCounts.length], clientState.exercises.length);
    clientState.exercises.forEach((ex, exIdx) => {
      if (exIdx < doneCount) {
        (clientState.logs[ex.id] || []).forEach(l => { l.completed = true; });
      }
    });
    clientState.activeExerciseIndex = Math.min(doneCount, Math.max(0, clientState.exercises.length - 1));

    session.clientRoutines[pid] = clientState;
  });

  localStorage.setItem('librept_active_session', JSON.stringify(session));
}

// --- VIEW ROUTER ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewTarget = item.getAttribute('data-view');
      switchView(viewTarget);
    });
  });

  // Logo Area home click handler
  const logoArea = document.getElementById('logo-area');
  if (logoArea) {
    logoArea.addEventListener('click', () => {
      switchView('clients');
    });
  }

  const logoAreaClipboard = document.getElementById('logo-area-clipboard');
  if (logoAreaClipboard) {
    logoAreaClipboard.addEventListener('click', () => {
      document.getElementById('active-session-overlay').classList.add('hidden');
    });
  }

  // Theme controller: dark (default), light, and "Red" — a Red-inspired
  // red/gold skin. The pick is a dropdown (not a toggle) and is persisted so it survives
  // reloads. Each theme is a single body class; the CSS vars for dark live on :root, so the
  // dark-theme class is just a marker while light-theme/red-theme override those vars.
  setupThemeSwitcher();

  // Client Details back button
  document.getElementById('btn-back-to-clients').addEventListener('click', () => {
    switchView('clients');
  });

  setupSessionsDayNav();
}

// Each theme maps to exactly one body class. Dark's variables live on :root, so switching
// to dark just means clearing the other theme classes.
const THEME_BODY_CLASS = { dark: 'dark-theme', light: 'light-theme', red: 'red-theme' };
// The address-bar / PWA chrome colour per theme, kept in step with each theme's --bg-color.
const THEME_META_COLOR = { dark: '#09090b', light: '#f8fafc', red: '#45060b' };
// Compact, localized labels for the dropdown (the long theme_* i18n strings don't fit).
const THEME_SWITCHER_LABELS = {
  en: { dark: 'Dark', light: 'Light', red: 'Red' },
  sl: { dark: 'Temna', light: 'Svetla', red: 'Rdeča' }
};

function applyTheme(theme) {
  const cls = THEME_BODY_CLASS[theme] || THEME_BODY_CLASS.dark;
  Object.values(THEME_BODY_CLASS).forEach(c => document.body.classList.remove(c));
  document.body.classList.add(cls);
  localStorage.setItem('librept-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META_COLOR[theme] || THEME_META_COLOR.dark);
}

// Refresh the dropdown option text for the active language (also called on language switch).
function applyThemeSwitcherLabels() {
  const sel = document.getElementById('theme-switcher');
  if (!sel) return;
  const labels = THEME_SWITCHER_LABELS[state.lang] || THEME_SWITCHER_LABELS.en;
  Array.from(sel.options).forEach(opt => { if (labels[opt.value]) opt.textContent = labels[opt.value]; });
}

function setupThemeSwitcher() {
  const saved = localStorage.getItem('librept-theme') || 'dark';
  applyTheme(saved);
  const sel = document.getElementById('theme-switcher');
  if (sel) {
    sel.value = saved;
    sel.addEventListener('change', () => applyTheme(sel.value));
  }
  applyThemeSwitcherLabels();
}

function switchView(viewId) {
  // Hide all views
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.remove('active');
  });

  // Deactivate all nav items
  document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
    item.classList.remove('active');
  });

  // Show target view
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Highlight bottom nav matching tab
  // Handles secondary screens (like client detail) which don't map to bottom nav
  const mainTab = viewId.split('-')[0]; // handles 'client-detail' -> 'client' or matches 'clients'
  const tabItem = document.querySelector(`.bottom-nav .nav-item[data-view^="${mainTab}"]`);
  if (tabItem) {
    tabItem.classList.add('active');
  }

  // Scroll to top
  document.getElementById('main-content').scrollTop = 0;

  // Coming home always re-focuses today, so the trainer never lands on a stale day
  if (viewId === 'clients') {
    requestAnimationFrame(() => focusSessionsColumn('today', 'smooth'));
  }
}

// --- RENDER FUNCTIONS ---

function renderPendingPlanAdjustments() {
  const container = document.getElementById('dashboard-adjustments-list');
  const countBadge = document.getElementById('badge-adjustments-count');
  
  if (!container) return;
  container.innerHTML = '';
  
  const unresolved = (state.planUpdates || []).filter(u => !u.resolved);
  
  if (countBadge) {
    countBadge.textContent = unresolved.length;
    if (unresolved.length === 0) {
      countBadge.style.display = 'none';
    } else {
      countBadge.style.display = 'inline-block';
    }
  }
  
  if (unresolved.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="padding: 16px;">${t('no_pending_adjustments')}</div>`;
    return;
  }
  
  unresolved.forEach(u => {
    const card = document.createElement('div');
    card.className = 'adjustment-card card glassmorphic';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.padding = '12px';
    card.style.marginBottom = '8px';
    card.style.borderLeft = '4px solid var(--accent-cyan)';
    
    const info = document.createElement('div');
    info.style.flex = '1';
    
    // Format tag badge color based on severity
    let badgeClass = 'badge-cyan';
    if (u.tag.includes('Pain') || u.tag.includes('Discomfort')) badgeClass = 'badge-danger';
    else if (u.tag.includes('Hard')) badgeClass = 'badge-warning';
    else if (u.tag.includes('Easy') || u.tag.includes('Progression')) badgeClass = 'badge-success';
    
    let voiceNoteHTML = '';
    if (u.hasVoiceNote) {
      voiceNoteHTML = `
        <div class="mini-audio-note" style="display: flex; align-items: center; gap: 6px; margin-top: 6px; background: rgba(0,255,255,0.05); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(0,255,255,0.15); width: fit-content;">
          <button type="button" class="btn-play-adjustment-audio" data-id="${u.id}" style="background: none; border: none; color: var(--accent-cyan); cursor: pointer; padding: 0; display: inline-flex; align-items: center;"><i class="fa-solid fa-circle-play" style="font-size: 14px;"></i></button>
          <span class="audio-status-label" style="font-size: 9px; color: var(--text-muted); font-family: monospace;">voice_memo.wav (0:04)</span>
        </div>
      `;
    }

    info.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
        <strong style="color: var(--text-color); font-size: 13px;">${escapeHTML(u.clientName)}</strong>
        <span class="badge ${badgeClass}" style="font-size: 9px; padding: 2px 6px;">${escapeHTML(u.tag)}</span>
      </div>
      <div style="font-size: 11px; color: var(--text-muted);">
        ${t('exercise_of')}: <span class="font-semibold" style="color: var(--accent-cyan);">${escapeHTML(u.exerciseName)}</span>
      </div>
      ${voiceNoteHTML}
    `;
    
    const btn = document.createElement('button');
    btn.className = 'btn primary-btn btn-xs btn-resolve-alert';
    btn.innerHTML = `<i class="fa-solid fa-check"></i> ${t('btn_resolve')}`;
    btn.addEventListener('click', () => {
      openAdjustmentWizard(u.id);
    });
    
    card.appendChild(info);
    card.appendChild(btn);

    // Bind event to play audio preview
    if (u.hasVoiceNote) {
      const playBtn = card.querySelector('.btn-play-adjustment-audio');
      const audioStatus = card.querySelector('.audio-status-label');
      if (playBtn && audioStatus) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const playIcon = playBtn.querySelector('i');
          if (playIcon.classList.contains('fa-circle-play')) {
            playIcon.className = 'fa-solid fa-circle-pause';
            audioStatus.textContent = t('voice_playing');
            
            setTimeout(() => {
              playIcon.className = 'fa-solid fa-circle-play';
              audioStatus.textContent = 'voice_memo.wav (0:04)';
            }, 3000);
          } else {
            playIcon.className = 'fa-solid fa-circle-play';
            audioStatus.textContent = 'voice_memo.wav (0:04)';
          }
        });
      }
    }

    container.appendChild(card);
  });
}

function resolvePendingAdjustment(id) {
  const index = state.planUpdates.findIndex(u => u.id === id);
  if (index !== -1) {
    state.planUpdates[index].resolved = true;
    saveToLocalStorage();
    renderPendingPlanAdjustments();
  }
}

function openAdjustmentWizard(updateId) {
  const update = state.planUpdates.find(u => u.id === updateId);
  if (!update) return;

  const dialog = document.getElementById('dialog-apply-adjustment');
  if (!dialog) return;

  // Set inputs
  document.getElementById('adjust-update-id').value = updateId;
  document.getElementById('adjust-client-id').value = update.clientId;
  
  // Set text labels
  document.getElementById('adjust-client-name').textContent = update.clientName;
  document.getElementById('adjust-feedback-tag').textContent = update.tag;
  
  // Parse note details for display
  let cleanNote = update.tag;
  if (update.tag.includes(' - ')) {
    const parts = update.tag.split(' - ');
    document.getElementById('adjust-feedback-tag').textContent = parts[0];
    cleanNote = parts.slice(1).join(' - ');
  }
  document.getElementById('adjust-details').textContent = cleanNote;

  // Voice note player handling
  const voiceContainer = document.getElementById('adjust-voice-player-container');
  if (update.hasVoiceNote) {
    voiceContainer.classList.remove('hidden');
    const playBtn = document.getElementById('adjust-btn-play-voice');
    // reset listener
    playBtn.replaceWith(playBtn.cloneNode(true));
    const newPlayBtn = document.getElementById('adjust-btn-play-voice');
    newPlayBtn.addEventListener('click', () => {
      const icon = newPlayBtn.querySelector('i');
      if (icon.classList.contains('fa-circle-play')) {
        icon.className = 'fa-solid fa-circle-pause';
        setTimeout(() => {
          icon.className = 'fa-solid fa-circle-play';
        }, 3000);
      } else {
        icon.className = 'fa-solid fa-circle-play';
      }
    });
  } else {
    voiceContainer.classList.add('hidden');
  }

  // Find target exercise & routine database links
  const exercise = state.exercises.find(e => e.name === update.exerciseName);
  const exerciseId = exercise ? exercise.id : '';
  const routine = state.routines.find(r => r.exercises.some(ex => ex.id === exerciseId));
  const exMapping = routine ? routine.exercises.find(ex => ex.id === exerciseId) : null;

  document.getElementById('adjust-routine-id').value = routine ? routine.id : '';
  document.getElementById('adjust-exercise-id').value = exerciseId;

  // Default panel action setup
  document.getElementById('adjust-action-type').value = 'modify';
  document.getElementById('adjust-panel-modify').classList.remove('hidden');
  document.getElementById('adjust-panel-swap').classList.add('hidden');

  // Pre-fill parameters
  document.getElementById('adjust-weight').value = exMapping ? exMapping.weight : 0;
  document.getElementById('adjust-reps').value = exMapping ? exMapping.reps : 10;
  document.getElementById('adjust-sets').value = exMapping ? exMapping.sets : 3;

  // Pre-fill smart load offsets (recommend 2.5kg increase if tag is "Too Easy", decrease if "Too Hard")
  if (update.tag.includes('Easy')) {
    document.getElementById('adjust-weight').value = exMapping ? exMapping.weight + 2.5 : 2.5;
  } else if (update.tag.includes('Hard')) {
    document.getElementById('adjust-weight').value = exMapping ? Math.max(0, exMapping.weight - 2.5) : 0;
  }

  // Fill swap select options
  const swapSelect = document.getElementById('adjust-exercise-swap');
  swapSelect.innerHTML = '';
  state.exercises.forEach(ex => {
    if (ex.id !== exerciseId) {
      const opt = document.createElement('option');
      opt.value = ex.id;
      opt.textContent = `${ex.name} (${ex.category})`;
      swapSelect.appendChild(opt);
    }
  });

  // Action select toggle listeners
  const actionTypeSelect = document.getElementById('adjust-action-type');
  actionTypeSelect.replaceWith(actionTypeSelect.cloneNode(true));
  const newActionTypeSelect = document.getElementById('adjust-action-type');
  newActionTypeSelect.addEventListener('change', () => {
    const action = newActionTypeSelect.value;
    if (action === 'modify') {
      document.getElementById('adjust-panel-modify').classList.remove('hidden');
      document.getElementById('adjust-panel-swap').classList.add('hidden');
    } else if (action === 'swap') {
      document.getElementById('adjust-panel-modify').classList.add('hidden');
      document.getElementById('adjust-panel-swap').classList.remove('hidden');
    } else {
      document.getElementById('adjust-panel-modify').classList.add('hidden');
      document.getElementById('adjust-panel-swap').classList.add('hidden');
    }
  });

  // Close modals listeners
  dialog.querySelectorAll('.modal-cancel, .modal-close-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  dialog.querySelectorAll('.modal-cancel, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => dialog.close());
  });

  // Form submit handler
  const form = document.getElementById('form-apply-adjustment');
  form.replaceWith(form.cloneNode(true));
  const newForm = document.getElementById('form-apply-adjustment');
  newForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const action = newActionTypeSelect.value;
    const rId = document.getElementById('adjust-routine-id').value;
    const exId = document.getElementById('adjust-exercise-id').value;

    const targetRoutine = state.routines.find(r => r.id === rId);

    if (action === 'modify' && targetRoutine) {
      const targetEx = targetRoutine.exercises.find(ex => ex.id === exId);
      if (targetEx) {
        targetEx.weight = parseFloat(document.getElementById('adjust-weight').value) || 0;
        targetEx.reps = document.getElementById('adjust-reps').value;
        targetEx.sets = parseInt(document.getElementById('adjust-sets').value) || 3;
      }
    } else if (action === 'swap' && targetRoutine) {
      const idx = targetRoutine.exercises.findIndex(ex => ex.id === exId);
      if (idx !== -1) {
        const swapExId = swapSelect.value;
        targetRoutine.exercises[idx].id = swapExId;
      }
    }

    // Resolve alert
    const updateIdx = state.planUpdates.findIndex(u => u.id === updateId);
    if (updateIdx !== -1) {
      state.planUpdates[updateIdx].resolved = true;
    }

    saveToLocalStorage();
    renderPendingPlanAdjustments();
    renderRoutinesList();
    dialog.close();
  });

  dialog.showModal();
}


// Clients View
function renderClientsList(filterQuery = '') {
  const container = document.getElementById('clients-list');
  container.innerHTML = '';

  const filtered = state.clients.filter(c => 
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.goals.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="grid-column: 1/-1;">${t('no_clients_found')}</div>`;
    return;
  }

  filtered.forEach(client => {
    const latestWeight = client.weightHistory.length > 0 
      ? client.weightHistory[client.weightHistory.length - 1].value + ' kg'
      : t('no_weight_logged');

    const card = document.createElement('div');
    card.className = 'client-card card glassmorphic';
    card.innerHTML = `
      <div class="client-info-block">
        <div class="avatar">${client.avatar || getInitials(client.name)}</div>
        <div class="client-name-meta">
          <h3>${getClientDisplayNameHTML(client)}</h3>
          <p>${escapeHTML(truncateString(client.goals, 45))}</p>
        </div>
      </div>
      <div class="client-weight-pill">${latestWeight}</div>
    `;

    card.addEventListener('click', () => {
      showClientDetails(client.id);
    });

    container.appendChild(card);
  });
}

// Client Detail View
let activeDetailClientId = null;
function showClientDetails(clientId) {
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  activeDetailClientId = clientId;
  document.getElementById('detail-client-name').innerHTML = getClientDisplayNameHTML(client);
  document.getElementById('detail-client-avatar').textContent = client.avatar || getInitials(client.name);
  document.getElementById('profile-name').innerHTML = getClientDisplayNameHTML(client);
  document.getElementById('profile-joined-date').textContent = `${t('joined')} ${formatDateStr(client.joinedDate)}`;
  document.getElementById('profile-goals').textContent = client.goals || t('no_goals_specified');
  document.getElementById('profile-notes').textContent = client.notes || t('no_notes_specified');

  // Start workout from detail
  const startBtn = document.getElementById('btn-start-client-workout');
  // Re-bind click event
  startBtn.replaceWith(startBtn.cloneNode(true));
  document.getElementById('btn-start-client-workout').addEventListener('click', () => {
    openWorkoutSetupModal(clientId);
  });

  renderClientWeightHistory(client);
  renderClientWorkoutHistory(client);
  switchView('client-detail');
}

function renderClientWeightHistory(client) {
  const tbody = document.getElementById('weight-history-tbody');
  const chartContainer = document.getElementById('weight-history-chart');
  tbody.innerHTML = '';
  chartContainer.innerHTML = '';

  const weights = [...client.weightHistory].sort((a,b) => new Date(b.date) - new Date(a.date));
  
  if (weights.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">${t('no_weight_records')}</td></tr>`;
    chartContainer.innerHTML = `<span class="text-muted text-sm m-auto">${t('log_weights_progression')}</span>`;
    return;
  }

  // Render Table rows
  weights.forEach((entry, idx) => {
    let diffText = '-';
    let diffClass = '';
    if (idx < weights.length - 1) {
      const prevVal = weights[idx + 1].value;
      const diff = (entry.value - prevVal).toFixed(1);
      if (diff > 0) {
        diffText = `+${diff} kg`;
        diffClass = 'text-danger';
      } else if (diff < 0) {
        diffText = `${diff} kg`;
        diffClass = 'text-emerald';
      } else {
        diffText = '0.0 kg';
      }
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDateStr(entry.date)}</td>
      <td class="font-mono font-semibold">${entry.value} kg</td>
      <td class="${diffClass} font-mono">${diffText}</td>
    `;
    tbody.appendChild(row);
  });

  // Render simple visual chart bars (up to 8 elements chronologically)
  const chartData = [...client.weightHistory].sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-8);
  if (chartData.length > 1) {
    const values = chartData.map(d => d.value);
    const minVal = Math.min(...values) - 2; // leave margin at bottom
    const maxVal = Math.max(...values) + 2; // margin at top
    const range = maxVal - minVal;

    chartData.forEach(entry => {
      const heightPercent = range > 0 ? ((entry.value - minVal) / range) * 100 : 50;
      const barWrapper = document.createElement('div');
      barWrapper.className = 'chart-bar-wrapper';
      barWrapper.innerHTML = `
        <div class="chart-bar" style="height: ${Math.max(10, heightPercent)}%">
          <div class="chart-tooltip">${entry.value} kg</div>
        </div>
        <span class="chart-label">${entry.date.substring(5, 10)}</span>
      `;
      chartContainer.appendChild(barWrapper);
    });
  } else {
    chartContainer.innerHTML = `<span class="text-muted text-sm m-auto">${t('need_two_entries')}</span>`;
  }
}

function renderClientWorkoutHistory(client) {
  const container = document.getElementById('client-history-list');
  container.innerHTML = '';

  const clientHistory = state.history
    .filter(log => log.clientId === client.id)
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  if (clientHistory.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted text-sm">${t('no_workouts_logged')}</div>`;
    return;
  }

  renderHistoryItems(clientHistory, container);
}

// Routines View
function renderRoutinesList() {
  const container = document.getElementById('routines-list');
  container.innerHTML = '';

  if (state.routines.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted" style="grid-column: 1/-1;">${t('no_routines_found')}</div>`;
    return;
  }

  state.routines.forEach(routine => {
    const card = document.createElement('div');
    card.className = 'routine-card card glassmorphic';
    
    // Make tags of exercises, including the target sets/reps/weight for each
    const tags = routine.exercises.map(item => {
      const ex = state.exercises.find(e => e.id === item.id);
      const name = escapeHTML(ex ? ex.name : 'Unknown Exercise');
      const detail = `${item.sets}×${item.reps}${item.weight > 0 ? ` · ${item.weight}${t('kg')}` : ''}`;
      return `<span class="preview-tag">${name} <span class="preview-tag-detail">${escapeHTML(detail)}</span></span>`;
    }).slice(0, 4).join('');

    const moreCount = routine.exercises.length > 4 ? `+${routine.exercises.length - 4} more` : '';

    card.innerHTML = `
      <div class="routine-title-info">
        <h3>${escapeHTML(routine.name)}</h3>
        <p>${escapeHTML(routine.description || t('no_description'))}</p>
        <div class="routine-exercise-preview-tags">
          ${tags}
          ${moreCount ? `<span class="preview-tag" style="background:var(--primary-light); color:var(--primary); font-weight:700">${moreCount}</span>` : ''}
        </div>
      </div>
      <button class="btn secondary-btn btn-sm w-full btn-launch-routine">
        <i class="fa-solid fa-circle-play"></i> ${t('btn_start_group_session')}
      </button>
    `;

    // Routine launcher action
    card.querySelector('.btn-launch-routine').addEventListener('click', (e) => {
      e.stopPropagation();
      openWorkoutSetupModal(null, routine.id);
    });

    // Tap card to edit
    card.addEventListener('click', () => {
      openRoutineEditorModal(routine.id);
    });

    container.appendChild(card);
  });
}

// Exercise Library View
function renderExercisesList(filterQuery = '', categoryFilter = 'All') {
  const container = document.getElementById('exercises-list');
  container.innerHTML = '';

  let filtered = state.exercises;

  if (categoryFilter !== 'All') {
    filtered = filtered.filter(e => e.category === categoryFilter);
  }

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.category.toLowerCase().includes(q) ||
      (e.instructions && e.instructions.toLowerCase().includes(q))
    );
  }

  // Sort alphabetically
  filtered.sort((a,b) => a.name.localeCompare(b.name));

  if (filtered.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted">${t('no_exercises_matched')}</div>`;
    return;
  }

  filtered.forEach(ex => {
    const card = document.createElement('div');
    card.className = 'exercise-item card glassmorphic';
    card.innerHTML = `
      <div class="exercise-item-header">
        <h3>${escapeHTML(ex.name)}</h3>
        <span class="muscle-badge">${ex.category}</span>
      </div>
      <p class="exercise-instructions">${escapeHTML(ex.instructions || t('no_instructions'))}</p>
    `;
    container.appendChild(card);
  });
}

// Global History View
function renderGlobalHistory() {
  const container = document.getElementById('global-history-list');
  container.innerHTML = '';

  // Sort history newest first
  const sorted = [...state.history].sort((a,b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    container.innerHTML = `<div class="card glassmorphic text-center text-muted">${t('no_workouts_history')}</div>`;
    return;
  }

  renderHistoryItems(sorted, container);
}

// Helper to render lists of history items
function renderHistoryItems(historyList, container) {
  // We can group consecutive logs that were done together (same date, routine, and participants)
  // to display them as a neat group session log or individually.
  // For simplicity, let's render them as cards. If multiple people did it together, let's keep it clean.
  historyList.forEach(log => {
    const card = document.createElement('div');
    card.className = 'history-card card glassmorphic';
    
    const minutes = Math.floor(log.duration / 60);
    const durationText = minutes > 0 ? `${minutes} ${t('min_session')}` : t('less_than_minute');

    // Render exercises completed list
    let exercisesLogHTML = '';
    log.exercises.forEach(ex => {
      const setsText = ex.sets.map(s => {
        return `${s.weight}kg×${s.reps}${s.note ? ` (${s.note})` : ''}`;
      }).join(', ');
      
      // Determine feedback icons to show
      const feedbackItems = (log.feedback || []).filter(f => f.exerciseName === ex.name);
      let feedbackIconsHTML = '';
      
      feedbackItems.forEach(f => {
        let iconClass = 'fa-solid fa-comment-dots text-cyan';
        let title = f.tag;
        
        if (f.tag.includes('Too Easy') || f.tag.includes('Increase Load')) {
          iconClass = 'fa-solid fa-rocket text-emerald';
        } else if (f.tag.includes('Too Hard') || f.tag.includes('Reduce Load')) {
          iconClass = 'fa-solid fa-triangle-exclamation text-warning';
        } else if (f.tag.includes('Form Break') || f.tag.includes('Focus') || f.tag.includes('Form')) {
          iconClass = 'fa-solid fa-microscope text-warning';
        } else if (f.tag.includes('Pain') || f.tag.includes('Discomfort')) {
          iconClass = 'fa-solid fa-fire text-danger';
        } else if (f.tag.includes('easily') || f.tag.includes('Progression') || f.tag.includes('Completed reps')) {
          iconClass = 'fa-solid fa-dumbbell text-success';
        }
        
        const tooltipTitle = title;
        const tooltipBody = f.note ? escapeHTML(f.note) : t('no_details_specified');
        
        feedbackIconsHTML += `
          <span class="history-feedback-icon" onclick="this.classList.toggle('active'); event.stopPropagation();">
            <i class="${iconClass}"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${escapeHTML(tooltipTitle)}</div>
              <div class="tooltip-body">${tooltipBody}</div>
            </span>
          </span>
        `;
      });
      
      // Check if any sets have notes and render notes icon
      const setNotes = ex.sets.filter(s => s.note);
      if (setNotes.length > 0) {
        let notesListHTML = setNotes.map((s, idx) => `<div><strong>${t('set_label')} ${idx + 1}:</strong> ${escapeHTML(s.note)}</div>`).join('');
        feedbackIconsHTML += `
          <span class="history-feedback-icon" onclick="this.classList.toggle('active'); event.stopPropagation();">
            <i class="fa-solid fa-sticky-note text-cyan"></i>
            <span class="tooltip-content">
              <div class="tooltip-title">${t('trainer_set_notes')}</div>
              <div class="tooltip-body">${notesListHTML}</div>
            </span>
          </span>
        `;
      }

      exercisesLogHTML += `
        <div class="history-ex-row" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 4px; margin-bottom: 6px;">
          <div>
            <strong>${escapeHTML(ex.name)}</strong>: <span>${escapeHTML(setsText)}</span>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            ${feedbackIconsHTML}
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="history-card-header">
        <div class="history-header-meta">
          <h4>${escapeHTML(log.clientName)}</h4>
          <p>${escapeHTML(log.routineName)} • ${durationText}</p>
        </div>
        <div class="history-date">${formatDateStr(log.date)}</div>
      </div>
      <div class="history-exercise-log">
        ${exercisesLogHTML}
      </div>
    `;

    container.appendChild(card);
  });
}

// --- FORM CONTROLLERS ---

// 1. Client Add/Edit Modal
function setupClientForms() {
  const dialog = document.getElementById('dialog-client');
  const form = document.getElementById('form-client');
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  document.getElementById('btn-add-client').addEventListener('click', () => {
    document.getElementById('client-modal-title').textContent = 'Add New Client';
    form.reset();
    document.getElementById('client-form-id').value = '';
    dialog.showModal();
  });

  document.getElementById('btn-edit-client').addEventListener('click', () => {
    const client = state.clients.find(c => c.id === activeDetailClientId);
    if (!client) return;

    document.getElementById('client-modal-title').textContent = 'Edit Client Profile';
    document.getElementById('client-form-id').value = client.id;
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-weight').value = client.weightHistory.length > 0 
      ? client.weightHistory[client.weightHistory.length - 1].value 
      : '';
    document.getElementById('client-goals').value = client.goals || '';
    document.getElementById('client-notes').value = client.notes || '';
    
    dialog.showModal();
  });

  const closeModal = () => dialog.close();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('client-form-id').value;
    const name = document.getElementById('client-name').value.trim();
    const weightVal = parseFloat(document.getElementById('client-weight').value);
    const goals = document.getElementById('client-goals').value.trim();
    const notes = document.getElementById('client-notes').value.trim();

    if (!name) return;

    const todayStr = new Date().toISOString().substring(0, 10);

    if (id) {
      // Edit mode
      const client = state.clients.find(c => c.id === id);
      if (client) {
        client.name = name;
        client.goals = goals;
        client.notes = notes;
        
        // If weight changed or is new, add it
        if (!isNaN(weightVal)) {
          const lastWeight = client.weightHistory.length > 0 ? client.weightHistory[client.weightHistory.length - 1].value : null;
          if (lastWeight !== weightVal) {
            client.weightHistory.push({ date: todayStr, value: weightVal });
          }
        }
      }
    } else {
      // Add mode
      const newId = 'client-' + Date.now();
      const weightHistory = !isNaN(weightVal) ? [{ date: todayStr, value: weightVal }] : [];
      
      const newClient = {
        id: newId,
        name: name,
        avatar: getInitials(name),
        joinedDate: todayStr,
        goals: goals,
        weightHistory: weightHistory,
        notes: notes,
        active: true
      };
      state.clients.push(newClient);
    }

    saveToLocalStorage();
    renderClientsList();
    populateDropdownSelectors();

    if (id && activeDetailClientId === id) {
      showClientDetails(id); // reload details
    }
    
    dialog.close();
  });

  // Client Search
  document.getElementById('search-clients').addEventListener('input', (e) => {
    renderClientsList(e.target.value);
  });

  // Log Weight Dialog Submitter
  const weightDialog = document.getElementById('dialog-weight');
  const weightForm = document.getElementById('form-weight');
  
  document.getElementById('btn-add-weight').addEventListener('click', () => {
    document.getElementById('weight-log-value').value = '';
    document.getElementById('weight-log-date').value = new Date().toISOString().substring(0, 10);
    weightDialog.showModal();
  });

  weightDialog.querySelector('.modal-cancel').addEventListener('click', () => weightDialog.close());
  weightDialog.querySelector('.modal-close-btn').addEventListener('click', () => weightDialog.close());

  weightForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = parseFloat(document.getElementById('weight-log-value').value);
    const date = document.getElementById('weight-log-date').value;
    
    if (isNaN(value) || !date) return;

    const client = state.clients.find(c => c.id === activeDetailClientId);
    if (client) {
      // Remove any existing entry for that specific date to prevent duplicates
      client.weightHistory = client.weightHistory.filter(w => w.date !== date);
      client.weightHistory.push({ date: date, value: value });
      // Sort weight history chronologically
      client.weightHistory.sort((a,b) => new Date(a.date) - new Date(b.date));
      
      saveToLocalStorage();
      renderClientsList();
      showClientDetails(client.id); // refresh
    }
    
    weightDialog.close();
  });
}

// 2. Routine Template Modal
function setupRoutineForms() {
  const dialog = document.getElementById('dialog-routine');
  const form = document.getElementById('form-routine');
  const builderList = document.getElementById('routine-exercises-list');
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  document.getElementById('btn-add-routine').addEventListener('click', () => {
    document.getElementById('routine-modal-title').textContent = 'Create Routine Template';
    form.reset();
    document.getElementById('routine-form-id').value = '';
    builderList.innerHTML = '';
    addRoutineExerciseRow(); // start with one blank exercise
    dialog.showModal();
  });

  document.getElementById('btn-routine-add-ex').addEventListener('click', () => {
    addRoutineExerciseRow();
  });

  const closeModal = () => dialog.close();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('routine-form-id').value;
    const name = document.getElementById('routine-name').value.trim();
    const description = document.getElementById('routine-desc').value.trim();

    if (!name) return;

    // Collect routine rows
    const exercises = [];
    builderList.querySelectorAll('.routine-builder-row').forEach(row => {
      const selectEx = row.querySelector('.select-ex');
      const inputSets = parseInt(row.querySelector('.input-sets').value);
      const inputReps = parseInt(row.querySelector('.input-reps').value);
      const inputWeight = parseFloat(row.querySelector('.input-weight').value);
      const inputRest = parseInt(row.querySelector('.input-rest').value);

      if (selectEx.value && !isNaN(inputSets)) {
        exercises.push({
          id: selectEx.value,
          sets: inputSets,
          reps: isNaN(inputReps) ? 10 : inputReps,
          weight: isNaN(inputWeight) ? 0 : inputWeight,
          rest: isNaN(inputRest) ? 60 : inputRest
        });
      }
    });

    if (exercises.length === 0) {
      alert('Routines must include at least one exercise.');
      return;
    }

    if (id) {
      // Edit
      const routine = state.routines.find(r => r.id === id);
      if (routine) {
        routine.name = name;
        routine.description = description;
        routine.exercises = exercises;
      }
    } else {
      // Add
      const newRoutine = {
        id: 'routine-' + Date.now(),
        name: name,
        description: description,
        exercises: exercises
      };
      state.routines.push(newRoutine);
    }

    saveToLocalStorage();
    renderRoutinesList();
    populateDropdownSelectors();
    dialog.close();
  });
}

function openRoutineEditorModal(routineId) {
  const routine = state.routines.find(r => r.id === routineId);
  if (!routine) return;

  const dialog = document.getElementById('dialog-routine');
  const builderList = document.getElementById('routine-exercises-list');

  document.getElementById('routine-modal-title').textContent = 'Edit Routine Template';
  document.getElementById('routine-form-id').value = routine.id;
  document.getElementById('routine-name').value = routine.name;
  document.getElementById('routine-desc').value = routine.description || '';
  
  builderList.innerHTML = '';
  routine.exercises.forEach(item => {
    addRoutineExerciseRow(item);
  });

  dialog.showModal();
}

function addRoutineExerciseRow(preset = null) {
  const builderList = document.getElementById('routine-exercises-list');
  const row = document.createElement('div');
  row.className = 'routine-builder-row';
  
  // Build Options of Exercises
  const optionsHTML = state.exercises
    .sort((a,b) => a.name.localeCompare(b.name))
    .map(ex => `<option value="${ex.id}" ${preset && preset.id === ex.id ? 'selected' : ''}>${escapeHTML(ex.name)} (${ex.category})</option>`)
    .join('');

  row.innerHTML = `
    <select class="form-control select-ex" required>
      <option value="" disabled ${!preset ? 'selected' : ''}>Select Exercise</option>
      ${optionsHTML}
    </select>
    <div class="form-group" style="gap:2px">
      <input type="number" min="1" placeholder="Sets" class="form-control input-sets" value="${preset ? preset.sets : '3'}" required aria-label="Sets quantity">
    </div>
    <div class="form-group" style="gap:2px">
      <input type="number" min="1" placeholder="Reps" class="form-control input-reps" value="${preset ? preset.reps : '10'}" required aria-label="Reps quantity">
    </div>
    <div class="form-group" style="gap:2px">
      <input type="number" step="0.5" placeholder="kg" class="form-control input-weight" value="${preset ? preset.weight : '0'}" required aria-label="Starting weight in kilograms">
    </div>
    <div class="form-group" style="gap:2px">
      <input type="number" min="0" step="5" placeholder="Rest" class="form-control input-rest" value="${preset ? preset.rest : '60'}" required aria-label="Rest duration in seconds">
    </div>
    <button type="button" class="btn-remove-row" aria-label="Remove exercise from routine"><i class="fa-solid fa-trash-can"></i></button>
  `;

  row.querySelector('.btn-remove-row').addEventListener('click', () => {
    row.remove();
  });

  builderList.appendChild(row);
  // Auto scroll to bottom of builder list
  builderList.scrollTop = builderList.scrollHeight;
}

// 3. Custom Exercise creation
function setupExerciseForms() {
  const dialog = document.getElementById('dialog-exercise');
  const form = document.getElementById('form-exercise');
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  document.getElementById('btn-add-exercise').addEventListener('click', () => {
    form.reset();
    dialog.showModal();
  });

  const closeModal = () => dialog.close();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('exercise-name').value.trim();
    const category = document.getElementById('exercise-category').value;
    const instructions = document.getElementById('exercise-instructions').value.trim();

    if (!name || !category) return;

    const newEx = {
      id: 'ex-' + Date.now(),
      name: name,
      category: category,
      instructions: instructions
    };

    state.exercises.push(newEx);
    saveToLocalStorage();
    renderExercisesList();
    populateDropdownSelectors();
    dialog.close();
  });

  // Search Exercises
  document.getElementById('search-exercises').addEventListener('input', (e) => {
    const activeChip = document.querySelector('.filter-chips .chip.active');
    renderExercisesList(e.target.value, activeChip ? activeChip.getAttribute('data-filter') : 'All');
  });

  // Category chips filtering
  document.querySelectorAll('.filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.getAttribute('data-filter');
      const searchVal = document.getElementById('search-exercises').value;
      renderExercisesList(searchVal, cat);
    });
  });
}

// Populate selectors across forms
function populateDropdownSelectors() {
  // Workout setup routines drop down (legacy guard)
  const routineSelect = document.getElementById('setup-select-routine');
  if (routineSelect) {
    routineSelect.innerHTML = `<option value="" disabled selected>${t('select_exercise')}</option>`;
    state.routines.sort((a,b) => a.name.localeCompare(b.name)).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      routineSelect.appendChild(opt);
    });
  }

  // Add-exercise combobox: the datalist backs a free-text input, so the trainer can type any
  // name and see matching library exercises filtered live, or enter one that isn't in the list.
  const sessionExList = document.getElementById('session-ex-datalist');
  if (sessionExList) {
    sessionExList.innerHTML = '';
    state.exercises.slice().sort((a,b) => a.name.localeCompare(b.name)).forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.name;      // the value is the plain name so free-text matching stays clean
      opt.label = e.category;  // shown as a hint alongside the name where the browser supports it
      sessionExList.appendChild(opt);
    });
  }
}

// --- WORKOUT SESSION LOGIC ---

// 1. Session Setup Modal
// 1. Session Setup Modal
function setupWorkoutSetup() {
  const dialog = document.getElementById('dialog-workout-setup');
  const form = document.getElementById('form-workout-setup');
  const cancelBtn = dialog.querySelector('.modal-cancel');
  const closeBtn = dialog.querySelector('.modal-close-btn');

  const closeModal = () => dialog.close();
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Collect active clients checked and their selected routines
    const clientRoutines = [];
    const rows = document.getElementById('setup-participants-assignment-list').querySelectorAll('.participant-setup-row');
    
    rows.forEach(row => {
      const cb = row.querySelector('input[type="checkbox"]');
      if (cb && cb.checked) {
        const clientId = cb.value;
        const select = row.querySelector('select');
        const routineId = select ? select.value : '';
        clientRoutines.push({ clientId, routineId });
      }
    });

    if (clientRoutines.length === 0) {
      alert('You must select at least one participant client.');
      return;
    }

    const missingRoutine = clientRoutines.find(cr => !cr.routineId);
    if (missingRoutine) {
      alert('Please assign a routine template to all selected participants.');
      return;
    }

    startWorkoutSession(clientRoutines);
    dialog.close();
  });
}

function openWorkoutSetupModal(preselectedClientId = null, preselectedRoutineId = null, preselectedBookingId = null) {
  const dialog = document.getElementById('dialog-workout-setup');
  const participantsList = document.getElementById('setup-participants-assignment-list');
  
  if (!participantsList) return;
  participantsList.innerHTML = '';
  
  let targetBooking = null;
  if (preselectedBookingId && state.bookings) {
    targetBooking = state.bookings.find(b => b.id === preselectedBookingId);
  }
  
  state.clients.sort((a,b) => a.name.localeCompare(b.name)).forEach(client => {
    const row = document.createElement('div');
    row.className = 'participant-setup-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.gap = '10px';
    row.style.marginBottom = '12px';
    row.style.padding = '8px';
    row.style.background = 'rgba(255,255,255,0.03)';
    row.style.borderRadius = '6px';
    row.style.border = '1px solid var(--border-color)';
    
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '10px';
    
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = client.id;
    cb.id = `setup-cb-${client.id}`;
    cb.style.width = '18px';
    cb.style.height = '18px';
    cb.style.cursor = 'pointer';
    
    if (targetBooking) {
      cb.checked = targetBooking.participants.includes(client.id);
    } else if (preselectedClientId === client.id) {
      cb.checked = true;
    } else if (!preselectedClientId && client.id !== 'client-sarah-jenkins') {
      // Default to checking first couple clients if none specified (like Jane and John)
      cb.checked = true;
    }
    
    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = `setup-cb-${client.id}`;
    nameLabel.innerHTML = getClientDisplayNameHTML(client);
    nameLabel.style.fontWeight = '600';
    nameLabel.style.cursor = 'pointer';
    nameLabel.style.fontSize = '13px';
    
    left.appendChild(cb);
    left.appendChild(nameLabel);
    
    const right = document.createElement('div');
    
    const select = document.createElement('select');
    select.className = 'form-control select-routine-dropdown';
    select.style.padding = '4px 8px';
    select.style.fontSize = '12px';
    select.style.width = '160px';
    select.style.height = '32px';
    
    select.innerHTML = `<option value="" disabled>${t('select_exercise')}</option>`;
    state.routines.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.name;
      select.appendChild(opt);
    });
    
    // Attempt default selections
    if (targetBooking && targetBooking.participants.includes(client.id)) {
      select.value = targetBooking.routineId;
    } else if (preselectedRoutineId && preselectedClientId === client.id) {
      select.value = preselectedRoutineId;
    } else if (client.id === 'client-jane-doe') {
      select.value = 'routine-upper-a';
    } else if (client.id === 'client-john-smith') {
      select.value = 'routine-legs-core';
    } else if (state.routines.length > 0) {
      select.value = state.routines[0].id;
    }
    
    right.appendChild(select);
    
    row.appendChild(left);
    row.appendChild(right);
    participantsList.appendChild(row);
  });

  dialog.showModal();
}

// 2. Active Session Core
function startWorkoutSession(clientRoutines, bookingMeta = null) {
  // Initialize session state
  const participantIds = clientRoutines.map(cr => cr.clientId);

  activeSession = {
    startTime: Date.now(),
    duration: 0,
    participants: participantIds,
    clientRoutines: {},
    activeClientId: participantIds[0],
    booking: bookingMeta
  };

  // Populate active exercises and logs per client
  clientRoutines.forEach(cr => {
    const routine = state.routines.find(r => r.id === cr.routineId);
    if (!routine) return;
    
    const clientState = {
      routineId: routine.id,
      routineName: routine.name,
      activeExerciseIndex: 0,
      exercises: [],
      logs: {}
    };

    routine.exercises.forEach(item => {
      const ex = state.exercises.find(e => e.id === item.id);
      if (ex) {
        clientState.exercises.push({
          id: item.id,
          name: ex.name,
          category: ex.category,
          instructions: ex.instructions,
          setsTargetCount: item.sets,
          repsTarget: item.reps,
          weightTarget: item.weight,
          rest: item.rest,
          // Circuit grouping: exercises sharing a circuitId render as one card, repeated
          // circuitSeries times (see renderActiveGroupBoard / buildCircuitUnits).
          circuitId: item.circuitId || null,
          circuitTitle: item.circuitTitle || '',
          circuitSeries: item.circuitSeries || 1
        });

        // Initialize logs: exerciseId -> array of sets logs
        clientState.logs[item.id] = Array.from({ length: item.sets }, () => ({
          reps: item.reps,
          weight: item.weight,
          completed: false,
          note: ''
        }));
      }
    });

    activeSession.clientRoutines[cr.clientId] = clientState;
  });

  // Save session state to localStorage for persistence recovery
  saveActiveSessionToCache();

  // Open overlay and bar
  const bar = document.getElementById('active-session-bar');
  bar.classList.remove('hidden', 'is-idle');
  delete bar.dataset.nextBookingId;
  document.getElementById('active-session-overlay').classList.remove('hidden');

  // Set labels
  renderActiveSessionBarLabels();

  // Start timer interval
  startSessionTimer();

  // Render group board
  renderActiveGroupBoard();
}

function startSessionTimer() {
  if (activeSession.timerIntervalId) clearInterval(activeSession.timerIntervalId);

  const tick = () => {
    activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);
    updateOverlaySessionTimer();
    updateSessionBarTimer();

    // Save periodically
    saveActiveSessionToCache();
  };

  activeSession.timerIntervalId = setInterval(tick, 1000);
  tick();
}

// The clipboard header shows time remaining against the session's scheduled end, counting
// down (and into the negative once it overruns) rather than a stopwatch that restarts from
// zero each time the session is reopened. Ad-hoc sessions with no scheduled end fall back to
// an elapsed count-up, since there is nothing to count down against.
function updateOverlaySessionTimer() {
  if (!activeSession) return;
  const el = document.getElementById('overlay-session-duration');
  if (!el) return;

  const endDate = activeSession.booking && activeSession.booking.endDate;
  if (endDate) {
    const remainingSec = Math.round((new Date(endDate).getTime() - Date.now()) / 1000);
    el.textContent = formatSignedDuration(remainingSec);
    el.style.color = remainingSec < 0 ? 'var(--danger)' : 'var(--accent-cyan)';
  } else {
    el.textContent = formatDuration(activeSession.duration);
    el.style.color = 'var(--accent-cyan)';
  }
}

// The bar's countdown derives from the booking's scheduled end when one is known
// (may run negative once a session overruns); ad-hoc sessions with no booking fall
// back to an elapsed count-up, since there is no schedule to count down against.
function updateSessionBarTimer() {
  if (!activeSession) return;
  const durationEl = document.getElementById('session-bar-duration');
  if (!durationEl) return;

  const endDate = activeSession.booking && activeSession.booking.endDate;
  if (endDate) {
    const remainingSec = Math.round((endDate.getTime() - Date.now()) / 1000);
    durationEl.textContent = formatSignedDuration(remainingSec);
    durationEl.classList.toggle('overtime', remainingSec < 0);
  } else {
    durationEl.textContent = formatDuration(activeSession.duration);
    durationEl.classList.remove('overtime');
  }
}

// Session name, participant count, and scheduled time range for the active bar.
// Ad-hoc sessions (started without a booking) fall back to a generic label — there
// is no scheduled title or time range to show.
function renderActiveSessionBarLabels() {
  if (!activeSession) return;
  const titleEl = document.getElementById('session-bar-title');
  const metaEl = document.getElementById('session-bar-meta');
  if (!titleEl || !metaEl) return;

  const booking = activeSession.booking;
  const count = activeSession.participants.length;
  const clientsLabel = `${count} ${t('bar_clients_label')}`;

  titleEl.textContent = booking ? booking.titles.join(' + ') : t('live_tracking_clipboard');
  metaEl.textContent = booking ? `${clientsLabel} · ${booking.timeLabel}` : clientsLabel;
}

function getActiveExercise() {
  if (!activeSession) return null;
  const activeClientId = activeSession.activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];
  if (!activeClientState || activeClientState.exercises.length === 0) return null;
  return activeClientState.exercises[activeClientState.activeExerciseIndex];
}

// Fades whichever edge(s) still have participant tabs scrolled off past them, so a
// merged session with more clients than fit on a gym-floor phone reads as "swipe for
// more" instead of looking like names got cut off (see .client-tabs-bar in index.css).
function updateClientTabsFadeState() {
  const el = document.getElementById('active-session-client-tabs');
  if (!el) return;

  const hasOverflow = el.scrollWidth > el.clientWidth + 1;
  el.classList.toggle('no-overflow', !hasOverflow);
  if (!hasOverflow) return;

  const atStart = el.scrollLeft <= 1;
  const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
  el.classList.toggle('at-start', atStart);
  el.classList.toggle('at-end', atEnd);
}

// Opens the full feedback modal for the active client's current exercise, prefilled and
// with the voice recorder reset. Invoked by the Log Feedback button on the focus card.
// exId targets a specific exercise (a circuit row passes its own id); without it the modal
// falls back to the active exercise, which is how the single-card Feedback button calls it.
function openFeedbackModal(exId) {
  if (!activeSession) return;
  const activeClientId = activeSession.activeClientId;
  const clientState = activeSession.clientRoutines[activeClientId];
  if (!clientState || clientState.exercises.length === 0) return;

  const curEx = (exId && clientState.exercises.find(e => e.id === exId))
    || clientState.exercises[clientState.activeExerciseIndex];
  const client = state.clients.find(c => c.id === activeClientId);

  document.getElementById('feedback-client-id').value = activeClientId;
  document.getElementById('feedback-exercise-name').value = curEx.name;
  document.getElementById('feedback-client-display-name').textContent = client.name;
  document.getElementById('feedback-ex-display-name').textContent = curEx.name;
  document.getElementById('feedback-custom-note').value = '';

  // Reset voice recorder state
  feedbackIsRecording = false;
  feedbackHasVoiceNote = false;
  const audioWave = document.getElementById('voice-audio-wave');
  const audioPlayer = document.getElementById('voice-audio-player');
  const recordIcon = document.getElementById('voice-record-icon');
  const recordStatus = document.getElementById('voice-record-status');
  if (audioWave) { audioWave.classList.add('hidden'); audioWave.classList.remove('recording'); }
  if (audioPlayer) audioPlayer.classList.add('hidden');
  if (recordStatus) recordStatus.textContent = t('voice_ready');
  if (recordIcon) { recordIcon.className = 'fa-solid fa-microphone'; recordIcon.style.color = ''; }

  document.getElementById('form-feedback').reset();
  document.getElementById('dialog-feedback').showModal();
}

// One-tap outcome signal (Too Easy / Too Hard) from the focus card. Records the same
// kind of feedback the modal would, marks the exercise's target sets as completed so it
// carries into the saved session history, and re-renders. Replaces per-set stepper logging.
function logQuickSignal(tag, exId) {
  if (!activeSession) return;
  const clientId = activeSession.activeClientId;
  const clientState = activeSession.clientRoutines[clientId];
  if (!clientState || clientState.exercises.length === 0) return;

  // A circuit row passes exId so its signal is logged against that exercise; the single
  // focus card omits it and the active exercise is used.
  const curEx = (exId && clientState.exercises.find(e => e.id === exId))
    || clientState.exercises[clientState.activeExerciseIndex];
  const client = state.clients.find(c => c.id === clientId);

  const newFeedback = {
    id: 'u-' + Date.now(),
    clientId,
    clientName: client ? client.name : 'Unknown Client',
    date: new Date().toISOString(),
    exerciseName: curEx.name,
    tag,
    hasVoiceNote: false,
    resolved: false
  };
  state.planUpdates.push(newFeedback);

  if (!activeSession.feedback) activeSession.feedback = [];
  activeSession.feedback.push({
    id: newFeedback.id,
    clientId,
    exerciseName: curEx.name,
    tag,
    note: '',
    hasVoiceNote: false
  });

  // Tapping an outcome marks the exercise done, so "Complete Workout Session" still logs it
  (clientState.logs[curEx.id] || []).forEach(l => { l.completed = true; });

  saveActiveSessionToCache();
  saveToLocalStorage();
  renderPendingPlanAdjustments();
  renderActiveGroupBoard();
}

// Colour an exercise card's title by the feedback logged against it for this client,
// matching the card action buttons: green = Too Easy, amber = Too Hard, red = a note /
// voice memo / safety flag (the Feedback button). Returns null when there's no feedback.
function getExerciseSignalColor(clientId, exerciseName) {
  const fb = ((activeSession && activeSession.feedback) || [])
    .filter(f => f.clientId === clientId && f.exerciseName === exerciseName);
  if (fb.length === 0) return null;
  // A written note / voice memo is the richest signal — red, like the Feedback button
  if (fb.some(f => (f.note && f.note.trim()) || f.hasVoiceNote)) return 'var(--danger)';
  if (fb.some(f => /too hard|reduce load/i.test(f.tag))) return '#f59e0b';
  if (fb.some(f => /too easy|increase load/i.test(f.tag))) return 'var(--success)';
  // Any other tagged feedback (pain, form break, …) also warrants the red flag
  return 'var(--danger)';
}

// Fold the flat current-exercise list into render units: consecutive exercises sharing a
// circuitId collapse into one { type:'circuit', ... } unit (a circuit is in focus / completed
// if any / all of its exercises are), while ungrouped exercises pass through untouched.
function buildCircuitUnits(list) {
  const units = [];
  list.forEach(item => {
    if (item.circuitId) {
      const last = units[units.length - 1];
      if (last && last.type === 'circuit' && last.circuitId === item.circuitId) {
        last.items.push(item);
        last.isInFocus = last.isInFocus || item.isInFocus;
        last.isCompleted = last.isCompleted && item.isCompleted;
      } else {
        units.push({
          type: 'circuit',
          circuitId: item.circuitId,
          title: item.circuitTitle,
          series: item.circuitSeries || 1,
          items: [item],
          isInFocus: item.isInFocus,
          isCompleted: item.isCompleted
        });
      }
    } else {
      units.push(item);
    }
  });
  return units;
}

// The circuit card's "Complete round" button: advance the round counter until the last round,
// then mark every exercise in the circuit done and move the active pointer past the group.
function completeCircuitRound(circuitId) {
  if (!activeSession) return;
  const cs = activeSession.clientRoutines[activeSession.activeClientId];
  if (!cs) return;
  if (!cs.circuitRounds) cs.circuitRounds = {};
  const groupExs = cs.exercises.filter(e => e.circuitId === circuitId);
  if (groupExs.length === 0) return;
  const series = groupExs[0].circuitSeries || 1;
  const cur = cs.circuitRounds[circuitId] || 1;
  if (cur < series) {
    cs.circuitRounds[circuitId] = cur + 1;
  } else {
    groupExs.forEach(ex => (cs.logs[ex.id] || []).forEach(l => { l.completed = true; }));
    let lastIdx = -1;
    cs.exercises.forEach((ex, idx) => { if (ex.circuitId === circuitId) lastIdx = idx; });
    cs.activeExerciseIndex = Math.min(lastIdx + 1, cs.exercises.length - 1);
  }
  saveActiveSessionToCache();
  saveToLocalStorage();
  renderActiveGroupBoard();
}

function renderActiveGroupBoard() {
  if (!activeSession) return;

  const activeClientId = activeSession.activeClientId || activeSession.participants[0];
  activeSession.activeClientId = activeClientId;
  const activeClientState = activeSession.clientRoutines[activeClientId];

  // 1. Render Client Tabs
  const tabsContainer = document.getElementById('active-session-client-tabs');
  if (tabsContainer) {
    tabsContainer.innerHTML = '';
    activeSession.participants.forEach(pId => {
      const client = state.clients.find(c => c.id === pId);
      if (!client) return;
      
      const tab = document.createElement('button');
      tab.className = `client-tab-btn ${pId === activeClientId ? 'active' : ''}`;
      
      // Inline styles to match a premium layout
      tab.style.display = 'flex';
      tab.style.alignItems = 'center';
      tab.style.gap = '8px';
      tab.style.padding = '10px 20px';
      tab.style.borderRadius = '24px';
      tab.style.border = '1px solid var(--border-color)';
      tab.style.background = pId === activeClientId ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)';
      tab.style.color = pId === activeClientId ? '#000' : 'var(--text-color)';
      tab.style.fontWeight = '700';
      tab.style.cursor = 'pointer';
      tab.style.transition = 'all 0.2s';
      tab.style.minHeight = '44px';
      
      tab.innerHTML = `
        <div class="avatar" style="width:20px; height:20px; font-size:9px; background: ${pId === activeClientId ? '#000' : 'var(--accent-cyan)'}; color: ${pId === activeClientId ? 'var(--accent-cyan)' : '#000'}">
          ${client.avatar || getInitials(client.name)}
        </div>
        <span>${getClientDisplayNameHTML(client, true)}</span>
      `;
      
      tab.addEventListener('click', () => {
        activeSession.activeClientId = pId;
        saveActiveSessionToCache();
        renderActiveGroupBoard();
      });
      
      tabsContainer.appendChild(tab);
    });

    updateClientTabsFadeState();
  }

  // 2. Client Injury warning banner
  const alertBanner = document.getElementById('clipboard-client-alert');
  const alertText = document.getElementById('clipboard-client-notes-text');
  const activeClient = state.clients.find(c => c.id === activeClientId);
  if (alertBanner && activeClient) {
    if (activeClient.notes) {
      alertText.textContent = activeClient.notes;
      alertBanner.classList.remove('hidden');
    } else {
      alertBanner.classList.add('hidden');
    }
  }

  // 3. Render Horizontal Exercise Scroll Deck (UC5 & Custom layout)
  const deckContainer = document.getElementById('active-exercise-scroll-deck');
  if (deckContainer && activeClientState) {
    deckContainer.innerHTML = '';

    // A launched future-day session is a plan, not a live workout — its exercises get the
    // same amber tint the dashboard uses for future days (mirrors the purple past history).
    const launchedDay = activeSession.booking ? activeSession.booking.day : null;
    const isFutureSession = launchedDay === 'tomorrow' || launchedDay === 'upcoming';

    // Single focus across the whole deck: while a past log is open, the live exercise card
    // collapses too, so exactly one card is ever expanded (the active-exercise pointer is
    // untouched, so it re-expands the moment the past card is closed).
    const pastExpanded = !!activeSession.expandedPastId;

    // Format localized date
    const formatDateStr = (dateIso) => {
      if (!dateIso) return '';
      const d = new Date(dateIso);
      return d.toLocaleDateString(state.lang === 'sl' ? 'sl-SI' : 'en-US', { month: 'short', day: 'numeric' });
    };

    // Past session exercises
    const clientHistory = (state.history || []).filter(h => h.clientId === activeClientId);
    clientHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const pastExList = [];
    if (clientHistory.length > 0) {
      const pastSession = clientHistory[0];
      const dateStr = formatDateStr(pastSession.date);
      pastSession.exercises.forEach((ex, pIdx) => {
        pastExList.push({
          id: `past-${pastSession.id}-${ex.id}-${pIdx}`,
          name: ex.name,
          type: 'past',
          sessionDate: dateStr,
          sets: ex.sets,
          routineName: pastSession.routineName
        });
      });
    }

    // Current routine exercises
    const currentExIdx = activeClientState.activeExerciseIndex;
    const currentExList = activeClientState.exercises.map((ex, idx) => {
      const logsList = activeClientState.logs[ex.id] || [];
      const isCompleted = logsList.length > 0 && logsList.every(l => l.completed);
      const isInFocus = (idx === currentExIdx);
      
      return {
        id: ex.id,
        index: idx,
        name: ex.name,
        type: 'current',
        isCompleted,
        isInFocus,
        instructions: ex.instructions,
        setsTarget: ex.setsTargetCount || ex.sets || 3,
        repsTarget: ex.repsTarget || ex.reps || 10,
        weightTarget: ex.weightTarget || ex.weight || 0,
        rest: ex.rest || 0,
        circuitId: ex.circuitId || null,
        circuitTitle: ex.circuitTitle || '',
        circuitSeries: ex.circuitSeries || 1
      };
    });

    // Fold consecutive exercises that share a circuitId into a single circuit unit; ungrouped
    // exercises stay as their own 'current' cards. Circuits render one card per group.
    const renderUnits = buildCircuitUnits(currentExList);
    const allDeckItems = [...pastExList, ...renderUnits];
    allDeckItems.forEach(item => {
      const card = document.createElement('div');

      if (item.type === 'past') {
        // Tap toggles the card open in place, right in the deck — no separate review panel
        const isExpanded = activeSession.expandedPastId === item.id;
        card.className = 'exercise-deck-card past-session' + (isExpanded ? ' past-expanded' : '');
        if (isExpanded) {
          // Logged history, not a target: every set is listed as-is rather than reduced to
          // one sets/reps/weight triplet, since loads and reps often vary across the sets
          const setRows = item.sets.map((s, sIdx) => `
            <div class="deck-history-set-row">
              <strong>S${sIdx + 1}</strong>
              <span class="deck-history-load">${escapeHTML(String(s.weight))} kg</span>
              <span class="deck-history-reps">${escapeHTML(String(s.reps))} reps</span>
              ${s.note ? `<span class="deck-history-note">${escapeHTML(s.note)}</span>` : ''}
            </div>`).join('');
          card.innerHTML = `
            <div class="deck-card-top">
              <span class="badge deck-card-status deck-card-status-past">Past: ${escapeHTML(item.sessionDate)}</span>
              <i class="fa-solid fa-chevron-up deck-history-collapse" aria-hidden="true"></i>
            </div>
            <h5 class="deck-card-name">${escapeHTML(item.name)}</h5>
            <div class="deck-history-sets">${setRows}</div>
            <div class="deck-history-meta">${escapeHTML(item.routineName || 'Completed Session')}</div>
          `;
        } else {
          const setsSummary = item.sets.map(s => `${s.weight}kg x ${s.reps}`).join(', ');
          card.innerHTML = `
            <div class="deck-card-compact">
              <span class="badge deck-card-status deck-card-status-past">Past: ${escapeHTML(item.sessionDate)}</span>
              <span class="deck-card-name deck-card-name-inline">${escapeHTML(item.name)}</span>
              <span class="deck-card-compact-target">${escapeHTML(setsSummary)}</span>
            </div>
          `;
        }
        card.addEventListener('click', () => {
          activeSession.expandedPastId = isExpanded ? null : item.id;
          renderActiveGroupBoard();
        });
      } else if (item.type === 'circuit') {
        // Circuit card render lives in components/circuitCard.js
        const round = (activeClientState.circuitRounds && activeClientState.circuitRounds[item.circuitId]) || 1;
        renderCircuitCard(card, item, {
          round,
          activeClientId,
          pastExpanded,
          isFutureSession,
          t,
          escapeHTML,
          getExerciseSignalColor,
          logQuickSignal,
          openFeedbackModal,
          completeCircuitRound,
          onFocus: (index) => {
            activeClientState.activeExerciseIndex = index;
            activeSession.expandedPastId = null;
            saveActiveSessionToCache();
            renderActiveGroupBoard();
          }
        });
      } else {
        // Standalone exercise card render lives in components/exerciseCard.js
        renderExerciseCard(card, item, {
          currentCount: currentExList.length,
          activeClientId,
          pastExpanded,
          isFutureSession,
          t,
          escapeHTML,
          getExerciseSignalColor,
          logQuickSignal,
          openFeedbackModal,
          onFocus: (index) => {
            activeClientState.activeExerciseIndex = index;
            activeSession.expandedPastId = null;
            saveActiveSessionToCache();
            renderActiveGroupBoard();
          }
        });
      }
      deckContainer.appendChild(card);
    });

    // Bring whatever the trainer just acted on into view: a freshly expanded past card if
    // there is one, otherwise the in-focus current exercise.
    setTimeout(() => {
      const focusEl = deckContainer.querySelector('.exercise-deck-card.past-expanded')
        || deckContainer.querySelector('.exercise-deck-card.in-focus');
      if (focusEl) {
        focusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }

  const container = document.getElementById('clipboard-logger-container');
  if (!container) return;

  if (!activeClientState || activeClientState.exercises.length === 0) {
    // No exercises for this client — the logger area carries the explanation
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="clipboard-empty-state">
        <h4>${t('no_exercises_injected')}</h4>
        <p>${t('no_exercises_desc')}</p>
      </div>
    `;
    return;
  }

  // Logging now happens through one-tap outcome signals on the focus card, so there is
  // no inline set grid during live logging. The container is reserved for historical
  // review (populated by showPastExerciseInFocus); keep it hidden while logging.
  container.classList.add('hidden');
  container.innerHTML = '';
}

function setupActiveSession() {
  // Keep the participant tab strip's scroll-fade in sync as the trainer swipes through it
  const clientTabsBar = document.getElementById('active-session-client-tabs');
  if (clientTabsBar) {
    clientTabsBar.addEventListener('scroll', updateClientTabsFadeState);
  }

  // Exercise navigation is now driven by tapping the stacked cards directly
  // (see the card click handlers in renderActiveGroupBoard).

  // Minimize panel trigger
  document.getElementById('btn-collapse-session').addEventListener('click', () => {
    document.getElementById('active-session-overlay').classList.add('hidden');
  });

  // Expand panel trigger
  document.getElementById('btn-expand-session').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('active-session-overlay').classList.remove('hidden');
  });

  // The entire bar is the primary tap target — not just the chevron. Active sessions
  // open straight into the clipboard; an idle bar jumps into the next upcoming session.
  const sessionBar = document.getElementById('active-session-bar');
  sessionBar.addEventListener('click', () => {
    if (activeSession) {
      document.getElementById('active-session-overlay').classList.remove('hidden');
    } else if (sessionBar.dataset.nextBookingId) {
      launchClipboardDirectly(sessionBar.dataset.nextBookingId);
    }
  });
  sessionBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sessionBar.click();
    }
  });

  // Session overflow menu (holds the destructive Delete Session action)
  const sessionMenuBtn = document.getElementById('btn-session-menu');
  const sessionMenu = document.getElementById('session-menu');
  const closeSessionMenu = () => {
    sessionMenu.classList.add('hidden');
    sessionMenuBtn.setAttribute('aria-expanded', 'false');
  };
  sessionMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !sessionMenu.classList.contains('hidden');
    sessionMenu.classList.toggle('hidden', isOpen);
    sessionMenuBtn.setAttribute('aria-expanded', String(!isOpen));
  });
  // Dismiss the menu on any outside click
  document.addEventListener('click', (e) => {
    if (!sessionMenu.classList.contains('hidden') && !e.target.closest('.session-menu-wrap')) {
      closeSessionMenu();
    }
  });

  // Delete (discard) the active session — destructive, so it is confirmed and tucked
  // away in the overflow menu rather than sitting beside Complete Workout Session.
  document.getElementById('btn-delete-session').addEventListener('click', () => {
    closeSessionMenu();
    if (confirm(t('confirm_cancel'))) {
      cancelWorkoutSession();
    }
  });

  // Finish workout
  document.getElementById('btn-finish-session').addEventListener('click', () => {
    finishWorkoutSession();
  });

  // Add set on the fly
  // Setup Add Exercise to Session modal trigger
  const addExModal = document.getElementById('dialog-add-session-exercise');
  const addExForm = document.getElementById('form-add-session-exercise');
  
  document.getElementById('btn-add-exercise-to-session').addEventListener('click', () => {
    addExForm.reset();
    addExModal.showModal();
  });

  addExModal.querySelector('.modal-cancel').addEventListener('click', () => addExModal.close());
  addExModal.querySelector('.modal-close-btn').addEventListener('click', () => addExModal.close());

  addExForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const typed = document.getElementById('session-add-select-ex').value.trim();
    const sets = parseInt(document.getElementById('session-add-sets').value);
    const reps = parseInt(document.getElementById('session-add-reps').value);
    const weight = parseFloat(document.getElementById('session-add-weight').value);
    const rest = parseInt(document.getElementById('session-add-rest').value);

    if (!activeSession || !typed || isNaN(sets)) return;

    // Resolve the typed text to a library exercise by name (case-insensitive). A name that
    // isn't in the library is a free-text entry — inject it as an ad-hoc, session-only exercise.
    let baseEx = state.exercises.find(e => e.name.toLowerCase() === typed.toLowerCase());
    if (!baseEx) {
      baseEx = { id: 'ex-custom-' + Date.now(), name: typed, category: 'Custom', instructions: '' };
    }
    const exId = baseEx.id;

    const activeClientId = activeSession.activeClientId;
    const clientState = activeSession.clientRoutines[activeClientId];

    // Append exercise to active client routine list
    const newEx = {
      id: exId,
      name: baseEx.name,
      category: baseEx.category,
      instructions: baseEx.instructions,
      setsTargetCount: sets,
      repsTarget: reps,
      weightTarget: weight,
      rest: rest
    };

    clientState.exercises.push(newEx);

    // Initialize logs for active client for this exercise
    clientState.logs[exId] = Array.from({ length: sets }, () => ({
      reps: reps,
      weight: weight,
      completed: false,
      note: ''
    }));

    // Jump to the newly added exercise
    clientState.activeExerciseIndex = clientState.exercises.length - 1;
    
    saveActiveSessionToCache();
    renderActiveGroupBoard();
    addExModal.close();
  });

  // Feedback modal with voice note integration. The Log Feedback trigger now lives on
  // the active exercise card (renderActiveGroupBoard), which calls openFeedbackModal().
  const fbModal = document.getElementById('dialog-feedback');
  const fbForm = document.getElementById('form-feedback');

  // Voice recording mock handlers
  const recordBtn = document.getElementById('btn-voice-record');
  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      const recordIcon = document.getElementById('voice-record-icon');
      const recordStatus = document.getElementById('voice-record-status');
      const audioWave = document.getElementById('voice-audio-wave');
      const audioPlayer = document.getElementById('voice-audio-player');
      
      if (!feedbackIsRecording) {
        // Start snemanje / record
        feedbackIsRecording = true;
        feedbackHasVoiceNote = false;
        if (recordIcon) {
          recordIcon.className = 'fa-solid fa-microphone-slash';
          recordIcon.style.color = '#ef4444';
        }
        if (recordStatus) recordStatus.textContent = t('voice_recording');
        if (audioWave) {
          audioWave.classList.remove('hidden');
          audioWave.classList.add('recording');
        }
        if (audioPlayer) audioPlayer.classList.add('hidden');
      } else {
        // Stop snemanje
        feedbackIsRecording = false;
        feedbackHasVoiceNote = true;
        if (recordIcon) {
          recordIcon.className = 'fa-solid fa-microphone';
          recordIcon.style.color = '';
        }
        if (recordStatus) recordStatus.textContent = t('voice_transcribing');
        if (audioWave) {
          audioWave.classList.add('hidden');
          audioWave.classList.remove('recording');
        }
        
        // Simulate local on-device speech-to-text transcription latency
        setTimeout(() => {
          if (recordStatus) recordStatus.textContent = t('voice_transcription_done');
          if (audioPlayer) audioPlayer.classList.remove('hidden');
          
          const exName = document.getElementById('feedback-exercise-name').value || 'exercise';
          const clientName = document.getElementById('feedback-client-display-name').textContent || 'Client';
          
          let generatedTranscript = "";
          if (state.lang === 'sl') {
            generatedTranscript = `Glasovna opomba (lokalno): ${clientName} poroča o dobrem počutju pri vaji ${exName}.`;
          } else {
            generatedTranscript = `Voice note (local): ${clientName} reported good form and speed on ${exName}.`;
          }
          
          const currentNoteInput = document.getElementById('feedback-custom-note');
          if (currentNoteInput) {
            if (currentNoteInput.value) {
              currentNoteInput.value += ` (${generatedTranscript})`;
            } else {
              currentNoteInput.value = generatedTranscript;
            }
          }
        }, 1200);
      }
    });
  }

  const playPreviewBtn = document.getElementById('btn-play-voice-preview');
  if (playPreviewBtn) {
    playPreviewBtn.addEventListener('click', () => {
      const playIcon = playPreviewBtn.querySelector('i');
      const recordStatus = document.getElementById('voice-record-status');
      if (playIcon) {
        if (playIcon.classList.contains('fa-circle-play')) {
          playIcon.className = 'fa-solid fa-circle-pause';
          if (recordStatus) recordStatus.textContent = t('voice_playing');
          
          setTimeout(() => {
            playIcon.className = 'fa-solid fa-circle-play';
            if (recordStatus) recordStatus.textContent = t('voice_transcription_done');
          }, 3000);
        } else {
          playIcon.className = 'fa-solid fa-circle-play';
          if (recordStatus) recordStatus.textContent = t('voice_transcription_done');
        }
      }
    });
  }
  
  fbModal.querySelector('.modal-cancel').addEventListener('click', () => fbModal.close());
  fbModal.querySelector('.modal-close-btn').addEventListener('click', () => fbModal.close());
  
  fbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientId = document.getElementById('feedback-client-id').value;
    const exName = document.getElementById('feedback-exercise-name').value;
    const customNote = document.getElementById('feedback-custom-note').value;
    const tagVal = fbForm.querySelector('input[name="feedback-tag"]:checked').value;
    
    const client = state.clients.find(c => c.id === clientId);
    
    const newFeedback = {
      id: 'u-' + Date.now(),
      clientId: clientId,
      clientName: client ? client.name : 'Unknown Client',
      date: new Date().toISOString(),
      exerciseName: exName,
      tag: tagVal + (customNote ? ` - ${customNote}` : ''),
      hasVoiceNote: feedbackHasVoiceNote,
      resolved: false
    };
    
    state.planUpdates.push(newFeedback);
 
    // Save to active session so it carries into client history log
    if (activeSession) {
      if (!activeSession.feedback) {
        activeSession.feedback = [];
      }
      activeSession.feedback.push({
        id: newFeedback.id,
        clientId: clientId,
        exerciseName: exName,
        tag: tagVal,
        note: customNote,
        hasVoiceNote: feedbackHasVoiceNote
      });
      saveActiveSessionToCache();
    }
 
    saveToLocalStorage();
    renderPendingPlanAdjustments();
    fbModal.close();
  });
}

function cancelWorkoutSession() {
  if (activeSession) {
    clearInterval(activeSession.timerIntervalId);
  }
  activeSession = null;
  localStorage.removeItem('librept_active_session');
  document.getElementById('active-session-overlay').classList.add('hidden');
  // Bar drops back to idle — referring to whatever is next up — rather than disappearing
  renderIdleSessionBar();
}

function finishWorkoutSession() {
  if (!activeSession) return;

  // Verify if any sets were logged
  let totalSets = 0;
  let completedSets = 0;
  
  activeSession.participants.forEach(pId => {
    const clientState = activeSession.clientRoutines[pId];
    if (clientState) {
      for (const exId in clientState.logs) {
        clientState.logs[exId].forEach(log => {
          totalSets++;
          if (log.completed) completedSets++;
        });
      }
    }
  });

  if (completedSets === 0) {
    if (!confirm(t('alert_no_sets'))) {
      return;
    }
  }

  const sessionDateISO = new Date(activeSession.startTime).toISOString();
  const sessionDuration = activeSession.duration;

  // Split history into individual records for each participant
  activeSession.participants.forEach(pId => {
    const client = state.clients.find(c => c.id === pId);
    const clientState = activeSession.clientRoutines[pId];
    if (!client || !clientState) return;

    const clientCompletedExercises = [];

    clientState.exercises.forEach(ex => {
      const logsList = clientState.logs[ex.id] || [];
      const clientSetsLogged = [];
      
      logsList.forEach((log, sIdx) => {
        // Save set if completed (or if trainer logged a custom load)
        if (log.completed || log.weight > 0) {
          clientSetsLogged.push({
            reps: log.reps,
            weight: log.weight,
            completed: log.completed,
            note: log.note || ''
          });
        }
      });

      if (clientSetsLogged.length > 0) {
        clientCompletedExercises.push({
          id: ex.id,
          name: ex.name,
          sets: clientSetsLogged
        });
      }
    });

    // Save individual history entry if client actually did exercises
    if (clientCompletedExercises.length > 0) {
      const clientLog = {
        id: `log-${Date.now()}-${pId}`,
        clientId: pId,
        clientName: client.name,
        routineName: clientState.routineName,
        date: sessionDateISO,
        duration: sessionDuration,
        exercises: clientCompletedExercises,
        feedback: (activeSession.feedback || []).filter(f => f.clientId === pId)
      };
      
      state.history.push(clientLog);
    }
  });

  // Save changes
  saveToLocalStorage();

  // Clear session caches
  cancelWorkoutSession();

  // Refresh data listings
  renderClientsList();
  renderRoutinesList();
  renderGlobalHistory();

  // Direct to History view to show logged training
  switchView('history');
}

// --- LOCAL STORAGE SESSION RECOVERY ---
function saveActiveSessionToCache() {
  if (!activeSession) return;
  // Create cache copy without timer interval ID handle
  const cacheObj = {
    ...activeSession,
    timerIntervalId: null
  };
  localStorage.setItem('librept_active_session', JSON.stringify(cacheObj));
}

function recoverActiveSession() {
  const cached = localStorage.getItem('librept_active_session');
  if (!cached) return;

  try {
    const parsed = JSON.parse(cached);
    if (parsed && parsed.startTime) {
      activeSession = parsed;
      // Recalculate duration offset
      activeSession.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);

      // Booking dates survive the cache round-trip as ISO strings — revive them
      if (activeSession.booking) {
        activeSession.booking.startDate = new Date(activeSession.booking.startDate);
        activeSession.booking.endDate = new Date(activeSession.booking.endDate);
      }

      // Open panel widgets
      const bar = document.getElementById('active-session-bar');
      bar.classList.remove('hidden', 'is-idle');
      delete bar.dataset.nextBookingId;
      renderActiveSessionBarLabels();

      // Start elapsed timer ticking
      startSessionTimer();
      renderActiveGroupBoard();
    }
  } catch (e) {
    console.error('Error recovering active session cache:', e);
  }
}

// --- REST TIMER CONTROLLER ---
function setupRestTimer() {
  const panel = document.getElementById('floating-rest-timer');
  const timerLabel = document.getElementById('timer-countdown');
  const toggleBtn = document.getElementById('btn-timer-toggle');
  
  document.getElementById('btn-timer-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    const currentEx = getActiveExercise();
    triggerRestTimer(currentEx ? currentEx.rest : 60);
  });

  document.getElementById('btn-trigger-group-timer').addEventListener('click', () => {
    const currentEx = getActiveExercise();
    triggerRestTimer(currentEx ? currentEx.rest : 60);
  });

  document.getElementById('btn-close-timer').addEventListener('click', () => {
    panel.classList.add('hidden');
  });

  toggleBtn.addEventListener('click', () => {
    if (restTimer.isActive) {
      pauseRestTimer();
    } else {
      resumeRestTimer();
    }
  });

  document.getElementById('btn-timer-plus').addEventListener('click', () => {
    adjustRestTimer(15);
  });

  document.getElementById('btn-timer-minus').addEventListener('click', () => {
    adjustRestTimer(-15);
  });
}

function triggerRestTimer(durationSeconds) {
  if (restTimer.intervalId) clearInterval(restTimer.intervalId);
  
  restTimer.secondsRemaining = durationSeconds;
  restTimer.originalDuration = durationSeconds;
  restTimer.isActive = true;
  
  const panel = document.getElementById('floating-rest-timer');
  panel.classList.remove('hidden');
  
  updateTimerUI();
  
  restTimer.intervalId = setInterval(tickRestTimer, 1000);
}

function tickRestTimer() {
  if (restTimer.secondsRemaining > 0) {
    restTimer.secondsRemaining--;
    updateTimerUI();
  } else {
    // Rest Complete Beep & Vibrations
    clearInterval(restTimer.intervalId);
    restTimer.isActive = false;
    restTimer.intervalId = null;
    updateTimerUI();
    
    playTimerAlert();
    document.getElementById('timer-countdown').textContent = 'DONE!';
  }
}

function updateTimerUI() {
  const timerLabel = document.getElementById('timer-countdown');
  const toggleBtn = document.getElementById('btn-timer-toggle');
  
  timerLabel.textContent = `${restTimer.secondsRemaining}s`;
  
  if (restTimer.isActive) {
    toggleBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    toggleBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

function pauseRestTimer() {
  if (restTimer.intervalId) {
    clearInterval(restTimer.intervalId);
    restTimer.intervalId = null;
  }
  restTimer.isActive = false;
  updateTimerUI();
}

function resumeRestTimer() {
  if (restTimer.secondsRemaining <= 0) return;
  restTimer.isActive = true;
  updateTimerUI();
  restTimer.intervalId = setInterval(tickRestTimer, 1000);
}

function adjustRestTimer(seconds) {
  restTimer.secondsRemaining += seconds;
  if (restTimer.secondsRemaining < 0) restTimer.secondsRemaining = 0;
  updateTimerUI();
}

function playTimerAlert() {
  // Mobile Haptic Vibration
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 300]);
  }

  // Synthesized audio beep via Web Audio API (cross-browser offline friendly)
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Play double beep
    const playBeep = (time, frequency, duration) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, time);
      gainNode.gain.setValueAtTime(0.2, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = ctx.currentTime;
    playBeep(now, 880, 0.25); // high A tone
    playBeep(now + 0.3, 880, 0.4); // slightly longer tone
  } catch (e) {
    console.error('Error synthesizing rest timer alert sound:', e);
  }
}

// --- DATA IMPORT/EXPORT ---
function setupBackupRestore() {
  const dialog = document.getElementById('dialog-backup');
  const importFile = document.getElementById('import-db-file');
  const importStatus = document.getElementById('import-status');

  document.getElementById('backup-btn').addEventListener('click', () => {
    importStatus.textContent = '';
    importStatus.className = 'status-msg';
    dialog.showModal();
  });

  dialog.querySelector('.modal-close-btn').addEventListener('click', () => dialog.close());

  // Export JSON
  document.getElementById('btn-export-db').addEventListener('click', () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `librept_backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    URL.revokeObjectURL(url);
  });

  // Trigger file click
  dialog.querySelector('.file-trigger').addEventListener('click', () => {
    importFile.click();
  });

  // Import JSON File
  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const importedData = JSON.parse(evt.target.result);
        
        // Simple verification schema
        if (importedData && Array.isArray(importedData.clients) && Array.isArray(importedData.exercises)) {
          state = {
            clients: importedData.clients || [],
            exercises: importedData.exercises || [],
            routines: importedData.routines || [],
            history: importedData.history || []
          };
          saveToLocalStorage();
          
          // Re-render
          renderClientsList();
          renderRoutinesList();
          renderExercisesList();
          renderGlobalHistory();
          populateDropdownSelectors();

          importStatus.textContent = 'Import successful! Database synchronized.';
          importStatus.className = 'status-msg text-emerald';
        } else {
          throw new Error('Missing core structure validation.');
        }
      } catch (err) {
        importStatus.textContent = 'Error: Invalid backup file format.';
        importStatus.className = 'status-msg text-danger';
        console.error('Import file parse error:', err);
      }
    };
    reader.readAsText(file);
  });

  // Wipe database
  document.getElementById('btn-reset-db').addEventListener('click', () => {
    if (confirm('CRITICAL WARNING: This permanently wipes all workout logs and custom records. Are you absolutely sure?')) {
      localStorage.removeItem('librept_db');
      cancelWorkoutSession();
      seedMockData();
      
      renderClientsList();
      renderRoutinesList();
      renderExercisesList();
      renderGlobalHistory();
      populateDropdownSelectors();
      
      importStatus.textContent = 'Database reset successfully to factory defaults.';
      importStatus.className = 'status-msg text-emerald';
    }
  });
}

// --- UTILITY HELPER FUNCTIONS ---
function getInitials(name) {
  if (!name) return 'PT';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function truncateString(str, num) {
  if (!str) return '';
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');
  
  if (hrs > 0) {
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

// Same as formatDuration, but prefixes a minus sign once the count goes negative
// (a session running past its scheduled end) instead of wrapping/going nonsensical.
function formatSignedDuration(totalSeconds) {
  const negative = totalSeconds < 0;
  return (negative ? '-' : '') + formatDuration(Math.abs(totalSeconds));
}

function formatClockFromMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = ((totalMinutes % 60) + 60) % 60;
  // 24-hour HH:MM (ISO-style)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getClientDisplayNameHTML(client, isShort = false) {
  if (!client) return '';
  const nameText = isShort ? client.name.split(' ')[0] : client.name;
  if (client.hasInjury) {
    return `<span class="client-name-with-injury" style="display: inline-flex; align-items: center; gap: 4px;">${escapeHTML(nameText)} <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 11px; color: #ef4444;" title="Has recorded injury: ${escapeHTML(client.injury || client.notes || '')}"></i></span>`;
  }
  return escapeHTML(nameText);
}
function parseTimeRange(timeStr) {
  const parts = timeStr.split('-');
  if (parts.length !== 2) return null;
  // Times are 12-hour with an AM/PM suffix (e.g. "02:00 PM"). AM/PM must be honoured or
  // an afternoon end time parses smaller than its start (2:00 < 12:00), inverting the range
  // and breaking overlap detection — which silently makes afternoon session cards un-openable.
  const parseTime = (s) => {
    const m = s.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return 0;
    let hour = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ampm = m[3] ? m[3].toUpperCase() : null;
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return hour * 60 + min;
  };
  return {
    start: parseTime(parts[0]),
    end: parseTime(parts[1])
  };
}

function isTimeOverlapping(rangeA, rangeB) {
  if (!rangeA || !rangeB) return false;
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

// Session name(s), scheduled start/end, and a display time range for a group of
// same-slot bookings — feeds the active/idle session bar (TODO 2.1/2.2).
function buildBookingMeta(bookings, day) {
  const titles = [...new Set(bookings.map(b => b.title))];
  const ranges = bookings.map(b => parseTimeRange(b.time)).filter(Boolean);
  const startMin = Math.min(...ranges.map(r => r.start));
  const endMin = Math.max(...ranges.map(r => r.end));
  const dayDate = getSessionDayDate(day);
  const startDate = new Date(dayDate);
  startDate.setMinutes(startDate.getMinutes() + startMin);
  const endDate = new Date(dayDate);
  endDate.setMinutes(endDate.getMinutes() + endMin);

  return {
    titles,
    day,
    startDate,
    endDate,
    timeLabel: `${formatClockFromMinutes(startMin)} - ${formatClockFromMinutes(endMin)}`
  };
}

function getOverlappingBookings(booking) {
  const targetRange = parseTimeRange(booking.time);
  return state.bookings.filter(b => {
    if (b.day !== booking.day) return false;
    return isTimeOverlapping(targetRange, parseTimeRange(b.time));
  });
}

// The next session the idle bar should refer to: the earliest slot today that hasn't
// finished yet (covers both "not started" and "in progress but not launched"), or —
// if today has nothing left — the earliest slot tomorrow. Returns null when there's
// nothing scheduled in either bucket.
function getNextUpcomingBookingGroup() {
  const bookings = state.bookings || [];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const pickEarliest = (list) => {
    let best = null;
    let bestStart = Infinity;
    list.forEach(b => {
      const r = parseTimeRange(b.time);
      if (r && r.start < bestStart) {
        bestStart = r.start;
        best = b;
      }
    });
    return best;
  };

  const todayCandidates = bookings.filter(b => {
    if (b.day !== 'today') return false;
    const r = parseTimeRange(b.time);
    return r && r.end >= nowMinutes;
  });

  const anchor = pickEarliest(todayCandidates) || pickEarliest(bookings.filter(b => b.day === 'tomorrow'));
  if (!anchor) return null;

  return { day: anchor.day, bookings: getOverlappingBookings(anchor) };
}

// Idle bar: colour-distinct from the active state, names the next upcoming session(s)
// (merged when several run in the same slot), and its click target opens that same
// clipboard directly (TODO 2.2). Hides entirely when nothing is scheduled to show.
function renderIdleSessionBar() {
  if (activeSession) return;
  const bar = document.getElementById('active-session-bar');
  if (!bar) return;

  const next = getNextUpcomingBookingGroup();
  if (!next || next.bookings.length === 0) {
    bar.classList.add('hidden');
    delete bar.dataset.nextBookingId;
    return;
  }

  const meta = buildBookingMeta(next.bookings, next.day);
  const participantCount = new Set(next.bookings.flatMap(b => b.participants)).size;
  const startsInSec = Math.round((meta.startDate.getTime() - Date.now()) / 1000);

  bar.classList.remove('hidden');
  bar.classList.add('is-idle');
  bar.dataset.nextBookingId = next.bookings[0].id;

  document.getElementById('session-bar-title').textContent = `${t('next_session_label')}: ${meta.titles.join(' + ')}`;
  document.getElementById('session-bar-meta').textContent = `${participantCount} ${t('bar_clients_label')} · ${meta.timeLabel}`;
  document.getElementById('session-bar-duration').textContent = formatSignedDuration(startsInSec);
  document.getElementById('session-bar-duration').classList.remove('overtime');
}

function launchClipboardDirectly(bookingId) {
  if (!state.bookings) return;
  const booking = state.bookings.find(b => b.id === bookingId);
  if (!booking) return;

  // Find all bookings on the same day that overlap in time
  const overlappingBookings = getOverlappingBookings(booking);

  // Aggregate participant clientRoutines ensuring no duplicates
  const clientRoutinesMap = new Map();
  overlappingBookings.forEach(ob => {
    ob.participants.forEach(pId => {
      let routineId = ob.routineId;
      if (!routineId || !state.routines.some(r => r.id === routineId)) {
        routineId = state.routines.length > 0 ? state.routines[0].id : 'routine-upper-a';
      }
      if (!clientRoutinesMap.has(pId)) {
        clientRoutinesMap.set(pId, routineId);
      }
    });
  });

  const clientRoutines = Array.from(clientRoutinesMap.entries()).map(([clientId, routineId]) => ({
    clientId,
    routineId
  }));

  if (clientRoutines.length === 0) return;

  startWorkoutSession(clientRoutines, buildBookingMeta(overlappingBookings, booking.day));
}

// --- GOOGLE CALENDAR APPOINTMENT SESSIONS INTEGRATION (UC3 & UC4) ---
function setupCalendarBookings() {
  const syncBtn = document.getElementById('btn-sync-calendar');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      // Animate rotation to simulate active query sync
      const icon = syncBtn.querySelector('i');
      if (icon) icon.classList.add('fa-spin');
      
      const btnText = document.getElementById('btn-sync-calendar-text');
      if (btnText) btnText.textContent = t('syncing_calendar');
      
      syncBtn.disabled = true;
      
      setTimeout(() => {
        // Load/Reset default sessions mock feed
        state.bookings = [...DEFAULT_SESSIONS];
        
        saveToLocalStorage();
        renderSessions();
        
        if (icon) icon.classList.remove('fa-spin');
        if (btnText) btnText.textContent = t('btn_sync_data');
        syncBtn.disabled = false;
        
        alert(t('calendar_synced'));
      }, 1200);
    });
  }
}

// --- SESSIONS DAY NAVIGATION ---
// The dashboard grid is a horizontal deck of day columns. `focusedSessionDay` is the
// single source of truth for which column the title bar and arrows describe.
const SESSION_DAY_ORDER = ['yesterday', 'today', 'tomorrow', 'upcoming'];
const SESSION_DAY_OFFSETS = { yesterday: -1, today: 0, tomorrow: 1, upcoming: 2 };

// Temporal bucket that drives the schedule's colour coding: past = purple, today = default,
// future = amber. The day-selection title bar, the session cards and the launched-session
// exercise deck all key their tint off this so a day always reads the same colour.
function sessionDayTemporal(day) {
  if (day === 'yesterday') return 'past';
  if (day === 'tomorrow' || day === 'upcoming') return 'future';
  return 'today';
}
const SESSION_SCROLL_SETTLE_MS = 700;
let focusedSessionDay = 'today';
let sessionsProgrammaticScrollUntil = 0;

function getSessionsGrid() {
  return document.getElementById('sessions-categories-grid');
}

function getSessionDayDate(day) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (SESSION_DAY_OFFSETS[day] ?? 0));
  return d;
}

function getSessionDayLocale() {
  return (state.lang || 'en') === 'sl' ? 'sl-SI' : 'en-US';
}

// Built from local parts on purpose: toISOString() converts to UTC and can report the wrong day
function formatSessionDayISO(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function renderSessionsTitleBar() {
  const weekdayEl = document.getElementById('calendar-title-weekday');
  const weekdayShortEl = document.getElementById('calendar-title-weekday-short');
  const dateEl = document.getElementById('calendar-title-date');
  const tagEl = document.getElementById('calendar-title-tag');
  if (!weekdayEl || !weekdayShortEl || !dateEl || !tagEl) return;

  const locale = getSessionDayLocale();
  const day = focusedSessionDay;
  const date = getSessionDayDate(day);
  const dateStr = formatSessionDayISO(date);

  // Upcoming is an open-ended bucket: it reads "Upcoming From <date>" instead of naming a weekday
  const isUpcoming = day === 'upcoming';
  const calTitle = document.getElementById('calendar-title');
  calTitle.classList.toggle('is-upcoming', isUpcoming);

  // Tint the whole day-selection line by how the focused day sits relative to now
  const temporal = sessionDayTemporal(day);
  calTitle.classList.toggle('is-past', temporal === 'past');
  calTitle.classList.toggle('is-future', temporal === 'future');

  if (isUpcoming) {
    weekdayEl.textContent = t('upcoming');
    weekdayShortEl.textContent = t('upcoming');
    dateEl.textContent = `${t('from_date')} ${dateStr}`;
  } else {
    // Both forms are rendered; CSS picks the one that fits the viewport
    weekdayEl.textContent = date.toLocaleDateString(locale, { weekday: 'long' });
    weekdayShortEl.textContent = date.toLocaleDateString(locale, { weekday: 'short' });
    dateEl.textContent = dateStr;
  }

  // The tag marks "you are here now" — showing it on every column would make it meaningless
  tagEl.textContent = `(${t('today')})`;
  tagEl.classList.toggle('hidden', day !== 'today');

  const idx = SESSION_DAY_ORDER.indexOf(day);
  const arrows = [
    { el: document.getElementById('btn-sessions-prev'), target: SESSION_DAY_ORDER[idx - 1] },
    { el: document.getElementById('btn-sessions-next'), target: SESSION_DAY_ORDER[idx + 1] }
  ];
  arrows.forEach(({ el, target }) => {
    if (!el) return;
    el.disabled = !target;
    const label = target ? t(target) : '';
    el.setAttribute('aria-label', label);
    el.title = label;
  });
}

function focusSessionsColumn(day, behavior = 'smooth') {
  const grid = getSessionsGrid();
  const col = document.getElementById(`${day}-sessions-column`);
  if (!grid || !col) return;

  focusedSessionDay = day;
  renderSessionsTitleBar();

  // Dashboard may be hidden (display:none) when navigating in — no layout to scroll yet
  if (grid.offsetParent === null) return;

  // Align the column to the grid's start edge without scrolling any ancestor
  const left = grid.scrollLeft + (col.getBoundingClientRect().left - grid.getBoundingClientRect().left);

  // A smooth scroll emits intermediate scroll events whose closest column is not the target yet,
  // so hold off scroll-driven detection until the animation has settled on `day`.
  sessionsProgrammaticScrollUntil = Date.now() + SESSION_SCROLL_SETTLE_MS;
  grid.scrollTo({ left, behavior });
}

function stepSessionsColumn(delta) {
  const target = SESSION_DAY_ORDER[SESSION_DAY_ORDER.indexOf(focusedSessionDay) + delta];
  if (target) focusSessionsColumn(target);
}

function detectFocusedSessionsColumn() {
  const grid = getSessionsGrid();
  if (!grid || grid.offsetParent === null) return;

  const gridLeft = grid.getBoundingClientRect().left;
  let closest = focusedSessionDay;
  let closestDist = Infinity;
  SESSION_DAY_ORDER.forEach(day => {
    const col = document.getElementById(`${day}-sessions-column`);
    if (!col) return;
    const dist = Math.abs(col.getBoundingClientRect().left - gridLeft);
    if (dist < closestDist) {
      closestDist = dist;
      closest = day;
    }
  });

  if (closest !== focusedSessionDay) {
    focusedSessionDay = closest;
    renderSessionsTitleBar();
  }
}

function setupSessionsDayNav() {
  const prevBtn = document.getElementById('btn-sessions-prev');
  const nextBtn = document.getElementById('btn-sessions-next');
  if (prevBtn) prevBtn.addEventListener('click', () => stepSessionsColumn(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => stepSessionsColumn(1));

  // Keep the title in sync when the trainer swipes the deck directly
  const grid = getSessionsGrid();
  if (grid) {
    let scrollSettleTimer = null;
    grid.addEventListener('scroll', () => {
      clearTimeout(scrollSettleTimer);
      // Re-read the deck only once both the swipe and any in-flight arrow scroll have settled
      const delay = Math.max(80, sessionsProgrammaticScrollUntil - Date.now() + 20);
      scrollSettleTimer = setTimeout(detectFocusedSessionsColumn, delay);
    }, { passive: true });
  }
}

function renderSessions() {
  const yesterdayContainer = document.getElementById('yesterday-sessions-list');
  const todayContainer = document.getElementById('today-sessions-list');
  const tomorrowContainer = document.getElementById('tomorrow-sessions-list');
  const upcomingContainer = document.getElementById('upcoming-sessions-list');
  
  if (!todayContainer || !tomorrowContainer) return;
  
  if (yesterdayContainer) yesterdayContainer.innerHTML = '';
  todayContainer.innerHTML = '';
  tomorrowContainer.innerHTML = '';
  if (upcomingContainer) upcomingContainer.innerHTML = '';
  
  const bookings = state.bookings || [];
  
  // The session-card render lives in components/sessionCard.js; these are the app-level
  // dependencies it needs (kept as a bundle so the call sites below stay tidy).
  const cardDeps = { state, t, escapeHTML, launchClipboardDirectly, sessionDayTemporal };

  const yesterdaySessions = bookings.filter(b => b.day === 'yesterday');
  const todaySessions = bookings.filter(b => b.day === 'today');
  const tomorrowSessions = bookings.filter(b => b.day === 'tomorrow');
  const upcomingSessions = bookings.filter(b => b.day === 'upcoming');

  if (yesterdayContainer) {
    if (yesterdaySessions.length === 0) {
      yesterdayContainer.innerHTML = `<div class="card glassmorphic text-center text-muted" style="padding: 16px; font-size: 12px;">No past sessions.</div>`;
    } else {
      yesterdaySessions.forEach(s => renderSessionCard(s, yesterdayContainer, cardDeps));
    }
  }

  if (todaySessions.length === 0) {
    todayContainer.innerHTML = `
      <div class="card glassmorphic text-center text-muted" style="padding: 16px; font-size: 12px;">
        ${t('no_bookings_today')}
      </div>
    `;
  } else {
    todaySessions.forEach(s => renderSessionCard(s, todayContainer, cardDeps));
  }

  if (tomorrowSessions.length === 0) {
    tomorrowContainer.innerHTML = `
      <div class="card glassmorphic text-center text-muted" style="padding: 16px; font-size: 12px;">
        ${t('no_bookings_today')}
      </div>
    `;
  } else {
    tomorrowSessions.forEach(s => renderSessionCard(s, tomorrowContainer, cardDeps));
  }

  if (upcomingContainer) {
    if (upcomingSessions.length === 0) {
      upcomingContainer.innerHTML = `<div class="card glassmorphic text-center text-muted" style="padding: 16px; font-size: 12px;">No upcoming sessions.</div>`;
    } else {
      upcomingSessions.forEach(s => renderSessionCard(s, upcomingContainer, cardDeps));
    }
  }

  // Re-anchor the deck on the focused day (today on first load) after cards are injected
  requestAnimationFrame(() => focusSessionsColumn(focusedSessionDay, 'auto'));

  // Booking data just changed — refresh which "next session" the idle bar points to
  renderIdleSessionBar();
}

// Register Service Worker for offline PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA Service Worker registered:', reg.scope))
      .catch(err => console.error('PWA Service Worker registration failed:', err));
  });
}

// Trigger initialization on DOM load
window.addEventListener('DOMContentLoaded', init);
