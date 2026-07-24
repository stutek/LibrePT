// src/data/exercises.js — seed exercise library as a professional movement taxonomy.
// Each entry carries the immutable `id` plus taxonomy axes used for fast selection, filtering and
// long-term volume analytics: `category` (primary muscle group), `equipment`, `pattern`
// (biomechanical movement pattern), and `modality` (HOW it is logged — see exerciseModality.js).
// `instructions` is retained for the live deck but deprecated in the catalog view — a certified PT
// does not need how-to text (TODO §13.1).
//
// Controlled vocabularies (keep values stable — history and analytics bucket on them):
//   category: Chest | Back | Legs | Shoulders | Arms | Core | Recovery | Cardio
//   equipment: Barbell | Dumbbell | Cable | Machine | Bodyweight
//   pattern: Horizontal Push | Horizontal Pull | Vertical Push | Vertical Pull |
//            Squat | Hinge | Lunge | Isolation | Core | Mobility | Conditioning | Balance | Agility
//   modality (TODO §13.3 / §17.1): strength (default, omitted) | isometric | cardio | stretch |
//            balance | agility
//     - cardio entries carry `metric`: time | distance | calories | watts | pace | heartrate.
//     - agility entries carry `metric`: time | distance | reps.
//     - isometric is a hold under load (hold-time + load); stretch/balance are unloaded holds;
//       strength stays sets × reps × load.
export const DEFAULT_EXERCISES = [
  // Chest
  {
    id: "e10a2b3c",
    name: "Barbell Bench Press",
    category: "Chest",
    equipment: "Barbell",
    pattern: "Horizontal Push",
    instructions:
      "Lie flat on a bench, grip the barbell slightly wider than shoulder width, lower it to mid-chest, and push up.",
  },
  {
    id: "e11a2b3c",
    name: "Dumbbell Bench Press",
    category: "Chest",
    equipment: "Dumbbell",
    pattern: "Horizontal Push",
    instructions:
      "Lie on a flat bench with a dumbbell in each hand, lower the dumbbells to chest level, then press them up.",
  },
  {
    id: "e12a2b3c",
    name: "Incline Dumbbell Press",
    category: "Chest",
    equipment: "Dumbbell",
    pattern: "Horizontal Push",
    instructions: "Set bench to a 30-45 degree incline. Press dumbbells upwards from chest height.",
  },
  {
    id: "e13a2b3c",
    name: "Cable Chest Fly",
    category: "Chest",
    equipment: "Cable",
    pattern: "Isolation",
    instructions:
      "Position pulleys at shoulder height, grab handles, and bring hands together in a wide hugging motion.",
  },
  {
    id: "e14a2b3c",
    name: "Push-Ups",
    category: "Chest",
    equipment: "Bodyweight",
    pattern: "Horizontal Push",
    instructions: "Keep body in a straight plank, lower chest to floor, and push back up.",
  },

  // Back
  {
    id: "e15a2b3c",
    name: "Pull-Ups",
    category: "Back",
    equipment: "Bodyweight",
    pattern: "Vertical Pull",
    instructions: "Hang from a bar with palms facing away. Pull chest up to the bar.",
  },
  {
    id: "e16a2b3c",
    name: "Lat Pulldown",
    category: "Back",
    equipment: "Cable",
    pattern: "Vertical Pull",
    instructions: "Sit at pulldown station, pull bar down to upper chest, engaging the lats.",
  },
  {
    id: "e17a2b3c",
    name: "Barbell Row",
    category: "Back",
    equipment: "Barbell",
    pattern: "Horizontal Pull",
    instructions: "Hinge at hips, pull barbell towards lower abdomen keeping back straight.",
  },
  {
    id: "e18a2b3c",
    name: "Single-Arm Dumbbell Row",
    category: "Back",
    equipment: "Dumbbell",
    pattern: "Horizontal Pull",
    instructions: "Place one knee/hand on bench, pull dumbbell to hip with other arm.",
  },
  {
    id: "e19a2b3c",
    name: "Face Pulls",
    category: "Back",
    equipment: "Cable",
    pattern: "Horizontal Pull",
    instructions: "Pull rope attachment from high pulley towards forehead, pulling elbows wide.",
  },

  // Legs
  {
    id: "e20b3c4d",
    name: "Barbell Back Squat",
    category: "Legs",
    equipment: "Barbell",
    pattern: "Squat",
    instructions:
      "Rest bar on upper back, squat down until thighs are parallel to floor, push back up.",
  },
  {
    id: "e21b3c4d",
    name: "Romanian Deadlift (RDL)",
    category: "Legs",
    equipment: "Barbell",
    pattern: "Hinge",
    instructions:
      "Hinge at hips with micro-bend in knees, lower weight down shins, squeeze glutes to stand.",
  },
  {
    id: "e22b3c4d",
    name: "Leg Press",
    category: "Legs",
    equipment: "Machine",
    pattern: "Squat",
    instructions:
      "Sit in machine, unlock platform, lower knees toward chest, press back up without locking knees.",
  },
  {
    id: "e23b3c4d",
    name: "Dumbbell Goblet Squat",
    category: "Legs",
    equipment: "Dumbbell",
    pattern: "Squat",
    instructions: "Hold a single dumbbell vertically at chest height, squat deep.",
  },
  {
    id: "e24b3c4d",
    name: "Leg Extension",
    category: "Legs",
    equipment: "Machine",
    pattern: "Isolation",
    instructions: "Sit in machine, extend legs fully, pause at top, and lower slowly.",
  },
  {
    id: "e25b3c4d",
    name: "Lying Leg Curl",
    category: "Legs",
    equipment: "Machine",
    pattern: "Isolation",
    instructions: "Lie face down, curl roller pad towards glutes, control return.",
  },
  {
    id: "e26b3c4d",
    name: "Standing Calf Raise",
    category: "Legs",
    equipment: "Machine",
    pattern: "Isolation",
    instructions: "Raise heels as high as possible on a block, stretch down deep.",
  },

  // Shoulders
  {
    id: "e27b3c4d",
    name: "Barbell Overhead Press",
    category: "Shoulders",
    equipment: "Barbell",
    pattern: "Vertical Push",
    instructions:
      "Press barbell from shoulder height overhead to full lockout, head through at top.",
  },
  {
    id: "e28b3c4d",
    name: "Dumbbell Lateral Raise",
    category: "Shoulders",
    equipment: "Dumbbell",
    pattern: "Isolation",
    instructions: "Stand tall, raise dumbbells out to sides until arms are parallel to the floor.",
  },
  {
    id: "e29b3c4d",
    name: "Dumbbell Shoulder Press",
    category: "Shoulders",
    equipment: "Dumbbell",
    pattern: "Vertical Push",
    instructions: "Sit or stand, press dumbbells from ear level overhead.",
  },

  // Arms
  {
    id: "e30c4d5e",
    name: "Dumbbell Bicep Curl",
    category: "Arms",
    equipment: "Dumbbell",
    pattern: "Isolation",
    instructions:
      "Rotate palms up as you curl dumbbells towards shoulders, keeping elbows locked at sides.",
  },
  {
    id: "e31c4d5e",
    name: "Dumbbell Hammer Curl",
    category: "Arms",
    equipment: "Dumbbell",
    pattern: "Isolation",
    instructions: "Curl dumbbells with neutral grip (palms facing each other).",
  },
  {
    id: "e32c4d5e",
    name: "Cable Tricep Pushdown",
    category: "Arms",
    equipment: "Cable",
    pattern: "Isolation",
    instructions: "Push rope or bar attachment down by extending elbows, keeping upper arms still.",
  },
  {
    id: "e33c4d5e",
    name: "EZ-Bar Skull Crusher",
    category: "Arms",
    equipment: "Barbell",
    pattern: "Isolation",
    instructions: "Lie on bench, lower bar to forehead by bending elbows, then extend.",
  },

  // Core
  {
    id: "e34c4d5e",
    name: "Plank",
    category: "Core",
    equipment: "Bodyweight",
    pattern: "Core",
    instructions: "Hold straight body line resting on forearms and toes. Squeeze core and glutes.",
  },
  {
    id: "e35c4d5e",
    name: "Hanging Knee Raise",
    category: "Core",
    equipment: "Bodyweight",
    pattern: "Core",
    instructions: "Hang from pull-up bar, raise knees to chest height slowly without swinging.",
  },
  {
    id: "e36c4d5e",
    name: "Abmat Sit-up",
    category: "Core",
    equipment: "Bodyweight",
    pattern: "Core",
    instructions:
      "Sit with soles of feet together, touch floor behind head, sit up and touch toes.",
  },
  {
    id: "e37c4d5e",
    name: "Russian Twist",
    category: "Core",
    equipment: "Bodyweight",
    pattern: "Core",
    instructions: "Sit, lean back slightly, lift feet, rotate torso tapping hands side-to-side.",
  },
  {
    id: "e38c4d5e",
    name: "Walking Lunges",
    category: "Legs",
    equipment: "Bodyweight",
    pattern: "Lunge",
    instructions: "Step forward lunging down, alternating legs.",
  },
  {
    id: "e39c4d5e",
    name: "Shoulder & Lat Stretch",
    category: "Recovery",
    equipment: "Bodyweight",
    pattern: "Mobility",
    modality: "stretch",
    instructions: "Hold child pose and lateral lat stretches for 30s.",
  },
  {
    id: "e40c4d5e",
    name: "Hamstring & Hip Stretch",
    category: "Recovery",
    equipment: "Bodyweight",
    pattern: "Mobility",
    modality: "stretch",
    instructions: "Static hamstring stretch and hip flexor stretch, hold 30s per side.",
  },

  // Cardio / conditioning — logged against an effort metric (time | distance | calories | watts),
  // not sets × reps × load. The clipboard timer is the primary logging surface for time-bound work.
  {
    id: "e41d5e6f",
    name: "Assault Bike",
    category: "Cardio",
    equipment: "Machine",
    pattern: "Conditioning",
    modality: "cardio",
    metric: "calories",
    instructions: "Sustained air-bike intervals; drive with arms and legs to the calorie target.",
  },
  {
    id: "e42d5e6f",
    name: "Concept2 Rower",
    category: "Cardio",
    equipment: "Machine",
    pattern: "Conditioning",
    modality: "cardio",
    metric: "distance",
    instructions: "Row to the target distance with a strong legs-hips-arms sequence.",
  },
  {
    id: "e43d5e6f",
    name: "Ski-Erg",
    category: "Cardio",
    equipment: "Machine",
    pattern: "Conditioning",
    modality: "cardio",
    metric: "calories",
    instructions: "Double-pole the ski-erg to the calorie target, hinging at the hips.",
  },
  {
    id: "e44d5e6f",
    name: "Watt Bike",
    category: "Cardio",
    equipment: "Machine",
    pattern: "Conditioning",
    modality: "cardio",
    metric: "watts",
    instructions: "Hold the target power output (watts) for the prescribed effort.",
  },
  {
    id: "e45d5e6f",
    name: "Treadmill Run",
    category: "Cardio",
    equipment: "Machine",
    pattern: "Conditioning",
    modality: "cardio",
    metric: "time",
    instructions: "Steady-state or interval run to the target time.",
  },

  // Balance / stability — a stability hold measured in hold-time (optionally per side).
  {
    id: "e46e6f7a",
    name: "Single-Leg Balance",
    category: "Core",
    equipment: "Bodyweight",
    pattern: "Balance",
    modality: "balance",
    instructions:
      "Stand on one leg, hips level and core braced; hold for the target time per side.",
  },
  {
    id: "e47e6f7a",
    name: "BOSU Squat Hold",
    category: "Legs",
    equipment: "Bodyweight",
    pattern: "Balance",
    modality: "balance",
    instructions:
      "Hold a quarter-squat on an unstable BOSU dome, staying centred for the target time.",
  },

  // Isometric — a hold under load, logged as hold-time + load (a weighted plank still takes weight).
  {
    id: "e48f7a8b",
    name: "Weighted Plank",
    category: "Core",
    equipment: "Bodyweight",
    pattern: "Core",
    modality: "isometric",
    instructions: "Hold a rigid plank with a plate on the upper back for the target time.",
  },
  {
    id: "e49f7a8b",
    name: "Wall Sit",
    category: "Legs",
    equipment: "Bodyweight",
    pattern: "Squat",
    modality: "isometric",
    instructions:
      "Sit against the wall at 90° knees, optionally holding a plate, for the target time.",
  },
  {
    id: "e50f7a8b",
    name: "Overhead Barbell Hold",
    category: "Shoulders",
    equipment: "Barbell",
    pattern: "Vertical Push",
    modality: "isometric",
    instructions: "Hold a loaded barbell locked out overhead for the target time.",
  },

  // Agility — speed / coordination drills, logged against time, distance, or reps (not load).
  {
    id: "e51a8b9c",
    name: "5-10-5 Pro Agility Shuttle",
    category: "Cardio",
    equipment: "Bodyweight",
    pattern: "Agility",
    modality: "agility",
    metric: "time",
    instructions: "Sprint 5yd, back 10yd, through 5yd, changing direction sharply; log the time.",
  },
  {
    id: "e52a8b9c",
    name: "Agility Ladder Drill",
    category: "Cardio",
    equipment: "Bodyweight",
    pattern: "Agility",
    modality: "agility",
    metric: "time",
    instructions:
      "Quick-feet ladder pattern for the target time, staying light on the balls of the feet.",
  },
  {
    id: "e53a8b9c",
    name: "Cone Sprint Drill",
    category: "Cardio",
    equipment: "Bodyweight",
    pattern: "Agility",
    modality: "agility",
    metric: "distance",
    instructions: "Repeated accelerations between cones over the target distance.",
  },

  // Cardio with the newer effort metrics: pace (min/km) and heart-rate zone (bpm).
  {
    id: "e54a8b9c",
    name: "Outdoor Run",
    category: "Cardio",
    equipment: "Bodyweight",
    pattern: "Conditioning",
    modality: "cardio",
    metric: "pace",
    instructions: "Run holding the target pace (min/km).",
  },
  {
    id: "e55a8b9c",
    name: "Zone 2 Bike Ride",
    category: "Cardio",
    equipment: "Machine",
    pattern: "Conditioning",
    modality: "cardio",
    metric: "heartrate",
    instructions: "Steady aerobic ride keeping heart rate at the target zone (bpm).",
  },
];
