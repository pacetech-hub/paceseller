import { CaretRightIcon } from "@phosphor-icons/react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart,
} from "recharts";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'stock';

interface DashboardLojistaProps {
  onNavigate: (view: View) => void;
}

const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR');
const fmt = (n: number) => n.toLocaleString('pt-BR');

function Card({ title, hint, span = 12, children }: { title: string; hint?: string; span?: number; children: React.ReactNode }) {
  const colMap:Record<number,string>={3:'lg:col-span-3',4:'lg:col-span-4',5:'lg:col-span-5',6:'lg:col-span-6',7:'lg:col-span-7',8:'lg:col-span-8',9:'lg:col-span-9',12:'lg:col-span-12'};
  const colClass = colMap[span] || 'lg:col-span-12';
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${colClass}`}>
      <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</h3>
      {hint && <p className="text-muted-foreground mt-1" style={{ fontSize: '0.72rem' }}>{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Tile({ lab, val, sub, tone }: { lab: string; val: string; sub?: string; tone?: 'amber' | 'neg' | 'pos' | 'muted' }) {
  const toneCls =
    tone === 'amber' ? 'text-amber-500' :
    tone === 'neg' ? 'text-amber-500' :
    tone === 'pos' ? 'text-emerald-500' :
    'text-foreground';
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
      <div className="text-muted-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{lab}</div>
      <div className={`${toneCls}`} style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{val}</div>
      {sub && <div className="text-muted-foreground mt-0.5" style={{ fontSize: '0.68rem' }}>{sub}</div>}
    </div>
  );
}

function Badge({ children, tone = 'ok' }: { children: React.ReactNode; tone?: 'ok' | 'warn' | 'risk' }) {
  const cls =
    tone === 'ok' ? 'bg-emerald-500/10 text-emerald-600' :
    tone === 'warn' ? 'bg-amber-500/10 text-amber-600' :
    'bg-amber-500/10 text-amber-600';
  return <span className={`inline-block px-1.5 py-0.5 rounded-full ${cls}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>{children}</span>;
}

function StatusStack({ segs }: { segs: { n: string; q: number; color: string; action?: boolean }[] }) {
  const tot = segs.reduce((a, b) => a + b.q, 0);
  return (
    <>
      <div className="flex w-full h-6 rounded-md overflow-hidden">
        {segs.map(s => (
          <div key={s.n} className="flex items-center justify-center text-white" style={{ flex: s.q, background: s.color, fontSize: '0.7rem', fontWeight: 600 }} title={`${s.n}: ${s.q}`}>
            {s.q / tot >= 0.1 ? s.q : ''}
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
          <span className="text-foreground mono w-12 text-right" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{fmt(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

const histData = [
  { m: 'Fev', v: 9 }, { m: 'Mar', v: 12 }, { m: 'Abr', v: 10 },
  { m: 'Mai', v: 14 }, { m: 'Jun', v: 12 }, { m: 'Jul', v: 13 },
];

export function DashboardLojista({ onNavigate }: DashboardLojistaProps) {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-foreground" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Meus indicadores</h2>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>Loja Pé Quente — Gramado, RS · últimos 90 dias</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Período: Últimos 90 dias', 'Coleção: Todas', 'Status: Todos'].map(c => (
            <span key={c} className="px-2.5 py-1 rounded-full bg-secondary text-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{c}</span>
          ))}
        </div>
      </div>

      {/* MEUS PEDIDOS */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Meus pedidos</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Resumo do período" hint="Recência e volume da loja" span={4}>
          <div className="space-y-3">
            <Tile lab="Último pedido" val="há 11 dias" sub="06/07/2026 · dentro do esperado (limite 30d)" />
            <div className="grid grid-cols-3 gap-2">
              <Tile lab="Pedidos" val="7" />
              <Tile lab="Pares" val="462" />
              <Tile lab="Valor" val={brl(19250)} />
            </div>
          </div>
        </Card>

        <Card title="Carteira de pedidos por status" hint="Situação dos 7 pedidos do período · barra 100% empilhada" span={8}>
          <StatusStack segs={[
            { n: 'Aprovado', q: 3, color: '#111' },
            { n: 'Faturado', q: 2, color: '#3b82f6' },
            { n: 'Em transporte', q: 1, color: '#8b5cf6' },
            { n: 'Aguardando aprovação', q: 1, color: '#f59e0b', action: true },
          ]} />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Tile lab="Em andamento" val="2" />
            <Tile lab="Aguardando aprovação" val="1" tone="amber" />
            <Tile lab="Faturados" val="2" />
          </div>
        </Card>

        <Card title="Histórico de compras" hint="Últimos 6 meses (R$ mil) · com variação" span={7}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
              <Tooltip formatter={(v: any) => [`R$ ${v} mil`, 'Compras']} />
              <Line type="monotone" dataKey="v" stroke="#111" strokeWidth={2} dot={{ r: 3, fill: '#111' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-emerald-600 mt-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>▲ 8% jul vs jun · ▲ 44% vs fev</div>
        </Card>

        <Card title="Pedidos repetidos" hint="Contados pelo botão “repetir pedido” do histórico" span={5}>
          <div className="text-foreground" style={{ fontSize: '1.8rem', fontWeight: 700 }}>4</div>
          <div className="text-emerald-600" style={{ fontSize: '0.75rem', fontWeight: 600 }}>▲ 2 vs período anterior</div>
          <div className="mt-3 space-y-2">
            {[
              { t: 'Pedido #2314 → repetido 2x', m: 'Tênis Runner X · grade completa' },
              { t: 'Pedido #2201 → repetido 2x', m: 'Sandália Verão · meia grade' },
            ].map(o => (
              <div key={o.t} className="flex items-start gap-2 rounded-lg border border-border/60 p-2.5">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <div className="text-foreground" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{o.t}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{o.m}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* RECOMPRA E PRODUTOS */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Recompra e produtos</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Produtos mais comprados" hint="Mix da loja · por pares · filtrável por linha/cor/tipo" span={5}>
          <Rank rows={[
            { n: 'Tênis Runner X', v: 120 }, { n: 'Sandália Verão', v: 96 },
            { n: 'Sapatilha Flex', v: 60 }, { n: 'Bota Couro', v: 48 }, { n: 'Chinelo Soft', v: 36 },
          ]} />
        </Card>

        <Card title="Compra recorrente" hint="Itens comprados com regularidade · frequência por SKU" span={7}>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ fontSize: '0.78rem' }}>
              <thead className="text-muted-foreground border-b border-border">
                <tr><th className="py-2 pr-2 font-medium">Produto</th><th className="py-2 pr-2 font-medium">Cadência</th><th className="py-2 pr-2 font-medium">Compras</th><th className="py-2 pr-2 font-medium">Última</th><th className="py-2 pr-2 font-medium">Próxima</th></tr>
              </thead>
              <tbody>
                {[
                  ['Tênis Runner X', 'a cada 21 dias', '6', 'há 12 dias', 'em ~9 dias', false],
                  ['Sandália Verão', 'a cada 30 dias', '4', 'há 18 dias', 'em ~12 dias', false],
                  ['Sapatilha Flex', 'a cada 45 dias', '3', 'há 40 dias', 'em ~5 dias', true],
                ].map((r: any) => (
                  <tr key={r[0]} className="border-b border-border/40">
                    <td className="py-2 pr-2">{r[0]}</td><td className="py-2 pr-2 text-muted-foreground">{r[1]}</td>
                    <td className="py-2 pr-2">{r[2]}</td><td className="py-2 pr-2 text-muted-foreground">{r[3]}</td>
                    <td className={`py-2 pr-2 ${r[5] ? 'text-amber-600 font-semibold' : ''}`}>{r[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ESTOQUE E SELL-OUT */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Estoque e sell-out da loja</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Sell-out" hint="Envio do dado de venda na ponta" span={3}>
          <div className="space-y-3">
            <Badge tone="ok">✓ Loja participante</Badge>
            <Tile lab="Giro médio do estoque" val="20 dias" sub="alerta se > 30d" />
            <Tile lab="Valor em estoque" val={brl(9435)} />
            <Tile lab="SKUs em ruptura" val="1" tone="neg" />
          </div>
        </Card>

        <Card title="Controle de estoque" hint="Situação por SKU · ruptura, baixo, OK e valor" span={9}>
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ fontSize: '0.78rem' }}>
              <thead className="text-muted-foreground border-b border-border">
                <tr><th className="py-2 pr-2 font-medium">Produto</th><th className="py-2 pr-2 font-medium">Situação</th><th className="py-2 pr-2 font-medium">Estoque (pares)</th><th className="py-2 pr-2 font-medium">Dias ruptura</th><th className="py-2 pr-2 font-medium">Giro (dias)</th><th className="py-2 pr-2 font-medium">Valor</th></tr>
              </thead>
              <tbody>
                {[
                  ['Tênis Runner X', 'risk', 'Ruptura', 0, 6, 12, '—'],
                  ['Sandália Verão', 'warn', 'Baixo', 14, '—', 15, brl(1190)],
                  ['Chinelo Soft', 'warn', 'Baixo', 9, '—', 18, brl(405)],
                  ['Sapatilha Flex', 'ok', 'OK', 42, '—', 22, brl(3360)],
                  ['Bota Couro', 'ok', 'OK', 28, '—', 35, brl(4480)],
                ].map((r: any) => (
                  <tr key={r[0]} className="border-b border-border/40">
                    <td className="py-2 pr-2">{r[0]}</td>
                    <td className="py-2 pr-2"><Badge tone={r[1]}>{r[2]}</Badge></td>
                    <td className="py-2 pr-2">{r[3]}</td>
                    <td className={`py-2 pr-2 ${typeof r[4] === 'number' ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>{r[4]}</td>
                    <td className={`py-2 pr-2 ${r[5] > 30 ? 'text-amber-600 font-semibold' : ''}`}>{r[5]}</td>
                    <td className="py-2 pr-2">{r[6]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* RECOMENDAÇÕES */}
      <div className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Recomendações</div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card title="Sugestões para a loja" hint="Top produto da empresa + top produto da região" span={6}>
          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-lg border border-border/60 p-3">
              <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div className="flex-1">
                <div className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Tênis Runner X</div>
                <div className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Top produto da empresa · você está em ruptura deste item</div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600" style={{ fontSize: '0.65rem', fontWeight: 600 }}>repor</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-border/60 p-3">
              <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div className="flex-1">
                <div className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Bota Chelsea Couro</div>
                <div className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Top produto da sua região (Serra Gaúcha) nesta coleção</div>
              </div>
            </div>
          </div>
          <button onClick={() => onNavigate('catalog')} className="mt-3 flex items-center gap-1 text-primary" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
            Ver no catálogo <CaretRightIcon className="w-3.5 h-3.5" />
          </button>
        </Card>

        <Card title="Lojas de perfil semelhante estão comprando" hint="Recomendação por perfil/região similar" span={6}>
          <div className="space-y-2">
            {[
              { t: 'Oxford Clássico', m: '8 lojas do seu porte compraram nos últimos 30 dias' },
              { t: 'Derby Casual Urban', m: 'recorrente em lojas da sua região' },
            ].map(x => (
              <div key={x.t} className="flex items-start gap-2 rounded-lg border border-border/60 p-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                <div>
                  <div className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{x.t}</div>
                  <div className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{x.m}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
