import { useState } from "react";
import { Stack, Group, Box, Center, Paper, Text, TextInput, Chip, Badge, ThemeIcon, UnstyledButton } from "@mantine/core";
import {
  MagnifyingGlassIcon,
  CaretRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SealCheckIcon,
  CheckSquareIcon,
  type Icon,
} from "@phosphor-icons/react";
import classes from "./interactive.module.css";
import { orders, clients, formatCurrency, formatDate, type Order } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'order-detail';

type Profile = 'admin' | 'rep' | 'lojista';

interface OrderHistoryProps {
  onNavigate: (view: View) => void;
  onSelectOrder: (order: Order) => void;
  profile?: Profile;
  initialSearch?: string;
  initialStatusFilter?: string;
}

// cor Mantine do badge de cada status do pedido
export const statusColors: Record<string, string> = {
  'aprovado': 'dark',
  'em análise': 'yellow',
  'faturado': 'teal',
  'cancelado': 'red',
  'entregue': 'violet',
};

export const statusIcon: Record<string, Icon> = {
  'aprovado': CheckCircleIcon,
  'em análise': ClockIcon,
  'faturado': SealCheckIcon,
  'cancelado': XCircleIcon,
  'entregue': CheckSquareIcon,
};

export function OrderStatusBadge({ status }: { status: string }) {
  const StatusIcon = statusIcon[status];
  return (
    <Badge
      size="sm"
      variant="light"
      color={statusColors[status]}
      leftSection={<StatusIcon size={12} />}
      styles={{ root: { flexShrink: 0 }, label: { textTransform: 'none' } }}
    >
      {status}
    </Badge>
  );
}

export const orderProductNames: Record<string, string> = {
  'PED-2026-0412': 'Tênis Casual — Grade Mista',
  'PED-2026-0411': 'Sapatos Sociais — Linha Executiva',
  'PED-2026-0410': 'Botas Impermeáveis — Coleção Verão 26',
  'PED-2026-0409': 'Chinelos Infantis — Coleção Verão 26',
  'PED-2026-0408': 'Tênis Infantil — Coleção Verão 26',
  'PED-2026-0407': 'Sandálias Femininas — Coleção Verão 26',
  'PED-2026-0406': 'Tênis Esportivo — Coleção Verão 26',
  'PED-2026-0405': 'Sandálias Rasteiras — Coleção Verão 26',
};

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function statusSupportText(order: Order): string {
  switch (order.status) {
    case 'aprovado':
      return `em ${formatDate(order.date)}`;
    case 'em análise':
      return `Emissão em ${formatDate(order.date)}`;
    case 'faturado':
      return `Entrega prevista em ${formatDate(shiftDate(order.date, 10))}`;
    case 'entregue':
      return `em ${formatDate(shiftDate(order.date, 6))}`;
    case 'cancelado':
      return `em ${formatDate(order.date)}`;
  }
}

// shared column template so the legend row and every card line up exactly
// Larguras fixas das colunas; a coluna do pedido ocupa o espaço restante.
// Cliente só aparece para admin/rep e representante só para admin/lojista.
const COL = { client: 160, rep: 150, qty: 100, total: 130, caret: 20 } as const;

function OrderCard({ order, profile, onOpen }: { order: Order; profile: Profile; onOpen: () => void }) {
  const support = statusSupportText(order);
  const productName = orderProductNames[order.id] ?? order.collection;
  const client = clients.find(c => c.id === order.clientId);

  return (
    <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
      <UnstyledButton
        onClick={onOpen}
        className={classes.hoverable}
        p="md"
        w="100%"
      >
        <Group gap="md" wrap="nowrap">
          {/* column 1: order info */}
          <Box flex={1} miw={0}>
            <Group gap={8} mb={4}>
              <OrderStatusBadge status={order.status} />
              <Text c="dimmed" size="0.72rem" style={{ flexShrink: 0 }}>{support}</Text>
            </Group>
            <Text size="0.85rem" fw={600} truncate>
              <Text span inherit className="mono">{order.id}</Text> — {productName}
            </Text>
          </Box>

          {/* column 2: cliente (admin/rep only) */}
          {profile !== 'lojista' && (
            <Box w={COL.client} flex="none">
              <Text size="0.8rem" fw={500} truncate>{client?.name ?? order.client}</Text>
              <Text c="dimmed" size="0.7rem" truncate>{client ? `${client.city} / ${client.state}` : ''}</Text>
            </Box>
          )}

          {/* column 3: representante (hidden for rep, viewing their own orders) */}
          {profile !== 'rep' && (
            <Box w={COL.rep} flex="none">
              <Text size="0.8rem" fw={500} truncate>{order.rep}</Text>
            </Box>
          )}

          {/* column 4: quantidade */}
          <Box w={COL.qty} flex="none">
            <Text size="0.8rem" fw={500} truncate>{order.items} pares</Text>
          </Box>

          {/* column 5: total */}
          <Box w={COL.total} flex="none" ta="right">
            <Text className="mono" size="0.95rem" fw={700} truncate>{formatCurrency(order.total)}</Text>
          </Box>

          <Center w={COL.caret} flex="none">
            <CaretRightIcon size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
          </Center>
        </Group>
      </UnstyledButton>
    </Paper>
  );
}

export function OrderHistory({ onNavigate, onSelectOrder, profile = 'admin', initialSearch = '', initialStatusFilter = 'todos' }: OrderHistoryProps) {
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

  const statuses = ['todos', 'em análise', 'aprovado', 'faturado', 'entregue', 'cancelado'];
  const statusPriority: Record<string, number> = { 'em análise': 0, 'aprovado': 1, 'faturado': 2, 'entregue': 3, 'cancelado': 4 };

  const baseOrders = profile === 'rep'
    ? orders.filter(o => o.rep === 'Marcos Andrade')
    : orders;

  const filtered = baseOrders
    .filter(o => {
      const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.client.toLowerCase().includes(search.toLowerCase()) ||
        o.rep.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'todos' || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  return (
    <Stack gap="lg" p="lg" maw={1400} mx="auto" w="100%">
      {/* Filters */}
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Buscar pedido, cliente, rep..."
          leftSection={<MagnifyingGlassIcon size={14} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
        <Chip.Group value={statusFilter} onChange={v => setStatusFilter(v as string)}>
          <Group gap={6}>
            {statuses.map(s => (
              <Chip key={s} value={s} variant="filled" color="neutral" size="sm" styles={{ label: { textTransform: 'capitalize' } }}>
                {s}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Group>

      {/* Orders */}
      <Stack gap="sm">
        {filtered.length > 0 && (
          <Paper
            withBorder
            radius="lg"
            px="md"
            py={10}
            pos="sticky"
            top={0}
            c="dimmed"
            style={{
              zIndex: 10,
              fontSize: '0.68rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <Group gap="md" wrap="nowrap">
              <Box flex={1} miw={0}>Pedido</Box>
              {profile !== 'lojista' && <Box w={COL.client} flex="none">Cliente</Box>}
              {profile !== 'rep' && <Box w={COL.rep} flex="none">Representante</Box>}
              <Box w={COL.qty} flex="none">Quantidade</Box>
              <Box w={COL.total} flex="none" ta="right">Total</Box>
              <Box w={COL.caret} flex="none" />
            </Group>
          </Paper>
        )}

        {filtered.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            profile={profile}
            onOpen={() => { onSelectOrder(order); onNavigate('order-detail'); }}
          />
        ))}

        {filtered.length === 0 && (
          <Paper withBorder radius="lg" py={64}>
            <Stack align="center" gap={4}>
              <ThemeIcon variant="light" color="neutral" size={48} radius="xl" mb={8}>
                <ClockIcon size={24} />
              </ThemeIcon>
              <Text fw={600}>Nenhum pedido encontrado</Text>
              <Text c="dimmed" size="0.85rem">Tente ajustar os filtros de busca</Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
