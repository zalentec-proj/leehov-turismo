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
4. Selecionar um ou mais eventos.
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
3. `endpoint_url`
4. `events`
5. `validation_key_ciphertext`
6. `active`
7. autoria e auditoria;
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
12. `request_started_at`, `completed_at` e `updated_at`

## Regras

1. Falha no disparo não deve bloquear a ação principal.
2. O envio deve acontecer no servidor.
3. Credenciais não devem aparecer no front-end.
4. Logs devem registrar status, resposta e erro.
5. O admin deve exibir o último status de envio.
6. O sistema deve permitir reenvio manual de falhas.
7. O corpo usa versão, evento, `deliveryId`, `occurredAt` e dados mínimos da entidade.
8. A assinatura HMAC-SHA256 cobre `timestamp.body` e usa os headers `X-Leehov-*`.
9. URLs internas, loopback, redes privadas, redirects e HTTP em produção são bloqueados; o timeout é de oito segundos.
10. A chave fica criptografada e nunca volta ao navegador depois de salva.
11. Logs expiram após 90 dias e o reenvio preserva payload e `deliveryId`.

## Fora do MVP

1. Construtor visual de automações.
2. Condições avançadas por campo.
3. Múltiplas etapas de automação.
4. Editor livre de payload.
5. Integração nativa com vários CRMs.
