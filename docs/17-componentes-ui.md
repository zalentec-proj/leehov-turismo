# Componentes UI

Este documento define a arquitetura de componentes UI para o site público e painel administrativo da Leehov Turismo.

O shadcn/ui deve ser usado como base técnica. A identidade final deve ser construída com componentes próprios Leehov, Tailwind CSS, tokens do design system e referências aprovadas no Paper MCP.

## Direção visual

Referências lidas no Paper:

1. Landing page desktop com hero fotográfico, overlay azul, navegação transparente, CTA e cards de destinos.
2. Seção de roteiros em destaque com cards brancos, imagem, selo, preço e navegação de carrossel.
3. Seção institucional com avião, céu, linha pontilhada e imagens sobrepostas.
4. Seção de diferenciais com cards compactos e ícones.
5. Banner de newsletter com fundo azul e imagem de destino.
6. Depoimentos em cards brancos com navegação.
7. Blog/inspirações com cards editoriais.
8. Admin dashboard com sidebar fixa, cards de métricas, gráfico, listas recentes e tabelas densas.

Tokens identificados no Paper:

1. `--color-navy-950`: `#061A2A`
2. `--color-navy-800`: `#083C5A`
3. `--color-blue-500`: `#0CA8E8`
4. `--color-blue-300`: `#3AC6F4`
5. `--color-surface`: `#F6FBFF`
6. `--color-text`: `#183B59`
7. `--font-sans`: `Inter`
8. `--text-display`: `96px`
9. `--text-h1`: `52px`
10. `--text-h2`: `40px`
11. `--text-body`: `16px`
12. `--font-weight-bold`: `800`
13. `--spacing-page-x`: `112px`
14. `--radius-card`: `18px`

## Estrutura

Estrutura prevista:

```txt
src/
  components/
    ui/
    leehov/
      site/
      admin/
      shared/
```

Regras:

1. `src/components/ui` recebe componentes shadcn/ui sem identidade final.
2. `src/components/leehov/shared` recebe wrappers e primitivas de marca.
3. `src/components/leehov/site` recebe seções e componentes do site público.
4. `src/components/leehov/admin` recebe layout, tabelas, forms e widgets do painel.
5. Componentes de feature muito específicos podem ficar em `src/features/*/components`.

## shadcn/ui necessários

Componentes base previstos:

1. `button`
2. `card`
3. `badge`
4. `input`
5. `textarea`
6. `select`
7. `checkbox`
8. `switch`
9. `radio-group`
10. `label`
11. `form`
12. `tabs`
13. `accordion`
14. `dialog`
15. `sheet`
16. `dropdown-menu`
17. `popover`
18. `calendar`
19. `table`
20. `separator`
21. `avatar`
22. `skeleton`
23. `toast` ou `sonner`
24. `alert`
25. `tooltip`
26. `breadcrumb`
27. `command`, se houver busca avançada no admin
28. `pagination`, se disponível na versão instalada ou criado como wrapper próprio
29. `chart`, para dashboard

## Componentes compartilhados

Componentes em `/components/leehov/shared`:

1. `LeehovButton`
2. `LeehovBadge`
3. `LeehovCard`
4. `SectionHeading`
5. `ResponsiveImage`
6. `StatusBadge`
7. `PriceLabel`
8. `WhatsAppButton`
9. `EmptyState`
10. `LoadingBlock`
11. `ErrorState`
12. `FormSection`
13. `MediaPicker`
14. `ConfirmDialog`
15. `PaginationControls`

Padrões:

1. Bordas arredondadas entre 8px e 18px conforme contexto.
2. Sombras leves baseadas em azul-marinho com baixa opacidade.
3. Texto principal em `navy/text`, secundário em `muted`.
4. CTA principal azul/ciano.
5. Estados sem conteúdo com texto objetivo e uma ação clara.

## Botões

Variações:

1. `primary`: azul/ciano, usado para ações principais.
2. `secondary`: branco com borda azul clara.
3. `ghost`: navegação, ações secundárias e toolbar.
4. `danger`: exclusões e ações irreversíveis.
5. `whatsapp`: ação externa de atendimento.

Regras:

1. Botões de ação devem usar ícones Lucide quando aumentarem reconhecimento.
2. Não usar texto longo dentro de botões compactos.
3. CTAs públicos devem ser claros: `Ver detalhes`, `Falar no WhatsApp`, `Conhecer caravanas`.
4. Ações destrutivas exigem confirmação visual.

## Cards

Cards públicos:

1. `CaravanCard`: imagem, selo, título, destino, duração, saída, status, preço opcional e CTA.
2. `ArticleCard`: imagem, categoria, título, resumo curto, data e tempo de leitura.
3. `TestimonialCard`: nome, origem, avaliação, texto e selo Google quando aplicável.
4. `BenefitCard`: ícone, título e texto curto.

Cards admin:

1. `MetricCard`: ícone, rótulo, valor e variação.
2. `DashboardListCard`: título, link de ver todos e lista compacta.
3. `FormCard`: bloco de campos com título e descrição curta.
4. `IntegrationStatusCard`: status de integração, última execução e ação.

Regras:

1. Evitar cards dentro de cards.
2. No site público, cards devem respirar e usar imagem real quando houver.
3. No admin, cards devem priorizar densidade, leitura rápida e alinhamento.

## Badges e status

Badges previstos:

1. `Disponível`
2. `Em breve`
3. `Lista de espera`
4. `Esgotado`
5. `Rascunho`
6. `Publicado`
7. `Novo`
8. `Em atendimento`
9. `Convertido`
10. `Arquivado`
11. `Manual`
12. `Google`
13. `Falhou`
14. `Enviado`

Mapeamento visual:

1. Sucesso: verde.
2. Atenção: amarelo.
3. Erro: vermelho.
4. Informação: azul.
5. Neutro: cinza/azul claro.

## Tabelas

Usar TanStack Table com componentes shadcn.

Tabelas previstas:

1. Caravanas.
2. Posts.
3. Leads.
4. Newsletter.
5. Depoimentos.
6. Pop-ups.
7. Mídia.
8. Webhooks.
9. Logs de e-mail.
10. Logs de webhook.
11. Usuários.

Padrões:

1. Coluna inicial com identidade visual do item: imagem, avatar ou ícone.
2. Status sempre em badge.
3. Ações em menu ou botões compactos.
4. Busca e filtros acima da tabela.
5. Paginação no rodapé.
6. Linhas com altura consistente.
7. Layout mobile pode virar lista de cards simples.

## Formulários

Usar React Hook Form com Zod.

Padrões:

1. Separar formulários longos em abas.
2. Agrupar campos em `FormSection`.
3. Mostrar erros perto do campo.
4. Salvar server-side via Server Actions ou Route Handlers.
5. Usar `disabled` e estado de loading durante envio.
6. Campos sensíveis nunca devem ser exibidos em texto puro no client.

Formulários principais:

1. Interesse em caravana.
2. Contato.
3. Newsletter.
4. Login.
5. Criar/editar caravana.
6. Criar/editar post.
7. Configurações.
8. Google Business Profile.
9. E-mails.
10. Webhooks.

## Carrosséis

Carrosséis previstos:

1. Hero da Home.
2. Cards de caravanas/destinos.
3. Depoimentos.
4. Galeria da caravana.

Regras:

1. Deve funcionar com teclado e toque.
2. Deve ter indicadores ou setas.
3. Deve preservar contraste em imagens com overlay.
4. Deve pausar autoplay quando o usuário interagir, se autoplay for usado.
5. Mobile deve evitar textos sobrepostos sem legibilidade.

## Seções da Home

Componentes em `/components/leehov/site`:

1. `SiteHeader`
2. `HeroCarousel`
3. `FeaturedRoutesSection`
4. `InstitutionalVideoSection`
5. `AboutLeehovSection`
6. `PlaneRouteSection`
7. `WhyTravelWithLeehovSection`
8. `TestimonialsSection`
9. `TravelInspirationsSection`
10. `NewsletterSection`
11. `SiteFooter`
12. `PopupRenderer`

Regras:

1. A Home deve abrir com experiência real, não landing genérica.
2. Seções devem ter respiro vertical amplo.
3. O avião/céu deve ser leve e respeitar `prefers-reduced-motion`.
4. Imagens devem ter `alt` descritivo.

## Widgets

Widgets públicos:

1. `GoogleReviewsWidget`
2. `ManualTestimonialsWidget`
3. `WhatsAppFloatingButton`
4. `NewsletterSignup`
5. `FAQAccordion`
6. `CaravanInterestForm`

Widgets admin:

1. `MetricGrid`
2. `RecentLeadsWidget`
3. `PopularCaravansWidget`
4. `RecentActivitiesWidget`
5. `SiteStatusWidget`
6. `IntegrationHealthWidget`

## Admin layout

Componentes em `/components/leehov/admin`:

1. `AdminShell`
2. `AdminSidebar`
3. `AdminTopbar`
4. `AdminPageHeader`
5. `AdminDataTable`
6. `AdminFormTabs`
7. `AdminMediaLibrary`
8. `AdminStatusBadge`
9. `AdminActivityList`

Padrões:

1. Sidebar fixa em desktop.
2. Topbar com busca, data/contexto e usuário.
3. Conteúdo em superfície `#F6FBFF`.
4. Cards brancos com borda leve.
5. Tabelas limpas e densas.
6. Mobile deve usar navegação em sheet.

## Loading, erro e vazio

Estados obrigatórios:

1. Skeleton para cards, listas e tabelas.
2. Estado vazio com ação principal.
3. Erro recuperável com botão de tentar novamente.
4. Erro de permissão com mensagem clara.
5. Estado offline ou falha de integração para Google/Resend/Webhooks.

## Responsividade

Breakpoints previstos:

1. Mobile: até 767px.
2. Tablet: 768px a 1023px.
3. Desktop: 1024px ou mais.
4. Desktop amplo: acima de 1280px.

Regras:

1. Header público vira sheet no mobile.
2. Cards passam de grid para lista no mobile.
3. Hero deve manter imagem legível com overlay.
4. CTA importante pode ficar fixo no mobile em página de caravana.
5. Admin deve priorizar leitura em cards/listas no mobile.

## Acessibilidade

1. Usar semântica HTML correta.
2. Garantir contraste em textos sobre imagem.
3. Não depender só de cor para status.
4. Inputs precisam de labels.
5. Modais e sheets devem prender foco.
6. Ícones sem texto precisam de `aria-label`.
7. Animações devem respeitar redução de movimento.
