import {
  Stack, Group, Box, Paper, Card, Text, Title, Button, Badge, SimpleGrid, Grid, Table, Progress, Center,
} from "@mantine/core";
import classes from "./SelloutDashboard.module.css";
import { BarChart, DonutChart } from "@mantine/charts";
import {
  WarningIcon,
  TrendDownIcon,
  TrendUpIcon,
  LightningIcon,
  ArrowsClockwiseIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react";
import { selloutData, regionData, formatCurrency } from "../data/mockData";

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
  { name: 'Vendido', value: 2860000, color: 'blue.6' },
  { name: 'Estoque', value: 140000, color: 'gray.3' },
];

const SELL_IN_COLOR = 'blue.6';
const SELL_OUT_COLOR = 'orange.5';

const formatK = (v: number) => `${(v / 1000).toFixed(0)}k`;

// dias parado: acima de 60 crítico, acima de 45 atenção
const daysColor = (days: number) => (days > 60 ? 'red.6' : days > 45 ? 'yellow.7' : undefined);

// barra de giro por linha: >= 95 ótimo, >= 85 ok, abaixo atenção
const giroBarColor = (giro: number) => (giro >= 95 ? 'teal.5' : giro >= 85 ? 'neutral' : 'yellow.5');

const kpis = [
  { label: 'Taxa de Sell-out', value: '95.3%', sub: 'Coleção Inverno 2026', trend: 'up', trendVal: '+2,1%', color: 'teal.6' },
  { label: 'Estoque Parado', value: formatCurrency(140000), sub: 'valor em encalhe', trend: 'down', trendVal: '-R$28k', color: 'red.6' },
  { label: 'Giro Médio', value: '28 dias', sub: 'da produção à venda', trend: 'up', trendVal: '-3 dias', color: 'black' },
  { label: 'Alertas Ativos', value: '6', sub: 'produtos em encalhe', trend: 'down', trendVal: '-2 esta semana', color: 'yellow.7' },
] as const;

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <Title order={3} fw={600} fz="0.9rem">{children}</Title>;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Group gap={6} wrap="nowrap">
      <Paper w={12} h={12} bg={color} radius={3} />
      <Text c="dimmed" size="0.72rem">{label}</Text>
    </Group>
  );
}

export function SelloutDashboard() {
  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
        {kpis.map(kpi => {
          const TrendIcon = kpi.trend === 'up' ? TrendUpIcon : TrendDownIcon;
          return (
            <Paper key={kpi.label} withBorder radius="lg" p={{ base: 'md', sm: 'lg' }}>
              <Text c="dimmed" size="0.78rem" fw={500} mb={8}>{kpi.label}</Text>
              <Text className="mono" fw={700} fz="1.4rem" lts="-0.02em">{kpi.value}</Text>
              <Group gap={6} mt={6} wrap="nowrap">
                <Group gap={2} c={kpi.color} wrap="nowrap" flex="none">
                  <TrendIcon size={12} />
                  <Text size="0.72rem" fw={600} c={kpi.color}>{kpi.trendVal}</Text>
                </Group>
                <Text c="dimmed" size="0.72rem" truncate>{kpi.sub}</Text>
              </Group>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* Charts Row 1 */}
      <Grid gutter="md">
        {/* Sell-in x Sell-out trend */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} h="100%">
            <Group justify="space-between" mb="lg">
              <Box>
                <ChartTitle>Evolução Sell-in × Sell-out</ChartTitle>
                <Text c="dimmed" size="0.75rem">Jan–Jun 2026 · em R$</Text>
              </Box>
              <Button variant="subtle" color="gray" size="compact-xs" leftSection={<DownloadSimpleIcon size={14} />}>
                Exportar
              </Button>
            </Group>
            <BarChart
              h={200}
              data={selloutData}
              dataKey="month"
              series={[
                { name: 'sellIn', label: 'Sell-in', color: SELL_IN_COLOR },
                { name: 'sellOut', label: 'Sell-out', color: SELL_OUT_COLOR },
              ]}
              gridAxis="y"
              tickLine="none"
              strokeDasharray="3 3"
              valueFormatter={formatCurrency}
              yAxisProps={{ tickFormatter: formatK, width: 44 }}
              barProps={{ radius: [3, 3, 0, 0] }}
              barChartProps={{ barGap: 4 }}
            />
            <Group gap="md" mt="sm">
              <LegendDot color={SELL_IN_COLOR} label="Sell-in (faturado)" />
              <LegendDot color={SELL_OUT_COLOR} label="Sell-out (vendido)" />
            </Group>
          </Paper>
        </Grid.Col>

        {/* Donut giro */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder radius="lg" padding="lg" h="100%">
            <Box mb="md"><ChartTitle>Giro da Coleção</ChartTitle></Box>
            <Center flex={1}>
              <Box pos="relative">
                <DonutChart
                  data={pieData}
                  size={160}
                  thickness={24}
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                  withTooltip={false}
                />
                <Stack gap={0} align="center" justify="center" pos="absolute" inset={0} className={classes.donutLabel}>
                  <Text fw={700} fz="1.4rem" lh={1.1}>78%</Text>
                  <Text c="dimmed" size="0.65rem">girado</Text>
                </Stack>
              </Box>
            </Center>
            <Stack gap={8} mt="md">
              {pieData.map(d => (
                <Group key={d.name} justify="space-between" wrap="nowrap">
                  <Group gap={8} wrap="nowrap">
                    <Paper w={10} h={10} bg={d.color} radius="50%" />
                    <Text c="dimmed" size="0.75rem">{d.name}</Text>
                  </Group>
                  <Text className="mono" size="0.78rem" fw={600}>{formatCurrency(d.value)}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Performance por linha */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }}>
          <Box mb="md"><ChartTitle>Performance por Linha</ChartTitle></Box>
          <Stack gap="md">
            {stockByLine.map(line => (
              <Box key={line.name}>
                <Group justify="space-between" mb={6} wrap="nowrap">
                  <Text size="0.85rem" fw={500}>{line.name}</Text>
                  <Group gap="sm" wrap="nowrap">
                    <Text c="dimmed" className="mono" size="0.72rem">{formatCurrency(line.sellOut)}</Text>
                    <Text size="0.75rem" fw={700} c={line.giro >= 90 ? 'teal.6' : 'yellow.7'}>{line.giro}%</Text>
                  </Group>
                </Group>
                <Progress value={line.giro} size={8} radius="xl" color={giroBarColor(line.giro)} transitionDuration={800} />
                <Group justify="space-between" mt={4}>
                  <Text c="dimmed" size="0.68rem">Sell-out: {formatCurrency(line.sellOut)}</Text>
                  <Text c="dimmed" size="0.68rem">Meta: {formatCurrency(line.sellIn)}</Text>
                </Group>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Regional */}
        <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }}>
          <Box mb="md"><ChartTitle>Sell-out por Região</ChartTitle></Box>
          <BarChart
            h={200}
            data={regionData}
            dataKey="region"
            orientation="vertical"
            series={[{ name: 'revenue', label: 'Receita', color: SELL_IN_COLOR }]}
            gridAxis="x"
            tickLine="none"
            strokeDasharray="3 3"
            valueFormatter={formatCurrency}
            xAxisProps={{ tickFormatter: formatK }}
            yAxisProps={{ width: 90 }}
            barProps={{ radius: [0, 3, 3, 0] }}
          />
        </Paper>
      </SimpleGrid>

      {/* Encalhe Alerts */}
      <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }}>
        <Group justify="space-between" mb="md">
          <Group gap={8}>
            <WarningIcon size={16} color="var(--mantine-color-yellow-6)" />
            <ChartTitle>Alertas de Encalhe</ChartTitle>
            <Badge size="sm" variant="light" color="yellow" styles={{ label: { textTransform: 'none' } }}>
              {encalheAlerts.length} alertas
            </Badge>
          </Group>
          <Button variant="subtle" color="gray" size="compact-xs" leftSection={<ArrowsClockwiseIcon size={14} />}>
            Atualizar
          </Button>
        </Group>
        <Table.ScrollContainer minWidth={720}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing={0}>
            <Table.Thead>
              <Table.Tr>
                {['Produto', 'SKU', 'Estoque (pares)', 'Dias parado', 'Região', 'Ação sugerida'].map(col => (
                  <Table.Th key={col} c="dimmed" fw={500} pr="md" fz="0.72rem">{col}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {encalheAlerts.map((alert, i) => (
                <Table.Tr key={i}>
                  <Table.Td pr="md"><Text size="0.82rem" fw={500}>{alert.product}</Text></Table.Td>
                  <Table.Td pr="md"><Text c="dimmed" className="mono" size="0.75rem">{alert.sku}</Text></Table.Td>
                  <Table.Td pr="md"><Text className="mono" size="0.82rem" fw={600}>{alert.stock}</Text></Table.Td>
                  <Table.Td pr="md">
                    <Text className="mono" size="0.82rem" fw={600} c={daysColor(alert.diasEstoque)}>{alert.diasEstoque}d</Text>
                  </Table.Td>
                  <Table.Td pr="md"><Text c="dimmed" size="0.78rem">{alert.region}</Text></Table.Td>
                  <Table.Td>
                    <Button variant="light" color="yellow" size="compact-xs" radius="xl" leftSection={<LightningIcon size={12} />}>
                      {alert.action}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Stack>
  );
}
