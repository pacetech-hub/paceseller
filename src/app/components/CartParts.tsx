import { useState } from "react";
import { Box, Image, Skeleton, Text, type TextProps } from "@mantine/core";
import { PackageIcon } from "@phosphor-icons/react";
import type { Product } from "../data/mockData";
import { pairsOf } from "../data/cartStore";
import { splitBySizeCurve } from "../data/radar";

// Peças pequenas usadas pelas telas do carrinho (página, gaveta de edição, pagamento e conversa).

/** Miniatura do produto: skeleton até a imagem carregar; ícone neutro se a imagem falhar. */
export function ProductThumb({ src, alt, size = 64 }: { src: string; alt: string; size?: number }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <Box w={size} h={size} pos="relative" flex="none" bg="white" style={{ overflow: 'hidden', borderRadius: 'var(--mantine-radius-default)', border: '1px solid var(--mantine-color-default-border)' }}>
      {status === 'loading' && <Skeleton h="100%" style={{ position: 'absolute', inset: 0 }} />}
      {status === 'error' ? (
        <Box h="100%" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}><PackageIcon size={20} color="var(--mantine-color-dimmed)" /></Box>
      ) : (
        <Image src={src} alt={alt} w="100%" h="100%" fit="contain" onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} style={{ opacity: status === 'loaded' ? 1 : 0 }} />
      )}
    </Box>
  );
}

/** Rótulo de seção em caixa alta e monoespaçado ("CONDIÇÃO DE PAGAMENTO"). */
export function Eyebrow({ children, ...props }: TextProps & { children: React.ReactNode }) {
  return <Text fz={12} ff="monospace" tt="uppercase" lts={0.6} c="dimmed" {...props}>{children}</Text>;
}

export const timeAgo = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'agora';
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
};

/** Faixa de numeração da linha (ex.: "36–40"). */
export const sizeRange = (sizes: Record<string, number>) => {
  const n = Object.entries(sizes).filter(([, q]) => q > 0).map(([s]) => Number(s)).sort((x, y) => x - y);
  return n.length === 0 ? '—' : n[0] === n[n.length - 1] ? String(n[0]) : `${n[0]}–${n[n.length - 1]}`;
};

/** Iniciais para o avatar ("Marcos Andrade" → "MA"). */
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

/**
 * Novo total de pares mantendo a proporção da grade atual (maiores restos, sem passar do disponível).
 * Grade vazia: divide pela curva da loja/regional.
 */
export function resizeGrade(product: Product, sizes: Record<string, number>, total: number): Record<string, number> {
  const current = pairsOf(sizes);
  if (total <= 0) return {};
  if (current === 0) return splitBySizeCurve(product, total).sizes;
  const keys = Object.keys(sizes).filter(k => sizes[k] > 0);
  const raw = keys.map(k => ({ k, v: (total * sizes[k]) / current }));
  const next: Record<string, number> = {};
  raw.forEach(({ k, v }) => { next[k] = Math.min(Math.floor(v), product.grades[k] ?? 0); });
  let left = total - pairsOf(next);
  const order = [...raw].sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
  // distribui o que sobrou pelas numerações da grade que ainda têm disponibilidade
  for (let guard = 0; left > 0 && guard < 1000; guard++) {
    const room = order.find(({ k }) => next[k] < (product.grades[k] ?? 0));
    if (!room) break;
    next[room.k] += 1;
    left -= 1;
    order.push(order.splice(order.indexOf(room), 1)[0]);
  }
  return next;
}
