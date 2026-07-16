// src/data/clients.js — seed clients (name, goals, injuries/notes).
export const DEFAULT_CLIENTS = [
  {
    id: 'client-jane-doe',
    name: 'Jane Doe',
    avatar: 'JD',
    joinedDate: '2026-03-15',
    goals: 'Strength gain, building shoulder mobility, and improving squat form.',
    weightHistory: [
      { date: '2026-03-15', value: 66.2 },
      { date: '2026-04-15', value: 65.5 },
      { date: '2026-05-15', value: 64.9 },
      { date: '2026-06-15', value: 64.8 },
      { date: '2026-07-01', value: 64.6 }
    ],
    notes: 'Slight left shoulder tightness during overhead movements. Keep warmups thorough. Enjoys tracking RPE (Rate of Perceived Exertion).',
    hasInjury: true,
    injury: 'Slight left shoulder tightness during overhead movements',
    active: true
  },
  {
    id: 'client-john-smith',
    name: 'John Smith',
    avatar: 'JS',
    joinedDate: '2026-05-01',
    goals: 'Fat loss, cardiovascular endurance, and recovering functional knee strength.',
    weightHistory: [
      { date: '2026-05-01', value: 89.4 },
      { date: '2026-06-01', value: 87.2 },
      { date: '2026-07-01', value: 85.8 }
    ],
    notes: 'Knee reconstruction surgery in 2024. Keep back squats at moderate load and monitor depth. Avoid high-impact jumping.',
    hasInjury: true,
    injury: 'Knee reconstruction surgery in 2024',
    active: true
  },
  {
    id: 'client-sarah-jenkins',
    name: 'Sarah Jenkins',
    avatar: 'SJ',
    joinedDate: '2026-06-10',
    goals: 'General conditioning, consistency, and core activation.',
    weightHistory: [
      { date: '2026-06-10', value: 71.0 },
      { date: '2026-07-05', value: 70.3 }
    ],
    notes: 'Prefers high-intensity interval formats. Enjoys kettlebell workouts. Heart rate spikes quickly; monitor recovery times.',
    hasInjury: false,
    injury: '',
    active: true
  },
  {
    id: 'client-mike-chen',
    name: 'Mike Chen',
    avatar: 'MC',
    joinedDate: '2026-04-02',
    goals: 'Hypertrophy, upper body definition, and consistent training frequency.',
    weightHistory: [
      { date: '2026-04-02', value: 78.5 },
      { date: '2026-05-02', value: 79.1 },
      { date: '2026-06-02', value: 79.8 }
    ],
    notes: 'No current injuries. Very consistent with sleep and nutrition tracking.',
    hasInjury: false,
    injury: '',
    active: true
  },
  {
    id: 'client-priya-patel',
    name: 'Priya Patel',
    avatar: 'PP',
    joinedDate: '2026-02-18',
    goals: 'Marathon prep, aerobic base building, and injury-free mileage progression.',
    weightHistory: [
      { date: '2026-02-18', value: 58.3 },
      { date: '2026-04-18', value: 57.9 },
      { date: '2026-06-18', value: 57.6 }
    ],
    notes: 'Mild lower back stiffness after long runs. Prioritize core stability work.',
    hasInjury: true,
    injury: 'Mild lower back stiffness after long runs',
    active: true
  },
  {
    id: 'client-tom-walker',
    name: 'Tom Walker',
    avatar: 'TW',
    joinedDate: '2026-01-12',
    goals: 'General strength maintenance and mobility as a masters athlete.',
    weightHistory: [
      { date: '2026-01-12', value: 92.0 },
      { date: '2026-03-12', value: 90.4 },
      { date: '2026-05-12', value: 89.6 }
    ],
    notes: 'No injuries reported. Prefers morning sessions and steady progression.',
    hasInjury: false,
    injury: '',
    active: true
  },
  {
    id: 'client-aisha-khan',
    name: 'Aisha Khan',
    avatar: 'AK',
    joinedDate: '2026-05-22',
    goals: 'Postpartum strength rebuild and core recovery.',
    weightHistory: [
      { date: '2026-05-22', value: 63.4 },
      { date: '2026-06-22', value: 62.8 }
    ],
    notes: 'Cleared for training by physician. Avoid heavy overhead loading until week 12.',
    hasInjury: true,
    injury: 'Postpartum recovery — avoid heavy overhead loading until week 12',
    active: true
  }
];
