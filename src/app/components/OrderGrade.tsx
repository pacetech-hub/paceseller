import { useState, useCallback } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, TextInput, Select, Textarea, Badge, Anchor, ThemeIcon,
  Stepper, Table, NumberInput, ActionIcon, Alert, Image, ScrollArea, Divider, Skeleton,
  type OptionsFilter, type ComboboxItem,
} from "@mantine/core";
import {
  CaretLeftIcon,
  ArrowRightIcon,
  PackageIcon,
  PlusIcon,
  MinusIcon,
  LightningIcon,
  CheckIcon,
  WarningCircleIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  TagIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";
import { products, clients, commercialPolicies, orders, Product, Client, formatCurrency } from "../data/mockData";
import classes from "./interactive.module.css";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import sticky from "./ui/stickyTable.module.css";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

interface OrderGradeProps {
  onNavigate: (view: View) => void;
  selectedClient: Client | null;
}

const SIZES = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

type GradeMap = Record<string, Record<string, number>>;

const PAYMENT_OPTIONS = ['3x sem juros', '5x sem juros', '7x sem juros', 'À Vista', '30 DDL', '30/60 DDL', '30/60/90 DDL'];

// "Mais usados": condições de pagamento mais frequentes nos pedidos (mock)
const POPULAR_PAYMENTS = (() => {
  const count: Record<string, number> = {};
  orders.forEach(o => { count[o.paymentCondition] = (count[o.paymentCondition] || 0) + 1; });
  return PAYMENT_OPTIONS.filter(p => count[p]).sort((a, b) => count[b] - count[a]).slice(0, 3);
})();
const PAYMENT_DATA = [
  { group: 'Mais usados', items: POPULAR_PAYMENTS },
  { group: 'Todos', items: PAYMENT_OPTIONS.filter(p => !POPULAR_PAYMENTS.includes(p)) },
];

// "Mais usados": clientes com mais pedidos no histórico, desempate pelo pedido mais recente (mock)
const POPULAR_CLIENT_IDS = (() => {
  const count: Record<string, number> = {};
  orders.forEach(o => { count[o.clientId] = (count[o.clientId] || 0) + 1; });
  return [...clients]
    .filter(c => count[c.id])
    .sort((a, b) => (count[b.id] - count[a.id]) || b.lastOrder.localeCompare(a.lastOrder))
    .slice(0, 5)
    .map(c => c.id);
})();
const toClientOption = (c: Client) => ({ value: c.id, label: c.name });
const CLIENT_DATA = [
  {
    group: 'Mais usados',
    items: POPULAR_CLIENT_IDS.map(id => clients.find(c => c.id === id)!).map(toClientOption),
  },
  { group: 'Todos', items: clients.filter(c => !POPULAR_CLIENT_IDS.includes(c.id)).map(toClientOption) },
];

// estoque do tamanho: zerado, baixo (< 5) ou ok
const stockColor = (stock: number) => (stock === 0 ? 'red.6' : stock < 5 ? 'yellow.7' : 'teal.6');

// fundo levemente tingido usado nos blocos de destaque (política, subtotal, total)
const highlightBg = 'var(--mantine-color-neutral-0)';

// Par rótulo/valor em uma coluna: rótulo discreto acima, valor abaixo, alinhados à esquerda
function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text c="dimmed" size="sm">{label}</Text>
      <Text fw={600}>{children}</Text>
    </Box>
  );
}

// Busca de cliente por nome ou código (o rótulo mostra só o nome)
const clientFilter: OptionsFilter = ({ options, search }) => {
  const t = search.trim().toLowerCase();
  if (!t) return options;
  return (options as ComboboxItem[]).filter(o =>
    o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t)
  );
};

/** Miniatura do produto: skeleton até a imagem carregar; ícone neutro se a imagem falhar. */
function ProductThumb({ src, alt, size = 40 }: { src: string; alt: string; size?: number }) {
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
          <PackageIcon size={16} color="var(--mantine-color-dimmed)" />
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

function ProductSelector({ selected, onSelect }: { selected: Product | null; onSelect: (p: Product) => void }) {
  const [search, setSearch] = useState('');
  const loading = useMockLoading();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <TextInput
        label="Buscar produto"
        placeholder="Nome ou referência (ex.: 2502-19)"
        value={search}
        onChange={e => setSearch(e.currentTarget.value)}
        mb="sm"
      />
      {loading ? (
        <ListSkeleton rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MagnifyingGlassIcon}
          title="Nenhum produto encontrado"
          description={`Nada corresponde a "${search}". Confira o nome ou a referência (ex.: 2502-19), ou limpe a busca para ver todos.`}
          action={{ label: 'Limpar Busca', onClick: () => setSearch(''), forward: false }}
          withBorder={false}
        />
      ) : (
      <ScrollArea.Autosize mah={192}>
        <Stack gap={4}>
          {filtered.map(p => {
            const isSelected = selected?.id === p.id;
            return (
              <Paper
                key={p.id}
                component="button"
                type="button"
                onClick={() => onSelect(p)}
                className={isSelected ? classes.cardButton : `${classes.cardButton} ${classes.hoverable}`}
                p="xs"
                bd={`1px solid ${isSelected ? 'var(--mantine-color-neutral-3)' : 'transparent'}`}
                bg={isSelected ? highlightBg : undefined}
              >
                <Group gap="sm" wrap="nowrap">
                  <ProductThumb src={p.image} alt={p.name} />
                  <Box miw={0} flex={1}>
                    <Text fw={600} truncate>{p.name}</Text>
                    <Text c="dimmed" size="sm">{p.reference} · {formatCurrency(p.price)}</Text>
                  </Box>
                  {isSelected && <CheckIcon size={16} />}
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea.Autosize>
      )}
    </Box>
  );
}

export function OrderGrade({ onNavigate, selectedClient }: OrderGradeProps) {
  const [step, setStep] = useState(() => selectedClient ? 2 : 1);
  const [selectedClientId, setSelectedClientId] = useState(() => selectedClient?.id ?? clients[0].id);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0]);
  const [grades, setGrades] = useState<GradeMap>({});
  const [paymentCond, setPaymentCond] = useState(() => {
    const policy = commercialPolicies.find(p => p.id === clients[0].policyId);
    return policy?.paymentCondition || '5x sem juros';
  });
  const [obs, setObs] = useState('');
  const [completed, setCompleted] = useState(false);
  const [autoFill, setAutoFill] = useState(false);

  const selectedClientObj = clients.find(c => c.id === selectedClientId) || clients[0];
  const clientPolicy = commercialPolicies.find(p => p.id === selectedClientObj.policyId) || commercialPolicies[0];

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const policy = commercialPolicies.find(p => p.id === client.policyId);
      if (policy) setPaymentCond(policy.paymentCondition);
    }
  };

  const currentGrades = selectedProduct ? (grades[selectedProduct.id] || {}) : {};

  const setQty = useCallback((size: string, val: number) => {
    if (!selectedProduct) return;
    setGrades(prev => ({
      ...prev,
      [selectedProduct.id]: {
        ...prev[selectedProduct.id],
        [size]: Math.max(0, val),
      },
    }));
  }, [selectedProduct]);

  const handleAutoFill = () => {
    if (!selectedProduct) return;
    const suggestion: Record<string, number> = {};
    SIZES.forEach(s => {
      const stock = selectedProduct.grades[s] || 0;
      suggestion[s] = stock > 0 ? Math.ceil(stock * 0.4) : 0;
    });
    setGrades(prev => ({ ...prev, [selectedProduct.id]: suggestion }));
    setAutoFill(true);
  };

  const totalPairs = Object.values(currentGrades).reduce((a, b) => a + b, 0);
  const totalValue = selectedProduct ? totalPairs * selectedProduct.price : 0;

  const allGrades = Object.entries(grades).reduce((acc, [pid, sizes]) => {
    const product = products.find(p => p.id === pid);
    if (!product) return acc;
    const pairs = Object.values(sizes).reduce((a, b) => a + b, 0);
    if (pairs === 0) return acc;
    return [...acc, { product, sizes, pairs, value: pairs * product.price }];
  }, [] as { product: Product; sizes: Record<string, number>; pairs: number; value: number }[]);

  const grandTotal = allGrades.reduce((a, g) => a + g.value, 0);
  const grandPairs = allGrades.reduce((a, g) => a + g.pairs, 0);
  const discountPct = clientPolicy.discount;
  const discountAmount = grandTotal * discountPct / 100;
  const finalTotal = grandTotal - discountAmount;

  const steps = [
    { n: 1, label: 'Escolher cliente', description: 'Cliente e forma de pagamento' },
    { n: 2, label: 'Escolher produtos', description: 'Busque por nome ou referência' },
    { n: 3, label: 'Definir quantidades', description: 'Pares por numeração' },
    { n: 4, label: 'Revisar e enviar', description: 'Confira e envie o pedido' },
  ];

  if (completed) {
    return (
      <Stack align="center" justify="center" p={{ base: 'md', sm: 'lg' }} mih="60vh">
        <Stack align="center" gap={0} maw={384} ta="center">
          <ThemeIcon variant="light" color="teal" size={64} mb="lg">
            <CheckIcon size={32} />
          </ThemeIcon>
          <Title order={1}>Pedido enviado para aprovação</Title>
          <Text c="dimmed" mt="xs" mb={4}>
            Pedido <Text span fw={600} c="var(--mantine-color-text)" className="mono" inherit>PED-2026-0413</Text> para {selectedClientObj.name}
          </Text>
          <Text c="dimmed">
            {grandPairs} pares · {formatCurrency(finalTotal)}
          </Text>
          {/* Próximos passos: o que acontece agora e onde acompanhar */}
          <Text mt="md">
            O pedido fica "em análise" até a aprovação comercial. Depois de aprovado, segue para faturamento e o cliente recebe a confirmação por e-mail.
          </Text>
          <Text c="dimmed" size="sm" mt={4}>
            Acompanhe o status em{' '}
            <Anchor component="button" type="button" inherit onClick={() => onNavigate('history')}>Histórico de pedidos</Anchor>
            .
          </Text>
          <Group gap="sm" mt="xl" justify="center">
            <Button onClick={() => { setCompleted(false); setStep(1); setGrades({}); }} variant="default">
              Criar Novo Pedido
            </Button>
            <Button onClick={() => onNavigate('history')} rightSection={<ArrowRightIcon size={16} />}>
              Acompanhar no Histórico
            </Button>
          </Group>
        </Stack>
      </Stack>
    );
  }

  const firstStep = selectedClient ? 2 : 1;
  const stepLabel = (n: number) => steps.find(st => st.n === n)?.label ?? '';
  const currentStepLabel = stepLabel(step);
  // rótulo de botão em Title Case (ex.: "Escolher produtos" → "Escolher Produtos")
  const stepButtonLabel = (n: number) => stepLabel(n).replace(/(^|\s)(\p{L})/gu, (_m, sp, ch) => sp + ch.toUpperCase()).replace(/ E /g, ' e ');

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* Client chip — shown when client was pre-selected */}
      {selectedClient && (
        <Paper withBorder px="md" py="sm">
          <Group gap="xs" wrap="nowrap">
            <StorefrontIcon size={16} style={{ flexShrink: 0 }} />
            <Text c="dimmed" flex="none">Pedindo para</Text>
            <Text fw={700} truncate>{selectedClient.name}</Text>
          </Group>
        </Paper>
      )}

      {/* Stepper */}
      <Paper withBorder p="md">
        <Stepper
          active={step - 1}
          color="neutral"
          allowNextStepsSelect={false}
          onStepClick={i => {
            // só volta para etapas já concluídas (e nunca antes da primeira etapa disponível)
            const target = i + 1;
            if (target < step && target >= firstStep) setStep(target);
          }}
          radius="md"
          completedIcon={<CheckIcon size={16} />}
        >
          {steps.map(st => (
            <Stepper.Step
              key={st.n}
              aria-label={st.n < step && st.n >= firstStep ? `Voltar para a etapa ${st.n}: ${st.label}` : undefined}
              allowStepSelect={st.n < step && st.n >= firstStep}
              label={<Text span visibleFrom="sm" inherit fw={step === st.n ? 600 : 400}>{st.label}</Text>}
              description={<Text span visibleFrom="sm" inherit>{st.description}</Text>}
            />
          ))}
        </Stepper>
        {/* No mobile os rótulos do stepper ficam ocultos: mostra a etapa atual por extenso */}
        <Text hiddenFrom="sm" mt="sm" aria-live="polite">
          <Text span c="dimmed" inherit>Etapa {step} de {steps.length} · </Text>
          <Text span fw={600} inherit>{currentStepLabel}</Text>
        </Text>
      </Paper>

      {/* Step Content */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
        {/* Step 1: Cliente */}
        {step === 1 && (
          <Stack gap="md">
            <Title order={3} fw={600}>Selecionar cliente</Title>
            <Select
              label="Cliente"
              value={selectedClientId}
              onChange={v => v && handleClientChange(v)}
              data={CLIENT_DATA}
              allowDeselect={false}
              searchable
              filter={clientFilter}
              placeholder="Buscar por nome ou código (ex.: CLI-001)"
              nothingFoundMessage="Nenhum cliente encontrado. Confira o nome ou o código."
            />
            <Select
              label="Condição de pagamento"
              value={paymentCond}
              onChange={v => v && setPaymentCond(v)}
              data={PAYMENT_DATA}
              allowDeselect={false}
              searchable
            />

            {/* Política comercial dinâmica */}
            <Paper withBorder p="sm" bg={highlightBg}>
              <Group justify="space-between" mb="sm">
                <Group gap="xs">
                  <TagIcon size={16} />
                  <Text c="dimmed" size="sm" fw={600}>Política comercial aplicada</Text>
                </Group>
                <Badge variant="light" color="neutral">
                  {clientPolicy.name}
                </Badge>
              </Group>
              <Stack gap="sm">
                <Box>
                  <Text c="dimmed" size="sm">Desconto</Text>
                  <Text fw={600} c={clientPolicy.discount > 0 ? 'teal.6' : undefined}>
                    {clientPolicy.discount > 0 ? `${clientPolicy.discount}%` : 'sem desconto'}
                  </Text>
                </Box>
                <InfoField label="Pagamento padrão">{clientPolicy.paymentCondition}</InfoField>
                <InfoField label="Pedido mínimo">{formatCurrency(clientPolicy.minOrderValue)}</InfoField>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* Step 2: Produtos */}
        {step === 2 && (
          <Stack gap="md">
            <Title order={3} fw={600}>Selecionar produto</Title>
            <ProductSelector selected={selectedProduct} onSelect={setSelectedProduct} />
          </Stack>
        )}

        {/* Step 3: Grade */}
        {step === 3 && selectedProduct && (
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
              <Box miw={0}>
                <Title order={3} fw={600}>{selectedProduct.name}</Title>
                <Text c="dimmed" size="sm">{selectedProduct.reference} · {formatCurrency(selectedProduct.price)}/par</Text>
              </Box>
              <Button onClick={handleAutoFill} variant="default" leftSection={<LightningIcon size={16} />} flex="none">
                Sugerir Quantidades
              </Button>
            </Group>

            {autoFill && (
              <Alert variant="light" color="yellow" icon={<LightningIcon size={16} />} py="xs">
                <Text c="yellow.8">Quantidades sugeridas com base no histórico de giro desta loja. Ajuste qualquer numeração antes de revisar.</Text>
              </Alert>
            )}

            {/* Grade de numeração (13 colunas): rola na horizontal com o rótulo da linha
                e o cabeçalho sempre visíveis; números alinhados à direita */}
            <Table.ScrollContainer minWidth={1600}>
              <Table withRowBorders horizontalSpacing={4} className={sticky.firstCol} stickyHeader stickyHeaderOffset={0}>
                <Table.Thead>
                  <Table.Tr bd="none">
                    <Table.Th c="dimmed" fw={600} fz="sm">Numeração</Table.Th>
                    {SIZES.map(sz => (
                      <Table.Th key={sz} c="dimmed" fw={600} ta="right" fz="sm">Nº {sz}</Table.Th>
                    ))}
                    <Table.Th c="dimmed" fw={600} ta="right" fz="sm">Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td c="dimmed" fz="sm">Estoque</Table.Td>
                    {SIZES.map(sz => {
                      const stock = selectedProduct.grades[sz] || 0;
                      return (
                        <Table.Td key={sz} ta="right">
                          <Text span className="mono" size="sm" c={stockColor(stock)}>{stock}</Text>
                        </Table.Td>
                      );
                    })}
                    <Table.Td />
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td fw={600}>Quantidade</Table.Td>
                    {SIZES.map(sz => {
                      const qty = currentGrades[sz] || 0;
                      const stock = selectedProduct.grades[sz] || 0;
                      const over = qty > stock;
                      return (
                        <Table.Td key={sz} ta="right" py="sm">
                          <Group gap={4} justify="flex-end" wrap="nowrap">
                            <ActionIcon onClick={() => setQty(sz, qty - 1)} disabled={qty === 0} variant="light" color="gray" size="input-sm" aria-label={`Diminuir Nº ${sz}`}>
                              <MinusIcon size={16} />
                            </ActionIcon>
                            <NumberInput
                              value={qty}
                              onChange={v => setQty(sz, typeof v === 'number' ? v : parseInt(v) || 0)}
                              min={0}
                              max={stock}
                              clampBehavior="none"
                              allowNegative={false}
                              allowDecimal={false}
                              hideControls
                              w={56}
                              error={over}
                              aria-label={`Quantidade Nº ${sz}`}
                              classNames={{ input: 'mono' }}
                              styles={{
                                input: {
                                  textAlign: 'right',
                                  paddingInline: 4,
                                  borderColor: over ? undefined : qty > 0 ? 'var(--mantine-color-neutral-5)' : undefined,
                                },
                              }}
                            />
                            <ActionIcon onClick={() => setQty(sz, qty + 1)} disabled={qty >= stock} variant="light" color="gray" size="input-sm" aria-label={`Aumentar Nº ${sz}`}>
                              <PlusIcon size={16} />
                            </ActionIcon>
                          </Group>
                          {over && <Text c="red.6" mt={4} size="sm">Acima do estoque ({stock} {stock === 1 ? 'par' : 'pares'})</Text>}
                        </Table.Td>
                      );
                    })}
                    <Table.Td ta="right">
                      <Text span className="mono" fw={700}>{totalPairs}</Text>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Subtotal */}
            <Paper withBorder px="md" py="sm" bg={highlightBg}>
              <Group justify="space-between" gap="xs">
                <Box>
                  <Text c="dimmed" size="sm">Subtotal deste produto</Text>
                  <Text>{totalPairs} pares × {formatCurrency(selectedProduct.price)}</Text>
                </Box>
                <Text className="mono" fw={700} size="xl">{formatCurrency(totalValue)}</Text>
              </Group>
            </Paper>

            <Box>
              <Button
                onClick={() => {
                  setAutoFill(false);
                  setSelectedProduct(null);
                  setStep(2);
                }}
                variant="subtle"
                color="neutral"
                ml={-12}
                leftSection={<PlusIcon size={16} />}
              >
                Adicionar Outro Produto
              </Button>
            </Box>
          </Stack>
        )}

        {/* Step 4: Revisão */}
        {step === 4 && (
          <Stack gap="lg">
            <Title order={3} fw={600}>Revisão do pedido</Title>

            <Stack gap="sm">
              <InfoField label="Cliente">{selectedClientObj.name}</InfoField>
              <InfoField label="Pagamento">{paymentCond}</InfoField>
            </Stack>

            {allGrades.length === 0 ? (
              <EmptyState
                icon={PackageIcon}
                title="Nenhum produto no pedido"
                description="Escolha um produto e informe as quantidades por numeração para revisar o pedido."
                action={{ label: 'Escolher Produto', onClick: () => { setSelectedProduct(null); setStep(2); } }}
                secondaryAction={selectedProduct ? { label: 'Voltar para Definir Quantidades', onClick: () => setStep(3), forward: false } : undefined}
              />
            ) : (
              <Stack gap="md">
                {allGrades.map(({ product, sizes, pairs, value }) => (
                  <Paper key={product.id} withBorder p="md">
                    <Group justify="space-between" mb="sm" wrap="nowrap">
                      <Box miw={0}>
                        <Text fw={600}>{product.name}</Text>
                        <Text c="dimmed" size="sm">{product.reference}</Text>
                      </Box>
                      <Box ta="right">
                        <Text className="mono" fw={700}>{formatCurrency(value)}</Text>
                        <Text c="dimmed" size="sm">{pairs} pares</Text>
                      </Box>
                    </Group>
                    <Group gap="xs">
                      {SIZES.map(sz => sizes[sz] > 0 && (
                        <Badge key={sz} variant="light" color="neutral" className="mono">
                          Nº {sz}: {sizes[sz]}
                        </Badge>
                      ))}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}

            <Textarea
              label="Observações (opcional)"
              description="Até 500 caracteres"
              value={obs}
              onChange={e => setObs(e.currentTarget.value)}
              rows={3}
              maxLength={500}
              placeholder="ex.: Entregar pela manhã, separar por loja"
            />

            {/* Aviso pedido mínimo */}
            {allGrades.length > 0 && finalTotal < clientPolicy.minOrderValue && (
              <Alert variant="light" color="yellow" icon={<WarningCircleIcon size={16} />} py="xs">
                <Text c="yellow.8">
                  Pedido abaixo do mínimo de {formatCurrency(clientPolicy.minOrderValue)} para {clientPolicy.name}. Adicione {formatCurrency(clientPolicy.minOrderValue - finalTotal)} em produtos para enviar sem ajuste.
                </Text>
              </Alert>
            )}

            {/* Breakdown de valor */}
            <Paper withBorder px={{ base: 'md', sm: 'lg' }} py="md" bg={highlightBg}>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">Subtotal</Text>
                  <Text className="mono">{formatCurrency(grandTotal)}</Text>
                </Group>
                {discountPct > 0 && (
                  <Group justify="space-between">
                    <Text c="teal.6" size="sm">Desconto {clientPolicy.name} ({discountPct}%)</Text>
                    <Text c="teal.6" className="mono">-{formatCurrency(discountAmount)}</Text>
                  </Group>
                )}
                <Divider />
                <Group justify="space-between" gap="xs">
                  <Box>
                    <Text c="dimmed" size="sm">Total do pedido</Text>
                    <Text>{grandPairs} pares · {allGrades.length} produto(s)</Text>
                  </Box>
                  <Text className="mono" fw={700} size="xl">{formatCurrency(finalTotal)}</Text>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Paper>

      {/* Navigation */}
      <Group justify="space-between">
        <Button
          onClick={() => setStep(s => Math.max(firstStep, s - 1))}
          disabled={step === firstStep}
          variant="default"
          leftSection={<CaretLeftIcon size={16} />}
        >
          {step > firstStep ? `Voltar para ${stepButtonLabel(step - 1)}` : 'Voltar'}
        </Button>

        <Group gap="sm">
          {allGrades.length > 0 && step < 4 && (
            <Text c="dimmed" size="sm" visibleFrom="xs">
              <Text span fw={600} c="var(--mantine-color-text)" inherit>{grandPairs}</Text> pares · {formatCurrency(grandTotal)}
            </Text>
          )}
          {step < 4 ? (
            <Button
              onClick={() => setStep(s => Math.min(4, s + 1))}
              disabled={step === 3 && totalPairs === 0}
              rightSection={<ArrowRightIcon size={16} />}
            >
              {step === 3 ? 'Revisar Pedido' : stepButtonLabel(step + 1)}
            </Button>
          ) : (
            <Button
              onClick={() => setCompleted(true)}
              disabled={allGrades.length === 0}
              leftSection={<ShoppingCartIcon size={16} />}
            >
              Enviar Pedido
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}
