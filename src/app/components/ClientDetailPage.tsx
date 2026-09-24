import { useMemo, useState } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, Badge, ThemeIcon, SimpleGrid, Avatar, Collapse,
  Divider, Progress, AspectRatio, Image, Center, ColorSwatch, Card,
} from "@mantine/core";
import {
  CaretLeftIcon,
  CaretDownIcon,
  MapPinIcon,
  PlusIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ClockIcon,
  EmptyIcon,
  TrendUpIcon,
  HourglassLowIcon,
  ListMagnifyingGlassIcon,
  PackageIcon,
  type Icon,
} from "@phosphor-icons/react";
import classes from "./interactive.module.css";
import detail from "./ClientDetailPage.module.css";
import { formatCurrency, products, type Client, type Product } from "../data/mockData";
import type { View } from "./Sidebar";

interface ClientDetailPageProps {
  client: Client | null;
  onNavigate: (view: View) => void;
  cartCount: number;
}

const statusColors: Record<Client['status'], string> = {
  'ativo': 'teal',
  'inativo': 'red',
};

const badgeStyles = { label: { textTransform: 'none' as const } };

const formatOrderDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// mock: número de pedidos históricos determinístico por cliente, usado para estimar o ticket médio
function seededOrderCount(clientId: string): number {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h * 31 + clientId.charCodeAt(i)) >>> 0;
  return 3 + (h % 8);
}

type StockStatusKey = 'zerado' | 'alto-giro' | 'chegando-ao-fim' | 'parado';

const STOCK_STATUS_CONFIG: Record<StockStatusKey, { label: string; color: string; icon: Icon }> = {
  'zerado': { label: 'Estoque zerado', color: 'red', icon: EmptyIcon },
  'alto-giro': { label: 'Alto giro', color: 'teal', icon: TrendUpIcon },
  'chegando-ao-fim': { label: 'Estoque chegando ao fim', color: 'yellow', icon: HourglassLowIcon },
  'parado': { label: 'Parado no estoque', color: 'gray', icon: ListMagnifyingGlassIcon },
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

  const backButton = (
    <Box>
      <Button
        onClick={() => onNavigate('clients')}
        variant="subtle"
        color="gray"
        size="compact-sm"
        px={4}
        leftSection={<CaretLeftIcon size={16} />}
      >
        Voltar para Clientes
      </Button>
    </Box>
  );

  if (!client) {
    return (
      <Stack gap="md" p="lg" maw={1400} mx="auto">
        {backButton}
        <Text c="dimmed">Nenhum cliente selecionado.</Text>
      </Stack>
    );
  }

  const avgTicket = client.totalPurchased / seededOrderCount(client.id);
  const sizeRanks = sizeRanking(client.id);
  const colorRanks = colorRanking(client.id);
  const typeRanks = typeRanking(client.id);
  const stuckProducts = products.filter(p => stockStatusOf(p) === 'parado');

  return (
    <Stack gap="lg" p="lg" maw={1400} mx="auto">
      {backButton}

      {/* Header */}
      <Paper withBorder radius="lg" p="lg">
        <Group gap="md" wrap="nowrap" miw={0}>
          <Avatar size={56} radius="xl" color="neutral" variant="light" styles={{ placeholder: { fontSize: '1rem', fontWeight: 700 } }}>
            {client.avatar}
          </Avatar>
          <Box miw={0}>
            <Group gap={8} mb={4}>
              <Badge size="sm" variant="light" color={statusColors[client.status]} styles={badgeStyles}>{client.status}</Badge>
              {client.inadimplente && (
                <Badge size="sm" variant="light" color="yellow" styles={badgeStyles}>inadimplente</Badge>
              )}
            </Group>
            <Title order={2} fw={700} mb={4} fz="1.1rem">{client.name}</Title>
            <Group gap={4} c="dimmed">
              <MapPinIcon size={14} />
              <Text size="0.8rem" c="dimmed">{client.city}/{client.state}</Text>
            </Group>
          </Box>
        </Group>

        <Button
          onClick={() => setExpanded(v => !v)}
          variant="transparent"
          color="neutral"
          size="compact-xs"
          px={0}
          mt="sm"
          rightSection={
            <CaretDownIcon size={14} className={detail.caret} data-expanded={expanded || undefined} />
          }
          styles={{ label: { fontSize: '0.78rem', fontWeight: 600 } }}
        >
          {expanded ? 'Ver menos informações' : 'Ver mais informações'}
        </Button>

        <Collapse in={expanded}>
          <Divider mt="sm" />
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" pt="sm">
            {[
              { label: 'Endereço', value: client.address },
              { label: 'CNPJ', value: client.cnpj },
              { label: 'Representante', value: client.rep },
            ].map(info => (
              <Box key={info.label}>
                <Text c="dimmed" size="0.68rem" fw={600}>{info.label}</Text>
                <Text size="0.82rem" fw={600}>{info.value}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Collapse>
      </Paper>

      {/* Último pedido e ticket médio */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Paper withBorder radius="lg" p="md">
          <ThemeIcon variant="light" color="neutral" size={36} radius="md" mb="sm">
            <ClockIcon size={16} />
          </ThemeIcon>
          <Text size="0.85rem" fw={600}>Último pedido</Text>
          <Text className="mono" size="1.05rem" fw={700} mt={2}>{formatOrderDate(client.lastOrder)}</Text>
        </Paper>

        <Paper withBorder radius="lg" p="md">
          <ThemeIcon variant="light" color="neutral" size={36} radius="md" mb="sm">
            <ChartBarIcon size={16} />
          </ThemeIcon>
          <Text size="0.85rem" fw={600}>Ticket médio por pedido</Text>
          <Text className="mono" size="1.05rem" fw={700} mt={2}>{formatCurrency(avgTicket)}</Text>
        </Paper>
      </SimpleGrid>

      {/* Ações de carrinho */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Paper withBorder radius="lg" p="md" component="button" type="button" onClick={() => onNavigate('carts')} className={`${classes.cardButton} ${classes.hoverable}`}>
          <ThemeIcon variant="light" color="neutral" size={36} radius="md" mb="sm">
            <PlusIcon size={16} />
          </ThemeIcon>
          <Text size="0.85rem" fw={600}>Novo carrinho</Text>
          <Text c="dimmed" size="0.75rem" mt={2}>Criar um novo carrinho para este cliente</Text>
        </Paper>

        <Paper withBorder radius="lg" p="md" component="button" type="button" onClick={() => onNavigate('carts')} className={`${classes.cardButton} ${classes.hoverable}`}>
          <ThemeIcon variant="light" color="neutral" size={36} radius="md" mb="sm">
            <ShoppingCartIcon size={16} />
          </ThemeIcon>
          <Group gap={8}>
            <Text size="0.85rem" fw={600}>Carrinhos</Text>
            <Badge size="sm" variant="light" color="neutral" circle>{cartCount}</Badge>
          </Group>
          <Text c="dimmed" size="0.75rem" mt={2}>
            {cartCount === 1 ? 'pedido em aberto sendo criado' : 'pedidos em aberto sendo criados'}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Desempenho de vendas e estoque */}
      <Stack gap="md">
        <Title order={3} fw={600} fz="0.95rem">Desempenho de vendas e estoque</Title>

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
          <RankCard title="Números com mais vendas" items={sizeRanks} />
          <RankCard
            title="Cores com mais vendas"
            items={colorRanks}
            renderLabel={c => (
              <Group gap={6} wrap="nowrap">
                <ColorSwatch color={COLOR_SWATCH[c.key] ?? '#999'} size={10} withShadow={false} bd="1px solid var(--mantine-color-default-border)" />
                {c.label}
              </Group>
            )}
          />
          <RankCard title="Tipo com mais vendas" items={typeRanks} />
        </SimpleGrid>

        <Paper withBorder radius="lg" p="lg">
          <Group gap="sm" mb="sm" wrap="nowrap">
            <ThemeIcon variant="light" color="gray" size={32} radius="md">
              <ListMagnifyingGlassIcon size={16} />
            </ThemeIcon>
            <Box>
              <Title order={4} fw={600} fz="0.85rem">Produtos parados no estoque</Title>
              <Text c="dimmed" size="0.72rem">Baixo giro nos últimos meses — considere oferecer com condição especial</Text>
            </Box>
          </Group>
          <Stack gap={8}>
            {stuckProducts.map(p => (
              <Paper key={p.id} withBorder radius="md" p={10}>
                <Group gap="sm" wrap="nowrap">
                  <ProductThumb src={p.image} alt={p.name} size={40} />
                  <Box miw={0} flex={1}>
                    <Text size="0.82rem" fw={600} truncate>{p.name}</Text>
                    <Text c="dimmed" size="0.7rem" truncate>{p.line} · {p.reference}</Text>
                  </Box>
                  <Box ta="right" flex="none">
                    <Text className="mono" size="0.78rem" fw={700}>{p.soldUnits} un.</Text>
                    <Text c="dimmed" size="0.65rem">vendidas · giro baixo</Text>
                  </Box>
                </Group>
              </Paper>
            ))}
            {stuckProducts.length === 0 && (
              <Text c="dimmed" size="0.8rem" ta="center" py="md">
                Nenhum produto parado no estoque no momento.
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Sugestões de venda */}
      <Paper withBorder radius="lg" p="lg">
        <Title order={3} fw={600} mb="sm" fz="0.95rem">Sugestões de venda</Title>

        <Group gap={6} mb="md">
          <Button
            onClick={() => setStockFilter('todos')}
            size="compact-xs"
            radius="xl"
            variant={stockFilter === 'todos' ? 'filled' : 'light'}
            color={stockFilter === 'todos' ? 'neutral' : 'gray'}
          >
            Todos
          </Button>
          {(Object.keys(STOCK_STATUS_CONFIG) as StockStatusKey[]).map(key => {
            const active = stockFilter === key;
            return (
              <Button
                key={key}
                onClick={() => setStockFilter(key)}
                size="compact-xs"
                radius="xl"
                variant={active ? 'filled' : 'light'}
                color={active ? 'neutral' : STOCK_STATUS_CONFIG[key].color}
              >
                {STOCK_STATUS_CONFIG[key].label}
              </Button>
            );
          })}
        </Group>

        {filteredBuyProducts.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
            {filteredBuyProducts.map(p => (
              <BuyProductCard key={p.id} product={p} onBuy={() => onNavigate('order-grade')} />
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed" size="0.8rem" ta="center" py="lg">
            Nenhum produto encontrado para este filtro.
          </Text>
        )}
      </Paper>
    </Stack>
  );
}

function RankCard({ title, items, renderLabel }: { title: string; items: RankItem[]; renderLabel?: (item: RankItem) => React.ReactNode }) {
  return (
    <Paper withBorder radius="lg" p="lg">
      <Title order={4} fw={600} mb="sm" fz="0.85rem">{title}</Title>
      <Stack gap="sm">
        {items.map(item => (
          <Box key={item.key}>
            <Group justify="space-between" mb={4} wrap="nowrap">
              <Text size="0.8rem" fw={600} component="div">{renderLabel ? renderLabel(item) : item.label}</Text>
              <Text c="dimmed" size="0.7rem" className="mono">{item.pct}%</Text>
            </Group>
            <Progress value={item.pct} size={6} radius="xl" color="neutral" />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function ProductThumb({ src, alt, size }: { src: string; alt: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  // com size: miniatura quadrada com borda; sem size: preenche o container (cartão)
  const cardProps = size
    ? { w: size, h: size, radius: 'md', bd: '1px solid var(--mantine-color-default-border)', flex: 'none' }
    : { w: '100%', h: '100%', radius: 0 };

  return (
    <Card padding={0} bg="white" {...cardProps}>
      {!imgError ? (
        <Image src={src} alt={alt} w="100%" h="100%" fit="cover" onError={() => setImgError(true)} />
      ) : (
        <Center h="100%">
          <PackageIcon size={size ? 16 : 32} color="var(--mantine-color-dimmed)" opacity={0.3} />
        </Center>
      )}
    </Card>
  );
}

function BuyProductCard({ product, onBuy }: { product: Product & { stockStatus: StockStatusKey }; onBuy: () => void }) {
  const cfg = STOCK_STATUS_CONFIG[product.stockStatus];
  const StatusIcon = cfg.icon;

  return (
    <Card withBorder radius="lg" padding={0}>
      <AspectRatio ratio={1}>
        <Box pos="relative">
          <ProductThumb src={product.image} alt={product.name} />
          <Badge
            size="xs"
            variant="light"
            color={cfg.color}
            leftSection={<StatusIcon size={12} />}
            styles={badgeStyles}
            pos="absolute"
            top={8}
            left={8}
          >
            {cfg.label}
          </Badge>
        </Box>
      </AspectRatio>
      <Stack gap={0} p="sm" flex={1}>
        <Text size="0.82rem" fw={600} truncate>{product.name}</Text>
        <Text c="dimmed" size="0.7rem" truncate>{product.line} · {product.reference}</Text>
        <Divider mt={8} color="var(--mantine-color-default-border)" />
        <Group justify="space-between" pt={8}>
          <Text className="mono" size="0.85rem" fw={700}>{formatCurrency(product.price)}</Text>
          <Button onClick={onBuy} size="compact-xs" fz="0.72rem">Comprar</Button>
        </Group>
      </Stack>
    </Card>
  );
}
