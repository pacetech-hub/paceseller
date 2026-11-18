# Retail Performance Platform — Product Design dos 5 Módulos

> Baseado na visão: a plataforma é o "cérebro" da relação Indústria ↔ Representante ↔ Lojista. Cada módulo abaixo segue o princípio central do briefing: **não mostrar dados, mostrar decisões.**

**Personas consideradas:**
- **Indústria** (gestor de marca/trade marketing)
- **Representante** (vendedor externo, carteira de clientes)
- **Lojista** (comprador da loja multimarca)

---

## 1. Radar Comercial

O feed principal da plataforma. Substitui a home tradicional de "produtos" por uma home de "oportunidades". É o módulo que aparece primeiro no app, todos os dias.

### 1.1 Tela: Radar do Lojista

**Estrutura da tela (mobile-first, mas replicável em web):**

```
┌─────────────────────────────────┐
│  Bom dia, Carlos 👋              │
│  Sua loja está saudável.         │
│  5 oportunidades hoje ↓          │
├─────────────────────────────────┤
│ [Cards horizontais scrolláveis]  │
│ 🔴 Estoque baixo · Linha Street  │
│ 🟢 Alta demanda · Tênis Vulc.    │
│ 🟡 Oportunidade perdida · Fem.   │
│ 🔵 Lojas similares venderam X    │
├─────────────────────────────────┤
│ Reposição necessária (3)         │
│ Lançamentos (2)                  │
│ Produtos em alta (6)             │
│ Alertas (1)                      │
├─────────────────────────────────┤
│ [CTA] Ver Planejamento de Compra │
└─────────────────────────────────┘
```

**Funcionalidades:**
- **Cards de insight priorizados** por impacto financeiro estimado (R$ em risco / R$ em oportunidade), não por data.
- Cada card tem **1 ação direta**: "Repor agora", "Ver coleção", "Adicionar ao planejamento" — nunca só informativo.
- **Severidade visual** por cor (vermelho = risco, verde = oportunidade, azul = benchmark/comparação com pares).
- Toque no card → abre o produto/coleção já dentro do contexto do insight (ex: "Estoque baixo" abre o produto com a sugestão de quantidade de reposição pré-calculada).
- **Comparação com lojas similares** (mesmo porte/região) — anonimizada, tipo "lojas parecidas com a sua venderam 30% mais deste modelo".

### 1.2 Tela: Radar do Representante

```
┌─────────────────────────────────┐
│  Bom dia, Ana                    │
│  Sua carteira hoje:              │
├─────────────────────────────────┤
│ 🎯 4 clientes · alta prob. recompra│
│ ⚠️  2 clientes · perderam volume │
│ 📦 6 clientes · sem nova coleção │
│ 📈 Radical Skate pode +18%       │
├─────────────────────────────────┤
│ [Lista priorizada de clientes]   │
│ Radical Skate    🎯 92% recompra │
│  → Sugestão: pedido de R$ 4.200  │
│ Loja Vertex      ⚠️ -22% volume  │
│  → Sugestão: ligar hoje          │
├─────────────────────────────────┤
│ [CTA] Iniciar visita / pedido    │
└─────────────────────────────────┘
```

**Funcionalidades:**
- **Priorização automática da carteira** (score de propensão à recompra, calculado por histórico + sazonalidade).
- Cada cliente do radar já vem com uma **ação sugerida** (visitar, ligar, montar pedido, enviar coleção).
- Ao abrir um cliente, o representante já vê o **pedido sugerido pré-montado** (ver módulo 3), pronto para ajustar.
- Filtros: por região, por urgência, por potencial de valor.

### 1.3 Tela: Radar da Indústria

```
┌─────────────────────────────────┐
│  Bom dia. Nesta semana:          │
├─────────────────────────────────┤
│ 📈 Coleção Urban  +12%           │
│ 📉 Coleção Classic -8% (Nordeste)│
│ 🏆 Sul converteu 24% a mais      │
│ 👁 320 lojistas não viram lançto │
├─────────────────────────────────┤
│ [Mapa de calor por região]       │
│ [Ranking de representantes]      │
│ [Funil: visualizou → comprou]    │
├─────────────────────────────────┤
│ [CTA] Disparar campanha de       │
│       ativação para os 320       │
└─────────────────────────────────┘
```

**Funcionalidades:**
- **Alertas de desvio de performance** (queda regional, coleção estagnada) com causa provável sugerida.
- **Funil de ativação de lançamento**: quantos representantes viram → compartilharam → quantos lojistas viram → compraram — com ação de disparo de campanha direto do card.
- Ranking de representantes por conversão, não só por volume (para identificar quem precisa de apoio, como o briefing pede).

**Componente compartilhado nas 3 telas:** *Insight Card* — mesmo padrão visual (ícone de severidade, uma frase, um número, um CTA), muda só o conteúdo por persona. Isso dá consistência ao "cérebro único" da plataforma.

---

## 2. Catálogo Inteligente

O catálogo deixa de ser uma vitrine e vira uma **ferramenta de decisão**. Cada produto responde perguntas, não só exibe atributos.

### 2.1 Tela: Listagem do Catálogo

```
┌─────────────────────────────────┐
│ [Busca]  [Filtros ▾]  [Ordenar ▾]│
│ Ordenar por: "Recomendado p/você"│
├─────────────────────────────────┤
│ ┌───────┐ Tênis Street Pro       │
│ │ foto  │ ✓ Vendendo acima média │
│ │       │ ✓ +18% crescimento     │
│ └───────┘ ✓ Reposição em 45 dias │
├─────────────────────────────────┤
│ ┌───────┐ Sandália Feminina X    │
│ │ foto  │ ⚠ Oportunidade perdida │
│ │       │   na sua loja          │
│ └───────┘                        │
└─────────────────────────────────┘
```

**Funcionalidades:**
- **Ordenação padrão "Recomendado para você"** (não "mais recente" nem "A-Z") — baseada no perfil de compra da loja.
- Cada card mostra até **3 selos de inteligência** (crescimento, recompra, margem, giro, indicação de reposição) em vez de preço/SKU em destaque.
- **Filtros inteligentes**: "Produtos que combinam com meu mix atual", "Alto giro", "Boa margem", "Novidades da sua região".

### 2.2 Tela: Detalhe do Produto ("Ficha de Decisão")

```
┌─────────────────────────────────┐
│      [Foto do produto]           │
├─────────────────────────────────┤
│ Tênis Street Pro                 │
│ ─────────────────────────────    │
│ 📊 Por que comprar este produto  │
│ ✓ Vendendo acima da média (+18%) │
│ ✓ Alta recompra (72% recompram)  │
│ ✓ Indicado p/ lojas especializ.  │
│ ✓ Margem estimada: 42%           │
│ ✓ Giro previsto: 38 dias         │
│ 📦 Reposição recomendada: 45 dias│
├─────────────────────────────────┤
│ Grade / Cor / Tamanho             │
│ [Seletor de grade sugerida]      │
├─────────────────────────────────┤
│ [Adicionar ao Planejamento]      │
│ [Adicionar ao Carrinho]          │
└─────────────────────────────────┘
```

**Funcionalidades:**
- Bloco **"Por que comprar"** fixo no topo, acima da grade/cor/tamanho — inverte a hierarquia tradicional de e-commerce.
- **Grade sugerida automaticamente** (curva de tamanhos baseada no histórico de venda do lojista ou de lojas similares), editável.
- Comparação opcional: "Como este produto performa vs. outros da mesma categoria que você já vende".
- Espaço de **colaboração** (módulo 3 do briefing): representante e lojista podem comentar o produto ali mesmo — comentários, aprovação de pedido, "sugerido pelo representante Ana".

---

## 3. Planejamento da Compra

O módulo mais estratégico. Em vez de comprar item a item, o lojista monta uma "missão de compra" e a plataforma monta o mix.

### 3.1 Tela: Iniciar Planejamento

```
┌─────────────────────────────────┐
│ O que você quer planejar?        │
├─────────────────────────────────┤
│ ○ Coleção de Inverno             │
│ ○ Reposição de estoque           │
│ ○ Categoria específica           │
│ ○ Orçamento livre                │
├─────────────────────────────────┤
│ Investimento disponível          │
│ [R$ ______ ] slider              │
├─────────────────────────────────┤
│         [Gerar sugestão]         │
└─────────────────────────────────┘
```

### 3.2 Tela: Sugestão de Mix (resultado do planejamento)

```
┌─────────────────────────────────┐
│ Plano: Coleção de Inverno        │
│ Investimento: R$ 18.000          │
├─────────────────────────────────┤
│ Mix sugerido                     │
│ ▓▓▓▓▓▓▓▓░░ Calçados 60%          │
│ ▓▓▓░░░░░░░ Acessórios 25%        │
│ ▓░░░░░░░░░ Vestuário 15%         │
├─────────────────────────────────┤
│ Giro previsto: 42 dias           │
│ Margem estimada: 39%             │
│ Cobertura de grade: 92%          │
├─────────────────────────────────┤
│ [Lista de produtos do mix]       │
│  Tênis Street Pro   qtd: 24      │
│  Bota Urban          qtd: 12     │
│  [ajustar quantidade -/+]        │
├─────────────────────────────────┤
│ [Ajustar mix] [Enviar ao Carrinho]│
└─────────────────────────────────┘
```

**Funcionalidades:**
- Algoritmo sugere **mix, grade, investimento, giro previsto e margem estimada** de uma vez — como pede o briefing.
- Edição em tempo real: ao mudar a quantidade de um item, os indicadores (giro, margem, cobertura) recalculam na hora.
- **Cenários alternativos**: "Mix mais conservador" vs. "Mix mais agressivo em lançamentos" — comparáveis lado a lado.
- Planejamento pode ser **compartilhado com o representante** para validação antes de virar pedido (ponte com o pilar "Construir relacionamento").
- Histórico de planejamentos anteriores, com resultado real vs. previsto (fecha o loop de aprendizado do pilar 5).

---

## 4. Sidebar de Composição do Pedido

Painel persistente (lateral em desktop, drawer/bottom sheet expansível em mobile) que acompanha o usuário em Catálogo, Planejamento e Carrinho, narrando a composição do pedido em tempo real.

```
┌───────────────────────┐
│ Seu pedido             │
│ ─────────────────────  │
│ 18 itens · R$ 14.200    │
│ ─────────────────────  │
│ 💬 "Você está a R$800   │
│ de ganhar frete grátis" │
│                         │
│ 💬 "Margem média do     │
│ pedido: 38% — 3 pts     │
│ acima do seu histórico" │
│                         │
│ 💬 "Faltam itens da     │
│ categoria feminina no   │
│ seu mix"                │
│ ─────────────────────  │
│ [Ver sugestões (3)]     │
│ [Ir para o carrinho]    │
└───────────────────────┘
```

**Funcionalidades:**
- **Resumo financeiro sempre visível**: itens, valor total, margem média estimada, giro médio do pedido — atualiza a cada item adicionado/removido.
- **Mensagens narrativas contextuais** (não só números): a sidebar "fala" com o usuário, gerando 1 a 3 insights por vez, priorizados por relevância no momento (ex: perto de atingir frete grátis, desequilíbrio de mix, item parado no radar sendo ignorado).
- **Sugestões acionáveis** dentro da própria sidebar: "Adicionar 2 itens da categoria feminina" com botão de 1 clique, sem sair da tela atual.
- Estado colapsado (mobile): mostra só total + 1 insight principal; expandido: histórico completo de mensagens da sessão.
- É o elemento que **conecta** Catálogo, Planejamento e Carrinho — mesma composição de pedido acumulando em todos.

---

## 5. Carrinho Inteligente

Aqui a inteligência já aconteceu (Radar, Catálogo, Planejamento). O carrinho apenas **executa** — mas ainda revisa e otimiza antes da confirmação.

```
┌─────────────────────────────────┐
│ Revisão do pedido                │
├─────────────────────────────────┤
│ Tênis Street Pro   qtd 24  R$... │
│ Bota Urban          qtd 12  R$...│
│ [editar / remover]               │
├─────────────────────────────────┤
│ 🔎 Antes de fechar:               │
│ ✓ Mix balanceado                 │
│ ⚠ Categoria feminina sub-representada│
│   [+ Adicionar 4 itens sugeridos]│
├─────────────────────────────────┤
│ Resumo                           │
│ Subtotal        R$ 14.200        │
│ Desconto/escala R$ -320          │
│ Total            R$ 13.880       │
│ Margem estimada  38%             │
├─────────────────────────────────┤
│ Condição de pagamento [▾]        │
│ Prazo de entrega estimado        │
├─────────────────────────────────┤
│ [Enviar para aprovação do        │
│  representante] / [Confirmar]    │
└─────────────────────────────────┘
```

**Funcionalidades:**
- **Checklist de qualidade do pedido** antes de fechar (mix balanceado, cobertura de grade, itens esquecidos do planejamento) — última chance de a inteligência intervir.
- Simulação de **descontos por escala/quantidade** em tempo real conforme o pedido cresce.
- **Fluxo de aprovação**: pedido pode ir para o representante aprovar/ajustar antes de seguir para pagamento (fecha o pilar "Construir relacionamento" dentro do fluxo de execução).
- Pagamento e prazo de entrega tratados como **etapas finais simples** — sem novas decisões de mix aqui, só logística.
- Ao confirmar, o pedido retorna ao **Radar** (representante e indústria) como dado que realimenta o aprendizado contínuo — fechando o pilar 5.

---

## Como os módulos se conectam

```
Radar Comercial  →  identifica a oportunidade
      ↓
Catálogo Inteligente  →  explica por que comprar
      ↓
Planejamento da Compra  →  monta o mix ideal
      ↓
Sidebar  →  acompanha e orienta em tempo real (em paralelo aos 3 acima)
      ↓
Carrinho Inteligente  →  revisa, valida e executa
      ↓
volta para o Radar como novo dado (aprendizado contínuo)
```

Esse ciclo fechado é o que torna a proposta "cérebro do ecossistema" tangível em produto: cada módulo entrega uma decisão pronta para o próximo, e o resultado de cada pedido realimenta o Radar da próxima vez que o usuário abrir o app.
