"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useCoachRuntime } from "@/components/app/coach-runtime";

export default function CoachPage() {
  const { openCoach } = useCoachRuntime();
  const router = useRouter();

  useEffect(() => {
    openCoach();
    router.replace("/app");
  }, [openCoach, router]);

  return (
    <p className="text-muted-foreground text-center text-sm">
      Opening the coach…
    </p>
  );
}
