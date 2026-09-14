import { SalesIndicatorsSection, getNetworkEntities, getNetworkMonthlyTotal } from "./SalesIndicatorsSection";
import type { Client } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'stock';

interface DashboardAdminProps {
  onNavigate: (view: View) => void;
  onSelectClient: (client: Client) => void;
}

const TICKET = 4030;

export function DashboardAdmin({ onNavigate, onSelectClient }: DashboardAdminProps) {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-foreground" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Indicadores da rede</h2>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>Indústria · Pace Calçados · visão completa da rede</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Período: Mês atual', 'Rep: Todos', 'Região: Todas', 'Coleção: Verão 26'].map(c => (
            <span key={c} className="px-2.5 py-1 rounded-full bg-secondary text-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{c}</span>
          ))}
        </div>
      </div>

      {/* VENDAS */}
      <SalesIndicatorsSection
        scope="network"
        entities={getNetworkEntities()}
        totalMonthlyBase={getNetworkMonthlyTotal()}
        avgTicket={TICKET}
        onNavigateClients={() => onNavigate('clients')}
        onOpenClient={onSelectClient}
      />

    </div>
  );
}
