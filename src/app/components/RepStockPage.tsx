import { useState } from "react";
import { Box, Container, Stack, Tabs, Badge } from "@mantine/core";
import { EyeIcon } from "@phosphor-icons/react";
import { clients } from "../data/mockData";
import { IndustryStockTable } from "./IndustryStockTable";
import { ClientStockTab } from "./ClientStockTab";

const tabs = [
  { id: 'industrial', label: 'Estoque industrial' },
  { id: 'cliente', label: 'Estoque do cliente' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function RepStockPage() {
  const [activeTab, setActiveTab] = useState<TabId>('industrial');
  const myClients = clients.filter(c => c.rep === 'Marcos Andrade');

  return (
    <Container size={1400} p={{ base: 'md', sm: 'lg' }} w="100%">
      <Stack gap="xl">
        <Tabs value={activeTab} onChange={v => v && setActiveTab(v as TabId)}>
          <Tabs.List aria-label="Estoque">
            {tabs.map(tab => <Tabs.Tab key={tab.id} value={tab.id}>{tab.label}</Tabs.Tab>)}
            <Box ml="auto" pl="md" pb={8} style={{ alignSelf: 'flex-end', flex: 'none' }}>
              <Badge variant="light" color="gray" leftSection={<EyeIcon size={14} />}>Somente visualização</Badge>
            </Box>
          </Tabs.List>
        </Tabs>

        {activeTab === 'industrial' ? (
          <IndustryStockTable readOnly />
        ) : (
          <ClientStockTab readOnly scopeClients={myClients} />
        )}
      </Stack>
    </Container>
  );
}
