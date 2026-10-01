import { useMemo, useState } from "react";
import {
  Container, Stack, Group, Grid, SimpleGrid, Paper, Title, Text, ThemeIcon, SegmentedControl, Button,
  Progress, Box, Center,
} from "@mantine/core";
import classes from "./LojistaHistoryDashboard.module.css";
import { AreaChart, BarChart } from "@mantine/charts";
import {
  TrendUpIcon,
  TrendDownIcon,
  PackageIcon,
  ShoppingBagIcon,
  TrophyIcon,
  CalendarBlankIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { selloutData, formatCurrency } from "../data/mockData";
import { useMockLoading } from "../lib/useMockLoading";
import { barDomain, lineDomain } from "../lib/charts";
import { ChartSkeleton, KpiSkeleton, ListSkeleton } from "./ui/Skeletons";

type View = 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'history' | 'marketing' | 'sellout' | 'admin' | 'clients';

interface Props {
  onNavigate: (view: View) => void;
}

// Mock: linhas mais vendidas por período do lojista
const linesByPeriod: Record<string, { name: string; units: number; revenue: number; growth: number; share: number }[]> = {
  '30d': [
    { name: 'Flow XL Denim', units: 142, revenue: 12760, growth: 22.4, share: 28 },
    { name: 'Coil Branco', units: 118, revenue: 11196, growth: 14.8, share: 23 },
    { name: 'Flow Preto', units: 96, revenue: 7680, growth: 9.2, share: 18 },
    { name: 'Hertz Marrom', units: 74, revenue: 6290, growth: -3.1, share: 14 },
    { name: 'Step Casual', units: 58, revenue: 4640, growth: 5.6, share: 11 },
  ],
  '90d': [
    { name: 'Flow XL Denim', units: 412, revenue: 37040, growth: 18.2, share: 26 },
    { name: 'Coil Branco', units: 380, revenue: 36050, growth: 12.6, share: 24 },
    { name: 'Flow XL Preto', units: 298, revenue: 26770, growth: 11.3, share: 19 },
    { name: 'Flow Preto', units: 260, revenue: 20800, growth: 7.4, share: 16 },
    { name: 'Hertz Marrom', units: 220, revenue: 18700, growth: 4.1, share: 15 },
  ],
  '6m': [
    { name: 'Flow XL Denim', units: 920, revenue: 82620, growth: 19.4, share: 27 },
    { name: 'Coil Branco', units: 810, revenue: 76870, growth: 14.2, share: 23 },
    { name: 'Flow XL Preto', units: 680, revenue: 61080, growth: 10.8, share: 19 },
    { name: 'Flow Preto', units: 590, revenue: 47200, growth: 8.6, share: 17 },
    { name: 'Hertz Marrom', units: 480, revenue: 40800, growth: 5.2, share: 14 },
  ],
};

const periods = [
  { id: '30d', label: 'Últimos 30 dias' },
  { id: '90d', label: 'Últimos 90 dias' },
  { id: '6m', label: 'Últimos 6 meses' },
];

// tooltip dos gráficos: valor completo em reais, sem centavos (ex.: "R$ 23.818")
const formatChartCurrency = (v: number) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

// eixo em pt-BR: "12 mil"
const formatK = (v: number) => `${Math.round(v / 1000).toLocaleString('pt-BR')} mil`;

// variação com sinal e vírgula decimal: "+22,4%" / "-3,1%"
const formatGrowth = (v: number) => (v >= 0 ? '+' : '') + v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

export function LojistaHistoryDashboard({ onNavigate }: Props) {
  const [period, setPeriod] = useState<'30d' | '90d' | '6m'>('90d');
  const loading = useMockLoading();

  // ranking sempre do maior faturamento para o menor
  const lines = useMemo(() => [...linesByPeriod[period]].sort((a, b) => b.revenue - a.revenue), [period]);
  const maxRev = Math.max(...lines.map(l => l.revenue));

  // Reescala selloutData para a visão do lojista (valores menores)
  const chartData = useMemo(
    () => selloutData.map(d => ({
      month: d.month,
      'Sell-in': Math.round(d.sellIn / 18),
      'Sell-out': Math.round(d.sellOut / 18),
    })),
    [],
  );

  const totalSellIn = chartData.reduce((a, b) => a + b['Sell-in'], 0);
  const totalSellOut = chartData.reduce((a, b) => a + b['Sell-out'], 0);
  const selloutRate = ((totalSellOut / totalSellIn) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const totalUnits = lines.reduce((a, b) => a + b.units, 0);

  const kpis = [
    {
      label: 'Sell-in', value: formatCurrency(totalSellIn), sub: 'comprado da fábrica',
      icon: PackageIcon, trend: '+12,4%', up: true,
    },
    {
      label: 'Sell-out', value: formatCurrency(totalSellOut), sub: 'vendido na loja',
      icon: ShoppingBagIcon, trend: '+9,8%', up: true,
    },
    {
      label: 'Taxa de Sell-out', value: `${selloutRate}%`, sub: 'conversão de estoque',
      icon: TrendUpIcon, trend: '+2,1 p.p.', up: true,
    },
    {
      label: 'Pares vendidos', value: totalUnits.toLocaleString('pt-BR'), sub: 'no período',
      icon: TrophyIcon, trend: '-1,3%', up: false,
    },
  ];

  return (
    <Container size={1400} p={{ base: 'md', sm: 'lg' }} w="100%">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between" gap="sm">
          <Box>
            <Title order={2}>Histórico de Compras</Title>
            <Text c="dimmed" mt={4}>Visão de sell-in × sell-out e linhas em destaque</Text>
          </Box>
          <Group gap="sm">
            <CalendarBlankIcon size={16} color="var(--mantine-color-dimmed)" />
            <SegmentedControl
              value={period}
              onChange={v => setPeriod(v as typeof period)}
              data={periods.map(p => ({ value: p.id, label: p.label }))}
            />
            <Button
              variant="default"
              onClick={() => onNavigate('history')}
              leftSection={<ClockCounterClockwiseIcon size={16} />}
            >
              Ver Histórico de Pedidos
            </Button>
          </Group>
        </Group>

        {loading ? (
          // skeleton no formato do conteúdo: KPIs, gráfico mensal, gráfico de linhas + ranking
          <Stack gap="xl">
            <KpiSkeleton count={4} />
            <ChartSkeleton height={260} />
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, lg: 8 }}><ChartSkeleton height={260} /></Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}><ListSkeleton rows={5} withAvatar={false} /></Grid.Col>
            </Grid>
          </Stack>
        ) : (<>
        {/* KPIs */}
        <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
          {kpis.map(k => {
            const Icon = k.icon;
            const TrendIcon = k.up ? TrendUpIcon : TrendDownIcon;
            return (
              // tile: rótulo + número grande + linha de comparação (sinal, unidade e base)
              <Paper key={k.label} withBorder p="md">
                <Group gap="xs" wrap="nowrap" mb="xs">
                  <ThemeIcon size={32} variant="light">
                    <Icon size={16} />
                  </ThemeIcon>
                  <Box miw={0}>
                    <Text c="dimmed" size="sm">{k.label}</Text>
                    <Text c="dimmed" size="sm" truncate>{k.sub}</Text>
                  </Box>
                </Group>
                <Text fz={{ base: 'lg', sm: 'xl' }} fw={700} className="mono">{k.value}</Text>
                <Group gap={4} c={k.up ? 'teal.7' : 'red.7'} wrap="nowrap" mt={4}>
                  <TrendIcon size={12} />
                  <Text size="sm" fw={600} c="inherit">{k.trend}</Text>
                  <Text size="sm" c="dimmed" truncate>vs. período anterior</Text>
                </Group>
              </Paper>
            );
          })}
        </SimpleGrid>

        {/* Sell-in x Sell-out chart */}
        <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
          <Box mb="md">
            <Title order={3}>Sell-in × Sell-out</Title>
            <Text c="dimmed" size="sm" mt={4}>Comparativo mensal · em R$</Text>
          </Box>
          <AreaChart
            h={260}
            data={chartData}
            dataKey="month"
            series={[
              { name: 'Sell-in', color: 'neutral.9' },
              { name: 'Sell-out', color: 'teal.6' },
            ]}
            curveType="monotone"
            gridAxis="y"
            tickLine="none"
            withLegend
            legendProps={{ verticalAlign: 'top', height: 40 }}
            valueFormatter={formatChartCurrency}
            yAxisProps={{ tickFormatter: formatK, domain: lineDomain }}
          />
        </Paper>

        {/* Linhas em destaque */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Paper withBorder p={{ base: 'md', sm: 'lg' }} h="100%">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <TrophyIcon size={20} color="var(--mantine-color-dimmed)" />
                  <Title order={3}>Linhas mais vendidas</Title>
                </Group>
                <Text c="dimmed" size="sm">Receita · {periods.find(p => p.id === period)?.label}</Text>
              </Group>
              <BarChart
                h={260}
                data={lines}
                dataKey="name"
                orientation="vertical"
                series={[{ name: 'revenue', label: 'Receita', color: 'neutral.4' }]}
                getBarColor={v => (v === maxRev ? 'neutral.9' : 'neutral.4')}
                gridAxis="x"
                tickLine="none"
                valueFormatter={formatChartCurrency}
                // barras horizontais: o valor fica no eixo X, que começa em zero
                xAxisProps={{ tickFormatter: formatK, domain: barDomain }}
                yAxisProps={{ width: 110 }}
                barProps={{ radius: [0, 6, 6, 0] }}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper withBorder p={{ base: 'md', sm: 'lg' }} h="100%">
              <Group justify="space-between" mb="sm">
                <Title order={3}>Ranking</Title>
                <Text c="dimmed" size="sm">Top 5 por receita</Text>
              </Group>
              <Stack gap="xs">
                {lines.map((l, i) => {
                  const top = i === 0;
                  return (
                    <Paper
                      key={l.name}
                      withBorder
                      p="sm"
                      bg={top ? undefined : 'var(--mantine-color-gray-0)'}
                      bd={top ? '1px solid var(--mantine-color-neutral-9)' : undefined}
                    >
                      <Group justify="space-between" mb="xs" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" miw={0}>
                          <Center
                            w={24}
                            h={24}
                            bg={top ? 'neutral.9' : 'gray.2'}
                            c={top ? 'white' : 'dimmed'}
                            flex="none"
                            className={classes.rank}
                          >
                            <Text size="sm" fw={700} c="inherit">{i + 1}</Text>
                          </Center>
                          <Text fw={600} truncate>{l.name}</Text>
                        </Group>
                        <Text c={l.growth >= 0 ? 'teal.7' : 'red.6'} size="sm" fw={700}>
                          {formatGrowth(l.growth)}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed" size="sm">{l.units.toLocaleString('pt-BR')} pares</Text>
                        <Text size="sm" fw={600} className="mono">{formatCurrency(l.revenue)}</Text>
                      </Group>
                      <Progress value={(l.revenue / maxRev) * 100} size={4} mt="xs" />
                    </Paper>
                  );
                })}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
        </>)}
      </Stack>
    </Container>
  );
}
