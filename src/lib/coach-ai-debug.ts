function parseCoachAiDebugValue(raw: string | undefined): boolean {
  if (raw == null || raw === "") return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

/**
 * Server / API routes: tool logs, context-preview, token metadata on messages.
 * Use bracket access so env is not stripped at compile time when unset.
 */
export function isCoachAiDebugEnabled(): boolean {
  return parseCoachAiDebugValue(process.env["COACH_AI_DEBUG"]);
}

/** Server logs for each coach tool invocation (input + result + timing, or thrown error). */
export function withCoachToolDebugLog<T>(
  toolName: string,
  input: unknown,
  run: () => Promise<T>
): Promise<T> {
  if (!isCoachAiDebugEnabled()) {
    return run();
  }
  const inputStr = coachToolDebugPreview(input, 12_000);
  console.log(`[coach/tool] ${toolName} ▶`, { input: inputStr });
  const start = performance.now();
  return run().then(
    (result) => {
      const ms = Math.round(performance.now() - start);
      console.log(
        `[coach/tool] ${toolName} ◀ ok ${ms}ms`,
        coachToolDebugPreview(result, 12_000)
      );
      return result;
    },
    (err: unknown) => {
      console.error(`[coach/tool] ${toolName} ✖`, err);
      throw err;
    }
  );
}

export function coachToolDebugPreview(value: unknown, maxChars: number): string {
  try {
    const s =
      typeof value === "string"
        ? value
        : JSON.stringify(
            value,
            (_k, v) => (typeof v === "bigint" ? v.toString() : v)
          );
    if (s.length <= maxChars) return s;
    return `${s.slice(0, maxChars)}… [truncated, ${s.length} chars]`;
  } catch {
    return String(value).slice(0, maxChars);
  }
}

/**
 * Client bundle: context inspector, composer token hints, per-message token row.
 * Prefer `COACH_AI_DEBUG` / `NEXT_PUBLIC_COACH_AI_DEBUG` at runtime (SSR);
 * otherwise use `__COACH_AI_DEBUG_CLIENT__` from Vite (see `vite.config.mts`),
 * which mirrors `COACH_AI_DEBUG` at dev/build for the browser.
 */
export function isCoachAiDebugUiEnabled(): boolean {
  const fromProcess =
    process.env["COACH_AI_DEBUG"] ?? process.env["NEXT_PUBLIC_COACH_AI_DEBUG"];
  if (fromProcess != null && String(fromProcess).trim() !== "") {
    return parseCoachAiDebugValue(fromProcess);
  }
  return parseCoachAiDebugValue(__COACH_AI_DEBUG_CLIENT__);
}
