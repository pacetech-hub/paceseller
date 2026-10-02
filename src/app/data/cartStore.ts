import { useSyncExternalStore } from "react";
import { clients, orders, products, type Product } from "./mockData";

// Carrinhos compartilhados entre o lojista e o representante (spec do Radar, M5/M6).
// Um pedido fecha numa sequência fixa: o lojista envia, o representante confirma as
// condições comerciais e só então o lojista paga. Todas as telas (catálogo, gaveta,
// lista de carrinhos, detalhe e Radar) leem este mesmo store — os dados são mock e locais.

export type CartCreator = 'lojista' | 'rep';

/** Etapa guardada. "Rascunho" e "Pronto pra enviar" saem da etapa "montagem" pela grade mínima. */
export type CartStage = 'montagem' | 'aguardando-rep' | 'aguardando-voce' | 'aguardando-pagamento' | 'confirmado';
/** Status mostrado (6 estados do fluxo ajustado). */
export type CartStatus = 'rascunho' | 'pronto' | 'aguardando-rep' | 'aguardando-voce' | 'aguardando-pagamento' | 'confirmado';

export interface CartLine {
  productId: string;
  sizes: Record<string, number>;
}

export interface CartComment {
  id: string;
  author: CartCreator;
  name: string;
  text: string;
  at: string;
  /** "edit" = edição do representante registrada no histórico (FR-607). */
  kind: 'comment' | 'edit' | 'system';
}

export interface Cart {
  id: string;
  clientId: string;
  clientName: string;
  cartName: string;
  createdBy: CartCreator;
  rep: string;
  stage: CartStage;
  lines: CartLine[];
  updatedAt: string;
  stageSince: string;
  repCanEdit: boolean;
  autoSend: boolean;
  comments: CartComment[];
  /** Exceção à grade mínima aprovada pelo representante, com motivo (BR-24). */
  exception?: { by: string; reason: string; at: string };
  /** Pedido gerado quando o pagamento é confirmado (o carrinho sai da lista e vai para Pedidos). */
  orderId?: string;
}

/** Contexto mínimo usado pela navegação (carrinho ativo). */
export interface CartContext {
  id: string;
  clientId: string;
  clientName: string;
  cartName: string;
  createdBy?: CartCreator;
}

// ---- Parâmetros do carrinho (configuráveis pelo negócio; valores padrão da spec) ----
export const CART_PARAMS = {
  /** BR-23: grade mínima por carrinho, em pares. */
  minOrderPairs: 36,
  /** Envio automático: horário do dia e janela sem edição. */
  autoSendHour: 18,
  autoSendQuietHours: 2,
  /** BR-11: prazo de entrega exibido na página do produto, na gaveta e no carrinho. */
  leadTimeLabel: 'Entrega em 15 dias úteis',
  /** BR-07: desconto à vista, por linha (a confirmar pelo financeiro). */
  cashDiscountPct: 5,
  /** FR-405: frete grátis a partir deste valor por carrinho (a definir pela logística). */
  freeShippingFrom: 8000,
};

const HOUR = 3600_000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

export const pairsOf = (sizes: Record<string, number>) => Object.values(sizes).reduce((a, b) => a + b, 0);
export const cartPairs = (cart: Cart) => cart.lines.reduce((a, l) => a + pairsOf(l.sizes), 0);
export const productById = (id: string): Product | undefined => products.find(p => p.id === id);
export const lineValue = (l: CartLine) => pairsOf(l.sizes) * (productById(l.productId)?.price ?? 0);
export const cartValue = (cart: Cart) => cart.lines.reduce((a, l) => a + lineValue(l), 0);

export function cartStatus(cart: Cart): CartStatus {
  if (cart.stage !== 'montagem') return cart.stage;
  return cartPairs(cart) >= CART_PARAMS.minOrderPairs || cart.exception ? 'pronto' : 'rascunho';
}

/** Primeiro nome do representante — usado nos rótulos ("Aguardando Ana", "Falar com Ana"). */
export const repFirstName = (rep: string) => rep.split(' ')[0];

export function statusLabel(status: CartStatus, rep: string): string {
  const name = repFirstName(rep);
  switch (status) {
    case 'rascunho': return 'Rascunho';
    case 'pronto': return 'Pronto pra enviar';
    case 'aguardando-rep': return `Aguardando ${name}`;
    case 'aguardando-voce': return 'Aguardando você';
    case 'aguardando-pagamento': return 'Aguardando pagamento';
    case 'confirmado': return 'Confirmado';
  }
}

/** Cor por severidade: "Aguardando você" em âmbar; pronto e aguardando pagamento em verde; o resto neutro. */
export const statusColor: Record<CartStatus, string> = {
  rascunho: 'gray',
  pronto: 'teal',
  'aguardando-rep': 'gray',
  'aguardando-voce': 'yellow',
  'aguardando-pagamento': 'teal',
  confirmado: 'gray',
};

/** Carrinho em aberto = ainda não confirmado (os confirmados vão para Pedidos). */
export const isOpen = (cart: Cart) => cart.stage !== 'confirmado';
/** O lojista só adiciona itens em carrinhos que estão com ele. */
export const isEditableBy = (cart: Cart, role: CartCreator) =>
  role === 'lojista'
    ? cart.stage === 'montagem' || cart.stage === 'aguardando-voce'
    : cart.repCanEdit && cart.stage !== 'confirmado' && cart.stage !== 'aguardando-pagamento';

/** Texto do envio automático no cartão do carrinho ("Envio automático hoje às 18h"). */
export function autoSendText(cart: Cart, now = new Date()): string | null {
  if (!cart.autoSend || cartStatus(cart) !== 'pronto') return null;
  const editedRecently = now.getTime() - new Date(cart.updatedAt).getTime() < CART_PARAMS.autoSendQuietHours * HOUR;
  const past = now.getHours() >= CART_PARAMS.autoSendHour;
  if (past) return `Envio automático amanhã às ${CART_PARAMS.autoSendHour}h`;
  return editedRecently
    ? `Envio automático hoje às ${CART_PARAMS.autoSendHour}h, se não houver edição nas próximas ${CART_PARAMS.autoSendQuietHours}h`
    : `Envio automático hoje às ${CART_PARAMS.autoSendHour}h`;
}

// ---- Dados iniciais (mock) ----
const lojistaClient = clients[0];
const c = (n: number) => clients[n];
let seq = 0;
const cid = () => `CM-${++seq}`;

const initialCarts: Cart[] = [
  {
    id: 'CART-001', clientId: lojistaClient.id, clientName: lojistaClient.name, cartName: 'Coleção Inverno',
    createdBy: 'lojista', rep: lojistaClient.rep, stage: 'montagem',
    lines: [
      { productId: 'P001', sizes: { '38': 4, '39': 6, '40': 6, '41': 4 } },
      { productId: 'P004', sizes: { '39': 6, '40': 8, '41': 6, '42': 4 } },
      { productId: 'P005', sizes: { '38': 2, '39': 4, '40': 4, '41': 2 } },
    ],
    updatedAt: ago(3 * HOUR), stageSince: ago(2 * DAY), repCanEdit: true, autoSend: true,
    comments: [
      { id: cid(), author: 'rep', name: lojistaClient.rep, text: 'Se fechar até sexta, consigo manter a condição 30/60/90.', at: ago(1 * DAY), kind: 'comment' },
    ],
  },
  {
    id: 'CART-002', clientId: lojistaClient.id, clientName: lojistaClient.name, cartName: 'Coil Verão',
    createdBy: 'rep', rep: lojistaClient.rep, stage: 'aguardando-voce',
    lines: [
      { productId: 'P006', sizes: { '37': 4, '38': 6, '39': 6, '40': 4, '41': 4 } },
      { productId: 'P011', sizes: { '38': 4, '39': 6, '40': 6, '41': 4 } },
    ],
    updatedAt: ago(9 * DAY), stageSince: ago(9 * DAY), repCanEdit: true, autoSend: false,
    comments: [
      { id: cid(), author: 'rep', name: lojistaClient.rep, text: 'Montei uma sugestão de Coil pro verão com base no seu giro. Revise e aprove quando puder.', at: ago(9 * DAY), kind: 'comment' },
    ],
  },
  {
    id: 'CART-003', clientId: lojistaClient.id, clientName: lojistaClient.name, cartName: 'Reposição rápida',
    createdBy: 'lojista', rep: lojistaClient.rep, stage: 'montagem',
    lines: [{ productId: 'P003', sizes: { '37': 2, '38': 2, '39': 2 } }],
    updatedAt: ago(5 * DAY), stageSince: ago(5 * DAY), repCanEdit: false, autoSend: false, comments: [],
  },
  {
    id: 'CART-004', clientId: lojistaClient.id, clientName: lojistaClient.name, cartName: 'Pedido Hertz',
    createdBy: 'lojista', rep: lojistaClient.rep, stage: 'aguardando-pagamento',
    lines: [
      { productId: 'P004', sizes: { '38': 4, '39': 6, '40': 6, '41': 4 } },
      { productId: 'P007', sizes: { '36': 4, '37': 6, '38': 6, '39': 4 } },
    ],
    updatedAt: ago(1 * DAY), stageSince: ago(1 * DAY), repCanEdit: false, autoSend: false,
    comments: [
      { id: cid(), author: 'rep', name: lojistaClient.rep, text: 'Condições confirmadas: 30/60/90 dias ou 5% à vista. Pode seguir pro pagamento.', at: ago(1 * DAY), kind: 'system' },
    ],
  },
  {
    id: 'CART-005', clientId: lojistaClient.id, clientName: lojistaClient.name, cartName: 'Flow XL Natal',
    createdBy: 'lojista', rep: lojistaClient.rep, stage: 'aguardando-rep',
    lines: [{ productId: 'P001', sizes: { '36': 4, '37': 6, '38': 8, '39': 8, '40': 6, '41': 4 } }],
    updatedAt: ago(2 * DAY), stageSince: ago(2 * DAY), repCanEdit: false, autoSend: false, comments: [],
  },
  // Carrinhos de outros clientes da carteira do representante
  {
    id: 'CART-101', clientId: c(2).id, clientName: c(2).name, cartName: 'Pedido principal', createdBy: 'rep', rep: c(2).rep,
    stage: 'montagem', lines: [{ productId: 'P002', sizes: { '37': 6, '38': 8, '39': 8, '40': 8, '41': 6, '42': 4 } }],
    updatedAt: ago(4 * DAY), stageSince: ago(4 * DAY), repCanEdit: true, autoSend: false, comments: [],
  },
  {
    id: 'CART-102', clientId: c(5).id, clientName: c(5).name, cartName: 'Coleção Primavera', createdBy: 'rep', rep: c(5).rep,
    stage: 'aguardando-rep', lines: [{ productId: 'P008', sizes: { '38': 8, '39': 10, '40': 10, '41': 8, '42': 4 } }],
    updatedAt: ago(6 * DAY), stageSince: ago(1 * DAY), repCanEdit: true, autoSend: false, comments: [],
  },
  {
    id: 'CART-103', clientId: c(1).id, clientName: c(1).name, cartName: 'Reposição MG', createdBy: 'rep', rep: c(1).rep,
    stage: 'montagem', lines: [{ productId: 'P005', sizes: { '38': 4, '39': 6, '40': 6, '41': 4 } }],
    updatedAt: ago(7 * DAY), stageSince: ago(7 * DAY), repCanEdit: true, autoSend: false, comments: [],
  },
];

// ---- Store ----
let state: { carts: Cart[]; targetCartId: string | null } = { carts: initialCarts, targetCartId: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const set = (next: Partial<typeof state>) => { state = { ...state, ...next }; emit(); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getState = () => state;

export function subscribeCarts(l: () => void) { return subscribe(l); }
export function getCartsState() { return state; }
export function useCartStore() { return useSyncExternalStore(subscribe, getState); }

const now = () => new Date().toISOString();
const patch = (id: string, fn: (c: Cart) => Cart) =>
  set({ carts: state.carts.map(c => (c.id === id ? fn(c) : c)) });

export const getCart = (id: string | null | undefined) => state.carts.find(c => c.id === id);
export const toContext = (cart: Cart): CartContext => ({
  id: cart.id, clientId: cart.clientId, clientName: cart.clientName, cartName: cart.cartName, createdBy: cart.createdBy,
});

export function setTargetCart(id: string | null) { set({ targetCartId: id }); }

/**
 * Carrinho de destino do cliente: o escolhido por último, se ainda aceitar itens;
 * senão, o carrinho editável atualizado mais recentemente. null = nenhum (cria um ao adicionar).
 */
export function resolveTargetCart(clientId: string, role: CartCreator): Cart | null {
  const chosen = getCart(state.targetCartId);
  if (chosen && chosen.clientId === clientId && isEditableBy(chosen, role)) return chosen;
  const editable = state.carts
    .filter(c => c.clientId === clientId && isEditableBy(c, role))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return editable[0] ?? null;
}

export function createCart(opts: { clientId: string; name?: string; createdBy: CartCreator }): Cart {
  const client = clients.find(c => c.id === opts.clientId) ?? lojistaClient;
  const cart: Cart = {
    id: `CART-NEW-${Date.now()}`,
    clientId: client.id,
    clientName: client.name,
    cartName: opts.name?.trim() || 'Novo carrinho',
    createdBy: opts.createdBy,
    rep: client.rep,
    // carrinho criado pelo representante começa como sugestão para o lojista revisar
    stage: opts.createdBy === 'rep' ? 'aguardando-voce' : 'montagem',
    lines: [],
    updatedAt: now(),
    stageSince: now(),
    repCanEdit: opts.createdBy === 'rep',
    autoSend: false,
    comments: [],
  };
  set({ carts: [cart, ...state.carts], targetCartId: cart.id });
  return cart;
}

/** Edição feita pelo representante: fica registrada nos comentários e devolve o carrinho ao lojista. */
function repEdit(cart: Cart, text: string): Cart {
  return {
    ...cart,
    stage: cart.stage === 'montagem' ? 'aguardando-voce' : cart.stage === 'aguardando-rep' ? 'aguardando-voce' : cart.stage,
    stageSince: now(),
    comments: [...cart.comments, { id: cid(), author: 'rep', name: cart.rep, text, at: now(), kind: 'edit' }],
  };
}

/** Soma os pares por numeração à linha do produto (cria a linha se não existir). */
export function addToCart(cartId: string, productId: string, sizes: Record<string, number>, role: CartCreator = 'lojista') {
  const clean = Object.fromEntries(Object.entries(sizes).filter(([, q]) => q > 0));
  if (pairsOf(clean) === 0) return;
  patch(cartId, cart => {
    const existing = cart.lines.find(l => l.productId === productId);
    const lines = existing
      ? cart.lines.map(l => {
          if (l.productId !== productId) return l;
          const merged = { ...l.sizes };
          Object.entries(clean).forEach(([s, q]) => { merged[s] = (merged[s] ?? 0) + q; });
          return { ...l, sizes: merged };
        })
      : [...cart.lines, { productId, sizes: clean }];
    const next = { ...cart, lines, updatedAt: now() };
    const name = productById(productId)?.name ?? productId;
    return role === 'rep' ? repEdit(next, `Adicionou ${pairsOf(clean)} pares de ${name}.`) : next;
  });
  set({ targetCartId: cartId });
}

/** Troca a grade inteira de uma linha (editar grade no carrinho). Linha zerada sai do carrinho. */
export function setLineSizes(cartId: string, productId: string, sizes: Record<string, number>, role: CartCreator = 'lojista') {
  const clean = Object.fromEntries(Object.entries(sizes).filter(([, q]) => q > 0));
  patch(cartId, cart => {
    const lines = pairsOf(clean) === 0
      ? cart.lines.filter(l => l.productId !== productId)
      : cart.lines.some(l => l.productId === productId)
        ? cart.lines.map(l => (l.productId === productId ? { ...l, sizes: clean } : l))
        : [...cart.lines, { productId, sizes: clean }];
    // remover itens de um carrinho pronto o devolve ao rascunho se cair abaixo da grade mínima (status derivado)
    const next = { ...cart, lines, updatedAt: now() };
    const name = productById(productId)?.name ?? productId;
    return role === 'rep' ? repEdit(next, `Editou a grade de ${name} (${pairsOf(clean)} pares).`) : next;
  });
}

export const removeLine = (cartId: string, productId: string, role: CartCreator = 'lojista') =>
  setLineSizes(cartId, productId, {}, role);

export function renameCart(cartId: string, name: string) {
  patch(cartId, c => ({ ...c, cartName: name.trim() || c.cartName, updatedAt: now() }));
}

export function setRepCanEdit(cartId: string, value: boolean) {
  patch(cartId, c => ({
    ...c,
    repCanEdit: value,
    comments: [...c.comments, {
      id: cid(), author: 'lojista', name: 'Você', at: now(), kind: 'system',
      text: value ? `${repFirstName(c.rep)} pode editar este carrinho.` : `${repFirstName(c.rep)} não pode mais editar este carrinho.`,
    }],
  }));
}

export function setAutoSend(cartId: string, value: boolean) {
  patch(cartId, c => ({ ...c, autoSend: value }));
}

export function addComment(cartId: string, author: CartCreator, name: string, text: string) {
  if (!text.trim()) return;
  patch(cartId, c => ({ ...c, comments: [...c.comments, { id: cid(), author, name, text: text.trim(), at: now(), kind: 'comment' }] }));
}

/** Lojista envia o carrinho pronto ao representante (só a partir de "Pronto pra enviar"). */
export function sendToRep(cartId: string): boolean {
  const cart = getCart(cartId);
  if (!cart || cartStatus(cart) !== 'pronto') return false;
  patch(cartId, c => ({
    ...c, stage: 'aguardando-rep', stageSince: now(), updatedAt: now(),
    comments: [...c.comments, { id: cid(), author: 'lojista', name: 'Você', text: 'Carrinho enviado para o representante.', at: now(), kind: 'system' }],
  }));
  return true;
}

/** Lojista aprova a sugestão/edição do representante: volta para "Aguardando representante". */
export function approveRepSuggestion(cartId: string): boolean {
  const cart = getCart(cartId);
  if (!cart || cart.stage !== 'aguardando-voce') return false;
  if (cartPairs(cart) < CART_PARAMS.minOrderPairs && !cart.exception) return false;
  patch(cartId, c => ({
    ...c, stage: 'aguardando-rep', stageSince: now(), updatedAt: now(),
    comments: [...c.comments, { id: cid(), author: 'lojista', name: 'Você', text: 'Sugestão aprovada e devolvida ao representante.', at: now(), kind: 'system' }],
  }));
  return true;
}

/** Representante confirma as condições comerciais: abre o pagamento para o lojista. */
export function repConfirmConditions(cartId: string): boolean {
  const cart = getCart(cartId);
  if (!cart || cart.stage !== 'aguardando-rep') return false;
  patch(cartId, c => ({
    ...c, stage: 'aguardando-pagamento', stageSince: now(), updatedAt: now(),
    comments: [...c.comments, { id: cid(), author: 'rep', name: c.rep, text: 'Condições comerciais confirmadas. O pagamento está liberado.', at: now(), kind: 'system' }],
  }));
  return true;
}

/** Exceção à grade mínima: só o representante aprova, sempre com motivo registrado (BR-24). */
export function approveMinimumException(cartId: string, reason: string) {
  if (!reason.trim()) return;
  patch(cartId, c => ({
    ...c,
    exception: { by: c.rep, reason: reason.trim(), at: now() },
    comments: [...c.comments, { id: cid(), author: 'rep', name: c.rep, text: `Exceção à grade mínima aprovada: ${reason.trim()}`, at: now(), kind: 'system' }],
  }));
}

/** Pagamento confirmado: o carrinho vira pedido (aparece em Pedidos) e sai de Meus carrinhos. */
export function confirmPayment(cartId: string, paymentCondition: string, total: number): string | null {
  const cart = getCart(cartId);
  if (!cart || cart.stage !== 'aguardando-pagamento') return null;
  const orderId = `PED-2026-${String(500 + orders.length).padStart(4, '0')}`;
  // o mock de pedidos é uma lista fixa: o novo pedido entra no topo para aparecer no histórico
  orders.unshift({
    id: orderId,
    date: new Date().toISOString().slice(0, 10),
    client: cart.clientName,
    clientId: cart.clientId,
    rep: cart.rep,
    status: 'aprovado',
    total,
    items: cartPairs(cart),
    paymentCondition,
    collection: cart.cartName,
  });
  patch(cartId, c => ({ ...c, stage: 'confirmado', stageSince: now(), updatedAt: now(), orderId }));
  return orderId;
}
