// German (de) translations — a flat key -> string map. Keep keys in parity with every other locale.
// ⚠ MACHINE TRANSLATION, not yet reviewed by a German speaker: have it reviewed before German-speaking trainers are invited.
//
// Standard German (de), not de-AT or de-CH. Three rules hold for every string, so the file reads as
// one voice:
//
// 1. **The familiar form (du), to trainer and client alike** — the same register as sl.js (tikanje),
//    and the one German fitness apps use. Where "du" would force the app to guess a person's gender,
//    the sentence is rewritten rather than a gender picked (see `story_welcome_title`).
// 2. **One word per thing.** A training session is "Training" (das), never "Sitzung"; a client is
//    "Kunde" (plural "Kunden"); a circuit is "Zirkel"; the clipboard is "Klemmbrett", never
//    "Zwischenablage", which is the computer's copy buffer. The client list is "Kundenliste"
//    in the menu, on its own screen and on every story card.
// 3. **Data-protection words are the DSGVO's own** (Regulation (EU) 2016/679, German text):
//    Einwilligung (Art. 4 Nr. 11), widerrufen / Widerruf (Art. 7 Abs. 3), Verantwortlicher (Art. 4
//    Nr. 7). Never "Zustimmung" for consent. The mapping is in docs/templates/de/INDEX.md.
//
// Times are 24-hour and dates ISO (AGENT_RULES "Product constraints"), as in every language.
export const de = {
  logo_title: "LibrePT",
  preview_badge: "VORSCHAU",
  demo_badge: "DEMO",
  preview_badge_desc:
    "Vorschauversion — noch nicht veröffentlicht, Datenverlust möglich. Hinweis zu Risiken und Datenverlust öffnen.",
  demo_badge_desc:
    "Demodaten — nichts hier ist deine eigene Arbeit. Hinweis zu Risiken und Datenverlust öffnen.",
  preview_warning:
    "Dies ist eine Vorschauversion — vor der Veröffentlichung und in aktiver Entwicklung. Funktionen ändern sich ohne Ankündigung, und deine Daten können verloren gehen. Mach regelmäßig Sicherungskopien und verlass dich für echte Kundendaten noch nicht darauf.",
  tab_clients: "Kunden",
  tab_routines: "Routinen",
  tab_exercises: "Übungen",
  pending_adjustments: "Zu prüfen",
  btn_start_session: "Eigenes Training oder Gruppentraining starten",
  btn_create_session: "Training anlegen",
  no_pending_adjustments: "Nichts zu prüfen. Alle Rückmeldungen aus dem Training sind abgeglichen.",
  clients_title: "Kundenliste",
  placeholder_search_clients: "Kunden suchen...",
  btn_add_client: "Neuer Kunde",
  notes_injuries: "Frühere Verletzungen und Notizen",
  injury_label: "Verletzungen und Einschränkungen",
  injury_placeholder: "z. B. Operation am rechten Knie 2023; keine tiefen Kniebeugen",
  notes_label: "Notizen",
  injury_mark_label: "Verletzung vermerkt",
  notif_unread: "Ungelesen",
  goals: "Trainingsziele",
  create_exercise_title: "Eigene Übung anlegen",
  exercise_name_label: "Name der Übung *",
  muscle_group_label: "Ziel-Muskelgruppe *",
  equipment_label: "Ausrüstung *",
  movement_pattern_label: "Bewegungsmuster *",
  instructions_label: "Anleitung",
  routine_plans: "Routinen, Pläne und Verlauf",
  btn_edit_profile: "Profil bearbeiten",
  btn_add_plan: "Planänderung hinzufügen",
  client_history_header: "Verlauf der Trainings",
  no_history_yet: "Noch nichts aufgezeichnet.",
  routines_title: "Routinen",
  placeholder_search_routines: "Routinen suchen...",
  btn_create_routine: "Routine anlegen",
  exercises_count: "Übungen",
  exercises_title: "Übungen",
  placeholder_search_exercises: "Übungen suchen...",
  btn_add_exercise: "Neue Übung",
  live_tracking_clipboard: "Klemmbrett für das laufende Training",
  active_session: "Laufendes Training",
  add_from_catalog: "Aus dem Katalog hinzufügen",
  add_library_circuit: "Zirkel aus der Bibliothek hinzufügen",
  catalog_picker_title: "Aus dem Übungskatalog hinzufügen",
  integrity_error_title: "Prüfung der App fehlgeschlagen",
  integrity_error_missing:
    "Für diese Version wurde kein Integritätskatalog gefunden. In der lokalen Entwicklung: führe den vollständigen Build aus (python -m build) oder starte den Entwicklungsserver neu, damit der Katalog neu berechnet wird. Im Betrieb bedeutet es, dass die Bereitstellung unvollständig ist.",
  integrity_error_mismatch:
    "Eine Datei stimmt nicht mit ihrer geprüften Prüfsumme überein — der Download ist beschädigt oder stammt aus einer anderen Version. Leere den Cache und versuche es erneut, damit diese Version neu geladen und geprüft wird. Tritt es in der lokalen Entwicklung weiter auf, starte den Entwicklungsserver neu, damit der Katalog neu berechnet wird.",
  integrity_error_retry: "Cache leeren und erneut versuchen",
  btn_collapse: "Minimieren",
  collapse: "Einklappen",
  expand: "Ausklappen",
  exercise_of: "Übung",
  btn_add_set: "Satz hinzufügen",
  btn_inject_exercise: "Übung einfügen",
  btn_cancel: "Abbrechen",
  other_tab_title: "LibrePT ist in einem anderen Tab geöffnet",
  other_tab_body:
    "Es speichert immer nur ein Tab, damit nichts überschrieben wird. Was du in diesem Tab tust, wird erst gespeichert, wenn du ihn hier wieder verwendest; dann lädt er neu mit allem, was der andere Tab gespeichert hat.",
  other_tab_use_here: "Hier verwenden",
  dialog_ok: "OK",
  dialog_finish_now: "Jetzt beenden",
  dialog_save_anyway: "Trotzdem einplanen",
  dialog_take_off: "Vom Termin nehmen",
  dialog_send_again: "Neue Angaben senden",
  btn_discard_changes: "Änderungen verwerfen",
  btn_save: "Speichern",
  session_name_has_client_name:
    "Der Name eines Trainings darf keinen Kundennamen enthalten, und {word} ist einer. Das Training zeigt schon, wer dabei ist. Schreib, was für ein Training es ist, zum Beispiel Kraft oder Einzeltraining.",
  session_location_has_client_name:
    "Ein Ort darf keinen Kundennamen enthalten, und {word} ist einer. Schreib, wo ihr trainiert, zum Beispiel Studio oder Park.",
  placeholder_client_name: "Neuer Kunde",
  placeholder_exercise_name: "Neue Übung",
  placeholder_routine_name: "Neue Routine",
  btn_delete_session: "Training löschen",
  btn_delete_plan: "Plan löschen",
  btn_start_workout_session: "Training starten",
  btn_complete: "Training abschließen",
  btn_log_feedback: "Notiz hinzufügen",
  alert_no_sets:
    "Es wurden keine abgeschlossenen Sätze aufgezeichnet. Willst du das Training wirklich beenden und leer speichern?",
  confirm_finish_early: "Dieses Training dauert noch etwa {time}. Trotzdem jetzt beenden?",
  confirm_cancel:
    "Dieses Training löschen? Der aufgezeichnete Fortschritt und die Rückmeldungen werden endgültig gelöscht.",
  confirm_delete_session:
    "Dieses Training löschen? Es wird aus dem Terminplan entfernt, und der aufgezeichnete Fortschritt und die Rückmeldungen werden gelöscht — der Plan jedes Teilnehmers bleibt unter „Pläne ohne Termin“ erhalten.",
  delete_one_evening:
    "Das ist ein Abend eines wiederkehrenden Termins. Nur dieser Abend wird gelöscht, die anderen bleiben.",
  delete_session_named: "{title}, {date} {time}",
  delete_sets_lost: "Diese erfassten Sätze lassen sich nicht wiederherstellen. {sets}",
  delete_sets_none: "Es ist noch kein Satz erfasst.",
  delete_sets_participant: "{name}: {count}",
  delete_slide_label: "Zum Löschen dieses Trainings bis ans Ende schieben",
  delete_sets_one: "{count} Satz",
  delete_sets_two: "{count} Sätze",
  delete_sets_few: "{count} Sätze",
  delete_sets_other: "{count} Sätze",
  confirm_delete_plan:
    "Alle Übungen aus diesem Plan löschen? Danach kannst du ihn neu aufbauen oder die Bearbeitung beenden.",
  warning_banner_title: "Sicherheitshinweis zum Kunden",
  workout_setup_title: "Training einrichten",
  session_untitled: "Training",
  workout_setup_desc:
    "Lege Termin und Ort fest und füge dann die Kunden hinzu, die trainieren. Jeder kann ein eigenes Programm bekommen, oder alle dasselbe.",
  label_session_name: "Name des Trainings",
  untitled_session: "Training ohne Namen",
  label_session_date: "Datum",
  label_start_time: "Beginn",
  label_end_time: "Ende",
  end_makes_session_too_long:
    "Dieser Termin würde am nächsten Tag um {end} enden und {hours} h dauern. Prüfe die Endzeit.",
  repeat_until_before_start:
    "Die Wiederholung endet vor dem ersten Termin. Wähle den Tag des ersten Termins oder einen späteren.",
  time_field_later: "Fünf Minuten später",
  time_field_earlier: "Fünf Minuten früher",
  time_field_set: "{time} einstellen",
  date_field_later: "Einen Tag später",
  date_field_earlier: "Einen Tag früher",
  date_field_set: "{date} einstellen",
  date_field_moved: "{typed} gibt es nicht. Gewählt ist der {date}.",
  date_field_today: "heute",
  date_field_tomorrow: "morgen",
  date_field_yesterday: "gestern",
  label_location: "Ort",
  select_participants: "Wer trainiert, und mit welchem Programm",
  participants_chosen: "Ausgewählt",
  no_participants_chosen: "Noch niemand ist in diesem Training. Suche einen Kunden im Feld oben.",
  no_matching_clients: "Kein Kunde mit diesem Namen",
  no_clients_yet: "Noch keine Kunden im Verzeichnis",
  participant_add_new: "„{name}“ als neuen Kunden anlegen",
  remove_participant: "Aus diesem Training nehmen:",
  select_routine_for: "Routine für diesen Kunden",
  btn_launch_clipboard: "Im Klemmbrett öffnen",
  err_select_client: "Wähle mindestens einen Kunden als Teilnehmer aus.",
  err_assign_routine: "Wähle für jeden ausgewählten Kunden eine Routine.",
  add_ex_session_title: "Übung im laufenden Training einfügen",
  select_exercise: "Übung auswählen",
  select_routine: "Routine auswählen",
  sets: "Sätze",
  reps: "Wdh.",
  weight: "Gewicht (kg)",
  rest_seconds: "Pause (s)",
  btn_inject: "Übung einfügen",
  log_client_feedback: "Rückmeldung des Kunden aufzeichnen",
  feedback_for: "Rückmeldung für",
  feedback_on: "zu",
  custom_details: "Eigene Angaben / Notizen",
  btn_log_alert: "Hinweis speichern",
  backup_center: "Synchronisierung und Sicherung",
  backup_desc:
    "LibrePT speichert deine Aufzeichnungen direkt auf diesem Gerät. Synchronisiere den neuesten Trainingsplan, lade eine Sicherungsdatei herunter, damit dein Verlauf sicher ist, oder importiere sie, um auf ein anderes Telefon umzuziehen.",
  btn_download_backup: "JSON-Sicherung herunterladen",
  btn_import_backup: "JSON-Sicherung importieren",
  backup_export_title: "Datensicherung exportieren",
  backup_export_desc:
    "Deine Kunden, Routinen und Trainingsaufzeichnungen als eine JSON-Datei herunterladen.",
  btn_export_json: "JSON exportieren",
  btn_export_catalog_json: "Bibliothek exportieren (JSON)",
  btn_export_catalog_csv: "Übungen exportieren (CSV)",
  restore_brings_forward:
    "die Daten der Datei werden auf das neue Format gebracht und lassen sich danach in älteren Versionen von LibrePT nicht mehr öffnen",
  restore_preview_only_lost: "diese sind nicht in der Datei und können nicht zurückkommen",
  backup_import_title: "Datensicherung importieren",
  backup_import_desc:
    "Eine .json-Sicherungsdatei laden. Sie ersetzt alles auf diesem Gerät durch den Inhalt der Datei.",
  import_success: "Import erfolgreich.",
  import_success_upgraded:
    "Import erfolgreich. Die Daten der Datei wurden von Schema {version} übernommen.",
  import_reerased_one:
    "Kunden in dieser Datei, die bereits gelöscht waren und erneut anonymisiert wurden: {count}",
  import_reerased_two:
    "Kunden in dieser Datei, die bereits gelöscht waren und erneut anonymisiert wurden: {count}",
  import_reerased_few:
    "Kunden in dieser Datei, die bereits gelöscht waren und erneut anonymisiert wurden: {count}",
  import_reerased_other:
    "Kunden in dieser Datei, die bereits gelöscht waren und erneut anonymisiert wurden: {count}",
  restore_count_clients_one: "{count} Kunde",
  restore_count_clients_two: "{count} Kunden",
  restore_count_clients_few: "{count} Kunden",
  restore_count_clients_other: "{count} Kunden",
  restore_count_exercises_one: "{count} Übung",
  restore_count_exercises_two: "{count} Übungen",
  restore_count_exercises_few: "{count} Übungen",
  restore_count_exercises_other: "{count} Übungen",
  restore_count_routines_one: "{count} Routine",
  restore_count_routines_two: "{count} Routinen",
  restore_count_routines_few: "{count} Routinen",
  restore_count_routines_other: "{count} Routinen",
  restore_count_sessions_one: "{count} Training",
  restore_count_sessions_two: "{count} Trainings",
  restore_count_sessions_few: "{count} Trainings",
  restore_count_sessions_other: "{count} Trainings",
  restore_count_history_one: "{count} Trainingsprotokoll",
  restore_count_history_two: "{count} Trainingsprotokolle",
  restore_count_history_few: "{count} Trainingsprotokolle",
  restore_count_history_other: "{count} Trainingsprotokolle",
  restore_count_planUpdates_one: "{count} offene Änderung",
  restore_count_planUpdates_two: "{count} offene Änderungen",
  restore_count_planUpdates_few: "{count} offene Änderungen",
  restore_count_planUpdates_other: "{count} offene Änderungen",
  restore_count_notifications_one: "{count} Benachrichtigung",
  restore_count_notifications_two: "{count} Benachrichtigungen",
  restore_count_notifications_few: "{count} Benachrichtigungen",
  restore_count_notifications_other: "{count} Benachrichtigungen",
  restore_count_invites_one: "{count} Einladung",
  restore_count_invites_two: "{count} Einladungen",
  restore_count_invites_few: "{count} Einladungen",
  restore_count_invites_other: "{count} Einladungen",
  restore_count_sessionSeries_one: "{count} wiederkehrender Termin",
  restore_count_sessionSeries_two: "{count} wiederkehrende Termine",
  restore_count_sessionSeries_few: "{count} wiederkehrende Termine",
  restore_count_sessionSeries_other: "{count} wiederkehrende Termine",
  restore_count_circuits_one: "{count} Zirkel",
  restore_count_circuits_two: "{count} Zirkel",
  restore_count_circuits_few: "{count} Zirkel",
  restore_count_circuits_other: "{count} Zirkel",
  restore_count_previewProbe_one: "{count} Testeintrag",
  restore_count_previewProbe_two: "{count} Testeinträge",
  restore_count_previewProbe_few: "{count} Testeinträge",
  restore_count_previewProbe_other: "{count} Testeinträge",
  btn_select_json: "JSON-Datei auswählen",
  error_title: "Seite nicht gefunden",
  error_desc: "Dieser Link führt zu keinem Training, keinem Kunden und keiner Ansicht in LibrePT.",
  btn_error_home: "Zurück zur Übersicht",
  btn_resolve: "Erledigen",
  no_exercises_injected: "Keine Übungen eingefügt",
  no_exercises_desc:
    "Noch keine Übungen. Tippe oben rechts auf die drei Punkte (⋮) und wähle Plan bearbeiten.",
  edit: "Bearbeiten",
  edit_plan: "Plan bearbeiten",
  editing_plan_for: "Plan bearbeiten für",
  editing_plan_session: "Plan des Trainings bearbeiten",
  add_exercise: "Übung hinzufügen",
  new_label: "Neu",
  swapped_label: "Getauscht",
  browse_catalog: "Übungskatalog durchsuchen",
  swap_movement: "Übung tauschen",
  search_movements: "Übungen suchen",
  muscle: "Muskel",
  equipment: "Ausrüstung",
  reorder: "Neu anordnen",
  exercise: "Übung",
  close: "Schließen",
  remove: "Entfernen",
  done: "Fertig",
  done_editing_plan: "Bearbeitung des Plans beenden",
  session_options: "Optionen des Trainings",
  edit_exit_hint: "Tippe auf Fertig, drücke Esc oder tippe daneben, um zu beenden.",
  reorder_hint: "Oben/unten tippen zum Verschieben, ziehen zum Neuanordnen",
  circuit: "Zirkel",
  circuit_title: "Name des Zirkels",
  circuit_none: "Kein Zirkel",
  circuit_new: "Neuer Zirkel",
  add_to_circuit: "Übung zum Zirkel hinzufügen",
  rounds: "Runden",
  ungroup: "Zirkel auflösen",
  rest_timer: "Pausentimer",
  start_rest: "Pause starten",
  trainer_set_notes: "Notizen des Trainers zum Satz",
  kg: "kg",
  reps_label: "Wdh.",
  // Exercise modality metric labels (see exerciseModality.js) — the primary target unit per movement.
  metric_time: "Zeit",
  metric_hold: "Halten",
  metric_distance: "Strecke",
  metric_calories: "kcal",
  metric_watts: "Watt",
  metric_pace: "Tempo",
  metric_heartrate: "Puls",
  modality_strength: "Kraft",
  modality_isometric: "Isometrisch",
  modality_cardio: "Ausdauer",
  modality_stretch: "Dehnen",
  modality_balance: "Gleichgewicht",
  modality_agility: "Beweglichkeit",
  // The Custom Exercise dialog (controllers/exerciseFormsController.js).
  modality_label: "Wie sie aufgezeichnet wird *",
  modality_option_strength: "Kraft — Sätze × Wiederholungen × Last",
  modality_option_isometric: "Isometrisch — Haltezeit + Last",
  modality_option_cardio: "Ausdauer — Zeit / Strecke / Kalorien / Watt / Tempo / Puls",
  modality_option_stretch: "Dehnen — Haltezeit",
  modality_option_balance: "Gleichgewicht — Haltezeit",
  modality_option_agility: "Beweglichkeit — Zeit / Strecke / Wiederholungen",
  metric_label: "Messgröße",
  exercise_name_placeholder: "z. B. Bulgarian Split Squat",
  instructions_placeholder: "Hinweise zur Technik...",
  // The Apply Program Adjustment dialog (modules/plans/planAdjustments.js).
  adjust_title: "Programmänderung übernehmen",
  adjust_client: "Kunde:",
  adjust_feedback: "Rückmeldung:",
  adjust_details: "Details:",
  adjust_action_label: "Änderung",
  adjust_action_modify: "Ziellast und Wiederholungen ändern",
  adjust_action_swap: "Übung tauschen (leichter oder schwerer)",
  adjust_action_dismiss: "Nur den Hinweis schließen (keine Änderung)",
  adjust_target_weight: "Zielgewicht (kg)",
  adjust_target_reps: "Ziel-Wiederholungen",
  adjust_target_sets: "Anzahl Ziel-Sätze",
  adjust_replacement: "Ersatzübung",
  adjust_replacement_hint:
    "— dieselbe Muskelgruppe, damit das Trainingsvolumen weiter gezählt wird",
  adjust_apply: "Übernehmen und erledigen",
  adjust_swap_choose: "Tippe auf eine Ersatzübung, um fortzufahren.",
  // The encrypted-file reader a CLIENT opens (modules/common/encryptedFileReader.js).
  // The Routine Template dialog and its rows (routineFormsController.js, plansView.js).
  routine_name_placeholder: "z. B. Oberkörper A",
  routine_desc_placeholder: "z. B. Schwerpunkt Grundübungen",
  routine_exercises_heading: "Übungen der Routine",
  routine_row_sets_label: "Anzahl Sätze",
  routine_row_reps_label:
    "Hauptziel (Wiederholungen, Zeit, Strecke oder „max“ bis zum Muskelversagen — je nach Art der Übung)",
  routine_row_rest: "Pause",
  routine_row_rest_label: "Pausendauer in Sekunden",
  routine_row_remove: "Übung aus der Routine entfernen",
  history_save_as_routine: "Als Routine speichern",
  routine_saved_from_session: "Gespeichert aus dem Training vom {date}",
  routine_from_session_omitted_one:
    "{count} Übung ist nicht in deiner Bibliothek und fehlt deshalb in der Routine.",
  routine_from_session_omitted_two:
    "{count} Übungen sind nicht in deiner Bibliothek und fehlen deshalb in der Routine.",
  routine_from_session_omitted_few:
    "{count} Übungen sind nicht in deiner Bibliothek und fehlen deshalb in der Routine.",
  routine_from_session_omitted_other:
    "{count} Übungen sind nicht in deiner Bibliothek und fehlen deshalb in der Routine.",
  // The exercise picker (modules/exercises/exercisePicker.js).
  picker_count: "Übungen: {count}",
  picker_empty: "Keine Übung passt zu diesem Filter.",
  picker_empty_query:
    "Keine Übung passt zur Suche „{query}“. Die Übungen im Katalog haben englische Namen.",
  empty_add_exercise: "„{query}“ als neue Übung hinzufügen",
  empty_import_library: "Größere Übungsbibliothek importieren",
  // The session setup form (modules/session/editSessionView.js).
  session_name_placeholder: "Namen des Trainings wählen oder eingeben...",
  location_placeholder: "Ort wählen oder eingeben...",
  // Passwort für Sicherungen (modules/common/backupPassword.js).
  backup_pw_title: "Passwort für Sicherungen",
  backup_pw_lead:
    "Deine Sicherungen werden mit diesem Passwort verschlüsselt. Ohne es kann sie niemand lesen: weder Google noch jemand, der die Datei findet.",
  backup_pw_label: "Das Passwort",
  backup_pw_new: "Ein anderes",
  backup_pw_copy: "Kopieren",
  backup_pw_copied: "Kopiert.",
  backup_pw_copy_failed: "Kopieren nicht möglich. Schreibe es vom Bildschirm ab.",
  backup_pw_write_it_down:
    "Schreibe dieses Passwort an einem anderen Ort als auf diesem Telefon auf. Eine Sicherung ist für den Tag, an dem dieses Telefon weg ist, und dieses Passwort ist der einzige Weg, sie zu öffnen. LibrePT kann es nicht zurückholen, und Google kann es auch nicht.",
  backup_pw_remember: "Auf diesem Gerät behalten",
  backup_pw_save: "Ich habe es aufgeschrieben, speichern",
  backup_pw_saved: "Gespeichert. Ab jetzt sind deine Sicherungen verschlüsselt.",
  backup_pw_empty: "Gib ein Passwort ein oder tippe auf Ein anderes für ein fertiges.",
  backup_pw_failed: "Das Passwort konnte auf diesem Gerät nicht gespeichert werden.",
  backup_pw_change_warning:
    "Bereits geschriebene Sicherungsdateien behalten das alte Passwort. Nur neue Sicherungen nutzen das neue.",
  backup_pw_unlock_title: "Diese Sicherung ist verschlüsselt",
  backup_pw_unlock_lead: "Gib das Passwort ein, mit dem diese Datei geschrieben wurde.",
  backup_pw_unlock_open: "Datei öffnen",
  backup_pw_wrong:
    "Falsches Passwort, oder die Datei wurde geändert. Auf diesem Gerät wurde nichts geändert.",
  backup_pw_state_on: "Sicherungen von diesem Gerät sind verschlüsselt.",
  backup_pw_state_off: "Sicherungen von diesem Gerät sind noch nicht verschlüsselt.",
  backup_pw_set: "Passwort für Sicherungen festlegen",
  backup_pw_change: "Passwort für Sicherungen ändern",
  backup_pw_forget: "Auf diesem Gerät vergessen",
  backup_pw_forget_done:
    "Auf diesem Gerät vergessen. Bereits geschriebene Dateien bleiben verschlüsselt, und das Passwort öffnet sie weiterhin.",
  backup_pw_sandbox_on:
    "Die Sandbox hat ihr eigenes Passwort für Sicherungen. Es schützt die Sicherungen der Sandbox, nicht deine eigene Arbeit.",
  backup_pw_sandbox_off:
    "Sicherungen aus der Sandbox sind noch nicht verschlüsselt. Die Sandbox hat ihr eigenes Passwort, getrennt von dem für deine eigene Arbeit.",
  backup_pw_export_cancelled:
    "Es wurde nichts exportiert. Eine Sicherung braucht zuerst ein Passwort.",
  backup_pw_exported_encrypted: "Exportiert und verschlüsselt.",
  backup_pw_exported_plain: "Exportiert.",
  drive_sync_status_needs_password:
    "Die Synchronisierung hat noch nicht begonnen: Die Kopie in Google Drive wird mit deinem Passwort für Sicherungen verschlüsselt, und es gibt noch keines.",
  drive_sync_status_locked:
    "Die Kopie in Google Drive ist verschlüsselt, und dieses Gerät hat kein Passwort dafür. Es wurde nichts synchronisiert.",
  drive_sync_unlock: "Passwort für Sicherungen eingeben",
  encrypted_title: "Verschlüsselte Datei öffnen",
  encrypted_lead:
    "Für einen Export deiner personenbezogenen Daten, den dir dein Trainer geschickt hat.",
  encrypted_local:
    "Die Datei wird nur auf diesem Gerät geöffnet. Nichts wird hochgeladen, und LibrePT behält keine Kopie.",
  encrypted_file_label: "Die Datei",
  encrypted_passphrase_label: "Das Passwort, das dir dein Trainer getrennt geschickt hat",
  encrypted_passphrase_placeholder: "z. B. tempo-hinge-sprint-…",
  encrypted_open: "Öffnen",
  encrypted_choose_file: "Wähle zuerst die Datei, die dir dein Trainer geschickt hat.",
  encrypted_enter_passphrase: "Gib das Passwort ein, das dir dein Trainer getrennt geschickt hat.",
  encrypted_unreadable: "Diese Datei lässt sich nicht lesen. Prüfe, ob es der richtige Anhang ist.",
  encrypted_not_export: "Das ist kein verschlüsselter Export von LibrePT.",
  encrypted_cannot_open:
    "Die Datei lässt sich nicht öffnen: Das Passwort ist falsch, oder die Datei wurde unterwegs verändert.",
  add_new_client: "Neuen Kunden hinzufügen",
  edit_client_profile: "Kundenprofil bearbeiten",
  client_name: "Name des Kunden",
  client_full_name: "Vor- und Nachname *",
  client_alias: "Zusatz (nur wenn zwei Kunden gleich heißen)",
  client_name_placeholder: "z. B. Anna Müller",
  client_alias_placeholder: "z. B. morgens, Müller, die Läuferin",
  client_email_placeholder: "z. B. anna.mueller@example.com",
  client_phone_placeholder: "z. B. +49 151 23456789",
  notes_placeholder: "z. B. trainiert lieber morgens; Hausaufgabe: täglich dehnen",
  modal_close: "Schließen",
  goals_placeholder: "z. B. Muskelaufbau, Fettabbau...",
  create_routine_title: "Routine anlegen",
  edit_routine_title: "Routine bearbeiten",
  routine_name: "Name der Routine *",
  routine_desc: "Beschreibung",
  joined: "Dabei seit",
  no_goals_specified: "Keine Ziele angegeben.",
  no_notes_specified: "Keine gesundheitlichen Probleme oder Besonderheiten notiert.",
  log_weights_progression: "Zeichne Gewichte auf, um den Fortschritt zu sehen.",
  no_workouts_logged: "Noch keine Trainings aufgezeichnet.",
  no_routines_found: "Noch keine Routinen. Tippe auf „Routine anlegen“ und erstelle die erste.",
  no_description: "Keine Beschreibung.",
  btn_start_group_session: "Gruppentraining starten",
  no_exercises_matched: "Keine Übung passt zu den Filtern.",
  min_session: "Min. Training",
  less_than_minute: "< 1 Min.",
  set_label: "Satz",
  no_details_specified: "Keine Angaben.",
  no_clients_found: "Kein Kunde passt zu dieser Suche.",
  clients_empty: "Noch keine Kunden. Tippe auf „Neuer Kunde“ und lege den ersten an.",
  btn_back: "Zurück",
  routines_desc: "Routinen auswählen oder bearbeiten. Starte sie als Einzel- oder Gruppentraining.",
  filter_all: "Alle",
  source: "Quelle",
  source_librept: "LibrePT",
  source_own: "Meine",
  source_own_badge: "Meine",
  library_import_button: "Importieren",
  library_import_title: "Übungsbibliothek importieren",
  library_import_lede:
    "Füge eine Bibliothek ein oder lies sie aus einer Datei — deine eigene oder eine, die ein Kollege aus LibrePT exportiert hat. Nichts wird hinzugefügt, bevor du auf „Zur Bibliothek hinzufügen“ tippst.",
  library_import_text: "Bibliothek hier einfügen",
  library_import_file: "Aus Datei lesen",
  library_import_template: "Beispiel zeigen",
  library_import_source: "Name der Quelle — für Einträge ohne eigene Quelle",
  library_import_source_placeholder: "zum Beispiel Anna Müller",
  library_import_read:
    "Neue Übungen: {exercises}. Neue Zirkel: {circuits}. Neue Routinen: {routines}.",
  library_import_duplicates: "Schon in deiner Bibliothek, daher nicht erneut hinzugefügt: {count}",
  library_import_circuit_duplicates:
    "Zirkel, die schon in deiner Bibliothek sind, daher nicht erneut hinzugefügt: {count}",
  library_import_unreadable: "Einträge, die nicht gelesen werden konnten: {count}",
  library_import_add: "Zur Bibliothek hinzufügen",
  library_import_refused_empty: "Es gibt noch nichts zu lesen.",
  library_import_refused_no_data: "Dieser Text enthält keine Bibliotheksdaten.",
  library_import_refused_not_json: "Dieser Text lässt sich nicht als Bibliothek lesen ({detail}).",
  library_import_refused_other_format:
    "Diese Datei gibt an, {detail} zu sein, und das ist keine Übungsbibliothek.",
  library_import_refused_no_exercises: "Diese Bibliothek enthält keine Übungen und keine Zirkel.",
  sessions_schedule: "Trainings",
  btn_sync_calendar: "Kalender synchronisieren",
  spots_filled: "Plätze belegt",
  btn_launch_clipboard_short: "Im Klemmbrett öffnen",
  // The board's filters. Each chip says what it filters by when nothing is chosen, and
  // its value once something is — the chip IS the readout, which is why there is no modal.
  filter_dates: "Daten",
  filter_client: "Kunde",
  filter_location: "Ort",
  filter_clear: "Filter löschen",
  filter_from: "Von",
  filter_to: "Bis",
  filter_month: "Monat",
  filter_year: "Jahr",
  filter_prev_month: "Vorheriger Monat",
  filter_next_month: "Nächster Monat",
  no_sessions_for_filters:
    "Kein Training passt zu diesen Filtern. Tippe rechts neben den Filtern auf ✕, um die ganze Übersicht zu sehen.",
  no_sessions_scheduled: "Keine Trainings geplant.",
  program_not_defined: "Kein Programm festgelegt",
  no_members_assigned: "Keine Teilnehmer",
  session_completed: "Abgeschlossen",
  // The badge on the past card in the clipboard deck, read as "Zuletzt: 2026-07-20".
  last_time: "Zuletzt",
  // The title bar of a finished session reopened from the deck or from History, when the record
  // carries no name of its own.
  finished_session: "Abgeschlossenes Training",
  session_changed_resend:
    "Dieses Training hat sich geändert — die neuen Angaben an die schon eingeladenen Kunden senden?",
  session_change_focus: "andere Art von Training",
  session_change_participants: "andere Personen eingeladen",
  session_change_time: "neue Uhrzeit",
  session_change_location: "neuer Ort",
  session_invite_title: "Kalendereinladungen senden",
  session_invite_desc:
    "Neu eingetragene Teilnehmer können eine Kalendereinladung für dieses Training bekommen.",
  // The client intake page — the only screen in the app written FOR the client, so
  // the voice is theirs and not the trainer's: "dein Trainer", never "der Kunde".
  intake_title: "Stell dich deinem Trainer vor",
  intake_lede:
    "Füll das aus und schick es deinem Trainer. Es entsteht eine Datei auf deinem Telefon, sonst nichts — bei LibrePT gibt es kein Konto und keinen Server, der etwas davon sieht.",
  intake_name: "Vor- und Nachname",
  intake_email: "E-Mail",
  intake_phone: "Telefon",
  intake_contact_hint: "Eins von beiden reicht — das, über das dein Trainer dich erreichen soll.",
  intake_goals: "Was du mit dem Training erreichen willst (freiwillig)",
  intake_injury: "Verletzungen oder etwas, das ein Trainer wissen sollte (freiwillig)",
  intake_health_hint:
    "Nur wenn du willst. Es steht in der Datei, die du deinem Trainer schickst, und nirgendwo sonst — nicht in einer SMS und in keinem Link.",
  // Informed consent (see en.js): the line a client ticks says what the linked notice says, and it
  // names no storage vendor.
  intake_consent:
    "Ich willige ein, dass mein Trainer diese Angaben speichert und nutzt, um mein Training zu planen und aufzuzeichnen. Sie bleiben auf dem eigenen Gerät meines Trainers und können zusätzlich als Sicherungskopie im eigenen privaten Cloud-Speicher meines Trainers liegen — kein anderer Dienst erhält sie. Ich kann diese Einwilligung jederzeit widerrufen, indem ich es meinem Trainer sage.",
  intake_sender_for: "Du füllst das für {who} aus.",
  intake_sender_save: "Diesen Kontakt speichern",
  intake_step_contact: "Schritt 1: Speichere diesen Kontakt",
  intake_step_form: "Schritt 2: Fülle das Formular aus",
  intake_sender_check:
    "Wenn das nicht die Person ist, die dir diesen Link gegeben hat, füll ihn nicht aus. Diese Seite sendet selbst nichts: Aus deinen Antworten wird eine Datei auf diesem Telefon, und du entscheidest, mit wem du sie teilst.",
  intake_notice_link: "Was mit deinen Daten passiert",
  intake_form_link: "Der vollständige Text der Einwilligung",
  intake_send: "Mit meinem Trainer teilen",
  intake_save: "Datei zum Teilen speichern",
  intake_privacy_note:
    "Nichts verlässt dieses Telefon, und nichts wird hochgeladen. Was du eingibst, bleibt nur, bis du den Tab schließt — dann ist das Formular weg.",
  intake_share_title: "Meine Angaben für das Training",
  intake_share_text: "Hier sind meine Angaben — diese Datei öffnet sich in LibrePT.",
  intake_sent: "Geteilt. Dein Trainer fügt dich aus dieser Datei hinzu.",
  intake_saved: "Gespeichert. Teile die Datei mit deinem Trainer — häng sie an eine Nachricht an.",
  // Offered after the save, not before it. The BODY is the message the client sends, so it holds no
  // instructions to the client.
  intake_send_to_email: "E-Mail an {who} schreiben",
  intake_send_to_subject: "Meine Angaben für das Training",
  intake_send_to_body: "Hallo, hier sind meine Angaben für das Training.",
  intake_send_to_hint:
    "Häng die Datei {file} an diese Nachricht an. Dein Telefon hat sie bei deinen Downloads gespeichert.",
  // Precedes the browser's own untranslated message.
  intake_send_failed_detail: "Das braucht dein Trainer vielleicht:",
  intake_send_failed_saved:
    "Das Teilen hat nicht geklappt, deshalb hat dein Telefon die Datei {file} bei deinen Downloads gespeichert. Schick sie selbst: Öffne eine Nachricht an deinen Trainer, füge einen Anhang hinzu und wähle diese Datei.",
  intake_err_identity:
    "Gib deinen Namen an und entweder eine E-Mail-Adresse oder eine Telefonnummer.",
  intake_err_consent:
    "Setz das Häkchen bei der Einwilligung — ohne sie darf dein Trainer deine Angaben nicht speichern.",
  // Reviewing a submission a client sent in.
  signup_review_lede:
    "Öffne die Datei, die dir dein Kunde geschickt hat. Nichts wird zu deinen Kunden hinzugefügt, bevor du sie annimmst — die Datei wurde auf dem Telefon des Kunden erstellt, und jeder könnte dir eine schicken.",
  signup_review_title: "Angaben eines Kunden prüfen",
  signup_review_file: "Die geschickte Datei",
  signup_review_name: "Name",
  signup_review_email: "E-Mail",
  signup_review_phone: "Telefon",
  signup_review_goals: "Ziele",
  signup_review_injury: "Angegebene Verletzungen und Notizen",
  signup_review_consent_date: "Einwilligung erteilt",
  signup_review_consent_version: "Text der Einwilligung",
  signup_review_consent_lang: "Gelesene Sprache",
  signup_review_no_consent: "Nicht erteilt — du darfst die Angaben noch nicht speichern",
  signup_review_match_label: "Den vorhandenen Kunden aktualisieren:",
  signup_review_save: "Zu meinen Kunden hinzufügen",
  signup_review_unreadable:
    "Diese Datei ist keine Kundenvorstellung aus LibrePT — prüfe, ob du den richtigen Anhang gewählt hast.",
  // The invite-reply page. Written FOR the client, like the intake page.
  rsvp_unreadable:
    "Dieser Einladungslink ist unvollständig — bitte deinen Trainer, ihn noch einmal zu schicken.",
  rsvp_expired:
    "Diese Einladung ist geschlossen — das Training ist zu bald, um hier zu antworten. Schreib deinem Trainer direkt, wenn sich etwas geändert hat.",
  rsvp_deadline: "Du kannst hier noch antworten für",
  rsvp_hours: "Std.",
  rsvp_minutes: "Min.",
  rsvp_untitled_session: "Training",
  rsvp_when: "Wann",
  rsvp_where: "Wo",
  rsvp_who: "Dein Trainer",
  rsvp_question: "Kannst du kommen?",
  rsvp_yes: "Ja, ich komme",
  rsvp_maybe: "Weiß ich noch nicht",
  rsvp_no: "Nein, ich kann nicht",
  rsvp_chosen_yes: "Du sagst zu. Schick die Antwort, damit dein Trainer Bescheid weiß.",
  rsvp_chosen_maybe: "Du bist noch unsicher. Schick die Antwort, damit dein Trainer Bescheid weiß.",
  rsvp_chosen_no: "Du sagst ab. Schick die Antwort, damit dein Trainer Bescheid weiß.",
  rsvp_send_sms: "Als SMS senden",
  rsvp_send_email: "Als E-Mail senden",
  rsvp_send_hint:
    "Das öffnet deine eigene Nachrichten-App mit der fertigen Antwort — nichts wird gesendet, bevor du selbst sendest.",
  rsvp_no_channel: "Sag deinem Trainer deine Antwort auf dem Weg, auf dem ihr sonst Kontakt habt.",
  rsvp_email_subject: "Zu unserem Training",
  rsvp_message_yes: "Ja, ich komme zu",
  rsvp_message_maybe: "Ich weiß noch nicht, ob ich komme zu",
  rsvp_message_no: "Leider kann ich nicht kommen zu",
  transport_sms: "SMS",
  transport_email: "E-Mail",
  transport_share: "Teilen…",
  transport_copy: "Link kopieren",
  session_invite_organizer: "Antworten gehen an",
  session_invite_expiry: "Antworten so viele Stunden vorher schließen",
  session_invite_expiry_hint:
    "Bei 0 bleiben Antworten bis zum Beginn des Trainings offen. Gilt für Einladungen, die du ab jetzt sendest.",
  session_invite_phone: "Deine Nummer, für Antworten per SMS",
  session_invite_phone_hint:
    "Freiwillig. Mit ihr kann ein Kunde per SMS statt per E-Mail auf die Einladung antworten.",
  session_invite_body_reply: "Sag mir bitte, ob du kommen kannst:",
  session_invite_send_sms: "Per SMS senden",
  session_invite_sms_text: "Training",
  session_invite_organizer_hint: "Zusagen kommen als E-Mail-Antworten an diese Adresse.",
  session_invite_organizer_missing:
    "Ohne Adresse kann eine Kalender-App eine Zusage nirgendwohin schicken.",
  session_invite_send: "Einladung senden",
  session_invite_sent: "Einladung gesendet",
  session_invite_no_email: "Keine E-Mail-Adresse im Kundenprofil",
  session_invite_send_to: "Einladung senden an",
  session_invite_subject: "Training",
  session_invite_body_greeting: "Hallo",
  session_invite_body: "Du bist für ein Training eingetragen",
  session_invite_body_attach:
    "Die Datei mit der Kalendereinladung wurde gerade heruntergeladen — häng sie vor dem Senden an diese E-Mail an.",
  schedule_conflict_double_booked: "Du bist zu dieser Zeit anderweitig gebucht",
  schedule_conflict_busy_elsewhere: "Dein Kalender zeigt dich als beschäftigt",
  schedule_conflict_merged: "Läuft parallel — öffnet sich als ein Klemmbrett",
  schedule_conflict_confirm:
    "Dieser Termin überschneidet sich mit etwas, für das du schon gebucht bist. Trotzdem eintragen?",
  session_start_time_title: "Training außerhalb der geplanten Zeit gestartet",
  session_start_time_desc:
    "Geplant für {scheduled}, gestartet {amount} {direction}. Das Training auf die Zeit verschieben, zu der es wirklich läuft?",
  session_start_time_late: "zu spät",
  session_start_time_early: "zu früh",
  session_start_time_keep: "Geplante Zeit behalten",
  session_start_time_apply: "Zeit anpassen",
  session_start_time_delete: "Hat nicht stattgefunden",
  demo_cleanup_title: "Demodaten löschen",
  demo_cleanup_desc:
    "Deine eigenen Kunden, Trainings und Aufzeichnungen werden nie verändert. Der Übungskatalog bleibt, damit deine Programme weiter funktionieren.",
  demo_cleanup_none: "Es gibt keine Demodaten mehr zu löschen.",
  demo_cleanup_retained_title: "Behalten, weil deine Arbeit davon abhängt",
  demo_cleanup_kept: "behalten",
  demo_cleanup_blocked:
    "Diese Auswahl würde Einträge hinterlassen, die auf nicht mehr vorhandene Dinge verweisen.",
  demo_cleanup_clients: "Beispielkunden",
  demo_cleanup_sessions: "Beispieltrainings",
  demo_cleanup_history: "Beispiel-Trainingsaufzeichnungen",
  demo_cleanup_plan_updates: "Beispiel-Planänderungen",
  demo_cleanup_routines: "Beispielroutinen",
  demo_cleanup_exercises: "Beispielübungen",
  demo_cleanup_notifications: "Beispielbenachrichtigungen",
  demo_cleanup_remove: "Löschen",
  // The cold-start splash (index.html). The walkthrough button reuses `walkthrough_title`.
  splash_tagline:
    "Eine schlanke, kostenlose App für dein Klemmbrett, deine Trainings und Trainingsprogramme.",
  splash_dismiss: "Schließen und zur App",
  splash_load_demo: "Mit Demodaten ausprobieren",
  splash_start_empty: "Mit leerer App beginnen",
  // The trainer's own details.
  menu_trainer_details: "Meine Angaben",
  trainer_details_title: "Deine Angaben",
  // The app version this device runs.
  menu_app_version: "App-Version",
  app_version_title: "App-Version",
  app_version_button_label: "Build-Version — tippen für Details",
  app_version_lede:
    "Wähle, wie sich die App auf diesem Gerät verhält. Die App lädt neu. Keine Version löscht gespeicherte Daten.",
  app_version_in_use: "In Verwendung",
  app_version_refused_in_session:
    "Ein Training läuft. Beende oder verwirf es zuerst, dann wechsle die Version.",
  app_version_2026_09_desc:
    "Die App im Stand von September 2026, ohne Import einer Übungsbibliothek.",
  app_version_2026_10_desc:
    "Mit Import deiner eigenen Übungsbibliothek und Zirkel aus einer Datei.",
  trainer_details_lede:
    "Diese Angaben stehen auf dem, was du einem Kunden schickst: Dein Name unterschreibt die Einladung, und über Telefon und E-Mail antwortet er dir. Sie bleiben auf diesem Gerät.",
  trainer_details_first_name: "Vorname",
  trainer_details_last_name: "Nachname",
  trainer_details_phone: "Telefon",
  trainer_details_email: "E-Mail",
  trainer_details_email_invalid: "Das ist keine E-Mail-Adresse. Korrigiere sie.",
  trainer_details_phone_invalid: "Das ist keine Telefonnummer. Schreib sie mit allen Ziffern.",
  trainer_details_required: "Füll dieses Feld aus.",
  trainer_details_save: "Meine Angaben speichern",
  trainer_details_save_continue: "Speichern und weiter",
  trainer_details_splash_lede:
    "Dein Name unterschreibt die Einladungen an deine Kunden, und über Telefon und E-Mail antworten sie dir. Alle vier Felder sind Pflicht. Die Angaben bleiben auf diesem Gerät, und du kannst sie später im Menü ändern.",
  splash_theme_prompt: "Wähle ein Design",
  splash_continue: "Weiter",
  // The guided walkthrough and the captions of the automatic demo
  // (modules/demo/gymFloorTour.js). Each caption names the control by what it DOES.
  walkthrough_title: "Geführte Tour",
  walkthrough_chapters_heading: "Geführte Tour: Wähle ein Kapitel",
  walkthrough_progress: "Schritt {step} von {count}",
  walkthrough_back: "Zurück",
  walkthrough_show: "Zeig es mir",
  walkthrough_next: "Weiter",
  walkthrough_done: "Fertig",
  walkthrough_exit: "Demo beenden",
  walkthrough_collapse: "Demokarte wegklappen",
  walkthrough_expand: "Zurück zur Demokarte",
  // Shown when the trainer has taken the app somewhere the current step cannot happen.
  walkthrough_off_track_title: "Die Tour wartet",
  walkthrough_off_track:
    "Das Letzte, was du getan hast, war nicht dieser Schritt. Zurück zur Demo macht dort weiter, wo du warst; Demo beenden hört auf.",
  walkthrough_return: "Zurück zur Demo",
  walkthrough_leave: "Demo beenden",
  walkthrough_finished: "Das ist der ganze Ablauf — ein Training, ein Klemmbrett, vier Tipps.",
  walkthrough_wrong_place:
    "Dieser Schritt braucht einen anderen Bildschirm — geh zurück zur Trainingsübersicht und starte ihn erneut.",
  walkthrough_stuck:
    "Dieser Schritt wurde nicht abgeschlossen. Verlass die Tour und schau dich weiter um — deine Daten sind unverändert.",
  tour_step_open_session: "Öffne das Gruppentraining. Ein Klemmbrett für alle, die dabei sind.",
  tour_step_focus_exercise:
    "Tippe auf den Zirkel, um ihn nach vorn zu holen. Seine Bedienelemente sind dann in Daumenreichweite.",
  tour_step_signal:
    "Markiere die Runde als Zu leicht. Ein Tipp zeichnet es auf und hinterlässt eine Notiz für den Plan.",
  tour_step_next_participant:
    "Wechsle zum nächsten Teilnehmer — dasselbe Training, sein eigener Plan.",
  // The long demo: chapter titles, the narration cards' bodies, and the labels the
  // narration surface itself needs.
  gym_notes_label: "Im Studio",
  label_repeats: "Wiederholt sich jede Woche",
  label_repeat_days: "An diesen Tagen",
  label_repeat_until: "Bis (freiwillig)",
  btn_invite_client: "Kunden einladen",
  // The trainer's own name leads the message. {trainer} is filled in by intakeInvite.js.
  intake_invite_message:
    "{trainer} lädt dich ein, deine Angaben für das Training selbst einzutragen, mit einer App namens LibrePT. Es dauert eine Minute:",
  intake_invite_message_unsigned:
    "Du bist eingeladen, deine Angaben für das Training selbst einzutragen, mit einer App namens LibrePT. Es dauert eine Minute:",
  intake_invite_privacy: "Was mit deinen Daten passiert:",
  intake_invite_ready: "Link bereit — unten kopieren",
  intake_invite_title: "Kunden einladen",
  intake_invite_lede:
    "Der Kunde trägt seine Angaben und seine Einwilligung auf seinem eigenen Telefon ein und schickt sie dir zurück. Hier wird nichts angelegt, bevor du gelesen hast, was er schickt.",
  intake_invite_contact_label: "Telefonnummer oder E-Mail-Adresse des Kunden",
  intake_invite_send_sms: "SMS schreiben",
  intake_invite_send_email: "E-Mail schreiben",
  intake_invite_send: "Nachricht schreiben",
  intake_invite_opens_sms:
    "Das öffnet deine eigene Nachrichten-App mit der fertigen Einladung. Senden tust du dort.",
  intake_invite_opens_email:
    "Das öffnet deine eigene E-Mail-App mit der fertigen Einladung. Senden tust du dort.",
  intake_invite_needs_contact:
    "Gib eine Telefonnummer oder eine E-Mail-Adresse ein, oder nutze einen der Wege unten.",
  intake_invite_other_ways: "Andere Wege zum Senden",
  intake_invite_qr_label: "Ein Code, der die Anmeldeseite öffnet",
  intake_invite_qr_hint:
    "Halte ihn hoch und bitte den Kunden, die Kamera seines Telefons darauf zu richten. Es öffnet sich dieselbe Anmeldeseite, mit deinem Namen.",
  intake_invite_subject: "Deine Angaben für unser Training",
  intake_invite_sent: "Link gesendet",
  intake_invite_copied: "Link kopiert",
  data_wipe_title: "LibrePT-Daten auf diesem Gerät löschen",
  data_wipe_lede:
    "Jemand, der dir hilft, hat dir das geschickt. Noch ist nichts gelöscht — das passiert erst, wenn du unten bestätigst, und nur auf diesem Gerät.",
  data_wipe_found: "Auf diesem Gerät gefunden:",
  data_wipe_nothing: "Auf diesem Gerät ist nichts gespeichert, das gelöscht werden könnte.",
  data_wipe_schema_store: "Einträge gespeichert als {store}",
  data_wipe_unversioned:
    "Einstellungen, das offene Training und die eigene Verwaltung dieses Geräts",
  data_wipe_unreachable: "Was das nicht erreicht:",
  data_wipe_confirm: "Endgültig löschen",
  menu_import_program: "Programm importieren",
  menu_sandbox_enter: "Sandbox öffnen",
  notif_sandbox_title: "🧪 Sandbox — zum Ausprobieren und Lernen",
  notif_sandbox_desc:
    "Diese Kunden, Pläne und Trainings sind ein Beispielstudio. Probier alles aus: Nichts, was du hier tust, erreicht deine geschäftlichen Daten. Um zu deiner eigenen Arbeit zurückzukehren, öffne das Menü ☰ oben rechts und wähle Sandbox verlassen — du landest dort, wo du aufgehört hast. Um Schritt für Schritt durch die App geführt zu werden, tippe unten in der Liste auf ein Kapitel: Die Tour beginnt bei diesem Kapitel.",
  sync_sandbox_note:
    "Du bist in der Sandbox: Das synchronisiert die eigene Kopie der Sandbox, nicht deine Arbeit.",
  restore_refused_sandbox_file:
    "Diese Datei wurde in der Sandbox erstellt und kann deshalb nicht in deine eigene Arbeit zurückgespielt werden. Öffne die Sandbox und spiel sie dort zurück.",
  menu_sandbox_leave: "Sandbox verlassen",
  sandbox_badge: "SANDBOX",
  sandbox_badge_desc:
    "Sandbox — nichts hier ist deine eigene Arbeit. Hinweis zu Risiken und Datenverlust öffnen.",
  sandbox_stale_title: "Diese Sandbox ist von früher",
  sandbox_stale_body:
    "Ihre Trainings wurden um den Tag herum angelegt, an dem sie erstellt wurde, deshalb ist die heutige Übersicht leer. Das Zurücksetzen der Sandbox-Daten löscht alles, was du in der Sandbox getan hast. Deine eigene Arbeit bleibt unverändert.",
  menu_sandbox_reset: "Sandbox-Daten zurücksetzen",
  sandbox_reset_title: "Sandbox-Daten zurücksetzen?",
  // NAMES what survives — clients, sessions and plans — on the maintainer's ruling (see en.js).
  sandbox_reset_body:
    "Das löscht alles in der Sandbox und legt eine neue an, mit Beispielkunden und Trainings für heute. Deine eigenen Kunden, Trainings und Pläne außerhalb der Sandbox sind sicher und ändern sich nicht.",
  sandbox_reset_decline: "Abbrechen",
  sandbox_stale_confirm: "Sandbox-Daten zurücksetzen",
  sandbox_stale_decline: "Abbrechen",
  sandbox_timer_expired_title: "Ein Timer in deiner eigenen Arbeit ist abgelaufen",
  sandbox_timer_return: "Zurück zu meiner Arbeit",
  sandbox_timer_discard: "Ignorieren",
  program_import_title: "Programm importieren",
  program_import_lede:
    "Füge ein Programm ein, das woanders geschrieben wurde — in einem Chatfenster, einer Tabelle, der Datei eines Kollegen. Es öffnet sich im normalen Plan-Editor, wo du korrigierst, was falsch angekommen ist.",
  program_import_client: "Für wen",
  program_import_session: "Welches Training (freiwillig)",
  program_import_text: "Programm hier einfügen",
  program_import_file: "Datei lesen",
  program_import_template: "Format zeigen",
  program_import_refused_empty:
    "Es gibt nichts zu lesen. Füge ein Programm ein oder wähle eine Datei.",
  program_import_refused_no_data: "In diesem Text wurde kein Programm gefunden.",
  program_import_refused_unreadable: "Dieser Text lässt sich nicht als Programm lesen.",
  program_import_refused_other_format: "Diese Datei hat das Format {found}, nicht {expected}.",
  program_import_refused_no_items: "Dieses Programm nennt keine Übungen.",
  program_import_next_step: "Drücke „{button}“ und vergleiche.",
  program_import_prompt: "Prompt kopieren",
  program_import_prompt_copied: "Prompt kopiert",
  program_import_prompt_text:
    'Schreib das Trainingsprogramm als JSON in genau dieser Form und sonst nichts: {"format": "{format}", "title": "Name des Trainings", "items": [{"name": "Back Squat", "sets": 3, "reps": 5, "weight": 60, "unit": "kg"}, {"rest": 90}]}. Verwende ein Element pro Übung, in der Reihenfolge der Ausführung, und ein {"rest": Sekunden}-Element überall dort, wo eine Pause ist.',
  program_import_no_client: "Kunden auswählen",
  program_import_no_session: "Noch kein Training",
  program_import_open: "Im Editor öffnen",
  program_import_read: "{count} Elemente gelesen, davon {custom} nicht in deinem Katalog.",
  program_import_unreadable:
    "{count} konnten nicht gelesen werden — sie sind mit ihrer Position im Programm aufgelistet:",
  program_import_custom_hint: "Nicht in deinem Katalog — kam mit dem Programm",
  program_import_custom_tag: "EIGENE",
  copy_plan_to: "Diesen Plan kopieren nach…",
  copy_plan_nobody: "Noch niemand sonst ist in diesem Training.",
  unknown_client: "Unbekannter Kunde",
  bind_participants: "Alle auf diesen Plan",
  unbind_participants: "Jedem einen eigenen Plan geben",
  bound_group_label: "Gemeinsam",
  plan_fit_hint: "Geschätzte Übungszeit im Verhältnis zur Dauer des Trainings, ohne Pausen",
  plan_fit_over: "zu lang",
  plan_fit_tight: "knapp",
  label_apply_to_series: "Jeden Abend dieses Trainings ändern",
  session_one_of_a_series:
    "Das ist ein Abend eines wiederkehrenden Trainings. Was du hier änderst, ändert nur diesen Abend.",
  gym_note_in_this_plan: "in diesem Plan",
  feedback_keep_on_record: "In der Kundenakte behalten",
  feedback_note_placeholder: "z. B. linkes Knie knackt, weniger Last...",
  // The demo's front door (see en.js). "Willkommen" addresses the reader without a gendered ending,
  // which Slovenian needs two forms for.
  story_welcome_title: "Willkommen bei LibrePT",
  story_welcome_body:
    "LibrePT ist eine App für Personal Trainer: Termine, Trainingspläne und ein Notizblock während des Trainings. In dieser Tour lädst du drei neue Kunden ein, bereitest das Training am Dienstag vor und passt es an, während es läuft. Alles geschieht in der Sandbox, einer getrennten Kopie mit erfundenen Kunden. Deine echten Kunden, Termine und Trainings ändert sie nicht.",
  story_step_welcome:
    "Zeig es mir zeigt dir zwei Dinge: das Abzeichen SANDBOX in der oberen Leiste und die Zeile Sandbox verlassen oben im Menü ☰. Sandbox-Daten zurücksetzen findest du im Menü unter Einstellungen. Wenn du geschaut hast, schließt Fertig die Karte; das nächste Kapitel wählst du in der Liste unten. Um die App ohne Führung auszuprobieren, klapp diese Karte mit ▾ oben rechts weg. Eine kleine Leiste bleibt sichtbar: Ihr ✕ beendet die Tour.",
  story_persona_trainer: "Dein Telefon",
  story_chapter_trainer_details: "Deine Angaben eintragen",
  story_trainer_details_open_body:
    "Deine Einladungen tragen die Angaben vom ersten Start: Name, Telefon und E-Mail. Hier änderst du sie. Sie gehören dir, nicht der Sandbox, und was du speicherst, bleibt nach der Tour.",
  story_step_trainer_details_menu:
    "Tippe auf ☰ — die drei waagerechten Striche oben rechts in der dunklen Leiste. Das Menü öffnet sich.",
  story_step_trainer_details_settings:
    "Tippe im Menü auf Einstellungen — die letzte Zeile, mit dem Zahnradsymbol. Die Einstellungen öffnen sich.",
  story_step_trainer_details_show:
    "Tippe in den Einstellungen auf Meine Angaben — die Zeile mit dem Kartensymbol. Ein Formular mit Feldern für Vorname, Nachname, Telefon und E-Mail öffnet sich.",
  story_step_trainer_details_close:
    "Tippe unten im Formular auf Abbrechen, oder auf Speichern, wenn du deine Angaben eingetragen hast. Beides schließt das Formular.",
  story_step_settings_close: "Tippe oben rechts in den Einstellungen auf ✕. Sie schließen sich.",
  story_chapter_gym: "Das Training leiten und anpassen",
  story_persona_client: "Anas Telefon",
  story_chapter_arrive: "Drei neue Kunden aufnehmen",
  story_chapter_intake: "Anas Formular",
  story_handover_title: "Das Formular, das Ana bekommt",
  story_back_to_your_phone: "Zurück zu deinem Telefon",
  story_open_client_phone: "Anas Formular öffnen",
  story_step_arrive_menu: "Tippe oben rechts auf ☰. Das Menü öffnet sich.",
  story_step_arrive_clients:
    "Tippe im Menü auf Kundenliste — die Zeile mit den drei kleinen Personen, die zweite in der Liste. Acht Personen sind schon darin.",
  story_step_arrive_invite:
    "Tippe auf Kunden einladen — die Schaltfläche mit den Teilen-Pfeilen direkt unter der Überschrift Kunden. Ana bekommt einen Link und trägt ihre Angaben selbst ein; du schreibst sie nicht im Flur mit.",
  story_step_arrive_contact:
    "Ana sagt dir ihre Telefonnummer. Gib sie in das eine Feld ein; es nimmt eine Nummer oder eine E-Mail-Adresse. Die App erkennt, was es ist: Eine Nummer bekommt eine SMS, eine Adresse eine E-Mail. Über Ana ist noch nichts gespeichert; sie steht erst in der Kundenliste, wenn sie dir ihre Angaben selbst geschickt hat.",
  story_step_arrive_contact_email:
    "Maja gibt stattdessen eine E-Mail-Adresse. Tippe sie im selben Feld über die Nummer. Die App erkennt die Adresse und tauscht die SMS-Schaltfläche gegen eine für E-Mail.",
  story_step_arrive_close_invite:
    "Schließ das mit dem ✕ oben rechts im Fenster. Ana hat ihren Link und Maja ihren; Nik steht noch hier.",
  story_step_arrive_add_manually:
    "Nik steht vor dir und sagt dir seine Angaben, also tippe auf Neuer Kunde — die grüne Schaltfläche oben in der Liste, neben der, die du gerade benutzt hast.",
  story_step_arrive_type_name:
    "Gib Nik Zupan in das Feld Vor- und Nachname ein. Mehr als einen Namen braucht ein Kunde nicht; den Rest kannst du oder er später ergänzen.",
  story_step_arrive_save_client:
    "Tippe unten im Formular auf Speichern. Nik ist in der Kundenliste.",
  story_review_sender: "Ana Novak",
  story_step_review_attach:
    "Tippe auf den Anhang unter ihrer Nachricht. Auf einem echten Telefon ist diese Datei in deinen Nachrichten und öffnet LibrePT mit ihren Angaben. Zur Kundenliste ist noch nichts hinzugefügt.",
  story_step_review_accept:
    "Tippe auf Zu meinen Kunden hinzufügen. Ana ist in deiner Kundenliste, und du hast nichts getippt.",
  story_step_read_on: "Lies das und tippe dann auf Weiter.",
  story_step_handover:
    "Tippe auf Anas Formular öffnen — die Schaltfläche der Tour unten rechts. Der Browser öffnet die Seite, die Ana bekommt, und die Tour geht dort weiter.",
  story_step_thanks:
    "Tippe auf Fertig und erkunde die App selbst, oder auf Demodaten löschen, um sie zu leeren und mit deinen eigenen Kunden zu beginnen.",
  story_message_title: "Eine Nachricht von deinem Trainer",
  story_arrived_title: "Sie kommt auf deinem Telefon an",
  story_arrived_body:
    "Die Datei, die Ana geschickt hat, kommt wie jeder andere Anhang in deinen Nachrichten an. Sie ging über keinen Server. Du entscheidest, ob sie zu deinen Kunden kommt.",
  story_step_intake_send:
    "Tippe auf Mit meinem Trainer teilen — die grüne Schaltfläche unten. Auf einem echten Telefon öffnet sich eine Auswahl von Apps, und Ana schickt dir die Datei, zum Beispiel per E-Mail oder Viber.",
  story_step_message: "Das ist die Nachricht, die Ana bekommt. Lies sie und tippe dann auf Weiter.",
  story_step_arrived: "Lies, was mit der Datei passiert ist, und tippe dann auf Weiter.",
  story_step_back_to_your_phone:
    "Tippe auf Zurück zu deinem Telefon — die Schaltfläche der Tour unten rechts. Der Browser verlässt Anas Seite, und die Tour geht in deiner App weiter, wo du aufgehört hast.",
  story_step_intake_name: "Gib Ana Novak in das Feld Vor- und Nachname ein.",
  story_step_intake_email:
    "Gib ana.novak@example.com in das Feld E-Mail ein. Dorthin schickst du ihr die Trainingszeiten.",
  story_step_intake_injury:
    "Gib in das Feld Verletzungen ein, was du über ihren Körper wissen solltest, zum Beispiel: Schulter, vor zwei Jahren. Das Feld ist freiwillig.",
  story_step_intake_consent:
    "Setz das Häkchen bei der Einwilligung unter dem Formular. Damit erlaubt Ana ausdrücklich, ihre Gesundheitsdaten zu speichern; ohne Häkchen kann sie nicht senden.",
  // Named, and new: Ana, Maja and Nik are not in the seeded register.
  story_arrive_open_body:
    "Ana, Maja und Nik fragen nach einem Kurs, ob sie zusammen trainieren können. Du nimmst alle drei in die Kundenliste auf: Zwei bekommen einen Link und tragen ihre Angaben selbst ein, beim dritten tippst du den Namen ein.",
  story_handover_body:
    "Ana hat ihren Link. Du bleibst der Trainer: Du öffnest die Seite, die Ana bekommt, und füllst das Formular selbst aus, mit den Angaben aus der Geschichte. So siehst du, wie viel Arbeit es für deinen Kunden ist.",
  story_intake_open_body:
    "Das ist die Seite, die Ana öffnet, wenn sie auf den Link in der Nachricht tippt.",
  story_intake_close_body:
    "Mit meinem Trainer teilen schickt dir ihre Datei. Du liest sie und entscheidest; niemand trägt sich selbst in deine Kundenliste ein.",
  story_intake_close_title: "Anas Formular ist gesendet",
  story_chapter_programme: "Dienstagsplan",
  story_chapter_review: "Anas Datei kommt an",
  story_chapter_evening: "Notizen durchsehen und Trainings vorbereiten",
  story_step_programme_open_session: "Tippe auf das Training Kraft & Kondition (Gruppe).",
  story_step_programme_editor:
    "Tippe auf Plan bearbeiten — die Zeile mit dem Stift im Menü. Janes Plan öffnet sich. Neben dem Titel steht zum Beispiel 45 / 60 min: 45 Minuten Übungen in einem 60-Minuten-Training.",
  story_step_programme_add_circuit:
    "Tippe unten im Plan auf + Zirkel — die Schaltfläche mit dem Symbol gestapelter Ebenen. Am Ende des Plans kommt ein leerer Zirkel hinzu, in den du Übungen einfügst.",
  story_step_programme_done:
    "Tippe oben rechts neben dem Titel auf ✓. Der Plan ist gespeichert, und das Training erscheint wieder mit allen dreien.",
  story_step_programme_menu_again: "Tippe noch einmal oben rechts auf ⋮.",
  story_step_programme_bind:
    "Tippe auf Alle auf diesen Plan — die Zeile mit dem Kettensymbol. Jane, John und Sarah machen denselben Zirkel, also teilen sie einen Plan, und du zeichnest die Sätze am Dienstag einmal statt dreimal auf.",
  // Tuesday's session is with Jane, John and Sarah, who are already in the seeded register.
  story_programme_open_body: "Sonntagabend. Du planst die Stunde am Dienstag.",
  story_programme_close_body:
    "Jane, John und Sarah teilen einen Plan. Am Dienstag öffnest du ihn und fängst an.",
  story_programme_close_title: "Der Plan ist fertig",
  story_step_evening_menu: "Zu Hause, später am Abend. Tippe oben rechts auf ☰.",
  story_step_evening_settings:
    "Tippe im Menü auf Einstellungen — die letzte Zeile, mit dem Zahnradsymbol.",
  story_step_evening_move:
    "Diese Woche beginnt der Dienstag zwei Stunden später, abgesprochen mit allen dreien. Tippe auf den Stift auf der Karte Kraft dienstags und donnerstags. Das Formular fragt, ob du nur dieses Training änderst.",
  story_step_evening_move_time:
    "Gib 20:00 in das Feld Beginn ein. Die folgenden Dienstage bleiben um 18:00.",
  story_step_evening_theme:
    "Spät am Abend, auf dem Sofa. Wähle in den Einstellungen unter Design die Option Mitternacht.",
  story_evening_open_body:
    "Das Training ist vorbei, und alle sind nach Hause gegangen. Zu Hause verschiebst du das Training am Dienstag, wie ihr es nach dem Training abgesprochen habt.",
  story_thanks_title: "Ende der Tour",
  story_clear_demo_data: "Demodaten löschen",
  // The story's own voice. It names the people the seed puts on screen — Jane, John, Sarah.
  story_step_open_session: "Tippe auf das Training Kraft & Kondition (Gruppe).",
  story_step_focus_exercise: "Tippe auf Janes Zirkel. Er öffnet sich mit ihren Übungen und Zahlen.",
  story_step_signal_too_easy:
    "Tippe unter der Übung auf Zu leicht (die Feder). Bei der Übung wird vermerkt, dass sie ihr zu leicht war.",
  story_step_next_participant:
    "Tippe oben in der Namensleiste auf Johns Namen. Dasselbe Training, sein Plan.",
  story_step_refocus: "Tippe auf seinen Zirkel, um ihn zu öffnen.",
  story_step_capture_open:
    "In einer Pause erwähnt John sein Knie, das 2024 operiert wurde. Tippe unter der ersten Übung des Zirkels auf Notizen (der Haftzettel). Die Notiz öffnet sich über dem Training; die Uhr läuft weiter.",
  story_step_capture_tag: "Tippe auf 🔥 Joint Pain / Discomfort — Gelenkschmerzen.",
  story_step_capture_note:
    "Gib in das Notizfeld ein, was er gesagt hat: linkes Knie, dritte Runde.",
  // What the demo TYPES, not what it says about typing: the words a person enters are
  // translated like everything else they read.
  story_typed_note: "linkes Knie, dritte Runde",
  story_typed_injury: "Schulter, vor zwei Jahren",
  story_step_capture_keep:
    "Setz das Häkchen bei In der Kundenakte behalten. Mit dem Häkchen bleibt die Notiz auch nach diesem Training in Johns Akte. Gespeichert ist sie noch nicht: Das macht die Schaltfläche im nächsten Schritt.",
  story_step_capture_submit:
    "Tippe unten auf Hinweis speichern. Jetzt ist die Notiz gespeichert, bei John und bei dieser Übung.",
  story_step_session_menu:
    "Tippe auf ⋮ — die drei Punkte oben rechts. Das Menü des Trainings öffnet sich.",
  story_step_plan_editor:
    "Tippe auf Plan bearbeiten. Johns Plan öffnet sich; die Notiz steht darin, neben der Übung.",
  story_step_swap_open:
    "Wegen seines Knies macht John diese Übung heute nicht. Tippe auf das Symbol des offenen Buchs in der Zeile der Übung, um den Übungskatalog zu öffnen.",
  story_step_swap_pick:
    "Tippe auf Lat Pulldown: eine Übung für dieselben Muskeln, die das Knie nicht belastet. Die Übung ändert sich nur für John; Jane und Sarah behalten ihre Pläne.",
  story_gym_open_body: "Dienstag, 18:10. Jane, John und Sarah sind da.",
  story_gym_close_body:
    "Johns Knie steht in seiner Akte und in seinem Plan, und Jane und Sarah haben weiter trainiert.",
  story_evening_close_body:
    "Es ist vermerkt, dass es Jane zu leicht war. Johns Knie steht in seiner Akte und in seinem Plan. Der Dienstag ist diese Woche um 20:00.",
  story_gym_close_title: "Das Training ist vorbei",
  today: "Heute",
  tomorrow: "Morgen",
  yesterday: "Gestern",
  upcoming: "Demnächst",
  starts_in: "Beginnt in",
  session_overlaps_with: "Überschneidet sich mit {times}",
  overdue: "Überfällig",
  elapsed: "Vergangen",
  edit_elapsed_time: "Vergangene Zeit bearbeiten",
  live: "Läuft",
  editing: "In Bearbeitung",
  unscheduled: "Ohne Termin",
  combo_round_title: "Zirkel",
  bar_clients_one: "{count} Kunde",
  bar_clients_two: "{count} Kunden",
  bar_clients_few: "{count} Kunden",
  bar_clients_other: "{count} Kunden",
  bar_past_end: "Über der Zeit {time}",
  sync_badge_ahead_one: "{count} Änderung auf diesem Gerät zum Senden",
  sync_badge_ahead_two: "{count} Änderungen auf diesem Gerät zum Senden",
  sync_badge_ahead_few: "{count} Änderungen auf diesem Gerät zum Senden",
  sync_badge_ahead_other: "{count} Änderungen auf diesem Gerät zum Senden",
  sync_badge_behind_one: "{count} Änderung in der Cloud zum Abrufen",
  sync_badge_behind_two: "{count} Änderungen in der Cloud zum Abrufen",
  sync_badge_behind_few: "{count} Änderungen in der Cloud zum Abrufen",
  sync_badge_behind_other: "{count} Änderungen in der Cloud zum Abrufen",
  sync_badge_behind_unknown: "Änderungen in der Cloud sind nicht bekannt",
  sync_hub_ahead_one: "{count} Änderung auf diesem Gerät ist noch nicht in Google Drive.",
  sync_hub_ahead_two: "{count} Änderungen auf diesem Gerät sind noch nicht in Google Drive.",
  sync_hub_ahead_few: "{count} Änderungen auf diesem Gerät sind noch nicht in Google Drive.",
  sync_hub_ahead_other: "{count} Änderungen auf diesem Gerät sind noch nicht in Google Drive.",
  sync_hub_none: "Alles auf diesem Gerät ist schon in Google Drive.",
  sync_hub_cloud_unknown:
    "Das ? in der Kopfzeile heißt: Die Änderungen in Google Drive sind nicht bekannt, weil es nicht verbunden oder nicht erreichbar ist.",
  restore_invalid_file:
    "Diese Datei ist keine LibrePT-Sicherung. Auf diesem Gerät wurde nichts geändert. Wähle die Datei, die LibrePT mit „JSON exportieren“ erstellt hat.",
  restore_unsupported_version:
    "Diese Sicherung hat das Format der Version {version}, das diese Version von LibrePT nicht öffnen kann. Aktualisiere LibrePT und versuche es noch einmal. Auf diesem Gerät wurde nichts geändert.",
  restore_unmigratable:
    "Diese Sicherung lässt sich für diese Version von LibrePT nicht aktualisieren. Auf diesem Gerät wurde nichts geändert.",
  signal_too_easy: "Zu leicht",
  signal_too_hard: "Zu schwer",
  feedback_tag_too_easy: "Zu leicht – Last erhöhen",
  feedback_tag_too_hard: "Zu schwer – Last verringern",
  feedback_tag_form_break: "Technik lässt nach – auf die Haltung achten",
  feedback_tag_joint_pain: "Gelenkschmerz oder Beschwerden",
  feedback_tag_progression: "Guter Fortschritt",
  feedback_tag_note: "Nur Notiz, ohne Bewertung",
  feedback_short: "Notizen",
  feedback_has_note: "Rückmeldung (mit Notiz)",
  round_label: "Runde",
  complete_round: "Runde abschließen",
  finish_circuit: "Zirkel beenden",
  rest_label: "Pause",
  skipped: "Übersprungen",
  // A circuit movement whose target is "as many as you can": the field takes the number actually done.
  failure_reps_label: "Geschaffte Wdh.",
  failure_reps_placeholder: "Max.",

  // Application (☰) header menu + About / Terms modals
  // This dictionary's own name, written IN this language and never translated (see en.js).
  language_name: "Deutsch",
  menu_language: "Sprache",
  menu_theme: "Design",
  theme_name_daylight: "Tageslicht",
  theme_name_midnight: "Mitternacht",
  theme_name_spreadsheet: "Tabelle",
  theme_name_blossom: "Blüte",
  theme_name_nebula: "Nebula",
  menu_clients_register: "Kundenliste",
  menu_sessions: "Trainingstermine",
  menu_library: "Übungen und Routinen",
  menu_data: "Datenverwaltung",
  menu_settings: "Einstellungen",
  menu_connected_accounts: "Verbundene Konten",
  accounts_lede:
    "Die externen Dienste, mit denen diese App verbunden ist. Von diesem Gerät entfernen vergisst die Verbindung nur hier; andere Geräte behalten ihren Zugriff. Zugriff widerrufen beendet den Zugriff der App beim Dienst, für alle Geräte.",
  accounts_none: "Diese Version der App verbindet sich mit keinem externen Dienst.",
  account_google_drive: "Google Drive",
  account_connected: "Auf diesem Gerät verbunden.",
  account_not_connected: "Auf diesem Gerät nicht verbunden.",
  account_clear: "Von diesem Gerät entfernen",
  account_revoke: "Zugriff widerrufen",
  account_cleared: "Auf diesem Gerät vergessen. Andere Geräte behalten ihren Zugriff.",
  account_revoked: "Zugriff widerrufen. Die App erreicht diesen Dienst von keinem Gerät mehr.",
  account_revoke_unreachable:
    "Der Dienst war nicht erreichbar, daher kann der Zugriff der App noch bestehen. Dieses Gerät hat ihn vergessen. Um ihn für alle Geräte zu beenden, entferne den Zugriff von LibrePT auf der Seite des Dienstes:",
  account_manage_link: "Seite des Dienstes öffnen",
  settings_help_heading: "Hilfe und Rechtliches",
  btn_review_signup: "Kunden aus den gesendeten Angaben hinzufügen",
  drive_sync_connect: "Google Drive verbinden",
  drive_sync_now: "Jetzt synchronisieren",
  drive_sync_syncing: "Wird synchronisiert…",
  // What the header cloud's overlay glyph MEANS, spoken.
  drive_sync_glyph_failed: "Letzte Synchronisierung fehlgeschlagen",
  drive_sync_glyph_disconnected: "Cloud-Synchronisierung nicht verbunden",
  drive_sync_glyph_idle: "Cloud-Synchronisierung verbunden",
  notif_crash_title: "Etwas ist schiefgegangen",
  notif_crash_report: "Melden",
  notif_rsvp_title: "Antworten auf Einladungen",
  notif_rsvp_unknown_client: "Ein Kunde",
  rsvp_answer_yes: "kommt",
  rsvp_answer_no: "kann nicht",
  rsvp_answer_maybe: "unsicher",
  notif_sync_failed_title: "Cloud-Synchronisierung fehlgeschlagen",
  drive_sync_desc_connected:
    "Halte deine Kunden, Routinen und deinen Trainingsverlauf auf deinen eigenen Geräten gleich, in einem versteckten App-Ordner in deinem Google Drive, den nur LibrePT sieht.",
  drive_sync_not_configured:
    "Die Synchronisierung mit Google Drive ist für diese Installation noch nicht eingerichtet.",
  drive_sync_status_ok: "Synchronisiert",
  drive_sync_status_ok_conflicts: "Synchronisiert, mit Konflikten zum Prüfen",
  drive_sync_status_error: "Synchronisierung fehlgeschlagen: {error}",
  drive_sync_status_reauth: "Anmeldung abgelaufen — tippe, um neu zu verbinden.",
  drive_sync_status_denied:
    "Google hat dieses Konto noch nicht für die Synchronisierung freigegeben. Deine Daten sind auf diesem Gerät sicher.",
  drive_sync_status_declined: "Nicht verbunden — du kannst jederzeit verbinden.",
  drive_sync_review_conflicts: "Konflikte prüfen",
  // The Sync & Backup dialog's own markup (modules/common/backupRestore.js).
  drive_sync_title: "Cloud-Sicherung (Google Drive)",
  drive_sync_disconnect: "Trennen",
  drive_sync_interval_label: "Synchronisieren alle",
  drive_sync_interval_unit: "Min.",
  drive_sync_preview_warning:
    "Vorschauversion: Die Synchronisierung schreibt das letzte stabile Format, deshalb wird nichts gespiegelt, was diese Vorschau hinzugefügt hat.",
  backup_preview_warning:
    "Dies ist eine Vorschauversion. Sicherungen und Synchronisierung werden im letzten stabilen Format geschrieben, deshalb ist nichts enthalten, was diese Vorschau hinzugefügt hat. Behalte eine eigene Kopie von allem, was du nicht verlieren darfst.",
  restore_replaces_all: "Das Zurückspielen ersetzt alles auf diesem Gerät.",
  restore_you_would_lose: "Du würdest verlieren:",
  restore_keep: "Behalten, was ich habe",
  restore_replace: "Ersetzen",
  restore_nothing_changed: "Nichts wurde geändert.",
  confirm_remove_participant_with_feedback:
    "Zu diesem Training sind Rückmeldungen aufgezeichnet. Wenn du einen Kunden herausnimmst, ändert sich das Training, und der schon aufgezeichnete Trainingsverlauf dieses Kunden bleibt in seiner Akte. Herausnehmen?",
  drive_conflict_type_add_add: "Auf beiden Geräten angelegt",
  drive_conflict_type_edit_edit: "Auf beiden Geräten bearbeitet",
  drive_conflict_type_delete_edit: "Auf diesem Gerät gelöscht, woanders bearbeitet",
  drive_conflict_type_edit_delete: "Auf diesem Gerät bearbeitet, woanders gelöscht",
  drive_conflict_deleted: "— gelöscht —",
  drive_conflict_keep: "Diese Fassung behalten",
  drive_conflict_keep_deleted: "Trotzdem löschen",
  drive_conflict_local: "Dieses Gerät",
  drive_conflict_remote: "Anderes Gerät",
  drive_conflict_none: "Keine Konflikte mehr zu prüfen.",
  menu_github: "Projekt auf GitHub",
  menu_feedback: "Rückmeldung senden",
  feedback_route_title: "Sag uns deine Meinung",
  feedback_route_lede:
    "Ideen, Fragen oder alles, was im Training umständlich war — eine E-Mail, kein Konto nötig.",
  feedback_route_mail: "E-Mail schreiben",
  feedback_route_subject: "Rückmeldung zu LibrePT",
  feedback_route_intro: "Was ich sagen wollte:",
  feedback_route_bug_lede:
    "Ist stattdessen etwas kaputt? Eröffne ein Issue und häng einen Screenshot an — das ist das Nützlichste, was du schicken kannst, und die App kann ihn nicht für dich machen.",
  feedback_route_public_warning:
    "Issues auf GitHub sind öffentlich. Schneide alles ab oder mach alles unkenntlich, was einen Kunden erkennen lässt, bevor du einen Screenshot anhängst — ein Fehler lässt sich auch ohne Namen nachstellen.",
  feedback_route_issue: "Fehler auf GitHub melden",
  feedback_route_issue_title: "Fehler: ",
  feedback_route_issue_placeholder:
    "<!-- Was hast du gerade getan, und was hast du stattdessen erwartet? -->",
  feedback_route_diagnostics: "Wird mitgeschickt — du kannst vor dem Senden alles davon löschen:",
  menu_bug_report: "Fehler melden",
  menu_about: "Über",
  menu_terms: "Bedingungen und Haftungsausschluss",
  menu_privacy: "Datenschutz und DSGVO",
  about_title: "Über LibrePT",
  about_body:
    "LibrePT ist ein kostenloses, quelloffenes Klemmbrett für Personal Trainer, das ohne Internet funktioniert — Trainings planen, sie im Studio leiten und den Fortschritt der Kunden verfolgen. Standardmäßig bleiben alle Daten auf deinem Gerät, außer du entscheidest dich für die Synchronisierung mit deinem eigenen Cloud-Speicher.",
  about_repo: "Projekt auf GitHub ansehen",
  about_licenses: "Lizenzen und Quellenangaben",
  terms_title: "Bedingungen und Haftungsausschluss",
  terms_body:
    "LibrePT wird „wie besehen“ bereitgestellt, ohne jede Gewährleistung. Es ist keine medizinische, gesundheitliche oder fachliche Trainingsberatung. Deine Daten werden auf deinem Gerät gespeichert (mit optionalen Anbindungen an deinen eigenen Cloud-Speicher oder deine Sicherung, die du selbst einschaltest), und du bist für ihre Verwaltung verantwortlich. Nutzung auf eigenes Risiko.",
  terms_agree: "Ich stimme zu",

  // Notification Area & Welcome Demo
  notif_summary_title: "Benachrichtigungen und Status",
  notif_empty_title: "Keine Benachrichtigungen",
  notif_empty_desc: "Du bist auf dem neuesten Stand — hier ist gerade nichts.",
  notif_seed_demo_title: "👋 Willkommen bei LibrePT",
  notif_seed_demo_desc:
    "Hier ist noch nichts gespeichert. Um zu sehen, was die App kann, tippe unten in der Liste auf ein Kapitel: Es ist eine geführte Tour, die drei neue Kunden von der ersten Einladung bis zu einem Training im Studio begleitet, und sie beginnt bei dem Kapitel, auf das du tippst. Um selbst etwas auszuprobieren, tippe auf Sandbox öffnen — eine getrennte Kopie der App, in der nichts, was du tust, die Einträge ändert, die du hier führst.",
  notif_demo_mode_title: "⚠️ Demomodus — Beispieldaten geladen",
  notif_demo_mode_desc:
    "Diese App läuft mit Beispielkunden, -routinen und -trainings. Lösche sie, bevor du sie für echte Arbeit nutzt: Das Löschen listet genau auf, was es entfernt, und behält den Übungskatalog, damit alles, was du darauf aufgebaut hast, weiter funktioniert.",
  filter_participants_placeholder: "Kunden nach Namen suchen...",
  notif_demo_mode_reset_btn: "Demodaten löschen und Demomodus beenden",
  notif_welcome_title: "👋 Du erkundest die App mit Beispieldaten",
  notif_welcome_desc:
    "Die Kunden, Routinen und Trainings hier sind ein Beispielstudio. Schau dich frei um — keine dieser Personen ist echt.",
  notif_welcome_clients_btn: "Beispielkunden ansehen",

  // Build-info dialog: reachable by tapping the header stamp (a tooltip is unreachable on a phone).
  build_info_title: "Diese Version",
  build_info_commit: "Commit",
  build_info_schema: "Datenschema",
  build_info_built: "Erstellt",
  build_info_copy: "Versionsangaben kopieren",
  build_info_copied: "Kopiert",
  build_info_copy_failed: "Markiere den Text oben und kopiere ihn",
  notif_spot_res_title: "📅 Platz reserviert",
  notif_spot_res_desc: "John Smith hat einen Platz im Training HIIT-Kondition gebucht.",
  notif_spot_cancel_title: "⚠️ Platz storniert",
  notif_spot_cancel_desc:
    "Mike Chen hat seinen Platz im Training Morgendliche Kondition morgen um 09:00 storniert.",
  notif_count_badge: "{unread} ungelesen / {all} gesamt",
  notif_mark_all_read: "Alle als gelesen markieren",
  notif_unscheduled_plans_title: "Pläne ohne Termin",
  notif_unscheduled_plans_desc_one: "Entworfene Pläne, noch keinem Training zugeordnet: {count}",
  notif_unscheduled_plans_desc_two: "Entworfene Pläne, noch keinem Training zugeordnet: {count}",
  notif_unscheduled_plans_desc_few: "Entworfene Pläne, noch keinem Training zugeordnet: {count}",
  notif_unscheduled_plans_desc_other: "Entworfene Pläne, noch keinem Training zugeordnet: {count}",
  notif_pending_sessions_title: "Trainings zum Prüfen",
  notif_pending_sessions_desc_one: "Kunden mit offenen Rückmeldungen aus einem Training: {count}",
  notif_pending_sessions_desc_two: "Kunden mit offenen Rückmeldungen aus einem Training: {count}",
  notif_pending_sessions_desc_few: "Kunden mit offenen Rückmeldungen aus einem Training: {count}",
  notif_pending_sessions_desc_other: "Kunden mit offenen Rückmeldungen aus einem Training: {count}",
  client_email: "E-Mail",
  client_phone: "Telefonnummer",
  not_specified: "Nicht angegeben",
  custom_empty_plan: "Leerer Plan, ohne Routine",
  plan_program_title: "Kommendes Programm planen",
  planned_program: "Geplantes Programm",
  // The sideways deck of a client's plans on the clipboard.
  plan_peek_previous: "Vorheriger Plan",
  plan_peek_next: "Nächster Plan",
  plan_peek_up_open: "Nach oben streichen zum Öffnen",
  plan_peek_up_create: "Nach oben streichen, um einen Plan anzulegen",
  plan_peek_no_previous: "Kein vorheriger Plan.",
  plan_peek_no_next: "{client} hat noch keinen nächsten Plan.",
  plan_peek_create: "Plan anlegen",
  plan_peek_back_to_today: "Zurück zum heutigen Training",
  date_unknown: "Datum unbekannt",
  planning: "Planung",
  btn_plan_program: "Programm planen",
  unbacked_due: "NICHT GESICHERT",
  unbacked_urgent: "GEFÄHRDET — JETZT SICHERN",
  offline_cached_desc:
    "HTTP-Server nicht erreichbar. Die App läuft mit dem zwischengespeicherten Code und kann nicht nach Updates suchen.",
  // The two data-subject-request dialogs (modules/clients/clientDataRights.js).
  rights_export_title: "Daten dieses Kunden exportieren",
  rights_export_scope:
    "Aufgezeichnete Trainings: {logged}, Buchungen: {sessions}, Planänderungen: {updates}. Daten anderer Kunden sind nie enthalten: Ein Gruppentraining erscheint nur mit seiner Größe.",
  export_doc_title: "# Deine Trainingsdaten — {name}",
  export_doc_prepared: "Erstellt am {date} von {controller}, dem Verantwortlichen für diese Daten.",
  export_doc_prepared_unnamed:
    "Erstellt am {date} von deinem Trainer, dem Verantwortlichen für diese Daten.",
  export_doc_about: "## Über dich",
  export_doc_name: "Name",
  export_doc_email: "E-Mail",
  export_doc_phone: "Telefon",
  export_doc_since: "Kunde seit",
  export_doc_goals: "Trainingsziele",
  export_doc_notes: "Notizen deines Trainers",
  export_doc_injury: "Notizen zu Verletzungen und Beweglichkeit",
  export_doc_consent_withdrawn:
    "Einwilligung: unterschrieben {signed} (Formularversion {version}), widerrufen {withdrawn}",
  export_doc_consent_active: "Einwilligung: unterschrieben {signed}, Formularversion {version}",
  export_doc_consent_none: "Einwilligung: keine erfasst",
  export_doc_sessions: "## Termine ({count})",
  export_doc_group: "Gruppe von {count}",
  export_doc_logged: "## Erfasstes Training ({count})",
  export_doc_session: "Termin",
  export_doc_session_held: "stattgefunden",
  export_doc_session_planned: "geplant",
  export_doc_plan_changes: "## Programmänderungen ({count})",
  export_doc_feedback: "Rückmeldung",
  export_doc_bodyweight: "Körpergewicht",
  export_doc_reps: "Wdh.",
  export_doc_withheld_title: "## Was zurückgehalten wurde",
  export_doc_withheld_body:
    "Ein Teil des Folgenden wurde entfernt, weil er eine andere Person nennt, deren eigene Datenschutzrechte begrenzen, was dir offengelegt werden darf (Art. 15 Abs. 4): {fields}.",
  export_doc_withheld_ask:
    "Frag deinen Trainer, wenn du glaubst, dass etwas über DICH zurückgehalten wurde.",
  export_doc_rights_title: "## Deine Rechte",
  export_doc_rights_body:
    "Du kannst deinen Trainer bitten, Unrichtiges zu berichtigen (Art. 16), deine Daten zu löschen (Art. 17) oder die Verarbeitung einzuschränken (Art. 18), und du kannst deine Einwilligung widerrufen (Art. 7 Abs. 3). Der Widerruf beendet die weitere Verarbeitung, berührt aber nicht, was vorher rechtmäßig geschehen ist. Wenn du glaubst, dass mit deinen Daten falsch umgegangen wurde, kannst du dich bei deiner nationalen Aufsichtsbehörde beschweren.",
  export_doc_produced:
    "Diese Datei wurde mit LibrePT erstellt; seine Entwickler erhalten nie eine Kopie.",
  rights_export_needs_trainer:
    "Trage zuerst unter Einstellungen → Meine Daten deinen Namen und eine Telefonnummer oder E-Mail ein. Das Dokument nennt dich als die Person, die die Daten dieses Kunden aufbewahrt.",
  rights_email_subject: "Deine personenbezogenen Daten — wie gewünscht",
  rights_email_body:
    "Hallo {name},\n\nim Anhang ist die Kopie der personenbezogenen Daten, die ich über dich aufbewahre, wie gewünscht.\n\nDie Datei ist verschlüsselt. Das Passwort schicke ich dir getrennt — per SMS, nicht in dieser E-Mail —, denn eine E-Mail mit beidem würde nichts schützen.\n\nSo öffnest du sie: Geh auf {link}, öffne {path}, wähle den Anhang und gib das Passwort ein. Nichts wird hochgeladen; sie öffnet sich auf deinem eigenen Gerät.\n\nWenn etwas darin falsch ist, sag es mir, dann korrigiere ich es.\n",
  rights_export_notes_label: "Deine Notizen zu diesem Kunden (werden offengelegt)",
  rights_export_notes_hint:
    "Deine Notizen sind personenbezogene Daten des Kunden und müssen offengelegt werden. Bearbeite sie nur, um Angaben über andere Personen zu entfernen. Die Datei vermerkt, dass etwas weggelassen wurde.",
  rights_passphrase_label: "Passwort für die verschlüsselte Datei",
  rights_copy: "Kopieren",
  rights_new_passphrase: "Neu",
  rights_passphrase_send:
    "Schick es per SMS oder sag es persönlich. Schick es nie in derselben E-Mail wie die Datei.",
  rights_passphrase_needed: "Ohne das Passwort kann niemand die Datei öffnen, auch du nicht.",
  rights_step_download: "Die verschlüsselte Datei herunterladen.",
  rights_step_compose: "Eine E-Mail an den Kunden schreiben.",
  rights_step_attach:
    "Die Datei selbst anhängen: Eine App kann keine Datei an deine E-Mail anhängen.",
  rights_step_passphrase: "Das Passwort getrennt schicken.",
  rights_readable_copy: "Lesbare Kopie",
  rights_download_encrypted: "Verschlüsselt herunterladen",
  rights_compose_email: "E-Mail schreiben",
  rights_erase_title: "Diesen Kunden löschen (DSGVO-Antrag)",
  rights_erase_namesakes:
    "⚠ Ein anderer Kunde hat genau diesen Namen: {others}. Prüfe, ob du die richtige Person geöffnet hast. Das löscht nur die Person oben.",
  rights_erase_what:
    "Name, Kontaktdaten, Ziele, Notizen, Verletzungen und Verlauf des Körpergewichts werden durch eine anonyme Bezeichnung ersetzt. Die Trainingsaufzeichnungen bleiben, verbunden mit einer Kennung, die zu keiner Person mehr führt.",
  rights_erase_final:
    "Das lässt sich nicht rückgängig machen. Nichts wird aufbewahrt, womit es sich rückgängig machen ließe.",
  rights_erase_requested: "Datum des Antrags",
  rights_copy_receipt: "Bestätigung kopieren",
  rights_erase_confirm: "Endgültig löschen",
  disambiguator_joined: "dabei seit",
  rights_erase_word: "LÖSCHEN",
  rights_erase_type: "Zum Bestätigen {word} eingeben",
  name_collision_hint_one:
    "Weitere Kunden mit diesem Namen: {count} ({others}). Füge einen Spitznamen hinzu, um sie zu unterscheiden.",
  name_collision_hint_two:
    "Weitere Kunden mit diesem Namen: {count} ({others}). Füge einen Spitznamen hinzu, um sie zu unterscheiden.",
  name_collision_hint_few:
    "Weitere Kunden mit diesem Namen: {count} ({others}). Füge einen Spitznamen hinzu, um sie zu unterscheiden.",
  name_collision_hint_other:
    "Weitere Kunden mit diesem Namen: {count} ({others}). Füge einen Spitznamen hinzu, um sie zu unterscheiden.",
  // The client detail view (modules/clients/clientsView.js).
  view_grabber_home: "Zur Startseite",
  view_grabber_clipboard: "Klemmbrett des Trainings öffnen",
  view_grabber_close_session: "Training schließen und zur Startseite",
  profile_consent_label: "DSGVO-Einwilligung zur Cloud-Synchronisierung",
  profile_ai_safe_copy: "Anonyme Kopie für KI",
  profile_export_data: "Daten exportieren (DSGVO)",
  profile_erase_client: "Kunden löschen (DSGVO)",
  profile_send_consent: "Einwilligung anfragen",
  profile_ai_copied:
    "Kopiert: die Kennung des Kunden und seine Trainingsaufzeichnungen. Name, Kontaktdaten, Ziele und Notizen sind nicht enthalten.",
  profile_erased_banner:
    "Am {date} auf Antrag des Kunden gelöscht. Die Trainingsaufzeichnungen unten sind anonym.",
  consent_badge_withdrawn: "Einwilligung widerrufen ({dates})",
  consent_badge_none: "Keine Einwilligung (nur lokal)",
  consent_badge_given: "Eingewilligt ({detail})",
  consent_badge_verified: "Bestätigt",
  consent_legend: "Datenschutz (DSGVO)",
  consent_signed_label:
    "Der Kunde hat das Einwilligungsformular unterschrieben (Speicherung und Cloud-Synchronisierung)",
  consent_date_label: "Datum der Unterschrift",
  consent_withdrawn_label: "Datum des Widerrufs",
  consent_form_version: "Version des Einwilligungsformulars",
  consent_lang_label: "Sprache des Formulars",
  consent_send_email: "Per E-Mail senden",
  consent_send_sms: "Link per SMS senden",
  consent_no_email: "Keine E-Mail hinterlegt",
  consent_no_phone: "Kein Telefon hinterlegt",
  consent_info_button: "Wer bewahrt das Formular auf?",
  consent_info_title: "Du bewahrst das unterschriebene Formular auf",
  consent_info_body:
    "LibrePT speichert nur, dass die Einwilligung erteilt wurde und an welchem Datum — nie ein Foto, einen Scan oder eine Unterschrift. Als Verantwortlicher musst du das unterschriebene Formular selbst aufbewahren, solange du Daten dieses Kunden hast, damit du die Einwilligung nachweisen kannst, falls du jemals danach gefragt wirst. Widerruft der Kunde seine Einwilligung, lösche hier seine Daten und vermerke den Widerruf auf deiner Kopie.",
  consent_info_ack: "Verstanden",
  notif_test_data_escaped_title: "Testeinträge sind in deinen Daten",
  notif_test_data_escaped_desc:
    "Von einem Testlauf geschriebene Einträge ({count}) sind zusammen mit deiner eigenen Arbeit gespeichert, in {collections}. Sie gehören nicht dir, und wenn du sie entfernst, bleibt alles, was du erstellt hast, unverändert.",
  notif_test_data_escaped_btn: "Testeinträge entfernen",
  test_data_collection_clients: "Kunden",
  test_data_collection_exercises: "Übungen",
  test_data_collection_routines: "Routinen",
  test_data_collection_sessions: "Trainings",
  test_data_collection_history: "Trainingsprotokolle",
  test_data_collection_planUpdates: "offene Planänderungen",
  test_data_collection_notifications: "Benachrichtigungen",
  test_data_collection_invites: "Einladungen",
  test_data_collection_sessionSeries: "wiederkehrende Termine",
  test_data_collection_circuits: "Zirkel",
  test_data_collection_previewProbe: "Testeinträge",
  demo_cleanup_reason_depended_on: "Bleibt, weil ein Eintrag von dir noch davon abhängt",
};
