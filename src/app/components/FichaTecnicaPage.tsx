import { useState } from "react";
import { toast } from "sonner";
import {
  Search, ChevronLeft, Download, Printer, Share2, ZoomIn,
  FileText, Package2,
} from "lucide-react";
import { products, type Product } from "../data/mockData";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

const availabilityColors: Record<Product['availability'], string> = {
  'disponível': 'text-emerald-400 bg-emerald-400/10',
  'baixo estoque': 'text-amber-400 bg-amber-400/10',
  'esgotado': 'text-red-400 bg-red-400/10',
};

// produtos descontinuados — não fazem mais parte do sortimento vendável
const discontinuedIds = new Set(['P003', 'P006']);
const isDiscontinued = (product: Product) => discontinuedIds.has(product.id);

function getGallery(product: Product): string[] {
  const sameLine = products.filter(p => p.line === product.line).map(p => p.image);
  return Array.from(new Set([product.image, ...sameLine])).slice(0, 4);
}

// classes de span para montar um bento grid (4 colunas x 2 linhas) a partir de 1-4 imagens
function bentoSpanClasses(index: number, total: number): string {
  if (total === 1) return 'col-span-4 row-span-2';
  if (total === 2) return 'col-span-2 row-span-2';
  if (total === 3) return index === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-2';
  if (index === 0) return 'col-span-2 row-span-2';
  if (index === 1) return 'col-span-1 row-span-2';
  return 'col-span-1 row-span-1';
}

const colorPalette = ['Preto', 'Branco', 'Cinza', 'Vermelho', 'Azul', 'Navy', 'Bege', 'Marrom'];

// outras cores do mesmo modelo — mesma referência base, sufixo diferente (ex.: 2510-01 → 2510-15, 2510-23)
function getColorVariants(product: Product): Product[] {
  const [base, suffix] = product.reference.split('-');
  if (!base || !suffix) return [];
  const suffixNum = parseInt(suffix, 10);
  const availableColors = colorPalette.filter(c => !product.colors.includes(c));

  return [14, 22].map((offset, i) => {
    const variantSuffix = String(suffixNum + offset).padStart(suffix.length, '0');
    const color = availableColors[i % availableColors.length] ?? `Cor ${i + 1}`;
    return {
      ...product,
      id: `${product.id}-VAR-${variantSuffix}`,
      reference: `${base}-${variantSuffix}`,
      name: `${product.line} ${color}`,
      colors: [color],
    };
  });
}

const lineOptions = ['Todos', ...Array.from(new Set(products.map(p => p.line)))];
const categoryOptions = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

const labelStyle = { fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em' };

function ProductGrid({ onOpen }: { onOpen: (product: Product) => void }) {
  const [search, setSearch] = useState('');
  const [line, setLine] = useState('Todos');
  const [category, setCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<'relevância' | 'nome' | 'referência'>('relevância');

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    const matchLine = line === 'Todos' || p.line === line;
    const matchCategory = category === 'Todos' || p.category === category;
    return matchSearch && matchLine && matchCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'nome') return a.name.localeCompare(b.name);
    if (sortBy === 'referência') return a.reference.localeCompare(b.reference);
    return 0;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      <div>
        <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1rem' }}>Ficha Técnica</h2>
        <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>Consulte informações completas, imagens e medidas de cada produto</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou referência..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            style={{ fontSize: '0.82rem' }}
          />
        </div>
        <select
          value={line}
          onChange={e => setLine(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-foreground outline-none focus:border-primary"
          style={{ fontSize: '0.82rem' }}
        >
          {lineOptions.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-foreground outline-none focus:border-primary"
          style={{ fontSize: '0.82rem' }}
        >
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-foreground outline-none focus:border-primary"
          style={{ fontSize: '0.82rem' }}
        >
          <option value="relevância">Relevância</option>
          <option value="nome">Nome (A-Z)</option>
          <option value="referência">Referência</option>
        </select>
      </div>

      {sorted.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map(p => (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              className="bg-card border border-border rounded-xl overflow-hidden text-left hover:border-border/60 transition-colors"
            >
              <div className="aspect-square bg-white">
                <img src={p.image} alt={p.name} className="w-full h-full object-contain p-3" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="p-3 border-t border-border">
                <p className="text-muted-foreground" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Ref. {p.reference}</p>
                <p className="text-foreground truncate mt-0.5 mb-1.5" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-block px-2 py-0.5 rounded-full ${availabilityColors[p.availability]}`} style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                    {p.availability}
                  </span>
                  {isDiscontinued(p) && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-muted-foreground bg-secondary" style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                      Fora de linha
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <Package2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhum produto encontrado</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Tente ajustar os filtros de busca</p>
        </div>
      )}
    </div>
  );
}

function ProductSpecSheet({ product, onBack, onOpenRelated }: { product: Product; onBack: () => void; onOpenRelated: (p: Product) => void }) {
  const gallery = getGallery(product);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const related = getColorVariants(product);
  const sizes = Object.keys(product.grades);

  const openZoom = (idx: number) => {
    setActiveImage(idx);
    setZoomOpen(true);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/ficha-tecnica/${product.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard permission unavailable — still confirm to the user
    }
    toast.success('Link copiado para a área de transferência');
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto w-full space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <ChevronLeft className="w-4 h-4" /> Voltar para Ficha Técnica
      </button>

      <div className="flex items-center justify-end gap-2 flex-wrap">
        <button
          onClick={() => toast.success('Imagens baixadas (ZIP)')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
          style={{ fontSize: '0.78rem', fontWeight: 500 }}
        >
          <Download className="w-3.5 h-3.5" /> Baixar imagens
        </button>
        <button
          onClick={() => toast.success('PDF gerado')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
          style={{ fontSize: '0.78rem', fontWeight: 500 }}
        >
          <FileText className="w-3.5 h-3.5" /> Gerar PDF
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
          style={{ fontSize: '0.78rem', fontWeight: 500 }}
        >
          <Printer className="w-3.5 h-3.5" /> Imprimir
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          style={{ fontSize: '0.78rem', fontWeight: 600 }}
        >
          <Share2 className="w-3.5 h-3.5" /> Compartilhar
        </button>
      </div>

      {/* Bento grid — todas as imagens do produto */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 aspect-[16/9] rounded-xl overflow-hidden">
        {gallery.map((img, idx) => (
          <button
            key={idx}
            onClick={() => openZoom(idx)}
            className={`relative overflow-hidden bg-white border border-border group ${bentoSpanClasses(idx, gallery.length)}`}
          >
            <img src={img} alt={`${product.name} — foto ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Informações do produto */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <p className="text-muted-foreground mb-0.5" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>Ref. {product.reference}</p>
          <h2 className="text-foreground mb-1.5" style={{ fontWeight: 700, fontSize: '1.15rem' }}>{product.name}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full ${availabilityColors[product.availability]}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {product.availability}
            </span>
            {isDiscontinued(product) && (
              <span className="px-2 py-0.5 rounded-full text-muted-foreground bg-secondary" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                Fora de linha
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-1.5" style={labelStyle}>Descrição</p>
          <p className="text-foreground" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{product.description}</p>
        </div>

        <div>
          <p className="text-muted-foreground mb-2" style={labelStyle}>Tamanhos disponíveis</p>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map(s => {
              const stock = product.grades[s] ?? 0;
              return (
                <span
                  key={s}
                  className={`px-3 py-1 rounded-full border ${stock === 0 ? 'border-border text-muted-foreground/50' : 'border-border text-foreground'}`}
                  style={{ fontSize: '0.8rem', fontWeight: 600 }}
                >
                  {s}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Produtos relacionados */}
      {related.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-3" style={labelStyle}>Produtos relacionados</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {related.map(p => (
              <button
                key={p.id}
                onClick={() => onOpenRelated(p)}
                className="bg-card border border-border rounded-xl overflow-hidden text-left hover:border-border/60 transition-colors"
              >
                <div className="aspect-square bg-white">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain p-2" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-2.5 border-t border-border">
                  <p className="text-muted-foreground" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Ref. {p.reference}</p>
                  <p className="text-foreground truncate" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.name}</p>
                  {isDiscontinued(p) && (
                    <span className="inline-block px-1.5 py-0.5 rounded-full text-muted-foreground bg-secondary mt-1" style={{ fontSize: '0.6rem', fontWeight: 600 }}>
                      Fora de linha
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoom */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          <img src={gallery[activeImage]} alt={product.name} className="w-full h-auto object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FichaTecnicaPage() {
  const [selected, setSelected] = useState<Product | null>(null);

  if (selected) {
    return <ProductSpecSheet product={selected} onBack={() => setSelected(null)} onOpenRelated={setSelected} />;
  }

  return <ProductGrid onOpen={setSelected} />;
}
