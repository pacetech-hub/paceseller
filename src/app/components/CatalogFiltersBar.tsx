import { useState } from "react";
import {
  ActionIcon, Badge, Box, Button, Chip, ColorSwatch, Select, Group, Paper, Popover, Radio, SimpleGrid, Stack, Text, TextInput, Tooltip,
} from "@mantine/core";
import {
  FunnelIcon,
  TagIcon,
  StackIcon,
  PaletteIcon,
  CurrencyDollarIcon,
  XIcon,
  CaretDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  CrosshairIcon,
  RulerIcon,
  SortAscendingIcon,
  type Icon,
} from "@phosphor-icons/react";
import { products } from "../data/mockData";
import { RADAR_FILTERS, goodMarginFilterVisible, type RadarFilter } from "../data/radar";
import classes from "./CatalogFiltersBar.module.css";
import interactive from "./interactive.module.css";
import { EmptyState } from "./ui/EmptyState";

export type CatalogFilters = {
  search: string;
  line: string;
  category: string;
  colors: string[];
  /** Faixa de preço sobre o Seu custo, sem sobreposição (FR-202). '' = todas. */
  priceBand: string;
  /** Sinais do Radar (várias ao mesmo tempo). */
  radar: RadarFilter[];
  collection: string;
  /** Numeração com pares disponíveis. '' = todas. */
  size: string;
  priceTable: string;
};

// Faixas de preço sobre o Seu custo, sem sobreposição (FR-202)
export const PRICE_BANDS = [
  { value: 'ate-250', label: 'Até R$ 249,99', min: 0, max: 249.99 },
  { value: '250-320', label: 'R$ 250 a R$ 319,99', min: 250, max: 319.99 },
  { value: '320-mais', label: 'R$ 320 ou mais', min: 320, max: Infinity },
];
export const priceBandOf = (v: string) => PRICE_BANDS.find(b => b.value === v);
export const allCollections = Array.from(new Set(products.map(p => p.collection))).sort();
export const allSizes = Array.from(new Set(products.flatMap(p => Object.keys(p.grades)))).sort();
export const radarFilterOptions = RADAR_FILTERS.filter(f => f.value !== 'boa-margem' || goodMarginFilterVisible);

export const priceTables = [
  { id: 'padrao', label: 'Tabela Padrão', desc: '30/60/90 dias' },
  { id: 'avista', label: 'À vista', desc: '5% desconto' },
  { id: 'promo', label: 'Tabela Promocional', desc: 'Coleção atual' },
  { id: 'atacado', label: 'Atacado', desc: 'Acima de 50 pares' },
];

// linhas que existem no catálogo (vindas dos produtos)
const lines = ['Todos', ...Array.from(new Set(products.map(p => p.line))).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
const categories = ['Todos', 'Social', 'Casual', 'Esportivo', 'Sandália', 'Bota'];

const allColors = Array.from(
  new Set(products.flatMap(p => p.colors))
).sort();

// "Mais usados": as opções com mais pares vendidos no mock (soma de soldUnits dos produtos)
function topBySales(options: string[], valuesOf: (p: typeof products[number]) => string[], n = 3): string[] {
  const sales = new Map<string, number>();
  products.forEach(p => valuesOf(p).forEach(v => sales.set(v, (sales.get(v) ?? 0) + p.soldUnits)));
  return options
    .filter(o => (sales.get(o) ?? 0) > 0)
    .sort((a, b) => (sales.get(b) ?? 0) - (sales.get(a) ?? 0))
    .slice(0, n);
}

const popularLines = topBySales(lines, p => [p.line]);
// as categorias do filtro não aparecem nos produtos do mock (todos são "Tênis"),
// então as mais usadas vêm desta lista fixa — mock
const POPULAR_CATEGORIES = ['Casual', 'Esportivo'];
const soldCategories = topBySales(categories, p => [p.category]);
export const popularCategories = soldCategories.length > 0 ? soldCategories : POPULAR_CATEGORIES;
const popularColors = topBySales(allColors, p => p.colors, 4);

const colorSwatch: Record<string, string> = {
  Preto: '#111', Branco: '#fff', Azul: '#2563eb', Navy: '#1e3a8a',
  Vermelho: '#dc2626', Marrom: '#7c4a2a', Denim: '#3b6ea5',
  Cinza: '#6b7280', Verde: '#16a34a', Amarelo: '#facc15',
  Rosa: '#ec4899', Bege: '#d6c2a3',
};

export const defaultFilters: CatalogFilters = {
  search: '',
  line: 'Todos',
  category: 'Todos',
  colors: [],
  priceBand: '',
  radar: [],
  collection: 'Todas',
  size: '',
  priceTable: 'padrao',
};

const BORDER_COLOR = 'var(--mantine-color-default-border)';

/** Ordenação do catálogo (lista suspensa "Ordenar", à direita dos filtros). */
export const SORT_OPTIONS = [
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  // diferença entre o PDV sugerido e o Seu custo (a margem do lojista)
  { value: 'maior-desconto', label: 'Maior desconto' },
];
export type CatalogSort = (typeof SORT_OPTIONS)[number]['value'];

interface Props {
  filters: CatalogFilters;
  onChange: (f: CatalogFilters) => void;
  sortBy: string;
  onSortChange: (v: string) => void;
}

// Filtros rápidos em pílulas (os mais usados ficam à vista); o resto fica em "Mais filtros".
const QUICK_SIGNALS: RadarFilter[] = ['alto-giro', 'boa-margem', 'lancamentos', 'oportunidade-perdida'];
const TAIL_SIGNALS: RadarFilter[] = ['benchmark', 'reposicao'];
const PRICE_PILLS: Record<string, string> = { 'ate-250': 'Até R$250', '250-320': 'R$250 – R$320', '320-mais': 'Acima de R$320' };

/** Pílula de filtro: contorno quando inativa, preenchida quando ativa; texto de 12px. */
function Pill({ active, onClick, children, caret, ariaLabel }: {
  active: boolean; onClick?: () => void; children: React.ReactNode; caret?: boolean; ariaLabel?: string;
}) {
  return (
    <Button
      size="compact-sm"
      radius="xl"
      variant={active ? 'filled' : 'default'}
      color="brand"
      h={30}
      px={12}
      // o tema deixa todo rótulo de botão em semibold; a pílula usa 12px e peso normal quando inativa
      styles={{ label: { fontSize: 'var(--mantine-font-size-xs)', fontWeight: active ? 600 : 400 } }}
      onClick={onClick}
      aria-pressed={caret ? undefined : active}
      aria-label={ariaLabel}
      rightSection={caret ? <CaretDownIcon size={12} /> : undefined}
      className={classes.pill}
    >
      {children}
    </Button>
  );
}

function PillPopover({ label, active, width = 320, children }: { label: string; active: boolean; width?: number; children: React.ReactNode }) {
  return (
    <Popover position="bottom-start" shadow="md" width={width} withinPortal>
      <Popover.Target>
        <span><Pill active={active} caret>{label}</Pill></span>
      </Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
}

const PillDivider = () => <Box w={1} h={20} flex="none" bg="var(--mantine-color-default-border)" aria-hidden />;

/** Busca do catálogo (fica na linha das abas, à direita). */
export function CatalogSearch({ filters, onChange }: { filters: CatalogFilters; onChange: (f: CatalogFilters) => void }) {
  return (
    <TextInput
      size="sm"
      w={{ base: '100%', sm: 280 }}
      placeholder="Buscar produtos"
      aria-label="Buscar produtos"
      value={filters.search}
      onChange={e => onChange({ ...filters, search: e.currentTarget.value })}
      leftSection={<MagnifyingGlassIcon size={16} />}
      rightSection={filters.search ? (
        <ActionIcon onClick={() => onChange({ ...filters, search: '' })} variant="subtle" color="gray" size="input-xs" aria-label="Limpar busca">
          <XIcon size={14} />
        </ActionIcon>
      ) : null}
    />
  );
}

// Linha de pílulas: sinais do Radar | faixas de preço | Coleção, Numeração | Benchmark, Reposição | Mais filtros
export function CatalogFiltersBar({ filters, onChange, sortBy, onSortChange }: Props) {
  const [colorQuery, setColorQuery] = useState('');
  const visibleColors = allColors.filter(c => normalize(c).includes(normalize(colorQuery.trim())));
  const visiblePopularColors = popularColors.filter(c => visibleColors.includes(c));
  const visibleOtherColors = visibleColors.filter(c => !popularColors.includes(c));
  const toggleColor = (c: string) => {
    const next = filters.colors.includes(c)
      ? filters.colors.filter(x => x !== c)
      : [...filters.colors, c];
    onChange({ ...filters, colors: next });
  };

  // Amostras de cor: botões só com a cor → o nome aparece em tooltip (rótulo extra; aria-label tem o nome)
  const renderSwatches = (list: string[]) => (
    <SimpleGrid cols={6} spacing="xs" verticalSpacing="xs" className={classes.swatchGrid}>
      {list.map(c => {
        const active = filters.colors.includes(c);
        const bg = colorSwatch[c] || '#94a3b8';
        return (
          <Tooltip key={c} label={c}>
            <ColorSwatch
              component="button"
              type="button"
              onClick={() => toggleColor(c)}
              aria-label={`Cor ${c}`}
              aria-pressed={active}
              color={bg}
              size={32}
              withShadow={false}
              bd={`2px solid ${active ? 'var(--mantine-color-brand-9)' : BORDER_COLOR}`}
              c={bg === '#fff' ? 'black' : 'white'}
              className={classes.swatch}
              data-active={active || undefined}
            >
              {active && <CheckIcon size={16} />}
            </ColorSwatch>
          </Tooltip>
        );
      })}
    </SimpleGrid>
  );

  const toggleRadar = (v: RadarFilter) => onChange({
    ...filters,
    radar: filters.radar.includes(v) ? filters.radar.filter(x => x !== v) : [...filters.radar, v],
  });
  const signalPill = (v: RadarFilter) => {
    const meta = radarFilterOptions.find(f => f.value === v);
    if (!meta) return null; // "Boa margem" some enquanto as margens forem iguais
    return <Pill key={v} active={filters.radar.includes(v)} onClick={() => toggleRadar(v)}>{meta.label}</Pill>;
  };
  const otherSignals = radarFilterOptions.filter(f => !QUICK_SIGNALS.includes(f.value) && !TAIL_SIGNALS.includes(f.value));

  // o que está dentro de "Mais filtros" (para a pílula mostrar quantos estão ativos)
  const moreActive =
    (filters.line !== 'Todos' ? 1 : 0) + (filters.category !== 'Todos' ? 1 : 0) + filters.colors.length +
    filters.radar.filter(r => otherSignals.some(o => o.value === r)).length +
    (filters.priceTable !== defaultFilters.priceTable ? 1 : 0);
  const currentTable = priceTables.find(t => t.id === filters.priceTable);

  return (
    <Group gap={8} wrap="wrap" align="center" role="group" aria-label="Filtros do catálogo" className={classes.pillRow}>
      {QUICK_SIGNALS.map(signalPill)}
      <PillDivider />
      {PRICE_BANDS.map(b => (
        <Pill key={b.value} active={filters.priceBand === b.value} onClick={() => onChange({ ...filters, priceBand: filters.priceBand === b.value ? '' : b.value })} ariaLabel={`Seu custo: ${b.label}`}>
          {PRICE_PILLS[b.value]}
        </Pill>
      ))}
      <PillDivider />
      <PillPopover label={filters.collection !== 'Todas' ? `Coleção: ${filters.collection}` : 'Coleção'} active={filters.collection !== 'Todas'}>
        <ChoiceChips options={['Todas', ...allCollections]} value={filters.collection} onSelect={v => onChange({ ...filters, collection: v })} />
      </PillPopover>
      <PillPopover label={filters.size ? `Numeração: ${filters.size}` : 'Numeração'} active={!!filters.size}>
        <ChoiceChips options={['Todas', ...allSizes]} value={filters.size || 'Todas'} onSelect={v => onChange({ ...filters, size: v === 'Todas' ? '' : v })} />
      </PillPopover>
      <PillDivider />
      {TAIL_SIGNALS.map(signalPill)}

      {/* Tabela de preço, linha, categoria, cores, outros sinais e ordenação */}
      <PillPopover label={moreActive > 0 ? `Mais filtros (${moreActive})` : 'Mais filtros'} active={moreActive > 0} width={360}>
        <Stack gap="md">
          <Select
            label="Ordenar por"
            data={SORT_OPTIONS}
            value={sortBy}
            onChange={v => v && onSortChange(v)}
            allowDeselect={false}
            leftSection={<SortAscendingIcon size={16} />}
            comboboxProps={{ withinPortal: false }}
          />
          <Radio.Group value={filters.priceTable} onChange={v => onChange({ ...filters, priceTable: v })} name="catalog-price-table" label={`Tabela de preço · ${currentTable?.label ?? ''}`}>
            <Group gap="xs" mt={6}>
              {priceTables.map(t => (
                <Chip key={t.id} checked={filters.priceTable === t.id} onChange={() => onChange({ ...filters, priceTable: t.id })} variant="filled" size="sm">
                  {t.label}
                </Chip>
              ))}
            </Group>
          </Radio.Group>
          {otherSignals.length > 0 && (
            <Box>
              <Text fw={600} size="sm" mb={6}>Outros sinais do Radar</Text>
              <Group gap="xs">
                {otherSignals.map(f => (
                  <Chip key={f.value} checked={filters.radar.includes(f.value)} onChange={() => toggleRadar(f.value)} variant="filled" size="sm">{f.label}</Chip>
                ))}
              </Group>
            </Box>
          )}
          <Box>
            <Text fw={600} size="sm" mb={6}>Modelo / Linha</Text>
            <SearchableChips
              options={lines}
              popular={popularLines}
              restLabel="Outras linhas"
              value={filters.line}
              onSelect={l => onChange({ ...filters, line: l })}
              searchLabel="Buscar linha"
              placeholder="ex.: Flow"
              emptyTitle="Nenhuma linha encontrada"
              emptyText="Nenhuma linha com esse nome. Limpe a busca para ver todas."
            />
          </Box>
          <Box>
            <Text fw={600} size="sm" mb={6}>Categoria</Text>
            <ChoiceChips options={categories} popular={popularCategories} restLabel="Outras categorias" value={filters.category} onSelect={c => onChange({ ...filters, category: c })} />
          </Box>
          <Box>
            <Text fw={600} size="sm" mb={6}>Cores</Text>
            <TextInput
              aria-label="Buscar cor"
              placeholder="Buscar cor (ex.: Preto)"
              leftSection={<MagnifyingGlassIcon size={18} />}
              value={colorQuery}
              onChange={e => setColorQuery(e.currentTarget.value)}
              mb="xs"
            />
            {visiblePopularColors.length > 0 && renderSwatches(visiblePopularColors)}
            {visibleOtherColors.length > 0 && <Box mt="xs">{renderSwatches(visibleOtherColors)}</Box>}
          </Box>
        </Stack>
      </PillPopover>
    </Group>
  );
}

/** Quantos filtros estão ativos (busca e tabela de preço não contam). */
export function countActiveFilters(f: CatalogFilters): number {
  return (f.line !== 'Todos' ? 1 : 0) + (f.category !== 'Todos' ? 1 : 0) + f.colors.length + (f.priceBand ? 1 : 0)
    + f.radar.length + (f.collection !== 'Todas' ? 1 : 0) + (f.size ? 1 : 0);
}

// busca sem diferenciar maiúsculas nem acentos
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Chips de escolha única. Com `popular`: "Todos" primeiro, depois "Mais usados" e o resto
// (cada opção aparece uma vez só). Exportado para reaproveitar no painel de filtros do catálogo.
export function ChoiceChips({ options, value, onSelect, popular = [], restLabel = 'Outras opções' }: {
  options: string[]; value: string; onSelect: (v: string) => void;
  popular?: string[]; restLabel?: string;
}) {
  const chip = (o: string) => (
    <Chip
      key={o}
      value={o}
      variant="filled"
      icon={null}
      styles={{ iconWrapper: { display: 'none' } }}
    >
      {o}
    </Chip>
  );
  const allOption: string[] = options.filter(o => o === 'Todos' || o === 'Todas');
  const popularVisible = popular.filter(o => options.includes(o));
  const rest = options.filter(o => !allOption.includes(o) && !popularVisible.includes(o));

  if (popularVisible.length === 0) {
    return (
      <Chip.Group multiple={false} value={value} onChange={onSelect}>
        <Group gap="sm">{options.map(chip)}</Group>
      </Chip.Group>
    );
  }
  return (
    <Chip.Group multiple={false} value={value} onChange={onSelect}>
      <Stack gap="sm">
        {allOption.length > 0 && <Group gap="sm">{allOption.map(chip)}</Group>}
        <Box>
          <Text lh={1.5} c="dimmed" size="sm" mb={4}>Mais usados</Text>
          <Group gap="sm">{popularVisible.map(chip)}</Group>
        </Box>
        {rest.length > 0 && (
          <Box>
            <Text lh={1.5} c="dimmed" size="sm" mb={4}>{restLabel}</Text>
            <Group gap="sm">{rest.map(chip)}</Group>
          </Box>
        )}
      </Stack>
    </Chip.Group>
  );
}

// Chips com caixa de busca no topo — para listas com 7+ opções
function SearchableChips({ options, value, onSelect, searchLabel, placeholder, emptyTitle, emptyText, popular, restLabel }: {
  options: string[]; value: string; onSelect: (v: string) => void;
  searchLabel: string; placeholder: string; emptyTitle: string; emptyText: string;
  popular?: string[]; restLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const q = normalize(query.trim());
  // "Todos" e a opção marcada continuam visíveis para a pessoa poder voltar atrás
  const visible = options.filter(o => !q || o === 'Todos' || o === value || normalize(o).includes(q));
  const matches = options.filter(o => o !== 'Todos' && normalize(o).includes(q));
  return (
    <Stack gap="sm">
      <TextInput
        aria-label={searchLabel}
        placeholder={placeholder}
        leftSection={<MagnifyingGlassIcon size={18} />}
        value={query}
        onChange={e => setQuery(e.currentTarget.value)}
      />
      {q && matches.length === 0 && (
        <EmptyState
          withBorder={false}
          icon={MagnifyingGlassIcon}
          title={emptyTitle}
          description={emptyText}
          action={{ label: 'Limpar Busca', onClick: () => setQuery(''), forward: false }}
        />
      )}
      <ChoiceChips options={visible} value={value} onSelect={onSelect} popular={popular} restLabel={restLabel} />
    </Stack>
  );
}

function FilterPopover({
  icon: SectionIcon,
  label,
  active,
  ariaLabel,
  children,
}: {
  icon: Icon;
  label: string;
  active: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Popover position="bottom-start" shadow="md" width={320} withinPortal>
      <Popover.Target>
        <Button
          variant={active ? 'light' : 'default'}
          color="brand"
          leftSection={<SectionIcon size={16} />}
          rightSection={<CaretDownIcon size={16} />}
          aria-label={ariaLabel}
        >
          {label}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
}
