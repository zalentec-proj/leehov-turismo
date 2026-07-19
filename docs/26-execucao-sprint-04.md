# Execução da Sprint 04 — Depoimentos, Pop-ups, Configurações e Mídia

Data da execução: 18 de julho de 2026.

## Resultado

A Sprint 04 foi implementada no projeto remoto **Site Leehov**, região `us-west-2`, project ref mascarado `awfc…pqzv`.

Foram entregues depoimentos manuais, preparação segura para Google Reviews, pop-ups editáveis, configurações institucionais, biblioteca privada de mídia, SEO global e consentimento de cookies. Nenhum depoimento, review ou pop-up foi criado ou ativado automaticamente.

Não foram criados Supabase local, Docker, projeto adicional, commit, push, pull request ou deploy. OAuth, sincronização e respostas reais do Google Business Profile permanecem para a Sprint 05.

## Referência visual

O Paper foi consultado antes da implementação visual no arquivo `01KW53FCR6TMPD7ZTD8XRG1SKZ`, página `1-0`.

A seção de Depoimentos da Home preserva a referência aprovada:

1. fundo `#F4FAFF` e espaçamento amplo;
2. eyebrow em caixa alta e título de 42 px no desktop;
3. cards brancos de 390 × 240 px, borda `#D7E7F5`, raio de 14 px e padding de 28 px;
4. três cards no desktop e um no mobile;
5. setas circulares e indicadores;
6. navegação por teclado e toque, sem autoplay obrigatório.

As telas administrativas reutilizam os tokens, cards, tabelas, abas e padrões já existentes no painel, sem redesenhar Caravanas, Blog ou módulos de sprints anteriores.

## Migrations remotas

As migrations foram criadas pela Supabase CLI sem iniciar banco local e aplicadas sequencialmente pelo MCP:

| Arquivo e registro remoto |
|---|
| `20260718122411_site_media_assets.sql` |
| `20260718122424_testimonials_and_google_reviews.sql` |
| `20260718122438_popups_and_site_settings.sql` |
| `20260718122452_sprint_04_rls_storage_and_grants.sql` |
| `20260718122502_sprint_04_initial_settings.sql` |
| `20260718130817_sprint_04_public_rls_hardening.sql` |

A última migration é uma correção auditável encontrada na matriz RLS. Ela separa as policies públicas das policies autenticadas para que o papel `anon` nunca precise executar as funções privadas `is_active_staff` ou `is_admin`.

O remoto possui:

1. tabelas `media_assets`, `testimonials`, `google_business_settings`, `google_reviews_cache`, `popups` e `site_settings` com RLS habilitada;
2. enums `review_display_mode`, `popup_type`, `popup_display_location` e `popup_frequency`;
3. constraints de conteúdo, URL segura, consistência por tipo e apenas um pop-up ativo;
4. índices de listagem, destaque, relacionamento, auditoria e conteúdo público;
5. triggers de `updated_at` e auditoria por profile;
6. grants explícitos para `anon`, `authenticated` e `service_role`;
7. bucket privado `site-media`, limite de 8 MiB e MIME JPEG/PNG/WebP/AVIF;
8. zero depoimentos ativos, zero reviews visíveis e zero pop-ups ativos;
9. seis grupos públicos e dois grupos privados de configurações iniciais.

`src/types/database.ts` foi regenerado diretamente do banco remoto após a criação do schema da sprint. A migration final altera somente policies e não muda os tipos do banco.

## Mídia

`/admin/midia` oferece:

1. upload autenticado;
2. validação de tamanho, MIME e assinatura binária real;
3. recusa explícita de SVG;
4. pastas Geral, Depoimentos, Pop-ups, SEO e Home;
5. busca, filtro, preview, MIME e tamanho;
6. edição de texto alternativo e legenda;
7. indicação de uso por conteúdo;
8. bloqueio de exclusão enquanto houver referência.

Os arquivos permanecem no bucket privado. O navegador recebe somente URL assinada por uma hora e nunca recebe a secret key.

## Depoimentos e Google Reviews

`/admin/depoimentos` possui métricas, busca, TanStack Table, criação, edição, nota, imagem, ativação, destaque, ordenação e exclusão apenas quando o conteúdo está inativo.

A aba Google mostra o estado da integração e o cache vazio. Preferências sensíveis só podem ser alteradas por admin. Sem as três credenciais OAuth server-side, a integração não pode ser ativada. As rotas de sincronização, resposta e remoção exigem admin e retornam “integração não configurada”, sem chamada externa.

A Home deixou de usar depoimentos demo e oculta toda a seção quando não há conteúdo ativo. Quando houver conteúdo, combina manual e Google conforme o modo configurado e identifica claramente a origem Google.

## Pop-ups

`/admin/popups` suporta os tipos Campanha, Newsletter, WhatsApp e Caravana; os locais Home, Blog, Caravanas e Site inteiro; e as frequências Sempre, sessão, dia e semana.

Regras implementadas:

1. apenas um pop-up ativo no banco;
2. campanha aceita rota relativa ou HTTPS;
3. newsletter incorpora o double opt-in existente;
4. WhatsApp exige número institucional configurado;
5. caravana exige vínculo publicado;
6. fechamento por botão, clique externo e `Escape`;
7. foco controlado pelo diálogo acessível;
8. frequência armazenada no navegador sem dados pessoais;
9. hard delete somente de pop-up inativo;
10. nenhum pop-up inicial ativo.

## Configurações, SEO e e-mails

`/admin/configuracoes`, protegido por admin, possui abas para Contato, WhatsApp, Redes sociais, Home, SEO, E-mails, Analytics/consentimento e Google Business Profile.

Home, contato, footer e metadata passaram a consumir `site_settings` com fallbacks seguros. URLs públicas são normalizadas para HTTPS. IDs de GA4, GTM e Meta Pixel são aceitos e renderizados somente quando correspondem ao formato validado; HTML e scripts livres não são armazenados.

O sistema de e-mails passou a respeitar ativação, confirmações ao visitante, destinatários, nome do remetente e reply-to salvos em configuração. `RESEND_API_KEY` e `RESEND_FROM_EMAIL` continuam exclusivamente nas variáveis server-side.

## Consentimento e privacidade

O banner oferece “Aceitar analíticos” e “Somente essenciais”, com opção persistente de rever a escolha. A preferência é versionada e usa a duração configurada, inicialmente 180 dias.

GA4, GTM e Meta Pixel não são injetados antes do aceite analítico. O teste local confirmou zero scripts desses provedores antes da escolha e depois de selecionar somente cookies essenciais.

A Política de Privacidade recebeu texto acessível sobre formulários, newsletter, cookies, métricas e avaliações, mantendo aviso explícito de revisão jurídica antes do deploy.

## Matriz RLS e segurança

Os testes read-only no remoto confirmaram:

| Cenário | Mídia interna | Depoimentos/reviews/pop-ups internos | Configurações privadas | Configurações públicas |
|---|---:|---:|---:|---:|
| Anônimo | negado | somente ativos/visíveis | negado | 6 |
| Autenticado sem profile ativo | 0 | somente conteúdo público | 0 | 6 |
| Editor ativo | permitido por `is_active_staff` | gerenciamento permitido | negado por `is_admin` | permitido |
| Admin ativo | permitido | gerenciamento permitido | 2 privadas + 6 públicas | permitido |

O teste do admin autenticado leu os oito grupos de settings e a configuração Google. O cenário sem profile ativo não leu mídia nem configuração Google. A matriz não criou nem alterou profiles de produção.

O papel anônimo não possui grant de insert em mídia, depoimentos ou pop-ups e não possui update em configurações. Após o hardening, a consulta anônima retornou os seis grupos públicos sem erro e sem executar funções privilegiadas.

## Validação no navegador

Foram validados em `http://localhost:3000`:

1. Home com dados reais de Caravanas e sem seção de depoimentos vazia;
2. banner de consentimento e ausência de scripts analíticos antes do aceite;
3. escolha “Somente essenciais” ocultando o banner sem carregar Analytics;
4. `/admin/depoimentos` autenticado, métricas zero, tabela vazia e formulário completo;
5. diálogo de depoimento fechando por `Escape`;
6. `/admin/popups` com estado vazio e ação de criação;
7. `/admin/midia` com upload e estado vazio;
8. `/admin/configuracoes` com as oito abas e ação de salvar;
9. identificação da administradora geral no `AdminShell`;
10. ausência de erros de console nas páginas verificadas;
11. Home e Configurações em viewport de 390 × 844 px sem overflow horizontal.

O servidor local permanece disponível para revisão.

## Gates técnicos

1. `npm ci`: aprovado pelo lockfile.
2. `npm audit --audit-level=low`: aprovado, 0 vulnerabilidades.
3. Next.js preservado em `16.2.10`.
4. `npm run typecheck`: aprovado.
5. `npm run lint`: aprovado, sem erros ou avisos.
6. `npm run build`: aprovado para 30 rotas.
7. `git diff --check`: aprovado.
8. nenhum secret foi adicionado a arquivo rastreado.

## Advisors

O advisor de segurança não apontou falhas de RLS, grants, Storage ou funções da Sprint 04. Permanece somente o warning global **Leaked Password Protection Disabled**, ligado à configuração externa do Supabase Auth e não alterado sem autorização específica. Referência: [Supabase — password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

O advisor de performance retornou apenas índices ainda sem estatística de uso. Os índices novos foram mantidos porque sustentam filtros, ordenação, relacionamentos, conteúdo público e auditoria, enquanto as tabelas da sprint continuam vazias. Referência: [Supabase — database linter](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Revisão

Nenhum commit foi criado. Mensagem sugerida:

`feat: implementa depoimentos popups configuracoes e midia`
