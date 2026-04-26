import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Dumbbell,
  MessagesSquare,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/app/brand-mark";
import { AuthThemeMenu } from "@/components/theme-appearance";
import { Button } from "@/components/ui/button";
import { APP_BRAND_NAME } from "@/lib/brand";
import { loadTokens } from "@/lib/client/token-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: `${APP_BRAND_NAME} — your AI workout & nutrition coach`,
      },
      {
        name: "description",
        content:
          "Chat with an AI coach that remembers your training and meals, log workouts at the gym, and keep food tracking simple—all in one app.",
      },
    ],
  }),
  component: MarketingPage,
});

const features = [
  {
    icon: Bot,
    title: "A coach that remembers what you actually did",
    body: "Your last session, your meals, your goals—it's all there. So when you ask for help, you get suggestions that fit you, not a one-size-fits-all script.",
  },
  {
    icon: MessagesSquare,
    title: "Stuck? Ask like you're texting a trainer",
    body: 'Plateaus, "what should I train today?", food questions, or a sore joint—you can spell it out in your own words and get ideas for your next gym day.',
  },
  {
    icon: Sparkles,
    title: "Help that stays with you between visits",
    body: "Check in with your coach when motivation dips, when your schedule blows up, or when you just want a second opinion—without booking a call or waiting for a reply.",
  },
  {
    icon: Dumbbell,
    title: "Log lifts without losing your place on the floor",
    body: "Built for real workouts: routines you can follow, sets you can tick off, and a history you can look back on when you want to see how far you've come.",
  },
  {
    icon: UtensilsCrossed,
    title: "Food logging that doesn't feel like homework",
    body: "Keep meals organized, pull ideas from your library, and spend less time typing and more time eating—so nutrition supports your training instead of fighting it.",
  },
] as const;

function MarketingPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const t = await loadTokens();
      setAuthed(Boolean(t?.userId));
    })();
  }, []);

  return (
    <div className="from-background via-background to-primary/5 text-foreground relative min-h-dvh bg-gradient-to-b">
      <AuthThemeMenu />
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-14 md:pt-20">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark className="size-11 [&_svg]:size-6 shadow-md shadow-primary/15" />
            <span className="font-heading text-lg font-semibold tracking-tight">
              {APP_BRAND_NAME}
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
            {authed ? (
              <Button render={<Link to="/app" />} size="lg">
                Open app
                <ArrowRight data-icon="inline-end" />
              </Button>
            ) : (
              <>
                <Button render={<Link to="/login" />} variant="ghost" size="lg">
                  Sign in
                </Button>
                <Button render={<Link to="/register" />} size="lg">
                  Get started
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </>
            )}
          </nav>
        </header>

        <main className="mt-16 flex flex-1 flex-col sm:mt-20 md:mt-28">
          <div className="max-w-2xl">
            <p className="text-primary mb-4 text-sm font-medium tracking-wide uppercase">
              AI coaching · workouts · food
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-[3.25rem] md:leading-[1.08]">
              Your gym coach, in your pocket—plus the log to back it up.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed text-pretty">
              {APP_BRAND_NAME} pairs an AI coach with simple workout and meal
              tracking. The more you log, the smarter the conversation gets—so
              you're not starting from zero every time you open the app.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              {authed ? (
                <Button render={<Link to="/app" />} size="lg" className="h-10 px-5">
                  Continue to app
                  <ArrowRight data-icon="inline-end" />
                </Button>
              ) : (
                <>
                  <Button
                    render={<Link to="/register" />}
                    size="lg"
                    className="h-10 px-5"
                  >
                    Create free account
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                  <Button
                    render={<Link to="/login" />}
                    variant="outline"
                    size="lg"
                    className="h-10 px-5"
                  >
                    I already have an account
                  </Button>
                </>
              )}
            </div>
          </div>

          <ul className="mt-20 grid gap-4 sm:mt-24 sm:grid-cols-2 lg:gap-5">
            {features.map(({ icon: Icon, title, body }, index) => (
              <li
                key={title}
                className={
                  index === 0
                    ? "border-border/80 bg-card/80 text-card-foreground ring-border/60 rounded-2xl border p-6 shadow-sm ring-1 backdrop-blur-sm sm:col-span-2 lg:border-primary/20 lg:ring-primary/15 lg:bg-gradient-to-br lg:from-primary/[0.06] lg:to-card/80"
                    : "border-border/80 bg-card/80 text-card-foreground ring-border/60 rounded-2xl border p-6 shadow-sm ring-1 backdrop-blur-sm"
                }
              >
                <div className="bg-primary/12 text-primary mb-4 inline-flex size-10 items-center justify-center rounded-xl">
                  <Icon className="size-5" strokeWidth={2} aria-hidden />
                </div>
                <h2 className="font-heading text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </main>

        <footer className="text-muted-foreground mt-20 border-t border-border/70 pt-8 text-center text-sm sm:mt-24">
          <p>
            © {new Date().getFullYear()} {APP_BRAND_NAME}. All rights reserved.
          </p>
          {!authed ? (
            <p className="mt-3">
              <Link
                to="/login"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
              <span aria-hidden className="mx-2">
                ·
              </span>
              <Link
                to="/register"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Register
              </Link>
            </p>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
