# Preparação do Cloudflare R2 e cache de imagens

Data da preparação local: 29 de agosto de 2026.

## Objetivo

Reduzir a saída de dados do Supabase causada por imagens sem alterar as URLs públicas do site ou mover o DNS da Leehov.

O inventário remoto confirmou 302 objetos, aproximadamente 681 MB, distribuídos entre `site-media`, `caravan-images` e `blog-images`.

## Arquitetura preparada

1. O catálogo `media_assets` registra o provider físico do objeto.
2. As URLs públicas continuam no formato `/api/media/{id}`.
3. A rota busca o original no R2, gera WebP com Sharp e entrega com cache da Vercel.
4. Se um objeto promovido ao R2 não estiver disponível, a rota tenta o Supabase durante a janela de transição.
5. Novos uploads usam `MEDIA_STORAGE_PROVIDER`; sem configuração, o comportamento permanece Supabase.
6. Miniaturas administrativas deixam de receber URLs assinadas diretas do Supabase.

O bucket R2 deve permanecer privado. Não é necessário adicionar o domínio à Cloudflare, alterar nameservers ou criar `media.leehovturismo.com.br`.

## Migração segura

A migration `media_storage_provider_and_integrity` adiciona provider, SHA-256 e data da migração ao catálogo. O script `npm run media:r2:migrate` opera em dry-run por padrão. A gravação exige simultaneamente:

```bash
npm run media:r2:migrate -- --execute --confirm-project=awfcyrpuzhovxixzpqzv
```

O script copia, relê, compara tamanho e SHA-256 e somente então promove o registro para `r2`. Objetos sem catálogo também são copiados, mas permanecem identificados no relatório.

## Variáveis server-side

```env
MEDIA_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=leehov-media-production
```

Nenhuma variável R2 pode usar `NEXT_PUBLIC_`.

## Gates remotos pendentes

Estas ações não fazem parte da preparação local e exigem autorização operacional própria:

1. ativar a assinatura do R2;
2. criar bucket e credencial limitada;
3. aplicar a migration no Supabase remoto;
4. executar a cópia com `--execute`;
5. configurar as variáveis na Vercel;
6. alterar `MEDIA_STORAGE_PROVIDER` para `r2`;
7. remover os objetos do Supabase somente após 30 dias de validação.
