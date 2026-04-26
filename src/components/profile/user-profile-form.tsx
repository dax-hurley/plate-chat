import { useEffect, useRef, useState } from "react";
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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_BRAND_NAME } from "@/lib/brand";
import { parseProfileSex } from "@/lib/profile-demographics";
import type { GoalPreset } from "@/lib/profile-goal-preset";
import { type UserProfile, useProfileMutations } from "@/lib/stores";
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

type ProfileDraft = {
  heightIn: number | null;
  ageYears: number | null;
  sex: UserProfile["sex"];
  activityLevel: UserProfile["activityLevel"];
  goalPreset: GoalPreset;
  fitnessGoals: string | null;
  preferences: string | null;
  goalCalories: number | null;
  goalProteinG: number | null;
  goalCarbsG: number | null;
  goalFatG: number | null;
};

function parseAgeYearsField(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Math.round(Number(t));
  if (!Number.isFinite(n) || n < 1 || n > 120) return null;
  return n;
}

function snapshotFromFields(
  heightIn: string,
  ageYears: string,
  sex: string,
  activityLevel: string,
  goalPreset: GoalPreset,
  fitnessGoals: string,
  preferences: string,
  goalCalories: string,
  goalProteinG: string,
  goalCarbsG: string,
  goalFatG: string
): ProfileDraft {
  let heightNum: number | null = null;
  const t = heightIn.trim();
  if (t !== "") {
    const n = Number(t);
    if (Number.isFinite(n) && n > 0) heightNum = n;
  }
  const s = sex.trim();
  const al = activityLevel.trim();
  return {
    heightIn: heightNum,
    ageYears: parseAgeYearsField(ageYears),
    sex: s === "" ? null : parseProfileSex(s),
    activityLevel:
      al === ""
        ? null
        : al === "sedentary" ||
            al === "light" ||
            al === "moderate" ||
            al === "active" ||
            al === "very_active"
          ? al
          : null,
    goalPreset,
    fitnessGoals: fitnessGoals.trim() === "" ? null : fitnessGoals.trim(),
    preferences: preferences.trim() === "" ? null : preferences.trim(),
    goalCalories: parseCaloriesField(goalCalories),
    goalProteinG: parseGramGoalField(goalProteinG),
    goalCarbsG: parseGramGoalField(goalCarbsG),
    goalFatG: parseGramGoalField(goalFatG),
  };
}

function snapshotFromProfile(p: UserProfile | null): ProfileDraft {
  return {
    heightIn: p?.heightIn ?? null,
    ageYears: p?.ageYears ?? null,
    sex: p?.sex ?? null,
    activityLevel: p?.activityLevel ?? null,
    goalPreset: p?.goalPreset ?? "custom",
    fitnessGoals: p?.fitnessGoals ?? null,
    preferences: p?.preferences ?? null,
    goalCalories: p?.goalCalories ?? null,
    goalProteinG: p?.goalProteinG ?? null,
    goalCarbsG: p?.goalCarbsG ?? null,
    goalFatG: p?.goalFatG ?? null,
  };
}

function applyDraftToState(
  d: ProfileDraft,
  setters: {
    setHeightIn: (v: string) => void;
    setAgeYears: (v: string) => void;
    setSex: (v: string) => void;
    setActivityLevel: (v: string) => void;
    setGoalPreset: (v: GoalPreset) => void;
    setFitnessGoals: (v: string) => void;
    setPreferences: (v: string) => void;
    setGoalCalories: (v: string) => void;
    setGoalProteinG: (v: string) => void;
    setGoalCarbsG: (v: string) => void;
    setGoalFatG: (v: string) => void;
  }
) {
  setters.setHeightIn(
    d.heightIn != null && Number.isFinite(d.heightIn) ? String(d.heightIn) : ""
  );
  setters.setAgeYears(
    d.ageYears != null && Number.isFinite(d.ageYears) ? String(d.ageYears) : ""
  );
  setters.setSex(
    d.sex != null && parseProfileSex(d.sex) != null ? d.sex : ""
  );
  setters.setActivityLevel(
    d.activityLevel === "sedentary" ||
      d.activityLevel === "light" ||
      d.activityLevel === "moderate" ||
      d.activityLevel === "active" ||
      d.activityLevel === "very_active"
      ? d.activityLevel
      : ""
  );
  setters.setGoalPreset(d.goalPreset);
  setters.setFitnessGoals(d.fitnessGoals ?? "");
  setters.setPreferences(d.preferences ?? "");
  setters.setGoalCalories(fmtCaloriesInput(d.goalCalories));
  setters.setGoalProteinG(fmtGramInput(d.goalProteinG));
  setters.setGoalCarbsG(fmtGramInput(d.goalCarbsG));
  setters.setGoalFatG(fmtGramInput(d.goalFatG));
}

export function UserProfileForm({
  initialProfile,
}: {
  initialProfile: UserProfile | null;
}) {
  const { saveProfile } = useProfileMutations();
  const mounted = useRef(false);
  const baselineRef = useRef(JSON.stringify(snapshotFromProfile(initialProfile)));
  const lastRemoteKeyRef = useRef<string | null>(null);

  const [heightIn, setHeightIn] = useState(
    initialProfile?.heightIn != null && Number.isFinite(initialProfile.heightIn)
      ? String(initialProfile.heightIn)
      : ""
  );
  const [ageYears, setAgeYears] = useState(
    initialProfile?.ageYears != null && Number.isFinite(initialProfile.ageYears)
      ? String(initialProfile.ageYears)
      : ""
  );
  const [sex, setSex] = useState(() => {
    const s = initialProfile?.sex;
    return s != null && parseProfileSex(s) != null ? s : "";
  });
  const [activityLevel, setActivityLevel] = useState(() => {
    const a = initialProfile?.activityLevel;
    return a === "sedentary" ||
      a === "light" ||
      a === "moderate" ||
      a === "active" ||
      a === "very_active"
      ? a
      : "";
  });
  const [goalPreset, setGoalPreset] = useState<GoalPreset>(
    initialProfile?.goalPreset ?? "custom"
  );
  const [fitnessGoals, setFitnessGoals] = useState(
    initialProfile?.fitnessGoals ?? ""
  );
  const [preferences, setPreferences] = useState(
    initialProfile?.preferences ?? ""
  );
  const [goalCalories, setGoalCalories] = useState(
    fmtCaloriesInput(initialProfile?.goalCalories)
  );
  const [goalProteinG, setGoalProteinG] = useState(
    fmtGramInput(initialProfile?.goalProteinG)
  );
  const [goalCarbsG, setGoalCarbsG] = useState(
    fmtGramInput(initialProfile?.goalCarbsG)
  );
  const [goalFatG, setGoalFatG] = useState(
    fmtGramInput(initialProfile?.goalFatG)
  );

  type SyncPhase = "synced" | "pending" | "saving" | "saved" | "error";
  const [syncPhase, setSyncPhase] = useState<SyncPhase>("synced");

  useEffect(() => {
    if (initialProfile == null) {
      return;
    }
    const k = `${initialProfile.updatedAt}:${initialProfile.rev}`;
    if (lastRemoteKeyRef.current === k) {
      return;
    }
    lastRemoteKeyRef.current = k;
    const d = snapshotFromProfile(initialProfile);
    applyDraftToState(d, {
      setHeightIn,
      setAgeYears,
      setSex,
      setActivityLevel,
      setGoalPreset,
      setFitnessGoals,
      setPreferences,
      setGoalCalories,
      setGoalProteinG,
      setGoalCarbsG,
      setGoalFatG,
    });
    baselineRef.current = JSON.stringify(d);
    setSyncPhase("synced");
  }, [initialProfile?.updatedAt, initialProfile?.rev]);

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

    const draft = snapshotFromFields(
      heightIn,
      ageYears,
      sex,
      activityLevel,
      goalPreset,
      fitnessGoals,
      preferences,
      goalCalories,
      goalProteinG,
      goalCarbsG,
      goalFatG
    );
    const current = JSON.stringify(draft);
    if (current === baselineRef.current) {
      setSyncPhase((prev) => {
        if (prev === "saved" || prev === "saving") return prev;
        return "synced";
      });
      return;
    }

    setSyncPhase("pending");

    const t = window.setTimeout(async () => {
      setSyncPhase("saving");
      try {
        await saveProfile(draft);
        baselineRef.current = current;
        setSyncPhase("saved");
        toast.success("Profile saved", { duration: 2200 });
      } catch (e) {
        console.error(e);
        setSyncPhase("error");
        toast.error("Could not save profile");
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(t);
  }, [
    heightIn,
    ageYears,
    sex,
    activityLevel,
    goalPreset,
    fitnessGoals,
    preferences,
    goalCalories,
    goalProteinG,
    goalCarbsG,
    goalFatG,
    saveProfile,
  ]);

  const goalsTextLabel =
    goalPreset === "custom" ? "Goals" : "Additional Goals";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <UserRound className="size-4 shrink-0" aria-hidden />
          {`Update how ${APP_BRAND_NAME} and your coach know you. Changes save
          automatically.`}
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
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/15 md:col-span-2">
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
              className="min-h-12 text-base max-w-xs"
              value={heightIn}
              onChange={(e) => setHeightIn(e.target.value)}
              placeholder="e.g. 70"
            />
          </CardContent>
        </Card>
        <Card className="border-primary/15 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Demographics</CardTitle>
            <CardDescription>
              Optional context for your coach and plans. Syncs with your
              account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
            <div>
              <Label htmlFor="profile-age">Age (years)</Label>
              <Input
                id="profile-age"
                type="number"
                min={1}
                max={120}
                className="mt-1.5 min-h-12 text-base"
                inputMode="numeric"
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                placeholder="e.g. 32"
              />
            </div>
            <div>
              <Label htmlFor="profile-sex">Sex</Label>
              <select
                id="profile-sex"
                className="border-input bg-background focus-visible:ring-ring/50 dark:bg-input/30 mt-1.5 flex min-h-12 w-full rounded-md border px-2.5 text-base shadow-xs outline-none focus-visible:ring-2"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
              >
                <option value="">Not set</option>
                <option value="male">Man</option>
                <option value="female">Woman</option>
                <option value="transgender_man">Transgender man</option>
                <option value="transgender_woman">Transgender woman</option>
                <option value="nonbinary">Nonbinary</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">I&apos;d prefer not to say</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="profile-activity">Usual activity level</Label>
              <select
                id="profile-activity"
                className="border-input bg-background focus-visible:ring-ring/50 dark:bg-input/30 mt-1.5 flex min-h-12 w-full rounded-md border px-2.5 text-base shadow-xs outline-none focus-visible:ring-2"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
              >
                <option value="">Not set</option>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very active</option>
              </select>
            </div>
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
