# Prompt para Claude Code — Retail Performance Platform

> Cole este documento inteiro como prompt inicial no Claude Code, dentro do repositório clonado do GitHub. Ele assume que os seguintes arquivos já estão no repositório (ajuste os caminhos se necessário):
> - `telas/telas-mobile.html` — mockups mobile (21 telas, alta fidelidade)
> - `telas/telas-tablet.html` — mockups tablet (18 telas)
> - `wireflow/wireflow.svg` — diagrama de fluxo de navegação completo
> - `docs/product-design.md` — especificação funcional dos 5 módulos

---

## 1. Contexto do produto

Estou construindo o **Retail Performance Platform**, uma plataforma B2B de inteligência comercial para o varejo de calçados/moda. Ela conecta três personas — **indústria**, **representante** e **lojista** — substituindo a lógica linear tradicional (indústria → representante → lojista → consumidor) por um ecossistema colaborativo onde todos alimentam dados e recebem inteligência.

Princípio central do produto: **não mostrar dados, mostrar decisões.** Cada tela deve responder "o que eu faço agora", não apenas exibir informação.

Este prompt cobre as duas personas com interface própria: **lojista** (compra, planeja e fideliza clientes) e **representante** (gerencia carteira de clientes e pedidos). Construa primeiro a versão mobile (mobile-first), depois adapte para tablet usando os padrões descritos na seção 6.

---

## 2. Como trabalhar

1. Leia `telas/telas-retail-performance-platform-v7.html` no navegador ou abra o código-fonte — é a **fonte da verdade visual** (cores exatas, tipografia, espaçamento, componentes). Não reinvente o visual: reproduza fielmente.
2. Leia `wireflow/retail-platform-wireflow.svg` para entender as transições entre telas e os pontos de convergência entre lojista e representante.
3. Construa os componentes na ordem listada nas seções 4 e 5 — essa é a ordem real de navegação de cada persona, não a ordem alfabética ou por módulo.
4. Onde uma tela aparece nas duas seções (pontos de convergência), implemente como **um único componente/rota compartilhada**, com lógica condicional de permissão (ex: o representante vê um botão "Aprovar pedido" que o lojista não vê).
5. Sempre que eu disser "próxima tela" ou "continue", avance para a próxima da lista, respeitando a ordem.

---

## 3. Design system (tokens)

**Regra de cor 60/30/10:**
- Branco domina as superfícies (60%) — fundo de app, cards, telas.
- Cinza estrutura (30%) — bordas, superfícies secundárias, texto secundário/terciário.
- Preto é reservado só para CTAs, seleções ativas e destaques de maior prioridade (10%).
- Cor semântica (verde/vermelho/azul) existe **apenas como sinal funcional pontual** (badge pequeno, borda esquerda de 3px, indicador de status) — nunca como preenchimento grande. Ela é parte da usabilidade (indicar risco/oportunidade no Radar), não decoração.

```css
--bg-canvas:#EDEDEF;   --bg-app:#FFFFFF;      --surface:#FFFFFF;
--surface-2:#F4F4F5;   --surface-3:#E9E9EB;   --border:#E2E2E5;
--border-strong:#D3D3D7;
--text-primary:#161618; --text-secondary:#6C6C73; --text-tertiary:#A0A0A6;
--black:#161618;        --on-black:#FFFFFF;
--positive:#1E8A54;  --positive-dim:#EAF5EE;
--risk:#C9392F;      --risk-dim:#FBEAE9;
--info:#3060C4;      --info-dim:#EBF0FB;
```

**Tipografia:**
- Display/títulos: `Space Grotesk` (600/700)
- Corpo/UI: `IBM Plex Sans` (400/500/600)
- Dados, números, rótulos em caixa alta (eyebrows): `IBM Plex Mono` (400/500)

**Forma:** cantos fechados — 4px em controles (botões, inputs, chips, cards pequenos), 8px em containers maiores (frames desktop/tablet). Isso é proposital: reforça a leitura de "instrumento de precisão", não de app de consumo.

**Botões:** rótulos sempre verbo primeiro ("Planejar", não "Planejamento"; "Confirmar pedido", não "Confirmação").

**Marca:** logotipo em preto, uso discreto, centralizado no rodapé das telas de login apenas (não aparece em outras telas nem no header do app).

---

## 4. Fluxo do LOJISTA (ordem de construção)

| # | Tela | O que precisa existir |
|---|------|------------------------|
| 0.1 | **Seleção de Perfil** | Tela compartilhada de entrada. Dois cards grandes: "Sou lojista" / "Sou representante". Leva ao login correspondente. |
| 0.2 | **Login — Lojista** | E-mail, senha, "esqueci minha senha", botão "Entrar" (preto), alternativa "Entrar com Google", link cruzado para login do representante. |
| 1 | **Perfil da Loja — Dados básicos (1/3)** | Wizard, barra de progresso (3 segmentos). Campos: nome da loja, segmento (chips multi-select), porte da loja (chips single-select), região (select), público-alvo (chips multi-select). |
| 2 | **Perfil da Loja — Dados de vendas (2/3)** | Opção "Conectar meu sistema de vendas" (card destacado) OU preencher manualmente: ticket médio, categorias mais vendidas, sazonalidade forte. |
| 3 | **Objetivo do momento (3/3)** | Cards grandes de intenção, seleção única: "Repor estoque", "Planejar a próxima coleção", "Recuperar clientes parados", "Só dar uma olhada geral". Isso define o que aparece priorizado no Radar. CTA final: "Ir para o meu radar". |
| 4 | **Radar Comercial — Lojista** (home) | Saudação personalizada. Fileira de *insight cards* (oportunidade, risco, benchmark) com severidade indicada por borda colorida + tag preta "Oportunidade" no card de maior prioridade. Painel do dia (lista de categorias: reposição, lançamentos, produtos em alta, alertas). CTA "Ver planejamento de compra". Link "Ajustar foco" no header. |
| 4.1 | **Ajustar Foco** (drawer/modal, acessível a qualquer momento a partir do Radar) | Reaproveita o componente de "objetivo do momento" em formato compacto — bottom sheet no mobile, modal centralizado no tablet. |
| 6 | **Catálogo Inteligente — Listagem** | Busca, chips de filtro ("Recomendado p/ você", "Alto giro", "Boa margem", "Lançamentos"). Lista de produtos com selos de inteligência (crescimento %, recompra, reposição) em vez de preço em destaque. |
| 7 | **Ficha de Decisão — Detalhe do Produto** | Hero image, bloco "Por que comprar este produto" (checklist) ANTES da grade/tamanho — inversão proposital da hierarquia tradicional de e-commerce. Banner de reposição recomendada. Grade sugerida (seletor de tamanhos pré-marcado). Botões: "Planejar" (secundário) / "Adicionar ao carrinho" (primário). |
| 8 | **Planejamento da Compra — Mix Sugerido** | Barra de mix por categoria (proporção visual). 3 tiles de estatística (giro previsto, margem estimada, cobertura). Lista de itens do mix com stepper de quantidade. Botões "Ajustar mix" / "Enviar ao carrinho". |
| 9 | **Meus Pedidos — Lista de Carrinhos** | Cada pedido é um carrinho independente. Lista com nome do pedido, status (rascunho / aguardando representante / aprovado), valor, representante vinculado, última atualização. CTA "Criar novo pedido". |
| 10 | **Carrinho (Pedido)** — *ponto de convergência com representante* | Seletor de pedidos (tabs). Banner "Compartilhado com [representante]". Linhas do carrinho editáveis. Nota de atividade tipo chat (comentário do representante). Checklist "Antes de fechar" (mix balanceado, categorias sub-representadas). Resumo financeiro. Sidebar persistente (tablet/desktop) com total, margem, sugestões. |
| 11 | **Pagamento e Entrega** | Condição de pagamento (chips), endereço de entrega, prazo estimado, nota fiscal/contrato. Botões "Voltar ao carrinho" / "Confirmar pedido". |
| 12 | **Pedido Confirmado** | Tela de sucesso: ícone de check em círculo preto, número do pedido, valor total, prazo estimado. Botões "Voltar ao radar" / "Acompanhar pedido". |
| 13 | **Acompanhamento do Pedido** — *ponto de convergência com representante* | Timeline vertical de status (confirmado → em produção → enviado → entregue), com data prevista em cada etapa. Dados de transportadora/rastreio. Nota indicando que o representante também acompanha em tempo real. |
| 14 | **Pós-venda — Radar de Fidelização** | Mesmo padrão visual do Radar Comercial, mas para a carteira de consumidores finais do lojista. Insight cards: aniversariantes, clientes sumidos (90+ dias sem compra), produto mais recomprado. Lista segmentada de clientes. CTA "Enviar campanha personalizada". |

---

## 5. Fluxo do REPRESENTANTE (ordem de construção)

| # | Tela | O que precisa existir |
|---|------|------------------------|
| 0.1 | **Seleção de Perfil** | Mesma tela da seção 4 — reaproveitar componente, não duplicar. |
| 0.3 | **Login — Representante** | E-mail, senha, "esqueci minha senha", botão "Entrar", link cruzado para login do lojista. Sem opção de login social. |
| 0.4 | **Quem Está Usando Agora** | Lista de pessoas vinculadas à conta: titular (badge "Titular", avatar preto) + auxiliares (badge "Auxiliar", avatar cinza). Opção "+ Adicionar auxiliar". Essa etapa existe porque **a conta do representante é compartilhada com auxiliares da equipe**, e cada ação no sistema precisa ficar atribuída à pessoa certa, não genericamente à conta. |
| 0.5 | **Confirmar PIN do Auxiliar** | Só aparece se um auxiliar (não o titular) foi selecionado na tela anterior. Avatar da pessoa, PIN numérico de 4 dígitos (teclado + indicadores de dígito preenchido), fallback "Esqueceu o PIN? Entrar como [titular]". O PIN é uma identificação leve — não substitui a senha principal da conta, só confirma quem está operando na sessão. |
| 5 | **Radar Comercial — Representante** (home) | Saudação. Pills de resumo (alta recompra / perderam volume / sem nova coleção). Lista de clientes priorizados por score, cada card com sugestão de ação e um CTA (ex: "Montar pedido sugerido", "Ligar agora", "Enviar coleção"). O cliente de maior oportunidade recebe contorno preto + tag "Oportunidade" (mesmo padrão do Radar do lojista). |
| 5a | **Carteira de Clientes** | Listagem completa da carteira do representante, com os mesmos indicadores usados no Radar (score de recompra, status), agora navegável/filtrável. |
| 5b | **Montar Pedido Sugerido** | A partir de um cliente da carteira, o sistema pré-monta um pedido baseado no histórico de compra daquele lojista. Mesma estrutura visual do Planejamento da Compra (seção 4, item 8), mas iniciado pelo representante em nome do cliente. |
| 10 | **Revisar / Aprovar Pedido** — *ponto de convergência com lojista* | Mesmo componente de Carrinho (Pedido) da seção 4, item 10 — agora com permissões de representante: pode comentar, ajustar itens, aprovar o pedido antes de seguir para produção. |
| 13 | **Acompanhar Pedido** — *ponto de convergência com lojista* | Mesmo componente de Acompanhamento (seção 4, item 13), com visão idêntica à do lojista (mesma timeline, mesmos dados de rastreio). |

---

## 6. Adaptação tablet (depois do mobile funcionar)

Ao portar cada tela para tablet, aplique estas transformações sistemáticas em vez de redesenhar do zero:

- **Navegação:** barra inferior de abas → rail lateral fixa de ícones.
- **Catálogo + Ficha de Decisão (itens 6 e 7):** viram uma única tela master-detail — lista de produtos à esquerda, detalhe do produto selecionado à direita, sem navegação entre elas.
- **Meus Pedidos + Carrinho (itens 9 e 10):** viram uma única tela — abas de pedido no topo, conteúdo do pedido selecionado + sidebar de resumo sempre visível ao lado.
- **Radar e Pós-venda (itens 4 e 14):** os insight cards saem do carrossel horizontal e viram uma grade (3 colunas), tudo visível sem scroll horizontal.
- **Telas de etapa única** (login, wizard de perfil, objetivo do momento, PIN, pagamento, confirmação): viram um cartão centralizado de largura fixa (440–560px) no meio da tela, em vez de esticado de ponta a ponta.
- **Ajustar Foco:** de bottom-sheet (mobile) para modal centralizado com scrim (tablet) — bottom-sheet é padrão de celular, não de tablet.
- **Marca:** mesma regra do mobile — só aparece no rodapé das telas de login, centralizada, discreta.

---

## 7. O que NÃO fazer

- Não usar preenchimento sólido de cor em cards inteiros para indicar prioridade — use contorno + tag pequena (ver item 4 do Radar). Preenchimento sólido colorido já foi testado e descartado por pesar demais visualmente.
- Não misturar o teclado de PIN com a senha principal da conta — são mecanismos diferentes.
- Não remover o bloco "Por que comprar este produto" do topo da Ficha de Decisão — é a inversão de hierarquia que diferencia este produto de um e-commerce comum.
- Não estilizar botões com substantivos ("Planejamento") — sempre verbo no imperativo ("Planejar").
