// src/data/sessions.js — seed bookings; times are generated relative to "now" so the demo always looks live.
export const DEFAULT_SESSIONS = (() => {
  const now = new Date();
  const currentHour = Math.min(18, Math.max(3, now.getHours()));
  
  // 24-hour HH:MM (ISO-style), e.g. "14:00"
  const formatHour = (h) => {
    const rawH = (h + 24) % 24;
    return `${rawH.toString().padStart(2, '0')}:00`;
  };

  return [
    {
      id: 's00f2e3d',
      time: `${formatHour(currentHour - 3)} - ${formatHour(currentHour - 2)}`,
      title: 'Early Bird Strength',
      participants: ['c4d6c3b5', 'c6f4a597'],
      routineId: 'r10d5e6f',
      maxCapacity: 4,
      day: 'today',
      completed: true
    },
    {
      id: 's01f2e3d',
      time: `${formatHour(currentHour - 1)} - ${formatHour(currentHour + 1)}`,
      title: 'Group Strength & Conditioning',
      participants: ['c1a9f0e2', 'c2b8e1d3'],
      routineId: 'r12d5e6f',
      maxCapacity: 7,
      day: 'today'
    },
    {
      id: 's07f2e3d',
      time: `${formatHour(currentHour - 2)} - ${formatHour(currentHour - 1)}`,
      title: 'Strength & Longevity Focus',
      participants: ['c8b28799'],
      routineId: 'r14d5e6f',
      maxCapacity: 1,
      day: 'today',
      completed: true
    },
    {
      id: 's02f2e3d',
      time: `${formatHour(currentHour)} - ${formatHour(currentHour + 2)}`,
      title: '1:1 Personal Training',
      participants: ['c5e5b4a6'],
      routineId: 'r11d5e6f',
      maxCapacity: 1,
      day: 'today'
    },
    {
      id: 's03f2e3d',
      time: `${formatHour(currentHour + 2)} - ${formatHour(currentHour + 3)}`,
      title: 'Express Core HIIT',
      participants: ['c3c7d2c4'],
      routineId: 'r11d5e6f',
      maxCapacity: 2,
      day: 'today'
    },
    {
      id: 's08f2e3d',
      time: `${formatHour(currentHour + 3)} - ${formatHour(currentHour + 4)}`,
      title: 'Mobility Flow',
      participants: ['c7a39688'],
      routineId: 'r13d5e6f',
      maxCapacity: 2,
      day: 'today'
    },
    {
      id: 's09f2e3d',
      time: `${formatHour(currentHour + 4)} - ${formatHour(currentHour + 5)}`,
      title: 'Open Slot (Drop-in)',
      participants: [],
      routineId: 'r11d5e6f',
      maxCapacity: 3,
      day: 'today'
    },
    {
      id: 's04f2e3d',
      time: '09:00 - 10:00',
      title: 'Morning Conditioning',
      participants: ['c1a9f0e2'],
      routineId: 'r12d5e6f',
      maxCapacity: 3,
      day: 'tomorrow'
    },
    {
      id: 's05f2e3d',
      time: '10:30 - 11:30',
      title: 'Upper Body Strength',
      participants: ['c2b8e1d3'],
      routineId: 'r10d5e6f',
      maxCapacity: 4,
      day: 'tomorrow'
    },
    {
      id: 's06f2e3d',
      time: '11:30 - 12:30',
      title: 'Lunch Express HIIT',
      participants: ['c3c7d2c4'],
      routineId: 'r12d5e6f',
      maxCapacity: 3,
      day: 'tomorrow'
    },
    {
      id: 's10f2e3d',
      time: '17:30 - 18:30',
      title: 'Post-Work Cardio',
      participants: ['c4d6c3b5'],
      routineId: 'r11d5e6f',
      maxCapacity: 2,
      day: 'tomorrow'
    },
    {
      id: 's11f2e3d',
      time: '14:00 - 15:00',
      title: 'Strength & Longevity Focus',
      participants: ['c8b28799'],
      routineId: 'r14d5e6f',
      maxCapacity: 1,
      day: 'tomorrow'
    },
    {
      id: 's12f2e3d',
      time: '09:00 - 10:30',
      title: 'Core & Stability',
      participants: ['c1a9f0e2'],
      routineId: 'r10d5e6f',
      maxCapacity: 2,
      day: 'yesterday'
    },
    {
      id: 's13f2e3d',
      time: '16:00 - 17:00',
      title: 'Mobility & Recovery',
      participants: ['c2b8e1d3'],
      routineId: 'r11d5e6f',
      maxCapacity: 3,
      day: 'yesterday'
    },
    {
      id: 's14f2e3d',
      time: '15:00 - 16:00',
      title: 'Strength & Longevity Focus',
      participants: ['c8b28799'],
      routineId: 'r14d5e6f',
      maxCapacity: 1,
      day: 'yesterday',
      completed: true
    },
    {
      id: 's15f2e3d',
      time: '08:00 - 09:30',
      title: 'Lower Body Strength',
      participants: ['c3c7d2c4'],
      routineId: 'r11d5e6f',
      maxCapacity: 2,
      day: 'upcoming'
    },
    {
      id: 's16f2e3d',
      time: '10:00 - 11:00',
      title: 'HIIT Conditioning',
      participants: ['c1a9f0e2', 'c2b8e1d3'],
      routineId: 'r10d5e6f',
      maxCapacity: 4,
      day: 'upcoming'
    }
  ];
})();
