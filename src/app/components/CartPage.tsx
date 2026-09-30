import { useState, useMemo, useEffect } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, TextInput, Textarea, Anchor, Badge, ThemeIcon,
  Grid, ActionIcon, Alert, Image, Modal, Radio, Checkbox, Divider, Skeleton,
} from "@mantine/core";
import {
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  CreditCardIcon,
  FileTextIcon,
  CheckIcon,
  CaretRightIcon,
  TagIcon,
  SparkleIcon,
  PercentIcon,
  StorefrontIcon,
  CaretLeftIcon,
  FolderPlusIcon,
  ListBulletsIcon,
  UserCheckIcon,
  ArrowRightIcon,
  PackageIcon,
  SquaresFourIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { products, formatCurrency } from "../data/mockData";
import { priceTables } from "./CatalogFiltersBar";
import type { CartContext, CartCreator } from "./CartsListPage";
import classes from "./interactive.module.css";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";


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

// Nomes das etapas: dizem o que se faz em cada uma
const STEP_NAMES = { cart: 'Conferir itens', checkout: 'Escolher pagamento' } as const;

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

/** Miniatura do produto: skeleton até a imagem carregar; ícone neutro se a imagem falhar. */
function ProductThumb({ src, alt, size = 64 }: { src: string; alt: string; size?: number }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <Box
      w={size}
      h={size}
      pos="relative"
      flex="none"
      bg="var(--mantine-color-default-hover)"
      style={{ overflow: 'hidden', borderRadius: 'var(--mantine-radius-default)' }}
    >
      {status === 'loading' && <Skeleton h="100%" style={{ position: 'absolute', inset: 0 }} />}
      {status === 'error' ? (
        <Box h="100%" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <PackageIcon size={20} color="var(--mantine-color-dimmed)" />
        </Box>
      ) : (
        <Image
          src={src}
          alt={alt}
          w="100%"
          h="100%"
          fit="cover"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          style={{ opacity: status === 'loaded' ? 1 : 0 }}
        />
      )}
    </Box>
  );
}

export function CartPage({ onNavigate, cartContext, multiCart, onCreateNewCart, onCartCountChange, selectedPriceTable, viewerRole = 'rep' }: CartPageProps) {
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const loading = useMockLoading();
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



  const badgeStyles = { label: { textTransform: 'none' as const } };
  // desconto em verde, acréscimo em amarelo
  const adjColor = (v: number) => (v < 0 ? 'teal.6' : 'yellow.7');

  const handleTableChange = (id: string) => {
    setTableId(id);
    setPaymentId((paymentOptionsByTable[id] ?? [])[0]?.id ?? '');
    setCampaignIds([]);
  };

  if (step === 'done') {
    return (
      <Stack align="center" justify="center" p={{ base: 'md', sm: 'lg' }} mih="60vh">
        <Stack align="center" gap={0} maw={384} ta="center">
          <ThemeIcon variant="light" color="teal" size={64} mb="lg">
            <CheckIcon size={32} />
          </ThemeIcon>
          <Title order={1}>Pedido enviado para aprovação</Title>
          <Text c="dimmed" mt={8}>
            Pedido <Text span fw={600} c="var(--mantine-color-text)" className="mono" inherit>PED-2026-0413</Text>
          </Text>
          <Text c="dimmed" mt={4}>
            {grandPairs} pares · {formatCurrency(finalTotal)}
          </Text>
          {/* Próximos passos: o que acontece agora e onde acompanhar */}
          <Text mt="md">
            O representante vai revisar o pedido antes do faturamento. Você recebe um e-mail quando ele for aprovado.
          </Text>
          <Text c="dimmed" size="sm" mt={4}>
            Acompanhe o status em{' '}
            <Anchor component="button" type="button" inherit onClick={() => onNavigate('history')}>Histórico de pedidos</Anchor>
            , onde ele aparece como "em análise".
          </Text>
          <Group gap="sm" mt="xl" justify="center">
            <Button onClick={() => onNavigate('catalog')} variant="default">Voltar ao Catálogo</Button>
            <Button onClick={() => onNavigate('history')} rightSection={<ArrowRightIcon size={16} />}>Acompanhar no Histórico</Button>
          </Group>
        </Stack>
      </Stack>
    );
  }

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {cartContext && (
        <Group justify="space-between" gap="sm" mb="md">
          <Group gap="sm" wrap="nowrap" miw={0}>
            <Button
              onClick={() => onNavigate('carts')}
              variant="subtle"
              color="gray"
              ml={-12}
              leftSection={<CaretLeftIcon size={14} />}
            >
              Voltar para Carrinhos
            </Button>
            <Divider orientation="vertical" h={20} my="auto" />
            <Box miw={0}>
              <Group gap={8}>
                <Text fw={700} truncate>{cartContext.cartName}</Text>
                {cartContext.createdBy && (
                  <Badge
                    variant="light"
                    color={cartContext.createdBy === 'lojista' ? 'teal' : 'yellow'}
                    leftSection={cartContext.createdBy === 'lojista' ? <StorefrontIcon size={14} /> : <UserCheckIcon size={14} />}
                    styles={badgeStyles}
                  >
                    {/* quem criou fica visível no próprio selo (antes estava só no title) */}
                    {cartContext.createdBy === viewerRole ? 'Criado por você' : cartContext.createdBy === 'lojista' ? 'Criado pelo lojista' : 'Criado pelo representante'}
                  </Badge>
                )}
              </Group>
              <Group gap={6} c="dimmed" wrap="nowrap">
                <StorefrontIcon size={12} />
                <Text size="sm" c="dimmed" truncate>
                  Cliente: <Text span fw={600} c="var(--mantine-color-text)" inherit>{cartContext.clientName}</Text>
                </Text>
              </Group>
            </Box>
          </Group>
          {multiCart && (
            <Group gap="sm" w={{ base: '100%', xs: 'auto' }} grow>
              <Button
                onClick={() => onNavigate('carts')}
                variant="default"
                leftSection={<ListBulletsIcon size={14} />}
              >
                Outros Carrinhos
              </Button>
              <Button
                onClick={() => {
                  setNewCartName('');
                  setShowNewCartDialog(true);
                }}
                leftSection={<FolderPlusIcon size={14} />}
              >
                Criar Carrinho
              </Button>
            </Group>
          )}
        </Group>
      )}

      {/* New cart dialog */}
      <Modal
        opened={showNewCartDialog}
        onClose={() => setShowNewCartDialog(false)}
        size="sm"
        centered
        title={
          <Box>
            <Text fw={600}>Novo carrinho</Text>
            <Text c="dimmed" size="sm">Criar carrinho para {cartContext?.clientName}</Text>
          </Box>
        }
      >
        <TextInput
          data-autofocus
          label="Nome do carrinho"
          value={newCartName}
          onChange={e => setNewCartName(e.currentTarget.value)}
          placeholder="ex.: Reposição Inverno 26"
          maxLength={60}
          description="Até 60 caracteres"
        />
        <Group justify="flex-end" gap="sm" mt="lg" grow>
          <Button onClick={() => setShowNewCartDialog(false)} variant="default">Cancelar</Button>
          <Button
            onClick={() => {
              onCreateNewCart?.(newCartName.trim() || 'Novo carrinho');
              setShowNewCartDialog(false);
              setNewCartName('');
            }}
          >
            Criar Carrinho
          </Button>
        </Group>
      </Modal>

      {/* Etapas: a etapa concluída (itens) volta a ser clicável; a futura não é */}
      <Group gap="sm" mb="lg" wrap="nowrap">
        {step === 'checkout' ? (
          <Button
            onClick={() => setStep('cart')}
            variant="subtle"
            color="gray"
            leftSection={<CheckIcon size={14} />}
            aria-label={`Voltar para a etapa 1: ${STEP_NAMES.cart}`}
          >
            {STEP_NAMES.cart} ({cart.length})
          </Button>
        ) : (
          <Button
            variant="filled"
            color="neutral"
            leftSection={<ShoppingCartIcon size={14} />}
            component="div"
            aria-current="step"
          >
            {STEP_NAMES.cart} ({cart.length})
          </Button>
        )}
        <CaretRightIcon size={16} color="var(--mantine-color-dimmed)" />
        {step === 'checkout' ? (
          <Button
            variant="filled"
            color="neutral"
            leftSection={<CreditCardIcon size={14} />}
            component="div"
            aria-current="step"
          >
            {STEP_NAMES.checkout}
          </Button>
        ) : (
          <Group gap={6} wrap="nowrap" c="dimmed" px="sm">
            <CreditCardIcon size={14} />
            <Text c="dimmed" fw={600}>{STEP_NAMES.checkout}</Text>
          </Group>
        )}
      </Group>

      {cart.length === 0 ? (
        <EmptyState
          icon={ShoppingCartIcon}
          title="Seu carrinho está vazio"
          description="Adicione produtos do catálogo para montar o pedido. Os itens aparecem aqui com as quantidades por numeração."
          action={{ label: 'Ir para o Catálogo', onClick: () => onNavigate('catalog') }}
          suggestions={[
            { label: 'Montar pedido por grade', description: 'Informe as quantidades por numeração de cada produto', icon: SquaresFourIcon, onClick: () => onNavigate('order-grade') },
            multiCart
              ? { label: 'Abrir outro carrinho', description: 'Continue um carrinho já em construção', icon: ListBulletsIcon, onClick: () => onNavigate('carts') }
              : { label: 'Consultar pedidos anteriores', description: 'Veja o que o cliente já comprou no histórico', icon: ClockCounterClockwiseIcon, onClick: () => onNavigate('history') },
          ]}
        />
      ) : (
        <Grid gutter="lg">
          {/* Items */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            {step === 'cart' && loading ? (
              <ListSkeleton rows={cart.length} />
            ) : step === 'cart' ? (
              <Stack gap="sm">
                {cart.map(item => {
                  const { pairs, value } = getItemTotal(item);
                  return (
                    <Paper key={item.product.id} withBorder p={{ base: 'sm', sm: 'md' }}>
                      <Group align="flex-start" gap="sm" mb="sm" wrap="nowrap">
                        <ProductThumb src={item.product.image} alt={item.product.name} />
                        <Box miw={0} flex={1}>
                          <Text fw={600}>{item.product.name}</Text>
                          <Text c="dimmed" size="sm">{item.product.reference} · {formatCurrency(item.product.price)}/par</Text>
                          <Text className="mono" fw={700} mt={2}>{formatCurrency(value)}</Text>
                        </Box>
                        <Button
                          onClick={() => removeItem(item.product.id)}
                          variant="subtle"
                          color="red"
                          flex="none"
                          leftSection={<TrashIcon size={16} />}
                          aria-label={`Remover ${item.product.name} do carrinho`}
                        >
                          Remover
                        </Button>
                      </Group>
                      <Group gap={8}>
                        {Object.entries(item.sizes).map(([size, qty]) => (
                          <Paper key={size} withBorder px={8} py={4} bg="var(--mantine-color-default-hover)">
                            <Group gap={6} wrap="nowrap">
                              <Text c="dimmed" size="sm">Nº {size}</Text>
                              <ActionIcon onClick={() => updateQty(item.product.id, size, -1)} variant="subtle" color="gray" size="input-sm" aria-label={`Diminuir Nº ${size}`}>
                                <MinusIcon size={16} />
                              </ActionIcon>
                              <Text className="mono" fw={600} miw={24} ta="right">{qty}</Text>
                              <ActionIcon onClick={() => updateQty(item.product.id, size, 1)} variant="subtle" color="gray" size="input-sm" aria-label={`Aumentar Nº ${size}`}>
                                <PlusIcon size={16} />
                              </ActionIcon>
                            </Group>
                          </Paper>
                        ))}
                      </Group>
                      <Text c="dimmed" size="sm" mt={8}>{pairs} pares neste item</Text>
                    </Paper>
                  );
                })}
              </Stack>
            ) : (
              /* Checkout — Tabela, Condição, Campanhas */
              <Stack gap="md">
                {/* Tabela de preço aplicada */}
                <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
                  <Group gap={8} mb="sm">
                    <TagIcon size={16} />
                    <Title order={3} fw={600}>Política comercial aplicada</Title>
                  </Group>
                  {/* Poucas tabelas fixas: cartões de opção em vez de lista suspensa */}
                  <Radio.Group value={tableId} onChange={handleTableChange} name="price-table" label="Tabela de preço" mb="md">
                    <Stack gap="sm">
                      {priceTables.map(pt => (
                        <Radio.Card key={pt.id} value={pt.id} p="sm" className={classes.choiceCard}>
                          <Group align="flex-start" gap="sm" wrap="nowrap">
                            <Radio.Indicator color="neutral" mt={2} />
                            <Box flex={1} miw={0}>
                              <Text fw={600}>{pt.label}</Text>
                              <Text c="dimmed" size="sm" mt={2}>{pt.desc}</Text>
                            </Box>
                          </Group>
                        </Radio.Card>
                      ))}
                    </Stack>
                  </Radio.Group>
                  {/* Uma coluna, rótulo acima do valor: leitura pela borda esquerda */}
                  <Stack gap="md">
                    <Box>
                      <Text c="dimmed" size="sm">Desconto da tabela</Text>
                      <Text className="mono" fw={600} mt={2}>{policyDetails.discount === 0 ? 'sem desconto' : `${policyDetails.discount}%`}</Text>
                    </Box>
                    <Box>
                      <Text c="dimmed" size="sm">Pagamento padrão</Text>
                      <Text fw={600} mt={2}>{policyDetails.paymentCondition}</Text>
                    </Box>
                    <Box>
                      <Text c="dimmed" size="sm">Pedido mínimo</Text>
                      <Text className="mono" fw={600} mt={2}>{formatCurrency(policyDetails.minOrderValue)}</Text>
                    </Box>
                  </Stack>
                </Paper>

                {/* Condições de pagamento disponíveis */}
                <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
                  <Group gap={8} mb="sm">
                    <CreditCardIcon size={16} />
                    <Title order={3} fw={600}>Condições de pagamento disponíveis</Title>
                  </Group>
                  <Text c="dimmed" size="sm" mb="sm">
                    Opções habilitadas para a <Text span fw={600} c="var(--mantine-color-text)" inherit>{policy.label}</Text>.
                  </Text>
                  <Radio.Group value={paymentId} onChange={setPaymentId} name="payment">
                    <Stack gap={8}>
                      {paymentOptions.map(opt => (
                        <Radio.Card key={opt.id} value={opt.id} p="sm" className={classes.choiceCard}>
                          <Group align="flex-start" gap="sm" wrap="nowrap">
                            <Radio.Indicator color="neutral" mt={2} />
                            <Box flex={1} miw={0}>
                              <Group justify="space-between" gap="xs">
                                <Text fw={600}>{opt.label}</Text>
                                {opt.surcharge !== 0 && (
                                  <Text className="mono" size="sm" fw={600} c={adjColor(opt.surcharge)}>
                                    {opt.surcharge < 0 ? `${opt.surcharge}%` : `+${opt.surcharge}%`}
                                  </Text>
                                )}
                              </Group>
                              {opt.description && <Text c="dimmed" size="sm" mt={2}>{opt.description}</Text>}
                            </Box>
                          </Group>
                        </Radio.Card>
                      ))}
                    </Stack>
                  </Radio.Group>
                </Paper>

                {/* Campanhas disponíveis */}
                {campaigns.length > 0 && (
                  <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
                    <Group gap={8} mb="sm">
                      <SparkleIcon size={16} />
                      <Title order={3} fw={600}>Campanhas disponíveis</Title>
                    </Group>
                    <Checkbox.Group value={campaignIds} onChange={setCampaignIds}>
                      <Stack gap={8}>
                        {campaigns.map(c => (
                          <Checkbox.Card
                            key={c.id}
                            value={c.id}
                            p="sm"
                            className={classes.choiceCard}
                          >
                            <Group align="flex-start" gap="sm" wrap="nowrap">
                              <Checkbox.Indicator color="neutral" mt={2} />
                              <Box flex={1} miw={0}>
                                <Group justify="space-between">
                                  <Group gap={6}>
                                    <PercentIcon size={12} color="var(--mantine-color-teal-6)" />
                                    <Text fw={600}>{c.name}</Text>
                                  </Group>
                                  <Text c="teal.6" className="mono" size="sm" fw={600}>-{c.discount}%</Text>
                                </Group>
                                <Text c="dimmed" size="sm" mt={2}>{c.description}</Text>
                              </Box>
                            </Group>
                          </Checkbox.Card>
                        ))}
                      </Stack>
                    </Checkbox.Group>
                  </Paper>
                )}

                {/* Observações */}
                <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
                  <Textarea
                    label="Observações (opcional)"
                    description="Até 500 caracteres"
                    value={obs}
                    onChange={e => setObs(e.currentTarget.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="ex.: Entregar pela manhã, separar por loja"
                  />
                </Paper>

                {approvalRequired && (
                  <Alert
                    variant="light"
                    color="yellow"
                    icon={<FileTextIcon size={16} />}
                    title={<Text fw={600} c="yellow.8">Aprovação necessária</Text>}
                  >
                    <Text c="dimmed">Este pedido passará pela aprovação do representante antes de ser faturado. Depois de enviado, acompanhe o status em Histórico de pedidos.</Text>
                  </Alert>
                )}
              </Stack>
            )}
          </Grid.Col>

          {/* Summary */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="md">
              <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
                <Title order={3} fw={600} mb="md">Resumo do pedido</Title>
                <Stack gap={8}>
                  <Group justify="space-between" wrap="nowrap">
                    <Text c="dimmed" size="sm">Valor bruto · {grandPairs} pares</Text>
                    <Text className="mono">{formatCurrency(grandTotal)}</Text>
                  </Group>
                  {tableDiscount > 0 && (
                    <Group justify="space-between" wrap="nowrap">
                      <Text c="teal.6">Desconto {policy.label} ({policyDetails.discount}%)</Text>
                      <Text c="teal.6" className="mono">-{formatCurrency(tableDiscount)}</Text>
                    </Group>
                  )}
                  {campaignDiscount > 0 && (
                    <Group justify="space-between" wrap="nowrap">
                      <Text c="teal.6">Campanhas</Text>
                      <Text c="teal.6" className="mono">-{formatCurrency(campaignDiscount)}</Text>
                    </Group>
                  )}
                  {paymentAdj !== 0 && (
                    <Group justify="space-between" wrap="nowrap">
                      <Text c={adjColor(paymentAdj)}>Ajuste pagamento</Text>
                      <Text c={adjColor(paymentAdj)} className="mono">
                        {paymentAdj < 0 ? '-' : '+'}{formatCurrency(Math.abs(paymentAdj))}
                      </Text>
                    </Group>
                  )}
                  <Group justify="space-between" wrap="nowrap">
                    <Text>IVA ({(IVA_RATE * 100).toFixed(0)}%)</Text>
                    <Text className="mono">+{formatCurrency(finalTotal * IVA_RATE)}</Text>
                  </Group>
                  <Divider my={4} />
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={600}>Total c/ IVA</Text>
                    <Text className="mono" size="xl" fw={700}>{formatCurrency(finalTotal * (1 + IVA_RATE))}</Text>
                  </Group>
                  {step === 'checkout' && selectedPayment && (
                    <Text c="dimmed" size="sm" pt={4}>
                      Condição: {selectedPayment.label}
                    </Text>
                  )}
                  {belowMin && step === 'checkout' && (
                    <Alert variant="light" color="yellow" p={8} mt={8}>
                      <Text c="yellow.8" size="sm">Pedido mínimo da {policy.label}: {formatCurrency(policyDetails.minOrderValue)}. Adicione {formatCurrency(policyDetails.minOrderValue - finalTotal)} em produtos ou troque a tabela de preço.</Text>
                    </Alert>
                  )}
                </Stack>
              </Paper>

              {/* Coluna estreita (lg+) e celular: botões em largura total, principal por último.
                  Entre sm e lg o resumo ocupa a largura toda: largura natural, alinhados à direita. */}
              <Group gap="sm" justify="flex-end">
                <Button onClick={() => onNavigate('catalog')} variant="default" w={{ base: '100%', sm: 'auto', lg: '100%' }}>
                  Voltar ao Catálogo
                </Button>
                {step === 'cart' ? (
                  <Button onClick={() => setStep('checkout')} w={{ base: '100%', sm: 'auto', lg: '100%' }} rightSection={<ArrowRightIcon size={16} />}>
                    Escolher Pagamento
                  </Button>
                ) : (
                  <Button onClick={() => setStep('done')} w={{ base: '100%', sm: 'auto', lg: '100%' }} leftSection={<CheckIcon size={16} />}>
                    Enviar para Aprovação
                  </Button>
                )}
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </Box>
  );
}
