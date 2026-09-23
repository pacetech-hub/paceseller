import { Stack } from "@mantine/core";
import { Client } from "../data/mockData";
import { SalesIndicatorsSection, getRepTeamEntities, getRepMonthlyTotal } from "./SalesIndicatorsSection";

export const CURRENT_REP_NAME = 'Marcos Andrade';

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'sales-team' | 'stock';

interface DashboardRepProps {
  onNavigate: (view: View) => void;
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  onOpenOrderStatus: (status: string) => void;
  embedded?: boolean;
}

const TICKET = 5000;

export function DashboardRep({ onNavigate, selectedClient, onSelectClient, onOpenOrderStatus }: DashboardRepProps) {
  return (
    <Stack gap="lg" p="lg" maw={1400} mx="auto" w="100%">
      {/* VENDAS */}
      <SalesIndicatorsSection
        scope="own"
        entities={getRepTeamEntities(CURRENT_REP_NAME)}
        totalMonthlyBase={getRepMonthlyTotal(CURRENT_REP_NAME)}
        avgTicket={TICKET}
        repName={CURRENT_REP_NAME}
        onNavigateClients={() => onNavigate('clients')}
        onOpenClient={onSelectClient}
        onOpenSalesTeam={() => onNavigate('sales-team')}
        onOpenStatus={onOpenOrderStatus}
      />
    </Stack>
  );
}
