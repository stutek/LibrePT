// src/data/sessions.js — seed bookings; times are generated relative to "now" so the demo always looks live.
export const DEFAULT_SESSIONS = (() => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // 24-hour HH:MM (ISO-style), e.g. "14:00"
  const formatHour = (h) => {
    const rawH = (h + 24) % 24;
    return `${rawH.toString().padStart(2, '0')}:00`;
  };

  return [
    {
      id: 'b-today-done',
      time: `${formatHour(currentHour - 3)} - ${formatHour(currentHour - 2)}`,
      title: 'Early Bird Strength',
      participants: ['client-mike-chen', 'client-tom-walker'],
      routineId: 'routine-upper-a',
      maxCapacity: 4,
      day: 'today',
      completed: true
    },
    {
      id: 'b-1',
      time: `${formatHour(currentHour - 1)} - ${formatHour(currentHour + 1)}`,
      title: 'Group Strength & Conditioning',
      participants: ['client-jane-doe', 'client-john-smith', 'client-mike-chen', 'client-priya-patel', 'client-tom-walker', 'client-aisha-khan', 'client-sarah-jenkins'],
      routineId: 'routine-upper-a',
      maxCapacity: 7,
      day: 'today'
    },
    {
      id: 'b-2',
      time: `${formatHour(currentHour)} - ${formatHour(currentHour + 2)}`,
      title: '1:1 Personal Training',
      participants: ['client-sarah-jenkins'],
      routineId: 'routine-legs-core',
      maxCapacity: 1,
      day: 'today'
    },
    {
      id: 'b-3',
      time: `${formatHour(currentHour + 2)} - ${formatHour(currentHour + 3)}`,
      title: 'Express Core HIIT',
      participants: ['client-sarah-jenkins'],
      routineId: '',
      maxCapacity: 2,
      day: 'today'
    },
    {
      id: 'b-3-2',
      time: `${formatHour(currentHour + 3)} - ${formatHour(currentHour + 4)}`,
      title: 'Mobility Flow',
      participants: ['client-jane-doe'],
      routineId: 'routine-triple-combo',
      maxCapacity: 2,
      day: 'today'
    },
    {
      id: 'b-today-open',
      time: `${formatHour(currentHour + 4)} - ${formatHour(currentHour + 5)}`,
      title: 'Open Slot (Drop-in)',
      participants: [],
      routineId: 'routine-legs-core',
      maxCapacity: 3,
      day: 'today'
    },
    {
      id: 'b-4',
      time: '09:00 - 10:00',
      title: 'Morning Conditioning',
      participants: ['client-jane-doe'],
      routineId: '',
      maxCapacity: 3,
      day: 'tomorrow'
    },
    {
      id: 'b-5',
      time: '10:30 - 11:30',
      title: 'Upper Body Strength',
      participants: ['client-john-smith'],
      routineId: 'routine-upper-a',
      maxCapacity: 4,
      day: 'tomorrow'
    },
    {
      id: 'b-6',
      time: '11:30 - 12:30',
      title: 'Lunch Express HIIT',
      participants: ['client-sarah-jenkins'],
      routineId: '',
      maxCapacity: 3,
      day: 'tomorrow'
    },
    {
      id: 'b-7',
      time: '17:30 - 18:30',
      title: 'Post-Work Cardio',
      participants: ['client-john-smith'],
      routineId: 'routine-legs-core',
      maxCapacity: 2,
      day: 'tomorrow'
    },
    {
      id: 'b-yesterday-1',
      time: '09:00 - 10:30',
      title: 'Core & Stability',
      participants: ['client-jane-doe'],
      routineId: 'routine-upper-a',
      maxCapacity: 2,
      day: 'yesterday'
    },
    {
      id: 'b-yesterday-2',
      time: '16:00 - 17:00',
      title: 'Mobility & Recovery',
      participants: ['client-john-smith'],
      routineId: 'routine-legs-core',
      maxCapacity: 3,
      day: 'yesterday'
    },
    {
      id: 'b-upcoming-1',
      time: '08:00 - 09:30',
      title: 'Lower Body Strength',
      participants: ['client-sarah-jenkins'],
      routineId: 'routine-legs-core',
      maxCapacity: 2,
      day: 'upcoming'
    },
    {
      id: 'b-upcoming-2',
      time: '10:00 - 11:00',
      title: 'HIIT Conditioning',
      participants: ['client-jane-doe', 'client-john-smith'],
      routineId: 'routine-upper-a',
      maxCapacity: 4,
      day: 'upcoming'
    }
  ];
})();
