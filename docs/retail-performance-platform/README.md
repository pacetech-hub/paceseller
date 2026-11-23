# Retail Performance Platform — proposta e reconciliação com o Pace Seller

Esta pasta reúne a proposta "Retail Performance Platform" e um mapa de como ela se encaixa no app que já existe neste repositório. **Nada aqui mudou o código ainda.** O objetivo é decidir o que adotar antes de construir.

## Arquivos

| Arquivo | O que é |
|---|---|
| [`prompt-claude-code.md`](prompt-claude-code.md) | Prompt de construção: ordem das telas por persona (lojista e representante), tokens visuais, adaptação tablet e o que não fazer |
| [`product-design.md`](product-design.md) | Especificação funcional dos 5 módulos: Radar, Catálogo Inteligente, Planejamento da Compra, Sidebar de composição e Carrinho Inteligente |
| [`fluxo-login-onboarding-radar.md`](fluxo-login-onboarding-radar.md) | Handoff desktop: login, recuperação de senha, onboarding em 3 etapas e Radar do lojista |
| [`fluxo-catalogo.md`](fluxo-catalogo.md) | Handoff desktop: Catálogo, Ficha de Decisão e o mapa de decisão de compra até o pagamento |

Dois arquivos de product design chegaram juntos e eram idênticos, exceto por uma palavra na última linha. Ficou só um.

**Faltam na entrega:** os mockups citados pelo prompt (`telas/telas-mobile.html`, `telas/telas-tablet.html`, `telas/telas-retail-performance-platform-v7.html`, `telas-desktop-lojista-perfil.html`) e o diagrama `wireflow/wireflow.svg`. O prompt chama os mockups de "fonte da verdade visual", então nenhuma tela deve ser construída sem eles.

## Como ler a proposta junto do app atual

O Pace Seller já cobre a maior parte da jornada com as regras de [`src/imports/pasted_text/radar-spec.md`](../../src/imports/pasted_text/radar-spec.md) (BR-xx e FR-xxx abaixo vêm de lá). A proposta acrescenta telas novas e propõe outro visual. Ela também contradiz algumas regras que o spec atual já fechou.

Legenda: **Existe** = já no app · **Parcial** = existe com outra forma ou sem parte do que a proposta pede · **Falta** = não existe.

### Lojista

| # | Tela proposta | Status | Onde está hoje | O que falta |
|---|---|---|---|---|
| 0.1 | Seleção de perfil ("Sou lojista" / "Sou representante") | Não adotado | `LoginPage.tsx` tem um login só; o perfil vem do e-mail | Fica assim (C1) |
| 0.2 | Login do lojista | Parcial | `LoginPage.tsx` | "Esqueci minha senha" (0.2a/0.2b), "Entrar com Google", link para o login do representante |
| 1–3 | Perfil da loja em 3 etapas + Objetivo do momento | Em espera | Os dados da loja aparecem só em leitura em `ProfilePage.tsx` | Wizard inteiro, flag `perfil_completo`, progresso salvo a cada etapa |
| 4 | Radar do lojista | Existe | `RadarPage.tsx`, `data/radar.ts` | Nada: segue o spec (C2) e mantém o fundo por status (C3) |
| 4.1 | Ajustar foco | Não adotado | — | Mudaria a ordem do Radar definida no spec (C2) |
| — | Estado vazio do Radar com % do perfil | Parcial | `ui/EmptyState.tsx` existe; o Radar mostra "Nada pra hoje" por aba | Barra de progresso do perfil e "Enquanto isso" |
| 6 | Catálogo | Existe | `CatalogPage.tsx`, `CatalogFiltersBar.tsx` | Filtros já são os sinais do Radar (FR-202); falta só o chip "Recomendado p/ você" como ordenação padrão |
| 7 | Ficha de Decisão | Existe | Página inteira dentro de `CatalogPage.tsx` (antes era um modal): caminho Radar / Catálogo / produto, foto à esquerda e a decisão à direita — preço, "Por que comprar este produto", sinal do Radar, grade e "Como você quer seguir?"; `FichaTecnicaPage.tsx` é a ficha técnica | "Por que comprar" (FR-303) já vem antes da grade, como a proposta pede. Nada a fazer: o CTA "Planejar" sai junto com o Planejamento (8) |
| 8 | Planejamento da Compra (mix sugerido) | Não adotado | O aviso de mix em `CartDrawer.tsx` e `CartPage.tsx` (`mixCheck`) continua | **Decidido: fora do escopo.** A compra segue Catálogo → grade → carrinho ativo |
| 9 | Meus Pedidos (lista de carrinhos) | Existe | `CartsListPage.tsx` | — |
| 10 | Carrinho compartilhado | Existe | `CartPage.tsx`, `data/cartStore.ts`: abas por carrinho, comentários, "Antes de fechar", ação por status | Ver conflito C4 sobre a ordem enviar / confirmar / pagar |
| 11 | Pagamento e Entrega | Parcial | Bloco de pagamento dentro de `CartPage.tsx` | Tela própria com endereço, prazo, nota fiscal e contrato |
| 12 | Pedido confirmado | Existe | `CartPage.tsx` ("Pedido confirmado") | Conferir CTAs: "Voltar ao radar" / "Acompanhar pedido" |
| 13 | Acompanhamento do pedido | Existe | `OrderDetailPage.tsx`: botão "Ver detalhes" ao lado do status abre a linha do tempo recebido → aprovado → em produção → faturado e enviado → entregue, com transportadora e rastreio | Transportadora e rastreio são mock até existir integração |
| 14 | Pós-venda: Radar de fidelização (consumidor final) | Existe (mock) | `PosVendaPage.tsx`, `data/posVenda.ts`, no menu do lojista: cartões de sumidos (90+ dias), aniversariantes (30 dias) e produto mais recomprado; lista por segmento (Todos, Aniversariantes, Sumidos, Fiéis, Novos) com busca; campanha personalizada por WhatsApp ou e-mail com {nome} e prévia; quem não autorizou contato fica de fora | Os clientes são mock. Falta decidir a fonte (CRM / PDV da loja, "store CRM" no spec) e o envio real |

### Representante

| # | Tela proposta | Status | Onde está hoje | O que falta |
|---|---|---|---|---|
| 0.3 | Login do representante | Parcial | Mesmo `LoginPage.tsx` | Mesmas pendências do 0.2, sem login social |
| 0.4 | Quem está usando agora | Existe | `WhoIsUsingPage.tsx`, depois do login do representante: titular (entra direto) e prepostos ativos de `data/linkedUsers.ts`; "Adicionar preposto" abre Permissões como titular; "Trocar usuário" no menu da conta volta para cá | Comentários do carrinho já saem no nome de quem opera. Outras ações (edições, aprovações) ainda saem no nome do titular |
| 0.5 | PIN do auxiliar | Existe | Mesmo componente: teclado numérico e teclado físico, erro ao errar, "Esqueceu o PIN? Entrar como [titular]" | PIN de demonstração 1234 para todos; falta o cadastro de PIN por preposto em Permissões |
| 5 | Radar do representante | Existe | `RepRadar.tsx`, `data/repRadar.ts`. Novo layout: "N lojas precisam de atenção"; "Aguardando você" (pedidos para confirmar, com "Aprovar todos"); "Oportunidade na carteira" (produto em alta que lojas da carteira não têm, com "Sugerir pras N lojas" por grade); "Carteira" loja por loja com o próximo passo e filtro Todas / Hoje / 15 dias / 30 dias. Os motivos de contato C-01 a C-09 continuam os mesmos | A oportunidade na carteira é mock (produto e lojas fixos) até integrar o sell-in por loja |
| 5a | Carteira de clientes | Existe | `ClientsPage.tsx`, `ClientDetailPage.tsx` | Mostrar o score de recompra na lista |
| 5b | Montar pedido sugerido | Em espera | O rep já cria carrinho para o cliente | Sem o Planejamento, seria um carrinho já preenchido a partir do histórico do cliente. Decidir se entra |
| 10 | Revisar / aprovar pedido | Existe | `CartPage.tsx` com `viewerRole` 'rep' ("Confirmar condições") | — |
| 13 | Acompanhar pedido | Existe | `OrderDetailPage.tsx` | Mesma linha do tempo do lojista |

O spec atual também tem Radar da **indústria**, Estúdio de Marketing, Sell-out, Estoque, Boletos e Suporte, que a proposta não cobre. Nada disso sai.

## Conflitos a decidir

Cada item abaixo é uma regra que a proposta e o app atual resolvem de formas opostas.

**Regra geral (decidida): o [`radar-spec.md`](../../src/imports/pasted_text/radar-spec.md) não muda.** Onde ele já define a regra, a proposta se adapta a ele. A proposta só entra onde o spec não fala nada.

| # | Tema | Proposta | Hoje no app / spec | Recomendação |
|---|---|---|---|---|
| C1 | Entrada | O usuário escolhe "Sou lojista" ou "Sou representante" antes do login | Um login só; o servidor sabe o perfil (`e72572c`: todo perfil cai no Radar) | **Decidido: um login só.** O e-mail define o perfil; a tela 0.1 não será construída. "Esqueci minha senha" e "Entrar com Google" (lojista) entram no formulário único |
| C2 | Radar do lojista | Carrossel de insight cards e "Painel do dia" com 4 categorias | Abas por prazo (Hoje / 15 / 30 dias), grade ordenada por severidade, "Destaque da semana" em preto (FR-103 a FR-107) | **Decidido: o spec vale.** Abas por prazo, grade por severidade e Destaque da semana ficam como estão. Sem carrossel, sem Painel do dia e sem "Ajustar foco" no Radar |
| C3 | Cor no card | Contorno + tag pequena; preenchimento colorido "testado e descartado" | Fundo do card na cor do status (`f29cf37`) | **Decidido: fica o fundo na cor do status**, como hoje. O estilo de contorno da proposta não é adotado |
| C4 | Adicionar sem grade | "Repor agora" e "Adicionar ao carrinho" no card adicionam direto, com grade padrão | BR-20: todo caminho de compra passa pela grade de numeração | **Decidido: o spec vale.** Todo caminho de compra passa pela grade (BR-20), já preenchida quando há sinal (BR-21) |
| C5 | Fechar o pedido | "Enviar para aprovação" e "Confirmar" lado a lado | Uma ação por status: envia ao rep → rep confirma condições → lojista paga (FR-603) | **Decidido: o spec vale.** Uma ação por status: envia ao rep → rep confirma condições → lojista paga |
| C6 | Margem | Vários números ("Margem estimada 42%", "38%", "39%") | Uma métrica: "Margem 39% no PDV sugerido" (BR-03) | **Decidido: o spec vale.** Uma margem só, "Margem X% no PDV sugerido" (BR-03), também nas telas novas |
| C7 | Preço | Duas linhas, com e sem imposto (IBS/CBS) | "Seu custo" e "PDV sugerido" (BR-01, BR-02) | **Decidido: o spec vale.** "Seu custo" e "PDV sugerido"; o "Seu custo" informa se inclui impostos e frete (BR-01). Sem segunda linha de preço |
| C8 | Visual | Space Grotesk / IBM Plex, preto e branco 60/30/10, cantos de 4px | Mantine + Roboto, tema em `src/mantine/theme.ts` (fases 6 e 7 de revisão de UI) | **Decidido: o visual da proposta não é adotado.** O app segue o próprio tema, hoje gerado dos tokens do Figma (`design-tokens/`): marca na família Zinc, botões e seleções em Zinc 900 (`brand.9`), fonte Geist. Os tons 50–950 dos tokens viram os índices 0–10 do Mantine |
| C9 | Marca | Logo só no rodapé do login | Logo no menu do header (`2bfdec1`) | **Decidido: logo no cabeçalho**, à esquerda do menu, levando ao Radar |
| C10 | Navegação | Barra inferior no mobile, rail lateral no tablet | Menu em grade de apps (`AppsGridMenu.tsx`) em todos os tamanhos | **Decidido: menu clássico, nem grade de apps nem barra inferior.** Páginas em linha no cabeçalho; as que não cabem vão para "Mais". Perfil, Permissões/Administração, Suporte e Sair ficam no menu da conta. No celular, tudo fica numa gaveta aberta pelo ícone ☰. O título da página desce para uma faixa abaixo do menu. **Sem "Meus carrinhos" no menu, de propósito:** há um só ícone de carrinho no cabeçalho, que abre o carrinho ativo; outros carrinhos abertos continuam editáveis quando escolhidos como ativo ("Vai para: … · trocar"). O BR-70 do spec não muda; o app só não o segue neste ponto |

## Ordem sugerida para construir

Pelas telas que faltam e pelo que cada uma destrava:

O Planejamento da Compra (8) e o CTA "Planejar" da Ficha (7) não entram. O "Ajustar foco" (4.1) também não, pelo C2.

1. ~~**Acompanhamento com linha do tempo (13)**~~ — feito.
2. ~~**Quem está usando + PIN (0.4, 0.5)**~~ — feito.
3. **Onboarding (1–3)** — em espera.
4. ~~**Pós-venda (14)**~~ — feito com dados mock.
5. **Montar pedido sugerido (5b)** — em espera.

## Pendências herdadas da proposta

A própria proposta lista o que ainda não foi desenhado e não deve ser inventado: OAuth Google, mensagens de erro de formulário, tela "criar nova senha", critério do estado vazio do Radar, fórmula do "Mix ideal", combinação de filtros, alíquota por produto, integração com o sistema de vendas e o breakpoint de tablet do Radar.
