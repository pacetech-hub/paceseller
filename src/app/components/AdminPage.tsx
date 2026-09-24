import { useState } from "react";
import {
  Stack, Group, Flex, Box, Paper, Card, Text, Title, Button, TextInput, Select, Badge, ThemeIcon, SimpleGrid,
  Tabs, Table, Avatar, Collapse, Alert, Divider,
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
import { toast } from "../lib/toast";
import { IndustryStockTable } from "./IndustryStockTable";
import { ClientStockTab } from "./ClientStockTab";
import classes from "./interactive.module.css";
import admin from "./AdminPage.module.css";

const tabs = [
  { id: 'industry-stock', label: 'Estoque Industrial', icon: WarehouseIcon },
  { id: 'client-stock', label: 'Estoque do Cliente', icon: StorefrontIcon },
  { id: 'pricing', label: 'Campanhas Comerciais', icon: TagIcon },
  { id: 'policies', label: 'Políticas', icon: LockIcon },
  { id: 'permissions', label: 'Permissões', icon: ShieldIcon },
  { id: 'settings', label: 'Configurações', icon: GearIcon },
];

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2);

function ErpSyncNotice({ text }: { text: string }) {
  return (
    <Alert variant="light" color="neutral" icon={<PlugChargingIcon size={16} />} p="sm">
      <Text size="sm" lh={1.55}>{text}</Text>
    </Alert>
  );
}

function PolicySection({ icon: SectionIcon, title, hint, children }: { icon: Icon; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Paper withBorder p={{ base: 'md', sm: 'lg' }} h="100%">
      <Group gap={8} mb={4}>
        <SectionIcon size={16} />
        <Title order={4}>{title}</Title>
      </Group>
      {hint && <Text c="dimmed" size="sm">{hint}</Text>}
      <Box mt="sm">{children}</Box>
    </Paper>
  );
}

function CriteriaChips({ items }: { items: string[] }) {
  return (
    <Group gap={6}>
      {/* Somente leitura: a única forma de mudar é pela regra no ERP */}
      {items.length === 0 && <Text c="dimmed" size="sm">Nenhum item nesta condição. Para incluir, ajuste a regra no ERP da Tesla.</Text>}
      {items.map(v => (
        <Badge key={v} variant="light" color="neutral" fw={600}>{v}</Badge>
      ))}
    </Group>
  );
}

function UserCell({ name }: { name: string }) {
  return (
    <Group gap={10} wrap="nowrap">
      <Avatar size={32} color="neutral" variant="light">
        {initials(name)}
      </Avatar>
      <Text fw={600}>{name}</Text>
    </Group>
  );
}

// linha de configuração somente leitura (rótulo + descrição à esquerda, valor à direita)
function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <Paper withBorder p="md" bg="var(--mantine-color-default-hover)">
      {/* Valor abaixo do texto no celular; à direita a partir de xs */}
      <Flex
        direction={{ base: 'column', xs: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', xs: 'center' }}
        gap={{ base: 'xs', xs: 'md' }}
      >
        <Box>
          <Text fw={600}>{label}</Text>
          <Text c="dimmed" size="sm">{desc}</Text>
        </Box>
        {children}
      </Flex>
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

type AdminUser = typeof mockUsers[number];

const emptyNewUser = { name: '', email: '', role: 'Representante', region: 'Sudeste' };

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('industry-stock');
  const [search, setSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [newUser, setNewUser] = useState(emptyNewUser);
  const [newUserErrors, setNewUserErrors] = useState<{ name?: string; email?: string }>({});
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

  const closeAddUser = () => {
    setShowAddUser(false);
    setNewUser(emptyNewUser);
    setNewUserErrors({});
  };

  const createUser = () => {
    // Erros ao lado do campo, dizendo como corrigir
    const errors: { name?: string; email?: string } = {};
    if (!newUser.name.trim()) errors.name = 'Informe o nome completo do usuário';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email.trim())) errors.email = 'Informe um e-mail válido, ex.: nome@tesla.com.br';
    setNewUserErrors(errors);
    if (errors.name || errors.email) return;
    const created: AdminUser = {
      id: `U-NEW-${Date.now()}`,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      region: newUser.region,
      status: 'ativo',
      lastLogin: '—',
    };
    setUsers(prev => [created, ...prev]);
    setSearch('');
    closeAddUser();
    toast.success(`Usuário ${created.name} criado`, 'Ele já aparece no topo da lista de usuários abaixo');
  };

  const deleteUser = (user: AdminUser) => {
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast.success(`Usuário ${user.name} excluído`, 'Ele não consegue mais acessar. Para devolver o acesso, adicione-o novamente.');
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* Tab bar */}
      <Paper withBorder p={4}>
        <Tabs value={activeTab} onChange={v => v && setActiveTab(v)} variant="pills" color="gray">
          <Tabs.List className={admin.tabList}>
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <Tabs.Tab
                  key={tab.id}
                  value={tab.id}
                  leftSection={<TabIcon size={16} />}
                  flex="none"
                  className={admin.tab}
                  styles={{
                    tab: {
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
          <Text c="dimmed">Políticas de preço ativas</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {pricePolicies.map(policy => (
              <Paper
                key={policy.id}
                component="button"
                type="button"
                onClick={() => setSelectedPolicyId(policy.id)}
                withBorder
                p={{ base: 'md', sm: 'lg' }}
                className={`${classes.cardButton} ${classes.hoverable}`}
              >
                <Group justify="space-between" align="flex-start" mb="sm" wrap="nowrap">
                  <Title order={3}>{policy.name}</Title>
                  <CaretRightIcon size={16} color="var(--mantine-color-dimmed)" />
                </Group>
                <SimpleGrid cols={3} spacing="sm" mb="sm">
                  {[
                    { label: 'Desconto', value: policy.discount, highlight: true },
                    { label: 'Pedido mín.', value: policy.minOrder, mono: true },
                    { label: 'Pagamento', value: policy.payment },
                  ].map(detail => (
                    <Box key={detail.label}>
                      <Text c="dimmed" size="sm">{detail.label}</Text>
                      <Text className={detail.mono ? 'mono' : undefined} fw={detail.highlight ? 700 : 600}>
                        {detail.value}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
                <Text c="dimmed" size="sm">
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
                ml={-12}
                leftSection={<ArrowLeftIcon size={16} />}
              >
                Voltar para políticas
              </Button>
            </Box>

            <ErpSyncNotice text="Esta política é somente leitura — a regra ativa vem do ERP da Tesla." />

            {/* Identidade */}
            <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
              <Box mb="md">
                <Title order={1} mb={4}>{policy.name}</Title>
                <Text c="dimmed" size="sm">Configuração da política comercial</Text>
              </Box>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                {[
                  { label: 'Desconto', value: policy.discount, highlight: true },
                  { label: 'Pedido mínimo', value: policy.minOrder, mono: true },
                  { label: 'Pagamento', value: policy.payment },
                  { label: 'Clientes cobertos', value: String(policy.clients) },
                ].map(d => (
                  <Paper key={d.label} p="sm" bg="var(--mantine-color-default-hover)">
                    <Text c="dimmed" size="sm" mb={4}>{d.label}</Text>
                    <Text className={d.mono ? 'mono' : undefined} fw={d.highlight ? 700 : 600}>{d.value}</Text>
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>

            {/* Aviso precedência */}
            <Alert variant="light" color="yellow" icon={<InfoIcon size={16} />} p="sm">
              <Text size="sm" lh={1.55}>
                <Text span fw={600} inherit>Precedência:</Text> critérios mais específicos sobrepõem os mais amplos.
                Clientes específicos &gt; Representantes &gt; Regiões. Produtos específicos &gt; Linhas de produto.
              </Text>
            </Alert>

            {/* Critérios */}
            <Box>
              <Title order={3} mb="sm">Critérios de aplicação</Title>
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
            <Card withBorder padding={0}>
              <Box p={{ base: 'md', sm: 'lg' }}>
                <Title order={3}>Clientes cobertos</Title>
                <Text c="dimmed" size="sm" mt={4}>
                  Resultado consolidado dos critérios acima · {policy.clients} lojistas · somente leitura
                </Text>
              </Box>
              <Divider color="var(--mantine-color-default-border)" />
              <Table.ScrollContainer minWidth={520}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="md">
                <Table.Thead bg="var(--mantine-color-default-hover)">
                  <Table.Tr>
                    {['Lojista', 'Cidade/UF', 'Representante'].map(c => (
                      <Table.Th key={c} c="dimmed" fz="sm" fw={600}>{c}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {covered.map(c => (
                    <Table.Tr key={c.name}>
                      <Table.Td fw={600}>{c.name}</Table.Td>
                      <Table.Td c="dimmed">{c.city}</Table.Td>
                      <Table.Td c="dimmed">{c.rep}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              </Table.ScrollContainer>
            </Card>
          </Stack>
        );
      })()}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <Stack gap="md">
          <ErpSyncNotice text="Políticas são somente leitura neste momento — os valores exibidos refletem as regras vigentes no ERP da Tesla." />
          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Title order={3} mb="md">Configurações de aprovação</Title>
            <Stack gap="md">
              {[
                { label: 'Aprovação automática até', desc: 'Pedidos abaixo deste valor são aprovados automaticamente', value: 'R$ 5.000' },
                { label: 'Prazo de aprovação', desc: 'Tempo máximo para aprovação manual de pedidos', value: '48 horas' },
                { label: 'Desconto máximo por rep', desc: 'Desconto máximo que um representante pode conceder', value: '15%' },
              ].map(setting => (
                <SettingRow key={setting.label} label={setting.label} desc={setting.desc}>
                  <Text className="mono" fw={700} flex="none">{setting.value}</Text>
                </SettingRow>
              ))}
            </Stack>
          </Paper>

          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Title order={3} mb={4}>Inadimplência</Title>
            <Text c="dimmed" size="sm" mb="md">Define o comportamento do sistema para clientes com pagamentos em atraso.</Text>
            <SettingRow label="Clientes inadimplentes" desc="Condição de pagamento aplicada automaticamente a clientes com débitos em aberto">
              <Paper withBorder px="sm" py={8} flex="none">
                <Text fw={600}>Apenas pagamento à vista</Text>
              </Paper>
            </SettingRow>
          </Paper>
        </Stack>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Stack gap="md">
          {/* Usuários */}
          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Group justify="space-between" mb="md" gap="sm">
              <Title order={3}>Usuários</Title>
              <Group gap={8}>
                <TextInput
                  placeholder="Buscar usuário..."
                  leftSection={<MagnifyingGlassIcon size={16} />}
                  value={search}
                  onChange={e => setSearch(e.currentTarget.value)}
                  aria-label="Buscar usuário"
                />
                <Button onClick={() => (showAddUser ? closeAddUser() : setShowAddUser(true))} leftSection={<PlusIcon size={16} />}>
                  Adicionar usuário
                </Button>
              </Group>
            </Group>
            <Collapse in={showAddUser}>
              <Paper withBorder p="md" mb="md" bg="var(--mantine-color-default-hover)">
                <Title order={4} mb="sm">Adicionar usuário</Title>
                {/* Formulário em coluna única */}
                <Stack gap="md">
                  <TextInput
                    label="Nome completo"
                    placeholder="Nome do usuário"
                    value={newUser.name}
                    onChange={e => { const name = e.currentTarget.value; setNewUser(p => ({ ...p, name })); setNewUserErrors(p => ({ ...p, name: undefined })); }}
                    error={newUserErrors.name}
                  />
                  <TextInput
                    label="E-mail"
                    placeholder="email@tesla.com.br"
                    value={newUser.email}
                    onChange={e => { const email = e.currentTarget.value; setNewUser(p => ({ ...p, email })); setNewUserErrors(p => ({ ...p, email: undefined })); }}
                    error={newUserErrors.email}
                  />
                  <Select
                    label="Perfil"
                    data={['Representante', 'Preposto', 'Lojista', 'Comprador', 'Admin']}
                    value={newUser.role}
                    onChange={v => v && setNewUser(p => ({ ...p, role: v }))}
                    allowDeselect={false}
                  />
                  <Select
                    label="Região"
                    data={['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte', 'Nacional']}
                    value={newUser.region}
                    onChange={v => v && setNewUser(p => ({ ...p, region: v }))}
                    allowDeselect={false}
                  />
                </Stack>
                <Group justify="flex-end" gap={8} mt="md">
                  <Button onClick={closeAddUser} variant="default">Cancelar</Button>
                  <Button onClick={createUser}>Criar usuário</Button>
                </Group>
              </Paper>
            </Collapse>
            <Table.ScrollContainer minWidth={800}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="md">
                <Table.Thead bg="var(--mantine-color-default-hover)">
                  <Table.Tr>
                    {['Nome', 'E-mail', 'Perfil', 'Região', 'Status', 'Último acesso', 'Ações'].map(col => (
                      <Table.Th key={col} c="dimmed" fz="sm" fw={600}>{col}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredUsers.map(user => (
                    <Table.Tr key={user.id}>
                      <Table.Td><UserCell name={user.name} /></Table.Td>
                      <Table.Td c="dimmed">{user.email}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={user.role === 'Admin' ? 'violet' : 'dark'}>{user.role}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed">{user.region}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="teal">{user.status}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" className="mono" fz="sm">{user.lastLogin === '—' ? '—' : formatDate(user.lastLogin)}</Table.Td>
                      <Table.Td>
                        {/* Ícone + texto; size="sm" só por estar dentro de linha de tabela */}
                        <Group gap={4} wrap="nowrap">
                          <Button variant="subtle" color="gray" size="sm" leftSection={<PencilSimpleLineIcon size={16} />} aria-label={`Editar usuário ${user.name}`}>
                            Editar
                          </Button>
                          <Button onClick={() => deleteUser(user)} variant="subtle" color="red" size="sm" leftSection={<TrashIcon size={16} />} aria-label={`Excluir usuário ${user.name}`}>
                            Excluir
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        {/* Estado vazio: explica o motivo e oferece a ação */}
                        <Stack gap="sm" align="center" py="lg">
                          <Text c="dimmed" ta="center">
                            {search
                              ? `Nenhum usuário encontrado para "${search}". Confira a grafia ou limpe a busca.`
                              : 'Nenhum usuário cadastrado. Adicione o primeiro para liberar o acesso.'}
                          </Text>
                          {search ? (
                            <Button onClick={() => setSearch('')} variant="default">Limpar busca</Button>
                          ) : (
                            <Button onClick={() => setShowAddUser(true)} variant="default" leftSection={<PlusIcon size={16} />}>Adicionar usuário</Button>
                          )}
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          {/* Usuários vinculados a representantes e lojistas */}
          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Title order={3}>Usuários vinculados</Title>
            <Text c="dimmed" size="sm" mt={4} mb="md">
              Contas registradas sob um representante ou lojista (ex.: prepostos e compradores). Cada um gerencia o perfil de acesso da própria equipe.
            </Text>
            <Table.ScrollContainer minWidth={800}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="md">
                <Table.Thead bg="var(--mantine-color-default-hover)">
                  <Table.Tr>
                    {['Usuário', 'E-mail', 'Perfil', 'Vinculado a', 'Status', 'Último acesso'].map(col => (
                      <Table.Th key={col} c="dimmed" fz="sm" fw={600}>{col}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {linkedUsers.map(user => (
                    <Table.Tr key={user.id}>
                      <Table.Td><UserCell name={user.name} /></Table.Td>
                      <Table.Td c="dimmed">{user.email}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="neutral">{user.profile}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={user.ownerType === 'representante' ? 'yellow' : 'teal'}>
                          {user.ownerType === 'representante' ? 'Rep · ' : 'Lojista · '}{user.ownerName}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={user.status === 'ativo' ? 'teal' : 'gray'}>{user.status}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" className="mono" fz="sm">{user.lastLogin === '—' ? '—' : formatDate(user.lastLogin)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Title order={3} mb="md">Informações da empresa</Title>
            {/* Formulário em coluna única */}
            <Stack gap="md">
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
                />
              ))}
            </Stack>
            <Button
              mt="lg"
              fullWidth
              onClick={() => toast.success('Dados da empresa salvos', 'Eles passam a aparecer nos próximos pedidos e boletos emitidos')}
            >
              Salvar dados da empresa
            </Button>
          </Paper>
        </Stack>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <Stack gap="md">
          {/* Visão selector */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
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
                  p="md"
                  className={`${classes.cardButton} ${active ? '' : classes.hoverable}`}
                  bd={active ? '1px solid var(--mantine-color-neutral-9)' : undefined}
                  bg={active ? 'var(--mantine-color-neutral-0)' : undefined}
                >
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon variant={active ? 'filled' : 'light'} color={active ? 'neutral' : 'gray'} size={36}>
                      <VisaoIcon size={16} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={600}>{v.label}</Text>
                      <Text c="dimmed" size="sm">{v.desc}</Text>
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
