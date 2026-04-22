import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Carrot,
  Cookie,
  Croissant,
  CupSoda,
  Fish,
  FlaskConical,
  ListOrdered,
  Milk,
  MoreHorizontal,
  Bean,
  Package,
  Snowflake,
  Soup,
  SprayCan,
} from "lucide-react";

import { SHOPPING_LIST_SECTIONS } from "@/lib/shopping-list-sections";
import { cn } from "@/lib/utils";

const SECTION_ICON: Record<(typeof SHOPPING_LIST_SECTIONS)[number], LucideIcon> =
  {
    Produce: Carrot,
    "Meat & seafood": Fish,
    "Dairy & eggs": Milk,
    Bakery: Croissant,
    Frozen: Snowflake,
    Pantry: Package,
    "Canned goods": Soup,
    "Condiments & oils": FlaskConical,
    "Spices & seasonings": Bean,
    Beverages: CupSoda,
    "Snacks & misc": Cookie,
    "Non-food / household": SprayCan,
    Other: MoreHorizontal,
  };

const FALLBACK_ICON = ListOrdered;

export function ShoppingSectionIcon({
  section,
  className,
}: {
  section: string;
  className?: string;
}) {
  const Icon =
    SECTION_ICON[section as keyof typeof SECTION_ICON] ?? FALLBACK_ICON;
  return (
    <Icon
      className={cn("text-primary size-4 shrink-0", className)}
      aria-hidden
    />
  );
}

export function MealPlanDayIcon({ className }: { className?: string }) {
  return (
    <CalendarDays
      className={cn("text-primary size-4 shrink-0", className)}
      aria-hidden
    />
  );
}
