/** US BMI from weight in lb and height in inches. */
export function bmiFromLbIn(weightLb: number, heightIn: number): number | null {
  if (
    !Number.isFinite(weightLb) ||
    !Number.isFinite(heightIn) ||
    heightIn <= 0 ||
    weightLb <= 0
  ) {
    return null;
  }
  return (703 * weightLb) / (heightIn * heightIn);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
