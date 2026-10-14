import { useMemo, useState, type ReactNode } from "react";
import {
  Badge, Box, Button, Grid, Group, Paper, ScrollArea, SegmentedControl, SimpleGrid, Stack, Text, ThemeIcon, Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { CompositeChart, Sparkline } from "@mantine/charts";
import {
  ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, ChartBarIcon, ChartLineUpIcon, ClockCounterClockwiseIcon, CurrencyCircleDollarIcon,
  FootprintsIcon, MinusIcon, ReceiptIcon, ShoppingBagIcon, TrophyIcon, type Icon,
} from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { barDomain } from "../lib/charts";
import interactive from "./interactive.module.css";
import { ChartSkeleton, KpiSkeleton, ListSkeleton } from "./ui/Skeletons";
import { ThemeHeader } from "./ui/ThemeHeader";
import { OrderStatusBadge, statusIcon } from "./OrderHistory";
import { formatCurrency, type Order } from "../data/mockData";
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

function WidgetLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="transparent" color="neutral" px={0} fw={600} rightSection={<ArrowRightIcon size={18} />} onClick={onClick}>
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
// ano a ano, pedidos por status, ranking dos vendedores e pedidos recentes — sempre comparados
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
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, lg: 8 }}><ChartSkeleton height={240} /></Grid.Col>
            <Grid.Col span={{ base: 12, lg: 4 }}><ListSkeleton rows={5} withAvatar={false} /></Grid.Col>
          </Grid>
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

          {/* Linha 2: vendas ano a ano + pedidos em andamento e top 3 */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Widget icon={ChartBarIcon} title="Vendas vs. ano anterior" subtitle={`Colunas: ${year} · linha: mesmo intervalo de ${year - 1} · ${s.seriesUnit}`}>
              <CompositeChart
                h={380}
                data={chartData}
                dataKey="label"
                series={[
                  { name: 'current', label: String(year), color: CURRENT_COLOR, type: 'bar' },
                  { name: 'previous', label: String(year - 1), color: PREVIOUS_COLOR, type: 'line' },
                ]}
                // reta entre pontos: curva suave passaria abaixo de zero entre dias sem venda
                curveType="linear"
                gridAxis="y"
                tickLine="none"
                withLegend
                legendProps={{ verticalAlign: 'bottom' }}
                valueFormatter={reais}
                // tem colunas: o eixo começa em zero (barras cortadas enganam)
                yAxisProps={{ tickFormatter: axis, domain: barDomain, width: 56 }}
                barProps={{ radius: [4, 4, 0, 0] }}
                maxBarWidth={32}
              />
            </Widget>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="md" h="100%">
              {/* Pedidos: só os que ainda pedem ação — em análise e aprovados — com a quantidade */}
              <Widget
                icon={ShoppingBagIcon}
                title="Pedidos em andamento"
                subtitle="Em análise e aprovados no período"
                footer={<WidgetLink label="Ver todos os pedidos" onClick={() => onCta({ kind: 'orders' })} />}
              >
                <SimpleGrid cols={2} spacing="sm">
                  {OPEN_STATUSES.map(st => {
                    const row = s.statusCounts.find(x => x.status === st);
                    const count = row?.count ?? 0;
                    const StIcon = statusIcon[st];
                    return (
                      <UnstyledButton
                        key={st}
                        disabled={count === 0}
                        onClick={() => onCta({ kind: 'orders', status: st })}
                        aria-label={`${count} ${count === 1 ? 'pedido' : 'pedidos'} ${st}, ver em Pedidos`}
                      >
                        <Paper withBorder p="sm" radius="md" className={count > 0 ? interactive.hoverable : undefined}>
                          <Group gap={6} wrap="nowrap" c={st === 'em análise' ? 'yellow.8' : 'dimmed'}>
                            <StIcon size={16} aria-hidden />
                            <Text size="sm" c="inherit" fw={600}>{cap(st)}</Text>
                          </Group>
                          <Text fz={32} fw={700} lh={1.1} mt={4}>{int(count)}</Text>
                          <Text size="xs" c="dimmed">{count === 1 ? 'pedido' : 'pedidos'}</Text>
                        </Paper>
                      </UnstyledButton>
                    );
                  })}
                </SimpleGrid>
              </Widget>

              {/* Os 3 que mais venderam no período: leitura rápida, só nome e valor */}
              <Widget
                icon={TrophyIcon}
                title="Top 3 vendedores"
                subtitle="Quem mais vendeu no período"
                footer={<WidgetLink label="Ver vendedores" onClick={() => onCta({ kind: 'sales-team' })} />}
              >
                <Stack gap="xs">
                  {s.sellers.slice(0, 3).map((x, i) => (
                    <Group key={x.id} justify="space-between" wrap="nowrap" gap="sm">
                      <Group gap="sm" wrap="nowrap" miw={0}>
                        <ThemeIcon size={28} radius="xl" variant={i === 0 ? 'filled' : 'light'} color="neutral" aria-label={`${i + 1}º lugar`}>
                          <Text size="xs" fw={700} c="inherit">{i + 1}º</Text>
                        </ThemeIcon>
                        <Text size="sm" fw={600} truncate>{x.name}{x.name === repName ? ' (você)' : ''}</Text>
                      </Group>
                      <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap' }}>{reais(x.value)}</Text>
                    </Group>
                  ))}
                </Stack>
              </Widget>
            </Stack>
          </Grid.Col>

          {/* Linha 3: pedidos recentes em andamento */}
          <Grid.Col span={12}>
            <Widget
              icon={ClockCounterClockwiseIcon}
              title="Pedidos recentes"
              subtitle="Em análise e aprovados · mais novos primeiro"
              footer={<WidgetLink label="Ver todos os pedidos" onClick={() => onCta({ kind: 'orders' })} />}
            >
              <Stack gap="sm">
                {s.recent.length === 0 && <Text size="sm" c="dimmed">Nenhum pedido em análise ou aprovado neste período.</Text>}
                {s.recent.map(o => (
                  <Group key={o.id} justify="space-between" wrap="nowrap" gap="sm">
                    <Box miw={0}>
                      <Text size="sm" fw={600} truncate>{o.clientName}</Text>
                      <Text size="xs" c="dimmed" ff="monospace" truncate>
                        {o.id} · {o.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {s.sellers.find(x => x.id === o.sellerId)?.name.split(' ')[0]}
                      </Text>
                    </Box>
                    <Group gap="sm" wrap="nowrap">
                      <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>{formatCurrency(o.value)}</Text>
                      <Box visibleFrom="sm"><OrderStatusBadge status={o.status} /></Box>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Widget>
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
