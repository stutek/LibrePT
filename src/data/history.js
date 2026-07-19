// src/data/history.js — seed logged session history (per-client past workouts).
export const DEFAULT_HISTORY = [
  {
    id: "h001f2e3",
    clientId: "c1a9f0e2",
    clientName: "Jane Doe",
    routineName: "Upper Body A",
    date: "2026-07-06T10:15:00.000Z",
    duration: 3420,
    exercises: [
      {
        id: "e10a2b3c",
        name: "Barbell Bench Press",
        sets: [
          { reps: 6, weight: 60, completed: true, note: "RPE 8" },
          { reps: 6, weight: 60, completed: true, note: "RPE 8.5" },
          { reps: 6, weight: 60, completed: true, note: "RPE 9" },
          { reps: 5, weight: 60, completed: true, note: "Failed 6th rep" },
        ],
      },
      {
        id: "e17a2b3c",
        name: "Barbell Row",
        sets: [
          { reps: 8, weight: 50, completed: true },
          { reps: 8, weight: 50, completed: true },
          { reps: 8, weight: 50, completed: true },
          { reps: 8, weight: 50, completed: true, note: "Strict form" },
        ],
      },
    ],
    feedback: [
      {
        id: "u001f2e3",
        clientId: "c1a9f0e2",
        exerciseName: "Barbell Bench Press",
        tag: "Too Easy - Increase Load",
        note: "Completed all 4 sets with high speed. Recommend adding 2.5kg next session.",
      },
    ],
  },
  {
    id: "h002f2e3",
    clientId: "c1a9f0e2",
    clientName: "Jane Doe",
    routineName: "Upper Body A",
    date: "2026-07-10T09:00:00.000Z",
    duration: 3540,
    exercises: [
      {
        id: "e10a2b3c",
        name: "Barbell Bench Press",
        sets: [
          { reps: 5, weight: 60, completed: true, note: "RPE 7" },
          { reps: 5, weight: 60, completed: true, note: "RPE 8" },
          { reps: 5, weight: 60, completed: true, note: "RPE 8.5" },
          { reps: 4, weight: 60, completed: true, note: "RPE 9, last rep grind" },
        ],
      },
      {
        id: "e17a2b3c",
        name: "Barbell Row",
        sets: [
          { reps: 8, weight: 52.5, completed: true },
          { reps: 8, weight: 52.5, completed: true },
          { reps: 7, weight: 52.5, completed: true, note: "Strict, paused" },
        ],
      },
      {
        id: "e29b3c4d",
        name: "Dumbbell Shoulder Press",
        sets: [
          { reps: 10, weight: 16, completed: true },
          { reps: 9, weight: 16, completed: true },
          { reps: 8, weight: 16, completed: true, note: "Left side fatigued" },
        ],
      },
    ],
    feedback: [
      {
        id: "udemo001",
        clientId: "c1a9f0e2",
        exerciseName: "Barbell Bench Press",
        tag: "Too Easy - Increase Load",
        note: "Pushed the weight easily. Ready for 65kg next week.",
      },
      {
        id: "udemo002",
        clientId: "c1a9f0e2",
        exerciseName: "Barbell Row",
        tag: "Too Hard - Reduce Load",
        note: "Felt form breaking on last 2 reps. Keep weight at 50kg.",
      },
      {
        id: "udemo003",
        clientId: "c1a9f0e2",
        exerciseName: "Dumbbell Shoulder Press",
        tag: "Form Break - Watch Position",
        note: "Shoulders shrugging too early. Keep elbows in.",
      },
    ],
  },
  {
    id: "h003f2e3",
    clientId: "c2b8e1d3",
    clientName: "John Smith",
    routineName: "Upper Body A",
    date: "2026-07-10T09:00:00.000Z",
    duration: 3720,
    exercises: [
      {
        id: "e10a2b3c",
        name: "Barbell Bench Press",
        sets: [
          { reps: 5, weight: 67.5, completed: true, note: "RPE 8" },
          { reps: 5, weight: 67.5, completed: true, note: "RPE 8.5" },
          { reps: 5, weight: 67.5, completed: true, note: "RPE 9" },
        ],
      },
      {
        id: "e17a2b3c",
        name: "Barbell Row",
        sets: [
          { reps: 8, weight: 57.5, completed: true },
          { reps: 8, weight: 57.5, completed: true },
          { reps: 8, weight: 57.5, completed: true },
          { reps: 7, weight: 57.5, completed: true },
        ],
      },
      {
        id: "e29b3c4d",
        name: "Dumbbell Shoulder Press",
        sets: [
          { reps: 10, weight: 18, completed: true },
          { reps: 9, weight: 18, completed: true, note: "Left arm weaker on last set" },
        ],
      },
    ],
    feedback: [
      {
        id: "udemo004",
        clientId: "c2b8e1d3",
        exerciseName: "Barbell Bench Press",
        tag: "Joint Pain / Discomfort",
        note: "Felt slight pinching in right shoulder. Ceased after 2 sets.",
      },
      {
        id: "udemo005",
        clientId: "c2b8e1d3",
        exerciseName: "Barbell Row",
        tag: "Completed reps easily",
        note: "Great mind-muscle connection. Strong back activation.",
      },
    ],
  },
  {
    id: "h004f2e3",
    clientId: "c8b28799",
    clientName: "Simon",
    routineName: "Strength & Longevity Focus",
    date: "2026-07-12T15:00:00.000Z",
    duration: 3300,
    exercises: [
      {
        id: "e11a2b3c",
        name: "Dumbbell Bench Press",
        sets: [
          { reps: 8, weight: 22, completed: true },
          { reps: 8, weight: 22, completed: true },
          { reps: 8, weight: 22, completed: true },
          { reps: 8, weight: 24, completed: true, note: "RPE 8" },
        ],
      },
      {
        id: "e21b3c4d",
        name: "Romanian Deadlift (RDL)",
        sets: [
          { reps: 10, weight: 65, completed: true },
          { reps: 10, weight: 70, completed: true },
          { reps: 10, weight: 70, completed: true, note: "Strong hinge focus" },
        ],
      },
    ],
    feedback: [
      {
        id: "u003f2e3",
        clientId: "c8b28799",
        exerciseName: "Dumbbell Bench Press",
        tag: "Too Easy - Increase Load",
        note: "Moved 24kg easily on the final set. Increase starting weight next session.",
      },
    ],
  },
];
