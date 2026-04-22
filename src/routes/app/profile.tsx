import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProfile, useProfileMutations } from "@/lib/stores/profile";
import { clearTokens } from "@/lib/client/token-storage";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

const PRESETS = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "gain_muscle", label: "Gain muscle" },
  { value: "build_strength", label: "Build strength" },
  { value: "custom", label: "Custom" },
] as const;

function ProfilePage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { saveProfile } = useProfileMutations();

  const [form, setForm] = useState({
    heightIn: "",
    goalPreset: "custom" as (typeof PRESETS)[number]["value"],
    fitnessGoals: "",
    preferences: "",
    goalCalories: "",
    goalProteinG: "",
    goalCarbsG: "",
    goalFatG: "",
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!profile || dirty) return;
    setForm({
      heightIn: profile.heightIn?.toString() ?? "",
      goalPreset: profile.goalPreset,
      fitnessGoals: profile.fitnessGoals ?? "",
      preferences: profile.preferences ?? "",
      goalCalories: profile.goalCalories?.toString() ?? "",
      goalProteinG: profile.goalProteinG?.toString() ?? "",
      goalCarbsG: profile.goalCarbsG?.toString() ?? "",
      goalFatG: profile.goalFatG?.toString() ?? "",
    });
  }, [profile, dirty]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const num = (v: string) =>
          v.trim() === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null;
        await saveProfile({
          heightIn: num(form.heightIn),
          goalPreset: form.goalPreset,
          fitnessGoals: form.fitnessGoals || null,
          preferences: form.preferences || null,
          goalCalories: num(form.goalCalories),
          goalProteinG: num(form.goalProteinG),
          goalCarbsG: num(form.goalCarbsG),
          goalFatG: num(form.goalFatG),
        });
        setDirty(false);
      }}
      className="space-y-4 max-w-xl"
    >
      <h1 className="text-2xl font-semibold">Profile</h1>

      <label className="block">
        <span className="text-sm">Height (inches)</span>
        <input
          value={form.heightIn}
          onChange={(e) => update("heightIn", e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm">Goal preset</span>
        <select
          value={form.goalPreset}
          onChange={(e) =>
            update("goalPreset", e.target.value as typeof form.goalPreset)
          }
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Fitness goals</span>
        <textarea
          value={form.fitnessGoals}
          onChange={(e) => update("fitnessGoals", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm">Preferences / allergies</span>
        <textarea
          value={form.preferences}
          onChange={(e) => update("preferences", e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="grid grid-cols-4 gap-2">
        <label className="block">
          <span className="text-xs">kcal</span>
          <input
            value={form.goalCalories}
            onChange={(e) => update("goalCalories", e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs">P (g)</span>
          <input
            value={form.goalProteinG}
            onChange={(e) => update("goalProteinG", e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs">C (g)</span>
          <input
            value={form.goalCarbsG}
            onChange={(e) => update("goalCarbsG", e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs">F (g)</span>
          <input
            value={form.goalFatG}
            onChange={(e) => update("goalFatG", e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm">
          Save
        </button>
        <button
          type="button"
          onClick={async () => {
            await clearTokens();
            await navigate({ to: "/login" });
          }}
          className="text-sm text-destructive"
        >
          Sign out
        </button>
      </div>
    </form>
  );
}
