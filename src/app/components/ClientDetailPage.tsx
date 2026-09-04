import {
  ChevronLeft, MapPin, Building2, Users, BarChart3,
  LayoutGrid, Package2, ShoppingCart, Clock, Receipt,
} from "lucide-react";
import { commercialPolicies, formatCurrency, type Client } from "../data/mockData";
import type { View } from "./Sidebar";

interface ClientDetailPageProps {
  client: Client | null;
  onNavigate: (view: View) => void;
}

const statusColors: Record<Client['status'], string> = {
  'ativo': 'text-emerald-400 bg-emerald-400/10',
  'inativo': 'text-red-400 bg-red-400/10',
};

const formatOrderDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function ClientDetailPage({ client, onNavigate }: ClientDetailPageProps) {
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

  const policy = commercialPolicies.find(p => p.id === client.policyId);

  const infoCards = [
    {
      title: 'Dados cadastrais',
      icon: Building2,
      rows: [
        { label: 'CNPJ', value: client.cnpj },
        { label: 'Cidade/Estado', value: `${client.city}/${client.state}` },
        { label: 'Região', value: client.region },
      ],
    },
    {
      title: 'Comercial',
      icon: Users,
      rows: [
        { label: 'Representante', value: client.rep },
        { label: 'Tabela de preço', value: policy?.name ?? client.policyId },
        { label: 'Condição de pagamento', value: policy?.paymentCondition ?? '—' },
      ],
    },
    {
      title: 'Histórico de compras',
      icon: BarChart3,
      rows: [
        { label: 'Volume total comprado', value: formatCurrency(client.totalPurchased), mono: true },
        { label: 'Último pedido', value: formatOrderDate(client.lastOrder) },
      ],
    },
  ];

  const actions: Array<{ label: string; description: string; icon: React.ComponentType<{ className?: string }>; view: View }> = [
    { label: 'Novo pedido por grade', description: 'Montar pedido rápido em minutos', icon: LayoutGrid, view: 'order-grade' },
    { label: 'Ver catálogo', description: 'Navegar pelo catálogo com a tabela deste cliente', icon: Package2, view: 'catalog' },
    { label: 'Carrinhos', description: 'Ver carrinhos em aberto deste cliente', icon: ShoppingCart, view: 'carts' },
    { label: 'Histórico de pedidos', description: 'Pedidos anteriores deste cliente', icon: Clock, view: 'history' },
    { label: 'Pagamentos e boletos', description: 'Faturas e boletos deste cliente', icon: Receipt, view: 'boletos' },
  ];

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
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary" style={{ fontSize: '1rem', fontWeight: 700 }}>{client.avatar}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-foreground" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{client.name}</h2>
            <span className={`px-2 py-0.5 rounded-full ${statusColors[client.status]}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {client.status}
            </span>
            {client.inadimplente && (
              <span className="px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                inadimplente
              </span>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
            <MapPin className="w-3.5 h-3.5" /> {client.city}/{client.state} · CNPJ {client.cnpj}
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div>
        <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Informações</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {infoCards.map(card => (
            <div key={card.title} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <card.icon className="w-4 h-4 text-muted-foreground" />
                <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{card.title}</p>
              </div>
              <div className="space-y-2">
                {card.rows.map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{row.label}</span>
                    <span className={`text-foreground text-right ${row.mono ? 'mono' : ''}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Ações rápidas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map(action => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.view)}
              className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <action.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{action.label}</p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>{action.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
