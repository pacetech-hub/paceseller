import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActionIcon, Anchor, Badge, Box, Button, Card, Chip, Divider, Flex, Grid, Group, Input, Paper, SegmentedControl,
  SimpleGrid, Image, Skeleton, Stack, Table, Text, TextInput, Title, Tooltip, UnstyledButton,
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
  SneakerIcon,
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
  CatalogFiltersBar, SORT_OPTIONS, PRICE_BANDS, countActiveFilters, defaultFilters, priceBandOf, type CatalogFilters,
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
        <Badge mt="xs" variant="light" color="brand" styles={{ label: { textTransform: 'none' } }}>{marginLabel(product)}</Badge>
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
      {topSeller && <Badge variant="light" color="brand" leftSection={<StarIcon size={14} weight="fill" />}>Mais vendida</Badge>}
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
              <Button onClick={onToggleFav} variant={product.isFavorite ? 'light' : 'default'} color="brand" leftSection={<HeartIcon size={18} weight={product.isFavorite ? 'fill' : 'regular'} />} aria-pressed={product.isFavorite}>
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
          variant={product.isFavorite ? 'light' : 'default'} color="brand"
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

/** Cobertura na loja em dias (BR-10: estoque ÷ venda média diária dos últimos 30 dias). */
function coverageDays(productId: string): number | null {
  const s = storeSku(productId);
  if (!s || !s.inMix || s.dailySales <= 0) return null;
  return Math.round(s.stock / s.dailySales);
}

/** Etiqueta com contorno sobre a foto, em caixa-alta mono (cor só como reforço do texto). */
function OutlineTag({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <Box
      component="span"
      px={6}
      py={2}
      fz={10}
      fw={600}
      ff="monospace"
      tt="uppercase"
      lts={0.4}
      c={color ? `${color}.8` : undefined}
      bg="var(--mantine-color-body)"
      lh="14px"
      display="inline-block"
      style={{ border: `1px solid ${color ? `var(--mantine-color-${color}-7)` : 'var(--mantine-color-text)'}`, borderRadius: 'var(--mantine-radius-xs)', whiteSpace: 'nowrap' }}
    >
      {children}
    </Box>
  );
}

/**
 * Cartão do modelo no catálogo (grade de 4 colunas): foto grande com etiquetas e a linha de
 * margem/cobertura embaixo, miniaturas das cores, e o texto (linha, nome, cor, preço).
 * Clicar na foto ou no texto abre a página do produto da cor escolhida; as miniaturas só trocam
 * a cor mostrada; "+" abre a grade de numeração (BR-20), preenchida quando há sinal (FR-205).
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
  const scroll = (dir: 1 | -1) => stripRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });
  const lineName = `Tênis Tesla ${product.line}`;
  const showArrows = variants.length > 6;
  const coverage = coverageDays(product.id);
  const soldOut = product.availability === 'esgotado';

  return (
    <Box className={classes.modelCard}>
      {/* foto: clicável, abre o detalhe; etiquetas no alto, margem e cobertura embaixo */}
      <UnstyledButton
        onClick={() => onOpenDetail(product)}
        pos="relative"
        display="block"
        w="100%"
        pt="125%"
        className={classes.modelImage}
        aria-label={`Ver detalhes de ${productDisplayName(product)}`}
      >
        <Box pos="absolute" inset={0} px="md" pt={40} pb={40}>
          <ProductImage
            key={product.id}
            src={product.image}
            alt={productDisplayName(product)}
            imageProps={{ fit: 'contain', h: '100%', style: { mixBlendMode: 'multiply' } }}
            fallback={<Group h="100%" justify="center"><SneakerIcon size={44} color={DIMMED} opacity={0.5} /></Group>}
          />
        </Box>
        <Group gap={6} pos="absolute" top={10} left={10} right={10} wrap="wrap" align="center">
          {topSeller && <OutlineTag>Mais vendida</OutlineTag>}
          {signal && (
            <Tooltip label={`${SEVERITY_META[signal.severity].label} · ${signal.context}`} multiline maw={260}>
              <span style={{ display: "inline-flex" }}><OutlineTag color={SEVERITY_META[signal.severity].color}>{signalChip(signal, product)}</OutlineTag></span>
            </Tooltip>
          )}
          {product.availability !== 'disponível' && <OutlineTag color={availColor[product.availability]}>{product.availability}</OutlineTag>}
        </Group>
        <Tooltip label={markupLabel(product)} position="top">
          <Text pos="absolute" bottom={12} left={8} right={8} ta="center" fz={11} ff="monospace" lh={1.3}>
            {marginLabel(product)}
            {coverage !== null && <Text span inherit c="dimmed" display="block">Cobertura de {coverage} dias na loja</Text>}
          </Text>
        </Tooltip>
      </UnstyledButton>

      {/* miniaturas das cores: trocam a cor mostrada; ★ marca a mais vendida */}
      <Group gap={2} wrap="nowrap" mt={6}>
        {showArrows && (
          <ActionIcon variant="subtle" color="brand" size="sm" onClick={() => scroll(-1)} aria-label="Cores anteriores" flex="none">
            <CaretLeftIcon size={14} />
          </ActionIcon>
        )}
        <Box ref={stripRef} flex={1} miw={0} style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          <Group gap={4} wrap="nowrap" role="radiogroup" aria-label={`Cores de ${lineName}`}>
            {variants.map(v => {
              const active = v.id === product.id;
              return (
                <Tooltip key={v.id} label={colorwayOf(v)}>
                  <UnstyledButton
                    role="radio"
                    aria-checked={active}
                    aria-label={`Cor ${colorwayOf(v)}`}
                    onClick={() => setSelectedId(v.id)}
                    className={classes.swatch}
                    data-active={active || undefined}
                  >
                    <Box w={36} h={28}>
                      <ProductImage src={v.image} alt="" imageProps={{ fit: 'contain' }} fallback={<Group h="100%" justify="center"><SneakerIcon size={18} color={DIMMED} /></Group>} />
                    </Box>
                    <Text component="span" fz={10} lh={1} h={10} ta="center" display="block" aria-hidden>
                      {isTopSeller(v.id, radar) ? '★' : ''}
                    </Text>
                  </UnstyledButton>
                </Tooltip>
              );
            })}
          </Group>
        </Box>
        {showArrows && (
          <ActionIcon variant="subtle" color="brand" size="sm" onClick={() => scroll(1)} aria-label="Próximas cores" flex="none">
            <CaretRightIcon size={14} />
          </ActionIcon>
        )}
      </Group>

      {/* texto: linha, nome, cor e preço; "+" ao lado do nome abre a grade */}
      <Group gap="xs" wrap="nowrap" align="flex-start" mt="sm">
        <UnstyledButton onClick={() => onOpenDetail(product)} flex={1} miw={0} display="block">
          <Text fz={11} ff="monospace" tt="uppercase" c="dimmed" lts={0.4}>{product.line}</Text>
          <Text fw={700} lh={1.3} mt={2} truncate>{lineName}</Text>
          <Text size="sm" c="dimmed" truncate>{colorwayOf(product)}</Text>
          <Group gap={6} align="baseline" mt={6} wrap="wrap" style={{ rowGap: 0 }}>
            <Tooltip label="Seu custo por par">
              <Text className="mono" fw={700}>{formatCurrency(product.price)}</Text>
            </Tooltip>
            <Text fz={11} ff="monospace" c="dimmed">PDV sugerido {formatCurrency(product.priceRetail)}</Text>
          </Group>
        </UnstyledButton>
        <Tooltip label={soldOut ? 'Esgotado' : 'Adicionar ao carrinho'}>
          <ActionIcon
            variant="default"
            radius="xl"
            size="lg"
            mt={14}
            disabled={soldOut}
            onClick={() => onAdd(product)}
            aria-label={`Adicionar ${productDisplayName(product)} ao carrinho`}
          >
            <PlusIcon size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Box>
  );
}

// Tabela de medidas: comprimento interno aproximado por numeração
const footLength = (size: string) => (Number(size) * 0.667 - 0.5).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Rótulo de seção em caixa-alta mono, como nos cartões do Radar. */
function Eyebrow({ children, mb = 'xs' }: { children: ReactNode; mb?: string | number }) {
  return <Text fz={12} ff="monospace" tt="uppercase" lts={0.6} c="dimmed" mb={mb}>{children}</Text>;
}

/**
 * Página do produto (M3), em página inteira: foto à esquerda; à direita a decisão, de cima para
 * baixo — o que é, quanto custa, por que comprar, o sinal do Radar, a grade e "Como você quer seguir?".
 */
function ProductDetailPage({ product, entry, onClose, onSwitch, onToggleFav, isFavorite, onBackToRadar }: {
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
  const n = Object.values(sizes).reduce((a, b) => a + b, 0);
  const stuck = signal?.type === 'sem-giro' || signal?.type === 'giro-baixo';
  const soldOut = product.availability === 'esgotado';

  // a página abre no topo; vindo de um CTA do Radar com bloco, rola até ele
  useEffect(() => {
    if (entry?.block) document.getElementById(`bloco-${entry.block}`)?.scrollIntoView({ block: 'center' });
    else document.querySelector('main')?.scrollTo({ top: 0 });
  }, [entry?.block, product.id]);

  const add = () => {
    if (n === 0) { setTriedEmpty(true); return; }
    // continua na página: o aviso traz os novos totais e "Ver carrinho" (FR-309)
    if (commit(product, sizes, target?.id)) setSizes({});
  };

  const about = (
    <Stack gap="md">
      <Box>
        <Eyebrow>Sobre o produto</Eyebrow>
        <Text lh={1.6} size="sm">{product.description}</Text>
        <Group gap="lg" mt="xs">
          <Box><Text size="sm" c="dimmed">Material</Text><Text size="sm" fw={600}>{product.material}</Text></Box>
          <Box><Text size="sm" c="dimmed">Coleção</Text><Text size="sm" fw={600}>{product.collection}</Text></Box>
          <Box><Text size="sm" c="dimmed">Cores</Text><Text size="sm" fw={600}>{product.colors.join(', ')}</Text></Box>
        </Group>
      </Box>

      <Box>
        <Eyebrow>Tabela de medidas · comprimento interno aproximado</Eyebrow>
        <Table.ScrollContainer minWidth={480} type="native">
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
  );

  return (
    <Stack gap="lg">
      {/* BR-72: breadcrumb começa no módulo; vindo do Radar, o Radar abre o caminho */}
      <Group gap={8} wrap="wrap" component="nav" aria-label="Caminho">
        {entry?.fromRadar && onBackToRadar && (
          <>
            <Anchor component="button" type="button" size="sm" onClick={onBackToRadar}>Radar</Anchor>
            <Text size="sm" c="dimmed" aria-hidden>/</Text>
          </>
        )}
        <Anchor component="button" type="button" size="sm" onClick={onClose}>Catálogo</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Text size="sm" fw={600} aria-current="page">{productDisplayName(product)}</Text>
      </Group>

      <Grid gutter={{ base: 'lg', md: 48 }}>
        {/* Esquerda (5/12): fotos, outras cores, sobre o produto e medidas */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="md">
            <Box p="md" className={classes.galleryPane} style={{ borderRadius: 'var(--mantine-radius-md)' }}>
              <Paper pos="relative" w="100%" pt="100%" bg="white">
                <Box pos="absolute" inset={0} p="lg">
                  <ProductImage
                    key={images[activeImg].src + product.id}
                    src={images[activeImg].src}
                    alt={`${productDisplayName(product)} — vista ${images[activeImg].label.toLowerCase()}`}
                    imageProps={{ fit: 'contain', style: { cursor: 'zoom-in' } }}
                    fallback={<Group h="100%" justify="center"><SneakerIcon size={56} color={DIMMED} opacity={0.5} /></Group>}
                  />
                </Box>
              </Paper>
              <Group gap="xs" mt="sm" role="tablist" aria-label="Vistas do produto">
                {images.map((img, i) => (
                  <UnstyledButton key={img.label} onClick={() => setActiveImg(i)} className={classes.thumbButton} data-active={activeImg === i || undefined} role="tab" aria-selected={activeImg === i}>
                    <Box className={classes.thumb}><ProductImage src={img.src} alt="" fallback={<Group h="100%" justify="center"><SneakerIcon size={20} color={DIMMED} /></Group>} /></Box>
                    <Text lh={1.5} size="sm" fw={activeImg === i ? 600 : 400} c={activeImg === i ? undefined : 'dimmed'}>{img.label}</Text>
                  </UnstyledButton>
                ))}
              </Group>
            </Box>

            {/* Troca de cor: outros modelos da mesma linha */}
            {siblings.length > 0 && (
              <Box>
                <Eyebrow>Outras cores da linha {product.line}</Eyebrow>
                <Group gap="xs">
                  <Badge variant="filled" color="brand" size="lg" styles={{ label: { textTransform: 'none' } }}>{colorwayOf(product)}</Badge>
                  {siblings.map(s => (
                    <Button key={s.id} size="compact-sm" variant="default" onClick={() => onSwitch(s)}>{colorwayOf(s)}</Button>
                  ))}
                </Group>
              </Box>
            )}

            {/* FR-308: sobre o produto e medidas — aqui em telas largas; no celular, depois da compra */}
            <Box visibleFrom="md">{about}</Box>
          </Stack>
        </Grid.Col>

        {/* Direita (7/12): a decisão */}
        <Grid.Col span={{ base: 12, md: 7 }}>
        <Stack gap="lg" maw={600}>
          {/* FR-301: categoria · linha · código, nome no padrão Tênis Tesla + linha + cor */}
          <Box>
            <Eyebrow mb={4}>{product.category} · Linha {product.line} · {product.reference}</Eyebrow>
            <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
              <Title order={1}>{productDisplayName(product)}</Title>
              <Tooltip label={isFavorite ? 'Remover dos favoritos' : 'Favoritar'}>
                <ActionIcon onClick={onToggleFav} variant={isFavorite ? 'light' : 'default'} color="brand" size="lg" radius="xl" aria-pressed={isFavorite} aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar'} mt={4}>
                  <HeartIcon size={18} weight={isFavorite ? 'fill' : 'regular'} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Box>

          {/* FR-302: Seu custo, PDV sugerido e a única margem (BR-01 a BR-04) */}
          <Box>
            <Group gap={8} align="baseline">
              <Text className="mono" fw={700} fz={26} lh={1.1}>{formatCurrency(product.price)}</Text>
              <Text size="sm" c="dimmed">Seu custo por par</Text>
            </Group>
            <Group gap="sm" mt={8} align="center">
              <Text className="mono" size="sm" c="dimmed">PDV sugerido {formatCurrency(product.priceRetail)}</Text>
              <Tooltip label={markupLabel(product)}>
                <Badge variant="light" color="teal" radius="sm" ff="monospace" styles={{ label: { textTransform: 'none' } }}>{marginLabel(product)}</Badge>
              </Tooltip>
            </Group>
            <Text size="xs" c="dimmed" mt={6}>Seu custo {COST_BASIS}.</Text>
          </Box>

          {/* FR-303: só razões com dados, cada uma com escopo e período */}
          {reasons.length > 0 && !stuck && (
            <Paper withBorder p="md">
              <Eyebrow mb="sm">Por que comprar este produto</Eyebrow>
              <Stack gap="sm">
                {reasons.map((r, i) => (
                  <Group key={r} gap="sm" wrap="nowrap" align="flex-start">
                    <CheckCircleIcon size={20} weight="fill" color={i === 0 ? 'var(--mantine-color-teal-7)' : 'var(--mantine-color-brand-9)'} style={{ flex: 'none' }} />
                    <Text size="sm" fw={i === 0 ? 600 : 400}>{r}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}

          {/* FR-304: mesmo sinal, data de agir e quantidade do cartão do Radar */}
          {signal && <SignalLine signal={signal} />}

          {stuck && (
            <Paper id="bloco-como-girar" withBorder p="md" bd={entry?.block === 'como-girar' ? '2px solid var(--mantine-color-yellow-6)' : undefined}>
              <Group gap="xs" mb={4}><MegaphoneIcon size={16} /><Text fw={600}>Como girar</Text></Group>
              <Stack gap={2}>
                <Text size="sm">• Crie uma campanha no Marketing IA com este modelo.</Text>
                <Text size="sm">• Coloque na vitrine ou perto do caixa por 15 dias.</Text>
                <Text size="sm">• O Radar não sugere reposição nem combos com este produto enquanto o giro estiver baixo.</Text>
              </Stack>
            </Paper>
          )}

          {sku && sku.peerSalesDiffPct > 0 && (
            <Paper id="bloco-benchmark" withBorder p="md" bd={entry?.block === 'benchmark' ? '2px solid var(--mantine-color-blue-6)' : undefined}>
              <Group gap="xs" mb={4}><UsersThreeIcon size={16} /><Text fw={600}>Benchmark: lojas parecidas</Text></Group>
              <Text size="sm">Lojas parecidas venderam {sku.peerSalesDiffPct}% mais deste modelo que a sua loja, últimos 30 dias.</Text>
              <Text size="sm" c="dimmed">Grupo de {PEER_GROUP_SIZE} lojas da mesma região, porte e posicionamento de preço · dados agregados e anônimos.</Text>
            </Paper>
          )}

          {/* FR-305/306: grade por numeração e resumo */}
          <Box>
            <Eyebrow mb="sm">Grade por numeração</Eyebrow>
            <SizeGradeEditor product={product} value={sizes} onChange={v => { setSizes(v); setTriedEmpty(false); }} suggestion={suggestion} />
            <Box mt="md"><GradeOrderSummary product={product} sizes={sizes} /></Box>
          </Box>

          <Divider />

          {/* FR-307: carrinho de destino e a ação */}
          <Box>
            <Eyebrow mb="sm">Como você quer seguir?</Eyebrow>
            <TargetCartPicker cart={target} clientId={clientId} />
            {/* o botão fica habilitado; com 0 pares ele explica o que falta */}
            <Button fullWidth size="md" mt="sm" onClick={add} disabled={soldOut} leftSection={<ShoppingCartIcon size={18} />}>
              {soldOut ? 'Esgotado' : 'Adicionar ao carrinho'}
            </Button>
            {triedEmpty && n === 0 && <Text size="sm" c="red.7" mt={6}>Selecione ao menos 1 par</Text>}
            <Text size="sm" c="dimmed" mt="sm">Antes de fechar o carrinho, você vê como esse pedido se compara ao mesmo período do ano passado.</Text>
          </Box>

          <Box hiddenFrom="md"><Divider mb="lg" />{about}</Box>
        </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export function CatalogPage({ filters, onFiltersChange, entry, initialSortBy, onBackToRadar }: CatalogPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>(SORT_OPTIONS.some(o => o.value === initialSortBy) ? initialSortBy! : 'lancamento');
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
    if (sortBy === 'menor-preco') return a.price - b.price;
    if (sortBy === 'maior-preco') return b.price - a.price;
    if (sortBy === 'maior-desconto') return (b.priceRetail - b.price) / b.priceRetail - (a.priceRetail - a.price) / a.priceRetail;
    // lançamento: os mais recentes primeiro (sem data de lançamento vão para o fim)
    if (sortBy === 'lancamento') return (storeSku(a.id)?.launchedDaysAgo ?? Infinity) - (storeSku(b.id)?.launchedDaysAgo ?? Infinity);
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

  // ao voltar da página do produto, a grade reabre na mesma altura em que estava
  const gridScroll = useRef(0);
  const openDetail = (p: Product, e?: CatalogEntry) => {
    if (!detailProduct) gridScroll.current = document.querySelector('main')?.scrollTop ?? 0;
    setDetailEntry(e);
    setDetailProduct(p);
  };
  const closeDetail = () => {
    setDetailProduct(null);
    requestAnimationFrame(() => document.querySelector('main')?.scrollTo({ top: gridScroll.current }));
  };

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

  // Página do produto em página inteira, no lugar da grade; "Catálogo" no caminho volta para a grade
  if (detailProduct) {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
        <ProductDetailPage
          key={detailProduct.id}
          product={{ ...detailProduct, isFavorite: favoriteIds.has(detailProduct.id) }}
          entry={detailEntry}
          isFavorite={favoriteIds.has(detailProduct.id)}
          onClose={closeDetail}
          onSwitch={p => openDetail(p, detailEntry?.fromRadar ? { fromRadar: true } : undefined)}
          onToggleFav={() => toggleFav(detailProduct.id)}
          onBackToRadar={onBackToRadar}
        />
      </Box>
    );
  }

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {entry?.fromRadar && onBackToRadar && (
        <Anchor component="button" type="button" fw={600} onClick={onBackToRadar} mb={-16}>
          <Group gap={4} wrap="nowrap"><ArrowLeftIcon size={16} />Voltar ao Radar</Group>
        </Anchor>
      )}
      <CatalogFiltersBar filters={filters} onChange={onFiltersChange} sortBy={sortBy} onSortChange={setSortBy} />

      <Card withBorder shadow="xs" padding={0}>
        <Image src={bannerLimitedAsset} alt="Edição Limitada" h="auto" />
      </Card>

      <Stack gap="lg">
        <Stack gap="md">
          {/* contagem de resultados + filtros ativos removíveis + limpar */}
          <Group gap="sm" wrap="wrap">
            <Text fw={600} aria-live="polite">
              {sorted.length} {sorted.length === 1 ? 'produto' : 'produtos'}
              {viewMode === 'grid' && <Text span c="dimmed" fw={400} inherit> em {models.length} {models.length === 1 ? 'modelo' : 'modelos'}</Text>}
            </Text>
            {activeChips.map(ch => (
              <Button key={ch.key} variant="light" color="brand" size="compact-md" rightSection={<XIcon size={16} />} onClick={ch.remove} aria-label={`Remover filtro ${ch.label}`}>
                {ch.label}
              </Button>
            ))}
            {countActiveFilters(filters) > 0 && (
              <Button variant="subtle" color="brand" size="compact-md" onClick={clearFilters}>Limpar filtros</Button>
            )}
            <SegmentedControl
              ml="auto"
              value={viewMode}
              onChange={v => setViewMode(v as 'grid' | 'list')}
              aria-label="Modo de exibição"
              data={[
                { value: 'grid', label: <Group gap="xs" wrap="nowrap" justify="center"><GridNineIcon size={18} /><Text span inherit>Grade</Text></Group> },
                { value: 'list', label: <Group gap="xs" wrap="nowrap" justify="center"><ListBulletsIcon size={18} /><Text span inherit>Lista</Text></Group> },
              ]}
            />
          </Group>
        </Stack>

        {loading ? (
          viewMode === 'grid'
            ? <CardGridSkeleton count={8} cols={{ base: 1, xs: 2, md: 3, lg: 4 }} imageRatio={1.25} />
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
          // grade de 4 colunas dentro de um painel; 3, 2 e 1 coluna nas telas menores
          <Paper withBorder p={{ base: 'sm', sm: 'md' }}>
          <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing={{ base: 'md', sm: 'lg' }} verticalSpacing={{ base: 'lg', sm: 'xl' }}>
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
          </Paper>
        ) : (
          <Stack gap="sm">
            {sorted.map(product => renderProductCard(product, 'list'))}
          </Stack>
        )}
      </Stack>

    </Stack>
  );
}

