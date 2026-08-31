export type Grade = { [size: string]: number };

export interface Product {
  id: string;
  name: string;
  reference: string;
  line: string;
  category: string;
  collection: string;
  price: number;
  priceRetail: number;
  image: string;
  availability: 'disponível' | 'baixo estoque' | 'esgotado';
  colors: string[];
  material: string;
  isFavorite?: boolean;
  rating: number;
  soldUnits: number;
  grades: Grade;
  description: string;
}

export interface CommercialPolicy {
  id: string;
  name: string;
  discount: number;
  paymentCondition: string;
  minOrderValue: number;
}

export interface Order {
  id: string;
  date: string;
  client: string;
  clientId: string;
  rep: string;
  status: 'aprovado' | 'em análise' | 'faturado' | 'cancelado' | 'entregue';
  total: number;
  items: number;
  paymentCondition: string;
  collection: string;
}

export interface Client {
  id: string;
  name: string;
  cnpj: string;
  city: string;
  state: string;
  region: string;
  rep: string;
  lastOrder: string;
  totalPurchased: number;
  status: 'ativo' | 'inativo' | 'em aberto';
  avatar: string;
  policyId: string;
}

export interface SelloutRecord {
  month: string;
  sellIn: number;
  sellOut: number;
  stock: number;
}

export interface RegionPerformance {
  region: string;
  revenue: number;
  target: number;
  growth: number;
  orders: number;
}

export const commercialPolicies: CommercialPolicy[] = [
  { id: 'TAB-A', name: 'Tabela A', discount: 0, paymentCondition: '5x sem juros', minOrderValue: 1500 },
  { id: 'TAB-B', name: 'Tabela B', discount: 3, paymentCondition: '5x sem juros', minOrderValue: 1200 },
  { id: 'TAB-C', name: 'Tabela C', discount: 5, paymentCondition: '3x sem juros', minOrderValue: 800 },
];

export const products: Product[] = [
  {
    id: 'P001',
    name: 'Flow XL Denim',
    reference: '2502-19',
    line: 'Flow XL',
    category: 'Tênis',
    collection: 'Coleção 2026',
    price: 154.95,
    priceRetail: 309.90,
    image: 'https://cdn.dooca.store/153486/products/flow-xl-2502-10-black-reflect-b-suclc_1600x1600+fill_ffffff.jpg?v=1773944251',
    availability: 'disponível',
    colors: ['Denim', 'Azul'],
    material: 'Lona',
    isFavorite: true,
    rating: 4.8,
    soldUnits: 1400,
    description: 'Tênis infantil linha Flow XL, modelo Denim. Grade 34 ao 44.',
    grades: { '34': 35, '35': 65, '36': 90, '37': 120, '38': 140, '39': 140, '40': 120, '41': 90, '42': 65, '43': 35, '44': 20 },
  },
  {
    id: 'P002',
    name: 'Coil Branco',
    reference: '2510-01',
    line: 'Coil',
    category: 'Tênis',
    collection: 'Coleção 2026',
    price: 107.48,
    priceRetail: 214.95,
    image: 'https://cdn.dooca.store/153486/products/226-tesla-1_1600x1600+fill_ffffff.jpg?v=1727965004',
    availability: 'disponível',
    colors: ['Branco'],
    material: 'Sintético',
    isFavorite: false,
    rating: 4.6,
    soldUnits: 1200,
    description: 'Tênis infantil linha Coil, modelo Branco.',
    grades: { '34': 35, '35': 65, '36': 90, '37': 120, '38': 140, '39': 140, '40': 120, '41': 90, '42': 65, '43': 35, '44': 20 },
  },
  {
    id: 'P003',
    name: 'Hertz Art Vermelho',
    reference: '2489-04',
    line: 'Hertz Art',
    category: 'Tênis',
    collection: 'Coleção 2026',
    price: 124.95,
    priceRetail: 249.90,
    image: 'https://cdn.dooca.store/153486/products/21-tesla_1600x1600+fill_ffffff.jpg?v=1720100415',
    availability: 'baixo estoque',
    colors: ['Vermelho', 'Branco'],
    material: 'Sintético',
    isFavorite: false,
    rating: 4.2,
    soldUnits: 480,
    description: 'Tênis infantil linha Hertz Art, modelo Vermelho.',
    grades: { '34': 5, '35': 8, '36': 12, '37': 15, '38': 17, '39': 18, '40': 15, '41': 11, '42': 8, '43': 4, '44': 2 },
  },
  {
    id: 'P004',
    name: 'Hertz Marrom',
    reference: '2491-07',
    line: 'Hertz',
    category: 'Tênis',
    collection: 'Coleção 2026',
    price: 124.95,
    priceRetail: 249.90,
    image: 'https://cdn.dooca.store/153486/products/dsc00810jpg_1600x1600+fill_ffffff.jpg?v=1759512194',
    availability: 'disponível',
    colors: ['Marrom'],
    material: 'Sintético',
    isFavorite: false,
    rating: 4.5,
    soldUnits: 920,
    description: 'Tênis infantil linha Hertz, modelo Marrom.',
    grades: { '34': 32, '35': 56, '36': 80, '37': 104, '38': 120, '39': 120, '40': 104, '41': 80, '42': 56, '43': 32, '44': 16 },
  },
  {
    id: 'P005',
    name: 'Flow Preto',
    reference: '2501-02',
    line: 'Flow',
    category: 'Tênis',
    collection: 'Coleção 2026',
    price: 109.95,
    priceRetail: 219.90,
    image: 'https://cdn.dooca.store/153486/products/flow-xl-2502-10-black-reflect-b-suclc_1600x1600+fill_ffffff.jpg?v=1773944251',
    availability: 'disponível',
    colors: ['Preto'],
    material: 'Sintético',
    isFavorite: false,
    rating: 4.6,
    soldUnits: 1060,
    description: 'Tênis infantil linha Flow, modelo Preto.',
    grades: { '34': 35, '35': 62, '36': 88, '37': 114, '38': 132, '39': 133, '40': 114, '41': 88, '42': 62, '43': 35, '44': 17 },
  },
  {
    id: 'P006',
    name: 'Coil Navy',
    reference: '2511-03',
    line: 'Coil',
    category: 'Tênis',
    collection: 'Coleção 2026',
    price: 107.48,
    priceRetail: 214.95,
    image: 'https://cdn.dooca.store/153486/products/226-tesla-1_1600x1600+fill_ffffff.jpg?v=1727965004',
    availability: 'disponível',
    colors: ['Navy', 'Branco'],
    material: 'Sintético',
    isFavorite: false,
    rating: 4.4,
    soldUnits: 840,
    description: 'Tênis infantil linha Coil, modelo Navy.',
    grades: { '34': 28, '35': 48, '36': 69, '37': 90, '38': 104, '39': 103, '40': 90, '41': 68, '42': 48, '43': 28, '44': 14 },
  },
  {
    id: 'P007',
    name: 'Hertz Art Azul',
    reference: '2489-06',
    line: 'Hertz Art',
    category: 'Tênis',
    collection: 'Coleção 2026',
    price: 124.95,
    priceRetail: 249.90,
    image: 'https://cdn.dooca.store/153486/products/21-tesla_1600x1600+fill_ffffff.jpg?v=1720100415',
    availability: 'disponível',
    colors: ['Azul', 'Branco'],
    material: 'Sintético',
    isFavorite: false,
    rating: 4.3,
    soldUnits: 560,
    description: 'Tênis infantil linha Hertz Art, modelo Azul.',
    grades: { '34': 22, '35': 38, '36': 54, '37': 70, '38': 81, '39': 81, '40': 70, '41': 54, '42': 38, '43': 21, '44': 11 },
  },
  {
    id: 'P008',
    name: 'Flow XL Preto',
    reference: '2502-02',
    line: 'Flow XL',
    category: 'Tênis',
    collection: 'Coleção 2026',
    price: 154.95,
    priceRetail: 309.90,
    image: 'https://cdn.dooca.store/153486/products/dsc00810jpg_1600x1600+fill_ffffff.jpg?v=1759512194',
    availability: 'disponível',
    colors: ['Preto'],
    material: 'Lona',
    isFavorite: true,
    rating: 4.7,
    soldUnits: 1100,
    description: 'Tênis infantil linha Flow XL, modelo Preto.',
    grades: { '34': 38, '35': 66, '36': 94, '37': 122, '38': 141, '39': 141, '40': 122, '41': 93, '42': 66, '43': 38, '44': 19 },
  },
];

export const orders: Order[] = [
  { id: 'PED-2026-0412', date: '2026-06-09', client: 'Calçadão Paulista LTDA', clientId: 'CLI-001', rep: 'Marcos Andrade', status: 'aprovado', total: 10540.00, items: 124, paymentCondition: '5x sem juros', collection: 'Coleção 2026' },
  { id: 'PED-2026-0411', date: '2026-06-08', client: 'Sapataria Mineira', clientId: 'CLI-002', rep: 'Fernanda Lima', status: 'faturado', total: 7310.00, items: 86, paymentCondition: '5x sem juros', collection: 'Coleção 2026' },
  { id: 'PED-2026-0410', date: '2026-06-07', client: 'Mundo dos Sapatos RJ', clientId: 'CLI-003', rep: 'Carlos Mendes', status: 'em análise', total: 14616.00, items: 168, paymentCondition: '5x sem juros', collection: 'Coleção 2026' },
  { id: 'PED-2026-0409', date: '2026-06-06', client: 'Pé de Pato Bahia', clientId: 'CLI-004', rep: 'Ana Santos', status: 'entregue', total: 5760.00, items: 72, paymentCondition: '3x sem juros', collection: 'Coleção 2026' },
  { id: 'PED-2026-0408', date: '2026-06-05', client: 'Shoestore Norte', clientId: 'CLI-005', rep: 'Marcos Andrade', status: 'cancelado', total: 3840.00, items: 48, paymentCondition: '3x sem juros', collection: 'Coleção 2026' },
  { id: 'PED-2026-0407', date: '2026-06-04', client: 'Fashion Feet SP', clientId: 'CLI-006', rep: 'Fernanda Lima', status: 'entregue', total: 18480.00, items: 210, paymentCondition: '5x sem juros', collection: 'Coleção 2026' },
  { id: 'PED-2026-0406', date: '2026-06-03', client: 'Step Up Calçados', clientId: 'CLI-007', rep: 'Carlos Mendes', status: 'faturado', total: 9180.00, items: 108, paymentCondition: '5x sem juros', collection: 'Coleção 2026' },
  { id: 'PED-2026-0405', date: '2026-06-02', client: 'Andar Bem Gaúcha', clientId: 'CLI-008', rep: 'Ana Santos', status: 'entregue', total: 5120.00, items: 64, paymentCondition: '3x sem juros', collection: 'Coleção 2026' },
];

export const clients: Client[] = [
  { id: 'CLI-001', name: 'Calçadão Paulista LTDA', cnpj: '12.345.678/0001-90', city: 'São Paulo', state: 'SP', region: 'Sudeste', rep: 'Marcos Andrade', lastOrder: '2026-06-09', totalPurchased: 142000, status: 'ativo', avatar: 'CP', policyId: 'TAB-A' },
  { id: 'CLI-002', name: 'Sapataria Mineira', cnpj: '23.456.789/0001-01', city: 'Belo Horizonte', state: 'MG', region: 'Sudeste', rep: 'Fernanda Lima', lastOrder: '2026-06-08', totalPurchased: 76500, status: 'ativo', avatar: 'SM', policyId: 'TAB-B' },
  { id: 'CLI-003', name: 'Mundo dos Sapatos RJ', cnpj: '34.567.890/0001-12', city: 'Rio de Janeiro', state: 'RJ', region: 'Sudeste', rep: 'Carlos Mendes', lastOrder: '2026-06-07', totalPurchased: 196000, status: 'ativo', avatar: 'MS', policyId: 'TAB-A' },
  { id: 'CLI-004', name: 'Pé de Pato Bahia', cnpj: '45.678.901/0001-23', city: 'Salvador', state: 'BA', region: 'Nordeste', rep: 'Ana Santos', lastOrder: '2026-06-06', totalPurchased: 54000, status: 'ativo', avatar: 'PB', policyId: 'TAB-C' },
  { id: 'CLI-005', name: 'Shoestore Norte', cnpj: '56.789.012/0001-34', city: 'Manaus', state: 'AM', region: 'Norte', rep: 'Marcos Andrade', lastOrder: '2026-06-05', totalPurchased: 33400, status: 'em aberto', avatar: 'SN', policyId: 'TAB-C' },
  { id: 'CLI-006', name: 'Fashion Feet SP', cnpj: '67.890.123/0001-45', city: 'Campinas', state: 'SP', region: 'Sudeste', rep: 'Fernanda Lima', lastOrder: '2026-06-04', totalPurchased: 246000, status: 'ativo', avatar: 'FF', policyId: 'TAB-A' },
  { id: 'CLI-007', name: 'Step Up Calçados', cnpj: '78.901.234/0001-56', city: 'Curitiba', state: 'PR', region: 'Sul', rep: 'Carlos Mendes', lastOrder: '2026-06-03', totalPurchased: 123500, status: 'ativo', avatar: 'SU', policyId: 'TAB-B' },
  { id: 'CLI-008', name: 'Andar Bem Gaúcha', cnpj: '89.012.345/0001-67', city: 'Porto Alegre', state: 'RS', region: 'Sul', rep: 'Ana Santos', lastOrder: '2026-06-02', totalPurchased: 70400, status: 'ativo', avatar: 'AB', policyId: 'TAB-B' },
  { id: 'CLI-009', name: 'Passo Certo Campinas', cnpj: '98.765.432/0001-11', city: 'Campinas', state: 'SP', region: 'Sudeste', rep: 'Marcos Andrade', lastOrder: '2026-06-01', totalPurchased: 87000, status: 'ativo', avatar: 'PC', policyId: 'TAB-A' },
  { id: 'CLI-010', name: 'Péquenos do Sul', cnpj: '11.222.333/0001-22', city: 'Florianópolis', state: 'SC', region: 'Sul', rep: 'Marcos Andrade', lastOrder: '2026-05-28', totalPurchased: 45200, status: 'ativo', avatar: 'PS', policyId: 'TAB-B' },
  { id: 'CLI-011', name: 'Caminhos Infantis RJ', cnpj: '22.333.444/0001-33', city: 'Niterói', state: 'RJ', region: 'Sudeste', rep: 'Marcos Andrade', lastOrder: '2026-05-25', totalPurchased: 67800, status: 'em aberto', avatar: 'CI', policyId: 'TAB-A' },
  { id: 'CLI-012', name: 'Pé de Anjo Brasília', cnpj: '33.444.555/0001-44', city: 'Brasília', state: 'DF', region: 'Centro-Oeste', rep: 'Marcos Andrade', lastOrder: '2026-05-20', totalPurchased: 115000, status: 'ativo', avatar: 'PA', policyId: 'TAB-B' },
  { id: 'CLI-013', name: 'Estilo Kids SP', cnpj: '44.555.666/0001-55', city: 'Guarulhos', state: 'SP', region: 'Sudeste', rep: 'Marcos Andrade', lastOrder: '2026-05-18', totalPurchased: 92000, status: 'ativo', avatar: 'EK', policyId: 'TAB-A' },
  { id: 'CLI-014', name: 'Sapatinho de Ouro BH', cnpj: '55.666.777/0001-66', city: 'Contagem', state: 'MG', region: 'Sudeste', rep: 'Marcos Andrade', lastOrder: '2026-05-15', totalPurchased: 38100, status: 'inativo', avatar: 'SO', policyId: 'TAB-C' },
  { id: 'CLI-015', name: 'Mundo Infantil Vitória', cnpj: '66.777.888/0001-77', city: 'Vitória', state: 'ES', region: 'Sudeste', rep: 'Marcos Andrade', lastOrder: '2026-05-10', totalPurchased: 56400, status: 'ativo', avatar: 'MV', policyId: 'TAB-B' },
  { id: 'CLI-016', name: 'Alegria nos Pés PR', cnpj: '77.888.999/0001-88', city: 'Londrina', state: 'PR', region: 'Sul', rep: 'Marcos Andrade', lastOrder: '2026-05-08', totalPurchased: 72300, status: 'ativo', avatar: 'AP', policyId: 'TAB-A' },
];

export const selloutData: SelloutRecord[] = [
  { month: 'Jan', sellIn: 420000, sellOut: 380000, stock: 140000 },
  { month: 'Fev', sellIn: 380000, sellOut: 410000, stock: 110000 },
  { month: 'Mar', sellIn: 510000, sellOut: 480000, stock: 140000 },
  { month: 'Abr', sellIn: 620000, sellOut: 590000, stock: 170000 },
  { month: 'Mai', sellIn: 580000, sellOut: 540000, stock: 210000 },
  { month: 'Jun', sellIn: 490000, sellOut: 460000, stock: 240000 },
];

export const regionData: RegionPerformance[] = [
  { region: 'Sudeste', revenue: 1840000, target: 1600000, growth: 12.4, orders: 284 },
  { region: 'Sul', revenue: 920000, target: 850000, growth: 8.2, orders: 142 },
  { region: 'Nordeste', revenue: 680000, target: 720000, growth: -5.6, orders: 108 },
  { region: 'Centro-Oeste', revenue: 480000, target: 440000, growth: 9.1, orders: 76 },
  { region: 'Norte', revenue: 280000, target: 300000, growth: -6.7, orders: 44 },
];

export const kpiData = {
  totalSellIn: 3000000,
  totalSellOut: 2860000,
  activeClients: 247,
  pendingOrders: 18,
  avgTicket: 8800,
  collectionGiro: 78.4,
  monthlyGrowth: 9.8,
  encalheAlerts: 6,
};

export const topProducts = [
  { name: 'Flow XL Denim', units: 1400, revenue: 125860, growth: 18.2 },
  { name: 'Coil Branco', units: 1200, revenue: 113880, growth: 14.6 },
  { name: 'Flow XL Preto', units: 1100, revenue: 98890, growth: 11.3 },
  { name: 'Flow Preto', units: 1060, revenue: 84694, growth: 8.9 },
  { name: 'Hertz Marrom', units: 920, revenue: 78108, growth: 6.4 },
];

export const repTargets = [
  { name: 'Marcos Andrade', target: 480000, achieved: 524000, clients: 68, orders: 82 },
  { name: 'Fernanda Lima', target: 420000, achieved: 398000, clients: 54, orders: 71 },
  { name: 'Carlos Mendes', target: 390000, achieved: 441000, clients: 62, orders: 79 },
  { name: 'Ana Santos', target: 350000, achieved: 312000, clients: 48, orders: 58 },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};
