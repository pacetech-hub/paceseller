import { useMemo, useState } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, TextInput, Badge, ThemeIcon, SimpleGrid,
  SegmentedControl, Popover, UnstyledButton, Divider, Card,
} from "@mantine/core";
import {
  ShoppingCartIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  StorefrontIcon,
  PackageIcon,
  CalendarBlankIcon,
  UserIcon,
  UsersIcon,
  ArrowsLeftRightIcon,
  ShoppingBagIcon,
  EyeIcon,
  UserCheckIcon,
  type Icon,
} from "@phosphor-icons/react";
import classes from "./interactive.module.css";
import { clients, formatCurrency, type Client } from "../data/mockData";

export type CartCreator = 'lojista' | 'rep';

export interface CartContext {
  id: string;
  clientId: string;
  clientName: string;
  cartName: string;
  createdBy?: CartCreator;
}

interface MockCart extends CartContext {
  items: number;
  pairs: number;
  total: number;
  updatedAt: string;
  rep: string;
  createdBy: CartCreator;
}

export const mockCarts: MockCart[] = [
  { id: 'CART-001', clientId: clients[0].id, clientName: clients[0].name, cartName: 'Reposição Inverno 26', items: 3, pairs: 44, total: 5652.97, updatedAt: '2026-06-16', rep: clients[0].rep, createdBy: 'lojista' },
  { id: 'CART-002', clientId: clients[0].id, clientName: clients[0].name, cartName: 'Lançamento Flow XL', items: 2, pairs: 28, total: 3890.40, updatedAt: '2026-06-14', rep: clients[0].rep, createdBy: 'rep' },
  { id: 'CART-003', clientId: clients[2].id, clientName: clients[2].name, cartName: 'Pedido principal', items: 5, pairs: 72, total: 9120.00, updatedAt: '2026-06-15', rep: clients[2].rep, createdBy: 'rep' },
  { id: 'CART-004', clientId: clients[5].id, clientName: clients[5].name, cartName: 'Coleção Primavera', items: 4, pairs: 56, total: 7240.80, updatedAt: '2026-06-13', rep: clients[5].rep, createdBy: 'rep' },
  { id: 'CART-005', clientId: clients[1].id, clientName: clients[1].name, cartName: 'Reposição MG', items: 2, pairs: 22, total: 2750.60, updatedAt: '2026-06-12', rep: clients[1].rep, createdBy: 'rep' },
  { id: 'CART-006', clientId: clients[6].id, clientName: clients[6].name, cartName: 'Pedido teste Sul', items: 1, pairs: 12, total: 1480.00, updatedAt: '2026-06-11', rep: clients[6].rep, createdBy: 'rep' },
];

const creatorStyle: Record<CartCreator, { icon: Icon; color: string }> = {
  lojista: { icon: StorefrontIcon, color: 'teal' },
  rep: { icon: UserCheckIcon, color: 'yellow' },
};

const badgeStyles = { label: { textTransform: 'none' as const } };

/** Identifica quem montou o carrinho — o próprio lojista ou o representante — em relação a quem está olhando. */
function CreatorBadge({ createdBy, viewerRole }: { createdBy?: CartCreator; viewerRole: CartCreator }) {
  if (!createdBy) return null;
  const { icon: CreatorIcon, color } = creatorStyle[createdBy];
  const isViewer = createdBy === viewerRole;
  const label = isViewer ? 'Você' : createdBy === 'lojista' ? 'Lojista' : 'Representante';
  const title = createdBy === 'lojista' ? 'Carrinho criado pelo lojista' : 'Carrinho criado pelo representante';
  return (
    <Badge size="xs" radius="sm" variant="light" color={color} leftSection={<CreatorIcon size={10} />} styles={badgeStyles} title={title}>
      {label}
    </Badge>
  );
}

interface CartsListPageProps {
  onOpenCart: (ctx: CartContext) => void;
  onCreateCart?: (ctx: CartContext) => void;
  onNavigateClients?: () => void;
  selectedClient?: Client | null;
  onSelectClient?: (client: Client) => void;
  onGoToCatalog?: (ctx: CartContext) => void;
  /** Perfil de quem está vendo a lista — define quem é "Você" nos identificadores de criação. */
  viewerRole?: CartCreator;
  /** Quando true, esconde a troca/busca de cliente (lojista só enxerga os carrinhos da própria loja). */
  lockClient?: boolean;
}

export function CartsListPage({ onOpenCart, onCreateCart, onNavigateClients, selectedClient, onSelectClient, onGoToCatalog, viewerRole = 'rep', lockClient = false }: CartsListPageProps) {
  const [q, setQ] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  // Busca rápida de cliente quando nenhum está selecionado
  const [clientQuery, setClientQuery] = useState('');
  const [showAll, setShowAll] = useState(!selectedClient);

  const scopedCarts = useMemo(() => {
    if (selectedClient && (lockClient || !showAll)) return mockCarts.filter(c => c.clientId === selectedClient.id);
    return mockCarts;
  }, [selectedClient, showAll, lockClient]);

  const otherCarts = useMemo(
    () => (selectedClient && !lockClient) ? mockCarts.filter(c => c.clientId !== selectedClient.id) : [],
    [selectedClient, lockClient]
  );

  const filtered = scopedCarts.filter(c =>
    c.clientName.toLowerCase().includes(q.toLowerCase()) ||
    c.cartName.toLowerCase().includes(q.toLowerCase())
  );

  const clientMatches = useMemo(() => {
    const t = clientQuery.trim().toLowerCase();
    if (!t) return [];
    return clients.filter(c => c.name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t)).slice(0, 6);
  }, [clientQuery]);

  const canCreate = !!selectedClient;

  const handleCreate = () => {
    if (!selectedClient) return;
    const ctx: CartContext = {
      id: `CART-NEW-${Date.now()}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      cartName: newName || 'Novo carrinho',
      createdBy: viewerRole,
    };
    (onCreateCart ?? onOpenCart)(ctx);
  };

  return (
    <Box p="lg" maw={1400} mx="auto" w="100%">
      <Group justify="space-between" align="flex-start" gap="sm" mb="lg">
        <Box>
          <Title order={2} fw={700} fz="1.15rem">
            {lockClient ? 'Meus carrinhos' : selectedClient && !showAll ? `Carrinhos de ${selectedClient.name}` : 'Carrinhos em construção'}
          </Title>
          <Text c="dimmed" size="0.82rem">
            {lockClient
              ? 'Carrinhos da sua loja. Você pode manter mais de um, e ver os que o representante montou para você.'
              : selectedClient && !showAll
              ? 'Carrinhos vinculados ao cliente atual. Você pode manter mais de um.'
              : 'Cada carrinho está vinculado a um cliente. Abrir um carrinho de outro cliente troca o cliente ativo.'}
          </Text>
        </Box>
        {!newOpen && (
          <Button
            onClick={() => canCreate && setNewOpen(true)}
            disabled={!canCreate}
            title={canCreate ? 'Criar novo carrinho' : 'Selecione um cliente para criar um carrinho'}
            leftSection={<PlusIcon size={16} />}
          >
            Novo carrinho
          </Button>
        )}
      </Group>

      {/* Bloco sem cliente selecionado: busca rápida + atalho para carteira */}
      {!lockClient && !selectedClient && (
        <Paper withBorder radius="lg" p="md" mb="lg" bg="var(--mantine-color-neutral-0)">
          <Group gap="sm" mb="sm" wrap="nowrap">
            <ThemeIcon variant="light" color="neutral" size={32} radius="md">
              <UsersIcon size={16} />
            </ThemeIcon>
            <Box>
              <Text fw={600} size="0.85rem">Selecione um cliente para criar um carrinho</Text>
              <Text c="dimmed" size="0.75rem">Busque pelo nome ou abra sua carteira de clientes.</Text>
            </Box>
          </Group>
          <Group gap={8} align="stretch" wrap="wrap">
            <Popover opened={!!clientQuery} width="target" position="bottom-start" offset={4} shadow="md">
              <Popover.Target>
                <TextInput
                  value={clientQuery}
                  onChange={e => setClientQuery(e.currentTarget.value)}
                  placeholder="Buscar cliente por nome ou código..."
                  leftSection={<MagnifyingGlassIcon size={14} />}
                  flex={1}
                  miw={220}
                />
              </Popover.Target>
              <Popover.Dropdown p={4}>
                {clientMatches.length > 0 ? (
                  clientMatches.map(c => (
                    <Paper
                      key={c.id}
                      component="button"
                      type="button"
                      onClick={() => {
                        onSelectClient?.(c);
                        setClientQuery('');
                        setNewOpen(true);
                      }}
                      className={`${classes.cardButton} ${classes.hoverable}`}
                      radius="sm"
                      bd="none"
                      px="sm"
                      py={8}
                    >
                      <Group gap={8} wrap="nowrap">
                        <StorefrontIcon size={14} color="var(--mantine-color-dimmed)" />
                        <Text size="0.82rem">{c.name}</Text>
                        <Text c="dimmed" size="0.7rem" ml="auto" className="mono">{c.id}</Text>
                      </Group>
                    </Paper>
                  ))
                ) : (
                  <Text c="dimmed" size="0.78rem" p="sm">Nenhum cliente encontrado.</Text>
                )}
              </Popover.Dropdown>
            </Popover>
            {onNavigateClients && (
              <Button onClick={onNavigateClients} variant="default" leftSection={<UsersIcon size={14} />}>
                Buscar clientes em carteira
              </Button>
            )}
          </Group>
        </Paper>
      )}

      {/* Toggle para ver carrinhos de outros clientes */}
      {!lockClient && selectedClient && (
        <SegmentedControl
          value={showAll ? 'all' : 'client'}
          onChange={v => setShowAll(v === 'all')}
          size="sm"
          mb="md"
          data={[
            { value: 'client', label: 'Deste cliente' },
            {
              value: 'all',
              label: (
                <Group gap={6} wrap="nowrap" justify="center">
                  <ArrowsLeftRightIcon size={14} />
                  Todos os clientes
                  {otherCarts.length > 0 && (
                    <Badge size="xs" variant="default" radius="sm">+{otherCarts.length}</Badge>
                  )}
                </Group>
              ),
            },
          ]}
        />
      )}

      {newOpen && selectedClient && (
        <Paper withBorder radius="lg" p="md" mb="lg">
          <Text fw={600} size="0.9rem" mb={4}>Criar novo carrinho</Text>
          <Group gap={6} mb="sm" c="dimmed">
            <StorefrontIcon size={12} />
            <Text size="0.78rem" c="dimmed">
              Cliente: <Text span fw={600} c="var(--mantine-color-text)" inherit>{selectedClient.name}</Text>
            </Text>
          </Group>
          <TextInput
            label="Nome do carrinho"
            value={newName}
            onChange={e => setNewName(e.currentTarget.value)}
            placeholder="Ex.: Reposição Inverno 26"
            styles={{ label: { fontSize: '0.72rem', fontWeight: 400, color: 'var(--mantine-color-dimmed)' } }}
          />
          <Group justify="flex-end" gap={8} mt="sm">
            <Button onClick={() => setNewOpen(false)} variant="default" size="xs">Cancelar</Button>
            <Button onClick={handleCreate} size="xs">Criar e abrir</Button>
          </Group>
        </Paper>
      )}

      <TextInput
        value={q}
        onChange={e => setQ(e.currentTarget.value)}
        placeholder="Buscar por cliente ou nome do carrinho..."
        leftSection={<MagnifyingGlassIcon size={14} />}
        maw={448}
        mb="lg"
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {filtered.map(c => {
          const isOther = selectedClient && c.clientId !== selectedClient.id;
          const ctx: CartContext = { id: c.id, clientId: c.clientId, clientName: c.clientName, cartName: c.cartName, createdBy: c.createdBy };
          return (
            <Card key={c.id} withBorder radius="lg" padding={0}>
              <UnstyledButton onClick={() => onOpenCart(ctx)} className={classes.hoverable} p="md" pb={0} flex={1}>
                <Group justify="space-between" align="flex-start" mb="sm" wrap="nowrap">
                  <ThemeIcon variant="light" color="neutral" size={40} radius="md">
                    <ShoppingCartIcon size={16} />
                  </ThemeIcon>
                  <Group gap={8} wrap="nowrap">
                    {isOther && (
                      <Badge
                        size="xs"
                        radius="sm"
                        variant="light"
                        color="yellow"
                        leftSection={<ArrowsLeftRightIcon size={10} />}
                        styles={badgeStyles}
                      >
                        troca cliente
                      </Badge>
                    )}
                    <Text className="mono" size="0.95rem" fw={700}>{formatCurrency(c.total)}</Text>
                  </Group>
                </Group>
                <Text fw={600} size="0.92rem" truncate>{c.cartName}</Text>
                <Group gap={6} mt={4} c="dimmed" wrap="nowrap">
                  <StorefrontIcon size={12} />
                  <Text size="0.76rem" c="dimmed" truncate>{c.clientName}</Text>
                </Group>
                <Box mt={8}>
                  <CreatorBadge createdBy={c.createdBy} viewerRole={viewerRole} />
                </Box>
                <Divider mt="sm" />
                <SimpleGrid cols={3} spacing={8} pt="sm">
                  <Group gap={4} c="dimmed" wrap="nowrap" title="Itens">
                    <PackageIcon size={12} />
                    <Text size="0.72rem" c="dimmed">{c.items} itens</Text>
                  </Group>
                  <Text size="0.72rem" c="dimmed" className="mono" title="Pares">{c.pairs} pares</Text>
                  <Group gap={4} c="dimmed" wrap="nowrap" justify="flex-end" title="Atualizado">
                    <CalendarBlankIcon size={12} />
                    <Text size="0.72rem" c="dimmed">{new Date(c.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text>
                  </Group>
                </SimpleGrid>
                <Group gap={4} mt={8} pb="md" c="dimmed" wrap="nowrap">
                  <UserIcon size={12} />
                  <Text size="0.7rem" c="dimmed" truncate>Rep: {c.rep}</Text>
                </Group>
              </UnstyledButton>
              <Divider color="var(--mantine-color-default-border)" />
              <Group gap={8} p="md" pt="sm" grow>
                <Button onClick={() => onOpenCart(ctx)} variant="default" size="xs" leftSection={<EyeIcon size={14} />}>
                  Detalhes
                </Button>
                {onGoToCatalog && (
                  <Button onClick={() => onGoToCatalog(ctx)} size="xs" leftSection={<ShoppingBagIcon size={14} />}>
                    Catálogo
                  </Button>
                )}
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>

      {filtered.length === 0 && (
        <Stack align="center" gap={8} py={64}>
          <ShoppingCartIcon size={40} color="var(--mantine-color-dimmed)" opacity={0.3} />
          <Text c="dimmed" size="0.88rem" ta="center">
            {selectedClient && !showAll
              ? `Nenhum carrinho para ${selectedClient.name} ainda. Crie um novo ou veja carrinhos de outros clientes.`
              : 'Nenhum carrinho encontrado.'}
          </Text>
        </Stack>
      )}
    </Box>
  );
}
