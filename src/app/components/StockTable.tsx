import { useMemo, useState } from "react";
import {
  Boxes, Search, Filter, Pencil, Save, X, AlertTriangle, PackageX,
  PackageCheck, TrendingDown, Upload, Plus,
} from "lucide-react";
import {
  Stack, SimpleGrid, Paper, Group, Text, Center, TextInput, SegmentedControl, Button,
  Box, Table, NumberInput, Badge, UnstyledButton,
} from "@mantine/core";
import { formatCurrency } from "../data/mockData";
import { statusOf, type StockItem, type StockStatusKey } from "../data/stockData";
import classes from "./StockTable.module.css";

const STATUS_COLOR: Record<StockStatusKey, string> = { ruptura: 'red', baixo: 'yellow', ok: 'teal' };

interface StockTableProps {
  items: StockItem[];
  onUpdateStock?: (sku: string, stock: number) => void;
  readOnly?: boolean;
  /** Botões de "Importar planilha" / "Adicionar SKU" — só fazem sentido no estoque industrial completo. */
  showBulkActions?: boolean;
}

export function StockTable({ items, onUpdateStock, readOnly = false, showBulkActions = false }: StockTableProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'todos' | StockStatusKey>('todos');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(0);

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (query && !`${it.name} ${it.sku}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter !== 'todos' && statusOf(it).key !== filter) return false;
      return true;
    });
  }, [items, query, filter]);

  const kpis = useMemo(() => {
    const ruptura = items.filter(i => i.stock <= 0).length;
    const baixo = items.filter(i => i.stock > 0 && i.stock < i.min).length;
    const ok = items.length - ruptura - baixo;
    const valor = items.reduce((s, i) => s + i.stock * i.price, 0);
    return { ruptura, baixo, ok, valor, total: items.length };
  }, [items]);

  const startEdit = (it: StockItem) => {
    setEditing(it.sku);
    setDraft(it.stock);
  };
  const saveEdit = (sku: string) => {
    onUpdateStock?.(sku, draft);
    setEditing(null);
  };

  return (
    <Stack gap="md">
      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
        {[
          { label: 'Em ruptura', value: String(kpis.ruptura), sub: `${kpis.total} SKUs cadastrados`, icon: PackageX, color: 'var(--mantine-color-red-7)', bg: 'red.0' },
          { label: 'Estoque baixo', value: String(kpis.baixo), sub: 'abaixo do limiar', icon: TrendingDown, color: 'var(--mantine-color-yellow-7)', bg: 'yellow.0' },
          { label: 'Estoque OK', value: String(kpis.ok), sub: 'disponíveis para venda', icon: PackageCheck, color: 'var(--mantine-color-teal-7)', bg: 'teal.0' },
          { label: 'Valor em estoque', value: formatCurrency(kpis.valor), sub: 'a preço de tabela', icon: Boxes, color: 'var(--mantine-color-gray-9)', bg: 'gray.1' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <Paper key={k.label} withBorder radius="lg" p="md">
              <Group justify="space-between" wrap="nowrap" mb={8}>
                <Text c="dimmed" size="0.75rem" fw={500}>{k.label}</Text>
                <Center w={28} h={28} bg={k.bg} style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                  <Icon size={14} color={k.color} />
                </Center>
              </Group>
              <Text size="1.4rem" fw={700} lts="-0.02em" lh={1} style={{ fontVariantNumeric: 'tabular-nums' }}>{k.value}</Text>
              <Text c="dimmed" mt={4} size="0.72rem">{k.sub}</Text>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* Toolbar */}
      <Paper withBorder radius="lg" p="sm">
        <Group gap={8}>
          <TextInput
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por SKU ou nome..."
            leftSection={<Search size={14} color="var(--mantine-color-dimmed)" />}
            flex={1}
            miw={200}
            styles={{ input: { fontSize: '0.82rem', backgroundColor: 'var(--mantine-color-gray-0)' } }}
          />
          <SegmentedControl
            value={filter}
            onChange={v => setFilter(v as 'todos' | StockStatusKey)}
            size="xs"
            styles={{ label: { fontSize: '0.75rem', fontWeight: 500 } }}
            data={([
              { v: 'todos', l: 'Todos' },
              { v: 'ruptura', l: 'Ruptura' },
              { v: 'baixo', l: 'Baixo' },
              { v: 'ok', l: 'OK' },
            ] as const).map(o => ({ value: o.v, label: o.l }))}
          />
          {showBulkActions && !readOnly && (
            <>
              <Button variant="default" size="sm" fz="0.78rem" fw={500} leftSection={<Upload size={14} />}>
                Importar planilha
              </Button>
              <Button size="sm" fz="0.78rem" fw={600} leftSection={<Plus size={14} />}>
                Adicionar SKU
              </Button>
            </>
          )}
        </Group>
      </Paper>

      {/* Table */}
      <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
        <Box style={{ overflowX: 'auto' }}>
          <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm" highlightOnHoverColor="var(--mantine-color-gray-0)" borderColor="var(--mantine-color-gray-2)">
            <Table.Thead>
              <Table.Tr bg="gray.0" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                {['Produto', 'SKU', 'Linha', 'Estoque', 'Limiar mín.', 'Status', 'Atualizado', ...(readOnly ? [] : ['Ações'])].map(h => (
                  <Table.Th key={h} c="dimmed" py={10} style={{ textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map(it => {
                const st = statusOf(it);
                const isEditing = editing === it.sku;
                return (
                  <Table.Tr key={it.sku}>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Box w={40} h={40} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={it.image} alt={it.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </Box>
                        <Box miw={0}>
                          <Text truncate size="0.82rem" fw={500}>{it.name}</Text>
                          <Text c="dimmed" size="0.7rem">{it.category} · {formatCurrency(it.price)}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td c="dimmed" style={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>{it.sku}</Table.Td>
                    <Table.Td style={{ fontSize: '0.78rem' }}>{it.line}</Table.Td>
                    <Table.Td>
                      {isEditing ? (
                        <NumberInput
                          value={draft}
                          onChange={v => setDraft(Number(v))}
                          size="xs"
                          w={80}
                          hideControls
                          styles={{ input: { fontSize: '0.78rem', backgroundColor: 'var(--mantine-color-gray-0)' } }}
                        />
                      ) : (
                        <Text span size="0.82rem" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>{it.stock}</Text>
                      )}
                    </Table.Td>
                    <Table.Td c="dimmed" style={{ fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' }}>{it.min}</Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={STATUS_COLOR[st.key]}
                        radius="xl"
                        tt="none"
                        fz="0.68rem"
                        fw={700}
                        leftSection={st.key !== 'ok' ? <AlertTriangle size={12} /> : undefined}
                      >
                        {st.label}
                      </Badge>
                    </Table.Td>
                    <Table.Td c="dimmed" style={{ fontSize: '0.72rem' }}>{it.updatedAt}</Table.Td>
                    {!readOnly && (
                      <Table.Td>
                        {isEditing ? (
                          <Group gap={4} wrap="nowrap">
                            <UnstyledButton onClick={() => saveEdit(it.sku)} className={classes.saveBtn}>
                              <Save size={14} />
                            </UnstyledButton>
                            <UnstyledButton onClick={() => setEditing(null)} className={classes.iconBtn}>
                              <X size={14} />
                            </UnstyledButton>
                          </Group>
                        ) : (
                          <UnstyledButton onClick={() => startEdit(it)} className={classes.iconBtn}>
                            <Pencil size={14} />
                          </UnstyledButton>
                        )}
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
              {filtered.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={readOnly ? 7 : 8} py={40} c="dimmed" style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                    <Center mb={8}>
                      <Filter size={20} style={{ opacity: 0.6 }} />
                    </Center>
                    Nenhum SKU encontrado para os filtros aplicados.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
