// src/data/index.js — barrel for the seed/demo data. app.js imports the defaults from here;
// each entity lives in its own file (exercises, clients, routines, history, plan updates,
// sessions). Entities reference each other only by string id, so the files stay independent.

export { DEFAULT_EXERCISES } from "./exercises.js";
export { DEFAULT_CLIENTS } from "./clients.js";
export { DEFAULT_ROUTINES } from "./routines.js";
export { DEFAULT_HISTORY } from "./history.js";
export { DEFAULT_PLAN_UPDATES } from "./planUpdates.js";
export { DEFAULT_SESSIONS } from "./sessions.js";
export { DEFAULT_MESSAGES } from "./messages.js";
