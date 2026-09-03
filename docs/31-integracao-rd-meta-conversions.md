# Integração RD Station CRM → Meta Conversions API

## Objetivo

Registrar um único evento `Purchase` no Pixel Meta `1293414084833785` quando uma negociação elegível for fechada no RD Station CRM. A integração não modifica campanhas, anúncios, orçamento, público ou criativo da Meta e não processa vendas históricas.

## Escopo autorizado

- Fonte RD exclusiva: `Meta Ads | Instagram Direct` (`6a980525d9c2fd0020f81357`).
- Roteiros exclusivos:
  - `China e Singapura` (`6874ffc7c2915d001468360d`);
  - `Vietnã, Camboja e Tailândia` (`67641a5d45b136001d808c53`).
- Estado inicial obrigatório: envio desativado (`enabled = false`).

## Fluxo

1. O RD chama `POST /api/integrations/rd/meta-purchase` apenas para `crm_deal_updated`, com o header `x-leehov-rd-webhook-key`.
2. A aplicação valida o segredo, tamanho e JSON do payload, sem gravar o payload bruto.
3. A venda somente é elegível se estiver `won`, tiver valor positivo, data de fechamento válida, contato associado, fonte e roteiro autorizados.
4. A aplicação busca o contato no RD e envia à Meta somente hashes SHA-256 de e-mail, telefone e/ou identificador externo.
5. O identificador Meta é determinístico por negócio (`rd_purchase_<deal_id>`); o banco também mantém uma chave única por venda.
6. Caso uma venda já registrada mude de valor, ela recebe `review_required`; nunca é enviada uma nova compra automaticamente.

## Segurança e operação

- Os logs guardam somente IDs, metadados operacionais e estado do processamento. Não guardam e-mail, telefone, hashes de contato ou payload completo.
- As tabelas de configuração, campanhas, tokens OAuth e eventos usam RLS sem políticas públicas e permissões apenas para `service_role`.
- OAuth é preferencial no RD. Access e refresh tokens renovados ficam cifrados na tabela `meta_conversion_rd_oauth_tokens`, com `WEBHOOK_SECRET_ENCRYPTION_KEY`; `RD_CRM_API_TOKEN` existe apenas como contingência temporária.
- A autorização inicial é iniciada por um administrador em `GET /api/integrations/rd/oauth/start`. O callback fixo é `https://leehovturismo.com.br/api/integrations/rd/oauth/callback`: ele valida `state` em cookie HTTP-only, troca o `code` uma única vez e armazena os tokens cifrados. O `RD_CRM_REFRESH_TOKEN` de ambiente é somente uma contingência de migração; o refresh ativo fica no banco protegido.
- O cron `GET /api/cron/meta-conversions/retry` exige `Authorization: Bearer <META_CONVERSIONS_CRON_SECRET>`.
- O agendamento roda no Supabase a cada 15 minutos (e n\u00e3o na Vercel Hobby). A URL de produ\u00e7\u00e3o e o token s\u00e3o mantidos cifrados no Supabase Vault como `leehov_meta_conversions_retry_url` e `leehov_meta_conversions_retry_token`; a migration n\u00e3o versiona nem revela seus valores.
- Antes de habilitar o toggle, configurar as variáveis somente em Production e executar o evento técnico de teste no Gerenciador de Eventos.

## Testes obrigatórios antes de ativar

1. Enviar evento técnico anônimo com o código de teste da Meta.
2. Criar uma negociação de teste claramente identificada, sem reutilizar venda real, usando fonte e roteiro autorizados.
3. Movê-la para `won` e conferir um único `Purchase`, BRL e valor corretos no Pixel e no painel.
4. Confirmar que Indicação, WhatsApp direto, Site, Remarketing e campanhas fora da lista são ignorados.
