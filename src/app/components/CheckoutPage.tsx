import { useEffect, useMemo, useState } from "react";
import {
  Anchor, Box, Button, Checkbox, Code, Grid, Group, Modal, NumberInput, Paper, SegmentedControl, Select, SimpleGrid, Stack, Text,
  ThemeIcon, Title,
} from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import {
  ArrowRightIcon, BarcodeIcon, CaretRightIcon, CheckIcon, ClockIcon, CreditCardIcon, FileTextIcon, PixLogoIcon, ShoppingCartIcon,
  type Icon,
} from "@phosphor-icons/react";
import { clients, formatCurrency } from "../data/mockData";
import { CART_PARAMS, cartPairs, cartValue, confirmPayment, getCart, repFirstName, type CartContext } from "../data/cartStore";
import { pairsText } from "../data/radar";
import { buildPixCode, copyToClipboard, PixQrCode } from "./BoletosPage";
import { Eyebrow } from "./CartParts";
import { EmptyState } from "./ui/EmptyState";
import interactive from "./interactive.module.css";
import boletos from "./BoletosPage.module.css";
import classes from "./CartPage.module.css";

// Pagamento do pedido (lojista): abre só depois que o representante confirma as condições.
// O carrinho fecha como um pedido único; o valor pode ser dividido entre PIX, cartão e boleto.

type View = 'radar' | 'carts' | 'cart' | 'history';
type Condition = 'prazo' | 'avista';
type Method = 'pix' | 'cartao' | 'boleto';

const METHODS: { value: Method; label: string; hint: string; icon: Icon }[] = [
  { value: 'pix', label: 'PIX', hint: 'Aprovação imediata', icon: PixLogoIcon },
  { value: 'cartao', label: 'Cartão de crédito', hint: 'Em até 3x sem juros', icon: CreditCardIcon },
  { value: 'boleto', label: 'Boleto bancário', hint: 'Compensa em até 2 dias úteis', icon: BarcodeIcon },
];
const methodLabel = (m: Method) => METHODS.find(x => x.value === m)!.label;
const PIX_MINUTES = 30;
const LEAD_DAYS = Number(CART_PARAMS.leadTimeLabel.match(/\d+/)?.[0] ?? 15);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Divide o total em partes iguais (centavos que sobram vão para a primeira). */
function evenSplit(methods: Method[], total: number): Record<Method, number> {
  const out = {} as Record<Method, number>;
  if (methods.length === 0) return out;
  const part = Math.floor((total / methods.length) * 100) / 100;
  methods.forEach((m, i) => { out[m] = i === 0 ? round2(total - part * (methods.length - 1)) : part; });
  return out;
}

function PixPanel({ seed, amount }: { seed: string; amount: number }) {
  const code = useMemo(() => buildPixCode(seed, amount), [seed, amount]);
  const [left, setLeft] = useState(PIX_MINUTES * 60);
  const interval = useInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
  useEffect(() => { interval.start(); return interval.stop; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <Group align="flex-start" gap="lg" wrap="wrap">
      <Paper withBorder p="md" bg="white" flex="none">
        <PixQrCode data={code} size={128} />
      </Paper>
      <Stack gap="xs" flex={1} miw={220}>
        <Box>
          <Text fw={600}>Escaneie ou copie o código</Text>
          <Text size="sm" c="dimmed">O pedido é confirmado automaticamente assim que o pagamento cair</Text>
        </Box>
        <Code block fz="xs" className={boletos.wrap} c="dimmed" bg="var(--mantine-color-body)" style={{ border: '1px solid var(--mantine-color-default-border)' }}>{code}</Code>
        <Group gap="md" wrap="wrap">
          <Button variant="default" onClick={() => copyToClipboard(code, 'Código Pix')}>Copiar código</Button>
        </Group>
        <Group gap={6} c={left > 0 ? 'red.7' : 'dimmed'}>
          <ClockIcon size={14} />
          <Text size="sm" ff="monospace" inherit>{left > 0 ? `Expira em ${mm}:${ss}` : 'Código expirado — confirme o pedido para gerar outro'}</Text>
        </Group>
      </Stack>
    </Group>
  );
}

function CardPanel({ amount, installments, onInstallments }: { amount: number; installments: string; onInstallments: (v: string) => void }) {
  return (
    <Stack gap="xs">
      <Text fw={600}>Cartão de crédito</Text>
      <Select
        label="Parcelas"
        data={[1, 2, 3].map(n => ({ value: String(n), label: `${n}x de ${formatCurrency(amount / n)} sem juros` }))}
        value={installments}
        onChange={v => v && onInstallments(v)}
        allowDeselect={false}
        maw={320}
      />
      <Text size="sm" c="dimmed">Os dados do cartão são pedidos na tela segura do banco, depois de confirmar o pedido.</Text>
    </Stack>
  );
}

function BoletoPanel({ amount, condition }: { amount: number; condition: Condition }) {
  const parts = condition === 'prazo' ? [30, 60, 90] : [2];
  return (
    <Stack gap="xs">
      <Text fw={600}>Boleto bancário</Text>
      <Text size="sm" c="dimmed">
        {condition === 'prazo'
          ? `3 boletos de ${formatCurrency(amount / 3)}, com vencimento em 30, 60 e 90 dias.`
          : `1 boleto de ${formatCurrency(amount)}, com vencimento em 2 dias úteis.`}{' '}
        Ficam em Pagamentos e boletos logo após a confirmação.
      </Text>
      <Group gap="xs">
        {parts.map(d => (
          <Paper key={d} withBorder px="xs" py={2}><Text size="xs" ff="monospace">{condition === 'prazo' ? `${d} dias` : `${d} dias úteis`}</Text></Paper>
        ))}
      </Group>
    </Stack>
  );
}

export function CheckoutPage({ cartContext, onNavigate }: { cartContext: CartContext | null; onNavigate: (view: View) => void }) {
  const cart = getCart(cartContext?.id) ?? null;
  const client = clients.find(c => c.id === cart?.clientId);
  const [condition, setCondition] = useState<Condition>('prazo');
  const [methods, setMethods] = useState<Method[]>(['pix']);
  const [amounts, setAmounts] = useState<Record<Method, number>>({} as Record<Method, number>);
  const [installments, setInstallments] = useState('3');
  const addresses = client
    ? [`${client.address} · ${client.city}, ${client.state}`, `Depósito da loja · ${client.city}, ${client.state}`]
    : ['Endereço cadastrado da loja'];
  const [address, setAddress] = useState(addresses[0]);
  const [delivery, setDelivery] = useState('padrao');
  const [docsOpen, setDocsOpen] = useState(false);
  const [doneOrder, setDoneOrder] = useState<string | null>(null);

  const subtotal = cart ? cartValue(cart) : 0;
  const discountPct = condition === 'avista' ? CART_PARAMS.cashDiscountPct : 0;
  const total = round2(subtotal * (1 - discountPct / 100));

  // a divisão recomeça igual quando muda a forma ou o total
  useEffect(() => { setAmounts(evenSplit(methods, total)); }, [methods, total]);

  if (doneOrder) {
    return (
      <Stack align="center" justify="center" p={{ base: 'md', sm: 'lg' }} mih="60vh">
        <Stack align="center" gap={0} maw={420} ta="center">
          <ThemeIcon variant="light" color="teal" size={64} mb="lg"><CheckIcon size={32} /></ThemeIcon>
          <Title order={1}>Pedido confirmado</Title>
          <Text c="dimmed" mt="xs">Pedido <Text span fw={600} c="var(--mantine-color-text)" className="mono" inherit>{doneOrder}</Text></Text>
          <Text mt="md">O carrinho saiu de Meus carrinhos e agora aparece em Pedidos. Nota fiscal e contrato chegam no seu e-mail. {CART_PARAMS.leadTimeLabel}.</Text>
          <Group gap="sm" mt="xl" justify="center">
            <Button onClick={() => onNavigate('carts')} variant="default">Meus carrinhos</Button>
            <Button onClick={() => onNavigate('history')} rightSection={<ArrowRightIcon size={16} />}>Acompanhar</Button>
          </Group>
        </Stack>
      </Stack>
    );
  }

  if (!cart || cart.stage !== 'aguardando-pagamento') {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={900} mx="auto" w="100%">
        <EmptyState
          icon={ShoppingCartIcon}
          title={cart ? 'Este pedido não está aguardando pagamento' : 'Nenhum pedido para pagar'}
          description={cart ? 'O pagamento abre depois que o representante confirma as condições comerciais.' : 'Escolha um carrinho em Meus carrinhos.'}
          action={cart ? { label: 'Voltar ao carrinho', onClick: () => onNavigate('cart') } : { label: 'Ir para Meus carrinhos', onClick: () => onNavigate('carts') }}
        />
      </Box>
    );
  }

  const pairs = cartPairs(cart);
  const repName = repFirstName(cart.rep);
  const last = methods[methods.length - 1];
  const assigned = methods.slice(0, -1).reduce((a, m) => a + (amounts[m] ?? 0), 0);
  const remainder = round2(total - assigned);
  const share = (m: Method) => (methods.length === 1 ? total : m === last ? remainder : amounts[m] ?? 0);
  const splitValid = methods.length > 0 && remainder >= 0 && methods.every(m => share(m) > 0);
  const toggleMethods = (v: string[]) => setMethods(METHODS.map(m => m.value).filter(m => v.includes(m)));
  const conditionLabel = condition === 'prazo' ? '30/60/90 dias' : `À vista com ${CART_PARAMS.cashDiscountPct}% de desconto`;
  const paymentCondition = `${conditionLabel} · ${methods
    .map(m => `${methodLabel(m)}${m === 'cartao' ? ` ${installments}x` : ''}${methods.length > 1 ? ` ${formatCurrency(share(m))}` : ''}`)
    .join(' + ')}`;

  const confirm = () => {
    const id = confirmPayment(cart.id, paymentCondition, total);
    if (id) setDoneOrder(id);
  };

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <Group gap={8} component="nav" aria-label="Caminho" mb="lg">
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('radar')}>Radar</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('carts')}>Meus carrinhos</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('cart')}>{cart.cartName}</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Text size="sm" fw={600} aria-current="page">Pedido — Pagamento</Text>
      </Group>

      <Grid gutter={{ base: 'lg', lg: 40 }}>
        <Grid.Col span={{ base: 12, lg: 8, xl: 9 }}>
          <Stack gap="lg" maw={560}>
            <Box>
              <Title order={1}>Pagamento — Pedido</Title>
              <Text size="sm" c="dimmed" mt={4}>Pedido único do carrinho “{cart.cartName}”</Text>
            </Box>

            <Paper withBorder p="md" style={{ borderColor: 'var(--mantine-color-brand-9)' }}>
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="gray" size={36}><CreditCardIcon size={18} /></ThemeIcon>
                <Box>
                  <Group gap="xs" align="baseline">
                    <Text fw={600} className="mono">{formatCurrency(total)}</Text>
                    {discountPct > 0 && <Text size="xs" c="dimmed" td="line-through" className="mono">{formatCurrency(subtotal)}</Text>}
                  </Group>
                  <Text size="xs" c="dimmed">Valor deste pedido ({pairsText(pairs)})</Text>
                </Box>
              </Group>
            </Paper>

            {/* Condição: a prazo ou à vista com desconto */}
            <Box>
              <Eyebrow mb="xs">Condição de pagamento</Eyebrow>
              <SegmentedControl
                value={condition}
                onChange={v => setCondition(v as Condition)}
                data={[
                  { value: 'prazo', label: '30/60/90 dias' },
                  { value: 'avista', label: `À vista −${CART_PARAMS.cashDiscountPct}%` },
                ]}
                aria-label="Condição de pagamento"
              />
            </Box>

            {/* Forma: uma ou mais, para dividir o valor */}
            <Box>
              <Group justify="space-between" mb="xs" wrap="wrap" gap={4}>
                <Eyebrow>Forma de pagamento</Eyebrow>
                <Text size="xs" c="dimmed">Selecione uma ou mais pra dividir o valor</Text>
              </Group>
              <Checkbox.Group value={methods} onChange={toggleMethods}>
                <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="xs">
                  {METHODS.map(m => (
                    <Checkbox.Card
                      key={m.value}
                      value={m.value}
                      p="md"
                      pos="relative"
                      className={interactive.choiceCard}
                      disabled={methods.length === 1 && methods[0] === m.value}
                    >
                      <Checkbox.Indicator pos="absolute" top={8} right={8} size="xs" radius="xl" />
                      <Stack gap={6} align="center" ta="center">
                        <m.icon size={22} />
                        <Text size="sm" fw={600}>{m.label}</Text>
                        <Text size="xs" c="dimmed">{m.hint}</Text>
                      </Stack>
                    </Checkbox.Card>
                  ))}
                </SimpleGrid>
              </Checkbox.Group>
            </Box>

            {methods.length > 1 && (
              <Paper withBorder p="md">
                <Text fw={600} mb="xs">Divisão do valor</Text>
                <Stack gap="xs">
                  {methods.map(m => (
                    <Group key={m} justify="space-between" wrap="nowrap" gap="sm">
                      <Text size="sm">{methodLabel(m)}</Text>
                      {m === last ? (
                        <Text size="sm" fw={600} className="mono" c={remainder < 0 ? 'red.7' : undefined}>{formatCurrency(remainder)}</Text>
                      ) : (
                        <NumberInput
                          value={amounts[m] ?? 0}
                          onChange={v => setAmounts(a => ({ ...a, [m]: round2(Number(v) || 0) }))}
                          min={0}
                          max={total}
                          decimalScale={2}
                          fixedDecimalScale
                          decimalSeparator=","
                          thousandSeparator="."
                          prefix="R$ "
                          hideControls
                          w={160}
                          size="sm"
                          aria-label={`Valor no ${methodLabel(m)}`}
                        />
                      )}
                    </Group>
                  ))}
                </Stack>
                <Text size="xs" c={splitValid ? 'dimmed' : 'red.7'} mt="xs">
                  {splitValid ? `${methodLabel(last)} fica com o restante.` : 'Cada forma precisa de um valor maior que zero, sem passar do total.'}
                </Text>
              </Paper>
            )}

            {methods.map(m => (
              <Paper key={m} withBorder p="lg" bg="var(--mantine-color-default-hover)">
                {m === 'pix' && <PixPanel seed={`${cart.id}-${condition}`} amount={share('pix')} />}
                {m === 'cartao' && <CardPanel amount={share('cartao')} installments={installments} onInstallments={setInstallments} />}
                {m === 'boleto' && <BoletoPanel amount={share('boleto')} condition={condition} />}
              </Paper>
            ))}

            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
              <Select label={<Eyebrow span>Endereço de entrega</Eyebrow>} data={addresses} value={address} onChange={v => v && setAddress(v)} allowDeselect={false} />
              <Select
                label={<Eyebrow span>Prazo estimado</Eyebrow>}
                data={[
                  { value: 'padrao', label: `Até ${LEAD_DAYS} dias úteis` },
                  { value: 'expresso', label: `Até ${Math.ceil(LEAD_DAYS / 2)} dias úteis · expresso` },
                ]}
                value={delivery}
                onChange={v => v && setDelivery(v)}
                allowDeselect={false}
              />
            </SimpleGrid>

            <Paper withBorder component="button" type="button" onClick={() => setDocsOpen(true)} p="md" className={`${interactive.cardButton} ${interactive.hoverable}`}>
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color="gray" size={36}><FileTextIcon size={18} /></ThemeIcon>
                <Box flex={1}>
                  <Text size="sm" fw={600}>Nota fiscal e contrato</Text>
                  <Text size="xs" c="dimmed">Gerados automaticamente na confirmação</Text>
                </Box>
                <CaretRightIcon size={14} />
              </Group>
            </Paper>

            <Group gap="sm" wrap="nowrap">
              <Button variant="default" size="lg" onClick={() => onNavigate('cart')}>Voltar ao carrinho</Button>
              <Button size="lg" flex={1} disabled={!splitValid} onClick={confirm}>Confirmar pedido</Button>
            </Group>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4, xl: 3 }}>
          <Stack gap="md" pl={{ lg: 'lg' }} className={classes.cartAside}>
            <Box>
              <Eyebrow truncate>Carrinho: {cart.cartName}</Eyebrow>
              <Text fz={28} fw={600} lh={1.2} mt={4}>{pairsText(pairs)}</Text>
              <Text className="mono" size="sm" c="dimmed">{formatCurrency(total)}</Text>
            </Box>
            <Paper withBorder p="sm">
              <Text size="sm">Compartilhado com <Text span fw={600} inherit>{repName}</Text>, que já confirmou as condições deste pedido</Text>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>

      <Modal opened={docsOpen} onClose={() => setDocsOpen(false)} centered title={<Text fw={600}>Nota fiscal e contrato</Text>}>
        <Stack gap="sm">
          <Text size="sm">Ao confirmar, geramos automaticamente:</Text>
          <Text size="sm">• <Text span fw={600} inherit>Nota fiscal (NF-e)</Text> em nome de {cart.clientName}, com os {pairsText(pairs)} e o valor de {formatCurrency(total)}.</Text>
          <Text size="sm">• <Text span fw={600} inherit>Contrato de compra</Text> com a condição escolhida ({conditionLabel}), o endereço e o prazo de entrega.</Text>
          <Text size="sm" c="dimmed">Os dois chegam no seu e-mail e ficam disponíveis no detalhe do pedido, em Pedidos.</Text>
          <Group justify="flex-end"><Button variant="default" onClick={() => setDocsOpen(false)}>Entendi</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
