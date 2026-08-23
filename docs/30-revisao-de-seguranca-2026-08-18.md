# Revisão de segurança — 18 de agosto de 2026

## Objetivo

Revisar a exposição de dados no navegador e reforçar as camadas de proteção do site público e do painel administrativo sem alterar os fluxos de conteúdo.

## Achado principal

A URL observada no HTML de Open Graph continha:

- o *project ref* do Supabase, que é um identificador público do projeto;
- um token de URL assinada do Storage, temporário e restrito ao arquivo solicitado.

Ela não continha a `SUPABASE_SECRET_KEY`, a chave da Resend, a chave secreta do Turnstile nem a chave da Places API. Ainda assim, uma URL assinada não deve ficar no HTML de metadata, pois pode ser copiada enquanto estiver válida.

## Medidas implementadas localmente

1. As imagens de Open Graph passaram a ser fornecidas por rotas da própria Leehov:
   - `/api/open-graph/site/principal`;
   - `/api/open-graph/blog/[slug]`;
   - `/api/open-graph/caravana/[slug]`.
2. A rota confirma que o conteúdo é público/publicado antes de obter o arquivo no Storage privado. O HTML, JSON-LD e metadata deixam de expor o token de URL assinada.
3. Foram adicionados cabeçalhos de segurança em produção: CSP restritiva, HSTS, `nosniff`, proteção contra framing, política de referrer, permissões de navegador e isolamento de janela.
4. Rotas administrativas de Google Reviews e Webhooks passaram a exigir mesma origem, JSON e corpo limitado a 64 KiB. O limite é validado pelo tamanho real do corpo, não apenas pelo cabeçalho informado pelo cliente.
5. A autenticação de tokens internos de cron passou a usar comparação em tempo constante.
6. Login e recuperação de senha recebem limites separados e baseados em identificador HMAC; nenhum IP em texto puro é persistido.
7. A função de rate limit aceita apenas escopos conhecidos, hash SHA-256/HMAC válido, janelas e limites seguros; sua execução é concedida apenas à `service_role`.

## Verificações realizadas

- Nenhum valor das chaves `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `GOOGLE_PLACES_API_KEY` ou `FORM_SECURITY_SECRET` foi encontrado nos bundles estáticos.
- Nenhum segredo real foi encontrado em arquivos rastreados pelo Git; apenas `.env.example` é versionado.
- Testes unitários, TypeScript, lint e `git diff --check` foram executados localmente.

## Ações remotas pendentes

1. Aplicar a migration `20260818140612_security_rate_limit_hardening.sql` no projeto Supabase remoto. Ela é necessária antes do deploy, pois libera os escopos novos de login e recuperação de senha no limitador.
2. Executar os advisors de segurança e performance do Supabase. O conector disponível nesta sessão retornou permissão insuficiente e não permitiu essa validação remota.
3. Configurar `NEWSLETTER_CRON_SECRET` de forma igual no Supabase Vault e na Vercel caso o processamento agendado de campanhas seja ativado. Enquanto estiver ausente, o endpoint permanece fechado.
4. Rotacionar a Supabase Secret Key se ela tiver sido revelada fora de um cofre seguro, por exemplo em uma captura de tela ou conversa. A rotação exige atualizar a variável server-side na Vercel e testar painel, uploads e formulários.

## Observações operacionais

- A chave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e o identificador do projeto precisam ser visíveis ao navegador. Eles não concedem privilégios por si só; a proteção real vem de RLS, grants e da ausência de chaves secretas no cliente.
- Uma imagem usada publicamente em Open Graph é, por definição, acessível a quem recebe o link. A mudança evita expor um token do Storage no documento e reduz sua reutilização indevida.
- Não houve aplicação de migration, alteração de variáveis, rotação de chave, commit, push nem deploy durante esta revisão local.
