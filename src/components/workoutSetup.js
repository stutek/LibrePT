// components/workoutSetup.js
// Manages the workout setup modal dialog (#dialog-workout-setup), allowing
// selection of participants and assigning routine plans before launching the clipboard.
//
// deps: {
//   getState(),
//   t,
//   getClientDisplayNameHTML,
//   startWorkoutSession(clientRoutines)
// }

let deps = null;
let isPlanningModeActive = false;

export function initWorkoutSetup(d) {
  deps = d;
}

export function setupWorkoutSetup() {
  const dialog = document.getElementById("dialog-workout-setup");
  if (!dialog) return;

  const form = document.getElementById("form-workout-setup");
  const cancelBtn = dialog.querySelector(".modal-cancel");
  const closeBtn = dialog.querySelector(".modal-close-btn");

  const closeModal = () => dialog.close();
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  if (form) {
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
          id: `plan-${Date.now()}`,
          isPlanning: true,
          titles: [sessionName || t("planned_program") || "Planned Program"],
          date: sessionDate,
          timeLabel,
          location,
        };
      } else {
        bookingMeta = {
          id: `session-${Date.now()}`,
          titles: [sessionName || t("workout_setup_title") || "Workout Session"],
          date: sessionDate,
          timeLabel,
          location,
        };
      }

      deps.startWorkoutSession(clientRoutines, bookingMeta);
      dialog.close();
    });
  }
}

export function openWorkoutSetupModal(
  preselectedClientId = null,
  preselectedRoutineId = null,
  preselectedBookingId = null,
  isPlanning = false,
) {
  isPlanningModeActive = isPlanning;
  const dialog = document.getElementById("dialog-workout-setup");
  if (!dialog) return;

  const participantsList = document.getElementById("setup-participants-assignment-list");
  if (!participantsList) return;
  participantsList.innerHTML = "";

  const state = deps.getState();
  const { t, getClientDisplayNameHTML } = deps;

  const titleEl = dialog.querySelector(".modal-header h3");
  if (titleEl) {
    titleEl.textContent = isPlanning
      ? t("plan_program_title") || "Plan Upcoming Program"
      : t("workout_setup_title") || "Start Workout Session";
  }

  let targetBooking = null;
  if (preselectedBookingId && state.bookings) {
    targetBooking = state.bookings.find((b) => b.id === preselectedBookingId);
  }

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

  if (nameInput) nameInput.value = targetBooking?.title || targetBooking?.titles?.[0] || "";
  if (dateInput) dateInput.value = targetBooking?.date || defaultDate;
  if (startInput) {
    if (targetBooking?.timeLabel) {
      const parts = targetBooking.timeLabel.split("-").map((s) => s.trim());
      startInput.value = parts[0] || defaultStartTime;
    } else {
      startInput.value = defaultStartTime;
    }
  }
  if (endInput) {
    if (targetBooking?.timeLabel) {
      const parts = targetBooking.timeLabel.split("-").map((s) => s.trim());
      endInput.value = parts[1] || defaultEndTime;
    } else {
      endInput.value = defaultEndTime;
    }
  }
  // Leave empty by default so focusing/clicking shows all datalist selections
  if (locInput) locInput.value = targetBooking?.location || "";

  for (const client of state.clients.sort((a, b) => a.name.localeCompare(b.name))) {
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

    if (targetBooking) {
      cb.checked = targetBooking.participants.includes(client.id);
    } else if (preselectedClientId === client.id) {
      cb.checked = true;
    } else if (!preselectedClientId && client.id !== "c3c7d2c4") {
      // Default to checking first couple clients if none specified (like Jane and John)
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

    // Attempt default selections
    if (isPlanningModeActive) {
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

  dialog.showModal();
}
