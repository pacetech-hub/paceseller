import { useState } from "react";
import { Stack, Group, Box, Paper, Text, TextInput, Chip, Badge, Button, Card, Table } from "@mantine/core";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SealCheckIcon,
  CheckSquareIcon,
  SquaresFourIcon,
  UsersIcon,
  ShoppingBagIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { TableSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import { StockTableHeader } from "./StockTable";
import sticky from "./ui/stickyTable.module.css";
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

// cor Mantine do badge de cada status do pedido (somente cores da paleta):
// etapas intermediárias em neutro, atenção em amarelo, concluído em verde-azulado, cancelado em vermelho.
// O ícone de cada status diferencia os neutros entre si.
export const statusColors: Record<string, string> = {
  'aprovado': 'neutral',
  'em análise': 'yellow',
  'faturado': 'neutral',
  'cancelado': 'red',
  'entregue': 'teal',
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
      variant="light"
      color={statusColors[status]}
      leftSection={<StatusIcon size={14} />}
      styles={{ root: { flexShrink: 0, minWidth: 'max-content' } }}
    >
      {status}
    </Badge>
  );
}

export const orderProductNames: Record<string, string> = {
  '4790-1': 'Tênis Fusion — Coleção 2026',
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

// Mesma estrutura de tabela do Meu Estoque: tabela densa mantida também no celular,
// com rolagem lateral, cabeçalho fixo e a coluna Pedido sempre visível.
// Cliente só aparece para admin/rep e representante só para admin/lojista.
const NUMERIC_HEADERS = ['Quantidade', 'Total'];

function OrderRow({ order, profile, onOpen }: { order: Order; profile: Profile; onOpen: () => void }) {
  const productName = orderProductNames[order.id] ?? order.collection;
  const client = clients.find(c => c.id === order.clientId);
  return (
    <Table.Tr onClick={onOpen} style={{ cursor: 'pointer' }}>
      <Table.Td maw={300}>
        <Text fw={600} className="mono">{order.id}</Text>
        <Text c="dimmed" size="sm" truncate>{productName}</Text>
      </Table.Td>
      <Table.Td miw={180} style={{ whiteSpace: 'normal' }}>
        <OrderStatusBadge status={order.status} />
        <Text c="dimmed" size="sm" mt={4}>{statusSupportText(order)}</Text>
      </Table.Td>
      {profile !== 'lojista' && (
        <Table.Td maw={220}>
          <Text truncate>{client?.name ?? order.client}</Text>
          {client && <Text c="dimmed" size="sm">{client.city} / {client.state}</Text>}
        </Table.Td>
      )}
      {profile !== 'rep' && <Table.Td><Text>{order.rep}</Text></Table.Td>}
      <Table.Td ta="right"><Text className="mono">{order.items.toLocaleString('pt-BR')} pares</Text></Table.Td>
      <Table.Td ta="right"><Text fw={600} className="mono">{formatCurrency(order.total)}</Text></Table.Td>
      <Table.Td ta="right">
        <Button
          variant="default"
          size="sm"
          leftSection={<EyeIcon size={16} />}
          onClick={e => { e.stopPropagation(); onOpen(); }}
          aria-label={`Ver pedido ${order.id}`}
        >
          Ver
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}

export function OrderHistory({ onNavigate, onSelectOrder, profile = 'admin', initialSearch = '', initialStatusFilter = 'todos' }: OrderHistoryProps) {
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const loading = useMockLoading();

  // ordem do fluxo do pedido (tem significado: não reordenar por popularidade)
  const statuses = ['todos', 'em análise', 'aprovado', 'faturado', 'entregue', 'cancelado'];
  const statusLabels: Record<string, string> = {
    'todos': 'Todos', 'em análise': 'Em análise', 'aprovado': 'Aprovado',
    'faturado': 'Faturado', 'entregue': 'Entregue', 'cancelado': 'Cancelado',
  };
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

  const hasFilters = search.trim() !== '' || statusFilter !== 'todos';

  const headers = [
    'Pedido', 'Status',
    ...(profile !== 'lojista' ? ['Cliente'] : []),
    ...(profile !== 'rep' ? ['Representante'] : []),
    'Quantidade', 'Total', 'Ações',
  ];

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* Filters */}
      <Paper withBorder p="sm">
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar por nº do pedido, cliente ou representante"
            leftSection={<MagnifyingGlassIcon size={16} />}
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            flex={{ base: '1 1 100%', sm: 1 }}
            miw={{ sm: 160 }}
          />
          <Chip.Group value={statusFilter} onChange={v => setStatusFilter(v as string)}>
            <Group gap="sm">
              {statuses.map(s => (
                <Chip key={s} value={s} variant="filled" color="neutral">
                  {statusLabels[s]}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Group>
      </Paper>

      {/* Orders */}
      {loading ? <TableSkeleton rows={8} cols={headers.length} /> : (
      <Stack gap="sm">
        {/* ordem da lista em palavras simples */}
        {filtered.length > 0 && (
          <Text c="dimmed" size="sm">Em análise primeiro, depois aprovados, faturados, entregues e cancelados</Text>
        )}
        {filtered.length > 0 && (
          <Card withBorder padding={0}>
            <Table.ScrollContainer minWidth={900} maxHeight={560}>
              <Table className={sticky.firstCol} stickyHeader stickyHeaderOffset={0}
                highlightOnHover verticalSpacing="sm" horizontalSpacing="md" style={{ whiteSpace: 'nowrap' }}>
                <StockTableHeader labels={headers} numeric={NUMERIC_HEADERS} />
                <Table.Tbody>
                  {filtered.map(order => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      profile={profile}
                      onOpen={() => { onSelectOrder(order); onNavigate('order-detail'); }}
                    />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
        )}

        {filtered.length === 0 && (hasFilters ? (
          <EmptyState
            icon={MagnifyingGlassIcon}
            title="Nenhum pedido encontrado"
            description="Nenhum pedido corresponde à busca ou ao status selecionado. Limpe os filtros para ver todos os pedidos."
            action={{ label: 'Limpar Filtros', onClick: () => { setSearch(''); setStatusFilter('todos'); }, forward: false }}
          />
        ) : (
          <EmptyState
            icon={ShoppingBagIcon}
            title="Você ainda não tem pedidos"
            description="Os pedidos enviados aparecem aqui com status, quantidade e total. Monte um carrinho a partir do catálogo para criar o primeiro."
            action={{ label: 'Ir para o Catálogo', onClick: () => onNavigate('catalog') }}
            suggestions={[
              { label: 'Montar pedido por grade', description: 'Informe as quantidades por numeração de cada produto', icon: SquaresFourIcon, onClick: () => onNavigate('order-grade') },
              ...(profile !== 'lojista'
                ? [{ label: 'Escolher cliente na carteira', description: 'Comece o pedido a partir de um cliente', icon: UsersIcon, onClick: () => onNavigate('clients') }]
                : []),
            ]}
          />
        ))}
      </Stack>
      )}
    </Stack>
  );
}
