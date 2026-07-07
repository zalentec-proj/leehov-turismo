# Prompt Mestre de Desenvolvimento

Use este prompt como base para agentes de desenvolvimento que atuarão no projeto Leehov Turismo.

## Contexto

Você está desenvolvendo o projeto **Leehov Turismo**, uma plataforma web moderna com site público e painel administrativo.

O foco do projeto é divulgar e gerenciar **caravanas e viagens em grupo acompanhadas**.

## Regra operacional

Antes de qualquer alteração no GitHub, peça aprovação explícita do responsável pelo projeto.

Não crie, altere, delete, commite, instale dependências ou modifique estrutura sem autorização.

## Antes de implementar

1. Leia todos os documentos em `/docs`.
2. Consulte o Paper via MCP para buscar as referências visuais aprovadas.
3. Use o design system definido em `docs/01-design-system.md`.
4. Use shadcn/ui apenas como base técnica.
5. Aplique a identidade visual da Leehov com Tailwind CSS.
6. Mantenha arquitetura modular por features.
7. Não implemente recursos fora do MVP sem aprovação.

## Stack

1. Next.js App Router.
2. TypeScript.
3. Tailwind CSS.
4. shadcn/ui.
5. Supabase PostgreSQL.
6. Supabase Auth.
7. Supabase Storage.
8. Zod.
9. React Hook Form.
10. Lucide React.
11. Vercel.
12. Resend.
13. Google Business Profile API.
14. Cloudflare Turnstile.

## Design

O visual deve ser:

1. Moderno.
2. Limpo.
3. Espaçado.
4. Confiável.
5. Emocional.
6. Focado em viagens em grupo.
7. Consistente com as imagens aprovadas no Paper.

Não use visual genérico de template.

## Organização modular

Criar módulos para:

1. `caravans`
2. `blog`
3. `leads`
4. `newsletter`
5. `testimonials`
6. `popups`
7. `settings`
8. `media`
9. `emails`
10. `webhooks`

Cada módulo deve conter, quando necessário:

1. `types.ts`
2. `schema.ts`
3. `queries.ts`
4. `actions.ts`
5. `components/`
6. `utils.ts`

## Site público

Implementar:

1. Home.
2. Caravanas.
3. Página individual da caravana.
4. Quem Somos.
5. Blog.
6. Post individual.
7. Contato.
8. Política de Privacidade.

## Admin

Implementar:

1. Login.
2. Dashboard.
3. Caravanas.
4. Blog.
5. Leads.
6. Newsletter.
7. Depoimentos.
8. Pop-ups.
9. Mídia.
10. Configurações.
11. Webhooks.

## Supabase

Usar Supabase para:

1. Banco PostgreSQL.
2. Auth.
3. Storage.
4. Row Level Security.

Regras:

1. Visitantes só visualizam conteúdos publicados.
2. Visitantes podem criar leads e inscrições.
3. Apenas admins/editors podem acessar dados internos.
4. Uploads apenas por usuários autenticados.

## Entrega gradual

Implementar em fases:

1. Base técnica.
2. Design system e layout.
3. Site público.
4. Admin de caravanas.
5. Blog.
6. Leads/newsletter.
7. Pop-up/depoimentos.
8. Webhooks.
9. SEO e integrações.
10. Testes e publicação.

## Não fazer sem aprovação

1. Pagamento online.
2. Reserva online.
3. Área de cliente.
4. CRM completo.
5. Multi-idioma.
6. Automação avançada.
7. Construtor visual de automações.
8. Qualquer funcionalidade fora do MVP.
