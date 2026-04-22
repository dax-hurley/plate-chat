"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Apple,
  Beef,
  Check,
  CloudOff,
  Droplets,
  Dumbbell,
  Flame,
  Loader2,
  PencilLine,
  TrendingDown,
  UserRound,
  Weight,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";

import { actionSaveProfile } from "@/app/app/profile/profile-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GoalPreset } from "@/lib/profile-goal-preset";
import type { UserProfileBundle } from "@/lib/services/profile";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 600;

const textareaClass =
  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full min-h-[5.5rem] resize-y rounded-lg border px-2.5 py-2 text-base outline-none transition-colors focus-visible:ring-3 md:text-sm";

const GOAL_OPTIONS: {
  id: GoalPreset;
  label: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}[] = [
  { id: "lose_weight", label: "Lose Weight", Icon: TrendingDown },
  { id: "gain_muscle", label: "Gain Muscle", Icon: Dumbbell },
  { id: "build_strength", label: "Build Strength", Icon: Weight },
  { id: "custom", label: "Custom", Icon: PencilLine },
];

function parseCaloriesField(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 50000) return null;
  return Math.round(n);
}

function parseGramGoalField(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 1000) return null;
  return Math.round(n * 10) / 10;
}

function fmtCaloriesInput(n: number | null | undefined): string {
  return n != null && Number.isFinite(n) ? String(Math.round(n)) : "";
}

function fmtGramInput(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function snapshotFromBundle(p: UserProfileBundle): string {
  return JSON.stringify({
    name: (p.name ?? "").trim(),
    heightIn: p.heightIn ?? null,
    goalPreset: p.goalPreset,
    fitnessGoals: (p.fitnessGoals ?? "").trim(),
    preferences: (p.preferences ?? "").trim(),
    goalCalories: p.goalCalories ?? null,
    goalProteinG: p.goalProteinG ?? null,
    goalCarbsG: p.goalCarbsG ?? null,
    goalFatG: p.goalFatG ?? null,
  });
}

function snapshotFromFields(
  name: string,
  heightIn: string,
  goalPreset: GoalPreset,
  fitnessGoals: string,
  preferences: string,
  goalCalories: string,
  goalProteinG: string,
  goalCarbsG: string,
  goalFatG: string
): string {
  const t = heightIn.trim();
  let heightNum: number | null = null;
  if (t !== "") {
    const n = Number(t);
    if (Number.isFinite(n) && n > 0) heightNum = n;
  }
  return JSON.stringify({
    name: name.trim(),
    heightIn: heightNum,
    goalPreset,
    fitnessGoals: fitnessGoals.trim(),
    preferences: preferences.trim(),
    goalCalories: parseCaloriesField(goalCalories),
    goalProteinG: parseGramGoalField(goalProteinG),
    goalCarbsG: parseGramGoalField(goalCarbsG),
    goalFatG: parseGramGoalField(goalFatG),
  });
}

function buildFormData(values: {
  name: string;
  heightIn: string;
  goalPreset: GoalPreset;
  fitnessGoals: string;
  preferences: string;
  goalCalories: string;
  goalProteinG: string;
  goalCarbsG: string;
  goalFatG: string;
}): FormData {
  const fd = new FormData();
  fd.set("name", values.name);
  fd.set("heightIn", values.heightIn);
  fd.set("goalPreset", values.goalPreset);
  fd.set("fitnessGoals", values.fitnessGoals);
  fd.set("preferences", values.preferences);
  fd.set("goalCalories", values.goalCalories);
  fd.set("goalProteinG", values.goalProteinG);
  fd.set("goalCarbsG", values.goalCarbsG);
  fd.set("goalFatG", values.goalFatG);
  return fd;
}

export function UserProfileForm({
  initialProfile,
}: {
  initialProfile: UserProfileBundle;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const mounted = useRef(false);
  const baselineRef = useRef(snapshotFromBundle(initialProfile));

  const [name, setName] = useState(initialProfile.name ?? "");
  const [heightIn, setHeightIn] = useState(
    initialProfile.heightIn != null && Number.isFinite(initialProfile.heightIn)
      ? String(initialProfile.heightIn)
      : ""
  );
  const [goalPreset, setGoalPreset] = useState<GoalPreset>(
    initialProfile.goalPreset
  );
  const [fitnessGoals, setFitnessGoals] = useState(
    initialProfile.fitnessGoals ?? ""
  );
  const [preferences, setPreferences] = useState(
    initialProfile.preferences ?? ""
  );
  const [goalCalories, setGoalCalories] = useState(
    fmtCaloriesInput(initialProfile.goalCalories)
  );
  const [goalProteinG, setGoalProteinG] = useState(
    fmtGramInput(initialProfile.goalProteinG)
  );
  const [goalCarbsG, setGoalCarbsG] = useState(
    fmtGramInput(initialProfile.goalCarbsG)
  );
  const [goalFatG, setGoalFatG] = useState(
    fmtGramInput(initialProfile.goalFatG)
  );

  type SyncPhase = "synced" | "pending" | "saving" | "saved" | "error";
  const [syncPhase, setSyncPhase] = useState<SyncPhase>("synced");

  useEffect(() => {
    if (syncPhase !== "saved") return;
    const t = window.setTimeout(() => setSyncPhase("synced"), 2800);
    return () => window.clearTimeout(t);
  }, [syncPhase]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const current = snapshotFromFields(
      name,
      heightIn,
      goalPreset,
      fitnessGoals,
      preferences,
      goalCalories,
      goalProteinG,
      goalCarbsG,
      goalFatG
    );
    if (current === baselineRef.current) {
      setSyncPhase((prev) => {
        if (prev === "saved" || prev === "saving") return prev;
        return "synced";
      });
      return;
    }

    setSyncPhase("pending");

    const t = window.setTimeout(() => {
      startTransition(async () => {
        setSyncPhase("saving");
        try {
          await actionSaveProfile(
            buildFormData({
              name,
              heightIn,
              goalPreset,
              fitnessGoals,
              preferences,
              goalCalories,
              goalProteinG,
              goalCarbsG,
              goalFatG,
            })
          );
          baselineRef.current = current;
          setSyncPhase("saved");
          toast.success("Profile saved", { duration: 2200 });
          router.refresh();
        } catch (e) {
          console.error(e);
          setSyncPhase("error");
          toast.error("Could not save profile");
        }
      });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(t);
  }, [
    name,
    heightIn,
    goalPreset,
    fitnessGoals,
    preferences,
    goalCalories,
    goalProteinG,
    goalCarbsG,
    goalFatG,
    router,
  ]);

  const goalsTextLabel =
    goalPreset === "custom" ? "Goals" : "Additional Goals";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <UserRound className="size-4 shrink-0" aria-hidden />
          Update how Trainlog and your coach know you. Changes save
          automatically.
        </p>
        <div
          className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end"
          aria-live="polite"
          aria-busy={syncPhase === "pending" || syncPhase === "saving"}
        >
          <div
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium shadow-sm transition-colors",
              syncPhase === "synced" &&
                "border-border bg-muted/50 text-muted-foreground",
              syncPhase === "pending" &&
                "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100",
              syncPhase === "saving" &&
                "border-primary/40 bg-primary/10 text-foreground",
              syncPhase === "saved" &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
              syncPhase === "error" &&
                "border-destructive/40 bg-destructive/10 text-destructive"
            )}
          >
            {syncPhase === "synced" ? (
              <>
                <Check className="size-4 opacity-60" aria-hidden />
                <span>All changes saved</span>
              </>
            ) : syncPhase === "pending" ? (
              <>
                <Loader2
                  className="size-4 animate-spin text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
                <span>Waiting to save…</span>
              </>
            ) : syncPhase === "saving" ? (
              <>
                <Loader2
                  className="text-primary size-4 animate-spin"
                  aria-hidden
                />
                <span>Saving…</span>
              </>
            ) : syncPhase === "saved" ? (
              <>
                <Check
                  className="size-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>Saved</span>
              </>
            ) : (
              <>
                <CloudOff className="size-4" aria-hidden />
                <span>Not saved — try again</span>
              </>
            )}
          </div>
          <p className="text-muted-foreground max-w-full text-[0.7rem] leading-snug sm:max-w-[16rem] sm:text-right">
            {syncPhase === "pending" &&
              "Finishing your edit before saving to the server."}
            {syncPhase === "saving" && "Writing to your profile now."}
            {syncPhase === "saved" && "You can keep editing; changes save again automatically."}
            {syncPhase === "error" &&
              "Fix your connection or try again in a moment."}
            {syncPhase === "synced" && "Nothing pending to save."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Name</CardTitle>
            <CardDescription>
              Shown in the app and used by the AI coach.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Label htmlFor="profile-name" className="sr-only">
              Name
            </Label>
            <Input
              id="profile-name"
              className="min-h-12 text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </CardContent>
        </Card>
        <Card className="border-primary/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Height</CardTitle>
            <CardDescription>
              Total inches (used for BMI with vitals weight).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Label htmlFor="profile-height" className="sr-only">
              Height (in)
            </Label>
            <Input
              id="profile-height"
              type="number"
              inputMode="decimal"
              step="any"
              className="min-h-12 text-base"
              value={heightIn}
              onChange={(e) => setHeightIn(e.target.value)}
              placeholder="e.g. 70"
            />
          </CardContent>
        </Card>
        <Card className="border-primary/15 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Goals</CardTitle>
            <CardDescription>
              Choose a primary goal. Add details below — for a preset, they
              supplement that choice; for Custom, they are your full goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div
              className="border-border grid w-full grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1 sm:grid-cols-4"
              role="tablist"
              aria-label="Primary fitness goal"
            >
              {GOAL_OPTIONS.map(({ id, label, Icon }) => {
                const selected = goalPreset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={cn(
                      "inline-flex min-h-10 flex-1 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors touch-manipulation",
                      "flex-col gap-1.5 py-2.5 text-center text-xs leading-tight sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                      selected
                        ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-inset ring-primary-foreground/20"
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground dark:hover:bg-background/40"
                    )}
                    onClick={() => setGoalPreset(id)}
                  >
                    <Icon className="size-5 shrink-0 sm:size-4" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-goals">{goalsTextLabel}</Label>
              <textarea
                id="profile-goals"
                className={textareaClass}
                value={fitnessGoals}
                onChange={(e) => setFitnessGoals(e.target.value)}
                placeholder={
                  goalPreset === "custom"
                    ? "Describe your fitness goals…"
                    : "Optional: nuance, timeline, or focus areas…"
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/15 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Apple className="text-primary size-5 shrink-0" aria-hidden />
              Daily macro goals
            </CardTitle>
            <CardDescription>
              Optional targets for calories and macros (grams). Compare with
              your nutrition log day totals.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="from-chart-2/12 border-chart-2/25 space-y-2 rounded-xl border bg-gradient-to-br to-transparent p-3">
                <Label
                  htmlFor="profile-goal-calories"
                  className="text-muted-foreground gap-1.5 text-xs"
                >
                  <Flame className="text-chart-2 size-3.5 shrink-0" aria-hidden />
                  Calories (kcal)
                </Label>
                <Input
                  id="profile-goal-calories"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={50000}
                  step={1}
                  className="min-h-12 text-base tabular-nums"
                  value={goalCalories}
                  onChange={(e) => setGoalCalories(e.target.value)}
                  placeholder="e.g. 2000"
                />
              </div>
              <div className="from-chart-1/15 border-chart-1/25 space-y-2 rounded-xl border bg-gradient-to-br to-transparent p-3">
                <Label
                  htmlFor="profile-goal-protein"
                  className="text-muted-foreground gap-1.5 text-xs"
                >
                  <Beef className="text-chart-1 size-3.5 shrink-0" aria-hidden />
                  Protein (g)
                </Label>
                <Input
                  id="profile-goal-protein"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={1000}
                  step="any"
                  className="min-h-12 text-base tabular-nums"
                  value={goalProteinG}
                  onChange={(e) => setGoalProteinG(e.target.value)}
                  placeholder="e.g. 150"
                />
              </div>
              <div className="from-chart-4/15 border-chart-4/25 space-y-2 rounded-xl border bg-gradient-to-br to-transparent p-3">
                <Label
                  htmlFor="profile-goal-carbs"
                  className="text-muted-foreground gap-1.5 text-xs"
                >
                  <Wheat className="text-chart-4 size-3.5 shrink-0" aria-hidden />
                  Carbs (g)
                </Label>
                <Input
                  id="profile-goal-carbs"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={1000}
                  step="any"
                  className="min-h-12 text-base tabular-nums"
                  value={goalCarbsG}
                  onChange={(e) => setGoalCarbsG(e.target.value)}
                  placeholder="e.g. 200"
                />
              </div>
              <div className="from-chart-3/15 border-chart-3/25 space-y-2 rounded-xl border bg-gradient-to-br to-transparent p-3">
                <Label
                  htmlFor="profile-goal-fat"
                  className="text-muted-foreground gap-1.5 text-xs"
                >
                  <Droplets className="text-chart-3 size-3.5 shrink-0" aria-hidden />
                  Fat (g)
                </Label>
                <Input
                  id="profile-goal-fat"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={1000}
                  step="any"
                  className="min-h-12 text-base tabular-nums"
                  value={goalFatG}
                  onChange={(e) => setGoalFatG(e.target.value)}
                  placeholder="e.g. 65"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/15 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Preferences</CardTitle>
            <CardDescription>
              Food preferences, available equipment, schedule, and similar.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Label htmlFor="profile-preferences" className="sr-only">
              Preferences
            </Label>
            <textarea
              id="profile-preferences"
              className={textareaClass}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. high-protein meals; barbell and cables at home..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
