import { Client } from "../data/mockData";
import { SalesIndicatorsSection, getRepTeamEntities, getRepMonthlyTotal } from "./SalesIndicatorsSection";

const CURRENT_REP_NAME = 'Marcos Andrade';

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'stock';

interface DashboardRepProps {
  onNavigate: (view: View) => void;
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  embedded?: boolean;
}

const TICKET = 5000;

export function DashboardRep({ onNavigate, selectedClient, onSelectClient }: DashboardRepProps) {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-foreground" style={{ fontSize: '1.3rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Indicadores</h2>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>Representante · {CURRENT_REP_NAME}{selectedClient ? ` · cliente ativo: ${selectedClient.name}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Período: Mês atual', 'Região: Todas', 'Coleção: Verão 26'].map(c => (
            <span key={c} className="px-2.5 py-1 rounded-full bg-secondary text-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{c}</span>
          ))}
        </div>
      </div>

      {/* VENDAS */}
      <SalesIndicatorsSection
        scope="own"
        entities={getRepTeamEntities(CURRENT_REP_NAME)}
        totalMonthlyBase={getRepMonthlyTotal(CURRENT_REP_NAME)}
        avgTicket={TICKET}
        repName={CURRENT_REP_NAME}
        onNavigateClients={() => onNavigate('clients')}
        onOpenClient={onSelectClient}
      />
    </div>
  );
}
