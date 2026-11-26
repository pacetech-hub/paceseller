import { useState } from "react";
import {
  ActionIcon, Anchor, Avatar, Badge, Box, Button, Divider, Grid, Group, Paper, Stack, Switch, Text, TextInput, Title,
  UnstyledButton,
} from "@mantine/core";
import {
  ArrowLeftIcon, CheckIcon, ClockCounterClockwiseIcon, CreditCardIcon, PaperPlaneTiltIcon, PencilSimpleIcon, PlusIcon,
  ShoppingCartIcon,
} from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import {
  CART_PARAMS, approveRepSuggestion, autoSendText, cartPairs, cartStatus, cartValue, createCart, getCart, isEditableBy,
  isOpen, productById, renameCart, repFirstName, sendToRep, setAutoSend, setRepCanEdit, statusColorFor, statusLabelFor,
  toContext, useCartStore, visibleTo, type CartContext,
} from "../data/cartStore";
import { belowLastYear, mixCheck, pairsText, productDisplayName, useRadar } from "../data/radar";
import { useShop } from "../lib/shop";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import { LineItem } from "./CartPage";
import { CartEditDrawer } from "./CartEditDrawer";
import { Eyebrow, initials } from "./CartParts";
import classes from "./CartPage.module.css";

// Carrinho visto pelo lojista: o pedido (linhas, subtotal, status e uma ação principal) e, na
// lateral, o carrinho em números, a permissão do representante e os atalhos. A edição do pedido
// acontece na gaveta "Seu pedido"; a conversa e o pagamento têm páginas próprias.

type View = 'radar' | 'catalog' | 'carts' | 'history';

interface LojistaCartPageProps {
  onNavigate: (view: View) => void;
  cartContext?: CartContext | null;
  onSwitchCart: (ctx: CartContext) => void;
  onCheckout: () => void;
  onOpenChat: () => void;
}

export function LojistaCartPage({ onNavigate, cartContext, onSwitchCart, onCheckout, onOpenChat }: LojistaCartPageProps) {
  const { carts } = useCartStore();
  const radar = useRadar();
  const { openGrade } = useShop();
  const loading = useMockLoading();
  const cart = getCart(cartContext?.id) ?? null;
  const [editing, setEditing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (!cart || !isOpen(cart)) {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={900} mx="auto" w="100%">
        <EmptyState
          icon={ShoppingCartIcon}
          title={cart ? 'Este carrinho já virou pedido' : 'Nenhum carrinho aberto'}
          description={cart ? 'Carrinhos confirmados ficam em Pedidos.' : 'Escolha um carrinho em Meus carrinhos ou crie um novo.'}
          action={cart ? { label: 'Acompanhar em Pedidos', onClick: () => onNavigate('history') } : { label: 'Ir para Meus carrinhos', onClick: () => onNavigate('carts') }}
        />
      </Box>
    );
  }

  const status = cartStatus(cart);
  const pairs = cartPairs(cart);
  const subtotal = cartValue(cart);
  const editable = isEditableBy(cart, 'lojista');
  const belowMin = pairs < CART_PARAMS.minOrderPairs && !cart.exception;
  const repName = repFirstName(cart.rep);
  const siblings = carts.filter(c => c.clientId === cart.clientId && isOpen(c) && c.id !== cart.id && visibleTo(c, 'lojista'));
  const lastYear = belowLastYear(cart);
  const mix = mixCheck(cart, radar);
  const auto = autoSendText(cart);
  const sharedNow = cart.stage !== 'montagem' || cart.createdBy === 'rep';

  // Uma ação principal por status (FR-603 / BR-74)
  const primary = (() => {
    switch (status) {
      case 'rascunho': return { label: 'Continuar montando', icon: PlusIcon, run: () => onNavigate('catalog') };
      case 'pronto': return { label: `Enviar pro ${repName}`, icon: PaperPlaneTiltIcon, run: () => { if (sendToRep(cart.id)) toast.success(`Enviado para ${repName}`, 'Você é avisado quando as condições forem confirmadas.'); } };
      case 'aguardando-voce': return {
        label: 'Revisar e aprovar', icon: CheckIcon, disabled: belowMin,
        run: () => { if (approveRepSuggestion(cart.id)) toast.success('Sugestão aprovada', `${repName} confirma as condições comerciais em seguida.`); },
      };
      case 'aguardando-pagamento': return { label: 'Ir para pagamento', icon: CreditCardIcon, run: onCheckout };
      default: return null;
    }
  })();

  const waitingText = (() => {
    switch (status) {
      case 'aguardando-rep': return `Aguardando ${repName} confirmar as condições`;
      case 'aguardando-voce': return `${repName} espera sua revisão`;
      case 'aguardando-pagamento': return 'Condições confirmadas';
      case 'pronto': return 'Pronto pra enviar';
      default: return null;
    }
  })();

  const saveDraft = () => {
    toast.success('Carrinho salvo', `"${cart.cartName}" fica em Meus carrinhos para você continuar depois.`);
    onNavigate('carts');
  };
  const newCart = () => onSwitchCart(toContext(createCart({ clientId: cart.clientId, createdBy: 'lojista' })));

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* BR-72: caminho até o carrinho */}
      <Group gap={8} component="nav" aria-label="Caminho" mb="lg">
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('radar')}>Radar</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('carts')}>Meus carrinhos</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Text size="sm" fw={600} aria-current="page">{cart.cartName}</Text>
      </Group>

      <Grid gutter={{ base: 'lg', lg: 40 }}>
        <Grid.Col span={{ base: 12, lg: 8, xl: 9 }}>
          <Stack gap="md">
            {/* Quem acompanha o pedido */}
            <Group gap="sm" wrap="nowrap">
              <Avatar size={28} radius="xl" color="brand" variant="filled">{initials(cart.rep)}</Avatar>
              <Text size="sm">
                {sharedNow
                  ? <>Compartilhado com <Text span fw={600} inherit>{repName}</Text> — acompanha e comenta este pedido</>
                  : <>Só você vê este carrinho por enquanto. Ele vai para <Text span fw={600} inherit>{repName}</Text> quando você enviar.</>}
              </Text>
            </Group>

            {/* FR-603/604/605: o pedido — condição e prazo, linhas, subtotal, status e uma ação principal */}
            <Paper withBorder style={{ overflow: 'hidden' }}>
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm" px={{ base: 'md', sm: 'lg' }} py="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Box miw={0}>
                  <Text fw={600}>Pedido</Text>
                  <Text fz={12} ff="monospace" c="dimmed" mt={2}>
                    {status === 'aguardando-pagamento' ? `30/60/90 dias ou à vista com ${CART_PARAMS.cashDiscountPct}%` : '30/60/90 dias'} · {CART_PARAMS.leadTimeLabel}
                  </Text>
                </Box>
                <Group gap="md" wrap="wrap">
                  {editable && cart.lines.length > 0 && (
                    <Anchor component="button" type="button" size="sm" fw={600} onClick={() => setEditing(true)}>Editar no drawer</Anchor>
                  )}
                  <Badge variant="light" color={statusColorFor(status, 'lojista')} radius="sm" ff="monospace" styles={{ label: { textTransform: 'none', fontWeight: 500 } }}>
                    {statusLabelFor(status, cart, 'lojista')}
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
                    description="Adicione produtos pelo Catálogo ou pelo Radar. Cada produto entra pela grade de numeração."
                    action={{ label: 'Ir para o Catálogo', onClick: () => onNavigate('catalog') }}
                  />
                ) : (
                  <Stack gap="xs">
                    {cart.lines.map(l => <LineItem key={l.productId} cart={cart} productId={l.productId} sizes={l.sizes} editable={false} />)}
                  </Stack>
                )}
              </Box>

              {cart.lines.length > 0 && (
                <Group justify="space-between" align="center" wrap="wrap" gap="sm" px={{ base: 'md', sm: 'lg' }} py="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                  <Text className="mono" fw={600}>Subtotal: {formatCurrency(subtotal)}</Text>
                  <Group gap="md" wrap="wrap" justify="flex-end">
                    {waitingText && <Text size="sm" c="dimmed">{waitingText}</Text>}
                    {primary && (
                      <Button size="lg" onClick={primary.run} disabled={'disabled' in primary && primary.disabled} leftSection={<primary.icon size={16} />}>
                        {primary.label}
                      </Button>
                    )}
                  </Group>
                </Group>
              )}

              {/* BR-23/24: grade mínima — verde quando atingida; abaixo dela não envia nem confirma sem exceção */}
              {cart.lines.length > 0 && (
                pairs >= CART_PARAMS.minOrderPairs || cart.exception ? (
                  <Box px={{ base: 'md', sm: 'lg' }} py={8} bg="var(--mantine-color-teal-light)">
                    <Text fz={12} ff="monospace" c="teal.8">
                      ✓ {pairs} pares — {cart.exception ? `exceção aprovada por ${repFirstName(cart.exception.by)}` : 'grade mínima atingida'}
                    </Text>
                  </Box>
                ) : (
                  <Box px={{ base: 'md', sm: 'lg' }} py={8} bg="var(--mantine-color-yellow-light)">
                    <Text fz={12} ff="monospace" c="yellow.9">
                      {pairs}/{CART_PARAMS.minOrderPairs} pares — faltam {CART_PARAMS.minOrderPairs - pairs} para a grade mínima; abaixo dela o carrinho não pode ser enviado nem confirmado
                    </Text>
                  </Box>
                )
              )}
            </Paper>

            {/* FR-606: Antes de fechar — ano passado (S-12) e mix (S-13) */}
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
                      <Text size="sm" fw={600}>{m.segment} abaixo do ideal pro seu perfil</Text>
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

        {/* Lateral: o carrinho em números, quem pode editar e para onde seguir */}
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
              <Text fz={28} fw={600} lh={1.2} mt={4}>{pairsText(pairs)}</Text>
              <Text className="mono" size="sm" c="dimmed">{formatCurrency(subtotal)}</Text>
            </Box>

            <Paper withBorder p="sm">
              <Text size="sm">O carrinho fecha e paga como um pedido só — na hora de pagar você pode dividir o valor entre mais de uma forma (parte no cartão, parte no PIX, por exemplo)</Text>
            </Paper>

            {/* FR-602: permissão de edição do representante (só o lojista muda) */}
            <Switch
              checked={cart.repCanEdit}
              onChange={e => setRepCanEdit(cart.id, e.currentTarget.checked)}
              color="teal"
              size="sm"
              label={`${repName} pode editar este carrinho`}
            />

            {status === 'pronto' && (
              <Box>
                <Switch checked={cart.autoSend} onChange={e => setAutoSend(cart.id, e.currentTarget.checked)} label="Envio automático" color="teal" size="sm" />
                {auto && <Text size="xs" c="dimmed" mt={4}>{auto}</Text>}
              </Box>
            )}

            <Stack gap="xs">
              <Button variant="default" fullWidth onClick={onOpenChat}>Falar com {repName}</Button>
              {cart.stage === 'montagem' && (
                <Button variant="default" fullWidth onClick={saveDraft}>Salvar carrinho como rascunho</Button>
              )}
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
              <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('history')}>Pedidos anteriores</Anchor>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>

      <CartEditDrawer cart={cart} opened={editing} onClose={() => setEditing(false)} />
    </Box>
  );
}
