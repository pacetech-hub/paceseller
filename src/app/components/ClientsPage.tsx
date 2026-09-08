import { useState } from "react";
import { Search, MapPin, Users, BarChart3, Sparkles } from "lucide-react";
import { clients, Client } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail';

interface ClientsPageProps {
  onNavigate: (view: View) => void;
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
}

const statusColors: Record<string, string> = {
  'ativo': 'text-emerald-400 bg-emerald-400/10',
  'inativo': 'text-red-400 bg-red-400/10',
};

const formatOrderDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Carteira sugerida do dia: clientes do rep "Marcos Andrade" priorizados (ativos + maior volume)
const SUGGESTED_REP = 'Marcos Andrade';

export function ClientsPage({ onNavigate, selectedClient, setSelectedClient }: ClientsPageProps) {
  
  const [mode, setMode] = useState<'sugerida' | 'todos'>('sugerida');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('Todos');

  const regions = ['Todos', 'Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte'];

  const baseList = mode === 'sugerida'
    ? clients.filter(c => c.rep === SUGGESTED_REP)
    : clients;

  const filtered = baseList.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.rep.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilter === 'Todos' || c.region === regionFilter;
    return matchSearch && matchRegion;
  });

  const activeCount = filtered.filter(c => c.status === 'ativo').length;
  const inactiveCount = filtered.filter(c => c.status === 'inativo').length;

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    onNavigate('client-detail');
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">



      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { count: activeCount, suffix: 'clientes ativos' },
          { count: inactiveCount, suffix: 'clientes inativos' },
          { count: filtered.length, suffix: 'total de clientes' },
        ].map(stat => (
          <div key={stat.suffix} className="bg-card border border-border rounded-xl p-4">
            <p className="text-foreground" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              <span className="mono">{stat.count}</span> {stat.suffix}
            </p>
            <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>na carteira filtrada</p>
          </div>
        ))}
      </div>

      {/* Mode toggle: Carteira do dia / Todos */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setMode('sugerida')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-colors ${mode === 'sugerida' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
          style={{ fontSize: '0.8rem', fontWeight: 600 }}
        >
          <Sparkles className="w-3.5 h-3.5" /> Carteira sugerida do dia
        </button>
        <button
          onClick={() => setMode('todos')}
          className={`px-3.5 py-2 rounded-lg border transition-colors ${mode === 'todos' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
          style={{ fontSize: '0.8rem', fontWeight: 600 }}
        >
          Todos os clientes
        </button>
        {mode === 'sugerida' && (
          <span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>
            Selecionados com base em prioridade comercial e visitas do dia
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cliente, cidade, rep..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            style={{ fontSize: '0.82rem' }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-3 py-1.5 rounded-full transition-colors ${regionFilter === r ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
              style={{ fontSize: '0.75rem', fontWeight: 500 }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Client table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 font-semibold text-muted-foreground" style={{ width: '55%' }}>Cliente</th>
              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Representante</th>
              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Último pedido</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(client => {
              const isSelected = selectedClient?.id === client.id;
              return (
                <tr
                  key={client.id}
                  className={`border-b border-border cursor-pointer transition-colors hover:bg-primary/5 ${isSelected ? 'bg-primary/5' : ''}`}
                  onClick={() => handleSelectClient(client)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary" style={{ fontSize: '0.7rem', fontWeight: 700 }}>{client.avatar}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-foreground truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{client.name}</p>
                          <span className={`px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusColors[client.status]}`} style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                            {client.status}
                          </span>
                          {client.inadimplente && (
                            <span className="px-1.5 py-0.5 rounded-full flex-shrink-0 text-amber-400 bg-amber-400/10" style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                              inadimplente
                            </span>
                          )}
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded-full flex-shrink-0 bg-primary/15 text-primary" style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                              selecionado
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '0.72rem' }}>
                          <MapPin className="w-3 h-3" /> {client.city}/{client.state}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.8rem' }}>{client.rep}</td>
                  <td className="px-4 py-3 text-muted-foreground mono" style={{ fontSize: '0.8rem' }}>{formatOrderDate(client.lastOrder)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhum cliente encontrado</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Tente ajustar os filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
