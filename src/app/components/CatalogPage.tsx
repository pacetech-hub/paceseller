import { useState } from "react";
import { notify } from "../../mantine/notify";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  GridNineIcon,
  ListBulletsIcon,
  HeartIcon,
  StarIcon,
  ShoppingCartIcon,
  XIcon,
  PackageIcon,
  EyeIcon,
  LightningIcon,
  CheckIcon,
  PlusIcon,
  StorefrontIcon,
  UserCheckIcon,
} from "@phosphor-icons/react";
import { products, Product, formatCurrency, Client } from "../data/mockData";
import bannerLimitedAsset from "../../assets/banner-edicao-limitada.webp";

import type { CartContext, CartCreator } from "./CartsListPage";

function CartCreatorTag({ createdBy }: { createdBy?: CartCreator }) {
  if (!createdBy) return null;
  const isLojista = createdBy === 'lojista';
  return (
    <span
      className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded ${isLojista ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}
      style={{ fontSize: '0.62rem', fontWeight: 600 }}
    >
      {isLojista ? <StorefrontIcon className="w-2.5 h-2.5" /> : <UserCheckIcon className="w-2.5 h-2.5" />}
      {isLojista ? 'Lojista' : 'Representante'}
    </span>
  );
}

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

interface CatalogFiltersShape {
  search: string;
  line: string;
  category: string;
  colors: string[];
  priceRange: [number, number];
  priceTable: string;
}


interface CatalogPageProps {
  onNavigate: (view: View) => void;
  onSelectProduct?: (product: Product) => void;
  selectedClient?: Client | null;
  externalFilters?: CatalogFiltersShape;
  onExternalFiltersChange?: (f: CatalogFiltersShape) => void;
  clientCarts?: CartContext[];
  activeCartId?: string | null;
  onPickCart?: (ctx: CartContext) => void;
  onCreateCart?: (name: string) => CartContext | null;
}

const lines = ['Todos', 'Premium', 'Urban', 'Sport'];
const categories = ['Todos', 'Social', 'Casual', 'Esportivo', 'Sandália', 'Bota'];
const collections = ['Todas', 'Inverno 2026', 'Primavera/Verão 2026'];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <StarIcon
          key={s}
          weight={s <= Math.round(rating) ? 'fill' : 'regular'}
          className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="text-muted-foreground ml-1" style={{ fontSize: '0.68rem' }}>{rating}</span>
    </div>
  );
}

function GradeCompact({ product, onAdd, onClose }: {
  product: Product; onAdd: (qtys: Record<string, number>) => void; onClose?: () => void;
}) {
  const sizes = Object.keys(product.grades);
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(sizes.map(s => [s, 0]))
  );
  const total = Object.values(qtys).reduce((a, b) => a + b, 0);
  const subtotal = total * product.price;
  const set = (s: string, v: number) => setQtys(q => ({ ...q, [s]: Math.max(0, v) }));

  return (
    <div className="px-3 pb-3 pt-2 border-t border-border bg-secondary/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-foreground" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Compra rápida — Grade
        </p>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-0.5">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-1">
        {sizes.map(s => (
          <div key={s} className="flex items-center justify-between bg-white/50 rounded-md px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="text-foreground" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Nº {s}</span>
              <span className="text-emerald-600" style={{ fontSize: '0.65rem' }}>{product.grades[s]} disp.</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => set(s, qtys[s] - 1)} className="w-5 h-5 rounded bg-secondary text-foreground hover:bg-secondary/70 flex items-center justify-center" style={{ fontSize: '0.7rem', lineHeight: 1 }}>−</button>
              <input
                type="number"
                value={qtys[s]}
                onChange={e => set(s, Number(e.target.value) || 0)}
                className="w-8 text-center bg-transparent text-foreground outline-none"
                style={{ fontSize: '0.72rem', fontWeight: 600 }}
              />
              <button onClick={() => set(s, qtys[s] + 1)} className="w-5 h-5 rounded bg-secondary text-foreground hover:bg-secondary/70 flex items-center justify-center" style={{ fontSize: '0.7rem', lineHeight: 1 }}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 mb-2">
        <span className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>
          {total} {total === 1 ? 'par' : 'pares'}
        </span>
        <span className="text-foreground mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(subtotal)}</span>
      </div>
      <button
        onClick={() => onAdd(qtys)}
        disabled={total === 0}
        className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
        style={{ fontSize: '0.78rem', fontWeight: 600 }}
      >
        <ShoppingCartIcon className="w-3.5 h-3.5" /> Adicionar
      </button>
    </div>
  );
}

function GradeInline({ product, onAdd, onClose }: {
  product: Product; onAdd: (qtys: Record<string, number>) => void; onClose?: () => void;
}) {
  const sizes = Object.keys(product.grades);
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(sizes.map(s => [s, 0]))
  );
  const total = Object.values(qtys).reduce((a, b) => a + b, 0);
  const subtotal = total * product.price;
  const set = (s: string, v: number) => setQtys(q => ({ ...q, [s]: Math.max(0, v) }));

  const colCount = sizes.length;
  const gridTemplate = `90px repeat(${colCount}, minmax(0, 1fr)) 60px`;

  return (
    <div className="px-3 pb-3 pt-2 border-t border-border bg-secondary/30">
      <div className="flex items-center justify-between mb-2">
        <p className="text-foreground" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Compra rápida — Grade
        </p>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-0.5">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="grid items-center bg-secondary/60 border-b border-border" style={{ gridTemplateColumns: gridTemplate }}>
          <div className="px-2 py-1.5 text-muted-foreground" style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Numeração</div>
          {sizes.map(s => (
            <div key={s} className="px-1 py-1.5 text-center text-foreground" style={{ fontSize: '0.72rem', fontWeight: 600 }}>Nº {s}</div>
          ))}
          <div className="px-1 py-1.5 text-center text-muted-foreground" style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total</div>
        </div>

        <div className="grid items-center border-b border-border" style={{ gridTemplateColumns: gridTemplate }}>
          <div className="px-2 py-1.5 text-muted-foreground" style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Estoque</div>
          {sizes.map(s => (
            <div key={s} className="px-1 py-1.5 text-center text-emerald-600" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{product.grades[s]}</div>
          ))}
          <div className="px-1 py-1.5 text-center text-muted-foreground" style={{ fontSize: '0.7rem' }}>
            {Object.values(product.grades).reduce((a, b) => a + b, 0)}
          </div>
        </div>

        <div className="grid items-center" style={{ gridTemplateColumns: gridTemplate }}>
          <div className="px-2 py-1.5 text-muted-foreground" style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Quantidade</div>
          {sizes.map(s => (
            <div key={s} className="px-1 py-1.5 flex items-center justify-center gap-0.5">
              <button onClick={() => set(s, qtys[s] - 1)} className="w-4 h-4 rounded bg-secondary text-foreground hover:bg-secondary/70 flex items-center justify-center" style={{ fontSize: '0.7rem', lineHeight: 1 }}>−</button>
              <input
                type="number"
                value={qtys[s]}
                onChange={e => set(s, Number(e.target.value) || 0)}
                className="w-8 text-center bg-transparent text-foreground outline-none"
                style={{ fontSize: '0.72rem', fontWeight: 600 }}
              />
              <button onClick={() => set(s, qtys[s] + 1)} className="w-4 h-4 rounded bg-secondary text-foreground hover:bg-secondary/70 flex items-center justify-center" style={{ fontSize: '0.7rem', lineHeight: 1 }}>+</button>
            </div>
          ))}
          <div className="px-1 py-1.5 text-center text-foreground mono" style={{ fontSize: '0.78rem', fontWeight: 700 }}>{total}</div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-2 mb-1">
        <span className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>
          {total} {total === 1 ? 'par' : 'pares'} · <span className="text-foreground mono" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{formatCurrency(subtotal)}</span>
        </span>
        <button
          onClick={() => onAdd(qtys)}
          disabled={total === 0}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          style={{ fontSize: '0.78rem', fontWeight: 600 }}
        >
          <ShoppingCartIcon className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product, onOrder, onQuickBuy, onOpenDetail, onToggleFav, viewMode, gradeOpen, onAddGrade, onCloseGrade }: {
  product: Product;
  onOrder: () => void;
  onQuickBuy: () => void;
  onOpenDetail: () => void;
  onToggleFav: () => void;
  viewMode: 'grid' | 'list';
  gradeOpen: boolean;
  onAddGrade: (qtys: Record<string, number>) => void;
  onCloseGrade: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  const availColor = {
    'disponível': 'text-emerald-400 bg-emerald-400/10',
    'baixo estoque': 'text-amber-400 bg-amber-400/10',
    'esgotado': 'text-red-400 bg-red-400/10',
  }[product.availability];

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden hover:border-border/60 transition-colors group">
        <div className="p-4 flex items-center gap-4">
          <button onClick={onOpenDetail} className="w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0">
            {!imgError ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PackageIcon className="w-6 h-6 text-muted-foreground/40" />
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpenDetail}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground" style={{ fontSize: '0.7rem', fontWeight: 500 }}>{product.reference}</p>
                <p className="text-foreground" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{product.name}</p>
                <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{product.line} · {product.category} · {product.collection}</p>
              </div>
              <StarRating rating={product.rating} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-0.5 rounded-full ${availColor}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>{product.availability}</span>
              <span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{product.material}</span>
              <span className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{product.soldUnits.toLocaleString('pt-BR')} vendidos</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 space-y-2">
            <div>
              <p className="text-foreground mono" style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{formatCurrency(product.price)}</p>
              <p className="text-muted-foreground line-through" style={{ fontSize: '0.75rem' }}>{formatCurrency(product.priceRetail)}</p>
              <p className="text-primary" style={{ fontSize: '0.65rem', fontWeight: 600 }}>+ IVA</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onToggleFav} className={`p-2 rounded-lg border border-border transition-colors ${product.isFavorite ? 'text-red-400 border-red-400/30 bg-red-400/10' : 'text-muted-foreground hover:text-red-400'}`}>
                <HeartIcon weight={product.isFavorite ? 'fill' : 'regular'} className={`w-3.5 h-3.5 ${product.isFavorite ? 'text-red-400' : ''}`} />
              </button>
              <button
                onClick={onQuickBuy}
                disabled={product.availability === 'esgotado'}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                style={{ fontSize: '0.78rem', fontWeight: 600 }}
              >
                <LightningIcon className="w-3.5 h-3.5" /> Compra rápida
              </button>
            </div>
          </div>
        </div>
        {gradeOpen && (
          <GradeCompact product={product} onAdd={onAddGrade} onClose={onCloseGrade} />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden hover:border-border/60 transition-all group hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5">
      <button onClick={onOpenDetail} className="relative w-full pt-[80%] bg-white overflow-hidden mb-[-12px] block">
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain object-bottom px-2 pt-2"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PackageIcon className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <span
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          className={`absolute top-3 right-3 p-1.5 rounded-full border transition-colors cursor-pointer ${product.isFavorite ? 'bg-red-50 border-red-200 text-red-400' : 'bg-white/80 border-gray-200 text-gray-400 hover:text-red-400'}`}
        >
          <HeartIcon weight={product.isFavorite ? 'fill' : 'regular'} className={`w-3.5 h-3.5 ${product.isFavorite ? 'text-red-400' : ''}`} />
        </span>
        <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-all flex">
          <span
            onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
            className="flex-1 bg-secondary text-foreground py-2.5 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-secondary/80"
            style={{ fontSize: '0.78rem', fontWeight: 600 }}
          >
            <EyeIcon className="w-3.5 h-3.5" /> Detalhes
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); if (product.availability !== 'esgotado') onQuickBuy(); }}
            className={`flex-1 bg-primary text-primary-foreground py-2.5 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-primary/90 ${product.availability === 'esgotado' ? 'opacity-40 pointer-events-none' : ''}`}
            style={{ fontSize: '0.78rem', fontWeight: 600 }}
          >
            <LightningIcon className="w-3.5 h-3.5" /> Compra rápida
          </span>
        </div>
      </button>

      <div className="p-3 cursor-pointer" onClick={onOpenDetail}>
        <span className={`inline-block px-2 py-0.5 rounded-full mb-2 ${availColor}`} style={{ fontSize: '0.62rem', fontWeight: 600 }}>
          {product.availability}
        </span>
        <p className="text-muted-foreground" style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{product.line} · {product.reference}</p>
        <p className="text-foreground mt-0.5 truncate" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{product.name}</p>
        <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{product.material}</p>

        <div className="flex items-center justify-between mt-2">
          <StarRating rating={product.rating} />
          <span className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>{product.soldUnits.toLocaleString('pt-BR')} un.</span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div>
            <p className="text-foreground mono" style={{ fontSize: '1rem', fontWeight: 700 }}>{formatCurrency(product.price)}</p>
            <p className="text-muted-foreground line-through" style={{ fontSize: '0.72rem' }}>{formatCurrency(product.priceRetail)}</p>
            <p className="text-primary" style={{ fontSize: '0.62rem', fontWeight: 600 }}>+ IVA</p>
          </div>
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 3).map(color => (
              <span key={color} className="text-muted-foreground" style={{ fontSize: '0.62rem' }}>
                {color === product.colors[0] ? color : '·'}
              </span>
            ))}
            {product.colors.length > 1 && (
              <span className="text-muted-foreground" style={{ fontSize: '0.62rem' }}>+{product.colors.length - 1}</span>
            )}
          </div>
        </div>
      </div>

      {gradeOpen && (
        <GradeCompact product={product} onAdd={onAddGrade} onClose={onCloseGrade} />
      )}
    </div>
  );
}


function ProductDetailModal({ product, onClose, onAddGrade, onToggleFav, isFavorite }: {
  product: Product; onClose: () => void; onAddGrade: (qtys: Record<string, number>) => void;
  onToggleFav: () => void; isFavorite: boolean;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const images = [product.image, product.image, product.image];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-muted-foreground" style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{product.line} · {product.reference}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><XIcon className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="bg-gray-50 p-4 flex flex-col gap-3">
            <div className="relative w-full pt-[90%] bg-white rounded-xl overflow-hidden">
              <img src={images[activeImg]} alt={product.name} className="absolute inset-0 w-full h-full object-contain p-4" />
            </div>
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${activeImg === i ? 'border-primary' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover bg-white" />
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-foreground" style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{product.name}</h2>
                <button onClick={onToggleFav} className={`p-2 rounded-lg border border-border transition-colors flex-shrink-0 ${isFavorite ? 'text-red-400 border-red-400/30 bg-red-400/10' : 'text-muted-foreground hover:text-red-400'}`}>
                  <HeartIcon weight={isFavorite ? 'fill' : 'regular'} className={`w-4 h-4 ${isFavorite ? 'text-red-400' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <StarRating rating={product.rating} />
                <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{product.soldUnits.toLocaleString('pt-BR')} vendidos</span>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-foreground mono" style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{formatCurrency(product.price)}</p>
              <p className="text-muted-foreground line-through" style={{ fontSize: '0.9rem' }}>{formatCurrency(product.priceRetail)}</p>
              <p className="text-primary" style={{ fontSize: '0.72rem', fontWeight: 600 }}>+ IVA</p>
            </div>
            <p className="text-foreground" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{product.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Material</p>
                <p className="text-foreground mt-0.5" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{product.material}</p>
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coleção</p>
                <p className="text-foreground mt-0.5" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{product.collection}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1.5" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cores</p>
              <div className="flex flex-wrap gap-1.5">
                {product.colors.map(c => (
                  <span key={c} className="px-2.5 py-1 rounded-full bg-secondary text-foreground" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <GradeInline product={product} onAdd={onAddGrade} />
        </div>
      </div>
    </div>
  );
}

export function CatalogPage({ onNavigate, externalFilters, onExternalFiltersChange, clientCarts, activeCartId, onPickCart, onCreateCart }: CatalogPageProps) {
  const usingExternal = !!externalFilters;
  const [internalSearch, setInternalSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLine, setSelectedLine] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCollection, setSelectedCollection] = useState('Todas');
  const [sortBy, setSortBy] = useState('relevância');
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    new Set(products.filter(p => p.isFavorite).map(p => p.id))
  );
  const [gradeOpenId, setGradeOpenId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  // Multi-cart picker
  const multiCartEnabled = Array.isArray(clientCarts);
  const [pendingAdd, setPendingAdd] = useState<{ product: Product; qtys: Record<string, number> } | null>(null);
  const [confirmAdd, setConfirmAdd] = useState<{ product: Product; qtys: Record<string, number>; selectedCartId: string } | null>(null);
  const [creatingNewName, setCreatingNewName] = useState('');
  const [creatingMode, setCreatingMode] = useState(false);

  const commitAdd = (p: Product, qtys: Record<string, number>, cartName?: string) => {
    const total = Object.values(qtys).reduce((a, b) => a + b, 0);
    setGradeOpenId(null);
    notify.success(`${total} ${total === 1 ? 'par' : 'pares'} de ${p.name} adicionados${cartName ? ` em "${cartName}"` : ''}`);
  };
  const addGrade = (p: Product, qtys: Record<string, number>) => {
    const total = Object.values(qtys).reduce((a, b) => a + b, 0);
    if (total === 0) return;
    if (multiCartEnabled) {
      // Se já tem carrinho ativo, confirma antes de adicionar
      if (activeCartId) {
        setConfirmAdd({ product: p, qtys, selectedCartId: activeCartId });
        setGradeOpenId(null);
        return;
      }
      // Se não tem nenhum carrinho pro cliente, cria um automaticamente
      if (!clientCarts || clientCarts.length === 0) {
        const ctx = onCreateCart?.('Novo carrinho');
        commitAdd(p, qtys, ctx?.cartName);
        return;
      }
      // Se tem carrinhos mas nenhum ativo, mostra o picker
      setPendingAdd({ product: p, qtys });
      setCreatingMode(false);
      setCreatingNewName('');
      return;
    }
    commitAdd(p, qtys);
  };
  const goGrade = () => {
    setGradeOpenId(null);
    setDetailProduct(null);
    onNavigate('order-grade');
  };


  const search = usingExternal ? externalFilters!.search : internalSearch;
  const setSearch = (v: string) => {
    if (usingExternal && onExternalFiltersChange) onExternalFiltersChange({ ...externalFilters!, search: v });
    else setInternalSearch(v);
  };
  const effLine = usingExternal ? externalFilters!.line : selectedLine;
  const effCategory = usingExternal ? externalFilters!.category : selectedCategory;
  const effColors = usingExternal ? externalFilters!.colors : [];
  const effPriceRange = usingExternal ? externalFilters!.priceRange : null;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      p.line.toLowerCase().includes(search.toLowerCase());
    const matchLine = effLine === 'Todos' || p.line === effLine;
    const matchCat = effCategory === 'Todos' || p.category === effCategory;
    const matchCol = usingExternal || selectedCollection === 'Todas' || p.collection === selectedCollection;
    const matchColors = effColors.length === 0 || p.colors.some(c => effColors.includes(c));
    const matchPrice = !effPriceRange || (p.price >= effPriceRange[0] && p.price <= effPriceRange[1]);
    return matchSearch && matchLine && matchCat && matchCol && matchColors && matchPrice;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'preço ↑') return a.price - b.price;
    if (sortBy === 'preço ↓') return b.price - a.price;
    if (sortBy === 'mais vendidos') return b.soldUnits - a.soldUnits;
    if (sortBy === 'avaliação') return b.rating - a.rating;
    return 0;
  });

  const toggleFav = (id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasActiveFilters = selectedLine !== 'Todos' || selectedCategory !== 'Todos' || selectedCollection !== 'Todas';

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto w-full">
      {/* Promo Banner */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
        <img
          src={bannerLimitedAsset}
          alt="Edição Limitada"
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Header + Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produto, referência, linha..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            style={{ fontSize: '0.85rem' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!usingExternal && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border transition-colors ${showFilters || hasActiveFilters ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
            style={{ fontSize: '0.83rem', fontWeight: 500 }}
          >
            <FunnelIcon className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        )}

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border bg-card text-foreground outline-none focus:border-primary"
          style={{ fontSize: '0.83rem' }}
        >
          {['relevância', 'mais vendidos', 'avaliação', 'preço ↑', 'preço ↓'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
          >
            <GridNineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}
          >
            <ListBulletsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {!usingExternal && showFilters && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-muted-foreground mb-2" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Linha</p>
              <div className="flex flex-wrap gap-1.5">
                {lines.map(line => (
                  <button
                    key={line}
                    onClick={() => setSelectedLine(line)}
                    className={`px-3 py-1 rounded-full transition-colors ${selectedLine === line ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    {line}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-2" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Categoria</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full transition-colors ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-2" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Coleção</p>
              <div className="flex flex-wrap gap-1.5">
                {collections.map(col => (
                  <button
                    key={col}
                    onClick={() => setSelectedCollection(col)}
                    className={`px-3 py-1 rounded-full transition-colors ${selectedCollection === col ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setSelectedLine('Todos'); setSelectedCategory('Todos'); setSelectedCollection('Todas'); }}
              className="mt-3 text-primary hover:text-primary/80 flex items-center gap-1"
              style={{ fontSize: '0.75rem' }}
            >
              <XIcon className="w-3 h-3" /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between">
        <div />
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5">
            {selectedLine !== 'Todos' && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1" style={{ fontSize: '0.72rem' }}>
                {selectedLine} <XIcon className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedLine('Todos')} />
              </span>
            )}
            {selectedCategory !== 'Todos' && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1" style={{ fontSize: '0.72rem' }}>
                {selectedCategory} <XIcon className="w-2.5 h-2.5 cursor-pointer" onClick={() => setSelectedCategory('Todos')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products Grid/List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhum produto encontrado</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Tente ajustar os filtros ou a busca</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 items-start">
          {sorted.map(product => (
            <ProductCard
              key={product.id}
              product={{ ...product, isFavorite: favoriteIds.has(product.id) }}
              viewMode="grid"
              onOrder={() => onNavigate('order-grade')}
              onQuickBuy={() => setGradeOpenId(gradeOpenId === product.id ? null : product.id)}
              onOpenDetail={() => setDetailProduct(product)}
              onToggleFav={() => toggleFav(product.id)}
              gradeOpen={gradeOpenId === product.id}
              onAddGrade={(qtys) => addGrade(product, qtys)}
              onCloseGrade={() => setGradeOpenId(null)}
            />

          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(product => (
            <ProductCard
              key={product.id}
              product={{ ...product, isFavorite: favoriteIds.has(product.id) }}
              viewMode="list"
              onOrder={() => onNavigate('order-grade')}
              onQuickBuy={() => setGradeOpenId(gradeOpenId === product.id ? null : product.id)}
              onOpenDetail={() => setDetailProduct(product)}
              onToggleFav={() => toggleFav(product.id)}
              gradeOpen={gradeOpenId === product.id}
              onAddGrade={(qtys) => addGrade(product, qtys)}
              onCloseGrade={() => setGradeOpenId(null)}
            />

          ))}
        </div>
      )}

      {detailProduct && (
        <ProductDetailModal
          product={{ ...detailProduct, isFavorite: favoriteIds.has(detailProduct.id) }}
          isFavorite={favoriteIds.has(detailProduct.id)}
          onClose={() => setDetailProduct(null)}
          onAddGrade={(qtys) => { addGrade(detailProduct, qtys); setDetailProduct(null); }}
          onToggleFav={() => toggleFav(detailProduct.id)}
        />
      )}


      {confirmAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setConfirmAdd(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border">
              <p className="text-foreground" style={{ fontWeight: 700, fontSize: '0.95rem' }}>Adicionar ao carrinho</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: '0.78rem' }}>
                {Object.values(confirmAdd.qtys).reduce((a, b) => a + b, 0)} pares de <span className="text-foreground font-medium">{confirmAdd.product.name}</span>
              </p>
            </div>
            <div className="px-5 py-4 space-y-2 max-h-[40vh] overflow-y-auto">
              {(clientCarts ?? []).map(c => (
                <button
                  key={c.id}
                  onClick={() => setConfirmAdd(prev => prev ? { ...prev, selectedCartId: c.id } : prev)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${confirmAdd.selectedCartId === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}
                >
                  <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <ShoppingCartIcon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.cartName}</p>
                    <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                      <StorefrontIcon className="w-2.5 h-2.5" /> {c.clientName}
                    </p>
                    <CartCreatorTag createdBy={c.createdBy} />
                  </div>
                  {confirmAdd.selectedCartId === c.id && (
                    <span className="text-primary" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Atual</span>
                  )}
                </button>
              ))}
              {(clientCarts ?? []).length === 0 && (
                <p className="text-muted-foreground text-center py-3" style={{ fontSize: '0.8rem' }}>Nenhum carrinho disponível.</p>
              )}
            </div>
            <div className="px-5 py-4 border-t border-border flex gap-2">
              <button
                onClick={() => {
                  setConfirmAdd(null);
                  setPendingAdd({ product: confirmAdd.product, qtys: confirmAdd.qtys });
                  setCreatingMode(true);
                  setCreatingNewName('');
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                style={{ fontSize: '0.82rem', fontWeight: 500 }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Criar novo carrinho
              </button>
              <button
                onClick={() => {
                  const chosen = clientCarts?.find(c => c.id === confirmAdd.selectedCartId);
                  if (chosen) {
                    onPickCart?.(chosen);
                    commitAdd(confirmAdd.product, confirmAdd.qtys, chosen.cartName);
                  }
                  setConfirmAdd(null);
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                style={{ fontSize: '0.82rem', fontWeight: 600 }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setPendingAdd(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-foreground" style={{ fontWeight: 700, fontSize: '0.95rem' }}>Adicionar a qual carrinho?</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: '0.75rem' }}>
                  {Object.values(pendingAdd.qtys).reduce((a, b) => a + b, 0)} pares · {pendingAdd.product.name}
                </p>
              </div>
              <button onClick={() => setPendingAdd(null)} className="text-muted-foreground hover:text-foreground p-1">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
              {(clientCarts ?? []).map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    onPickCart?.(c);
                    commitAdd(pendingAdd.product, pendingAdd.qtys, c.cartName);
                    setPendingAdd(null);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${activeCartId === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}
                >
                  <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <ShoppingCartIcon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.cartName}</p>
                    <p className="text-muted-foreground flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                      <StorefrontIcon className="w-2.5 h-2.5" /> {c.clientName}
                    </p>
                    <CartCreatorTag createdBy={c.createdBy} />
                  </div>
                  {activeCartId === c.id && (
                    <span className="text-primary" style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Atual</span>
                  )}
                </button>
              ))}
              {(clientCarts ?? []).length === 0 && !creatingMode && (
                <p className="text-muted-foreground text-center py-3" style={{ fontSize: '0.8rem' }}>
                  Nenhum carrinho ainda para este cliente.
                </p>
              )}
              {creatingMode ? (
                <div className="p-3 rounded-lg border border-primary/40 bg-primary/5 space-y-2">
                  <label className="block text-muted-foreground" style={{ fontSize: '0.72rem' }}>Nome do novo carrinho</label>
                  <input
                    autoFocus
                    value={creatingNewName}
                    onChange={e => setCreatingNewName(e.target.value)}
                    placeholder="Ex.: Reposição Inverno 26"
                    className="w-full px-2.5 py-2 rounded-md border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                    style={{ fontSize: '0.82rem' }}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setCreatingMode(false); setCreatingNewName(''); }} className="px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground" style={{ fontSize: '0.78rem' }}>Cancelar</button>
                    <button
                      onClick={() => {
                        const ctx = onCreateCart?.(creatingNewName || 'Novo carrinho');
                        if (ctx) {
                          commitAdd(pendingAdd.product, pendingAdd.qtys, ctx.cartName);
                          setPendingAdd(null);
                        }
                      }}
                      className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                      style={{ fontSize: '0.78rem', fontWeight: 600 }}
                    >
                      Criar e adicionar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingMode(true)}
                  className="w-full p-3 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  style={{ fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Criar novo carrinho
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
