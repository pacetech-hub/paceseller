import { useMemo, useState } from "react";
import { Badge, Box, Button, Center, Group, Paper, Progress, SimpleGrid, Stack, Text, Title, UnstyledButton } from "@mantine/core";
import {
  ChevronLeft, ChevronDown, MapPin, Plus, ShoppingCart, BarChart3, Clock, PackageX, TrendingUp, PackageMinus, PackageSearch, Package2,
} from "lucide-react";
import { formatCurrency, products, type Client, type Product } from "../data/mockData";
import type { View } from "./Sidebar";
import classes from "./ClientDetailPage.module.css";

interface ClientDetailPageProps {
  client: Client | null;
  onNavigate: (view: View) => void;
  cartCount: number;
}

// cor Mantine do badge de status do cliente
const statusColors: Record<Client['status'], string> = {
  'ativo': 'teal',
  'inativo': 'red',
};

const formatOrderDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// mock: número de pedidos históricos determinístico por cliente, usado para estimar o ticket médio
function seededOrderCount(clientId: string): number {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h * 31 + clientId.charCodeAt(i)) >>> 0;
  return 3 + (h % 8);
}

type StockStatusKey = 'zerado' | 'alto-giro' | 'chegando-ao-fim' | 'parado';

// c = cor do texto, bg = cor de fundo (tokens Mantine)
const STOCK_STATUS_CONFIG: Record<StockStatusKey, { label: string; c: string; bg: string; icon: any }> = {
  'zerado': { label: 'Estoque zerado', c: 'var(--mantine-color-red-7)', bg: 'var(--mantine-color-red-0)', icon: PackageX },
  'alto-giro': { label: 'Alto giro', c: 'var(--mantine-color-teal-7)', bg: 'var(--mantine-color-teal-0)', icon: TrendingUp },
  'chegando-ao-fim': { label: 'Estoque chegando ao fim', c: 'var(--mantine-color-yellow-7)', bg: 'var(--mantine-color-yellow-0)', icon: PackageMinus },
  'parado': { label: 'Parado no estoque', c: 'var(--mantine-color-dimmed)', bg: 'var(--mantine-color-gray-1)', icon: PackageSearch },
};

// mock: classificação determinística do status de estoque por produto
function stockStatusOf(p: Product): StockStatusKey {
  if (p.availability === 'esgotado') return 'zerado';
  if (p.availability === 'baixo estoque') return 'chegando-ao-fim';
  if (p.soldUnits < 600) return 'zerado';
  if (p.soldUnits < 900) return 'parado';
  return 'alto-giro';
}

function seededScore(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

type RankItem = { key: string; label: string; sub?: string; pct: number };

const PRODUCT_COLORS = Array.from(new Set(products.flatMap(p => p.colors)));
const PRODUCT_LINES = Array.from(new Set(products.map(p => p.line)));

const COLOR_SWATCH: Record<string, string> = {
  'Denim': '#4a6fa5',
  'Azul': '#2563eb',
  'Branco': '#f5f5f5',
  'Vermelho': '#ef4444',
  'Marrom': '#7c4a2d',
  'Preto': '#111111',
  'Navy': '#1e3a5f',
};

// curva de participação por posição no ranking (top 5), soma 100
const RANK_DECAY = [34, 24, 18, 14, 10];

// mock: ranking determinístico de números (tamanhos) mais vendidos para este cliente
function sizeRanking(clientId: string): RankItem[] {
  const sizes = Object.keys(products[0].grades);
  return sizes
    .map(size => ({ size, raw: seededScore(`${clientId}-size-${size}`) }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 5)
    .map((x, i) => ({ key: x.size, label: `Nº ${x.size}`, pct: RANK_DECAY[i] }));
}

// mock: ranking determinístico de cores mais vendidas para este cliente
function colorRanking(clientId: string): RankItem[] {
  return PRODUCT_COLORS
    .map(color => ({ color, raw: seededScore(`${clientId}-color-${color}`) }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 5)
    .map((x, i) => ({ key: x.color, label: x.color, pct: RANK_DECAY[i] }));
}

// mock: ranking determinístico de tipos (linhas) mais vendidos para este cliente
function typeRanking(clientId: string): RankItem[] {
  return PRODUCT_LINES
    .map(line => ({ line, raw: seededScore(`${clientId}-line-${line}`) }))
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 5)
    .map((x, i) => ({ key: x.line, label: x.line, pct: RANK_DECAY[i] }));
}

export function ClientDetailPage({ client, onNavigate, cartCount }: ClientDetailPageProps) {
  const [expanded, setExpanded] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockStatusKey | 'todos'>('todos');

  const buyProducts = useMemo(
    () => products.map(p => ({ ...p, stockStatus: stockStatusOf(p) })),
    []
  );
  const filteredBuyProducts = stockFilter === 'todos' ? buyProducts : buyProducts.filter(p => p.stockStatus === stockFilter);

  if (!client) {
    return (
      <Stack gap="md" p="lg" maw={1400} mx="auto">
        <Box>
          <UnstyledButton onClick={() => onNavigate('clients')} className={classes.backLink}>
            <ChevronLeft size={16} /> Voltar para Clientes
          </UnstyledButton>
        </Box>
        <Text c="dimmed">Nenhum cliente selecionado.</Text>
      </Stack>
    );
  }

  const avgTicket = client.totalPurchased / seededOrderCount(client.id);
  const sizeRanks = sizeRanking(client.id);
  const colorRanks = colorRanking(client.id);
  const typeRanks = typeRanking(client.id);
  const stuckProducts = products.filter(p => stockStatusOf(p) === 'parado');

  const pillBadge = {
    variant: 'light' as const,
    radius: 'xl' as const,
    tt: 'none' as const,
    h: 'auto',
    px: 8,
    py: 2,
    fz: '0.7rem',
    fw: 600,
  };

  return (
    <Stack gap={20} p="lg" maw={1400} mx="auto">
      <Box>
        <UnstyledButton onClick={() => onNavigate('clients')} className={classes.backLink}>
          <ChevronLeft size={16} /> Voltar para Clientes
        </UnstyledButton>
      </Box>

      {/* Header */}
      <Paper withBorder radius="lg" p={20}>
        <Group gap="md" wrap="nowrap" miw={0}>
          <Center w={56} h={56} bg="gray.2" style={{ borderRadius: '50%', flexShrink: 0 }}>
            <Text span c="gray.9" size="1rem" fw={700}>{client.avatar}</Text>
          </Center>
          <Box miw={0}>
            <Group gap={8} mb={4}>
              <Badge {...pillBadge} color={statusColors[client.status]}>
                {client.status}
              </Badge>
              {client.inadimplente && (
                <Badge {...pillBadge} color="yellow">
                  inadimplente
                </Badge>
              )}
            </Group>
            <Title order={2} mb={4} size="1.1rem" fw={700}>{client.name}</Title>
            <Group gap={4} wrap="nowrap">
              <MapPin size={14} color="var(--mantine-color-dimmed)" />
              <Text c="dimmed" size="0.8rem">{client.city}/{client.state}</Text>
            </Group>
          </Box>
        </Group>

        <UnstyledButton
          onClick={() => setExpanded(v => !v)}
          mt="sm"
          c="gray.9"
          fz="0.78rem"
          fw={600}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {expanded ? 'Ver menos informações' : 'Ver mais informações'}
          <ChevronDown size={14} style={{ transition: 'transform 150ms ease', transform: expanded ? 'rotate(180deg)' : undefined }} />
        </UnstyledButton>

        {expanded && (
          <SimpleGrid
            cols={{ base: 1, sm: 3 }}
            spacing="md"
            mt="sm"
            pt="sm"
            style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}
          >
            <div>
              <Text c="dimmed" size="0.68rem" fw={600}>Endereço</Text>
              <Text size="0.82rem" fw={600}>{client.address}</Text>
            </div>
            <div>
              <Text c="dimmed" size="0.68rem" fw={600}>CNPJ</Text>
              <Text size="0.82rem" fw={600}>{client.cnpj}</Text>
            </div>
            <div>
              <Text c="dimmed" size="0.68rem" fw={600}>Representante</Text>
              <Text size="0.82rem" fw={600}>{client.rep}</Text>
            </div>
          </SimpleGrid>
        )}
      </Paper>

      {/* Último pedido e ticket médio */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Paper withBorder radius="lg" p="md">
          <Center w={36} h={36} bg="gray.1" mb="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
            <Clock size={16} color="var(--mantine-color-gray-9)" />
          </Center>
          <Text size="0.85rem" fw={600}>Último pedido</Text>
          <Text mt={2} size="1.05rem" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatOrderDate(client.lastOrder)}</Text>
        </Paper>

        <Paper withBorder radius="lg" p="md">
          <Center w={36} h={36} bg="gray.1" mb="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
            <BarChart3 size={16} color="var(--mantine-color-gray-9)" />
          </Center>
          <Text size="0.85rem" fw={600}>Ticket médio por pedido</Text>
          <Text mt={2} size="1.05rem" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(avgTicket)}</Text>
        </Paper>
      </SimpleGrid>

      {/* Ações de carrinho */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <UnstyledButton onClick={() => onNavigate('carts')} className={classes.actionCard}>
          <div className={classes.actionIcon}>
            <Plus size={16} color="var(--mantine-color-gray-9)" />
          </div>
          <Text size="0.85rem" fw={600}>Novo carrinho</Text>
          <Text c="dimmed" mt={2} size="0.75rem">Criar um novo carrinho para este cliente</Text>
        </UnstyledButton>

        <UnstyledButton onClick={() => onNavigate('carts')} className={classes.actionCard}>
          <div className={classes.actionIcon}>
            <ShoppingCart size={16} color="var(--mantine-color-gray-9)" />
          </div>
          <Group gap={8}>
            <Text size="0.85rem" fw={600}>Carrinhos</Text>
            <Badge variant="light" color="gray" c="gray.9" bg="gray.2" radius="xl" tt="none" h="auto" px={6} py={2} fz="0.68rem" fw={700}>{cartCount}</Badge>
          </Group>
          <Text c="dimmed" mt={2} size="0.75rem">
            {cartCount === 1 ? 'pedido em aberto sendo criado' : 'pedidos em aberto sendo criados'}
          </Text>
        </UnstyledButton>
      </SimpleGrid>

      {/* Desempenho de vendas e estoque */}
      <Stack gap="md">
        <Title order={3} size="0.95rem" fw={600}>Desempenho de vendas e estoque</Title>

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
          <Paper withBorder radius="lg" p={20}>
            <Title order={4} mb="sm" size="0.85rem" fw={600}>Números com mais vendas</Title>
            <Stack gap="sm">
              {sizeRanks.map(s => (
                <div key={s.key}>
                  <Group justify="space-between" mb={4} wrap="nowrap">
                    <Text span size="0.8rem" fw={600}>{s.label}</Text>
                    <Text span c="dimmed" size="0.7rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.pct}%</Text>
                  </Group>
                  <Progress value={s.pct} size={6} radius="xl" color="gray.9" bg="gray.1" />
                </div>
              ))}
            </Stack>
          </Paper>

          <Paper withBorder radius="lg" p={20}>
            <Title order={4} mb="sm" size="0.85rem" fw={600}>Cores com mais vendas</Title>
            <Stack gap="sm">
              {colorRanks.map(c => (
                <div key={c.key}>
                  <Group justify="space-between" mb={4} wrap="nowrap">
                    <Group gap={6} wrap="nowrap">
                      <Box
                        w={10}
                        h={10}
                        style={{ borderRadius: '50%', border: '1px solid var(--mantine-color-gray-2)', flexShrink: 0, background: COLOR_SWATCH[c.key] ?? '#999' }}
                      />
                      <Text span size="0.8rem" fw={600}>{c.label}</Text>
                    </Group>
                    <Text span c="dimmed" size="0.7rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{c.pct}%</Text>
                  </Group>
                  <Progress value={c.pct} size={6} radius="xl" color="gray.9" bg="gray.1" />
                </div>
              ))}
            </Stack>
          </Paper>

          <Paper withBorder radius="lg" p={20}>
            <Title order={4} mb="sm" size="0.85rem" fw={600}>Tipo com mais vendas</Title>
            <Stack gap="sm">
              {typeRanks.map(t => (
                <div key={t.key}>
                  <Group justify="space-between" mb={4} wrap="nowrap">
                    <Text span size="0.8rem" fw={600}>{t.label}</Text>
                    <Text span c="dimmed" size="0.7rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.pct}%</Text>
                  </Group>
                  <Progress value={t.pct} size={6} radius="xl" color="gray.9" bg="gray.1" />
                </div>
              ))}
            </Stack>
          </Paper>
        </SimpleGrid>

        <Paper withBorder radius="lg" p={20}>
          <Group gap={10} mb="sm" wrap="nowrap">
            <Center w={32} h={32} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}>
              <PackageSearch size={16} color="var(--mantine-color-dimmed)" />
            </Center>
            <div>
              <Title order={4} size="0.85rem" fw={600}>Produtos parados no estoque</Title>
              <Text c="dimmed" size="0.72rem">Baixo giro nos últimos meses — considere oferecer com condição especial</Text>
            </div>
          </Group>
          <Stack gap={8}>
            {stuckProducts.map(p => (
              <Group
                key={p.id}
                gap="sm"
                wrap="nowrap"
                p={10}
                style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-2)' }}
              >
                <ProductThumb src={p.image} alt={p.name} w={40} h={40} radius="var(--mantine-radius-md)" iconSize={16} />
                <Box miw={0} flex={1}>
                  <Text truncate size="0.82rem" fw={600}>{p.name}</Text>
                  <Text c="dimmed" truncate size="0.7rem">{p.line} · {p.reference}</Text>
                </Box>
                <Box ta="right" style={{ flexShrink: 0 }}>
                  <Text size="0.78rem" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{p.soldUnits} un.</Text>
                  <Text c="dimmed" size="0.65rem">vendidas · giro baixo</Text>
                </Box>
              </Group>
            ))}
            {stuckProducts.length === 0 && (
              <Text c="dimmed" ta="center" py="md" size="0.8rem">
                Nenhum produto parado no estoque no momento.
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Sugestões de venda */}
      <Paper withBorder radius="lg" p={20}>
        <Group justify="space-between" gap={8} mb="sm">
          <Title order={3} size="0.95rem" fw={600}>Sugestões de venda</Title>
        </Group>

        <Group gap={6} mb="md">
          <UnstyledButton
            onClick={() => setStockFilter('todos')}
            className={classes.pill}
            data-variant="muted"
            data-active={stockFilter === 'todos' || undefined}
          >
            Todos
          </UnstyledButton>
          {(Object.keys(STOCK_STATUS_CONFIG) as StockStatusKey[]).map(key => {
            const cfg = STOCK_STATUS_CONFIG[key];
            const active = stockFilter === key;
            return (
              <UnstyledButton
                key={key}
                onClick={() => setStockFilter(key)}
                className={classes.pill}
                data-variant="tone"
                data-active={active || undefined}
                style={active ? undefined : { color: cfg.c, backgroundColor: cfg.bg }}
              >
                {cfg.label}
              </UnstyledButton>
            );
          })}
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
          {filteredBuyProducts.map(p => (
            <BuyProductCard key={p.id} product={p} onBuy={() => onNavigate('order-grade')} />
          ))}
          {filteredBuyProducts.length === 0 && (
            <Text c="dimmed" ta="center" py="lg" size="0.8rem" style={{ gridColumn: '1 / -1' }}>
              Nenhum produto encontrado para este filtro.
            </Text>
          )}
        </SimpleGrid>
      </Paper>
    </Stack>
  );
}

function ProductThumb({ src, alt, w, h, radius, iconSize = 32, bordered = true }: { src: string; alt: string; w: number | string; h: number | string; radius?: string; iconSize?: number; bordered?: boolean }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Box
      w={w}
      h={h}
      bg="white"
      style={{
        overflow: 'hidden',
        flexShrink: 0,
        borderRadius: radius,
        border: bordered ? '1px solid var(--mantine-color-gray-2)' : undefined,
      }}
    >
      {!imgError ? (
        <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
      ) : (
        <Center w="100%" h="100%">
          <Package2 size={iconSize} color="var(--mantine-color-gray-4)" />
        </Center>
      )}
    </Box>
  );
}

function BuyProductCard({ product, onBuy }: { product: Product & { stockStatus: StockStatusKey }; onBuy: () => void }) {
  const cfg = STOCK_STATUS_CONFIG[product.stockStatus];
  const Icon = cfg.icon;

  return (
    <Paper withBorder radius="lg" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Box pos="relative" style={{ aspectRatio: '1 / 1' }}>
        <ProductThumb src={product.image} alt={product.name} w="100%" h="100%" iconSize={32} bordered={false} />
        <Group
          gap={4}
          wrap="nowrap"
          pos="absolute"
          top={8}
          left={8}
          px={6}
          py={2}
          fz="0.62rem"
          fw={700}
          style={{ borderRadius: 9999, color: cfg.c, backgroundColor: cfg.bg }}
        >
          <Icon size={12} /> {cfg.label}
        </Group>
      </Box>
      <Stack gap={0} p="sm" flex={1}>
        <Text truncate size="0.82rem" fw={600}>{product.name}</Text>
        <Text c="dimmed" truncate size="0.7rem">{product.line} · {product.reference}</Text>
        <Group justify="space-between" wrap="nowrap" mt={8} pt={8} style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Text span size="0.85rem" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(product.price)}</Text>
          <Button onClick={onBuy} size="compact-sm" px={10} fz="0.72rem" fw={600}>
            Comprar
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
