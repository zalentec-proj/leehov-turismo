# Contexto Completo do Projeto — Leehov Turismo

Este documento registra as decisões estratégicas, visuais, comerciais e técnicas discutidas antes do início do desenvolvimento do novo site e painel administrativo da **Leehov Turismo**.

O objetivo é preservar o contexto do projeto para qualquer pessoa ou agente de IA que venha a trabalhar no repositório.

## 1. Visão geral

A Leehov Turismo possui um site atual em WordPress e precisa de uma nova plataforma mais moderna, rápida, responsiva e fácil de administrar.

O projeto aprovado contempla:

1. site público;
2. painel administrativo;
3. gestão de caravanas;
4. blog;
5. newsletter;
6. pop-up editável;
7. formulários de contato e interesse;
8. depoimentos;
9. possibilidade de exibição de avaliações do Google;
10. SEO inicial;
11. Analytics e Pixel;
12. suporte inicial após a entrega.

O cliente aprovou o **Plano 2 — Site Profissional com Admin Completo**.

## 2. Posicionamento do projeto

O foco do projeto não é criar um simples catálogo de pacotes turísticos.

O foco é criar uma plataforma para divulgar e gerenciar:

**caravanas e viagens em grupo acompanhadas.**

A Leehov vende uma experiência mais completa, baseada em:

1. destinos;
2. roteiro planejado;
3. viagem em grupo;
4. acompanhamento;
5. consultoria;
6. suporte;
7. confiança;
8. experiência real;
9. organização.

Por isso, a linguagem do site deve priorizar termos como:

1. caravanas;
2. viagens em grupo;
3. roteiros acompanhados;
4. próximas saídas;
5. fale com um consultor;
6. experiências;
7. viajantes.

## 3. Site atual como briefing

O site atual da Leehov deve ser usado como base inicial de conteúdo e estrutura.

A página de caravana para o Japão mostrou que as páginas atuais possuem informações importantes, como:

1. título do roteiro;
2. valor;
3. meses de saída;
4. CTA para falar com consultor;
5. roteiro dia a dia;
6. informações inclusas;
7. informações não inclusas;
8. formulário de contato;
9. relação com blog;
10. rodapé com contatos.

A principal deficiência não é falta de conteúdo, mas organização visual, hierarquia e experiência de navegação.

A nova versão deve reaproveitar o que for útil, mas reorganizar em uma interface moderna, limpa e mais clara.

## 4. Direção visual

O design deve seguir as imagens de referência criadas e aprovadas no Paper.

As principais decisões visuais são:

1. layout moderno e limpo;
2. fundo claro;
3. uso de azul como cor institucional;
4. imagens grandes de destinos;
5. cards arredondados;
6. seções bem separadas;
7. bastante respiro visual;
8. elementos de movimento, como avião, vento, céu, rotas e mapas;
9. interface emocional, mas confiável;
10. admin claro e produtivo.

O site não deve parecer um template genérico de agência de turismo.

## 5. Paper MCP

O Paper MCP será usado como fonte visual oficial.

Antes de criar telas, o agente de desenvolvimento deve consultar o Paper MCP para buscar as referências visuais aprovadas.

Referências importantes no Paper:

1. home com carrossel de destinos;
2. home com seção de vídeo institucional;
3. seção visual com avião e céu;
4. modelo de blog;
5. modelo de post aberto;
6. dashboard inicial do admin;
7. aba de caravanas/pacotes do admin;
8. assets do avião;
9. asset do céu;
10. demais imagens aprovadas durante o projeto.

O Paper serve como referência visual. O código deve transformar essas referências em componentes reais, responsivos e consistentes.

## 6. Biblioteca visual

A base visual técnica será:

1. shadcn/ui;
2. Tailwind CSS;
3. Lucide React.

O shadcn/ui deve ser usado como base técnica de componentes, não como identidade visual final.

A identidade da Leehov deve ser aplicada por meio de:

1. tokens de cor;
2. componentes próprios;
3. espaçamentos definidos;
4. bordas e sombras;
5. padrões de cards;
6. botões;
7. seções customizadas.

Componentes próprios devem ficar em:

1. `/components/leehov/site`
2. `/components/leehov/admin`
3. `/components/leehov/shared`

## 7. Home

A Home deve ser emocional, moderna e direcionada para conversão.

Estrutura planejada:

1. Header;
2. Hero com carrossel de destinos/caravanas;
3. Vídeo institucional;
4. Próximas caravanas em grupo;
5. Como funciona viajar com a Leehov;
6. Sobre a Leehov;
7. Diferenciais;
8. Depoimentos / Google Reviews;
9. Inspirações de viagem;
10. Newsletter;
11. Footer.

## 8. Hero com carrossel

O topo da Home deve ter um carrossel de destinos/caravanas.

Funcionamento esperado:

1. cada slide representa uma caravana ou destino em destaque;
2. ao trocar o slide, muda a imagem de fundo;
3. muda o título;
4. muda a breve descrição;
5. muda o CTA;
6. cards laterais ou inferiores mostram outras caravanas;
7. o admin define quais caravanas aparecem no hero.

O hero deve vender desejo, destino e experiência.

## 9. Vídeo institucional

A Home deve ter uma seção de vídeo institucional.

Objetivo:

1. mostrar a experiência de viajar em grupo;
2. transmitir confiança;
3. mostrar bastidores, pessoas e destinos;
4. reforçar o acompanhamento da Leehov.

Título sugerido:

**Viajar em grupo é viver histórias juntos**

A seção deve ter:

1. vídeo grande;
2. thumbnail;
3. botão de play;
4. texto institucional curto;
5. dados rápidos ou CTA;
6. possibilidade de edição pelo admin.

## 10. Seção com avião, vento e céu

Foi pensada uma seção visual com avião, efeito de vento e céu.

Essa seção pode aparecer na Home ou em uma área institucional, trazendo movimento e identidade visual.

A ideia é que o avião possa ter efeito visual ao rolar a tela, passando entre os blocos de conteúdo.

A implementação deve ser elegante e leve, sem excesso de animação.

Deve respeitar acessibilidade e preferências de redução de movimento.

## 11. Próximas caravanas em grupo

A seção de listagem principal da Home deve usar o conceito:

**Próximas caravanas em grupo**

Cada card deve conter:

1. imagem;
2. nome da caravana;
3. destino;
4. duração;
5. saídas;
6. status;
7. selo de grupo acompanhado;
8. botão para ver detalhes;
9. botão ou link para WhatsApp, se adequado.

## 12. Como funciona viajar com a Leehov

Adicionar seção em quatro passos:

1. Escolha sua caravana.
2. Fale com nossa equipe.
3. Receba todas as orientações.
4. Viaje com acompanhamento.

Essa seção reduz insegurança e explica o processo.

## 13. Página individual da caravana

A página individual não deve ter excesso de informação visual ao mesmo tempo.

A primeira imagem criada ficou pesada demais. A nova direção é uma página mais limpa, com informações progressivas.

Estrutura recomendada:

1. hero da caravana;
2. resumo rápido;
3. vídeo ou galeria;
4. roteiro dia a dia em accordion;
5. o que está incluso;
6. o que não está incluso;
7. líder ou acompanhamento da caravana;
8. depoimentos;
9. FAQ;
10. formulário de interesse;
11. CTA fixo no mobile;
12. caravanas relacionadas.

A página deve vender a caravana sem parecer uma ficha técnica confusa.

## 14. Roteiro dia a dia

O roteiro de uma caravana deve ser cadastrado de forma estruturada.

Cada dia deve ter:

1. número do dia;
2. título;
3. cidade/local;
4. descrição;
5. imagem opcional;
6. refeições, quando aplicável;
7. observações;
8. hospedagem, se necessário.

No site, o roteiro pode aparecer como accordion ou timeline, principalmente para evitar excesso de informação no mobile.

## 15. Admin

O admin deve usar a nomenclatura **Caravanas**.

Menu previsto:

1. Dashboard;
2. Caravanas;
3. Blog;
4. Leads;
5. Newsletter;
6. Depoimentos;
7. Pop-ups;
8. Mídia;
9. Configurações;
10. Webhooks;
11. Usuários.

O admin deve ser simples para o cliente usar.

O painel não precisa ser um ERP. O objetivo é permitir autonomia para gerenciar o conteúdo do site.

## 16. Admin de caravanas

A tela de caravanas deve permitir:

1. listar caravanas;
2. buscar;
3. filtrar por status;
4. criar nova caravana;
5. editar caravana existente;
6. publicar/despublicar;
7. marcar como destaque da Home;
8. marcar como destaque do Hero;
9. definir ordem de exibição;
10. subir imagens;
11. editar roteiro dia a dia;
12. editar inclusos e não inclusos;
13. editar SEO.

A tela de criação/edição pode ser organizada por abas:

1. Informações gerais;
2. Imagens;
3. Roteiro;
4. Incluso e não incluso;
5. Grupo e acompanhamento;
6. SEO;
7. Publicação.

## 17. Blog

O blog deve ser moderno, parecido com um hub de inspiração e autoridade, não apenas uma lista simples de posts.

Nome sugerido para a área:

**Inspirações de Viagem**

Estrutura do blog:

1. hero editorial;
2. busca;
3. categorias;
4. post em destaque;
5. grid moderno de posts;
6. guias essenciais;
7. explore por destino;
8. relatos de viagem;
9. CTA para caravanas;
10. newsletter.

## 18. Post aberto

A página de post aberto deve ter:

1. categoria;
2. título;
3. resumo;
4. autor;
5. data;
6. tempo de leitura;
7. imagem principal;
8. conteúdo bem formatado;
9. blocos de destaque;
10. galeria opcional;
11. roteiro relacionado;
12. posts relacionados;
13. CTA final.

O blog deve ajudar a vender caravanas e melhorar SEO.

## 19. Depoimentos e Google Reviews

O site deve ter seção de depoimentos.

Fontes possíveis:

1. depoimentos manuais cadastrados no admin;
2. avaliações do Google, quando viável tecnicamente.

O admin deve permitir:

1. cadastrar depoimento manual;
2. ativar/desativar depoimento;
3. destacar depoimentos;
4. configurar exibição de Google Reviews;
5. definir modo de exibição: manual, Google ou misto.

A integração oficial escolhida para reviews reais é a Google Business Profile API. Ela depende de OAuth 2.0, acesso ao Perfil da Empresa e credenciais válidas.

O admin poderá sincronizar avaliações, ocultar ou destacar no site, responder avaliações e remover respostas da empresa. O admin não poderá excluir a avaliação original do cliente no Google.

## 20. Newsletter

A newsletter deve ser simples no MVP, com double opt-in e e-mails transacionais via Resend.

Fluxo:

1. visitante informa nome e e-mail;
2. sistema salva no Supabase com status pendente;
3. sistema envia e-mail de confirmação;
4. visitante confirma a inscrição;
5. admin vê inscritos e status;
6. campanhas avançadas ficam para fase posterior.

## 21. Pop-up

O pop-up deve ser editável pelo admin.

Campos previstos:

1. ativo;
2. título;
3. descrição;
4. imagem;
5. texto do botão;
6. link do botão;
7. tipo;
8. onde exibir;
9. frequência.

No MVP, pode haver um pop-up principal ativo.

## 22. Leads

Os formulários devem salvar leads no admin.

Fontes de leads:

1. formulário de contato geral;
2. formulário de interesse em caravana;
3. newsletter;
4. pop-up, se aplicável.

Cada lead deve guardar:

1. nome;
2. e-mail;
3. WhatsApp;
4. mensagem;
5. origem;
6. caravana relacionada;
7. status;
8. data de criação.

Status sugeridos:

1. novo;
2. em atendimento;
3. convertido;
4. arquivado.

## 22.1 Webhooks

O painel administrativo deve possuir uma área de Webhooks em `/admin/webhooks`.

Objetivo:

1. configurar disparos server-side para eventos do sistema;
2. testar envios;
3. visualizar histórico;
4. reenviar falhas.

Eventos previstos:

1. lead criado;
2. interesse em caravana criado;
3. contato criado;
4. inscrição ou confirmação de newsletter;
5. review do Google criado ou com nota baixa;
6. caravana criada, atualizada ou publicada;
7. post publicado.

Fora do MVP:

1. construtor visual de automações;
2. condições avançadas por campo;
3. múltiplas etapas;
4. editor livre de payload;
5. integração nativa com vários CRMs.

## 23. Página Quem Somos

A página Quem Somos deve reforçar confiança.

Conteúdos sugeridos:

1. história da Leehov;
2. propósito;
3. experiência com grupos;
4. fotos reais;
5. diferenciais;
6. equipe ou responsável;
7. depoimentos;
8. CTA para conhecer caravanas.

## 24. Página Contato

A página de contato deve conter:

1. formulário;
2. WhatsApp;
3. e-mail;
4. endereço;
5. redes sociais;
6. horário de atendimento;
7. CTA para falar com consultor.

## 25. FAQ

O site deve ter FAQ, especialmente nas páginas de caravana.

Perguntas possíveis:

1. Como funciona a reserva?
2. Preciso de passaporte?
3. A viagem tem guia?
4. O grupo sai junto?
5. Posso viajar sozinho?
6. O valor pode ser parcelado?
7. O que está incluso?
8. O seguro viagem está incluso?
9. Como recebo o roteiro completo?
10. Como falo com um consultor?

## 26. Supabase

O Supabase será usado para:

1. banco PostgreSQL;
2. autenticação do admin;
3. storage de imagens;
4. Row Level Security;
5. dados de site, blog, leads, newsletter e caravanas.

As políticas devem garantir:

1. visitantes só leem conteúdos publicados;
2. visitantes podem criar leads e inscrições;
3. apenas admins/editors podem acessar dados internos;
4. uploads apenas por usuários autenticados;
5. dados sensíveis protegidos por RLS.

## 27. Arquitetura modular

O projeto deve ser modular, para permitir evolução.

Módulos principais:

1. `caravans`;
2. `blog`;
3. `leads`;
4. `newsletter`;
5. `testimonials`;
6. `popups`;
7. `settings`;
8. `media`;
9. `emails`;
10. `webhooks`.

Essa arquitetura deve evitar acoplamento excessivo e facilitar manutenção.

## 28. Fora do MVP

Não implementar no primeiro momento:

1. pagamento online;
2. reservas online;
3. área do cliente;
4. CRM completo;
5. sistema financeiro;
6. multi-idioma;
7. login para viajantes;
8. automação avançada de e-mail;
9. construtor visual de automações;
10. integrações externas complexas fora das integrações documentadas.

Esses recursos podem entrar em evolução futura.

## 29. Cronograma

O prazo contratual é de 30 dias úteis.

A execução deve priorizar:

1. documentação técnica;
2. setup do projeto;
3. design system em código;
4. Supabase;
5. site público;
6. admin;
7. integrações;
8. testes;
9. publicação;
10. treinamento.

## 30. Regra final

Toda pessoa ou agente de IA que trabalhar neste projeto deve seguir:

1. ler os documentos;
2. consultar Paper MCP;
3. respeitar o design system;
4. manter a arquitetura modular;
5. não implementar fora do MVP;
6. não alterar o GitHub sem aprovação explícita;
7. priorizar clareza, estabilidade e entregabilidade.
