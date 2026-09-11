import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ReferenceLine, Cell,
} from "recharts";
import { SalesIndicatorsSection, getNetworkEntities, getNetworkMonthlyTotal } from "./SalesIndicatorsSection";
import type { Client } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'stock';

interface DashboardAdminProps {
  onNavigate: (view: View) => void;
  onSelectClient: (client: Client) => void;
}

const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR');
const fmt = (n: number) => n.toLocaleString('pt-BR');

function Card({ title, hint, span = 12, children, right }: { title?: string; hint?: string; span?: number; children: React.ReactNode; right?: React.ReactNode }) {
  const colMap:Record<number,string>={3:'lg:col-span-3',4:'lg:col-span-4',5:'lg:col-span-5',6:'lg:col-span-6',7:'lg:col-span-7',8:'lg:col-span-8',9:'lg:col-span-9',12:'lg:col-span-12'};
  const colClass = colMap[span] || 'lg:col-span-12';
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${colClass}`}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            {title && <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</h3>}
            {hint && <p className="text-muted-foreground mt-1" style={{ fontSize: '0.72rem' }}>{hint}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Tile({ lab, val, sub, tone }: { lab: string; val: string; sub?: string; tone?: 'amber' | 'neg' | 'pos' }) {
  const toneCls =
    tone === 'amber' ? 'text-amber-500' :
    tone === 'neg' ? 'text-amber-500' :
    tone === 'pos' ? 'text-emerald-500' :
    'text-foreground';
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
      <div className="text-muted-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{lab}</div>
      <div className={toneCls} style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{val}</div>
      {sub && <div className="text-muted-foreground mt-0.5" style={{ fontSize: '0.68rem' }}>{sub}</div>}
    </div>
  );
}

function StatusStack({ segs }: { segs: { n: string; q: number; color: string; action?: boolean }[] }) {
  const tot = segs.reduce((a, b) => a + b.q, 0);
  return (
    <>
      <div className="flex w-full h-6 rounded-md overflow-hidden">
        {segs.map(s => (
          <div key={s.n} className="flex items-center justify-center text-white" style={{ flex: s.q, background: s.color, fontSize: '0.7rem', fontWeight: 600 }} title={`${s.n}: ${s.q}`}>
            {s.q / tot >= 0.06 ? s.q : ''}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {segs.map(s => (
          <span key={s.n} className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: '0.72rem' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} /> {s.n} · {s.q}
            {s.action && <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600" style={{ fontSize: '0.62rem', fontWeight: 600 }}>ação</span>}
          </span>
        ))}
      </div>
    </>
  );
}

function Rank({ rows, formatV }: { rows: { n: string; v: number }[]; formatV?: (n: number) => string }) {
  const max = Math.max(...rows.map(r => r.v));
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.n} className="flex items-center gap-3">
          <span className="text-foreground flex-1 truncate" style={{ fontSize: '0.8rem' }}>{r.n}</span>
          <div className="flex-1 h-1.5 rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(r.v / max * 100).toFixed(1)}%` }} />
          </div>
          <span className="text-foreground mono w-16 text-right" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{(formatV ?? fmt)(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

const TICKET = 4030;
const metaData: Record<string, any> = {
  semana: {
    hint: 'Meta consolidada · barras por dia (% da meta diária)',
    sub: { title: 'Meta diária da rede (hoje)', meta: 220000, vend: 205000, counts: ['42 pedidos', '1.250 pares', '96 clientes'] },
    main: { title: 'Meta semanal da rede', meta: 1100000, vend: 1060000, delta: '▲ +5% vs semana passada' },
    bars: [{ lb: 'Seg', p: 98 }, { lb: 'Ter', p: 104 }, { lb: 'Qua', p: 96 }, { lb: 'Qui', p: 101 }, { lb: 'Sex', p: 93, cur: true }],
  },
  mes: {
    hint: 'Meta consolidada · barras por semana (% da meta semanal)',
    sub: { title: 'Meta semanal (atual)', meta: 1100000, vend: 1060000, counts: ['255 pedidos', '7.500 pares', '480 clientes'] },
    main: { title: 'Meta mensal da rede', meta: 4500000, vend: 4280000, delta: '▲ +7% vs mês passado' },
    bars: [{ lb: 'Sem 1', p: 106 }, { lb: 'Sem 2', p: 97 }, { lb: 'Sem 3', p: 100 }, { lb: 'Atual', p: 96, cur: true }],
  },
  ano: {
    hint: 'Meta consolidada · barras por mês (% da meta mensal)',
    sub: { title: 'Meta mensal (jul)', meta: 4500000, vend: 4280000, counts: ['1.062 pedidos', '31.400 pares', '812 clientes'] },
    main: { title: 'Meta acumulada (jan–jul)', meta: 31000000, vend: 30200000, delta: '▲ +8% vs mesmo período do ano passado' },
    bars: [{ lb: 'Jan', p: 96 }, { lb: 'Fev', p: 103 }, { lb: 'Mar', p: 100 }, { lb: 'Abr', p: 94 }, { lb: 'Mai', p: 107 }, { lb: 'Jun', p: 102 }, { lb: 'Jul', p: 95, cur: true }],
  },
};

function MetaPanel({ v }: { v: any }) {
  const pct = Math.round(v.vend / v.meta * 100);
  const falta = Math.max(0, v.meta - v.vend);
  const nped = Math.max(1, Math.round(falta / TICKET));
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
      <div className="text-muted-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{v.title}</div>
      <div className="text-foreground mono" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{brl(v.meta)}</div>
      <div className="text-muted-foreground mt-2" style={{ fontSize: '0.7rem' }}>Vendido</div>
      <div className="flex items-center gap-2">
        <span className="text-foreground mono" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{brl(v.vend)}</span>
        <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{pct}%</span>
      </div>
      {v.delta && <div className="text-emerald-600 mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{v.delta}</div>}
      {v.counts && <div className="flex flex-wrap gap-2 mt-2 text-muted-foreground" style={{ fontSize: '0.7rem' }}>{v.counts.map((c: string) => <span key={c} className="px-1.5 py-0.5 rounded bg-secondary">{c}</span>)}</div>}
      <div className="text-muted-foreground mt-2" style={{ fontSize: '0.72rem' }}>Falta {brl(falta)} · ≈ {nped} pedido{nped > 1 ? 's' : ''} médio{nped > 1 ? 's' : ''}</div>
    </div>
  );
}

const redeData = [
  { m: 'Fev', v: 3.4 }, { m: 'Mar', v: 3.7 }, { m: 'Abr', v: 3.5 },
  { m: 'Mai', v: 3.9 }, { m: 'Jun', v: 4.0 }, { m: 'Jul', v: 4.28 },
];

const repPerf = [
  { n: 'Marcos Andrade', cli: 92, cov: '65%', v: 425000, meta: 102, tm: 3900, delta: '+8%', low: false },
  { n: 'Larissa Prado', cli: 88, cov: '61%', v: 398000, meta: 96, tm: 3720, delta: '+3%', low: false },
  { n: 'Rafael Neves', cli: 76, cov: '48%', v: 268000, meta: 82, tm: 2980, delta: '-4%', low: true },
  { n: 'Juliana Costa', cli: 104, cov: '72%', v: 512000, meta: 108, tm: 4300, delta: '+11%', low: false },
  { n: 'Pedro Alves', cli: 62, cov: '41%', v: 214000, meta: 74, tm: 2710, delta: '-6%', low: true },
];

const ufRankAdm = [
  { n: 'SP', v: 1250000 }, { n: 'MG', v: 720000 }, { n: 'RJ', v: 640000 },
  { n: 'RS', v: 520000 }, { n: 'PR', v: 430000 }, { n: 'SC', v: 380000 },
];

const slaRank = [
  { n: 'Marcos Andrade', v: 1.2 }, { n: 'Larissa Prado', v: 1.5 },
  { n: 'Juliana Costa', v: 1.7 }, { n: 'Rafael Neves', v: 2.4 }, { n: 'Pedro Alves', v: 2.8 },
];

const colecoes = [
  { c: 'Inverno 24', v: 12.8 }, { c: 'Verão 25', v: 15.2 },
  { c: 'Inverno 25', v: 14.5 }, { c: 'Verão 26', v: 17.2 }, { c: 'Inverno 26', v: 9.6 },
];

export function DashboardAdmin({ onNavigate, onSelectClient }: DashboardAdminProps) {
  const [gran, setGran] = useState<'semana' | 'mes' | 'ano'>('mes');
  const d = metaData[gran];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-foreground" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Indicadores da rede</h2>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>Indústria · Pace Calçados · visão completa da rede</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Período: Mês atual', 'Rep: Todos', 'Região: Todas', 'Coleção: Verão 26'].map(c => (
            <span key={c} className="px-2.5 py-1 rounded-full bg-secondary text-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{c}</span>
          ))}
        </div>
      </div>

      {/* META GERAL */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Meta geral dos representantes</div>
      <Card
        title="Meta geral — rede consolidada"
        hint={d.hint}
        right={
          <div className="inline-flex rounded-lg bg-secondary p-1">
            {(['semana', 'mes', 'ano'] as const).map(k => (
              <button key={k} onClick={() => setGran(k)} className={`px-3 py-1 rounded-md ${gran === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                {k === 'mes' ? 'Mês' : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetaPanel v={d.sub} />
          <MetaPanel v={d.main} />
          <div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.bars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="lb" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'da meta']} />
                <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" />
                <Bar dataKey="p" radius={[6, 6, 0, 0]}>
                  {d.bars.map((b: any, i: number) => (
                    <Cell key={i} fill="#111" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* VISÃO GERAL */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Visão geral da rede</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Venda consolidada da rede" hint="Pedidos confirmados · últimos 6 meses (R$ mi)" span={8}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={redeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$ ${v}mi`} />
              <Tooltip formatter={(v: any) => [`R$ ${v} mi`, 'Rede']} />
              <Line type="monotone" dataKey="v" stroke="#111" strokeWidth={2} dot={{ r: 3, fill: '#111' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="text-emerald-600" style={{ fontSize: '0.75rem', fontWeight: 600 }}>▲ 7% jul vs jun · ▲ 26% vs fev</span>
            <Tile lab="Pedidos" val="1.062" />
            <Tile lab="Pares" val="31.400" />
            <Tile lab="Ticket médio" val={brl(4030)} />
          </div>
        </Card>

        <Card title="Cobertura e clientes" hint="Base ativa da rede no período" span={4}>
          <div>
            <div className="flex justify-between mb-1"><span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Cobertura de carteira (rede)</span><b style={{ fontSize: '0.85rem' }}>63%</b></div>
            <div className="w-full h-2 bg-secondary rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: '63%' }} /></div>
            <div className="flex justify-between mt-1 text-muted-foreground" style={{ fontSize: '0.68rem' }}><span>812 de 1.290 clientes</span><span>alvo 70%</span></div>
          </div>
          <div className="mt-3 space-y-2">
            <Tile lab="Frequência de clientes" val="1,8 pedidos/mês" sub="média por cliente ativo" />
            <Tile lab="Prazo médio dos clientes" val="42 dias" sub="definição do cálculo a confirmar" tone="amber" />
          </div>
        </Card>

        <Card title="Pedidos por status — rede" hint="1.062 pedidos no período · barra 100% empilhada" span={12}>
          <StatusStack segs={[
            { n: 'Aprovado', q: 480, color: '#111' },
            { n: 'Faturado', q: 280, color: '#3b82f6' },
            { n: 'Em transporte', q: 150, color: '#8b5cf6' },
            { n: 'Aguardando aprovação', q: 96, color: '#f59e0b', action: true },
            { n: 'Cancelado', q: 56, color: '#f59e0b' },
          ]} />
        </Card>
      </div>

      {/* REDE DE REPRESENTANTES */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Rede de representantes</div>
      <Card title="Carteira ativa e performance de representantes" hint="14 reps ativos · vermelho para rep abaixo da meta">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ fontSize: '0.78rem' }}>
            <thead className="text-muted-foreground border-b border-border">
              <tr><th className="py-2 pr-2 font-medium">Representante</th><th className="py-2 pr-2 font-medium">Clientes</th><th className="py-2 pr-2 font-medium">Cobertura</th><th className="py-2 pr-2 font-medium">Venda</th><th className="py-2 pr-2 font-medium">% da meta</th><th className="py-2 pr-2 font-medium">Ticket médio</th><th className="py-2 pr-2 font-medium">Δ vs mês ant.</th></tr>
            </thead>
            <tbody>
              {repPerf.map(r => (
                <tr key={r.n} className={`border-b border-border/40 ${r.low ? 'text-amber-600' : ''}`}>
                  <td className="py-2 pr-2 text-foreground">{r.n}</td>
                  <td className="py-2 pr-2">{r.cli}</td>
                  <td className="py-2 pr-2">{r.cov}</td>
                  <td className="py-2 pr-2 mono">{brl(r.v)}</td>
                  <td className={`py-2 pr-2 ${r.meta < 100 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}`}>{r.meta}%</td>
                  <td className="py-2 pr-2 mono">{brl(r.tm)}</td>
                  <td className={`py-2 pr-2 ${r.delta.startsWith('+') ? 'text-emerald-600' : 'text-amber-600'} font-semibold`}>{r.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Venda por representante / região" hint="Consolidado por estado" span={7}>
          <Rank rows={ufRankAdm} formatV={brl} />
          <div className="mt-3"><Tile lab="Total da rede" val="R$ 4,28 mi" sub="▲ 7% vs mês anterior" tone="pos" /></div>
        </Card>

        <Card title="Tempo até aprovação do representante" hint="Média entre pedido e aprovação · vermelho acima do SLA (2 dias)" span={5}>
          <div className="mb-3"><Tile lab="Média da rede" val="1,8 dia" /></div>
          <div className="space-y-2">
            {slaRank.map(r => (
              <div key={r.n} className="flex items-center gap-3">
                <span className="text-foreground flex-1 truncate" style={{ fontSize: '0.8rem' }}>{r.n}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary"><div className={`h-full rounded-full ${r.v > 2 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${Math.min(r.v / 3 * 100, 100).toFixed(0)}%` }} /></div>
                <span className={`w-14 text-right mono ${r.v > 2 ? 'text-amber-600 font-semibold' : 'text-foreground'}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>{r.v} d</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* VENDAS */}
      <SalesIndicatorsSection
        scope="network"
        entities={getNetworkEntities()}
        totalMonthlyBase={getNetworkMonthlyTotal()}
        avgTicket={TICKET}
        onNavigateClients={() => onNavigate('clients')}
        onOpenClient={onSelectClient}
      />

      {/* CATÁLOGO E ESTOQUE */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Catálogo e estoque</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Produtos ofertados × ativos" hint="Cobertura do catálogo · alerta para ofertados sem giro" span={5}>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <Tile lab="Ofertados" val="288" />
            <Tile lab="Ativos c/ giro" val="214" />
            <Tile lab="Sem giro" val="48" tone="amber" />
            <Tile lab="Não ativos" val="26" />
          </div>
          <div className="flex w-full h-5 rounded-md overflow-hidden">
            <div className="bg-primary flex items-center justify-center text-white" style={{ flex: 214, fontSize: '0.7rem' }}>214</div>
            <div className="bg-amber-500 flex items-center justify-center text-white" style={{ flex: 48, fontSize: '0.7rem' }}>48</div>
            <div className="bg-muted-foreground/40 flex items-center justify-center text-white" style={{ flex: 26, fontSize: '0.7rem' }}>26</div>
          </div>
          <p className="text-muted-foreground mt-2" style={{ fontSize: '0.7rem' }}>74% do catálogo ofertado tem giro real · 48 itens ativos sem giro</p>
        </Card>

        <Card title="Giro de estoque" hint="Sell-out ÷ estoque médio" span={3}>
          <div className="text-foreground" style={{ fontSize: '1.8rem', fontWeight: 700 }}>1,4×</div>
          <div className="text-emerald-600 mt-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>▲ 0,2 vs trimestre anterior</div>
          <p className="text-muted-foreground mt-2" style={{ fontSize: '0.7rem' }}>no trimestre · só lojas participantes do sell-out</p>
        </Card>

        <Card title="Ruptura na operação" hint="SKUs indisponíveis" span={4}>
          <div className="text-amber-600" style={{ fontSize: '1.6rem', fontWeight: 700 }}>12 SKUs</div>
          <div className="mt-2 space-y-2">
            {[
              { t: 'Tênis Runner X · 38 preto', m: 'em ruptura há 9 dias' },
              { t: 'Sandália Verão · 35/36', m: 'em ruptura há 5 dias' },
              { t: 'Oxford Clássico · 41', m: 'em ruptura há 3 dias' },
            ].map(x => (
              <div key={x.t} className="flex items-start gap-2 rounded-lg border border-border/60 p-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                <div>
                  <div className="text-foreground" style={{ fontSize: '0.78rem', fontWeight: 500 }}>{x.t}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{x.m}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Produtos mais vendidos — rede" hint="Por pares · filtrável por linha, cor, região e representante" span={6}>
          <Rank rows={[
            { n: 'Tênis Runner X', v: 4200 }, { n: 'Sandália Verão', v: 3100 },
            { n: 'Sapatilha Flex', v: 2400 }, { n: 'Oxford Clássico', v: 1900 },
            { n: 'Bota Chelsea Couro', v: 1650 },
          ]} />
        </Card>

        <Card title="Sell-in × Sell-out — rede" hint="214 lojas participantes (R$ mi)" span={6}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { m: 'Abr', sellIn: 3.5, sellOut: 3.0 },
              { m: 'Mai', sellIn: 3.9, sellOut: 3.2 },
              { m: 'Jun', sellIn: 4.0, sellOut: 2.5 },
              { m: 'Jul', sellIn: 4.28, sellOut: 3.3 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}mi`} />
              <Tooltip formatter={(v: any) => [`R$ ${v} mi`, '']} />
              <Bar dataKey="sellIn" fill="#111" radius={[4, 4, 0, 0]} name="Sell-in" />
              <Bar dataKey="sellOut" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Sell-out" />
            </BarChart>
          </ResponsiveContainer>
          <div className="rounded-lg bg-amber-500/10 p-2 mt-2 text-amber-700" style={{ fontSize: '0.72rem' }}>
            <b>Gap crescente em junho:</b> sell-out 37% abaixo do sell-in — possível acúmulo nas lojas.
          </div>
        </Card>
      </div>

      {/* GESTÃO COMERCIAL */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Gestão comercial</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Campanhas comerciais" hint="Efeito na venda: média mensal com × sem campanha" span={6}>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={[
              { c: 'Volta às aulas', com: 4.2, sem: 3.6 },
              { c: 'Dia dos Pais', com: 3.9, sem: 3.6 },
              { c: 'Inverno 26', com: 3.5, sem: 3.6 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="c" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}mi`} />
              <Tooltip />
              <Bar dataKey="com" fill="#111" radius={[4, 4, 0, 0]} name="Com campanha" />
              <Bar dataKey="sem" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Sem campanha" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {[
              { t: 'Volta às aulas', m: '+18% de venda no período', d: '▲ 18%', up: true },
              { t: 'Dia dos Pais', m: '+9% vs média sem campanha', d: '▲ 9%', up: true },
              { t: 'Inverno 26', m: '−2% — abaixo da média sem campanha', d: '▼ 2%', up: false },
            ].map(x => (
              <div key={x.t} className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5">
                <span className={`w-2 h-2 rounded-full mt-1.5 ${x.up ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1">
                  <div className="text-foreground" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{x.t}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{x.m}</div>
                </div>
                <span className={`${x.up ? 'text-emerald-600' : 'text-amber-600'} font-semibold`} style={{ fontSize: '0.72rem' }}>{x.d}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Histórico de coleções" hint="Comparativo de desempenho (R$ mi no ciclo)" span={6}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={colecoes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="c" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}mi`} />
              <Tooltip formatter={(v: any) => [`R$ ${v} mi`, 'Ciclo']} />
              <Bar dataKey="v" fill="#111" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-emerald-600 mt-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>▲ 13% Verão 26 vs Verão 25 · Inverno 26 em andamento</div>
        </Card>
      </div>
    </div>
  );
}
