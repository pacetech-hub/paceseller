import { toast } from "../lib/toast";
import { CaretLeftIcon, DownloadSimpleIcon, ArrowRightIcon, PackageIcon } from "@phosphor-icons/react";
import { products, clients, formatCurrency, type Order, type Product } from "../data/mockData";
import { statusColors, statusIcon, statusSupportText, orderProductNames } from "./OrderHistory";

type View = 'history' | 'boletos';

type Profile = 'admin' | 'rep' | 'lojista';

interface OrderDetailPageProps {
  order: Order | null;
  onNavigate: (view: View) => void;
  profile: Profile;
}

const clientStatusColors: Record<string, string> = {
  'ativo': 'text-emerald-400 bg-emerald-400/10',
  'inativo': 'text-red-400 bg-red-400/10',
};

// deterministic line-item breakdown per order — quantities sum to order.items
const orderLineItems: Record<string, Array<{ productId: string; quantity: number }>> = {
  'PED-2026-0412': [{ productId: 'P001', quantity: 70 }, { productId: 'P005', quantity: 54 }],
  'PED-2026-0411': [{ productId: 'P003', quantity: 40 }, { productId: 'P004', quantity: 46 }],
  'PED-2026-0410': [{ productId: 'P002', quantity: 90 }, { productId: 'P006', quantity: 78 }],
  'PED-2026-0409': [{ productId: 'P007', quantity: 72 }],
  'PED-2026-0408': [{ productId: 'P008', quantity: 48 }],
  'PED-2026-0407': [{ productId: 'P001', quantity: 120 }, { productId: 'P002', quantity: 90 }],
  'PED-2026-0406': [{ productId: 'P005', quantity: 108 }],
  'PED-2026-0405': [{ productId: 'P006', quantity: 64 }],
};

function getOrderLineItems(order: Order): Array<{ product: Product; quantity: number }> {
  const entries = orderLineItems[order.id];
  if (!entries) return [];
  return entries
    .map(entry => {
      const product = products.find(p => p.id === entry.productId);
      return product ? { product, quantity: entry.quantity } : null;
    })
    .filter((v): v is { product: Product; quantity: number } => v !== null);
}

export function OrderDetailPage({ order, onNavigate, profile }: OrderDetailPageProps) {
  if (!order) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto w-full">
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <PackageIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhum pedido selecionado</p>
          <button
            onClick={() => onNavigate('history')}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
            style={{ fontSize: '0.78rem', fontWeight: 500 }}
          >
            <CaretLeftIcon className="w-3.5 h-3.5" /> Voltar para Pedidos
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcon[order.status];
  const support = statusSupportText(order);
  const productName = orderProductNames[order.id] ?? order.collection;
  const lineItems = getOrderLineItems(order);
  const client = clients.find(c => c.id === order.clientId);

  return (
    <div className="p-6 max-w-[1000px] mx-auto w-full space-y-5">
      <button
        onClick={() => onNavigate('history')}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <CaretLeftIcon className="w-4 h-4" /> Voltar para Pedidos
      </button>

      {/* Cliente — admin/rep only */}
      {profile !== 'lojista' && client && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground mb-3" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cliente
          </p>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <p className="text-foreground" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{client.name}</p>
            <span className={`px-2 py-0.5 rounded-full ${clientStatusColors[client.status]}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {client.status}
            </span>
            {client.inadimplente && (
              <span className="px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                inadimplente
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-0.5" style={{ fontSize: '0.8rem' }}>{client.cnpj}</p>
          <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>{client.city} / {client.state}</p>
        </div>
      )}

      {/* Produtos */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-muted-foreground mb-3" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Produtos
        </p>
        <div className="space-y-3">
          {lineItems.length > 0 ? (
            lineItems.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{product.name}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Ref. {product.reference}</p>
                </div>
                <p className="text-foreground flex-shrink-0" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{quantity} pares</p>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-secondary/60 border border-border flex items-center justify-center flex-shrink-0">
                <PackageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{productName}</p>
                <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{order.collection}</p>
              </div>
              <p className="text-foreground flex-shrink-0" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{order.items} pares</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalhes do pedido */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-muted-foreground mb-3" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Detalhes do pedido
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr_1fr] gap-4 sm:gap-8">
          {/* column 1: status + order id/name */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[order.status]}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                <StatusIcon className="w-3 h-3" />
                {order.status}
              </span>
              <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: '0.72rem' }}>{support}</span>
            </div>
            <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              <span className="mono">{order.id}</span> — {productName}
            </p>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.72rem' }}>Representante: {order.rep}</p>
          </div>

          {/* column 2: value + payment + link to Pagamentos e Boletos */}
          <div className="min-w-0 sm:border-l sm:border-border sm:pl-8">
            <p className="text-foreground mono" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{formatCurrency(order.total)}</p>
            <p className="text-muted-foreground mb-1.5" style={{ fontSize: '0.8rem' }}>{order.paymentCondition}</p>
            {profile !== 'rep' && (
              <button
                onClick={() => onNavigate('boletos')}
                className="flex items-center gap-1 text-primary hover:underline"
                style={{ fontSize: '0.78rem', fontWeight: 600 }}
              >
                Ver em Pagamentos e Boletos <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* column 3: NF de compra */}
          <div className="min-w-0 sm:border-l sm:border-border sm:pl-8">
            <p className="text-muted-foreground mb-1.5" style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              NF de compra
            </p>
            {order.status === 'faturado' || order.status === 'entregue' ? (
              <button
                onClick={() => toast.success('Nota fiscal baixada')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                style={{ fontSize: '0.78rem', fontWeight: 500 }}
              >
                <DownloadSimpleIcon className="w-3.5 h-3.5" /> Baixar NF
              </button>
            ) : (
              <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>NF indisponível</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
