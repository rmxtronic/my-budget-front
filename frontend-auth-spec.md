# Spec: Frontend Auth & Integração com Backend JWT

> Versão escrita após inspeção do backend Spring Boot (commit `5526fb3`).
> Substitui a versão genérica anterior.

## Contexto

O backend já implementou autenticação JWT completa com isolamento de dados por usuário. Todos os endpoints de dados (que hoje o frontend consome livremente) **agora exigem token de autenticação** — ou seja, **a app está quebrada para usuários não-autenticados** até implementarmos isto.

CORS do backend só permite duas origens:
- `http://localhost:3000` (dev)
- `https://my-budget-front.vercel.app` (prod)

Qualquer outra origem (ex: preview deploys do Vercel) vai falhar.

## Modo Demo (decisão de produto)

A app suporta um **demo público read-only** para visitantes provarem antes de se cadastrar:

- Existe uma **conta especial `demo@hogarbudget.com`** no backend, que possui os dados pessoais atuais do owner (gastos, categorias, ingressos reais migrados via SQL).
- Tela de login tem botão **"Probar como demo"** que faz auto-login com credenciais da conta demo (hardcoded no frontend, públicas por design).
- Quando logado como demo, o `AuthContext` expõe `isDemo: true`. **Todos os botões de mutação** (Adicionar / Editar / Apagar / Guardar) ficam **desabilitados** ou disparam modal "Crie uma conta gratuita para guardar suas mudanças".
- Usuário pode clicar em "Crear cuenta" a qualquer momento → vai para `/auth/register` com formulário normal.

**Por que essa abordagem (vs backend read-only):** mínima mudança no backend (zero alteração no Spring Security; só uma conta a mais), toda a lógica de read-only vive no frontend onde já temos contexto sobre quais botões precisam mudar.

---

## 1. API de Auth — Referência exata

### `POST /api/auth/register` (público)

**Request body:**
```json
{
  "nome": "Ruben",
  "email": "ruben@example.com",
  "senha": "minSenhaComMin6"
}
```

Validações do backend:
- `nome`: `@NotBlank`
- `email`: `@NotBlank @Email`
- `senha`: `@NotBlank @Size(min = 6)`

**Responses:**
| Status | Body | Quando |
|---|---|---|
| `201 No Content` | (vazio) | Cadastro OK |
| `400 Bad Request` | `{"nome":"must not be blank"}` (mapa campo→erro) | Validação falhou |
| `409 Conflict` | `{"error":"Email já cadastrado"}` | Email já existe |

### `POST /api/auth/login` (público)

**Request body:**
```json
{
  "email": "ruben@example.com",
  "senha": "minSenhaComMin6"
}
```

**Responses:**
| Status | Body | Quando |
|---|---|---|
| `200 OK` | `{"token":"eyJhbGc..."}` | Login OK |
| `400 Bad Request` | `{"email":"must not be blank"}` (mapa campo→erro) | Validação falhou |
| `400 Bad Request` | `{"error":"Credenciais inválidas"}` | Email não existe OU senha errada (msg não revela qual) |

### Todos os outros endpoints (protegidos)

Hoje a [lib/api.ts](lib/api.ts) chama livremente:
- `/ingresos/fijos`, `/ingresos/variables`
- `/egreso/categorias`, `/egreso/detalle`
- etc.

**A partir deste deploy do backend, todos exigem:**
```
Authorization: Bearer <token>
```

Sem o header, o backend responde **403 Forbidden** (verificado em produção). Com token inválido/expirado, pode responder **401 Unauthorized**. O `lib/api.ts` deve tratar ambos da mesma forma: limpar token e redirecionar para `/auth/login`.

---

## 2. Mudanças no Frontend

### 2.1. [lib/api.ts](lib/api.ts) — Injetar token + tratar 401

Os TODOs já existentes no arquivo viram código real:

- Antes de cada fetch, pegar o token do `localStorage` e adicionar no header `Authorization: Bearer <token>` (se existir).
- Se a resposta for **401**, limpar token do localStorage e redirecionar para `/auth/login`.
  - Exceção: requisições para `/api/auth/*` não devem redirecionar (caso contrário entra em loop ao tentar logar).

### 2.2. `lib/auth.ts` — Novo módulo (helpers de token)

Funções pequenas centralizando o acesso ao localStorage:
- `saveToken(token: string)`
- `getToken(): string | null`
- `clearToken()`
- `isAuthenticated(): boolean` (apenas checa se há token; **não** valida)

**Por que centralizar:** se um dia mudarmos para HttpOnly cookies, só um arquivo muda.

### 2.3. `components/AuthProvider.tsx` — Context API

Provider envolvendo a árvore inteira da app. Estado:
- `token: string | null`
- `usuario: { id, email, nome } | null` (decodificado do JWT no client)
- `loading: boolean` (hidrata do localStorage no mount)
- `isDemo: boolean` — derivado: `usuario?.email === "demo@hogarbudget.com"`
- Métodos: `login(email, senha)`, `loginDemo()`, `register(nome, email, senha)`, `logout()`

**Por que loading:** ao recarregar a página, há um instante onde ainda não sabemos se o usuário está logado. Sem isso, route guards podem redirecionar erradamente.

**`loginDemo()`:** atalho que chama `login("demo@hogarbudget.com", "<senha_demo>")` internamente. Credenciais hardcoded no código (públicas por design).

### 2.4. Páginas novas

```
app/auth/
├── layout.tsx       # Layout SEM Navbar, design dedicado para auth
├── login/page.tsx   # Formulário login
└── register/page.tsx # Formulário cadastro
```

Visual: aproveitar o design system existente (`.glass-form`, `.input-glass`, `.btn-primary`). Mesma estética da app — coerência visual desde o primeiro contato.

**Login page:**
- Campos: email, senha
- Submit → `auth.login(email, senha)` → redirect para `/`
- Erro → toast vermelho (`useToast`)
- Link para `/auth/register`
- **Botão secundário "Probar como demo"** → chama `auth.loginDemo()` → redirect para `/`

**Register page:**
- Campos: nome, email, senha
- Validação client-side mínima: required + email format + senha >= 6 chars (espelhar backend)
- Submit → `auth.register(...)` → toast sucesso → redirect para `/auth/login`
- Erro 409 → mensagem específica "Esse email já está cadastrado"
- Link para `/auth/login`

### 2.5. [app/layout.tsx](app/layout.tsx) — Esconder Navbar nas rotas de auth

Hoje o layout root sempre renderiza `<Navbar />`. Precisa de lógica para esconder em `/auth/*`. Como `app/layout.tsx` é server component, fazer isso via:
- Opção A: usar `usePathname` num client wrapper component que decide se mostra Navbar
- Opção B: criar `app/auth/layout.tsx` próprio (App Router permite isso) e mover o Navbar para um layout nested no `app/(app)/layout.tsx` agrupando as páginas privadas

**Recomendo opção B** — segue a convenção do App Router e é mais limpa.

Estrutura nova:
```
app/
├── layout.tsx           # Só body + AuthProvider + background animado (sem Navbar)
├── auth/
│   ├── layout.tsx       # Layout próprio (talvez só centralizar conteúdo)
│   ├── login/page.tsx
│   └── register/page.tsx
└── (app)/               # Route group — não aparece na URL
    ├── layout.tsx       # Renderiza Navbar + ProtectedRoute
    ├── page.tsx         # ← Dashboard (movido)
    ├── ingresos/
    └── egresos/
```

### 2.6. Route guard

Em `app/(app)/layout.tsx`, antes de renderizar children:
- Esperar `AuthProvider.loading` virar `false`
- Se `!isAuthenticated`, `router.replace("/auth/login")`
- Enquanto carrega, mostrar skeleton/spinner

### 2.7. Navbar — botão de logout

Adicionar no [components/Navbar.tsx](components/Navbar.tsx):
- Desktop: à direita, depois dos links — nome do usuário + botão "Sair"
- Mobile: dentro do drawer, no fim — nome + "Sair"
- `logout()` → limpa token, redirect para `/auth/login`
- **Quando `isDemo`:** mostrar badge "DEMO" ao lado do nome, e o botão "Sair" vira "Crear cuenta" (redireciona para `/auth/register` ao invés de só fazer logout).

### 2.8. Botões de mutação — desabilitar quando demo

Em todas as páginas privadas que têm formulários ou botões de Editar/Apagar/Adicionar:
- [app/page.tsx](app/page.tsx) — nenhum (Dashboard é só leitura) ✅
- [app/ingresos/fijos/page.tsx](app/ingresos/fijos/page.tsx)
- [app/ingresos/variables/page.tsx](app/ingresos/variables/page.tsx)
- [app/egresos/categorias/page.tsx](app/egresos/categorias/page.tsx)
- [app/egresos/detalle/page.tsx](app/egresos/detalle/page.tsx)

**Padrão a usar:** o botão fica desabilitado visualmente (opacity, cursor not-allowed) e on-click abre toast/modal: "Cria conta gratuita para salvar suas mudanças". O formulário inteiro pode ficar com `pointer-events: none` ou os inputs `disabled`.

Alternativa visual: banner amarelo no topo de cada página: "🔒 Modo demo — para guardar mudanças, [crie uma conta](/auth/register)".

---

## 3. Ordem de implementação (fases incrementais)

Cada fase é commitável independentemente e a app continua funcionando entre fases (para usuário deslogado a app ainda quebra, mas é progresso visível).

### Fase 0 — Backend prep (tu fazes manualmente, antes de qualquer código frontend)
- Criar a conta demo via `POST /api/auth/register` com `{nome:"Demo", email:"demo@hogarbudget.com", senha:"<a_definir>"}`
- Anotar o `usuario_id` gerado (consultar via SQL no Aiven)
- Rodar SQL no Aiven para migrar dados existentes:
  ```sql
  UPDATE ingreso_fijo SET usuario_id = X;
  UPDATE ingreso_variable SET usuario_id = X;
  UPDATE egreso_categoria SET usuario_id = X;
  UPDATE egreso_detalle SET usuario_id = X;
  ```
- Verificar: chamar `POST /api/auth/login` com `{email:"demo@hogarbudget.com", senha:"<senha>"}` e usar o token para chamar `/egreso/detalle` — deve retornar os teus dados atuais.

**Resultado:** dados estão associados ao demo user. Frontend pode então autenticar como demo e ver tudo.

### Fase 1 — Foundation (sem UI)
- Criar `lib/auth.ts` (helpers de token)
- Atualizar `lib/api.ts` (injetar Bearer, handle 401/403)
- Criar `components/AuthProvider.tsx` + envolver no layout root (incluindo `isDemo` e `loginDemo()`)

**Resultado:** infraestrutura pronta. App ainda quebra (sem login não dá para usar), mas o terreno está preparado.

### Fase 2 — Login + redirect básico
- Criar `app/auth/layout.tsx` e `app/auth/login/page.tsx`
- Refatorar `app/layout.tsx` para esconder Navbar em `/auth/*`
- Adicionar route guard básico nas páginas privadas (redirect to login se não autenticado)

**Resultado:** Usuário pode logar (manualmente, se já tiver conta criada no backend). Navegação funciona.

### Fase 3 — Register
- Criar `app/auth/register/page.tsx`
- Link entre login ↔ register

**Resultado:** Fluxo completo de criação e entrada.

### Fase 4 — Logout + polish
- Botão de logout no Navbar (desktop + mobile drawer)
- Mostrar nome do usuário
- Melhorar erros (mensagens específicas por status)
- Loading states durante submit dos forms

**Resultado:** Experiência completa.

### Fase 5 (opcional) — Reorganizar com route group
- Mover páginas privadas para `app/(app)/...` se a opção B do 2.5 foi escolhida

---

## 4. Edge cases a tratar

| Cenário | Comportamento esperado |
|---|---|
| Token no localStorage mas expirado | Próxima request retorna 401 → `lib/api.ts` limpa token e redireciona para `/auth/login` |
| Refresh da página enquanto logado | `AuthProvider` lê localStorage no mount, mantém sessão |
| Usuário acessa `/auth/login` já estando logado | Redirecionar para `/` (não faz sentido logar de novo) |
| Usuário desloga e tenta voltar (browser back) | Route guard intercepta e manda para `/auth/login` |
| Network error / backend dormindo no Render | Toast genérico "Erro ao conectar ao servidor" — não confundir com credenciais inválidas |
| Senha < 6 chars no register (catch client) | Validar antes de enviar para o backend, mensagem clara |

---

## 5. Decisões em aberto (precisamos confirmar)

1. **Idioma das telas de auth** — UI do app é em espanhol. Manter espanhol nos labels ("Correo electrónico", "Contraseña", "Iniciar sesión", "Crear cuenta")? Ou outra preferência?

2. **Recuperação de senha** — não existe no backend hoje. Deixar de fora desta fase ou pedir para o backend implementar primeiro?

3. **Confirmação de email** — não existe no backend. Cadastro é instantâneo (cria e libera login). OK pra agora?

4. **Persistência da sessão** — JWT dura **24 horas** por default (`jwt.expiration=86400000` em `application.properties`, overridable via env var `JWT_EXPIRATION`). Decisão: implementar refresh automático ou deixar expirar e mandar logar de novo? Recomendo **deixar expirar** para esta fase — refresh tokens adicionam complexidade significativa.

5. **Dados existentes** — se já tens dados no banco criados antes da auth ser implementada, eles estão "órfãos" (sem `usuario_id`)? Precisa de migração no backend antes do frontend funcionar limpo.
