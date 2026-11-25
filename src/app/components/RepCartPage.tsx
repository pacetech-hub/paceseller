import { useState } from "react";
import {
  ActionIcon, Anchor, Avatar, Badge, Box, Button, Divider, Grid, Group, Modal, Paper, Stack, Switch, Text, TextInput, Textarea,
  Title, UnstyledButton,
} from "@mantine/core";
import {
  ArrowLeftIcon, ChatCircleIcon, CheckIcon, ClockCounterClockwiseIcon, PencilSimpleIcon, PlusIcon, ShareNetworkIcon,
  ShoppingCartIcon,
} from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import {
  CART_PARAMS, approveMinimumException, cartPairs, cartStatus, cartValue, clientContact, createCart, getCart, isEditableBy,
  isOpen, isRepPrivateDraft, productById, renameCart, repConfirmConditions, repFirstName, setSharedWithClient, statusColorFor,
  statusLabelFor, toContext, useCartStore, type CartContext,
} from "../data/cartStore";
import { belowLastYear, cartMarginPct, mixCheck, pairsText, productDisplayName, useRadar } from "../data/radar";
import { useShop } from "../lib/shop";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import { LineItem } from "./CartPage";
import { CartEditDrawer } from "./CartEditDrawer";
import { Eyebrow, initials, timeAgo } from "./CartParts";
import classes from "./CartPage.module.css";

// Carrinho visto pelo representante: o pedido (linhas, subtotal, status e uma ação principal) e, na
// lateral, o carrinho em números, com quem está compartilhado e os atalhos. Mesmo desenho do
// carrinho do lojista: a edição acontece na gaveta e a conversa tem página própria ("Falar com").

type View = 'radar' | 'catalog' | 'carts' | 'history';

interface RepCartPageProps {
  onNavigate: (view: View) => void;
  cartContext?: CartContext | null;
  onSwitchCart: (ctx: CartContext) => void;
  onOpenChat: () => void;
}

export function RepCartPage({ onNavigate, cartContext, onSwitchCart, onOpenChat }: RepCartPageProps) {
  const { carts } = useCartStore();
  const radar = useRadar();
  const { openGrade, actorName } = useShop();
  const loading = useMockLoading();
  const cart = getCart(cartContext?.id) ?? null;
  const [editing, setEditing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  if (!cart || !isOpen(cart)) {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={900} mx="auto" w="100%">
        <EmptyState
          icon={ShoppingCartIcon}
          title={cart ? 'Este carrinho já virou pedido' : 'Nenhum carrinho aberto'}
          description={cart ? 'Carrinhos confirmados ficam em Pedidos.' : 'Escolha um carrinho em Carrinhos ou crie um novo para a loja.'}
          action={cart ? { label: 'Acompanhar em Pedidos', onClick: () => onNavigate('history') } : { label: 'Ir para Carrinhos', onClick: () => onNavigate('carts') }}
        />
      </Box>
    );
  }

  const status = cartStatus(cart);
  const pairs = cartPairs(cart);
  const subtotal = cartValue(cart);
  const margin = cartMarginPct(cart.lines);
  const editable = isEditableBy(cart, 'rep');
  const ownCart = cart.createdBy === 'rep';
  const privateDraft = isRepPrivateDraft(cart);
  const contact = clientContact(cart.clientId, cart.clientName);
  const contactFirst = repFirstName(contact);
  const siblings = carts.filter(c => c.clientId === cart.clientId && isOpen(c) && c.id !== cart.id);
  const lastYear = belowLastYear(cart);
  const mix = mixCheck(cart, radar);
  const lastMessage = [...cart.comments].reverse().find(c => c.kind !== 'system');
  // compartilhar só vale para o rascunho do representante, e só desfaz enquanto a loja não respondeu
  const canToggleShare = ownCart && (cart.stage === 'montagem' || cart.stage === 'aguardando-voce');

  const share = () => {
    if (cart.lines.length === 0) { toast.error('Carrinho vazio', 'Adicione produtos antes de compartilhar com a loja.'); return; }
    if (setSharedWithClient(cart.id, true, actorName)) toast.success(`Compartilhado com ${contactFirst}`, `${cart.clientName} já pode ver, comentar e aprovar.`);
  };
  const unshare = () => {
    if (setSharedWithClient(cart.id, false, actorName)) toast.success('Voltou a ser só seu', 'A loja deixa de ver este carrinho até você compartilhar de novo.');
  };

  // Uma ação principal por status (FR-603 / BR-74), do ponto de vista do representante
  const primary = (() => {
    if (privateDraft) {
      return cart.lines.length > 0
        ? { label: `Compartilhar com ${contactFirst}`, icon: ShareNetworkIcon, run: share }
        : { label: 'Adicionar produtos', icon: PlusIcon, run: () => onNavigate('catalog') };
    }
    if (status === 'aguardando-rep') {
      return {
        label: 'Confirmar condições', icon: CheckIcon,
        run: () => { if (repConfirmConditions(cart.id)) toast.success('Condições confirmadas', 'O lojista já pode seguir para o pagamento.'); },
      };
    }
    return null;
  })();

  const waitingText = (() => {
    if (privateDraft) return 'Só você vê este rascunho';
    switch (status) {
      case 'aguardando-rep': return 'O cliente espera suas condições';
      case 'aguardando-voce': return `Aguardando ${contactFirst} revisar`;
      case 'aguardando-pagamento': return `Aguardando ${cart.clientName} pagar`;
      case 'pronto': return 'O lojista ainda não enviou';
      default: return 'O lojista está montando';
    }
  })();

  const shareText = privateDraft
    ? `Só você vê este carrinho. Compartilhe com ${contact} quando estiver pronto — a loja revisa e aprova.`
    : cart.stage === 'montagem'
      ? `Rascunho de ${contact}: a loja ainda não enviou para você.`
      : `Compartilhado com ${contact} — ${ownCart ? 'já pode ver e decidir' : 'vocês acompanham este pedido juntos'}.`;

  const newCart = () => onSwitchCart(toContext(createCart({ clientId: cart.clientId, createdBy: 'rep' })));

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* BR-72: caminho até o carrinho */}
      <Group gap={8} component="nav" aria-label="Caminho" mb="lg">
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('radar')}>Radar</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('carts')}>{cart.clientName}</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Text size="sm" fw={600} aria-current="page">{cart.cartName}</Text>
      </Group>

      <Grid gutter={{ base: 'lg', lg: 40 }}>
        <Grid.Col span={{ base: 12, lg: 8, xl: 9 }}>
          <Stack gap="md">
            {/* FR-603/604/605: o pedido — condição e prazo, linhas, subtotal, status e uma ação principal */}
            <Paper withBorder style={{ overflow: 'hidden' }}>
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm" px={{ base: 'md', sm: 'lg' }} py="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Box miw={0}>
                  <Text fw={700}>Pedido</Text>
                  <Text fz={12} ff="monospace" c="dimmed" mt={2}>
                    {status === 'aguardando-pagamento' ? `30/60/90 dias ou à vista com ${CART_PARAMS.cashDiscountPct}%` : '30/60/90 dias'} · {CART_PARAMS.leadTimeLabel}
                  </Text>
                </Box>
                <Group gap="md" wrap="wrap">
                  {editable && cart.lines.length > 0 && (
                    <Anchor component="button" type="button" size="sm" fw={600} onClick={() => setEditing(true)}>Editar no drawer</Anchor>
                  )}
                  {!privateDraft && (
                    <Anchor component="button" type="button" size="sm" fw={600} onClick={onOpenChat}>Falar com {contact}</Anchor>
                  )}
                  <Badge variant="light" color={statusColorFor(status, 'rep')} radius="sm" ff="monospace" styles={{ label: { textTransform: 'none', fontWeight: 500 } }}>
                    {statusLabelFor(status, cart, 'rep')}
                  </Badge>
                </Group>
              </Group>

              <Box px={{ base: 'sm', sm: 'lg' }} py="md" bg="var(--mantine-color-default-hover)">
                {loading ? (
                  <ListSkeleton rows={Math.max(1, cart.lines.length)} />
                ) : cart.lines.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCartIcon}
                    title="Carrinho vazio"
                    description={`Adicione produtos pelo Catálogo para montar o pedido de ${cart.clientName}. Cada produto entra pela grade de numeração.`}
                    action={editable ? { label: 'Ir para o Catálogo', onClick: () => onNavigate('catalog') } : undefined}
                  />
                ) : (
                  <Stack gap="xs">
                    {cart.lines.map(l => <LineItem key={l.productId} cart={cart} productId={l.productId} sizes={l.sizes} editable={false} />)}
                  </Stack>
                )}
              </Box>

              {cart.lines.length > 0 && (
                <Group justify="space-between" align="center" wrap="wrap" gap="sm" px={{ base: 'md', sm: 'lg' }} py="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                  <Box>
                    <Text className="mono" fw={700}>Subtotal: {formatCurrency(subtotal)}</Text>
                    {margin !== null && <Text size="xs" c="dimmed">Margem da loja {margin}% no PDV sugerido · custo da loja, sem impostos e sem frete</Text>}
                  </Box>
                  <Group gap="md" wrap="wrap" justify="flex-end">
                    <Text size="sm" c="dimmed">{waitingText}</Text>
                    {primary && (
                      <Button size="lg" onClick={primary.run} leftSection={<primary.icon size={16} />}>{primary.label}</Button>
                    )}
                  </Group>
                </Group>
              )}

              {/* BR-23/24: grade mínima — verde quando atingida; abaixo dela só segue com exceção do representante */}
              {cart.lines.length > 0 && (
                pairs >= CART_PARAMS.minOrderPairs || cart.exception ? (
                  <Box px={{ base: 'md', sm: 'lg' }} py={8} bg="var(--mantine-color-teal-light)">
                    <Text fz={12} ff="monospace" c="teal.8">
                      ✓ {pairs} pares — {cart.exception ? `exceção aprovada por ${repFirstName(cart.exception.by)}` : 'grade mínima atingida'}
                    </Text>
                  </Box>
                ) : (
                  <Group justify="space-between" wrap="wrap" gap="xs" px={{ base: 'md', sm: 'lg' }} py={8} bg="var(--mantine-color-yellow-light)">
                    <Text fz={12} ff="monospace" c="yellow.9">
                      {pairs}/{CART_PARAMS.minOrderPairs} pares — faltam {CART_PARAMS.minOrderPairs - pairs} para a grade mínima; abaixo dela o pedido não pode ser enviado nem confirmado
                    </Text>
                    <Anchor component="button" type="button" size="xs" fw={600} onClick={() => setExceptionOpen(true)}>Aprovar exceção</Anchor>
                  </Group>
                )
              )}
            </Paper>

            {/* Última mensagem da conversa, com o atalho para a página "Falar com" */}
            {!privateDraft && (
              <Paper withBorder px={{ base: 'md', sm: 'lg' }} py="sm">
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <Group gap="sm" wrap="nowrap" miw={0}>
                    <ChatCircleIcon size={18} style={{ flex: 'none' }} />
                    {lastMessage ? (
                      <Text size="sm" lineClamp={1}>
                        <Text span fw={600} inherit>{lastMessage.author === 'rep' ? 'Você' : contactFirst}:</Text> {lastMessage.text}
                        <Text span c="dimmed" inherit> · {timeAgo(lastMessage.at)}</Text>
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">Nenhuma mensagem com {contactFirst} sobre este carrinho ainda.</Text>
                    )}
                  </Group>
                  <Anchor component="button" type="button" size="sm" fw={600} onClick={onOpenChat} flex="none">
                    {lastMessage ? 'Abrir conversa' : 'Escrever'}
                  </Anchor>
                </Group>
              </Paper>
            )}

            {/* FR-606: Antes de fechar — ano passado (S-12) e mix (S-13), para o representante ajustar */}
            {cart.lines.length > 0 && editable && (lastYear.length > 0 || mix.length > 0) && (
              <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
                <Group gap="xs" mb="sm"><ClockCounterClockwiseIcon size={18} /><Title order={3}>Antes de fechar</Title></Group>
                <Stack gap="sm">
                  {lastYear.map(r => {
                    const p = productById(r.productId)!;
                    return (
                      <Group key={r.productId} justify="space-between" wrap="wrap" gap="xs">
                        <Box>
                          <Text size="sm" fw={600}>{productDisplayName(p)}</Text>
                          <Text size="sm" c="dimmed">{r.now} pares vs. {r.lastYear} no mesmo período do ano passado</Text>
                        </Box>
                        <Button size="compact-md" variant="default" onClick={() => openGrade({ productId: r.productId, mode: 'edit', cartId: cart.id, initial: cart.lines.find(l => l.productId === r.productId)?.sizes, extraPairs: r.lastYear - r.now })}>
                          Igualar ano passado (+{r.lastYear - r.now})
                        </Button>
                      </Group>
                    );
                  })}
                  {lastYear.length > 0 && mix.length > 0 && <Divider />}
                  {mix.map(m => (
                    <Box key={m.segment}>
                      <Text size="sm" fw={600}>{m.segment} abaixo do ideal pro perfil da loja</Text>
                      <Text size="sm" c="dimmed">{m.share}% dos pares do carrinho · ideal {m.target}%</Text>
                    </Box>
                  ))}
                  {mix.length > 0 && (
                    <Anchor component="button" type="button" size="sm" fw={600} onClick={() => setEditing(true)}>Ver sugestões pra completar o mix</Anchor>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid.Col>

        {/* Lateral: o carrinho em números, com quem está compartilhado e para onde seguir */}
        <Grid.Col span={{ base: 12, lg: 4, xl: 3 }}>
          <Stack gap="md" pl={{ lg: 'lg' }} className={classes.cartAside}>
            <Box>
              {renaming ? (
                <TextInput
                  size="xs"
                  value={nameDraft}
                  onChange={e => setNameDraft(e.currentTarget.value)}
                  onBlur={() => { renameCart(cart.id, nameDraft); setRenaming(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { renameCart(cart.id, nameDraft); setRenaming(false); } if (e.key === 'Escape') setRenaming(false); }}
                  maxLength={60}
                  aria-label="Nome do carrinho"
                  autoFocus
                />
              ) : (
                <Group gap={6} wrap="nowrap">
                  <Eyebrow truncate>Carrinho: {cart.cartName}</Eyebrow>
                  <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => { setNameDraft(cart.cartName); setRenaming(true); }} aria-label="Renomear carrinho">
                    <PencilSimpleIcon size={14} />
                  </ActionIcon>
                </Group>
              )}
              <Text fz={28} fw={700} lh={1.2} mt={4}>{pairsText(pairs)}</Text>
              <Text className="mono" size="sm" c="dimmed">{formatCurrency(subtotal)}</Text>
            </Box>

            <Paper withBorder p="sm">
              <Group gap="sm" wrap="nowrap" align="flex-start">
                <Avatar size={28} radius="xl" color="brand" variant={privateDraft ? 'light' : 'filled'}>{initials(contact)}</Avatar>
                <Text size="sm">{shareText}</Text>
              </Group>
            </Paper>

            {/* Compartilhar: só o rascunho do representante; desfaz enquanto a loja não respondeu */}
            {ownCart ? (
              <Switch
                checked={!privateDraft}
                disabled={!canToggleShare}
                onChange={e => (e.currentTarget.checked ? share() : unshare())}
                color="teal"
                size="sm"
                label={`Compartilhar com ${contact}`}
                description={!canToggleShare ? 'A loja já respondeu — o carrinho segue compartilhado' : undefined}
              />
            ) : (
              <Text size="sm" c="dimmed">
                {cart.repCanEdit ? 'A loja liberou você para editar este carrinho. Cada edição avisa o lojista.' : 'Só o lojista edita este carrinho — peça pela conversa se precisar ajustar.'}
              </Text>
            )}

            <Stack gap="xs">
              {!privateDraft && <Button variant="default" fullWidth onClick={onOpenChat}>Falar com {contact}</Button>}
              {editable && <Button variant="default" fullWidth onClick={() => onNavigate('catalog')} leftSection={<PlusIcon size={16} />}>Adicionar produtos</Button>}
            </Stack>

            <Anchor component="button" type="button" size="sm" fw={600} onClick={() => onNavigate('catalog')} ta="center">
              <Group gap={4} justify="center" wrap="nowrap"><ArrowLeftIcon size={14} />Continuar comprando</Group>
            </Anchor>

            {/* FR-601: outros carrinhos abertos desta loja */}
            {siblings.length > 0 && (
              <Box>
                <Eyebrow mb={6}>Outros carrinhos desta loja</Eyebrow>
                <Stack gap={4}>
                  {siblings.map(c => (
                    <UnstyledButton key={c.id} onClick={() => onSwitchCart(toContext(c))} className={classes.siblingCart}>
                      <Group justify="space-between" wrap="nowrap" gap="xs">
                        <Text size="sm" truncate>{c.cartName}</Text>
                        <Text fz={12} ff="monospace" c="dimmed" flex="none">{cartPairs(c)} pares</Text>
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
              </Box>
            )}
            <Group gap="md" justify="center">
              <Anchor component="button" type="button" size="sm" onClick={newCart}>Novo carrinho</Anchor>
              <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('history')}>Pedidos da loja</Anchor>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>

      <CartEditDrawer cart={cart} opened={editing} onClose={() => setEditing(false)} />

      <Modal opened={exceptionOpen} onClose={() => setExceptionOpen(false)} centered title={<Text fw={600}>Aprovar exceção à grade mínima</Text>}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">{pairsText(pairs)} de {CART_PARAMS.minOrderPairs}. A exceção fica registrada com o motivo e aparece para a loja como "Exceção aprovada por {repFirstName(cart.rep)}".</Text>
          <Textarea label="Motivo" value={exceptionReason} onChange={e => setExceptionReason(e.currentTarget.value)} autosize minRows={2} maxLength={200} />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setExceptionOpen(false)}>Cancelar</Button>
            <Button disabled={!exceptionReason.trim()} onClick={() => { approveMinimumException(cart.id, exceptionReason); setExceptionOpen(false); setExceptionReason(''); toast.success('Exceção aprovada', 'O carrinho pode seguir abaixo da grade mínima.'); }}>
              Aprovar exceção
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
