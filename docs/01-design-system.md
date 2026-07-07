# Design System — Leehov Turismo

Este documento define a direção visual do projeto Leehov Turismo, baseada nas imagens de referência aprovadas e no uso do **Paper MCP** como fonte visual durante a implementação.

## Conceito visual

A interface deve transmitir:

1. Confiança.
2. Organização.
3. Experiência premium acessível.
4. Acolhimento.
5. Movimento de viagem.
6. Segurança para viagens em grupo.
7. Clareza para tomada de decisão.

O site deve parecer moderno e limpo, sem virar um template genérico de agência de turismo. A Leehov vende principalmente **caravanas e viagens em grupo acompanhadas**, então o design deve valorizar pessoas, destinos, orientação e experiência real.

## Fonte visual oficial

As referências visuais aprovadas estão no **Paper** e devem ser consultadas via MCP antes da criação de qualquer tela.

Referências que o agente deve buscar:

1. Home com carrossel de destinos.
2. Home com vídeo institucional.
3. Seção visual com avião, vento e céu.
4. Página de blog.
5. Página de post aberto.
6. Dashboard inicial do admin.
7. Aba de caravanas/pacotes do admin.
8. Assets separados, como avião, céu e fundos.
9. Qualquer imagem aprovada posteriormente pelo responsável do projeto.

## Base técnica de UI

Usar:

1. shadcn/ui como base de componentes.
2. Tailwind CSS para estilização.
3. Lucide React para ícones.
4. Componentes próprios em `/components/leehov` para aplicar a identidade final.

O shadcn não deve ser usado com visual genérico. Ele é a base técnica, não a identidade final.

## Paleta de cores sugerida

| Token | Uso | Hex |
|---|---|---|
| `navy` | Títulos, footer, áreas institucionais | `#062A44` |
| `blue` | Botões, links e detalhes | `#0077C8` |
| `cyan` | Destaques e CTAs | `#00AEEF` |
| `sky` | Fundos suaves | `#F3FAFF` |
| `white` | Cards e fundos principais | `#FFFFFF` |
| `text` | Texto principal | `#0B1F3A` |
| `muted` | Texto secundário | `#5F6F84` |
| `border` | Bordas leves | `#DDEAF5` |
| `success` | Disponível/publicado | `#22C55E` |
| `warning` | Em breve/lista de espera | `#F59E0B` |
| `danger` | Esgotado/excluir | `#EF4444` |

## Gradientes

```css
--gradient-blue: linear-gradient(135deg, #062A44 0%, #0077C8 55%, #00AEEF 100%);
--gradient-soft: linear-gradient(180deg, #F8FCFF 0%, #EEF8FF 100%);
--gradient-footer: linear-gradient(135deg, #031D32 0%, #062A44 100%);
```

## Tipografia

Fonte sugerida:

```txt
Inter
```

Hierarquia:

| Elemento | Desktop | Mobile | Peso |
|---|---:|---:|---:|
| Hero title | 72px a 96px | 42px a 52px | 700 |
| Título de seção | 40px a 48px | 30px a 36px | 700 |
| Subtítulo | 18px a 20px | 16px | 400 |
| Card title | 18px a 22px | 17px a 20px | 600 |
| Texto comum | 16px | 15px a 16px | 400 |
| Texto pequeno | 13px a 14px | 13px | 400 |
| Botão | 14px a 16px | 14px a 16px | 600 |

## Espaçamentos

| Uso | Valor sugerido |
|---|---:|
| Container padrão | 1180px |
| Container amplo | 1320px |
| Padding lateral desktop | 48px |
| Padding lateral mobile | 20px |
| Espaçamento de seção desktop | 96px a 120px |
| Espaçamento de seção mobile | 64px a 80px |
| Gap entre cards | 24px a 32px |

Regra: as seções devem respirar. Nada de empilhar blocos como se o usuário estivesse lendo um extrato bancário com fotos bonitas.

## Bordas e sombras

```css
--radius-sm: 8px;
--radius-md: 14px;
--radius-lg: 22px;
--radius-xl: 32px;
--radius-full: 999px;

--shadow-card: 0 12px 32px rgba(6, 42, 68, 0.08);
--shadow-card-hover: 0 18px 46px rgba(6, 42, 68, 0.14);
--shadow-floating: 0 24px 70px rgba(6, 42, 68, 0.18);
```

## Componentes do site público

### Header

1. Logo à esquerda.
2. Menu central.
3. CTA de WhatsApp à direita.
4. Versão sticky ao rolar.
5. Menu mobile em sheet lateral.

Menu sugerido:

1. Início.
2. Caravanas.
3. Destinos.
4. Viagens em Grupo.
5. Blog.
6. Quem Somos.
7. Contato.

### Hero com carrossel

1. Fundo com imagem grande da caravana/destino.
2. Overlay azul escuro para legibilidade.
3. Título grande.
4. Descrição curta.
5. Botões principais.
6. Cards de caravanas/destinos.
7. Navegação por setas e indicadores.

### Seção de vídeo

1. Vídeo institucional grande.
2. Título emocional.
3. Texto curto.
4. Números rápidos.
5. CTA para caravanas ou WhatsApp.

### Próximas caravanas

Cards com:

1. Imagem.
2. Nome da caravana.
3. Destino.
4. Duração.
5. Saídas.
6. Status.
7. Selo de grupo acompanhado.
8. CTA.

### Como funciona viajar com a Leehov

Seção em 4 passos:

1. Escolha sua caravana.
2. Fale com a equipe.
3. Receba orientações.
4. Viaje com acompanhamento.

### Depoimentos

1. Cards brancos.
2. Estrelas.
3. Nome.
4. Texto curto.
5. Origem manual ou Google.
6. Link para avaliações do Google quando disponível.

## Componentes do admin

O admin deve ser limpo, claro e funcional.

Menu:

1. Dashboard.
2. Caravanas.
3. Blog.
4. Leads.
5. Newsletter.
6. Depoimentos.
7. Pop-ups.
8. Mídia.
9. Configurações.
10. Webhooks.
11. Usuários.

Padrões:

1. Sidebar fixa em desktop.
2. Cards brancos.
3. Tabelas limpas.
4. Badges de status.
5. Botão primário azul.
6. Formulários separados por seções.
7. Abas para formulários longos.

## Organização de componentes

```txt
src/components/ui
src/components/leehov/site
src/components/leehov/admin
src/components/leehov/shared
```

## Regra de implementação visual

Antes de criar qualquer tela:

1. Consultar Paper via MCP.
2. Ler este documento.
3. Usar shadcn/ui como base.
4. Aplicar tokens do design system.
5. Criar componentes próprios da Leehov.
6. Não criar visual genérico.
7. Não alterar paleta ou estrutura visual sem aprovação explícita.
