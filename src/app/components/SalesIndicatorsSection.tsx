import { useState } from "react";
import {
  Stack, Group, SimpleGrid, Grid, Paper, Text, Title, SegmentedControl, Button, NavLink, ColorSwatch, Box,
} from "@mantine/core";
import { CompositeChart } from "@mantine/charts";
import { CaretRightIcon } from "@phosphor-icons/react";
import { clients as allClients, type Client } from "../data/mockData";

export type Period = 'dia' | 'mes' | 'trimestre' | 'ano';

export interface SalesEntity {
  id: string;
  name: string;
  role: 'representante' | 'preposto';
  parentRep?: string;
  monthlySales: number;
}

// vendas mensais consolidadas por representante — já incluem a produção dos respectivos prepostos
const salesEntities: SalesEntity[] = [
  { id: 'rep-marcos', name: 'Marcos Andrade', role: 'representante', monthlySales: 524000 },
  { id: 'rep-carlos', name: 'Carlos Mendes', role: 'representante', monthlySales: 441000 },
  { id: 'rep-fernanda', name: 'Fernanda Lima', role: 'representante', monthlySales: 398000 },
  { id: 'rep-ana', name: 'Ana Santos', role: 'representante', monthlySales: 312000 },
  { id: 'prep-rafael', name: 'Rafael Souza', role: 'preposto', parentRep: 'Marcos Andrade', monthlySales: 145000 },
  { id: 'prep-juliana', name: 'Juliana Costa', role: 'preposto', parentRep: 'Marcos Andrade', monthlySales: 98000 },
  { id: 'prep-diego', name: 'Diego Martins', role: 'preposto', parentRep: 'Carlos Mendes', monthlySales: 128000 },
  { id: 'prep-patricia', name: 'Patrícia Nunes', role: 'preposto', parentRep: 'Carlos Mendes', monthlySales: 84000 },
  { id: 'prep-bruno', name: 'Bruno Alves', role: 'preposto', parentRep: 'Fernanda Lima', monthlySales: 112000 },
  { id: 'prep-camila', name: 'Camila Rocha', role: 'preposto', parentRep: 'Fernanda Lima', monthlySales: 76000 },
  { id: 'prep-lucas', name: 'Lucas Ferreira', role: 'preposto', parentRep: 'Ana Santos', monthlySales: 95000 },
  { id: 'prep-beatriz', name: 'Beatriz Lima', role: 'preposto', parentRep: 'Ana Santos', monthlySales: 61000 },
];

export function getNetworkEntities(): SalesEntity[] {
  return salesEntities;
}

// representante + seus prepostos — usado como "vendedores" do time do rep
export function getRepTeamEntities(repName: string): SalesEntity[] {
  return salesEntities.filter(e => e.name === repName || (e.role === 'preposto' && e.parentRep === repName));
}

export function getNetworkMonthlyTotal(): number {
  return salesEntities.filter(e => e.role === 'representante').reduce((sum, e) => sum + e.monthlySales, 0);
}

export function getRepMonthlyTotal(repName: string): number {
  return salesEntities.find(e => e.role === 'representante' && e.name === repName)?.monthlySales ?? 0;
}

export const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'mes', label: 'Mês' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'ano', label: 'Ano' },
];

const periodConfig: Record<Period, { multiplier: number; labels: string[] }> = {
  dia: { multiplier: 1 / 22, labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] },
  mes: { multiplier: 1, labels: ['Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'] },
  trimestre: { multiplier: 3, labels: ['T1', 'T2', 'T3', 'T4'] },
  ano: { multiplier: 12, labels: ['2023', '2024', '2025', '2026'] },
};

export const brl = (n: number) => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

function formatAxisValue(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}mi`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
  return `${v}`;
}

export function scaleValue(monthlyBase: number, period: Period): number {
  return Math.round(monthlyBase * periodConfig[period].multiplier);
}

// série de evolução na granularidade do período: barras do ano corrente x linha do mesmo ciclo no ano anterior
function buildSeries(monthlyBase: number, period: Period) {
  const { multiplier, labels } = periodConfig[period];
  const base = monthlyBase * multiplier;
  return labels.map((label, i) => {
    const wobble = Math.sin(i * 1.3) * 0.08 + Math.cos(i * 0.6) * 0.05;
    const trend = 1 + (i - labels.length / 2) * 0.02;
    const current = Math.max(0, Math.round(base * (1 + wobble) * trend));
    const lyWobble = Math.sin(i * 0.9 + 1.7) * 0.16 + Math.cos(i * 1.6) * 0.07;
    const lastYear = Math.max(0, Math.round(current * (0.86 + lyWobble)));
    return { label, current, lastYear };
  });
}

// `color` é uma cor do tema Mantine (nome.tom)
const STATUS_CONFIG: { key: string; label: string; color: string; ratio: number; orderStatus: string }[] = [
  { key: 'analise', label: 'Em análise', color: 'yellow.6', ratio: 0.10, orderStatus: 'em análise' },
  { key: 'aprovado', label: 'Aprovado', color: 'neutral.9', ratio: 0.40, orderStatus: 'aprovado' },
  { key: 'faturado', label: 'Faturado', color: 'blue.5', ratio: 0.27, orderStatus: 'faturado' },
  { key: 'entregue', label: 'Entregue', color: 'violet.5', ratio: 0.18, orderStatus: 'entregue' },
  { key: 'cancelado', label: 'Cancelado', color: 'red.5', ratio: 0.05, orderStatus: 'cancelado' },
];

const SERIES_CHART = [
  { name: 'current', label: 'Período atual', color: 'neutral.9', type: 'bar' as const },
  { name: 'lastYear', label: 'Ano passado', color: 'yellow.6', type: 'line' as const },
];

// referência fixa de "hoje" usada só para o mock de recência de pedidos
const TODAY = new Date('2026-08-21T00:00:00');

function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((TODAY.getTime() - d.getTime()) / 86400000);
}

function seededFraction(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

function seededPercent(seed: string, min: number, max: number): string {
  const v = min + seededFraction(seed) * (max - min);
  return `+${v.toFixed(1).replace('.', ',')}%`;
}

function formatCompactCurrency(v: number): string {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(1).replace('.', ',')} mi`;
  if (v >= 1e3) return `R$ ${Math.round(v / 1e3)} mil`;
  return brl(v);
}

interface PriorityClient extends Client {
  reason: string;
}

function buildPriorityClients(pool: Client[]): PriorityClient[] {
  return pool
    .map(c => {
      const days = daysSince(c.lastOrder);
      let reason: string;
      if (days > 30) {
        reason = `Sem pedido há ${days} dias — oportunidade de reposição`;
      } else if (c.inadimplente) {
        reason = 'Pagamento em atraso — cobrar antes de novo pedido';
      } else if (c.status === 'inativo') {
        reason = 'Cliente inativo — retomar contato';
      } else {
        reason = 'Sem pedido recente — bom momento para nova oferta';
      }
      // prioriza recência: quanto mais dias sem pedido, maior a prioridade de contato
      return { ...c, reason, score: days };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

interface SalesIndicatorsSectionProps {
  scope: 'network' | 'own';
  entities: SalesEntity[];
  totalMonthlyBase: number;
  avgTicket: number;
  repName?: string;
  onNavigateClients: () => void;
  onOpenClient: (client: Client) => void;
  onOpenSalesTeam: () => void;
  onOpenStatus: (status: string) => void;
}

export function SalesIndicatorsSection({
  scope, entities, totalMonthlyBase, avgTicket, repName, onNavigateClients, onOpenClient, onOpenSalesTeam, onOpenStatus,
}: SalesIndicatorsSectionProps) {
  const [period, setPeriod] = useState<Period>('dia');

  const periodValue = scaleValue(totalMonthlyBase, period);
  const periodOrders = Math.max(1, Math.round(periodValue / avgTicket));
  const series = buildSeries(totalMonthlyBase, period);
  const statusRows = STATUS_CONFIG.map(s => ({ ...s, count: Math.max(0, Math.round(periodOrders * s.ratio)) }));

  const ranked = entities
    .map(e => ({ ...e, value: scaleValue(e.monthlySales, period) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const clientPool = scope === 'network' ? allClients : allClients.filter(c => c.rep === repName);
  const priorityClients = buildPriorityClients(clientPool);

  const ordersDelta = seededPercent(`orders-${scope}-${period}`, 5, 18);
  const financeDelta = seededPercent(`finance-${scope}-${period}`, 4, 15);

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <SegmentedControl
          size="xs"
          value={period}
          onChange={v => setPeriod(v as Period)}
          data={PERIOD_OPTIONS.map(o => ({ value: o.id, label: o.label }))}
        />
      </Group>

      {/* A + B */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <KpiCard label="Pedidos no período" value={periodOrders.toLocaleString('pt-BR')} delta={ordersDelta} />
        <KpiCard label="Faturamento" value={formatCompactCurrency(periodValue)} delta={financeDelta} />
      </SimpleGrid>

      {/* C: gráfico de colunas x ano anterior + status dos pedidos */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder radius="lg" p="lg" h="100%">
            <CardTitle title="Vendas vs. ano passado" subtitle="Colunas do período atual · linha do mesmo ciclo no ano anterior" />
            <CompositeChart
              h={240}
              mt="sm"
              data={series}
              dataKey="label"
              series={SERIES_CHART}
              curveType="monotone"
              gridAxis="y"
              tickLine="none"
              withLegend
              legendProps={{ verticalAlign: 'bottom' }}
              valueFormatter={brl}
              yAxisProps={{ tickFormatter: formatAxisValue }}
              barProps={{ radius: [4, 4, 0, 0] }}
              maxBarWidth={48}
            />
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper withBorder radius="lg" p="lg" h="100%">
            <CardTitle title="Pedidos por status" subtitle={`${periodOrders.toLocaleString('pt-BR')} pedidos no período`} />
            <Stack gap={2} mt="sm">
              {statusRows.map(s => (
                <NavLink
                  key={s.key}
                  component="button"
                  onClick={() => onOpenStatus(s.orderStatus)}
                  label={<Text size="0.8rem">{s.label}</Text>}
                  leftSection={<ColorSwatch color={`var(--mantine-color-${s.color.replace('.', '-')})`} size={10} radius={2} withShadow={false} />}
                  rightSection={<Text size="0.82rem" fw={700} className="mono">{s.count}</Text>}
                  py={6}
                  style={{ borderRadius: 'var(--mantine-radius-md)' }}
                />
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* D: top 10 vendedores */}
      <Paper withBorder radius="lg" p="lg">
        <Group justify="space-between" gap="xs" mb="sm">
          <CardTitle title="Vendas por representante" />
          <SeeMoreButton onClick={onOpenSalesTeam} />
        </Group>
        <Stack gap="xs">
          {ranked.map((e, i) => (
            <Group key={e.id} gap="sm" wrap="nowrap">
              <Text c="dimmed" size="0.75rem" fw={600} w={20} ta="right" style={{ flexShrink: 0 }}>{i + 1}</Text>
              <Box miw={0} style={{ flex: 1 }}>
                <Text size="0.82rem" fw={500} truncate>{e.name}</Text>
                <Text c="dimmed" size="0.68rem" truncate>
                  {e.role === 'representante' ? 'Representante' : `Preposto de ${e.parentRep}`}
                </Text>
              </Box>
              <Text size="0.82rem" fw={700} className="mono" style={{ flexShrink: 0 }}>{brl(e.value)}</Text>
            </Group>
          ))}
          {ranked.length === 0 && (
            <Text c="dimmed" ta="center" py="lg" size="0.8rem">Nenhum vendedor no período</Text>
          )}
        </Stack>
      </Paper>

      {/* E: 5 clientes prioritários */}
      <Paper withBorder radius="lg" p="lg">
        <Group justify="space-between" gap="xs" mb="xs">
          <CardTitle title="Prioridade de contato" />
          <SeeMoreButton onClick={onNavigateClients} />
        </Group>
        <Stack gap={2}>
          {priorityClients.map(c => (
            <NavLink
              key={c.id}
              component="button"
              onClick={() => onOpenClient(c)}
              label={<Text size="0.82rem" fw={600} truncate>{c.name}</Text>}
              description={<Text c="dimmed" size="0.72rem" truncate>{c.reason}</Text>}
              rightSection={<CaretRightIcon className="w-4 h-4" style={{ color: 'var(--mantine-color-dimmed)' }} />}
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          ))}
          {priorityClients.length === 0 && (
            <Text c="dimmed" ta="center" py="lg" size="0.8rem">Nenhum cliente na carteira</Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

function KpiCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <Paper withBorder radius="lg" p="md">
      <Text size="0.66rem" fw={700} tt="uppercase" style={{ letterSpacing: '0.05em' }}>{label}</Text>
      <Text size="1.6rem" fw={700} mt={4} className="mono">{value}</Text>
      <Text c="teal.7" size="0.72rem" fw={600} mt={4}>{delta}</Text>
    </Paper>
  );
}

function CardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box>
      <Title order={4} size="0.85rem" fw={600}>{title}</Title>
      {subtitle && <Text c="dimmed" size="0.72rem" mt={2}>{subtitle}</Text>}
    </Box>
  );
}

function SeeMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="subtle" size="compact-sm" onClick={onClick} rightSection={<CaretRightIcon className="w-3 h-3" />}>
      Ver mais
    </Button>
  );
}
