# Mapa do Painel Administrativo

## Objetivo

Definir a estrutura do painel administrativo da Leehov Turismo.

O admin deve ser simples para a cliente usar, mas estruturado o suficiente para gerenciar caravanas, blog, leads, newsletter, pop-ups, depoimentos e configurações.

## Termo principal

Usar **Caravanas** na interface administrativa.

Evitar “Pacotes” como termo principal, pois o foco real do negócio é viagem em grupo acompanhada.

## Rotas principais

1. `/admin/login`
2. `/admin`
3. `/admin/caravanas`
4. `/admin/caravanas/novo`
5. `/admin/caravanas/[id]`
6. `/admin/blog`
7. `/admin/blog/novo`
8. `/admin/blog/[id]`
9. `/admin/leads`
10. `/admin/newsletter`
11. `/admin/depoimentos`
12. `/admin/popups`
13. `/admin/midia`
14. `/admin/configuracoes`
15. `/admin/usuarios`
16. `/admin/webhooks`

## Menu lateral

1. Dashboard.
2. Caravanas.
3. Blog.
4. Leads.
5. Newsletter.
6. Depoimentos.
7. Pop-ups.
8. Mídia.
9. Configurações.
10. Usuários.
11. Webhooks.

## Dashboard

Cards principais:

1. Caravanas ativas.
2. Leads recebidos.
3. Posts publicados.
4. Inscritos na newsletter.
5. Depoimentos ativos.

Blocos:

1. Leads recentes.
2. Caravanas mais acessadas.
3. Atividades recentes.
4. Status do site.

## Caravanas

Tela de listagem:

1. Busca por nome/destino.
2. Filtros por status.
3. Filtros por categoria.
4. Botão “Nova caravana”.
5. Tabela/listagem com imagem.
6. Nome.
7. Destino.
8. Saídas.
9. Duração.
10. Valor.
11. Status.
12. Destaque na home.
13. Destaque no hero.
14. Ações.

## Criar/editar caravana

Organizar em abas:

1. Informações gerais.
2. Imagens.
3. Saídas.
4. Roteiro dia a dia.
5. Inclusos e não inclusos.
6. Grupo e acompanhamento.
7. SEO.
8. Publicação.

### Informações gerais

1. Nome.
2. Slug.
3. Destino.
4. Categoria.
5. Tipo.
6. Descrição curta.
7. Descrição completa.
8. Duração.
9. Valor.
10. Status.

### Imagens

1. Imagem do card.
2. Imagem hero.
3. Galeria.
4. Imagem por dia do roteiro, opcional.

### Saídas

1. Data/período.
2. Observação.
3. Vagas.
4. Status da saída.

### Roteiro dia a dia

Blocos repetíveis:

1. Dia.
2. Título.
3. Local.
4. Descrição.
5. Imagem opcional.
6. Refeições.
7. Hospedagem.
8. Observações.

### Grupo e acompanhamento

1. Viagem em grupo.
2. Grupo acompanhado.
3. Representante Leehov incluso.
4. Guia em português.
5. Líder/acompanhante.
6. Kit viagem.
7. Seguro viagem incluso.
8. Número mínimo de pessoas.
9. Número máximo de pessoas.

### Publicação

1. Publicado.
2. Destacar na home.
3. Destacar no hero.
4. Ordem no hero.
5. Título no hero.
6. Descrição do hero.
7. CTA do hero.

## Blog

Listagem:

1. Busca.
2. Filtro por categoria.
3. Status.
4. Destaque.
5. Ações.

Editor de post:

1. Título.
2. Slug.
3. Categoria.
4. Destino relacionado.
5. Caravana relacionada.
6. Resumo.
7. Conteúdo.
8. Imagem principal.
9. Galeria opcional.
10. Autor.
11. Data de publicação.
12. Status.
13. Destaque na home.
14. SEO title.
15. SEO description.

## Leads

Tabela:

1. Nome.
2. WhatsApp.
3. E-mail.
4. Origem.
5. Caravana relacionada.
6. Status.
7. Data.
8. Ação para WhatsApp.

Status:

1. Novo.
2. Em atendimento.
3. Convertido.
4. Arquivado.

## Newsletter

Tabela:

1. Nome.
2. E-mail.
3. Origem.
4. Status.
5. Data de cadastro.

## Depoimentos

Funcionalidades:

1. Cadastrar depoimento manual.
2. Ativar/desativar.
3. Destacar na home.
4. Definir ordem.
5. Configurar avaliações do Google, quando disponível.

## Pop-ups

Campos:

1. Ativo.
2. Título.
3. Descrição.
4. Imagem.
5. Texto do botão.
6. Link do botão.
7. Tipo.
8. Local de exibição.
9. Frequência.

## Webhooks

Aba para configurar disparos de eventos do sistema para automações externas.

Funcionalidades:

1. Criar configuração.
2. Editar configuração.
3. Ativar/desativar.
4. Selecionar evento.
5. Configurar destino.
6. Testar envio.
7. Ver histórico.
8. Reenviar falhas.

## Mídia

Biblioteca de imagens:

1. Upload.
2. Listagem.
3. Tipo de arquivo.
4. Uso relacionado.
5. Exclusão controlada.

## Configurações

1. Dados de contato.
2. WhatsApp principal.
3. E-mail.
4. Redes sociais.
5. Endereço.
6. SEO global.
7. Scripts de Analytics.
8. Scripts de Pixel.
9. Configurações da home.
10. Configurações de vídeo institucional.
