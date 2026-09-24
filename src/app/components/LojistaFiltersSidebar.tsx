import { useState } from "react";
import {
  Accordion, ActionIcon, Badge, Box, Button, Chip, ColorSwatch, Divider, Drawer, Group, Image,
  Radio, ScrollArea, SimpleGrid, Slider, Stack, Text, TextInput, ThemeIcon, Tooltip,
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
import interactive from "./interactive.module.css";

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
              ml="auto"
              visibleFrom="lg"
              aria-label="Recolher filtros"
            >
              <CaretLeftIcon size={18} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Divider color={BORDER_COLOR} />

      {isCollapsed ? (
        <Stack align="center" pt="md" gap="sm" flex={1}>
          <Tooltip label="Expandir filtros" position="right" withArrow>
            <ActionIcon onClick={() => setCollapsed(false)} variant="light" color="neutral" aria-label="Expandir filtros">
              <FunnelIcon size={18} />
            </ActionIcon>
          </Tooltip>
          {activeCount > 0 && (
            <Badge variant="filled" color="neutral" circle aria-label={`${activeCount} filtros ativos`}>
              {activeCount}
            </Badge>
          )}
        </Stack>
      ) : (
        <>
          {/* Tabela de Preço — 4 opções fixas: lista de rádios com descrição em vez de lista suspensa */}
          <Box px="sm" py="sm" flex="none">
            <Radio.Group
              name="tabela-preco"
              value={filters.priceTable}
              onChange={v => onChange({ ...filters, priceTable: v })}
              label={
                <Group gap={6} wrap="nowrap" component="span">
                  <CurrencyDollarIcon size={16} />
                  <span>Tabela de preço</span>
                </Group>
              }
            >
              <Stack gap={4} mt={6}>
                {priceTables.map(t => (
                  <Radio.Card key={t.id} value={t.id} px="sm" py={8} className={interactive.choiceCard}>
                    {/* indicador alinhado à primeira linha do texto */}
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
          </Box>
          <Divider color={BORDER_COLOR} />

          {/* Em 280px o "Limpar filtros" pode descer para a linha de baixo */}
          <Group px="md" pt="md" pb={8} justify="space-between" gap="sm" flex="none">
            <Group gap={8} wrap="nowrap">
              <FunnelIcon size={18} />
              <Text lh={1.5} fw={600}>Filtros</Text>
              {activeCount > 0 && (
                <Badge variant="light" color="neutral" circle aria-label={`${activeCount} filtros ativos`}>
                  {activeCount}
                </Badge>
              )}
            </Group>
            {activeCount > 0 && (
              <Button
                onClick={reset}
                variant="subtle"
                color="gray"
                leftSection={<XIcon size={16} />}
              >
                Limpar Filtros
              </Button>
            )}
          </Group>

          {/* Search */}
          <Box px="sm" pb="sm" flex="none">
            <TextInput
              value={filters.search}
              onChange={e => onChange({ ...filters, search: e.currentTarget.value })}
              placeholder="Buscar por nome, referência ou linha"
              aria-label="Buscar produto"
              leftSection={<MagnifyingGlassIcon size={18} />}
            />
          </Box>

          <ScrollArea flex={1} px="sm" pb="sm">
            <Accordion
              multiple
              value={Array.from(openSections)}
              onChange={v => setOpenSections(new Set(v))}
              chevron={<CaretDownIcon size={16} />}
              chevronSize={16}
              transitionDuration={200}
              styles={{
                item: { border: 0, background: 'transparent' },
                // cabeçalho de seção com ~40px de altura clicável
                control: { padding: '8px 0', minHeight: 40, background: 'transparent' },
                label: { padding: 0 },
                content: { padding: 0 },
                chevron: { color: 'var(--mantine-color-dimmed)' },
              }}
            >
              <Stack gap={8} pb={4}>
                <FilterSection value="Modelo / Linha" icon={TagIcon} label="Modelo / Linha">
                  {renderChips(lines, filters.line, l => onChange({ ...filters, line: l }))}
                </FilterSection>

                <FilterSection value="Categoria" icon={StackIcon} label="Categoria">
                  {renderChips(categories, filters.category, c => onChange({ ...filters, category: c }))}
                </FilterSection>

                <FilterSection value="Cores" icon={PaletteIcon} label="Cores">
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
                          c={bg === '#fff' ? '#111' : '#fff'}
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
                </FilterSection>

                <FilterSection value="Faixa de preço" icon={CurrencyDollarIcon} label="Faixa de preço">
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
              size={36}
              variant="light"
              color="neutral"
            >
              {profile === 'rep' ? <UsersIcon size={18} /> : <StorefrontIcon size={18} />}
            </ThemeIcon>
            <Box flex={1} miw={0}>
              <Text lh={1.5} fw={600} truncate>
                {profile === 'rep' ? 'Representante' : 'Lojista'}
              </Text>
              <Text lh={1.5} size="sm" c="dimmed" truncate>
                {profile === 'rep' ? 'marcos@tesla.com.br' : 'loja@tesla.com.br'}
              </Text>
            </Box>
            <Button
              onClick={onLogout}
              variant="subtle"
              color="red"
              flex="none"
              px="sm"
              leftSection={<SignOutIcon size={18} />}
              aria-label="Sair da conta"
            >
              Sair
            </Button>
          </Group>
        ) : (
          <Group justify="center">
            <Tooltip label="Expandir filtros" position="right" withArrow>
              <ActionIcon onClick={() => setCollapsed(false)} variant="subtle" color="gray" aria-label="Expandir filtros">
                <CaretRightIcon size={18} />
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
          pos="absolute"
          top={6}
          right={8}
          aria-label="Fechar filtros"
        >
          <XIcon size={18} />
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
          <SectionIcon size={18} color="var(--mantine-color-dimmed)" />
          <Text lh={1.5} fw={600}>{label}</Text>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>{children}</Accordion.Panel>
    </Accordion.Item>
  );
}
