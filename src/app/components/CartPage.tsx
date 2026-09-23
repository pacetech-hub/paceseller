import { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, FileText, Check, ChevronRight, Tag, Sparkles, Percent, Store, ChevronLeft, FolderPlus, List, UserCheck } from "lucide-react";
import { products, formatCurrency } from "../data/mockData";
import { priceTables } from "./LojistaFiltersSidebar";
import type { CartContext, CartCreator } from "./CartsListPage";
import {
  ActionIcon, Badge, Box, Button, Center, Checkbox, Divider, Grid, Group, Modal, NativeSelect,
  Paper, Radio, SimpleGrid, Stack, Text, TextInput, Textarea, ThemeIcon, Title, UnstyledButton,
} from "@mantine/core";
import classes from "./CartPage.module.css";

const num = { fontVariantNumeric: 'tabular-nums' } as const;


type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

interface CartPageProps {
  onNavigate: (view: View) => void;
  cartContext?: CartContext | null;
  multiCart?: boolean;
  onCreateNewCart?: (name: string) => void;
  onCartCountChange?: (count: number) => void;
  selectedPriceTable?: string;
  /** Perfil de quem está vendo o carrinho — define quem é "Você" no identificador de criação. */
  viewerRole?: CartCreator;
}

interface CartItem {
  product: typeof products[0];
  sizes: Record<string, number>;
}

const initialCart: CartItem[] = [
  {
    product: products[0],
    sizes: { '39': 4, '40': 6, '41': 4, '42': 2 },
  },
  {
    product: products[3],
    sizes: { '40': 8, '41': 6, '42': 4 },
  },
  {
    product: products[4],
    sizes: { '39': 2, '40': 4, '41': 4 },
  },
];

export const initialCartCount = initialCart.length;

// Condições de pagamento disponíveis por tabela de preço
const paymentOptionsByTable: Record<string, { id: string; label: string; surcharge: number; description?: string }[]> = {
  'padrao': [
    { id: '30-60-90', label: '30/60/90 DDL', surcharge: 0, description: 'Condição padrão' },
    { id: '30-60',    label: '30/60 DDL',    surcharge: 0 },
    { id: '30',       label: '30 DDL',       surcharge: 0 },
    { id: 'avista',   label: 'À vista (PIX/Boleto)', surcharge: -3, description: '3% de desconto adicional' },
  ],
  'avista': [
    { id: 'avista-pix', label: 'PIX',    surcharge: -5, description: '5% de desconto' },
    { id: 'avista-bol', label: 'Boleto', surcharge: -5, description: '5% de desconto' },
  ],
  'promo': [
    { id: '30-60-90', label: '30/60/90 DDL', surcharge: 0 },
    { id: '30-60',    label: '30/60 DDL',    surcharge: 0 },
    { id: 'avista',   label: 'À vista (PIX/Boleto)', surcharge: -3 },
  ],
  'atacado': [
    { id: '30-60-90', label: '30/60/90 DDL', surcharge: 0, description: 'Mín. 50 pares' },
    { id: '60-90',    label: '60/90 DDL',    surcharge: 0 },
    { id: 'avista',   label: 'À vista (PIX/Boleto)', surcharge: -4, description: '4% de desconto' },
  ],
};

// Detalhes comerciais por tabela
const priceTableDetails: Record<string, { discount: number; minOrderValue: number; paymentCondition: string }> = {
  padrao:  { discount: 0,  minOrderValue: 1500, paymentCondition: '30/60/90 DDL' },
  avista:  { discount: 5,  minOrderValue: 500,  paymentCondition: 'PIX ou Boleto' },
  promo:   { discount: 8,  minOrderValue: 1000, paymentCondition: '30/60/90 DDL' },
  atacado: { discount: 12, minOrderValue: 5000, paymentCondition: '60/90 DDL' },
};

// Campanhas ativas por tabela de preço
const campaignsByTable: Record<string, { id: string; name: string; description: string; discount: number }[]> = {
  'padrao': [
    { id: 'mid-year', name: 'Mid Year Boost', description: 'Coleção 2026 · 5% extra em pedidos acima de R$ 5.000', discount: 5 },
  ],
  'avista': [
    { id: 'fidelidade', name: 'Fidelidade Tesla', description: 'Clientes recorrentes · 4% adicional', discount: 4 },
  ],
  'promo': [
    { id: 'lancamento', name: 'Lançamento Coleção', description: 'Desconto especial na coleção atual', discount: 3 },
  ],
  'atacado': [
    { id: 'parceiro', name: 'Parceiro Regional', description: '3% de desconto em grandes volumes', discount: 3 },
  ],
};

export function CartPage({ onNavigate, cartContext, multiCart, onCreateNewCart, onCartCountChange, selectedPriceTable, viewerRole = 'rep' }: CartPageProps) {
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  useEffect(() => { onCartCountChange?.(cart.length); }, [cart.length]);
  const [tableId, setTableId] = useState<string>(selectedPriceTable ?? 'padrao');
  const policy = useMemo(() => priceTables.find(p => p.id === tableId) ?? priceTables[0], [tableId]);
  const paymentOptions = paymentOptionsByTable[tableId] ?? [];
  const campaigns = campaignsByTable[tableId] ?? [];
  const [paymentId, setPaymentId] = useState<string>(paymentOptions[0]?.id ?? '');
  const [campaignIds, setCampaignIds] = useState<string[]>([]);
  const [obs, setObs] = useState('');
  const [step, setStep] = useState<'cart' | 'checkout' | 'done'>('cart');
  const [approvalRequired] = useState(true);
  const [showNewCartDialog, setShowNewCartDialog] = useState(false);
  const [newCartName, setNewCartName] = useState('');

  const selectedPayment = paymentOptions.find(p => p.id === paymentId) ?? paymentOptions[0];

  const updateQty = (productId: string, size: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const newSizes = { ...item.sizes, [size]: Math.max(0, (item.sizes[size] || 0) + delta) };
      if (newSizes[size] === 0) delete newSizes[size];
      return { ...item, sizes: newSizes };
    }).filter(item => Object.keys(item.sizes).length > 0));
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const getItemTotal = (item: CartItem) => {
    const pairs = Object.values(item.sizes).reduce((a, b) => a + b, 0);
    return { pairs, value: pairs * item.product.price };
  };

  const grandTotal = cart.reduce((acc, item) => acc + getItemTotal(item).value, 0);
  const grandPairs = cart.reduce((acc, item) => acc + getItemTotal(item).pairs, 0);
  const IVA_RATE = 0.12;

  const policyDetails = priceTableDetails[tableId] ?? priceTableDetails['padrao'];
  const tableDiscount = (grandTotal * policyDetails.discount) / 100;
  const paymentAdj = (grandTotal * (selectedPayment?.surcharge ?? 0)) / 100;
  const campaignDiscount = campaigns
    .filter(c => campaignIds.includes(c.id))
    .reduce((acc, c) => acc + (grandTotal * c.discount) / 100, 0);
  const discount = tableDiscount + campaignDiscount + Math.max(0, -paymentAdj);
  const finalTotal = grandTotal - tableDiscount - campaignDiscount + paymentAdj;
  const belowMin = finalTotal < policyDetails.minOrderValue;



  if (step === 'done') {
    return (
      <Center p="lg" mih="60vh">
        <Box ta="center" maw={384}>
          <ThemeIcon size={64} radius="xl" color="teal" variant="light" mx="auto" mb={20}>
            <Check size={32} color="var(--mantine-color-teal-6)" />
          </ThemeIcon>
          <Title order={2} fw={700} fz="1.3rem">Pedido enviado para aprovação!</Title>
          <Text c="dimmed" mt="xs" fz="0.85rem">
            Pedido <Text span c="var(--mantine-color-text)" fw={600} inherit style={num}>PED-2026-0413</Text>
          </Text>
          <Text c="dimmed" mt={4} fz="0.82rem">
            {grandPairs} pares · {formatCurrency(finalTotal)}
          </Text>
          <Text c="dimmed" mt="sm" size="sm">Você receberá uma confirmação por e-mail assim que aprovado.</Text>
          <Group gap="sm" mt="lg" justify="center">
            <Button onClick={() => onNavigate('history')} variant="default" fz="0.85rem" fw={500}>
              Ver histórico
            </Button>
            <Button onClick={() => onNavigate('catalog')} fz="0.85rem" fw={600}>
              Continuar comprando
            </Button>
          </Group>
        </Box>
      </Center>
    );
  }

  return (
    <Box p="lg" maw={1400} mx="auto" w="100%">
      {cartContext && (
        <Group justify="space-between" mb="md" gap="sm" wrap="wrap">
          <Group gap="sm" wrap="nowrap" miw={0}>
            <UnstyledButton
              onClick={() => onNavigate('carts')}
              className={classes.textLink}
              fz="0.78rem"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={14} /> Carrinhos
            </UnstyledButton>
            <Divider orientation="vertical" h={20} style={{ alignSelf: 'center' }} />
            <Box miw={0}>
              <Group gap="xs" wrap="wrap">
                <Text truncate fz="1rem" fw={700}>{cartContext.cartName}</Text>
                {cartContext.createdBy && (
                  <Badge
                    variant="light"
                    color={cartContext.createdBy === 'lojista' ? 'teal' : 'yellow'}
                    c={cartContext.createdBy === 'lojista' ? 'teal.7' : 'yellow.8'}
                    radius="sm"
                    tt="none"
                    size="sm"
                    fz="0.65rem"
                    fw={600}
                    px={6}
                    leftSection={cartContext.createdBy === 'lojista' ? <Store size={10} /> : <UserCheck size={10} />}
                    title={cartContext.createdBy === 'lojista' ? 'Carrinho criado pelo lojista' : 'Carrinho criado pelo representante'}
                  >
                    {cartContext.createdBy === viewerRole ? 'Você' : cartContext.createdBy === 'lojista' ? 'Lojista' : 'Representante'}
                  </Badge>
                )}
              </Group>
              <Group gap={6} wrap="nowrap" c="dimmed">
                <Store size={12} />
                <Text truncate fz="0.75rem" c="dimmed">Cliente: <Text span c="var(--mantine-color-text)" fw={600} inherit>{cartContext.clientName}</Text></Text>
              </Group>
            </Box>
          </Group>
          {multiCart && (
            <Group gap="xs">
              <Button
                onClick={() => onNavigate('carts')}
                variant="default"
                size="xs"
                radius="sm"
                c="dimmed"
                fz="0.75rem"
                fw={500}
                leftSection={<List size={14} />}
                title="Selecionar outro carrinho"
              >
                Outros carrinhos
              </Button>
              <Button
                onClick={() => {
                  setNewCartName('');
                  setShowNewCartDialog(true);
                }}
                size="xs"
                radius="sm"
                fz="0.75rem"
                fw={600}
                leftSection={<FolderPlus size={14} />}
                title="Criar outro carrinho para este cliente"
              >
                Novo carrinho
              </Button>
            </Group>
          )}
        </Group>
      )}
      {/* New cart dialog */}
      <Modal
        opened={showNewCartDialog}
        onClose={() => setShowNewCartDialog(false)}
        centered
        size="sm"
        title={
          <Stack gap={4}>
            <Text fw={600} fz="0.95rem">Novo carrinho</Text>
            <Text c="dimmed" fz="0.78rem">
              Criar carrinho para {cartContext?.clientName}
            </Text>
          </Stack>
        }
      >
        <Box py="xs">
          <TextInput
            data-autofocus
            label="Nome do carrinho"
            value={newCartName}
            onChange={e => setNewCartName(e.target.value)}
            placeholder="Ex.: Reposição Inverno 26"
            radius="sm"
            styles={{
              label: { fontSize: '0.72rem', color: 'var(--mantine-color-dimmed)', fontWeight: 400, marginBottom: 12 },
              input: { fontSize: '0.82rem', backgroundColor: 'var(--mantine-color-gray-0)' },
            }}
          />
        </Box>
        <Group justify="flex-end" mt="md" gap="xs">
          <Button
            onClick={() => setShowNewCartDialog(false)}
            variant="default"
            radius="sm"
            c="dimmed"
            fz="0.82rem"
            fw={500}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onCreateNewCart?.(newCartName.trim() || 'Novo carrinho');
              setShowNewCartDialog(false);
              setNewCartName('');
            }}
            radius="sm"
            fz="0.82rem"
            fw={600}
          >
            Criar
          </Button>
        </Group>
      </Modal>
      {/* Step indicator */}
      <Group gap="sm" mb="lg">
        <Button
          onClick={() => setStep('cart')}
          radius="xl"
          variant={step === 'cart' ? 'filled' : 'subtle'}
          c={step === 'cart' ? undefined : 'dimmed'}
          fz="0.82rem"
          fw={600}
          leftSection={<ShoppingCart size={14} />}
        >
          Carrinho ({cart.length})
        </Button>
        <ChevronRight size={16} color="var(--mantine-color-dimmed)" />
        <Button
          onClick={() => cart.length > 0 && setStep('checkout')}
          radius="xl"
          variant={step === 'checkout' ? 'filled' : 'subtle'}
          c={step === 'checkout' ? undefined : 'dimmed'}
          fz="0.82rem"
          fw={600}
          leftSection={<CreditCard size={14} />}
        >
          Checkout
        </Button>
      </Group>

      {cart.length === 0 ? (
        <Stack align="center" justify="center" py={80} ta="center" gap={0}>
          <ShoppingCart size={48} color="var(--mantine-color-gray-4)" style={{ marginBottom: 16 }} />
          <Text fw={600}>Carrinho vazio</Text>
          <Text c="dimmed" mt={4} fz="0.85rem">Adicione produtos do catálogo para criar um pedido.</Text>
          <Button
            onClick={() => onNavigate('catalog')}
            mt="md"
            fz="0.85rem"
            fw={600}
          >
            Ir ao catálogo
          </Button>
        </Stack>
      ) : (
        <Grid gutter={20}>
          {/* Items */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="sm">
            {step === 'cart' ? (
              cart.map(item => {
                const { pairs, value } = getItemTotal(item);
                return (
                  <Paper key={item.product.id} withBorder radius="lg" p="md">
                    <Group align="flex-start" gap="sm" mb="sm" wrap="nowrap">
                      <Box w={64} h={64} bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </Box>
                      <Box flex={1} miw={0}>
                        <Text fz="0.88rem" fw={600}>{item.product.name}</Text>
                        <Text c="dimmed" fz="0.72rem">{item.product.reference} · {formatCurrency(item.product.price)}/par</Text>
                        <Text mt={2} fz="0.85rem" fw={700} style={num}>{formatCurrency(value)}</Text>
                      </Box>
                      <ActionIcon
                        onClick={() => removeItem(item.product.id)}
                        variant="transparent"
                        className={classes.removeBtn}
                        size="md"
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                    </Group>
                    <Group gap="xs">
                      {Object.entries(item.sizes).map(([size, qty]) => (
                        <Group key={size} gap={6} wrap="nowrap" px="xs" py={4} bg="gray.0" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }}>
                          <Text c="dimmed" fz="0.7rem">Nº {size}</Text>
                          <ActionIcon onClick={() => updateQty(item.product.id, size, -1)} variant="transparent" size={20} className={classes.qtyBtn}>
                            <Minus size={10} />
                          </ActionIcon>
                          <Text fz="0.78rem" fw={600} miw={16} ta="center" style={num}>{qty}</Text>
                          <ActionIcon onClick={() => updateQty(item.product.id, size, 1)} variant="transparent" size={20} className={classes.qtyBtn}>
                            <Plus size={10} />
                          </ActionIcon>
                        </Group>
                      ))}
                    </Group>
                    <Text c="dimmed" mt="xs" fz="0.72rem">{pairs} pares neste item</Text>
                  </Paper>
                );
              })
            ) : (
              /* Checkout — Tabela, Condição, Campanhas */
              <Stack gap="md">
                {/* Tabela de preço aplicada */}
                <Paper withBorder radius="lg" p={20}>
                  <Group justify="space-between" mb="sm">
                    <Title order={3} fz="1rem" fw={600} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={16} color="var(--mantine-color-gray-9)" /> Política comercial aplicada
                    </Title>
                    <NativeSelect
                      value={tableId}
                      onChange={e => { setTableId(e.target.value); setPaymentId((paymentOptionsByTable[e.target.value] ?? [])[0]?.id ?? ''); setCampaignIds([]); }}
                      size="xs"
                      radius="sm"
                      styles={{ input: { fontSize: '0.78rem', backgroundColor: 'var(--mantine-color-gray-0)' } }}
                      data={priceTables.map(p => ({ value: p.id, label: `${p.label} — ${p.desc}` }))}
                    />
                  </Group>
                  <SimpleGrid cols={3} spacing="sm">
                    <Box>
                      <Text c="dimmed" fz="0.7rem">Desconto da tabela</Text>
                      <Text mt={2} fz="0.9rem" fw={600} style={num}>{policyDetails.discount === 0 ? 'sem desconto' : `${policyDetails.discount}%`}</Text>
                    </Box>
                    <Box>
                      <Text c="dimmed" fz="0.7rem">Pagamento padrão</Text>
                      <Text mt={2} fz="0.85rem" fw={600}>{policyDetails.paymentCondition}</Text>
                    </Box>
                    <Box>
                      <Text c="dimmed" fz="0.7rem">Pedido mínimo</Text>
                      <Text mt={2} fz="0.85rem" fw={600} style={num}>{formatCurrency(policyDetails.minOrderValue)}</Text>
                    </Box>
                  </SimpleGrid>
                </Paper>

                {/* Condições de pagamento disponíveis */}
                <Paper withBorder radius="lg" p={20}>
                  <Title order={3} fz="1rem" fw={600} mb="sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={16} color="var(--mantine-color-gray-9)" /> Condições de pagamento disponíveis
                  </Title>
                  <Text c="dimmed" mb="sm" fz="0.75rem">
                    Opções habilitadas para a <Text span c="var(--mantine-color-text)" fw={600} inherit>{policy.label}</Text>.
                  </Text>
                  <Stack gap="xs">
                    {paymentOptions.map(opt => {
                      const active = paymentId === opt.id;
                      return (
                        <Box
                          component="label"
                          key={opt.id}
                          className={active ? `${classes.option} ${classes.optionActive}` : classes.option}
                        >
                          <Radio name="payment" checked={active} onChange={() => setPaymentId(opt.id)} size="xs" mt={4} />
                          <Box flex={1}>
                            <Group justify="space-between">
                              <Text fz="0.85rem" fw={600}>{opt.label}</Text>
                              {opt.surcharge !== 0 && (
                                <Text span c={opt.surcharge < 0 ? 'teal.7' : 'yellow.7'} fz="0.75rem" fw={600} style={num}>
                                  {opt.surcharge < 0 ? `${opt.surcharge}%` : `+${opt.surcharge}%`}
                                </Text>
                              )}
                            </Group>
                            {opt.description && <Text c="dimmed" mt={2} fz="0.72rem">{opt.description}</Text>}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>

                {/* Campanhas disponíveis */}
                {campaigns.length > 0 && (
                  <Paper withBorder radius="lg" p={20}>
                    <Title order={3} fz="1rem" fw={600} mb="sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={16} color="var(--mantine-color-gray-9)" /> Campanhas disponíveis
                    </Title>
                    <Stack gap="xs">
                      {campaigns.map(c => {
                        const active = campaignIds.includes(c.id);
                        return (
                          <Box
                            component="label"
                            key={c.id}
                            className={active ? `${classes.option} ${classes.campaignActive}` : classes.option}
                          >
                            <Checkbox
                              checked={active}
                              onChange={() => setCampaignIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                              color="teal"
                              size="xs"
                              mt={4}
                            />
                            <Box flex={1}>
                              <Group justify="space-between">
                                <Group gap={6} wrap="nowrap">
                                  <Percent size={12} color="var(--mantine-color-teal-6)" />
                                  <Text fz="0.85rem" fw={600}>{c.name}</Text>
                                </Group>
                                <Text span c="teal.7" fz="0.75rem" fw={600} style={num}>-{c.discount}%</Text>
                              </Group>
                              <Text c="dimmed" mt={2} fz="0.72rem">{c.description}</Text>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Paper>
                )}

                {/* Observações */}
                <Paper withBorder radius="lg" p={20}>
                  <Textarea
                    label="Observações"
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    rows={3}
                    placeholder="Informações adicionais..."
                    styles={{
                      label: { fontSize: '0.78rem', color: 'var(--mantine-color-dimmed)', fontWeight: 400, marginBottom: 6 },
                      input: { fontSize: '0.85rem', backgroundColor: 'var(--mantine-color-gray-0)', resize: 'none' },
                    }}
                  />
                </Paper>

                {approvalRequired && (
                  <Group align="flex-start" gap="xs" wrap="nowrap" p="sm" bg="yellow.0" style={{ border: '1px solid var(--mantine-color-yellow-2)', borderRadius: 'var(--mantine-radius-md)' }}>
                    <FileText size={16} color="var(--mantine-color-yellow-7)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Box>
                      <Text c="yellow.7" fz="0.8rem" fw={600}>Aprovação necessária</Text>
                      <Text c="dimmed" mt={2} fz="0.75rem">Este pedido passará pela aprovação do representante antes de ser faturado.</Text>
                    </Box>
                  </Group>
                )}
              </Stack>
            )}
            </Stack>
          </Grid.Col>

          {/* Summary */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            <Paper withBorder radius="lg" p={20}>
              <Title order={3} mb="md" fw={600} fz="0.9rem">Resumo do pedido</Title>
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Text c="dimmed" fz="0.72rem" tt="uppercase" lts="0.05em">Valor bruto · {grandPairs} pares</Text>
                  <Text fz="0.82rem" style={num}>{formatCurrency(grandTotal)}</Text>
                </Group>
                {tableDiscount > 0 && (
                  <Group justify="space-between" wrap="nowrap">
                    <Text c="teal.7" fz="0.82rem">Desconto {policy.label} ({policyDetails.discount}%)</Text>
                    <Text c="teal.7" fz="0.82rem" style={num}>-{formatCurrency(tableDiscount)}</Text>
                  </Group>
                )}
                {campaignDiscount > 0 && (
                  <Group justify="space-between" wrap="nowrap">
                    <Text c="teal.7" fz="0.82rem">Campanhas</Text>
                    <Text c="teal.7" fz="0.82rem" style={num}>-{formatCurrency(campaignDiscount)}</Text>
                  </Group>
                )}
                {paymentAdj !== 0 && (
                  <Group justify="space-between" wrap="nowrap">
                    <Text c={paymentAdj < 0 ? 'teal.7' : 'yellow.7'} fz="0.82rem">
                      Ajuste pagamento
                    </Text>
                    <Text c={paymentAdj < 0 ? 'teal.7' : 'yellow.7'} fz="0.82rem" style={num}>
                      {paymentAdj < 0 ? '-' : '+'}{formatCurrency(Math.abs(paymentAdj))}
                    </Text>
                  </Group>
                )}
                <Group justify="space-between" wrap="nowrap">
                  <Text c="gray.9" fz="0.82rem" fw={500}>IVA ({(IVA_RATE * 100).toFixed(0)}%)</Text>
                  <Text c="gray.9" fz="0.82rem" fw={500} style={num}>+{formatCurrency(finalTotal * IVA_RATE)}</Text>
                </Group>
                <Divider my="xs" />
                <Group justify="space-between" wrap="nowrap">
                  <Text fz="0.9rem" fw={600}>Total c/ IVA</Text>
                  <Text fz="1rem" fw={700} style={num}>{formatCurrency(finalTotal * (1 + IVA_RATE))}</Text>
                </Group>
                {step === 'checkout' && selectedPayment && (
                  <Text c="dimmed" ta="center" pt={4} fz="0.72rem">
                    Condição: {selectedPayment.label}
                  </Text>
                )}
                {belowMin && step === 'checkout' && (
                  <Box mt="xs" px={10} py="xs" bg="yellow.0" c="yellow.7" fz="0.72rem" style={{ border: '1px solid var(--mantine-color-yellow-3)', borderRadius: 'var(--mantine-radius-sm)' }}>
                    Pedido mínimo da {policy.label}: {formatCurrency(policyDetails.minOrderValue)}
                  </Box>
                )}
              </Stack>
            </Paper>


            {step === 'cart' ? (
              <Button
                onClick={() => setStep('checkout')}
                fullWidth
                size="md"
                radius="lg"
                fw={600}
                fz="0.9rem"
                rightSection={<ChevronRight size={16} />}
              >
                Ir para checkout
              </Button>
            ) : (
              <Button
                onClick={() => setStep('done')}
                fullWidth
                size="md"
                radius="lg"
                fw={600}
                fz="0.9rem"
                leftSection={<Check size={16} />}
              >
                Confirmar pedido
              </Button>
            )}

            <Button
              onClick={() => onNavigate('catalog')}
              fullWidth
              variant="default"
              radius="lg"
              c="dimmed"
              fz="0.85rem"
              fw={400}
            >
              Continuar comprando
            </Button>
          </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Box>
  );
}
