import { useState } from "react";
import { Search, MapPin, Users, BarChart3, Sparkles, Filter, ArrowUpDown } from "lucide-react";
import { clients, Client } from "../data/mockData";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";

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

const REGIONS = ['Centro-Oeste', 'Norte', 'Nordeste', 'Sudeste', 'Sul'];

type StatusFilterValue = 'ativo' | 'inativo' | 'inadimplente';
const STATUS_OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: 'ativo', label: 'ativo' },
  { value: 'inativo', label: 'inativo' },
  { value: 'inadimplente', label: 'inadimplente' },
];

type SortOrder = 'padrao' | 'az' | 'za' | 'ultimo-pedido';
const SORT_OPTIONS: Array<{ value: SortOrder; label: string }> = [
  { value: 'az', label: 'A a Z' },
  { value: 'za', label: 'Z a A' },
  { value: 'ultimo-pedido', label: 'Pedido mais antigo para mais recente' },
];

export function ClientsPage({ onNavigate, selectedClient, setSelectedClient }: ClientsPageProps) {

  const [mode, setMode] = useState<'sugerida' | 'todos'>('sugerida');
  const [search, setSearch] = useState('');
  const [regionFilters, setRegionFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusFilterValue[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('padrao');

  const toggleRegion = (region: string) => {
    setRegionFilters(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  };

  const toggleStatus = (status: StatusFilterValue) => {
    setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const clearFilters = () => {
    setRegionFilters([]);
    setStatusFilters([]);
  };

  const activeFilterCount = regionFilters.length + statusFilters.length;
  const sortActive = sortOrder !== 'padrao';

  const baseList = mode === 'sugerida'
    ? clients.filter(c => c.rep === SUGGESTED_REP)
    : clients;

  const filtered = baseList.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.rep.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilters.length === 0 || regionFilters.includes(c.region);
    const matchStatus = statusFilters.length === 0 || statusFilters.some(s => s === 'inadimplente' ? c.inadimplente : c.status === s);
    return matchSearch && matchRegion && matchStatus;
  });

  const sortedClients = [...filtered].sort((a, b) => {
    if (sortOrder === 'az') return a.name.localeCompare(b.name, 'pt-BR');
    if (sortOrder === 'za') return b.name.localeCompare(a.name, 'pt-BR');
    if (sortOrder === 'ultimo-pedido') return a.lastOrder.localeCompare(b.lastOrder);
    return 0;
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
          { count: filtered.length, suffix: 'clientes no total' },
          { count: activeCount, suffix: 'ativos' },
          { count: inactiveCount, suffix: 'inativos' },
        ].map(stat => (
          <div key={stat.suffix} className="bg-card border border-border rounded-xl p-4 flex items-baseline gap-2">
            <span className="text-foreground mono" style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{stat.count}</span>
            <span className="text-muted-foreground" style={{ fontSize: '0.78rem', fontWeight: 500 }}>{stat.suffix}</span>
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
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-colors ${activeFilterCount > 0 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
              style={{ fontSize: '0.8rem', fontWeight: 600 }}
            >
              <Filter className="w-3.5 h-3.5" /> Filtros
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground" style={{ fontSize: '0.62rem', fontWeight: 700, width: '1.1rem', height: '1.1rem' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-4">
            <div>
              <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: '0.68rem', fontWeight: 600 }}>Região</p>
              <div className="flex flex-wrap gap-1.5">
                {REGIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => toggleRegion(r)}
                    className={`px-3 py-1.5 rounded-full transition-colors ${regionFilters.includes(r) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: '0.68rem', fontWeight: 600 }}>Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => toggleStatus(s.value)}
                    className={`px-3 py-1.5 rounded-full transition-colors ${statusFilters.includes(s.value) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground underline"
                style={{ fontSize: '0.75rem', fontWeight: 500 }}
              >
                Limpar filtros
              </button>
            )}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-colors ${sortActive ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
              style={{ fontSize: '0.8rem', fontWeight: 600 }}
            >
              <ArrowUpDown className="w-3.5 h-3.5" /> Ordenar
              {sortActive && (
                <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground" style={{ fontSize: '0.62rem', fontWeight: 700, width: '1.1rem', height: '1.1rem' }}>
                  1
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <div>
              <p className="text-muted-foreground uppercase tracking-wider mb-2" style={{ fontSize: '0.68rem', fontWeight: 600 }}>Ordenar por</p>
              <div className="space-y-1">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortOrder(prev => prev === opt.value ? 'padrao' : opt.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${sortOrder === opt.value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'}`}
                    style={{ fontSize: '0.78rem', fontWeight: 500 }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {sortActive && (
              <button
                onClick={() => setSortOrder('padrao')}
                className="text-muted-foreground hover:text-foreground underline"
                style={{ fontSize: '0.75rem', fontWeight: 500 }}
              >
                Limpar ordenação
              </button>
            )}
          </PopoverContent>
        </Popover>
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
            {sortedClients.map(client => {
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
