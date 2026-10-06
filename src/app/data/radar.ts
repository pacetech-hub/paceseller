import { useSyncExternalStore } from "react";
import { products, formatCurrency, type Product } from "./mockData";
import {
  CART_PARAMS, cartPairs, cartStatus, getCartsState, isOpen, pairsOf, productById, repFirstName,
  subscribeCarts, type Cart,
} from "./cartStore";

// Motor do Radar (spec "Radar — Final Functional Spec"): lê vendas, estoque, pedidos,
// lojas parecidas e carrinhos, decide UMA recomendação por produto e todas as telas leem
// o mesmo resultado (BR-30). Dados da loja são mock; os parâmetros são os padrões da spec
// e devem ser configuráveis pelo negócio sem release.

// ---------------------------------------------------------------------------
// Parâmetros (seção "Parameters to confirm")
// ---------------------------------------------------------------------------
export const RADAR_PARAMS = {
  /** BR-11: prazo de entrega (15 dias úteis ≈ 21 dias corridos). */
  leadTimeDays: 21,
  /** BR-12: margem de segurança do estoque baixo. */
  safetyDays: 7,
  /** BR-13: cobertura alvo depois da reposição. */
  targetCoverageDays: 45,
  /** BR-13: múltiplo do pedido (confirmar se caixas de 6 ou 12). */
  orderMultiple: 1,
  /** BR-33: "Mais vendida" = top N da rede nos últimos 30 dias. */
  topSellersCount: 3,
  /** S-05: alta demanda a partir de +20% na região, 30 dias. */
  highDemandPct: 20,
  /** S-04: giro baixo abaixo de 70% da curva esperada. */
  lowTurnoverRatio: 0.7,
  /** S-07: vendido por 50%+ das lojas parecidas em 90 dias. */
  missedOpportunityShare: 0.5,
  /** S-08: janela de lançamento. */
  launchWindowDays: 60,
  /** S-09: lojas parecidas venderam 20%+ a mais. */
  benchmarkPct: 20,
  /** BR-63: tamanho mínimo do grupo de lojas parecidas. */
  peerGroupMin: 5,
  /** "Boa margem" = média do catálogo + N pontos. */
  goodMarginPoints: 2,
  /** S-11: "Aguardando você" vira Atenção depois de N dias. */
  waitingAttentionDays: 3,
  /** S-13: mix abaixo do alvo do perfil em mais de N pontos. */
  mixGapPoints: 5,
  /** BR-01: o que "Seu custo" inclui (a confirmar pelo financeiro). */
  costIncludesTaxes: false,
  costIncludesFreight: false,
  /**
   * BR-40: prazo para agir nos sinais que não dependem de ruptura de estoque
   * (em dias a partir de hoje). Estoque baixo usa a data de ruptura − prazo de entrega.
   */
  actWindowDays: {
    'sem-giro': 25, 'giro-baixo': 10, 'alta-demanda': 7, 'produtos-em-alta': 20,
    'oportunidade-perdida': 20, lancamento: 12, benchmark: 25, fechamento: 10,
  } as Record<string, number>,
};

/** Rótulo de base do custo (BR-01). */
export const COST_BASIS = `${RADAR_PARAMS.costIncludesTaxes ? 'com impostos' : 'sem impostos'} e ${RADAR_PARAMS.costIncludesFreight ? 'com frete' : 'sem frete'}`;

// ---------------------------------------------------------------------------
// Preço e margem (BR-01 a BR-06)
// ---------------------------------------------------------------------------
/** BR-03: margem = (PDV sugerido − Seu custo) ÷ PDV sugerido, em %. */
export const marginPct = (p: Pick<Product, 'price' | 'priceRetail'>) =>
  p.priceRetail > 0 ? Math.round(((p.priceRetail - p.price) / p.priceRetail) * 100) : 0;
/** BR-04: markup só aparece em tooltip, sobre o custo. */
export const markupPct = (p: Pick<Product, 'price' | 'priceRetail'>) =>
  p.price > 0 ? Math.round(((p.priceRetail - p.price) / p.price) * 100) : 0;
export const marginLabel = (p: Pick<Product, 'price' | 'priceRetail'>) => `Margem ${marginPct(p)}% no PDV sugerido`;
export const markupLabel = (p: Pick<Product, 'price' | 'priceRetail'>) => `Markup +${markupPct(p)}% sobre o custo`;

/** BR-06: margem do carrinho = margem ponderada pelo valor das linhas. null com 0 itens. */
export function cartMarginPct(lines: { productId: string; sizes: Record<string, number> }[]): number | null {
  let cost = 0;
  let retail = 0;
  lines.forEach(l => {
    const p = productById(l.productId);
    if (!p) return;
    const n = pairsOf(l.sizes);
    cost += n * p.price;
    retail += n * p.priceRetail;
  });
  return retail > 0 ? Math.round(((retail - cost) / retail) * 100) : null;
}

const catalogAvgMargin = products.reduce((a, p) => a + (p.priceRetail - p.price) / p.priceRetail, 0) / products.length * 100;
/** "Boa margem": margem ≥ média do catálogo + 2 pontos. */
export const isGoodMargin = (p: Product) => marginPct(p) >= catalogAvgMargin + RADAR_PARAMS.goodMarginPoints;
/** O filtro "Boa margem" some quando as margens do catálogo não se diferenciam. */
export const goodMarginFilterVisible = products.some(isGoodMargin);

/** BR-73: Tênis Tesla + linha + cor. */
export const productDisplayName = (p: Pick<Product, 'name'>) => `Tênis Tesla ${p.name}`;

// ---------------------------------------------------------------------------
// Dados da loja (mock): integrações sell-out, estoque da loja e lojas parecidas
// ---------------------------------------------------------------------------
interface StoreSku {
  productId: string;
  /** Produto está no mix da loja (já comprou). */
  inMix: boolean;
  stock: number;
  /** Venda média diária dos últimos 30 dias. */
  dailySales: number;
  inTransit: number;
  lastSaleDaysAgo: number | null;
  launchedDaysAgo: number;
  /** Vendas reais ÷ esperadas desde o lançamento (1 = na curva). */
  expectedSalesRatio?: number;
  /** Crescimento das vendas na região, últimos 30 dias. */
  regionalGrowthPct: number;
  /** Lojas parecidas que venderam o modelo nos últimos 90 dias. */
  peerStoresSelling: number;
  /** Lojas parecidas venderam X% a mais que a loja nos últimos 30 dias. */
  peerSalesDiffPct: number;
  /** Pares comprados no mesmo período do ano passado (S-12). */
  lastYearPairs?: number;
  /** Curva de vendas por numeração da loja; sem histórico suficiente → curva regional. */
  sizeCurve?: Record<string, number>;
  updatedHoursAgo: number;
}

export const PEER_GROUP_SIZE = 10;

const storeSkus: StoreSku[] = [
  { productId: 'P001', inMix: true, stock: 60, dailySales: 1.5, inTransit: 0, lastSaleDaysAgo: 0, launchedDaysAgo: 210, regionalGrowthPct: 34, peerStoresSelling: 9, peerSalesDiffPct: 5, lastYearPairs: 16,
    sizeCurve: { '36': 6, '37': 10, '38': 16, '39': 20, '40': 20, '41': 14, '42': 8, '43': 4, '44': 2 }, updatedHoursAgo: 2 },
  { productId: 'P002', inMix: true, stock: 10, dailySales: 0.8, inTransit: 0, lastSaleDaysAgo: 0, launchedDaysAgo: 320, regionalGrowthPct: 12, peerStoresSelling: 8, peerSalesDiffPct: 0, lastYearPairs: 40,
    sizeCurve: { '34': 4, '35': 7, '36': 12, '37': 16, '38': 18, '39': 16, '40': 12, '41': 8, '42': 5, '43': 2 }, updatedHoursAgo: 2 },
  { productId: 'P003', inMix: true, stock: 35, dailySales: 0.9, inTransit: 0, lastSaleDaysAgo: 1, launchedDaysAgo: 400, regionalGrowthPct: 4, peerStoresSelling: 6, peerSalesDiffPct: 2, lastYearPairs: 6, updatedHoursAgo: 2 },
  { productId: 'P004', inMix: true, stock: 50, dailySales: 2, inTransit: 24, lastSaleDaysAgo: 0, launchedDaysAgo: 380, regionalGrowthPct: 8, peerStoresSelling: 9, peerSalesDiffPct: 6, lastYearPairs: 34,
    sizeCurve: { '37': 6, '38': 12, '39': 18, '40': 22, '41': 18, '42': 12, '43': 8, '44': 4 }, updatedHoursAgo: 2 },
  { productId: 'P005', inMix: true, stock: 45, dailySales: 1.2, inTransit: 0, lastSaleDaysAgo: 0, launchedDaysAgo: 260, regionalGrowthPct: 26, peerStoresSelling: 7, peerSalesDiffPct: 4, lastYearPairs: 10, updatedHoursAgo: 2 },
  { productId: 'P006', inMix: true, stock: 28, dailySales: 0.6, inTransit: 0, lastSaleDaysAgo: 2, launchedDaysAgo: 300, regionalGrowthPct: 3, peerStoresSelling: 5, peerSalesDiffPct: 0, lastYearPairs: 30, updatedHoursAgo: 2 },
  { productId: 'P007', inMix: false, stock: 0, dailySales: 0, inTransit: 0, lastSaleDaysAgo: null, launchedDaysAgo: 200, regionalGrowthPct: 9, peerStoresSelling: 7, peerSalesDiffPct: 0, updatedHoursAgo: 26 },
  { productId: 'P008', inMix: true, stock: 18, dailySales: 0, inTransit: 0, lastSaleDaysAgo: 34, launchedDaysAgo: 240, regionalGrowthPct: -6, peerStoresSelling: 4, peerSalesDiffPct: 0, updatedHoursAgo: 2 },
  { productId: 'P009', inMix: false, stock: 0, dailySales: 0, inTransit: 0, lastSaleDaysAgo: null, launchedDaysAgo: 12, regionalGrowthPct: 0, peerStoresSelling: 4, peerSalesDiffPct: 0, updatedHoursAgo: 26 },
  { productId: 'P010', inMix: true, stock: 30, dailySales: 0.5, inTransit: 0, lastSaleDaysAgo: 3, launchedDaysAgo: 28, expectedSalesRatio: 0.6, regionalGrowthPct: 5, peerStoresSelling: 3, peerSalesDiffPct: 0, updatedHoursAgo: 2 },
  { productId: 'P011', inMix: true, stock: 40, dailySales: 1, inTransit: 0, lastSaleDaysAgo: 0, launchedDaysAgo: 330, regionalGrowthPct: 10, peerStoresSelling: 8, peerSalesDiffPct: 30, lastYearPairs: 12, updatedHoursAgo: 26 },
];

/** Perfil da loja: participação ideal de cada público no pedido (S-13). */
export const STORE_MIX_TARGET: Record<Product['segment'], number> = { Masculino: 45, Feminino: 35, Unissex: 20 };

/** Curva regional por numeração (usada quando a loja tem pouco histórico — BR-14). */
const REGIONAL_CURVE: Record<string, number> = {
  '34': 3, '35': 6, '36': 9, '37': 12, '38': 14, '39': 14, '40': 12, '41': 10, '42': 8, '43': 7, '44': 5,
};

/** Pedidos com previsão de entrega vencida (S-01). */
export const lateOrders = [
  { orderId: '4790-1', daysLate: 2, originalForecast: '30/09', newForecast: '06/10', reason: 'Atraso na transportadora', value: 6718, updatedHoursAgo: 0 },
];

/**
 * Boletos da loja a vencer (mock, datas relativas a hoje). A tela de Pagamentos e Boletos usa
 * os mesmos registros, então o cartão do Radar e a lista mostram os mesmos valores.
 */
export const upcomingBills = [
  { id: 'BOL-2026-9011', orderId: '4790-1', product: 'Tênis Fusion — Coleção 2026', orderTotal: 6718.00, amount: 2239.33, installment: '1/3', dueInDays: 3 },
  { id: 'BOL-2026-9005', orderId: 'PED-2026-0377', product: 'Tênis Coil — Reposição', orderTotal: 3780.00, amount: 1890.00, installment: '2/2', dueInDays: 6 },
];
/** Janela do aviso de boletos: vencimentos nos próximos N dias. */
const BILLS_WINDOW_DAYS = 7;

export const storeSku = (productId: string) => storeSkus.find(s => s.productId === productId);

// ---------------------------------------------------------------------------
// Estoque, reposição e quantidade sugerida (BR-10 a BR-15)
// ---------------------------------------------------------------------------
/** BR-10: cobertura em dias. null quando não há venda (não é zero — BR-62). */
export const coverageDays = (s: StoreSku) => (s.dailySales > 0 ? s.stock / s.dailySales : null);

/** Pares já em carrinhos abertos (não confirmados) do cliente lojista. */
export function pairsInOpenCarts(productId: string, carts: Cart[], clientId = 'CLI-001'): number {
  return carts
    .filter(c => c.clientId === clientId && isOpen(c))
    .reduce((a, c) => a + c.lines.filter(l => l.productId === productId).reduce((x, l) => x + pairsOf(l.sizes), 0), 0);
}

/**
 * BR-14: divide uma quantidade por numeração pela curva (da loja ou regional),
 * respeitando a disponibilidade por numeração (BR-22). Retorna também a curva usada.
 */
export function splitBySizeCurve(product: Product, total: number): { sizes: Record<string, number>; curve: 'loja' | 'regional' } {
  const s = storeSku(product.id);
  const curve = s?.sizeCurve ? 'loja' : 'regional';
  const weights = s?.sizeCurve ?? REGIONAL_CURVE;
  const available = Object.keys(product.grades).filter(k => product.grades[k] > 0 && (weights[k] ?? 0) > 0);
  const sum = available.reduce((a, k) => a + weights[k], 0);
  const sizes: Record<string, number> = {};
  if (total <= 0 || sum === 0) return { sizes, curve };
  // maiores restos: soma exata do total, sem passar da disponibilidade
  const raw = available.map(k => ({ k, v: (total * weights[k]) / sum }));
  raw.forEach(({ k, v }) => { sizes[k] = Math.min(Math.floor(v), product.grades[k]); });
  let left = total - pairsOf(sizes);
  const order = [...raw].sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
  for (let guard = 0; left > 0 && guard < 1000; guard++) {
    const slot = order[guard % order.length];
    if (sizes[slot.k] < product.grades[slot.k]) { sizes[slot.k]++; left--; }
    if (guard > order.length * 50) break;
  }
  return { sizes: Object.fromEntries(Object.entries(sizes).filter(([, q]) => q > 0)), curve };
}

export const curveLabel = (curve: 'loja' | 'regional') =>
  curve === 'loja' ? 'curva de vendas da sua loja por numeração' : 'curva regional por numeração (pouco histórico na sua loja)';

/** BR-13: venda diária × (prazo + cobertura alvo) − estoque − em trânsito − já em carrinhos abertos. */
export function suggestedQuantity(s: StoreSku, carts: Cart[]): number {
  const need = s.dailySales * (RADAR_PARAMS.leadTimeDays + RADAR_PARAMS.targetCoverageDays)
    - s.stock - s.inTransit - pairsInOpenCarts(s.productId, carts);
  if (need <= 0) return 0;
  const m = RADAR_PARAMS.orderMultiple;
  return Math.ceil(need / m) * m;
}

// ---------------------------------------------------------------------------
// Sinais
// ---------------------------------------------------------------------------
export type SignalType =
  | 'pedido-atrasado' | 'estoque-baixo' | 'sem-giro' | 'giro-baixo' | 'alta-demanda' | 'produtos-em-alta'
  | 'oportunidade-perdida' | 'lancamento' | 'benchmark' | 'fechamento' | 'aguardando-voce'
  | 'abaixo-ano-passado' | 'mix-desbalanceado' | 'boleto-a-vencer';
export type Severity = 'critico' | 'atencao' | 'oportunidade' | 'informacao';
export type Bucket = 'hoje' | '15d' | '30d';

export const SIGNAL_META: Record<SignalType, { code: string; label: string }> = {
  'pedido-atrasado': { code: 'S-01', label: 'Pedido atrasado' },
  'estoque-baixo': { code: 'S-02', label: 'Estoque baixo' },
  'sem-giro': { code: 'S-03', label: 'Sem giro' },
  'giro-baixo': { code: 'S-04', label: 'Giro baixo' },
  'alta-demanda': { code: 'S-05', label: 'Alta demanda' },
  'produtos-em-alta': { code: 'S-06', label: 'Produtos em alta' },
  'oportunidade-perdida': { code: 'S-07', label: 'Oportunidade perdida' },
  lancamento: { code: 'S-08', label: 'Lançamento' },
  benchmark: { code: 'S-09', label: 'Benchmark' },
  fechamento: { code: 'S-10', label: 'Fechamento' },
  'aguardando-voce': { code: 'S-11', label: 'Aguardando você' },
  'abaixo-ano-passado': { code: 'S-12', label: 'Abaixo do ano passado' },
  'mix-desbalanceado': { code: 'S-13', label: 'Mix desbalanceado' },
  // fora do catálogo da spec v1: aviso financeiro (mock)
  'boleto-a-vencer': { code: 'S-14', label: 'Boletos a vencer' },
};

/** Cor por severidade, não por tipo de sinal. */
export const SEVERITY_META: Record<Severity, { label: string; color: string; rank: number }> = {
  critico: { label: 'Crítico', color: 'red', rank: 0 },
  atencao: { label: 'Atenção', color: 'yellow', rank: 1 },
  oportunidade: { label: 'Oportunidade', color: 'teal', rank: 2 },
  // a spec usa azul para "Informação" (no resto do app o azul fica para links)
  informacao: { label: 'Informação', color: 'blue', rank: 3 },
};

/** BR-31: prioridade do sinal principal por produto. */
const PRIORITY: SignalType[] = [
  'pedido-atrasado', 'estoque-baixo', 'sem-giro', 'giro-baixo', 'alta-demanda', 'oportunidade-perdida', 'lancamento', 'benchmark',
];

export type CtaTarget =
  | { kind: 'order'; orderId: string }
  | { kind: 'product'; productId: string; prefill?: boolean; block?: 'benchmark' | 'como-girar' }
  | { kind: 'catalog'; radarFilter?: RadarFilter; line?: string }
  | { kind: 'carts' }
  | { kind: 'cart'; cartId: string }
  | { kind: 'boletos' };

export interface RadarSignal {
  id: string;
  type: SignalType;
  severity: Severity;
  productId?: string;
  /** Prazo para agir, em dias a partir de hoje (≤ 0 = hoje ou vencido). */
  actByDays: number;
  /** Tempo escrito em palavras ("acaba em 12 dias", "2 dias de atraso"). */
  timeText: string;
  /** Métrica principal: a situação (nunca a sugestão). */
  metric: string;
  subject: string;
  context: string;
  /** Sugestão rotulada como ação ("Sugestão: repor 43 pares"). */
  suggestion?: string;
  suggestedQty?: number;
  impact: number;
  ctaLabel: string;
  cta: CtaTarget;
  why: string;
  updatedHoursAgo: number;
}

export type RadarFilter =
  | 'alto-giro' | 'reposicao' | 'lancamentos' | 'oportunidade-perdida' | 'benchmark' | 'giro-baixo' | 'sem-giro' | 'boa-margem';

export const RADAR_FILTERS: { value: RadarFilter; label: string }[] = [
  { value: 'alto-giro', label: 'Alto giro' },
  { value: 'reposicao', label: 'Reposição necessária' },
  { value: 'lancamentos', label: 'Lançamentos' },
  { value: 'oportunidade-perdida', label: 'Oportunidade perdida' },
  { value: 'benchmark', label: 'Benchmark: lojas parecidas' },
  { value: 'giro-baixo', label: 'Giro baixo' },
  { value: 'sem-giro', label: 'Sem giro' },
  { value: 'boa-margem', label: 'Boa margem' },
];

const FILTER_SIGNAL: Partial<Record<RadarFilter, SignalType>> = {
  'alto-giro': 'alta-demanda', reposicao: 'estoque-baixo', lancamentos: 'lancamento',
  'oportunidade-perdida': 'oportunidade-perdida', benchmark: 'benchmark', 'giro-baixo': 'giro-baixo', 'sem-giro': 'sem-giro',
};

// ---- palavras e datas (BR-42) ----
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const days = (n: number) => plural(n, 'dia', 'dias');
export const pairsText = (n: number) => plural(n, 'par', 'pares');

export function dateInDays(n: number, base = new Date()): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
export const ddmm = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
/** "agir hoje" ou "agir até 14/10". */
export const actByText = (n: number) => (n <= 0 ? 'agir hoje' : `agir até ${ddmm(dateInDays(n))}`);
/** BR-60: "Atualizado há 2h". */
export const updatedText = (h: number) => (h < 1 ? 'Atualizado agora' : h < 24 ? `Atualizado há ${h}h` : `Atualizado há ${days(Math.floor(h / 24))}`);

/** BR-41: baldes exclusivos pela data de agir. Além de 30 dias o sinal não entra no Radar. */
export function bucketOf(actByDays: number): Bucket | null {
  if (actByDays <= 0) return 'hoje';
  if (actByDays <= 15) return '15d';
  if (actByDays <= 30) return '30d';
  return null;
}

/** BR-43: críticos = pedido atrasado e estoque baixo com prazo hoje ou vencido. */
export const isCritical = (s: RadarSignal) =>
  s.type === 'pedido-atrasado' || (s.type === 'estoque-baixo' && s.actByDays <= 0);

// ---- candidatos por produto ----
function productCandidates(p: Product, s: StoreSku, carts: Cart[]): RadarSignal[] {
  const out: RadarSignal[] = [];
  const name = productDisplayName(p);
  const w = RADAR_PARAMS.actWindowDays;
  const cov = coverageDays(s);
  const base = { productId: p.id, updatedHoursAgo: s.updatedHoursAgo };

  // S-02 Estoque baixo (BR-12)
  if (s.inMix && cov !== null && cov <= RADAR_PARAMS.leadTimeDays + RADAR_PARAMS.safetyDays) {
    const stockout = Math.floor(cov);
    const actBy = stockout - RADAR_PARAMS.leadTimeDays;
    const qty = suggestedQuantity(s, carts);
    const inCarts = pairsInOpenCarts(p.id, carts);
    out.push({
      ...base, id: `estoque-baixo-${p.id}`, type: 'estoque-baixo', severity: actBy <= 0 ? 'critico' : 'atencao',
      actByDays: actBy,
      timeText: `acaba em ${days(stockout)}`,
      metric: `${s.stock} em estoque`,
      subject: name,
      context: `Vende ${s.dailySales.toLocaleString('pt-BR')} par/dia · ${CART_PARAMS.leadTimeLabel.toLowerCase()}`,
      suggestion: qty > 0
        ? `Sugestão: repor ${pairsText(qty)}${inCarts > 0 ? ` (além de ${inCarts} já no carrinho)` : ''}`
        : `${pairsText(inCarts)} já no carrinho · envie pro representante`,
      suggestedQty: qty,
      impact: qty * p.price,
      ctaLabel: 'Repor agora',
      cta: { kind: 'product', productId: p.id, prefill: true },
      why: `A cobertura é de ${days(stockout)} (estoque ÷ venda média dos últimos 30 dias) e o prazo de entrega é de ${days(RADAR_PARAMS.leadTimeDays)}. Estoque baixo quando a cobertura fica abaixo do prazo + ${days(RADAR_PARAMS.safetyDays)} de segurança. A sugestão cobre ${days(RADAR_PARAMS.targetCoverageDays)} depois da entrega, descontando estoque, pares em trânsito e pares já em carrinhos abertos.`,
    });
  }

  // S-03 Sem giro
  if (s.inMix && s.stock > 0 && s.lastSaleDaysAgo !== null && s.lastSaleDaysAgo >= 30) {
    out.push({
      ...base, id: `sem-giro-${p.id}`, type: 'sem-giro', severity: 'atencao', actByDays: w['sem-giro'],
      timeText: `sem vendas há ${days(s.lastSaleDaysAgo)}`,
      metric: `${pairsText(s.stock)} parados`,
      subject: name,
      context: 'Bom candidato para uma campanha ou vitrine',
      impact: s.stock * p.price,
      ctaLabel: 'Ver produto',
      cta: { kind: 'product', productId: p.id, block: 'como-girar' },
      why: `Há ${pairsText(s.stock)} em estoque e nenhuma venda nos últimos 30 dias. Enquanto isso, o Radar não sugere reposição deste produto.`,
    });
  }

  // S-04 Giro baixo
  if (s.inMix && s.expectedSalesRatio !== undefined && s.expectedSalesRatio < RADAR_PARAMS.lowTurnoverRatio && s.launchedDaysAgo <= 120) {
    const below = Math.round((1 - s.expectedSalesRatio) * 100);
    out.push({
      ...base, id: `giro-baixo-${p.id}`, type: 'giro-baixo', severity: 'atencao', actByDays: w['giro-baixo'],
      timeText: `lançado há ${days(s.launchedDaysAgo)}`,
      metric: `Giro ${below}% abaixo`,
      subject: name,
      context: 'Vendas abaixo da curva esperada desde o lançamento',
      impact: s.stock * p.price,
      ctaLabel: 'Ver produto',
      cta: { kind: 'product', productId: p.id, block: 'como-girar' },
      why: `Desde o lançamento a loja vendeu ${Math.round(s.expectedSalesRatio * 100)}% do esperado para o período (limite: ${Math.round(RADAR_PARAMS.lowTurnoverRatio * 100)}%). Produtos com giro baixo não recebem sugestão de reposição nem entram em combos.`,
    });
  }

  // S-05 Alta demanda (BR-34: escopo e período sempre escritos)
  if (s.regionalGrowthPct >= RADAR_PARAMS.highDemandPct) {
    const qty = s.inMix ? suggestedQuantity(s, carts) : 12;
    out.push({
      ...base, id: `alta-demanda-${p.id}`, type: 'alta-demanda', severity: 'oportunidade', actByDays: w['alta-demanda'],
      timeText: 'últimos 30 dias',
      metric: `+${s.regionalGrowthPct}%`,
      subject: name,
      context: `+${s.regionalGrowthPct}% na sua região, últimos 30 dias`,
      impact: Math.max(qty, 12) * p.price,
      ctaLabel: 'Ver produto',
      cta: { kind: 'product', productId: p.id, prefill: true },
      why: `As vendas deste modelo na sua região cresceram ${s.regionalGrowthPct}% nos últimos 30 dias (limite do sinal: +${RADAR_PARAMS.highDemandPct}%).`,
    });
  }

  // S-07 Oportunidade perdida
  if (!s.inMix && s.peerStoresSelling / PEER_GROUP_SIZE >= RADAR_PARAMS.missedOpportunityShare && PEER_GROUP_SIZE >= RADAR_PARAMS.peerGroupMin) {
    out.push({
      ...base, id: `oportunidade-${p.id}`, type: 'oportunidade-perdida', severity: 'oportunidade', actByDays: w['oportunidade-perdida'],
      timeText: 'últimos 90 dias',
      metric: `${s.peerStoresSelling} de ${PEER_GROUP_SIZE} lojas`,
      subject: name,
      context: `Vende em ${s.peerStoresSelling} de ${PEER_GROUP_SIZE} lojas parecidas · nunca comprado pela sua loja`,
      impact: 24 * p.price,
      ctaLabel: 'Ver produto',
      cta: { kind: 'product', productId: p.id, prefill: true },
      why: `Vendido por ${Math.round((s.peerStoresSelling / PEER_GROUP_SIZE) * 100)}% das lojas parecidas (mesma região, porte e posicionamento de preço) nos últimos 90 dias, e a sua loja nunca comprou. Dados de lojas parecidas são sempre agregados e anônimos.`,
    });
  }

  // S-08 Lançamento
  if (!s.inMix && s.launchedDaysAgo <= RADAR_PARAMS.launchWindowDays) {
    out.push({
      ...base, id: `lancamento-${p.id}`, type: 'lancamento', severity: 'oportunidade', actByDays: w.lancamento,
      timeText: `lançada há ${days(s.launchedDaysAgo)}`,
      metric: `${s.peerStoresSelling} lojas parecidas`,
      subject: `Linha ${p.line}`,
      context: `Ainda fora do seu mix · ${s.peerStoresSelling} lojas parecidas já compram`,
      impact: 24 * p.price,
      ctaLabel: 'Ver coleção',
      cta: { kind: 'catalog', line: p.line },
      why: `A linha ${p.line} foi lançada há ${days(s.launchedDaysAgo)} (janela de lançamento: ${days(RADAR_PARAMS.launchWindowDays)}) e ainda não está no mix da sua loja.`,
    });
  }

  // S-09 Benchmark
  if (s.inMix && s.peerSalesDiffPct >= RADAR_PARAMS.benchmarkPct) {
    out.push({
      ...base, id: `benchmark-${p.id}`, type: 'benchmark', severity: 'informacao', actByDays: w.benchmark,
      timeText: 'últimos 30 dias',
      metric: `+${s.peerSalesDiffPct}%`,
      subject: name,
      context: `Lojas parecidas venderam ${s.peerSalesDiffPct}% mais, últimos 30 dias`,
      impact: 0,
      ctaLabel: 'Comparar',
      cta: { kind: 'product', productId: p.id, block: 'benchmark' },
      why: `Lojas parecidas venderam ${s.peerSalesDiffPct}% mais deste modelo que a sua loja nos últimos 30 dias (limite: +${RADAR_PARAMS.benchmarkPct}%).`,
    });
  }
  return out;
}

/** BR-31 e BR-32: um sinal principal por produto; sinais contraditórios não convivem. */
function pickPrimary(cands: RadarSignal[]): RadarSignal | undefined {
  const stuck = cands.some(c => c.type === 'sem-giro' || c.type === 'giro-baixo');
  const allowed = stuck ? cands.filter(c => c.type !== 'estoque-baixo' && c.type !== 'alta-demanda') : cands;
  return [...allowed].sort((a, b) => PRIORITY.indexOf(a.type) - PRIORITY.indexOf(b.type))[0];
}

// ---------------------------------------------------------------------------
// Ciclo de vida (BR-50 a BR-52): dispensar, adiar e resolvido
// ---------------------------------------------------------------------------
interface LifecycleState {
  dismissed: Record<string, { reason: string; at: number }>;
  snoozed: Record<string, number>;
  resolved: Record<string, number>;
}
let lifecycle: LifecycleState = { dismissed: {}, snoozed: {}, resolved: {} };
const lifeListeners = new Set<() => void>();
const emitLife = () => { cache = null; lifeListeners.forEach(l => l()); };

/** Motivos ficam guardados para calibrar as regras (BR-51). */
export function dismissSignal(id: string, reason: string) {
  lifecycle = { ...lifecycle, dismissed: { ...lifecycle.dismissed, [id]: { reason, at: Date.now() } } };
  emitLife();
}
export function snoozeSignal(id: string, forDays: number) {
  lifecycle = { ...lifecycle, snoozed: { ...lifecycle.snoozed, [id]: Date.now() + forDays * 86_400_000 } };
  emitLife();
}
export function undoSignalAction(id: string) {
  const { [id]: _d, ...dismissed } = lifecycle.dismissed;
  const { [id]: _s, ...snoozed } = lifecycle.snoozed;
  lifecycle = { ...lifecycle, dismissed, snoozed };
  emitLife();
}

// Um carrinho enviado resolve o estoque baixo dos produtos dele; aprovar a sugestão resolve o S-11.
let lastStages: Record<string, string> = Object.fromEntries(getCartsState().carts.map(c => [c.id, c.stage]));
subscribeCarts(() => {
  const { carts } = getCartsState();
  const resolved = { ...lifecycle.resolved };
  carts.forEach(c => {
    const before = lastStages[c.id];
    if (before && before !== c.stage && c.stage === 'aguardando-rep') {
      c.lines.forEach(l => { resolved[`estoque-baixo-${l.productId}`] = Date.now(); });
      if (before === 'aguardando-voce') resolved[`aguardando-voce-${c.id}`] = Date.now();
    }
  });
  lastStages = Object.fromEntries(carts.map(c => [c.id, c.stage]));
  lifecycle = { ...lifecycle, resolved };
  emitLife();
});

// ---------------------------------------------------------------------------
// Resultado do motor
// ---------------------------------------------------------------------------
export interface RadarResult {
  /** Sinais em aberto (não dispensados, não adiados, não resolvidos), já ordenados (FR-104). */
  open: RadarSignal[];
  /** Resolvidos nas últimas 24 h ("Resolvido", depois saem do Radar). */
  resolved: RadarSignal[];
  /** Sinal principal por produto (independente do balde) — catálogo e página do produto. */
  byProduct: Record<string, RadarSignal | undefined>;
  critical: number;
  health: 'saudavel' | 'atencao' | 'em-risco';
  /** Candidatos ao Destaque da semana (S-05/S-07 de maior impacto primeiro). */
  destaques: RadarSignal[];
}

const sortSignals = (a: RadarSignal, b: RadarSignal) =>
  SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank || a.actByDays - b.actByDays || b.impact - a.impact;

function compute(carts: Cart[]): RadarResult {
  const all: RadarSignal[] = [];
  const byProduct: Record<string, RadarSignal | undefined> = {};

  // S-01 Pedido atrasado
  lateOrders.forEach(o => all.push({
    id: `pedido-atrasado-${o.orderId}`, type: 'pedido-atrasado', severity: 'critico', actByDays: 0,
    timeText: `${days(o.daysLate)} de atraso`,
    metric: `${days(o.daysLate)} de atraso`,
    subject: `Pedido #${o.orderId}`,
    context: `Previsão era ${o.originalForecast}, nova previsão ${o.newForecast} · ${o.reason}`,
    impact: o.value, ctaLabel: 'Ver pedido', cta: { kind: 'order', orderId: o.orderId },
    why: 'A data prevista de entrega do pedido já passou. O sinal sai do Radar quando o pedido for entregue.',
    updatedHoursAgo: o.updatedHoursAgo,
  }));

  // S-14 Boletos a vencer (mock): soma dos boletos que vencem nos próximos 7 dias
  const dueSoon = upcomingBills.filter(b => b.dueInDays >= 0 && b.dueInDays <= BILLS_WINDOW_DAYS).sort((a, b) => a.dueInDays - b.dueInDays);
  if (dueSoon.length > 0) {
    const next = dueSoon[0];
    const total = dueSoon.reduce((a, b) => a + b.amount, 0);
    all.push({
      id: 'boleto-a-vencer', type: 'boleto-a-vencer', severity: 'atencao', actByDays: next.dueInDays,
      timeText: next.dueInDays === 0 ? 'vence hoje' : `vence em ${days(next.dueInDays)}`,
      metric: formatCurrency(total),
      subject: `${dueSoon.length} ${dueSoon.length === 1 ? 'boleto vence' : 'boletos vencem'} nos próximos ${days(BILLS_WINDOW_DAYS)}`,
      context: `Próximo: ${formatCurrency(next.amount)} em ${ddmm(dateInDays(next.dueInDays))} · pedido #${next.orderId}, parcela ${next.installment}`,
      suggestion: 'Pague pelo PIX ou boleto em Pagamentos e Boletos',
      impact: total, ctaLabel: 'Ver boletos', cta: { kind: 'boletos' },
      why: `Soma dos boletos da loja com vencimento nos próximos ${days(BILLS_WINDOW_DAYS)}. A data de agir é o vencimento do primeiro boleto; pagar em dia evita juros e bloqueio de novos pedidos.`,
      updatedHoursAgo: 1,
    });
  }

  products.forEach(p => {
    const s = storeSku(p.id);
    if (!s) return; // BR-62: sem dados integrados, sem sinal (nunca zero)
    const primary = pickPrimary(productCandidates(p, s, carts));
    byProduct[p.id] = primary;
    if (primary) all.push(primary);
  });

  // S-06 Produtos em alta: 2+ produtos com Alta demanda
  const hot = Object.values(byProduct).filter((s): s is RadarSignal => s?.type === 'alta-demanda');
  if (hot.length >= 2) {
    const names = hot.map(h => productById(h.productId!)?.name ?? '');
    all.push({
      id: 'produtos-em-alta', type: 'produtos-em-alta', severity: 'oportunidade', actByDays: RADAR_PARAMS.actWindowDays['produtos-em-alta'],
      timeText: 'últimos 30 dias',
      metric: `${hot.length} produtos`,
      subject: 'Vendendo acima da média',
      context: `${names.slice(0, 2).join(', ')}${names.length > 2 ? ` e mais ${names.length - 2}` : ''} · na sua região, últimos 30 dias`,
      impact: hot.reduce((a, h) => a + h.impact, 0),
      ctaLabel: 'Ver todos', cta: { kind: 'catalog', radarFilter: 'alto-giro' },
      why: `${hot.length} produtos cresceram ${RADAR_PARAMS.highDemandPct}% ou mais na sua região nos últimos 30 dias.`,
      updatedHoursAgo: 2,
    });
  }

  const mine = carts.filter(c => c.clientId === 'CLI-001' && isOpen(c));

  // S-10 Fechamento
  const withItems = mine.filter(c => c.lines.length > 0 && (cartStatus(c) === 'rascunho' || cartStatus(c) === 'pronto'));
  if (withItems.length > 0) {
    all.push({
      id: 'fechamento', type: 'fechamento', severity: 'informacao', actByDays: RADAR_PARAMS.actWindowDays.fechamento,
      timeText: 'antes de fechar',
      metric: `${withItems.length} ${withItems.length === 1 ? 'carrinho aberto' : 'carrinhos abertos'}`,
      subject: 'Compare com o ano passado',
      context: 'Confira o "Antes de fechar" de cada carrinho antes de enviar',
      impact: withItems.reduce((a, c) => a + c.lines.reduce((x, l) => x + pairsOf(l.sizes) * (productById(l.productId)?.price ?? 0), 0), 0),
      ctaLabel: 'Ver carrinhos', cta: { kind: 'carts' },
      why: 'Há carrinhos com itens ainda não enviados. No carrinho, o bloco "Antes de fechar" compara cada produto com o mesmo período do ano passado e confere o mix.',
      updatedHoursAgo: 0,
    });
  }

  // S-11 Aguardando você
  mine.filter(c => c.stage === 'aguardando-voce').forEach(c => {
    const waiting = Math.floor((Date.now() - new Date(c.stageSince).getTime()) / 86_400_000);
    const late = waiting >= RADAR_PARAMS.waitingAttentionDays;
    all.push({
      id: `aguardando-voce-${c.id}`, type: 'aguardando-voce', severity: late ? 'atencao' : 'informacao',
      actByDays: late ? 0 : RADAR_PARAMS.waitingAttentionDays - waiting,
      timeText: waiting === 0 ? 'desde hoje' : `esperando há ${days(waiting)}`,
      metric: pairsText(cartPairs(c)),
      subject: `${repFirstName(c.rep)} sugeriu ${c.cartName}`,
      context: waiting === 0 ? 'Esperando sua revisão' : `Esperando sua revisão há ${days(waiting)}`,
      impact: c.lines.reduce((x, l) => x + pairsOf(l.sizes) * (productById(l.productId)?.price ?? 0), 0),
      ctaLabel: 'Revisar e aprovar', cta: { kind: 'cart', cartId: c.id },
      why: `O representante montou ou editou este carrinho e ele espera a sua aprovação. Depois de ${days(RADAR_PARAMS.waitingAttentionDays)} o aviso passa para Atenção.`,
      updatedHoursAgo: 0,
    });
  });

  const nowMs = Date.now();
  const isHidden = (s: RadarSignal) =>
    !!lifecycle.dismissed[s.id] || (lifecycle.snoozed[s.id] ?? 0) > nowMs;
  const resolvedAt = (s: RadarSignal) => lifecycle.resolved[s.id];
  const resolved = all.filter(s => resolvedAt(s) && nowMs - resolvedAt(s) < 86_400_000);
  const open = all.filter(s => !isHidden(s) && !resolvedAt(s) && bucketOf(s.actByDays) !== null).sort(sortSignals);
  const critical = open.filter(isCritical).length;
  const health = critical === 0 ? 'saudavel' : critical <= 2 ? 'atencao' : 'em-risco';

  // Destaque da semana: Alta demanda / Oportunidade perdida de maior impacto (a tela tira o que já está no balde aberto)
  const destaques = open
    .filter(s => s.type === 'alta-demanda' || s.type === 'oportunidade-perdida')
    .sort((a, b) => b.impact - a.impact);

  return { open, resolved, byProduct, critical, health, destaques };
}

// Cache: recalcula só quando carrinhos ou ciclo de vida mudam (useSyncExternalStore exige referência estável)
let cache: RadarResult | null = null;
let cacheCarts: Cart[] | null = null;
export function getRadar(): RadarResult {
  const { carts } = getCartsState();
  if (!cache || cacheCarts !== carts) {
    cache = compute(carts);
    cacheCarts = carts;
  }
  return cache;
}
const subscribeRadar = (l: () => void) => {
  lifeListeners.add(l);
  const off = subscribeCarts(l);
  return () => { lifeListeners.delete(l); off(); };
};
export function useRadar(): RadarResult {
  return useSyncExternalStore(subscribeRadar, getRadar);
}

// ---------------------------------------------------------------------------
// Consultas usadas pelas telas
// ---------------------------------------------------------------------------
/** BR-33: "Mais vendida" só no top 3 da rede, e nunca em produto parado na loja (BR-32). */
const topSellerIds = [...products].sort((a, b) => b.soldUnits - a.soldUnits).slice(0, RADAR_PARAMS.topSellersCount).map(p => p.id);
export function isTopSeller(productId: string, radar: RadarResult): boolean {
  const t = radar.byProduct[productId]?.type;
  return topSellerIds.includes(productId) && t !== 'sem-giro' && t !== 'giro-baixo';
}

export function matchesRadarFilter(p: Product, filter: RadarFilter, radar: RadarResult): boolean {
  if (filter === 'boa-margem') return isGoodMargin(p);
  return radar.byProduct[p.id]?.type === FILTER_SIGNAL[filter];
}

/** Não sugere em gaveta/combos produto parado na loja (BR-35). */
export const isStuck = (productId: string, radar: RadarResult) => {
  const t = radar.byProduct[productId]?.type;
  return t === 'sem-giro' || t === 'giro-baixo';
};

/** "Por que comprar" (FR-303): só razões com dados do motor, cada uma com escopo e período. */
export function buyReasons(p: Product): string[] {
  const s = storeSku(p.id);
  if (!s) return [];
  const out: string[] = [];
  if (s.regionalGrowthPct > 0) out.push(`+${s.regionalGrowthPct}% de vendas na sua região, últimos 30 dias`);
  if (s.peerStoresSelling > 0) out.push(`Vende em ${s.peerStoresSelling} de ${PEER_GROUP_SIZE} lojas parecidas, últimos 90 dias`);
  const cov = coverageDays(s);
  if (s.inMix && cov !== null) out.push(`Sua loja vende ${s.dailySales.toLocaleString('pt-BR')} par/dia · cobertura de ${days(Math.floor(cov))}, últimos 30 dias`);
  if (s.peerSalesDiffPct >= RADAR_PARAMS.benchmarkPct) out.push(`Lojas parecidas venderam ${s.peerSalesDiffPct}% mais que a sua loja, últimos 30 dias`);
  if (topSellerIds.includes(p.id)) out.push(`Entre os ${RADAR_PARAMS.topSellersCount} mais vendidos da rede, últimos 30 dias`);
  return out;
}

/** S-12: produtos do carrinho com menos pares que o mesmo período do ano passado. */
export function belowLastYear(cart: Cart): { productId: string; now: number; lastYear: number }[] {
  return cart.lines
    .map(l => ({ productId: l.productId, now: pairsOf(l.sizes), lastYear: storeSku(l.productId)?.lastYearPairs ?? 0 }))
    .filter(r => r.lastYear > r.now);
}

/** S-13: públicos abaixo do alvo do perfil da loja no carrinho. */
export function mixCheck(cart: Cart, radar: RadarResult): { segment: Product['segment']; share: number; target: number; suggestions: Product[] }[] {
  const total = cartPairs(cart);
  if (total === 0) return [];
  const inCart = new Set(cart.lines.map(l => l.productId));
  return (Object.keys(STORE_MIX_TARGET) as Product['segment'][])
    .map(segment => {
      const n = cart.lines.filter(l => productById(l.productId)?.segment === segment).reduce((a, l) => a + pairsOf(l.sizes), 0);
      const share = Math.round((n / total) * 100);
      return { segment, share, target: STORE_MIX_TARGET[segment] };
    })
    .filter(r => r.share < r.target - RADAR_PARAMS.mixGapPoints)
    .map(r => ({
      ...r,
      suggestions: products.filter(p => p.segment === r.segment && !inCart.has(p.id) && !isStuck(p.id, radar)).slice(0, 3),
    }));
}

/** Sugestões da gaveta (FR-406): S-02, S-05, S-07, S-08 e S-13; nunca parados nem já no carrinho. */
export function drawerSuggestions(cart: Cart | null, radar: RadarResult): { product: Product; reason: string }[] {
  const inCart = new Set(cart?.lines.map(l => l.productId) ?? []);
  const fromSignals = products
    .map(p => ({ p, s: radar.byProduct[p.id] }))
    .filter(({ p, s }) => s && ['estoque-baixo', 'alta-demanda', 'oportunidade-perdida', 'lancamento'].includes(s.type) && !inCart.has(p.id))
    .sort((a, b) => sortSignals(a.s!, b.s!))
    .map(({ p, s }) => ({ product: p, reason: `${SIGNAL_META[s!.type].label} · ${s!.type === 'estoque-baixo' ? s!.timeText : s!.context}` }));
  const fromMix = cart ? mixCheck(cart, radar).flatMap(m => m.suggestions.map(p => ({ product: p, reason: `Completa o mix: ${m.segment.toLowerCase()} ${m.share}% (ideal ${m.target}%)` }))) : [];
  const seen = new Set<string>();
  return [...fromSignals, ...fromMix].filter(x => (seen.has(x.product.id) ? false : (seen.add(x.product.id), true))).slice(0, 4);
}

/** Grade sugerida para um produto (BR-21): pela quantidade do sinal, dividida pela curva. */
export function suggestedGrade(p: Product, radar: RadarResult): { sizes: Record<string, number>; curve: 'loja' | 'regional'; qty: number } | null {
  const sig = radar.byProduct[p.id];
  if (!sig || isStuck(p.id, radar)) return null;
  const qty = sig.suggestedQty ?? (sig.type === 'alta-demanda' || sig.type === 'oportunidade-perdida' || sig.type === 'lancamento' ? 24 : 0);
  if (qty <= 0) return null;
  const { sizes, curve } = splitBySizeCurve(p, qty);
  return { sizes, curve, qty: pairsOf(sizes) };
}

export const formatImpact = (v: number) => (v > 0 ? formatCurrency(v) : '');
