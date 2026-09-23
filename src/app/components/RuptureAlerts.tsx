import { useState } from "react";
import {
  WarningIcon,
  UserMinusIcon,
  EmptyIcon,
  TrendDownIcon,
  SlidersHorizontalIcon,
  CaretRightIcon,
  MapPinIcon,
  CubeIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";

type Profile = 'rep' | 'admin';
type TabKey = 'risco' | 'encalhe' | 'meta' | 'ruptura';

interface RuptureAlertsProps {
  profile: Profile;
}

// ---------- MOCK DATA ----------
const riskClientsRep = [
  { id: 'C001', name: 'Calçados Beira Rio', city: 'Porto Alegre, RS', lastVisit: 62, lastOrder: 78, value: 48200, severity: 'alta' },
  { id: 'C002', name: 'Sapataria Central', city: 'Florianópolis, SC', lastVisit: 51, lastOrder: 55, value: 31500, severity: 'alta' },
  { id: 'C003', name: 'Loja Modelo SP', city: 'São Paulo, SP', lastVisit: 44, lastOrder: 49, value: 22800, severity: 'media' },
  { id: 'C004', name: 'Calçados Estrela', city: 'Curitiba, PR', lastVisit: 38, lastOrder: 42, value: 18900, severity: 'media' },
];

const riskClientsAdmin = [
  { group: 'Sul', count: 28, value: 412000, reps: 4 },
  { group: 'Sudeste', count: 41, value: 689000, reps: 7 },
  { group: 'Nordeste', count: 19, value: 287000, reps: 3 },
  { group: 'Centro-Oeste', count: 11, value: 158000, reps: 2 },
];

const stalledProductsRep = [
  { sku: 'SKU-8821', name: 'Bota Chelsea Couro Preta', line: 'Flow XL', days: 67, stock: 142 },
  { sku: 'SKU-7745', name: 'Oxford Clássico Marrom', line: 'Hertz Art', days: 54, stock: 98 },
  { sku: 'SKU-9012', name: 'Derby Casual Urban', line: 'Flow', days: 48, stock: 76 },
];

const stalledProductsAdmin = [
  { group: 'Flow XL', count: 14, units: 2840, value: 312000 },
  { group: 'Hertz Art', count: 9, units: 1620, value: 198000 },
  { group: 'Flow', count: 7, units: 1180, value: 142000 },
  { group: 'Urban Series', count: 5, units: 720, value: 86000 },
];

const repMonthlyRep = [
  { month: 'Abr', meta: 480, real: 412 },
  { month: 'Mai', meta: 480, real: 398 },
  { month: 'Jun', meta: 480, real: 421 },
];

// Ruptura no Catálogo — produtos indisponíveis para compra
const catalogRuptureRep = [
  { sku: 'SKU-001', name: 'Bota Chelsea Couro Preta', line: 'Flow XL', lastStock: 0, clientsAffected: 3, lastSale: 12 },
  { sku: 'SKU-002', name: 'Oxford Clássico Marrom', line: 'Hertz Art', lastStock: 0, clientsAffected: 2, lastSale: 8 },
  { sku: 'SKU-003', name: 'Derby Casual Urban', line: 'Flow', lastStock: 0, clientsAffected: 5, lastSale: 5 },
];

const catalogRuptureAdmin = [
  { group: 'Flow XL', count: 4, skus: 'SKU-001, SKU-008, SKU-015, SKU-022', totalClients: 18 },
  { group: 'Hertz Art', count: 3, skus: 'SKU-002, SKU-009, SKU-016', totalClients: 12 },
  { group: 'Flow', count: 2, skus: 'SKU-003, SKU-010', totalClients: 9 },
  { group: 'Urban Series', count: 1, skus: 'SKU-004', totalClients: 4 },
];

const repsBelowAdmin = [
  { name: 'Roberto Silva', region: 'Sul', manager: 'João Lima', months: 4, gap: -18 },
  { name: 'Patrícia Mendes', region: 'Nordeste', manager: 'Marina Costa', months: 3, gap: -22 },
  { name: 'Lucas Ferreira', region: 'Sudeste', manager: 'João Lima', months: 3, gap: -12 },
];

const severityColor = (s: string) =>
  s === 'alta' ? 'bg-amber-500/15 text-amber-500' : s === 'media' ? 'bg-amber-400/15 text-amber-400' : 'bg-black/15 text-black';

export function RuptureAlerts({ profile }: RuptureAlertsProps) {
  const [tab, setTab] = useState<TabKey>('risco');
  const [groupBy, setGroupBy] = useState<'regiao' | 'segmento' | 'rep'>('regiao');
  const [stalledGroupBy, setStalledGroupBy] = useState<'linha' | 'marca' | 'regiao'>('linha');
  const [ruptureGroupBy, setRuptureGroupBy] = useState<'linha' | 'marca' | 'regiao'>('linha');

  const tabs: { key: TabKey; label: string; icon: any; count: number }[] = [
    { key: 'risco', label: 'Risco de Cliente', icon: UserMinusIcon, count: profile === 'rep' ? riskClientsRep.length : 99 },
    { key: 'encalhe', label: 'Encalhe de Produto', icon: EmptyIcon, count: profile === 'rep' ? stalledProductsRep.length : 35 },
    { key: 'meta', label: 'Meta Inatingível', icon: TrendDownIcon, count: profile === 'rep' ? 1 : repsBelowAdmin.length },
    { key: 'ruptura', label: 'Ruptura no Catálogo', icon: WarningOctagonIcon, count: profile === 'rep' ? catalogRuptureRep.length : 10 },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
            <WarningIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Alerta de Riscos</h3>
            <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>
              {profile === 'rep' ? 'Sinais críticos na sua carteira' : 'Sinais críticos consolidados'}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: '0.72rem' }}>
          <SlidersHorizontalIcon className="w-3.5 h-3.5" /> Limiares
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 border-b border-border">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 -mb-px transition-colors ${
                active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontSize: '0.78rem', fontWeight: 500 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full ${active ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`} style={{ fontSize: '0.62rem', fontWeight: 700 }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="p-5">
        {tab === 'risco' && (profile === 'rep' ? (
          <div className="space-y-2">
            {riskClientsRep.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground truncate" style={{ fontSize: '0.83rem', fontWeight: 500 }}>{c.name}</p>
                    <span className={`px-1.5 py-0.5 rounded-full ${severityColor(c.severity)}`} style={{ fontSize: '0.62rem', fontWeight: 700 }}>
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.72rem' }}>
                    <MapPinIcon className="inline w-3 h-3 mr-0.5" />{c.city} · sem visita há <span className="text-amber-400 font-semibold">{c.lastVisit}d</span> · sem pedido há <span className="text-amber-400 font-semibold">{c.lastOrder}d</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-foreground mono" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatCurrency(c.value)}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.65rem' }}>histórico 12m</p>
                </div>
                <CaretRightIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <GroupBySwitch value={groupBy} onChange={setGroupBy} options={[{v:'regiao',l:'Região'},{v:'segmento',l:'Segmento'},{v:'rep',l:'Rep responsável'}]} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {riskClientsAdmin.map(g => (
                <div key={g.group} className="rounded-lg border border-border/60 p-3 hover:border-primary/30 transition-colors cursor-pointer">
                  <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{g.group}</p>
                  <p className="text-foreground mt-1" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{g.count}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>clientes em risco</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                    <span className="text-foreground mono" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{formatCurrency(g.value)}</span>
                    <span className="text-muted-foreground" style={{ fontSize: '0.65rem' }}>{g.reps} reps</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ))}

        {tab === 'encalhe' && (profile === 'rep' ? (
          <div className="space-y-2">
            {stalledProductsRep.map(p => (
              <div key={p.sku} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <EmptyIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate" style={{ fontSize: '0.83rem', fontWeight: 500 }}>{p.name}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{p.sku} · {p.line}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{p.days}d sem venda</p>
                  <p className="text-muted-foreground mono" style={{ fontSize: '0.68rem' }}>{p.stock} un. estoque</p>
                </div>
              </div>
            ))}
            <p className="text-muted-foreground text-center pt-2" style={{ fontSize: '0.72rem' }}>
              Você não vendeu esses produtos nos últimos 60 dias
            </p>
          </div>
        ) : (
          <>
            <GroupBySwitch value={stalledGroupBy} onChange={setStalledGroupBy} options={[{v:'linha',l:'Linha'},{v:'marca',l:'Marca'},{v:'regiao',l:'Região'}]} />
            <div className="space-y-2">
              {stalledProductsAdmin.map(g => (
                <div key={g.group} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                  <div className="flex-1">
                    <p className="text-foreground" style={{ fontSize: '0.83rem', fontWeight: 500 }}>{g.group}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{g.count} SKUs parados · {g.units.toLocaleString('pt-BR')} un.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground mono" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatCurrency(g.value)}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '0.65rem' }}>capital parado</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ))}

        {tab === 'meta' && (profile === 'rep' ? (
          <div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-400/5 border border-amber-400/20 mb-3">
              <WarningIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>3 meses consecutivos abaixo da meta</p>
                <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Risco estrutural identificado. Gap médio: -15%</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {repMonthlyRep.map(m => {
                const pct = Math.round((m.real / m.meta) * 100);
                return (
                  <div key={m.month} className="rounded-lg border border-border/60 p-3 text-center">
                    <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{m.month}/26</p>
                    <p className="text-foreground mt-1" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{pct}%</p>
                    <p className="text-muted-foreground mono" style={{ fontSize: '0.65rem' }}>{m.real}k / {m.meta}k</p>
                    <div className="w-full h-1 rounded-full bg-secondary mt-2">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {repsBelowAdmin.map(r => (
              <div key={r.name} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    {r.name.split(' ').map(p=>p[0]).slice(0,2).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground" style={{ fontSize: '0.83rem', fontWeight: 500 }}>{r.name}</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{r.region} · gestor: {r.manager}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{r.months} meses</p>
                  <p className="text-muted-foreground mono" style={{ fontSize: '0.68rem' }}>gap {r.gap}%</p>
                </div>
              </div>
            ))}
          </div>
        ))}

        {tab === 'ruptura' && (profile === 'rep' ? (
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-400/5 border border-amber-400/20 mb-2">
              <WarningOctagonIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Produtos indisponíveis para compra</p>
                <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Notifique clientes da sua carteira para evitar vendas perdidas e frustração.</p>
              </div>
            </div>
            {catalogRuptureRep.map(p => (
              <div key={p.sku} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-amber-400/30 hover:bg-amber-400/5 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-amber-400/15 flex items-center justify-center flex-shrink-0">
                  <CubeIcon className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground truncate" style={{ fontSize: '0.83rem', fontWeight: 500 }}>{p.name}</p>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400" style={{ fontSize: '0.62rem', fontWeight: 700 }}>Ruptura</span>
                  </div>
                  <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{p.sku} · {p.line} · estoque zerado</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{p.clientsAffected} clientes</p>
                  <p className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>última venda há {p.lastSale}d</p>
                </div>
                <CaretRightIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <GroupBySwitch value={ruptureGroupBy} onChange={setRuptureGroupBy} options={[{v:'linha',l:'Linha'},{v:'marca',l:'Marca'},{v:'regiao',l:'Região'}]} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {catalogRuptureAdmin.map(g => (
                <div key={g.group} className="rounded-lg border border-amber-400/20 p-3 hover:border-amber-400/40 transition-colors cursor-pointer bg-amber-400/5">
                  <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{g.group}</p>
                  <p className="text-foreground mt-1" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{g.count}</p>
                  <p className="text-amber-400" style={{ fontSize: '0.7rem', fontWeight: 600 }}>SKUs em ruptura</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-400/10">
                    <span className="text-foreground" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{g.totalClients} clientes</span>
                    <span className="text-muted-foreground" style={{ fontSize: '0.65rem' }}>{g.skus}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ))}
      </div>
    </div>
  );
}

function GroupBySwitch<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { v: T; l: string }[];
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Agrupar por:</span>
      <div className="inline-flex rounded-lg bg-secondary p-0.5">
        {options.map(o => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              value === o.v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontSize: '0.72rem', fontWeight: 500 }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
