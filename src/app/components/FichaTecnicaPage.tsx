import { useState } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, TextInput, Select, SegmentedControl, Input, Badge, ThemeIcon, SimpleGrid,
  ActionIcon, Modal, Table, Image, AspectRatio, List, Divider, Tabs, Tooltip, type BoxProps,
} from "@mantine/core";
import { useSmallerThan } from "../lib/responsive";
import { toast } from "../lib/toast";
import classes from "./FichaTecnicaPage.module.css";
import interactive from "./interactive.module.css";
import {
  MagnifyingGlassIcon,
  CaretLeftIcon,
  DownloadSimpleIcon,
  MagnifyingGlassPlusIcon,
  FileTextIcon,
  PackageIcon,
  CheckCircleIcon,
  ArrowsClockwiseIcon,
  XIcon,
} from "@phosphor-icons/react";
import { products, type Product } from "../data/mockData";

type Profile = 'admin' | 'rep' | 'lojista';

const availabilityColors: Record<Product['availability'], string> = {
  'disponível': 'teal',
  'baixo estoque': 'yellow',
  'esgotado': 'red',
};

// cor do número de estoque: zerado, baixo (abaixo do limite) ou ok
function stockColor(qty: number, lowThreshold: number): string {
  if (qty === 0) return 'red.6';
  if (qty < lowThreshold) return 'yellow.7';
  return 'teal.6';
}

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

// nome de cada foto da galeria, na mesma ordem de getGallery — usado nas legendas e nas abas do zoom
const GALLERY_LABELS = ['Lateral', 'Frontal', 'Traseira', 'Solado', 'Detalhe', 'Em uso'];

// bento com as 6 imagens do produto, em 3 linhas de mesma altura:
// metade esquerda = foto 1 (2 linhas) + foto 5; metade direita = foto 2, fotos 3|4, foto 6
const BENTO_GAP = 8;
const BENTO_ROW = `calc((100% - ${2 * BENTO_GAP}px) / 3)`;

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

// título de seção da ficha (20px) — diferencia por hierarquia, não por caixa alta
function SectionLabel({ children, mb = 8 }: { children: React.ReactNode; mb?: number }) {
  return (
    <Title order={2} mb={mb}>
      {children}
    </Title>
  );
}

function AvailabilityBadges({ product }: { product: Product }) {
  return (
    <Group gap={6}>
      <Badge variant="light" color={availabilityColors[product.availability]}>
        {product.availability}
      </Badge>
      {isDiscontinued(product) && (
        <Badge variant="light" color="gray">Fora de linha</Badge>
      )}
    </Group>
  );
}

function ProductCard({ product, onOpen, compact = false }: { product: Product; onOpen: () => void; compact?: boolean }) {
  return (
    <Paper
      component="button"
      type="button"
      onClick={onOpen}
      withBorder
      className={`${interactive.cardButton} ${classes.productCard}`}
      p={0}
    >
      {/* o Box mantém o quadrado mesmo se a imagem falhar e for escondida */}
      <AspectRatio ratio={1}>
        <Box bg="white" p={compact ? 8 : 12}>
          <Image
            src={product.image}
            alt={product.name}
            fit="contain"
            h="100%"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </Box>
      </AspectRatio>
      <Divider color="var(--mantine-color-default-border)" />
      <Box p={compact ? 10 : 'sm'}>
        <Text c="dimmed" size="sm">Ref. {product.reference}</Text>
        <Text fw={600} truncate mt={compact ? 0 : 2} mb={compact ? 0 : 6}>{product.name}</Text>
        {compact ? (
          isDiscontinued(product) && (
            <Badge variant="light" color="gray" mt={4}>Fora de linha</Badge>
          )
        ) : (
          <AvailabilityBadges product={product} />
        )}
      </Box>
    </Paper>
  );
}

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
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <Box>
        <Title order={1}>Ficha Técnica</Title>
        <Text c="dimmed">Consulte informações completas, imagens e medidas de cada produto</Text>
      </Box>

      <Group gap="sm" wrap="wrap" align="flex-end">
        <TextInput
          placeholder="Buscar por nome ou referência"
          leftSection={<MagnifyingGlassIcon size={18} />}
          aria-label="Buscar por nome ou referência"
          value={search}
          onChange={e => setSearch(e.currentTarget.value)}
          flex={{ base: '1 1 100%', md: 1 }}
          miw={{ md: 200 }}
        />
        {/* Linha e categoria vêm dos produtos (listas dinâmicas) → Select; abaixo de md dividem a linha de baixo */}
        <Select
          value={line}
          onChange={v => v && setLine(v)}
          data={lineOptions}
          allowDeselect={false}
          label="Linha"
          flex={{ base: 1, md: 'none' }}
          miw={0}
          w={{ md: 180 }}
        />
        <Select
          value={category}
          onChange={v => v && setCategory(v)}
          data={categoryOptions}
          allowDeselect={false}
          label="Categoria"
          flex={{ base: 1, md: 'none' }}
          miw={0}
          w={{ md: 180 }}
        />
        {/* Ordenação com 3 opções fixas: controle segmentado, na linha inteira abaixo de md */}
        <Input.Wrapper label="Ordenar por" labelElement="div" id="ficha-sort" flex={{ base: '1 1 100%', md: 'none' }}>
          <SegmentedControl
            fullWidth
            value={sortBy}
            onChange={v => setSortBy(v as typeof sortBy)}
            aria-labelledby="ficha-sort-label"
            data={[
              { value: 'relevância', label: 'Relevância' },
              { value: 'nome', label: 'Nome (A-Z)' },
              { value: 'referência', label: 'Referência' },
            ]}
          />
        </Input.Wrapper>
      </Group>

      {sorted.length > 0 ? (
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
          {sorted.map(p => (
            <ProductCard key={p.id} product={p} onOpen={() => onOpen(p)} />
          ))}
        </SimpleGrid>
      ) : (
        <Paper withBorder py={64} px="md">
          <Stack align="center" gap={4} ta="center">
            <ThemeIcon variant="light" color="neutral" size={48} mb={8}>
              <PackageIcon size={24} />
            </ThemeIcon>
            <Text fw={600}>Nenhum produto encontrado</Text>
            <Text c="dimmed">Nenhum produto combina com a busca, a linha e a categoria escolhidas.</Text>
            <Button
              mt="md"
              variant="default"
              leftSection={<XIcon size={16} />}
              onClick={() => { setSearch(''); setLine('Todos'); setCategory('Todos'); }}
            >
              Limpar Busca e Filtros
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function ProductSpecSheet({ product, profile, onBack, onOpenRelated }: { product: Product; profile: Profile; onBack: () => void; onOpenRelated: (p: Product) => void }) {
  // Abaixo do breakpoint sm o zoom da imagem ocupa a tela inteira
  const zoomFullScreen = useSmallerThan('sm');
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

  // downloads simulados (protótipo): a mensagem descreve o que foi iniciado e onde o arquivo vai parar
  const DOWNLOADS_NEXT = 'O arquivo vai para a pasta de downloads do navegador';
  const downloadPhoto = (label: string) =>
    toast.success(`Download da foto ${label.toLowerCase()} iniciado`, DOWNLOADS_NEXT);
  const downloadAllImages = () =>
    toast.success(`Download das ${gallery.length} imagens em um arquivo ZIP iniciado`, DOWNLOADS_NEXT);
  const downloadPdf = () =>
    toast.success(`Download do PDF da ficha técnica de ${product.name} iniciado`, DOWNLOADS_NEXT);

  const bentoTile = (idx: number, size: BoxProps) => {
    const img = gallery[idx];
    const label = GALLERY_LABELS[idx];
    return (
      <Box key={idx} onClick={() => openZoom(idx)} className={classes.tile} {...size}>
        <Image src={img} alt={`${product.name} — ${label}`} fit="cover" pos="absolute" inset={0} w="100%" h="100%" />
        <Box className={classes.overlay}>
          <MagnifyingGlassPlusIcon size={20} className={classes.zoomIcon} />
        </Box>
        {/* legenda visível dizendo qual foto é */}
        <Text component="span" className={classes.tileLabel} size="sm" fw={600}>{label}</Text>
        {/* "Baixar" com texto onde o tile tem espaço; nos tiles pequenos do celular fica só o ícone (com tooltip) */}
        <Button
          onClick={e => { e.stopPropagation(); downloadPhoto(label); }}
          aria-label={`Baixar foto ${label.toLowerCase()}`}
          variant="filled"
          color="dark"
          pos="absolute"
          top={8}
          right={8}
          bg="rgba(0, 0, 0, 0.6)"
          className={classes.downloadButton}
          leftSection={<DownloadSimpleIcon size={18} />}
          visibleFrom="md"
        >
          Baixar
        </Button>
        <Tooltip label={`Baixar foto ${label.toLowerCase()}`}>
          <ActionIcon
            onClick={e => { e.stopPropagation(); downloadPhoto(label); }}
            aria-label={`Baixar foto ${label.toLowerCase()}`}
            variant="filled"
            color="dark"
            size="input-sm"
            pos="absolute"
            top={8}
            right={8}
            bg="rgba(0, 0, 0, 0.6)"
            className={classes.downloadButton}
            hiddenFrom="md"
          >
            <DownloadSimpleIcon size={18} />
          </ActionIcon>
        </Tooltip>
      </Box>
    );
  };

  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1200} mx="auto" w="100%">
      <Box>
        <Button
          onClick={onBack}
          variant="subtle"
          color="gray"
          ml={-12}
          leftSection={<CaretLeftIcon size={16} />}
        >
          Voltar para Ficha Técnica
        </Button>
      </Box>

      <Group justify="flex-end" gap="sm">
        <Button onClick={downloadAllImages} variant="default" leftSection={<DownloadSimpleIcon size={18} />}>
          Baixar Imagens (ZIP)
        </Button>
        <Button onClick={downloadPdf} leftSection={<FileTextIcon size={18} />}>
          Baixar PDF
        </Button>
      </Group>

      {/* Bento grid — 6 imagens do produto */}
      <AspectRatio ratio={4 / 3}>
        <Group gap={BENTO_GAP} wrap="nowrap" align="stretch" className={classes.bento}>
          <Stack gap={BENTO_GAP} flex={1}>
            {bentoTile(0, { flex: 1 })}
            {bentoTile(4, { h: BENTO_ROW })}
          </Stack>
          <Stack gap={BENTO_GAP} flex={1}>
            {bentoTile(1, { flex: 1 })}
            <Group gap={BENTO_GAP} wrap="nowrap" align="stretch" h={BENTO_ROW}>
              {bentoTile(2, { flex: 1 })}
              {bentoTile(3, { flex: 1 })}
            </Group>
            {bentoTile(5, { h: BENTO_ROW })}
          </Stack>
        </Group>
      </AspectRatio>

      {/* Informações do produto */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
        <Stack gap="md">
          <Box>
            <Text c="dimmed" size="sm" mb={2}>Ref. {product.reference}</Text>
            <Title order={1} mb={6}>{product.name}</Title>
            <AvailabilityBadges product={product} />
          </Box>

          <Box>
            <SectionLabel>Descrição</SectionLabel>
            <Text lh={1.6}>{product.description}</Text>
          </Box>

          {highlights && (
            <Box>
              <SectionLabel>Destaques do produto</SectionLabel>
              <List
                spacing={10}
                center={false}
                icon={<Box display="flex" mt={4}><CheckCircleIcon size={16} color="var(--mantine-color-teal-5)" /></Box>}
                styles={{ itemWrapper: { alignItems: 'flex-start' } }}
              >
                {highlights.items.map((h, i) => (
                  <List.Item key={i}>
                    <Text lh={1.5}>
                      <Text span fw={600} inherit>{h.title}: </Text>
                      {h.description}
                    </Text>
                  </List.Item>
                ))}
              </List>
              <Text c="dimmed" size="sm" fs="italic" lh={1.5} mt="sm">
                {highlights.tagline}
              </Text>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Estoque */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
        <SectionLabel>
          {profile === 'lojista' ? 'Estoque por tamanho (fábrica e loja)' : 'Estoque fábrica por tamanho'}
        </SectionLabel>
        <Table.ScrollContainer minWidth={320}>
          <Table verticalSpacing={10} horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr c="dimmed" fz="sm">
                <Table.Th fw={400} pl={0}>Tamanho</Table.Th>
                <Table.Th fw={400} ta="center">Estoque fábrica</Table.Th>
                {profile === 'lojista' && <Table.Th fw={400} ta="center">Estoque loja</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sizes.map(s => {
                const factoryStock = product.grades[s] ?? 0;
                const storeQty = storeStock[s] ?? 0;
                const storeLow = storeQty < 3;
                return (
                  <Table.Tr key={s}>
                    <Table.Td pl={0} fw={600} className={classes.nowrap}>Nº {s}</Table.Td>
                    <Table.Td ta="center">
                      <Text span className="mono" fw={600} c={stockColor(factoryStock, 20)}>{factoryStock}</Text>
                    </Table.Td>
                    {profile === 'lojista' && (
                      <Table.Td>
                        <Group gap="sm" justify="flex-end" wrap="nowrap">
                          <Text span className="mono" fw={600} c={stockColor(storeQty, 3)}>{storeQty}</Text>
                          {storeLow && (
                            <Button
                              onClick={() => toast.success(
                                `Reposição do Nº ${s} solicitada`,
                                'O pedido de reposição segue para a fábrica, que confirma o envio',
                              )}
                              size="sm"
                              variant="light"
                              leftSection={<ArrowsClockwiseIcon size={16} />}
                              flex="none"
                            >
                              Solicitar Reposição
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
      </Paper>

      {/* Produtos relacionados */}
      {related.length > 0 && (
        <Box>
          <SectionLabel mb={12}>Produtos relacionados</SectionLabel>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            {related.map(p => (
              <ProductCard key={p.id} product={p} onOpen={() => onOpenRelated(p)} compact />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Zoom */}
      <Modal
        opened={zoomOpen}
        onClose={() => setZoomOpen(false)}
        size={672}
        fullScreen={zoomFullScreen}
        centered
        title={<Text fw={600}>{product.name} · {GALLERY_LABELS[activeImage]}</Text>}
      >
        {/* abas com o nome de cada foto para trocar a imagem sem fechar o zoom */}
        <Tabs value={String(activeImage)} onChange={v => v !== null && setActiveImage(Number(v))} mb="md">
          <Tabs.List className={classes.zoomTabs}>
            {GALLERY_LABELS.map((label, i) => (
              <Tabs.Tab key={label} value={String(i)}>{label}</Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
        <Image src={gallery[activeImage]} alt={`${product.name} — ${GALLERY_LABELS[activeImage]}`} fit="contain" />
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
