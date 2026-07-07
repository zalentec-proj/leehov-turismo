# E-mails Transacionais com Resend

Este documento define a estratégia de e-mails transacionais do projeto **Leehov Turismo**, usando **Resend** como provedor de envio.

## 1. Objetivo

Usar Resend para enviar e-mails automáticos gerados por ações do site e do painel administrativo.

O Resend será usado para:

1. notificações internas para a equipe da Leehov;
2. confirmações para visitantes;
3. fluxo de newsletter com confirmação;
4. alertas relacionados a avaliações do Google, quando aplicável;
5. registro e rastreabilidade de envios.

O Resend não será usado, no MVP, como ferramenta completa de campanhas de e-mail marketing em massa.

## 2. Decisão técnica

Provider escolhido:

```txt
Resend
```

Templates:

```txt
React/TSX versionados no código
```

Logs:

```txt
Supabase, tabela email_logs
```

Configurações editáveis:

```txt
Admin > Configurações > E-mails
```

## 3. Variáveis de ambiente

As credenciais e remetentes técnicos ficam em variáveis de ambiente.

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=
ADMIN_LEADS_EMAIL=
ADMIN_CONTACT_EMAIL=
ADMIN_NOTIFICATIONS_EMAIL=
```

Exemplo:

```env
RESEND_FROM_EMAIL="Leehov Turismo <contato@leehovturismo.com.br>"
RESEND_REPLY_TO_EMAIL="contato@leehovturismo.com.br"
ADMIN_LEADS_EMAIL="contato@leehovturismo.com.br"
ADMIN_CONTACT_EMAIL="contato@leehovturismo.com.br"
ADMIN_NOTIFICATIONS_EMAIL="contato@leehovturismo.com.br"
```

## 4. Domínio de envio

Recomendação:

```txt
mail.leehovturismo.com.br
```

ou

```txt
envios.leehovturismo.com.br
```

O domínio deve ser verificado no Resend antes de usar remetentes profissionais.

## 5. Configurações no admin

Criar área:

```txt
Configurações > E-mails
```

Campos sugeridos:

1. Ativar envios de e-mail.
2. Enviar confirmação para visitantes.
3. E-mails que recebem leads.
4. E-mails que recebem contatos gerais.
5. E-mails que recebem notificações internas.
6. Nome do remetente.
7. Reply-to.
8. Texto de rodapé dos e-mails.
9. WhatsApp exibido nos e-mails.
10. Endereço exibido nos e-mails, se necessário.

Observação: não permitir edição livre de HTML no admin. Templates devem ficar versionados no código, permitindo edição apenas de campos simples e seguros.

## 6. Templates obrigatórios do MVP

### 6.1 `AdminCaravanLeadEmail`

Disparado quando um visitante envia interesse em uma caravana.

Destinatário:

```txt
ADMIN_LEADS_EMAIL ou lista configurada no admin
```

Assunto:

```txt
Novo interesse em caravana: {{caravanTitle}}
```

Conteúdo:

1. Nome do interessado.
2. WhatsApp.
3. E-mail.
4. Cidade/estado, se informado.
5. Caravana de interesse.
6. Mensagem.
7. Origem.
8. Data e hora.
9. Link para abrir o lead no admin.

### 6.2 `VisitorCaravanLeadConfirmationEmail`

Disparado para o visitante após envio de interesse em caravana.

Assunto:

```txt
Recebemos seu interesse na caravana {{caravanTitle}}
```

Conteúdo:

1. Saudação com nome.
2. Confirmação de recebimento.
3. Nome da caravana.
4. Informação de que a equipe entrará em contato.
5. Botão para WhatsApp.
6. Assinatura da Leehov.

### 6.3 `AdminContactEmail`

Disparado quando um visitante envia formulário de contato geral.

Destinatário:

```txt
ADMIN_CONTACT_EMAIL ou lista configurada no admin
```

Assunto:

```txt
Nova mensagem recebida pelo site
```

Conteúdo:

1. Nome.
2. E-mail.
3. WhatsApp.
4. Assunto, se houver.
5. Mensagem.
6. Data e hora.
7. Link para abrir no admin.

### 6.4 `VisitorContactConfirmationEmail`

Disparado para o visitante após envio do formulário de contato.

Assunto:

```txt
Recebemos sua mensagem
```

Conteúdo:

1. Confirmação de recebimento.
2. Informação de que a equipe responderá.
3. Botão para WhatsApp.
4. Contatos oficiais da Leehov.

### 6.5 `NewsletterDoubleOptInEmail`

Disparado após inscrição inicial na newsletter.

Assunto:

```txt
Confirme sua inscrição na Leehov Turismo
```

Conteúdo:

1. Saudação.
2. Explicação da inscrição.
3. Botão de confirmação.
4. Link alternativo de confirmação.
5. Rodapé com contatos.

### 6.6 `NewsletterWelcomeEmail`

Disparado após confirmação da inscrição na newsletter.

Assunto:

```txt
Você está na lista da Leehov Turismo
```

Conteúdo:

1. Confirmação de inscrição ativa.
2. Mensagem de boas-vindas.
3. CTA para conhecer caravanas.
4. CTA para falar com a Leehov.

## 7. Templates opcionais relacionados ao Google Business Profile

### 7.1 `AdminNewGoogleReviewEmail`

Disparado quando uma nova avaliação do Google é sincronizada.

Assunto:

```txt
Nova avaliação recebida no Google
```

Conteúdo:

1. Nome do avaliador.
2. Nota.
3. Comentário.
4. Data da avaliação.
5. Botão para ver no admin.
6. Botão para responder.

### 7.2 `AdminLowRatingGoogleReviewEmail`

Disparado quando uma avaliação sincronizada possui nota baixa.

Critério sugerido:

```txt
nota menor ou igual a 3
```

Assunto:

```txt
Atenção: nova avaliação com nota baixa
```

Conteúdo:

1. Nome do avaliador.
2. Nota.
3. Comentário.
4. Link para responder no admin.
5. Recomendação de ação rápida.

## 8. Estrutura de pastas sugerida

```txt
src/
  emails/
    components/
      EmailLayout.tsx
      EmailButton.tsx
      EmailInfoRow.tsx
      EmailFooter.tsx

    templates/
      AdminCaravanLeadEmail.tsx
      VisitorCaravanLeadConfirmationEmail.tsx
      AdminContactEmail.tsx
      VisitorContactConfirmationEmail.tsx
      NewsletterDoubleOptInEmail.tsx
      NewsletterWelcomeEmail.tsx
      AdminNewGoogleReviewEmail.tsx
      AdminLowRatingGoogleReviewEmail.tsx

  lib/
    email/
      resend.ts
      send-email.ts
      email-log.ts
```

## 9. Tabela `email_logs`

Criar tabela para registrar tentativas e resultados de envio.

Campos sugeridos:

1. `id` uuid primary key;
2. `template_key` text;
3. `recipient_email` text;
4. `subject` text;
5. `provider` text default 'resend';
6. `provider_message_id` text;
7. `status` text;
8. `error_message` text;
9. `related_entity_type` text;
10. `related_entity_id` uuid;
11. `created_at` timestamptz;
12. `sent_at` timestamptz.

Status possíveis:

1. `pending`;
2. `sent`;
3. `failed`;
4. `skipped`.

Exemplos de `template_key`:

1. `admin_caravan_lead`;
2. `visitor_caravan_lead_confirmation`;
3. `admin_contact`;
4. `visitor_contact_confirmation`;
5. `newsletter_double_opt_in`;
6. `newsletter_welcome`;
7. `admin_new_google_review`;
8. `admin_low_rating_google_review`.

## 10. Configurações em `site_settings`

As configurações editáveis pelo admin podem ficar em `site_settings`, usando JSON.

Exemplo:

```json
{
  "emails_enabled": true,
  "send_visitor_confirmations": true,
  "lead_recipients": ["contato@leehovturismo.com.br"],
  "contact_recipients": ["contato@leehovturismo.com.br"],
  "notification_recipients": ["contato@leehovturismo.com.br"],
  "sender_name": "Leehov Turismo",
  "reply_to": "contato@leehovturismo.com.br",
  "footer_phone": "",
  "footer_whatsapp": ""
}
```

## 11. Fluxo de formulário de interesse em caravana

1. Visitante preenche formulário em uma página de caravana.
2. Sistema valida os dados.
3. Sistema salva lead no Supabase.
4. Sistema envia e-mail para a equipe.
5. Sistema envia confirmação para visitante, se habilitado.
6. Sistema registra logs de envio em `email_logs`.
7. Admin visualiza lead no painel.

## 12. Fluxo de contato geral

1. Visitante preenche formulário de contato.
2. Sistema valida os dados.
3. Sistema salva mensagem/lead no Supabase.
4. Sistema envia e-mail para a equipe.
5. Sistema envia confirmação para visitante, se habilitado.
6. Sistema registra logs.

## 13. Fluxo de newsletter com double opt-in

1. Visitante informa nome e e-mail.
2. Sistema salva inscrição com status `pending`.
3. Sistema envia e-mail `NewsletterDoubleOptInEmail`.
4. Visitante clica no link de confirmação.
5. Sistema atualiza inscrição para `active`.
6. Sistema envia `NewsletterWelcomeEmail`.
7. Admin pode visualizar inscritos no painel.

## 14. Fluxo de alertas de Google Reviews

1. Sistema sincroniza avaliações via Google Business Profile.
2. Ao detectar nova avaliação, pode enviar `AdminNewGoogleReviewEmail`.
3. Se a nota for menor ou igual ao limite configurado, pode enviar `AdminLowRatingGoogleReviewEmail`.
4. Sistema registra o envio em `email_logs`.

## 15. Política de envio

1. Nunca enviar e-mail antes de salvar o dado principal no Supabase.
2. Registrar todas as tentativas relevantes em `email_logs`.
3. Falha no envio de e-mail não deve apagar o lead.
4. Erros devem ser visíveis no admin ou logs técnicos.
5. Templates devem usar linguagem clara, institucional e objetiva.
6. E-mails devem incluir CTA para WhatsApp quando fizer sentido.

## 16. O que fica fora do MVP

Não implementar inicialmente:

1. campanhas de e-mail marketing em massa;
2. editor visual de templates no admin;
3. automações complexas por funil;
4. segmentação avançada de newsletter;
5. disparos recorrentes;
6. integração com ferramentas externas de automação;
7. IA para escrever respostas automáticas.

## 17. `.env.example` recomendado

```env
# App
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SITE_NAME="Leehov Turismo"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# Email - Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_REPLY_TO_EMAIL=
ADMIN_LEADS_EMAIL=
ADMIN_CONTACT_EMAIL=
ADMIN_NOTIFICATIONS_EMAIL=

# Google Business Profile
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_REFRESH_TOKEN=

# Anti-spam
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# WhatsApp fallback
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE=
```

## 18. Resumo da decisão

Para o MVP:

1. Resend será o provedor oficial de e-mails transacionais.
2. Templates ficarão em React/TSX versionados no código.
3. Configurações simples ficarão no admin/Supabase.
4. Logs de envio ficarão em `email_logs`.
5. Newsletter usará double opt-in.
6. Campanhas em massa ficam fora do MVP.
