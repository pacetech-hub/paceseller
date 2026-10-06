import { useSyncExternalStore } from "react";

// Contatos exibidos na página Suporte do lojista. A indústria edita o atendimento
// Tesla Footwear; o representante edita os próprios dados ("Seu representante").
// Dados mock e locais: o que for salvo vale para todos os perfis nesta sessão.

export interface SupportContact {
  phone: string;
  email: string;
  hours: string;
}

export interface RepContact {
  name: string;
  role: string;
  region: string;
  phone: string;
  whatsapp: string;
  email: string;
}

interface State {
  support: SupportContact;
  rep: RepContact;
}

let state: State = {
  support: {
    phone: '(11) 3456-7890',
    email: 'suporte@tesla.com.br',
    hours: 'Seg a sex, 8h às 18h',
  },
  rep: {
    name: 'Marina Costa',
    role: 'Representante comercial',
    region: 'Sudeste — SP Capital',
    phone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    email: 'marina.costa@tesla.com.br',
  },
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function saveSupportContact(support: SupportContact) {
  state = { ...state, support };
  emit();
}

export function saveRepContact(rep: RepContact) {
  state = { ...state, rep };
  emit();
}

export function useSupportContacts() {
  return useSyncExternalStore(subscribe, () => state);
}

// ---- helpers de link e validação ----
export const digitsOf = (s: string) => s.replace(/\D/g, '');

/** Número brasileiro em E.164 (DDI 55 quando não informado). */
const toE164 = (s: string) => {
  const d = digitsOf(s);
  return d.length <= 11 ? `55${d}` : d;
};

export const telHref = (phone: string) => `tel:+${toE164(phone)}`;
export const whatsappHref = (phone: string) => `https://wa.me/${toE164(phone)}`;

export const initialsOf = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || '?';

export const isValidPhone = (s: string) => {
  const n = digitsOf(s).length;
  return n >= 10 && n <= 13;
};
export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
