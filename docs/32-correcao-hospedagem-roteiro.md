# Correção de hospedagem no roteiro — 02/10/2026

## Causa

Na caravana China 2027 (`china-10destinos-setembro2027`), os campos de hospedagem dos dias 7, 8 e 14 continham as refeições e uma cópia da descrição do dia. O site exibia corretamente o conteúdo salvo, mas repetia o roteiro na área de hospedagem. No admin, a coluna de 110 px escondia o excesso de texto.

## Correção de conteúdo

Após autorização do responsável, somente a hospedagem desses três dias foi corrigida em produção: Zhangjiajie nos dias 7 e 8; Hangzhou no dia 14. A atualização teve pré-condições para proteger alterações concorrentes e foi verificada no banco. As descrições foram preservadas (hashes antes/depois iguais), assim como refeições e imagens. Nenhuma migration foi necessária.

## Decisão de interface

Hospedagem e refeições passam a compartilhar uma linha com duas colunas amplas no desktop, empilhadas no celular. Hospedagem usa um campo multilinha com orientação para informar hotel ou cidade do pernoite. Acima de 180 caracteres, há um aviso de revisão, sem bloqueio, truncamento ou alteração automática. Isso preserva cadastros legítimos com detalhes de hotéis.

## Continuidade

Arquivo alterado: `src/features/caravans/components/caravan-form.tsx`.
O aviso é apenas preventivo: não corrige registros antigos nem limita a validação já existente. Para novas correções de conteúdo, revisar os campos do admin e não substituir a descrição do dia. A melhoria de interface precisa ser publicada na Vercel; a correção do conteúdo já está no banco de produção.

## Verificação

- TypeScript (`npm run typecheck`): aprovado.
- ESLint do formulário: aprovado.
- `git diff --check`: aprovado.
- Site de produção: dias 7, 8 e 14 conferidos no navegador, com a hospedagem correta e sem repetição do parágrafo na área de hospedagem.
- Commit, push na main e deploy da melhoria do formulário: autorizados pelo responsável em 02/10/2026, após apresentação dos arquivos, objetivo e mensagem de commit. A publicação deve ser conferida pelo status READY da Vercel e pela presença do novo campo no admin.
