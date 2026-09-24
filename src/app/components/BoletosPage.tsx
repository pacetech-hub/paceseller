import { useEffect, useState } from "react";
import {
  Stack, Group, Box, Paper, Text, TextInput, Chip, Badge, Button, SegmentedControl, Code,
  SimpleGrid, ThemeIcon, UnstyledButton, Collapse, List, Card, Divider,
} from "@mantine/core";
import { toast } from "../lib/toast";
import classes from "./interactive.module.css";
import boletos from "./BoletosPage.module.css";
import {
  MagnifyingGlassIcon,
  DownloadSimpleIcon,
  CopyIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningIcon,
  ReceiptIcon,
  CaretDownIcon,
  BarcodeIcon,
  QrCodeIcon,
  type Icon,
} from "@phosphor-icons/react";
import { formatCurrency, formatDate } from "../data/mockData";

type Profile = 'admin' | 'rep' | 'lojista';

interface BoletosPageProps {
  profile: Profile;
  initialSearch?: string;
}

type PaymentStatus = 'pago' | 'pendente' | 'atrasado';
type PaymentMethod = 'boleto' | 'pix';

interface Payment {
  id: string;
  orderId: string;
  client: string;
  rep: string;
  product: string;
  orderTotal: number;
  amount: number;
  installment: string;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  boletoLine: string;
  pixCode: string;
}

// today reference used for the "next 30 days" / overdue math below — kept fixed so the mock
// dataset's pago/pendente/atrasado split stays consistent regardless of the real device clock
const TODAY = new Date('2026-08-21T00:00:00');

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seededDigits(seed: string, len: number): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let out = '';
  for (let i = 0; i < len; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out += (h % 10).toString();
  }
  return out;
}

function seededHex(seed: string, len: number): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hexChars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out += hexChars[h % 16];
  }
  return out;
}

function buildBoletoLine(id: string, amount: number): string {
  const b1a = seededDigits(id + '1a', 5);
  const b1b = seededDigits(id + '1b', 5);
  const b2a = seededDigits(id + '2a', 5);
  const b2b = seededDigits(id + '2b', 6);
  const b3a = seededDigits(id + '3a', 5);
  const b3b = seededDigits(id + '3b', 6);
  const checkDigit = seededDigits(id + 'chk', 1);
  const factor = seededDigits(id + 'fat', 4);
  const valueCode = Math.round(amount * 100).toString().padStart(10, '0');
  return `${b1a}.${b1b} ${b2a}.${b2b} ${b3a}.${b3b} ${checkDigit} ${factor}${valueCode}`;
}

function buildPixCode(id: string, amount: number): string {
  const hex = seededHex(id + 'pix', 32);
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  const amountStr = amount.toFixed(2);
  const crc = seededHex(id + 'crc', 4).toUpperCase();
  return `00020126580014BR.GOV.BCB.PIX0136${uuid}5204000053039865406${amountStr}5802BR5913TESLA FOOTWEAR6009SAO PAULO62070503***6304${crc}`;
}

function makePayment(base: Omit<Payment, 'boletoLine' | 'pixCode' | 'paymentDate'> & { paymentDate?: string }): Payment {
  return {
    ...base,
    paymentDate: base.status === 'pago' ? (base.paymentDate ?? shiftDate(base.dueDate, -2)) : undefined,
    boletoLine: buildBoletoLine(base.id, base.amount),
    pixCode: buildPixCode(base.id, base.amount),
  };
}

const boletosCarteira: Payment[] = [
  makePayment({ id: 'BOL-2026-8121', orderId: 'PED-2026-0412', client: 'Calçadão Paulista LTDA', rep: 'Marcos Andrade', product: 'Tênis Casual — Grade Mista', orderTotal: 10540.00, amount: 3513.33, installment: '1/3', dueDate: '2026-07-09', status: 'pago' }),
  makePayment({ id: 'BOL-2026-8122', orderId: 'PED-2026-0412', client: 'Calçadão Paulista LTDA', rep: 'Marcos Andrade', product: 'Tênis Casual — Grade Mista', orderTotal: 10540.00, amount: 3513.33, installment: '2/3', dueDate: '2026-08-09', status: 'atrasado' }),
  makePayment({ id: 'BOL-2026-8123', orderId: 'PED-2026-0412', client: 'Calçadão Paulista LTDA', rep: 'Marcos Andrade', product: 'Tênis Casual — Grade Mista', orderTotal: 10540.00, amount: 3513.34, installment: '3/3', dueDate: '2026-09-09', status: 'pendente' }),

  makePayment({ id: 'BOL-2026-8231', orderId: 'PED-2026-0411', client: 'Sapataria Mineira', rep: 'Fernanda Lima', product: 'Sapatos Sociais — Linha Executiva', orderTotal: 7310.00, amount: 2436.67, installment: '1/3', dueDate: '2026-07-08', status: 'pago' }),
  makePayment({ id: 'BOL-2026-8232', orderId: 'PED-2026-0411', client: 'Sapataria Mineira', rep: 'Fernanda Lima', product: 'Sapatos Sociais — Linha Executiva', orderTotal: 7310.00, amount: 2436.67, installment: '2/3', dueDate: '2026-08-08', status: 'pago' }),
  makePayment({ id: 'BOL-2026-8233', orderId: 'PED-2026-0411', client: 'Sapataria Mineira', rep: 'Fernanda Lima', product: 'Sapatos Sociais — Linha Executiva', orderTotal: 7310.00, amount: 2436.66, installment: '3/3', dueDate: '2026-09-08', status: 'pendente' }),

  makePayment({ id: 'BOL-2026-8201', orderId: 'PED-2026-0406', client: 'Step Up Calçados', rep: 'Carlos Mendes', product: 'Tênis Esportivo — Coleção Verão 26', orderTotal: 9180.00, amount: 3060.00, installment: '1/3', dueDate: '2026-07-03', status: 'pago' }),
  makePayment({ id: 'BOL-2026-8202', orderId: 'PED-2026-0406', client: 'Step Up Calçados', rep: 'Carlos Mendes', product: 'Tênis Esportivo — Coleção Verão 26', orderTotal: 9180.00, amount: 3060.00, installment: '2/3', dueDate: '2026-08-03', status: 'atrasado' }),
  makePayment({ id: 'BOL-2026-8203', orderId: 'PED-2026-0406', client: 'Step Up Calçados', rep: 'Carlos Mendes', product: 'Tênis Esportivo — Coleção Verão 26', orderTotal: 9180.00, amount: 3060.00, installment: '3/3', dueDate: '2026-09-03', status: 'pendente' }),

  makePayment({ id: 'BOL-2026-8171', orderId: 'PED-2026-0407', client: 'Fashion Feet SP', rep: 'Fernanda Lima', product: 'Sandálias Femininas — Coleção Verão 26', orderTotal: 18480.00, amount: 6160.00, installment: '1/3', dueDate: '2026-07-04', status: 'pago' }),
  makePayment({ id: 'BOL-2026-8172', orderId: 'PED-2026-0407', client: 'Fashion Feet SP', rep: 'Fernanda Lima', product: 'Sandálias Femininas — Coleção Verão 26', orderTotal: 18480.00, amount: 6160.00, installment: '2/3', dueDate: '2026-08-04', status: 'atrasado' }),
  makePayment({ id: 'BOL-2026-8173', orderId: 'PED-2026-0407', client: 'Fashion Feet SP', rep: 'Fernanda Lima', product: 'Sandálias Femininas — Coleção Verão 26', orderTotal: 18480.00, amount: 6160.00, installment: '3/3', dueDate: '2026-09-04', status: 'pendente' }),

  makePayment({ id: 'BOL-2026-8091', orderId: 'PED-2026-0409', client: 'Pé de Pato Bahia', rep: 'Ana Santos', product: 'Chinelos Infantis — Coleção Verão 26', orderTotal: 5760.00, amount: 2880.00, installment: '1/2', dueDate: '2026-08-06', status: 'atrasado' }),
  makePayment({ id: 'BOL-2026-8092', orderId: 'PED-2026-0409', client: 'Pé de Pato Bahia', rep: 'Ana Santos', product: 'Chinelos Infantis — Coleção Verão 26', orderTotal: 5760.00, amount: 2880.00, installment: '2/2', dueDate: '2026-09-06', status: 'pendente' }),
];

const boletosLojista: Payment[] = [
  makePayment({ id: 'BOL-2026-9001', orderId: 'PED-2026-0388', client: 'Bella Moda', rep: 'Marina Costa', product: 'Tênis Casual — Reposição', orderTotal: 8420.00, amount: 2807.00, installment: '1/3', dueDate: '2026-06-20', status: 'pago' }),
  makePayment({ id: 'BOL-2026-9002', orderId: 'PED-2026-0388', client: 'Bella Moda', rep: 'Marina Costa', product: 'Tênis Casual — Reposição', orderTotal: 8420.00, amount: 2807.00, installment: '2/3', dueDate: '2026-07-20', status: 'pago' }),
  makePayment({ id: 'BOL-2026-9003', orderId: 'PED-2026-0388', client: 'Bella Moda', rep: 'Marina Costa', product: 'Tênis Casual — Reposição', orderTotal: 8420.00, amount: 2806.00, installment: '3/3', dueDate: '2026-08-20', status: 'atrasado' }),

  makePayment({ id: 'BOL-2026-9101', orderId: 'PED-2026-0501', client: 'Bella Moda', rep: 'Marina Costa', product: 'Sandálias Femininas — Coleção Verão 26', orderTotal: 5120.00, amount: 1706.67, installment: '1/3', dueDate: '2026-08-25', status: 'pendente' }),
  makePayment({ id: 'BOL-2026-9102', orderId: 'PED-2026-0501', client: 'Bella Moda', rep: 'Marina Costa', product: 'Sandálias Femininas — Coleção Verão 26', orderTotal: 5120.00, amount: 1706.67, installment: '2/3', dueDate: '2026-09-25', status: 'pendente' }),
  makePayment({ id: 'BOL-2026-9103', orderId: 'PED-2026-0501', client: 'Bella Moda', rep: 'Marina Costa', product: 'Sandálias Femininas — Coleção Verão 26', orderTotal: 5120.00, amount: 1706.66, installment: '3/3', dueDate: '2026-10-25', status: 'pendente' }),
];

// cor Mantine do badge de cada status
const statusColors: Record<PaymentStatus, string> = {
  pago: 'teal',
  pendente: 'yellow',
  atrasado: 'red',
};

const statusIcon: Record<PaymentStatus, Icon> = {
  pago: CheckCircleIcon,
  pendente: ClockIcon,
  atrasado: WarningIcon,
};

const statusLabel: Record<PaymentStatus, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
};

// Copia o código e devolve se deu certo; a confirmação persistente fica no próprio cartão (botão + texto ao lado)
async function copyToClipboard(text: string, label: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) throw new Error('clipboard indisponível');
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`, 'Cole no app do seu banco para pagar');
    return true;
  } catch {
    toast.error(`Não foi possível copiar o ${label.toLowerCase()}`, 'Selecione o código no quadro acima e copie manualmente (Ctrl+C)');
    return false;
  }
}

function PixQrCode({ data, size = 168 }: { data: string; size?: number }) {
  const grid = 25;
  const cell = size / grid;
  const zones: Array<[number, number]> = [[0, 0], [0, grid - 7], [grid - 7, 0]];

  const bit = (r: number, c: number) => {
    const s = `${data}-${r}-${c}`;
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 2;
  };

  const finderBit = (r: number, c: number, zr: number, zc: number) => {
    const rr = r - zr, cc = c - zc;
    const border = rr === 0 || rr === 6 || cc === 0 || cc === 6;
    const inner = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
    return border || inner;
  };

  const cells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const zone = zones.find(([zr, zc]) => r >= zr && r < zr + 7 && c >= zc && c < zc + 7);
      const on = zone ? finderBit(r, c, zone[0], zone[1]) : bit(r, c) === 1;
      if (on) cells.push({ r, c });
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR Code Pix">
      <rect x={0} y={0} width={size} height={size} fill="#fff" />
      {cells.map(({ r, c }) => (
        <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111827" />
      ))}
    </svg>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <Box>
      <Text c="dimmed" size="sm" mb={4}>{label}</Text>
      <Code block className={`mono ${boletos.wrap}`} fz="sm">
        {code}
      </Code>
    </Box>
  );
}

function PaymentCard({ payment, profile }: { payment: Payment; profile: Profile }) {
  const [expanded, setExpanded] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('boleto');
  const [showQr, setShowQr] = useState(false);
  // qual código acabou de ser copiado (troca o texto do botão por alguns segundos)
  const [justCopied, setJustCopied] = useState<PaymentMethod | null>(null);
  // qual código já foi copiado nesta abertura (mantém a orientação "cole no app do banco" visível)
  const [copiedOnce, setCopiedOnce] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (!justCopied) return;
    const t = setTimeout(() => setJustCopied(null), 4000);
    return () => clearTimeout(t);
  }, [justCopied]);

  const handleCopy = async (which: PaymentMethod) => {
    const ok = await copyToClipboard(
      which === 'boleto' ? payment.boletoLine : payment.pixCode,
      which === 'boleto' ? 'Código de barras' : 'Código Pix',
    );
    if (ok) {
      setJustCopied(which);
      setCopiedOnce(which);
    }
  };

  const copyHint = (which: PaymentMethod) => copiedOnce === which && (
    <Group gap={6} wrap="nowrap" role="status">
      <CheckCircleIcon size={16} color="var(--mantine-color-teal-6)" style={{ flexShrink: 0 }} />
      <Text size="sm" c="dimmed">
        {which === 'boleto'
          ? 'Código de barras copiado. Cole no app do seu banco, na opção de pagar boleto.'
          : 'Código Pix copiado. Cole no app do seu banco, em Pix Copia e Cola.'}
      </Text>
    </Group>
  );

  const isPago = payment.status === 'pago';
  const StatusIcon = statusIcon[payment.status];

  const metaParts = [
    `Pedido ${payment.orderId}`,
    `Parcela ${payment.installment}`,
    `Valor do pedido: ${formatCurrency(payment.orderTotal)}`,
    ...(profile !== 'lojista' ? [payment.client] : []),
    ...(profile === 'admin' ? [payment.rep] : []),
  ];

  const summary = (
    <Group gap="md" wrap="wrap" p="md">
      <Box miw={0} flex={1}>
        {/* line 1: status + due/payment date */}
        <Group gap={8} mb={4}>
          <Badge
            variant="light"
            color={statusColors[payment.status]}
            leftSection={<StatusIcon size={14} />}
            style={{ flexShrink: 0 }}
          >
            {statusLabel[payment.status]}
          </Badge>
          <Text c="dimmed" size="sm" flex="none">
            {formatDate(isPago ? (payment.paymentDate as string) : payment.dueDate)}
          </Text>
        </Group>
        {/* line 2: order title */}
        <Text fw={600} truncate mb={2}>{payment.product}</Text>
        {/* line 3: order id + parcela + valor do pedido (+ client/rep) */}
        <Text c="dimmed" size="sm" truncate>{metaParts.join(' · ')}</Text>
      </Box>

      <Text className="mono" size="lg" fw={700} ta="right" flex="none">
        {formatCurrency(payment.amount)}
      </Text>

      {!isPago && (
        <CaretDownIcon
          size={16}
          color="var(--mantine-color-dimmed)"
          className={boletos.caret}
          data-expanded={expanded || undefined}
        />
      )}
    </Group>
  );

  return (
    <Card withBorder padding={0}>
      {isPago ? summary : (
        <UnstyledButton onClick={() => setExpanded(e => !e)} className={classes.hoverable} w="100%" aria-expanded={expanded}>
          {summary}
        </UnstyledButton>
      )}

      {!isPago && (
        <Collapse in={expanded}>
          <Divider color="var(--mantine-color-default-border)" />
          <Box p="md" bg="var(--mantine-color-default-hover)">
            <SegmentedControl
              value={method}
              onChange={v => setMethod(v as PaymentMethod)}
              mb="sm"
              aria-label="Forma de pagamento"
              data={[
                { value: 'boleto', label: <Group gap={6} wrap="nowrap"><BarcodeIcon size={16} /> Boleto</Group> },
                { value: 'pix', label: <Group gap={6} wrap="nowrap"><QrCodeIcon size={16} /> Pix</Group> },
              ]}
            />

            {method === 'boleto' ? (
              <Stack gap="sm">
                <CodeBlock label="Linha digitável" code={payment.boletoLine} />
                {/* secundária à esquerda, principal (copiar) à direita */}
                <Group gap="sm" justify="flex-end">
                  <Button
                    onClick={() => toast.success('Download da fatura iniciado', 'O PDF vai para a pasta Downloads do seu dispositivo')}
                    variant="default"
                    leftSection={<DownloadSimpleIcon size={16} />}
                  >
                    Baixar Fatura
                  </Button>
                  <Button
                    onClick={() => handleCopy('boleto')}
                    variant="filled"
                    color={justCopied === 'boleto' ? 'teal' : undefined}
                    leftSection={justCopied === 'boleto' ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
                  >
                    {justCopied === 'boleto' ? 'Código Copiado' : 'Copiar Código de Barras'}
                  </Button>
                </Group>
                {copyHint('boleto')}
              </Stack>
            ) : (
              <Stack gap="sm">
                <CodeBlock label="Pix Copia e Cola" code={payment.pixCode} />
                {/* secundária à esquerda, principal (copiar) à direita */}
                <Group gap="sm" justify="flex-end">
                  <Button
                    onClick={() => setShowQr(v => !v)}
                    variant="default"
                    leftSection={<QrCodeIcon size={16} />}
                  >
                    {showQr ? 'Ocultar QR Code' : 'Mostrar QR Code Pix'}
                  </Button>
                  <Button
                    onClick={() => handleCopy('pix')}
                    variant="filled"
                    color={justCopied === 'pix' ? 'teal' : undefined}
                    leftSection={justCopied === 'pix' ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
                  >
                    {justCopied === 'pix' ? 'Código Copiado' : 'Copiar Código Pix'}
                  </Button>
                </Group>
                {copyHint('pix')}

                {showQr && (
                  <Group gap="md" align="flex-start" pt={4}>
                    <Paper withBorder p="sm" bg="white" flex="none">
                      <PixQrCode data={payment.pixCode} />
                    </Paper>
                    <Box flex={1} miw={220}>
                      <Text fw={600} mb={4}>Como pagar</Text>
                      <List type="ordered" withPadding listStyleType="decimal" size="sm" c="dimmed" spacing={4}>
                        <List.Item>Abra o app do seu banco</List.Item>
                        <List.Item>Escolha pagar via Pix com QR Code ou Copia e Cola</List.Item>
                        <List.Item>Escaneie o código ao lado ou cole o código copiado</List.Item>
                        <List.Item>Confirme o valor de {formatCurrency(payment.amount)} e finalize o pagamento</List.Item>
                      </List>
                    </Box>
                  </Group>
                )}
              </Stack>
            )}
          </Box>
        </Collapse>
      )}
    </Card>
  );
}
export function BoletosPage({ profile, initialSearch = '' }: BoletosPageProps) {
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<'todos' | PaymentStatus>('todos');

  const isLojista = profile === 'lojista';
  const isRep = profile === 'rep';

  const basePayments = isLojista
    ? boletosLojista
    : isRep
    ? boletosCarteira.filter(p => p.rep === 'Marcos Andrade')
    : boletosCarteira;

  const statuses: Array<'todos' | PaymentStatus> = ['todos', 'atrasado', 'pendente', 'pago'];

  const statusPriority: Record<PaymentStatus, number> = { atrasado: 0, pendente: 1, pago: 2 };

  const filtered = basePayments
    .filter(p => {
      const matchSearch = p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.orderId.toLowerCase().includes(search.toLowerCase()) ||
        p.client.toLowerCase().includes(search.toLowerCase()) ||
        p.product.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  const cutoff30 = new Date(TODAY);
  cutoff30.setDate(cutoff30.getDate() + 30);

  const openList = basePayments.filter(p => p.status !== 'pago');
  const overdueList = basePayments.filter(p => p.status === 'atrasado');
  const dueSoonList = basePayments.filter(p => p.status === 'pendente' && new Date(p.dueDate + 'T00:00:00') <= cutoff30);

  const totalOpen = openList.reduce((acc, p) => acc + p.amount, 0);
  const totalDueSoon = dueSoonList.reduce((acc, p) => acc + p.amount, 0);
  const totalOverdue = overdueList.reduce((acc, p) => acc + p.amount, 0);

  const stats = [
    { label: 'Em aberto', value: formatCurrency(totalOpen), caption: undefined, tone: 'default' as const },
    { label: 'A vencer', value: formatCurrency(totalDueSoon), caption: 'nos próximos 30 dias', tone: 'default' as const },
    { label: 'Vencidos', value: formatCurrency(totalOverdue), caption: undefined, tone: 'danger' as const },
  ];

  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* Financial summary */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {stats.map(stat => (
          <Paper
            key={stat.label}
            withBorder
            p="md"
            bd={stat.tone === 'danger' ? '1px solid var(--mantine-color-red-3)' : undefined}
          >
            <Text c="dimmed" size="sm" fw={600} mb={4}>{stat.label}</Text>
            <Text
              className="mono"
              c={stat.tone === 'danger' ? 'red.6' : undefined}
              fw={700}
              mb={stat.caption ? 4 : 0}
              fz="xl"
            >
              {stat.value}
            </Text>
            {stat.caption && <Text c="dimmed" size="sm">{stat.caption}</Text>}
          </Paper>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Group gap="sm" wrap="wrap">
        <TextInput
          placeholder={isLojista ? 'Buscar por boleto, pedido ou produto' : 'Buscar por boleto, pedido, cliente ou produto'}
          leftSection={<MagnifyingGlassIcon size={16} />}
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          flex={{ base: '1 1 100%', sm: 1 }}
          miw={{ sm: 160 }}
        />
        <Chip.Group value={statusFilter} onChange={v => setStatusFilter(v as 'todos' | PaymentStatus)}>
          <Group gap="sm">
            {statuses.map(s => (
              <Chip key={s} value={s} variant="filled" color="neutral">
                {s === 'todos' ? 'Todos' : statusLabel[s]}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Group>

      {/* Payment cards */}
      <Stack gap="sm">
        {filtered.map(payment => (
          <PaymentCard key={payment.id} payment={payment} profile={profile} />
        ))}

        {filtered.length === 0 && (
          <Paper withBorder py={64}>
            <Stack align="center" gap={4}>
              <ThemeIcon variant="light" color="neutral" size={48} mb={8}>
                <ReceiptIcon size={24} />
              </ThemeIcon>
              <Text fw={600}>Nenhum boleto encontrado</Text>
              <Text c="dimmed" size="sm" ta="center" px="md">
                Nenhum boleto corresponde à busca ou ao status selecionado. Limpe-os para ver todos os seus boletos.
              </Text>
              <Button variant="default" mt="sm" onClick={() => { setSearch(''); setStatusFilter('todos'); }}>
                Limpar Busca e Filtros
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
