import { useState } from "react";
import {
  Container, SimpleGrid, Paper, Text, Group, TextInput, Popover, Button,
  Stack, Chip, Table, Avatar, Badge, ThemeIcon, Box,
} from "@mantine/core";
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
  'ativo': 'green',
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
  { value: 'ultimo-pedido-desc', label: 'Pedido mais recentes para mais antigos' },
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
    <Container size="xl" px="lg" py="lg" fluid>
      <Stack gap="lg" maw={1400} mx="auto">
        {/* Stats */}
        <SimpleGrid cols={3} spacing="md">
          {[
            { count: filtered.length, suffix: 'clientes no total' },
            { count: activeCount, suffix: 'ativos' },
            { count: inactiveCount, suffix: 'inativos' },
          ].map(stat => (
            <Paper key={stat.suffix} withBorder radius="md" p="md">
              <Group gap={8} align="baseline">
                <Text fw={700} style={{ fontSize: '1.75rem', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{stat.count}</Text>
                <Text c="dimmed" size="sm" fw={500}>{stat.suffix}</Text>
              </Group>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Filters */}
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar cliente, cidade, rep..."
            leftSection={<MagnifyingGlassIcon size={14} />}
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 200 }}
          />

          <Popover position="bottom-end" withArrow shadow="md">
            <Popover.Target>
              <Button
                variant={activeFilterCount > 0 ? 'light' : 'default'}
                color="neutral"
                leftSection={<FunnelIcon size={14} />}
                rightSection={activeFilterCount > 0 ? (
                  <Badge circle size="sm" color="neutral">{activeFilterCount}</Badge>
                ) : undefined}
              >
                Filtros
              </Button>
            </Popover.Target>
            <Popover.Dropdown w={320}>
              <Stack gap="md">
                <div>
                  <Text tt="uppercase" c="dimmed" fw={600} size="0.68rem" mb={6}>Região</Text>
                  <Group gap={6}>
                    {REGIONS.map(r => (
                      <Chip key={r} checked={regionFilters.includes(r)} onChange={() => toggleRegion(r)} variant="filled" color="neutral" size="sm">
                        {r}
                      </Chip>
                    ))}
                  </Group>
                </div>

                <div>
                  <Text tt="uppercase" c="dimmed" fw={600} size="0.68rem" mb={6}>Status</Text>
                  <Group gap={6}>
                    {STATUS_OPTIONS.map(s => (
                      <Chip key={s.value} checked={statusFilters.includes(s.value)} onChange={() => toggleStatus(s.value)} variant="filled" color="neutral" size="sm">
                        {s.label}
                      </Chip>
                    ))}
                  </Group>
                </div>

                {activeFilterCount > 0 && (
                  <Button variant="subtle" color="neutral" size="xs" px={0} onClick={clearFilters}>
                    Limpar filtros
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
                rightSection={sortActive ? <Badge circle size="sm" color="neutral">1</Badge> : undefined}
              >
                Ordenar
              </Button>
            </Popover.Target>
            <Popover.Dropdown w={280}>
              <Stack gap={4}>
                <Text tt="uppercase" c="dimmed" fw={600} size="0.68rem" mb={4}>Ordenar por</Text>
                {SORT_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={sortOrder === opt.value ? 'light' : 'subtle'}
                    color="neutral"
                    justify="flex-start"
                    fullWidth
                    onClick={() => setSortOrder(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
                {sortActive && (
                  <Button variant="subtle" color="neutral" size="xs" px={0} mt={4} onClick={() => setSortOrder(DEFAULT_SORT)}>
                    Restaurar ordenação padrão
                  </Button>
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>
        </Group>

        {/* Client table */}
        <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w="50%">Cliente</Table.Th>
                <Table.Th>Cidade/Estado</Table.Th>
                <Table.Th>Representante</Table.Th>
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
                    style={{ cursor: 'pointer', backgroundColor: isSelected ? 'var(--mantine-color-neutral-0)' : undefined }}
                  >
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <Avatar radius="xl" size={36} color="neutral">{client.avatar}</Avatar>
                        <Box style={{ minWidth: 0 }}>
                          <Group gap={6} mb={2}>
                            <Badge size="xs" color={statusColor[client.status]} variant="light">{client.status}</Badge>
                            {client.inadimplente && <Badge size="xs" color="yellow" variant="light">inadimplente</Badge>}
                            {isSelected && <Badge size="xs" color="neutral" variant="light">selecionado</Badge>}
                          </Group>
                          <Text fw={600} size="sm" truncate>{client.name}</Text>
                          <Text c="dimmed" size="xs">Último pedido em {formatOrderDate(client.lastOrder)}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <MapPinIcon size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                        <Text size="sm" c="dimmed">{client.city}/{client.state}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{client.rep}</Text></Table.Td>
                    <Table.Td ta="right">
                      <CaretRightIcon size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          {filtered.length === 0 && (
            <Stack align="center" py="xl" gap={4}>
              <ThemeIcon variant="light" color="neutral" size={48} radius="xl">
                <UsersIcon size={24} />
              </ThemeIcon>
              <Text fw={600}>Nenhum cliente encontrado</Text>
              <Text c="dimmed" size="sm">Tente ajustar os filtros</Text>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}
