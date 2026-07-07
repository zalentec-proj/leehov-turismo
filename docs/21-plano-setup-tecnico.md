# Plano de Setup Técnico

Este documento descreve o plano para iniciar o projeto Next.js da Leehov Turismo.

Nenhum comando deste documento deve ser executado sem aprovação específica para a fase de setup técnico.

## Objetivo

Criar a base técnica do projeto na raiz do repositório:

```txt
/Users/jeffersonweiberpalombo/Desktop/leehov-turismo
```

O projeto não deve nascer dentro de uma subpasta.

## Pré-requisitos

1. Node.js LTS instalado.
2. npm disponível.
3. Repositório Git na raiz.
4. Documentação revisada.
5. Aprovação para iniciar setup técnico.

## Criar Next.js

Comando planejado:

```bash
npm create next-app@latest .
```

Respostas planejadas no prompt:

```txt
TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
src/ directory: Yes
App Router: Yes
Turbopack: Yes, se for o padrão estável apresentado pelo create-next-app
Import alias: @/*
```

Alternativa com flags, se a versão instalada suportar:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Regra:

1. Conferir `create-next-app --help` antes de usar flags.
2. Não sobrescrever documentos existentes.
3. Se houver conflito com `README.md`, preservar o README atual do projeto.

## TypeScript

Configuração esperada:

1. `strict: true`.
2. Alias `@/*` apontando para `src/*`.
3. Sem `any` como padrão em código de domínio.
4. Tipos compartilhados em `src/types` quando não pertencerem a uma feature.

Arquivos esperados:

```txt
tsconfig.json
next-env.d.ts
```

## Tailwind CSS

Objetivo:

1. Aplicar identidade Leehov.
2. Mapear tokens de cor, radius, sombras e tipografia.
3. Evitar visual genérico de shadcn/ui.

Tokens iniciais:

```txt
navy: #062A44
blue: #0077C8
cyan: #00AEEF
sky: #F3FAFF
surface: #F6FBFF
text: #0B1F3A
muted: #5F6F84
border: #DDEAF5
success: #22C55E
warning: #F59E0B
danger: #EF4444
```

Tokens do Paper a considerar:

```txt
--color-navy-950: #061A2A
--color-navy-800: #083C5A
--color-blue-500: #0CA8E8
--color-blue-300: #3AC6F4
--color-surface: #F6FBFF
--color-text: #183B59
--font-sans: Inter
--radius-card: 18px
```

## shadcn/ui

Comando planejado:

```bash
npx shadcn@latest init
```

Componentes planejados:

```bash
npx shadcn@latest add button card badge input textarea select checkbox switch radio-group label form tabs accordion dialog sheet dropdown-menu popover calendar table separator avatar skeleton alert tooltip breadcrumb
```

Componentes adicionais conforme necessidade:

```bash
npx shadcn@latest add command sonner chart
```

Regra:

1. shadcn/ui é base técnica.
2. Componentes finais da marca ficam em `src/components/leehov`.
3. Não usar aparência padrão sem adaptação visual.

## Estrutura de pastas

Estrutura planejada:

```txt
src/
  app/
    (site)/
      page.tsx
      caravanas/
      blog/
      contato/
      quem-somos/
      politica-de-privacidade/
    admin/
      login/
      page.tsx
      caravanas/
      blog/
      leads/
      newsletter/
      depoimentos/
      popups/
      midia/
      configuracoes/
      webhooks/
      usuarios/
    api/

  components/
    ui/
    leehov/
      site/
      admin/
      shared/

  features/
    caravans/
      actions.ts
      queries.ts
      schema.ts
      types.ts
      utils.ts
      components/
    blog/
    leads/
    newsletter/
    testimonials/
    popups/
    settings/
    media/
    emails/
    webhooks/

  emails/
    components/
    templates/

  lib/
    supabase/
    email/
    google/
    turnstile/
    webhooks/
    utils/
    validations/

  types/

supabase/
  migrations/
  seed/
```

## Dependências previstas

Produção:

```bash
npm install @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers lucide-react @tanstack/react-table recharts resend @react-email/components
```

Possíveis dependências adicionais:

```bash
npm install next-themes
```

Dev:

```bash
npm install -D react-email
```

Observações:

1. Confirmar versões atuais antes da instalação.
2. Não instalar dependências que não estejam conectadas ao MVP.
3. Evitar biblioteca de carousel pesada se um componente leve atender.

## `.env.example`

Arquivo planejado:

```env
# App
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SITE_NAME="Leehov Turismo"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Email - Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=
ADMIN_LEADS_EMAIL=
ADMIN_CONTACT_EMAIL=
ADMIN_NOTIFICATIONS_EMAIL=

# Google Business Profile
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_REFRESH_TOKEN=

# Anti-spam - Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# WhatsApp fallback
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE=
```

Regras:

1. Variáveis `NEXT_PUBLIC_*` podem ir ao browser.
2. Secrets nunca devem usar `NEXT_PUBLIC_`.
3. Analytics/GTM/Pixel devem ser configurados via admin/Supabase, não via `.env`.

## Supabase client/server

Arquivos planejados:

```txt
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
src/lib/supabase/admin.ts
```

Responsabilidades:

1. `client.ts`: client para componentes client-side com publishable key.
2. `server.ts`: client SSR usando cookies.
3. `middleware.ts`: refresh de sessão quando necessário.
4. `admin.ts`: operações server-side com secret key, nunca importado no client.

Regras:

1. Não expor service role ou secret no client.
2. Admin routes exigem usuário autenticado e perfil ativo.
3. Queries públicas devem respeitar published/active.

## Vercel

Plano:

1. Conectar repositório após setup e revisão.
2. Configurar variáveis de ambiente no painel da Vercel.
3. Validar build.
4. Configurar domínio.
5. Ativar Analytics/Speed Insights apenas se aprovado.

Não fazer nesta etapa:

1. Deploy.
2. Configuração de domínio.
3. Ativação de serviço pago.

## Resend

Plano:

1. Configurar `RESEND_API_KEY`.
2. Verificar domínio de envio.
3. Criar templates React/TSX.
4. Criar helper `sendEmail`.
5. Registrar `email_logs`.
6. Respeitar configurações do admin.

Arquivos planejados:

```txt
src/lib/email/resend.ts
src/lib/email/send-email.ts
src/lib/email/email-log.ts
src/emails/templates/
```

## Google Business Profile

Plano:

1. Configurar OAuth 2.0.
2. Armazenar client secret e refresh token em ambiente seguro.
3. Salvar Account ID e Location ID no admin/Supabase.
4. Criar serviço server-side para listar reviews.
5. Criar serviço server-side para responder review.
6. Criar serviço server-side para remover resposta da empresa.
7. Cachear avaliações em `google_reviews_cache`.

Não fazer:

1. Expor credenciais no client.
2. Chamar Google API a cada acesso público.
3. Prometer exclusão da avaliação original.

## Turnstile

Plano:

1. Usar `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no client.
2. Validar token no servidor com `TURNSTILE_SECRET_KEY`.
3. Aplicar em formulários públicos:
   - interesse em caravana;
   - contato;
   - newsletter;
   - pop-up, se captar dados.

Regra:

1. Falha na validação bloqueia criação do registro.
2. Não confiar apenas em validação client-side.

## Rotas iniciais

Site público:

```txt
/
/caravanas
/caravanas/[slug]
/quem-somos
/blog
/blog/[slug]
/contato
/politica-de-privacidade
```

Admin:

```txt
/admin/login
/admin
/admin/caravanas
/admin/blog
/admin/leads
/admin/newsletter
/admin/depoimentos
/admin/popups
/admin/midia
/admin/configuracoes
/admin/webhooks
/admin/usuarios
```

APIs/Route Handlers previstos:

```txt
/api/newsletter/confirm
/api/google/reviews/sync
/api/google/reviews/reply
/api/google/reviews/delete-reply
/api/webhooks/test
/api/webhooks/retry
```

As rotas sensíveis devem validar sessão e papel do usuário.

## Layout base

Layouts previstos:

1. `src/app/(site)/layout.tsx`: header/footer públicos.
2. `src/app/admin/layout.tsx`: shell autenticado do admin.
3. `src/app/admin/login/page.tsx`: sem sidebar.

Regras:

1. Site público deve carregar rápido.
2. Admin pode usar mais componentes client-side.
3. Metadata deve ser configurada por página.
4. Páginas não publicadas não devem ser indexadas.

## Validação do setup

Comandos planejados após setup:

```bash
npm run lint
npm run build
npm run dev
```

Validações manuais:

1. Abrir Home.
2. Abrir `/admin/login`.
3. Confirmar Tailwind ativo.
4. Confirmar shadcn/ui renderizando.
5. Confirmar alias `@/*`.
6. Confirmar que `.env.example` não contém secrets reais.

## O que não fazer no setup

1. Não configurar Supabase remoto.
2. Não aplicar migrations remotas.
3. Não configurar Vercel.
4. Não fazer deploy.
5. Não ativar Google Business Profile.
6. Não ativar Resend real.
7. Não criar pagamento, reserva online ou área do cliente.
