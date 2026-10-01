# Preparação do Cloudflare R2 e cache de imagens

Data da preparação local: 29 de agosto de 2026. Atualizado em 1 de outubro de 2026.

## Objetivo

Reduzir a saída de dados do Supabase causada por imagens sem alterar as URLs públicas do site ou mover o DNS da Leehov.

O inventário remoto de 1 de outubro confirmou 317 objetos, 760.314.958 bytes, distribuídos entre `site-media`, `caravan-images` e `blog-images`.

## Arquitetura preparada

1. O catálogo `media_assets` registra o provider físico do objeto.
2. As URLs públicas continuam no formato `/api/media/{id}`.
3. A rota busca o original no R2, gera WebP com Sharp e entrega com cache da Vercel.
4. Se um objeto promovido ao R2 não estiver disponível, a rota tenta o Supabase durante a janela de transição.
5. Novos uploads usam `MEDIA_STORAGE_PROVIDER`; sem configuração, o comportamento permanece Supabase.
6. Miniaturas administrativas deixam de receber URLs assinadas diretas do Supabase.

O bucket R2 deve permanecer privado. Não é necessário adicionar o domínio à Cloudflare, alterar nameservers ou criar `media.leehovturismo.com.br`.

## Auditoria de produção — 30 de setembro de 2026

O projeto de produção é `awfcyrpuzhovxixzpqzv` (Site Leehov). A franquia Free da organização Supabase foi restringida por **Cached Egress Exceeded**. No início do ciclo atual, os contadores já voltaram a zero, mas a restrição pode levar um breve período para ser removida. A organização também contém o projeto Leehov Academy; a tela de uso não atribui o consumo do ciclo encerrado a uma rota específica. O tráfego de imagens do Site Leehov é uma fonte plausível, não uma causa quantitativamente demonstrada.

O inventário catalogado no banco nesta data tem 267 arquivos e aproximadamente 588 MB:

| Bucket | Arquivos | Tamanho catalogado |
| --- | ---: | ---: |
| `site-media` | 150 | 381,9 MiB |
| `caravan-images` | 46 | 128,9 MiB |
| `blog-images` | 71 | 76,8 MiB |

A migration de R2 foi aplicada em 30 de setembro de 2026 ao projeto remoto, sob a versão `20260930122840`, e o arquivo local foi renomeado para refletir essa versão. A verificação posterior confirmou 267 registros ainda com `storage_provider = 'supabase'`. A alteração do esquema, sozinha, não reduz o tráfego: os objetos precisam ser copiados e promovidos para `r2`.

Após a virada, acompanhar o Cached Egress da **organização**, separado por projeto quando disponível, por alguns dias. Se continuar crescendo rapidamente, investigar requisições à API e ao Storage do projeto Leehov Academy antes de atribuir todo o consumo ao Site Leehov.

As rotas de Open Graph, imagens de e-mail, pop-ups, depoimentos e caminhos legados devem usar a mesma camada de entrega de mídia. Assim, depois da promoção para R2, nenhuma delas gera URL assinada direta do Supabase. Caminhos legados primeiro procuram R2 e só usam Supabase como fallback temporário durante a transição.

As ações de remoção de imagens legadas do blog e das caravanas também usam o provider de upload configurado. A exclusão de uma imagem antiga no R2 não apaga automaticamente a cópia de segurança no Supabase durante a janela de validação.

Em 30 de setembro, o endpoint de Storage do Supabase respondeu HTTP 402 com `exceed_cached_egress_quota`, apesar de o projeto constar como `ACTIVE_HEALTHY`. No ciclo iniciado em 30 de setembro, a restrição foi removida: em 1 de outubro, uma URL pública de imagem respondeu HTTP 200 e o dry-run leu os 317 originais sem falhas. A organização continua no plano Free e pode voltar a ser restringida se atingir a franquia.

## Migração segura

A migration `media_storage_provider_and_integrity` adiciona provider, SHA-256 e data da migração ao catálogo. O script `npm run media:r2:migrate` opera em dry-run por padrão. A gravação exige simultaneamente:

```bash
npm run media:r2:migrate -- --execute --confirm-project=awfcyrpuzhovxixzpqzv
```

O script usa quatro workers, copia, relê, compara tamanho e SHA-256 e somente então promove o registro para `r2`. Objetos sem catálogo também são copiados, mas permanecem identificados no relatório. A execução pode ser repetida após falhas; a virada da produção requer zero falhas e a confirmação de todos os registros catalogados.

## Variáveis server-side

```env
MEDIA_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=leehov-media-production
```

Nenhuma variável R2 pode usar `NEXT_PUBLIC_`.

## Gates remotos e ordem da virada

Estado das ações remotas:

1. Assinatura do R2: ativa desde 30 de setembro, com cobrança somente se superar o limite gratuito.
2. Bucket privado `leehov-media-production` e credencial de leitura/gravação restrita a ele: criados em 1 de outubro.
3. Migration no Supabase remoto: concluída em 30 de setembro de 2026.
4. Dry-run: 317 objetos, 760.314.958 bytes, zero falhas em 1 de outubro.
5. `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY`: adicionadas somente ao ambiente Production da Vercel, sem ativar o provider.
6. Cópia com `--execute`: verificar resultado completo e contagem do catálogo antes da virada.
7. Publicação e alteração de `MEDIA_STORAGE_PROVIDER` para `r2`: somente após a verificação dos objetos; validar URLs públicas e uploads novos depois.
8. Remoção dos originais do Supabase: somente após 30 dias de validação e autorização específica.
