import { useState } from "react";
import {
  Stack, Group, Box, Paper, Card, Text, Title, Button, TextInput, Select, Badge, ThemeIcon, SimpleGrid,
  Tabs, Table, Avatar, Collapse, Alert, Divider, Radio,
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
import { visoes, defaultPermissions, profileDescriptions, type VisaoKey, type PermissionsState } from "../data/permissions";
import { linkedUsers } from "../data/linkedUsers";
import { PermissionMatrixTable } from "./PermissionMatrixTable";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton, TableSkeleton } from "./ui/Skeletons";
import { CellList, CellCard, CellField } from "./ui/CellView";
import { EmptyState } from "./ui/EmptyState";
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

// Enquanto os dados "carregam", mostra o skeleton no lugar só da região de dados
// (título e barra de ferramentas continuam visíveis). Cada aba monta de novo ao ser aberta.
function DataGate({ skeleton, children }: { skeleton: React.ReactNode; children: React.ReactNode }) {
  const loading = useMockLoading();
  return <>{loading ? skeleton : children}</>;
}

// Skeleton de tabela no desktop e de lista de cartões no celular (mesmo formato do conteúdo)
function ResponsiveTableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <>
      <Box visibleFrom="sm"><TableSkeleton rows={rows} cols={cols} /></Box>
      <Box hiddenFrom="sm"><ListSkeleton rows={rows} /></Box>
    </>
  );
}

// Valor somente leitura: rótulo acima do valor, alinhado à esquerda
function InfoField({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <Box>
      <Text c="dimmed" size="sm">{label}</Text>
      {/* Dado em evidência só quando é o número-chave; os demais em peso regular */}
      <Text className={mono ? 'mono' : undefined} fw={highlight ? 600 : 400}>{value}</Text>
    </Box>
  );
}

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
      <Group gap="xs" mb={4}>
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
    <Group gap="xs">
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
    <Group gap="sm" wrap="nowrap">
      <Avatar size={32} color="neutral" variant="light">
        {initials(name)}
      </Avatar>
      <Text fw={600}>{name}</Text>
    </Group>
  );
}

// linha de configuração somente leitura: rótulo e descrição acima do valor, tudo alinhado à esquerda
function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <Paper withBorder p="md" bg="var(--mantine-color-default-hover)">
      <Stack gap="sm" align="flex-start">
        <Box>
          {/* Rótulo em peso regular: a ênfase fica no valor */}
          <Text>{label}</Text>
          <Text c="dimmed" size="sm">{desc}</Text>
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}

// Ações da linha de usuário; size="sm" só por estar dentro de linha de tabela/cartão.
// Na tabela, a coluna de ações fica alinhada à direita (inTable); no cartão, à esquerda.
function UserActions({ user, onDelete, inTable }: { user: AdminUser; onDelete: (u: AdminUser) => void; inTable?: boolean }) {
  return (
    <Group gap="sm" wrap="nowrap" justify={inTable ? 'flex-end' : undefined}>
      <Button variant="subtle" color="gray" size="sm" leftSection={<PencilSimpleLineIcon size={16} />} aria-label={`Editar usuário ${user.name}`}>
        Editar
      </Button>
      <Button onClick={() => onDelete(user)} variant="subtle" color="red" size="sm" leftSection={<TrashIcon size={16} />} aria-label={`Excluir usuário ${user.name}`}>
        Excluir
      </Button>
    </Group>
  );
}

const linkLabel = (user: typeof linkedUsers[number]) =>
  `${user.ownerType === 'representante' ? 'Rep · ' : 'Lojista · '}${user.ownerName}`;

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

// Perfis possíveis de um novo usuário (poucas opções fixas: cartões de rádio com descrição)
const roleOptions = ['Representante', 'Preposto', 'Lojista', 'Comprador', 'Admin'];

const emptyNewUser = { name: '', email: '', role: 'Representante', region: 'Sudeste' };

// Regiões mais usadas no topo da lista (mock: onde está a maior parte dos usuários e clientes)
const POPULAR_REGIONS = ['Sudeste', 'Sul'];
const ALL_REGIONS = ['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte', 'Nacional'];
// Cada valor aparece uma única vez: os populares saem do grupo "Todos"
const regionData = [
  { group: 'Mais usados', items: POPULAR_REGIONS },
  { group: 'Todos', items: ALL_REGIONS.filter(r => !POPULAR_REGIONS.includes(r)) },
];

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

  // Estado vazio: explica o motivo e oferece a ação (mesmo conteúdo na tabela e nos cartões)
  const usersEmpty = (withBorder: boolean) => search ? (
    <EmptyState
      icon={MagnifyingGlassIcon}
      title="Nenhum usuário encontrado"
      description={`Nenhum nome ou e-mail corresponde a "${search}". Confira a grafia ou limpe a busca para ver todos.`}
      action={{ label: 'Limpar Busca', onClick: () => setSearch(''), forward: false }}
      withBorder={withBorder}
    />
  ) : (
    <EmptyState
      icon={UsersIcon}
      title="Nenhum usuário cadastrado"
      description="Adicione o primeiro usuário para liberar o acesso ao PaceSeller."
      action={showAddUser ? undefined : { label: 'Adicionar Usuário', onClick: () => setShowAddUser(true), forward: false }}
      withBorder={withBorder}
    />
  );

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
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
          <DataGate skeleton={<ListSkeleton rows={4} withAvatar={false} />}>
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
                {/* Resumo em coluna única: rótulo acima do valor, leitura pela borda esquerda */}
                <Stack gap="md" mb="md">
                  <InfoField label="Desconto" value={policy.discount} highlight />
                  <InfoField label="Pedido mínimo" value={policy.minOrder} mono highlight />
                  <InfoField label="Pagamento" value={policy.payment} />
                </Stack>
                <Text c="dimmed" size="sm">
                  <Text span fw={600} c="var(--mantine-color-text)" inherit>{policy.clients}</Text> clientes nesta política
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
          </DataGate>
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
                Voltar para Políticas
              </Button>
            </Box>

            <ErpSyncNotice text="Esta política é somente leitura — a regra ativa vem do ERP da Tesla." />

            <DataGate skeleton={<Stack gap="lg"><ListSkeleton rows={4} withAvatar={false} /><ResponsiveTableSkeleton rows={4} cols={3} /></Stack>}>
            <Stack gap="lg">
            {/* Identidade */}
            <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
              <Box mb="md">
                <Title order={1} mb={4}>{policy.name}</Title>
                <Text c="dimmed" size="sm">Configuração da política comercial</Text>
              </Box>
              {/* Dados da política em coluna única, rótulo acima do valor */}
              <Stack gap="md">
                <InfoField label="Desconto" value={policy.discount} highlight />
                <InfoField label="Pedido mínimo" value={policy.minOrder} mono highlight />
                <InfoField label="Pagamento" value={policy.payment} />
                <InfoField label="Clientes cobertos" value={`${policy.clients} lojistas`} />
              </Stack>
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
              {/* Até 6 colunas: tabela a partir de sm, cartões no celular */}
              <Box visibleFrom="sm">
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
              </Box>
              <Box hiddenFrom="sm" p="md">
                <CellList>
                  {covered.map(c => (
                    <CellCard key={c.name} title={c.name}>
                      <CellField label="Cidade/UF">{c.city}</CellField>
                      <CellField label="Representante">{c.rep}</CellField>
                    </CellCard>
                  ))}
                </CellList>
              </Box>
            </Card>
            </Stack>
            </DataGate>
          </Stack>
        );
      })()}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <Stack gap="lg">
          <ErpSyncNotice text="Políticas são somente leitura neste momento — os valores exibidos refletem as regras vigentes no ERP da Tesla." />
          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Title order={3} mb="md">Configurações de aprovação</Title>
            <DataGate skeleton={<ListSkeleton rows={3} withAvatar={false} />}>
            <Stack gap="md">
              {[
                { label: 'Aprovação automática até', desc: 'Pedidos abaixo deste valor são aprovados automaticamente', value: 'R$ 5.000' },
                { label: 'Prazo de aprovação', desc: 'Tempo máximo para aprovação manual de pedidos', value: '48 horas' },
                { label: 'Desconto máximo por rep', desc: 'Desconto máximo que um representante pode conceder', value: '15%' },
              ].map(setting => (
                <SettingRow key={setting.label} label={setting.label} desc={setting.desc}>
                  <Text className="mono" fw={600}>{setting.value}</Text>
                </SettingRow>
              ))}
            </Stack>
            </DataGate>
          </Paper>

          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Title order={3} mb={4}>Inadimplência</Title>
            <Text c="dimmed" size="sm" mb="md">Define o comportamento do sistema para clientes com pagamentos em atraso.</Text>
            <DataGate skeleton={<ListSkeleton rows={1} withAvatar={false} />}>
            <SettingRow label="Clientes inadimplentes" desc="Condição de pagamento aplicada automaticamente a clientes com débitos em aberto">
              <Paper withBorder px="sm" py="xs">
                <Text fw={600}>Apenas pagamento à vista</Text>
              </Paper>
            </SettingRow>
            </DataGate>
          </Paper>
        </Stack>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Stack gap="lg">
          {/* Usuários */}
          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Group justify="space-between" mb="md" gap="sm">
              <Title order={3}>Usuários</Title>
              <Group gap="sm">
                <TextInput
                  placeholder="Buscar por nome ou e-mail"
                  leftSection={<MagnifyingGlassIcon size={16} />}
                  value={search}
                  onChange={e => setSearch(e.currentTarget.value)}
                  aria-label="Buscar usuário"
                />
                {/* Abre o formulário: ação secundária (a principal é "Criar Usuário", dentro dele) */}
                <Button onClick={() => (showAddUser ? closeAddUser() : setShowAddUser(true))} variant="default" leftSection={<PlusIcon size={16} />}>
                  Adicionar Usuário
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
                    placeholder="ex.: Maria Silva"
                    maxLength={100}
                    value={newUser.name}
                    onChange={e => { const name = e.currentTarget.value; setNewUser(p => ({ ...p, name })); setNewUserErrors(p => ({ ...p, name: undefined })); }}
                    error={newUserErrors.name}
                  />
                  <TextInput
                    label="E-mail"
                    placeholder="nome@tesla.com.br"
                    value={newUser.email}
                    onChange={e => { const email = e.currentTarget.value; setNewUser(p => ({ ...p, email })); setNewUserErrors(p => ({ ...p, email: undefined })); }}
                    error={newUserErrors.email}
                  />
                  <Radio.Group
                    label="Perfil"
                    name="new-user-role"
                    value={newUser.role}
                    onChange={v => setNewUser(p => ({ ...p, role: v }))}
                  >
                    <Stack gap="xs">
                      {roleOptions.map(role => (
                        <Radio.Card key={role} value={role} p="sm" className={classes.choiceCard}>
                          {/* Rádio alinhado à primeira linha do texto */}
                          <Group align="flex-start" gap="sm" wrap="nowrap">
                            <Radio.Indicator color="neutral" mt={2} />
                            <Box flex={1} miw={0}>
                              <Text fw={600}>{role}</Text>
                              <Text c="dimmed" size="sm">{profileDescriptions[role]}</Text>
                            </Box>
                          </Group>
                        </Radio.Card>
                      ))}
                    </Stack>
                  </Radio.Group>
                  <Select
                    label="Região"
                    data={regionData}
                    value={newUser.region}
                    onChange={v => v && setNewUser(p => ({ ...p, region: v }))}
                    allowDeselect={false}
                  />
                </Stack>
                <Group justify="flex-end" gap="sm" mt="md">
                  <Button onClick={closeAddUser} variant="default">Cancelar</Button>
                  <Button onClick={createUser}>Criar Usuário</Button>
                </Group>
              </Paper>
            </Collapse>
            <DataGate skeleton={<ResponsiveTableSkeleton cols={6} />}>
            {/* Tabela a partir de sm (Ações vão para o rodapé do cartão no celular) */}
            <Box visibleFrom="sm">
            <Table.ScrollContainer minWidth={800}>
              <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="md">
                <Table.Thead bg="var(--mantine-color-default-hover)">
                  <Table.Tr>
                    {['Nome', 'E-mail', 'Perfil', 'Região', 'Status', 'Último acesso', 'Ações'].map(col => (
                      <Table.Th key={col} c="dimmed" fz="sm" fw={600} ta={col === 'Ações' ? 'right' : undefined}>{col}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredUsers.map(user => (
                    <Table.Tr key={user.id}>
                      <Table.Td><UserCell name={user.name} /></Table.Td>
                      <Table.Td c="dimmed">{user.email}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="neutral">{user.role}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed">{user.region}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="teal">{user.status}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" className="mono" fz="sm">{user.lastLogin === '—' ? '—' : formatDate(user.lastLogin)}</Table.Td>
                      <Table.Td ta="right">
                        <UserActions user={user} onDelete={deleteUser} inTable />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={7}>{usersEmpty(false)}</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            </Box>
            <CellList>
              {filteredUsers.map(user => (
                <CellCard
                  key={user.id}
                  title={user.name}
                  aside={<Badge variant="light" color="teal">{user.status}</Badge>}
                  actions={<UserActions user={user} onDelete={deleteUser} />}
                >
                  <CellField label="E-mail">{user.email}</CellField>
                  <CellField label="Perfil"><Badge variant="light" color="neutral">{user.role}</Badge></CellField>
                  <CellField label="Região">{user.region}</CellField>
                  <CellField label="Último acesso">
                    <Text span className="mono" inherit>{user.lastLogin === '—' ? '—' : formatDate(user.lastLogin)}</Text>
                  </CellField>
                </CellCard>
              ))}
              {filteredUsers.length === 0 && usersEmpty(true)}
            </CellList>
            </DataGate>
          </Paper>

          {/* Usuários vinculados a representantes e lojistas */}
          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Title order={3}>Usuários vinculados</Title>
            <Text c="dimmed" size="sm" mt={4} mb="md">
              Contas registradas sob um representante ou lojista (ex.: prepostos e compradores). Cada um gerencia o perfil de acesso da própria equipe.
            </Text>
            <DataGate skeleton={<ResponsiveTableSkeleton cols={6} />}>
            {/* 6 colunas: tabela a partir de sm, cartões no celular */}
            <Box visibleFrom="sm">
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
                        {/* Vínculo não é status: neutro */}
                        <Badge variant="light" color="neutral">{linkLabel(user)}</Badge>
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
            </Box>
            <CellList>
              {linkedUsers.map(user => (
                <CellCard
                  key={user.id}
                  title={user.name}
                  aside={<Badge variant="light" color={user.status === 'ativo' ? 'teal' : 'gray'}>{user.status}</Badge>}
                >
                  <CellField label="E-mail">{user.email}</CellField>
                  <CellField label="Perfil"><Badge variant="light" color="neutral">{user.profile}</Badge></CellField>
                  <CellField label="Vinculado a">{linkLabel(user)}</CellField>
                  <CellField label="Último acesso">
                    <Text span className="mono" inherit>{user.lastLogin === '—' ? '—' : formatDate(user.lastLogin)}</Text>
                  </CellField>
                </CellCard>
              ))}
            </CellList>
            </DataGate>
          </Paper>

          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Title order={3} mb="md">Informações da empresa</Title>
            {/* Formulário em coluna única */}
            <Stack gap="md">
              {[
                { label: 'Nome da empresa', value: 'Tesla Footwear Indústria LTDA', placeholder: 'ex.: Tesla Footwear Indústria LTDA', maxLength: 120 },
                { label: 'CNPJ', value: '12.345.678/0001-90', placeholder: '00.000.000/0000-00', maxLength: 18 },
                { label: 'Website', value: 'teslafootwear.com.br', placeholder: 'ex.: suaempresa.com.br' },
                { label: 'E-mail de suporte', value: 'suporte@tesla.com.br', placeholder: 'nome@empresa.com.br', description: 'Aparece nos pedidos e boletos como contato para dúvidas' },
              ].map(field => (
                <TextInput
                  key={field.label}
                  label={field.label}
                  defaultValue={field.value}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  description={field.description}
                />
              ))}
            </Stack>
            {/* Painel largo: botão na largura natural, à direita (largura total só no celular) */}
            <Group justify="flex-end" mt="lg">
              <Button
                w={{ base: '100%', sm: 'auto' }}
                onClick={() => toast.success('Dados da empresa salvos', 'Eles passam a aparecer nos próximos pedidos e boletos emitidos')}
              >
                Salvar Dados da Empresa
              </Button>
            </Group>
          </Paper>
        </Stack>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <Stack gap="lg">
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
                  // Selecionado: borda forte e fundo tingido, ambos ajustados para o modo escuro
                  bd={active ? '1px solid light-dark(var(--mantine-color-neutral-9), var(--mantine-color-dark-0))' : undefined}
                  bg={active ? 'light-dark(var(--mantine-color-neutral-0), var(--mantine-color-dark-5))' : undefined}
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
