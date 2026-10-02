import { useEffect, useMemo, useState } from "react";
import {
  Badge, Box, Button, Divider, Group, Menu, Modal, NumberInput, Paper, SimpleGrid, Stack, Text, Title, Tooltip,
} from "@mantine/core";
import { CaretDownIcon, CheckIcon, PlusIcon, ShoppingCartIcon, SparkleIcon, TruckIcon } from "@phosphor-icons/react";
import { formatCurrency, products, type Product } from "../data/mockData";
import {
  CART_PARAMS, addToCart, cartPairs, cartStatus, createCart, getCart, isEditableBy, pairsOf, resolveTargetCart,
  setLineSizes, setTargetCart, statusLabel, useCartStore, type Cart,
} from "../data/cartStore";
import {
  SEVERITY_META, SIGNAL_META, actByText, curveLabel, marginLabel, markupLabel, pairsText, productDisplayName,
  splitBySizeCurve, suggestedGrade, updatedText, useRadar, type RadarSignal,
} from "../data/radar";
import { toast } from "../lib/toast";
import { useShop, type GradeRequest } from "../lib/shop";
import { useSmallerThan } from "../lib/responsive";

// Grade por numeração: todo caminho de "Adicionar" passa por aqui (BR-20). Abre preenchida com
// a sugestão do Radar quando o produto tem sinal (BR-21), editável, com a disponibilidade de cada
// numeração (BR-22): numeração esgotada não pode ser escolhida e nada passa do disponível.

const sumSizes = pairsOf;

export function SizeGradeEditor({ product, value, onChange, suggestion }: {
  product: Product;
  value: Record<string, number>;
  onChange: (v: Record<string, number>) => void;
  suggestion?: { sizes: Record<string, number>; curve: 'loja' | 'regional'; qty: number } | null;
}) {
  const sizes = Object.keys(product.grades);
  const total = sumSizes(value);
  const [totalInput, setTotalInput] = useState<number | string>('');
  const curve = splitBySizeCurve(product, 1).curve;

  const set = (s: string, v: number) => {
    const max = product.grades[s];
    onChange({ ...value, [s]: Math.max(0, Math.min(max, Math.floor(v || 0))) });
  };
  const distribute = () => {
    const n = Number(totalInput) || 0;
    onChange(splitBySizeCurve(product, n).sizes);
  };

  return (
    <Stack gap="sm">
      {/* Total de pares + distribuir pela curva (a curva usada fica escrita — BR-14) */}
      <Group gap="sm" align="flex-end" wrap="wrap">
        <NumberInput
          label="Total de pares"
          value={totalInput}
          onChange={setTotalInput}
          min={0}
          w={140}
          placeholder={String(total || 0)}
          hideControls
        />
        <Button variant="default" onClick={distribute} disabled={!Number(totalInput)}>Distribuir</Button>
        {suggestion && (
          <Button variant="default" leftSection={<SparkleIcon size={16} />} onClick={() => onChange(suggestion.sizes)}>
            Preencher sugestão ({suggestion.qty})
          </Button>
        )}
        {total > 0 && (
          <Button variant="subtle" color="neutral" onClick={() => onChange({})}>Limpar</Button>
        )}
      </Group>
      <Text size="sm" c="dimmed">Distribuir usa a {curveLabel(curve)}.</Text>

      <SimpleGrid cols={{ base: 3, xs: 4, sm: 6 }} spacing="xs" verticalSpacing="xs">
        {sizes.map(s => {
          const avail = product.grades[s];
          const soldOut = avail === 0;
          const suggested = suggestion?.sizes[s] ?? 0;
          return (
            <Paper key={s} withBorder p={6} bg={soldOut ? 'var(--mantine-color-default-hover)' : undefined}>
              <Group justify="space-between" gap={4} wrap="nowrap" mb={4}>
                <Text fw={600} size="sm">Nº {s}</Text>
                {suggested > 0 && (
                  <Tooltip label={`Sugestão do Radar: ${pairsText(suggested)}`}>
                    <Badge size="xs" variant="light" color="teal" aria-label={`Sugestão ${suggested}`}>{suggested}</Badge>
                  </Tooltip>
                )}
              </Group>
              <NumberInput
                value={value[s] ?? 0}
                onChange={v => set(s, Number(v))}
                min={0}
                max={avail}
                disabled={soldOut}
                size="sm"
                aria-label={`Pares no Nº ${s}`}
                styles={{ input: { textAlign: 'right' } }}
              />
              <Text size="xs" c={soldOut ? 'red.7' : 'dimmed'} mt={4}>
                {soldOut ? 'Esgotado' : `${avail} disp.`}
              </Text>
            </Paper>
          );
        })}
      </SimpleGrid>
      {/* Legenda: status nunca só por cor */}
      <Group gap="md">
        <Group gap={4}><Badge size="xs" variant="light" color="teal">n</Badge><Text size="sm" c="dimmed">Sugestão do Radar</Text></Group>
        <Text size="sm" c="dimmed">disp. = pares disponíveis na fábrica</Text>
        <Text size="sm" c="red.7">Esgotado = não pode ser escolhido</Text>
      </Group>
    </Stack>
  );
}

/** Resumo abaixo da grade (FR-306): pares, valor (pares × Seu custo) e prazo de entrega. */
export function GradeOrderSummary({ product, sizes }: { product: Product; sizes: Record<string, number> }) {
  const n = sumSizes(sizes);
  return (
    <Group gap="lg" wrap="wrap">
      <Box>
        <Text size="sm" c="dimmed">Pares</Text>
        <Text fw={700} className="mono">{n}</Text>
      </Box>
      <Box>
        <Text size="sm" c="dimmed">Valor ({pairsText(n)} × Seu custo)</Text>
        <Text fw={700} className="mono">{formatCurrency(n * product.price)}</Text>
      </Box>
      <Group gap={6} wrap="nowrap">
        <TruckIcon size={18} />
        <Text size="sm">{CART_PARAMS.leadTimeLabel}</Text>
      </Group>
    </Group>
  );
}

/** "Vai para: Coleção Inverno · trocar" (FR-307 / FR-403). */
export function TargetCartPicker({ cart, clientId }: { cart: Cart | null; clientId: string | null }) {
  const { carts } = useCartStore();
  const { role } = useShop();
  const options = carts.filter(c => c.clientId === clientId && isEditableBy(c, role));
  return (
    <Group gap={4} wrap="wrap">
      <Text size="sm" c="dimmed">Vai para:</Text>
      <Text size="sm" fw={600}>{cart ? cart.cartName : 'Novo carrinho'}</Text>
      {cart && <Text size="sm" c="dimmed">· {cartPairs(cart)}/{CART_PARAMS.minOrderPairs} pares</Text>}
      <Menu position="bottom-start" withinPortal shadow="md" width={300}>
        <Menu.Target>
          <Button variant="subtle" color="neutral" size="compact-sm" rightSection={<CaretDownIcon size={14} />}>trocar</Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Carrinhos que aceitam itens</Menu.Label>
          {options.map(c => (
            <Menu.Item
              key={c.id}
              onClick={() => setTargetCart(c.id)}
              rightSection={cart?.id === c.id ? <CheckIcon size={14} /> : null}
            >
              <Text size="sm" fw={600}>{c.cartName}</Text>
              <Text size="xs" c="dimmed">{statusLabel(cartStatus(c), c.rep)} · {pairsText(cartPairs(c))}</Text>
            </Menu.Item>
          ))}
          {options.length > 0 && <Menu.Divider />}
          <Menu.Item
            leftSection={<PlusIcon size={14} />}
            disabled={!clientId}
            onClick={() => clientId && createCart({ clientId, createdBy: role })}
          >
            Criar novo carrinho
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

/** Bloco do sinal do Radar: o mesmo sinal, prazo e quantidade do cartão do Radar (FR-304). */
export function SignalLine({ signal }: { signal: RadarSignal }) {
  const sev = SEVERITY_META[signal.severity];
  return (
    <Paper p="sm" bg={`var(--mantine-color-${sev.color}-light)`}>
      <Group gap="xs" wrap="wrap">
        <Badge color={sev.color} variant="filled">{sev.label}</Badge>
        <Text fw={600}>{SIGNAL_META[signal.type].label} · {signal.timeText}</Text>
        <Text size="sm" c="dimmed">· {actByText(signal.actByDays)}</Text>
      </Group>
      <Text size="sm" mt={4}>{signal.context}</Text>
      {signal.suggestion && <Text size="sm" fw={600} mt={4}>{signal.suggestion}</Text>}
      <Text size="xs" c="dimmed" mt={4}>{updatedText(signal.updatedHoursAgo)}</Text>
    </Paper>
  );
}

/** Adiciona ao carrinho de destino (ou cria um) e avisa com os novos totais e "Ver carrinho" (FR-309). */
export function useCommitAdd() {
  const { role, clientId, openCart } = useShop();
  return (product: Product, sizes: Record<string, number>, cartId?: string | null) => {
    if (!clientId) {
      toast.error('Selecione um cliente antes de adicionar', 'Os carrinhos ficam vinculados a um cliente.');
      return false;
    }
    const target = (cartId && getCart(cartId)) || resolveTargetCart(clientId, role) || createCart({ clientId, createdBy: role });
    addToCart(target.id, product.id, sizes, role);
    const updated = getCart(target.id)!;
    const n = cartPairs(updated);
    const missing = CART_PARAMS.minOrderPairs - n;
    toast.successWithAction(
      `${pairsText(sumSizes(sizes))} de ${productDisplayName(product)} em "${updated.cartName}"`,
      `Carrinho com ${pairsText(n)} · ${formatCurrency(updated.lines.reduce((a, l) => a + sumSizes(l.sizes) * (products.find(p => p.id === l.productId)?.price ?? 0), 0))}${missing > 0 ? ` · faltam ${missing} para a grade mínima` : ''}.`,
      { label: 'Ver carrinho', onClick: () => openCart(updated.id) },
    );
    return true;
  };
}

/** Folha da grade usada no Catálogo, na gaveta, nos combos e na edição de linha do carrinho. */
export function GradeSheet({ request, onClose }: { request: GradeRequest | null; onClose: () => void }) {
  const product = products.find(p => p.id === request?.productId);
  const radar = useRadar();
  const { carts } = useCartStore();
  const { role, clientId } = useShop();
  const fullScreen = useSmallerThan('sm');
  const commit = useCommitAdd();
  const suggestion = useMemo(() => (product ? suggestedGrade(product, radar) : null), [product, radar]);
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [touched, setTouched] = useState(false);

  // abre com a grade da linha (editar), a sugestão do Radar (adicionar) ou vazia
  useEffect(() => {
    if (!product || !request) return;
    setTouched(false);
    if (request.initial) {
      const base = { ...request.initial };
      if (request.extraPairs) {
        const extra = splitBySizeCurve(product, request.extraPairs).sizes;
        Object.entries(extra).forEach(([s, q]) => { base[s] = Math.min(product.grades[s], (base[s] ?? 0) + q); });
      }
      setSizes(base);
    } else setSizes(suggestion?.sizes ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  if (!request || !product) return null;
  const editing = request.mode === 'edit' && request.cartId;
  const signal = radar.byProduct[product.id];
  const target = request.cartId ? getCart(request.cartId) ?? null : (clientId ? resolveTargetCart(clientId, role) : null);
  void carts; // re-render quando o destino muda
  const n = sumSizes(sizes);

  const submit = () => {
    if (n === 0 && !editing) { setTouched(true); return; }
    if (editing) {
      setLineSizes(request.cartId!, product.id, sizes, role);
      toast.success('Grade atualizada', `${productDisplayName(product)}: ${pairsText(n)}.`);
    } else if (!commit(product, sizes, target?.id)) return;
    onClose();
  };

  return (
    <Modal
      opened
      onClose={onClose}
      size="48rem"
      fullScreen={fullScreen}
      centered
      title={<Text fw={600} c="dimmed" size="sm">{product.category} · {product.line} · {product.reference}</Text>}
    >
      <Stack gap="md">
        <Box>
          <Title order={3}>{productDisplayName(product)}</Title>
          <Group gap="sm" mt={4}>
            <Text className="mono" fw={700}>{formatCurrency(product.price)}</Text>
            <Text size="sm" c="dimmed">Seu custo/par</Text>
            <Tooltip label={markupLabel(product)}>
              <Badge variant="light" color="neutral">{marginLabel(product)}</Badge>
            </Tooltip>
          </Group>
        </Box>
        {signal && !editing && <SignalLine signal={signal} />}
        <SizeGradeEditor product={product} value={sizes} onChange={v => { setSizes(v); setTouched(false); }} suggestion={suggestion} />
        <Divider />
        <GradeOrderSummary product={product} sizes={sizes} />
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          {editing
            ? <Text size="sm" c="dimmed">Editando a grade em <Text span fw={600} c="var(--mantine-color-text)" inherit>{target?.cartName}</Text></Text>
            : request.cartId
              ? <Text size="sm" c="dimmed">Vai para: <Text span fw={600} c="var(--mantine-color-text)" inherit>{target?.cartName}</Text></Text>
              : <TargetCartPicker cart={target} clientId={clientId} />}
          <Group gap="sm" ml="auto">
            <Button variant="default" onClick={onClose}>Cancelar</Button>
            <Button onClick={submit} leftSection={<ShoppingCartIcon size={18} />}>
              {editing ? 'Salvar grade' : 'Adicionar ao carrinho'}
            </Button>
          </Group>
        </Group>
        {touched && n === 0 && <Text c="red.7" size="sm" ta="right">Selecione ao menos 1 par</Text>}
      </Stack>
    </Modal>
  );
}

