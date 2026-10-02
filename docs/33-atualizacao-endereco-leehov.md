# Atualização de endereço — 02/10/2026

## Solicitação e escopo

O responsável solicitou substituir o endereço antigo de Corbélia por `Rua Pernambuco 800 - Centro, Cascavel/PR - 85810-020`.

## Decisões

- Atualizar somente `contact_info.value.address` em `public.site_settings`, preservando telefone, e-mail e demais configurações.
- Manter uma única configuração de endereço compartilhada pela página de contato e pelo rodapé.
- Atualizar também o fallback em `src/features/settings/queries.ts`, para não voltar a exibir o endereço antigo quando o cadastro estiver ausente ou indisponível.
- Não alterar históricos, migrations, conteúdo de caravanas ou configurações externas.

## Continuidade

A correção do dado foi autorizada diretamente pela solicitação e conferida no banco, na página de contato e no rodapé do site. O responsável confirmou commit, push na main e deploy do fallback em 02/10/2026, após apresentação do escopo e da mensagem `fix(settings): atualiza endereço da Leehov`, conforme `AGENTS.md`.

Verificação local: ESLint do arquivo alterado e `git diff --check` aprovados. A publicação deve ser confirmada como READY na Vercel para o commit da main e no domínio oficial; não é necessária migration.
