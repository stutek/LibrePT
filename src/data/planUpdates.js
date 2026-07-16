// src/data/planUpdates.js — seed pending plan adjustments (feedback loop).
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
