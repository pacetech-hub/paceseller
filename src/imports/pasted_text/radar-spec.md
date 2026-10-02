# Radar — Final Functional Spec (Lojista)

Oct 1, 2026 · @Martin

This is the consolidated spec for Radar in the Tesla Skate lojista app. It replaces the analysis doc: every contradiction found there is resolved here as a rule. Values marked **default** are recommended starting points the business must confirm (see Parameters to confirm).

## Version A: Executive summary

**Radar is the decision engine of the app, not only its home screen.** It reads sales, stock, orders, peer data and carts, decides one recommendation per product, and shows it wherever the lojista acts: Radar, Catálogo, product page, cart and orders.

### The journey Radar supports

1. **See** what needs action on Radar, grouped by when to act.
2. **Decide** in the Catálogo and product page, with the same signal and the reason behind it.
3. **Build** the order by size grade, prefilled with Radar's suggested quantity.
4. **Close** the cart with Ana, the store's representative, and compare with last year before paying.
5. **Follow** the order in Pedidos, with Radar warning about delays.

### Rules adopted to fix what the screens contradicted

| Topic | Before (in the screens) | Adopted rule |
| --- | --- | --- |
| Margin | Five figures: 38%, 39%, 40%, 42%, 45%; "+39% sobre a fábrica" mislabeled | One metric: margin on suggested retail price, labeled "Margem 39% no PDV sugerido" |
| One product, one advice | TG II: "repor 60" and "giro baixo" at once | The engine picks one primary signal per SKU by a fixed priority |
| Urgency | Coil urgent today on Radar, "26 dias" on product page | One act-by date per signal, shown the same everywhere |
| Store health | "Saudável" above red alerts | Three levels driven by open critical alerts |
| Size grade | Some add paths skip sizes | Every add goes through the size grade, prefilled with the suggestion |
| Minimum order | A cart confirmed with 6 of 36 pairs | No cart is sent or confirmed below the minimum without a recorded exception |
| Closing the order | "Ir para pagamento" and "Enviar pro representante" side by side | One action per status: send to Ana, Ana confirms, lojista pays |
| Combos | "Estoque parado" combo pushes a product stuck in the store | Combos never include a SKU with low turnover in the store |

### Value

- **For the brand:** more sell-in from restock, launch and opportunity signals, and a rep channel built into the cart.
- **For the lojista:** fewer stockouts, less dead stock, one trusted margin, and orders built in fewer steps.
- **For the rep:** a shared cart to suggest, edit and confirm orders, with Radar context.

### Decisions to sign off

- [ ] Data sources in scope for v1: sell-in, store stock, sell-out, peer data, store CRM
- [ ] The adopted margin formula and label
- [ ] The order flow: send to rep, rep confirms, lojista pays
- [ ] Minimum grade of 36 pairs per order, and who can approve exceptions
- [ ] Default thresholds in the signal catalog
- [ ] Out of v1 unless data is confirmed: "Recuperar clientes" and store repurchase figures

## Version B: How Radar runs through the app

Radar decides once and every screen reads the same result. The lojista moves down the journey; each step shows the Radar signal that matters there and one action that leads to the next step.

&#91;embedded content: Radar across the lojista journey · 1 engine, 6 steps\]

Pedidos closes the loop: a delivered order updates store stock, and the engine resolves the restock signals it created. The data sources behind the engine are sell-in and orders, store stock, sell-out, peer stores, launch calendar and carts; store CRM is out of v1.

## Global business rules

These rules apply to every screen. A module may display them differently, but never calculate them differently. Each rule has an ID so stories and tests can reference it.

### Pricing and margin

| ID | Rule |
| --- | --- |
| BR-01 | "Seu custo" is the lojista's buying price per pair (replaces the label "fábrica"). It states whether taxes and freight are included. |
| BR-02 | "PDV sugerido" is the brand's suggested retail price per pair. |
| BR-03 | Margin = (PDV sugerido − Seu custo) ÷ PDV sugerido. Label: "Margem 39% no PDV sugerido". Coil Denim: (460 − 280) ÷ 460 = 39%. |
| BR-04 | Markup is not shown on cards. If needed, it appears only in a tooltip as "Markup +64% sobre o custo". |
| BR-05 | "Margem real na sua loja" may appear as a second figure only when sell-out prices exist, labeled with its base ("preço médio de venda na sua loja"). |
| BR-06 | Cart margin = weighted margin of its lines by value. It is hidden when the cart has 0 items. |
| BR-07 | A payment discount (e.g. à vista) is shown on each affected line as old price, new price and percentage. |

### Stock, restock and suggested quantity

| ID | Rule |
| --- | --- |
| BR-10 | Coverage (days) = store stock ÷ average daily sales over the last 30 days. |
| BR-11 | Lead time = delivery time of the order (today "Entrega em 15 dias úteis"). It is shown on the product page, drawer and cart. |
| BR-12 | Low stock when coverage ≤ lead time + safety margin (**default** 7 days). |
| BR-13 | Suggested quantity = daily sales × (lead time + target coverage, **default** 45 days) − store stock − pairs in transit − pairs already in open carts. Rounded to the order multiple. |
| BR-14 | The suggested quantity is split by size using the store's sales curve by size; with too little history, the regional curve. The curve used is stated. |
| BR-15 | Restock is never suggested for a SKU whose turnover is below expected (BR-31 wins). |

### Size grade and minimum order

| ID | Rule |
| --- | --- |
| BR-20 | Every add-to-cart path (Radar, Catálogo, product page, drawer, combo, "Adicionar 4 itens") goes through the size grade. |
| BR-21 | When a Radar signal exists for the SKU, the grade opens prefilled with the suggested quantity by size, fully editable. |
| BR-22 | Each size shows available pairs. Sold-out sizes can't be selected; quantities above availability are blocked. |
| BR-23 | Minimum order = 36 pairs per cart (**default**, confirm if per brand or collection). |
| BR-24 | A cart below the minimum can't be sent or confirmed. A rep exception needs a reason, is logged and shows "Exceção aprovada por Ana". |

### Signals, priority and conflicts

| ID | Rule |
| --- | --- |
| BR-30 | One engine calculates every signal. All screens read the same result for the same SKU, order or cart. |
| BR-31 | One primary signal per SKU. Priority: Pedido atrasado > Estoque baixo > Sem giro > Giro baixo > Alta demanda > Oportunidade perdida > Lançamento > Benchmark. |
| BR-32 | Contradictory signals can't coexist: a SKU with Sem giro or Giro baixo can't have Estoque baixo, Alta demanda or "Mais vendida". |
| BR-33 | "Mais vendida" appears only on the top 3 SKUs by network sales in the last 30 days (**default**). |
| BR-34 | Every growth figure states scope and period: "+31% na sua região, últimos 30 dias". Collection growth is secondary context only. |
| BR-35 | Combos never include a SKU with Sem giro or Giro baixo in the store. A combo to move brand stock is labeled "Oferta da marca". |
| BR-36 | Suggestions exclude SKUs already in the target cart, or say "adicionar mais N pares". |

### Buckets, timing and store health

| ID | Rule |
| --- | --- |
| BR-40 | Each signal has an act-by date: the last day to act and still get the result (for stock: stockout date − lead time). |
| BR-41 | Buckets are exclusive and based on the act-by date: Hoje (today or overdue), Em 15 dias (1 to 15 days), Nos próximos 30 dias (16 to 30 days). |
| BR-42 | Time is always written in words: "acaba em 12 dias", "lançado há 28 dias", "2 dias de atraso", "agir até 14/10". |
| BR-43 | Critical signals: Pedido atrasado, and Estoque baixo with act-by date today or overdue. |
| BR-44 | Store health: Saudável = 0 critical open; Atenção = 1 or 2 critical; Em risco = 3 or more critical. The headline color follows the level. |

### Signal lifecycle

| ID | Rule |
| --- | --- |
| BR-50 | A signal resolves automatically when its action happens (pairs added to a cart that is sent, order delivered). It shows "Resolvido" for 24 h, then leaves Radar. |
| BR-51 | The lojista can dismiss a signal (with a reason) or snooze it for 7, 15 or 30 days. Reasons are stored to tune the rules. |
| BR-52 | Counts in the header, filters and notification badge always match the visible open signals. |

### Data and trust

| ID | Rule |
| --- | --- |
| BR-60 | Every signal shows when its data was last updated ("Atualizado há 2h"). |
| BR-61 | Refresh (**default**): orders and carts in real time; store stock and sell-out daily; peer data weekly. |
| BR-62 | A signal type whose data source isn't integrated for the store isn't shown. Missing data is never shown as zero. |
| BR-63 | Peer group ("lojas parecidas") = same region, size band and price positioning, minimum 5 stores (**default**). Peer data is always aggregated and anonymous. |

### Roles and permissions

| Action | Lojista | Representante (Ana) |
| --- | --- | --- |
| See Radar of the store | Yes | Yes, read only (**default**) |
| Create a cart | Yes | Yes, as a suggestion (starts in "Aguardando você") |
| Edit a cart | Yes | Only when "Ana pode editar este carrinho" is on; each edit notifies the lojista |
| Send cart to rep | Yes | — |
| Confirm commercial conditions | — | Yes |
| Approve minimum-grade exception | — | Yes, with reason |
| Pay | Yes | — |
| Comment | Yes | Yes |

### Naming and navigation

| ID | Rule |
| --- | --- |
| BR-70 | Top-level nav: Radar, Catálogo, Meus carrinhos, Pedidos, all enabled and styled the same. |
| BR-71 | The catalog is called "Catálogo" everywhere (nav, title, breadcrumb). |
| BR-72 | Breadcrumbs start at the module (Catálogo / Coil Denim). Coming from Radar, a "← Voltar ao Radar" link keeps the context. |
| BR-73 | Product name pattern everywhere: Tênis Tesla + line + colorway ("Tênis Tesla Hertz Black Gold"). |
| BR-74 | One verb per action across banner, card and detail: Ver (inspect), Repor (buy a suggestion), Enviar pro representante, Revisar e aprovar, Ir para pagamento, Acompanhar. |

## Radar signal catalog

Radar has 13 signal types in v1, each with one trigger, one wording pattern and one action. Color follows severity, not signal type: red = Crítico, amber = Atenção, green = Oportunidade, blue = Informação. Black is reserved for the Destaque da semana.

### Definitions

| ID | Signal | Severity | Trigger (default) | Card wording pattern (illustrative values) | CTA → destination |
| --- | --- | --- | --- | --- | --- |
| S-01 | Pedido atrasado | Crítico | Delivery forecast date passed | "Pedido #4790-1 · 2 dias de atraso" | Ver pedido → Order detail |
| S-02 | Estoque baixo | Crítico if act-by is today, else Atenção | BR-12 | "Linha Coil · acaba em 12 dias · agir até 14/10 · repor 32 pares" | Repor agora → Product page, grade prefilled |
| S-03 | Sem giro | Atenção | Stock > 0 and no sales in the last 30 days | "Tênis Tesla Flow XL Black · sem vendas há 30 dias" | Ver produto → Product page, "Como girar" block |
| S-04 | Giro baixo | Atenção | Sales below 70% of expected since launch | "TG II Black Reflect · lançado há 28 dias · giro 40% abaixo do esperado" | Ver produto → Product page |
| S-05 | Alta demanda | Oportunidade | Regional sales +20% or more in the last 30 days | "Fusion Black Red · +34% na sua região, últimos 30 dias" | Ver produto → Product page |
| S-06 | Produtos em alta | Oportunidade | Group of 2+ SKUs with S-05 | "6 SKUs vendendo acima da média" | Ver todos → Catálogo, filter Alto giro |
| S-07 | Oportunidade perdida | Oportunidade | Sold by 50% or more of the peer group in the last 90 days, never bought by the store | "Coil Off White Furta Cor · vende em 7 de 10 lojas parecidas" | Ver produto → Product page |
| S-08 | Lançamento | Oportunidade | Launched in the last 60 days and not in the store mix | "Linha Fusion · lançada há 12 dias · 6 lojas parecidas já compram" | Ver coleção → Catálogo, filter by collection |
| S-09 | Benchmark | Informação | Peers sold 20% or more of a SKU than the store in the last 30 days | "Coil Black White · lojas parecidas venderam 30% mais" | Comparar → Product page, benchmark block |
| S-10 | Fechamento | Informação | Open carts with at least 1 item | "2 carrinhos abertos · compare com o ano passado antes de fechar" | Ver carrinhos → Meus carrinhos |
| S-11 | Aguardando você | Atenção | Cart in "Aguardando você"; Atenção after 3 days | "Ana sugeriu Coil Verão · esperando sua revisão há 9 dias" | Revisar e aprovar → Cart detail |
| S-12 | Abaixo do ano passado | Informação | SKU in a cart with fewer pairs than the same period last year | "Hertz Black · 24 pares vs. 34 no ano passado" | Igualar ano passado → Grade with +10 pairs |
| S-13 | Mix desbalanceado | Informação | A category's share in the cart is below the store profile target | "Feminino abaixo do ideal pro seu perfil" | Ver sugestões → Preview of items with grade |

**Out of v1:** "Recuperar clientes" and store repurchase figures ("72% recompram") need the store's CRM or POS customer data. They return only if that integration is confirmed (BR-62).

**Destaque da semana:** the highest-impact S-05 or S-07 for the store profile, recalculated weekly. It follows BR-03 for margin and BR-34 for growth, and never repeats a card already in the current bucket.

### Where each signal appears

| Signal | Radar card | Catálogo tag | Catálogo filter | Product page | Drawer suggestion | Cart "Antes de fechar" | Pedidos | Notification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S-01 Pedido atrasado | Yes | — | — | — | — | — | Yes | Yes |
| S-02 Estoque baixo | Yes | Yes | Reposição necessária | Yes, with grade prefilled | Yes | — | — | If Crítico |
| S-03 Sem giro | Yes | Yes | Sem giro | Yes | Never | — | — | — |
| S-04 Giro baixo | Yes | Yes | Giro baixo | Yes | Never | — | — | — |
| S-05 Alta demanda | Yes | Yes | Alto giro | Yes | Yes | — | — | — |
| S-06 Produtos em alta | Yes | — | Alto giro | — | — | — | — | — |
| S-07 Oportunidade perdida | Yes | Yes | Oportunidade perdida | Yes | Yes | — | — | — |
| S-08 Lançamento | Yes | Yes | Lançamentos | Yes | Yes | — | — | — |
| S-09 Benchmark | Yes | — | Benchmark: lojas parecidas | Yes | — | — | — | — |
| S-10 Fechamento | Yes | — | — | — | — | — | — | — |
| S-11 Aguardando você | Yes | — | — | — | — | — | — | Yes |
| S-12 Abaixo do ano passado | — | — | — | — | — | Yes | — | — |
| S-13 Mix desbalanceado | — | — | — | — | Yes | Yes | — | — |

## Module specs: Radar, Catálogo, Product page, Drawer

Each module lists its functional requirements (FR) and the rules it applies. Signal values shown in examples are illustrative.

### M1. Radar (home)

Purpose: show what needs action, grouped by when to act, with one next step per item.

| ID | Functionality | Rules |
| --- | --- | --- |
| FR-101 | Greeting and store health headline (Saudável / Atenção / Em risco) with matching color | BR-44 |
| FR-102 | Total open signals: "11 pendências · 2 críticas" | BR-52 |
| FR-103 | Bucket filters with counts: Hoje, Em 15 dias, Nos próximos 30 dias; Hoje selected by default | BR-41, BR-52 |
| FR-104 | Card grid ordered by severity, then act-by date, then impact (R$) | BR-31, BR-40 |
| FR-105 | Card anatomy: icon, eyebrow (signal · time in words), hero metric, subject, one context line, optional suggestion, one CTA, "Atualizado há" | BR-42, BR-60, BR-74 |
| FR-106 | Card menu: Por que isso aparece, Adiar (7/15/30 dias), Dispensar (with reason) | BR-51 |
| FR-107 | Destaque da semana banner, compact height, rotates weekly | Signal catalog |
| FR-108 | Every CTA lands with its context applied (filter, prefilled grade, open cart) | BR-21, BR-72 |

States: loading (card skeletons), empty bucket ("Nada pra hoje" + link to the next bucket with items), partial row (cards keep width), more than 8 cards ("Ver todas"), source error (affected cards hidden, banner "Alguns dados não carregaram"), resolved (24 h then removed).

### M2. Catálogo

Purpose: browse and filter products with the Radar signal and the margin on every card.

| ID | Functionality | Rules |
| --- | --- | --- |
| FR-201 | Search by name, line or SKU code | — |
| FR-202 | Filter groups with labels: Sinais do Radar (Alto giro, Reposição necessária, Lançamentos, Oportunidade perdida, Benchmark, Giro baixo, Sem giro, Boa margem), Faixa de preço (Seu custo: até R$ 249,99 · R$ 250 a R$ 319,99 · R$ 320 ou mais), Coleção, Numeração | Signal catalog |
| FR-203 | Active filters shown as removable chips, result count, "Limpar filtros" | — |
| FR-204 | Product card: image, name + colorway, colorway swatches, Seu custo, PDV sugerido, margin tag, primary Radar signal tag, availability, "Adicionar" | BR-03, BR-31, BR-33, BR-73 |
| FR-205 | "Adicionar" opens the size grade sheet, prefilled when a signal exists | BR-20, BR-21 |
| FR-206 | Combos: only SKUs without S-03/S-04 in the store; each item added by grade; discount shown per item | BR-35, BR-20 |
| FR-207 | Products without image can't be published | — |

"Boa margem" = margin at or above the catalog average + 2 points (**default**). With every product at 39% to 40%, this filter is hidden until margins differ.

### M3. Product page

Purpose: explain why to buy and build the order by size.

| ID | Functionality | Rules |
| --- | --- | --- |
| FR-301 | Header: category · line · SKU code, name, gallery with zoom, colorway switcher | BR-73 |
| FR-302 | Price block: Seu custo, PDV sugerido, "Margem 39% no PDV sugerido"; optional "Margem real na sua loja" with base | BR-03, BR-05 |
| FR-303 | "Por que comprar": only data-backed reasons from the engine, each with scope and period | BR-30, BR-34 |
| FR-304 | Radar signal block: same signal, act-by date and suggested quantity as the Radar card | BR-30, BR-40 |
| FR-305 | Size grade: total pairs input, "Distribuir" (states the curve), "Preencher sugestão", cells per size with availability, legend | BR-14, BR-21, BR-22 |
| FR-306 | Order summary under the grade: pairs, value (pairs × Seu custo), lead time | BR-11 |
| FR-307 | Target cart selector ("Vai para: Coleção Inverno · trocar") and "Adicionar ao carrinho" | — |
| FR-308 | "Sobre o produto": description, materials, size chart | — |
| FR-309 | Confirmation after add: toast with cart name, new totals and "Ver carrinho" | — |

Validation: "Adicionar ao carrinho" stays enabled; with 0 pairs it shows "Selecione ao menos 1 par".

### M4. Add-to-cart drawer

Purpose: a quick view of the target cart from anywhere, with suggestions to complete it.

| ID | Functionality | Rules |
| --- | --- | --- |
| FR-401 | Opens from the header cart icon; header icon shows the number of open carts | — |
| FR-402 | Shows the target cart's real totals: pairs, value, margin (hidden at 0 items) | BR-06 |
| FR-403 | Target cart selector with "trocar" and "Criar novo carrinho" | — |
| FR-404 | Minimum grade progress of the target cart ("54/36 pares") | BR-23 |
| FR-405 | Ideal mix progress and free-shipping gap, only with items and with base stated | BR-06 |
| FR-406 | Suggestions to complete the mix: S-02, S-05, S-07, S-08, S-13; never SKUs with S-03/S-04 or already in the cart | BR-35, BR-36 |
| FR-407 | "+" on a suggestion opens the grade sheet prefilled | BR-20, BR-21 |
| FR-408 | Primary action "Ver carrinho"; adds happen from the grade sheet | — |

## Module specs: Meus carrinhos and cart detail

Carts are shared between the lojista and Ana. An order closes in a fixed sequence: the lojista sends the cart, Ana confirms the commercial conditions, the lojista pays. This removes the two competing closing paths seen in the screens.

### Adjusted status flow

"Aguardando pagamento" is the new state that orders the steps: payment opens only after Ana confirms.

&#91;embedded content: Adjusted cart status flow · 6 states, lojista and rep\]

Green states are where the lojista can move the order forward; amber is where it stalls and Radar raises S-11.

| Status | Who acts | Primary action (only one) | Enters when | Leaves when |
| --- | --- | --- | --- | --- |
| Rascunho | Lojista | Continuar montando | Cart created by the lojista | Reaches the minimum grade |
| Pronto pra enviar | Lojista | Enviar pro representante | 36+ pairs (BR-23) | Sent manually or by auto-send |
| Aguardando Ana | Ana | Falar com Ana (secondary) | Sent | Ana confirms, or edits |
| Aguardando você | Lojista | Revisar e aprovar | Ana built or edited the cart | Lojista approves (back to Aguardando Ana) |
| Aguardando pagamento | Lojista | Ir para pagamento | Ana confirmed conditions | Payment done |
| Confirmado | — | Acompanhar | Payment done | Moves to Pedidos immediately |

A cart below the minimum never moves past Rascunho, except with a logged exception from Ana (BR-24). Removing items from a ready cart sends it back to Rascunho if it drops below 36 pairs.

**Envio automático:** when on, a cart in "Pronto pra enviar" is sent to Ana automatically at 18h (**default**) on the day it reaches the minimum, unless edited in the last 2 hours. The cart card shows "Envio automático hoje às 18h".

### M5. Meus carrinhos (list)

| ID | Functionality | Rules |
| --- | --- | --- |
| FR-501 | Header: open carts count, rep name, "Criar novo carrinho" | — |
| FR-502 | KPIs: Carrinhos abertos (excludes confirmed), Aguardando você, Prontos pra enviar, Valor em andamento (R$) | BR-52 |
| FR-503 | Banners for S-11 (Aguardando você) and ready carts, using the same action names as the cards | BR-74 |
| FR-504 | Status filters with counts: Todos, Rascunho, Pronto pra enviar, Aguardando Ana, Aguardando você, Aguardando pagamento | BR-52 |
| FR-505 | Cart card: name, rep, last update, thumbnails, status, progress (pairs / 36), value, one primary action, auto-send state with time, last comment | — |
| FR-506 | Card click opens the cart detail; no separate "Abrir" button | — |
| FR-507 | Confirmed carts leave the list and appear in Pedidos | — |

### M6. Cart detail

| ID | Functionality | Rules |
| --- | --- | --- |
| FR-601 | Cart tabs to switch carts, plus "+ Novo carrinho" | — |
| FR-602 | Sharing bar: who sees the cart; toggle "Ana pode editar este carrinho" | Roles table |
| FR-603 | Order header: status, payment terms, lead time, one primary action | BR-11, BR-74 |
| FR-604 | Lines: product, unit price, pairs per size (expandable), line value, discount if any, edit grade, remove | BR-07, BR-20 |
| FR-605 | Subtotal, minimum grade status, cart margin | BR-06, BR-23 |
| FR-606 | "Antes de fechar": S-12 last-year comparison per SKU with "Igualar ano passado"; S-13 mix check with preview of suggested items | Signal catalog |
| FR-607 | Comments thread with reply; each rep edit appears in the thread | Roles table |
| FR-608 | Payment step (in Aguardando pagamento): choose terms (30/60/90 dias) or à vista with discount; split between methods allowed; discount recalculated per line before confirming | BR-07 |
| FR-609 | Sidebar keeps collaboration only: Falar com Ana, comments, "Salvar e sair"; totals appear once, in the main area | — |

### Design notes for carts

- Status colors follow severity: Aguardando você in amber, Pronto pra enviar and Aguardando pagamento in green, others neutral.
- The progress bar shows pairs against the minimum; past 36 it stays full and the label shows the real count ("54 pares · mínimo 36").

## Module specs: Pedidos and Notificações

No Pedidos screen was provided; these requirements come from what Radar and carts already promise ("Ver pedido", "Acompanhar", late-order alert). The designer should treat this module as a first draft.

### M7. Pedidos

| ID | Functionality | Rules |
| --- | --- | --- |
| FR-701 | Order list: number, cart name, date, pairs, value, status, delivery forecast | — |
| FR-702 | Statuses: Confirmado, Em separação, Faturado, Em trânsito, Entregue, Atrasado | — |
| FR-703 | Late order: original and new forecast, days late, reason when known, "Falar com Ana" | S-01 |
| FR-704 | Order detail: lines with pairs per size, payment terms and installments, invoices, tracking | BR-07 |
| FR-705 | Delivered orders resolve their stock signals and update coverage on the next refresh | BR-50, BR-61 |
| FR-706 | "Repetir pedido" creates a new cart in Rascunho with the same grade | BR-20 |

### M8. Notificações

| ID | Functionality | Rules |
| --- | --- | --- |
| FR-801 | Bell badge = open Crítico signals + carts in "Aguardando você" | BR-43, BR-52 |
| FR-802 | Notification list grouped by Hoje and Anteriores; each item opens its CTA destination | BR-74 |
| FR-803 | Triggers: S-01 Pedido atrasado, S-02 Estoque baixo when Crítico, S-11 Aguardando você, Ana edited a cart, Ana commented, auto-send done | Signal catalog |
| FR-804 | Opening a notification marks it read; it doesn't resolve the signal | BR-50 |
| FR-805 | Settings: e-mail or push per trigger (**default**: all on for Crítico, in-app only for the rest) | — |

## Decision log

Every finding from the analysis maps to the rule or requirement that resolves it, so the team can trace why each rule exists.

| Finding (screen) | Decision | Ref |
| --- | --- | --- |
| TG II gets "repor 60" and "giro baixo" (Radar) | One primary signal per SKU; contradictory signals can't coexist | BR-31, BR-32 |
| "Sua loja está saudável" with red alerts (Radar) | Health level from open critical signals | BR-44 |
| "N dias" means stockout, launch or delay (Radar) | Time written in words; act-by date on every card | BR-40, BR-42 |
| 12-day stock in Hoje, 28-day launch in 15 dias (Radar) | Buckets by act-by date | BR-41 |
| "32 un." is both stock and suggestion (Radar) | Hero = situation; suggestion labeled as action | FR-105 |
| Restock ignores sizes (Radar) | Suggestion split by size curve; grade prefilled | BR-14, BR-21 |
| Same problem in green and red (Radar) | Color by severity | Signal catalog |
| Cards need store CRM data (Radar) | Out of v1 unless integrated | BR-62 |
| CTAs to missing screens: Comparar, Ver clientes (Radar) | Comparar opens product benchmark block; Ver clientes out of v1 | S-09 |
| "+39% sobre a fábrica" is margin, not markup (Catálogo, product page) | One margin formula and label | BR-03, BR-04 |
| Five margins: 38%, 39%, 40%, 42%, 45% (all screens) | Same formula everywhere; second figure only with its base | BR-03, BR-05, BR-06 |
| "Mais vendida" on every card (Catálogo) | Top 3 only | BR-33 |
| Combo pushes a product stuck in the store (Catálogo) | Combos exclude S-03/S-04; brand-stock offers labeled | BR-35 |
| Growth without scope; product vs. collection (Catálogo, product page) | Scope and period always stated | BR-34 |
| Filters unlabeled, overlapping price bands (Catálogo) | Grouped filters, non-overlapping bands on Seu custo | FR-202, FR-203 |
| Radar CTA loses context in the catalog (Catálogo) | CTAs land with filter or grade applied | FR-108 |
| Restock "em 26 dias" vs. urgent today (product page) | Same signal and act-by date everywhere | BR-30, FR-304 |
| Distribuir curve unknown; darker size headers unexplained (product page) | Curve stated; availability per size with legend | BR-14, BR-22, FR-305 |
| No order value, lead time or availability (product page) | Order summary under the grade | FR-306 |
| "Ir para pagamento" vs. "Enviar pro representante" (cart) | Fixed sequence with "Aguardando pagamento" | M5–M6 status flow |
| Confirmed with 6/36 pairs (cart list) | No progress below minimum without logged exception | BR-24 |
| Drawer shows 0/36 for a 54-pair cart (drawer) | Drawer shows the target cart's real totals | FR-402, FR-404 |
| Drawer "+" skips the grade (drawer) | "+" opens the grade sheet | FR-407 |
| Hertz Rose suggested while already in cart (drawer) | Suggestions exclude cart SKUs | BR-36 |
| Margin, mix and shipping shown at 0 items (drawer) | Hidden until there are items | BR-06, FR-405 |
| Auto-send on but cart not sent (cart list) | Auto-send trigger and time defined and shown | Envio automático rule |
| "Carrinhos abertos" counts a confirmed cart (cart list) | Confirmed carts move to Pedidos; KPIs redefined | FR-502, FR-507 |
| Terms, split payment and cash discount mixed (cart detail) | Payment step after Ana confirms; discount per line | FR-608, BR-07 |
| Same action with two names (banners, cards) | One verb per action | BR-74 |
| Catálogo under Radar in breadcrumb; two names for the catalog | Module breadcrumbs; one name | BR-71, BR-72 |
| "Pedidos" looks disabled | All nav items enabled and styled the same | BR-70 |
| Floating icon buttons overlap content (all screens) | Remove from the build; not part of the product | — |

## Parameters to confirm and acceptance criteria

All parameters below must be configurable by the business without a release. The defaults let design and development start now.

### Parameters

| Parameter | Default | Ref | Owner to confirm |
| --- | --- | --- | --- |
| Safety margin for low stock | 7 days | BR-12 | Commercial |
| Target coverage after restock | 45 days | BR-13 | Commercial |
| Order multiple (pairs) | 1 (confirm if boxes of 6 or 12) | BR-13 | Logistics |
| Minimum order | 36 pairs per cart | BR-23 | Commercial |
| "Mais vendida" | Top 3, network, 30 days | BR-33 | Marketing |
| Alta demanda threshold | +20% regional, 30 days | S-05 | Commercial |
| Giro baixo threshold | Below 70% of expected curve | S-04 | Commercial |
| Oportunidade perdida | 50% of peer group, 90 days | S-07 | Commercial |
| Lançamento window | 60 days | S-08 | Marketing |
| Benchmark threshold | Peers +20%, 30 days | S-09 | Commercial |
| Peer group minimum | 5 stores | BR-63 | Legal / data |
| Store health levels | 0 / 1–2 / 3+ critical | BR-44 | Product |
| Auto-send time | 18h, no edit in last 2 h | Envio automático | Commercial |
| Free-shipping threshold | To define (per cart) | FR-405 | Logistics |
| Cash discount (à vista) | To define, % per line | BR-07 | Finance |
| Seu custo includes taxes and freight | To define | BR-01 | Finance |
| Rep can see store Radar | Read only | Roles | Commercial |

### Global acceptance criteria

1. For the same SKU, Radar, Catálogo, product page, drawer and cart show the same signal, act-by date, suggested quantity and margin.
2. No SKU shows two contradictory signals at the same time.
3. Margin uses BR-03 on every screen and is labeled with its base.
4. Every add-to-cart path goes through the size grade, prefilled when a signal exists.
5. No cart passes Rascunho below the minimum grade without a logged exception.
6. Each cart status shows one primary action; payment opens only after Ana confirms.
7. Counts in headers, filters, KPIs and the bell always match the visible items.
8. Every signal shows its data update time, and signal types without data are hidden.
9. Time references are written in words and every card shows an act-by date.
10. Every Radar CTA opens its destination with the context applied.
11. Every signal can be dismissed or snoozed, and the reason is stored.
12. Text and status colors meet WCAG AA contrast; status is never shown by color alone.
13. Empty, loading, partial, error and resolved states exist for Radar, Catálogo, carts and Pedidos.
14. Confirmed carts appear in Pedidos and leave Meus carrinhos.
