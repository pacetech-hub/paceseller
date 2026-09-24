import { useMemo, useState } from "react";
import {
  SimpleGrid, Paper, Group, Text, ThemeIcon, TextInput, SegmentedControl, Button,
  Table, Badge, NumberInput, ActionIcon, Avatar, Box, Stack, Card, Tooltip,
} from "@mantine/core";
import {
  WarehouseIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSimpleIcon,
  FloppyDiskIcon,
  XIcon,
  WarningIcon,
  EmptyIcon,
  CheckSquareIcon,
  TrendDownIcon,
  UploadSimpleIcon,
  PlusIcon,
  PackageIcon,
} from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import { statusOf, type StockItem, type StockStatusKey } from "../data/stockData";

export type StockFilter = 'todos' | StockStatusKey;

export const STOCK_FILTER_OPTIONS: Array<{ value: StockFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'ruptura', label: 'Ruptura' },
  { value: 'baixo', label: 'Baixo' },
  { value: 'ok', label: 'OK' },
];

export function filterStock(items: StockItem[], query: string, filter: StockFilter) {
  const q = query.toLowerCase();
  return items.filter(it => {
    if (q && !`${it.name} ${it.sku}`.toLowerCase().includes(q)) return false;
    if (filter !== 'todos' && statusOf(it).key !== filter) return false;
    return true;
  });
}

/** Linha de KPIs (ruptura / baixo / OK / valor) compartilhada entre as telas de estoque. */
export function StockKpis({ items }: { items: StockItem[] }) {
  const kpis = useMemo(() => {
    const ruptura = items.filter(i => i.stock <= 0).length;
    const baixo = items.filter(i => i.stock > 0 && i.stock < i.min).length;
    const ok = items.length - ruptura - baixo;
    const valor = items.reduce((s, i) => s + i.stock * i.price, 0);
    return { ruptura, baixo, ok, valor, total: items.length };
  }, [items]);

  const cards = [
    { label: 'Em ruptura', value: String(kpis.ruptura), sub: `${kpis.total} SKUs cadastrados`, icon: EmptyIcon, color: 'red' },
    { label: 'Estoque baixo', value: String(kpis.baixo), sub: 'abaixo do limiar', icon: TrendDownIcon, color: 'yellow' },
    { label: 'Estoque OK', value: String(kpis.ok), sub: 'disponíveis para venda', icon: CheckSquareIcon, color: 'teal' },
    { label: 'Valor em estoque', value: formatCurrency(kpis.valor), sub: 'a preço de tabela', icon: WarehouseIcon, color: 'neutral' },
  ];

  return (
    <SimpleGrid cols={{ base: 2, lg: 4 }} spacing={{ base: 'sm', sm: 'md' }}>
      {cards.map(k => {
        const Icon = k.icon;
        return (
          <Paper key={k.label} withBorder radius="lg" p="md">
            <Group justify="space-between" mb="xs" wrap="nowrap">
              <Text c="dimmed" size="0.75rem" fw={600}>{k.label}</Text>
              <ThemeIcon size={28} radius="md" variant="light" color={k.color}>
                <Icon size={14} />
              </ThemeIcon>
            </Group>
            <Text fw={700} fz={{ base: '1.15rem', sm: '1.4rem' }} lh={1} lts="-0.02em">{k.value}</Text>
            <Text c="dimmed" size="0.72rem" mt={4}>{k.sub}</Text>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}

export function StockStatusBadge({ item }: { item: Pick<StockItem, 'stock' | 'min'> }) {
  const st = statusOf(item);
  return (
    <Badge
      variant="light"
      color={st.color}
      size="sm"
      leftSection={st.key !== 'ok' ? <WarningIcon size={12} /> : undefined}
    >
      {st.label}
    </Badge>
  );
}

/** Célula de produto (imagem + nome + categoria/preço). */
export function StockProductCell({ item }: { item: StockItem }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar src={item.image} alt={item.name} radius="md" size={40} color="neutral">
        <PackageIcon size={16} />
      </Avatar>
      <Box miw={0}>
        <Text size="0.82rem" fw={600} truncate>{item.name}</Text>
        <Text c="dimmed" size="0.7rem">{item.category} · {formatCurrency(item.price)}</Text>
      </Box>
    </Group>
  );
}

export function StockTableHeader({ labels }: { labels: string[] }) {
  return (
    <Table.Thead bg="var(--mantine-color-gray-0)">
      <Table.Tr>
        {labels.map(h => (
          <Table.Th key={h}>
            <Text c="dimmed" size="0.7rem" fw={600} tt="uppercase" lts="0.06em">{h}</Text>
          </Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
  );
}

export function StockEmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan} py="xl">
        <Stack align="center" gap={6}>
          <FunnelIcon size={20} color="var(--mantine-color-dimmed)" opacity={0.6} />
          <Text c="dimmed" size="0.82rem">Nenhum SKU encontrado para os filtros aplicados.</Text>
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}

interface StockToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  filter: StockFilter;
  onFilterChange: (f: StockFilter) => void;
  showBulkActions?: boolean;
}

export function StockToolbar({ query, onQueryChange, filter, onFilterChange, showBulkActions }: StockToolbarProps) {
  return (
    <Paper withBorder radius="lg" p="sm">
      <Group gap="xs" wrap="wrap">
        <TextInput
          value={query}
          onChange={e => onQueryChange(e.currentTarget.value)}
          placeholder="Buscar por SKU ou nome..."
          leftSection={<MagnifyingGlassIcon size={14} />}
          flex={{ base: '1 1 100%', sm: 1 }}
          miw={{ sm: 200 }}
        />
        <SegmentedControl
          size="xs"
          w={{ base: '100%', sm: 'auto' }}
          value={filter}
          onChange={v => onFilterChange(v as StockFilter)}
          data={STOCK_FILTER_OPTIONS}
        />
        {showBulkActions && (
          <>
            <Button variant="default" size="sm" flex={{ base: 1, sm: 'none' }} leftSection={<UploadSimpleIcon size={16} />}>
              Importar planilha
            </Button>
            <Button size="sm" flex={{ base: 1, sm: 'none' }} leftSection={<PlusIcon size={16} />}>
              Adicionar SKU
            </Button>
          </>
        )}
      </Group>
    </Paper>
  );
}

export function EditActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <Group gap={4} wrap="nowrap">
      <Tooltip label="Salvar estoque" withArrow>
        <ActionIcon variant="filled" onClick={onSave} aria-label="Salvar estoque">
          <FloppyDiskIcon size={14} />
        </ActionIcon>
      </Tooltip>
      <ActionIcon variant="subtle" color="gray" onClick={onCancel} aria-label="Cancelar edição">
        <XIcon size={14} />
      </ActionIcon>
    </Group>
  );
}

export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip label="Editar estoque" withArrow>
      <ActionIcon variant="subtle" color="gray" onClick={onClick} aria-label="Editar estoque">
        <PencilSimpleIcon size={14} />
      </ActionIcon>
    </Tooltip>
  );
}

interface StockTableProps {
  items: StockItem[];
  onUpdateStock?: (sku: string, stock: number) => void;
  readOnly?: boolean;
  /** Botões de "Importar planilha" / "Adicionar SKU" — só fazem sentido no estoque industrial completo. */
  showBulkActions?: boolean;
}

export function StockTable({ items, onUpdateStock, readOnly = false, showBulkActions = false }: StockTableProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('todos');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(0);

  const filtered = useMemo(() => filterStock(items, query, filter), [items, query, filter]);

  const startEdit = (it: StockItem) => {
    setEditing(it.sku);
    setDraft(it.stock);
  };
  const saveEdit = (sku: string) => {
    onUpdateStock?.(sku, draft);
    setEditing(null);
  };

  const headers = ['Produto', 'SKU', 'Linha', 'Estoque', 'Limiar mín.', 'Status', 'Atualizado', ...(readOnly ? [] : ['Ações'])];

  return (
    <Stack gap="md">
      <StockKpis items={items} />

      <StockToolbar
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        showBulkActions={showBulkActions && !readOnly}
      />

      <Card withBorder radius="lg" padding={0}>
        <Table.ScrollContainer minWidth={900}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <StockTableHeader labels={headers} />
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
                        <NumberInput
                          size="xs"
                          w={90}
                          min={0}
                          value={draft}
                          onChange={v => setDraft(Number(v) || 0)}
                        />
                      ) : (
                        <Text size="0.82rem" fw={600} className="mono">{it.stock}</Text>
                      )}
                    </Table.Td>
                    <Table.Td><Text c="dimmed" size="0.78rem" className="mono">{it.min}</Text></Table.Td>
                    <Table.Td><StockStatusBadge item={it} /></Table.Td>
                    <Table.Td><Text c="dimmed" size="0.72rem">{it.updatedAt}</Text></Table.Td>
                    {!readOnly && (
                      <Table.Td>
                        {isEditing
                          ? <EditActions onSave={() => saveEdit(it.sku)} onCancel={() => setEditing(null)} />
                          : <EditButton onClick={() => startEdit(it)} />}
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
              {filtered.length === 0 && <StockEmptyRow colSpan={headers.length} />}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </Stack>
  );
}
