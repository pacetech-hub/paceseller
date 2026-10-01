import { useMemo, useState } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, Badge, ThemeIcon, SimpleGrid, Avatar, Collapse,
  Divider, Progress, AspectRatio, Image, Center, ColorSwatch, Card, Skeleton,
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
  ArrowRightIcon,
  UsersIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import classes from "./interactive.module.css";
import detail from "./ClientDetailPage.module.css";
import { formatCurrency, formatDate, products, type Client, type Product } from "../data/mockData";
import type { View } from "./Sidebar";
import { useMockLoading } from "../lib/useMockLoading";
import { CardGridSkeleton, KpiSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";

interface ClientDetailPageProps {
  client: Client | null;
  onNavigate: (view: View) => void;
  cartCount: number;
}

const statusColors: Record<Client['status'], string> = {
  'ativo': 'teal',
  'inativo': 'red',
};

// datas no formato pt-BR por extenso curto ("16 de jun. de 2026")
const formatOrderDate = formatDate;

// mock: número de pedidos históricos determinístico por cliente, usado para estimar o ticket médio
function seededOrderCount(clientId: string): number {
  let h = 0;
  for (let i = 0; i < clientId.length; i++) h = (h * 31 + clientId.charCodeAt(i)) >>> 0;
  return 3 + (h % 8);
}

// mock: contatos do cliente (o cadastro ainda não traz e-mail/telefone); alguns ficam vazios de propósito
function mockContacts(client: Client): { email: string; phone: string } {
  const h = Math.round(seededScore(`${client.id}-contato`) * 1000);
  const slug = client.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '').slice(0, 16);
  return {
    email: h % 3 === 0 ? '' : `compras@${slug}.com.br`,
    phone: h % 4 === 1 ? '' : `(11) 9${String(1000 + (h % 9000)).padStart(4, '0')}-${String(1000 + ((h * 7) % 9000)).padStart(4, '0')}`,
  };
}

type StockStatusKey = 'zerado' | 'alto-giro' | 'chegando-ao-fim' | 'parado';

// label: badge e textos (sentence case); filterLabel: botão de filtro (Title Case)
const STOCK_STATUS_CONFIG: Record<StockStatusKey, { label: string; filterLabel: string; color: string; icon: Icon }> = {
  'zerado': { label: 'Estoque zerado', filterLabel: 'Estoque Zerado', color: 'red', icon: EmptyIcon },
  'alto-giro': { label: 'Alto giro', filterLabel: 'Alto Giro', color: 'teal', icon: TrendUpIcon },
  'chegando-ao-fim': { label: 'Estoque chegando ao fim', filterLabel: 'Estoque Chegando ao Fim', color: 'yellow', icon: HourglassLowIcon },
  'parado': { label: 'Parado no estoque', filterLabel: 'Parado no Estoque', color: 'gray', icon: ListMagnifyingGlassIcon },
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
  const loading = useMockLoading();

  const buyProducts = useMemo(
    () => products.map(p => ({ ...p, stockStatus: stockStatusOf(p) })),
    []
  );
  const filteredBuyProducts = stockFilter === 'todos' ? buyProducts : buyProducts.filter(p => p.stockStatus === stockFilter);

  // pré-filtra as sugestões de venda por alto giro e rola até elas
  const showHighTurnover = () => {
    setStockFilter('alto-giro');
    document.getElementById('sugestoes-de-venda')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const backButton = (
    <Box>
      <Button
        onClick={() => onNavigate('clients')}
        variant="subtle"
        color="gray"
        ml={-12}
        leftSection={<CaretLeftIcon size={16} />}
      >
        Voltar para Clientes
      </Button>
    </Box>
  );

  if (!client) {
    return (
      <Stack gap="md" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto">
        {backButton}
        <EmptyState
          icon={UsersIcon}
          title="Nenhum cliente selecionado"
          description="Escolha um cliente na lista para ver dados cadastrais, desempenho e sugestões de venda."
          action={{ label: 'Ver Lista de Clientes', onClick: () => onNavigate('clients') }}
          suggestions={[
            { label: 'Montar carrinho', description: 'Abra os carrinhos em andamento ou crie um novo', icon: ShoppingCartIcon, onClick: () => onNavigate('carts') },
            { label: 'Ver catálogo', description: 'Confira lançamentos e mais vendidos da coleção', icon: PackageIcon, onClick: () => onNavigate('catalog') },
          ]}
        />
      </Stack>
    );
  }

  // Skeleton com o formato da página: cabeçalho, indicadores, rankings e grade de sugestões
  if (loading) {
    return (
      <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" aria-busy="true" aria-label="Carregando cliente">
        {backButton}
        <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
          <Group gap="md" wrap="nowrap">
            <Skeleton height={56} width={56} circle />
            <Stack gap="xs" flex={1}>
              <Skeleton height={16} width={120} />
              <Skeleton height={28} width="50%" />
              <Skeleton height={12} width={160} />
            </Stack>
          </Group>
        </Paper>
        <KpiSkeleton count={4} cols={{ base: 1, sm: 2 }} />
        <KpiSkeleton count={3} cols={{ base: 1, lg: 3 }} />
        <CardGridSkeleton count={8} cols={{ base: 2, sm: 3, lg: 4 }} />
      </Stack>
    );
  }

  const avgTicket = client.totalPurchased / seededOrderCount(client.id);
  const sizeRanks = sizeRanking(client.id);
  const colorRanks = colorRanking(client.id);
  const typeRanks = typeRanking(client.id);
  const stuckProducts = products.filter(p => stockStatusOf(p) === 'parado');
  const contacts = mockContacts(client);
  const registrationFields = [
    { label: 'Endereço', value: client.address },
    { label: 'CNPJ', value: client.cnpj },
    { label: 'Representante', value: client.rep },
    { label: 'E-mail', value: contacts.email },
    { label: 'Telefone', value: contacts.phone },
  ];
  const missingFields = registrationFields.filter(f => !f.value.trim());

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto">
      {backButton}

      {/* Header */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
        <Group gap="md" wrap="nowrap" miw={0}>
          <Avatar size={56} color="neutral" variant="light" styles={{ placeholder: { fontWeight: 700 } }}>
            {client.avatar}
          </Avatar>
          <Box miw={0}>
            <Group gap="xs" mb={4}>
              <Badge variant="light" color={statusColors[client.status]}>{client.status}</Badge>
              {client.inadimplente && (
                <Badge variant="light" color="yellow">inadimplente</Badge>
              )}
            </Group>
            <Title order={1} fw={700} mb={4}>{client.name}</Title>
            <Group gap={4} c="dimmed">
              <MapPinIcon size={14} />
              <Text size="sm" c="dimmed">{client.city}/{client.state}</Text>
            </Group>
          </Box>
        </Group>

        {/* Cabeçalho do bloco mostra, mesmo fechado, se o cadastro está completo */}
        <Group gap="sm" mt="sm" wrap="wrap">
          <Button
            onClick={() => setExpanded(v => !v)}
            variant="subtle"
            color="neutral"
            ml={-12}
            aria-expanded={expanded}
            rightSection={
              <CaretDownIcon size={14} className={detail.caret} data-expanded={expanded || undefined} />
            }
          >
            {expanded ? 'Ocultar Dados Cadastrais' : 'Mostrar Dados Cadastrais'}
          </Button>
          {missingFields.length === 0 ? (
            <Group gap="xs" wrap="nowrap">
              <CheckCircleIcon size={16} color="var(--mantine-color-teal-6)" />
              <Text size="sm" c="teal.7">Completo</Text>
            </Group>
          ) : (
            <Group gap="xs" wrap="nowrap">
              <WarningCircleIcon size={16} color="var(--mantine-color-red-6)" />
              <Text size="sm" c="red.7">
                {missingFields.length === 1 ? '1 campo precisa de atenção' : `${missingFields.length} campos precisam de atenção`}
                {': '}{missingFields.map(f => f.label).join(', ')} não informado{missingFields.length > 1 ? 's' : ''}
              </Text>
            </Group>
          )}
        </Group>

        <Collapse in={expanded}>
          <Divider mt="sm" />
          {/* Uma coluna, rótulo acima do valor, alinhado à esquerda */}
          <Stack gap="md" pt="sm">
            {registrationFields.map(info => (
              <Box key={info.label}>
                <Text c="dimmed" size="sm">{info.label}</Text>
                {info.value.trim() ? (
                  <Text>{info.value}</Text>
                ) : (
                  <Group gap="xs" wrap="nowrap">
                    <WarningCircleIcon size={16} color="var(--mantine-color-red-6)" />
                    <Text c="red.7">Não informado</Text>
                  </Group>
                )}
              </Box>
            ))}
          </Stack>
        </Collapse>
      </Paper>

      {/* Último pedido e ticket médio */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Paper withBorder p="md">
          <ThemeIcon variant="light" color="neutral" size={36} mb="sm">
            <ClockIcon size={16} />
          </ThemeIcon>
          <Text c="dimmed" size="sm">Último pedido</Text>
          <Text className="mono" size="xl" fw={700} mt={4}>{formatOrderDate(client.lastOrder)}</Text>
        </Paper>

        <Paper withBorder p="md">
          <ThemeIcon variant="light" color="neutral" size={36} mb="sm">
            <ChartBarIcon size={16} />
          </ThemeIcon>
          <Text c="dimmed" size="sm">Ticket médio por pedido</Text>
          <Text className="mono" size="xl" fw={700} mt={4}>{formatCurrency(avgTicket)}</Text>
        </Paper>
      </SimpleGrid>

      {/* Ações de carrinho */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Paper withBorder p="md" component="button" type="button" onClick={() => onNavigate('carts')} className={`${classes.cardButton} ${classes.hoverable}`}>
          <ThemeIcon variant="light" color="neutral" size={36} mb="sm">
            <PlusIcon size={16} />
          </ThemeIcon>
          <Text fw={600}>Novo carrinho</Text>
          <Text c="dimmed" size="sm" mt={4}>Criar um novo carrinho para este cliente</Text>
        </Paper>

        <Paper withBorder p="md" component="button" type="button" onClick={() => onNavigate('carts')} className={`${classes.cardButton} ${classes.hoverable}`}>
          <ThemeIcon variant="light" color="neutral" size={36} mb="sm">
            <ShoppingCartIcon size={16} />
          </ThemeIcon>
          <Group gap="xs">
            <Text fw={600}>Carrinhos</Text>
            <Badge variant="light" color="neutral" circle>{cartCount}</Badge>
          </Group>
          <Text c="dimmed" size="sm" mt={4}>
            {cartCount === 1 ? 'pedido em aberto sendo criado' : 'pedidos em aberto sendo criados'}
          </Text>
        </Paper>
      </SimpleGrid>

      {/* Desempenho de vendas e estoque */}
      <Stack gap="md">
        <Title order={2} fw={600}>Desempenho de vendas e estoque</Title>

        <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
          <RankCard title="Números com mais vendas" items={sizeRanks} />
          <RankCard
            title="Cores com mais vendas"
            items={colorRanks}
            renderLabel={c => (
              <Group gap="xs" wrap="nowrap">
                <ColorSwatch color={COLOR_SWATCH[c.key] ?? 'var(--mantine-color-gray-5)'} size={10} withShadow={false} bd="1px solid var(--mantine-color-default-border)" />
                {c.label}
              </Group>
            )}
          />
          <RankCard title="Tipo com mais vendas" items={typeRanks} />
        </SimpleGrid>

        <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
          <Group gap="sm" mb="sm" wrap="nowrap">
            <ThemeIcon variant="light" color="gray" size={32}>
              <ListMagnifyingGlassIcon size={16} />
            </ThemeIcon>
            <Box>
              <Title order={3} fw={600}>Produtos parados no estoque</Title>
              <Text c="dimmed" size="sm">Baixo giro nos últimos meses — considere oferecer com condição especial</Text>
            </Box>
          </Group>
          <Stack gap="sm">
            {stuckProducts.map(p => (
              <Paper key={p.id} withBorder p="sm">
                <Group gap="sm" wrap="nowrap">
                  <ProductThumb src={p.image} alt={p.name} size={40} />
                  <Box miw={0} flex={1}>
                    <Text fw={600} truncate>{p.name}</Text>
                    <Text c="dimmed" size="sm" truncate>{p.line} · {p.reference}</Text>
                  </Box>
                  <Box ta="right" flex="none">
                    <Text className="mono" fw={700}>{p.soldUnits.toLocaleString('pt-BR')} pares</Text>
                    <Text c="dimmed" size="sm">vendidas · giro baixo</Text>
                  </Box>
                </Group>
              </Paper>
            ))}
            {stuckProducts.length === 0 && (
              <EmptyState
                withBorder={false}
                icon={TrendUpIcon}
                title="Nenhum produto parado no estoque"
                description="Todos os produtos deste cliente estão girando bem. Aproveite para oferecer os de alto giro nas sugestões de venda."
                action={{ label: 'Ver Produtos de Alto Giro', onClick: showHighTurnover, forward: false }}
              />
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Sugestões de venda */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }} id="sugestoes-de-venda">
        <Title order={2} fw={600} mb="sm">Sugestões de venda</Title>

        <Group gap="sm" mb="md">
          <Button
            onClick={() => setStockFilter('todos')}
            variant={stockFilter === 'todos' ? 'light' : 'default'}
            aria-pressed={stockFilter === 'todos'}
            color="neutral"
          >
            Todos
          </Button>
          {(Object.keys(STOCK_STATUS_CONFIG) as StockStatusKey[]).map(key => {
            const active = stockFilter === key;
            return (
              <Button
                key={key}
                onClick={() => setStockFilter(key)}
                variant={active ? 'light' : 'default'}
                aria-pressed={active}
                color="neutral"
              >
                {STOCK_STATUS_CONFIG[key].filterLabel}
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
          <EmptyState
            withBorder={false}
            icon={PackageIcon}
            title={`Nenhum produto em “${stockFilter !== 'todos' ? STOCK_STATUS_CONFIG[stockFilter].label : 'Todos'}”`}
            description="Nenhum produto deste cliente está nesse status agora. Limpe o filtro para ver todas as sugestões."
            action={{ label: 'Ver Todos os Produtos', onClick: () => setStockFilter('todos'), forward: false }}
          />
        )}
      </Paper>
    </Stack>
  );
}

function RankCard({ title, items, renderLabel }: { title: string; items: RankItem[]; renderLabel?: (item: RankItem) => React.ReactNode }) {
  return (
    <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
      <Title order={3} fw={600} mb="sm">{title}</Title>
      <Stack gap="sm">
        {items.map(item => (
          <Box key={item.key}>
            <Group justify="space-between" mb={4} wrap="nowrap">
              <Text fw={600} component="div">{renderLabel ? renderLabel(item) : item.label}</Text>
              <Text c="dimmed" size="sm" className="mono">{item.pct}%</Text>
            </Group>
            <Progress value={item.pct} size={6} color="neutral" />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function ProductThumb({ src, alt, size }: { src: string; alt: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  // com size: miniatura quadrada com borda; sem size: preenche o container (cartão)
  const cardProps = size
    ? { w: size, h: size, bd: '1px solid var(--mantine-color-default-border)', flex: 'none' }
    : { w: '100%', h: '100%', radius: 0 };

  return (
    <Card padding={0} bg="white" pos="relative" {...cardProps}>
      {!imgError ? (
        <>
          {/* Skeleton no lugar da imagem até ela terminar de carregar */}
          {!imgLoaded && <Skeleton pos="absolute" inset={0} h="100%" />}
          <Image src={src} alt={alt} w="100%" h="100%" fit="cover" onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} />
        </>
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
    <Card withBorder padding={0}>
      <AspectRatio ratio={1}>
        <Box pos="relative">
          <ProductThumb src={product.image} alt={product.name} />
          <Badge
            variant="light"
            color={cfg.color}
            leftSection={<StatusIcon size={12} />}
            pos="absolute"
            top={12}
            left={12}
          >
            {cfg.label}
          </Badge>
        </Box>
      </AspectRatio>
      <Stack gap={0} p="sm" flex={1}>
        <Text fw={600} truncate>{product.name}</Text>
        <Text c="dimmed" size="sm" truncate>{product.line} · {product.reference}</Text>
        <Divider mt="xs" color="var(--mantine-color-default-border)" />
        {/* preço acima e ação principal no rodapé do cartão, em largura total (cabe nos cartões estreitos do mobile) */}
        <Text className="mono" size="lg" fw={700} pt="xs">{formatCurrency(product.price)}</Text>
        {/* repetido em cada cartão: ação secundária (bordada), não compete com a principal da página */}
        <Button onClick={onBuy} variant="default" fullWidth mt="sm" rightSection={<ArrowRightIcon size={16} />}>Montar Pedido</Button>
      </Stack>
    </Card>
  );
}
