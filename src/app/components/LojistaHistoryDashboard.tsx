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

const formatK = (v: number) => `${(v / 1000).toFixed(0)}k`;

export function LojistaHistoryDashboard({ onNavigate }: Props) {
  const [period, setPeriod] = useState<'30d' | '90d' | '6m'>('90d');

  const lines = linesByPeriod[period];
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
  const selloutRate = ((totalSellOut / totalSellIn) * 100).toFixed(1);
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
      icon: TrendUpIcon, trend: '+2,1pp', up: true,
    },
    {
      label: 'Pares vendidos', value: totalUnits.toLocaleString('pt-BR'), sub: 'no período',
      icon: TrophyIcon, trend: '-1,3%', up: false,
    },
  ];

  return (
    <Container size={1400} p={{ base: 'md', sm: 'lg' }} w="100%">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" gap="sm">
          <Box>
            <Title order={2}>Histórico de Compras</Title>
            <Text c="dimmed">Visão de sell-in × sell-out e linhas em destaque</Text>
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

        {/* KPIs */}
        <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
          {kpis.map(k => {
            const Icon = k.icon;
            const TrendIcon = k.up ? TrendUpIcon : TrendDownIcon;
            return (
              <Paper key={k.label} withBorder p="md">
                <Group justify="space-between" mb="xs">
                  <ThemeIcon size={32} variant="light">
                    <Icon size={16} />
                  </ThemeIcon>
                  <Group gap={4} c={k.up ? 'teal.7' : 'red.6'} wrap="nowrap">
                    <TrendIcon size={12} />
                    <Text size="sm" fw={700} c="inherit">{k.trend}</Text>
                  </Group>
                </Group>
                <Text c="dimmed" size="sm">{k.label}</Text>
                <Text fz={{ base: 'lg', sm: 'xl' }} fw={700} className="mono">{k.value}</Text>
                <Text c="dimmed" size="sm">{k.sub}</Text>
              </Paper>
            );
          })}
        </SimpleGrid>

        {/* Sell-in x Sell-out chart */}
        <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
          <Box mb="md">
            <Title order={3}>Sell-in × Sell-out</Title>
            <Text c="dimmed" size="sm">Comparativo mensal</Text>
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
            valueFormatter={formatCurrency}
            yAxisProps={{ tickFormatter: formatK }}
          />
        </Paper>

        {/* Linhas em destaque */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Paper withBorder p={{ base: 'md', sm: 'lg' }} h="100%">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <TrophyIcon size={20} color="var(--mantine-color-dimmed)" />
                  <Title order={3}>Linhas mais vendidas</Title>
                </Group>
                <Text c="dimmed" size="sm">{periods.find(p => p.id === period)?.label}</Text>
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
                valueFormatter={formatCurrency}
                xAxisProps={{ tickFormatter: formatK }}
                yAxisProps={{ width: 110 }}
                barProps={{ radius: [0, 6, 6, 0] }}
              />
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Paper withBorder p={{ base: 'md', sm: 'lg' }} h="100%">
              <Group justify="space-between" mb="sm">
                <Title order={3}>Ranking</Title>
                <Text c="dimmed" size="sm">Top 5</Text>
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
                      <Group justify="space-between" mb={6} wrap="nowrap">
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
                          {l.growth >= 0 ? '+' : ''}{l.growth}%
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed" size="sm">{l.units} pares</Text>
                        <Text size="sm" fw={600} className="mono">{formatCurrency(l.revenue)}</Text>
                      </Group>
                      <Progress value={(l.revenue / maxRev) * 100} size={4} mt={6} />
                    </Paper>
                  );
                })}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
