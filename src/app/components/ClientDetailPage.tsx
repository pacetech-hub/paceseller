import { useMemo, useState } from "react";
import {
  ChevronLeft, ChevronDown, MapPin, LayoutGrid, ShoppingCart, BarChart3, Clock, PackageX, TrendingUp, PackageMinus, PackageSearch, Package2,
} from "lucide-react";
import { formatCurrency, products, type Client, type Product } from "../data/mockData";
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

type StockStatusKey = 'zerado' | 'alto-giro' | 'chegando-ao-fim' | 'parado';

const STOCK_STATUS_CONFIG: Record<StockStatusKey, { label: string; cls: string; icon: any }> = {
  'zerado': { label: 'Estoque zerado', cls: 'text-red-400 bg-red-400/10', icon: PackageX },
  'alto-giro': { label: 'Alto giro', cls: 'text-emerald-400 bg-emerald-400/10', icon: TrendingUp },
  'chegando-ao-fim': { label: 'Estoque chegando ao fim', cls: 'text-amber-400 bg-amber-400/10', icon: PackageMinus },
  'parado': { label: 'Parado no estoque', cls: 'text-muted-foreground bg-secondary', icon: PackageSearch },
};

// mock: classificação determinística do status de estoque por produto
function stockStatusOf(p: Product): StockStatusKey {
  if (p.availability === 'esgotado') return 'zerado';
  if (p.availability === 'baixo estoque') return 'chegando-ao-fim';
  if (p.soldUnits < 600) return 'zerado';
  if (p.soldUnits < 900) return 'parado';
  return 'alto-giro';
}

function seededScore(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

type RankItem = { key: string; label: string; sub?: string; pct: number };

const PRODUCT_COLORS = Array.from(new Set(products.flatMap(p => p.colors)));
const PRODUCT_LINES = Array.from(new Set(products.map(p => p.line)));

const COLOR_SWATCH: Record<string, string> = {
  'Denim': '#4a6fa5',
  'Azul': '#2563eb',
  'Branco': '#f5f5f5',
  'Vermelho': '#ef4444',
  'Marrom': '#7c4a2d',
  'Preto': '#111111',
  'Navy': '#1e3a5f',
};

// curva de participação por posição no ranking (top 5), soma 100
const RANK_DECAY = [34, 24, 18, 14, 10];

// mock: ranking determinístico de números (tamanhos) mais vendidos para este cliente
function sizeRanking(clientId: string): RankItem[] {
  const sizes = Object.keys(products[0].grades);
  return sizes
    .map(size => ({ size, raw: seededScore(`${clientId}-size-${size}`) }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 5)
    .map((x, i) => ({ key: x.size, label: `Nº ${x.size}`, pct: RANK_DECAY[i] }));
}

// mock: ranking determinístico de cores mais vendidas para este cliente
function colorRanking(clientId: string): RankItem[] {
  return PRODUCT_COLORS
    .map(color => ({ color, raw: seededScore(`${clientId}-color-${color}`) }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 5)
    .map((x, i) => ({ key: x.color, label: x.color, pct: RANK_DECAY[i] }));
}

// mock: ranking determinístico de tipos (linhas) mais vendidos para este cliente
function typeRanking(clientId: string): RankItem[] {
  return PRODUCT_LINES
    .map(line => ({ line, raw: seededScore(`${clientId}-line-${line}`) }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 5)
    .map((x, i) => ({ key: x.line, label: x.line, pct: RANK_DECAY[i] }));
}

export function ClientDetailPage({ client, onNavigate, cartCount }: ClientDetailPageProps) {
  const [expanded, setExpanded] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockStatusKey | 'todos'>('todos');

  const buyProducts = useMemo(
    () => products.map(p => ({ ...p, stockStatus: stockStatusOf(p) })),
    []
  );
  const filteredBuyProducts = stockFilter === 'todos' ? buyProducts : buyProducts.filter(p => p.stockStatus === stockFilter);

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
  const sizeRanks = sizeRanking(client.id);
  const colorRanks = colorRanking(client.id);
  const typeRanks = typeRanking(client.id);
  const stuckProducts = products.filter(p => stockStatusOf(p) === 'parado');

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
            <h2 className="text-foreground mb-1" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{client.name}</h2>
            <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
              <MapPin className="w-3.5 h-3.5" /> {client.city}/{client.state}
            </p>
          </div>
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
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-muted-foreground" style={{ fontSize: '0.68rem', fontWeight: 600 }}>Endereço</p>
              <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{client.address}</p>
            </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Último pedido</p>
          <p className="text-foreground mono mt-0.5" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{formatOrderDate(client.lastOrder)}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ticket médio por pedido</p>
          <p className="text-foreground mono mt-0.5" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{formatCurrency(avgTicket)}</p>
        </div>
      </div>

      {/* Desempenho de vendas e estoque */}
      <div className="space-y-4">
        <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Desempenho de vendas e estoque</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-foreground mb-3" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Números com mais vendas</h4>
            <div className="space-y-3">
              {sizeRanks.map(s => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-foreground" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</span>
                    <span className="text-muted-foreground mono" style={{ fontSize: '0.7rem' }}>{s.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-foreground mb-3" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Cores com mais vendas</h4>
            <div className="space-y-3">
              {colorRanks.map(c => (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-foreground flex items-center gap-1.5" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      <span className="w-2.5 h-2.5 rounded-full border border-border/60 flex-shrink-0" style={{ background: COLOR_SWATCH[c.key] ?? '#999' }} />
                      {c.label}
                    </span>
                    <span className="text-muted-foreground mono" style={{ fontSize: '0.7rem' }}>{c.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="text-foreground mb-3" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Tipo com mais vendas</h4>
            <div className="space-y-3">
              {typeRanks.map(t => (
                <div key={t.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-foreground" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.label}</span>
                    <span className="text-muted-foreground mono" style={{ fontSize: '0.7rem' }}>{t.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <PackageSearch className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Produtos parados no estoque</h4>
              <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Baixo giro nos últimos meses — considere oferecer com condição especial</p>
            </div>
          </div>
          <div className="space-y-2">
            {stuckProducts.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60">
                <ProductThumb src={p.image} alt={p.name} className="w-10 h-10 rounded-lg flex-shrink-0" iconClassName="w-4 h-4" />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.name}</p>
                  <p className="text-muted-foreground truncate" style={{ fontSize: '0.7rem' }}>{p.line} · {p.reference}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-foreground mono" style={{ fontSize: '0.78rem', fontWeight: 700 }}>{p.soldUnits} un.</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.65rem' }}>vendidas · giro baixo</p>
                </div>
              </div>
            ))}
            {stuckProducts.length === 0 && (
              <p className="text-muted-foreground text-center py-4" style={{ fontSize: '0.8rem' }}>
                Nenhum produto parado no estoque no momento.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sugestões de venda */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Sugestões de venda</h3>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <button
            onClick={() => setStockFilter('todos')}
            className={`px-2.5 py-1 rounded-full transition-colors ${stockFilter === 'todos' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            style={{ fontSize: '0.72rem', fontWeight: 600 }}
          >
            Todos
          </button>
          {(Object.keys(STOCK_STATUS_CONFIG) as StockStatusKey[]).map(key => {
            const cfg = STOCK_STATUS_CONFIG[key];
            return (
              <button
                key={key}
                onClick={() => setStockFilter(key)}
                className={`px-2.5 py-1 rounded-full transition-colors ${stockFilter === key ? 'bg-primary text-primary-foreground' : `${cfg.cls} hover:opacity-80`}`}
                style={{ fontSize: '0.72rem', fontWeight: 600 }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBuyProducts.map(p => (
            <BuyProductCard key={p.id} product={p} onBuy={() => onNavigate('order-grade')} />
          ))}
          {filteredBuyProducts.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-6" style={{ fontSize: '0.8rem' }}>
              Nenhum produto encontrado para este filtro.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductThumb({ src, alt, className, iconClassName, bordered = true }: { src: string; alt: string; className?: string; iconClassName?: string; bordered?: boolean }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`bg-white overflow-hidden ${bordered ? 'border border-border/60' : ''} ${className ?? ''}`}>
      {!imgError ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package2 className={`text-muted-foreground/30 ${iconClassName ?? 'w-8 h-8'}`} />
        </div>
      )}
    </div>
  );
}

function BuyProductCard({ product, onBuy }: { product: Product & { stockStatus: StockStatusKey }; onBuy: () => void }) {
  const cfg = STOCK_STATUS_CONFIG[product.stockStatus];
  const Icon = cfg.icon;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="aspect-square relative">
        <ProductThumb src={product.image} alt={product.name} className="w-full h-full" iconClassName="w-8 h-8" bordered={false} />
        <span className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full ${cfg.cls}`} style={{ fontSize: '0.62rem', fontWeight: 700 }}>
          <Icon className="w-3 h-3" /> {cfg.label}
        </span>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{product.name}</p>
        <p className="text-muted-foreground truncate" style={{ fontSize: '0.7rem' }}>{product.line} · {product.reference}</p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
          <span className="text-foreground mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(product.price)}</span>
          <button
            onClick={onBuy}
            className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ fontSize: '0.72rem', fontWeight: 600 }}
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
