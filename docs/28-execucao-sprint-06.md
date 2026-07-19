# Execução da Sprint 06 — Revisão Visual, Galeria do Blog e QA Pré-Lançamento

Data da execução local: 18 de julho de 2026.

## Estado da entrega

A Sprint 06 foi implementada localmente sem migration, alteração de dados remotos, publicação de conteúdo, commit, push ou deploy. A entrega cobre a revisão visual do Blog, a galeria editorial com lightbox, o acabamento público e administrativo, a nova página de detalhe de Caravana, vídeo de fundo por caravana e roteiro interativo por dia.

O projeto continuou usando o Supabase remoto **Site Leehov**, project ref mascarado `awfc…pqzv`, somente para leituras de validação. Nenhum Supabase local ou projeto adicional foi criado.

## Referências do Paper

O arquivo aprovado no Paper foi consultado antes das alterações visuais. Foram analisados:

1. os seis layouts atualizados da página **Sprint 02 - Blog**, incluindo listagem pública, post aberto, listagem administrativa, novo post, edição e tratamento de imagens;
2. a página **Pacotes - Detalhe**, especialmente o artboard **Caravana Tailândia, Camboja e Vietnã - Detalhe**;
3. os tokens computados de cor, tipografia, espaçamento, borda e elevação usados nos layouts;
4. a estrutura da página de caravana: hero, navegação por âncoras, visão geral, roteiro, inclusos, informações e formulário de interesse.

O termo principal da interface continua sendo **Caravanas**. O shadcn/ui foi mantido apenas como base técnica, com a identidade Leehov aplicada sobre os componentes.

## Blog público

`/blog` e `/blog/[slug]` foram alinhados aos novos layouts do Paper. O detalhe agora contém hero editorial, capa panorâmica, corpo de leitura, galeria, caravana relacionada, posts relacionados e CTAs.

A nova `BlogPhotoGallery` suporta zero, uma, duas e várias fotos, imagem principal, miniaturas responsivas, legenda, contador, navegação anterior/próxima e o bloco “+N Ver todas”. A capa permanece independente e somente `post.images` participa da galeria.

A `BlogPhotoLightbox` abre no índice selecionado e inclui:

1. overlay de tela cheia e imagem contida;
2. miniaturas roláveis, legenda e contador;
3. botões anterior/próximo e atalhos `ArrowLeft`, `ArrowRight`, `Home` e `End`;
4. fechamento por botão, `Escape` e clique externo;
5. foco preso, restauração do foco e bloqueio do scroll da página;
6. swipe em dispositivos de toque;
7. estados desabilitados nas extremidades;
8. fallback para erro de imagem e redução de transições quando solicitada pelo sistema.

## Administração do Blog

As telas `/admin/blog`, `/admin/blog/novo` e `/admin/blog/[id]` foram reorganizadas conforme o Paper. A listagem ganhou busca, categoria, status, destaque, atualização e ações responsivas.

O formulário preserva as áreas Conteúdo, Imagens, Relacionamentos e Publicação/SEO em uma composição de conteúdo principal e painel lateral. A área de imagens agora oferece:

1. preview real da capa;
2. upload múltiplo, enviando um arquivo por requisição;
3. resultado e loading individuais;
4. cards com preview, texto alternativo e legenda;
5. ordenação por drag-and-drop com `@dnd-kit` e suporte de teclado;
6. controles alternativos para mover para cima ou para baixo;
7. remoção controlada;
8. normalização idempotente de `order_index` pela posição final.

A publicação rejeita qualquer imagem da galeria sem texto alternativo. Foram preservados o limite individual de 8 MiB, a validação MIME/assinatura binária e os paths privados existentes. Nenhuma coluna ou tabela foi adicionada.

## Caravanas, vídeo e roteiro

A página `/caravanas/[slug]` foi reconstruída a partir do modelo de Tailândia, Camboja e Vietnã do Paper. Ela agora inclui hero comercial, métricas, navegação por âncoras, visão geral, composição de fotos, roteiro interativo, inclusos e não inclusos, informações públicas em acordeão, galeria e formulário de interesse.

Cada caravana pode usar seu campo existente `video_url` como vídeo de fundo do slide correspondente na Home. São aceitos:

1. YouTube, por embed sem cookies;
2. Vimeo em modo background;
3. arquivo direto HTTPS ou path local.

Somente o slide ativo recebe o vídeo, sempre mudo, sem controles e com imagem de fallback. Com `prefers-reduced-motion`, o vídeo não é iniciado. O admin identifica o campo como “URL do vídeo de fundo da Home”. A URL encontrada no site antigo para a caravana do Sudeste Asiático foi apenas inventariada; ela não foi gravada, publicada ou hardcoded.

O roteiro usa os campos já existentes em `caravan_itinerary_days`, inclusive `description` e `image_url`. Cada dia pode receber sua própria imagem pelo formulário administrativo. No site, o viajante navega por:

1. abas horizontais de dias;
2. setas anterior/próxima;
3. teclado com setas, `Home` e `End`;
4. swipe/arraste no painel em desktop e mobile.

O painel exibe imagem, descrição, local, refeições e hospedagem, possui fallback visual e não usa autoplay. Gestos ignoram botões e outros controles interativos para não interferir com cliques.

## Acabamento, assets e SEO

Foram refinados cabeçalho, menu mobile, navegação ativa, Home, Quem Somos, Caravanas, Contato, Privacidade, newsletter, footer e AdminShell. Também foram criados estados compartilhados de loading, erro e 404.

Assets permanentes foram organizados em `public/images/leehov`. Referências de código a Paper, Unsplash e WordPress foram removidas. URLs externas armazenadas nos dados de desenvolvimento não são mais exibidas como hotlink; a aplicação usa os fallbacks locais sem alterar os registros `[DEV]`. `next.config.ts` mantém somente o host de mídia do Supabase.

Foram adicionados sitemap, robots, canonical, Open Graph e dados estruturados. Rascunhos continuam fora do Blog público, Home, metadata e sitemap.

## Conteúdo e segurança

O importador de caravanas reais foi preparado em modo exclusivamente `dry-run` e sempre produz rascunhos. Ele não grava no Supabase e não substitui conteúdo `[DEV]`.

A leitura de validação encontrou nove posts no Blog, mas um deles, `jaffa-e-sua-antiga-historia`, já estava publicado antes desta sprint. Como o escopo proíbe alteração de conteúdo remoto e publicação/despublicação sem autorização, esse registro não foi modificado. Os outros oito continuam como rascunho.

A varredura de secrets encontrou valor sensível somente em `.env.local`, que está ignorado pelo Git. Nenhuma chave, token ou segredo foi encontrado em arquivo rastreado.

A rotação da Supabase Secret Key exposta anteriormente não foi realizada, pois exige confirmação específica e atualização manual segura do ambiente. A proteção contra senhas vazadas do Supabase Auth também permanece desabilitada até confirmação específica.

## Advisors do Supabase

Os advisors foram repetidos sem alterações remotas:

1. segurança: `google_business_connections`, `webhooks` e `webhook_logs` continuam com RLS habilitado, sem policies públicas e com grants somente para `service_role`; esse desenho é intencional porque o servidor valida o admin antes de acessar essas tabelas;
2. segurança do Auth: permanece o aviso de proteção contra senhas vazadas desabilitada;
3. performance: apenas informes de índices ainda não utilizados, compatíveis com tabelas novas/vazias e baixo volume atual; nenhum índice foi removido sem evidência de produção.

## Validação local

Gates executados:

1. `npm ci`: aprovado;
2. `npm audit --audit-level=low`: aprovado, 0 vulnerabilidades;
3. `npm run typecheck`: aprovado;
4. `npm run lint`: aprovado;
5. `npm run test:unit`: aprovado, 22 testes;
6. `npm run test:e2e`: aprovado, 8 cenários e 2 omissões intencionais por viewport;
7. Blog validado em 390, 768, 1024 e 1440 px sem overflow horizontal;
8. roteiro da caravana validado no Chrome desktop e mobile;
9. `npm run build`: aprovado;
10. `git diff --check`: aprovado;
11. importador `caravans:dry-run`: aprovado sem escrita externa.

O build e o Playwright foram executados fora da restrição do sandbox porque precisam abrir uma porta local. O comportamento funcional também foi conferido no navegador local autenticado, sem executar mutations.

## Revisão

Não foram criados commit, push, pull request ou deploy. Mensagem sugerida:

`feat: refina blog adiciona galeria interativa e finaliza qa do mvp`

## Adendo — Dashboard administrativo

Em 19 de julho de 2026, o dashboard foi completado com base no artboard compartilhado do Paper. O painel passou a apresentar quatro cards com total e variação comparada aos 30 dias anteriores, gráfico de leads recebidos, resumo do período, leads recentes, caravanas e posts recentes, atividades administrativas e atalhos de criação.

Os percentuais são calculados somente quando existe base no período anterior. Quando ainda não há histórico, o painel informa a movimentação do período, sem inventar crescimento. Visitas, usuários, conversão e rankings de acesso continuam condicionados à futura configuração do GA4 com consentimento, pois esses eventos não são armazenados no banco nesta etapa.

Foram adicionados testes para a série diária e o cálculo de tendência. `npm run typecheck`, `npm run lint`, `npx vitest run --maxWorkers=1`, `npm run build` e `git diff --check` foram aprovados após o adendo.
