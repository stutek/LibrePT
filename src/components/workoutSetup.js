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

      deps.startWorkoutSession(clientRoutines);
      dialog.close();
    });
  }
}

export function openWorkoutSetupModal(
  preselectedClientId = null,
  preselectedRoutineId = null,
  preselectedBookingId = null,
) {
  const dialog = document.getElementById("dialog-workout-setup");
  if (!dialog) return;

  const participantsList = document.getElementById("setup-participants-assignment-list");
  if (!participantsList) return;
  participantsList.innerHTML = "";

  const state = deps.getState();
  const { t, getClientDisplayNameHTML } = deps;

  let targetBooking = null;
  if (preselectedBookingId && state.bookings) {
    targetBooking = state.bookings.find((b) => b.id === preselectedBookingId);
  }

  for (const client of state.clients.sort((a, b) => a.name.localeCompare(b.name))) {
    const row = document.createElement("div");
    row.className = "participant-setup-row";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";
    row.style.gap = "10px";
    row.style.marginBottom = "12px";
    row.style.padding = "8px";
    row.style.background = "rgba(255,255,255,0.03)";
    row.style.borderRadius = "6px";
    row.style.border = "1px solid var(--border-color)";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "10px";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = client.id;
    cb.id = `setup-cb-${client.id}`;
    cb.style.width = "18px";
    cb.style.height = "18px";
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
    select.style.height = "32px";

    select.innerHTML = `<option value="" disabled>${t("select_exercise")}</option>`;
    for (const r of state.routines) {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      select.appendChild(opt);
    }

    // Attempt default selections
    if (targetBooking?.participants.includes(client.id)) {
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
