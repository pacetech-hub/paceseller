import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  WarningIcon,
  TrendDownIcon,
  TrendUpIcon,
  LightningIcon,
  ArrowsClockwiseIcon,
  ChartBarIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { selloutData, regionData, topProducts, formatCurrency } from "../data/mockData";

const encalheAlerts = [
  { product: 'Mocassim Couro Trançado', sku: 'TCF-2026-003', stock: 240, diasEstoque: 62, region: 'Sul', action: 'Sugerir desconto' },
  { product: 'Derby Casual Urban', sku: 'TCF-2026-002', stock: 180, diasEstoque: 54, region: 'Nordeste', action: 'Redistribuir estoque' },
  { product: 'Sandália Slide Premium', sku: 'TCF-2026-006', stock: 420, diasEstoque: 78, region: 'Centro-Oeste', action: 'Campanha urgente' },
  { product: 'Tênis Vulcanizado', sku: 'TCF-2026-008', stock: 96, diasEstoque: 45, region: 'Norte', action: 'Reposicionamento' },
];

const stockByLine = [
  { name: 'Premium', sellIn: 580000, sellOut: 520000, giro: 89.6 },
  { name: 'Urban', sellIn: 420000, sellOut: 390000, giro: 92.8 },
  { name: 'Sport', sellIn: 680000, sellOut: 650000, giro: 95.6 },
];

const pieData = [
  { name: 'Vendido', value: 2860000, color: 'oklch(0.6 0.22 262)' },
  { name: 'Estoque', value: 140000, color: '#d1d5db' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-muted-foreground mb-1" style={{ fontSize: '0.72rem' }}>{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color, fontSize: '0.8rem', fontWeight: 600 }}>
          {entry.name}: {entry.value > 1000 ? formatCurrency(entry.value) : `${entry.value}%`}
        </p>
      ))}
    </div>
  );
};

export function SelloutDashboard() {
  const selloutRate = 95.3;
  const overstockValue = 140000;
  const avgDays = 28;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Taxa de Sell-out', value: `${selloutRate}%`, sub: 'Coleção Inverno 2026',
            trend: 'up', trendVal: '+2,1%', color: 'text-emerald-400',
          },
          {
            label: 'Estoque Parado', value: formatCurrency(overstockValue), sub: 'valor em encalhe',
            trend: 'down', trendVal: '-R$28k', color: 'text-red-400',
          },
          {
            label: 'Giro Médio', value: `${avgDays} dias`, sub: 'da produção à venda',
            trend: 'up', trendVal: '-3 dias', color: 'text-black',
          },
          {
            label: 'Alertas Ativos', value: '6', sub: 'produtos em encalhe',
            trend: 'down', trendVal: '-2 esta semana', color: 'text-amber-400',
          },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-5">
            <p className="text-muted-foreground mb-2" style={{ fontSize: '0.78rem', fontWeight: 500 }}>{kpi.label}</p>
            <p className={`text-foreground mono`} style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{kpi.value}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={kpi.color} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                {kpi.trend === 'up' ? <TrendUpIcon className="inline w-3 h-3 mr-0.5" /> : <TrendDownIcon className="inline w-3 h-3 mr-0.5" />}
                {kpi.trendVal}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sell-in x Sell-out trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Evolução Sell-in × Sell-out</h3>
              <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>Jan–Jun 2026 · em R$</p>
            </div>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: '0.75rem' }}>
              <DownloadSimpleIcon className="w-3.5 h-3.5" /> Exportar
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={selloutData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sellIn" name="Sell-in" fill="oklch(0.6 0.22 262)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="sellOut" name="Sell-out" fill="oklch(0.72 0.15 48)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'oklch(0.6 0.22 262)' }} />
              <span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Sell-in (faturado)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'oklch(0.72 0.15 48)' }} />
              <span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Sell-out (vendido)</span>
            </div>
          </div>
        </div>

        {/* Donut giro */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <h3 className="text-foreground mb-4" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Giro da Coleção</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius="60%" outerRadius="90%" dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-foreground" style={{ fontSize: '1.4rem', fontWeight: 700 }}>78%</span>
                <span className="text-muted-foreground" style={{ fontSize: '0.65rem' }}>girado</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{d.name}</span>
                </div>
                <span className="text-foreground mono" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance por linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-foreground mb-4" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Performance por Linha</h3>
          <div className="space-y-4">
            {stockByLine.map(line => (
              <div key={line.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{line.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground mono" style={{ fontSize: '0.72rem' }}>{formatCurrency(line.sellOut)}</span>
                    <span className={`${line.giro >= 90 ? 'text-emerald-400' : 'text-amber-400'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>{line.giro}%</span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-secondary">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${line.giro >= 95 ? 'bg-emerald-400' : line.giro >= 85 ? 'bg-primary' : 'bg-amber-400'}`}
                    style={{ width: `${line.giro}%`, transition: 'width 0.8s ease' }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>Sell-out: {formatCurrency(line.sellOut)}</span>
                  <span className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>Meta: {formatCurrency(line.sellIn)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-foreground mb-4" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sell-out por Região</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regionData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="region" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Receita" fill="oklch(0.6 0.22 262)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Encalhe Alerts */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <WarningIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Alertas de Encalhe</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
              {encalheAlerts.length} alertas
            </span>
          </div>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: '0.78rem' }}>
            <ArrowsClockwiseIcon className="w-3.5 h-3.5" /> Atualizar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Produto', 'SKU', 'Estoque (pares)', 'Dias parado', 'Região', 'Ação sugerida'].map(col => (
                  <th key={col} className="text-left pb-3 text-muted-foreground pr-4" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {encalheAlerts.map((alert, i) => (
                <tr key={i} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="py-3 pr-4">
                    <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{alert.product}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-muted-foreground mono" style={{ fontSize: '0.75rem' }}>{alert.sku}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-foreground mono" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{alert.stock}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`mono ${alert.diasEstoque > 60 ? 'text-red-400' : alert.diasEstoque > 45 ? 'text-amber-400' : 'text-foreground'}`}
                      style={{ fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      {alert.diasEstoque}d
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>{alert.region}</span>
                  </td>
                  <td className="py-3">
                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                      <LightningIcon className="w-3 h-3" /> {alert.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
