import { convertToModelMessages, type UIMessage } from "ai";

import { formatProfileForCoachPrompt } from "@/lib/coach-profile-context";
import { getCoachSystemPrompt } from "@/lib/coach-system-prompt";
import { createCoachTools } from "@/lib/coach-tools";
import * as profile from "@/lib/services/profile";

/**
 * Builds the same system string + model messages the coach chat route sends to the LLM.
 */
export async function getCoachModelInput(userId: string, messages: UIMessage[]) {
  const tools = createCoachTools(userId);
  const modelMessages = await convertToModelMessages(
    messages.map(({ id, ...rest }) => {
      void id;
      return rest;
    }),
    {
      tools,
      ignoreIncompleteToolCalls: true,
    }
  );
  const profileBundle = await profile.getProfileForUser(userId);
  const systemWithProfile = `${getCoachSystemPrompt()}\n\n${formatProfileForCoachPrompt(profileBundle)}`;
  const modelId =
    process.env["ANTHROPIC_MODEL"]?.trim() || "claude-haiku-4-5";
  return { systemWithProfile, modelMessages, modelId, tools };
}
