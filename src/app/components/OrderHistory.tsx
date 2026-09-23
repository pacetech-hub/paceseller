import { useState } from "react";
import { Badge, Box, Group, Paper, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import {
  Search, ChevronRight, Clock,
  CheckCircle2, XCircle, FileCheck2, PackageCheck,
} from "lucide-react";
import { orders, clients, formatCurrency, formatDate, type Order } from "../data/mockData";
import classes from "./OrderHistory.module.css";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'order-detail';

type Profile = 'admin' | 'rep' | 'lojista';

interface OrderHistoryProps {
  onNavigate: (view: View) => void;
  onSelectOrder: (order: Order) => void;
  profile?: Profile;
  initialSearch?: string;
  initialStatusFilter?: string;
}

// cor Mantine (Open Color) do badge de cada status — usar com <Badge color={...} variant="light">
export const statusColors: Record<string, string> = {
  'aprovado': 'dark',
  'em análise': 'yellow',
  'faturado': 'teal',
  'cancelado': 'red',
  'entregue': 'violet',
};

export const statusIcon: Record<string, React.ComponentType<{ className?: string; size?: number | string }>> = {
  'aprovado': CheckCircle2,
  'em análise': Clock,
  'faturado': FileCheck2,
  'cancelado': XCircle,
  'entregue': PackageCheck,
};

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
function orderGridTemplate(profile: Profile): string {
  if (profile === 'rep') return 'minmax(0,1fr) 160px 100px 130px 20px'; // pedido, cliente, quantidade, total
  if (profile === 'lojista') return 'minmax(0,1fr) 150px 100px 130px 20px'; // pedido, representante, quantidade, total
  return 'minmax(0,1fr) 160px 150px 100px 130px 20px'; // admin: pedido, cliente, representante, quantidade, total
}

function OrderCard({ order, profile, onOpen }: { order: Order; profile: Profile; onOpen: () => void }) {
  const StatusIcon = statusIcon[order.status];
  const support = statusSupportText(order);
  const productName = orderProductNames[order.id] ?? order.collection;
  const client = clients.find(c => c.id === order.clientId);

  return (
    <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
      <div
        onClick={onOpen}
        className={classes.row}
        style={{ display: 'grid', gridTemplateColumns: orderGridTemplate(profile), columnGap: '1rem', alignItems: 'center' }}
      >
        {/* column 1: order info */}
        <Box miw={0}>
          <Group gap={8} mb={4}>
            <Badge
              color={statusColors[order.status]}
              variant="light"
              radius="xl"
              tt="none"
              h="auto"
              px={8}
              py={2}
              fz="0.7rem"
              fw={600}
              leftSection={<StatusIcon size={12} />}
              styles={{ section: { marginInlineEnd: 4 } }}
              style={{ flexShrink: 0 }}
            >
              {order.status}
            </Badge>
            <Text span c="dimmed" size="0.72rem" style={{ flexShrink: 0 }}>{support}</Text>
          </Group>
          <Text truncate size="0.85rem" fw={600}>
            <Text span inherit style={{ fontVariantNumeric: 'tabular-nums' }}>{order.id}</Text> — {productName}
          </Text>
        </Box>

        {/* column 2: cliente (admin/rep only) */}
        {profile !== 'lojista' && (
          <Box miw={0}>
            <Text truncate size="0.8rem" fw={500}>{client?.name ?? order.client}</Text>
            <Text c="dimmed" truncate size="0.7rem">{client ? `${client.city} / ${client.state}` : ''}</Text>
          </Box>
        )}

        {/* column 3: representante (hidden for rep, viewing their own orders) */}
        {profile !== 'rep' && (
          <Box miw={0}>
            <Text truncate size="0.8rem" fw={500}>{order.rep}</Text>
          </Box>
        )}

        {/* column 4: quantidade */}
        <Box miw={0}>
          <Text truncate size="0.8rem" fw={500}>{order.items} pares</Text>
        </Box>

        {/* column 5: total */}
        <Box ta="right" miw={0}>
          <Text truncate size="0.95rem" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(order.total)}</Text>
        </Box>

        <ChevronRight size={16} color="var(--mantine-color-dimmed)" style={{ justifySelf: 'center' }} />
      </div>
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
    <Stack gap={20} p="lg" maw={1400} mx="auto" w="100%">
      {/* Filters */}
      <Group gap="sm">
        <TextInput
          type="text"
          placeholder="Buscar pedido, cliente, rep..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          flex={1}
          miw={160}
          leftSection={<Search size={14} />}
          styles={{ input: { fontSize: '0.82rem' } }}
        />
        <Group gap={6}>
          {statuses.map(s => (
            <UnstyledButton
              key={s}
              onClick={() => setStatusFilter(s)}
              className={classes.pill}
              data-active={statusFilter === s || undefined}
            >
              {s}
            </UnstyledButton>
          ))}
        </Group>
      </Group>

      {/* Orders */}
      <Stack gap="sm">
        {filtered.length > 0 && (
          <Paper
            withBorder
            radius="lg"
            px="md"
            py={10}
            c="dimmed"
            pos="sticky"
            top={0}
            style={{
              zIndex: 10,
              display: 'grid',
              gridTemplateColumns: orderGridTemplate(profile),
              columnGap: '1rem',
              alignItems: 'center',
              fontSize: '0.68rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <Box miw={0}>Pedido</Box>
            {profile !== 'lojista' && <Box miw={0}>Cliente</Box>}
            {profile !== 'rep' && <Box miw={0}>Representante</Box>}
            <Box miw={0}>Quantidade</Box>
            <Box ta="right" miw={0}>Total</Box>
            <div />
          </Paper>
        )}
        <Stack gap="sm">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              profile={profile}
              onOpen={() => { onSelectOrder(order); onNavigate('order-detail'); }}
            />
          ))}

          {filtered.length === 0 && (
            <Paper withBorder radius="lg" py={64} ta="center">
              <Stack gap={0} align="center" justify="center">
                <Clock size={40} color="var(--mantine-color-gray-4)" style={{ marginBottom: 12 }} />
                <Text fw={600}>Nenhum pedido encontrado</Text>
                <Text c="dimmed" mt={4} size="0.85rem">Tente ajustar os filtros de busca</Text>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
