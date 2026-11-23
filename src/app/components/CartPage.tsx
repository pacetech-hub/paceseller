import { useRef, useState } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, Textarea, Badge, ThemeIcon, Grid, Image, Modal, Radio, ActionIcon, TextInput,
  Divider, Skeleton, Switch, Collapse, NumberInput, Select, Anchor, UnstyledButton, Avatar,
} from "@mantine/core";
import {
  ShoppingCartIcon, PlusIcon, CheckIcon, CaretDownIcon, CaretUpIcon, PackageIcon, ArrowRightIcon, ArrowLeftIcon,
  PaperPlaneTiltIcon, ChatCircleIcon, PencilSimpleIcon, CreditCardIcon, ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import {
  CART_PARAMS, addComment, approveMinimumException, approveRepSuggestion, autoSendText, cartPairs, cartStatus, cartValue,
  confirmPayment, createCart, getCart, isEditableBy, isOpen, lineValue, pairsOf, productById, removeLine, repConfirmConditions,
  renameCart, repFirstName, sendToRep, setAutoSend, setRepCanEdit, statusColorFor, statusLabelFor, toContext, useCartStore,
  type Cart, type CartContext, type CartCreator,
} from "../data/cartStore";
import { belowLastYear, cartMarginPct, mixCheck, pairsText, productDisplayName, useRadar } from "../data/radar";
import { useShop } from "../lib/shop";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import classes from "./CartPage.module.css";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'radar';

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

/** Faixa de numeração da linha (ex.: "36–40"). */
const sizeRange = (sizes: Record<string, number>) => {
  const n = Object.entries(sizes).filter(([, q]) => q > 0).map(([s]) => Number(s)).sort((x, y) => x - y);
  return n.length === 0 ? '—' : n[0] === n[n.length - 1] ? String(n[0]) : `${n[0]}–${n[n.length - 1]}`;
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
    <Paper withBorder px="md" py="sm">
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <ProductThumb src={p.image} alt={p.name} size={44} />
        <Box miw={0} flex={1}>
          <Text fw={600} size="sm">{productDisplayName(p)}</Text>
          <UnstyledButton onClick={() => setOpen(o => !o)} mt={2} aria-expanded={open} aria-label={`${open ? 'Ocultar' : 'Ver'} numeração de ${p.name}`}>
            <Group gap={4} wrap="nowrap">
              <Text fz={12} ff="monospace" c="dimmed">qtd {n} · grade {sizeRange(sizes)}</Text>
              {open ? <CaretUpIcon size={12} /> : <CaretDownIcon size={12} />}
            </Group>
          </UnstyledButton>
          {/* BR-07: desconto por linha com preço antigo, novo e percentual */}
          {discountPct > 0 && (
            <Group gap={6} mt={2}>
              <Text size="xs" c="dimmed" td="line-through" className="mono">{formatCurrency(p.price)}</Text>
              <Text size="xs" fw={600} className="mono">{formatCurrency(newUnit)}/par</Text>
              <Badge size="xs" variant="light" color="teal">-{discountPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</Badge>
            </Group>
          )}
        </Box>
        <Stack gap={2} align="flex-end" flex="none">
          <Text className="mono" size="sm" fw={600}>{formatCurrency(value * (1 - discountPct / 100))}</Text>
          {editable && (
            <Group gap="sm">
              <Anchor component="button" type="button" size="xs" onClick={() => openGrade({ productId, mode: 'edit', cartId: cart.id, initial: sizes })}>
                Editar grade
              </Anchor>
              <Anchor component="button" type="button" size="xs" c="red.7" onClick={() => removeLine(cart.id, productId, role)} aria-label={`Remover ${p.name} do carrinho`}>
                Remover
              </Anchor>
            </Group>
          )}
        </Stack>
      </Group>
      <Collapse in={open}>
        <Group gap="xs" mt="sm">
          {Object.entries(sizes).sort(([x], [y]) => Number(x) - Number(y)).map(([sz, q]) => (
            <Paper key={sz} withBorder px="xs" py={2} bg="var(--mantine-color-default-hover)">
              <Text size="xs"><Text span c="dimmed" inherit>Nº {sz}</Text> · <Text span fw={600} className="mono" inherit>{q}</Text></Text>
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
  const { openGrade, actorName } = useShop();
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
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

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
    addComment(cart.id, viewerRole, viewerRole === 'lojista' ? 'Você' : actorName ?? cart.rep, comment);
    setComment('');
  };
  const newCart = () => {
    const c = createCart({ clientId: cart.clientId, createdBy: viewerRole });
    onSwitchCart(toContext(c));
  };

  const otherSide = viewerRole === 'lojista' ? cart.rep : cart.clientName;
  const sharedNow = cart.stage !== 'montagem' || cart.createdBy === 'rep';
  // o que falta acontecer, dito por quem olha (ao lado da ação principal)
  const waitingText = (() => {
    switch (status) {
      case 'aguardando-rep': return viewerRole === 'rep' ? 'O cliente espera suas condições' : `Aguardando ${repName} confirmar`;
      case 'aguardando-voce': return viewerRole === 'rep' ? 'Aguardando o lojista revisar' : `${repName} espera sua revisão`;
      case 'aguardando-pagamento': return viewerRole === 'rep' ? `Aguardando ${cart.clientName} pagar` : 'Condições confirmadas';
      case 'pronto': return viewerRole === 'rep' ? 'O lojista ainda não enviou' : 'Pronto pra enviar';
      default: return viewerRole === 'rep' ? 'O lojista está montando' : 'Em montagem';
    }
  })();

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* BR-72: caminho até o carrinho */}
      <Group gap={8} component="nav" aria-label="Caminho" mb="lg">
        {viewerRole === 'rep' && (
          <>
            <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('radar')}>Radar</Anchor>
            <Text size="sm" c="dimmed" aria-hidden>/</Text>
          </>
        )}
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('carts')}>{viewerRole === 'rep' ? cart.clientName : 'Meus carrinhos'}</Anchor>
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
                    {status === 'aguardando-pagamento' ? `30/60/90 dias ou à vista com ${CART_PARAMS.cashDiscountPct}%` : `Condição a confirmar com ${repName}`} · {CART_PARAMS.leadTimeLabel}
                  </Text>
                </Box>
                <Group gap="md" wrap="wrap">
                  {editable && !paying && <Anchor component="button" type="button" size="sm" fw={600} onClick={() => onNavigate('catalog')}>Adicionar produtos</Anchor>}
                  <Anchor component="button" type="button" size="sm" fw={600} onClick={talkToRep}>Falar com {viewerRole === 'lojista' ? cart.rep : cart.clientName}</Anchor>
                  <Badge variant="outline" color={statusColorFor(status, viewerRole)} radius="sm" ff="monospace" styles={{ label: { textTransform: 'none', fontWeight: 500 } }}>
                    {statusLabelFor(status, cart, viewerRole)}
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
                    {cart.lines.map(l => (
                      <LineItem key={l.productId} cart={cart} productId={l.productId} sizes={l.sizes} editable={editable && !paying} discountPct={discountPct} />
                    ))}
                  </Stack>
                )}
              </Box>

              {cart.lines.length > 0 && (
                <Group justify="space-between" align="center" wrap="wrap" gap="sm" px={{ base: 'md', sm: 'lg' }} py="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                  <Box>
                    <Text className="mono" fw={700}>{discountPct > 0 ? 'Total' : 'Subtotal'}: {formatCurrency(total)}</Text>
                    {discountPct > 0 && <Text size="xs" c="teal.7" className="mono">Desconto à vista nas linhas: -{formatCurrency(subtotal - total)}</Text>}
                    {margin !== null && <Text size="xs" c="dimmed">Margem do carrinho {margin}% no PDV sugerido · Seu custo, sem impostos e sem frete</Text>}
                  </Box>
                  <Group gap="md" wrap="wrap" justify="flex-end">
                    <Text size="sm" c="dimmed">{waitingText}</Text>
                    {primary && (
                      <Button onClick={primary.run} disabled={'disabled' in primary && primary.disabled} leftSection={<primary.icon size={16} />}>
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
                  <Group justify="space-between" wrap="wrap" gap="xs" px={{ base: 'md', sm: 'lg' }} py={8} bg="var(--mantine-color-yellow-light)">
                    <Text fz={12} ff="monospace" c="yellow.9">
                      {pairs}/{CART_PARAMS.minOrderPairs} pares — faltam {CART_PARAMS.minOrderPairs - pairs} para a grade mínima; abaixo dela o carrinho não pode ser enviado nem confirmado
                    </Text>
                    {viewerRole === 'rep' && <Anchor component="button" type="button" size="xs" fw={600} onClick={() => setExceptionOpen(true)}>Aprovar exceção</Anchor>}
                  </Group>
                )
              )}
            </Paper>

            {status === 'aguardando-rep' && (
              <Text size="sm" c="dimmed">{viewerRole === 'lojista' ? `${repName} está revisando as condições comerciais. O pagamento abre quando ele confirmar.` : 'Revise as condições e confirme para liberar o pagamento ao lojista.'}</Text>
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

            {/* FR-607: conversa do carrinho; cada edição do representante aparece aqui */}
            <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
              <Group gap="xs" mb="sm"><ChatCircleIcon size={18} /><Title order={3}>Conversa com {viewerRole === 'lojista' ? repName : cart.clientName}</Title></Group>
              <Stack gap="sm" mah={360} style={{ overflowY: 'auto' }}>
                {cart.comments.length === 0 && <Text size="sm" c="dimmed">Nenhuma mensagem ainda.</Text>}
                {cart.comments.map(cm => (
                  <Group key={cm.id} gap="xs" align="flex-start" wrap="nowrap">
                    <Avatar size={28} radius="xl" color="brand" variant={cm.author === viewerRole ? 'filled' : 'light'}>{cm.name === 'Você' ? 'V' : cm.name[0]}</Avatar>
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
              <Textarea ref={commentRef} mt="md" placeholder={`Escreva para ${viewerRole === 'lojista' ? repName : 'o lojista'}`} value={comment} onChange={e => setComment(e.currentTarget.value)} autosize minRows={2} maxLength={500} aria-label="Nova mensagem" />
              <Group justify="flex-end" mt="xs">
                <Button size="compact-md" disabled={!comment.trim()} onClick={sendComment}>Responder</Button>
              </Group>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Lateral: o carrinho em números, quem vê e pode editar, e para onde seguir */}
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
                  <Text fz={12} ff="monospace" tt="uppercase" lts={0.6} c="dimmed" truncate>Carrinho: {cart.cartName}</Text>
                  <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => { setNameDraft(cart.cartName); setRenaming(true); }} aria-label="Renomear carrinho">
                    <PencilSimpleIcon size={14} />
                  </ActionIcon>
                </Group>
              )}
              <Text fz={28} fw={700} lh={1.2} mt={4}>{pairsText(pairs)}</Text>
              <Text className="mono" size="sm" c="dimmed">{formatCurrency(total)}</Text>
            </Box>

            <Paper withBorder p="sm">
              <Text size="sm">
                {sharedNow
                  ? `Compartilhado com ${otherSide} — ${viewerRole === 'lojista' ? 'ele' : 'a loja'} já pode ver e decidir.`
                  : viewerRole === 'lojista'
                    ? `Só você vê este carrinho por enquanto. Ele vai para ${repName} quando você enviar.`
                    : 'Rascunho do lojista: ele ainda não enviou para você.'}
              </Text>
              {cart.createdBy === 'rep' && <Text size="xs" c="dimmed" mt={4}>Montado por {repName}</Text>}
            </Paper>

            {/* FR-602: permissão de edição do representante (só o lojista muda) */}
            <Switch
              checked={cart.repCanEdit}
              disabled={viewerRole !== 'lojista'}
              onChange={e => setRepCanEdit(cart.id, e.currentTarget.checked)}
              color="teal"
              label={viewerRole === 'lojista' ? `${repName} pode editar este carrinho` : 'Você pode editar este carrinho'}
              description={cart.repCanEdit ? 'Cada edição avisa o lojista e fica na conversa' : viewerRole === 'rep' ? 'Só o lojista libera a edição' : undefined}
            />

            {status === 'pronto' && viewerRole === 'lojista' && (
              <Box>
                <Switch checked={cart.autoSend} onChange={e => setAutoSend(cart.id, e.currentTarget.checked)} label="Envio automático" color="teal" />
                {auto && <Text size="xs" c="dimmed" mt={4}>{auto}</Text>}
              </Box>
            )}

            <Anchor component="button" type="button" size="sm" fw={600} onClick={() => onNavigate('catalog')} ta="center">
              <Group gap={4} justify="center" wrap="nowrap"><ArrowLeftIcon size={14} />Continuar comprando</Group>
            </Anchor>

            {/* FR-601: outros carrinhos abertos desta loja */}
            {siblings.length > 1 && (
              <Box>
                <Text fz={12} ff="monospace" tt="uppercase" lts={0.6} c="dimmed" mb={6}>Outros carrinhos desta loja</Text>
                <Stack gap={4}>
                  {siblings.filter(c => c.id !== cart.id).map(c => (
                    <UnstyledButton key={c.id} onClick={() => { setPaying(false); onSwitchCart(toContext(c)); }} className={classes.siblingCart}>
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
