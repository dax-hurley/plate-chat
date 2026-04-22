import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultErrorComponent: ({ error }) => (
      <div style={{ padding: 24 }}>
        <h1>Something went wrong</h1>
        <pre>{String((error as Error)?.message ?? error)}</pre>
      </div>
    ),
    defaultNotFoundComponent: () => (
      <div style={{ padding: 24 }}>
        <h1>Not found</h1>
      </div>
    ),
  });
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
