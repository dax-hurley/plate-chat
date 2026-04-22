"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth-user";
import { formatDayKey, parseDayKey } from "@/lib/date-key";
import * as progress from "@/lib/services/progress";
import { isAllowedVitalKey } from "@/lib/vitals-keys";

export async function actionFetchExerciseProgressSeries(input: {
  exerciseId: string;
  fromDayKey: string;
  toDayKey: string;
}) {
  const userId = await requireUserId();
    if (!parseDayKey(input.fromDayKey) || !parseDayKey(input.toDayKey)) {
      throw new Error("Invalid date range");
    }
    return progress.getExerciseProgressByDay(
      userId,
      input.exerciseId.trim(),
      input.fromDayKey,
      input.toDayKey
    );
  
}

export async function actionFetchMacroSeries(input: {
  fromDayKey: string;
  toDayKey: string;
}) {
  const userId = await requireUserId();
    if (!parseDayKey(input.fromDayKey) || !parseDayKey(input.toDayKey)) {
      throw new Error("Invalid date range");
    }
    return progress.getMacroTotalsByDay(
      userId,
      input.fromDayKey,
      input.toDayKey
    );
  
}

export async function actionFetchWeightBmiSeries(input: {
  fromDayKey: string;
  toDayKey: string;
}) {
  const userId = await requireUserId();
    if (!parseDayKey(input.fromDayKey) || !parseDayKey(input.toDayKey)) {
      throw new Error("Invalid date range");
    }
    return progress.getWeightAndBmiSeries(
      userId,
      input.fromDayKey,
      input.toDayKey
    );
  
}

export async function actionFetchVitals(input: {
  fromDayKey: string;
  toDayKey: string;
}) {
  const userId = await requireUserId();
    if (!parseDayKey(input.fromDayKey) || !parseDayKey(input.toDayKey)) {
      throw new Error("Invalid date range");
    }
    return progress.listVitalEntriesInRange(
      userId,
      input.fromDayKey,
      input.toDayKey
    );
  
}

export async function actionGetLatestVitals() {
  const userId = await requireUserId();
    const m = await progress.getLatestVitalMap(userId);
    const out: Record<string, { value: number; dayKey: string }> = {};
    for (const [k, v] of m) {
      out[k] = { value: v.value, dayKey: v.dayKey };
    }
    return out;
  
}

export async function actionSaveVitals(formData: FormData) {
  const userId = await requireUserId();
    const dayKey = formatDayKey();

    const entries: { key: string; value: number }[] = [];
    for (const key of [
      "body_weight_lb",
      "body_fat_pct",
      "resting_hr",
      "sleep_hours",
      "waist_in",
      "blood_pressure_systolic",
      "blood_pressure_diastolic",
    ] as const) {
      const raw = String(formData.get(key) ?? "").trim();
      if (raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      entries.push({ key, value: n });
    }

    for (const e of entries) {
      if (!isAllowedVitalKey(e.key)) continue;
      await progress.upsertVitalEntry(userId, {
        vitalKey: e.key,
        value: e.value,
        dayKey,
      });
    }

    revalidatePath("/app/progress");
  
}

/** Log body weight (lb) for today; replaces any prior entry for this calendar day. */
export async function actionLogBodyWeightLb(valueLb: number) {
  const userId = await requireUserId();
    const v = Number(valueLb);
    if (!Number.isFinite(v) || v < 35 || v > 900) {
      throw new Error("Enter a realistic weight in pounds.");
    }
    await progress.upsertVitalEntry(userId, {
      vitalKey: "body_weight_lb",
      value: v,
    });
    revalidatePath("/app");
    revalidatePath("/app/progress");
  
}
