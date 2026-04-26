import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { APP_BRAND_NAME } from "@/lib/brand";
import { DbProvider } from "@/lib/client/db/provider";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "../styles/globals.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
      { title: `${APP_BRAND_NAME} \u2014 workouts & nutrition` },
      {
        name: "description",
        content: "Log workouts and meals from the gym floor",
      },
      {
        name: "theme-color",
        content: "#0f766e",
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: "#1e1e22",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
});

function RootShell() {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <DbProvider>
            <Outlet />
          </DbProvider>
          <Toaster richColors position="top-center" />
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}
