"use client";

import { useId } from "react";

import { AutocompleteCombobox } from "@/components/ui/autocomplete-combobox";
import type { MealPlanLibraryOption } from "@/types/meal-plan";

type LibraryMealPickerProps = {
  options: MealPlanLibraryOption[];
  value: string | null;
  onSelect: (libraryItemId: string | null) => void;
  disabled?: boolean;
  /** Accessible label for the control (e.g. slot name). */
  label: string;
};

export function LibraryMealPicker({
  options,
  value,
  onSelect,
  disabled,
  label,
}: LibraryMealPickerProps) {
  const baseId = useId();
  const emptyLibrary = options.length === 0;

  return (
    <AutocompleteCombobox
      id={`${baseId}-meal`}
      aria-label={label}
      options={options.map((o) => ({ value: o.id, label: o.name }))}
      value={value}
      onValueChange={onSelect}
      allowNone
      disabled={disabled || emptyLibrary}
      placeholder={
        emptyLibrary
          ? "Add meals in the library first"
          : "Search or choose a meal…"
      }
      emptyText="No meals match your search."
      inputClassName="h-11"
    />
  );
}
