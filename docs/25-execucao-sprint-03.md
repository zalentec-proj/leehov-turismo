# Execução da Sprint 03 — Leads, Newsletter e Comunicação

Data da execução: 17 de julho de 2026.

## Resultado

A Sprint 03 foi implementada no projeto remoto **Site Leehov**, região `us-west-2`, project ref mascarado `awfc…pqzv`.

Foram entregues os formulários de contato e interesse em caravanas, gestão administrativa de leads, newsletter com double opt-in, páginas de confirmação e cancelamento, integração transacional com Resend, templates e logs de e-mail. O visual existente foi preservado.

Não foram criados Supabase local, Docker, projeto adicional, commit, push, pull request ou deploy. Pop-ups, depoimentos, Google Reviews, configurações gerais, campanhas, exportação, webhooks reais e serviços pagos permaneceram fora da entrega.

## Referência visual

O conector do Paper não foi exposto como ferramenta nesta sessão. Conforme o plano, a implementação reutilizou os componentes, tokens, tipografia, espaçamentos, cards e navegação existentes. Nenhum redesign ou nova linguagem visual foi introduzido.

## Migrations remotas

As migrations foram criadas pela Supabase CLI sem iniciar banco local e aplicadas sequencialmente pelo MCP:

| Arquivo local | Registro remoto |
|---|---|
| `20260717140938_leads_newsletter_email_logs.sql` | `20260717141136_leads_newsletter_email_logs` |
| `20260717140944_form_rate_limits.sql` | `20260717141143_form_rate_limits` |
| `20260717140951_communication_rls_and_grants.sql` | `20260717141150_communication_rls_and_grants` |
| `20260717143822_communication_advisor_hardening.sql` | `20260717143842_communication_advisor_hardening` |

A última migration torna explícita a negação de acesso dos papéis de navegador ao ledger de rate limit, eliminando o aviso auditável de tabela com RLS sem policy e preservando a mesma restrição funcional.

O remoto possui:

1. enums `lead_status`, `newsletter_status` e `email_status`;
2. tabelas `leads`, `newsletter_subscribers`, `email_logs` e `form_rate_limits`;
3. RLS habilitada nas quatro tabelas;
4. 34 constraints;
5. 21 índices;
6. 5 policies RLS explícitas;
7. triggers de atualização e auditoria;
8. função atômica `consume_form_rate_limit`, executável somente por `service_role`.

`src/types/database.ts` foi regenerado diretamente do banco remoto após as migrations.

## Segurança, grants e rate limit

Anônimo não possui grants de tabela. `authenticated` não possui grant de `INSERT` nas quatro tabelas e não pode selecionar os hashes dos tokens da newsletter. A escrita pública ocorre somente por Server Actions com cliente privilegiado server-side.

As proteções implementadas são:

1. validação Zod;
2. honeypot antes de qualquer chamada externa;
3. identificador de IP convertido em HMAC-SHA-256 com `FORM_SECURITY_SECRET`;
4. ausência de IP bruto no banco e nos logs;
5. limite atômico de 5 tentativas por escopo e identificador em 15 minutos;
6. Turnstile desabilitado quando as duas chaves estão ausentes;
7. configuração parcial do Turnstile falhando de forma segura;
8. widget e validação obrigatórios quando as duas chaves estiverem configuradas;
9. captura sanitizada de path, referrer e UTMs;
10. erros externos sem perda ou invalidação do lead já salvo.

O teste transacional do rate limit retornou `true` nas cinco primeiras tentativas e `false` na sexta. O `ROLLBACK` deixou `form_rate_limits` sem registros de teste.

## Matriz RLS

Os testes foram executados em transações revertidas, sem deixar usuários ou dados temporários:

| Cenário | Leads | Inscritos | Logs | Atualizar lead |
|---|---:|---:|---:|---|
| Anônimo | 0 | 0 | 0 | negado |
| Autenticado inativo | 0 | 0 | 0 | 0 linhas |
| Editor ativo | 1 | 1 | 1 | 1 linha |
| Admin ativo | 1 | 1 | 1 | 1 linha |

Os papéis de navegador não acessaram `form_rate_limits`. A limpeza final confirmou zero usuários, leads, inscritos, logs e limites temporários.

## Leads e formulários

`src/features/leads` contém tipos, schemas Zod, mapeamento, queries, métricas, actions e componentes.

Foram implementadas:

1. `createContactLeadAction`;
2. `createCaravanInterestAction`;
3. `updateLeadStatusAction`;
4. validação de caravana existente e publicada;
5. contato com nome, e-mail, WhatsApp e mensagem;
6. interesse com nome, WhatsApp, e-mail, cidade, estado e mensagem;
7. origem, página, referrer e UTMs em JSONB sanitizado;
8. prevenção de envio duplicado, loading e feedback em português;
9. status `new`, `in_progress`, `converted` e `archived`;
10. ausência de hard delete e de deduplicação de atendimentos;
11. CTA de WhatsApp somente quando o número institucional estiver configurado.

O formulário real foi integrado em `/contato` e no detalhe de uma caravana publicada.

## Admin de leads e Dashboard

`/admin/leads` passou a oferecer:

1. métricas de total, novos, em atendimento e convertidos;
2. TanStack Table;
3. busca por nome, e-mail ou WhatsApp;
4. filtros por status, origem e caravana;
5. detalhe completo em diálogo;
6. mudança de status;
7. ação `wa.me` com número normalizado;
8. estados vazios, loading e atualização sem perder os filtros locais.

O Dashboard principal passou a exibir total de leads, novos leads, inscritos ativos e leads recentes.

## Newsletter e double opt-in

O componente reutilizável da newsletter foi integrado à Home, Blog, post e footer, registrando a origem.

O fluxo implementado:

1. cria ou restaura a inscrição como `pending`;
2. gera token aleatório de 32 bytes;
3. persiste somente o hash SHA-256;
4. expira a confirmação em 24 horas;
5. limita o reenvio pendente a uma vez a cada 15 minutos por e-mail;
6. usa resposta genérica para evitar enumeração de endereços;
7. confirma como `active` e descarta o hash de confirmação;
8. gera hash separado para cancelamento;
9. tenta o e-mail de boas-vindas após confirmar;
10. permite cancelar e reinscrever posteriormente.

O teste transacional confirmou a sequência `pending` → `active` → `unsubscribed`, o descarte do hash de confirmação e a presença exclusiva do hash de cancelamento. Nenhum token bruto foi persistido.

Foram criadas as rotas:

1. `/api/newsletter/confirm`;
2. `/api/newsletter/unsubscribe`;
3. `/newsletter/resultado`, com estados confirmado, expirado, inválido e cancelado.

`/admin/newsletter` possui métricas, busca e filtros por origem e status, datas de cadastro e confirmação e uma aba separada de logs de e-mail.

## Resend e logs

Foram criados os seis templates previstos:

1. notificação interna de contato;
2. confirmação de contato ao visitante;
3. notificação interna de interesse em caravana;
4. confirmação de interesse ao visitante;
5. confirmação da newsletter;
6. boas-vindas da newsletter.

Cada tentativa cria log `pending` e termina como `sent`, `failed` ou `skipped`, com template, destinatário, entidade relacionada, ID do provedor e erro sanitizado. API keys, tokens brutos e corpo sensível não são gravados nos logs.

Quando chave, remetente ou destinatário obrigatório estiver ausente, a tentativa é marcada como `skipped` sem invalidar o dado principal.

## Validação no navegador

Foram validados no servidor local:

1. newsletter reutilizável na Home e no footer;
2. formulário completo em `/contato`;
3. mensagens Zod em português no envio vazio;
4. formulário de interesse na caravana publicada `[DEV] Caravana Japão`;
5. `/admin/leads` autenticado, com métricas, filtros e tabela;
6. `/admin/newsletter` autenticado, com inscritos e aba de logs;
7. identificação da administradora geral e logout no `AdminShell`;
8. página de resultado para link expirado;
9. estados vazios sem erro de execução.

O servidor local permanece disponível em `http://localhost:3000`, com o painel de Newsletter aberto para revisão.

## Ambiente e validações pendentes de credenciais

`.env.example` contém somente nomes de variáveis. `.env.local` continua ignorado pelo Git e recebeu um `FORM_SECURITY_SECRET` aleatório apenas no ambiente local. Nenhum valor secreto foi incluído nos arquivos rastreados.

Estado atualizado em 18 de julho de 2026:

1. URL e publishable key do Supabase: configuradas;
2. `FORM_SECURITY_SECRET`: configurado localmente;
3. `RESEND_API_KEY`: preservada localmente;
4. `SUPABASE_SECRET_KEY`: configurada somente em `.env.local` e validada por consultas read-only às três tabelas da sprint;
5. remetente, reply-to e destinatários do Resend: ainda ausentes;
6. chaves do Turnstile: ambas ausentes, portanto modo progressivo desabilitado;
7. `NEXT_PUBLIC_SITE_URL`: configurada localmente.

Nenhum dado real foi criado durante a validação da secret key. O E2E de gravação pública ainda exige autorização para inserir dados temporários no remoto. Envio real, falha real do provedor e token válido do Turnstile também dependem da configuração de remetente, destinatários e das duas chaves do Turnstile. Banco, RLS, state machine, rate limit e interfaces foram validados sem deixar dados de teste.

## Gates técnicos

1. `npm ci`: aprovado, 883 pacotes instalados pelo lockfile.
2. `npm audit --audit-level=low`: aprovado, 0 vulnerabilidades.
3. Next.js preservado em `16.2.10`.
4. `npm run typecheck`: aprovado.
5. `npm run lint`: aprovado, sem erros ou avisos.
6. `npm run build`: aprovado para 30 rotas.
7. `git diff --check`: aprovado.
8. busca por valores com formato de secret nos arquivos rastreados: nenhum resultado.

O `npm ci` emitiu avisos de depreciação em subpacotes de `@react-email/components`, mas o audit permaneceu com zero vulnerabilidades e os templates compilaram no build.

## Advisors

O aviso da tabela de rate limit com RLS e nenhuma policy foi corrigido por uma policy explícita de negação. O advisor de segurança não encontrou falhas nas tabelas, grants, policies ou função da Sprint 03.

Permanece somente o warning global **Leaked Password Protection Disabled**, ligado à configuração do Supabase Auth. A ativação não foi feita porque altera configuração externa fora da autorização desta sprint. Referência: [Supabase — password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

O advisor de performance retornou apenas índices ainda sem estatística de uso, incluindo os índices novos de Leads, Newsletter, logs e rate limit. Eles foram mantidos porque sustentam filtros, ordenação, relacionamentos, tokens e limpeza futura, e a base ainda não possui tráfego real. Referência: [Supabase — database linter](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Revisão

Nenhum commit foi criado. Mensagem sugerida:

`feat: implementa leads newsletter e comunicacao transacional`
