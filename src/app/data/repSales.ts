import { clients, type Order } from "./mockData";
import { getRepTeamEntities } from "../components/SalesIndicatorsSection";

// Vendas do representante e do seu time (prepostos) por período, comparadas com o mesmo
// período do ano anterior. Pedidos são mock gerados de forma determinística (mesma semente,
// mesmos números) a partir de hoje, para que dia/semana/mês/trimestre/ano sejam coerentes entre si.

export type SalesPeriod = 'dia' | 'semana' | 'mes' | 'trimestre' | 'ano';

export const SALES_PERIODS: { value: SalesPeriod; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'ano', label: 'Ano' },
];

export interface SalesOrder {
  id: string;
  date: Date;
  clientId: string;
  clientName: string;
  sellerId: string;
  value: number;
  pairs: number;
  status: Order['status'];
}

// ---------------------------------------------------------------------------
// Geração determinística (mock até integrar o ERP)
// ---------------------------------------------------------------------------
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const yearBefore = (d: Date) => new Date(d.getFullYear() - 1, d.getMonth(), d.getDate());

function statusFor(ageDays: number, r: number): Order['status'] {
  if (r < 0.04) return 'cancelado';
  if (ageDays < 2) return 'em análise';
  if (ageDays < 8) return 'aprovado';
  if (ageDays < 20) return 'faturado';
  return 'entregue';
}

/** ~2 anos de pedidos do time, até hoje. No ano anterior o volume é ~12% menor (crescimento da carteira). */
function generateOrders(repName: string, today: Date): SalesOrder[] {
  const team = getRepTeamEntities(repName);
  // a produção do representante já inclui a dos prepostos: o peso dele é só a venda própria
  const prepostos = team.filter(e => e.role === 'preposto').reduce((a, e) => a + e.monthlySales, 0);
  const weight = (e: (typeof team)[number]) => (e.role === 'representante' ? Math.max(0, e.monthlySales - prepostos) : e.monthlySales);
  const totalWeight = team.reduce((a, e) => a + weight(e), 0);
  const portfolio = clients.filter(c => c.rep === repName && c.status === 'ativo');
  const rand = rng(20260107);
  const out: SalesOrder[] = [];
  const first = new Date(today.getFullYear() - 1, 0, 1);
  let seq = 0;
  for (let d = first; d <= today; d = addDays(d, 1)) {
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const lastYear = d.getFullYear() < today.getFullYear();
    const isToday = d.getTime() === today.getTime() || d.getTime() === yearBefore(today).getTime();
    // dias úteis: 1–4 pedidos; fim de semana: 0–1; hoje (e o mesmo dia do ano anterior) sempre tem movimento
    let n = weekend ? (rand() < 0.3 ? 1 : 0) : 1 + Math.floor(rand() * 4);
    if (isToday) n = Math.max(n, 2);
    for (let i = 0; i < n; i++) {
      if (lastYear && !isToday && rand() < 0.1) continue;
      // vendedor ponderado pela produção mensal (representante + prepostos)
      let pick = rand() * totalWeight;
      const seller = team.find(e => (pick -= weight(e)) < 0) ?? team[0];
      const client = portfolio[Math.floor(rand() * portfolio.length)];
      const value = Math.round((2500 + rand() * 12500) * (lastYear ? 0.97 : 1));
      const ageDays = Math.round((today.getTime() - d.getTime()) / 86_400_000);
      out.push({
        id: `PED-${d.getFullYear()}-${String(++seq).padStart(4, '0')}`,
        date: d,
        clientId: client.id,
        clientName: client.name,
        sellerId: seller.id,
        value,
        pairs: Math.round(value / (110 + rand() * 30)),
        status: statusFor(ageDays, rand()),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Janelas: período corrente até hoje vs. a mesma janela um ano antes
// ---------------------------------------------------------------------------
function windowStart(period: SalesPeriod, today: Date): Date {
  switch (period) {
    case 'dia': return today;
    case 'semana': return addDays(today, -((today.getDay() + 6) % 7)); // semana começa na segunda
    case 'mes': return new Date(today.getFullYear(), today.getMonth(), 1);
    case 'trimestre': return new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    case 'ano': return new Date(today.getFullYear(), 0, 1);
  }
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('pt-BR', opts);
function windowLabel(period: SalesPeriod, start: Date, end: Date): string {
  switch (period) {
    case 'dia': return fmt(end, { day: '2-digit', month: 'long', year: 'numeric' });
    case 'semana': return `${fmt(start, { day: '2-digit', month: '2-digit' })} a ${fmt(end, { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    case 'mes': return fmt(end, { month: 'long', year: 'numeric' });
    case 'trimestre': return `${Math.floor(end.getMonth() / 3) + 1}º trimestre de ${end.getFullYear()}`;
    case 'ano': return String(end.getFullYear());
  }
}

// ---------------------------------------------------------------------------
// Resumo
// ---------------------------------------------------------------------------
export interface SalesTotals { value: number; orders: number; pairs: number; ticket: number }
export interface SellerRow {
  id: string; name: string; role: 'representante' | 'preposto';
  value: number; orders: number; previous: number;
  /** % sobre o ano anterior; null sem base de comparação. */
  delta: number | null;
}
export interface SalesSummary {
  period: SalesPeriod;
  label: string;
  previousLabel: string;
  current: SalesTotals;
  previous: SalesTotals;
  sellers: SellerRow[];
  statusCounts: { status: Order['status']; count: number; value: number }[];
  recent: SalesOrder[];
}

const ORDER_STATUSES: Order['status'][] = ['em análise', 'aprovado', 'faturado', 'entregue', 'cancelado'];

/** Variação % (null quando não há base). */
export const deltaPct = (now: number, before: number): number | null =>
  before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null;

function totals(list: SalesOrder[]): SalesTotals {
  // cancelados não contam como venda
  const valid = list.filter(o => o.status !== 'cancelado');
  const value = valid.reduce((a, o) => a + o.value, 0);
  return { value, orders: valid.length, pairs: valid.reduce((a, o) => a + o.pairs, 0), ticket: valid.length ? Math.round(value / valid.length) : 0 };
}

const cache = new Map<string, { day: number; orders: SalesOrder[] }>();
function ordersFor(repName: string, today: Date) {
  const hit = cache.get(repName);
  if (hit && hit.day === today.getTime()) return hit.orders;
  const orders = generateOrders(repName, today);
  cache.set(repName, { day: today.getTime(), orders });
  return orders;
}

export function getSalesSummary(repName: string, period: SalesPeriod, now = new Date()): SalesSummary {
  const today = startOfDay(now);
  const all = ordersFor(repName, today);
  const start = windowStart(period, today);
  const prevStart = yearBefore(start);
  const prevEnd = yearBefore(today);
  const inRange = (o: SalesOrder, a: Date, b: Date) => o.date >= a && o.date <= b;
  const cur = all.filter(o => inRange(o, start, today));
  const prev = all.filter(o => inRange(o, prevStart, prevEnd));

  const sellers = getRepTeamEntities(repName).map(e => {
    const mine = totals(cur.filter(o => o.sellerId === e.id));
    const before = totals(prev.filter(o => o.sellerId === e.id));
    return { id: e.id, name: e.name, role: e.role, value: mine.value, orders: mine.orders, previous: before.value, delta: deltaPct(mine.value, before.value) };
  }).sort((a, b) => b.value - a.value);

  return {
    period,
    label: windowLabel(period, start, today),
    previousLabel: windowLabel(period, prevStart, prevEnd),
    current: totals(cur),
    previous: totals(prev),
    sellers,
    statusCounts: ORDER_STATUSES.map(status => {
      const list = cur.filter(o => o.status === status);
      return { status, count: list.length, value: list.reduce((a, o) => a + o.value, 0) };
    }),
    recent: [...cur].sort((a, b) => b.date.getTime() - a.date.getTime() || b.id.localeCompare(a.id)).slice(0, 5),
  };
}
