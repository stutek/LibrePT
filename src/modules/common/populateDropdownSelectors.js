// Populates the two <select>/<datalist> pickers shared across otherwise-unrelated surfaces: the
// routine dropdown on the workout-setup modal and the exercise datalist on the in-session
// "add exercise" dialog. Neither belongs to routineFormsController or activeSessionController
// specifically — both just need "the current routines/exercises, alphabetised" kept in sync
// whenever state changes (a new routine/exercise saved, a demo reset) — so this lives as a small
// shared utility rather than being owned by one form controller and imported sideways by the other.
export function populateDropdownSelectors({ state, t }) {
  const routineSelect = document.getElementById("setup-select-routine");
  if (routineSelect && state.routines) {
    routineSelect.innerHTML = `<option value="" disabled selected>${t("select_exercise")}</option>`;
    for (const r of state.routines.slice().sort((a, b) => a.name.localeCompare(b.name))) {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      routineSelect.appendChild(opt);
    }
  }

  const sessionExList = document.getElementById("session-ex-datalist");
  if (sessionExList && state.exercises) {
    sessionExList.innerHTML = "";
    for (const e of state.exercises.slice().sort((a, b) => a.name.localeCompare(b.name))) {
      const opt = document.createElement("option");
      opt.value = e.name;
      opt.label = e.category;
      sessionExList.appendChild(opt);
    }
  }
}
