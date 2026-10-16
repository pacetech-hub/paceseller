import { Box, Group, ScrollArea, SegmentedControl, Text, Tooltip } from "@mantine/core";
import { LineChart, Sparkline } from "@mantine/charts";
import { ChartLineUpIcon, type Icon } from "@phosphor-icons/react";
import { barDomain } from "../lib/charts";
import { DeltaBadge, Widget } from "./ui/Widget";
import { SALES_PERIODS, deltaPct, type SalesPeriod, type SalesSummary, type SeriesPoint } from "../data/repSales";

// Peças comuns das seções de vendas do Radar (indústria, representante e lojista):
// filtro de período, indicador com variação e sparkline, e gráfico ano a ano.

export const int = (n: number) => n.toLocaleString('pt-BR');
/** Indicadores em reais inteiros (centavos só nas listas). */
export const reais = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;
// eixo em pt-BR: "1,2 mi", "45 mil"
const axis = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  : v >= 1e3 ? `${Math.round(v / 1e3).toLocaleString('pt-BR')} mil`
  : int(v);

// Mesmas cores do Indicadores: período atual em neutro escuro, ano anterior em amarelo
const CURRENT_COLOR = 'neutral.9';
const PREVIOUS_COLOR = 'yellow.6';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Filtro de período de todos os Radars: Dia, Semana, Mês, Trimestre e Ano. */
export function PeriodControl({ value, onChange }: { value: SalesPeriod; onChange: (p: SalesPeriod) => void }) {
  return (
    <ScrollArea type="never" maw="100%">
      <SegmentedControl value={value} onChange={v => onChange(v as SalesPeriod)} data={SALES_PERIODS} aria-label="Período" />
    </ScrollArea>
  );
}

/** "Outubro de 2026 · comparado com outubro de 2025" */
export function PeriodCaption({ summary }: { summary: SalesSummary }) {
  return (
    <Text size="sm" c="dimmed">
      <Text span fw={600} c="var(--mantine-color-text)">{cap(summary.label)}</Text> · comparado com {summary.previousLabel}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Widgets de indicador: número, variação e acumulado no período (sparkline)
// ---------------------------------------------------------------------------
export type Metric = 'value' | 'orders' | 'ticket' | 'pairs';

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

export function KpiWidget({ icon, label, metric, format, summary }: {
  icon: Icon; label: string; metric: Metric; format: (n: number) => string; summary: SalesSummary;
}) {
  const now = summary.current[metric];
  const before = summary.previous[metric];
  const accumulate = summary.period !== 'dia';
  const data = sparkData(summary.series, metric, accumulate);
  const hint = accumulate
    ? `${metric === 'ticket' ? 'Média acumulada' : 'Acumulado'} no período · ${summary.seriesUnit}`
    : `Valor por dia · ${summary.seriesUnit}`;
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
// Vendas ano a ano, as duas séries em linha
// ---------------------------------------------------------------------------
export function SalesTrendWidget({ summary, title = 'Vendas vs. ano anterior' }: { summary: SalesSummary; title?: string }) {
  const chartData = summary.series.map(p => ({ label: p.label, current: p.current.value, previous: p.previous.value }));
  // legenda do gráfico pelos anos: no "Dia" o gráfico mostra os últimos 7 dias, não só a data
  const year = new Date().getFullYear();
  return (
    <Widget icon={ChartLineUpIcon} title={title} subtitle={`Linha contínua: ${year} · tracejada: mesmo intervalo de ${year - 1} · ${summary.seriesUnit}`}>
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
  );
}
