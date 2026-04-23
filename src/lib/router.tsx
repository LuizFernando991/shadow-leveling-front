import {
  createRouter,
  createRoute,
  createRootRouteWithContext,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { DashboardPage } from "@/components/dashboard/DashboardPage/DashboardPage";
import { LoginPage } from "@/components/login/LoginPage/LoginPage";
import { ActiveSessionPage } from "@/components/workout/ActiveSessionPage/ActiveSessionPage";
import { SessionCompletePage } from "@/components/workout/SessionCompletePage/SessionCompletePage";
import { WorkoutDetailPage } from "@/components/workout/WorkoutDetailPage/WorkoutDetailPage";
import { WorkoutListPage } from "@/components/workout/WorkoutListPage/WorkoutListPage";
import type { AuthContextValue } from "@/context/auth.context";

interface RouterContext {
  auth: AuthContextValue;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => {
    if (context.auth.user) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: "/login" });
  },
  component: DashboardPage,
});

const workoutListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workout",
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: "/login" });
  },
  component: WorkoutListPage,
});

const workoutDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workout/$workoutId",
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: "/login" });
  },
  component: function WorkoutDetailRoute() {
    const { workoutId } = workoutDetailRoute.useParams();
    return <WorkoutDetailPage workoutId={workoutId} />;
  },
});

const activeSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workout/$workoutId/session",
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: "/login" });
  },
  validateSearch: (search: Record<string, unknown>) => ({
    sessionId: typeof search.sessionId === "string" ? search.sessionId : "",
  }),
  component: function ActiveSessionRoute() {
    const { workoutId } = activeSessionRoute.useParams();
    const { sessionId } = activeSessionRoute.useSearch();
    return <ActiveSessionPage workoutId={workoutId} sessionId={sessionId} />;
  },
});

const sessionCompleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workout/$workoutId/session/complete",
  beforeLoad: ({ context }) => {
    if (!context.auth.user) throw redirect({ to: "/login" });
  },
  validateSearch: (search: Record<string, unknown>) => ({
    doneSets: Number(search.doneSets) || 0,
    totalSets: Number(search.totalSets) || 0,
    elapsed: Number(search.elapsed) || 0,
    pct: Number(search.pct) || 0,
    status: (search.status as "complete" | "incomplete") ?? "incomplete",
  }),
  component: function SessionCompleteRoute() {
    const { workoutId } = sessionCompleteRoute.useParams();
    const search = sessionCompleteRoute.useSearch();
    return (
      <SessionCompletePage
        workoutId={workoutId}
        doneSets={search.doneSets}
        totalSets={search.totalSets}
        elapsed={search.elapsed}
        pct={search.pct}
        status={search.status}
      />
    );
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  dashboardRoute,
  workoutListRoute,
  workoutDetailRoute,
  activeSessionRoute,
  sessionCompleteRoute,
]);

export const router = createRouter({
  routeTree,
  context: { auth: undefined! },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
