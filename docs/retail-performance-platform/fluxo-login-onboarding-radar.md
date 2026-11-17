# Retail Performance Platform — Fluxo de Usuário e Requisitos de Front-end
## Etapa: Login · Onboarding (Perfil da Loja) · Radar Comercial — Perfil Lojista — Desktop/Web

> Este documento cobre as 6 telas já validadas em alta fidelidade (`telas-desktop-lojista-perfil.html`). Serve como handoff para o time de front-end iniciar a implementação desta etapa.

---

## 1. Fluxo completo do usuário

```
                    ┌─────────────────────────┐
                    │  0.1 Seleção de Perfil   │
                    │  "Sou lojista" /         │
                    │  "Sou representante"     │
                    └────────────┬─────────────┘
                                 │ (clica "Sou lojista")
                                 ▼
                    ┌─────────────────────────┐
                    │  0.2 Login — Lojista     │
                    │  e-mail + senha          │
                    └────────────┬─────────────┘
                    erro ─────┐  │ sucesso
                    (volta    │  ▼
                    pro form) │  ┌──────────────────────┐
                              │  │ Perfil já completo?   │
                              │  └──────┬─────────┬──────┘
                              │      não│         │sim
                              │         ▼         ▼
                              │  ┌─────────────┐ ┌─────────────────┐
                              │  │ Onboarding  │ │  4. Radar        │
                              │  │ (3 etapas)  │ │  Comercial       │
                              │  └──────┬──────┘ │  (home)          │
                              │         │        └─────────────────┘
                              │         ▼                 ▲
                              │  ┌─────────────┐           │
                              │  │ 1. Dados    │           │
                              │  │ básicos     │           │
                              │  └──────┬──────┘           │
                              │         │ Continuar         │
                              │         ▼                  │
                              │  ┌─────────────┐           │
                              │  │ 2. Dados de │           │
                              │  │ vendas      │           │
                              │  └──────┬──────┘           │
                              │         │ Continuar         │
                              │         ▼                  │
                              │  ┌─────────────┐           │
                              │  │ 3. Objetivo │           │
                              │  │ do momento  │───────────┘
                              │  └─────────────┘  "Ir para o meu radar"
                              │
                              └── "Esqueci minha senha" → 0.2a (pedir e-mail) → 0.2b (confirmação de envio) → link no e-mail → [tela de nova senha, não desenhada]
```

**Pontos de decisão importantes:**

1. **Perfil incompleto vs. completo** — um lojista que já terminou o onboarding uma vez não deve vê-lo de novo no próximo login. O sistema precisa checar um estado (`perfil_completo: boolean` ou equivalente) logo após a autenticação e rotear direto pro Radar se já estiver completo.
2. **"Pular por agora"** (etapas 1 e 2 do onboarding) — o lojista pode pular dados básicos e dados de vendas, mas **não** a etapa 3 (objetivo do momento), que é obrigatória antes de entrar no Radar pela primeira vez. Se ele pular as etapas 1/2, o Radar deve funcionar com dados parciais (ver seção 3, "Estados vazios/parciais").
3. **"Conectar meu sistema de vendas"** (etapa 2) — fora do escopo desta fase de front-end; por enquanto, tratar como CTA que abre um fluxo de integração ainda não especificado (placeholder/"em breve" é aceitável para o primeiro release).
4. **"Ajustar foco"** (link no Radar) — não é navegação, é um modal/drawer que sobrepõe o Radar e, ao aplicar, re-ordena o conteúdo da própria tela sem reload de página.

---

## 2. Inventário de componentes (para o design system do front-end)

| Componente | Onde aparece | Variantes/estados necessários |
|---|---|---|
| `Button` | Todas as telas | `primary` (preto), `secondary` (contorno), tamanhos padrão; estados `default`, `hover`, `disabled`, `loading` |
| `TextInput` | Login, Onboarding | `default`, `focus`, `error`, `disabled`; variante `password` com toggle de visibilidade |
| `Chip` / `ChipGroup` | Onboarding (segmento, porte, categorias) | seleção única (`radio`) e múltipla (`checkbox`) — atenção: o mesmo componente visual serve pros dois comportamentos, o front precisa diferenciar por prop, não por CSS |
| `SelectRow` | Onboarding (região) | abre um dropdown/modal de seleção — comportamento de abertura não está especificado nesta leva de telas, tratar como select nativo estilizado por ora |
| `OptionCard` | Onboarding etapa 2 | estado `default` e `selected` |
| `GoalCard` | Onboarding etapa 3, drawer "Ajustar foco" | seleção única (comportamento de radio group visual) |
| `InsightCard` (`web-icard`) | Radar | 4 variantes de cor de barra lateral (`opportunity`/preto, `risk`/vermelho, `info`/azul, `positive`/verde) — a cor é *data-driven* (vem do tipo de insight retornado pela API), não fixa por posição |
| `StepRail` | Onboarding (trilho lateral) | 3 estados por item: `done`, `current`, `upcoming` |
| `TopNav` | Radar (e todas as telas autenticadas futuras) | precisa indicar item ativo; ícone de busca ainda sem funcionalidade definida nesta fase |
| `AvatarMenu` | Radar (clique no avatar do TopNav) | dropdown com nome + loja, "Meu perfil", "Configurações", "Minha loja", "Sair" (item de risco, cor vermelha); fecha ao clicar fora ou pressionar Esc |
| `EmptyState` | Radar (perfil incompleto / sem dados suficientes) | ícone, título, descrição, indicador de progresso do perfil (%), CTA único ("Completar meu perfil"); acompanhado de uma seção secundária ("Enquanto isso") com ações alternativas pra não deixar a tela morta |
| `PersonaCard` | Seleção de perfil | 2 instâncias fixas (lojista/representante) — não é dinâmico |

---

## 3. Requisitos por tela

### 0.1 Seleção de Perfil
- Rota pública (sem autenticação).
- 2 opções fixas, cada uma navega pra sua respectiva tela de login (`/entrar/lojista`, `/entrar/representante`).
- Sem lógica de negócio além da navegação.

### 0.2 Login — Lojista
- Campos: `email` (obrigatório, validação de formato), `senha` (obrigatório, mínimo de caracteres a definir com back-end).
- Botão "Entrar" fica `disabled` até os dois campos estarem preenchidos; ao submeter, mostra estado `loading` no botão.
- Erro de autenticação: exibir mensagem inline abaixo do campo de senha (não modal/toast) — **conteúdo desta mensagem ainda não foi desenhado nesta leva**, front-end deve reservar o espaço no layout mas o texto/tratamento visual do erro precisa voltar pra design antes do release.
- "Esqueci minha senha" — link para o fluxo de recuperação (ver subseção abaixo).
- "Entrar com Google" — OAuth, sem detalhamento de fluxo nesta leva; tratar como botão funcional a ser especificado.
- Após sucesso: checar `perfil_completo` e rotear conforme fluxo da seção 1.

### 0.2a / 0.2b Recuperação de Senha
- Etapa 1: campo `email` (obrigatório, mesma validação do login). Botão "Enviar link de recuperação" — ao submeter, **sempre** leva pra tela de confirmação (0.2b), independente de o e-mail existir ou não na base — isso é uma decisão de segurança padrão (evita que alguém descubra quais e-mails têm conta testando aqui), não um bug a corrigir.
- Etapa 2: tela de confirmação, mostra o e-mail pra onde foi enviado. "Reenviar e-mail" deve ter um cooldown (ex: 60s) pra evitar spam — o front precisa desabilitar o botão temporariamente após o clique, valor exato de cooldown a definir com back-end.
- O link recebido por e-mail leva pra uma tela de "criar nova senha" — **essa tela ainda não foi desenhada**, é a próxima peça óbvia a especificar antes do release.

### 1–3. Onboarding (Perfil da Loja)
- Rota autenticada, só acessível após login bem-sucedido.
- Estado do wizard (etapa atual, dados já preenchidos) deve persistir se o usuário atualizar a página ou sair e voltar antes de concluir — **salvar progresso incrementalmente**, não só no fim.
- Etapa 1 (Dados básicos): `nome_loja` (texto), `segmento` (multi-select), `porte` (single-select), `regiao` (select), `publico_alvo` (multi-select). Nenhum campo obrigatório pra avançar (permite "Pular por agora"), mas recomenda-se validação leve (ex: nome da loja não pode ser só espaços em branco, se preenchido).
- Etapa 2 (Dados de vendas): `ticket_medio` (numérico, formatado como moeda), `categorias_mais_vendidas` (multi-select), `sazonalidade` (multi-select). Também skippável.
- Etapa 3 (Objetivo do momento): `objetivo` (single-select, **obrigatório** — botão "Ir para o meu radar" só habilita com uma seleção feita). Esse valor deve ser regravável depois via "Ajustar foco", então o componente de seleção usado aqui é o mesmo (`GoalCard`) usado no drawer do Radar — **implementar como componente único reutilizado nos dois lugares**, não duplicar.

### 4. Radar Comercial
- Rota autenticada, home padrão pós-login/onboarding.
- **Insight cards são inteiramente data-driven**: quantidade, conteúdo, tipo (cor da barra) e ordem vêm da API — o layout de 4 colunas precisa lidar com: 0 insights (estado vazio — ainda não desenhado, sinalizar pro design), 1–4 insights (grid normal), mais de 4 (paginação ou "ver todos"? — **decisão de produto pendente, não assumir comportamento**).
- "Painel do dia" (4 tiles): mesma lógica — números vêm de API, tile deve navegar pra uma listagem filtrada ao clicar (a listagem em si ainda não foi desenhada nesta leva).
- Bloco "Destaque da semana": conteúdo curado/recomendado — **origem do dado (algoritmo vs. curadoria manual da indústria) precisa ser definida com produto antes de especificar o contrato de API**.
- "Ajustar foco": abre modal/drawer sobre a tela atual (ver componente `GoalCard`); ao confirmar, dispara re-fetch dos insights com o novo objetivo, sem reload de página.
- **Menu do avatar**: dropdown ancorado no canto superior direito, abre ao clicar no avatar-chip, fecha ao clicar fora ou `Esc`. Mostra nome do usuário + nome da loja no topo, depois "Meu perfil", "Configurações", "Minha loja", divisor, "Sair" (item de risco/vermelho). "Sair" deve invalidar a sessão e redirecionar pra 0.1 (Seleção de Perfil).
- **Estado vazio**: quando não há insights suficientes (perfil incompleto ou conta muito nova), o grid de 4 colunas é substituído por um bloco único de estado vazio — ícone, título, explicação do porquê (referenciando o que falta no perfil), uma barra de progresso do perfil (%) e um CTA único ("Completar meu perfil") que leva de volta pro onboarding na etapa que ficou pendente. Abaixo, uma seção "Enquanto isso" com 1-2 ações alternativas (ex: explorar catálogo, falar com representante) evita que a tela fique "morta" pro usuário novo. **Critério exato de quando mostrar este estado** (ex: perfil < X% completo, ou zero insights retornados pela API) precisa ser definido com produto/dados antes do release.
- Navegação do `TopNav` (Catálogo, Planejar, Pedidos, Clientes): os destinos dessas rotas **não fazem parte desta leva de telas** — o front pode implementar as rotas como links, mas as telas de destino serão especificadas em etapas futuras.

### 4.4 Conexões dos CTAs dos Insight Cards
Cada tipo de card do Radar tem um destino e um comportamento diferente ao clicar na sua ação — não tratar como um botão genérico de "saiba mais":

- **"Ver produto"** (cards tipo Oportunidade) → navega pra Ficha de Decisão do produto específico referenciado no card.
- **"Repor agora"** (cards tipo Estoque baixo) → **não navega**. Adiciona o item ao carrinho com a quantidade de reposição sugerida (já exibida no próprio card antes do clique, ex: "Sugestão: repor 32 unidades") e mostra um **toast de confirmação** no canto superior direito, sem sair do Radar. O card muda de estado inline (fundo levemente esverdeado, CTA vira "✓ Reposto"). Isso é intencional: forçar navegação a cada reposição quebraria o fluxo de quem está avaliando várias oportunidades na mesma sessão.
  - O toast **some automaticamente após alguns segundos** (a definir o tempo exato com produto — 4-6s é uma referência de mercado razoável pra esse tipo de confirmação, não é obrigatório manter até interação). Tem uma barra de progresso sutil na base indicando a contagem, e pode ser fechado manualmente antes disso.
  - O toast tem duas ações: "Ver carrinho" (navega) e "Ajustar quantidade" (abre edição da quantidade antes de confirmar — tela/modal ainda não desenhado).
  - Quantidade sugerida é uma regra de negócio (cálculo de giro vs. estoque atual) que vem pronta da API, o front não calcula.
- **"Comparar"** (cards tipo Benchmark) → navega pro Catálogo Inteligente, mas **filtrado pelo contexto do benchmark** (não é a listagem genérica). A tela mostra um banner de contexto no topo explicando o porquê do filtro estar ativo, com opção de "Limpar filtro" pra voltar à listagem completa.

### 4.5 Painel do Dia — modal de lista
Os 4 tiles do "Painel do dia" (Reposição necessária, Lançamentos, Produtos em alta, Alertas) são diferentes dos insight cards do topo: cada tile representa **uma categoria com vários itens dentro**, não uma recomendação única. Por isso, clicar em qualquer um deles abre o mesmo tipo de componente — um **modal de lista** — variando só o conteúdo:

- Cabeçalho: título da categoria + subtítulo explicando o critério (ex: "3 produtos estão vendendo mais rápido que sua reposição atual").
- Lista de itens: miniatura, nome, um dado de contexto (cobertura atual, data de lançamento, etc. — varia por categoria) e uma ação individual por linha. Pra "Reposição necessária", a ação é "Repor" (mesmo comportamento inline do card do topo — sem fechar o modal, o item muda de estado pra "✓ Reposto").
- Rodapé: uma ação em lote quando fizer sentido pra categoria (ex: "Repor todos"), e sempre um link "Ver tudo no catálogo" pra quem preferir a experiência completa de navegação/filtro em vez de resolver rápido dentro do modal.
- **As 4 categorias usam essa mesma estrutura de modal por design** — evita que cada tile precise de um componente diferente. O que muda é: o texto do subtítulo, os dados de contexto por linha, o label da ação individual, e se existe ou não uma ação em lote.
- **Confirmado com produto**: "Alertas" **não tem ação em lote**. Diferente de "Reposição necessária" (onde os 3 itens são a mesma ação repetida — repor estoque), os itens dentro de "Alertas" são heterogêneos entre si (um alerta de estoque baixo não é a mesma natureza de um alerta de pedido atrasado, por exemplo) — não existe uma ação única que resolva todos de uma vez. O modal de Alertas deve ter lista + ação individual por linha, mas **sem** o botão de ação em lote no rodapé (só o link "Ver tudo", se fizer sentido pra esse caso).

---

## 4. Responsividade

Esta leva foi desenhada em desktop (1440px de referência). Já existem versões mobile e tablet dessas mesmas telas de Login e Onboarding desenhadas anteriormente (`telas-mobile.html`, `telas-tablet.html`) — **o Radar Comercial em desktop ainda não tem uma versão de breakpoint intermediário (~768–1024px) reconciliada com este novo layout de 4 colunas** (as versões tablet anteriores usavam 3 colunas). Recomenda-se tratar isso como um breakpoint a resolver antes do release, não assumir que o grid de 4 colunas simplesmente vira 3 ou 2 sem revisão de design.

Breakpoints sugeridos (a confirmar com design antes de codar):
- `≥1280px`: layout desktop conforme desenhado (grid4, split-screen no login, onboarding em 2 colunas)
- `768–1279px`: adaptar grid de insights pra 2 colunas; onboarding provavelmente empilha o trilho de progresso acima do formulário em vez de lateral
- `<768px`: usar os mockups mobile já existentes como referência (`telas-mobile.html`), que têm fluxo equivalente mas componentes de navegação diferentes (bottom nav em vez de top nav)

---

## 5. Design tokens (prontos para variáveis CSS/tema)

```css
--bg-canvas:#EDEDEF;   --bg-app:#FFFFFF;      --surface:#FFFFFF;
--surface-2:#F4F4F5;   --surface-3:#E9E9EB;   --border:#E2E2E5;
--border-strong:#D3D3D7;
--text-primary:#161618; --text-secondary:#6C6C73; --text-tertiary:#A0A0A6;
--black:#161618;        --on-black:#FFFFFF;
--positive:#1E8A54;  --positive-dim:#EAF5EE;
--risk:#C9392F;      --risk-dim:#FBEAE9;
--info:#3060C4;      --info-dim:#EBF0FB;

--font-display: 'Space Grotesk', sans-serif;   /* títulos */
--font-body: 'IBM Plex Sans', sans-serif;      /* corpo/UI */
--font-mono: 'IBM Plex Mono', monospace;       /* dados, rótulos em caixa alta */

--radius-control: 4px;   /* botões, inputs, chips */
--radius-container: 6px-8px;  /* cards, frames */
```

**Nota sobre a marca:** o logotipo usado nos mockups está embutido como imagem base64 — isso foi uma solução de conveniência pra manter o arquivo de mockup portátil. Em produção, **usar o arquivo de marca oficial como asset otimizado** (SVG preferencialmente, já que é um logotipo monocromático — fica leve e escala sem perda), não a imagem base64 dos mockups.

---

## 6. Acessibilidade

- **Cor nunca é o único sinal.** Os cards de insight do Radar já seguem essa regra por padrão: cada um tem um rótulo de texto (ex: "Estoque baixo", "Benchmark") além da barra lateral colorida — isso é intencional, não incidental, e deve continuar valendo pra qualquer novo tipo de insight que for adicionado.
- **Navegação por teclado**: todos os elementos interativos (botões, chips, cards clicáveis, itens do menu de avatar) precisam ser alcançáveis via `Tab` e ativáveis via `Enter`/`Espaço`. O menu de avatar precisa fechar com `Esc` e devolver o foco pro botão que o abriu.
- **Contraste**: o texto secundário (`--text-secondary: #6C6C73`) sobre fundo branco fica próximo do limite recomendado pra texto pequeno (WCAG AA) — validar com ferramenta de contraste antes de finalizar, especialmente em `eyebrow` labels que usam fonte pequena.
- **Foco visível**: nenhum estado de `:focus` foi especificado nos mockups estáticos — o front-end precisa definir um estilo de foco consistente (ex: contorno de 2px na cor `--black`) pra todos os componentes interativos, já que os mockups em HTML/imagem não capturam esse estado.

---

## 7. O que NÃO está coberto por esta etapa

Pra evitar retrabalho, sinalizando explicitamente o que ainda não foi desenhado e não deve ser assumido/inventado pelo front-end:

- Fluxo de OAuth (Google)
- Tratamento visual de erros de formulário (mensagens específicas)
- Tela de "criar nova senha" (destino do link enviado por e-mail na recuperação de senha)
- Critério exato de quando exibir o estado vazio do Radar (regra de negócio, não de design)
- Telas de destino da navegação do TopNav (Catálogo, Planejar, Pedidos, Clientes)
- Integração de sistema de vendas (etapa 2 do onboarding)
- Breakpoint intermediário (tablet/768–1279px) do Radar em 4 colunas

Essas peças serão especificadas em etapas seguintes de design, à medida que os outros módulos forem trabalhados.
