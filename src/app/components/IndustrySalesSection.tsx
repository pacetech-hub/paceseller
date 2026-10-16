import { useMemo, useState } from "react";
import {
  Box, ColorSwatch, Grid, Group, NavLink, Progress, ScrollArea, SegmentedControl, Stack, Text, ThemeIcon, Tooltip,
} from "@mantine/core";
import { LineChart, Sparkline } from "@mantine/charts";
import {
  AddressBookIcon, CaretRightIcon, ChartLineUpIcon, CurrencyCircleDollarIcon, ListChecksIcon, ShoppingBagIcon,
  TrophyIcon, type Icon,
} from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { barDomain } from "../lib/charts";
import { ChartSkeleton, KpiSkeleton } from "./ui/Skeletons";
import { ThemeHeader } from "./ui/ThemeHeader";
import { DeltaBadge, Widget, WidgetLink } from "./ui/Widget";
import {
  PERIOD_OPTIONS, STATUS_CONFIG, brl, buildPriorityClients, buildSeries, formatAxisValue,
  getNetworkEntities, getNetworkMonthlyTotal, scaleValue, type Period,
} from "./SalesIndicatorsSection";
import { clients as allClients } from "../data/mockData";
import type { CtaTarget } from "../data/radar";

const int = (n: number) => n.toLocaleString('pt-BR');
/** Ticket médio da rede (mesmo do Indicadores). */
const TICKET = 4030;
// Mesmas cores do Indicadores: período atual em neutro escuro, ano anterior em amarelo
const CURRENT_COLOR = 'neutral.9';
const PREVIOUS_COLOR = 'yellow.6';
const TOP_SELLERS = 5;

const deltaPct = (now: number, before: number) =>
  before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null;

function KpiWidget({ icon, label, value, delta, before, spark }: {
  icon: Icon; label: string; value: string; delta: number | null; before: string; spark: number[];
}) {
  return (
    <Widget icon={icon} title={label}>
      <Box>
        <Text fw={700} lh={1.1} style={{ fontSize: 'clamp(22px, 5vw, 30px)', whiteSpace: 'nowrap' }}>{value}</Text>
        <Group gap={6} mt={8} wrap="wrap">
          <DeltaBadge value={delta} />
          <Text size="xs" c="dimmed">vs. {before}</Text>
        </Group>
      </Box>
      {spark.length > 1 && (
        <Box mt="auto">
          <Sparkline h={44} data={spark} curveType="monotone" color={CURRENT_COLOR} fillOpacity={0.12} strokeWidth={2} aria-hidden />
        </Box>
      )}
    </Widget>
  );
}

// Radar da indústria, em widgets: o mesmo conteúdo do Indicadores (pedidos, faturamento,
// vendas vs. ano anterior, pedidos por status, vendedores e prioridade de contato).
export function IndustrySalesSection({ onCta }: { onCta: (target: CtaTarget) => void }) {
  const [period, setPeriod] = useState<Period>('mes');
  const loading = useMockLoading();

  const data = useMemo(() => {
    const monthly = getNetworkMonthlyTotal();
    const series = buildSeries(monthly, period);
    const value = scaleValue(monthly, period);
    const valueBefore = series.reduce((a, p) => a + p.lastYear, 0) / Math.max(1, series.reduce((a, p) => a + p.current, 0)) * value;
    const orders = Math.max(1, Math.round(value / TICKET));
    const ordersBefore = Math.max(1, Math.round(valueBefore / TICKET));
    const statusRows = STATUS_CONFIG.map(s => ({ ...s, count: Math.max(0, Math.round(orders * s.ratio)) }));
    const sellers = getNetworkEntities()
      .map(e => ({ ...e, value: scaleValue(e.monthlySales, period) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, TOP_SELLERS);
    return { series, value, valueBefore, orders, ordersBefore, statusRows, sellers };
  }, [period]);

  const priorityClients = useMemo(() => buildPriorityClients(allClients), []);
  const statusTotal = Math.max(1, data.statusRows.reduce((a, b) => a + b.count, 0));
  const year = new Date().getFullYear();
  // acumulado ponto a ponto (como no Radar do rep), para a linha subir de forma legível; no "Dia", valor por dia
  let acc = 0;
  const spark = data.series.map(p => (period === 'dia' ? p.current : (acc += p.current)));
  const periodLabel = PERIOD_OPTIONS.find(o => o.id === period)?.label.toLowerCase();

  return (
    <Stack gap="md">
      <ThemeHeader
        icon={ChartLineUpIcon}
        title="Vendas da rede"
        description="Pedidos, faturamento e vendedores, comparados com o mesmo período do ano anterior"
        action={
          <ScrollArea type="never" maw="100%">
            <SegmentedControl
              value={period}
              onChange={v => setPeriod(v as Period)}
              data={PERIOD_OPTIONS.map(o => ({ value: o.id, label: o.label }))}
              aria-label="Período"
            />
          </ScrollArea>
        }
      />

      {loading ? (
        <Stack gap="md">
          <KpiSkeleton count={3} cols={{ base: 1, sm: 3 }} />
          <ChartSkeleton height={300} />
          <KpiSkeleton count={2} cols={{ base: 1, md: 2 }} />
        </Stack>
      ) : (
        <Grid gutter="md">
          {/* Linha 1: indicadores e pedidos por status */}
          <Grid.Col span={{ base: 12, xs: 6, md: 4 }}>
            <KpiWidget
              icon={ShoppingBagIcon}
              label="Pedidos no período"
              value={int(data.orders)}
              delta={deltaPct(data.orders, data.ordersBefore)}
              before={int(data.ordersBefore)}
              spark={spark.map(v => Math.round(v / TICKET))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, xs: 6, md: 4 }}>
            <KpiWidget
              icon={CurrencyCircleDollarIcon}
              label="Faturamento"
              value={brl(data.value)}
              delta={deltaPct(data.value, data.valueBefore)}
              before={brl(data.valueBefore)}
              spark={spark}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Widget
              icon={ListChecksIcon}
              title="Pedidos por status"
              subtitle={`${int(data.orders)} pedidos no ${periodLabel === 'dia' ? 'dia' : 'período'}`}
              footer={<WidgetLink label="Ver pedidos" onClick={() => onCta({ kind: 'orders' })} />}
            >
              {/* parte do todo: barra 100% empilhada; a lista abaixo é a legenda com valores */}
              <Progress.Root size={10}>
                {data.statusRows.map(s => (
                  <Tooltip key={s.key} label={`${s.label}: ${int(s.count)} pedidos`}>
                    <Progress.Section value={(s.count / statusTotal) * 100} color={s.color} />
                  </Tooltip>
                ))}
              </Progress.Root>
              <Stack gap={0}>
                {data.statusRows.map(s => (
                  <NavLink
                    key={s.key}
                    component="button"
                    py={4}
                    onClick={() => onCta({ kind: 'orders', status: s.orderStatus })}
                    label={<Text size="sm">{s.label}</Text>}
                    leftSection={<ColorSwatch color={`var(--mantine-color-${s.color.replace('.', '-')})`} size={10} withShadow={false} />}
                    rightSection={<Text size="sm" fw={700} className="mono">{int(s.count)}</Text>}
                    styles={{ root: { borderRadius: 'var(--mantine-radius-md)' } }}
                  />
                ))}
              </Stack>
            </Widget>
          </Grid.Col>

          {/* Linha 2: vendas ano a ano, as duas séries em linha */}
          <Grid.Col span={12}>
            <Widget icon={ChartLineUpIcon} title="Vendas vs. ano anterior" subtitle={`Linha contínua: ${year} · tracejada: mesmo intervalo de ${year - 1} · em R$`}>
              <LineChart
                h={300}
                data={data.series}
                dataKey="label"
                series={[
                  { name: 'current', label: String(year), color: CURRENT_COLOR },
                  // tracejado: o ano anterior se distingue também sem a cor
                  { name: 'lastYear', label: String(year - 1), color: PREVIOUS_COLOR, strokeDasharray: '6 4' },
                ]}
                curveType="linear"
                gridAxis="y"
                tickLine="none"
                strokeWidth={2}
                withLegend
                legendProps={{ verticalAlign: 'bottom' }}
                valueFormatter={brl}
                yAxisProps={{ tickFormatter: formatAxisValue, domain: barDomain, width: 56 }}
                dotProps={{ r: 3, strokeWidth: 2 }}
                activeDotProps={{ r: 5, strokeWidth: 2 }}
              />
            </Widget>
          </Grid.Col>

          {/* Linha 3: vendedores e prioridade de contato */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Widget
              icon={TrophyIcon}
              title={`Top ${TOP_SELLERS} vendedores`}
              subtitle="Representantes e prepostos · maior venda primeiro"
              footer={<WidgetLink label="Ver vendedores" onClick={() => onCta({ kind: 'sales-team' })} />}
            >
              <Stack gap="sm">
                {data.sellers.map((x, i) => (
                  <Group key={x.id} justify="space-between" wrap="nowrap" gap="sm">
                    <Group gap="sm" wrap="nowrap" miw={0}>
                      <ThemeIcon size={26} radius="xl" variant={i === 0 ? 'filled' : 'light'} color="neutral" aria-label={`${i + 1}º lugar`}>
                        <Text size="xs" fw={700} c="inherit">{i + 1}º</Text>
                      </ThemeIcon>
                      <Box miw={0}>
                        <Text size="sm" fw={600} truncate>{x.name}</Text>
                        <Text size="xs" c="dimmed" truncate>
                          {x.role === 'representante' ? 'Representante' : `Preposto de ${x.parentRep}`}
                        </Text>
                      </Box>
                    </Group>
                    <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap' }}>{brl(x.value)}</Text>
                  </Group>
                ))}
              </Stack>
            </Widget>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Widget
              icon={AddressBookIcon}
              title="Prioridade de contato"
              subtitle="Mais dias sem pedido primeiro"
              footer={<WidgetLink label="Ver clientes" onClick={() => onCta({ kind: 'clients' })} />}
            >
              <Stack gap={0}>
                {priorityClients.map(c => (
                  <NavLink
                    key={c.id}
                    component="button"
                    py={6}
                    onClick={() => onCta({ kind: 'client', clientId: c.id })}
                    label={<Text size="sm" fw={600} truncate>{c.name}</Text>}
                    description={<Text size="xs" c="dimmed" truncate>{c.reason}</Text>}
                    rightSection={<CaretRightIcon size={16} color="var(--mantine-color-dimmed)" />}
                    styles={{ root: { borderRadius: 'var(--mantine-radius-md)' } }}
                  />
                ))}
              </Stack>
            </Widget>
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
