import { useState, type CSSProperties } from "react";
import {
  ActionIcon, Badge, Box, Button, Group, Modal, NativeSelect, Paper, SimpleGrid,
  Stack, Table, Text, TextInput, Title, UnstyledButton, VisuallyHidden, type BadgeProps,
} from "@mantine/core";
import { toast } from "@/lib/toast";
import {
  Search, ChevronLeft, Download, ZoomIn,
  FileText, Package2, CheckCircle2, RefreshCw,
} from "lucide-react";
import { products, type Product } from "../data/mockData";
import classes from "./FichaTecnicaPage.module.css";

type Profile = 'admin' | 'rep' | 'lojista';

const availabilityBadge: Record<Product['availability'], Pick<BadgeProps, 'color' | 'c'>> = {
  'disponível': { color: 'teal', c: 'teal.7' },
  'baixo estoque': { color: 'yellow', c: 'yellow.8' },
  'esgotado': { color: 'red', c: 'red.7' },
};

const num = { fontVariantNumeric: 'tabular-nums' } as const;

// produtos descontinuados — não fazem mais parte do sortimento vendável
const discontinuedIds = new Set(['P003', 'P006']);
const isDiscontinued = (product: Product) => discontinuedIds.has(product.id);

interface Highlight {
  title: string;
  description: string;
}

// destaques relacionando cada característica do produto ao seu diferencial — mock para todo o
// catálogo, usando o texto real do Flow Preto (Tesla Flow All Black Reflect) como referência de estilo
const productHighlights: Record<string, { items: Highlight[]; tagline: string }> = {
  P001: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual moderno com linhas marcantes inspiradas na cultura urbana.' },
      { title: 'Cabedal Premium', description: 'Confeccionado em lona resistente com acabamento denim e recortes exclusivos para maior durabilidade e estilo.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Fat Lace', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Acabamento limpo e recortes em azul que valorizam o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Flow XL Denim é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P002: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual clean e versátil, com linhas minimalistas que combinam com qualquer produção.' },
      { title: 'Cabedal Premium', description: 'Material sintético de alta qualidade, com costuras reforçadas para maior durabilidade.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme e confortável, ideal para o uso diário.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Acabamento branco impecável que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Coil Branco é ideal para quem busca praticidade sem abrir mão do estilo — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P003: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual arrojado, com contraste vermelho e branco que chama atenção nas ruas.' },
      { title: 'Cabedal Premium', description: 'Material sintético resistente, com recortes exclusivos da linha Hertz Art.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Combinação vermelho e branco que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Hertz Art Vermelho é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P004: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual sofisticado, com tom marrom que une estilo urbano e versatilidade.' },
      { title: 'Cabedal Premium', description: 'Material sintético de alta qualidade, com costuras reforçadas para maior durabilidade.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme e confortável, ideal para o uso diário.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Acabamento em tom marrom que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Hertz Marrom é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P005: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual moderno com linhas marcantes inspiradas na cultura urbana.' },
      { title: 'Cabedal Premium', description: 'Combinação de lona resistente e camurça natural, com costuras reforçadas e recortes exclusivos para maior durabilidade e estilo.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Fat Lace', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade. O design exclusivo traz cores vibrantes que unem funcionalidade e personalidade em cada passo.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Cadarços resistentes e acabamento limpo que valorizam o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Flow All Black Reflect é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P006: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual moderno, com contraste navy e branco inspirado na cultura urbana.' },
      { title: 'Cabedal Premium', description: 'Material sintético de alta qualidade, com costuras reforçadas para maior durabilidade.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme e confortável, ideal para o uso diário.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Combinação navy e branco que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Coil Navy é ideal para quem busca praticidade sem abrir mão do estilo — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P007: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual arrojado, com contraste azul e branco que chama atenção nas ruas.' },
      { title: 'Cabedal Premium', description: 'Material sintético resistente, com recortes exclusivos da linha Hertz Art.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Resistente', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Combinação azul e branco que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Hertz Art Azul é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
  P008: {
    items: [
      { title: 'Design Streetwear Autêntico', description: 'Visual moderno com linhas marcantes inspiradas na cultura urbana.' },
      { title: 'Cabedal Premium', description: 'Confeccionado em lona resistente, com costuras reforçadas e recortes exclusivos para maior durabilidade e estilo.' },
      { title: 'Identidade Tesla', description: 'Logo aplicado em destaque na lateral, reforçando a autenticidade do modelo.' },
      { title: 'Cadarço Fat Lace', description: 'Ajuste firme, confortável e com estilo marcante.' },
      { title: 'Solado de Alta Performance', description: 'Produzido em borracha de alta resistência, garante firmeza ao caminhar, aderência superior em diferentes superfícies e longa durabilidade.' },
      { title: 'Conforto Avançado', description: 'Palmilha em PU com tecnologia de amortecimento para absorção de impacto.' },
      { title: 'Detalhes Urbanos', description: 'Acabamento all black que valoriza o estilo urbano.' },
    ],
    tagline: 'Tênis Tesla Flow XL Preto é ideal para quem quer se expressar com atitude e originalidade — seja nas ruas, no rolê com os amigos ou no dia a dia.',
  },
};

// sempre 6 fotos — cicla pelas imagens disponíveis na linha do produto quando há menos de 6 únicas
function getGallery(product: Product): string[] {
  const sameLine = products.filter(p => p.line === product.line).map(p => p.image);
  const unique = Array.from(new Set([product.image, ...sameLine]));
  return Array.from({ length: 6 }, (_, i) => unique[i % unique.length]);
}

// spans para montar um bento grid (4 colunas x 3 linhas) com as 6 imagens do produto
function bentoSpanStyle(index: number): CSSProperties {
  if (index === 0) return { gridColumn: 'span 2', gridRow: 'span 2' };
  if (index === 1) return { gridColumn: 'span 2', gridRow: 'span 1' };
  if (index === 2 || index === 3) return { gridColumn: 'span 1', gridRow: 'span 1' };
  return { gridColumn: 'span 2', gridRow: 'span 1' };
}

const colorPalette = ['Preto', 'Branco', 'Cinza', 'Vermelho', 'Azul', 'Navy', 'Bege', 'Marrom'];

// outras cores do mesmo modelo — mesma referência base, sufixo diferente (ex.: 2510-01 → 2510-15, 2510-23)
function getColorVariants(product: Product): Product[] {
  const [base, suffix] = product.reference.split('-');
  if (!base || !suffix) return [];
  const suffixNum = parseInt(suffix, 10);
  const availableColors = colorPalette.filter(c => !product.colors.includes(c));

  return [14, 22].map((offset, i) => {
    const variantSuffix = String(suffixNum + offset).padStart(suffix.length, '0');
    const color = availableColors[i % availableColors.length] ?? `Cor ${i + 1}`;
    return {
      ...product,
      id: `${product.id}-VAR-${variantSuffix}`,
      reference: `${base}-${variantSuffix}`,
      name: `${product.line} ${color}`,
      colors: [color],
    };
  });
}

// estoque da loja — fração pequena e determinística do estoque de fábrica por tamanho
// (não existe um dado real de estoque por loja no mock; cada loja mantém pouca profundidade de grade)
function getStoreStock(product: Product): Record<string, number> {
  const sizes = Object.keys(product.grades);
  const ratios = [0.08, 0.05, 0.12, 0.03, 0.15, 0.07];
  const result: Record<string, number> = {};
  sizes.forEach((s, i) => {
    const factory = product.grades[s] ?? 0;
    const seed = (product.id.charCodeAt(product.id.length - 1) + i) % ratios.length;
    result[s] = Math.round(factory * ratios[seed]);
  });
  return result;
}

const lineOptions = ['Todos', ...Array.from(new Set(products.map(p => p.line)))];
const categoryOptions = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

const labelStyle = { fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em' };

function ProductGrid({ onOpen }: { onOpen: (product: Product) => void }) {
  const [search, setSearch] = useState('');
  const [line, setLine] = useState('Todos');
  const [category, setCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<'relevância' | 'nome' | 'referência'>('relevância');

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    const matchLine = line === 'Todos' || p.line === line;
    const matchCategory = category === 'Todos' || p.category === category;
    return matchSearch && matchLine && matchCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'nome') return a.name.localeCompare(b.name);
    if (sortBy === 'referência') return a.reference.localeCompare(b.reference);
    return 0;
  });

  return (
    <Stack p="lg" maw={1400} mx="auto" w="100%" gap={20}>
      <Box>
        <Title order={2} fw={700} fz="1rem">Ficha Técnica</Title>
        <Text c="dimmed" fz="0.8rem">Consulte informações completas, imagens e medidas de cada produto</Text>
      </Box>

      <Group gap="sm" wrap="wrap">
        <TextInput
          flex={1}
          miw={200}
          leftSection={<Search size={14} />}
          type="text"
          placeholder="Buscar por nome ou referência..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          styles={{ input: { fontSize: '0.82rem' } }}
        />
        <NativeSelect
          value={line}
          onChange={e => setLine(e.target.value)}
          styles={{ input: { fontSize: '0.82rem' } }}
          data={lineOptions}
        />
        <NativeSelect
          value={category}
          onChange={e => setCategory(e.target.value)}
          styles={{ input: { fontSize: '0.82rem' } }}
          data={categoryOptions}
        />
        <NativeSelect
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          styles={{ input: { fontSize: '0.82rem' } }}
          data={[
            { value: 'relevância', label: 'Relevância' },
            { value: 'nome', label: 'Nome (A-Z)' },
            { value: 'referência', label: 'Referência' },
          ]}
        />
      </Group>

      {sorted.length > 0 ? (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
          {sorted.map(p => (
            <UnstyledButton
              key={p.id}
              onClick={() => onOpen(p)}
              className={classes.productCard}
            >
              <Box bg="white" style={{ aspectRatio: '1 / 1' }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </Box>
              <Box p="sm" className={classes.cardFooter}>
                <Text c="dimmed" fz="0.68rem" tt="uppercase">Ref. {p.reference}</Text>
                <Text truncate mt={2} mb={6} fw={600} fz="0.85rem">{p.name}</Text>
                <Group gap={6} wrap="wrap">
                  <Badge {...availabilityBadge[p.availability]} variant="light" radius="xl" tt="none" size="sm" fz="0.62rem" fw={600} px={8}>
                    {p.availability}
                  </Badge>
                  {isDiscontinued(p) && (
                    <Badge color="gray" c="dimmed" variant="light" radius="xl" tt="none" size="sm" fz="0.62rem" fw={600} px={8}>
                      Fora de linha
                    </Badge>
                  )}
                </Group>
              </Box>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      ) : (
        <Paper withBorder radius="lg" py={64}>
          <Stack align="center" justify="center" ta="center" gap={0}>
            <Package2 size={40} color="var(--mantine-color-gray-4)" style={{ marginBottom: 12 }} />
            <Text fw={600}>Nenhum produto encontrado</Text>
            <Text c="dimmed" mt={4} fz="0.85rem">Tente ajustar os filtros de busca</Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function ProductSpecSheet({ product, profile, onBack, onOpenRelated }: { product: Product; profile: Profile; onBack: () => void; onOpenRelated: (p: Product) => void }) {
  const gallery = getGallery(product);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const related = getColorVariants(product);
  const sizes = Object.keys(product.grades);
  const storeStock = getStoreStock(product);
  const highlights = productHighlights[product.id];

  const openZoom = (idx: number) => {
    setActiveImage(idx);
    setZoomOpen(true);
  };

  return (
    <Stack p="lg" maw={1200} mx="auto" w="100%" gap={20}>
      <UnstyledButton
        onClick={onBack}
        className={classes.backLink}
        fz="0.82rem"
        fw={500}
        style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
      >
        <ChevronLeft size={16} /> Voltar para Ficha Técnica
      </UnstyledButton>

      <Group justify="flex-end" gap="xs" wrap="wrap">
        <Button
          onClick={() => toast.success('Imagens baixadas (ZIP)')}
          variant="default"
          size="xs"
          fz="0.78rem"
          fw={500}
          leftSection={<Download size={14} />}
        >
          Baixar imagens
        </Button>
        <Button
          onClick={() => toast.success('PDF gerado')}
          size="xs"
          fz="0.78rem"
          fw={600}
          leftSection={<FileText size={14} />}
        >
          Baixar PDF
        </Button>
      </Group>

      {/* Bento grid — 6 imagens do produto */}
      <Box className={classes.bentoGrid}>
        {gallery.map((img, idx) => (
          <Box
            key={idx}
            onClick={() => openZoom(idx)}
            className={classes.bentoCell}
            style={bentoSpanStyle(idx)}
          >
            <img src={img} alt={`${product.name} — foto ${idx + 1}`} className={classes.bentoImg} />
            <Box className={classes.bentoOverlay}>
              <ZoomIn size={20} className={classes.bentoZoomIcon} />
            </Box>
            <ActionIcon
              onClick={e => { e.stopPropagation(); toast.success('Imagem baixada'); }}
              aria-label="Baixar imagem"
              size={28}
              radius="md"
              variant="transparent"
              className={classes.bentoDownload}
            >
              <Download size={14} />
            </ActionIcon>
          </Box>
        ))}
      </Box>

      {/* Informações do produto */}
      <Paper withBorder radius="lg" p={20}>
        <Stack gap="md">
          <Box>
            <Text c="dimmed" mb={2} fz="0.72rem" tt="uppercase">Ref. {product.reference}</Text>
            <Title order={2} mb={6} fw={700} fz="1.15rem">{product.name}</Title>
            <Group gap="xs" wrap="wrap">
              <Badge {...availabilityBadge[product.availability]} variant="light" radius="xl" tt="none" fz="0.7rem" fw={600} px={8}>
                {product.availability}
              </Badge>
              {isDiscontinued(product) && (
                <Badge color="gray" c="dimmed" variant="light" radius="xl" tt="none" fz="0.7rem" fw={600} px={8}>
                  Fora de linha
                </Badge>
              )}
            </Group>
          </Box>

          <Box>
            <Text c="dimmed" mb={6} style={labelStyle}>Descrição</Text>
            <Text fz="0.85rem" lh={1.6}>{product.description}</Text>
          </Box>

          {highlights && (
            <Box>
              <Text c="dimmed" mb="xs" style={labelStyle}>Destaques do produto</Text>
              <Stack component="ul" gap={10} m={0} p={0} style={{ listStyle: 'none' }}>
                {highlights.items.map((h, i) => (
                  <Group component="li" key={i} align="flex-start" gap="xs" wrap="nowrap">
                    <CheckCircle2 size={14} color="var(--mantine-color-teal-6)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text fz="0.82rem" lh={1.5}>
                      <Text span fw={600} inherit>{h.title}: </Text>
                      {h.description}
                    </Text>
                  </Group>
                ))}
              </Stack>
              <Text c="dimmed" mt="sm" fz="0.8rem" fs="italic" lh={1.5}>
                {highlights.tagline}
              </Text>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Estoque */}
      <Paper withBorder radius="lg" p={20}>
        <Box>
          <Text c="dimmed" mb="xs" style={labelStyle}>
            {profile === 'lojista' ? 'Estoque por tamanho (fábrica e loja)' : 'Estoque fábrica por tamanho'}
          </Text>
          <Table.ScrollContainer minWidth={0}>
            <Table withRowBorders={false} horizontalSpacing={0}>
              <Table.Thead>
                <Table.Tr c="dimmed" ta="left" fz="0.68rem" tt="uppercase" lts="0.04em" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                  <Table.Th py="xs" pr="md" fw={400}>Tamanho</Table.Th>
                  <Table.Th py="xs" px="md" fw={400} ta="center">Estoque fábrica</Table.Th>
                  {profile === 'lojista' && <Table.Th py="xs" pl="md" fw={400} ta="center">Estoque loja</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sizes.map(s => {
                  const factoryStock = product.grades[s] ?? 0;
                  const factoryColor = factoryStock === 0 ? 'red.6' : factoryStock < 20 ? 'yellow.7' : 'teal.7';
                  const storeQty = storeStock[s] ?? 0;
                  const storeColor = storeQty === 0 ? 'red.6' : storeQty < 3 ? 'yellow.7' : 'teal.7';
                  const storeLow = storeQty < 3;
                  return (
                    <Table.Tr key={s} className={classes.stockRow}>
                      <Table.Td py={10} pr="md" fz="0.82rem" fw={600} style={{ whiteSpace: 'nowrap' }}>Nº {s}</Table.Td>
                      <Table.Td py={10} px="md" ta="center" c={factoryColor} fz="0.8rem" fw={600} style={num}>
                        {factoryStock}
                      </Table.Td>
                      {profile === 'lojista' && (
                        <Table.Td py={10} pl="md">
                          <Group justify="flex-end" gap="xs" wrap="nowrap">
                            <Text span c={storeColor} fz="0.8rem" fw={600} style={num}>{storeQty}</Text>
                            {storeLow && (
                              <Button
                                onClick={() => toast.success(`Reposição rápida solicitada — Nº ${s}`)}
                                size="compact-xs"
                                radius="sm"
                                fz="0.65rem"
                                fw={600}
                                leftSection={<RefreshCw size={12} />}
                                style={{ flexShrink: 0 }}
                              >
                                Reposição rápida
                              </Button>
                            )}
                          </Group>
                        </Table.Td>
                      )}
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Box>
      </Paper>

      {/* Produtos relacionados */}
      {related.length > 0 && (
        <Box>
          <Text c="dimmed" mb="sm" style={labelStyle}>Produtos relacionados</Text>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            {related.map(p => (
              <UnstyledButton
                key={p.id}
                onClick={() => onOpenRelated(p)}
                className={classes.productCard}
              >
                <Box bg="white" style={{ aspectRatio: '1 / 1' }}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </Box>
                <Box p={10} className={classes.cardFooter}>
                  <Text c="dimmed" fz="0.65rem" tt="uppercase">Ref. {p.reference}</Text>
                  <Text truncate fz="0.8rem" fw={600}>{p.name}</Text>
                  {isDiscontinued(p) && (
                    <Badge color="gray" c="dimmed" variant="light" radius="xl" tt="none" size="xs" mt={4} fz="0.6rem" fw={600} px={6}>
                      Fora de linha
                    </Badge>
                  )}
                </Box>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Zoom */}
      <Modal
        opened={zoomOpen}
        onClose={() => setZoomOpen(false)}
        centered
        size={672}
        withCloseButton
        title={<VisuallyHidden>{product.name}</VisuallyHidden>}
      >
        <img src={gallery[activeImage]} alt={product.name} style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} />
      </Modal>
    </Stack>
  );
}

export function FichaTecnicaPage({ profile }: { profile: Profile }) {
  const [selected, setSelected] = useState<Product | null>(null);

  if (selected) {
    return <ProductSpecSheet product={selected} profile={profile} onBack={() => setSelected(null)} onOpenRelated={setSelected} />;
  }

  return <ProductGrid onOpen={setSelected} />;
}
