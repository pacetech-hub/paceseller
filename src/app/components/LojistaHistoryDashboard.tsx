import { useMemo, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendUpIcon,
  TrendDownIcon,
  PackageIcon,
  ShoppingBagIcon,
  TrophyIcon,
  CalendarBlankIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { selloutData, formatCurrency } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

interface Props {
  onNavigate: (view: View) => void;
}

// Mock: linhas mais vendidas por período do lojista
const linesByPeriod: Record<string, { name: string; units: number; revenue: number; growth: number; share: number }[]> = {
  '30d': [
    { name: 'Flow XL Denim', units: 142, revenue: 12760, growth: 22.4, share: 28 },
    { name: 'Coil Branco', units: 118, revenue: 11196, growth: 14.8, share: 23 },
    { name: 'Flow Preto', units: 96, revenue: 7680, growth: 9.2, share: 18 },
    { name: 'Hertz Marrom', units: 74, revenue: 6290, growth: -3.1, share: 14 },
    { name: 'Step Casual', units: 58, revenue: 4640, growth: 5.6, share: 11 },
  ],
  '90d': [
    { name: 'Flow XL Denim', units: 412, revenue: 37040, growth: 18.2, share: 26 },
    { name: 'Coil Branco', units: 380, revenue: 36050, growth: 12.6, share: 24 },
    { name: 'Flow XL Preto', units: 298, revenue: 26770, growth: 11.3, share: 19 },
    { name: 'Flow Preto', units: 260, revenue: 20800, growth: 7.4, share: 16 },
    { name: 'Hertz Marrom', units: 220, revenue: 18700, growth: 4.1, share: 15 },
  ],
  '6m': [
    { name: 'Flow XL Denim', units: 920, revenue: 82620, growth: 19.4, share: 27 },
    { name: 'Coil Branco', units: 810, revenue: 76870, growth: 14.2, share: 23 },
    { name: 'Flow XL Preto', units: 680, revenue: 61080, growth: 10.8, share: 19 },
    { name: 'Flow Preto', units: 590, revenue: 47200, growth: 8.6, share: 17 },
    { name: 'Hertz Marrom', units: 480, revenue: 40800, growth: 5.2, share: 14 },
  ],
};

const periods = [
  { id: '30d', label: 'Últimos 30 dias' },
  { id: '90d', label: 'Últimos 90 dias' },
  { id: '6m', label: 'Últimos 6 meses' },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-muted-foreground mb-1" style={{ fontSize: '0.72rem' }}>{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color, fontSize: '0.8rem', fontWeight: 600 }}>
          {e.name}: {formatCurrency(e.value)}
        </p>
      ))}
    </div>
  );
};

export function LojistaHistoryDashboard({ onNavigate }: Props) {
  const [period, setPeriod] = useState<'30d' | '90d' | '6m'>('90d');

  const lines = linesByPeriod[period];
  const maxRev = Math.max(...lines.map(l => l.revenue));

  // Reescala selloutData para a visão do lojista (valores menores)
  const chartData = useMemo(
    () => selloutData.map(d => ({
      month: d.month,
      'Sell-in': Math.round(d.sellIn / 18),
      'Sell-out': Math.round(d.sellOut / 18),
    })),
    [],
  );

  const totalSellIn = chartData.reduce((a, b) => a + b['Sell-in'], 0);
  const totalSellOut = chartData.reduce((a, b) => a + b['Sell-out'], 0);
  const selloutRate = ((totalSellOut / totalSellIn) * 100).toFixed(1);
  const totalUnits = lines.reduce((a, b) => a + b.units, 0);

  const kpis = [
    {
      label: 'Sell-in', value: formatCurrency(totalSellIn), sub: 'comprado da fábrica',
      icon: PackageIcon, trend: '+12,4%', up: true,
    },
    {
      label: 'Sell-out', value: formatCurrency(totalSellOut), sub: 'vendido na loja',
      icon: ShoppingBagIcon, trend: '+9,8%', up: true,
    },
    {
      label: 'Taxa de Sell-out', value: `${selloutRate}%`, sub: 'conversão de estoque',
      icon: TrendUpIcon, trend: '+2,1pp', up: true,
    },
    {
      label: 'Pares vendidos', value: totalUnits.toLocaleString('pt-BR'), sub: 'no período',
      icon: TrophyIcon, trend: '-1,3%', up: false,
    },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-foreground" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Histórico de Compras
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: '0.82rem' }}>
            Visão de sell-in × sell-out e linhas em destaque
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <CalendarBlankIcon className="w-3.5 h-3.5 text-muted-foreground ml-1.5" />
            {periods.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`px-3 py-1 rounded-md transition-colors ${period === p.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                style={{ fontSize: '0.74rem', fontWeight: 600 }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            style={{ fontSize: '0.78rem', fontWeight: 500 }}
          >
            <DownloadSimpleIcon className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          const TrendIcon = k.up ? TrendUpIcon : TrendDownIcon;
          return (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className={`flex items-center gap-1 ${k.up ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  <TrendIcon className="w-3 h-3" />
                  {k.trend}
                </div>
              </div>
              <p className="text-muted-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{k.label}</p>
              <p className="text-foreground mono" style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{k.value}</p>
              <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Sell-in x Sell-out chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-foreground" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Sell-in × Sell-out</p>
            <p className="text-muted-foreground" style={{ fontSize: '0.74rem' }}>Comparativo mensal</p>
          </div>
          <div className="flex items-center gap-3" style={{ fontSize: '0.72rem' }}>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Sell-in
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Sell-out
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.6 0.22 262)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="oklch(0.6 0.22 262)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '0.72rem' }} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '0.72rem' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Sell-in" stroke="oklch(0.6 0.22 262)" strokeWidth={2} fill="url(#gIn)" />
              <Area type="monotone" dataKey="Sell-out" stroke="#34d399" strokeWidth={2} fill="url(#gOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linhas em destaque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrophyIcon className="w-4 h-4 text-amber-400" />
              <p className="text-foreground" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Linhas mais vendidas</p>
            </div>
            <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{periods.find(p => p.id === period)?.label}</p>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={lines} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '0.7rem' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '0.72rem' }} width={110} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Receita" radius={[0, 6, 6, 0]}>
                  {lines.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#f59e0b' : 'oklch(0.6 0.22 262)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-foreground" style={{ fontSize: '0.95rem', fontWeight: 700 }}>Ranking</p>
            <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Top 5</p>
          </div>
          <div className="space-y-2.5">
            {lines.map((l, i) => (
              <div key={l.name} className={`p-3 rounded-lg border transition-colors ${i === 0 ? 'border-amber-400/40 bg-amber-400/5' : 'border-border bg-secondary/20'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-amber-400 text-background' : 'bg-secondary text-muted-foreground'}`} style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{l.name}</p>
                  </div>
                  <span className={`${l.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    {l.growth >= 0 ? '+' : ''}{l.growth}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground" style={{ fontSize: '0.72rem' }}>
                  <span>{l.units} pares</span>
                  <span className="mono text-foreground" style={{ fontWeight: 600 }}>{formatCurrency(l.revenue)}</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full ${i === 0 ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${(l.revenue / maxRev) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
