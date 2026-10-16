import { useMemo, useState } from "react";
import { Box, ColorSwatch, Grid, Group, NavLink, Progress, Stack, Text, ThemeIcon, Tooltip } from "@mantine/core";
import {
  AddressBookIcon, CaretRightIcon, ChartLineUpIcon, CurrencyCircleDollarIcon, FootprintsIcon, ListChecksIcon,
  ReceiptIcon, ShoppingBagIcon, TrophyIcon,
} from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { ChartSkeleton, KpiSkeleton } from "./ui/Skeletons";
import { ThemeHeader } from "./ui/ThemeHeader";
import { Widget, WidgetLink } from "./ui/Widget";
import { KpiWidget, PeriodCaption, PeriodControl, SalesTrendWidget, int, reais } from "./SalesWidgets";
import { STATUS_CONFIG, buildPriorityClients } from "./SalesIndicatorsSection";
import { clients as allClients } from "../data/mockData";
import { getScopeSummary, type SalesPeriod } from "../data/repSales";
import type { CtaTarget } from "../data/radar";

const TOP_SELLERS = 5;

// Radar da indústria, em widgets: o mesmo conteúdo do Indicadores (pedidos, faturamento,
// vendas vs. ano anterior, pedidos por status, vendedores e prioridade de contato), com o
// mesmo filtro de período dos outros Radars.
export function IndustrySalesSection({ onCta }: { onCta: (target: CtaTarget) => void }) {
  const [period, setPeriod] = useState<SalesPeriod>('mes');
  const loading = useMockLoading();
  const s = useMemo(() => getScopeSummary({ kind: 'network' }, period), [period]);
  const priorityClients = useMemo(() => buildPriorityClients(allClients), []);

  const statusRows = STATUS_CONFIG.map(c => ({ ...c, count: s.statusCounts.find(x => x.status === c.orderStatus)?.count ?? 0 }));
  const statusTotal = statusRows.reduce((a, b) => a + b.count, 0);
  const sellers = s.sellers.slice(0, TOP_SELLERS);

  return (
    <Stack gap="md">
      <ThemeHeader
        icon={ChartLineUpIcon}
        title="Vendas da rede"
        description="Pedidos, faturamento e vendedores, comparados com o mesmo período do ano anterior"
        action={<PeriodControl value={period} onChange={setPeriod} />}
      />
      <PeriodCaption summary={s} />

      {loading ? (
        <Stack gap="md">
          <KpiSkeleton count={4} cols={{ base: 2, md: 4 }} />
          <ChartSkeleton height={300} />
          <KpiSkeleton count={3} cols={{ base: 1, md: 3 }} />
        </Stack>
      ) : (
        <Grid gutter="md">
          {/* Linha 1: indicadores */}
          {([
            { icon: CurrencyCircleDollarIcon, label: 'Faturamento', metric: 'value', format: reais },
            { icon: ShoppingBagIcon, label: 'Pedidos', metric: 'orders', format: int },
            { icon: ReceiptIcon, label: 'Ticket médio', metric: 'ticket', format: reais },
            { icon: FootprintsIcon, label: 'Pares', metric: 'pairs', format: int },
          ] as const).map(k => (
            <Grid.Col key={k.metric} span={{ base: 6, md: 3 }}>
              <KpiWidget {...k} summary={s} />
            </Grid.Col>
          ))}

          {/* Linha 2: vendas ano a ano */}
          <Grid.Col span={12}>
            <SalesTrendWidget summary={s} />
          </Grid.Col>

          {/* Linha 3: pedidos por status, vendedores e prioridade de contato */}
          <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
            <Widget
              icon={ListChecksIcon}
              title="Pedidos por status"
              subtitle={`${int(statusTotal)} ${statusTotal === 1 ? 'pedido' : 'pedidos'} no período`}
              footer={<WidgetLink label="Ver pedidos" onClick={() => onCta({ kind: 'orders' })} />}
            >
              {/* parte do todo: barra 100% empilhada; a lista abaixo é a legenda com valores */}
              <Progress.Root size={10}>
                {statusRows.map(r => (
                  <Tooltip key={r.key} label={`${r.label}: ${int(r.count)} ${r.count === 1 ? 'pedido' : 'pedidos'}`}>
                    <Progress.Section value={statusTotal ? (r.count / statusTotal) * 100 : 0} color={r.color} />
                  </Tooltip>
                ))}
              </Progress.Root>
              <Stack gap={0}>
                {statusRows.map(r => (
                  <NavLink
                    key={r.key}
                    component="button"
                    py={4}
                    onClick={() => onCta({ kind: 'orders', status: r.orderStatus })}
                    label={<Text size="sm">{r.label}</Text>}
                    leftSection={<ColorSwatch color={`var(--mantine-color-${r.color.replace('.', '-')})`} size={10} withShadow={false} />}
                    rightSection={<Text size="sm" fw={700} className="mono">{int(r.count)}</Text>}
                    styles={{ root: { borderRadius: 'var(--mantine-radius-md)' } }}
                  />
                ))}
              </Stack>
            </Widget>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
            <Widget
              icon={TrophyIcon}
              title={`Top ${TOP_SELLERS} vendedores`}
              subtitle="Representantes e prepostos · maior venda primeiro"
              footer={<WidgetLink label="Ver vendedores" onClick={() => onCta({ kind: 'sales-team' })} />}
            >
              <Stack gap="sm">
                {sellers.map((x, i) => (
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
                    <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap' }}>{reais(x.value)}</Text>
                  </Group>
                ))}
              </Stack>
            </Widget>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
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
