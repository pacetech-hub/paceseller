import { useSyncExternalStore } from "react";
import { clients } from "./mockData";

// Configuração inicial do lojista: perfil da loja (alimenta o Radar e a curva de tamanhos) e
// a integração do estoque via Pace Stock. Mock em memória: recomeça a cada sessão do protótipo.

export interface StoreProfile {
  name: string;
  segment: string | null;
  size: string | null;
  region: string | null;
  audience: string[];
  differentials: string[];
  channel: string | null;
}

export type OnboardingStatus = 'pendente' | 'pulado' | 'concluido';

export interface OnboardingState {
  status: OnboardingStatus;
  /** A tela de configuração está aberta (no primeiro acesso, ou retomada pelo aviso do Radar). */
  open: boolean;
  /** Etapa atual: 0 = perfil da loja, 1 = integração de dados. */
  step: 0 | 1;
  /** Perfil salvo (a etapa 1 foi concluída). */
  profileSaved: boolean;
  profile: StoreProfile;
  stockConnected: boolean;
  /** O lojista fechou o aviso do Radar nesta sessão. */
  bannerHidden: boolean;
}

const lojista = clients[0];

export const SEGMENTS = ['Streetwear', 'Casual', 'Esportivo', 'Feminino', 'Infantil'];
export const STORE_SIZES = ['Pequena', 'Média', 'Grande'];
export const REGIONS = [
  'São Paulo, SP · Rua de comércio',
  'São Paulo, SP · Shopping',
  'Campinas, SP · Rua de comércio',
  'Rio de Janeiro, RJ · Centro',
  'Belo Horizonte, MG · Shopping',
  'Porto Alegre, RS · Rua de comércio',
  'Curitiba, PR · Shopping',
];
export const AUDIENCES = ['Jovem adulto', 'Teen', 'Adulto', 'Família'];
export const DIFFERENTIALS = ['Atendimento especializado', 'Preço competitivo', 'Variedade de marcas', 'Localização', 'Presença digital forte'];
export const CHANNELS = ['Só loja física', 'Loja física + redes sociais', 'Loja física + e-commerce próprio', 'Também vendo em marketplace'];

let state: OnboardingState = {
  status: 'pendente',
  open: false,
  step: 0,
  profileSaved: false,
  profile: {
    name: lojista.name.replace(/\s+LTDA$/i, ''),
    segment: null,
    size: null,
    region: REGIONS[0],
    audience: [],
    differentials: [],
    channel: null,
  },
  stockConnected: false,
  bannerHidden: false,
};

const listeners = new Set<() => void>();
const set = (patch: Partial<OnboardingState>) => {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
};

/** No login do lojista: abre a configuração enquanto ela não foi feita nem pulada. */
export const openOnLogin = () => { if (state.status === 'pendente') set({ open: true, step: 0 }); };
export const saveProfile = (profile: StoreProfile) => set({ profile, profileSaved: true, step: 1 });
export const goToStep = (step: 0 | 1) => set({ step });
export const setStockConnected = (stockConnected: boolean) => set({ stockConnected });
export const finishOnboarding = () => set({ status: 'concluido', open: false });
export const skipOnboarding = () => set({ status: 'pulado', open: false, bannerHidden: false });
/** Retoma pelo aviso do Radar, na primeira etapa que falta. */
export const resumeOnboarding = () => set({ open: true, step: state.profileSaved ? 1 : 0 });
export const hideOnboardingBanner = () => set({ bannerHidden: true });

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useOnboarding = () => useSyncExternalStore(subscribe, () => state);
