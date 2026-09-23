import { useState } from "react";
import { notify } from "../../mantine/notify";
import {
  MagnifyingGlassIcon,
  CaretLeftIcon,
  DownloadSimpleIcon,
  MagnifyingGlassPlusIcon,
  FileTextIcon,
  PackageIcon,
  CheckCircleIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { products, type Product } from "../data/mockData";
import { Image, Modal } from "@mantine/core";

type Profile = 'admin' | 'rep' | 'lojista';

const availabilityColors: Record<Product['availability'], string> = {
  'disponível': 'text-emerald-400 bg-emerald-400/10',
  'baixo estoque': 'text-amber-400 bg-amber-400/10',
  'esgotado': 'text-red-400 bg-red-400/10',
};

// produtos descontinuados — não fazem mais parte do sortimento vendável
const discontinuedIds = new Set(['P003', 'P006']);
const isDiscontinued = (product: Product) => discontinuedIds.has(product.id);

interface Highlight {
  title: string;
  description: string;
}

// destaques relacionando cada característica do produto ao seu diferencial — mock para todo o
// catálogo, usando o texto real do Flow Preto (Tesla Flow All Black Reflect) como referência de estilo
const productHighlights: Record<string, { items: Highlight[]; tagline: string }> = {
  P001: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual moderno com linhas marcantes inspiradas na cultura urbana.' },
      { title: 'Cabedal Premium', description: 'Confeccionado em lona resistente com acabamento denim e recortes exclusivos para maior durabilidade e estilo.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Fat Lace', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Acabamento limpo e recortes em azul que valorizam o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Flow XL Denim é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P002: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual clean e versátil, com linhas minimalistas que combinam com qualquer produção.' },
      { title: 'Cabedal Premium', description: 'Material sintético de alta qualidade, com costuras reforçadas para maior durabilidade.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme e confortável, ideal para o uso diário.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Acabamento branco impecável que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Coil Branco é ideal para quem busca praticidade sem abrir mão do estilo — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P003: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual arrojado, com contraste vermelho e branco que chama atenção nas ruas.' },
      { title: 'Cabedal Premium', description: 'Material sintético resistente, com recortes exclusivos da linha Hertz Art.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Combinação vermelho e branco que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Hertz Art Vermelho é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P004: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual sofisticado, com tom marrom que une estilo urbano e versatilidade.' },
      { title: 'Cabedal Premium', description: 'Material sintético de alta qualidade, com costuras reforçadas para maior durabilidade.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme e confortável, ideal para o uso diário.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Acabamento em tom marrom que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Hertz Marrom é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P005: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual moderno com linhas marcantes inspiradas na cultura urbana.' },
      { title: 'Cabedal Premium', description: 'Combinação de lona resistente e camurça natural, com costuras reforçadas e recortes exclusivos para maior durabilidade e estilo.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Fat Lace', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade. O design exclusivo traz cores vibrantes que unem funcionalidade e personalidade em cada passo.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Cadarços resistentes e acabamento limpo que valorizam o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Flow All Black Reflect é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P006: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual moderno, com contraste navy e branco inspirado na cultura urbana.' },
      { title: 'Cabedal Premium', description: 'Material sintético de alta qualidade, com costuras reforçadas para maior durabilidade.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme e confortável, ideal para o uso diário.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Combinação navy e branco que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Coil Navy é ideal para quem busca praticidade sem abrir mão do estilo — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P007: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual arrojado, com contraste azul e branco que chama atenção nas ruas.' },
      { title: 'Cabedal Premium', description: 'Material sintético resistente, com recortes exclusivos da linha Hertz Art.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Combinação azul e branco que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Hertz Art Azul é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P008: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual moderno com linhas marcantes inspiradas na cultura urbana.' },
      { title: 'Cabedal Premium', description: 'Confeccionado em lona resistente, com costuras reforçadas e recortes exclusivos para maior durabilidade e estilo.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Fat Lace', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Acabamento all black que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Flow XL Preto é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
};

// sempre 6 fotos — cicla pelas imagens disponíveis na linha do produto quando há menos de 6 únicas
function getGallery(product: Product): string[] {
  const sameLine = products.filter(p => p.line === product.line).map(p => p.image);
  const unique = Array.from(new Set([product.image, ...sameLine]));
  return Array.from({ length: 6 }, (_, i) => unique[i % unique.length]);
}

// classes de span para montar um bento grid (4 colunas x 3 linhas) com as 6 imagens do produto
function bentoSpanClasses(index: number): string {
  if (index === 0) return 'col-span-2 row-span-2';
  if (index === 1) return 'col-span-2 row-span-1';
  if (index === 2 || index === 3) return 'col-span-1 row-span-1';
  return 'col-span-2 row-span-1';
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

// estoque da loja — fração pequena e determinística do estoque de fábrica por tamanho
// (não existe um dado real de estoque por loja no mock; cada loja mantém pouca profundidade de grade)
function getStoreStock(product: Product): Record<string, number> {
  const sizes = Object.keys(product.grades);
  const ratios = [0.08, 0.05, 0.12, 0.03, 0.15, 0.07];
  const result: Record<string, number> = {};
  sizes.forEach((s, i) => {
    const factory = product.grades[s] ?? 0;
    const seed = (product.id.charCodeAt(product.id.length - 1) + i) % ratios.length;
    result[s] = Math.round(factory * ratios[seed]);
  });
  return result;
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
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
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
          <PackageIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhum produto encontrado</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Tente ajustar os filtros de busca</p>
        </div>
      )}
    </div>
  );
}

function ProductSpecSheet({ product, profile, onBack, onOpenRelated }: { product: Product; profile: Profile; onBack: () => void; onOpenRelated: (p: Product) => void }) {
  const gallery = getGallery(product);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const related = getColorVariants(product);
  const sizes = Object.keys(product.grades);
  const storeStock = getStoreStock(product);
  const highlights = productHighlights[product.id];

  const openZoom = (idx: number) => {
    setActiveImage(idx);
    setZoomOpen(true);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto w-full space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <CaretLeftIcon className="w-4 h-4" /> Voltar para Ficha Técnica
      </button>

      <div className="flex items-center justify-end gap-2 flex-wrap">
        <button
          onClick={() => notify.success('Imagens baixadas (ZIP)')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
          style={{ fontSize: '0.78rem', fontWeight: 500 }}
        >
          <DownloadSimpleIcon className="w-3.5 h-3.5" /> Baixar imagens
        </button>
        <button
          onClick={() => notify.success('PDF gerado')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          style={{ fontSize: '0.78rem', fontWeight: 600 }}
        >
          <FileTextIcon className="w-3.5 h-3.5" /> Baixar PDF
        </button>
      </div>

      {/* Bento grid — 6 imagens do produto */}
      <div className="grid grid-cols-4 grid-rows-3 gap-2 aspect-[4/3] rounded-xl overflow-hidden">
        {gallery.map((img, idx) => (
          <div
            key={idx}
            onClick={() => openZoom(idx)}
            className={`relative overflow-hidden bg-white border border-border group cursor-pointer ${bentoSpanClasses(idx)}`}
          >
            <img src={img} alt={`${product.name} — foto ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
              <MagnifyingGlassPlusIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <button
              onClick={e => { e.stopPropagation(); notify.success('Imagem baixada'); }}
              aria-label="Baixar imagem"
              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <DownloadSimpleIcon className="w-3.5 h-3.5" />
            </button>
          </div>
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

        {highlights && (
          <div>
            <p className="text-muted-foreground mb-2" style={labelStyle}>Destaques do produto</p>
            <ul className="space-y-2.5">
              {highlights.items.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-foreground" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>{h.title}: </span>
                    {h.description}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-3" style={{ fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.5 }}>
              {highlights.tagline}
            </p>
          </div>
        )}
      </div>

      {/* Estoque */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div>
          <p className="text-muted-foreground mb-2" style={labelStyle}>
            {profile === 'lojista' ? 'Estoque por tamanho (fábrica e loja)' : 'Estoque fábrica por tamanho'}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-muted-foreground text-left border-b border-border" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th className="py-2 pr-4 font-normal">Tamanho</th>
                  <th className="py-2 px-4 font-normal text-center">Estoque fábrica</th>
                  {profile === 'lojista' && <th className="py-2 pl-4 font-normal text-center">Estoque loja</th>}
                </tr>
              </thead>
              <tbody>
                {sizes.map(s => {
                  const factoryStock = product.grades[s] ?? 0;
                  const factoryColor = factoryStock === 0 ? 'text-red-400' : factoryStock < 20 ? 'text-amber-400' : 'text-emerald-400';
                  const storeQty = storeStock[s] ?? 0;
                  const storeColor = storeQty === 0 ? 'text-red-400' : storeQty < 3 ? 'text-amber-400' : 'text-emerald-400';
                  const storeLow = storeQty < 3;
                  return (
                    <tr key={s} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-4 text-foreground whitespace-nowrap" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Nº {s}</td>
                      <td className={`py-2.5 px-4 text-center mono ${factoryColor}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {factoryStock}
                      </td>
                      {profile === 'lojista' && (
                        <td className="py-2.5 pl-4">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`mono ${storeColor}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>{storeQty}</span>
                            {storeLow && (
                              <button
                                onClick={() => notify.success(`Reposição rápida solicitada — Nº ${s}`)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex-shrink-0"
                                style={{ fontSize: '0.65rem', fontWeight: 600 }}
                              >
                                <ArrowsClockwiseIcon className="w-3 h-3" /> Reposição rápida
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
      <Modal opened={zoomOpen} onClose={() => setZoomOpen(false)} size="xl" title={product.name}>
        <Image src={gallery[activeImage]} alt={product.name} fit="contain" />
      </Modal>
    </div>
  );
}

export function FichaTecnicaPage({ profile }: { profile: Profile }) {
  const [selected, setSelected] = useState<Product | null>(null);

  if (selected) {
    return <ProductSpecSheet product={selected} profile={profile} onBack={() => setSelected(null)} onOpenRelated={setSelected} />;
  }

  return <ProductGrid onOpen={setSelected} />;
}
