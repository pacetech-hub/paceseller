import { Stack, Group, Grid, SimpleGrid, Paper, Box, Flex, Center, Text, Title, Table, Progress, UnstyledButton } from "@mantine/core";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AlertTriangle, TrendingDown, TrendingUp, Zap, RefreshCw, BarChart3, Download } from "lucide-react";
import { selloutData, regionData, topProducts, formatCurrency } from "../data/mockData";
import classes from "./SelloutDashboard.module.css";

const INLINE_ICON = { display: 'inline', verticalAlign: 'middle', marginRight: 2 } as const;

const encalheAlerts = [
  { product: 'Mocassim Couro Trançado', sku: 'TCF-2026-003', stock: 240, diasEstoque: 62, region: 'Sul', action: 'Sugerir desconto' },
  { product: 'Derby Casual Urban', sku: 'TCF-2026-002', stock: 180, diasEstoque: 54, region: 'Nordeste', action: 'Redistribuir estoque' },
  { product: 'Sandália Slide Premium', sku: 'TCF-2026-006', stock: 420, diasEstoque: 78, region: 'Centro-Oeste', action: 'Campanha urgente' },
  { product: 'Tênis Vulcanizado', sku: 'TCF-2026-008', stock: 96, diasEstoque: 45, region: 'Norte', action: 'Reposicionamento' },
];

const stockByLine = [
  { name: 'Premium', sellIn: 580000, sellOut: 520000, giro: 89.6 },
  { name: 'Urban', sellIn: 420000, sellOut: 390000, giro: 92.8 },
  { name: 'Sport', sellIn: 680000, sellOut: 650000, giro: 95.6 },
];

const pieData = [
  { name: 'Vendido', value: 2860000, color: 'var(--mantine-color-blue-6)' },
  { name: 'Estoque', value: 140000, color: 'var(--mantine-color-gray-4)' },
];

const TABULAR = { fontVariantNumeric: 'tabular-nums' } as const;
const AXIS_TICK = 'var(--mantine-color-gray-6)';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper withBorder radius="md" px="sm" py={8} shadow="xl">
      <Text c="dimmed" mb={4} fz="0.72rem">{label}</Text>
      {payload.map((entry: any, i: number) => (
        <Text key={i} style={{ color: entry.color }} fz="0.8rem" fw={600}>
          {entry.name}: {entry.value > 1000 ? formatCurrency(entry.value) : `${entry.value}%`}
        </Text>
      ))}
    </Paper>
  );
};

export function SelloutDashboard() {
  const selloutRate = 95.3;
  const overstockValue = 140000;
  const avgDays = 28;

  return (
    <Stack gap="lg" p="lg" maw={1400} mx="auto" w="100%">
      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
        {[
          {
            label: 'Taxa de Sell-out', value: `${selloutRate}%`, sub: 'Coleção Inverno 2026',
            trend: 'up', trendVal: '+2,1%', color: 'teal.6',
          },
          {
            label: 'Estoque Parado', value: formatCurrency(overstockValue), sub: 'valor em encalhe',
            trend: 'down', trendVal: '-R$28k', color: 'red.6',
          },
          {
            label: 'Giro Médio', value: `${avgDays} dias`, sub: 'da produção à venda',
            trend: 'up', trendVal: '-3 dias', color: 'black',
          },
          {
            label: 'Alertas Ativos', value: '6', sub: 'produtos em encalhe',
            trend: 'down', trendVal: '-2 esta semana', color: 'yellow.7',
          },
        ].map(kpi => (
          <Paper key={kpi.label} withBorder radius="lg" p={20}>
            <Text c="dimmed" mb={8} fz="0.78rem" fw={500}>{kpi.label}</Text>
            <Text fz="1.4rem" fw={700} lts="-0.02em" style={TABULAR}>{kpi.value}</Text>
            <Group gap={6} mt={6}>
              <Text component="span" c={kpi.color} fz="0.72rem" fw={600}>
                {kpi.trend === 'up' ? <TrendingUp size={12} style={INLINE_ICON} /> : <TrendingDown size={12} style={INLINE_ICON} />}
                {kpi.trendVal}
              </Text>
              <Text component="span" c="dimmed" fz="0.72rem">{kpi.sub}</Text>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Charts Row 1 */}
      <Grid gutter="md">
        {/* Sell-in x Sell-out trend */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder radius="lg" p={20} h="100%">
            <Group justify="space-between" wrap="nowrap" mb={20}>
              <div>
                <Title order={3} fw={600} fz="0.9rem">Evolução Sell-in × Sell-out</Title>
                <Text c="dimmed" fz="0.75rem">Jan–Jun 2026 · em R$</Text>
              </div>
              <UnstyledButton className={classes.textBtn} fz="0.75rem">
                <Download size={14} /> Exportar
              </UnstyledButton>
            </Group>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={selloutData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-3)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sellIn" name="Sell-in" fill="var(--mantine-color-blue-6)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sellOut" name="Sell-out" fill="var(--mantine-color-orange-5)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Group gap="md" mt="sm">
              <Group gap={6}>
                <Box w={12} h={12} style={{ borderRadius: 2, background: 'var(--mantine-color-blue-6)' }} />
                <Text component="span" c="dimmed" fz="0.72rem">Sell-in (faturado)</Text>
              </Group>
              <Group gap={6}>
                <Box w={12} h={12} style={{ borderRadius: 2, background: 'var(--mantine-color-orange-5)' }} />
                <Text component="span" c="dimmed" fz="0.72rem">Sell-out (vendido)</Text>
              </Group>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Donut giro */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper withBorder radius="lg" p={20} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            <Title order={3} mb="md" fw={600} fz="0.9rem">Giro da Coleção</Title>
            <Center flex={1}>
              <Box pos="relative" w={160} h={160}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius="60%" outerRadius="90%" dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Flex pos="absolute" inset={0} direction="column" align="center" justify="center">
                  <Text component="span" fz="1.4rem" fw={700}>78%</Text>
                  <Text component="span" c="dimmed" fz="0.65rem">girado</Text>
                </Flex>
              </Box>
            </Center>
            <Stack gap={8}>
              {pieData.map(d => (
                <Group key={d.name} justify="space-between" wrap="nowrap">
                  <Group gap={8} wrap="nowrap">
                    <Box w={10} h={10} style={{ borderRadius: '50%', background: d.color }} />
                    <Text component="span" c="dimmed" fz="0.75rem">{d.name}</Text>
                  </Group>
                  <Text component="span" fz="0.78rem" fw={600} style={TABULAR}>{formatCurrency(d.value)}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Performance por linha */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Paper withBorder radius="lg" p={20}>
          <Title order={3} mb="md" fw={600} fz="0.9rem">Performance por Linha</Title>
          <Stack gap="md">
            {stockByLine.map(line => (
              <div key={line.name}>
                <Group justify="space-between" wrap="nowrap" mb={6}>
                  <Text component="span" fz="0.85rem" fw={500}>{line.name}</Text>
                  <Group gap="sm" wrap="nowrap">
                    <Text component="span" c="dimmed" fz="0.72rem" style={TABULAR}>{formatCurrency(line.sellOut)}</Text>
                    <Text component="span" c={line.giro >= 90 ? 'teal.6' : 'yellow.7'} fz="0.75rem" fw={700}>{line.giro}%</Text>
                  </Group>
                </Group>
                <Progress
                  value={line.giro}
                  size={8}
                  radius="xl"
                  bg="gray.1"
                  color={line.giro >= 95 ? 'teal.4' : line.giro >= 85 ? 'gray.9' : 'yellow.5'}
                  transitionDuration={800}
                />
                <Group justify="space-between" wrap="nowrap" mt={4}>
                  <Text component="span" c="dimmed" fz="0.68rem">Sell-out: {formatCurrency(line.sellOut)}</Text>
                  <Text component="span" c="dimmed" fz="0.68rem">Meta: {formatCurrency(line.sellIn)}</Text>
                </Group>
              </div>
            ))}
          </Stack>
        </Paper>

        {/* Regional */}
        <Paper withBorder radius="lg" p={20}>
          <Title order={3} mb="md" fw={600} fz="0.9rem">Sell-out por Região</Title>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regionData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-3)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: AXIS_TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="region" tick={{ fill: AXIS_TICK, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Receita" fill="var(--mantine-color-blue-6)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </SimpleGrid>

      {/* Encalhe Alerts */}
      <Paper withBorder radius="lg" p={20}>
        <Group justify="space-between" wrap="nowrap" mb="md">
          <Group gap={8} wrap="nowrap">
            <AlertTriangle size={16} color="var(--mantine-color-yellow-7)" />
            <Title order={3} fw={600} fz="0.9rem">Alertas de Encalhe</Title>
            <Text component="span" px={8} py={2} bg="yellow.0" c="yellow.7" fz="0.65rem" fw={700} style={{ borderRadius: 9999 }}>
              {encalheAlerts.length} alertas
            </Text>
          </Group>
          <UnstyledButton className={classes.textBtn} fz="0.78rem">
            <RefreshCw size={14} /> Atualizar
          </UnstyledButton>
        </Group>
        <Box style={{ overflowX: 'auto' }}>
          <Table withRowBorders={false} highlightOnHover highlightOnHoverColor="gray.0" className={classes.table}>
            <Table.Thead>
              <Table.Tr>
                {['Produto', 'SKU', 'Estoque (pares)', 'Dias parado', 'Região', 'Ação sugerida'].map(col => (
                  <Table.Th key={col} c="dimmed" fz="0.72rem" fw={500}>{col}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {encalheAlerts.map((alert, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <Text fz="0.82rem" fw={500}>{alert.product}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text component="span" c="dimmed" fz="0.75rem" style={TABULAR}>{alert.sku}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text component="span" fz="0.82rem" fw={600} style={TABULAR}>{alert.stock}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      component="span"
                      c={alert.diasEstoque > 60 ? 'red.6' : alert.diasEstoque > 45 ? 'yellow.7' : undefined}
                      fz="0.82rem"
                      fw={600}
                      style={TABULAR}
                    >
                      {alert.diasEstoque}d
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text component="span" c="dimmed" fz="0.78rem">{alert.region}</Text>
                  </Table.Td>
                  <Table.Td>
                    <UnstyledButton className={classes.actionBtn} fz="0.72rem" fw={600}>
                      <Zap size={12} /> {alert.action}
                    </UnstyledButton>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}
