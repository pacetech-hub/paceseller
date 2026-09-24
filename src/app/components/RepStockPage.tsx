import { useState } from "react";
import { Container, Stack, Group, SegmentedControl, Badge } from "@mantine/core";
import { WarehouseIcon, StorefrontIcon, EyeIcon } from "@phosphor-icons/react";
import { clients } from "../data/mockData";
import { IndustryStockTable } from "./IndustryStockTable";
import { ClientStockTab } from "./ClientStockTab";

const tabs = [
  { id: 'industrial', label: 'Estoque Industrial', icon: WarehouseIcon },
  { id: 'cliente', label: 'Estoque do Cliente', icon: StorefrontIcon },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function RepStockPage() {
  const [activeTab, setActiveTab] = useState<TabId>('industrial');
  const myClients = clients.filter(c => c.rep === 'Marcos Andrade');

  return (
    <Container size={1400} p="lg" w="100%">
      <Stack gap="lg">
        <Group justify="space-between" gap="sm" wrap="wrap">
          <SegmentedControl
            value={activeTab}
            onChange={v => setActiveTab(v as TabId)}
            data={tabs.map(tab => {
              const Icon = tab.icon;
              return {
                value: tab.id,
                label: (
                  <Group gap={8} wrap="nowrap">
                    <Icon size={14} />
                    {tab.label}
                  </Group>
                ),
              };
            })}
          />
          <Badge variant="light" color="gray" leftSection={<EyeIcon size={12} />}>
            Somente visualização
          </Badge>
        </Group>

        {activeTab === 'industrial' ? (
          <IndustryStockTable readOnly />
        ) : (
          <ClientStockTab readOnly scopeClients={myClients} />
        )}
      </Stack>
    </Container>
  );
}
