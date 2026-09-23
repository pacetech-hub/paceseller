import { useState } from "react";
import { Boxes, Store, Eye } from "lucide-react";
import { Stack, Group, Paper, UnstyledButton, Badge } from "@mantine/core";
import { clients } from "../data/mockData";
import { IndustryStockTable } from "./IndustryStockTable";
import { ClientStockTab } from "./ClientStockTab";
import classes from "./RepStockPage.module.css";

const tabs = [
  { id: 'industrial', label: 'Estoque Industrial', icon: Boxes },
  { id: 'cliente', label: 'Estoque do Cliente', icon: Store },
] as const;

export function RepStockPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('industrial');
  const myClients = clients.filter(c => c.rep === 'Marcos Andrade');

  return (
    <Stack gap={20} maw={1400} mx="auto" w="100%" p="lg">
      <Group justify="space-between" gap="sm">
        <Paper withBorder radius="lg" p={4}>
          <Group gap={4} wrap="nowrap">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <UnstyledButton
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={classes.tab}
                  data-active={activeTab === tab.id || undefined}
                  style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
                >
                  <Icon size={14} />
                  {tab.label}
                </UnstyledButton>
              );
            })}
          </Group>
        </Paper>
        <Badge
          variant="light"
          color="gray"
          radius="xl"
          tt="none"
          c="dimmed"
          bg="gray.1"
          fz="0.7rem"
          fw={600}
          leftSection={<Eye size={12} />}
        >
          Somente visualização
        </Badge>
      </Group>

      {activeTab === 'industrial' ? (
        <IndustryStockTable readOnly />
      ) : (
        <ClientStockTab readOnly scopeClients={myClients} />
      )}
    </Stack>
  );
}
