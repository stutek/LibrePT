// src/data/sessions.js — seed sessions; times are generated relative to "now" so the demo always looks live.

// The three venues this trainer runs sessions at. Referenced by every session so the
// session view can show a "date time location" context line (e.g. "2026-07-17 10:00 Trib gym base").
export const LOCATIONS = {
  GYM: "Trib gym base",
  PLAYGROUND: "playground outside",
  PARK: "city park",
};

export const DEFAULT_SESSIONS = (() => {
  const now = new Date();

  // 24-hour HH:MM (ISO-style), e.g. "14:00"
  const formatClock = (date) => `${String(date.getHours()).padStart(2, "0")}:00`;

  // Which coarse bucket a date falls in, compared at MIDNIGHT — "tomorrow" is a calendar fact, not
  // a count of elapsed hours. Computed locally rather than imported from domain/sessionRecord.js:
  // `data/` sits below `domain/` in the import layering, so reaching up for it
  // would invert the graph the Stage 1 gate enforces.
  const dayBucketFor = (date) => {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfThatDay = new Date(date);
    startOfThatDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((startOfThatDay - startOfToday) / 86400000);
    if (diffDays < 0) return "yesterday";
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    return "upcoming";
  };

  const hoursFromNow = (offset) => {
    const d = new Date(now);
    d.setHours(d.getHours() + offset, 0, 0, 0);
    return d;
  };

  /**
   * A session slot `startOffset`..`endOffset` hours from now, as the three fields that describe
   * when it happens.
   *
   * Anchored on the REAL current hour and allowed to cross midnight. It used to be anchored on
   * `Math.min(17, Math.max(3, now.getHours()))` — a clamp that kept the whole spread inside one
   * calendar day, at the cost of making the demo wrong outside 03:00-17:00: loaded at 22:00, every
   * "today" session had already happened and the dashboard opened on a wall of past sessions
   * counting down in negative hours. The point of this dataset is that something is live RIGHT NOW,
   * whenever a trainer opens it, so the bucket is derived from the resulting timestamp instead of
   * being asserted — a slot that lands after midnight is honestly "tomorrow".
   */
  const slot = (startOffset, endOffset) => {
    const start = hoursFromNow(startOffset);
    return {
      time: `${formatClock(start)} - ${formatClock(hoursFromNow(endOffset))}`,
      startDate: start.toISOString(),
      day: dayBucketFor(start),
    };
  };

  // The one real, absolute timestamp on a session (TODO §7.3 item 8) — `day` stays a coarse bucket
  // for the other systems that already key off it (overlap detection, temporal card styling), but
  // the continuous time-ordered dashboard axis sorts and positions purely on this. `offsetDays` is
  // relative to today at midnight; `hour` is local, matching the same hour baked into `time` above.
  const atHour = (offsetDays, hour) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(((Math.trunc(hour) % 24) + 24) % 24, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: "s00f2e3d",
      ...slot(-3, -2),
      title: "Early Bird Strength",
      location: LOCATIONS.GYM,
      participants: ["c4d6c3b5", "c6f4a597"],
      routineId: "r10d5e6f",
      maxCapacity: 4,
      completed: true,
    },
    {
      id: "s01f2e3d",
      ...slot(-1, +1),
      title: "Group Strength & Conditioning",
      location: LOCATIONS.GYM,
      participants: ["c1a9f0e2", "c2b8e1d3"],
      routineId: "r12d5e6f",
      maxCapacity: 7,
    },
    {
      id: "s07f2e3d",
      ...slot(-2, -1),
      title: "Strength & Longevity Focus",
      location: LOCATIONS.GYM,
      participants: ["c8b28799"],
      routineId: "r14d5e6f",
      maxCapacity: 1,
      completed: true,
    },
    // Deliberately OVERLAPS "Group Strength & Conditioning" above, in the same slot and venue: a
    // trainer running a group while one client works a separate rehab plan alongside it. That is
    // ordinary gym reality, and it is the case the clipboard is actually built for — overlapping
    // slots collapse into ONE clipboard (`buildSessionMeta` merges them, so `titles` and `ids` are
    // both lists), which is why nothing in the UI may say "the session" in the singular.
    // Without a merged pair in the seed data, that whole path went unexercised by the demo.
    {
      id: "s09f2e3d",
      ...slot(-1, +1),
      title: "Return-to-Play Rehab",
      location: LOCATIONS.GYM,
      participants: ["c3c7d2c4"],
      routineId: "r13d5e6f",
      maxCapacity: 1,
    },
    {
      id: "s02f2e3d",
      ...slot(+1, +2),
      title: "1:1 Personal Training",
      location: LOCATIONS.GYM,
      participants: ["c5e5b4a6"],
      routineId: "r11d5e6f",
      maxCapacity: 1,
    },
    {
      id: "s03f2e3d",
      ...slot(+2, +3),
      title: "Express Core HIIT",
      location: LOCATIONS.PLAYGROUND,
      participants: ["c3c7d2c4"],
      routineId: "r11d5e6f",
      maxCapacity: 2,
    },
    {
      id: "s08f2e3d",
      ...slot(+3, +4),
      title: "Mobility Flow",
      location: LOCATIONS.PARK,
      participants: ["c7a39688"],
      routineId: "r13d5e6f",
      maxCapacity: 2,
    },
    {
      id: "s09f2e3d",
      ...slot(+4, +5),
      title: "Open Slot (Drop-in)",
      location: LOCATIONS.GYM,
      participants: [],
      routineId: "r11d5e6f",
      maxCapacity: 3,
    },
    {
      id: "s04f2e3d",
      time: "09:00 - 10:00",
      startDate: atHour(1, 9),
      title: "Morning Conditioning",
      location: LOCATIONS.PARK,
      participants: ["c1a9f0e2"],
      routineId: "r12d5e6f",
      maxCapacity: 3,
      day: "tomorrow",
    },
    {
      id: "s05f2e3d",
      time: "10:30 - 11:30",
      startDate: atHour(1, 10),
      title: "Upper Body Strength",
      location: LOCATIONS.GYM,
      participants: ["c2b8e1d3"],
      routineId: "r10d5e6f",
      maxCapacity: 4,
      day: "tomorrow",
    },
    {
      id: "s06f2e3d",
      time: "11:30 - 12:30",
      startDate: atHour(1, 11),
      title: "Lunch Express HIIT",
      location: LOCATIONS.PLAYGROUND,
      participants: ["c3c7d2c4"],
      routineId: "r12d5e6f",
      maxCapacity: 3,
      day: "tomorrow",
    },
    {
      id: "s10f2e3d",
      time: "17:30 - 18:30",
      startDate: atHour(1, 17),
      title: "Post-Work Cardio",
      location: LOCATIONS.PARK,
      participants: ["c4d6c3b5"],
      routineId: "r11d5e6f",
      maxCapacity: 2,
      day: "tomorrow",
    },
    {
      id: "s11f2e3d",
      time: "14:00 - 15:00",
      startDate: atHour(1, 14),
      title: "Strength & Longevity Focus",
      location: LOCATIONS.GYM,
      participants: ["c8b28799"],
      routineId: "r14d5e6f",
      maxCapacity: 1,
      day: "tomorrow",
    },
    {
      id: "s12f2e3d",
      time: "09:00 - 10:30",
      startDate: atHour(-1, 9),
      title: "Core & Stability",
      location: LOCATIONS.GYM,
      participants: ["c1a9f0e2"],
      routineId: "r10d5e6f",
      maxCapacity: 2,
      day: "yesterday",
    },
    {
      id: "s13f2e3d",
      time: "16:00 - 17:00",
      startDate: atHour(-1, 16),
      title: "Mobility & Recovery",
      location: LOCATIONS.PARK,
      participants: ["c2b8e1d3"],
      routineId: "r11d5e6f",
      maxCapacity: 3,
      day: "yesterday",
    },
    {
      id: "s14f2e3d",
      time: "15:00 - 16:00",
      startDate: atHour(-1, 15),
      title: "Strength & Longevity Focus",
      location: LOCATIONS.GYM,
      participants: ["c8b28799"],
      routineId: "r14d5e6f",
      maxCapacity: 1,
      day: "yesterday",
      completed: true,
    },
    {
      id: "s15f2e3d",
      time: "08:00 - 09:30",
      // "upcoming" is a single bucket today but a real date on the continuous axis — spread these
      // out rather than stacking them on the same +2-day slot the old 4-bucket model collapsed
      // them to, so the demo shows a genuinely continuous future, not two coincident cards.
      startDate: atHour(2, 8),
      title: "Lower Body Strength",
      location: LOCATIONS.GYM,
      participants: ["c3c7d2c4"],
      routineId: "r11d5e6f",
      maxCapacity: 2,
      day: "upcoming",
    },
    {
      id: "s16f2e3d",
      time: "10:00 - 11:00",
      startDate: atHour(4, 10),
      title: "HIIT Conditioning",
      location: LOCATIONS.PLAYGROUND,
      participants: ["c1a9f0e2", "c2b8e1d3"],
      routineId: "r10d5e6f",
      maxCapacity: 4,
      day: "upcoming",
    },
  ];
})();
