# Backlog de Implementação

Este documento organiza o desenvolvimento do projeto Leehov Turismo em fases objetivas.

Cada fase deve ser concluída com revisão local antes de commit, push ou deploy.

## Fase 1 — Ajustes finais de documentação

Tarefas:

1. Revisar documentos `00` a `21`.
2. Corrigir conflitos entre MVP antigo e módulos novos.
3. Garantir que Webhooks, Resend, Google Business Profile e Turnstile estejam documentados.
4. Validar que a regra operacional local esteja clara.

Dependências:

1. Documentos atuais no repositório.
2. Referências visuais no Paper.

Critérios de aceite:

1. Docs completos e revisados.
2. Sem conflito crítico sobre escopo do MVP.
3. Setup técnico documentado, mas não executado.

## Fase 2 — Setup técnico

Tarefas:

1. Criar projeto Next.js na raiz.
2. Configurar TypeScript, Tailwind, ESLint e App Router.
3. Configurar alias `@/*`.
4. Criar estrutura `src/`.
5. Criar `.env.example`.
6. Instalar dependências previstas.

Dependências:

1. Aprovação para iniciar setup.
2. Node compatível.

Critérios de aceite:

1. `npm run dev` inicia.
2. `npm run build` passa.
3. Estrutura inicial segue arquitetura definida.

## Fase 3 — Design system em código

Tarefas:

1. Configurar shadcn/ui.
2. Mapear tokens Leehov no Tailwind.
3. Criar componentes compartilhados.
4. Criar padrões de botão, badge, card, form e estados.
5. Validar responsividade base.

Dependências:

1. Setup técnico.
2. `docs/01-design-system.md`.
3. Paper MCP.

Critérios de aceite:

1. Componentes base renderizam.
2. Visual não parece shadcn genérico.
3. Tokens Leehov aplicados.

## Fase 4 — Supabase e migrations

Tarefas:

1. Inicializar Supabase local ou configurar workflow de migrations.
2. Criar migrations das tabelas.
3. Criar enums, índices e constraints.
4. Criar RLS.
5. Criar buckets de Storage.
6. Criar seeds iniciais.

Dependências:

1. Aprovação para migrations.
2. Projeto Supabase definido.
3. `docs/16-modelagem-supabase-sql.md`.

Critérios de aceite:

1. Migrations aplicam localmente.
2. RLS cobre tabelas expostas.
3. Visitante só acessa dados públicos.
4. Admin/editor acessa dados internos.

## Fase 5 — Site público base

Tarefas:

1. Criar layout público.
2. Criar header e footer.
3. Criar rotas públicas base.
4. Configurar metadata básica.
5. Criar fontes e estilos globais.

Dependências:

1. Design system em código.

Critérios de aceite:

1. Rotas públicas carregam.
2. Header/footer responsivos.
3. Visual alinhado ao Paper.

## Fase 6 — Home

Tarefas:

1. Criar hero com carrossel.
2. Criar seção de vídeo institucional.
3. Criar próximas caravanas.
4. Criar avião/céu.
5. Criar diferenciais.
6. Criar depoimentos.
7. Criar inspirações de viagem.
8. Criar newsletter.

Dependências:

1. Site público base.
2. Queries de caravanas e posts.

Critérios de aceite:

1. Home responsiva.
2. Hero usa caravanas destacadas.
3. Fallbacks funcionam quando não há conteúdo.

## Fase 7 — Caravanas

Tarefas:

1. Criar módulo `features/caravans`.
2. Criar types, schemas, queries e utils.
3. Criar listagem pública.
4. Criar filtros.
5. Criar cards.

Dependências:

1. Supabase.
2. Design system.

Critérios de aceite:

1. Apenas caravanas publicadas aparecem no site.
2. Busca e filtros funcionam.
3. Cards exibem status e dados essenciais.

## Fase 8 — Página individual de caravana

Tarefas:

1. Criar rota `/caravanas/[slug]`.
2. Criar hero.
3. Criar resumo rápido.
4. Criar galeria ou vídeo.
5. Criar roteiro em accordion/timeline.
6. Criar inclusos e não inclusos.
7. Criar FAQ.
8. Criar formulário de interesse.

Dependências:

1. Módulo caravanas.
2. Leads.

Critérios de aceite:

1. Página é limpa e progressiva.
2. Roteiro não sobrecarrega mobile.
3. Formulário salva lead.

## Fase 9 — Admin base

Tarefas:

1. Criar layout admin.
2. Criar login.
3. Proteger rotas admin.
4. Criar sidebar.
5. Criar dashboard.
6. Criar helpers de permissão.

Dependências:

1. Supabase Auth.
2. Profiles e RLS.

Critérios de aceite:

1. Admin exige login.
2. Usuário sem perfil ativo não acessa.
3. Dashboard renderiza métricas iniciais.

## Fase 10 — Admin de caravanas

Tarefas:

1. Criar listagem.
2. Criar formulário em abas.
3. Criar CRUD de caravanas.
4. Criar saídas.
5. Criar roteiro dia a dia.
6. Criar imagens.
7. Criar publicação/destaques.

Dependências:

1. Admin base.
2. Módulo caravanas.
3. Storage.

Critérios de aceite:

1. Cliente consegue criar e publicar caravana.
2. Hero/Home podem ser administrados.
3. Uploads funcionam apenas autenticados.

## Fase 11 — Blog

Tarefas:

1. Criar módulo `features/blog`.
2. Criar listagem pública.
3. Criar post aberto.
4. Criar CRUD admin.
5. Criar destaque no blog e home.

Dependências:

1. Admin base.
2. Supabase.

Critérios de aceite:

1. Apenas posts publicados aparecem no site.
2. Admin cria e publica posts.
3. Posts podem relacionar caravanas.

## Fase 12 — Leads e formulários

Tarefas:

1. Criar módulo `features/leads`.
2. Criar formulário de contato.
3. Criar formulário de interesse.
4. Validar Turnstile server-side.
5. Criar admin de leads.
6. Criar ação de WhatsApp.

Dependências:

1. Supabase.
2. Turnstile.
3. Resend, se e-mails forem enviados nessa fase.

Critérios de aceite:

1. Leads são salvos.
2. Visitantes não leem leads.
3. Admin filtra por status, origem e caravana.

## Fase 13 — Newsletter e Resend

Tarefas:

1. Criar módulo `features/newsletter`.
2. Criar double opt-in.
3. Criar templates React/TSX.
4. Integrar Resend server-side.
5. Criar `email_logs`.
6. Criar configurações de e-mail no admin.

Dependências:

1. Supabase.
2. Resend configurado.
3. Domínio verificado.

Critérios de aceite:

1. Inscrição inicia como `pending`.
2. Confirmação ativa inscrição.
3. Logs registram envios.
4. Falha de e-mail não apaga dados.

## Fase 14 — Depoimentos e Google Business Profile

Tarefas:

1. Criar depoimentos manuais.
2. Criar widget público.
3. Criar configurações de Google Business Profile.
4. Criar sincronização de reviews.
5. Criar responder review.
6. Criar remover resposta da empresa.
7. Criar alertas de nota baixa.

Dependências:

1. OAuth Google.
2. Supabase.
3. Resend para alertas, se habilitado.

Critérios de aceite:

1. Reviews são lidos do cache.
2. Admin controla visibilidade.
3. Admin não promete excluir avaliação original.

## Fase 15 — Pop-ups

Tarefas:

1. Criar módulo `features/popups`.
2. Criar CRUD admin.
3. Criar renderizador público.
4. Criar regra de frequência.
5. Integrar com newsletter, WhatsApp ou caravana.

Dependências:

1. Admin base.
2. Site público.

Critérios de aceite:

1. Apenas pop-up ativo aparece.
2. Usuário consegue fechar.
3. Mobile é utilizável.

## Fase 16 — Webhooks

Tarefas:

1. Criar módulo `features/webhooks`.
2. Criar CRUD admin.
3. Criar logs.
4. Criar teste de envio.
5. Criar disparo server-side nos eventos previstos.
6. Criar reenvio manual de falhas.

Dependências:

1. Módulos que emitem eventos.
2. Supabase.

Critérios de aceite:

1. Falha não bloqueia ação principal.
2. Logs registram payload, resposta e erro.
3. Chave de validação não aparece no front-end.

## Fase 17 — Configurações

Tarefas:

1. Criar configurações de contato.
2. Criar WhatsApp.
3. Criar SEO global.
4. Criar Analytics/GTM/Pixel via admin.
5. Criar integrações.
6. Criar configurações da Home.

Dependências:

1. Admin base.
2. `site_settings`.

Critérios de aceite:

1. Configurações públicas aparecem no site.
2. Configurações sensíveis ficam protegidas.
3. Analytics/GTM/Pixel não dependem de `.env`.

## Fase 18 — Testes

Tarefas:

1. Testar responsividade.
2. Testar formulários.
3. Testar RLS.
4. Testar admin.
5. Testar e-mails.
6. Testar webhooks.
7. Testar SEO básico.

Dependências:

1. Funcionalidades principais implementadas.

Critérios de aceite:

1. Build passa.
2. Fluxos críticos funcionam.
3. RLS bloqueia acessos indevidos.
4. UI não apresenta sobreposição em mobile.

## Fase 19 — Publicação

Tarefas:

1. Configurar Vercel.
2. Configurar variáveis de ambiente.
3. Aplicar migrations aprovadas.
4. Configurar domínio.
5. Validar produção.
6. Configurar Analytics/Pixel no admin.

Dependências:

1. Aprovação para deploy.
2. Acessos técnicos.
3. Testes concluídos.

Critérios de aceite:

1. Site publicado.
2. Admin acessível.
3. Formulários funcionando.
4. Conteúdo principal migrado.

## Fase 20 — Treinamento

Tarefas:

1. Treinar criação de caravanas.
2. Treinar blog.
3. Treinar leads.
4. Treinar newsletter.
5. Treinar depoimentos.
6. Treinar pop-ups.
7. Treinar configurações.

Dependências:

1. Site publicado.
2. Admin estável.

Critérios de aceite:

1. Cliente consegue atualizar conteúdos essenciais.
2. Dúvidas iniciais registradas.
3. Suporte inicial pode começar.
