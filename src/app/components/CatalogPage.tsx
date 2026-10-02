import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSmallerThan } from "../lib/responsive";
import {
  ActionIcon, Anchor, Badge, Box, Button, Card, Chip, Divider, Flex, Group, Modal, Input, Paper, SegmentedControl,
  SimpleGrid, Image, Skeleton, Stack, Table, Text, TextInput, ThemeIcon, Title, Tooltip, UnstyledButton,
  type ImageProps,
} from "@mantine/core";
import {
  MagnifyingGlassIcon,
  GridNineIcon,
  ListBulletsIcon,
  HeartIcon,
  ShoppingCartIcon,
  XIcon,
  PackageIcon,
  EyeIcon,
  PlusIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  UsersThreeIcon,
  MegaphoneIcon,
  LightningIcon,
  StarIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { products, Product, formatCurrency, type Client } from "../data/mockData";
import {
  COST_BASIS, PEER_GROUP_SIZE, RADAR_FILTERS, SEVERITY_META, SIGNAL_META, buyReasons, isTopSeller, marginLabel, markupLabel,
  matchesRadarFilter, productDisplayName, storeSku, suggestedGrade, useRadar, type RadarFilter, type RadarSignal,
} from "../data/radar";
import { resolveTargetCart, useCartStore } from "../data/cartStore";
import { useShop } from "../lib/shop";
import bannerLimitedAsset from "../../assets/banner-edicao-limitada.webp";
import classes from "./CatalogPage.module.css";
import {
  CatalogFiltersBar, PRICE_BANDS, countActiveFilters, defaultFilters, priceBandOf, type CatalogFilters,
} from "./CatalogFiltersBar";
import { useMockLoading } from "../lib/useMockLoading";
import { CardGridSkeleton, ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import { GradeOrderSummary, SignalLine, SizeGradeEditor, TargetCartPicker, useCommitAdd } from "./SizeGrade";

const BORDER_COLOR = 'var(--mantine-color-default-border)';
const BORDER = `1px solid ${BORDER_COLOR}`;
const DIMMED = 'var(--mantine-color-dimmed)';

// Foto remota do produto: skeleton no lugar até a imagem carregar; se falhar, mostra o fallback
function ProductImage({ src, alt, fallback, imageProps }: {
  src: string; alt: string; fallback?: ReactNode; imageProps?: ImageProps;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  if (status === 'error') return <>{fallback ?? null}</>;
  return (
    <Box pos="relative" w="100%" h="100%">
      {status === 'loading' && <Skeleton pos="absolute" inset={0} aria-label="Carregando foto" />}
      <Image
        src={src}
        alt={alt}
        h="100%"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        style={{ opacity: status === 'loaded' ? 1 : 0, transition: 'opacity 150ms ease' }}
        {...imageProps}
      />
    </Box>
  );
}

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

export interface CatalogEntry {
  /** Produto aberto ao entrar (ex.: CTA do Radar). */
  productId?: string | null;
  /** Abre a grade preenchida com a sugestão do Radar. */
  prefill?: boolean;
  /** Bloco da página do produto para destacar ("Como girar" ou benchmark). */
  block?: 'benchmark' | 'como-girar';
  /** Veio do Radar: mostra "← Voltar ao Radar" (BR-72). */
  fromRadar?: boolean;
}

interface CatalogPageProps {
  onNavigate: (view: View) => void;
  selectedClient?: Client | null;
  filters: CatalogFilters;
  onFiltersChange: (f: CatalogFilters) => void;
  entry?: CatalogEntry;
  initialSortBy?: string | null;
  onBackToRadar?: () => void;
}

// rótulos dizem a ordem resultante
const SORT_OPTIONS = [
  { value: 'relevância', label: 'Mais relevantes' },
  { value: 'mais vendidos', label: 'Mais vendidos primeiro' },
  { value: 'menor preço', label: 'Menor custo primeiro' },
  { value: 'maior preço', label: 'Maior custo primeiro' },
  { value: 'margem', label: 'Maior margem primeiro' },
];

const availColor: Record<Product['availability'], string> = {
  'disponível': 'teal',
  'baixo estoque': 'yellow',
  'esgotado': 'red',
};

/** Selo do sinal principal do Radar (o mesmo sinal em todas as telas — BR-30/31). */
function SignalTag({ signal }: { signal?: RadarSignal }) {
  if (!signal) return null;
  const sev = SEVERITY_META[signal.severity];
  return (
    <Tooltip label={`${sev.label} · ${signal.context}`} multiline maw={260}>
      <Badge variant="light" color={sev.color}>{SIGNAL_META[signal.type].label}</Badge>
    </Tooltip>
  );
}

/** Seu custo, PDV sugerido e a única margem (BR-01 a BR-04). */
function PriceBlock({ product, size = 'sm' }: { product: Product; size?: 'sm' | 'lg' }) {
  return (
    <Box>
      <Group gap="lg" wrap="wrap" align="flex-end">
        <Box>
          <Text size="sm" c="dimmed">Seu custo</Text>
          <Text className="mono" fw={700} fz={size === 'lg' ? 'xl' : undefined}>{formatCurrency(product.price)}</Text>
        </Box>
        <Box>
          <Text size="sm" c="dimmed">PDV sugerido</Text>
          <Text className="mono" fz={size === 'lg' ? 'xl' : undefined}>{formatCurrency(product.priceRetail)}</Text>
        </Box>
      </Group>
      <Tooltip label={markupLabel(product)}>
        <Badge mt="xs" variant="light" color="neutral" styles={{ label: { textTransform: 'none' } }}>{marginLabel(product)}</Badge>
      </Tooltip>
    </Box>
  );
}

function ProductCard({ product, signal, topSeller, onAdd, onOpenDetail, onToggleFav, viewMode }: {
  product: Product;
  signal?: RadarSignal;
  topSeller: boolean;
  onAdd: () => void;
  onOpenDetail: () => void;
  onToggleFav: () => void;
  viewMode: 'grid' | 'list';
}) {
  const name = productDisplayName(product);
  const tags = (
    <Group gap={4} wrap="wrap">
      <Badge variant="light" color={availColor[product.availability]}>{product.availability}</Badge>
      <SignalTag signal={signal} />
      {topSeller && <Badge variant="light" color="neutral" leftSection={<StarIcon size={12} weight="fill" />}>Mais vendida</Badge>}
    </Group>
  );
  const addButton = (
    <Button
      onClick={onAdd}
      variant="default"
      disabled={product.availability === 'esgotado'}
      leftSection={<PlusIcon size={18} />}
    >
      Adicionar
    </Button>
  );

  if (viewMode === 'list') {
    return (
      <Card withBorder padding={0}>
        <Flex p={{ base: 'sm', sm: 'md' }} gap={{ base: 'sm', sm: 'md' }} wrap={{ base: 'wrap', sm: 'nowrap' }} align="center">
          <UnstyledButton onClick={onOpenDetail} w={{ base: 64, sm: 80 }} h={{ base: 64, sm: 80 }} flex="none">
            <Paper bg="white" h="100%">
              <ProductImage src={product.image} alt={name} fallback={<Group w="100%" h="100%" justify="center"><PackageIcon size={24} color={DIMMED} opacity={0.4} /></Group>} />
            </Paper>
          </UnstyledButton>
          <UnstyledButton onClick={onOpenDetail} flex={1} miw={0}>
            <Text lh={1.5} c="dimmed" size="sm" fw={600}>{product.line} · {product.reference}</Text>
            <Text lh={1.5} fw={600}>{name}</Text>
            <Text lh={1.5} c="dimmed" size="sm">{product.colors.join(' · ')} · {product.collection}</Text>
            <Box mt="xs">{tags}</Box>
          </UnstyledButton>
          <Flex gap="sm" direction={{ base: 'row', sm: 'column' }} align={{ base: 'center', sm: 'flex-end' }} justify="space-between" wrap="wrap" w={{ base: '100%', sm: 'auto' }} flex="none">
            <PriceBlock product={product} />
            <Group gap="sm">
              <Button onClick={onToggleFav} variant={product.isFavorite ? 'light' : 'default'} color="neutral" leftSection={<HeartIcon size={18} weight={product.isFavorite ? 'fill' : 'regular'} />} aria-pressed={product.isFavorite}>
                {product.isFavorite ? 'Favoritado' : 'Favoritar'}
              </Button>
              {addButton}
            </Group>
          </Flex>
        </Flex>
      </Card>
    );
  }

  return (
    <Card withBorder padding={0} className={classes.card}>
      <Box pos="relative">
        <UnstyledButton onClick={onOpenDetail} pos="relative" display="block" w="100%" pt="80%" bg="white" aria-label={`Ver detalhes de ${name}`}>
          <Box pos="absolute" inset={0}>
            <ProductImage
              src={product.image}
              alt={name}
              imageProps={{ fit: 'contain', pt: 8, px: 8, className: classes.cardImage }}
              fallback={<Group h="100%" justify="center"><PackageIcon size={40} color={DIMMED} opacity={0.3} /></Group>}
            />
          </Box>
        </UnstyledButton>
        <Button
          onClick={onToggleFav}
          pos="absolute" top={8} right={8} size="sm" px="xs"
          variant={product.isFavorite ? 'light' : 'default'} color="neutral"
          leftSection={<HeartIcon size={16} weight={product.isFavorite ? 'fill' : 'regular'} />}
          aria-pressed={!!product.isFavorite}
        >
          {product.isFavorite ? 'Favoritado' : 'Favoritar'}
        </Button>
        <Group pos="absolute" left={8} right={8} bottom={8} gap="sm" wrap="nowrap" className={classes.overlay} visibleFrom="sm">
          <Button onClick={onOpenDetail} flex={1} miw={0} px="xs" variant="default" leftSection={<EyeIcon size={18} />}>Ver</Button>
        </Group>
      </Box>

      <Box p="sm">
        <UnstyledButton onClick={onOpenDetail} display="block" w="100%">
          <Box mb="xs">{tags}</Box>
          <Text lh={1.5} c="dimmed" size="sm" fw={600}>{product.line} · {product.reference}</Text>
          <Text lh={1.5} mt={4} fw={600} lineClamp={2}>{name}</Text>
          {/* cores do modelo (variações de cor) */}
          <Text lh={1.5} c="dimmed" size="sm" truncate>{product.colors.join(' · ')}</Text>
        </UnstyledButton>
        <Divider my="sm" color={BORDER_COLOR} />
        <PriceBlock product={product} />
        <Group mt="sm" grow>{addButton}</Group>
      </Box>
    </Card>
  );
}

/** Cor do modelo: o nome sem a linha ("Flow XL Purple" → "Purple"). */
const colorwayOf = (p: Product) => p.name.replace(p.line, '').trim() || p.colors[0];

/** Selo curto do sinal no cartão: crescimento sempre com escopo e período (BR-34). */
function signalChip(signal: RadarSignal, product: Product) {
  const growth = storeSku(product.id)?.regionalGrowthPct ?? 0;
  if (signal.type === 'alta-demanda') return `+${growth}% na região · 30 dias`;
  return SIGNAL_META[signal.type].label;
}

/**
 * Cartão do modelo no catálogo (grade): um cartão por linha, com as cores em miniaturas.
 * Clicar no cartão abre a página do produto da cor escolhida; as miniaturas só trocam a cor
 * mostrada e "Adicionar ao carrinho" abre a grade de numeração (BR-20).
 */
function ModelCard({ variants, initialId, onOpenDetail, onAdd }: {
  variants: Product[];
  initialId: string;
  onOpenDetail: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const radar = useRadar();
  const [selectedId, setSelectedId] = useState(initialId);
  const product = variants.find(v => v.id === selectedId) ?? variants[0];
  const signal = radar.byProduct[product.id];
  const topSeller = isTopSeller(product.id, radar);
  const stripRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => stripRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  const lineName = `Tênis Tesla ${product.line}`;
  const showArrows = variants.length > 4;

  return (
    <Card withBorder padding={0} className={classes.card}>
      {/* foto: clicável, abre o detalhe; selo "Mais vendida" sobre a foto (BR-33) */}
      <UnstyledButton onClick={() => onOpenDetail(product)} pos="relative" display="block" w="100%" pt="62%" bg="white" aria-label={`Ver detalhes de ${productDisplayName(product)}`}>
        <Box pos="absolute" inset={0}>
          <ProductImage
            key={product.id}
            src={product.image}
            alt={productDisplayName(product)}
            imageProps={{ fit: 'contain', p: 'sm' }}
            fallback={<Group h="100%" justify="center"><PackageIcon size={40} color={DIMMED} opacity={0.3} /></Group>}
          />
        </Box>
        {topSeller && (
          <Badge pos="absolute" top={12} left={12} variant="filled" color="neutral.9" radius="sm" ff="monospace" leftSection={<StarIcon size={12} weight="fill" />}>
            Mais vendida
          </Badge>
        )}
      </UnstyledButton>

      {/* miniaturas das cores: trocam a cor mostrada no cartão */}
      <Group gap={6} wrap="nowrap" px="xs" pt={2} pb="xs" style={{ borderTop: BORDER, borderBottom: BORDER }}>
        {showArrows && (
          <ActionIcon variant="default" radius="xl" size="sm" onClick={() => scroll(-1)} aria-label="Cores anteriores" flex="none">
            <CaretLeftIcon size={12} />
          </ActionIcon>
        )}
        <Box ref={stripRef} flex={1} miw={0} style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          <Group gap={6} wrap="nowrap" pt={6} pr={6} role="radiogroup" aria-label={`Cores de ${lineName}`}>
            {variants.map(v => {
              const active = v.id === product.id;
              return (
                <Tooltip key={v.id} label={colorwayOf(v)}>
                  <UnstyledButton
                    role="radio"
                    aria-checked={active}
                    aria-label={`Cor ${colorwayOf(v)}`}
                    onClick={() => setSelectedId(v.id)}
                    pos="relative"
                    w={56}
                    h={56}
                    flex="none"
                    bg="white"
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                      border: active ? '2px solid var(--mantine-color-neutral-9)' : BORDER,
                    }}
                  >
                    <ProductImage src={v.image} alt="" imageProps={{ fit: 'contain', p: 2 }} fallback={<Group h="100%" justify="center"><PackageIcon size={18} color={DIMMED} /></Group>} />
                    {isTopSeller(v.id, radar) && (
                      <ThemeIcon pos="absolute" top={-6} right={-6} size={16} radius="xl" color="neutral.9" aria-hidden>
                        <StarIcon size={10} weight="fill" />
                      </ThemeIcon>
                    )}
                  </UnstyledButton>
                </Tooltip>
              );
            })}
          </Group>
        </Box>
        {showArrows && (
          <ActionIcon variant="default" radius="xl" size="sm" onClick={() => scroll(1)} aria-label="Próximas cores" flex="none">
            <CaretRightIcon size={12} />
          </ActionIcon>
        )}
      </Group>

      <Stack gap="sm" p="md" flex={1}>
        {/* texto, preço e selos: clicáveis, abrem o detalhe */}
        <UnstyledButton onClick={() => onOpenDetail(product)} display="block" w="100%">
          <Text fw={700} fz="lg" lh={1.3}>{lineName}</Text>
          <Text size="sm" c="dimmed">{colorwayOf(product)}</Text>
          <Group gap={6} align="baseline" mt="sm">
            <Text className="mono" fw={700} fz="lg">{formatCurrency(product.price)}</Text>
            <Text size="sm" c="dimmed">Seu custo</Text>
          </Group>
          <Group gap="xs" mt={4} wrap="wrap">
            <Text size="sm" c="dimmed" className="mono">PDV sugerido {formatCurrency(product.priceRetail)}</Text>
            <Tooltip label={markupLabel(product)}>
              <Badge variant="light" color="teal" radius="sm" ff="monospace" styles={{ label: { textTransform: 'none' } }}>
                {marginLabel(product)}
              </Badge>
            </Tooltip>
          </Group>
          <Group gap={6} mt="sm" wrap="wrap">
            {signal && (
              <Tooltip label={`${SEVERITY_META[signal.severity].label} · ${signal.context}`} multiline maw={260}>
                <Badge variant="light" color={SEVERITY_META[signal.severity].color} radius="sm" ff="monospace" styles={{ label: { textTransform: 'none' } }}>
                  {signalChip(signal, product)}
                </Badge>
              </Tooltip>
            )}
            {product.availability !== 'disponível' && (
              <Badge variant="light" color={availColor[product.availability]} radius="sm" ff="monospace" styles={{ label: { textTransform: 'none' } }}>
                {product.availability}
              </Badge>
            )}
          </Group>
        </UnstyledButton>
        <Button
          mt="auto"
          fullWidth
          variant="default"
          disabled={product.availability === 'esgotado'}
          leftSection={<ShoppingCartIcon size={18} />}
          onClick={() => onAdd(product)}
        >
          Adicionar ao carrinho
        </Button>
      </Stack>
    </Card>
  );
}

// Tabela de medidas: comprimento interno aproximado por numeração
const footLength = (size: string) => (Number(size) * 0.667 - 0.5).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Página do produto (M3): por que comprar e montar o pedido por numeração. */
function ProductDetailModal({ product, entry, onClose, onSwitch, onToggleFav, isFavorite, onBackToRadar }: {
  product: Product; entry?: CatalogEntry; onClose: () => void; onSwitch: (p: Product) => void;
  onToggleFav: () => void; isFavorite: boolean; onBackToRadar?: () => void;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const radar = useRadar();
  const { carts } = useCartStore();
  const { role, clientId } = useShop();
  const commit = useCommitAdd();
  const signal = radar.byProduct[product.id];
  const suggestion = useMemo(() => suggestedGrade(product, radar), [product, radar]);
  const [sizes, setSizes] = useState<Record<string, number>>(() => (entry?.prefill && suggestion ? suggestion.sizes : {}));
  const [triedEmpty, setTriedEmpty] = useState(false);
  const target = clientId ? resolveTargetCart(clientId, role) : null;
  void carts;
  const reasons = buyReasons(product);
  const sku = storeSku(product.id);
  const siblings = products.filter(p => p.line === product.line && p.id !== product.id);
  const images = [
    { src: product.image, label: 'Lateral' },
    { src: product.image, label: 'Frontal' },
    { src: product.image, label: 'Solado' },
  ];
  const fullScreen = useSmallerThan('sm');
  const n = Object.values(sizes).reduce((a, b) => a + b, 0);
  const stuck = signal?.type === 'sem-giro' || signal?.type === 'giro-baixo';

  useEffect(() => {
    if (entry?.block) document.getElementById(`bloco-${entry.block}`)?.scrollIntoView({ block: 'center' });
  }, [entry?.block]);

  const add = () => {
    if (n === 0) { setTriedEmpty(true); return; }
    if (commit(product, sizes, target?.id)) { setSizes({}); onClose(); }
  };

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      size="64rem"
      fullScreen={fullScreen}
      radius={fullScreen ? 0 : undefined}
      padding={0}
      overlayProps={{ backgroundOpacity: 0.7 }}
      title={
        // BR-72: breadcrumb começa no módulo; vindo do Radar, link de volta mantém o contexto
        <Group gap="sm" wrap="wrap">
          {entry?.fromRadar && onBackToRadar && (
            <Anchor component="button" type="button" size="sm" fw={600} onClick={onBackToRadar}>
              <Group gap={4} wrap="nowrap"><ArrowLeftIcon size={14} />Voltar ao Radar</Group>
            </Anchor>
          )}
          <Text lh={1.5} component="span" c="dimmed" size="sm" fw={600}>Catálogo / {product.name}</Text>
        </Group>
      }
      styles={{
        content: { display: 'flex', flexDirection: 'column', maxHeight: fullScreen ? '100dvh' : '92vh', overflow: 'hidden' },
        header: { padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-lg)', minHeight: 0, borderBottom: BORDER },
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 },
      }}
    >
      <Box className={classes.detailBody}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
          <Stack gap="sm" p="md" className={classes.galleryPane}>
            <Paper pos="relative" w="100%" pt="90%" bg="white">
              <Box pos="absolute" inset={0} p="md">
                <ProductImage
                  key={images[activeImg].src + product.id}
                  src={images[activeImg].src}
                  alt={`${productDisplayName(product)} — vista ${images[activeImg].label.toLowerCase()}`}
                  imageProps={{ fit: 'contain', style: { cursor: 'zoom-in' } }}
                  fallback={<Group h="100%" justify="center"><PackageIcon size={48} color={DIMMED} opacity={0.3} /></Group>}
                />
              </Box>
            </Paper>
            <Group gap="xs" role="tablist" aria-label="Vistas do produto">
              {images.map((img, i) => (
                <UnstyledButton key={img.label} onClick={() => setActiveImg(i)} className={classes.thumbButton} data-active={activeImg === i || undefined} role="tab" aria-selected={activeImg === i}>
                  <Box className={classes.thumb}><ProductImage src={img.src} alt="" /></Box>
                  <Text lh={1.5} size="sm" fw={activeImg === i ? 600 : 400} c={activeImg === i ? undefined : 'dimmed'}>{img.label}</Text>
                </UnstyledButton>
              ))}
            </Group>
            {/* Troca de cor: outros modelos da mesma linha */}
            {siblings.length > 0 && (
              <Box>
                <Text size="sm" c="dimmed" mb={4}>Outras cores da linha {product.line}</Text>
                <Group gap="xs">
                  <Badge variant="filled" color="neutral">{product.colors[0]}</Badge>
                  {siblings.map(s => (
                    <Button key={s.id} size="compact-sm" variant="default" onClick={() => onSwitch(s)}>{s.name.replace(`${s.line} `, '')}</Button>
                  ))}
                </Group>
              </Box>
            )}
          </Stack>

          <Stack gap="md" p={{ base: 'md', sm: 'lg' }}>
            {/* FR-301: categoria · linha · código, nome no padrão Tênis Tesla + linha + cor */}
            <Box>
              <Text size="sm" c="dimmed" fw={600}>{product.category} · {product.line} · {product.reference}</Text>
              <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
                <Title order={2}>{productDisplayName(product)}</Title>
                <Button onClick={onToggleFav} variant={isFavorite ? 'light' : 'default'} color="neutral" flex="none" leftSection={<HeartIcon size={18} weight={isFavorite ? 'fill' : 'regular'} />} aria-pressed={isFavorite}>
                  {isFavorite ? 'Favoritado' : 'Favoritar'}
                </Button>
              </Group>
            </Box>
            {/* FR-302: Seu custo, PDV sugerido e margem; "margem real" só com preços de sell-out (não integrados) */}
            <Box>
              <PriceBlock product={product} size="lg" />
              <Text size="sm" c="dimmed" mt={4}>Seu custo por par, {COST_BASIS}.</Text>
            </Box>

            {/* FR-304: mesmo sinal, data de agir e quantidade do cartão do Radar */}
            {signal && <SignalLine signal={signal} />}

            {/* FR-303: só razões com dados, cada uma com escopo e período */}
            {reasons.length > 0 && !stuck && (
              <Box>
                <Text fw={600} mb={4}>Por que comprar</Text>
                <Stack gap={4}>
                  {reasons.map(r => (
                    <Group key={r} gap="xs" wrap="nowrap" align="flex-start">
                      <CheckCircleIcon size={16} color="var(--mantine-color-teal-7)" style={{ flex: 'none', marginTop: 3 }} />
                      <Text size="sm">{r}</Text>
                    </Group>
                  ))}
                </Stack>
              </Box>
            )}

            {stuck && (
              <Paper id="bloco-como-girar" withBorder p="sm" bd={entry?.block === 'como-girar' ? '2px solid var(--mantine-color-yellow-6)' : undefined}>
                <Group gap="xs" mb={4}><MegaphoneIcon size={16} /><Text fw={600}>Como girar</Text></Group>
                <Stack gap={2}>
                  <Text size="sm">• Crie uma campanha no Marketing IA com este modelo.</Text>
                  <Text size="sm">• Coloque na vitrine ou perto do caixa por 15 dias.</Text>
                  <Text size="sm">• O Radar não sugere reposição nem combos com este produto enquanto o giro estiver baixo.</Text>
                </Stack>
              </Paper>
            )}

            {sku && sku.peerSalesDiffPct > 0 && (
              <Paper id="bloco-benchmark" withBorder p="sm" bd={entry?.block === 'benchmark' ? '2px solid var(--mantine-color-blue-6)' : undefined}>
                <Group gap="xs" mb={4}><UsersThreeIcon size={16} /><Text fw={600}>Benchmark: lojas parecidas</Text></Group>
                <Text size="sm">Lojas parecidas venderam {sku.peerSalesDiffPct}% mais deste modelo que a sua loja, últimos 30 dias.</Text>
                <Text size="sm" c="dimmed">Grupo de {PEER_GROUP_SIZE} lojas da mesma região, porte e posicionamento de preço · dados agregados e anônimos.</Text>
              </Paper>
            )}

            {/* FR-308: sobre o produto */}
            <Box>
              <Text fw={600} mb={4}>Sobre o produto</Text>
              <Text lh={1.6} size="sm">{product.description}</Text>
              <Group gap="lg" mt="xs">
                <Box><Text size="sm" c="dimmed">Material</Text><Text size="sm" fw={600}>{product.material}</Text></Box>
                <Box><Text size="sm" c="dimmed">Coleção</Text><Text size="sm" fw={600}>{product.collection}</Text></Box>
                <Box><Text size="sm" c="dimmed">Cores</Text><Text size="sm" fw={600}>{product.colors.join(', ')}</Text></Box>
              </Group>
            </Box>
          </Stack>
        </SimpleGrid>

        {/* FR-305/306/307: grade, resumo e carrinho de destino */}
        <Stack gap="md" p={{ base: 'md', sm: 'lg' }} style={{ borderTop: BORDER }}>
          <Title order={3}>Montar pedido por numeração</Title>
          <SizeGradeEditor product={product} value={sizes} onChange={v => { setSizes(v); setTriedEmpty(false); }} suggestion={suggestion} />
          <Box>
            <Text size="sm" c="dimmed" mb={4}>Tabela de medidas (comprimento interno aproximado)</Text>
            <Table.ScrollContainer minWidth={520} type="native">
              <Table withTableBorder verticalSpacing={4} fz="sm">
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Th>Nº</Table.Th>
                    {Object.keys(product.grades).map(s => <Table.Td key={s} ta="center">{s}</Table.Td>)}
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Th>cm</Table.Th>
                    {Object.keys(product.grades).map(s => <Table.Td key={s} ta="center" className="mono">{footLength(s)}</Table.Td>)}
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Box>
        </Stack>
      </Box>
      <Box flex="none" px={{ base: 'md', sm: 'lg' }} py="sm" style={{ borderTop: BORDER }} bg="var(--mantine-color-default-hover)">
        <Group justify="space-between" gap="sm" wrap="wrap">
          <GradeOrderSummary product={product} sizes={sizes} />
          <Stack gap={4} align="flex-end">
            <TargetCartPicker cart={target} clientId={clientId} />
            <Group gap="sm">
              <Button variant="default" onClick={onClose}>Fechar</Button>
              {/* o botão fica habilitado; com 0 pares ele explica o que falta */}
              <Button onClick={add} leftSection={<ShoppingCartIcon size={18} />}>Adicionar ao carrinho</Button>
            </Group>
            {triedEmpty && n === 0 && <Text size="sm" c="red.7">Selecione ao menos 1 par</Text>}
          </Stack>
        </Group>
      </Box>
    </Modal>
  );
}

export function CatalogPage({ filters, onFiltersChange, entry, initialSortBy, onBackToRadar }: CatalogPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState(initialSortBy ?? 'relevância');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(products.filter(p => p.isFavorite).map(p => p.id)));
  const [detailProduct, setDetailProduct] = useState<Product | null>(() => products.find(p => p.id === entry?.productId) ?? null);
  const [detailEntry, setDetailEntry] = useState<CatalogEntry | undefined>(entry);
  const loading = useMockLoading();
  const radar = useRadar();
  const { openGrade } = useShop();
  const search = filters.search;
  const setSearch = (v: string) => onFiltersChange({ ...filters, search: v });

  const band = priceBandOf(filters.priceBand);
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.line.toLowerCase().includes(q);
    const matchLine = filters.line === 'Todos' || p.line === filters.line;
    const matchCat = filters.category === 'Todos' || p.category === filters.category;
    const matchColors = filters.colors.length === 0 || p.colors.some(c => filters.colors.includes(c));
    const matchPrice = !band || (p.price >= band.min && p.price <= band.max);
    const matchRadar = filters.radar.length === 0 || filters.radar.some(f => matchesRadarFilter(p, f, radar));
    const matchCollection = filters.collection === 'Todas' || p.collection === filters.collection;
    const matchSize = !filters.size || (p.grades[filters.size] ?? 0) > 0;
    return matchSearch && matchLine && matchCat && matchColors && matchPrice && matchRadar && matchCollection && matchSize;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'menor preço') return a.price - b.price;
    if (sortBy === 'maior preço') return b.price - a.price;
    if (sortBy === 'mais vendidos') return b.soldUnits - a.soldUnits;
    if (sortBy === 'margem') return (b.priceRetail - b.price) / b.priceRetail - (a.priceRetail - a.price) / a.priceRetail;
    return 0;
  });

  const toggleFav = (id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearFilters = () => onFiltersChange({ ...defaultFilters, search: filters.search, priceTable: filters.priceTable });
  const clearSearchAndFilters = () => onFiltersChange({ ...defaultFilters, priceTable: filters.priceTable });

  // FR-203: filtros ativos como chips removíveis
  const activeChips: { key: string; label: string; remove: () => void }[] = [
    ...filters.radar.map(r => ({ key: `radar-${r}`, label: RADAR_FILTERS.find(f => f.value === r)?.label ?? r, remove: () => onFiltersChange({ ...filters, radar: filters.radar.filter(x => x !== r) }) })),
    ...(filters.line !== 'Todos' ? [{ key: 'line', label: `Linha: ${filters.line}`, remove: () => onFiltersChange({ ...filters, line: 'Todos' }) }] : []),
    ...(filters.collection !== 'Todas' ? [{ key: 'col', label: `Coleção: ${filters.collection}`, remove: () => onFiltersChange({ ...filters, collection: 'Todas' }) }] : []),
    ...(filters.category !== 'Todos' ? [{ key: 'cat', label: `Categoria: ${filters.category}`, remove: () => onFiltersChange({ ...filters, category: 'Todos' }) }] : []),
    ...(band ? [{ key: 'band', label: `Seu custo: ${PRICE_BANDS.find(b => b.value === filters.priceBand)?.label}`, remove: () => onFiltersChange({ ...filters, priceBand: '' }) }] : []),
    ...(filters.size ? [{ key: 'size', label: `Numeração: ${filters.size}`, remove: () => onFiltersChange({ ...filters, size: '' }) }] : []),
    ...filters.colors.map(c => ({ key: `color-${c}`, label: `Cor: ${c}`, remove: () => onFiltersChange({ ...filters, colors: filters.colors.filter(x => x !== c) }) })),
  ];

  const openDetail = (p: Product, e?: CatalogEntry) => { setDetailEntry(e); setDetailProduct(p); };

  // Grade: um cartão por modelo (linha), na ordem do primeiro produto de cada linha; as cores
  // que passam nos filtros vêm primeiro, mas todas as cores da linha ficam nas miniaturas
  const models = useMemo(() => {
    const order: string[] = [];
    sorted.forEach(p => { if (!order.includes(p.line)) order.push(p.line); });
    return order.map(line => {
      const matching = sorted.filter(p => p.line === line);
      const others = products.filter(p => p.line === line && !matching.includes(p));
      return { line, variants: [...matching, ...others] };
    });
  }, [sorted]);

  const renderProductCard = (product: Product, mode: 'grid' | 'list') => (
    <ProductCard
      key={product.id}
      product={{ ...product, isFavorite: favoriteIds.has(product.id) }}
      signal={radar.byProduct[product.id]}
      topSeller={isTopSeller(product.id, radar)}
      viewMode={mode}
      // "Adicionar" sempre abre a grade, preenchida quando há sinal (FR-205)
      onAdd={() => openGrade({ productId: product.id })}
      onOpenDetail={() => openDetail(product)}
      onToggleFav={() => toggleFav(product.id)}
    />
  );

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {entry?.fromRadar && onBackToRadar && (
        <Anchor component="button" type="button" fw={600} onClick={onBackToRadar} mb={-16}>
          <Group gap={4} wrap="nowrap"><ArrowLeftIcon size={16} />Voltar ao Radar</Group>
        </Anchor>
      )}
      <CatalogFiltersBar filters={filters} onChange={onFiltersChange} />

      <Card withBorder shadow="xs" padding={0}>
        <Image src={bannerLimitedAsset} alt="Edição Limitada" h="auto" />
      </Card>

      <Stack gap="lg">
        <Stack gap="md">
          <Group gap="sm" wrap="wrap">
            <TextInput
              flex={{ base: '1 1 100%', sm: 1 }}
              miw={{ sm: 200 }}
              placeholder="Buscar por nome, linha ou código"
              aria-label="Buscar produtos"
              value={search}
              onChange={e => setSearch(e.currentTarget.value)}
              leftSection={<MagnifyingGlassIcon size={18} />}
              rightSection={search ? (
                <ActionIcon onClick={() => setSearch('')} variant="subtle" color="gray" size="input-sm" aria-label="Limpar busca">
                  <XIcon size={16} />
                </ActionIcon>
              ) : null}
            />
            <SegmentedControl
              value={viewMode}
              onChange={v => setViewMode(v as 'grid' | 'list')}
              aria-label="Modo de exibição"
              data={[
                { value: 'grid', label: <Group gap="xs" wrap="nowrap" justify="center"><GridNineIcon size={18} /><Text span inherit>Grade</Text></Group> },
                { value: 'list', label: <Group gap="xs" wrap="nowrap" justify="center"><ListBulletsIcon size={18} /><Text span inherit>Lista</Text></Group> },
              ]}
            />
          </Group>

          <Input.Wrapper label="Ordenar por" labelElement="div" id="catalog-sort">
            <Chip.Group multiple={false} value={sortBy} onChange={v => v && setSortBy(v)}>
              <Group gap="sm" mt="xs" role="radiogroup" aria-labelledby="catalog-sort-label">
                {SORT_OPTIONS.map(o => (
                  <Chip key={o.value} value={o.value} variant="filled" icon={null} styles={{ iconWrapper: { display: 'none' } }}>{o.label}</Chip>
                ))}
              </Group>
            </Chip.Group>
          </Input.Wrapper>

          {/* contagem de resultados + filtros ativos removíveis + limpar */}
          <Group gap="sm" wrap="wrap">
            <Text fw={600} aria-live="polite">
              {sorted.length} {sorted.length === 1 ? 'produto' : 'produtos'}
              {viewMode === 'grid' && <Text span c="dimmed" fw={400} inherit> em {models.length} {models.length === 1 ? 'modelo' : 'modelos'}</Text>}
            </Text>
            {activeChips.map(ch => (
              <Button key={ch.key} variant="light" color="neutral" size="compact-md" rightSection={<XIcon size={14} />} onClick={ch.remove} aria-label={`Remover filtro ${ch.label}`}>
                {ch.label}
              </Button>
            ))}
            {countActiveFilters(filters) > 0 && (
              <Button variant="subtle" color="neutral" size="compact-md" onClick={clearFilters}>Limpar filtros</Button>
            )}
          </Group>
        </Stack>

        {loading ? (
          viewMode === 'grid'
            ? <CardGridSkeleton count={6} cols={{ base: 2, sm: 3 }} imageRatio={1.25} />
            : <ListSkeleton rows={5} withAvatar />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="Nenhum produto encontrado"
            description="Nenhum produto combina com a busca e os filtros. Limpe a busca e os filtros para ver o catálogo inteiro."
            action={{ label: 'Limpar Busca e Filtros', onClick: clearSearchAndFilters, forward: false }}
            suggestions={[
              { label: 'Ver produtos em alta', description: 'Sinal Alto giro do Radar', icon: LightningIcon, onClick: () => onFiltersChange({ ...defaultFilters, priceTable: filters.priceTable, radar: ['alto-giro' as RadarFilter] }) },
            ]}
          />
        ) : viewMode === 'grid' ? (
          <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing={{ base: 'sm', sm: 'md' }}>
            {models.map(m => (
              <ModelCard
                key={m.line}
                variants={m.variants}
                initialId={m.variants[0].id}
                onOpenDetail={p => openDetail(p)}
                // "Adicionar" sempre abre a grade, preenchida quando há sinal (FR-205)
                onAdd={p => openGrade({ productId: p.id })}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Stack gap="sm">
            {sorted.map(product => renderProductCard(product, 'list'))}
          </Stack>
        )}
      </Stack>

      {detailProduct && (
        <ProductDetailModal
          key={detailProduct.id}
          product={{ ...detailProduct, isFavorite: favoriteIds.has(detailProduct.id) }}
          entry={detailEntry}
          isFavorite={favoriteIds.has(detailProduct.id)}
          onClose={() => setDetailProduct(null)}
          onSwitch={p => openDetail(p, detailEntry?.fromRadar ? { fromRadar: true } : undefined)}
          onToggleFav={() => toggleFav(detailProduct.id)}
          onBackToRadar={onBackToRadar}
        />
      )}
    </Stack>
  );
}

