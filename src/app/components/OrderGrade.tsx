import { useState, useCallback } from "react";
import {
  Box, Stack, Group, Text, Title, Paper, Button, UnstyledButton, TextInput, NativeSelect, Textarea,
  SimpleGrid, Badge, ThemeIcon, Table, Image,
} from "@mantine/core";
import { ChevronLeft, ChevronRight, Plus, Minus, Zap, Check, AlertCircle, ShoppingCart, Tag, Store } from "lucide-react";
import { products, clients, commercialPolicies, Product, Client, formatCurrency } from "../data/mockData";
import classes from "./OrderGrade.module.css";

const tnum = { fontVariantNumeric: 'tabular-nums' } as const;

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

interface OrderGradeProps {
  onNavigate: (view: View) => void;
  selectedClient: Client | null;
}

const SIZES = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];

type GradeMap = Record<string, Record<string, number>>;


function ProductSelector({ selected, onSelect }: { selected: Product | null; onSelect: (p: Product) => void }) {
  const [search, setSearch] = useState('');
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <TextInput
        type="text"
        placeholder="Buscar produto ou referência..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="sm"
        radius="md"
        mb={8}
        styles={{ input: { background: 'var(--mantine-color-gray-0)' } }}
      />
      <Stack gap={4} mah={192} style={{ overflowY: 'auto' }}>
        {filtered.map(p => (
          <UnstyledButton
            key={p.id}
            onClick={() => onSelect(p)}
            className={selected?.id === p.id ? `${classes.productItem} ${classes.productItemActive}` : classes.productItem}
          >
            <Image src={p.image} alt={p.name} w={40} h={40} radius="sm" fit="cover" bg="gray.1" style={{ flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <Box flex={1} miw={0}>
              <Text truncate fz="0.82rem" fw={500}>{p.name}</Text>
              <Text c="dimmed" fz="0.7rem">{p.reference} · {formatCurrency(p.price)}</Text>
            </Box>
            {selected?.id === p.id && <Check size={16} color="var(--mantine-color-gray-9)" style={{ flexShrink: 0 }} />}
          </UnstyledButton>
        ))}
      </Stack>
    </div>
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
    { n: 1, label: 'Cliente' },
    { n: 2, label: 'Produtos' },
    { n: 3, label: 'Grade' },
    { n: 4, label: 'Revisão' },
  ];


  if (completed) {
    return (
      <Box p="lg" mih="60vh" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box ta="center" maw={384}>
          <ThemeIcon size={64} radius="xl" variant="light" color="teal" mx="auto" mb={20}>
            <Check size={32} color="var(--mantine-color-teal-6)" />
          </ThemeIcon>
          <Title order={2} fw={700} fz="1.3rem">Pedido enviado!</Title>
          <Text c="dimmed" mt={8} mb={4} fz="0.85rem">
            Pedido <Text span c="var(--mantine-color-text)" fw={600} inherit style={tnum}>PED-2026-0413</Text> criado com sucesso.
          </Text>
          <Text c="dimmed" fz="0.82rem">
            {grandPairs} pares · {formatCurrency(finalTotal)}
          </Text>
          <Group gap="sm" mt="lg" justify="center">
            <Button
              onClick={() => { setCompleted(false); setStep(1); setGrades({}); }}
              variant="default"
              radius="md"
              fz="0.85rem"
              fw={500}
            >
              Novo pedido
            </Button>
            <Button
              onClick={() => onNavigate('history')}
              radius="md"
              fz="0.85rem"
              fw={600}
            >
              Ver histórico
            </Button>
          </Group>
        </Box>
      </Box>
    );
  }

  return (
    <Stack gap={20} p="lg" maw={1400} mx="auto" w="100%">
      {/* Client chip — shown when client was pre-selected */}
      {selectedClient && (
        <Paper radius="lg" px="md" py="sm" style={{ border: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap={10} wrap="nowrap">
            <Store size={16} color="var(--mantine-color-gray-9)" style={{ flexShrink: 0 }} />
            <Text c="dimmed" fz="0.82rem">Pedindo para</Text>
            <Text c="gray.9" fz="0.85rem" fw={700}>{selectedClient.name}</Text>
          </Group>
        </Paper>
      )}

      {/* Stepper */}
      <Paper withBorder radius="lg" p="md">
        <Group justify="space-between" wrap="nowrap" gap={0}>
          {steps.map((s, i) => (
            <Group key={s.n} flex={1} wrap="nowrap" gap={0}>
              <Group gap={8} wrap="nowrap">
                <Box
                  w={28}
                  h={28}
                  bg={step >= s.n ? 'gray.9' : 'gray.1'}
                  c={step >= s.n ? 'white' : 'dimmed'}
                  fz="0.75rem"
                  fw={700}
                  style={{ borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background-color 150ms ease, color 150ms ease' }}
                >
                  {step > s.n ? <Check size={14} /> : s.n}
                </Box>
                <Text
                  span
                  className={classes.stepLabel}
                  c={step >= s.n ? undefined : 'dimmed'}
                  fz="0.8rem"
                  fw={step === s.n ? 600 : 400}
                >
                  {s.label}
                </Text>
              </Group>
              {i < steps.length - 1 && (
                <Box flex={1} h={1} mx="sm" bg={step > s.n ? 'gray.9' : 'gray.3'} />
              )}
            </Group>
          ))}
        </Group>
      </Paper>

      {/* Step Content */}
      <Paper withBorder radius="lg" p={20}>
        {/* Step 1: Cliente */}
        {step === 1 && (
          <Stack gap="md">
            <Title order={3} fz="md" fw={600}>Selecionar cliente</Title>
            <NativeSelect
              label="Cliente"
              value={selectedClientId}
              onChange={e => handleClientChange(e.target.value)}
              radius="md"
              size="md"
              styles={{
                label: { color: 'var(--mantine-color-dimmed)', fontSize: '0.78rem', fontWeight: 400, marginBottom: 6 },
                input: { fontSize: '0.85rem', background: 'var(--mantine-color-gray-0)' },
              }}
              data={clients.map(c => ({ value: c.id, label: c.name }))}
            />
            <NativeSelect
              label="Condição de pagamento"
              value={paymentCond}
              onChange={e => setPaymentCond(e.target.value)}
              radius="md"
              size="md"
              styles={{
                label: { color: 'var(--mantine-color-dimmed)', fontSize: '0.78rem', fontWeight: 400, marginBottom: 6 },
                input: { fontSize: '0.85rem', background: 'var(--mantine-color-gray-0)' },
              }}
              data={['3x sem juros', '5x sem juros', '7x sem juros', 'À Vista', '30 DDL', '30/60 DDL', '30/60/90 DDL']}
            />

            {/* Política comercial dinâmica */}
            <Paper radius="md" bg="gray.0" p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)' }}>
              <Stack gap={8}>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    <Tag size={14} color="var(--mantine-color-gray-9)" />
                    <Text c="dimmed" fz="0.75rem" fw={500}>Política comercial aplicada</Text>
                  </Group>
                  <Badge variant="light" radius="xl" tt="none" c="gray.9" bg="gray.2" fz="0.72rem" fw={700}>
                    {clientPolicy.name}
                  </Badge>
                </Group>
                <SimpleGrid cols={3} spacing={8}>
                  <div>
                    <Text c="dimmed" fz="0.68rem">Desconto</Text>
                    <Text fz="0.82rem" fw={600}>
                      {clientPolicy.discount > 0 ? (
                        <Text span c="teal.7" inherit>{clientPolicy.discount}%</Text>
                      ) : (
                        <span>sem desconto</span>
                      )}
                    </Text>
                  </div>
                  <div>
                    <Text c="dimmed" fz="0.68rem">Pagamento padrão</Text>
                    <Text fz="0.82rem" fw={600}>{clientPolicy.paymentCondition}</Text>
                  </div>
                  <div>
                    <Text c="dimmed" fz="0.68rem">Pedido mínimo</Text>
                    <Text fz="0.82rem" fw={600}>{formatCurrency(clientPolicy.minOrderValue)}</Text>
                  </div>
                </SimpleGrid>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* Step 2: Produtos */}
        {step === 2 && (
          <Stack gap="md">
            <Title order={3} fz="md" fw={600}>Selecionar produto</Title>
            <ProductSelector selected={selectedProduct} onSelect={setSelectedProduct} />
          </Stack>
        )}

        {/* Step 3: Grade */}
        {step === 3 && selectedProduct && (
          <Stack gap={20}>
            <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
              <div>
                <Title order={3} fz="md" fw={600}>{selectedProduct.name}</Title>
                <Text c="dimmed" fz="0.78rem">{selectedProduct.reference} · {formatCurrency(selectedProduct.price)}/par</Text>
              </div>
              <Button
                onClick={handleAutoFill}
                variant="light"
                color="yellow"
                c="yellow.7"
                size="compact-sm"
                radius="md"
                px="sm"
                h={32}
                leftSection={<Zap size={14} />}
                fz="0.78rem"
                fw={600}
                style={{ flexShrink: 0 }}
              >
                Sugestão IA
              </Button>
            </Group>

            {autoFill && (
              <Group gap={8} wrap="nowrap" bg="yellow.0" px="sm" py={8} style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-yellow-3)' }}>
                <Zap size={14} color="var(--mantine-color-yellow-7)" />
                <Text c="yellow.7" fz="0.78rem">Quantidades sugeridas com base no histórico de giro desta loja.</Text>
              </Group>
            )}

            {/* Grade Table */}
            <Box mx={-4} style={{ overflowX: 'auto' }}>
              <Table withRowBorders={false} horizontalSpacing={4} verticalSpacing={0} layout="auto">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th ta="left" c="dimmed" pb="sm" fz="0.72rem" fw={500}>Numeração</Table.Th>
                    {SIZES.map(s => (
                      <Table.Th key={s} ta="center" c="dimmed" pb="sm" fz="0.72rem" fw={500}>Nº {s}</Table.Th>
                    ))}
                    <Table.Th ta="right" c="dimmed" pb="sm" fz="0.72rem" fw={500}>Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Table.Td py={8} c="dimmed" fz="0.78rem">Estoque</Table.Td>
                    {SIZES.map(s => (
                      <Table.Td key={s} py={8} ta="center">
                        <Text span c={(selectedProduct.grades[s] || 0) === 0 ? 'red.7' : (selectedProduct.grades[s] || 0) < 5 ? 'yellow.7' : 'teal.7'} fz="0.78rem" style={tnum}>
                          {selectedProduct.grades[s] || 0}
                        </Text>
                      </Table.Td>
                    ))}
                    <Table.Td />
                  </Table.Tr>
                  <Table.Tr style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Table.Td py="sm" fz="0.82rem" fw={500}>Quantidade</Table.Td>
                    {SIZES.map(s => {
                      const qty = currentGrades[s] || 0;
                      const stock = selectedProduct.grades[s] || 0;
                      return (
                        <Table.Td key={s} py="sm" ta="center">
                          <Group gap={4} justify="center" wrap="nowrap">
                            <UnstyledButton
                              onClick={() => setQty(s, qty - 1)}
                              className={classes.qtyBtn}
                              disabled={qty === 0}
                            >
                              <Minus size={12} />
                            </UnstyledButton>
                            <TextInput
                              type="number"
                              min={0}
                              max={stock}
                              value={qty}
                              onChange={e => setQty(s, parseInt(e.target.value) || 0)}
                              w={40}
                              size="xs"
                              radius="sm"
                              styles={{
                                input: {
                                  textAlign: 'center',
                                  paddingInline: 0,
                                  height: 30,
                                  minHeight: 30,
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  background: 'var(--mantine-color-gray-0)',
                                  borderColor: qty > stock ? 'var(--mantine-color-red-4)' : qty > 0 ? 'var(--mantine-color-gray-6)' : 'var(--mantine-color-gray-3)',
                                  transition: 'border-color 150ms ease',
                                },
                              }}
                            />
                            <UnstyledButton
                              onClick={() => setQty(s, qty + 1)}
                              className={classes.qtyBtn}
                              disabled={qty >= stock}
                            >
                              <Plus size={12} />
                            </UnstyledButton>
                          </Group>
                          {qty > stock && (
                            <Text c="red.7" mt={2} fz="0.6rem">Sem estoque</Text>
                          )}
                        </Table.Td>
                      );
                    })}
                    <Table.Td py="sm" ta="right">
                      <Text span fw={700} fz="0.9rem" style={tnum}>{totalPairs}</Text>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Box>

            {/* Subtotal */}
            <Group justify="space-between" wrap="nowrap" bg="gray.0" px="md" py="sm" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-3)' }}>
              <div>
                <Text c="dimmed" fz="0.75rem">Subtotal deste produto</Text>
                <Text fz="0.82rem">{totalPairs} pares × {formatCurrency(selectedProduct.price)}</Text>
              </div>
              <Text c="gray.9" fz="1.2rem" fw={700} style={tnum}>{formatCurrency(totalValue)}</Text>
            </Group>

            <UnstyledButton
              onClick={() => {
                setAutoFill(false);
                setSelectedProduct(null);
                setStep(2);
              }}
              className={classes.linkBtn}
              style={{ alignSelf: 'flex-start' }}
            >
              + Adicionar outro produto
            </UnstyledButton>
          </Stack>
        )}

        {/* Step 4: Revisão */}
        {step === 4 && (
          <Stack gap={20}>
            <Title order={3} fz="md" fw={600}>Revisão do pedido</Title>

            <SimpleGrid cols={2} spacing="sm">
              <Box bg="gray.0" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                <Text c="dimmed" fz="0.72rem">Cliente</Text>
                <Text fz="0.85rem" fw={600}>{selectedClientObj.name}</Text>
              </Box>
              <Box bg="gray.0" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                <Text c="dimmed" fz="0.72rem">Pagamento</Text>
                <Text fz="0.85rem" fw={600}>{paymentCond}</Text>
              </Box>
            </SimpleGrid>

            {allGrades.length === 0 ? (
              <Group gap={8} wrap="nowrap" bg="yellow.0" px="sm" py="sm" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-yellow-3)' }}>
                <AlertCircle size={16} color="var(--mantine-color-yellow-7)" />
                <Text c="yellow.7" fz="0.8rem">Nenhum produto com quantidade adicionado.</Text>
              </Group>
            ) : (
              <Stack gap="sm">
                {allGrades.map(({ product, sizes, pairs, value }) => (
                  <Paper key={product.id} withBorder radius="md" p="md">
                    <Group justify="space-between" mb="sm" wrap="nowrap">
                      <div>
                        <Text fz="0.85rem" fw={600}>{product.name}</Text>
                        <Text c="dimmed" fz="0.72rem">{product.reference}</Text>
                      </div>
                      <Box ta="right">
                        <Text fw={700} style={tnum}>{formatCurrency(value)}</Text>
                        <Text c="dimmed" fz="0.72rem">{pairs} pares</Text>
                      </Box>
                    </Group>
                    <Group gap={8}>
                      {SIZES.map(s => sizes[s] > 0 && (
                        <Badge key={s} variant="light" radius="sm" tt="none" c="gray.9" bg="gray.1" fz="0.72rem" fw={600} px={8} style={tnum}>
                          {s}: {sizes[s]}
                        </Badge>
                      ))}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}

            <Textarea
              label="Observações"
              value={obs}
              onChange={e => setObs(e.target.value)}
              rows={3}
              placeholder="Informações adicionais para o pedido..."
              radius="md"
              resize="none"
              styles={{
                label: { color: 'var(--mantine-color-dimmed)', fontSize: '0.78rem', fontWeight: 400, marginBottom: 6 },
                input: { fontSize: '0.85rem', background: 'var(--mantine-color-gray-0)' },
              }}
            />

            {/* Aviso pedido mínimo */}
            {allGrades.length > 0 && finalTotal < clientPolicy.minOrderValue && (
              <Group gap={8} wrap="nowrap" bg="yellow.0" px="sm" py={8} style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-yellow-3)' }}>
                <AlertCircle size={14} color="var(--mantine-color-yellow-7)" style={{ flexShrink: 0 }} />
                <Text c="yellow.7" fz="0.78rem">
                  Pedido abaixo do mínimo de {formatCurrency(clientPolicy.minOrderValue)} para {clientPolicy.name}.
                </Text>
              </Group>
            )}

            {/* Breakdown de valor */}
            <Stack gap={8} bg="gray.0" px={20} py="md" style={{ borderRadius: 'var(--mantine-radius-lg)', border: '1px solid var(--mantine-color-gray-3)' }}>
              <Group justify="space-between" wrap="nowrap">
                <Text c="dimmed" fz="0.78rem">Subtotal</Text>
                <Text fz="0.9rem" style={tnum}>{formatCurrency(grandTotal)}</Text>
              </Group>
              {discountPct > 0 && (
                <Group justify="space-between" wrap="nowrap">
                  <Text c="teal.7" fz="0.78rem">
                    Desconto {clientPolicy.name} ({discountPct}%)
                  </Text>
                  <Text c="teal.7" fz="0.9rem" style={tnum}>-{formatCurrency(discountAmount)}</Text>
                </Group>
              )}
              <Group justify="space-between" wrap="nowrap" pt={8} style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                <div>
                  <Text c="dimmed" fz="0.78rem">Total do pedido</Text>
                  <Text fz="0.82rem">{grandPairs} pares · {allGrades.length} produto(s)</Text>
                </div>
                <Text c="gray.9" fz="1.5rem" fw={700} style={tnum}>{formatCurrency(finalTotal)}</Text>
              </Group>
            </Stack>
          </Stack>
        )}
      </Paper>

      {/* Navigation */}
      <Group justify="space-between" wrap="nowrap">
        <Button
          onClick={() => setStep(s => Math.max(selectedClient ? 2 : 1, s - 1))}
          disabled={step === (selectedClient ? 2 : 1)}
          variant="default"
          radius="md"
          leftSection={<ChevronLeft size={16} />}
          fz="0.85rem"
          fw={500}
        >
          Voltar
        </Button>

        <Group gap="sm" wrap="nowrap">
          {allGrades.length > 0 && step < 4 && (
            <Text span c="dimmed" fz="0.78rem">
              <Text span c="var(--mantine-color-text)" fw={600} inherit>{grandPairs}</Text> pares · {formatCurrency(grandTotal)}
            </Text>
          )}
          {step < 4 ? (
            <Button
              onClick={() => setStep(s => Math.min(4, s + 1))}
              disabled={step === 3 && totalPairs === 0}
              radius="md"
              px={20}
              rightSection={<ChevronRight size={16} />}
              fz="0.85rem"
              fw={600}
            >
              {step === 3 ? 'Revisar pedido' : 'Continuar'}
            </Button>
          ) : (
            <Button
              onClick={() => setCompleted(true)}
              disabled={allGrades.length === 0}
              radius="md"
              px={20}
              leftSection={<ShoppingCart size={16} />}
              fz="0.85rem"
              fw={600}
            >
              Confirmar pedido
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}
