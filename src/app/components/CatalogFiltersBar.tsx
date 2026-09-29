import { useState } from "react";
import {
  Badge, Box, Button, Chip, ColorSwatch, Group, Paper, Popover, Radio, SimpleGrid, Slider, Stack, Text, TextInput,
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
  type Icon,
} from "@phosphor-icons/react";
import { products, formatCurrency } from "../data/mockData";
import classes from "./CatalogFiltersBar.module.css";
import interactive from "./interactive.module.css";
import { EmptyState } from "./ui/EmptyState";

export type CatalogFilters = {
  search: string;
  line: string;
  category: string;
  colors: string[];
  priceRange: [number, number];
  priceTable: string;
};

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

const colorSwatch: Record<string, string> = {
  Preto: '#111', Branco: '#fff', Azul: '#2563eb', Navy: '#1e3a8a',
  Vermelho: '#dc2626', Marrom: '#7c4a2a', Denim: '#3b6ea5',
  Cinza: '#6b7280', Verde: '#16a34a', Amarelo: '#facc15',
  Rosa: '#ec4899', Bege: '#d6c2a3',
};

const priceMin = Math.floor(Math.min(...products.map(p => p.price)));
const priceMax = Math.ceil(Math.max(...products.map(p => p.price)));

export const defaultFilters: CatalogFilters = {
  search: '',
  line: 'Todos',
  category: 'Todos',
  colors: [],
  priceRange: [priceMin, priceMax],
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

  const currentTable = priceTables.find(t => t.id === filters.priceTable);
  const priceActive = filters.priceRange[0] !== priceMin || filters.priceRange[1] !== priceMax;
  const activeCount =
    (filters.line !== 'Todos' ? 1 : 0) +
    (filters.category !== 'Todos' ? 1 : 0) +
    filters.colors.length +
    (priceActive ? 1 : 0);

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

        <Group gap={8} wrap="nowrap" ml={{ sm: 'xs' }}>
          <FunnelIcon size={18} />
          <Text lh={1.5} fw={600}>Filtros</Text>
          {activeCount > 0 && (
            <Badge variant="light" color="neutral" circle aria-label={`${activeCount} filtros ativos`}>
              {activeCount}
            </Badge>
          )}
        </Group>

        <FilterPopover
          icon={TagIcon}
          label={filters.line !== 'Todos' ? `Linha: ${filters.line}` : 'Modelo / Linha'}
          active={filters.line !== 'Todos'}
        >
          {/* 11 linhas: caixa de busca no topo filtra enquanto digita */}
          <SearchableChips
            options={lines}
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
          <ChoiceChips options={categories} value={filters.category} onSelect={c => onChange({ ...filters, category: c })} />
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
          <SimpleGrid cols={6} spacing={6} verticalSpacing={8} className={classes.swatchGrid}>
            {visibleColors.map(c => {
              const active = filters.colors.includes(c);
              const bg = colorSwatch[c] || '#94a3b8';
              return (
                <ColorSwatch
                  key={c}
                  component="button"
                  type="button"
                  onClick={() => toggleColor(c)}
                  title={c}
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
              );
            })}
          </SimpleGrid>
          {filters.colors.length > 0 && (
            <Text lh={1.5} mt={8} c="dimmed" size="sm">
              {filters.colors.join(', ')}
            </Text>
          )}
        </FilterPopover>

        <FilterPopover
          icon={CurrencyDollarIcon}
          label={priceActive ? `Até ${formatCurrency(filters.priceRange[1])}` : 'Faixa de preço'}
          active={priceActive}
        >
          <Stack gap={8}>
            <Group justify="space-between">
              <Text lh={1.5} c="dimmed" size="sm">{formatCurrency(priceMin)}</Text>
              <Text lh={1.5} c="dimmed" size="sm">{formatCurrency(filters.priceRange[1])}</Text>
            </Group>
            <Slider
              min={priceMin}
              max={priceMax}
              value={filters.priceRange[1]}
              onChange={v => onChange({ ...filters, priceRange: [priceMin, v] })}
              label={v => formatCurrency(v)}
              mb={4}
            />
          </Stack>
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

// busca sem diferenciar maiúsculas nem acentos
const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Chips de escolha única (poucas opções)
function ChoiceChips({ options, value, onSelect }: { options: string[]; value: string; onSelect: (v: string) => void }) {
  return (
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
  );
}

// Chips com caixa de busca no topo — para listas com 7+ opções
function SearchableChips({ options, value, onSelect, searchLabel, placeholder, emptyTitle, emptyText }: {
  options: string[]; value: string; onSelect: (v: string) => void;
  searchLabel: string; placeholder: string; emptyTitle: string; emptyText: string;
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
      <ChoiceChips options={visible} value={value} onSelect={onSelect} />
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
