import { useState } from "react";
import { toast } from "sonner";
import {
  Search, Download, Copy, CheckCircle2, Clock, AlertTriangle, Receipt,
  ChevronDown, Barcode, QrCode,
} from "lucide-react";
import { formatCurrency, formatDate } from "../data/mockData";

type Profile = 'admin' | 'rep' | 'lojista';

interface BoletosPageProps {
  profile: Profile;
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
  pago: 'text-emerald-400 bg-emerald-400/10',
  pendente: 'text-amber-400 bg-amber-400/10',
  atrasado: 'text-red-400 bg-red-400/10',
};

const statusIcon: Record<PaymentStatus, React.ComponentType<{ className?: string }>> = {
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

const quickActionClass = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex-shrink-0';

function PaymentCard({ payment, profile }: { payment: Payment; profile: Profile }) {
  const [expanded, setExpanded] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('boleto');
  const [showQr, setShowQr] = useState(false);

  const isPago = payment.status === 'pago';
  const StatusIcon = statusIcon[payment.status];

  const openMethod = (m: PaymentMethod) => {
    setMethod(m);
    setExpanded(true);
  };

  const metaParts = [
    `Pedido ${payment.orderId}`,
    `Parcela ${payment.installment}`,
    `Valor do pedido: ${formatCurrency(payment.orderTotal)}`,
    ...(profile !== 'lojista' ? [payment.client] : []),
    ...(profile === 'admin' ? [payment.rep] : []),
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 flex items-center gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          {/* line 1: status + due/payment date */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[payment.status]}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              <StatusIcon className="w-3 h-3" />
              {statusLabel[payment.status]}
            </span>
            <span className="text-muted-foreground flex-shrink-0" style={{ fontSize: '0.72rem' }}>
              {formatDate(isPago ? (payment.paymentDate as string) : payment.dueDate)}
            </span>
          </div>
          {/* line 2: order title */}
          <p className="text-foreground truncate mb-0.5" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{payment.product}</p>
          {/* line 3: order id + parcela + valor do pedido (+ client/rep) */}
          <p className="text-muted-foreground truncate" style={{ fontSize: '0.72rem' }}>{metaParts.join(' · ')}</p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-foreground mono" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{formatCurrency(payment.amount)}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!isPago ? (
            <>
              <button onClick={() => openMethod('boleto')} className={quickActionClass} style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                <Barcode className="w-3.5 h-3.5" /> Boleto
              </button>
              <button onClick={() => openMethod('pix')} className={quickActionClass} style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                <QrCode className="w-3.5 h-3.5" /> Pix
              </button>
            </>
          ) : (
            <button onClick={() => setExpanded(e => !e)} className={quickActionClass} style={{ fontSize: '0.75rem', fontWeight: 500 }}>
              <Download className="w-3.5 h-3.5" /> Comprovante
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex-shrink-0"
            title={expanded ? 'Recolher detalhes' : 'Ver detalhes'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-secondary/20 p-4">
          {isPago ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Valor pago</p>
                <p className="text-emerald-400 mono" style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(payment.amount)}</p>
              </div>
              <button
                onClick={() => toast.success('Comprovante baixado')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                style={{ fontSize: '0.78rem', fontWeight: 500 }}
              >
                <Download className="w-3.5 h-3.5" /> Baixar comprovante
              </button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-3" style={{ fontSize: '0.75rem' }}>
                Valor a pagar: <span className="text-foreground mono" style={{ fontWeight: 700 }}>{formatCurrency(payment.amount)}</span>
              </p>

              {method === 'boleto' ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground mb-1" style={{ fontSize: '0.7rem' }}>Linha digitável</p>
                    <code className="block px-3 py-2 rounded-lg bg-card border border-border text-foreground mono break-all" style={{ fontSize: '0.78rem' }}>
                      {payment.boletoLine}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(payment.boletoLine, 'Código de barras')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      style={{ fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar código de barras
                    </button>
                    <button
                      onClick={() => toast.success('Fatura baixada')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                      style={{ fontSize: '0.78rem', fontWeight: 500 }}
                    >
                      <Download className="w-3.5 h-3.5" /> Baixar fatura
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground mb-1" style={{ fontSize: '0.7rem' }}>Pix Copia e Cola</p>
                    <code className="block px-3 py-2 rounded-lg bg-card border border-border text-foreground mono break-all" style={{ fontSize: '0.72rem' }}>
                      {payment.pixCode}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(payment.pixCode, 'Código Pix')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      style={{ fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar código Pix
                    </button>
                    <button
                      onClick={() => setShowQr(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                      style={{ fontSize: '0.78rem', fontWeight: 500 }}
                    >
                      <QrCode className="w-3.5 h-3.5" /> {showQr ? 'Ocultar QR Code' : 'Ver QR Code Pix'}
                    </button>
                  </div>

                  {showQr && (
                    <div className="flex items-start gap-4 flex-wrap pt-1">
                      <div className="inline-block bg-white p-3 rounded-lg border border-border flex-shrink-0">
                        <PixQrCode data={payment.pixCode} />
                      </div>
                      <div className="flex-1 min-w-[220px]">
                        <p className="text-foreground mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Como pagar</p>
                        <ol className="text-muted-foreground space-y-1 list-decimal list-inside" style={{ fontSize: '0.75rem' }}>
                          <li>Abra o app do seu banco</li>
                          <li>Escolha pagar via Pix com QR Code ou Copia e Cola</li>
                          <li>Escaneie o código ao lado ou cole o código copiado</li>
                          <li>Confirme o valor de {formatCurrency(payment.amount)} e finalize o pagamento</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function BoletosPage({ profile }: BoletosPageProps) {
  const [search, setSearch] = useState('');
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
    { label: isLojista ? 'Em aberto (a pagar)' : 'Em aberto (a receber)', value: formatCurrency(totalOpen), count: `${openList.length} em aberto`, tone: 'default' as const },
    { label: 'Vence em 30 dias', value: formatCurrency(totalDueSoon), count: `${dueSoonList.length} a vencer`, tone: 'default' as const },
    { label: 'Total em atraso', value: formatCurrency(totalOverdue), count: `${overdueList.length} atrasado(s)`, tone: 'danger' as const },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className={`bg-card border rounded-xl p-4 ${stat.tone === 'danger' ? 'border-red-500/30' : 'border-border'}`}>
            <p className="text-muted-foreground mb-1.5" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{stat.label} · {stat.count}</p>
            <p className={`mono ${stat.tone === 'danger' ? 'text-red-400' : 'text-foreground'}`} style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={isLojista ? 'Buscar boleto, pedido...' : 'Buscar boleto, pedido, cliente...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            style={{ fontSize: '0.82rem' }}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full transition-colors capitalize ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
              style={{ fontSize: '0.75rem', fontWeight: 500 }}
            >
              {s === 'todos' ? 'Todos' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Payment cards */}
      <div className="space-y-3">
        {filtered.map(payment => (
          <PaymentCard key={payment.id} payment={payment} profile={profile} />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
            <Receipt className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhum boleto encontrado</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
