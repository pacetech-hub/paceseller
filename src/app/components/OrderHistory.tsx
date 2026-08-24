import { useState } from "react";
import { toast } from "sonner";
import {
  Search, ChevronRight, Download, RotateCcw, Clock,
  CheckCircle2, XCircle, FileCheck2, PackageCheck,
} from "lucide-react";
import { orders, formatCurrency, formatDate, type Order } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

type Profile = 'admin' | 'rep' | 'lojista';

interface OrderHistoryProps {
  onNavigate: (view: View) => void;
  profile?: Profile;
}

const statusColors: Record<string, string> = {
  'aprovado': 'text-black bg-black/10',
  'em análise': 'text-amber-400 bg-amber-400/10',
  'faturado': 'text-emerald-400 bg-emerald-400/10',
  'cancelado': 'text-red-400 bg-red-400/10',
  'entregue': 'text-purple-400 bg-purple-400/10',
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  'aprovado': CheckCircle2,
  'em análise': Clock,
  'faturado': FileCheck2,
  'cancelado': XCircle,
  'entregue': PackageCheck,
};

const orderProductNames: Record<string, string> = {
  'PED-2026-0412': 'Tênis Casual — Grade Mista',
  'PED-2026-0411': 'Sapatos Sociais — Linha Executiva',
  'PED-2026-0410': 'Botas Impermeáveis — Coleção Verão 26',
  'PED-2026-0409': 'Chinelos Infantis — Coleção Verão 26',
  'PED-2026-0408': 'Tênis Infantil — Coleção Verão 26',
  'PED-2026-0407': 'Sandálias Femininas — Coleção Verão 26',
  'PED-2026-0406': 'Tênis Esportivo — Coleção Verão 26',
  'PED-2026-0405': 'Sandálias Rasteiras — Coleção Verão 26',
};

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function statusSupportText(order: Order): string {
  switch (order.status) {
    case 'aprovado':
      return `em ${formatDate(order.date)}`;
    case 'em análise':
      return `Emissão em ${formatDate(order.date)}`;
    case 'faturado':
      return `Entrega prevista em ${formatDate(shiftDate(order.date, 10))}`;
    case 'entregue':
      return `em ${formatDate(shiftDate(order.date, 6))}`;
    case 'cancelado':
      return `em ${formatDate(order.date)}`;
  }
}

// shared column template so the legend row and every card line up exactly
function orderGridTemplate(profile: Profile): string {
  return profile === 'rep'
    ? 'minmax(0,1fr) 100px 130px 20px'
    : 'minmax(0,1fr) 150px 100px 130px 20px';
}

function OrderCard({ order, profile, onNavigate }: { order: Order; profile: Profile; onNavigate: (view: View) => void }) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusIcon[order.status];
  const support = statusSupportText(order);
  const productName = orderProductNames[order.id] ?? order.collection;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        onClick={() => setExpanded(e => !e)}
        className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
        style={{ display: 'grid', gridTemplateColumns: orderGridTemplate(profile), columnGap: '1rem', alignItems: 'center' }}
      >
        {/* column 1: order info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[order.status]}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              <StatusIcon className="w-3 h-3" />
              {order.status}
            </span>
            <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: '0.72rem' }}>{support}</span>
          </div>
          <p className="text-foreground truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            <span className="mono">{order.id}</span> — {productName}
          </p>
        </div>

        {/* column 2: representante */}
        {profile !== 'rep' && (
          <div className="min-w-0">
            <p className="text-foreground truncate" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{order.rep}</p>
          </div>
        )}

        {/* column 3: quantidade */}
        <div className="min-w-0">
          <p className="text-foreground truncate" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{order.items} pares</p>
        </div>

        {/* column 4: total */}
        <div className="text-right min-w-0">
          <p className="text-foreground mono truncate" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{formatCurrency(order.total)}</p>
        </div>

        <ChevronRight className={`w-4 h-4 text-muted-foreground justify-self-center transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-border bg-secondary/20 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Coleção', value: order.collection },
              { label: 'Pagamento', value: order.paymentCondition },
              { label: 'Total de pares', value: `${order.items} pares` },
              { label: 'Ticket médio/par', value: formatCurrency(order.total / order.items) },
            ].map(detail => (
              <div key={detail.label}>
                <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{detail.label}</p>
                <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{detail.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={e => { e.stopPropagation(); onNavigate('cart'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              style={{ fontSize: '0.78rem', fontWeight: 600 }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Repetir pedido
            </button>
            <button
              onClick={e => { e.stopPropagation(); toast.success('PDF baixado'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
              style={{ fontSize: '0.78rem', fontWeight: 500 }}
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderHistory({ onNavigate, profile = 'admin' }: OrderHistoryProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const statuses = ['todos', 'em análise', 'aprovado', 'faturado', 'entregue', 'cancelado'];
  const statusPriority: Record<string, number> = { 'em análise': 0, 'aprovado': 1, 'faturado': 2, 'entregue': 3, 'cancelado': 4 };

  const baseOrders = profile === 'rep'
    ? orders.filter(o => o.rep === 'Marcos Andrade')
    : orders;

  const filtered = baseOrders
    .filter(o => {
      const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.client.toLowerCase().includes(search.toLowerCase()) ||
        o.rep.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'todos' || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar pedido, cliente, rep..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            style={{ fontSize: '0.82rem' }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full transition-colors capitalize ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
              style={{ fontSize: '0.75rem', fontWeight: 500 }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.length > 0 && (
          <div
            className="sticky top-0 z-10 bg-card border border-border rounded-xl px-4 py-2.5 text-muted-foreground"
            style={{
              display: 'grid',
              gridTemplateColumns: orderGridTemplate(profile),
              columnGap: '1rem',
              alignItems: 'center',
              fontSize: '0.68rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <div className="min-w-0">Pedido</div>
            {profile !== 'rep' && <div className="min-w-0">Representante</div>}
            <div className="min-w-0">Quantidade</div>
            <div className="text-right min-w-0">Total</div>
            <div />
          </div>
        )}
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} profile={profile} onNavigate={onNavigate} />
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
              <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhum pedido encontrado</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Tente ajustar os filtros de busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
