import { useState } from "react";
import { toast } from "../lib/toast";
import {
  ActionIcon, Badge, Box, Button, Chip, Group, Modal, NumberInput, Paper, Select, SimpleGrid,
  Image, Stack, Text, TextInput, ThemeIcon, Title, UnstyledButton,
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
  PlusIcon,
  StorefrontIcon,
  UserCheckIcon,
} from "@phosphor-icons/react";
import { products, Product, formatCurrency, Client } from "../data/mockData";
import bannerLimitedAsset from "../../assets/banner-edicao-limitada.webp";
import interactive from "./interactive.module.css";
import classes from "./CatalogPage.module.css";

import type { CartContext, CartCreator } from "./CartsListPage";

const BORDER = '1px solid var(--mantine-color-default-border)';
const PRIMARY_TEXT = 'var(--mantine-primary-color-filled)';

function CartCreatorTag({ createdBy }: { createdBy?: CartCreator }) {
  if (!createdBy) return null;
  const isLojista = createdBy === 'lojista';
  return (
    <Badge
      mt={2}
      size="xs"
      radius="sm"
      variant="light"
      color={isLojista ? 'teal' : 'yellow'}
      leftSection={isLojista ? <StorefrontIcon size={10} /> : <UserCheckIcon size={10} />}
      styles={{ label: { textTransform: 'none', fontSize: '0.62rem', fontWeight: 600 } }}
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
}

const lines = ['Todos', 'Premium', 'Urban', 'Sport'];
const categories = ['Todos', 'Social', 'Casual', 'Esportivo', 'Sandália', 'Bota'];
const collections = ['Todas', 'Inverno 2026', 'Primavera/Verão 2026'];

function StarRating({ rating }: { rating: number }) {
  return (
    <Group gap={2} wrap="nowrap">
      {[1, 2, 3, 4, 5].map(s => (
        <StarIcon
          key={s}
          size={12}
          weight={s <= Math.round(rating) ? 'fill' : 'regular'}
          style={{
            color: s <= Math.round(rating) ? 'var(--mantine-color-yellow-5)' : 'var(--mantine-color-dimmed)',
            opacity: s <= Math.round(rating) ? 1 : 0.3,
          }}
        />
      ))}
      <Text lh={1.5} c="dimmed" ml={4} size="0.68rem">{rating}</Text>
    </Group>
  );
}

function QtyStepper({ value, onChange, buttonSize, inputWidth = 32 }: { value: number; onChange: (v: number) => void; buttonSize: number; inputWidth?: number }) {
  return (
    <Group gap={2} wrap="nowrap">
      <ActionIcon size={buttonSize} variant="default" radius="sm" onClick={() => onChange(value - 1)} style={{ fontSize: '0.7rem', lineHeight: 1 }}>−</ActionIcon>
      <NumberInput
        value={value}
        onChange={v => onChange(Number(v) || 0)}
        hideControls
        variant="unstyled"
        w={inputWidth}
        size="xs"
        styles={{ input: { textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, minHeight: 0, height: 22, padding: 0 } }}
      />
      <ActionIcon size={buttonSize} variant="default" radius="sm" onClick={() => onChange(value + 1)} style={{ fontSize: '0.7rem', lineHeight: 1 }}>+</ActionIcon>
    </Group>
  );
}

function GradeHeader({ onClose }: { onClose?: () => void }) {
  return (
    <Group justify="space-between" mb={8} wrap="nowrap">
      <Text lh={1.5} size="0.72rem" fw={600} tt="uppercase" style={{ letterSpacing: '0.04em' }}>
        Compra rápida — Grade
      </Text>
      {onClose && (
        <ActionIcon onClick={onClose} variant="subtle" color="gray" size="sm" aria-label="Fechar">
          <XIcon size={14} />
        </ActionIcon>
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
    <Box px="sm" pb="sm" pt={8} bg="var(--mantine-color-default-hover)" style={{ borderTop: BORDER }}>
      <GradeHeader onClose={onClose} />
      <Stack gap={4}>
        {sizes.map(s => (
          <Group key={s} justify="space-between" wrap="nowrap" px={8} py={4} bg="var(--mantine-color-body)" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
            <Group gap={8} wrap="nowrap">
              <Text lh={1.5} size="0.78rem" fw={600}>Nº {s}</Text>
              <Text lh={1.5} c="teal.6" size="0.65rem">{product.grades[s]} disp.</Text>
            </Group>
            <QtyStepper value={qtys[s]} onChange={v => set(s, v)} buttonSize={20} />
          </Group>
        ))}
      </Stack>
      <Group justify="space-between" mt={8} mb={8}>
        <Text lh={1.5} c="dimmed" size="0.7rem">
          {total} {total === 1 ? 'par' : 'pares'}
        </Text>
        <Text lh={1.5} className="mono" size="0.85rem" fw={700}>{formatCurrency(subtotal)}</Text>
      </Group>
      <Button
        fullWidth
        onClick={() => onAdd(qtys)}
        disabled={total === 0}
        leftSection={<ShoppingCartIcon size={14} />}
        styles={{ label: { fontSize: '0.78rem', fontWeight: 600 } }}
      >
        Adicionar
      </Button>
    </Box>
  );
}

function GradeInline({ product, onAdd, onClose }: {
  product: Product; onAdd: (qtys: Record<string, number>) => void; onClose?: () => void;
}) {
  const sizes = Object.keys(product.grades);
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(sizes.map(s => [s, 0]))
  );
  const total = Object.values(qtys).reduce((a, b) => a + b, 0);
  const subtotal = total * product.price;
  const set = (s: string, v: number) => setQtys(q => ({ ...q, [s]: Math.max(0, v) }));

  // colunas: rótulo (90px) · uma por numeração, de largura igual · total (60px)
  const rowLabel = (text: string) => (
    <Text lh={1.5} w={90} flex="none" px={8} py={6} c="dimmed" size="0.62rem" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>{text}</Text>
  );

  return (
    <Box px="sm" pb="sm" pt={8} bg="var(--mantine-color-default-hover)" style={{ borderTop: BORDER }}>
      <GradeHeader onClose={onClose} />

      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <Group gap={0} wrap="nowrap" bg="var(--mantine-color-default-hover)" style={{ borderBottom: BORDER }}>
          {rowLabel('Numeração')}
          {sizes.map(s => (
            <Text lh={1.5} key={s} flex={1} miw={0} px={4} py={6} ta="center" size="0.72rem" fw={600}>Nº {s}</Text>
          ))}
          <Text lh={1.5} w={60} flex="none" px={4} py={6} ta="center" c="dimmed" size="0.62rem" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>Total</Text>
        </Group>

        <Group gap={0} wrap="nowrap" style={{ borderBottom: BORDER }}>
          {rowLabel('Estoque')}
          {sizes.map(s => (
            <Text lh={1.5} key={s} flex={1} miw={0} px={4} py={6} ta="center" c="teal.6" size="0.72rem" fw={600}>{product.grades[s]}</Text>
          ))}
          <Text lh={1.5} w={60} flex="none" px={4} py={6} ta="center" c="dimmed" size="0.7rem">
            {Object.values(product.grades).reduce((a, b) => a + b, 0)}
          </Text>
        </Group>

        <Group gap={0} wrap="nowrap">
          {rowLabel('Quantidade')}
          {sizes.map(s => (
            <Group key={s} flex={1} miw={0} px={4} py={6} gap={2} justify="center" wrap="nowrap">
              <QtyStepper value={qtys[s]} onChange={v => set(s, v)} buttonSize={16} inputWidth={26} />
            </Group>
          ))}
          <Text lh={1.5} w={60} flex="none" px={4} py={6} ta="center" className="mono" size="0.78rem" fw={700}>{total}</Text>
        </Group>
      </Paper>

      <Group justify="flex-end" gap="sm" mt={8} mb={4} wrap="nowrap">
        <Text lh={1.5} c="dimmed" size="0.7rem">
          {total} {total === 1 ? 'par' : 'pares'} · <Text lh={1.5} span className="mono" c="var(--mantine-color-text)" size="0.85rem" fw={700}>{formatCurrency(subtotal)}</Text>
        </Text>
        <Button
          onClick={() => onAdd(qtys)}
          disabled={total === 0}
          leftSection={<ShoppingCartIcon size={14} />}
          styles={{ label: { fontSize: '0.78rem', fontWeight: 600 } }}
        >
          Adicionar
        </Button>
      </Group>
    </Box>
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
  const [imgError, setImgError] = useState(false);
  const availBadgeColor = availColor[product.availability];

  if (viewMode === 'list') {
    return (
      <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
        <Group p="md" gap="md" wrap="nowrap">
          <UnstyledButton onClick={onOpenDetail} w={80} h={80} bg="#fff" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden', flexShrink: 0 }}>
            {!imgError ? (
              <Image src={product.image} alt={product.name} h="100%" onError={() => setImgError(true)} />
            ) : (
              <Group w="100%" h="100%" justify="center">
                <PackageIcon size={24} style={{ color: 'var(--mantine-color-dimmed)', opacity: 0.4 }} />
              </Group>
            )}
          </UnstyledButton>
          <Box style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onOpenDetail}>
            <Group gap={8} align="flex-start" wrap="nowrap">
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text lh={1.5} c="dimmed" size="0.7rem" fw={500}>{product.reference}</Text>
                <Text lh={1.5} size="0.9rem" fw={600}>{product.name}</Text>
                <Text lh={1.5} c="dimmed" size="0.75rem">{product.line} · {product.category} · {product.collection}</Text>
              </Box>
              <StarRating rating={product.rating} />
            </Group>
            <Group gap="sm" mt={8}>
              <Badge variant="light" color={availBadgeColor} size="sm" styles={{ label: { textTransform: 'none', fontSize: '0.65rem', fontWeight: 600 } }}>{product.availability}</Badge>
              <Text lh={1.5} c="dimmed" size="0.72rem">{product.material}</Text>
              <Text lh={1.5} c="dimmed" size="0.72rem">{product.soldUnits.toLocaleString('pt-BR')} vendidos</Text>
            </Group>
          </Box>
          <Stack gap={8} align="flex-end" style={{ flexShrink: 0 }}>
            <Box ta="right">
              <Text lh={1.5} className="mono" size="1.1rem" fw={700} style={{ letterSpacing: '-0.01em' }}>{formatCurrency(product.price)}</Text>
              <Text lh={1.5} c="dimmed" td="line-through" size="0.75rem">{formatCurrency(product.priceRetail)}</Text>
              <Text lh={1.5} c={PRIMARY_TEXT} size="0.65rem" fw={600}>+ IVA</Text>
            </Box>
            <Group gap={8} wrap="nowrap">
              <ActionIcon
                onClick={onToggleFav}
                size={32}
                variant={product.isFavorite ? 'light' : 'default'}
                color={product.isFavorite ? 'red' : 'gray'}
                aria-label="Favoritar"
              >
                <HeartIcon size={14} weight={product.isFavorite ? 'fill' : 'regular'} />
              </ActionIcon>
              <Button
                onClick={onQuickBuy}
                disabled={product.availability === 'esgotado'}
                size="compact-md"
                h={32}
                leftSection={<LightningIcon size={14} />}
                styles={{ label: { fontSize: '0.78rem', fontWeight: 600 } }}
              >
                Compra rápida
              </Button>
            </Group>
          </Stack>
        </Group>
        {gradeOpen && (
          <GradeCompact product={product} onAdd={onAddGrade} onClose={onCloseGrade} />
        )}
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="lg" className={classes.card} style={{ overflow: 'hidden' }}>
      <UnstyledButton onClick={onOpenDetail} pos="relative" display="block" w="100%" pt="80%" mb={-12} bg="white" style={{ overflow: 'hidden' }}>
        {!imgError ? (
          <Image
            src={product.image}
            alt={product.name}
            fit="contain"
            pos="absolute"
            inset={0}
            h="100%"
            pt={8}
            px={8}
            style={{ objectPosition: 'bottom' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <Group pos="absolute" inset={0} justify="center">
            <PackageIcon size={40} style={{ color: 'var(--mantine-color-dimmed)', opacity: 0.3 }} />
          </Group>
        )}
        <Box
          component="span"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggleFav(); }}
          className={classes.favToggle}
          data-active={product.isFavorite || undefined}
        >
          <HeartIcon size={14} weight={product.isFavorite ? 'fill' : 'regular'} />
        </Box>
        <Box className={classes.overlay}>
          <Box
            component="span"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpenDetail(); }}
            className={`${classes.overlayAction} ${classes.overlayDetails}`}
          >
            <EyeIcon size={14} /> Detalhes
          </Box>
          <Box
            component="span"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (product.availability !== 'esgotado') onQuickBuy(); }}
            className={`${classes.overlayAction} ${classes.overlayBuy}`}
            data-disabled={product.availability === 'esgotado' || undefined}
          >
            <LightningIcon size={14} /> Compra rápida
          </Box>
        </Box>
      </UnstyledButton>

      <Box p="sm" style={{ cursor: 'pointer' }} onClick={onOpenDetail}>
        <Badge variant="light" color={availBadgeColor} size="sm" mb={8} styles={{ label: { textTransform: 'none', fontSize: '0.62rem', fontWeight: 600 } }}>
          {product.availability}
        </Badge>
        <Text lh={1.5} c="dimmed" size="0.68rem" fw={500} tt="uppercase" style={{ letterSpacing: '0.05em' }}>{product.line} · {product.reference}</Text>
        <Text lh={1.5} mt={2} truncate size="0.95rem" fw={600}>{product.name}</Text>
        <Text lh={1.5} c="dimmed" size="0.75rem">{product.material}</Text>

        <Group justify="space-between" mt={8} wrap="nowrap">
          <StarRating rating={product.rating} />
          <Text lh={1.5} c="dimmed" size="0.68rem">{product.soldUnits.toLocaleString('pt-BR')} un.</Text>
        </Group>

        <Group justify="space-between" mt="sm" pt="sm" wrap="nowrap" style={{ borderTop: BORDER }}>
          <Box>
            <Text lh={1.5} className="mono" size="1rem" fw={700}>{formatCurrency(product.price)}</Text>
            <Text lh={1.5} c="dimmed" td="line-through" size="0.72rem">{formatCurrency(product.priceRetail)}</Text>
            <Text lh={1.5} c={PRIMARY_TEXT} size="0.62rem" fw={600}>+ IVA</Text>
          </Box>
          <Group gap={6} wrap="nowrap">
            {product.colors.slice(0, 3).map(color => (
              <Text lh={1.5} key={color} c="dimmed" size="0.62rem">
                {color === product.colors[0] ? color : '·'}
              </Text>
            ))}
            {product.colors.length > 1 && (
              <Text lh={1.5} c="dimmed" size="0.62rem">+{product.colors.length - 1}</Text>
            )}
          </Group>
        </Group>
      </Box>

      {gradeOpen && (
        <GradeCompact product={product} onAdd={onAddGrade} onClose={onCloseGrade} />
      )}
    </Paper>
  );
}


function ProductDetailModal({ product, onClose, onAddGrade, onToggleFav, isFavorite }: {
  product: Product; onClose: () => void; onAddGrade: (qtys: Record<string, number>) => void;
  onToggleFav: () => void; isFavorite: boolean;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const images = [product.image, product.image, product.image];
  const labelStyle = { letterSpacing: '0.05em' } as const;
  return (
    <Modal
      opened
      onClose={onClose}
      centered
      size="56rem"
      radius="xl"
      padding={0}
      overlayProps={{ backgroundOpacity: 0.7 }}
      title={
        <Text lh={1.5} component="span" c="dimmed" size="0.72rem" fw={500} tt="uppercase" style={{ letterSpacing: '0.06em' }}>
          {product.line} · {product.reference}
        </Text>
      }
      styles={{
        content: { display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' },
        header: { padding: '12px 20px', minHeight: 0, borderBottom: BORDER },
        body: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: 0 },
      }}
    >
      <Box style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
          <Stack gap="sm" p="md" bg="var(--mantine-color-gray-0)">
            <Box pos="relative" w="100%" pt="90%" bg="#fff" style={{ borderRadius: 'var(--mantine-radius-lg)', overflow: 'hidden' }}>
              <Image src={images[activeImg]} alt={product.name} fit="contain" pos="absolute" inset={0} h="100%" p={16} />
            </Box>
            <Group gap={8}>
              {images.map((img, i) => (
                <UnstyledButton key={i} onClick={() => setActiveImg(i)} className={classes.thumb} data-active={activeImg === i || undefined}>
                  <Image src={img} alt="" h="100%" />
                </UnstyledButton>
              ))}
            </Group>
          </Stack>
          <Stack gap="md" p="lg">
            <Box>
              <Group justify="space-between" align="flex-start" gap={8} wrap="nowrap">
                <Title order={2} size="1.4rem" fw={700} style={{ letterSpacing: '-0.01em' }}>{product.name}</Title>
                <ActionIcon
                  onClick={onToggleFav}
                  size={36}
                  variant={isFavorite ? 'light' : 'default'}
                  color={isFavorite ? 'red' : 'gray'}
                  style={{ flexShrink: 0 }}
                  aria-label="Favoritar"
                >
                  <HeartIcon size={16} weight={isFavorite ? 'fill' : 'regular'} />
                </ActionIcon>
              </Group>
              <Group gap="sm" mt={4}>
                <StarRating rating={product.rating} />
                <Text lh={1.5} c="dimmed" size="0.75rem">{product.soldUnits.toLocaleString('pt-BR')} vendidos</Text>
              </Group>
            </Box>
            <Group gap="sm" align="baseline">
              <Text lh={1.5} className="mono" size="1.8rem" fw={700} style={{ letterSpacing: '-0.02em' }}>{formatCurrency(product.price)}</Text>
              <Text lh={1.5} c="dimmed" td="line-through" size="0.9rem">{formatCurrency(product.priceRetail)}</Text>
              <Text lh={1.5} c={PRIMARY_TEXT} size="0.72rem" fw={600}>+ IVA</Text>
            </Group>
            <Text size="0.85rem" lh={1.6}>{product.description}</Text>
            <SimpleGrid cols={2} spacing="sm">
              <Box>
                <Text lh={1.5} c="dimmed" size="0.7rem" tt="uppercase" style={labelStyle}>Material</Text>
                <Text lh={1.5} mt={2} size="0.85rem" fw={500}>{product.material}</Text>
              </Box>
              <Box>
                <Text lh={1.5} c="dimmed" size="0.7rem" tt="uppercase" style={labelStyle}>Coleção</Text>
                <Text lh={1.5} mt={2} size="0.85rem" fw={500}>{product.collection}</Text>
              </Box>
            </SimpleGrid>
            <Box>
              <Text lh={1.5} c="dimmed" mb={6} size="0.7rem" tt="uppercase" style={labelStyle}>Cores</Text>
              <Group gap={6}>
                {product.colors.map(c => (
                  <Badge key={c} variant="light" color="gray" size="lg" styles={{ label: { textTransform: 'none', fontSize: '0.75rem', fontWeight: 500, color: 'var(--mantine-color-text)' } }}>{c}</Badge>
                ))}
              </Group>
            </Box>
          </Stack>
        </SimpleGrid>
      </Box>
      <Box style={{ flexShrink: 0 }}>
        <GradeInline product={product} onAdd={onAddGrade} />
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
      radius="md"
      p="sm"
      className={`${interactive.cardButton} ${interactive.choiceCard}`}
      data-checked={selected || undefined}
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={32} radius="md" variant="light" color="neutral">
          <ShoppingCartIcon size={14} />
        </ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text lh={1.5} truncate size="0.85rem" fw={600}>{cart.cartName}</Text>
          <Group gap={4} wrap="nowrap">
            <StorefrontIcon size={10} style={{ color: 'var(--mantine-color-dimmed)' }} />
            <Text lh={1.5} c="dimmed" size="0.7rem">{cart.clientName}</Text>
          </Group>
          <CartCreatorTag createdBy={cart.createdBy} />
        </Box>
        {selected && (
          <Text lh={1.5} c={PRIMARY_TEXT} size="0.65rem" fw={700} tt="uppercase" style={{ letterSpacing: '0.05em' }}>Atual</Text>
        )}
      </Group>
    </Paper>
  );
}

const CART_MODAL_STYLES = {
  content: { overflow: 'hidden' },
  body: { padding: 0 },
} as const;

export function CatalogPage({ onNavigate, externalFilters, onExternalFiltersChange, clientCarts, activeCartId, onPickCart, onCreateCart }: CatalogPageProps) {
  const usingExternal = !!externalFilters;
  const [internalSearch, setInternalSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLine, setSelectedLine] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCollection, setSelectedCollection] = useState('Todas');
  const [sortBy, setSortBy] = useState('relevância');
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    new Set(products.filter(p => p.isFavorite).map(p => p.id))
  );
  const [gradeOpenId, setGradeOpenId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  // Multi-cart picker
  const multiCartEnabled = Array.isArray(clientCarts);
  const [pendingAdd, setPendingAdd] = useState<{ product: Product; qtys: Record<string, number> } | null>(null);
  const [confirmAdd, setConfirmAdd] = useState<{ product: Product; qtys: Record<string, number>; selectedCartId: string } | null>(null);
  const [creatingNewName, setCreatingNewName] = useState('');
  const [creatingMode, setCreatingMode] = useState(false);

  const commitAdd = (p: Product, qtys: Record<string, number>, cartName?: string) => {
    const total = Object.values(qtys).reduce((a, b) => a + b, 0);
    setGradeOpenId(null);
    toast.success(`${total} ${total === 1 ? 'par' : 'pares'} de ${p.name} adicionados${cartName ? ` em "${cartName}"` : ''}`);
  };
  const addGrade = (p: Product, qtys: Record<string, number>) => {
    const total = Object.values(qtys).reduce((a, b) => a + b, 0);
    if (total === 0) return;
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
    if (sortBy === 'preço ↑') return a.price - b.price;
    if (sortBy === 'preço ↓') return b.price - a.price;
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

  const renderChipFilter = (label: string, options: string[], value: string, onSelect: (v: string) => void) => (
    <Box>
      <Text lh={1.5} c="dimmed" mb={8} size="0.75rem" fw={500}>{label}</Text>
      <Chip.Group multiple={false} value={value} onChange={onSelect}>
        <Group gap={6}>
          {options.map(o => (
            <Chip
              key={o}
              value={o}
              size="xs"
              variant="filled"
              icon={null}
              styles={{ label: { fontSize: '0.75rem', fontWeight: 500, paddingInline: 12 }, iconWrapper: { display: 'none' } }}
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
    <Stack gap="lg" p="lg" maw={1400} mx="auto" w="100%">
      {/* Promo Banner */}
      <Paper withBorder radius="xl" shadow="xs" style={{ overflow: 'hidden' }}>
        <Image src={bannerLimitedAsset} alt="Edição Limitada" h="auto" />
      </Paper>

      {/* Header + Controls */}
      <Group gap="sm" wrap="wrap">
        <TextInput
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Buscar produto, referência, linha..."
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          leftSection={<MagnifyingGlassIcon size={16} />}
          rightSection={search ? (
            <ActionIcon onClick={() => setSearch('')} variant="subtle" color="gray" size="sm" aria-label="Limpar busca">
              <XIcon size={14} />
            </ActionIcon>
          ) : null}
          styles={{ input: { fontSize: '0.85rem' } }}
        />

        {!usingExternal && (
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters || hasActiveFilters ? 'light' : 'default'}
            color="neutral"
            leftSection={<FunnelIcon size={16} />}
            rightSection={hasActiveFilters ? (
              <Box w={6} h={6} bg="var(--mantine-color-neutral-9)" style={{ borderRadius: '50%' }} />
            ) : undefined}
            styles={{ label: { fontSize: '0.83rem', fontWeight: 500 } }}
          >
            Filtros
          </Button>
        )}

        <Select
          w={170}
          allowDeselect={false}
          value={sortBy}
          onChange={v => v && setSortBy(v)}
          data={['relevância', 'mais vendidos', 'avaliação', 'preço ↑', 'preço ↓']}
          styles={{ input: { fontSize: '0.83rem' } }}
        />

        <ActionIcon.Group>
          <ActionIcon
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'filled' : 'default'}
            size={36}
            aria-label="Grade"
          >
            <GridNineIcon size={16} />
          </ActionIcon>
          <ActionIcon
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'filled' : 'default'}
            size={36}
            aria-label="Lista"
          >
            <ListBulletsIcon size={16} />
          </ActionIcon>
        </ActionIcon.Group>
      </Group>

      {/* Filter Panel */}
      {!usingExternal && showFilters && (
        <Paper withBorder radius="lg" p="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {renderChipFilter('Linha', lines, selectedLine, setSelectedLine)}
            {renderChipFilter('Categoria', categories, selectedCategory, setSelectedCategory)}
            {renderChipFilter('Coleção', collections, selectedCollection, setSelectedCollection)}
          </SimpleGrid>
          {hasActiveFilters && (
            <Button
              onClick={() => { setSelectedLine('Todos'); setSelectedCategory('Todos'); setSelectedCollection('Todas'); }}
              mt="sm"
              variant="subtle"
              color="neutral"
              size="compact-sm"
              leftSection={<XIcon size={12} />}
              styles={{ label: { fontSize: '0.75rem', fontWeight: 400 } }}
            >
              Limpar filtros
            </Button>
          )}
        </Paper>
      )}

      {/* Results header */}
      {hasActiveFilters && (
        <Group justify="flex-end" gap={6}>
          {selectedLine !== 'Todos' && (
            <Badge
              variant="light"
              color="neutral"
              rightSection={<XIcon size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedLine('Todos')} />}
              styles={{ label: { textTransform: 'none', fontSize: '0.72rem', fontWeight: 400 } }}
            >
              {selectedLine}
            </Badge>
          )}
          {selectedCategory !== 'Todos' && (
            <Badge
              variant="light"
              color="neutral"
              rightSection={<XIcon size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('Todos')} />}
              styles={{ label: { textTransform: 'none', fontSize: '0.72rem', fontWeight: 400 } }}
            >
              {selectedCategory}
            </Badge>
          )}
        </Group>
      )}

      {/* Products Grid/List */}
      {sorted.length === 0 ? (
        <Stack align="center" justify="center" gap={0} py={80} ta="center">
          <PackageIcon size={48} style={{ color: 'var(--mantine-color-dimmed)', opacity: 0.3, marginBottom: 16 }} />
          <Text lh={1.5} fw={600}>Nenhum produto encontrado</Text>
          <Text lh={1.5} c="dimmed" mt={4} size="0.85rem">Tente ajustar os filtros ou a busca</Text>
        </Stack>
      ) : viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md" style={{ alignItems: 'start' }}>
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
        radius="xl"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.6 }}
        styles={CART_MODAL_STYLES}
      >
        {confirmAdd && (
          <>
            <Box px="lg" py="md" style={{ borderBottom: BORDER }}>
              <Text lh={1.5} fw={700} size="0.95rem">Adicionar ao carrinho</Text>
              <Text lh={1.5} c="dimmed" mt={4} size="0.78rem">
                {Object.values(confirmAdd.qtys).reduce((a, b) => a + b, 0)} pares de <Text lh={1.5} span c="var(--mantine-color-text)" fw={500} inherit>{confirmAdd.product.name}</Text>
              </Text>
            </Box>
            <Stack gap={8} px="lg" py="md" mah="40vh" style={{ overflowY: 'auto' }}>
              {(clientCarts ?? []).map(c => (
                <CartOption
                  key={c.id}
                  cart={c}
                  selected={confirmAdd.selectedCartId === c.id}
                  onClick={() => setConfirmAdd(prev => prev ? { ...prev, selectedCartId: c.id } : prev)}
                />
              ))}
              {(clientCarts ?? []).length === 0 && (
                <Text lh={1.5} c="dimmed" ta="center" py="sm" size="0.8rem">Nenhum carrinho disponível.</Text>
              )}
            </Stack>
            <Group px="lg" py="md" gap={8} grow style={{ borderTop: BORDER }}>
              <Button
                onClick={() => {
                  setConfirmAdd(null);
                  setPendingAdd({ product: confirmAdd.product, qtys: confirmAdd.qtys });
                  setCreatingMode(true);
                  setCreatingNewName('');
                }}
                variant="default"
                style={{ borderStyle: 'dashed' }}
                px={12}
                leftSection={<PlusIcon size={14} />}
                styles={{ label: { fontSize: '0.82rem', fontWeight: 500 }, section: { marginInlineEnd: 6 } }}
              >
                Criar novo carrinho
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
                styles={{ label: { fontSize: '0.82rem', fontWeight: 600 } }}
              >
                OK
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
        radius="xl"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.6 }}
        styles={CART_MODAL_STYLES}
      >
        {pendingAdd && (
          <>
            <Group justify="space-between" px="lg" py="sm" wrap="nowrap" style={{ borderBottom: BORDER }}>
              <Box style={{ minWidth: 0 }}>
                <Text lh={1.5} fw={700} size="0.95rem">Adicionar a qual carrinho?</Text>
                <Text lh={1.5} c="dimmed" truncate size="0.75rem">
                  {Object.values(pendingAdd.qtys).reduce((a, b) => a + b, 0)} pares · {pendingAdd.product.name}
                </Text>
              </Box>
              <ActionIcon onClick={() => setPendingAdd(null)} variant="subtle" color="gray" aria-label="Fechar">
                <XIcon size={16} />
              </ActionIcon>
            </Group>
            <Stack gap={8} p="md" mah="50vh" style={{ overflowY: 'auto' }}>
              {(clientCarts ?? []).map(c => (
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
                <Text lh={1.5} c="dimmed" ta="center" py="sm" size="0.8rem">
                  Nenhum carrinho ainda para este cliente.
                </Text>
              )}
              {creatingMode ? (
                <Paper
                  radius="md"
                  p="sm"
                  bg="var(--mantine-color-neutral-0)"
                  style={{ border: '1px solid var(--mantine-color-neutral-3)' }}
                >
                  <Stack gap={8}>
                    <TextInput
                      autoFocus
                      label="Nome do novo carrinho"
                      value={creatingNewName}
                      onChange={e => setCreatingNewName(e.currentTarget.value)}
                      placeholder="Ex.: Reposição Inverno 26"
                      styles={{
                        label: { fontSize: '0.72rem', fontWeight: 400, color: 'var(--mantine-color-dimmed)', marginBottom: 8 },
                        input: { fontSize: '0.82rem' },
                      }}
                    />
                    <Group justify="flex-end" gap={8}>
                      <Button
                        onClick={() => { setCreatingMode(false); setCreatingNewName(''); }}
                        variant="default"
                        size="xs"
                        styles={{ label: { fontSize: '0.78rem', fontWeight: 400 } }}
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
                        size="xs"
                        styles={{ label: { fontSize: '0.78rem', fontWeight: 600 } }}
                      >
                        Criar e adicionar
                      </Button>
                    </Group>
                  </Stack>
                </Paper>
              ) : (
                <Button
                  onClick={() => setCreatingMode(true)}
                  variant="default"
                  style={{ borderStyle: 'dashed' }}
                  fullWidth
                  h={44}
                  leftSection={<PlusIcon size={14} />}
                  styles={{ label: { fontSize: '0.82rem', fontWeight: 600 } }}
                >
                  Criar novo carrinho
                </Button>
              )}
            </Stack>
          </>
        )}
      </Modal>

    </Stack>
  );
}
