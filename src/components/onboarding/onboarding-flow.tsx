import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isTextUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import {
  ArrowRight,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronUp,
  Dumbbell,
  Loader2,
  PanelTop,
  PencilLine,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Weight,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AssistantMarkdown } from "@/components/assistant-markdown";
import {
  AssistantMessageParts,
  lastAssistantMessageId,
} from "@/components/chat/assistant-message-parts";
import { MealPlanBoard } from "@/components/nutrition/meal-plan-board";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFetch } from "@/lib/client/auth-fetch";
import { useDb } from "@/lib/client/db/provider";
import { triggerSync } from "@/lib/client/db/sync";
import { useOnline } from "@/lib/client/use-online";
import { formatDayKey, mondayOfWeekContaining } from "@/lib/date-key";
import {
  MEAL_ONBOARDING_CHIPS,
  WORKOUT_ONBOARDING_CHIPS,
} from "@/lib/onboarding-chips";
import { onboardingCacheKey } from "@/lib/client/onboarding-guard";
import {
  applyOnboardingSnapshot,
  clearOnboardingProgress,
  type OnboardingPhase,
  type ProfileStep,
  PROFILE_STEPS,
  PROFILE_STEP_COUNT,
  readOnboardingProgress,
  snapshotOnboarding,
  writeOnboardingProgress,
} from "@/lib/client/onboarding-progress";
import { buildMealPlanBoardView } from "@/lib/meal-plan-board-view";
import { ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL } from "@/lib/coach-ui-only-tools";
import {
  buildOnboardingUserMessage,
  MEAL_PLAN_REFINEMENT_USER_PROMPT,
} from "@/prompts/onboarding-system-prompt";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useMealLibrary,
  useMealLibraryIngredientsForItems,
  useMealPlanMutations,
  usePlanForWeek,
  usePlanSlots,
} from "@/lib/stores";
import type { MealPlanLibraryOption } from "@/types/meal-plan";
import { type ProfileSex } from "@/lib/profile-demographics";
import { type GoalPreset, isGoalPreset } from "@/lib/profile-goal-preset";
import { APP_BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Phase = OnboardingPhase;

/** Visible assistant copy for markdown (text parts only; no reasoning/tools). */
function assistantTextForMarkdown(m: UIMessage): string {
  const parts = m.parts ?? [];
  let s = "";
  for (const p of parts) {
    if (isTextUIPart(p)) s += p.text;
  }
  return s;
}

/**
 * In meal refinement we reuse the same `useChat` as generation; the UI should only
 * show the refinement back-and-forth, not the long initial “build my week” exchange.
 */
function mealRefinementVisibleMessages(messages: UIMessage[]): UIMessage[] {
  const i = messages.findIndex(
    (m) =>
      m.role === "user" &&
      assistantTextForMarkdown(m).trim() === MEAL_PLAN_REFINEMENT_USER_PROMPT
  );
  if (i >= 0) return messages.slice(i);
  return [];
}

/** Hide flow-control tool from the refinement transcript (navigation runs via effect). */
function withoutRefinementCompleteToolForDisplay(m: UIMessage): UIMessage {
  if (m.role !== "assistant" || !m.parts?.length) return m;
  const parts = m.parts.filter(
    (p) =>
      !isToolUIPart(p) ||
      getToolName(p) !== ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL
  );
  if (parts.length === m.parts.length) return m;
  return { ...m, parts };
}

function OnboardingMealPlanReview({ weekKey }: { weekKey: string }) {
  const { ready } = useDb();
  const { ensurePlan } = useMealPlanMutations();
  const { data: plan, loading: planLoading } = usePlanForWeek(weekKey);
  const { data: slots } = usePlanSlots(plan?.id ?? null);
  const { data: library } = useMealLibrary();
  const libIds = useMemo(
    () =>
      [...new Set(slots.map((s) => s.libraryItemId).filter(Boolean))] as string[],
    [slots]
  );
  const { data: allIngs } = useMealLibraryIngredientsForItems(libIds);

  useEffect(() => {
    if (!ready) return;
    void ensurePlan(weekKey);
  }, [weekKey, ensurePlan, ready]);

  const itemsById = useMemo(() => {
    const m = new Map<
      string,
      {
        item: (typeof library)[0];
        ingredients: (typeof allIngs)[0][];
      }
    >();
    const byLib = new Map<string, (typeof allIngs)[0][]>();
    for (const ing of allIngs) {
      const arr = byLib.get(ing.libraryItemId) ?? [];
      arr.push(ing);
      byLib.set(ing.libraryItemId, arr);
    }
    for (const item of library) {
      m.set(item.id, { item, ingredients: byLib.get(item.id) ?? [] });
    }
    return m;
  }, [library, allIngs]);

  const planBoard = useMemo(() => {
    if (!plan) return null;
    return buildMealPlanBoardView(
      { id: plan.id, weekStartDayKey: plan.weekStartDayKey },
      slots,
      itemsById
    );
  }, [plan, slots, itemsById]);

  const libraryOptions: MealPlanLibraryOption[] = useMemo(
    () => library.map((i) => ({ id: i.id, name: i.name })),
    [library]
  );

  if (!ready || planLoading || !plan || !planBoard) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground text-center text-sm">
          Loading your week…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {libraryOptions.length === 0 ? (
        <div
          className={cn(
            "border-primary/15 bg-card text-muted-foreground rounded-xl border p-4 text-sm shadow-sm"
          )}
        >
          Your recipe library is empty. Add meals in{" "}
          <Link
            to="/app/nutrition/library"
            className="text-primary font-medium underline"
          >
            Recipe library
          </Link>{" "}
          first, then you can assign them here.
        </div>
      ) : null}
      <MealPlanBoard
        weekStartDayKey={weekKey}
        plan={planBoard}
        libraryOptions={libraryOptions}
        showWeekNav={false}
        showThisWeekHeader={false}
      />
    </div>
  );
}

function useOnboardingChat(
  id: string,
  mode: "meal_plan" | "workout",
  weekKey: string,
  mealPlanRefinement = false
) {
  const mealRefinementRef = useRef(mealPlanRefinement);
  mealRefinementRef.current = mealPlanRefinement;
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/onboarding/chat",
        fetch: authFetch,
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            mode,
            weekStartDayKey: weekKey,
            messages,
            mealPlanRefinement:
              mode === "meal_plan" ? mealRefinementRef.current : false,
          },
        }),
      }),
    [mode, weekKey]
  );
  return useChat({
    id,
    transport,
    onFinish: () => {
      void triggerSync();
    },
  });
}

function assistantHasDisplayableContent(m: UIMessage) {
  for (const p of m.parts ?? []) {
    if (isTextUIPart(p) && p.text.trim()) return true;
    if (isToolUIPart(p)) return true;
  }
  return false;
}

function OnboardingMealRefinementPanel({
  weekKey,
  messages,
  status,
  errorText,
  onSend,
  onRegenerateMessage,
  onRetry,
  onBack,
  onContinue,
  continueLabel,
  finishing,
  online,
  busy,
  headerEnd,
  retrying,
  stepIndex,
  stepTotal,
}: {
  weekKey: string;
  messages: UIMessage[];
  status: "ready" | "submitted" | "streaming" | "error";
  errorText: string | undefined;
  onSend: (text: string) => void;
  onRegenerateMessage: (messageId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
  finishing: boolean;
  online: boolean;
  busy: boolean;
  headerEnd: ReactNode;
  retrying: boolean;
  stepIndex: number;
  stepTotal: number;
}) {
  const [line, setLine] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dismissedQuickByAssistantId, setDismissedQuickByAssistantId] =
    useState<Record<string, true>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasError = status === "error" || Boolean(errorText);

  const sendWithDismiss = useCallback(
    (text: string) => {
      const aid = lastAssistantMessageId(messages);
      if (aid) {
        setDismissedQuickByAssistantId((d) => ({ ...d, [aid]: true }));
      }
      onSend(text);
    },
    [messages, onSend]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = line.trim();
    if (!t || busy || !online) {
      if (!online) toast.error("You need a connection to send a message.");
      return;
    }
    setLine("");
    sendWithDismiss(t);
  };

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  };

  const onQuickReply = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      sendWithDismiss(t);
    },
    [sendWithDismiss]
  );

  const visibleMessages = useMemo(
    () => mealRefinementVisibleMessages(messages),
    [messages]
  );
  const lastAssistantId = useMemo(
    () =>
      visibleMessages.filter((m) => m.role === "assistant").at(-1)?.id ?? null,
    [visibleMessages]
  );

  const seenRefinementCompleteToolCallIds = useRef<Set<string>>(new Set());
  const refinementCompleteInitRef = useRef(false);

  function collectRefinementCompleteSuccessIds(msgs: UIMessage[]): string[] {
    const ids: string[] = [];
    const tool = ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL;
    for (const m of msgs) {
      for (const p of m.parts ?? []) {
        if (!isToolUIPart(p) || getToolName(p) !== tool) continue;
        if (p.state !== "output-available") continue;
        const out = p.output as { ok?: boolean } | undefined;
        if (out == null || typeof out !== "object" || out.ok !== true) continue;
        const toolCallId =
          "toolCallId" in p && typeof p.toolCallId === "string"
            ? p.toolCallId
            : null;
        if (toolCallId != null) ids.push(toolCallId);
      }
    }
    return ids;
  }

  useEffect(() => {
    if (!refinementCompleteInitRef.current && messages.length > 0) {
      refinementCompleteInitRef.current = true;
      for (const id of collectRefinementCompleteSuccessIds(messages)) {
        seenRefinementCompleteToolCallIds.current.add(id);
      }
      return;
    }
    if (!refinementCompleteInitRef.current) return;

    for (const m of messages) {
      for (const p of m.parts ?? []) {
        if (!isToolUIPart(p)) continue;
        if (getToolName(p) !== ONBOARDING_MEAL_REFINEMENT_COMPLETE_TOOL) {
          continue;
        }
        if (p.state !== "output-available") continue;
        const out = p.output as { ok?: boolean } | undefined;
        if (out == null || typeof out !== "object" || out.ok !== true) {
          continue;
        }
        const toolCallId =
          "toolCallId" in p && typeof p.toolCallId === "string"
            ? p.toolCallId
            : null;
        if (toolCallId == null) continue;
        if (seenRefinementCompleteToolCallIds.current.has(toolCallId)) {
          continue;
        }
        seenRefinementCompleteToolCallIds.current.add(toolCallId);
        if (finishing) return;
        onContinue();
        return;
      }
    }
  }, [messages, onContinue, finishing]);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleMessages, status, errorText]);

  return (
    <>
      <OnboardingStepShell
        title="Refine your meal plan"
        description="Chat with the assistant about changes — tap a suggestion or type your own."
        stepIndex={stepIndex}
        stepTotal={stepTotal}
        onBack={onBack}
        showBack
        headerEnd={headerEnd}
        compactLayout
        footer={
          <div className="flex w-full flex-col gap-2">
            {errorText ? (
              <p className="text-destructive text-sm" role="alert">
                {errorText}
              </p>
            ) : null}
            {hasError ? (
              <Button
                type="button"
                variant="secondary"
                className="h-10 w-full"
                onClick={onRetry}
                disabled={busy || retrying}
              >
                {retrying || busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                Try again
              </Button>
            ) : null}
            <form onSubmit={onSubmit} className="shrink-0">
              <div
                className={cn(
                  "border-input bg-background relative rounded-lg border shadow-sm transition-colors",
                  busy && "border-primary/35 bg-muted/25",
                  "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
                )}
              >
                <textarea
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder="Ask for a swap, a lighter day, or a new idea… (Enter to send)"
                  rows={2}
                  className="placeholder:text-muted-foreground w-full min-h-[2.75rem] resize-y border-0 bg-transparent py-1.5 pr-11 pl-2.5 text-sm leading-snug outline-none"
                  disabled={!online || busy}
                  autoComplete="off"
                  aria-label="Message"
                />
                <div className="absolute right-1.5 bottom-1.5">
                  <Button
                    type="submit"
                    size="icon"
                    className="size-8 shrink-0"
                    disabled={!line.trim() || !online || busy}
                    aria-label="Send"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                </div>
              </div>
            </form>
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full touch-manipulation gap-1.5 text-sm"
              onClick={() => setDrawerOpen(true)}
            >
              <PanelTop className="size-3.5 shrink-0" aria-hidden />
              View this week’s plan
            </Button>
            <Button
              type="button"
              className="min-h-12 w-full text-base"
              onClick={onContinue}
              disabled={finishing}
            >
              {continueLabel}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        }
      >
        <div
          ref={scrollRef}
          className="text-muted-foreground min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-0.5 py-0.5 text-sm [scrollbar-gutter:stable_both_edges]"
          aria-live="polite"
        >
            {visibleMessages.length === 0 && busy ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                Preparing your chat…
              </p>
            ) : null}
            {visibleMessages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => {
                if (m.role === "user") {
                  return (
                    <div
                      key={m.id}
                      className="flex justify-end"
                    >
                      <p className="bg-primary text-primary-foreground max-w-[min(100%,20rem)] rounded-2xl px-3 py-2 text-sm font-medium whitespace-pre-wrap sm:max-w-[90%]">
                        {assistantTextForMarkdown(m) || "…"}
                      </p>
                    </div>
                  );
                }
                const isLastAssistant = m.id === lastAssistantId;
                const showHold =
                  busy &&
                  isLastAssistant &&
                  !assistantHasDisplayableContent(m);
                return (
                  <div key={m.id} className="flex justify-start">
                    <div
                      className={cn(
                        "max-w-full min-w-0 space-y-2 rounded-2xl border px-2.5 py-2 sm:max-w-[95%] sm:px-3",
                        "bg-muted/40 border-border/60"
                      )}
                    >
                      {showHold ? (
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Loader2 className="size-4 shrink-0 animate-spin" />
                          Replying…
                        </p>
                      ) : null}
                      <AssistantMessageParts
                        message={withoutRefinementCompleteToolForDisplay(m)}
                        dismissedQuickReplies={
                          dismissedQuickByAssistantId[m.id] === true
                        }
                        onQuickReply={onQuickReply}
                        onRegenerate={() => {
                          void onRegenerateMessage(m.id);
                        }}
                        busy={busy}
                        online={online}
                        showRegenerateAndTokenRow={false}
                        showOfflineStyling={false}
                      />
                    </div>
                  </div>
                );
              })}
        </div>
      </OnboardingStepShell>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="bottom"
          className="min-h-0 max-h-[88dvh] gap-0 overflow-hidden rounded-t-2xl p-0"
          showCloseButton
        >
          <div
            className="border-border flex shrink-0 flex-col items-center border-b border-dashed py-1.5"
            aria-hidden
          >
            <div
              className="bg-muted-foreground/30 h-1 w-9 shrink-0 rounded-full"
            />
            <ChevronUp
              className="text-muted-foreground/50 mt-0.5 size-5"
              strokeWidth={2.25}
              aria-hidden
            />
          </div>
          <SheetHeader className="shrink-0 border-0 px-3 pt-1 pb-2 sm:pt-2">
            <SheetTitle>Your week</SheetTitle>
            <SheetDescription>
              The plan in the app right now. Close to keep chatting.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4 pt-1 sm:px-4">
            <OnboardingMealPlanReview weekKey={weekKey} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** Total inches from feet + inches (US); inches 0–11. */
function totalInchesFromParts(
  feetStr: string,
  inchesStr: string
): number | null {
  const ft = feetStr.trim();
  const ins = inchesStr.trim();
  if (ft === "") return null;
  const f = Number(ft);
  if (!Number.isFinite(f) || f < 2 || f > 8) return null;
  const inchPart = ins === "" ? 0 : Number(ins);
  if (!Number.isFinite(inchPart) || inchPart < 0 || inchPart > 11) return null;
  const total = Math.round(f) * 12 + Math.round(inchPart);
  if (total < 20 || total > 96) return null;
  return total;
}

function parseIntField(raw: string, min: number, max: number): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n);
}

function OnboardingStepShell({
  title,
  description,
  stepIndex,
  stepTotal,
  onBack,
  showBack,
  headerEnd,
  children,
  footer,
  compactLayout,
}: {
  title: string;
  description: string;
  stepIndex: number;
  stepTotal: number;
  onBack: () => void;
  showBack: boolean;
  /** Top-right (e.g. Skip); aligns on one row with Back. */
  headerEnd?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  /** Tighter vertical rhythm so a scrollable region (e.g. chat) gets more room. */
  compactLayout?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className={cn("shrink-0 px-1", compactLayout ? "pt-0" : "pt-1")}>
        {showBack || headerEnd ? (
          <div
            className={cn("flex w-full min-h-9 items-center pr-0.5", compactLayout ? "mb-0" : "mb-1")}
          >
            {showBack ? (
              <Button
                type="button"
                variant="ghost"
                className="touch-manipulate -ms-1 h-9 shrink-0 gap-1 px-2 text-muted-foreground"
                onClick={onBack}
              >
                <ChevronLeft className="size-5" />
                Back
              </Button>
            ) : null}
            {headerEnd ? (
              <div className="ms-auto flex h-9 min-w-0 items-center justify-end">
                {headerEnd}
              </div>
            ) : null}
          </div>
        ) : null}
        <p
          className={cn(
            "text-muted-foreground text-center text-xs font-medium tabular-nums",
            compactLayout ? "mb-0.5" : "mb-1"
          )}
        >
          Step {stepIndex} of {stepTotal}
        </p>
        <div className={cn("flex justify-center gap-1", compactLayout ? "mb-1.5" : "mb-4")}>
          {Array.from({ length: stepTotal }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-5 rounded-full transition-colors",
                i < stepIndex - 1 && "bg-primary/55",
                i === stepIndex - 1 && "bg-primary",
                i > stepIndex - 1 && "bg-muted"
              )}
              aria-hidden
            />
          ))}
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <h1
          className={cn(
            "shrink-0 font-bold leading-tight tracking-tight",
            compactLayout ? "text-xl" : "text-2xl"
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "text-muted-foreground shrink-0 leading-relaxed",
            compactLayout ? "mt-1 text-sm" : "mt-2 text-base"
          )}
        >
          {description}
        </p>
        <div
          className={cn(
            compactLayout
              ? "mt-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-0"
              : "mt-8 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain px-0.5 pb-4 [scrollbar-gutter:stable]"
          )}
        >
          {children}
        </div>
      </div>
      <div
        className={cn(
          "bg-background/95 border-border supports-[padding:max(0px)]:pb-[max(0.75rem,env(safe-area-inset-bottom))] relative z-20 -mx-1 shrink-0 border-t px-1 backdrop-blur",
          compactLayout ? "pt-2 pb-3" : "pt-3 pb-4"
        )}
      >
        {footer}
      </div>
    </div>
  );
}

function OnboardingChipsPage({
  title,
  description,
  stepIndex,
  stepTotal,
  chips,
  selected,
  onToggle,
  onBack,
  onContinue,
  continueLabel,
  disabled,
  headerEnd,
}: {
  title: string;
  description: string;
  stepIndex: number;
  stepTotal: number;
  chips: { id: string; label: string; emoji: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
  disabled?: boolean;
  headerEnd?: ReactNode;
}) {
  return (
    <OnboardingStepShell
      title={title}
      description={description}
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      onBack={onBack}
      showBack
      headerEnd={headerEnd}
      footer={
        <Button
          type="button"
          className="min-h-14 w-full text-base"
          onClick={onContinue}
          disabled={disabled}
        >
          {continueLabel}
          <ArrowRight className="size-4" />
        </Button>
      }
    >
      <p className="text-muted-foreground mb-3 text-sm font-medium">
        Tap all that apply
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const on = selected.has(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={cn(
                "inline-flex min-h-11 min-w-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-sm font-medium transition-all touch-manipulation active:scale-[0.98]",
                on
                  ? "border-primary bg-primary/12 text-foreground ring-primary/50 ring-2"
                  : "border-border bg-muted/50 text-muted-foreground"
              )}
            >
              <span className="text-lg" aria-hidden>
                {c.emoji}
              </span>
              {c.label}
              {on ? (
                <Check className="text-primary size-3.5 shrink-0" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>
    </OnboardingStepShell>
  );
}

function OnboardingNotesPage({
  title,
  description,
  stepIndex,
  stepTotal,
  notes,
  onNotes,
  onBack,
  onContinue,
  continueLabel,
  disabled,
  placeholder,
  headerEnd,
}: {
  title: string;
  description: string;
  stepIndex: number;
  stepTotal: number;
  notes: string;
  onNotes: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
  disabled?: boolean;
  placeholder: string;
  headerEnd?: ReactNode;
}) {
  return (
    <OnboardingStepShell
      title={title}
      description={description}
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      onBack={onBack}
      showBack
      headerEnd={headerEnd}
      footer={
        <Button
          type="button"
          className="min-h-14 w-full text-base"
          onClick={onContinue}
          disabled={disabled}
        >
          {continueLabel}
          <ArrowRight className="size-4" />
        </Button>
      }
    >
      <Label htmlFor="onb-step-notes" className="sr-only">
        Notes
      </Label>
      <textarea
        id="onb-step-notes"
        className="border-input bg-background focus-visible:ring-ring/50 dark:bg-input/30 min-h-36 w-full rounded-2xl border px-4 py-3.5 text-base leading-relaxed outline-none focus-visible:ring-2"
        placeholder={placeholder}
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        autoComplete="off"
        autoCorrect="on"
      />
    </OnboardingStepShell>
  );
}

function OnboardingAiResult({
  title,
  description,
  stepIndex,
  stepTotal,
  onBack,
  onGenerate,
  onContinue,
  onRetry,
  generateLabel,
  continueLabel,
  busy,
  canContinue,
  continueDisabled,
  messages,
  errorText,
  status,
  started,
  retrying,
  headerEnd,
}: {
  title: string;
  description: string;
  stepIndex: number;
  stepTotal: number;
  onBack: () => void;
  onGenerate: () => void;
  onContinue: () => void;
  onRetry: () => void;
  generateLabel: string;
  continueLabel: string;
  busy: boolean;
  canContinue: boolean;
  continueDisabled?: boolean;
  messages: UIMessage[];
  errorText: string | undefined;
  status: "ready" | "submitted" | "streaming" | "error";
  started: boolean;
  /** True while a retry request is in flight */
  retrying?: boolean;
  headerEnd?: ReactNode;
}) {
  const hasError = status === "error" || Boolean(errorText);

  return (
    <OnboardingStepShell
      title={title}
      description={description}
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      onBack={onBack}
      showBack
      headerEnd={headerEnd}
      compactLayout
      footer={
        !started ? (
          <Button
            type="button"
            className="min-h-14 w-full gap-2 text-base"
            onClick={onGenerate}
            disabled={busy}
          >
            {busy && status === "submitted" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {generateLabel}
          </Button>
        ) : canContinue ? (
          <Button
            type="button"
            className="min-h-14 w-full text-base"
            onClick={onContinue}
            disabled={busy || continueDisabled}
          >
            {continueLabel}
            <ArrowRight className="size-4" />
          </Button>
        ) : hasError && started ? (
          <Button
            type="button"
            className="min-h-14 w-full gap-2 text-base"
            onClick={onRetry}
            disabled={busy || retrying}
            variant="secondary"
          >
            {retrying || busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Try again
          </Button>
        ) : (
          <p className="text-muted-foreground min-h-14 py-2 text-center text-sm">
            {status === "submitted" || status === "streaming" ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Generating your plan in the app…
              </span>
            ) : null}
          </p>
        )
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {errorText ? (
          <p className="text-destructive shrink-0 text-sm" role="alert">
            {errorText}
          </p>
        ) : null}
        {started && messages.length > 0 ? (
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pt-0.5 [scrollbar-gutter:stable_both_edges] pb-[max(3.5rem,env(safe-area-inset-bottom,0px))]"
          >
            <Card className="border-primary/20 mb-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Assistant</CardTitle>
                <CardDescription>
                  Creating entries in the app. This can take a moment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-2">
                {(() => {
                  const lastAsst = messages
                    .filter((m) => m.role === "assistant")
                    .at(-1);
                  if (!lastAsst) return null;
                  const body = assistantTextForMarkdown(lastAsst);
                  return (
                    <div key={lastAsst.id} className="min-w-0">
                      {body ? (
                        <AssistantMarkdown content={body} />
                      ) : (status === "streaming" || status === "submitted") ? (
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                          <Loader2 className="size-4 shrink-0 animate-spin" />
                          Working…
                        </p>
                      ) : null}
                    </div>
                  );
                })()}
                {status === "streaming" || status === "submitted" ? (
                  <p
                    className="text-muted-foreground flex items-center gap-2 text-xs"
                    aria-live="polite"
                  >
                    <Loader2 className="size-3.5 shrink-0 animate-spin" />
                    Saving to your account…
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </OnboardingStepShell>
  );
}

const SEX_OPTIONS: readonly (readonly [ProfileSex, string])[] = [
  ["male", "♂️ Man"],
  ["female", "♀️ Woman"],
  ["transgender_man", "♂️ Transgender man"],
  ["transgender_woman", "♀️ Transgender woman"],
  ["nonbinary", "◻️ Nonbinary"],
  ["other", "🔀 Other"],
  ["prefer_not_to_say", "🔒 I'd prefer not to say"],
];

const ONBOARDING_GOAL_CHOICES: {
  id: GoalPreset;
  label: string;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}[] = [
  { id: "lose_weight", label: "Lose Weight", Icon: TrendingDown },
  { id: "gain_muscle", label: "Gain Muscle", Icon: Dumbbell },
  { id: "build_strength", label: "Build Strength", Icon: Weight },
  { id: "custom", label: "Custom", Icon: PencilLine },
];

const ACTIVITY_OPTIONS = [
  ["sedentary", "🪑 Sedentary", "Mostly sitting or lying"],
  ["light", "🚶 Light", "Leisurely walks, light day-to-day activity"],
  ["moderate", "🏃 Moderate", "Regular exercise a few days a week"],
  ["active", "💨 Active", "Hard exercise most days"],
  ["very_active", "🔥 Very active", "Physical job or training daily"],
] as const;

export function OnboardingFlow({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const online = useOnline();
  const weekKey = useMemo(
    () => mondayOfWeekContaining(formatDayKey()),
    []
  );
  const [phase, setPhase] = useState<Phase>("height");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [sex, setSex] = useState<ProfileSex | "">("");
  const [activity, setActivity] = useState<
    "sedentary" | "light" | "moderate" | "active" | "very_active" | ""
  >("");
  const [goalPreset, setGoalPreset] = useState<GoalPreset | "">("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [mealSelected, setMealSelected] = useState<Set<string>>(
    () => new Set()
  );
  const [workoutSelected, setWorkoutSelected] = useState<Set<string>>(
    () => new Set()
  );
  const [mealNotes, setMealNotes] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [mealStarted, setMealStarted] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [wantMeal, setWantMeal] = useState(false);
  const [wantWorkout, setWantWorkout] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);

  useLayoutEffect(() => {
    const saved = readOnboardingProgress(userId);
    if (saved) {
      applyOnboardingSnapshot(saved, {
        setPhase,
        setWantMeal,
        setWantWorkout,
        setHeightFeet,
        setHeightInches,
        setWeightLb,
        setAgeYears,
        setSex,
        setActivity,
        setGoalPreset,
        setMealSelected,
        setWorkoutSelected,
        setMealNotes,
        setWorkoutNotes,
        setMealStarted,
        setWorkoutStarted,
      });
    }
  }, [userId]);

  useEffect(() => {
    writeOnboardingProgress(
      userId,
      snapshotOnboarding({
        phase,
        wantMeal,
        wantWorkout,
        heightFeet,
        heightInches,
        weightLb,
        ageYears,
        sex,
        activity,
        goalPreset,
        mealSelected,
        workoutSelected,
        mealNotes,
        workoutNotes,
        mealStarted,
        workoutStarted,
      })
    );
  }, [
    userId,
    phase,
    wantMeal,
    wantWorkout,
    heightFeet,
    heightInches,
    weightLb,
    ageYears,
    sex,
    activity,
    goalPreset,
    mealSelected,
    workoutSelected,
    mealNotes,
    workoutNotes,
    mealStarted,
    workoutStarted,
  ]);

  const {
    messages: mealMessages,
    sendMessage: sendMeal,
    error: mealError,
    status: mealStatus,
    clearError: clearMealError,
    regenerate: regenerateMeal,
  } = useOnboardingChat(
    "onb-meal",
    "meal_plan",
    weekKey,
    phase === "meal_change_chat"
  );
  const {
    messages: workoutMessages,
    sendMessage: sendWorkout,
    error: workoutError,
    status: workoutStatus,
    clearError: clearWorkoutError,
    regenerate: regenerateWorkout,
  } = useOnboardingChat("onb-workout", "workout", weekKey);

  const mealMessagesRef = useRef(mealMessages);
  const workoutMessagesRef = useRef(workoutMessages);
  mealMessagesRef.current = mealMessages;
  workoutMessagesRef.current = workoutMessages;

  const [mealRetrying, setMealRetrying] = useState(false);
  const [workoutRetrying, setWorkoutRetrying] = useState(false);

  const mealRefinementSeedRef = useRef(false);
  useEffect(() => {
    if (phase !== "meal_change_chat" || !wantMeal) {
      mealRefinementSeedRef.current = false;
      return;
    }
    if (!online) return;
    if (mealRefinementSeedRef.current) return;
    const hasOpening = mealMessages.some(
      (m) =>
        m.role === "user" &&
        assistantTextForMarkdown(m).includes(
          "I'd like to adjust this week's meal plan"
        )
    );
    if (hasOpening) {
      mealRefinementSeedRef.current = true;
      return;
    }
    mealRefinementSeedRef.current = true;
    clearMealError();
    void sendMeal({ text: MEAL_PLAN_REFINEMENT_USER_PROMPT });
  }, [
    phase,
    wantMeal,
    online,
    mealMessages,
    clearMealError,
    sendMeal,
  ]);

  const saveProfile = useCallback(async () => {
    const totalIn = totalInchesFromParts(heightFeet, heightInches);
    const w = parseIntField(weightLb, 50, 700);
    const a = parseIntField(ageYears, 10, 120);
    if (totalIn == null) {
      toast.error("Check your height (feet 2–8, inches 0–11).");
      return;
    }
    if (w == null) {
      toast.error("Enter a valid weight in pounds.");
      return;
    }
    if (a == null) {
      toast.error("Enter a valid age in years.");
      return;
    }
    if (!sex || !activity) {
      toast.error("Select sex and activity level.");
      return;
    }
    if (!isGoalPreset(goalPreset)) {
      toast.error("Choose a training goal.");
      return;
    }
    if (!online) {
      toast.error("You need a connection to save your profile.");
      return;
    }
    setSavingProfile(true);
    try {
      const r = await authFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightIn: totalIn,
          weightLb: w,
          ageYears: a,
          sex,
          activityLevel: activity,
          goalPreset,
        }),
      });
      if (!r.ok) {
        toast.error("Could not save your profile. Try again.");
        return;
      }
      void triggerSync();
      toast.success("Profile saved");
      setPhase("goals");
    } catch (e) {
      console.error(e);
      toast.error("Could not save your profile");
    } finally {
      setSavingProfile(false);
    }
  }, [
    heightFeet,
    heightInches,
    weightLb,
    ageYears,
    sex,
    activity,
    goalPreset,
    online,
  ]);

  const goBackProfile = (current: ProfileStep) => {
    const i = PROFILE_STEPS.indexOf(current);
    if (i <= 0) return;
    setPhase(PROFILE_STEPS[i - 1]!);
  };

  const continueHeight = () => {
    const total = totalInchesFromParts(heightFeet, heightInches);
    if (total == null) {
      toast.error("Enter feet (2–8) and inches 0–11, or leave inches blank.");
      return;
    }
    setPhase("weight");
  };

  const continueWeight = () => {
    const w = parseIntField(weightLb, 50, 700);
    if (w == null) {
      toast.error("Enter a valid weight in pounds (50–700).");
      return;
    }
    setPhase("age");
  };

  const continueAge = () => {
    const a = parseIntField(ageYears, 10, 120);
    if (a == null) {
      toast.error("Enter your age in years (10–120).");
      return;
    }
    setPhase("sex");
  };

  const continueSex = () => {
    if (!sex) {
      toast.error("Select one option.");
      return;
    }
    setPhase("activity");
  };

  const continueActivity = () => {
    if (!activity) {
      toast.error("Select your usual activity level.");
      return;
    }
    setPhase("training_goal");
  };

  const nextFromGoals = () => {
    if (!wantMeal && !wantWorkout) {
      toast.error("Choose Meal planning, Workouts, or both.");
      return;
    }
    if (wantMeal) {
      setPhase("meal_chips");
      return;
    }
    if (wantWorkout) {
      setPhase("workout_chips");
    }
  };

  const mealStepTotal = 5;
  const workoutStepTotal = 3;

  const mealLabels = useMemo(
    () =>
      [...mealSelected]
        .map((id) => MEAL_ONBOARDING_CHIPS.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => `${c!.emoji} ${c!.label}`),
    [mealSelected]
  );

  const workoutLabels = useMemo(
    () =>
      [...workoutSelected]
        .map((id) => WORKOUT_ONBOARDING_CHIPS.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => `${c!.emoji} ${c!.label}`),
    [workoutSelected]
  );

  const genMeal = () => {
    if (!online) {
      toast.error("Connect to the internet to use AI for your meal plan.");
      return;
    }
    clearMealError();
    setMealStarted(true);
    const text = buildOnboardingUserMessage(mealLabels, mealNotes);
    void sendMeal({ text });
  };

  const genWorkout = () => {
    if (!online) {
      toast.error("Connect to the internet to use AI for your workout.");
      return;
    }
    clearWorkoutError();
    setWorkoutStarted(true);
    const text = buildOnboardingUserMessage(workoutLabels, workoutNotes);
    void sendWorkout({ text });
  };

  const retryMeal = useCallback(async () => {
    if (!online) {
      clearMealError();
      toast.error("You need a connection to retry.");
      return;
    }
    setMealRetrying(true);
    try {
      clearMealError();
      const lastUser = [...mealMessagesRef.current]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUser) {
        await regenerateMeal({ messageId: lastUser.id });
      } else {
        const text = buildOnboardingUserMessage(mealLabels, mealNotes);
        await sendMeal({ text });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMealRetrying(false);
    }
  }, [
    online,
    clearMealError,
    regenerateMeal,
    sendMeal,
    mealLabels,
    mealNotes,
  ]);

  const retryWorkout = useCallback(async () => {
    if (!online) {
      clearWorkoutError();
      toast.error("You need a connection to retry.");
      return;
    }
    setWorkoutRetrying(true);
    try {
      clearWorkoutError();
      const lastUser = [...workoutMessagesRef.current]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUser) {
        await regenerateWorkout({ messageId: lastUser.id });
      } else {
        const text = buildOnboardingUserMessage(workoutLabels, workoutNotes);
        await sendWorkout({ text });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorkoutRetrying(false);
    }
  }, [
    online,
    clearWorkoutError,
    regenerateWorkout,
    sendWorkout,
    workoutLabels,
    workoutNotes,
  ]);

  const finishOnboarding = useCallback(async () => {
    setFinishing(true);
    try {
      const r = await authFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markOnboardingComplete: true }),
      });
      if (!r.ok) {
        toast.error("Could not mark setup complete. Try again.");
        return;
      }
      clearOnboardingProgress(userId);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(onboardingCacheKey(userId), "1");
      }
      void triggerSync();
      await navigate({ to: "/app" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setFinishing(false);
    }
  }, [navigate, userId]);

  const runSkipOnboarding = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const r = await authFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markOnboardingComplete: true }),
      });
      if (!r.ok) {
        toast.error("Could not update your account. Try again.");
        return;
      }
      clearOnboardingProgress(userId);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(onboardingCacheKey(userId), "1");
      }
      void triggerSync();
      await navigate({ to: "/app" });
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setFinishing(false);
    }
  }, [finishing, navigate, userId]);

  const onConfirmSkip = useCallback(async () => {
    setSkipDialogOpen(false);
    await runSkipOnboarding();
  }, [runSkipOnboarding]);

  const afterMeal = () => {
    if (wantWorkout) {
      setPhase("workout_chips");
    } else {
      void finishOnboarding();
    }
  };

  const afterWorkout = () => {
    void finishOnboarding();
  };

  const mealCanContinue =
    mealStarted &&
    mealStatus === "ready" &&
    !mealError &&
    mealMessages.some((m) => m.role === "assistant");
  const workoutCanContinue =
    workoutStarted &&
    workoutStatus === "ready" &&
    !workoutError &&
    workoutMessages.some((m) => m.role === "assistant");

  const toggle = (id: string, which: "meal" | "workout") => {
    if (which === "meal") {
      setMealSelected((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
    } else {
      setWorkoutSelected((prev) => {
        const n = new Set(prev);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      });
    }
  };

  const skipButton = useMemo(
    () => (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground h-9 shrink-0 px-2.5 touch-manipulation"
        onClick={() => setSkipDialogOpen(true)}
        disabled={finishing}
      >
        Skip Setup
      </Button>
    ),
    [finishing]
  );

  /** Fill the viewport: each step scrolls its body; the shell footer stays pinned. */
  return (
    <Card
      className={cn(
        "mx-auto flex h-full min-h-0 w-full min-w-0 max-w-md flex-1 flex-col gap-0 overflow-hidden p-0 py-0 shadow-none ring-0",
        "max-h-dvh md:max-w-2xl xl:max-w-3xl",
        "rounded-none border-0 bg-transparent",
        "md:rounded-2xl md:border md:border-border/80 md:bg-card md:shadow-sm md:ring-1 md:ring-foreground/10"
      )}
    >
      <ConfirmDialog
        open={skipDialogOpen}
        onOpenChange={setSkipDialogOpen}
        title="Skip setup?"
        description="You can update your profile and goals in Settings any time."
        confirmLabel="Skip"
        cancelLabel="Continue setup"
        onConfirm={onConfirmSkip}
      />
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0 px-4 pb-0 pt-2 sm:pt-3 md:px-6 md:pt-4">
      {phase === "height" ? (
        <OnboardingStepShell
          title="How tall are you?"
          description="Use feet and inches, like a doctor’s visit — inches can be 0 or left blank if exact."
          stepIndex={1}
          stepTotal={PROFILE_STEP_COUNT}
          onBack={() => {}}
          showBack={false}
          headerEnd={skipButton}
          footer={
            <Button
              type="button"
              className="min-h-14 w-full text-base"
              onClick={continueHeight}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          }
        >
          <div className="grid min-w-0 grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label htmlFor="onb-ft" className="text-muted-foreground text-sm">
                Feet
              </Label>
              <Input
                id="onb-ft"
                inputMode="numeric"
                autoFocus
                className="mt-2 min-h-16 rounded-2xl text-center text-3xl font-semibold tabular-nums"
                value={heightFeet}
                onChange={(e) =>
                  setHeightFeet(e.target.value.replace(/\D/g, ""))
                }
                placeholder="5"
                maxLength={1}
                autoComplete="off"
                aria-describedby="height-hint"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="onb-in" className="text-muted-foreground text-sm">
                Inches
              </Label>
              <Input
                id="onb-in"
                inputMode="numeric"
                className="mt-2 min-h-16 rounded-2xl text-center text-3xl font-semibold tabular-nums"
                value={heightInches}
                onChange={(e) =>
                  setHeightInches(e.target.value.replace(/\D/g, ""))
                }
                placeholder="10"
                maxLength={2}
                autoComplete="off"
                aria-describedby="height-hint"
              />
            </div>
          </div>
          <p id="height-hint" className="text-muted-foreground mt-3 text-sm">
            Example: 5 feet 10 inches — enter 5 under feet and 10 under inches.
          </p>
        </OnboardingStepShell>
      ) : null}

      {phase === "weight" ? (
        <OnboardingStepShell
          title="What’s your weight? - Optional"
          description="In pounds, as you’d see on a typical scale in the US. This helps us calculate things like your daily calorie needs."
          stepIndex={2}
          stepTotal={PROFILE_STEP_COUNT}
          onBack={() => goBackProfile("weight")}
          showBack
          headerEnd={skipButton}
          footer={
            <Button
              type="button"
              className="min-h-14 w-full text-base"
              onClick={continueWeight}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          }
        >
          <Label htmlFor="wt" className="text-muted-foreground text-sm">
            Pounds (lb)
          </Label>
          <Input
            id="wt"
            inputMode="numeric"
            autoFocus
            className="mt-2 min-h-16 rounded-2xl text-center text-3xl font-semibold tabular-nums"
            value={weightLb}
            onChange={(e) => setWeightLb(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="180"
            aria-describedby="wt-hint"
          />
          <p id="wt-hint" className="text-muted-foreground mt-2 text-sm">
            Used with height for progress and plans.
          </p>
        </OnboardingStepShell>
      ) : null}

      {phase === "age" ? (
        <OnboardingStepShell
          title="How old are you?"
          description="We use this to tune plans and your coach’s advice."
          stepIndex={3}
          stepTotal={PROFILE_STEP_COUNT}
          onBack={() => goBackProfile("age")}
          showBack
          headerEnd={skipButton}
          footer={
            <Button
              type="button"
              className="min-h-14 w-full text-base"
              onClick={continueAge}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          }
        >
          <div className="flex flex-col items-center">
            <Label
              htmlFor="age"
              className="text-muted-foreground w-full text-center text-sm"
            >
              Age in years
            </Label>
            <Input
              id="age"
              inputMode="numeric"
              autoFocus
              className="mt-2 min-h-16 w-full max-w-[12ch] rounded-2xl text-center text-3xl font-semibold tabular-nums"
              value={ageYears}
              onChange={(e) => setAgeYears(e.target.value.replace(/\D/g, ""))}
              placeholder="32"
              maxLength={3}
            />
          </div>
        </OnboardingStepShell>
      ) : null}

      {phase === "sex" ? (
        <OnboardingStepShell
          title="How should we list your sex?"
          description="This helps with coaching context. You can change it later in Profile."
          stepIndex={4}
          stepTotal={PROFILE_STEP_COUNT}
          onBack={() => goBackProfile("sex")}
          showBack
          headerEnd={skipButton}
          footer={
            <Button
              type="button"
              className="min-h-14 w-full text-base"
              onClick={continueSex}
              disabled={!sex}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            {SEX_OPTIONS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setSex(v)}
                className={cn(
                  "flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-base font-medium touch-manipulation active:scale-[0.99]",
                  sex === v
                    ? "border-primary bg-primary/10 ring-primary/30 ring-2"
                    : "border-border bg-card"
                )}
              >
                {label}
                {sex === v ? (
                  <Check className="text-primary size-5" aria-hidden />
                ) : null}
              </button>
            ))}
          </div>
        </OnboardingStepShell>
      ) : null}

      {phase === "activity" ? (
        <OnboardingStepShell
          title="How active is your average day?"
          description="Not just workouts — think about work and daily movement."
          stepIndex={5}
          stepTotal={PROFILE_STEP_COUNT}
          onBack={() => goBackProfile("activity")}
          showBack
          headerEnd={skipButton}
          footer={
            <Button
              type="button"
              className="min-h-14 w-full text-base"
              onClick={continueActivity}
              disabled={!activity || finishing}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          }
        >
          <div className="flex flex-col gap-2">
            {ACTIVITY_OPTIONS.map(([v, label, sub]) => (
              <button
                key={v}
                type="button"
                onClick={() => setActivity(v)}
                className={cn(
                  "relative flex min-h-16 w-full flex-col items-start gap-0.5 rounded-2xl border px-4 py-3.5 pr-12 text-left touch-manipulation active:scale-[0.99]",
                  activity === v
                    ? "border-primary bg-primary/10 ring-primary/30 ring-2"
                    : "border-border bg-card"
                )}
              >
                <span className="text-base font-medium">{label}</span>
                <span className="text-muted-foreground text-xs leading-snug">
                  {sub}
                </span>
                {activity === v ? (
                  <Check
                    className="text-primary absolute end-3 top-1/2 size-5 -translate-y-1/2"
                    aria-hidden
                  />
                ) : null}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Next: choose your main training goal. Your profile is saved after
            that step.
          </p>
        </OnboardingStepShell>
      ) : null}

      {phase === "training_goal" ? (
        <OnboardingStepShell
          title="What’s your main training goal?"
          description="You can change this anytime in Profile. Optional details go in your profile’s goal notes after setup."
          stepIndex={6}
          stepTotal={PROFILE_STEP_COUNT}
          onBack={() => goBackProfile("training_goal")}
          showBack
          headerEnd={skipButton}
          footer={
            <Button
              type="button"
              className="min-h-14 w-full text-base"
              onClick={() => void saveProfile()}
              disabled={
                !isGoalPreset(goalPreset) ||
                savingProfile ||
                !online ||
                finishing
              }
            >
              {savingProfile ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Save and continue
              <ArrowRight className="size-4" />
            </Button>
          }
        >
          <div
            className="border-border grid w-full grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1 sm:grid-cols-4"
            role="tablist"
            aria-label="Primary training goal"
          >
            {ONBOARDING_GOAL_CHOICES.map(({ id, label, Icon }) => {
              const selected = goalPreset === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={label}
                  className={cn(
                    "inline-flex min-h-11 w-full min-w-0 flex-1 items-center justify-center rounded-lg px-1.5 text-xs font-medium transition-colors touch-manipulation",
                    "flex-col gap-1 py-2.5 text-center sm:flex-row sm:gap-2 sm:px-2 sm:text-sm",
                    selected
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-inset ring-primary-foreground/20"
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground dark:hover:bg-background/40"
                  )}
                  onClick={() => setGoalPreset(id)}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            {!online
              ? "You need a connection to save your profile."
              : "Saves to your account with your height, weight, and demographics."}
          </p>
        </OnboardingStepShell>
      ) : null}

      {phase === "goals" ? (
        <OnboardingStepShell
          title={`What do you want to use ${APP_BRAND_NAME} for?`}
          description="You can turn on both. We’ll take you through each one step by step."
          stepIndex={1}
          stepTotal={1}
          onBack={() => setPhase("training_goal")}
          showBack
          headerEnd={skipButton}
          footer={
            <Button
              type="button"
              className="min-h-14 w-full text-base"
              onClick={nextFromGoals}
              disabled={!wantMeal && !wantWorkout}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          }
        >
          <div className="grid gap-3">
            {(
              [
                {
                  on: wantMeal,
                  set: () => setWantMeal((v) => !v),
                  label: "Meal planning",
                  emoji: "🥗",
                },
                {
                  on: wantWorkout,
                  set: () => setWantWorkout((v) => !v),
                  label: "Workouts",
                  emoji: "💪",
                },
              ] as const
            ).map(({ on, set, label, emoji }) => (
              <button
                key={label}
                type="button"
                onClick={set}
                className={cn(
                  "hover:border-primary/40 flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left touch-manipulation active:scale-[0.99]",
                  on
                    ? "border-primary bg-primary/8 ring-primary/25 ring-2"
                    : "border-border bg-card"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {emoji}
                  </span>
                  <span className="text-base font-semibold">{label}</span>
                </span>
                {on ? <Check className="text-primary size-6" /> : null}
              </button>
            ))}
          </div>
        </OnboardingStepShell>
      ) : null}

      {phase === "meal_chips" && wantMeal ? (
        <OnboardingChipsPage
          title="Style for your first meal week"
          description="Quick taps — you can add details on the next screen."
          stepIndex={1}
          stepTotal={mealStepTotal}
          chips={MEAL_ONBOARDING_CHIPS}
          selected={mealSelected}
          onToggle={(id) => toggle(id, "meal")}
          onBack={() => setPhase("goals")}
          onContinue={() => setPhase("meal_notes")}
          continueLabel="Next"
          headerEnd={skipButton}
        />
      ) : null}

      {phase === "meal_notes" && wantMeal ? (
        <OnboardingNotesPage
          title="Anything else?"
          description="Allergies, budget, time to cook, family size — optional. This will help our AI pick recipes that are tailored to your needs."
          stepIndex={2}
          stepTotal={mealStepTotal}
          notes={mealNotes}
          onNotes={setMealNotes}
          onBack={() => setPhase("meal_chips")}
          onContinue={() => setPhase("meal_ai")}
          continueLabel="Next"
          placeholder="E.g. nut allergy, 30 min dinners, high protein…"
          headerEnd={skipButton}
        />
      ) : null}

      {phase === "meal_ai" && wantMeal ? (
        <OnboardingAiResult
          title="Build your first week of meals"
          description="We’ll create recipes and fill your week using AI. You can edit them later in Nutrition."
          stepIndex={3}
          stepTotal={mealStepTotal}
          onBack={() => setPhase("meal_notes")}
          onGenerate={genMeal}
          onContinue={() => setPhase("meal_review")}
          onRetry={retryMeal}
          generateLabel="Generate my week"
          continueLabel="Next"
          busy={mealStatus === "submitted" || mealStatus === "streaming"}
          canContinue={Boolean(mealCanContinue)}
          continueDisabled={finishing}
          messages={mealMessages}
          errorText={mealError?.message}
          status={mealStatus}
          started={mealStarted}
          retrying={mealRetrying}
          headerEnd={skipButton}
        />
      ) : null}

      {phase === "meal_review" && wantMeal ? (
        <OnboardingStepShell
          title="Review your week"
          description="Here’s what we added to your plan. Tap any meal to view the recipe and ingredients."
          stepIndex={4}
          stepTotal={mealStepTotal}
          onBack={() => setPhase("meal_ai")}
          showBack
          headerEnd={skipButton}
          footer={
            <div className="flex w-full flex-col gap-2">
              <Button
                type="button"
                className="min-h-14 w-full text-base"
                onClick={afterMeal}
                disabled={finishing}
              >
                Looks good to me!
                <ArrowRight className="size-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-14 w-full text-base"
                onClick={() => setPhase("meal_change_chat")}
                disabled={finishing}
              >
                I want to make changes
              </Button>
            </div>
          }
        >
          <OnboardingMealPlanReview weekKey={weekKey} />
        </OnboardingStepShell>
      ) : null}

      {phase === "meal_change_chat" && wantMeal ? (
        <OnboardingMealRefinementPanel
          weekKey={weekKey}
          messages={mealMessages}
          status={mealStatus}
          errorText={mealError?.message}
          onSend={(t) => {
            clearMealError();
            void sendMeal({ text: t });
          }}
          onRegenerateMessage={(id) => {
            void regenerateMeal({ messageId: id });
          }}
          onRetry={retryMeal}
          onBack={() => setPhase("meal_review")}
          onContinue={afterMeal}
          continueLabel={
            wantWorkout
              ? "I'm happy with my week — next: workout"
              : "I'm happy with my week — finish setup"
          }
          finishing={finishing}
          online={online}
          busy={mealStatus === "submitted" || mealStatus === "streaming"}
          headerEnd={skipButton}
          retrying={mealRetrying}
          stepIndex={5}
          stepTotal={mealStepTotal}
        />
      ) : null}

      {phase === "workout_chips" && wantWorkout ? (
        <OnboardingChipsPage
          title="Focus for your first workout"
          description="We’ll use these to pick exercises. You can add notes next."
          stepIndex={1}
          stepTotal={workoutStepTotal}
          chips={WORKOUT_ONBOARDING_CHIPS}
          selected={workoutSelected}
          onToggle={(id) => toggle(id, "workout")}
          onBack={() =>
            wantMeal ? setPhase("meal_review") : setPhase("goals")
          }
          onContinue={() => setPhase("workout_notes")}
          continueLabel="Next"
          headerEnd={skipButton}
        />
      ) : null}

      {phase === "workout_notes" && wantWorkout ? (
        <OnboardingNotesPage
          title="Details for your workout"
          description="Injuries, days per week, equipment limits — all optional."
          stepIndex={2}
          stepTotal={workoutStepTotal}
          notes={workoutNotes}
          onNotes={setWorkoutNotes}
          onBack={() => setPhase("workout_chips")}
          onContinue={() => setPhase("workout_ai")}
          continueLabel="Next"
          placeholder="E.g. bad left shoulder, 3x week, only dumbbells at home…"
          headerEnd={skipButton}
        />
      ) : null}

      {phase === "workout_ai" && wantWorkout ? (
        <OnboardingAiResult
          title="Create your first saved workout"
          description="The assistant will add a workout you can start from the Workouts tab."
          stepIndex={3}
          stepTotal={workoutStepTotal}
          onBack={() => setPhase("workout_notes")}
          onGenerate={genWorkout}
          onContinue={afterWorkout}
          onRetry={retryWorkout}
          generateLabel="Generate my workout"
          continueLabel="Finish setup"
          busy={
            workoutStatus === "submitted" || workoutStatus === "streaming"
          }
          canContinue={Boolean(workoutCanContinue)}
          continueDisabled={finishing}
          messages={workoutMessages}
          errorText={workoutError?.message}
          status={workoutStatus}
          started={workoutStarted}
          retrying={workoutRetrying}
          headerEnd={skipButton}
        />
      ) : null}
      </CardContent>
    </Card>
  );
}
