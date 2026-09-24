import { useState } from "react";
import {
  Stack, Group, Box, Paper, Text, Title, Button, TextInput, Select, Badge, ThemeIcon, SimpleGrid,
  Tabs, Table, ActionIcon, Avatar, Collapse, Alert,
} from "@mantine/core";
import {
  UsersIcon,
  WarehouseIcon,
  TagIcon,
  GearIcon,
  ShieldIcon,
  PlusIcon,
  PencilSimpleLineIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CaretRightIcon,
  ArrowLeftIcon,
  InfoIcon,
  MapPinIcon,
  UserCircleIcon,
  StackIcon,
  PackageIcon,
  LockIcon,
  StorefrontIcon,
  PlugChargingIcon,
  type Icon,
} from "@phosphor-icons/react";

import { formatDate } from "../data/mockData";
import { visoes, defaultPermissions, type VisaoKey, type PermissionsState } from "../data/permissions";
import { linkedUsers } from "../data/linkedUsers";
import { PermissionMatrixTable } from "./PermissionMatrixTable";
import { IndustryStockTable } from "./IndustryStockTable";
import { ClientStockTab } from "./ClientStockTab";
import classes from "./interactive.module.css";

const tabs = [
  { id: 'industry-stock', label: 'Estoque Industrial', icon: WarehouseIcon },
  { id: 'client-stock', label: 'Estoque do Cliente', icon: StorefrontIcon },
  { id: 'pricing', label: 'Campanhas Comerciais', icon: TagIcon },
  { id: 'policies', label: 'Políticas', icon: LockIcon },
  { id: 'permissions', label: 'Permissões', icon: ShieldIcon },
  { id: 'settings', label: 'Configurações', icon: GearIcon },
];

const badgeStyles = { label: { textTransform: 'none' as const } };

// cabeçalho de tabela: texto pequeno e discreto sobre fundo levemente tingido
const thStyle = { fontSize: '0.72rem', fontWeight: 500 };

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);

function ErpSyncNotice({ text }: { text: string }) {
  return (
    <Alert variant="light" color="neutral" radius="lg" icon={<PlugChargingIcon size={16} />} p="sm">
      <Text size="0.78rem" lh={1.55}>{text}</Text>
    </Alert>
  );
}

function PolicySection({ icon: SectionIcon, title, hint, children }: { icon: Icon; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Paper withBorder radius="lg" p="lg" h="100%">
      <Group gap={8} mb={4}>
        <SectionIcon size={14} />
        <Title order={4} fw={600} style={{ fontSize: '0.85rem' }}>{title}</Title>
      </Group>
      {hint && <Text c="dimmed" size="0.72rem">{hint}</Text>}
      <Box mt="sm">{children}</Box>
    </Paper>
  );
}

function CriteriaChips({ items }: { items: string[] }) {
  return (
    <Group gap={6}>
      {items.length === 0 && <Text c="dimmed" size="0.75rem">Nenhum item nesta condição</Text>}
      {items.map(v => (
        <Badge key={v} size="md" variant="light" color="neutral" radius="xl" fw={500} styles={badgeStyles}>{v}</Badge>
      ))}
    </Group>
  );
}

function UserCell({ name }: { name: string }) {
  return (
    <Group gap={10} wrap="nowrap">
      <Avatar size={28} radius="xl" color="neutral" variant="light" styles={{ placeholder: { fontSize: '0.62rem', fontWeight: 700 } }}>
        {initials(name)}
      </Avatar>
      <Text size="0.82rem" fw={500}>{name}</Text>
    </Group>
  );
}

// linha de configuração somente leitura (rótulo + descrição à esquerda, valor à direita)
function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <Paper withBorder radius="md" p="md" bg="var(--mantine-color-default-hover)">
      <Group justify="space-between" wrap="nowrap" gap="md">
        <Box>
          <Text size="0.85rem" fw={500}>{label}</Text>
          <Text c="dimmed" size="0.75rem">{desc}</Text>
        </Box>
        {children}
      </Group>
    </Paper>
  );
}

const mockUsers = [
  { id: 'U001', name: 'Marcos Andrade', email: 'marcos@tesla.com.br', role: 'Representante', region: 'Sudeste', status: 'ativo', lastLogin: '2026-06-11' },
  { id: 'U002', name: 'Fernanda Lima', email: 'fernanda@tesla.com.br', role: 'Representante', region: 'Sul', status: 'ativo', lastLogin: '2026-06-10' },
  { id: 'U003', name: 'Carlos Mendes', email: 'carlos@tesla.com.br', role: 'Representante', region: 'Sudeste', status: 'ativo', lastLogin: '2026-06-11' },
  { id: 'U004', name: 'Ana Santos', email: 'ana@tesla.com.br', role: 'Representante', region: 'Nordeste', status: 'ativo', lastLogin: '2026-06-09' },
  { id: 'U005', name: 'Rafael Costa', email: 'rafael@tesla.com.br', role: 'Admin', region: 'Nacional', status: 'ativo', lastLogin: '2026-06-11' },
];

const pricePolicies = [
  { id: 'P001', name: 'Política Padrão', discount: '0%', minOrder: 'R$ 1.000', payment: '30 DDL', clients: 180 },
  { id: 'P002', name: 'Cliente Premium', discount: '12%', minOrder: 'R$ 2.000', payment: '30/60/90 DDL', clients: 42 },
  { id: 'P003', name: 'Distribuidor Exclusivo', discount: '20%', minOrder: 'R$ 5.000', payment: '60/90/120 DDL', clients: 8 },
  { id: 'P004', name: 'Novos Clientes', discount: '5%', minOrder: 'R$ 500', payment: '30 DDL', clients: 17 },
];

type PolicyCriteria = {
  clients: string[];
  regions: string[];
  reps: string[];
  lines: string[];
  products: string[];
};

const initialCriteria: Record<string, PolicyCriteria> = {
  P001: { clients: [], regions: ['Norte', 'Centro-Oeste', 'Nordeste'], reps: [], lines: ['Coil', 'Hertz'], products: [] },
  P002: {
    clients: ['Calçados Beira Rio', 'Sapataria Central', 'Loja Modelo SP'],
    regions: ['Sul', 'Sudeste'],
    reps: ['Carlos Mendes', 'Ana Souza'],
    lines: ['Flow XL', 'Flow', 'Hertz Art'],
    products: [],
  },
  P003: { clients: [], regions: [], reps: ['Rafael Costa'], lines: ['Flow XL'], products: [] },
  P004: { clients: [], regions: [], reps: [], lines: ['Coil'], products: [] },
};

const coveredClientsMock = [
  { name: 'Calçados Beira Rio', city: 'Porto Alegre, RS', rep: 'Carlos Mendes' },
  { name: 'Sapataria Central', city: 'Florianópolis, SC', rep: 'Carlos Mendes' },
  { name: 'Loja Modelo SP', city: 'São Paulo, SP', rep: 'Ana Souza' },
  { name: 'Calçados Estrela', city: 'Curitiba, PR', rep: 'Carlos Mendes' },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('industry-stock');
  const [search, setSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const criteriaState = initialCriteria;
  const [activeView, setActiveView] = useState<VisaoKey>('industria');
  const [permissionsState, setPermissionsState] = useState<PermissionsState>(defaultPermissions);

  const togglePermission = (visao: VisaoKey, perfil: string, modulo: string) => {
    setPermissionsState(prev => ({
      ...prev,
      [visao]: {
        ...prev[visao],
        [perfil]: {
          ...prev[visao][perfil],
          [modulo]: !prev[visao][perfil][modulo],
        },
      },
    }));
  };

  const filteredUsers = mockUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack gap="lg" p="lg" maw={1400} mx="auto" w="100%">
      {/* Tab bar */}
      <Paper withBorder radius="lg" p={4}>
        <Tabs value={activeTab} onChange={v => v && setActiveTab(v)} variant="pills" color="gray">
          <Tabs.List style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <Tabs.Tab
                  key={tab.id}
                  value={tab.id}
                  leftSection={<TabIcon size={14} />}
                  style={{ flexShrink: 0 }}
                  styles={{
                    tab: {
                      fontSize: '0.82rem',
                      fontWeight: active ? 600 : 400,
                      color: active ? 'var(--mantine-color-text)' : 'var(--mantine-color-dimmed)',
                      backgroundColor: active ? 'var(--mantine-color-default-hover)' : undefined,
                    },
                  }}
                >
                  {tab.label}
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs>
      </Paper>

      {/* Estoque Industrial Tab */}
      {activeTab === 'industry-stock' && (
        <IndustryStockTable />
      )}

      {/* Estoque do Cliente Tab */}
      {activeTab === 'client-stock' && (
        <ClientStockTab />
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && !selectedPolicyId && (
        <Stack gap="md">
          <ErpSyncNotice text="Campanhas comerciais são somente leitura neste momento — os dados vêm diretamente das regras cadastradas no ERP da Tesla." />
          <Text c="dimmed" size="0.85rem">Políticas de preço ativas</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {pricePolicies.map(policy => (
              <Paper
                key={policy.id}
                component="button"
                type="button"
                onClick={() => setSelectedPolicyId(policy.id)}
                withBorder
                radius="lg"
                p="lg"
                className={`${classes.cardButton} ${classes.hoverable}`}
              >
                <Group justify="space-between" align="flex-start" mb="sm" wrap="nowrap">
                  <Title order={3} fw={600} style={{ fontSize: '0.9rem' }}>{policy.name}</Title>
                  <CaretRightIcon size={14} style={{ color: 'var(--mantine-color-dimmed)', flexShrink: 0 }} />
                </Group>
                <SimpleGrid cols={3} spacing="sm" mb="sm">
                  {[
                    { label: 'Desconto', value: policy.discount, highlight: true },
                    { label: 'Pedido mín.', value: policy.minOrder, mono: true },
                    { label: 'Pagamento', value: policy.payment },
                  ].map(detail => (
                    <Box key={detail.label}>
                      <Text c="dimmed" size="0.7rem">{detail.label}</Text>
                      <Text className={detail.mono ? 'mono' : undefined} size="0.85rem" fw={detail.highlight ? 700 : 500}>
                        {detail.value}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
                <Text c="dimmed" size="0.72rem">
                  <Text span fw={600} c="var(--mantine-color-text)" inherit>{policy.clients}</Text> clientes nesta política
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      )}

      {activeTab === 'pricing' && selectedPolicyId && (() => {
        const policy = pricePolicies.find(p => p.id === selectedPolicyId)!;
        const criteria = criteriaState[selectedPolicyId] ?? { clients: [], regions: [], reps: [], lines: [], products: [] };
        const covered = selectedPolicyId === 'P002' ? coveredClientsMock : coveredClientsMock.slice(0, Math.min(policy.clients, coveredClientsMock.length));

        return (
          <Stack gap="lg">
            <Box>
              <Button
                onClick={() => setSelectedPolicyId(null)}
                variant="subtle"
                color="gray"
                size="compact-xs"
                px={4}
                leftSection={<ArrowLeftIcon size={14} />}
                styles={{ label: { fontWeight: 400, fontSize: '0.78rem' } }}
              >
                Voltar para políticas
              </Button>
            </Box>

            <ErpSyncNotice text="Esta política é somente leitura — a regra ativa vem do ERP da Tesla." />

            {/* Identidade */}
            <Paper withBorder radius="lg" p="lg">
              <Box mb="md">
                <Title order={2} fw={700} mb={4} style={{ fontSize: '1.15rem' }}>{policy.name}</Title>
                <Text c="dimmed" size="0.78rem">Configuração da política comercial</Text>
              </Box>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                {[
                  { label: 'Desconto', value: policy.discount, highlight: true },
                  { label: 'Pedido mínimo', value: policy.minOrder, mono: true },
                  { label: 'Pagamento', value: policy.payment },
                  { label: 'Clientes cobertos', value: String(policy.clients) },
                ].map(d => (
                  <Paper key={d.label} radius="md" p="sm" bg="var(--mantine-color-default-hover)">
                    <Text c="dimmed" size="0.7rem" tt="uppercase" mb={4} style={{ letterSpacing: '0.05em' }}>{d.label}</Text>
                    <Text className={d.mono ? 'mono' : undefined} size="1rem" fw={d.highlight ? 700 : 600}>{d.value}</Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>

            {/* Aviso precedência */}
            <Alert variant="light" color="yellow" radius="lg" icon={<InfoIcon size={16} />} p="sm">
              <Text size="0.78rem" lh={1.55}>
                <Text span fw={600} inherit>Precedência:</Text> critérios mais específicos sobrepõem os mais amplos.
                Clientes específicos &gt; Representantes &gt; Regiões. Produtos específicos &gt; Linhas de produto.
              </Text>
            </Alert>

            {/* Critérios */}
            <Box>
              <Title order={3} fw={600} mb="sm" style={{ fontSize: '0.95rem' }}>Critérios de aplicação</Title>
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                <PolicySection icon={UserCircleIcon} title="Clientes específicos" hint="Lojistas vinculados diretamente. Sobrepõe qualquer outro critério.">
                  <CriteriaChips items={criteria.clients} />
                </PolicySection>

                <PolicySection icon={MapPinIcon} title="Regiões" hint="Vale para todos os clientes da região.">
                  <CriteriaChips items={criteria.regions} />
                </PolicySection>

                <PolicySection icon={UsersIcon} title="Representantes" hint="Aplica a toda a carteira do rep.">
                  <CriteriaChips items={criteria.reps} />
                </PolicySection>

                <PolicySection icon={StackIcon} title="Linhas de produto" hint="A política se aplica apenas a estas linhas.">
                  <CriteriaChips items={criteria.lines} />
                </PolicySection>
              </SimpleGrid>
              <Box mt="md">
                <PolicySection icon={PackageIcon} title="Produtos específicos (SKU)" hint="Granularidade por SKU. Se vazio, vale para todas as linhas marcadas acima.">
                  <CriteriaChips items={criteria.products} />
                </PolicySection>
              </Box>
            </Box>

            {/* Clientes cobertos */}
            <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
              <Box p="lg" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Title order={3} fw={600} style={{ fontSize: '0.95rem' }}>Clientes cobertos</Title>
                <Text c="dimmed" size="0.75rem" mt={4}>
                  Resultado consolidado dos critérios acima · {policy.clients} lojistas · somente leitura
                </Text>
              </Box>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead bg="var(--mantine-color-default-hover)">
                  <Table.Tr>
                    {['Lojista', 'Cidade/UF', 'Representante'].map(c => (
                      <Table.Th key={c} c="dimmed" tt="uppercase" style={{ ...thStyle, fontSize: '0.7rem', letterSpacing: '0.05em' }}>{c}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {covered.map(c => (
                    <Table.Tr key={c.name}>
                      <Table.Td fw={500} style={{ fontSize: '0.82rem' }}>{c.name}</Table.Td>
                      <Table.Td c="dimmed" style={{ fontSize: '0.78rem' }}>{c.city}</Table.Td>
                      <Table.Td c="dimmed" style={{ fontSize: '0.78rem' }}>{c.rep}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Stack>
        );
      })()}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <Stack gap="md">
          <ErpSyncNotice text="Políticas são somente leitura neste momento — os valores exibidos refletem as regras vigentes no ERP da Tesla." />
          <Paper withBorder radius="lg" p="lg">
            <Title order={3} fw={600} size="1rem" mb="md">Configurações de aprovação</Title>
            <Stack gap="md">
              {[
                { label: 'Aprovação automática até', desc: 'Pedidos abaixo deste valor são aprovados automaticamente', value: 'R$ 5.000' },
                { label: 'Prazo de aprovação', desc: 'Tempo máximo para aprovação manual de pedidos', value: '48 horas' },
                { label: 'Desconto máximo por rep', desc: 'Desconto máximo que um representante pode conceder', value: '15%' },
              ].map(setting => (
                <SettingRow key={setting.label} label={setting.label} desc={setting.desc}>
                  <Text className="mono" fw={700} style={{ flexShrink: 0 }}>{setting.value}</Text>
                </SettingRow>
              ))}
            </Stack>
          </Paper>

          <Paper withBorder radius="lg" p="lg">
            <Title order={3} fw={600} size="1rem" mb={4}>Inadimplência</Title>
            <Text c="dimmed" size="0.78rem" mb="md">Define o comportamento do sistema para clientes com pagamentos em atraso.</Text>
            <SettingRow label="Clientes inadimplentes" desc="Condição de pagamento aplicada automaticamente a clientes com débitos em aberto">
              <Paper withBorder radius="md" px="sm" py={8} style={{ flexShrink: 0 }}>
                <Text size="0.82rem" fw={500}>Apenas pagamento à vista</Text>
              </Paper>
            </SettingRow>
          </Paper>
        </Stack>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Stack gap="md">
          {/* Usuários */}
          <Paper withBorder radius="lg" p="lg">
            <Group justify="space-between" mb="md" gap="sm">
              <Title order={3} fw={600} size="1rem">Usuários</Title>
              <Group gap={8}>
                <TextInput
                  placeholder="Buscar usuário..."
                  leftSection={<MagnifyingGlassIcon size={14} />}
                  value={search}
                  onChange={e => setSearch(e.currentTarget.value)}
                  size="xs"
                />
                <Button onClick={() => setShowAddUser(!showAddUser)} size="xs" leftSection={<PlusIcon size={14} />}>
                  Novo usuário
                </Button>
              </Group>
            </Group>
            <Collapse in={showAddUser}>
              <Paper withBorder radius="lg" p="md" mb="md" bg="var(--mantine-color-default-hover)">
                <Title order={4} fw={600} mb="sm" style={{ fontSize: '0.88rem' }}>Adicionar usuário</Title>
                <SimpleGrid cols={2} spacing="sm">
                  <TextInput label="Nome completo" placeholder="Nome do usuário" size="xs" />
                  <TextInput label="E-mail" placeholder="email@tesla.com.br" size="xs" />
                  <Select
                    label="Perfil"
                    data={['Representante', 'Preposto', 'Lojista', 'Comprador', 'Admin']}
                    defaultValue="Representante"
                    allowDeselect={false}
                    size="xs"
                  />
                  <Select
                    label="Região"
                    data={['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte', 'Nacional']}
                    defaultValue="Sudeste"
                    allowDeselect={false}
                    size="xs"
                  />
                </SimpleGrid>
                <Group justify="flex-end" gap={8} mt="sm">
                  <Button onClick={() => setShowAddUser(false)} variant="default" size="xs">Cancelar</Button>
                  <Button onClick={() => setShowAddUser(false)} size="xs">Criar usuário</Button>
                </Group>
              </Paper>
            </Collapse>
            <Table.ScrollContainer minWidth={800}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead bg="var(--mantine-color-default-hover)">
                  <Table.Tr>
                    {['Nome', 'E-mail', 'Perfil', 'Região', 'Status', 'Último acesso', ''].map(col => (
                      <Table.Th key={col} c="dimmed" style={thStyle}>{col}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredUsers.map(user => (
                    <Table.Tr key={user.id}>
                      <Table.Td><UserCell name={user.name} /></Table.Td>
                      <Table.Td c="dimmed" style={{ fontSize: '0.78rem' }}>{user.email}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color={user.role === 'Admin' ? 'violet' : 'dark'} styles={badgeStyles}>{user.role}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" style={{ fontSize: '0.78rem' }}>{user.region}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="teal" styles={badgeStyles}>{user.status}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" className="mono" style={{ fontSize: '0.75rem' }}>{formatDate(user.lastLogin)}</Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Editar usuário"><PencilSimpleLineIcon size={14} /></ActionIcon>
                          <ActionIcon variant="subtle" color="red" size="sm" aria-label="Excluir usuário"><TrashIcon size={14} /></ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          {/* Usuários vinculados a representantes e lojistas */}
          <Paper withBorder radius="lg" p="lg">
            <Title order={3} fw={600} size="1rem">Usuários vinculados</Title>
            <Text c="dimmed" size="0.78rem" mt={4} mb="md">
              Contas registradas sob um representante ou lojista (ex.: prepostos e compradores). Cada um gerencia o perfil de acesso da própria equipe.
            </Text>
            <Table.ScrollContainer minWidth={800}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead bg="var(--mantine-color-default-hover)">
                  <Table.Tr>
                    {['Usuário', 'E-mail', 'Perfil', 'Vinculado a', 'Status', 'Último acesso'].map(col => (
                      <Table.Th key={col} c="dimmed" style={thStyle}>{col}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {linkedUsers.map(user => (
                    <Table.Tr key={user.id}>
                      <Table.Td><UserCell name={user.name} /></Table.Td>
                      <Table.Td c="dimmed" style={{ fontSize: '0.78rem' }}>{user.email}</Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color="neutral" styles={badgeStyles}>{user.profile}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color={user.ownerType === 'representante' ? 'yellow' : 'teal'} styles={badgeStyles}>
                          {user.ownerType === 'representante' ? 'Rep · ' : 'Lojista · '}{user.ownerName}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" variant="light" color={user.status === 'ativo' ? 'teal' : 'gray'} styles={badgeStyles}>{user.status}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" className="mono" style={{ fontSize: '0.75rem' }}>{user.lastLogin === '—' ? '—' : formatDate(user.lastLogin)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          <Paper withBorder radius="lg" p="lg">
            <Title order={3} fw={600} size="1rem" mb="md">Informações da empresa</Title>
            <SimpleGrid cols={2} spacing="md">
              {[
                { label: 'Nome da empresa', value: 'Tesla Footwear Indústria LTDA' },
                { label: 'CNPJ', value: '12.345.678/0001-90' },
                { label: 'Website', value: 'teslafootwear.com.br' },
                { label: 'Suporte', value: 'suporte@tesla.com.br' },
              ].map(field => (
                <TextInput
                  key={field.label}
                  label={field.label}
                  defaultValue={field.value}
                  styles={{ label: { fontSize: '0.75rem', fontWeight: 400, color: 'var(--mantine-color-dimmed)' } }}
                />
              ))}
            </SimpleGrid>
            <Button mt="md">Salvar alterações</Button>
          </Paper>
        </Stack>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <Stack gap="md">
          {/* Visão selector */}
          <SimpleGrid cols={3} spacing="sm">
            {visoes.map(v => {
              const VisaoIcon = v.icon;
              const active = activeView === v.id;
              return (
                <Paper
                  key={v.id}
                  component="button"
                  type="button"
                  onClick={() => setActiveView(v.id)}
                  withBorder
                  radius="lg"
                  p="md"
                  className={`${classes.cardButton} ${active ? '' : classes.hoverable}`}
                  style={active ? { borderColor: 'var(--mantine-color-neutral-9)', backgroundColor: 'var(--mantine-color-neutral-0)' } : undefined}
                >
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon variant={active ? 'filled' : 'light'} color={active ? 'neutral' : 'gray'} size={36} radius="md">
                      <VisaoIcon size={16} />
                    </ThemeIcon>
                    <Box>
                      <Text size="0.85rem" fw={600}>{v.label}</Text>
                      <Text c="dimmed" size="0.72rem">{v.desc}</Text>
                    </Box>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>

          {/* Permission matrix */}
          <PermissionMatrixTable
            matrix={permissionsState[activeView]}
            onToggle={(perfil, modulo) => togglePermission(activeView, perfil, modulo)}
            onReset={() => setPermissionsState(prev => ({ ...prev, [activeView]: defaultPermissions[activeView] }))}
          />
        </Stack>
      )}
    </Stack>
  );
}
