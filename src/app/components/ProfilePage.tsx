import {
  BuildingsIcon,
  MapPinIcon,
  FileTextIcon,
  CreditCardIcon,
  UserCheckIcon,
  BellIcon,
  LockIcon,
  UsersIcon,
  TargetIcon,
  TrendUpIcon,
  StorefrontIcon,
  GearIcon,
  DatabaseIcon,
  PulseIcon,
  PackageIcon,
  TagIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { SimpleGrid, Grid, Paper, Group, Stack, Box, Text, ThemeIcon, Switch, Badge, Button, Progress } from "@mantine/core";
import interactive from "./interactive.module.css";

type Profile = 'admin' | 'rep' | 'lojista';

interface ProfilePageProps {
  profile: Profile;
}

// ---------- helpers ----------
function Section({ icon: Icon, title, description, children }: { icon: PhosphorIcon; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Paper component="section" withBorder radius="md" p={{ base: 'md', sm: 'lg' }}>
      <Group align="flex-start" gap="sm" mb="md" wrap="nowrap">
        <ThemeIcon size={36} radius="md" variant="light" color="neutral" flex="none">
          <Icon size={16} />
        </ThemeIcon>
        <Box flex={1} miw={0}>
          <Text fw={600} size="0.92rem">{title}</Text>
          {description && <Text c="dimmed" size="0.75rem" mt={2}>{description}</Text>}
        </Box>
      </Group>
      <Stack gap={0}>{children}</Stack>
    </Paper>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <Grid gutter="sm" align="flex-start" py={6} className={interactive.rowDivider}>
      {/* Rótulo acima do valor no celular; lado a lado a partir de xs */}
      <Grid.Col span={{ base: 12, xs: 4 }}>
        <Text c="dimmed" size="0.75rem">{label}</Text>
      </Grid.Col>
      <Grid.Col span={{ base: 12, xs: 8 }}>
        <Text fw={500} size="0.82rem" ff={mono ? 'monospace' : undefined}>{value}</Text>
      </Grid.Col>
    </Grid>
  );
}

function ToggleRow({ label, description, defaultChecked = false }: { label: string; description?: string; defaultChecked?: boolean }) {
  return (
    <Switch
      color="neutral"
      labelPosition="left"
      defaultChecked={defaultChecked}
      py="xs"
      styles={{ body: { justifyContent: 'space-between', alignItems: 'flex-start' }, labelWrapper: { flex: 1 } }}
      label={<Text size="0.82rem" fw={500}>{label}</Text>}
      description={description && <Text size="0.72rem" c="dimmed">{description}</Text>}
    />
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge
      color={ok ? 'green' : 'red'}
      variant="light"
      leftSection={ok ? <CheckCircleIcon size={12} /> : <XCircleIcon size={12} />}
    >
      {label}
    </Badge>
  );
}

// ---------- Lojista ----------
function LojistaProfile() {
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
      <Section icon={BuildingsIcon} title="Dados da empresa">
        <Field label="Razão social" value="Calçados Bella Moda LTDA" />
        <Field label="Nome fantasia" value="Bella Moda" />
        <Field label="CNPJ" value="12.345.678/0001-90" mono />
        <Field label="Inscrição estadual" value="123.456.789.012" mono />
      </Section>

      <Section icon={MapPinIcon} title="Endereço de entrega">
        <Field label="Logradouro" value="Av. Paulista, 1500 — Sala 802" />
        <Field label="Bairro" value="Bela Vista" />
        <Field label="Cidade / UF" value="São Paulo / SP" />
        <Field label="CEP" value="01310-100" mono />
      </Section>

      <Section icon={FileTextIcon} title="Tabela comercial vigente" description="Definida pela indústria para sua conta">
        <Field label="Tabela" value={<Badge color="neutral" variant="light">Tabela B — Verão 26</Badge>} />
        <Field label="Condição de pagamento" value="30/60/90 dias" />
        <Field label="Pedido mínimo" value="R$ 3.000,00" />
        <Field label="Frete" value="CIF acima de R$ 5.000,00" />
      </Section>

      <Section icon={CreditCardIcon} title="Situação financeira" description="Sincronizado com o ERP">
        <Field label="Limite de crédito" value="R$ 25.000,00" />
        <Field label="Utilizado" value="R$ 8.420,00" />
        <Field label="Disponível" value={<Text c="teal" span fw={500} size="0.82rem">R$ 16.580,00</Text>} />
        <Field label="Status" value={<StatusPill ok label="Adimplente" />} />
      </Section>

      <Section icon={UserCheckIcon} title="Representante responsável">
        <Field label="Nome" value="Marina Costa" />
        <Field label="Região" value="Sudeste — SP Capital" />
        <Field label="E-mail" value={<Group gap={6} wrap="nowrap"><EnvelopeIcon size={14} color="var(--mantine-color-dimmed)" />marina.costa@tesla.com.br</Group>} />
        <Field label="Telefone" value={<Group gap={6} wrap="nowrap"><PhoneIcon size={14} color="var(--mantine-color-dimmed)" />(11) 98765-4321</Group>} />
      </Section>

      <Section icon={BellIcon} title="Preferências de notificação">
        <ToggleRow label="Novidades e lançamentos" description="Avise quando novas coleções estiverem disponíveis" defaultChecked />
        <ToggleRow label="Confirmação de pedido" description="Receba um e-mail a cada pedido confirmado" defaultChecked />
        <ToggleRow label="Status de faturamento" description="Atualizações sobre boletos e notas fiscais" defaultChecked />
        <ToggleRow label="Campanhas e ofertas" description="Promoções pontuais da indústria" />
      </Section>

      <Section icon={LockIcon} title="Senha e acesso">
        <Field label="E-mail de acesso" value="compras@bellamoda.com.br" />
        <Field label="Última alteração de senha" value="há 3 meses" />
        <Button variant="default" color="neutral" size="xs" mt="sm" mr="auto">
          Alterar senha
        </Button>
      </Section>
    </SimpleGrid>
  );
}

// ---------- Representante ----------
function RepProfile() {
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
      <Section icon={UsersIcon} title="Dados pessoais">
        <Field label="Nome" value="Marina Costa" />
        <Field label="CPF" value="123.456.789-00" mono />
        <Field label="E-mail" value="marina.costa@tesla.com.br" />
        <Field label="Telefone" value="(11) 98765-4321" />
        <Field label="Região de atuação" value="Sudeste — SP Capital e Grande SP" />
      </Section>

      <Section icon={TargetIcon} title="Metas do período" description="Ciclo Verão 26 · jan–abr">
        <Field label="Meta sell-in" value="R$ 480.000,00" />
        <Field label="Realizado" value={<Text c="teal" span fw={500} size="0.82rem">R$ 312.450,00 (65%)</Text>} />
        <Field label="Faltam" value="R$ 167.550,00" />
        <Progress value={65} color="teal" size="sm" radius="xl" mt="sm" />
      </Section>

      <Section icon={StorefrontIcon} title="Carteira de lojas" description="32 lojas vinculadas">
        <SimpleGrid cols={3} spacing="xs" mb="xs">
          <Paper withBorder radius="md" p="xs" ta="center" bg="var(--mantine-color-neutral-0)">
            <Text c="teal" fw={700} size="1.1rem">24</Text>
            <Text c="dimmed" size="0.68rem">Ativas</Text>
          </Paper>
          <Paper withBorder radius="md" p="xs" ta="center" bg="var(--mantine-color-neutral-0)">
            <Text c="orange" fw={700} size="1.1rem">5</Text>
            <Text c="dimmed" size="0.68rem">Inativas</Text>
          </Paper>
          <Paper withBorder radius="md" p="xs" ta="center" bg="var(--mantine-color-neutral-0)">
            <Text c="red" fw={700} size="1.1rem">3</Text>
            <Text c="dimmed" size="0.68rem">Bloqueadas</Text>
          </Paper>
        </SimpleGrid>
        <Field label="Top cliente" value="Bella Moda — R$ 42.180,00" />
        <Field label="Cliente sem pedido há +60d" value="7 lojas" />
      </Section>

      <Section icon={TrendUpIcon} title="Indicadores e comissão">
        <Field label="Comissão acumulada (ciclo)" value="R$ 9.373,50" />
        <Field label="Taxa média" value="3,0% sobre sell-in" />
        <Field label="Ticket médio" value="R$ 4.820,00" />
        <Field label="Mix de produtos" value="68% feminino · 32% masculino" />
      </Section>

      <Section icon={BellIcon} title="Preferências de notificação">
        <ToggleRow label="Novos pedidos da carteira" description="Quando uma loja sua finalizar pedido" defaultChecked />
        <ToggleRow label="Alertas de meta" description="Avisos semanais sobre avanço de meta" defaultChecked />
        <ToggleRow label="Clientes inativos" description="Quando uma loja ficar 30d sem pedido" defaultChecked />
        <ToggleRow label="Novidades de catálogo" description="Lançamentos e reposições" />
      </Section>

      <Section icon={LockIcon} title="Senha e acesso">
        <Field label="Usuário" value="marina.costa" />
        <Field label="Última alteração de senha" value="há 1 mês" />
        <Field label="Autenticação em 2 fatores" value={<StatusPill ok label="Ativa" />} />
        <Button variant="default" color="neutral" size="xs" mt="sm" mr="auto">
          Alterar senha
        </Button>
      </Section>
    </SimpleGrid>
  );
}

// ---------- Indústria ----------
function AdminProfile() {
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
      <Section icon={BuildingsIcon} title="Dados da conta">
        <Field label="Indústria" value="Tesla Footwear" />
        <Field label="CNPJ" value="98.765.432/0001-10" mono />
        <Field label="Plano" value={<Badge color="neutral" variant="light">Enterprise</Badge>} />
        <Field label="Nível de acesso" value={<Group gap={6} wrap="nowrap"><ShieldCheckIcon size={14} color="var(--mantine-color-teal-6)" />Administrador master</Group>} />
      </Section>

      <Section icon={PackageIcon} title="Configurações de catálogo">
        <Field label="Linhas ativas" value="Feminino · Masculino · Infantil" />
        <Field label="SKUs publicados" value="1.284" />
        <Field label="Coleção corrente" value="Verão 26" />
        <Field label="Tabelas vigentes" value={<Group gap={6} wrap="nowrap"><TagIcon size={14} color="var(--mantine-color-dimmed)" />A · B · C</Group>} />
      </Section>

      <Section icon={UsersIcon} title="Usuários cadastrados">
        <SimpleGrid cols={2} spacing="xs" mb="xs">
          <Paper withBorder radius="md" p="sm">
            <Text fw={700} size="1.2rem">18</Text>
            <Text c="dimmed" size="0.72rem">Representantes</Text>
          </Paper>
          <Paper withBorder radius="md" p="sm">
            <Text fw={700} size="1.2rem">342</Text>
            <Text c="dimmed" size="0.72rem">Lojistas</Text>
          </Paper>
        </SimpleGrid>
        <Field label="Convites pendentes" value="4" />
        <Field label="Último cadastro" value="hoje, 09:14" />
      </Section>

      <Section icon={DatabaseIcon} title="Integrações ativas">
        <Field label="ERP (Senior)" value={<StatusPill ok label="Sincronizado" />} />
        <Field label="API Sell-out" value={<StatusPill ok label="Online" />} />
        <Field label="Gateway pagamento" value={<StatusPill ok label="Ativo" />} />
        <Field label="Hub de NF-e" value={<StatusPill ok={false} label="Atenção" />} />
        <Field label="Última sincronização" value="há 6 minutos" />
      </Section>

      <Section icon={PulseIcon} title="Logs de atividade" description="Últimas ações no painel">
        <Stack gap="xs">
          {[
            { who: 'marina.costa', what: 'criou pedido #4821', when: '5 min atrás' },
            { who: 'admin@tesla', what: 'atualizou Tabela B', when: '2 h atrás' },
            { who: 'paulo.ramos', what: 'cadastrou novo lojista', when: 'hoje, 08:42' },
            { who: 'sistema', what: 'sincronização ERP concluída', when: 'hoje, 06:00' },
          ].map((l, i) => (
            <Group key={i} justify="space-between" gap="sm" py={6} className={interactive.rowDivider} wrap="nowrap">
              <Box miw={0}>
                <Text component="span" fw={500} size="0.8rem">{l.who}</Text>
                <Text component="span" c="dimmed" size="0.78rem" ml={8}>{l.what}</Text>
              </Box>
              <Text c="dimmed" size="0.72rem" flex="none">{l.when}</Text>
            </Group>
          ))}
        </Stack>
      </Section>

      <Section icon={GearIcon} title="Segurança e acesso">
        <Field label="E-mail" value="admin@tesla.com.br" />
        <Field label="Última alteração de senha" value="há 14 dias" />
        <Field label="Autenticação em 2 fatores" value={<StatusPill ok label="Obrigatória" />} />
        <Field label="Sessões ativas" value="2 dispositivos" />
        <Button variant="default" color="neutral" size="xs" mt="sm" mr="auto">
          Alterar senha
        </Button>
      </Section>
    </SimpleGrid>
  );
}

export function ProfilePage({ profile }: ProfilePageProps) {
  return (
    <Box maw={1400} mx="auto" p={{ base: 'md', sm: 'lg' }}>
      {profile === 'lojista' && <LojistaProfile />}
      {profile === 'rep' && <RepProfile />}
      {profile === 'admin' && <AdminProfile />}
    </Box>
  );
}
