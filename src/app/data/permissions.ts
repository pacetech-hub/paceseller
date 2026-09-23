import { BuildingsIcon, BriefcaseIcon, StorefrontIcon } from "@phosphor-icons/react";

export type VisaoKey = 'industria' | 'representante' | 'lojista';
export type PermissionsState = Record<VisaoKey, Record<string, Record<string, boolean>>>;

export const visoes: { id: VisaoKey; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'industria', label: 'Indústria', icon: BuildingsIcon, desc: 'Usuários internos da Tesla Footwear' },
  { id: 'representante', label: 'Representante', icon: BriefcaseIcon, desc: 'Representantes comerciais externos' },
  { id: 'lojista', label: 'Lojista', icon: StorefrontIcon, desc: 'Clientes lojistas da rede' },
];

export const profileDescriptions: Record<string, string> = {
  'Admin': 'Acesso completo a todos os módulos da plataforma',
  'Analista': 'Acesso focado em vendas e análise de desempenho',
  'Representante': 'Acesso completo à visão de representante',
  'Preposto': 'Acesso restrito ao módulo de vendas, sem indicadores',
  'Lojista': 'Acesso completo à visão de lojista',
  'Comprador': 'Acesso restrito a catálogo e realização de pedidos',
};

export const defaultPermissions: PermissionsState = {
  industria: {
    'Admin': {
      'Dashboard': true, 'Catálogo (ver)': true, 'Catálogo (editar)': true,
      'Pedidos (criar)': true, 'Pedidos (aprovar)': true, 'Marketing IA': true,
      'Sell-out': true, 'Campanhas Comerciais': true, 'Políticas': true, 'Administração': true,
    },
    'Analista': {
      'Dashboard': true, 'Catálogo (ver)': true, 'Catálogo (editar)': false,
      'Pedidos (criar)': true, 'Pedidos (aprovar)': false, 'Marketing IA': false,
      'Sell-out': true, 'Campanhas Comerciais': false, 'Políticas': false, 'Administração': false,
    },
  },
  representante: {
    'Representante': {
      'Indicadores': true, 'Catálogo': true, 'Pedido por Grade': true,
      'Sell-out': true, 'Marketing IA': true, 'Histórico de Pedidos': true,
    },
    'Preposto': {
      'Indicadores': false, 'Catálogo': true, 'Pedido por Grade': true,
      'Sell-out': false, 'Marketing IA': false, 'Histórico de Pedidos': true,
    },
  },
  lojista: {
    'Lojista': {
      'Catálogo': true, 'Carrinho / Pedidos': true, 'Marketing IA': true,
      'Meu Estoque': true, 'Histórico de Pedidos': true,
    },
    'Comprador': {
      'Catálogo': true, 'Carrinho / Pedidos': true, 'Marketing IA': false,
      'Meu Estoque': false, 'Histórico de Pedidos': false,
    },
  },
};
