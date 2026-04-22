"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/auth-user";
import * as workouts from "@/lib/services/workouts";

function revalidateWorkoutsCalendar() {
  revalidatePath("/app/workouts");
  revalidatePath("/app/workouts/calendar");
}

export async function actionScheduleTemplate(formData: FormData) {
  const userId = await requireUserId();
    const dayKey = String(formData.get("dayKey") ?? "").trim();
    const templateId = String(formData.get("templateId") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || undefined;
    if (!dayKey || !templateId) throw new Error("Day and template required");
    await workouts.createScheduledWorkout(userId, { dayKey, templateId, notes });
    revalidateWorkoutsCalendar();
  
}

export async function actionDeleteSchedule(scheduleId: string) {
  const userId = await requireUserId();
    await workouts.deleteScheduledWorkout(userId, scheduleId.trim());
    revalidateWorkoutsCalendar();
  
}

export async function actionCreateRecurring(formData: FormData) {
  const userId = await requireUserId();
    const startDayKey = String(formData.get("startDayKey") ?? "").trim();
    const templateId = String(formData.get("templateId") ?? "").trim();
    const untilRaw = String(formData.get("untilDayKey") ?? "").trim();
    const untilDayKey = untilRaw || undefined;
    const intervalWeeks = Math.max(
      1,
      Math.round(Number(formData.get("intervalWeeks") ?? 1) || 1)
    );
    const notes = String(formData.get("recurringNotes") ?? "").trim() || undefined;
    const byDay = formData
      .getAll("byDay")
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    if (!startDayKey || !templateId) throw new Error("Start day and template required");
    await workouts.createRecurringWorkoutRule(userId, {
      templateId,
      byDay,
      startDayKey,
      untilDayKey,
      intervalWeeks,
      notes,
    });
    revalidateWorkoutsCalendar();
  
}

export async function actionSkipRecurring(ruleId: string, dayKey: string) {
  const userId = await requireUserId();
    await workouts.skipRecurringOccurrence(userId, ruleId.trim(), dayKey.trim());
    revalidateWorkoutsCalendar();
  
}

export async function actionDeleteRecurringRule(ruleId: string) {
  const userId = await requireUserId();
    await workouts.deleteRecurringWorkoutRule(userId, ruleId.trim());
    revalidateWorkoutsCalendar();
  
}
