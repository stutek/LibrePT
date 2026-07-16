// src/data/exercises.js — seed exercise library (name, category, instructions).
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
