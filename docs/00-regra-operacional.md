# Regra Operacional do Projeto

Este documento define a regra de controle do projeto **Leehov Turismo**.

## Regra principal

O agente/IDE pode trabalhar localmente dentro do escopo da tarefa solicitada, sem pedir aprovação para cada pequena ação.

Isso permite:

1. Criar e alterar arquivos localmente.
2. Organizar pastas.
3. Gerar documentos.
4. Preparar código local.
5. Instalar dependências locais quando isso fizer parte da tarefa.
6. Rodar comandos de desenvolvimento, build, lint e testes.
7. Refatorar arquivos relacionados ao escopo solicitado.
8. Apresentar diff ou resumo para revisão.

A revisão pode acontecer pelo próprio diff da IDE.

Nenhuma ação deve ser feita no GitHub, em produção ou em serviços externos sem confirmação clara do responsável pelo projeto.

## Ações que exigem confirmação

Antes das ações abaixo, deve haver confirmação clara:

1. Commit.
2. Push.
3. Pull request.
4. Merge.
5. Deploy.
6. Migrations no Supabase remoto.
7. Alterações em dados de produção.
8. Alteração de variáveis reais de ambiente.
9. Configuração de serviços externos.
10. Ativação de serviços pagos.
11. Mudança de stack.
12. Remoção de módulos importantes.
13. Implementação de funcionalidades fora do MVP.

## Fluxo para ações sensíveis

Antes de uma ação sensível:

1. Apresentar o que será feito.
2. Listar arquivos afetados.
3. Explicar o objetivo da alteração.
4. Informar a mensagem de commit pretendida, quando houver.
5. Aguardar confirmação clara.

Não é necessário usar frase padrão de aprovação. A confirmação pode ocorrer em linguagem natural ou pelo fluxo de revisão da IDE, desde que fique claro o que será enviado ou aplicado.

## Objetivo da regra

Evitar alterações remotas ou sensíveis não autorizadas, sem bloquear o trabalho local necessário para desenvolvimento, documentação e revisão técnica.
