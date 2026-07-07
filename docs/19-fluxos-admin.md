# Fluxos do Painel Administrativo

Este documento define os fluxos do painel administrativo da Leehov Turismo.

O admin deve usar o termo **Caravanas**, não **Pacotes**, porque o produto central da Leehov é viagem em grupo acompanhada.

## Princípios

1. Admin simples para cliente não técnico.
2. Sidebar fixa em desktop e navegação em sheet no mobile.
3. Conteúdo dividido por módulos.
4. Formulários longos em abas.
5. Ações sensíveis com confirmação.
6. Dados internos protegidos por autenticação e RLS.
7. Falhas de e-mail ou webhook não devem bloquear a ação principal.

## Login

Rota:

```txt
/admin/login
```

Fluxo:

1. Usuário informa e-mail e senha.
2. Supabase Auth valida credenciais.
3. Sistema busca `profiles`.
4. Se `active = false`, bloqueia acesso.
5. Se role for `admin` ou `editor`, redireciona para `/admin`.
6. Se não houver perfil válido, exibe erro de permissão.

Estados:

1. Loading.
2. Erro de credencial.
3. Erro de permissão.
4. Sessão expirada.

## Dashboard

Rota:

```txt
/admin
```

Blocos:

1. Caravanas ativas.
2. Leads recebidos.
3. Posts publicados.
4. Inscritos newsletter.
5. Depoimentos ativos.
6. Leads recentes.
7. Caravanas mais acessadas.
8. Atividades recentes.
9. Status do site.
10. Status de integrações.

Regras:

1. Não expor secrets.
2. Mostrar apenas dados que o papel do usuário pode acessar.
3. Fallback para métricas zeradas.

## Caravanas

Rota:

```txt
/admin/caravanas
```

Fluxo de listagem:

1. Usuário acessa a tela.
2. Sistema lista caravanas com busca, filtros e paginação.
3. Usuário filtra por status, categoria e destaque.
4. Usuário abre edição, cria nova caravana ou executa ações rápidas.

Colunas:

1. Imagem.
2. Nome.
3. Destino.
4. Saídas.
5. Duração.
6. Valor.
7. Status.
8. Destaque na Home.
9. Destaque no Hero.
10. Ações.

## Criar/editar caravana

Rotas:

```txt
/admin/caravanas/novo
/admin/caravanas/[id]
```

Abas:

1. Informações gerais.
2. Imagens.
3. Saídas.
4. Roteiro dia a dia.
5. Inclusos e não inclusos.
6. Grupo e acompanhamento.
7. SEO.
8. Publicação.

### Informações gerais

Campos:

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

Regras:

1. Slug deve ser único.
2. Nome e destino são obrigatórios.
3. Status `draft` não aparece no site.

### Saídas

Fluxo:

1. Adicionar uma ou mais saídas.
2. Informar data exata ou label textual.
3. Definir status da saída.
4. Informar vagas se a Leehov optar por exibir.

Campos:

1. Label.
2. Data inicial.
3. Data final.
4. Vagas disponíveis.
5. Status.
6. Observação.

### Roteiro dia a dia

Fluxo:

1. Adicionar dias repetíveis.
2. Ordenar dias.
3. Informar título, local e descrição.
4. Anexar imagem opcional.

No site:

1. Renderizar como accordion ou timeline.

### Imagens

Fluxo:

1. Escolher imagem do card.
2. Escolher imagem hero.
3. Gerenciar galeria.
4. Preencher alt text.

Regras:

1. Upload apenas por usuário autenticado.
2. Imagens públicas devem ficar em buckets com leitura pública controlada.
3. Biblioteca de mídia deve registrar uso e origem.

### Inclusos e não inclusos

Fluxo:

1. Adicionar itens inclusos.
2. Adicionar itens não inclusos.
3. Ordenar lista.
4. Salvar como JSON estruturado.

### Grupo e acompanhamento

Campos:

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

Campos:

1. Publicado.
2. Destacar na Home.
3. Destacar no Hero.
4. Ordem no Hero.
5. Título do Hero.
6. Descrição do Hero.
7. CTA do Hero.

Regras:

1. Publicação deve exigir campos mínimos.
2. Hero deve preferir 3 a 5 caravanas destacadas.
3. Ao publicar, disparar evento `caravan.published`.
4. Ao criar, disparar evento `caravan.created`.
5. Ao atualizar, disparar evento `caravan.updated`.

## Blog

Rotas:

```txt
/admin/blog
/admin/blog/novo
/admin/blog/[id]
```

Listagem:

1. Busca.
2. Categoria.
3. Status.
4. Destaque.
5. Ações.

Editor:

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
13. Destaque na Home.
14. SEO title.
15. SEO description.

Regras:

1. Apenas posts publicados aparecem no site.
2. Ao publicar post, disparar evento `blog_post.published`.

## Leads

Rota:

```txt
/admin/leads
```

Funcionalidades:

1. Listar leads.
2. Buscar por nome, e-mail ou WhatsApp.
3. Filtrar por status, origem e caravana.
4. Alterar status.
5. Abrir WhatsApp com mensagem.
6. Ver detalhe completo.

Status:

1. Novo.
2. Em atendimento.
3. Convertido.
4. Arquivado.

Regras:

1. Leads não são públicos.
2. Todo lead precisa de origem.
3. Se vier de caravana, salvar relação.

## Newsletter

Rota:

```txt
/admin/newsletter
```

Funcionalidades:

1. Listar inscritos.
2. Filtrar por status.
3. Ver origem.
4. Ver data de cadastro.
5. Ver data de confirmação.

Fluxo:

1. Cadastro inicial cria status `pending`.
2. Confirmação por e-mail ativa inscrição.
3. Admin vê status final.

Fora do MVP:

1. Campanhas em massa.
2. Segmentação avançada.
3. Editor visual de e-mails.

## Depoimentos manuais

Rota:

```txt
/admin/depoimentos
```

Funcionalidades:

1. Criar depoimento manual.
2. Editar.
3. Ativar/desativar.
4. Destacar.
5. Ordenar.
6. Definir origem.

Campos:

1. Nome.
2. Cidade.
3. Texto.
4. Nota.
5. Imagem.
6. Ativo.
7. Destaque.

## Google Business Profile

Área:

```txt
Configurações > Integrações > Google Business Profile
```

Configurações:

1. Ativar integração.
2. Account ID.
3. Location ID.
4. Frequência de atualização do cache.
5. Quantidade de avaliações exibidas.
6. Nota mínima para exibição.
7. Modo de exibição: manual, Google ou misto.
8. Sincronizar agora.
9. Status da última sincronização.
10. Erro da última sincronização.

Fluxo de sincronização:

1. Admin configura integração.
2. Sistema valida OAuth 2.0 no servidor.
3. Admin executa sincronização ou rotina futura dispara.
4. Sistema busca reviews no Google Business Profile.
5. Sistema grava cache em `google_reviews_cache`.
6. Sistema pode disparar alertas por e-mail.
7. Sistema pode disparar webhooks `google_review.created` e `google_review.low_rating`.

Fluxo de responder review:

1. Admin abre uma avaliação.
2. Escreve resposta.
3. Sistema envia resposta para Google via servidor.
4. Sistema atualiza cache local.
5. Log administrativo ou técnico registra a ação.

Fluxo de remover resposta:

1. Admin abre avaliação com resposta.
2. Confirma remoção.
3. Sistema chama endpoint de exclusão da resposta.
4. Sistema atualiza cache.

Regra:

1. O admin pode remover a resposta da empresa.
2. O admin não pode excluir a avaliação original do cliente no Google.

## Pop-ups

Rota:

```txt
/admin/popups
```

Funcionalidades:

1. Criar pop-up.
2. Editar.
3. Ativar/desativar.
4. Definir local de exibição.
5. Definir frequência.
6. Definir CTA.

Regra:

1. No MVP, apenas um pop-up principal ativo.

## Configurações

Rota:

```txt
/admin/configuracoes
```

Áreas:

1. Dados de contato.
2. WhatsApp.
3. Redes sociais.
4. SEO global.
5. Home.
6. Vídeo institucional.
7. E-mails.
8. Analytics/GTM/Pixel.
9. Integrações.

## Configurações de e-mail

Área:

```txt
Configurações > E-mails
```

Campos:

1. Ativar envios.
2. Enviar confirmação para visitantes.
3. Destinatários de leads.
4. Destinatários de contato.
5. Destinatários de notificações.
6. Nome do remetente.
7. Reply-to.
8. Rodapé dos e-mails.
9. WhatsApp exibido.

Regras:

1. Templates ficam versionados no código.
2. Admin não edita HTML livre.
3. `RESEND_API_KEY` fica em variável segura.
4. Logs ficam em `email_logs`.

## Analytics, GTM e Meta Pixel

Área:

```txt
Configurações > Scripts e métricas
```

Campos:

1. GA4 Measurement ID.
2. Google Tag Manager ID.
3. Meta Pixel ID.
4. Ativar/desativar cada integração.

Regra:

1. IDs e scripts configuráveis ficam no Supabase/admin.
2. Secrets e tokens não ficam no admin.
3. Renderização deve ser controlada pelo servidor e sanitizada.

## Webhooks

Rota:

```txt
/admin/webhooks
```

Funcionalidades:

1. Criar configuração.
2. Editar configuração.
3. Ativar/desativar.
4. Selecionar evento.
5. Configurar URL de destino.
6. Configurar chave de validação.
7. Testar envio.
8. Ver histórico.
9. Reenviar falhas.
10. Excluir configuração.

Eventos:

1. `lead.created`
2. `caravan_interest.created`
3. `contact.created`
4. `newsletter.subscribed`
5. `newsletter.confirmed`
6. `google_review.created`
7. `google_review.low_rating`
8. `caravan.created`
9. `caravan.updated`
10. `caravan.published`
11. `blog_post.published`

Regras:

1. Envio deve acontecer no servidor.
2. Falha não bloqueia ação principal.
3. Logs registram payload, status, resposta e erro.
4. Reenvio manual usa o payload salvo no log.
5. Chave de validação não aparece no front-end.

## Mídia

Rota:

```txt
/admin/midia
```

Funcionalidades:

1. Upload.
2. Listagem.
3. Busca.
4. Edição de alt text.
5. Legenda.
6. Folder.
7. Exclusão controlada.

Regras:

1. Upload apenas autenticado.
2. Excluir mídia exige confirmação.
3. Evitar excluir arquivo usado por conteúdo publicado sem alerta.

## Usuários

Rota:

```txt
/admin/usuarios
```

Funcionalidades:

1. Listar usuários.
2. Criar convite ou perfil, conforme fluxo definido no Supabase Auth.
3. Alterar papel.
4. Ativar/desativar.

Papéis:

1. `admin`
2. `editor`

Regra:

1. Apenas admin gerencia usuários.
2. Editor gerencia conteúdo, mas não usuários nem configurações sensíveis.
