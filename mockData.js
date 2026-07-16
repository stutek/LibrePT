// mockData.js - Default exercises, clients, and history for LibrePT

export const DEFAULT_EXERCISES = [
  // Chest
  { id: 'ex-bench-barbell', name: 'Barbell Bench Press', category: 'Chest', instructions: 'Lie flat on a bench, grip the barbell slightly wider than shoulder width, lower it to mid-chest, and push up.' },
  { id: 'ex-bench-dumbbell', name: 'Dumbbell Bench Press', category: 'Chest', instructions: 'Lie on a flat bench with a dumbbell in each hand, lower the dumbbells to chest level, then press them up.' },
  { id: 'ex-incline-db', name: 'Incline Dumbbell Press', category: 'Chest', instructions: 'Set bench to a 30-45 degree incline. Press dumbbells upwards from chest height.' },
  { id: 'ex-cable-fly', name: 'Cable Chest Fly', category: 'Chest', instructions: 'Position pulleys at shoulder height, grab handles, and bring hands together in a wide hugging motion.' },
  { id: 'ex-pushups', name: 'Push-Ups', category: 'Chest', instructions: 'Keep body in a straight plank, lower chest to floor, and push back up.' },

  // Back
  { id: 'ex-pullups', name: 'Pull-Ups', category: 'Back', instructions: 'Hang from a bar with palms facing away. Pull chest up to the bar.' },
  { id: 'ex-lat-pulldown', name: 'Lat Pulldown', category: 'Back', instructions: 'Sit at pulldown station, pull bar down to upper chest, engaging the lats.' },
  { id: 'ex-barbell-row', name: 'Barbell Row', category: 'Back', instructions: 'Hinge at hips, pull barbell towards lower abdomen keeping back straight.' },
  { id: 'ex-dumbbell-row', name: 'Single-Arm Dumbbell Row', category: 'Back', instructions: 'Place one knee/hand on bench, pull dumbbell to hip with other arm.' },
  { id: 'ex-facepull', name: 'Face Pulls', category: 'Back', instructions: 'Pull rope attachment from high pulley towards forehead, pulling elbows wide.' },

  // Legs
  { id: 'ex-barbell-squat', name: 'Barbell Back Squat', category: 'Legs', instructions: 'Rest bar on upper back, squat down until thighs are parallel to floor, push back up.' },
  { id: 'ex-romanian-deadlift', name: 'Romanian Deadlift (RDL)', category: 'Legs', instructions: 'Hinge at hips with micro-bend in knees, lower weight down shins, squeeze glutes to stand.' },
  { id: 'ex-leg-press', name: 'Leg Press', category: 'Legs', instructions: 'Sit in machine, unlock platform, lower knees toward chest, press back up without locking knees.' },
  { id: 'ex-goblet-squat', name: 'Dumbbell Goblet Squat', category: 'Legs', instructions: 'Hold a single dumbbell vertically at chest height, squat deep.' },
  { id: 'ex-leg-extension', name: 'Leg Extension', category: 'Legs', instructions: 'Sit in machine, extend legs fully, pause at top, and lower slowly.' },
  { id: 'ex-lying-leg-curl', name: 'Lying Leg Curl', category: 'Legs', instructions: 'Lie face down, curl roller pad towards glutes, control return.' },
  { id: 'ex-calf-raise', name: 'Standing Calf Raise', category: 'Legs', instructions: 'Raise heels as high as possible on a block, stretch down deep.' },

  // Shoulders
  { id: 'ex-overhead-barbell', name: 'Barbell Overhead Press', category: 'Shoulders', instructions: 'Press barbell from shoulder height overhead to full lockout, head through at top.' },
  { id: 'ex-lateral-raise', name: 'Dumbbell Lateral Raise', category: 'Shoulders', instructions: 'Stand tall, raise dumbbells out to sides until arms are parallel to the floor.' },
  { id: 'ex-shoulder-db', name: 'Dumbbell Shoulder Press', category: 'Shoulders', instructions: 'Sit or stand, press dumbbells from ear level overhead.' },

  // Arms
  { id: 'ex-bicep-db-curl', name: 'Dumbbell Bicep Curl', category: 'Arms', instructions: 'Rotate palms up as you curl dumbbells towards shoulders, keeping elbows locked at sides.' },
  { id: 'ex-hammer-curl', name: 'Dumbbell Hammer Curl', category: 'Arms', instructions: 'Curl dumbbells with neutral grip (palms facing each other).' },
  { id: 'ex-tricep-pushdown', name: 'Cable Tricep Pushdown', category: 'Arms', instructions: 'Push rope or bar attachment down by extending elbows, keeping upper arms still.' },
  { id: 'ex-skull-crusher', name: 'EZ-Bar Skull Crusher', category: 'Arms', instructions: 'Lie on bench, lower bar to forehead by bending elbows, then extend.' },

  // Core
  { id: 'ex-plank', name: 'Plank', category: 'Core', instructions: 'Hold straight body line resting on forearms and toes. Squeeze core and glutes.' },
  { id: 'ex-hanging-raise', name: 'Hanging Knee Raise', category: 'Core', instructions: 'Hang from pull-up bar, raise knees to chest height slowly without swinging.' },
  { id: 'ex-ab-mat-situp', name: 'Abmat Sit-up', category: 'Core', instructions: 'Sit with soles of feet together, touch floor behind head, sit up and touch toes.' },
  { id: 'ex-russian-twist', name: 'Russian Twist', category: 'Core', instructions: 'Sit, lean back slightly, lift feet, rotate torso tapping hands side-to-side.' },
  { id: 'ex-walking-lunges', name: 'Walking Lunges', category: 'Legs', instructions: 'Step forward lunging down, alternating legs.' }
];

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

export const DEFAULT_ROUTINES = [
  {
    id: 'routine-upper-a',
    name: 'Upper Body A',
    description: 'Strength-focused upper body session prioritizing compound presses and rows.',
    exercises: [
      { id: 'ex-bench-barbell', sets: 4, reps: 6, rest: 120, weight: 60 },
      { id: 'ex-barbell-row', sets: 4, reps: 8, rest: 90, weight: 50 },
      { id: 'ex-shoulder-db', sets: 3, reps: 10, rest: 90, weight: 16 },
      { id: 'ex-lat-pulldown', sets: 3, reps: 12, rest: 75, weight: 45 },
      { id: 'ex-tricep-pushdown', sets: 3, reps: 12, rest: 60, weight: 20 },
      { id: 'ex-bicep-db-curl', sets: 3, reps: 12, rest: 60, weight: 12 }
    ]
  },
  {
    id: 'routine-legs-core',
    name: 'Legs & Core B',
    description: 'Squat and hinge focus with direct core work.',
    exercises: [
      { id: 'ex-barbell-squat', sets: 4, reps: 8, rest: 120, weight: 70 },
      { id: 'ex-romanian-deadlift', sets: 3, reps: 10, rest: 90, weight: 60 },
      { id: 'ex-leg-press', sets: 3, reps: 12, rest: 90, weight: 120 },
      { id: 'ex-plank', sets: 3, reps: 60, rest: 60, weight: 0 },
      { id: 'ex-hanging-raise', sets: 3, reps: 12, rest: 60, weight: 0 }
    ]
  },
  {
    id: 'routine-triple-combo',
    name: 'Triple Combo Challenge',
    description: 'A linked 3-exercise superset combo for muscular endurance.',
    exercises: [
      { id: 'ex-dumbbell-row', sets: 3, reps: 10, rest: 0, weight: 18, comboGroupId: 'combo-1' },
      { id: 'ex-pushups', sets: 3, reps: 'Max', rest: 0, weight: 0, comboGroupId: 'combo-1' },
      { id: 'ex-walking-lunges', sets: 3, reps: 40, rest: 60, weight: 0, comboGroupId: 'combo-1' }
    ]
  }
];

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
    duration: 3600,
    exercises: [
      {
        id: 'ex-bench-barbell',
        name: 'Barbell Bench Press',
        sets: [ { reps: 6, weight: 62.5, completed: true } ]
      },
      {
        id: 'ex-barbell-row',
        name: 'Barbell Row',
        sets: [ { reps: 8, weight: 52.5, completed: true } ]
      },
      {
        id: 'ex-shoulder-db',
        name: 'Dumbbell Shoulder Press',
        sets: [ { reps: 10, weight: 16, completed: true } ]
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
    duration: 3600,
    exercises: [
      {
        id: 'ex-bench-barbell',
        name: 'Barbell Bench Press',
        sets: [ { reps: 6, weight: 70, completed: true } ]
      },
      {
        id: 'ex-barbell-row',
        name: 'Barbell Row',
        sets: [ { reps: 8, weight: 60, completed: true } ]
      },
      {
        id: 'ex-shoulder-db',
        name: 'Dumbbell Shoulder Press',
        sets: [ { reps: 10, weight: 18, completed: true, note: 'Left arm weaker on last set' } ]
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

export const DEFAULT_PLAN_UPDATES = [
  {
    id: 'u-1',
    clientId: 'client-jane-doe',
    clientName: 'Jane Doe',
    date: '2026-07-06T11:00:00.000Z',
    exerciseName: 'Barbell Bench Press',
    tag: 'Too Easy - Increase Load',
    resolved: false
  },
  {
    id: 'u-2',
    clientId: 'client-john-smith',
    clientName: 'John Smith',
    date: '2026-07-08T17:30:00.000Z',
    exerciseName: 'Barbell Back Squat',
    tag: 'Form Break - Depth Alert',
    resolved: false
  }
];

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
      title: 'Individual Focus Session',
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
      title: 'Tomorrow Strength',
      participants: ['client-john-smith'],
      routineId: 'routine-upper-a',
      maxCapacity: 4,
      day: 'tomorrow'
    },
    {
      id: 'b-6',
      time: '11:30 - 12:30',
      title: 'Lunch Blast Workout',
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
      title: 'Yesterday Core',
      participants: ['client-jane-doe'],
      routineId: 'routine-upper-a',
      maxCapacity: 2,
      day: 'yesterday'
    },
    {
      id: 'b-yesterday-2',
      time: '16:00 - 17:00',
      title: 'Yesterday Mobility',
      participants: ['client-john-smith'],
      routineId: 'routine-legs-core',
      maxCapacity: 3,
      day: 'yesterday'
    },
    {
      id: 'b-upcoming-1',
      time: '08:00 - 09:30',
      title: 'Future Strength',
      participants: ['client-sarah-jenkins'],
      routineId: 'routine-legs-core',
      maxCapacity: 2,
      day: 'upcoming'
    },
    {
      id: 'b-upcoming-2',
      time: '10:00 - 11:00',
      title: 'Future HIIT Conditioning',
      participants: ['client-jane-doe', 'client-john-smith'],
      routineId: 'routine-upper-a',
      maxCapacity: 4,
      day: 'upcoming'
    }
  ];
})();
