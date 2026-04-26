import { A as APP_BRAND_NAME } from "./router-CUOzYYmk.mjs";
const COACH_MEAL_LIBRARY_PROMPT = `I want to add new recipes or go-to meals to my recipe library in ${APP_BRAND_NAME}. Please guide me one step at a time based on my tastes and goals, then save them to my library with ingredients and nutrition details. If I paste a recipe link, use scrape_recipe_url to load the page, then create_meal_library_item with what you extract (I'll correct macros if needed).`;
const COACH_MEAL_PLAN_PROMPT = "I want to build or update my weekly meal plan in the app. Please guide me one step at a time using my macro targets and preferences, pull from or add to my recipe library, assign meals for the week, and reuse ingredients across meals to simplify shopping when possible.";
export {
  COACH_MEAL_PLAN_PROMPT as C,
  COACH_MEAL_LIBRARY_PROMPT as a
};
