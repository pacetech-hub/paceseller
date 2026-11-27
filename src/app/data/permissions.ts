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
      'Pedidos (criar)': true, 'Pedidos (aprovar)': true, 'Marketing': true,
      'Sell-out': true, 'Campanhas comerciais': true, 'Políticas': true, 'Administração': true,
    },
    'Analista': {
      'Dashboard': true, 'Catálogo (ver)': true, 'Catálogo (editar)': false,
      'Pedidos (criar)': true, 'Pedidos (aprovar)': false, 'Marketing': false,
      'Sell-out': true, 'Campanhas comerciais': false, 'Políticas': false, 'Administração': false,
    },
  },
  representante: {
    'Representante': {
      'Indicadores': true, 'Catálogo': true, 'Pedido por grade': true,
      'Sell-out': true, 'Marketing': true, 'Histórico de pedidos': true,
    },
    'Preposto': {
      'Indicadores': false, 'Catálogo': true, 'Pedido por grade': true,
      'Sell-out': false, 'Marketing': false, 'Histórico de pedidos': true,
    },
  },
  lojista: {
    'Lojista': {
      'Catálogo': true, 'Carrinho / Pedidos': true, 'Marketing': true,
      'Meu estoque': true, 'Histórico de pedidos': true,
    },
    'Comprador': {
      'Catálogo': true, 'Carrinho / Pedidos': true, 'Marketing': false,
      'Meu estoque': false, 'Histórico de pedidos': false,
    },
  },
};
