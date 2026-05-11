# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Next.js dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — run production server (after build)
- `npm run lint` — ESLint (flat config in [eslint.config.mjs](eslint.config.mjs), extending `eslint-config-next/core-web-vitals` + `/typescript`)

There is no test runner configured.

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS v4. All UI text is in Spanish.

**Frontend-only repo.** This app is a thin client over an external Spring Boot API:
- Backend hosted on **Render** at `https://hogarbudgetv2.onrender.com` (URL in [.env.local](.env.local) as `NEXT_PUBLIC_API_URL`)
- Database on **Aiven**
- Backend source: https://github.com/rmxtronic/HogarBudgetV2 (Spring Boot / Maven). Read it directly when verifying field names, request bodies, or endpoint shapes — do not edit it from this repo.

There are no Next.js API routes, no server actions, and no server components in feature pages — every page under [app/](app/) is `"use client"` and fetches the backend directly in `useEffect`.

**API layer.** All HTTP goes through the tiny client in [lib/api.ts](lib/api.ts) (`api.get/post/put/delete`). It reads `NEXT_PUBLIC_API_URL`, sets JSON headers, treats 204 as `null`, and throws `Error(message)` on non-OK. Auth header wiring is stubbed in comments — when adding auth, plug the token in there, not in individual pages.

**Domain types** are in [lib/types.ts](lib/types.ts): `IngresoFijo`, `IngresoVariable`, `EgresoCategoria`, `EgresoDetalle`, `SumCategoria`, plus a Spring-style `PageResponse<T>` for paginated endpoints.

**Backend ↔ frontend field naming is not 1:1.** The backend returns Spring entity field names that differ from frontend types — e.g. [app/ingresos/fijos/page.tsx:34-41](app/ingresos/fijos/page.tsx#L34-L41) maps `nombreIngreFi` → `nombre` and `montoPresupuestado` → `cantidad` after fetching. Expect similar remapping in other pages and verify the actual JSON shape (or the Spring entity in the backend repo) before assuming a type matches the wire format.

**Backend endpoints currently consumed** (note inconsistent singular/plural between `egreso` and `ingresos`):
- `/ingresos/fijos`, `/ingresos/fijos/total`, `/ingresos/fijos/{id}`
- `/ingresos/variables`, `/ingresos/variables/total`
- `/egreso/categorias`, `/egreso/categorias/total-presupuestado`, `/egreso/categorias/{id}`
- `/egreso/detalle`, `/egreso/detalle/actual`, `/egreso/detalle/{id}`

**Routing.** App Router under [app/](app/):
- [app/page.tsx](app/page.tsx) — Dashboard (aggregates totals + per-category breakdown)
- [app/ingresos/fijos](app/ingresos/fijos), [app/ingresos/variables](app/ingresos/variables) — income CRUD (fijos is paginated, size=5)
- [app/egresos/categorias](app/egresos/categorias) — expense categories with budgeted amounts
- [app/egresos/detalle](app/egresos/detalle) — individual expense entries linked to categories

[app/layout.tsx](app/layout.tsx) wraps everything in an animated gradient background with floating "orb" divs and renders the global [components/Navbar.tsx](components/Navbar.tsx). Path alias `@/*` maps to repo root (see [tsconfig.json](tsconfig.json)).

**Design system.** Don't write inline styles or new Tailwind classes for visuals that already have a name in [app/globals.css](app/globals.css). The vocabulary:
- Containers: `.glass`, `.glass-form`
- Inputs: `.input-glass`, `.select-glass`
- Buttons: `.btn-primary`, `.btn-danger`, `.btn-warning`, `.btn-cancel`, `.btn-page`
- States/animations: `.animate-fade-in`, `.animate-slide-out`, `.glow-pulse`, `.count-animate`, `.skeleton`, `.gradient-text`, `.float-icon`, `.toast-enter` / `.toast-exit`

Numeric stat displays go through `useAnimatedNumber` from [lib/useAnimatedNumber.ts](lib/useAnimatedNumber.ts) (cubic ease-out, 600ms). User feedback uses the toast system in [components/useToast.tsx](components/useToast.tsx) — pages instantiate `useToast()` and render `<ToastContainer toasts={toasts} />` at the bottom; never `alert()`.

**CRUD page pattern.** Each feature page follows the same shape: state for list + form fields + `editandoId` + `deletingId`, a `load()` function called in `useEffect`, a `guardar()` that branches on `editandoId` between POST and PUT, and an `eliminar()` that sets `deletingId` (used to trigger the slide-out animation) before calling DELETE. Mirror this pattern when adding new resources — see [app/egresos/categorias/page.tsx](app/egresos/categorias/page.tsx) as the cleanest reference.

**No auth yet.** [app/layout.tsx:35](app/layout.tsx#L35) and [lib/api.ts:4](lib/api.ts#L4) both have TODO markers for the eventual auth implementation (separate `/auth/*` layout without Navbar; token from `localStorage` injected into the `Authorization` header).
