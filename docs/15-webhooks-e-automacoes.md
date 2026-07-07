# Webhooks e Automações

## Objetivo

O módulo de webhooks permite que eventos importantes do site e do painel administrativo sejam enviados para automações externas sem transformar o MVP em um construtor visual de automações.

O painel administrativo deve possuir uma aba chamada Webhooks para configurar disparos de eventos do sistema para automações externas.

Rota planejada: `/admin/webhooks`.

Item no menu lateral: `Webhooks`.

## Eventos previstos para o MVP

1. `lead.created`
2. `caravan_interest.created`
3. `contact.created`
4. `newsletter.subscribed`
5. `newsletter.confirmed`
6. `google_review.created`
7. `google_review.low_rating`
8. `caravan.created`
9. `caravan.updated`
10. `caravan.published`
11. `blog_post.published`

## Funcionalidades do admin

1. Criar configuração.
2. Editar configuração.
3. Ativar ou desativar.
4. Selecionar evento.
5. Configurar destino externo.
6. Configurar chave de validação.
7. Testar envio.
8. Ver histórico.
9. Reenviar falhas.
10. Excluir configuração.

## Tabelas sugeridas

### `webhooks`

1. `id`
2. `name`
3. `url`
4. `event`
5. `validation_key`
6. `description`
7. `active`
8. `created_at`
9. `updated_at`

### `webhook_logs`

1. `id`
2. `webhook_id`
3. `event`
4. `delivery_id`
5. `payload`
6. `status`
7. `response_status`
8. `response_body`
9. `error_message`
10. `attempts`
11. `created_at`
12. `sent_at`

## Regras

1. Falha no disparo não deve bloquear a ação principal.
2. O envio deve acontecer no servidor.
3. Credenciais não devem aparecer no front-end.
4. Logs devem registrar status, resposta e erro.
5. O admin deve exibir o último status de envio.
6. O sistema deve permitir reenvio manual de falhas.

## Fora do MVP

1. Construtor visual de automações.
2. Condições avançadas por campo.
3. Múltiplas etapas de automação.
4. Editor livre de payload.
5. Integração nativa com vários CRMs.
