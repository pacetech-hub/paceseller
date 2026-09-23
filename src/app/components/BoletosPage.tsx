import { useState } from "react";
import {
  Box, Paper, Group, Stack, Text, Button, TextInput, SimpleGrid, Badge, Center,
} from "@mantine/core";
import { toast } from "@/lib/toast";
import {
  Search, Download, Copy, CheckCircle2, Clock, AlertTriangle, Receipt,
  ChevronDown, Barcode, QrCode, type LucideIcon,
} from "lucide-react";
import { formatCurrency, formatDate } from "../data/mockData";
import classes from "./BoletosPage.module.css";

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

const statusColors: Record<PaymentStatus, string> = {
  pago: 'teal',
  pendente: 'yellow',
  atrasado: 'red',
};

const statusIcon: Record<PaymentStatus, LucideIcon> = {
  pago: CheckCircle2,
  pendente: Clock,
  atrasado: AlertTriangle,
};

const statusLabel: Record<PaymentStatus, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
};

function copyToClipboard(text: string, label: string) {
  navigator.clipboard?.writeText(text).then(
    () => toast.success(`${label} copiado`),
    () => toast.error(`Não foi possível copiar o ${label.toLowerCase()}`)
  );
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

function PaymentCard({ payment, profile }: { payment: Payment; profile: Profile }) {
  const [expanded, setExpanded] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('boleto');
  const [showQr, setShowQr] = useState(false);

  const isPago = payment.status === 'pago';
  const StatusIcon = statusIcon[payment.status];

  const metaParts = [
    `Pedido ${payment.orderId}`,
    `Parcela ${payment.installment}`,
    `Valor do pedido: ${formatCurrency(payment.orderTotal)}`,
    ...(profile !== 'lojista' ? [payment.client] : []),
    ...(profile === 'admin' ? [payment.rep] : []),
  ];

  const methodButtonProps = (selected: boolean) => ({
    variant: selected ? 'filled' : 'default',
    c: selected ? undefined : 'dimmed',
    size: 'xs',
    h: 32,
    px: 'sm',
    fz: '0.78rem',
    fw: 600,
  } as const);

  return (
    <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
      <div
        onClick={!isPago ? () => setExpanded(e => !e) : undefined}
        className={!isPago ? `${classes.header} ${classes.clickable}` : classes.header}
      >
        <Box miw={0} flex={1}>
          {/* line 1: status + due/payment date */}
          <Group gap={8} mb={4}>
            <Badge
              variant="light"
              color={statusColors[payment.status]}
              radius="xl"
              tt="none"
              fz="0.7rem"
              fw={600}
              leftSection={<StatusIcon size={12} />}
              style={{ flexShrink: 0 }}
            >
              {statusLabel[payment.status]}
            </Badge>
            <Text span c="dimmed" size="0.72rem" style={{ flexShrink: 0 }}>
              {formatDate(isPago ? (payment.paymentDate as string) : payment.dueDate)}
            </Text>
          </Group>
          {/* line 2: order title */}
          <Text truncate mb={2} size="0.85rem" fw={600}>{payment.product}</Text>
          {/* line 3: order id + parcela + valor do pedido (+ client/rep) */}
          <Text c="dimmed" truncate size="0.72rem">{metaParts.join(' · ')}</Text>
        </Box>

        <Box ta="right" style={{ flexShrink: 0 }}>
          <Text size="0.95rem" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(payment.amount)}</Text>
        </Box>

        {!isPago && (
          <ChevronDown
            size={16}
            color="var(--mantine-color-dimmed)"
            style={{ flexShrink: 0, transition: 'transform 150ms ease', transform: expanded ? 'rotate(180deg)' : undefined }}
          />
        )}
      </div>

      {expanded && !isPago && (
        <Box p="md" bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap={6} mb="sm" role="tablist" aria-label="Forma de pagamento">
            <Button
              onClick={() => setMethod('boleto')}
              aria-pressed={method === 'boleto'}
              leftSection={<Barcode size={14} />}
              {...methodButtonProps(method === 'boleto')}
            >
              Boleto
            </Button>
            <Button
              onClick={() => setMethod('pix')}
              aria-pressed={method === 'pix'}
              leftSection={<QrCode size={14} />}
              {...methodButtonProps(method === 'pix')}
            >
              Pix
            </Button>
          </Group>

          {method === 'boleto' ? (
            <Stack gap="sm">
              <div>
                <Text c="dimmed" mb={4} size="0.7rem">Linha digitável</Text>
                <code className={classes.code} style={{ fontSize: '0.78rem' }}>
                  {payment.boletoLine}
                </code>
              </div>
              <Group gap={8}>
                <Button
                  onClick={() => copyToClipboard(payment.boletoLine, 'Código de barras')}
                  variant="light"
                  size="xs"
                  h={32}
                  px="sm"
                  fz="0.78rem"
                  fw={600}
                  leftSection={<Copy size={14} />}
                >
                  Copiar código de barras
                </Button>
                <Button
                  onClick={() => toast.success('Fatura baixada')}
                  variant="default"
                  size="xs"
                  h={32}
                  px="sm"
                  fz="0.78rem"
                  fw={500}
                  leftSection={<Download size={14} />}
                >
                  Baixar fatura
                </Button>
              </Group>
            </Stack>
          ) : (
            <Stack gap="sm">
              <div>
                <Text c="dimmed" mb={4} size="0.7rem">Pix Copia e Cola</Text>
                <code className={classes.code} style={{ fontSize: '0.72rem' }}>
                  {payment.pixCode}
                </code>
              </div>
              <Group gap={8}>
                <Button
                  onClick={() => copyToClipboard(payment.pixCode, 'Código Pix')}
                  variant="light"
                  size="xs"
                  h={32}
                  px="sm"
                  fz="0.78rem"
                  fw={600}
                  leftSection={<Copy size={14} />}
                >
                  Copiar código Pix
                </Button>
                <Button
                  onClick={() => setShowQr(v => !v)}
                  variant="default"
                  size="xs"
                  h={32}
                  px="sm"
                  fz="0.78rem"
                  fw={500}
                  leftSection={<QrCode size={14} />}
                >
                  {showQr ? 'Ocultar QR Code' : 'Ver QR Code Pix'}
                </Button>
              </Group>

              {showQr && (
                <Group align="flex-start" gap="md" pt={4}>
                  <Paper withBorder radius="md" p="sm" bg="white" style={{ display: 'inline-block', flexShrink: 0 }}>
                    <PixQrCode data={payment.pixCode} />
                  </Paper>
                  <Box flex={1} miw={220}>
                    <Text mb={4} size="0.8rem" fw={600}>Como pagar</Text>
                    <ol className={classes.steps}>
                      <li>Abra o app do seu banco</li>
                      <li>Escolha pagar via Pix com QR Code ou Copia e Cola</li>
                      <li>Escaneie o código ao lado ou cole o código copiado</li>
                      <li>Confirme o valor de {formatCurrency(payment.amount)} e finalize o pagamento</li>
                    </ol>
                  </Box>
                </Group>
              )}
            </Stack>
          )}
        </Box>
      )}
    </Paper>
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
    <Stack gap={20} p="lg" maw={1400} mx="auto" w="100%">
      {/* Financial summary */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {stats.map(stat => (
          <Paper
            key={stat.label}
            radius="lg"
            p="md"
            style={{ border: `1px solid ${stat.tone === 'danger' ? 'var(--mantine-color-red-3)' : 'var(--mantine-color-gray-3)'}` }}
          >
            <Text c="dimmed" mb={4} size="0.75rem" fw={500}>{stat.label}</Text>
            <Text
              mb={stat.caption ? 4 : undefined}
              c={stat.tone === 'danger' ? 'red.7' : undefined}
              size="1.4rem"
              fw={700}
              lts="-0.01em"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {stat.value}
            </Text>
            {stat.caption && <Text c="dimmed" size="0.7rem">{stat.caption}</Text>}
          </Paper>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Group gap="sm">
        <TextInput
          type="text"
          placeholder={isLojista ? 'Buscar boleto, pedido...' : 'Buscar boleto, pedido, cliente...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftSection={<Search size={14} color="var(--mantine-color-dimmed)" />}
          flex={1}
          miw={160}
          styles={{ input: { fontSize: '0.82rem' } }}
        />
        <Group gap={6}>
          {statuses.map(s => (
            <Button
              key={s}
              onClick={() => setStatusFilter(s)}
              variant={statusFilter === s ? 'filled' : 'default'}
              c={statusFilter === s ? undefined : 'dimmed'}
              radius="xl"
              size="xs"
              h={30}
              px="sm"
              fz="0.75rem"
              fw={500}
              tt="capitalize"
            >
              {s === 'todos' ? 'Todos' : statusLabel[s]}
            </Button>
          ))}
        </Group>
      </Group>

      {/* Payment cards */}
      <Stack gap="sm">
        {filtered.map(payment => (
          <PaymentCard key={payment.id} payment={payment} profile={profile} />
        ))}

        {filtered.length === 0 && (
          <Paper withBorder radius="lg" py={64} ta="center">
            <Center mb="sm">
              <Receipt size={40} color="var(--mantine-color-gray-4)" />
            </Center>
            <Text fw={600}>Nenhum boleto encontrado</Text>
            <Text c="dimmed" mt={4} size="0.85rem">Tente ajustar os filtros de busca</Text>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
