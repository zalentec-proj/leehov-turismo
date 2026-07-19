# Execução da Sprint 01 — Supabase remoto, Admin Geral e Caravanas

Data da execução: 16 de julho de 2026. Fechamento técnico revalidado em 17 de julho de 2026.

## Resultado

A Sprint 01 foi implementada no projeto remoto **Site Leehov**, região `us-west-2`, project ref mascarado `awfc…pqzv`.

Não foram criados Supabase local, Docker, projeto adicional, branch de banco, commit, push, pull request ou deploy.

## Ambiente

1. A URL pública e a publishable key foram configuradas somente em `.env.local`, que permanece ignorado pelo Git.
2. `SUPABASE_SECRET_KEY` e os demais secrets permanecem vazios.
3. `.env.example` contém apenas nomes de variáveis vazias.
4. O limite de payload das Server Actions foi configurado em 9 MB.
5. O bucket aplica limite funcional de 8 MiB por imagem.
6. A Supabase CLI foi adicionada como dependência de desenvolvimento e o lockfile foi validado com `npm ci`.

## Migrations remotas

As migrations foram criadas pela CLI, aplicadas pelo MCP e tiveram seus timestamps locais alinhados ao registro remoto:

1. `20260716204649_extensions_and_helpers.sql`.
2. `20260716204655_profiles_and_roles.sql`.
3. `20260716204701_caravan_categories.sql`.
4. `20260716204713_caravans.sql`.
5. `20260716204719_caravan_departures_itinerary_images.sql`.
6. `20260716204725_caravan_rls.sql`.
7. `20260716204731_caravan_storage.sql`.
8. `20260716212522_harden_auth_helpers.sql`, correção de defesa em profundidade descoberta na matriz RLS.

O remoto possui as tabelas:

1. `profiles`.
2. `caravan_categories`.
3. `caravans`.
4. `caravan_departures`.
5. `caravan_itinerary_days`.
6. `caravan_images`.

Todas as seis tabelas têm RLS habilitada. A auditoria encontrou 26 índices, 41 constraints, 21 policies no schema público e 4 policies de Storage.

## Administrador geral

O backfill encontrou exatamente um usuário em Supabase Auth e criou exatamente um profile. Um SQL remoto guardado confirmou a cardinalidade antes de definir:

1. `role = admin`.
2. `active = true`.

Nenhum e-mail, senha ou metadado de autenticação foi alterado.

Novos usuários recebem automaticamente `role = editor` e `active = false`. O banco impede desativar ou rebaixar o último admin ativo.

O admin geral pode gerenciar todos os profiles, roles, ativações, categorias, caravanas e módulos do painel. Editores ativos acessam conteúdo, mas não usuários, categorias, configurações ou webhooks sensíveis.

## RLS, grants e Storage

Foram aplicados grants explícitos além das policies RLS. A matriz transacional, sempre revertida com `ROLLBACK`, produziu:

| Cenário | Caravanas visíveis | Saídas | Dias de roteiro | Staff | Admin |
|---|---:|---:|---:|---|---|
| Anônimo | 1 publicada | 2 | 3 | não | não |
| Autenticado inativo | 1 publicada | 2 | 3 | não | não |
| Editor ativo | 2 | 4 | 6 | sim | não |
| Admin ativo | 2 | 4 | 6 | sim | sim |

O teste de mutations confirmou:

1. editor alterou 2 caravanas;
2. editor alterou 0 profiles;
3. editor alterou 0 categorias;
4. admin alterou 1 profile e 5 categorias;
5. `authenticated` não possui grant de `DELETE` em `caravans`.

O bucket privado `caravan-images` foi criado com:

1. limite de 8 MiB;
2. MIME types `image/jpeg`, `image/png`, `image/webp` e `image/avif`;
3. uploads limitados a staff ativo e paths iniciados pelo UUID da caravana;
4. leitura pública somente quando o objeto está relacionado a caravana publicada;
5. URLs assinadas para paths do bucket;
6. remoção controlada que limpa Storage e referências relacionadas.

## Autenticação e painel

Foram implementados:

1. login por e-mail e senha;
2. logout;
3. validação com `getClaims()`;
4. consulta de autorização em `profiles`;
5. proxy em `/admin/:path*`;
6. route group protegido para todas as rotas, exceto `/admin/login`;
7. validação server-side no layout;
8. autorização em cada Server Action;
9. bloqueio de usuário inativo;
10. bloqueio de rotas sensíveis para editor;
11. identificação do admin geral e logout no `AdminShell`;
12. gestão de roles e ativação em `/admin/usuarios`.

Credenciais inválidas foram testadas no navegador e exibem mensagem em português sem redirect ou overlay. No fechamento da sprint, a sessão já autenticada da administradora geral foi revalidada em `/admin`, `/admin/caravanas` e `/admin/usuarios`: todas exibiram o `AdminShell`, sem retorno ao login e sem erro no console. Uma requisição sem cookies a `/admin/blog` recebeu `307` para `/admin/login?next=%2Fadmin%2Fblog`.

## Caravanas

O domínio `src/features/caravans` agora contém tipos gerados, tipos de apresentação, schemas Zod, mapeadores, queries, actions e componentes.

Queries implementadas:

1. `getPublishedCaravans`.
2. `getFeaturedCaravans`.
3. `getHeroCaravans`.
4. `getCaravanBySlug`.
5. `getAdminCaravans`.
6. `getCaravanById`.
7. `getCaravanCategories`.

O admin possui:

1. listagem TanStack Table com busca e filtro;
2. criação e edição;
3. formulário em oito abas;
4. saídas, roteiro, inclusos e não inclusos;
5. grupo, acompanhamento, líder, SEO e publicação;
6. destaques de Home e Hero;
7. gestão de categorias pelo admin;
8. upload com validação de tamanho, MIME e assinatura binária;
9. persistência de coleções por upsert antes de remover ausentes;
10. publicação e despublicação;
11. revalidação de Home, listagem, detalhe e admin;
12. nenhuma action de hard delete de caravana.

## Site público

Home, Hero, `/caravanas` e `/caravanas/[slug]` usam o Supabase remoto.

O Hero recebe caravanas por props, tem fallback institucional e mantém comportamento para zero, uma, duas ou três ou mais entradas, autoplay somente quando aplicável, pausa, transições e `prefers-reduced-motion`.

O detalhe inclui metadata, hero, resumo, saídas, roteiro, inclusos, não inclusos, galeria, acompanhamento e liderança. Rascunhos não são retornados pela query pública e produzem `notFound()`.

O seed remoto contém:

1. cinco categorias, sem duplicação;
2. `[DEV] Caravana Japão`, publicada, Home e Hero;
3. `[DEV] Caravana Terra Santa`, em rascunho;
4. duas saídas e três dias de roteiro para cada caravana.

`supabase/seed/cleanup-development-data.sql` foi criado e não foi executado.

## Tipos e validação

`src/types/database.ts` foi gerado diretamente do banco remoto após as migrations estruturais.

Resultados locais:

1. `npm ci`: aprovado.
2. `npm run typecheck`: aprovado.
3. `npm run lint`: aprovado, sem erros ou avisos.
4. `npm run build`: aprovado no artefato de produção.
5. `git diff --check`: aprovado após normalização final.
6. `npm audit --audit-level=low`: aprovado com **0 vulnerabilidades** após override restrito de `postcss` para `8.5.16`.
7. Next.js permaneceu em `16.2.10`.
8. O aviso de scroll foi corrigido com `data-scroll-behavior="smooth"` no elemento `<html>` e confirmado no navegador.

Verificação no Chrome headless sobre o build de produção:

1. Home: HTTP 200, conteúdo real e nenhum overlay.
2. `/caravanas`: HTTP 200.
3. Japão publicado: HTTP 200.
4. Terra Santa em rascunho: HTTP 404.
5. `/admin`: redirect para `/admin/login`.
6. login: sem overlay e tratamento correto de credenciais inválidas.
7. viewport mobile de 390 px: sem overflow horizontal.

## Advisors

O advisor de segurança não encontrou falha nas tabelas ou policies da sprint. Permanece um warning global: **Leaked Password Protection Disabled**. Essa opção pertence à configuração do Supabase Auth e deve ser habilitada no Dashboard por um responsável, pois não há ferramenta MCP de atualização dessa configuração nesta sessão.

O advisor de performance retornou apenas índices novos ainda sem estatística de uso. Eles foram mantidos porque suportam foreign keys, ordenações e filtros previstos no módulo.

## Observações visuais

O conector MCP do Paper não foi exposto como ferramenta nesta sessão. Depois que o responsável forneceu o link exato, o arquivo abriu com HTTP 200 no navegador local e a Home foi comparada visualmente com a referência aprovada. A comparação preservou a composição existente e levou a um ajuste responsivo específico para títulos longos no Hero. Nenhum redesign genérico foi feito.

## Fora de escopo preservado

Depoimentos, leads, newsletter, Turnstile, Google Business Profile, webhooks reais, Resend, reservas, pagamentos e deploy permanecem demo, placeholder ou apenas preparados. O Blog foi implementado na Sprint 02 e está documentado em `docs/24-execucao-sprint-02.md`.

## Revisão e próximo passo

Nenhum commit foi criado. Mensagem sugerida, caso o responsável aprove o diff:

`feat: implementa Supabase remoto, admin geral e caravanas`
