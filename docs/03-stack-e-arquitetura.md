# Stack e Arquitetura

## Visão geral

O projeto será uma aplicação web fullstack com Next.js, site público e painel administrativo no mesmo repositório.

A arquitetura será modular por domínio para facilitar manutenção e evolução.

## Stack oficial

| Camada | Tecnologia |
|---|---|
| Framework | Next.js App Router |
| Linguagem | TypeScript |
| UI base | shadcn/ui |
| Estilização | Tailwind CSS |
| Banco | Supabase PostgreSQL |
| Autenticação | Supabase Auth |
| Storage | Supabase Storage |
| Deploy | Vercel |
| Validação | Zod |
| Formulários | React Hook Form |
| Ícones | Lucide React |
| Tabelas | TanStack Table + shadcn |
| Gráficos | Recharts/shadcn charts |
| E-mails transacionais | Resend |
| Reviews | Google Business Profile API |
| Anti-spam | Cloudflare Turnstile |
| Design source | Paper MCP |

## Áreas do sistema

1. Site público.
2. Painel administrativo.
3. Server Actions / Route Handlers.
4. Banco Supabase.
5. Storage de imagens e arquivos.
6. Integrações externas.

## Estrutura de pastas prevista

```txt
src/
  app/
    (site)/
    admin/
    api/

  components/
    ui/
    leehov/
      site/
      admin/
      shared/

  features/
    caravans/
    blog/
    leads/
    newsletter/
    testimonials/
    popups/
    settings/
    media/
    emails/
    webhooks/

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

## Princípio modular

Cada módulo deve conter sua própria estrutura lógica.

Exemplo para `features/caravans`:

```txt
features/caravans/
  actions.ts
  queries.ts
  schema.ts
  types.ts
  components/
  utils.ts
```

## Site público

Rotas principais:

1. `/`
2. `/caravanas`
3. `/caravanas/[slug]`
4. `/destinos`
5. `/viagens-em-grupo`
6. `/quem-somos`
7. `/blog`
8. `/blog/[slug]`
9. `/contato`
10. `/politica-de-privacidade`

## Admin

Rotas principais:

1. `/admin/login`
2. `/admin`
3. `/admin/caravanas`
4. `/admin/caravanas/novo`
5. `/admin/caravanas/[id]`
6. `/admin/blog`
7. `/admin/blog/novo`
8. `/admin/blog/[id]`
9. `/admin/leads`
10. `/admin/newsletter`
11. `/admin/depoimentos`
12. `/admin/popups`
13. `/admin/midia`
14. `/admin/configuracoes`
15. `/admin/webhooks`
16. `/admin/usuarios`

## Integrações previstas

1. Google Analytics 4, configurado via admin/Supabase.
2. Google Tag Manager, configurado via admin/Supabase.
3. Meta Pixel, configurado via admin/Supabase.
4. Google Business Profile API para reviews.
5. Resend para e-mails transacionais.
6. Cloudflare Turnstile para proteção dos formulários.
7. Webhooks server-side para eventos do sistema.
8. WhatsApp com mensagem personalizada por caravana.

## Regras técnicas

1. Usar TypeScript estrito.
2. Validar formulários com Zod.
3. Usar Server Actions ou Route Handlers para operações sensíveis.
4. Não expor chaves privadas no client.
5. Aplicar RLS no Supabase.
6. Visitantes só visualizam conteúdos publicados.
7. Leads podem ser criados publicamente, mas só lidos por admin.
8. Uploads apenas para usuários autenticados.
9. O admin deve exigir autenticação.
10. Design deve seguir o Paper MCP e o design system.
11. Secrets e API keys devem ficar em `.env` ou ambiente seguro.
12. Analytics, GTM e Pixel devem ser editáveis no admin e salvos no Supabase.
