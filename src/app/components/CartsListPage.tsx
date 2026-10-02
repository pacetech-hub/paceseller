import { useMemo, useState } from "react";
import {
  Group, Box, Paper, Text, Title, Button, TextInput, Badge, ThemeIcon, SimpleGrid, Alert,
  SegmentedControl, Popover, UnstyledButton, Divider, Card, Progress, Avatar, Tabs, Image,
} from "@mantine/core";
import {
  ShoppingCartIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  StorefrontIcon,
  UsersIcon,
  ArrowsLeftRightIcon,
  ArrowRightIcon,
  UserCheckIcon,
  ClockIcon,
  PaperPlaneTiltIcon,
  ChatCircleIcon,
} from "@phosphor-icons/react";
import classes from "./interactive.module.css";
import { useMockLoading } from "../lib/useMockLoading";
import { CardGridSkeleton } from "./ui/Skeletons";
import { EmptyState, type EmptyStateSuggestion } from "./ui/EmptyState";
import { clients, formatCurrency, type Client } from "../data/mockData";
import {
  CART_PARAMS, autoSendText, cartPairs, cartStatus, cartValue, createCart, isOpen, productById, repFirstName,
  sendToRep, statusColor, statusLabel, toContext, useCartStore, type Cart, type CartContext, type CartCreator, type CartStatus,
} from "../data/cartStore";
import { toast } from "../lib/toast";

export type { CartContext, CartCreator } from "../data/cartStore";

interface CartsListPageProps {
  onOpenCart: (ctx: CartContext) => void;
  onNavigateClients?: () => void;
  selectedClient?: Client | null;
  onSelectClient?: (client: Client) => void;
  /** Depois de criar um carrinho, segue para o catálogo com ele como destino. */
  onCartCreated?: (ctx: CartContext) => void;
  viewerRole?: CartCreator;
  lockClient?: boolean;
}

const STATUS_FILTERS: { value: 'todos' | CartStatus; label: (rep: string) => string }[] = [
  { value: 'todos', label: () => 'Todos' },
  { value: 'rascunho', label: () => 'Rascunho' },
  { value: 'pronto', label: () => 'Pronto pra enviar' },
  { value: 'aguardando-rep', label: rep => `Aguardando ${repFirstName(rep)}` },
  { value: 'aguardando-voce', label: () => 'Aguardando você' },
  { value: 'aguardando-pagamento', label: () => 'Aguardando pagamento' },
];

const updatedLabel = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'Atualizado agora';
  if (h < 24) return `Atualizado há ${h}h`;
  const d = Math.floor(h / 24);
  return `Atualizado há ${d} ${d === 1 ? 'dia' : 'dias'}`;
};

/** Uma ação principal por status (BR-74). */
function primaryAction(cart: Cart, role: CartCreator): { label: string; kind: 'open' | 'send' } | null {
  const status = cartStatus(cart);
  if (role === 'rep') {
    if (status === 'aguardando-rep') return { label: 'Confirmar condições', kind: 'open' };
    return null;
  }
  switch (status) {
    case 'rascunho': return { label: 'Continuar montando', kind: 'open' };
    case 'pronto': return { label: 'Enviar pro representante', kind: 'send' };
    case 'aguardando-voce': return { label: 'Revisar e aprovar', kind: 'open' };
    case 'aguardando-pagamento': return { label: 'Ir para pagamento', kind: 'open' };
    default: return null;
  }
}

function CartCard({ cart, viewerRole, onOpen, isOther }: { cart: Cart; viewerRole: CartCreator; onOpen: () => void; isOther: boolean }) {
  const status = cartStatus(cart);
  const pairs = cartPairs(cart);
  const action = primaryAction(cart, viewerRole);
  const auto = autoSendText(cart);
  const last = cart.comments[cart.comments.length - 1];
  const full = pairs >= CART_PARAMS.minOrderPairs;
  return (
    <Card withBorder padding={0}>
      {/* FR-506: o cartão inteiro abre o detalhe; sem botão "Abrir" separado */}
      <UnstyledButton onClick={onOpen} className={classes.hoverable} p="md" display="block" aria-label={`Abrir carrinho ${cart.cartName}`}>
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
          <Box miw={0}>
            <Text fw={600} truncate>{cart.cartName}</Text>
            <Text size="sm" c="dimmed" truncate>
              {viewerRole === 'rep' ? cart.clientName : `Rep: ${cart.rep}`} · {updatedLabel(cart.updatedAt)}
            </Text>
          </Box>
          <Text className="mono" fw={700} flex="none">{formatCurrency(cartValue(cart))}</Text>
        </Group>
        <Group gap="xs" mt="xs">
          <Badge variant="light" color={statusColor[status]}>{statusLabel(status, cart.rep)}</Badge>
          {cart.createdBy === 'rep' && <Badge variant="light" color="neutral" leftSection={<UserCheckIcon size={14} />}>Montado por {repFirstName(cart.rep)}</Badge>}
          {isOther && <Badge variant="light" color="yellow" leftSection={<ArrowsLeftRightIcon size={14} />}>troca cliente</Badge>}
        </Group>
        {/* miniaturas dos produtos */}
        <Group gap={6} mt="sm">
          {cart.lines.slice(0, 5).map(l => {
            const p = productById(l.productId);
            return p ? <Image key={l.productId} src={p.image} alt={p.name} w={40} h={40} fit="contain" bg="white" radius="sm" style={{ border: '1px solid var(--mantine-color-default-border)' }} /> : null;
          })}
          {cart.lines.length > 5 && <Text size="sm" c="dimmed">+{cart.lines.length - 5}</Text>}
          {cart.lines.length === 0 && <Text size="sm" c="dimmed">Sem itens ainda</Text>}
        </Group>
        {/* progresso da grade mínima: passado o mínimo fica cheio e mostra o real */}
        <Box mt="sm">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">Grade mínima</Text>
            <Text size="sm" className="mono">{full ? `${pairs} pares · mínimo ${CART_PARAMS.minOrderPairs}` : `${pairs}/${CART_PARAMS.minOrderPairs} pares`}</Text>
          </Group>
          <Progress mt={4} value={Math.min(100, (pairs / CART_PARAMS.minOrderPairs) * 100)} color={full ? 'teal' : 'yellow'} aria-label="Progresso da grade mínima" />
          {cart.exception && <Text size="xs" c="dimmed" mt={4}>Exceção aprovada por {repFirstName(cart.exception.by)}</Text>}
        </Box>
        {auto && (
          <Group gap={4} mt="xs" wrap="nowrap"><ClockIcon size={16} /><Text size="sm">{auto}</Text></Group>
        )}
        {last && (
          <Group gap={6} mt="xs" wrap="nowrap" align="flex-start">
            <ChatCircleIcon size={16} style={{ flex: 'none', marginTop: 3 }} />
            <Text size="sm" c="dimmed" lineClamp={1}>{last.name === 'Você' ? 'Você' : repFirstName(last.name)}: {last.text}</Text>
          </Group>
        )}
      </UnstyledButton>
      {/* empurra a ação para a base: cartões da mesma linha alinham o botão */}
      <Box flex={1} />
      {action && (
        <>
          <Divider color="var(--mantine-color-default-border)" />
          <Group p="sm">
            <Button
              fullWidth
              variant={action.kind === 'send' || status === 'aguardando-voce' || status === 'aguardando-pagamento' ? 'filled' : 'default'}
              rightSection={action.kind === 'send' ? <PaperPlaneTiltIcon size={16} /> : <ArrowRightIcon size={16} />}
              onClick={() => {
                if (action.kind === 'send') {
                  if (sendToRep(cart.id)) toast.success(`"${cart.cartName}" enviado para ${repFirstName(cart.rep)}`, 'Você é avisado quando as condições forem confirmadas.');
                } else onOpen();
              }}
            >
              {action.label}
            </Button>
          </Group>
        </>
      )}
    </Card>
  );
}

// Meus carrinhos (M5): carrinhos compartilhados com o representante, um status e uma ação por cartão.
export function CartsListPage({ onOpenCart, onNavigateClients, selectedClient, onSelectClient, onCartCreated, viewerRole = 'rep', lockClient = false }: CartsListPageProps) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | CartStatus>('todos');
  const loading = useMockLoading();
  const { carts } = useCartStore();
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(true);
  const [showAll, setShowAll] = useState(!selectedClient);

  // FR-507: confirmados saem da lista (vão para Pedidos)
  const openCarts = carts.filter(isOpen);
  const scopedCarts = useMemo(() => {
    if (selectedClient && (lockClient || !showAll)) return openCarts.filter(c => c.clientId === selectedClient.id);
    return openCarts;
  }, [openCarts, selectedClient, showAll, lockClient]);
  const otherCarts = (selectedClient && !lockClient) ? openCarts.filter(c => c.clientId !== selectedClient.id) : [];
  const searched = scopedCarts.filter(c =>
    c.clientName.toLowerCase().includes(q.toLowerCase()) || c.cartName.toLowerCase().includes(q.toLowerCase()));
  const filtered = searched
    .filter(c => statusFilter === 'todos' || cartStatus(c) === statusFilter)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const count = (s: CartStatus) => scopedCarts.filter(c => cartStatus(c) === s).length;
  const waitingYou = scopedCarts.filter(c => cartStatus(c) === 'aguardando-voce');
  const ready = scopedCarts.filter(c => cartStatus(c) === 'pronto');
  const inProgressValue = scopedCarts.reduce((a, c) => a + cartValue(c), 0);
  const repName = selectedClient?.rep ?? clients[0].rep;

  const clientMatches = useMemo(() => {
    const t = clientQuery.trim().toLowerCase();
    if (!t) return [];
    return clients.filter(c => c.name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t)).slice(0, 6);
  }, [clientQuery]);

  const canCreate = !!selectedClient;
  const handleCreate = () => {
    if (!selectedClient) return;
    const cart = createCart({ clientId: selectedClient.id, name: newName, createdBy: viewerRole });
    setNewOpen(false);
    setNewName('');
    (onCartCreated ?? onOpenCart)(toContext(cart));
  };

  const kpis = [
    { label: 'Carrinhos abertos', value: String(scopedCarts.length) },
    { label: 'Aguardando você', value: String(waitingYou.length) },
    { label: 'Prontos pra enviar', value: String(ready.length) },
    { label: 'Valor em andamento', value: formatCurrency(inProgressValue) },
  ];

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* FR-501: carrinhos abertos, representante e "Criar novo carrinho" */}
      <Group justify="space-between" align="flex-start" gap="sm" mb="lg">
        <Box flex="1 1 260px" miw={0}>
          <Title order={1}>
            {lockClient ? 'Meus carrinhos' : selectedClient && !showAll ? `Carrinhos de ${selectedClient.name}` : 'Carrinhos em construção'}
          </Title>
          <Group gap="xs" mt={4}>
            <Text c="dimmed">{scopedCarts.length} {scopedCarts.length === 1 ? 'carrinho aberto' : 'carrinhos abertos'}</Text>
            {lockClient && (
              <Group gap={6}>
                <Avatar size={20} color="neutral" variant="light">{repFirstName(repName)[0]}</Avatar>
                <Text c="dimmed">Representante: {repName}</Text>
              </Group>
            )}
          </Group>
        </Box>
        {!newOpen && (
          <Box w={{ base: '100%', xs: 'auto' }}>
            <Button onClick={() => canCreate && setNewOpen(true)} disabled={!canCreate} leftSection={<PlusIcon size={16} />} w={{ base: '100%', xs: 'auto' }}>
              Criar novo carrinho
            </Button>
            {!canCreate && <Text c="dimmed" size="sm" mt={4}>Selecione um cliente para criar</Text>}
          </Box>
        )}
      </Group>

      {!lockClient && !selectedClient && (
        <Paper withBorder p="md" mb="lg" bg="var(--mantine-color-neutral-0)">
          <Group gap="sm" mb="sm" wrap="nowrap">
            <ThemeIcon variant="light" color="neutral" size={32}><UsersIcon size={16} /></ThemeIcon>
            <Box miw={0}>
              <Text fw={600}>Selecione um cliente para criar um carrinho</Text>
              <Text c="dimmed" size="sm">Busque pelo nome ou abra sua carteira de clientes.</Text>
            </Box>
          </Group>
          <Group gap="sm" align="stretch" wrap="wrap">
            <Popover opened={!!clientQuery && clientDropdownOpen} onClose={() => setClientDropdownOpen(false)} width="target" position="bottom-start" offset={4} shadow="md">
              <Popover.Target>
                <TextInput
                  value={clientQuery}
                  onChange={e => { setClientQuery(e.currentTarget.value); setClientDropdownOpen(true); }}
                  onFocus={() => setClientDropdownOpen(true)}
                  placeholder="Buscar cliente por nome ou código (ex.: CLI-001)"
                  leftSection={<MagnifyingGlassIcon size={16} />}
                  flex={{ base: '1 1 100%', sm: 1 }}
                  miw={{ sm: 220 }}
                />
              </Popover.Target>
              <Popover.Dropdown p={4}>
                {clientMatches.length > 0 ? clientMatches.map(c => (
                  <Paper key={c.id} component="button" type="button" onClick={() => { onSelectClient?.(c); setClientQuery(''); setNewOpen(true); }} className={`${classes.cardButton} ${classes.hoverable}`} bd="none" px="sm" py="sm">
                    <Group gap="xs" wrap="nowrap">
                      <StorefrontIcon size={16} color="var(--mantine-color-dimmed)" />
                      <Text>{c.name}</Text>
                      <Text c="dimmed" size="sm" ml="auto" className="mono">{c.id}</Text>
                    </Group>
                  </Paper>
                )) : (
                  <Text c="dimmed" size="sm" p="sm">Nenhum cliente encontrado. Confira o nome ou busque na carteira de clientes.</Text>
                )}
              </Popover.Dropdown>
            </Popover>
            {onNavigateClients && (
              <Button onClick={onNavigateClients} variant="default" w={{ base: '100%', sm: 'auto' }} leftSection={<UsersIcon size={16} />}>Buscar Clientes em Carteira</Button>
            )}
          </Group>
        </Paper>
      )}

      {!lockClient && selectedClient && (
        <SegmentedControl
          value={showAll ? 'all' : 'client'}
          onChange={v => setShowAll(v === 'all')}
          mb="md"
          w={{ base: '100%', xs: 'auto' }}
          data={[
            { value: 'client', label: 'Deste cliente' },
            { value: 'all', label: (
              <Group gap="xs" wrap="nowrap" justify="center">
                <ArrowsLeftRightIcon size={16} />Todos os clientes
                {otherCarts.length > 0 && <Badge variant="default">+{otherCarts.length}</Badge>}
              </Group>
            ) },
          ]}
        />
      )}

      {newOpen && selectedClient && (
        <Paper withBorder p="md" mb="lg">
          <Title order={2} mb={4}>Criar novo carrinho</Title>
          <Group gap="xs" mb="md" c="dimmed">
            <StorefrontIcon size={16} />
            <Text size="sm" c="dimmed">Cliente: <Text span fw={600} c="var(--mantine-color-text)" inherit>{selectedClient.name}</Text></Text>
          </Group>
          <TextInput label="Nome do carrinho" value={newName} onChange={e => setNewName(e.currentTarget.value)} placeholder="ex.: Coleção Inverno" maxLength={60} description="Até 60 caracteres" />
          {viewerRole === 'rep' && <Text size="sm" c="dimmed" mt="xs">Carrinho criado pelo representante começa como sugestão, em "Aguardando você", para o lojista revisar.</Text>}
          <Group justify="flex-end" gap="sm" mt="md">
            <Button onClick={() => setNewOpen(false)} variant="default">Cancelar</Button>
            <Button onClick={handleCreate}>Criar e adicionar produtos</Button>
          </Group>
        </Paper>
      )}

      {/* FR-502: KPIs (abertos não contam confirmados) */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="lg">
        {kpis.map(k => (
          <Paper key={k.label} withBorder p="md">
            <Text size="sm" c="dimmed">{k.label}</Text>
            <Text fz="xl" fw={700} className="mono">{k.value}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      {/* FR-503: avisos com os mesmos nomes de ação dos cartões */}
      {viewerRole === 'lojista' && waitingYou.length > 0 && (
        <Alert variant="light" color="yellow" mb="sm" icon={<ClockIcon size={18} />} title={`${waitingYou.length} ${waitingYou.length === 1 ? 'carrinho aguardando' : 'carrinhos aguardando'} você`}>
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Text size="sm">{repFirstName(repName)} montou ou editou {waitingYou.map(c => `"${c.cartName}"`).join(', ')}.</Text>
            <Button size="compact-md" variant="filled" color="yellow" onClick={() => onOpenCart(toContext(waitingYou[0]))}>Revisar e aprovar</Button>
          </Group>
        </Alert>
      )}
      {viewerRole === 'lojista' && ready.length > 0 && (
        <Alert variant="light" color="teal" mb="lg" icon={<PaperPlaneTiltIcon size={18} />} title={`${ready.length} ${ready.length === 1 ? 'carrinho pronto' : 'carrinhos prontos'} pra enviar`}>
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Text size="sm">Já passaram da grade mínima de {CART_PARAMS.minOrderPairs} pares.</Text>
            <Button size="compact-md" variant="filled" color="teal" onClick={() => {
              ready.forEach(c => sendToRep(c.id));
              toast.success(`${ready.length === 1 ? 'Carrinho enviado' : `${ready.length} carrinhos enviados`} para ${repFirstName(repName)}`, 'Você é avisado quando as condições forem confirmadas.');
            }}>
              Enviar pro representante
            </Button>
          </Group>
        </Alert>
      )}

      <Group gap="sm" mb="lg" align="flex-end" wrap="wrap">
        <TextInput value={q} onChange={e => setQ(e.currentTarget.value)} placeholder="Buscar por nome do cliente ou do carrinho" leftSection={<MagnifyingGlassIcon size={16} />} w={{ base: '100%', sm: 360 }} />
      </Group>
      {/* FR-504: filtros por status com contagem */}
      <Tabs value={statusFilter} onChange={v => v && setStatusFilter(v as typeof statusFilter)} variant="pills" mb="lg">
        <Tabs.List>
          {STATUS_FILTERS.map(f => {
            const n = f.value === 'todos' ? scopedCarts.length : count(f.value);
            return (
              <Tabs.Tab key={f.value} value={f.value} rightSection={<Badge size="sm" circle variant="light" color="neutral">{n}</Badge>}>
                {f.label(repName)}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs>

      {loading ? (
        <CardGridSkeleton count={6} cols={{ base: 1, sm: 2, lg: 3 }} imageRatio={6} />
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {filtered.map(c => (
              <CartCard key={c.id} cart={c} viewerRole={viewerRole} isOther={!!selectedClient && c.clientId !== selectedClient.id} onOpen={() => onOpenCart(toContext(c))} />
            ))}
          </SimpleGrid>

          {filtered.length === 0 && (() => {
            if (q) {
              return <EmptyState icon={MagnifyingGlassIcon} title="Nenhum carrinho encontrado" description={`Nada corresponde a "${q}". Confira o nome do cliente ou do carrinho, ou limpe a busca.`} action={{ label: 'Limpar Busca', onClick: () => setQ(''), forward: false }} />;
            }
            if (statusFilter !== 'todos') {
              return <EmptyState icon={ShoppingCartIcon} title="Nenhum carrinho neste status" description="Escolha outro status ou veja todos os carrinhos." action={{ label: 'Ver todos', onClick: () => setStatusFilter('todos'), forward: false }} />;
            }
            const suggestions: EmptyStateSuggestion[] = [];
            if (!lockClient && selectedClient && !showAll && otherCarts.length > 0) {
              suggestions.push({ label: 'Ver carrinhos de outros clientes', description: `${otherCarts.length} carrinho(s) em construção na sua carteira`, icon: ArrowsLeftRightIcon, onClick: () => setShowAll(true) });
            }
            return (
              <EmptyState
                icon={ShoppingCartIcon}
                title="Nenhum carrinho em aberto"
                description={canCreate ? 'Crie um carrinho para começar um pedido. Pedidos confirmados ficam em Pedidos.' : 'Selecione um cliente acima para criar o primeiro carrinho.'}
                secondaryAction={canCreate && !newOpen ? { label: 'Criar novo carrinho', onClick: () => setNewOpen(true), forward: false } : undefined}
                suggestions={suggestions}
              />
            );
          })()}
        </>
      )}
    </Box>
  );
}
