import { useState } from "react";
import { Search, Download, Eye, CheckCircle2, Clock, AlertTriangle, Receipt, Copy } from "lucide-react";
import { formatCurrency, formatDate } from "../data/mockData";

type Profile = 'admin' | 'rep' | 'lojista';

interface BoletosPageProps {
  profile: Profile;
}

type BoletoStatus = 'pago' | 'pendente' | 'atrasado';

interface Boleto {
  id: string;
  orderId: string;
  client: string;
  rep: string;
  dueDate: string;
  value: number;
  status: BoletoStatus;
  installment: string;
}

const boletosCarteira: Boleto[] = [
  { id: 'BOL-2026-8121', orderId: 'PED-2026-0412', client: 'Calçadão Paulista LTDA', rep: 'Marcos Andrade', dueDate: '2026-07-09', value: 3513.33, status: 'pago', installment: '1/3' },
  { id: 'BOL-2026-8122', orderId: 'PED-2026-0412', client: 'Calçadão Paulista LTDA', rep: 'Marcos Andrade', dueDate: '2026-08-09', value: 3513.33, status: 'atrasado', installment: '2/3' },
  { id: 'BOL-2026-8123', orderId: 'PED-2026-0412', client: 'Calçadão Paulista LTDA', rep: 'Marcos Andrade', dueDate: '2026-09-09', value: 3513.34, status: 'pendente', installment: '3/3' },
  { id: 'BOL-2026-8231', orderId: 'PED-2026-0411', client: 'Sapataria Mineira', rep: 'Fernanda Lima', dueDate: '2026-07-08', value: 2436.67, status: 'pago', installment: '1/3' },
  { id: 'BOL-2026-8232', orderId: 'PED-2026-0411', client: 'Sapataria Mineira', rep: 'Fernanda Lima', dueDate: '2026-08-08', value: 2436.67, status: 'pago', installment: '2/3' },
  { id: 'BOL-2026-8233', orderId: 'PED-2026-0411', client: 'Sapataria Mineira', rep: 'Fernanda Lima', dueDate: '2026-09-08', value: 2436.66, status: 'pendente', installment: '3/3' },
  { id: 'BOL-2026-8201', orderId: 'PED-2026-0406', client: 'Step Up Calçados', rep: 'Carlos Mendes', dueDate: '2026-07-03', value: 3060.00, status: 'pago', installment: '1/3' },
  { id: 'BOL-2026-8202', orderId: 'PED-2026-0406', client: 'Step Up Calçados', rep: 'Carlos Mendes', dueDate: '2026-08-03', value: 3060.00, status: 'atrasado', installment: '2/3' },
  { id: 'BOL-2026-8203', orderId: 'PED-2026-0406', client: 'Step Up Calçados', rep: 'Carlos Mendes', dueDate: '2026-09-03', value: 3060.00, status: 'pendente', installment: '3/3' },
  { id: 'BOL-2026-8171', orderId: 'PED-2026-0407', client: 'Fashion Feet SP', rep: 'Fernanda Lima', dueDate: '2026-07-04', value: 6160.00, status: 'pago', installment: '1/3' },
  { id: 'BOL-2026-8172', orderId: 'PED-2026-0407', client: 'Fashion Feet SP', rep: 'Fernanda Lima', dueDate: '2026-08-04', value: 6160.00, status: 'atrasado', installment: '2/3' },
  { id: 'BOL-2026-8173', orderId: 'PED-2026-0407', client: 'Fashion Feet SP', rep: 'Fernanda Lima', dueDate: '2026-09-04', value: 6160.00, status: 'pendente', installment: '3/3' },
  { id: 'BOL-2026-8091', orderId: 'PED-2026-0409', client: 'Pé de Pato Bahia', rep: 'Ana Santos', dueDate: '2026-08-06', value: 2880.00, status: 'pendente', installment: '1/2' },
  { id: 'BOL-2026-8092', orderId: 'PED-2026-0409', client: 'Pé de Pato Bahia', rep: 'Ana Santos', dueDate: '2026-09-06', value: 2880.00, status: 'pendente', installment: '2/2' },
];

const boletosLojista: Boleto[] = [
  { id: 'BOL-2026-9001', orderId: 'PED-2026-0388', client: 'Bella Moda', rep: 'Marina Costa', dueDate: '2026-06-20', value: 2807.00, status: 'pago', installment: '1/3' },
  { id: 'BOL-2026-9002', orderId: 'PED-2026-0388', client: 'Bella Moda', rep: 'Marina Costa', dueDate: '2026-07-20', value: 2807.00, status: 'pago', installment: '2/3' },
  { id: 'BOL-2026-9003', orderId: 'PED-2026-0388', client: 'Bella Moda', rep: 'Marina Costa', dueDate: '2026-08-20', value: 2806.00, status: 'atrasado', installment: '3/3' },
  { id: 'BOL-2026-9101', orderId: 'PED-2026-0405', client: 'Bella Moda', rep: 'Marina Costa', dueDate: '2026-08-25', value: 1706.67, status: 'pendente', installment: '1/3' },
  { id: 'BOL-2026-9102', orderId: 'PED-2026-0405', client: 'Bella Moda', rep: 'Marina Costa', dueDate: '2026-09-25', value: 1706.67, status: 'pendente', installment: '2/3' },
  { id: 'BOL-2026-9103', orderId: 'PED-2026-0405', client: 'Bella Moda', rep: 'Marina Costa', dueDate: '2026-10-25', value: 1706.66, status: 'pendente', installment: '3/3' },
];

const statusColors: Record<BoletoStatus, string> = {
  pago: 'text-emerald-400 bg-emerald-400/10',
  pendente: 'text-amber-400 bg-amber-400/10',
  atrasado: 'text-red-400 bg-red-400/10',
};

const statusIcon: Record<BoletoStatus, React.ComponentType<{ className?: string }>> = {
  pago: CheckCircle2,
  pendente: Clock,
  atrasado: AlertTriangle,
};

const statusLabel: Record<BoletoStatus, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
};

export function BoletosPage({ profile }: BoletosPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | BoletoStatus>('todos');

  const isLojista = profile === 'lojista';
  const isRep = profile === 'rep';

  const baseBoletos = isLojista
    ? boletosLojista
    : isRep
    ? boletosCarteira.filter(b => b.rep === 'Marcos Andrade')
    : boletosCarteira;

  const statuses: Array<'todos' | BoletoStatus> = ['todos', 'pendente', 'atrasado', 'pago'];

  const filtered = baseBoletos.filter(b => {
    const matchSearch = b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.orderId.toLowerCase().includes(search.toLowerCase()) ||
      b.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const overdue = baseBoletos.filter(b => b.status === 'atrasado');
  const pending = baseBoletos.filter(b => b.status === 'pendente');
  const paidThisCycle = baseBoletos.filter(b => b.status === 'pago');
  const openValue = [...overdue, ...pending].reduce((acc, b) => acc + b.value, 0);

  const stats = [
    { label: isLojista ? 'A pagar' : 'A receber', value: formatCurrency(openValue), sub: `${overdue.length + pending.length} boleto(s) em aberto`, mono: true },
    { label: 'Em atraso', value: String(overdue.length), sub: formatCurrency(overdue.reduce((acc, b) => acc + b.value, 0)), mono: false },
    { label: 'Pagos', value: String(paidThisCycle.length), sub: formatCurrency(paidThisCycle.reduce((acc, b) => acc + b.value, 0)), mono: false },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{stat.label}</p>
            <p className={`text-foreground ${stat.mono ? 'mono' : ''}`} style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: stat.mono ? '-0.01em' : undefined }}>{stat.value}</p>
            <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar boleto, pedido, cliente..."
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
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Boletos table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left" style={{ fontSize: '0.82rem' }}>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 font-semibold text-muted-foreground" style={{ width: '28%' }}>Boleto</th>
              {!isLojista && <th className="px-4 py-2.5 font-semibold text-muted-foreground">Cliente</th>}
              {profile === 'admin' && <th className="px-4 py-2.5 font-semibold text-muted-foreground">Representante</th>}
              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Parcela</th>
              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Vencimento</th>
              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 font-semibold text-muted-foreground text-right">Valor</th>
              <th className="px-4 py-2.5 font-semibold text-muted-foreground text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(boleto => {
              const StatusIcon = statusIcon[boleto.status];
              return (
                <tr key={boleto.id} className="border-b border-border last:border-0 hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground mono truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{boleto.id}</p>
                        <p className="text-muted-foreground truncate" style={{ fontSize: '0.72rem' }}>Pedido {boleto.orderId}</p>
                      </div>
                    </div>
                  </td>
                  {!isLojista && (
                    <td className="px-4 py-3 text-foreground" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{boleto.client}</td>
                  )}
                  {profile === 'admin' && (
                    <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.8rem' }}>{boleto.rep}</td>
                  )}
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.8rem' }}>{boleto.installment}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.8rem' }}>{formatDate(boleto.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${statusColors[boleto.status]}`} style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                      <StatusIcon className="w-3 h-3" />
                      {statusLabel[boleto.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-foreground mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(boleto.value)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isLojista && boleto.status !== 'pago' ? (
                        <button
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          title="Copiar código de barras"
                        >
                          <Copy className="w-3.5 h-3.5" /> Código
                        </button>
                      ) : (
                        <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors" title="Ver detalhes">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors" title="Baixar PDF">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhum boleto encontrado</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
