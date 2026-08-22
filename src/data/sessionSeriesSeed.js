// src/data/sessionSeriesSeed.js — the demo's one REPEATING session (TODO §35.3a).
//
// Single responsibility: seed data for a series, kept out of sessions.js because that file is a list
// of individual evenings and this is a rule that produces them.
//
// One series, not three: the point it has to make on a demo board is that a repeating slot exists,
// is edited in one place, and still shows up on every evening it owes. A second rule would only add
// cards to scroll past.
//
// Anchored to "today" like every other seeded time, so the demo always looks live — and started a
// week back rather than today, so the board shows evenings already behind it as well as ahead: a
// trainer's real week has both, and "moving the next one only" means nothing on a rule with no past.
export const DEFAULT_SESSION_SERIES = (() => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const month = String(weekAgo.getMonth() + 1).padStart(2, "0");
  const day = String(weekAgo.getDate()).padStart(2, "0");

  return [
    {
      id: "ser01f2e3",
      title: "Tuesday & Thursday Strength",
      startDate: `${weekAgo.getFullYear()}-${month}-${day}`,
      // JavaScript's own numbering, the same `getDay()` returns: 2 is Tuesday, 4 is Thursday.
      weekdays: [2, 4],
      time: "18:00 - 19:00",
      location: "Trib gym base",
      participants: ["c1a9f0e2", "c2b8e1d3"],
      routineId: "r12d5e6f",
      maxCapacity: 6,
    },
  ];
})();
