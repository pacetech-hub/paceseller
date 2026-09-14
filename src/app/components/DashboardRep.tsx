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
