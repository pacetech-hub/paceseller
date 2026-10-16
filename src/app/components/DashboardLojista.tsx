import {
  Container, Stack, Group, Grid, Paper, Title, Text, Badge as MantineBadge, Progress, Tooltip,
  ColorSwatch, SimpleGrid, Table, Box, Anchor,
} from "@mantine/core";
import { LineChart } from "@mantine/charts";
import { ArrowRightIcon, CheckIcon, TrendUpIcon } from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { lineDomain } from "../lib/charts";
import { ChartSkeleton, KpiSkeleton, TableSkeleton } from "./ui/Skeletons";
import { DataTable } from "./ui/DataTable";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'stock';

interface DashboardLojistaProps {
  onNavigate: (view: View) => void;
}

const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR');
const fmt = (n: number) => n.toLocaleString('pt-BR');

// cores de destaque (tema Mantine)
const WARN = 'yellow.8';
const POS = 'teal.7';
const NEG = 'red.7';

function Card({ title, hint, span = 12, children }: { title: string; hint?: string; span?: number; children: React.ReactNode }) {
  return (
    <Grid.Col span={{ base: 12, lg: span }}>
      <Paper withBorder p={{ base: 'md', sm: 'lg' }} h="100%">
        <Title order={3}>{title}</Title>
        {hint && <Text c="dimmed" size="sm" mt={4}>{hint}</Text>}
        <Box mt="sm">{children}</Box>
      </Paper>
    </Grid.Col>
  );
}

function Tile({ lab, val, sub, tone }: { lab: string; val: string; sub?: string; tone?: 'amber' | 'neg' | 'pos' | 'muted' }) {
  const color = tone === 'amber' ? WARN : tone === 'neg' ? NEG : tone === 'pos' ? POS : undefined;
  return (
    <Paper withBorder p="sm" bg="var(--mantine-color-gray-0)">
      <Text c="dimmed" size="sm">{lab}</Text>
      {/* número-chave do bloco: tamanho xl */}
      <Text c={color} size="xl" fw={700} className="mono">{val}</Text>
      {sub && <Text c="dimmed" size="sm" mt={4}>{sub}</Text>}
    </Paper>
  );
}

function Badge({ children, tone = 'ok', icon }: { children: React.ReactNode; tone?: 'ok' | 'warn' | 'risk'; icon?: React.ReactNode }) {
  return (
    <MantineBadge variant="light" color={tone === 'ok' ? 'teal' : tone === 'risk' ? 'red' : 'yellow'} leftSection={icon} style={{ minWidth: 'max-content' }}>
      {children}
    </MantineBadge>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text c="dimmed" size="sm" fw={600}>{children}</Text>;
}

function ListItem({ title, meta, right }: { title: string; meta: string; right?: React.ReactNode }) {
  return (
    <Paper withBorder p="sm">
      <Group align="flex-start" gap="xs" wrap="nowrap">
        <ColorSwatch color="var(--mantine-color-neutral-9)" size={8} mt="xs" withShadow={false} />
        <Box flex={1}>
          <Text fw={600}>{title}</Text>
          <Text c="dimmed" size="sm">{meta}</Text>
        </Box>
        {right}
      </Group>
    </Paper>
  );
}

function StatusStack({ segs }: { segs: { n: string; q: number; color: string; action?: boolean }[] }) {
  const tot = segs.reduce((a, b) => a + b.q, 0);
  return (
    <>
      <Progress.Root size={24}>
        {segs.map(s => (
          <Tooltip key={s.n} label={`${s.n}: ${s.q} ${s.q === 1 ? 'pedido' : 'pedidos'}`}>
            <Progress.Section value={(s.q / tot) * 100} color={s.color}>
              <Progress.Label fz="sm">{s.q / tot >= 0.1 ? s.q : ''}</Progress.Label>
            </Progress.Section>
          </Tooltip>
        ))}
      </Progress.Root>
      <Group gap="sm" mt="sm">
        {segs.map(s => (
          <Group key={s.n} gap="xs" wrap="nowrap">
            <ColorSwatch color={`var(--mantine-color-${s.color.replace('.', '-')})`} size={10} withShadow={false} />
            {/* legenda com valor e participação */}
            <Text c="dimmed" size="sm">{s.n} · {s.q} ({Math.round((s.q / tot) * 100)}%)</Text>
            {s.action && <MantineBadge variant="light" color="yellow">ação</MantineBadge>}
          </Group>
        ))}
      </Group>
    </>
  );
}

// ranking sempre do maior para o menor, com a unidade ao lado do número
function Rank({ rows, unit }: { rows: { n: string; v: number }[]; unit: string }) {
  const sorted = [...rows].sort((a, b) => b.v - a.v);
  const max = Math.max(...sorted.map(r => r.v));
  return (
    <Stack gap="sm">
      {sorted.map(r => (
        <Group key={r.n} gap="sm" wrap="nowrap">
          <Text truncate flex={1}>{r.n}</Text>
          <Progress value={(r.v / max) * 100} size={6} flex={1} />
          <Text size="sm" fw={600} w={88} ta="right" className="mono">{fmt(r.v)} {unit}</Text>
        </Group>
      ))}
    </Stack>
  );
}

type StockTone = 'ok' | 'warn' | 'risk';

const recurringRows = [
  { product: 'Tênis Runner X', cadence: 'a cada 21 dias', count: '6', last: 'há 12 dias', next: 'em ~9 dias', soon: false },
  { product: 'Sandália Verão', cadence: 'a cada 30 dias', count: '4', last: 'há 18 dias', next: 'em ~12 dias', soon: false },
  { product: 'Sapatilha Flex', cadence: 'a cada 45 dias', count: '3', last: 'há 40 dias', next: 'em ~5 dias', soon: true },
];

// ordem: o que pede ação primeiro (ruptura → baixo → OK)
const stockRows: { product: string; tone: StockTone; status: string; stock: number; ruptureDays: number | string; turnover: number; value: string }[] = [
  { product: 'Tênis Runner X', tone: 'risk', status: 'Ruptura', stock: 0, ruptureDays: 6, turnover: 12, value: '—' },
  { product: 'Sandália Verão', tone: 'warn', status: 'Baixo', stock: 14, ruptureDays: '—', turnover: 15, value: brl(1190) },
  { product: 'Chinelo Soft', tone: 'warn', status: 'Baixo', stock: 9, ruptureDays: '—', turnover: 18, value: brl(405) },
  { product: 'Sapatilha Flex', tone: 'ok', status: 'OK', stock: 42, ruptureDays: '—', turnover: 22, value: brl(3360) },
  { product: 'Bota Couro', tone: 'ok', status: 'OK', stock: 28, ruptureDays: '—', turnover: 35, value: brl(4480) },
];

const histData = [
  { m: 'Fev', v: 9 }, { m: 'Mar', v: 12 }, { m: 'Abr', v: 10 },
  { m: 'Mai', v: 14 }, { m: 'Jun', v: 12 }, { m: 'Jul', v: 13 },
];

export function DashboardLojista({ onNavigate }: DashboardLojistaProps) {
  const loading = useMockLoading();
  return (
    <Container size={1400} p={{ base: 'md', sm: 'lg' }} w="100%">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start" gap="sm">
          <Box>
            <Title order={2}>Meus indicadores</Title>
            <Text c="dimmed" mt={4}>Loja Pé Quente — Gramado, RS · últimos 90 dias</Text>
          </Box>
          <Group gap="xs">
            {['Período: Últimos 90 dias', 'Coleção: Todas', 'Status: Todos'].map(c => (
              <MantineBadge key={c} variant="light" color="gray" size="lg" tt="none" fw={600} c="var(--mantine-color-text)">{c}</MantineBadge>
            ))}
          </Group>
        </Group>

        {loading ? (
          // skeleton no formato do painel: resumo/status, gráfico e tabelas
          <Stack gap="xl">
            <KpiSkeleton count={4} />
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, lg: 7 }}><ChartSkeleton height={190} /></Grid.Col>
              <Grid.Col span={{ base: 12, lg: 5 }}><TableSkeleton rows={3} cols={2} /></Grid.Col>
            </Grid>
            <TableSkeleton rows={5} cols={5} />
            <TableSkeleton rows={5} cols={6} />
          </Stack>
        ) : (<>
        {/* MEUS PEDIDOS */}
        <Stack gap="sm">
        <SectionLabel>Meus pedidos</SectionLabel>
        <Grid gutter="md">
          <Card title="Resumo do período" hint="Recência e volume da loja" span={4}>
            <Stack gap="sm">
              <Tile lab="Último pedido" val="há 11 dias" sub="6 de jul. · dentro do esperado (limite de 30 dias)" />
              <SimpleGrid cols={3} spacing="xs">
                <Tile lab="Pedidos" val="7" />
                <Tile lab="Pares" val={fmt(462)} />
                <Tile lab="Valor" val={brl(19250)} />
              </SimpleGrid>
            </Stack>
          </Card>

          <Card title="Carteira de pedidos por status" hint="Situação dos 7 pedidos do período · barra 100% empilhada" span={8}>
            <StatusStack segs={[
              { n: 'Aprovado', q: 3, color: 'neutral.9' },
              { n: 'Faturado', q: 2, color: 'neutral.6' },
              { n: 'Em transporte', q: 1, color: 'teal.6' },
              { n: 'Aguardando aprovação', q: 1, color: 'yellow.6', action: true },
            ]} />
            <SimpleGrid cols={3} spacing="xs" mt="md">
              <Tile lab="Em andamento" val="2" />
              <Tile lab="Aguardando aprovação" val="1" tone="amber" />
              <Tile lab="Faturados" val="2" />
            </SimpleGrid>
          </Card>

          <Card title="Histórico de compras" hint="Últimos 6 meses · em R$ mil" span={7}>
            <LineChart
              h={190}
              data={histData}
              dataKey="m"
              series={[{ name: 'v', label: 'Compras', color: 'neutral.9' }]}
              curveType="monotone"
              gridAxis="y"
              tickLine="none"
              // tooltip com o valor completo em reais (os dados estão em R$ mil)
              valueFormatter={v => brl(v * 1000)}
              yAxisProps={{ tickFormatter: (v: number) => `${v} mil`, domain: lineDomain }}
            />
            <Group gap={4} c={POS} mt="xs" wrap="nowrap">
              <TrendUpIcon size={16} />
              <Text c="inherit" size="sm" fw={600}>+8% jul vs jun · +44% vs fev</Text>
            </Group>
          </Card>

          <Card title="Pedidos repetidos" hint="Contados pelo botão “repetir pedido” do histórico" span={5}>
            <Text size="xl" fw={700} className="mono">4 pedidos</Text>
            <Group gap={4} c={POS} wrap="nowrap" mt={4}>
              <TrendUpIcon size={16} />
              <Text c="inherit" size="sm" fw={600}>+2 pedidos vs. período anterior</Text>
            </Group>
            <Stack gap="xs" mt="sm">
              {[
                { t: 'Pedido #2314 → repetido 2 vezes', m: 'Tênis Runner X · grade completa' },
                { t: 'Pedido #2201 → repetido 2 vezes', m: 'Sandália Verão · meia grade' },
              ].map(o => <ListItem key={o.t} title={o.t} meta={o.m} />)}
            </Stack>
          </Card>
        </Grid>
        </Stack>

        {/* RECOMPRA E PRODUTOS */}
        <Stack gap="sm">
        <SectionLabel>Recompra e produtos</SectionLabel>
        <Grid gutter="md">
          <Card title="Produtos mais comprados" hint="Mix da loja · por pares" span={5}>
            <Rank unit="pares" rows={[
              { n: 'Tênis Runner X', v: 120 }, { n: 'Sandália Verão', v: 96 },
              { n: 'Sapatilha Flex', v: 60 }, { n: 'Bota Couro', v: 48 }, { n: 'Chinelo Soft', v: 36 },
            ]} />
          </Card>

          <Card title="Compra recorrente" hint="Itens comprados com regularidade · frequência por SKU" span={7}>
            <DataTable headers={['Produto', 'Cadência', 'Compras', 'Última', 'Próxima']} numeric={['Compras']} minWidth={560}>
              {recurringRows.map(r => (
                <Table.Tr key={r.product}>
                  <Table.Td><Text fw={600}>{r.product}</Text></Table.Td>
                  <Table.Td c="dimmed">{r.cadence}</Table.Td>
                  <Table.Td ta="right" className="mono">{r.count}</Table.Td>
                  <Table.Td c="dimmed">{r.last}</Table.Td>
                  <Table.Td c={r.soon ? WARN : undefined} fw={r.soon ? 600 : undefined}>{r.next}</Table.Td>
                </Table.Tr>
              ))}
            </DataTable>
          </Card>
        </Grid>
        </Stack>

        {/* ESTOQUE E SELL-OUT */}
        <Stack gap="sm">
        <SectionLabel>Estoque e sell-out da loja</SectionLabel>
        <Grid gutter="md">
          <Card title="Sell-out" hint="Envio do dado de venda na ponta" span={3}>
            <Stack gap="sm" align="stretch">
              <Box><Badge tone="ok" icon={<CheckIcon size={16} />}>Loja participante</Badge></Box>
              <Tile lab="Giro médio do estoque" val="20 dias" sub="alerta acima de 30 dias" />
              <Tile lab="Valor em estoque" val={brl(9435)} />
              <Tile lab="SKUs em ruptura" val="1" tone="neg" />
            </Stack>
          </Card>

          <Card title="Controle de estoque" hint="Situação por SKU · ruptura, baixo, OK e valor" span={9}>
            <DataTable
              headers={['Produto', 'Situação', 'Estoque (pares)', 'Dias ruptura', 'Giro (dias)', 'Valor']}
              numeric={['Estoque (pares)', 'Dias ruptura', 'Giro (dias)', 'Valor']}
              minWidth={720}
            >
              {stockRows.map(r => (
                <Table.Tr key={r.product}>
                  <Table.Td><Text fw={600}>{r.product}</Text></Table.Td>
                  <Table.Td><Badge tone={r.tone}>{r.status}</Badge></Table.Td>
                  <Table.Td ta="right" className="mono">{fmt(r.stock)}</Table.Td>
                  <Table.Td ta="right" className="mono" c={typeof r.ruptureDays === 'number' ? WARN : 'dimmed'} fw={typeof r.ruptureDays === 'number' ? 600 : undefined}>{r.ruptureDays}</Table.Td>
                  <Table.Td ta="right" className="mono" c={r.turnover > 30 ? WARN : undefined} fw={r.turnover > 30 ? 600 : undefined}>{r.turnover}</Table.Td>
                  <Table.Td ta="right" className="mono">{r.value}</Table.Td>
                </Table.Tr>
              ))}
            </DataTable>
          </Card>
        </Grid>
        </Stack>

        {/* RECOMENDAÇÕES */}
        <Stack gap="sm">
        <SectionLabel>Recomendações</SectionLabel>
        <Grid gutter="md">
          <Card title="Sugestões para a loja" hint="Top produto da empresa + top produto da região" span={6}>
            <Stack gap="xs">
              <ListItem
                title="Tênis Runner X"
                meta="Top produto da empresa · você está em ruptura deste item"
                right={<Badge tone="warn">repor</Badge>}
              />
              <ListItem title="Bota Chelsea Couro" meta="Top produto da sua região (Serra Gaúcha) nesta coleção" />
            </Stack>
            <Box mt="sm">
              <Anchor component="button" type="button" onClick={() => onNavigate('catalog')}>
                Ir para o Catálogo <ArrowRightIcon size={16} style={{ verticalAlign: 'text-bottom' }} />
              </Anchor>
            </Box>
          </Card>

          <Card title="Lojas de perfil semelhante estão comprando" hint="Recomendação por perfil/região similar" span={6}>
            <Stack gap="xs">
              {[
                { t: 'Oxford Clássico', m: '8 lojas do seu porte compraram nos últimos 30 dias' },
                { t: 'Derby Casual Urban', m: 'recorrente em lojas da sua região' },
              ].map(x => <ListItem key={x.t} title={x.t} meta={x.m} />)}
            </Stack>
          </Card>
        </Grid>
        </Stack>
        </>)}
      </Stack>
    </Container>
  );
}
