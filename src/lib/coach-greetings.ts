/** Stable index 0..n-1 from a string (same input → same pick across renders). */
function bucketFromId(id: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % modulo;
}

const NEW_CHAT_SUBTITLES = [
  "Your AI Personal Trainer",
  "Training, nutrition, and your Trainlog context",
  "Ready when you are",
  "Let's make the next session count",
  "Here to help you train smarter",
] as const;

const EMPTY_STATE_LEADS = [
  "Ask anything about training, recovery, or what you're logging in Trainlog.",
  "Wondering about programming, form, or fueling your workouts? Start here.",
  "I can use your workouts, meals, and vitals—ask me anything.",
  "Stuck on a plateau, a meal plan, or rest days? Pick a topic below or type your own.",
  "From rep schemes to macros—what do you want to dig into today?",
] as const;

/** Subtitle under "Coach Miles" when the thread is still titled "New chat". */
export function coachNewChatSubtitle(conversationId: string): string {
  return NEW_CHAT_SUBTITLES[
    bucketFromId(conversationId, NEW_CHAT_SUBTITLES.length)
  ]!;
}

/** Lead line when the conversation has no messages yet. */
export function coachEmptyStateLead(conversationId: string): string {
  return EMPTY_STATE_LEADS[
    bucketFromId(`empty:${conversationId}`, EMPTY_STATE_LEADS.length)
  ]!;
}
