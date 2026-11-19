// Pós-venda (Radar de fidelização): clientes finais da loja do lojista.
// Mock até existir integração com o CRM / PDV da loja. As datas são relativas a hoje,
// para a tela sempre parecer atual.

import { products } from "./mockData";

/** Dias sem comprar para o cliente contar como "sumido". */
export const LAPSED_DAYS = 90;
/** Janela de aniversariantes, em dias a partir de hoje. */
export const BIRTHDAY_WINDOW_DAYS = 30;
/** Compras nos últimos 12 meses para o cliente contar como fiel. */
export const LOYAL_PURCHASES = 4;
/** Cliente novo: primeira compra nos últimos N dias. */
export const NEW_DAYS = 30;

export interface StoreCustomer {
  id: string;
  name: string;
  phone: string;
  /** Dias até o próximo aniversário (0 = hoje). */
  birthdayInDays: number;
  lastPurchaseDaysAgo: number;
  /** Compras nos últimos 12 meses. */
  purchases12m: number;
  /** Valor gasto nos últimos 12 meses (R$). */
  spent12m: number;
  /** Produto da última compra. */
  lastProductId: string;
  /** Autorizou receber mensagens (LGPD). Sem autorização, fica fora das campanhas. */
  optIn: boolean;
}

// [nome, telefone, aniversário em N dias, última compra há N dias, compras 12m, gasto 12m, produto, autorizou]
const rows: Array<[string, string, number, number, number, number, string, boolean]> = [
  ['Ana Beatriz Costa', '(11) 98412-3301', 3, 12, 6, 2380, 'P002', true],
  ['Bruno Henrique Lima', '(11) 97733-1180', 41, 104, 2, 690, 'P001', true],
  ['Camila Rocha', '(11) 99620-4471', 9, 38, 4, 1520, 'P002', true],
  ['Diego Martins', '(11) 98810-2276', 120, 131, 1, 389, 'P005', true],
  ['Eduarda Santos', '(11) 97455-9032', 0, 6, 7, 2940, 'P006', true],
  ['Felipe Araújo', '(11) 99134-6658', 63, 97, 3, 1110, 'P002', false],
  ['Gabriela Nunes', '(11) 98067-7714', 17, 210, 1, 420, 'P003', true],
  ['Heitor Carvalho', '(11) 99502-3389', 200, 22, 5, 1890, 'P006', true],
  ['Isabela Ferreira', '(11) 97288-1145', 26, 64, 3, 980, 'P004', true],
  ['João Pedro Alves', '(11) 98345-6620', 88, 145, 2, 760, 'P002', true],
  ['Larissa Mendes', '(11) 99871-2093', 150, 4, 1, 459, 'P002', true],
  ['Lucas Oliveira', '(11) 98226-4417', 12, 118, 2, 840, 'P005', true],
  ['Mariana Teixeira', '(11) 97611-8350', 230, 15, 8, 3310, 'P002', true],
  ['Mateus Barbosa', '(11) 99048-5576', 5, 180, 1, 349, 'P001', false],
  ['Natália Ribeiro', '(11) 98590-1238', 300, 9, 1, 529, 'P008', true],
  ['Otávio Gomes', '(11) 97920-6614', 72, 46, 4, 1460, 'P006', true],
  ['Patrícia Moreira', '(11) 98733-0081', 22, 93, 3, 1050, 'P004', true],
  ['Rafael Pinto', '(11) 99417-2265', 180, 27, 5, 2110, 'P002', true],
  ['Renata Dias', '(11) 98154-9907', 110, 260, 1, 389, 'P003', true],
  ['Sofia Cardoso', '(11) 97302-4458', 28, 19, 2, 818, 'P009', true],
  ['Thiago Correia', '(11) 99785-1129', 95, 2, 1, 479, 'P002', true],
  ['Vitória Azevedo', '(11) 98866-3072', 140, 72, 4, 1690, 'P006', true],
];

export const storeCustomers: StoreCustomer[] = rows.map(([name, phone, birthdayInDays, lastPurchaseDaysAgo, purchases12m, spent12m, lastProductId, optIn], i) => ({
  id: `CF-${String(i + 1).padStart(3, '0')}`,
  name, phone, birthdayInDays, lastPurchaseDaysAgo, purchases12m, spent12m, lastProductId, optIn,
}));

export type CustomerSegment = 'todos' | 'aniversariantes' | 'sumidos' | 'fieis' | 'novos';

export const SEGMENT_META: Record<CustomerSegment, { label: string; hint: string }> = {
  todos: { label: 'Todos', hint: 'Todos os clientes da loja' },
  aniversariantes: { label: 'Aniversariantes', hint: `Fazem aniversário nos próximos ${BIRTHDAY_WINDOW_DAYS} dias` },
  sumidos: { label: 'Sumidos', hint: `Sem comprar há ${LAPSED_DAYS} dias ou mais` },
  fieis: { label: 'Fiéis', hint: `${LOYAL_PURCHASES} compras ou mais nos últimos 12 meses` },
  novos: { label: 'Novos', hint: `Primeira compra nos últimos ${NEW_DAYS} dias` },
};

export function inSegment(c: StoreCustomer, segment: CustomerSegment): boolean {
  switch (segment) {
    case 'todos': return true;
    case 'aniversariantes': return c.birthdayInDays <= BIRTHDAY_WINDOW_DAYS;
    case 'sumidos': return c.lastPurchaseDaysAgo >= LAPSED_DAYS;
    case 'fieis': return c.purchases12m >= LOYAL_PURCHASES;
    case 'novos': return c.purchases12m === 1 && c.lastPurchaseDaysAgo <= NEW_DAYS;
  }
}

export const customersIn = (segment: CustomerSegment) => storeCustomers.filter(c => inSegment(c, segment));

/** Produto mais recomprado: entre quem comprou cada produto, a maior parte que voltou a comprar. */
export function mostRebought() {
  const byProduct = new Map<string, StoreCustomer[]>();
  for (const c of storeCustomers) byProduct.set(c.lastProductId, [...(byProduct.get(c.lastProductId) ?? []), c]);
  const ranked = [...byProduct.entries()]
    .map(([productId, buyers]) => {
      const repeat = buyers.filter(b => b.purchases12m >= 2).length;
      return { productId, buyers, repeat, share: Math.round((repeat / buyers.length) * 100) };
    })
    .filter(r => r.buyers.length >= 3)
    .sort((a, b) => b.repeat - a.repeat || b.share - a.share);
  const top = ranked[0];
  const product = products.find(p => p.id === top.productId)!;
  return { ...top, product };
}

/** Data a N dias de hoje (negativo = passado), no formato "12 de nov.". */
export function dayLabel(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** Mensagem sugerida por segmento; {nome} vira o primeiro nome de cada cliente. */
export const SEGMENT_MESSAGE: Record<CustomerSegment, string> = {
  todos: 'Oi, {nome}! Chegou coleção nova aqui na loja. Passa pra conhecer?',
  aniversariantes: 'Oi, {nome}! Feliz aniversário! 🎉 Na semana do seu aniversário você tem 10% de desconto em qualquer par da loja.',
  sumidos: 'Oi, {nome}! Faz tempo que você não aparece por aqui. Separamos a coleção nova pra você ver primeiro — quer que eu mande as fotos?',
  fieis: 'Oi, {nome}! Você é um dos nossos clientes mais especiais. Antes de todo mundo: a coleção nova chegou.',
  novos: 'Oi, {nome}! Obrigado pela sua primeira compra. Como está o par novo? Qualquer ajuste de tamanho é só chamar.',
};
