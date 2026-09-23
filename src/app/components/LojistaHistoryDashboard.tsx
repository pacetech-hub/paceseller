import { useMemo, useState } from "react";
import { Stack, Group, Grid, SimpleGrid, Paper, Box, Center, Text, Title, Progress, UnstyledButton } from "@mantine/core";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Package2, ShoppingBag, Trophy, Calendar, Download } from "lucide-react";
import { selloutData, formatCurrency } from "../data/mockData";
import classes from "./LojistaHistoryDashboard.module.css";

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

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper withBorder radius="md" px="sm" py={8} shadow="xl">
      <Text c="dimmed" mb={4} fz="0.72rem">{label}</Text>
      {payload.map((e: any, i: number) => (
        <Text key={i} style={{ color: e.color }} fz="0.8rem" fw={600}>
          {e.name}: {formatCurrency(e.value)}
        </Text>
      ))}
    </Paper>
  );
};

const TABULAR = { fontVariantNumeric: 'tabular-nums' } as const;
const GRID_STROKE = 'var(--mantine-color-gray-3)';
const AXIS_STROKE = 'var(--mantine-color-gray-6)';
const SELL_IN = 'var(--mantine-color-blue-6)';
const SELL_OUT = 'var(--mantine-color-teal-5)';

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
      icon: Package2, trend: '+12,4%', up: true,
    },
    {
      label: 'Sell-out', value: formatCurrency(totalSellOut), sub: 'vendido na loja',
      icon: ShoppingBag, trend: '+9,8%', up: true,
    },
    {
      label: 'Taxa de Sell-out', value: `${selloutRate}%`, sub: 'conversão de estoque',
      icon: TrendingUp, trend: '+2,1pp', up: true,
    },
    {
      label: 'Pares vendidos', value: totalUnits.toLocaleString('pt-BR'), sub: 'no período',
      icon: Trophy, trend: '-1,3%', up: false,
    },
  ];

  return (
    <Stack gap="lg" p="lg" maw={1400} mx="auto" w="100%">
      {/* Header */}
      <Group justify="space-between" gap="sm">
        <div>
          <Title order={1} fz="1.4rem" fw={700} lts="-0.02em">
            Histórico de Compras
          </Title>
          <Text c="dimmed" fz="0.82rem">
            Visão de sell-in × sell-out e linhas em destaque
          </Text>
        </div>
        <Group gap={8} wrap="nowrap">
          <Group gap={4} wrap="nowrap" p={4} bg="white" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }}>
            <Calendar size={14} color="var(--mantine-color-dimmed)" style={{ marginLeft: 6 }} />
            {periods.map(p => (
              <UnstyledButton
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={classes.periodBtn}
                data-active={period === p.id || undefined}
                fz="0.74rem"
                fw={600}
              >
                {p.label}
              </UnstyledButton>
            ))}
          </Group>
          <UnstyledButton
            onClick={() => onNavigate('history')}
            className={classes.exportBtn}
            fz="0.78rem"
            fw={500}
          >
            <Download size={14} /> Exportar
          </UnstyledButton>
        </Group>
      </Group>

      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
        {kpis.map(k => {
          const Icon = k.icon;
          const TrendIcon = k.up ? TrendingUp : TrendingDown;
          return (
            <Paper key={k.label} withBorder radius="lg" p="md">
              <Group justify="space-between" wrap="nowrap" mb={8}>
                <Center w={32} h={32} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                  <Icon size={16} color="var(--mantine-color-gray-9)" />
                </Center>
                <Group gap={4} wrap="nowrap" c={k.up ? 'teal.6' : 'red.6'} fz="0.72rem" fw={700}>
                  <TrendIcon size={12} />
                  {k.trend}
                </Group>
              </Group>
              <Text c="dimmed" fz="0.72rem" fw={500}>{k.label}</Text>
              <Text fz="1.15rem" fw={700} lts="-0.01em" style={TABULAR}>{k.value}</Text>
              <Text c="dimmed" fz="0.7rem">{k.sub}</Text>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* Sell-in x Sell-out chart */}
      <Paper withBorder radius="lg" p={20}>
        <Group justify="space-between" wrap="nowrap" mb="md">
          <div>
            <Text fz="0.95rem" fw={700}>Sell-in × Sell-out</Text>
            <Text c="dimmed" fz="0.74rem">Comparativo mensal</Text>
          </div>
          <Group gap="sm" wrap="nowrap" fz="0.72rem">
            <Group component="span" gap={6} wrap="nowrap" c="dimmed">
              <Box component="span" w={10} h={10} bg="gray.9" style={{ borderRadius: 2 }} /> Sell-in
            </Group>
            <Group component="span" gap={6} wrap="nowrap" c="dimmed">
              <Box component="span" w={10} h={10} bg="teal.4" style={{ borderRadius: 2 }} /> Sell-out
            </Group>
          </Group>
        </Group>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SELL_IN} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={SELL_IN} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SELL_OUT} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={SELL_OUT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month" stroke={AXIS_STROKE} style={{ fontSize: '0.72rem' }} tickLine={false} axisLine={false} />
              <YAxis stroke={AXIS_STROKE} style={{ fontSize: '0.72rem' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Sell-in" stroke={SELL_IN} strokeWidth={2} fill="url(#gIn)" />
              <Area type="monotone" dataKey="Sell-out" stroke={SELL_OUT} strokeWidth={2} fill="url(#gOut)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Paper>

      {/* Linhas em destaque */}
      <Grid gutter={20}>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder radius="lg" p={20} h="100%">
            <Group justify="space-between" wrap="nowrap" mb="md">
              <Group gap={8} wrap="nowrap">
                <Trophy size={16} color="var(--mantine-color-yellow-6)" />
                <Text fz="0.95rem" fw={700}>Linhas mais vendidas</Text>
              </Group>
              <Text c="dimmed" fz="0.72rem">{periods.find(p => p.id === period)?.label}</Text>
            </Group>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={lines} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" stroke={AXIS_STROKE} style={{ fontSize: '0.7rem' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke={AXIS_STROKE} style={{ fontSize: '0.72rem' }} width={110} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="Receita" radius={[0, 6, 6, 0]}>
                    {lines.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? 'var(--mantine-color-yellow-6)' : SELL_IN} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper withBorder radius="lg" p={20} h="100%">
            <Group justify="space-between" wrap="nowrap" mb="sm">
              <Text fz="0.95rem" fw={700}>Ranking</Text>
              <Text c="dimmed" fz="0.72rem">Top 5</Text>
            </Group>
            <Stack gap={10}>
              {lines.map((l, i) => (
                <Box
                  key={l.name}
                  p="sm"
                  bg={i === 0 ? 'yellow.0' : 'gray.0'}
                  style={{
                    borderRadius: 'var(--mantine-radius-md)',
                    border: `1px solid ${i === 0 ? 'var(--mantine-color-yellow-3)' : 'var(--mantine-color-gray-3)'}`,
                    transition: 'background-color 150ms ease, border-color 150ms ease',
                  }}
                >
                  <Group justify="space-between" wrap="nowrap" mb={6}>
                    <Group gap={8} wrap="nowrap" miw={0}>
                      <Center
                        w={20}
                        h={20}
                        bg={i === 0 ? 'yellow.5' : 'gray.1'}
                        c={i === 0 ? 'white' : 'dimmed'}
                        fz="0.65rem"
                        fw={700}
                        style={{ borderRadius: '50%', flexShrink: 0 }}
                      >
                        {i + 1}
                      </Center>
                      <Text truncate fz="0.82rem" fw={600}>{l.name}</Text>
                    </Group>
                    <Text component="span" c={l.growth >= 0 ? 'teal.6' : 'red.6'} fz="0.7rem" fw={700}>
                      {l.growth >= 0 ? '+' : ''}{l.growth}%
                    </Text>
                  </Group>
                  <Group justify="space-between" wrap="nowrap" c="dimmed" fz="0.72rem">
                    <span>{l.units} pares</span>
                    <Text component="span" inherit c="var(--mantine-color-text)" fw={600} style={TABULAR}>{formatCurrency(l.revenue)}</Text>
                  </Group>
                  <Progress
                    mt={6}
                    size={4}
                    radius="xl"
                    bg="gray.1"
                    color={i === 0 ? 'yellow.5' : 'gray.9'}
                    value={(l.revenue / maxRev) * 100}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
