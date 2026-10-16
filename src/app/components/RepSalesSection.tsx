import { useMemo, useState } from "react";
import { Box, Grid, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  ChartLineUpIcon, CurrencyCircleDollarIcon, FootprintsIcon, ReceiptIcon, ShoppingBagIcon, TrophyIcon,
} from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { ChartSkeleton, KpiSkeleton } from "./ui/Skeletons";
import { ThemeHeader } from "./ui/ThemeHeader";
import { Widget, WidgetLink } from "./ui/Widget";
import { KpiWidget, PeriodCaption, PeriodControl, SalesTrendWidget, int, reais } from "./SalesWidgets";
import { statusIcon } from "./OrderHistory";
import type { Order } from "../data/mockData";
import { getSalesSummary, type SalesPeriod } from "../data/repSales";
import type { CtaTarget } from "../data/radar";

/** Os únicos status mostrados no Radar: pedidos que ainda estão andando. */
const OPEN_STATUSES: Order['status'][] = ['em análise', 'aprovado'];

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

  return (
    <Stack gap="md">
      <ThemeHeader
        icon={ChartLineUpIcon}
        title="Vendas no período"
        description="Suas vendas e as do seu time, comparadas com o mesmo período do ano anterior"
        action={<PeriodControl value={period} onChange={setPeriod} />}
      />
      <PeriodCaption summary={s} />

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
              <KpiWidget {...k} summary={s} />
            </Grid.Col>
          ))}

          {/* Linha 2: pedidos em andamento (um widget por status) e top 3 vendedores */}
          {OPEN_STATUSES.map(st => {
            const row = s.statusCounts.find(x => x.status === st);
            const count = row?.count ?? 0;
            return (
              <Grid.Col key={st} span={{ base: 12, xs: 6, md: 3 }}>
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
            <SalesTrendWidget summary={s} />
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
