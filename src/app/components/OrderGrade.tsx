import { useState, useCallback } from "react";
import {
  CaretLeftIcon,
  CaretRightIcon,
  PlusIcon,
  MinusIcon,
  LightningIcon,
  CheckIcon,
  WarningCircleIcon,
  ShoppingCartIcon,
  TagIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";
import { products, clients, commercialPolicies, Product, Client, formatCurrency } from "../data/mockData";

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
      <input
        type="text"
        placeholder="Buscar produto ou referência..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-primary text-sm mb-2"
      />
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${selected?.id === p.id ? 'bg-primary/15 border border-primary/30' : 'hover:bg-secondary/60 border border-transparent'}`}
          >
            <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover bg-secondary flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="flex-1 min-w-0">
              <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{p.name}</p>
              <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{p.reference} · {formatCurrency(p.price)}</p>
            </div>
            {selected?.id === p.id && <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />}
          </button>
        ))}
      </div>
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
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-400/20 flex items-center justify-center mx-auto mb-5">
            <CheckIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1.3rem' }}>Pedido enviado!</h2>
          <p className="text-muted-foreground mt-2 mb-1" style={{ fontSize: '0.85rem' }}>
            Pedido <span className="text-foreground font-semibold mono">PED-2026-0413</span> criado com sucesso.
          </p>
          <p className="text-muted-foreground" style={{ fontSize: '0.82rem' }}>
            {grandPairs} pares · {formatCurrency(finalTotal)}
          </p>
          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={() => { setCompleted(false); setStep(1); setGrades({}); }}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
              style={{ fontSize: '0.85rem', fontWeight: 500 }}
            >
              Novo pedido
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ fontSize: '0.85rem', fontWeight: 600 }}
            >
              Ver histórico
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      {/* Client chip — shown when client was pre-selected */}
      {selectedClient && (
        <div className="bg-card border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <StorefrontIcon className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-muted-foreground" style={{ fontSize: '0.82rem' }}>Pedindo para</p>
          <p className="text-primary" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedClient.name}</p>
        </div>
      )}

      {/* Stepper */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                  style={{ fontSize: '0.75rem', fontWeight: 700 }}
                >
                  {step > s.n ? <CheckIcon className="w-3.5 h-3.5" /> : s.n}
                </div>
                <span
                  className={`hidden sm:block ${step >= s.n ? 'text-foreground' : 'text-muted-foreground'}`}
                  style={{ fontSize: '0.8rem', fontWeight: step === s.n ? 600 : 400 }}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${step > s.n ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border rounded-xl p-5">
        {/* Step 1: Cliente */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-foreground" style={{ fontWeight: 600 }}>Selecionar cliente</h3>
            <div>
              <label className="block text-muted-foreground mb-1.5" style={{ fontSize: '0.78rem' }}>Cliente</label>
              <select
                value={selectedClientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-foreground outline-none focus:border-primary"
                style={{ fontSize: '0.85rem' }}
              >
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-muted-foreground mb-1.5" style={{ fontSize: '0.78rem' }}>Condição de pagamento</label>
              <select
                value={paymentCond}
                onChange={e => setPaymentCond(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-foreground outline-none focus:border-primary"
                style={{ fontSize: '0.85rem' }}
              >
                {['3x sem juros', '5x sem juros', '7x sem juros', 'À Vista', '30 DDL', '30/60 DDL', '30/60/90 DDL'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Política comercial dinâmica */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5 text-primary" />
                  <p className="text-muted-foreground" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Política comercial aplicada</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  {clientPolicy.name}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>Desconto</p>
                  <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {clientPolicy.discount > 0 ? (
                      <span className="text-emerald-400">{clientPolicy.discount}%</span>
                    ) : (
                      <span>sem desconto</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>Pagamento padrão</p>
                  <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{clientPolicy.paymentCondition}</p>
                </div>
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>Pedido mínimo</p>
                  <p className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatCurrency(clientPolicy.minOrderValue)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Produtos */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-foreground" style={{ fontWeight: 600 }}>Selecionar produto</h3>
            <ProductSelector selected={selectedProduct} onSelect={setSelectedProduct} />
          </div>
        )}

        {/* Step 3: Grade */}
        {step === 3 && selectedProduct && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-foreground" style={{ fontWeight: 600 }}>{selectedProduct.name}</h3>
                <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>{selectedProduct.reference} · {formatCurrency(selectedProduct.price)}/par</p>
              </div>
              <button
                onClick={handleAutoFill}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors flex-shrink-0"
                style={{ fontSize: '0.78rem', fontWeight: 600 }}
              >
                <LightningIcon className="w-3.5 h-3.5" /> Sugestão IA
              </button>
            </div>

            {autoFill && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-400/5 border border-amber-400/20 px-3 py-2">
                <LightningIcon className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-amber-400" style={{ fontSize: '0.78rem' }}>Quantidades sugeridas com base no histórico de giro desta loja.</p>
              </div>
            )}

            {/* Grade Table */}
            <div className="overflow-x-auto -mx-1">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-muted-foreground pb-3" style={{ fontSize: '0.72rem', fontWeight: 500 }}>Numeração</th>
                    {SIZES.map(s => (
                      <th key={s} className="text-center text-muted-foreground pb-3" style={{ fontSize: '0.72rem', fontWeight: 500 }}>Nº {s}</th>
                    ))}
                    <th className="text-right text-muted-foreground pb-3" style={{ fontSize: '0.72rem', fontWeight: 500 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="py-2 text-muted-foreground" style={{ fontSize: '0.78rem' }}>Estoque</td>
                    {SIZES.map(s => (
                      <td key={s} className="py-2 text-center">
                        <span className={`mono ${(selectedProduct.grades[s] || 0) === 0 ? 'text-red-400' : (selectedProduct.grades[s] || 0) < 5 ? 'text-amber-400' : 'text-emerald-400'}`} style={{ fontSize: '0.78rem' }}>
                          {selectedProduct.grades[s] || 0}
                        </span>
                      </td>
                    ))}
                    <td />
                  </tr>
                  <tr className="border-t border-border">
                    <td className="py-3 text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>Quantidade</td>
                    {SIZES.map(s => {
                      const qty = currentGrades[s] || 0;
                      const stock = selectedProduct.grades[s] || 0;
                      return (
                        <td key={s} className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setQty(s, qty - 1)}
                              className="w-6 h-6 rounded flex items-center justify-center bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                              disabled={qty === 0}
                            >
                              <MinusIcon className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={stock}
                              value={qty}
                              onChange={e => setQty(s, parseInt(e.target.value) || 0)}
                              className={`w-10 text-center rounded border text-foreground outline-none py-1 bg-surface transition-colors ${qty > stock ? 'border-red-400/60' : qty > 0 ? 'border-primary/50' : 'border-border'}`}
                              style={{ fontSize: '0.82rem', fontWeight: 600 }}
                            />
                            <button
                              onClick={() => setQty(s, qty + 1)}
                              className="w-6 h-6 rounded flex items-center justify-center bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                              disabled={qty >= stock}
                            >
                              <PlusIcon className="w-3 h-3" />
                            </button>
                          </div>
                          {qty > stock && (
                            <p className="text-red-400 mt-0.5" style={{ fontSize: '0.6rem' }}>Sem estoque</p>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 text-right">
                      <span className="text-foreground mono" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{totalPairs}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>Subtotal deste produto</p>
                <p className="text-foreground" style={{ fontSize: '0.82rem' }}>{totalPairs} pares × {formatCurrency(selectedProduct.price)}</p>
              </div>
              <p className="text-primary mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(totalValue)}</p>
            </div>

            <button
              onClick={() => {
                setAutoFill(false);
                setSelectedProduct(null);
                setStep(2);
              }}
              className="text-primary hover:text-primary/80 transition-colors"
              style={{ fontSize: '0.8rem' }}
            >
              + Adicionar outro produto
            </button>
          </div>
        )}

        {/* Step 4: Revisão */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-foreground" style={{ fontWeight: 600 }}>Revisão do pedido</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Cliente</p>
                <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedClientObj.name}</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>Pagamento</p>
                <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{paymentCond}</p>
              </div>
            </div>

            {allGrades.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-400/5 border border-amber-400/20 px-3 py-3">
                <WarningCircleIcon className="w-4 h-4 text-amber-400" />
                <p className="text-amber-400" style={{ fontSize: '0.8rem' }}>Nenhum produto com quantidade adicionado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allGrades.map(({ product, sizes, pairs, value }) => (
                  <div key={product.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{product.name}</p>
                        <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{product.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground mono" style={{ fontWeight: 700 }}>{formatCurrency(value)}</p>
                        <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{pairs} pares</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {SIZES.map(s => sizes[s] > 0 && (
                        <span key={s} className="px-2 py-0.5 rounded bg-primary/10 text-primary mono" style={{ fontSize: '0.72rem', fontWeight: 600 }}>
                          {s}: {sizes[s]}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-muted-foreground mb-1.5" style={{ fontSize: '0.78rem' }}>Observações</label>
              <textarea
                value={obs}
                onChange={e => setObs(e.target.value)}
                rows={3}
                placeholder="Informações adicionais para o pedido..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none"
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            {/* Aviso pedido mínimo */}
            {allGrades.length > 0 && finalTotal < clientPolicy.minOrderValue && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-400/5 border border-amber-400/20 px-3 py-2">
                <WarningCircleIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-amber-400" style={{ fontSize: '0.78rem' }}>
                  Pedido abaixo do mínimo de {formatCurrency(clientPolicy.minOrderValue)} para {clientPolicy.name}.
                </p>
              </div>
            )}

            {/* Breakdown de valor */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>Subtotal</p>
                <p className="text-foreground mono" style={{ fontSize: '0.9rem' }}>{formatCurrency(grandTotal)}</p>
              </div>
              {discountPct > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-emerald-400" style={{ fontSize: '0.78rem' }}>
                    Desconto {clientPolicy.name} ({discountPct}%)
                  </p>
                  <p className="text-emerald-400 mono" style={{ fontSize: '0.9rem' }}>-{formatCurrency(discountAmount)}</p>
                </div>
              )}
              <div className="border-t border-border/60 pt-2 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>Total do pedido</p>
                  <p className="text-foreground" style={{ fontSize: '0.82rem' }}>{grandPairs} pares · {allGrades.length} produto(s)</p>
                </div>
                <p className="text-primary mono" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(finalTotal)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(selectedClient ? 2 : 1, s - 1))}
          disabled={step === (selectedClient ? 2 : 1)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-40"
          style={{ fontSize: '0.85rem', fontWeight: 500 }}
        >
          <CaretLeftIcon className="w-4 h-4" /> Voltar
        </button>

        <div className="flex items-center gap-3">
          {allGrades.length > 0 && step < 4 && (
            <span className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>
              <span className="text-foreground font-semibold">{grandPairs}</span> pares · {formatCurrency(grandTotal)}
            </span>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(s => Math.min(4, s + 1))}
              disabled={step === 3 && totalPairs === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              style={{ fontSize: '0.85rem', fontWeight: 600 }}
            >
              {step === 3 ? 'Revisar pedido' : 'Continuar'} <CaretRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setCompleted(true)}
              disabled={allGrades.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
              style={{ fontSize: '0.85rem', fontWeight: 600 }}
            >
              <ShoppingCartIcon className="w-4 h-4" /> Confirmar pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
