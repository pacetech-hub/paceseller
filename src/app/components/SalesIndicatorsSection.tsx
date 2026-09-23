import { useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { clients as allClients, type Client } from "../data/mockData";

export type Period = 'dia' | 'mes' | 'trimestre' | 'ano';

export interface SalesEntity {
  id: string;
  name: string;
  role: 'representante' | 'preposto';
  parentRep?: string;
  monthlySales: number;
}

// vendas mensais consolidadas por representante — já incluem a produção dos respectivos prepostos
const salesEntities: SalesEntity[] = [
  { id: 'rep-marcos', name: 'Marcos Andrade', role: 'representante', monthlySales: 524000 },
  { id: 'rep-carlos', name: 'Carlos Mendes', role: 'representante', monthlySales: 441000 },
  { id: 'rep-fernanda', name: 'Fernanda Lima', role: 'representante', monthlySales: 398000 },
  { id: 'rep-ana', name: 'Ana Santos', role: 'representante', monthlySales: 312000 },
  { id: 'prep-rafael', name: 'Rafael Souza', role: 'preposto', parentRep: 'Marcos Andrade', monthlySales: 145000 },
  { id: 'prep-juliana', name: 'Juliana Costa', role: 'preposto', parentRep: 'Marcos Andrade', monthlySales: 98000 },
  { id: 'prep-diego', name: 'Diego Martins', role: 'preposto', parentRep: 'Carlos Mendes', monthlySales: 128000 },
  { id: 'prep-patricia', name: 'Patrícia Nunes', role: 'preposto', parentRep: 'Carlos Mendes', monthlySales: 84000 },
  { id: 'prep-bruno', name: 'Bruno Alves', role: 'preposto', parentRep: 'Fernanda Lima', monthlySales: 112000 },
  { id: 'prep-camila', name: 'Camila Rocha', role: 'preposto', parentRep: 'Fernanda Lima', monthlySales: 76000 },
  { id: 'prep-lucas', name: 'Lucas Ferreira', role: 'preposto', parentRep: 'Ana Santos', monthlySales: 95000 },
  { id: 'prep-beatriz', name: 'Beatriz Lima', role: 'preposto', parentRep: 'Ana Santos', monthlySales: 61000 },
];

export function getNetworkEntities(): SalesEntity[] {
  return salesEntities;
}

// representante + seus prepostos — usado como "vendedores" do time do rep
export function getRepTeamEntities(repName: string): SalesEntity[] {
  return salesEntities.filter(e => e.name === repName || (e.role === 'preposto' && e.parentRep === repName));
}

export function getNetworkMonthlyTotal(): number {
  return salesEntities.filter(e => e.role === 'representante').reduce((sum, e) => sum + e.monthlySales, 0);
}

export function getRepMonthlyTotal(repName: string): number {
  return salesEntities.find(e => e.role === 'representante' && e.name === repName)?.monthlySales ?? 0;
}

export const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'mes', label: 'Mês' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'ano', label: 'Ano' },
];

const periodConfig: Record<Period, { multiplier: number; labels: string[] }> = {
  dia: { multiplier: 1 / 22, labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] },
  mes: { multiplier: 1, labels: ['Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'] },
  trimestre: { multiplier: 3, labels: ['T1', 'T2', 'T3', 'T4'] },
  ano: { multiplier: 12, labels: ['2023', '2024', '2025', '2026'] },
};

export const brl = (n: number) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

function formatAxisValue(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}mi`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
  return `${v}`;
}

export function scaleValue(monthlyBase: number, period: Period): number {
  return Math.round(monthlyBase * periodConfig[period].multiplier);
}

// série de evolução na granularidade do período: barras do ano corrente x linha do mesmo ciclo no ano anterior
function buildSeries(monthlyBase: number, period: Period) {
  const { multiplier, labels } = periodConfig[period];
  const base = monthlyBase * multiplier;
  return labels.map((label, i) => {
    const wobble = Math.sin(i * 1.3) * 0.08 + Math.cos(i * 0.6) * 0.05;
    const trend = 1 + (i - labels.length / 2) * 0.02;
    const current = Math.max(0, Math.round(base * (1 + wobble) * trend));
    const lyWobble = Math.sin(i * 0.9 + 1.7) * 0.16 + Math.cos(i * 1.6) * 0.07;
    const lastYear = Math.max(0, Math.round(current * (0.86 + lyWobble)));
    return { label, current, lastYear };
  });
}

const STATUS_CONFIG: { key: string; label: string; color: string; ratio: number; orderStatus: string }[] = [
  { key: 'analise', label: 'Em análise', color: '#f59e0b', ratio: 0.10, orderStatus: 'em análise' },
  { key: 'aprovado', label: 'Aprovado', color: '#111111', ratio: 0.40, orderStatus: 'aprovado' },
  { key: 'faturado', label: 'Faturado', color: '#3b82f6', ratio: 0.27, orderStatus: 'faturado' },
  { key: 'entregue', label: 'Entregue', color: '#8b5cf6', ratio: 0.18, orderStatus: 'entregue' },
  { key: 'cancelado', label: 'Cancelado', color: '#ef4444', ratio: 0.05, orderStatus: 'cancelado' },
];

// referência fixa de "hoje" usada só para o mock de recência de pedidos
const TODAY = new Date('2026-08-21T00:00:00');

function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((TODAY.getTime() - d.getTime()) / 86400000);
}

function seededFraction(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function seededPercent(seed: string, min: number, max: number): string {
  const v = min + seededFraction(seed) * (max - min);
  return `+${v.toFixed(1).replace('.', ',')}%`;
}

function formatCompactCurrency(v: number): string {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1).replace('.', ',')} mi`;
  if (v >= 1e3) return `R$ ${Math.round(v / 1e3)} mil`;
  return brl(v);
}

interface PriorityClient extends Client {
  reason: string;
}

function buildPriorityClients(pool: Client[]): PriorityClient[] {
  return pool
    .map(c => {
      const days = daysSince(c.lastOrder);
      let reason: string;
      if (days > 30) {
        reason = `Sem pedido há ${days} dias — oportunidade de reposição`;
      } else if (c.inadimplente) {
        reason = 'Pagamento em atraso — cobrar antes de novo pedido';
      } else if (c.status === 'inativo') {
        reason = 'Cliente inativo — retomar contato';
      } else {
        reason = 'Sem pedido recente — bom momento para nova oferta';
      }
      // prioriza recência: quanto mais dias sem pedido, maior a prioridade de contato
      return { ...c, reason, score: days };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

interface SalesIndicatorsSectionProps {
  scope: 'network' | 'own';
  entities: SalesEntity[];
  totalMonthlyBase: number;
  avgTicket: number;
  repName?: string;
  onNavigateClients: () => void;
  onOpenClient: (client: Client) => void;
  onOpenSalesTeam: () => void;
  onOpenStatus: (status: string) => void;
}

export function SalesIndicatorsSection({
  scope, entities, totalMonthlyBase, avgTicket, repName, onNavigateClients, onOpenClient, onOpenSalesTeam, onOpenStatus,
}: SalesIndicatorsSectionProps) {
  const [period, setPeriod] = useState<Period>('dia');

  const periodValue = scaleValue(totalMonthlyBase, period);
  const periodOrders = Math.max(1, Math.round(periodValue / avgTicket));
  const series = buildSeries(totalMonthlyBase, period);
  const statusRows = STATUS_CONFIG.map(s => ({ ...s, count: Math.max(0, Math.round(periodOrders * s.ratio)) }));

  const ranked = entities
    .map(e => ({ ...e, value: scaleValue(e.monthlySales, period) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const clientPool = scope === 'network' ? allClients : allClients.filter(c => c.rep === repName);
  const priorityClients = buildPriorityClients(clientPool);

  const ordersDelta = seededPercent(`orders-${scope}-${period}`, 5, 18);
  const financeDelta = seededPercent(`finance-${scope}-${period}`, 4, 15);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end flex-wrap gap-2">
        <div className="inline-flex flex-wrap rounded-lg bg-secondary p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className={`px-2.5 py-1 rounded-md transition-colors ${period === opt.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              style={{ fontSize: '0.7rem', fontWeight: 600 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* A + B */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-primary uppercase tracking-wider" style={{ fontSize: '0.66rem', fontWeight: 700 }}>Pedidos no período</p>
          <p className="text-foreground mono mt-1" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{periodOrders.toLocaleString('pt-BR')}</p>
          <p className="text-emerald-600 mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{ordersDelta}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-primary uppercase tracking-wider" style={{ fontSize: '0.66rem', fontWeight: 700 }}>Faturamento</p>
          <p className="text-foreground mono mt-1" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{formatCompactCurrency(periodValue)}</p>
          <p className="text-emerald-600 mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{financeDelta}</p>
        </div>
      </div>

      {/* C: gráfico de colunas x ano anterior + status dos pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-8">
          <h4 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Vendas vs. ano passado</h4>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.72rem' }}>Colunas do período atual · linha do mesmo ciclo no ano anterior</p>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatAxisValue} />
              <Tooltip formatter={(v: any, name: any) => [brl(v as number), name === 'current' ? 'Período atual' : 'Ano passado']} />
              <Legend formatter={(v: string) => v === 'current' ? 'Período atual' : 'Ano passado'} wrapperStyle={{ fontSize: '0.72rem' }} />
              <Bar dataKey="current" name="current" fill="#111" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="lastYear" name="lastYear" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-4">
          <h4 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Pedidos por status</h4>
          <p className="text-muted-foreground mt-0.5 mb-3" style={{ fontSize: '0.72rem' }}>{periodOrders.toLocaleString('pt-BR')} pedidos no período</p>
          <div className="space-y-1">
            {statusRows.map(s => (
              <button
                key={s.key}
                onClick={() => onOpenStatus(s.orderStatus)}
                className="w-full flex items-center gap-2 py-1 px-1.5 -mx-1.5 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                <span className="text-foreground flex-1 truncate text-left" style={{ fontSize: '0.8rem' }}>{s.label}</span>
                <span className="text-foreground mono" style={{ fontSize: '0.82rem', fontWeight: 700 }}>{s.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* D: top 10 vendedores */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h4 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Vendas por representante</h4>
          <button onClick={onOpenSalesTeam} className="text-primary flex-shrink-0" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
            Ver mais →
          </button>
        </div>
        <div className="space-y-2">
          {ranked.map((e, i) => (
            <div key={e.id} className="flex items-center gap-3">
              <span className="text-muted-foreground w-5 text-right flex-shrink-0" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{e.name}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: '0.68rem' }}>
                  {e.role === 'representante' ? 'Representante' : `Preposto de ${e.parentRep}`}
                </p>
              </div>
              <span className="text-foreground mono flex-shrink-0" style={{ fontSize: '0.82rem', fontWeight: 700 }}>{brl(e.value)}</span>
            </div>
          ))}
          {ranked.length === 0 && (
            <p className="text-muted-foreground text-center py-6" style={{ fontSize: '0.8rem' }}>Nenhum vendedor no período</p>
          )}
        </div>
      </div>

      {/* E: 5 clientes prioritários */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
          <h4 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Prioridade de contato</h4>
          <button onClick={onNavigateClients} className="text-primary flex-shrink-0" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
            Ver mais →
          </button>
        </div>
        <div className="mt-2 divide-y divide-border">
          {priorityClients.map(c => (
            <button
              key={c.id}
              onClick={() => onOpenClient(c)}
              className="w-full flex items-center gap-3 py-2.5 px-2 -mx-2 text-left rounded-lg hover:bg-primary/5 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.name}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: '0.72rem' }}>{c.reason}</p>
              </div>
              <CaretRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
          {priorityClients.length === 0 && (
            <p className="text-muted-foreground text-center py-6" style={{ fontSize: '0.8rem' }}>Nenhum cliente na carteira</p>
          )}
        </div>
      </div>
    </div>
  );
}
