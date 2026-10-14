import { useMemo, useState, type ReactNode } from "react";
import {
  Badge, Box, Button, Grid, Group, Paper, ScrollArea, SegmentedControl, Stack, Text, ThemeIcon, Tooltip,
} from "@mantine/core";
import { LineChart, Sparkline } from "@mantine/charts";
import {
  ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, ChartLineUpIcon, CurrencyCircleDollarIcon,
  FootprintsIcon, MinusIcon, ReceiptIcon, ShoppingBagIcon, TrophyIcon, type Icon,
} from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { barDomain } from "../lib/charts";
import { ChartSkeleton, KpiSkeleton } from "./ui/Skeletons";
import { ThemeHeader } from "./ui/ThemeHeader";
import { statusIcon } from "./OrderHistory";
import type { Order } from "../data/mockData";
import { SALES_PERIODS, deltaPct, getSalesSummary, type SalesPeriod, type SalesTotals, type SeriesPoint } from "../data/repSales";
import type { CtaTarget } from "../data/radar";

const int = (n: number) => n.toLocaleString('pt-BR');
/** Indicadores em reais inteiros (centavos só nas listas). */
const reais = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;
const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
// eixo em pt-BR: "1,2 mi", "45 mil"
const axis = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  : v >= 1e3 ? `${Math.round(v / 1e3).toLocaleString('pt-BR')} mil`
  : int(v);

// Mesmas cores do Indicadores: período atual em neutro escuro, ano anterior em amarelo
const CURRENT_COLOR = 'neutral.9';
const PREVIOUS_COLOR = 'yellow.6';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Os únicos status mostrados no Radar: pedidos que ainda estão andando. */
const OPEN_STATUSES: Order['status'][] = ['em análise', 'aprovado'];

// ---------------------------------------------------------------------------
// Widget: moldura comum (ícone em bloco + sobretítulo mono + ação), corpo e rodapé
// ---------------------------------------------------------------------------
function Widget({ icon: WidgetIcon, title, subtitle, action, footer, children }: {
  icon: Icon; title: string; subtitle?: string; action?: ReactNode; footer?: ReactNode; children: ReactNode;
}) {
  return (
    <Paper withBorder p="lg" h="100%">
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Group gap="sm" wrap="nowrap" miw={0}>
            <ThemeIcon size={32} radius="md" variant="light" color="neutral" aria-hidden>
              <WidgetIcon size={18} />
            </ThemeIcon>
            <Box miw={0}>
              {/* quebra em vez de cortar: no celular os indicadores ficam em duas colunas estreitas */}
              <Text size="xs" fw={700} tt="uppercase" ff="monospace" lts={0.5} lineClamp={2}>{title}</Text>
              {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
            </Box>
          </Group>
          {action}
        </Group>
        {children}
        {footer && <Box mt="auto">{footer}</Box>}
      </Stack>
    </Paper>
  );
}

function WidgetLink({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="transparent" color="neutral" px={0} fw={600} rightSection={<ArrowRightIcon size={18} />} onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}

/** Variação contra o ano anterior em pílula: ícone + texto (nunca só a cor). */
function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <Badge variant="light" color="gray" size="md">sem base</Badge>;
  const flat = value === 0;
  const up = value > 0;
  const DeltaIcon = flat ? MinusIcon : up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <Badge
      variant="light"
      color={flat ? 'gray' : up ? 'teal' : 'red'}
      size="md"
      leftSection={<DeltaIcon size={12} weight="bold" aria-hidden />}
      aria-label={`${pct(value)} sobre o ano anterior`}
    >
      {pct(value)}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Widgets de indicador: número, variação e acumulado no período (sparkline)
// ---------------------------------------------------------------------------
type Metric = 'value' | 'orders' | 'ticket' | 'pairs';

/**
 * Acumulado ponto a ponto (ticket = média acumulada), para a linha subir de forma legível.
 * No "Dia" a série são os últimos 7 dias: aí cada ponto é o valor do dia, não um acumulado.
 */
function sparkData(series: SeriesPoint[], metric: Metric, accumulate: boolean): number[] {
  if (!accumulate) return series.map(p => p.current[metric]);
  let value = 0, orders = 0, pairs = 0;
  return series.map(p => {
    value += p.current.value; orders += p.current.orders; pairs += p.current.pairs;
    if (metric === 'value') return value;
    if (metric === 'orders') return orders;
    if (metric === 'pairs') return pairs;
    return orders ? Math.round(value / orders) : 0;
  });
}

function KpiWidget({ icon, label, metric, format, current, previous, series, unit, accumulate }: {
  icon: Icon; label: string; metric: Metric; format: (n: number) => string;
  current: SalesTotals; previous: SalesTotals; series: SeriesPoint[]; unit: string; accumulate: boolean;
}) {
  const now = current[metric];
  const before = previous[metric];
  const data = sparkData(series, metric, accumulate);
  const hint = accumulate ? `${metric === 'ticket' ? 'Média acumulada' : 'Acumulado'} no período · ${unit}` : `Valor por dia · ${unit}`;
  return (
    <Widget icon={icon} title={label}>
      <Box>
        {/* encolhe no celular para o valor caber em duas colunas */}
        <Text fw={700} lh={1.1} style={{ fontSize: 'clamp(22px, 5vw, 30px)', whiteSpace: 'nowrap' }}>{format(now)}</Text>
        <Group gap={6} mt={8} wrap="wrap">
          <DeltaBadge value={deltaPct(now, before)} />
          <Text size="xs" c="dimmed">vs. {format(before)}</Text>
        </Group>
      </Box>
      {data.length > 1 && (
        <Tooltip label={hint} withArrow>
          <Box mt="auto">
            <Sparkline h={44} data={data} curveType="monotone" color={CURRENT_COLOR} fillOpacity={0.12} strokeWidth={2} aria-hidden />
          </Box>
        </Tooltip>
      )}
    </Widget>
  );
}

// ---------------------------------------------------------------------------
// Seção
// ---------------------------------------------------------------------------
// Seção complementar do Radar do representante, em widgets: indicadores do período, vendas
// ano a ano em linha, pedidos em análise e aprovados e top 3 vendedores — sempre comparados
// com o mesmo período do ano anterior.
export function RepSalesSection({ repName, onCta }: { repName: string; onCta: (target: CtaTarget) => void }) {
  const [period, setPeriod] = useState<SalesPeriod>('mes');
  const loading = useMockLoading();
  const s = useMemo(() => getSalesSummary(repName, period), [repName, period]);
  const chartData = s.series.map(p => ({ label: p.label, current: p.current.value, previous: p.previous.value }));
  const prevYear = s.previousLabel;
  // legenda do gráfico pelos anos: no "Dia" o gráfico mostra os últimos 7 dias, não só a data
  const year = new Date().getFullYear();

  return (
    <Stack gap="md">
      <ThemeHeader
        icon={ChartLineUpIcon}
        title="Vendas no período"
        description="Suas vendas e as do seu time, comparadas com o mesmo período do ano anterior"
        action={
          <ScrollArea type="never" maw="100%">
            <SegmentedControl value={period} onChange={v => setPeriod(v as SalesPeriod)} data={SALES_PERIODS} aria-label="Período" />
          </ScrollArea>
        }
      />
      <Text size="sm" c="dimmed">
        <Text span fw={600} c="var(--mantine-color-text)">{cap(s.label)}</Text> · comparado com {prevYear}
      </Text>

      {loading ? (
        <Stack gap="md">
          <KpiSkeleton count={4} cols={{ base: 2, md: 4 }} />
          <KpiSkeleton count={3} cols={{ base: 2, md: 3 }} />
          <ChartSkeleton height={300} />
        </Stack>
      ) : (
        <Grid gutter="md">
          {/* Linha 1: indicadores */}
          {([
            { icon: CurrencyCircleDollarIcon, label: 'Vendas', metric: 'value', format: reais },
            { icon: ShoppingBagIcon, label: 'Pedidos', metric: 'orders', format: int },
            { icon: ReceiptIcon, label: 'Ticket médio', metric: 'ticket', format: reais },
            { icon: FootprintsIcon, label: 'Pares', metric: 'pairs', format: int },
          ] as const).map(k => (
            <Grid.Col key={k.metric} span={{ base: 6, md: 3 }}>
              <KpiWidget {...k} current={s.current} previous={s.previous} series={s.series} unit={s.seriesUnit} accumulate={period !== 'dia'} />
            </Grid.Col>
          ))}

          {/* Linha 2: pedidos em andamento (um widget por status) e top 3 vendedores */}
          {OPEN_STATUSES.map(st => {
            const row = s.statusCounts.find(x => x.status === st);
            const count = row?.count ?? 0;
            return (
              <Grid.Col key={st} span={{ base: 6, md: 3 }}>
                <Widget
                  icon={statusIcon[st]}
                  title={`Pedidos ${st === 'em análise' ? 'em análise' : 'aprovados'}`}
                  footer={
                    <WidgetLink
                      label="Ver pedidos"
                      onClick={() => onCta({ kind: 'orders', status: st })}
                      disabled={count === 0}
                    />
                  }
                >
                  <Box>
                    <Text fw={700} lh={1.1} c={st === 'em análise' && count > 0 ? 'yellow.8' : undefined} style={{ fontSize: 'clamp(22px, 5vw, 30px)' }}>
                      {int(count)}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {count === 1 ? 'pedido' : 'pedidos'} · {reais(row?.value ?? 0)}
                    </Text>
                  </Box>
                </Widget>
              </Grid.Col>
            );
          })}

          <Grid.Col span={{ base: 12, md: 6 }}>
            {/* Os 3 que mais venderam no período: leitura rápida, só nome e valor */}
            <Widget
              icon={TrophyIcon}
              title="Top 3 vendedores"
              footer={<WidgetLink label="Ver vendedores" onClick={() => onCta({ kind: 'sales-team' })} />}
            >
              <Stack gap="xs">
                {s.sellers.slice(0, 3).map((x, i) => (
                  <Group key={x.id} justify="space-between" wrap="nowrap" gap="sm">
                    <Group gap="sm" wrap="nowrap" miw={0}>
                      <ThemeIcon size={26} radius="xl" variant={i === 0 ? 'filled' : 'light'} color="neutral" aria-label={`${i + 1}º lugar`}>
                        <Text size="xs" fw={700} c="inherit">{i + 1}º</Text>
                      </ThemeIcon>
                      <Text size="sm" fw={600} truncate>{x.name}{x.name === repName ? ' (você)' : ''}</Text>
                    </Group>
                    <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap' }}>{reais(x.value)}</Text>
                  </Group>
                ))}
              </Stack>
            </Widget>
          </Grid.Col>

          {/* Linha 3: vendas ano a ano, as duas séries em linha */}
          <Grid.Col span={12}>
            <Widget icon={ChartLineUpIcon} title="Vendas vs. ano anterior" subtitle={`Linha contínua: ${year} · tracejada: mesmo intervalo de ${year - 1} · ${s.seriesUnit}`}>
              <LineChart
                h={300}
                data={chartData}
                dataKey="label"
                series={[
                  { name: 'current', label: String(year), color: CURRENT_COLOR },
                  // tracejado: o ano anterior se distingue também sem a cor
                  { name: 'previous', label: String(year - 1), color: PREVIOUS_COLOR, strokeDasharray: '6 4' },
                ]}
                // reta entre pontos: curva suave passaria abaixo de zero entre dias sem venda
                curveType="linear"
                gridAxis="y"
                tickLine="none"
                strokeWidth={2}
                withLegend
                legendProps={{ verticalAlign: 'bottom' }}
                valueFormatter={reais}
                // séries com dias sem venda: o eixo começa em zero
                yAxisProps={{ tickFormatter: axis, domain: barDomain, width: 56 }}
                dotProps={{ r: 3, strokeWidth: 2 }}
                activeDotProps={{ r: 5, strokeWidth: 2 }}
              />
            </Widget>
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
