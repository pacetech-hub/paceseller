import { useRef, useState } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, Textarea, Badge, ThemeIcon, Grid, Alert, Image, Modal, Radio,
  Divider, Skeleton, Switch, Tabs, Progress, Collapse, NumberInput, Select, Anchor, UnstyledButton, Avatar,
} from "@mantine/core";
import {
  ShoppingCartIcon, TrashIcon, PlusIcon, CheckIcon, CaretDownIcon, CaretUpIcon, PackageIcon, ArrowRightIcon,
  PaperPlaneTiltIcon, ChatCircleIcon, UsersIcon, TruckIcon, WarningIcon, PencilSimpleIcon, CreditCardIcon, CaretLeftIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import {
  CART_PARAMS, addComment, approveMinimumException, approveRepSuggestion, autoSendText, cartPairs, cartStatus, cartValue,
  confirmPayment, createCart, getCart, isEditableBy, isOpen, lineValue, pairsOf, productById, removeLine, repConfirmConditions,
  repFirstName, sendToRep, setAutoSend, setRepCanEdit, statusColor, statusLabel, toContext, useCartStore,
  type Cart, type CartContext, type CartCreator,
} from "../data/cartStore";
import { belowLastYear, cartMarginPct, mixCheck, pairsText, productDisplayName, useRadar } from "../data/radar";
import { useShop } from "../lib/shop";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

interface CartPageProps {
  onNavigate: (view: View) => void;
  cartContext?: CartContext | null;
  /** Troca o carrinho aberto (abas do topo). */
  onSwitchCart: (ctx: CartContext) => void;
  viewerRole?: CartCreator;
}

/** Miniatura do produto: skeleton até a imagem carregar; ícone neutro se a imagem falhar. */
function ProductThumb({ src, alt, size = 64 }: { src: string; alt: string; size?: number }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <Box w={size} h={size} pos="relative" flex="none" bg="white" style={{ overflow: 'hidden', borderRadius: 'var(--mantine-radius-default)', border: '1px solid var(--mantine-color-default-border)' }}>
      {status === 'loading' && <Skeleton h="100%" style={{ position: 'absolute', inset: 0 }} />}
      {status === 'error' ? (
        <Box h="100%" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}><PackageIcon size={20} color="var(--mantine-color-dimmed)" /></Box>
      ) : (
        <Image src={src} alt={alt} w="100%" h="100%" fit="contain" onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} style={{ opacity: status === 'loaded' ? 1 : 0 }} />
      )}
    </Box>
  );
}

type PayMethod = 'prazo' | 'avista' | 'dividido';
const TERMS = [
  { value: '30-60-90', label: '30/60/90 dias' },
  { value: '30-60', label: '30/60 dias' },
  { value: '30', label: '30 dias' },
];

const timeAgo = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'agora';
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
};

function LineItem({ cart, productId, sizes, editable, discountPct }: {
  cart: Cart; productId: string; sizes: Record<string, number>; editable: boolean; discountPct: number;
}) {
  const [open, setOpen] = useState(false);
  const { openGrade, role } = useShop();
  const p = productById(productId);
  if (!p) return null;
  const n = pairsOf(sizes);
  const value = lineValue({ productId, sizes });
  const newUnit = p.price * (1 - discountPct / 100);
  return (
    <Paper withBorder p={{ base: 'sm', sm: 'md' }}>
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <ProductThumb src={p.image} alt={p.name} />
        <Box miw={0} flex={1}>
          <Text fw={600}>{productDisplayName(p)}</Text>
          {/* BR-07: desconto por linha com preço antigo, novo e percentual */}
          {discountPct > 0 ? (
            <Group gap={6}>
              <Text size="sm" c="dimmed" td="line-through">{formatCurrency(p.price)}</Text>
              <Text size="sm" fw={600}>{formatCurrency(newUnit)}/par</Text>
              <Badge size="sm" variant="light" color="teal">-{discountPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</Badge>
            </Group>
          ) : (
            <Text size="sm" c="dimmed">{p.reference} · {formatCurrency(p.price)}/par</Text>
          )}
          <UnstyledButton onClick={() => setOpen(o => !o)} mt={4} aria-expanded={open}>
            <Group gap={4}>
              <Text size="sm" fw={600}>{pairsText(n)}</Text>
              {open ? <CaretUpIcon size={16} /> : <CaretDownIcon size={16} />}
              <Text size="sm" c="dimmed">{open ? 'ocultar numeração' : 'ver por numeração'}</Text>
            </Group>
          </UnstyledButton>
        </Box>
        <Stack gap={4} align="flex-end" flex="none">
          <Text className="mono" fw={700}>{formatCurrency(value * (1 - discountPct / 100))}</Text>
          {editable && (
            <Group gap={4}>
              <Button size="compact-sm" variant="default" leftSection={<PencilSimpleIcon size={16} />} onClick={() => openGrade({ productId, mode: 'edit', cartId: cart.id, initial: sizes })}>
                Editar grade
              </Button>
              <Button size="compact-sm" variant="subtle" color="red" leftSection={<TrashIcon size={16} />} onClick={() => removeLine(cart.id, productId, role)} aria-label={`Remover ${p.name} do carrinho`}>
                Remover
              </Button>
            </Group>
          )}
        </Stack>
      </Group>
      <Collapse in={open}>
        <Group gap="xs" mt="sm">
          {Object.entries(sizes).sort(([a], [b]) => Number(a) - Number(b)).map(([s, q]) => (
            <Paper key={s} withBorder px="xs" py={4} bg="var(--mantine-color-default-hover)">
              <Text size="sm"><Text span c="dimmed" inherit>Nº {s}</Text> · <Text span fw={600} className="mono" inherit>{q}</Text></Text>
            </Paper>
          ))}
        </Group>
      </Collapse>
    </Paper>
  );
}

export function CartPage({ onNavigate, cartContext, onSwitchCart, viewerRole = 'lojista' }: CartPageProps) {
  const { carts } = useCartStore();
  const radar = useRadar();
  const { openGrade } = useShop();
  const loading = useMockLoading();
  const cart = getCart(cartContext?.id) ?? null;
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<PayMethod>('prazo');
  const [terms, setTerms] = useState('30-60-90');
  const [cashShare, setCashShare] = useState<number | string>(50);
  const [comment, setComment] = useState('');
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [doneOrder, setDoneOrder] = useState<string | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  if (doneOrder) {
    return (
      <Stack align="center" justify="center" p={{ base: 'md', sm: 'lg' }} mih="60vh">
        <Stack align="center" gap={0} maw={420} ta="center">
          <ThemeIcon variant="light" color="teal" size={64} mb="lg"><CheckIcon size={32} /></ThemeIcon>
          <Title order={1}>Pedido confirmado</Title>
          <Text c="dimmed" mt="xs">Pedido <Text span fw={600} c="var(--mantine-color-text)" className="mono" inherit>{doneOrder}</Text></Text>
          <Text mt="md">O carrinho saiu de Meus carrinhos e agora aparece em Pedidos. {CART_PARAMS.leadTimeLabel}.</Text>
          <Group gap="sm" mt="xl" justify="center">
            <Button onClick={() => onNavigate('carts')} variant="default">Meus carrinhos</Button>
            <Button onClick={() => onNavigate('history')} rightSection={<ArrowRightIcon size={16} />}>Acompanhar</Button>
          </Group>
        </Stack>
      </Stack>
    );
  }

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
  const margin = cartMarginPct(cart.lines);
  const editable = isEditableBy(cart, viewerRole);
  const belowMin = pairs < CART_PARAMS.minOrderPairs && !cart.exception;
  const repName = repFirstName(cart.rep);
  const siblings = carts.filter(c => c.clientId === cart.clientId && isOpen(c));
  const lastYear = belowLastYear(cart);
  const mix = mixCheck(cart, radar);
  const auto = autoSendText(cart);
  const share = method === 'avista' ? 1 : method === 'dividido' ? Math.min(100, Math.max(0, Number(cashShare) || 0)) / 100 : 0;
  const discountPct = paying ? CART_PARAMS.cashDiscountPct * share : 0;
  const total = subtotal * (1 - discountPct / 100);
  const paymentCondition = method === 'prazo'
    ? TERMS.find(t => t.value === terms)?.label ?? ''
    : method === 'avista' ? `À vista com ${CART_PARAMS.cashDiscountPct}% de desconto` : `${Math.round(share * 100)}% à vista + ${TERMS.find(t => t.value === terms)?.label}`;

  // Uma ação principal por status (FR-603 / BR-74)
  const primary = (() => {
    if (viewerRole === 'rep') {
      if (status === 'aguardando-rep') return { label: 'Confirmar condições', icon: CheckIcon, run: () => { if (repConfirmConditions(cart.id)) toast.success('Condições confirmadas', 'O lojista já pode seguir para o pagamento.'); } };
      return null;
    }
    switch (status) {
      case 'rascunho': return { label: 'Continuar montando', icon: PlusIcon, run: () => onNavigate('catalog') };
      case 'pronto': return { label: 'Enviar pro representante', icon: PaperPlaneTiltIcon, run: () => { if (sendToRep(cart.id)) toast.success(`Enviado para ${repName}`, 'Você é avisado quando as condições forem confirmadas.'); } };
      case 'aguardando-voce': return {
        label: 'Revisar e aprovar', icon: CheckIcon, disabled: belowMin,
        run: () => { if (approveRepSuggestion(cart.id)) toast.success('Sugestão aprovada', `${repName} confirma as condições comerciais em seguida.`); },
      };
      case 'aguardando-pagamento': return paying ? null : { label: 'Ir para pagamento', icon: CreditCardIcon, run: () => setPaying(true) };
      default: return null;
    }
  })();

  const talkToRep = () => commentRef.current?.focus();
  const sendComment = () => {
    addComment(cart.id, viewerRole, viewerRole === 'lojista' ? 'Você' : cart.rep, comment);
    setComment('');
  };
  const newCart = () => {
    const c = createCart({ clientId: cart.clientId, createdBy: viewerRole });
    onSwitchCart(toContext(c));
  };

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <Button onClick={() => onNavigate('carts')} variant="subtle" color="gray" ml={-12} mb="xs" leftSection={<CaretLeftIcon size={16} />}>
        Meus carrinhos
      </Button>

      {/* FR-601: abas para trocar de carrinho + novo carrinho */}
      <Group gap="sm" wrap="nowrap" mb="md" align="flex-end">
        <Tabs value={cart.id} onChange={v => { const c = getCart(v); if (c) { setPaying(false); onSwitchCart(toContext(c)); } }} style={{ overflowX: 'auto', flex: 1 }}>
          <Tabs.List style={{ flexWrap: 'nowrap' }}>
            {siblings.map(c => (
              <Tabs.Tab key={c.id} value={c.id} rightSection={<Badge size="xs" variant="light" color={statusColor[cartStatus(c)]}>{cartPairs(c)}</Badge>}>
                <Text span size="sm" fw={c.id === cart.id ? 600 : 400} style={{ whiteSpace: 'nowrap' }}>{c.cartName}</Text>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
        <Button variant="default" size="compact-md" leftSection={<PlusIcon size={16} />} onClick={newCart} flex="none">Novo carrinho</Button>
      </Group>

      {/* FR-602: quem vê o carrinho e permissão de edição do representante */}
      <Paper withBorder p="sm" mb="md" bg="var(--mantine-color-default-hover)">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="xs" wrap="nowrap">
            <UsersIcon size={18} />
            <Text size="sm">Compartilhado entre <Text span fw={600} inherit>{viewerRole === 'lojista' ? 'você' : cart.clientName}</Text> e <Text span fw={600} inherit>{viewerRole === 'rep' ? 'você' : `${cart.rep} (representante)`}</Text></Text>
          </Group>
          <Switch
            checked={cart.repCanEdit}
            disabled={viewerRole !== 'lojista'}
            onChange={e => setRepCanEdit(cart.id, e.currentTarget.checked)}
            label={`${repName} pode editar este carrinho`}
            description={cart.repCanEdit ? 'Cada edição avisa você e fica nos comentários' : undefined}
          />
        </Group>
      </Paper>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="md">
            {/* FR-603: status, condição de pagamento, prazo e uma ação principal */}
            <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                <Box miw={0}>
                  <Title order={2}>{cart.cartName}</Title>
                  <Group gap="xs" mt={4} wrap="wrap">
                    <Badge variant="light" color={statusColor[status]}>{statusLabel(status, cart.rep)}</Badge>
                    {cart.createdBy === 'rep' && <Badge variant="light" color="neutral">Montado por {repName}</Badge>}
                    {cart.exception && <Badge variant="light" color="neutral">Exceção aprovada por {repFirstName(cart.exception.by)}</Badge>}
                  </Group>
                  <Group gap="md" mt="xs">
                    <Text size="sm" c="dimmed">Condição: {status === 'aguardando-pagamento' || status === 'confirmado' ? `30/60/90 dias ou à vista com ${CART_PARAMS.cashDiscountPct}%` : `a confirmar com ${repName}`}</Text>
                    <Group gap={4}><TruckIcon size={16} /><Text size="sm" c="dimmed">{CART_PARAMS.leadTimeLabel}</Text></Group>
                  </Group>
                </Box>
                {primary && (
                  <Button onClick={primary.run} disabled={'disabled' in primary && primary.disabled} leftSection={<primary.icon size={16} />}>
                    {primary.label}
                  </Button>
                )}
                {!primary && status === 'aguardando-rep' && viewerRole === 'lojista' && (
                  <Button variant="default" leftSection={<ChatCircleIcon size={16} />} onClick={talkToRep}>Falar com {repName}</Button>
                )}
              </Group>
              {status === 'pronto' && viewerRole === 'lojista' && (
                <Group mt="sm" gap="sm" wrap="wrap">
                  <Switch checked={cart.autoSend} onChange={e => setAutoSend(cart.id, e.currentTarget.checked)} label="Envio automático" />
                  {auto && <Text size="sm" c="dimmed">{auto}</Text>}
                </Group>
              )}
              {status === 'aguardando-rep' && (
                <Text size="sm" c="dimmed" mt="sm">{viewerRole === 'lojista' ? `${repName} está revisando as condições comerciais. O pagamento abre quando ele confirmar.` : 'Revise as condições e confirme para liberar o pagamento ao lojista.'}</Text>
              )}
            </Paper>

            {/* BR-24: abaixo da grade mínima não envia nem confirma sem exceção registrada */}
            {belowMin && cart.lines.length > 0 && (
              <Alert variant="light" color="yellow" icon={<WarningIcon size={18} />} title={`Faltam ${CART_PARAMS.minOrderPairs - pairs} pares para a grade mínima de ${CART_PARAMS.minOrderPairs}`}>
                <Group justify="space-between" wrap="wrap" gap="sm">
                  <Text size="sm">Abaixo do mínimo o carrinho fica em Rascunho e não pode ser enviado nem confirmado.</Text>
                  {viewerRole === 'rep' && <Button size="compact-md" variant="default" onClick={() => setExceptionOpen(true)}>Aprovar exceção</Button>}
                </Group>
              </Alert>
            )}

            {/* FR-604: linhas */}
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
              <Stack gap="sm">
                {cart.lines.map(l => (
                  <LineItem key={l.productId} cart={cart} productId={l.productId} sizes={l.sizes} editable={editable && !paying} discountPct={discountPct} />
                ))}
                {editable && !paying && (
                  <Button variant="default" leftSection={<PlusIcon size={16} />} onClick={() => onNavigate('catalog')} style={{ borderStyle: 'dashed' }}>
                    Adicionar produtos
                  </Button>
                )}
              </Stack>
            )}

            {/* FR-605: subtotal, grade mínima e margem (os totais aparecem uma vez, aqui) */}
            {cart.lines.length > 0 && (
              <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
                <Stack gap="xs">
                  <Group justify="space-between"><Text c="dimmed">Subtotal · {pairsText(pairs)}</Text><Text className="mono">{formatCurrency(subtotal)}</Text></Group>
                  {discountPct > 0 && (
                    <Group justify="space-between"><Text c="teal.7">Desconto à vista nas linhas</Text><Text c="teal.7" className="mono">-{formatCurrency(subtotal - total)}</Text></Group>
                  )}
                  {margin !== null && (
                    <Group justify="space-between"><Text c="dimmed">Margem do carrinho no PDV sugerido</Text><Text className="mono" fw={600}>{margin}%</Text></Group>
                  )}
                  <Box>
                    <Group justify="space-between">
                      <Text c="dimmed">Grade mínima</Text>
                      <Text className="mono">{pairs >= CART_PARAMS.minOrderPairs ? `${pairs} pares · mínimo ${CART_PARAMS.minOrderPairs}` : `${pairs}/${CART_PARAMS.minOrderPairs} pares`}</Text>
                    </Group>
                    <Progress mt={4} value={Math.min(100, (pairs / CART_PARAMS.minOrderPairs) * 100)} color={pairs >= CART_PARAMS.minOrderPairs ? 'teal' : 'yellow'} aria-label="Progresso da grade mínima" />
                  </Box>
                  <Divider my={4} />
                  <Group justify="space-between"><Text fw={600}>Total</Text><Text className="mono" size="xl" fw={700}>{formatCurrency(total)}</Text></Group>
                  <Text size="sm" c="dimmed">Valores pelo Seu custo, sem impostos e sem frete.</Text>
                </Stack>
              </Paper>
            )}

            {/* FR-606: Antes de fechar — ano passado (S-12) e mix (S-13) */}
            {cart.lines.length > 0 && !paying && (lastYear.length > 0 || mix.length > 0) && (
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
                        {editable && (
                          <Button size="compact-md" variant="default" onClick={() => openGrade({ productId: r.productId, mode: 'edit', cartId: cart.id, initial: cart.lines.find(l => l.productId === r.productId)?.sizes, extraPairs: r.lastYear - r.now })}>
                            Igualar ano passado (+{r.lastYear - r.now})
                          </Button>
                        )}
                      </Group>
                    );
                  })}
                  {lastYear.length > 0 && mix.length > 0 && <Divider />}
                  {mix.map(m => (
                    <Box key={m.segment}>
                      <Text size="sm" fw={600}>{m.segment} abaixo do ideal pro seu perfil</Text>
                      <Text size="sm" c="dimmed">{m.share}% dos pares do carrinho · ideal {m.target}%</Text>
                      {m.suggestions.length > 0 && (
                        <Group gap="xs" mt="xs">
                          {m.suggestions.map(p => (
                            <Button key={p.id} size="compact-sm" variant="default" leftSection={<PlusIcon size={16} />} disabled={!editable} onClick={() => openGrade({ productId: p.id, cartId: cart.id })}>
                              {p.name}
                            </Button>
                          ))}
                        </Group>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* FR-608: pagamento só depois que o representante confirma */}
            {paying && status === 'aguardando-pagamento' && (
              <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
                <Group gap="xs" mb="md"><CreditCardIcon size={18} /><Title order={3}>Pagamento</Title></Group>
                <Radio.Group value={method} onChange={v => setMethod(v as PayMethod)} name="pay-method">
                  <Stack gap="sm">
                    <Radio value="prazo" label="A prazo" description="Boleto em parcelas, sem desconto" />
                    <Radio value="avista" label={`À vista (PIX ou boleto) · ${CART_PARAMS.cashDiscountPct}% de desconto`} description="O desconto aparece em cada linha" />
                    <Radio value="dividido" label="Dividir entre à vista e a prazo" description={`O desconto vale só para a parte à vista`} />
                  </Stack>
                </Radio.Group>
                <Group mt="md" gap="md" align="flex-end" wrap="wrap">
                  {method !== 'avista' && <Select label="Prazo" data={TERMS} value={terms} onChange={v => v && setTerms(v)} allowDeselect={false} w={200} />}
                  {method === 'dividido' && <NumberInput label="Parte à vista (%)" value={cashShare} onChange={setCashShare} min={0} max={100} w={180} />}
                </Group>
                {method === 'dividido' && (
                  <Text size="sm" c="dimmed" mt="xs">
                    À vista: {formatCurrency(subtotal * share * (1 - CART_PARAMS.cashDiscountPct / 100))} · A prazo: {formatCurrency(subtotal * (1 - share))}
                  </Text>
                )}
                <Group justify="flex-end" mt="lg" gap="sm">
                  <Button variant="default" onClick={() => setPaying(false)}>Voltar</Button>
                  <Button
                    leftSection={<CheckIcon size={16} />}
                    onClick={() => {
                      const id = confirmPayment(cart.id, paymentCondition, total);
                      if (id) setDoneOrder(id);
                    }}
                  >
                    Confirmar pagamento · {formatCurrency(total)}
                  </Button>
                </Group>
              </Paper>
            )}
          </Stack>
        </Grid.Col>

        {/* FR-609: a lateral fica só com colaboração */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
              <Group justify="space-between" mb="sm">
                <Group gap="xs"><ChatCircleIcon size={18} /><Title order={3}>Comentários</Title></Group>
                {viewerRole === 'lojista' && <Button size="compact-sm" variant="default" onClick={talkToRep}>Falar com {repName}</Button>}
              </Group>
              {/* FR-607: cada edição do representante aparece aqui */}
              <Stack gap="sm" mah={360} style={{ overflowY: 'auto' }}>
                {cart.comments.length === 0 && <Text size="sm" c="dimmed">Nenhum comentário ainda.</Text>}
                {cart.comments.map(cm => (
                  <Group key={cm.id} gap="xs" align="flex-start" wrap="nowrap">
                    <Avatar size={28} color={cm.author === 'rep' ? 'yellow' : 'teal'} variant="light">{cm.name === 'Você' ? 'V' : cm.name[0]}</Avatar>
                    <Box miw={0}>
                      <Group gap={6}>
                        <Text size="sm" fw={600}>{cm.name === 'Você' ? 'Você' : repFirstName(cm.name)}</Text>
                        <Text size="xs" c="dimmed">{timeAgo(cm.at)}</Text>
                        {cm.kind === 'edit' && <Badge size="xs" variant="light" color="yellow">edição</Badge>}
                      </Group>
                      <Text size="sm" c={cm.kind === 'system' ? 'dimmed' : undefined}>{cm.text}</Text>
                    </Box>
                  </Group>
                ))}
              </Stack>
              <Textarea ref={commentRef} mt="md" placeholder={`Escreva para ${viewerRole === 'lojista' ? repName : 'o lojista'}`} value={comment} onChange={e => setComment(e.currentTarget.value)} autosize minRows={2} maxLength={500} aria-label="Novo comentário" />
              <Group justify="flex-end" mt="xs">
                <Button size="compact-md" disabled={!comment.trim()} onClick={sendComment}>Responder</Button>
              </Group>
            </Paper>
            <Button variant="default" onClick={() => { toast.success('Carrinho salvo', 'Continue quando quiser em Meus carrinhos.'); onNavigate('carts'); }}>
              Salvar e sair
            </Button>
            <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('history')} ta="center">Ver pedidos anteriores</Anchor>
          </Stack>
        </Grid.Col>
      </Grid>

      <Modal opened={exceptionOpen} onClose={() => setExceptionOpen(false)} centered title={<Text fw={600}>Aprovar exceção à grade mínima</Text>}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">{pairsText(pairs)} de {CART_PARAMS.minOrderPairs}. A exceção fica registrada com o motivo e aparece como "Exceção aprovada por {repName}".</Text>
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
