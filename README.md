# Leehov Turismo

Projeto de reformulação do site institucional e painel administrativo da **Leehov Turismo**, com foco em **caravanas e viagens em grupo acompanhadas**.

O projeto será construído de forma modular para permitir uma primeira entrega sólida e evoluções futuras sem reescrever o sistema inteiro, essa pequena bênção rara no desenvolvimento web.

## Stack prevista

- Next.js com App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Vercel
- React Hook Form
- Zod
- Lucide React
- Resend
- Google Business Profile API
- Cloudflare Turnstile
- Paper MCP como fonte de referência visual

## Objetivo

Criar uma plataforma moderna e administrável, substituindo a estrutura atual em WordPress por um site público mais limpo, responsivo e orientado à conversão, além de um painel administrativo para gestão de caravanas, blog, leads, newsletter, pop-ups, depoimentos, webhooks, mídia e configurações gerais.

## Fluxo de trabalho com agentes e IDE

A IDE/agente pode trabalhar localmente dentro do escopo de uma tarefa solicitada, sem precisar pedir aprovação para cada pequena ação.

Dentro de uma tarefa combinada, a IDE pode:

1. criar arquivos localmente;
2. alterar arquivos localmente;
3. organizar pastas;
4. gerar documentos;
5. criar componentes;
6. instalar dependências locais necessárias ao setup ou à tarefa;
7. rodar comandos de desenvolvimento, lint, build e testes;
8. refatorar arquivos relacionados à tarefa;
9. mostrar diff ou resumo para revisão.

Essas alterações locais devem passar pelo fluxo de revisão da IDE antes de qualquer commit, push ou deploy.

## Ações que ainda precisam de confirmação

Antes das ações abaixo, deve haver confirmação clara do responsável pelo projeto:

1. commit;
2. push;
3. pull request;
4. merge;
5. deploy;
6. migrations no Supabase remoto;
7. alterações em dados de produção;
8. alterações em variáveis de ambiente reais;
9. configuração de serviços externos;
10. ativação de serviços pagos;
11. mudança de stack;
12. remoção de módulos importantes;
13. implementação de funcionalidades fora do MVP.

## Aprovação e revisão

Não é necessário usar uma frase padrão de aprovação.

A confirmação pode acontecer em linguagem natural ou pelo próprio fluxo de revisão da IDE, desde que fique claro o que será enviado ou aplicado.
## Documentos norteadores

Os documentos de base estão em `/docs`:

1. `00-regra-operacional.md`
2. `01-design-system.md`
3. `02-briefing.md`
4. `03-stack-e-arquitetura.md`
5. `04-mapa-site.md`
6. `05-mapa-admin.md`
7. `06-banco-supabase.md`
8. `07-regras-negocio.md`
9. `08-mvp-roadmap.md`
10. `09-checklist-conteudos-acessos.md`
11. `10-cronograma.md`
12. `11-prompt-mestre-desenvolvimento.md`
13. `12-contexto-completo-do-projeto.md`
14. `13-integracao-google-business-profile.md`
15. `14-emails-resend.md`
16. `15-webhooks-e-automacoes.md`
17. `16-modelagem-supabase-sql.md`
18. `17-componentes-ui.md`
19. `18-fluxos-site-publico.md`
20. `19-fluxos-admin.md`
21. `20-backlog-implementacao.md`
22. `21-plano-setup-tecnico.md`
