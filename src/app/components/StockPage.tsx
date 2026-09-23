import { useMemo, useState } from "react";
import {
  Boxes, Plug, Upload, Plus, Search, AlertTriangle, PackageX, PackageCheck,
  TrendingDown, RefreshCw, CheckCircle2, Pencil, Save, X, Filter,
} from "lucide-react";
import {
  Stack, SimpleGrid, Paper, Group, Text, Title, Center, TextInput, SegmentedControl, Button,
  Box, Table, NumberInput, Badge, UnstyledButton,
} from "@mantine/core";
import { products, formatCurrency } from "../data/mockData";
import classes from "./StockPage.module.css";

type Mode = 'manual' | 'integration';

interface StockItem {
  sku: string;
  name: string;
  line: string;
  category: string;
  image: string;
  price: number;
  stock: number;
  min: number; // limiar de ruptura
  updatedAt: string;
}

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

function statusOf(s: StockItem): { key: 'ruptura' | 'baixo' | 'ok'; label: string } {
  if (s.stock <= 0) return { key: 'ruptura', label: 'Ruptura' };
  if (s.stock < s.min) return { key: 'baixo', label: 'Baixo' };
  return { key: 'ok', label: 'OK' };
}

const STATUS_COLOR: Record<'ruptura' | 'baixo' | 'ok', string> = { ruptura: 'red', baixo: 'yellow', ok: 'teal' };

export function StockPage() {
  const [mode, setMode] = useState<Mode>('manual');
  const [items, setItems] = useState<StockItem[]>(initialStock);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'todos' | 'ruptura' | 'baixo' | 'ok'>('todos');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ stock: number; min: number }>({ stock: 0, min: 0 });
  const [integrationConnected, setIntegrationConnected] = useState(false);

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
    setDraft({ stock: it.stock, min: it.min });
  };
  const saveEdit = (sku: string) => {
    setItems(prev => prev.map(it => it.sku === sku ? { ...it, stock: draft.stock, min: draft.min, updatedAt: new Date().toISOString().slice(0, 10) } : it));
    setEditing(null);
  };

  return (
    <Stack gap={20} maw={1400} mx="auto" w="100%" p="lg">
      {/* Header / mode toggle */}
      <Paper withBorder radius="lg" p={20}>
        <Group justify="space-between" gap="sm">
          <Group gap="sm" wrap="nowrap">
            <Center w={40} h={40} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}>
              <Boxes size={20} color="var(--mantine-color-gray-9)" />
            </Center>
            <div>
              <Title order={2} size="1.05rem" fw={700} lts="-0.01em">Meu Estoque · Tesla Footwear</Title>
              <Text c="dimmed" size="0.78rem">
                Mantenha seu estoque atualizado para que o catálogo mostre alertas de ruptura corretamente para seus clientes finais.
              </Text>
            </div>
          </Group>
          <SegmentedControl
            value={mode}
            onChange={v => setMode(v as Mode)}
            size="xs"
            styles={{ label: { fontSize: '0.78rem', fontWeight: 500 } }}
            data={([
              { v: 'manual', l: 'Cadastro manual', icon: Pencil },
              { v: 'integration', l: 'Integração ERP', icon: Plug },
            ] as { v: Mode; l: string; icon: any }[]).map(o => {
              const Icon = o.icon;
              return {
                value: o.v,
                label: (
                  <Group gap={6} wrap="nowrap" justify="center">
                    <Icon size={14} />
                    {o.l}
                  </Group>
                ),
              };
            })}
          />
        </Group>
      </Paper>

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

      {/* Integration panel */}
      {mode === 'integration' && (
        <Paper withBorder radius="lg" p={20}>
          <Group align="flex-start" gap="sm" wrap="nowrap" mb="md">
            <Center w={36} h={36} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}>
              <Plug size={16} color="var(--mantine-color-black)" />
            </Center>
            <Box flex={1}>
              <Title order={3} size="0.9rem" fw={600}>Integração com seu sistema de estoque</Title>
              <Text c="dimmed" mt={2} size="0.78rem">
                Sincronize automaticamente seu ERP / sistema de gestão. Os dados são lidos a cada hora.
              </Text>
            </Box>
            {integrationConnected && (
              <Badge variant="light" color="teal" radius="xl" tt="none" fz="0.7rem" fw={600} leftSection={<CheckCircle2 size={12} />} style={{ flexShrink: 0 }}>
                Conectado
              </Badge>
            )}
          </Group>

          <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="sm" mb="md">
            {['Bling', 'Tiny ERP', 'Omie', 'API customizada'].map(p => (
              <UnstyledButton
                key={p}
                onClick={() => setIntegrationConnected(true)}
                className={classes.providerCard}
              >
                <Text size="0.82rem" fw={600}>{p}</Text>
                <Text c="dimmed" mt={2} size="0.7rem">Conectar via OAuth</Text>
              </UnstyledButton>
            ))}
          </SimpleGrid>

          {integrationConnected && (
            <Paper withBorder radius="md" bg="gray.0" p="sm">
              <Group justify="space-between" wrap="nowrap">
                <Group gap={8} wrap="nowrap">
                  <RefreshCw size={14} color="var(--mantine-color-dimmed)" />
                  <Text span c="dimmed" size="0.75rem">Última sincronização: hoje, 14:02 · próxima em 38min</Text>
                </Group>
                <Button variant="light" size="xs" fz="0.75rem" fw={600}>
                  Sincronizar agora
                </Button>
              </Group>
            </Paper>
          )}
        </Paper>
      )}

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
            onChange={v => setFilter(v as 'todos' | 'ruptura' | 'baixo' | 'ok')}
            size="xs"
            styles={{ label: { fontSize: '0.75rem', fontWeight: 500 } }}
            data={([
              { v: 'todos', l: 'Todos' },
              { v: 'ruptura', l: 'Ruptura' },
              { v: 'baixo', l: 'Baixo' },
              { v: 'ok', l: 'OK' },
            ] as const).map(o => ({ value: o.v, label: o.l }))}
          />
          {mode === 'manual' && (
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
                {['Produto', 'SKU', 'Linha', 'Estoque atual', 'Limiar mín.', 'Status', 'Atualizado', 'Ações'].map(h => (
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
                          value={draft.stock}
                          onChange={v => setDraft(d => ({ ...d, stock: Number(v) }))}
                          size="xs"
                          w={80}
                          hideControls
                          styles={{ input: { fontSize: '0.78rem', backgroundColor: 'var(--mantine-color-gray-0)' } }}
                        />
                      ) : (
                        <Text span size="0.82rem" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>{it.stock}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {isEditing ? (
                        <NumberInput
                          value={draft.min}
                          onChange={v => setDraft(d => ({ ...d, min: Number(v) }))}
                          size="xs"
                          w={80}
                          hideControls
                          styles={{ input: { fontSize: '0.78rem', backgroundColor: 'var(--mantine-color-gray-0)' } }}
                        />
                      ) : (
                        <Text span c="dimmed" size="0.78rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{it.min}</Text>
                      )}
                    </Table.Td>
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
                    <Table.Td>
                      {mode === 'manual' ? (
                        isEditing ? (
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
                        )
                      ) : (
                        <Text span c="dimmed" size="0.7rem">via ERP</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {filtered.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={8} py={40} c="dimmed" style={{ textAlign: 'center', fontSize: '0.82rem' }}>
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
