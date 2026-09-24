import { useMemo, useState } from "react";
import {
  Container, Stack, Paper, Group, Box, Text, Title, ThemeIcon, SegmentedControl, SimpleGrid,
  UnstyledButton, Badge, Button, Table, NumberInput,
} from "@mantine/core";
import {
  WarehouseIcon,
  PlugIcon,
  PencilSimpleIcon,
  ArrowsClockwiseIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { products } from "../data/mockData";
import type { StockItem } from "../data/stockData";
import {
  StockKpis, StockToolbar, StockTableHeader, StockProductCell, StockStatusBadge, StockEmptyRow,
  EditActions, EditButton, filterStock, type StockFilter,
} from "./StockTable";
import interactive from "./interactive.module.css";

type Mode = 'manual' | 'integration';

const initialStock: StockItem[] = products.slice(0, 12).map((p, i) => ({
  sku: p.id,
  name: p.name,
  line: p.line,
  category: p.category,
  image: p.image,
  price: p.price,
  stock: [0, 2, 18, 45, 6, 0, 23, 4, 31, 12, 1, 58][i] ?? 10,
  min: [5, 5, 10, 10, 8, 5, 15, 8, 10, 10, 5, 20][i] ?? 5,
  updatedAt: '2026-06-18',
}));

const MODE_OPTIONS = [
  { value: 'manual', label: 'Cadastro manual', icon: PencilSimpleIcon },
  { value: 'integration', label: 'Integração ERP', icon: PlugIcon },
] as const;

const INTEGRATIONS = ['Bling', 'Tiny ERP', 'Omie', 'API customizada'];

const HEADERS = ['Produto', 'SKU', 'Linha', 'Estoque atual', 'Limiar mín.', 'Status', 'Atualizado', 'Ações'];

export function StockPage() {
  const [mode, setMode] = useState<Mode>('manual');
  const [items, setItems] = useState<StockItem[]>(initialStock);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('todos');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ stock: number; min: number }>({ stock: 0, min: 0 });
  const [integrationConnected, setIntegrationConnected] = useState(false);

  const filtered = useMemo(() => filterStock(items, query, filter), [items, query, filter]);

  const startEdit = (it: StockItem) => {
    setEditing(it.sku);
    setDraft({ stock: it.stock, min: it.min });
  };
  const saveEdit = (sku: string) => {
    setItems(prev => prev.map(it => it.sku === sku ? { ...it, stock: draft.stock, min: draft.min, updatedAt: new Date().toISOString().slice(0, 10) } : it));
    setEditing(null);
  };

  return (
    <Container size={1400} p="lg" w="100%">
      <Stack gap="lg">
        {/* Header / mode toggle */}
        <Paper withBorder radius="lg" p="lg">
          <Group justify="space-between" gap="sm" wrap="wrap">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={40} radius="md" variant="light">
                <WarehouseIcon size={20} />
              </ThemeIcon>
              <Box>
                <Title order={2} size="1.05rem" fw={700} style={{ letterSpacing: '-0.01em' }}>Meu Estoque · Tesla Footwear</Title>
                <Text c="dimmed" size="0.78rem">
                  Mantenha seu estoque atualizado para que o catálogo mostre alertas de ruptura corretamente para seus clientes finais.
                </Text>
              </Box>
            </Group>
            <SegmentedControl
              size="xs"
              value={mode}
              onChange={v => setMode(v as Mode)}
              data={MODE_OPTIONS.map(o => {
                const Icon = o.icon;
                return {
                  value: o.value,
                  label: (
                    <Group gap={6} wrap="nowrap">
                      <Icon size={14} />
                      {o.label}
                    </Group>
                  ),
                };
              })}
            />
          </Group>
        </Paper>

        <StockKpis items={items} />

        {/* Integration panel */}
        {mode === 'integration' && (
          <Paper withBorder radius="lg" p="lg">
            <Group align="flex-start" gap="sm" mb="md" wrap="nowrap">
              <ThemeIcon size={36} radius="md" variant="light" style={{ flexShrink: 0 }}>
                <PlugIcon size={16} />
              </ThemeIcon>
              <Box style={{ flex: 1 }}>
                <Title order={3} size="0.9rem" fw={600}>Integração com seu sistema de estoque</Title>
                <Text c="dimmed" size="0.78rem" mt={2}>
                  Sincronize automaticamente seu ERP / sistema de gestão. Os dados são lidos a cada hora.
                </Text>
              </Box>
              {integrationConnected && (
                <Badge variant="light" color="teal" leftSection={<CheckCircleIcon size={12} />}>
                  Conectado
                </Badge>
              )}
            </Group>

            <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="sm" mb="md">
              {INTEGRATIONS.map(p => (
                <UnstyledButton key={p} onClick={() => setIntegrationConnected(true)}>
                  <Paper withBorder radius="md" p="sm" className={interactive.hoverable}>
                    <Text size="0.82rem" fw={600}>{p}</Text>
                    <Text c="dimmed" size="0.7rem" mt={2}>Conectar via OAuth</Text>
                  </Paper>
                </UnstyledButton>
              ))}
            </SimpleGrid>

            {integrationConnected && (
              <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-gray-0)">
                <Group justify="space-between" gap="sm">
                  <Group gap="xs" wrap="nowrap">
                    <ArrowsClockwiseIcon size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text c="dimmed" size="0.75rem">Última sincronização: hoje, 14:02 · próxima em 38min</Text>
                  </Group>
                  <Button variant="light" size="xs">Sincronizar agora</Button>
                </Group>
              </Paper>
            )}
          </Paper>
        )}

        <StockToolbar
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          showBulkActions={mode === 'manual'}
        />

        <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
          <Table.ScrollContainer minWidth={900}>
            <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <StockTableHeader labels={HEADERS} />
              <Table.Tbody>
                {filtered.map(it => {
                  const isEditing = editing === it.sku;
                  return (
                    <Table.Tr key={it.sku}>
                      <Table.Td><StockProductCell item={it} /></Table.Td>
                      <Table.Td><Text c="dimmed" size="0.75rem" className="mono">{it.sku}</Text></Table.Td>
                      <Table.Td><Text size="0.78rem">{it.line}</Text></Table.Td>
                      <Table.Td>
                        {isEditing ? (
                          <NumberInput size="xs" w={90} min={0} value={draft.stock} onChange={v => setDraft(d => ({ ...d, stock: Number(v) || 0 }))} />
                        ) : (
                          <Text size="0.82rem" fw={600} className="mono">{it.stock}</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {isEditing ? (
                          <NumberInput size="xs" w={90} min={0} value={draft.min} onChange={v => setDraft(d => ({ ...d, min: Number(v) || 0 }))} />
                        ) : (
                          <Text c="dimmed" size="0.78rem" className="mono">{it.min}</Text>
                        )}
                      </Table.Td>
                      <Table.Td><StockStatusBadge item={it} /></Table.Td>
                      <Table.Td><Text c="dimmed" size="0.72rem">{it.updatedAt}</Text></Table.Td>
                      <Table.Td>
                        {mode === 'manual' ? (
                          isEditing
                            ? <EditActions onSave={() => saveEdit(it.sku)} onCancel={() => setEditing(null)} />
                            : <EditButton onClick={() => startEdit(it)} />
                        ) : (
                          <Text c="dimmed" size="0.7rem">via ERP</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {filtered.length === 0 && <StockEmptyRow colSpan={HEADERS.length} />}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>
    </Container>
  );
}
