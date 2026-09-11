import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ReferenceLine, Cell,
} from "recharts";
import { Client } from "../data/mockData";
import { SalesIndicatorsSection, getRepTeamEntities, getRepMonthlyTotal } from "./SalesIndicatorsSection";

const CURRENT_REP_NAME = 'Marcos Andrade';

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'stock';

interface DashboardRepProps {
  onNavigate: (view: View) => void;
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  embedded?: boolean;
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

function Rank({ rows }: { rows: { n: string; v: number }[] }) {
  const max = Math.max(...rows.map(r => r.v));
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.n} className="flex items-center gap-3">
          <span className="text-foreground flex-1 truncate" style={{ fontSize: '0.8rem' }}>{r.n}</span>
          <div className="flex-1 h-1.5 rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(r.v / max * 100).toFixed(1)}%` }} />
          </div>
          <span className="text-foreground mono w-14 text-right" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{fmt(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

const TICKET = 5000;
const metaData: Record<string, any> = {
  semana: {
    hint: 'Visão semana · barras por dia (% da meta diária)',
    sub: { title: 'Meta diária (hoje)', meta: 50000, vend: 45000, counts: ['6 pedidos', '350 pares', '5 clientes'] },
    main: { title: 'Meta semanal', meta: 250000, vend: 245000, delta: '▲ +10% vs semana passada' },
    bars: [{ lb: 'Seg', p: 95 }, { lb: 'Ter', p: 110 }, { lb: 'Qua', p: 95 }, { lb: 'Qui', p: 100 }, { lb: 'Sex', p: 90, cur: true }],
  },
  mes: {
    hint: 'Visão mês · barras por semana (% da meta semanal)',
    sub: { title: 'Meta semanal (atual)', meta: 250000, vend: 245000, counts: ['24 pedidos', '1.400 pares', '18 clientes'] },
    main: { title: 'Meta mensal', meta: 1000000, vend: 985000, delta: '▲ +6% vs mês passado' },
    bars: [{ lb: 'Sem 1', p: 110 }, { lb: 'Sem 2', p: 95 }, { lb: 'Sem 3', p: 100 }, { lb: 'Atual', p: 98, cur: true }],
  },
  ano: {
    hint: 'Visão ano · barras por mês (% da meta mensal)',
    sub: { title: 'Meta mensal (jul)', meta: 1000000, vend: 985000, counts: ['96 pedidos', '5.600 pares', '41 clientes'] },
    main: { title: 'Meta acumulada (jan–jul)', meta: 7000000, vend: 6870000, delta: '▲ +8% vs mesmo período do ano passado' },
    bars: [{ lb: 'Jan', p: 95 }, { lb: 'Fev', p: 105 }, { lb: 'Mar', p: 100 }, { lb: 'Abr', p: 92 }, { lb: 'Mai', p: 110 }, { lb: 'Jun', p: 103 }, { lb: 'Jul', p: 98, cur: true }],
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

const histRep = [
  { m: 'Fev', v: 155 }, { m: 'Mar', v: 168 }, { m: 'Abr', v: 172 },
  { m: 'Mai', v: 178 }, { m: 'Jun', v: 183 }, { m: 'Jul', v: 200 },
];

const frm = [
  { c: 'Calçadão Paulista', s: 'A', f: 4, r: 8, m: 42000, t: 4200, risk: false },
  { c: 'Shoestore Norte', s: 'B', f: 2, r: 22, m: 18500, t: 1850, risk: false },
  { c: 'Fashion Feet SP', s: 'A', f: 5, r: 4, m: 61000, t: 5100, risk: false },
  { c: 'Pé Descalço', s: 'C', f: 1, r: 47, m: 8200, t: 820, risk: true },
  { c: 'Passo Firme', s: 'B', f: 3, r: 15, m: 22400, t: 2100, risk: false },
];

const ufRank = [
  { n: 'SP', v: 78000 }, { n: 'RJ', v: 45000 }, { n: 'MG', v: 38000 },
  { n: 'RS', v: 32000 }, { n: 'PR', v: 21000 },
];
const cidRank = [
  { n: 'São Paulo', v: 42000 }, { n: 'Rio', v: 26000 }, { n: 'BH', v: 18000 },
  { n: 'Porto Alegre', v: 15000 }, { n: 'Curitiba', v: 12000 },
];

export function DashboardRep({ onNavigate, selectedClient, onSelectClient }: DashboardRepProps) {
  const [gran, setGran] = useState<'semana' | 'mes' | 'ano'>('semana');
  const d = metaData[gran];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-foreground" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Indicadores</h2>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>Representante · {CURRENT_REP_NAME}{selectedClient ? ` · cliente ativo: ${selectedClient.name}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Período: Semana atual', 'Região: Todas', 'Coleção: Verão 26'].map(c => (
            <span key={c} className="px-2.5 py-1 rounded-full bg-secondary text-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{c}</span>
          ))}
        </div>
      </div>

      {/* META E VENDA */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Meta e venda</div>
      <Card
        title="Meta e venda"
        hint={d.hint}
        right={
          <div className="inline-flex rounded-lg bg-secondary p-1">
            {(['semana', 'mes', 'ano'] as const).map(k => (
              <button key={k} onClick={() => setGran(k)} className={`px-3 py-1 rounded-md capitalize ${gran === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
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

      {/* VENDAS */}
      <SalesIndicatorsSection
        scope="own"
        entities={getRepTeamEntities(CURRENT_REP_NAME)}
        totalMonthlyBase={getRepMonthlyTotal(CURRENT_REP_NAME)}
        avgTicket={TICKET}
        repName={CURRENT_REP_NAME}
        onNavigateClients={() => onNavigate('clients')}
        onOpenClient={onSelectClient}
      />

      {/* CARTEIRA */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Carteira de clientes</div>
      <Card title="Composição da carteira + cobertura" hint="64 clientes · barra 100% empilhada">
        <StatusStack segs={[
          { n: 'Atendidos', q: 38, color: '#111' },
          { n: 'Aguardando visita', q: 12, color: '#f59e0b', action: true },
          { n: 'Não atendidos', q: 14, color: '#f59e0b' },
        ]} />
        <div className="mt-4">
          <div className="flex justify-between mb-1"><span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Cobertura (comprou no período)</span><b style={{ fontSize: '0.85rem' }}>59%</b></div>
          <div className="w-full h-2 bg-secondary rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: '59%' }} /></div>
          <div className="flex justify-between mt-1 text-muted-foreground" style={{ fontSize: '0.68rem' }}><span>38 atendidos</span><span>alvo 70%</span></div>
        </div>
      </Card>

      <Card title="FRM + Ticket médio por cliente" hint="Frequência, Recência, Montante · vermelho para risco/churn (recência > 40 dias)">
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ fontSize: '0.78rem' }}>
            <thead className="text-muted-foreground border-b border-border">
              <tr><th className="py-2 pr-2 font-medium">Cliente</th><th className="py-2 pr-2 font-medium">Score FRM</th><th className="py-2 pr-2 font-medium">Frequência</th><th className="py-2 pr-2 font-medium">Recência (dias)</th><th className="py-2 pr-2 font-medium">Montante</th><th className="py-2 pr-2 font-medium">Ticket médio</th></tr>
            </thead>
            <tbody>
              {frm.map(r => (
                <tr key={r.c} className={`border-b border-border/40 ${r.risk ? 'text-amber-600' : ''}`}>
                  <td className="py-2 pr-2 text-foreground">{r.c}</td>
                  <td className="py-2 pr-2"><span className="px-1.5 py-0.5 rounded bg-secondary" style={{ fontSize: '0.7rem', fontWeight: 600 }}>{r.s}</span></td>
                  <td className="py-2 pr-2">{r.f}/mês</td>
                  <td className={`py-2 pr-2 ${r.r > 40 ? 'text-amber-600 font-semibold' : ''}`}>{r.r}</td>
                  <td className="py-2 pr-2 mono">{brl(r.m)}</td>
                  <td className="py-2 pr-2 mono">{brl(r.t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PRODUTOS */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Produtos</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Produtos mais vendidos" hint="Ranking por pares" span={5}>
          <Rank rows={[
            { n: 'Tênis Runner X', v: 340 }, { n: 'Sandália Verão', v: 260 },
            { n: 'Sapatilha Flex', v: 180 }, { n: 'Bota Couro', v: 140 }, { n: 'Oxford Clássico', v: 120 },
          ]} />
        </Card>

        <Card title="Venda histórica" hint="Últimos 6 meses (R$ mil)" span={4}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={histRep}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
              <Tooltip formatter={(v: any) => [`R$ ${v} mil`, 'Venda']} />
              <Line type="monotone" dataKey="v" stroke="#111" strokeWidth={2} dot={{ r: 3, fill: '#111' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-emerald-600 mt-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>▲ 9% jul vs jun · ▲ 26% vs fev</div>
        </Card>

        <Card title="Ativos × vendidos" hint="Catálogo do rep · período" span={3}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Tile lab="Ativos" val="128" />
            <Tile lab="Vendidos" val="86" />
            <Tile lab="Sem venda" val="42" tone="amber" />
          </div>
          <div className="flex w-full h-5 rounded-md overflow-hidden">
            <div className="bg-primary flex items-center justify-center text-white" style={{ flex: 86, fontSize: '0.7rem' }}>86</div>
            <div className="bg-amber-500 flex items-center justify-center text-white" style={{ flex: 42, fontSize: '0.7rem' }}>42</div>
          </div>
          <p className="text-muted-foreground mt-2" style={{ fontSize: '0.7rem' }}>67% do catálogo ativo teve venda · 42 sem giro</p>
        </Card>
      </div>

      {/* VENDA POR REGIÃO */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Venda por região — território</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Por estado" span={6}>
          <Rank rows={ufRank} />
          <div className="mt-3">
            <Tile lab="Total do território" val={brl(214000)} sub="▲ 6% vs período anterior" tone="pos" />
          </div>
        </Card>
        <Card title="Por cidade" span={6}>
          <Rank rows={cidRank} />
        </Card>
      </div>

      {/* SELL-OUT */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Sell-out e inteligência · só clientes participantes</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Clientes com sell-out" hint="Enviam o dado" span={3}>
          <div className="text-foreground" style={{ fontSize: '1.8rem', fontWeight: 700 }}>18 <span className="text-muted-foreground" style={{ fontSize: '0.85rem', fontWeight: 500 }}>/ 64</span></div>
          <div className="text-amber-600 mt-1" style={{ fontSize: '0.72rem', fontWeight: 600 }}>46 não participam</div>
          <div className="w-full h-2 bg-secondary rounded-full mt-3"><div className="h-full bg-primary rounded-full" style={{ width: '28%' }} /></div>
        </Card>

        <Card title="Sell-in × Sell-out" hint="Vendido (pedido) vs vendido na ponta (R$ mil)" span={4}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              { m: 'Abr', sellIn: 55, sellOut: 48 },
              { m: 'Mai', sellIn: 62, sellOut: 50 },
              { m: 'Jun', sellIn: 70, sellOut: 45 },
              { m: 'Jul', sellIn: 68, sellOut: 52 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
              <Tooltip />
              <Bar dataKey="sellIn" fill="#111" radius={[4, 4, 0, 0]} name="Sell-in" />
              <Bar dataKey="sellOut" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Sell-out" />
            </BarChart>
          </ResponsiveContainer>
          <div className="rounded-lg bg-amber-500/10 p-2 mt-2 text-amber-700" style={{ fontSize: '0.72rem' }}>
            <b>Alerta:</b> sell-out de jun 36% abaixo do sell-in — produto parado no cliente.
          </div>
        </Card>

        <Card title="Alerta de ruptura como oportunidade" hint="Cobertura em dias < lead time · reposição prioritária" span={5}>
          <div className="space-y-2">
            {[
              { c: 'Calçadão Paulista', p: 'Tênis Runner X 38 preto', d: 'cobertura 3 dias · lead 7' },
              { c: 'Shoestore Norte', p: 'Sandália Verão 35/36', d: 'cobertura 2 dias · lead 5' },
              { c: 'Fashion Feet SP', p: 'Oxford Clássico 41', d: 'ruptura há 3 dias' },
            ].map(x => (
              <div key={x.p} className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                <div className="flex-1">
                  <div className="text-foreground" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{x.p}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{x.c} · {x.d}</div>
                </div>
                <button onClick={() => onNavigate('catalog')} className="text-primary" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Repor →</button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RECOMENDAÇÕES */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Recomendações</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Clientes para atender" hint="Prioridade por recência, não atendidos e aguardando visita" span={6}>
          <div className="space-y-2">
            {[
              { c: 'Pé Descalço', m: 'sem compra há 47 dias · risco de churn' },
              { c: 'Passo Firme', m: 'aguardando visita há 15 dias' },
              { c: 'Loja do Sapato', m: 'nunca atendido no período' },
            ].map(x => (
              <div key={x.c} className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div className="flex-1">
                  <div className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{x.c}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{x.m}</div>
                </div>
                <button onClick={() => onNavigate('clients')} className="text-primary" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Abrir →</button>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Produtos a oferecer" hint="Por cliente · histórico + região + ruptura + top produto" span={6}>
          <div className="space-y-2">
            {[
              { c: 'Calçadão Paulista', p: 'Bota Chelsea Couro', m: 'top produto da região' },
              { c: 'Shoestore Norte', p: 'Derby Casual Urban', m: 'último pedido há 35 dias' },
              { c: 'Fashion Feet SP', p: 'Oxford Clássico', m: 'alta demanda na região' },
            ].map(x => (
              <div key={x.p} className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div className="flex-1">
                  <div className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{x.p}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{x.c} · {x.m}</div>
                </div>
                <button onClick={() => onNavigate('order-grade')} className="text-primary" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Pedir →</button>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('catalog')} className="mt-3 flex items-center gap-1 text-primary" style={{ fontSize: '0.78rem', fontWeight: 500 }}>Ir ao catálogo <ChevronRight className="w-3.5 h-3.5" /></button>
        </Card>
      </div>
    </div>
  );
}
