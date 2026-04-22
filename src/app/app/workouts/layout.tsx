import type { ReactNode } from "react";

import { WorkoutsSubNav } from "./workouts-sub-nav";

export default function WorkoutsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <WorkoutsSubNav />
      {children}
    </div>
  );
}
