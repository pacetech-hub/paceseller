import { useState } from "react";
import {
  Accordion, ActionIcon, Badge, Box, Button, Chip, ColorSwatch, Divider, Drawer, Group, Image,
  ScrollArea, Select, SimpleGrid, Slider, Stack, Text, TextInput, ThemeIcon, Tooltip,
} from "@mantine/core";
import {
  FunnelIcon,
  TagIcon,
  StackIcon,
  PaletteIcon,
  CurrencyDollarIcon,
  XIcon,
  SignOutIcon,
  CaretLeftIcon,
  CaretRightIcon,
  StorefrontIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  UsersIcon,
  CheckIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { Client } from "../data/mockData";
import { products, formatCurrency } from "../data/mockData";
import teslaLogo from "../../assets/tesla-footwear-logo.png";
import classes from "./LojistaFiltersSidebar.module.css";

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
  onLogout: () => void;
  profile?: 'lojista' | 'rep' | 'admin';
  selectedClient?: Client | null;
  /** Abaixo do breakpoint lg os filtros abrem num Drawer, acionado pelo botão de filtros do TopBar */
  mobileOpened?: boolean;
  onMobileClose?: () => void;
}

export function LojistaFiltersSidebar({ filters, onChange, onLogout, profile = 'lojista', mobileOpened = false, onMobileClose }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleColor = (c: string) => {
    const next = filters.colors.includes(c)
      ? filters.colors.filter(x => x !== c)
      : [...filters.colors, c];
    onChange({ ...filters, colors: next });
  };

  const reset = () => onChange(defaultFilters);

  const activeCount =
    (filters.line !== 'Todos' ? 1 : 0) +
    (filters.category !== 'Todos' ? 1 : 0) +
    filters.colors.length +
    (filters.priceRange[0] !== priceMin || filters.priceRange[1] !== priceMax ? 1 : 0);

  const renderChips = (options: string[], value: string, onSelect: (v: string) => void) => (
    <Chip.Group multiple={false} value={value} onChange={onSelect}>
      <Group gap={6}>
        {options.map(o => (
          <Chip
            key={o}
            value={o}
            size="xs"
            variant="filled"
            icon={null}
            styles={{
              label: { fontSize: '0.72rem', fontWeight: 400, paddingInline: 10 },
              iconWrapper: { display: 'none' },
            }}
          >
            {o}
          </Chip>
        ))}
      </Group>
    </Chip.Group>
  );

  const renderContent = (isCollapsed: boolean) => (
    <Stack gap={0} h="100%">
      {/* Logo — 55px + divisória de 1px = 56px, alinhado ao cabeçalho */}
      <Group
        h={55}
        px={isCollapsed ? 12 : 'md'}
        gap="sm"
        wrap="nowrap"
        justify={isCollapsed ? 'center' : 'flex-start'}
        flex="none"
      >
        <Image src={teslaLogo} alt="Tesla Footwear" h={isCollapsed ? 24 : 28} w="auto" fit="contain" />
        {!isCollapsed && (
          <Tooltip label="Recolher filtros">
            <ActionIcon
              onClick={() => setCollapsed(true)}
              variant="subtle"
              color="gray"
              size="sm"
              ml="auto"
              visibleFrom="lg"
              aria-label="Recolher filtros"
            >
              <CaretLeftIcon size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Divider color={BORDER_COLOR} />

      {isCollapsed ? (
        <Stack align="center" pt="md" gap="sm" flex={1}>
          <Tooltip label="Expandir filtros" position="right" withArrow>
            <ActionIcon onClick={() => setCollapsed(false)} variant="light" color="neutral" size={32} aria-label="Expandir filtros">
              <FunnelIcon size={16} />
            </ActionIcon>
          </Tooltip>
          {activeCount > 0 && (
            <Badge size="xs" variant="filled" color="neutral" circle styles={{ label: { fontSize: '0.6rem', fontWeight: 700 } }}>
              {activeCount}
            </Badge>
          )}
        </Stack>
      ) : (
        <>
          {/* Tabela de Preço */}
          <Box px="sm" py="sm" flex="none">
            <Group gap={6} mb={6} wrap="nowrap">
              <CurrencyDollarIcon size={12} />
              <Text lh={1.5} c="dimmed" size="0.66rem" fw={600} tt="uppercase" lts="0.06em">
                Tabela de preço
              </Text>
            </Group>
            <Select
              size="xs"
              aria-label="Tabela de preço"
              allowDeselect={false}
              value={filters.priceTable}
              onChange={v => v && onChange({ ...filters, priceTable: v })}
              data={priceTables.map(t => ({ value: t.id, label: `${t.label} — ${t.desc}` }))}
              comboboxProps={{ withinPortal: true }}
              styles={{ input: { fontSize: '0.78rem' } }}
            />
          </Box>
          <Divider color={BORDER_COLOR} />

          <Group px="md" pt="md" pb={8} justify="space-between" wrap="nowrap" flex="none">
            <Group gap={8} wrap="nowrap">
              <FunnelIcon size={14} />
              <Text lh={1.5} size="0.82rem" fw={600}>Filtros</Text>
              {activeCount > 0 && (
                <Badge size="xs" variant="light" color="neutral" circle styles={{ label: { fontSize: '0.62rem', fontWeight: 700 } }}>
                  {activeCount}
                </Badge>
              )}
            </Group>
            {activeCount > 0 && (
              <Button
                onClick={reset}
                variant="subtle"
                color="gray"
                size="compact-sm"
                leftSection={<XIcon size={14} />}
                styles={{ label: { fontSize: '0.72rem', fontWeight: 400 } }}
              >
                Limpar filtros
              </Button>
            )}
          </Group>

          {/* Search */}
          <Box px="sm" pb="sm" flex="none">
            <TextInput
              size="xs"
              value={filters.search}
              onChange={e => onChange({ ...filters, search: e.currentTarget.value })}
              placeholder="Buscar produto..."
              aria-label="Buscar produto"
              leftSection={<MagnifyingGlassIcon size={14} />}
              styles={{ input: { fontSize: '0.78rem' } }}
            />
          </Box>

          <ScrollArea flex={1} px="sm" pb="sm">
            <Accordion
              multiple
              value={Array.from(openSections)}
              onChange={v => setOpenSections(new Set(v))}
              chevron={<CaretDownIcon size={12} />}
              chevronSize={12}
              transitionDuration={200}
              styles={{
                item: { border: 0, background: 'transparent' },
                control: { padding: 0, background: 'transparent', marginBottom: 8 },
                label: { padding: 0 },
                content: { padding: 0 },
                chevron: { color: 'var(--mantine-color-dimmed)' },
              }}
            >
              <Stack gap={20} pb={4}>
                <FilterSection value="Modelo / Linha" icon={TagIcon} label="Modelo / Linha">
                  {renderChips(lines, filters.line, l => onChange({ ...filters, line: l }))}
                </FilterSection>

                <FilterSection value="Categoria" icon={StackIcon} label="Categoria">
                  {renderChips(categories, filters.category, c => onChange({ ...filters, category: c }))}
                </FilterSection>

                <FilterSection value="Cores" icon={PaletteIcon} label="Cores">
                  <SimpleGrid cols={6} spacing={6} verticalSpacing={6} className={classes.swatchGrid}>
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
                          size={20}
                          withShadow={false}
                          bd={`2px solid ${active ? 'var(--mantine-color-neutral-9)' : BORDER_COLOR}`}
                          c={bg === '#fff' ? '#111' : '#fff'}
                          className={classes.swatch}
                          data-active={active || undefined}
                        >
                          {active && <CheckIcon size={9} />}
                        </ColorSwatch>
                      );
                    })}
                  </SimpleGrid>
                  {filters.colors.length > 0 && (
                    <Text lh={1.5} mt={8} c="dimmed" size="0.68rem">
                      {filters.colors.join(', ')}
                    </Text>
                  )}
                </FilterSection>

                <FilterSection value="Faixa de preço" icon={CurrencyDollarIcon} label="Faixa de preço">
                  <Stack gap={8}>
                    <Group justify="space-between">
                      <Text lh={1.5} c="dimmed" size="0.72rem">{formatCurrency(priceMin)}</Text>
                      <Text lh={1.5} c="dimmed" size="0.72rem">{formatCurrency(filters.priceRange[1])}</Text>
                    </Group>
                    <Slider
                      size="sm"
                      min={priceMin}
                      max={priceMax}
                      value={filters.priceRange[1]}
                      onChange={v => onChange({ ...filters, priceRange: [priceMin, v] })}
                      label={v => formatCurrency(v)}
                      mb={4}
                    />
                  </Stack>
                </FilterSection>
              </Stack>
            </Accordion>
          </ScrollArea>
        </>
      )}

      {/* Bottom */}
      <Divider color={BORDER_COLOR} />
      <Box p={8} flex="none">
        {!isCollapsed ? (
          <Group gap={8} px="sm" py={8} wrap="nowrap">
            <ThemeIcon
              size={28}
              radius="xl"
              variant="light"
              color={profile === 'rep' ? 'yellow' : 'teal'}
            >
              {profile === 'rep' ? <UsersIcon size={14} /> : <StorefrontIcon size={14} />}
            </ThemeIcon>
            <Box flex={1} miw={0}>
              <Text lh={1.5} size="0.78rem" fw={600} truncate>
                {profile === 'rep' ? 'Representante' : 'Lojista'}
              </Text>
              <Text lh={1.5} size="0.7rem" c="dimmed" truncate>
                {profile === 'rep' ? 'marcos@tesla.com.br' : 'loja@tesla.com.br'}
              </Text>
            </Box>
            <Tooltip label="Sair da conta">
              <ActionIcon onClick={onLogout} variant="subtle" color="red" size="sm" aria-label="Sair da conta">
                <SignOutIcon size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : (
          <Group justify="center">
            <Tooltip label="Expandir filtros" position="right" withArrow>
              <ActionIcon onClick={() => setCollapsed(false)} variant="subtle" color="gray" size={36} aria-label="Expandir filtros">
                <CaretRightIcon size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Box>
    </Stack>
  );

  return (
    <>
      <Drawer
        opened={mobileOpened}
        onClose={() => onMobileClose?.()}
        hiddenFrom="lg"
        size={288}
        padding={0}
        withCloseButton={false}
        styles={{ body: { height: '100%' } }}
      >
        {renderContent(false)}
        {/* Depois do conteúdo no DOM, para ficar por cima dele sem z-index */}
        <ActionIcon
          onClick={() => onMobileClose?.()}
          variant="subtle"
          color="gray"
          size="sm"
          pos="absolute"
          top={12}
          right={12}
          aria-label="Fechar filtros"
        >
          <XIcon size={16} />
        </ActionIcon>
      </Drawer>

      <Box
        component="aside"
        visibleFrom="lg"
        h="100%"
        w={collapsed ? 52 : 280}
        bg="var(--mantine-color-body)"
        flex="none"
        className={classes.aside}
      >
        {renderContent(collapsed)}
      </Box>
    </>
  );
}

function FilterSection({
  value,
  icon: SectionIcon,
  label,
  children,
}: {
  value: string;
  icon: Icon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value}>
      <Accordion.Control>
        <Group gap={6} wrap="nowrap">
          <SectionIcon size={12} color="var(--mantine-color-dimmed)" />
          <Text lh={1.5} c="dimmed" size="0.68rem" fw={600} tt="uppercase" lts="0.06em">{label}</Text>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>{children}</Accordion.Panel>
    </Accordion.Item>
  );
}
