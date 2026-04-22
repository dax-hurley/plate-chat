import type { ReactNode } from "react";

import { NutritionSubNav } from "./nutrition-sub-nav";

export default function NutritionLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <NutritionSubNav />
      {children}
    </div>
  );
}
