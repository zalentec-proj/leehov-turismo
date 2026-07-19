# Execução da Sprint 02 — Blog administrável

Data da execução: 17 de julho de 2026.

## Resultado

A Sprint 02 foi implementada no projeto remoto **Site Leehov**, região `us-west-2`, project ref mascarado `awfc…pqzv`.

O Blog passou a usar Supabase PostgreSQL, Auth e Storage privados. Os nove artigos autorizados do site antigo foram copiados como rascunhos, com autoria, data editorial, origem, capa e imagens internas. Nenhum artigo ficou publicado.

Não foram criados Supabase local, Docker, projeto adicional, commit, push, pull request ou deploy. Resend, leads, newsletter, depoimentos, pop-ups e demais módulos permaneceram fora desta entrega.

## Referência visual

O conector do Paper não foi exposto como ferramenta nesta sessão. Conforme a premissa do plano, o backend avançou e as telas preservaram o design existente da Leehov, usando os tokens, espaçamentos, tipografia, cards e navegação já documentados e aprovados. Nenhuma linguagem visual genérica foi introduzida.

## Migrations remotas

As migrations foram criadas pela Supabase CLI sem iniciar banco local e aplicadas sequencialmente pelo MCP:

| Arquivo local | Registro remoto |
|---|---|
| `20260717114544_blog_categories_posts_and_images.sql` | `20260717114544_blog_categories_posts_and_images` |
| `20260717114612_blog_rls_and_grants.sql` | `20260717114612_blog_rls_and_grants` |
| `20260717114634_blog_storage.sql` | `20260717114634_blog_storage` |
| `20260717114654_blog_initial_categories.sql` | `20260717114654_blog_initial_categories` |

O remoto possui:

1. `blog_categories`;
2. `blog_posts`;
3. `blog_post_images`;
4. 21 constraints nas três tabelas;
5. 15 índices;
6. 11 policies RLS no schema público;
7. 4 policies específicas de Blog em `storage.objects`;
8. 14 grants explícitos para `anon` e `authenticated`.

As três tabelas têm RLS habilitada. `src/types/database.ts` foi regenerado diretamente do banco remoto depois das migrations.

## Storage

O bucket privado `blog-images` foi confirmado com:

1. `public = false`;
2. limite de `8.388.608` bytes, equivalente a 8 MiB;
3. MIME types `image/jpeg`, `image/png`, `image/webp` e `image/avif`;
4. paths `{postId}/cover/...` e `{postId}/gallery/...`;
5. leitura somente para staff ativo ou para objeto ligado a post publicado;
6. URLs assinadas por 1 hora;
7. upload validado também por assinatura binária no servidor.

## Matriz RLS

Os testes foram executados em transações revertidas com `ROLLBACK`, sem deixar usuários ou posts de teste:

| Cenário | Posts visíveis | Categorias | Imagens | Mutation de rascunho |
|---|---:|---:|---:|---|
| Anônimo, com todos os legados em rascunho | 0 | 0 | 0 | não |
| Autenticado inativo | 0 | 0 | 0 | negada |
| Editor ativo | 9 | 4 | 62 | permitida |
| Admin ativo | 9 | 4 | 62 | permitida |

Um teste transitório publicou um registro apenas dentro da transação e confirmou que o anônimo via somente 1 post, sua 1 categoria e suas 4 imagens. O `ROLLBACK` manteve o remoto com zero posts publicados.

O hard delete de um post marcado como publicado dentro da transação afetou zero linhas e o registro permaneceu existente. Rascunhos podem ser excluídos com limpeza controlada do Storage.

Após os testes, o remoto foi novamente auditado:

1. exatamente 1 usuário Auth;
2. exatamente 1 admin ativo;
3. 0 posts de teste;
4. 0 posts publicados.

## Domínio e painel

`src/features/blog` contém:

1. tipos de categoria, resumo, detalhe, admin, formulário e imagem;
2. schemas Zod;
3. sanitização server-side;
4. mapeadores com URLs assinadas;
5. queries públicas e administrativas;
6. actions de criar, editar, publicar, despublicar e excluir rascunho;
7. gestão de categorias;
8. upload e remoção de capa e galeria;
9. sincronização idempotente da galeria;
10. revalidação de Home, Blog, detalhe e admin.

Queries implementadas:

1. `getPublishedPosts`;
2. `getFeaturedPosts`;
3. `getFeaturedBlogPost`;
4. `getPostBySlug`;
5. `getRelatedPosts`;
6. `getAdminPosts`;
7. `getAdminPostById`;
8. `getBlogCategories`.

O painel possui:

1. `/admin/blog` com TanStack Table, busca, categoria, status, destaques e ações;
2. `/admin/blog/novo`;
3. `/admin/blog/[id]`;
4. formulário em Conteúdo, Imagens, Relacionamentos e Publicação/SEO;
5. editor TipTap com títulos, negrito, itálico, listas, links, citações e desfazer/refazer;
6. feedback em português com Sonner;
7. loading e prevenção de envio duplicado;
8. confirmação antes do hard delete de rascunho.

O editor e as quatro abas foram validados no painel autenticado. O navegador não registrou erro de execução.

## Sanitização

O conteúdo é sanitizado novamente no servidor antes de persistir. O teste automatizado usou conteúdo com:

1. `<script>`;
2. `<iframe>`;
3. atributo `onclick`;
4. estilo inline;
5. URL `javascript:`;
6. tag `<img>` externa.

O resultado seguro foi `<p>Seguro<a>link</a></p>`, sem qualquer elemento ou atributo proibido.

## Migração dos nove artigos

Foram importados como rascunho:

| Categoria | Artigos |
|---|---|
| Destinos | Descobrindo a Tailândia; Egito Fabuloso — Cruzeiro Rio Nilo; O que fazer em Tel Aviv |
| Dicas de viagem | Travessia fronteira Egito e Israel; Israel — moeda, idiomas e climas |
| Viagens em grupo | Egito e Israel em grupo; Benefícios de viajar em grupo |
| História e fé | Subida ao Monte Sinai; Jaffa e sua antiga história |

Validação final:

1. 9 posts;
2. 9 `source_url` únicas;
3. 9 posts com autora pública **Bruna Moraes**;
4. datas preservadas entre 14/06/2022 e 28/11/2024;
5. 9 capas;
6. 62 imagens internas de galeria;
7. 71 objetos no bucket, total aproximado de 6,5 MB;
8. 0 artigos publicados;
9. 0 destaques.

Uma segunda execução confirmou idempotência: permaneceram 9 fontes únicas e 71 objetos. O importador administrativo temporário foi removido do código depois da validação.

## Site público

`/blog` possui hero editorial, busca, categorias, destaque, grid e estado vazio. `/blog/[slug]` possui metadata, autoria, data, tempo de leitura, capa, conteúdo, galeria, caravana relacionada, artigos relacionados e CTA.

Rascunhos são filtrados na query pública e retornam `notFound()`. O slug `descobrindo-a-tailandia` foi validado localmente com HTTP 404 enquanto permaneceu em rascunho.

A Home usa apenas posts publicados com `featured_home`. Com zero publicados, a seção Inspirações fica oculta.

No viewport de 390 × 844 px:

1. não houve overflow horizontal;
2. o menu mobile permaneceu disponível;
3. busca e estado vazio permaneceram legíveis;
4. o formulário de busca navegou corretamente para `?q=Israel`.

## Gates técnicos

1. `npm ci`: aprovado.
2. `npm audit --audit-level=low`: aprovado, 0 vulnerabilidades.
3. PostCSS efetivo em toda a árvore: `8.5.16`.
4. Next.js preservado em `16.2.10`.
5. `npm run typecheck`: aprovado.
6. `npm run lint`: aprovado, sem erros ou avisos.
7. `npm run build`: aprovado para todas as 28 rotas.
8. `git diff --check`: aprovado.
9. rota protegida sem cookie: `307` para `/admin/login?next=%2Fadmin%2Fblog`.
10. painel autenticado, Caravanas, Usuários e Blog: aprovados sem erro no navegador.

## Advisors

O advisor de segurança não encontrou falha nas tabelas, grants, policies ou funções da Sprint 02. Permanece apenas o warning global **Leaked Password Protection Disabled**, ligado à configuração do Supabase Auth. A ativação não foi feita porque altera configuração externa e não integrou a autorização desta sprint.

O advisor de performance retornou apenas avisos informativos de índices ainda sem uso estatístico, esperado em uma base nova e pequena. Os índices foram mantidos porque atendem foreign keys, auditoria, filtros editoriais e relacionamentos previstos.

## Revisão

Nenhum commit foi criado. Mensagem sugerida:

`feat: conclui sprint 1 e implementa blog administrável`
