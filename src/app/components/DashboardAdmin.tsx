import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";
import { SalesIndicatorsSection, getNetworkEntities, getNetworkMonthlyTotal } from "./SalesIndicatorsSection";
import type { Client } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'stock';

interface DashboardAdminProps {
  onNavigate: (view: View) => void;
  onSelectClient: (client: Client) => void;
}

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

const colecoes = [
  { c: 'Inverno 24', v: 12.8 }, { c: 'Verão 25', v: 15.2 },
  { c: 'Inverno 25', v: 14.5 }, { c: 'Verão 26', v: 17.2 }, { c: 'Inverno 26', v: 9.6 },
];

export function DashboardAdmin({ onNavigate, onSelectClient }: DashboardAdminProps) {
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
