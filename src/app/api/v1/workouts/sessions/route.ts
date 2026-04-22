import { json, resolvePatUserId, unauthorized } from "@/lib/api-pat";
import * as workouts from "@/lib/services/workouts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await resolvePatUserId(request);
  if (!userId) return unauthorized();
  let body: { templateId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const templateId = body.templateId?.trim();
  if (!templateId) return json({ error: "templateId required" }, { status: 400 });
  try {
    const result = await workouts.startWorkoutFromTemplate(userId, templateId);
    return json({
      sessionId: result.session.id,
      resumed: result.kind === "existing",
    });
  } catch {
    return json({ error: "Could not start workout" }, { status: 400 });
  }
  
}
