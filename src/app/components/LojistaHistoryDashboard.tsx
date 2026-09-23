import { useMemo, useState } from "react";
import {
  Container, Stack, Group, Grid, SimpleGrid, Paper, Title, Text, ThemeIcon, SegmentedControl, Button,
  Progress, Box, Center,
} from "@mantine/core";
import { AreaChart, BarChart } from "@mantine/charts";
import {
  TrendUpIcon,
  TrendDownIcon,
  PackageIcon,
  ShoppingBagIcon,
  TrophyIcon,
  CalendarBlankIcon,
  DownloadSimpleIcon,
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
    <Container size={1400} p="lg" w="100%">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" gap="sm">
          <Box>
            <Title order={1} size="1.4rem" fw={700} style={{ letterSpacing: '-0.02em' }}>Histórico de Compras</Title>
            <Text c="dimmed" size="0.82rem">Visão de sell-in × sell-out e linhas em destaque</Text>
          </Box>
          <Group gap="xs">
            <CalendarBlankIcon className="w-4 h-4" style={{ color: 'var(--mantine-color-dimmed)' }} />
            <SegmentedControl
              size="xs"
              value={period}
              onChange={v => setPeriod(v as typeof period)}
              data={periods.map(p => ({ value: p.id, label: p.label }))}
            />
            <Button
              variant="default"
              size="sm"
              onClick={() => onNavigate('history')}
              leftSection={<DownloadSimpleIcon className="w-3.5 h-3.5" />}
            >
              Exportar
            </Button>
          </Group>
        </Group>

        {/* KPIs */}
        <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
          {kpis.map(k => {
            const Icon = k.icon;
            const TrendIcon = k.up ? TrendUpIcon : TrendDownIcon;
            return (
              <Paper key={k.label} withBorder radius="lg" p="md">
                <Group justify="space-between" mb="xs">
                  <ThemeIcon size={32} radius="md" variant="light">
                    <Icon className="w-4 h-4" />
                  </ThemeIcon>
                  <Group gap={4} c={k.up ? 'teal.7' : 'red.6'} wrap="nowrap">
                    <TrendIcon className="w-3 h-3" />
                    <Text size="0.72rem" fw={700} c="inherit">{k.trend}</Text>
                  </Group>
                </Group>
                <Text c="dimmed" size="0.72rem" fw={500}>{k.label}</Text>
                <Text size="1.15rem" fw={700} className="mono" style={{ letterSpacing: '-0.01em' }}>{k.value}</Text>
                <Text c="dimmed" size="0.7rem">{k.sub}</Text>
              </Paper>
            );
          })}
        </SimpleGrid>

        {/* Sell-in x Sell-out chart */}
        <Paper withBorder radius="lg" p="lg">
          <Box mb="md">
            <Title order={3} size="0.95rem" fw={700}>Sell-in × Sell-out</Title>
            <Text c="dimmed" size="0.74rem">Comparativo mensal</Text>
          </Box>
          <AreaChart
            h={260}
            data={chartData}
            dataKey="month"
            series={[
              { name: 'Sell-in', color: 'blue.6' },
              { name: 'Sell-out', color: 'teal.5' },
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
            <Paper withBorder radius="lg" p="lg" h="100%">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <TrophyIcon className="w-4 h-4" style={{ color: 'var(--mantine-color-yellow-6)' }} />
                  <Title order={3} size="0.95rem" fw={700}>Linhas mais vendidas</Title>
                </Group>
                <Text c="dimmed" size="0.72rem">{periods.find(p => p.id === period)?.label}</Text>
              </Group>
              <BarChart
                h={260}
                data={lines}
                dataKey="name"
                orientation="vertical"
                series={[{ name: 'revenue', label: 'Receita', color: 'blue.6' }]}
                getBarColor={v => (v === maxRev ? 'yellow.6' : 'blue.6')}
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
            <Paper withBorder radius="lg" p="lg" h="100%">
              <Group justify="space-between" mb="sm">
                <Title order={3} size="0.95rem" fw={700}>Ranking</Title>
                <Text c="dimmed" size="0.72rem">Top 5</Text>
              </Group>
              <Stack gap="xs">
                {lines.map((l, i) => {
                  const top = i === 0;
                  return (
                    <Paper
                      key={l.name}
                      withBorder
                      radius="md"
                      p="sm"
                      bg={top ? 'var(--mantine-color-yellow-0)' : 'var(--mantine-color-gray-0)'}
                      style={top ? { borderColor: 'var(--mantine-color-yellow-4)' } : undefined}
                    >
                      <Group justify="space-between" mb={6} wrap="nowrap">
                        <Group gap="xs" wrap="nowrap" miw={0}>
                          <Center
                            w={20}
                            h={20}
                            bg={top ? 'yellow.5' : 'gray.2'}
                            c={top ? 'white' : 'dimmed'}
                            style={{ borderRadius: '50%', flexShrink: 0 }}
                          >
                            <Text size="0.65rem" fw={700} c="inherit">{i + 1}</Text>
                          </Center>
                          <Text size="0.82rem" fw={600} truncate>{l.name}</Text>
                        </Group>
                        <Text c={l.growth >= 0 ? 'teal.7' : 'red.6'} size="0.7rem" fw={700}>
                          {l.growth >= 0 ? '+' : ''}{l.growth}%
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed" size="0.72rem">{l.units} pares</Text>
                        <Text size="0.72rem" fw={600} className="mono">{formatCurrency(l.revenue)}</Text>
                      </Group>
                      <Progress value={(l.revenue / maxRev) * 100} size={4} mt={6} color={top ? 'yellow.5' : undefined} />
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
