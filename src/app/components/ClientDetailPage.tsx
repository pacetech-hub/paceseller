import { useState } from "react";
import {
  ChevronLeft, ChevronDown, MapPin, LayoutGrid, ShoppingCart, BarChart3, Plus,
} from "lucide-react";
import { formatCurrency, type Client } from "../data/mockData";
import type { View } from "./Sidebar";

interface ClientDetailPageProps {
  client: Client | null;
  onNavigate: (view: View) => void;
  cartCount: number;
}

const statusColors: Record<Client['status'], string> = {
  'ativo': 'text-emerald-400 bg-emerald-400/10',
  'inativo': 'text-red-400 bg-red-400/10',
};

const formatOrderDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// mock: número de pedidos históricos determinístico por cliente, usado para estimar o ticket médio
function seededOrderCount(clientId: string): number {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h * 31 + clientId.charCodeAt(i)) >>> 0;
  return 3 + (h % 8);
}

export function ClientDetailPage({ client, onNavigate, cartCount }: ClientDetailPageProps) {
  const [expanded, setExpanded] = useState(false);

  if (!client) {
    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-4">
        <button
          onClick={() => onNavigate('clients')}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontSize: '0.82rem', fontWeight: 500 }}
        >
          <ChevronLeft className="w-4 h-4" /> Voltar para Clientes
        </button>
        <p className="text-muted-foreground">Nenhum cliente selecionado.</p>
      </div>
    );
  }

  const avgTicket = client.totalPurchased / seededOrderCount(client.id);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <button
        onClick={() => onNavigate('clients')}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <ChevronLeft className="w-4 h-4" /> Voltar para Clientes
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary" style={{ fontSize: '1rem', fontWeight: 700 }}>{client.avatar}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2 py-0.5 rounded-full ${statusColors[client.status]}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                  {client.status}
                </span>
                {client.inadimplente && (
                  <span className="px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    inadimplente
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-foreground" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{client.name}</h2>
                <span className="text-muted-foreground" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  Último pedido em {formatOrderDate(client.lastOrder)}
                </span>
              </div>
              <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
                <MapPin className="w-3.5 h-3.5" /> {client.city}/{client.state}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('order-grade')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0"
            style={{ fontSize: '0.82rem', fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" /> Novo pedido
          </button>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-primary mt-3"
          style={{ fontSize: '0.78rem', fontWeight: 600 }}
        >
          {expanded ? 'Ver menos informações' : 'Ver mais informações'}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <p className="text-muted-foreground" style={{ fontSize: '0.68rem', fontWeight: 600 }}>CNPJ</p>
              <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{client.cnpj}</p>
            </div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: '0.68rem', fontWeight: 600 }}>Representante</p>
              <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{client.rep}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('order-grade')}
          className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <LayoutGrid className="w-4 h-4 text-primary" />
          </div>
          <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Novo pedido</p>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>Montar pedido por grade para este cliente</p>
        </button>

        <button
          onClick={() => onNavigate('carts')}
          className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <ShoppingCart className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Carrinhos</p>
            <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary" style={{ fontSize: '0.68rem', fontWeight: 700 }}>{cartCount}</span>
          </div>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>
            {cartCount === 1 ? 'pedido em aberto sendo criado' : 'pedidos em aberto sendo criados'}
          </p>
        </button>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ticket médio por pedido</p>
          <p className="text-foreground mono mt-0.5" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{formatCurrency(avgTicket)}</p>
        </div>
      </div>
    </div>
  );
}
