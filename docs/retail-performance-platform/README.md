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
| 1–3 | Perfil da loja em 3 etapas + Objetivo do momento | Falta | Os dados da loja aparecem só em leitura em `ProfilePage.tsx` | Wizard inteiro, flag `perfil_completo`, progresso salvo a cada etapa |
| 4 | Radar do lojista | Existe | `RadarPage.tsx`, `data/radar.ts` | Nada: segue o spec (C2) e mantém o fundo por status (C3) |
| 4.1 | Ajustar foco | Não adotado | — | Mudaria a ordem do Radar definida no spec (C2) |
| — | Estado vazio do Radar com % do perfil | Parcial | `ui/EmptyState.tsx` existe; o Radar mostra "Nada pra hoje" por aba | Barra de progresso do perfil e "Enquanto isso" |
| 6 | Catálogo | Existe | `CatalogPage.tsx`, `CatalogFiltersBar.tsx` | Filtros já são os sinais do Radar (FR-202); falta só o chip "Recomendado p/ você" como ordenação padrão |
| 7 | Ficha de Decisão | Existe | Página de produto dentro de `CatalogPage.tsx`; `FichaTecnicaPage.tsx` é a ficha técnica | "Por que comprar" (FR-303) já vem antes da grade, como a proposta pede. Só o CTA "Planejar" falta, e depende do Planejamento (8) |
| 8 | Planejamento da Compra (mix sugerido) | Falta | Só o aviso de mix em `CartDrawer.tsx` e `CartPage.tsx` (`mixCheck`) | Módulo inteiro: tela inicial, mix por categoria, giro, margem, cobertura e quantidade por item |
| 9 | Meus Pedidos (lista de carrinhos) | Existe | `CartsListPage.tsx` | — |
| 10 | Carrinho compartilhado | Existe | `CartPage.tsx`, `data/cartStore.ts`: abas por carrinho, comentários, "Antes de fechar", ação por status | Ver conflito C4 sobre a ordem enviar / confirmar / pagar |
| 11 | Pagamento e Entrega | Parcial | Bloco de pagamento dentro de `CartPage.tsx` | Tela própria com endereço, prazo, nota fiscal e contrato |
| 12 | Pedido confirmado | Existe | `CartPage.tsx` ("Pedido confirmado") | Conferir CTAs: "Voltar ao radar" / "Acompanhar pedido" |
| 13 | Acompanhamento do pedido | Parcial | `OrderDetailPage.tsx` mostra status, mas não uma linha do tempo | Linha do tempo confirmado → produção → enviado → entregue, transportadora e rastreio |
| 14 | Pós-venda: Radar de fidelização (consumidor final) | Falta | — | Base de clientes finais da loja (CRM), que hoje não existe. O spec atual lista "store CRM" como fonte a decidir |

### Representante

| # | Tela proposta | Status | Onde está hoje | O que falta |
|---|---|---|---|---|
| 0.3 | Login do representante | Parcial | Mesmo `LoginPage.tsx` | Mesmas pendências do 0.2, sem login social |
| 0.4 | Quem está usando agora | Falta | Os usuários vinculados existem em `data/linkedUsers.ts` (titular + prepostos) e são geridos em `AccessPermissionsPage.tsx` | Tela de escolha após o login e registro da pessoa em cada ação |
| 0.5 | PIN do auxiliar | Falta | — | PIN de 4 dígitos por preposto, separado da senha da conta |
| 5 | Radar do representante | Existe | `RadarPage.tsx`, `data/repRadar.ts`: prioridades de contato C-01 a C-09, já com "Pós-venda" (C-08) | Fica como está ("Ver cliente" / "Revisar carrinho"); o Radar não muda |
| 5a | Carteira de clientes | Existe | `ClientsPage.tsx`, `ClientDetailPage.tsx` | Mostrar o score de recompra na lista |
| 5b | Montar pedido sugerido | Falta | O rep já cria carrinho para o cliente | Pré-montagem a partir do histórico do cliente; depende do Planejamento (8) |
| 10 | Revisar / aprovar pedido | Existe | `CartPage.tsx` com `viewerRole` 'rep' ("Confirmar condições") | — |
| 13 | Acompanhar pedido | Parcial | `OrderDetailPage.tsx` | Mesma linha do tempo do lojista |

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
| C8 | Visual | Space Grotesk / IBM Plex, preto e branco 60/30/10, cantos de 4px | Mantine + Roboto, tema em `src/mantine/theme.ts` (fases 6 e 7 de revisão de UI) | **Decidido: fica o visual atual** (Mantine + Roboto). As telas novas seguem o tema existente |
| C9 | Marca | Logo só no rodapé do login | Logo no menu do header (`2bfdec1`) | **Decidido: logo no cabeçalho**, à esquerda do menu, levando ao Radar |
| C10 | Navegação | Barra inferior no mobile, rail lateral no tablet | Menu em grade de apps (`AppsGridMenu.tsx`) em todos os tamanhos | **Decidido: menu clássico, nem grade de apps nem barra inferior.** Páginas em linha no cabeçalho; as que não cabem vão para "Mais". Perfil, Permissões/Administração, Suporte e Sair ficam no menu da conta. No celular, tudo fica numa gaveta aberta pelo ícone ☰. O título da página desce para uma faixa abaixo do menu |

## Ordem sugerida para construir

Pelas telas que faltam e pelo que cada uma destrava:

1. **Planejamento da Compra (8)**. É o módulo central da proposta e o único inteiramente novo da jornada de compra. Destrava o "Montar pedido sugerido" do representante (5b) e o CTA "Planejar" da Ficha.
2. **Ficha de Decisão (7)**: subir "Por que comprar" e adicionar o CTA "Planejar".
3. **Onboarding + Objetivo do momento + Ajustar foco (1–3, 4.1)**, um só componente `GoalCard`.
4. **Acompanhamento com linha do tempo (13)**, compartilhado entre lojista e representante.
5. **Quem está usando + PIN (0.4, 0.5)**, sobre os `linkedUsers` que já existem.
6. **Pós-venda (14)**, depois de decidir a fonte de dados dos clientes finais.

## Pendências herdadas da proposta

A própria proposta lista o que ainda não foi desenhado e não deve ser inventado: OAuth Google, mensagens de erro de formulário, tela "criar nova senha", critério do estado vazio do Radar, fórmula do "Mix ideal", combinação de filtros, alíquota por produto, integração com o sistema de vendas e o breakpoint de tablet do Radar.
