# Fluxos do Site Público

Este documento define os principais fluxos do visitante no site público da Leehov Turismo.

O foco do site é divulgar caravanas e viagens em grupo acompanhadas, captar interessados e transmitir confiança.

## Princípios

1. Usar o termo **Caravanas** como vocabulário principal.
2. Organizar informações de forma progressiva.
3. Evitar páginas longas com conteúdo empilhado sem hierarquia.
4. Priorizar fotos reais, destinos, grupos e sinais de acompanhamento.
5. Usar WhatsApp como canal principal de atendimento.
6. Salvar leads e inscrições no Supabase antes de qualquer envio externo.
7. Não implementar reserva online nem pagamento online no MVP.

## Home

Objetivo:

1. Apresentar a Leehov com impacto visual.
2. Destacar próximas caravanas.
3. Explicar como funciona viajar em grupo.
4. Captar interesse por WhatsApp, newsletter e páginas de caravana.

Estrutura:

1. Header.
2. Hero com carrossel de caravanas/destinos.
3. Vídeo institucional.
4. Próximas caravanas em grupo.
5. Como funciona viajar com a Leehov.
6. Sobre a Leehov.
7. Diferenciais.
8. Depoimentos e Google Reviews.
9. Inspirações de viagem.
10. Newsletter.
11. Footer.

## Hero com carrossel

Origem dos dados:

1. Caravanas publicadas.
2. `featured_hero = true`.
3. Ordenação por `hero_order`.
4. Preferência por 3 a 5 itens.

Conteúdo por slide:

1. Título do hero.
2. Descrição curta.
3. Imagem hero.
4. Data ou período de saída.
5. Duração.
6. CTA para detalhes.
7. CTA para WhatsApp.
8. Cards de outros destinos/caravanas em destaque.

Comportamento:

1. Troca de slide muda imagem, título, descrição e CTAs.
2. Overlay azul escuro garante leitura.
3. Navegação por setas, indicadores e gesto no mobile.
4. Fallback: se não houver destaque no hero, exibir chamada institucional e link para `/caravanas`.

## Vídeo institucional

Objetivo:

1. Mostrar a experiência de viajar em grupo.
2. Reforçar presença humana, suporte e confiança.
3. Direcionar para caravanas ou WhatsApp.

Conteúdo:

1. Título.
2. Subtítulo.
3. URL do vídeo.
4. Thumbnail.
5. Botão de play.
6. Números rápidos opcionais.
7. CTA.

Origem:

1. `site_settings.home_video`.

## Seção avião/céu

Objetivo:

1. Reforçar movimento de viagem e identidade visual.
2. Criar memória visual própria da Leehov.

Regras:

1. Usar avião, céu, rota ou linha pontilhada conforme referência do Paper.
2. A animação deve ser leve.
3. Respeitar `prefers-reduced-motion`.
4. Não prejudicar leitura nem performance.

## Próximas caravanas

Origem:

1. Caravanas publicadas.
2. Preferência por `featured_home = true`.

Card:

1. Imagem.
2. Nome da caravana.
3. Destino.
4. Duração.
5. Saídas.
6. Status.
7. Selo de grupo acompanhado.
8. Valor, se configurado para exibição.
9. Botão `Ver detalhes`.
10. Link para WhatsApp, quando adequado.

Estados:

1. Sem caravanas: exibir CTA para falar com a Leehov.
2. Imagem ausente: usar fallback visual do destino ou imagem institucional.
3. Caravana esgotada: manter card consultivo, sem promessa de reserva.

## Como funciona viajar com a Leehov

Fluxo editorial:

1. Escolha sua caravana.
2. Fale com nossa equipe.
3. Receba todas as orientações.
4. Viaje com acompanhamento.

Objetivo:

1. Reduzir insegurança.
2. Explicar que não há compra automática.
3. Reforçar atendimento humano.

## Página de caravanas

Rota:

```txt
/caravanas
```

Fluxo:

1. Visitante acessa a listagem.
2. Pode buscar por nome/destino.
3. Pode filtrar por categoria e status.
4. Visualiza grid de caravanas publicadas.
5. Abre página individual ou fala pelo WhatsApp.

Filtros do MVP:

1. Busca textual.
2. Categoria.
3. Status.

## Página individual da caravana

Rota:

```txt
/caravanas/[slug]
```

Objetivo:

1. Vender a experiência sem virar ficha técnica confusa.
2. Apresentar informações em camadas.
3. Captar interesse.

Estrutura recomendada:

1. Header.
2. Hero da caravana.
3. Resumo rápido.
4. Vídeo ou galeria.
5. Por que viajar com a Leehov.
6. Roteiro dia a dia.
7. Incluso e não incluso.
8. Líder/acompanhamento.
9. Depoimentos.
10. FAQ.
11. Formulário de interesse.
12. Outras caravanas.
13. Newsletter.
14. Footer.

Resumo rápido:

1. Destino.
2. Duração.
3. Saídas.
4. Tipo de viagem.
5. Acompanhamento.
6. Guia.
7. Hospedagem.
8. Status.

Roteiro:

1. Usar accordion ou timeline.
2. Cada dia deve ter número, título, local, descrição, imagem opcional, refeições, hospedagem e observações.
3. No mobile, accordion é o padrão preferido para evitar excesso de informação.

CTA mobile:

1. Exibir CTA fixo discreto para WhatsApp ou interesse.
2. Não cobrir conteúdo crítico.

## Formulário de interesse

Origem:

1. Página individual de caravana.
2. Card de caravana, quando o fluxo abrir modal.
3. Pop-up, se aplicável.

Campos:

1. Nome.
2. WhatsApp.
3. E-mail.
4. Cidade.
5. Estado.
6. Mensagem.

Fluxo:

1. Visitante preenche.
2. Sistema valida com Zod.
3. Turnstile é validado no servidor.
4. Lead é salvo no Supabase.
5. E-mail interno é enviado pelo Resend, se habilitado.
6. Confirmação ao visitante é enviada, se habilitada.
7. Webhook `caravan_interest.created` pode ser disparado server-side.
8. Visitante vê confirmação e CTA para WhatsApp.

Falhas:

1. Falha no e-mail não remove o lead.
2. Falha no webhook não bloqueia o envio.
3. Falha no Turnstile bloqueia a criação do lead.

## Contato

Rota:

```txt
/contato
```

Conteúdo:

1. Formulário.
2. WhatsApp.
3. E-mail.
4. Endereço.
5. Redes sociais.
6. Horário de atendimento.
7. Mapa, se aplicável.

Fluxo:

1. Visitante envia mensagem.
2. Sistema salva lead com `source = contact`.
3. Sistema envia e-mails configurados.
4. Webhook `contact.created` pode ser disparado.

## Newsletter com double opt-in

Origem:

1. Home.
2. Blog.
3. Post.
4. Footer.
5. Pop-up.

Fluxo:

1. Visitante informa nome e e-mail.
2. Sistema valida dados e Turnstile, se aplicado.
3. Sistema cria inscrição com status `pending`.
4. Sistema envia `NewsletterDoubleOptInEmail`.
5. Visitante clica no link de confirmação.
6. Sistema atualiza para `active`.
7. Sistema envia `NewsletterWelcomeEmail`.
8. Webhooks `newsletter.subscribed` e `newsletter.confirmed` podem ser disparados.

Regras:

1. E-mails duplicados devem retornar mensagem amigável.
2. Link de confirmação deve expirar.
3. Inscrição ativa aparece no admin.

## Blog

Rota:

```txt
/blog
```

Objetivo:

1. Criar autoridade editorial.
2. Apoiar SEO.
3. Direcionar para caravanas.

Estrutura:

1. Hero editorial.
2. Busca.
3. Categorias.
4. Post em destaque.
5. Grid de posts.
6. Guias essenciais.
7. Explore por destino.
8. Newsletter.

## Post aberto

Rota:

```txt
/blog/[slug]
```

Estrutura:

1. Categoria.
2. Título.
3. Resumo.
4. Autor.
5. Data.
6. Tempo de leitura.
7. Imagem principal.
8. Conteúdo.
9. Blocos de destaque.
10. Caravanas relacionadas.
11. Posts relacionados.
12. CTA final.

Regra:

1. Apenas posts publicados aparecem no site e em SEO.

## Depoimentos e Google Reviews

Fontes:

1. Depoimentos manuais.
2. Google Business Profile Reviews cacheados.

Modos:

1. Manual.
2. Google.
3. Misto.

Widget:

1. Nome do avaliador.
2. Nota.
3. Texto.
4. Origem.
5. Resposta da Leehov, quando habilitada.
6. Link para ver mais avaliações no Google.

Regras:

1. Google Reviews são lidos do cache, nunca da API em cada acesso.
2. Apenas reviews visíveis aparecem no site.
3. Reviews com baixa nota podem gerar alerta interno, mas não devem ser expostos automaticamente sem regra clara.

## WhatsApp

Origem do número:

1. `site_settings.whatsapp_settings`.
2. Fallback em variável pública apenas enquanto o admin ainda não existir.

Mensagens:

1. Mensagem padrão para contato geral.
2. Mensagem personalizada por caravana.
3. UTM ou origem podem ser anexados ao lead, não ao texto do usuário se isso prejudicar clareza.

## FAQ

Onde aparece:

1. Página individual da caravana.
2. Página Viagens em Grupo, se implementada.
3. Contato, se necessário.

Formato:

1. Accordion.
2. Perguntas curtas.
3. Respostas objetivas.

## Política de Privacidade

Rota:

```txt
/politica-de-privacidade
```

Deve cobrir:

1. Formulários.
2. Leads.
3. Newsletter.
4. Cookies.
5. Analytics.
6. Meta Pixel.
7. Google Business Profile Reviews.
8. Webhooks e serviços externos, em linguagem acessível.

## Pop-up público

Origem:

1. `popups` ativo.

Regras:

1. No MVP, apenas um pop-up principal ativo.
2. Frequência deve evitar exibição agressiva.
3. Deve ter fechamento claro.
4. Deve respeitar mobile.
5. Pode direcionar para campanha, newsletter, WhatsApp ou caravana.
