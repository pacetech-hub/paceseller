import { useState } from "react";
import { Stack, Group, Box, Center, Paper, Text, TextInput, Chip, Badge, UnstyledButton, Card } from "@mantine/core";
import historyClasses from "./OrderHistory.module.css";
import {
  MagnifyingGlassIcon,
  CaretRightIcon,
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
import classes from "./interactive.module.css";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton, TableSkeleton } from "./ui/Skeletons";
import { CellList, CellCard, CellField } from "./ui/CellView";
import { EmptyState } from "./ui/EmptyState";
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
      leftSection={<StatusIcon size={12} />}
      styles={{ root: { flexShrink: 0 } }}
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

// shared column template so the legend row and every card line up exactly
// (a partir do breakpoint md; abaixo dele cada pedido vira um cartão em "cell view")
// Larguras fixas das colunas; a coluna do pedido ocupa o espaço restante.
// Cliente só aparece para admin/rep e representante só para admin/lojista.
const COL = { client: 160, rep: 150, qty: 100, total: 130, caret: 20 } as const;

/** Mesmo pedido no celular: cartão com rótulo acima do valor, sem rolagem lateral. */
function OrderCellCard({ order, profile, onOpen }: { order: Order; profile: Profile; onOpen: () => void }) {
  const productName = orderProductNames[order.id] ?? order.collection;
  const client = clients.find(c => c.id === order.clientId);
  return (
    <CellCard
      title={<Text span inherit className="mono">{order.id}</Text>}
      aside={<OrderStatusBadge status={order.status} />}
      onClick={onOpen}
    >
      <Text c="dimmed" size="sm">{statusSupportText(order)}</Text>
      <CellField label="Produto">{productName}</CellField>
      {profile !== 'lojista' && (
        <CellField label="Cliente">
          {client?.name ?? order.client}
          {client && <Text c="dimmed" size="sm">{client.city} / {client.state}</Text>}
        </CellField>
      )}
      {profile !== 'rep' && <CellField label="Representante">{order.rep}</CellField>}
      <CellField label="Quantidade"><Text className="mono" fw={600}>{order.items.toLocaleString('pt-BR')} pares</Text></CellField>
      <CellField label="Total"><Text className="mono" fw={600}>{formatCurrency(order.total)}</Text></CellField>
    </CellCard>
  );
}

function OrderCard({ order, profile, onOpen }: { order: Order; profile: Profile; onOpen: () => void }) {
  const support = statusSupportText(order);
  const productName = orderProductNames[order.id] ?? order.collection;
  const client = clients.find(c => c.id === order.clientId);

  return (
    <Card withBorder padding={0}>
      <UnstyledButton
        onClick={onOpen}
        className={classes.hoverable}
        p={{ base: 'sm', sm: 'md' }}
        w="100%"
      >
        <Group gap="md" wrap="nowrap">
          {/* column 1: order info */}
          <Box flex={1} miw={0}>
            <Group gap="xs" mb={4}>
              <OrderStatusBadge status={order.status} />
              <Text c="dimmed" size="sm">{support}</Text>
            </Group>
            <Text fw={600} truncate>
              <Text span inherit className="mono">{order.id}</Text> — {productName}
            </Text>
          </Box>

          {/* column 2: cliente (admin/rep only) */}
          {profile !== 'lojista' && (
            <Box w={COL.client} flex="none">
              <Text fw={600} truncate>{client?.name ?? order.client}</Text>
              <Text c="dimmed" size="sm" truncate>{client ? `${client.city} / ${client.state}` : ''}</Text>
            </Box>
          )}

          {/* column 3: representante (hidden for rep, viewing their own orders) */}
          {profile !== 'rep' && (
            <Box w={COL.rep} flex="none">
              <Text truncate>{order.rep}</Text>
            </Box>
          )}

          {/* column 4: quantidade */}
          <Box w={COL.qty} flex="none" ta="right">
            <Text className="mono" truncate>{order.items.toLocaleString('pt-BR')} pares</Text>
          </Box>

          {/* column 5: total */}
          <Box w={COL.total} flex="none" ta="right">
            <Text className="mono" fw={700} truncate>{formatCurrency(order.total)}</Text>
          </Box>

          <Center w={COL.caret} flex="none">
            <CaretRightIcon size={16} color="var(--mantine-color-dimmed)" />
          </Center>
        </Group>
      </UnstyledButton>
    </Card>
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

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* Filters */}
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder="Buscar por nº do pedido, cliente ou representante"
          leftSection={<MagnifyingGlassIcon size={14} />}
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

      {/* Orders — enquanto carrega, skeleton no formato da lista (colunas no desktop, cartões no celular) */}
      {loading ? (
        <>
          <Box visibleFrom="md"><TableSkeleton rows={6} cols={profile === 'admin' ? 5 : 4} /></Box>
          <Box hiddenFrom="md"><ListSkeleton rows={4} withAvatar={false} /></Box>
        </>
      ) : (
      <Stack gap="sm">
        {/* ordem da lista em palavras simples */}
        {filtered.length > 0 && (
          <Text c="dimmed" size="sm">Em análise primeiro, depois aprovados, faturados, entregues e cancelados</Text>
        )}
        {filtered.length > 0 && (
          <Paper
            withBorder
            px="md"
            py="sm"
            visibleFrom="md"
            pos="sticky"
            top={0}
            c="dimmed"
            fz="sm"
            fw={600}
            className={historyClasses.stickyHeader}
          >
            <Group gap="md" wrap="nowrap">
              <Box flex={1} miw={0}>Pedido</Box>
              {profile !== 'lojista' && <Box w={COL.client} flex="none">Cliente</Box>}
              {profile !== 'rep' && <Box w={COL.rep} flex="none">Representante</Box>}
              <Box w={COL.qty} flex="none" ta="right">Quantidade</Box>
              <Box w={COL.total} flex="none" ta="right">Total</Box>
              <Box w={COL.caret} flex="none" />
            </Group>
          </Paper>
        )}

        {filtered.length > 0 && (
          <Stack gap="sm" visibleFrom="md">
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                profile={profile}
                onOpen={() => { onSelectOrder(order); onNavigate('order-detail'); }}
              />
            ))}
          </Stack>
        )}

        {filtered.length > 0 && (
          <CellList hiddenFrom="md">
            {filtered.map(order => (
              <OrderCellCard
                key={order.id}
                order={order}
                profile={profile}
                onOpen={() => { onSelectOrder(order); onNavigate('order-detail'); }}
              />
            ))}
          </CellList>
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
