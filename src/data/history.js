// src/data/history.js — seed logged session history (per-client past workouts).
export const DEFAULT_HISTORY = [
  {
    id: 'log-1',
    clientId: 'client-jane-doe',
    clientName: 'Jane Doe',
    routineName: 'Upper Body A',
    date: '2026-07-06T10:15:00.000Z',
    duration: 3420,
    exercises: [
      {
        id: 'ex-bench-barbell',
        name: 'Barbell Bench Press',
        sets: [
          { reps: 6, weight: 60, completed: true, note: 'RPE 8' },
          { reps: 6, weight: 60, completed: true, note: 'RPE 8.5' },
          { reps: 6, weight: 60, completed: true, note: 'RPE 9' },
          { reps: 5, weight: 60, completed: true, note: 'Failed 6th rep' }
        ]
      },
      {
        id: 'ex-barbell-row',
        name: 'Barbell Row',
        sets: [
          { reps: 8, weight: 50, completed: true },
          { reps: 8, weight: 50, completed: true },
          { reps: 8, weight: 50, completed: true },
          { reps: 8, weight: 50, completed: true, note: 'Strict form' }
        ]
      }
    ],
    feedback: [
      {
        id: 'u-1',
        clientId: 'client-jane-doe',
        exerciseName: 'Barbell Bench Press',
        tag: 'Too Easy - Increase Load',
        note: 'Completed all 4 sets with high speed. Recommend adding 2.5kg next session.'
      }
    ]
  },
  {
    id: 'log-jane-group-demo',
    clientId: 'client-jane-doe',
    clientName: 'Jane Doe',
    routineName: 'Upper Body A',
    date: '2026-07-10T09:00:00.000Z',
    duration: 3540,
    exercises: [
      {
        id: 'ex-bench-barbell',
        name: 'Barbell Bench Press',
        sets: [
          { reps: 5, weight: 60, completed: true, note: 'RPE 7' },
          { reps: 5, weight: 60, completed: true, note: 'RPE 8' },
          { reps: 5, weight: 60, completed: true, note: 'RPE 8.5' },
          { reps: 4, weight: 60, completed: true, note: 'RPE 9, last rep grind' }
        ]
      },
      {
        id: 'ex-barbell-row',
        name: 'Barbell Row',
        sets: [
          { reps: 8, weight: 52.5, completed: true },
          { reps: 8, weight: 52.5, completed: true },
          { reps: 7, weight: 52.5, completed: true, note: 'Strict, paused' }
        ]
      },
      {
        id: 'ex-shoulder-db',
        name: 'Dumbbell Shoulder Press',
        sets: [
          { reps: 10, weight: 16, completed: true },
          { reps: 9, weight: 16, completed: true },
          { reps: 8, weight: 16, completed: true, note: 'Left side fatigued' }
        ]
      }
    ],
    feedback: [
      {
        id: 'u-demo-1',
        clientId: 'client-jane-doe',
        exerciseName: 'Barbell Bench Press',
        tag: 'Too Easy - Increase Load',
        note: 'Pushed the weight easily. Ready for 65kg next week.'
      },
      {
        id: 'u-demo-2',
        clientId: 'client-jane-doe',
        exerciseName: 'Barbell Row',
        tag: 'Too Hard - Reduce Load',
        note: 'Felt form breaking on last 2 reps. Keep weight at 50kg.'
      },
      {
        id: 'u-demo-3',
        clientId: 'client-jane-doe',
        exerciseName: 'Dumbbell Shoulder Press',
        tag: 'Form Break - Watch Position',
        note: 'Shoulders shrugging too early. Keep elbows in.'
      }
    ]
  },
  {
    id: 'log-john-group-demo',
    clientId: 'client-john-smith',
    clientName: 'John Smith',
    routineName: 'Upper Body A',
    date: '2026-07-10T09:00:00.000Z',
    duration: 3720,
    exercises: [
      {
        id: 'ex-bench-barbell',
        name: 'Barbell Bench Press',
        sets: [
          { reps: 5, weight: 67.5, completed: true, note: 'RPE 8' },
          { reps: 5, weight: 67.5, completed: true, note: 'RPE 8.5' },
          { reps: 5, weight: 67.5, completed: true, note: 'RPE 9' }
        ]
      },
      {
        id: 'ex-barbell-row',
        name: 'Barbell Row',
        sets: [
          { reps: 8, weight: 57.5, completed: true },
          { reps: 8, weight: 57.5, completed: true },
          { reps: 8, weight: 57.5, completed: true },
          { reps: 7, weight: 57.5, completed: true }
        ]
      },
      {
        id: 'ex-shoulder-db',
        name: 'Dumbbell Shoulder Press',
        sets: [
          { reps: 10, weight: 18, completed: true },
          { reps: 9, weight: 18, completed: true, note: 'Left arm weaker on last set' }
        ]
      }
    ],
    feedback: [
      {
        id: 'u-demo-4',
        clientId: 'client-john-smith',
        exerciseName: 'Barbell Bench Press',
        tag: 'Joint Pain / Discomfort',
        note: 'Felt slight pinching in right shoulder. Ceased after 2 sets.'
      },
      {
        id: 'u-demo-5',
        clientId: 'client-john-smith',
        exerciseName: 'Barbell Row',
        tag: 'Completed reps easily',
        note: 'Great mind-muscle connection. Strong back activation.'
      }
    ]
  }
];
