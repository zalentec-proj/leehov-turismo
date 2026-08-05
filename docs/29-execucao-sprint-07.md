# Execução da Sprint 07 — Campanhas, CRM Leve e WhatsApp

Data da execução local: 5 de agosto de 2026.

## Estado da entrega

A Sprint 07 foi implementada e validada, preservando os dados existentes e sem enviar campanhas reais ou criar instância na Evolution API. As migrations foram aplicadas no projeto remoto autorizado e os secrets necessários foram configurados como sensíveis na Vercel.

Foram aplicados cinco arquivos de migration no projeto remoto **Site Leehov**, com project ref mascarado `awfc…pqzv`:

1. `newsletter_campaigns_and_recipients`;
2. `lead_pipeline_interactions_and_sources`;
3. `sprint_07_webhook_events_and_settings`;
4. `sprint_07_rls_grants_cron_and_indexes`.
5. `reduce_newsletter_cron_frequency`.

Os tipos em `src/types/database.ts` foram atualizados conforme o schema aplicado e validados pelo typecheck e pelo build. A regeneração automática pelo CLI permanece indisponível nesta estação porque a sessão conectada aponta para outra organização; a estrutura preparada foi conferida contra as migrations remotas aplicadas.

## Referência visual

O conector do Paper não estava disponível entre as ferramentas expostas nesta execução. Para não bloquear o trabalho, as telas de Pop-ups, Newsletter, Leads e Configurações preservaram os componentes, tokens, espaçamentos e hierarquia visual estabelecidos nas Sprints 04 a 06 e documentados no repositório. Nenhum redesign externo ao escopo foi realizado.

## Pop-ups e mídia

O modal de Pop-ups passou a usar um `MediaPicker` reutilizável. O componente oferece:

1. upload por clique ou arrastar e soltar;
2. texto alternativo obrigatório antes do envio;
3. preview da imagem selecionada;
4. seleção de itens já existentes na biblioteca;
5. substituição e remoção da seleção;
6. feedback individual de processamento e erro.

O upload reutiliza `uploadMediaAssetAction`, o bucket privado `site-media`, a pasta `popups`, o limite de 8 MiB e as validações MIME e de assinatura binária existentes. Um arquivo enviado permanece disponível na biblioteca mesmo quando o modal é fechado sem salvar o Pop-up.

## Newsletter e campanhas

O painel `/admin/newsletter` agora possui as abas **Campanhas**, **Inscritos** e **Logs de e-mail**. O editor de campanhas armazena somente JSONB validado e oferece blocos ordenáveis de título, parágrafo, imagem, botão, divisor e espaçamento, sem aceitar HTML livre.

Foram implementados:

1. criação e edição de rascunhos;
2. clonagem e exclusão de rascunhos;
3. preview estrutural pelo próprio editor de blocos;
4. teste para um endereço informado pelo administrador;
5. agendamento em `America/Sao_Paulo`, convertido para UTC;
6. congelamento idempotente da audiência ativa;
7. envio imediato, cancelamento, pausa por cota, retomada e arquivamento;
8. processamento em lotes de 20, com espaçamento compatível com o limite padrão do Resend;
9. no máximo três tentativas por destinatário;
10. revalidação do status do inscrito imediatamente antes de cada entrega;
11. cancelamento individual com token aleatório armazenado apenas como SHA-256;
12. cadastro manual de inscrito sempre como `pending`, usando o double opt-in e cooldown existentes.

Imagens de campanhas usam a biblioteca de mídia e uma rota HMAC protegida. Quando o e-mail é aberto, essa rota gera uma URL assinada de cinco minutos para o arquivo no bucket privado. O segredo de assinatura nunca é enviado ao navegador.

A rota protegida `/api/newsletter/campaigns/process` está pronta para o Supabase Cron. O banco lê URL e token exclusivamente do Vault e chama a rota por `pg_net`. Para reduzir uso ocioso, o job foi ajustado de uma vez por minuto para uma vez por hora (`0 * * * *`), equivalente a aproximadamente 720 verificações mensais.

O envio e o agendamento falham de forma segura quando faltam Resend/remetente, `NEWSLETTER_CRON_SECRET` ou `EMAIL_ASSET_SIGNING_SECRET`, conforme o recurso solicitado. Nenhum e-mail de campanha real foi enviado nos testes.

## CRM leve de Leads

O painel `/admin/leads` agora alterna entre tabela e Kanban. Foram adicionados:

1. cadastro manual com nome e WhatsApp obrigatórios;
2. e-mail, mensagem, cidade, estado e caravana opcionais;
3. origens manual, WhatsApp, telefone, indicação, rede social e outro;
4. responsável e próximo acompanhamento;
5. filtros por status, origem, caravana, responsável e acompanhamento atrasado;
6. movimentação entre os quatro status por ponteiro e teclado;
7. página `/admin/leads/[id]` com dados, atribuição, acompanhamento, UTMs e linha do tempo;
8. observações, ligações e registros de WhatsApp;
9. abertura imediata de `wa.me` com mensagem pronta e registro não bloqueante da interação.

Não foi adicionado hard delete. Mudanças de status, atribuição, acompanhamento e interações geram auditoria na tabela `lead_interactions`.

## WhatsApp e Evolution API

A aba WhatsApp em Configurações aceita provider `manual` ou `evolution`, URL HTTPS, nome da instância e modelos com `{{nome}}`, `{{caravana}}` e `{{consultor}}`.

`EVOLUTION_API_KEY` permanece exclusivamente como variável server-side. O navegador recebe apenas um indicador booleano de configuração, e esse indicador não é persistido em `site_settings`. Não há código para criar instância, gerar QR Code, rastrear conversas ou enviar mensagens pela Evolution nesta sprint.

## Webhooks

Foram adicionados os eventos:

1. `lead.updated`;
2. `lead.status_changed`;
3. `lead.interaction.created`.

O payload operacional inclui apenas ID, nome, e-mail, WhatsApp, origem, status, caravana, responsável, próximo acompanhamento e identificadores mínimos da interação. Observações internas e texto da linha do tempo não são enviados. A emissão ocorre depois da gravação principal e não reverte alterações do lead quando uma entrega externa falha.

## Banco, RLS e segurança

As migrations remotas criam campanhas e destinatários, evoluem o pipeline de leads, adicionam interações, ampliam os enums de Webhooks, criam índices e preparam o Cron.

As tabelas `newsletter_campaigns`, `newsletter_campaign_recipients` e `lead_interactions` ficam com RLS habilitado, sem grants para `anon` ou `authenticated`, e são acessadas pelas Server Actions com `service_role` somente depois da validação do profile. Editor ativo gerencia rascunhos e leads; operações de envio, agendamento, inscritos manuais e provider continuam exclusivas de admin.

Validação remota concluída:

1. cinco migrations registradas sequencialmente;
2. RLS habilitado nas três tabelas novas;
3. nenhum grant de `anon` ou `authenticated` nas tabelas exclusivas do servidor;
4. 14 eventos de Webhook aceitos após a ampliação;
5. Cron ativo apenas no intervalo horário;
6. advisors de performance sem erros ou avisos;
7. advisor de segurança sem erros e com um aviso preexistente de proteção contra senhas vazadas desativada;
8. `NEWSLETTER_CRON_SECRET` e `EMAIL_ASSET_SIGNING_SECRET` configurados como secrets de Production na Vercel;
9. `leehov_newsletter_cron_url` e `leehov_newsletter_cron_token` gravados no Supabase Vault após o deployment ficar `Ready`;
10. rota sem autenticação rejeitada com `401`;
11. chamada autenticada direta e chamada via `pg_net` validadas com `200`, `campaigns: 0` e `recipients: 0`.

O ciclo foi ativado somente depois da publicação da rota. Antes do teste autenticado, o banco confirmou zero campanhas vencidas ou agendadas, portanto nenhum e-mail foi enviado.

## Dependências e segurança do projeto

O lockfile foi normalizado com instalação limpa. Durante a validação, avisos atuais exigiram atualização corretiva para Next.js `16.2.11`, `eslint-config-next` `16.2.11`, PostCSS `8.5.25` e Sharp `0.35.3`. O audit passou com zero vulnerabilidades. Permanecem apenas avisos de depreciação de subpacotes transitivos do React Email, sem falha de instalação ou build.

## Validação local

Gates executados:

1. `npm ci`: aprovado;
2. `npm audit --audit-level=low`: aprovado, 0 vulnerabilidades;
3. `npm run typecheck`: aprovado;
4. `npm run lint`: aprovado;
5. `npm run test:unit`: aprovado, 30 testes;
6. `npm run test:e2e`: aprovado, 8 cenários e 2 omissões intencionais;
7. `npm run build`: aprovado;
8. `git diff --check`: aprovado;
9. varredura de secrets rastreados: aprovada.

Os testes adicionados cobrem validação dos blocos de campanha, rejeição de HTML e URLs inseguras, exigência de alt em imagens, lead manual sem e-mail, fontes permitidas, pipeline e interações. Nenhuma campanha ou mensagem da Evolution foi enviada durante a validação.

## Revisão

Mensagem de commit adotada para a publicação autorizada:

`feat: adiciona campanhas crm leve e preparacao whatsapp`
