import { useState, useMemo, useEffect } from "react";
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
} from "@phosphor-icons/react";
import { products, formatCurrency } from "../data/mockData";
import { priceTables } from "./LojistaFiltersSidebar";
import type { CartContext, CartCreator } from "./CartsListPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";


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
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-400/20 flex items-center justify-center mx-auto mb-5">
            <CheckIcon className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1.3rem' }}>Pedido enviado para aprovação!</h2>
          <p className="text-muted-foreground mt-2" style={{ fontSize: '0.85rem' }}>
            Pedido <span className="text-foreground font-semibold mono">PED-2026-0413</span>
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>
            {grandPairs} pares · {formatCurrency(finalTotal)}
          </p>
          <p className="text-muted-foreground mt-3 text-sm">Você receberá uma confirmação por e-mail assim que aprovado.</p>
          <div className="flex gap-3 mt-6 justify-center">
            <button onClick={() => onNavigate('history')} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Ver histórico
            </button>
            <button onClick={() => onNavigate('catalog')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Continuar comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full">
      {cartContext && (
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onNavigate('carts')}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontSize: '0.78rem' }}
            >
              <CaretLeftIcon className="w-3.5 h-3.5" /> Carrinhos
            </button>
            <div className="w-px h-5 bg-border" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-foreground truncate" style={{ fontSize: '1rem', fontWeight: 700 }}>{cartContext.cartName}</p>
                {cartContext.createdBy && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${cartContext.createdBy === 'lojista' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}
                    style={{ fontSize: '0.65rem', fontWeight: 600 }}
                    title={cartContext.createdBy === 'lojista' ? 'Carrinho criado pelo lojista' : 'Carrinho criado pelo representante'}
                  >
                    {cartContext.createdBy === 'lojista' ? <StorefrontIcon className="w-2.5 h-2.5" /> : <UserCheckIcon className="w-2.5 h-2.5" />}
                    {cartContext.createdBy === viewerRole ? 'Você' : cartContext.createdBy === 'lojista' ? 'Lojista' : 'Representante'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <StorefrontIcon className="w-3 h-3" />
                <span className="truncate" style={{ fontSize: '0.75rem' }}>Cliente: <span className="text-foreground" style={{ fontWeight: 600 }}>{cartContext.clientName}</span></span>
              </div>
            </div>
          </div>
          {multiCart && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('carts')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                style={{ fontSize: '0.75rem', fontWeight: 500 }}
                title="Selecionar outro carrinho"
              >
                <ListBulletsIcon className="w-3.5 h-3.5" /> Outros carrinhos
              </button>
              <button
                onClick={() => {
                  setNewCartName('');
                  setShowNewCartDialog(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
                title="Criar outro carrinho para este cliente"
              >
                <FolderPlusIcon className="w-3.5 h-3.5" /> Novo carrinho
              </button>
            </div>
          )}
        </div>
      )}
      {/* New cart dialog */}
      <Dialog open={showNewCartDialog} onOpenChange={setShowNewCartDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '0.95rem' }}>Novo carrinho</DialogTitle>
            <DialogDescription style={{ fontSize: '0.78rem' }}>
              Criar carrinho para {cartContext?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block text-muted-foreground" style={{ fontSize: '0.72rem' }}>Nome do carrinho</label>
            <input
              autoFocus
              value={newCartName}
              onChange={e => setNewCartName(e.target.value)}
              placeholder="Ex.: Reposição Inverno 26"
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-primary"
              style={{ fontSize: '0.82rem' }}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowNewCartDialog(false)}
              className="px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              style={{ fontSize: '0.82rem', fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onCreateNewCart?.(newCartName.trim() || 'Novo carrinho');
                setShowNewCartDialog(false);
                setNewCartName('');
              }}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ fontSize: '0.82rem', fontWeight: 600 }}
            >
              Criar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setStep('cart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${step === 'cart' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          style={{ fontSize: '0.82rem', fontWeight: 600 }}
        >
          <ShoppingCartIcon className="w-3.5 h-3.5" /> Carrinho ({cart.length})
        </button>
        <CaretRightIcon className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => cart.length > 0 && setStep('checkout')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${step === 'checkout' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          style={{ fontSize: '0.82rem', fontWeight: 600 }}
        >
          <CreditCardIcon className="w-3.5 h-3.5" /> Checkout
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCartIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-foreground" style={{ fontWeight: 600 }}>Carrinho vazio</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Adicione produtos do catálogo para criar um pedido.</p>
          <button
            onClick={() => onNavigate('catalog')}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            Ir ao catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {step === 'cart' ? (
              cart.map(item => {
                const { pairs, value } = getItemTotal(item);
                return (
                  <div key={item.product.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.product.name}</p>
                        <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{item.product.reference} · {formatCurrency(item.product.price)}/par</p>
                        <p className="text-foreground mono mt-0.5" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(value)}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(item.sizes).map(([size, qty]) => (
                        <div key={size} className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 bg-secondary/40">
                          <span className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>Nº {size}</span>
                          <button onClick={() => updateQty(item.product.id, size, -1)} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                            <MinusIcon className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-foreground mono" style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => updateQty(item.product.id, size, 1)} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                            <PlusIcon className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-muted-foreground mt-2" style={{ fontSize: '0.72rem' }}>{pairs} pares neste item</p>
                  </div>
                );
              })
            ) : (
              /* Checkout — Tabela, Condição, Campanhas */
              <div className="space-y-4">
                {/* Tabela de preço aplicada */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-foreground flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <TagIcon className="w-4 h-4 text-primary" /> Política comercial aplicada
                    </h3>
                    <select
                      value={tableId}
                      onChange={e => { setTableId(e.target.value); setPaymentId((paymentOptionsByTable[e.target.value] ?? [])[0]?.id ?? ''); setCampaignIds([]); }}
                      className="px-2.5 py-1.5 rounded-md border border-border bg-surface text-foreground outline-none focus:border-primary"
                      style={{ fontSize: '0.78rem' }}
                    >
                      {priceTables.map(p => <option key={p.id} value={p.id}>{p.label} — {p.desc}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>Desconto da tabela</p>
                      <p className="text-foreground mono mt-0.5" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{policyDetails.discount === 0 ? 'sem desconto' : `${policyDetails.discount}%`}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>Pagamento padrão</p>
                      <p className="text-foreground mt-0.5" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{policyDetails.paymentCondition}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>Pedido mínimo</p>
                      <p className="text-foreground mono mt-0.5" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatCurrency(policyDetails.minOrderValue)}</p>
                    </div>
                  </div>
                </div>

                {/* Condições de pagamento disponíveis */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-foreground flex items-center gap-2 mb-3" style={{ fontWeight: 600 }}>
                    <CreditCardIcon className="w-4 h-4 text-primary" /> Condições de pagamento disponíveis
                  </h3>
                  <p className="text-muted-foreground mb-3" style={{ fontSize: '0.75rem' }}>
                    Opções habilitadas para a <span className="text-foreground" style={{ fontWeight: 600 }}>{policy.label}</span>.
                  </p>
                  <div className="space-y-2">
                    {paymentOptions.map(opt => {
                      const active = paymentId === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${active ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40'}`}
                        >
                          <input type="radio" name="payment" checked={active} onChange={() => setPaymentId(opt.id)} className="mt-1 accent-primary" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{opt.label}</p>
                              {opt.surcharge !== 0 && (
                                <span className={`mono ${opt.surcharge < 0 ? 'text-emerald-400' : 'text-amber-400'}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                  {opt.surcharge < 0 ? `${opt.surcharge}%` : `+${opt.surcharge}%`}
                                </span>
                              )}
                            </div>
                            {opt.description && <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.72rem' }}>{opt.description}</p>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Campanhas disponíveis */}
                {campaigns.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h3 className="text-foreground flex items-center gap-2 mb-3" style={{ fontWeight: 600 }}>
                      <SparkleIcon className="w-4 h-4 text-primary" /> Campanhas disponíveis
                    </h3>
                    <div className="space-y-2">
                      {campaigns.map(c => {
                        const active = campaignIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${active ? 'border-emerald-400/60 bg-emerald-400/5' : 'border-border hover:bg-secondary/40'}`}
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => setCampaignIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                              className="mt-1 accent-emerald-400"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-foreground flex items-center gap-1.5" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                  <PercentIcon className="w-3 h-3 text-emerald-400" /> {c.name}
                                </p>
                                <span className="text-emerald-400 mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>-{c.discount}%</span>
                              </div>
                              <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.72rem' }}>{c.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Observações */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <label className="block text-muted-foreground mb-1.5" style={{ fontSize: '0.78rem' }}>Observações</label>
                  <textarea
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    rows={3}
                    placeholder="Informações adicionais..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                {approvalRequired && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-400/5 border border-amber-400/20 p-3">
                    <FileTextIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Aprovação necessária</p>
                      <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>Este pedido passará pela aprovação do representante antes de ser faturado.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-foreground mb-4" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Resumo do pedido</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor bruto · {grandPairs} pares</span>
                  <span className="text-foreground mono" style={{ fontSize: '0.82rem' }}>{formatCurrency(grandTotal)}</span>
                </div>
                {tableDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-400" style={{ fontSize: '0.82rem' }}>Desconto {policy.label} ({policyDetails.discount}%)</span>
                    <span className="text-emerald-400 mono" style={{ fontSize: '0.82rem' }}>-{formatCurrency(tableDiscount)}</span>
                  </div>
                )}
                {campaignDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-400" style={{ fontSize: '0.82rem' }}>Campanhas</span>
                    <span className="text-emerald-400 mono" style={{ fontSize: '0.82rem' }}>-{formatCurrency(campaignDiscount)}</span>
                  </div>
                )}
                {paymentAdj !== 0 && (
                  <div className="flex justify-between">
                    <span className={paymentAdj < 0 ? 'text-emerald-400' : 'text-amber-400'} style={{ fontSize: '0.82rem' }}>
                      Ajuste pagamento
                    </span>
                    <span className={`mono ${paymentAdj < 0 ? 'text-emerald-400' : 'text-amber-400'}`} style={{ fontSize: '0.82rem' }}>
                      {paymentAdj < 0 ? '-' : '+'}{formatCurrency(Math.abs(paymentAdj))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-primary" style={{ fontSize: '0.82rem', fontWeight: 500 }}>IVA ({(IVA_RATE * 100).toFixed(0)}%)</span>
                  <span className="text-primary mono" style={{ fontSize: '0.82rem', fontWeight: 500 }}>+{formatCurrency(finalTotal * IVA_RATE)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between">
                  <span className="text-foreground" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Total c/ IVA</span>
                  <span className="text-foreground mono" style={{ fontSize: '1rem', fontWeight: 700 }}>{formatCurrency(finalTotal * (1 + IVA_RATE))}</span>
                </div>
                {step === 'checkout' && selectedPayment && (
                  <div className="text-muted-foreground text-center pt-1" style={{ fontSize: '0.72rem' }}>
                    Condição: {selectedPayment.label}
                  </div>
                )}
                {belowMin && step === 'checkout' && (
                  <div className="mt-2 rounded-md bg-amber-400/10 border border-amber-400/30 px-2.5 py-2 text-amber-400" style={{ fontSize: '0.72rem' }}>
                    Pedido mínimo da {policy.label}: {formatCurrency(policyDetails.minOrderValue)}
                  </div>
                )}
              </div>
            </div>


            {step === 'cart' ? (
              <button
                onClick={() => setStep('checkout')}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                style={{ fontWeight: 600, fontSize: '0.9rem' }}
              >
                Ir para checkout <CaretRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setStep('done')}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                style={{ fontWeight: 600, fontSize: '0.9rem' }}
              >
                <CheckIcon className="w-4 h-4" /> Confirmar pedido
              </button>
            )}

            <button
              onClick={() => onNavigate('catalog')}
              className="w-full py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              style={{ fontSize: '0.85rem' }}
            >
              Continuar comprando
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
