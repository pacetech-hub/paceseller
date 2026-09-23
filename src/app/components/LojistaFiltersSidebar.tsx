import { useState } from "react";
import {
  Box, Stack, Group, Text, UnstyledButton, NativeSelect, TextInput, Slider, SimpleGrid, Image, Badge, ThemeIcon,
} from "@mantine/core";
import {
  Filter, Tag, Layers, Palette, DollarSign,
  Menu, X, LogOut, ChevronLeft, ChevronRight, Store, Search,
  ChevronUp, ChevronDown, Users,
} from "lucide-react";
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


interface Props {
  filters: CatalogFilters;
  onChange: (f: CatalogFilters) => void;
  onLogout: () => void;
  profile?: 'lojista' | 'rep' | 'admin';
  selectedClient?: Client | null;
}

export function LojistaFiltersSidebar({ filters, onChange, onLogout, profile = 'lojista', selectedClient }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleColor = (c: string) => {
    const next = filters.colors.includes(c)
      ? filters.colors.filter(x => x !== c)
      : [...filters.colors, c];
    onChange({ ...filters, colors: next });
  };

  const toggleSection = (label: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const reset = () => onChange(defaultFilters);

  const activeCount =
    (filters.line !== 'Todos' ? 1 : 0) +
    (filters.category !== 'Todos' ? 1 : 0) +
    filters.colors.length +
    (filters.priceRange[0] !== priceMin || filters.priceRange[1] !== priceMax ? 1 : 0);

  const Content = () => (
    <Stack gap={0} h="100%">
      {/* Logo */}
      <Group
        gap={collapsed ? 0 : 'sm'}
        justify={collapsed ? 'center' : undefined}
        wrap="nowrap"
        px="md"
        h={56}
        style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}
      >
        <Box
          w={collapsed ? 28 : undefined}
          h={collapsed ? 28 : 32}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Image src={teslaLogo} alt="Tesla Footwear" h={collapsed ? 24 : 28} w="auto" fit="contain" />
        </Box>
        {!collapsed && (
          <UnstyledButton onClick={() => setCollapsed(true)} className={classes.iconBtn} ml="auto">
            <ChevronLeft size={16} />
          </UnstyledButton>
        )}
      </Group>

      {collapsed ? (
        <Stack flex={1} align="center" pt="md" gap="sm">
          <UnstyledButton
            onClick={() => setCollapsed(false)}
            p={8}
            bg="gray.2"
            c="gray.9"
            style={{ borderRadius: 'var(--mantine-radius-md)', display: 'inline-flex' }}
            title="Filtros"
          >
            <Filter size={16} />
          </UnstyledButton>
          {activeCount > 0 && (
            <Badge radius="xl" size="xs" px={6} fz="0.6rem" fw={700}>
              {activeCount}
            </Badge>
          )}
        </Stack>
      ) : (
        <>

          {/* Tabela de Preço */}
          <Box px="sm" pt="sm" pb="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Group gap={6} mb={6} wrap="nowrap">
              <DollarSign size={12} color="var(--mantine-color-gray-9)" />
              <Text c="dimmed" fz="0.66rem" fw={600} lts="0.06em" tt="uppercase">
                Tabela de preço
              </Text>
            </Group>
            <NativeSelect
              value={filters.priceTable}
              onChange={e => onChange({ ...filters, priceTable: e.target.value })}
              size="sm"
              styles={{ input: { fontSize: '0.78rem', fontWeight: 500, background: 'var(--mantine-color-gray-0)', cursor: 'pointer' } }}
              data={priceTables.map(t => ({ value: t.id, label: `${t.label} — ${t.desc}` }))}
            />
          </Box>


          <Group justify="space-between" px="md" pt="md" pb={8} wrap="nowrap">
            <Group gap={8} wrap="nowrap">
              <Filter size={14} color="var(--mantine-color-gray-9)" />
              <Text fz="0.82rem" fw={600}>Filtros</Text>
              {activeCount > 0 && (
                <Badge variant="light" radius="xl" size="xs" px={6} fz="0.62rem" fw={700} c="gray.9" bg="gray.2">
                  {activeCount}
                </Badge>
              )}
            </Group>
            {activeCount > 0 && (
              <UnstyledButton onClick={reset} className={classes.clearBtn}>
                <X size={12} /> Limpar
              </UnstyledButton>
            )}
          </Group>

          {/* Search */}
          <Box px="sm" pb="sm">
            <TextInput
              type="text"
              value={filters.search}
              onChange={e => onChange({ ...filters, search: e.target.value })}
              placeholder="Buscar produto..."
              leftSection={<Search size={14} />}
              styles={{ input: { fontSize: '0.78rem', background: 'var(--mantine-color-gray-0)' } }}
            />
          </Box>

          <Stack flex={1} gap={20} px="sm" pb="sm" style={{ overflowY: 'auto' }}>
            {/* Modelo / Linha */}
            <FilterSection
              icon={Tag}
              label="Modelo / Linha"
              isOpen={openSections.has('Modelo / Linha')}
              onToggle={() => toggleSection('Modelo / Linha')}
            >
              <Group gap={6}>
                {lines.map(l => (
                  <UnstyledButton
                    key={l}
                    onClick={() => onChange({ ...filters, line: l })}
                    className={filters.line === l ? `${classes.chip} ${classes.chipActive}` : classes.chip}
                  >
                    {l}
                  </UnstyledButton>
                ))}
              </Group>
            </FilterSection>

            {/* Categoria */}
            <FilterSection
              icon={Layers}
              label="Categoria"
              isOpen={openSections.has('Categoria')}
              onToggle={() => toggleSection('Categoria')}
            >
              <Group gap={6}>
                {categories.map(c => (
                  <UnstyledButton
                    key={c}
                    onClick={() => onChange({ ...filters, category: c })}
                    className={filters.category === c ? `${classes.chip} ${classes.chipActive}` : classes.chip}
                  >
                    {c}
                  </UnstyledButton>
                ))}
              </Group>
            </FilterSection>

            {/* Cores */}
            <FilterSection
              icon={Palette}
              label="Cores"
              isOpen={openSections.has('Cores')}
              onToggle={() => toggleSection('Cores')}
            >
              <SimpleGrid cols={6} spacing={6} verticalSpacing={6}>
                {allColors.map(c => {
                  const active = filters.colors.includes(c);
                  const bg = colorSwatch[c] || '#94a3b8';
                  return (
                    <UnstyledButton
                      key={c}
                      onClick={() => toggleColor(c)}
                      title={c}
                      className={active ? `${classes.swatch} ${classes.swatchActive}` : classes.swatch}
                      style={{ background: bg }}
                    >
                      {active && (
                        <Box
                          component="span"
                          pos="absolute"
                          inset={0}
                          fz={7}
                          fw={700}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: bg === '#fff' ? '#111' : '#fff' }}
                        >✓</Box>
                      )}
                    </UnstyledButton>
                  );
                })}
              </SimpleGrid>
              {filters.colors.length > 0 && (
                <Text mt={8} c="dimmed" fz="0.68rem">
                  {filters.colors.join(', ')}
                </Text>
              )}
            </FilterSection>

            {/* Preço */}
            <FilterSection
              icon={DollarSign}
              label="Faixa de preço"
              isOpen={openSections.has('Faixa de preço')}
              onToggle={() => toggleSection('Faixa de preço')}
            >
              <Stack gap={8}>
                <Group justify="space-between" c="dimmed" fz="0.72rem" wrap="nowrap">
                  <span>{formatCurrency(priceMin)}</span>
                  <span>{formatCurrency(filters.priceRange[1])}</span>
                </Group>
                <Slider
                  min={priceMin}
                  max={priceMax}
                  value={filters.priceRange[1]}
                  onChange={v => onChange({ ...filters, priceRange: [priceMin, Number(v)] })}
                  label={null}
                  size="sm"
                  w="100%"
                />
              </Stack>
            </FilterSection>
          </Stack>
        </>
      )}

      {/* Bottom */}
      <Box p={8} mt="auto" style={{ borderTop: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}>
        {!collapsed ? (
          <Group gap={8} px="sm" py={8} wrap="nowrap">
            <ThemeIcon
              size={28}
              radius="xl"
              variant="light"
              color={profile === 'rep' ? 'yellow' : 'teal'}
              style={{ flexShrink: 0 }}
            >
              {profile === 'rep'
                ? <Users size={14} color="var(--mantine-color-yellow-6)" />
                : <Store size={14} color="var(--mantine-color-teal-6)" />}
            </ThemeIcon>
            <Box flex={1} miw={0}>
              <Text truncate fz="0.78rem" fw={500}>
                {profile === 'rep' ? 'Representante' : 'Lojista'}
              </Text>
              <Text c="dimmed" truncate fz="0.7rem">
                {profile === 'rep' ? 'marcos@tesla.com.br' : 'loja@tesla.com.br'}
              </Text>
            </Box>
            <UnstyledButton onClick={onLogout} className={classes.logoutBtn} title="Sair">
              <LogOut size={14} />
            </UnstyledButton>
          </Group>
        ) : (
          <UnstyledButton
            onClick={() => setCollapsed(false)}
            className={classes.expandBtn}
          >
            <ChevronRight size={16} />
          </UnstyledButton>
        )}
      </Box>
    </Stack>
  );

  return (
    <>
      <UnstyledButton
        onClick={() => setMobileOpen(true)}
        className={`${classes.mobileMenuBtn} ${classes.mobileOnly}`}
      >
        <Menu size={16} />
      </UnstyledButton>

      {mobileOpen && (
        <Box className={classes.mobileOnly} pos="fixed" inset={0} style={{ zIndex: 50, display: 'flex' }}>
          <Box pos="absolute" inset={0} style={{ background: 'rgba(0,0,0,.6)' }} onClick={() => setMobileOpen(false)} />
          <Box pos="relative" w={288} h="100%" bg="white" style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}>
            <UnstyledButton onClick={() => setMobileOpen(false)} className={classes.iconBtn} pos="absolute" top={12} right={12}>
              <X size={16} />
            </UnstyledButton>
            <Content />
          </Box>
        </Box>
      )}

      <aside className={collapsed ? `${classes.aside} ${classes.asideCollapsed}` : classes.aside}>
        <Content />
      </aside>
    </>
  );
}

function FilterSection({
  icon: Icon,
  label,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string; size?: number | string; color?: string }>;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <UnstyledButton
        onClick={onToggle}
        className={classes.sectionToggle}
      >
        <Group gap={6} wrap="nowrap">
          <Icon size={12} color="var(--mantine-color-dimmed)" />
          <Text c="dimmed" fz="0.68rem" fw={600} lts="0.06em" tt="uppercase">{label}</Text>
        </Group>
        {isOpen ? (
          <ChevronUp size={12} className={classes.sectionChevron} />
        ) : (
          <ChevronDown size={12} className={classes.sectionChevron} />
        )}
      </UnstyledButton>
      {isOpen && <div className={classes.sectionBody}>{children}</div>}
    </div>
  );
}
