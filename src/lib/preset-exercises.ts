/**
 * Built-in exercises shipped with the app. Rows use stable `id` values so
 * `INSERT OR IGNORE` seeding is idempotent across environments.
 */
export type PresetExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  /** Default `reps` (log reps + weight per set). */
  logKind?: "reps" | "time" | "distance";
  /** When `logKind` is `time`, default seconds per set for templates. */
  defaultDurationSec?: number;
};

export const PRESET_EXERCISES: readonly PresetExercise[] = [
  { id: "pre00000001", name: "Barbell bench press", muscleGroup: "Chest" },
  { id: "pre00000002", name: "Dumbbell bench press", muscleGroup: "Chest" },
  { id: "pre00000003", name: "Incline barbell bench press", muscleGroup: "Chest" },
  { id: "pre00000004", name: "Incline dumbbell bench press", muscleGroup: "Chest" },
  { id: "pre00000005", name: "Decline bench press", muscleGroup: "Chest" },
  { id: "pre00000006", name: "Chest fly (machine)", muscleGroup: "Chest" },
  { id: "pre00000007", name: "Cable crossover", muscleGroup: "Chest" },
  { id: "pre00000008", name: "Push-up", muscleGroup: "Chest" },
  { id: "pre00000009", name: "Dips (chest lean)", muscleGroup: "Chest" },

  { id: "pre00000010", name: "Deadlift (conventional)", muscleGroup: "Back" },
  { id: "pre00000011", name: "Romanian deadlift", muscleGroup: "Back" },
  { id: "pre00000012", name: "Barbell row", muscleGroup: "Back" },
  { id: "pre00000013", name: "Pendlay row", muscleGroup: "Back" },
  { id: "pre00000014", name: "Single-arm dumbbell row", muscleGroup: "Back" },
  { id: "pre00000015", name: "Lat pulldown", muscleGroup: "Back" },
  { id: "pre00000016", name: "Pull-up", muscleGroup: "Back" },
  { id: "pre00000017", name: "Chin-up", muscleGroup: "Back" },
  { id: "pre00000018", name: "Seated cable row", muscleGroup: "Back" },
  { id: "pre00000019", name: "Face pull", muscleGroup: "Back" },
  { id: "pre00000020", name: "Straight-arm pulldown", muscleGroup: "Back" },
  { id: "pre00000021", name: "Back extension (hyperextension)", muscleGroup: "Back" },

  { id: "pre00000022", name: "Overhead press (barbell)", muscleGroup: "Shoulders" },
  { id: "pre00000023", name: "Dumbbell shoulder press", muscleGroup: "Shoulders" },
  { id: "pre00000024", name: "Arnold press", muscleGroup: "Shoulders" },
  { id: "pre00000025", name: "Lateral raise", muscleGroup: "Shoulders" },
  { id: "pre00000026", name: "Front raise", muscleGroup: "Shoulders" },
  { id: "pre00000027", name: "Rear delt fly", muscleGroup: "Shoulders" },
  { id: "pre00000028", name: "Upright row", muscleGroup: "Shoulders" },
  { id: "pre00000029", name: "Shrugs", muscleGroup: "Shoulders" },

  { id: "pre00000030", name: "Barbell curl", muscleGroup: "Biceps" },
  { id: "pre00000031", name: "Dumbbell curl", muscleGroup: "Biceps" },
  { id: "pre00000032", name: "Hammer curl", muscleGroup: "Biceps" },
  { id: "pre00000033", name: "Preacher curl", muscleGroup: "Biceps" },
  { id: "pre00000034", name: "Cable curl", muscleGroup: "Biceps" },

  { id: "pre00000035", name: "Triceps pushdown (cable)", muscleGroup: "Triceps" },
  { id: "pre00000036", name: "Skull crusher", muscleGroup: "Triceps" },
  { id: "pre00000037", name: "Overhead triceps extension", muscleGroup: "Triceps" },
  { id: "pre00000038", name: "Close-grip bench press", muscleGroup: "Triceps" },
  { id: "pre00000039", name: "Bench dip", muscleGroup: "Triceps" },

  { id: "pre00000040", name: "Back squat", muscleGroup: "Legs" },
  { id: "pre00000041", name: "Front squat", muscleGroup: "Legs" },
  { id: "pre00000042", name: "Goblet squat", muscleGroup: "Legs" },
  { id: "pre00000043", name: "Leg press", muscleGroup: "Legs" },
  { id: "pre00000044", name: "Leg extension", muscleGroup: "Legs" },
  { id: "pre00000045", name: "Leg curl (lying)", muscleGroup: "Legs" },
  { id: "pre00000046", name: "Leg curl (seated)", muscleGroup: "Legs" },
  { id: "pre00000047", name: "Walking lunge", muscleGroup: "Legs" },
  { id: "pre00000048", name: "Bulgarian split squat", muscleGroup: "Legs" },
  { id: "pre00000049", name: "Calf raise (standing)", muscleGroup: "Legs" },
  { id: "pre00000050", name: "Calf raise (seated)", muscleGroup: "Legs" },

  { id: "pre00000051", name: "Hip thrust", muscleGroup: "Glutes" },
  { id: "pre00000052", name: "Glute bridge", muscleGroup: "Glutes" },
  { id: "pre00000053", name: "Cable kickback", muscleGroup: "Glutes" },

  {
    id: "pre00000054",
    name: "Plank",
    muscleGroup: "Core",
    logKind: "time",
    defaultDurationSec: 60,
  },
  { id: "pre00000055", name: "Hanging leg raise", muscleGroup: "Core" },
  { id: "pre00000056", name: "Cable crunch", muscleGroup: "Core" },
  { id: "pre00000057", name: "Ab wheel rollout", muscleGroup: "Core" },
  { id: "pre00000058", name: "Russian twist", muscleGroup: "Core" },

  {
    id: "pre00000059",
    name: "Rowing machine",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 120,
  },
  {
    id: "pre00000060",
    name: "Assault bike (AirBike)",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 60,
  },
  {
    id: "pre00000061",
    name: "Treadmill run",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 600,
  },
  {
    id: "pre00000062",
    name: "Jump rope",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 90,
  },
  {
    id: "pre00000067",
    name: "Elliptical",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 300,
  },
  {
    id: "pre00000068",
    name: "Stair climber (StepMill)",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 300,
  },
  {
    id: "pre00000069",
    name: "Stationary bike",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 600,
  },
  {
    id: "pre00000070",
    name: "Indoor cycling (spin)",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 2700,
  },
  {
    id: "pre00000071",
    name: "Swimming",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 600,
  },
  {
    id: "pre00000072",
    name: "SkiErg",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 90,
  },
  {
    id: "pre00000073",
    name: "VersaClimber",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 180,
  },
  {
    id: "pre00000074",
    name: "Treadmill walk",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 900,
  },
  {
    id: "pre00000075",
    name: "Battle ropes",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 30,
  },
  {
    id: "pre00000076",
    name: "Heavy bag",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 180,
  },
  {
    id: "pre00000077",
    name: "Shadow boxing",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 120,
  },
  {
    id: "pre00000078",
    name: "Jacob's ladder",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 120,
  },
  {
    id: "pre00000079",
    name: "Arc trainer",
    muscleGroup: "Cardio",
    logKind: "time",
    defaultDurationSec: 300,
  },

  { id: "pre00000063", name: "Farmer's carry", muscleGroup: "Full body" },
  { id: "pre00000064", name: "Kettlebell swing", muscleGroup: "Full body" },
  { id: "pre00000065", name: "Clean and jerk", muscleGroup: "Full body" },
  { id: "pre00000066", name: "Snatch", muscleGroup: "Full body" },
];
