import { products, type Client } from "./mockData";

export interface StockItem {
  sku: string;
  name: string;
  line: string;
  category: string;
  image: string;
  price: number;
  stock: number;
  min: number; // limiar de ruptura
  updatedAt: string;
}

export type StockStatusKey = 'ruptura' | 'baixo' | 'ok';

/** `color` é um nome de cor do tema Mantine, usado nos Badges de status. */
export function statusOf(item: Pick<StockItem, 'stock' | 'min'>): { key: StockStatusKey; label: string; color: string } {
  if (item.stock <= 0) return { key: 'ruptura', label: 'Ruptura', color: 'red' };
  if (item.stock < item.min) return { key: 'baixo', label: 'Baixo', color: 'yellow' };
  return { key: 'ok', label: 'OK', color: 'teal' };
}

/** RNG determinístico por semente, para gerar estoque estável por cliente sem precisar cadastrar tudo à mão. */
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

/** Estoque consolidado de fábrica, com base na grade de todos os produtos. */
export function industryStockItems(): StockItem[] {
  return products.map(p => ({
    sku: p.id,
    name: p.name,
    line: p.line,
    category: p.category,
    image: p.image,
    price: p.price,
    stock: Object.values(p.grades).reduce((a, b) => a + b, 0),
    min: Math.max(5, Math.round(Object.values(p.grades).reduce((a, b) => a + b, 0) * 0.2)),
    updatedAt: '2026-06-18',
  }));
}

/** Estoque reportado por um lojista específico (cadastro manual ou integração ERP dele). */
export function generateClientStock(client: Pick<Client, 'id'>): StockItem[] {
  const rand = seededRandom(client.id);
  return products.slice(0, 12).map(p => {
    const stockRoll = rand();
    const minRoll = rand();
    const stock = stockRoll < 0.12 ? 0 : Math.round(4 + stockRoll * 56);
    const min = Math.round(4 + minRoll * 16);
    return {
      sku: p.id,
      name: p.name,
      line: p.line,
      category: p.category,
      image: p.image,
      price: p.price,
      stock,
      min,
      updatedAt: '2026-06-18',
    };
  });
}
