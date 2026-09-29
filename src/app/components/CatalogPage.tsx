import { useState, type ReactNode } from "react";
import { toast } from "../lib/toast";
import { useSmallerThan } from "../lib/responsive";
import {
  ActionIcon, Badge, Box, Button, Card, Chip, CloseButton, ColorSwatch, Divider, Flex, Group, Modal, NumberInput,
  Input, Paper, ScrollArea, SegmentedControl, SimpleGrid, Image, Skeleton, Stack, Table, Text, TextInput, ThemeIcon, Title, UnstyledButton,
  type ImageProps,
} from "@mantine/core";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  GridNineIcon,
  ListBulletsIcon,
  HeartIcon,
  StarIcon,
  ShoppingCartIcon,
  XIcon,
  PackageIcon,
  EyeIcon,
  LightningIcon,
  MinusIcon,
  PlusIcon,
  StorefrontIcon,
  UserCheckIcon,
} from "@phosphor-icons/react";
import { products, Product, formatCurrency, Client } from "../data/mockData";
import bannerLimitedAsset from "../../assets/banner-edicao-limitada.webp";
import interactive from "./interactive.module.css";
import classes from "./CatalogPage.module.css";

import type { CartContext, CartCreator } from "./CartsListPage";
import { CatalogFiltersBar, defaultFilters } from "./CatalogFiltersBar";
import { useMockLoading } from "../lib/useMockLoading";
import { CardGridSkeleton, ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import sticky from "./ui/stickyTable.module.css";

const BORDER_COLOR = 'var(--mantine-color-default-border)';
const BORDER = `1px solid ${BORDER_COLOR}`;
const PRIMARY_TEXT = 'var(--mantine-primary-color-filled)';
const DIMMED = 'var(--mantine-color-dimmed)';
const DASHED_BORDER = `1px dashed ${BORDER_COLOR}`;

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

function CartCreatorTag({ createdBy }: { createdBy?: CartCreator }) {
  if (!createdBy) return null;
  const isLojista = createdBy === 'lojista';
  return (
    <Badge
      mt={4}
      variant="light"
      color="neutral"
      leftSection={isLojista ? <StorefrontIcon size={14} /> : <UserCheckIcon size={14} />}
    >
      {isLojista ? 'Lojista' : 'Representante'}
    </Badge>
  );
}

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

interface CatalogFiltersShape {
  search: string;
  line: string;
  category: string;
  colors: string[];
  priceRange: [number, number];
  priceTable: string;
}


interface CatalogPageProps {
  onNavigate: (view: View) => void;
  onSelectProduct?: (product: Product) => void;
  selectedClient?: Client | null;
  externalFilters?: CatalogFiltersShape;
  onExternalFiltersChange?: (f: CatalogFiltersShape) => void;
  clientCarts?: CartContext[];
  activeCartId?: string | null;
  onPickCart?: (ctx: CartContext) => void;
  onCreateCart?: (name: string) => CartContext | null;
  /** Abre o detalhe deste produto ao entrar no catálogo (ex.: vindo do Radar). */
  initialDetailProductId?: string | null;
  /** Ordenação inicial ao entrar no catálogo (ex.: "mais vendidos" vindo do Radar). */
  initialSortBy?: string | null;
}

const lines = ['Todos', 'Premium', 'Urban', 'Sport'];
const categories = ['Todos', 'Social', 'Casual', 'Esportivo', 'Sandália', 'Bota'];
const collections = ['Todas', 'Inverno 2026', 'Primavera/Verão 2026'];
const SORT_OPTIONS = [
  { value: 'relevância', label: 'Relevância' },
  { value: 'mais vendidos', label: 'Mais vendidos' },
  { value: 'avaliação', label: 'Melhor avaliação' },
  { value: 'menor preço', label: 'Menor preço' },
  { value: 'maior preço', label: 'Maior preço' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <Group gap={2} wrap="nowrap">
      {[1, 2, 3, 4, 5].map(s => (
        <StarIcon
          key={s}
          size={14}
          weight={s <= Math.round(rating) ? 'fill' : 'regular'}
          color={s <= Math.round(rating) ? 'var(--mantine-color-neutral-9)' : DIMMED}
          opacity={s <= Math.round(rating) ? 1 : 0.3}
        />
      ))}
      <Text lh={1.5} c="dimmed" ml={4} size="sm">{rating}</Text>
    </Group>
  );
}

// Stepper de quantidade: botões de 36px (área de clique confortável também no desktop)
function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <ActionIcon size="input-sm" variant="default" onClick={() => onChange(value - 1)} aria-label="Diminuir quantidade">
        <MinusIcon size={16} />
      </ActionIcon>
      <NumberInput
        value={value}
        onChange={v => onChange(Number(v) || 0)}
        hideControls
        placeholder="0"
        w={56}
        size="sm"
        aria-label="Quantidade"
        styles={{ input: { textAlign: 'center', paddingInline: 4 } }}
      />
      <ActionIcon size="input-sm" variant="default" onClick={() => onChange(value + 1)} aria-label="Aumentar quantidade">
        <PlusIcon size={16} />
      </ActionIcon>
    </Group>
  );
}

function GradeHeader({ onClose }: { onClose?: () => void }) {
  return (
    <Group justify="space-between" mb={8} wrap="nowrap">
      <Text lh={1.5} fw={600}>
        Compra rápida — grade
      </Text>
      {onClose && (
        <CloseButton onClick={onClose} aria-label="Fechar compra rápida" />
      )}
    </Group>
  );
}

function GradeCompact({ product, onAdd, onClose }: {
  product: Product; onAdd: (qtys: Record<string, number>) => void; onClose?: () => void;
}) {
  const sizes = Object.keys(product.grades);
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(sizes.map(s => [s, 0]))
  );
  const total = Object.values(qtys).reduce((a, b) => a + b, 0);
  const subtotal = total * product.price;
  const set = (s: string, v: number) => setQtys(q => ({ ...q, [s]: Math.max(0, v) }));

  return (
    <>
      <Divider color={BORDER_COLOR} />
      <Box px="sm" pb="sm" pt={8} bg="var(--mantine-color-default-hover)">
        <GradeHeader onClose={onClose} />
        <Stack gap={4}>
          {sizes.map(s => (
            <Paper key={s} px={8} py={4}>
              {/* Em cards estreitos o stepper desce para baixo da numeração em vez de estourar */}
              <Group justify="space-between" gap={4}>
                <Box>
                  <Text lh={1.5} fw={600}>Nº {s}</Text>
                  <Text lh={1.5} c="teal.6" size="sm">{product.grades[s]} disp.</Text>
                </Box>
                <QtyStepper value={qtys[s]} onChange={v => set(s, v)} />
              </Group>
            </Paper>
          ))}
        </Stack>
        <Group justify="space-between" mt={8} mb={8}>
          <Text lh={1.5} c="dimmed" size="sm">
            {total} {total === 1 ? 'par' : 'pares'}
          </Text>
          <Text lh={1.5} className="mono" fw={700}>{formatCurrency(subtotal)}</Text>
        </Group>
        <Button
          fullWidth
          onClick={() => onAdd(qtys)}
          disabled={total === 0}
          leftSection={<ShoppingCartIcon size={18} />}
        >
          Adicionar ao Carrinho
        </Button>
      </Box>
    </>
  );
}

// larguras da grade: rótulo · uma coluna por numeração (cabe o stepper de 36px) · total
const GRADE_LABEL_W = 120;
const GRADE_COL_W = 164;
const GRADE_TOTAL_W = 80;

function GradeInline({ product, onAdd, onClose, onCancel }: {
  product: Product; onAdd: (qtys: Record<string, number>) => void; onClose?: () => void;
  /** Botão "Fechar" no rodapé (à esquerda da ação principal) — usado no modal de detalhes. */
  onCancel?: () => void;
}) {
  const sizes = Object.keys(product.grades);
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(sizes.map(s => [s, 0]))
  );
  const total = Object.values(qtys).reduce((a, b) => a + b, 0);
  const subtotal = total * product.price;
  const set = (s: string, v: number) => setQtys(q => ({ ...q, [s]: Math.max(0, v) }));

  // Rótulo da linha: menor e esmaecido, em peso regular — o destaque fica nos números
  const rowLabel = (text: string) => (
    <Table.Th w={GRADE_LABEL_W} miw={GRADE_LABEL_W} fz="sm" fw={400} c="dimmed">{text}</Table.Th>
  );

  return (
    <>
      <Divider color={BORDER_COLOR} />
      <Box px="sm" pb="sm" pt={8} bg="var(--mantine-color-default-hover)">
        <GradeHeader onClose={onClose} />

        {/* Grade larga (uma coluna por numeração): rola na horizontal, mas a coluna de rótulos
            (Numeração / Estoque / Quantidade) fica fixa à esquerda. Números alinhados à direita. */}
        <Paper withBorder>
          <Table.ScrollContainer minWidth={GRADE_LABEL_W + GRADE_TOTAL_W + sizes.length * GRADE_COL_W} type="native">
            <Table className={sticky.firstCol} verticalSpacing={8} horizontalSpacing="sm" withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  {rowLabel('Numeração')}
                  {sizes.map(s => (
                    <Table.Th key={s} miw={GRADE_COL_W} ta="right" fw={600}>Nº {s}</Table.Th>
                  ))}
                  <Table.Th w={GRADE_TOTAL_W} ta="right" fz="sm" fw={400} c="dimmed">Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  {rowLabel('Estoque')}
                  {sizes.map(s => (
                    <Table.Td key={s} ta="right" className="mono" c="teal.6">{product.grades[s]}</Table.Td>
                  ))}
                  <Table.Td ta="right" className="mono" c="dimmed">
                    {Object.values(product.grades).reduce((a, b) => a + b, 0)}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  {rowLabel('Quantidade')}
                  {sizes.map(s => (
                    <Table.Td key={s} ta="right">
                      <Group justify="flex-end" wrap="nowrap">
                        <QtyStepper value={qtys[s]} onChange={v => set(s, v)} />
                      </Group>
                    </Table.Td>
                  ))}
                  <Table.Td ta="right" className="mono" fw={700}>{total}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>

        {/* Fechar à esquerda, ação principal à direita */}
        <Group justify="flex-end" gap="sm" mt={8} mb={4}>
          <Text lh={1.5} c="dimmed" size="sm" mr="auto">
            {total} {total === 1 ? 'par' : 'pares'} · <Text lh={1.5} span className="mono" c="var(--mantine-color-text)" fw={700}>{formatCurrency(subtotal)}</Text>
          </Text>
          <Group gap="sm">
            {onCancel && (
              <Button variant="default" onClick={onCancel}>Fechar</Button>
            )}
            <Button
              onClick={() => onAdd(qtys)}
              disabled={total === 0}
              leftSection={<ShoppingCartIcon size={18} />}
            >
              Adicionar ao Carrinho
            </Button>
          </Group>
        </Group>
      </Box>
    </>
  );
}

const availColor: Record<Product['availability'], string> = {
  'disponível': 'teal',
  'baixo estoque': 'yellow',
  'esgotado': 'red',
};

function ProductCard({ product, onQuickBuy, onOpenDetail, onToggleFav, viewMode, gradeOpen, onAddGrade, onCloseGrade }: {
  product: Product;
  onOrder: () => void;
  onQuickBuy: () => void;
  onOpenDetail: () => void;
  onToggleFav: () => void;
  viewMode: 'grid' | 'list';
  gradeOpen: boolean;
  onAddGrade: (qtys: Record<string, number>) => void;
  onCloseGrade: () => void;
}) {
  const availBadgeColor = availColor[product.availability];

  if (viewMode === 'list') {
    return (
      <Card withBorder padding={0}>
        {/* Abaixo de sm o bloco de preço/ações desce para uma linha própria */}
        <Flex p={{ base: 'sm', sm: 'md' }} gap={{ base: 'sm', sm: 'md' }} wrap={{ base: 'wrap', sm: 'nowrap' }} align="center">
          <UnstyledButton onClick={onOpenDetail} w={{ base: 64, sm: 80 }} h={{ base: 64, sm: 80 }} flex="none">
            <Paper bg="white" h="100%">
              <ProductImage
                src={product.image}
                alt={product.name}
                fallback={
                  <Group w="100%" h="100%" justify="center">
                    <PackageIcon size={24} color={DIMMED} opacity={0.4} />
                  </Group>
                }
              />
            </Paper>
          </UnstyledButton>
          <UnstyledButton onClick={onOpenDetail} flex={1} miw={0}>
            <Group gap={8} align="flex-start" wrap="nowrap">
              <Box flex={1} miw={0}>
                <Text lh={1.5} c="dimmed" size="sm" fw={600}>{product.reference}</Text>
                <Text lh={1.5} fw={600}>{product.name}</Text>
                <Text lh={1.5} c="dimmed" size="sm">{product.line} · {product.category} · {product.collection}</Text>
              </Box>
              <Box visibleFrom="xs"><StarRating rating={product.rating} /></Box>
            </Group>
            <Group gap="sm" mt={8}>
              <Badge variant="light" color={availBadgeColor}>{product.availability}</Badge>
              <Text lh={1.5} c="dimmed" size="sm">{product.material}</Text>
              <Text lh={1.5} c="dimmed" size="sm">{product.soldUnits.toLocaleString('pt-BR')} vendidos</Text>
            </Group>
          </UnstyledButton>
          <Flex
            gap={8}
            direction={{ base: 'row', sm: 'column' }}
            align={{ base: 'center', sm: 'flex-end' }}
            justify="space-between"
            wrap="wrap"
            w={{ base: '100%', sm: 'auto' }}
            flex="none"
          >
            <Box ta={{ base: 'left', sm: 'right' }}>
              <Text lh={1.5} className="mono" size="lg" fw={700}>{formatCurrency(product.price)}</Text>
              <Text lh={1.5} c="dimmed" td="line-through" size="sm">{formatCurrency(product.priceRetail)}</Text>
              <Text lh={1.5} c={PRIMARY_TEXT} size="sm" fw={600}>+ IVA</Text>
            </Box>
            {/* Secundária (favoritar) à esquerda, principal (compra rápida) à direita */}
            <Group gap="sm" justify="flex-end">
              <Button
                onClick={onToggleFav}
                variant={product.isFavorite ? 'light' : 'default'}
                color={product.isFavorite ? 'neutral' : 'gray'}
                leftSection={<HeartIcon size={18} weight={product.isFavorite ? 'fill' : 'regular'} />}
                aria-pressed={product.isFavorite}
              >
                {product.isFavorite ? 'Favoritado' : 'Favoritar'}
              </Button>
              <Button
                onClick={onQuickBuy}
                disabled={product.availability === 'esgotado'}
                leftSection={<LightningIcon size={18} />}
              >
                Compra Rápida
              </Button>
            </Group>
          </Flex>
        </Flex>
        {gradeOpen && (
          <GradeCompact product={product} onAdd={onAddGrade} onClose={onCloseGrade} />
        )}
      </Card>
    );
  }

  return (
    <Card withBorder padding={0} className={classes.card}>
      {/* Imagem clicável; favoritar e ações ficam por cima como irmãos (botão não pode ficar dentro de botão) */}
      <Box pos="relative">
        <UnstyledButton
          onClick={onOpenDetail}
          pos="relative"
          display="block"
          w="100%"
          pt="80%"
          bg="white"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <Box pos="absolute" inset={0}>
            <ProductImage
              src={product.image}
              alt={product.name}
              imageProps={{ fit: 'contain', pt: 8, px: 8, className: classes.cardImage }}
              fallback={
                <Group h="100%" justify="center">
                  <PackageIcon size={40} color={DIMMED} opacity={0.3} />
                </Group>
              }
            />
          </Box>
        </UnstyledButton>
        {/* Favoritar com ícone + texto, compacto para caber no card estreito */}
        <Button
          onClick={onToggleFav}
          pos="absolute"
          top={8}
          right={8}
          size="sm"
          px={10}
          variant={product.isFavorite ? 'light' : 'default'}
          color="neutral"
          leftSection={<HeartIcon size={16} weight={product.isFavorite ? 'fill' : 'regular'} />}
          aria-pressed={!!product.isFavorite}
        >
          {product.isFavorite ? 'Favoritado' : 'Favoritar'}
        </Button>
        {/* Ações sobre a imagem: aparecem no hover/foco; em telas de toque ficam sempre visíveis */}
        <Group pos="absolute" left={8} right={8} bottom={8} gap="sm" wrap="nowrap" className={classes.overlay}>
          {/* Cards estreitos (2 colunas no celular): o card inteiro já abre os detalhes */}
          <Button
            onClick={onOpenDetail}
            flex={1}
            miw={0}
            px={8}
            variant="default"
            visibleFrom="sm"
            leftSection={<EyeIcon size={18} />}
          >
            Detalhes
          </Button>
          <Button
            onClick={onQuickBuy}
            flex={1}
            miw={0}
            px={{ base: 4, sm: 8 }}
            color="neutral"
            classNames={{ section: classes.quickBuySection }}
            disabled={product.availability === 'esgotado'}
            leftSection={<LightningIcon size={18} />}
          >
            Compra Rápida
          </Button>
        </Group>
      </Box>

      <UnstyledButton onClick={onOpenDetail} display="block" w="100%" p="sm">
        <Badge variant="light" color={availBadgeColor} mb={8}>
          {product.availability}
        </Badge>
        <Text lh={1.5} c="dimmed" size="sm" fw={600}>{product.line} · {product.reference}</Text>
        <Text lh={1.5} mt={2} truncate fw={600}>{product.name}</Text>
        <Text lh={1.5} c="dimmed" size="sm">{product.material}</Text>

        <Group justify="space-between" mt={8} gap={4} wrap="nowrap">
          <StarRating rating={product.rating} />
          <Text lh={1.5} c="dimmed" size="sm" flex="none" visibleFrom="xs">{product.soldUnits.toLocaleString('pt-BR')} un.</Text>
        </Group>

        <Divider mt="sm" color={BORDER_COLOR} />
        <Group justify="space-between" pt="sm" wrap="nowrap">
          <Box>
            <Text lh={1.5} className="mono" fw={700}>{formatCurrency(product.price)}</Text>
            <Text lh={1.5} c="dimmed" td="line-through" size="sm">{formatCurrency(product.priceRetail)}</Text>
            <Text lh={1.5} c={PRIMARY_TEXT} size="sm" fw={600}>+ IVA</Text>
          </Box>
          {/* Nos cards estreitos do celular (2 colunas) as cores ficam só no detalhe */}
          <Group gap={6} wrap="nowrap" visibleFrom="sm">
            {product.colors.slice(0, 3).map(color => (
              <Text lh={1.5} key={color} c="dimmed" size="sm">
                {color === product.colors[0] ? color : '·'}
              </Text>
            ))}
            {product.colors.length > 1 && (
              <Text lh={1.5} c="dimmed" size="sm">+{product.colors.length - 1}</Text>
            )}
          </Group>
        </Group>
      </UnstyledButton>

      {gradeOpen && (
        <GradeCompact product={product} onAdd={onAddGrade} onClose={onCloseGrade} />
      )}
    </Card>
  );
}


function ProductDetailModal({ product, onClose, onAddGrade, onToggleFav, isFavorite }: {
  product: Product; onClose: () => void; onAddGrade: (qtys: Record<string, number>) => void;
  onToggleFav: () => void; isFavorite: boolean;
}) {
  const [activeImg, setActiveImg] = useState(0);
  // cada miniatura tem um rótulo visível dizendo qual vista do produto ela mostra
  const images = [
    { src: product.image, label: 'Lateral' },
    { src: product.image, label: 'Frontal' },
    { src: product.image, label: 'Solado' },
  ];
  // Abaixo do breakpoint sm o modal ocupa a tela inteira
  const fullScreen = useSmallerThan('sm');
  return (
    <Modal
      opened
      onClose={onClose}
      centered
      size="56rem"
      fullScreen={fullScreen}
      radius={fullScreen ? 0 : undefined}
      padding={0}
      overlayProps={{ backgroundOpacity: 0.7 }}
      title={
        <Text lh={1.5} component="span" c="dimmed" size="sm" fw={600}>
          {product.line} · {product.reference}
        </Text>
      }
      styles={{
        content: { display: 'flex', flexDirection: 'column', maxHeight: fullScreen ? '100dvh' : '90vh', overflow: 'hidden' },
        header: { padding: '12px 20px', minHeight: 0, borderBottom: BORDER },
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 },
      }}
    >
      <Box className={classes.detailBody}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
          <Stack gap="sm" p="md" bg="var(--mantine-color-gray-0)">
            <Paper pos="relative" w="100%" pt="90%" bg="white">
              <Box pos="absolute" inset={0} p={16}>
                <ProductImage
                  key={images[activeImg].src}
                  src={images[activeImg].src}
                  alt={`${product.name} — vista ${images[activeImg].label.toLowerCase()}`}
                  imageProps={{ fit: 'contain' }}
                  fallback={
                    <Group h="100%" justify="center">
                      <PackageIcon size={48} color={DIMMED} opacity={0.3} />
                    </Group>
                  }
                />
              </Box>
            </Paper>
            <Group gap={8} role="tablist" aria-label="Vistas do produto">
              {images.map((img, i) => (
                <UnstyledButton
                  key={img.label}
                  onClick={() => setActiveImg(i)}
                  className={classes.thumbButton}
                  data-active={activeImg === i || undefined}
                  role="tab"
                  aria-selected={activeImg === i}
                >
                  <Box className={classes.thumb}>
                    <ProductImage src={img.src} alt="" />
                  </Box>
                  <Text lh={1.5} size="sm" fw={activeImg === i ? 600 : 400} c={activeImg === i ? undefined : 'dimmed'}>
                    {img.label}
                  </Text>
                </UnstyledButton>
              ))}
            </Group>
          </Stack>
          <Stack gap="md" p={{ base: 'md', sm: 'lg' }}>
            <Box>
              <Group justify="space-between" align="flex-start" gap={8} wrap="nowrap">
                <Title order={2}>{product.name}</Title>
                <Button
                  onClick={onToggleFav}
                  variant={isFavorite ? 'light' : 'default'}
                  color={isFavorite ? 'neutral' : 'gray'}
                  flex="none"
                  leftSection={<HeartIcon size={18} weight={isFavorite ? 'fill' : 'regular'} />}
                  aria-pressed={isFavorite}
                >
                  {isFavorite ? 'Favoritado' : 'Favoritar'}
                </Button>
              </Group>
              <Group gap="sm" mt={4}>
                <StarRating rating={product.rating} />
                <Text lh={1.5} c="dimmed" size="sm">{product.soldUnits.toLocaleString('pt-BR')} vendidos</Text>
              </Group>
            </Box>
            <Group gap="sm" align="baseline">
              <Text lh={1.5} className="mono" size="xl" fw={700}>{formatCurrency(product.price)}</Text>
              <Text lh={1.5} c="dimmed" td="line-through">{formatCurrency(product.priceRetail)}</Text>
              <Text lh={1.5} c={PRIMARY_TEXT} size="sm" fw={600}>+ IVA</Text>
            </Group>
            <Text lh={1.6}>{product.description}</Text>
            {/* Especificações em uma coluna: rótulo acima do valor, leitura pela borda esquerda */}
            <Stack gap="md">
              <Box>
                <Text lh={1.5} c="dimmed" size="sm">Material</Text>
                <Text lh={1.5} mt={2} fw={600}>{product.material}</Text>
              </Box>
              <Box>
                <Text lh={1.5} c="dimmed" size="sm">Coleção</Text>
                <Text lh={1.5} mt={2} fw={600}>{product.collection}</Text>
              </Box>
            </Stack>
            <Box>
              <Text lh={1.5} c="dimmed" mb={6} size="sm">Cores</Text>
              <Group gap={6}>
                {product.colors.map(c => (
                  <Badge key={c} variant="light" color="gray">{c}</Badge>
                ))}
              </Group>
            </Box>
          </Stack>
        </SimpleGrid>
      </Box>
      <Box flex="none">
        <GradeInline product={product} onAdd={onAddGrade} onCancel={onClose} />
      </Box>
    </Modal>
  );
}

function CartOption({ cart, selected, onClick }: { cart: CartContext; selected: boolean; onClick: () => void }) {
  return (
    <Paper
      component="button"
      type="button"
      onClick={onClick}
      withBorder
      p="sm"
      className={`${interactive.cardButton} ${interactive.choiceCard}`}
      data-checked={selected || undefined}
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={36} variant="light" color="neutral">
          <ShoppingCartIcon size={18} />
        </ThemeIcon>
        <Box flex={1} miw={0}>
          <Text lh={1.5} truncate fw={600}>{cart.cartName}</Text>
          <Group gap={4} wrap="nowrap">
            <StorefrontIcon size={14} color={DIMMED} />
            <Text lh={1.5} c="dimmed" size="sm">{cart.clientName}</Text>
          </Group>
          <CartCreatorTag createdBy={cart.createdBy} />
        </Box>
        {selected && (
          <Text lh={1.5} c={PRIMARY_TEXT} size="sm" fw={700}>Atual</Text>
        )}
      </Group>
    </Paper>
  );
}

const CART_MODAL_STYLES = {
  content: { overflow: 'hidden' },
  body: { padding: 0 },
} as const;

export function CatalogPage({ onNavigate, externalFilters, onExternalFiltersChange, clientCarts, activeCartId, onPickCart, onCreateCart, initialDetailProductId, initialSortBy }: CatalogPageProps) {
  const usingExternal = !!externalFilters;
  const [internalSearch, setInternalSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLine, setSelectedLine] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCollection, setSelectedCollection] = useState('Todas');
  const [sortBy, setSortBy] = useState(initialSortBy ?? 'relevância');
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    new Set(products.filter(p => p.isFavorite).map(p => p.id))
  );
  const [gradeOpenId, setGradeOpenId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(
    () => products.find(p => p.id === initialDetailProductId) ?? null
  );
  // Multi-cart picker
  const multiCartEnabled = Array.isArray(clientCarts);
  const [pendingAdd, setPendingAdd] = useState<{ product: Product; qtys: Record<string, number> } | null>(null);
  const [confirmAdd, setConfirmAdd] = useState<{ product: Product; qtys: Record<string, number>; selectedCartId: string } | null>(null);
  const [creatingNewName, setCreatingNewName] = useState('');
  const [creatingMode, setCreatingMode] = useState(false);
  // Simula a busca dos produtos: skeleton da grade/lista enquanto carrega
  const loading = useMockLoading();
  // Filtro da lista de carrinhos (aparece com 7+ carrinhos)
  const [cartQuery, setCartQuery] = useState('');
  const allCarts = clientCarts ?? [];
  const showCartFilter = allCarts.length >= 7;
  const cartQ = cartQuery.trim().toLowerCase();
  const visibleCarts = showCartFilter && cartQ
    ? allCarts.filter(c => c.cartName.toLowerCase().includes(cartQ) || c.clientName.toLowerCase().includes(cartQ) || c.id.toLowerCase().includes(cartQ))
    : allCarts;
  const cartFilter = showCartFilter ? (
    <TextInput
      aria-label="Buscar carrinho"
      placeholder="Buscar por nome ou código"
      leftSection={<MagnifyingGlassIcon size={18} />}
      value={cartQuery}
      onChange={e => setCartQuery(e.currentTarget.value)}
    />
  ) : null;
  const cartFilterEmpty = showCartFilter && cartQ && visibleCarts.length === 0 ? (
    <EmptyState
      withBorder={false}
      icon={MagnifyingGlassIcon}
      title="Nenhum carrinho encontrado"
      description={`Nenhum carrinho com "${cartQuery.trim()}". Confira o nome ou limpe a busca para ver todos.`}
      action={{ label: 'Limpar Busca', onClick: () => setCartQuery(''), forward: false }}
    />
  ) : null;

  const commitAdd = (p: Product, qtys: Record<string, number>, cartName?: string) => {
    const total = Object.values(qtys).reduce((a, b) => a + b, 0);
    setGradeOpenId(null);
    toast.success(
      `${total} ${total === 1 ? 'par' : 'pares'} de ${p.name} adicionados${cartName ? ` em "${cartName}"` : ' ao carrinho'}`,
      'Revise as quantidades e envie o pedido em Carrinho',
    );
  };
  const addGrade = (p: Product, qtys: Record<string, number>) => {
    const total = Object.values(qtys).reduce((a, b) => a + b, 0);
    if (total === 0) return;
    setCartQuery('');
    if (multiCartEnabled) {
      // Se já tem carrinho ativo, confirma antes de adicionar
      if (activeCartId) {
        setConfirmAdd({ product: p, qtys, selectedCartId: activeCartId });
        setGradeOpenId(null);
        return;
      }
      // Se não tem nenhum carrinho pro cliente, cria um automaticamente
      if (!clientCarts || clientCarts.length === 0) {
        const ctx = onCreateCart?.('Novo carrinho');
        commitAdd(p, qtys, ctx?.cartName);
        return;
      }
      // Se tem carrinhos mas nenhum ativo, mostra o picker
      setPendingAdd({ product: p, qtys });
      setCreatingMode(false);
      setCreatingNewName('');
      return;
    }
    commitAdd(p, qtys);
  };


  const search = usingExternal ? externalFilters!.search : internalSearch;
  const setSearch = (v: string) => {
    if (usingExternal && onExternalFiltersChange) onExternalFiltersChange({ ...externalFilters!, search: v });
    else setInternalSearch(v);
  };
  const effLine = usingExternal ? externalFilters!.line : selectedLine;
  const effCategory = usingExternal ? externalFilters!.category : selectedCategory;
  const effColors = usingExternal ? externalFilters!.colors : [];
  const effPriceRange = usingExternal ? externalFilters!.priceRange : null;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase()) ||
      p.line.toLowerCase().includes(search.toLowerCase());
    const matchLine = effLine === 'Todos' || p.line === effLine;
    const matchCat = effCategory === 'Todos' || p.category === effCategory;
    const matchCol = usingExternal || selectedCollection === 'Todas' || p.collection === selectedCollection;
    const matchColors = effColors.length === 0 || p.colors.some(c => effColors.includes(c));
    const matchPrice = !effPriceRange || (p.price >= effPriceRange[0] && p.price <= effPriceRange[1]);
    return matchSearch && matchLine && matchCat && matchCol && matchColors && matchPrice;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'menor preço') return a.price - b.price;
    if (sortBy === 'maior preço') return b.price - a.price;
    if (sortBy === 'mais vendidos') return b.soldUnits - a.soldUnits;
    if (sortBy === 'avaliação') return b.rating - a.rating;
    return 0;
  });

  const toggleFav = (id: string) => {
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasActiveFilters = selectedLine !== 'Todos' || selectedCategory !== 'Todos' || selectedCollection !== 'Todas';
  const clearInternalFilters = () => { setSelectedLine('Todos'); setSelectedCategory('Todos'); setSelectedCollection('Todas'); };
  // Estado vazio: limpa busca e filtros (os da barra do topo também); a tabela de preço continua
  const clearSearchAndFilters = () => {
    if (usingExternal && onExternalFiltersChange) {
      onExternalFiltersChange({ ...defaultFilters, priceTable: externalFilters!.priceTable });
    } else {
      setInternalSearch('');
      clearInternalFilters();
    }
  };

  const renderChipFilter = (label: string, options: string[], value: string, onSelect: (v: string) => void) => (
    <Box>
      <Text lh={1.5} mb={8} fw={600}>{label}</Text>
      <Chip.Group multiple={false} value={value} onChange={onSelect}>
        <Group gap="sm">
          {options.map(o => (
            <Chip
              key={o}
              value={o}
              variant="filled"
              icon={null}
              styles={{ iconWrapper: { display: 'none' } }}
            >
              {o}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
    </Box>
  );

  const renderProductCard = (product: Product, mode: 'grid' | 'list') => (
    <ProductCard
      key={product.id}
      product={{ ...product, isFavorite: favoriteIds.has(product.id) }}
      viewMode={mode}
      onOrder={() => onNavigate('order-grade')}
      onQuickBuy={() => setGradeOpenId(gradeOpenId === product.id ? null : product.id)}
      onOpenDetail={() => setDetailProduct(product)}
      onToggleFav={() => toggleFav(product.id)}
      gradeOpen={gradeOpenId === product.id}
      onAddGrade={(qtys) => addGrade(product, qtys)}
      onCloseGrade={() => setGradeOpenId(null)}
    />
  );

  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* Tabela de preço e filtros no topo da página */}
      {usingExternal && onExternalFiltersChange && (
        <CatalogFiltersBar filters={externalFilters!} onChange={onExternalFiltersChange} />
      )}

      {/* Promo Banner */}
      <Card withBorder shadow="xs" padding={0}>
        <Image src={bannerLimitedAsset} alt="Edição Limitada" h="auto" />
      </Card>

      {/* Header + Controls */}
      <Group gap="sm" wrap="wrap">
        {/* Abaixo de sm a busca ocupa a linha inteira; filtros e modo de exibição ficam na linha de baixo */}
        <TextInput
          flex={{ base: '1 1 100%', sm: 1 }}
          miw={{ sm: 200 }}
          placeholder="Buscar por nome, referência ou linha"
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

        {!usingExternal && (
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="default"
            leftSection={<FunnelIcon size={18} />}
            rightSection={hasActiveFilters ? (
              <ColorSwatch color="var(--mantine-color-neutral-9)" size={8} withShadow={false} />
            ) : undefined}
            aria-expanded={showFilters}
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        )}

        {/* Modo de exibição com ícone + texto */}
        <SegmentedControl
          value={viewMode}
          onChange={v => setViewMode(v as 'grid' | 'list')}
          aria-label="Modo de exibição"
          data={[
            { value: 'grid', label: <Group gap={6} wrap="nowrap" justify="center"><GridNineIcon size={18} /><Text span inherit>Grade</Text></Group> },
            { value: 'list', label: <Group gap={6} wrap="nowrap" justify="center"><ListBulletsIcon size={18} /><Text span inherit>Lista</Text></Group> },
          ]}
        />
      </Group>

      {/* Ordenação: 5 opções fixas → chips de escolha única (radio), sempre visíveis; quebram linha em telas estreitas */}
      <Input.Wrapper label="Ordenar por" labelElement="div" id="catalog-sort">
        <Chip.Group multiple={false} value={sortBy} onChange={v => v && setSortBy(v)}>
          <Group gap="sm" mt={4} role="radiogroup" aria-labelledby="catalog-sort-label">
            {SORT_OPTIONS.map(o => (
              <Chip
                key={o.value}
                value={o.value}
                variant="filled"
                icon={null}
                styles={{ iconWrapper: { display: 'none' } }}
              >
                {o.label}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
      </Input.Wrapper>

      {/* Filter Panel */}
      {!usingExternal && showFilters && (
        <Paper withBorder p="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {renderChipFilter('Linha', lines, selectedLine, setSelectedLine)}
            {renderChipFilter('Categoria', categories, selectedCategory, setSelectedCategory)}
            {renderChipFilter('Coleção', collections, selectedCollection, setSelectedCollection)}
          </SimpleGrid>
          {hasActiveFilters && (
            <Button
              onClick={clearInternalFilters}
              mt="sm"
              variant="subtle"
              color="neutral"
              leftSection={<XIcon size={16} />}
            >
              Limpar Filtros
            </Button>
          )}
        </Paper>
      )}

      {/* Filtros ativos: cada um é um botão que remove o filtro */}
      {hasActiveFilters && (
        <Group justify="flex-end" gap="sm">
          {selectedLine !== 'Todos' && (
            <Button
              variant="light"
              color="neutral"
              rightSection={<XIcon size={16} />}
              onClick={() => setSelectedLine('Todos')}
              aria-label={`Remover filtro de linha: ${selectedLine}`}
            >
              Linha: {selectedLine}
            </Button>
          )}
          {selectedCategory !== 'Todos' && (
            <Button
              variant="light"
              color="neutral"
              rightSection={<XIcon size={16} />}
              onClick={() => setSelectedCategory('Todos')}
              aria-label={`Remover filtro de categoria: ${selectedCategory}`}
            >
              Categoria: {selectedCategory}
            </Button>
          )}
          {selectedCollection !== 'Todas' && (
            <Button
              variant="light"
              color="neutral"
              rightSection={<XIcon size={16} />}
              onClick={() => setSelectedCollection('Todas')}
              aria-label={`Remover filtro de coleção: ${selectedCollection}`}
            >
              Coleção: {selectedCollection}
            </Button>
          )}
        </Group>
      )}

      {/* Products Grid/List — skeleton com o mesmo formato enquanto carrega */}
      {loading ? (
        viewMode === 'grid'
          ? <CardGridSkeleton count={6} cols={{ base: 2, sm: 3 }} imageRatio={1.25} />
          : <ListSkeleton rows={5} withAvatar />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="Nenhum produto encontrado"
          description={usingExternal
            ? 'Nenhum produto combina com a busca e os filtros do topo da página. Limpe a busca e os filtros para ver o catálogo inteiro.'
            : 'Nenhum produto combina com a busca e os filtros atuais. Limpe a busca e os filtros para ver o catálogo inteiro.'}
          action={{ label: 'Limpar Busca e Filtros', onClick: clearSearchAndFilters, forward: false }}
          suggestions={[
            {
              label: 'Ver mais vendidos',
              description: 'Catálogo inteiro, dos modelos que mais vendem para os que menos vendem',
              icon: LightningIcon,
              onClick: () => { clearSearchAndFilters(); setSortBy('mais vendidos'); },
            },
            {
              label: 'Ver mais bem avaliados',
              description: 'Catálogo inteiro, ordenado pela avaliação dos lojistas',
              icon: StarIcon,
              onClick: () => { clearSearchAndFilters(); setSortBy('avaliação'); },
            },
          ]}
        />
      ) : viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing={{ base: 'sm', sm: 'md' }} className={classes.grid}>
          {sorted.map(product => renderProductCard(product, 'grid'))}
        </SimpleGrid>
      ) : (
        <Stack gap="sm">
          {sorted.map(product => renderProductCard(product, 'list'))}
        </Stack>
      )}

      {detailProduct && (
        <ProductDetailModal
          product={{ ...detailProduct, isFavorite: favoriteIds.has(detailProduct.id) }}
          isFavorite={favoriteIds.has(detailProduct.id)}
          onClose={() => setDetailProduct(null)}
          onAddGrade={(qtys) => { addGrade(detailProduct, qtys); setDetailProduct(null); }}
          onToggleFav={() => toggleFav(detailProduct.id)}
        />
      )}


      <Modal
        opened={!!confirmAdd}
        onClose={() => setConfirmAdd(null)}
        centered
        size="26rem"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.6 }}
        styles={CART_MODAL_STYLES}
      >
        {confirmAdd && (
          <>
            {/* Cabeçalho próprio: título à esquerda, X grande (44px) no canto superior direito */}
            <Group justify="space-between" align="flex-start" pl="lg" pr="sm" py="sm" gap="sm" wrap="nowrap">
              <Box miw={0} pt={8}>
                <Title order={3}>Adicionar ao carrinho</Title>
                <Text lh={1.5} c="dimmed" mt={4} size="sm">
                  {Object.values(confirmAdd.qtys).reduce((a, b) => a + b, 0)} pares de <Text lh={1.5} span c="var(--mantine-color-text)" fw={600} inherit>{confirmAdd.product.name}</Text>. Escolha o carrinho de destino.
                </Text>
              </Box>
              <CloseButton onClick={() => setConfirmAdd(null)} aria-label="Fechar" flex="none" />
            </Group>
            <Divider color={BORDER_COLOR} />
            <ScrollArea.Autosize mah="40vh" type="auto">
              <Stack gap="sm" px="lg" py="md">
                {cartFilter}
                {cartFilterEmpty}
                {visibleCarts.map(c => (
                  <CartOption
                    key={c.id}
                    cart={c}
                    selected={confirmAdd.selectedCartId === c.id}
                    onClick={() => setConfirmAdd(prev => prev ? { ...prev, selectedCartId: c.id } : prev)}
                  />
                ))}
                {(clientCarts ?? []).length === 0 && (
                  <EmptyState
                    withBorder={false}
                    icon={ShoppingCartIcon}
                    title="Este cliente ainda não tem carrinhos"
                    description="Crie um carrinho para adicionar os pares."
                  />
                )}
                {/* Criar outro carrinho fica na lista; o rodapé tem só Cancelar e a ação principal */}
                <Button
                  onClick={() => {
                    setConfirmAdd(null);
                    setPendingAdd({ product: confirmAdd.product, qtys: confirmAdd.qtys });
                    setCreatingMode(true);
                    setCreatingNewName('');
                  }}
                  variant="default"
                  bd={DASHED_BORDER}
                  fullWidth
                  leftSection={<PlusIcon size={16} />}
                >
                  Criar Novo Carrinho
                </Button>
              </Stack>
            </ScrollArea.Autosize>
            <Divider color={BORDER_COLOR} />
            {/* Cancelar à esquerda, principal à direita */}
            <Group px="lg" py="md" gap="sm" justify="flex-end">
              <Button variant="default" onClick={() => setConfirmAdd(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const chosen = clientCarts?.find(c => c.id === confirmAdd.selectedCartId);
                  if (chosen) {
                    onPickCart?.(chosen);
                    commitAdd(confirmAdd.product, confirmAdd.qtys, chosen.cartName);
                  }
                  setConfirmAdd(null);
                }}
              >
                Adicionar ao Carrinho
              </Button>
            </Group>
          </>
        )}
      </Modal>

      <Modal
        opened={!!pendingAdd}
        onClose={() => setPendingAdd(null)}
        centered
        size="28rem"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.6 }}
        styles={CART_MODAL_STYLES}
      >
        {pendingAdd && (
          <>
            {/* Cabeçalho próprio: título à esquerda, X grande (44px) no canto superior direito */}
            <Group justify="space-between" align="flex-start" pl="lg" pr="sm" py="sm" gap="sm" wrap="nowrap">
              <Box miw={0} pt={8}>
                <Title order={3}>Adicionar a qual carrinho?</Title>
                <Text lh={1.5} c="dimmed" truncate size="sm">
                  {Object.values(pendingAdd.qtys).reduce((a, b) => a + b, 0)} pares · {pendingAdd.product.name}
                </Text>
              </Box>
              <CloseButton onClick={() => setPendingAdd(null)} aria-label="Fechar" flex="none" />
            </Group>
            <Divider color={BORDER_COLOR} />
            <ScrollArea.Autosize mah="50vh" type="auto">
              <Stack gap="sm" p="md">
                {cartFilter}
                {cartFilterEmpty}
                {visibleCarts.map(c => (
                  <CartOption
                    key={c.id}
                    cart={c}
                    selected={activeCartId === c.id}
                    onClick={() => {
                      onPickCart?.(c);
                      commitAdd(pendingAdd.product, pendingAdd.qtys, c.cartName);
                      setPendingAdd(null);
                    }}
                  />
                ))}
                {(clientCarts ?? []).length === 0 && !creatingMode && (
                  <EmptyState
                    withBorder={false}
                    icon={ShoppingCartIcon}
                    title="Este cliente ainda não tem carrinhos"
                    description="Crie um carrinho abaixo para adicionar os pares."
                  />
                )}
                {creatingMode ? (
                  <Paper
                    p="sm"
                    bg="var(--mantine-color-neutral-0)"
                    bd="1px solid var(--mantine-color-neutral-3)"
                  >
                    <Stack gap="md">
                      <TextInput
                        autoFocus
                        label="Nome do novo carrinho"
                        value={creatingNewName}
                        onChange={e => setCreatingNewName(e.currentTarget.value)}
                        placeholder="ex.: Reposição Inverno 26"
                        maxLength={40}
                        description="Até 40 caracteres"
                      />
                      <Group justify="flex-end" gap="sm">
                        <Button
                          onClick={() => { setCreatingMode(false); setCreatingNewName(''); }}
                          variant="default"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => {
                            const ctx = onCreateCart?.(creatingNewName || 'Novo carrinho');
                            if (ctx) {
                              commitAdd(pendingAdd.product, pendingAdd.qtys, ctx.cartName);
                              setPendingAdd(null);
                            }
                          }}
                        >
                          Criar Carrinho e Adicionar
                        </Button>
                      </Group>
                    </Stack>
                  </Paper>
                ) : (
                  <Button
                    onClick={() => setCreatingMode(true)}
                    variant="default"
                    bd={DASHED_BORDER}
                    fullWidth
                    leftSection={<PlusIcon size={16} />}
                  >
                    Criar Novo Carrinho
                  </Button>
                )}
              </Stack>
            </ScrollArea.Autosize>
            <Divider color={BORDER_COLOR} />
            {/* Rodapé: fechar sem adicionar (escolher um carrinho da lista já adiciona) */}
            <Group px="lg" py="md" gap="sm">
              <Button variant="default" onClick={() => setPendingAdd(null)}>
                Cancelar
              </Button>
            </Group>
          </>
        )}
      </Modal>

    </Stack>
  );
}
