# Spec: Backend fixes pending after frontend auth integration

> Discovered during the frontend auth integration (June 2026, see
> [frontend-auth-spec.md](frontend-auth-spec.md)). Drop this file in
> the backend repo (`HogarBudgetV2`) so the next backend session has
> the full diagnosis in context.

## Issue 1 — Missing `id` field in list response DTOs 🔴 CRITICAL

### Symptom
After the 403 fix (commit `81b5ea9 refactor controllers and services to
return DTOs`), the list endpoints stopped exposing the entity `id`.
Frontend has no way to identify which row to edit/delete.

### Verified via curl
```
GET /egreso/categorias
→ [{"nombreCategoria":"Investimentos","montoPresupuestado":1000000,"fija":false}, ...]
                                                                       ↑
                                                       no "id" field

GET /ingresos/fijos
→ {"content":[{"nombre":"Samantha Moreno Peralta","cantidad":450000,"fecha":"2025-11-05"}, ...], ...}
                                                                                              ↑
                                                                             no "id" field
```

### Affected endpoints
- `GET /ingresos/fijos`
- `GET /ingresos/variables`
- `GET /egreso/categorias`
- `GET /egreso/detalle`

### Impact
- **Demo mode (read-only):** No visible impact — mutation buttons are hidden by the frontend (`isDemo` flag).
- **Authenticated users with own data:** Edit and Delete buttons are non-functional once the user refreshes the page after creating items. POST works (backend returns the entity with `id`), but on next GET the `id` is lost, breaking PUT/DELETE flows.

### Fix
Add the `id` field to each list DTO. Each DTO's constructor (which already takes an Entity) just needs:

```java
public DatosIngresoFijo(IngresoFijo entity) {
    this.id = entity.getId();         // <-- add
    this.nombre = entity.getNombreIngreFi();
    this.cantidad = entity.getMontoPresupuestado();
    this.fecha = entity.getFecha();
}
```

DTOs to update:
- `DatosIngresoFijo` (used in `/ingresos/fijos` list)
- `DatosIngresoVariable` (used in `/ingresos/variables` list)
- `DatosEgresoCategoria` (used in `/egreso/categorias` list)
- `DatosEDSalida` (used in `/egreso/detalle` list)

Add `private Long id;` field to each record/class and update constructors.

### Verification
After backend redeploy, hit any of the four endpoints with a valid token and verify each item in the response includes `"id": <number>`. Then on frontend, Edit + Delete buttons should work for an authenticated user's own data.

---

## Issue 2 — JWT does not include `nome` claim 🟡 NICE TO HAVE

### Symptom
The JWT token issued by `POST /api/auth/login` includes only:
```json
{ "sub": "1", "email": "demo@hogarbudget.com", "iat": ..., "exp": ... }
```

The user's `nome` is missing, so the frontend Navbar currently displays the username part of the email (e.g., `"demo"` for `demo@hogarbudget.com`) instead of the actual name.

### Fix
In `JwtService.java`:

```java
public String generateToken(Long usuarioId, String email, String nome) {
    return Jwts.builder()
            .subject(String.valueOf(usuarioId))
            .claim("email", email)
            .claim("nome", nome)               // <-- add
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey())
            .compact();
}
```

In `AuthService.login()`, pass `usuario.getNome()`:

```java
String token = jwtService.generateToken(usuario.getId(), usuario.getEmail(), usuario.getNome());
```

### Impact if not fixed
Frontend keeps showing the email-prefix as the display name. Acceptable but less personalized.

---

## Issue 3 — Register endpoint returns 201 with empty body 🟢 OPTIONAL

### Symptom
`POST /api/auth/register` returns `201 Created` with no body. The frontend's `fetch().json()` flow throws on empty body, causing the user to see "Error al crear la cuenta" **even though the account was successfully created**.

### Current state
- **Backend (no change):** still returns 201 + empty body
- **Frontend (already fixed):** `lib/api.ts` now treats empty bodies as `null` regardless of status code. Register works correctly from the user's perspective.

### Backend fix (optional, for API consistency)
Return a small JSON body so any HTTP client behaves predictably:

```java
@PostMapping("/register")
public ResponseEntity<Map<String, Object>> register(@RequestBody @Valid DatosRegistro datos) {
    Usuario usuario = authService.registrar(datos);  // returns the saved user
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("id", usuario.getId(), "email", usuario.getEmail()));
}
```

`AuthService.registrar()` currently returns `void` — change to return the saved `Usuario` (or just the id).

### Why low priority
Frontend already handles empty bodies for all status codes. This is purely defensive: helps any future API client (mobile app, CLI, third party) that may be stricter.

---

## Priority summary

| Priority | Issue | Blocking? |
|---|---|---|
| 🔴 Critical | `id` field missing in list DTOs | Yes — Edit/Delete broken for real users |
| 🟡 Optional | JWT missing `nome` claim | No — affects only UX polish |
| 🟢 Optional | Register response empty body | No — frontend already handles it |

Tackle Issue 1 first. The other two are quality-of-life and can wait.
