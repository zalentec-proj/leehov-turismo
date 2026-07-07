# Integração Google Business Profile — Reviews

Este documento define a integração do projeto Leehov Turismo com a Google Business Profile API para sincronizar avaliações reais do Perfil da Empresa no Google e exibi-las no site público por meio de um widget próprio.

## 1. Objetivo

A integração tem como objetivo:

1. buscar avaliações reais do Perfil da Empresa da Leehov;
2. salvar avaliações em cache no Supabase;
3. exibir avaliações no site público em um widget próprio;
4. permitir controle de exibição pelo painel administrativo;
5. permitir resposta a avaliações pelo painel administrativo, quando autorizado;
6. permitir remoção da resposta da empresa, quando autorizado.

## 2. O que a API permite

A Google Business Profile API permite trabalhar com dados de avaliações da própria ficha da empresa.

Recursos considerados para o projeto:

1. listar avaliações de um local;
2. obter uma avaliação específica;
3. buscar avaliações de vários locais, se necessário no futuro;
4. responder a uma avaliação;
5. excluir a resposta da empresa em uma avaliação.

Importante: a API permite excluir uma resposta da empresa, não excluir a avaliação feita pelo cliente. O admin poderá ocultar uma avaliação no site, mas não apagar a avaliação original do Google.

## 3. Decisão de produto

O site terá um widget próprio de depoimentos e avaliações, com três modos possíveis:

1. Manual: exibe apenas depoimentos cadastrados no admin.
2. Google: exibe apenas avaliações sincronizadas do Google.
3. Misto: exibe depoimentos manuais e avaliações do Google.

Para o MVP, a integração Google Business Profile já será documentada como parte do plano, mas a implementação pode ser faseada conforme acesso ao Perfil da Empresa e credenciais OAuth.

## 4. Admin — funcionalidades

No painel administrativo, criar a área:

`Configurações > Integrações > Google Business Profile`

Campos/configurações:

1. Ativar integração Google Business Profile.
2. Account ID.
3. Location ID.
4. Frequência de atualização do cache.
5. Quantidade de avaliações exibidas.
6. Nota mínima para exibição.
7. Modo de exibição: manual, Google ou misto.
8. Botão para sincronizar avaliações agora.
9. Status da última sincronização.
10. Mensagem de erro da última sincronização, quando houver.

Na área de depoimentos/reviews:

1. listar avaliações sincronizadas;
2. ver nome do avaliador;
3. ver nota;
4. ver comentário;
5. ver data da avaliação;
6. ver resposta atual da empresa, quando houver;
7. marcar avaliação como visível ou oculta no site;
8. marcar avaliação como destaque;
9. responder avaliação;
10. editar resposta existente;
11. excluir resposta da empresa.

## 5. O que o admin NÃO deve fazer

O admin não deve prometer exclusão da avaliação do cliente no Google.

Ações permitidas:

1. ocultar avaliação no site da Leehov;
2. responder avaliação no Google;
3. atualizar uma resposta existente;
4. excluir a resposta da empresa no Google.

Ação não prevista:

1. excluir a avaliação original feita pelo cliente no Google.

## 6. Autenticação

A integração exige OAuth 2.0.

Variáveis de ambiente previstas:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_REFRESH_TOKEN=
```

Configurações armazenadas no Supabase/admin:

```txt
google_business_account_id
google_business_location_id
google_reviews_enabled
google_reviews_cache_hours
google_reviews_limit
google_reviews_min_rating
google_reviews_display_mode
```

## 7. Banco de dados — tabelas sugeridas

### `google_business_settings`

Armazena configurações da integração.

Campos sugeridos:

1. `id` uuid primary key;
2. `account_id` text;
3. `location_id` text;
4. `enabled` boolean default false;
5. `display_mode` text default 'mixed';
6. `reviews_limit` integer default 6;
7. `min_rating` integer default 4;
8. `cache_hours` integer default 24;
9. `last_sync_at` timestamptz;
10. `last_sync_status` text;
11. `last_sync_error` text;
12. `created_at` timestamptz;
13. `updated_at` timestamptz.

### `google_reviews_cache`

Armazena avaliações sincronizadas.

Campos sugeridos:

1. `id` uuid primary key;
2. `google_review_id` text unique not null;
3. `review_name` text;
4. `reviewer_display_name` text;
5. `reviewer_profile_photo_url` text;
6. `reviewer_profile_url` text;
7. `star_rating` integer;
8. `comment` text;
9. `create_time` timestamptz;
10. `update_time` timestamptz;
11. `reply_comment` text;
12. `reply_update_time` timestamptz;
13. `visible` boolean default true;
14. `featured` boolean default false;
15. `raw_data` jsonb;
16. `synced_at` timestamptz;
17. `created_at` timestamptz;
18. `updated_at` timestamptz.

## 8. Fluxo de sincronização

1. Admin configura Account ID e Location ID.
2. Sistema valida credenciais OAuth.
3. Admin clica em sincronizar ou o sistema roda uma rotina programada.
4. Sistema chama a API do Google Business Profile.
5. Sistema salva/atualiza avaliações em `google_reviews_cache`.
6. Site público lê avaliações do cache, nunca diretamente da API do Google em cada acesso.
7. Admin pode ocultar, destacar ou responder avaliações.

## 9. Fluxo para responder avaliação

1. Admin abre uma avaliação no painel.
2. Escreve ou edita uma resposta.
3. Sistema envia a resposta para a Google Business Profile API.
4. Sistema atualiza o cache local com a resposta.
5. Site público passa a exibir a resposta da empresa, se essa opção estiver habilitada.

## 10. Fluxo para excluir resposta

1. Admin abre uma avaliação que possui resposta da empresa.
2. Clica em remover resposta.
3. Sistema solicita confirmação visual.
4. Sistema chama o endpoint de exclusão da resposta.
5. Sistema atualiza o cache local removendo a resposta.

Importante: isso remove apenas a resposta da empresa, não a avaliação do cliente.

## 11. Exibição no site público

O widget de depoimentos deve permitir:

1. exibir avaliações em cards;
2. mostrar nome do avaliador;
3. mostrar nota em estrelas;
4. mostrar comentário;
5. mostrar data relativa ou data formatada;
6. mostrar selo de origem Google;
7. exibir resposta da Leehov, quando disponível;
8. linkar para ver mais avaliações no Google, se configurado.

## 12. Segurança

1. Tokens e segredos OAuth ficam apenas no servidor.
2. Nenhuma credencial sensível deve usar prefixo `NEXT_PUBLIC`.
3. O site público deve ler apenas avaliações já cacheadas e marcadas como visíveis.
4. Apenas usuários admin/editor podem responder, ocultar ou destacar avaliações.
5. Ações de resposta e remoção de resposta devem ser registradas em log administrativo, se houver módulo de auditoria.

## 13. Fora do escopo inicial

Não implementar no MVP sem novo alinhamento:

1. resposta automática com IA;
2. análise de sentimento;
3. múltiplos perfis de empresa;
4. moderação avançada;
5. fluxo de solicitação automática de novas avaliações;
6. integração com WhatsApp para pedir review após viagem.

## 14. Resumo da decisão

A Leehov terá um widget próprio de depoimentos e avaliações.

A integração oficial escolhida para reviews reais será Google Business Profile API.

O admin poderá:

1. sincronizar avaliações;
2. ocultar avaliações no site;
3. destacar avaliações;
4. responder avaliações;
5. editar respostas;
6. excluir respostas da empresa.

O admin não poderá excluir a avaliação original do cliente no Google.
