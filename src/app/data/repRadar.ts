import { useSyncExternalStore } from "react";
import { clients, formatCurrency, type Client } from "./mockData";
import { cartPairs, cartValue, getCartsState, isOpen, subscribeCarts, type Cart } from "./cartStore";
import { SEVERITY_META, bucketOf, days, pairsText, type CtaTarget, type Severity } from "./radar";

// Radar do representante, organizado em cartões temáticos. Tema 1: "Prioridades de contato" —
// quais clientes da carteira ligar primeiro e por quê. Uma prioridade por cliente (a de maior
// severidade); os outros motivos aparecem como "+N motivos". Dados de compra são mock; os
// parâmetros são padrões a confirmar com o comercial.

// ---------------------------------------------------------------------------
// Parâmetros
// ---------------------------------------------------------------------------
export const REP_RADAR_PARAMS = {
  /** Carrinho enviado pelo lojista vira Crítico depois de N dias sem resposta do representante. */
  repResponseDays: 2,
  /** Sugestão do representante sem resposta do lojista: lembrar depois de N dias. */
  lojistaNudgeDays: 3,
  /** Recompra atrasada: dias sem comprar acima do ciclo médio do cliente. */
  repurchaseLateRatio: 1.1,
  /** Recompra crítica: dias sem comprar acima de N vezes o ciclo médio. */
  repurchaseCriticalRatio: 1.5,
  /** Queda de compras: abaixo de N% do mesmo período do ano passado. */
  dropPct: 20,
  /** Pós-venda: contato até N dias depois da entrega. */
  afterSaleDays: 7,
  /** Recompra prevista: contatar N dias antes do fim do ciclo médio. */
  repurchaseLeadDays: 5,
};

// ---------------------------------------------------------------------------
// Fatos por cliente (mock até integrar ERP/CRM)
// ---------------------------------------------------------------------------
interface ClientFacts {
  clientId: string;
  /** Dias desde o último pedido faturado. */
  daysSinceOrder: number;
  /** Ciclo médio de recompra do cliente, em dias. */
  cycleDays: number;
  /** Compras dos últimos 90 dias vs mesmo período do ano passado, em %. */
  yoyPct: number;
  /** Títulos vencidos. */
  overdue?: { value: number; days: number };
  /** Pedido entregue recentemente. */
  delivered?: { orderId: string; daysAgo: number };
  /** Produtos do cliente acabando na loja (sell-out integrado). */
  lowStockProducts?: string[];
  /** Melhor canal e horário (do histórico de contatos). */
  channel: string;
  /** Último contato registrado, em dias. */
  lastContactDays: number;
}

const FACTS: ClientFacts[] = [
  { clientId: 'CLI-001', daysSinceOrder: 21, cycleDays: 30, yoyPct: 8, channel: 'WhatsApp · manhã', lastContactDays: 1 },
  { clientId: 'CLI-005', daysSinceOrder: 34, cycleDays: 45, yoyPct: -12, overdue: { value: 3840, days: 12 }, channel: 'Telefone · tarde', lastContactDays: 18 },
  { clientId: 'CLI-009', daysSinceOrder: 38, cycleDays: 30, yoyPct: -4, channel: 'WhatsApp · tarde', lastContactDays: 9 },
  { clientId: 'CLI-010', daysSinceOrder: 16, cycleDays: 40, yoyPct: 3, delivered: { orderId: 'PED-2026-0398', daysAgo: 4 }, channel: 'E-mail', lastContactDays: 6 },
  { clientId: 'CLI-011', daysSinceOrder: 27, cycleDays: 35, yoyPct: -28, channel: 'Telefone · manhã', lastContactDays: 22 },
  { clientId: 'CLI-012', daysSinceOrder: 56, cycleDays: 35, yoyPct: -15, channel: 'Visita · terça e quinta', lastContactDays: 31 },
  { clientId: 'CLI-013', daysSinceOrder: 24, cycleDays: 30, yoyPct: 12, lowStockProducts: ['Coil', 'Flow XL', 'Hertz'], channel: 'WhatsApp · manhã', lastContactDays: 12 },
  { clientId: 'CLI-014', daysSinceOrder: 145, cycleDays: 45, yoyPct: -100, overdue: { value: 2150, days: 64 }, channel: 'Telefone · manhã', lastContactDays: 60 },
  { clientId: 'CLI-015', daysSinceOrder: 12, cycleDays: 40, yoyPct: 6, channel: 'WhatsApp · tarde', lastContactDays: 3 },
  { clientId: 'CLI-016', daysSinceOrder: 30, cycleDays: 28, yoyPct: 2, channel: 'E-mail', lastContactDays: 14 },
];

// ---------------------------------------------------------------------------
// Motivos de contato
// ---------------------------------------------------------------------------
export type ContactReason =
  | 'carrinho-esperando' | 'cobranca' | 'recompra-atrasada' | 'queda-compras'
  | 'reativacao' | 'sugestao-sem-resposta' | 'reposicao-cliente' | 'pos-venda' | 'recompra-prevista';

export const CONTACT_REASON_META: Record<ContactReason, { code: string; label: string }> = {
  'carrinho-esperando': { code: 'C-01', label: 'Carrinho esperando você' },
  cobranca: { code: 'C-02', label: 'Título vencido' },
  'recompra-atrasada': { code: 'C-03', label: 'Recompra atrasada' },
  'queda-compras': { code: 'C-04', label: 'Queda de compras' },
  reativacao: { code: 'C-05', label: 'Reativação' },
  'sugestao-sem-resposta': { code: 'C-06', label: 'Sugestão sem resposta' },
  'reposicao-cliente': { code: 'C-07', label: 'Estoque acabando no cliente' },
  'pos-venda': { code: 'C-08', label: 'Pós-venda' },
  'recompra-prevista': { code: 'C-09', label: 'Recompra prevista' },
};

/** Desempate entre motivos de mesma severidade. */
const REASON_PRIORITY: ContactReason[] = [
  'carrinho-esperando', 'cobranca', 'recompra-atrasada', 'reativacao', 'queda-compras',
  'reposicao-cliente', 'sugestao-sem-resposta', 'pos-venda', 'recompra-prevista',
];

export interface ContactPriority {
  id: string;
  reason: ContactReason;
  severity: Severity;
  clientId: string;
  clientName: string;
  /** Prazo para contatar, em dias a partir de hoje (≤ 0 = hoje). */
  actByDays: number;
  timeText: string;
  metric: string;
  context: string;
  /** O que falar / oferecer no contato. */
  suggestion: string;
  channel: string;
  impact: number;
  ctaLabel: string;
  cta: CtaTarget;
  why: string;
  updatedHoursAgo: number;
  /** Outros motivos do mesmo cliente que não viraram cartão. */
  otherReasons: ContactReason[];
}

type Candidate = Omit<ContactPriority, 'clientName' | 'channel' | 'otherReasons'>;

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

function candidates(client: Client, f: ClientFacts, carts: Cart[]): Candidate[] {
  const out: Candidate[] = [];
  const base = { clientId: client.id, updatedHoursAgo: 2 };
  const toClient: CtaTarget = { kind: 'client', clientId: client.id };
  const P = REP_RADAR_PARAMS;

  // C-01 Carrinho enviado pelo lojista esperando o representante
  carts.filter(c => c.clientId === client.id && c.stage === 'aguardando-rep').forEach(c => {
    const waiting = daysSince(c.stageSince);
    const late = waiting >= P.repResponseDays;
    out.push({
      ...base, id: `carrinho-esperando-${c.id}`, reason: 'carrinho-esperando',
      severity: late ? 'critico' : 'atencao', actByDays: late ? 0 : P.repResponseDays - waiting,
      timeText: waiting === 0 ? 'enviado hoje' : `esperando há ${days(waiting)}`,
      metric: pairsText(cartPairs(c)),
      context: `${c.cartName} · ${formatCurrency(cartValue(c))} · enviado pelo lojista`,
      suggestion: 'Confirme condições e libere para pagamento',
      impact: cartValue(c), ctaLabel: 'Revisar carrinho', cta: { kind: 'cart', cartId: c.id },
      why: `O lojista enviou este carrinho para você revisar. Depois de ${days(P.repResponseDays)} sem resposta o aviso vira Crítico — é venda pronta parada.`,
      updatedHoursAgo: 0,
    });
  });

  // C-06 Sugestão do representante parada com o lojista
  carts.filter(c => c.clientId === client.id && c.stage === 'aguardando-voce').forEach(c => {
    const waiting = daysSince(c.stageSince);
    if (waiting < P.lojistaNudgeDays) return;
    out.push({
      ...base, id: `sugestao-sem-resposta-${c.id}`, reason: 'sugestao-sem-resposta',
      severity: 'atencao', actByDays: 0,
      timeText: `sem resposta há ${days(waiting)}`,
      metric: `${days(waiting)} parado`,
      context: `Sua sugestão ${c.cartName} · ${pairsText(cartPairs(c))} · ${formatCurrency(cartValue(c))}`,
      suggestion: 'Ligue para revisar a sugestão junto com o lojista',
      impact: cartValue(c), ctaLabel: 'Ver carrinho', cta: { kind: 'cart', cartId: c.id },
      why: `Você montou este carrinho e ele espera a aprovação do lojista há mais de ${days(P.lojistaNudgeDays)}. Um contato costuma destravar a decisão.`,
      updatedHoursAgo: 0,
    });
  });

  // C-02 Título vencido: cobrar antes do próximo pedido
  if (f.overdue) {
    out.push({
      ...base, id: `cobranca-${client.id}`, reason: 'cobranca',
      severity: 'critico', actByDays: 0,
      timeText: `vencido há ${days(f.overdue.days)}`,
      metric: formatCurrency(f.overdue.value),
      context: `Em aberto há ${days(f.overdue.days)} · novos pedidos ficam bloqueados`,
      suggestion: 'Ofereça a 2ª via ou renegociação',
      impact: f.overdue.value, ctaLabel: 'Ver cliente', cta: toClient,
      why: 'O cliente tem título vencido. Enquanto não regularizar, novos pedidos ficam bloqueados pelo financeiro.',
    });
  }

  // C-05 Reativação: cliente inativo
  if (client.status === 'inativo') {
    out.push({
      ...base, id: `reativacao-${client.id}`, reason: 'reativacao',
      severity: 'atencao', actByDays: 7,
      timeText: `sem comprar há ${days(f.daysSinceOrder)}`,
      metric: `${days(f.daysSinceOrder)}`,
      context: `Sem comprar desde o último pedido · já comprou ${formatCurrency(client.totalPurchased)}`,
      suggestion: 'Apresente os lançamentos da coleção',
      impact: client.totalPurchased / 4, ctaLabel: 'Ver cliente', cta: toClient,
      why: 'O cliente está inativo na carteira. Clientes reativados nos primeiros 6 meses voltam ao ciclo normal com mais facilidade.',
    });
  } else {
    // C-03 Recompra atrasada: passou do ciclo médio
    const ratio = f.daysSinceOrder / f.cycleDays;
    if (ratio >= P.repurchaseLateRatio) {
      const critical = ratio >= P.repurchaseCriticalRatio;
      out.push({
        ...base, id: `recompra-atrasada-${client.id}`, reason: 'recompra-atrasada',
        severity: critical ? 'critico' : 'atencao', actByDays: critical ? 0 : 3,
        timeText: `${days(f.daysSinceOrder - f.cycleDays)} além do ciclo`,
        metric: `${days(f.daysSinceOrder)} sem comprar`,
        context: `Costuma comprar a cada ${days(f.cycleDays)}`,
        suggestion: 'Proponha a reposição dos mais vendidos',
        impact: Math.round(client.totalPurchased / 12), ctaLabel: 'Ver cliente', cta: toClient,
        why: `O cliente passou do ciclo médio de recompra (${days(f.cycleDays)}). Acima de ${Math.round(P.repurchaseCriticalRatio * 100)}% do ciclo o aviso vira Crítico.`,
      });
    } else {
      // C-09 Recompra prevista: o ciclo médio termina em breve — contatar alguns dias antes
      const left = f.cycleDays - f.daysSinceOrder;
      out.push({
        ...base, id: `recompra-prevista-${client.id}`, reason: 'recompra-prevista',
        severity: 'informacao', actByDays: Math.max(1, left - P.repurchaseLeadDays),
        timeText: left > 0 ? `ciclo termina em ${days(left)}` : 'ciclo terminando',
        metric: left > 0 ? `em ${days(left)}` : 'agora',
        context: `Costuma comprar a cada ${days(f.cycleDays)} · último pedido há ${days(f.daysSinceOrder)}`,
        suggestion: 'Antecipe a sugestão do próximo pedido',
        impact: Math.round(client.totalPurchased / 12), ctaLabel: 'Ver cliente', cta: toClient,
        why: `A próxima compra deste cliente é esperada pelo ciclo médio de ${days(f.cycleDays)}. O aviso aparece ${days(P.repurchaseLeadDays)} antes para você chegar primeiro.`,
      });
    }
  }

  // C-04 Queda de compras vs ano passado
  if (client.status === 'ativo' && f.yoyPct <= -P.dropPct) {
    out.push({
      ...base, id: `queda-compras-${client.id}`, reason: 'queda-compras',
      severity: 'atencao', actByDays: 5,
      timeText: 'últimos 90 dias',
      metric: `${f.yoyPct}%`,
      context: 'Comprou menos que no mesmo período do ano passado',
      suggestion: 'Entenda o motivo e revise o mix com o lojista',
      impact: Math.round(client.totalPurchased * Math.abs(f.yoyPct) / 400), ctaLabel: 'Ver cliente', cta: toClient,
      why: `As compras dos últimos 90 dias estão ${Math.abs(f.yoyPct)}% abaixo do mesmo período do ano passado (limite: ${P.dropPct}%).`,
    });
  }

  // C-07 Estoque acabando na loja do cliente (sell-out)
  if (f.lowStockProducts?.length) {
    const n = f.lowStockProducts.length;
    out.push({
      ...base, id: `reposicao-cliente-${client.id}`, reason: 'reposicao-cliente',
      severity: 'oportunidade', actByDays: 4,
      timeText: 'acabando em até 15 dias',
      metric: `${n} ${n === 1 ? 'produto' : 'produtos'}`,
      context: `${f.lowStockProducts.slice(0, 2).join(', ')}${n > 2 ? ` e mais ${n - 2}` : ''} acabando na loja`,
      suggestion: 'Monte uma sugestão de reposição',
      impact: Math.round(client.totalPurchased / 10), ctaLabel: 'Ver cliente', cta: toClient,
      why: 'O sell-out integrado mostra produtos com cobertura menor que o prazo de entrega na loja do cliente.',
    });
  }

  // C-08 Pós-venda: pedido entregue há poucos dias
  if (f.delivered && f.delivered.daysAgo <= P.afterSaleDays) {
    out.push({
      ...base, id: `pos-venda-${f.delivered.orderId}`, reason: 'pos-venda',
      severity: 'informacao', actByDays: P.afterSaleDays - f.delivered.daysAgo,
      timeText: 'primeira semana após a entrega',
      metric: `há ${days(f.delivered.daysAgo)}`,
      context: `Pedido #${f.delivered.orderId} entregue · confirme o recebimento e a exposição na loja`,
      suggestion: 'Envie o kit de marketing da coleção',
      impact: 0, ctaLabel: 'Ver cliente', cta: toClient,
      why: `Pedido entregue há ${days(f.delivered.daysAgo)}. Um contato de pós-venda na primeira semana aumenta a recompra.`,
    });
  }

  return out;
}

const sortCandidates = (a: Candidate, b: Candidate) =>
  SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank ||
  a.actByDays - b.actByDays ||
  REASON_PRIORITY.indexOf(a.reason) - REASON_PRIORITY.indexOf(b.reason);

// ---------------------------------------------------------------------------
// Ciclo de vida: contatado (resolvido) e adiado
// ---------------------------------------------------------------------------
interface ContactLifecycle {
  contacted: Record<string, number>;
  snoozed: Record<string, number>;
}
let lifecycle: ContactLifecycle = { contacted: {}, snoozed: {} };
const listeners = new Set<() => void>();
const emit = () => { cache = null; listeners.forEach(l => l()); };

export function markContacted(id: string) {
  lifecycle = { ...lifecycle, contacted: { ...lifecycle.contacted, [id]: Date.now() } };
  emit();
}
export function snoozeContact(id: string, forDays: number) {
  lifecycle = { ...lifecycle, snoozed: { ...lifecycle.snoozed, [id]: Date.now() + forDays * 86_400_000 } };
  emit();
}
export function undoContactAction(id: string) {
  const { [id]: _c, ...contacted } = lifecycle.contacted;
  const { [id]: _s, ...snoozed } = lifecycle.snoozed;
  lifecycle = { contacted, snoozed };
  emit();
}

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------
export interface RepRadarResult {
  /** Prioridades de contato em aberto, uma por cliente, já ordenadas. */
  contacts: ContactPriority[];
  /** Marcados como contatados nas últimas 24 h. */
  contacted: ContactPriority[];
  urgent: number;
  /** Valor em jogo nos contatos em aberto. */
  impact: number;
}

function compute(repName: string, carts: Cart[]): RepRadarResult {
  const now = Date.now();
  const openCarts = carts.filter(isOpen);
  const all: ContactPriority[] = [];
  clients.filter(c => c.rep === repName).forEach(client => {
    const f = FACTS.find(x => x.clientId === client.id);
    if (!f) return; // sem dados integrados, sem cartão
    const cands = candidates(client, f, openCarts).sort(sortCandidates);
    const [primary, ...rest] = cands;
    if (!primary) return;
    all.push({
      ...primary,
      clientName: client.name,
      channel: f.channel,
      otherReasons: [...new Set(rest.map(r => r.reason))].filter(r => r !== primary.reason),
    });
  });

  const contactedAt = (p: ContactPriority) => lifecycle.contacted[p.id];
  // além de 30 dias o contato não entra no Radar (mesmos baldes do lojista)
  const contacts = all
    .filter(p => !contactedAt(p) && (lifecycle.snoozed[p.id] ?? 0) <= now && bucketOf(p.actByDays) !== null)
    .sort(sortCandidates);
  const contacted = all.filter(p => contactedAt(p) && now - contactedAt(p) < 86_400_000);
  return {
    contacts,
    contacted,
    urgent: contacts.filter(p => p.severity === 'critico').length,
    impact: contacts.reduce((a, p) => a + p.impact, 0),
  };
}

let cache: RepRadarResult | null = null;
let cacheKey: { rep: string; carts: Cart[] } | null = null;
export function getRepRadar(repName: string): RepRadarResult {
  const { carts } = getCartsState();
  if (!cache || !cacheKey || cacheKey.rep !== repName || cacheKey.carts !== carts) {
    cache = compute(repName, carts);
    cacheKey = { rep: repName, carts };
  }
  return cache;
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  const off = subscribeCarts(l);
  return () => { listeners.delete(l); off(); };
};
export function useRepRadar(repName: string): RepRadarResult {
  return useSyncExternalStore(subscribe, () => getRepRadar(repName));
}
