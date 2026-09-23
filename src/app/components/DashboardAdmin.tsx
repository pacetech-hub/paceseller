import { Container } from "@mantine/core";
import { SalesIndicatorsSection, getNetworkEntities, getNetworkMonthlyTotal } from "./SalesIndicatorsSection";
import type { Client } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'sales-team' | 'stock';

interface DashboardAdminProps {
  onNavigate: (view: View) => void;
  onSelectClient: (client: Client) => void;
  onOpenOrderStatus: (status: string) => void;
}

const TICKET = 4030;

export function DashboardAdmin({ onNavigate, onSelectClient, onOpenOrderStatus }: DashboardAdminProps) {
  return (
    <Container size={1400} p="lg" w="100%">
      {/* VENDAS */}
      <SalesIndicatorsSection
        scope="network"
        entities={getNetworkEntities()}
        totalMonthlyBase={getNetworkMonthlyTotal()}
        avgTicket={TICKET}
        onNavigateClients={() => onNavigate('clients')}
        onOpenClient={onSelectClient}
        onOpenSalesTeam={() => onNavigate('sales-team')}
        onOpenStatus={onOpenOrderStatus}
      />

    </Container>
  );
}
