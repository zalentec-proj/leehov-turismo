# Execução da Sprint 05 — Google Business Profile, Webhooks e Integrações

Data da execução local: 18 de julho de 2026.

## Estado da entrega

A base técnica da Sprint 05 foi implementada no projeto Leehov Turismo e as quatro migrations autorizadas foram aplicadas no Supabase remoto **Site Leehov**, região `us-west-2`, project ref mascarado `awfc…pqzv`.

A criação da credencial OAuth Web e a habilitação das APIs no Google Cloud não foram executadas. O Basic API Access do Google permanece pendente, sob o caso `9-6996000040997`.

Após a aplicação, a leitura direta pelo MCP confirmou o schema remoto. A primeira validação local recebeu `401 Invalid API key`, mas a causa não estava no arquivo: o processo do terminal herdava uma `SUPABASE_SECRET_KEY` antiga e, pela precedência de variáveis do sistema, ignorava o valor correto de `.env.local`. O servidor foi reiniciado removendo somente a variável herdada; a chave do arquivo foi aceita com HTTP `200` e as telas autenticadas de Webhooks e Configurações abriram sem erros.

Não foram criados Supabase local, Docker, projeto adicional, commit, push, pull request ou deploy. Nenhuma resposta foi enviada a uma avaliação real.

## Referência visual

O Paper foi consultado no arquivo `01KW53FCR6TMPD7ZTD8XRG1SKZ`:

1. a página pública confirmou o carrossel de Depoimentos com três cards, fundo azul muito claro, bordas discretas e controles circulares;
2. o Dashboard confirmou o padrão administrativo branco, azul institucional, cards de raio amplo, tabelas claras e hierarquia Inter;
3. somente Depoimentos/Google, Configurações e Webhooks foram refinados;
4. Caravanas, Blog e demais módulos não foram redesenhados.

## Migrations aplicadas

Criadas com Supabase CLI, sem iniciar banco local, e aplicadas sequencialmente no remoto em 18 de julho de 2026:

| Registro remoto | Arquivo local | Objetivo |
|---|---|---|
| `20260718145402` | `20260718141519_google_business_connections_and_cache_compliance.sql` | conexão OAuth criptografada, vínculo de settings, lock de sincronização, expiração e estado de respostas |
| `20260718145414` | `20260718141525_google_business_rls_grants_and_cleanup.sql` | RLS, grants service-only, cache público não expirado e limpeza diária |
| `20260718145427` | `20260718141532_webhooks_and_delivery_logs.sql` | 11 eventos, configurações, payloads e histórico durável |
| `20260718145439` | `20260718141537_webhook_rls_grants_and_cleanup.sql` | tabelas service-only e retenção diária de logs por 90 dias |

As migrations não criam conexão, webhook ou conteúdo ativo. `pg_cron` agenda apenas a limpeza de reviews expiradas e logs antigos.

Validação remota:

1. `google_business_connections`, `webhooks` e `webhook_logs` existem, estão com RLS habilitado e permanecem vazias;
2. constraints, chaves estrangeiras, triggers e índices previstos foram confirmados;
3. o cache recebeu vínculo de conexão, expiração máxima de 30 dias e estado de resposta;
4. `leehov-cleanup-expired-google-reviews` está ativo diariamente às `03:23` UTC;
5. `leehov-cleanup-expired-webhook-logs` está ativo diariamente às `03:41` UTC.

## Google Business Profile

Foram implementadas as rotas:

1. `GET /api/google-business/connect`;
2. `GET /api/google-business/callback`;
3. `POST /api/google-business/disconnect`;
4. `POST /api/google/reviews/sync`;
5. `POST /api/google/reviews/reply`;
6. `POST /api/google/reviews/delete-reply`.

Controles de segurança:

1. state aleatório em cookie HTTP-only, SameSite Lax e expiração de dez minutos;
2. redirect fixo para a área administrativa;
3. escopo exato `business.manage`;
4. refresh token criptografado com AES-256-GCM e access token apenas em memória;
5. reconexão preserva o refresh token anterior quando o Google não emite outro;
6. seleção de localização revalida conta e local diretamente na API antes de salvar;
7. sincronização paginada em lotes de 50, lease atômico e upsert por `google_review_id`;
8. visibilidade e destaque moderados são preservados em sincronizações posteriores;
9. reviews novas emitem eventos; notas de até três estrelas também emitem `google_review.low_rating`;
10. respostas usam limite de 4.096 bytes e confirmação visual;
11. nenhum teste de PUT ou DELETE foi direcionado a review real.

O painel informa que OAuth continua em Testing e que o refresh token pode expirar em sete dias. Enquanto a aprovação e as credenciais estiverem incompletas, a conexão fica indisponível de forma segura.

## Webhooks

`/admin/webhooks` agora possui métricas, busca, CRUD, ativação, seleção múltipla dos 11 eventos, teste fictício, histórico e reenvio confirmado.

Cada entrega:

1. é persistida como `pending` antes da chamada externa;
2. é executada após a resposta da ação principal;
3. envia payload versionado com `event`, `deliveryId`, `occurredAt` e dados mínimos;
4. assina `timestamp.body` com HMAC-SHA256;
5. inclui `X-Leehov-Event`, `X-Leehov-Delivery`, `X-Leehov-Timestamp` e `X-Leehov-Signature`;
6. bloqueia credenciais em URL, hosts internos, loopback, IPs privados/reservados, HTTP em produção e redirects;
7. usa timeout de oito segundos;
8. armazena status e resposta sanitizada/truncada;
9. preserva payload e `deliveryId` no reenvio, incrementando `attempts`;
10. nunca devolve a chave de validação ao navegador.

Leads de contato e interesse emitem primeiro `lead.created` e depois o evento específico. Newsletter, Caravanas, Blog e Google Reviews também foram conectados aos eventos documentados. A gravação principal acontece antes da emissão e não sofre rollback por falha externa.

## Permissões validadas

| Papel | Cache público | Moderação Google | OAuth/respostas | Webhooks/segredos |
|---|---:|---:|---:|---:|
| Anônimo | somente visível e não expirado | não | não | não |
| Inativo | somente o mesmo conteúdo público | não | não | não |
| Editor ativo | leitura interna | visibilidade e destaque | não | não |
| Admin ativo | leitura interna | sim | sim, via servidor | sim, via servidor |
| Service role | sim | sim | sim | sim |

`google_business_connections`, `webhooks` e `webhook_logs` não possuem privilégios de leitura ou escrita para `anon` ou `authenticated`; somente `service_role` possui CRUD. O servidor valida o admin antes de usar a service role.

No cache de reviews, `anon` possui somente leitura sujeita à policy de visibilidade e expiração. `authenticated` possui leitura e update apenas das colunas `visible`, `featured` e `updated_by`, também sujeito à policy de equipe ativa. Respostas, payload bruto e conexão continuam exclusivos do servidor.

## Variáveis

`.env.example` contém somente nomes:

1. `GOOGLE_CLIENT_ID`;
2. `GOOGLE_CLIENT_SECRET`;
3. `GOOGLE_REDIRECT_URI`;
4. `GOOGLE_TOKEN_ENCRYPTION_KEY`;
5. `GOOGLE_BUSINESS_API_ACCESS_STATUS`;
6. `WEBHOOK_SECRET_ENCRYPTION_KEY`.

`GOOGLE_REFRESH_TOKEN` foi removida. Nenhum valor real foi escrito em arquivo rastreado.

## Validação e pendências externas

Gates locais concluídos:

1. `npm ci`: aprovado;
2. `npm audit --audit-level=low`: aprovado, 0 vulnerabilidades;
3. `npm run typecheck`: aprovado;
4. `npm run lint`: aprovado, sem erros ou avisos;
5. `npm run build`: aprovado para 35 rotas, incluindo as oito rotas Google/Webhooks implementadas;
6. `git diff --check`: aprovado;
7. varredura de secrets em arquivos rastreados: nenhum valor encontrado;
8. Next.js mantido em `16.2.10`.

O build precisou ser repetido fora do sandbox porque o processo interno do Turbopack/PostCSS precisa abrir uma porta local; fora dessa restrição ambiental, compilou normalmente.

`src/types/database.ts` foi regenerado diretamente do schema remoto após as quatro migrations.

Os advisors foram executados depois da aplicação:

1. segurança: nenhum erro; três informes de “RLS sem policy” nas tabelas intencionalmente service-only, que também têm todos os grants revogados para `anon` e `authenticated`;
2. segurança global: permanece o aviso preexistente de proteção contra senhas vazadas desabilitada, sem alteração de Auth nesta sprint;
3. performance: somente informes de índices ainda não utilizados, esperado para as tabelas novas vazias e para o baixo volume atual; nenhum índice necessário à sincronização, moderação, busca ou retenção foi removido prematuramente.

A sincronização real depende ainda de:

1. rotação da secret key que apareceu em uma captura de tela, seguida da atualização segura de `.env.local`;
2. aprovação do Basic API Access;
3. habilitação das três APIs previstas;
4. criação do cliente OAuth Web com callbacks local e oficial;
5. inclusão do Client Secret diretamente em `.env.local` pelo responsável;
6. conexão e confirmação manual da localização Leehov.

## Revisão

Nenhum commit foi criado. Mensagem sugerida:

`feat: integra google business profile e webhooks`
