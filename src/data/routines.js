// src/data/routines.js — seed routines/programs (exercises + optional circuit groups).
export const DEFAULT_ROUTINES = [
  {
    id: 'routine-upper-a',
    name: 'Upper Body A',
    description: 'Strength-focused upper body session prioritizing compound presses and rows.',
    exercises: [
      { id: 'ex-bench-barbell', sets: 5, reps: 5, rest: 150, weight: 62.5 },
      { id: 'ex-barbell-row', sets: 4, reps: 8, rest: 90, weight: 55 },
      { id: 'ex-shoulder-db', sets: 3, reps: 10, rest: 90, weight: 18 },
      { id: 'ex-lat-pulldown', sets: 3, reps: 12, rest: 75, weight: 48 },
      { id: 'ex-tricep-pushdown', sets: 4, reps: 15, rest: 60, weight: 25 },
      { id: 'ex-bicep-db-curl', sets: 3, reps: 14, rest: 45, weight: 14 }
    ]
  },
  {
    id: 'routine-legs-core',
    name: 'Legs & Core B',
    description: 'Squat and hinge focus with direct core work.',
    exercises: [
      { id: 'ex-barbell-squat', sets: 5, reps: 5, rest: 180, weight: 80 },
      { id: 'ex-romanian-deadlift', sets: 4, reps: 8, rest: 120, weight: 65 },
      { id: 'ex-leg-press', sets: 3, reps: 12, rest: 90, weight: 140 },
      { id: 'ex-plank', sets: 3, reps: 45, rest: 60, weight: 0 },
      { id: 'ex-hanging-raise', sets: 3, reps: 15, rest: 60, weight: 0 }
    ]
  },
  {
    id: 'routine-triple-combo',
    name: 'Triple Combo Challenge',
    description: 'A linked 3-exercise superset combo for muscular endurance.',
    exercises: [
      // circuitId groups these three into one card; circuitSeries is the round counter (do the
      // whole trio 3 times). comboGroupId is a separate, older concept and is left untouched.
      { id: 'ex-dumbbell-row', sets: 3, reps: 10, rest: 0, weight: 18, comboGroupId: 'combo-1', circuitId: 'circuit-triple', circuitTitle: 'Triple Combo', circuitSeries: 3 },
      { id: 'ex-pushups', sets: 3, reps: 'Max', rest: 0, weight: 0, comboGroupId: 'combo-1', circuitId: 'circuit-triple', circuitTitle: 'Triple Combo', circuitSeries: 3 },
      { id: 'ex-walking-lunges', sets: 3, reps: 40, rest: 60, weight: 0, comboGroupId: 'combo-1', circuitId: 'circuit-triple', circuitTitle: 'Triple Combo', circuitSeries: 3 }
    ]
  }
];
