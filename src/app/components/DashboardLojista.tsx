import {
  Container, Stack, Group, Grid, Paper, Title, Text, Badge as MantineBadge, Progress, Tooltip,
  ColorSwatch, SimpleGrid, Table, Box, Button,
} from "@mantine/core";
import { LineChart } from "@mantine/charts";
import { CaretRightIcon } from "@phosphor-icons/react";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'stock';

interface DashboardLojistaProps {
  onNavigate: (view: View) => void;
}

const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR');
const fmt = (n: number) => n.toLocaleString('pt-BR');

// cores de destaque (tema Mantine)
const WARN = 'yellow.8';
const POS = 'teal.7';

function Card({ title, hint, span = 12, children }: { title: string; hint?: string; span?: number; children: React.ReactNode }) {
  return (
    <Grid.Col span={{ base: 12, lg: span }}>
      <Paper withBorder radius="lg" p="lg" h="100%">
        <Title order={3} size="0.9rem" fw={600}>{title}</Title>
        {hint && <Text c="dimmed" size="0.72rem" mt={4}>{hint}</Text>}
        <Box mt="sm">{children}</Box>
      </Paper>
    </Grid.Col>
  );
}

function Tile({ lab, val, sub, tone }: { lab: string; val: string; sub?: string; tone?: 'amber' | 'neg' | 'pos' | 'muted' }) {
  const color = tone === 'amber' || tone === 'neg' ? WARN : tone === 'pos' ? POS : undefined;
  return (
    <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-gray-0)">
      <Text c="dimmed" size="0.72rem" fw={500}>{lab}</Text>
      <Text c={color} size="1.1rem" fw={700} style={{ letterSpacing: '-0.02em' }}>{val}</Text>
      {sub && <Text c="dimmed" size="0.68rem" mt={2}>{sub}</Text>}
    </Paper>
  );
}

function Badge({ children, tone = 'ok' }: { children: React.ReactNode; tone?: 'ok' | 'warn' | 'risk' }) {
  return (
    <MantineBadge variant="light" color={tone === 'ok' ? 'teal' : 'yellow'} size="sm" tt="none">
      {children}
    </MantineBadge>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text c="dimmed" size="0.7rem" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>{children}</Text>;
}

function ListItem({ title, meta, right }: { title: string; meta: string; right?: React.ReactNode }) {
  return (
    <Paper withBorder radius="md" p="sm">
      <Group align="flex-start" gap="xs" wrap="nowrap">
        <ColorSwatch color="var(--mantine-color-neutral-9)" size={8} mt={6} withShadow={false} />
        <Box style={{ flex: 1 }}>
          <Text size="0.8rem" fw={500}>{title}</Text>
          <Text c="dimmed" size="0.72rem">{meta}</Text>
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
      <Progress.Root size={24} radius="sm">
        {segs.map(s => (
          <Tooltip key={s.n} label={`${s.n}: ${s.q}`} withArrow>
            <Progress.Section value={(s.q / tot) * 100} color={s.color}>
              <Progress.Label fz="0.7rem">{s.q / tot >= 0.1 ? s.q : ''}</Progress.Label>
            </Progress.Section>
          </Tooltip>
        ))}
      </Progress.Root>
      <Group gap="sm" mt="sm">
        {segs.map(s => (
          <Group key={s.n} gap={6} wrap="nowrap">
            <ColorSwatch color={`var(--mantine-color-${s.color.replace('.', '-')})`} size={10} radius={2} withShadow={false} />
            <Text c="dimmed" size="0.72rem">{s.n} · {s.q}</Text>
            {s.action && <MantineBadge variant="light" color="yellow" size="xs" radius="sm" tt="none">ação</MantineBadge>}
          </Group>
        ))}
      </Group>
    </>
  );
}

function Rank({ rows }: { rows: { n: string; v: number }[] }) {
  const max = Math.max(...rows.map(r => r.v));
  return (
    <Stack gap="xs">
      {rows.map(r => (
        <Group key={r.n} gap="sm" wrap="nowrap">
          <Text size="0.8rem" truncate style={{ flex: 1 }}>{r.n}</Text>
          <Progress value={(r.v / max) * 100} size={6} radius="xl" style={{ flex: 1 }} />
          <Text size="0.75rem" fw={600} w={48} ta="right" className="mono">{fmt(r.v)}</Text>
        </Group>
      ))}
    </Stack>
  );
}

function SimpleTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <Table.ScrollContainer minWidth={480}>
      <Table fz="0.78rem" verticalSpacing={8} horizontalSpacing={8}>
        <Table.Thead>
          <Table.Tr>
            {head.map(h => <Table.Th key={h} fw={500} c="dimmed">{h}</Table.Th>)}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{children}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

const histData = [
  { m: 'Fev', v: 9 }, { m: 'Mar', v: 12 }, { m: 'Abr', v: 10 },
  { m: 'Mai', v: 14 }, { m: 'Jun', v: 12 }, { m: 'Jul', v: 13 },
];

export function DashboardLojista({ onNavigate }: DashboardLojistaProps) {
  return (
    <Container size={1400} p="lg" w="100%">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="sm">
          <Box>
            <Title order={2} size="1.3rem" fw={700} style={{ letterSpacing: '-0.02em' }}>Meus indicadores</Title>
            <Text c="dimmed" size="0.82rem" mt={4}>Loja Pé Quente — Gramado, RS · últimos 90 dias</Text>
          </Box>
          <Group gap="xs">
            {['Período: Últimos 90 dias', 'Coleção: Todas', 'Status: Todos'].map(c => (
              <MantineBadge key={c} variant="light" color="gray" size="lg" tt="none" fw={500} c="var(--mantine-color-text)">{c}</MantineBadge>
            ))}
          </Group>
        </Group>

        {/* MEUS PEDIDOS */}
        <SectionLabel>Meus pedidos</SectionLabel>
        <Grid gutter="md">
          <Card title="Resumo do período" hint="Recência e volume da loja" span={4}>
            <Stack gap="sm">
              <Tile lab="Último pedido" val="há 11 dias" sub="06/07/2026 · dentro do esperado (limite 30d)" />
              <SimpleGrid cols={3} spacing="xs">
                <Tile lab="Pedidos" val="7" />
                <Tile lab="Pares" val="462" />
                <Tile lab="Valor" val={brl(19250)} />
              </SimpleGrid>
            </Stack>
          </Card>

          <Card title="Carteira de pedidos por status" hint="Situação dos 7 pedidos do período · barra 100% empilhada" span={8}>
            <StatusStack segs={[
              { n: 'Aprovado', q: 3, color: 'neutral.9' },
              { n: 'Faturado', q: 2, color: 'blue.5' },
              { n: 'Em transporte', q: 1, color: 'violet.5' },
              { n: 'Aguardando aprovação', q: 1, color: 'yellow.6', action: true },
            ]} />
            <SimpleGrid cols={3} spacing="xs" mt="md">
              <Tile lab="Em andamento" val="2" />
              <Tile lab="Aguardando aprovação" val="1" tone="amber" />
              <Tile lab="Faturados" val="2" />
            </SimpleGrid>
          </Card>

          <Card title="Histórico de compras" hint="Últimos 6 meses (R$ mil) · com variação" span={7}>
            <LineChart
              h={190}
              data={histData}
              dataKey="m"
              series={[{ name: 'v', label: 'Compras', color: 'neutral.9' }]}
              curveType="monotone"
              gridAxis="y"
              tickLine="none"
              valueFormatter={v => `R$ ${v} mil`}
              yAxisProps={{ tickFormatter: (v: number) => `${v}k` }}
            />
            <Text c={POS} size="0.75rem" fw={600} mt="xs">▲ 8% jul vs jun · ▲ 44% vs fev</Text>
          </Card>

          <Card title="Pedidos repetidos" hint="Contados pelo botão “repetir pedido” do histórico" span={5}>
            <Text size="1.8rem" fw={700}>4</Text>
            <Text c={POS} size="0.75rem" fw={600}>▲ 2 vs período anterior</Text>
            <Stack gap="xs" mt="sm">
              {[
                { t: 'Pedido #2314 → repetido 2x', m: 'Tênis Runner X · grade completa' },
                { t: 'Pedido #2201 → repetido 2x', m: 'Sandália Verão · meia grade' },
              ].map(o => <ListItem key={o.t} title={o.t} meta={o.m} />)}
            </Stack>
          </Card>
        </Grid>

        {/* RECOMPRA E PRODUTOS */}
        <SectionLabel>Recompra e produtos</SectionLabel>
        <Grid gutter="md">
          <Card title="Produtos mais comprados" hint="Mix da loja · por pares · filtrável por linha/cor/tipo" span={5}>
            <Rank rows={[
              { n: 'Tênis Runner X', v: 120 }, { n: 'Sandália Verão', v: 96 },
              { n: 'Sapatilha Flex', v: 60 }, { n: 'Bota Couro', v: 48 }, { n: 'Chinelo Soft', v: 36 },
            ]} />
          </Card>

          <Card title="Compra recorrente" hint="Itens comprados com regularidade · frequência por SKU" span={7}>
            <SimpleTable head={['Produto', 'Cadência', 'Compras', 'Última', 'Próxima']}>
              {[
                ['Tênis Runner X', 'a cada 21 dias', '6', 'há 12 dias', 'em ~9 dias', false],
                ['Sandália Verão', 'a cada 30 dias', '4', 'há 18 dias', 'em ~12 dias', false],
                ['Sapatilha Flex', 'a cada 45 dias', '3', 'há 40 dias', 'em ~5 dias', true],
              ].map((r: any) => (
                <Table.Tr key={r[0]}>
                  <Table.Td>{r[0]}</Table.Td>
                  <Table.Td c="dimmed">{r[1]}</Table.Td>
                  <Table.Td>{r[2]}</Table.Td>
                  <Table.Td c="dimmed">{r[3]}</Table.Td>
                  <Table.Td c={r[5] ? WARN : undefined} fw={r[5] ? 600 : undefined}>{r[4]}</Table.Td>
                </Table.Tr>
              ))}
            </SimpleTable>
          </Card>
        </Grid>

        {/* ESTOQUE E SELL-OUT */}
        <SectionLabel>Estoque e sell-out da loja</SectionLabel>
        <Grid gutter="md">
          <Card title="Sell-out" hint="Envio do dado de venda na ponta" span={3}>
            <Stack gap="sm" align="stretch">
              <Box><Badge tone="ok">✓ Loja participante</Badge></Box>
              <Tile lab="Giro médio do estoque" val="20 dias" sub="alerta se > 30d" />
              <Tile lab="Valor em estoque" val={brl(9435)} />
              <Tile lab="SKUs em ruptura" val="1" tone="neg" />
            </Stack>
          </Card>

          <Card title="Controle de estoque" hint="Situação por SKU · ruptura, baixo, OK e valor" span={9}>
            <SimpleTable head={['Produto', 'Situação', 'Estoque (pares)', 'Dias ruptura', 'Giro (dias)', 'Valor']}>
              {[
                ['Tênis Runner X', 'risk', 'Ruptura', 0, 6, 12, '—'],
                ['Sandália Verão', 'warn', 'Baixo', 14, '—', 15, brl(1190)],
                ['Chinelo Soft', 'warn', 'Baixo', 9, '—', 18, brl(405)],
                ['Sapatilha Flex', 'ok', 'OK', 42, '—', 22, brl(3360)],
                ['Bota Couro', 'ok', 'OK', 28, '—', 35, brl(4480)],
              ].map((r: any) => (
                <Table.Tr key={r[0]}>
                  <Table.Td>{r[0]}</Table.Td>
                  <Table.Td><Badge tone={r[1]}>{r[2]}</Badge></Table.Td>
                  <Table.Td>{r[3]}</Table.Td>
                  <Table.Td c={typeof r[4] === 'number' ? WARN : 'dimmed'} fw={typeof r[4] === 'number' ? 600 : undefined}>{r[4]}</Table.Td>
                  <Table.Td c={r[5] > 30 ? WARN : undefined} fw={r[5] > 30 ? 600 : undefined}>{r[5]}</Table.Td>
                  <Table.Td>{r[6]}</Table.Td>
                </Table.Tr>
              ))}
            </SimpleTable>
          </Card>
        </Grid>

        {/* RECOMENDAÇÕES */}
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
            <Button
              variant="subtle"
              size="compact-sm"
              mt="sm"
              onClick={() => onNavigate('catalog')}
              rightSection={<CaretRightIcon className="w-3.5 h-3.5" />}
            >
              Ver no catálogo
            </Button>
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
    </Container>
  );
}
