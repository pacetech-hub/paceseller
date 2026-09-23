import { useMemo, useState } from "react";
import {
  WarehouseIcon,
  PlugIcon,
  UploadSimpleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  WarningIcon,
  EmptyIcon,
  CheckSquareIcon,
  TrendDownIcon,
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  PencilSimpleIcon,
  FloppyDiskIcon,
  XIcon,
  FunnelIcon,
} from "@phosphor-icons/react";
import { products, formatCurrency } from "../data/mockData";

type Mode = 'manual' | 'integration';

interface StockItem {
  sku: string;
  name: string;
  line: string;
  category: string;
  image: string;
  price: number;
  stock: number;
  min: number; // limiar de ruptura
  updatedAt: string;
}

const initialStock: StockItem[] = products.slice(0, 12).map((p, i) => ({
  sku: p.id,
  name: p.name,
  line: p.line,
  category: p.category,
  image: p.image,
  price: p.price,
  stock: [0, 2, 18, 45, 6, 0, 23, 4, 31, 12, 1, 58][i] ?? 10,
  min: [5, 5, 10, 10, 8, 5, 15, 8, 10, 10, 5, 20][i] ?? 5,
  updatedAt: '2026-06-18',
}));

function statusOf(s: StockItem): { key: 'ruptura' | 'baixo' | 'ok'; label: string; cls: string } {
  if (s.stock <= 0) return { key: 'ruptura', label: 'Ruptura', cls: 'bg-red-400/15 text-red-400' };
  if (s.stock < s.min) return { key: 'baixo', label: 'Baixo', cls: 'bg-amber-400/15 text-amber-400' };
  return { key: 'ok', label: 'OK', cls: 'bg-emerald-400/15 text-emerald-400' };
}

export function StockPage() {
  const [mode, setMode] = useState<Mode>('manual');
  const [items, setItems] = useState<StockItem[]>(initialStock);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'todos' | 'ruptura' | 'baixo' | 'ok'>('todos');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ stock: number; min: number }>({ stock: 0, min: 0 });
  const [integrationConnected, setIntegrationConnected] = useState(false);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (query && !`${it.name} ${it.sku}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter !== 'todos' && statusOf(it).key !== filter) return false;
      return true;
    });
  }, [items, query, filter]);

  const kpis = useMemo(() => {
    const ruptura = items.filter(i => i.stock <= 0).length;
    const baixo = items.filter(i => i.stock > 0 && i.stock < i.min).length;
    const ok = items.length - ruptura - baixo;
    const valor = items.reduce((s, i) => s + i.stock * i.price, 0);
    return { ruptura, baixo, ok, valor, total: items.length };
  }, [items]);

  const startEdit = (it: StockItem) => {
    setEditing(it.sku);
    setDraft({ stock: it.stock, min: it.min });
  };
  const saveEdit = (sku: string) => {
    setItems(prev => prev.map(it => it.sku === sku ? { ...it, stock: draft.stock, min: draft.min, updatedAt: new Date().toISOString().slice(0, 10) } : it));
    setEditing(null);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto w-full">
      {/* Header / mode toggle */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <WarehouseIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-foreground" style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Meu Estoque · Tesla Footwear</h2>
              <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>
                Mantenha seu estoque atualizado para que o catálogo mostre alertas de ruptura corretamente para seus clientes finais.
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-lg bg-secondary p-0.5">
            {([
              { v: 'manual', l: 'Cadastro manual', icon: PencilSimpleIcon },
              { v: 'integration', l: 'Integração ERP', icon: PlugIcon },
            ] as { v: Mode; l: string; icon: any }[]).map(o => {
              const Icon = o.icon;
              const active = mode === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setMode(o.v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  style={{ fontSize: '0.78rem', fontWeight: 500 }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {o.l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Em ruptura', value: String(kpis.ruptura), sub: `${kpis.total} SKUs cadastrados`, icon: EmptyIcon, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'Estoque baixo', value: String(kpis.baixo), sub: 'abaixo do limiar', icon: TrendDownIcon, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Estoque OK', value: String(kpis.ok), sub: 'disponíveis para venda', icon: CheckSquareIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Valor em estoque', value: formatCurrency(kpis.valor), sub: 'a preço de tabela', icon: WarehouseIcon, color: 'text-black', bg: 'bg-black/10' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted-foreground" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{k.label}</p>
                <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${k.color}`} />
                </div>
              </div>
              <p className="text-foreground" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{k.value}</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: '0.72rem' }}>{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Integration panel */}
      {mode === 'integration' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-black/10 flex items-center justify-center flex-shrink-0">
              <PlugIcon className="w-4 h-4 text-black" />
            </div>
            <div className="flex-1">
              <h3 className="text-foreground" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Integração com seu sistema de estoque</h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.78rem' }}>
                Sincronize automaticamente seu ERP / sistema de gestão. Os dados são lidos a cada hora.
              </p>
            </div>
            {integrationConnected && (
              <span className="px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-400 flex items-center gap-1" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                <CheckCircleIcon className="w-3 h-3" /> Conectado
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {['Bling', 'Tiny ERP', 'Omie', 'API customizada'].map(p => (
              <button
                key={p}
                onClick={() => setIntegrationConnected(true)}
                className="rounded-lg border border-border/60 p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
              >
                <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p}</p>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.7rem' }}>Conectar via OAuth</p>
              </button>
            ))}
          </div>

          {integrationConnected && (
            <div className="rounded-lg bg-secondary/40 border border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowsClockwiseIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>Última sincronização: hoje, 14:02 · próxima em 38min</span>
              </div>
              <button className="px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                Sincronizar agora
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-secondary/40 border border-border rounded-lg px-3 py-2">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por SKU ou nome..."
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            style={{ fontSize: '0.82rem' }}
          />
        </div>
        <div className="inline-flex rounded-lg bg-secondary p-0.5">
          {([
            { v: 'todos', l: 'Todos' },
            { v: 'ruptura', l: 'Ruptura' },
            { v: 'baixo', l: 'Baixo' },
            { v: 'ok', l: 'OK' },
          ] as const).map(o => (
            <button
              key={o.v}
              onClick={() => setFilter(o.v)}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${filter === o.v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              style={{ fontSize: '0.75rem', fontWeight: 500 }}
            >
              {o.l}
            </button>
          ))}
        </div>
        {mode === 'manual' && (
          <>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border text-foreground hover:bg-secondary transition-colors" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
              <UploadSimpleIcon className="w-3.5 h-3.5" /> Importar planilha
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              <PlusIcon className="w-3.5 h-3.5" /> Adicionar SKU
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {['Produto', 'SKU', 'Linha', 'Estoque atual', 'Limiar mín.', 'Status', 'Atualizado', 'Ações'].map(h => (
                  <th key={h} className="text-left text-muted-foreground px-4 py-2.5" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => {
                const st = statusOf(it);
                const isEditing = editing === it.sku;
                return (
                  <tr key={it.sku} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img src={it.image} alt={it.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{it.name}</p>
                          <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{it.category} · {formatCurrency(it.price)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground mono" style={{ fontSize: '0.75rem' }}>{it.sku}</td>
                    <td className="px-4 py-3 text-foreground" style={{ fontSize: '0.78rem' }}>{it.line}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={draft.stock}
                          onChange={e => setDraft(d => ({ ...d, stock: Number(e.target.value) }))}
                          className="w-20 bg-secondary border border-border rounded-md px-2 py-1 text-foreground outline-none focus:border-primary"
                          style={{ fontSize: '0.78rem' }}
                        />
                      ) : (
                        <span className="text-foreground mono" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{it.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={draft.min}
                          onChange={e => setDraft(d => ({ ...d, min: Number(e.target.value) }))}
                          className="w-20 bg-secondary border border-border rounded-md px-2 py-1 text-foreground outline-none focus:border-primary"
                          style={{ fontSize: '0.78rem' }}
                        />
                      ) : (
                        <span className="text-muted-foreground mono" style={{ fontSize: '0.78rem' }}>{it.min}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full ${st.cls} inline-flex items-center gap-1`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                        {st.key !== 'ok' && <WarningIcon className="w-3 h-3" />}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.72rem' }}>{it.updatedAt}</td>
                    <td className="px-4 py-3">
                      {mode === 'manual' ? (
                        isEditing ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => saveEdit(it.sku)} className="p-1.5 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
                              <FloppyDiskIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditing(null)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(it)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                            <PencilSimpleIcon className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : (
                        <span className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>via ERP</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground" style={{ fontSize: '0.82rem' }}>
                    <FunnelIcon className="w-5 h-5 mx-auto mb-2 opacity-60" />
                    Nenhum SKU encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
