import { Stack, Group, Grid, SimpleGrid, Paper, Box, Flex, Center, Text, Title, Table, Progress, UnstyledButton, Badge as MantineBadge } from "@mantine/core";
import { ChevronRight } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart,
} from "recharts";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients' | 'stock';

interface DashboardLojistaProps {
  onNavigate: (view: View) => void;
}

const brl = (n: number) => 'R$ ' + n.toLocaleString('pt-BR');
const fmt = (n: number) => n.toLocaleString('pt-BR');

const ITEM_BORDER = { borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-2)' } as const;

const TABULAR = { fontVariantNumeric: 'tabular-nums' } as const;

const tableStyles = {
  table: { fontSize: '0.78rem', textAlign: 'left' as const },
  thead: { color: 'var(--mantine-color-dimmed)' },
  th: { padding: '8px 8px 8px 0', fontWeight: 500, borderBottom: '1px solid var(--mantine-color-gray-3)' },
  td: { padding: '8px 8px 8px 0' },
  tr: { borderBottom: '1px solid var(--mantine-color-gray-2)' },
};

function Card({ title, hint, span = 12, children }: { title: string; hint?: string; span?: number; children: React.ReactNode }) {
  const allowed = [3, 4, 5, 6, 7, 8, 9, 12];
  const colSpan = allowed.includes(span) ? span : 12;
  return (
    <Grid.Col span={{ base: 12, lg: colSpan }}>
      <Paper withBorder radius="lg" p={20} h="100%">
        <Title order={3} fw={600} fz="0.9rem">{title}</Title>
        {hint && <Text c="dimmed" mt={4} fz="0.72rem">{hint}</Text>}
        <Box mt="sm">{children}</Box>
      </Paper>
    </Grid.Col>
  );
}

function Tile({ lab, val, sub, tone }: { lab: string; val: string; sub?: string; tone?: 'amber' | 'neg' | 'pos' | 'muted' }) {
  const toneC =
    tone === 'amber' ? 'yellow.7' :
    tone === 'neg' ? 'yellow.7' :
    tone === 'pos' ? 'teal.6' :
    undefined;
  return (
    <Box p="sm" bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-2)' }}>
      <Text c="dimmed" fz="0.72rem" fw={500}>{lab}</Text>
      <Text c={toneC} fz="1.1rem" fw={700} lts="-0.02em">{val}</Text>
      {sub && <Text c="dimmed" mt={2} fz="0.68rem">{sub}</Text>}
    </Box>
  );
}

function Badge({ children, tone = 'ok' }: { children: React.ReactNode; tone?: 'ok' | 'warn' | 'risk' }) {
  const color = tone === 'ok' ? 'teal' : 'yellow';
  return (
    <MantineBadge color={color} variant="light" radius="xl" size="sm" tt="none" fz="0.65rem" fw={600} px={6} h="auto" py={2}>
      {children}
    </MantineBadge>
  );
}

function Dot() {
  return <Box w={8} h={8} bg="gray.9" mt={6} style={{ borderRadius: '50%', flexShrink: 0 }} />;
}

function StatusStack({ segs }: { segs: { n: string; q: number; color: string; action?: boolean }[] }) {
  const tot = segs.reduce((a, b) => a + b.q, 0);
  return (
    <>
      <Flex w="100%" h={24} style={{ borderRadius: 'var(--mantine-radius-sm)', overflow: 'hidden' }}>
        {segs.map(s => (
          <Center key={s.n} c="white" fz="0.7rem" fw={600} style={{ flex: s.q, background: s.color }} title={`${s.n}: ${s.q}`}>
            {s.q / tot >= 0.1 ? s.q : ''}
          </Center>
        ))}
      </Flex>
      <Group gap="sm" mt="sm">
        {segs.map(s => (
          <Group key={s.n} component="span" gap={6} wrap="nowrap" c="dimmed" fz="0.72rem">
            <Box component="span" w={10} h={10} style={{ borderRadius: 2, background: s.color }} /> {s.n} · {s.q}
            {s.action && <Text component="span" ml={4} px={6} py={2} bg="yellow.1" c="yellow.7" fz="0.62rem" fw={600} style={{ borderRadius: 4 }}>ação</Text>}
          </Group>
        ))}
      </Group>
    </>
  );
}

function Rank({ rows }: { rows: { n: string; v: number }[] }) {
  const max = Math.max(...rows.map(r => r.v));
  return (
    <Stack gap={8}>
      {rows.map(r => (
        <Group key={r.n} gap="sm" wrap="nowrap">
          <Text flex={1} truncate fz="0.8rem">{r.n}</Text>
          <Progress flex={1} value={Number((r.v / max * 100).toFixed(1))} size={6} radius="xl" color="gray.9" bg="gray.1" />
          <Text w={48} ta="right" fz="0.75rem" fw={600} style={TABULAR}>{fmt(r.v)}</Text>
        </Group>
      ))}
    </Stack>
  );
}

const histData = [
  { m: 'Fev', v: 9 }, { m: 'Mar', v: 12 }, { m: 'Abr', v: 10 },
  { m: 'Mai', v: 14 }, { m: 'Jun', v: 12 }, { m: 'Jul', v: 13 },
];

export function DashboardLojista({ onNavigate }: DashboardLojistaProps) {
  return (
    <Stack gap="lg" p="lg" maw={1400} mx="auto" w="100%">
      <Group justify="space-between" align="flex-start" gap="sm">
        <div>
          <Title order={2} fz="1.3rem" fw={700} lts="-0.02em">Meus indicadores</Title>
          <Text c="dimmed" mt={4} fz="0.82rem">Loja Pé Quente — Gramado, RS · últimos 90 dias</Text>
        </div>
        <Group gap={8}>
          {['Período: Últimos 90 dias', 'Coleção: Todas', 'Status: Todos'].map(c => (
            <Text key={c} component="span" px={10} py={4} bg="gray.1" fz="0.72rem" fw={500} style={{ borderRadius: 9999 }}>{c}</Text>
          ))}
        </Group>
      </Group>

      {/* MEUS PEDIDOS */}
      <Text c="dimmed" tt="uppercase" lts="0.05em" fz="0.7rem" fw={600}>Meus pedidos</Text>
      <Grid gutter="md">
        <Card title="Resumo do período" hint="Recência e volume da loja" span={4}>
          <Stack gap="sm">
            <Tile lab="Último pedido" val="há 11 dias" sub="06/07/2026 · dentro do esperado (limite 30d)" />
            <SimpleGrid cols={3} spacing={8}>
              <Tile lab="Pedidos" val="7" />
              <Tile lab="Pares" val="462" />
              <Tile lab="Valor" val={brl(19250)} />
            </SimpleGrid>
          </Stack>
        </Card>

        <Card title="Carteira de pedidos por status" hint="Situação dos 7 pedidos do período · barra 100% empilhada" span={8}>
          <StatusStack segs={[
            { n: 'Aprovado', q: 3, color: 'var(--mantine-color-gray-9)' },
            { n: 'Faturado', q: 2, color: 'var(--mantine-color-blue-6)' },
            { n: 'Em transporte', q: 1, color: 'var(--mantine-color-violet-6)' },
            { n: 'Aguardando aprovação', q: 1, color: 'var(--mantine-color-yellow-6)', action: true },
          ]} />
          <SimpleGrid cols={3} spacing={8} mt="md">
            <Tile lab="Em andamento" val="2" />
            <Tile lab="Aguardando aprovação" val="1" tone="amber" />
            <Tile lab="Faturados" val="2" />
          </SimpleGrid>
        </Card>

        <Card title="Histórico de compras" hint="Últimos 6 meses (R$ mil) · com variação" span={7}>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-3)" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}k`} />
              <Tooltip formatter={(v: any) => [`R$ ${v} mil`, 'Compras']} />
              <Line type="monotone" dataKey="v" stroke="var(--mantine-color-gray-9)" strokeWidth={2} dot={{ r: 3, fill: 'var(--mantine-color-gray-9)' }} />
            </LineChart>
          </ResponsiveContainer>
          <Text c="teal.7" mt={8} fz="0.75rem" fw={600}>▲ 8% jul vs jun · ▲ 44% vs fev</Text>
        </Card>

        <Card title="Pedidos repetidos" hint="Contados pelo botão “repetir pedido” do histórico" span={5}>
          <Text fz="1.8rem" fw={700}>4</Text>
          <Text c="teal.7" fz="0.75rem" fw={600}>▲ 2 vs período anterior</Text>
          <Stack mt="sm" gap={8}>
            {[
              { t: 'Pedido #2314 → repetido 2x', m: 'Tênis Runner X · grade completa' },
              { t: 'Pedido #2201 → repetido 2x', m: 'Sandália Verão · meia grade' },
            ].map(o => (
              <Group key={o.t} align="flex-start" gap={8} wrap="nowrap" p={10} style={ITEM_BORDER}>
                <Dot />
                <div>
                  <Text fz="0.8rem" fw={500}>{o.t}</Text>
                  <Text c="dimmed" fz="0.72rem">{o.m}</Text>
                </div>
              </Group>
            ))}
          </Stack>
        </Card>
      </Grid>

      {/* RECOMPRA E PRODUTOS */}
      <Text c="dimmed" tt="uppercase" lts="0.05em" fz="0.7rem" fw={600}>Recompra e produtos</Text>
      <Grid gutter="md">
        <Card title="Produtos mais comprados" hint="Mix da loja · por pares · filtrável por linha/cor/tipo" span={5}>
          <Rank rows={[
            { n: 'Tênis Runner X', v: 120 }, { n: 'Sandália Verão', v: 96 },
            { n: 'Sapatilha Flex', v: 60 }, { n: 'Bota Couro', v: 48 }, { n: 'Chinelo Soft', v: 36 },
          ]} />
        </Card>

        <Card title="Compra recorrente" hint="Itens comprados com regularidade · frequência por SKU" span={7}>
          <Box style={{ overflowX: 'auto' }}>
            <Table withRowBorders={false} styles={tableStyles}>
              <Table.Thead>
                <Table.Tr><Table.Th>Produto</Table.Th><Table.Th>Cadência</Table.Th><Table.Th>Compras</Table.Th><Table.Th>Última</Table.Th><Table.Th>Próxima</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[
                  ['Tênis Runner X', 'a cada 21 dias', '6', 'há 12 dias', 'em ~9 dias', false],
                  ['Sandália Verão', 'a cada 30 dias', '4', 'há 18 dias', 'em ~12 dias', false],
                  ['Sapatilha Flex', 'a cada 45 dias', '3', 'há 40 dias', 'em ~5 dias', true],
                ].map((r: any) => (
                  <Table.Tr key={r[0]}>
                    <Table.Td>{r[0]}</Table.Td><Table.Td c="dimmed">{r[1]}</Table.Td>
                    <Table.Td>{r[2]}</Table.Td><Table.Td c="dimmed">{r[3]}</Table.Td>
                    <Table.Td c={r[5] ? 'yellow.7' : undefined} fw={r[5] ? 600 : undefined}>{r[4]}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Card>
      </Grid>

      {/* ESTOQUE E SELL-OUT */}
      <Text c="dimmed" tt="uppercase" lts="0.05em" fz="0.7rem" fw={600}>Estoque e sell-out da loja</Text>
      <Grid gutter="md">
        <Card title="Sell-out" hint="Envio do dado de venda na ponta" span={3}>
          <Stack gap="sm">
            <Box><Badge tone="ok">✓ Loja participante</Badge></Box>
            <Tile lab="Giro médio do estoque" val="20 dias" sub="alerta se > 30d" />
            <Tile lab="Valor em estoque" val={brl(9435)} />
            <Tile lab="SKUs em ruptura" val="1" tone="neg" />
          </Stack>
        </Card>

        <Card title="Controle de estoque" hint="Situação por SKU · ruptura, baixo, OK e valor" span={9}>
          <Box style={{ overflowX: 'auto' }}>
            <Table withRowBorders={false} styles={tableStyles}>
              <Table.Thead>
                <Table.Tr><Table.Th>Produto</Table.Th><Table.Th>Situação</Table.Th><Table.Th>Estoque (pares)</Table.Th><Table.Th>Dias ruptura</Table.Th><Table.Th>Giro (dias)</Table.Th><Table.Th>Valor</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
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
                    <Table.Td c={typeof r[4] === 'number' ? 'yellow.7' : 'dimmed'} fw={typeof r[4] === 'number' ? 600 : undefined}>{r[4]}</Table.Td>
                    <Table.Td c={r[5] > 30 ? 'yellow.7' : undefined} fw={r[5] > 30 ? 600 : undefined}>{r[5]}</Table.Td>
                    <Table.Td>{r[6]}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Card>
      </Grid>

      {/* RECOMENDAÇÕES */}
      <Text c="dimmed" tt="uppercase" lts="0.05em" fz="0.7rem" fw={600}>Recomendações</Text>
      <Grid gutter="md">
        <Card title="Sugestões para a loja" hint="Top produto da empresa + top produto da região" span={6}>
          <Stack gap={8}>
            <Group align="flex-start" gap={8} wrap="nowrap" p="sm" style={ITEM_BORDER}>
              <Dot />
              <Box flex={1}>
                <Text fz="0.82rem" fw={500}>Tênis Runner X</Text>
                <Text c="dimmed" fz="0.72rem">Top produto da empresa · você está em ruptura deste item</Text>
              </Box>
              <Text component="span" px={8} py={2} bg="yellow.1" c="yellow.7" fz="0.65rem" fw={600} style={{ borderRadius: 9999 }}>repor</Text>
            </Group>
            <Group align="flex-start" gap={8} wrap="nowrap" p="sm" style={ITEM_BORDER}>
              <Dot />
              <Box flex={1}>
                <Text fz="0.82rem" fw={500}>Bota Chelsea Couro</Text>
                <Text c="dimmed" fz="0.72rem">Top produto da sua região (Serra Gaúcha) nesta coleção</Text>
              </Box>
            </Group>
          </Stack>
          <UnstyledButton onClick={() => onNavigate('catalog')} mt="sm" c="gray.9" fz="0.78rem" fw={500} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver no catálogo <ChevronRight size={14} />
          </UnstyledButton>
        </Card>

        <Card title="Lojas de perfil semelhante estão comprando" hint="Recomendação por perfil/região similar" span={6}>
          <Stack gap={8}>
            {[
              { t: 'Oxford Clássico', m: '8 lojas do seu porte compraram nos últimos 30 dias' },
              { t: 'Derby Casual Urban', m: 'recorrente em lojas da sua região' },
            ].map(x => (
              <Group key={x.t} align="flex-start" gap={8} wrap="nowrap" p="sm" style={ITEM_BORDER}>
                <Dot />
                <div>
                  <Text fz="0.82rem" fw={500}>{x.t}</Text>
                  <Text c="dimmed" fz="0.72rem">{x.m}</Text>
                </div>
              </Group>
            ))}
          </Stack>
        </Card>
      </Grid>
    </Stack>
  );
}
