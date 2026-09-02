import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type Period = 'dia' | 'semana' | 'mes' | 'trimestre' | 'ano';

interface SalesEntity {
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

export function getRepEntities(repName: string): SalesEntity[] {
  return salesEntities.filter(e => e.role === 'preposto' && e.parentRep === repName);
}

export function getNetworkMonthlyTotal(): number {
  return salesEntities.filter(e => e.role === 'representante').reduce((sum, e) => sum + e.monthlySales, 0);
}

export function getRepMonthlyTotal(repName: string): number {
  return salesEntities.find(e => e.role === 'representante' && e.name === repName)?.monthlySales ?? 0;
}

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mês' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'ano', label: 'Ano' },
];

const periodConfig: Record<Period, { multiplier: number; labels: string[] }> = {
  dia: { multiplier: 1 / 22, labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] },
  semana: { multiplier: 1 / 4.3, labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'] },
  mes: { multiplier: 1, labels: ['Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'] },
  trimestre: { multiplier: 3, labels: ['T1', 'T2', 'T3', 'T4'] },
  ano: { multiplier: 12, labels: ['2023', '2024', '2025', '2026'] },
};

const brl = (n: number) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

function formatAxisValue(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}mi`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
  return `${v}`;
}

function scaleValue(monthlyBase: number, period: Period): number {
  return Math.round(monthlyBase * periodConfig[period].multiplier);
}

function buildSeries(monthlyBase: number, period: Period) {
  const { multiplier, labels } = periodConfig[period];
  const base = monthlyBase * multiplier;
  return labels.map((label, i) => {
    const wobble = Math.sin(i * 1.3) * 0.08 + Math.cos(i * 0.6) * 0.05;
    const trend = 1 + (i - labels.length / 2) * 0.02;
    return { label, value: Math.max(0, Math.round(base * (1 + wobble) * trend)) };
  });
}

export function SalesRankingSection({ scope, entities, totalMonthlyBase }: {
  scope: 'network' | 'own';
  entities: SalesEntity[];
  totalMonthlyBase: number;
}) {
  const [period, setPeriod] = useState<Period>('mes');
  const series = buildSeries(totalMonthlyBase, period);
  const ranked = entities
    .map(e => ({ ...e, value: scaleValue(e.monthlySales, period) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="bg-card border border-border rounded-xl p-5 lg:col-span-7">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {scope === 'network' ? 'Vendas da rede' : 'Minhas vendas'}
            </h3>
            <p className="text-muted-foreground mt-1" style={{ fontSize: '0.72rem' }}>
              Evolução no período selecionado
            </p>
          </div>
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
        <div className="mt-3">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatAxisValue} />
              <Tooltip formatter={(v: any) => [brl(v as number), 'Vendas']} />
              <Line type="monotone" dataKey="value" stroke="#111" strokeWidth={2} dot={{ r: 3, fill: '#111' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 lg:col-span-5">
        <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {scope === 'network' ? 'Ranking de vendas' : 'Ranking dos meus prepostos'}
        </h3>
        <p className="text-muted-foreground mt-1 mb-3" style={{ fontSize: '0.72rem' }}>
          {scope === 'network' ? 'Representantes e prepostos · maior para menor' : 'Prepostos vinculados · maior para menor'}
        </p>
        <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
          {ranked.map((e, i) => (
            <div key={e.id} className="flex items-center gap-3">
              <span className="text-muted-foreground w-4 text-right flex-shrink-0" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</span>
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
            <p className="text-muted-foreground text-center py-6" style={{ fontSize: '0.8rem' }}>Nenhum preposto vinculado</p>
          )}
        </div>
      </div>
    </div>
  );
}
