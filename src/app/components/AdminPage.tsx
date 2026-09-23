import React, { useState, useMemo } from "react";
import { Box, Button, Center, Grid, Group, NativeSelect, Paper, SimpleGrid, Stack, Table, Text, TextInput, Title, Badge, UnstyledButton } from "@mantine/core";
import { Users, Boxes, Tag, Settings, Shield, Plus, Edit3, Trash2, Search, ChevronRight, ArrowLeft, Info, MapPin, UserCircle2, Layers, Package, Lock, Building2, Briefcase, Store, PlugZap } from "lucide-react";

import { clients, formatDate } from "../data/mockData";
import { visoes, profileDescriptions, defaultPermissions, type VisaoKey, type PermissionsState } from "../data/permissions";
import { linkedUsers } from "../data/linkedUsers";
import { PermissionMatrixTable } from "./PermissionMatrixTable";
import { IndustryStockTable } from "./IndustryStockTable";
import { ClientStockTab } from "./ClientStockTab";
import classes from "./AdminPage.module.css";

const tabs = [
  { id: 'industry-stock', label: 'Estoque Industrial', icon: Boxes },
  { id: 'client-stock', label: 'Estoque do Cliente', icon: Store },
  { id: 'pricing', label: 'Campanhas Comerciais', icon: Tag },
  { id: 'policies', label: 'Políticas', icon: Lock },
  { id: 'permissions', label: 'Permissões', icon: Shield },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

function ErpSyncNotice({ text }: { text: string }) {
  return (
    <Group
      align="flex-start"
      gap={10}
      wrap="nowrap"
      p={14}
      bg="gray.0"
      style={{ borderRadius: 'var(--mantine-radius-lg)', border: '1px solid var(--mantine-color-gray-2)' }}
    >
      <PlugZap size={16} color="var(--mantine-color-gray-9)" style={{ flexShrink: 0, marginTop: 2 }} />
      <Text size="0.78rem" lh={1.55}>{text}</Text>
    </Group>
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

const searchInputStyles = {
  input: { fontSize: '0.82rem', backgroundColor: 'var(--mantine-color-gray-0)' },
};

const formInputStyles = {
  label: { fontSize: '0.75rem', fontWeight: 400, color: 'var(--mantine-color-dimmed)', marginBottom: 4 },
  input: { fontSize: '0.82rem', backgroundColor: 'var(--mantine-color-gray-0)' },
};

const pillProps = {
  variant: 'light' as const,
  radius: 'xl' as const,
  tt: 'none' as const,
  h: 'auto',
  px: 8,
  py: 2,
  fz: '0.65rem',
  fw: 600,
};

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

  return (
    <Stack gap={20} p="lg" maw={1400} mx="auto" w="100%">
      {/* Tab bar */}
      <Paper withBorder radius="lg" p={4}>
        <Group gap={4} wrap="nowrap" style={{ overflowX: 'auto' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <UnstyledButton
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={classes.tab}
                data-active={activeTab === tab.id || undefined}
                style={{ fontWeight: activeTab === tab.id ? 600 : 400 }}
              >
                <Icon size={14} />
                {tab.label}
              </UnstyledButton>
            );
          })}
        </Group>
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
          <Group justify="space-between">
            <Text c="dimmed" size="0.85rem">Políticas de preço ativas</Text>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {pricePolicies.map(policy => (
              <UnstyledButton
                key={policy.id}
                onClick={() => setSelectedPolicyId(policy.id)}
                className={classes.policyCard}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
                  <Title order={3} size="0.9rem" fw={600}>{policy.name}</Title>
                  <ChevronRight size={14} color="var(--mantine-color-dimmed)" />
                </Group>
                <SimpleGrid cols={3} spacing="sm" mb="sm">
                  {[
                    { label: 'Desconto', value: policy.discount, highlight: true },
                    { label: 'Pedido mín.', value: policy.minOrder, mono: true },
                    { label: 'Pagamento', value: policy.payment },
                  ].map(detail => (
                    <div key={detail.label}>
                      <Text c="dimmed" size="0.7rem">{detail.label}</Text>
                      <Text
                        c={detail.highlight ? 'gray.9' : undefined}
                        size="0.85rem"
                        fw={detail.highlight ? 700 : 500}
                        style={detail.mono ? { fontVariantNumeric: 'tabular-nums' } : undefined}
                      >
                        {detail.value}
                      </Text>
                    </div>
                  ))}
                </SimpleGrid>
                <Text c="dimmed" size="0.72rem">
                  <Text span fw={600} c="var(--mantine-color-text)" inherit>{policy.clients}</Text> clientes nesta política
                </Text>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </Stack>
      )}

      {activeTab === 'pricing' && selectedPolicyId && (() => {
        const policy = pricePolicies.find(p => p.id === selectedPolicyId)!;
        const criteria = criteriaState[selectedPolicyId] ?? { clients: [], regions: [], reps: [], lines: [], products: [] };
        const covered = selectedPolicyId === 'P002' ? coveredClientsMock : coveredClientsMock.slice(0, Math.min(policy.clients, coveredClientsMock.length));

        const Section = ({ icon: Icon, title, hint, children }: any) => (
          <Paper withBorder radius="lg" p={20}>
            <Group gap="xs" mb={4} wrap="nowrap">
              <Icon size={14} color="var(--mantine-color-gray-9)" />
              <Title order={4} size="0.85rem" fw={600}>{title}</Title>
            </Group>
            {hint && <Text c="dimmed" mb="sm" size="0.72rem">{hint}</Text>}
            <Box mt="sm">{children}</Box>
          </Paper>
        );

        const Chips = ({ items }: { items: string[] }) => (
          <Group gap={6}>
            {items.length === 0 && <Text span c="dimmed" size="0.75rem">Nenhum item nesta condição</Text>}
            {items.map(v => (
              <Badge
                key={v}
                variant="light"
                color="gray"
                radius="xl"
                tt="none"
                c="gray.9"
                bg="gray.1"
                h="auto"
                px={10}
                py={4}
                fz="0.75rem"
                fw={500}
                style={{ border: '1px solid var(--mantine-color-gray-3)' }}
              >
                {v}
              </Badge>
            ))}
          </Group>
        );

        return (
          <Stack gap={20}>
            <Box>
              <UnstyledButton onClick={() => setSelectedPolicyId(null)} className={classes.backLink}>
                <ArrowLeft size={14} /> Voltar para políticas
              </UnstyledButton>
            </Box>

            <ErpSyncNotice text="Esta política é somente leitura — a regra ativa vem do ERP da Tesla." />

            {/* Identidade */}
            <Paper withBorder radius="lg" p={20}>
              <Box mb="md">
                <Title order={2} mb={4} size="1.15rem" fw={700}>{policy.name}</Title>
                <Text c="dimmed" size="0.78rem">Configuração da política comercial</Text>
              </Box>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                {[
                  { label: 'Desconto', value: policy.discount, highlight: true },
                  { label: 'Pedido mínimo', value: policy.minOrder, mono: true },
                  { label: 'Pagamento', value: policy.payment },
                  { label: 'Clientes cobertos', value: String(policy.clients) },
                ].map(d => (
                  <Box key={d.label} bg="gray.0" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                    <Text c="dimmed" mb={4} size="0.7rem" tt="uppercase" lts="0.05em">{d.label}</Text>
                    <Text
                      c={d.highlight ? 'gray.9' : undefined}
                      size="1rem"
                      fw={d.highlight ? 700 : 600}
                      style={d.mono ? { fontVariantNumeric: 'tabular-nums' } : undefined}
                    >
                      {d.value}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Paper>

            {/* Aviso precedência */}
            <Group
              align="flex-start"
              gap={10}
              wrap="nowrap"
              p={14}
              bg="yellow.0"
              style={{ borderRadius: 'var(--mantine-radius-lg)', border: '1px solid var(--mantine-color-yellow-3)' }}
            >
              <Info size={16} color="var(--mantine-color-yellow-7)" style={{ flexShrink: 0, marginTop: 2 }} />
              <Text size="0.78rem" lh={1.55}>
                <Text span fw={600} inherit>Precedência:</Text> critérios mais específicos sobrepõem os mais amplos.
                Clientes específicos &gt; Representantes &gt; Regiões. Produtos específicos &gt; Linhas de produto.
              </Text>
            </Group>

            {/* Critérios */}
            <div>
              <Title order={3} mb="sm" size="0.95rem" fw={600}>Critérios de aplicação</Title>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Section icon={UserCircle2} title="Clientes específicos" hint="Lojistas vinculados diretamente. Sobrepõe qualquer outro critério.">
                    <Chips items={criteria.clients} />
                  </Section>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Section icon={MapPin} title="Regiões" hint="Vale para todos os clientes da região.">
                    <Chips items={criteria.regions} />
                  </Section>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Section icon={Users} title="Representantes" hint="Aplica a toda a carteira do rep.">
                    <Chips items={criteria.reps} />
                  </Section>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Section icon={Layers} title="Linhas de produto" hint="A política se aplica apenas a estas linhas.">
                    <Chips items={criteria.lines} />
                  </Section>
                </Grid.Col>

                <Grid.Col span={12}>
                  <Section icon={Package} title="Produtos específicos (SKU)" hint="Granularidade por SKU. Se vazio, vale para todas as linhas marcadas acima.">
                    <Chips items={criteria.products} />
                  </Section>
                </Grid.Col>
              </Grid>
            </div>

            {/* Clientes cobertos */}
            <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
              <Box p={20} style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                <Title order={3} size="0.95rem" fw={600}>Clientes cobertos</Title>
                <Text c="dimmed" mt={4} size="0.75rem">
                  Resultado consolidado dos critérios acima · {policy.clients} lojistas · somente leitura
                </Text>
              </Box>
              <Table highlightOnHover highlightOnHoverColor="gray.0" horizontalSpacing="md" verticalSpacing={12} borderColor="gray.2">
                <Table.Thead>
                  <Table.Tr bg="gray.0">
                    {['Lojista', 'Cidade/UF', 'Representante'].map(c => (
                      <Table.Th key={c} py={10} c="dimmed" fz="0.7rem" fw={500} tt="uppercase" lts="0.05em">{c}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {covered.map(c => (
                    <Table.Tr key={c.name}>
                      <Table.Td fz="0.82rem" fw={500}>{c.name}</Table.Td>
                      <Table.Td c="dimmed" fz="0.78rem">{c.city}</Table.Td>
                      <Table.Td c="dimmed" fz="0.78rem">{c.rep}</Table.Td>
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
          <Paper withBorder radius="lg" p={20}>
            <Title order={3} mb="md" size="1rem" fw={600}>Configurações de aprovação</Title>
            <Stack gap="md">
              {[
                { label: 'Aprovação automática até', desc: 'Pedidos abaixo deste valor são aprovados automaticamente', value: 'R$ 5.000' },
                { label: 'Prazo de aprovação', desc: 'Tempo máximo para aprovação manual de pedidos', value: '48 horas' },
                { label: 'Desconto máximo por rep', desc: 'Desconto máximo que um representante pode conceder', value: '15%' },
              ].map(setting => (
                <Group
                  key={setting.label}
                  justify="space-between"
                  wrap="nowrap"
                  p="md"
                  bg="gray.0"
                  style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-2)' }}
                >
                  <div>
                    <Text size="0.85rem" fw={500}>{setting.label}</Text>
                    <Text c="dimmed" size="0.75rem">{setting.desc}</Text>
                  </div>
                  <Text span c="gray.9" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{setting.value}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>

          <Paper withBorder radius="lg" p={20}>
            <Title order={3} mb={4} size="1rem" fw={600}>Inadimplência</Title>
            <Text c="dimmed" mb="md" size="0.78rem">Define o comportamento do sistema para clientes com pagamentos em atraso.</Text>
            <Group
              justify="space-between"
              wrap="nowrap"
              p="md"
              bg="gray.0"
              style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-2)' }}
            >
              <div>
                <Text size="0.85rem" fw={500}>Clientes inadimplentes</Text>
                <Text c="dimmed" size="0.75rem">Condição de pagamento aplicada automaticamente a clientes com débitos em aberto</Text>
              </div>
              <Text
                span
                px="sm"
                py={8}
                bg="gray.1"
                size="0.82rem"
                fw={500}
                style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-3)' }}
              >
                Apenas pagamento à vista
              </Text>
            </Group>
          </Paper>

        </Stack>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Stack gap="md">
          {/* Usuários */}
          <Paper withBorder radius="lg" p={20}>
            <Group justify="space-between" mb="md" gap="sm">
              <Title order={3} size="1rem" fw={600}>Usuários</Title>
              <Group gap={8}>
                <TextInput
                  type="text"
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  size="xs"
                  leftSection={<Search size={14} />}
                  styles={searchInputStyles}
                />
                <Button
                  onClick={() => setShowAddUser(!showAddUser)}
                  size="xs"
                  px="sm"
                  fz="0.82rem"
                  fw={600}
                  leftSection={<Plus size={14} />}
                  styles={{ section: { marginInlineEnd: 6 } }}
                >
                  Novo usuário
                </Button>
              </Group>
            </Group>
            {showAddUser && (
              <Stack
                gap="sm"
                bg="gray.0"
                p="md"
                mb="md"
                style={{ borderRadius: 'var(--mantine-radius-lg)', border: '1px solid var(--mantine-color-gray-4)' }}
              >
                <Title order={4} size="0.88rem" fw={600}>Adicionar usuário</Title>
                <SimpleGrid cols={2} spacing="sm">
                  {[
                    { label: 'Nome completo', placeholder: 'Nome do usuário' },
                    { label: 'E-mail', placeholder: 'email@tesla.com.br' },
                  ].map(field => (
                    <TextInput key={field.label} type="text" label={field.label} placeholder={field.placeholder} styles={formInputStyles} />
                  ))}
                  <NativeSelect
                    label="Perfil"
                    data={['Representante', 'Preposto', 'Lojista', 'Comprador', 'Admin']}
                    styles={formInputStyles}
                  />
                  <NativeSelect
                    label="Região"
                    data={['Sudeste', 'Sul', 'Nordeste', 'Centro-Oeste', 'Norte', 'Nacional']}
                    styles={formInputStyles}
                  />
                </SimpleGrid>
                <Group gap={8} justify="flex-end">
                  <Button onClick={() => setShowAddUser(false)} variant="default" c="dimmed" size="xs" px="sm" fz="0.82rem" fw={400}>Cancelar</Button>
                  <Button onClick={() => setShowAddUser(false)} size="xs" px="sm" fz="0.82rem" fw={600}>Criar usuário</Button>
                </Group>
              </Stack>
            )}
            <Table.ScrollContainer minWidth={0}>
              <Table highlightOnHover highlightOnHoverColor="gray.0" horizontalSpacing="md" verticalSpacing={12} borderColor="gray.2">
                <Table.Thead>
                  <Table.Tr bg="gray.0">
                    {['Nome', 'E-mail', 'Perfil', 'Região', 'Status', 'Último acesso', ''].map(col => (
                      <Table.Th key={col} c="dimmed" fz="0.72rem" fw={500}>{col}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {mockUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map(user => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Group gap={10} wrap="nowrap">
                          <Center w={28} h={28} bg="gray.2" style={{ borderRadius: '50%', flexShrink: 0 }}>
                            <Text span c="gray.9" size="0.62rem" fw={700}>{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
                          </Center>
                          <Text span size="0.82rem" fw={500}>{user.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td c="dimmed" fz="0.78rem">{user.email}</Table.Td>
                      <Table.Td>
                        <Badge {...pillProps} color={user.role === 'Admin' ? 'violet' : 'dark'}>{user.role}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" fz="0.78rem">{user.region}</Table.Td>
                      <Table.Td>
                        <Badge {...pillProps} color="teal">{user.status}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" fz="0.75rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDate(user.lastLogin)}</Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <UnstyledButton className={classes.iconBtn}><Edit3 size={14} /></UnstyledButton>
                          <UnstyledButton className={classes.dangerBtn}><Trash2 size={14} /></UnstyledButton>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          {/* Usuários vinculados a representantes e lojistas */}
          <Paper withBorder radius="lg" p={20}>
            <Title order={3} size="1rem" fw={600}>Usuários vinculados</Title>
            <Text c="dimmed" mt={4} mb="md" size="0.78rem">
              Contas registradas sob um representante ou lojista (ex.: prepostos e compradores). Cada um gerencia o perfil de acesso da própria equipe.
            </Text>
            <Table.ScrollContainer minWidth={0}>
              <Table highlightOnHover highlightOnHoverColor="gray.0" horizontalSpacing="md" verticalSpacing={12} borderColor="gray.2">
                <Table.Thead>
                  <Table.Tr bg="gray.0">
                    {['Usuário', 'E-mail', 'Perfil', 'Vinculado a', 'Status', 'Último acesso'].map(col => (
                      <Table.Th key={col} c="dimmed" fz="0.72rem" fw={500}>{col}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {linkedUsers.map(user => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Group gap={10} wrap="nowrap">
                          <Center w={28} h={28} bg="gray.2" style={{ borderRadius: '50%', flexShrink: 0 }}>
                            <Text span c="gray.9" size="0.62rem" fw={700}>{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
                          </Center>
                          <Text span size="0.82rem" fw={500}>{user.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td c="dimmed" fz="0.78rem">{user.email}</Table.Td>
                      <Table.Td>
                        <Badge {...pillProps} color="gray" c="gray.9">{user.profile}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge {...pillProps} color={user.ownerType === 'representante' ? 'yellow' : 'teal'}>
                          {user.ownerType === 'representante' ? 'Rep · ' : 'Lojista · '}{user.ownerName}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge {...pillProps} color={user.status === 'ativo' ? 'teal' : 'gray'} c={user.status === 'ativo' ? undefined : 'dimmed'}>{user.status}</Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" fz="0.75rem" style={{ fontVariantNumeric: 'tabular-nums' }}>{user.lastLogin === '—' ? '—' : formatDate(user.lastLogin)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          <Paper withBorder radius="lg" p={20}>
            <Title order={3} mb="md" size="1rem" fw={600}>Informações da empresa</Title>
            <SimpleGrid cols={2} spacing="md">
              {[
                { label: 'Nome da empresa', value: 'Tesla Footwear Indústria LTDA' },
                { label: 'CNPJ', value: '12.345.678/0001-90' },
                { label: 'Website', value: 'teslafootwear.com.br' },
                { label: 'Suporte', value: 'suporte@tesla.com.br' },
              ].map(field => (
                <TextInput
                  key={field.label}
                  type="text"
                  label={field.label}
                  defaultValue={field.value}
                  styles={{ ...formInputStyles, input: { ...formInputStyles.input, fontSize: '0.85rem' } }}
                />
              ))}
            </SimpleGrid>
            <Button mt="md" size="sm" px="md" fz="0.82rem" fw={600}>
              Salvar alterações
            </Button>
          </Paper>

        </Stack>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <Stack gap="md">
          {/* Visão selector */}
          <SimpleGrid cols={3} spacing="sm">
            {visoes.map(v => {
              const Icon = v.icon;
              const active = activeView === v.id;
              return (
                <UnstyledButton
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={classes.viewCard}
                  data-active={active || undefined}
                >
                  <Center w={36} h={36} bg={active ? 'gray.2' : 'gray.1'} style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}>
                    <Icon size={16} color={active ? 'var(--mantine-color-gray-9)' : 'var(--mantine-color-dimmed)'} />
                  </Center>
                  <div>
                    <Text c={active ? 'gray.9' : undefined} size="0.85rem" fw={600}>{v.label}</Text>
                    <Text c="dimmed" size="0.72rem">{v.desc}</Text>
                  </div>
                </UnstyledButton>
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
