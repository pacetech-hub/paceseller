import { useState } from "react";
import { toast } from "@/lib/toast";
import {
  Box, Stack, Group, Text, Title, Paper, Button, UnstyledButton, ActionIcon, TextInput, NativeSelect,
  SimpleGrid, Badge, Image, Modal, ThemeIcon,
} from "@mantine/core";
import {
  Search, Filter, Grid3X3, List, Heart, Star, ShoppingCart,
  X, Package2, Eye, Zap, Check, Plus, Store, UserCheck,
} from "lucide-react";
import { products, Product, formatCurrency, Client } from "../data/mockData";
import bannerLimitedAsset from "../../assets/banner-edicao-limitada.webp";
import classes from "./CatalogPage.module.css";

import type { CartContext, CartCreator } from "./CartsListPage";

const tnum = { fontVariantNumeric: 'tabular-nums' } as const;

function CartCreatorTag({ createdBy }: { createdBy?: CartCreator }) {
  if (!createdBy) return null;
  const isLojista = createdBy === 'lojista';
  return (
    <Box
      component="span"
      mt={2}
      px={6}
      py={2}
      bg={isLojista ? 'teal.0' : 'yellow.0'}
      c={isLojista ? 'teal.7' : 'yellow.7'}
      fz="0.62rem"
      fw={600}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 'var(--mantine-radius-sm)' }}
    >
      {isLojista ? <Store size={10} /> : <UserCheck size={10} />}
      {isLojista ? 'Lojista' : 'Representante'}
    </Box>
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
        <Star
          key={s}
          size={12}
          color={s <= Math.round(rating) ? 'var(--mantine-color-yellow-5)' : 'var(--mantine-color-gray-4)'}
          fill={s <= Math.round(rating) ? 'var(--mantine-color-yellow-5)' : 'none'}
        />
      ))}
      <Text span c="dimmed" ml={4} fz="0.68rem">{rating}</Text>
    </Group>
  );
}

const qtyInputStyles = {
  input: {
    width: 32,
    height: 'auto',
    minHeight: 0,
    padding: 0,
    textAlign: 'center' as const,
    background: 'transparent',
    fontSize: '0.72rem',
    fontWeight: 600,
  },
};

const gradeHeaderLabel = { fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const };

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
    <Box px="sm" pb="sm" pt={8} bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Text fz="0.72rem" fw={600} lts="0.04em" tt="uppercase">
          Compra rápida — Grade
        </Text>
        {onClose && (
          <UnstyledButton onClick={onClose} className={classes.closeBtn}>
            <X size={14} />
          </UnstyledButton>
        )}
      </Group>
      <Stack gap={4}>
        {sizes.map(s => (
          <Group key={s} justify="space-between" wrap="nowrap" px={8} py={4} style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--mantine-radius-sm)' }}>
            <Group gap={8} wrap="nowrap">
              <Text span fz="0.78rem" fw={600}>Nº {s}</Text>
              <Text span c="teal.7" fz="0.65rem">{product.grades[s]} disp.</Text>
            </Group>
            <Group gap={4} wrap="nowrap">
              <UnstyledButton onClick={() => set(s, qtys[s] - 1)} className={classes.qtyStep}>−</UnstyledButton>
              <TextInput
                type="number"
                variant="unstyled"
                value={qtys[s]}
                onChange={e => set(s, Number(e.target.value) || 0)}
                styles={qtyInputStyles}
              />
              <UnstyledButton onClick={() => set(s, qtys[s] + 1)} className={classes.qtyStep}>+</UnstyledButton>
            </Group>
          </Group>
        ))}
      </Stack>
      <Group justify="space-between" mt={8} mb={8} wrap="nowrap">
        <Text span c="dimmed" fz="0.7rem">
          {total} {total === 1 ? 'par' : 'pares'}
        </Text>
        <Text span fz="0.85rem" fw={700} style={tnum}>{formatCurrency(subtotal)}</Text>
      </Group>
      <Button
        onClick={() => onAdd(qtys)}
        disabled={total === 0}
        fullWidth
        radius="md"
        size="sm"
        h={34}
        leftSection={<ShoppingCart size={14} />}
        fz="0.78rem"
        fw={600}
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

  const colCount = sizes.length;
  const gridTemplate = `90px repeat(${colCount}, minmax(0, 1fr)) 60px`;
  const row = { display: 'grid', alignItems: 'center', gridTemplateColumns: gridTemplate } as const;

  return (
    <Box px="sm" pb="sm" pt={8} bg="gray.0" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Text fz="0.72rem" fw={600} lts="0.04em" tt="uppercase">
          Compra rápida — Grade
        </Text>
        {onClose && (
          <UnstyledButton onClick={onClose} className={classes.closeBtn}>
            <X size={14} />
          </UnstyledButton>
        )}
      </Group>

      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <Box bg="gray.1" style={{ ...row, borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Box px={8} py={6} c="dimmed" style={gradeHeaderLabel}>Numeração</Box>
          {sizes.map(s => (
            <Box key={s} px={4} py={6} ta="center" fz="0.72rem" fw={600}>Nº {s}</Box>
          ))}
          <Box px={4} py={6} ta="center" c="dimmed" style={gradeHeaderLabel}>Total</Box>
        </Box>

        <Box style={{ ...row, borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Box px={8} py={6} c="dimmed" style={gradeHeaderLabel}>Estoque</Box>
          {sizes.map(s => (
            <Box key={s} px={4} py={6} ta="center" c="teal.7" fz="0.72rem" fw={600}>{product.grades[s]}</Box>
          ))}
          <Box px={4} py={6} ta="center" c="dimmed" fz="0.7rem">
            {Object.values(product.grades).reduce((a, b) => a + b, 0)}
          </Box>
        </Box>

        <Box style={row}>
          <Box px={8} py={6} c="dimmed" style={gradeHeaderLabel}>Quantidade</Box>
          {sizes.map(s => (
            <Group key={s} px={4} py={6} gap={2} justify="center" wrap="nowrap">
              <UnstyledButton onClick={() => set(s, qtys[s] - 1)} className={`${classes.qtyStep} ${classes.qtyStepSm}`}>−</UnstyledButton>
              <TextInput
                type="number"
                variant="unstyled"
                value={qtys[s]}
                onChange={e => set(s, Number(e.target.value) || 0)}
                styles={qtyInputStyles}
              />
              <UnstyledButton onClick={() => set(s, qtys[s] + 1)} className={`${classes.qtyStep} ${classes.qtyStepSm}`}>+</UnstyledButton>
            </Group>
          ))}
          <Box px={4} py={6} ta="center" fz="0.78rem" fw={700} style={tnum}>{total}</Box>
        </Box>
      </Paper>

      <Group justify="flex-end" gap="sm" mt={8} mb={4} wrap="nowrap">
        <Text span c="dimmed" fz="0.7rem">
          {total} {total === 1 ? 'par' : 'pares'} · <Text span c="var(--mantine-color-text)" fz="0.85rem" fw={700} style={tnum}>{formatCurrency(subtotal)}</Text>
        </Text>
        <Button
          onClick={() => onAdd(qtys)}
          disabled={total === 0}
          radius="md"
          size="sm"
          h={34}
          px="md"
          leftSection={<ShoppingCart size={14} />}
          fz="0.78rem"
          fw={600}
        >
          Adicionar
        </Button>
      </Group>
    </Box>
  );
}

const availColors: Record<Product['availability'], string> = {
  'disponível': 'teal',
  'baixo estoque': 'yellow',
  'esgotado': 'red',
};

function ProductCard({ product, onOrder, onQuickBuy, onOpenDetail, onToggleFav, viewMode, gradeOpen, onAddGrade, onCloseGrade }: {
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

  const availColor = availColors[product.availability];
  const availBadge = (fz: string, mb?: number) => (
    <Badge
      variant="light"
      color={availColor}
      c={`${availColor}.7`}
      radius="xl"
      tt="none"
      size="sm"
      px={8}
      mb={mb}
      fz={fz}
      fw={600}
    >
      {product.availability}
    </Badge>
  );

  if (viewMode === 'list') {
    return (
      <div className={classes.cardList}>
        <Group p="md" gap="md" wrap="nowrap">
          <UnstyledButton onClick={onOpenDetail} w={80} h={80} bg="white" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden', flexShrink: 0 }}>
            {!imgError ? (
              <Image src={product.image} alt={product.name} w="100%" h="100%" fit="cover" onError={() => setImgError(true)} />
            ) : (
              <Box w="100%" h="100%" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package2 size={24} color="var(--mantine-color-gray-4)" />
              </Box>
            )}
          </UnstyledButton>
          <Box flex={1} miw={0} style={{ cursor: 'pointer' }} onClick={onOpenDetail}>
            <Group gap={8} align="flex-start" wrap="nowrap">
              <Box flex={1} miw={0}>
                <Text c="dimmed" fz="0.7rem" fw={500}>{product.reference}</Text>
                <Text fz="0.9rem" fw={600}>{product.name}</Text>
                <Text c="dimmed" fz="0.75rem">{product.line} · {product.category} · {product.collection}</Text>
              </Box>
              <StarRating rating={product.rating} />
            </Group>
            <Group gap="sm" mt={8}>
              {availBadge('0.65rem')}
              <Text span c="dimmed" fz="0.72rem">{product.material}</Text>
              <Text span c="dimmed" fz="0.72rem">{product.soldUnits.toLocaleString('pt-BR')} vendidos</Text>
            </Group>
          </Box>
          <Stack gap={8} ta="right" style={{ flexShrink: 0 }}>
            <div>
              <Text fz="1.1rem" fw={700} lts="-0.01em" style={tnum}>{formatCurrency(product.price)}</Text>
              <Text c="dimmed" td="line-through" fz="0.75rem">{formatCurrency(product.priceRetail)}</Text>
              <Text c="gray.9" fz="0.65rem" fw={600}>+ IVA</Text>
            </div>
            <Group gap={8} wrap="nowrap">
              <UnstyledButton onClick={onToggleFav} className={product.isFavorite ? `${classes.favBtn} ${classes.favBtnActive}` : classes.favBtn}>
                <Heart size={14} fill={product.isFavorite ? 'var(--mantine-color-red-4)' : 'none'} />
              </UnstyledButton>
              <Button
                onClick={onQuickBuy}
                disabled={product.availability === 'esgotado'}
                radius="md"
                size="sm"
                h={32}
                px="md"
                leftSection={<Zap size={14} />}
                fz="0.78rem"
                fw={600}
              >
                Compra rápida
              </Button>
            </Group>
          </Stack>
        </Group>
        {gradeOpen && (
          <GradeCompact product={product} onAdd={onAddGrade} onClose={onCloseGrade} />
        )}
      </div>
    );
  }

  return (
    <div className={classes.card}>
      <UnstyledButton onClick={onOpenDetail} className={classes.imageBtn}>
        {!imgError ? (
          <Image
            src={product.image}
            alt={product.name}
            pos="absolute"
            inset={0}
            w="100%"
            h="100%"
            fit="contain"
            px={8}
            pt={8}
            style={{ objectPosition: 'bottom' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <Box pos="absolute" inset={0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package2 size={40} color="var(--mantine-color-gray-4)" />
          </Box>
        )}
        <span
          onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
          className={product.isFavorite ? `${classes.favBadge} ${classes.favBadgeActive}` : classes.favBadge}
        >
          <Heart size={14} fill={product.isFavorite ? 'var(--mantine-color-red-4)' : 'none'} />
        </span>
        <div className={classes.hoverActions}>
          <span
            onClick={(e) => { e.stopPropagation(); onOpenDetail(); }}
            className={`${classes.hoverAction} ${classes.hoverActionDetails}`}
          >
            <Eye size={14} /> Detalhes
          </span>
          <span
            onClick={(e) => { e.stopPropagation(); if (product.availability !== 'esgotado') onQuickBuy(); }}
            className={product.availability === 'esgotado'
              ? `${classes.hoverAction} ${classes.hoverActionBuy} ${classes.hoverActionDisabled}`
              : `${classes.hoverAction} ${classes.hoverActionBuy}`}
          >
            <Zap size={14} /> Compra rápida
          </span>
        </div>
      </UnstyledButton>

      <Box p="sm" style={{ cursor: 'pointer' }} onClick={onOpenDetail}>
        {availBadge('0.62rem', 8)}
        <Text c="dimmed" fz="0.68rem" fw={500} lts="0.05em" tt="uppercase">{product.line} · {product.reference}</Text>
        <Text mt={2} truncate fz="0.95rem" fw={600}>{product.name}</Text>
        <Text c="dimmed" fz="0.75rem">{product.material}</Text>

        <Group justify="space-between" mt={8} wrap="nowrap">
          <StarRating rating={product.rating} />
          <Text span c="dimmed" fz="0.68rem">{product.soldUnits.toLocaleString('pt-BR')} un.</Text>
        </Group>

        <Group justify="space-between" mt="sm" pt="sm" wrap="nowrap" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <div>
            <Text fz="1rem" fw={700} style={tnum}>{formatCurrency(product.price)}</Text>
            <Text c="dimmed" td="line-through" fz="0.72rem">{formatCurrency(product.priceRetail)}</Text>
            <Text c="gray.9" fz="0.62rem" fw={600}>+ IVA</Text>
          </div>
          <Group gap={6} wrap="nowrap">
            {product.colors.slice(0, 3).map(color => (
              <Text span key={color} c="dimmed" fz="0.62rem">
                {color === product.colors[0] ? color : '·'}
              </Text>
            ))}
            {product.colors.length > 1 && (
              <Text span c="dimmed" fz="0.62rem">+{product.colors.length - 1}</Text>
            )}
          </Group>
        </Group>
      </Box>

      {gradeOpen && (
        <GradeCompact product={product} onAdd={onAddGrade} onClose={onCloseGrade} />
      )}
    </div>
  );
}


function ProductDetailModal({ product, onClose, onAddGrade, onToggleFav, isFavorite }: {
  product: Product; onClose: () => void; onAddGrade: (qtys: Record<string, number>) => void;
  onToggleFav: () => void; isFavorite: boolean;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const images = [product.image, product.image, product.image];
  const detailLabel = { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' } as const;
  return (
    <Modal
      opened
      onClose={onClose}
      withCloseButton={false}
      centered
      size="56rem"
      radius="xl"
      padding={0}
      overlayProps={{ backgroundOpacity: 0.7 }}
      styles={{
        content: { display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', border: '1px solid var(--mantine-color-gray-3)' },
        body: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
      }}
    >
      <Group justify="space-between" px={20} py="sm" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}>
        <Text c="dimmed" fz="0.72rem" fw={500} lts="0.06em" tt="uppercase">{product.line} · {product.reference}</Text>
        <UnstyledButton onClick={onClose} className={`${classes.closeBtn} ${classes.closeBtnLg}`}><X size={16} /></UnstyledButton>
      </Group>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0} verticalSpacing={0} flex={1} style={{ overflowY: 'auto' }}>
        <Stack gap="sm" bg="gray.0" p="md">
          <Box pos="relative" w="100%" pt="90%" bg="white" style={{ borderRadius: 'var(--mantine-radius-lg)', overflow: 'hidden' }}>
            <Image src={images[activeImg]} alt={product.name} pos="absolute" inset={0} w="100%" h="100%" fit="contain" p="md" />
          </Box>
          <Group gap={8}>
            {images.map((img, i) => (
              <UnstyledButton key={i} onClick={() => setActiveImg(i)} className={activeImg === i ? `${classes.thumb} ${classes.thumbActive}` : classes.thumb}>
                <Image src={img} alt="" w="100%" h="100%" fit="cover" bg="white" />
              </UnstyledButton>
            ))}
          </Group>
        </Stack>
        <Stack gap="md" p={20}>
          <div>
            <Group justify="space-between" align="flex-start" gap={8} wrap="nowrap">
              <Title order={2} fz="1.4rem" fw={700} lts="-0.01em">{product.name}</Title>
              <UnstyledButton onClick={onToggleFav} className={isFavorite ? `${classes.favBtn} ${classes.favBtnActive}` : classes.favBtn}>
                <Heart size={16} fill={isFavorite ? 'var(--mantine-color-red-4)' : 'none'} />
              </UnstyledButton>
            </Group>
            <Group gap="sm" mt={4}>
              <StarRating rating={product.rating} />
              <Text span c="dimmed" fz="0.75rem">{product.soldUnits.toLocaleString('pt-BR')} vendidos</Text>
            </Group>
          </div>
          <Group gap="sm" align="baseline">
            <Text fz="1.8rem" fw={700} lts="-0.02em" style={tnum}>{formatCurrency(product.price)}</Text>
            <Text c="dimmed" td="line-through" fz="0.9rem">{formatCurrency(product.priceRetail)}</Text>
            <Text c="gray.9" fz="0.72rem" fw={600}>+ IVA</Text>
          </Group>
          <Text fz="0.85rem" lh={1.6}>{product.description}</Text>
          <SimpleGrid cols={2} spacing="sm">
            <div>
              <Text c="dimmed" style={detailLabel}>Material</Text>
              <Text mt={2} fz="0.85rem" fw={500}>{product.material}</Text>
            </div>
            <div>
              <Text c="dimmed" style={detailLabel}>Coleção</Text>
              <Text mt={2} fz="0.85rem" fw={500}>{product.collection}</Text>
            </div>
          </SimpleGrid>
          <div>
            <Text c="dimmed" mb={6} style={detailLabel}>Cores</Text>
            <Group gap={6}>
              {product.colors.map(c => (
                <Badge key={c} variant="light" color="gray" c="var(--mantine-color-text)" bg="gray.1" radius="xl" tt="none" size="lg" px={10} fz="0.75rem" fw={500}>{c}</Badge>
              ))}
            </Group>
          </div>
        </Stack>
      </SimpleGrid>
      <Box style={{ borderTop: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}>
        <GradeInline product={product} onAdd={onAddGrade} />
      </Box>
    </Modal>
  );
}

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
  const goGrade = () => {
    setGradeOpenId(null);
    setDetailProduct(null);
    onNavigate('order-grade');
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

  const chipClass = (active: boolean) => active ? `${classes.chip} ${classes.chipActive}` : classes.chip;
  const filtersActive = showFilters || hasActiveFilters;

  return (
    <Stack gap={20} p="lg" maw={1400} mx="auto" w="100%">
      {/* Promo Banner */}
      <Paper withBorder radius="xl" shadow="xs" style={{ overflow: 'hidden' }}>
        <Image
          src={bannerLimitedAsset}
          alt="Edição Limitada"
          w="100%"
          h="auto"
          fit="cover"
        />
      </Paper>

      {/* Header + Controls */}
      <Group gap="sm">
        <TextInput
          type="text"
          placeholder="Buscar produto, referência, linha..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          flex={1}
          miw={200}
          size="md"
          radius="md"
          leftSection={<Search size={16} />}
          rightSection={search ? (
            <UnstyledButton onClick={() => setSearch('')} className={classes.closeBtn}>
              <X size={14} />
            </UnstyledButton>
          ) : null}
          styles={{ input: { fontSize: '0.85rem' } }}
        />

        {!usingExternal && (
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={filtersActive ? 'light' : 'default'}
            c={filtersActive ? 'gray.9' : 'dimmed'}
            radius="md"
            h={42}
            px={14}
            leftSection={<Filter size={16} />}
            rightSection={hasActiveFilters ? (
              <Box w={6} h={6} bg="gray.9" style={{ borderRadius: '50%' }} />
            ) : undefined}
            fz="0.83rem"
            fw={500}
            style={filtersActive ? { border: '1px solid var(--mantine-color-gray-5)' } : undefined}
          >
            Filtros
          </Button>
        )}

        <NativeSelect
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          size="md"
          radius="md"
          styles={{ input: { fontSize: '0.83rem' } }}
          data={['relevância', 'mais vendidos', 'avaliação', 'preço ↑', 'preço ↓']}
        />

        <ActionIcon.Group>
          <ActionIcon
            onClick={() => setViewMode('grid')}
            variant={viewMode === 'grid' ? 'filled' : 'default'}
            size={42}
            radius="md"
          >
            <Grid3X3 size={16} />
          </ActionIcon>
          <ActionIcon
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'filled' : 'default'}
            size={42}
            radius="md"
          >
            <List size={16} />
          </ActionIcon>
        </ActionIcon.Group>
      </Group>

      {/* Filter Panel */}
      {!usingExternal && showFilters && (
        <Paper withBorder radius="lg" p="md">
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <div>
              <Text c="dimmed" mb={8} fz="0.75rem" fw={500}>Linha</Text>
              <Group gap={6}>
                {lines.map(line => (
                  <UnstyledButton
                    key={line}
                    onClick={() => setSelectedLine(line)}
                    className={chipClass(selectedLine === line)}
                  >
                    {line}
                  </UnstyledButton>
                ))}
              </Group>
            </div>
            <div>
              <Text c="dimmed" mb={8} fz="0.75rem" fw={500}>Categoria</Text>
              <Group gap={6}>
                {categories.map(cat => (
                  <UnstyledButton
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={chipClass(selectedCategory === cat)}
                  >
                    {cat}
                  </UnstyledButton>
                ))}
              </Group>
            </div>
            <div>
              <Text c="dimmed" mb={8} fz="0.75rem" fw={500}>Coleção</Text>
              <Group gap={6}>
                {collections.map(col => (
                  <UnstyledButton
                    key={col}
                    onClick={() => setSelectedCollection(col)}
                    className={chipClass(selectedCollection === col)}
                  >
                    {col}
                  </UnstyledButton>
                ))}
              </Group>
            </div>
          </SimpleGrid>
          {hasActiveFilters && (
            <UnstyledButton
              onClick={() => { setSelectedLine('Todos'); setSelectedCategory('Todos'); setSelectedCollection('Todas'); }}
              className={classes.linkBtn}
              mt="sm"
            >
              <X size={12} /> Limpar filtros
            </UnstyledButton>
          )}
        </Paper>
      )}

      {/* Results header */}
      <Group justify="space-between" wrap="nowrap">
        <div />
        {hasActiveFilters && (
          <Group gap={6} wrap="nowrap">
            {selectedLine !== 'Todos' && (
              <Badge variant="light" radius="xl" tt="none" c="gray.9" bg="gray.1" px={8} fz="0.72rem" fw={400}
                rightSection={<X size={10} className={classes.removeX} onClick={() => setSelectedLine('Todos')} />}>
                {selectedLine}
              </Badge>
            )}
            {selectedCategory !== 'Todos' && (
              <Badge variant="light" radius="xl" tt="none" c="gray.9" bg="gray.1" px={8} fz="0.72rem" fw={400}
                rightSection={<X size={10} className={classes.removeX} onClick={() => setSelectedCategory('Todos')} />}>
                {selectedCategory}
              </Badge>
            )}
          </Group>
        )}
      </Group>

      {/* Products Grid/List */}
      {sorted.length === 0 ? (
        <Stack align="center" justify="center" py={80} gap={0} ta="center">
          <Package2 size={48} color="var(--mantine-color-gray-4)" style={{ marginBottom: 16 }} />
          <Text fw={600}>Nenhum produto encontrado</Text>
          <Text c="dimmed" mt={4} fz="0.85rem">Tente ajustar os filtros ou a busca</Text>
        </Stack>
      ) : viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 3 }} spacing="md" verticalSpacing="md" style={{ alignItems: 'start' }}>
          {sorted.map(product => (
            <ProductCard
              key={product.id}
              product={{ ...product, isFavorite: favoriteIds.has(product.id) }}
              viewMode="grid"
              onOrder={() => onNavigate('order-grade')}
              onQuickBuy={() => setGradeOpenId(gradeOpenId === product.id ? null : product.id)}
              onOpenDetail={() => setDetailProduct(product)}
              onToggleFav={() => toggleFav(product.id)}
              gradeOpen={gradeOpenId === product.id}
              onAddGrade={(qtys) => addGrade(product, qtys)}
              onCloseGrade={() => setGradeOpenId(null)}
            />

          ))}
        </SimpleGrid>
      ) : (
        <Stack gap="sm">
          {sorted.map(product => (
            <ProductCard
              key={product.id}
              product={{ ...product, isFavorite: favoriteIds.has(product.id) }}
              viewMode="list"
              onOrder={() => onNavigate('order-grade')}
              onQuickBuy={() => setGradeOpenId(gradeOpenId === product.id ? null : product.id)}
              onOpenDetail={() => setDetailProduct(product)}
              onToggleFav={() => toggleFav(product.id)}
              gradeOpen={gradeOpenId === product.id}
              onAddGrade={(qtys) => addGrade(product, qtys)}
              onCloseGrade={() => setGradeOpenId(null)}
            />

          ))}
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


      {confirmAdd && (
        <Modal
          opened
          onClose={() => setConfirmAdd(null)}
          withCloseButton={false}
          centered
          size={384}
          radius="xl"
          padding={0}
          overlayProps={{ backgroundOpacity: 0.6 }}
        >
          <Box px={20} py="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Text fw={700} fz="0.95rem">Adicionar ao carrinho</Text>
            <Text c="dimmed" mt={4} fz="0.78rem">
              {Object.values(confirmAdd.qtys).reduce((a, b) => a + b, 0)} pares de <Text span c="var(--mantine-color-text)" fw={500} inherit>{confirmAdd.product.name}</Text>
            </Text>
          </Box>
          <Stack gap={8} px={20} py="md" mah="40vh" style={{ overflowY: 'auto' }}>
            {(clientCarts ?? []).map(c => (
              <UnstyledButton
                key={c.id}
                onClick={() => setConfirmAdd(prev => prev ? { ...prev, selectedCartId: c.id } : prev)}
                className={confirmAdd.selectedCartId === c.id ? `${classes.cartOption} ${classes.cartOptionActive}` : classes.cartOption}
              >
                <ThemeIcon size={32} radius="md" variant="light" style={{ flexShrink: 0 }}>
                  <ShoppingCart size={14} />
                </ThemeIcon>
                <Box flex={1} miw={0}>
                  <Text truncate fz="0.85rem" fw={600}>{c.cartName}</Text>
                  <Group gap={4} c="dimmed" fz="0.7rem" wrap="nowrap">
                    <Store size={10} /> {c.clientName}
                  </Group>
                  <CartCreatorTag createdBy={c.createdBy} />
                </Box>
                {confirmAdd.selectedCartId === c.id && (
                  <Text span c="gray.9" fz="0.65rem" fw={700} lts="0.05em" tt="uppercase">Atual</Text>
                )}
              </UnstyledButton>
            ))}
            {(clientCarts ?? []).length === 0 && (
              <Text c="dimmed" ta="center" py="sm" fz="0.8rem">Nenhum carrinho disponível.</Text>
            )}
          </Stack>
          <Group gap={8} px={20} py="md" wrap="nowrap" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <UnstyledButton
              onClick={() => {
                setConfirmAdd(null);
                setPendingAdd({ product: confirmAdd.product, qtys: confirmAdd.qtys });
                setCreatingMode(true);
                setCreatingNewName('');
              }}
              className={classes.dashedBtn}
              flex={1}
              px="sm"
              py={8}
              fw={500}
            >
              <Plus size={14} /> Criar novo carrinho
            </UnstyledButton>
            <Button
              onClick={() => {
                const chosen = clientCarts?.find(c => c.id === confirmAdd.selectedCartId);
                if (chosen) {
                  onPickCart?.(chosen);
                  commitAdd(confirmAdd.product, confirmAdd.qtys, chosen.cartName);
                }
                setConfirmAdd(null);
              }}
              flex={1}
              radius="md"
              fz="0.82rem"
              fw={600}
            >
              OK
            </Button>
          </Group>
        </Modal>
      )}

      {pendingAdd && (
        <Modal
          opened
          onClose={() => setPendingAdd(null)}
          withCloseButton={false}
          centered
          size={448}
          radius="xl"
          padding={0}
          overlayProps={{ backgroundOpacity: 0.6 }}
        >
          <Group justify="space-between" px={20} py="sm" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Box miw={0}>
              <Text fw={700} fz="0.95rem">Adicionar a qual carrinho?</Text>
              <Text c="dimmed" truncate fz="0.75rem">
                {Object.values(pendingAdd.qtys).reduce((a, b) => a + b, 0)} pares · {pendingAdd.product.name}
              </Text>
            </Box>
            <UnstyledButton onClick={() => setPendingAdd(null)} className={`${classes.closeBtn} ${classes.closeBtnLg}`}>
              <X size={16} />
            </UnstyledButton>
          </Group>
          <Stack gap={8} p="md" mah="50vh" style={{ overflowY: 'auto' }}>
            {(clientCarts ?? []).map(c => (
              <UnstyledButton
                key={c.id}
                onClick={() => {
                  onPickCart?.(c);
                  commitAdd(pendingAdd.product, pendingAdd.qtys, c.cartName);
                  setPendingAdd(null);
                }}
                className={activeCartId === c.id ? `${classes.cartOption} ${classes.cartOptionActive}` : classes.cartOption}
              >
                <ThemeIcon size={32} radius="md" variant="light" style={{ flexShrink: 0 }}>
                  <ShoppingCart size={14} />
                </ThemeIcon>
                <Box flex={1} miw={0}>
                  <Text truncate fz="0.85rem" fw={600}>{c.cartName}</Text>
                  <Group gap={4} c="dimmed" fz="0.7rem" wrap="nowrap">
                    <Store size={10} /> {c.clientName}
                  </Group>
                  <CartCreatorTag createdBy={c.createdBy} />
                </Box>
                {activeCartId === c.id && (
                  <Text span c="gray.9" fz="0.65rem" fw={700} lts="0.05em" tt="uppercase">Atual</Text>
                )}
              </UnstyledButton>
            ))}
            {(clientCarts ?? []).length === 0 && !creatingMode && (
              <Text c="dimmed" ta="center" py="sm" fz="0.8rem">
                Nenhum carrinho ainda para este cliente.
              </Text>
            )}
            {creatingMode ? (
              <Stack gap={8} p="sm" bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-5)' }}>
                <TextInput
                  label="Nome do novo carrinho"
                  autoFocus
                  value={creatingNewName}
                  onChange={e => setCreatingNewName(e.target.value)}
                  placeholder="Ex.: Reposição Inverno 26"
                  radius="md"
                  styles={{
                    label: { color: 'var(--mantine-color-dimmed)', fontSize: '0.72rem', fontWeight: 400, marginBottom: 8 },
                    input: { fontSize: '0.82rem', background: 'var(--mantine-color-gray-0)' },
                  }}
                />
                <Group justify="flex-end" gap={8}>
                  <Button onClick={() => { setCreatingMode(false); setCreatingNewName(''); }} variant="default" c="dimmed" size="compact-sm" h={30} px="sm" radius="md" fz="0.78rem" fw={400}>Cancelar</Button>
                  <Button
                    onClick={() => {
                      const ctx = onCreateCart?.(creatingNewName || 'Novo carrinho');
                      if (ctx) {
                        commitAdd(pendingAdd.product, pendingAdd.qtys, ctx.cartName);
                        setPendingAdd(null);
                      }
                    }}
                    size="compact-sm"
                    h={30}
                    px="sm"
                    radius="md"
                    fz="0.78rem"
                    fw={600}
                  >
                    Criar e adicionar
                  </Button>
                </Group>
              </Stack>
            ) : (
              <UnstyledButton
                onClick={() => setCreatingMode(true)}
                className={classes.dashedBtn}
                w="100%"
                p="sm"
                fw={600}
                style={{ gap: 8 }}
              >
                <Plus size={14} /> Criar novo carrinho
              </UnstyledButton>
            )}
          </Stack>
        </Modal>
      )}

    </Stack>
  );
}
