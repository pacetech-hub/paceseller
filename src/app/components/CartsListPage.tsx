import { useMemo, useState } from "react";
import {
  Anchor, Avatar, Badge, Box, Button, Group, Image, Paper, Popover, SegmentedControl, Stack, Text, TextInput, ThemeIcon, Title, UnstyledButton,
} from "@mantine/core";
import {
  ArrowsLeftRightIcon, CaretRightIcon, ClockIcon, MagnifyingGlassIcon, PaperPlaneTiltIcon, PlusIcon, ShoppingCartIcon,
  SneakerIcon, StorefrontIcon, UserIcon, UsersIcon,
} from "@phosphor-icons/react";
import classes from "./interactive.module.css";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState, type EmptyStateSuggestion } from "./ui/EmptyState";
import { clients, formatCurrency, type Client } from "../data/mockData";
import {
  CART_PARAMS, autoSendText, cartPairs, cartStatus, cartValue, createCart, daysInStage, isOpen, isShared, productById, repFirstName,
  sendToRep, setSharedWithClient, visibleTo, clientContact, statusColorFor, statusLabelFor, toContext, useCartStore, type Cart, type CartContext, type CartCreator,
} from "../data/cartStore";
import { REP_RADAR_PARAMS } from "../data/repRadar";
import { toast } from "../lib/toast";

export type { CartContext, CartCreator } from "../data/cartStore";

interface CartsListPageProps {
  onOpenCart: (ctx: CartContext) => void;
  onNavigateClients?: () => void;
  selectedClient?: Client | null;
  onSelectClient?: (client: Client) => void;
  /** Depois de criar um carrinho, segue para o catálogo com ele como destino. */
  onCartCreated?: (ctx: CartContext) => void;
  /** "Ver enviados": pedidos que já saíram dos carrinhos. */
  onViewSent?: () => void;
  /** Caminho "Radar / loja" (representante). */
  onBackToRadar?: () => void;
  viewerRole?: CartCreator;
  lockClient?: boolean;
}

const updatedLabel = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'Atualizado agora';
  if (h < 24) return `Atualizado há ${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Atualizado ontem' : `Atualizado há ${d} dias`;
};
const minutesAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `há ${Math.max(1, m)} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
};
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
const days = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

/** Uma ação principal por status (BR-74). */
function primaryAction(cart: Cart, role: CartCreator): { label: string; kind: 'open' | 'send' | 'share' } | null {
  const status = cartStatus(cart);
  if (role === 'rep') {
    if (cart.createdBy === 'rep' && cart.stage === 'montagem') {
      return cart.lines.length > 0 ? { label: 'Compartilhar com a loja', kind: 'share' } : { label: 'Adicionar produtos', kind: 'open' };
    }
    if (status === 'aguardando-rep') return { label: 'Confirmar condições', kind: 'open' };
    if (status === 'aguardando-voce') return { label: 'Acompanhar', kind: 'open' };
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

/** Aviso de carrinho parado, do ponto de vista de quem olha. */
function staleText(cart: Cart, role: CartCreator): string | null {
  const status = cartStatus(cart);
  const d = daysInStage(cart);
  if (status === 'aguardando-voce' && d >= REP_RADAR_PARAMS.lojistaNudgeDays) {
    return role === 'rep' ? `Parado há ${days(d)} — considere revisar` : `${repFirstName(cart.rep)} espera sua revisão há ${days(d)}`;
  }
  if (status === 'aguardando-rep' && d >= REP_RADAR_PARAMS.repResponseDays) {
    return role === 'rep' ? `O cliente espera você há ${days(d)}` : `Enviado há ${days(d)} — ${repFirstName(cart.rep)} ainda não confirmou`;
  }
  return null;
}

/** Linha do carrinho: ícone na cor do status, nome e status, grade mínima, valor e a ação. */
function CartRow({ cart, viewerRole, onOpen, showClient }: { cart: Cart; viewerRole: CartCreator; onOpen: () => void; showClient: boolean }) {
  const status = cartStatus(cart);
  const pairs = cartPairs(cart);
  const full = pairs >= CART_PARAMS.minOrderPairs;
  const color = statusColorFor(status, viewerRole);
  const action = primaryAction(cart, viewerRole);
  const stale = staleText(cart, viewerRole);
  const auto = autoSendText(cart);
  const last = cart.comments[cart.comments.length - 1];
  const mine = cart.createdBy === viewerRole;

  const runAction = () => {
    if (action?.kind === 'share') {
      if (setSharedWithClient(cart.id, true)) toast.success(`"${cart.cartName}" compartilhado com ${clientContact(cart.clientId, cart.clientName)}`, 'A loja já pode ver, comentar e aprovar.');
    } else if (action?.kind === 'send') {
      if (sendToRep(cart.id)) toast.success(`"${cart.cartName}" enviado para ${repFirstName(cart.rep)}`, 'Você é avisado quando as condições forem confirmadas.');
    } else onOpen();
  };

  return (
    <Paper withBorder>
      {/* a linha inteira abre o carrinho; o nome é o link de teclado; a ação é um botão à parte */}
      <Box onClick={onOpen} className={classes.hoverable} p={{ base: 'sm', sm: 'md' }} style={{ cursor: 'pointer' }}>
        <Group gap="md" wrap="nowrap" align="flex-start">
          <ThemeIcon size={36} radius="md" variant="light" color={color} aria-hidden style={{ flex: 'none' }}>
            <ShoppingCartIcon size={18} />
          </ThemeIcon>

          <Box flex={1} miw={0}>
            <Group gap="xs" wrap="wrap" justify="space-between" align="flex-start">
              <Box miw={0}>
                <Group gap="xs" wrap="wrap">
                  <UnstyledButton onClick={e => { e.stopPropagation(); onOpen(); }} aria-label={`Abrir carrinho ${cart.cartName}`}>
                    <Text fw={700}>{cart.cartName}</Text>
                  </UnstyledButton>
                  <Badge variant="light" color={color} radius="sm" styles={{ label: { textTransform: 'none' } }}>{statusLabelFor(status, cart, viewerRole)}</Badge>
                </Group>
                <Text size="sm" c="dimmed" mt={2}>
                  {showClient ? `${cart.clientName} · ` : ''}
                  {viewerRole === 'rep' ? (mine ? 'Montado por você' : 'Montado pelo lojista') : `Representante: ${repFirstName(cart.rep)}`}
                  {' · '}{updatedLabel(cart.updatedAt)}
                </Text>
              </Box>

              {/* grade mínima, valor e a ação */}
              <Group gap="lg" wrap="nowrap" visibleFrom="sm">
                <Group gap={8} wrap="nowrap" w={110}>
                  <Box w={52} h={4} bg="var(--mantine-color-default-border)" style={{ borderRadius: 2, overflow: 'hidden' }} aria-hidden>
                    <Box h="100%" w={`${Math.min(100, (pairs / CART_PARAMS.minOrderPairs) * 100)}%`} bg={full ? 'teal.7' : 'brand.9'} />
                  </Box>
                  <Text fz={12} ff="monospace" c="dimmed" aria-label={`${pairs} de ${CART_PARAMS.minOrderPairs} pares da grade mínima`}>{pairs}/{CART_PARAMS.minOrderPairs}</Text>
                </Group>
                <Text className="mono" fw={700} w={110} ta="right">{formatCurrency(cartValue(cart))}</Text>
                <Box w={170} ta="right">
                  {action && (
                    <Anchor component="button" type="button" fw={600} size="sm" onClick={e => { e.stopPropagation(); runAction(); }}>
                      {action.label}
                    </Anchor>
                  )}
                </Box>
                <CaretRightIcon size={16} color="var(--mantine-color-dimmed)" />
              </Group>
            </Group>

            {/* no celular, grade mínima e valor numa linha própria */}
            <Group gap="md" mt={6} hiddenFrom="sm">
              <Text fz={12} ff="monospace" c="dimmed">{pairs}/{CART_PARAMS.minOrderPairs} pares</Text>
              <Text className="mono" fw={700}>{formatCurrency(cartValue(cart))}</Text>
            </Group>

            {/* miniaturas dos produtos */}
            <Group gap={6} mt="sm">
              {cart.lines.slice(0, 6).map(l => {
                const p = productById(l.productId);
                if (!p) return null;
                return (
                  <Box key={l.productId} w={32} h={32} bg="white" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-sm)', overflow: 'hidden' }}>
                    <Image src={p.image} alt={p.name} w={30} h={30} fit="contain" fallbackSrc="" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </Box>
                );
              })}
              {cart.lines.length > 6 && <Text size="sm" c="dimmed">+{cart.lines.length - 6}</Text>}
              {cart.lines.length === 0 && (
                <Group gap={6} c="dimmed"><SneakerIcon size={16} /><Text size="sm" c="dimmed">Sem itens ainda</Text></Group>
              )}
            </Group>

            {stale && <Text size="sm" c="red.7" mt="sm">{stale}</Text>}
            {auto && <Group gap={4} mt="xs" wrap="nowrap"><ClockIcon size={16} /><Text size="sm">{auto}</Text></Group>}

            {/* última conversa */}
            {last ? (
              <Group gap={8} mt="sm" wrap="nowrap" align="flex-start">
                <Avatar size={20} radius="xl" color="brand" variant="filled" fz={9}>{last.name === 'Você' ? 'EU' : initials(last.name)}</Avatar>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  <Text span inherit fw={600} c="var(--mantine-color-text)">{last.name === 'Você' ? 'Você' : repFirstName(last.name)}:</Text> {last.text}
                  <Text span inherit c="dimmed"> · {minutesAgo(last.at)}</Text>
                </Text>
              </Group>
            ) : viewerRole === 'rep' && mine && !isShared(cart) ? (
              <Group gap={8} mt="sm" wrap="nowrap">
                <Avatar size={20} radius="xl" color="gray" variant="light"><UserIcon size={11} /></Avatar>
                <Text size="sm" c="dimmed">Só você vê este rascunho — a loja vê quando você compartilhar.</Text>
              </Group>
            ) : mine && isShared(cart) && (
              <Group gap={8} mt="sm" wrap="nowrap">
                <Avatar size={20} radius="xl" color="brand" variant="filled"><UserIcon size={11} /></Avatar>
                <Text size="sm" c="dimmed"><Text span inherit fw={600} c="var(--mantine-color-text)">Você</Text> montou esse pedido — aguardando {viewerRole === 'rep' ? 'o lojista' : repFirstName(cart.rep)} revisar.</Text>
              </Group>
            )}

            {action && (
              <Button hiddenFrom="sm" mt="sm" size="compact-md" variant="default" onClick={e => { e.stopPropagation(); runAction(); }}
                rightSection={action.kind !== 'open' ? <PaperPlaneTiltIcon size={14} /> : <CaretRightIcon size={14} />}>
                {action.label}
              </Button>
            )}
          </Box>
        </Group>
      </Box>
    </Paper>
  );
}

function Section({ title, carts, viewerRole, onOpenCart, showClient }: {
  title: string; carts: Cart[]; viewerRole: CartCreator; onOpenCart: (ctx: CartContext) => void; showClient: boolean;
}) {
  if (carts.length === 0) return null;
  return (
    <Box>
      <Group gap="xs" mb="sm">
        <Title order={2} size="h4">{title}</Title>
        <Badge variant="default" radius="xl" size="sm">{carts.length}</Badge>
      </Group>
      <Stack gap="sm">
        {carts.map(c => <CartRow key={c.id} cart={c} viewerRole={viewerRole} showClient={showClient} onOpen={() => onOpenCart(toContext(c))} />)}
      </Stack>
    </Box>
  );
}

/** Aviso em destaque no topo (um por situação), com a ação daquela situação. */
function Notice({ children, action, onAction }: { children: React.ReactNode; action: string; onAction: () => void }) {
  return (
    <Paper p="sm" bg="var(--mantine-color-blue-light)" style={{ border: '1px solid var(--mantine-color-blue-4)' }}>
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="nowrap" miw={0}>
          <ThemeIcon radius="xl" size={28} color="blue" aria-hidden><UserIcon size={14} /></ThemeIcon>
          <Text size="sm">{children}</Text>
        </Group>
        <Button size="compact-md" variant="outline" color="blue" bg="var(--mantine-color-body)" onClick={onAction}>{action}</Button>
      </Group>
    </Paper>
  );
}

// Meus carrinhos (M5): os carrinhos da loja em duas seções — compartilhados e não compartilhados.
export function CartsListPage({
  onOpenCart, onNavigateClients, selectedClient, onSelectClient, onCartCreated, onViewSent, onBackToRadar, viewerRole = 'rep', lockClient = false,
}: CartsListPageProps) {
  const loading = useMockLoading();
  const { carts } = useCartStore();
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(true);
  const [showAll, setShowAll] = useState(!selectedClient);

  // FR-507: confirmados saem da lista (vão para Pedidos)
  const openCarts = carts.filter(c => isOpen(c) && visibleTo(c, viewerRole));
  const byClient = !!selectedClient && (lockClient || !showAll);
  const scoped = useMemo(
    () => (byClient ? openCarts.filter(c => c.clientId === selectedClient!.id) : openCarts).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [openCarts, selectedClient, byClient],
  );
  const otherCarts = selectedClient && !lockClient ? openCarts.filter(c => c.clientId !== selectedClient.id) : [];
  const shared = scoped.filter(isShared);
  const notShared = scoped.filter(c => !isShared(c));
  const inProgress = scoped.reduce((a, c) => a + cartValue(c), 0);
  const repName = selectedClient?.rep ?? clients[0].rep;

  // avisos do topo, do ponto de vista de quem olha
  const waitingClient = scoped.filter(c => cartStatus(c) === 'aguardando-voce').sort((a, b) => a.stageSince.localeCompare(b.stageSince));
  const waitingRep = scoped.filter(c => cartStatus(c) === 'aguardando-rep');
  const ready = scoped.filter(c => cartStatus(c) === 'pronto');

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

  const title = lockClient ? 'Meus carrinhos' : byClient ? `Carrinhos de ${selectedClient!.name}` : 'Carrinhos da carteira';

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <Stack gap="lg">
        {/* BR-72: caminho a partir do Radar (representante) */}
        {!lockClient && onBackToRadar && (
          <Group gap={8} component="nav" aria-label="Caminho">
            <Anchor component="button" type="button" size="sm" onClick={onBackToRadar}>Radar</Anchor>
            <Text size="sm" c="dimmed" aria-hidden>/</Text>
            <Text size="sm" fw={600} aria-current="page">{byClient ? selectedClient!.name : 'Carrinhos'}</Text>
          </Group>
        )}

        {/* FR-501: título, contagem, valor em andamento e as ações */}
        <Group justify="space-between" align="flex-start" gap="sm">
          <Box flex="1 1 260px" miw={0}>
            <Title order={1}>{title}</Title>
            <Text c="dimmed" mt={4}>
              {scoped.length} {scoped.length === 1 ? 'carrinho aberto' : 'carrinhos abertos'}{byClient ? ' nessa loja' : ''}
              {' · '}Em andamento: <Text span inherit className="mono">{formatCurrency(inProgress)}</Text>
            </Text>
          </Box>
          <Group gap="sm" w={{ base: '100%', xs: 'auto' }} wrap="wrap">
            {onViewSent && <Button variant="default" onClick={onViewSent} w={{ base: '100%', xs: 'auto' }}>Ver enviados</Button>}
            <Button onClick={() => canCreate && setNewOpen(true)} disabled={!canCreate || newOpen} leftSection={<PlusIcon size={16} />} w={{ base: '100%', xs: 'auto' }}>
              Criar novo carrinho
            </Button>
          </Group>
        </Group>

        {/* Representante sem loja escolhida: buscar a loja */}
        {!lockClient && !selectedClient && (
          <Paper withBorder p="md">
            <Group gap="sm" mb="sm" wrap="nowrap">
              <ThemeIcon variant="light" color="brand" size={32}><UsersIcon size={16} /></ThemeIcon>
              <Box miw={0}>
                <Text fw={600}>Selecione uma loja para criar um carrinho</Text>
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
                    placeholder="Buscar loja por nome ou código (ex.: CLI-001)"
                    leftSection={<MagnifyingGlassIcon size={16} />}
                    flex={{ base: '1 1 100%', sm: 1 }}
                    miw={{ sm: 220 }}
                  />
                </Popover.Target>
                <Popover.Dropdown p={4}>
                  {clientMatches.length > 0 ? clientMatches.map(c => (
                    <Paper key={c.id} component="button" type="button" onClick={() => { onSelectClient?.(c); setClientQuery(''); setShowAll(false); }} className={`${classes.cardButton} ${classes.hoverable}`} bd="none" px="sm" py="sm">
                      <Group gap="xs" wrap="nowrap">
                        <StorefrontIcon size={16} color="var(--mantine-color-dimmed)" />
                        <Text>{c.name}</Text>
                        <Text c="dimmed" size="sm" ml="auto" className="mono">{c.id}</Text>
                      </Group>
                    </Paper>
                  )) : (
                    <Text c="dimmed" size="sm" p="sm">Nenhuma loja encontrada. Confira o nome ou busque na carteira de clientes.</Text>
                  )}
                </Popover.Dropdown>
              </Popover>
              {onNavigateClients && (
                <Button onClick={onNavigateClients} variant="default" w={{ base: '100%', sm: 'auto' }} leftSection={<UsersIcon size={16} />}>Buscar na carteira</Button>
              )}
            </Group>
          </Paper>
        )}

        {!lockClient && selectedClient && (
          <SegmentedControl
            value={showAll ? 'all' : 'client'}
            onChange={v => setShowAll(v === 'all')}
            w={{ base: '100%', xs: 'auto' }}
            style={{ alignSelf: 'flex-start' }}
            data={[
              { value: 'client', label: 'Desta loja' },
              { value: 'all', label: (
                <Group gap="xs" wrap="nowrap" justify="center">
                  <ArrowsLeftRightIcon size={16} />Toda a carteira
                  {otherCarts.length > 0 && <Badge variant="default">+{otherCarts.length}</Badge>}
                </Group>
              ) },
            ]}
          />
        )}

        {newOpen && selectedClient && (
          <Paper withBorder p="md" maw={960}>
            <Title order={2} size="h4" mb={4}>Criar novo carrinho</Title>
            <Group gap="xs" mb="md">
              <StorefrontIcon size={16} />
              <Text size="sm" c="dimmed">Loja: <Text span fw={600} c="var(--mantine-color-text)" inherit>{selectedClient.name}</Text></Text>
            </Group>
            <TextInput label="Nome do carrinho" value={newName} onChange={e => setNewName(e.currentTarget.value)} placeholder="ex.: Coleção Inverno" maxLength={60} description="Até 60 caracteres" data-autofocus />
            {viewerRole === 'rep' && <Text size="sm" c="dimmed" mt="xs">O carrinho começa como seu rascunho — só você vê. Quando estiver pronto, compartilhe com a loja para o lojista revisar e aprovar.</Text>}
            <Group justify="flex-end" gap="sm" mt="md">
              <Button onClick={() => setNewOpen(false)} variant="default">Cancelar</Button>
              <Button onClick={handleCreate}>Criar e adicionar produtos</Button>
            </Group>
          </Paper>
        )}

        {/* FR-503: avisos com os mesmos nomes de ação das linhas */}
        {viewerRole === 'rep' && waitingRep.length > 0 && (
          <Notice action={waitingRep.length === 1 ? 'Revisar pedido' : 'Revisar o primeiro'} onAction={() => onOpenCart(toContext(waitingRep[0]))}>
            <Text span inherit fw={700}>{waitingRep.length === 1 ? '1 pedido espera' : `${waitingRep.length} pedidos esperam`} suas condições</Text>
            {' — '}{waitingRep.map(c => `"${c.cartName}"`).join(', ')}
          </Notice>
        )}
        {viewerRole === 'rep' && waitingClient.length > 0 && (
          <Notice action="Ver carrinho" onAction={() => onOpenCart(toContext(waitingClient[0]))}>
            <Text span inherit fw={700}>Você sugeriu {waitingClient.length === 1 ? '1 pedido novo' : `${waitingClient.length} pedidos novos`}</Text>
            {' — '}{waitingClient[0].cartName}, parado há {days(daysInStage(waitingClient[0]))} esperando revisão do lojista
          </Notice>
        )}
        {viewerRole === 'lojista' && waitingClient.length > 0 && (
          <Notice action="Revisar e aprovar" onAction={() => onOpenCart(toContext(waitingClient[0]))}>
            <Text span inherit fw={700}>{repFirstName(repName)} sugeriu {waitingClient.length === 1 ? '1 pedido' : `${waitingClient.length} pedidos`}</Text>
            {' — '}{waitingClient[0].cartName}, esperando sua revisão há {days(daysInStage(waitingClient[0]))}
          </Notice>
        )}
        {viewerRole === 'lojista' && ready.length > 0 && (
          <Notice
            action="Enviar pro representante"
            onAction={() => {
              ready.forEach(c => sendToRep(c.id));
              toast.success(`${ready.length === 1 ? 'Carrinho enviado' : `${ready.length} carrinhos enviados`} para ${repFirstName(repName)}`, 'Você é avisado quando as condições forem confirmadas.');
            }}
          >
            <Text span inherit fw={700}>{ready.length === 1 ? '1 carrinho pronto' : `${ready.length} carrinhos prontos`} pra enviar</Text>
            {' — '}já {ready.length === 1 ? 'passou' : 'passaram'} da grade mínima de {CART_PARAMS.minOrderPairs} pares
          </Notice>
        )}

        {loading ? (
          <Box maw={960}><ListSkeleton rows={3} withAvatar /></Box>
        ) : scoped.length === 0 ? (
          (() => {
            const suggestions: EmptyStateSuggestion[] = [];
            if (!lockClient && byClient && otherCarts.length > 0) {
              suggestions.push({ label: 'Ver carrinhos da carteira', description: `${otherCarts.length} carrinho(s) em outras lojas`, icon: ArrowsLeftRightIcon, onClick: () => setShowAll(true) });
            }
            return (
              <EmptyState
                icon={ShoppingCartIcon}
                title="Nenhum carrinho em aberto"
                description={canCreate ? 'Crie um carrinho para começar um pedido. Pedidos confirmados ficam em Pedidos.' : 'Selecione uma loja acima para criar o primeiro carrinho.'}
                secondaryAction={canCreate && !newOpen ? { label: 'Criar novo carrinho', onClick: () => setNewOpen(true), forward: false } : undefined}
                suggestions={suggestions}
              />
            );
          })()
        ) : (
          <Stack gap="xl" maw={960}>
            <Section title="Compartilhados" carts={shared} viewerRole={viewerRole} onOpenCart={onOpenCart} showClient={!byClient} />
            <Section title="Não compartilhados" carts={notShared} viewerRole={viewerRole} onOpenCart={onOpenCart} showClient={!byClient} />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
