import { useState } from "react";
import {
  Container, SimpleGrid, Paper, Text, Group, TextInput, Popover, Button,
  Stack, Chip, Table, Avatar, Badge, ThemeIcon, Box, Card, Radio,
} from "@mantine/core";
import interactive from "./interactive.module.css";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  UsersIcon,
  FunnelIcon,
  ArrowsDownUpIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { clients, Client } from "../data/mockData";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail';

interface ClientsPageProps {
  onNavigate: (view: View) => void;
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
}

const statusColor: Record<string, string> = {
  'ativo': 'teal',
  'inativo': 'red',
};

const formatOrderDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const REGIONS = ['Centro-Oeste', 'Norte', 'Nordeste', 'Sudeste', 'Sul'];

type StatusFilterValue = 'ativo' | 'inativo' | 'inadimplente';
const STATUS_OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: 'ativo', label: 'ativo' },
  { value: 'inativo', label: 'inativo' },
  { value: 'inadimplente', label: 'inadimplente' },
];

type SortOrder = 'az' | 'za' | 'ultimo-pedido' | 'ultimo-pedido-desc';
const DEFAULT_SORT: SortOrder = 'ultimo-pedido';
const SORT_OPTIONS: Array<{ value: SortOrder; label: string }> = [
  { value: 'az', label: 'A a Z' },
  { value: 'za', label: 'Z a A' },
  { value: 'ultimo-pedido', label: 'Pedido mais antigo para mais recente' },
  { value: 'ultimo-pedido-desc', label: 'Pedido mais recente para mais antigo' },
];

export function ClientsPage({ onNavigate, selectedClient, setSelectedClient }: ClientsPageProps) {
  const [search, setSearch] = useState('');
  const [regionFilters, setRegionFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusFilterValue[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT);

  const toggleRegion = (region: string) => {
    setRegionFilters(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  };

  const toggleStatus = (status: StatusFilterValue) => {
    setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const clearFilters = () => {
    setRegionFilters([]);
    setStatusFilters([]);
  };

  const activeFilterCount = regionFilters.length + statusFilters.length;
  const sortActive = sortOrder !== DEFAULT_SORT;

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.rep.toLowerCase().includes(search.toLowerCase());
    const matchRegion = regionFilters.length === 0 || regionFilters.includes(c.region);
    const matchStatus = statusFilters.length === 0 || statusFilters.some(s => s === 'inadimplente' ? c.inadimplente : c.status === s);
    return matchSearch && matchRegion && matchStatus;
  });

  const sortedClients = [...filtered].sort((a, b) => {
    if (sortOrder === 'az') return a.name.localeCompare(b.name, 'pt-BR');
    if (sortOrder === 'za') return b.name.localeCompare(a.name, 'pt-BR');
    if (sortOrder === 'ultimo-pedido') return a.lastOrder.localeCompare(b.lastOrder);
    if (sortOrder === 'ultimo-pedido-desc') return b.lastOrder.localeCompare(a.lastOrder);
    return 0;
  });

  const activeCount = filtered.filter(c => c.status === 'ativo').length;
  const inactiveCount = filtered.filter(c => c.status === 'inativo').length;

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    onNavigate('client-detail');
  };

  return (
    <Container size="xl" px={{ base: 'md', sm: 'lg' }} py={{ base: 'md', sm: 'lg' }} fluid>
      <Stack gap="lg" maw={1400} mx="auto">
        {/* Stats */}
        <SimpleGrid cols={3} spacing={{ base: 'xs', sm: 'md' }}>
          {[
            { count: filtered.length, suffix: 'clientes no total' },
            { count: activeCount, suffix: 'ativos' },
            { count: inactiveCount, suffix: 'inativos' },
          ].map(stat => (
            <Paper key={stat.suffix} withBorder p={{ base: 'sm', sm: 'md' }}>
              <Group gap={6} align="baseline">
                <Text fw={700} fz={{ base: 'lg', sm: 'xl' }} lh={1} className="mono">{stat.count}</Text>
                <Text c="dimmed" size="sm">{stat.suffix}</Text>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Filters */}
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar por nome, cidade ou representante"
            leftSection={<MagnifyingGlassIcon size={14} />}
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            flex={{ base: '1 1 100%', sm: 1 }}
            miw={{ sm: 200 }}
          />

          <Popover position="bottom-end" withArrow shadow="md">
            <Popover.Target>
              <Button
                variant={activeFilterCount > 0 ? 'light' : 'default'}
                color="neutral"
                leftSection={<FunnelIcon size={14} />}
                rightSection={activeFilterCount > 0 ? (
                  <Badge circle color="neutral">{activeFilterCount}</Badge>
                ) : undefined}
              >
                Filtros
              </Button>
            </Popover.Target>
            <Popover.Dropdown w={320} maw="calc(100vw - 32px)">
              <Stack gap="md">
                <Box>
                  <Text tt="uppercase" c="dimmed" fw={600} size="sm" mb={6}>Região</Text>
                  <Group gap="sm">
                    {REGIONS.map(r => (
                      <Chip key={r} checked={regionFilters.includes(r)} onChange={() => toggleRegion(r)} variant="filled" color="neutral">
                        {r}
                      </Chip>
                    ))}
                  </Group>
                </Box>

                <Box>
                  <Text tt="uppercase" c="dimmed" fw={600} size="sm" mb={6}>Status</Text>
                  <Group gap="sm">
                    {STATUS_OPTIONS.map(s => (
                      <Chip key={s.value} checked={statusFilters.includes(s.value)} onChange={() => toggleStatus(s.value)} variant="filled" color="neutral">
                        {s.label}
                      </Chip>
                    ))}
                  </Group>
                </Box>

                {activeFilterCount > 0 && (
                  <Button variant="subtle" color="neutral" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>

          <Popover position="bottom-end" withArrow shadow="md">
            <Popover.Target>
              <Button
                variant={sortActive ? 'light' : 'default'}
                color="neutral"
                leftSection={<ArrowsDownUpIcon size={14} />}
                rightSection={sortActive ? <Badge circle color="neutral">1</Badge> : undefined}
              >
                Ordenar
              </Button>
            </Popover.Target>
            <Popover.Dropdown w={280} maw="calc(100vw - 32px)">
              <Stack gap="md">
                {/* 4 opções fixas: lista de rádios em vez de botões que imitam um select */}
                <Radio.Group
                  label="Ordenar por"
                  value={sortOrder}
                  onChange={v => setSortOrder(v as SortOrder)}
                >
                  <Stack gap="sm" mt={6}>
                    {SORT_OPTIONS.map(opt => (
                      <Radio key={opt.value} value={opt.value} label={opt.label} color="neutral" />
                    ))}
                  </Stack>
                </Radio.Group>
                {sortActive && (
                  <Button variant="subtle" color="neutral" onClick={() => setSortOrder(DEFAULT_SORT)}>
                    Restaurar Ordenação Padrão
                  </Button>
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </Group>

        {/* Client table */}
        <Card withBorder padding={0}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={{ sm: '50%' }}>Cliente</Table.Th>
                <Table.Th visibleFrom="sm">Cidade/Estado</Table.Th>
                <Table.Th visibleFrom="sm">Representante</Table.Th>
                <Table.Th w={40} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedClients.map(client => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <Table.Tr
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    bg={isSelected ? 'var(--mantine-color-neutral-0)' : undefined}
                    className={interactive.clickable}
                  >
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar size={36} color="neutral">{client.avatar}</Avatar>
                        <Box miw={0}>
                          <Group gap={6} mb={2}>
                            <Badge color={statusColor[client.status]} variant="light">{client.status}</Badge>
                            {client.inadimplente && <Badge color="yellow" variant="light">inadimplente</Badge>}
                            {isSelected && <Badge color="neutral" variant="light">selecionado</Badge>}
                          </Group>
                          <Text fw={600} truncate>{client.name}</Text>
                          <Text c="dimmed" size="sm">Último pedido em {formatOrderDate(client.lastOrder)}</Text>
                          {/* Colunas de cidade e representante resumidas abaixo do breakpoint sm */}
                          <Text c="dimmed" size="sm" hiddenFrom="sm" truncate>
                            {client.city}/{client.state} · {client.rep}
                          </Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="sm">
                      <Group gap={4} wrap="nowrap">
                        <MapPinIcon size={12} color="var(--mantine-color-dimmed)" />
                        <Text c="dimmed">{client.city}/{client.state}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="sm"><Text c="dimmed">{client.rep}</Text></Table.Td>
                    <Table.Td ta="right">
                      <CaretRightIcon size={16} color="var(--mantine-color-dimmed)" />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          {filtered.length === 0 && (
            <Stack align="center" py="xl" gap={4}>
              <ThemeIcon variant="light" color="neutral" size={48}>
                <UsersIcon size={24} />
              </ThemeIcon>
              <Text fw={600}>Nenhum cliente encontrado</Text>
              <Text c="dimmed" size="sm" ta="center" px="md">
                Nenhum cliente corresponde à busca ou aos filtros aplicados. Limpe-os para ver a carteira completa.
              </Text>
              <Button variant="default" mt="sm" onClick={() => { setSearch(''); clearFilters(); }}>
                Limpar Busca e Filtros
              </Button>
            </Stack>
          )}
        </Card>
      </Stack>
    </Container>
  );
}
