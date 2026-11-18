# Retail Performance Platform — Fluxo de Usuário e Requisitos de Front-end
## Etapa: Catálogo Inteligente — Listagem + Ficha de Decisão — Perfil Lojista — Desktop/Web

> Este documento cobre as 2 telas novas desta leva (`telas-desktop-lojista-perfil.html`, frames 6 e 7) e — o foco principal pedido — como elas se conectam com o restante do produto: o que leva o usuário até aqui, o que ele encontra, e pra onde cada decisão dele aponta.

---

## 1. Por que este documento é diferente dos anteriores

Os documentos das etapas passadas (Login, Onboarding, Radar) descreviam telas isoladas. A partir daqui, cada módulo **precisa ser pensado como um elo de uma corrente de decisão de compra**, não como uma tela solta. O pedido específico foi: prestar atenção no *entre* — como os módulos se conectam, quais botões conduzem o usuário, quais elementos gráficos reforçam essa condução, e como cada tela empurra pra melhor compra possível.

Por isso, este documento tem uma seção nova (seção 2) que não existia nos anteriores: **o mapa de decisão de compra completo**, do perfil até o pagamento — mesmo que várias dessas telas ainda não tenham sido desenhadas. É o mapa que vai guiar a consistência de botões e nudges em todos os módulos que ainda vamos construir.

---

## 2. O mapa de decisão de compra (visão completa)

```
Perfil correto (onboarding)
        ↓
Radar Comercial ──── identifica a oportunidade
        ↓
Catálogo Inteligente ──── explora e compara produtos
        ↓
Ficha de Decisão ──── decide sobre 1 produto específico
        │
        ├──→ "Adicionar ao carrinho"        (compra direta e imediata)
        │
        └──→ "Adicionar ao planejamento"     (monta um mix completo antes de decidir quantidade)
                    ↓
              Planejamento da Compra
                    ↓
              "Enviar ao carrinho"

        [ de qualquer um dos dois caminhos acima, o item cai no ]
                    ↓
              Carrinho (Pedido)
                    │
        ┌───────────┼───────────────┬─────────────────┐
        ▼           ▼               ▼                 ▼
   "Continuar    "Salvar como   "Enviar para      "Editar/remover
   comprando"     rascunho"      representante"     itens"
   (volta pro     (pausa, fica   (compartilha para  (ajusta o que
   catálogo)      em Meus         aprovação —        já está no
                  Pedidos)        não fecha ainda)   carrinho)
        │                              │
        └──────────────┬───────────────┘
                        ▼
                  "Ir para pagamento"
                        ▼
                  Pagamento e Entrega
                        ▼
                  Pedido Confirmado
```

**Observações importantes sobre este mapa:**

- **Carrinho e Planejamento não são concorrentes — são dois pontos de entrada pro mesmo lugar.** Um lojista que já sabe exatamente o que quer usa "Adicionar ao carrinho" direto do produto. Um lojista que quer montar uma coleção inteira usa "Adicionar ao planejamento". Os dois convergem no Carrinho.
- **"Enviar para representante" não é o mesmo que "Finalizar pedido".** É uma ação intermediária — o pedido fica com status "aguardando aprovação" (já coberto no módulo de Carrinho multi-pedido desenhado anteriormente), o lojista pode continuar comprando ou editando enquanto isso.
- **"Salvar como rascunho" existe pra não perder trabalho.** Um lojista que monta um carrinho grande e é interrompido não deveria ter que recomeçar — isso já está contemplado na tela "Meus Pedidos" desenhada anteriormente, mas precisa ficar acessível **também** a partir da Ficha de Decisão e do Catálogo, não só de dentro do Carrinho.

---

## 3. Como o Catálogo e a Ficha de Decisão se conectam com o resto

### Chegando no Catálogo
- **A partir do Radar**: um card de insight (ex: "Alta demanda — Tênis Vulcanizado") leva direto pra Ficha de Decisão daquele produto específico, **não** pro Catálogo genérico. O Catálogo é alcançado pelo item de navegação do TopNav quando o lojista quer explorar por conta própria, sem uma recomendação específica de partida.
- O **breadcrumb** (`Radar / Catálogo Inteligente`) existe justamente pra deixar essa origem visível e permitir voltar sem usar o botão "voltar" do navegador.

### Dentro do Catálogo
- **Botão "Adicionar ao carrinho" no card** — sempre visível (não depende de hover), adiciona o item ao carrinho com a grade sugerida padrão, sem sair da listagem. É pensado pra lojista que já conhece o produto e não precisa da Ficha de Decisão pra decidir. Funciona como toggle: clicar de novo (agora "No carrinho ✓") remove o item.
- Clicar no nome/imagem do produto (fora da área do botão) leva pra Ficha de Decisão.

### Dentro da Ficha de Decisão
- O bloco final ("Como você quer seguir?") é a decisão central da tela — por isso fica **depois** do bloco "por que comprar" e da grade, não antes. A pessoa só decide depois de entender o produto.
- Os dois botões (Carrinho / Planejamento) têm uma frase de apoio embaixo explicando a diferença — esse é um texto que **precisa existir**, porque sem ele os dois botões parecem fazer a mesma coisa.

### O sidebar (presente em Catálogo, Ficha de Decisão, e futuramente Planejamento e Carrinho)
Esse painel é o elemento que **fisicamente conecta os módulos** — ele não muda de lugar quando o lojista navega entre Catálogo → Ficha de Decisão, dá a sensação de continuidade. Ele tem 3 blocos, nessa ordem:

1. **Resumo numérico** (itens, valor, margem) — sempre visível, sempre atualizado.
2. **Barra de progresso "Mix ideal pro seu perfil"** — elemento novo desta leva. É um indicador visual de quão perto o pedido atual está de um mix considerado ideal pra aquele perfil de loja (categoria balanceada, cobertura de grade, etc.). **A fórmula desse percentual é uma regra de negócio a ser definida com produto/dados** — o front deve tratar isso como um número que vem pronto da API, não calcular no cliente.
3. **Avisos (nudges)** — mensagens curtas, no máximo 2-3 por vez, priorizadas por relevância no momento. Já existiam desde o design original do Sidebar; nesta leva ficou mais explícito que eles devem **mudar de conteúdo conforme o contexto da tela** (no Catálogo, o nudge fala de "faltam X itens da categoria Y"; na Ficha de Decisão, o nudge é específico sobre aquele produto — "esse item já tem alta recompra na sua loja").

Os botões do sidebar (`Ir para o carrinho`, `Planejar compra`) são **os mesmos em toda tela onde o sidebar aparece** — isso é proposital, é o menu de saída consistente pra qualquer ponto da jornada de descoberta. **"Enviar para representante" foi removido do sidebar de Catálogo e Ficha de Decisão** — essa ação fica restrita ao módulo de Carrinho, onde o pedido já está formado o suficiente pra fazer sentido compartilhar.

---

## 4. Requisitos por tela

### Catálogo Inteligente — Listagem
- Grid de produtos: 3 colunas em 1440px (ajustar em breakpoints menores — ver observação de responsividade nos documentos anteriores).
- Cada card precisa saber seu próprio estado (`no carrinho` / `não no carrinho`) pra renderizar o botão correto — isso é estado por item, vindo da API junto com a listagem, não calculado no front. Botão persistente "Adicionar ao carrinho" (contorno) quando fora do carrinho; vira "No carrinho ✓" (verde, preenchido) quando já adicionado — **clicável nos dois estados**, clicar em "No carrinho" remove o item (funciona como toggle).
- O sidebar agora lista os itens reais do pedido (miniatura, nome, quantidade, valor), não só o resumo numérico. Cada item tem um ícone de remoção — **remover aqui precisa refletir instantaneamente** no botão correspondente do card na listagem (se o item removido está visível na grid, o botão dele volta pro estado "Adicionar ao carrinho"). Isso é um requisito de sincronização de estado entre o grid e o sidebar, não só uma ação isolada.
- Filtros (chips) e busca alteram a listagem — comportamento de filtro combinado (múltiplos chips ativos ao mesmo tempo? ou exclusivos?) **não foi definido nesta leva**, precisa validação com produto antes de implementar a lógica de filtro.
- Preço exibido: **os valores mostrados nos mockups são ilustrativos** — a tabela real varia por negociação/conta, a ser resolvida com o back-end (preço fixo vs. calculado por conta). Cada produto mostra duas linhas: valor **com imposto** e **sem imposto**, refletindo o novo modelo tributário brasileiro (reforma do IVA dual — IBS/CBS). O front não deve calcular a alíquota no cliente — os dois valores (com e sem imposto) vêm prontos da API, já que a alíquota efetiva pode variar por produto/estado durante o período de transição da reforma.

### Ficha de Decisão — Detalhe do Produto
- Os dois CTAs finais **não são mutuamente exclusivos nem sequenciais** — qualquer um pode ser clicado a qualquer momento, não há estado de "já escolhi um caminho, o outro desaparece".
- "Adicionar ao carrinho" aqui usa a grade sugerida já pré-marcada na tela (ver `sizechip.on`) — a quantidade default por tamanho é uma regra de negócio (provavelmente vinda de histórico de vendas) a confirmar.
- "Adicionar ao planejamento": se não existir nenhum planejamento em andamento, deve **criar um novo automaticamente** com este produto como primeiro item, não pedir pro lojista escolher/criar um planejamento manualmente nesse momento — fricção desnecessária.

---

## 5. Elementos gráficos que reforçam a condução (resumo)

| Elemento | Função |
|---|---|
| Breadcrumb | Mostra de onde o usuário veio, sem depender do botão voltar do navegador |
| Badge "Reposição 45d" / "Alto giro" / "Lançamento" no card | Comunica a razão de interesse sem precisar abrir o produto |
| Botão "Adicionar ao carrinho" persistente no card | Ação sempre visível, sem depender de hover — reduz ambiguidade sobre como comprar |
| Lista de itens no sidebar (com remoção) | O sidebar deixa de ser só um resumo e vira um mini-carrinho de fato navegável, sem precisar sair da tela |
| Sidebar persistente entre módulos | Dá sensação de continuidade — "meu pedido está sempre aqui, em qualquer tela" |
| Barra "Mix ideal" | Gamifica sutilmente a qualidade da decisão, não só a quantidade |
| Bubbles de nudge contextual | Empurra pra ação específica no momento certo, sem ser um pop-up interruptivo |
| Bloco "Como você quer seguir?" com legenda | Evita ambiguidade entre os dois caminhos possíveis (carrinho vs. planejamento) |

---

## 6. O que NÃO está coberto por esta etapa

- Lógica de combinação de filtros (chips múltiplos)
- Alíquota/regra exata de cálculo do imposto por produto (o front só exibe os dois valores prontos vindos da API)
- Fórmula de cálculo do "Mix ideal pro seu perfil" (regra de negócio pendente — mesma natureza da pendência do estado vazio do Radar, sinalizada no documento anterior)
- Tela do Planejamento da Compra em desktop (próxima desta leva, ainda não construída)
- Tela do Carrinho em desktop com os 4 destinos pós-carrinho (continuar comprando / salvar rascunho / enviar representante / editar) — o mapa da seção 2 antecipa esse comportamento, mas as telas específicas ainda serão desenhadas
