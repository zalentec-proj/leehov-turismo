# Gestão de usuários, permissões e convites

## Escopo implementado

O painel administrativo usa o Supabase Auth para identidade e sessão. O banco mantém estado, perfil e autorização em `profiles`, `permissions`, `role_permissions` e `profile_permission_overrides`.

- `admin`: acesso total e indelegável ao módulo de usuários;
- `editor`: preset atual do painel, com concessões e negações individuais;
- `active=false`: bloqueio imediato em proxy, Server Actions e RLS;
- MFA: TOTP opcional, com AAL2 obrigatório após o fator ser verificado;
- convites e recuperação: links de uso único gerados no servidor e enviados pelo Resend;
- troca de e-mail: token aleatório armazenado somente como SHA-256, válido por 24 horas;
- exclusão: exige suspensão prévia, confirmação do e-mail e preflight de vínculos/Storage.

Tokens, senhas, cookies e segredos não devem ser adicionados a logs ou auditorias.

## Migration local

Arquivo: `supabase/migrations/20260805161550_admin_users_permissions_and_invites.sql`.

A migration é aditiva, preserva usuários atuais e faz backfill de `accepted_at` para perfis ativos. Ela também substitui policies amplas de staff por policies ligadas a permissões efetivas e adiciona proteção para transições de publicação.

Não aplicar remotamente sem a autorização operacional prevista em `AGENTS.md`.

## Variáveis

Além das variáveis existentes, o webhook exige:

```text
RESEND_WEBHOOK_SECRET=
```

## Configuração externa pendente de aprovação

1. Aplicar a migration no projeto Supabase `awfcyrpuzhovxixzpqzv`.
2. Regenerar os tipos diretamente do banco após a migration.
3. Incluir nas URLs permitidas do Supabase Auth os callbacks HTTPS de produção.
4. Habilitar TOTP e proteção contra senhas vazadas no Supabase Auth.
5. Validar domínio, SPF/DKIM, remetente e reply-to no Resend.
6. Desabilitar click tracking no domínio usado pelos e-mails de autenticação.
7. Criar o webhook Resend apontando para `/api/webhooks/resend` e configurar o segredo Svix.
8. Configurar as variáveis correspondentes na Vercel.

## Validação após configuração

Executar convite, reenvio, primeiro acesso, recuperação, troca de e-mail, suspensão durante sessão ativa, reativação, reset de MFA e exclusão com uma conta de teste. Confirmar também eventos duplicados e estados `delivered`, `delayed`, `bounced`, `complained`, `suppressed` e `failed` no webhook, sem usar destinatários reais nos cenários de falha.
