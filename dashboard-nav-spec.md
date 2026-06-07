# Spec: Dashboard cards as primary navigation (hub-and-spoke model)

> Replaces the horizontal navbar with the existing dashboard cards
> as the navigation entry points. Each feature page gets a single
> "back to dashboard" link.

## Context

Today the app has two parallel navigation systems:
- **Navbar** (top, sticky): logo, "Ingresos" dropdown, "Categorías", "Gastos"
- **Dashboard cards**: purely informational — 4 stat cards + Saldo + category breakdown

The user wants to consolidate: **the dashboard cards become the navigation**, eliminating the navbar from feature pages. This trades a small UX cost (2-click navigation between non-adjacent features) for a cleaner, more focused look.

## Navigation model: hub-and-spoke

```
                    [Dashboard]  ← hub
                   /     |     \  \
                  /      |      \  \
        [Ingresos    [Ingresos  [Cat.  [Gastos]
         Fijos]      Variables]  egreso]
              \           \     /     /
               \           \   /     /
                 back to dashboard
```

To go from one feature page to another:
1. Click "← Dashboard" → arrive at dashboard
2. Click target card → arrive at destination

## Card → route mapping

| Card on dashboard | Destination | Reasoning |
|---|---|---|
| `Ingresos Fijos` | `/ingresos/fijos` | Direct |
| `Ingresos Variables` | `/ingresos/variables` | Direct |
| `Presupuestado` | `/egresos/categorias` | Where budgets are defined |
| `Gastos Reales` | `/egresos/detalle` | Where individual expenses live |
| `Saldo Disponible` | **(not clickable)** | Derived metric, no canonical page |
| Each row in `Gastos por Categoría` | `/egresos/detalle` | Drill down into spending detail |

**Why Saldo is non-clickable:** it's a calculation (`ingresos − gastos`), not a category of data. Making it a link would confuse the model.

## UX details

### Visual affordance for clickable cards
The existing `.glass` cards already have a subtle hover effect (box-shadow). For clickability:
- Add `cursor: pointer`
- Strengthen hover: small `translateY(-2px)` lift, brighter border, optional glow
- Add a subtle `→` arrow in the top-right corner (very low opacity, becomes brighter on hover)
- Keyboard: cards must be focusable (use `<Link>` not `<div onClick>`)

### Saldo card stays distinct
To clearly signal that Saldo is **not** clickable while the others are:
- No hover lift
- No `→` arrow
- Keep its current glow-pulse animation (already different from the stat cards)

### Feature page header (back navigation)
Each of the 4 feature pages gets a back link at the very top:

```
← Volver al dashboard
```

Placement: above the existing page header (the icon + gradient title block).
Style: small, subtle. Same color tokens as the existing muted text.

## Files to change

### 1. `app/page.tsx` (Dashboard)
- Convert `<StatCard>` to wrap its content in `<Link href={...}>` when an `href` prop is provided
- Add `href` to the 4 stat cards (not to Saldo)
- Convert each category row in the "Gastos por Categoría" section to a `<Link>` wrapping the row
- Add hover styles (translateY, brighter border, arrow icon)

### 2. `components/Navbar.tsx`
- Add to the existing early-return: also hide when **not on auth routes** (i.e., hide always except where explicitly needed)
- OR: delete the entire Navbar import from `app/layout.tsx` and the Navbar file altogether
- **Recommendation:** delete entirely — dead code is worse than removed code

### 3. `app/layout.tsx`
- Remove the `<Navbar />` render
- Keep the `AuthProvider` and the animated background

### 4. Each of the 4 feature pages
- `app/ingresos/fijos/page.tsx`
- `app/ingresos/variables/page.tsx`
- `app/egresos/categorias/page.tsx`
- `app/egresos/detalle/page.tsx`

Add at the top of the returned JSX, above the existing header div:
```tsx
<Link
  href="/"
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "rgba(255,255,255,0.45)",
    fontSize: "0.85rem",
    marginBottom: 16,
    textDecoration: "none",
  }}
>
  ← Volver al dashboard
</Link>
```

## Implementation phases

### Phase 1 — Make dashboard cards navigable (no removals)
- Update `StatCard` to optionally render as Link
- Add href to 4 cards
- Add hover affordances
- Make category breakdown items clickable
- **Navbar stays untouched.** Both nav systems coexist.

**Result:** Cards work as navigation. Navbar still works. Risk-free additive change. **Stop here** if you want to see the new UX before going further.

### Phase 2 — Remove navbar from feature pages
- Add `← Volver al dashboard` link to each of the 4 feature pages
- Conditionally hide the Navbar in `app/layout.tsx` when path is not `/`
- Or just delete the Navbar entirely if dashboard is the only place it would show

**Result:** Hub-and-spoke is complete. Cleaner UX. Navigation between non-adjacent features takes 2 clicks (acceptable for small app).

### Phase 3 (optional) — Polish
- Add a subtle "currently on dashboard" indicator when on `/`
- Consider keyboard shortcuts (e.g., `D` to go to dashboard)
- Add `aria-label` to clickable cards for screen reader users

## Open questions

1. **Confirm cards-to-routes mapping** — especially "Presupuestado" → `/egresos/categorias` and "Gastos Reales" → `/egresos/detalle`. Are these intuitive for you, or do you want different destinations?

2. **Should the category breakdown items go to `/egresos/detalle` flat, or pre-filtered by category?** Pre-filtering is more useful but requires backend support (query param) or frontend filtering. **Recommendation:** flat for now, add filtering as Phase 4.

3. **The "Saldo" card — stay non-clickable, or link somewhere?** Recommend non-clickable.

4. **Phase 1 only, or Phase 1 + Phase 2 together?** Phase 1 alone is safe and easy to revert. Phase 2 is the actual "remove the navbar" goal but is a bigger change.

## Estimated effort

| Phase | LOC changes | Files | Risk |
|---|---|---|---|
| 1 | ~70 lines | 1 (dashboard) | Low — purely additive |
| 2 | ~30 lines | 5 (4 pages + layout) | Medium — removes existing nav |
| 3 | ~20 lines | 1-2 | Low — polish |
