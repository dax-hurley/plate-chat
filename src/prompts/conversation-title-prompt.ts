/** Prompt for turning a short coach transcript into a JSON title. */
export function buildConversationTitlePrompt(transcript: string): string {
  return `Here is a fitness coaching chat between a user and an assistant:

${transcript}

Write a short conversation title (max 8 words) that captures the main topic. No quotes, no trailing punctuation, no "Chat about".

Return ONLY valid JSON: {"title":"..."}`;
}
