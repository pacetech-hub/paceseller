import { useMemo, useState } from "react";
import { ShoppingCart, Plus, Search, Store, Package2, Calendar, User, Users, ArrowLeftRight, ShoppingBag, Eye, UserCheck, type LucideIcon } from "lucide-react";
import {
  Box, Group, Title, Text, Button, Paper, Center, Flex, TextInput, UnstyledButton, SimpleGrid, Badge,
} from "@mantine/core";
import { clients, formatCurrency, type Client } from "../data/mockData";
import classes from "./CartsListPage.module.css";

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

const creatorStyle: Record<CartCreator, { icon: LucideIcon; color: string }> = {
  lojista: { icon: Store, color: 'teal' },
  rep: { icon: UserCheck, color: 'yellow' },
};

/** Identifica quem montou o carrinho — o próprio lojista ou o representante — em relação a quem está olhando. */
function CreatorBadge({ createdBy, viewerRole }: { createdBy?: CartCreator; viewerRole: CartCreator }) {
  if (!createdBy) return null;
  const { icon: Icon, color } = creatorStyle[createdBy];
  const isViewer = createdBy === viewerRole;
  const label = isViewer ? 'Você' : createdBy === 'lojista' ? 'Lojista' : 'Representante';
  const title = createdBy === 'lojista' ? 'Carrinho criado pelo lojista' : 'Carrinho criado pelo representante';
  return (
    <Badge variant="light" color={color} c={`${color}.7`} radius="sm" tt="none" size="sm" fz="0.65rem" fw={600} px={6} leftSection={<Icon size={10} />} title={title}>
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
      <Group justify="space-between" mb={20} gap="sm">
        <div>
          <Title order={2} fw={700} size="1.15rem">
            {lockClient ? 'Meus carrinhos' : selectedClient && !showAll ? `Carrinhos de ${selectedClient.name}` : 'Carrinhos em construção'}
          </Title>
          <Text c="dimmed" size="0.82rem">
            {lockClient
              ? 'Carrinhos da sua loja. Você pode manter mais de um, e ver os que o representante montou para você.'
              : selectedClient && !showAll
              ? 'Carrinhos vinculados ao cliente atual. Você pode manter mais de um.'
              : 'Cada carrinho está vinculado a um cliente. Abrir um carrinho de outro cliente troca o cliente ativo.'}
          </Text>
        </div>
        {!newOpen && (
          <Button
            onClick={() => canCreate && setNewOpen(true)}
            disabled={!canCreate}
            title={canCreate ? 'Criar novo carrinho' : 'Selecione um cliente para criar um carrinho'}
            leftSection={<Plus size={16} />}
            px={14}
            fz="0.83rem"
            fw={600}
          >
            Novo carrinho
          </Button>
        )}
      </Group>

      {/* Bloco sem cliente selecionado: busca rápida + atalho para carteira */}
      {!lockClient && !selectedClient && (
        <Paper radius="lg" p="md" mb={20} bg="gray.0" style={{ border: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap={10} wrap="nowrap" mb="sm">
            <Center w={32} h={32} bg="gray.2" style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}>
              <Users size={16} color="var(--mantine-color-gray-9)" />
            </Center>
            <div>
              <Text fw={600} size="0.85rem">Selecione um cliente para criar um carrinho</Text>
              <Text c="dimmed" size="0.75rem">Busque pelo nome ou abra sua carteira de clientes.</Text>
            </div>
          </Group>
          <Flex direction={{ base: 'column', sm: 'row' }} gap={8}>
            <Box pos="relative" flex={1}>
              <TextInput
                value={clientQuery}
                onChange={e => setClientQuery(e.target.value)}
                placeholder="Buscar cliente por nome ou código..."
                leftSection={<Search size={14} color="var(--mantine-color-dimmed)" />}
                styles={{ input: { fontSize: '0.82rem' } }}
              />
              {clientQuery && clientMatches.length > 0 && (
                <Paper withBorder radius="md" shadow="lg" pos="absolute" left={0} right={0} mt={4} style={{ zIndex: 10, overflow: 'hidden' }}>
                  {clientMatches.map(c => (
                    <UnstyledButton
                      key={c.id}
                      onClick={() => {
                        onSelectClient?.(c);
                        setClientQuery('');
                        setNewOpen(true);
                      }}
                      className={classes.option}
                    >
                      <Store size={14} color="var(--mantine-color-dimmed)" />
                      <Text span size="0.82rem">{c.name}</Text>
                      <Text span c="dimmed" ml="auto" size="0.7rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.id}</Text>
                    </UnstyledButton>
                  ))}
                </Paper>
              )}
              {clientQuery && clientMatches.length === 0 && (
                <Paper withBorder radius="md" pos="absolute" left={0} right={0} mt={4} p="sm" style={{ zIndex: 10 }}>
                  <Text c="dimmed" size="0.78rem">Nenhum cliente encontrado.</Text>
                </Paper>
              )}
            </Box>
            {onNavigateClients && (
              <Button
                onClick={onNavigateClients}
                variant="outline"
                leftSection={<Users size={14} />}
                px="sm"
                fz="0.8rem"
                fw={600}
                style={{ borderColor: 'var(--mantine-color-gray-4)' }}
              >
                Buscar clientes em carteira
              </Button>
            )}
          </Flex>
        </Paper>
      )}

      {/* Toggle para ver carrinhos de outros clientes */}
      {!lockClient && selectedClient && (
        <Group gap={8} mb="md">
          <Button
            onClick={() => setShowAll(false)}
            variant={!showAll ? 'filled' : 'default'}
            c={!showAll ? undefined : 'dimmed'}
            size="xs"
            h={32}
            radius="sm"
            fz="0.78rem"
            fw={600}
          >
            Deste cliente
          </Button>
          <Button
            onClick={() => setShowAll(true)}
            variant={showAll ? 'filled' : 'default'}
            c={showAll ? undefined : 'dimmed'}
            size="xs"
            h={32}
            radius="sm"
            fz="0.78rem"
            fw={600}
            leftSection={<ArrowLeftRight size={14} />}
            rightSection={otherCarts.length > 0 ? (
              <Box
                component="span"
                px={6}
                bg={showAll ? 'rgba(255,255,255,0.2)' : 'gray.1'}
                fz="0.7rem"
                style={{ borderRadius: 'var(--mantine-radius-sm)' }}
              >
                +{otherCarts.length}
              </Box>
            ) : undefined}
          >
            Todos os clientes
          </Button>
        </Group>
      )}

      {newOpen && selectedClient && (
        <Paper withBorder radius="lg" p="md" mb={20}>
          <Text mb={4} fw={600} size="0.9rem">Criar novo carrinho</Text>
          <Group gap={6} mb="sm" c="dimmed" fz="0.78rem">
            <Store size={12} /> Cliente: <Text span c="var(--mantine-color-text)" fw={600} inherit>{selectedClient.name}</Text>
          </Group>
          <TextInput
            label="Nome do carrinho"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Ex.: Reposição Inverno 26"
            styles={{
              label: { fontSize: '0.72rem', fontWeight: 400, color: 'var(--mantine-color-dimmed)', marginBottom: 4 },
              input: { fontSize: '0.82rem', backgroundColor: 'var(--mantine-color-gray-0)' },
            }}
          />
          <Group justify="flex-end" gap={8} mt="sm">
            <Button onClick={() => setNewOpen(false)} variant="default" c="dimmed" size="xs" h={32} radius="sm" fz="0.8rem" fw={400}>Cancelar</Button>
            <Button onClick={handleCreate} size="xs" h={32} radius="sm" fz="0.8rem" fw={600}>Criar e abrir</Button>
          </Group>
        </Paper>
      )}

      <TextInput
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Buscar por cliente ou nome do carrinho..."
        leftSection={<Search size={14} color="var(--mantine-color-dimmed)" />}
        mb={20}
        maw={448}
        styles={{ input: { fontSize: '0.82rem', backgroundColor: 'var(--mantine-color-gray-0)' } }}
      />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {filtered.map(c => {
          const isOther = selectedClient && c.clientId !== selectedClient.id;
          return (
            <div key={c.id} className={classes.card}>
              {isOther && (
                <Badge
                  variant="light"
                  color="yellow"
                  c="yellow.7"
                  radius="sm"
                  tt="none"
                  size="sm"
                  px={6}
                  fz="0.65rem"
                  fw={600}
                  leftSection={<ArrowLeftRight size={10} />}
                  pos="absolute"
                  top={12}
                  right={12}
                >
                  troca cliente
                </Badge>
              )}
              <UnstyledButton
                onClick={() => onOpenCart({ id: c.id, clientId: c.clientId, clientName: c.clientName, cartName: c.cartName, createdBy: c.createdBy })}
                className={classes.cardBody}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
                  <Center w={40} h={40} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                    <ShoppingCart size={16} color="var(--mantine-color-gray-9)" />
                  </Center>
                  <Text span fw={700} size="0.95rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(c.total)}</Text>
                </Group>
                <Text className={classes.cardTitle} truncate fw={600} size="0.92rem">{c.cartName}</Text>
                <Group gap={6} mt={4} c="dimmed" wrap="nowrap">
                  <Store size={12} />
                  <Text span truncate size="0.76rem">{c.clientName}</Text>
                </Group>
                <Box mt={8}>
                  <CreatorBadge createdBy={c.createdBy} viewerRole={viewerRole} />
                </Box>
                <SimpleGrid cols={3} spacing={8} mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                  <Group gap={4} c="dimmed" wrap="nowrap" title="Itens">
                    <Package2 size={12} />
                    <Text span size="0.72rem">{c.items} itens</Text>
                  </Group>
                  <Group gap={4} c="dimmed" wrap="nowrap" title="Pares">
                    <Text span size="0.72rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.pairs} pares</Text>
                  </Group>
                  <Group gap={4} c="dimmed" wrap="nowrap" justify="flex-end" title="Atualizado">
                    <Calendar size={12} />
                    <Text span size="0.72rem">{new Date(c.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text>
                  </Group>
                </SimpleGrid>
                <Group gap={4} mt={8} c="dimmed" wrap="nowrap">
                  <User size={12} />
                  <Text span truncate size="0.7rem">Rep: {c.rep}</Text>
                </Group>
              </UnstyledButton>
              <Group gap={8} mt="sm" pt="sm" wrap="nowrap" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                <Button
                  onClick={() => onOpenCart({ id: c.id, clientId: c.clientId, clientName: c.clientName, cartName: c.cartName, createdBy: c.createdBy })}
                  variant="default"
                  c="dimmed"
                  flex={1}
                  size="xs"
                  h={30}
                  radius="sm"
                  px={8}
                  fz="0.75rem"
                  fw={500}
                  leftSection={<Eye size={14} />}
                >
                  Detalhes
                </Button>
                {onGoToCatalog && (
                  <Button
                    onClick={() => onGoToCatalog({ id: c.id, clientId: c.clientId, clientName: c.clientName, cartName: c.cartName, createdBy: c.createdBy })}
                    flex={1}
                    size="xs"
                    h={30}
                    radius="sm"
                    px={8}
                    fz="0.75rem"
                    fw={600}
                    leftSection={<ShoppingBag size={14} />}
                  >
                    Catálogo
                  </Button>
                )}
              </Group>
            </div>
          );
        })}
      </SimpleGrid>

      {filtered.length === 0 && (
        <Box ta="center" py={64} c="dimmed">
          <Center mb="sm">
            <ShoppingCart size={40} style={{ opacity: 0.3 }} />
          </Center>
          <Text size="0.88rem">
            {selectedClient && !showAll
              ? `Nenhum carrinho para ${selectedClient.name} ainda. Crie um novo ou veja carrinhos de outros clientes.`
              : 'Nenhum carrinho encontrado.'}
          </Text>
        </Box>
      )}
    </Box>
  );
}
