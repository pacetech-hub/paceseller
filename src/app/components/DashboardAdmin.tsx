import { SalesIndicatorsSection, getNetworkEntities, getNetworkMonthlyTotal } from "./SalesIndicatorsSection";
import type { Client } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'sales-team' | 'stock';

interface DashboardAdminProps {
  onNavigate: (view: View) => void;
  onSelectClient: (client: Client) => void;
}

const TICKET = 4030;

export function DashboardAdmin({ onNavigate, onSelectClient }: DashboardAdminProps) {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto w-full">
      {/* VENDAS */}
      <SalesIndicatorsSection
        scope="network"
        entities={getNetworkEntities()}
        totalMonthlyBase={getNetworkMonthlyTotal()}
        avgTicket={TICKET}
        onNavigateClients={() => onNavigate('clients')}
        onOpenClient={onSelectClient}
        onOpenSalesTeam={() => onNavigate('sales-team')}
      />

    </div>
  );
}
