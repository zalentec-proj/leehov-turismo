# Pixel OpenAI Ads — 12/11/2026

## Escopo

Medir um clique real em um link público de WhatsApp no Pixel `AAy1gfaoDcQhWDighRrZqq` como evento customizado `whatsapp_click`. Não enviar lead, compra, conteúdo de formulário ou chave privada. Não alterar Meta Pixel, RD → Meta, Google Analytics, Google Tag Manager ou configurações de anúncios.

## Decisões

- O SDK não foi publicado: o Pixel tem correspondência automática avançada ativa e o editor da conta Leehov não permite desligá-la. O [controle no Ads Manager é restrito a contas do Japão](https://help.openai.com/en/articles/20001409-conversion-measurement#automatic-advanced-matching). A opção na conta permanece intocada.
- O responsável autorizou substituir o SDK pelo [Image Tag oficial](https://developers.openai.com/ads/image-tag). Criar a imagem somente no clique consentido; uma tag estática no HTML dispararia durante a visita e mediria a ação errada. A requisição contém apenas o Pixel ID público, tipo, nome, ID único do evento e `oppref` quando disponível. Sem script de terceiros, leitura de formulários, chave ou debug.
- Manter o aceite legado para Meta e Google. A OpenAI depende de um aceite informado novo com a validade do banner. Conferir a permissão gravada a cada clique para bloquear inclusive revogação em outra aba.
- Preservar UTMs em memória na navegação interna e `oppref` na sessão da aba somente após aceite. Só aceitar referências com formato de token opaco; ignorar entradas fora do padrão, como telefone. Remover a referência em memória e na sessão ao revogar ou expirar; não reescrever URLs, não anexar parâmetros ao WhatsApp e não enviar UTMs à OpenAI. O redirecionamento de `www` já preserva a query.
- A CSP só acrescenta `https://bzr.openai.com` a `img-src`. Os scripts, destinos e IDs de Meta, GA4 e GTM não mudam.

## Operação e verificação

- `src/features/settings/components/openai-ads-pixel.tsx`, `cookie-consent.tsx`, `src/features/shared/attribution.ts`: medição, consentimento e navegação.
- `next.config.ts` e `src/app/(site)/politica-de-privacidade/page.tsx`: CSP e transparência.
- `e2e/openai-ads-pixel.spec.ts` e `src/features/shared/attribution.test.ts`: testes de clique, consentimento, expiração, atribuição, ausência do SDK e payload exato. Testes interceptam a rede, sem emitir conversões reais.
- Verificações locais em 12/11/2026: 80 testes unitários, 10 verificações de navegador (desktop e mobile), TypeScript, ESLint dos arquivos alterados e build de produção aprovados. O bloco de scripts de Meta, GA4 e GTM foi comparado com a main e está idêntico.
- Após deploy, abrir **Conversões → Fluxo de eventos** na conta Leehov; aceitar medição no site e clicar uma vez no WhatsApp. Conferir `whatsapp_click` para a fonte **Leehov | Site | Produção**. A etiqueta de sessão de teste do SDK não é exigida para o Image Tag. Não enviar mensagem no WhatsApp nem vincular evento a campanhas.
- Publicação: commit `feat(tracking): adiciona Pixel da OpenAI Ads`, push na main e deploy Git automático na Vercel, autorizados para a integração da OpenAI.
