import { useState } from "react";
import {
  Badge, Box, Button, Chip, ColorSwatch, Group, Paper, Popover, Radio, SimpleGrid, Stack, Text, TextInput, Tooltip,
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

const lines = ['Todos', 'Premium', 'Urban', 'Sport', 'Flow', 'Flow XL', 'Coil', 'Hertz', 'Hertz Art', 'Fusion', 'TG II'];
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

interface Props {
  filters: CatalogFilters;
  onChange: (f: CatalogFilters) => void;
}

// Barra de filtros no topo do catálogo: tabela de preço + filtros em popovers.
export function CatalogFiltersBar({ filters, onChange }: Props) {
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

  // Limpa só os filtros; busca e tabela de preço continuam como estão.
  const reset = () => onChange({
    ...defaultFilters,
    search: filters.search,
    priceTable: filters.priceTable,
  });

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
              bd={`2px solid ${active ? 'var(--mantine-color-neutral-9)' : BORDER_COLOR}`}
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

  const currentTable = priceTables.find(t => t.id === filters.priceTable);
  const activeCount = countActiveFilters(filters);
  const toggleRadar = (v: RadarFilter) => onChange({
    ...filters,
    radar: filters.radar.includes(v) ? filters.radar.filter(x => x !== v) : [...filters.radar, v],
  });

  return (
    <Paper withBorder p="sm">
      <Group gap="sm" wrap="wrap" align="center">
        {/* Tabela de Preço — 4 opções fixas com descrição: cartões de opção (radio) em vez de lista suspensa */}
        <FilterPopover
          icon={CurrencyDollarIcon}
          label={currentTable?.label ?? 'Tabela de preço'}
          active={false}
          ariaLabel={`Tabela de preço: ${currentTable?.label ?? ''}`}
        >
          <Radio.Group
            value={filters.priceTable}
            onChange={v => onChange({ ...filters, priceTable: v })}
            name="catalog-price-table"
            label="Tabela de preço"
          >
            <Stack gap="sm" mt={4}>
              {priceTables.map(t => (
                <Radio.Card key={t.id} value={t.id} p="sm" className={interactive.choiceCard}>
                  <Group align="flex-start" gap="sm" wrap="nowrap">
                    <Radio.Indicator color="neutral" mt={2} />
                    <Box flex={1} miw={0}>
                      <Text lh={1.5} fw={600}>{t.label}</Text>
                      <Text lh={1.5} c="dimmed" size="sm">{t.desc}</Text>
                    </Box>
                  </Group>
                </Radio.Card>
              ))}
            </Stack>
          </Radio.Group>
        </FilterPopover>

        <Group gap="xs" wrap="nowrap" ml={{ sm: 'xs' }}>
          <FunnelIcon size={18} />
          <Text lh={1.5} fw={600}>Filtros</Text>
          {activeCount > 0 && (
            <Badge variant="light" color="neutral" circle aria-label={`${activeCount} filtros ativos`}>
              {activeCount}
            </Badge>
          )}
        </Group>

        {/* Sinais do Radar: os mesmos sinais do Radar e da página do produto */}
        <FilterPopover
          icon={CrosshairIcon}
          label={filters.radar.length > 0 ? `Sinais do Radar (${filters.radar.length})` : 'Sinais do Radar'}
          active={filters.radar.length > 0}
        >
          <Text lh={1.5} fw={600} mb="xs">Sinais do Radar</Text>
          <Group gap="sm">
            {radarFilterOptions.map(f => (
              <Chip key={f.value} checked={filters.radar.includes(f.value)} onChange={() => toggleRadar(f.value)} variant="filled">
                {f.label}
              </Chip>
            ))}
          </Group>
        </FilterPopover>

        <FilterPopover
          icon={TagIcon}
          label={filters.line !== 'Todos' ? `Linha: ${filters.line}` : 'Modelo / Linha'}
          active={filters.line !== 'Todos'}
        >
          {/* 11 linhas: caixa de busca no topo filtra enquanto digita */}
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
        </FilterPopover>

        <FilterPopover
          icon={StackIcon}
          label={filters.category !== 'Todos' ? `Categoria: ${filters.category}` : 'Categoria'}
          active={filters.category !== 'Todos'}
        >
          <ChoiceChips
            options={categories}
            popular={popularCategories}
            restLabel="Outras categorias"
            value={filters.category}
            onSelect={c => onChange({ ...filters, category: c })}
          />
        </FilterPopover>

        <FilterPopover
          icon={PaletteIcon}
          label={filters.colors.length > 0 ? `Cores (${filters.colors.length})` : 'Cores'}
          active={filters.colors.length > 0}
        >
          {/* Muitas cores: caixa de busca no topo filtra as amostras pelo nome */}
          <TextInput
            aria-label="Buscar cor"
            placeholder="Buscar cor (ex.: Preto)"
            leftSection={<MagnifyingGlassIcon size={18} />}
            value={colorQuery}
            onChange={e => setColorQuery(e.currentTarget.value)}
            mb="sm"
          />
          {visibleColors.length === 0 && (
            <EmptyState
              withBorder={false}
              icon={MagnifyingGlassIcon}
              title="Nenhuma cor encontrada"
              description="Nenhuma cor com esse nome. Limpe a busca para ver todas."
              action={{ label: 'Limpar Busca', onClick: () => setColorQuery(''), forward: false }}
            />
          )}
          {/* Cores mais vendidas primeiro; o resto em seguida, em ordem alfabética */}
          <Stack gap="sm">
            {visiblePopularColors.length > 0 && (
              <Box>
                <Text lh={1.5} c="dimmed" size="sm" mb={4}>Mais usados</Text>
                {renderSwatches(visiblePopularColors)}
              </Box>
            )}
            {visibleOtherColors.length > 0 && (
              <Box>
                {visiblePopularColors.length > 0 && (
                  <Text lh={1.5} c="dimmed" size="sm" mb={4}>Outras cores</Text>
                )}
                {renderSwatches(visibleOtherColors)}
              </Box>
            )}
          </Stack>
          {filters.colors.length > 0 && (
            <Text lh={1.5} mt="xs" c="dimmed" size="sm">
              {filters.colors.join(', ')}
            </Text>
          )}
        </FilterPopover>

        <FilterPopover
          icon={StackIcon}
          label={filters.collection !== 'Todas' ? `Coleção: ${filters.collection}` : 'Coleção'}
          active={filters.collection !== 'Todas'}
        >
          <Text lh={1.5} fw={600} mb="xs">Coleção</Text>
          <ChoiceChips options={['Todas', ...allCollections]} value={filters.collection} onSelect={v => onChange({ ...filters, collection: v })} />
        </FilterPopover>

        <FilterPopover
          icon={CurrencyDollarIcon}
          label={priceBandOf(filters.priceBand)?.label ?? 'Faixa de preço'}
          active={!!filters.priceBand}
        >
          <Text lh={1.5} fw={600}>Faixa de preço</Text>
          <Text lh={1.5} c="dimmed" size="sm" mb="xs">Sobre o Seu custo por par</Text>
          <ChoiceChips
            options={['Todas', ...PRICE_BANDS.map(b => b.label)]}
            value={priceBandOf(filters.priceBand)?.label ?? 'Todas'}
            onSelect={v => onChange({ ...filters, priceBand: PRICE_BANDS.find(b => b.label === v)?.value ?? '' })}
          />
        </FilterPopover>

        <FilterPopover
          icon={RulerIcon}
          label={filters.size ? `Numeração: ${filters.size}` : 'Numeração'}
          active={!!filters.size}
        >
          <Text lh={1.5} fw={600}>Numeração</Text>
          <Text lh={1.5} c="dimmed" size="sm" mb="xs">Só produtos com pares disponíveis nesta numeração</Text>
          <ChoiceChips options={['Todas', ...allSizes]} value={filters.size || 'Todas'} onSelect={v => onChange({ ...filters, size: v === 'Todas' ? '' : v })} />
        </FilterPopover>

        {activeCount > 0 && (
          <Button
            onClick={reset}
            variant="subtle"
            color="neutral"
            leftSection={<XIcon size={16} />}
          >
            Limpar Filtros
          </Button>
        )}
      </Group>
    </Paper>
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
          color="neutral"
          leftSection={<SectionIcon size={16} />}
          rightSection={<CaretDownIcon size={14} />}
          aria-label={ariaLabel}
        >
          {label}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
}
