// components/workoutSetup.js
// Manages the workout setup view (#view-workout-setup), allowing
// selection of participants and assigning routine plans before launching the clipboard.
// Auto-persists form drafts to localStorage so user data survives page reloads.

let deps = null;
let isPlanningModeActive = false;
const DRAFT_KEY = "librept_workout_setup_draft";

export function initWorkoutSetup(d) {
  deps = d;
}

export function saveSetupDraft() {
  const nameInput = document.getElementById("setup-session-name");
  const dateInput = document.getElementById("setup-session-date");
  const startInput = document.getElementById("setup-start-time");
  const endInput = document.getElementById("setup-end-time");
  const locInput = document.getElementById("setup-location");

  const clientRoutines = {};
  const checkedClients = [];
  const rows =
    document
      .getElementById("setup-participants-assignment-list")
      ?.querySelectorAll(".participant-setup-row") || [];

  for (const row of rows) {
    const cb = row.querySelector('input[type="checkbox"]');
    const select = row.querySelector("select");
    if (cb?.checked) {
      checkedClients.push(cb.value);
    }
    if (cb && select) {
      clientRoutines[cb.value] = select.value;
    }
  }

  const draft = {
    sessionName: nameInput?.value || "",
    date: dateInput?.value || "",
    startTime: startInput?.value || "",
    endTime: endInput?.value || "",
    location: locInput?.value || "",
    checkedClients,
    clientRoutines,
    isPlanningModeActive,
  };

  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn("Failed to save workout setup draft to localStorage", e);
  }
}

export function clearSetupDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {}
}

export function getSetupDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

let editingBookingId = null;

export function setupWorkoutSetup() {
  const form = document.getElementById("form-workout-setup");
  if (!form) return;

  const cancelBtns = document.querySelectorAll(
    ".setup-cancel-btn, #view-workout-setup .view-grabber",
  );

  const handleCancel = () => {
    clearSetupDraft();
    editingBookingId = null;
    const todayDate = deps.getISODateForColumn("today");
    window.history.pushState(null, "", deps.toUrl(`/sessions/${todayDate}`));
    deps.switchView("clients");
    requestAnimationFrame(() => deps.focusSessionsColumn("today", "auto"));
  };

  for (const btn of cancelBtns) {
    btn.addEventListener("click", handleCancel);
  }

  // Real-time participant filtering by client name
  const searchInput = document.getElementById("setup-participant-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      const rows = document
        .getElementById("setup-participants-assignment-list")
        ?.querySelectorAll(".participant-setup-row") || [];
      for (const row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = !q || text.includes(q) ? "flex" : "none";
      }
    });
  }

  // Auto-save draft on any input change
  form.addEventListener("input", saveSetupDraft);
  form.addEventListener("change", saveSetupDraft);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Collect active clients checked and their selected routines
    const clientRoutines = [];
    const rows = document
      .getElementById("setup-participants-assignment-list")
      .querySelectorAll(".participant-setup-row");

    for (const row of rows) {
      const cb = row.querySelector('input[type="checkbox"]');
      if (cb?.checked) {
        const clientId = cb.value;
        const select = row.querySelector("select");
        const routineId = select ? select.value : "";
        clientRoutines.push({ clientId, routineId });
      }
    }

    const { t } = deps;

    if (clientRoutines.length === 0) {
      alert("You must select at least one participant client.");
      return;
    }

    const missingRoutine = clientRoutines.find((cr) => !cr.routineId);
    if (missingRoutine) {
      alert("Please assign a routine template to all selected participants.");
      return;
    }

    // Warning when editing a session and removing a participant who has recorded feedback data
    if (editingBookingId) {
      const state = deps.getState();
      const existingBooking = (state.bookings || []).find((b) => b.id === editingBookingId);
      if (existingBooking?.participants) {
        const selectedClientIds = clientRoutines.map((cr) => cr.clientId);
        const removedParticipants = existingBooking.participants.filter(
          (pid) => !selectedClientIds.includes(pid),
        );
        if (
          removedParticipants.length > 0 &&
          (existingBooking.status === "completed" ||
            existingBooking.loggedHistory ||
            existingBooking.hasFeedback)
        ) {
          const confirmed = confirm(
            "Warning: You are removing a participant from a session with recorded feedback data. Removing a client from the session will update session details, but all exercise history logs already recorded for this client will be preserved in their client history. Do you wish to proceed?",
          );
          if (!confirmed) return;
        }
      }
    }

    const sessionName = document.getElementById("setup-session-name")?.value.trim() || "";
    const sessionDate = document.getElementById("setup-session-date")?.value || "";
    const startTime = document.getElementById("setup-start-time")?.value || "";
    const endTime = document.getElementById("setup-end-time")?.value || "";
    const location = document.getElementById("setup-location")?.value.trim() || "";

    let bookingMeta = null;
    let timeLabel = "";
    if (startTime && endTime) {
      timeLabel = `${startTime} - ${endTime}`;
    } else if (startTime) {
      timeLabel = startTime;
    } else {
      timeLabel = t("date_unknown") || "Date Unknown";
    }

    if (isPlanningModeActive) {
      bookingMeta = {
        id: editingBookingId || `plan-${Date.now()}`,
        isPlanning: true,
        titles: [sessionName || t("planned_program") || "Planned Program"],
        date: sessionDate,
        timeLabel,
        location,
      };
    } else {
      bookingMeta = {
        id: editingBookingId || `session-${Date.now()}`,
        titles: [sessionName || t("workout_setup_title") || "Workout Session"],
        date: sessionDate,
        timeLabel,
        location,
      };
    }

    clearSetupDraft();
    editingBookingId = null;
    deps.startWorkoutSession(clientRoutines, bookingMeta);
  });
}

export function openWorkoutSetupModal(
  preselectedClientId = null,
  preselectedRoutineId = null,
  preselectedBookingId = null,
  isPlanning = false,
) {
  isPlanningModeActive = isPlanning;
  editingBookingId = preselectedBookingId || null;
  if (deps.switchView) {
    deps.switchView("workout-setup");
  }

  const participantsList = document.getElementById("setup-participants-assignment-list");
  if (!participantsList) return;
  participantsList.innerHTML = "";

  const searchInput = document.getElementById("setup-participant-search");
  if (searchInput) searchInput.value = "";

  const state = deps.getState();
  const { t, getClientDisplayNameHTML } = deps;

  const titleEl = document.getElementById("workout-setup-view-title");
  if (titleEl) {
    titleEl.textContent = isPlanning
      ? t("plan_program_title") || "Plan Upcoming Program"
      : t("workout_setup_title") || "Start Workout Session";
  }

  let targetBooking = null;
  if (preselectedBookingId && state.bookings) {
    targetBooking = state.bookings.find((b) => b.id === preselectedBookingId);
  }

  const draft = getSetupDraft();

  // Calculate default start time rounded up to next :00 or :30 mark, and end time (+1h)
  const now = new Date();
  const mins = now.getMinutes();
  const startDate = new Date(now);
  if (mins > 0 && mins <= 30) {
    startDate.setMinutes(30, 0, 0);
  } else if (mins > 30) {
    startDate.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    startDate.setMinutes(0, 0, 0);
  }
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const fmtTime = (d) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  const defaultDate = startDate.toISOString().split("T")[0];
  const defaultStartTime = fmtTime(startDate);
  const defaultEndTime = fmtTime(endDate);

  const nameInput = document.getElementById("setup-session-name");
  const dateInput = document.getElementById("setup-session-date");
  const startInput = document.getElementById("setup-start-time");
  const endInput = document.getElementById("setup-end-time");
  const locInput = document.getElementById("setup-location");

  if (nameInput)
    nameInput.value =
      draft?.sessionName ?? (targetBooking?.title || targetBooking?.titles?.[0] || "");
  if (dateInput) dateInput.value = draft?.date || targetBooking?.date || defaultDate;
  if (startInput) {
    if (draft?.startTime) {
      startInput.value = draft.startTime;
    } else if (targetBooking?.timeLabel) {
      const parts = targetBooking.timeLabel.split("-").map((s) => s.trim());
      startInput.value = parts[0] || defaultStartTime;
    } else {
      startInput.value = defaultStartTime;
    }
  }
  if (endInput) {
    if (draft?.endTime) {
      endInput.value = draft.endTime;
    } else if (targetBooking?.timeLabel) {
      const parts = targetBooking.timeLabel.split("-").map((s) => s.trim());
      endInput.value = parts[1] || defaultEndTime;
    } else {
      endInput.value = defaultEndTime;
    }
  }
  if (locInput) locInput.value = draft?.location ?? (targetBooking?.location || "");

  const clientsList = state?.clients || [];
  for (const client of [...clientsList].sort((a, b) => a.name.localeCompare(b.name))) {
    const row = document.createElement("div");
    row.className = "participant-setup-row";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "8px";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = client.id;
    cb.id = `setup-cb-${client.id}`;
    cb.style.width = "16px";
    cb.style.height = "16px";
    cb.style.cursor = "pointer";

    if (draft?.checkedClients) {
      cb.checked = draft.checkedClients.includes(client.id);
    } else if (targetBooking) {
      cb.checked = targetBooking.participants.includes(client.id);
    } else if (preselectedClientId === client.id) {
      cb.checked = true;
    } else if (!preselectedClientId && client.id !== "c3c7d2c4") {
      cb.checked = true;
    }

    const nameLabel = document.createElement("label");
    nameLabel.htmlFor = `setup-cb-${client.id}`;
    nameLabel.innerHTML = getClientDisplayNameHTML(client);
    nameLabel.style.fontWeight = "600";
    nameLabel.style.cursor = "pointer";
    nameLabel.style.fontSize = "13px";

    left.appendChild(cb);
    left.appendChild(nameLabel);

    const right = document.createElement("div");

    const select = document.createElement("select");
    select.className = "form-control select-routine-dropdown";
    select.style.padding = "4px 8px";
    select.style.fontSize = "12px";
    select.style.width = "160px";
    select.style.height = "30px";

    select.innerHTML = `<option value="" disabled>${t("select_exercise")}</option>`;
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "empty_plan";
    emptyOpt.textContent = t("custom_empty_plan") || "Custom / Empty Plan";
    select.appendChild(emptyOpt);

    for (const r of state.routines) {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      select.appendChild(opt);
    }

    // Restore selected routine from draft, target booking, or defaults
    if (draft?.clientRoutines?.[client.id]) {
      select.value = draft.clientRoutines[client.id];
    } else if (isPlanningModeActive) {
      select.value = "empty_plan";
    } else if (targetBooking?.participants.includes(client.id)) {
      select.value = targetBooking.routineId;
    } else if (preselectedRoutineId && preselectedClientId === client.id) {
      select.value = preselectedRoutineId;
    } else if (client.id === "c1a9f0e2") {
      select.value = "r10d5e6f";
    } else if (client.id === "c2b8e1d3") {
      select.value = "r11d5e6f";
    } else if (state.routines.length > 0) {
      select.value = state.routines[0].id;
    }

    right.appendChild(select);

    row.appendChild(left);
    row.appendChild(right);
    participantsList.appendChild(row);
  }
}
