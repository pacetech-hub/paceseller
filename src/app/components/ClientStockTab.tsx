import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, StorefrontIcon, MapPinIcon, XIcon } from "@phosphor-icons/react";
import { clients as allClients, type Client } from "../data/mockData";
import { generateClientStock, type StockItem } from "../data/stockData";
import { StockTable } from "./StockTable";

interface ClientStockTabProps {
  /** Rep só enxerga os dados, sem controles de edição. */
  readOnly?: boolean;
  /** Restringe a busca a um subconjunto de clientes (ex.: carteira do representante). */
  scopeClients?: Client[];
}

export function ClientStockTab({ readOnly = false, scopeClients }: ClientStockTabProps) {
  const pool = scopeClients ?? allClients;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);

  useEffect(() => {
    if (selected) setItems(generateClientStock(selected));
  }, [selected]);

  const matches = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return [];
    return pool.filter(c => c.name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t)).slice(0, 8);
  }, [query, pool]);

  const updateStock = (sku: string, stock: number) => {
    setItems(prev => prev.map(it => it.sku === sku ? { ...it, stock, updatedAt: new Date().toISOString().slice(0, 10) } : it));
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2.5">
          <MagnifyingGlassIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar cliente por nome ou código..."
            className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
            style={{ fontSize: '0.85rem' }}
          />
          {selected && (
            <button onClick={() => { setSelected(null); setQuery(''); }} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {query && matches.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {matches.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelected(c); setQuery(''); }}
                className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center gap-2 transition-colors"
              >
                <StorefrontIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground truncate" style={{ fontSize: '0.82rem' }}>{c.name}</span>
                <span className="text-muted-foreground ml-auto mono flex-shrink-0" style={{ fontSize: '0.7rem' }}>{c.id}</span>
              </button>
            ))}
          </div>
        )}
        {query && matches.length === 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-card border border-border rounded-lg p-3 text-muted-foreground" style={{ fontSize: '0.78rem' }}>
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      {!selected && (
        <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
          <StorefrontIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p style={{ fontSize: '0.88rem' }}>Busque um cliente acima para ver o estoque reportado por ele.</p>
        </div>
      )}

      {selected && (
        <>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <StorefrontIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate" style={{ fontSize: '0.92rem', fontWeight: 700 }}>{selected.name}</p>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPinIcon className="w-3 h-3" />
                <span style={{ fontSize: '0.75rem' }}>{selected.city} · {selected.state} · Rep: {selected.rep}</span>
              </div>
            </div>
          </div>

          <StockTable
            items={items}
            onUpdateStock={readOnly ? undefined : updateStock}
            readOnly={readOnly}
          />
        </>
      )}
    </div>
  );
}
