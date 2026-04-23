# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server on :5173
npm run build     # tsc -b && vite build
npm run lint      # eslint
npx tsc --noEmit  # type-check only, no emit
```

No test runner is configured yet.

## Architecture

**Stack:** React 19 + TypeScript, Vite, TanStack Router v1 (code-based), TanStack Query v5, react-hook-form v7, zod v4, CSS Modules.

**Path alias:** `@/` maps to `src/` — use it for all internal imports.

**Routing** is defined entirely in [`src/lib/router.tsx`](src/lib/router.tsx). New routes are added there as `createRoute` instances and attached to `rootRoute`. The root redirects `/` → `/login`.

**Data fetching** follows this pattern:

- Plain async functions in `src/services/` hit the API and throw `Error` on non-OK responses.
- Components call `useMutation` / `useQuery` with those service functions — no fetching logic inside components.
- The shared `QueryClient` lives in [`src/lib/query-client.ts`](src/lib/query-client.ts).

**Forms** use `useForm` with `zodResolver`. Schemas live in `src/schemas/` and export both the zod schema and the inferred type (`z.infer<typeof schema>`).

**API entity types** live in `src/types/`, one file per entity (e.g. `user.ts`, `auth.ts`). Services import from there — never define entity shapes inside a service file. Form/input types (Zod-inferred) stay in `src/schemas/`.

**Styling** uses CSS Modules (`.module.css`) per component. Global CSS variables (`--blue`, `--purple`, `--surface`, etc.) are defined in [`src/index.css`](src/index.css) and available to every module. Keyframe animations defined in a module are scoped to that module automatically.

**CSS file layout:** each component lives in its own subfolder alongside its CSS module — `ComponentName/ComponentName.tsx` + `ComponentName/ComponentName.module.css`. Styles shared across 2+ sibling components go in a `styles/` folder next to them (e.g. [`src/components/workout/styles/workout.shared.module.css`](src/components/workout/styles/workout.shared.module.css)). Import both as separate named bindings and use the appropriate prefix:

```tsx
import shared from "../styles/workout.shared.module.css";
import styles from "./MyComponent.module.css";
// shared.btn for shared patterns, styles.card for component-specific
```

**What belongs in the shared module:** visual patterns repeated verbatim across ≥2 components — topbar, iconBtn, page shell, btn variants, badges, empty state, weekday pills, FAB, form error messages. **What stays in the component module:** anything unique to one component (card layouts, accordion rows, progress bars, stat grids, etc.).

**CSS units:** use `rem` for all spacing, font sizes, and sizing. Keep `px` only for borders (`1px solid`), hairlines (scan lines, dividers: `2px`, `1px`), tiny decorative dots (`5px`, `6px`), `clip-path` polygon values, `letter-spacing`, and transform values inside `@keyframes`.

**Canvas/animation logic** is extracted into hooks under `src/hooks/` (e.g. `useParticleCanvas`) so components stay declarative.

**`useEffect` policy:** only use `useEffect` for genuine side effects — DOM/canvas setup, timers, external subscriptions, and animation loops. Never use it to derive state from other state (use computed values or `useMemo` instead), and never use it to sync between two pieces of state.

**App initialization** is split across two providers in [`src/main.tsx`](src/main.tsx):

- `AuthProvider` — owns auth state (`user`, `token`, `setAuth`, `clearAuth`) and exposes `isReady: boolean` once the session check resolves.
- `AppInitProvider` ([src/context/app-init.context.tsx](src/context/app-init.context.tsx)) — collects `isReady` from all init sources, shows `LoadingOverlay` until all are ready, then renders children. **Add new initialization data sources here** — just add a new `isReady` flag and `AND` it into `allReady`.

**Dev-only tools** (TanStackRouterDevtools, ReactQueryDevtools) are guarded with `import.meta.env.DEV` — they render inside the router tree and the QueryClientProvider in [`src/main.tsx`](src/main.tsx).

## Component Structure

```
src/components/
├── ui/                          # Shared primitives — no domain logic
│   ├── Button/
│   │   ├── Button.tsx           # variant: 'primary' | 'ghost' | 'text' | 'unstyled'; state prop for data-state
│   │   └── Button.module.css
│   ├── FormField/
│   │   ├── FormField.tsx        # label + icon wrapper + input slot + error message
│   │   └── FormField.module.css # also exports .togglePw for password visibility buttons
│   ├── Input/
│   │   ├── Input.tsx
│   │   └── Input.module.css
│   ├── Textarea/
│   │   ├── Textarea.tsx
│   │   └── Textarea.module.css
│   └── icons/
│       └── icons.tsx            # UserIcon, LockIcon, KeyIcon — no CSS needed
│
├── login/
│   ├── LoginPage/
│   │   ├── LoginPage.tsx        # page root — composes canvas, glow, card, form
│   │   └── LoginPage.module.css
│   ├── LoginCard/
│   │   ├── LoginCard.tsx        # visual shell (clip-path frame, scan-line, header badge)
│   │   └── LoginCard.module.css
│   ├── LoginForm/
│   │   └── LoginForm.tsx        # orchestrator — mode/password/email state + all mutations
│   ├── ParticleCanvas/
│   │   ├── ParticleCanvas.tsx
│   │   └── ParticleCanvas.module.css
│   ├── PortalGlow/
│   │   ├── PortalGlow.tsx
│   │   └── PortalGlow.module.css
│   ├── SystemAlert/
│   │   ├── SystemAlert.tsx
│   │   └── SystemAlert.module.css
│   └── forms/                   # sub-forms rendered by LoginForm
│       ├── styles/
│       │   └── forms.shared.module.css  # shared form layout (divider, switchRow, serverError…)
│       ├── LoginCredentialsForm/
│       │   └── LoginCredentialsForm.tsx
│       ├── RegisterCredentialsForm/
│       │   └── RegisterCredentialsForm.tsx
│       └── VerifyCodeForm/
│           └── VerifyCodeForm.tsx
│
├── workout/
│   ├── styles/
│   │   └── workout.shared.module.css   # shared visual tokens (topbar, btn, badge, fab, etc.)
│   ├── WorkoutListPage/
│   │   ├── WorkoutListPage.tsx         # list + today highlight + rest-day card
│   │   └── WorkoutListPage.module.css
│   ├── WorkoutDetailPage/
│   │   ├── WorkoutDetailPage.tsx       # exercise list + edit/add sheets
│   │   └── WorkoutDetailPage.module.css
│   ├── ActiveSessionPage/
│   │   ├── ActiveSessionPage.tsx       # live session — accordion sets, localStorage persist
│   │   └── ActiveSessionPage.module.css
│   ├── SessionCompletePage/
│   │   ├── SessionCompletePage.tsx     # post-session stats
│   │   └── SessionCompletePage.module.css
│   ├── TodayWorkoutCard/
│   │   ├── TodayWorkoutCard.tsx        # highlighted today card with scan-line
│   │   └── TodayWorkoutCard.module.css
│   ├── WorkoutSummaryCard/
│   │   ├── WorkoutSummaryCard.tsx      # regular list card with day-dots
│   │   └── WorkoutSummaryCard.module.css
│   ├── CreateWorkoutSheet/
│   │   └── CreateWorkoutSheet.tsx      # bottom-sheet form (uses shared + WorkoutModal)
│   └── WorkoutModal/
│       ├── WorkoutModal.tsx            # reusable bottom-sheet / dialog shell
│       └── WorkoutModal.module.css
│
├── dashboard/
│   └── DashboardPage/
│       ├── DashboardPage.tsx
│       └── DashboardPage.module.css
│
└── loading/
    └── LoadingOverlay/
        ├── LoadingOverlay.tsx
        └── LoadingOverlay.module.css
```

### Adding a new page or component

1. Create `src/components/<domain>/<ComponentName>/` folder with `ComponentName.tsx` + `ComponentName.module.css`.
2. If the domain already has shared styles, import `shared` from `../styles/<domain>.shared.module.css` alongside the local `styles` import.
3. Add the route in [`src/lib/router.tsx`](src/lib/router.tsx) with the full subfolder path: `from '@/components/workout/WorkoutListPage/WorkoutListPage'`.
4. Use `Button` and `FormField` from `src/components/ui/` for any interactive elements.

## Design Patterns

### UI Primitives (`src/components/ui/`)

Reusable, domain-free building blocks. All interactive elements must use these instead of raw `<button>` or custom input markup.

**Button** — three variants:

- `primary` (default): full-width gradient submit button with shimmer animation and `state` prop (`idle` | `loading` | `success`).
- `ghost`: compact angled-border button (e.g. logout).
- `text`: plain text link-style button (e.g. back/cancel actions).

```tsx
<Button type="submit" state={isPending ? 'loading' : 'idle'}>▶ ENTRAR</Button>
<Button variant="ghost" onClick={logout}>SAIR DO SISTEMA</Button>
<Button variant="text" onClick={goBack}>← Voltar</Button>
```

**FormField** — wraps label + icon + input slot + error:

```tsx
<FormField
  label="Senha"
  htmlFor="password"
  icon={<LockIcon />}
  error={errors.password?.message}
>
  <input id="password" type="password" {...register("password")} />
</FormField>
```

For a password field with a visibility toggle, place the toggle button as a sibling of the input inside `FormField` and give it `className={formFieldStyles.togglePw}` (imported from `@/components/ui/FormField/FormField.module.css`).

**Icons** (`icons/icons.tsx`): `UserIcon`, `LockIcon`, `KeyIcon` — all accept an optional `className` prop.

### Orchestrator / Sub-form Split

Complex multi-step forms use an orchestrator component that owns all state and mutations, delegating rendering to focused sub-form components. Sub-forms receive plain scalar props — they are unaware of TanStack Query:

```
LoginForm (orchestrator)
  ├── mode, showPassword, pendingEmail state
  ├── four useMutation calls
  └── renders one of:
        LoginCredentialsForm  ← isPending, isError, error, onSubmit, showPassword…
        RegisterCredentialsForm
        VerifyCodeForm
```

Sub-forms live in a `forms/` subfolder next to their orchestrator and share layout styles via `forms/styles/forms.shared.module.css`.

### Service Layer

`src/services/` contains plain async functions with zero React dependencies. They own the fetch call, check `res.ok`, parse the body, and throw `Error` on failure. Components never call `fetch` directly.

```ts
export async function login(data: LoginInput): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', { ... })
  if (!res.ok) throw new Error(error.message ?? 'Falha na autenticação')
  return res.json()
}
```

### Schema-First Validation

Zod schemas in `src/schemas/` are the single source of truth for shape and validation. The TypeScript type is always inferred from the schema — never written by hand.

```ts
export const loginSchema = z.object({ ... })
export type LoginInput = z.infer<typeof loginSchema>  // never write this manually
```

### Mutation-Driven Form State

`useMutation` wraps the service call. Its state flags (`isPending`, `isSuccess`, `isError`) are the only source of truth for button labels, disabled state, and error messages — no local `useState` for async state.

```tsx
const mutation = useMutation({ mutationFn: login });
// isPending / isSuccess / isError drive the UI directly
```

### data-state Attribute for CSS-Driven State Styling

Instead of toggling class names for async states, a `data-state` attribute is set on the element and targeted in CSS. This keeps state logic in JS and visual logic in CSS cleanly separated.

```tsx
<Button state={isPending ? "loading" : isSuccess ? "success" : "idle"}>
  ...
</Button>
```

```css
.primary[data-state="success"] {
  border-color: oklch(72% 0.22 145);
}
```

### Shell / Content Component Split

Layout shells (card frame, scan-line, corner accents) are isolated in their own component and accept `children`. The form content is a separate component passed as children. This lets shell and content evolve independently.

```tsx
// LoginCard owns the visual frame; LoginForm owns the fields
<LoginCard>
  <LoginForm />
</LoginCard>
```

### Logic Extraction into Custom Hooks

Side-effectful logic that doesn't produce JSX (canvas setup, event listeners, animation loops) lives in `src/hooks/` and returns only the ref or values the component needs. The component itself stays declarative.

```tsx
// src/hooks/useParticleCanvas.ts — owns resize, rAF loop, cleanup
export function useParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    /* ...setup + return cleanup */
  }, []);
  return canvasRef;
}
```

### SVG Icons

Icons live in [`src/components/ui/icons/icons.tsx`](src/components/ui/icons/icons.tsx) as small typed functional components. No icon library dependency — each is just a `<svg>` with a `className` prop. Add new icons to that file.

### Design Token System via CSS Custom Properties

All colours, surfaces, and opacities are CSS custom properties on `:root` in `index.css`. Component modules reference tokens (`var(--blue)`, `var(--surface)`) instead of raw values, so a theme change only touches one file.
