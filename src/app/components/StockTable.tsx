import { useMemo, useState } from "react";
import {
  SimpleGrid, Paper, Group, Text, ThemeIcon, TextInput, SegmentedControl, Button,
  Table, Badge, NumberInput, Avatar, Box, Stack, Card,
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
import { toast } from "../lib/toast";
import { statusOf, type StockItem, type StockStatusKey } from "../data/stockData";
import { useMockLoading } from "../lib/useMockLoading";
import { KpiSkeleton, TableSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import sticky from "./ui/stickyTable.module.css";

export type StockFilter = 'todos' | StockStatusKey;

export const STOCK_FILTER_OPTIONS: Array<{ value: StockFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'ruptura', label: 'Sem estoque' },
  { value: 'baixo', label: 'Estoque baixo' },
  { value: 'ok', label: 'Estoque normal' },
];

// Rótulos em linguagem simples para o status (mesmos textos do filtro)
const STATUS_PLAIN_LABEL: Record<StockStatusKey, string> = {
  ruptura: 'Sem estoque',
  baixo: 'Estoque baixo',
  ok: 'Estoque normal',
};

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
    { label: 'Sem estoque', value: String(kpis.ruptura), sub: `${kpis.total} SKUs cadastrados`, icon: EmptyIcon, color: 'red' },
    { label: 'Estoque baixo', value: String(kpis.baixo), sub: 'abaixo do estoque mínimo', icon: TrendDownIcon, color: 'yellow' },
    { label: 'Estoque normal', value: String(kpis.ok), sub: 'disponíveis para venda', icon: CheckSquareIcon, color: 'teal' },
    { label: 'Valor em estoque', value: formatCurrency(kpis.valor), sub: 'a preço de tabela', icon: WarehouseIcon, color: 'neutral' },
  ];

  return (
    <SimpleGrid cols={{ base: 2, lg: 4 }} spacing={{ base: 'sm', sm: 'md' }}>
      {cards.map(k => {
        const Icon = k.icon;
        return (
          <Paper key={k.label} withBorder p="md">
            <Group justify="space-between" mb="xs" wrap="nowrap">
              <Text c="dimmed" size="sm" fw={600}>{k.label}</Text>
              <ThemeIcon size={32} variant="light" color={k.color}>
                <Icon size={16} />
              </ThemeIcon>
            </Group>
            <Text fw={700} fz={{ base: 'lg', sm: 'xl' }} lh={1}>{k.value}</Text>
            <Text c="dimmed" size="sm" mt={4}>{k.sub}</Text>
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
      leftSection={st.key !== 'ok' ? <WarningIcon size={14} /> : undefined}
    >
      {STATUS_PLAIN_LABEL[st.key]}
    </Badge>
  );
}

/** Célula de produto (imagem + nome + categoria/preço). */
export function StockProductCell({ item }: { item: StockItem }) {
  return (
    <Group gap="sm" wrap="nowrap">
      {/* miniatura de produto: quadrado arredondado (8px, igual ao tema), não círculo — não é uma pessoa */}
      <Avatar src={item.image} alt={item.name} radius="md" size={40} color="neutral">
        <PackageIcon size={16} />
      </Avatar>
      <Box miw={0}>
        <Text fw={600} truncate>{item.name}</Text>
        <Text c="dimmed" size="sm">{item.category} · {formatCurrency(item.price)}</Text>
      </Box>
    </Group>
  );
}

/** Colunas numéricas (quantidades) alinhadas à direita no cabeçalho e nas células. */
export const STOCK_NUMERIC_HEADERS = ['Estoque', 'Estoque atual', 'Estoque mínimo'];

export function StockTableHeader({ labels }: { labels: string[] }) {
  return (
    <Table.Thead>
      <Table.Tr>
        {labels.map(h => (
          // fundo em cada Th (não no Thead) para o cabeçalho fixo e a 1ª coluna fixa ficarem iguais
          <Table.Th key={h} bg="var(--mantine-color-gray-0)"
            ta={STOCK_NUMERIC_HEADERS.includes(h) || h === 'Ações' ? 'right' : undefined}>
            <Text c="dimmed" size="sm" fw={600} tt="uppercase">{h}</Text>
          </Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
  );
}

/** Estado vazio causado por busca/filtro, numa linha de largura total da tabela. */
export function StockEmptyFilterRow({ colSpan, onClear, noItems = false }: { colSpan: number; onClear: () => void; noItems?: boolean }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan} px="md">
        {noItems ? (
          <EmptyState
            withBorder={false}
            icon={PackageIcon}
            title="Nenhum SKU cadastrado"
            description="Os saldos aparecem aqui assim que os produtos forem cadastrados ou sincronizados com o ERP."
          />
        ) : (
        <EmptyState
          withBorder={false}
          icon={FunnelIcon}
          title="Nenhum SKU encontrado"
          description="Nenhum SKU corresponde à busca ou ao filtro de status aplicado. Limpe os filtros para ver todo o estoque."
          action={{ label: 'Limpar Filtros', onClick: onClear, forward: false }}
        />
        )}
      </Table.Td>
    </Table.Tr>
  );
}

/** Skeleton da área de dados: a tabela é mantida em todas as larguras (tabela densa, 7+ colunas). */
export function StockTableSkeleton({ cols }: { cols: number }) {
  return <TableSkeleton rows={8} cols={cols} />;
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
    <Paper withBorder p="sm">
      <Group gap="sm" wrap="wrap">
        <TextInput
          value={query}
          onChange={e => onQueryChange(e.currentTarget.value)}
          placeholder="Buscar por nome ou SKU"
          leftSection={<MagnifyingGlassIcon size={16} />}
          flex={{ base: '1 1 100%', sm: 1 }}
          miw={{ sm: 200 }}
        />
        <SegmentedControl
          w={{ base: '100%', sm: 'auto' }}
          value={filter}
          onChange={v => onFilterChange(v as StockFilter)}
          data={STOCK_FILTER_OPTIONS}
        />
        {showBulkActions && (
          <>
            <Button variant="default" flex={{ base: 1, sm: 'none' }} leftSection={<UploadSimpleIcon size={16} />}>
              Importar Planilha
            </Button>
            <Button flex={{ base: 1, sm: 'none' }} leftSection={<PlusIcon size={16} />}>
              Adicionar SKU
            </Button>
          </>
        )}
      </Group>
    </Paper>
  );
}

// Linha de tabela densa: botões size="sm" (36px) com ícone + texto; cancelar à esquerda, salvar (principal) à direita
export function EditActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <Group gap="sm" wrap="nowrap" justify="flex-end">
      <Button variant="default" size="sm" onClick={onCancel} leftSection={<XIcon size={16} />} aria-label="Cancelar Edição">
        Cancelar
      </Button>
      <Button variant="filled" size="sm" onClick={onSave} leftSection={<FloppyDiskIcon size={16} />} aria-label="Salvar Estoque">
        Salvar
      </Button>
    </Group>
  );
}

export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="default" size="sm" onClick={onClick} leftSection={<PencilSimpleIcon size={16} />} aria-label="Editar Estoque">
      Editar
    </Button>
  );
}

interface StockTableProps {
  items: StockItem[];
  onUpdateStock?: (sku: string, stock: number) => void;
  readOnly?: boolean;
  /** Botões de "Importar Planilha" / "Adicionar SKU" — só fazem sentido no estoque industrial completo. */
  showBulkActions?: boolean;
}

export function StockTable({ items, onUpdateStock, readOnly = false, showBulkActions = false }: StockTableProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('todos');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(0);
  const loading = useMockLoading();

  const filtered = useMemo(() => filterStock(items, query, filter), [items, query, filter]);

  const startEdit = (it: StockItem) => {
    setEditing(it.sku);
    setDraft(it.stock);
  };
  const saveEdit = (sku: string) => {
    onUpdateStock?.(sku, draft);
    setEditing(null);
    const name = items.find(it => it.sku === sku)?.name ?? sku;
    toast.success(`Estoque de ${name} atualizado para ${draft} un.`, 'O novo status e a data de atualização já aparecem na tabela');
  };
  const clearFilters = () => {
    setQuery('');
    setFilter('todos');
  };

  const headers = ['Produto', 'SKU', 'Linha', 'Estoque', 'Estoque mínimo', 'Status', 'Atualizado', ...(readOnly ? [] : ['Ações'])];

  return (
    <Stack gap="md">
      {loading ? <KpiSkeleton count={4} cols={{ base: 2, lg: 4 }} /> : <StockKpis items={items} />}

      <StockToolbar
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        showBulkActions={showBulkActions && !readOnly}
      />

      {loading ? <StockTableSkeleton cols={headers.length} /> : (
      // Tabela densa (7+ colunas): mantida também no celular, com rolagem lateral,
      // cabeçalho fixo e a coluna Produto sempre visível.
      <Card withBorder padding={0}>
        <Table.ScrollContainer minWidth={900} maxHeight={560}>
          <Table className={sticky.firstCol} stickyHeader stickyHeaderOffset={0}
            highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <StockTableHeader labels={headers} />
            <Table.Tbody>
              {filtered.map(it => {
                const isEditing = editing === it.sku;
                return (
                  <Table.Tr key={it.sku}>
                    <Table.Td maw={280}><StockProductCell item={it} /></Table.Td>
                    <Table.Td><Text c="dimmed" size="sm" className="mono">{it.sku}</Text></Table.Td>
                    <Table.Td><Text>{it.line}</Text></Table.Td>
                    <Table.Td ta="right">
                      {isEditing ? (
                        <NumberInput
                          w={110}
                          ml="auto"
                          aria-label="Estoque atual"
                          placeholder="0"
                          min={0}
                          value={draft}
                          onChange={v => setDraft(Number(v) || 0)}
                        />
                      ) : (
                        <Text fw={600} className="mono">{it.stock}</Text>
                      )}
                    </Table.Td>
                    <Table.Td ta="right"><Text c="dimmed" className="mono">{it.min}</Text></Table.Td>
                    <Table.Td><StockStatusBadge item={it} /></Table.Td>
                    <Table.Td><Text c="dimmed" size="sm">{it.updatedAt}</Text></Table.Td>
                    {!readOnly && (
                      <Table.Td ta="right">
                        {isEditing
                          ? <EditActions onSave={() => saveEdit(it.sku)} onCancel={() => setEditing(null)} />
                          : <EditButton onClick={() => startEdit(it)} />}
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
              {filtered.length === 0 && <StockEmptyFilterRow colSpan={headers.length} onClear={clearFilters} noItems={items.length === 0} />}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
      )}
    </Stack>
  );
}
