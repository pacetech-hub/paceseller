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
  /** Pergunta atual (índice em ONBOARDING_STEPS). */
  step: number;
  /** Quantas perguntas já foram respondidas ou puladas, em ordem. */
  completed: number;
  profile: StoreProfile;
  stockConnected: boolean;
  /** O lojista fechou o aviso do Radar nesta sessão. */
  bannerHidden: boolean;
}

const lojista = clients[0];

/** Uma pergunta por etapa; as opcionais podem ser puladas. A última conecta o estoque. */
export const ONBOARDING_STEPS = [
  { key: 'name', label: 'Nome da loja', required: true },
  { key: 'segment', label: 'Segmento', required: true },
  { key: 'size', label: 'Porte', required: true },
  { key: 'region', label: 'Região', required: true },
  { key: 'audience', label: 'Público', required: false },
  { key: 'differentials', label: 'Diferenciais', required: false },
  { key: 'channel', label: 'Como vende', required: false },
  { key: 'stock', label: 'Estoque', required: false },
] as const;
export type OnboardingStepKey = typeof ONBOARDING_STEPS[number]['key'];
export const LAST_STEP = ONBOARDING_STEPS.length - 1;

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
  completed: 0,
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
/** Salva a resposta da pergunta atual e vai para a próxima. */
export const answerStep = (patch: Partial<StoreProfile>) => {
  const next = Math.min(state.step + 1, LAST_STEP);
  set({ profile: { ...state.profile, ...patch }, completed: Math.max(state.completed, state.step + 1), step: next });
};
/** Só volta para perguntas já vistas (ou a próxima depois da última respondida). */
export const goToStep = (step: number) => { if (step >= 0 && step <= Math.min(state.completed, LAST_STEP)) set({ step }); };
export const setStockConnected = (stockConnected: boolean) => set({ stockConnected });
export const finishOnboarding = () => set({ status: 'concluido', open: false, completed: ONBOARDING_STEPS.length });
export const skipOnboarding = () => set({ status: 'pulado', open: false, bannerHidden: false });
/** Retoma pelo aviso do Radar, na primeira etapa que falta. */
export const resumeOnboarding = () => set({ open: true, step: Math.min(state.completed, LAST_STEP) });
export const hideOnboardingBanner = () => set({ bannerHidden: true });

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useOnboarding = () => useSyncExternalStore(subscribe, () => state);
