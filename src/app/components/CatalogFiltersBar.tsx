import {
  Badge, Box, Button, Chip, ColorSwatch, Group, Paper, Popover, Select, SimpleGrid, Slider, Stack, Text,
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
  type Icon,
} from "@phosphor-icons/react";
import { products, formatCurrency } from "../data/mockData";
import classes from "./CatalogFiltersBar.module.css";

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

const lines = ['Todos', 'Premium', 'Urban', 'Sport', 'Flow', 'Flow XL', 'Coil', 'Hertz', 'Hertz Art'];
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

  const priceActive = filters.priceRange[0] !== priceMin || filters.priceRange[1] !== priceMax;
  const activeCount =
    (filters.line !== 'Todos' ? 1 : 0) +
    (filters.category !== 'Todos' ? 1 : 0) +
    filters.colors.length +
    (priceActive ? 1 : 0);

  const renderChips = (options: string[], value: string, onSelect: (v: string) => void) => (
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

  return (
    <Paper withBorder p="sm">
      <Group gap="sm" wrap="wrap" align="center">
        {/* Tabela de Preço — 4 opções fixas, cada uma com descrição */}
        <Select
          w={{ base: '100%', sm: 260 }}
          aria-label="Tabela de preço"
          leftSection={<CurrencyDollarIcon size={18} />}
          allowDeselect={false}
          value={filters.priceTable}
          onChange={v => v && onChange({ ...filters, priceTable: v })}
          data={priceTables.map(t => ({ value: t.id, label: t.label }))}
          renderOption={({ option }) => {
            const t = priceTables.find(x => x.id === option.value);
            return (
              <Box>
                <Text lh={1.5} fw={600} size="sm">{option.label}</Text>
                <Text lh={1.5} c="dimmed" size="xs">{t?.desc}</Text>
              </Box>
            );
          }}
        />

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
          {renderChips(lines, filters.line, l => onChange({ ...filters, line: l }))}
        </FilterPopover>

        <FilterPopover
          icon={StackIcon}
          label={filters.category !== 'Todos' ? `Categoria: ${filters.category}` : 'Categoria'}
          active={filters.category !== 'Todos'}
        >
          {renderChips(categories, filters.category, c => onChange({ ...filters, category: c }))}
        </FilterPopover>

        <FilterPopover
          icon={PaletteIcon}
          label={filters.colors.length > 0 ? `Cores (${filters.colors.length})` : 'Cores'}
          active={filters.colors.length > 0}
        >
          <SimpleGrid cols={6} spacing={6} verticalSpacing={8} className={classes.swatchGrid}>
            {allColors.map(c => {
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

function FilterPopover({
  icon: SectionIcon,
  label,
  active,
  children,
}: {
  icon: Icon;
  label: string;
  active: boolean;
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
        >
          {label}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
}
