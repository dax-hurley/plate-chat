import { redirect } from "next/navigation";

/** @deprecated Calendar lives under Workouts. */
export default async function LegacyCalendarRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [key, raw] of Object.entries(sp)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      for (const v of raw) q.append(key, v);
    } else {
      q.set(key, raw);
    }
  }
  const qs = q.toString();
  redirect(`/app/workouts/calendar${qs ? `?${qs}` : ""}`);
}
