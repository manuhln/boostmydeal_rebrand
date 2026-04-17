# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BoostMyDeal is a multi-tenant SaaS platform for managing AI-powered voice agents. The frontend is a Next.js 16 App Router application located in the `front/` directory. There is no backend in this repo — the frontend communicates with an external REST API via `NEXT_PUBLIC_API_URL`.

## Commands

All commands run from `front/`:

```bash
cd front
npm install          # install dependencies
npm run dev          # start dev server (port 3000)
npm run build        # production build (note: tsconfig has ignoreBuildErrors: true)
npm run lint         # ESLint
npm start            # start production server
```

Docker (from repo root):

```bash
docker compose up --build   # builds and runs on port 3000
```

## Architecture

### Route Groups

Three Next.js route groups under `front/app/`:
- `(auth)/` — login, signup, OTP verification, org selection. Minimal layout, no sidebar.
- `(app)/` — main application pages (dashboard, agents, calls, workflows, etc.). Sidebar layout with `lg:ml-64`.
- `wizard/` — 6-step onboarding wizard for new organizations.

### Data Layer

- **API Client** (`lib/api-client.ts`): Custom fetch wrapper with Bearer token auth and automatic 401 token refresh. Methods: `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.delete()`.
- **TanStack Query** (`lib/query-client.ts`): Global error handling — 401 redirects to `/login`, 403 shows permission toast, 5xx shows server error toast. Default stale time: 60s, retries: 2 (for < 500 errors).
- **Query Keys** (`lib/query-keys.ts`): Centralized factory pattern, e.g. `queryKey.Agent.list(page)`.
- **Domain Types** (`lib/types.ts`): All TypeScript interfaces for the domain (User, Organization, AIAgent, Call, Workflow, etc.).

### Hook Pattern

All data hooks in `hooks/` follow the same TanStack Query pattern:
- Read: `useQuery` with keys from `query-keys.ts` and `api.get()`
- Write: `useMutation` with `api.post()/put()/patch()/delete()` + `queryClient.invalidateQueries()` on success

### UI Stack

- **shadcn/ui** (New York style) + Radix UI primitives — components in `components/ui/`
- **Tailwind CSS 4** with OKLch color variables defined in `app/globals.css`
- **CVA** for component variants, `tailwind-merge` via `cn()` helper in `lib/utils.ts`
- **Recharts** for analytics charts, **React Flow 11** for the visual workflow builder
- **Sonner** for toast notifications
- **next-themes** for dark/light mode (storage key: `boostmydeal-theme`)

### Auth Flow

OTP-based: email → send OTP → verify OTP → select organization → redirect to dashboard. Token stored client-side, sent as Bearer header. Multi-tenant via organization selection after login.

### Path Aliases

`@/*` maps to the `front/` directory root (configured in tsconfig.json).

## Environment

- `NEXT_PUBLIC_API_URL` — backend API base URL (required)
- Node 20 (Docker uses node:20-alpine)
