import { useState } from "react";
import {
  FunnelIcon,
  TagIcon,
  StackIcon,
  PaletteIcon,
  CurrencyDollarIcon,
  ListIcon,
  XIcon,
  SignOutIcon,
  CaretLeftIcon,
  CaretRightIcon,
  StorefrontIcon,
  MagnifyingGlassIcon,
  CaretUpIcon,
  CaretDownIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import type { Client } from "../data/mockData";
import { products, formatCurrency } from "../data/mockData";
import teslaLogo from "../../assets/tesla-footwear-logo.png";

export type CatalogFilters = {
  search: string;
  line: string;
  category: string;
  colors: string[];
  priceRange: [number, number];
  priceTable: string;
};

export const priceTables = [
  { id: 'padrao', label: 'Tabela Padrão', desc: '30/60/90 dias' },
  { id: 'avista', label: 'À vista', desc: '5% desconto' },
  { id: 'promo', label: 'Tabela Promocional', desc: 'Coleção atual' },
  { id: 'atacado', label: 'Atacado', desc: 'Acima de 50 pares' },
];


const lines = ['Todos', 'Premium', 'Urban', 'Sport', 'Flow', 'Flow XL', 'Coil', 'Hertz', 'Hertz Art'];
const categories = ['Todos', 'Social', 'Casual', 'Esportivo', 'Sandália', 'Bota'];

const allColors = Array.from(
  new Set(products.flatMap(p => p.colors))
).sort();

const colorSwatch: Record<string, string> = {
  Preto: '#111', Branco: '#fff', Azul: '#2563eb', Navy: '#1e3a8a',
  Vermelho: '#dc2626', Marrom: '#7c4a2a', Denim: '#3b6ea5',
  Cinza: '#6b7280', Verde: '#16a34a', Amarelo: '#facc15',
  Rosa: '#ec4899', Bege: '#d6c2a3',
};

const priceMin = Math.floor(Math.min(...products.map(p => p.price)));
const priceMax = Math.ceil(Math.max(...products.map(p => p.price)));

export const defaultFilters: CatalogFilters = {
  search: '',
  line: 'Todos',
  category: 'Todos',
  colors: [],
  priceRange: [priceMin, priceMax],
  priceTable: 'padrao',
};


interface Props {
  filters: CatalogFilters;
  onChange: (f: CatalogFilters) => void;
  onLogout: () => void;
  profile?: 'lojista' | 'rep' | 'admin';
  selectedClient?: Client | null;
}

export function LojistaFiltersSidebar({ filters, onChange, onLogout, profile = 'lojista', selectedClient }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleColor = (c: string) => {
    const next = filters.colors.includes(c)
      ? filters.colors.filter(x => x !== c)
      : [...filters.colors, c];
    onChange({ ...filters, colors: next });
  };

  const toggleSection = (label: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const reset = () => onChange(defaultFilters);

  const activeCount =
    (filters.line !== 'Todos' ? 1 : 0) +
    (filters.category !== 'Todos' ? 1 : 0) +
    filters.colors.length +
    (filters.priceRange[0] !== priceMin || filters.priceRange[1] !== priceMax ? 1 : 0);

  const Content = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center border-b border-sidebar-border px-4 h-14 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-7 h-7' : 'h-8'}`}>
          <img src={teslaLogo} alt="Tesla Footwear" className={collapsed ? 'h-6 w-auto object-contain' : 'h-7 w-auto object-contain'} />
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="ml-auto text-muted-foreground hover:text-foreground p-1 rounded">
            <CaretLeftIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed ? (
        <div className="flex-1 flex flex-col items-center pt-4 gap-3">
          <button onClick={() => setCollapsed(false)} className="p-2 rounded-md bg-primary/15 text-primary" title="Filtros">
            <FunnelIcon className="w-4 h-4" />
          </button>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground" style={{ fontSize: '0.6rem', fontWeight: 700 }}>
              {activeCount}
            </span>
          )}
        </div>
      ) : (
        <>

          {/* Tabela de Preço */}
          <div className="px-3 pt-3 pb-3 border-b border-sidebar-border">
            <div className="flex items-center gap-1.5 mb-1.5">
              <CurrencyDollarIcon className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground" style={{ fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Tabela de preço
              </span>
            </div>
            <select
              value={filters.priceTable}
              onChange={e => onChange({ ...filters, priceTable: e.target.value })}
              className="w-full px-2.5 py-2 rounded-md bg-secondary/40 border border-border text-foreground outline-none focus:border-primary cursor-pointer"
              style={{ fontSize: '0.78rem', fontWeight: 500 }}
            >
              {priceTables.map(t => (
                <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>
              ))}
            </select>
          </div>


          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Filtros</span>
              {activeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/15 text-primary" style={{ fontSize: '0.62rem', fontWeight: 700 }}>
                  {activeCount}
                </span>
              )}
            </div>
            {activeCount > 0 && (
              <button onClick={reset} className="text-muted-foreground hover:text-foreground flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                <XIcon className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={filters.search}
                onChange={e => onChange({ ...filters, search: e.target.value })}
                placeholder="Buscar produto..."
                className="w-full pl-8 pr-3 py-2 rounded-md bg-secondary/40 border border-border text-foreground outline-none focus:border-primary"
                style={{ fontSize: '0.78rem' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-5">
            {/* Modelo / Linha */}
            <FilterSection
              icon={TagIcon}
              label="Modelo / Linha"
              isOpen={openSections.has('Modelo / Linha')}
              onToggle={() => toggleSection('Modelo / Linha')}
            >
              <div className="flex flex-wrap gap-1.5">
                {lines.map(l => (
                  <button
                    key={l}
                    onClick={() => onChange({ ...filters, line: l })}
                    className={`px-2.5 py-1 rounded-full transition-colors ${filters.line === l ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'}`}
                    style={{ fontSize: '0.72rem', fontWeight: 500 }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Categoria */}
            <FilterSection
              icon={StackIcon}
              label="Categoria"
              isOpen={openSections.has('Categoria')}
              onToggle={() => toggleSection('Categoria')}
            >
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => onChange({ ...filters, category: c })}
                    className={`px-2.5 py-1 rounded-full transition-colors ${filters.category === c ? 'bg-primary text-primary-foreground' : 'bg-secondary/60 text-muted-foreground hover:text-foreground'}`}
                    style={{ fontSize: '0.72rem', fontWeight: 500 }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Cores */}
            <FilterSection
              icon={PaletteIcon}
              label="Cores"
              isOpen={openSections.has('Cores')}
              onToggle={() => toggleSection('Cores')}
            >
              <div className="grid grid-cols-6 gap-1.5">
                {allColors.map(c => {
                  const active = filters.colors.includes(c);
                  const bg = colorSwatch[c] || '#94a3b8';
                  return (
                    <button
                      key={c}
                      onClick={() => toggleColor(c)}
                      title={c}
                      className={`relative w-5 h-5 rounded-full border-2 transition-all ${active ? 'border-primary scale-110' : 'border-border hover:border-foreground/40'}`}
                      style={{ background: bg }}
                    >
                      {active && (
                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold" style={{ color: bg === '#fff' ? '#111' : '#fff' }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {filters.colors.length > 0 && (
                <p className="mt-2 text-muted-foreground" style={{ fontSize: '0.68rem' }}>
                  {filters.colors.join(', ')}
                </p>
              )}
            </FilterSection>

            {/* Preço */}
            <FilterSection
              icon={CurrencyDollarIcon}
              label="Faixa de preço"
              isOpen={openSections.has('Faixa de preço')}
              onToggle={() => toggleSection('Faixa de preço')}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-muted-foreground" style={{ fontSize: '0.72rem' }}>
                  <span>{formatCurrency(priceMin)}</span>
                  <span>{formatCurrency(filters.priceRange[1])}</span>
                </div>
                <input
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  value={filters.priceRange[1]}
                  onChange={e => onChange({ ...filters, priceRange: [priceMin, Number(e.target.value)] })}
                  className="w-full accent-primary"
                />
              </div>
            </FilterSection>
          </div>
        </>
      )}

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-2">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${profile === 'rep' ? 'bg-amber-400/20' : 'bg-emerald-400/20'}`}>
              {profile === 'rep'
                ? <UsersIcon className="w-3.5 h-3.5 text-amber-400" />
                : <StorefrontIcon className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-foreground truncate" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                {profile === 'rep' ? 'Representante' : 'Lojista'}
              </div>
              <div className="text-muted-foreground truncate" style={{ fontSize: '0.7rem' }}>
                {profile === 'rep' ? 'marcos@tesla.com.br' : 'loja@tesla.com.br'}
              </div>
            </div>
            <button onClick={onLogout} className="text-muted-foreground hover:text-destructive p-1 rounded" title="Sair">
              <SignOutIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center p-2.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary/60"
          >
            <CaretRightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-foreground"
      >
        <ListIcon className="w-4 h-4" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full bg-sidebar border-r border-sidebar-border">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1">
              <XIcon className="w-4 h-4" />
            </button>
            <Content />
          </div>
        </div>
      )}

      <aside className={`hidden lg:flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-[52px]' : 'w-[280px]'}`}>
        <Content />
      </aside>
    </>
  );
}

function FilterSection({
  icon: Icon,
  label,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground" style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        </div>
        {isOpen ? (
          <CaretUpIcon className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <CaretDownIcon className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
      {isOpen && <div className="animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
}
