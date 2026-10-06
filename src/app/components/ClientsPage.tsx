import { useState } from "react";
import {
  Container, SimpleGrid, Paper, Text, Group, TextInput, Popover, Button,
  Stack, Chip, Table, Badge, Box, Radio,
} from "@mantine/core";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  UsersIcon,
  FunnelIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import { clients, Client, formatDate } from "../data/mockData";
import { useMockLoading } from "../lib/useMockLoading";
import { KpiSkeleton, TableSkeleton } from "./ui/Skeletons";
import { DataTable, TableToolbar } from "./ui/DataTable";
import { EmptyState } from "./ui/EmptyState";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail';

interface ClientsPageProps {
  onNavigate: (view: View) => void;
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
}

// badges não encolhem dentro da tabela
const badgeStyles = { root: { flexShrink: 0, minWidth: 'max-content' } };

const statusColor: Record<string, string> = {
  'ativo': 'teal',
  'inativo': 'red',
};

// datas no formato pt-BR por extenso curto ("16 de jun. de 2026")
const formatOrderDate = formatDate;

const formatPct = (part: number, total: number) =>
  `${(total ? (part / total) * 100 : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

// Regiões com mais clientes na carteira aparecem primeiro (derivado do mock)
const REGIONS = ['Centro-Oeste', 'Norte', 'Nordeste', 'Sudeste', 'Sul']
  .map((r, i) => ({ r, i, count: clients.filter(c => c.region === r).length }))
  .sort((a, b) => b.count - a.count || a.i - b.i)
  .map(x => x.r);

type StatusFilterValue = 'ativo' | 'inativo' | 'inadimplente';
const STATUS_OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: 'ativo', label: 'ativo' },
  { value: 'inativo', label: 'inativo' },
  { value: 'inadimplente', label: 'inadimplente' },
];

type SortOrder = 'az' | 'za' | 'ultimo-pedido' | 'ultimo-pedido-desc';
const DEFAULT_SORT: SortOrder = 'ultimo-pedido';
const SORT_OPTIONS: Array<{ value: SortOrder; label: string }> = [
  { value: 'az', label: 'Nome de A a Z' },
  { value: 'za', label: 'Nome de Z a A' },
  { value: 'ultimo-pedido', label: 'Pedidos mais antigos primeiro' },
  { value: 'ultimo-pedido-desc', label: 'Pedidos mais recentes primeiro' },
];

export function ClientsPage({ onNavigate, selectedClient, setSelectedClient }: ClientsPageProps) {
  const [search, setSearch] = useState('');
  const [regionFilters, setRegionFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusFilterValue[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT);
  const loading = useMockLoading();

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
      <Stack gap="xl" maw={1400} mx="auto">
        {/* Stats */}
        {loading ? <KpiSkeleton count={3} cols={3} /> : (
        <SimpleGrid cols={3} spacing={{ base: 'xs', sm: 'md' }}>
          {/* KPI: rótulo, número grande e linha de comparação com unidade */}
          {[
            { label: 'Clientes', count: filtered.length, caption: 'na carteira filtrada' },
            { label: 'Ativos', count: activeCount, caption: `${formatPct(activeCount, filtered.length)} dos clientes` },
            { label: 'Inativos', count: inactiveCount, caption: `${formatPct(inactiveCount, filtered.length)} dos clientes` },
          ].map(stat => (
            <Paper key={stat.label} withBorder p={{ base: 'sm', sm: 'md' }}>
              <Stack gap={4}>
                <Text c="dimmed" size="sm">{stat.label}</Text>
                <Text fw={700} fz="xl" lh={1} className="mono">{stat.count.toLocaleString('pt-BR')}</Text>
                <Text c="dimmed" size="sm">{stat.caption}</Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
        )}

        {/* Busca e filtros */}
        <TableToolbar>
          <TextInput
            placeholder="Buscar por nome, cidade ou representante"
            leftSection={<MagnifyingGlassIcon size={16} />}
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
                leftSection={<FunnelIcon size={16} />}
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
                  <Text tt="uppercase" c="dimmed" fw={600} size="sm" mb="xs">Região</Text>
                  <Group gap="sm">
                    {REGIONS.map(r => (
                      <Chip key={r} checked={regionFilters.includes(r)} onChange={() => toggleRegion(r)} variant="filled" color="neutral">
                        {r}
                      </Chip>
                    ))}
                  </Group>
                </Box>

                <Box>
                  <Text tt="uppercase" c="dimmed" fw={600} size="sm" mb="xs">Status</Text>
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
              >
                Ordenar: {SORT_OPTIONS.find(o => o.value === sortOrder)?.label}
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
                  <Stack gap="sm" mt="xs">
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
        </TableToolbar>

        {/* Tabela de clientes: mesmo padrão em todas as larguras (rolagem lateral no celular) */}
        {loading ? <TableSkeleton rows={8} cols={5} /> : filtered.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Nenhum cliente encontrado"
            description="Nenhum cliente corresponde à busca ou aos filtros aplicados. Limpe-os para ver a carteira completa."
            action={{ label: 'Limpar Busca e Filtros', onClick: () => { setSearch(''); clearFilters(); }, forward: false }}
          />
        ) : (
          <DataTable headers={['Cliente', 'Status', 'Cidade/Estado', 'Representante', 'Ações']} minWidth={860}>
            {sortedClients.map(client => {
              const isSelected = selectedClient?.id === client.id;
              return (
                <Table.Tr key={client.id} data-selected={isSelected || undefined} onClick={() => handleSelectClient(client)} style={{ cursor: 'pointer' }}>
                  <Table.Td maw={320}>
                    <Text fw={600} truncate>{client.name}</Text>
                    <Text c="dimmed" size="sm">Último pedido em {formatOrderDate(client.lastOrder)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Badge color={statusColor[client.status]} variant="light" styles={badgeStyles}>{client.status}</Badge>
                      {client.inadimplente && <Badge color="yellow" variant="light" styles={badgeStyles}>inadimplente</Badge>}
                      {isSelected && <Badge color="neutral" variant="light" styles={badgeStyles}>selecionado</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <MapPinIcon size={16} color="var(--mantine-color-dimmed)" />
                      <Text c="dimmed">{client.city}/{client.state}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text c="dimmed">{client.rep}</Text></Table.Td>
                  <Table.Td ta="right">
                    <Button
                      variant="default"
                      size="sm"
                      leftSection={<EyeIcon size={16} />}
                      onClick={e => { e.stopPropagation(); handleSelectClient(client); }}
                      aria-label={`Ver cliente ${client.name}`}
                    >
                      Ver
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </DataTable>
        )}
      </Stack>
    </Container>
  );
}
