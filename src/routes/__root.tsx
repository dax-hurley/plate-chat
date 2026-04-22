import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { DbProvider } from "@/lib/client/db/provider";
import "../styles/globals.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Trainlog" },
      { name: "theme-color", content: "#0a0a0a" },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  shellComponent: RootShell,
});

function RootShell() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <DbProvider>
          <Outlet />
        </DbProvider>
        <Scripts />
      </body>
    </html>
  );
}
