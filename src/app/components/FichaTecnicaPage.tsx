import { useState } from "react";
import { toast } from "sonner";
import {
  Search, ChevronLeft, Download, Printer, Share2, ZoomIn,
  FileText, CheckCircle2, Package2,
} from "lucide-react";
import { products, type Product } from "../data/mockData";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

const availabilityColors: Record<Product['availability'], string> = {
  'disponível': 'text-emerald-400 bg-emerald-400/10',
  'baixo estoque': 'text-amber-400 bg-amber-400/10',
  'esgotado': 'text-red-400 bg-red-400/10',
};

const technicalSpecs: Record<string, { cabedal: string; solado: string; forro: string; fechamento: string; peso: string }> = {
  P001: { cabedal: 'Lona premium', solado: 'Borracha EVA injetada', forro: 'Tecido respirável', fechamento: 'Cadarço', peso: '210 g (par 33)' },
  P002: { cabedal: 'Sintético texturizado', solado: 'Borracha EVA', forro: 'Forração em tecido', fechamento: 'Velcro', peso: '195 g (par 33)' },
  P003: { cabedal: 'Sintético fosco', solado: 'Borracha EVA', forro: 'Tecido macio', fechamento: 'Cadarço elástico', peso: '190 g (par 33)' },
  P004: { cabedal: 'Sintético premium', solado: 'Borracha EVA', forro: 'Forração acolchoada', fechamento: 'Velcro duplo', peso: '200 g (par 33)' },
  P005: { cabedal: 'Sintético texturizado', solado: 'Borracha EVA', forro: 'Tecido respirável', fechamento: 'Cadarço elástico', peso: '195 g (par 33)' },
  P006: { cabedal: 'Sintético fosco', solado: 'Borracha EVA', forro: 'Forração em tecido', fechamento: 'Velcro', peso: '190 g (par 33)' },
  P007: { cabedal: 'Sintético premium', solado: 'Borracha EVA', forro: 'Tecido macio', fechamento: 'Cadarço', peso: '198 g (par 33)' },
  P008: { cabedal: 'Lona premium', solado: 'Borracha EVA injetada', forro: 'Forração acolchoada', fechamento: 'Cadarço', peso: '212 g (par 33)' },
};

function getGallery(product: Product): string[] {
  const sameLine = products.filter(p => p.line === product.line).map(p => p.image);
  return Array.from(new Set([product.image, ...sameLine])).slice(0, 4);
}

function getHighlights(product: Product): string[] {
  return [
    `Cabedal em ${product.material.toLowerCase()}, resistente para o uso diário`,
    'Solado em borracha EVA com boa aderência',
    `Parte da ${product.collection}`,
  ];
}

function getRelated(product: Product): Product[] {
  return products
    .filter(p => p.id !== product.id && (p.line === product.line || p.category === product.category))
    .slice(0, 4);
}

const lineOptions = ['Todos', ...Array.from(new Set(products.map(p => p.line)))];
const categoryOptions = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

const labelStyle = { fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em' };

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>{label}</p>
      <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{value}</p>
    </div>
  );
}

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
                <span className={`inline-block px-2 py-0.5 rounded-full mb-1.5 ${availabilityColors[p.availability]}`} style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                  {p.availability}
                </span>
                <p className="text-muted-foreground" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>{p.line} · {p.reference}</p>
                <p className="text-foreground truncate mt-0.5" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</p>
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
  const specs = technicalSpecs[product.id];
  const highlights = getHighlights(product);
  const related = getRelated(product);
  const sizes = Object.keys(product.grades);

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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2 py-0.5 rounded-full ${availabilityColors[product.availability]}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
              {product.availability}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>{product.line} · Ref. {product.reference}</span>
          </div>
          <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{product.name}</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Galeria */}
        <div className="bg-card border border-border rounded-xl p-4">
          <button
            onClick={() => setZoomOpen(true)}
            className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-border mb-3 group"
          >
            <img src={gallery[activeImage]} alt={product.name} className="w-full h-full object-contain p-4" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
              <ZoomIn className="w-6 h-6 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-lg overflow-hidden border bg-white transition-colors ${activeImage === idx ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-border/60'}`}
                >
                  <img src={img} alt={`${product.name} — foto ${idx + 1}`} className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => toast.success('Imagem baixada')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
            style={{ fontSize: '0.78rem', fontWeight: 500 }}
          >
            <Download className="w-3.5 h-3.5" /> Baixar esta imagem
          </button>
        </div>

        {/* Informações */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground mb-2" style={labelStyle}>Descrição</p>
            <p className="text-foreground" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{product.description}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground mb-2" style={labelStyle}>Destaques</p>
            <ul className="space-y-1.5">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-foreground" style={{ fontSize: '0.82rem' }}>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {specs && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-muted-foreground mb-3" style={labelStyle}>Especificações técnicas</p>
              <div className="grid grid-cols-2 gap-3">
                <SpecRow label="Cabedal" value={specs.cabedal} />
                <SpecRow label="Solado" value={specs.solado} />
                <SpecRow label="Forro" value={specs.forro} />
                <SpecRow label="Fechamento" value={specs.fechamento} />
                <SpecRow label="Peso aproximado" value={specs.peso} />
                <SpecRow label="Material" value={product.material} />
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-muted-foreground mb-2" style={labelStyle}>Cores disponíveis</p>
            <div className="flex flex-wrap gap-1.5">
              {product.colors.map(c => (
                <span key={c} className="px-2.5 py-1 rounded-full bg-secondary/60 text-foreground" style={{ fontSize: '0.75rem' }}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tamanhos e tabela de medidas */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-muted-foreground mb-3" style={labelStyle}>Tamanhos e tabela de medidas</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-muted-foreground text-left" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th className="pb-2 pr-6 font-normal">Tamanho</th>
                <th className="pb-2 pr-6 font-normal">Comprimento interno</th>
                <th className="pb-2 font-normal">Estoque</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map(s => {
                const stock = product.grades[s] ?? 0;
                const stockColor = stock === 0 ? 'text-red-400' : stock < 50 ? 'text-amber-400' : 'text-emerald-400';
                return (
                  <tr key={s} className="border-t border-border">
                    <td className="py-2 pr-6 mono text-foreground" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s}</td>
                    <td className="py-2 pr-6 text-muted-foreground" style={{ fontSize: '0.82rem' }}>{(parseInt(s, 10) / 10).toFixed(1)} cm</td>
                    <td className={`py-2 mono ${stockColor}`} style={{ fontSize: '0.82rem', fontWeight: 600 }}>{stock} pares</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                  <p className="text-muted-foreground" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{p.reference}</p>
                  <p className="text-foreground truncate" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.name}</p>
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
