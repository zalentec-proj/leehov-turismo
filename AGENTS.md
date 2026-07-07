# AGENTS.md — Instruções para Agentes de IA

Este repositório contém o projeto **Leehov Turismo**, uma nova plataforma web com site público e painel administrativo para gestão de caravanas, conteúdos e captação de interessados.

Antes de qualquer alteração, leia obrigatoriamente:

1. `README.md`
2. todos os documentos em `/docs`
3. `docs/01-design-system.md`
4. `docs/12-contexto-completo-do-projeto.md`

## Regra operacional obrigatória

Nenhuma ação deve ser feita no GitHub sem aprovação explícita do responsável pelo projeto.

Isso inclui:

1. criar arquivos;
2. alterar arquivos;
3. excluir arquivos;
4. instalar dependências;
5. criar branches;
6. fazer commits;
7. abrir pull requests;
8. criar migrations;
9. configurar serviços externos;
10. alterar estrutura de pastas;
11. modificar banco de dados;
12. subir código ou documentação.

Antes de qualquer ação, apresente:

1. o que será feito;
2. quais arquivos serão afetados;
3. por que isso será feito;
4. qual será a mensagem de commit, quando houver.

Aguarde aprovação explícita antes de executar.

## Contexto do projeto

A Leehov Turismo trabalha principalmente com **caravanas e viagens em grupo acompanhadas**.

O projeto não deve ser tratado como um simples catálogo de pacotes turísticos. O foco é comunicar:

1. confiança;
2. acompanhamento;
3. experiência em grupo;
4. organização;
5. segurança;
6. clareza de roteiro;
7. desejo de viajar;
8. suporte antes, durante e depois da viagem.

## Stack definida

Usar:

1. Next.js App Router;
2. TypeScript;
3. Tailwind CSS;
4. shadcn/ui;
5. Supabase PostgreSQL;
6. Supabase Auth;
7. Supabase Storage;
8. Vercel;
9. React Hook Form;
10. Zod;
11. Lucide React.

## Design

O design deve seguir as referências aprovadas no **Paper MCP**.

Antes de criar qualquer tela visual, consulte o Paper MCP para buscar as referências aprovadas do projeto, incluindo:

1. home com carrossel de destinos;
2. home com vídeo institucional;
3. seção com avião, vento e céu;
4. página de blog;
5. página de post aberto;
6. dashboard inicial do admin;
7. aba de caravanas/pacotes do admin;
8. assets aprovados, como avião, céu e fundos.

O shadcn/ui deve ser usado apenas como base técnica.

Não usar visual genérico de template.

A identidade final deve seguir o design system da Leehov, com layout moderno, limpo, espaçado, confiável e focado em viagens em grupo.

## Nomenclatura

Na interface do site e do painel administrativo, priorizar o termo:

**Caravanas**

Evitar usar “Pacotes” como termo principal, salvo quando for necessário por compatibilidade técnica ou clareza interna.

A linguagem deve reforçar:

1. caravana;
2. viagem em grupo;
3. roteiro acompanhado;
4. experiência;
5. destino;
6. suporte;
7. consultor;
8. viajantes.

## Arquitetura

O projeto deve ser modular por domínio.

Módulos principais:

1. `caravans`
2. `blog`
3. `leads`
4. `newsletter`
5. `testimonials`
6. `popups`
7. `settings`
8. `media`

Cada módulo deve concentrar, quando necessário:

1. tipos;
2. schemas de validação;
3. queries;
4. actions;
5. componentes;
6. utilitários.

## Site público

O site público deve conter, no MVP:

1. Home;
2. Caravanas;
3. Página individual de caravana;
4. Quem Somos;
5. Blog;
6. Post individual;
7. Contato;
8. Política de Privacidade.

A Home deve priorizar:

1. hero com carrossel de destinos/caravanas;
2. vídeo institucional;
3. próximas caravanas em grupo;
4. como funciona viajar com a Leehov;
5. sobre a Leehov;
6. diferenciais;
7. depoimentos e Google Reviews;
8. blog/inspirações de viagem;
9. newsletter;
10. footer.

## Painel administrativo

O admin deve conter, no MVP:

1. Login;
2. Dashboard;
3. Caravanas;
4. Blog;
5. Leads;
6. Newsletter;
7. Depoimentos;
8. Pop-ups;
9. Mídia;
10. Configurações;
11. Usuários, se necessário.

O admin deve ser simples, limpo, funcional e organizado para uso por cliente não técnico.

## Restrições do MVP

Não implementar sem aprovação explícita:

1. pagamento online;
2. reservas online;
3. área do cliente;
4. CRM completo;
5. automação avançada de e-mail;
6. multi-idioma;
7. sistema financeiro;
8. login para viajantes;
9. marketplace de pacotes;
10. integrações externas não previstas.

## Objetivo

Construir uma primeira versão sólida, administrável, bonita e modular.

A prioridade é entregar bem o escopo aprovado e permitir evolução futura sem reescrever o sistema inteiro.
